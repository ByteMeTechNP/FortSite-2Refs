# Subscriptions and entitlements

**Status:** Phase 10 contract  
**Canonical plan:** `FortSite_Fresh_Start_Master_Roadmap_V5_Cloud_Panel_Credentials.md` on `origin/main` at `909fa4e` (cite only; do not vendor that file into feature branches).

Platform Owner controls the plan catalogue, company terms, and manual payment/adjustment records. There is no payment gateway, no card storage, and no FX.

## State machine

Stored status changes only through owner RPCs. Effective status is evaluated at read time from stored status and UTC timestamps (no cron required for expiry).

```text
ownerResolvesIntent → trial | active
trial → active (explicitConversion)
trial | active → grace (period or trial end reached, grace window open)
grace → active (explicitRenewal / extend)
grace → overdue (graceEndsAt passed)
overdue | suspended → active (explicit owner action)
* → cancelled (immediate cancel)
active → cancel_at_period_end (flag; becomes cancelled when the period ends)
```

Eligible for normal company use: effective `trial`, `active`, or in-window `grace`. Denied: `overdue`, `suspended`, `cancelled`, and any company lifecycle other than `active`.

`company_is_operational(company_id)` requires active lifecycle, clear password gate, active membership, and an eligible subscription. Platform owners manage subscriptions but do not receive company operational access through this helper.

## Commercial terms

- Money is `numeric(14,2)`. Currencies are `NPR` and `INR` only.
- A plan version applies to one country and that country’s currency (Nepal/`NPR` or India/`INR`).
- A subscription copies amount, currency, interval, trial days, grace days, and entitlements from the published version. Existing rows keep their snapshot when a new version is published.
- Intervals: `monthly` (end = start + 1 month), `annual` (requires `ends_at`), `lifetime` (`ends_at` null).
- One current subscription per company (`is_current`). Cancellation does not revive that row.

## Intent resolution

Phase 09 stored only `requested_plan_code` and `trial_requested`. `resolve_subscription_intent` requires the owner to supply `monthly` | `annual` | `lifetime` (and `ends_at` for annual). Null or unpublished plan codes return `intent_plan_missing` or `plan_not_assignable` and create nothing. Duplicate idempotency keys return the original subscription.

## Payments versus renewal

Recording a payment or adjustment never extends a term, reactivates a company, or changes company lifecycle. Extension is a separate idempotent owner action. Payment methods are labels only (`bank_transfer`, `cash`, `cheque`, `esewa_recorded`, `khalti_recorded`, `other`).

## Entitlement contract

Stored and returned keys (not enforced against missing modules in Phase 10):

| Key | Later phase |
| --- | --- |
| `max_active_projects` | Phase 19 |
| `max_users` | Phase 12 |
| `marketplace_enabled` | Marketplace add-on |
| `mobile_app_enabled` | Native app |
| `takeoff_enabled` | Takeoff module |
| `bim_enabled` | BIM / IFC module |

Unknown keys fail publish. Limits are not claimed as enforced here.

## Authorization

Subscription tables force RLS with no client policies. Grants are revoked from `public`, `anon`, and `authenticated`. Owner mutations and founding-admin reads go through `SECURITY DEFINER` RPCs with `search_path = ''`. History is append-only in `subscription_events` (Phase 11 may read it; do not duplicate into `platform_authority_audit_events`).
