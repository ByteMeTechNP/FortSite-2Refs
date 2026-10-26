# Cloud deployment and recovery

Phase 04 does not deploy the Vite app and does not change the Cloud project. Supabase does not host the SPA. The production hosting provider is not selected.

## What CI does

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) installs from the lockfile and runs format, lint, typecheck, unit tests, the production build, and `npm run scan:secrets`. It does not call Supabase, does not hold a Cloud access token, and does not deploy. A green check is not a Cloud release.

Remote schema promotion, when a later phase is approved, is still: review the migration in Git, apply it with MCP `apply_migration` to this development project, verify with `list_migrations` and `list_tables`, then repeat on a separately approved production project. There is no production project yet. Do not treat `rvfoveqprrtobmywaodf` as production.

## Failed migrations

Prefer a new forward migration over editing a file that Cloud has already applied. If a call's result is unclear, read `list_migrations` before trying again. Do not run repair DDL through `execute_sql`.

Destructive changes need a written recovery note before they run. Restoring the Cloud project is an owner decision through the Supabase control surface. Phase 04 did not test backup, point-in-time recovery, or `restore_project`, and it does not claim those features are enabled.

Redeploying the frontend, once a host exists, is a separate step from repairing the database. Record the migration version and the frontend revision independently.

## Edge Functions

No function is deployed in Phase 04. A later function is created in Git, reviewed, and deployed with MCP `deploy_edge_function` only after approval. Secrets for that function belong in Supabase Cloud secret storage, not in `VITE_` variables or the repository. Function rollback is a new deployment of a known-good version. It does not undo a database migration.

## Shared-data isolation

This project is the shared fresh development target. Do not load real customer data into it. Work that could damage shared rows needs an explicitly approved Cloud branch or a separate Cloud project. Do not invent a local database instead.
