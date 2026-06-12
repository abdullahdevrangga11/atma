#!/usr/bin/env bash
# scripts/setup-submission.sh — interactive bootstrap for hackathon submission.
#
# What it does:
#   1. Generates a fresh deployer wallet (foundry's `cast wallet new`) and
#      prints the address so the user can faucet it on Mantle Sepolia.
#   2. Writes the resulting PRIVATE_KEY into contracts/.env (and parent
#      .env.local for the frontend) so subsequent forge scripts find it.
#   3. Walks the user through pushing env vars to Vercel production.
#   4. Triggers a redeploy so the new env vars are picked up.
#
# Idempotent: re-running won't overwrite existing keys; it'll ask first.
#
# Requires: cast (from foundry), vercel CLI, jq (optional, used for pretty
# output if present).

set -euo pipefail

cd "$(dirname "$0")/.."

YEL="\033[33m"; GRN="\033[32m"; CYAN="\033[36m"; DIM="\033[2m"; RST="\033[0m"

say() { printf "%b%s%b\n" "$CYAN" "$1" "$RST"; }
warn() { printf "%b%s%b\n" "$YEL" "$1" "$RST"; }
ok() { printf "%b✓ %s%b\n" "$GRN" "$1" "$RST"; }
dim() { printf "%b%s%b\n" "$DIM" "$1" "$RST"; }

# ─────────────────────────────────────────────────────────────────────
# 1. Deployer wallet
# ─────────────────────────────────────────────────────────────────────

ENV_FILE="contracts/.env"
LOCAL_ENV=".env.local"
mkdir -p contracts

say "1. Mantle Sepolia deployer wallet"
echo

if grep -q "^PRIVATE_KEY=0x" "$ENV_FILE" 2>/dev/null; then
  EXISTING=$(grep -m1 "^PRIVATE_KEY=" "$ENV_FILE" | cut -d'=' -f2)
  ADDR=$(cast wallet address --private-key "$EXISTING" 2>/dev/null || echo "")
  if [ -n "$ADDR" ]; then
    warn "  Existing deployer found: $ADDR"
    read -rp "  Reuse it? [Y/n] " yn
    yn=${yn:-Y}
    if [ "${yn^^}" = "Y" ]; then
      DEPLOYER="$ADDR"
    fi
  fi
fi

if [ -z "${DEPLOYER:-}" ]; then
  if ! command -v cast >/dev/null 2>&1; then
    warn "  cast (foundry) not found. Install with: curl -L https://foundry.paradigm.xyz | bash && foundryup"
    exit 1
  fi
  echo "  Generating fresh deployer…"
  OUT=$(cast wallet new)
  PK=$(echo "$OUT" | grep "Private key" | awk '{print $3}')
  DEPLOYER=$(echo "$OUT" | grep "Address" | awk '{print $2}')

  # Persist to contracts/.env (forge picks this up via foundry.toml)
  touch "$ENV_FILE"
  grep -v "^PRIVATE_KEY=" "$ENV_FILE" >"${ENV_FILE}.tmp" 2>/dev/null || true
  mv "${ENV_FILE}.tmp" "$ENV_FILE"
  echo "PRIVATE_KEY=$PK" >>"$ENV_FILE"

  # Also write a parent .env.local stub so the frontend can pick up the deployer addr
  if [ ! -f "$LOCAL_ENV" ]; then
    cp .env.local.example "$LOCAL_ENV" 2>/dev/null || touch "$LOCAL_ENV"
  fi

  ok "Wallet generated. Saved key to contracts/.env"
fi

echo
say "  → Deployer address: $DEPLOYER"
echo
dim "  Go to https://faucet.sepolia.mantle.xyz and request MNT to that address."
dim "  You need ~0.1 MNT to deploy. The faucet drops 0.5 MNT per request."
echo
read -rp "  Press Enter once you've funded the address (or Ctrl+C to abort)…"
echo

# ─────────────────────────────────────────────────────────────────────
# 2. Vercel environment variables
# ─────────────────────────────────────────────────────────────────────

say "2. Vercel production env vars"
echo

if ! command -v vercel >/dev/null 2>&1; then
  warn "  vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

if [ ! -d ".vercel" ]; then
  echo "  Linking project…"
  vercel link --yes --project atma
fi

echo "  Will push the following to Vercel production:"
echo "    GEMINI_API_KEY   (read from local input)"
echo "    LLM_PROVIDER     = gemini"
echo "    NEXT_PUBLIC_CHAIN_ID = 5003"
echo
read -rp "  Continue? [Y/n] " yn
yn=${yn:-Y}
if [ "${yn^^}" != "Y" ]; then
  warn "  Skipped Vercel env setup."
else
  read -rsp "  Paste your GEMINI_API_KEY: " GEMINI
  echo

  printf "%s" "$GEMINI" | vercel env add GEMINI_API_KEY production 2>/dev/null \
    || vercel env rm GEMINI_API_KEY production --yes 2>/dev/null \
    && printf "%s" "$GEMINI" | vercel env add GEMINI_API_KEY production
  printf "gemini" | vercel env add LLM_PROVIDER production 2>/dev/null \
    || vercel env rm LLM_PROVIDER production --yes 2>/dev/null \
    && printf "gemini" | vercel env add LLM_PROVIDER production
  printf "5003" | vercel env add NEXT_PUBLIC_CHAIN_ID production 2>/dev/null \
    || true

  ok "Env vars pushed."
fi

# ─────────────────────────────────────────────────────────────────────
# 3. Deploy contracts (optional)
# ─────────────────────────────────────────────────────────────────────

echo
say "3. Contracts → Mantle Sepolia"
echo
read -rp "  Run forge deploy now? [y/N] " yn
yn=${yn:-N}
if [ "${yn^^}" = "Y" ]; then
  cd contracts
  forge script script/Deploy.s.sol \
    --rpc-url "${MANTLE_SEPOLIA_RPC:-https://rpc.sepolia.mantle.xyz}" \
    --broadcast \
    -vvv
  cd ..
  ok "Deploy script ran. Check the output above for contract addresses."
else
  dim "  Skipped. Run manually later: cd contracts && forge script script/Deploy.s.sol --rpc-url https://rpc.sepolia.mantle.xyz --broadcast -vvv"
fi

# ─────────────────────────────────────────────────────────────────────
# 4. Redeploy frontend
# ─────────────────────────────────────────────────────────────────────

echo
say "4. Redeploy frontend"
echo
read -rp "  Trigger 'vercel --prod' now? [Y/n] " yn
yn=${yn:-Y}
if [ "${yn^^}" = "Y" ]; then
  vercel --prod
  ok "Production redeployed."
fi

echo
ok "Setup complete. Run scripts/smoke-test.sh to verify."
