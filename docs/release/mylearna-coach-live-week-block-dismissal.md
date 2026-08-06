# MyLearna Coach — Live Weekly Block and Dismissal Repair

Status: AUTOMATED VALIDATION PASS; browser QA remains MANUAL.

## Confirmed root cause

Coach setup status previously counted weekly planning only from active master-template blocks. Calendar, My Day and the weekly-plan output also use dated/live-week records, so a family could have genuine saved planning while Coach still reported “Add your first weekly learning block.”

## Canonical live-week source

The canonical source is `listCleanCalendarItems` in `lib/clean/calendar/client.ts`. It reads the authorised family’s `calendar_items` through the existing family-scoped client and is the source used by Calendar and My Day. The weekly-plan output derives its entries through `buildCleanWeeklyPlannerEntriesFromCalendarItems` in `lib/clean/outputs/weeklyPlanner.ts`.

Coach setup status reuses that same Calendar client path. It does not create a second weekly-block table or query.

## Weekly planning rule

`hasWeeklyBlock` is true when there is at least one valid family-scoped dated/live-week Calendar item or one valid block belonging to an active master template. Invalid identifiers, titles, dates, weekdays, mismatched family records and failed/deleted records do not satisfy the rule. Calendar deletion removes the live record through the existing governed client.

## Refresh behaviour

Successful live Calendar item create, batch create, update and delete operations request the existing governed Coach refresh contract with the appropriate weekly-block source. Failed mutations do not dispatch. The Coach provider continues to use the existing in-flight workspace reload and event coalescing; no polling or reload loop was introduced.

During an authoritative setup refresh, automatic Coach cards are hidden until the current setup state resolves. This prevents a stale weekly-block recommendation from flashing while a newly saved live block is being confirmed.

## Dismissal semantics

The compact card has a labelled, keyboard-accessible `×` control (`Dismiss MyLearna Coach`) with a 44px target. Dismissal stores only the current recommendation ID in the existing account-scoped Coach persistence key. It hides that automatic recommendation across route changes and reloads without marking it complete or changing family data. A different recommendation ID can appear after real state changes.

- `×` dismisses the current automatic recommendation until the recommendation changes.
- `Not now` remains the existing temporary snooze.
- Guidance off remains the global proactive-guidance preference.
- Manual Help can still open the current Coach recommendation and does not clear dismissal or re-enable automatic guidance.

Malformed persistence fails safely, and account-scoped hashed storage prevents one authenticated account inheriting another account’s dismissal.

## PDF/output isolation

No weekly-plan PDF layout, wording, pagination, branding or filename code was changed. Coach reads whether planning exists; Calendar/live-week records continue to feed My Day and the weekly-plan output. Coach dismissal is presentation state only and cannot modify Calendar, My Day or PDF data. Coach components are not part of PDF rendering.

## Automated validation

Focused coverage covers live-week/template source validation, family isolation, recommendation truthfulness, governed Calendar refresh, persistence safety, visible dismissal, manual-help separation, loading suppression and PDF source isolation. The focused suite passed with 29 tests; the full Vitest suite passed with 360 tests across 58 files; changed-file ESLint, `git diff --check` and the production build passed. The standalone repository TypeScript command remains noisy from pre-existing unrelated test typing errors and an environment permission error writing `tsconfig.tsbuildinfo`; Next.js TypeScript validation passed during the production build.

## Manual QA — MANUAL

Sean must still verify the production-style live-week transition, My Day/PDF preservation, compact-card dismissal, manual reopen, new-recommendation eligibility and mobile safe-area behaviour. No production browser QA is claimed by this document.
