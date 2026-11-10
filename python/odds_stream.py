"""Follow HalfPoint's consensus as it changes: /odds/stream over Server-Sent Events.

Standard library only (Python 3.9+). Needs the Realtime or Risk plan.

    HALFPOINT_API_KEY=hp_... python3 odds_stream.py [league]

The stream sends the current state first (one `price` event per fixture), then every change.
`price` replaces what you hold for that fixture; `remove` drops one market. There is no replay
and no Last-Event-ID: after a disconnect this script reconnects and starts over from the new
state, dropping what it held.

Docs: https://docs.halfpoint.tech/endpoints/odds-stream/
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


def events(response):
    """Yield (event, data) pairs from an SSE response; skip ':' comment lines."""
    event, data = "message", []
    for raw in response:
        line = raw.decode("utf-8").rstrip("\r\n")
        if not line:  # a blank line ends the event
            if data:
                yield event, "\n".join(data)
            event, data = "message", []
        elif line.startswith(":"):
            continue  # keep-alive comment, about every 30 s
        else:
            field, _, value = line.partition(":")
            value = value[1:] if value.startswith(" ") else value
            if field == "event":
                event = value
            elif field == "data":
                data.append(value)


def describe(fixture: dict) -> str:
    parts = []
    for market, price in fixture["markets"].items():
        outcomes = " ".join(f"{n}={price[n]}" for n in ("away", "draw", "home") if n in price)
        flags = " ".join(f"{f}={price[f]}" for f in ("recent", "stop", "widened") if f in price)
        parts.append(f"{market} {outcomes} {flags}")
    return "; ".join(parts)


def follow(url: str, key: str) -> None:
    request = urllib.request.Request(
        url,
        headers={"X-Api-Key": key, "Accept": "text/event-stream", "User-Agent": USER_AGENT},
    )
    held: dict[str, dict] = {}  # fixture id -> the fixture as last sent
    with urllib.request.urlopen(request, timeout=90) as response:  # pings every ~30 s
        for event, data in events(response):
            payload = json.loads(data)
            if event == "price":
                held[payload["id"]] = payload
                print(f"price  {payload['id']}: {describe(payload)}")
            elif event == "remove":
                fixture = held.get(payload["id"])
                if fixture:
                    fixture["markets"].pop(payload["market"], None)
                    if not fixture["markets"]:
                        del held[payload["id"]]
                print(f"remove {payload['id']} {payload['market']}")


def main() -> None:
    key = os.environ.get("HALFPOINT_API_KEY")
    if not key:
        sys.exit("Set HALFPOINT_API_KEY (Realtime or Risk plan): https://docs.halfpoint.tech/plans/")
    league = sys.argv[1] if len(sys.argv) > 1 else None
    url = f"{ODDS}/odds/stream" + (f"?league={league}" if league else "")

    while True:
        try:
            follow(url, key)
            print("stream ended; reconnecting", file=sys.stderr)
            time.sleep(1)
        except urllib.error.HTTPError as err:
            body = err.read().decode("utf-8", "replace").strip()
            if err.code == 429 and err.headers.get("Retry-After"):
                wait = int(err.headers["Retry-After"])
                print(f"429: {body}; waiting {wait} s", file=sys.stderr)
                time.sleep(wait)
                continue
            # 401 unknown key, 402 no subscription, 403 plan lacks the stream,
            # 429 without Retry-After: too many streams open for this key.
            sys.exit(f"{err.code}: {body}")
        except (urllib.error.URLError, OSError) as err:
            print(f"disconnected ({err}); reconnecting in 2 s", file=sys.stderr)
            time.sleep(2)
        except KeyboardInterrupt:
            return


if __name__ == "__main__":
    main()
