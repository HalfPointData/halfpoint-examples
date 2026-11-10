# Consensus odds API

HalfPoint publishes one fair price per game, built from live order books and updated as they move. We filter out stale and off-market prices, so you get one clean price per game. It covers MLB, NBA, NFL, college football, NHL, the Premier League, the Bundesliga, LaLiga and the Champions League. The API serves fixtures, live scores, grades and a consensus fair price.

You can use it over REST with an API key, or as tools over MCP. The free sample answers without a key: one league, delayed, 10 fixtures.

```bash
curl "https://odds.halfpoint.tech/sample/odds?league=nba"
python3 python/odds.py nba
```

- Read the consensus of a league: [`python/odds.py`](../python/odds.py), [`typescript/odds.ts`](../typescript/odds.ts)
- Compare it with sportsbook prices: [`python/positive_ev.py`](../python/positive_ev.py), [`python/distance_from_fair.py`](../python/distance_from_fair.py)
- Docs: https://docs.halfpoint.tech/endpoints/odds/
