# MyLearna Campus -> Educational Intelligence v1 source map

## Status

Read-only architecture map based on the currently connected database schema.

This document does **not** change Campus tables, functions, views, policies or data.

The Campus application repository is not modified by this branch. The purpose is to define the source boundary that a future Campus Learner Thread adapter must follow.

## Core rule: prevent intelligence feedback loops

Campus already contains direct records and derived intelligence.

These must not be treated as equivalent.

### Lane A — direct learner evidence

Eligible to become Learner Thread facts:

- assessment results
- teacher/student evidence records
- explicit human judgements
- explicit intervention actions/reviews

### Lane B — human-reviewed interpretation

Eligible to become higher-trust Learner Thread facts only when the record proves a human reviewed/accepted the interpretation.

Examples:

- reviewed evidence impact
- explicit domain status reviewed by a user
- intervention review decision

### Lane C — derived intelligence

**Not eligible as fresh evidence input.**

Examples:

- student attribute state
- student attribute trend points
- risk bands
- priority scores
- suggested interventions
- profile summaries assembled from those states

These are outputs of prior rules/models. Feeding them back as if they were new learner evidence would make the system confirm its own conclusions.

They may be:

- displayed
- compared against the new EI engine
- used as migration/reference baselines
- used for evaluation

They must not silently become independent evidence groups.

---

## Tenancy and learner identity

Relevant structures:

- `organisations`
- `schools`
- `classes`
- `students`

Campus Learner Thread should resolve authorization/tenancy **before** projecting any learner facts.

Recommended thread identity:

- product: `mylearna-campus`
- tenant: school where school tenancy is authoritative, otherwise organisation
- learner: Campus student ID

The shared EI layer must not attempt to resolve a Campus student to a Homeschool learner.

---

## Assessments

### Direct tables

- `assessment_results`
- `assessment_instruments`
- `class_assessment_instruments`

`assessment_results` provides student, instrument, date/timestamp, numeric/text score, domain and instrument metadata.

`assessment_instruments` provides instrument identity, domain and `score_type`.

### Learner Thread projection

Recommended new Campus fact kind:

- `assessment_result_recorded`

Recommended references:

- student
- assessment instrument
- domain/competency reference when a valid mapping exists

### EI rule

Do **not** treat a raw numeric score as positive or negative until the instrument semantics are known.

A score of 40 may mean very different things on different instruments.

Initial Campus EI mapping should therefore be:

1. record the assessment occasion and provenance;
2. map the instrument to a competency/domain;
3. apply an instrument-specific interpretation rule only when versioned score semantics exist;
4. otherwise keep the result non-directional.

Existing derived views such as:

- `v_student_assessment_latest`
- `v_student_assessment_trend`

are useful read models but should not be emitted as independent evidence in addition to their underlying assessment results.

---

## Evidence

### Direct table

- `evidence`

Important fields include:

- organisation/school/student scope
- evidence date/type
- scale type/value/label
- curriculum framework/codes
- source key
- metadata
- creator

### Learner Thread projection

Reuse/extend the concept:

- `evidence_recorded`

A Campus evidence record should be non-directional unless an explicit structured scale/judgement has a defined educational interpretation.

Narrative description should not be classified by an LLM in EI v1.

### Evidence impacts

Table:

- `evidence_attribute_impacts`

This table contains:

- evidence ID
- student ID
- attribute ID/code
- suggested delta
- confidence
- reason
- status
- final delta
- reviewed-by user
- reviewed timestamp
- direction/weight

This table crosses the boundary between evidence and interpretation.

#### Suggested impact

If an impact is merely suggested by a rule/model:

- treat it as a derived claim;
- do not count it as independent learner evidence.

#### Human-reviewed impact

If the record demonstrates that a user reviewed/accepted the impact and a final value is stored:

- it may become a human-reviewed interpretation fact;
- it must retain the original evidence ID as its evidence-group ID so the evidence and its review do not count as two independent learning occasions.

This mirrors the Homeschool rule where an evidence entry and its attached progress judgement stay in one evidence group.

---

## Existing attribute intelligence

Tables:

- `attribute_definitions`
- `student_attribute_states`
- `student_attribute_trend_points`

The current attribute system contains domain definitions plus numeric state/trend history.

For EI v1 these are **legacy/current derived outputs**, not direct evidence.

Recommended use:

- comparison baseline against the new EI read model;
- regression testing;
- migration reference;
- intervention-outcome analysis.

Do not emit a new EI evidence event merely because `student_attribute_states.state_value` changed.

The underlying evidence or reviewed action that caused the change is the proper provenance source.

---

## Domain status

Table:

- `student_domain_status`

It contains:

- student
- domain
- status
- trend
- reviewed date
- reviewed by
- notes

Interpretation depends on provenance.

If `reviewed_by` / `reviewed_at` identify an explicit human judgement:

- project it as a human-reviewed judgement fact.

If it is system-maintained:

- treat it as a derived output.

The adapter must determine this from the Campus write path rather than guessing from the table shape alone.

---

## Learning tendencies

Table:

- `student_learning_tendencies`

This is potentially valuable for the future question:

> How does this learner tend to learn?

But it should not be mixed into competency mastery.

Recommended separate EI dimension:

- learner context / tendency observations

Examples could later support patterns such as:

- benefits from visual representation
- persists after feedback
- needs reduced task complexity
- transfers learning across contexts

These observations require careful governance and must remain explainable, contextual and revisable.

Do not turn them into fixed personality labels.

---

## Interventions

Direct/action tables include:

- `interventions`
- `intervention_students`
- `intervention_reviews`
- `intervention_evidence_links`
- `intervention_attribute_snapshots`
- `student_intervention_plans`
- `student_intervention_checkins`

Recommended Learner Thread fact kinds:

- `intervention_started`
- `intervention_reviewed`
- `intervention_outcome_recorded`

### Intervention started

An intervention start is an educator action, not evidence that the learner improved.

It belongs in the action/outcome chain:

learner state
-> recommendation/decision
-> intervention
-> later evidence
-> outcome evaluation

### Intervention reviews

A review is important provenance.

Store:

- review date
- intervention
- reviewer where available
- status at review
- linked evidence references
- next-step decision

Narrative review text should not be converted into a mastery signal automatically in v1.

### Attribute snapshots and deltas

`intervention_attribute_snapshots` and `v_intervention_deltas` provide baseline/review state comparisons.

These are useful for **intervention effectiveness**, but they are based on derived attribute state.

Therefore:

- use them as outcome/evaluation data;
- do not feed the delta back as a new independent competency-evidence event.

Otherwise the same underlying evidence can be counted once to update an attribute and a second time through the intervention delta.

---

## Priority and recommendation views

Examples:

- `v_class_overview_priority`
- `v_student_profile_overview`
- `v_suggested_interventions`

The inspected definitions show that these are calculated from derived attribute risk/state, staleness, MTSS/tier logic and related views.

They are **outputs**.

They must not become EI source evidence.

The new engine may later reproduce or replace their recommendation logic, but the correct migration pattern is:

old derived output
<-> evaluation comparison
<-> new derived output

not:

old derived output
-> new evidence
-> new derived output

---

## Proposed Campus Learner Thread projection

Future Campus adapter:

```
authorised Campus source records
        |
        +-- assessment_results
        |      -> assessment_result_recorded
        |
        +-- evidence
        |      -> evidence_recorded
        |
        +-- reviewed evidence_attribute_impacts
        |      -> human_reviewed_interpretation
        |
        +-- reviewed student_domain_status
        |      -> adult_judgement
        |
        +-- interventions
        |      -> intervention_started
        |
        +-- intervention_reviews
        |      -> intervention_reviewed
        |
        +-- later linked evidence/outcome
               -> intervention_outcome_recorded

Campus Learner Thread
        |
        v
shared buildEiEventsFromLearnerThread(...)
        |
        v
shared EI calculators / recommendation engine
```

Derived Campus views remain outside the source-evidence path.

---

## Shared competency identity

Campus currently uses several concepts:

- assessment instrument domain
- curriculum codes/frameworks
- attribute definitions
- domain status

These should not be collapsed by string matching.

Create an explicit mapping layer:

```
campus source concept
-> canonical MyLearna competency/domain ID
-> optional curriculum-framework mapping
```

Every mapping must be versioned and explainable.

Where no trustworthy mapping exists, retain the Campus source concept as a scoped reference and keep the EI signal at that level.

---

## Campus migration sequence

### C-EI-0 — schema map

Current document. Read-only.

### C-EI-1 — Campus Learner Thread contract

In the Campus repository:

- define Campus source fact kinds
- preserve tenancy
- preserve source record IDs
- preserve actor/reviewer provenance
- keep derived views out of evidence input

### C-EI-2 — synthetic adapter tests

Use synthetic students only.

Test:

- raw assessment result without score semantics stays non-directional
- reviewed human judgement is directional where policy defines it
- suggested impact is not independent evidence
- evidence + reviewed impact share one evidence group
- intervention start is not outcome evidence
- derived priority view is never emitted as evidence

### C-EI-3 — QA learner read-only comparison

For a controlled Campus QA learner:

compare:

- existing attribute/risk/priority outputs
- new Learner Thread facts
- new EI advisory state

No production state writes.

### C-EI-4 — intervention outcome evaluation

Use baseline/review snapshots to evaluate whether an intervention was followed by improvement, while retaining the distinction between:

- temporal association
- measured change
- causal claim

Do not claim causality from a before/after delta alone.

---

## Shared engine boundary

The same EI engine can serve Homeschool and Campus because the shared unit is not a database row.

The shared unit is:

**learner + competency/context + evidence occasion + provenance + interpretation status + time**

Homeschool and Campus remain separate data planes; they simply project into the same governed intelligence contract.
