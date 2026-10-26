# FortSite Fresh-Start Master Architecture & Delivery Roadmap

**Version:** Fresh-start baseline 5.0 — Supabase Cloud/MCP + panel-managed credentials  
**Planning date:** 26 October 2026  
**Product:** FortSite — construction management and ERP for building developers/contractors in Nepal and India  
**Status:** Proposed implementation baseline; not a claim that any phase is built, certified, or compliant.

> **Confirmed starting state:** FortSite starts from ZERO: an empty Git repository and an empty **Supabase Cloud** project. There is no existing application code, schema, migration history, Auth setup, role system, component library or completed phase to audit or preserve. The authoritative cloud project is organization **`FortSite - 2Merged`**, project **`FortSite - 2Merged`**, project reference **`rvfoveqprrtobmywaodf`**, URL **`https://rvfoveqprrtobmywaodf.supabase.co`**. Cursor is already connected to this project through the Supabase MCP plugin. There is **no local Supabase runtime, Docker stack or local PostgreSQL**. All Supabase-managed backend resources run in the cloud. Phase 01 remains documentation-only; Phase 02 creates the frontend engineering foundation; Phase 04 establishes the cloud/MCP workflow; later phases create schema and features in dependency order. Do not import or assume prior FortSite implementation. Do not reset, recreate or replace the remote project; build it deliberately through reviewed, version-controlled migrations.

## 1. Product decision

FortSite is a practical, mobile-friendly system for companies developing and building apartments, villas, small townships, restaurants, hotels and warehouses. The core product must help teams control work, materials, people, procurement and project finances through one connected data model. The product is not meant to be a showcase of specialist enterprise technology.

The implementation starts at Phase 01, with no phase assumed complete. Phases are dependency-ordered delivery increments. A phase is not “done” because a screen or table exists; it is done when its security, workflow, failure and acceptance tests pass.

### In scope for the core product
- Super Admin onboarding and subscription control; company tenancy and permission boundaries.
- Company Admin, Projects Manager, Site Supervisor, Accountant & Billing, and Inventory Manager workspaces.
- Projects/sites/building areas; tasks, schedule, BOQ/estimates, budgets, contracts/variations, DPR and measured progress.
- Workforce, attendance, labour cost tracking, subcontractors, equipment, materials, store inventory and procurement.
- Expenses, native double-entry accounting, accounts payable/receivable, payments/reconciliation, project cost control and reports.
- Basic building quality/safety/commissioning and handover/defects workflows, document storage, import/export and release readiness.
- Supplier Marketplace as a separately entitled add-on with listings, in-app messaging, managed RFQs, structured quote submission/comparison and in-app/mobile push notifications. Supplier relationships and quote workflows remain permissioned and auditable; marketplace is not a payment processor.

### Explicitly not part of this initial roadmap
GIS/chainage surveying, Monte Carlo risk modelling, AI-first workflows, carbon/ESG accounting, roads/hydropower/industrial EPC/quarry/RMC production, face recognition, IoT/telematics, full statutory payroll, full facilities management, real-estate buyer CRM/installment sales, marketplace payments/commissions, automatic supplier order placement, automatic PO creation from quotes, and automatic stock movements from marketplace activity. Automated takeoffs and BIM/IFC clash detection are in scope but must be engineer-reviewed and traceable; they are not a substitute for signed engineering judgement. Government connector activation is in scope only as the final Phase 67 after the rest of the platform passes its release gate. Reconsider any additional specialist capability only after real customer evidence, a separate business decision and a dedicated scope/acceptance plan.

## 2. Technical stack and boundaries

| Layer | Standard | Rules |
|---|---|---|
| Web frontend | React 19, Vite, TypeScript, React Router | Strict types; feature-oriented code; route protection plus server/database authorization; no client secrets. |
| Companion mobile app | React Native + Expo + TypeScript, phased separately | Native Android/iOS app for field tasks, messages, RFQs, notifications and quick field records. Reuse domain types/API contracts where practical; web UI libraries such as shadcn/21st.dev do not automatically run in React Native. |
| Styling/components | Tailwind CSS, shadcn/ui, 21st.dev MCP/plugin in Cursor | Local shadcn components are source-controlled. Use 21st.dev for discovery/install of reviewed UI code, then adapt to FortSite tokens, test it and own the final component. |
| Backend | Supabase | PostgreSQL, Supabase Auth, Storage, Edge Functions and Realtime only where needed. Supabase is the application data/backend source of truth; no separate custom server by default. |
| Mobile push delivery | Supabase notification/outbox records + Edge Functions + Expo Push Service (or approved provider selected in Phase 60) | APNs/FCM are ultimately involved for iOS/Android. Push is best-effort delivery, not the authoritative notification ledger; store delivery attempts/results, retry safely and provide an in-app inbox. Keep provider tokens/secrets server-side. |
| Data access/security | Supabase JS API + PostgreSQL RLS + reviewed SQL functions/Edge Functions | Every exposed tenant table gets RLS/grants reviewed; privileged operations are checked server-side. Never put a service-role key in frontend code. |
| Database workflow | Supabase Cloud, project-scoped Supabase MCP, version-controlled SQL migration files and Git review | No local Supabase/Docker/Postgres runtime. Author each schema change in Git before applying it through the MCP `apply_migration` tool after review/approval. Use MCP migration/table inspection to verify cloud state; do not use raw `execute_sql` for DDL or undocumented dashboard edits. |
| Pooling | Supabase Cloud API by default; managed pooling only for a separately approved server-side/direct PostgreSQL access path | Browser uses Supabase JS over HTTPS APIs. No browser-to-Postgres connections, no database URL/password in Vite variables and no local PostgreSQL. Do not introduce direct DB access without a documented server-side requirement. |
| Tests | Typecheck/lint, unit/component, database/RLS, integration and end-to-end workflow tests | Test both allowed and forbidden actions. A frontend-only test is not proof of tenant isolation. |

Official technical reference links are listed in Section 12. Current versions and integration steps must be rechecked at implementation time.

### Supabase Cloud operating model — mandatory for Phases 04–67

**Authoritative target**
- Organization: `FortSite - 2Merged`
- Project: `FortSite - 2Merged`
- Project reference: `rvfoveqprrtobmywaodf`
- Project URL: `https://rvfoveqprrtobmywaodf.supabase.co`
- Management path: the connected Supabase MCP plugin in Cursor. Confirm the active project using available read-only MCP tools before acting; stop if the URL/reference does not match. Do not guess or substitute another project.

**Cloud-only backend boundary**
- Supabase PostgreSQL, Auth, Storage, Edge Functions, Realtime, database migrations and project configuration are hosted in Supabase Cloud. Do not install or run Docker, `supabase start`, a local Supabase stack, local PostgreSQL, a local Auth emulator or local Storage/Functions emulators. Do not rely on a local backend for any phase.
- The Node/Vite commands used to develop, test and build the React frontend are frontend toolchain commands, not a local Supabase backend. The production hosting provider for the React web app is not defined here; do not invent one or imply Supabase Cloud hosts the Vite SPA automatically.
- The named cloud project is the implementation target and is assumed to be the fresh development environment until a later explicit environment decision says otherwise. Do not put real customer data into it. If a phase needs isolation from the shared development project, use an explicitly approved Supabase Cloud branch or separate cloud test project when available; never fall back to a local Docker stack. Do not create another project/branch without approval.

**Schema-change workflow**
1. Inspect current cloud migrations/schema read-only through the project-scoped MCP tools.
2. Design the change and create a timestamped SQL migration file in `supabase/migrations/` in Git before any remote mutation. Include constraints, indexes, grants, RLS and rollback/forward-repair notes as applicable.
3. Review the exact SQL and identify destructive or non-backward-compatible operations. Obtain the user's explicit approval for cloud writes; MCP UI/tool-call approval is an additional safeguard, not a substitute for review.
4. Apply DDL through the Supabase MCP `apply_migration` tool, not `execute_sql`. Use `execute_sql` for narrowly scoped read-only inspection/verification only. Use MCP tools such as `list_migrations`, `list_tables`, project URL/key discovery, TypeScript type generation and security/performance advisors when available.
5. Verify the migration record and actual cloud schema after application; commit the migration file and update phase evidence. If MCP capabilities needed for the operation are unavailable, stop and report the blocker rather than switching to unapproved CLI/direct-DB methods.

**Keys and configuration**
- The web app uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or the legacy anon key only if the connected project still uses that supported form) for the Supabase JS client. These are client-visible values; keep actual per-developer `.env.local` files ignored by Git and commit only `.env.example` placeholders.
- Never use `VITE_*` for `service_role`, secret API keys, database passwords, government credentials, webhook secrets, or push-provider credentials. Store privileged values in Supabase Cloud secrets/server-only storage, introduced only in the phase that needs them.
- Do not invoke `supabase link`, `supabase db push`, `supabase db reset`, `supabase start`, Docker, or direct database connections as a fallback for MCP. Keep migrations portable and reviewed in source control even though they are applied in cloud.

**Cloud data/test discipline**
- Seed/test fixtures must be synthetic, explicitly scoped and repeatable. Do not blindly run full seed/reset scripts against a shared cloud project. Avoid destructive cleanup; use test-owned identifiers and narrowly scoped cleanup approved for that phase.
- Security and RLS tests must prove allowed and forbidden access through actual authenticated actors and application/API paths; a successful MCP query by a privileged developer does not prove tenant isolation.
- No remote mutation is considered complete because the UI says success. Record the migration/version, test evidence, relevant MCP verification and any manual cloud-console step.

## 3. Construction design tokens and UI rules

| Token | Value / rule | Intended use |
|---|---|---|
| Construction Amber | `#F59E0B` | Primary action and restrained emphasis; use dark/Graphite text on amber for contrast. |
| Graphite | `#1F2937` | Main text, dark navigation surfaces and high-contrast controls. |
| Blueprint Blue | `#2563EB` | Links, focus ring and information/action states. |
| Canvas | `#F8FAFC` | Application page background. |
| Surface | `#FFFFFF` | Cards, dialogs and tables. |
| Steel Border | `#E2E8F0` | Dividers, borders and table lines. |
| Semantic states | Accessible success/warning/danger/info tokens, checked against contrast | State meaning must never depend on color alone; combine with text/icon. |

- **Buttons:** pill-shaped/full-round; consistent heights; clear primary/secondary/outline/ghost/destructive variants; loading, disabled and keyboard focus states. Avoid white text on amber if contrast is insufficient.
- **Cards:** 12–16px radius; light border; restrained shadow; avoid turning every row into a card.
- **Forms:** short, grouped by task, inline validation, useful defaults, autosaved drafts only where safe, clear submit/approve/post differences.
- **Tables:** search/filter/sort, sticky headers when useful, readable density, responsive fallback, totals linked to detail.
- **Field UX:** quick Today at Site, crew muster, DPR, material request, stock receipt/issue, issue/snags and small expense. Show pending upload/sync distinctly from server-confirmed changes.
- **21st.dev:** search with specific constraints; inspect code/dependencies/license/accessibility; install once; normalize to tokens; run tests. It is a code-acquisition/design tool, not the source of truth for auth, data or business rules.
- **Progressive disclosure:** only show active, built and relevant modules. Specialist features are not exposed as empty nav links.

## 4. Panel and role division

FortSite uses a shared frontend codebase but separate guarded route zones. Route guards improve navigation; RLS and server-side checks enforce actual data access. The existence of a role or menu item never grants authority on its own.

### Mandatory account-provisioning policy — responsible-panel credentials, no email invitations

This rule applies to every FortSite user account (platform, company and supplier) from the relevant phase onward:

- **No user is onboarded by an email invitation.** Do not use Supabase `inviteUserByEmail`, invitation emails, invitation links, invitation-acceptance routes, invitation bearer tokens, or a user-invitation table to create/activate an account. Public self-registration is disabled unless a future, separately approved product decision changes this rule.
- The **responsible authorized panel creates/provisions both the login email and initial password**. The Super Admin panel provisions a company's first Company Admin; the Company Admin's team/user-management panel provisions company users within its authority; the authorized Marketplace/Supplier administration panel provisions supplier accounts and, where enabled, supplier staff. Panel forms collect the intended email and an initial password or generate a strong temporary password. The panel invokes a narrowly scoped trusted Cloud operation, never the Supabase Auth Admin API directly from the browser.
- The trusted Supabase Cloud Edge Function/server-side operation authenticates the caller, checks the caller's permission and scope, validates the input, invokes the Supabase Auth Admin `createUser` operation with the supplied/generated password, and creates the intended profile/membership/provisioning records through idempotent trusted steps. The service/secret key exists only in Cloud-side secrets. No service-role key, Admin API secret or Auth Admin client is exposed to the browser.
- **No password is emailed.** Show initial credentials to the authorized creating operator only after successful provisioning, in a one-time reveal/receipt (email + initial password); do not persist the password, put it in URLs/local storage, return it on ordinary subsequent reads, or write it to logs, audit events, analytics, crash reports or database rows. The responsible operator hands it to the user through an appropriate private out-of-band channel. A lost initial password is handled by an authorized panel password reset, issuing a new temporary password through the same guarded process.
- Accounts must change a panel-issued temporary password at first login before reaching ordinary application data. The first-login flag and completion path must not be client-editable; until the change is completed, privileged/tenant data access remains blocked by trusted authorization/RLS checks. If that enforcement cannot be delivered safely in a phase, keep the new account/membership pending and do not grant ordinary access.
- Email is an identifier, not proof of authority. Before an operator confirms/provisions a verified email identity without an email confirmation message, the panel must require an explicit attestation that the address was checked with the intended person out of band. Only a trusted server-side operation may set Auth email confirmation. Never reveal or modify an existing account's password when an email already exists; use an explicitly authorized existing-identity linking flow if the product later supports it, otherwise stop and report a safe conflict.
- Password-recovery email, if enabled for an already-provisioned account, is a separate account-recovery mechanism—not an invitation or onboarding method. No account, company membership or role can be created/activated by clicking a generic email link. Keep recovery behavior consistent with the approved Phase 05 design.
- **Bootstrap exception:** the very first Platform Owner must be created before a FortSite Super Admin panel can exist. Create that one Auth identity and its password through the authorized Supabase Cloud Dashboard's **Add user** path (not **Send invitation**) and a separate reviewed authority-binding operation; no invitation email is sent. Every later platform/company/supplier user is created by the relevant FortSite responsible panel.
- Auth identity, profile, company/supplier membership, role, project/site scope and operational assignment remain separate concepts. A created Auth user does not automatically gain company or platform authority. Account provisioning and membership activation must be auditable and idempotent.

Use current Supabase Admin `createUser` documentation at implementation time. That API is server-only and does not send an invitation email; if email confirmation is set directly, it must reflect the documented operator attestation rather than an unverified assumption.

### Platform zone — Super Admin
**Platform Owner (highest authority):** create/onboard companies; provision the first Company Admin account (email + initial password) directly from the Super Admin panel; choose plan/trial; manage subscription status/dates and record platform subscription payments/adjustments; activate/suspend/reactivate tenants; manage platform plans/settings, support and audit. Platform Owner is not automatically allowed to browse company operational data as part of routine platform administration. Any future break-glass support access must be explicit, time-limited, reasoned and logged.

Optional restricted Platform Support access can be introduced only when needed; it must not be equivalent to Platform Owner and must not edit subscription plans or access tenant content by default.

### Company zone — five primary roles

| Role | Main responsibilities | Must not automatically do |
|---|---|---|
| Company Admin | Company profile/settings, panel-based team account provisioning, team assignment, projects overview, company-level configuration and operational visibility. | Create Platform Owners, bypass subscription eligibility, or silently rewrite posted financial/stock history. |
| Projects Manager | Assigned project planning, BOQ/estimates, budgets, contracts/variations, task/schedule, progress, inspections, subcontractor scope and project reporting. | Change platform subscription, manage company-wide access by default, or post accounting/stock adjustments without authority. |
| Site Supervisor | Assigned site/area tasks, DPR, progress evidence, attendance/muster, issues/snags, inspections, material requests and expense drafts. | See other projects by default, approve own expense, approve own stock adjustment or access the full ledger. |
| Accountant & Billing | Approved financial documents, project costs, journal/accounting, supplier invoices, client bills, receipts/payments, reconciliation and finance reports. | Alter verified site quantities/attendance without workflow, or access unrelated company tenants. |
| Inventory Manager | Material catalogue, stores, stock receipts/issues/transfers/counts, requisitions, purchase execution and receiving. | Post unrestricted adjustments, change accounting periods or manage platform subscriptions. |

### Identity, membership, role and scope must stay distinct
1. **Identity:** the Supabase Auth user created through the responsible panel (with the one-time first-owner Cloud bootstrap exception). 2. **Membership:** the company the user belongs to. 3. **Role:** which actions the user may perform. 4. **Scope:** which project/site/records those actions apply to. 5. **Assignment:** the operational work the user is responsible for. A task assignment must never grant access by itself.

Users may have more than one company role only where it is operationally justified; permissions are the union of explicitly granted actions within the valid company/project/site scope, except for separation-of-duty rules. Keep the first release to named roles and limited overrides, not a large arbitrary role builder.

### Supplier Marketplace zone — separate add-on
Supplier users manage only their own company, listings, messages and quotes addressed to them. Authorized buyer-company users browse published listings, message suppliers in FortSite, create managed RFQs, collect quotes and compare them within their company. Supplier-specific quotes are never exposed to competing suppliers. The marketplace is not a payment processor. No RFQ or quote automatically creates a PO, payable or stock movement; a permitted user must explicitly approve and create the downstream procurement records.

## 5. Data and security contracts

- Every private company-owned record must be company-scoped and RLS-protected. Add project/site scope where the domain needs it; validate cross-table tenant consistency using database constraints/functions rather than trusting frontend IDs.
- RLS applies to exposed tables; object access in Supabase Storage is permissioned as well. Test read, create, update, delete and relationship paths for allowed and forbidden actors.
- Never expose service-role keys, direct DB passwords, webhook secrets or payment-provider secrets in the Vite bundle. Use Supabase secrets and Edge Functions/server-side logic for privileged operations.
- Account provisioning: use a trusted Cloud Edge Function/server-side Supabase Auth Admin `createUser` operation invoked by the responsible panel; never use `inviteUserByEmail` or email invitation setup links. The panel controls the email and initial password; password values must never be persisted/logged/emailed, and first-login password change is required before normal data access. The one-time first Platform Owner bootstrap uses the Supabase Cloud Dashboard Add user flow because no FortSite panel exists yet; do not use Send invitation.
- Platform authority and company authority are separate. Company Admin cannot grant platform access. A route guard is not a security boundary.
- Cost-bearing records must retain transaction currency and link to the source, company, project/site where applicable, cost code where applicable, creator and approval/posting state.
- Nepal defaults: NPR and Asia/Kathmandu. India defaults: INR and Asia/Kolkata. Do not convert FX or combine unlike currencies into a single total. Changing a default never rewrites prior transactions.
- Financial/inventory postings must be atomic and idempotent; posted records are corrected by reversal/adjustment, not silent mutation. Preserve source-document-to-ledger links.
- Stock is driven by a ledger of posted movements, not a user-editable on-hand field. Accounting journals must balance and posting paths must be tested against duplicate retries.
- Store timestamps in UTC and display in company timezone. Historical records retain the timezone/currency/tax context required to explain them.
- Realtime subscriptions are used selectively for notification/work-queue freshness, not as a substitute for authorization or reliable reads.
- Subscription status/entitlements are checked against trusted server/database state. JWT/UI state alone must not decide whether a company is active.
- Marketplace messages, RFQs, quote documents, quote prices, supplier responses, push tokens and notification payloads are private records. Apply participant/tenant/supplier-side RLS and storage rules; a supplier can access only RFQs addressed to that supplier and their own quotes.
- Mobile push notifications contain minimal sensitive data; deep links re-authorize through the app. The notification inbox/outbox is the durable source of truth, not push delivery status.
- Automated quantity/rebar outputs must carry source drawing/model revision, input assumptions, units, formula/rules version, reviewer and approval status. They remain draft/unverified until an authorized engineer/estimator approves them.
- IFC model files and clash results are permissioned project data. Do not use Supabase Edge Functions for heavy geometric processing by default; test browser/Web Worker/WASM processing on representative models before choosing the execution path.
- Country/registered jurisdiction is captured and validated during company onboarding. Nepal and India use separate tax/compliance profiles and provider adapters. Government credentials are encrypted in server-only storage, never exposed to browser logs, client state or ordinary user-facing records.

## 6. Global definition of done

Every phase must meet all relevant checks below before being marked complete:
1. Defined user workflow and acceptance criteria are met with realistic data.
2. Typecheck, lint, unit/component and production build pass; applicable end-to-end tests pass.
3. Database changes are in reviewed, committed migration files before cloud application; RLS and Storage policies are included and tested against the Supabase Cloud target or an approved isolated cloud branch/project.
4. Negative permissions are tested, including cross-company and cross-project attempts.
5. Loading, empty, failure, duplicate-submit, expired-session and retry states are handled.
6. Audit history exists for approvals, privileged changes and financial/stock-sensitive actions.
7. No financial/stock side effect can be posted twice through retry; history is not silently overwritten.
8. UI matches the tokens, has keyboard-visible focus, appropriate contrast and mobile usability.
9. Documentation explains how to run the frontend toolchain, test, apply/verify cloud migrations through Supabase MCP and recover/forward-fix the changed part; it does not assume a local Supabase runtime.
10. Every new account is provisioned through its responsible authorized panel; no email invitation or public signup path exists; initial passwords are not persisted/logged/emailed; forced first-login password change and panel reset paths are tested.
11. Phase status is recorded as NOT STARTED / IN PROGRESS / BLOCKED / VERIFIED COMPLETE with linked evidence; do not infer completion from a menu item.

## 7. Full phase register and implementation plan

**Total: 67 phases (01–67).** All start as NOT STARTED in a fresh implementation. Dependencies should be honored; later business features must not be started ahead of the foundations they rely on. The national government billing connectors are deliberately the final numbered phase.

### Phase index

| Phase | Name | Dependencies |
|---:|---|---|
| 01 | Product charter, workflow requirements and architecture blueprint | None; this is the project starting point. |
| 02 | Repository bootstrap and engineering standards | Phase 01. |
| 03 | Construction design system and 21st.dev component governance | Phase 02. |
| 04 | Supabase Cloud/MCP environments, migrations and deployment controls | Phases 01–02. |
| 05 | Authentication, profiles and session lifecycle | Phases 02 and 04. |
| 06 | Company tenancy, memberships and tenant-safe data foundations | Phases 04–05. |
| 07 | Secure platform-owner identity and privileged operations boundary | Phases 04–06. |
| 08 | Super Admin panel shell and platform overview | Phases 02–03 and 07. |
| 09 | Company onboarding and lifecycle management | Phases 06–08. |
| 10 | Subscription plans, entitlements and manual payment records | Phases 07–09. |
| 11 | Platform audit, settings and support operations | Phases 07–10. |
| 12 | Company roles, project/site scope and permission matrix | Phases 05–07 and 09. |
| 13 | Company first-run setup and company settings | Phases 06, 09 and 12. |
| 14 | Company workspace shell and role-based home screens | Phases 03, 05, 06, 12 and 13. |
| 15 | Approvals, notifications and company activity history | Phases 06, 11–14. |
| 16 | Shared master data, units, categories and cost codes | Phases 06, 12–13. |
| 17 | Secure document, drawing, photo and attachment storage | Phases 04, 06, 12 and 14. |
| 18 | Spreadsheet import, data export and migration utilities | Phases 12–17. |
| 19 | Project portfolio, projects and sites | Phases 06, 12–16. |
| 20 | Building, block, floor, unit and work-area hierarchy | Phase 19. |
| 21 | Client, consultant and vendor contact register with simple proposals | Phases 13, 16–19. |
| 22 | Work breakdown structure, work packages and project cost codes | Phases 16, 19–20. |
| 23 | Task assignment and accountability | Phases 14–16 and 19–22. |
| 24 | Rate library for materials, labour, equipment and work items | Phases 16, 19 and 22. |
| 25 | BOQ, quantities, estimates and revision history | Phases 16, 18, 22 and 24. |
| 26 | Project budget and approved baseline | Phases 15, 22, 24–25. |
| 27 | Contracts, work orders, variations and change orders | Phases 15, 19, 22, 25–26. |
| 28 | Practical schedule and weekly look-ahead | Phases 22–23 and 25–27. |
| 29 | Mobile-first field workspace and bounded offline drafts | Phases 03–05, 14–17, 19 and 23. |
| 30 | Daily progress report and site diary | Phases 15, 17, 19, 23, 28–29. |
| 31 | Measured quantities and progress against BOQ | Phases 15, 17, 22, 25, 28–30. |
| 32 | Issues, delays, snag lists and corrective actions | Phases 17, 19–20, 23 and 29–31. |
| 33 | Quality inspections, testing and commissioning checklists | Phases 17, 19–20, 29–32. |
| 34 | Practical safety and permit register | Phases 17, 19, 23 and 29. |
| 35 | Employee, worker and crew register | Phases 12–16 and 19. |
| 36 | Attendance, muster, shifts and overtime records | Phases 15, 19, 29 and 35. |
| 37 | Labour costs, wages, advances and allowances | Phases 16, 19, 35–36 and 48. |
| 38 | Subcontractor agreements and work orders | Phases 15–17, 19, 22 and 27. |
| 39 | Subcontractor measurements, claims and settlements | Phases 15, 27, 38 and 48–50. |
| 40 | Equipment and vehicle register | Phases 16, 19 and 21. |
| 41 | Equipment utilization, fuel, maintenance and cost | Phases 15, 19, 40 and 48. |
| 42 | Materials catalogue and specifications | Phases 16–19, 21 and 24. |
| 43 | Site stores, store locations and inventory ledger | Phases 06, 15–17, 19 and 42. |
| 44 | Stock issue, consumption, return, count and waste | Phases 15, 19, 29–30 and 42–43. |
| 45 | Material requisitions and procurement quote capture | Phases 15–16, 19, 21 and 42–44. |
| 46 | Purchase orders, commitments and receiving | Phases 15–16, 19, 42–45 and 48. |
| 47 | Site expenses, petty cash, advances and reimbursements | Phases 15, 17, 19 and 48–51. |
| 48 | Native double-entry accounting and posting engine | Phases 04, 06, 10–16 and the first operational financial workflows. |
| 49 | Supplier invoices and accounts payable | Phases 15, 21, 46–48. |
| 50 | Client billing, progress bills and accounts receivable | Phases 15, 25–27, 31 and 48. |
| 51 | Cash, bank, payment allocation and reconciliation | Phases 15, 48–50. |
| 52 | Integrated budget, commitments, actual cost and simple forecast | Phases 22, 25–27, 37–51. |
| 53 | Nepal/India tax, invoice and document rules | Phases 13 and 48–51. |
| 54 | Role dashboards, operational reports and safe exports | Relevant source phases 15–53. |
| 55 | Project closeout, handover, warranties and defect liability | Phases 17, 20, 32–34, 38–39 and 54. |
| 56 | Supplier Marketplace add-on: supplier profiles, product catalogue and moderation | Phases 05–12, 14, 16–17, 21 and 42–46. |
| 57 | Marketplace in-app messaging and conversation controls | Phases 06, 12, 17 and 56. |
| 58 | Managed RFQ creation, selected supplier recipients and deadlines | Phases 15–17, 21, 42, 45, 56–57. |
| 59 | Structured supplier quote submission, comparison and selection | Phases 25–27, 45–52, 56 and 58. |
| 60 | Notification centre, delivery outbox and mobile push service | Phases 05–06, 15 and 57–59. |
| 61 | React Native/Expo mobile companion app | Phases 02–05, 12, 14, 17, 23, 29–30, 35–36 and 56–60. |
| 62 | Drawing-based automated quantity takeoffs | Phases 17, 20, 22, 25, 31 and 42. |
| 63 | Automated rebar quantities and bar-bending schedules | Phases 16–17, 20, 22, 24–26, 31 and 62. |
| 64 | IFC model import, model viewer and revision management | Phases 17, 20, 22, 25 and 32. |
| 65 | BIM/IFC clash detection and coordination workflow | Phases 17, 32–33 and 64. |
| 66 | Complete end-to-end validation, restore drills, pilot and release readiness | Phases 01–65. Government production connectors remain disabled; use test adapters/fixtures. |
| 67 | FINAL: Nepal IRD/CBMS and India IRP government billing integrations | Phases 09, 13, 48–54 and 66; live activation requires approved authority/provider path and applicable credentials. |

### Detailed phase specifications

### Phase 01 — Product charter, workflow requirements and architecture blueprint

**Dependencies:** None; this is the project starting point.  
**Scope:** Create one agreed definition of what FortSite does for Nepal/India building developers and contractors. Document the real workflows for apartments, villas, townships, hotels, restaurants and warehouses; identify actors, inputs, decisions, outputs, exceptions and acceptance tests. Establish the entity map, route map, security assumptions, non-functional requirements and change-control rules before code is written.  
**Explicit exclusions:** No UI implementation, operational database tables, or broad feature invention. Do not carry old phase numbers or old architecture forward merely because they exist.  
**Exit gate:** Product owner signs off on scope; every core workflow has a measurable acceptance scenario; every feature is marked core, separate add-on, deferred/unapproved, or explicitly out of scope.

### Phase 02 — Repository bootstrap and engineering standards

**Dependencies:** Phase 01.  
**Scope:** Create the React 19 + Vite + TypeScript application foundation, strict TypeScript rules, React Router, Tailwind CSS, shadcn/ui, linting, formatting, unit-test setup and a production build. Establish a feature-oriented code layout, typed route definitions, reusable error/loading/empty states, environment validation and a readable README. Use compatible current stable packages at implementation time and commit the lockfile.  
**Explicit exclusions:** No business modules, mock operational workflows that look production-ready, giant one-file components, unchecked `any`, direct database credentials in the browser, or unreviewed dependency pile.  
**Exit gate:** Fresh clone installs reproducibly; development server, lint, typecheck, tests and production build pass; unknown routes and runtime errors have deliberate behavior.

### Phase 03 — Construction design system and 21st.dev component governance

**Dependencies:** Phase 02.  
**Scope:** Create central theme tokens and a small design system before building product screens. Construction palette: Amber #F59E0B, Graphite #1F2937, Blueprint Blue #2563EB, canvas #F8FAFC, white surfaces, steel borders #E2E8F0, and accessible semantic states. Buttons use pill/full-round shape, with graphite text on amber primary buttons, visible focus states, disabled/loading states and consistent sizing. Cards use 12–16px radius and restrained shadow. Define typography, spacing, tables, badges, dialogs, forms, alerts and mobile breakpoints. Use 21st.dev MCP to find/install reviewed components, then adapt them to FortSite tokens and local accessibility standards.  
**Explicit exclusions:** Do not let each screen use its own palette, install multiple competing component systems, use 21st.dev code without reviewing its dependency list/license/accessibility, or treat 21st.dev as a runtime backend. Prefer existing local shadcn components before installing duplicates.  
**Exit gate:** A documented token file and component gallery exist; buttons, forms, tables, dialogs and navigation look consistent; keyboard focus and contrast are checked; no business logic is hidden inside copied presentation components.

### Phase 04 — Supabase Cloud/MCP environments, migrations and deployment controls

**Dependencies:** Phases 01–02.

**Fixed Cloud target:** Supabase organization `FortSite - 2Merged`; project `FortSite - 2Merged`; project reference `rvfoveqprrtobmywaodf`; URL `https://rvfoveqprrtobmywaodf.supabase.co`. Cursor's Supabase MCP plugin is the approved management interface. Confirm the active target with available read-only MCP tools; stop if identity does not match.

**Scope:** Establish the cloud-only Supabase workflow—no local Supabase runtime, Docker or local PostgreSQL. Document how each schema change is first authored as a reviewed SQL migration in Git, then applied through Supabase MCP `apply_migration` only after explicit user approval, and verified against cloud migration history and actual schema. Use MCP read-only inspection tools where available (`list_migrations`, `list_tables`, scoped `execute_sql`, project URL/key discovery and advisors). Define a safe cloud test-data strategy using synthetic, narrowly scoped fixtures and an approved cloud branch/project when isolation is needed; do not assume local seed/reset workflows. Configure the web Supabase JS client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or the project's supported legacy anon key if required). Validate environment values at startup, ignore `.env.local`, commit `.env.example`, and verify secret scanning/build outputs. Document how Cloud Edge Functions and secrets will be deployed in their later phases through available supported MCP tools or an explicitly approved Cloud control surface. Clarify that frontend Vite build/test commands are not a local backend and that the production SPA hosting provider is not yet selected.

**Phase 04 allowed cloud activity:** read-only inspection of the named project, retrieval/verification of its URL and publishable key, checking existing table/migration/advisor state, and confirming MCP permissions. Do not apply schema changes, create business tables, seed remote data, deploy functions, change Auth/Storage/project settings or store secrets in this phase. There is no need for a no-op migration.

**Explicit exclusions:** No Docker, `supabase start`, local Supabase/Postgres/Auth/Storage/Edge Function runtime, `supabase link`, `supabase db push`, `supabase db reset`, direct database credentials, raw `execute_sql` DDL, undocumented dashboard schema edits, service-role key in Vite variables, unapproved project/branch creation, unapproved remote mutations, or casual AI production-write access. Do not presume the current cloud project is production; treat it as the fresh implementation/development target until explicitly classified.

**Exit gate:** The project identity is verified via MCP; the app's public configuration is validated without exposing secrets; migration creation/review/application/verification steps are documented; cloud-data and branch/test isolation rules are documented; no local Supabase/Docker dependency exists; the repository is ready for the first real schema migration in a later phase; no remote resources were mutated in Phase 04.

### Phase 05 — Authentication, profiles and session lifecycle

**Dependencies:** Phases 02 and 04.  
**Scope:** Implement Supabase Cloud Auth login, logout, approved password recovery, first-login temporary-password change, protected routes and session restoration using the configured public Supabase JS API client. Account creation happens only through an authorized responsible panel using a trusted server-side Supabase Auth Admin `createUser` operation; Phase 05 establishes the login/session and profile support but does not implement user invitations or account-provisioning panels. Keep the Auth identity separate from the user's profile and tenant membership. Configure cloud redirect URLs/provider settings only through a reviewed, approved Cloud operation; do not assume local Auth emulation exists. Add clear loading/error states and safe handling for expired sessions. Do not create public company access by default. Any required schema changes must be committed as migration files first and applied through project-scoped Supabase MCP after review.  
**Explicit exclusions:** No email invitation/setup links, invitation-acceptance route/token/table, public self-registration, passwords stored in FortSite, frontend-only role authority, or assumptions that a signed-in user automatically belongs to any company or is a platform administrator. Password recovery for an existing account is not an account-provisioning mechanism.  
**Exit gate:** Sign-in, approved recovery, forced initial-password change and session-expiry flows pass tests; an authenticated but unprovisioned user sees no protected data; no email invitation path can create or activate an account.

### Phase 06 — Company tenancy, memberships and tenant-safe data foundations

**Dependencies:** Phases 04–05.  
**Scope:** Create the core company/tenant schema, membership records, company identity/status fields, unique tenant codes and helper functions for trusted access checks through reviewed versioned migrations applied to the named Supabase Cloud project with the connected MCP `apply_migration` tool. Membership rows must reference existing Auth identities and be created/activated only through trusted provisioning/administrative operations; do not create an email-invitation table, invitation tokens, or acceptance flow. Add minimal provisioning/audit state only if the approved Phase 01 design requires it. Define company-owned records to carry company_id and use tenant-consistent foreign-key patterns where relevant. Enable RLS on every exposed tenant table and test company A against company B using real test identities through the app/API path. Make company eligibility a server/database-enforced rule, not a hidden frontend assumption. Use read-only MCP inspection to verify applied schema; do not use `execute_sql` for DDL or assume a local database can be reset.  
**Explicit exclusions:** No cross-company shared table containing private data without an explicit design, no company_id supplied by the browser trusted without validation, no broad `USING (true)` policies on private records, no role inferred only from a person being assigned to a project, and no user invitation email/table/token/callback.  
**Exit gate:** Tenant isolation tests cover select/insert/update/delete and relationship edge cases; policies are reviewed against actual query paths; the schema supports a user with memberships in more than one company if allowed by product rules.

### Phase 07 — Secure platform-owner identity and privileged operations boundary

**Dependencies:** Phases 04–06.  
**Scope:** Create the platform-admin/owner authorization boundary in Supabase Cloud. Bootstrap the first Platform Owner through a controlled, documented Cloud process, not public self-registration, an email invitation or an unreviewed SQL shortcut. Since the FortSite Super Admin panel does not yet exist, create the first Auth identity and its password through the authorized Supabase Cloud Dashboard **Add user** path (never **Send invitation**), then bind the exact Auth UUID to the protected platform-owner registry through a separate reviewed, auditable operation. This is the only bootstrap exception to responsible-FortSite-panel account creation. Enforce checks in PostgreSQL functions and/or Cloud Edge Functions for privileged operations; keep secrets server-side. All schema changes use committed migration files applied through approved Supabase MCP migrations. The Platform Owner is the highest authority for onboarding companies and managing platform subscriptions, but platform authority must not silently turn ordinary requests into company-data access.  
**Explicit exclusions:** No role set by user-editable profile fields, no platform-admin creation by a normal Company Admin, no email invitation or `inviteUserByEmail`, no `service_role` in the browser, and no invisible company impersonation. Any future break-glass access must require a reason, time limit and immutable audit trail.  
**Exit gate:** Unauthorized users cannot call platform operations by changing route, request payload or client state; the initial owner credentials/bootstrap and recovery procedure are documented and tested without an invitation email.

### Phase 08 — Super Admin panel shell and platform overview

**Dependencies:** Phases 02–03 and 07.  
**Scope:** Build a separate platform route zone and navigation, e.g. `/platform/*`, with its own authorization guard, layout, accessible tables, filters, confirmation dialogs and responsive behavior. Provide overview cards that drill down to real data: company counts by status, active/trial/overdue subscriptions and recent platform events. Keep this an operations console rather than a marketing dashboard.  
**Explicit exclusions:** No company operational workspace in the platform shell, no fake metrics, no decorative charts without source records, and no normal route link that exposes data beyond the user's platform permission.  
**Exit gate:** Only Platform Owner (and separately granted restricted platform operators if later enabled) can access this zone; metrics reconcile to underlying records; loading/empty/error states are present.

### Phase 09 — Company onboarding and lifecycle management

**Dependencies:** Phases 06–08.  
**Scope:** Allow Platform Owner to create a company, capture and validate its legal registration country (Nepal or India), choose default currency, enter business profile/contact details, create the first Company Admin's Auth account directly from the Super Admin panel by provisioning the account email and initial password, select a subscription/trial intent, and activate, pause, suspend or archive the company under defined rules. The trusted Cloud operation uses the Auth Admin `createUser` path and never sends an invitation email. Create a country-specific compliance-profile record and route the Company Admin into the appropriate Nepal tax/CBMS setup area or India GST/e-invoice/IRP setup area; at this stage capture profile/eligibility metadata only, not live government credentials or submissions. Generate company identifiers safely. Show onboarding state and a clear reason when a company is not eligible for normal use. The actual government/provider credential linking and live endpoint activation are held for final Phase 67.  
**Explicit exclusions:** No open self-service tenant creation unless separately approved; no user invitation email/token/acceptance route; no company deletion that cascades away accounting/audit history; no silent lifecycle transitions.  
**Exit gate:** Platform Owner can onboard a test company end-to-end; the first admin's credentials are generated/set and provisioned through the Super Admin panel, handed off without email, the account is forced to change its initial password, and status transitions are validated and audited.

### Phase 10 — Subscription plans, entitlements and manual payment records

**Dependencies:** Phases 07–09.  
**Scope:** Create plan definitions, subscription terms, start/end dates, trial/grace/active/overdue/suspended/cancelled statuses and a server-side entitlement check. Let Platform Owner change a company's plan and record payments/adjustments with amount, currency, date, reference and notes. Support monthly/annual/lifetime terms only with explicit rules; an annual plan must have an end date. Begin with auditable manual payment recording; integrate payment gateways only after a separate business decision.  
**Explicit exclusions:** No payment card storage, no presumed automatic gateway integration, no frontend-only entitlement enforcement, no currency conversion, and no silent deletion/rewriting of historical subscription payments.  
**Exit gate:** Expired/suspended eligibility is enforced on protected company operations; the appropriate billing/renewal explanation remains available; plan changes are audited and history is preserved.

### Phase 11 — Platform audit, settings and support operations

**Dependencies:** Phases 07–10.  
**Scope:** Add immutable platform audit events for onboarding, status/plan changes, subscription adjustments, privileged settings and access changes. Provide carefully scoped platform settings and a simple support-ticket/notes workflow if operationally required. Record actor, action, target, time, result and reason for privileged changes. Separate platform logs from company activity history.  
**Explicit exclusions:** No routine editing/deleting audit events, no global secret/config editor accessible to non-owners, and no unrestricted access to company documents through support tickets.  
**Exit gate:** Sensitive platform actions are auditable and searchable; permissions are tested; settings have validation and safe defaults.

### Phase 12 — Company roles, project/site scope and permission matrix

**Dependencies:** Phases 05–07 and 09.  
**Scope:** Define five primary company roles: Company Admin, Projects Manager, Site Supervisor, Accountant & Billing, and Inventory Manager. Keep platform roles completely separate. Support assignment to one or more roles where justified and scope project/site operational access. Include the company Team/User Management panel where the Company Admin creates/provisions user credentials (email + initial password), resets a user's password through a trusted operation, assigns membership/roles/scope and disables/revokes access within their company authority. No user-invitation emails, invitation links or public sign-up. Membership identity, assigned responsibility and permission are different concepts. Start with a clear fixed role model and only a small set of explicit permission overrides if real use requires them.  
**Explicit exclusions:** No sprawling arbitrary role builder in the first release; no automatic permission grant from assignment; no role enum changes without migration and full authorization tests; no ability for Company Admin to grant platform access, provision platform accounts, or modify another company's users.  
**Exit gate:** A readable resource/action/scope matrix exists; direct URL/API attempts cannot bypass it; cross-project and cross-site negatives are tested; all user creation/password reset actions are panel-mediated, server-authorized and audited without emailing credentials.

### Phase 13 — Company first-run setup and company settings

**Dependencies:** Phases 06, 09 and 12.  
**Scope:** Give the Company Admin a guided setup for business profile, country-locked compliance profile, company timezone, financial year, default currency, document numbering, logo, business contacts, simple approval defaults and access to the company Team/User Management panel. Nepal defaults to NPR and Asia/Kathmandu; India defaults to INR and Asia/Kolkata. Route the user into the country-specific billing/compliance settings and show connection status (not configured/pending/active) as appropriate. Permit NPR/INR only where the company workflow allows it and store currency on financial records. Legal jurisdiction is not a casual display setting; changing it after regulated invoices exist requires a controlled migration/legal-entity workflow.  
**Explicit exclusions:** No foreign-exchange conversion; changing a default must not rewrite historical transaction currencies; no giant settings form containing features the company does not use.  
**Exit gate:** A Company Admin can configure a new tenant without support; company-specific settings are tenant-isolated and changes are audited.

### Phase 14 — Company workspace shell and role-based home screens

**Dependencies:** Phases 03, 05, 06, 12 and 13.  
**Scope:** Build the company route zone, such as `/app/:companyId/*`, with tenant context derived from verified membership. Create the navigation and role-aware landing screens for Company Admin, Projects Manager, Site Supervisor, Accountant & Billing and Inventory Manager. Show work queues and tasks for that role instead of exposing every future module at once. Include accessible global search affordance once relevant data exists and consistent breadcrumbs/context.  
**Explicit exclusions:** No role-based access implemented only by hiding menu items; no empty links to unbuilt modules; no one dashboard forced on all roles.  
**Exit gate:** Each core role has a useful first screen, a minimal menu and a tested guard; smaller screens remain usable; inactive modules are not advertised as implemented.

### Phase 15 — Approvals, notifications and company activity history

**Dependencies:** Phases 06, 11–14.  
**Scope:** Provide a simple shared approval pattern for expenses, requisitions/purchase orders, contract variations, measured work and bills as needed. Store approval history and notification records in Supabase Cloud; use Realtime selectively only for freshness, never as the authoritative audit trail. Support submit, approve, reject/return with reason, timestamped history and actionable in-app notifications. Make actions idempotent so retrying does not double-post money or stock. Keep common flows configurable through modest thresholds and named approvers.  
**Explicit exclusions:** No universal no-code workflow engine, no uncontrolled notification spam, and no ability to approve one's own record when separation of duties is required.  
**Exit gate:** Approval transitions, notifications, unread state and audit history are tested; repeated commands do not duplicate downstream effects.

### Phase 16 — Shared master data, units, categories and cost codes

**Dependencies:** Phases 06, 12–13.  
**Scope:** Implement reusable, searchable masters for units of measure, material categories, labour categories, equipment categories, cost codes, tax labels, payment methods and document sequences. Support standard defaults plus company-specific values. Prevent duplicates where practical and preserve old references when a category is archived.  
**Explicit exclusions:** No general-purpose custom database/form designer or dozens of mandatory master-data screens before the first project can be created.  
**Exit gate:** Core modules use the same IDs and definitions; units/categories validate inputs; archived values remain visible on historical records.

### Phase 17 — Secure document, drawing, photo and attachment storage

**Dependencies:** Phases 04, 06, 12 and 14.  
**Scope:** Use Supabase Cloud Storage with private buckets and object policies linked to company/project/site permissions. Create bucket/policy changes only through the approved Cloud control path available to the connected MCP or dashboard; record the required configuration in documentation and do not assume local Storage emulation. Store metadata, uploader, file type, size, capture time and optional document category/version. Generate short-lived access URLs when appropriate. Support resumable/retryable uploads where the chosen client library permits and clear upload state for field users. Any database metadata/policy SQL must be versioned and applied via MCP migration review.  
**Explicit exclusions:** No sensitive object in a public bucket by default; no guessing storage paths for access control; no unpermissioned model/drawing access. IFC processing and automated takeoffs are delivered only in Phases 62–65.  
**Exit gate:** Unauthorized tenant/user cannot list, read, replace or delete another company's files; attachment links honor permissions; upload failure/retry is clear.

### Phase 18 — Spreadsheet import, data export and migration utilities

**Dependencies:** Phases 12–17.  
**Scope:** Provide validated imports for the practical starting data: clients/vendors, workers, materials, project metadata, BOQ rows, budgets and opening stock where supported, using the Supabase Cloud API and authorized browser/client flows rather than direct database credentials. Preview rows, map columns, show validation errors and allow safe retry without duplicate records. Export approved lists and reports to CSV/XLSX/PDF where implemented; record import batch and outcomes. Any batch operation must be bounded, observable and tested against the intended Cloud environment; do not use MCP developer privilege as a substitute for normal user authorization.  
**Explicit exclusions:** No opaque one-click import that silently corrupts ledgers; no unbounded export of records the user cannot read; no claiming every competitor's data format is supported.  
**Exit gate:** Representative spreadsheet files can be imported with row-level feedback and reconciliation counts; duplicate/retry behavior is safe; export totals match source records.

### Phase 19 — Project portfolio, projects and sites

**Dependencies:** Phases 06, 12–16.  
**Scope:** Create projects with code, client, type, dates, location, manager, status and commercial context. Represent sites as operational locations under projects where required; allow one project to have multiple sites and one company to have multiple projects. Include archive/close lifecycle, filters, status history and drill-downs.  
**Explicit exclusions:** No assumption every company has only one project/site; no hard delete of projects with financial/operational history; no map/GIS dependency.  
**Exit gate:** Projects and sites are isolated by company and relation integrity prevents attaching another company's site to a project; lifecycle is covered by tests.

### Phase 20 — Building, block, floor, unit and work-area hierarchy

**Dependencies:** Phase 19.  
**Scope:** Support building-oriented project spaces: blocks/buildings, floors, apartments/units, rooms/zones and common areas. Let a simple villa project skip unnecessary hierarchy, while hotel/apartment/warehouse projects use it when helpful. Allow work packages and inspections to reference the right building area without making every field mandatory.  
**Explicit exclusions:** No space-planning CAD or forced room register for small projects that do not need one. Specialist IFC model viewing is handled later in Phase 64 and must not be mandatory for simple projects.  
**Exit gate:** A project may operate with or without the hierarchy; room/unit lists can be imported and filtered; records never cross project/company boundaries.

### Phase 21 — Client, consultant and vendor contact register with simple proposals

**Dependencies:** Phases 13, 16–19.  
**Scope:** Maintain company contacts for clients, architects/consultants, contractors and suppliers, with contact details and project links. Support a lightweight opportunity/proposal record where useful to the construction firm: scope summary, estimate reference, submitted date, status and attached proposal. Keep supplier contacts usable in procurement without requiring the Marketplace add-on.  
**Explicit exclusions:** No real-estate buyer CRM, buyer payment plans, marketing automation or full sales-management suite in the core roadmap.  
**Exit gate:** Contacts are reusable across projects; proposal state and attachments are permissioned; Marketplace contacts remain distinct from internal procurement records unless a user explicitly creates/links a vendor record.

### Phase 22 — Work breakdown structure, work packages and project cost codes

**Dependencies:** Phases 16, 19–20.  
**Scope:** Build a practical breakdown of project scope into stages/trades/work packages and assign cost codes that connect estimates, BOQ, tasks, material, labour, subcontractors and financial postings. Include common templates for building stages while allowing project-level edits. Show roll-up totals with traceability to source lines.  
**Explicit exclusions:** No complex Primavera-grade critical-path dependency matrix or mandatory work breakdown setup for every tiny job.  
**Exit gate:** A work package can be traced from planned scope to execution and costs; roll-ups reconcile to detail; archived codes preserve historical references.

### Phase 23 — Task assignment and accountability

**Dependencies:** Phases 14–16 and 19–22.  
**Scope:** Create tasks with owner/crew, project/site/area, planned dates, priority, status, due date, notes, checklist and links to supporting records. Make assignment and overdue tasks visible in the relevant role's Today/Work Queue view. Support comments or activity notes only where they serve a real execution need.  
**Explicit exclusions:** No project-management mega-suite with unnecessary chat channels, automation canvases or dozens of task fields.  
**Exit gate:** A task can be created, assigned, completed, reopened with reason where permitted, and tracked by project/site; users see only authorized tasks.

### Phase 24 — Rate library for materials, labour, equipment and work items

**Dependencies:** Phases 16, 19 and 22.  
**Scope:** Provide reusable rate items with unit, currency, effective date/source and optional region/vendor. Rates feed estimates, BOQ and budgets but remain snapshots in approved historical documents. Allow company defaults and project overrides with traceable edits.  
**Explicit exclusions:** No external live-price scraper, dynamic AI pricing or silent updates to already-approved estimates.  
**Exit gate:** Rates are unit-consistent; historical quotes/estimates retain their original rates; currency is explicit and never silently converted.

### Phase 25 — BOQ, quantities, estimates and revision history

**Dependencies:** Phases 16, 18, 22 and 24.  
**Scope:** Create a building-project BOQ with item code/description, unit, quantity, rate, amount, cost code, specification and revisions. Support estimate preparation, grouped work sections and comparison of revisions. Allow practical spreadsheet import/export. Distinguish draft estimate from approved baseline.  
**Explicit exclusions:** No unreviewed quantities that silently alter an approved BOQ. Automated drawing takeoffs and rebar schedules are implemented later in Phases 62–63; initial BOQ entry/import remains fully usable without them.  
**Exit gate:** BOQ quantity x rate totals validate; revision compare works; approved quantities/rates are not silently changed; source and approval metadata are present.

### Phase 26 — Project budget and approved baseline

**Dependencies:** Phases 15, 22, 24–25.  
**Scope:** Create an approved project budget tied to BOQ/work packages/cost codes, with revisions and contingency/allowance lines where needed. Record baseline version, approver and effective date. Give Projects Manager and Accountant a shared reference for cost control.  
**Explicit exclusions:** No Monte Carlo forecasts or predictive AI. Keep contingency simple and explicit.  
**Exit gate:** Budget line totals reconcile; changing an approved baseline creates a new version/approval rather than overwriting history.

### Phase 27 — Contracts, work orders, variations and change orders

**Dependencies:** Phases 15, 19, 22, 25–26.  
**Scope:** Track owner/client contracts, subcontract/work orders, agreed scope/value, start/end dates, retention/advance where applicable and linked change orders. A change request records reason, value/time impact, supporting evidence, approval status and effect on the approved project baseline only after approval.  
**Explicit exclusions:** No full legal contract drafting suite or electronic-signature provider integration unless separately approved.  
**Exit gate:** Contract/variation changes have revision and approval history; approved value changes flow consistently to budget/billing; draft changes never silently affect posted finance.

### Phase 28 — Practical schedule and weekly look-ahead

**Dependencies:** Phases 22–23 and 25–27.  
**Scope:** Provide a simple task schedule with planned start/finish, dependencies for common sequencing, responsible crew and weekly look-ahead. Show late tasks and baseline versus actual dates. Allow manual adjustments and readable timeline/list views.  
**Explicit exclusions:** No 4D/5D model, Monte Carlo schedule risk, resource-optimization solver or advanced Primavera clone.  
**Exit gate:** A project manager can maintain the schedule and weekly look-ahead; actual dates/history are preserved; schedule status links to execution tasks.

### Phase 29 — Mobile-first field workspace and bounded offline drafts

**Dependencies:** Phases 03–05, 14–17, 19 and 23.  
**Scope:** Optimize common site workflows for Android/mobile web: Today at Site, assigned tasks, DPR, attendance/muster, material request, issue/snags, inspection and small expense draft. Cache only the minimum safe data in browser/mobile device storage for bounded draft capture; this is not a local backend or local Supabase runtime. Allow a clear pending-upload/sync queue when connectivity is poor; Supabase Cloud confirms approval/posting.  
**Explicit exclusions:** No promise of complete offline ERP, offline posting of accounting/inventory, silent conflict resolution or background sync that can duplicate transactions.  
**Exit gate:** A user can save drafts during interrupted connectivity, restart and resume safely, see sync failures/conflicts, and never confuse a draft with a server-confirmed record.

### Phase 30 — Daily progress report and site diary

**Dependencies:** Phases 15, 17, 19, 23, 28–29.  
**Scope:** Capture date/site, weather as optional, workforce count, work completed, quantities, materials used/received, equipment used, delays, instructions, incidents and photo evidence. Provide a short repeat-use form with sensible defaults and auto-filled project/site/user/date. Allow submit and review workflow.  
**Explicit exclusions:** No mandatory long narrative for every day and no AI-generated DPR requirement.  
**Exit gate:** A normal DPR can be drafted quickly; submitted reports are traceable; corrections keep history; evidence is stored privately.

### Phase 31 — Measured quantities and progress against BOQ

**Dependencies:** Phases 15, 17, 22, 25, 28–30.  
**Scope:** Record measured work quantities against BOQ/work packages, date, location, measurement notes, evidence, preparer and verifier. Roll up completed versus planned quantities and estimate progress using clearly defined quantities/weights rather than arbitrary percentage inputs alone. Keep accepted measures separate from draft measurements.  
**Explicit exclusions:** No advanced survey chainage, drone measurement or quantity inference from ordinary site photos. Drawing-based assisted/automated takeoffs are a separate workflow in Phase 62.  
**Exit gate:** Progress totals are reproducible from accepted measurements; duplicate entries and over-measurement are flagged; project/site/BOQ links validate.

### Phase 32 — Issues, delays, snag lists and corrective actions

**Dependencies:** Phases 17, 19–20, 23 and 29–31.  
**Scope:** Manage site issues with category, severity, responsible person, due date, status, location, photos and resolution evidence. Support delay reason and impact notes; link defects/snags to room/unit, task, inspection or contractor. Provide filters by open/overdue/area/responsible party.  
**Explicit exclusions:** No enterprise claims-management engine. Model-based clash coordination is delivered later as a separate workflow in Phases 64–65 and is not required to use ordinary site issue/snags.  
**Exit gate:** Issues can be logged on mobile, assigned, updated, resolved and reopened with history; overdue queues work; access is scope-controlled.

### Phase 33 — Quality inspections, testing and commissioning checklists

**Dependencies:** Phases 17, 19–20, 29–32.  
**Scope:** Provide configurable templates for common building quality inspections: concrete/rebar/formwork checks where used, waterproofing, masonry/plaster, finishes, electrical/plumbing/MEP tests and pre-handover checks. Capture pass/fail/not-applicable, evidence, inspector, date, corrective issue and sign-off.  
**Explicit exclusions:** No specialist lab-information system or automated building-control integration; do not make every project use every checklist.  
**Exit gate:** Templates are reusable; failed checks create or link corrective actions; approved inspection results are immutable except through a documented correction.

### Phase 34 — Practical safety and permit register

**Dependencies:** Phases 17, 19, 23 and 29.  
**Scope:** Track site inductions or toolbox talks when used, incidents/near misses, corrective actions, selected risk/permit checklists, responsible person and evidence. Keep it usable for building projects and local practice, and make configurable forms optional. High-risk work approvals can be simple checklists, not a new platform.  
**Explicit exclusions:** No massive EHS enterprise suite, automated regulatory reporting promises or permit workflows that cannot be supported locally.  
**Exit gate:** Incident records are protected, follow-up actions are assigned, and safety records are searchable/exportable with an audit trail.

### Phase 35 — Employee, worker and crew register

**Dependencies:** Phases 12–16 and 19.  
**Scope:** Maintain workers/employees and crews with name, contact/reference ID, trade/skill, employment/vendor relationship, status and documents as appropriate. Minimize sensitive personal data and restrict it by role. Support contractor-provided crews without assuming all workers are direct employees.  
**Explicit exclusions:** No biometric/face-recognition system, broad HR suite or mandatory collection of sensitive identity information not needed for the workflow.  
**Exit gate:** Worker records are company-scoped; crew lists can be bulk-imported; inactive workers remain available on historical records.

### Phase 36 — Attendance, muster, shifts and overtime records

**Dependencies:** Phases 15, 19, 29 and 35.  
**Scope:** Record daily attendance by site and crew using bulk muster; support present/absent/half-day, shift and overtime fields where used. Enable correction requests/approval and link the record to labour cost calculations. Optional location/photo evidence must be governed and never be the only proof of attendance.  
**Explicit exclusions:** No face recognition or geofencing by default; no payroll-compliance claims based on attendance alone.  
**Exit gate:** Representative crews can be marked in bulk; corrected attendance retains history; downstream cost calculations use approved records only.

### Phase 37 — Labour costs, wages, advances and allowances

**Dependencies:** Phases 16, 19, 35–36 and 48.  
**Scope:** Track agreed wage/rate basis, approved days/hours, overtime/allowances when applicable, advances, deductions and payment records, with a clear balance per worker/crew and project cost allocation. Allow export to a payroll provider or accountant if required, but keep FortSite's core scope as construction labour cost/settlement tracking.  
**Explicit exclusions:** No statutory payroll engine, income-tax withholding computation, social-security contribution engine or promise to replace a country-compliant payroll product.  
**Exit gate:** Worker/crew liabilities and project labour-cost totals reconcile to approved attendance and payments; edits to paid history create an adjustment entry.

### Phase 38 — Subcontractor agreements and work orders

**Dependencies:** Phases 15–17, 19, 22 and 27.  
**Scope:** Manage subcontractor profiles, scope/work package, agreement amount, rate basis, start/end date, retention/advance terms, documents and authorized contacts. Connect each subcontract to one or more projects and cost codes. Keep commercial terms visible to authorized company roles only.  
**Explicit exclusions:** No end-to-end subcontractor portal in the initial core unless a separately approved requirement is documented.  
**Exit gate:** Subcontract scope/value is linked to budget and measurement; access is restricted; contract changes require history and approval.

### Phase 39 — Subcontractor measurements, claims and settlements

**Dependencies:** Phases 15, 27, 38 and 48–50.  
**Scope:** Capture measured work/claim lines, quantity, rate, deductions/retention/advance recovery, supporting evidence, review/approval and payment status. Approved claims feed accounts payable and project costs through a single linked posting path. Keep draft claim, approved amount and paid amount distinct.  
**Explicit exclusions:** No duplicate payable created by approving and then retrying; no silent changes after posting.  
**Exit gate:** Claim totals calculate correctly; approval/posting is atomic or idempotent; reversal/correction trail is tested.

### Phase 40 — Equipment and vehicle register

**Dependencies:** Phases 16, 19 and 21.  
**Scope:** Track owned/rented equipment and vehicles: identifier, type, owner/provider, rate/cost basis, condition, documents, project/site allocation and status. Start with an ordinary register, not an asset-accounting or fleet telematics system.  
**Explicit exclusions:** No GPS telematics, IoT tracking or complex depreciation engine in the initial build.  
**Exit gate:** Equipment can be assigned to projects/sites; key dates and condition are searchable; history is preserved.

### Phase 41 — Equipment utilization, fuel, maintenance and cost

**Dependencies:** Phases 15, 19, 40 and 48.  
**Scope:** Record equipment usage hours/days, operator if needed, fuel, routine service, repairs, breakdowns and project allocation. Surface upcoming service and downtime with simple lists. Link costs to project cost codes when appropriate.  
**Explicit exclusions:** No predictive maintenance AI, live fleet tracking or machine telemetry.  
**Exit gate:** Usage and cost reports reconcile to entries; maintenance reminders are not presented as verified work until completed.

### Phase 42 — Materials catalogue and specifications

**Dependencies:** Phases 16–19, 21 and 24.  
**Scope:** Create reusable material items with code, name, category, unit, specification/grade/brand, common pack size, preferred supplier references and optional images/documents. Support project-specific alternatives and clear unit conversions where mathematically valid. Keep an internal company catalogue independent of Marketplace listings.  
**Explicit exclusions:** No live supplier price scraper or assumption that marketplace product data is approved procurement data.  
**Exit gate:** Material item and UOM definitions are consistent across BOQ, requisitions, receipts, issues and costs; archival does not damage history.

### Phase 43 — Site stores, store locations and inventory ledger

**Dependencies:** Phases 06, 15–17, 19 and 42.  
**Scope:** Represent stores/warehouses and location-level stock. Use a movement ledger as the authoritative record of receipts, issues, transfers, returns, approved adjustments and opening balances. On-hand quantities are derived from posted movements or maintained transactionally with reconciliation controls. Model partial receipts and multiple sites/stores.  
**Explicit exclusions:** No editable on-hand number as the sole source of truth; no automatically moving stock from quotations or Marketplace clicks.  
**Exit gate:** Ledger balances reconcile to the movement history; company/store scope is secured; concurrent transactions do not silently create negative/inconsistent stock.

### Phase 44 — Stock issue, consumption, return, count and waste

**Dependencies:** Phases 15, 19, 29–30 and 42–43.  
**Scope:** Support issuing materials to a task/site/work package/crew, recording consumption or return, cycle counts, damaged/wasted stock, transfer and discrepancy approval. Differentiate ordered, received, accepted, issued, returned and consumed quantities. Capture simple reason codes and cost allocation.  
**Explicit exclusions:** No hidden stock change when a DPR is submitted; no unrestricted inventory adjustment by every user.  
**Exit gate:** Each movement has actor, date, quantity, unit, destination/source and source document; stock is not duplicated when a command is retried.

### Phase 45 — Material requisitions and procurement quote capture

**Dependencies:** Phases 15–16, 19, 21 and 42–44.  
**Scope:** Let site staff request materials with required-by date, project/site/store, cost code, requested quantity and reason. Reviewers approve/return; procurement can record supplier quotations manually, compare price/unit/lead time and select a vendor. Procurement can record supplier quotations received manually for ordinary procurement. When the separately entitled Marketplace sourcing workflow is enabled, Phases 57–59 provide managed in-app messages, RFQs and quote collection; both paths remain available.  
**Explicit exclusions:** No automatic PO creation from a catalogue listing, or stock movement from a requisition/quote. Managed Marketplace messaging/RFQs/quotes are added in Phases 57–59 and do not replace internal approval or PO creation.  
**Exit gate:** Approved requisitions trace to quote comparison and eventual PO; quantities/units and approvals validate; external Marketplace contact is clearly separate.

### Phase 46 — Purchase orders, commitments and receiving

**Dependencies:** Phases 15–16, 19, 42–45 and 48.  
**Scope:** Create approved purchase orders with line items, supplier, prices, currency, taxes/charges where applicable, delivery details and status. Receive items partially or fully through a goods-received record; record accepted/rejected/short quantities and link accepted stock to the inventory ledger. Track outstanding quantity and commitments until matched/closed.  
**Explicit exclusions:** No direct stock update from an unapproved PO or unverified supplier contact; no duplicate receipt from retry.  
**Exit gate:** PO, receipt, inventory movement, payable and committed-cost records are linked; partial receiving and discrepancy tests pass.

### Phase 47 — Site expenses, petty cash, advances and reimbursements

**Dependencies:** Phases 15, 17, 19 and 48–51.  
**Scope:** Make small everyday expense capture fast, including food/tea/snacks, local transport, unloading, tools, fuel and emergency purchases. Use date, amount, currency, category, project/site/cost code, paid-by, payment source, note and optional receipt photo. Support advances, settlement and approval, with a short mobile form and draft save.  
**Explicit exclusions:** No ten-step entry for small spends; no automatically approved expense because the amount is low unless the company explicitly configures a bounded rule.  
**Exit gate:** A common repeat-use expense is quick to draft; submitted/approved/paid states are distinct; one approved expense produces at most one posting.

### Phase 48 — Native double-entry accounting and posting engine

**Dependencies:** Phases 04, 06, 10–16 and the first operational financial workflows.  
**Scope:** Implement a reviewed chart of accounts, journal headers/lines, financial periods, debit-credit balance validation, source-document links, posting status, reversal entries and period locking in Supabase Cloud PostgreSQL. Put schema/functions/indexes/policies in committed migration files and apply through approved MCP `apply_migration`; financial posting commands must use controlled transactions/RPCs/Edge Functions and be idempotent. Test via a cloud development/isolated branch environment with synthetic records, reconcile via read-only queries and authorized API workflows, and do not use developer MCP privileges to bypass tenant checks. Keep accounting as FortSite's target system of record, with accounting-specialist review before financial production use.  
**Explicit exclusions:** No unbalanced journals, no direct edit/delete of posted journal lines, no silent posting from frontend multi-step inserts, and no assumption the software is formally compliant without review.  
**Exit gate:** Every posted journal balances; source and journal links are traceable; duplicate commands do not duplicate postings; reversal and period-lock tests pass.

### Phase 49 — Supplier invoices and accounts payable

**Dependencies:** Phases 15, 21, 46–48.  
**Scope:** Record supplier invoices against PO/receipts or approved non-PO expenses where policy allows. Track invoice lines, due date, taxes/charges, advances, credits, approved amount, payment status and project/cost-code allocations. Support partial matching and duplicate invoice warnings.  
**Explicit exclusions:** No unreviewed automatic 3-way matching assumptions; no double-paying an invoice; no supplier-marketplace transaction record inferred from a listing.  
**Exit gate:** Invoice totals and outstanding balance reconcile; invoice/receipt/PO relationships are validated; posting to accounts payable is idempotent.

### Phase 50 — Client billing, progress bills and accounts receivable

**Dependencies:** Phases 15, 25–27, 31 and 48.  
**Scope:** Prepare client bills from contract milestones, measured work or approved BOQ quantities, with retention/advance recovery/variations when applicable. Track submitted, approved, due, part-paid, paid, disputed and cancelled/reversed states. Link bills, receipts and accounting postings; retain previous bill revisions.  
**Explicit exclusions:** No automatically sending tax invoices or treating draft measurement as billable/approved; no silent rewrite of issued invoices.  
**Exit gate:** Billing math and outstanding balances are tested; approved quantities are sourced and traceable; corrections use revision, credit/reversal or adjustment procedures.

### Phase 51 — Cash, bank, payment allocation and reconciliation

**Dependencies:** Phases 15, 48–50.  
**Scope:** Record cash/bank accounts, receipts, payments, allocations against invoices/advances and bank-statement reconciliation. Support partial and combined payments with references and proof. Keep transaction currency explicit; surface unmatched or unreconciled items.  
**Explicit exclusions:** No access to bank credentials, no automatic bank feeds unless separately approved, and no mixing NPR/INR in a single misleading total.  
**Exit gate:** Payments allocate once; bank reconciliation differences are explainable; cash/bank balances trace to journals and source transactions.

### Phase 52 — Integrated budget, commitments, actual cost and simple forecast

**Dependencies:** Phases 22, 25–27, 37–51.  
**Scope:** Show budget versus approved changes, PO/subcontract commitments, actual posted costs and a transparent estimate-to-complete or cost-to-complete entry. Break down by project, site, work package and cost code. Indicate what is posted versus draft/committed and link every total to detail.  
**Explicit exclusions:** No AI prediction or Monte Carlo simulation; no combining unlike currencies or unposted records into a misleading actual-cost number.  
**Exit gate:** Budget/commitment/actual totals reconcile to source modules; forecast assumptions are visible; dashboard values drill down to records.

### Phase 53 — Nepal/India tax, invoice and document rules

**Dependencies:** Phases 13 and 48–51.  
**Scope:** Add country-configured invoice numbering/fields, tax configuration and export formats only after qualified local accounting/tax review. Store tax amounts and rules with each source transaction; retain historical values when settings change. Document which invoice types and rules the product actually supports for Nepal versus India.  
**Explicit exclusions:** No live connection to government billing endpoints in this phase; no claims of IRD/CBMS or Indian GST/IRP compliance without applicable technical approvals/testing; no hard-coded one-country tax assumptions reused in the other; no automatic legal advice. Live Nepal/India government connector work is deliberately deferred to final Phase 67.  
**Exit gate:** Country-specific sample scenarios are reviewed by qualified practitioners; invoice calculations and numbering tests pass; unsupported tax cases are clearly blocked or flagged.

### Phase 54 — Role dashboards, operational reports and safe exports

**Dependencies:** Relevant source phases 15–53.  
**Scope:** Provide practical prebuilt reports: project status, planned vs actual progress, DPR history, workforce attendance, material stock/usage, open requisitions/POs, equipment use, open issues/inspections, expenses, budget vs commitments vs actual, AP/AR and cash/bank reconciliation. Filters and totals must match source data. Exports obey the same permission scope as on-screen records.  
**Explicit exclusions:** No data warehouse, no-code BI builder or decorative KPIs that do not reconcile.  
**Exit gate:** Each report has a defined formula/source, access test and export test; totals match detail on representative data.

### Phase 55 — Project closeout, handover, warranties and defect liability

**Dependencies:** Phases 17, 20, 32–34, 38–39 and 54.  
**Scope:** Create a practical closeout checklist per building/project, with room/unit snag completion, final inspections, commissioning, as-built/document handover, warranty records, manuals, keys/asset handover and defect-liability dates/contacts. Track post-handover defects and responsibility within a simple record set.  
**Explicit exclusions:** No full property/facilities-management product, tenant service desk or property-owner CRM.  
**Exit gate:** A project can progress through closeout with incomplete items visible; handover package and outstanding defects are reportable; final documents retain their permissions and history.

### Phase 56 — Supplier Marketplace add-on: supplier profiles, product catalogue, account provisioning and moderation

**Dependencies:** Phases 05–12, 14, 16–17, 21 and 42–46.  
**Scope:** Build a separately entitled marketplace route and supplier panel. The first supplier-account credentials are created by an authorized Marketplace/Platform administrator from the responsible supplier-administration panel; additional supplier staff accounts, where supported, are created from the supplier's authorized user-management panel. Provision email + initial password through a trusted Cloud operation, never via email invitation or public self-registration. Suppliers maintain a public business profile, service areas, contact information and listings including name, category/type, brand/model, grade, weight/dimensions, specification, unit/pack, price, currency, MOQ, availability, last-updated date, product images and technical documents/certifications. Include search, useful filters, listing moderation, verification status, report/stale-listing handling and audit history. Publish only approved listings. Supplier records/listings and company vendor records remain distinct unless a user deliberately links them.  
**Explicit exclusions:** No user invitation emails or account-setup links; no marketplace payment processing, commission ledger, automatic order, automatic PO, payable or stock movement. Messaging and RFQ workflows are separate phases.  
**Exit gate:** Supplier users can only manage their own supplier profile/listings; credentials are provisioned by an authorized panel and not emailed; company users see published listings only; moderation is auditable; add-on entitlements are enforced; listing freshness and availability are visible.

### Phase 57 — Marketplace in-app messaging and conversation controls

**Dependencies:** Phases 06, 12, 17 and 56.  
**Scope:** Implement direct buyer-supplier conversations and context-linked conversations from a supplier listing or project/RFQ. Store durable message records, sender, participants, timestamp, read state, optional attachments, moderation/report/block controls and retention policy. Use Supabase Realtime only for live updates; message history remains database-backed. Give a user clear unread/read and failed-send/retry states. Keep each supplier conversation private to its participants and authorized company users.  
**Explicit exclusions:** No public group chat, cross-supplier shared threads, message content exposed through push payloads, or promise that a read receipt proves a human read the message.  
**Exit gate:** Participants see only authorized threads/messages/attachments; retries do not duplicate messages; blocked/reported accounts have defined behavior; thread permissions are tested from both buyer and supplier sides.

### Phase 58 — Managed RFQ creation, selected supplier recipients and deadlines

**Dependencies:** Phases 15–17, 21, 42, 45 and 56–57.  
**Scope:** Allow authorized company users to convert an internal material/procurement need into a managed Request for Quotation (RFQ). Select products/categories and recipients from already-provisioned supplier accounts, specify line items, quantity/unit, delivery location/date, scope/specifications, attachments, response deadline, terms and internal approval requirements. Issue the RFQ only to the selected supplier accounts through their in-app supplier workspace and eligible notification channels (in-app/mobile push); this is an RFQ workflow, not user-account invitation or email-based account setup. Suppliers receive the RFQ in their own panel, accept/decline or ask permitted clarifying questions, and respond within the RFQ. Track draft, awaiting approval, issued, response received, closed, cancelled and awarded/no-award states. Use stable IDs and timestamped status history. If the selected supplier does not have a provisioned account, show an actionable blocker and require account creation through the authorized supplier-administration panel before issuing the RFQ.  
**Explicit exclusions:** No user-invitation email/account setup; no automatic PO creation; no supplier inclusion without explicit recipient/visibility rules; no claim that marketplace pricing is a binding quote unless a supplier submits it as one; no bypassing existing company procurement approval thresholds.  
**Exit gate:** Only permitted company roles can issue RFQs; only already-provisioned selected supplier accounts can access their assigned RFQ and shared documents; no account is created through an RFQ; dates/status/deadlines work; closed/cancelled RFQs cannot accept silent edits.

### Phase 59 — Structured supplier quote submission, comparison and selection

**Dependencies:** Phases 25–27, 45–52, 56 and 58.  
**Scope:** Suppliers submit quote revisions with line-level unit, quantity, rate, taxes/charges as applicable, validity, lead time, delivery terms, exclusions, attachments and notes. Buyers can see each invited supplier's submission, compare normalized line-item values with visible assumptions, record evaluation notes, shortlist/reject/select with approver and reason, and preserve all quote revisions. Do not normalize unlike currencies into a single converted total; comparison must show currency and assumptions. Record selection/award outcome and link it to the internal requisition. A buyer explicitly creates a PO through the normal procurement phase when ready.  
**Explicit exclusions:** No auto-award, AI-selected supplier, hidden ranking formula, marketplace escrow/payment or automatic procurement posting.  
**Exit gate:** Suppliers cannot access competitors' quotes; buyer comparison totals reconcile to source lines; quote updates retain history; no quote creates a financial/stock ledger movement; the PO handoff is a deliberate authorized action.

### Phase 60 — Notification centre, delivery outbox and mobile push service

**Dependencies:** Phases 05–06, 15 and 57–59.  
**Scope:** Extend the notification centre into a durable Supabase Cloud notification service for message received, RFQ issued/updated/deadline approaching, quote received, RFQ status changed, approval needed and important project work. Create an idempotent event/outbox pattern and preferences by category, company membership and device. Send mobile push through Supabase Cloud Edge Functions and an approved push provider (initial recommendation: Expo Push Service with APNs/FCM behind it); deploy functions and configure secrets only through the connected MCP tools when available or another reviewed, explicitly approved Cloud control surface. Record tickets/receipts where the provider supports them, retry transient failures with backoff, deactivate invalid tokens and provide an in-app inbox fallback. Keep notification payloads minimal and never include quote pricing or sensitive message text in lock-screen payloads by default. No local Edge Function/Deno runtime is assumed.  
**Explicit exclusions:** No requirement that a user enable push, no guarantee of delivery if OS permissions/provider/device disallow it, no push provider secret in frontend code, and no use of push delivery as the audit source of truth.  
**Exit gate:** Authorized user receives the right event only; duplicates are idempotent; user preferences and revoked tokens are respected; provider errors/retries are observable; in-app notifications remain available when push fails.

### Phase 61 — React Native/Expo mobile companion app

**Dependencies:** Phases 02–05, 12, 14, 17, 23, 29–30, 35–36 and 56–60.  
**Scope:** Create a separate Android/iOS mobile app using React Native, Expo and TypeScript while retaining the React/Vite web app for administration, financial work and model review. Prioritize high-frequency mobile workflows: authentication/session handling, assigned projects/sites/tasks, DPR capture, photos/attachments, attendance/muster where authorized, material requests, issues/snags, Marketplace messages, RFQ responses/quote upload and push notification deep links. Reuse shared types/API contracts where appropriate and connect to the same Supabase Cloud project using environment-specific URL and publishable key values; enforce Supabase RLS just like the web app, securely store session material using platform-safe storage and maintain a clear offline/pending/upload-failed state for supported drafts. No local Supabase backend is used by mobile builds. Configure app identifiers, signing/build workflow and Android/iOS push credentials in documented environments.  
**Explicit exclusions:** No assumption that shadcn/ui/21st.dev web components work natively; no duplicate business logic trusted only on-device; no promise that every heavy finance/BIM action belongs on mobile; no unbounded offline replication of sensitive records.  
**Exit gate:** Android and iOS build from documented setup; login/session expiry, deep links, attachment upload/retry, role/scope checks and push registration pass; notification taps route to a record that is re-authorized server-side.

### Phase 62 — Drawing-based automated quantity takeoffs

**Dependencies:** Phases 17, 20, 22, 25, 31 and 42.  
**Scope:** Add a dedicated drawing workspace for PDF drawings and supported vector/CAD-derived inputs selected after a technical spike. Support sheet/page selection, scale calibration for raster/vector drawings, count/length/area measurements, measurement overlays, assembly/rule-based quantity extraction where geometry and symbols are machine-readable, grouping by drawing/level/zone/BOQ/work package and export of proposed takeoff lines. Persist source drawing revision, page, geometry/measurement, rule version, unit conversion, assumptions and reviewer in Supabase Cloud. Label machine-extracted, manually corrected and approved values separately. Any heavy processing must use a validated client Web Worker/WASM capability or an explicitly approved managed cloud compute path; it must not require a developer-installed local service or Docker. Allow a user to continue manual BOQ entry/import without this module.  
**Explicit exclusions:** No claim that arbitrary scanned drawings are perfectly understood; no silent BOQ/budget edits; no result becomes approved or billable until reviewed; no image recognition on ordinary site photos; no automatic takeoff based only on a marketing-grade model.  
**Exit gate:** A defined reference set of common building drawings is checked against independently measured quantities; discrepancies, unsupported symbols and calibration uncertainty are visible; results trace to source geometry and can be revised without losing history.

### Phase 63 — Automated rebar quantities and bar-bending schedules

**Dependencies:** Phases 16–17, 20, 22, 24–26, 31 and 62.  
**Scope:** Calculate reinforcement quantities and draft bar-bending schedules (BBS) from supported structured reinforcement input, approved drawings/schedules and/or supported model data. Record bar mark, diameter, shape, dimensions, count, cut length, hooks/bends, lap/anchorage allowances where specified, unit weight basis, total length and estimated weight; group by element, level/zone, pour or bar diameter. Keep standards/code factors and assumptions explicit and configurable only after qualified engineering review. Preserve drawing/model version, calculation/rule version, estimate vs verified status and engineer/estimator approval. Feed approved quantities to a new takeoff/BOQ revision only through an explicit action.  
**Explicit exclusions:** No unsupervised structural design, no inference of missing reinforcement design, no silent substitution of code rules, no claiming the schedule is safe for fabrication before qualified approval, and no automatic purchase order/stock movement.  
**Exit gate:** Test cases cover common slabs, beams, columns and footings, bar shapes, laps/hooks, unit conversions and rounding; results are compared to independently prepared schedules; unrecognized/incomplete input blocks final approval.

### Phase 64 — IFC model import, model viewer and revision management

**Dependencies:** Phases 17, 20, 22, 25 and 32.  
**Scope:** Add a separately enabled project-model workspace for supported IFC files. Upload/version models to private Supabase Storage; store project/discipline/author/date/revision and file hash; parse/render supported IFC geometry and properties using a suitable reviewed WebAssembly/Web Worker library in the client only if the performance/security spike proves it viable; no developer-local service is required. If heavy processing cannot run safely within client limits, choose an explicitly approved managed cloud compute path. Store model files and metadata in Supabase Cloud. Support model visibility, basic camera/navigation, element/property selection, floor/discipline filters, model revision comparison at a practical level and links from model elements to project areas, tasks, BOQ lines or issues where valid. Preserve the source model unmodified.  
**Explicit exclusions:** No full authoring-grade BIM editor, no native Revit replacement, no 4D/5D simulation, no requirement that ordinary projects upload IFC, no reliance on Supabase Edge Functions to process huge geometry payloads unless feasibility is proven.  
**Exit gate:** Supported sample IFCs render with validated coordinates/properties; unsupported/corrupt files fail safely; storage access is permissioned; memory/response performance is measured against agreed model-size limits; model revisions are auditable.

### Phase 65 — BIM/IFC clash detection and coordination workflow

**Dependencies:** Phases 17, 32–33 and 64.  
**Scope:** Run hard-clash and configured clearance/interference checks across supported IFC models/disciplines using an agreed tolerance/unit system. Create saved clash runs tied to exact model revisions and settings; group/triage results; create coordination issues with element references, viewpoints/snapshots, location/level, responsible discipline/person, due date, status, discussion, resolution evidence and re-test outcome. Allow filters/exclusions for approved known conditions. Give project teams a basic review/resolve/re-run loop; do not require BIM workflows for non-BIM jobs. Keep expensive geometry processing in the execution environment proven by a benchmark: client-side Web Worker/WASM is optional only when it meets model-size/performance requirements; otherwise use a specifically approved managed cloud compute option. Do not require a locally installed service or Docker runtime. Persist model metadata, results, issues and file assets in Supabase Cloud.  
**Explicit exclusions:** No automatic clash resolution, no guarantee every design conflict is detected, no specialist 4D/5D planning, no engineering approval based solely on clash status, and no automatic change to BOQ/contract/PO.  
**Exit gate:** Reference models produce expected positive and negative clash cases; tolerances/units are visible; every result can be reproduced against a model revision; issues follow normal permission/assignment workflow; large-model performance and limits are documented.

### Phase 66 — Complete end-to-end validation, restore drills, pilot and release readiness

**Dependencies:** Phases 01–65. Government production connectors remain disabled; use test adapters/fixtures.  
**Scope:** Consolidate security/usability evidence across all modules: tenant/RLS tests, platform boundary tests, Cloud Storage policies, Cloud Edge Function authorization/secret checks, Marketplace message/RFQ/quote privacy, push token and mobile permissions, quote-to-PO handoff, takeoff/BBS engineer review, IFC model access/clash reproducibility, migration/forward-repair rehearsal, Supabase Cloud backup/restore drills and restore into an isolated Cloud branch/project, performance tests on representative project/IFC data, accounting reconciliation and error monitoring. There is no local Supabase/Docker stack to reset or restore. All Cloud mutation and deployment steps require reviewed migration/deployment plans and explicit approval. Pilot with real building-project users in Nepal and India; migrate an agreed sample; train each role; record task-completion/friction/adoption evidence; resolve critical blockers. Use test/mock government connectors only to verify the tax-adapter contract, invoice payload preparation and failure states.  
**Explicit exclusions:** No live official government submission before Phase 67; no claiming final regulatory integration is complete; no release while cross-tenant access, data-loss, unbalanced journals, duplicate financial/stock postings, private quote leakage or unreproducible critical takeoff/clash errors remain open.  
**Exit gate:** Product owner signs release-readiness checklist; restore evidence and end-to-end reconciliation pass; pilot feedback is addressed; all critical/high-risk security and data-integrity findings are closed or explicitly blocking; test connector contracts are verified.

### Phase 67 — FINAL: Nepal IRD/CBMS and India IRP government billing integrations

**Dependencies:** Phases 09, 13, 48–54 and 66. This is the final numbered integration/launch phase. Product architecture, invoice/billing workflows, country profiles, test suite, security, pilot and release-readiness must already be complete.  
**Scope:** Coordinate with the relevant authority, approved integration route/provider and customer tax administrators. All production integrations execute against the Supabase Cloud backend; Edge Function secrets are configured in Cloud secret management through the supported approved tool/control path, never in local files or client variables. Production Cloud mutations and Edge Function deployments require explicit approval and a documented rollback/manual fallback. Confirm currently applicable technical documentation, eligibility/mandate, onboarding requirements, API credentials, sandbox/test endpoints, data fields, signature/QR/IRN requirements where applicable, cancellation/credit/debit note behavior, retries, rate limits, audit evidence, support escalation and production approval. Implement the Nepal-specific IRD/CBMS connector and India-specific GST e-invoice/IRP connector behind a common internal provider contract, with separate adapters, schemas, validation, credentials and observability. During company onboarding, validated legal registration country selects the matching Nepal or India compliance profile and UI; do not let the country be freely switched after regulated invoices exist. The Phase 67 live setup associates the company with the correct authority/provider route and securely links or provisions required government/provider credentials. Store secrets only in server-side encrypted storage; never log them or expose them to browser clients. Test with official sandbox/test credentials first; then run a limited, explicitly approved customer pilot; reconcile FortSite invoices to returned identifiers/status/QR/evidence; deploy production only when written approval/eligibility and a rollback/manual fallback are established.  
**Nepal path:** Validate the current IRD CBMS API technical document and the company's eligibility/permission for electronic billing. Treat API approval, taxpayer setup and current CBMS procedures as authority-confirmed prerequisites; do not assume one software approval automatically enables every taxpayer.  
**India path:** Confirm the taxpayer's GST/e-invoice applicability and the authorized access path. Do not assume there is one universal provider endpoint for all Indian companies: direct API integration, an IRP/provider's API-integrator route, or another permitted partner route must be selected and authorized for each supported arrangement. Separate taxpayer credentials from FortSite/provider credentials, follow the provider's onboarding and access authorization, and implement any required GSTIN-specific configuration.  
**Explicit exclusions:** No scraping of government portals, no bypass of MFA/OTP/authorization, no shared credentials across unrelated taxpayers, no false claim of government certification, no credentials stored in ordinary profile tables/plain text, and no automatic issuance while credentials/authorization/eligibility are uncertain. If official approval is delayed, keep the connector in disabled/pending status and provide the approved manual/export fallback; do not block the entire construction ERP.  
**Exit gate:** Current official requirements are documented with dates/contacts; provider/authority access is approved; sandbox test cases pass; security review confirms secret handling; duplicates/retries/cancellations/rejections/timeouts are covered; issued invoices reconcile to the authority's returned status and identifiers; customer-specific credentials are scoped and audited; written go-live authorization and rollback/manual fallback are recorded. No later numbered feature phase follows this integration phase.

## 8. Core workflow acceptance scenarios

- **Tenant isolation:** A user from Company A attempts to read/change Company B projects, files, subscription details, stock, accounting or Marketplace-private records. The request must fail at the database/server boundary, not merely hide the UI.
- **Super Admin onboarding:** Platform Owner creates a company, selects country/defaults and a plan intent, provisions the first Company Admin email + initial password from the Super Admin panel without an invitation email, records trial intent, activates it when eligible and can see the full audit trail. The Company Admin cannot open `/platform/*` or mutate subscription controls. Initial company-user credentials are created by authorized panels, not emailed invitation links.
- **Subscription eligibility:** A suspended/expired tenant cannot continue protected operational mutations, but the user sees a clear status/explanation and any deliberately permitted billing/contact route remains available.
- **Daily site workflow:** Site Supervisor opens assigned site, views tasks, drafts a DPR with quantities and photos, marks attendance, creates a material request and records a small expense. Each record is visible in the correct review queue.
- **Material procurement:** Approved request -> manual supplier quotation comparison -> approved PO -> partial goods receipt -> accepted stock movement -> supplier invoice -> payable. Outstanding quantity, commitment and stock balance reconcile throughout.
- **Inventory traceability:** A storekeeper issues materials to a work package, returns unused stock and records a damaged quantity. On-hand is explainable from movement history; retrying a request never duplicates stock movements.
- **Progress to client bill:** A measured quantity is prepared, checked and accepted; project progress updates from accepted quantities; an approved client bill references only supported billable quantities and produces a traceable receivable.
- **Subcontractor settlement:** An approved subcontractor measurement/claim calculates agreed value/deductions/retention, posts once, becomes payable and tracks partial payment without changing prior approved history.
- **Accounting integrity:** Every posting has equal debits and credits; source document and journal are linked; posted documents cannot be silently edited; reversals retain history; period lock prevents unauthorized back-posting.
- **Field connectivity failure:** A site user loses connectivity while drafting a DPR/expense, closes/reopens the app, retries upload and resolves conflict if necessary. Pending drafts never show as approved or posted.
- **Marketplace messaging/RFQ/quote privacy:** A buyer messages a supplier, issues an RFQ to selected suppliers, receives supplier-specific quote revisions and compares them internally. A supplier cannot see competing suppliers or unrelated company projects. Message/quote retries do not duplicate records; push failure leaves a durable in-app notification; a selected quote never creates a PO/payable/stock movement without an explicit authorized procurement action.
- **Automated takeoff and BBS review:** A drawing is versioned; calibrated/model-derived takeoff outputs link to source locations and assumptions; a qualified reviewer approves/rejects/edits results; only explicitly approved quantities can become a BOQ revision or downstream billable measure. Rebar schedule test cases reconcile to independently prepared reference calculations.
- **IFC clash review:** A clash run records exact IFC model revisions, tolerances and supported units; expected clashes are found and known non-clashes remain absent; results become permissioned project issues; re-running after a model revision retains historic run results.
- **Country billing routing:** On company onboarding, legal registration jurisdiction selects Nepal or India tax/compliance profile and settings. Production official connectors remain disabled until final Phase 67 approval; a company cannot bypass the country-specific route by editing client state.
- **Closeout:** A project can identify open inspections/snags, outstanding documents, commissioning status, warranty details and defect-liability dates before handover. Unfinished items remain visible and assigned.

## 9. Data-domain boundary map

| Domain | Principal records | Source-of-truth rule |
|---|---|---|
| Platform | Platform owners, companies, plans, subscriptions, subscription payments/adjustments, platform audit, support | Platform Owner manages tenant lifecycle and licence status; company users cannot modify platform records. |
| Identity/access | Auth users, profiles, panel-provisioning events, memberships, role assignments, project/site scope | Auth user is not automatically a company member; credentials are created by the responsible panel; assignment is not permission. |
| Projects/buildings | Projects, sites, blocks, floors, units, rooms/zones, contacts, WBS, tasks, schedule | Operational hierarchy links to a valid company/project and is versioned where baseline matters. |
| Scope/commercial | Rate library, BOQ revisions, estimates, budgets, contracts, variations, measurements | Approved revisions are preserved; changes affect baseline only after approval. |
| Field execution | DPRs, media, progress records, issues, inspections, safety, workforce, attendance | Field evidence is traceable; accepted/verified records are distinct from drafts. |
| Inventory/procurement | Materials, stores, inventory movements, requisitions, quotes, POs, goods receipts, issues/returns | Stock ledger movements are authoritative; PO/receipt/invoice/payment linkages are explicit. |
| Finance | Accounts, periods, journals, supplier invoices, client bills, receipts/payments, reconciliations | Journal lines balance; source records post atomically/idempotently; no silent mutation after posting. |
| Marketplace add-on | Supplier profiles/listings/media, moderation, message threads/messages, RFQs/selected supplier recipients, quote revisions/comparisons, notification outbox | Add-on records are tenant- and participant-scoped. Only provisioned supplier accounts see their assigned RFQs and their own quotes; buyer quotes are confidential. No account creation by RFQ and no automatic PO/payment/stock effects. |
| Mobile notifications | Notification events, inbox items, device tokens, preferences, delivery attempts/receipts | Supabase records remain authoritative; push is best effort and carries minimal sensitive content. |
| Automated construction quantities | Drawing revisions, calibration, measurement geometry, takeoff runs/lines, rebar schedules and review events | Every result traces to source drawing/model and calculation version; only approved results feed formal BOQ/billing. |
| BIM/IFC coordination | IFC model files/versions, element metadata, clash runs/results, coordination issues | Source model is immutable and versioned; results tie to model revisions/tolerances; access follows project permissions. |
| Government billing adapters | Jurisdiction profiles, provider configuration, credential references, submissions, identifiers/status/reconciliation events | Country-specific adapters are separate; secrets are server-only; official connection is enabled only after Phase 67 approval.

## 10. Practical implementation order

1. **Make the foundation boring and trustworthy:** Phases 01–17. Do not race toward dashboards or finance screens before tenancy, RLS, authorization, migrations, tokens and document access are proven.
2. **Make a project usable:** Phases 18–34. A real building team should be able to set up a project, plan work, record daily progress, measure quantities and close quality/safety issues.
3. **Control people, suppliers, stock and equipment:** Phases 35–47. Prove real receiving/issue/cost workflows before treating inventory as an on-hand number.
4. **Introduce financial system-of-record behavior deliberately:** Phases 48–53. Financial postings need accounting review, idempotency tests and country-specific validation—not just attractive tables.
5. **Finish core reporting and handover:** Phases 54–55.
6. **Deliver optional advanced sourcing and technical tools:** Phases 56–65. Marketplace messaging/RFQ/quotes are a separately entitled add-on; mobile apps handle push and high-frequency field flows; takeoff/rebar and IFC/clash are opt-in specialist modules with engineer-review gates.
7. **Prove readiness before regulatory live connections:** Phase 66 completes the full test, restore, security and pilot gate using test adapters. Phase 67 is deliberately last and covers the country-specific government-authority/provider integration and controlled go-live.

## 11. Change control and scope discipline

- Each phase is implemented and reviewed separately. Do not bundle several phases into one giant AI coding prompt.
- Before writing code for a phase, inspect the relevant files and the actual Supabase Cloud migration/schema state through read-only project-scoped MCP tools, summarize the intended change and identify security/data risks. Never assume an older conversation or plan proves current state. No local Supabase runtime exists.
- If a prerequisite is missing, stop the dependent implementation and report the blocker; do not create a shortcut that weakens tenant isolation or data integrity.
- A request to add a feature must specify target user, field problem, frequency, data owner, dependency, UX impact, security scope, acceptance tests and whether it is core or add-on.
- No “future” feature gets a placeholder nav item, schema or marketing promise merely because a competitor has it.
- Any request to remove/replace cloud data or configuration requires a separately approved target/environment check, backup/recovery plan and rollback/forward-repair plan. “Start from scratch” in this roadmap does not authorize resetting or deleting the remote Supabase project. Prefer reversible migrations and data-preserving changes.

## 12. Official technical references

- React versions and current React documentation: https://react.dev/versions
- Vite guide and React TypeScript template support: https://vite.dev/guide/
- Tailwind CSS setup with Vite: https://tailwindcss.com/docs/installation/using-vite
- 21st.dev MCP usage, component search/install and Cursor support: https://docs.21st.dev/mcp
- Supabase Auth quickstart with React: https://supabase.com/docs/guides/auth/quickstarts/react
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase MCP server tools, project scoping, migrations and safety recommendations: https://supabase.com/docs/guides/ai-tools/mcp
- Supabase MCP production/branching workflow: https://supabase.com/docs/guides/ai-tools/mcp#recommendations
- Supabase database migration concepts (CLI/local examples are not used for FortSite operations): https://supabase.com/docs/guides/local-development/database-migrations
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Nepal IRD CBMS API technical document for software developers: https://ird.gov.np/content/9052/cbmsapitechnicaldocumentfor/
- Nepal IRD electronic invoicing procedure (CBMS terminology/background): https://www.ird.gov.np/public/pdf/1491134985.pdf
- India IRIS IRP API integration guidance: https://einvoice6.gst.gov.in/content/api-integration/
- India IRIS IRP API integrator registration: https://einvoice6.gst.gov.in/content/kb/registration/
- India IRP onboarding APIs and taxpayer credential authorization: https://einvoice6.gst.gov.in/content/onboarding-apis-wiki/
- Expo Push Notifications overview (APNs/FCM intermediary): https://docs.expo.dev/push-notifications/overview/
- Expo Push service delivery/retry guidance: https://docs.expo.dev/push-notifications/sending-notifications/

These references support stack and integration planning; they do not certify FortSite’s security, accounting, engineering output or local regulatory compliance. Nepal IRD documentation found during planning includes a CBMS API technical-document page, and India IRIS IRP documentation describes API-integrator and taxpayer-onboarding paths. These must be reconfirmed with the relevant authority/provider when Phase 67 begins; provider choices, eligibility, payloads, credentials and rules can change. Expo documents that push delivery passes through provider systems and can fail, so the durable Supabase inbox/outbox and retry handling remain mandatory.

**Final baseline V5 (Cloud/MCP + panel-managed credentials):** Build FortSite from Phase 01 in dependency order. The Cloud operating model applies to every phase from Phase 04 through Phase 67, including all schemas, RLS, Storage, Auth settings, Edge Functions, Realtime and cloud environment changes. From Phase 04 onward, all Supabase backend resources target the named Supabase Cloud project via the connected Supabase MCP plugin; no local Docker/Supabase/PostgreSQL runtime is used. Every schema change is committed as a reviewed migration before an approved MCP `apply_migration` operation, and all cloud state is verified afterward. The React build/test toolchain may run in the Cursor workspace; this is not a local backend. The production SPA hosting provider remains an explicit future decision. The Super Admin is the highest platform authority for company onboarding and subscriptions. User accounts are provisioned by the responsible panel with email + initial password; no account invitation emails or acceptance links are used (the first Platform Owner is bootstrapped once through Supabase Cloud Add user before the panel exists). Company roles remain separated and scoped. Construction operations, stock and accounting need reliable data boundaries. Supplier Marketplace is a separate optional add-on with messaging, managed RFQs, quote collection and mobile push notifications, but it never auto-creates a purchase order or payment. Automated takeoffs, rebar schedules and IFC clash detection are specialist opt-in modules with source traceability and qualified review. Country-specific live government billing connectors are the final Phase 67 after all other modules and general release tests have passed. Usability, security, engineering traceability and data integrity outrank feature count.



## 13. Account provisioning policy update (V5)

This is the controlling account-creation decision and supersedes conflicting invitation-based wording in any earlier prompt or note.

- **Responsible panel provisions every normal account:** create the login email and initial password through the authorized panel for the role—Super Admin for the first Company Admin (Phase 09), Company Admin for company staff (Phase 12), and authorized supplier/Marketplace administration for supplier accounts (Phase 56). Use a trusted Cloud operation with `supabase.auth.admin.createUser`; do not use user-invitation emails, links, acceptance routes/tokens, invitation tables or public self-registration. RFQs (Phase 58) may target only already-provisioned suppliers and never create accounts.
- **Credential and access safety:** no password is emailed, saved in app tables/profile, logged or placed in URLs/local storage. Show the initial/temporary password once to the authorized creating operator for private out-of-band handoff, require a first-login password change before ordinary data access, and reset by issuing a new temporary password. An operator must attest that an email belongs to the intended person before a trusted operation marks it confirmed; duplicate emails fail safely rather than resetting or linking an existing account.
- **Trusted execution:** Auth Admin credentials remain in Supabase Cloud secrets. Every provisioning/reset function authenticates the caller and checks role, company/supplier scope and idempotency server-side; frontend state, user metadata, email domain and request payloads are not authority.
- **One-time first-owner bootstrap exception:** the first Platform Owner must exist before the Super Admin panel does. Create that identity/password through Supabase Cloud Dashboard Authentication > Users > **Add user** (never **Send invitation**), then use a separate reviewed authority-binding operation. All later ordinary accounts are created through their responsible FortSite panel.
- **Recovery and legacy artifacts:** approved password-recovery email for an existing account is not onboarding and cannot create membership/roles. If older invitation objects/routes exist, inspect read-only, disable their account-creation path and remove them only through a separately reviewed, explicitly approved, data-preserving migration.
