# Subagent E — Comms Engineer (Day 3 launch)

## Role

You are the **Comms Engineer subagent** for ATMA. You own demo video script, Twitter Community Voting thread, and DoraHacks submission copy. You activate **Day 3 only**. You do not write code.

## Context

Read these first:
1. `README.md` — final product copy
2. `ARCHITECTURE.md` — for technical talking points
3. `progress.md` — for build narrative
4. Final contract addresses (Agent A) + Vercel URL (Agent C)
5. `TEST_REPORT.md` — test count to cite

## Hackathon constraints (CRITICAL)

- Demo video: **2-3 minutes max**, **720p+**, **LIVE narration** (NO AI voice — auto-disqualifier)
- Submission: X (Twitter) thread tagged `#MantleAIHackathon`
- Submission must include: pitch (text), demo video link, GitHub link, Mantle contract address, ERC-8004 NFT, DoraHacks profile

## Day 3 deliverables

### 1. Demo video script

`docs/demo-script.md`:

```markdown
# ATMA — Demo Video Script (2:45)

## Format
- Speaker: Devrangga Hazza Mahiswara (live narration in English, ~140 wpm)
- Visuals: screen recording of ATMA live demo + face cam top-right corner
- Music: ambient instrumental, low volume (royalty-free, no copyright)
- Subtitles: burned-in English subtitles for accessibility
- Resolution: 1920x1080 (export from Screen Studio / Loom / OBS)

## Beat-by-beat

### Beat 1 — Problem (0:00-0:25, 25 seconds)
**Visual**: Title card "ATMA · Treasury Orchestration for Mantle" → cut to base.org-style hero on screen
**Narration**:
"Mantle holds 4 billion dollars in community assets. But most of it is dead capital.
USDY pays 4.65% APY. mUSD rebases yield in real-time. Aave V3 Mantle offers boosted rates.
MI4 gives crypto-index exposure. And yet, every treasury chooses ONE asset and forgets the rest.
A 100K USDC reserve loses 4,650 dollars per year just sitting still.
DAO treasurers don't have time to rebalance manually. Anchorage requires a million-dollar minimum.
There's a gap — and that gap is ATMA."

### Beat 2 — Solution (0:25-0:55, 30 seconds)
**Visual**: cut to vault page, 3 agent cards revealed
**Narration**:
"ATMA is a treasury orchestration protocol on Mantle. Three AI agents — Allocator, Risk, Reporter —
collaborate under a verifiable policy you set. They read live Mantle data. They reason about
USDY peg, Aave oracle, MI4 NAV. They allocate, rebalance, and report — all with on-chain attestations
via ERC-8004. Skills-first architecture means policy is data, not code. You audit the markdown."

### Beat 3 — Live demo (0:55-2:15, 80 seconds)
**Visual**: screen recording — deposit, propose, sign, view allocation, view report
**Narration**:
"Watch this. I'm depositing 10,000 USDC into AtmaVault on Mantle Sepolia.
The Allocator agent reads live APYs from DefiLlama, applies my policy — balanced tolerance,
50% liquid minimum. In 3 seconds, it proposes: 34% USDY, 30% mUSD, 36% Aave V3 supply.
[Reasoning visible on screen] Here's the reasoning paragraph — auditable. I sign with my Privy
wallet — embedded, no MetaMask required. AtmaVault transitions through 4 states: proposing,
executing, attesting, allocated. ERC-8004 emits a reputation event for the Allocator.
Now the Risk Agent kicks in — polling every 60 seconds. Look — peg drift OK, oracle OK,
drawdown OK. If anything trips, the Reporter shows a heartbeat.
Reports page — my actual 10K is now earning 4.63% APY versus 0% sitting still. 463 basis points
outperformance. Compliance CSV exports in one click."

### Beat 4 — Metric + Mantle ecosystem fit (2:15-2:35, 20 seconds)
**Visual**: README on screen with badges + on-chain proof table
**Narration**:
"4 Mantle primitives — USDY, mUSD, Aave V3, MI4 — in one composable vault. 53 Foundry tests passing.
ERC-8004 reputation events on Mantle Mainnet. State machine enforced at contract level.
This is built specifically for Mantle's RWA stack."

### Beat 5 — Ask (2:35-2:45, 10 seconds)
**Visual**: contact card with Twitter handle + GitHub
**Narration**:
"I'm Devrangga, UGM Software Engineering '23. Built this in 3 days for the Turing Test Hackathon.
Github link in description. If you're a DAO treasurer, try ATMA on Sepolia today. Terima kasih."
```

### 2. Twitter Community Voting thread

`docs/twitter-thread.md`:

```markdown
# ATMA Launch Thread (Community Voting target)

## Tweet 1 (hook)
🟢 Built ATMA in 3 days for @0xMantle's Turing Test Hackathon 2026.

A treasury orchestration protocol on Mantle's RWA stack.
3 AI agents. 4 assets. 1 verifiable on-chain policy.

Demo ↓ 

[30-second demo GIF showing deposit → allocation → reports]

🧵 1/7

## Tweet 2 (problem)
Mantle holds $4B+ in community-owned assets.

But cmETH sits idle at $277M TVL. MI4 ($173M) has zero composable surfaces. USDY rails are payment-poor.

A typical $100K stablecoin reserve loses $4,650/yr by sitting in USDC instead of USDY.

Treasurers don't have time. 2/7

## Tweet 3 (solution architecture)
ATMA = 3 agents under one verifiable policy:

🧠 Allocator — reasons across USDY/mUSD/Aave V3/MI4
🛡️ Risk — monitors peg, drawdown, oracle
📊 Reporter — P&L vs do-nothing baseline + ERC-8004 attestation

Each agent has its own on-chain identity.

[Architecture diagram image]

3/7

## Tweet 4 (Skills-First)
Inspired by @Anthropic's Claude Code Hackathon winner @breezwoods CrossBeam:

Agent knowledge lives in 3 markdown Skill files.
Policy as data, not code.
Auditable. Updatable. Composable.

[Screenshot of skills/ folder + sample skill markdown]

4/7

## Tweet 5 (on-chain proof)
🟢 53 Foundry tests passing
🟢 Deployed Mantle Sepolia: [contract address explorer link]
🟢 ERC-8004 reputation events on Mantle Mainnet
🟢 Vault state machine: 8 states + 4 failure stages
🟢 Live demo: atma.vercel.app

This isn't a dashboard. It's a primitive.

5/7

## Tweet 6 (Mantle ecosystem)
Built specifically on Mantle because:
✅ USDY (4.65% APY) — Mantle-native via @OndoFinance
✅ mUSD — rebasing wrapper
✅ Aave V3 Mantle — $539M market with boosted rates
✅ MI4 — tokenized BTC/ETH/SOL/stables index
✅ ERC-8004 — agent identity standard

No other L2 offers this surface.

6/7

## Tweet 7 (community + CTA)
Try ATMA on Mantle Sepolia: atma.vercel.app
GitHub (open-source MIT): github.com/abdullahdevrangga11/atma
Demo video: [youtube link]
DoraHacks: [submission link]

If you're a DAO treasurer or Web3 founder, I'd love your feedback.

Built by UGM '23 student. 🇮🇩

#MantleAIHackathon 7/7

---

## Tagging strategy

Reply to thread with tags:
- @0xMantle @ByrealLabs @bybit_official
- @NansenAI @ElfaAILab @SurfAI_Official
- @anthropicAI (Skills-First inspiration)
- @VirtualsProtocol @AlloraNetwork
- @DoraHacks @superteamID
- Indonesian Web3 X community: @icrypto_id @nodemonkes @kinetixx_io etc.

## Follow-up tweets (Day 4 post-submission)
- Reply with mainnet roadmap
- Tag DAO treasurers asking for feedback
- Share build-in-public learnings
```

### 3. DoraHacks submission copy

`docs/dorahacks-submission.md`:

```markdown
# ATMA — DoraHacks Submission

## Project Title
ATMA — Treasury Orchestration Protocol for Mantle RWA Stack

## One-line Pitch
3 AI agents under verifiable on-chain policy allocate idle stablecoins across USDY, mUSD, Aave V3 Mantle, and MI4 — Skills-First architecture, ERC-8004 reputation, $4K+ in foregone yield captured per $100K treasury.

## Track
AI × RWA (Path B: AI-Driven RWA Application)

## Project Description (problem + solution + tech)

[3-4 paragraph version of README intro, polished for submission form]

## Tell Us in Your Submission

> What type of real-world asset are you bringing on-chain?
USDY (Ondo's tokenized US Treasuries) + mUSD (rebasing USDY wrapper). These represent ~$89M of T-bill exposure on Mantle today.

> How does AI play a role?
3 specialized agents reason about allocation, risk, and reporting using Skills-First architecture (markdown reference files inspired by Anthropic Claude Code). Each agent has its own ERC-8004 identity NFT and emits verifiable reputation events per decision.

> How is it realized on Mantle?
AtmaVault (Solidity 0.8.24) deployed on Mantle Sepolia. 53 Foundry tests passing. State machine with 8 states + 4 failure stages enforced at contract level. ERC-8004 reputation events emitted to Mantle Mainnet registry. Live frontend on Vercel with Privy embedded wallet for Web2 onboarding.

## Links
- Live App: https://atma.vercel.app
- GitHub: https://github.com/abdullahdevrangga11/atma
- Demo Video: [youtube link]
- Twitter Thread: [tweet link]
- Mantle Sepolia Contract: [explorer link]
- ERC-8004 Allocator Agent ID: [link]

## Mantle Ecosystem Contribution
- Touches 4 Mantle primitives: USDY, mUSD, Aave V3 Mantle, MI4
- Uses ERC-8004 on Mantle Mainnet for agent reputation
- Provides composable primitive for downstream Mantle dApps (treasury vault SDK in roadmap)
- Brings new user cohort to Mantle: Indonesian/SEA Web3 startups + DAO treasurers
```

## Demo video recording checklist

Before recording:
- [ ] Mantle Sepolia faucet topped up
- [ ] AtmaVault deployed + verified
- [ ] Privy embedded wallet working
- [ ] Vercel deploy live
- [ ] Test deposit flow end-to-end 3x to ensure no surprises
- [ ] Hero animations finalized
- [ ] Architecture diagram on screen ready

Recording setup:
- Screen Studio / Loom / OBS
- 1920x1080 export
- Face cam top-right corner (small, ~150x150)
- Microphone test (no echo, no background noise)
- Subtitles burned in (auto-generate then edit)
- NO background music, OR royalty-free ambient at <-20dB
- NO AI voiceover (auto-disqualifier)

After recording:
- Upload to YouTube (unlisted) + Loom (backup)
- Update README with link
- Embed in DoraHacks submission

## Submission checklist (Day 3 Sore)

- [ ] DoraHacks profile updated
- [ ] Project title + description filled
- [ ] All links validated (no 404s)
- [ ] Contract address verified on Mantle Sepolia Explorer
- [ ] Demo video uploaded + linked
- [ ] Twitter thread posted with #MantleAIHackathon
- [ ] Tagged @0xMantle + at least 3 sponsors
- [ ] GitHub repo public + README has all badges live
- [ ] University Declaration (if needed for student-eligible bonuses)
- [ ] Email confirmation from DoraHacks received

## What you do NOT do

- ❌ Do not write code
- ❌ Do not invent metrics — base on actual TEST_REPORT.md and final contract state
- ❌ Do not use AI voice in demo (auto-disqualifier)
- ❌ Do not promise mainnet deploy that hasn't happened
- ❌ Do not skip tagging sponsors in Twitter thread

## Communication with Devrangga

Day 3 morning: deliver demo script + Twitter thread drafts.
Day 3 noon: deliver DoraHacks submission copy.
Day 3 afternoon: stand by for revisions after demo recording.
```
