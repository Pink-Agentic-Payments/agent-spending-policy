# Agent Spending Policy (draft v0.1)

A small, vendor-neutral JSON Schema for describing what an AI agent is allowed to spend, on whom, and when a human must approve it — plus a field-by-field mapping to how each concept is expressed in 14 real payment providers' and protocols' own documented settings.

**This is a draft, v0.1, not a standard.** It is not endorsed by any provider, protocol, or standards body, and it is not an implementation of any product — see "What this is not" below. Feedback is welcome via issues on this repo once it is published.

## Why this exists

Every payment provider that lets you cap what an AI agent can spend documents its own field names, units, and enforcement point. Our [Agent Spending Controls Crosswalk](https://github.com/Pink-Agentic-Payments/agent-spending-controls-crosswalk) dataset shows 14 providers/protocols with 43 different documented controls and no shared vocabulary. A developer wiring an agent to more than one of these has to re-learn each one from scratch. This repo proposes one small, portable policy shape and documents — cell by cell, cited against the crosswalk — where each field does and doesn't have a native equivalent today.

## 10-second example

```json
{
  "agent_id": "research-agent-01",
  "currency": "USD",
  "per_transaction_cap": 2000,
  "window_caps": [{ "period": "day", "amount": 5000 }],
  "merchant_allowlist": ["api.openai.com", "api.anthropic.com"],
  "idempotency_required": true
}
```

This says: agent `research-agent-01` may spend up to $20.00 per transaction and $50.00 total per day, only against the two listed merchants, and a retried request with the same idempotency key must not be double-charged. See `examples/` for four more, including one with an approval threshold and one on a stablecoin wallet.

## Design choices

- **Amounts are integers in minor units of `currency`** (e.g. cents for USD), not decimal strings or floats. This matches how most of the crosswalk's amount fields are actually documented — AP2's `amount_range.max`, Privacy.com's `spend_limit`, Lithic's `limit_amount`, and Stripe's `spending_controls.spending_limits[].amount` are all minor-unit integers (see `MAPPING.md`). Integers avoid floating-point rounding on money and avoid the ambiguity of a decimal string's implied precision. The tradeoff, made explicit rather than hidden: providers whose native fields are in *major* units (Circle's `--daily`/`--weekly`/`--monthly` USDC flags, AP2's `budget.max`) or in a native token unit (Tempo's `TokenLimit.amount` in TIP20 units) need an explicit conversion at the mapping boundary — this schema does not attempt to hide that unit difference, it documents it in `MAPPING.md` instead.
- **`window_caps` is a list of `{period, amount}`, not separate `daily_cap`/`weekly_cap`/`monthly_cap` fields.** This mirrors Circle's `--daily`/`--weekly`/`--monthly` tiers (crosswalk #26) while staying open to providers that only document one or two periods (Privacy.com's `MONTHLY`/`TRANSACTION`-only enum, #10; Payman's daily/monthly-only tiers, #34) without needing optional fields for periods a provider doesn't support.
- **`approval_threshold` is a single object, not a boolean flag.** AP2 (#3), Circle (#28), and Payman (#35) each document approval differently — a mandate-signing step, an OTP gate on changing the limit itself, and a routed-to-human amount threshold, respectively. This schema models the Payman shape (a numeric threshold plus an opaque routing reference) because it's the only one of the three that is itself a per-payment amount comparison; the other two are documented in `MAPPING.md` as related-but-not-equivalent.
- **`idempotency_required` is a boolean, not a key format.** The schema doesn't define how an idempotency key is generated or transmitted — that's a transport-layer concern, matching our runnable teaching example ([`agent-spending-limit-example`](https://github.com/Pink-Agentic-Payments/agent-spending-limit-example)), which enforces idempotency in application logic rather than in the payment field itself. No crosswalk provider documents this as a spending-control field (see `MAPPING.md`); it is included because it is necessary to safely retry a call to any of them.
- **An `x-` extension point (`patternProperties: "^x-"`), with everything else rejected (`additionalProperties: false`).** This lets a deployment attach provider-specific fields without forking the schema, while still catching a typo'd field name as a validation error rather than silently ignoring it.

## What this is not

- **Not a standard.** No standards body has reviewed or adopted it. "v0.1" means exactly that — a first draft, likely to change.
- **Not endorsed by, or affiliated with, any payment provider or protocol named in `MAPPING.md`.** Every provider name there refers only to its own publicly documented fields, cited from the crosswalk dataset.
- **Not an implementation of any product**, including PinkWallet's own. See "About" below.
- **Not a replacement for a provider's own enforcement.** A policy file in this format describes intent; whatever system reads it still has to actually check it before a payment executes, the same way any of the 14 providers in `MAPPING.md` check their own native fields.

## Validator

`validate.mjs` checks one or more policy JSON files against the schema using [ajv](https://ajv.js.org/) (draft 2020-12 support, `ajv/dist/2020.js`) and [ajv-formats](https://github.com/ajv-validator/ajv-formats) (for `date-time`). Install and run:

```sh
npm install
node validate.mjs examples/*.json
```

Real output from this repo, run 2026-09-29:

```
PASS examples/invalid-bad-window-period.json — correctly rejected: /window_caps/0/period must be equal to one of the allowed values
PASS examples/invalid-missing-currency.json — correctly rejected: / must have required property 'currency'
PASS examples/valid-procurement-agent-approval.json
PASS examples/valid-research-agent-api-credits.json
PASS examples/valid-stablecoin-agent-wallet.json
PASS examples/valid-travel-agent-weekly-cap.json
```

(The script's own `PASS`/`FAIL` labels mean "the example did what its filename says it should" — an `invalid-*.json` file that gets correctly rejected prints `PASS`, along with the actual ajv error message. Exit code was `0`.)

## Repo contents

- `schema/agent-spending-policy.v0.1.schema.json` — the schema (JSON Schema draft 2020-12)
- `examples/` — 4 valid policies, 2 invalid policies with the error they trigger
- `validate.mjs` / `package.json` — the validator
- `MAPPING.md` — every schema field mapped to its native equivalent across 14 providers/protocols, cited row-by-row against the crosswalk

## Related PinkWallet datasets

- [agent-spending-controls-crosswalk](https://github.com/Pink-Agentic-Payments/agent-spending-controls-crosswalk) — the 43-row dataset this mapping is built from
- [agent-spending-limit-example](https://github.com/Pink-Agentic-Payments/agent-spending-limit-example) — a runnable policy-evaluation example using a compatible policy shape

## License

Code (`validate.mjs`, `package.json`, `schema/*.json`, `examples/*.json`) is licensed **Apache-2.0**. Documentation (`README.md`, `MAPPING.md`, `REPORT.md`, `repo-meta.md`) is licensed **CC BY 4.0**.

## About

Published by PinkWallet, which is building Pink Agentic AI Payment (early access): it enforces per-agent spending caps, allowlists and approval thresholds at the MCP layer, before a payment executes.
