# Migration workflow

`supabase/migrations/` is the schema source of truth. Phase 04 leaves it empty on purpose. Do not add a no-op migration, and do not edit the Cloud database from the dashboard without capturing the SQL here first.

## Order for every later schema change

1. Read `list_migrations` and `list_tables` for project `rvfoveqprrtobmywaodf`.
2. Add one timestamped SQL file under `supabase/migrations/` before any Cloud write. Keep it small and name the purpose in the filename. Comment non-obvious data changes and grants.
3. Review target names, constraints, indexes, foreign keys, nullability, grants, RLS, and storage policies. Note tenant isolation, currency and time meaning, locks, and whether a second run is safe.
4. Write the intended change, the risk, and a forward-fix or recovery note. Wait for explicit approval before a Cloud write.
5. Apply DDL with MCP `apply_migration`. Do not use `execute_sql` for DDL.
6. Read `list_migrations` and `list_tables` again and confirm the new object.
7. Commit the SQL file and the verification note together.

Generated database types wait until a real migration exists. The later command is MCP `generate_typescript_types`, written to `src/lib/database.types.ts`. Do not invent business types now.

## Review checklist

- Object names and schema match the feature.
- Constraints, indexes, and foreign keys match the access path.
- Exposed tables, views, and functions have grants and RLS. Default privileges are not broad.
- Tenant-owned rows cannot be read or written across companies.
- Nullability, defaults, currency, and timestamps are explicit where they matter.
- Destructive or large changes name a backup or forward-repair step before they run.
- The clean Cloud history and the app tests that cover the change are recorded.

Migrations that have been applied stay immutable. Repair with a new file. Not every change can be reversed without data loss.
