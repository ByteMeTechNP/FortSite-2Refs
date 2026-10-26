# Supabase directory

This directory is the Git source of truth for future SQL migrations. FortSite does not run a local Supabase stack, Docker, or local PostgreSQL.

| Path          | Purpose                                                             |
| ------------- | ------------------------------------------------------------------- |
| `migrations/` | Ordered SQL files. Empty in Phase 04. Do not add a no-op migration. |
| `README.md`   | This note.                                                          |

There is no `config.toml`, `seed.sql`, or `functions/` directory. Schema changes are written here first, reviewed, and applied to Supabase Cloud only through the connected MCP `apply_migration` tool after explicit approval. See [docs/fortsite/migration-workflow.md](../docs/fortsite/migration-workflow.md).
