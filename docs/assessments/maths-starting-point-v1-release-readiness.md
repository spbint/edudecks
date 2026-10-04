# Maths Starting Point v1 — release readiness

Status: **clean production-candidate branch; staff preview only; no database migration applied**

Branch: `feat/maths-parent-starting-point-v1`

## Parent utility

The intended parent loop is now implemented in the clean candidate for **Number & Operations**:

**My Pathways → Find a Number & Operations starting point → explain each area → recommend learning → open practice/My Pathways → return to the same learner profile → observe learning → recheck later with fresh evidence**

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
- staff entry is available from covered Mathematics Pathways strands only: Number and place value, Operations and calculation, and Financial and real-world mathematics
- the selected learner is preserved from My Pathways into the check, through targeted practice, and back to the same learner profile
- in-progress browser state and the completed starting-point profile are namespaced per learner in the current tab
- raw item-response traces are dropped from the completed browser-only state
- no assessment record is written to Supabase
- visual-dependent counting/subitising items expose a practical-observation alternative instead of forcing inaccessible electronic evidence
- Money P1–P2 remain electronically blocked while their evidence mode is `asset-review`; having executable draft items does not bypass the evidence policy
- trusted score-bearing assets are controlled by `numberOperationsAssetApprovals.ts`; Australian currency schematic v1 is explicitly `pending-review`, not implicitly approved
- choosing that alternative leaves the area unresolved; it never manufactures a digital placement
- unresolved areas provide area-specific practical-observation guidance and concrete evidence cues
- the parent question burden is transparent: each area is bounded and the experience pauses between areas
- parent presentation suppresses P-level/routing/debug language during the assessment
- customer-facing copy says Number & Operations rather than implying that v1 assesses all Mathematics
- result leads with practical next action, not technical placement
- raw progression bands stay behind optional technical disclosure
- zero-reportable-evidence runs cannot be confirmed into Portfolio/report evidence
- Portfolio evidence is the natural default after acknowledgement; report availability is an explicit opt-in
- targeted practice uses the dedicated staff-gated `/practice/maths-starting-point` lane rather than the legacy practice gate
- practice section navigation preserves learner/source context and returns to the Maths starting-point utility

## Measurement

Privacy-safe first-party events use `viewType: full | focused` to measure which parent workflow is useful without sending the selected Maths area.

Privacy-safe first-party events:

- `maths_starting_point_opened`
- `maths_starting_point_area_resolved`
- `maths_starting_point_completed`
- `maths_starting_point_next_action_selected`
- `maths_starting_point_evidence_confirmation_previewed`
- `maths_starting_point_practice_opened`
- `maths_starting_point_practice_completed`

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

These require explicit, separate release decisions after staff QA:

1. apply the reviewed **persistence foundation** with authenticated table/RPC access still revoked;
2. verify RLS, same-family learner isolation, immutable identity rules and rollback readiness;
3. apply the separate **RPC activation** only for one controlled authenticated save/read smoke test;
4. enable the application persistence gate only after that smoke test succeeds;
5. turn confirmed starting-point results into Learning Chronicle / Portfolio / report-available evidence according to the parent choices;
6. promote the accepted placement items out of draft/review status;
7. approve the trusted Australian currency schematic asset set or keep Money P1–P2 electronically blocked;
8. expose “Find a Number & Operations starting point” to customers in the covered My Pathways strands;
9. remove the staff-only access gate for the approved customer surface;
10. enable customer visibility.

None of those actions should be bundled implicitly.

None of those actions should be bundled implicitly.

## Staff hosted acceptance checklist

Before requesting the persistence/release decision:

1. Sign in as authorised MyLearna staff.
2. Open My Pathways, choose Mathematics and a covered v1 strand, and confirm the staff-only **Find a starting point** card appears.
3. Confirm the entry does **not** appear as a v1 action inside unrelated Mathematics strands such as Geometry or Measurement.
4. Open the starting-point utility and confirm the correct learner is carried through from My Pathways.
5. With multiple learners, switch learner and verify no other learner's browser-only state flashes or hydrates during the switch.
6. Confirm the parent intro says **Number & Operations**, not all Mathematics.
7. Complete a direct-evidence route and confirm no P-level/routing jargon appears during the parent presentation.
8. Trigger a visual-dependent accessible-form item and choose **Use a practical observation instead**; confirm the area is left open rather than scored.
9. Trigger a route toward Money P1–P2 and confirm the pending trusted-asset gate prevents electronic placement there.
10. Complete an observation-needed/routing-only route and confirm the result provides a practical action plus concrete **What to notice** cues.
11. Complete all five areas and confirm the result begins with **A clear starting point for what to do next**.
12. Confirm the primary **Start here** card includes fresh-evidence cues and no visible raw P-band.
13. Open optional technical details and confirm the progression band is available only there.
14. Open recommended targeted practice; confirm it uses the dedicated starting-point practice lane, preserves learner context, and returns to the same completed learner profile.
15. Confirm source-guided My Pathways links open the intended canonical step and ambiguous mappings stay at strand level.
16. Confirm recheck guidance asks for fresh evidence/readiness rather than repeating the same items immediately.
17. On a partial result, confirm unresolved-area guidance appears before evidence confirmation.
18. On a zero-reportable-evidence result, confirm Portfolio/report confirmation is not offered at all.
19. On a confirmable result, confirm Portfolio is selected by default, report availability is **not** selected by default, and no data is written in the staff preview.
20. Check phone widths at 390px and 430px, including ordering controls, fraction entry, learner switching, result cards and practice return.
21. Confirm no horizontal overflow, clipped controls or inaccessible answer targets.
22. Confirm Production and Supabase remain unchanged.

## Decision point after acceptance

Only after the hosted staff acceptance passes should the next approval request be:

> Apply the reviewed baseline persistence foundation with authenticated RPC execution still revoked, verify RLS/isolation, then separately activate the save RPC for one authenticated save/read isolation smoke test while customer visibility remains disabled.

Customer launch should be a separate approval after persistence is proven.
