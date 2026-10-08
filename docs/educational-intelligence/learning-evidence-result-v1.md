# Learning Evidence Result V1

## Purpose

Learning Evidence Result V1 is MyLearna's persistence-neutral canonical contract for one educational evidence interpretation. It is construct-level, not a generic test score. Starting Point profiles, future Mathematics Learning Profile PDFs, longitudinal comparisons, optional Portfolio inclusion and later Educational Intelligence features are projections or consumers of these canonical records.

> MyLearna Educational Intelligence is evidence-led, curriculum-aware and human-controlled. Core educational judgements do not depend on generative AI.

The required explanatory chain is preserved as:

`curriculum/progression -> construct -> evidence requirement -> evidence collected -> evidence interpretation -> developmental status -> recommended next learning -> provenance`

## Existing concepts reused

- `NumberOperationsPlacementResult` remains the authoritative deterministic placement output.
- `NumberOperationsSubElementAttemptTrace` supplies response and evidence-limitation provenance.
- `NumberOperationsBaselineSummarySnapshot` remains the current completion boundary.
- `NumberOperationsRecommendation` and its practice/Pathways handoff remain authoritative for next learning.
- The established five-continuum order and framework ID are preserved.
- Existing evidence ceilings (`routing-only` and provisional placement) are preserved, not converted into invented confidence.

The persisted `CleanAssessmentAttempt`, `CleanEvidenceEntry`, Portfolio highlight and percentage-oriented `LearningEvidenceEvent` models are intentionally not reused as the canonical result. They are storage or presentation contracts and cannot safely represent construct-level unknown, practical confirmation or full deterministic provenance.

## Canonical result and projections

`LearningEvidenceResultV1` records one learner, one assessment attempt and one continuum/construct interpretation. It contains stable identifiers rather than names, emails, full prompts or raw response payloads. Item IDs, item versions and bounded response outcomes provide evidence provenance without copying answer content.

The Number & Operations profile is a projection:

`LearningEvidenceResultV1[] -> NumberOperationsLearningProfileV1`

It always retains Number and place value, Counting processes, Additive strategies, Multiplicative strategies and Understanding money independently. A focused attempt leaves out-of-scope continua explicitly unknown. There is no overall percentage, averaged Maths level, percentile, rank or pass/fail result.

## Evidence and unknown states

Electronic assessment, practical observation, parent observation, teacher observation, work samples and later imported evidence are representable source types. Evidence availability and sufficiency are separate. Inaccessible or unavailable evidence therefore cannot silently become an incorrect response or a needs-support judgement.

Unknown remains unknown. Unresolved Starting Point output maps to `not-enough-evidence`; routing-only output maps to `practical-confirmation-required`. Practical confirmation can later be confirmed by a separate evidence source without rewriting the original electronic evidence provenance.

## Deterministic authority and recommendations

The adapter consumes the existing deterministic completion snapshot. It does not score, route, change a progression boundary or generate a recommendation. It records the existing recommendation, its deterministic identifier/version, target construct and handoff. `pathwayMutation` is permanently `not-requested` in V1.

There are no LLM calls, embeddings, generative interpretations, AI scores, AI recommendations or generated confidence values in this layer.

## Human control

Every result begins as not reviewed, not confirmed and with Portfolio inclusion not decided. Future parent or teacher review can add a note reference, confirmation or explicit inclusion decision. Creating a result never creates Portfolio evidence and never mutates My Pathways.

## Future boundaries

- **Persistence:** a later reviewed adapter may store this contract with family/tenant isolation. V1 performs no reads or writes.
- **Portfolio:** a later explicit human decision may project a result into a Portfolio evidence record. V1 does not do so automatically.
- **PDF/reporting:** the Mathematics Learning Profile PDF will be a presentation projection over canonical records and the Number & Operations profile.
- **Longitudinal comparison:** result identity includes attempt and construct identity, while evaluated timestamps and item/rule/mapping provenance allow later comparison of what changed and which new evidence caused it. V1 calculates no growth score.
- **Educational Intelligence:** later intelligence may organise and explain these evidence-led records, but core educational judgement remains deterministic and traceable to evidence and construct authority.
