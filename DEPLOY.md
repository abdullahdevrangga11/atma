# ATMA — Deploy Guide

Three-step deployment for the **Mantle Turing Test Hackathon 2026** submission.

---

## 0. Prereqs

| Tool | Version | Install |
|---|---|---|
| Node | 20+ | https://nodejs.org |
| pnpm | 9+ | `npm i -g pnpm` |
| Foundry | nightly | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| Vercel CLI | latest | `npm i -g vercel` |
| Mantle Sepolia MNT | ~0.1 MNT | https://faucet.sepolia.mantle.xyz |

---

## 1. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Anthropic — agent reasoning
ANTHROPIC_API_KEY=sk-ant-...

# Mantle Sepolia
MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz
PRIVATE_KEY=0x...                # deployer key, holds the 0.1 MNT faucet drop
MANTLESCAN_API_KEY=...           # for source verification (https://mantlescan.xyz)

# Privy — embedded wallet for users
NEXT_PUBLIC_PRIVY_APP_ID=...     # https://dashboard.privy.io
```

Once deployed, the script appends contract addresses to `.env.local`:

```bash
NEXT_PUBLIC_ATMA_VAULT=0x...
NEXT_PUBLIC_USDC=0x...
NEXT_PUBLIC_USDY=0x...
NEXT_PUBLIC_MUSD=0x...
NEXT_PUBLIC_AAVE_POOL=0x...
NEXT_PUBLIC_MI4=0x...
NEXT_PUBLIC_CHAIN_ID=5003
```

---

## 2. Contracts → Mantle Sepolia

```bash
cd contracts

# Build
forge build --sizes

# Test (45 passing)
forge test -vvv

# Deploy + verify
forge script script/Deploy.s.sol \
  --rpc-url $MANTLE_SEPOLIA_RPC \
  --broadcast \
  --verify \
  --etherscan-api-key $MANTLESCAN_API_KEY \
  -vvv
```

The Deploy script logs every address. Copy them into `.env.local`.

> **Note**: All `Mock*` contracts (USDC/USDY/mUSD/AavePool/MI4) ship with the deploy so
> the demo is reproducible without depending on live RWA bridge testnets. In a mainnet
> cut, the constructor accepts real Mantle addresses.

---

## 3. Frontend → Vercel

```bash
# From repo root
vercel link                    # link to a new Vercel project
vercel env pull .env.local     # pull production env vars (or push yours)
vercel --prod                  # ship

# Set required secrets on Vercel
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_PRIVY_APP_ID production
vercel env add NEXT_PUBLIC_ATMA_VAULT production
vercel env add NEXT_PUBLIC_CHAIN_ID production
```

Production URL: **https://atma.xyz** (alias) or **https://atma.vercel.app**.

---

## 4. Smoke test

After deploy, hit these in order:

| Route | What you're verifying |
|---|---|
| `GET /` | Landing renders, FiddleHover digital effect alive, navbar glass + shrink |
| `GET /vault` | Vault demo loads, "Run Allocator" calls `/api/agent` |
| `GET /reports` | Reports dashboard with 3 baselines + attestation feed |
| `GET /skills` | Three skill markdown files render in the viewer |
| `POST /api/agent` body `{"action":"propose", "input": {...}}` | Returns `{ data, reasoningHash }` |

If `/api/agent` returns 500 → check `ANTHROPIC_API_KEY` is set in Vercel.

---

## 5. Hackathon checklist

- [ ] Repo public on GitHub (https://github.com/abdullahdevrangga11/atma)
- [ ] Vault verified on https://sepolia.mantlescan.xyz
- [ ] DEMO_VIDEO_SCRIPT.md recorded (≤ 3 min, founder voice — NOT AI narration)
- [ ] DoraHacks submission form filled in
- [ ] Twitter thread posted from `@abdullahdevrang`
- [ ] `progress.md` build log committed (CrossBeam pattern)

Deadline: **June 15, 2026 — 15:59 UTC**.

Ship.
