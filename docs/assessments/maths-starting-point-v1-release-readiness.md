# Maths Starting Point v1 — release readiness

Status: **clean production-candidate branch; staff preview only; no database migration applied**

Branch: `feat/maths-parent-starting-point-v1`

## Parent utility

The intended parent loop is now implemented in the clean candidate:

**Find a starting point → explain each area → recommend learning → open practice/My Pathways → observe learning → recheck with fresh evidence**

The baseline keeps five areas separate:

- Number and place value
- Counting processes
- Additive strategies
- Multiplicative strategies
- Understanding money

It does not create one whole-child Maths level.

## Current release gates

The source-of-truth release object is:

`lib/clean/assessments/mathsStartingPointRelease.ts`

Current state:

- staff preview: enabled
- customer visibility: disabled
- customer navigation: disabled
- database persistence: disabled
- assessment-to-evidence write: disabled
- automatic Pathways mutation: disabled

These controls are intentionally independent from the legacy global Pathways assessment/practice switches.

## Clean preview route

`/assessments/maths-starting-point`

Current behaviour:

- authenticated route
- additionally wrapped in the existing staff assessment-lab access gate
- noindex/nofollow
- selected learner comes from the canonical family workspace
- multiple learners can be switched using the existing active-learner context
- in-progress browser draft is namespaced per learner
- no assessment record is written to Supabase
- visual-dependent counting/subitising items expose a practical-observation alternative instead of forcing inaccessible electronic evidence
- Money P1–P2 remain electronically blocked while their evidence mode is `asset-review`; having executable draft items does not bypass the evidence policy
- trusted score-bearing assets are controlled by `numberOperationsAssetApprovals.ts`; Australian currency schematic v1 is explicitly `pending-review`, not implicitly approved
- choosing that alternative leaves the area unresolved; it never manufactures a digital placement
- parent presentation suppresses P-level/routing/debug language during the assessment
- result leads with practical next action, not technical placement
- targeted practice uses the dedicated staff-gated `/practice/maths-starting-point` lane rather than the legacy practice gate
- practice section navigation preserves learner/source context and returns to the Maths starting-point utility

## Measurement

Privacy-safe first-party events:

- `maths_starting_point_opened`
- `maths_starting_point_area_resolved`
- `maths_starting_point_completed`
- `maths_starting_point_next_action_selected`
- `maths_starting_point_evidence_confirmation_previewed`

No learner names, learner IDs, answers, free-text notes, item response content, correctness counts, progression bands, focus-area results or placement outcomes are sent in analytics properties. Analytics measure product use rather than child performance.

## Persistence boundary prepared but not applied

Review-only foundation SQL:

`sql/clean/20261004_number_operations_baseline_persistence_review.sql`

Separate review-only activation SQL:

`sql/clean/20261004_number_operations_baseline_persistence_activation_review.sql`

The foundation explicitly revokes authenticated access to both new tables and revokes execution of the save RPC. The save RPC is SECURITY DEFINER but performs explicit auth, family-membership and learner-family checks. The activation file grants only read access to the tables plus execution of the controlled atomic save RPC — never direct table writes. Therefore applying the schema foundation alone cannot turn on baseline saves.

Dark client:

`lib/clean/assessments/placement/numberOperationsBaselinePersistenceClient.ts`

Proposed tables:

- `assessment_baseline_attempts`
- `assessment_baseline_responses`

The migration uses:

- clean family RLS
- same-family learner checks
- immutable attempt/response identity guards
- RPC-only customer writes (no direct authenticated table DML)
- one atomic save RPC
- concurrency-safe client submission idempotency
- family/learner/attempt consistency validation
- no service-role customer write path

The application client throws before touching Supabase while `persistenceEnabled` is false.

## Customer-release blocker contract

`numberOperationsCustomerReleaseReadiness.ts` computes the hard customer-release blockers from source-of-truth state. Customer launch currently remains blocked by:

- customer visibility and navigation gates;
- persistence not yet activated/smoke-tested;
- evidence writing not yet authorised;
- all 140 placement items remaining draft/review-only;
- one trusted asset set (Australian currency schematic v1) remaining pending visual approval.

Automatic Pathways mutation is intentionally **not** a customer-release requirement.

## Still intentionally not done

These require an explicit release decision after staff QA:

1. apply the baseline persistence migration to Supabase;
2. enable baseline persistence;
3. turn confirmed assessment results into Learning Chronicle evidence;
4. expose “Find a starting point” in customer My Pathways;
5. remove the staff-only access gate;
6. enable customer visibility.

None of those actions should be bundled implicitly.

## Staff hosted acceptance checklist

Before requesting the persistence/release decision:

1. Sign in as authorised MyLearna staff.
2. Open `/assessments/maths-starting-point` on the clean preview.
3. Confirm the correct learner is shown.
4. With multiple learners, switch learner and verify the baseline restarts/restores only that learner's browser draft.
5. Complete a direct-evidence route.
6. Confirm no P-level or routing jargon appears during the parent presentation.
7. Complete a routing-only/observation-needed route.
8. Confirm MyLearna says it needs a real-life example rather than inventing a placement.
9. Complete all five areas.
10. Confirm the result begins with “A clear starting point for what to do next”.
11. Confirm the recommended My Pathways link preserves the selected learner.
12. Confirm source-guided links open the intended canonical step and ambiguous mappings stay at strand level.
13. Confirm recheck guidance asks for fresh evidence rather than repeating the same items immediately.
14. Preview evidence confirmation and verify no database row is created.
15. Check phone widths at 390px and 430px.
16. Confirm no horizontal overflow, clipped controls or inaccessible answer targets.
17. Confirm Production remains unchanged.

## Decision point after acceptance

Only after the hosted staff acceptance passes should the next approval request be:

> Apply the reviewed baseline persistence foundation with authenticated RPC execution still revoked, verify RLS/isolation, then separately activate the save RPC for one authenticated save/read isolation smoke test while customer visibility remains disabled.

Customer launch should be a separate approval after persistence is proven.
