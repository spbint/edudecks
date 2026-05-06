# Clean Rebuild Phase 8 - Parallel launch readiness

This phase keeps the old app active while the clean rebuild runs in parallel.

## A. Parallel launch strategy

- the current production app stays active
- the clean rebuild is available through isolated preview routes
- navigation is not switched in this phase
- gradual replacement happens later after QA and RLS verification

## B. Clean route list

Preview routes:

- `/clean`
- `/clean-my-day`
- `/clean-my-calendar`
- `/clean-my-programs`
- `/clean-my-capture`
- `/clean-my-portfolio`
- `/clean-my-reports`
- `/clean-my-outputs`

Clean-backed foundation routes:

- `/my-profile`
- `/my-settings`

## C. Production route list (unchanged)

The customer-facing production route map is unchanged in this phase. The old app remains the active system.

Current production-facing routes still include:

- `/my-day`
- `/my-calendar`
- `/my-programs`
- `/capture`
- `/my-portfolio`
- `/my-reports`
- `/curriculum`
- `/family`
- `/profile`
- `/settings`

## D. QA checklist

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
- confirm export report event is recorded

## E. RLS verification checklist

- verify cross-user isolation on `family_profiles`
- verify cross-user isolation on `family_members`
- verify cross-user isolation on `learners`
- verify cross-user isolation on `programs`
- verify cross-user isolation on `program_segments`
- verify cross-user isolation on `calendar_items`
- verify cross-user isolation on `evidence_entries`
- verify cross-user isolation on `portfolio_highlights`
- verify cross-user isolation on `reporting_periods`
- verify cross-user isolation on `reports`
- verify cross-user isolation on `report_sections`
- verify cross-user isolation on `report_exports`
- confirm no global reads
- confirm no unauthorized writes

## F. Cutover readiness checklist

- all clean modules implemented
- UI parity is acceptable for launch
- manual QA passes across the clean route set
- RLS checks pass
- no legacy dependency remains in clean routes
- no hidden fallback to legacy data exists

## G. Rollback plan

- keep old routes active
- keep clean routes manual-only or developer-only until approved
- disable clean navigation entry if issues are found
- leave production navigation untouched
- no data loss because no destructive cutover happens in this phase

## Manual access note

This phase does not add a customer-facing entry point.

Use `/clean` as the manual launch point for internal review and gradual launch testing.
