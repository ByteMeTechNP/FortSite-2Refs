# Phase 03 — construction design system and 21st.dev governance

**Status:** VERIFIED COMPLETE  
**Date:** 26 October 2026  
**Branch:** `cursor/phase-03-design-system-9d76`  
**Depends on:** Phase 02  
**Gallery (development only):** `/__dev/design-system`

## Delivered

- Central token file [`src/styles/tokens.css`](../../src/styles/tokens.css)
- Semantic mapping in [`src/styles/index.css`](../../src/styles/index.css)
- Local shadcn primitives adapted for FortSite
- Pill button with Graphite-on-Amber primary treatment
- Development-only design-system gallery
- Measured contrast script and table
- Developer guide [`docs/fortsite/design-system.md`](../fortsite/design-system.md)

## Token source of truth

Brand hex values exist only in `src/styles/tokens.css`:

| Anchor               | Value     |
| -------------------- | --------- |
| `--fs-amber`         | `#F59E0B` |
| `--fs-graphite`      | `#1F2937` |
| `--fs-blueprint`     | `#2563EB` |
| `--fs-canvas`        | `#F8FAFC` |
| `--fs-surface`       | `#FFFFFF` |
| `--fs-steel`         | `#E2E8F0` |
| `--fs-border-strong` | `#64748B` |

shadcn variables such as `--primary`, `--primary-foreground`, `--border`,
`--input`, and `--ring` map to those tokens. Dark mode was not implemented.

## Component inventory

| Component                                  | Path                           | Notes                                                |
| ------------------------------------------ | ------------------------------ | ---------------------------------------------------- |
| Button                                     | `src/components/ui/button.tsx` | Pill; loading/`aria-busy`; primary Graphite on Amber |
| Card                                       | `src/components/ui/card.tsx`   | 14px radius, steel border, restrained shadow         |
| Badge                                      | `src/components/ui/badge.tsx`  | neutral/success/warning/danger/info                  |
| Alert                                      | `src/components/ui/alert.tsx`  | text + optional icon                                 |
| Dialog                                     | `src/components/ui/dialog.tsx` | Radix primitive                                      |
| Input / Textarea / Label / Checkbox        | `src/components/ui/*`          | strong input border                                  |
| Table / Separator / Tabs / Breadcrumb      | `src/components/ui/*`          | local shadcn                                         |
| Loading / Empty / Error / AppErrorBoundary | `src/components/states/*`      | restyled to semantic tokens                          |

Dependencies added as direct packages because generated UI imports them:
`class-variance-authority@0.7.1`, `radix-ui@1.8.1`, `lucide-react@1.61.0`.

## 21st.dev review

Search query: accessible breadcrumb navigation.

| Candidate              |    Id | Decision               | Reason                                                                                                                                                                                                                                   |
| ---------------------- | ----: | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cnippet-dev Breadcrumb | 23681 | Rejected               | Source retrieved. Requires `@base-ui/react` merge/render helpers. Functionally duplicates the local shadcn breadcrumb already installed. Install URL embeds an API key pattern, which we will not use. No distinct essential capability. |
| Breadcrumb with Icons  | 24872 | Deferred               | Not needed after local breadcrumb coverage.                                                                                                                                                                                              |
| Breadcrumb Fold        | 32938 | Deferred               | Complex interaction beyond Phase 03 needs.                                                                                                                                                                                               |
| originui Breadcrumb    |   440 | Deferred               | Overlaps local primitive.                                                                                                                                                                                                                |
| Link Breadcrumb        | 18132 | Rejected without fetch | Metadata shows Next.js Link coupling, wrong stack.                                                                                                                                                                                       |

Accepted integrations in Phase 03: **none**. Local official shadcn breadcrumb is used.

## Contrast results

Measured with `node scripts/contrast.mjs` (WCAG relative luminance):

| Pairing                                  |       Ratio | Threshold | Result                           |
| ---------------------------------------- | ----------: | --------: | -------------------------------- |
| Graphite on Canvas                       |     14.03:1 |     4.5:1 | PASS                             |
| Graphite on Surface                      |     14.68:1 |     4.5:1 | PASS                             |
| Graphite on Amber                        |      6.83:1 |     4.5:1 | PASS                             |
| White on Amber                           |      2.15:1 |     4.5:1 | FAIL (expected; forbidden)       |
| Blueprint on Surface                     |      5.17:1 |     4.5:1 | PASS                             |
| Blueprint on Canvas                      |      4.94:1 |     4.5:1 | PASS                             |
| Secondary Graphite on `#E5E7EB`          |     11.86:1 |     4.5:1 | PASS                             |
| Destructive white on `#DC2626`           |      4.83:1 |     4.5:1 | PASS                             |
| Muted `#4B5563` on Canvas/Surface        | 7.22 / 7.56 |     4.5:1 | PASS                             |
| Success / warning / danger / info badges |     ≥6.37:1 |     4.5:1 | PASS                             |
| Steel on Surface                         |      1.23:1 |       3:1 | FAIL (expected; decorative only) |
| Strong border `#64748B` on Surface       |      4.76:1 |       3:1 | PASS                             |
| Focus ring Blueprint on Surface          |      5.17:1 |       3:1 | PASS                             |

## Accessibility and responsive checks

Performed:

- Keyboard focus-visible ring using Blueprint Blue
- Dialog open/close with accessible title/description in tests
- Form label + invalid text association in tests
- Reduced-motion CSS rules in the global stylesheet
- Browser gallery inspection at about 375px, 768px, and 1280px widths
- Production build check that gallery heading text is absent from `dist`

Known limitation: automated axe scanning was not added. Manual keyboard and
contrast checks cover the Phase 03 primitives.

## Commands

| Command                     | Result                     |
| --------------------------- | -------------------------- |
| `node scripts/contrast.mjs` | PASS                       |
| `npm run format:check`      | PASS                       |
| `npm run lint`              | PASS                       |
| `npm run typecheck`         | PASS                       |
| `npm test`                  | PASS — 22 tests            |
| `npm run build`             | PASS                       |
| `npm ls --depth=0`          | PASS — no unresolved peers |

## Explicit non-goals completed as exclusions

- No business modules, role menus, or fake dashboards
- No Supabase client, CLI, secrets, or remote mutation
- No dark mode
- No second icon/animation/form library
- No 21st.dev runtime dependency

## Deferred

- Phase 04 Supabase workflow
- Full product navigation and role shells
- Broader visual regression automation
