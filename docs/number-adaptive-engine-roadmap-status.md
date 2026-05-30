# Number Adaptive Engine Roadmap Status

## 1. Purpose

This document records the current state of the MyLearna Number adaptive assessment-and-practice engine.

It is a checkpoint before adding the next foundation bank and, later, expanding into other Mathematics strands. The aim is to keep the current architecture, content coverage, persistence boundaries, and next decisions clear before more banks and practice modules are added.

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

`/assessments/number` is the production-shaped Number assessment entry point. `/assessments/number-approximation-prototype` is retained for old links and historical saved source routes for now. `/practice/number-targeted` remains the targeted practice route; a shorter practice alias has not been added yet.

## 4. Completed Number Adaptive Loops

| Bank / focus | Progression band key | Assessment item file | Practice module file | Assessment item count | Sub-elements | Practice sections | Mini-check count | Status |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Place value and operations | `place-value-and-whole-number-operations` | `lib/clean/assessments/numberPlaceValueOperationsAssessmentItems.ts` | `lib/clean/practice/numberPlaceValueOperationsPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Additive strategies | `additive-strategies-and-problem-solving` | `lib/clean/assessments/numberAdditiveStrategiesAssessmentItems.ts` | `lib/clean/practice/numberAdditiveStrategiesPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
| Multiplication and division | `multiplication-division-fluency` | `lib/clean/assessments/numberMultiplicationDivisionFluencyAssessmentItems.ts` | `lib/clean/practice/numberMultiplicationDivisionFluencyPracticeModules.ts` | 12 | 4 | 4 | 4 | MVP loop complete |
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

Practice currently uses a lightweight local renderer. Richer widgets such as drag/drop classification, advanced matching, graphing, or canvas interactions are not part of this MVP layer yet.

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
- Practice is local-only.
- No evidence creation yet.
- No My Curriculum updates yet.
- No pathway progress updates yet.
- No AI marking.
- No video lessons yet.
- Practice widgets are lightweight, not rich drag/drop widgets yet.
- Browser walkthrough QA has not been completed for every loop.

## 12. Remaining Number Coverage

The mapped middle/upper Number spine is now MVP-complete at adaptive-loop level across the eight middle/upper banks listed above.

Year 3-5 foundation banks completed so far:

- Place value and operations
- Additive strategies
- Multiplication and division
- Fractions foundations
- Decimals foundations

Full Years 3-10 Number coverage still needs a gap check before moving sideways into other strands. The next Number phase is identifying any remaining Year 3-5 Number gaps, such as early equivalence, early multiplicative thinking, early patterns and relationships, and other missing foundation concepts.

## 13. Recommended Next Build Phase

Recommended next phase:

1. Do a browser/manual QA pass across the current Number adaptive spine.
2. Identify any remaining Year 3-5 Number gaps before adding more Number foundations.
3. Continue planning the remaining production route names and Number launcher/dashboard shape.
4. After the remaining Number gaps are clear, move sideways into Measurement, Geometry/Space, Statistics, Probability, Algebra and other Mathematics strands.

The next content decision should be based on a gap check across the current Year 3-5 Number foundations and the completed middle/upper Number spine.

## 14. Open Questions

- When should practice attempts be persisted?
- When should parent confirmation update `assessment_skill_statuses`?
- When should assessment/practice become evidence?
- What is the production route structure?
- Should there be a Number dashboard/launcher as the long-term entry point?
- How should lower Years 3-5 represent visual/concrete concepts?
- When should video lessons become a premium layer?
- How should sub-element mastery roll up into pathway progress?
