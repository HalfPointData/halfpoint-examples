# Devig odds API

To devig odds is to remove the bookmaker's margin from a price, so the implied probabilities of
all outcomes add up to 1. People do it to get a fair price to compare a sportsbook against.

HalfPoint publishes one fair price per game, built from live order books and updated as they move.
We filter out stale and off-market prices, so you get one clean price per game. Each outcome's
price is a probability; probabilities are decimals from 0 to 1. The fair decimal odds are `1 / p`.

To see how far a sportsbook price is from the fair price, run the distance from fair example:

```bash
python3 python/distance_from_fair.py nba                     # list fixture ids
python3 python/distance_from_fair.py nba <fixture id> home bookA=+150 bookB=2.38
```

For each price it prints the book's implied probability, its distance from the fair probability
in percentage points, and how much more or less the book pays than the fair odds.

- Example: [`python/distance_from_fair.py`](../python/distance_from_fair.py),
  [`typescript/distance-from-fair.ts`](../typescript/distance-from-fair.ts)
- Docs: https://docs.halfpoint.tech/endpoints/odds/
