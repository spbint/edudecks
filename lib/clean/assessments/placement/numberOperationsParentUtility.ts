import type { NumberOperationsProfile } from "./numberOperationsProfile";
import type {
  NumberOperationsRecommendation,
  NumberOperationsRecommendationKind,
} from "./numberOperationsRecommendations";
import type { NumberOperationsPlacementResult } from "./numberOperationsPlacementResult";
import { buildNumberOperationsPathwaysHandoff } from "./numberOperationsPathwaysHandoff";
import { getNumberOperationsPracticeTarget } from "./numberOperationsPracticeTargets";
import { buildNumberOperationsRecheckPlan, type NumberOperationsRecheckPlan } from "./numberOperationsRecheckPlan";
import {
  getNumberOperationsUnresolvedGuidance,
  type NumberOperationsUnresolvedGuidance,
} from "./numberOperationsUnresolvedGuidance";

export type NumberOperationsParentAreaState =
  | "build-next"
  | "verify-in-learning"
  | "strengthen-foundations"
  | "extend";

export type NumberOperationsParentUtilityArea = {
  subElementKey: NumberOperationsPlacementResult["subElementKey"];
  label: string;
  state: NumberOperationsParentAreaState;
  headline: string;
  explanation: string;
  curriculumContext: string | null;
  actionLabel: string;
  actionHref: string;
  actionNote: string;
  pathwaysLabel: string;
  pathwaysHref: string;
  pathwaysNote: string;
  recheckRecommended: boolean;
  technicalBand: string;
  confidenceNote: string;
  recheckPlan: NumberOperationsRecheckPlan;
  observationGuidance: NumberOperationsUnresolvedGuidance | null;
};

export type NumberOperationsParentUtility = {
  title: string;
  summary: string;
  assessedAreas: number;
  expectedAreas: number;
  complete: boolean;
  startHere: NumberOperationsParentUtilityArea | null;
  areas: NumberOperationsParentUtilityArea[];
  trustNote: string;
};

function technicalBand(result: NumberOperationsPlacementResult) {
  if (
    result.status === "candidate-band" &&
    result.lowerP !== undefined &&
    result.upperP !== undefined
  ) {
    return `P${result.lowerP}–P${result.upperP}`;
  }
  if (result.endpoint) {
    return result.endpoint.relation === "at-least"
      ? `At least P${result.endpoint.pLevel}`
      : `Below / around P${result.endpoint.pLevel}`;
  }
  return "Evidence captured";
}

function stateFor(
  recommendation: NumberOperationsRecommendation,
): NumberOperationsParentAreaState {
  switch (recommendation.kind) {
    case "verify-with-observation":
      return "verify-in-learning";
    case "support-and-recheck":
      return "strengthen-foundations";
    case "extend-beyond-progression":
      return "extend";
    case "practice-next-level":
      return "build-next";
  }
}

function headlineFor(state: NumberOperationsParentAreaState) {
  switch (state) {
    case "verify-in-learning":
      return "Check this in everyday learning";
    case "strengthen-foundations":
      return "Strengthen the foundations first";
    case "extend":
      return "Ready for extension";
    case "build-next":
      return "Ready to build on the next step";
  }
}

function priority(kind: NumberOperationsRecommendationKind) {
  switch (kind) {
    case "verify-with-observation":
      return 0;
    case "support-and-recheck":
      return 1;
    case "practice-next-level":
      return 2;
    case "extend-beyond-progression":
      return 3;
  }
}

function confidenceNote(result: NumberOperationsPlacementResult) {
  return result.confidence === "routing-only"
    ? "The electronic check found a useful starting neighbourhood, but MyLearna wants a practical or observed example before treating this as a firm placement."
    : "The current evidence is strong enough to guide the next learning step, but it is still a starting-point judgement rather than a permanent level.";
}

function areaFrom(
  result: NumberOperationsPlacementResult,
  recommendation: NumberOperationsRecommendation,
  learnerId?: string | null,
): NumberOperationsParentUtilityArea {
  const state = stateFor(recommendation);
  const parentPracticeTarget = getNumberOperationsPracticeTarget({
    subElementKey: result.subElementKey,
    targetP: recommendation.targetP,
    learnerId,
  });
  const pathways = buildNumberOperationsPathwaysHandoff({
    subElementKey: result.subElementKey,
    targetP: recommendation.targetP,
    learnerId,
  });
  return {
    subElementKey: result.subElementKey,
    label: result.subElementLabel,
    state,
    headline: headlineFor(state),
    explanation: result.interpretation,
    curriculumContext: result.typicalYearAlignment
      ? `Curriculum context: ${result.typicalYearAlignment}`
      : null,
    actionLabel: parentPracticeTarget.label,
    actionHref: parentPracticeTarget.href,
    actionNote: parentPracticeTarget.note,
    pathwaysLabel: pathways.stepTitle
      ? `Open ${pathways.stepTitle} in My Pathways`
      : `Open ${pathways.strandLabel} in My Pathways`,
    pathwaysHref: pathways.href,
    pathwaysNote: pathways.note,
    recheckRecommended: recommendation.recheckRecommended,
    technicalBand: technicalBand(result),
    confidenceNote: confidenceNote(result),
    recheckPlan: buildNumberOperationsRecheckPlan({
      subElementKey: result.subElementKey,
      state,
    }),
    observationGuidance:
      state === "verify-in-learning"
        ? getNumberOperationsUnresolvedGuidance(result.subElementKey)
        : null,
  };
}

export function buildNumberOperationsParentUtility(
  profile: NumberOperationsProfile,
  options: { learnerId?: string | null } = {},
): NumberOperationsParentUtility {
  const recommendations = new Map(
    profile.recommendations.map((recommendation) => [
      recommendation.subElementKey,
      recommendation,
    ]),
  );

  const areas = profile.results.flatMap((result) => {
    const recommendation = recommendations.get(result.subElementKey);
    return recommendation
      ? [areaFrom(result, recommendation, options.learnerId)]
      : [];
  });

  const ranked = profile.recommendations
    .map((recommendation, index) => ({
      recommendation,
      index,
      priority: priority(recommendation.kind),
    }))
    .sort((a, b) => a.priority - b.priority || a.index - b.index);

  const startKey = ranked[0]?.recommendation.subElementKey ?? null;
  const startHere = startKey
    ? areas.find((area) => area.subElementKey === startKey) ?? null
    : null;

  return {
    title: "A clear starting point for what to do next",
    summary: profile.complete
      ? "MyLearna found a usable starting point across all five Number & Operations areas. The areas stay separate so strength in one part of maths never hides a place where support would help."
      : `MyLearna currently has a usable starting point in ${profile.assessedSubElements} of ${profile.expectedSubElements} Number & Operations areas. Missing areas stay unknown rather than being guessed.`,
    assessedAreas: profile.assessedSubElements,
    expectedAreas: profile.expectedSubElements,
    complete: profile.complete,
    startHere,
    areas,
    trustNote:
      "This is a starting-point profile, not a grade, score, diagnosis or single maths level. MyLearna uses it to choose the next useful learning action and then checks again with fresh evidence.",
  };
}
