"""Read HalfPoint's consensus odds: the keyless sample, and /odds with an API key.

Standard library only (Python 3.9+).

    python3 odds.py [league]                         # the delayed sample, no key
    HALFPOINT_API_KEY=hp_... python3 odds.py nba     # also the current /odds

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


def show(answer: dict) -> None:
    print(f"updated {answer['updated']}")
    for fixture in answer["fixtures"]:
        for market, price in fixture["markets"].items():
            outcomes = "  ".join(
                f"{name} {price[name]}" for name in ("away", "draw", "home") if name in price
            )
            # stop, widened and range are present on the Risk plan only.
            extra = []
            if "stop" in price:
                extra.append(f"stop={price['stop']}")
            if "widened" in price:
                extra.append(f"widened={price['widened']}")
            if "range" in price:
                extra.append(f"range={price['range']}")
            if not price.get("recent", True):
                extra.append("not recent: a reference, not a price")
            print(f"  {fixture['id']:<28} {market:<15} {outcomes}  {' '.join(extra)}".rstrip())


def main() -> None:
    league = sys.argv[1] if len(sys.argv) > 1 else "nba"

    print(f"Sample (delayed, no key): {league}")
    show(get(f"{ODDS}/sample/odds?league={league}"))

    key = os.environ.get("HALFPOINT_API_KEY")
    if not key:
        print("\nSet HALFPOINT_API_KEY for current prices: https://docs.halfpoint.tech/plans/")
        return

    print(f"\nCurrent /odds: {league}")
    show(get(f"{ODDS}/odds?league={league}", key))


if __name__ == "__main__":
    main()
