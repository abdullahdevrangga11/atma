# 📤 SUBMIT.md — Submission Day Checklist

**One-page checklist.** Print this. Tick boxes as you go.

Deadline: **2026-06-15 15:59 UTC** · You have ~75 hours.

---

## ✅ Step 0 — Right now (5 min) · BLOCKER

Without this, `/vault` returns 500 and judges see broken pages.

```bash
./scripts/setup-submission.sh
```

That single command:
- Generates a fresh Mantle Sepolia deployer wallet
- Prompts you for your `GEMINI_API_KEY`
- Pushes env vars to Vercel production
- Optionally runs the forge deploy
- Triggers `vercel --prod` redeploy

After it finishes, verify:
```bash
./scripts/smoke-test.sh
# Should print: ok=26 fail=0
```

---

## ✅ Step 1 — Deploy contracts (10 min)

If you skipped this in Step 0:

```bash
# Get faucet first
open https://faucet.sepolia.mantle.xyz
# Paste your deployer address (printed by setup-submission.sh), request 0.5 MNT

# Then deploy
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.sepolia.mantle.xyz \
  --broadcast -vvv
cd ..
```

The script logs every contract address. **Copy the AtmaVault address** — you'll need it for Step 3.

---

## ✅ Step 2 — Record demo video (90 min)

1. Open `DEMO_VIDEO_SCRIPT.md` in a separate window
2. Pre-load `https://atma-iota.vercel.app` in your browser
3. QuickTime → New Screen Recording
4. Record 4–5 takes, target 2:58–3:02
5. Pick the best, trim ends if needed
6. Upload to YouTube as **unlisted**
7. Copy the YouTube URL

**Tone reminders**:
- Founder voice. NO TTS. Judges actively penalise AI narration.
- Scene 4 (conversation view) is your wow moment. Practice 5×.
- Show real hashes on screen — that's the authority signal.

For the YouTube description, paste the contents of `YOUTUBE_DESCRIPTION.md` (auto-generated below).

---

## ✅ Step 3 — Finalize docs (2 min)

```bash
./scripts/finalize-submission.sh \
  https://youtu.be/YOUR_VIDEO_ID \
  0xYOUR_ATMAVAULT_ADDRESS

git add -A
git commit -m "docs: finalize submission URLs"
git push
```

This replaces every `<TBD>` placeholder across:
- `DEMO_VIDEO_SCRIPT.md`
- `DORAHACKS_SUBMISSION.md`
- `TWITTER_THREAD.md`
- `README.md`

---

## ✅ Step 4 — DoraHacks form (10 min)

1. Go to https://dorahacks.io/hackathon/mantleturingtesthackathon2026
2. Click Submit Project
3. Open `DORAHACKS_SUBMISSION.md` in a separate window
4. Paste section by section:
   - Name → `ATMA — Treasury Orchestration Protocol`
   - Tagline → from doc
   - Description (long) → from "Description (long form)" heading
   - Demo URL → `https://atma-iota.vercel.app`
   - Repo URL → `https://github.com/abdullahdevrangga11/atma`
   - Video URL → your YouTube
   - Contract address → your AtmaVault address
5. Use the cheat-sheet table at the bottom of the doc

---

## ✅ Step 5 — Twitter thread (10 min)

1. Open `TWITTER_THREAD.md`
2. Go to `x.com/compose/tweet`
3. Tweet 1 — paste, attach landing screenshot, send
4. Click "Add another tweet" — paste tweet 2, attach if specified, send
5. Repeat through tweet 9
6. **Pin tweet 1** to your profile
7. Reply to the original Mantle hackathon announcement linking your tweet 1

---

## ✅ Step 6 — LinkedIn (5 min)

Copy tweets 1-4 + the closing paragraph from the bottom of `TWITTER_THREAD.md`. Post from your profile.

---

## ✅ Step 5b — GitHub repo polish (1 min, optional but recommended)

Makes the repo look professional when judges click through.

```bash
./scripts/github-setup.sh
```

Sets description, homepage, topics, and cuts a v1.0.0 release tag.

---

## ✅ Step 5c — Tweet via intent URLs (10 min, fastest path)

Instead of manually copy-pasting from `TWITTER_THREAD.md`:

```bash
./scripts/post-tweets.sh open
```

Opens each of the 9 tweets in `twitter.com/intent/tweet?text=...` — pre-filled composer windows. Hit Send 9 times. Pin tweet 1.

For each tweet after the first, click "Reply" on your previous tweet to thread them.

---

## ✅ Step 7 — Final sanity check (10 sec)

One command runs every verification:

```bash
./scripts/submission-check.sh
```

Verifies all 26 routes, env vars, tests (vitest + foundry), TBD placeholders, git state, and external services. Prints a green/yellow/red verdict.

Exits 0 = GO. Anything else = fix before submitting.

---

## 📊 What you have

- ✅ Live production at https://atma-iota.vercel.app
- ✅ 15 pages, 16 API endpoints, 55 vitest + 45 Foundry tests green
- ✅ Real Claude/Gemini orchestration with debate loop, streaming, cost meter
- ✅ Skills marketplace + linter + fork lineage viz + A/B + backtest
- ✅ ERC-8004 attestation primitives with on-chain wire-up ready
- ✅ Conversation view, agent identity pages, run permalinks, OG cards
- ✅ Cmd+K palette, dissolve transitions, React Flow diagrams
- ✅ Submission docs, smoke tests, automation scripts

## 💰 Expected total cost

- Vercel: **$0** (Hobby tier)
- Gemini Flash: **~$1–2** for everything (judges + your testing)
- Mantle Sepolia: **$0** (testnet)
- Domain: **$0** (vercel.app subdomain)
- **TOTAL: under $2**

Your Rp 200k Gemini credit is wildly safe.

---

**Built solo in 4 days. Yogyakarta, June 2026. Now go ship it.** 🚀
