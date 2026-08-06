# Quick Capture Report Default Launch Fix

Status: AUTOMATED VALIDATION PASS; live smoke testing remains MANUAL.

## Confirmed production symptom

Quick Capture records were saved successfully and appeared in My Portfolio, but a regenerated report did not include them.

## Confirmed root cause

`CleanQuickCaptureWorkspace` passed `includeInPortfolio: true` and `includeInReport: false` to the existing `saveUnifiedLearningCapture` operation. Reports correctly load Portfolio evidence with `reportIncludedOnly: true`, so the inconsistent capture default excluded those new records by design.

## One-line behavioural correction

New Quick Captures now save with `includeInPortfolio: true` and `includeInReport: true`.

No historical records are backfilled or changed. Existing full Capture and Learning from Life inclusion controls remain unchanged.

## Scope and filtering

No SQL, schema, policy, API route or PDF code changed. Report learner filtering, reporting-period date filtering and the existing `includeInReport` filter remain authoritative. Newly included evidence reaches the existing `buildReportPdfEvidenceItems` path; nothing is inserted directly into a PDF.

## Automated validation

Focused Quick Capture, unified capture, Portfolio filtering, report evidence presentation, report PDF and Coach refresh regressions passed with 34 tests. The full Vitest suite passed with 364 tests across 58 files. Changed-file ESLint passed with zero errors and one existing `<img>` warning; `git diff --check` passed; and the Next.js production build, including its TypeScript phase, passed. Standalone TypeScript validation reports the repository's existing unrelated test typing errors.

## Live smoke test - MANUAL

After preview deployment, verify with a safe non-child test record that a new Quick Capture remains in Portfolio and appears in a regenerated report for the matching learner and reporting period. Confirm existing learner/date filters still apply and no Coach or Quick Capture UI appears in the PDF. Production smoke testing has not been claimed here.

## Launch decision

If the automated validation and live smoke test pass, this is the final permitted pre-launch code change. The complete Coach and Quick Capture chain may then be merged to main, deployed and frozen for launch.
