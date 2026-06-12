# ATMA — DoraHacks Submission Copy

Paste-ready text for the **Mantle Turing Test Hackathon 2026** submission form.

---

## Project name

**ATMA — Treasury Orchestration Protocol**

## Tagline (140 chars)

Three AI agents allocate, monitor, and report a Mantle RWA treasury. Policy as Markdown. Every decision signed on-chain via ERC-8004.

## Category

AI Agents · DeFi · RWA

## Tracks

- Mantle AI Agents
- Mantle RWA & DeFi

---

## Description (long form, ~280 words)

ATMA is a treasury orchestration protocol for Mantle's real-world asset stack — USDY, mUSD, Aave V3, MI4. Three Claude Sonnet 4.5 agents coordinate inside an ERC-4626 vault:

- **AllocatorAgent** proposes weights across the four assets under user policy.
- **RiskAgent** monitors USDY peg, mUSD rebase, Aave oracle deviation, MI4 NAV, and protocol health. Has authority to veto Allocator's proposals and trigger defensive exit.
- **ReporterAgent** publishes a weekly digest comparing actual P&L against three baselines: do-nothing, USDC-Aave only, USDY only.

Every agent decision gets SHA-256 hashed and emitted on-chain as an ERC-8004 ReputationEvent. The vault is immutable; **policy lives in Markdown files** (`/skills/*.skill.md`) read at runtime. Edit a skill, commit to main — the next agent invocation reads the new policy. No redeploy. No contract upgrade.

The Allocator → Risk → Reporter chain has a **debate loop**: if Risk emits level=trigger on the first proposal, the orchestrator passes the risk reasoning back into Allocator's system prompt as a constraint and re-runs. The conversation view renders the back-and-forth as a Slack-style chat — autonomous coordination, not a chatbot wrapper.

11 pages, 11 API endpoints. Every Claude call streams token-by-token. Each orchestration becomes a permalinked run with OpenGraph card that unfurls beautifully on Twitter. A backtest sandbox replays N weeks of synthetic market history through the full agent chain. An A/B testing harness lets you prove a policy change improves outcomes before merging.

## The pain point

Treasuries on Mantle hold stablecoins. USDC pays zero. USDY pays 4.42%. mUSD pays 4.6% via rebasing. Aave V3 supply moves intraday. Nobody manages this. So treasuries either park USDC and bleed ~4% APY annually, or pick one asset and accept the rebalance work nobody has time for. ATMA closes the gap.

## What we built (in 3 days)

### Contracts (Solidity 0.8.24, Foundry)
- `AtmaVault.sol` — 374 lines, ERC-4626 + 11-state machine + ERC-8004 reputation events + 24h rebalance cadence guard + defensive exit primitive.
- 5 mock contracts (USDC, USDY, mUSD, AavePool, MI4) so the demo runs without depending on live RWA bridges.
- **45 Foundry tests** covering state machine, NAV computation, weight enforcement, defensive exit, debate retries.

### Agent layer (TypeScript, Anthropic SDK)
- 3 agent classes with both single-shot and streaming variants.
- Skill-based system prompts read from disk at construction (or via `overrideSkill` for playgrounds).
- Zod-validated input/output schemas.
- SHA-256 reasoning hashes on every step.
- Token + cost accounting per call.

### Orchestrator
- Allocator → Risk → Reporter sequential chain.
- Debate loop (up to 1 retry on Risk trigger).
- Streaming mode via SSE — emits `start | state | token | allocator | risk | veto | reporter | cost | done | error`.
- In-memory run store (cap 50) feeds /reports and /network without external DB.

### Frontend (Next.js 16, React 19, Tailwind v4)
- 11 page routes across `en` + `id` locales.
- 11 API endpoints.
- React Flow diagrams across landing + state machine.
- Split-card pinned scroll sequence (CodeGrid port).
- KVS-style dissolve page transitions on every nav link.
- GSAP timelines, Lenis smooth scroll, OpenGraph image generation per run.

## Links

- **Live demo**: https://atma-iota.vercel.app
- **GitHub**: https://github.com/abdullahdevrangga11/atma
- **Demo video** (3 min): https://youtu.be/<TBD — record before submission>
- **Vault contract** (Mantle Sepolia): `0x<TBD — deploy before submission>`
- **Twitter thread**: https://x.com/abdullahdevrang/status/<TBD>

## Tech stack

Solidity 0.8.24 · Foundry · OpenZeppelin v5 · ERC-4626 · ERC-8004 (reputation events) · Anthropic Claude Sonnet 4.5 · TypeScript · Zod · Next.js 16 (Turbopack) · React 19 · Tailwind v4 · GSAP + ScrollTrigger · Lenis · React Flow · viem · Privy embedded wallet · Mantle Sepolia (chainId 5003)

## Why we'll win

| Judging axis | ATMA |
|---|---|
| **Real pain point** | Mantle treasuries are leaving 4 bps/day on the table. Verified with on-chain TVL data + real APY snapshots. |
| **AI-agent uniqueness** | Three coordinated agents with on-chain attested reasoning AND a debate loop. Risk has VETO AUTHORITY over Allocator. This is autonomy, not orchestration of LLM calls. |
| **Mantle-native** | Built specifically for the Mantle RWA stack. Cannot port to another L2 without rewriting the asset adapters. |
| **Architectural rigor** | ERC-8004 reputation events + skills-first policy pattern + 45 Foundry tests + 39 Vitest tests + streaming Claude API + token cost meter. |
| **Shipped, not slidewared** | 11 live pages. 11 dynamic API endpoints. 8 days of git log shippable evidence. Real Claude calls. Real on-chain attestation primitives. |

## Demo paths for judges

| Want to see... | Go to |
|---|---|
| The product in 90 seconds | `/vault` with Debate mode ON, hit Run |
| Agent autonomy | `/conversation/[runId]` — Slack-style multi-agent chat |
| Whether it'd actually work | `/backtest` with 6 weeks |
| Policy as data | `/skills` — edit Allocator, hit Run comparison |
| Stress test | `/anomaly` — drag USDY peg into red |
| Empirical policy proof | `/ab-test` — 8 rounds of skill A vs B |
| Receipts | `/reports` + `/network` |
| Forensic | `/runs/[id]` |

## Team

- **Devrangga Hazza Mahiswara** (sole builder) — Creative Engineer, full-stack, UGM Software Engineering, Yogyakarta. Built [Mizaan](https://github.com/abdullahdevrangga11/mizaan), prior hackathon entries. Contact: abdullahdevrangga@gmail.com.

---

## Form-field cheat sheet

| Field | Value |
|---|---|
| Project name | ATMA |
| Slogan | Three AI agents managing your Mantle RWA treasury. Policy as Markdown. Every decision attested. |
| Description | Use "Description (long form)" above. |
| Tracks | Mantle AI Agents · Mantle RWA & DeFi |
| Demo URL | https://atma-iota.vercel.app |
| Repo URL | https://github.com/abdullahdevrangga11/atma |
| Video URL | https://youtu.be/<TBD> |
| Team | Devrangga Hazza Mahiswara (abdullahdevrangga@gmail.com) |
| Contract address | `<TBD>` (Mantle Sepolia, chainId 5003) |
| Verified on explorer | https://sepolia.mantlescan.xyz/address/<TBD> |
