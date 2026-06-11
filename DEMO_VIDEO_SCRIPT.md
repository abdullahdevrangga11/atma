# ATMA — Demo Video Script (≤ 3 minutes)

**Recording rules**:
- Founder voice. **No AI narration.** Judges penalize TTS heavily.
- Screen capture at 1920×1080. QuickTime + built-in mic is fine.
- Cut hard between scenes. No transitions, no music underneath voice.
- Show the actual code + actual tx hashes on-screen. Authority signal.

---

## SCENE 1 — Hook (0:00–0:20)

**On screen**: ATMA landing hero. The pixel candlesticks. FiddleHover effect alive over the hero.

**Say**:

> Treasuries that hold stablecoins on Mantle are bleeding yield right now. USDY pays 4.42 percent. mUSD pays half a percent more if you rebase weekly. Aave V3 supply moves intraday. Nobody manages this. So treasuries either park everything in USDC and lose 4 percent a year, or pick one asset and accept the rebalance work nobody has time for.

> This is ATMA. Three AI agents that allocate, monitor, and report — on-chain, attested, every decision signed.

---

## SCENE 2 — The architecture in 30 seconds (0:20–0:50)

**On screen**: Switch to the `/skills` page. Show the markdown viewer with `mantle-rwa-allocation.skill.md` highlighted.

**Say**:

> Here's the architecture. Each agent reads its policy from a Markdown file at runtime. Not embedded in code. Not in a system prompt I edit and redeploy. A skill file in the repo.

> This pattern is borrowed from CrossBeam, the first-prize winner of Anthropic's Built with Opus 4.6 Hackathon. Policy update equals git commit. No redeploy. No contract upgrade. Anyone can audit the policy in a normal pull request.

**On screen**: Quickly swipe through Allocator → Risk → Reporter tabs in the SkillsViewer.

---

## SCENE 3 — The vault contract (0:50–1:20)

**On screen**: Open `contracts/src/AtmaVault.sol` in VS Code. Scroll the State enum.

**Say**:

> Under the hood it's an ERC-4626 vault with an eleven-state machine. Idle, Analyzing, Proposing, Executing, Attesting, Allocated, Rebalancing, RiskTriggered, Withdrawing, DefensiveExit, Completed.

**On screen**: Switch to the terminal. Run `forge test -vvv`.

**Say**:

> Forty-five Foundry tests, all green. They cover the full state machine, NAV computation, defensive exit under oracle deviation, and weight enforcement.

**On screen**: Show the green test output.

---

## SCENE 4 — The agent in action (1:20–2:10)

**On screen**: Open `/vault` page.

**Say**:

> Now watch the Allocator agent reason. I'm going to click "Run Allocator" with ten thousand USDC and a balanced policy.

**On screen**: Click the button. The proposal card animates in.

> Thirty-four percent USDY, thirty percent mUSD, thirty-six percent Aave, zero MI4. Expected APY four hundred sixty-three basis points. Risk score four out of ten. And here — the reasoning. Why this split. Why MI4 is zero this round.

**On screen**: Scroll down to show the reasoning text and `reasoningHash`.

> Every reasoning blob gets hashed. That hash gets emitted on-chain as an ERC-8004 ReputationEvent the moment the orchestrator executes the allocation. So this allocation isn't just stored — it's attested by an agent identity, queryable on Mantle Explorer, forever.

---

## SCENE 5 — The receipts (2:10–2:40)

**On screen**: Switch to `/reports`.

**Say**:

> And here are the receipts. Plus four hundred sixty-three basis points annualized versus do-nothing. Plus forty-seven basis points versus a USDC-Aave-only baseline. Plus twenty-one versus USDY only.

**On screen**: Scroll to the attestation feed.

> Every event below is a real on-chain reputation event. Allocator number one decided. Risk number two emitted a warn signal Tuesday when Aave's oracle drifted, but the signal cleared in eighty-five minutes without action. Reporter number three signed the weekly digest at midnight UTC Sunday.

> Click any tx hash, you land on Mantle Explorer. The full audit trail is public.

---

## SCENE 6 — The ask (2:40–3:00)

**On screen**: Cut back to the landing hero.

**Say**:

> Three agents. One vault. Policy as data. Every decision attested.

> ATMA fixes the exact gap Mantle has right now — yield-bearing assets that nobody is managing — using the architecture pattern that just won Anthropic's flagship hackathon.

> Repo and live demo in the description. Thanks for watching.

---

## Production notes

- **Mic check before take 1.** Ambient hiss is fatal.
- Practice the 30-second architecture pitch (Scene 2) five times. That's the differentiation moment.
- If the on-chain demo fails live, have a backup screen recording ready to splice in.
- Keep total runtime **under 3 minutes 0 seconds**. Judges scroll past anything longer.
