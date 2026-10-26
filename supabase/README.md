# Supabase directory

This directory is the Git source of truth for SQL migrations. FortSite does not run a local Supabase stack, Docker, or local PostgreSQL.

| Path          | Purpose                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| `migrations/` | Ordered SQL files applied to Supabase Cloud via MCP `apply_migration` after approval |
| `README.md`   | This note                                                                            |

There is no `config.toml`, `seed.sql`, or `functions/` directory. See [docs/fortsite/migration-workflow.md](../docs/fortsite/migration-workflow.md).

| Migration file                                | Cloud status                                             |
| --------------------------------------------- | -------------------------------------------------------- |
| `20261026120000_user_profiles.sql`            | Applied as `user_profiles` / `20261026170211`            |
| `20261026180000_phase_06_company_tenancy.sql` | Applied as `phase_06_company_tenancy` / `20261026171655` |
| `20261026190000_phase_07_platform_owner.sql`  | Applied as `phase_07_platform_owner` / `20261026173350`  |

Do not apply migrations without an explicit approval for the exact SQL body. First Platform Owner bootstrap is a separate manual runbook, not a migration.
