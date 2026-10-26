# FortSite acceptance catalogue

**Status:** Scenarios to be tested in later phases. None can be executed. There is no application, database, or hosted project to run them against.  
**Phase:** 01. **NOT STARTED.**  
**Evidence:** none.

Each scenario names the actors, the result that must hold, and where the result is enforced. A hidden button is not a pass. Where the scenario says the database or server boundary, a user who changes the route, the payload, or the client state must still fail.

Passing these scenarios is future work. This catalogue does not mark any phase verified complete.

## AC-TENANT — Tenant isolation

**Actors.** A member of Company A, and any role they hold. Company B has projects, files, subscription rows, stock movements, journals, messages, RFQs, and quotes.  
**Phases that must eventually prove this.** 06, 07, 12, 17, and 66, plus every later phase that adds a private table or bucket.  
**Preconditions.** Both companies exist. The actor has no membership in Company B and no platform break-glass grant. Break-glass is not part of the first design.

**Required result.**

- Select, insert, update, and delete of Company B projects, files, subscription details, stock, accounting, and marketplace-private records fail.
- The failure is at the database or server boundary, including Storage, not only by hiding a menu.
- A relationship path cannot attach Company A's child row to Company B's parent, or the reverse.
- A browser-supplied `company_id` is not trusted by itself.

## AC-SUPER — Super Admin onboarding and boundary

**Actors.** Platform Owner; the invited Company Admin.  
**Phases.** 07–11.  
**Preconditions.** The Platform Owner was created by the controlled bootstrap, not by public self-registration.

**Required result.**

- The Platform Owner creates a company, selects Nepal or India and the matching currency and timezone default, selects a plan or trial, invites the first Company Admin, records trial or payment terms, and activates the company.
- The full platform audit trail shows actor, action, target, time, result, and reason for those privileged changes.
- The Company Admin lands in that company and cannot open `/platform/*`.
- The Company Admin cannot mutate subscription controls, plans, or platform settings by route, payload, or client state.
- Routine platform administration does not return company operational rows, marketplace messages, quotes, project files, or tax credentials.

## AC-SUB — Subscription entitlement

**Actors.** A member of a company whose subscription is suspended or expired.  
**Phases.** 10, and every protected operational mutation that follows.  
**Preconditions.** Entitlement is stored in the database. The UI may still show a stale "active" flag.

**Required result.**

- Protected operational mutations fail from trusted server or database state.
- The user sees a clear status and explanation.
- A deliberately permitted billing or contact route, if the product defines one, remains available and does not itself unlock operations.
- JWT or UI state alone cannot restore eligibility.
- Historical subscription payments are not deleted or rewritten by a later plan change.

## AC-ROLE — Role, scope, and separation of duties

**Actors.** Company Admin, Projects Manager, Site Supervisor, Accountant & Billing, Inventory Manager, a supplier user, and a user who is only assigned a task.  
**Phases.** 12, with negative tests repeated as modules appear, and 66.

**Required result.**

- Identity, membership, role, project and site scope, supplier identity, and assignment are stored and checked separately.
- A task assignment with no role grant returns no extra data.
- A Site Supervisor sees only assigned sites and areas, cannot approve their own expense or stock adjustment, and cannot read the full ledger.
- A Projects Manager cannot change the platform subscription or manage company-wide access by default, and can manage RFQs and quote evaluation only with an explicit grant.
- An Accountant cannot silently change site-verified quantities or attendance.
- An Inventory Manager cannot post an unrestricted adjustment, change an accounting period, or manage the platform subscription.
- A Company Admin cannot grant platform access.
- Direct URL and API calls fail the same way as hidden buttons.
- Cross-project and cross-site negatives fail.

## AC-DPR — Daily progress report

**Actors.** Site Supervisor on an assigned site; a different reviewer.  
**Phases.** 30, with evidence storage in 17 and review in 15.

**Required result.**

- A normal report can be drafted with date, site, work, quantities, and photos, using the assigned project, site, user, and date as defaults.
- Submit creates a traceable submitted record. The supervisor does not approve their own report by default.
- Corrections keep history.
- Photos and other evidence stay private to authorized company and project scope.
- The report does not itself post stock, a journal, or a client bill.

## AC-STOCK — Stock ledger

**Actors.** Inventory Manager, inside store and project scope.  
**Phases.** 43 and 44, reconciled again in 46 and 66.

**Required result.**

- An issue to a work package, a return of unused stock, and a damaged quantity are each a movement with actor, date, quantity, unit, source or destination, and source document.
- On-hand quantity is explainable from movement history. It is not a free-typed balance.
- Retrying the same command does not create a second movement.
- Concurrent movements do not silently create an inconsistent balance.
- A daily report, a quotation, a marketplace listing, or a marketplace click does not move stock.
- Another company's store is not readable or writable.

## AC-ACCT — Accounting posting integrity

**Actors.** Accountant & Billing.  
**Phases.** 48–51 and 66.  
**Preconditions.** Accounting-specialist review is still required before production financial use. This scenario tests the engine; it does not certify statutory compliance.

**Required result.**

- Every posted journal has equal debits and credits.
- The source document and the journal are linked, with company, currency, and project or site where applicable.
- Posted documents cannot be silently edited or deleted.
- A reversal retains history.
- A locked period rejects unauthorized back-posting.
- Repeating the posting command does not create a second journal.
- Draft and committed amounts are not reported as posted actual cost.
- NPR and INR are not added into one total.

## AC-PROC — Ordinary material procurement

**Actors.** Site Supervisor, Inventory Manager, Accountant & Billing. Marketplace entitlement is off.  
**Phases.** 45, 46, and 49.

**Required result.**

- The path is approved request, then manual supplier quotation comparison, then approved purchase order, then partial goods receipt, then accepted stock movement, then supplier invoice, then payable.
- Outstanding quantity, commitment, and stock balance reconcile at each step.
- A requisition or a quote alone creates no purchase order, payable, or stock movement.
- A retried receipt or invoice does not duplicate the movement or the payable.
- Units and currency stay explicit. Unlike currencies are not converted.

## AC-MKT — Marketplace message, RFQ, and quote privacy

**Actors.** An entitled buyer user with explicit RFQ permission; Supplier A; Supplier B.  
**Phases.** 56–59 and 66.  
**Preconditions.** The buyer company is entitled. Both suppliers are invited only where the scenario says they are invited.

**Required result.**

- The buyer can message Supplier A. Supplier B cannot read that thread, its attachments, or its push text.
- The buyer issues an RFQ to selected suppliers. An uninvited supplier cannot read it. An invited supplier sees only their own invitation and the documents shared with them.
- Each supplier submits revisions. The buyer compares supplier-specific lines with currency and assumptions visible. Unlike currencies are not collapsed into one converted total.
- Supplier A cannot read Supplier B's quote, price, attachments, or evaluation notes, by UI, API, Storage, or Realtime.
- Retrying a message or a quote submission does not duplicate the record.
- A selected quote does not create a purchase order, a payable, or a stock movement. A permitted user must create the purchase order through the normal procurement action.
- There is no automatic award and no hidden ranking that selects a supplier.

## AC-PUSH — Push failure and in-app fallback

**Actors.** A user who should receive a message, RFQ, quote, or approval event.  
**Phases.** 15 and 60.

**Required result.**

- The event is stored in the inbox and the outbox before any push attempt is treated as success.
- If the provider, the device, or the OS permission fails, the in-app notification remains.
- Transient failures retry with backoff and do not create a second logical notification.
- The payload does not contain quote prices or message body text.
- Push delivery status is not the audit source of truth.
- A user who opted out, or who has no device, still has the in-app item when the event is one they are allowed to see.
- A user who is not a participant does not receive the event.

## AC-MOBILE — Deep links and session expiration

**Actors.** A mobile user.  
**Phase.** 61, depending on 05 and 60.

**Required result.**

- Android and iOS builds come from a documented setup. This is not true today.
- Sign-in, sign-out, and session expiry are tested. An expired session shows no protected record.
- A notification tap routes toward the target record and then re-authorizes on the server. The link itself is not a credential.
- Attachment upload can fail and be retried without a duplicate server file or a duplicate business record.
- Role and scope checks match the web rules.
- Push registration stores a device token as a private record. See also AC-PUSH.
- Offline drafts supported by the product remain visibly pending and are never shown as approved or posted.

## AC-FIELD — Field connectivity failure

**Actors.** Site Supervisor.  
**Phases.** 29 and 30.

**Required result.**

- Connectivity drops while a daily report or an expense is being drafted.
- The user closes and reopens the app and the draft is still there.
- Retry uploads the draft. A conflict is visible and is not silently merged into a duplicate posted record.
- The pending item is never labelled approved or posted before the server confirms it.
- Accounting and inventory are not posted from the offline queue.

## AC-BILL — Progress to client bill

**Actors.** Preparer, a different verifier, Accountant & Billing.  
**Phases.** 31 and 50.

**Required result.**

- A measured quantity is prepared, checked, and accepted. Those states stay distinct.
- Project progress updates from accepted quantities.
- An approved client bill references only supported billable quantities and creates one traceable receivable.
- Draft measurements and unreviewed takeoff lines are rejected as billable sources.
- Corrections use revision, credit, reversal, or adjustment. An issued bill is not silently rewritten.

## AC-SUBCON — Subcontractor settlement

**Actors.** Projects Manager and Accountant & Billing.  
**Phase.** 39, depending on 38 and 48–50.

**Required result.**

- An approved measurement calculates agreed value, deductions, and retention.
- Approval posts once to project cost and accounts payable.
- Partial payment is tracked without changing the prior approved amount.
- Retrying approval does not create a second payable.
- Draft claim, approved amount, and paid amount stay distinct.

## AC-TAKEOFF — Takeoff and bar-bending schedule review

**Actors.** An authorized preparer and a qualified reviewer. The reviewer is a person accepted by the company's professional practice. The software role name alone does not make someone qualified.  
**Phases.** 62 and 63, feeding 25 only by explicit action.

**Required result.**

- The drawing or model is stored as a revision.
- Draft output links to the source revision, the location or geometry, the rule version, the units, and the assumptions.
- Machine-extracted, manually corrected, and approved values are labelled separately.
- The reviewer can approve, reject, or edit. Incomplete or unrecognized input cannot be approved.
- Until approval, the result cannot become a BOQ revision, a billable measure, a purchase, or a fabrication instruction.
- After approval, only an explicit action creates a new BOQ revision, which then follows normal BOQ approval.
- Rebar test cases for common slabs, beams, columns, and footings, including shapes, laps, hooks, unit conversion, and rounding, reconcile to independently prepared schedules.
- History is kept when a result is revised.
- A defined reference set of drawings is checked against independently measured quantities. Calibration uncertainty and unsupported symbols stay visible.

## AC-IFC — IFC and clash reproducibility

**Actors.** An authorized user on a project where the module is enabled.  
**Phases.** 64 and 65.

**Required result.**

- Supported sample IFC files render with coordinates and properties that match the fixture. The supported set is not chosen in Phase 01.
- Unsupported or corrupt files fail safely and do not change project data.
- Storage access follows project permissions. Another company cannot read the model.
- A clash run records the exact model revisions, the tolerance, and the units.
- Expected clashes in the fixture are present. Known non-clashes stay absent.
- Results become ordinary permissioned project issues. They do not change a BOQ, contract, or purchase order, and they are not engineering approval.
- Re-running after a new revision keeps the historic run.
- Memory and response are measured against the agreed size ceiling once that ceiling exists. It does not exist yet. See OPEN-01 in [architecture-decisions.md](architecture-decisions.md).

## AC-COUNTRY — Country-specific routing

**Actors.** Platform Owner at onboarding; Company Admin afterward.  
**Phases.** 09, 13, and 53.

**Required result.**

- Legal registration jurisdiction Nepal creates the Nepal compliance profile, NPR, Asia/Kathmandu, and the Nepal settings UI.
- Legal registration jurisdiction India creates the India compliance profile, INR, Asia/Kolkata, and the India settings UI.
- The two profiles do not share one government connector.
- Editing client state, a hidden field, or a route cannot switch the country route.
- After regulated invoices exist, a country change is refused as a casual setting.
- Changing a default currency or timezone does not rewrite posted documents.
- Connection status may be not configured, pending, or active. Before Phase 67, active live submission is impossible, so a company cannot be shown as live-connected to IRD or IRP.
- No live government credential is captured in onboarding.

## AC-TAX — Tax adapter mock tests

**Actors.** The release test, not a production taxpayer.  
**Phase.** 66, against the contract introduced for Phase 53 and exercised for real only in Phase 67.  
**Preconditions.** Production government connectors are disabled.

**Required result.**

- Mock or test adapters prove the internal provider contract, invoice payload preparation, and failure states for Nepal and for India as separate adapters.
- A test failure, timeout, rejection, or duplicate retry does not issue a live document and does not mark a FortSite invoice as government-accepted.
- No secret is written to the browser, a log, or an ordinary profile.
- Phase 66 does not claim that regulatory integration is complete.

## AC-P67 — Phase 67 credential, approval, and go-live gates

**Actors.** Platform or integration operator; the customer's tax administrator; the relevant authority or provider.  
**Phase.** 67 only, after Phase 66.  
**Preconditions.** Phases 01–66 are verified complete. Official documents have been reconfirmed. Eligibility is known for the specific taxpayer. None of those preconditions is true today.

**Required result.**

- Current official requirements are written down with dates and contacts.
- The Nepal IRD/CBMS path and the India GST e-invoice/IRP path are separate adapters. India may be a direct, API-integrator, or other permitted partner route, chosen per supported arrangement, not assumed.
- Sandbox or official test cases pass before any production call.
- A security review confirms that credentials are server-side, encrypted, unlogged, absent from the browser, and not shared across unrelated taxpayers.
- Duplicates, retries, cancellations, credit or debit notes, rejections, and timeouts are covered.
- Issued invoices reconcile to the authority's returned status and identifiers, including QR or IRN where the authority requires them.
- Customer credentials are scoped and audited.
- Written go-live authorization and a rollback and manual fallback are recorded before production is enabled.
- If approval is delayed, the connector stays disabled or pending, the fallback still works, and the rest of FortSite stays usable.
- No later numbered feature phase follows Phase 67.

## AC-CLOSE — Closeout

**Actors.** Projects Manager and Site Supervisor.  
**Phase.** 55.

**Required result.**

- The project shows open inspections and snags, outstanding documents, commissioning status, warranty details, and defect-liability dates before handover.
- Unfinished items remain visible and assigned.
- The handover package and outstanding defects are reportable.
- Final documents keep their permissions and history.
- The record set does not become a facilities-management product.

## AC-EXP — Small site expense

**Actors.** Site Supervisor and a different approver.  
**Phase.** 47, posting in 48.

**Required result.**

- A common small expense can be drafted quickly with amount, currency, category, project, site, and an optional receipt.
- Draft, submitted, approved, and paid are distinct.
- The supervisor does not approve their own expense by default.
- One approved expense produces at most one posting, including under retry.
- A low amount is not automatically approved unless the company has configured an explicit bounded rule.

## Catalogue coverage

| ID | Roadmap or prompt source |
|---|---|
| AC-TENANT | Prompt task 9; roadmap section 8, tenant isolation |
| AC-SUPER | Prompt task 9; roadmap section 8, Super Admin onboarding |
| AC-SUB | Prompt task 9; roadmap section 8, subscription eligibility |
| AC-ROLE | Prompt task 9, role scope |
| AC-DPR | Prompt task 9; roadmap section 8, daily site workflow |
| AC-STOCK | Prompt task 9; roadmap section 8, inventory traceability |
| AC-ACCT | Prompt task 9; roadmap section 8, accounting integrity |
| AC-PROC | Roadmap section 8, material procurement |
| AC-MKT | Prompt task 9; roadmap section 8, marketplace privacy |
| AC-PUSH | Prompt task 9, push failure and in-app fallback |
| AC-MOBILE | Prompt task 9, mobile deep links and session expiration |
| AC-FIELD | Roadmap section 8, field connectivity failure |
| AC-BILL | Roadmap section 8, progress to client bill |
| AC-SUBCON | Roadmap section 8, subcontractor settlement |
| AC-TAKEOFF | Prompt task 9; roadmap section 8, automated takeoff and BBS review |
| AC-IFC | Prompt task 9; roadmap section 8, IFC clash review |
| AC-COUNTRY | Prompt task 9; roadmap section 8, country billing routing |
| AC-TAX | Prompt task 9, tax adapter mock tests |
| AC-P67 | Prompt task 9, Phase 67 gates |
| AC-CLOSE | Roadmap section 8, closeout |
| AC-EXP | Phase 47 exit gate, included so the daily expense path is testable |

All of the above are **not executable**. Status of every related phase is **NOT STARTED**.
