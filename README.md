# FortSite

FortSite is a practical construction management and ERP platform for building
developers and contractors in Nepal and India. It is intended to help teams
control work, materials, people, procurement, and project finances for
apartments, villas, small townships, restaurants, hotels, and warehouses.

## Current status

**Phase 05 — Authentication, profiles and session lifecycle (IN PROGRESS).**

This repository currently contains:

- Phase 01 product and architecture documentation under `docs/fortsite/`
- A React 19 + Vite + TypeScript web application foundation
- A light construction design system with a development-only component gallery
- A browser Supabase client that uses only the public project URL and publishable key
- Email/password Auth screens, session restore, and a self-service profile form

Business modules, company membership, and role workspaces are **not implemented**
yet. The root page is a labelled development scaffold. Supabase Cloud is the
backend host. This repository does not run a local Supabase stack.

Canonical roadmap: [`FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md`](FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md).

Phase documentation:

- Product and architecture: [`docs/fortsite/`](docs/fortsite/)
- Design system guide: [`docs/fortsite/design-system.md`](docs/fortsite/design-system.md)
- Phase 02 engineering record: [`docs/engineering/phase-02-bootstrap.md`](docs/engineering/phase-02-bootstrap.md)
- Phase 03 engineering record: [`docs/engineering/phase-03-design-system.md`](docs/engineering/phase-03-design-system.md)
- Phase 04 engineering record: [`docs/engineering/phase-04-supabase.md`](docs/engineering/phase-04-supabase.md)
- Cloud operations: [`docs/fortsite/supabase-cloud-operations.md`](docs/fortsite/supabase-cloud-operations.md)
- Migrations: [`docs/fortsite/migration-workflow.md`](docs/fortsite/migration-workflow.md)
- Environment: [`docs/fortsite/environment-configuration.md`](docs/fortsite/environment-configuration.md)
- Recovery: [`docs/fortsite/cloud-deployment-and-recovery.md`](docs/fortsite/cloud-deployment-and-recovery.md)
- Authentication: [`docs/fortsite/authentication.md`](docs/fortsite/authentication.md)
- Phase 05 engineering record: [`docs/engineering/phase-05-auth.md`](docs/engineering/phase-05-auth.md)
- Status register: [`docs/fortsite/phase-status.md`](docs/fortsite/phase-status.md)

Open the design-system gallery only while the development server is running:

```text
http://localhost:5173/__dev/design-system
```

The gallery route is not registered in production builds.

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
cp .env.example .env.local
# Paste the publishable key into .env.local. Do not commit that file.
npm run dev
```

Open the printed local URL. You should see the development scaffold at `/`.

## Scripts

| Script                 | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Start the Vite development server                          |
| `npm run build`        | Typecheck, then create the production build                |
| `npm run preview`      | Preview the production build locally                       |
| `npm run lint`         | Lint application, tests, and relevant config               |
| `npm run typecheck`    | Run TypeScript project-reference checks                    |
| `npm test`             | Run Vitest once (non-watch)                                |
| `npm run test:watch`   | Run Vitest in watch mode                                   |
| `npm run format`       | Format files with Prettier                                 |
| `npm run format:check` | Verify formatting without rewriting files                  |
| `npm run contrast`     | Measure design-token contrast ratios                       |
| `npm run scan:secrets` | Scan the build and tracked source for secret-like material |

Verification sequence for a clean clone:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run scan:secrets
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

The app validates:

- `VITE_APP_NAME` — defaults to `FortSite`
- `VITE_APP_ENV` — `development`, `test`, or `production`; defaults to `development`
- `VITE_SUPABASE_URL` — required public API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — required publishable key

See [`.env.example`](.env.example) and
[`docs/fortsite/environment-configuration.md`](docs/fortsite/environment-configuration.md).
Commit `.env.example` only. Do not commit `.env` or `.env.local`.

## Supabase Cloud

| Item         | Value                                               |
| ------------ | --------------------------------------------------- |
| Organization | `FortSite - 2Merged`                                |
| Project      | `FortSite - 2Merged`                                |
| Project ref  | `rvfoveqprrtobmywaodf`                              |
| API URL      | `https://rvfoveqprrtobmywaodf.supabase.co`          |
| Role         | Fresh development target. Not a production project. |

Cursor's Supabase MCP plugin is the management interface. Phase 04 verified
that identity with read-only tools and did not migrate, seed, or deploy.
Details: [`docs/fortsite/supabase-cloud-operations.md`](docs/fortsite/supabase-cloud-operations.md).

## Dependency chain

Phase 02 depends on Phase 01 documentation. Phase 03 depends on Phase 02.
Phase 04 depends on Phases 01–02. Do not start Phase 05 until its own exit
gate is met.
