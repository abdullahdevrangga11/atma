# Twitter / X Thread — AMANA Launch

Thread template for posting from `@abdullahdevrang` once submission is in.

**Tone**: factual, no hype words, no emoji wall, no rocket emojis. Engineers reading this.

---

## Tweet 1 (the hook)

```
i built AMANA — a treasury orchestration protocol on @0xMantle.

three AI agents (allocator, risk, reporter) coordinate inside an
ERC-4626 vault. policy lives as markdown. every decision signed
on-chain via ERC-8004.

3 days. 45 foundry tests. 11 pages. live demo below.

thread ↓
```

Attach: screenshot of the landing hero with FiddleHover effect mid-animation.

---

## Tweet 2 (the pain)

```
mantle treasuries hold stablecoins.
- USDC → 0% APY
- USDY → 4.42%
- mUSD → ~4.6% via weekly rebasing
- Aave V3 → moves intraday

nobody manages this. so treasuries either park USDC and bleed ~4%/yr,
or pick one asset and accept the rebalance work nobody has time for.
```

---

## Tweet 3 (the architecture)

```
AMANA runs three claude sonnet 4.5 agents inside an ERC-4626 vault:

→ AllocatorAgent proposes weights under your policy
→ RiskAgent monitors pegs, oracles, NAV; has VETO AUTHORITY
→ ReporterAgent signs the weekly digest

every reasoning blob hashed (SHA-256) and emitted on-chain.
```

Attach: screenshot of `/vault` mid-orchestration with state machine animating.

---

## Tweet 4 (the wow — debate loop)

```
the killer feature: when Risk vetoes, Allocator re-drafts.

the exact veto reason gets injected into Allocator's system prompt
as a constraint. it's not a chatbot wrapper — it's autonomous
coordination on a public chain.

view it as a chat ↓
amana-iota.vercel.app/conversation/[id]
```

Attach: screenshot of `/conversation/[runId]` showing Risk's quoted reply to Allocator.

---

## Tweet 5 (policy as data)

```
the bet: policy as data, not code.

each agent reads its skill from /skills/*.skill.md at runtime.
policy update = git commit. no redeploy. no contract upgrade.
anyone audits the policy in a normal PR.

borrowed pattern from @cross_beam — first prize, anthropic's Opus
4.6 hackathon.
```

Attach: screenshot of `/skills` with the markdown loaded next to the diff view.

---

## Tweet 6 (would it work?)

```
backtest sandbox replays N weeks through the FULL agent chain.
real claude calls per week. chart draws as each week settles.

6 weeks:
+312 bps cumulative
+84 bps vs USDC-Aave-only
+47 bps vs USDY-only
1 defensive exit triggered
total cost: $0.065
```

Attach: screenshot of `/backtest` with the summary stats.

---

## Tweet 7 (the receipts)

```
proof of work:

- AmanaVault.sol: 374 lines, 11-state machine, ERC-8004 events
- 45 foundry tests, all green
- 3 typescript agents w/ zod-validated schemas
- 39 vitest unit tests
- streaming claude API + token cost meter
- next.js 16 + tailwind v4 + viem + react flow
- 11 page routes, 11 API endpoints

repo: github.com/abdullahdevrangga11/amana
```

---

## Tweet 8 (the demo)

```
3-min demo: <youtu.be/TBD>
live app:   amana-iota.vercel.app
contract:   <sepolia.mantlescan.xyz/address/TBD>

submission for @0xMantle Turing Test Hackathon 2026.

every /runs/[id] permalink has an OG image that unfurls as a
twitter card. share any run, share the proof.
```

Attach: example OG card image.

---

## Tweet 9 (the credits)

```
🤝 @AnthropicAI — sonnet 4.5 streaming + agent orchestration
   @0xMantle — host network + ERC-8004 reputation registry
   @cross_beam — the policy-as-data architectural pattern

if you're working on AI-agent treasuries, on-chain attestation, or
skills-first agent design — DM. always interested in comparing notes.
```

---

## Posting checklist

- [ ] All `<TBD>` links replaced (video, contract, vercel URL is already correct)
- [ ] Screenshots attached to tweets 1, 3, 4, 5, 6, 8
- [ ] First tweet pinned to profile
- [ ] Reply to the original Mantle hackathon announcement linking the thread
- [ ] Cross-post tweets 1-5 to LinkedIn with a "read full thread on X" CTA

---

## LinkedIn version (cut down to 4 tweets)

Keep tweets 1–4 (the hook + pain + architecture + debate). Add a single LinkedIn-style closing paragraph:

```
Open-source MIT. Live demo at amana-iota.vercel.app. Repo on GitHub.
If you're working on autonomous-agent treasuries, on-chain attestation,
or skills-first agent design, I'd love to compare notes.
```
