import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";
import type { ParentProgressStatus } from "@/lib/clean/pathways/parentProgress";

export type PathwayAnalyticsEvent =
  | "pathway_learner_changed"
  | "pathway_subject_selected"
  | "pathway_strand_selected"
  | "pathway_step_opened"
  | "pathway_recommended_action_selected"
  | "pathway_practice_started"
  | "pathway_practice_completed"
  | "pathway_assessment_started"
  | "pathway_assessment_completed"
  | "pathway_assessment_saved"
  | "pathway_assessment_readback_shown"
  | "pathway_capture_selected"
  | "pathway_next_step_selected";

export type PathwayAnalyticsContext = {
  subjectKey?: string;
  strandKey?: string;
  stageKey?: string;
  stepKey?: string;
  pathwayStepId?: string;
  progressStatus?: ParentProgressStatus | null;
  recommendedAction?: "check_understanding" | "practise" | "next_step" | "worksheet" | "capture_evidence";
  isCurrentLearningStep?: boolean;
  hasPractice?: boolean;
  hasAssessment?: boolean;
  hasWorksheet?: boolean;
  hasNextStep?: boolean;
  assessmentDepth?: "basic" | "standard" | "comprehensive";
  itemCount?: number;
  taskCount?: number;
};

function toMachineProgressStatus(status: ParentProgressStatus | null | undefined) {
  switch (status) {
    case "Secure": return "secure";
    case "Consolidating": return "consolidating";
    case "Developing": return "developing";
    case "Needs support": return "needs_support";
    default: return "not_checked_yet";
  }
}

/** Structural Pathways metadata only. Learner and learning-content data are excluded. */
export function trackPathwayAnalyticsEvent(
  eventName: PathwayAnalyticsEvent,
  context: PathwayAnalyticsContext = {},
  userId?: string | null,
) {
  const { progressStatus, ...structuralContext } = context;
  trackProductEvent(
    eventName,
    {
      ...structuralContext,
      source: "pathways",
      ...(progressStatus ? { progressStatus: toMachineProgressStatus(progressStatus) } : {}),
    },
    userId,
  );
}
