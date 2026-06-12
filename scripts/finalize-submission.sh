#!/usr/bin/env bash
# scripts/finalize-submission.sh — replace placeholders in submission docs.
#
# Usage:
#   ./scripts/finalize-submission.sh <youtube-url> <contract-address>
#
# Example:
#   ./scripts/finalize-submission.sh \
#       https://youtu.be/abc123 \
#       0x1234567890abcdef1234567890abcdef12345678
#
# Replaces every `<TBD>` and `0x<TBD>` token across:
#   - DEMO_VIDEO_SCRIPT.md
#   - DORAHACKS_SUBMISSION.md
#   - TWITTER_THREAD.md
#   - README.md

set -euo pipefail

cd "$(dirname "$0")/.."

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <youtube-url> <contract-address>"
  echo "  e.g. $0 https://youtu.be/abc123 0x1234..."
  exit 1
fi

VIDEO="$1"
ADDR="$2"

if [[ ! "$ADDR" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
  echo "✗ contract address doesn't look like 0x + 40 hex chars: $ADDR"
  exit 1
fi
if [[ ! "$VIDEO" =~ ^https?:// ]]; then
  echo "✗ video URL must start with http(s)://"
  exit 1
fi

DOCS=(
  "DEMO_VIDEO_SCRIPT.md"
  "DORAHACKS_SUBMISSION.md"
  "TWITTER_THREAD.md"
  "README.md"
)

# sed -i handling differs on macOS vs Linux; use a portable wrapper.
sedi() {
  if sed --version >/dev/null 2>&1; then
    sed -i "$@"  # GNU sed
  else
    sed -i '' "$@"  # BSD sed (macOS)
  fi
}

VID_HOST="${VIDEO#https://}"
VID_HOST="${VID_HOST#http://}"

for f in "${DOCS[@]}"; do
  if [ ! -f "$f" ]; then continue; fi
  # Address patterns FIRST (more specific)
  sedi "s|0x<TBD>|$ADDR|g" "$f"
  sedi "s|0x<TBD — deploy before submission>|$ADDR|g" "$f"
  sedi "s|\`<TBD>\` (Mantle Sepolia|\`$ADDR\` (Mantle Sepolia|g" "$f"
  sedi "s|/address/<TBD>|/address/$ADDR|g" "$f"
  sedi "s|sepolia.mantlescan.xyz/address/TBD|sepolia.mantlescan.xyz/address/$ADDR|g" "$f"

  # Video URL patterns
  sedi "s|<youtu\.be/TBD>|$VIDEO|g" "$f"
  sedi "s|youtu\.be/<TBD>|$VID_HOST|g" "$f"
  sedi "s|youtu\.be/TBD|$VID_HOST|g" "$f"
  sedi "s|<TBD — record before submission>|$VIDEO|g" "$f"

  # Catch-all <TBD>
  sedi "s|<TBD>|$VIDEO|g" "$f"

  echo "  ✓ $f"
done

# Sanity check
REMAINING=$(grep -nE "TBD" "${DOCS[@]}" 2>/dev/null | grep -v "^Binary" || true)
if [ -n "$REMAINING" ]; then
  echo
  echo "  ⚠ Some TBD tokens remain (Twitter thread URL is normal — it doesn't exist yet):"
  echo "$REMAINING" | sed 's/^/    /'
fi

echo
echo "Replaced:"
echo "  video → $VIDEO"
echo "  vault → $ADDR"
echo
echo "Diff preview:"
git --no-pager diff --stat -- "${DOCS[@]}"
echo
echo "Now: git add -A && git commit -m 'docs: finalize submission URLs' && git push"
