# FortSite phase status

**Status date:** 26 October 2026.  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md`](../../FortSite_Fresh_Start_Master_Roadmap_V4_Cloud.md).  
**Rule:** a phase is **NOT STARTED**, **IN PROGRESS**, **BLOCKED**, or **VERIFIED COMPLETE**. Do not infer completion from a document, a menu item, or a table.

Phases 02, 03, and 04 are **VERIFIED COMPLETE**. Phase 05 is **IN PROGRESS**. Phase 01 remains **NOT STARTED** pending product-owner sign-off. Phases 06–67 remain **NOT STARTED**.

Phase 01 documents under `docs/fortsite/` are a draft for later sign-off. They do not verify Phase 01 complete. Phase 02 added the web application foundation and package lockfile. Phase 03 added the construction design tokens, local UI primitives, and a development-only gallery. Phase 04 added the public Supabase browser client and the Cloud migration workflow. Phase 05 added Auth screens, applied `user_profiles` after approval, set the approved Auth redirect origin, and ran live Auth/RLS with dedicated Cloud fixtures. Dashboard Site URL / redirect allow-list still needs a manual paste (no MCP Auth writer). It did not create company membership or start Phase 06.

## Why foundations come first

Operational modules trust company identity, role, scope, files, and posted history. If those are unproven, a later screen can appear to work while another tenant reads the data, a retry double-posts stock, or a client-supplied id becomes authority.

The required order is:

1. **Phases 01–17 — foundation.** Agree the product, then the web toolchain, tokens, migration pipeline, Auth, tenancy, Platform Owner boundary, subscription, company roles, approvals, master data, and private files. Do not start dashboards or finance screens while tenancy, RLS, authorization, migrations, and document access are unproven.
2. **Phases 18–34 — a usable building project.** Import starting data, set up projects and an optional building hierarchy, plan work, record daily progress, measure quantities, and close quality and safety issues.
3. **Phases 35–47 — people, suppliers, stock, and equipment.** Prove receiving, issue, and cost on a real movement ledger before treating inventory as an on-hand number.
4. **Phases 48–53 — financial system of record.** Post only through a balanced, idempotent engine, then payables, bills, cash, cost control, and country tax rules. Country rules still do not call a government endpoint.
5. **Phases 54–55 — reporting and handover.** Reports reconcile to source rows. Closeout uses the records already collected.
6. **Phases 56–65 — optional advanced tools.** Marketplace messaging, RFQs, and quotes are a separately entitled add-on. The native app carries push and high-frequency field work. Takeoff, rebar, IFC, and clash are opt-in and stay draft until review. They must not start ahead of the files, BOQ, permissions, and procurement paths they depend on.
7. **Phase 66, then Phase 67.** Phase 66 is the full test, restore, security, and pilot gate, with production government connectors disabled and only test adapters in use. Phase 67 is deliberately last. It is the Nepal IRD/CBMS and India GST e-invoice/IRP integration, and it cannot go live without authority or provider approval and customer eligibility and credentials. No numbered feature phase follows it.

A missing prerequisite stops the dependent phase. Do not skip ahead with a shortcut that weakens tenant isolation or posting integrity.

## Phase register

| Phase | Name | Dependencies | Status | Evidence |
|---:|---|---|---|---|
| 01 | Product charter, workflow requirements and architecture blueprint | None. This is the project starting point. | NOT STARTED | none |
| 02 | Repository bootstrap and engineering standards | Phase 01. | VERIFIED COMPLETE | [`docs/engineering/phase-02-bootstrap.md`](../engineering/phase-02-bootstrap.md); `npm ci`, format check, lint, typecheck, tests, and production build pass |
| 03 | Construction design system and 21st.dev component governance | Phase 02. | VERIFIED COMPLETE | [`docs/engineering/phase-03-design-system.md`](../engineering/phase-03-design-system.md); contrast script, gallery, format/lint/typecheck/tests/build pass |
| 04 | Supabase Cloud/MCP environments, migrations and deployment controls | Phases 01–02. | VERIFIED COMPLETE | [`docs/engineering/phase-04-supabase.md`](../engineering/phase-04-supabase.md); MCP identity reads; format/lint/typecheck/tests/build/secret scan pass; no remote write |
| 05 | Authentication, profiles and session lifecycle | Phases 02 and 04. | IN PROGRESS | [`docs/fortsite/authentication.md`](authentication.md); [`docs/engineering/phase-05-auth.md`](../engineering/phase-05-auth.md); `user_profiles` applied (`20261026170211`); `VITE_AUTH_REDIRECT_ORIGIN=http://127.0.0.1:5173`; live RLS 8/8; dashboard Auth URL allow-list paste still open |
| 06 | Company tenancy, memberships and tenant-safe data foundations | Phases 04–05. | NOT STARTED | none |
| 07 | Secure platform-owner identity and privileged operations boundary | Phases 04–06. | NOT STARTED | none |
| 08 | Super Admin panel shell and platform overview | Phases 02–03 and 07. | NOT STARTED | none |
| 09 | Company onboarding and lifecycle management | Phases 06–08. | NOT STARTED | none |
| 10 | Subscription plans, entitlements and manual payment records | Phases 07–09. | NOT STARTED | none |
| 11 | Platform audit, settings and support operations | Phases 07–10. | NOT STARTED | none |
| 12 | Company roles, project/site scope and permission matrix | Phases 05–07 and 09. | NOT STARTED | none |
| 13 | Company first-run setup and company settings | Phases 06, 09 and 12. | NOT STARTED | none |
| 14 | Company workspace shell and role-based home screens | Phases 03, 05, 06, 12 and 13. | NOT STARTED | none |
| 15 | Approvals, notifications and company activity history | Phases 06, 11–14. | NOT STARTED | none |
| 16 | Shared master data, units, categories and cost codes | Phases 06, 12–13. | NOT STARTED | none |
| 17 | Secure document, drawing, photo and attachment storage | Phases 04, 06, 12 and 14. | NOT STARTED | none |
| 18 | Spreadsheet import, data export and migration utilities | Phases 12–17. | NOT STARTED | none |
| 19 | Project portfolio, projects and sites | Phases 06, 12–16. | NOT STARTED | none |
| 20 | Building, block, floor, unit and work-area hierarchy | Phase 19. | NOT STARTED | none |
| 21 | Client, consultant and vendor contact register with simple proposals | Phases 13, 16–19. | NOT STARTED | none |
| 22 | Work breakdown structure, work packages and project cost codes | Phases 16, 19–20. | NOT STARTED | none |
| 23 | Task assignment and accountability | Phases 14–16 and 19–22. | NOT STARTED | none |
| 24 | Rate library for materials, labour, equipment and work items | Phases 16, 19 and 22. | NOT STARTED | none |
| 25 | BOQ, quantities, estimates and revision history | Phases 16, 18, 22 and 24. | NOT STARTED | none |
| 26 | Project budget and approved baseline | Phases 15, 22, 24–25. | NOT STARTED | none |
| 27 | Contracts, work orders, variations and change orders | Phases 15, 19, 22, 25–26. | NOT STARTED | none |
| 28 | Practical schedule and weekly look-ahead | Phases 22–23 and 25–27. | NOT STARTED | none |
| 29 | Mobile-first field workspace and bounded offline drafts | Phases 03–05, 14–17, 19 and 23. | NOT STARTED | none |
| 30 | Daily progress report and site diary | Phases 15, 17, 19, 23, 28–29. | NOT STARTED | none |
| 31 | Measured quantities and progress against BOQ | Phases 15, 17, 22, 25, 28–30. | NOT STARTED | none |
| 32 | Issues, delays, snag lists and corrective actions | Phases 17, 19–20, 23 and 29–31. | NOT STARTED | none |
| 33 | Quality inspections, testing and commissioning checklists | Phases 17, 19–20, 29–32. | NOT STARTED | none |
| 34 | Practical safety and permit register | Phases 17, 19, 23 and 29. | NOT STARTED | none |
| 35 | Employee, worker and crew register | Phases 12–16 and 19. | NOT STARTED | none |
| 36 | Attendance, muster, shifts and overtime records | Phases 15, 19, 29 and 35. | NOT STARTED | none |
| 37 | Labour costs, wages, advances and allowances | Phases 16, 19, 35–36 and 48. | NOT STARTED | none |
| 38 | Subcontractor agreements and work orders | Phases 15–17, 19, 22 and 27. | NOT STARTED | none |
| 39 | Subcontractor measurements, claims and settlements | Phases 15, 27, 38 and 48–50. | NOT STARTED | none |
| 40 | Equipment and vehicle register | Phases 16, 19 and 21. | NOT STARTED | none |
| 41 | Equipment utilization, fuel, maintenance and cost | Phases 15, 19, 40 and 48. | NOT STARTED | none |
| 42 | Materials catalogue and specifications | Phases 16–19, 21 and 24. | NOT STARTED | none |
| 43 | Site stores, store locations and inventory ledger | Phases 06, 15–17, 19 and 42. | NOT STARTED | none |
| 44 | Stock issue, consumption, return, count and waste | Phases 15, 19, 29–30 and 42–43. | NOT STARTED | none |
| 45 | Material requisitions and procurement quote capture | Phases 15–16, 19, 21 and 42–44. | NOT STARTED | none |
| 46 | Purchase orders, commitments and receiving | Phases 15–16, 19, 42–45 and 48. | NOT STARTED | none |
| 47 | Site expenses, petty cash, advances and reimbursements | Phases 15, 17, 19 and 48–51. | NOT STARTED | none |
| 48 | Native double-entry accounting and posting engine | Phases 04, 06, 10–16 and the first operational financial workflows. | NOT STARTED | none |
| 49 | Supplier invoices and accounts payable | Phases 15, 21, 46–48. | NOT STARTED | none |
| 50 | Client billing, progress bills and accounts receivable | Phases 15, 25–27, 31 and 48. | NOT STARTED | none |
| 51 | Cash, bank, payment allocation and reconciliation | Phases 15, 48–50. | NOT STARTED | none |
| 52 | Integrated budget, commitments, actual cost and simple forecast | Phases 22, 25–27, 37–51. | NOT STARTED | none |
| 53 | Nepal/India tax, invoice and document rules | Phases 13 and 48–51. | NOT STARTED | none |
| 54 | Role dashboards, operational reports and safe exports | Relevant source phases 15–53. | NOT STARTED | none |
| 55 | Project closeout, handover, warranties and defect liability | Phases 17, 20, 32–34, 38–39 and 54. | NOT STARTED | none |
| 56 | Supplier Marketplace add-on: supplier profiles, product catalogue and moderation | Phases 05–12, 14, 16–17, 21 and 42–46. | NOT STARTED | none |
| 57 | Marketplace in-app messaging and conversation controls | Phases 06, 12, 17 and 56. | NOT STARTED | none |
| 58 | Managed RFQ creation, supplier invitations and deadlines | Phases 15–17, 21, 42, 45, 56–57. | NOT STARTED | none |
| 59 | Structured supplier quote submission, comparison and selection | Phases 25–27, 45–52, 56 and 58. | NOT STARTED | none |
| 60 | Notification centre, delivery outbox and mobile push service | Phases 05–06, 15 and 57–59. | NOT STARTED | none |
| 61 | React Native/Expo mobile companion app | Phases 02–05, 12, 14, 17, 23, 29–30, 35–36 and 56–60. | NOT STARTED | none |
| 62 | Drawing-based automated quantity takeoffs | Phases 17, 20, 22, 25, 31 and 42. | NOT STARTED | none |
| 63 | Automated rebar quantities and bar-bending schedules | Phases 16–17, 20, 22, 24–26, 31 and 62. | NOT STARTED | none |
| 64 | IFC model import, model viewer and revision management | Phases 17, 20, 22, 25 and 32. | NOT STARTED | none |
| 65 | BIM/IFC clash detection and coordination workflow | Phases 17, 32–33 and 64. | NOT STARTED | none |
| 66 | Complete end-to-end validation, restore drills, pilot and release readiness | Phases 01–65. Government production connectors remain disabled; use test adapters and fixtures. | NOT STARTED | none |
| 67 | FINAL: Nepal IRD/CBMS and India IRP government billing integrations | Phases 09, 13, 48–54 and 66. Live activation also requires an approved authority or provider path and applicable credentials. | NOT STARTED | none |

Count: 67 phases. Status count: 63 NOT STARTED, 1 IN PROGRESS (Phase 05), 0 BLOCKED, 3 VERIFIED COMPLETE (Phases 02–04).

Phase 67 is the final numbered phase. Its dependency list includes Phase 66. Phase 66 cannot enable production government connectors.

## Phase 01 exit criteria

Phase 01 may be marked **VERIFIED COMPLETE** only when all of the following are true. Writing the files is not sufficient.

- The documents under `docs/fortsite/` agree with fresh-start baseline 3.0.
- Every core workflow has a measurable acceptance scenario in [acceptance-catalogue.md](acceptance-catalogue.md).
- Every in-scope feature is classified as core, separately entitled add-on, specialist opt-in, release gate, or final regulatory phase, and maps to a phase in [domain-map.md](domain-map.md).
- Every excluded capability is marked out of scope and has no phase and no placeholder navigation.
- The product described is practical construction management for apartments, villas, small townships, restaurants, hotels, and warehouses in Nepal and India.
- Live Nepal IRD/CBMS and India GST e-invoice/IRP integration is Phase 67, after Phase 66.
- The Supabase organization and project are recorded exactly as `FortSite - 2Merged`, as names only.
- Security boundaries, data integrity, and engineering traceability are explicit in [architecture-decisions.md](architecture-decisions.md) and [user-workflows.md](user-workflows.md).
- A product owner has signed off on the scope.

Until that sign-off, Phase 01 remains **NOT STARTED**.

## Phase 01 blockers

| Blocker | Effect |
|---|---|
| No product-owner sign-off on scope. | Phase 01 cannot be verified complete. Later phases must not treat this draft as signed approval. |
| No product-owner sign-off remains the Phase 01 gate. Project ref `rvfoveqprrtobmywaodf` was verified in Phase 04. | Phase 01 still needs sign-off. Phase 05 remains IN PROGRESS until the approved Auth Site URL / redirect allow-list is pasted in the Supabase dashboard. |
| Open decisions OPEN-01 through OPEN-15 in [architecture-decisions.md](architecture-decisions.md). | They block only the phase named beside each decision. They do not block writing this documentation. Specialist limits, engineering standards, the notification provider, data residency, and the official IRD and IRP routes stay unresolved. |

## What this register is not

It is not a statement that business features work. Phase 02 completion is only the web foundation. It is not permission to start Phase 03 or later without their own gates. It is not a remote Supabase configuration.
