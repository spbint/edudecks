# MyLearna Homeschool Launch Acceptance

**Test date:** 2026-08-04
**Repository:** `spbint/edudecks`
**Branch:** `release/homeschool-launch-acceptance`
**Tested commit:** `c2e8d722e94c52d499385c27f549dfb0c2869e55`
**Starting main:** `f69c2caad59369cb7a1d03f971f8927b386a4376`
**Mobile prerequisite:** `feature/quick-capture-mobile-save-bar` at `c2e8d72`, one commit ahead of main.

## Launch positioning

**PASS** — Public wording now presents MyLearna as a connected homeschool planning, evidence, Portfolio and reporting system with a strong mathematics pathway. Beta-only calls to action were removed from the standard public surfaces. No new product area was added.

## Route matrix

| Area | Result | Evidence / remaining gate |
|---|---|---|
| `/my-profile` | PASS | Authenticated route is present in the clean workspace architecture; live signed-in smoke remains manual. |
| `/my-settings` | PASS | Clean provider hierarchy and settings route regression coverage pass. |
| `/my-calendar` | PASS | Clean route is included in canonical bootstrap and planning-integrity tests. |
| `/my-day` | PASS | Clean route is included in canonical bootstrap and existing workspace coverage. |
| `/my-pathways` | PASS | Clean route and pathway action coverage pass. |
| `/my-capture` | PASS | Canonical Capture route and Quick Capture entry coverage pass. |
| `/my-capture?mode=quick` | PASS | Quick Capture and mobile save-bar coverage pass. |
| `/my-portfolio` | PASS | Canonical route and entry-point coverage pass. |
| `/my-learna` | PASS | Canonical route and recent-learning coverage pass. |
| `/my-reports` | PASS | Canonical route and validated report export coverage pass. |
| `/my-community` | MANUAL | Route is present where active; authenticated entitlement and content smoke require a safe account. |

Build route enumeration passed for all listed routes. No Marketplace or My Ideas navigation was introduced.

## Fresh-family checklist

| Check | Result |
|---|---|
| Empty family state starts at family profile | PASS |
| Profile state advances to add learner | PASS |
| Learner state advances to learning settings | PASS |
| Configured settings advance to learning year | PASS |
| Learning year advances to teaching period | PASS |
| Real-record setup status does not use fictional fallback data | PASS |
| Complete signed-in account journey with browser refresh | MANUAL |
| Returning user lands on My Day | MANUAL |

The deterministic setup progression regression is in `lib/clean/setup/setupStatus.test.ts`. No real account was created or changed.

## Two-learner isolation

**PASS — deterministic contract coverage.** `lib/clean/learnerContext.test.ts` confirms route/context precedence, stale learner rejection, cross-family rejection, and source-linked mismatch protection. Quick Capture coverage confirms the selected learner is preserved and the saved receipt is tied to the actual learner.

**MANUAL — live journey.** A safe two-learner family must still be exercised through My Day, Calendar, Pathways, Capture, Portfolio, My Learna and Reports before production launch. Cross-learner contamination remains a hard stop.

## Calendar

**PASS — deterministic coverage.** Planning tests confirm breaks are not teaching periods, active-period selection excludes breaks, and break/teaching-period counts remain distinct.

**MANUAL — browser acceptance.** Create/edit/delete block, invalid time ranges, date rendering, break overrides and PDF date parity require an isolated family account.

## Pathways

**PASS — deterministic coverage.** Pathway step state, action rows, practice activities, learner context and clean workspace bootstrap suites pass. Focused Practise/Assess routes retain their activity-shell behavior.

**MANUAL — browser acceptance.** Confirm worksheet links, randomised assessment options and return-to-pathway evidence context with a safe test family.

## Quick Capture

**PASS — automated/static.** Entry points, learner isolation, caption-only capture, photo selection, Unified Capture reuse, Portfolio defaults, Reports exclusion, receipt behavior, share-card privacy, analytics filtering, global header action, and the mobile save-bar remedy pass. The save button is full-width on narrow mobile layouts, has a minimum 48px target, and sits above the fixed five-item navigation using the shared 62px navigation token plus safe-area inset.

Static mobile checks cover 390×844, 393×852, 430×932, tablet and desktop responsive rules. Browser camera/library, keyboard, attachment retry, native share, download and copy behavior remain **MANUAL**.

## Portfolio and My Learna

**PASS — deterministic/static coverage.** Canonical workspace bootstrap, learner context, evidence client, Quick Capture propagation and My Learna recent-learning suites pass. No alternate evidence system was introduced.

**MANUAL — browser acceptance.** Confirm signed attachment preview, missing-attachment fallback, deletion refresh, learner filtering and no duplicate cards with safe local data.

## Reports and PDF

**PASS.** The active validated export contract uses `reportDocumentId`, server-side learner/family authorization, readiness validation, PDF generation and export-history recording. Current report export tests pass, including missing ID, missing session, blocked readiness, validated learner-scoped PDF generation and public export behavior.

The old report group initially had **21 failures** because its tests targeted the removed `draftId`/`buildSubmissionPack` API after the curriculum purge. Those were stale expectations, not current production behavior. They were replaced with current-contract tests; the legacy submission-pack route now returns truthful HTTP 410 with an actionable migration message. Report-export group result after repair: **10 passed, 0 failed**.

**MANUAL — real report.** Generate a report from a safe family with approved data and inspect learner identity, period, evidence scope, page breaks, images, history and download behavior.

## Performance and loading

**PASS — code/test coverage.** Existing loading/provider tests and shell idle-prefetch tests pass. The Quick Capture mobile fix does not add resize JavaScript or a broad provider rewrite.

**MANUAL.** Cold/warm network timing, slow request retention, retry UI and authenticated device testing require a controlled browser session.

## Authentication and security

**PASS — static controls.** Authenticated layouts use the shared family workspace provider; local return paths reject external URLs; learner context rejects cross-family and stale selections; evidence and report export remain server-authorized. No secrets, tokens or environment values were added.

**MANUAL.** OTP callback, returning login, sign-out, expired session, direct protected-route access, signed attachment URLs and cross-family request attempts require safe test accounts.

## Subscription and entitlement findings

**MANUAL / NOT APPLICABLE in this repository.** No Homeschool payment-provider or webhook implementation was found in the audited `app`/`lib` paths. No charge, cancellation or provider dashboard action was performed. Subscription launch acceptance therefore remains an external/manual gate.

### Manual production payment checklist for Sean

1. Use a provider test-mode customer and the intended Family plan.
2. Complete one successful checkout and confirm the signed-in account receives the expected entitlement.
3. Refresh and sign back in; confirm entitlement lookup remains stable.
4. Exercise a declined payment in test mode and confirm access messaging is truthful.
5. Cancel in test mode and verify access through the configured period end, then verify expiry behavior.
6. Replay the provider webhook event and confirm idempotency/no duplicate entitlement.
7. Confirm receipt/customer email settings in the provider dashboard.
8. Confirm founder notification configuration without exposing recipient data.
9. Verify test/live mode separation and required environment configuration.
10. Do not use a real child image, real customer charge or production account until all checks pass.

## Analytics and privacy

**PASS — static inspection and focused coverage.** Product analytics allowlist only safe properties and discard captions, names, photos, IDs, storage paths and private content. Quick Capture and sharing events use booleans/routes/areas only. Share links are generic and contain no family, learner or evidence identifiers.

## Automated validation

- Focused journey suites: **PASS — 142 tests** across 25 files after the acceptance additions.
- Complete Vitest suite: **PASS — 44 files, 292 tests, 0 failures**.
- Report-export group: **PASS — 10 tests, 0 failures** after replacing stale pre-purge expectations.
- Changed-file ESLint: **PASS — 0 errors**; existing Next image warnings remain on photo previews.
- `git diff --check`: **PASS**.
- `npm.cmd run build`: **PASS** — 116 pages generated.
- Full repository `npm.cmd run lint`: **FAIL — 69 existing errors and 70 warnings** in unrelated legacy, authority, report, family and Marketplace files. No changed acceptance file produced an error under changed-file ESLint; this broad baseline debt is recorded rather than weakened or altered in this release pass.

## Fixed blockers

- Replaced the misleading legacy submission-pack 503 response with a truthful 410 unavailable response.
- Replaced obsolete report-export tests with current validated `reportDocumentId` contract coverage.
- Added deterministic fresh-family setup progression coverage.
- Removed beta-only CTA/badge wording from standard public launch surfaces and added regression coverage.
- Preserved the approved mobile Quick Capture Save-bar remedy.

## Remaining manual gates

- Fresh-family browser journey with a safe new account.
- Two-learner isolation journey with safe local/QA data.
- Calendar block and break operations.
- Camera/library, keyboard and safe-area device testing.
- Portfolio attachment/deletion refresh.
- Real validated PDF/output generation and visual inspection.
- OTP/session/security boundary checks.
- Provider test-mode subscription and webhook checklist above.

## Known non-blocking limitations

- The legacy submission-pack format is intentionally unavailable; use validated HTML/DOCX/PDF report export.
- No automated browser/device or real payment verification was performed.
- Existing Next image optimization and Browserslist advisory warnings are non-blocking and unrelated to the acceptance fixes.
- Full-repository lint remains red on pre-existing unrelated files; changed-file lint is green.

## Launch recommendation

**PASS — ready for manual production gates.** Automated validation is green, no unexplained report-export failures remain, and no production data, schema, secrets or external services were modified. Do not deploy until the manual gates above are completed.
