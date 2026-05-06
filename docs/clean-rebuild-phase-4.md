# Clean Rebuild Phase 4 - My Programs Foundation

This phase adds the first isolated clean programs layer for the family-only rebuild.

## Route decision

The production `/my-programs` route already exists in the legacy app, so this phase uses an isolated preview route instead:

- `/clean-my-programs`

No production route files were modified.

## Clean programs service

New clean service files:

- `lib/clean/programs/types.ts`
- `lib/clean/programs/client.ts`

The service talks only to the clean tables:

- `programs`
- `program_segments`

Implemented program functions:

- `listCleanPrograms(familyId, options)`
- `createCleanProgram(familyId, input)`
- `updateCleanProgram(familyId, programId, input)`
- `deleteCleanProgram(familyId, programId)`

Implemented segment functions:

- `listCleanProgramSegments(familyId, programId)`
- `createCleanProgramSegment(familyId, programId, input)`
- `updateCleanProgramSegment(familyId, segmentId, input)`
- `deleteCleanProgramSegment(familyId, segmentId)`

Service rules:

- every read is scoped by `family_id`
- every write requires `familyId`
- `learner_id` is optional and refers only to clean `learners.id`
- there are no page-load writes
- there is no fallback to legacy planning tables
- schema failures surface as `Clean family schema is not installed yet.`

## Clean My Programs scaffold

New component:

- `app/components/clean/CleanProgramsWorkspace.tsx`

Behavior:

- reads family and learners from `CleanFamilyWorkspaceProvider`
- shows loading, schema-missing, family-required, and learner-required states clearly
- loads clean programs only
- uses a simple program list and detail flow
- supports explicit create, update, and delete for programs
- supports explicit create, update, and delete for program segments

Program fields:

- title
- learner/family scope
- learning area
- description

Segment fields:

- title
- segment order
- notes

## Calendar handoff

Program to calendar linking is intentionally deferred.

This is Phase 4B work, not part of this foundation pass.

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

Clean Rebuild Phase 5 - My Capture (text)
