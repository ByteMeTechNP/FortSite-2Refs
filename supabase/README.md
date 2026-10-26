# Supabase directory

This directory is the Git source of truth for SQL migrations. FortSite does not run a local Supabase stack, Docker, or local PostgreSQL.

| Path          | Purpose                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| `migrations/` | Ordered SQL files applied to Supabase Cloud via MCP `apply_migration` after approval |
| `functions/`  | Edge Functions deployed with JWT verification on. The service-role key is not in Git |
| `README.md`   | This note                                                                            |

There is no `config.toml` or `seed.sql`. See [docs/fortsite/migration-workflow.md](../docs/fortsite/migration-workflow.md).

| Migration file                                   | Cloud status                                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `20261026120000_user_profiles.sql`               | Applied as `user_profiles` / `20261026170211`                                                                                 |
| `20261026180000_phase_06_company_tenancy.sql`    | Applied as `phase_06_company_tenancy` / `20261026171655`                                                                      |
| `20261026190000_phase_07_platform_owner.sql`     | Applied as `phase_07_platform_owner` / `20261026173350`                                                                       |
| `20261026200000_phase_08_platform_overview.sql`  | Applied as `phase_08_platform_overview` / `20261026175246`                                                                    |
| `20261027010000_panel_managed_credentials.sql`   | Applied as `panel_managed_credentials` / `20261026182825`                                                                     |
| `20261027020000_phase_09_company_onboarding.sql` | Applied as `phase_09_company_onboarding` / `20261026191919` through `phase_09_company_onboarding_overview` / `20261026192336` |

Do not apply migrations without an explicit approval for the exact SQL body. First Platform Owner bootstrap is a separate manual runbook, not a migration.
