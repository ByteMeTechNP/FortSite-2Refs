# UI redesign baseline

**Branch start:** `cursor/phase-10-subscriptions-9d76` at `0970c14`  
**Working branch:** `cursor/ui-redesign-checkpoint-9d76`  
**Scope:** Presentational redesign of screens that already exist through Phase 10. No business handlers, route guards, RPC calls, database files, Auth behavior, or Cloud resources.

## Routes in scope

| Path                                      | Screen                         |
| ----------------------------------------- | ------------------------------ |
| `/`                                       | Foundation home                |
| `/auth/login`                             | Login                          |
| `/auth/forgot-password`                   | Forgot password                |
| `/auth/reset-password`                    | Reset password                 |
| `/auth/callback`                          | Auth callback                  |
| `/auth/accept-invitation`                 | Retired invitation             |
| `/auth/change-initial-password`           | Initial password change        |
| `/account`                                | Account (protected)            |
| `/platform/unauthorized`                  | Platform unauthorized          |
| `/platform`                               | Overview (owner guard + shell) |
| `/platform/companies`                     | Companies directory            |
| `/platform/companies/new`                 | Onboarding wizard              |
| `/platform/companies/:companyId`          | Company / onboarding detail    |
| `/platform/plans`                         | Plans                          |
| `/platform/plans/:planId`                 | Plan detail                    |
| `/platform/subscriptions`                 | Subscriptions                  |
| `/platform/subscriptions/:subscriptionId` | Subscription detail            |
| `/__dev/design-system`                    | Dev gallery only               |
| `*`                                       | Not found                      |

There is no company workspace shell. Phase 11 events remain an unavailable panel on the overview. Failed or unavailable queries must not become fabricated zeros.

## Underline root cause

[`src/styles/index.css`](../../src/styles/index.css) applies a global anchor rule:

```css
a {
  color: var(--fs-link);
  text-decoration-line: underline;
  text-underline-offset: 0.2em;
}
```

`NavLink` renders an `<a>`, so platform nav, filter chips that use links, and button-as-link patterns inherit permanent underlines and Blueprint color. The redesign removes that blanket rule. Anchors inherit color and are not underlined by default. Real text links that already opt in (`text-link` with hover underline) keep a visible affordance.

## Token baseline (pre-redesign)

Source: [`src/styles/tokens.css`](../../src/styles/tokens.css).

| Token                     | Current value             | V3 target                                       |
| ------------------------- | ------------------------- | ----------------------------------------------- |
| Primary text / foreground | `#1F2937` (Graphite)      | `#0F172A`                                       |
| Secondary text            | (none dedicated)          | `#475569`                                       |
| Muted text                | `#4B5563`                 | `#64748B` (white/canvas only when ≥4.5:1)       |
| Info text                 | `#1E40AF`                 | `#1D4ED8` on `#DBEAFE`                          |
| Surface subtle            | `#F1F5F9`                 | keep; captions use secondary, not muted         |
| Input border              | `#64748B`                 | keep for interactive edges                      |
| Steel / separator         | `#E2E8F0`                 | V3 separator `#CBD5E1` for non-interactive only |
| Content max               | `72rem`                   | about `1560px`                                  |
| Spacing                   | missing 20/40/48/56/64/80 | full V3 scale                                   |
| Input radius              | 8px control               | 9px                                             |
| Card radius               | 14px                      | keep                                            |
| Button                    | pill                      | keep                                            |

Contrast script: [`scripts/contrast.mjs`](../../scripts/contrast.mjs). It does not yet encode the V3 info pair or the failing muted-on-subtle pair.

## Platform shell baseline

[`PlatformLayout.tsx`](../../src/features/platform/layout/PlatformLayout.tsx) is a light card aside (`md:w-64`), text-only nav (Overview, Companies, Plans, Subscriptions), no Lucide icons, no top bar, no collapse control. V3 replaces this with a Graphite 252px expanded rail, mobile Dialog drawer, and a 64px white top bar. No 68px icon rail is added.

## Initial-password gate (inspection)

Trusted enforcement is **not** the React screen alone.

| Layer                                            | Role                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `InitialPasswordGate`                            | UX redirect to `/auth/change-initial-password` when `password_change_required` RPC is true |
| `password_change_required()`                     | SECURITY DEFINER read of `account_security.must_change_password`                           |
| `is_active_company_member` / `is_platform_owner` | AND `not password_change_required()`                                                       |
| `get_company_access_decision`                    | Returns `reason_code: password_change_required` before membership/subscription             |
| `company_is_operational`                         | Delegates to access decision (Phase 10)                                                    |
| `get_my_subscription_summary`                    | Raises while the flag is set                                                               |

The redesign restyles the change-password page and keeps the gate. It does not claim the UI enforces the requirement and does not change backend code. Re-verify on the working branch before the final report.

Known product note (pre-existing, not fixed here): accounts with no `account_security` row are not forced through this gate. That is documented in panel-managed provisioning docs.

## Scripts and checks available

- `npm run format` / `lint` / `typecheck` / `test` / `build` (exact scripts confirmed from `package.json` during implementation)
- `node scripts/contrast.mjs`
- Secret scan if present in repo scripts

## Screenshot limitation

Before screenshots are captured only if a browser harness is available in this environment. If not, the final report records that limitation. After implementation, key flows are exercised at desktop and 375px when possible.
