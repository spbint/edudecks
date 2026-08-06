# MyLearna Coach - Post-Setup Recommendation Sequencing

Status: AUTOMATED VALIDATION PASS; browser QA remains MANUAL.

## Confirmed root cause

After mandatory setup, `lib/clean/coach/coachEngine.ts` evaluated an `activation-review-my-day` recommendation before checking pathway, evidence and Portfolio state. That branch was conditional on `todayHasPlannedLearning`, but `MyLearnaCoachProvider` did not populate a reliable governed today-plan signal. On normal routes other than My Day, the missing value therefore caused Coach to recommend “Review today's learning” before the active learner had a pathway placement.

## Treatment of Review today's learning

The recommendation is deferred from Coach v1. No new Calendar query, local-storage flag, table, SQL or route-derived signal was added. My Day remains available through navigation and existing Calendar/onboarding handoffs. The Coach engine no longer claims a My Day recommendation without an authoritative today-plan source.

## Final deterministic priority

After mandatory setup, Coach is route-independent:

1. No active-learner pathway placement: `activation-choose-pathway` -> the active learner's My Pathways route.
2. Pathway exists but no evidence: `activation-capture-learning` -> active-learner Quick Capture.
3. Evidence exists but no Portfolio item: `activation-review-portfolio` -> active-learner My Portfolio.
4. Report preview is considered only when `reportReadiness === "ready"` and no report exists.
5. Otherwise the existing safe returning Quick Capture recommendation remains the fallback.

Normal navigation across My Day, Calendar, Pathways, Portfolio and Settings does not weaken this ordering.

## State transitions

The existing governed refresh contracts remain unchanged. A successful pathway placement requests `pathway-updated`, reloads authorised setup state and changes the recommendation to Capture learning. Successful evidence and Portfolio mutations continue to request their existing refresh sources, allowing Coach to advance to Portfolio review and then lower-priority returning guidance without a browser reload.

## Preserved behaviour

Live-week and active-template planning recognition, account/recommendation-scoped Coach dismissal, `Not now` snooze, manual Help, guidance-off behaviour, loading suppression, multi-learner routing, report-readiness protection and PDF isolation are unchanged.

## Automated validation

Focused Coach/refresh tests passed with 45 tests, and pathway, evidence, Calendar, Portfolio and PDF regression tests passed with 49 tests. The full Vitest suite passed with 363 tests across 58 files. Changed-file ESLint, `git diff --check` and the production build passed. Standalone TypeScript validation reports the repository's existing unrelated test typing errors; Next.js TypeScript validation passed during the production build.

## Manual QA - MANUAL

Browser QA remains outstanding. Sean should verify the production-style sequence from Calendar completion through Pathways, evidence, Portfolio and report readiness, including route changes and mobile presentation. No production QA pass is claimed by this document.
