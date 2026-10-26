# Phase 06 — Company tenancy, memberships and tenant-safe data foundations

**Status:** IN PROGRESS  
**Date:** 26 October 2026  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md`](../../FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md)

## Cloud target

| Item                   | Result                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| Organization / project | `FortSite - 2Merged`                                                             |
| Ref / URL              | `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co`              |
| Preflight              | Matched before mutation; only prior migration `user_profiles` / `20261026170211` |

## Migration

| Item     | Value                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File     | `supabase/migrations/20261026180000_phase_06_company_tenancy.sql`                                                                                                         |
| MCP name | `phase_06_company_tenancy`                                                                                                                                                |
| Applied  | Pending apply after implementation commit                                                                                                                                 |
| Objects  | `companies`, `company_memberships`, `company_invitations`; helpers `is_active_company_member`, `company_is_operational`, `accept_company_invitation`; code/email triggers |

## Security notes

- No client insert/update/delete on tenancy tables.
- Invitation table has RLS on and zero client policies.
- `accept_company_invitation` is the only write path for invite acceptance; returns `{ company_id, membership_id }` only.
- No role, platform-owner, or subscription schema.
- Fixture setup uses MCP SQL (no service-role key in agent env). Assertions use publishable key + user sessions.

## Checks

| Check                                                  | Result  | Evidence                       |
| ------------------------------------------------------ | ------- | ------------------------------ |
| format / lint / typecheck / test / build / secret scan | Pending | —                              |
| `apply_migration`                                      | Pending | —                              |
| Read-only catalog verify                               | Pending | —                              |
| Live RLS suite                                         | Pending | `scripts/phase06-rls-live.mjs` |

## Explicit exclusions respected

No company admin UI, Super Admin, subscriptions, project/site tables, Docker/local Supabase, or Phase 07 work.
