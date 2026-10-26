# UI redesign implementation plan

## Order of work

1. Confirm branch from `0970c14`, write baseline (this folder).
2. Update tokens and global CSS; extend and run `scripts/contrast.mjs`.
3. Rebuild `PlatformLayout` (Graphite rail + top bar + Dialog drawer).
4. Add shared `PageHeader`; restyle auth shell and every existing platform/auth screen.
5. Update design-system gallery and `docs/fortsite/design-system.md`.
6. Run checks; write `final-report.md`, `future-screen-patterns.md`, and `component-decisions.md`.

## File targets

| Area           | Files                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Tokens         | `src/styles/tokens.css`, `src/styles/index.css`, `scripts/contrast.mjs`            |
| Shell          | `src/features/platform/layout/PlatformLayout.tsx` (+ tests if present)             |
| Page chrome    | new `src/components/layout/PageHeader.tsx` (or equivalent under `src/components`)  |
| Auth           | `auth-page-shell.tsx`, auth pages, `ChangeInitialPasswordPage`, `AccountPage`      |
| Platform pages | overview, companies, onboarding, plans, subscriptions                              |
| Primitives     | `button`, `input`, `card`, `badge`, `table`, `dialog` radii/heights only as needed |
| Docs           | `docs/ui-redesign/*`, `docs/fortsite/design-system.md`                             |

## Contrast decisions to encode

| Pair                             | Expectation                                 | Decision                                                   |
| -------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `#1D4ED8` on `#DBEAFE`           | ~5.49:1 ≥ 4.5                               | Keep for info badges                                       |
| `#64748B` on `#F1F5F9`           | ~4.34:1 &lt; 4.5                            | Do not use for readable captions                           |
| `#475569` on `#F1F5F9`           | Must pass 4.5                               | Captions / secondary on subtle                             |
| `#64748B` on `#FFFFFF` or canvas | Must pass 4.5 for text, or 3:1 for non-text | Muted text only if text ratio ≥ 4.5; input border uses 3:1 |
| `#CBD5E1` on white               | Separator                                   | Non-interactive only                                       |
| `#2563EB` on white               | Focus                                       | Non-text ≥ 3:1                                             |

Map each passing pair to components in the final report. A green script exit alone is not accessibility complete.

## Behavior risks (must not change)

- Route guards: `ProtectedRoute`, `PlatformOwnerGuard`, `InitialPasswordGate` exempt paths.
- Overview: load failure stays error; Phase 11 events card stays unavailable; no fabricated zeros.
- Lifecycle action labels and confirmations on company detail.
- Subscription payment vs term-extension separation.
- RPC call shapes and handlers in feature `api` modules.

## Visual checks

Widths: 375, 430, 768, 1024, 1366, 1920 where the harness allows. Flows: login, platform guard, overview, companies, plans, subscriptions. Confirm nav links are not underlined; auth text links still show affordance.

## Out of scope

Company workspace shell, role layouts (document only), Phase 11+, Auth/RLS/migrations/Edge/Cloud, 68px collapsed icon rail, second component library.
