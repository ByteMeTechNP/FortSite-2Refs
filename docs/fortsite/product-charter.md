# FortSite product charter

**Status:** Proposed product definition. Not a claim that any phase is built, certified, or compliant.  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V3.md`](../../FortSite_Fresh_Start_Master_Roadmap_V3.md).  
**Phase:** 01 — Product charter, workflow requirements and architecture blueprint. **NOT STARTED** until a product owner signs off on this scope. See [phase-status.md](phase-status.md).

## Product

FortSite is a practical construction management and ERP platform for companies that develop and build apartments, villas, small townships, restaurants, hotels, and warehouses in Nepal and India.

The core product helps a company control work, materials, people, procurement, and project finances through one connected data model. It is a working system for building teams, not a showcase of specialist enterprise technology.

A web application serves administration, finance, and model review. A separate mobile companion application is planned for high-frequency field work and push notifications. Supplier Marketplace is a separately entitled add-on. Automated quantity takeoffs, rebar schedules, IFC viewing, and clash detection are opt-in specialist modules. Live government billing connectors are the final numbered phase.

Nothing in this charter is implemented.

## Who it is for

Primary users are building developers and contractors, and the people who run their projects:

- Platform Owner, for company onboarding and subscription control.
- Company Admin, Projects Manager, Site Supervisor, Accountant & Billing, and Inventory Manager, inside one company.
- Supplier account holders and invited supplier users, only when the marketplace add-on is entitled and only for their own supplier records.

Role boundaries, prohibited actions, and the separation of identity, membership, role, scope, and assignment are defined in [user-workflows.md](user-workflows.md).

## Building types the product must fit

The same company data model must support these building types without forcing specialist structure onto a small job:

| Building type | Practical expectation |
|---|---|
| Apartment | Blocks or buildings, floors, units, common areas, repeated trades, progress billing against measured work. |
| Villa | A short hierarchy. A single building may skip blocks, floors, and a full unit register. |
| Small township | Several buildings or sites under one project, with shared materials, crews, and cost codes. |
| Restaurant | Fit-out and building work, inspections, and handover. No hospitality operations suite. |
| Hotel | Floors, rooms or zones, commissioning, and defect liability. No property-management product. |
| Warehouse | Sites, stores, large areas, materials, and equipment. No industrial-plant or production system. |

A project may have one site or many. A company may have many projects. Map, GIS, and chainage surveying are out of scope.

## What the core product must control

These capabilities are core. Each one maps to a phase in [domain-map.md](domain-map.md). None is built.

- Platform Owner onboarding of companies, and subscription control with manual payment records.
- Company tenancy, membership, five primary company roles, and project/site scope.
- Projects, sites, and an optional building hierarchy (block, floor, unit, room or zone, work area).
- Tasks, a practical schedule, BOQ and estimates, budgets, contracts and variations, daily progress, and measured progress.
- Workforce, attendance, labour-cost tracking, subcontractors, equipment, materials, site stores, and procurement.
- Expenses, native double-entry accounting, accounts payable and receivable, payments and reconciliation, project cost control, and reports.
- Basic building quality, safety, commissioning, handover, and defects.
- Private document, drawing, photo, and attachment storage.
- Spreadsheet import and safe export.
- Country-aware company setup for Nepal or India, including invoice and tax data models. Live government submission is not part of the core build sequence before Phase 67.

## Separately entitled add-on — Supplier Marketplace

Marketplace is optional. A company without the entitlement does not see it, and internal procurement still works without it.

In scope for the add-on:

- Supplier profiles and listings.
- Buyer–supplier in-app messaging.
- Managed requests for quotation.
- Supplier-specific quote submission and revisions.
- Buyer quote comparison.
- Notification inbox, and push through the mobile app.

The marketplace path is: discover a supplier, then message; turn an internal material need into an approved RFQ; invite suppliers; collect supplier-specific responses; compare quotes in a structured way; record an authorized selection; create a purchase order only through the normal procurement workflow, as an explicit authorized action.

A listing, message, RFQ, or quote does not create a purchase order, a payable, or a stock movement. One supplier cannot see another supplier's quote. The marketplace is not a payment processor. It has no commission ledger, no automatic award, no automatic purchase order, no automatic payable, and no automatic stock movement.

## Specialist opt-in modules

These modules are in scope and must not be forced onto ordinary projects. They do not replace signed engineering judgement.

**Automated quantity takeoffs and automated rebar quantities / bar-bending schedules.** Output is a draft. Each result traces to the source drawing or model revision, the calculation rules, the units, and the assumptions. A qualified person reviews and may correct it. Only an approved version may be copied into a BOQ revision by an explicit action. Unreviewed output is not billable and is not an approved structural or fabrication instruction. Manual BOQ entry and import remain usable without these modules.

**IFC model import, viewer, and clash detection.** These are opt-in. They must be tested with representative model sizes. Supported IFC versions and model-size ceilings are unresolved; see [architecture-decisions.md](architecture-decisions.md). Heavy geometry processing is not assumed to run inside Supabase Edge Functions. Clash results can be wrong in both directions and do not approve a design.

## Country onboarding and government billing

Legal registration country is captured at company onboarding and creates either a Nepal compliance profile and UI or an India compliance profile and UI. Nepal and India do not share one undifferentiated government billing connector.

- Nepal defaults: NPR and Asia/Kathmandu.
- India defaults: INR and Asia/Kolkata.
- Do not convert currencies or add unlike currencies into one total.
- Changing a default never rewrites prior transactions.
- Changing legal jurisdiction after regulated invoices exist requires a controlled migration and legal-entity workflow.

Phases 09 and 13 store profile and eligibility metadata only. They do not collect live government credentials. Phase 53 adds country-specific invoice and tax rules after qualified local review, still with no live government endpoint. Phase 66 proves the platform, including mock or test adapter contracts, before any live connector. Phase 67 is the final numbered phase. It coordinates the official Nepal IRD/CBMS path and the official India GST e-invoice/IRP path, sandbox, credentials, testing, approval, and a production pilot.

The live integration cannot be claimed complete without the relevant authority or provider approval and the customer's eligibility and credentials. If that approval is delayed, the connector stays disabled or pending and an approved manual or export fallback remains available. Delay must not block the rest of the construction ERP.

Do not hard-code one country's tax logic into the other. Do not create fake compliance assurances.

## Explicitly out of scope

These items have no delivery phase and must not appear as navigation, schema, or marketing promises:

- GIS and chainage surveying.
- Monte Carlo risk modelling.
- AI-first workflows, AI-generated daily reports, AI pricing, AI supplier selection, and predictive maintenance.
- Carbon and ESG accounting.
- Roads, hydropower, industrial EPC, quarry, and ready-mix concrete production.
- Face recognition, biometric attendance, geofencing as a default, IoT, and telematics.
- Full statutory payroll, income-tax withholding, and social-security contribution engines.
- Full facilities management, tenant service desk, and property-owner CRM.
- Real-estate buyer CRM and installment sales.
- Marketplace payments, commissions, automatic supplier order placement, automatic purchase orders from quotes, and automatic stock movements from marketplace activity.
- A universal no-code workflow engine, a custom database designer, a data warehouse, and a no-code BI builder.
- A full legal contract-drafting suite and an electronic-signature provider, unless a later business decision approves one.
- Payment-card storage and a payment gateway. Phase 10 records subscription payments manually until a separate business decision.
- Bank-credential access and automatic bank feeds, unless a separate decision approves feeds.
- Scraping government portals, bypassing MFA, OTP, or authorization, and sharing credentials across unrelated taxpayers.
- Claiming that FortSite is government-certified, formally tax-compliant, or a substitute for signed engineering judgement.

Reconsider any additional specialist capability only after real customer evidence, a separate business decision, and a dedicated scope and acceptance plan.

## Authority in one paragraph

Platform Owner has the highest platform authority: onboard companies, invite the first Company Admin, manage subscription plans, status, and terms, and record subscription payments and adjustments. That authority does not include routine access to private company operational data, marketplace messages, quotes, project files, or tax credentials. Company Admin manages one company's profile, users, policy, and settings, and cannot administer the platform. Operational roles act only inside granted company, project, and site scope. Supplier users act only on records explicitly associated with their supplier account. Details and prohibited actions are in [user-workflows.md](user-workflows.md).

## What "done" means

A phase is not done because a screen or table exists. It is done when its security, workflow, failure, and acceptance tests pass, and when [phase-status.md](phase-status.md) records **VERIFIED COMPLETE** with linked evidence.

Global checks that apply when a phase is later implemented are listed in roadmap section 6: realistic acceptance data, typecheck and tests, reviewed migrations with RLS and Storage policies, negative permission tests, failure and retry states, audit history, idempotent financial and stock posting, accessible UI, rollback notes, and an honest status label.

Usability, security, engineering traceability, and data integrity outrank feature count.

## Phase 01 boundary

This charter is documentation. It does not authorize Phase 02 or any later phase to start inside the Phase 01 change. Product-owner sign-off on scope is still required before Phase 01 itself can be marked verified complete.
