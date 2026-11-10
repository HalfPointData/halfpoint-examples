"""Distance from fair: how far each sportsbook price for one outcome is from HalfPoint's fair price.

Standard library only (Python 3.9+). You pass the fixture, the outcome and one price per book,
each `[book=]odds`. Odds are decimal (`2.45`) or American (`+145`, `-120`). Outcomes are `home`,
`away` and, in soccer, `draw`.

    python3 distance_from_fair.py nba                           # list fixture ids (the sample)
    python3 distance_from_fair.py nba nba-261110-cle-cha home bookA=+150 bookB=2.38 bookC=-105
    HALFPOINT_API_KEY=hp_... python3 distance_from_fair.py nba ...   # against the current /odds

For each price it prints the book's implied probability 1/odds, its distance from the fair
probability p in percentage points, and how much more or less the book pays than the fair odds
1/p. The rows are sorted from the price that pays most to the one that pays least.

Docs: https://docs.halfpoint.tech/endpoints/odds/
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

ODDS = "https://odds.halfpoint.tech"
USER_AGENT = "halfpoint-examples/python"


def get(url: str, key: str | None = None) -> dict:
    headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    if key:
        headers["X-Api-Key"] = key  # the header keeps the key out of URLs and logs
    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.load(response)
    except urllib.error.HTTPError as err:
        # Errors answer {"error": "..."}; 429 carries Retry-After in seconds.
        body = err.read().decode("utf-8", "replace").strip()
        retry = err.headers.get("Retry-After")
        hint = f" (retry after {retry} s)" if retry else ""
        sys.exit(f"{err.code} from {url}{hint}: {body}")


def decimal_odds(text: str) -> float:
    """Decimal odds from `2.45`, `+145` or `-120`."""
    if text.startswith(("+", "-")):
        american = float(text)
        if abs(american) < 100:
            raise ValueError(f"American odds must be at least 100 away from 0: {text}")
        return 1 + american / 100 if american > 0 else 1 + 100 / -american
    odds = float(text)
    if odds <= 1:
        raise ValueError(f"decimal odds must be above 1: {text}")
    return odds


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: distance_from_fair.py <league> [<fixture id> <outcome> [book=]<odds> ...]")
    league = sys.argv[1]

    key = os.environ.get("HALFPOINT_API_KEY")
    if key:
        answer = get(f"{ODDS}/odds?league={league}", key)
    else:
        print("No HALFPOINT_API_KEY: using the delayed sample.\n")
        answer = get(f"{ODDS}/sample/odds?league={league}")
    fixtures = {fixture["id"]: fixture for fixture in answer["fixtures"]}

    if len(sys.argv) < 5:
        print("fixtures with a fair price:")
        for fixture_id, fixture in fixtures.items():
            print(f"  {fixture_id:<28} start {fixture['start']}  markets {', '.join(fixture['markets'])}")
        return

    fixture_id, outcome, books = sys.argv[2], sys.argv[3], sys.argv[4:]
    fixture = fixtures.get(fixture_id) or sys.exit(f"{fixture_id}: not in this answer")
    price = next(iter(fixture["markets"].values()), None)  # moneyline, or moneyline_3way
    if not price or outcome not in price:
        sys.exit(f"{fixture_id}: no fair price for {outcome}")
    if not price.get("recent", True):
        sys.exit(f"{fixture_id}: the fair price is not recent: a reference, not a price")
    p = price[outcome]
    print(f"{fixture_id} {outcome}: fair p {p:.3f}, fair odds {1 / p:.2f} (at {price['at']})\n")

    rows = []
    for i, arg in enumerate(books, 1):
        book, _, text = arg.rpartition("=")
        try:
            odds = decimal_odds(text)
        except ValueError as err:
            sys.exit(f"cannot read {arg!r}: {err}")
        rows.append((odds, book or f"price {i}"))

    print(f"{'book':<12} {'odds':>6} {'implied':>8} {'distance':>9} {'pays vs fair':>13}")
    for odds, book in sorted(rows, reverse=True):
        distance = (1 / odds - p) * 100  # percentage points; below 0 the book pays more than fair
        pays = odds * p - 1  # odds / (1/p) - 1
        print(f"{book:<12} {odds:>6.2f} {1 / odds:>8.3f} {distance:>+8.1f}pp {pays:>+13.1%}")


if __name__ == "__main__":
    main()
