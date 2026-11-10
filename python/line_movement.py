"""Line movement: poll HalfPoint's fair price for one game and print each change.

Standard library only (Python 3.9+). Polls with ETag / If-None-Match, as curl/etag-polling.sh
does: it sends the ETag of the last answer back and treats a `304` as no change. Without a key
it polls the delayed sample; with HALFPOINT_API_KEY it polls /odds. To have every change pushed
instead of polling, see odds_stream.py.

    python3 line_movement.py nba                                # the first fixture listed
    python3 line_movement.py nba nba-261110-cle-cha             # one fixture
    HALFPOINT_API_KEY=hp_... python3 line_movement.py nba nba-261110-cle-cha

Docs: https://docs.halfpoint.tech/polling/
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request

ODDS = "https://odds.halfpoint.tech"
USER_AGENT = "halfpoint-examples/python"
OUTCOMES = ("away", "draw", "home")


def poll(url: str, key: str | None, etag: str | None) -> tuple[dict | None, str | None]:
    """One request. Returns (answer, etag), or (None, etag) when the answer is unchanged."""
    headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    if key:
        headers["X-Api-Key"] = key  # the header keeps the key out of URLs and logs
    if etag:
        headers["If-None-Match"] = etag
    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.load(response), response.headers.get("ETag")
    except urllib.error.HTTPError as err:
        if err.code == 304:
            return None, etag
        body = err.read().decode("utf-8", "replace").strip()
        retry = err.headers.get("Retry-After")
        if err.code == 429:
            try:
                wait = int(retry or "")
            except ValueError:
                wait = None  # no usable Retry-After: the caller waits its interval
            print(f"429: {body}; waiting {wait} s" if wait else f"429: {body}", file=sys.stderr)
            if wait:
                time.sleep(wait)
            return None, etag
        sys.exit(f"{err.code} from {url}: {body}")


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: line_movement.py <league> [<fixture id>]")
    league = sys.argv[1]
    fixture_id = sys.argv[2] if len(sys.argv) > 2 else None

    key = os.environ.get("HALFPOINT_API_KEY")
    if key:
        url, interval = f"{ODDS}/odds?league={league}", 1  # seconds between polls, as curl/etag-polling.sh
    else:
        url, interval = f"{ODDS}/sample/odds?league={league}", 90  # the sample is delayed
        print("No HALFPOINT_API_KEY: polling the delayed sample.", file=sys.stderr)

    etag = None
    last: dict[str, dict] = {}  # market -> the price as last printed
    while True:
        try:
            answer, etag = poll(url, key, etag)
        except (urllib.error.URLError, OSError) as err:
            print(f"request failed ({err}); retrying", file=sys.stderr)
            answer = None
        except KeyboardInterrupt:
            return
        if answer is not None:
            fixtures = answer["fixtures"]
            if fixture_id is None and fixtures:
                fixture_id = fixtures[0]["id"]
                print(f"following {fixture_id}")
            fixture = next((f for f in fixtures if f["id"] == fixture_id), None)
            if fixture_id is None:
                print(f"{answer['updated']} no fixtures in this league yet", file=sys.stderr)
            elif fixture is None:
                print(f"{answer['updated']} {fixture_id} not listed", file=sys.stderr)
            else:
                for market, price in fixture["markets"].items():
                    before = last.get(market)
                    changed = before is None or any(
                        price.get(n) != before.get(n) for n in OUTCOMES + ("recent",)
                    )
                    if changed:
                        moves = []
                        for n in OUTCOMES:
                            if n in price:
                                delta = price[n] - before[n] if before and n in before else 0.0
                                moves.append(f"{n} {price[n]:.3f} ({delta:+.3f})")
                        note = "" if price.get("recent", True) else "  not recent"
                        print(f"{price['at']} {market}: {'  '.join(moves)}{note}")
                        last[market] = price
        try:
            time.sleep(interval)
        except KeyboardInterrupt:
            return


if __name__ == "__main__":
    main()
