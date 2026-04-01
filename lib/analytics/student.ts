import type {
  EvidenceEntryRow,
  EvidenceFreshnessBucket,
  InterventionRow,
  StudentAttribute,
} from "./types";
import {
  areaMatches,
  clamp,
  daysSince,
  evidenceDate,
  reviewDate,
  safe,
  scoreTrend,
  isOpenIntervention,
} from "./helpers";

export function getOpenInterventions(interventions: InterventionRow[]) {
  return interventions.filter((x) => isOpenIntervention(x.status));
}

export function getOverdueReviews(interventions: InterventionRow[]) {
  return getOpenInterventions(interventions).filter((x) => {
    const rd = reviewDate(x);
    return rd ? daysSince(rd) > 0 : false;
  });
}

export function getLastEvidenceDays(evidence: EvidenceEntryRow[]) {
  if (!evidence.length) return null;
  return daysSince(evidenceDate(evidence[0]));
}

export function calculateProfileConfidence(
  evidence: EvidenceEntryRow[],
  overdueReviews: InterventionRow[],
  lastEvidenceDays: number | null
) {
  const recency = lastEvidenceDays == null ? 0 : Math.max(0, 100 - lastEvidenceDays * 4);
  const areas = new Set(evidence.map((e) => safe(e.learning_area)).filter(Boolean)).size;
  const areaScore = clamp(areas * 18, 0, 100);
  const reviewScore = overdueReviews.length === 0 ? 100 : Math.max(20, 100 - overdueReviews.length * 25);
  return Math.round((recency + areaScore + reviewScore) / 3);
}

export function calculateStudentAttentionScore(args: {
  lastEvidenceDays: number | null;
  overdueReviewCount: number;
  openInterventionCount: number;
}) {
  const days = args.lastEvidenceDays == null ? 35 : args.lastEvidenceDays;
  let score = 100;

  score -= Math.min(50, days * 2);
  score -= args.overdueReviewCount * 18;
  score -= args.openInterventionCount * 6;

  return clamp(Math.round(score), 0, 100);
}

export function deriveStatusLabel(args: {
  lastEvidenceDays: number | null;
  overdueReviewCount: number;
}) {
  if ((args.lastEvidenceDays ?? 999) <= 7 && args.overdueReviewCount === 0) return "Stable" as const;
  if ((args.lastEvidenceDays ?? 999) <= 21) return "Watch" as const;
  return "Attention" as const;
}

export function getEvidenceFreshness(evidence: EvidenceEntryRow[]): EvidenceFreshnessBucket[] {
  const buckets = [
    { label: "Reading", match: ["reading"] },
    { label: "Writing", match: ["writing"] },
    { label: "Maths", match: ["math", "mathematics", "numeracy"] },
    { label: "Behaviour", match: ["behaviour", "behavior"] },
    { label: "Wellbeing", match: ["wellbeing", "well-being", "pastoral"] },
  ];

  return buckets.map((bucket) => {
    const found = evidence
      .filter((e) => areaMatches(safe(e.learning_area), bucket.match))
      .sort((a, b) => evidenceDate(b).localeCompare(evidenceDate(a)))[0];

    return {
      label: bucket.label,
      days: found ? daysSince(evidenceDate(found)) : 999,
    };
  });
}

export function deriveNextAction(args: {
  lastEvidenceDays: number | null;
  overdueReviewCount: number;
  evidenceFreshness: EvidenceFreshnessBucket[];
  openInterventionCount: number;
}) {
  if ((args.lastEvidenceDays ?? 999) > 21) return "Add fresh evidence";
  if (args.overdueReviewCount > 0) return "Review support plan";

  const staleWriting = args.evidenceFreshness.find((x) => x.label === "Writing");
  if (staleWriting && staleWriting.days > 21) return "Capture writing evidence";

  if (args.openInterventionCount === 0) return "Maintain visibility";
  return "Monitor current plan";
}

function countWordHits(evidence: EvidenceEntryRow[], patterns: string[]) {
  return evidence.reduce((sum, e) => {
    const text = `${safe(e.title)} ${safe(e.summary)} ${safe(e.body)}`.toLowerCase();
    return sum + (patterns.some((p) => text.includes(p)) ? 1 : 0);
  }, 0);
}

function areaCount(evidence: EvidenceEntryRow[], patterns: string[]) {
  return evidence.filter((e) => {
    const a = safe(e.learning_area).toLowerCase();
    return patterns.some((p) => a.includes(p));
  }).length;
}

export function deriveAttributes(
  evidence: EvidenceEntryRow[],
  interventions: InterventionRow[]
): StudentAttribute[] {
  const lastEvidenceDays = getLastEvidenceDays(evidence) ?? 999;
  const openInterventions = getOpenInterventions(interventions);
  const freshnessAdjustment = lastEvidenceDays <= 7 ? 1 : lastEvidenceDays <= 21 ? 0 : -1.5;
  const interventionPressure = openInterventions.length * 0.5;

  const readingBase = 10 + areaCount(evidence, ["reading"]) * 1.2 + countWordHits(evidence, ["reading", "fluency", "comprehension"]) * 0.4;
  const writingBase = 10 + areaCount(evidence, ["writing"]) * 1.2 + countWordHits(evidence, ["writing", "sentence", "paragraph"]) * 0.4;
  const mathsBase = 10 + areaCount(evidence, ["math", "mathematics", "numeracy"]) * 1.2 + countWordHits(evidence, ["math", "strategy", "number"]) * 0.4;
  const reasoningBase = 10 + countWordHits(evidence, ["reasoning", "justify", "explained", "strategy", "problem solving"]) * 0.8;

  const focusBase =
    10 +
    countWordHits(evidence, ["focused", "engaged", "attentive"]) * 0.8 -
    countWordHits(evidence, ["off-task", "distracted", "attention"]) * 0.9;

  const independenceBase =
    10 +
    countWordHits(evidence, ["independent", "independently", "self-started"]) * 0.8 -
    countWordHits(evidence, ["prompting", "needed support", "scaffold"]) * 0.8;

  const organisationBase =
    10 +
    countWordHits(evidence, ["organised", "routine", "prepared"]) * 0.7 -
    countWordHits(evidence, ["disorganised", "forgot", "lost"]) * 0.9;

  const completionBase =
    10 +
    countWordHits(evidence, ["completed", "finished"]) * 0.7 -
    countWordHits(evidence, ["incomplete", "unfinished", "abandoned"]) * 0.9;

  const collaborationBase =
    10 +
    countWordHits(evidence, ["collaboration", "peer support", "worked well together", "helped others"]) * 0.8 -
    countWordHits(evidence, ["conflict", "disrupted peers"]) * 0.8;

  const resilienceBase =
    10 +
    countWordHits(evidence, ["persisted", "persevered", "tried again", "responded to feedback"]) * 0.8 -
    countWordHits(evidence, ["shut down", "gave up", "frustrated"]) * 0.9;

  return [
    {
      key: "reading",
      label: "Reading",
      score: clamp(Math.round(readingBase + freshnessAdjustment - interventionPressure * 0.15), 1, 20),
      trend: scoreTrend(readingBase),
    },
    {
      key: "writing",
      label: "Writing",
      score: clamp(Math.round(writingBase + freshnessAdjustment - interventionPressure * 0.2), 1, 20),
      trend: scoreTrend(writingBase),
    },
    {
      key: "mathematics",
      label: "Mathematics",
      score: clamp(Math.round(mathsBase + freshnessAdjustment - interventionPressure * 0.15), 1, 20),
      trend: scoreTrend(mathsBase),
    },
    {
      key: "reasoning",
      label: "Reasoning",
      score: clamp(Math.round(reasoningBase + freshnessAdjustment * 0.5), 1, 20),
      trend: scoreTrend(reasoningBase),
    },
    {
      key: "focus",
      label: "Focus",
      score: clamp(Math.round(focusBase + freshnessAdjustment - interventionPressure * 0.25), 1, 20),
      trend: scoreTrend(focusBase),
    },
    {
      key: "independence",
      label: "Independence",
      score: clamp(Math.round(independenceBase + freshnessAdjustment - interventionPressure * 0.25), 1, 20),
      trend: scoreTrend(independenceBase),
    },
    {
      key: "organisation",
      label: "Organisation",
      score: clamp(Math.round(organisationBase + freshnessAdjustment - interventionPressure * 0.2), 1, 20),
      trend: scoreTrend(organisationBase),
    },
    {
      key: "task_completion",
      label: "Task Completion",
      score: clamp(Math.round(completionBase + freshnessAdjustment - interventionPressure * 0.2), 1, 20),
      trend: scoreTrend(completionBase),
    },
    {
      key: "collaboration",
      label: "Collaboration",
      score: clamp(Math.round(collaborationBase + freshnessAdjustment * 0.5), 1, 20),
      trend: scoreTrend(collaborationBase),
    },
    {
      key: "resilience",
      label: "Resilience",
      score: clamp(Math.round(resilienceBase + freshnessAdjustment - interventionPressure * 0.15), 1, 20),
      trend: scoreTrend(resilienceBase),
    },
  ];
}

export function calculateClassHealth(studentAnalytics: Array<{ attentionScore: number }>) {
  if (!studentAnalytics.length) return 0;
  const total = studentAnalytics.reduce((sum, s) => sum + s.attentionScore, 0);
  return Math.round(total / studentAnalytics.length);
}