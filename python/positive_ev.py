"""Positive EV scanner: compare sportsbook prices you supply with HalfPoint's fair price.

Standard library only (Python 3.9+). You pass the sportsbook prices as arguments, each
`<fixture id>:<outcome>:<odds>`. Odds are decimal (`2.45`) or American (`+145`,
`-120`). Outcomes are `home`, `away` and, in soccer, `draw`.

    python3 positive_ev.py nba                                  # fair odds from the sample, no key
    python3 positive_ev.py nba nba-261110-cle-cha:home:+150     # the EV of one book price
    HALFPOINT_API_KEY=hp_... python3 positive_ev.py nba ...     # against the current /odds

For each price it prints the fair probability p, the book's implied probability 1/odds, the
difference (p - 1/odds) * 100 in percentage points, and the expected value per unit staked,
p * odds - 1. A positive EV means the book pays more than the fair price.

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


def american_odds(odds: float) -> str:
    return f"+{(odds - 1) * 100:.0f}" if odds >= 2 else f"{-100 / (odds - 1):.0f}"


def fair_prices(answer: dict) -> dict[tuple[str, str], tuple[float, bool]]:
    """(fixture id, outcome) -> (fair probability, recent) for the first market of each fixture."""
    prices = {}
    for fixture in answer["fixtures"]:
        for price in fixture["markets"].values():  # moneyline, or moneyline_3way for soccer
            for outcome in ("away", "draw", "home"):
                if outcome in price:
                    prices[(fixture["id"], outcome)] = (price[outcome], price.get("recent", True))
            break
    return prices


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: positive_ev.py <league> [<fixture id>:<outcome>:<odds> ...]")
    league, wanted = sys.argv[1], sys.argv[2:]

    key = os.environ.get("HALFPOINT_API_KEY")
    if key:
        answer = get(f"{ODDS}/odds?league={league}", key)
    else:
        print("No HALFPOINT_API_KEY: using the delayed sample.\n")
        answer = get(f"{ODDS}/sample/odds?league={league}")
    fair = fair_prices(answer)
    print(f"fair prices updated {answer['updated']}")

    if not wanted:
        # No book prices given: list the fair odds. A book price above them has a positive EV.
        print(f"{'fixture':<28} {'outcome':<8} {'fair p':>7} {'decimal':>8} {'american':>9}")
        for (fixture_id, outcome), (p, recent) in fair.items():
            note = "" if recent else "  not recent: a reference, not a price"
            print(f"{fixture_id:<28} {outcome:<8} {p:>7.3f} {1 / p:>8.2f} "
                  f"{american_odds(1 / p):>9}{note}")
        return

    rows = []
    for arg in wanted:
        try:
            fixture_id, outcome, text = arg.rsplit(":", 2)
            odds = decimal_odds(text)
        except ValueError as err:
            sys.exit(f"cannot read {arg!r}: {err}")
        if (fixture_id, outcome) not in fair:
            print(f"{arg}: no fair price for this fixture and outcome", file=sys.stderr)
            continue
        p, recent = fair[(fixture_id, outcome)]
        if not recent:
            print(f"{arg}: the fair price is not recent; skipped", file=sys.stderr)
            continue
        rows.append((p * odds - 1, p - 1 / odds, p, odds, fixture_id, outcome))

    print(f"{'fixture':<28} {'outcome':<8} {'odds':>6} {'implied':>8} {'fair p':>7} "
          f"{'diff':>8} {'EV':>7}")
    for ev, diff, p, odds, fixture_id, outcome in sorted(rows, reverse=True):
        mark = "  +EV" if ev > 0 else ""
        print(f"{fixture_id:<28} {outcome:<8} {odds:>6.2f} {1 / odds:>8.3f} {p:>7.3f} "
              f"{diff * 100:>+6.1f}pp {ev:>+7.1%}{mark}")


if __name__ == "__main__":
    main()
