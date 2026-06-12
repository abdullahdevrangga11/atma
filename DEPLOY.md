# AMANA — Deploy Guide

Three-step deployment for the **Mantle Turing Test Hackathon 2026** submission.

Live demo: **https://atma-iota.vercel.app**
Repo: **https://github.com/abdullahdevrangga11/amana**

---

## 0. Prereqs

| Tool | Version | Install |
|---|---|---|
| Node | 20+ | https://nodejs.org |
| pnpm | 9+ | `npm i -g pnpm` (or use the bundled npm install) |
| Foundry | nightly | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| Vercel CLI | latest | `npm i -g vercel` |
| Mantle Sepolia MNT | ~0.1 MNT | https://faucet.sepolia.mantle.xyz |

---

## 1. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Anthropic — agent reasoning (REQUIRED — without this the agent pages 500)
ANTHROPIC_API_KEY=sk-ant-...

# Mantle Sepolia (testnet)
MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz
PRIVATE_KEY=0x...                # deployer key, holds the faucet MNT
MANTLESCAN_API_KEY=...           # for source verification

# Privy — embedded wallet (UI present, hookup is optional)
NEXT_PUBLIC_PRIVY_APP_ID=...
```

The deploy script appends contract addresses to `.env.local` once the
forge script lands.

---

## 2. Contracts → Mantle Sepolia

```bash
cd contracts

# Build
forge build --sizes

# 45 Foundry tests (all green)
forge test -vvv

# Deploy + verify
forge script script/Deploy.s.sol \
  --rpc-url $MANTLE_SEPOLIA_RPC \
  --broadcast --verify \
  --etherscan-api-key $MANTLESCAN_API_KEY \
  -vvv
```

`Deploy.s.sol` ships AmanaVault + 5 mock contracts (USDC, USDY, mUSD, Aave
pool, MI4) so the demo is reproducible without depending on live RWA
bridge testnets. A mainnet cut accepts real Mantle addresses in the
constructor.

---

## 3. Frontend → Vercel

```bash
vercel link                    # link to a new Vercel project
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_PRIVY_APP_ID production
vercel env add NEXT_PUBLIC_AMANA_VAULT production
vercel env add NEXT_PUBLIC_CHAIN_ID production
vercel --prod
```

Production URL: **https://atma-iota.vercel.app**

The build uses Next.js 16 (Turbopack) + React 19 + Tailwind v4. All
pages prerender for both `en` and `id` locales; agent + orchestration
endpoints are dynamic with `runtime: "nodejs"`.

---

## 4. Smoke test — 8 pages, 11 API endpoints

After deploy, hit these:

### Pages (all should render 200)

| Route | What it demonstrates |
|---|---|
| `GET /` | Landing — FiddleHover digital scramble, animated architecture flow, bento product section, split-card pinned-scroll feature section, build log |
| `GET /vault` | Vault state-machine viz + live feeds + token-streaming orchestration with debate loop and cost meter |
| `GET /backtest` | 2-12 week historical replay with live Claude reasoning per agent per week |
| `GET /compare` | 3 policies (conservative/balanced/aggressive) reasoning in parallel |
| `GET /anomaly` | 5 sliders driving RiskAgent with rule-based vs Claude prediction comparison |
| `GET /ab-test` | Two skill markdowns competing across N rounds |
| `GET /reports` | Real attestation history pulled from runStore |
| `GET /network` | Cumulative cost, runs, defensive exits, debate retries |
| `GET /agents/[allocator\|risk\|reporter]` | Per-agent identity profile with ERC-8004 capsule |
| `GET /skills` | Markdown viewer with edit + diff + run + system prompt inspector |
| `GET /runs/[id]` | Forensic single-run view with debate transcript + state-machine path |
| `GET /conversation/[id]` | Slack-thread-style multi-agent conversation rendering of the same run |

### API endpoints

| Endpoint | Verb | Purpose |
|---|---|---|
| `/api/agent` | POST | Single-shot agent invocation; supports `overrideSkill` for playgrounds |
| `/api/orchestrate` | POST | Atomic full Allocator → Risk → Reporter chain |
| `/api/orchestrate/stream` | POST (SSE) | Streaming chain — token deltas, state transitions, debate events, cost |
| `/api/backtest/stream` | POST (SSE) | N-week historical replay with per-week per-agent streaming |
| `/api/abtest/stream` | POST (SSE) | N-round skill A vs skill B comparison |
| `/api/feeds` | GET | Current synthetic feed snapshot |
| `/api/prompts` | GET | The exact system prompts sent to Claude per agent |
| `/api/runs` | GET | Latest 20 runs + aggregate stats |
| `/api/runs/[id]` | GET | Single run lookup |
| `/api/agent-stats/[slug]` | GET | Per-agent decision feed + stats |
| `/api/network` | GET | Global stats across all runs (cost, count, defensive exits, debate retries) |

### OpenGraph

`/runs/[id]` exports a generated Twitter card via `next/og`. Any
`/runs/[id]` URL pasted into Twitter, Slack, or Discord unfurls as a
proper card showing outcome + outperformance + agent signatures.

---

## 5. Hackathon checklist

- [x] Repo public on GitHub (https://github.com/abdullahdevrangga11/amana)
- [x] Production live (https://atma-iota.vercel.app)
- [ ] Vault deployed + verified on Mantle Sepolia (needs PRIVATE_KEY)
- [ ] `ANTHROPIC_API_KEY` set in Vercel
- [ ] 3-min demo video recorded (script in `DEMO_VIDEO_SCRIPT.md`)
- [ ] DoraHacks submission form filled (copy in `DORAHACKS_SUBMISSION.md`)
- [ ] Twitter thread posted (template in `TWITTER_THREAD.md`)

**Deadline**: 2026-06-15 15:59 UTC.
