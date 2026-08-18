import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  parseCurriculumContextFromNodeIds,
  parsePathwayContextFromNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { Learner } from "@/lib/clean/learners/types";
import type {
  CleanProgram,
  CleanProgramSegment,
} from "@/lib/clean/programs/types";
import {
  LEARNER_THREAD_V1_SCHEMA_VERSION,
  type LearnerThreadConfidenceV1,
  type LearnerThreadDerivedClaimV1,
  type LearnerThreadFactKindV1,
  type LearnerThreadFactV1,
  type LearnerThreadFreshnessPolicyV1,
  type LearnerThreadFreshnessV1,
  type LearnerThreadNextStepV1,
  type LearnerThreadProvenanceV1,
  type LearnerThreadReferenceType,
  type LearnerThreadReferenceV1,
  type LearnerThreadSourceType,
  type LearnerThreadV1,
} from "@/lib/clean/learnerThread/types";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const THREAD_RULE_VERSION = "1.0.0";

const RECOGNIZED_PROGRESS_JUDGEMENTS = new Map(
  [
    "beginning",
    "needs support",
    "still developing",
    "working towards",
    "developing",
    "consolidating",
    "secure",
    "goal achieved",
    "goal achieved + extension",
    "strong",
  ].map((value) => [value, value] as const),
);

const DEVELOPING_PROGRESS_JUDGEMENTS = new Set([
  "beginning",
  "needs support",
  "still developing",
  "working towards",
  "developing",
]);

export type BuildHomeschoolLearnerThreadInput = {
  learner: Learner;
  programs?: readonly CleanProgram[];
  programSegments?: readonly CleanProgramSegment[];
  calendarItems?: readonly CleanCalendarItem[];
  evidenceEntries?: readonly CleanEvidenceEntry[];
  assessmentSkillStatuses?: readonly CleanAssessmentSkillStatus[];
  assessmentAttempts?: readonly CleanAssessmentAttempt[];
  asOf: string;
  freshnessPolicy: LearnerThreadFreshnessPolicyV1;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function reference(
  type: LearnerThreadReferenceType,
  id: string,
  label?: string | null,
): LearnerThreadReferenceV1 {
  return {
    type,
    id,
    ...(label === undefined ? {} : { label }),
  };
}

function uniqueReferences(
  ...groups: Array<readonly (LearnerThreadReferenceV1 | null | undefined)[]>
) {
  const index = new Map<string, LearnerThreadReferenceV1>();

  groups.flat().forEach((item) => {
    if (!item?.id) return;
    const key = `${item.type}:${item.id}`;
    if (!index.has(key)) index.set(key, item);
  });

  return [...index.values()];
}

function timestamp(value: string | null | undefined) {
  const parsed = Date.parse(safe(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function factTimestamp(fact: LearnerThreadFactV1) {
  return timestamp(fact.occurredAt) ?? timestamp(fact.recordedAt) ?? 0;
}

function buildFreshness(
  referenceAt: string | null,
  asOf: string,
  policy: LearnerThreadFreshnessPolicyV1,
): LearnerThreadFreshnessV1 {
  const referenceTime = timestamp(referenceAt);
  const asOfTime = timestamp(asOf);

  if (referenceTime === null || asOfTime === null) {
    return {
      status: "unavailable",
      asOf,
      referenceAt,
      ageDays: null,
      policy,
    };
  }

  const ageDays = Math.max(0, Math.floor((asOfTime - referenceTime) / DAY_IN_MILLISECONDS));

  return {
    status: ageDays > policy.staleAfterDays ? "stale" : "current",
    asOf,
    referenceAt,
    ageDays,
    policy,
  };
}

function directFactConfidence(): LearnerThreadConfidenceV1 {
  return {
    dataSufficiency: "sufficient",
    reason: "This fact is a direct projection of the identified source record.",
  };
}

function buildCapabilityReferences(nodeIds: readonly string[]) {
  const pathway = parsePathwayContextFromNodeIds([...nodeIds]);
  const curriculum = parseCurriculumContextFromNodeIds([...nodeIds]);
  const references: LearnerThreadReferenceV1[] = [];

  if (safe(pathway?.pathwayStepId)) {
    references.push(
      reference("pathway_step", safe(pathway?.pathwayStepId), pathway?.stepTitle),
    );
  } else if (
    safe(pathway?.subjectKey) &&
    safe(pathway?.pathwayKey) &&
    safe(pathway?.stageKey) &&
    safe(pathway?.stepKey)
  ) {
    references.push(
      reference(
        "pathway_step_key",
        [
          pathway?.subjectKey,
          pathway?.pathwayKey,
          pathway?.stageKey,
          pathway?.stepKey,
        ].map(safe).join(":"),
        pathway?.stepTitle,
      ),
    );
  } else if (safe(pathway?.pathwayKey)) {
    references.push(
      reference(
        "pathway",
        [pathway?.subjectKey, pathway?.pathwayKey].map(safe).filter(Boolean).join(":"),
        pathway?.pathwayLabel,
      ),
    );
  }

  if (safe(curriculum?.curriculumElementKey)) {
    references.push(
      reference(
        "curriculum_element",
        safe(curriculum?.curriculumElementKey),
        curriculum?.curriculumElementLabel,
      ),
    );
  }

  if (safe(curriculum?.learningAreaKey)) {
    references.push(
      reference(
        "learning_area",
        safe(curriculum?.learningAreaKey),
        curriculum?.learningAreaLabel,
      ),
    );
  }

  if (safe(curriculum?.authorityEvidenceAreaKey)) {
    references.push(
      reference(
        "authority_evidence_area",
        safe(curriculum?.authorityEvidenceAreaKey),
        curriculum?.authorityEvidenceAreaLabel,
      ),
    );
  }

  return uniqueReferences(references);
}

function normalizeExplicitProgressJudgement(value: unknown) {
  const text = safe(value);
  const normalized = text.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return RECOGNIZED_PROGRESS_JUDGEMENTS.has(normalized) ? text : null;
}

function getEvidenceProgressJudgement(entry: CleanEvidenceEntry) {
  const structuredReflectionValue = entry.reflection
    ?.match(/^Progress level:\s*([^\n.]+)/im)?.[1]
    ?.trim();
  const pathwayValue = parsePathwayContextFromNodeIds(
    entry.curriculumNodeIds,
  )?.observedSkillStatus;

  return (
    normalizeExplicitProgressJudgement(structuredReflectionValue) ||
    normalizeExplicitProgressJudgement(pathwayValue)
  );
}

function sourceReferencesForCalendarItem(item: CleanCalendarItem) {
  return uniqueReferences(
    [reference("calendar_item", item.id, item.title)],
    item.sourceTemplateBlockId
      ? [reference("template_block", item.sourceTemplateBlockId)]
      : [],
    item.generationRunId ? [reference("generation_run", item.generationRunId)] : [],
    item.marketplaceResourceId
      ? [reference("marketplace_resource", item.marketplaceResourceId)]
      : [],
  );
}

function calendarSourceTypes(item: CleanCalendarItem) {
  const types: LearnerThreadSourceType[] = ["calendar_derived"];
  types.push(item.sourceType === "manual" ? "parent_entered" : "system_derived");
  if (item.marketplaceResourceId) types.push("marketplace_derived");
  return types;
}

function buildFact(input: {
  id: string;
  kind: LearnerThreadFactKindV1;
  occurredAt: string | null;
  recordedAt: string | null;
  capabilityReferences?: LearnerThreadReferenceV1[];
  planActionReferences?: LearnerThreadReferenceV1[];
  evidenceReferences?: LearnerThreadReferenceV1[];
  explicitState?: string | null;
  explicitValue?: string | number | boolean | null;
  unit?: string | null;
  attributes?: Record<string, string | number | boolean | null>;
  provenance: LearnerThreadProvenanceV1;
  asOf: string;
  freshnessPolicy: LearnerThreadFreshnessPolicyV1;
}): LearnerThreadFactV1 {
  return {
    recordType: "fact",
    id: input.id,
    kind: input.kind,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    capabilityReferences: input.capabilityReferences || [],
    planActionReferences: input.planActionReferences || [],
    evidenceReferences: input.evidenceReferences || [],
    explicitValue: {
      state: input.explicitState ?? null,
      value: input.explicitValue ?? null,
      unit: input.unit ?? null,
      attributes: input.attributes || {},
    },
    provenance: input.provenance,
    confidence: directFactConfidence(),
    freshness: buildFreshness(
      input.occurredAt || input.recordedAt,
      input.asOf,
      input.freshnessPolicy,
    ),
  };
}

function assertionInputsAreValid(input: BuildHomeschoolLearnerThreadInput) {
  if (timestamp(input.asOf) === null) {
    throw new Error("Learner thread asOf must be a valid date or timestamp.");
  }

  if (
    !safe(input.freshnessPolicy.id) ||
    !safe(input.freshnessPolicy.version) ||
    !Number.isFinite(input.freshnessPolicy.staleAfterDays) ||
    input.freshnessPolicy.staleAfterDays < 0
  ) {
    throw new Error("Learner thread freshness policy must be explicit and valid.");
  }
}

export function buildHomeschoolLearnerThread(
  input: BuildHomeschoolLearnerThreadInput,
): LearnerThreadV1 {
  assertionInputsAreValid(input);

  const { learner, asOf, freshnessPolicy } = input;
  const familyId = learner.familyId;
  const learnerId = learner.id;
  const programs = (input.programs || []).filter(
    (program) =>
      program.familyId === familyId &&
      (program.learnerId === null || program.learnerId === learnerId),
  );
  const segments = (input.programSegments || []).filter(
    (segment) =>
      segment.familyId === familyId &&
      (segment.learnerId === null || segment.learnerId === learnerId),
  );
  const calendarItems = (input.calendarItems || []).filter(
    (item) => item.familyId === familyId && item.learnerId === learnerId,
  );
  const evidenceEntries = (input.evidenceEntries || []).filter(
    (entry) => entry.familyId === familyId && entry.learnerId === learnerId,
  );
  const assessmentStatuses = (input.assessmentSkillStatuses || []).filter(
    (status) => status.familyId === familyId && status.learnerId === learnerId,
  );
  const assessmentAttempts = (input.assessmentAttempts || []).filter(
    (attempt) => attempt.familyId === familyId && attempt.learnerId === learnerId,
  );
  const programById = new Map(programs.map((program) => [program.id, program]));
  const segmentById = new Map(segments.map((segment) => [segment.id, segment]));
  const calendarItemById = new Map(calendarItems.map((item) => [item.id, item]));
  const evidenceByCalendarItemId = new Map<string, CleanEvidenceEntry[]>();

  evidenceEntries.forEach((entry) => {
    if (!entry.calendarItemId || !calendarItemById.has(entry.calendarItemId)) return;
    const linked = evidenceByCalendarItemId.get(entry.calendarItemId) || [];
    linked.push(entry);
    evidenceByCalendarItemId.set(entry.calendarItemId, linked);
  });

  const facts: LearnerThreadFactV1[] = [];

  calendarItems.forEach((item) => {
    const program = item.programId ? programById.get(item.programId) : null;
    const segment = item.programSegmentId
      ? segmentById.get(item.programSegmentId)
      : item.sourceProgramSegmentId
        ? segmentById.get(item.sourceProgramSegmentId)
        : null;
    const calendarReference = reference("calendar_item", item.id, item.title);
    const programReference = program
      ? reference("program", program.id, program.title)
      : null;
    const segmentReference = segment
      ? reference("program_segment", segment.id, segment.title)
      : null;
    const linkedEvidenceReferences = (evidenceByCalendarItemId.get(item.id) || []).map(
      (entry) => reference("evidence_entry", entry.id, entry.title),
    );
    const planActionReferences = uniqueReferences(
      [calendarReference],
      [programReference, segmentReference],
    );
    const capabilityReferences = program
      ? buildCapabilityReferences(program.curriculumNodeIds)
      : [];
    const calendarSourceReferences = sourceReferencesForCalendarItem(item);
    const sourceTypes = calendarSourceTypes(item);

    facts.push(
      buildFact({
        id: `homeschool:calendar_item:${item.id}:planned`,
        kind: "plan_scheduled",
        occurredAt: item.plannedDate,
        recordedAt: item.createdAt,
        capabilityReferences,
        planActionReferences,
        evidenceReferences: linkedEvidenceReferences,
        explicitState: "planned",
        explicitValue: item.plannedDate,
        unit: "date",
        attributes: {
          calendarSourceType: item.sourceType,
          learningArea: item.learningArea,
          isHighlighted: item.isHighlighted,
        },
        provenance: {
          summary: "Projected from an existing learner-assigned calendar item and its explicit plan context.",
          sourceRecord: calendarReference,
          sourceReferences: uniqueReferences(
            calendarSourceReferences,
            [programReference, segmentReference],
          ),
          actorType: item.sourceType === "manual" ? "account_user" : "system",
          actorReference:
            item.sourceType === "manual"
              ? reference("user", item.createdByUserId)
              : null,
          sourceTypes,
        },
        asOf,
        freshnessPolicy,
      }),
    );

    if (item.completedAt) {
      facts.push(
        buildFact({
          id: `homeschool:calendar_item:${item.id}:completed`,
          kind: "plan_completed",
          occurredAt: item.completedAt,
          recordedAt: item.updatedAt,
          capabilityReferences,
          planActionReferences,
          evidenceReferences: linkedEvidenceReferences,
          explicitState: "completed",
          explicitValue: item.completedAt,
          unit: "timestamp",
          attributes: {
            calendarSourceType: item.sourceType,
          },
          provenance: {
            summary: "Projected from calendar_items.completed_at; the completing actor is not recorded by the current model.",
            sourceRecord: calendarReference,
            sourceReferences: uniqueReferences(
              calendarSourceReferences,
              [programReference, segmentReference],
            ),
            actorType: "unknown",
            actorReference: null,
            sourceTypes,
          },
          asOf,
          freshnessPolicy,
        }),
      );
    }
  });

  evidenceEntries.forEach((entry) => {
    const evidenceReference = reference("evidence_entry", entry.id, entry.title);
    const calendarItem = entry.calendarItemId
      ? calendarItemById.get(entry.calendarItemId)
      : null;
    const program = entry.programId ? programById.get(entry.programId) : null;
    const capabilityReferences = buildCapabilityReferences(entry.curriculumNodeIds);
    const planActionReferences = uniqueReferences(
      calendarItem
        ? [reference("calendar_item", calendarItem.id, calendarItem.title)]
        : [],
      program ? [reference("program", program.id, program.title)] : [],
    );
    const progressJudgement = getEvidenceProgressJudgement(entry);

    facts.push(
      buildFact({
        id: `homeschool:evidence_entry:${entry.id}:recorded`,
        kind: "evidence_recorded",
        occurredAt: entry.observedOn,
        recordedAt: entry.createdAt,
        capabilityReferences,
        planActionReferences,
        evidenceReferences: [evidenceReference],
        explicitState: "recorded",
        explicitValue: entry.attachmentUrls.length + (entry.imageUrl ? 1 : 0),
        unit: "attachments",
        attributes: {
          includeInPortfolio: entry.includeInPortfolio,
          includeInReport: entry.includeInReport,
          calendarLinked: Boolean(calendarItem),
        },
        provenance: {
          summary: "Projected from an existing learner evidence entry; narrative text was not interpreted.",
          sourceRecord: evidenceReference,
          sourceReferences: uniqueReferences(
            [evidenceReference],
            planActionReferences,
          ),
          actorType: "account_user",
          actorReference: reference("user", entry.createdByUserId),
          sourceTypes: ["parent_entered"],
        },
        asOf,
        freshnessPolicy,
      }),
    );

    if (progressJudgement) {
      facts.push(
        buildFact({
          id: `homeschool:evidence_entry:${entry.id}:progress-judgement`,
          kind: "progress_judgement_recorded",
          occurredAt: entry.observedOn,
          recordedAt: entry.createdAt,
          capabilityReferences,
          planActionReferences,
          evidenceReferences: [evidenceReference],
          explicitState: progressJudgement,
          attributes: {
            sourceField: "structured_progress_level_or_pathway_status",
          },
          provenance: {
            summary: "Projected only from the structured Progress level field or explicit pathway status tag on the evidence record.",
            sourceRecord: evidenceReference,
            sourceReferences: [evidenceReference],
            actorType: "account_user",
            actorReference: reference("user", entry.createdByUserId),
            sourceTypes: ["parent_entered"],
          },
          asOf,
          freshnessPolicy,
        }),
      );
    }
  });

  assessmentStatuses.forEach((status) => {
    const statusReference = reference("assessment_skill_status", status.id);
    const capabilityReference = reference(
      status.pathwayStepId ? "pathway_step" : "pathway_step_key",
      status.pathwayStepId || status.skillKey,
    );

    facts.push(
      buildFact({
        id: `homeschool:assessment_skill_status:${status.id}:recorded`,
        kind: "assessment_status_recorded",
        occurredAt: status.updatedAt || status.createdAt,
        recordedAt: status.createdAt,
        capabilityReferences: [capabilityReference],
        explicitState: status.status,
        attributes: {
          subjectKey: status.subjectKey,
          stageKey: status.stageKey,
          strandKey: status.strandKey,
          stepKey: status.stepKey,
        },
        provenance: {
          summary: "Projected from the explicitly saved assessment skill status; it is not treated as epistemic confidence.",
          sourceRecord: statusReference,
          sourceReferences: [statusReference, capabilityReference],
          actorType: "account_user",
          actorReference: reference("user", status.createdByUserId),
          sourceTypes: ["parent_entered"],
        },
        asOf,
        freshnessPolicy,
      }),
    );
  });

  assessmentAttempts.forEach((attempt) => {
    const attemptReference = reference("assessment_attempt", attempt.id);
    const capabilityReference = reference(
      "pathway_step",
      attempt.pathwayStepId,
    );
    const occurredAt = attempt.completedAt || attempt.startedAt || attempt.createdAt;
    const recordedAt = attempt.updatedAt || attempt.createdAt;

    facts.push(
      buildFact({
        id: `homeschool:assessment_attempt:${attempt.id}:recorded`,
        kind: "assessment_attempt_recorded",
        occurredAt,
        recordedAt,
        capabilityReferences: [capabilityReference],
        explicitState: attempt.status,
        explicitValue: attempt.autoCorrectCount,
        unit: "correct_responses",
        attributes: {
          mode: attempt.mode,
          itemCount: attempt.itemCount,
          attemptedCount: attempt.attemptedCount,
          autoIncorrectCount: attempt.autoIncorrectCount,
          reviewNeededCount: attempt.reviewNeededCount,
        },
        provenance: {
          summary: "Projected from explicit assessment attempt status and counts; no mastery conclusion was added.",
          sourceRecord: attemptReference,
          sourceReferences: [attemptReference, capabilityReference],
          actorType: "account_user",
          actorReference: reference("user", attempt.createdByUserId),
          sourceTypes: ["assessment_derived"],
        },
        asOf,
        freshnessPolicy,
      }),
    );

    const parentJudgement = normalizeExplicitProgressJudgement(
      attempt.summarySnapshot.parentJudgement,
    ) || normalizeExplicitProgressJudgement(
      attempt.summarySnapshot.parentJudgementPreview,
    );

    if (parentJudgement) {
      facts.push(
        buildFact({
          id: `homeschool:assessment_attempt:${attempt.id}:parent-judgement`,
          kind: "progress_judgement_recorded",
          occurredAt,
          recordedAt,
          capabilityReferences: [capabilityReference],
          explicitState: parentJudgement,
          attributes: {
            sourceField: "assessment_parent_judgement",
          },
          provenance: {
            summary: "Projected from the assessment attempt's explicit parent judgement field.",
            sourceRecord: attemptReference,
            sourceReferences: [attemptReference, capabilityReference],
            actorType: "account_user",
            actorReference: reference("user", attempt.createdByUserId),
            sourceTypes: ["parent_entered", "assessment_derived"],
          },
          asOf,
          freshnessPolicy,
        }),
      );
    }
  });

  facts.sort((left, right) => {
    const difference = factTimestamp(left) - factTimestamp(right);
    return difference || left.id.localeCompare(right.id);
  });

  const judgementFacts = facts.filter(
    (fact) =>
      fact.kind === "progress_judgement_recorded" ||
      (fact.kind === "assessment_status_recorded" &&
        safe(fact.explicitValue.state).toLowerCase() !== "not assessed yet"),
  );
  const latestJudgementFact = [...judgementFacts].sort(
    (left, right) => factTimestamp(right) - factTimestamp(left),
  )[0];
  const derivedClaims: LearnerThreadDerivedClaimV1[] = [];

  if (latestJudgementFact?.explicitValue.state) {
    derivedClaims.push({
      recordType: "derived_claim",
      id: `homeschool:claim:latest-explicit-judgement:${latestJudgementFact.id}`,
      kind: "latest_explicit_progress_judgement",
      statement: `Latest explicit judgement: ${latestJudgementFact.explicitValue.state}.`,
      derivedAt: asOf,
      capabilityReferences: latestJudgementFact.capabilityReferences,
      evidenceReferences: latestJudgementFact.evidenceReferences,
      basisReferences: uniqueReferences(
        [latestJudgementFact.provenance.sourceRecord],
        latestJudgementFact.capabilityReferences,
        latestJudgementFact.evidenceReferences,
      ),
      provenanceSummary: "Selected the most recent explicitly stored progress judgement; no progress state was inferred.",
      confidence: {
        dataSufficiency: "sufficient",
        reason: "The statement reports a direct explicit value and does not extend it into a mastery claim.",
      },
      freshness: latestJudgementFact.freshness,
      rule: {
        identifier: "learner-thread.latest-explicit-progress-judgement",
        version: THREAD_RULE_VERSION,
      },
    });
  }

  calendarItems.forEach((item) => {
    const actionAt = item.completedAt || item.plannedDate;
    const actionTime = timestamp(actionAt);
    if (actionTime === null) return;

    (evidenceByCalendarItemId.get(item.id) || []).forEach((entry) => {
      const evidenceTime = timestamp(entry.observedOn);
      if (evidenceTime === null || evidenceTime <= actionTime) return;

      const planFact = facts.find(
        (fact) => fact.id === `homeschool:calendar_item:${item.id}:planned`,
      );
      const evidenceFact = facts.find(
        (fact) => fact.id === `homeschool:evidence_entry:${entry.id}:recorded`,
      );
      if (!planFact || !evidenceFact) return;

      const calendarReference = reference("calendar_item", item.id, item.title);
      const evidenceReference = reference("evidence_entry", entry.id, entry.title);
      derivedClaims.push({
        recordType: "derived_claim",
        id: `homeschool:claim:possible-verification:${item.id}:${entry.id}`,
        kind: "possible_verification_evidence",
        statement: "Evidence exists after the planned action.",
        derivedAt: asOf,
        capabilityReferences: uniqueReferences(
          planFact.capabilityReferences,
          evidenceFact.capabilityReferences,
        ),
        evidenceReferences: [evidenceReference],
        basisReferences: [calendarReference, evidenceReference],
        provenanceSummary: "Derived only from the explicit calendar link and timestamp order; it does not assert outcome or causality.",
        confidence: {
          dataSufficiency: "limited",
          reason: "The records establish linkage and sequence, but not whether learning changed or what caused it.",
        },
        freshness: evidenceFact.freshness,
        rule: {
          identifier: "learner-thread.possible-verification-evidence-after-action",
          version: THREAD_RULE_VERSION,
        },
      });
    });
  });

  const verificationClaim = derivedClaims.find(
    (claim) => claim.kind === "possible_verification_evidence",
  );
  let nextStep: LearnerThreadNextStepV1 | null = null;

  if (verificationClaim) {
    nextStep = {
      kind: "review_possible_verification_evidence",
      suggestion: "Review the later evidence as possible verification of the planned action.",
      reason: "A learner-linked evidence entry was observed after its linked planned action; sequence alone does not establish improvement or causality.",
      basisReferences: verificationClaim.basisReferences,
      confidence: verificationClaim.confidence,
      freshness: verificationClaim.freshness,
      rule: {
        identifier: "learner-thread.next-step.review-possible-verification",
        version: THREAD_RULE_VERSION,
      },
    };
  } else if (
    latestJudgementFact?.explicitValue.state &&
    DEVELOPING_PROGRESS_JUDGEMENTS.has(
      safe(latestJudgementFact.explicitValue.state).toLowerCase(),
    ) &&
    latestJudgementFact.capabilityReferences.length > 0
  ) {
    const capabilityKeys = new Set(
      latestJudgementFact.capabilityReferences.map((item) => `${item.type}:${item.id}`),
    );
    const hasLaterCapabilityEvidence = facts.some(
      (fact) =>
        fact.kind === "evidence_recorded" &&
        factTimestamp(fact) > factTimestamp(latestJudgementFact) &&
        fact.capabilityReferences.some((item) =>
          capabilityKeys.has(`${item.type}:${item.id}`),
        ),
    );

    if (!hasLaterCapabilityEvidence) {
      nextStep = {
        kind: "schedule_follow_up_observation",
        suggestion: "Plan another observation or learning opportunity for this capability.",
        reason: "The latest explicit judgement is developing and the supplied records contain no later evidence for the same capability.",
        basisReferences: uniqueReferences(
          [latestJudgementFact.provenance.sourceRecord],
          latestJudgementFact.capabilityReferences,
        ),
        confidence: {
          dataSufficiency: "limited",
          reason: "The suggestion uses an explicit judgement and only the absence of follow-up in the supplied records.",
        },
        freshness: latestJudgementFact.freshness,
        rule: {
          identifier: "learner-thread.next-step.follow-up-developing-judgement",
          version: THREAD_RULE_VERSION,
        },
      };
    }
  }

  if (!nextStep) {
    const completedWithoutEvidence = calendarItems.find(
      (item) => item.completedAt && !(evidenceByCalendarItemId.get(item.id) || []).length,
    );

    if (completedWithoutEvidence) {
      const completionFact = facts.find(
        (fact) =>
          fact.id ===
          `homeschool:calendar_item:${completedWithoutEvidence.id}:completed`,
      );

      if (completionFact) {
        nextStep = {
          kind: "review_completion_without_evidence",
          suggestion: "Capture an observation or evidence if learning needs to be established.",
          reason: "The planned action is marked complete, but completion alone does not establish learning and no linked evidence is present.",
          basisReferences: [completionFact.provenance.sourceRecord],
          confidence: {
            dataSufficiency: "incomplete",
            reason: "The completion is explicit, while supporting evidence is absent from the supplied records.",
          },
          freshness: completionFact.freshness,
          rule: {
            identifier: "learner-thread.next-step.completion-is-not-evidence",
            version: THREAD_RULE_VERSION,
          },
        };
      }
    }
  }

  if (!nextStep) {
    const planWithoutEvidence = calendarItems.find(
      (item) => !(evidenceByCalendarItemId.get(item.id) || []).length,
    );

    if (planWithoutEvidence) {
      const planFact = facts.find(
        (fact) => fact.id === `homeschool:calendar_item:${planWithoutEvidence.id}:planned`,
      );

      if (planFact) {
        nextStep = {
          kind: "capture_evidence",
          suggestion: "Capture evidence after the planned learning opportunity.",
          reason: "A learner-assigned plan exists with no linked evidence in the supplied records.",
          basisReferences: [planFact.provenance.sourceRecord],
          confidence: {
            dataSufficiency: "incomplete",
            reason: "The plan is explicit, while linked evidence is absent from the supplied records.",
          },
          freshness: planFact.freshness,
          rule: {
            identifier: "learner-thread.next-step.capture-evidence-for-plan",
            version: THREAD_RULE_VERSION,
          },
        };
      }
    }
  }

  return {
    schemaVersion: LEARNER_THREAD_V1_SCHEMA_VERSION,
    product: "mylearna-homeschool",
    tenant: reference("family", familyId),
    learner: reference(
      "learner",
      learnerId,
      learner.preferredName || learner.firstName,
    ),
    generatedAt: asOf,
    freshnessPolicy,
    facts,
    derivedClaims,
    nextStep,
  };
}
