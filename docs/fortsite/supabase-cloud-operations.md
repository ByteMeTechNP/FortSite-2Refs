# Supabase Cloud operations

FortSite uses one Supabase Cloud project. There is no local Supabase stack, Docker runtime, or local PostgreSQL.

## Identity

| Item | Value |
| --- | --- |
| Organization | `FortSite - 2Merged` |
| Project | `FortSite - 2Merged` |
| Project ref | `rvfoveqprrtobmywaodf` |
| API URL | `https://rvfoveqprrtobmywaodf.supabase.co` |
| Region | `ap-northeast-2` |
| Classification | Fresh development target. Not production. |

Phase 04 read this identity with the connected Supabase MCP tools `get_project` and `get_project_url`. `list_tables` on `public` returned no tables. `list_migrations` returned no migrations. `list_edge_functions` returned no functions. No remote write was made.

Before every later Cloud call, read `get_project` or `get_project_url` and stop if the ref or URL is different. Do not create another project or branch without a separate approval.

## Management interface

The connected Supabase MCP plugin in Cursor is the normal control surface. Do not use `supabase start`, `supabase link`, `supabase db push`, `supabase db reset`, or a direct database password.

| Use | Tools |
| --- | --- |
| Confirm identity | `list_projects`, `get_project`, `get_project_url` |
| Inspect schema | `list_tables`, `list_migrations`, `list_extensions`, `get_advisors` |
| Public browser key | `get_publishable_keys` |
| Later DDL, after a committed SQL file and explicit approval | `apply_migration` |
| Narrow read-only checks after a migration | `execute_sql` with a `SELECT` only |
| Later Edge Functions | `list_edge_functions`, `get_edge_function`, `deploy_edge_function` |
| Later type generation | `generate_typescript_types` |

`create_project`, `create_branch`, `merge_branch`, `reset_branch`, `rebase_branch`, `delete_branch`, `pause_project`, `restore_project`, and `deploy_edge_function` can change or spend on Cloud resources. Phase 04 does not call them. A branch has its own cost and needs a separate approval. MCP approval is not a substitute for reading the SQL first.

`execute_sql` can change data. It is not the DDL path. Do not use it to create tables.

## What the browser may know

The React app talks to the Data API over HTTPS with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. A publishable key is public and does not authorize a tenant. The browser never receives a database URL, pooler URL, or secret key. Pooling is a server-side Postgres connection mode, not a Vite setting.

A successful privileged MCP query does not prove Row Level Security. Later tests must use the app or API as a normal signed-in user.
