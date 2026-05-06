# Clean Rebuild Phase 9 - Cutover plan

This phase prepares the clean rebuild for final public MyLearna URLs without exposing `/clean` routes as customer-facing navigation.

## Current preview route map

- `/clean`
- `/clean-my-day`
- `/clean-my-calendar`
- `/clean-my-programs`
- `/clean-my-capture`
- `/clean-my-portfolio`
- `/clean-my-reports`
- `/clean-my-outputs`

## Final production route map

- `/my-day`
- `/my-calendar`
- `/my-programs`
- `/my-capture`
- `/my-curriculum`
- `/my-profile`
- `/my-settings`
- `/my-portfolio`
- `/my-reports`
- `/my-outputs`

## Routes that must not show /clean in public

These routes stay available for preview and QA only:

- `/clean`
- `/clean-my-day`
- `/clean-my-calendar`
- `/clean-my-programs`
- `/clean-my-capture`
- `/clean-my-portfolio`
- `/clean-my-reports`
- `/clean-my-outputs`

They must not be added to customer-facing navigation.

## Feature flag strategy

Use:

- `NEXT_PUBLIC_USE_CLEAN_APP=true`

Route entry points check `isCleanAppEnabled()` from `lib/clean/featureFlags.ts`.

If the flag is `false`:

- current production routes continue to render the existing legacy family app
- `/my-capture` redirects to `/capture`
- `/my-outputs` redirects to `/my-reports`
- `/my-profile` redirects to `/profile`
- `/my-settings` redirects to `/settings`

If the flag is `true`:

- `/my-day` renders the clean day workspace
- `/my-calendar` renders the clean calendar workspace
- `/my-programs` renders the clean programs workspace
- `/my-capture` renders the clean capture workspace
- `/my-portfolio` renders the clean portfolio workspace
- `/my-reports` renders the clean reports workspace
- `/my-outputs` renders the clean outputs workspace
- `/my-profile` renders the clean profile workspace
- `/my-settings` renders the clean settings workspace

Current exception:

- `/my-curriculum` is added as the final public URL, but still renders the legacy curriculum workspace until a clean curriculum module exists.

## Schema install prerequisite

Do not enable the clean cutover flag in a shared environment until:

- the clean schema from `sql/clean/20260506_clean_family_schema_v2.sql` is installed
- clean RLS policies are installed
- the bootstrap trigger and owner membership flow are verified

## QA prerequisite

Before any cutover:

- create clean family
- add learner
- create program
- create calendar item
- verify My Day
- create capture note
- verify portfolio
- create reporting period
- create report
- add report section
- preview report
- confirm export event is recorded

## Rollback plan

Rollback is environment-only:

1. set `NEXT_PUBLIC_USE_CLEAN_APP=false`
2. rebuild or redeploy
3. public final URLs return to legacy-backed behavior
4. keep `/clean` and `/clean-*` available for investigation if needed

No route deletion, SQL rollback, or data deletion is required for this rollback path.

## Cutover sequence

1. keep preview routes active
2. install clean schema in the target environment
3. verify RLS manually with at least two users
4. run the clean QA checklist
5. enable `NEXT_PUBLIC_USE_CLEAN_APP=true` in a non-production environment
6. verify final public URLs
7. confirm customer navigation still avoids `/clean`
8. enable the flag in production only after acceptance

## Post-cutover checks

- `/my-day` through `/my-outputs` resolve correctly
- `/clean` routes remain hidden from customer navigation
- no page-load writes occur
- no legacy data tables are queried by clean routes
- `/my-profile` and `/my-settings` no longer redirect
- `/my-capture` and `/my-outputs` work as final public routes
- rollback by environment flag still works
