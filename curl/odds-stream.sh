#!/usr/bin/env bash
# The consensus pushed as it changes, as Server-Sent Events.
# First one `price` event per fixture (the current state), then every change:
#   event: price   a fixture as in /odds, with all its markets; it replaces what you hold
#   event: remove  {"id": ..., "market": ...}: the market is gone
# Lines starting with ":" keep the connection open (about every 30 s).
# There is no replay: after a disconnect, reconnect and start over from the new state.
# Needs the Realtime or Risk plan (otherwise 403). Key in HALFPOINT_API_KEY.
# Usage: ./odds-stream.sh [league]
set -euo pipefail
: "${HALFPOINT_API_KEY:?set HALFPOINT_API_KEY (see https://docs.halfpoint.tech/plans/)}"

url="https://odds.halfpoint.tech/odds/stream"
if [ -n "${1:-}" ]; then url="${url}?league=$1"; fi

# -N turns off buffering so events print as they arrive.
curl -N -sS --fail-with-body -H "X-Api-Key: ${HALFPOINT_API_KEY}" -H "Accept: text/event-stream" "$url"
