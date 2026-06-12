#!/usr/bin/env bash
# scripts/seed-prod.sh — pre-populate the production runStore so /reports,
# /network, and /api/status return rich data the moment judges arrive.
#
# Calls /api/orchestrate N times in series (default 3). Each call costs ~$0.004
# on Gemini Flash, so the full seed run is well under one cent.
#
# Usage:
#   ./scripts/seed-prod.sh              # 3 runs against amana-iota.vercel.app
#   ./scripts/seed-prod.sh 5            # 5 runs
#   ./scripts/seed-prod.sh 3 https://my-preview.vercel.app

set -u
COUNT="${1:-3}"
BASE="${2:-https://amana-iota.vercel.app}"

GRN="\033[32m"; RED="\033[31m"; YEL="\033[33m"; CYAN="\033[36m"; RST="\033[0m"

echo
printf "${CYAN}==> Seeding %s with %s orchestration run(s)${RST}\n" "$BASE" "$COUNT"
echo "    (~\$0.004 per run on Gemini Flash; you'll spend under a cent total)"
echo

OK=0
FAIL=0

for i in $(seq 1 "$COUNT"); do
  printf "  run %s/%s … " "$i" "$COUNT"

  # Alternate scenarios so the seeded runs look varied:
  #   odd runs → normal market, even runs → debate mode (forces a veto)
  if [ $((i % 2)) -eq 0 ]; then
    BODY='{"debateMode":true}'
    LABEL="debate"
  else
    BODY='{"debateMode":false}'
    LABEL="normal"
  fi

  HTTP=$(curl -s -o /tmp/seed-prod.json -w "%{http_code}" \
    --max-time 90 \
    -H "content-type: application/json" \
    -X POST "$BASE/api/orchestrate" \
    -d "$BODY" || echo "000")

  if [ "$HTTP" = "200" ]; then
    RUN_ID=$(grep -o '"id":"[^"]*"' /tmp/seed-prod.json | head -1 | cut -d'"' -f4)
    printf "${GRN}ok${RST}  %s  %s\n" "$LABEL" "${RUN_ID:0:18}…"
    OK=$((OK + 1))
  else
    printf "${RED}fail${RST} HTTP=%s\n" "$HTTP"
    FAIL=$((FAIL + 1))
  fi

  # Brief breather so we don't trip the in-app rate limiter (20s min gap on
  # /api/orchestrate). Skip the sleep on the final iteration.
  if [ "$i" -lt "$COUNT" ]; then
    printf "         waiting 22s for rate limit … "
    sleep 22
    printf "ok\n"
  fi
done

echo
printf "${CYAN}==> Verifying ${RST}\n"
TOTAL=$(curl -s --max-time 10 "$BASE/api/status" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
echo "  runStore.size() = ${TOTAL:-?}"
echo

if [ "$FAIL" -gt 0 ]; then
  printf "${YEL}DONE${RST} — %s ok, %s fail. Re-run if needed.\n" "$OK" "$FAIL"
  exit 1
fi
printf "${GRN}DONE${RST} — %s run(s) seeded. /reports and /network are now populated.\n" "$OK"
