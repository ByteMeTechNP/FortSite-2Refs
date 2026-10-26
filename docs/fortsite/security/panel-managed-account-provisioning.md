# Panel-managed account provisioning

FortSite does not create accounts by public sign-up, `inviteUserByEmail`, invitation links, invitation tokens, or an invitation-acceptance route. A password-recovery email for an **existing** account is not provisioning.

## Who creates an account

| Account | Responsible panel | When |
| --- | --- | --- |
| First Platform Owner | Supabase Dashboard **Add user**, then the reviewed bootstrap SQL | Phase 07 exception. See [platform-owner-bootstrap.md](platform-owner-bootstrap.md). |
| First Company Admin | Future Phase 09 platform panel | Not built in this remediation |
| Company staff | Future Phase 12 team panel | Not built in this remediation |
| Supplier user | Future Phase 56 supplier administration | Not built in this remediation |

An RFQ or other notification may be sent only to an account that already exists. It must not create an Auth user.

## Trusted flow (later panels)

The browser never calls Auth Admin and never sees a service-role key. A later server-side operation, after that phase is approved:

1. Identifies the operator from the Auth session, not from a body field.
2. Checks that operator’s authority for the exact purpose.
3. Creates the user with Auth Admin `createUser` and a high-entropy initial password generated on the server.
4. Shows that password once to the operator. It is not emailed, logged, stored, or shown again.
5. Requires an explicit attestation before marking the email confirmed. The audit row records actor, time, and result, not the password.
6. Inserts `account_security` with `must_change_password = true`. It does not also create a membership, role, subscription, or platform grant.
7. If the email already exists, stops. It does not reset that password or attach a company.

Until that server operation exists, do not add a browser workaround.

## Initial password change

`password_change_required()` is true only when `account_security.must_change_password` is true for `auth.uid()`. Accounts with no row, including the existing Phase 05 fixtures, are not forced through this gate.

`complete_initial_password` changes the Auth password and clears the flag in one transaction. Calling it again does not change the password. Clients cannot update `account_security` directly.

While the flag is set, `is_active_company_member`, `company_is_operational`, and `is_platform_owner` are false. The React gate is only navigation. Direct REST still returns no company rows, and the platform overview RPC stays denied.

## Duplicate and recovery

A duplicate email is a safe failure. Linking it to a company later needs its own approved procedure.

Password recovery for an existing user stays on `/auth/forgot-password` and `/auth/reset-password`. The success text does not reveal whether the email exists. Recovery does not create a user or a membership.

## Retired invitation surfaces

| Surface | What happened |
| --- | --- |
| `/auth/accept-invitation` | Static retired page. Strips a credential hash and signs out. |
| `/auth/callback` `type=invite` or `type=signup` | Signs out and shows the retired message. `type=recovery` still continues. |
| `accept_company_invitation` | Body always raises `invitation_retired`. EXECUTE revoked from `anon` and `authenticated`. |
| `company_invitations` | Table kept. It was empty at remediation time. Clients still have no table grants. |
| `src/features/tenancy/accept-invitation.ts` | Returns a retired error and does not call the RPC. |

No repository code calls `inviteUserByEmail` or browser `signUp`.

## Manual Auth setting

The connected MCP cannot read or write Auth settings. In the Supabase Dashboard for `rvfoveqprrtobmywaodf`, disable public sign-ups and remove `/auth/accept-invitation` from the redirect allow-list. That step stays operator-owned.
