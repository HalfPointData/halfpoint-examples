# Positive EV scanner in Python

A bet has a positive expected value (EV) when the sportsbook pays more than the fair price. With
fair probability `p` and decimal odds `d`, the EV per unit staked is `p * d - 1`.

[`python/positive_ev.py`](../python/positive_ev.py) reads the fair price from HalfPoint and
compares each sportsbook price you pass with it. It uses the Python standard library only.

```bash
python3 python/positive_ev.py nba                                   # fair odds, no key
python3 python/positive_ev.py nba <fixture id>:home:+150 <fixture id>:away:1.62
HALFPOINT_API_KEY=hp_... python3 python/positive_ev.py nba ...
```

For each price it prints the fair probability, the book's implied probability, the edge and the
EV, sorted by EV, and marks the prices with a positive EV. Without arguments after the league, it
lists the fair decimal and American odds of every outcome.

Without a key it reads the free sample. The free sample answers without a key: one league,
delayed, 10 fixtures. HalfPoint publishes one fair price per game, built from live order books and
updated as they move.

- TypeScript version: [`typescript/positive-ev.ts`](../typescript/positive-ev.ts)
- Docs: https://docs.halfpoint.tech/endpoints/odds/
