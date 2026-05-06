# Clean Rebuild Phase 7 - Outputs foundation

This phase adds the first isolated clean outputs layer for the family-only rebuild.

## Route decision

The production outputs route is not touched in this phase.

This phase uses the isolated preview route:

- `/clean-my-outputs`

No production route files were modified.

## Outputs model

The clean outputs layer uses:

- `reports`
- `report_sections`
- `reporting_periods`
- `report_exports`

The preview and export actions are intentionally separate.

- Preview renders a report in simple HTML using clean report data.
- Export records a `report_exports` row only.

This phase does not generate a file.

## Clean outputs service

New clean service files:

- `lib/clean/outputs/types.ts`
- `lib/clean/outputs/client.ts`

Implemented functions:

- `createCleanReportExport(familyId, input)`
- `listCleanReportExports(familyId, reportId)`

The outputs service uses only `report_exports` and does not call external services.

## Preview behavior

New clean component:

- `app/components/clean/CleanReportPreview.tsx`

The preview renders:

- report title
- learner
- reporting period
- report sections

The preview is intentionally simple HTML only and does not try to simulate final PDF formatting.

## Outputs workspace behavior

New clean component:

- `app/components/clean/CleanOutputsWorkspace.tsx`

The workspace:

- uses the clean family workspace provider
- loads clean reports, reporting periods, report sections, and report export history
- allows learner selection
- allows report selection
- previews the selected report
- records an export when the user clicks `Export Report`

Recording an export creates a clean `report_exports` row and shows a success message. No file is generated in this phase.

## Export status

This phase does not build:

- PDF generation
- HTML file export
- DOCX export
- storage uploads
- external service calls

## Forbidden imports

This phase does not import or depend on:

- `public.students`
- `family_profile_children`
- `parent_student_links`
- `familyLearners`
- `useActiveStudent`
- `familyLearnerService`
- `authority*`
- legacy export helpers
- legacy report helpers
- `report_drafts`
- `planner_blocks`
- `learning_plan_items`

## Next recommended phase

Clean Rebuild Phase 8 - PDF export engine
