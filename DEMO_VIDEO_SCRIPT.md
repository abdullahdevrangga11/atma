# ATMA — Demo Video Script (3 minutes)

**Recording rules**:
- Founder voice. **No AI narration.** Judges actively penalise TTS.
- Screen capture at 1920×1080. QuickTime + built-in mic is fine.
- Cut hard between scenes. No transitions, no music underneath voice.
- Show actual code + actual reasoning hashes on-screen. That's the authority signal.
- Always have a fallback browser tab pre-loaded with the page open in case live calls hang.

Production URL: **https://atma-iota.vercel.app**

---

## SCENE 1 — Hook (0:00–0:18)

**On screen**: Landing hero. Cursor moves over hero text, FiddleHover digital scramble cells flicker.

**Say**:

> ATMA is treasury orchestration for Mantle. Three AI agents allocate USDC across the RWA stack — USDY, mUSD, Aave, MI4 — under a verifiable policy that lives as markdown, not code. Every decision is signed on-chain via ERC-8004. Here's a 3-minute tour.

---

## SCENE 2 — Architecture flow (0:18–0:40)

**On screen**: Scroll down past the hero to the animated architecture flow. A violet particle travels along the pipeline edges.

**Say**:

> Feeds in. Allocator drafts weights. Risk vetoes if needed. Reporter signs the digest. Each agent is its own ERC-8004 identity with reputation events emitted on Mantle. Click any node and you land on that agent's profile page.

> Underneath, the architecture is real — 374 lines of vault Solidity, 45 Foundry tests, three TypeScript agents on Claude Sonnet 4.5.

---

## SCENE 3 — Live orchestration with debate (0:40–1:20)

**On screen**: Navigate to `/vault`. Toggle "Debate mode" ON. Hit "Run orchestration".

**Say**:

> Debate mode forces Risk to see a stressed oracle. Hit run, and the state machine animates. Allocator's reasoning streams in live — that's actual Claude output, token by token. Allocator proposes thirty-four percent USDY, thirty percent mUSD, thirty-six percent Aave.

**On screen**: Veto banner pops, Allocator card flips to "attempt 2".

> Risk just vetoed. The exact veto reason gets injected back into Allocator's system prompt as a constraint. Allocator re-drafts, this time with Aave reduced. Risk approves the second pass. Reporter signs the digest.

> The cost meter at the top shows exactly what this orchestration cost in tokens — about three-tenths of a cent per run.

---

## SCENE 4 — The conversation view (1:20–1:50)

**On screen**: Click "Conversation view" button. New page loads.

**Say**:

> Here's the same run rendered as a Slack-style chat between the agents. Allocator's first message — the original proposal. Risk replies as a quoted veto, calling out the flagged signal. Allocator's second message — "honoured the veto, here's a revised proposal." Risk approves. Reporter posts the digest.

> This is autonomous agent coordination on a public chain. Not a chatbot wrapper. Every message has an ERC-8004 reputation hash you can verify.

---

## SCENE 5 — Backtest replay (1:50–2:15)

**On screen**: Navigate to `/backtest`. Slider on 6 weeks. Hit run.

**Say**:

> Backtest replays N weeks of synthetic market history through the full agent chain. Real Claude calls every week. The chart draws itself as each week settles. Six weeks runs in about forty seconds.

**On screen**: Chart fills, summary card lands.

> Plus three hundred twelve basis points cumulative over six weeks. Plus eighty-four versus USDC-Aave-only. One defensive exit triggered. Total cost — six and a half cents.

---

## SCENE 6 — Policy as data (2:15–2:40)

**On screen**: Navigate to `/skills`. Click Edit on the AllocatorAgent skill. Change `maxMi4Bps: 1500` to `maxMi4Bps: 0`.

**Say**:

> Here's the killer demo. I edit the Allocator's skill — just markdown. I'll cap MI4 at zero. Hit "Run comparison".

**On screen**: Two columns appear with different allocations.

> Same input. Different policy. Different proposal. No redeploy. No contract upgrade. The skill is in source control — every policy change is a git commit, every git commit is queryable.

**On screen**: Scroll to system prompt inspector, click "show".

> And here's the exact prompt sent to Claude — with my edit live. Radical transparency.

---

## SCENE 7 — Receipts (2:40–2:55)

**On screen**: Navigate to `/reports`. Then `/network`.

**Say**:

> Reports pulls from this deployment's real orchestration history. Network shows cumulative metrics — fifteen runs, forty-five attestations, four cents total cost, plus two hundred ninety-eight basis points average outperformance.

**On screen**: Click any tx in the attestation feed → lands on a run permalink with the OG image.

> Every run gets its own permalink. Paste it into Twitter — it unfurls as a proper card.

---

## SCENE 8 — The ask (2:55–3:00)

**On screen**: Cut to landing hero.

**Say**:

> Three agents. One vault. Policy as data. Every decision attested. atma-iota dot vercel dot app. Thanks for watching.

---

## Production notes

- **Mic check before take 1.** Ambient hiss is fatal.
- The 30-second moment is Scene 4 (conversation view). Practice it five times.
- If a live Claude call hangs during recording, cut away to the cached browser tab.
- Total runtime target: 2:58–3:02. Anything over 3:05 reads as undisciplined.
- Show reasoning hashes on-screen wherever they appear — they're the proof.

---

## Backup demo path (1-minute cut for X/LinkedIn)

If the 3-min is too long for some platforms:

1. (0:00–0:10) Hero + architecture
2. (0:10–0:30) Vault debate run + conversation view
3. (0:30–0:50) Skills edit + comparison
4. (0:50–1:00) Reports + cost meter + share URL
