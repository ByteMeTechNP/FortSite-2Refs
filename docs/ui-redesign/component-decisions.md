# Component decisions

## Local primitives

All screens continue to use the local shadcn/radix primitives under `src/components/ui`. No second component system is installed.

## 21st.dev

Searched only if a documented gap appears during implementation. **Expected gap: none.**

| Candidate | Decision | Reason                                                                                           |
| --------- | -------- | ------------------------------------------------------------------------------------------------ |
| (none)    | N/A      | Local button, dialog, table, badge, input, card, breadcrumb, and alert cover the V3 page grammar |

If a gap appears later, record accept/reject/defer here with license and dependency notes before adapting source into the repo.
