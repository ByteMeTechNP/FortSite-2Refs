# Phase 09 — Company onboarding

**Status:** VERIFIED COMPLETE for onboarding, founding-admin provisioning, and lifecycle only  
**Date:** 27 October 2026  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md`](../../FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md)

The real first Platform Owner remains **BLOCKED**. Phases 10, 11, 12, and 67 did not start.

## Cloud target

| Item                   | Result                                                               |
| ---------------------- | -------------------------------------------------------------------- |
| Organization / project | `FortSite - 2Merged`                                                 |
| Ref / URL              | `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co`  |
| Git migration          | `supabase/migrations/20261027020000_phase_09_company_onboarding.sql` |

The git file is one migration. Cloud accepted it as the named series below after a single large payload returned a gateway 502 and was not recorded.

| Cloud name                                  | Version          |
| ------------------------------------------- | ---------------- |
| `phase_09_company_onboarding`               | `20261026191919` |
| `phase_09_company_onboarding_lifecycle`     | `20261026191933` |
| `phase_09_company_onboarding_profiles`      | `20261026191942` |
| `phase_09_company_onboarding_provisioning`  | `20261026191953` |
| `phase_09_company_onboarding_begin`         | `20261026192015` |
| `phase_09_company_onboarding_lifecycle_rpc` | `20261026192030` |
| `phase_09_company_onboarding_owner_read`    | `20261026192238` |
| `phase_09_company_onboarding_member_read`   | `20261026192249` |
| `phase_09_company_onboarding_claim`         | `20261026192300` |
| `phase_09_company_onboarding_attach`        | `20261026192312` |
| `phase_09_company_onboarding_handoff`       | `20261026192321` |
| `phase_09_company_onboarding_password_gate` | `20261026192333` |
| `phase_09_company_onboarding_overview`      | `20261026192336` |

`platform_company_overview()` now counts `paused`. The five statuses sum to `total`.

## Edge Functions

Both deployed with JWT verification on. The service-role key stays in the function environment. It is not in Vite or Git.

| Function                        | verify_jwt |
| ------------------------------- | ---------- |
| `provision-founding-admin`      | true       |
| `reset-founding-admin-password` | true       |

The password is generated in the function, returned once, and not stored. A retry after handoff returns `already_issued` and no password. A duplicate email returns `email_conflict` and does not attach a membership.

## Live checks

`scripts/phase09-onboarding-live.mjs` — **PASSED 14/14** with a temporary owner, a non-owner, a pre-existing email, and one provisioned founding admin.

| Check                                                                              | Result |
| ---------------------------------------------------------------------------------- | ------ |
| Anon and non-owner `begin_company_onboarding` denied (`42501`)                     | PASS   |
| Nepal locks NPR and `Asia/Kathmandu`; India locks INR and `Asia/Kolkata`           | PASS   |
| Same idempotency key reuses the company                                            | PASS   |
| Activate before handoff rejected (`activation_requirements_missing`)               | PASS   |
| `pending_setup` → `paused` rejected (`lifecycle_transition_rejected`)              | PASS   |
| Provision returns one password; the next call does not                             | PASS   |
| Duplicate email is `email_conflict` and attaches nobody                            | PASS   |
| New admin cannot read the company before `complete_initial_password`               | PASS   |
| After that change the admin reads only their company                               | PASS   |
| Founding admin cannot change lifecycle                                             | PASS   |
| `company_is_operational` is false, then true while active, then false while paused | PASS   |
| Overview paused count reconciles with total                                        | PASS   |

Direct reads of the fixture rows matched that result: India stayed `pending_setup` with `india_irn` / `not_configured`, failure `email_conflict`, and zero memberships. Nepal was `paused` with `nepal_cbms` / `not_configured`, handoff `issued`, and one founding admin. Both had a subscription-intent row. `company_admin_provisioning` has no password column.

Browser checks on Vite at `127.0.0.1:5176`: owner overview Paused card, paused company list, Nepal detail (compliance pending Phase 67, intent pending Phase 10), India wizard with locked INR / `Asia/Kolkata` and no currency field, duplicate-email conflict with no password on screen, non-owner and founding-admin denial of `/platform`, and a reset dialog whose password disappears on Done and on sign-out. **PASSED 11/11.**

## Cleanup

Synthetic companies (`locality = phase09-fixture`), the temporary `platform_admins` row, `phase09_fixture` audit events, fixture `account_security_events`, and the four `phase09.*@fortsite.test` Auth users were deleted. After cleanup: `platform_admins` = 0, fixture companies = 0, `initial_owner_bootstrapped` events = 0, Auth users remaining = 2 (the pre-existing Phase 05 accounts). No real Platform Owner was created. `company_invitations` was not dropped. Dashboard Auth settings were not changed.

## Build checks

| Check                                                  | Result                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| format / lint / typecheck / test / build / secret scan | PASS (109 tests). Lint reports the four existing fast-refresh warnings only |

## Status boundaries

- Onboarding, provisioning, and lifecycle: **VERIFIED COMPLETE**.
- Real first Platform Owner: **BLOCKED**. Phase 07 stays **IN PROGRESS**.
- Subscription catalogue, prices, and entitlements: **not started** (Phase 10).
- General audit console: **not started** (Phase 11).
- Company Admin permission matrix: **not started** (Phase 12). `founding_admin` is only a server-written marker.
- Government filing: **not started** (Phase 67). Compliance stays `not_configured`.

Lifecycle rules: [`docs/fortsite/company-lifecycle.md`](../fortsite/company-lifecycle.md).
