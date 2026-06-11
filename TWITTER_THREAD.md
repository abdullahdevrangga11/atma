# Twitter / X Thread — ATMA Launch

Thread template for posting from `@abdullahdevrang` once submission is in.

**Tone**: factual, no hype words, no emoji wall, no "🚀". Engineers reading this.

---

## Tweet 1 (the hook)

```
i built ATMA — a treasury orchestration protocol on @0xMantle.

three AI agents allocate, monitor, and report. policy lives as markdown.
every decision is signed on-chain as an ERC-8004 reputation event.

3 days. 45 foundry tests. live deploy.

thread ↓
```

Attach: screenshot of the landing hero with FiddleHover effect mid-animation.

---

## Tweet 2 (the pain)

```
mantle treasuries hold stablecoins.
USDC → 0% APY
USDY → 4.42%
mUSD → ~4.6% via weekly rebasing
Aave V3 supply → moves intraday

nobody manages this. so treasuries either park USDC and bleed ~4%/yr, or pick one
asset and accept the rebalance work nobody has time for.
```

---

## Tweet 3 (the fix)

```
ATMA runs three claude sonnet 4.5 agents inside an ERC-4626 vault:

- AllocatorAgent → proposes weights
- RiskAgent → watches pegs, oracles, NAV; triggers defensive exit
- ReporterAgent → weekly digest vs 3 baselines

every reasoning blob hashed (SHA-256) and emitted on-chain.
```

Attach: screenshot of `/reports` showing the attestation feed.

---

## Tweet 4 (the architectural bet)

```
the bet: policy as data, not code.

each agent reads its skill from /skills/*.skill.md at runtime. policy update = git
commit. no redeploy. no contract upgrade. anyone audits the policy in a normal PR.

pattern is borrowed from @cross_beam — first prize, anthropic's Opus 4.6 hackathon.
```

Attach: screenshot of `/skills` viewer with the markdown loaded.

---

## Tweet 5 (the receipts)

```
proof:

- AtmaVault.sol: 374 lines, 11-state machine, ERC-8004 events
- 45 foundry tests, all green
- 3 typescript agents w/ zod-validated schemas
- 19 vitest unit tests
- next.js 16 + tailwind v4 + viem
- deployed to mantle sepolia (chainId 5003)

repo: github.com/abdullahdevrangga11/atma
```

---

## Tweet 6 (the demo)

```
3-min demo: <youtu.be/TBD>
live app:   atma-iota.vercel.app
contract:   <sepolia.mantlescan.xyz/address/TBD>

submission for @0xMantle Turing Test Hackathon 2026.

built solo in 3 days while sleeping. claude code did the heavy lift; i did the
architecture.
```

---

## Tweet 7 (call)

```
if you're working on AI-agent treasuries, on-chain attestation, or skills-first
agent architectures — DM. always interested in comparing notes.

🤝 @AnthropicAI for sonnet 4.5
   @0xMantle for the rails
   @cross_beam for the pattern
```

---

## Posting checklist

- [ ] All TBD links replaced (video, contract, vercel URL)
- [ ] Screenshots attached to tweets 1, 3, 4
- [ ] First tweet pinned to profile
- [ ] Reply to the original mantle hackathon announcement linking the thread
- [ ] Cross-post truncated version to LinkedIn (cut tweets 5-7, keep 1-4 + a "read more on X" link)
