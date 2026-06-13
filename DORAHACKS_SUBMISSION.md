# AMANA — DoraHacks Submission Copy

Paste-ready text for the **Mantle Turing Test Hackathon 2026** submission form.

---

## Project name

**AMANA — Treasury Orchestration Protocol**

## Tagline (140 chars)

Three AI agents allocate, monitor, and report a Mantle RWA treasury. Policy as Markdown. Every decision signed on-chain via ERC-8004.

## Category

AI Agents · DeFi · RWA

## Tracks

- Mantle AI Agents
- Mantle RWA & DeFi

---

## Description (long form, ~280 words)

AMANA is a treasury orchestration protocol for Mantle's real-world asset stack — USDY, mUSD, Aave V3, MI4. Three Claude Sonnet 4.5 agents coordinate inside an ERC-4626 vault:

- **AllocatorAgent** proposes weights across the four assets under user policy.
- **RiskAgent** monitors USDY peg, mUSD rebase, Aave oracle deviation, MI4 NAV, and protocol health. Has authority to veto Allocator's proposals and trigger defensive exit.
- **ReporterAgent** publishes a weekly digest comparing actual P&L against three baselines: do-nothing, USDC-Aave only, USDY only.

Every agent decision gets SHA-256 hashed and emitted on-chain as an ERC-8004 ReputationEvent. The vault is immutable; **policy lives in Markdown files** (`/skills/*.skill.md`) read at runtime. Edit a skill, commit to main — the next agent invocation reads the new policy. No redeploy. No contract upgrade.

The Allocator → Risk → Reporter chain has a **debate loop**: if Risk emits level=trigger on the first proposal, the orchestrator passes the risk reasoning back into Allocator's system prompt as a constraint and re-runs. The conversation view renders the back-and-forth as a Slack-style chat — autonomous coordination, not a chatbot wrapper.

11 pages, 11 API endpoints. Every Claude call streams token-by-token. Each orchestration becomes a permalinked run with OpenGraph card that unfurls beautifully on Twitter. A backtest sandbox replays N weeks of synthetic market history through the full agent chain. An A/B testing harness lets you prove a policy change improves outcomes before merging.

## The pain point

Treasuries on Mantle hold stablecoins. USDC pays zero. USDY pays 4.42%. mUSD pays 4.6% via rebasing. Aave V3 supply moves intraday. Nobody manages this. So treasuries either park USDC and bleed ~4% APY annually, or pick one asset and accept the rebalance work nobody has time for. AMANA closes the gap.

The deeper problem is not yield, it is accountability. The few treasuries that do allocate manually have no auditable record of why a decision was made. When a DAO multisig moves funds into an RWA position, there is no signed policy, no risk veto on record, and no standardized report a token holder can verify. Treasury management today is a Telegram message and a trust-me. AMANA turns it into a policy, a debate, and an on-chain attestation.

## Who this is for

AMANA targets organizations on Mantle that hold idle stablecoins and answer to someone for them:

- **DAO treasuries** holding stables in a multisig, accountable to token holders who want to see policy, not vibes.
- **Protocol treasuries** (DeFi teams on Mantle) sitting on runway in USDC that should be earning RWA yield without a full-time treasurer.
- **RWA funds and on-chain asset managers** that need a verifiable, repeatable allocation process with a risk gate and an audit trail.
- **DeFi-native orgs and small funds** that want institutional-grade treasury discipline without hiring an institutional treasury desk.

The common thread: idle stables, a fiduciary duty to someone, and no one whose full-time job is to rebalance and document it.

## What we built (in 3 days)

### Contracts (Solidity 0.8.24, Foundry)
- `AmanaVault.sol` — 374 lines, ERC-4626 + 11-state machine + ERC-8004 reputation events + 24h rebalance cadence guard + defensive exit primitive.
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

## Why this is a new primitive (not a fork)

AMANA is not a yield aggregator and not a chatbot wrapper. Three things make it a new primitive:

1. **Policy as data, not code.** The allocation strategy, risk thresholds, and reporting format live in Markdown skill files read at runtime, not compiled into the contract. A treasury edits a skill, commits to main, and the next agent run obeys the new policy. No redeploy, no contract upgrade, no governance proposal to ship a constant. Yield aggregators hard-code strategy in Solidity. AMANA makes strategy a versionable, diffable, auditable document. That is the unlock: a treasury policy you can read, fork, and prove.

2. **Autonomous multi-agent debate with veto authority.** This is not one model answering a prompt. AllocatorAgent proposes weights. RiskAgent independently monitors pegs, oracle deviation, and drawdown, and holds real veto power: if it emits a trigger, the orchestrator injects the risk reasoning back into the Allocator as a hard constraint and re-runs. The two agents argue to a safer answer. ReporterAgent then signs the digest. That is a separation of powers (proposer / risk officer / auditor), enforced in software.

3. **Every decision attested via ERC-8004.** Each agent is its own on-chain identity. Every proposal, veto, and report is SHA-256 hashed and emitted as a reputation event. A treasury does not just get an allocation, it gets a verifiable record of who decided what, on what policy version, and why. This is the part a token holder or auditor can independently check.

Contrast: a yield aggregator fork optimizes APY with a fixed strategy and zero accountability. A chatbot wrapper answers questions but never holds funds, never gets vetoed, and never signs anything on-chain. AMANA does all three: holds funds in an ERC-4626 vault, runs a real adversarial process, and leaves an on-chain trail.

## Ecosystem fit (Mantle-native by construction)

AMANA is built around the Mantle RWA stack and is complementary to it, not competitive with it. AMANA does not issue an asset, run an oracle, or compete for TVL with any Mantle protocol. It is the allocation and accountability layer that routes treasury capital *into* the Mantle stack and makes those protocols easier to adopt for cautious treasuries.

| Mantle integration | Role in AMANA | Why complementary |
|---|---|---|
| **USDY (Ondo)** | Core low-risk yield leg, treasury-backed | AMANA drives deposits into USDY; Ondo gets sticky treasury TVL it would not capture from a manual desk |
| **mUSD** | Rebasing yield leg | AMANA handles the rebase accounting a treasury would otherwise avoid, increasing mUSD adoption |
| **Aave V3 (Mantle)** | Variable supply yield leg | AMANA supplies into Aave when risk-adjusted APY wins, monitoring oracle deviation as a veto signal |
| **MI4 (tokenized index)** | Higher-yield / higher-volatility leg for aggressive policies | AMANA gates MI4 behind risk tolerance and a larger risk penalty, making it safe for treasuries to touch |
| **ERC-8004 (Mantle registry)** | Agent identity + per-decision reputation events | AMANA is a concrete, treasury-grade use case for Mantle's agent-identity standard |

The asset adapters are written specifically for these four primitives. Porting AMANA to another L2 would mean rewriting the adapter layer and abandoning ERC-8004. AMANA is a reason for a treasury to keep its capital on Mantle, and a reason for each of these protocols to see more inflow.

## Business model

**What we charge for: outperformance, not custody.**

The honest, defensible revenue model is a **performance fee on verified outperformance**: AMANA takes a percentage (target **10%**) of the yield it generates *above the do-nothing baseline*, measured by the ReporterAgent against the same three baselines shown in the product (hold USDC, USDY-only, USDC-on-Aave-only). If AMANA does not beat the baseline, it earns nothing. The fee is computed off the attested P&L the Reporter already signs, so the thing we bill against is the thing we prove on-chain.

This is deliberately not a pure AUM fee. A flat AUM bps fee charges treasuries whether or not the protocol adds value, which is exactly the trust problem AMANA exists to solve. A performance fee on attested outperformance aligns AMANA with the treasury and makes the pitch self-evident: you only pay when you provably win.

- **Primary**: 10% performance fee on outperformance versus the do-nothing baseline, settled per reporting period.
- **Optional later**: a small AUM bps fee (target **10–20 bps/yr**) for treasuries that prefer predictable cost over performance alignment. Offered, not default.
- **Why it is viable**: on a treasury earning ~4% over a 0% baseline, a 10% performance fee is ~40 bps/yr of AUM, charged only on real, attested gains. For a treasury holding low-seven-figures in idle stables, that is a clear ROI: the cost is a fraction of the yield AMANA captures that would otherwise have been left on the table. (Illustrative projection, not realized revenue.)

**PMF signal.** The pain is structural and already visible: stablecoins parked on Mantle earning zero while RWA legs pay ~4–4.6%, and DAO treasuries with no auditable allocation policy. The product itself is the demand test: the skill marketplace (publish / fork / star) lets treasuries adopt and adapt a policy without writing one from scratch, and the A/B harness lets them prove a policy change before adopting it. Validation post-hackathon means converting design-partner treasuries, not vanity metrics.

## Go-to-market (post-hackathon)

1. **Land 3 design-partner treasuries on Mantle (first 60 days).** Target small-to-mid DAO and protocol treasuries already holding idle USDC on Mantle. Onboard them on the single-user vault (what ships today) in observe-only mode first: AMANA proposes and reports, the treasury executes manually, building trust on the attested track record before AMANA holds funds. Convert to managed once the reports earn confidence.
2. **Distribute through the Mantle ecosystem.** AMANA's adoption is co-marketed with the protocols it feeds (Ondo/USDY, mUSD, Aave, MI4): every dollar AMANA allocates is inflow for them, which makes ecosystem partnership a mutual-incentive sell rather than a cold pitch. Use the ERC-8004 attestation angle as the differentiator in Mantle treasury and DAO channels.
3. **Let policies sell the product.** The skill marketplace is a distribution loop: a treasury that publishes a strong, attested policy becomes a reference, and forks of that policy bring new treasuries in. Policy-as-data is also a content surface (public, versioned, diffable strategies).

## Roadmap

- **Now (hackathon)**: single-user ERC-4626 vault, 3-agent debate loop, ERC-8004 attestation, skill marketplace, backtest and A/B harness, live on Mantle Sepolia.
- **V2 (multi-user vault)**: multi-depositor shares, per-treasury policy isolation, role-gated operator. (The contract is explicitly scoped single-user today; multi-user is the first post-hackathon contract milestone.)
- **V3 (managed + verified)**: performance-fee accrual settled on-chain off the attested Reporter P&L, observe-only to managed onboarding flow, and ERC-8004 reputation surfaced as a public track record per treasury policy.
- **Later**: more Mantle RWA legs as they ship, treasury-facing alerting, and a verified-policy directory.

## Links

- **Live demo**: https://amana-iota.vercel.app
- **GitHub**: https://github.com/abdullahdevrangga11/amana
- **Demo video** (3 min): https://youtu.be/<TBD — record before submission>
- **Vault contract** (Mantle Sepolia): `0x<TBD — deploy before submission>`
- **Twitter thread**: https://x.com/abdullahdevrang/status/<TBD>

## Tech stack

Solidity 0.8.24 · Foundry · OpenZeppelin v5 · ERC-4626 · ERC-8004 (reputation events) · Anthropic Claude Sonnet 4.5 · TypeScript · Zod · Next.js 16 (Turbopack) · React 19 · Tailwind v4 · GSAP + ScrollTrigger · Lenis · React Flow · viem · Privy embedded wallet · Mantle Sepolia (chainId 5003)

## Why we'll win

| Judging axis | AMANA |
|---|---|
| **Real pain point** | Mantle treasuries are leaving ~4%/yr on the table and have no auditable allocation policy. Verified with on-chain TVL data + real APY snapshots. |
| **Innovation (new primitive)** | Policy-as-data (strategy lives in versioned Markdown, not Solidity) + autonomous multi-agent debate with real veto authority + ERC-8004 per-decision attestation. Not a yield-aggregator fork, not a chatbot wrapper. |
| **Business potential** | Performance fee on attested outperformance (10% of yield above the do-nothing baseline) aligns AMANA with the treasury: you pay only when you provably win. Customers are DAO, protocol, and RWA-fund treasuries holding idle stables on Mantle. Concrete GTM: 3 design-partner treasuries in observe-only, then managed. |
| **Mantle-native** | Built specifically for the Mantle RWA stack (USDY, mUSD, Aave V3, MI4, ERC-8004). Complementary to each, not competitive: AMANA is inflow for them. Cannot port to another L2 without rewriting the asset adapters. |
| **Architectural rigor** | ERC-8004 reputation events + skills-first policy pattern + 45 Foundry tests + 55 Vitest tests + streaming Claude API + token cost meter. |
| **Shipped, not slidewared** | 15 live pages. 16 dynamic API endpoints. Multi-day git log of shippable evidence. Real Claude calls. Real on-chain attestation primitives. |

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
| Project name | AMANA |
| Slogan | Three AI agents managing your Mantle RWA treasury. Policy as Markdown. Every decision attested. |
| Description | Use "Description (long form)" above. |
| Tracks | Mantle AI Agents · Mantle RWA & DeFi |
| Demo URL | https://amana-iota.vercel.app |
| Repo URL | https://github.com/abdullahdevrangga11/amana |
| Video URL | https://youtu.be/<TBD> |
| Team | Devrangga Hazza Mahiswara (abdullahdevrangga@gmail.com) |
| Contract address | `<TBD>` (Mantle Sepolia, chainId 5003) |
| Verified on explorer | https://sepolia.mantlescan.xyz/address/<TBD> |
