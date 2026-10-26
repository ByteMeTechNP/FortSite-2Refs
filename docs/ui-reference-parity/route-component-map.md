# Route and component map

Target route table is unchanged. Reference routes are an inventory. Status is `MATCHED`, `PARTIAL`, or `DEFERRED`.

| Target route                              | Reference screen                          | Status  | Notes                                                                                                                                                                                                             |
| ----------------------------------------- | ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                       | none                                      | PARTIAL | Foundation scaffold. Type and color follow the reference. Copy stays the target scaffold text.                                                                                                                    |
| `/auth/login`                             | `/super-admin/login`                      | PARTIAL | Centered `max-w-md` card, Hammer tile, reference field stack. Target sign-in, validation, and redirect stay. No bootstrap RPC or bootstrap link.                                                                  |
| `/auth/forgot-password`                   | none                                      | PARTIAL | Same auth card. Target recovery handler stays.                                                                                                                                                                    |
| `/auth/reset-password`                    | none                                      | PARTIAL | Same auth card. Target reset handler stays.                                                                                                                                                                       |
| `/auth/callback`                          | none                                      | PARTIAL | Same auth card. Target callback stays.                                                                                                                                                                            |
| `/auth/accept-invitation`                 | `/company-admin/accept-invite`            | PARTIAL | Retired target page keeps its message. Invitation acceptance is not restored.                                                                                                                                     |
| `/auth/change-initial-password`           | none                                      | PARTIAL | Same auth card. Gate stays non-dismissible.                                                                                                                                                                       |
| `/account`                                | none                                      | PARTIAL | Reference page header and account card. Target profile and subscription summary stay.                                                                                                                             |
| `/platform/unauthorized`                  | `/super-admin/unauthorized`               | PARTIAL | Centered reference composition. Target denial copy and links stay. No reference sign-out RPC.                                                                                                                     |
| `/platform`                               | `/super-admin` dashboard                  | PARTIAL | Page header and `text-2xl` metric cards for real company and subscription counts. Errors use `ErrorState`. Phase 11 events stay unavailable. No marketplace or ticket metrics.                                    |
| `/platform/companies`                     | `/super-admin/companies`                  | PARTIAL | Reference table, search, and country filter. Status filter stays the query the target already supports. No extra filters. No pagination control, because this list is not paged.                                  |
| `/platform/companies/new`                 | `/super-admin/companies/new`              | PARTIAL | Reference form chrome and step pills. Target wizard keeps email, initial password, subscription intent, and the one-time password dialog. It is not collapsed to the reference three steps. No invitation fields. |
| `/platform/companies/:companyId`          | `/super-admin/companies/:companyId`       | PARTIAL | Reference header, badges, and form spacing. Lifecycle actions keep the target confirmation phrase.                                                                                                                |
| `/platform/plans`                         | Plans tab of `/super-admin/subscriptions` | PARTIAL | Reference tabs link to the existing plans and subscriptions URLs. Plan form and table keep Phase 10 handlers.                                                                                                     |
| `/platform/plans/:planId`                 | none (detail is inline in the reference)  | PARTIAL | Reference form and card spacing. Target version rules stay.                                                                                                                                                       |
| `/platform/subscriptions`                 | Subscriptions tab                         | PARTIAL | Reference tabs and table. Status filters the target already supports stay.                                                                                                                                        |
| `/platform/subscriptions/:subscriptionId` | payments are a separate reference page    | PARTIAL | Reference form arrangement around the existing payment and adjustment handlers. No gateway. Payments do not extend terms.                                                                                         |
| `/__dev/design-system`                    | none                                      | PARTIAL | Dev gallery consumes the pinned tokens.                                                                                                                                                                           |
| `*` and unknown `/platform/*`             | not-found                                 | MATCHED | `text-2xl` title, muted description, button back to the target home.                                                                                                                                              |

## Deferred reference screens

These stay in the copied nav config or company-admin shell and are not linked and not routed.

- `/super-admin/users`
- `/super-admin/payments` as its own page (payment forms live on the existing subscription detail route)
- `/super-admin/marketplace/*`
- `/super-admin/usage`
- `/super-admin/audit-logs`
- `/super-admin/support` and `/super-admin/support/:ticketId`
- `/super-admin/settings`
- `/super-admin/bootstrap`
- `/company-admin/login`
- `/company-admin/accept-invite` (not restored)
- `/company-admin` and profile, subscription, team, projects, sites, settings
