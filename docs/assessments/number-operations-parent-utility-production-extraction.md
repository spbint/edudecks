# Number & Operations parent utility — production extraction contract

Status: **lab contract frozen for clean-port planning; do not merge the long-lived lab branch wholesale**

## Product outcome

The production feature is not a bank browser and not a one-off diagnostic.

The parent utility loop is:

**Find starting point → locate separate strengths/focus areas → explain → recommend next learning → open My Pathways/practice → collect evidence → recheck with fresh evidence**

The result must remain multi-dimensional. It must not average Number and Operations into one learner level.

## Why a clean extraction is required

The current research branch `feat/assessment-anchor-routing-lab` contains hundreds of experimental commits and several unrelated assessment proofs.

Production must be built from a **fresh branch off current `main`** and receive only the accepted contracts below.

## Port group A — trusted source and estate contracts

Port these first:

- `lib/clean/assessments/placement/numeracyProgressionRegistry.ts`
- `lib/clean/assessments/placement/legacyNumberAssessmentEstate.ts`
- `docs/assessments/legacy-number-estate-reconciliation-v1.md`

Purpose:

- preserve the QCAA/Australian Curriculum v9 Numeracy progression identity;
- freeze the existing 16-bank / 192-item estate;
- keep the accepted 135 Keep / 13 Rewrite / 44 Hold overlay explicit;
- prevent the legacy estate from silently becoming placement evidence.

## Port group B — Number & Operations measurement engine

Required first-slice engine:

- `numberOperationsAnchors.ts`
- `numberOperationsP0Items.ts`
- `numberOperationsNpvConfirmationItems.ts`
- `adaptiveProgressionRouting.ts`
- `adaptiveProgressionCoverage.ts`
- `numberOperationsRouteCoverage.ts`
- `numberOperationsItemRegistry.ts`
- `numberOperationsItemQuality.ts`
- `assessmentPlacementItemRegistry.ts`
- `assessmentPlacementItemQuality.ts`
- `numberOperationsAttemptTrace.ts`
- `numberOperationsPlacementResult.ts`
- `numberOperationsProfile.ts`
- `numberOperationsRecommendations.ts`
- `numberOperationsBaselineBudget.ts`
- `numberOperationsBaselineSnapshot.ts`
- `numberOperationsBaselineDraft.ts`
- `numberOperationsPersistenceDraft.ts`

Acceptance invariants:

- five independent continua:
  - Number and place value
  - Counting processes
  - Additive strategies
  - Multiplicative strategies
  - Understanding money
- 140 unique versioned placement items remain draft until the release gate;
- every enumerated first-slice route terminates;
- each single-area route remains 4–11 questions;
- complete baseline remains 20–55 questions;
- routing-only evidence cannot become high-confidence placement;
- no whole-child arithmetic mean or single “maths level”.

## Port group C — parent action intelligence

Required:

- `numberOperationsPracticeTargets.ts`
- `numberOperationsProgressionPathwayCrosswalk.ts`
- `numberOperationsPathwaysHandoff.ts`
- `numberOperationsParentUtility.ts`
- `numberOperationsRecheckPlan.ts`
- `numberOperationsEvidencePreview.ts`
- `numberOperationsEvidenceConfirmation.ts`

Product rules:

- lead with plain parent language, not P-levels;
- technical progression evidence is explanatory detail;
- use exact My Pathways step links only where the source-guided crosswalk resolves to a real canonical step;
- otherwise remain at strand level rather than inventing precision;
- recheck readiness is evidence-led, not a fixed calendar countdown;
- never repeat the same placement items immediately as “fresh evidence”;
- explicit adult confirmation is required before assessment evidence becomes a learning record;
- Portfolio/report inclusion remains an adult choice.

## Port group D — trusted renderer dependencies

The placement items depend on deterministic assessment/visual contracts introduced in the lab. Port only the pieces required by the first-slice estate:

- accepted changes to `mylearnaAssessTypes.ts`
- accepted changes to `mylearnaAssessScoring.ts`
- deterministic score-bearing visual templates used by the item registry
- corresponding accessibility helpers
- only renderer support exercised by the 140-item registry

Do not port unrelated experimental labs merely because they share the branch.

## Re-home these UI components; do not expose the lab namespace to parents

Use the accepted behaviour from:

- `AssessmentPlayerV1.tsx`
- `AssessmentAnchorPlacementRunner.tsx`
- `AssessmentNumberOperationsBaselineRunner.tsx`
- `AssessmentNumberOperationsParentUtilityCard.tsx`
- `AssessmentEvidencePreviewCard.tsx`
- `AssessmentEvidenceConfirmationCard.tsx`

But production should re-home them under a customer-facing assessment feature directory.

The parent entry should be from **My Pathways → Mathematics** with a calm action such as:

**Find a starting point**

Recommended authenticated production route:

`/assessments/maths-starting-point`

The route is implementation detail; My Pathways remains the primary parent journey.

## Do not port as production product surface

Keep these staff-only unless separately approved:

- `/assessment-lab/*` routes
- manual routing simulator controls
- item review labs
- cross-strand proof labs
- raw persistence JSON/debug panels
- staff evidence payload viewers
- implementation inventory/debug cards

## Persistence gate

No live baseline schema is authorised by this contract.

The existing design proposes:

- `assessment_baseline_attempts`
- `assessment_baseline_responses`

Before migration/write activation:

1. hosted parent-flow QA passes;
2. phone/mobile QA passes;
3. item/version snapshot payload is frozen;
4. parent utility/result language is accepted;
5. confirmation/evidence UX is accepted;
6. RLS and rollback SQL are reviewed;
7. one staging persistence smoke test is explicitly authorised.

Until then:

- local resumable draft is acceptable in lab;
- production customer data must not be written by the baseline;
- no pathway confidence/status mutation;
- no automatic Portfolio/report evidence.

## Production integration after persistence approval

When the persistence boundary is approved:

1. parent launches from Mathematics Pathways;
2. selected learner identity is explicit;
3. baseline can be resumed safely;
4. completed session writes immutable attempt/response evidence;
5. result renders parent utility first;
6. action opens exact source-guided pathway step where defensible, otherwise reviewed strand;
7. adult may confirm result as learning evidence;
8. confirmed evidence can feed Portfolio/report availability according to the adult choices;
9. recheck uses fresh item evidence after learning, not immediate repetition.

## CI extraction gate

Every future clean-port PR must at minimum run:

- all Number & Operations routing/coverage/item-quality tests;
- 192-item legacy estate reconciliation test;
- progression→Pathways crosswalk resolution test;
- parent utility and recheck tests;
- evidence confirmation tests;
- parent-facing card/component tests;
- TypeScript;
- production build.

This contract does **not** authorise merging the lab branch.
