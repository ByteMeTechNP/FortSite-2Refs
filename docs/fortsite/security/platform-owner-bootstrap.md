# First Platform Owner bootstrap

**Project:** `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co`  
**Status:** **BLOCKED** until an authorized operator supplies the owner’s email and approves the binding.  
**Rule:** Dashboard **Add user**. Never **Send invitation**.

## Current binding

Read-only check after remediation: `platform_admins` has **0** rows. No Platform Owner is bound. The two existing Auth users are Phase 05 `fortsite.test` fixtures. Do not promote them and do not delete them as part of this procedure.

## Procedure when an email is approved

1. Confirm the dashboard project is `FortSite - 2Merged`, ref `rvfoveqprrtobmywaodf`.
2. Authentication → Users → **Add user**. Enter the approved email and an initial password. Do not use **Send invitation**. Do not use public sign-up.
3. Confirm the new user’s UUID and that `email_confirmed_at` is set. Do not put the password in SQL, chat, or a ticket.
4. Run a private copy of [`scripts/operations/bootstrap-platform-owner.template.sql`](../../../scripts/operations/bootstrap-platform-owner.template.sql) with the UUID and a reason code. The script inserts one `platform_admins` row, one audit event, and one `account_security` row with `must_change_password = true`.
5. The owner signs in, completes `/auth/change-initial-password`, and only then opens `/platform`.
6. Confirm `is_platform_owner()` is false before that change and true after it. Confirm an ordinary user is still false.
7. Destroy the filled SQL copy. Do not commit it.

If an active owner already exists, stop. Use [the recovery runbook](../runbooks/platform-owner-recovery.md). There is no public “claim owner” endpoint.

## Recovery

Recovery is a reviewed SQL session by someone who already has project access. It is not an unauthenticated function. It must not reset a password into a table or email a new password from the app. A later approved panel reset may show a new temporary password once and set `must_change_password` again.

## What this does not do

- Does not invent an owner email.
- Does not store the initial password.
- Does not grant a company membership.
- Does not change Phase 08 navigation, cards, or the overview RPC’s returned fields.
