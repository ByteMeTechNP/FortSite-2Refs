# Phase 10 — Subscriptions

**Status:** VERIFIED COMPLETE for plan catalogue, company terms, manual payments/adjustments, and entitlement helper  
**Date:** 27 October 2026  
**Canonical plan:** `FortSite_Fresh_Start_Master_Roadmap_V5_Cloud_Panel_Credentials.md` on `origin/main` at `909fa4e` (cite only; not vendored into this branch).

The real first Platform Owner remains **BLOCKED**. Phase 11 does not start. No payment gateway is implemented. No service-role key, database password, or card data is added to the browser.

## Cloud target

| Item                   | Result                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| Organization / project | `FortSite - 2Merged`                                                |
| Ref / URL              | `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co` |
| Git migration          | `supabase/migrations/20261027030000_phase_10_subscriptions.sql`     |

The git file is one migration. Cloud accepted it as ordered named slices after large payloads returned gateway 502 / size limits (same pattern as Phase 09). First recorded Cloud version: `phase_10_subscriptions` / `20261026195926`. Later slices cover helpers, access decision, plan RPCs, resolve intent, lifecycle, payments, and `get_my_subscription_summary`. See `supabase/README.md` and `list_migrations` for the full Cloud name series.

## Product contract

- Plan catalogue + immutable versions (`draft` / `published` / `retired`). No seeded prices.
- Company subscription terms with snapshot columns; one current row per company.
- Manual payments and adjustments (append-only). Payments do not extend terms.
- Phase 09 intent resolution requires the owner to supply the term; null/unpublished plan codes create nothing (`intent_plan_missing` / `plan_not_assignable`).
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

## Live checks

Temporary owner + founding admin + non-owner Auth fixtures. Script: `scripts/phase10-subscriptions-live.mjs` plus eligibility follow-ups. **PASSED 29/29.**

| Check                                                                                | Result |
| ------------------------------------------------------------------------------------ | ------ |
| Anon and non-owner plan create denied (`42501`)                                      | PASS   |
| Anon direct `subscription_plans` read denied                                         | PASS   |
| Owner draft + publish; unpublished draft cannot assign                               | PASS   |
| Annual without `ends_at` rejected                                                    | PASS   |
| Resolve intent creates trial; duplicate key reuses                                   | PASS   |
| Nepal plan rejected for India company (`currency_mismatch`)                          | PASS   |
| Record payment; duplicate payment reused; payment does not extend term               | PASS   |
| Founding admin cannot publish or record payment                                      | PASS   |
| Owner `company_is_operational` false without membership                              | PASS   |
| Overview counts reconcile (`total` present; not invented on failure)                 | PASS   |
| Retire published version                                                             | PASS   |
| Founding admin operational during in-window trial; own summary only                  | PASS   |
| Expired trial / post-grace → effective `overdue`, `trial_expired`, operational false | PASS   |
| Paused company denied while subscription effective `active` (`company_not_active`)   | PASS   |

## Cleanup

Synthetic `phase10-fixture` companies, `p10*` plans/versions, temporary `platform_admins` row, and `phase10.*@fortsite.test` Auth users were deleted. After cleanup: `platform_admins` = 0, fixture companies = 0, fixture plans = 0, Auth users remaining = 2 (Phase 05 accounts). No real Platform Owner was created. Dashboard Auth settings were not changed.

## Build checks

| Check                                                  | Result                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| format / lint / typecheck / test / build / secret scan | PASS (134 tests). Lint reports the four existing fast-refresh warnings only |

## Status boundaries

- Subscription catalogue, terms, manual payments, and entitlement helper: **VERIFIED COMPLETE**.
- Real first Platform Owner: **BLOCKED**. Phase 07 stays **IN PROGRESS**.
- Payment gateway / FX / card storage: out of scope.
- General audit console: **not started** (Phase 11).
- Company Admin permission matrix / `max_users` enforcement: **not started** (Phase 12).
- `max_active_projects` enforcement: **not started** (Phase 19).
