#!/usr/bin/env bash
# scripts/github-setup.sh — bring the GitHub repo into "discoverable" state.
#
# What it does (idempotent):
#   1. Sets repo description (one-liner).
#   2. Sets homepage to the live demo URL.
#   3. Adds discoverability topics: mantle, hackathon, erc-8004, ai-agents, etc.
#   4. Cuts a v1.0.0 release tagged at HEAD (skipped if tag already exists).
#
# Requires: gh CLI authenticated (gh auth login).

set -euo pipefail
cd "$(dirname "$0")/.."

REPO="abdullahdevrangga11/amana"
DESCRIPTION="Treasury orchestration for Mantle. Three AI agents allocate, monitor, and report under a policy that lives as Markdown."
HOMEPAGE="https://amana-iota.vercel.app"
TOPICS=(
  "mantle"
  "hackathon"
  "erc-8004"
  "ai-agents"
  "rwa"
  "defi"
  "claude"
  "gemini"
  "anthropic"
  "treasury"
  "nextjs"
  "react"
  "solidity"
  "foundry"
)

if ! command -v gh >/dev/null 2>&1; then
  echo "✗ gh CLI not found. Install: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "✗ gh not authenticated. Run: gh auth login"
  exit 1
fi

echo "1. Setting repo description + homepage"
gh repo edit "$REPO" \
  --description "$DESCRIPTION" \
  --homepage "$HOMEPAGE" >/dev/null
echo "   ✓ Done"

echo
echo "2. Adding topics"
TOPIC_ARGS=()
for t in "${TOPICS[@]}"; do TOPIC_ARGS+=(--add-topic "$t"); done
gh repo edit "$REPO" "${TOPIC_ARGS[@]}" >/dev/null
echo "   ✓ Added ${#TOPICS[@]} topics"

echo
echo "3. Cutting v1.0.0 release"
if gh release view v1.0.0 --repo "$REPO" >/dev/null 2>&1; then
  echo "   ↳ v1.0.0 already exists, skipping"
else
  gh release create v1.0.0 \
    --repo "$REPO" \
    --title "v1.0.0 — Mantle Turing Test Hackathon submission" \
    --notes "$(cat <<'EOF'
AMANA — Treasury Orchestration Protocol for Mantle.

Three AI agents (Allocator, Risk, Reporter) coordinate inside an ERC-4626 vault. Policy lives as Markdown. Every decision signed on-chain via ERC-8004.

## Highlights
- 15 pages · 16 API endpoints
- Streaming Claude Sonnet 4.5 / Gemini 2.5 Flash (swappable via env)
- Agent debate loop with veto authority
- Backtest sandbox + A/B comparison
- Skill marketplace with publish / fork / star + lineage viz
- Skill linter (10 static-analysis rules)
- Forensic run permalinks + OpenGraph cards
- 55 vitest + 45 Foundry tests, all green

## Live
- Demo: https://amana-iota.vercel.app
- Submission: https://dorahacks.io/hackathon/mantleturingtesthackathon2026

Built solo in 4 days. Yogyakarta, June 2026.
EOF
)"
  echo "   ✓ Released v1.0.0"
fi

echo
echo "Done. Repo now sets:"
echo "  description: $DESCRIPTION"
echo "  homepage:    $HOMEPAGE"
echo "  topics:      ${TOPICS[*]}"
