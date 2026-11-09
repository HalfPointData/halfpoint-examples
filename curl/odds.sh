#!/usr/bin/env bash
# The consensus right now: a market-implied probability per outcome for the games starting
# within the next 24 hours and those being played. On the Risk plan each market also carries
# `stop` (the bet stop), `widened` and `range`.
# Needs an API key in HALFPOINT_API_KEY.
# Usage: ./odds.sh [league]   (omit the league for all leagues)
set -euo pipefail
: "${HALFPOINT_API_KEY:?set HALFPOINT_API_KEY (see https://docs.halfpoint.tech/plans/)}"

url="https://odds.halfpoint.tech/odds"
if [ -n "${1:-}" ]; then url="${url}?league=$1"; fi

curl -sS --fail-with-body -H "X-Api-Key: ${HALFPOINT_API_KEY}" "$url"
echo
