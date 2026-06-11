# ATMA — CLAUDE.md

> AI context file for Claude Code sessions in the ATMA repo.
> Read this first before touching any code. Always grep `docs/`, `runbooks/`, `skills/`, `README.md`, and `ARCHITECTURE.md` before guessing.

---

## What is ATMA?

**ATMA** is a **Treasury Orchestration Protocol for the Mantle RWA Stack**. It composes 3 AI agents under a verifiable on-chain policy to allocate idle stablecoins across USDY, mUSD, Aave V3 Mantle supply, and MI4.

**Core promise**: lift treasury policy out of human attention into a composable on-chain primitive.

**Target**: Mantle Turing Test Hackathon 2026 — Phase 2 AI Awakening
**Deadline**: June 15, 2026, 15:59 UTC
**Primary Track**: AI × RWA (Application path — Real-World Validity)
**Stack Prize Targets**: 20-Project Deployment ($1K LOCK) + Best UI/UX ($3K) + Community Voting ($8.5K) + Track First AI × RWA ($8.5K) + Grand Champion ($9K stretch)

---

## Tech Stack (committed)

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, React 19) |
| Language | **TypeScript 5.x** strict mode |
| Styling | **Tailwind CSS v4** (`@theme` in `app/globals.css`) |
| Animations | **Lenis** (smooth scroll) + **GSAP ScrollTrigger** + **Framer Motion** |
| Wallet | **Privy embedded wallet** (email + social login) + **viem 2.x** |
| Blockchain | **Mantle Sepolia testnet** (chainId 5003) + **Mantle Mainnet ERC-8004 registry** |
| Smart Contracts | **Solidity 0.8.24** + **Foundry** + **OpenZeppelin v5** |
| Agent SDK | **Anthropic Claude Sonnet 4.5** via `@anthropic-ai/sdk` |
| Skills | 3 markdown reference files (CrossBeam-pattern from Anthropic Hackathon) |
| Data sources | DefiLlama API + Nansen API (if available) + Elfa AI sentiment |
| Email/Notif | Resend (optional, reuse Mizaan account) |
| i18n | next-intl 4 (en default + id) |
| Deploy | Vercel (frontend) + Foundry forge (contracts) |
| Toasts | sonner |
| Icons | lucide-react |

**No restaking integration. No Aave liquidation defense. No multi-chain.** Hyper-focused on USDY + mUSD + Aave V3 supply + MI4 = 4 Mantle primitives, 3 agents, 1 vault contract.

---

## Design system

**Aesthetic**: **base.org slice** — deep navy bg, electric blue accent, glass cards, gradient orbs, smooth scroll reveals. Treasury/RWA feel = institutional polish, NOT consumer casual. Differentiates from Mizaan (paper.design lowercase).

### Fonts

| Role | Font | Why |
|---|---|---|
| Display + body | **Geist Sans** (Vercel) | base.org-tier institutional feel |
| Mono / technical | **Geist Mono** | Numbers, addresses, code |

Loaded via `next/font/google` (or local `public/fonts/`).

### Color tokens (`@theme` in `app/globals.css`)

```css
--color-bg:              #0A0E27   /* deep navy — base.org-inspired */
--color-bg-elevated:     #0F1635
--color-surface:         #131A3D
--color-surface-hi:      #1A2150

--color-primary:         #0052FF   /* electric blue — Coinbase Base brand */
--color-primary-hover:   #1C6BFF
--color-primary-soft:    rgba(0,82,255,0.10)
--color-primary-glow:    rgba(0,82,255,0.40)

--color-accent:          #00FF94   /* Mantle green — secondary accent */
--color-accent-soft:     rgba(0,255,148,0.08)

--color-text:            #FFFFFF
--color-text-secondary:  rgba(255,255,255,0.70)
--color-text-muted:      rgba(255,255,255,0.50)
--color-text-faint:      rgba(255,255,255,0.30)

--color-border:          rgba(255,255,255,0.08)
--color-border-strong:   rgba(255,255,255,0.15)
--color-border-accent:   rgba(0,82,255,0.40)

--color-success:         #00FF94
--color-warning:         #FFB800
--color-danger:          #FF4757
```

### Card recipe (glass + soft border + subtle hover lift)

```css
.card-atma {
  background: rgba(19, 26, 61, 0.60);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 4px 24px rgba(0, 0, 0, 0.30);
  border-radius: 16px;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.card-atma:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 82, 255, 0.30);
}
```

### Gradient orbs (base.org signature move)

```css
.orb-primary {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0,82,255,0.40) 0%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
```

### Border radius scale

- Cards: `rounded-[16px]`
- Sub-cards / inputs: `rounded-[10px]`
- Buttons: `rounded-full` (pills, base.org-style)
- Badges: `rounded-full`

### Typography rules

- Hero display: 80-120px, Geist Sans 600, letter-spacing -0.04em, line-height 0.95
- Section heading: 48-64px, Geist Sans 500, letter-spacing -0.025em
- Body: 16-18px, Geist Sans 400, line-height 1.5
- Numbers / addresses: Geist Mono, tabular-nums
- Eyebrow labels: 11-12px, Geist Mono, uppercase, letter-spacing 0.08em

### Micro-interactions (REQUIRED — UI/UX prize criterion)

- **Magnetic buttons**: cursor pulls toward button on hover (use `components/animations/MagneticButton.tsx`)
- **Cursor follow**: subtle dot follows cursor on landing (custom cursor)
- **Scroll reveals**: fade + Y-shift 20px on viewport enter (GSAP ScrollTrigger)
- **Number counters**: animate up on enter (Framer Motion `useSpring`)
- **Marquee tickers**: auto-scroll sponsor logos (CSS keyframes, infinite)
- **Smooth scroll**: Lenis on root, 1.2s duration
- **Glass cards hover lift**: 2px Y, primary-border-glow

### CodeGrid patterns reused

| Pattern | Source folder | Use case |
|---|---|---|
| Terminal text reveal | `codegrid-terminal-text-reveal-animation` | Hero subtitle typewriter |
| Block reveal page transition | `block-reveal-page-transition` | Page-to-page transitions |
| Scroll animation | `codegrid-deepjudge-scroll-animation` | Allocation viz reveal |
| Fractal glass effect | `codegrid-fractal-glass-effect-nextjs` | Hero background distortion |
| Preloader | `codegrid-maxmilkin-preloader` | App boot 1.5s brand build |
| SVG stroke transition | `codegrid-svg-stroke-page-transition-nextjs` | Submit button complete |

---

## App structure

```
app/
├── [locale]/
│   ├── layout.tsx                # Lenis + Privy provider + Geist fonts
│   ├── page.tsx                  # Landing (base.org slice)
│   ├── vault/page.tsx            # Deposit/withdraw + allocation viz
│   ├── reports/page.tsx          # P&L + benchmark + ERC-8004 attestation log
│   └── skills/page.tsx           # 3 Skill files rendered (markdown)
└── api/
    └── agent/route.ts            # Orchestrator endpoint (Claude SDK)

components/
├── landing/
│   ├── Hero.tsx                  # Gradient orb + typewriter + magnetic CTA
│   ├── FeatureCards.tsx          # Glass cards grid (3 agents)
│   ├── PartnerMarquee.tsx        # Auto-scroll Mantle/Byreal/Bybit/Tencent/Nansen
│   ├── StatCounters.tsx          # Animated number tickers
│   └── HowItWorks.tsx            # 3-step diagram with scroll reveal
├── vault/
│   ├── DepositForm.tsx           # Magnetic submit + amount input
│   ├── AllocationViz.tsx         # Real-time donut chart (Framer Motion)
│   ├── RiskDashboard.tsx         # 3 risk gauges
│   └── AttestationLog.tsx        # ERC-8004 events feed
├── animations/
│   ├── MagneticButton.tsx        # GSAP magnetic effect
│   ├── ScrollReveal.tsx          # GSAP ScrollTrigger wrapper
│   ├── GradientOrb.tsx           # Animated radial gradient
│   ├── TypeWriter.tsx            # Letter-by-letter reveal
│   ├── NumberCounter.tsx         # Animated counter
│   └── Preloader.tsx             # Boot brand build (1.5s)
└── ui/                           # shadcn/ui base (button, input, card, etc.)

lib/
├── agents/
│   ├── Allocator.ts              # USDC → {USDY, mUSD, Aave V3, MI4} reasoning
│   ├── Risk.ts                   # Depeg + drawdown + oracle monitor
│   ├── Reporter.ts               # P&L vs baseline + CSV export
│   └── orchestrator.ts           # Composes 3 agents
├── mantle/
│   ├── client.ts                 # viem client + Mantle Sepolia
│   ├── contracts.ts              # AtmaVault + USDY + mUSD + Aave V3 ABIs
│   └── erc8004.ts                # Identity registry helper
├── animations/
│   ├── lenis.ts                  # Lenis init + cleanup
│   ├── magnetic.ts               # Magnetic cursor logic
│   ├── scroll-reveal.ts          # GSAP ScrollTrigger setup
│   └── easings.ts                # Custom cubic-bezier curves
└── utils/
    ├── cn.ts                     # tailwind-merge + clsx
    ├── format.ts                 # formatUSD, formatPercent, shortenAddress
    └── constants.ts              # Mantle Sepolia addresses
```

---

## Environment variables (`.env.example`)

```bash
# === Mantle ===
MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz
MANTLE_MAINNET_RPC=https://rpc.mantle.xyz
MANTLE_SEPOLIA_CHAIN_ID=5003

# === Privy ===
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

# === Anthropic (agent reasoning) ===
ANTHROPIC_API_KEY=

# === Optional sponsors ===
TENCENT_HUNYUAN_API_KEY=
NANSEN_API_KEY=
ELFA_API_KEY=
BYBIT_API_KEY=
BYBIT_API_SECRET=

# === Contracts (after deploy) ===
NEXT_PUBLIC_ATMA_VAULT_ADDRESS=
NEXT_PUBLIC_ALLOCATOR_AGENT_ID=
NEXT_PUBLIC_RISK_AGENT_ID=
NEXT_PUBLIC_REPORTER_AGENT_ID=

# === Foundry ===
PRIVATE_KEY=
MANTLESCAN_API_KEY=

# === App ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ATMA
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

---

## Build order (3 days remaining)

### Day 1 (Wed Jun 12) — Foundation
- [ ] Spawn subagents per `prompts/` files in parallel
- [ ] Agent A: Foundry init + AtmaVault.sol + 30 tests + deploy Mantle Sepolia
- [ ] Agent B: TypeScript orchestrator skeleton with 3 agent base classes + mock data
- [ ] Agent C: Next.js 16 + Tailwind v4 + Geist fonts + Privy + Lenis init
- [ ] Agent D: README polish + ARCHITECTURE.md + 3 Skill files
- [ ] **Twitter Day 1 announce**: project name + screenshot + tag @Mantle_Official

### Day 2 (Thu Jun 13) — Integration
- [ ] Agent A: Add ERC-8004 attestation events, gas optimization, 50+ tests
- [ ] Agent B: Real Mantle data integration (DefiLlama + Helius EVM RPC), LLM reasoning
- [ ] Agent C: Landing (base.org slice with gradient orbs, marquee, counters), vault page, reports page
- [ ] Agent D: RISK_MODEL.md + TEST_REPORT.md generated
- [ ] **End-to-end smoke test**: deposit $10 USDC testnet → allocation → reports
- [ ] **Twitter Day 2 thread**: architecture diagram + working flow

### Day 3 (Fri Jun 14) — Polish + Ship
- [ ] Polish: README badges live, all docs final, mobile responsive
- [ ] Record **demo video** (2-3 min, LIVE narration, NO AI voice)
- [ ] Submit DoraHacks (all fields)
- [ ] Final X thread for Community Voting (5-7 tweets)
- [ ] Tag @Mantle_Official @ByrealLabs @bybit_official @NansenAI

### Day 4 (Sat Jun 15) — Buffer
- [ ] Hotfixes only
- [ ] 15:59 UTC absolute deadline

---

## Key conventions

- **English copy** primary (locale `en`), Bahasa Indonesia toggle (locale `id`)
- **All display amounts** in `$X,XXX,XXX` format via `formatUSD(bigint)` helper
- **Use `BigInt`** for all monetary values — never `number` (precision)
- **EVM addresses always shown shortened** via `shortenAddress(addr, 6)` → `0x7xKX...bW2`
- **Geist Mono for any cryptographic / technical value** (address, tx hash, contract name)
- **Geist Sans for everything else** — body, headlines, buttons, etc.
- **Server components default**, `"use client"` only when wallet/state interactive
- **No `any` types** — viem provides full type inference
- **All API routes return JSON Zod-validated** with consistent `{ data, error }` shape
- **Vault state machine enforced at contract level** — UI guards are defense in depth
- **No tests = no merge** — Foundry tests required for every contract change

---

## Subagent workflow

This project is built with 5 parallel Claude Code subagents per `prompts/`:

| Subagent | Prompt | Owns |
|---|---|---|
| A. Contract Engineer | `prompts/agent-a-contracts.md` | `contracts/` |
| B. Agent Engineer | `prompts/agent-b-agents.md` | `lib/agents/`, `app/api/agent/` |
| C. Frontend Engineer | `prompts/agent-c-frontend.md` | `app/`, `components/`, `lib/animations/` |
| D. Docs Engineer | `prompts/agent-d-docs.md` | `README.md`, `ARCHITECTURE.md`, `runbooks/`, `skills/` |
| E. Comms Engineer | `prompts/agent-e-comms.md` | `docs/`, demo video script, Twitter thread |

**Devrangga (you) = orchestrator + reviewer + final decision maker.** Review each subagent output. Integration testing is on you.

---

## Reference documents

- **Pitch & PRD**: `docs/pitch.md`
- **Architecture**: `ARCHITECTURE.md`
- **Risk model**: `RISK_MODEL.md`
- **Skills**: `skills/*.skill.md` (3 files)
- **Runbooks**: `runbooks/`
- **Mantle Turing Test Hackathon**: https://dorahacks.io/hackathon/mantleturingtesthackathon2026
- **base.org design reference**: https://www.base.org (visual slice source)
- **CodeGrid patterns**: `/Users/devranggahazzamahiswara/Documents/code/CodeGrid/`
- **Mizaan reference codebase**: `/Users/devranggahazzamahiswara/Documents/code/mizaan/`

---

## What NOT to do

- ❌ Don't add restaking (cmETH) integration — out of 3-day scope
- ❌ Don't add Aave V3 liquidation defense — out of scope
- ❌ Don't add multi-chain bridging — out of scope
- ❌ Don't use AI voiceover in demo video — auto-disqualifier
- ❌ Don't submit incomplete forms to DoraHacks
- ❌ Don't tweet without tagging sponsors
- ❌ Don't deploy contracts to Mantle Mainnet without testing on Sepolia first
- ❌ Don't expand scope mid-sprint — Day 3 is polish, not features
