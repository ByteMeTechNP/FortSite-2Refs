# Reference-parity UI report

The visual layer of screens through Phase 10 now follows ByteMeTechNP/fortsite `main` at `e11188e22570c17ab8939e1c6acaa4e8a0bb2032`. Target behavior stays on `cursor/ui-redesign-checkpoint-9d76`. Schema, RLS, Auth, Edge Functions, RPC contracts, and Cloud resources were not changed. Panel-managed credentials were not changed.

## Source

|                     |                                                    |
| ------------------- | -------------------------------------------------- |
| Reference           | `e11188e22570c17ab8939e1c6acaa4e8a0bb2032`         |
| Target start        | `1b67d21ae9b4094f95badc30d14438e73f629728`         |
| Notes               | `docs/ui-reference-parity/reference-source.md`     |
| Route map           | `docs/ui-reference-parity/route-component-map.md`  |
| Contrast and checks | `docs/ui-reference-parity/implementation-notes.md` |

## Route status

Every existing route is `MATCHED` or `PARTIAL`. Deferred reference screens (users, marketplace, usage, audit, support, settings, bootstrap, and the company-admin area including accept-invite) are not routed and not linked. See the route map for the per-route note.

The onboarding wizard is `PARTIAL` because it keeps five target steps, including email, initial password, subscription intent, and the one-time password handoff. It does not drop those to match the reference’s three steps.

## What changed

- `src/styles/tokens.css` and `src/styles/index.css` — pinned reference tokens, Geist Variable, no global link underline. Contrast fixes are documented in the implementation notes.
- `src/components/ui/*` — reference primitives. Button keeps `loading`, default `type="button"`, and `asChild`.
- `src/components/shared/*` — page patterns for status, money, pagination, confirmation, country/currency, and audit. Money and audit are not fed invented data.
- `src/features/platform/layout/PlatformLayout.tsx` — Super Admin shell: 256px Graphite sidebar, `h-16` header, breadcrumbs, account menu, `w-72` sheet. No bell.
- `src/features/company-admin/*` — shell files only. Not mounted.
- Auth cards, overview metrics, companies, onboarding, plans, subscriptions, and payment/adjustment forms — reference spacing and controls around the existing handlers.
- `docs/fortsite/design-system.md` — points at the pinned tokens.

## Screenshots

Public routes on the local dev server:

- Login at 1366 and 375: centered card, Hammer tile, pill fields, amber button with dark text.
- Home and not-found at 1366.
- Design gallery at 1366: palette, `text-2xl` title sample, pill buttons including the destructive tint.

Signed-in `/platform` screens were not opened in the browser. Opening them would require the Platform Owner password and would land on the initial-password gate. That gate was not bypassed.

## Commands

- `npm test` — 134 passed
- `npm run typecheck` — passed
- `npm run build` — passed
- `node scripts/contrast.mjs` — passed
- `npm run lint` — failed on pre-existing errors in `scripts/phase10-subscriptions-live.mjs` only

## Remaining deviations

- Input border `#64748B` and focus ring `#D97706`, instead of reference `#E2E8F0` and `#F59E0B`, because those reference pairs fail non-text contrast.
- Status and error text on pale fills is darkened so the pairs pass 4.5:1. Surfaces stay the reference pale colors.
- Onboarding has more steps than the reference create flow.
- Plans and subscriptions are two URLs with a shared tab control, not one reference page.
- Company lists are not paged, so the pagination bar is not shown.
- Sonner is not installed. Feedback uses `Alert`.
- No theme toggle and no notification bell.
