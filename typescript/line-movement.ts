// Line movement: poll HalfPoint's fair price for one game and print each change.
//
//   npx tsx line-movement.ts nba                                # the first fixture listed
//   npx tsx line-movement.ts nba nba-261110-cle-cha             # one fixture
//   HALFPOINT_API_KEY=hp_... npx tsx line-movement.ts nba nba-261110-cle-cha
//
// Polls with ETag / If-None-Match, as curl/etag-polling.sh does: it sends the ETag of the last
// answer back and treats a `304` as no change. Without a key it polls the delayed sample; with
// HALFPOINT_API_KEY it polls /odds. To have every change pushed instead of polling, see
// odds-stream.ts.
//
// Node 20+ (built-in fetch). Docs: https://docs.halfpoint.tech/polling/

import { args, env, fail } from "./env.ts";
import type { OddsAnswer, Price } from "./types.ts";

const ODDS = "https://odds.halfpoint.tech";
const OUTCOMES = ["away", "draw", "home"] as const;

const [league, wantedId] = args;
if (!league) fail("usage: line-movement.ts <league> [<fixture id>]");

const key = env.HALFPOINT_API_KEY;
const url = key ? `${ODDS}/odds?league=${league}` : `${ODDS}/sample/odds?league=${league}`;
const interval = key ? 1000 : 10_000; // ms between polls; the sample as in curl/etag-polling.sh
if (!key) console.error("No HALFPOINT_API_KEY: polling the delayed sample.");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let etag: string | null = null;

/** One request. Returns the answer, or null when it is unchanged. */
async function poll(): Promise<OddsAnswer | null> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (key) headers["X-Api-Key"] = key; // the header keeps the key out of URLs and logs
  if (etag) headers["If-None-Match"] = etag;
  const response = await fetch(url, { headers });
  if (response.status === 304) return null;
  if (!response.ok) {
    const text = (await response.text()).trim();
    const retry = response.headers.get("Retry-After");
    if (response.status === 429 && retry) {
      console.error(`429: ${text}; waiting ${retry} s`);
      await sleep(Number(retry) * 1000);
      return null;
    }
    fail(`${response.status} from ${url}: ${text}`);
  }
  etag = response.headers.get("ETag");
  return (await response.json()) as OddsAnswer;
}

let fixtureId = wantedId;
const last = new Map<string, Price>(); // market -> the price as last printed

for (;;) {
  let answer: OddsAnswer | null = null;
  try {
    answer = await poll();
  } catch (err) {
    console.error(`request failed (${err}); retrying`);
  }
  if (answer) {
    if (!fixtureId && answer.fixtures.length) {
      fixtureId = answer.fixtures[0].id;
      console.log(`following ${fixtureId}`);
    }
    const fixture = answer.fixtures.find((f) => f.id === fixtureId);
    if (!fixture) {
      console.error(`${answer.updated} ${fixtureId} not listed`);
    } else {
      for (const [market, price] of Object.entries(fixture.markets)) {
        const before = last.get(market);
        const changed = !before || before.recent !== price.recent || OUTCOMES.some((n) => before[n] !== price[n]);
        if (!changed) continue;
        const moves = OUTCOMES.filter((n) => price[n] !== undefined).map((n) => {
          const now = price[n] as number;
          const was = before?.[n];
          const delta = was === undefined ? 0 : now - was;
          return `${n} ${now.toFixed(3)} (${delta >= 0 ? "+" : ""}${delta.toFixed(3)})`;
        });
        console.log(`${price.at} ${market}: ${moves.join("  ")}${price.recent ? "" : "  not recent"}`);
        last.set(market, price);
      }
    }
  }
  await sleep(interval);
}
