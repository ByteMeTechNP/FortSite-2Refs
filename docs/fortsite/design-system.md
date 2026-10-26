# FortSite design system

**Phase:** 03  
**Status:** Verified with the Phase 03 engineering record.  
**Token source of truth:** [`src/styles/tokens.css`](../../src/styles/tokens.css)

This guide is for developers building FortSite screens. Brand hex values live only
in `tokens.css`. Components consume semantic CSS variables and Tailwind utilities.

## Brand anchors

| Token | Value | Use |
|---|---|---|
| Construction Amber | `#F59E0B` | Primary action surface |
| Graphite | `#1F2937` | Body text and primary-button text |
| Blueprint Blue | `#2563EB` | Links and focus rings |
| Canvas | `#F8FAFC` | Page background |
| Surface | `#FFFFFF` | Cards, dialogs, inputs |
| Steel Border | `#E2E8F0` | Decorative separators only |

Primary buttons use Amber with Graphite text. Never use white text on Amber.

Steel Border is too light for interactive control edges. Use
`--fs-border-strong` / the `border-input` utility for inputs and focusable
controls.

## Semantic tokens

Prefer semantic utilities:

- `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`
- `bg-primary`, `text-primary-foreground`
- `border-border` (decorative), `border-input` (controls)
- `text-link`, `ring-ring`
- Status: `bg-success-bg`, `text-success-foreground`, and the matching warning,
  danger, and info pairs

Do not hard-code brand hex values in components. If a new semantic need appears,
add it in `tokens.css` and map it in `src/styles/index.css`.

## Typography and spacing

- Font: Geist Variable already bundled by Phase 02, with a system fallback.
- Use page / section / subsection / body / helper hierarchy.
- Prefer tabular numbers for dense numeric columns only.
- Spacing uses a 4px scale. Content max width is `--fs-content-max`.

## Buttons

Use `@/components/ui/button`.

- Shape: pill (`rounded-full`) for buttons only.
- Variants: default (primary), secondary, outline, ghost, destructive, link.
- Sizes: `sm` (dense desktop), `default` and `lg` (about 44px tall), plus icon sizes.
- Loading: set `loading` so the control is disabled and `aria-busy`.
- Default `type` is `button`. Set `type="submit"` only for real form submits.
- Icon-only buttons need an accessible name.

## Forms, tables, feedback

- Labels use the `Label` primitive with `htmlFor`.
- Invalid fields need `aria-invalid` and a text error via `aria-describedby`.
- Tables that can overflow must sit in a labelled scroll region.
- Badges and alerts always include text. Color is never the only signal.
- Dialogs use the local Radix-based `Dialog` primitive.

## Navigation

Use Breadcrumb and Tabs for generic navigation patterns. Do not invent role menus
or fake Super Admin / company sidebars in shared components. Role workspaces are
later phases.

## Responsive and motion

Breakpoints follow Tailwind defaults: sm 640, md 768, lg 1024, xl 1280, 2xl 1536.
Avoid page-level horizontal overflow. Respect `prefers-reduced-motion`.

## Development gallery

In development only:

```text
/__dev/design-system
```

The gallery is not a product screen and is not registered in production builds.

## 21st.dev review policy

1. Search for a specific need, not a full dashboard.
2. Fetch and read the source, dependencies, license, accessibility, and network behavior.
3. Accept, reject, or defer with a written reason.
4. Prefer local shadcn primitives when they already cover the need.
5. Never install through a URL that embeds an API key.
6. Never leave a 21st.dev runtime or hosted dependency in the app.
7. Adapt accepted source to FortSite tokens and own it in the repository.

Phase 03 rejected 21st.dev breadcrumb candidate `23681` because it duplicated the
local shadcn breadcrumb and required `@base-ui/react`. See
[`docs/engineering/phase-03-design-system.md`](../engineering/phase-03-design-system.md).

## Accessibility

Target WCAG 2.2 AA for shared primitives. Measure critical pairs with
`node scripts/contrast.mjs`. Keyboard focus must remain visible. Do not remove
focus outlines without a replacement ring.
