# MyLearna Homeschool 1.0 — Editability and Journey Handoffs

## Release record

- Product: MyLearna Homeschool
- Tested branch: `release/homeschool-1-editability-handoffs`
- Starting release candidate: `origin/feature/guided-start-fresh-account-entry` at `1516e77b1e8e2fd14451ed7ecbf9e025b63798ad`
- Scope: family-created records remain editable and completed workflows have a clear next action.
- Browser-rendered UX: **MANUAL** — source-level and automated checks passed; live browser UX review remains required before release.

## Records audited

| Area | Editable family-created fields | Intentionally immutable / governed fields | Status |
| --- | --- | --- | --- |
| Family profile | Family name, family settings, country/region, curriculum/reporting context, week start and planning preferences | Family/user identifiers, ownership and permission fields | PASS |
| Learners | First name, preferred name, surname where supported, year/grade, notes, default learner | Learner ID, family ownership and audit fields | PASS |
| Settings | Country, jurisdiction, curriculum, reporting mode, week start, planning and guidance preferences | Ownership and capability state | PASS |
| Learning year | Title, start/end dates, country and jurisdiction | Record ID, family ownership and audit fields | PASS |
| Learning periods and breaks | Title, type, dates and notes | Record ID, family/year ownership and audit fields | PASS |
| Calendar blocks | Title, learner, day/date, times, learning area, notes and supported recurrence/template values | Record ID, family ownership and governed source fields | PASS |
| Capture and Portfolio | Title, observation date, permitted learner context, learning area, observation, private note, reflection, tags and Portfolio/Reports inclusion | Evidence ID, family ownership, storage ownership and source provenance | PASS |
| Pathways | Family notes/evidence and supported learner-specific status | Canonical curriculum definitions | PASS |
| Reports | Draft title, period, family introduction and parent reflection where supported | Historical generated exports and governed report provenance | PASS |

## Calendar edit repair

Saved learning years now expose `Edit` and `Delete` actions. Edit reopens the existing title and date values, uses `updateCleanAcademicYear` with the existing record ID, and offers `Save changes` or `Cancel`. Cancel does not write. Delete uses the existing confirmation dialog and the governed family-scoped delete client. Date changes with existing periods or planning blocks display an impact warning before confirmation. A successful update reloads setup data so the changed record is visible immediately.

Existing governed editors for periods, breaks, master-week blocks and live calendar blocks remain in place and were included in the audit.

## Journey handoffs

The audited journey uses one dominant next action at each completed stage:

1. Profile → `Continue to My Settings`.
2. Settings → `Set up My Calendar`.
3. Learning year saved → `Add your first learning period`.
4. Learning period saved → `Add your first weekly learning block`.
5. First weekly block saved → `Your first learning plan is ready`, with `Continue to My Day` and optional `Add another block`.
6. My Day → planned learning review, or `Open My Pathways` / `Quick Capture` when no plan exists.
7. Pathway work → add completed work/evidence and return through the existing pathway context.
8. Capture → Portfolio and originating-route return actions.
9. Portfolio → `Continue to My Reports` when evidence is available.
10. Reports → `Open output history` and the existing PDF/output actions.

Mandatory setup guidance remains gated by real workspace state. The fresh-account route guard prevents unrelated My Day tours and setup cards from competing before a family profile exists.

## Validation

- Focused editability/handoff regression tests: **PASS**.
- Existing Guided Start and fresh-account guard tests: **PASS**.
- Existing Quick Capture and mobile Save-bar tests: **PASS**.
- Changed-file ESLint: **PASS**.
- `git diff --check`: **PASS**.
- Production build: **PASS** after the calendar card type correction.
- Full suite: required before commit; results are recorded in the final release handoff.

## Remaining manual checks

- Render Profile, Settings and Calendar in desktop and narrow mobile browsers.
- Edit a learning year with dependent periods/blocks and verify the warning is understandable.
- Confirm calendar updates appear without refresh and no duplicate year is created.
- Verify keyboard focus, target sizing and delete confirmations.
- Verify report/PDF and Portfolio handoffs against representative hosted family data.

## Known limitations

- Calendar date-impact detection is intentionally conservative because live calendar items do not carry a direct academic-year foreign key in the existing client model; any existing periods or current planning items trigger the review warning.
- Canonical curriculum definitions remain immutable.
- No SQL, schema, RLS, environment, payment, or hosted-data change was required.
