# FortSite

FortSite is a practical construction management and ERP platform for building
developers and contractors in Nepal and India. It is intended to help teams
control work, materials, people, procurement, and project finances for
apartments, villas, small townships, restaurants, hotels, and warehouses.

## Current status

**Phase 02 — repository bootstrap and engineering standards.**

This repository currently contains:

- Phase 01 product and architecture documentation under `docs/fortsite/`
- A React 19 + Vite + TypeScript web application foundation

Business modules, authentication, role workspaces, and Supabase integration are
**not implemented** yet. The root page is a labelled development scaffold only.
It is not an operational dashboard.

Canonical roadmap: [`FortSite_Fresh_Start_Master_Roadmap_V3.md`](FortSite_Fresh_Start_Master_Roadmap_V3.md).

Phase documentation:

- Product and architecture: [`docs/fortsite/`](docs/fortsite/)
- Phase 02 engineering record: [`docs/engineering/phase-02-bootstrap.md`](docs/engineering/phase-02-bootstrap.md)
- Status register: [`docs/fortsite/phase-status.md`](docs/fortsite/phase-status.md)

## Requirements

- **Node.js** 24.22.1 or any later Node 24 patch (`>=24.22.1 <25`)
- **npm** 11.x (ships with the Node 24 LTS line)

Use the committed [`.nvmrc`](.nvmrc):

```bash
nvm install
nvm use
```

## Fresh clone

```bash
git clone <repository-url>
cd FortSite-2Refs
nvm use
npm ci
cp .env.example .env   # optional; defaults work without a local .env
npm run dev
```

Open the printed local URL. You should see the development scaffold at `/`.

## Scripts

| Script                 | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the Vite development server            |
| `npm run build`        | Typecheck, then create the production build  |
| `npm run preview`      | Preview the production build locally         |
| `npm run lint`         | Lint application, tests, and relevant config |
| `npm run typecheck`    | Run TypeScript project-reference checks      |
| `npm test`             | Run Vitest once (non-watch)                  |
| `npm run test:watch`   | Run Vitest in watch mode                     |
| `npm run format`       | Format files with Prettier                   |
| `npm run format:check` | Verify formatting without rewriting files    |

Verification sequence for a clean clone:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## Source tree

```text
src/
  app/           # Startup, router, typed route paths
  components/    # Shared presentation primitives and generic states
    states/      # Loading, empty, error, and runtime error boundary
    ui/          # Local shadcn/ui source components (none required yet)
  config/        # Browser-safe environment validation
  features/      # Future domain modules (empty by design in Phase 02)
  lib/           # Shared utilities such as `cn`
  pages/         # Foundation and not-found pages only
  styles/        # Global CSS entry
  test/          # Test setup and shared render helpers
```

Future product domains belong under `src/features/<domain>/` and should own their
own components, hooks, adapters, types, and tests. Shared components must not
hide business rules.

## Scaffold versus later modules

`/` is intentionally a plain development scaffold. Later phases add:

- Phase 03 — construction design tokens and 21st.dev component governance
- Phase 04 — Supabase environments, migrations, and deployment workflow
- Phase 05+ — authentication and product modules

Do not treat empty folders, fake metrics, or placeholder navigation as product
features. Progressive disclosure is required by the architecture decisions.

## Environment and security

Browser environment values are public. Vite exposes every `VITE_*` variable to
client code. Never put service-role keys, database passwords, provider secrets,
or government credentials in `VITE_*` variables, source, logs, or ordinary
profiles.

Phase 02 only validates:

- `VITE_APP_NAME` — defaults to `FortSite`
- `VITE_APP_ENV` — `development`, `test`, or `production`; defaults to `development`

See [`.env.example`](.env.example). Commit `.env.example` only. Do not commit
`.env` or `.env.local`.

## Supabase destination

| Item         | Exact name           |
| ------------ | -------------------- |
| Organization | `FortSite - 2Merged` |
| Project      | `FortSite - 2Merged` |

These are human-readable destination names only. Phase 02 did **not** link to,
inspect, configure, or mutate that remote project. Phase 04 owns Supabase CLI,
migration, and public client environment setup. Do not invent a project ref,
URL, or API key.

## Dependency chain

Phase 02 depends on Phase 01 documentation. Phase 03 depends on Phase 02. Do not
start later phases from this foundation until their own exit gates are met.
