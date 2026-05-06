# Clean Rebuild Phase 3 - My Calendar + My Day Foundation

This phase adds the first isolated daily-planning layer for the clean family-only rebuild.

## Route decision

Production routes for `/my-day` and `/my-calendar` already exist in the legacy app, so this phase uses isolated preview routes instead:

- `/clean-my-calendar`
- `/clean-my-day`

No production route files were modified.

## Clean calendar service

New clean service files:

- `lib/clean/calendar/types.ts`
- `lib/clean/calendar/client.ts`

The service talks only to the clean `calendar_items` table.

Implemented functions:

- `listCleanCalendarItems(familyId, options)`
- `createCleanCalendarItem(familyId, input)`
- `updateCleanCalendarItem(familyId, calendarItemId, input)`
- `deleteCleanCalendarItem(familyId, calendarItemId)`

Service rules:

- every read is scoped by `family_id`
- every write requires `familyId`
- `learner_id` is optional and refers only to clean `learners.id`
- there are no page-load writes
- there is no fallback to legacy planning tables
- schema failures surface as `Clean family schema is not installed yet.`

## Clean My Calendar scaffold

New component:

- `app/components/clean/CleanCalendarWorkspace.tsx`

Behavior:

- reads family and learners from `CleanFamilyWorkspaceProvider`
- shows loading, schema-missing, family-required, and learner-required states clearly
- loads clean calendar items with explicit reads only
- uses a simple add/edit form with:
  - title
  - planned date
  - learner selector
  - description
- supports explicit save only
- supports basic edit and delete
- includes a manual refresh action

This scaffold does not use:

- legacy planner helpers
- old calendar components
- templates
- recurring events
- drag/drop
- program placement

## Clean My Day scaffold

New component:

- `app/components/clean/CleanDayWorkspace.tsx`

Behavior:

- reads family and learners from `CleanFamilyWorkspaceProvider`
- derives today's view from clean `calendar_items`
- filters by:
  - all family
  - individual learner
- shows today's planned items only
- shows the empty state:
  - `Nothing planned for today yet.`
- links directly to `/clean-my-calendar`

## Forbidden imports

This phase does not import or depend on:

- `useActiveStudent`
- `familyLearners`
- `familyLearnerService`
- `familyPlanner`
- `familyPlanningTemplates`
- `authority*`
- `exports*`
- `children/[id]`
- `start`
- `onboarding*`
- `community*`
- progress/intervention/cohort/ranking helpers
- `public.students`
- `family_profile_children`
- `parent_student_links`
- `planner_blocks`
- `report_drafts`
- `learning_plan_items`

## Next recommended phase

Clean Rebuild Phase 4 - My Programs Foundation
