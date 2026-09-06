import { getStepAssessmentForPathwayStep } from "@/lib/clean/assessments/stepAssessmentRegistry";
import { getStepPracticeForPathwayStep } from "@/lib/clean/practice/stepPracticeRegistry";
import type { ParentProgressStatus } from "@/lib/clean/pathways/parentProgress";
import {
  resolvePathwayNextAction,
  type PathwayNextAction,
} from "@/lib/clean/pathways/pathwayNextAction";
import {
  CUSTOMER_PATHWAY_PRACTICE_AVAILABLE,
  CUSTOMER_PATHWAY_WORKSHEET_VIEW_AVAILABLE,
} from "@/lib/clean/pathways/pathwayCustomerActionAvailability";
import { buildPathwayStepReturnHref } from "@/lib/clean/pathways/pathwayNavigationContext";
import {
  getAllPathwaySteps,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import { getWorksheetResourceForPathwayStep } from "@/lib/clean/resources/mathWorksheetResources";

export type ActionablePathwayRecommendation = {
  action: PathwayNextAction | null;
  href: string;
  targetStep: PathwayStepRegistryItem;
};

function pathwayStepHref(learnerId: string, step: PathwayStepRegistryItem) {
  return buildPathwayStepReturnHref({
    pathname: "/my-pathways",
    subjectKey: step.subjectKey,
    strandKey: step.strandKey,
    stageKey: step.stageKey,
    pathwayStepId: step.id,
    stepKey: step.stepKey,
    learnerId,
    detailPanelId: `pathway-step-${step.strandKey}-${step.stageKey}-${step.legacyStepNumber}`,
  });
}

function nextPathwayStep(step: PathwayStepRegistryItem) {
  const steps = getAllPathwaySteps()
    .filter(
      (candidate) =>
        candidate.subjectKey === step.subjectKey && candidate.strandKey === step.strandKey,
    )
    .sort(
      (left, right) =>
        left.stageOrder - right.stageOrder || left.stepOrder - right.stepOrder,
    );
  const currentIndex = steps.findIndex((candidate) => candidate.id === step.id);
  return currentIndex >= 0 ? steps[currentIndex + 1] || null : null;
}

/**
 * Thin My Learna navigation adapter over the canonical Pathways recommendation
 * resolver. It only turns the resolved action into the established exact-card
 * Pathways location; it does not derive progress or mutate learning state.
 */
export function buildActionablePathwayRecommendation(input: {
  learnerId: string;
  step: PathwayStepRegistryItem;
  autoCheckStatus: ParentProgressStatus | null;
  parentProgress: ParentProgressStatus;
}): ActionablePathwayRecommendation {
  const { step } = input;
  const nextStep = nextPathwayStep(step);
  const assessment = getStepAssessmentForPathwayStep({
    pathwayStepId: step.id,
    stepKey: step.stepKey,
    strandKey: step.strandKey,
  });
  const practice = getStepPracticeForPathwayStep({
    pathwayStepId: step.id,
    stepKey: step.stepKey,
    strandKey: step.strandKey,
  });
  const customerPracticeAvailable = CUSTOMER_PATHWAY_PRACTICE_AVAILABLE
    ? Boolean(practice)
    : false;
  const worksheet = getWorksheetResourceForPathwayStep({
    pathwayStepId: step.id,
    stepKey: step.stepKey,
    subjectKey: step.subjectKey,
    strandKey: step.strandKey,
    stageKey: step.stageKey,
  });
  const effectiveStatus = input.autoCheckStatus || input.parentProgress;
  const actionPlan = resolvePathwayNextAction({
    autoCheckStatus: input.autoCheckStatus,
    parentProgress: input.parentProgress,
    availability: {
      "check-understanding": Boolean(assessment),
      practise: customerPracticeAvailable,
      "next-step": effectiveStatus === "Secure" && Boolean(nextStep),
      worksheet: CUSTOMER_PATHWAY_WORKSHEET_VIEW_AVAILABLE && Boolean(worksheet),
      "capture-evidence": true,
    },
  });
  const targetStep = actionPlan.primary === "next-step" && nextStep ? nextStep : step;

  return {
    action: actionPlan.primary,
    href: pathwayStepHref(input.learnerId, targetStep),
    targetStep,
  };
}

export function pathwayRecommendationLabel(action: PathwayNextAction | null) {
  switch (action) {
    case "check-understanding":
      return "Check understanding";
    case "practise":
      return "Practise this focus";
    case "next-step":
      return "Next step";
    case "worksheet":
      return "Open worksheet";
    case "capture-evidence":
      return "Add to Portfolio";
    default:
      return "Open My Pathways";
  }
}
