# Environment configuration

## Browser variables

| Name | Role |
| --- | --- |
| `VITE_APP_NAME` | Display name. Defaults to `FortSite`. |
| `VITE_APP_ENV` | `development`, `test`, or `production`. Defaults to `development`. |
| `VITE_SUPABASE_URL` | `https://rvfoveqprrtobmywaodf.supabase.co` for this Cloud project. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`). Not a secret key. |

Copy [`.env.example`](../../.env.example) to `.env.local` and paste the publishable key from MCP `get_publishable_keys` or the Supabase dashboard. `.env.local` is gitignored. Do not commit it. Vite inlines every `VITE_` value into the browser bundle, so a secret placed there is public.

Startup validation lives in `src/config/env.ts`. A missing or malformed URL, a non-local `http:` URL, a missing key, an `sb_secret_` value, or a JWT whose role is the service role stops the app on a configuration screen. That screen names the variable only. It does not call the API. A later network failure is a different state and is not implied by a successful env check.

`src/lib/supabase.ts` builds one `createClient(url, publishableKey)`. Feature code must use `getBrowserSupabaseClient()` instead of calling `createClient` again. Phase 04 does not query tables or open an Auth screen.

## Direct Postgres

Browser and mobile clients use the HTTPS Data API. They do not open a Postgres connection and must not receive a database username, password, direct host URL, or pooler URL. Privileges and Row Level Security decide what a signed-in user can do. The publishable key does not grant that access.

Direct Postgres and Supavisor pooling are for trusted server-side jobs that truly need the Postgres wire protocol. They are not a browser setting and they are not a second application backend. Schema changes go through the migration workflow, not ad hoc SQL from the React app.

## Later fixtures

There is no `supabase/seed.sql` and no local reset. Later synthetic fixtures, if a phase needs them, run only against this development project or an approved Cloud branch, use dedicated id prefixes, and contain no real customer or personal data. Phase 04 inserts nothing. Creating a branch or another project needs a separate approval because it can add cost.
