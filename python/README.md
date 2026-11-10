# Python

Standard library only, Python 3.9 or later. Nothing to install.

```bash
python3 odds.py nba                                    # the delayed sample, no key
HALFPOINT_API_KEY=hp_... python3 odds.py nba           # also the current /odds
HALFPOINT_API_KEY=hp_... python3 odds_stream.py nba    # /odds/stream (Realtime or Risk plan)
python3 positive_ev.py nba <fixture id>:home:+150      # the EV of a sportsbook price
python3 distance_from_fair.py nba <fixture id> home bookA=+150 bookB=2.38
python3 line_movement.py nba [<fixture id>]            # each change of one game's price
```

- [`odds.py`](odds.py) reads `/sample/odds` and, with `HALFPOINT_API_KEY` set, `/odds`. On the
  Risk plan it also prints `stop`, `widened` and `range`.
- [`odds_stream.py`](odds_stream.py) reads `/odds/stream`, keeps the current price per fixture,
  and reconnects when the connection drops, starting over from the state the stream sends first.
- [`positive_ev.py`](positive_ev.py) compares sportsbook prices you pass (decimal or American
  odds) with the fair price and prints the implied probability, the difference and the EV of each,
  marking a positive EV. Without prices it lists the fair odds of every outcome.
- [`distance_from_fair.py`](distance_from_fair.py) takes one outcome and the prices you pass and
  prints how far each price is from the fair price, in percentage points and in payout.
- [`line_movement.py`](line_movement.py) polls the fair price of one game with ETag /
  If-None-Match and prints each change with the move since the last one.

All three read the sample without `HALFPOINT_API_KEY`, and `/odds` with it.
