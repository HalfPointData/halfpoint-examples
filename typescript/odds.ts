// Read HalfPoint's consensus odds: the keyless sample, and /odds with an API key.
//
//   npx tsx odds.ts [league]                          # the delayed sample, no key
//   HALFPOINT_API_KEY=hp_... npx tsx odds.ts nba      # also the current /odds
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

function show(answer: OddsAnswer): void {
  console.log(`updated ${answer.updated}`);
  for (const fixture of answer.fixtures) {
    for (const [market, price] of Object.entries(fixture.markets)) {
      const outcomes = (["away", "draw", "home"] as const)
        .filter((name) => price[name] !== undefined)
        .map((name) => `${name} ${price[name]}`)
        .join("  ");
      // stop, widened and range are present on the Risk plan only.
      const extra: string[] = [];
      if (price.stop !== undefined) extra.push(`stop=${price.stop}`);
      if (price.widened !== undefined) extra.push(`widened=${price.widened}`);
      if (price.range) extra.push(`range=${JSON.stringify(price.range)}`);
      if (!price.recent) extra.push("not recent: a reference, not a price");
      console.log(`  ${fixture.id.padEnd(28)} ${market.padEnd(15)} ${outcomes}  ${extra.join(" ")}`.trimEnd());
    }
  }
}

const league = args[0] ?? "nba";

console.log(`Sample (delayed, no key): ${league}`);
show(await get(`${ODDS}/sample/odds?league=${league}`));

const key = env.HALFPOINT_API_KEY;
if (!key) {
  console.log("\nSet HALFPOINT_API_KEY for current prices: https://docs.halfpoint.tech/plans/");
} else {
  console.log(`\nCurrent /odds: ${league}`);
  show(await get(`${ODDS}/odds?league=${league}`, key));
}
