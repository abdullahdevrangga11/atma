# ATMA — Build Log

> CrossBeam-pattern build log. One section per session. Append, never rewrite.

---

## 2026-06-08 — Day 0: research and target lock

- Scraped the Mantle Turing Test Hackathon 2026 requirements + judging criteria.
- Deep pain-point research across Mantle's RWA stack (USDY, mUSD, Aave V3, MI4).
- Forensic ranking: "treasury holders losing 4%/yr to inaction on Mantle" wins on pain sharpness + Mantle-nativity + buildable-in-3-days.
- Analyzed 7 winning projects from Anthropic's Built with Opus 4.6 Hackathon — extracted the **skills-first architecture** pattern from CrossBeam.

**Decision**: build a 3-agent treasury orchestrator. Borrow CrossBeam's "policy as markdown" pattern. Differentiate via on-chain ERC-8004 attestation.

---

## 2026-06-09 — Day 1: foundation + UI slice

- Bootstrapped Next.js 16 + React 19 + Tailwind v4 + TypeScript repo at `~/Documents/code/atma`.
- Installed Foundry, configured `contracts/foundry.toml`.
- Built first UI slice from base.org (light mode, pixel candlesticks, centered hero).
- Rejected first UI (too vibecoded). Redesigned to opinionated engineering aesthetic.
- Iterated 3 more times until matching base.org whitespace, animation cadence, nav behavior.

---

## 2026-06-10 — Day 2: substance pivot

- Honest substance audit: "udah oke belom?" — no. Substance was 30% there, UI was 90%.
- Hard pivot to the contract + agent layer.

**Shipped**:
- `AtmaVault.sol` — 374 lines, ERC-4626 + 11-state machine + ERC-8004 reputation events + 24h rebalance cadence + defensive exit primitive.
- 5 mock contracts (MockUSDC/USDY/mUSD/AavePool/MI4) so the demo is reproducible without depending on live RWA bridge testnets.
- 45 Foundry tests, all green: state machine, NAV computation, weight enforcement, defensive exit under oracle deviation.
- 3 TypeScript agents (Allocator / Risk / Reporter) on `@anthropic-ai/sdk`, model `claude-sonnet-4-5-20250929`.
- `BaseAgent` reads skill markdown at runtime, strips code fences, validates JSON, hashes reasoning via SHA-256.
- 3 skill markdown files: `mantle-rwa-allocation.skill.md`, `mantle-risk-monitoring.skill.md`, `treasury-reporting.skill.md`.
- `/api/agent` route with discriminated union (action: propose | checkRisk | report).
- Zod schemas for every input/output.

---

## 2026-06-11 — Day 3: product surfaces + ship infra

**Frontend surfaces**:
- Glass scroll-shrink navbar with `rAF`-throttled scroll listener (threshold 60px → bg-white/85, full border, shadow, h-12).
- FiddleHover digital effect ported from `codegrid-fiddle-digital` — applied to the entire hero with ATMA symbols (`$`, `bps`, `▲`, `Σ`).
- HeroShowcase animated card: NAV count-up, +bps glow-pulse, allocation bars staggered fill, cycling tx hashes, live UTC clock.
- shadcn/ui primitives (Button, Card, Badge, Input) with cva variants.
- `/vault` page wired to real `/api/agent` POST with Claude. Renders proposal weights, expected APY, risk score, reasoning, hash.
- `/reports` dashboard: +463 bps vs do-nothing headline, 3 baseline comparison cards, reporter reasoning code block, ERC-8004 attestation feed table with 5 events.
- `/skills` viewer: tabbed markdown viewer with line numbers, copy-to-clipboard, file metadata.

**Test infra**:
- Vitest config + 19 unit tests across `lib/agents/__tests__/` covering Zod schema enforcement, JSON extraction edge cases (code fences, noisy prefixes, missing JSON), SHA-256 hash determinism. All green.

**Ship infra**:
- `.github/workflows/ci.yml` — Foundry tests + frontend typecheck/lint/test/build on every push.
- `vercel.json` — Singapore region (`sin1`), `/api/agent` `maxDuration=60`, security headers.
- `DEPLOY.md` — 5-step deploy guide (env → contracts → frontend → smoke test → hackathon checklist).
- `DEMO_VIDEO_SCRIPT.md` — 3-minute founder-voice script with timestamps.
- `DORAHACKS_SUBMISSION.md` — paste-ready submission copy.
- `TWITTER_THREAD.md` — 7-tweet thread template.
- `.env.local.example` — contract addresses templated.

**Verified**:
- `gh` CLI authenticated as `abdullahdevrangga11`.
- Public repo live at `https://github.com/abdullahdevrangga11/atma`.
- `vercel` CLI authenticated as `devvveloper`.
- **Production deployed**: https://atma-iota.vercel.app (dpl_HpDBALJAoRj8p4DUTvucmUJSaXHU).

---

## What's left (manual / requires user)

- [ ] Provide `ANTHROPIC_API_KEY`, `PRIVATE_KEY`, `MANTLESCAN_API_KEY` in `.env.local`.
- [ ] Get Mantle Sepolia MNT from the faucet.
- [ ] Run `pnpm contracts:deploy:sepolia`, copy emitted addresses to `.env.local`.
- [ ] `vercel --prod` from repo root.
- [ ] Record demo video with founder voice (script ready in `DEMO_VIDEO_SCRIPT.md`).
- [ ] Submit DoraHacks form using `DORAHACKS_SUBMISSION.md`.
- [ ] Post thread from `@abdullahdevrang` using `TWITTER_THREAD.md`.

**Deadline**: 2026-06-15 15:59 UTC.
