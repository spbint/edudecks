# MyLearna Educational Intelligence Engine v1

## Purpose

Build one educational-intelligence contract that can serve MyLearna Homeschool and MyLearna Campus without merging their child data into one shared customer database.

The engine is not an LLM wrapper. The authoritative sequence is:

learning activity -> evidence -> normalized EI event -> learner competency state -> recommendation -> educator/parent decision -> outcome -> model update

Large language models may later explain or summarize structured EI state, but they do not own the learner state and they do not silently make high-stakes judgements.

## Existing MyLearna assets to preserve

Homeschool already has strong foundations that should be adapted rather than replaced:

- canonical pathway identity in `lib/clean/pathways/pathwayStepRegistry.ts`
- unified pathway/evidence state in `lib/clean/pathways/pathwayStepState.ts`
- saved assessment sessions in `assessment_attempts`
- item responses in `assessment_attempt_responses`
- adult-confirmed progress judgements in `assessment_skill_statuses`
- evidence capture in `evidence_entries` and `evidence_entry_learner_links`
- learner action queue in `learning_queue_items`
- current UI aggregation in `lib/clean/curriculum/learningIntelligenceSummary.ts`

The current Learning Intelligence dashboard remains a product surface. EI v1 sits underneath it and produces traceable, reusable learner-state signals.

Older experimental EI tables in the connected database should not automatically become the new source of truth. Their ideas can be mined, but the new contract must align with the current clean Homeschool architecture and the current Campus architecture.

## Product boundary

### Shared

The following should be shared between Campus and Homeschool:

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

Campus and Homeschool should emit the same EI event contract through separate adapters.

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

`evidenceGroupId` is important. Twelve questions from one assessment are twelve events, but they are not twelve independent learning occasions. EI v1 collapses them into one evidence group when calculating evidence balance.

## EI v1 state

The first calculator is intentionally conservative.

It produces:

- event count
- independent evidence-group count
- source-type count
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

## Homeschool adapter map

Initial source adapters should be added in this order.

### 1. Assessment responses

Source:

- `assessment_attempt_responses`
- parent attempt in `assessment_attempts`

Mapping:

- competency ID: canonical `pathway_step_id` initially, with sub-element IDs later where stable
- evidence group: assessment attempt ID
- event type: `assessment_response`
- source kind: `assessment`
- provenance: source table + response ID

The adapter may normalize auto-check results into positive/negative signals, but this must remain separate from formal `assessment_skill_statuses`.

### 2. Adult judgement

Source:

- `assessment_skill_statuses`

Mapping:

- event type: `adult_judgement`
- source kind: `adult_judgement`
- competency ID: `pathway_step_id`
- evidence group: judgement row ID

This is a higher-trust source because it represents a human-confirmed judgement, but it still does not erase contradictory evidence.

### 3. Captured evidence

Source:

- `evidence_entries`
- `evidence_entry_learner_links`
- encoded pathway context

Mapping:

- event type: `evidence_observation`
- source kind: `evidence_capture`
- evidence group: evidence-entry ID
- competency ID: resolved canonical pathway-step ID

### 4. Practice and mini-checks

Persist these only after the current product boundary is deliberately changed. Practice is currently local-only and should not be treated as persistent EI evidence by accident.

## Campus adapter

Campus should emit the same event contract from:

- assessment results
- observations
- reviewed priorities
- interventions
- intervention reviews/outcomes

Campus data should remain in its own tenancy/data plane. The shared EI package should not require Campus to use Homeschool's family tables.

The Campus adapter must preserve organisation, campus/class and student authorization rules before any EI event is emitted.

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

This is especially important because Supabase is moving existing projects to explicit Data API exposure for new tables on 30 October 2026. New EI migrations should therefore use explicit grants/revokes rather than depending on legacy defaults.

## Processing model

Do not recompute a learner's entire history on every page load.

Target flow:

source write
-> adapter emits normalized EI event
-> background/state worker recalculates affected learner + competency
-> persisted EI state is updated
-> UI reads the prepared state

For v1, this can begin synchronously for low volume as long as the event/state interfaces remain worker-friendly.

At scale, move event processing behind a queue without changing the product contract.

## Trust rules

1. No single event can silently create a formal mastery judgement.
2. Multiple questions from one assessment session do not count as independent evidence.
3. Formal confidence and pathway progress remain separate from EI advisory state.
4. AI/LLM output is explanatory/recommendatory only unless an explicit future policy says otherwise.
5. Every recommendation must be traceable to source events and an engine version.
6. Contradictory evidence must remain visible.
7. Adult decisions must be recorded separately from machine suggestions.
8. Child data does not cross tenant or product boundaries merely to improve an AI model.
9. Raw media is not duplicated into the EI layer; EI stores references/provenance, not extra copies.
10. Training/evaluation datasets must be de-identified and governed separately from production application records.

## Rollout sequence

### EI-0: foundation — current branch

- shared event/state types
- conservative evidence-balance calculator
- tests
- architecture contract

### EI-1: Homeschool read-only adapter

Build normalized events in memory from:

- saved Number assessment attempts/responses
- adult progress judgements
- evidence entries

Show a developer/read-only EI state for one canonical pathway step.

No production writes.

### EI-2: persistence

Create reviewed versioned migration for internal EI event/state storage.

Requirements before merge:

- local migration generation/verification
- explicit grants/revokes
- RLS or private-schema boundary
- security advisor clean for the new objects
- no customer data backfill during initial migration

### EI-3: asynchronous updates

Emit events on new assessment/evidence/judgement actions and update only affected learner/competency states.

### EI-4: recommendations

Add deterministic recommendation rules:

- prerequisite check
- targeted practice
- re-check
- continue
- extension

Recommendations remain separate from actions.

### EI-5: Campus adapter

Install the same contract in Campus and map Campus assessment/observation/intervention signals into it.

### EI-6: calibrated learning models

Only after enough evaluated longitudinal data exists:

- Bayesian Knowledge Tracing or another interpretable mastery model
- item difficulty/discrimination modelling where item banks support it
- retention/recency models
- intervention effectiveness analysis

Do not label an uncalibrated evidence balance as a mastery probability.

### EI-7: LLM reasoning

Give an LLM structured learner state, graph context and allowed resources.

The LLM may:

- explain why a signal exists
- summarize supporting/contradictory evidence
- draft parent/teacher-facing language
- propose candidate next actions

The LLM may not invent missing evidence or silently write formal mastery.

## Immediate next implementation

1. Keep this branch isolated from production.
2. Add the Homeschool in-memory adapter for Number assessment attempts first.
3. Use one synthetic learner/test fixture to verify:
   - one 12-item assessment = one evidence group
   - repeated attempts become separate evidence groups
   - adult judgement is a separate evidence source
   - contradictory captured evidence remains visible
4. Feed the resulting advisory state into a developer-only representation.
5. Only after that design the database migration.

This sequence lets MyLearna begin building real educational intelligence without requiring new hardware, a new foundation model, or a risky production data migration.
