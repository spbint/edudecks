# MyLearna Homeschool 1.0 — Final Onboarding Polish

## Release record

- Product: MyLearna Homeschool
- Branch: `release/homeschool-1-final-onboarding-polish`
- Baseline: `origin/release/homeschool-1-editability-handoffs` at `94dee65162d829325d1c883ac55542b8e7f45ba4`
- Scope: final first-user Guided Start and Calendar sequence correction.
- Rendered browser acceptance: **MANUAL** — automated/source validation passed; final live onboarding recording remains required.

## Guided Start nonappearance root cause

The family mission had real-state reconciliation, but automatic welcome eligibility was implicit: it depended on the delayed local-storage hydration producing a `not_started` state. There was no explicit, tested predicate saying that a resolved authenticated workspace with no profile or no learner must offer the mission. This allowed an eligible first account to reach `/my-profile` without a visible welcome when session/guidance hydration and browser-local state did not line up.

The fix adds `shouldAutoOfferGuidedStart`. It requires guidance enabled and hydrated, resolved workspace/setup state, no schema or workspace error, and an incomplete authorised family state. It is account-scoped, does not reopen paused/completed missions, and does not infer completion from overlay lifecycle.

## Eligibility and pause rules

| Condition | Result | Status |
| --- | --- | --- |
| Resolved account with no profile or no learner and no stored mission | Automatic welcome on My Profile | PASS |
| Profile and learner already exist | No unsolicited welcome | PASS |
| Workspace/setup loading, schema missing or request error | No mission | PASS |
| Not now, Escape or close | Paused, not completed | PASS |
| Paused mission | Resumable through existing Help/Settings restart path | PASS |
| Stored state conflicts with real state | Real profile/learner/route state wins | PASS |
| Sign-out/account change | Mission storage remains user-scoped by hashed account key | PASS |

## Profile handoff

The Profile → Settings handoff is rendered only when an authorised profile and at least one learner exist, no learner/profile mutation is pending, and no blocking error is present. Before then, the real family and Add learner controls remain available without a misleading Settings action. After learner reload succeeds, one `Continue to My Settings` action appears without requiring refresh. Duplicate setup progress is suppressed while Guided Start is active.

**PASS** — source and regression coverage. Browser rendering remains **MANUAL**.

## Ready for today suppression

The shell no longer renders the Ready for today card until real setup state confirms:

- family profile;
- learner;
- required Settings;
- learning year;
- non-break learning period;
- weekly/master learning block.

The weekly-block state is loaded from authorised active master templates and template blocks. Loading, schema-missing and error states render no empty encouragement container. Returning configured families retain the existing card.

**PASS** — deterministic setup-state and shell coverage.

## Calendar sequence

The first-setup sequence is now:

1. Create your learning year.
2. Add your first learning period.
3. Optionally add a break or holiday after a non-break period exists.
4. Add your first weekly learning block.
5. Show `Your first learning plan is ready` with `Continue to My Day` and optional `Add another block`.

Break creation is disabled before a genuine non-break period and is labelled `Add a learning period first`. A break never satisfies period or Calendar completion. The prior local “Skip for now” path was removed from mandatory first setup so local state cannot make Calendar appear complete without a weekly block.

**PASS** — source and setup-state tests. Browser handoff and mobile navigation placement remain **MANUAL**.

## Preventive date behaviour

- Learning-year end has a start-date minimum; changing start realigns end when necessary.
- Period and break start/end inputs are constrained to the selected learning year.
- End-date minimums track the selected start date.
- Composer defaults are clamped into the selected year.
- Editing period dates uses the same constraints and realignment.
- Existing defensive reversed-range, containment and overlap validation remains active.

**PASS** — source assertions and existing planning-integrity tests. Native mobile rendering remains **MANUAL**.

## Learning-year Edit behaviour

The existing governed editor remains same-record only: Edit loads title, dates, country and jurisdiction; Cancel leaves the record unchanged; Save changes calls `updateCleanAcademicYear` with the existing ID; date changes with dependent planning show an inline impact confirmation; failures preserve the edit state; Delete remains a separate confirmation flow; successful changes show `Learning year updated.`

**PASS** — automated regression coverage. Browser edit/refresh verification remains **MANUAL**.

## Build identifier

**NOT APPLICABLE** — no reliable existing build identifier was available without introducing environment/build configuration changes. This build does not add new environment reads or deployment configuration. Preview QA should continue to verify the browser hostname is not the production domain.

## Validation

- Focused Guided Start, route-guard, Profile, setup-status, Calendar, Quick Capture and shell tests: **PASS** (40 tests).
- Full suite: **PASS**, 320 tests across 51 files.
- Changed-file ESLint: **PASS**.
- `git diff --check`: **PASS**.
- `npm.cmd run build`: **PASS**.
- Live browser recording: **MANUAL** and intentionally not claimed here.

## Deferred

The MyLearna Coach, returning-user recommendations, AI, Marketplace, GFG, Community expansion and new curriculum remain deferred from this build.

No SQL, schema, RLS, environment, hosted-data or production configuration change was required.
