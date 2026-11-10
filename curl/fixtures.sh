#!/usr/bin/env bash
# The schedule of a league on a date (a local date in the league's timezone; default today).
# Needs an API key in HALFPOINT_API_KEY.
# Usage: ./fixtures.sh [league] [date]   e.g. ./fixtures.sh nfl 2026-11-15
set -euo pipefail
: "${HALFPOINT_API_KEY:?set HALFPOINT_API_KEY (see https://docs.halfpoint.tech/plans/)}"
league="${1:-nba}"
date="${2:-}"

url="https://fixtures.halfpoint.tech/fixtures?league=${league}"
if [ -n "$date" ]; then url="${url}&date=${date}"; fi

curl -sS --fail-with-body -H "X-Api-Key: ${HALFPOINT_API_KEY}" "$url"
echo
