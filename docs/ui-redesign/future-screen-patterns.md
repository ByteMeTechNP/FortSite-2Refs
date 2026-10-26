# Future screen patterns (documentation only)

These layouts do **not** exist in the product through Phase 10. Do not implement them in the UI redesign checkpoint.

## Company workspace

- Separate shell from Platform Administration.
- Company-scoped navigation (projects, members, settings) arrives with later phases.
- Must not reuse the Graphite platform rail as a fake company chrome.

## Role layouts

| Role                      | Expected later surface                             |
| ------------------------- | -------------------------------------------------- |
| Platform Owner            | Current `/platform` shell (already present)        |
| Founding Admin            | Company workspace once tenancy UI ships            |
| Company roles (Phase 12+) | Role-scoped nav and permissions; not invented here |

## Phase 11+ platform panels

- Platform events / audit: overview already shows an unavailable panel. Do not invent counts.
- Support operations and settings: no routes yet.

When those phases land, reuse `PageHeader`, status badges, table grammar, and tokens from this redesign. Do not introduce a second design system.
