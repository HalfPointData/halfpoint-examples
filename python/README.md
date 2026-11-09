# Python

Standard library only, Python 3.9 or later. Nothing to install.

```bash
python3 odds.py nba                                    # the delayed sample, no key
HALFPOINT_API_KEY=hp_... python3 odds.py nba           # also the current /odds
HALFPOINT_API_KEY=hp_... python3 odds_stream.py nba    # /odds/stream (Realtime or Risk plan)
```

- [`odds.py`](odds.py) reads `/sample/odds` and, with `HALFPOINT_API_KEY` set, `/odds`. On the
  Risk plan it also prints `stop`, `widened` and `range`.
- [`odds_stream.py`](odds_stream.py) reads `/odds/stream`, keeps the current price per fixture,
  and reconnects when the connection drops, starting over from the state the stream sends first.
