# Phase 02 — repository bootstrap and engineering standards

**Status:** VERIFIED COMPLETE  
**Date:** 26 October 2026  
**Branch:** `cursor/phase-02-bootstrap-9d76`  
**Depends on:** Phase 01 documentation under [`docs/fortsite/`](../fortsite/)  
**Canonical roadmap:** [`FortSite_Fresh_Start_Master_Roadmap_V3.md`](../../FortSite_Fresh_Start_Master_Roadmap_V3.md)

This record captures the Phase 02 implementation decisions and evidence. It does
not replace the Phase 01 product charter or architecture decisions.

## Scope delivered

- React 19 + Vite + TypeScript SPA foundation
- Strict TypeScript project-reference configs
- React Router declarative SPA routing with typed `ROUTE_PATHS`
- Tailwind CSS v4 via `@tailwindcss/vite`
- Reviewed shadcn/ui init (Radix + nova preset CSS variables, `cn` util)
- ESLint flat config, Prettier, Vitest + React Testing Library
- Centralized browser-safe env validation
- Generic Loading, Empty, Error states and `AppErrorBoundary`
- Foundation and not-found pages only
- Root README, Node 24 LTS declaration, committed lockfile

## Explicitly not delivered

- Business modules, dashboards, login, role menus, fake metrics
- `@supabase/supabase-js`, Supabase CLI, migrations, Auth, Storage, Edge Functions
- React Native / Expo
- Construction Amber/Graphite/Blueprint tokens (Phase 03)
- 21st.dev component catalog (Phase 03)
- CI/CD provider config, deployment, production secrets

## Toolchain versions actually used

Checked and installed on 26 October 2026.

| Tool / package                  | Version |
| ------------------------------- | ------- |
| Node.js                         | 24.22.1 |
| npm                             | 11.19.1 |
| react / react-dom               | 19.3.1  |
| react-router                    | 8.5.0   |
| vite                            | 8.3.5   |
| @vitejs/plugin-react            | 6.1.2   |
| typescript                      | 6.0.3   |
| tailwindcss / @tailwindcss/vite | 4.3.3   |
| shadcn CLI package              | 4.22.1  |
| cn                              | 0.5.0   |
| eslint                          | 10.13.0 |
| @eslint/js                      | 10.0.1  |
| typescript-eslint               | 8.72.0  |
| eslint-plugin-react-hooks       | 7.1.1   |
| eslint-plugin-react-refresh     | 0.5.7   |
| eslint-config-prettier          | 10.1.8  |
| prettier                        | 3.9.10  |
| prettier-plugin-tailwindcss     | 0.8.1   |
| vitest                          | 5.0.5   |
| jsdom                           | 30.1.3  |
| @testing-library/react          | 16.3.3  |
| @testing-library/dom            | 10.4.2  |
| @testing-library/jest-dom       | 7.0.1   |
| @testing-library/user-event     | 14.6.8  |
| @types/node                     | 24.19.2 |
| @types/react / @types/react-dom | 19.3.0  |
| @fontsource-variable/geist      | 5.3.0   |
| tw-animate-css                  | 1.4.0   |

Package manager: **npm**, with committed `package-lock.json` and `.npmrc`
`save-exact=true`. Direct dependency versions are exact.

## Compatibility decisions

1. **Node 24 LTS.** Declared in `.nvmrc` as `24.22.1` and in `package.json`
   `engines.node` as `>=24.22.1 <25`. Vite 8 and Vitest 5 both accept Node 24.
2. **TypeScript 6.0.3, not 7.x.** Registry `typescript@latest` was 7.0.2, but
   `typescript-eslint@8.72.0` accepts TypeScript `>=4.8.4 <6.1.0`. TypeScript
   6.0.3 is the newest stable release inside that range. `baseUrl` is deprecated
   in TypeScript 6 for a future TypeScript 7 removal; `ignoreDeprecations: "6.0"`
   is set so the existing `@/*` path alias keeps working.
3. **React Router package.** Official declarative SPA docs install `react-router`
   only. `BrowserRouter`, `Routes`, `Route`, `Link`, and `MemoryRouter` come from
   that package. `react-router-dom` was not added.
4. **Tailwind v4 only.** Setup uses `@import "tailwindcss"` and
   `@tailwindcss/vite`. No PostCSS/Tailwind v3 hybrid.
5. **shadcn init.** Used `npx shadcn@4.22.1 init --base radix -y --css-variables -p nova`
   on the existing Vite app. Did not use `-d` (Next.js default) or
   `--template vite` (new project scaffold). Generated `components.json`,
   `src/lib/utils.ts`, and neutral CSS variables. Removed unused
   `lucide-react`, `radix-ui`, and `class-variance-authority` because no UI
   component source imported them. Kept `shadcn`, `cn`, `tw-animate-css`, and
   `@fontsource-variable/geist` because the generated CSS imports them.
6. **No Button component.** Foundation and not-found pages use native elements
   and a React Router `Link`.
7. **No peer overrides.** Install completed without `--force` or
   `--legacy-peer-deps`.

## Important config choices

- Feature-oriented layout under `src/`, with `src/features/README.md` describing
  future domain modules and no empty business folders.
- `@/*` alias aligned across TypeScript, Vite, Vitest, and `components.json`.
- `npm run typecheck` runs `tsc -b --pretty false`.
- `npm run build` runs typecheck before `vite build`.
- ESLint uses typed linting, bans explicit `any`, includes React Hooks and React
  Refresh rules, and ends with `eslint-config-prettier`.
- Vitest uses `jsdom`, shared setup cleanup, and user-visible queries.
- `AppErrorBoundary` catches React render/lifecycle errors only. It does not
  catch event-handler, async, or server errors.

## Environment contract

`src/config/env.ts` is the only reader of application env values.

| Variable        | Allowed / default                                              |
| --------------- | -------------------------------------------------------------- |
| `VITE_APP_NAME` | Non-empty string; default `FortSite`                           |
| `VITE_APP_ENV`  | `development` \| `test` \| `production`; default `development` |

Unset or blank values use defaults. An explicit invalid `VITE_APP_ENV` throws.
No Supabase URL or key placeholders exist in Phase 02.

## Supabase destination

| Item         | Exact name           |
| ------------ | -------------------- |
| Organization | `FortSite - 2Merged` |
| Project      | `FortSite - 2Merged` |

Phase 02 recorded these names only. No `supabase` CLI command, link, remote SQL,
deploy, credential creation, or `@supabase/supabase-js` install was performed.

## Verification evidence

Commands run from the repository root with Node 24.22.1 / npm 11.19.1:

| Command                 | Result                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `npm ci`                | PASS                                                                                |
| `npm run format:check`  | PASS                                                                                |
| `npm run lint`          | PASS                                                                                |
| `npm run typecheck`     | PASS                                                                                |
| `npm test`              | PASS — 12 tests / 6 files                                                           |
| `npm run build`         | PASS                                                                                |
| Dev server `/`          | PASS — scaffold heading and message visible                                         |
| Dev server unknown path | PASS — Page not found and home link work                                            |
| Secret / source scan    | PASS — no `service_role`, DB URLs, tokens, or private env files in source or `dist` |

### Tests

- Foundation page renders the development-scaffold heading and sentence
- Root route resolves to the foundation page
- Unknown route shows not-found and home link returns to the foundation page
- Loading, empty, and error states expose accessible content; error retry works
- AppErrorBoundary shows fallback for a throwing child and recovers on Try again
- Env parser returns defaults and rejects invalid explicit values
- App render has no missing-provider exception

## Deferred work

| Item                                                                              | Owner phase |
| --------------------------------------------------------------------------------- | ----------- |
| Construction Amber / Graphite / Blueprint tokens, pill buttons, component gallery | 03          |
| 21st.dev discovery and governance                                                 | 03          |
| Supabase CLI, environments, migrations, public client env contract                | 04          |
| Auth, profiles, session lifecycle                                                 | 05          |
| Business modules and role workspaces                                              | 08+         |
| React Native / Expo companion app                                                 | 61          |

## Known limitations

- shadcn nova preset CSS variables and Geist font are present so the official
  init compiles. They are not the final FortSite brand system.
- TypeScript still uses `baseUrl` + `paths` with `ignoreDeprecations: "6.0"`
  until the toolchain migrates away from deprecated path mapping.
- No coverage script is configured.
- Phase 01 remains NOT STARTED pending product-owner sign-off; Phase 02 does not
  rewrite that decision.
