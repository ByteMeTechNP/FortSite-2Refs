# Authentication

Phase 05 adds email/password Auth against Supabase Cloud. There is no local Auth emulator and no public self-registration.

## Cloud target

| Item | Value |
| --- | --- |
| Organization | `FortSite - 2Merged` |
| Project | `FortSite - 2Merged` |
| Project ref | `rvfoveqprrtobmywaodf` |
| API URL | `https://rvfoveqprrtobmywaodf.supabase.co` |

The browser uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Auth Admin methods are never called from the client.

## Routes

| Path | Purpose |
| --- | --- |
| `/auth/login` | Email/password sign-in |
| `/auth/forgot-password` | Request a password-reset email |
| `/auth/reset-password` | Set a new password with a recovery session |
| `/auth/callback` | Process Auth email redirects |
| `/auth/accept-invitation` | Retired. Does not create an account or set a password |
| `/auth/change-initial-password` | Required password change for a newly provisioned account |
| `/account` | Signed-in shell: profile, sign-out, no-access notice |

## Session lifecycle

1. `AuthProvider` starts in `initializing`.
2. It reads `getSession` once and subscribes to `onAuthStateChange`.
3. Status becomes `signedOut` or `signedIn`.
4. Protected routes wait on `initializing` and redirect when signed out.
5. Profile loads run in a separate effect after sign-in, not inside the Auth callback.
6. Sign-out clears local Auth state only after the Auth call succeeds or reports a clear error.

Authentication is not company membership, a role, or platform authority. A signed-in user without membership sees: “Account authenticated; organization access is not yet provisioned.”

## Redirect configuration

Password reset and invitation emails need:

1. `VITE_AUTH_REDIRECT_ORIGIN` set to the approved application origin.
2. The same origin plus Auth paths in the Supabase Auth redirect allow-list.
3. Site URL set to that origin.

**Approved development origin (Phase 05):** `http://127.0.0.1:5173`

Set in local env via `VITE_AUTH_REDIRECT_ORIGIN` (see `.env.example`). Paste the matching dashboard allow-list (MCP has no Auth URL writer):

- Site URL: `http://127.0.0.1:5173`
- Additional redirect URLs: `http://127.0.0.1:5173/auth/callback`, `http://127.0.0.1:5173/auth/reset-password`
- Remove `http://127.0.0.1:5173/auth/accept-invitation` from the allow-list when pasting URLs. Invitation links are retired.

Do not use a wildcard. Do not invent a production domain.

## Auth settings status

The connected MCP has no Auth-settings inspection or writer. Confirm in the Supabase dashboard:

- Email provider enabled
- Public sign-up **disabled**. New accounts are panel-provisioned. There is no invitation sign-up.
- Email confirmation policy
- Password policy
- Site URL and redirect allow-list (approved values above)
- Confirmation, recovery, and invitation templates

Do not change other dashboard settings without an explicit approval note.

## Profile migration

File: `supabase/migrations/20261026120000_user_profiles.sql`

Creates `public.user_profiles` with RLS so an authenticated user can read/insert/update only their own row. `anon` has no grants. No company or role columns.

**Applied** on project `rvfoveqprrtobmywaodf` after explicit approval (MCP migration name `user_profiles`, version `20261026170211`).

## Live Auth / RLS fixtures

Dedicated Cloud test users (A/B) exist for Phase 05 live checks. Credentials live only in gitignored `.env.phase05-fixtures.local.json`. Recreate with `scripts/phase05-create-fixtures.mjs` when a service-role key is available locally, or via approved MCP SQL. Run `node scripts/phase05-rls-live.mjs` for the 8-check suite (anon denied; self-only upsert/read; cross-user denied).

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Configuration screen on load | Missing `VITE_SUPABASE_URL` or publishable key |
| Reset email blocked in UI | `VITE_AUTH_REDIRECT_ORIGIN` unset or origin mismatch |
| Reset email fails after send | Dashboard redirect allow-list missing approved URLs |
| Profile save unavailable | Migration not applied yet |
| Signed in but no company data | Expected until Phase 06 memberships |
