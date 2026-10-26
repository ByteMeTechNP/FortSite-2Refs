# Company lifecycle

Phase 09 contract for company onboarding state. This is not the Phase 12 permission matrix and not a subscription entitlement.

## Stored states

`pending_setup`, `active`, `paused`, `suspended`, `archived`.

`pending_setup` remains the state written when a company is recorded. `paused` is a real stored state. The overview counts those five statuses, and their sum equals `total`.

## Who may change state

Only `transition_company_lifecycle`. It requires an active Platform Owner, locks the company row, checks the matrix below, and appends `company_lifecycle_events`. Clients have no insert or update on companies or on the event table.

A founding administrator cannot call it. Sign-in never changes lifecycle. There is no delete and no ordinary unarchive.

Archive in the platform UI also requires the operator to type `ARCHIVE`. The server still requires a reason of 3–500 characters.

## Allowed transitions

| From | To | Extra gate |
| --- | --- | --- |
| `pending_setup` | `active` | Founding-admin membership exists, an `account_security` row exists (password change still required, or already completed), credential handoff is `issued`, and a compliance row exists |
| `pending_setup` | `archived` | Reason |
| `active` | `paused` | Reason |
| `active` | `suspended` | Reason |
| `active` | `archived` | Reason |
| `paused` | `active` | Reason. Activation gates are not repeated |
| `paused` | `suspended` | Reason |
| `paused` | `archived` | Reason |
| `suspended` | `active` | Resolution reason |
| `suspended` | `archived` | Reason |

Any other jump is `lifecycle_transition_rejected`. `pending_setup` → `active` without the gates is `activation_requirements_missing`.

Subscription intent is not one of the gates and does not grant access.

## Operational access

`company_is_operational` is true only for the signed-in user's active membership when the company lifecycle is `active` and `password_change_required()` is false. A paused, suspended, archived, or `pending_setup` company is not operational. An active company is not operational for a member who still owes the initial password change.

## Founding administrator

`company_memberships.founding_admin` means this membership is the first admin membership for that company. It does not authorize staff, settings, or finance. Only the service-role provisioning RPCs can set it true. There is one founding admin per company. The client cannot send a role.

After the password gate is clear, that member can read their own company onboarding summary. They cannot open `/platform`, change lifecycle, create users, or read another company.
