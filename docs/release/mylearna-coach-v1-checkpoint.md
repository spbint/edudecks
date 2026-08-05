# CHECKPOINT — MyLearna Coach v1

## Release record

- Product: MyLearna Homeschool
- Baseline: `origin/main` at `5eba751af5ce5baeb8b4e2dacdd0783b5e7bb754`
- Branch: `feature/mylearna-coach-v1`
- Scope: deterministic, state-aware next-action guidance for new, returning and multi-learner families.
- Browser-rendered QA: **MANUAL** until the preview script below is completed.

## Current guidance audit

### PASS — existing architecture reused

- `GuidanceProvider` owns the guidance preference, static tour completion and Guided Start status.
- `GuidedStartFamilySetup` remains the action-driven mandatory family mission.
- `guidedMissions.ts` remains the real-state reconciliation layer for profile and learner setup.
- `useDriverTour` and `guidanceTours.ts` remain the on-demand static page-tour system.
- `CleanFamilyWorkspaceProvider` and `setupStateClient` remain the authorised workspace/setup read model.
- Existing page handoffs and mutation reloads remain authoritative.

### Findings

- Guided Start uses real workspace state for completion; browser state is only presentation/pause state.
- Existing static tours and setup progress can appear separately from the mission unless the active mission state is respected.
- The old shell `Ready for today` card had no single state-aware next action and is replaced by Coach.
- Setup status already provides governed counts and active learner resolution for profile, learner, settings, year, teaching period, weekly block, pathway, evidence, Portfolio and report records.
- Today-planned-learning and report-readiness details are not exposed by the shared setup read model, so Coach does not invent those signals. They are omitted or represented only where a reliable existing signal is available.

## Coach architecture

- `lib/clean/coach/types.ts`: normalised state and recommendation contracts.
- `lib/clean/coach/coachEngine.ts`: pure deterministic one-recommendation priority engine.
- `lib/clean/coach/coachPersistence.ts`: hashed account-scoped snooze/panel preferences; no names, learner IDs or family IDs.
- `lib/clean/coach/coachAnalytics.ts`: safe event wrapper.
- `app/components/clean/coach/MyLearnaCoachProvider.tsx`: authenticated workspace integration, refresh and pause/resume behavior.
- `MyLearnaCoachCard.tsx`: compact automatic recommendation.
- `MyLearnaCoachPanel.tsx`: on-demand expanded Coach panel.

## Recommendation priority

1. Family profile.
2. First learner.
3. Required Settings.
4. Learning year.
5. First non-break learning period.
6. First weekly/master block.
7. My Day handoff.
8. Pathway placement.
9. First learning moment.
10. Portfolio review.
11. Report preview only when a reliable ready signal exists.
12. Calm Quick Capture fallback.

The engine returns exactly one recommendation or no recommendation while workspace state is loading, unavailable or errored.

## New-family journey — PASS by deterministic coverage

Guided Start remains the first mandatory mission. Coach does not add a competing automatic card during incomplete setup. After the real Calendar state is complete, Coach recommends My Day, then uses available real pathway/evidence/Portfolio signals for the first activation loop.

## Returning-family journey — PASS by deterministic coverage

Configured families see one compact MyLearna Coach card with one dominant action and optional `Not now`/`Why this?` controls. The recommendation changes when the shared workspace/setup state changes. No sign-in modal is automatically opened.

## Learner-context rules — PASS by deterministic coverage

Recommendations use the authorised active learner resolved by existing workspace state. A multi-learner family without a valid active learner is asked to choose rather than guessed. Learner context is preserved in internal destination query parameters; learner names are never sent to analytics.

## Persistence and resume — PASS by deterministic coverage

- Mandatory setup pause remains distinct from completion and remains resumable through existing guidance controls.
- Returning recommendation snooze lasts four hours and remains accessible through Help/Settings Coach access.
- Storage is scoped by a non-identifying hash of the authenticated account key.
- Loading, sign-out and account changes do not reuse another account’s Coach state.

## Analytics and privacy — PASS by source/test coverage

Supported events: `coach_recommendation_shown`, `coach_opened`, `coach_primary_action_selected`, `coach_snoozed`, `coach_resumed`, `coach_recommendation_completed`, and `coach_no_recommendation`.

Only recommendation ID/category, route, support mode, multiple-learner boolean and completion source are permitted. Child names, IDs, family IDs, captions, photos, notes, evidence text and report content are excluded.

## Accessibility and mobile — PASS by source coverage; browser verification MANUAL

Coach controls have semantic labels, visible focus, minimum 44px targets, 48px primary actions, keyboard-safe close controls and reduced-motion-compatible styling. The mobile card and panel clear the shared fixed bottom navigation height and safe-area inset. A live viewport check remains required.

## Validation

- Coach-focused tests: **PASS** — deterministic engine, persistence, integration and privacy assertions.
- Guided Start/setup/calendar/Quick Capture regression suites: **MANUAL/PASS pending full run**.
- Changed-file ESLint: **MANUAL/PASS pending full run**.
- `git diff --check`: **MANUAL/PASS pending full run**.
- Production build: **MANUAL/PASS pending full run**.

## Manual QA script — MANUAL

### New family

1. Use a fresh safe preview account.
2. Confirm authentication routes to My Profile and Guided Start welcomes once.
3. Complete profile, learner, Settings and Calendar year → period → weekly block.
4. Confirm no second setup card or Ready-for-today card competes.
5. Continue to My Day and verify Coach changes to the next real activation action.
6. Open Pathways, capture a safe test learning moment, review Portfolio and inspect report readiness.

### Returning family

1. Sign in with a complete safe fixture family.
2. Confirm one compact Coach recommendation and no automatic modal.
3. Select the action and confirm the destination preserves learner context.
4. Select `Not now`, confirm the card snoozes, then use Settings/Help `Show me what to do next` to reopen it.

### Multiple learners

1. Switch active learner.
2. Confirm recommendation and destination change to the selected learner.
3. Remove or invalidate the active selection and confirm Coach asks the parent to choose.

### Mobile

Check 390×844, 393×852 and 430×932: open/close Coach, use keyboard navigation, use bottom navigation, and confirm no Save action is hidden.

Do not mark these browser checks PASS without an actual rendered preview recording. Do not use a real child photograph.

## Known limitations — DEFERRED

- No conversational AI, free-text chat, LLM recommendation, push/email summary, voice support, streaks, points or badges.
- No new database schema or Coach-specific server table.
- Today planned-learning detail and report readiness remain omitted where the current shared authorised read model does not expose a reliable signal.
- Full browser visual QA remains a manual preview gate.
