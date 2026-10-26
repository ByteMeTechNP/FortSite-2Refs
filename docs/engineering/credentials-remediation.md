# Credentials remediation — Phases 05, 06 and 07

**Status:** VERIFIED COMPLETE for invitation retirement and the initial-password gate  
**Date:** 26 October 2026  
**Not a new phase.** Phase 05 and Phase 07 stay **IN PROGRESS**. Phase 06 stays **VERIFIED COMPLETE**. Phase 08 shell status is unchanged.

## Cloud identity

| Item      | Result                                                              |
| --------- | ------------------------------------------------------------------- |
| Project   | `FortSite - 2Merged`                                                |
| Ref / URL | `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co` |
| Migration | `panel_managed_credentials` / `20261026182825`                      |
| File      | `supabase/migrations/20261027010000_panel_managed_credentials.sql`  |

## What changed

- `/auth/accept-invitation` no longer sets a password or creates a membership.
- `/auth/callback` signs out `type=invite` and `type=signup`. Recovery is unchanged.
- `accept_company_invitation` always raises `invitation_retired`. EXECUTE is revoked from `anon` and `authenticated`. `company_invitations` remains (it was empty).
- `account_security` holds `must_change_password` only. No password column. No client grants. No row means the account is not forced to change.
- `complete_initial_password` updates the Auth password and clears the flag in one transaction. A second call does not change the password.
- `is_active_company_member`, `company_is_operational`, and `is_platform_owner` are false while the flag is set. `companies` still has only `companies_select_member`.

## Verification

| Check                                                                                                                             | Result                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| format / lint / typecheck / test / build / secret scan                                                                            | PASS (92 tests)                                                                                                                            |
| `scripts/credentials-remediation-live.mjs`                                                                                        | PASS 9/9                                                                                                                                   |
| Browser: signed-out `/platform`, retired invite page, must-change owner blocked from the shell, then shell after the password RPC | PASS                                                                                                                                       |
| Audit row                                                                                                                         | `initial_password_changed` / `succeeded`; no password column or key                                                                        |
| Fixture cleanup                                                                                                                   | Temporary users, company, owner row, and security rows deleted. Phase 05 fixture users remain: 2. Owners: 0. Companies: 0. Invitations: 0. |

## Still blocked

- First Platform Owner bootstrap. Dashboard **Add user**, never **Send invitation**, then the bootstrap template. No owner email was supplied.
- Dashboard public sign-up disable and removal of `/auth/accept-invitation` from the Auth redirect allow-list. MCP cannot write Auth settings.

No Edge Function was deployed. No Phase 09 UI was added.
