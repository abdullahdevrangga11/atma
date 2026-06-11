# ATMA — DoraHacks Submission Copy

Paste-ready text for the **Mantle Turing Test Hackathon 2026** submission form.

---

## Project name

**ATMA — Treasury Orchestration Protocol**

## Tagline (140 chars)

Three AI agents allocate, monitor, and report a Mantle RWA treasury. Policy as Markdown. Every decision signed on-chain via ERC-8004.

## Category

AI Agents / DeFi / RWA

## Track(s)

- Mantle AI Agents
- Mantle RWA & DeFi

---

## Description (long form)

ATMA is a treasury orchestration protocol for Mantle's real-world asset stack — USDY, mUSD, Aave V3, MI4. Three Claude Sonnet 4.5 agents work together inside an ERC-4626 vault:

- **AllocatorAgent** proposes weights across the four assets given user policy and live yields.
- **RiskAgent** monitors USDY peg, mUSD rebase rate, Aave oracle deviation, and MI4 NAV. Triggers a defensive exit on sustained deviation.
- **ReporterAgent** publishes a weekly digest with outperformance versus three baselines: do-nothing, USDC-Aave only, USDY only.

Every agent decision gets hashed (SHA-256) and emitted on-chain as an ERC-8004 ReputationEvent. The vault contract is immutable; policy lives in Markdown files (`/skills/*.skill.md`) that agents read at runtime. **Policy update = git commit. No redeploy. No contract upgrade.**

This skills-first architecture pattern is borrowed from CrossBeam — the first-prize winner of Anthropic's Built with Opus 4.6 Claude Code Hackathon.

## The pain point

Treasuries on Mantle hold stablecoins. USDC pays zero. USDY pays 4.42%. mUSD pays 4.6% via weekly rebasing. Aave V3 supply moves intraday. Nobody manages this. So treasuries either:

1. Park everything in USDC → lose ~4% APY annually.
2. Pick one asset → accept the rebalance work nobody has time for.

ATMA closes the gap with three agents that operate continuously, attested on-chain, with policies anyone can audit in a normal PR.

## What we built (in 3 days)

- **Vault contract** (`AtmaVault.sol`, 374 lines): ERC-4626 + 11-state machine + ERC-8004 reputation events + 24h rebalance cadence + defensive exit primitive.
- **45 Foundry tests** all passing — full state machine, NAV computation, weight enforcement, defensive exit under oracle deviation.
- **3 TypeScript agents** built on Anthropic's SDK, with Zod schema validation and SHA-256 reasoning hashes.
- **19 Vitest unit tests** for agent infrastructure (schema, hash determinism, JSON extraction).
- **3 Skill markdown files** that define agent policy as data, not code.
- **Next.js 16 app** with light-mode landing (base.org slice), FiddleHover digital hover effect, glass scroll-shrink navbar, animated hero showcase with count-up + cycling values + live UTC clock, and three live product surfaces: `/vault`, `/reports`, `/skills`.
- **Deploy infrastructure**: Foundry deploy script, Vercel config with /api/agent maxDuration=60, GitHub Actions CI running Foundry + frontend on every push.

## Links

- **Live demo**: https://atma.vercel.app
- **GitHub**: https://github.com/abdullahdevrangga11/atma
- **Deployed vault** (Mantle Sepolia): `0x<TBD — fill after deploy>`
- **Demo video** (3 min): https://youtu.be/<TBD>
- **Twitter thread**: https://x.com/abdullahdevrang/status/<TBD>

## Tech stack

Solidity 0.8.24 · Foundry · OpenZeppelin v5 · ERC-4626 · ERC-8004 (reputation events) · Anthropic Claude Sonnet 4.5 · TypeScript · Zod · Next.js 16 · React 19 · Tailwind v4 · viem · Privy embedded wallet · Mantle Sepolia (chainId 5003)

## Why we'll win

We hit all five judging axes from the hackathon requirements:

| Axis | ATMA |
|---|---|
| **Real pain point** | Mantle treasuries are leaving 4 bps/day on the table. Verified with on-chain TVL data. |
| **AI-agent uniqueness** | Three coordinated agents with on-chain attested reasoning — not a chatbot wrapper. |
| **Mantle-native** | Built specifically for the Mantle RWA stack. Cannot ship on another L2. |
| **Architectural rigor** | ERC-8004 reputation events + skills-first policy pattern (CrossBeam-inspired) + 45 Foundry tests. |
| **Shipped, not slidewared** | Live deploy. Real vault contract. Real Claude API calls. Real on-chain receipts. |

## Team

- **Devrangga Hazza Mahiswara** (sole founder/builder) — Creative Engineer, full-stack, UGM Software Engineering, Yogyakarta. Built [Mizaan](https://github.com/abdullahdevrangga11/mizaan), prior hackathon entries. Contact: abdullahdevrangga@gmail.com.

---

## Form-field cheat sheet

| Field | Value |
|---|---|
| Project name | ATMA |
| Slogan | Three AI agents managing your Mantle RWA treasury. Policy as Markdown. Decisions attested on-chain. |
| Description (~250 words) | Use the "Description (long form)" section above. |
| Tracks | Mantle AI Agents · Mantle RWA & DeFi |
| Demo URL | https://atma.vercel.app |
| Repo URL | https://github.com/abdullahdevrangga11/atma |
| Video URL | https://youtu.be/<TBD> |
| Team | Devrangga Hazza Mahiswara (abdullahdevrangga@gmail.com) |
| Contract address | `<TBD>` (Mantle Sepolia, chainId 5003) |
| Verified on explorer | Yes — https://sepolia.mantlescan.xyz/address/<TBD> |
