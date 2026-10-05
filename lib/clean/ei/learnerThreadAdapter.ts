import { EI_V1_POLICY } from "@/lib/clean/ei/policy";
import type {
  EiEventType,
  EiLearningEvent,
  EiLearningSignal,
  EiProduct,
  EiSourceKind,
  EiTenantKind,
} from "@/lib/clean/ei/types";
import type {
  LearnerThreadFactV1,
  LearnerThreadReferenceV1,
  LearnerThreadV1,
} from "@/lib/clean/learnerThread/types";

const COMPETENCY_REFERENCE_PRIORITY = [
  "pathway_step",
  "pathway_step_key",
  "curriculum_element",
  "learning_area",
  "authority_evidence_area",
] as const;

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeState(value: unknown) {
  return safe(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function numeric(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function includesState(
  states: readonly string[],
  value: string,
) {
  return states.includes(value);
}

function productForThread(thread: LearnerThreadV1): EiProduct {
  return thread.product === "mylearna-campus" ? "campus" : "homeschool";
}

function tenantKindForThread(thread: LearnerThreadV1): EiTenantKind {
  if (thread.tenant.type === "family") return "family";
  if (thread.tenant.type === "school") return "school";
  return "organisation";
}

function originTableForReference(reference: LearnerThreadReferenceV1) {
  switch (reference.type) {
    case "assessment_attempt":
      return "assessment_attempts";
    case "assessment_skill_status":
      return "assessment_skill_statuses";
    case "evidence_entry":
      return "evidence_entries";
    case "calendar_item":
      return "calendar_items";
    default:
      return null;
  }
}

function resolveCompetencyReference(fact: LearnerThreadFactV1) {
  for (const type of COMPETENCY_REFERENCE_PRIORITY) {
    const reference = fact.capabilityReferences.find(
      (item) => item.type === type && safe(item.id),
    );
    if (!reference) continue;

    return {
      reference,
      competencyId:
        reference.type === "pathway_step"
          ? safe(reference.id)
          : `${reference.type}:${safe(reference.id)}`,
    };
  }

  return null;
}

function adultJudgementSignal(state: unknown): EiLearningSignal {
  const normalized = normalizeState(state);
  const policy = EI_V1_POLICY.adultJudgement;

  if (includesState(policy.positiveHigh, normalized)) {
    return {
      polarity: 1,
      strength: "high",
      rationale: `Explicit adult judgement recorded as "${safe(state)}".`,
    };
  }

  if (includesState(policy.positiveModerate, normalized)) {
    return {
      polarity: 1,
      strength: "moderate",
      rationale: `Explicit adult judgement recorded as "${safe(state)}".`,
    };
  }

  if (includesState(policy.negativeModerate, normalized)) {
    return {
      polarity: -1,
      strength: "moderate",
      rationale: `Explicit adult judgement recorded as "${safe(state)}".`,
    };
  }

  if (includesState(policy.nonDirectional, normalized)) {
    return {
      polarity: 0,
      strength: "moderate",
      rationale:
        `Explicit adult judgement recorded as "${safe(state)}"; EI v1 treats this as non-directional rather than forcing it into success or difficulty.`,
    };
  }

  return {
    polarity: 0,
    strength: "low",
    rationale:
      "The stored adult judgement is not mapped to a directional EI v1 signal.",
  };
}

function assessmentAttemptSignal(
  fact: LearnerThreadFactV1,
): EiLearningSignal {
  const correct = numeric(fact.explicitValue.value) ?? 0;
  const incorrect =
    numeric(fact.explicitValue.attributes.autoIncorrectCount) ?? 0;
  const reviewNeeded =
    numeric(fact.explicitValue.attributes.reviewNeededCount) ?? 0;
  const autoScorable = Math.max(0, correct) + Math.max(0, incorrect);

  if (autoScorable <= 0) {
    return {
      polarity: 0,
      strength: "low",
      rationale:
        "The completed assessment has no auto-scorable responses, so EI v1 records the occasion without inferring direction.",
    };
  }

  const correctRatio = Math.max(0, correct) / autoScorable;
  const strength = reviewNeeded > 0 ? "low" : "moderate";
  const policy = EI_V1_POLICY.assessment;

  if (correctRatio >= policy.positiveCorrectRatioAtOrAbove) {
    return {
      polarity: 1,
      strength,
      rationale:
        `Auto-checkable responses were ${Math.round(correctRatio * 100)}% correct. This is an assessment signal only, not a mastery judgement.`,
    };
  }

  if (correctRatio <= policy.negativeCorrectRatioAtOrBelow) {
    return {
      polarity: -1,
      strength,
      rationale:
        `Auto-checkable responses were ${Math.round(correctRatio * 100)}% correct. This flags possible difficulty for review; it is not a formal learner judgement.`,
    };
  }

  return {
    polarity: 0,
    strength: "low",
    rationale:
      `Auto-checkable responses were ${Math.round(correctRatio * 100)}% correct. EI v1 treats the middle range as non-directional.`,
  };
}

function eventDescriptor(fact: LearnerThreadFactV1): {
  eventType: EiEventType;
  sourceKind: EiSourceKind;
  signal: EiLearningSignal;
} | null {
  if (fact.kind === "evidence_recorded") {
    return {
      eventType: "evidence_observation",
      sourceKind: "evidence_capture",
      signal: {
        polarity: 0,
        strength: "low",
        rationale:
          "A learner-linked evidence record exists. EI v1 does not interpret its narrative text or treat existence alone as success.",
      },
    };
  }

  if (
    fact.kind === "progress_judgement_recorded" ||
    fact.kind === "assessment_status_recorded"
  ) {
    if (
      fact.kind === "assessment_status_recorded" &&
      includesState(
        EI_V1_POLICY.adultJudgement.ignored,
        normalizeState(fact.explicitValue.state),
      )
    ) {
      return null;
    }

    return {
      eventType: "adult_judgement",
      sourceKind: "adult_judgement",
      signal: adultJudgementSignal(fact.explicitValue.state),
    };
  }

  if (
    fact.kind === "assessment_attempt_recorded" &&
    normalizeState(fact.explicitValue.state) === "completed"
  ) {
    return {
      eventType: "assessment_attempt_completed",
      sourceKind: "assessment",
      signal: assessmentAttemptSignal(fact),
    };
  }

  return null;
}

/**
 * Converts the provenance-preserving Learner Thread into EI v1 events.
 *
 * This is intentionally downstream of Learner Thread. EI does not independently
 * reread the Homeschool source tables, which keeps "what happened" separate from
 * "what the intelligence layer thinks it may mean".
 */
export function buildEiEventsFromLearnerThread(
  thread: LearnerThreadV1,
): EiLearningEvent[] {
  const product = productForThread(thread);
  const tenantKind = tenantKindForThread(thread);
  const tenantId = safe(thread.tenant.id);
  const learnerId = safe(thread.learner.id);

  return thread.facts.flatMap((fact) => {
    const descriptor = eventDescriptor(fact);
    if (!descriptor) return [];

    const competency = resolveCompetencyReference(fact);
    if (!competency) return [];

    const sourceRecord = fact.provenance.sourceRecord;
    const sourceId = safe(sourceRecord.id);
    const occurredAt =
      safe(fact.occurredAt) ||
      safe(fact.recordedAt) ||
      safe(thread.generatedAt);

    if (!tenantId || !learnerId || !sourceId || !occurredAt) {
      return [];
    }

    const evidenceGroupId = `${sourceRecord.type}:${sourceId}`;

    return [
      {
        id: `ei:${fact.id}`,
        product,
        tenantKind,
        tenantId,
        learnerId,
        competencyId: competency.competencyId,
        eventType: descriptor.eventType,
        sourceKind: descriptor.sourceKind,
        sourceId,
        evidenceGroupId,
        occurredAt,
        signal: descriptor.signal,
        provenance: {
          originType: sourceRecord.type,
          originTable: originTableForReference(sourceRecord),
          originRecordId: sourceId,
          adapterVersion:
            EI_V1_POLICY.learnerThreadAdapterVersion,
          policyVersion: EI_V1_POLICY.policyVersion,
        },
        metadata: {
          learnerThreadFactId: fact.id,
          learnerThreadFactKind: fact.kind,
          sourceTypes: [...fact.provenance.sourceTypes],
          competencyReferenceType: competency.reference.type,
          explicitState: fact.explicitValue.state,
          freshnessStatus: fact.freshness.status,
          dataSufficiency: fact.confidence.dataSufficiency,
        },
      } satisfies EiLearningEvent,
    ];
  });
}
