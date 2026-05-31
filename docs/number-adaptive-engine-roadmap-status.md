# Number Adaptive Engine Roadmap Status

## 1. Purpose

This document records the current state of the MyLearna Number adaptive assessment-and-practice engine.

It is a checkpoint for the standalone Years 3-10 Number product experience. The aim is to keep the current architecture, content coverage, persistence boundaries, and next decisions clear before manual browser QA, product polish and listing readiness work.

## 2. Core Learning Loop

The reusable Number loop is:

Assessment bank
-> structured auto-checking
-> sub-element mastery
-> targeted practice recommendation
-> interactive practice section
-> mini-check
-> return to assessment

The same model is intended to be replicable later across Number, Measurement, Space/Geometry, Statistics and Probability.

## 3. Current Routes

Current primary routes:

- `/assessments/number`
- `/practice/number-targeted`

Legacy compatibility route:

- `/assessments/number-approximation-prototype`

`/assessments/number` is the primary Number assessment entry point. `/assessments/number-approximation-prototype` is retained for old links and historical saved source routes for now. `/practice/number-targeted` remains the targeted practice route; a shorter practice alias has not been added yet.

`/my-assessments` can route Number pathway contexts into `/assessments/number` with learner and pathway query parameters. Saved Number attempts are read back there as read-only assessment-attempt summaries, separate from parent confidence, evidence, reports, curriculum coverage and pathway progress.

`/my-assessments` is retained as a supporting/deep-link route, but it is no longer shown as a primary ribbon/header item. My Pathways is the primary parent journey for progress, next actions and check-understanding entry points.

## 4. Completed Number Adaptive Loops

| Bank / focus | Progression band key | Assessment item file | Practice module file | Assessment item count | Sub-elements | Practice sections | Mini-check count | Status |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Place value and operations | `place-value-and-whole-number-operations` | `lib/clean/assessments/numberPlaceValueOperationsAssessmentItems.ts` | `lib/clean/practice/numberPlaceValueOperationsPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Additive strategies | `additive-strategies-and-problem-solving` | `lib/clean/assessments/numberAdditiveStrategiesAssessmentItems.ts` | `lib/clean/practice/numberAdditiveStrategiesPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Multiplication and division | `multiplication-division-fluency` | `lib/clean/assessments/numberMultiplicationDivisionFluencyAssessmentItems.ts` | `lib/clean/practice/numberMultiplicationDivisionFluencyPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Money and practical number contexts | `money-and-practical-number-contexts` | `lib/clean/assessments/numberMoneyPracticalContextsAssessmentItems.ts` | `lib/clean/practice/numberMoneyPracticalContextsPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Time and elapsed-time foundations | `time-and-elapsed-time-foundations` | `lib/clean/assessments/numberTimeElapsedFoundationsAssessmentItems.ts` | `lib/clean/practice/numberTimeElapsedFoundationsPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Number patterns and early algebraic thinking | `number-patterns-and-early-algebraic-thinking` | `lib/clean/assessments/numberPatternsEarlyAlgebraAssessmentItems.ts` | `lib/clean/practice/numberPatternsEarlyAlgebraPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Fractions foundations | `fractions-foundations` | `lib/clean/assessments/numberFractionsFoundationsAssessmentItems.ts` | `lib/clean/practice/numberFractionsFoundationsPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Decimals foundations | `decimals-foundations` | `lib/clean/assessments/numberDecimalsFoundationsAssessmentItems.ts` | `lib/clean/practice/numberDecimalsFoundationsPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Integers and coordinates | `integers-coordinates-number-properties` | `lib/clean/assessments/numberIntegersCoordinatesPropertiesAssessmentItems.ts` | `lib/clean/practice/numberIntegersCoordinatesPropertiesPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Rational operations | `rational-numbers-and-operations` | `lib/clean/assessments/numberRationalOperationsAssessmentItems.ts` | `lib/clean/practice/numberRationalOperationsPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Terminating and recurring decimals | `terminating-recurring-rational-representations` | `lib/clean/assessments/numberTerminatingRecurringRationalAssessmentItems.ts` | `lib/clean/practice/numberTerminatingRecurringRationalPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Percent, ratio and finance | `percentages-ratio-financial-modelling` | `lib/clean/assessments/numberPercentRatioFinanceAssessmentItems.ts` | `lib/clean/practice/numberPercentRatioFinancePracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Powers and roots | `powers-roots-exponent-notation` | `lib/clean/assessments/numberPowersRootsAssessmentItems.ts` | `lib/clean/practice/numberPowersRootsPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Real numbers | `irrational-and-real-numbers` | `lib/clean/assessments/numberIrrationalRealAssessmentItems.ts` | `lib/clean/practice/numberIrrationalRealPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Surds and exact form | `surds-and-exact-form` | `lib/clean/assessments/numberSurdsExactAssessmentItems.ts` | `lib/clean/practice/numberSurdsExactPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Approximation and error | `approximation-estimation-error` | `lib/clean/assessments/numberApproximationAssessmentItems.ts` | `lib/clean/practice/numberApproximationPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |

Status meaning: assessment bank, selector wiring, practice module, targeted practice mapping and QA have been completed for the loop.

## 5. Assessment Bank Model

The current Number assessment banks follow this pattern:

- 12 items per bank
- 4 sub-elements per bank
- 3 items per sub-element
- structured auto-checkable response types
- 0 parent-marked open responses for these Number banks
- `misconceptionTargets`
- `adaptiveRoute`
- `progressionBandKey`
- `progressionStepKey`
- `subElementKey`
- `subElementTitle`
- `subElementDescription`

## 6. Structured Auto-Checkable Response Types

Currently supported assessment response types include:

- `multiple_choice`
- `multi_select`
- `numeric`
- `short_symbolic`
- `matching`
- `ordering`
- `classification`
- `select_correct_working`
- `choose_best_explanation`
- `fill_gap`
- `true_false_correction`
- `short_answer` where appropriate

The goal was to reduce parent marking burden for upper Number mathematics while still allowing diagnostic information to flow into sub-element mastery and targeted practice recommendations.

## 7. Sub-Element Mastery Model

The current mastery rule for each 3-item sub-element is:

- 0/3 correct = Needs support
- 1/3 correct = Developing
- 2/3 correct = Consolidating
- 3/3 correct = Secure

This is currently local and snapshot-based. It does not yet write to formal assessment confidence or update pathway progress.

## 8. Practice Module Model

Each targeted practice module follows this pattern:

- Learn card
- 4 practice sections matching assessment sub-elements
- 3 tasks per section
- 4 mini-check tasks
- related assessment item links where available
- local-only interactive practice viewer
- return to assessment

Practice currently uses a lightweight local renderer. `visualSupport` metadata exists across the assessment and practice spine, but richer visual renderers such as clocks, timelines, tables, drag/drop classification, advanced matching, graphing, or canvas interactions are future work.

## 9. Persistence Status

Saved:

- `assessment_attempts`
- `assessment_attempt_responses`
- `summarySnapshot`
- `subElementMastery`
- `targetedPracticeRecommendation`

Not saved yet:

- practice attempts
- practice mini-check results
- parent-confirmed judgement
- formal assessment confidence updates
- pathway progress updates
- evidence entries
- curriculum intelligence updates
- report-ready statements

Relevant SQL migration:

- `sql/clean/20260526_clean_assessment_attempts_phase_1.sql`

## 10. Canonical Structure

The current structure is preserved as:

`subjectKey`
-> `strandKey`
-> `stageKey`
-> `pathwayStepId`
-> `stepKey`
-> `progressionBandKey`
-> `progressionStepKey`
-> `subElementKey`

No parallel curriculum hierarchy should be introduced. Targeted practice remains a child action from sub-element mastery, not a separate curriculum model.

## 11. Current MVP Boundaries

Current boundaries:

- Assessment attempts save, but do not update confidence.
- My Assessments can show saved automatically checked Number attempts, but keeps them separate from confidence counts and evidence/report/curriculum claims.
- My Pathways is the primary parent journey. It routes Number check-understanding actions into `/assessments/number` with learner/pathway context and a return path.
- My Pathways uses the central Number pathway assessment alignment helper to map curriculum step IDs to safe Number assessment banks. Unmatched Number steps should show that no auto-checked assessment is available yet rather than opening a misleading default bank.
- Number assessment and targeted practice now preserve the My Pathways return path where supplied, so parents can come back to the pathway after checking understanding or practising.
- Practice is local-only.
- No evidence creation yet.
- No My Curriculum updates yet.
- No pathway progress updates yet.
- No AI marking.
- No video lessons yet.
- Practice widgets are lightweight, not rich drag/drop widgets yet.
- Browser walkthrough QA has not been completed for every loop.

## 12. Number Coverage Status

Number Years 3-10 is MVP-complete at adaptive-loop level across the banks listed above.

The mapped middle/upper Number spine is MVP-complete at adaptive-loop level.

Year 3-5 foundation loops completed so far:

- Place value and operations
- Additive strategies
- Multiplication and division
- Money and practical number contexts
- Time and elapsed-time foundations
- Number patterns and early algebraic thinking
- Fractions foundations
- Decimals foundations

The current recommendation is not to create more Number banks by default. One optional final Number bank for early scaling / multiplicative comparison can still be considered if a manual gap review judges that coverage important.

## 13. Recommended Next Phase

Recommended next phase:

1. Do manual browser QA across the current Number adaptive spine.
2. Complete product polish and marketing/listing readiness for the standalone Years 3-10 Number experience.
3. Decide whether to move sideways into Measurement, Geometry/Space, Statistics, Probability, Algebra and other Mathematics strands.
4. Only add one optional final Number bank for early scaling / multiplicative comparison if the coverage gap is judged important.

The next phase is manual browser QA, product polish and listing readiness, not more Number bank creation by default.

## 14. Cross-Workspace Product Boundary

The intended parent journey is:

My Day -> My Calendar -> My Pathways -> Check understanding / Practice -> Capture evidence -> Portfolio -> Reports / Outputs.

Current status:

- My Day and My Calendar support planning and evidence capture handoffs, including learner and calendar item context.
- My Pathways is the main place to choose a learner focus, check understanding, practise, mini-check, capture evidence, and view saved auto-checked assessment signals.
- Number assessment attempts are assessment signals only. They can inform parent decisions but do not automatically become evidence, portfolio items, report content, confidence, curriculum coverage, or pathway progress.
- Capture, Portfolio, Reports and Outputs continue to use their explicit saved evidence/report/output flows.

## 15. Open Questions

- When should practice attempts be persisted?
- When should parent confirmation update `assessment_skill_statuses`?
- When should assessment/practice become evidence?
- What is the production route structure?
- Should there be a Number dashboard/launcher as the long-term entry point?
- How should lower Years 3-5 represent visual/concrete concepts?
- When should video lessons become a premium layer?
- How should sub-element mastery roll up into pathway progress?
