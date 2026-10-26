# Phase 06 — Company tenancy, memberships and tenant-safe data foundations

**Status:** VERIFIED COMPLETE  
**Date:** 26 October 2026  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md`](../../FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md)

## Cloud target

| Item                   | Result                                                                      |
| ---------------------- | --------------------------------------------------------------------------- |
| Organization / project | `FortSite - 2Merged`                                                        |
| Ref / URL              | `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co`         |
| Preflight              | Matched before mutation; prior migration `user_profiles` / `20261026170211` |

## Migration

| Item     | Value                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File     | `supabase/migrations/20261026180000_phase_06_company_tenancy.sql`                                                                                                         |
| MCP name | `phase_06_company_tenancy`                                                                                                                                                |
| Applied  | **APPLIED** — version `20261026171655`                                                                                                                                    |
| Objects  | `companies`, `company_memberships`, `company_invitations`; helpers `is_active_company_member`, `company_is_operational`, `accept_company_invitation`; code/email triggers |

### Read-only verification

- Tables present with RLS enabled; invitations have RLS on and zero client policies (advisor INFO expected).
- Policies: `companies_select_member`, `company_memberships_select_own`.
- Grants: authenticated SELECT only on `companies` and `company_memberships`; no anon table grants; no invitation grants.
- Functions: invoker helpers + definer `accept_company_invitation` with `search_path=""`. EXECUTE granted to authenticated only.
- Security advisors: INFO on invitations without policies (intentional); WARN on authenticated EXECUTE of SECURITY DEFINER acceptance RPC (intentional and documented); Auth leaked-password protection remains a dashboard setting outside this phase.

## Live RLS suite

`scripts/phase06-rls-live.mjs` — **PASSED 17/17** against Cloud with publishable-key sessions.

Temporary Phase 06 companies, memberships, invitations, and Auth users (`outsider`, `wrongEmail`) were deleted after the suite. Phase 05 Auth users A/B were left in place.

## Frontend and build checks

| Check                  | Result                                     |
| ---------------------- | ------------------------------------------ |
| `npm run format:check` | PASS                                       |
| `npm run lint`         | PASS (existing fast-refresh warnings only) |
| `npm run typecheck`    | PASS                                       |
| `npm test`             | PASS (52)                                  |
| `npm run build`        | PASS                                       |
| `npm run scan:secrets` | PASS                                       |

Contract module: [`src/features/tenancy/accept-invitation.ts`](../../src/features/tenancy/accept-invitation.ts). Auth invitation page still only completes Auth password setup; it does not call membership acceptance yet.

## Explicit exclusions respected

No company admin UI, Super Admin, subscriptions, project/site tables, Docker/local Supabase, or Phase 07 work.
