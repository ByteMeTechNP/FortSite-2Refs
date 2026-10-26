# Phase 08 preflight

**Date:** 26 October 2026  
**Project:** `rvfoveqprrtobmywaodf` / `https://rvfoveqprrtobmywaodf.supabase.co`

## Repo and phase status

- Phases 02, 03, 04, and 06 are VERIFIED COMPLETE.
- Phase 05 Auth sessions work; dashboard Auth URL allow-list paste remains open.
- Phase 07 helpers `is_platform_owner()` and `require_platform_owner()` are applied (`20261026173350`) and were tested 18/18. Live first-owner bootstrap remains BLOCKED.
- Router: [`src/app/router.tsx`](../../../src/app/router.tsx). Login returns only through `resolveInternalReturnPath`.
- Design system cards, tables, badges, and loading/empty/error states already exist.

## Cloud schema

Applied migrations: `user_profiles`, `phase_06_company_tenancy`, `phase_07_platform_owner`.

Relevant objects:

- `companies` SELECT is membership-only (`is_active_company_member`). A Platform Owner with no membership cannot read company rows via the table.
- No subscription tables (Phase 10).
- No general platform event feed (Phase 11). `platform_authority_audit_events` remains closed to clients.

## Decision

Add one narrow RPC, `platform_company_overview()`, that:

1. requires `is_platform_owner()` inside a SECURITY DEFINER function;
2. returns aggregate lifecycle counts plus safe company metadata only;
3. does not change `companies` RLS and does not accept caller-supplied ids/filters.

Subscription and audit panels in the UI will show unavailable states until Phases 10 and 11. No Phase 09 onboarding work.
