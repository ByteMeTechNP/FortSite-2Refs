# Phase 05 — Authentication, profiles and session lifecycle

**Status:** IN PROGRESS  
**Date:** 26 October 2026  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md`](../../FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md)

## Cloud target

| Item                   | Result                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| Organization / project | `FortSite - 2Merged`                                                            |
| Ref / URL              | `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co`             |
| Remote mutation        | Approved only: `user_profiles` migration + dedicated Auth fixtures for live RLS |

## Migration

| Item     | Value                                                                              |
| -------- | ---------------------------------------------------------------------------------- |
| File     | `supabase/migrations/20261026120000_user_profiles.sql`                             |
| Applied  | **APPLIED** — MCP `apply_migration` name `user_profiles`, version `20261026170211` |
| Verify   | RLS on; select/insert/update own policies; `anon` has no table grants              |
| Advisors | Security advisors empty after apply                                                |
| Summary  | `public.user_profiles` with self-only RLS; no company/role columns                 |

## Cloud Auth configuration

| Setting                           | State                                                                   |
| --------------------------------- | ----------------------------------------------------------------------- |
| `VITE_AUTH_REDIRECT_ORIGIN`       | **APPROVED** — `http://127.0.0.1:5173` in `.env.example` / `.env.local` |
| Site URL / redirect allow-list    | **APPROVED values** (dashboard paste required; no MCP Auth writer)      |
| Public sign-up                    | UNKNOWN (desired: disabled; invitations only)                           |
| Email templates / password policy | UNKNOWN                                                                 |

### Approved dashboard redirect allow-list

Paste in Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `http://127.0.0.1:5173`
- Additional Redirect URLs:
  - `http://127.0.0.1:5173/auth/callback`
  - `http://127.0.0.1:5173/auth/accept-invitation`
  - `http://127.0.0.1:5173/auth/reset-password`

Do not use wildcards. Do not invent a production domain in this phase.

## Dedicated Cloud test identities

| Item        | Result                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------- |
| Users       | Two confirmed Auth users labeled A/B (`phase05_fixture` metadata)                                   |
| Creation    | MCP `execute_sql` into `auth.users` + `auth.identities` (service role key was not in the agent env) |
| Credentials | Gitignored `.env.phase05-fixtures.local.json` only; never committed                                 |
| Scripts     | `scripts/phase05-create-fixtures.mjs`, `scripts/phase05-rls-live.mjs`                               |

## Frontend and live checks

| Check                                 | Result | Evidence                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------- |
| `npm run format:check`                | PASS   | Prettier clean                                                  |
| `npm run lint`                        | PASS   | 0 errors; existing fast-refresh warnings only                   |
| `npm run typecheck`                   | PASS   | `tsc -b`                                                        |
| `npm test`                            | PASS   | 21 files, 49 tests                                              |
| `npm run build`                       | PASS   | Vite production build                                           |
| `npm run scan:secrets`                | PASS   | Secret scan                                                     |
| Live Auth sign-in                     | PASS   | Fixture A password sign-in against Cloud                        |
| Live RLS (`phase05-rls-live.mjs`)     | PASS   | 8/8 (anon denied; A/B self-only read/upsert; cross-user denied) |
| Dashboard Site URL / allow-list paste | OPEN   | Approved values documented; MCP cannot write Auth URL settings  |
| `apply_migration`                     | DONE   | `user_profiles` / `20261026170211`                              |

## Explicit exclusions respected

No company/membership/role schema. No public registration UI. No Auth Admin from the browser. No Docker or local Supabase. Phase 06 not started. Fixture passwords and service-role material stay out of Git and phase reports.
