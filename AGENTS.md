# Instructions for coding agents

This repository has small, runnable examples for the HalfPoint API. Copy the example closest to your task and change it; do not write a client from scratch.

## Which example to start from

| task | Python | TypeScript |
|------|--------|------------|
| read the fair price of every game in a league | [`python/odds.py`](python/odds.py) | [`typescript/odds.ts`](typescript/odds.ts) |
| compare sportsbook prices with the fair price and print the difference and the EV | [`python/positive_ev.py`](python/positive_ev.py) | [`typescript/positive-ev.ts`](typescript/positive-ev.ts) |
| for one outcome, how far a sportsbook price you pass is from the fair price | [`python/distance_from_fair.py`](python/distance_from_fair.py) | [`typescript/distance-from-fair.ts`](typescript/distance-from-fair.ts) |
| follow the fair price of one game and print each change (ETag polling) | [`python/line_movement.py`](python/line_movement.py) | [`typescript/line-movement.ts`](typescript/line-movement.ts) |
| receive every change pushed over Server-Sent Events | [`python/odds_stream.py`](python/odds_stream.py) | [`typescript/odds-stream.ts`](typescript/odds-stream.ts) |

Other folders: [`curl/`](curl/) has the same calls as shell scripts, [`mcp/`](mcp/) has MCP client configs, and [`x402/`](x402/) pays per request with x402 (it spends real money; do not run it unless the user asks).

The examples take sportsbook prices as command-line arguments, in decimal (`2.45`) or American (`+145`, `-120`) odds. Probabilities are decimals from 0 to 1. The examples compute fair decimal odds as `1 / p`.

## Environment

| name | used by | |
|------|---------|-|
| `HALFPOINT_API_KEY` | `python/`, `typescript/`, `curl/` | the API key; the examples send it in the `X-Api-Key` header |
| `EVM_PRIVATE_KEY` | `x402/` | the wallet key that pays; never needed for the other examples |

Never write a key into a file, a URL, a log or a commit. Read it from the environment.

Without `HALFPOINT_API_KEY`, the examples read the free sample. The free sample answers without a key: one league, delayed, 10 fixtures. Start there to see the data:

```bash
python3 python/odds.py nba
python3 python/positive_ev.py nba
npx tsx typescript/odds.ts nba
```

## Runtime and checks

- Python: standard library only, 3.9 or later. Check with `python3 -m py_compile <file>`.
- TypeScript: Node 20 or later, built-in `fetch`, no dependencies, run with `npx tsx`. Check with `npm run typecheck` in `typescript/`.
- Keep new examples the same: one file per example, no new dependencies, the key read from `HALFPOINT_API_KEY`.

## Docs

- Docs: https://docs.halfpoint.tech, for agents: https://docs.halfpoint.tech/agents/
- https://docs.halfpoint.tech/llms.txt lists every documentation page as Markdown.
- Both API hosts serve an OpenAPI 3.0 description of every route, its parameters and errors, without a key: https://odds.halfpoint.tech/openapi.json and https://fixtures.halfpoint.tech/openapi.json
- An MCP server (streamable HTTP) at https://mcp.halfpoint.tech/ offers the same data as tools.

Use only the endpoints and fields the examples and the docs describe. If you need a field you do not see there, read the OpenAPI description; do not guess one.
