# MyLearna Coach state reconciliation and refresh repair

Status: PASS for automated validation; MANUAL browser QA remains required.

## Scope

This repair is limited to MyLearna Homeschool Coach v1 state reconciliation, mutation refresh, route revalidation, and guidance-off lifecycle behaviour. It does not change the evidence schema, navigation architecture, or excluded products.

## Audit findings

- Guided Start persisted state was read for the authenticated account, but a persisted `completed` value was able to suppress the welcome without first reconciling it against the authorised family profile and learner state. **Confirmed and fixed.**
- Profile, learner, and Settings mutations already reloaded the family workspace locally, but Coach had no governed completion signal and several Calendar/evidence/Portfolio/Report paths did not notify Coach consistently. **Confirmed and fixed with a shared refresh contract.**
- Coach recommendations were calculated from `CleanFamilyWorkspaceProvider.setupStatus`; without a mutation or route revalidation, that snapshot could remain stale for the session. **Confirmed and fixed.**
- Mandatory setup recommendations were intentionally hidden while Guided Start was visible. That suppression was correct while the mission was active, but could leave a gap when the mission was paused or not represented. **Confirmed and fixed with deterministic visibility rules.**
- Turning guidance off changed the preference, but the static Driver.js instance and active Guided Start/automatic Coach surfaces did not share one immediate close mechanism. **Confirmed and fixed.**

## Reconciliation

`reconcileGuidedStartState` derives the current step from real authorised profile, learner count, and route state. It overrides stale completion, safely handles malformed storage, preserves compatible pause state, and scopes persistence to a hashed authenticated-user key. Local storage remains presentation memory only; it cannot certify a family profile, learner, or setup completion.

## Refresh contract

`lib/clean/coach/coachRefresh.ts` provides one typed event contract with safe source labels. Successful mutations request a refresh only after completion. The Coach provider coalesces bursts, uses the existing family-workspace reload path, and records a short last-refresh window to avoid duplicate route revalidation. No polling or render-triggered reload is used.

Connected success paths include profile and learner changes, Settings, learning years, learning periods, weekly/master blocks, pathway placement, evidence, Portfolio highlights, reports, and Quick Capture's already-applied workspace reload. Major Coach routes revalidate once when entered.

## Guidance-off behaviour

The shared guidance provider closes the active Driver.js tour and announces the preference change. Guided Start pauses, automatic Coach cards are hidden, and an automatic Coach panel closes. Manual `Show me what to do next` remains available in help mode without re-enabling proactive guidance. Guided Start remains the dominant surface when active so Coach cannot create a second overlay.

## Validation

Automated unit and source-contract tests cover stale completion, missing learners, pauses, malformed storage, account scoping, refresh subscription, source wiring, route revalidation, coalescing, guidance-off behaviour, and automatic-card visibility. Build, focused tests, changed-file lint, and full-suite results are recorded in the handoff report.

Manual browser checks remain required for the stale-browser-state, setup mutation, Calendar-to-My Day, guidance-off, snooze, real-state transition, and two-learner flows. No screenshots or recordings were produced in this worktree.
