# ATMA — Treasury Orchestration for Mantle

**Three AI agents allocate, monitor, and report a Mantle RWA treasury. Policy as Markdown. Every decision signed on-chain via ERC-8004.**

Built for the [Mantle Turing Test Hackathon 2026](https://dorahacks.io/hackathon/mantleturingtesthackathon2026).

→ **Live demo**: [atma-iota.vercel.app](https://atma-iota.vercel.app)
→ **Twitter**: [@abdullahdevrang](https://x.com/abdullahdevrang)

---

## The pain point

Treasuries on Mantle hold stablecoins. **USDC pays 0% APY.** USDY pays 4.42%. mUSD pays 4.6% via rebasing. Aave V3 supply moves intraday. Nobody actively manages this — so treasuries either park USDC and bleed ~4%/yr, or pick one asset and accept the rebalance work nobody has time for.

ATMA closes the gap with three coordinated AI agents that run inside an ERC-4626 vault.

---

## The thesis: policy as data, not code

Each agent reads its policy from a Markdown file at runtime:

```
skills/
├── mantle-rwa-allocation.skill.md       ← AllocatorAgent
├── mantle-risk-monitoring.skill.md      ← RiskAgent
└── treasury-reporting.skill.md          ← ReporterAgent
```

Edit a skill. Commit to main. The next agent invocation reads the new policy. **No redeploy. No contract upgrade.** Inspired by [CrossBeam](https://github.com/cross-beam) — first prize in Anthropic's Claude Code Hackathon.

---

## What's been built

### Smart contracts

- `contracts/src/AtmaVault.sol` — 374-line ERC-4626 vault with 11-state machine, ERC-8004 reputation events, 24h rebalance cadence guard, and a defensive exit primitive
- 5 mock contracts (USDC, USDY, mUSD, Aave pool, MI4) so the demo runs without depending on live RWA bridges
- **45 Foundry tests** covering state machine, NAV computation, weight enforcement, defensive exit, debate retries

### Agent layer

- 3 agent classes (TypeScript on `@anthropic-ai/sdk`) with both single-shot and **streaming** Claude variants
- Skill-based system prompts read from disk (or via `overrideSkill` for playgrounds)
- Zod-validated input/output schemas
- SHA-256 reasoning hashes on every step
- Token + cost accounting per call

### Orchestrator

- Allocator → Risk → Reporter sequential chain with a **debate loop**: if Risk emits trigger, the veto reason is injected back into Allocator's system prompt and the chain retries (up to 1 redraft)
- SSE streaming: `start | state | token | allocator | risk | veto | reporter | cost | done | error`
- In-memory run store (cap 50) feeds /reports and /network without external DB

### Frontend — 15 pages, 16 API endpoints

| Path | What it does |
|---|---|
| `/` | Landing — FiddleHover digital scramble, React Flow architecture, bento product grid, split-card pinned scroll, build log |
| `/vault` | Live multi-agent orchestration with state machine viz + debate loop + token-streaming reasoning + cost meter |
| `/backtest` | N-week (2–12) historical replay with live Claude reasoning per agent per week |
| `/backtest/ab` | Two skills, same weeks, two NAV curves on one chart |
| `/compare` | Three policies (conservative/balanced/aggressive) reasoning in parallel |
| `/anomaly` | Five sliders driving RiskAgent — drag any peg into red, watch Claude trigger |
| `/ab-test` | Skill A vs Skill B over N rounds, win-rate scoreboard |
| `/skills` | Edit Markdown policy live, diff view, system-prompt inspector, **lint with /api/skills/validate** |
| `/marketplace` | Browse + publish + fork + star community-published skills. Lineage view via React Flow |
| `/marketplace/[id]` | Skill detail with stars, forks, runs, copy markdown, fork dialog |
| `/reports` | Real attestation history pulled from runStore |
| `/network` | Cumulative cost, runs, defensive exits, debate retries — global dashboard with CSV/JSON export |
| `/agents/[allocator\|risk\|reporter]` | Per-agent identity profile with ERC-8004 capsule + decision feed |
| `/runs/[id]` | Forensic single-run view with debate transcript + state-machine path |
| `/conversation/[id]` | Slack-style multi-agent chat rendering of an orchestration run |

| API | Verb | Purpose |
|---|---|---|
| `/api/agent` | POST | Single-shot agent invocation (supports `overrideSkill`) |
| `/api/orchestrate` | POST | Atomic full chain |
| `/api/orchestrate/stream` | POST (SSE) | Streaming chain — token deltas, state, debate, cost |
| `/api/backtest/stream` | POST (SSE) | N-week historical replay with per-agent streaming |
| `/api/abtest/stream` | POST (SSE) | N-round skill A vs B comparison |
| `/api/feeds` | GET | Synthetic live market snapshot |
| `/api/prompts` | GET | Exact system prompts sent to Claude per agent |
| `/api/runs` | GET | Latest runs + aggregate stats |
| `/api/runs/[id]` | GET | Single run lookup |
| `/api/agent-stats/[slug]` | GET | Per-agent decision feed + stats |
| `/api/network` | GET | Global stats across all runs |
| `/api/marketplace` | GET / POST | List or publish skills |
| `/api/marketplace/[id]` | GET | Single skill lookup |
| `/api/marketplace/[id]/star` | POST | Star a skill |
| `/api/marketplace/[id]/fork` | POST | Fork a skill (creates derivative) |
| `/api/skills/validate` | POST | Skill markdown linter — surfaces missing bounds, contradictions, vague language |

### Other goodies

- **OpenGraph image generation** for `/runs/[id]`, `/conversation/[id]`, `/agents/[slug]`, `/marketplace/[id]` — any shareable URL unfurls as a custom Twitter card
- **Cmd+K command palette** — keyboard-jump anywhere
- **KVS-style dissolve page transitions** on every nav link (CodeGrid port)
- **Split-card pinned scroll** on the three-pillars section (CodeGrid port)
- **React Flow diagrams** in 4+ surfaces (architecture, state machine, marketplace lineage, bento product grid)
- **55 vitest unit tests** + **45 Foundry tests**, all green
- **i18n routes** in `en` + `id`
- **Sitemap + robots.txt** auto-generated
- **Custom 404 + error boundary + loading states** per locale

---

## Run it locally

```bash
# Prereqs
node --version  # need 20+
pnpm --version  # or use the bundled npm
which forge     # foundry — curl -L https://foundry.paradigm.xyz | bash && foundryup

# Install
pnpm install

# Env
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY (without it /api/agent and /vault 500)

# Tests
pnpm test                    # vitest
cd contracts && forge test   # foundry

# Dev
pnpm dev   # localhost:3000
```

---

## Deploy to Mantle Sepolia

```bash
# Set deployer key + faucet MNT
echo "PRIVATE_KEY=0x..." >> .env.local
echo "MANTLESCAN_API_KEY=..." >> .env.local

# Deploy + verify
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.sepolia.mantle.xyz \
  --broadcast --verify \
  --etherscan-api-key $MANTLESCAN_API_KEY -vvv
```

The script logs every address. Copy them into `.env.local`. See `DEPLOY.md` for the full step-by-step.

---

## Architecture

```
              ┌─────────────────────────────────┐
              │      synthetic live feeds       │
              │  USDY, mUSD, Aave V3, MI4 APYs  │
              └────────────────┬────────────────┘
                               ▼
            ┌──────────────────────────────────────┐
            │         AllocatorAgent #1            │
            │ reads mantle-rwa-allocation.skill.md │
            │   proposes 4-asset weight vector     │
            └────────────────┬─────────────────────┘
                             ▼
            ┌──────────────────────────────────────┐
            │           RiskAgent #2               │
            │ reads mantle-risk-monitoring.skill.md│
            │  monitors pegs, oracle, drawdown     │
            │           VETO AUTHORITY             │
            └────────┬─────────────────┬───────────┘
                     │                 │
              veto = trigger          ok / warn
                     │                 │
                     ▼                 ▼
       ┌──────────────────────┐   ┌────────────────────────┐
       │  Redraft Allocator   │   │   ReporterAgent #3     │
       │  (up to 1 retry)     │   │ compares vs 3 baselines│
       └──────────┬───────────┘   └────────────┬───────────┘
                  └─────────────┬──────────────┘
                                ▼
                 ┌─────────────────────────────────┐
                 │   ERC-8004 reputation events    │
                 │   emitted on Mantle Sepolia     │
                 │      via AtmaVault.sol          │
                 └─────────────────────────────────┘
```

---

## Tech stack

Solidity 0.8.24 · Foundry · OpenZeppelin v5 · ERC-4626 · ERC-8004 · Anthropic Claude Sonnet 4.5 · TypeScript · Zod · Next.js 16 (Turbopack) · React 19 · Tailwind v4 · GSAP + ScrollTrigger · Lenis · React Flow (@xyflow/react) · viem · Privy embedded wallet · Mantle Sepolia (chainId 5003) · Vercel · vitest · Foundry · next/og

---

## Submission docs

- [`DEPLOY.md`](./DEPLOY.md) — full deploy guide with smoke-test checklist
- [`DEMO_VIDEO_SCRIPT.md`](./DEMO_VIDEO_SCRIPT.md) — 3-minute founder-voice script
- [`DORAHACKS_SUBMISSION.md`](./DORAHACKS_SUBMISSION.md) — paste-ready submission form copy
- [`TWITTER_THREAD.md`](./TWITTER_THREAD.md) — 9-tweet launch thread
- [`progress.md`](./progress.md) — CrossBeam-pattern build log

---

## License

MIT. Fork it, learn from it, ship something better.

---

**Built by [Devrangga Hazza Mahiswara](https://x.com/abdullahdevrang) — Yogyakarta, June 2026.**
