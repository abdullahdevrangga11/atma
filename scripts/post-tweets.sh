#!/usr/bin/env bash
# scripts/post-tweets.sh — generate Twitter intent URLs from TWITTER_THREAD.md.
#
# Twitter's compose intent URL accepts pre-filled text. This script extracts
# each tweet body from TWITTER_THREAD.md, URL-encodes it, and prints (or
# opens) a `twitter.com/intent/tweet?text=…` link per tweet. Click each one
# in sequence → composer opens with the tweet pre-filled. Hit Send 9 times,
# done.
#
# Usage:
#   ./scripts/post-tweets.sh             # print URLs
#   ./scripts/post-tweets.sh open        # open each URL in $BROWSER one by one
#   ./scripts/post-tweets.sh urls.txt    # write URLs to a file
#
# Tip: post tweet 1 first, then in subsequent tweets click "Reply" on your own
# tweet to thread them. The intent URLs only seed text; you do the threading.

set -euo pipefail
cd "$(dirname "$0")/.."

SRC="TWITTER_THREAD.md"
if [ ! -f "$SRC" ]; then
  echo "✗ TWITTER_THREAD.md not found"
  exit 1
fi

# URL-encode helper (relies on Python which ships with macOS + every Linux)
urlencode() {
  python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.stdin.read()))"
}

# Extract each tweet body. Tweets are wrapped in ```code fences``` between
# "## Tweet N" headings. We grab the first code block after each "## Tweet"
# heading.
extract_tweets() {
  awk '
    /^## Tweet [0-9]/ { in_tweet = 1; in_code = 0; body = ""; next }
    /^## (Posting checklist|LinkedIn version)/ { in_tweet = 0; next }
    in_tweet && /^```$/ {
      if (in_code) {
        # End of code block — print body + separator
        gsub(/\n+$/, "", body)
        print body
        print "---ENDTWEET---"
        in_tweet = 0
        in_code = 0
        body = ""
      } else {
        in_code = 1
      }
      next
    }
    in_tweet && in_code { body = body $0 "\n" }
  ' "$SRC"
}

OUT_MODE="${1:-print}"
TWEET_NUM=0
URLS=()

while IFS= read -r -d $'\x1f' chunk; do :; done < <(true)  # workaround

TWEETS=()
buf=""
while IFS= read -r line; do
  if [ "$line" = "---ENDTWEET---" ]; then
    TWEETS+=("$buf")
    buf=""
  else
    buf+="$line"$'\n'
  fi
done < <(extract_tweets)

if [ "${#TWEETS[@]}" -eq 0 ]; then
  echo "✗ No tweets parsed. Check TWITTER_THREAD.md format."
  exit 1
fi

echo "  Parsed ${#TWEETS[@]} tweets from TWITTER_THREAD.md"
echo

for i in "${!TWEETS[@]}"; do
  n=$((i + 1))
  body="${TWEETS[$i]}"
  encoded=$(printf "%s" "$body" | urlencode)
  url="https://twitter.com/intent/tweet?text=${encoded}"
  URLS+=("$url")
  printf "  Tweet %s: " "$n"
  if [ "$OUT_MODE" = "open" ]; then
    printf "opening…\n"
    if command -v open >/dev/null 2>&1; then open "$url"
    elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$url"
    else echo "Open manually: $url"
    fi
    read -rp "    Press Enter when posted, then continue to next tweet…"
  else
    # Print a short preview + the URL
    preview=$(printf "%s" "$body" | head -1 | cut -c1-60)
    printf "%s…\n" "$preview"
    printf "             %s\n" "$url"
  fi
  echo
done

if [ "$OUT_MODE" != "open" ] && [ "$OUT_MODE" != "print" ] && [ -n "$OUT_MODE" ]; then
  # Write URLs to file
  : >"$OUT_MODE"
  for u in "${URLS[@]}"; do echo "$u" >>"$OUT_MODE"; done
  echo "  → Wrote ${#URLS[@]} URLs to $OUT_MODE"
fi

echo
echo "After posting tweet 1, pin it to your profile."
echo "Each subsequent tweet should be a Reply to the previous one to thread them."
