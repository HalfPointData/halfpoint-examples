#!/usr/bin/env bash
# Poll with ETag / If-None-Match: an unchanged answer is `304 Not Modified` without a body.
# With HALFPOINT_API_KEY set it polls /odds every second (the REST answer is rebuilt at most
# once a second). Without a key it polls the keyless sample every 10 s (the sample is taken
# every minute, and allows 10 requests per minute).
# Usage: ./etag-polling.sh [league] [rounds]   (default nba, 5 rounds; 0 = until Ctrl-C)
set -euo pipefail
league="${1:-nba}"
rounds="${2:-5}"

headers=()
if [ -n "${HALFPOINT_API_KEY:-}" ]; then
  url="https://odds.halfpoint.tech/odds?league=${league}"
  interval=1
  headers+=(-H "X-Api-Key: ${HALFPOINT_API_KEY}")
else
  url="https://odds.halfpoint.tech/sample/odds?league=${league}"
  interval=10
fi

hdr="$(mktemp)"
body="$(mktemp)"
trap 'rm -f "$hdr" "$body"' EXIT

etag=""
i=0
while [ "$rounds" -eq 0 ] || [ "$i" -lt "$rounds" ]; do
  i=$((i + 1))
  cond=()
  if [ -n "$etag" ]; then cond=(-H "If-None-Match: ${etag}"); fi
  status="$(curl -sS -o "$body" -D "$hdr" -w '%{http_code}' \
    ${headers[@]+"${headers[@]}"} ${cond[@]+"${cond[@]}"} "$url")"
  case "$status" in
    200)
      etag="$(grep -i '^etag:' "$hdr" | head -n1 | cut -d' ' -f2- | tr -d '\r')"
      echo "$(date -u +%H:%M:%S) 200 etag=${etag} $(wc -c < "$body" | tr -d ' ') bytes"
      ;;
    304)
      echo "$(date -u +%H:%M:%S) 304 not modified"
      ;;
    *)
      echo "$(date -u +%H:%M:%S) ${status} $(cat "$body")" >&2
      exit 1
      ;;
  esac
  if [ "$rounds" -eq 0 ] || [ "$i" -lt "$rounds" ]; then sleep "$interval"; fi
done
