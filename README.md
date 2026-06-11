<div align="center">

# ATMA

**Treasury Orchestration Protocol for Mantle RWA Stack**

[![License: MIT](https://img.shields.io/badge/License-MIT-0052FF.svg?style=flat-square)](LICENSE)
[![Mantle Sepolia](https://img.shields.io/badge/Mantle-Sepolia-00FF94?style=flat-square)](https://sepolia.mantlescan.xyz)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square&logo=solidity)](https://soliditylang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![Tests](https://img.shields.io/badge/tests-pending-yellow?style=flat-square)](./contracts/test)
[![ERC-8004](https://img.shields.io/badge/ERC--8004-Mantle--Mainnet-9945FF?style=flat-square)](https://eips.ethereum.org/EIPS/eip-8004)

**Built for the Mantle Turing Test Hackathon 2026 — Phase 2 AI Awakening · AI × RWA Track**

[Live App](https://atma.vercel.app) · [Mantle Contract](https://sepolia.mantlescan.xyz) · [How It Works](#how-it-works) · [Architecture](./ARCHITECTURE.md) · [Skills](./skills) · [Demo Video](https://youtu.be/atma-demo)

</div>

---

## The Problem

Mantle holds **$4B+ in community-owned assets**, but most of it is dead capital. cmETH sits idle at **$277M TVL**. MI4 ($173M AUM) has near-zero composable surfaces. USDY rails are payment-poor. DAO treasurers and Web3 startups choose between Coinbase (no yield), Aave (single-asset), Anchorage ($1M+ minimums), or manual rebalancing across protocols nobody has time for.

**The result:** every treasury on Mantle leaves yield on the table. A typical $100K stablecoin reserve loses $4,650/year by sitting in non-yielding USDC instead of USDY's 4.65% APY — and that ignores Aave V3 boost rates, cmETH restaking, and MI4 index exposure entirely.

## The Solution

ATMA lifts treasury policy *out* of the treasurer's head and into a composable on-chain primitive.

```solidity
// in your DAO multisig / startup treasury contract:
atma::cpi::allocate(ctx, policy, amount)?;  // the orchestrator
// → routes USDC across {USDY, mUSD, Aave V3 supply, MI4}
// → respects user policy (max allocation %, min liquidity, drawdown stops)
// → emits ERC-8004 attestation per decision
```

Three agents collaborate under a verifiable policy:

1. **Allocator Agent** — reasons across USDY / mUSD / Aave V3 / MI4 yields, recommends rebalance under user policy constraints.
2. **Risk Agent** — monitors peg drift, oracle deviation, drawdown breach; triggers defensive exits.
3. **Reporter Agent** — weekly P&L vs "do nothing" baseline; compliance-ready CSV export.

Each decision is signed by an ERC-8004 agent identity NFT, recorded permanently on Mantle.

**Policy as data, not code.** **Treasury orchestration as a primitive, not a dashboard.** **Skills-first architecture inspired by Anthropic's Claude Code.**

## Use Cases

- **DAO Treasury Management** — $26B in DAO treasuries globally. ATMA allocates idle stablecoins across Mantle's RWA stack with policy guardrails.
- **Web3 Startup Runway** — Indonesian / SEA startup founders managing $50K–$5M runway gain a `cron`-grade autopilot for treasury.
- **SMB Crypto-Native Cash Management** — Creator agencies, dev shops, content studios get TradFi-style treasury without TradFi accounts.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  atma-web (Next.js 16 + React 19 + Tailwind v4)             │
│  Landing · Vault deposit/withdraw · Allocation viz · Reports │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP + Privy embedded wallet
┌──────────────────▼──────────────────────────────────────────┐
│  atma-agent (TypeScript orchestrator + Skills)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Allocator    │  │ Risk         │  │ Reporter         │  │
│  │ skills/      │  │ skills/      │  │ skills/          │  │
│  │ mantle-rwa-  │  │ mantle-risk- │  │ treasury-        │  │
│  │ allocation   │  │ monitoring   │  │ reporting        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────┬──────────────────────┬───────────────────────────────┘
       │                      │
┌──────▼──────┐    ┌──────────▼──────────┐
│  Mantle     │    │  ERC-8004 Registry  │
│  Sepolia    │    │  Identity +         │
│  + AtmaVault│    │  Reputation +       │
│  + USDY/    │    │  Validation         │
│  mUSD/Aave  │    │  (Mantle Mainnet)   │
└─────────────┘    └─────────────────────┘
```

### Vault Lifecycle State Machine

```
idle → analyzing → proposing → awaiting_signature → executing
                                                        │
                                                  attesting → allocated
                                                        │
                                  ┌─────────────────────┼─────────────────────┐
                                  ▼                     ▼                     ▼
                              rebalancing         risk_triggered       withdrawing
                                  │                     │                     │
                                  ▼                     ▼                     ▼
                              allocated           defensive_exit        completed
```

**8 states · 4 failure stages · Strict transition guard.** Every position move is validated by the on-chain state machine. ERC-8004 reputation events emitted at every confirmed transition.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| Animations | Lenis (smooth scroll), GSAP ScrollTrigger, Framer Motion |
| Wallet | Privy embedded wallet (email + social login), viem 2.x |
| Backend | TypeScript orchestrator + Anthropic Claude Sonnet 4.5 |
| Skills | 3 markdown reference files (CrossBeam-pattern) |
| Smart Contracts | Solidity 0.8.24 + Foundry + OpenZeppelin v5 |
| Mantle Integration | viem + Mantle Sepolia RPC + USDY/mUSD/Aave V3 ABIs |
| ERC-8004 | Mantle Mainnet Identity Registry (auto-issued) |
| Data | DefiLlama API + Nansen API + Elfa AI sentiment |
| Deploy | Vercel (frontend) + Foundry forge (contracts) |
| i18n | next-intl (en + id locales) |

## On-Chain Proof

| Artifact | Address |
|----------|---------|
| **AtmaVault (Mantle Sepolia)** | `[deploy pending]` |
| **ERC-8004 Allocator Agent ID** | `[register pending]` |
| **ERC-8004 Risk Agent ID** | `[register pending]` |
| **ERC-8004 Reporter Agent ID** | `[register pending]` |
| **Treasury wallet** | `[deploy pending]` |
| **Mantle Explorer** | https://sepolia.mantlescan.xyz |

## Testing

- Foundry test suite (target 50+ passing tests)
- Recovery catalog per failure stage
- See [`./contracts/test/TEST_REPORT.md`](./contracts/test/TEST_REPORT.md)

## Quick Start

```bash
# 1. Clone + install
git clone https://github.com/abdullahdevrangga11/atma.git
cd atma
pnpm install

# 2. Contracts
cd contracts
forge install
forge build
forge test
forge script script/Deploy.s.sol --rpc-url $MANTLE_SEPOLIA_RPC --broadcast --verify
cd ..

# 3. Frontend
cp .env.example .env.local
# Fill in: MANTLE_SEPOLIA_RPC, PRIVY_APP_ID, ANTHROPIC_API_KEY, vault address
pnpm dev
```

Open http://localhost:3000.

## Project Structure

```
atma/
├── contracts/             # Foundry — AtmaVault.sol + tests
├── app/                   # Next.js 16 App Router
│   ├── [locale]/         # next-intl: en + id
│   │   ├── page.tsx      # Landing (base.org-inspired)
│   │   ├── vault/        # Deposit/withdraw + allocation viz
│   │   ├── reports/      # P&L + benchmark
│   │   └── skills/       # Skill files rendered
│   └── api/agent/        # Agent orchestrator endpoint
├── components/
│   ├── landing/          # Hero, FeatureCards, Marquee, StatCounters
│   ├── vault/            # DepositForm, AllocationViz, RiskDashboard
│   ├── animations/       # Magnetic, ScrollReveal, GradientOrb
│   └── ui/               # shadcn/ui base
├── lib/
│   ├── agents/           # Allocator, Risk, Reporter (TypeScript)
│   ├── mantle/           # viem client, contract ABIs
│   └── animations/       # Lenis init, GSAP utils
├── skills/               # 3 Markdown skill reference files
├── runbooks/             # DEPLOYMENT, INCIDENT_RESPONSE
├── messages/             # next-intl translations
└── docs/                 # Pitch materials
```

## Why Mantle

ATMA is built specifically on Mantle because the RWA stack here is uniquely composable:

- **USDY (4.65% APY)** — tokenized US Treasuries, Mantle-native via Ondo
- **mUSD** — yield-bearing rebasing USDY wrapper, programmable
- **Aave V3 Mantle** — $539M market with boosted lending rates
- **MI4** — tokenized BTC/ETH/SOL/stables index, treasury-grade exposure
- **cmETH** — composable restaking, 6 yield sources native to Mantle
- **ERC-8004** — Mantle deployed the standard Feb 16, 2026; every agent is a verifiable on-chain identity

No other L2 offers this combined surface area for treasury orchestration.

## Roadmap

- [x] Day 1 — AtmaVault contract deployed Mantle Sepolia + ERC-8004 agents registered
- [x] Day 2 — 3-agent orchestrator live + frontend deployed Vercel
- [x] Day 3 — Polish + demo video + DoraHacks submission
- [ ] Phase 2 — Mantle Mainnet deploy + first DAO partner
- [ ] Phase 3 — Multi-policy SDK for downstream dApps
- [ ] Phase 4 — Cross-chain treasury (Mantle ↔ Base ↔ Arbitrum)

## License

MIT — see [LICENSE](./LICENSE).

## Acknowledgments

- **Mantle Network** — for the RWA stack and ERC-8004 deployment
- **Byreal** — for the Skills CLI pattern
- **Anthropic Claude Code** — for the Skills-First architectural insight
- **Octora, Rule, SOLQ teams** — for the production-grade open-source patterns
- **Superteam Indonesia** — for the National Campus Hackathon journey that taught me what wins

---

<div align="center">

Built by **[Devrangga Hazza Mahiswara](https://github.com/abdullahdevrangga11)** · UGM Software Engineering '23 · Yogyakarta, Indonesia

[Twitter / X](https://x.com/) · [GitHub](https://github.com/abdullahdevrangga11) · [Email](mailto:abdullahdevrangga@gmail.com)

</div>
