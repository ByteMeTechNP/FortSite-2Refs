# FortSite design system

**Phase:** 03 (tokens) + UI redesign checkpoint (V3 shell and page grammar)  
**Status:** Active visual contract for screens through Phase 10.  
**Token source of truth:** [`src/styles/tokens.css`](../../src/styles/tokens.css)

This guide is for developers building FortSite screens. Brand hex values live only
in `tokens.css`. Components consume semantic CSS variables and Tailwind utilities.

## Brand anchors

| Token | Value | Use |
|---|---|---|
| Construction Amber | `#F59E0B` | Primary action surface |
| Amber soft | `#FEF3C7` | Soft amber wash |
| Graphite | `#1F2937` | Platform shell; primary-button text |
| Graphite raised | `#374151` | Active shell nav item |
| Blueprint Blue | `#2563EB` | Opt-in text links and focus rings |
| Primary text | `#0F172A` | Body / page titles |
| Secondary text | `#475569` | Captions; required on subtle surfaces |
| Muted text | `#64748B` | Helper copy on white/canvas only (≥4.5:1) |
| Canvas | `#F8FAFC` | Page background |
| Surface | `#FFFFFF` | Cards, dialogs, inputs |
| Surface subtle | `#F1F5F9` | Muted panels |
| Separator | `#CBD5E1` | Non-interactive separators only |
| Input border | `#64748B` | Interactive control edges (non-text ≥3:1) |
| Info | `#1D4ED8` on `#DBEAFE` | Info badges (~5.49:1) |

Primary buttons use Amber with Graphite text. Never use white text on Amber.

Do not use muted `#64748B` on subtle `#F1F5F9` for readable captions (~4.34:1 fails).
Use `text-foreground-secondary` (`#475569`) there. Separator `#CBD5E1` is not an
input, button, or focus edge.

## Link rule

Anchors inherit color and are **not** underlined by default. `NavLink`, nav items,
and button-as-link patterns must stay ununderlined. Real text links opt in with
`text-link` (Blueprint) and optional `hover:underline`.

## Semantic tokens

Prefer semantic utilities:

- `bg-background`, `text-foreground`, `text-foreground-secondary`, `bg-card`
- `text-muted-foreground` only on white/canvas when contrast passes
- `bg-primary`, `text-primary-foreground`
- `border-border` (separators), `border-input` (controls)
- `text-link`, `ring-ring`
- Shell: `bg-shell`, `text-shell-foreground`, `bg-shell-raised`
- Status: `bg-success-bg`, `text-success-foreground`, and the matching warning,
  danger, and info pairs

Do not hard-code brand hex values in components. If a new semantic need appears,
add it in `tokens.css` and map it in `src/styles/index.css`.

## Platform shell

[`PlatformLayout`](../../src/features/platform/layout/PlatformLayout.tsx) is Graphite,
252px expanded on desktop, with a Dialog drawer on mobile/tablet. There is no
collapsed icon rail. Page titles live in [`PageHeader`](../../src/components/layout/PageHeader.tsx),
not the 64px white top bar. Nav: Overview, Companies, Plans, Subscriptions only.
There is no company workspace shell through Phase 10.

## Typography and spacing

- Font: Geist Variable with a system fallback.
- Page title: 28px / 600 (24px on small screens) via `PageHeader`.
- Prefer tabular numbers for dense numeric columns only.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80.
- Content max width is `--fs-content-max` (~1560px). Auth card ~420px.

## Radii

Buttons pill; cards 14px; inputs 9px; dialogs 16px; badges pill.

## Buttons

Use `@/components/ui/button`.

- Shape: pill (`rounded-full`) for buttons only.
- Variants: default (primary), secondary, outline, ghost, destructive, link.
- Sizes: `sm` (dense desktop), `default` and `lg` (about 40–44px tall), plus icon sizes.
- Loading: set `loading` so the control is disabled and `aria-busy`.
- Default `type` is `button`. Set `type="submit"` only for real form submits.
- Icon-only buttons need an accessible name.

## Forms, tables, feedback

- Labels use the `Label` primitive with `htmlFor`.
- Invalid fields need `aria-invalid` and a text error via `aria-describedby`.
- Tables: white bordered wrapper, ~48px rows, title-case headers, right-aligned amounts.
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
