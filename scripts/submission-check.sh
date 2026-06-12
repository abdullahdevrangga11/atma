#!/usr/bin/env bash
# scripts/submission-check.sh — single command, go/no-go verdict.
#
# Runs every verification before you hit Submit on DoraHacks:
#   1. Production smoke test (all 27 routes)
#   2. Vercel env vars present (GEMINI_API_KEY or ANTHROPIC_API_KEY)
#   3. Live /api/llm-info returns a provider
#   4. Foundry tests pass
#   5. Vitest passes
#   6. No remaining TBD placeholders in submission docs (except the
#      Twitter thread URL which is normal)
#   7. Repo committed + pushed
#
# Exits 0 = ready to submit. Non-zero = something to fix.

set -u
cd "$(dirname "$0")/.."

GRN="\033[32m"; RED="\033[31m"; YEL="\033[33m"; CYAN="\033[36m"; RST="\033[0m"
PASS=0; FAIL=0; WARN=0

pass() { printf "  ${GRN}✓${RST} %s\n" "$1"; PASS=$((PASS + 1)); }
fail() { printf "  ${RED}✗${RST} %s\n" "$1"; FAIL=$((FAIL + 1)); }
warn() { printf "  ${YEL}⚠${RST} %s\n" "$1"; WARN=$((WARN + 1)); }
section() { echo; printf "${CYAN}==> %s${RST}\n" "$1"; }

# ─── 1. Production smoke ────────────────────────────────────────────
section "1. Production routes (amana-iota.vercel.app)"
if ./scripts/smoke-test.sh https://amana-iota.vercel.app >/tmp/smoke.log 2>&1; then
  pass "All 27 routes return expected status"
else
  fail "Smoke test failed — see /tmp/smoke.log"
fi

# ─── 2. /api/llm-info reports a provider ───────────────────────────
section "2. LLM provider"
PROVIDER=$(curl -s --max-time 10 https://amana-iota.vercel.app/api/llm-info | grep -o '"provider":"[^"]*"' | cut -d'"' -f4 || echo "")
if [ -n "$PROVIDER" ]; then
  pass "Production reports provider: $PROVIDER"
else
  fail "/api/llm-info didn't return a provider — env var not set on Vercel"
fi

# ─── 3. Test suites ────────────────────────────────────────────────
section "3. Frontend tests (vitest)"
if node_modules/.bin/vitest run >/tmp/vitest.log 2>&1; then
  COUNT=$(grep "Tests" /tmp/vitest.log | tail -1 | grep -oE "[0-9]+ passed" | head -1)
  pass "Vitest: $COUNT"
else
  fail "Vitest failed — see /tmp/vitest.log"
fi

section "4. Contract tests (foundry)"
if [ -d contracts ]; then
  pushd contracts >/dev/null
  if command -v forge >/dev/null 2>&1 && forge test --silent 2>/tmp/forge.log; then
    PASSED=$(grep -oE "[0-9]+ passed" /tmp/forge.log | head -1)
    pass "Foundry: $PASSED"
  else
    if ! command -v forge >/dev/null 2>&1; then
      warn "forge not found locally (install: curl -L https://foundry.paradigm.xyz | bash)"
    else
      fail "Foundry tests failed — see /tmp/forge.log"
    fi
  fi
  popd >/dev/null
fi

# ─── 5. TBD placeholders ───────────────────────────────────────────
section "5. Submission docs — TBD placeholders"
TBD_HITS=$(grep -nE "<TBD|TBD>" DEMO_VIDEO_SCRIPT.md DORAHACKS_SUBMISSION.md TWITTER_THREAD.md README.md 2>/dev/null | grep -v "TBD\b" | wc -l | tr -d ' ')
if [ "$TBD_HITS" -eq 0 ]; then
  pass "All placeholders templated"
else
  # Count without the expected Twitter thread URL line
  EXPECTED_TWITTER_TBD=$(grep -n "x.com/abdullahdevrang/status/<TBD>" DORAHACKS_SUBMISSION.md 2>/dev/null | wc -l | tr -d ' ')
  if [ "$TBD_HITS" -eq "$EXPECTED_TWITTER_TBD" ]; then
    warn "Only the Twitter thread URL placeholder remains (normal — fill after posting tweet 1)"
  else
    fail "$TBD_HITS placeholders still in docs — run ./scripts/finalize-submission.sh"
    grep -nE "<TBD|TBD>" DEMO_VIDEO_SCRIPT.md DORAHACKS_SUBMISSION.md TWITTER_THREAD.md README.md 2>/dev/null | sed 's/^/      /'
  fi
fi

# ─── 6. Git state ──────────────────────────────────────────────────
section "6. Git state"
if [ -z "$(git status --porcelain)" ]; then
  pass "Working tree clean"
else
  warn "Uncommitted changes:"
  git status --short | sed 's/^/      /'
fi

# Check ahead/behind upstream
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")
if [ -n "$UPSTREAM" ]; then
  AHEAD=$(git rev-list --count "$UPSTREAM"..HEAD 2>/dev/null || echo "0")
  BEHIND=$(git rev-list --count HEAD.."$UPSTREAM" 2>/dev/null || echo "0")
  if [ "$AHEAD" = "0" ] && [ "$BEHIND" = "0" ]; then
    pass "In sync with $UPSTREAM"
  elif [ "$AHEAD" -gt 0 ]; then
    warn "$AHEAD commit(s) ahead of $UPSTREAM — run: git push"
  else
    warn "$BEHIND commit(s) behind $UPSTREAM — run: git pull"
  fi
fi

# ─── 7. DoraHacks form opens? ──────────────────────────────────────
section "7. External services reachable"
if curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://dorahacks.io/hackathon/mantleturingtesthackathon2026" | grep -q "200\|301\|302"; then
  pass "DoraHacks submission page reachable"
else
  warn "DoraHacks submission page didn't respond — network issue?"
fi

# ─── Verdict ───────────────────────────────────────────────────────
section "Verdict"
echo "  passed:  $PASS"
echo "  warned:  $WARN"
echo "  failed:  $FAIL"
echo
if [ "$FAIL" -gt 0 ]; then
  printf "${RED}NOT READY${RST} — fix the failures above first.\n"
  exit 1
fi
if [ "$WARN" -gt 0 ]; then
  printf "${YEL}READY WITH WARNINGS${RST} — review warnings; you can still submit.\n"
  exit 0
fi
printf "${GRN}GO. You're clear to submit.${RST}\n"
