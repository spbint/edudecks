# Assessment Trust and Persistence Model

## 1. Purpose

MyLearna now has a working local-only assessment session prototype at `/assessments/number-approximation-prototype`. Before assessment attempts are persisted, the product needs a clear trust model.

The core reason is simple: MyLearna should not silently convert one assessment session into a high-stakes learning judgement.

This model exists to protect:

- parent trust
- learner fairness
- accurate reporting
- clean separation between workflow progress and judgement confidence
- future AI/speech-to-text safety boundaries

The system should be able to save what happened in an assessment session, but it should not overclaim what that means without adult confirmation.

This document assumes the existing canonical pathway spine remains the source of identity:

- `subjectKey::strandKey::stageKey::stepKey`
- canonical step IDs are built in `lib/clean/pathways/pathwayStepRegistry.ts`

This document also preserves the current distinction between:

- pathway progress
- assessment confidence

They attach to the same canonical pathway step, but they mean different things and should remain separate.

## 2. Current local-only assessment flow

The current prototype is a local-only assessment session shell powered by:

- `lib/clean/assessments/numberApproximationAssessmentItems.ts`
- `app/components/clean/CleanNumberAssessmentPlayer.tsx`
- route: `app/(auth)/assessments/number-approximation-prototype/page.tsx`

Current behaviour:

1. An item bank is loaded locally.
2. One item is shown at a time.
3. Responses are stored in component state only.
4. Closed items can be locally checked.
5. Open responses default to adult review.
6. Misconception targets and practice recommendations are aggregated locally.
7. A summary is shown at the end of the session.
8. A parent judgement can be selected locally.
9. Nothing is saved to Supabase.
10. No formal My Assessments confidence status is updated.

Current local item-bank model already supports:

- `progressionBandKey`
- `progressionStepKey`
- `misconceptionTargets`
- `adaptiveRoute`
- `visualSupport`
- `openResponseReview`

This is the correct place to prototype trust and recommendation logic before persistence is introduced.

## 3. Proposed saved entities

The entities below are design proposals only. They are not migrations and should be reconciled with existing Supabase tables before implementation.

The current architecture already has:

- canonical pathway step identities in `pathwayStepRegistry.ts`
- pathway/evidence context encoding in `curriculumContext.ts`
- saved assessment confidence in `assessment_skill_statuses` via `lib/clean/assessments/client.ts`
- evidence records in the clean evidence layer

The proposed entities below are intended to sit around those systems, not replace them.

### `assessment_attempt`

Represents one assessment session.

Possible fields:

- `id`
- `learner_id`
- `family_id`
- `subject_key`
- `strand_key`
- `stage_key`
- `pathway_step_id`
- `progression_band_key`
- `item_bank_key`
- `started_at`
- `completed_at`
- `mode`
  - `diagnostic`
  - `mini_check`
  - `post_check`
  - `practice_check`
- `source_route`
- `status`
  - `in_progress`
  - `completed`
  - `abandoned`
- `local_summary_snapshot`

Notes:

- `pathway_step_id` should align with the existing canonical step registry.
- `local_summary_snapshot` should store the exact local insight summary produced at the end of the session so later reports can explain what the parent saw at the time.

### `assessment_attempt_response`

Represents one saved response to one item inside an attempt.

Possible fields:

- `id`
- `assessment_attempt_id`
- `item_id`
- `answer_type`
- `response_text`
- `selected_option`
- `local_result`
  - `correct`
  - `incorrect`
  - `review_needed`
  - `unanswered`
- `expected_answer_snapshot`
- `worked_solution_snapshot`
- `misconception_targets_snapshot`
- `adaptive_route_snapshot`
- `open_response_review_snapshot`
- `parent_review_status`
- `parent_review_note`

Notes:

- Snapshot fields matter because item-bank wording can change over time.
- A saved attempt should preserve the exact review context used during that session.

### `assessment_judgement`

Represents the adult-confirmed judgement after reviewing a completed attempt.

Possible fields:

- `id`
- `assessment_attempt_id`
- `learner_id`
- `pathway_step_id`
- `judgement`
  - `secure`
  - `developing`
  - `needs_support`
  - `not_enough_evidence`
- `assessment_confidence_suggestion`
- `confirmed_assessment_confidence`
- `confirmed_by`
- `confirmed_at`
- `parent_note`
- `should_update_my_assessments`
- `should_create_evidence`
- `should_update_pathway_progress`

Notes:

- This entity is where trust is enforced.
- The system may suggest a judgement or mapped confidence, but the parent confirms it here.

### `assessment_generated_evidence`

Optional evidence-link record when an assessment attempt becomes a formal evidence note.

Possible fields:

- `id`
- `assessment_attempt_id`
- `evidence_entry_id`
- `created_from_summary`
- `included_response_ids`
- `evidence_summary_text`

Notes:

- This should remain optional.
- Not every assessment attempt should automatically become report evidence.

## 4. What should save automatically vs require confirmation

### Save automatically

The following can be safely saved without changing formal learner status:

- attempt metadata
- item responses
- local result for each item
- local summary snapshot
- aggregated misconception patterns
- aggregated practice recommendations
- suggested next step

These describe what happened in the session, not the final truth claim about learning.

### Require parent confirmation

The following should require explicit parent confirmation:

- updating assessment confidence in My Assessments
- marking a pathway step as secure
- generating formal evidence from the assessment
- creating report-ready statements
- changing curriculum/reporting readiness based on the attempt

Reason:

- a single session is informative, but not always conclusive
- open responses need adult review
- even closed-item accuracy can overstate understanding if reasoning is weak
- confidence and reporting are high-trust outputs

## 5. Closed item vs open response handling

The persistence model should treat these differently.

### Closed / auto-checkable items

Examples:

- multiple choice
- numeric
- short exact answer
- future matching / ordering / classification items

These can be auto-checked locally and later persisted with:

- raw response
- local result
- misconception pattern
- recommendation signal

Even so, they should feed a suggestion, not silently overwrite formal assessment confidence.

### Open-response items

Examples:

- `worked_response`
- `explain_or_justify`
- future English / humanities / social science written responses

Default status should remain:

- `review_needed`

These should require adult review before any formal judgement is applied.

Future AI may later suggest:

- secure
- developing
- needs support

But AI should not hold final authority. Parent confirmation remains the final step.

## 6. Future AI and speech-to-text approach

Recommended future model:

1. Learner speaks or types a response.
2. If speech is used, speech-to-text creates a transcript.
3. The transcript is compared against success criteria and review prompts.
4. AI generates a suggestion only.
5. Parent confirms or overrides the final judgement.

Recommended privacy/cost policy:

- do not store raw audio for one-time assessment responses by default
- use speech-to-text only to generate a text transcript
- discard raw audio after transcription unless the parent explicitly chooses to save audio as evidence later

Rationale:

- reduces storage cost
- reduces privacy burden
- keeps one-time assessment interactions lightweight
- preserves the transcript as the reviewable learning record

This model aligns with the existing `openResponseReview` structure in the item bank:

- `expectedResponse`
- `successCriteria`
- `parentReviewPrompts`
- `aiReviewPrompt`
- `evidenceNote`

## 7. How assessment should update My Assessments

Current My Assessments uses the existing `assessment_skill_statuses` model from:

- `lib/clean/assessments/types.ts`
- `lib/clean/assessments/client.ts`

Current confidence values:

- `Not assessed yet`
- `Still developing`
- `Developing`
- `Secure`
- `Strong`

Recommended parent-confirmed flow:

1. Learner completes the assessment session.
2. The system saves or prepares attempt data.
3. The system generates a local insight summary.
4. The parent reviews any open responses.
5. The parent chooses a judgement.
6. The system suggests a mapped assessment confidence.
7. The parent confirms whether My Assessments should be updated.
8. Only then is `assessment_skill_statuses` updated.

Suggested mapping:

- Parent judgement `Secure` -> assessment confidence `Secure`
- Parent judgement `Developing` -> assessment confidence `Developing`
- Parent judgement `Needs support` -> assessment confidence `Still developing`
- Parent judgement `Not enough evidence yet` -> no confidence update

Important rule for `Strong`:

`Strong` should not come from one assessment alone unless the product later introduces a stricter policy. It should usually require:

- high closed-item accuracy
- strong reviewed reasoning
- repeated success over time
- or repeated evidence across more than one session

## 8. How assessment should update My Pathways

Pathway progress currently represents workflow state, not confidence judgement.

Current pathway workflow states in the product direction:

- `Not started`
- `Practising`
- `Evidence started`
- `Ready to assess`
- `Secure`

Recommended update rules:

- Completing an assessment attempt may confirm the step is now in `Ready to assess` or `Evidence started`, depending on surrounding flow.
- Parent-confirmed `Secure` may allow pathway progress to move to `Secure`.
- `Developing` may keep the pathway in `Practising` or `Ready to assess`.
- `Needs support` should suggest prerequisite practice or a step back, not silently skip forward.
- Pathway progress should not auto-jump to `Secure` without adult confirmation.

This preserves the distinction already reflected in `pathwayStepState.ts`, where unified step state brings together:

- pathway progress inferred from evidence
- assessment confidence
- evidence linkage

## 9. How assessment should become evidence

Assessment attempts should become evidence only when explicitly chosen.

Recommended flow:

1. Parent reviews the assessment summary.
2. Parent chooses `Save as evidence`.
3. The system creates a clean evidence entry.
4. The system attaches pathway context and assessment metadata.

Evidence should include:

- canonical pathway context
- item-bank name or progression band
- assessment summary
- selected response samples if useful
- parent judgement
- optional parent note

Open responses may be stronger evidence than auto-marked closed items because they often reveal reasoning.

Avoid:

- dumping every raw item response directly into reports by default
- turning low-signal closed items into report clutter

This should integrate with the current evidence context system in `curriculumContext.ts`, which already supports:

- `pathwayStepId`
- `subjectKey`
- `pathwayKey`
- `stageKey`
- `stepKey`
- `observedSkillStatus`

The current assessment workspace already knows how to create evidence-linked node metadata through `encodeAssessmentEvidenceNodeIds(...)`.

## 10. How assessment should feed My Curriculum / Learning Intelligence

Saved attempts and confirmed judgements should later flow into the Learning Intelligence layer.

Current learning-intelligence summaries already aggregate:

- assessment status counts
- evidence density
- recent activity
- strengths
- focus areas
- reporting readiness
- next learning steps

Relevant current files:

- `lib/clean/curriculum/learningIntelligenceSummary.ts`
- `app/components/clean/CleanLearningIntelligenceDashboard.tsx`

Future assessment attempt data can feed:

- subject confidence patterns
- strand readiness
- recent learning activity
- evidence density
- strengths
- focus areas
- reporting readiness
- suggested next steps

Important trust rule:

Local prototype insight is not the same as formal curriculum intelligence. Only saved attempts and confirmed judgements should affect the persistent dashboard layer.

The current prototype insight model is the seed of that future intelligence layer, not the final source of truth.

## 11. Adaptive routing model

### Stage 1 - local recommendation

This is the current prototype state.

It already:

- aggregates misconception targets
- aggregates practice recommendations
- shows a suggested next practice
- shows a suggested next step

This stays local-only for now.

### Stage 2 - post-assessment routing

After persistence is added, the system can recommend:

- a next pathway step
- a targeted practice set
- a prerequisite step if needed
- an extension direction if the learner is secure

This should happen after the session, not yet during the session.

### Stage 3 - in-assessment branching

Later, the system may adapt during the assessment itself:

- step up if mastery is obvious
- shorten the session if performance is consistently strong
- step down if prerequisite misconceptions repeat

This stage should not be implemented until Stage 1 and Stage 2 are trusted.

## 12. Risk controls

The model should include explicit safeguards:

- no silent high-stakes judgement
- no automatic `Secure` from one open response
- parent confirmation required before formal confidence update
- local-only prototypes clearly separated from saved judgement
- AI suggestions clearly labelled as suggestions
- raw audio not stored by default
- report language should reflect evidence, not overclaim certainty
- one session should inform judgement, not replace adult judgement

## 13. Recommended implementation phases

### Phase 1 - Persist attempts only

Save:

- assessment attempt
- assessment responses
- local summary snapshot

Do not update formal confidence yet.

### Phase 2 - Parent judgement save

Allow the parent to:

- review open responses
- confirm a judgement
- save a note

Still no automatic My Assessments update unless explicitly confirmed.

### Phase 3 - Update My Assessments after confirmation

After parent confirmation, write to the existing confidence system:

- `assessment_skill_statuses`

### Phase 4 - Save assessment summary as evidence

Allow parents to create a clean evidence record from the session summary and selected responses.

### Phase 5 - Feed My Curriculum intelligence

Use saved attempts and confirmed judgements to inform:

- recent activity
- focus areas
- strengths
- readiness
- next-step signals

### Phase 6 - Adaptive routing

After the trust model is stable, recommend:

- next practice
- prerequisite route
- extension route

### Phase 7 - AI-assisted review

Add optional premium support for typed or speech-to-text open responses, with:

- transcript-based review
- AI suggestion only
- parent confirmation still required

## 14. Open questions

These questions should be resolved before implementation work begins:

- Should every assessment attempt be saved automatically, or only completed attempts?
- Should abandoned attempts be saved?
- Should parents be able to delete or reset past attempts?
- Should a parent judgement always be required, or only when the system wants to change confidence?
- Should My Assessments update immediately after judgement, or only after explicit confirmation?
- Should assessment attempts be visible in Portfolio?
- Should open responses be reportable evidence by default?
- How should `Strong` be earned?
- How many successful attempts should be required before a pathway step can be treated as secure?
- Should there be separate save modes for diagnostic, mini-check, post-check, and practice-check attempts?
- Should assessment-generated evidence be full-detail or summary-first by default?
- How should evidence from assessment relate to existing capture notes when both exist for the same pathway step?

## Architecture alignment notes

This document is intentionally aligned with the current local architecture:

- canonical step identity in `lib/clean/pathways/pathwayStepRegistry.ts`
- unified evidence + assessment step state in `lib/clean/pathways/pathwayStepState.ts`
- assessment confidence types in `lib/clean/assessments/types.ts`
- current assessment persistence client in `lib/clean/assessments/client.ts`
- current typed assessment item bank in `lib/clean/assessments/numberApproximationAssessmentItems.ts`
- current local prototype player in `app/components/clean/CleanNumberAssessmentPlayer.tsx`
- current assessment workspace in `app/components/clean/CleanAssessmentsWorkspace.tsx`
- current pathway/capture context system in `lib/clean/evidence/curriculumContext.ts`
- current evidence workspace in `app/components/clean/CleanCaptureWorkspace.tsx`
- current learning intelligence aggregation in `lib/clean/curriculum/learningIntelligenceSummary.ts`
- current Learning Intelligence dashboard in `app/components/clean/CleanLearningIntelligenceDashboard.tsx`

This document does not propose replacing those systems. It proposes the trust and persistence layer that should connect them safely.
