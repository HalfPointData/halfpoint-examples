// Distance from fair: how far a sportsbook price you pass is from HalfPoint's fair price.
//
//   npx tsx distance-from-fair.ts nba                           # list fixture ids (the sample)
//   npx tsx distance-from-fair.ts nba nba-261110-cle-cha home bookA=+150 bookB=2.38 bookC=-105
//   HALFPOINT_API_KEY=hp_... npx tsx distance-from-fair.ts nba ...   # against the current /odds
//
// You pass the fixture, the outcome and the prices, each `[book=]odds`. Odds are decimal
// (`2.45`) or American (`+145`, `-120`). Outcomes are `home`, `away` and, in soccer, `draw`. For
// each price it prints the book's implied probability 1/odds, its distance from the fair
// probability p in percentage points, and how much more or less the book pays than the fair odds
// 1/p. The rows are sorted from the price that pays most to the one that pays least.
//
// Node 20+ (built-in fetch). Docs: https://docs.halfpoint.tech/endpoints/odds/

import { args, env, fail } from "./env.ts";
import type { OddsAnswer } from "./types.ts";

const ODDS = "https://odds.halfpoint.tech";

async function get(url: string, key?: string): Promise<OddsAnswer> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (key) headers["X-Api-Key"] = key; // the header keeps the key out of URLs and logs
  const response = await fetch(url, { headers });
  if (!response.ok) {
    // Errors answer {"error": "..."}; 429 carries Retry-After in seconds.
    const retry = response.headers.get("Retry-After");
    fail(`${response.status} from ${url}${retry ? ` (retry after ${retry} s)` : ""}: ${(await response.text()).trim()}`);
  }
  return (await response.json()) as OddsAnswer;
}

/** Decimal odds from `2.45`, `+145` or `-120`. */
function decimalOdds(text: string): number {
  const value = Number(text);
  if (!Number.isFinite(value)) fail(`not a number: ${text}`);
  if (text.startsWith("+") || text.startsWith("-")) {
    if (Math.abs(value) < 100) fail(`American odds must be at least 100 away from 0: ${text}`);
    return value > 0 ? 1 + value / 100 : 1 + 100 / -value;
  }
  if (value <= 1) fail(`decimal odds must be above 1: ${text}`);
  return value;
}

const signed = (x: number, digits: number): string => `${x >= 0 ? "+" : ""}${x.toFixed(digits)}`;

const [league, fixtureId, outcome, ...books] = args;
if (!league) fail("usage: distance-from-fair.ts <league> [<fixture id> <outcome> [book=]<odds> ...]");

const key = env.HALFPOINT_API_KEY;
if (!key) console.log("No HALFPOINT_API_KEY: using the delayed sample.\n");
const answer = await get(key ? `${ODDS}/odds?league=${league}` : `${ODDS}/sample/odds?league=${league}`, key);

if (!fixtureId || !outcome || books.length === 0) {
  console.log("fixtures with a fair price:");
  for (const f of answer.fixtures) {
    console.log(`  ${f.id.padEnd(28)} start ${f.start}  markets ${Object.keys(f.markets).join(", ")}`);
  }
} else {
  const fixture = answer.fixtures.find((f) => f.id === fixtureId) ?? fail(`${fixtureId}: not in this answer`);
  const price = Object.values(fixture.markets)[0]; // moneyline, or moneyline_3way
  const known = outcome === "away" || outcome === "draw" || outcome === "home";
  const p = known ? price?.[outcome] : undefined;
  if (!price || p === undefined) fail(`${fixtureId}: no fair price for ${outcome}`);
  if (!(p > 0 && p < 1)) fail(`${fixtureId}: no fair odds for ${outcome} at p = ${p}`);
  if (!price.recent) fail(`${fixtureId}: the fair price is not recent: a reference, not a price`);
  console.log(`${fixtureId} ${outcome}: fair p ${p.toFixed(3)}, fair odds ${(1 / p).toFixed(2)} (at ${price.at})\n`);

  const rows = books.map((arg, i) => {
    const cut = arg.lastIndexOf("=");
    return { book: cut > 0 ? arg.slice(0, cut) : `price ${i + 1}`, odds: decimalOdds(arg.slice(cut + 1)) };
  });

  console.log(`${"book".padEnd(12)} ${"odds".padStart(6)} ${"implied".padStart(8)} ${"distance".padStart(9)} ${"pays vs fair".padStart(13)}`);
  for (const { book, odds } of rows.sort((a, b) => b.odds - a.odds)) {
    const distance = (1 / odds - p) * 100; // percentage points; below 0 the book pays more than fair
    const pays = odds * p - 1; // odds / (1/p) - 1
    console.log(
      `${book.padEnd(12)} ${odds.toFixed(2).padStart(6)} ${(1 / odds).toFixed(3).padStart(8)} ${(signed(distance, 1) + "pp").padStart(9)} ${(signed(pays * 100, 1) + "%").padStart(13)}`,
    );
  }
}
