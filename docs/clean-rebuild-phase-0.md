# Clean Rebuild Phase 0

This document defines the isolated family-only foundation for the clean MyLearna rebuild.

## Phase 0 goal

Create the clean schema draft, route/module plan, and import guardrails without touching active production routes or production data.

## Production safety rules

- Do not modify current active production routes in Phase 0.
- Do not delete legacy code in Phase 0.
- Do not run SQL or migrations in Phase 0.
- Do not import from contaminated legacy systems.
- Do not create page-load writes.

## Why `app/clean` is not created in Phase 0

`app/clean` would create a real Next.js route segment and would start expanding the routed app surface before the rebuild is approved.

Safer structure for Phase 0:

- `sql/clean/` for schema drafts
- `docs/` for architecture and phase planning
- `lib/clean/` for non-routed clean rebuild notes/placeholders

Phase 1 can introduce actual clean app routes after approval.

## Target route map

Primary routes:

- `/my-day`
- `/my-calendar`
- `/my-programs`
- `/my-capture`
- `/my-curriculum`
- `/my-profile`
- `/my-settings`

Outputs:

- `/my-portfolio`
- `/my-reports`
- `/my-outputs`

Safe aliases:

- `/calendar` -> `/my-calendar`
- `/capture` -> `/my-capture`
- `/profile` -> `/my-profile`
- `/settings` -> `/my-settings`
- `/portfolio` -> `/my-portfolio`
- `/reports` -> `/my-reports`
- `/home` -> `/my-day`
- `/dashboard` -> `/my-day`

Hidden until ready:

- `/my-progress`
- `/my-rooms`
- community
- premium media tools
- AI tools

## Target module map

- My Day
- My Calendar
- My Programs
- My Capture
- My Curriculum
- My Profile
- My Settings
- My Portfolio
- My Reports
- My Outputs

## Keep from old app as reference only

- My Day direction
- My Calendar inline pop-up and week-planning UX
- My Programs concepts
- portfolio card patterns
- report/output presentation ideas
- family-first tone and copy
- homeschool reporting positioning

## Forbidden imports and systems

The clean rebuild must not import:

- `authority*`
- `exports*`
- `children/[id]`
- `start`
- `onboarding*`
- `useActiveStudent`
- `familyLearners`
- `familyLearnerService`
- school systems
- classroom systems
- teacher systems
- admin systems
- leadership systems
- intervention systems
- cohort systems
- ranking systems
- community systems
- legacy learner/local-only systems

## Clean data model

Canonical chain:

```text
auth.users
-> family_profiles
-> family_members
-> learners
-> programs
-> program_segments
-> calendar_items
-> evidence_entries
-> portfolio_highlights
-> reporting_periods
-> reports
-> report_sections
-> report_exports
```

## Phase plan

### Phase 0

- isolated schema draft
- clean route/module plan
- import guardrails

### Phase 1

- auth
- family profile
- family membership
- learners
- My Profile
- My Settings
- RLS

### Phase 2

- calendar items
- My Calendar
- My Day

### Phase 3

- programs
- program segments

### Phase 4

- text-only capture
- premium media placeholders only

### Phase 5

- portfolio

### Phase 6

- reports
- outputs

## Verification plan

Phase 0:

- confirm no production route files changed
- confirm only docs/sql/non-routed clean namespace files were added
- optional build to ensure no accidental route impact

Phase 1:

- user can create family
- user can add learner
- reload shows learner
- another user cannot access that family

## Folder plan

Created now:

- `sql/clean/`
- `lib/clean/`

Planned later:

- clean route files for the new module set after Phase 1 approval
- clean data-access modules under `lib/clean/*`
