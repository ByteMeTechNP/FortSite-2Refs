# Implementation notes

Reference `e11188e22570c17ab8939e1c6acaa4e8a0bb2032`. Target branch `cursor/ui-redesign-checkpoint-9d76`, started at `1b67d21`.

## What was copied

Tokens, base CSS, shared presentational components, UI primitives, the Super Admin shell, and the company-admin shell files. Import paths use `react-router` and `@/`. Business handlers, Supabase calls, schema types, invitation acceptance, and bootstrap RPCs were not copied.

`TooltipProvider` is mounted. Query client, theme provider, and Sonner are not: `@tanstack/react-query`, `sonner`, and `next-themes` are not dependencies, and there is no theme toggle. Success and error feedback stays on `Alert`, using the reference alert surface and the status tints below.

`calendar` and `command` were not copied. No ported screen renders them.

## Contrast fixes

Pinned hex values are in `src/styles/tokens.css`. These pairs were measured with `node scripts/contrast.mjs` and adjusted only where the reference pair fails:

| Pair                                                   |  Ratio | Decision                                                                                                         |
| ------------------------------------------------------ | -----: | ---------------------------------------------------------------------------------------------------------------- |
| `#111827` on `#F59E0B` (primary button)                | 8.26:1 | Kept. Passes 4.5:1.                                                                                              |
| `#FFFFFF` on `#F59E0B`                                 | 2.15:1 | Not used.                                                                                                        |
| `#F59E0B` on `#FFFFFF` (reference ring)                | 2.15:1 | Fails 3:1. Ring is `#D97706` (3.19:1).                                                                           |
| `#E2E8F0` on `#FFFFFF` (reference input border)        | 1.23:1 | Fails 3:1. `--input` is `#64748B` (4.76:1). `--border` stays `#E2E8F0` for decorative edges.                     |
| `#16A34A` on `#DCFCE7`                                 | 3.00:1 | Fails 4.5:1. Status text uses `#166534` (6.49:1) on the same pale green.                                         |
| `#DC2626` on `#FEE2E2`                                 | 3.95:1 | Fails 4.5:1. Error and danger text uses `#991B1B` (6.80:1) on `#FEE2E2`. Destructive buttons keep the pale tint. |
| `#64748B` on `#F1F5F9`                                 | 4.34:1 | Fails 4.5:1. Muted text is used on white (4.76:1) and canvas (4.55:1), not on the muted fill.                    |
| `#64748B` at 50% over `#1F2937` (sidebar group labels) | 4.68:1 | Reference opacity kept.                                                                                          |

## Behavior that stayed

- Route table and URLs.
- `InitialPasswordGate`, `PlatformOwnerGuard`, `ProtectedRoute`.
- Phase 09 onboarding steps: Identity, Country, Administrator, Subscription intent, Review. Email, initial password, and the one-time password dialog stay. The flow is not collapsed to the reference’s three steps. No invitation fields.
- Phase 10 plan, term, payment, and adjustment handlers. Payments do not extend terms. No gateway.
- Company lifecycle confirmation phrase. `ConfirmationDialog` is in the tree and is not wired over that phrase.
- Platform event panel stays unavailable. `AuditTimeline` is presentational and not mounted.
- NPR and INR are formatted separately. `MoneyStack` does not add them together and is not given invented totals.
- Pagination bar is presentational. Company and subscription lists are not paged, so it is not mounted there.
- `CountryCurrencyFields` is presentational. The wizard still locks currency from the country and does not render a second currency control.

## Shell

Mounted nav: Overview (`/platform`), Companies, Plans, Subscriptions. The copied `nav-config.ts` still lists Users, Payments, Marketplace, Usage, Audit, Support, and Settings. Those items are not linked.

Company-admin layout, sidebar, and nav config are in `src/features/company-admin/` and are not registered on a route.

No notification bell.

## Checks

| Command                     | Result                                                                                                                                                                                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                  | 134 passed                                                                                                                                                                                                                                                                                                                  |
| `npm run typecheck`         | Passed (also as part of build)                                                                                                                                                                                                                                                                                              |
| `npm run build`             | Passed                                                                                                                                                                                                                                                                                                                      |
| `node scripts/contrast.mjs` | Passed, including the expected failures above                                                                                                                                                                                                                                                                               |
| `npm run lint`              | Failed on 6 pre-existing `no-useless-assignment` errors in `scripts/phase10-subscriptions-live.mjs`. Four `react-refresh/only-export-components` warnings (`button`, `badge`, `tabs`, `auth-context`). No new lint errors in `src`.                                                                                         |
| Browser                     | Public routes checked at 375, 768, and 1366 (login, home, not-found, gallery). Signed-in platform screens were not opened in the browser. The owner session is behind the initial-password gate, and this change does not sign in or bypass that gate. The platform shell is covered by `src/app/platform-router.test.tsx`. |

Widths 430, 1024, and 1920 were not captured after the first Chrome run hung on a profile lock. The layout uses the same card and shell breakpoints (`md` at 768). Those three widths are recorded as not separately screenshotted.
