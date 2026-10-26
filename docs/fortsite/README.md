# FortSite product and architecture documents

**Status:** Phase 01 documentation draft. No phase is complete.  
**Canonical plan:** [`FortSite_Fresh_Start_Master_Roadmap_V3.md`](../../FortSite_Fresh_Start_Master_Roadmap_V3.md) (fresh-start baseline 3.0, planning date 26 October 2026).  
**Planning date of these documents:** 26 October 2026.

These files define what FortSite is intended to become. They are not evidence that any feature, table, policy, screen, or integration exists.

## Zero state

FortSite starts from zero.

- The Git repository has no application source, package manifest, component library, role system, or completed phase.
- The designated Supabase project is treated as empty. There is no schema, migration history, Auth setup, RLS policy, Storage bucket, Edge Function, or Realtime configuration to preserve.
- Do not import or assume a prior FortSite implementation or legacy database design.
- Do not reset the empty Supabase project. Later phases build it through versioned migrations.
- All 67 phases are **NOT STARTED**. See [phase-status.md](phase-status.md).

Phase 01 creates and verifies these documents only. It does not scaffold the React application, install packages, write SQL, configure Auth, create buckets, deploy functions, or link or mutate the remote Supabase project.

## Designated Supabase target

Recorded for later phases. These are human-readable names, not technical identifiers.

| Item | Exact name |
|---|---|
| Supabase organization | `FortSite - 2Merged` |
| Supabase project | `FortSite - 2Merged` |

These names are not a project ref, an organization ID, a database credential, or proof that a remote project has been linked. This phase does not sign in to, inspect, configure, or mutate that organization or project. Do not invent a project ref, organization ID, URL, API key, password, or other identifier. Obtain any required technical identifier from the Supabase dashboard only when a later phase explicitly requires it.

## How to use these documents

Later phases must read the relevant document before writing code, and must not treat an older conversation as proof of current state. If a prerequisite phase is not verified complete, stop and report the blocker. Do not add a placeholder navigation item, schema, or marketing promise for a feature that is not in the current phase.

| Document | Use it for |
|---|---|
| [product-charter.md](product-charter.md) | Who the product is for, what is in scope, what is an add-on, what is specialist, and what is out of scope. |
| [user-workflows.md](user-workflows.md) | Actors, prohibited actions, and the practical workflows a phase must support. |
| [architecture-decisions.md](architecture-decisions.md) | Confirmed stack and security decisions, and decisions that are still open. |
| [domain-map.md](domain-map.md) | Data domains, future route zones, and the phase that owns each in-scope feature. |
| [acceptance-catalogue.md](acceptance-catalogue.md) | Measurable scenarios. None of them are executable yet. |
| [risk-register.md](risk-register.md) | Open risks and the phase intended to mitigate each one. |
| [phase-status.md](phase-status.md) | Dependency order and the status of every phase. |

## Status vocabulary

Use only these labels, and only with linked evidence when a phase leaves NOT STARTED:

- **NOT STARTED**
- **IN PROGRESS**
- **BLOCKED**
- **VERIFIED COMPLETE**

A screen, table, or menu item does not make a phase complete. A phase is complete when its security, workflow, failure, and acceptance tests pass and the evidence is recorded.

## Change control

Each later phase is implemented and reviewed separately. A request to add a feature must name the target user, the field problem, frequency, data owner, dependency, UX impact, security scope, acceptance tests, and whether it is core or add-on. "Start from scratch" in the roadmap does not authorize deletion of production data.
