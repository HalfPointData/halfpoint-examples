# Pay per request with x402

> **This example spends real money.** It pays in USDC on Base mainnet from a wallet you fund.
> It needs a private key in `EVM_PRIVATE_KEY`. This repository contains no key; never commit one.

An agent with a wallet can call HalfPoint without an account or an API key, paying each request
in USDC with [x402](https://www.x402.org) version 2. Payments settle on **Base**
(`eip155:8453`). Paying for a request accepts the [terms](https://halfpoint.tech/terms).

| route | price (USD) |
|-------|-------------|
| `/odds` | 0.01 (`plan=x402.consensus`, the default), or 0.05 with `?plan=x402.risk` (adds `stop`, `widened` and `range`) |
| `/fixtures`, `/live`, `/grades` | 0.002 |

The example uses the x402 client packages [`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch)
and [`@x402/evm`](https://www.npmjs.com/package/@x402/evm) with [viem](https://viem.sh). It caps
each payment it signs at USD 0.05.

```bash
npm install
EVM_PRIVATE_KEY=0x... npx tsx pay-odds.ts nba            # USD 0.01
EVM_PRIVATE_KEY=0x... npx tsx pay-odds.ts nba --risk     # USD 0.05, with the bet stop
npm run typecheck                                        # checks the types, pays nothing
```

## What happens

1. `GET /odds` without a key answers `402`, with the payment requirements in the
   `PAYMENT-REQUIRED` header (scheme `exact`, USDC, the amount in its smallest unit, the address
   paid).
2. The client signs a payment and retries with the `PAYMENT-SIGNATURE` header. A v1 client's
   `X-PAYMENT` header is not read.
3. The answer comes once the payment is settled, with `PAYMENT-RESPONSE` (the transaction).

Only an answer that delivers data (`2xx`) is settled: an error is not charged, and a paid request
always gets the full answer, never `304`.

| status | meaning |
|--------|---------|
| `403` | the payer is refused for a while (its settlements failed repeatedly) |
| `409` | this payment is in use by another request: one payment serves one request |
| `429` | more than 2 paid requests open at once for this payer |
| `503` | payments are not available yet; retry after `Retry-After` (30) seconds |

## A pass instead

For many calls or for the streams, buy a plan for a period with x402: Realtime for 24 hours
(USD 15) or 7 days (USD 69), Risk for 24 hours (USD 49). It comes with an API key, shown once,
that works until the period ends:

```
POST https://account.halfpoint.tech/x402/pass?plan=realtime&period=24h
```

See [For agents](https://docs.halfpoint.tech/agents/#5-or-pay-with-x402) and
[After you pay](https://docs.halfpoint.tech/after-you-pay/#with-x402-usdc).
