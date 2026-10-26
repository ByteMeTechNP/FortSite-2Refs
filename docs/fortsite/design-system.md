# FortSite design system

**Visual source:** [ByteMeTechNP/fortsite](https://github.com/ByteMeTechNP/fortsite) `e11188e22570c17ab8939e1c6acaa4e8a0bb2032`  
**Token source of truth:** [`src/styles/tokens.css`](../../src/styles/tokens.css)  
**Parity notes:** [`docs/ui-reference-parity/reference-source.md`](../ui-reference-parity/reference-source.md)

Brand hex values live only in `tokens.css`, copied from the pinned reference
`src/index.css`. Components consume semantic CSS variables and Tailwind utilities.

Documented contrast fixes (reference intent kept):

- Input border `#64748B` instead of reference `#E2E8F0` (1.23:1 on white, fails 3:1).
- Focus ring `#D97706` instead of reference `#F59E0B` (2.15:1 on white, fails 3:1). `#D97706` on white is 3.19:1.
- Status and error text on pale fills uses `#166534` / `#991B1B`. Reference `#16A34A` on `#DCFCE7` is 3.00:1, and `#DC2626` on `#FEE2E2` is 3.95:1.
- Decorative border stays `#E2E8F0`.
- Muted `#64748B` on `#F1F5F9` is 4.34:1. Use it on white or canvas (`#F8FAFC`, 4.55:1), not on the muted fill.

Primary buttons are Amber `#F59E0B` with text `#111827`. Never use white text on Amber.

## Link rule

Anchors inherit color and are **not** underlined by default. `NavLink`, nav items,
and button-as-link patterns must stay ununderlined. Real text links opt in with
`text-link` (Blueprint) and optional `hover:underline`.

## Semantic tokens

Prefer semantic utilities:

- `bg-background`, `text-foreground`, `bg-card`
- `text-muted-foreground` on white or canvas. It fails 4.5:1 on `#F1F5F9`.
- `bg-primary`, `text-primary-foreground`
- `border-border` (separators), `border-input` (controls)
- `text-link`, `ring-ring`
- Shell: `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`
- Status: `bg-success-bg`, `text-success-foreground`, and the matching warning,
  danger, and info pairs

Do not hard-code brand hex values in components. If a new semantic need appears,
add it in `tokens.css` and map it in `src/styles/index.css`.

## Platform shell

[`PlatformLayout`](../../src/features/platform/layout/PlatformLayout.tsx) follows the
reference Super Admin shell: Graphite sidebar `w-64`, header `h-16`, Hammer tile,
and a `w-72` sheet below `md`. Mounted nav is Overview, Companies, Plans, and
Subscriptions. The copied company-admin shell is not routed.

## Typography and spacing

- Font: Geist Variable (`--font-sans: "Geist Variable", sans-serif`).
- Page title: `text-2xl font-semibold tracking-tight`.
- Description: `mt-1 max-w-2xl text-sm text-muted-foreground`.
- Sidebar groups: `text-[11px] tracking-[0.14em] uppercase`.
- Nav: `text-sm rounded-full px-3 py-2`, icons `size-4`.
- Prefer tabular numbers for money and counts. NPR and INR are never summed.

## Radii

Buttons and inputs are pills. Cards and dialogs use `rounded-xl`. Radius token is `0.875rem`.

## Buttons

Use `@/components/ui/button`.

- Shape: pill (`rounded-full`).
- Variants: default (primary), secondary, outline, ghost, destructive (tint), link.
- Sizes: default `h-8`, `sm` `h-7`, `lg` `h-9`, `xs` `h-6`, plus icon sizes.
- Loading: set `loading` so the control is disabled and `aria-busy`.
- Default `type` is `button`. Set `type="submit"` only for real form submits.
- Icon-only buttons need an accessible name.

## Forms, tables, feedback

- Labels use the `Label` primitive with `htmlFor`.
- Invalid fields need `aria-invalid` and a text error via `aria-describedby`.
- Tables: `text-sm`, header `h-10 px-2`, cell `p-2`, row `border-b hover:bg-muted/50`.
- Badges and alerts always include text. Color is never the only signal.
- Dialogs use the local Radix-based `Dialog` primitive.

## Navigation

Use Breadcrumb and Tabs for generic navigation patterns. Do not invent role menus
or fake company sidebars. Future role layouts are documented in
[`docs/ui-redesign/future-screen-patterns.md`](../ui-redesign/future-screen-patterns.md).

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

See [`docs/ui-redesign/component-decisions.md`](../ui-redesign/component-decisions.md).

## Accessibility

Target WCAG 2.2 AA for shared primitives. Measure critical pairs with
`node scripts/contrast.mjs`. A green script exit is not enough — components must
use the tested tokens. Keyboard focus must remain visible. Do not remove focus
outlines without a replacement ring.
