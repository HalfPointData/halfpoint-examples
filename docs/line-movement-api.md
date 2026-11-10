# Line movement API

Line movement is how a game's price changes over time. HalfPoint publishes one fair price per game,
built from live order books and updated as they move.

[`python/line_movement.py`](../python/line_movement.py) follows one game and prints each change
of its fair probabilities, with the change since the last line. It sends the `ETag` of the
last answer back in `If-None-Match` and treats a `304` as no change.

```bash
python3 python/line_movement.py nba                          # the first fixture, no key
HALFPOINT_API_KEY=hp_... python3 python/line_movement.py nba <fixture id>
```

Without a key it polls the free sample. The free sample answers without a key: one league,
delayed, 10 fixtures. To have every change pushed instead of polling, start from
[`python/odds_stream.py`](../python/odds_stream.py).

- TypeScript version: [`typescript/line-movement.ts`](../typescript/line-movement.ts)
- Docs: https://docs.halfpoint.tech/polling/
