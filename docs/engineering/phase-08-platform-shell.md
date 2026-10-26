# Phase 08 — Super Admin panel shell and platform overview

**Status:** VERIFIED COMPLETE (shell + company metadata only)  
**Date:** 26 October 2026  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md`](../../FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md)

## Cloud target

| Item                   | Result                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Organization / project | `FortSite - 2Merged`                                                                     |
| Ref / URL              | `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co`                      |
| Preflight              | [`docs/fortsite/phases/phase-08-preflight.md`](../fortsite/phases/phase-08-preflight.md) |

## Migration

| Item     | Value                                                                                    |
| -------- | ---------------------------------------------------------------------------------------- |
| File     | `supabase/migrations/20261026200000_phase_08_platform_overview.sql`                      |
| MCP name | `phase_08_platform_overview`                                                             |
| Applied  | **APPLIED** — version `20261026175246`                                                   |
| Objects  | `public.platform_company_overview()` — SECURITY DEFINER, `search_path=""`, returns jsonb |

### Read-only verification

- Function: no arguments; SECURITY DEFINER; `search_path=""`; STABLE; returns `jsonb`.
- Grants: EXECUTE for `authenticated` only. `anon` and `PUBLIC` have no EXECUTE.
- `companies` policies unchanged: still membership-only `companies_select_member`.
- Advisors: intentional WARN that authenticated can execute this DEFINER RPC; owner check remains inside the function. Phase 07 closed-table INFO advisories unchanged.

## Live overview suite

`scripts/phase08-overview-live.mjs` — **PASSED 6/6** with temporary synthetic owner, non-owner, and two companies (pending_setup + active).

| Check                                              | Result |
| -------------------------------------------------- | ------ |
| Anon RPC denied (`42501`)                          | PASS   |
| Non-owner RPC denied (`42501`)                     | PASS   |
| Owner receives documented fields; counts sum total | PASS   |
| Owner cannot `select` from `companies` directly    | PASS   |
| Extra RPC arguments rejected                       | PASS   |

All Phase 08 fixture Auth users, `platform_admins` row, and companies were deleted afterward. No real Platform Owner was bootstrapped.

## UI

| Path                     | Behaviour                                                          |
| ------------------------ | ------------------------------------------------------------------ |
| `/platform`              | Owner-only overview: status cards + Phase 10/11 unavailable panels |
| `/platform/companies`    | Metadata list; optional `?status=` filter on the same payload      |
| `/platform/unauthorized` | Signed-in non-owner denial                                         |
| unknown `/platform/*`    | Existing not-found page inside the owner guard                     |

`PlatformOwnerGuard` waits on Auth initializing, then `usePlatformAuthority()`. Signed-out → login with internal `from`. `unavailable` → retry, no shell data. `not_owner` → unauthorized. Children only after `owner`.

Browser checks (Vite on `127.0.0.1:5174`): signed-out redirect, non-owner denial, owner overview/companies, unknown route inside the shell — all passed. Synthetic owner fixture removed after the session.

## Build checks

| Check                                                  | Result          |
| ------------------------------------------------------ | --------------- |
| format / lint / typecheck / test / build / secret scan | PASS (82 tests) |

## Status boundaries

- Phase 08 shell and company metadata overview: **VERIFIED COMPLETE**.
- Subscription metrics panel: **blocked until Phase 10** (unavailable copy only; no numeric zero).
- Platform events panel: **blocked until Phase 11** (unavailable copy only; no invented rows).
- Phase 07 live first-owner bootstrap remains **BLOCKED** / Phase 07 stays **IN PROGRESS**.
- Phase 09 company onboarding was not started.

## Explicit exclusions respected

No company onboarding, no `companies` RLS bypass, no subscription schema, no general audit feed, no real Platform Owner bootstrap, no Phase 09–11 implementation.
