# Phase 10 — Subscriptions

**Status:** IN PROGRESS (Cloud RPC apply and live checks pending completion)  
**Date:** 27 October 2026  
**Canonical plan:** `FortSite_Fresh_Start_Master_Roadmap_V5_Cloud_Panel_Credentials.md` on `origin/main` at `909fa4e` (cite only; not vendored into this branch).

The real first Platform Owner remains **BLOCKED**. Phase 11 does not start. No payment gateway is implemented. No service-role key, database password, or card data is added to the browser.

## Cloud target

| Item                   | Result                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| Organization / project | `FortSite - 2Merged`                                                |
| Ref / URL              | `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co` |
| Git migration          | `supabase/migrations/20261027030000_phase_10_subscriptions.sql`     |

The git file is one migration. Cloud accepts it as a named series after large payloads return gateway 502 and are not recorded (same pattern as Phase 09).

| Cloud name                           | Notes                                      |
| ------------------------------------ | ------------------------------------------ |
| `phase_10_subscriptions`             | Tables, intent columns, forced RLS         |
| `phase_10_subscriptions_helpers`     | Entitlement / effective-status helpers     |
| `phase_10_subscriptions_access`      | `get_company_access_decision` + operational |
| `phase_10_subscriptions_*` (RPCs)    | Owner plan/subscription/payment RPCs       |

Exact Cloud versions are recorded after the ordered apply finishes. See `supabase/README.md`.

## Product contract

- Plan catalogue + immutable versions (`draft` / `published` / `retired`).
- Company subscription terms with snapshot columns; one current row per company.
- Manual payments and adjustments (append-only). Payments do not extend terms.
- Phase 09 intent resolution requires the owner to supply the term; null/unpublished plan codes create nothing.
- `company_is_operational` ANDs subscription eligibility (`trial` / `active` / in-window `grace`).
- Founding-admin read: `get_my_subscription_summary()` only. No mutations.

Product detail: [`docs/fortsite/subscriptions.md`](../fortsite/subscriptions.md).

## UI

Under the existing platform guard:

- `/platform/plans` and `/platform/plans/:planId`
- `/platform/subscriptions` and `/platform/subscriptions/:subscriptionId`
- Company detail resolve-intent action (term supplied by owner)
- Overview subscription counts from `platform_subscription_overview` (load failure stays an error, not zero)
- Account page founding-admin summary (read-only)

Phase 11 events card stays unavailable.

## Build checks

| Check                                                  | Result |
| ------------------------------------------------------ | ------ |
| format / lint / typecheck / test / build / secret scan | pending final run after RPC apply |

## Status boundaries

- Subscription catalogue, terms, manual payments, and entitlement helper: target **VERIFIED COMPLETE** only after Cloud checks pass.
- Real first Platform Owner: **BLOCKED**.
- Payment gateway / FX / card storage: out of scope.
- General audit console: **not started** (Phase 11).
- Company Admin permission matrix / max_users enforcement: **not started** (Phase 12).
- `max_active_projects` enforcement: **not started** (Phase 19).
