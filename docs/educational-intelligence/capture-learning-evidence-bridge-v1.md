# Capture → Learning Evidence Bridge V1

## Purpose and doctrine

This bridge makes authentic My Capture evidence available to MyLearna Educational Intelligence without converting the evidence into an educational judgement.

> MyLearna Educational Intelligence is evidence-led, curriculum-aware and human-controlled. Core educational judgements do not depend on generative AI.

A photo, video, note, work sample or observation can support a later governed interpretation. It is not itself `Secure`, `Developing`, a progression placement, a recommendation, a Portfolio decision or a Pathways mutation.

## Existing Capture architecture audited

- `/my-capture` and `/clean-my-capture` render `CleanCaptureWorkspace`; `/capture` retains the legacy `FamilyCaptureWorkspace` entry point.
- `CleanQuickCaptureWorkspace` is the mobile-first fast-capture surface. Learner, date, note and attachments can be recorded before optional classification work.
- `saveUnifiedLearningCapture` adapts the current Capture and other Homeschool surfaces into one `evidence_entries` record. It validates learner context and supports an idempotent in-flight submission key.
- `evidence_entries` remains the single raw/authentic evidence record. `capture_source`, learning area, curriculum-node references, observation text, and independent Portfolio/report choices are already present.
- `evidence_entry_learner_links` associates one evidence record with one or more learners. Its trigger verifies that the evidence and each learner share the same family; its RLS policies require family membership.
- Attachments remain in the governed `evidence` storage bucket. Upload reservations, quota accounting and `family_media_assets` govern storage and lifecycle. EI stores stable references only; it does not copy media bytes.
- Portfolio reads the same evidence record and has a separate `portfolio_highlights` relationship. `include_in_portfolio` and `include_in_report` are independent Capture choices.
- Existing `curriculum_node_ids` encode optional curriculum and Pathways context. They are useful presentation context, but are not a canonical EI construct-link ledger and are not repurposed as one.

## Boundary introduced by V1

`CapturedLearningEvidenceV1` is a persistence-neutral adapter over an existing `CleanEvidenceEntry`. It contains stable record/media references, source classification, provenance, review state and zero or more construct links. It deliberately does not contain developmental status, placement, scorer output or recommendations.

`CapturedEvidenceConstructLinkV1` records:

- the existing evidence record, family and learner;
- the canonical construct ID, domain, continuum and construct name;
- curriculum authority/framework/mapping versions;
- the human actor and assignment timestamp;
- evidence-relevance review state.

The bounded relevance states are `unreviewed`, `reviewed`, `confirmed-relevant` and `not-relevant`. “Confirmed relevant” means that this artifact is relevant evidence for the construct. It does not confirm the learner's developmental status.

The adapter supports `captured-photo`, `captured-video`, `work-sample`, `parent-observation`, `practical-observation`, `note` and `document-file`. `electronic-assessment` remains the separate structured evidence lane represented by `LearningEvidenceResultV1`.

## Persistence model

Migration source `20261009150337_capture_learning_evidence_v1.sql` adds `learning_evidence_artifact_links`. The table references existing `evidence_entries`; it creates no media store. A single capture may have zero, one or several defensible construct links.

The relation enforces a composite family/learner foreign key, validates that the evidence row belongs to the family, and requires an existing `evidence_entry_learner_links` participant relationship. RLS is enabled. Anonymous access is not granted. Authenticated access is limited through family membership and ownership joins. Link identity/provenance is immutable after insertion; only evidence-relevance review fields may change.

This migration is source-only in this batch. It has not been applied to Production or intelligence-staging.

## Timeline and longitudinal relationship

`projectLearningEvidenceTimeline` is a pure chronological projection over canonical assessment results and linked Capture evidence. It preserves each source type and provenance. Capture events always have `assessmentInterpretation: null`.

Assessment-to-assessment longitudinal comparison remains governed by the existing deterministic comparison. Authentic evidence may appear between an initial assessment and recheck, but it does not rewrite either historical result and is not claimed as the cause of a status transition.

## Staff lab and mobile boundary

The protected Results Preview includes a fixture-only **Capture evidence** view. Staff can select synthetic evidence, choose one or more canonical Number & Operations constructs and record a fixture relevance state. The screen then shows structured and authentic evidence together while naming their different lanes.

No customer route or Capture save handler writes `learning_evidence_artifact_links` in this batch. The existing mobile fast-capture path is unchanged; parents are not required to classify curriculum during capture.

## Explicit exclusions

- no `LearningEvidenceResultV1` is created or changed by a Capture link;
- no developmental status, progression placement or recommendation is inferred;
- no Portfolio inclusion is added automatically;
- no Pathways mutation occurs;
- no OCR, image recognition, embeddings, LLM or AI mapping is used;
- no Production schema/data or customer navigation is changed.

The next gate is a separately authorised intelligence-staging smoke: apply the migration, create or select disposable synthetic Capture evidence owned by the retained staging family/learner, exercise authenticated association and review, prove RLS/cross-tenant denial, reload the timeline, then remove disposable data as agreed.
