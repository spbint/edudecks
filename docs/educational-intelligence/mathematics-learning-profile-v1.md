# Mathematics Learning Profile V1

## Purpose and scope

The MyLearna Mathematics Learning Profile is the first parent-facing projection of `LearningEvidenceResultV1`. V1 presents the five independent continua in the **Number & Operations Starting Point**:

1. Number and place value
2. Counting processes
3. Additive strategies
4. Multiplicative strategies
5. Understanding money

It is not a whole-Mathematics assessment and does not produce an overall percentage, averaged level, rank, percentile or pass/fail outcome. Its central message is: **here is a useful starting point**.

## Existing result and report audit

Before this profile, the real Starting Point completion view used `AssessmentNumberOperationsParentUtilityCard` as its primary parent result and retained `AssessmentNumberOperationsProfileCard` for staff debugging. Those components already preserved five-area placement, deterministic recommendations and practice/My Pathways handoffs. Their wording exposed some technical progression bands and organised outcomes mainly around action categories rather than the canonical evidence-result statuses.

The deterministic completion boundary is `NumberOperationsBaselineSummarySnapshot`. `projectStartingPointCompletion` already converts that snapshot into `LearningEvidenceResultV1[]` plus `NumberOperationsLearningProfileV1`; the new presentation layer consumes that output without rescoring or rerouting.

Existing Homeschool output infrastructure uses `pdf-lib`, reusable drawing conventions and browser Blob downloads. Formal report export history uses persisted report records and was deliberately not reused. The Learning Profile PDF is generated directly from the in-memory presentation model and creates no export-history, assessment, learner, Portfolio or Pathways record. Existing browser print patterns also established `window.print()` as an appropriate print/save-PDF fallback.

## Architecture

The implemented flow is:

`deterministic Starting Point engine -> LearningEvidenceResultV1[] -> NumberOperationsLearningProfileV1 -> MathematicsLearningProfilePresentationV1 -> screen / print / PDF`

`MathematicsLearningProfilePresentationV1` is the single parent-facing model. It contains:

- report title, Number & Operations scope and whole-Mathematics disclaimer;
- minimal learner display label, assessed date and original/recheck classification;
- five ordered, independent area presentations;
- canonical developmental status plus fixed parent-safe explanation;
- parent-safe evidence sufficiency, limitation and practical-confirmation wording;
- parent-safe learning-position wording that does not expose P-level routing jargon;
- the existing deterministic handoff target, presented as **Continue learning**;
- an evidence guide and explicit human-control statement.

Technical item IDs, rule names, construct IDs, answer keys and raw response payloads remain in the canonical evidence layer and are not copied into the parent presentation.

## Status language

The presentation maps the canonical status directly to one of six labels: Secure, Consolidating, Developing, Needs support, Not enough evidence, or Practical confirmation required. It does not derive a new status. Colour is secondary; every state is written as text with an explanation.

Unknown and inaccessible evidence are never described as failure. A focused attempt leaves the four unassessed continua explicitly unknown. Practical confirmation remains distinct from electronic sufficiency.

## Screen and document projections

The responsive screen view provides profile metadata, a five-area overview, native keyboard-accessible `details` sections, evidence explanations, and next-learning links. CSS breakpoints are designed for 390px, 430px, tablet and desktop layouts without a fixed minimum width.

The browser print projection and downloadable PDF consume the same presentation model. Both use three purposeful sections rather than padded pages:

1. five-area overview;
2. detailed learning profile and evidence state;
3. recommended next learning and understanding the evidence.

The PDF uses the repository's existing `pdf-lib` dependency and is generated entirely in memory. Dynamic import keeps the PDF implementation out of the initial profile bundle until the parent selects **Download PDF**.

## Real Starting Point integration

The staff-protected real route now presents the new profile first at completion. Displayed question ID/version metadata is collected separately from answers so the canonical adapter can preserve item provenance without serialising the protected assessment estate. Browser-local drafts retain this minimal version manifest for in-progress continuation.

The previous completion presentation remains available in a collapsed **Staff equivalence view** while acceptance is in progress. This branch depends on the unmerged Starting Point player branch; it does not modify PR #220.

## Boundaries

- No database or Supabase dependency.
- No assessment-result or export-history write.
- No Portfolio inclusion or evidence write.
- No automatic My Pathways mutation.
- No analytics or third-party AI receives profile data.
- No LLM, embedding, generative scoring or recommendation dependency.
- All Starting Point release gates remain off.
- Production and customer visibility remain unchanged.
