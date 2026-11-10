# TypeScript

Built-in `fetch`, Node 20 or later, no dependencies. Run with [tsx](https://tsx.is) through `npx`.

```bash
npx tsx odds.ts nba                                    # the delayed sample, no key
HALFPOINT_API_KEY=hp_... npx tsx odds.ts nba           # also the current /odds
HALFPOINT_API_KEY=hp_... npx tsx odds-stream.ts nba    # /odds/stream (Realtime or Risk plan)
npx tsx positive-ev.ts nba <fixture id>:home:+150      # the edge of a sportsbook price
npx tsx distance-from-fair.ts nba <fixture id> home bookA=+150 bookB=2.38
npx tsx line-movement.ts nba [<fixture id>]            # each change of one game's price
npm run typecheck
```

- [`odds.ts`](odds.ts) reads `/sample/odds` and, with `HALFPOINT_API_KEY` set, `/odds`.
- [`odds-stream.ts`](odds-stream.ts) reads `/odds/stream` with a small Server-Sent Events parser,
  keeps the current price per fixture, and reconnects when the connection drops.
- [`positive-ev.ts`](positive-ev.ts), [`distance-from-fair.ts`](distance-from-fair.ts) and
  [`line-movement.ts`](line-movement.ts) do the same as the Python versions in
  [`../python/`](../python/): the edge of sportsbook prices, their distance from the fair price,
  and each change of one game's price.
- [`types.ts`](types.ts) has the shape of an `/odds` answer.
