# MyLearna Educational Intelligence Engine v1

## Purpose

Build one educational-intelligence contract that can serve MyLearna Homeschool and MyLearna Campus without merging their child data into one shared customer database.

The engine is not an LLM wrapper. The authoritative sequence is:

source records
-> Learner Thread facts
-> normalized EI events
-> learner competency state
-> recommendation
-> educator/parent decision
-> outcome
-> model update

Large language models may later explain or summarize structured EI state, but they do not own the learner state and they do not silently make high-stakes judgements.

## Architectural discovery: Learner Thread is the evidence spine

The current codebase already contains a product-aware, provenance-preserving learner history contract:

- `lib/clean/learnerThread/types.ts`
- `lib/clean/learnerThread/homeschoolAdapter.ts`

It already distinguishes:

- direct facts from derived claims
- source records and source references
- actor provenance
- source types
- freshness
- data sufficiency
- next-step suggestions

It also already declares both products:

- `mylearna-homeschool`
- `mylearna-campus`

EI v1 therefore sits **downstream of Learner Thread**.

That boundary is important:

- Learner Thread answers: **What happened, according to the product records?**
- EI answers: **What cautious learning signal can be calculated from those facts?**
- Recommendation logic answers: **What might be worth doing next?**
- The adult remains responsible for high-trust formal judgement.

EI should not independently reread the same raw tables and create a competing version of learner history.

## Existing MyLearna assets to preserve

Homeschool already has strong foundations that should be adapted rather than replaced:

- canonical pathway identity in `lib/clean/pathways/pathwayStepRegistry.ts`
- unified pathway/evidence state in `lib/clean/pathways/pathwayStepState.ts`
- saved assessment sessions in `assessment_attempts`
- item responses in `assessment_attempt_responses`
- adult-confirmed progress judgements in `assessment_skill_statuses`
- evidence capture in `evidence_entries` and `evidence_entry_learner_links`
- learner action queue in `learning_queue_items`
- provenance-preserving learner history in `lib/clean/learnerThread/*`
- current UI aggregation in `lib/clean/curriculum/learningIntelligenceSummary.ts`

The current Learning Intelligence dashboard remains a product surface. EI v1 sits underneath it and produces traceable, reusable learner-state signals.

Older experimental EI tables in the connected database should not automatically become the new source of truth. Their ideas can be mined, but the new contract must align with the current clean architecture and Learner Thread.

## Product boundary

### Shared

The following should be shared between Campus and Homeschool:

- Learner Thread schema semantics
- EI event vocabulary
- competency identifiers and graph semantics
- evidence-strength rules
- state-calculation interfaces
- recommendation schema
- provenance and audit rules
- evaluation harness
- model/version registry
- LLM prompt/output contracts

### Separate

The following remain product/tenant scoped:

- child identity
- family records
- school/student records
- raw evidence files
- source-system permissions
- retention rules
- product-specific UI

Do not create a cross-product learner identity graph in v1.

Each product should build its own Learner Thread from authorized product records. The shared EI layer consumes that thread.

## EI v1 event contract

Implemented in `lib/clean/ei/types.ts`.

Each event carries:

- product: Campus or Homeschool
- tenant kind and tenant ID
- learner ID scoped to that product
- canonical competency ID
- event type
- source kind and source record
- evidence-group ID
- timestamp
- normalized signal
- provenance and adapter version
- optional metadata

The Learner Thread adapter is implemented in:

- `lib/clean/ei/learnerThreadAdapter.ts`

### Evidence groups

`evidenceGroupId` prevents repeated records from masquerading as independent evidence.

Examples:

- many question-level records from one assessment session belong to one assessment evidence group
- an evidence entry and the adult progress judgement stored on that same entry belong to one evidence group
- an assessment attempt and a parent judgement stored inside that attempt belong to one evidence group
- a later independent evidence entry is a new evidence group

This distinction is essential for trustworthy learning analytics.

## EI v1 directional vs non-directional evidence

Not every learning record says whether a competency is strong or weak.

Examples of **non-directional evidence**:

- a photo or work sample exists
- an evidence note was captured
- an assessment was recorded but contains no auto-scorable responses
- an explicit state is `Developing`, where v1 deliberately refuses to force partial learning into either success or failure

Examples of **directional evidence**:

- a completed auto-checked assessment is strongly high or low on scorable items
- an adult explicitly records `Secure`
- an adult explicitly records `Needs support`

EI v1 therefore tracks both:

- total evidence-group count
- directional evidence-group count

A bare evidence record can improve provenance and context, but it cannot manufacture confidence.

## EI v1 state

The first calculator is intentionally conservative.

Implemented in:

- `lib/clean/ei/evidenceBalance.ts`

It produces:

- event count
- independent evidence-group count
- independent directional evidence-group count
- source-type count
- directional source-type count
- evidence support ratio
- evidence confidence band
- advisory signal band
- latest evidence timestamp
- human-readable reasons
- `advisoryOnly: true`

It does **not** produce a calibrated mastery probability yet.

It does **not** write `Secure`, pathway progress, report claims or curriculum coverage.

Those higher-trust outputs remain subject to the existing adult-confirmation rules.

## Signal bands

The v1 evidence layer uses:

- `not_enough_evidence`
- `needs_attention`
- `mixed`
- `promising`
- `strong_signal`

These are internal/advisory EI signals, not customer-facing formal attainment labels.

The purpose is to stop the system from converting a single assessment or observation into false certainty.

## Homeschool normalization path

The current Homeschool path is:

`assessment_attempts`
`assessment_skill_statuses`
`evidence_entries`
`calendar_items`
and related records

-> existing `buildHomeschoolLearnerThread(...)`

-> `buildEiEventsFromLearnerThread(...)`

-> `buildEiEvidenceBalanceState(...)`

This preserves one interpretation boundary.

### Assessment attempts

Learner Thread already creates an `assessment_attempt_recorded` fact containing:

- pathway-step reference
- attempt state
- correct-response count
- item count
- attempted count
- incorrect count
- review-needed count
- source provenance

EI v1 only converts a **completed** assessment attempt.

For auto-scorable responses:

- >= 80% correct -> positive, moderate signal
- <= 40% correct -> negative, moderate signal
- middle range -> non-directional
- any review-needed responses reduce signal strength
- no auto-scorable responses -> non-directional

These thresholds are v1 routing heuristics, not mastery thresholds.

They must later be evaluated against expert-labelled cases before being treated as stable educational rules.

### Adult judgement

Learner Thread already normalizes explicit progress judgements from saved sources.

EI v1 maps:

- `Secure`, `Strong`, `Goal achieved`, `Goal achieved + extension` -> positive/high
- `Consolidating` -> positive/moderate
- `Needs support`, `Still developing`, `Beginning` -> negative/moderate
- `Developing`, `Working towards` -> non-directional in v1

The middle states are intentionally not forced into a binary success/failure model.

### Captured evidence

A learner-linked evidence record becomes a non-directional `evidence_observation`.

EI v1 does **not** inspect or classify narrative text.

If the same evidence record contains an explicit structured progress judgement, Learner Thread emits that as a second fact, but EI keeps both facts in the same evidence group.

### Planning

Planning facts are ignored by EI v1 as evidence of learning.

A scheduled lesson is evidence of an intended opportunity, not evidence that learning happened.

## Assessment response depth later

The current Learner Thread represents assessment attempts at session level.

When EI needs item-level or sub-element modelling, extend Learner Thread with explicit assessment-response facts rather than bypassing it and querying `assessment_attempt_responses` directly from the EI layer.

That future extension should retain:

- attempt/session evidence-group ID
- item identity
- sub-element or competency identity
- auto-check result
- response provenance
- assessment/item-bank version

This allows Bayesian or item-response models later without losing the audit trail.

## Campus adapter

Campus should follow the same boundary:

Campus assessment/observation/intervention records
-> Campus Learner Thread adapter
-> shared EI Learner Thread adapter
-> shared EI state calculators

Candidate Campus facts should cover:

- assessment results
- teacher observations
- reviewed priorities
- intervention starts
- intervention reviews
- intervention outcomes

Campus data remains in its own tenancy/data plane. The shared EI package must not require Campus to use Homeschool family tables.

The Campus Learner Thread adapter must preserve organisation/school/class/student authorization before any facts are emitted.

## Competency graph

The current Homeschool pathway registry remains the canonical MyLearna authoring source in the first implementation.

Add graph semantics around canonical competency IDs rather than creating a second curriculum hierarchy.

Required relation types:

- `prerequisite_of`
- `part_of`
- `next_step`
- `related_to`
- `maps_to_framework_item`

The long-term exchange model should remain compatible with 1EdTech CASE concepts: unique competency identifiers, hierarchical relationships and associations between frameworks.

## Learning-event interoperability

The internal event contract should remain capable of mapping to Caliper-style learning events without copying Caliper literally into the application domain.

This keeps MyLearna free to expose or ingest standard learning-analytics events later while preserving a simpler internal contract.

## Proposed persistence layer

Do not add these tables to production until the event contract and adapters have passed local/preview tests.

Recommended internal tables:

- `ei_learning_events`
- `ei_competency_states`
- `ei_state_history`
- `ei_misconception_signals`
- `ei_recommendations`
- `ei_recommendation_decisions`
- `ei_outcomes`
- `ei_engine_runs`

Recommended fields across calculated objects:

- engine version
- rule/model version
- source event IDs
- calculation timestamp
- confidence/evidence basis
- tenant scope
- learner scope
- competency scope

### Security placement

Prefer internal EI tables in a non-exposed schema and access them from trusted server-side code. Publish only the minimum safe learner-facing view or API needed by the product.

If any EI table is placed in an exposed schema:

- explicitly grant only required privileges
- enable RLS
- apply tenant/learner ownership rules
- never rely on `TO authenticated` alone
- never expose service-role credentials to the browser

Supabase is moving existing projects to explicit Data API exposure for new tables on 30 October 2026. New EI migrations should therefore use explicit grants/revokes rather than depending on legacy defaults.

## Processing model

Do not recompute a learner's entire history on every page load.

Target flow:

authorized product write
-> product Learner Thread fact
-> EI event
-> affected learner + competency recalculation
-> persisted EI state
-> UI reads prepared state

For v1, this can begin synchronously and in memory for low volume as long as the interfaces remain worker-friendly.

At scale, move event processing behind a queue without changing the product contract.

## Trust rules

1. No single event can silently create a formal mastery judgement.
2. Multiple records from one assessment/session do not count as independent evidence.
3. Evidence existence is not the same as directional evidence.
4. Formal confidence and pathway progress remain separate from EI advisory state.
5. AI/LLM output is explanatory/recommendatory only unless an explicit future policy says otherwise.
6. Every recommendation must be traceable to source facts/events and an engine version.
7. Contradictory evidence must remain visible.
8. Adult decisions must be recorded separately from machine suggestions.
9. Child data does not cross tenant or product boundaries merely to improve an AI model.
10. Raw media is not duplicated into the EI layer; EI stores references/provenance, not extra copies.
11. Training/evaluation datasets must be de-identified and governed separately from production application records.
12. Learner Thread remains the authority for source history; EI must not create a parallel history by rereading raw product tables independently.

## Rollout sequence

### EI-0: foundation — current branch

Implemented:

- shared event/state types
- conservative evidence-balance calculator
- distinction between evidence existence and directional evidence
- Learner Thread -> EI adapter
- trust-boundary tests
- architecture contract

### EI-1: Homeschool read-only vertical slice

Next:

1. Build a developer-only read model for one learner + one canonical pathway step.
2. Feed that model from the existing Homeschool Learner Thread.
3. Show:
   - contributing facts
   - evidence groups
   - directional evidence groups
   - support balance
   - confidence
   - contradictions
   - reasons
4. Do not write any formal progress state.
5. Test with synthetic fixtures first, then a controlled QA learner if approved.

No production schema change is required for EI-1.

### EI-2: evaluation harness

Before persistence, create educator-labelled cases that test:

- insufficient evidence
- strong repeated evidence
- contradictory evidence
- assessment vs observation disagreement
- stale evidence
- developing/middle states
- prerequisite-gap scenarios later

A rule change should be measurable against these cases.

### EI-3: persistence

Only after EI-1 and EI-2 are stable, create a reviewed versioned migration for internal EI event/state storage.

Requirements before merge:

- explicit grants/revokes
- RLS or private-schema boundary
- security advisor clean for new objects
- no customer-data backfill during initial migration
- provenance/version fields mandatory

### EI-4: asynchronous updates

Emit/update EI state after new learner facts and recalculate only affected learner/competency pairs.

### EI-5: deterministic recommendations

Add separate, explainable recommendation rules:

- prerequisite check
- targeted practice
- re-check
- continue
- extension

Recommendations remain separate from actions and formal learner state.

### EI-6: Campus Learner Thread adapter

Map Campus assessment/observation/intervention facts into the same Learner Thread and EI contracts.

### EI-7: calibrated learning models

Only after enough evaluated longitudinal data exists:

- Bayesian Knowledge Tracing or another interpretable mastery model
- item difficulty/discrimination modelling where item banks support it
- retention/recency models
- intervention-effectiveness analysis

Do not label an uncalibrated evidence balance as a mastery probability.

### EI-8: LLM reasoning

Give an LLM structured learner state, graph context and allowed resources.

The LLM may:

- explain why a signal exists
- summarize supporting/contradictory evidence
- draft parent/teacher-facing language
- propose candidate next actions

The LLM may not invent missing evidence or silently write formal mastery.

## Current branch boundary

The current feature branch is deliberately safe:

- no production database migration
- no production learner-state writes
- no formal assessment-confidence updates
- no pathway-progress updates
- no report/curriculum claims
- no LLM calls
- no raw child data copied to a new store

The next useful implementation is the EI-1 read-only vertical slice.
