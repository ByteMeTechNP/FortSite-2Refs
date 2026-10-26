# Phase 04 — Supabase Cloud/MCP

**Status:** VERIFIED COMPLETE  
**Date:** 26 October 2026  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md`](../../FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md)

## Cloud reads

Tools: `get_project`, `get_project_url`, `list_tables` (`public`), `list_migrations`, `list_edge_functions`, `get_publishable_keys`.

| Observation     | Result                                     |
| --------------- | ------------------------------------------ |
| Project ref     | `rvfoveqprrtobmywaodf`                     |
| API URL         | `https://rvfoveqprrtobmywaodf.supabase.co` |
| Project name    | `FortSite - 2Merged`                       |
| Region          | `ap-northeast-2`                           |
| Status          | `ACTIVE_HEALTHY`                           |
| `public` tables | none                                       |
| Migrations      | none                                       |
| Edge Functions  | none                                       |

`get_publishable_keys` returned a modern publishable key and a legacy anon key. The publishable key was written only to gitignored `.env.local`. It is not in Git. No `apply_migration`, `execute_sql`, branch, deploy, or project-setting call was made.

The V4 roadmap markdown and PDF were copied from `origin/main` (`6c5e13f`) onto this branch. `main` was not merged.

## Frontend checks

| Check                  | Result  | Evidence                                                                                                                                                                               |
| ---------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check` | PASS    | Prettier reported no issues                                                                                                                                                            |
| `npm run lint`         | PASS    | 0 errors. Three existing `react-refresh/only-export-components` warnings in `badge.tsx`, `button.tsx`, and `tabs.tsx`                                                                  |
| `npm run typecheck`    | PASS    | `tsc -b` completed                                                                                                                                                                     |
| `npm test`             | PASS    | 14 files, 31 tests                                                                                                                                                                     |
| `npm run build`        | PASS    | Vite production build completed                                                                                                                                                        |
| `npm run scan:secrets` | PASS    | 74 files. The minified bundle still contains the validator's rejected-form names. The scan flags key-shaped secret values, Postgres URLs, and service-role JWTs, not those guard names |
| Local Supabase/Docker  | NOT RUN | Cloud-only phase. Docker and the Supabase CLI were not installed                                                                                                                       |
| Remote mutation        | NOT RUN | Read-only MCP inspection only                                                                                                                                                          |

The GitHub Actions workflow is validation only. It was not executed from this environment, so a hosted CI run is NOT RUN until GitHub runs it. It is not a Cloud deployment.

## Out of scope

No business tables, Auth flow, Storage bucket, Edge Function, seed row, or production project. Phase 05 is not started. SPA hosting is not selected. Backup and restore were not tested.
