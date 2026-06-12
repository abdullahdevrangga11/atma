#!/usr/bin/env bash
# scripts/smoke-test.sh — verify the production deploy serves every route.
#
# Usage:
#   ./scripts/smoke-test.sh                     # uses default atma-iota.vercel.app
#   ./scripts/smoke-test.sh https://other.host  # override
#
# Exits non-zero if any route doesn't return 200.

set -u
BASE="${1:-https://atma-iota.vercel.app}"

PAGES=(
  "/en"
  "/en/vault"
  "/en/backtest"
  "/en/backtest/ab"
  "/en/compare"
  "/en/anomaly"
  "/en/ab-test"
  "/en/skills"
  "/en/marketplace"
  "/en/reports"
  "/en/network"
  "/en/agents/allocator"
  "/en/agents/risk"
  "/en/agents/reporter"
)

APIS=(
  "/api/llm-info"
  "/api/status"
  "/api/feeds"
  "/api/runs"
  "/api/network"
  "/api/marketplace"
  "/api/prompts"
  "/api/agent-stats/allocator"
  "/sitemap.xml"
  "/robots.txt"
)

EXPECT_404=(
  "/en/does-not-exist"
  "/api/runs/notreal"
  "/api/marketplace/notreal"
)

ok=0
fail=0

check() {
  local path="$1"
  local expected="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "$BASE$path" || echo "000")
  if [ "$code" = "$expected" ]; then
    printf "  ✓ %-30s → %s\n" "$path" "$code"
    ok=$((ok + 1))
  else
    printf "  ✗ %-30s → %s (expected %s)\n" "$path" "$code" "$expected"
    fail=$((fail + 1))
  fi
}

echo
echo "🔥 Smoke testing $BASE"
echo
echo "Pages (expect 200):"
for p in "${PAGES[@]}"; do check "$p" "200"; done
echo
echo "APIs (expect 200):"
for p in "${APIS[@]}"; do check "$p" "200"; done
echo
echo "Negative paths (expect 404):"
for p in "${EXPECT_404[@]}"; do check "$p" "404"; done
echo
echo "──────────────────────────────"
echo "  ok=$ok  fail=$fail"
echo "──────────────────────────────"
if [ "$fail" -gt 0 ]; then
  exit 1
fi
