// Positive EV scanner: compare sportsbook prices you supply with HalfPoint's fair price.
//
//   npx tsx positive-ev.ts nba                                  # fair odds from the sample, no key
//   npx tsx positive-ev.ts nba nba-261110-cle-cha:home:+150     # the edge of one book price
//   HALFPOINT_API_KEY=hp_... npx tsx positive-ev.ts nba ...     # against the current /odds
//
// You pass the sportsbook prices as arguments, each `<fixture id>:<outcome>:<odds>`. Odds are
// decimal (`2.45`) or American (`+145`, `-120`). Outcomes are `home`, `away` and, in soccer,
// `draw`. For each price it prints the fair probability p, the book's implied probability
// 1/odds, the edge p - 1/odds, and the expected value per unit staked, p * odds - 1. A positive
// EV means the book pays more than the fair price.
//
// Node 20+ (built-in fetch). Docs: https://docs.halfpoint.tech/endpoints/odds/

import { args, env, fail } from "./env.ts";
import type { OddsAnswer } from "./types.ts";

const ODDS = "https://odds.halfpoint.tech";
const OUTCOMES = ["away", "draw", "home"] as const;

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

const americanOdds = (odds: number): string =>
  odds >= 2 ? `+${((odds - 1) * 100).toFixed(0)}` : `${(-100 / (odds - 1)).toFixed(0)}`;

const pct = (x: number): string => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;
const signed = (x: number): string => `${x >= 0 ? "+" : ""}${x.toFixed(3)}`;

const [league, ...wanted] = args;
if (!league) fail("usage: positive-ev.ts <league> [<fixture id>:<outcome>:<odds> ...]");

const key = env.HALFPOINT_API_KEY;
if (!key) console.log("No HALFPOINT_API_KEY: using the delayed sample.\n");
const answer = await get(key ? `${ODDS}/odds?league=${league}` : `${ODDS}/sample/odds?league=${league}`, key);
console.log(`fair prices updated ${answer.updated}`);

// "fixture id:outcome" -> fair probability and recent, from the first market of each fixture
const fair = new Map<string, { p: number; recent: boolean }>();
for (const fixture of answer.fixtures) {
  const price = Object.values(fixture.markets)[0]; // moneyline, or moneyline_3way for soccer
  if (!price) continue;
  for (const outcome of OUTCOMES) {
    const p = price[outcome];
    if (p !== undefined) fair.set(`${fixture.id}:${outcome}`, { p, recent: price.recent });
  }
}

if (wanted.length === 0) {
  // No book prices given: list the fair odds. A book price above them has a positive EV.
  console.log(`${"fixture:outcome".padEnd(36)} ${"fair p".padStart(7)} ${"decimal".padStart(8)} ${"american".padStart(9)}`);
  for (const [name, { p, recent }] of fair) {
    const note = recent ? "" : "  not recent: a reference, not a price";
    console.log(`${name.padEnd(36)} ${p.toFixed(3).padStart(7)} ${(1 / p).toFixed(2).padStart(8)} ${americanOdds(1 / p).padStart(9)}${note}`);
  }
} else {
  const rows: { name: string; odds: number; p: number; edge: number; ev: number }[] = [];
  for (const arg of wanted) {
    const cut = arg.lastIndexOf(":");
    if (cut < 0) fail(`cannot read ${arg}: expected <fixture id>:<outcome>:<odds>`);
    const name = arg.slice(0, cut);
    const odds = decimalOdds(arg.slice(cut + 1));
    const entry = fair.get(name);
    if (!entry) {
      console.error(`${arg}: no fair price for this fixture and outcome`);
      continue;
    }
    if (!entry.recent) {
      console.error(`${arg}: the fair price is not recent; skipped`);
      continue;
    }
    rows.push({ name, odds, p: entry.p, edge: entry.p - 1 / odds, ev: entry.p * odds - 1 });
  }

  console.log(`${"fixture:outcome".padEnd(36)} ${"odds".padStart(6)} ${"implied".padStart(8)} ${"fair p".padStart(7)} ${"edge".padStart(7)} ${"EV".padStart(7)}`);
  for (const r of rows.sort((a, b) => b.ev - a.ev)) {
    console.log(
      `${r.name.padEnd(36)} ${r.odds.toFixed(2).padStart(6)} ${(1 / r.odds).toFixed(3).padStart(8)} ${r.p.toFixed(3).padStart(7)} ${signed(r.edge).padStart(7)} ${pct(r.ev).padStart(7)}${r.ev > 0 ? "  +EV" : ""}`,
    );
  }
}
