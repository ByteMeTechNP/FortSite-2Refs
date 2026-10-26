# Phase 05 — Authentication, profiles and session lifecycle

**Status:** IN PROGRESS  
**Date:** 26 October 2026  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md`](../../FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md)

## Cloud target

| Item                   | Result                                                                            |
| ---------------------- | --------------------------------------------------------------------------------- |
| Organization / project | `FortSite - 2Merged`                                                              |
| Ref / URL              | `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co`               |
| Remote mutation        | None. No `apply_migration`, `execute_sql`, Auth setting change, invite, or deploy |

## Migration

| Item    | Value                                                                              |
| ------- | ---------------------------------------------------------------------------------- |
| File    | `supabase/migrations/20261026120000_user_profiles.sql`                             |
| Applied | **NOT APPLIED** — waiting for explicit approval                                    |
| Summary | `public.user_profiles` with self-only RLS; no anon grants; no company/role columns |

## Cloud Auth configuration

| Setting                           | State                                         |
| --------------------------------- | --------------------------------------------- |
| Site URL / redirect allow-list    | UNKNOWN (no MCP Auth-settings tool)           |
| Public sign-up                    | UNKNOWN                                       |
| Email templates / password policy | UNKNOWN                                       |
| `VITE_AUTH_REDIRECT_ORIGIN`       | Documented; unset until an origin is approved |

## Frontend checks

| Check                                 | Result  | Evidence                                                             |
| ------------------------------------- | ------- | -------------------------------------------------------------------- |
| `npm run format:check`                | PASS    | Prettier clean                                                       |
| `npm run lint`                        | PASS    | 0 errors; existing fast-refresh warnings only                        |
| `npm run typecheck`                   | PASS    | `tsc -b`                                                             |
| `npm test`                            | PASS    | 21 files, 49 tests                                                   |
| `npm run build`                       | PASS    | Vite production build                                                |
| `npm run scan:secrets`                | PASS    | 82 files                                                             |
| Live login / reset / invitation / RLS | BLOCKED | Need applied migration, approved origin, and dedicated test identity |
| `apply_migration`                     | NOT RUN | Waiting for explicit approval of `20261026120000_user_profiles.sql`  |

## Explicit exclusions respected

No company/membership/role schema. No public registration. No Auth Admin from the browser. No Docker or local Supabase. Phase 06 not started.
