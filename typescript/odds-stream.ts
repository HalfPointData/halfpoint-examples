// Follow HalfPoint's consensus as it changes: /odds/stream over Server-Sent Events.
//
//   HALFPOINT_API_KEY=hp_... npx tsx odds-stream.ts [league]
//
// Needs the Realtime or Risk plan. The stream sends the current state first (one `price` event
// per fixture), then every change. `price` replaces what you hold for that fixture; `remove`
// drops one market. There is no replay and no Last-Event-ID: after a disconnect this script
// reconnects and starts over from the new state, dropping what it held.
//
// Node 20+ (built-in fetch). Docs: https://docs.halfpoint.tech/endpoints/odds-stream/

import { args, env, fail } from "./env.ts";
import type { OddsFixture } from "./types.ts";

const ODDS = "https://odds.halfpoint.tech";

const key = env.HALFPOINT_API_KEY ?? fail("Set HALFPOINT_API_KEY (Realtime or Risk plan): https://docs.halfpoint.tech/plans/");
const league = args[0];
const url = `${ODDS}/odds/stream${league ? `?league=${league}` : ""}`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Yields { event, data } from an SSE body; skips ':' comment lines (keep-alives, ~every 30 s). */
async function* events(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: string }> {
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "message";
  let data: string[] = [];
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).replace(/\r$/, "");
      buffer = buffer.slice(newline + 1);
      if (line === "") {
        if (data.length) yield { event, data: data.join("\n") };
        event = "message";
        data = [];
      } else if (!line.startsWith(":")) {
        const colon = line.indexOf(":");
        const field = colon < 0 ? line : line.slice(0, colon);
        let value = colon < 0 ? "" : line.slice(colon + 1);
        if (value.startsWith(" ")) value = value.slice(1);
        if (field === "event") event = value;
        else if (field === "data") data.push(value);
      }
    }
  }
}

function describe(fixture: OddsFixture): string {
  return Object.entries(fixture.markets)
    .map(([market, p]) => {
      const outcomes = (["away", "draw", "home"] as const)
        .filter((n) => p[n] !== undefined)
        .map((n) => `${n}=${p[n]}`)
        .join(" ");
      const flags = (["recent", "stop", "widened"] as const)
        .filter((f) => p[f] !== undefined)
        .map((f) => `${f}=${p[f]}`)
        .join(" ");
      return `${market} ${outcomes} ${flags}`;
    })
    .join("; ");
}

async function follow(): Promise<void> {
  const response = await fetch(url, { headers: { "X-Api-Key": key, Accept: "text/event-stream" } });
  if (!response.ok || !response.body) {
    const text = (await response.text()).trim();
    const retry = response.headers.get("Retry-After");
    if (response.status === 429 && retry) {
      console.error(`429: ${text}; waiting ${retry} s`);
      await sleep(Number(retry) * 1000);
      return;
    }
    // 401 unknown key, 402 no subscription, 403 plan lacks the stream,
    // 429 without Retry-After: too many streams open for this key.
    fail(`${response.status}: ${text}`);
  }

  const held = new Map<string, OddsFixture>(); // fixture id -> the fixture as last sent
  for await (const { event, data } of events(response.body)) {
    const payload = JSON.parse(data);
    if (event === "price") {
      held.set(payload.id, payload as OddsFixture);
      console.log(`price  ${payload.id}: ${describe(payload)}`);
    } else if (event === "remove") {
      const fixture = held.get(payload.id);
      if (fixture) {
        delete fixture.markets[payload.market];
        if (Object.keys(fixture.markets).length === 0) held.delete(payload.id);
      }
      console.log(`remove ${payload.id} ${payload.market}`);
    }
  }
}

for (;;) {
  try {
    await follow();
    console.error("stream ended; reconnecting");
    await sleep(1000);
  } catch (err) {
    console.error(`disconnected (${err}); reconnecting in 2 s`);
    await sleep(2000);
  }
}
