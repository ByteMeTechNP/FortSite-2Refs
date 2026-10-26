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
| `/auth/accept-invitation` | Complete an Auth invitation and set a password |
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
2. The same origin plus `/auth/callback` (and invitation path if used) in the Supabase Auth redirect allow-list.
3. Site URL set to that origin.

Until those are approved, forgot-password and invitation email sending stay blocked in the UI. Proposed allow-list entries (not applied):

- Site URL: `<approved-origin>`
- Additional redirect URLs: `<approved-origin>/auth/callback`, `<approved-origin>/auth/accept-invitation`, `<approved-origin>/auth/reset-password`

Do not use a wildcard. Do not invent a production domain.

## Auth settings status

The connected MCP has no Auth-settings inspection tool. These remain **UNKNOWN** until read from the Supabase dashboard:

- Email provider enabled
- Public sign-up enabled/disabled
- Email confirmation policy
- Password policy
- Site URL and redirect allow-list
- Confirmation, recovery, and invitation templates

Desired default for FortSite: public sign-up disabled; invitations only. Do not change dashboard settings without an explicit approval note.

## Profile migration

File: `supabase/migrations/20261026120000_user_profiles.sql`

Creates `public.user_profiles` with RLS so an authenticated user can read/insert/update only their own row. `anon` has no grants. No company or role columns. **Not applied** until you approve the SQL and an agent runs MCP `apply_migration` for project `rvfoveqprrtobmywaodf`.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Configuration screen on load | Missing `VITE_SUPABASE_URL` or publishable key |
| Reset email blocked in UI | `VITE_AUTH_REDIRECT_ORIGIN` unset or origin mismatch |
| Profile save unavailable | Migration not applied yet |
| Signed in but no company data | Expected until Phase 06 memberships |
