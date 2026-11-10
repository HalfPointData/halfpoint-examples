# curl

| script | key | what |
|--------|-----|------|
| [`sample.sh`](sample.sh) | no | the delayed sample: `/sample/odds` and `/sample/fixtures` for one league |
| [`fixtures.sh`](fixtures.sh) | yes | `/fixtures`: a league's schedule on a date |
| [`odds.sh`](odds.sh) | yes | `/odds`: the consensus right now |
| [`odds-stream.sh`](odds-stream.sh) | yes, Realtime or Risk | `/odds/stream`: the consensus as it changes (Server-Sent Events) |
| [`etag-polling.sh`](etag-polling.sh) | optional | polling with `ETag` and `If-None-Match`: `304` when nothing changed |

```bash
./sample.sh nba
export HALFPOINT_API_KEY=hp_...
./fixtures.sh nfl 2026-11-15
./odds.sh nba
./odds-stream.sh nba
./etag-polling.sh nba 10
```

The key goes in the `X-Api-Key` header. `?key=` works too, but query strings end up in logs and
browser histories more easily.

The scripts need bash and curl 7.76 or later (for `--fail-with-body`).

Leagues: `mlb`, `nba`, `nfl`, `cfb`, `nhl`, `epl`, `bund`, `laliga`, `ucl`.
