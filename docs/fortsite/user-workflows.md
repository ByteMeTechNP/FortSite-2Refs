# FortSite user workflows

**Status:** Requirements only. No workflow is implemented.  
**Phase:** 01. **NOT STARTED.**  
**Related:** [product-charter.md](product-charter.md), [architecture-decisions.md](architecture-decisions.md), [acceptance-catalogue.md](acceptance-catalogue.md).

Actors, inputs, decisions, outputs, and exceptions below are the agreed workflows for apartments, villas, small townships, restaurants, hotels, and warehouses. A later phase must not invent a shorter path that skips approval, scope, or an explicit posting step.

## 1. Identity, membership, role, scope, and assignment

These concepts stay separate. None of them implies the next one.

| Concept | Meaning | Does not mean |
|---|---|---|
| Identity | The Supabase Auth user. | Membership in any company, or platform authority. |
| Company membership | The company the user belongs to. | A role, a project, or a supplier account. |
| Role | The actions the user may perform. | Access to every project, site, or record in the company. |
| Project/site scope | The projects, sites, and records those actions apply to. | Permission to act outside that scope. |
| Supplier identity | The supplier account a marketplace user belongs to. | Access to a buyer company's operations, or to another supplier. |
| Operational assignment | Work the user is responsible for, such as a task, crew, or inspection. | Permission. Assignment alone does not grant permission. |

A signed-in user with no valid membership and no platform authorization sees no protected data.

A user may hold more than one company role only where that is operationally justified. Permissions are the union of explicitly granted actions inside the valid company, project, and site scope, except where a separation-of-duty rule forbids the combination. The first release uses the named roles below and only a small set of explicit permission overrides if real use requires them. It does not include a large arbitrary role builder.

Whether one person may hold memberships in more than one company is an open product rule. The later schema must be able to represent that case if the rule allows it. This document does not decide the rule. See [architecture-decisions.md](architecture-decisions.md).

Platform roles and company roles are different stores of authority. A Company Admin cannot grant platform access. A route guard is navigation only. RLS and server-side checks are the security boundary.

## 2. Roles and prohibited actions

### Platform Owner (Super Admin)

Highest platform authority. Bootstrap is a controlled, documented process, not public self-registration. A Company Admin cannot create a Platform Owner. Optional restricted Platform Support access may be introduced later only when needed. It must not equal Platform Owner, must not edit subscription plans, and must not access tenant content by default. Break-glass support access is not part of this design. If it is ever added, it must be explicit, time-limited, reasoned, and written to an immutable audit trail.

**May do**

- Create and onboard companies.
- Capture legal registration country and choose default currency and timezone for that country.
- Create or invite the first Company Admin.
- Choose a plan or trial.
- Manage subscription status, dates, and terms.
- Record platform subscription payments and adjustments, with amount, currency, date, reference, and notes.
- Activate, pause, suspend, or archive a company under defined rules.
- Manage platform plans, platform settings, support notes, and platform audit review.

**Must not do**

- Browse company operational data as part of routine platform administration.
- Read marketplace messages, quotes, project files, or tax credentials as a side effect of platform authority.
- Impersonate a company without an explicit, audited break-glass path. That path is not in the first design.
- Delete a company in a way that cascades away accounting or audit history.

### Company Admin

**May do**

- Maintain the company profile, logo, contacts, timezone, financial year, default currency, document numbering, and approval defaults.
- Invite and assign people inside the company.
- See a projects overview and company-level configuration.
- Open the country-specific compliance settings for the company's legal jurisdiction and see connection status (not configured, pending, or active). Live credentials are not entered here before Phase 67.

**Must not do**

- Administer the platform, open `/platform/*`, or mutate subscription controls.
- Create Platform Owners or grant platform access.
- Bypass subscription eligibility.
- Silently rewrite posted financial or stock history.
- Treat legal jurisdiction as a casual display setting after regulated invoices exist.

### Projects Manager

**May do**

- On assigned projects: planning, BOQ and estimates, budgets, contracts and variations, tasks and schedule, progress, inspections, subcontractor scope, and project reporting.
- Manage RFQs and quote evaluation only where that permission is explicitly granted.

**Must not do**

- Change the platform subscription.
- Manage company-wide access by default.
- Post accounting or stock adjustments without a separate grant.
- See projects outside assigned scope.

### Site Supervisor

**May do**

- Inside assigned sites and areas: tasks, daily progress reports, progress evidence, attendance and muster, issues and snags, inspections, material requests, and expense drafts.

**Must not do**

- See other projects by default.
- Approve own submissions by default. This includes own expenses and own stock adjustments.
- Access the full ledger.
- Treat a device draft as a server-confirmed or approved record.

### Accountant & Billing

**May do**

- Work with approved financial documents, project costs, journals, supplier invoices, client bills, receipts and payments, reconciliation, and finance reports.
- Review the financial implication of operational records that have already been verified.

**Must not do**

- Silently alter site-verified quantities or attendance. Changes go through the workflow that owns those records.
- Access another company's tenant.
- Post from a draft measurement or an unapproved expense.

### Inventory Manager

**May do**

- Maintain the material catalogue.
- Receive goods, issue stock, transfer, count, and execute procurement within granted permission.

**Must not do**

- Post unrestricted adjustments. Adjustments require controls, a reason, and the approval the company policy demands.
- Change accounting periods.
- Manage platform subscriptions.
- Move stock because a quotation, listing, or marketplace click exists.

### Supplier account holder and invited supplier users

Supplier users exist only for the marketplace add-on. An internal vendor contact in the buyer company is a different record. The two stay distinct unless a user deliberately links them.

**May do**

- Manage their own supplier profile and listings.
- Read and reply to messages, RFQs, and quotes explicitly associated with their supplier account.
- Accept or decline an invited RFQ, ask permitted clarifying questions, and submit quote revisions for that RFQ.

**Must not do**

- See another supplier's quote, price, or response.
- See a competitor in a shared thread. There is no cross-supplier group chat.
- Open unrelated company projects, files, ledgers, or tax data.
- Act as a buyer-company user.
- Create a purchase order, payable, or stock movement in the buyer company.

## 3. Platform onboarding

**Actor:** Platform Owner.  
**Phases:** 07–11. Not started.

1. Confirm the actor is a Platform Owner created by the controlled bootstrap, not by self-service.
2. Create the company and capture legal registration country: Nepal or India. The country is validated. It selects the compliance profile.
3. Set the country default currency and timezone. Nepal: NPR and Asia/Kathmandu. India: INR and Asia/Kolkata.
4. Enter business profile and contact details. Generate the company identifier by a server-side rule, not by trusting a browser-supplied id.
5. Create or invite the first Company Admin. The invited person accepts through the Auth invitation flow and lands in that company only.
6. Select a subscription or trial. Record terms, dates, and any manual payment or adjustment.
7. Activate the company, or leave it in a non-eligible state with a visible reason.
8. Write an immutable platform audit event for the onboarding, the plan, and the status.

**Exceptions**

- Open self-service tenant creation is not available unless a later decision approves it. It is not approved here.
- A suspended, archived, or expired company cannot continue protected operational mutations. A clear status remains visible. A deliberately permitted billing or contact route may remain available. The eligible actions are enforced from trusted server and database state, not from the JWT or the UI alone.
- The Company Admin cannot open the platform zone or change the subscription.

At this stage the compliance profile holds eligibility metadata and connection status only. It does not hold live government credentials.

## 4. Company first-run setup

**Actor:** Company Admin.  
**Phases:** 12–14. Not started.

1. Confirm membership and the Company Admin role.
2. Complete business profile, country-locked compliance profile, timezone, financial year, default currency, document numbering, logo, and contacts.
3. Invite the team and assign named roles and project or site scope.
4. Set simple approval defaults and named approvers. Thresholds stay modest. There is no universal workflow engine.
5. Land each role on a home screen that shows that role's work, not every future module.

**Exceptions**

- Inactive and unbuilt modules are not shown as navigation.
- A membership, a role, or a task assignment is not enough by itself. All three required gates apply: membership, explicit permission, and scope.
- Historical currency and timezone stay on the transaction. Changing the company default does not rewrite them.

## 5. Project setup for a building job

**Actors:** Company Admin and Projects Manager, inside scope.  
**Phases:** 19–28. Not started.

1. Create a project with code, client, type, dates, location, manager, status, and commercial context.
2. Add one or more sites. A villa may have a single site and no building hierarchy. An apartment, hotel, or township uses blocks, floors, units, rooms or zones, and common areas only where they help. A warehouse uses areas and stores. A restaurant fit-out uses the zones it needs. No hierarchy level is mandatory for every project.
3. Add client, consultant, and vendor contacts. A lightweight proposal may record scope summary, estimate reference, submitted date, status, and attachments. This is not a buyer CRM.
4. Build a practical work breakdown: stages, trades, and work packages, with cost codes that later connect estimates, tasks, materials, labour, subcontractors, and postings.
5. Assign tasks to a person or crew, with project, site, area, dates, priority, and status. Assignment does not grant extra permission.
6. Prepare rates, a draft BOQ, and an approved budget baseline. Approved rates and quantities are snapshotted. Later rate edits do not rewrite them.
7. Record client contracts, work orders, and variations. A variation changes the approved baseline only after approval.
8. Keep a simple schedule and a weekly look-ahead. Actual dates are preserved when the plan moves.

**Exceptions**

- Do not attach another company's site, contact, or cost code.
- Do not hard-delete a project that has financial or operational history.
- Draft estimate lines are not the approved baseline.

## 6. A day on site

**Actor:** Site Supervisor, on an assigned site.  
**Phases:** 29–34, with attendance in 36. Not started.

The field path is meant to be fast on a phone: Today at Site, crew muster, daily progress, material request, stock receipt or issue, issues and snags, and a small expense.

1. Open the assigned site and the tasks due there.
2. Draft a daily progress report: date, site, optional weather, workforce count, work done, quantities, materials used or received, equipment used, delays, instructions, incidents, and photos.
3. Mark attendance in bulk for the crew: present, absent, or half-day, and shift or overtime where the company uses them. Photo or location evidence is optional and is never the only proof of attendance.
4. Raise a material request with required-by date, project, site, store, cost code, quantity, unit, and reason.
5. Log an issue or snag with category, severity, place, photos, and a responsible person. Log an inspection or a simple safety or permit checklist when the work needs it.
6. Draft a small expense: date, amount, currency, category, project, site, cost code, paid-by, payment source, note, and an optional receipt photo.

**Decisions**

- Submit sends the record to review. The supervisor does not approve their own submission by default.
- Server confirmation is distinct from a draft sitting on the device.

**Exceptions — poor connectivity**

- The device may keep a draft and a pending-upload queue for the supported field records.
- Closing and reopening the app must show the draft again.
- A failed upload stays failed until a person retries it.
- A draft is never shown as approved, posted, or billed.
- Accounting and inventory are not posted from the device while offline. There is no silent conflict merge that can duplicate a transaction.

## 7. Measured progress and client billing

**Actors:** Site Supervisor prepares; a different authorized person verifies; Accountant & Billing bills.  
**Phases:** 31, 50. Not started.

1. Record a measured quantity against a BOQ line or work package, with date, location, notes, evidence, preparer, and verifier.
2. Keep the draft measurement separate from the accepted measurement.
3. Roll up progress from accepted quantities and defined weights, not from an arbitrary percentage alone.
4. Prepare a client bill from the contract, accepted measurements, or approved BOQ quantities. Include retention, advance recovery, and approved variations when they apply.
5. Track submitted, approved, due, part-paid, paid, disputed, and cancelled or reversed states.
6. Post the receivable once, through the accounting engine, linked to the bill.

**Exceptions**

- A draft measurement is not billable.
- An issued bill is not silently rewritten. Corrections use a revision, a credit, a reversal, or an adjustment.
- Over-measurement and duplicate measurements are flagged.
- Automated takeoff quantities cannot enter this path until they have passed the review in section 12.

## 8. People, labour, and subcontractors

**Actors:** Projects Manager, Site Supervisor, Accountant & Billing, inside scope.  
**Phases:** 35–39. Not started.

1. Register workers and crews with the minimum personal data the workflow needs. Contractor-supplied crews are allowed. Workers need not be direct employees.
2. Approve attendance corrections through a request. Labour cost uses approved attendance only.
3. Track wage or rate basis, approved days or hours, overtime and allowances when used, advances, deductions, and payments. Allocate cost to the project. This is construction labour cost and settlement, not statutory payroll.
4. Record a subcontract against a work package, with amount, rate basis, dates, retention, and advance terms. Commercial terms are visible only to authorized company roles.
5. Measure a claim, then review it. Approved value, retention, advance recovery, and deductions stay distinct from the draft claim and from the amount paid.
6. Post the approved claim once into accounts payable and project cost. Partial payment does not rewrite the approved claim.

**Exceptions**

- There is no subcontractor portal in the core product unless a later decision adds one. It is not approved here.
- Retrying approval does not create a second payable.
- Face recognition and geofencing are not used.

## 9. Materials, stock, and ordinary procurement

**Actors:** Site Supervisor requests; Inventory Manager and, where granted, Projects Manager execute; Accountant & Billing posts payables.  
**Phases:** 42–47 and 49. Not started.

This path works with or without the marketplace add-on.

1. Use the company material catalogue: code, name, category, unit, specification, and pack size. Marketplace listings are not approved procurement data.
2. Represent stores and locations. On-hand quantity comes from posted movements: opening balance, receipt, issue, transfer, return, and approved adjustment. A user-editable on-hand field is not the source of truth.
3. Approve the material request, or return it with a reason.
4. Record supplier quotations manually: price, unit, currency, and lead time. Compare them. Select a vendor. Do not convert unlike currencies into one total.
5. Create a purchase order only as an explicit, approved procurement action. Lines carry supplier, prices, currency, taxes and charges where they apply, and delivery details.
6. Receive goods partially or fully. Record accepted, rejected, and short quantities. Accepted quantity creates one inventory movement.
7. Issue materials to a task, site, work package, or crew. Record returns, waste, counts, and transfers with a reason code. A daily progress report does not itself move stock.
8. Match a supplier invoice to the receipt or to an approved non-PO expense where policy allows. Warn on a duplicate invoice. Post accounts payable once.
9. Record the commitment until the order is matched or closed. Outstanding quantity, commitment, stock balance, and payable must reconcile.

**Exceptions**

- A requisition, a quote, or an unapproved purchase order does not move stock and does not create a payable.
- Retrying a receipt, issue, or invoice post does not duplicate the movement or the journal.
- An inventory adjustment is a controlled posting, not a free edit.
- Site petty cash and reimbursements follow submit, approve, and pay. One approved expense produces at most one posting. A low amount is not auto-approved unless the company has an explicit bounded rule.

## 10. Supplier Marketplace

**Actors:** an entitled buyer-company user with an explicit RFQ or quote permission; a supplier account holder or invited supplier user.  
**Phases:** 56–60. Not started. The add-on is unavailable when the company is not entitled.

Two entry points exist. They meet at an explicit purchase order and nowhere earlier.

**Discover, then message**

1. A buyer browses published listings only. Draft and unapproved listings stay hidden.
2. The buyer opens a direct conversation, or a conversation linked to a listing. The thread has a durable message record, sender, participants, time, read state, and optional attachments.
3. Realtime may refresh the open thread. The database remains the history.
4. The supplier sees only threads they participate in. Authorized buyer-company users see only their company's threads.
5. Report and block have defined behavior. A failed send can be retried without creating a second message.

**Internal need, then RFQ, then quote, then a normal purchase order**

1. An internal material or procurement need already exists, or is created, under the ordinary request rules.
2. An authorized user drafts a managed RFQ: lines, quantity, unit, delivery place and date, specification, attachments, response deadline, terms, and the company's own approval requirement.
3. The company approves the RFQ when its threshold says so. Marketplace contact does not bypass that threshold.
4. The user explicitly invites suppliers. A supplier who is not invited cannot see the RFQ.
5. Each invited supplier sees only their own RFQ and the documents they are allowed to see. They accept, decline, or ask a permitted question.
6. The supplier submits a quote revision: unit, quantity, rate, taxes and charges as applicable, validity, lead time, delivery terms, exclusions, attachments, and notes. Revisions are kept.
7. The buyer compares supplier-specific responses. Comparison shows currency and assumptions. Unlike currencies are not merged into one converted total.
8. An authorized buyer shortlists, rejects, or selects, with approver and reason. Selection links to the internal requisition. There is no automatic award and no hidden ranking formula.
9. A permitted user then creates a purchase order through the normal procurement workflow in section 9. That step is a separate, explicit action.

**Privacy rules**

- One supplier cannot see another supplier's quote, price, attachments, or evaluation notes.
- Push payloads do not contain quote prices or message text. The in-app inbox holds the durable notification.
- No marketplace event creates a purchase order, a payable, or a stock movement.

## 11. Accounting and cost control

**Actors:** Accountant & Billing, with Projects Manager reading project cost.  
**Phases:** 48–54. Not started.

1. Operational documents that are approved and ready to post enter the journal through one server-side posting operation. The browser does not insert journal lines one by one.
2. Every posted journal balances. It links to the source document, company, project or site where applicable, cost code where applicable, currency, creator, and posting state.
3. Posted lines are not edited or deleted. A correction is a reversal or an adjustment, and it keeps history.
4. A locked period rejects unauthorized back-posting.
5. Cash and bank receipts and payments allocate once against invoices or advances. Reconciliation differences stay visible. Unlike currencies are not mixed in one total.
6. Project cost shows budget, approved changes, commitments, and posted actual cost separately. A forecast states its assumptions. Every total opens to the source rows.
7. Reports and exports use the same permission scope as the screen. A total matches its detail.

**Exceptions**

- Retrying a post returns the original posting rather than a second journal.
- Draft and committed amounts are never labelled as actual cost.
- The books are not claimed formally compliant merely because the journal balances. Accounting-specialist review is required before financial production use.

## 12. Drawing takeoff and rebar schedules

**Actors:** an authorized estimator or engineer prepares; a qualified reviewer approves. The reviewer's qualification is a business and professional fact, not a software role name invented here.  
**Phases:** 62–63. Not started. Ordinary projects skip this section.

1. Store the drawing or supported model as a revision in private project storage. Record the revision identity. The source file stays unchanged.
2. Calibrate scale where the input is a raster or vector drawing. Select the sheet or page.
3. Produce measurements or a reinforcement calculation: count, length, area, or bar mark, diameter, shape, dimensions, count, cut length, hooks and bends, lap and anchorage where specified, unit weight basis, total length, and estimated weight.
4. Save a draft result with the source revision, the geometry or input used, the rule version, the units, the conversions, and the assumptions.
5. Label machine-extracted, manually corrected, and approved values separately. A reviewer edits, rejects, or approves. Unrecognized or incomplete input cannot be approved.
6. Only after approval, an explicit action may create a new takeoff or BOQ revision. That revision then follows the normal BOQ approval rules before it can affect a budget, a bill, or a purchase.

**Exceptions**

- Unreviewed output is not billable.
- Unreviewed output is not an approved structural or fabrication instruction and is not safe to issue for fabrication.
- The software does not design missing reinforcement and does not silently substitute a code rule.
- A site photo is not a takeoff input.
- Exact input formats, IFC versions, and the engineering standards a qualified local engineer must review are unresolved. See [architecture-decisions.md](architecture-decisions.md).

## 13. IFC model and clash coordination

**Actors:** an authorized project user, on a project where the module is enabled.  
**Phases:** 64–65. Not started.

1. Upload an IFC file to private storage with project, discipline, author, date, revision, and file hash.
2. Render supported geometry in the execution environment chosen after a performance spike. The spike has not been run. Edge Functions are not the default place for heavy geometry.
3. Filter by floor or discipline, select an element, and link it to a project area, task, BOQ line, or issue only where the link is valid.
4. Run a saved clash check for hard clashes and configured clearance, using a visible tolerance and unit system. The run stores the exact model revisions and settings.
5. Triage results into normal project issues, with element references, a viewpoint or snapshot, location, responsible person, due date, and resolution evidence.
6. Re-run after a new model revision. Historic runs remain.

**Exceptions**

- A corrupt or unsupported file fails safely and does not change project data.
- A clash result can be a false positive or a false negative. Clash status is not engineering approval.
- No clash run changes a BOQ, a contract, or a purchase order.
- Ordinary projects are not required to upload a model, and the module is not a navigation item until it is built and enabled.

## 14. Closeout and defects

**Actors:** Projects Manager and Site Supervisor, with Accountant visibility of remaining commercial items.  
**Phase:** 55. Not started.

1. Walk a closeout list per building or project: open snags, final inspections, commissioning, as-built documents, warranties, manuals, keys or asset handover, and defect-liability dates and contacts.
2. Keep unfinished items visible and assigned.
3. After handover, record a defect against the same permission and history rules. This is not a facilities-management desk.

## 15. Notifications and the mobile companion

**Actors:** any authorized user; supplier users for their own marketplace events.  
**Phases:** 15, 60, and 61. Not started.

1. An in-app notification is written when a message arrives, an RFQ is issued or is near its deadline, a quote arrives, an RFQ status changes, an approval is needed, or an important project event occurs.
2. The inbox is the record the user can trust. The outbox records delivery attempts.
3. Push is sent only when the user has a registered device and has not opted out. Delivery is best effort. Failure, retry, and an invalid token are recorded. The in-app item remains.
4. A notification tap opens the mobile app and the target record only after the server authorizes the current session. An expired session requires sign-in again. The deep link is not a credential.
5. Lock-screen text stays minimal. It does not include quote prices or message bodies.

The mobile app is a separate React Native and Expo client for sign-in, assigned work, daily progress, photos, attendance where authorized, material requests, issues, marketplace messages, RFQ responses, and these deep links. Finance and model review stay primarily on the web app. Web UI components are not assumed to run in the mobile app.

## 16. Country billing route, including the final government phase

**Actors:** Platform Owner at onboarding; Company Admin for profile status; Accountant & Billing for invoices; a customer's tax administrator only in Phase 67.  
**Phases:** 09, 13, 53, 66, and 67. Not started.

1. Legal registration country is Nepal or India. That choice creates the matching compliance profile and settings UI.
2. The user cannot switch country by editing client state. After regulated invoices exist, a country change is a controlled legal-entity workflow, not a settings toggle.
3. Invoice numbering, tax fields, and amounts follow the active country's reviewed rules. Historical invoices keep the rule values they were issued with.
4. Unsupported tax cases are blocked or flagged. The product does not give legal advice.
5. Through Phase 66, production government connectors stay disabled. Tests use mock or test adapters only, to prove the internal contract, the payload shape, and failure states.
6. Phase 67, and only Phase 67, performs official coordination:
   - Confirm the current authority or provider documents, eligibility, onboarding, credentials, sandbox, signatures, QR or IRN where they apply, cancellation and debit or credit notes, retries, rate limits, and support contacts.
   - Implement a Nepal IRD/CBMS adapter and an India GST e-invoice/IRP adapter behind one internal contract. The adapters, schemas, credentials, and observability stay separate.
   - Store secrets only in server-side encrypted storage. Never log them or send them to the browser.
   - Test with official sandbox credentials first.
   - Run a limited pilot only with written approval and eligibility.
   - Reconcile FortSite invoices to the identifiers, status, and evidence the authority returns.
   - Enable production only with written go-live authorization and a rollback and manual fallback.
7. If approval is delayed, leave the connector disabled or pending and keep the manual or export fallback. Do not block the rest of FortSite.

Nepal and India do not share an undifferentiated government billing connector. One country's approval does not enable the other country's taxpayers. Taxpayer credentials are not shared across unrelated taxpayers.
