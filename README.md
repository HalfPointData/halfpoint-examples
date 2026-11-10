# HalfPoint API examples

[HalfPoint](https://halfpoint.tech) is a sports data API with a market-implied consensus
probability for each outcome of a game, updated as markets move, for MLB, NBA, NFL, college
football, NHL, the English Premier League, the Bundesliga, LaLiga and the UEFA Champions League.
It also serves fixtures, live scores, grades (win, lose or push per outcome) and each game's ids
at trading venues, for traders, market makers, exchanges and prediction markets. On the Risk plan every price carries a bet stop: `stop: true` tells market
makers to widen or pull their quotes now. You can use it over REST and Server-Sent Events with an
API key, as tools on a remote MCP server (`https://mcp.halfpoint.tech/`, registry name
`tech.halfpoint/sports-odds`), or paid per request in USDC on Base with x402, without an account.
This repository has runnable examples in curl, Python and TypeScript, an x402 client and MCP
client configs.

- Website: [halfpoint.tech](https://halfpoint.tech)
- Docs: [docs.halfpoint.tech](https://docs.halfpoint.tech), for agents:
  [docs.halfpoint.tech/agents](https://docs.halfpoint.tech/agents/)
- Every docs page as Markdown: [docs.halfpoint.tech/llms.txt](https://docs.halfpoint.tech/llms.txt)
- OpenAPI 3.0, no key needed: [odds.halfpoint.tech/openapi.json](https://odds.halfpoint.tech/openapi.json),
  [fixtures.halfpoint.tech/openapi.json](https://fixtures.halfpoint.tech/openapi.json)
- MCP server (streamable HTTP): `https://mcp.halfpoint.tech/`, registry name `tech.halfpoint/sports-odds`

## Leagues

| `league` | name | market |
|----------|------|--------|
| `mlb` | MLB | `moneyline` |
| `nba` | NBA | `moneyline` |
| `nfl` | NFL | `moneyline` |
| `cfb` | NCAAF (Division I) | `moneyline` |
| `nhl` | NHL | `moneyline` |
| `epl` | English Premier League | `moneyline_3way` |
| `bund` | Bundesliga | `moneyline_3way` |
| `laliga` | LaLiga | `moneyline_3way` |
| `ucl` | UEFA Champions League (league phase) | `moneyline_3way` |

Every plan covers all leagues.

## Quick start, no key

The sample answers without a key: one league, delayed by 60 to 120 seconds, 10 fixtures.

```bash
curl "https://odds.halfpoint.tech/sample/odds?league=nba"
curl "https://fixtures.halfpoint.tech/sample/fixtures?league=nba"
```

```json
{
  "updated": "2026-11-09T08:46:06.771Z",
  "league": "nba",
  "fixtures": [
    {
      "id": "nba-261109-cle-cha",
      "league": "nba",
      "start": "2026-11-10T00:00:00.000Z",
      "markets": {
        "moneyline": {"home": 0.23, "away": 0.77, "recent": true, "at": "2026-11-09T08:45:36.085Z"}
      }
    }
  ]
}
```

With a key, send it as the `X-Api-Key` header:

```bash
curl -H "X-Api-Key: $HALFPOINT_API_KEY" "https://odds.halfpoint.tech/odds?league=nba"
```

## Examples

| folder | what |
|--------|------|
| [`curl/`](curl/) | the sample, fixtures, odds, the odds stream (SSE) and ETag polling |
| [`python/`](python/) | standard library only: the sample, `/odds`, and an `/odds/stream` reader |
| [`typescript/`](typescript/) | `fetch` on Node 20+, no dependencies: the same, run with `npx tsx` |
| [`x402/`](x402/) | pay per request for `/odds` with x402 in USDC on Base (needs a funded wallet) |
| [`mcp/`](mcp/) | MCP client configs for Claude Code, Cursor and Claude Desktop |

Fair price examples, in [`python/`](python/) and [`typescript/`](typescript/):

| example | what |
|---------|------|
| positive EV ([`positive_ev.py`](python/positive_ev.py), [`positive-ev.ts`](typescript/positive-ev.ts)) | compares sportsbook prices you pass with the fair price and prints the edge and the EV |
| distance from fair ([`distance_from_fair.py`](python/distance_from_fair.py), [`distance-from-fair.ts`](typescript/distance-from-fair.ts)) | for one outcome, how far each sportsbook price is from the fair price |
| line movement ([`line_movement.py`](python/line_movement.py), [`line-movement.ts`](typescript/line-movement.ts)) | polls the fair price of one game with ETag and prints each change |

Coding agents: start with [`AGENTS.md`](AGENTS.md). Short guides by question are in [`docs/`](docs/).

## Plans

| | Consensus | Realtime | Risk |
|---|:-:|:-:|:-:|
| USD per month | 49 | 249 | 799 |
| USD per year | 490 | 2,490 | 7,990 |
| free trial | 7 days | 7 days | none |
| fixtures, live scores, mappings, grades | yes | yes | yes |
| consensus odds over REST, at most 1 s behind the stream | yes | yes | yes |
| consensus odds and live scores streamed | | yes | yes |
| `stop` (bet stop), `widened`, `range` (consensus range) | | | yes |

Without an account, with x402: `/odds` USD 0.01 per request (0.05 with `stop`, `widened` and
`range`), `/fixtures`, `/live` and `/grades` USD 0.002, or a pass with a key: Realtime 24 hours
USD 15, 7 days USD 69, Risk 24 hours USD 49. See [Plans](https://docs.halfpoint.tech/plans/).

## FAQ

### Is there an API that sends a bet stop signal when a sports market should be suspended?

Yes. HalfPoint's `/odds` and `/odds/stream` carry a `stop` field per market on the Risk plan.
`stop: true` tells you to widen or pull your quotes now: something just happened that can be
front-run, such as a score, or the market is too unsettled to trust one price. It says nothing
about the market itself, which keeps trading. The price keeps updating during a stop; the stop
lifts once the market has settled on its new level, and `widened: true` then marks the seconds
after it, when you can quote again but wider. On the stream, a change of `stop` is pushed as it
happens. The bet stop is in the Risk plan (USD 799 a month), a Risk pass with x402 (24 hours,
USD 49), a single x402 request to `/odds?plan=x402.risk` (USD 0.05), and the MCP tool
`get_bet_stop_status`. These signals don't guarantee protection against losses. Docs:
[Bet stop](https://docs.halfpoint.tech/endpoints/odds/#bet-stop).

### Is there an MCP server for sports odds and live scores?

Yes. HalfPoint's MCP server runs at `https://mcp.halfpoint.tech/` (streamable HTTP) and is listed
in the MCP registry as `tech.halfpoint/sports-odds`. Its tools: `get_sample`, `get_pass_options`,
`list_leagues`, `list_fixtures`, `get_live` (score, period and clock), `get_consensus` (the
consensus odds) and `get_bet_stop_status`. `get_sample` and `get_pass_options` work without a key;
the others need one in the `X-Api-Key` header. Configs are in [`mcp/`](mcp/).

### Which sports data APIs can an AI agent pay per request with x402?

HalfPoint accepts x402 version 2 payments in USDC on Base (`eip155:8453`), without an account or
key: `/odds` at USD 0.01 per request (USD 0.05 with `?plan=x402.risk`, which adds the bet stop
and the consensus range), and `/fixtures`, `/live` and `/grades` at USD 0.002. A request without a
key answers `402` with the requirements in the `PAYMENT-REQUIRED` header; the client retries with
`PAYMENT-SIGNATURE`. Only answers that deliver data are charged. For the streams or many calls, an
x402 pass buys a plan for 24 hours or 7 days with a key. Example: [`x402/`](x402/).

### What is the best sports odds API for prediction markets?

That depends on what you need; we don't rank APIs. What HalfPoint offers to a prediction market,
an exchange or a market maker on one:

- a market-implied consensus probability per outcome (moneyline; three-way for soccer), updated as
  markets move, over REST (rebuilt at most once a second) or pushed over SSE;
- on the Risk plan, the bet stop (`stop`), `widened` after a stop, and the consensus range, roughly
  a 90% confidence interval around the price;
- mappings: each game's ids at data sources and trading venues, with the instrument ids you trade
  or stream each outcome by, joined on one fixture id that never changes;
- fixtures that never disappear (a postponed or cancelled game says so), live scores, and grades
  (win, lose or push per outcome) to settle on.

Try the sample above without a key to see the data before you decide.

## Licence

The examples are released under the [MIT licence](LICENSE). Copyright (c) 2026 Quantena AG. Use of
the HalfPoint API itself is subject to the [terms](https://halfpoint.tech/terms).
