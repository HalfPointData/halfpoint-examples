// Pay per request for HalfPoint's /odds with x402: USDC on Base, no account, no API key.
//
// THIS SPENDS REAL MONEY. Each run pays USD 0.01 (or USD 0.05 with --risk) in USDC on Base
// mainnet from the wallet whose private key is in EVM_PRIVATE_KEY. The wallet needs USDC on
// Base. Paying for a request accepts HalfPoint's terms: https://halfpoint.tech/terms
//
//   EVM_PRIVATE_KEY=0x... npx tsx pay-odds.ts [league] [--risk]
//
// Never commit a private key. Use a wallet that holds only what you mean to spend.
//
// How it works (https://docs.halfpoint.tech/agents/#5-or-pay-with-x402):
//   1. GET /odds without a key answers 402 with the requirements in the PAYMENT-REQUIRED header
//      (scheme `exact`, USDC on eip155:8453, the amount in its smallest unit, the address paid).
//   2. The x402 client signs a payment and retries with the PAYMENT-SIGNATURE header (x402 v2).
//   3. The answer comes once the payment is settled, with PAYMENT-RESPONSE (the transaction).
//   Only an answer that delivers data (2xx) is settled: an error is not charged.

import { decodePaymentResponseHeader, wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

const BASE_MAINNET = "eip155:8453"; // HalfPoint settles on Base only

const args = process.argv.slice(2);
const risk = args.includes("--risk");
const league = args.find((a) => !a.startsWith("--")) ?? "nba";

const privateKey = process.env.EVM_PRIVATE_KEY;
if (!privateKey || !privateKey.startsWith("0x")) {
  console.error("Set EVM_PRIVATE_KEY to the 0x... private key of a wallet with USDC on Base.");
  process.exit(1);
}

const account = privateKeyToAccount(privateKey as `0x${string}`);

const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: BASE_MAINNET, client: new ExactEvmScheme(account) }],
  // Refuse to sign any single payment above what the most expensive /odds request costs.
  spendControls: { maxAmountPerPayment: "$0.05" },
});

// plan=x402.consensus (default, USD 0.01) or x402.risk (USD 0.05): risk adds stop, widened, range.
const plan = risk ? "x402.risk" : "x402.consensus";
const url = `https://odds.halfpoint.tech/odds?league=${league}&plan=${plan}`;

console.log(`Paying from ${account.address} for ${url}`);
const response = await fetchWithPayment(url, { headers: { Accept: "application/json" } });

if (!response.ok) {
  // 402: payment not accepted; 403: payer refused for a while; 409: this payment is in use by
  // another request; 429: more than 2 paid requests open at once; 503: payments not available
  // yet (Retry-After: 30). Errors answer {"error": "..."} and are not charged.
  const retry = response.headers.get("Retry-After");
  console.error(`${response.status}${retry ? ` (retry after ${retry} s)` : ""}: ${(await response.text()).trim()}`);
  process.exit(1);
}

const settlement = response.headers.get("PAYMENT-RESPONSE");
if (settlement) console.log("Settled:", decodePaymentResponseHeader(settlement));

console.log(JSON.stringify(await response.json(), null, 2));
