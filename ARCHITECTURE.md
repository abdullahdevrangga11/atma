# ATMA — Architecture

## Overview

ATMA is a Treasury Orchestration Protocol that composes 3 AI agents under verifiable on-chain policy to allocate idle stablecoins across the Mantle RWA stack. The system has 4 layers:

1. **Frontend** (Next.js 16) — user deposits/withdraws, views allocation + reports
2. **Agent Orchestrator** (TypeScript) — 3 specialized agents reason about allocation + risk + reporting
3. **Smart Contract** (Solidity / Foundry) — AtmaVault holds funds, enforces state machine, emits ERC-8004 attestations
4. **Mantle Chain** (Sepolia testnet + Mainnet ERC-8004 registry) — settlement + reputation

## Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          USER (DAO / Startup)                    │
│                                                                  │
│              Privy embedded wallet (email login)                 │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Vercel)                          │
│  Next.js 16 + React 19 + Tailwind v4 + Lenis + GSAP              │
│                                                                  │
│  Landing  │  Vault  │  Reports  │  Skills                        │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ HTTP /api/agent
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATOR                            │
│   TypeScript Node.js runtime + Anthropic Claude Sonnet 4.5       │
│                                                                  │
│   ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│   │ AllocatorAgent │  │   RiskAgent    │  │  ReporterAgent   │  │
│   │                │  │                │  │                  │  │
│   │ skills/mantle- │  │ skills/mantle- │  │ skills/treasury- │  │
│   │ rwa-allocation │  │ risk-monitoring│  │ reporting        │  │
│   │     .skill.md  │  │     .skill.md  │  │     .skill.md    │  │
│   └────────┬───────┘  └────────┬───────┘  └────────┬─────────┘  │
│            │                   │                   │            │
│            └───────────────────┼───────────────────┘            │
│                                ▼                                │
│                       Orchestrator.execute()                    │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ viem tx
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                       MANTLE SEPOLIA                             │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  AtmaVault.sol (ERC-4626 vault + state machine)          │   │
│   │                                                          │   │
│   │  • deposit(usdc)                                         │   │
│   │  • allocate(weights, attestation)                        │   │
│   │  • rebalance(newWeights, reasoning)                      │   │
│   │  • emergencyExit()                                       │   │
│   │  • withdraw(shares)                                      │   │
│   └────────────────┬──────────────────────────────────────────┘  │
│                    │                                             │
│                    ├──→ USDY (Ondo, 4.65% APY)                   │
│                    ├──→ mUSD (rebasing USDY)                     │
│                    ├──→ Aave V3 Mantle (boosted supply)          │
│                    └──→ MI4 (tokenized index)                    │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                  MANTLE MAINNET ERC-8004                         │
│                                                                  │
│   • IdentityRegistry — Allocator, Risk, Reporter agent NFTs      │
│   • ReputationRegistry — per-decision attestation events         │
│   • ValidationRegistry — judge-verifiable on-chain outcomes      │
└──────────────────────────────────────────────────────────────────┘
```

## Vault State Machine

The `AtmaVault` contract enforces a strict state machine. Every transition is gas-cheap (single SSTORE) and emits an event indexed by ERC-8004 agent ID.

```
                      ┌─────────┐
                      │  idle   │ ◀─────────────────┐
                      └────┬────┘                   │
                           │                        │
                  deposit()│                        │
                           ▼                        │
                      ┌─────────────┐               │
                      │ analyzing   │               │
                      └────┬────────┘               │
                           │                        │
                Allocator.propose()                 │
                           ▼                        │
                      ┌─────────────┐               │
                      │ proposing   │               │
                      └────┬────────┘               │
                           │                        │
                  user-signed                       │
                           ▼                        │
                      ┌─────────────────┐           │
                      │ executing       │           │
                      └────┬────────────┘           │
                           │                        │
                  on-chain tx confirmed             │
                           ▼                        │
                      ┌─────────────┐               │
                      │ attesting   │               │
                      └────┬────────┘               │
                           │                        │
                  ERC-8004 event emitted            │
                           ▼                        │
                      ┌─────────────┐               │
                      │ allocated   │ ─── rebalance trigger
                      └────┬────────┘               │
                           │                        │
            ┌──────────────┼──────────────┐         │
            ▼              ▼              ▼         │
        ┌────────┐   ┌──────────────┐  ┌─────────┐ │
        │rebalanc│   │risk_triggered│  │withdraw │ │
        │ ing    │   │ → defensive_ │  │ ing     │ │
        └────┬───┘   │   exit       │  └────┬────┘ │
             │       └────┬─────────┘       │      │
             │            │                 │      │
             └────────────┼─────────────────┴──────┘
                          │
                          ▼ (terminal)
                     ┌─────────┐
                     │completed│
                     └─────────┘
```

**8 states**: `idle`, `analyzing`, `proposing`, `executing`, `attesting`, `allocated`, `rebalancing`, `risk_triggered`, `withdrawing` + terminal `completed` / `defensive_exit`.

**Strict transition guard**: any unauthorized transition reverts with `InvalidStateTransition(from, to)`.

## Agent Composition

### Allocator Agent

**Input**: current vault state, target stable amount, user policy (max % per asset, min liquidity, risk tolerance).

**Reasoning**:
1. Read live APYs: USDY (Ondo oracle), mUSD (Mantle rebasing), Aave V3 USDC supply, MI4 NAV.
2. Apply user policy constraints (e.g., `max(USDY) <= 60%`).
3. Read skill file `mantle-rwa-allocation.skill.md` for decision tree.
4. Propose allocation vector `{USDY: 40%, mUSD: 20%, Aave: 30%, MI4: 10%}` with reasoning string.

**Output**: `AllocationProposal { weights, reasoning, expectedAPY, riskScore }`

### Risk Agent

**Input**: current allocation, market data (peg, drawdown, oracle deviation).

**Reasoning**:
1. Read live peg: USDY (vs USD), mUSD (vs USDY).
2. Compute drawdown vs entry NAV.
3. Read oracle deviation: Aave Mantle oracle vs Chainlink (or alternative).
4. Apply skill `mantle-risk-monitoring.skill.md` thresholds.
5. Emit risk signal `{level: "ok" | "warn" | "trigger", action: null | "alert" | "defensive_exit"}`.

**Output**: `RiskSignal`. If `trigger` → orchestrator triggers `emergencyExit()` on vault.

### Reporter Agent

**Input**: vault history (deposits, allocations, rebalances).

**Reasoning**:
1. Snapshot current NAV.
2. Compute P&L vs entry.
3. Compute "do nothing" baseline (USDC held idle = 0% APY).
4. Compute "naive Aave-only" baseline.
5. Read skill `treasury-reporting.skill.md` for methodology.
6. Generate weekly report with CSV export for compliance.

**Output**: `WeeklyReport { actualPnL, baselinePnL, outperformanceBps, csvUrl }`

## Smart Contract: AtmaVault.sol

### Storage Layout

```solidity
struct Vault {
  address owner;                      // DAO / startup multisig
  address policyOperator;             // ATMA orchestrator
  uint256 totalShares;                // ERC-4626 shares
  uint256 totalAssets;                // virtual USDC equivalent
  Allocation currentAllocation;       // active weights
  VaultState state;                   // state machine
  uint256 entryNAV;                   // for P&L
  uint256 lastRebalanceAt;            // gas-protected cadence
}

struct Allocation {
  uint16 usdyBps;     // 0-10000 (basis points)
  uint16 mUsdBps;
  uint16 aaveBps;
  uint16 mi4Bps;
}

enum VaultState {
  Idle, Analyzing, Proposing, Executing,
  Attesting, Allocated, Rebalancing,
  RiskTriggered, Withdrawing,
  Completed, DefensiveExit
}
```

### Key Functions

```solidity
function deposit(uint256 amount) external;
function propose(Allocation memory weights, bytes32 reasoningHash) external onlyOperator;
function executeAllocation() external onlyOwnerOrOperator;
function rebalance(Allocation memory newWeights, bytes32 reasoningHash) external onlyOperator;
function triggerDefensiveExit(bytes32 riskSignalHash) external onlyOperator;
function withdraw(uint256 shares) external;
function emergencyExit() external onlyOwner;
```

### Events (indexed by ERC-8004 agent ID)

```solidity
event AllocationProposed(uint256 indexed agentId, Allocation weights, bytes32 reasoningHash);
event AllocationExecuted(uint256 indexed agentId, Allocation weights);
event RebalanceTriggered(uint256 indexed agentId, Allocation oldW, Allocation newW);
event RiskTriggered(uint256 indexed agentId, bytes32 riskHash, RiskLevel level);
event DefensiveExit(uint256 indexed agentId, uint256 totalRecovered);
```

## Data Flow Per Decision

```
1. User deposits 1,000 USDC
   ↓
2. AllocatorAgent.propose()
   ├── Reads APYs from DefiLlama
   ├── Applies user policy
   ├── Reads skill file
   └── Outputs: weights + reasoning + reasoningHash
   ↓
3. Frontend shows proposal to user
   ↓
4. User signs proposal (Privy wallet)
   ↓
5. orchestrator.execute()
   ├── viem call to AtmaVault.executeAllocation()
   ├── Vault transitions: Proposing → Executing
   ├── Routes USDC to {USDY 40%, mUSD 20%, Aave 30%, MI4 10%}
   ├── Vault transitions: Executing → Attesting
   └── Emits ERC-8004 ReputationRegistry event
   ↓
6. Vault transitions: Attesting → Allocated
   ↓
7. RiskAgent monitors every 60s
   ↓
8. ReporterAgent snapshots weekly
```

## Skills-First Design (CrossBeam-inspired)

The agents' domain knowledge lives in **3 Skill markdown files**:

- `skills/mantle-rwa-allocation.skill.md` — decision tree across USDY/mUSD/Aave/MI4
- `skills/mantle-risk-monitoring.skill.md` — depeg signals + drawdown thresholds
- `skills/treasury-reporting.skill.md` — P&L methodology + benchmark logic

Each Skill file is read by its agent at runtime and injected into the LLM context. **Updating policy = updating the Skill file**, no code redeploy.

## Why Skills, Not Hardcoded Logic

1. **Auditable**: judges can read the decision tree in markdown.
2. **Updatable**: change allocation logic by editing markdown.
3. **Composable**: future ATMA users can fork + customize per their DAO policy.
4. **Honest**: avoids the "hardcoded script dressed as agent" anti-pattern that loses hackathons.

## Frontend Architecture

### Page Routes

- `/[locale]` — Landing (base.org-inspired). Hero + 3 feature cards + marquee + how-it-works + counters + footer
- `/[locale]/vault` — Active vault dashboard: deposit form + allocation viz (donut chart) + risk gauges
- `/[locale]/reports` — P&L vs baseline + ERC-8004 attestation feed + CSV export button
- `/[locale]/skills` — 3 skill files rendered as markdown for transparency

### Animation Layers

| Layer | Tech | Purpose |
|---|---|---|
| Smooth scroll | Lenis | Premium feel, base.org-tier |
| Scroll reveals | GSAP ScrollTrigger | Section fade-ins on viewport enter |
| Magnetic cursor | Custom GSAP | CTAs pull cursor on hover |
| Gradient orbs | CSS + Framer Motion | Background depth, follows scroll position |
| Number counters | Framer Motion useSpring | TVL / yield captured counters |
| Marquee | CSS keyframes | Sponsor logos infinite scroll |
| Preloader | Custom | 1.5s brand build on first load |
| Page transitions | Framer Motion AnimatePresence + block reveal | `/vault` ↔ `/reports` transitions |

## Security Model

- **Vault owner** = user's multisig / EOA. Only they can `withdraw`, `emergencyExit`.
- **Policy operator** = ATMA orchestrator address (rotatable). Only they can `propose`, `rebalance`, `triggerDefensiveExit`.
- **Defensive exit auto-triggered** if Risk Agent emits `trigger` level — converts all positions to USDC, transitions vault to terminal `DefensiveExit`.
- **No unbounded approvals** — vault uses `approve(spender, amount)` per-tx, not `approve(spender, MAX)`.
- **Reentrancy guards** on all external entrypoints.
- **State machine guard** on all transitions.

## Deployment Targets

| Network | Use | Status |
|---|---|---|
| Mantle Sepolia (5003) | Vault + agent operations | Day 1 |
| Mantle Mainnet (5000) | ERC-8004 registry only (read) | Day 1 |
| Vercel | Frontend | Day 2 |

Mainnet vault deployment = Phase 2 (post-hackathon).
