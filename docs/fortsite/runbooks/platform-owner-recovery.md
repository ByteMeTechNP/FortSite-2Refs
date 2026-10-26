# Runbook: Platform Owner recovery / lockout

**Status:** Documented. Not live-tested against a sole production owner.  
**Project:** `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co`  
**Template:** [`scripts/operations/recover-platform-owner.template.sql`](../../../scripts/operations/recover-platform-owner.template.sql)

## When to use

The sole active Platform Owner lost Auth access, or an active owner must be replaced through a controlled Cloud operation with a written reason.

## Preconditions

1. Project-owning operator approval with a recorded reason code.
2. The replacement Auth user exists and is email-confirmed.
3. Phase 07 schema is present.
4. Placeholders replaced: `__TARGET_USER_ID__`, `__REASON_CODE__`, `__PREVIOUS_USER_ID_OR_NULL__` (use the previous UUID or the literal `null`).

## Steps

1. Verify the Cloud project URL/ref.
2. Identify previous and target Auth UUIDs with read-only inspection.
3. Fill the recovery template privately. Do not commit secrets or personal identifiers.
4. Execute once in a trusted Cloud SQL session. The template sets `fortsite.platform_owner_recovery = on` with `SET LOCAL` so the last-active-owner trigger permits the change inside that transaction only.
5. Verify `is_platform_owner()` for the new identity and confirm the previous identity is not active.
6. Confirm a `bootstrap_recovery_used` audit event was written.
7. Destroy the filled working copy.

## Safeguards

- No public recovery RPC.
- No invisible impersonation of company members.
- Audit history is append-only; do not delete `platform_admins` or audit rows to “undo” a test.
- Do not suspend the sole real owner as a routine test. Use synthetic fixtures for automation.
