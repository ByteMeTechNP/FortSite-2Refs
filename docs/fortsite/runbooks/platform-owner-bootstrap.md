# Runbook: first Platform Owner bootstrap

**Status:** Prepared. Live bootstrap is **BLOCKED** until an operator supplies the exact Auth user UUID and approves the data grant.  
**Project:** `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co`  
**Template:** [`scripts/operations/bootstrap-platform-owner.template.sql`](../../../scripts/operations/bootstrap-platform-owner.template.sql)

## Preconditions

1. Phase 07 migration `phase_07_platform_owner` is applied and verified.
2. The operator owns the Supabase Cloud project and can use the Dashboard SQL editor or an approved trusted admin path.
3. The intended Auth user already exists, is email-confirmed, and was created or invited through the Dashboard (not a public signup path invented for this purpose).
4. No active `platform_admins` row exists yet.
5. Placeholders in the template are replaced: `__TARGET_USER_ID__`, `__REASON_CODE__`.

## Steps

1. Verify project URL and ref match the values above.
2. Read-only confirm the Auth user UUID and that `email_confirmed_at` is set.
3. Copy the template to a private working copy. Do not commit filled values.
4. Replace placeholders. Leave the SQL undeployed until a second operator reviews the exact statement if team policy requires dual control.
5. Execute the filled SQL once in a trusted Cloud SQL session.
6. Verify with a signed-in session for that user: `select public.is_platform_owner();` returns true.
7. Verify a non-owner session returns false.
8. Confirm one `initial_owner_bootstrapped` audit event exists.
9. Destroy the filled working copy.

## Failure handling

| Condition | Expected result |
| --- | --- |
| Unreplaced placeholders | `placeholder_unresolved` |
| Missing or unconfirmed Auth user | `bootstrap_target_unavailable` |
| Active owner already present | `active_platform_owner_already_exists` |

Do not silently replace an existing owner. Use the recovery runbook instead.

## What this runbook does not do

- Does not create Auth users from the browser.
- Does not expose a public bootstrap RPC.
- Does not put service-role keys in `VITE_*` variables.
- Does not grant company membership or tenant data access.
