import { EI_V1_POLICY } from "@/lib/clean/ei/policy";
import type {
  EiEvidenceBalanceState,
  EiEvidenceConfidence,
  EiEvidenceSignalBand,
  EiLearningEvent,
  EiSignalStrength,
} from "@/lib/clean/ei/types";

const STRENGTH_WEIGHTS: Record<EiSignalStrength, number> = {
  low: 0.5,
  moderate: 0.75,
  high: 1,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getConfidence(
  directionalEvidenceGroupCount: number,
  directionalSourceKindCount: number,
): EiEvidenceConfidence {
  const policy = EI_V1_POLICY.evidenceBalance;

  if (
    directionalEvidenceGroupCount >=
      policy.highConfidenceMinimumDirectionalGroups &&
    directionalSourceKindCount >=
      policy.highConfidenceMinimumDirectionalSourceKinds
  ) {
    return "high";
  }

  if (
    directionalEvidenceGroupCount >=
    policy.minimumDirectionalGroupsForSignal
  ) {
    return "moderate";
  }

  return "low";
}

function getSignalBand(
  directionalEvidenceGroupCount: number,
  supportRatio: number | null,
): EiEvidenceSignalBand {
  const policy = EI_V1_POLICY.evidenceBalance;

  if (
    directionalEvidenceGroupCount <
      policy.minimumDirectionalGroupsForSignal ||
    supportRatio === null
  ) {
    return "not_enough_evidence";
  }

  if (supportRatio < policy.needsAttentionUpperExclusive) {
    return "needs_attention";
  }

  if (supportRatio < policy.mixedUpperExclusive) return "mixed";
  if (supportRatio < policy.promisingUpperExclusive) {
    return "promising";
  }

  return "strong_signal";
}

function buildEvidenceGroups(events: EiLearningEvent[]) {
  const groups = new Map<
    string,
    {
      weightedPolarity: number;
      directionalWeight: number;
    }
  >();

  events.forEach((event) => {
    const current = groups.get(event.evidenceGroupId) ?? {
      weightedPolarity: 0,
      directionalWeight: 0,
    };

    if (event.signal.polarity !== 0) {
      const weight = STRENGTH_WEIGHTS[event.signal.strength];
      current.weightedPolarity += event.signal.polarity * weight;
      current.directionalWeight += weight;
    }

    groups.set(event.evidenceGroupId, current);
  });

  return [...groups.values()].map((group) => ({
    score:
      group.directionalWeight > 0
        ? clamp(
            group.weightedPolarity / group.directionalWeight,
            -1,
            1,
          )
        : null,
  }));
}

/**
 * EI v1 evidence balance is deliberately conservative.
 *
 * It is not a mastery probability and it must not update formal learner status.
 * Events from one assessment/session are collapsed into one evidence group so a
 * long test cannot masquerade as repeated independent evidence.
 *
 * Non-directional events (for example, "evidence exists" without a judgement)
 * remain visible in the evidence count, but they do not manufacture support or
 * contradiction.
 */
export function buildEiEvidenceBalanceState(
  events: EiLearningEvent[],
): EiEvidenceBalanceState | null {
  if (!events.length) return null;

  const first = events[0];
  const scopedEvents = events.filter(
    (event) =>
      event.learnerId === first.learnerId &&
      event.competencyId === first.competencyId,
  );

  if (!scopedEvents.length) return null;

  const groups = buildEvidenceGroups(scopedEvents);
  const directionalScores = groups
    .map((group) => group.score)
    .filter((score): score is number => score !== null);
  const evidenceGroupCount = groups.length;
  const directionalEvidenceGroupCount = directionalScores.length;
  const sourceKindCount = new Set(
    scopedEvents.map((event) => event.sourceKind),
  ).size;
  const directionalSourceKindCount = new Set(
    scopedEvents
      .filter((event) => event.signal.polarity !== 0)
      .map((event) => event.sourceKind),
  ).size;

  const supportRatio =
    directionalEvidenceGroupCount === 0
      ? null
      : clamp(
          (directionalScores.reduce((sum, score) => sum + score, 0) /
            directionalEvidenceGroupCount +
            1) /
            2,
          0,
          1,
        );

  const confidence = getConfidence(
    directionalEvidenceGroupCount,
    directionalSourceKindCount,
  );
  const signalBand = getSignalBand(
    directionalEvidenceGroupCount,
    supportRatio,
  );
  const latestTimestamp = scopedEvents.reduce(
    (latest, event) => Math.max(latest, parseTimestamp(event.occurredAt)),
    0,
  );

  const reasons: string[] = [];

  if (
    directionalEvidenceGroupCount <
    EI_V1_POLICY.evidenceBalance.minimumDirectionalGroupsForSignal
  ) {
    reasons.push(
      "Fewer than two independent directional evidence groups are available, so the engine will not make a strong learner-state claim.",
    );
  }

  if (
    directionalEvidenceGroupCount > 0 &&
    directionalSourceKindCount <
      EI_V1_POLICY.evidenceBalance
        .highConfidenceMinimumDirectionalSourceKinds
  ) {
    reasons.push(
      "Directional evidence currently comes from only one source type; corroboration from another source would increase trust.",
    );
  }

  if (evidenceGroupCount > directionalEvidenceGroupCount) {
    reasons.push(
      "Some learning records are non-directional: they show that evidence exists but do not by themselves assert success or difficulty.",
    );
  }

  if (signalBand === "needs_attention") {
    reasons.push(
      "The current directional evidence balance contains more contradiction than support.",
    );
  } else if (signalBand === "mixed") {
    reasons.push(
      "The available directional evidence is mixed and should be reviewed before acting.",
    );
  } else if (signalBand === "promising") {
    reasons.push(
      "The directional evidence balance is positive but should still be corroborated.",
    );
  } else if (signalBand === "strong_signal") {
    reasons.push(
      "The directional evidence balance is strongly positive, but this remains an advisory signal rather than a formal judgement.",
    );
  }

  return {
    engineVersion: EI_V1_POLICY.evidenceBalanceEngineVersion,
    policyVersion: EI_V1_POLICY.policyVersion,
    competencyId: first.competencyId,
    learnerId: first.learnerId,
    eventCount: scopedEvents.length,
    evidenceGroupCount,
    directionalEvidenceGroupCount,
    sourceKindCount,
    directionalSourceKindCount,
    supportRatio,
    confidence,
    signalBand,
    latestEvidenceAt:
      latestTimestamp > 0
        ? new Date(latestTimestamp).toISOString()
        : null,
    advisoryOnly: true,
    reasons,
  };
}
