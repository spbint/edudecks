# Clean Rebuild Phase 6 - Portfolio + Reports foundation

This phase adds the first isolated clean portfolio and reports foundation for the family-only rebuild.

## Route decision

The production `/my-portfolio` and `/my-reports` routes already exist in the legacy app, so this phase uses isolated preview routes instead:

- `/clean-my-portfolio`
- `/clean-my-reports`

No production route files were modified.

## Clean portfolio foundation

New clean service files:

- `lib/clean/portfolio/types.ts`
- `lib/clean/portfolio/client.ts`

The portfolio layer uses only:

- `evidence_entries`
- `portfolio_highlights`

Implemented functions:

- `listCleanPortfolioItems(familyId, options)`
- `listCleanPortfolioHighlights(familyId, options)`
- `createCleanPortfolioHighlight(familyId, input)`
- `updateCleanPortfolioHighlight(familyId, highlightId, input)`
- `deleteCleanPortfolioHighlight(familyId, highlightId)`

Portfolio behavior:

- evidence entries are rendered as simple cards
- cards show learner, date, title or what happened, and learning area
- highlight state is stored in `portfolio_highlights`
- there is no media rendering and no storage usage

## Clean reports foundation

New clean service files:

- `lib/clean/reports/types.ts`
- `lib/clean/reports/client.ts`

The reports layer uses only:

- `reporting_periods`
- `reports`
- `report_sections`

Implemented functions:

- `listCleanReportingPeriods`
- `createCleanReportingPeriod`
- `updateCleanReportingPeriod`
- `deleteCleanReportingPeriod`
- `listCleanReports`
- `createCleanReport`
- `updateCleanReport`
- `deleteCleanReport`
- `listCleanReportSections`
- `upsertCleanReportSection`

Reports behavior:

- create reporting periods explicitly
- create reports explicitly
- edit report sections explicitly
- optional evidence count is shown for the selected learner and reporting period
- there is no narrative generation, no authority logic, and no export layer yet

## Export status

PDF and output/export work is deferred.

This phase does not build:

- PDF export
- HTML export
- DOCX export
- report_exports UI

## Forbidden imports

This phase does not import or depend on:

- `public.students`
- `family_profile_children`
- `parent_student_links`
- `familyLearners`
- `useActiveStudent`
- `familyLearnerService`
- `authority*`
- `report_drafts`
- `planner_blocks`
- `learning_plan_items`
- legacy reporting helpers

## Next recommended phase

Clean Rebuild Phase 7 - Outputs (PDF)
