# TypeScript

Built-in `fetch`, Node 20 or later, no dependencies. Run with [tsx](https://tsx.is) through `npx`.

```bash
npx tsx odds.ts nba                                    # the delayed sample, no key
HALFPOINT_API_KEY=hp_... npx tsx odds.ts nba           # also the current /odds
HALFPOINT_API_KEY=hp_... npx tsx odds-stream.ts nba    # /odds/stream (Realtime or Risk plan)
npm run typecheck
```

- [`odds.ts`](odds.ts) reads `/sample/odds` and, with `HALFPOINT_API_KEY` set, `/odds`.
- [`odds-stream.ts`](odds-stream.ts) reads `/odds/stream` with a small Server-Sent Events parser,
  keeps the current price per fixture, and reconnects when the connection drops.
- [`types.ts`](types.ts) has the shape of an `/odds` answer.
