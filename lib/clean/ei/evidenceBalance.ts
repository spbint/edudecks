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
  evidenceGroupCount: number,
  sourceKindCount: number,
): EiEvidenceConfidence {
  if (evidenceGroupCount >= 3 && sourceKindCount >= 2) {
    return "high";
  }

  if (evidenceGroupCount >= 2) {
    return "moderate";
  }

  return "low";
}

function getSignalBand(
  evidenceGroupCount: number,
  supportRatio: number | null,
): EiEvidenceSignalBand {
  if (evidenceGroupCount < 2 || supportRatio === null) {
    return "not_enough_evidence";
  }

  if (supportRatio < 0.35) return "needs_attention";
  if (supportRatio < 0.6) return "mixed";
  if (supportRatio < 0.8) return "promising";
  return "strong_signal";
}

function buildEvidenceGroupScores(events: EiLearningEvent[]) {
  const groups = new Map<
    string,
    {
      weightedPolarity: number;
      totalWeight: number;
    }
  >();

  events.forEach((event) => {
    const weight = STRENGTH_WEIGHTS[event.signal.strength];
    const current = groups.get(event.evidenceGroupId) ?? {
      weightedPolarity: 0,
      totalWeight: 0,
    };

    current.weightedPolarity += event.signal.polarity * weight;
    current.totalWeight += weight;
    groups.set(event.evidenceGroupId, current);
  });

  return [...groups.values()]
    .filter((group) => group.totalWeight > 0)
    .map((group) => clamp(group.weightedPolarity / group.totalWeight, -1, 1));
}

/**
 * EI v1 evidence balance is deliberately conservative.
 *
 * It is not a mastery probability and it must not update formal learner status.
 * Events from one assessment/session are collapsed into one evidence group so a
 * long test cannot masquerade as repeated independent evidence.
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

  const groupScores = buildEvidenceGroupScores(scopedEvents);
  const evidenceGroupCount = groupScores.length;
  const sourceKindCount = new Set(scopedEvents.map((event) => event.sourceKind)).size;

  const supportRatio =
    evidenceGroupCount === 0
      ? null
      : clamp(
          (groupScores.reduce((sum, score) => sum + score, 0) /
            evidenceGroupCount +
            1) /
            2,
          0,
          1,
        );

  const confidence = getConfidence(evidenceGroupCount, sourceKindCount);
  const signalBand = getSignalBand(evidenceGroupCount, supportRatio);
  const latestTimestamp = scopedEvents.reduce(
    (latest, event) => Math.max(latest, parseTimestamp(event.occurredAt)),
    0,
  );

  const reasons: string[] = [];

  if (evidenceGroupCount < 2) {
    reasons.push(
      "Fewer than two independent evidence groups are available, so the engine will not make a strong learner-state claim.",
    );
  }

  if (sourceKindCount < 2) {
    reasons.push(
      "Evidence currently comes from only one source type; corroboration from another source would increase trust.",
    );
  }

  if (signalBand === "needs_attention") {
    reasons.push("The current evidence balance contains more contradiction than support.");
  } else if (signalBand === "mixed") {
    reasons.push("The available evidence is mixed and should be reviewed before acting.");
  } else if (signalBand === "promising") {
    reasons.push("The evidence balance is positive but should still be corroborated.");
  } else if (signalBand === "strong_signal") {
    reasons.push(
      "The evidence balance is strongly positive, but this remains an advisory signal rather than a formal judgement.",
    );
  }

  return {
    competencyId: first.competencyId,
    learnerId: first.learnerId,
    eventCount: scopedEvents.length,
    evidenceGroupCount,
    sourceKindCount,
    supportRatio,
    confidence,
    signalBand,
    latestEvidenceAt:
      latestTimestamp > 0 ? new Date(latestTimestamp).toISOString() : null,
    advisoryOnly: true,
    reasons,
  };
}
