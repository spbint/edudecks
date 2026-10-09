import type {
  LearningEvidenceRecommendation,
  LearningEvidenceResultV1,
} from "./learningEvidenceResult";

export const LEARNING_EVIDENCE_COMPARISON_SCHEMA =
  "mylearna-learning-evidence-comparison" as const;
export const LEARNING_EVIDENCE_COMPARISON_SCHEMA_VERSION = 1 as const;

export type LearningEvidenceChangeClassification =
  | "unchanged"
  | "new-evidence"
  | "evidence-now-sufficient"
  | "evidence-now-insufficient"
  | "still-unresolved"
  | "interpretation-changed"
  | "practical-confirmation-resolved"
  | "practical-confirmation-required"
  | "recommendation-changed"
  | "not-comparable";

export type LearningEvidenceComparisonState = {
  resultId: string;
  constructId: string;
  evaluatedAt: string;
  developmentalStatus: LearningEvidenceResultV1["interpretation"]["developmentalStatus"];
  evidenceSufficiency: LearningEvidenceResultV1["evidence"]["sufficiency"];
  evidenceAvailability: LearningEvidenceResultV1["evidence"]["availability"];
  assessmentScope: LearningEvidenceResultV1["evidence"]["assessmentScope"];
  practicalConfirmation: LearningEvidenceResultV1["evidence"]["practicalConfirmation"];
  progression: LearningEvidenceResultV1["construct"]["progression"];
  recommendation: LearningEvidenceRecommendation | null;
};

export type LearningEvidenceComparisonV1 = {
  schema: typeof LEARNING_EVIDENCE_COMPARISON_SCHEMA;
  schemaVersion: typeof LEARNING_EVIDENCE_COMPARISON_SCHEMA_VERSION;
  learnerId: string;
  previousAttemptId: string;
  currentAttemptId: string;
  learningDomain: LearningEvidenceResultV1["construct"]["learningDomain"];
  continuumId: string;
  continuumLabel: string;
  alignment: {
    constructSeriesId: string;
    previousConstructId: string;
    currentConstructId: string;
    curriculumMappingVersion: string;
    validity: "valid" | "not-comparable";
    reason:
      | "exact-construct"
      | "canonical-progression-construct"
      | "different-domain"
      | "different-continuum"
      | "different-authority"
      | "different-framework"
      | "different-mapping"
      | "different-construct";
  };
  previous: LearningEvidenceComparisonState;
  current: LearningEvidenceComparisonState;
  changes: {
    evidence:
      | "unchanged"
      | "new-evidence"
      | "evidence-now-sufficient"
      | "evidence-now-insufficient"
      | "evidence-state-changed"
      | "still-unresolved"
      | "not-comparable";
    interpretation:
      | "unchanged"
      | "became-interpretable"
      | "became-unresolved"
      | "changed"
      | "not-comparable";
    practicalConfirmation:
      | "unchanged"
      | "resolved"
      | "required"
      | "still-required"
      | "not-comparable";
    recommendation:
      | "unchanged"
      | "changed"
      | "became-available"
      | "became-unavailable"
      | "not-comparable";
    progression:
      | "unchanged"
      | "later-learning-position"
      | "earlier-learning-position"
      | "changed-without-direction"
      | "not-comparable";
  };
  classifications: LearningEvidenceChangeClassification[];
  provenance: {
    previous: LearningEvidenceResultV1["provenance"];
    current: LearningEvidenceResultV1["provenance"];
    assessmentVersionChanged: boolean;
    deterministicRuleVersionChanged: boolean;
    sourceItemVersionsChanged: boolean;
  };
};

const unresolvedSufficiency = new Set([
  "not-enough-evidence",
  "unavailable",
  "unresolved",
  "unknown",
]);

function cloneRecommendation(
  recommendation: LearningEvidenceRecommendation | null,
): LearningEvidenceRecommendation | null {
  return recommendation
    ? {
        ...recommendation,
        handoffTarget: { ...recommendation.handoffTarget },
      }
    : null;
}

function stateOf(result: LearningEvidenceResultV1): LearningEvidenceComparisonState {
  return {
    resultId: result.id,
    constructId: result.construct.constructId,
    evaluatedAt: result.evaluatedAt,
    developmentalStatus: result.interpretation.developmentalStatus,
    evidenceSufficiency: {
      state: result.evidence.sufficiency.state,
      reasonCodes: [...result.evidence.sufficiency.reasonCodes],
    },
    evidenceAvailability: result.evidence.availability,
    assessmentScope: result.evidence.assessmentScope,
    practicalConfirmation: { ...result.evidence.practicalConfirmation },
    progression: { ...result.construct.progression },
    recommendation: cloneRecommendation(result.recommendation),
  };
}

function isUnresolved(result: LearningEvidenceResultV1) {
  return (
    result.evidence.assessmentScope === "not-assessed" ||
    unresolvedSufficiency.has(result.evidence.sufficiency.state) ||
    result.interpretation.developmentalStatus === "not-enough-evidence"
  );
}

function canonicalConstructId(result: LearningEvidenceResultV1) {
  return `${result.construct.authority.frameworkId}::${result.construct.continuumId}::${result.construct.progression.identifier}`;
}

function alignmentFor(
  previous: LearningEvidenceResultV1,
  current: LearningEvidenceResultV1,
): LearningEvidenceComparisonV1["alignment"] {
  const base = {
    constructSeriesId: `${previous.construct.authority.frameworkId}::${previous.construct.continuumId}`,
    previousConstructId: previous.construct.constructId,
    currentConstructId: current.construct.constructId,
    curriculumMappingVersion: previous.provenance.curriculumMappingVersion,
  };
  const invalid = (
    reason: Exclude<LearningEvidenceComparisonV1["alignment"]["reason"], "exact-construct" | "canonical-progression-construct">,
  ) => ({ ...base, validity: "not-comparable" as const, reason });

  if (previous.construct.learningDomain !== current.construct.learningDomain) {
    return invalid("different-domain");
  }
  if (previous.construct.continuumId !== current.construct.continuumId) {
    return invalid("different-continuum");
  }
  if (previous.construct.authority.authorityId !== current.construct.authority.authorityId) {
    return invalid("different-authority");
  }
  if (
    previous.construct.authority.frameworkId !== current.construct.authority.frameworkId ||
    previous.construct.authority.frameworkVersion !== current.construct.authority.frameworkVersion
  ) {
    return invalid("different-framework");
  }
  if (
    previous.construct.authority.mappingVersion !== current.construct.authority.mappingVersion ||
    previous.provenance.curriculumMappingVersion !==
      current.provenance.curriculumMappingVersion
  ) {
    return invalid("different-mapping");
  }
  if (previous.construct.constructId === current.construct.constructId) {
    return { ...base, validity: "valid", reason: "exact-construct" };
  }
  if (
    previous.construct.constructId === canonicalConstructId(previous) &&
    current.construct.constructId === canonicalConstructId(current)
  ) {
    return {
      ...base,
      validity: "valid",
      reason: "canonical-progression-construct",
    };
  }
  return invalid("different-construct");
}

function evidenceKeys(result: LearningEvidenceResultV1) {
  return new Set([
    ...result.evidence.sources.map(
      (source) => `source:${source.sourceType}:${source.sourceId}`,
    ),
    ...result.evidence.itemReferences.map(
      (item) => `item:${item.itemId}:v${item.itemVersion}:${item.responseProvenance.outcome}`,
    ),
  ]);
}

function evidenceChange(
  previous: LearningEvidenceResultV1,
  current: LearningEvidenceResultV1,
): LearningEvidenceComparisonV1["changes"]["evidence"] {
  const previousUnresolved = isUnresolved(previous);
  const currentUnresolved = isUnresolved(current);
  if (previousUnresolved && currentUnresolved) return "still-unresolved";
  if (previousUnresolved && !currentUnresolved) return "evidence-now-sufficient";
  if (!previousUnresolved && currentUnresolved) return "evidence-now-insufficient";

  const previousKeys = evidenceKeys(previous);
  const hasNewEvidence = [...evidenceKeys(current)].some(
    (key) => !previousKeys.has(key),
  );
  if (hasNewEvidence) return "new-evidence";
  if (
    previous.evidence.sufficiency.state !== current.evidence.sufficiency.state ||
    previous.evidence.availability !== current.evidence.availability ||
    previous.evidence.assessmentScope !== current.evidence.assessmentScope
  ) {
    return "evidence-state-changed";
  }
  return "unchanged";
}

function interpretationChange(
  previous: LearningEvidenceResultV1,
  current: LearningEvidenceResultV1,
): LearningEvidenceComparisonV1["changes"]["interpretation"] {
  const previousUnresolved = isUnresolved(previous);
  const currentUnresolved = isUnresolved(current);
  if (previousUnresolved && !currentUnresolved) return "became-interpretable";
  if (!previousUnresolved && currentUnresolved) return "became-unresolved";
  return previous.interpretation.developmentalStatus ===
    current.interpretation.developmentalStatus
    ? "unchanged"
    : "changed";
}

function practicalChange(
  previous: LearningEvidenceResultV1,
  current: LearningEvidenceResultV1,
): LearningEvidenceComparisonV1["changes"]["practicalConfirmation"] {
  const before = previous.evidence.practicalConfirmation.state;
  const after = current.evidence.practicalConfirmation.state;
  if (
    before === "required" &&
    (after === "confirmed" || (after === "not-required" && !isUnresolved(current)))
  ) {
    return "resolved";
  }
  if (before === "required" && after === "required") return "still-required";
  if (before !== "required" && after === "required") return "required";
  return "unchanged";
}

function recommendationSignature(
  recommendation: LearningEvidenceRecommendation | null,
) {
  return recommendation
    ? JSON.stringify({
        id: recommendation.recommendationId,
        version: recommendation.recommendationVersion,
        category: recommendation.category,
        targetConstructId: recommendation.targetConstructId,
        targetProgressionIdentifier: recommendation.targetProgressionIdentifier,
        handoff: recommendation.handoffTarget,
        pathwayMutation: recommendation.pathwayMutation,
      })
    : null;
}

function recommendationChange(
  previous: LearningEvidenceResultV1,
  current: LearningEvidenceResultV1,
): LearningEvidenceComparisonV1["changes"]["recommendation"] {
  if (!previous.recommendation && current.recommendation) return "became-available";
  if (previous.recommendation && !current.recommendation) return "became-unavailable";
  return recommendationSignature(previous.recommendation) ===
    recommendationSignature(current.recommendation)
    ? "unchanged"
    : "changed";
}

function levelNumber(value: string | null) {
  const match = /^P(\d+)$/.exec(value ?? "");
  return match ? Number(match[1]) : null;
}

function progressionSpan(result: LearningEvidenceResultV1) {
  const progression = result.construct.progression;
  if (progression.kind === "unresolved") return null;
  const lower = levelNumber(progression.lowerLevel);
  const upper = levelNumber(progression.upperLevel);
  if (progression.kind === "band" && lower !== null && upper !== null) {
    return { lower, upper };
  }
  if (progression.kind === "endpoint" && lower !== null) {
    return { lower, upper: lower };
  }
  return null;
}

function progressionChange(
  previous: LearningEvidenceResultV1,
  current: LearningEvidenceResultV1,
): LearningEvidenceComparisonV1["changes"]["progression"] {
  if (
    JSON.stringify(previous.construct.progression) ===
    JSON.stringify(current.construct.progression)
  ) {
    return "unchanged";
  }
  if (isUnresolved(previous) || isUnresolved(current)) {
    return "changed-without-direction";
  }
  const before = progressionSpan(previous);
  const after = progressionSpan(current);
  if (!before || !after) return "changed-without-direction";
  if (after.lower > before.upper) return "later-learning-position";
  if (after.upper < before.lower) return "earlier-learning-position";
  return "changed-without-direction";
}

function classificationsFor(
  changes: LearningEvidenceComparisonV1["changes"],
): LearningEvidenceChangeClassification[] {
  if (changes.evidence === "not-comparable") return ["not-comparable"];
  const classifications = new Set<LearningEvidenceChangeClassification>();
  if (changes.evidence === "new-evidence") classifications.add("new-evidence");
  if (changes.evidence === "evidence-now-sufficient") {
    classifications.add("evidence-now-sufficient");
  }
  if (changes.evidence === "evidence-now-insufficient") {
    classifications.add("evidence-now-insufficient");
  }
  if (changes.evidence === "still-unresolved") classifications.add("still-unresolved");
  if (changes.interpretation === "changed") classifications.add("interpretation-changed");
  if (changes.practicalConfirmation === "resolved") {
    classifications.add("practical-confirmation-resolved");
  }
  if (
    changes.practicalConfirmation === "required" ||
    changes.practicalConfirmation === "still-required"
  ) {
    classifications.add("practical-confirmation-required");
  }
  if (changes.recommendation !== "unchanged") {
    classifications.add("recommendation-changed");
  }
  if (!classifications.size) classifications.add("unchanged");
  return [...classifications];
}

export function compareLearningEvidenceResults(
  previous: LearningEvidenceResultV1,
  current: LearningEvidenceResultV1,
): LearningEvidenceComparisonV1 {
  if (previous.learnerId !== current.learnerId) {
    throw new Error("Learning evidence comparison requires one learner.");
  }
  if (previous.assessment.attemptId === current.assessment.attemptId) {
    throw new Error("Learning evidence comparison requires two attempts.");
  }
  const previousTime = Date.parse(previous.evaluatedAt);
  const currentTime = Date.parse(current.evaluatedAt);
  if (
    !Number.isFinite(previousTime) ||
    !Number.isFinite(currentTime) ||
    currentTime < previousTime
  ) {
    throw new Error("Learning evidence comparison requires chronological evidence.");
  }

  const alignment = alignmentFor(previous, current);
  const notComparable = alignment.validity === "not-comparable";
  const changes: LearningEvidenceComparisonV1["changes"] = notComparable
    ? {
        evidence: "not-comparable",
        interpretation: "not-comparable",
        practicalConfirmation: "not-comparable",
        recommendation: "not-comparable",
        progression: "not-comparable",
      }
    : {
        evidence: evidenceChange(previous, current),
        interpretation: interpretationChange(previous, current),
        practicalConfirmation: practicalChange(previous, current),
        recommendation: recommendationChange(previous, current),
        progression: progressionChange(previous, current),
      };

  return {
    schema: LEARNING_EVIDENCE_COMPARISON_SCHEMA,
    schemaVersion: LEARNING_EVIDENCE_COMPARISON_SCHEMA_VERSION,
    learnerId: previous.learnerId,
    previousAttemptId: previous.assessment.attemptId,
    currentAttemptId: current.assessment.attemptId,
    learningDomain: previous.construct.learningDomain,
    continuumId: previous.construct.continuumId,
    continuumLabel: previous.construct.continuumLabel,
    alignment,
    previous: stateOf(previous),
    current: stateOf(current),
    changes,
    classifications: classificationsFor(changes),
    provenance: {
      previous: structuredClone(previous.provenance),
      current: structuredClone(current.provenance),
      assessmentVersionChanged:
        previous.assessment.assessmentVersion !== current.assessment.assessmentVersion,
      deterministicRuleVersionChanged:
        previous.provenance.deterministicRule.ruleId !==
          current.provenance.deterministicRule.ruleId ||
        previous.provenance.deterministicRule.ruleVersion !==
          current.provenance.deterministicRule.ruleVersion,
      sourceItemVersionsChanged:
        JSON.stringify(previous.provenance.sourceItemVersions) !==
        JSON.stringify(current.provenance.sourceItemVersions),
    },
  };
}
