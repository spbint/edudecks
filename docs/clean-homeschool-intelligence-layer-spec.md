# Homeschool Intelligence Layer - controlled build spec

This document captures the controlled-build slice for the MyLearna Homeschool Intelligence Layer.

## Build position

- build behind the clean system first
- test inside clean routes
- keep the old app running
- do not hard-cutover until stable

## Product direction

MyLearna is a visual, guided homeschool operating system for parents.

Core loop:

Family setup
-> learner profile
-> jurisdiction and curriculum profile
-> term and learning period setup
-> master weekly template
-> program planning
-> generated calendar week
-> My Day
-> capture notes and evidence
-> portfolio
-> reports
-> outputs

## Core principles

1. My Day is the default daily landing experience for active users.
2. New or incomplete users should see guided setup cards until enough setup exists.
3. Calendar is the central planning and input surface.
4. My Day is derived from calendar data, not a duplicate planner.
5. Add and edit actions should happen where the parent is already looking.
6. Calendar add and edit should use a small direct popover, not a sidebar-first flow.
7. Generation is parent-controlled and should never overwrite by default.
8. Free core remains text-first.
9. Media, assessments, community, AI, and PDF depth stay out of this slice.

## Locked UX decisions in this slice

### My Day

- full family day by default
- combined view with learner filters
- time-ordered visual blocks
- expandable detail per block
- quick handoff to capture later
- guided setup cards when the family is not ready

### Calendar interaction

- click day or item
- open a small popover
- edit title, learner, learning area, optional time, optional notes
- save explicitly

### Master weekly template

- optional weekly rhythm
- family-wide by default
- learner overrides possible later
- parent can stay manual forever

### Generation

- suggest "Generate this week?"
- parent confirms
- fill empty slots only by default
- skip blackout and non-learning days
- keep generated week edits local to that week

## Jurisdiction layer

The intelligence layer should support:

- country
- state or jurisdiction
- year level
- curriculum framework
- required learning areas
- reporting mode
- review cycle
- portfolio requirement
- attendance or hours requirement
- assessment requirement

Markets:

- Australia first
- US second
- UK third
- custom later

## Learning area position

Light mapping first.

For Australia, support these areas:

- English
- Mathematics
- Science
- Humanities and Social Sciences
- The Arts
- Languages
- Health and Physical Education
- Technologies

No full curriculum outcome engine in this slice.

## Controlled implementation scope

This slice implements:

1. draft schema additions only
2. clean service scaffolds
3. clean calendar popover upgrade
4. term and learning period scaffolding
5. master template scaffolding
6. generation-run and weekly preview scaffolding
7. guided My Day cards scaffold

This slice does not implement:

- drag and drop calendar editing
- PDF generation
- community
- assessments
- media upload
- external AI
- auto holiday APIs
- full curriculum outcome mapping

## Route strategy

All work remains in the clean system:

- `/clean`
- `/clean-my-day`
- `/clean-my-calendar`
- `/clean-my-programs`
- `/clean-my-capture`
- `/clean-my-portfolio`
- `/clean-my-reports`
- `/clean-my-outputs`

No production hard cutover in this slice.

## Build outputs expected from this slice

- draft schema additions under `sql/clean`
- clean service scaffolds for years, periods, templates, generation, and guidance
- clean calendar popover scaffold
- clean weekly rhythm and generation scaffold
- clean My Day guidance scaffold

## Verification

- targeted lint for changed files
- `npm.cmd run build`
- forbidden import search inside clean files

No SQL execution.
No migrations.
No production data changes.
