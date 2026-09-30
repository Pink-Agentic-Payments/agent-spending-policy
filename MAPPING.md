# Field mapping: schema → provider-native settings

This maps every field in [`schema/agent-spending-policy.v0.1.schema.json`](schema/agent-spending-policy.v0.1.schema.json) to the equivalent setting documented by each of the 14 providers/protocols in the [Agent Spending Controls Crosswalk](https://github.com/Pink-Agentic-Payments/agent-spending-controls-crosswalk) (`crosswalk.csv`, 43 rows, accessed 2026-09-29, CC BY 4.0).

**Rule for every cell below: it either cites a crosswalk row number (`#N`) with the provider's exact field name as written in `crosswalk.csv`, or it says "not in crosswalk."** Nothing here is drawn from memory or from provider docs directly — only from the crosswalk dataset's `field_or_setting`, `unit`, and `enforcement_point` columns. Row numbers refer to the CSV's data rows in file order (row 1 = the first data row after the header, i.e. the AP2 `amount_range.max` row).

Where the crosswalk's own README flags a caveat (unit mismatches, phase-dependent fields, monotonic ordering), that caveat is repeated here rather than silently dropped.

## `agent_id`

No provider in the crosswalk documents an agent-identifier field as a *spending control* — the crosswalk tracks caps, allowlists, approvals, and expiry, not identity/scoping fields. **Not in crosswalk, for all 14 providers/protocols.**

## `currency`

The crosswalk records the *unit* an amount is expressed in (e.g. "minor units (cents)", "USDC (major units)") as part of each amount-cap row, but no provider row documents a standalone "currency" selector field. **Not in crosswalk as a dedicated field, for all 14 providers/protocols** — see the `unit` column cited under `per_transaction_cap` and `window_caps` below for what each provider's amount fields are actually denominated in.

## `per_transaction_cap`

| Provider/protocol | Native field/setting | Unit | Enforcement point | Source |
|---|---|---|---|---|
| AP2 | `amount_range.max` (constraint) | minor units (cents) | API server-side (`BudgetEvaluator`/`AmountRangeEvaluator`, reference SDK) | crosswalk #1 |
| Stripe | `spending_controls.spending_limits[].interval = per_authorization` (paired with `.amount`, #5) | smallest currency unit of the card currency | authorization-time at card network | crosswalk #6 |
| Privacy.com | `spend_limit` with `spend_limit_duration=TRANSACTION` | minor units (cents) | authorization-time at card network | crosswalk #9 |
| Lithic | not in crosswalk as a distinct per-tx control type — crosswalk classifies Lithic's `spend_limit` + `spend_limit_duration` under `amount_cap_per_period` (#13), with `TRANSACTION` as one of the duration values | cents (per Privacy/industry convention; not explicitly restated on that page) | authorization-time at card network | crosswalk #13 (see note above) |
| AgentCard | not in crosswalk — the one AgentCard row (`cards set-limit` CLI) is classified `amount_cap_per_period`, not per-transaction | cents (consistent with `amount_cents`) | API server-side | crosswalk #20 (see note above) |
| Crossmint | not in crosswalk | — | — | — |
| Coinbase | "Max per call" (wallet UI setting; no documented API field name) | not stated (example given in USD, e.g. $0.05) | not stated on this page | crosswalk #23 |
| Circle | not in crosswalk — Circle's shortest documented tier is `--daily` (#26); no separate per-transaction flag is documented | — | — | crosswalk #26 (see note) |
| Tempo | `--max-spend` (Tempo request flag) | not stated (example shown in dollars, e.g. 1.00) | client-side SDK/CLI | crosswalk #30 |
| Payman | "Per Transaction" (policy spend control) | not stated (currency-agnostic in the docs example) | not stated (Payman policy engine, "financial firewall") | crosswalk #33 |
| Skyfire | `amt` (claim) | currency units (not minor units) | API server-side (seller service validates the token) | crosswalk #36 |
| x402 | `amount` (`PaymentRequirements`, `upto` scheme) — **phase-dependent**: client-authorized maximum at verification time, actual charge at settlement | not stated in this file | API server-side (facilitator enforces at settlement) | crosswalk #40 |
| Visa | not documented (no public field-level schema found) | not applicable | not stated | crosswalk #42 |
| Mastercard | not documented (no public field-level schema found) | not applicable | not stated | crosswalk #43 |

## `window_caps` (day / week / month)

| Provider/protocol | Native field/setting | Unit | Period options as documented | Enforcement point | Source |
|---|---|---|---|---|---|
| AP2 | `budget.max` (constraint) | major units — **the reference SDK multiplies by 100 internally to get minor units; this is a documented unit mismatch against `amount_range.max`, not restated consistently in the schema text** | not stated in schema (recurrence handled via a separate `agent_recurrence` constraint) | API server-side (`BudgetEvaluator`) | crosswalk #2 |
| Stripe | `spending_controls.spending_limits[].amount` + `.interval` | smallest currency unit of the card currency | `per_authorization` plus date-based intervals | authorization-time at card network | crosswalk #5 |
| Privacy.com | `spend_limit_duration` (enum) | not applicable (enum) | `ANNUALLY`, `FOREVER`, `MONTHLY`, `TRANSACTION` — **no weekly or daily option documented** | authorization-time at card network | crosswalk #10 |
| Lithic | `spend_limit` + `spend_limit_duration` (cents); account-level daily/monthly/lifetime limits; `limit_amount` on a Velocity Limit rule (cents) | cents (#13, #15); not stated in excerpt (#14) | daily, monthly, lifetime (#14) | authorization-time at card network (Lithic-hosted Auth Rules engine for #15) | crosswalk #13, #14, #15 |
| AgentCard | `cards set-limit` (CLI command) sets a multi-use card's total limit — **no day/week/month period breakdown documented** | cents (consistent with `amount_cents`) | not stated | API server-side | crosswalk #20 |
| Crossmint | not in crosswalk | — | — | — | — |
| Coinbase | "Max per session" (wallet UI setting; no documented API field name) — **"session" is not a day/week/month period** | not stated (example given in USD, e.g. $5.00) | session-scoped only | not stated on this page | crosswalk #24 |
| Circle | `--daily` / `--weekly` / `--monthly` (`circle wallet limit set` flags) — direct match to this schema's three periods; **the crosswalk's own README notes a monotonic ordering rule (`per-tx ≤ daily ≤ weekly ≤ monthly`)** that this schema does not itself enforce | USDC (major units) | daily, weekly, monthly | client-side SDK/CLI, enforced by Circle's wallet backend | crosswalk #26, #27 |
| Tempo | `TokenLimit.amount` (within `KeyRestrictions.limits[]`), with `period` in seconds | TIP20 token units (protocol-level, not restated as USD) | arbitrary recurrence in seconds, not a day/week/month enum | onchain (Account Keychain precompile) | crosswalk #31 |
| Payman | "Daily Limit" / "Monthly Limit" (policy spend controls) — **no weekly tier documented** | not stated | daily, monthly | not stated (Payman policy engine) | crosswalk #34 |
| Skyfire | not in crosswalk — Skyfire's only cap row (#36) is per-token/per-transaction; `mnr` (#37) caps request *count*, not a rolling amount | — | — | — | — |
| x402 | not in crosswalk — `maxAmountRequired` (#39) is a per-request price set by the resource server, not a payer-side rolling budget | — | — | — | — |
| Visa | not documented | not applicable | not stated | not stated | crosswalk #42 |
| Mastercard | not documented | not applicable | not stated | not stated | crosswalk #43 |

## `merchant_allowlist`

| Provider/protocol | Native field/setting | Enforcement point | Source |
|---|---|---|---|
| AP2 | not in crosswalk | — | — |
| Stripe | not in crosswalk (Stripe's crosswalk rows cover category blocking, #7, not a merchant-level allowlist) | — | — |
| Privacy.com | `type=MERCHANT_LOCKED` | authorization-time at card network | crosswalk #11 |
| Lithic | `MERCHANT_LOCK` (rule type) | authorization-time at card network | crosswalk #18 |
| AgentCard | not in crosswalk | — | — |
| Crossmint | not in crosswalk (Crossmint's rows, #21–22, describe revocation and enforcement in prose only, no field name) | — | — |
| Coinbase | not in crosswalk | — | — |
| Circle | recipient allowlists / contract blocklists (custom spending policies) — **crosswalk bundles allow and deny in one setting; see `merchant_denylist` below** | not stated (Circle wallet backend) | crosswalk #29 |
| Tempo | not in crosswalk | — | — |
| Payman | not in crosswalk | — | — |
| Skyfire | not in crosswalk | — | — |
| x402 | not in crosswalk | — | — |
| Visa | not documented | — | crosswalk #42 |
| Mastercard | not documented | — | crosswalk #43 |

## `merchant_denylist`

| Provider/protocol | Native field/setting | Enforcement point | Source |
|---|---|---|---|
| Circle | recipient allowlists / **contract blocklists** (same setting as `merchant_allowlist`, custom spending policies) | not stated (Circle wallet backend) | crosswalk #29 |
| All other 13 providers/protocols | not in crosswalk | — | — |

## `category_allowlist`

No provider row in the crosswalk documents a category *allow*list (only Stripe's row documents both an allow and a block field on the same line — see below). **Not in crosswalk as a standalone allowlist, for all 14 providers/protocols**, except Stripe, where `allowed_categories` is the sibling field to the denylist documented at crosswalk #7 (source: https://docs.stripe.com/api/issuing/cards/object).

## `category_denylist`

| Provider/protocol | Native field/setting | Enforcement point | Source |
|---|---|---|---|
| Stripe | `spending_controls.allowed_categories` / `spending_controls.blocked_categories` | authorization-time at card network | crosswalk #7 |
| Lithic | `CONDITIONAL_ACTION` rule keyed on MCC (merchant category code) — crosswalk classifies this as `category_block` | authorization-time at card network | crosswalk #19 |
| All other 12 providers/protocols | not in crosswalk | — | — |

## `approval_threshold`

| Provider/protocol | Native field/setting | Enforcement point | Source |
|---|---|---|---|
| AP2 | Cart Mandate / Payment Mandate signing (no numeric threshold field — approval is a signing step, not a configured amount) | client-side (user signs mandate), verified server-side | crosswalk #3 |
| Circle | OTP confirmation on `circle wallet limit set` / `reset` — **this is required to change a limit at all, not a per-payment approval routed above a threshold amount; the crosswalk's own README calls this "deliberate agent-exclusion"** | client-side CLI, interactive terminal, human-only OTP entry | crosswalk #28 |
| Payman | "Threshold" (policy spend control) — "Amount above which manual approval is needed" | not stated (Payman policy engine) | crosswalk #35 |
| AgentCard | not in crosswalk — only one AgentCard row exists in `crosswalk.csv` (#20, `amount_cap_per_period`); no `human_approval` row is present for AgentCard in the dataset, despite the crosswalk README's summary table showing a ✓ for AgentCard under "Human approval" | — | crosswalk README summary table vs. crosswalk.csv row set — flagged as a discrepancy, not resolved here |
| All other 9 providers/protocols (Stripe, Privacy.com, Lithic, Crossmint, Coinbase, Tempo, Skyfire, x402, Visa, Mastercard) | not in crosswalk | — | — |

## `valid_until`

| Provider/protocol | Native field/setting | Enforcement point | Source |
|---|---|---|---|
| Tempo | `KeyRestrictions.expiry` | onchain (Account Keychain precompile) | crosswalk #32 |
| Skyfire | `exp` (claim) | API server-side | crosswalk #38 |
| All other 12 providers/protocols | not in crosswalk | — | — |

Crossmint's `revocation` row (#21) is a related-but-distinct concept (an allowance being revoked on demand, not a pre-set expiry timestamp) and does not map to `valid_until`; it has no field name documented in the crosswalk either way.

## `idempotency_required`

No provider row in the crosswalk documents a retry-safe idempotency key as a spending control. **Not in crosswalk, for all 14 providers/protocols.**

The closest related-but-different concept is Privacy.com's `single_use` control type (`type=SINGLE_USE`, crosswalk #12): a card that can only ever be used once, enforced at the card network. That stops *any* second charge, not specifically a retried duplicate of the same request — it does not distinguish a legitimate second purchase from a retry, so it is not treated here as equivalent to `idempotency_required`.

## Summary by source

Counted directly from this file (`grep -oE 'crosswalk #[0-9]+' MAPPING.md`, run 2026-09-29):

- Distinct crosswalk rows cited: 30 of 43 (rows 1, 2, 3, 5, 6, 7, 9, 10, 11, 12, 13, 18, 19, 20, 23, 24, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 40, 42, 43)
- Total citation instances (a row can be cited more than once across fields): 39
- Uncited rows (14, 15, 16, 17, 21, 22, 25, 27, 37, 39, 41): mostly account-level/velocity-rule detail (Lithic #14–17), enforcement-description-only rows with no field name (Crossmint #21–22, Coinbase #25), Circle's ordering rule (#27, referenced in prose but not as its own mapped field), and x402/Skyfire rows describing request-count or settlement-phase mechanics (#37, #39, #41) that don't correspond to any field in this schema
- Fields with zero crosswalk coverage across all 14 providers/protocols: `agent_id`, `currency` (as a dedicated field), `category_allowlist` (as a standalone list — Stripe's `allowed_categories` is documented as the sibling of the denylist at crosswalk #7, not as its own row), `idempotency_required`
- One flagged discrepancy between the crosswalk's own README summary table and its underlying CSV rows (AgentCard / human approval) — reported, not silently resolved, under `approval_threshold` above

See `REPORT.md` for how this deliverable was built.
