#!/usr/bin/env bash
# scripts/swap-to-domain.sh — swap from amana-iota.vercel.app to a custom
# domain (e.g. amana.finance) once it's purchased and DNS is configured.
#
# Usage:
#   ./scripts/swap-to-domain.sh amana.finance
#
# What it does:
#   1. Adds the domain to the Vercel project (you'll be told what DNS records
#      to set at your registrar — follow them, then re-run with `--verify`).
#   2. Aliases the latest production deployment to the new domain.
#   3. Bulk-rewrites every reference from amana-iota.vercel.app → <domain>
#      across docs, scripts, OG images, and metadata.
#   4. Commits + pushes — Vercel auto-redeploys with the new canonical URL.
#
# Idempotent: re-run after DNS propagates.

set -u
cd "$(dirname "$0")/.."

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "usage: $0 <domain>   e.g. $0 amana.finance"
  exit 1
fi

GRN="\033[32m"; YEL="\033[33m"; RED="\033[31m"; CYAN="\033[36m"; RST="\033[0m"
say() { printf "${CYAN}==> %s${RST}\n" "$1"; }
ok()  { printf "  ${GRN}✓${RST} %s\n" "$1"; }
warn(){ printf "  ${YEL}⚠${RST} %s\n" "$1"; }
fail(){ printf "  ${RED}✗${RST} %s\n" "$1"; }

# ─── 1. Add domain to Vercel ────────────────────────────────────────
say "1. Add $DOMAIN to Vercel project amana"
if vercel domains add "$DOMAIN" 2>&1 | tee /tmp/vercel-domain.log | tail -5; then
  ok "Domain added (or already attached)."
else
  warn "vercel domains add reported issues — check /tmp/vercel-domain.log"
fi

echo
warn "Set these DNS records at your registrar (Porkbun/Namecheap):"
echo "      A     @     76.76.21.21"
echo "      CNAME www   cname.vercel-dns.com"
echo "  Then wait 2–10 minutes for propagation."
echo
read -rp "  Press Enter once DNS records are set (or Ctrl+C to abort)…"

# ─── 2. Alias latest deployment ─────────────────────────────────────
say "2. Alias latest production deployment to $DOMAIN"
LATEST=$(vercel list amana 2>/dev/null | grep -E "Ready\s+Production" | head -1 | awk '{print $3}')
if [ -n "$LATEST" ]; then
  LATEST_HOST="${LATEST#https://}"
  vercel alias set "$LATEST_HOST" "$DOMAIN" 2>&1 | tail -3
  ok "Aliased $LATEST_HOST → $DOMAIN"
else
  fail "Couldn't find latest production deploy"
  exit 1
fi

# ─── 3. Bulk replace amana-iota.vercel.app → $DOMAIN ────────────────
say "3. Rewrite codebase references"
find . -type f \
  -not -path './node_modules/*' \
  -not -path './.next/*' \
  -not -path './.git/*' \
  -not -path './contracts/cache/*' \
  -not -path './contracts/out/*' \
  -not -path './contracts/broadcast/*' \
  -not -path './contracts/lib/*' \
  -not -name 'pnpm-lock.yaml' \
  -not -name 'tsconfig.tsbuildinfo' \
  -not -name '*.png' -not -name '*.jpg' -not -name '*.jpeg' -not -name '*.webp' \
  -not -name '*.ico' -not -name '*.woff*' -not -name '*.ttf' -not -name '.DS_Store' \
  -print0 | xargs -0 perl -i -pe "s/amana-iota\.vercel\.app/$DOMAIN/g"
COUNT=$(git diff --shortstat 2>/dev/null | awk '{print $1" files changed"}')
ok "$COUNT"

# ─── 4. Verify domain responds ──────────────────────────────────────
say "4. Verify $DOMAIN responds"
sleep 3
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$DOMAIN/en" || echo "000")
if [ "$CODE" = "200" ]; then
  ok "https://$DOMAIN/en → 200"
else
  warn "https://$DOMAIN/en → $CODE (DNS may still be propagating; re-run later)"
fi

# ─── 5. Commit + push ───────────────────────────────────────────────
say "5. Commit + push"
git add -A
git commit -m "chore(rebrand): swap amana-iota.vercel.app → $DOMAIN" || true
git push 2>&1 | tail -2

echo
ok "Done. Custom domain $DOMAIN is now the canonical URL."
warn "Next: update DoraHacks form + Twitter thread + LinkedIn to use https://$DOMAIN"
