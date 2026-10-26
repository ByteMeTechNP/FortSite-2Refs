# UI redesign final report

**Branch:** `cursor/ui-redesign-checkpoint-9d76` from `0970c14` on `cursor/phase-10-subscriptions-9d76`  
**Scope:** Presentational only through Phase 10. No Auth, RLS, migrations, Edge Functions, or Cloud changes.

## Checks

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm test` | PASS (134) |
| `npm run build` | PASS |
| `npm run contrast` | PASS (pairs behaved as expected) |
| `npm run scan:secrets` | PASS |
| `npm run lint` | Pre-existing errors in `scripts/phase10-subscriptions-live.mjs` (`no-useless-assignment`); no new UI lint errors introduced. React-refresh warnings unchanged. |
| Browser widths | See below |

## Measured contrast pairs

| Pairing | FG | BG | Ratio | Threshold | Result | Used by |
|---|---|---|---:|---:|---|---|
| Primary text on Canvas | `#0F172A` | `#F8FAFC` | 17.06:1 | 4.5:1 | PASS | Body, `PageHeader` titles |
| Primary text on Surface | `#0F172A` | `#FFFFFF` | 17.85:1 | 4.5:1 | PASS | Cards, auth card, tables |
| Graphite on Amber (button) | `#1F2937` | `#F59E0B` | 6.83:1 | 4.5:1 | PASS | Primary `Button` |
| White on Amber | `#FFFFFF` | `#F59E0B` | 2.15:1 | 4.5:1 | FAIL (expected) | Forbidden; not used |
| Secondary on Canvas | `#475569` | `#F8FAFC` | 7.24:1 | 4.5:1 | PASS | Page subtitles |
| Secondary on Surface | `#475569` | `#FFFFFF` | 7.58:1 | 4.5:1 | PASS | `CardDescription`, table captions |
| Secondary on subtle | `#475569` | `#F1F5F9` | 6.92:1 | 4.5:1 | PASS | Captions on muted/subtle panels |
| Muted on subtle | `#64748B` | `#F1F5F9` | 4.34:1 | 4.5:1 | FAIL (expected) | Not used for readable text |
| Muted on Canvas | `#64748B` | `#F8FAFC` | 4.55:1 | 4.5:1 | PASS | Allowed helper on canvas |
| Muted on Surface | `#64748B` | `#FFFFFF` | 4.76:1 | 4.5:1 | PASS | Allowed helper on white |
| Info badge | `#1D4ED8` | `#DBEAFE` | 5.49:1 | 4.5:1 | PASS | Info `Badge` / alerts |
| Shell light on Graphite | `#F8FAFC` | `#1F2937` | 14.03:1 | 4.5:1 | PASS | Shell brand and active nav |
| Shell muted on Graphite | `#CBD5E1` | `#1F2937` | 9.89:1 | 4.5:1 | PASS | Inactive nav, email footer |
| Separator on white | `#CBD5E1` | `#FFFFFF` | 1.48:1 | 3:1 | FAIL (expected) | Non-interactive borders only |
| Input border on white | `#64748B` | `#FFFFFF` | 4.76:1 | 3:1 | PASS | `Input`, outline buttons |
| Focus ring on white | `#2563EB` | `#FFFFFF` | 5.17:1 | 3:1 | PASS | `:focus-visible` |

**Decision:** Captions and page descriptions use `text-foreground-secondary` (`#475569`), including on subtle surfaces. Muted `#64748B` is reserved for helper copy on white/canvas. Interactive edges stay `#64748B`; `#CBD5E1` is separator-only.

A successful contrast script exit is not treated as complete accessibility until the components above use these pairs (verified in tokens + class usage).

## Initial-password security boundary

Re-read on this branch:

- `InitialPasswordGate` is UX navigation only (`src/features/auth/components/initial-password-gate.tsx`).
- Trusted denial: `password_change_required()`, `is_active_company_member`, `is_platform_owner` / `require_platform_owner`, Phase 10 `get_company_access_decision`, and `get_my_subscription_summary`.
- The redesign restyles `ChangeInitialPasswordPage` and keeps the gate. It does **not** claim the UI enforces the requirement. No backend changes were made.

**Provisioning note (pre-existing, not fixed here):** accounts with no `account_security` row are not forced through this gate (documented in panel-managed provisioning). That is not a redesign defect. No privileged path was found that skips `password_change_required()` while still receiving company or platform data through the helpers above.

## Visual changes delivered

- Graphite 252px platform rail; Dialog drawer on small screens; no icon-rail collapse.
- Global anchor underline removed; `text-link` opt-in for real links.
- V3 tokens, spacing, radii, content max ~1560px, auth card ~420px.
- `PageHeader` on platform and account screens; onboarding stepper restyled.
- Plans/subscriptions tables use bordered table grammar.
- Phase 11 events card remains unavailable; overview errors stay errors.

## Browser verification

Pending harness run at desktop and 375px (and additional widths where available). Results will be appended after manual checks.
