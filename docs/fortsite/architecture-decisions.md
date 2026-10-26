# FortSite architecture decisions

**Status:** Decisions for later phases. Nothing in this document is built.  
**Phase:** 01. **NOT STARTED.**  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V3.md`](../../FortSite_Fresh_Start_Master_Roadmap_V3.md).

A decision labelled **Decided** is the rule later phases must follow. A decision labelled **Unresolved** has no answer in this phase. Do not invent one.

## Designated Supabase target

| Item | Value |
|---|---|
| Organization name | `FortSite - 2Merged` |
| Project name | `FortSite - 2Merged` |

These are the human-readable organization and project names for every later FortSite phase. They are not a project ref, an organization ID, a URL, an API key, a database password, or proof that a remote project has been linked. Phase 01 does not sign in, link, inspect, configure, or mutate that organization or project. Technical identifiers are obtained from the Supabase dashboard only when a later phase explicitly requires them.

## Decided

### ADR-001 — Web application stack

**Decision.** The web application is React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, and React Router.

**Consequences.** Strict TypeScript. Feature-oriented code. Typed routes. No unchecked `any` as a habit. Current stable package versions are rechecked when Phase 02 starts. The lockfile is committed in that phase, not in this one.

### ADR-002 — 21st.dev is a source of reviewable UI code

**Decision.** The 21st.dev MCP/plugin in Cursor may be used to find and install UI component code. It is not a backend, a runtime dependency, or a source of truth for auth, data, or business rules. Installed source is reviewed for dependencies, license, and accessibility, adapted to FortSite tokens, tested, and owned in the repository. Prefer a local shadcn component before adding a duplicate.

**Consequences.** Web components from shadcn/ui or 21st.dev are not assumed to run in React Native.

### ADR-003 — Separate mobile companion

**Decision.** Field workflows and push notifications use a separate application built with React Native, Expo, and TypeScript. The web application remains the place for administration, financial work, and model review. Domain types and API contracts may be shared. UI libraries may not. On-device logic is not a second source of business rules. Session material uses platform-safe storage. RLS applies to the mobile client the same way it applies to the web client.

**Consequences.** Phase 61 builds the mobile app. Phase 29 may still optimize the mobile web field workspace. Neither phase is started. The mobile app does not promise a complete offline ERP.

### ADR-004 — Supabase is the backend and the source of truth

**Decision.** Supabase supplies PostgreSQL, Auth, Storage, Edge Functions, and selective Realtime. There is no custom application server by default. Schema history is SQL migration files applied in order. Seed data is for development. Undocumented edits on a live database are not allowed. Development, staging, and production credentials stay separate.

The browser uses the Supabase API with the public project URL and the publishable or anon key only. The browser does not connect to PostgreSQL and does not receive a database password. Pooled connections are for server-side or other direct database clients that need them.

**Consequences.** Phase 04 establishes the local workflow and the pipeline. Later schema phases add migrations. This phase adds neither a migration nor a remote link.

### ADR-005 — RLS and server-side checks are the security boundary

**Decision.** Every exposed tenant table has RLS and grants, reviewed against the real query paths. Storage objects are permissioned the same way. Privileged operations run in PostgreSQL functions or Edge Functions that check the caller. Frontend route guards improve navigation only. A hidden menu item is not authorization. Subscription entitlement is read from trusted server or database state. JWT or UI state alone cannot make a company active.

Company-owned private records carry `company_id`. Project and site scope are added where the domain needs them. Cross-table tenant consistency is enforced by database constraints or functions. A browser-supplied id is not trusted by itself. Broad `USING (true)` policies are not used on private records.

**Consequences.** A frontend-only test does not prove tenant isolation. Negative tests cover other companies, other projects, and other sites.

### ADR-006 — Notifications are durable; push is best effort

**Decision.** Supabase stores notification events, the inbox, and the delivery outbox. Those records are the source of truth. Push delivery uses an approved provider, with APNs and FCM behind it for iOS and Android. The initial recommendation to evaluate in Phase 60 is Expo Push Service. That recommendation is not a vendor award. See Unresolved.

Delivery attempts and provider receipts are stored where the provider supports them. Transient failures retry with backoff. Invalid tokens are deactivated. The in-app inbox remains when push fails. Realtime may refresh an open queue. It is not a substitute for authorization or for a reliable read.

Payloads contain the minimum text needed to open the right place. They do not include quote prices or message bodies. A deep link re-authorizes through the app. Push delivery status is not the audit record.

**Consequences.** Phases 15, 60, and 61 implement this. None is started.

### ADR-007 — Secrets stay off the client

**Decision.** Service-role keys, direct database passwords, webhook secrets, payment-provider secrets, push-provider secrets, and government or IRD/IRP credentials never appear in browser code, `VITE_*` variables, built assets, logs, or ordinary profile rows. Privileged calls use server-side secrets. Government secrets, when they exist in Phase 67, use server-side encrypted storage and are scoped to the customer they belong to.

**Consequences.** Phase 04 must show that built assets contain no such secret. This phase introduces no secret and no environment file.

### ADR-008 — Heavy geometry waits for a spike

**Decision.** The execution environment for IFC and drawing processing is chosen only after a performance and accuracy spike on representative model sizes. Do not run heavyweight geometry processing in Supabase Edge Functions unless that spike shows it is feasible. The initial place to test IFC parsing and rendering is the browser, using a reviewed WebAssembly or Web Worker library. Clash detection uses the environment the benchmark proves, initially a Web Worker or WASM path, or a specifically approved compute option. Supabase stores the immutable source file, metadata, results, and issues. It is not assumed to be the geometry engine.

**Consequences.** Phases 62–65 cannot claim a runtime until the spike records evidence. Supported formats, IFC versions, and size ceilings remain unresolved.

### ADR-009 — One internal tax contract, two country adapters, live calls last

**Decision.** FortSite uses a shared internal contract for tax and invoice operations, with a separate Nepal adapter and a separate India adapter. Schemas, validation, credentials, and observability are not shared across countries. Legal registration country selects the profile and the UI. Client state cannot switch the route.

Live calls to Nepal IRD/CBMS and to India GST e-invoice/IRP exist only in Phase 67, after Phase 66 has passed end-to-end, security, restore, and pilot release readiness with test adapters. Earlier phases may store country-aware invoice fields and may exercise mock or test adapter contracts. They must not submit to a government endpoint.

No certification, eligibility, or taxpayer authorization is claimed by this decision. Official documents must be reconfirmed when Phase 67 starts. If approval is delayed, the connector stays disabled or pending and the manual or export fallback remains. The rest of the ERP is not blocked.

**Consequences.** Do not hard-code one country's tax logic into the other. Do not scrape a government portal, bypass MFA, OTP, or authorization, or reuse credentials across unrelated taxpayers.

### ADR-010 — Currency, timezone, and jurisdiction

**Decision.** Store timestamps in UTC and display them in the company timezone. Nepal defaults are NPR and Asia/Kathmandu. India defaults are INR and Asia/Kolkata. Financial records store their own currency, timezone, and tax context. Do not convert foreign exchange. Do not add unlike currencies into one total. Changing a company default does not rewrite posted history. Legal jurisdiction is chosen at onboarding. After regulated invoices exist, changing it requires a controlled migration and legal-entity workflow.

**Consequences.** Comparison screens show each currency separately. Reports must not present a mixed total as if it were one currency.

### ADR-011 — Stock ledger and balanced, idempotent journals

**Decision.** Stock is a ledger of posted movements. On-hand quantity is derived from that ledger or maintained in the same transaction with a reconciliation check. It is not a user-editable balance.

Accounting is native double-entry. A posted journal balances. Posting is atomic and idempotent and is linked to the source document. Posted history is corrected by reversal or adjustment, not by silent mutation. Period locks reject unauthorized back-posting. Duplicate retries must not create a second financial or stock posting.

**Consequences.** Marketplace activity, a draft daily report, an unapproved purchase order, and an unreviewed takeoff do not post stock or journals. Accounting-specialist review is required before the books are used as a financial system of record in production. The software does not claim formal compliance on its own.

### ADR-012 — Marketplace entitlement and no automatic side effects

**Decision.** Supplier Marketplace is a separately entitled add-on. Entitlement is enforced on the server. Supplier profiles and listings, buyer–supplier messages, managed RFQs, supplier-specific quote revisions, buyer comparison, and notification inbox and push are in the add-on. Payment processing, commission, automatic award, automatic purchase order, automatic payable, and automatic stock movement are not.

The commercial path is: discover a supplier, then message; start from an internal material need; approve the RFQ; invite suppliers; collect supplier-specific responses; compare them; record an authorized selection; create a purchase order only by an explicit action in the normal procurement workflow.

One supplier cannot read another supplier's quote. Messages, RFQ documents, prices, responses, device tokens, and notification payloads are private. A supplier reaches only RFQs addressed to that supplier and their own quotes.

**Consequences.** Internal vendor contacts and manual quotations remain available when the add-on is off. Publishing a listing does not create a vendor, a purchase order, or stock.

### ADR-013 — Authority model

**Decision.** Identity, profile, company membership, role, project and site scope, supplier identity, operational assignment, and account-security state are separate. Assignment never grants permission by itself. A profile field or editable `user_metadata` value is not authority. Platform Owner is the highest platform authority and is created only by a controlled bootstrap that uses Dashboard **Add user**, never an invitation email. Platform authority does not grant routine access to company operational data, marketplace messages, quotes, project files, or tax credentials. Company Admin cannot administer the platform. Separation of duties applies: a Site Supervisor does not approve their own submissions by default. The named roles and their prohibitions are specified in [user-workflows.md](user-workflows.md). Account-security state (`must_change_password`) is a private gate, not a role. The policy is in [security/panel-managed-account-provisioning.md](security/panel-managed-account-provisioning.md).

**Consequences.** Phases 05–07 and 12 implement the boundary. A role enum change later requires a migration and a full authorization test. The first release does not include an arbitrary role builder.

### ADR-014 — Field drafts are not server truth

**Decision.** The field client may cache the minimum safe data and may keep drafts during poor connectivity. The server confirms submission, approval, and posting. Pending upload is visually distinct from a confirmed record. Offline posting of accounting or inventory is out of scope. Conflict handling must not duplicate a transaction.

**Consequences.** Phase 29 and Phase 61 share this rule. Neither is started.

### ADR-015 — Engineering output stays traceable and unapproved until review

**Decision.** Automated quantity and rebar results store the source drawing or model revision, the input assumptions, the units, the formula or rules version, the reviewer, and the approval status. They remain draft until an authorized reviewer approves them. Only an explicit later action may create a BOQ revision from an approved result. Unreviewed output is not billable and is not an approved structural or fabrication instruction.

IFC files and clash results are permissioned project data. A clash run stores the model revisions, tolerances, and units so the result can be reproduced. Clash status is not design approval and does not change a BOQ, contract, or purchase order. BIM is not mandatory.

**Consequences.** Phases 62–65 implement the modules. Manual BOQ entry remains valid without them.

### ADR-016 — Progressive disclosure

**Decision.** Navigation shows only modules that are active, built, and relevant to the role and entitlement. Specialist modules and the marketplace add-on are not empty links. No future feature receives a placeholder route, table, or marketing claim because a competitor has it.

**Consequences.** Phase 14 builds role homes with a minimal menu. Later phases add items only when the module is real.

### ADR-017 — Construction UI tokens

**Decision.** When the web UI is built, it uses Construction Amber `#F59E0B` with Graphite `#1F2937` text on amber, Blueprint Blue `#2563EB` for links and focus, Canvas `#F8FAFC`, Surface `#FFFFFF`, and Steel Border `#E2E8F0`. Semantic states do not rely on color alone. Buttons are pill-shaped, with visible focus, loading, and disabled states. Cards use a 12–16px radius and a restrained shadow. These tokens apply to the web app. They are not a React Native component contract.

**Consequences.** Phase 03 owns the tokens. This phase does not add a stylesheet.

## Unresolved

No value is chosen for any item below.

| ID | Open question | Earliest phase that may close it | What this phase refuses to assume |
|---|---|---|---|
| OPEN-01 | Which IFC schema versions are supported, and what the model-size ceilings are for render and clash. | 64 and 65, after a benchmark | A version number, a megabyte limit, or an Edge Function geometry pipeline. |
| OPEN-02 | The exact takeoff input formats beyond PDF drawings and vector or CAD-derived inputs selected after a spike. | 62 | That scanned drawings, site photos, or a named CAD product are supported. |
| OPEN-03 | Which engineering standards and code factors apply to rebar shape, lap, hook, anchorage, unit weight, and rounding, and which qualified local engineers review them. | 63 | A design code, a factor, or a claim that software output is safe to fabricate. |
| OPEN-04 | The notification provider. Expo Push Service is the initial recommendation to evaluate, with APNs and FCM behind it. | 60 | A signed vendor choice, pricing, or a delivery guarantee. |
| OPEN-05 | The official Nepal IRD/CBMS onboarding route, the company's eligibility, and the credential and approval requirements. | 67 | That a software listing enables every taxpayer, or that a credential may be stored in a profile. |
| OPEN-06 | The official India GST e-invoice/IRP route for each supported arrangement: direct API, an IRP or provider API-integrator route, or another permitted partner route. Also taxpayer eligibility, GSTIN-specific configuration, and credential separation between the taxpayer and FortSite or the provider. | 67 | One universal Indian endpoint, or a shared credential across taxpayers. |
| OPEN-07 | The data-residency region of the Supabase project named `FortSite - 2Merged`. | 04, when an environment is actually created | A region, a project ref, or a URL. |
| OPEN-08 | Every technical Supabase identifier: project ref, organization ID, API URL, anon key, service-role key, database password. | The phase that needs that identifier, read from the dashboard | Any invented or copied secret. |
| OPEN-09 | Which sign-in methods the business will support. | 05 | Public self-service company creation, or social login as a default. |
| OPEN-10 | Message and attachment retention durations, and the moderation policy details. | 57 | A retention period or a legal hold rule. |
| OPEN-11 | Whether one person may be a member of more than one company. | 06, only after a product rule is signed off | Either a prohibition or a permission. The later schema must be able to represent the case if the rule allows it. |
| OPEN-12 | Payment-gateway integration for platform subscriptions. | After a separate business decision. Not a numbered phase. | Card storage, automatic collection, or a provider. Phase 10 is manual recording only. |
| OPEN-13 | Break-glass platform support access: whether it exists, who may use it, and how the time limit and reason are enforced. | Only if a later decision requires it | A hidden impersonation path in the first release. |
| OPEN-14 | Automatic bank feeds. | Only if a separate decision approves them | Bank credentials inside FortSite. |
| OPEN-15 | Electronic signature of contracts. | Only if a separate decision approves a provider | A signature vendor or a claim that a FortSite approval is a legal e-sign. |

## References

The roadmap section 12 links are planning references for React, Vite, Tailwind CSS, 21st.dev, Supabase Auth, RLS, migrations, Edge Functions, Storage, Nepal IRD CBMS, India IRIS IRP, and Expo push. They do not certify FortSite security, accounting, engineering output, or regulatory compliance. Reconfirm government documents at the start of Phase 67. Provider payloads and eligibility can change.
