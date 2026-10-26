# Company tenancy

Phase 06 defines company tenants, memberships, and invitations. It does not create roles, platform owners, subscriptions, or company administration UI.

## Concepts

| Concept | Meaning | Does not mean |
| --- | --- | --- |
| Auth identity | A row in `auth.users` | Membership or platform authority |
| Profile | `user_profiles` display fields (Phase 05) | Membership or permission |
| Company | Tenant boundary in `companies` | Role or subscription |
| Membership | `company_memberships` link of user to company | Role, project scope, or assignment |
| Invitation | Historical `company_invitations` rows only. New acceptance is retired | A way to create an Auth user or a membership |
| Operational eligibility | Trusted helper `company_is_operational` | Frontend flag or JWT claim |

A signed-in user with no active membership sees no company rows. OPEN-11 (multi-company product rule) remains unsigned; the schema allows one Auth user to hold memberships in more than one company via unique `(company_id, user_id)`.

## Tables

### `companies`

Identity and lifecycle only. Countries: `Nepal` or `India`. Currencies: `NPR` or `INR`. Timezones: Nepal → `Asia/Kathmandu`, India → `Asia/Kolkata`. Lifecycle: `pending_setup`, `active`, `suspended`, `archived`. Default for a new row is `pending_setup`. `company_code` is server-generated (`FS-` + 8 alphanumeric) and immutable.

### `company_memberships`

Statuses: `active`, `suspended`, `removed`. No role column. Unique `(company_id, user_id)` and `(company_id, id)` for later composite foreign keys.

### `company_invitations`

Statuses: `pending`, `accepted`, `revoked`, `expired`. Email stored trimmed and lowercased. Partial unique index prevents two pending invites for the same company and email. No plaintext invitation tokens.

## Helpers

| Function | Security | Behavior |
| --- | --- | --- |
| `is_active_company_member(company_id)` | INVOKER | Active membership, and no pending initial password change |
| `company_is_operational(company_id)` | INVOKER | Active membership, active company lifecycle, and no pending initial password change. Phase 10 will extend with subscription checks. |
| `accept_company_invitation(invitation_id)` | DEFINER, EXECUTE revoked from clients | Always raises `invitation_retired`. Does not create a membership. The table stays for history. |
| `password_change_required()` | DEFINER | True only when `account_security.must_change_password` is set for `auth.uid()` |

`is_active_company_member` and `company_is_operational` are false while an initial password change is required. A historical invitation row cannot be accepted by a client.

## RLS matrix

| Table | anon | authenticated SELECT | authenticated INSERT/UPDATE/DELETE |
| --- | --- | --- | --- |
| `companies` | none | Own active membership companies | none |
| `company_memberships` | none | Own rows only | none |
| `company_invitations` | none | none (RPC only) | none |

An active member can read a suspended or archived company for status visibility. Operational writes in later phases must call `company_is_operational`.

## Later phases

- **Phases 07–09** create companies through platform-authorized paths. The first Company Admin account is a later panel provision, not an email invitation. Phase 06 leaves no public insert path on `companies`.
- **Phase 10** extends `company_is_operational` with subscription eligibility without changing membership identity.
- **Phase 12** adds role bindings in separate tables. Membership rows stay role-free.

## Client contract

[`src/features/tenancy/accept-invitation.ts`](../../src/features/tenancy/accept-invitation.ts) refuses every call and does not contact the database. `/auth/accept-invitation` is a retired notice.

## Cloud evidence

- Migration applied: MCP name `phase_06_company_tenancy`, version `20261026171655`.
- Live suite: `scripts/phase06-rls-live.mjs` **PASSED 17/17**.
- Temporary Phase 06 companies and Auth fixture users were removed after the suite.
