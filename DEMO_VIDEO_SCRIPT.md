# AMANA — Demo Video Script (3 minutes)

**Recording rules**:
- Founder voice. **No AI narration.** Judges actively penalise TTS.
- Screen capture at 1920×1080. QuickTime + built-in mic is fine.
- Cut hard between scenes. No transitions, no music underneath voice.
- Show actual code + actual reasoning hashes on-screen. That's the authority signal.
- Always have a fallback browser tab pre-loaded with the page open in case live calls hang.

Production URL: **https://amana-iota.vercel.app**

---

## SCENE 1 — Hook (0:00–0:18)

**On screen**: Landing hero. Cursor moves over hero text, FiddleHover digital scramble cells flicker.

**Say**:

> AMANA is treasury orchestration for Mantle. Three AI agents allocate idle USDC across the Mantle RWA stack: USDY from Ondo, a regulated, KYC-gated tokenized treasury, plus mUSD, Aave V3, and MI4. They run under a policy that lives as markdown, not code, with the compliance limits encoded right in that policy. Every decision is signed on-chain via ERC-8004 on Mantle Sepolia. It's a new primitive: policy-as-data, multi-agent debate, on-chain attestation. Not a yield-aggregator fork, not a chatbot. Here's a 3-minute tour.

---

## SCENE 2 — Architecture flow (0:18–0:40)

**On screen**: Scroll down past the hero to the animated architecture flow. A violet particle travels along the pipeline edges.

**Say**:

> Feeds in. Allocator drafts weights. Risk vetoes if needed. Reporter signs the digest. Each agent is its own ERC-8004 identity with reputation events emitted on Mantle Sepolia. Click any node and you land on that agent's profile page.

> Underneath, the architecture is real: a 374-line ERC-4626 vault in Solidity, 45 Foundry tests, three TypeScript agents on Claude Sonnet 4.5. The whole chain runs end-to-end on Mantle.

---

## SCENE 3 — Live orchestration with debate (0:40–1:20)

**On screen**: Navigate to `/vault`. Toggle "Debate mode" ON. Hit "Run orchestration".

**Say**:

> Debate mode forces Risk to see a stressed oracle. Hit run, and the state machine animates. Allocator's reasoning streams in live (that's actual Claude output, token by token). Allocator proposes thirty-four percent USDY, thirty percent mUSD, thirty-six percent Aave.

**On screen**: Veto banner pops, Allocator card flips to "attempt 2".

> Risk just vetoed: it flagged the Aave V3 oracle on Mantle as stressed, a protocol-health risk, too risky to allocate there this round. The exact veto reason gets injected back into Allocator's system prompt as a hard constraint. Allocator re-drafts, pulling back from Aave. Risk approves the second pass. Reporter signs the digest.

> The cost meter shows what this run cost in tokens, about three-tenths of a cent. That's the point of building on Mantle: gas is cheap enough that agents can rebalance this often. On an L1 the gas would eat the alpha.

---

## SCENE 4 — The conversation view (1:20–1:50)

**On screen**: After the run finishes, click the "View this run as an agent conversation" button (just above the agent cards). New page loads.

**Say**:

> Here's the same run as a Slack-style chat between the agents. Allocator's first message is the original proposal. Risk replies with a quoted veto, citing the stressed Aave oracle. Allocator's second message: "honoured the veto, here's a revised proposal." Risk approves. Reporter posts the digest.

> This is autonomous agent coordination, with a real veto, settled on a public chain. Not a chatbot wrapper, not a yield-aggregator clone. Every message carries an ERC-8004 reputation hash you can verify on Mantle.

---

## SCENE 5 — Backtest replay (1:50–2:15)

**On screen**: Navigate to `/backtest`. Slider on 6 weeks. Hit run.

**Say**:

> Backtest replays N weeks of synthetic market history through the full agent chain. Real Claude calls every week. The chart draws itself as each week settles. Six weeks runs in about forty seconds.

**On screen**: Chart fills, summary card lands.

> Plus three hundred twelve basis points cumulative over six weeks. Plus eighty-four versus USDC-Aave-only. One defensive exit triggered. Total cost, six and a half cents.

> Who pays us: DAOs and on-chain treasuries sitting on idle stablecoins, on a basis-points fee for the yield we capture above their do-nothing baseline.

---

## SCENE 6 — Policy as data (2:15–2:40)

**On screen**: Navigate to `/skills`. Click Edit on the AllocatorAgent skill. Tighten the compliance cap: change `maxUnregulatedBps: 5000` to `maxUnregulatedBps: 0`. Hit "Run baseline".

**Say**:

> Here's the killer demo, and it's the compliance story. I edit the Allocator's skill, just markdown. This cap limits exposure to the permissionless venues, Aave and MI4, the assets outside the regulated USDY and mUSD sleeve. I'll set it to zero. Hit "Run baseline".

**On screen**: Two columns appear. The right column allocates entirely within the regulated USDY and mUSD instruments.

> Same input, different policy, different proposal. The Allocator read the compliance limit and stayed entirely inside the regulated sleeve. No redeploy, no contract upgrade. The skill is in source control, so every compliance change is a git commit, and every commit is queryable. That is compliance as versioned, attested data.

**On screen**: Scroll to system prompt inspector, click "show".

> And here's the exact prompt sent to Claude, with my edit live. Radical transparency.

---

## SCENE 7 — On-chain receipts (2:40–2:55)

**On screen**: Navigate to `/reports`. Attestation feed table is visible, each row carrying an ERC-8004 reasoning hash. Click a hash, which opens `sepolia.mantlescan.xyz` in a new tab on the AmanaVault contract's emitted reputation event.

**Say**:

> Reports pulls this deployment's real orchestration history. Every row is a signed agent decision. Now the on-chain proof: back on the vault page, this panel reads live state straight from the deployed AmanaVault contract over RPC, no wallet, no gas. I'll click "View AmanaVault on Mantlescan". Here is the contract on Mantle Sepolia, with the deposit, the allocation, and the ERC-8004 reputation events as confirmed transactions. A real regulated asset managed on-chain, end-to-end, no Web3 knowledge required. The loop ran on Mantle, not in a notebook.

**On screen**: Cut back to `/network`.

> Network is the cumulative ledger: fifteen runs, forty-five attestations, four cents total cost, plus two hundred ninety-eight basis points average outperformance. Every run gets a permalink that unfurls as a proper Twitter card.

---

## SCENE 8 — The ask (2:55–3:00)

**On screen**: Cut to landing hero.

**Say**:

> Three agents. One vault. Policy as data. Every decision attested. amana-iota dot vercel dot app. Thanks for watching.

---

## Production notes

- **Mic check before take 1.** Ambient hiss is fatal.
- The 30-second moment is Scene 4 (conversation view). Practice it five times.
- If a live Claude call hangs during recording, cut away to the cached browser tab.
- Total runtime target: 2:58–3:02. Anything over 3:05 reads as undisciplined.
- Show reasoning hashes on-screen wherever they appear. They're the proof.

---

## Backup demo path (1-minute cut for X/LinkedIn)

If the 3-min is too long for some platforms:

1. (0:00–0:10) Hero + architecture
2. (0:10–0:30) Vault debate run (Risk veto on stressed oracle) + conversation view
3. (0:30–0:50) Skills edit + comparison
4. (0:50–1:00) Reports + Mantlescan attestation + share URL

---

<!--
RUBRIC COVERAGE MAP (for the human to verify before recording, not spoken)

Technical (30%): core functionality runs end-to-end ON MANTLE
  - Scene 3: live orchestration chain runs (Allocator -> Risk veto -> redraft -> Reporter).
  - Scene 7: REAL on-chain proof. Click an ERC-8004 reasoning hash, open it on
    sepolia.mantlescan.xyz, show the confirmed tx + AmanaVault contract + logged hash.
    Spoken proof line: "the whole loop ran end-to-end on Mantle, not in a notebook."

Ecosystem fit (20%): name the Mantle integrations on screen
  - Scene 1: "USDY from Ondo, mUSD, Aave V3, and MI4" named out loud.
  - Scene 2 + Scene 7: ERC-8004 reputation events emitted on Mantle Sepolia.

Business potential (20%): who uses this + revenue model
  - Scene 5: "DAOs and on-chain treasuries sitting on idle stablecoins, on a
    basis-points fee for the yield we capture above their do-nothing baseline."

Innovation (20%): framed as a NEW primitive, contrasted vs forks/clones
  - Scene 1: "a new primitive: policy-as-data plus multi-agent debate plus
    on-chain attestation. Not a yield-aggregator fork, not a chatbot."
  - Scene 4: "Not a chatbot wrapper, not a yield-aggregator clone."

UX (10%): slick flow
  - Scene 1 FiddleHover hero, Scene 3 streaming reasoning + cost meter,
    Scene 4 conversation view (the wow moment), Cmd+K available throughout.

=== PART B: AI & RWA TRACK SCORECARD (Mantle judges) ===

AI x RWA integration depth (15 pts): AI drives real decisions, output is verifiable/auditable
  - Scene 3: AI agents (real Claude output) draft + veto + redraft the actual
    on-chain portfolio weights. The decision is the allocation, not a chat reply.
  - Scene 7: every decision is auditable via ERC-8004 reasoning hash on Mantlescan.

Mantle network integration (10 pts): settlement layer + gas economics + Mantle-native RWA
  - Scene 1: Mantle-native RWA stack named (USDY/Ondo, mUSD, Aave V3, MI4).
  - Scene 3 (gas economics): "gas is cheap enough that agents can rebalance this
    often. On an L1 the gas would eat the alpha." Explicit low-gas-L2 rationale.
  - Scene 7: Mantle Sepolia is the settlement layer; vault emits events on-chain.

Compliance awareness (10 pts): KYC/regulated assets + policy-encoded caps the AI respects
  - Scene 1: "USDY, a regulated, KYC-gated tokenized treasury" + "compliance
    limits encoded right in that policy."
  - Scene 6: edit maxUnregulatedBps to 0 in the policy markdown; the Allocator
    reads the compliance cap and allocates entirely inside the regulated
    USDY/mUSD sleeve. Compliance as versioned, attested data. The RiskAgent
    also enforces the cap as a hard backstop (vetoes any breach).
  - Note: Scene 3's veto is a risk/oracle veto (stressed Aave oracle), which is
    what Debate mode reliably triggers. Do not call it a compliance veto on
    camera; the compliance story is Scene 6.

Path B RWA Application (10 pts): regulated asset class + treasury users + no-Web3 UX
  - Scene 1: regulated asset class = USDY (Ondo tokenized treasuries).
  - Scene 5: treasury users specified = "DAOs and on-chain treasuries sitting on
    idle stablecoins."
  - Scene 7: "real regulated asset managed on-chain, end-to-end... never connected
    a wallet: read-only on-chain, no Web3 knowledge required."

Execution & demo quality (5 pts): MVP deployed on Mantle + real asset + repo/address
  - Scene 7: live deployment on Mantle Sepolia, confirmed tx, AmanaVault contract
    address visible on Mantlescan. Production URL + repo in submission.
-->


