# Platform Owner authority

Phase 07 defines the protected Platform Owner registry and boolean authorization helpers. It does not create the Super Admin UI, company onboarding, or subscriptions.

## Concepts

| Concept | Meaning | Does not mean |
| --- | --- | --- |
| Auth identity | `auth.users` row | Platform authority |
| Profile | `user_profiles` | Ownership |
| Company membership | Phase 06 | Platform authority |
| Platform Owner | Active row in `platform_admins` | Tenant superuser |

## Tables

### `platform_admins`

- Primary key `user_id` → `auth.users(id)` with `ON DELETE RESTRICT`
- `platform_role` constrained to `owner`
- `status`: `active` | `suspended` | `revoked`
- `granted_by_user_id` null only for the documented initial bootstrap
- Last active owner cannot leave `active` unless the recovery session setting is set

### `platform_authority_audit_events`

Append-only authority events. Phase 11 must extend/reuse this table; do not create a second platform audit log.

## Functions

| Function | Security | Contract |
| --- | --- | --- |
| `is_platform_owner()` | DEFINER, `search_path=''` | Boolean for `auth.uid()` only. DEFINER is required because the registry has no client policies. |
| `require_platform_owner()` | INVOKER | Raises `42501` when the boolean is false |

Execute granted to `authenticated` only. Revoked from `PUBLIC` and `anon`.

## RLS and grants

Both tables use `ENABLE` + `FORCE ROW LEVEL SECURITY` with **zero policies** and no grants to `anon` or `authenticated`. Clients must not query the registry; they call `is_platform_owner()`.

Company policies from Phase 06 are unchanged. Do **not** add `OR is_platform_owner()` to tenant tables.

## Later phases

- **Phase 08:** UI may call `getCurrentPlatformAuthority()` / `is_platform_owner()`. Hidden routes are not authorization.
- **Phases 09–11:** Privileged mutations must call `require_platform_owner()` (or equivalent server JWT check) and write audit events. Do not trust request-body role fields.
- **Bootstrap:** See [runbooks/platform-owner-bootstrap.md](runbooks/platform-owner-bootstrap.md). Live first-owner grant remains operator-blocked until an exact Auth UUID is approved.

## Client helper

[`src/features/platform/authority.ts`](../../src/features/platform/authority.ts) returns `owner` | `not_owner` | `unavailable`. Errors fail closed as `unavailable`.

## Cloud evidence

- Migration applied: `phase_07_platform_owner` / `20261026173350`.
- Live suite: `scripts/phase07-authority-live.mjs` **PASSED 18/18**.
- Synthetic fixtures removed. Live first-owner bootstrap remains **BLOCKED** until an operator supplies the Auth UUID.
