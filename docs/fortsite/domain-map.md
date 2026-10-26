# FortSite domain map

**Status:** Planning map. No table, route, bucket, or policy exists.  
**Phase:** 01. **NOT STARTED.**  
**Rule:** every in-scope feature has one primary phase. Out-of-scope items have no phase and no navigation placeholder.

Primary phase means the phase that delivers the feature. Dependencies are prerequisites, not second owners. A feature is not available in the product until its primary phase is verified complete.

## Data domains

| Domain | Principal records, when built | Source-of-truth rule | Primary phases |
|---|---|---|---|
| Platform | Platform owners, companies, plans, subscriptions, subscription payments and adjustments, platform audit, support notes | Platform Owner manages tenant lifecycle and licence status. Company users cannot modify platform records. | 07–11 |
| Identity and access | Auth users, profiles, memberships, invitations, role assignments, project and site scope | An Auth user is not automatically a company member. Assignment is not permission. | 05–07, 12 |
| Projects and buildings | Projects, sites, blocks, floors, units, rooms and zones, contacts, work breakdown, tasks, schedule | Hierarchy links to a valid company and project. Baselines are versioned. | 19–23, 28 |
| Scope and commercial | Rate library, BOQ revisions, estimates, budgets, contracts, variations, measurements | Approved revisions are preserved. Baseline changes require approval. | 24–27, 31 |
| Field execution | Daily reports, media, progress, issues, inspections, safety, workforce, attendance | Evidence is traceable. Accepted records stay distinct from drafts. | 29–36 |
| Inventory and procurement | Materials, stores, movements, requisitions, manual quotes, purchase orders, goods receipts, issues and returns | The stock ledger is authoritative. PO, receipt, invoice, and payment links are explicit. | 42–47 |
| Finance | Accounts, periods, journals, supplier invoices, client bills, receipts, payments, reconciliations, tax snapshots | Journals balance. Source records post atomically and idempotently. Posted rows are not silently changed. | 48–53 |
| Marketplace add-on | Supplier profiles, listings, media, moderation, threads, messages, RFQs, invitations, quote revisions, comparisons | Tenant- and participant-scoped. Suppliers see only their own invitations and quotes. No automatic PO, payment, or stock effect. | 56–59 |
| Mobile notifications | Events, inbox items, device tokens, preferences, delivery attempts and receipts | Supabase records are authoritative. Push is best effort and carries minimal content. | 15, 60, 61 |
| Automated quantities | Drawing revisions, calibration, measurement geometry, takeoff runs and lines, rebar schedules, review events | Every result traces to a source revision and a calculation version. Only approved results may feed a formal BOQ. | 62–63 |
| BIM and IFC | IFC files and versions, element metadata, clash runs and results, coordination issues | The source model is immutable and versioned. Results tie to revisions, tolerances, and units. Access follows project permissions. | 64–65 |
| Government billing adapters | Jurisdiction profiles, provider configuration, credential references, submissions, returned identifiers, status, reconciliation events | Country adapters are separate. Secrets are server-only. Official connection is enabled only after Phase 67 approval. | 09, 13, 53, 66, 67 |

## Future route zones

These are planned URL zones for later phases. They are not implemented, and they must not be added as empty links before the phase that builds them.

| Zone | Planned pattern | Who may enter, once built | Phase |
|---|---|---|---|
| Platform | `/platform/*` | Platform Owner, and a restricted platform operator only if that role is later created | 08 |
| Company workspace | `/app/:companyId/*` | A verified member of that company, inside role and project/site scope | 14 |
| Supplier marketplace | A separate entitled supplier and buyer marketplace zone. The exact path is chosen in Phase 56, not here. | Supplier users for their own supplier account. Buyer users of an entitled company, inside explicit grants. | 56 |
| Mobile deep link | An app link that opens a record only after a server authorization check | The signed-in user who is allowed to read that record | 61 |

Company context comes from verified membership, not from a client-supplied company id alone.

## Feature-to-phase map

### Foundations

| Feature | Class | Primary phase | Prerequisites |
|---|---|---|---|
| Product charter, workflows, architecture, domain map, acceptance catalogue, risk register, phase status | Core documentation | 01 | None |
| React 19, Vite, TypeScript, React Router, Tailwind, shadcn/ui, lint, unit tests, production build, environment validation | Core platform | 02 | 01 |
| Construction design tokens and 21st.dev component governance | Core platform | 03 | 02 |
| Supabase local workflow, migration pipeline, public client configuration, secret separation | Core platform | 04 | 01–02 |
| Auth login, logout, password reset, invitation acceptance, session restoration | Core platform | 05 | 02, 04 |
| Company tenant, membership, invitation, tenant-safe keys, RLS foundations | Core platform | 06 | 04–05 |
| Platform Owner boundary and controlled bootstrap | Core platform | 07 | 04–06 |
| Platform shell and overview metrics from real records | Core platform | 08 | 02–03, 07 |
| Company onboarding, legal country, lifecycle, first Company Admin, compliance-profile shell | Core platform | 09 | 06–08 |
| Plans, entitlements, manual subscription payment records | Core platform | 10 | 07–09 |
| Platform audit, platform settings, support notes | Core platform | 11 | 07–10 |
| Five company roles, project and site scope, permission matrix | Core platform | 12 | 05–07, 09 |
| Company first-run setup and country-locked settings | Core platform | 13 | 06, 09, 12 |
| Company shell and role home screens | Core platform | 14 | 03, 05, 06, 12, 13 |
| Shared approvals, in-app notifications, company activity history | Core platform | 15 | 06, 11–14 |
| Units, categories, cost codes, tax labels, payment methods, document sequences | Core platform | 16 | 06, 12–13 |
| Private documents, drawings, photos, attachments | Core platform | 17 | 04, 06, 12, 14 |
| Validated spreadsheet import and scoped export | Core platform | 18 | 12–17 |

### Project delivery

| Feature | Class | Primary phase | Prerequisites |
|---|---|---|---|
| Projects, sites, portfolio, lifecycle | Core | 19 | 06, 12–16 |
| Optional block, floor, unit, room, zone, and work-area hierarchy | Core | 20 | 19 |
| Clients, consultants, vendors, lightweight proposals | Core | 21 | 13, 16–19 |
| Work breakdown, work packages, project cost codes | Core | 22 | 16, 19–20 |
| Task assignment and work queue | Core | 23 | 14–16, 19–22 |
| Rate library with historical snapshots | Core | 24 | 16, 19, 22 |
| BOQ, estimates, revision compare, manual import | Core | 25 | 16, 18, 22, 24 |
| Approved budget baseline and revisions | Core | 26 | 15, 22, 24–25 |
| Contracts, work orders, variations, change orders | Core | 27 | 15, 19, 22, 25–26 |
| Practical schedule and weekly look-ahead | Core | 28 | 22–23, 25–27 |
| Mobile-web field workspace and bounded offline drafts | Core | 29 | 03–05, 14–17, 19, 23 |
| Daily progress report and site diary | Core | 30 | 15, 17, 19, 23, 28–29 |
| Measured quantities and progress against BOQ | Core | 31 | 15, 17, 22, 25, 28–30 |
| Issues, delays, snags, corrective actions | Core | 32 | 17, 19–20, 23, 29–31 |
| Quality inspections, testing, commissioning checklists | Core | 33 | 17, 19–20, 29–32 |
| Safety and permit register | Core | 34 | 17, 19, 23, 29 |

### People, stock, and equipment

| Feature | Class | Primary phase | Prerequisites |
|---|---|---|---|
| Employees, workers, crews | Core | 35 | 12–16, 19 |
| Attendance, muster, shifts, overtime | Core | 36 | 15, 19, 29, 35 |
| Labour cost, wages, advances, allowances | Core | 37 | 16, 19, 35–36, 48 |
| Subcontractor agreements and work orders | Core | 38 | 15–17, 19, 22, 27 |
| Subcontractor measurements, claims, settlements | Core | 39 | 15, 27, 38, 48–50 |
| Equipment and vehicle register | Core | 40 | 16, 19, 21 |
| Equipment use, fuel, maintenance, cost | Core | 41 | 15, 19, 40, 48 |
| Materials catalogue and specifications | Core | 42 | 16–19, 21, 24 |
| Stores, locations, inventory ledger | Core | 43 | 06, 15–17, 19, 42 |
| Issue, consumption, return, count, waste | Core | 44 | 15, 19, 29–30, 42–43 |
| Material requisitions and manual quote capture | Core | 45 | 15–16, 19, 21, 42–44 |
| Purchase orders, commitments, receiving | Core | 46 | 15–16, 19, 42–45, 48 |
| Site expenses, petty cash, advances, reimbursements | Core | 47 | 15, 17, 19, 48–51 |

### Finance, tax data, reporting, handover

| Feature | Class | Primary phase | Prerequisites |
|---|---|---|---|
| Double-entry chart, journals, periods, posting, reversal | Core | 48 | 04, 06, 10–16, and the first operational financial workflows |
| Supplier invoices and accounts payable | Core | 49 | 15, 21, 46–48 |
| Client bills, progress bills, accounts receivable | Core | 50 | 15, 25–27, 31, 48 |
| Cash, bank, allocation, reconciliation | Core | 51 | 15, 48–50 |
| Budget, commitment, actual, simple forecast | Core | 52 | 22, 25–27, 37–51 |
| Nepal and India invoice fields, tax configuration, document rules, no live government calls | Core country rules | 53 | 13, 48–51 |
| Role dashboards, operational reports, safe exports | Core | 54 | Relevant phases 15–53 |
| Closeout, handover, warranties, defect liability | Core | 55 | 17, 20, 32–34, 38–39, 54 |

### Marketplace, mobile, and specialist modules

| Feature | Class | Primary phase | Prerequisites |
|---|---|---|---|
| Supplier profiles, listings, moderation | Separately entitled add-on | 56 | 05–12, 14, 16–17, 21, 42–46 |
| Buyer–supplier in-app messaging | Separately entitled add-on | 57 | 06, 12, 17, 56 |
| Managed RFQ, invitations, deadlines | Separately entitled add-on | 58 | 15–17, 21, 42, 45, 56–57 |
| Supplier quote revisions, comparison, authorized selection, explicit PO handoff | Separately entitled add-on | 59 | 25–27, 45–52, 56, 58 |
| Notification centre, outbox, mobile push service | Core plus add-on events | 60 | 05–06, 15, 57–59 |
| React Native and Expo companion app | Separate mobile app | 61 | 02–05, 12, 14, 17, 23, 29–30, 35–36, 56–60 |
| Drawing-based automated quantity takeoff | Specialist opt-in | 62 | 17, 20, 22, 25, 31, 42 |
| Automated rebar quantities and bar-bending schedules | Specialist opt-in | 63 | 16–17, 20, 22, 24–26, 31, 62 |
| IFC import, viewer, revision management | Specialist opt-in | 64 | 17, 20, 22, 25, 32 |
| IFC clash detection and coordination issues | Specialist opt-in | 65 | 17, 32–33, 64 |
| End-to-end, security, restore, pilot, and test-adapter release gate | Release gate | 66 | 01–65. Production government connectors remain disabled. |
| Nepal IRD/CBMS and India GST e-invoice/IRP live connectors | Final regulatory phase | 67 | 09, 13, 48–54, 66. Live use also requires authority or provider approval and customer eligibility and credentials. |

Phase 60 is the primary home of the durable outbox and push service. Phase 15 remains the primary home of the first in-app approval notifications. Phase 61 is the primary home of the native app and deep links. Those three are not duplicate features.

Phase 45 remains the primary home of internal requisitions and manually recorded quotations. Phases 58 and 59 add the entitled marketplace path. They do not replace Phase 45 or Phase 46.

Phase 25 remains the primary home of the BOQ. Phases 62 and 63 may feed a new revision only by an explicit action after approval.

## Workflow ownership

These cross-document flows have no extra phase of their own.

| Flow | Steps | Owning phases |
|---|---|---|
| Marketplace commercial path | Discover supplier, then message. Internal material need, then RFQ approval, then invite suppliers, then supplier-specific responses, then structured comparison, then authorized selection, then an explicit normal procurement purchase order. | 45, 46, 56–59 |
| Engineering traceability | Drawing or model revision, then measurement or rebar calculation, then draft results with rules, units, and assumptions, then engineer review and correction, then approved version, then an optional explicit BOQ revision. | 17, 25, 62–63 |
| Country routing | Legal jurisdiction creates a Nepal or India profile. Separate adapters. Live calls only in Phase 67, after Phase 66. | 09, 13, 53, 66, 67 |

No in-scope feature is left without a primary phase. No out-of-scope item below is given a phase.

## Explicitly out of scope

No navigation item, schema, or marketing promise:

- GIS and chainage surveying.
- Monte Carlo risk modelling, 4D/5D simulation, and resource-optimization solvers.
- AI-first workflows, AI-generated daily reports, AI pricing, AI supplier selection, and predictive maintenance.
- Carbon and ESG accounting.
- Roads, hydropower, industrial EPC, quarry, and ready-mix production.
- Face recognition, biometric attendance, default geofencing, IoT, and telematics.
- Full statutory payroll, withholding, and social-security engines.
- Full facilities management, tenant service desk, and property-owner CRM.
- Real-estate buyer CRM, installment sales, and marketing automation.
- Marketplace payment processing, commissions, escrow, automatic award, automatic purchase order, automatic payable, and automatic stock movement.
- A universal no-code workflow engine, a custom form or database designer, a data warehouse, and a no-code BI builder.
- A full legal contract-drafting suite.
- Electronic signature, unless a future business decision adds it. It has no phase now.
- Payment-card storage and subscription payment gateways. Manual subscription records are Phase 10. A gateway has no phase.
- Bank logins and automatic bank feeds, unless a future decision adds them. They have no phase.
- An end-to-end subcontractor portal, unless a future decision adds it. It has no phase.
- Public self-service creation of companies or Platform Owners.
- Government-portal scraping, MFA or OTP bypass, and shared taxpayer credentials.
- Any claim of IRD, CBMS, GST, or IRP certification before Phase 67 exit criteria are met with real approval. The certification claim itself is never a feature phase.
- Image recognition on ordinary site photos, and unsupervised structural design.

## Orphan check

Every phase from 01 through 67 appears once as a primary owner in the tables above. Specialist and add-on phases are classified and are not core navigation. Phase 67 is the last numbered phase. Nothing in this map is implemented.
