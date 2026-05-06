# Clean Rebuild Phase 5 - My Capture (text core)

This phase adds the first isolated clean capture layer for the family-only rebuild.

## Route decision

The production `/capture` route already exists in the legacy app, so this phase uses an isolated preview route instead:

- `/clean-my-capture`

No production route files were modified.

## Clean evidence service

New clean service files:

- `lib/clean/evidence/types.ts`
- `lib/clean/evidence/client.ts`

The service talks only to the clean table:

- `evidence_entries`

Implemented functions:

- `listCleanEvidenceEntries(familyId, options)`
- `createCleanEvidenceEntry(familyId, input)`
- `updateCleanEvidenceEntry(familyId, entryId, input)`
- `deleteCleanEvidenceEntry(familyId, entryId)`

Service rules:

- every read is scoped by `family_id`
- every write requires `familyId`
- `learner_id` is required and refers only to clean `learners.id`
- `program_id` and `calendar_item_id` are optional clean links only
- there are no page-load writes
- there is no fallback to legacy evidence tables
- schema failures surface as `Clean family schema is not installed yet.`

## Clean My Capture scaffold

New component:

- `app/components/clean/CleanCaptureWorkspace.tsx`

Behavior:

- reads family and learners from `CleanFamilyWorkspaceProvider`
- shows loading, schema-missing, family-required, and learner-required states clearly
- uses a text-first capture form with explicit save only
- supports optional program and calendar linking from the clean services
- supports edit and delete for recent clean capture notes

Form fields:

- learner
- date
- title
- what happened
- reflection
- learning area
- optional program link
- optional calendar link

## Premium placeholders

This phase shows disabled placeholders only for:

- photo upload
- file upload
- audio note

They do not call storage APIs and do not upload anything.

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

Clean Rebuild Phase 6 - My Portfolio foundation
