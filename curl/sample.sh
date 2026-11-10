#!/usr/bin/env bash
# The keyless sample: delayed consensus odds and today's fixtures for one league.
# No API key needed. Limits: 10 requests per minute and 1,000 per day per address and host.
# Usage: ./sample.sh [league]   (mlb, nba, nfl, cfb, nhl, epl, bund, laliga, ucl; default nba)
set -euo pipefail
league="${1:-nba}"

curl -sS --fail-with-body "https://odds.halfpoint.tech/sample/odds?league=${league}"
echo
curl -sS --fail-with-body "https://fixtures.halfpoint.tech/sample/fixtures?league=${league}"
echo
