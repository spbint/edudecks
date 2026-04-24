export type WorkflowPage = "planner" | "capture" | "portfolio" | "reports";
export type LearningMomentumLabel =
  | "Getting started"
  | "Building momentum"
  | "Ready to review"
  | "Close to usable";
export type LearningThinAreaLabel =
  | "Evidence is still thin"
  | "The week needs a starting point"
  | "The learning story is still narrow"
  | "A progress reflection would help next";

export type LearningIntelligenceInput = {
  studentId?: string;
  highlightEvidenceId?: string;
  hasPlanDirection?: boolean;
  hasPlannerActions?: boolean;
  evidenceCount?: number;
  recentEvidenceCount?: number;
  linkedEvidenceCount?: number;
  coverageAreaCount?: number;
  hasFamilyNote?: boolean;
};

export type LearningIntelligenceSummary = {
  targetPage: WorkflowPage;
  targetHref: string;
  ctaLabel: string;
  reason: string;
  momentumLabel: LearningMomentumLabel;
  thinAreaLabel?: LearningThinAreaLabel;
};

type NormalizedSignals = {
  studentId?: string;
  highlightEvidenceId?: string;
  hasPlanDirection: boolean;
  hasPlannerActions: boolean;
  evidenceCount: number;
  recentEvidenceCount: number;
  linkedEvidenceCount: number;
  coverageAreaCount: number;
  hasFamilyNote: boolean;
};

type WorkflowStateFlags = {
  planningIsVisible: boolean;
  evidenceIsVisible: boolean;
  evidenceIsThin: boolean;
  storyIsNarrow: boolean;
  readyToReview: boolean;
  closeToUsable: boolean;
};

function normalizeSignals(input: LearningIntelligenceInput): NormalizedSignals {
  return {
    studentId: input.studentId,
    highlightEvidenceId: input.highlightEvidenceId,
    hasPlanDirection: Boolean(input.hasPlanDirection),
    hasPlannerActions: Boolean(input.hasPlannerActions),
    evidenceCount: input.evidenceCount ?? 0,
    recentEvidenceCount: input.recentEvidenceCount ?? 0,
    linkedEvidenceCount: input.linkedEvidenceCount ?? 0,
    coverageAreaCount: input.coverageAreaCount ?? 0,
    hasFamilyNote: Boolean(input.hasFamilyNote),
  };
}

function buildPlannerHref(signals: NormalizedSignals) {
  if (!signals.studentId) return "/planner?focus=start-planning";
  return `/planner?focus=start-planning&student=${encodeURIComponent(signals.studentId)}`;
}

function buildCaptureHref(signals: NormalizedSignals) {
  const params = new URLSearchParams();
  params.set("focus", "start-evidence");
  if (signals.studentId) params.set("prefillLearnerId", signals.studentId);
  return `/capture?${params.toString()}`;
}

function buildPortfolioHref(signals: NormalizedSignals) {
  const params = new URLSearchParams();
  if (signals.studentId) params.set("studentId", signals.studentId);
  if (signals.highlightEvidenceId) {
    params.set("highlightEvidenceId", signals.highlightEvidenceId);
  }
  const query = params.toString();
  return query ? `/portfolio?${query}` : "/portfolio";
}

function buildReportsHref(signals: NormalizedSignals) {
  const params = new URLSearchParams();
  if (signals.studentId) params.set("studentId", signals.studentId);
  if (signals.highlightEvidenceId) {
    params.set("highlightEvidenceId", signals.highlightEvidenceId);
  }
  const query = params.toString();
  return query ? `/my-reports?${query}` : "/my-reports";
}

function hasAnyPlanning(signals: NormalizedSignals) {
  return signals.hasPlanDirection || signals.hasPlannerActions;
}

function hasAnyEvidence(signals: NormalizedSignals) {
  return signals.evidenceCount > 0;
}

function hasThinEvidence(signals: NormalizedSignals) {
  return signals.evidenceCount <= 1;
}

function hasNarrowStory(signals: NormalizedSignals) {
  return signals.coverageAreaCount > 0 && signals.coverageAreaCount <= 1;
}

function hasReviewableEvidence(signals: NormalizedSignals) {
  return signals.evidenceCount >= 2;
}

function hasReportShapingSignals(signals: NormalizedSignals) {
  return (
    signals.linkedEvidenceCount >= 2 ||
    (signals.evidenceCount >= 4 && signals.hasFamilyNote)
  );
}

function classifyWorkflowState(signals: NormalizedSignals): WorkflowStateFlags {
  return {
    planningIsVisible: hasAnyPlanning(signals),
    evidenceIsVisible: hasAnyEvidence(signals),
    evidenceIsThin: hasThinEvidence(signals),
    storyIsNarrow: hasNarrowStory(signals),
    readyToReview: hasReviewableEvidence(signals),
    closeToUsable: hasReportShapingSignals(signals),
  };
}

function buildSummary(
  targetPage: WorkflowPage,
  targetHref: string,
  ctaLabel: string,
  reason: string,
  momentumLabel: LearningMomentumLabel,
  thinAreaLabel?: LearningThinAreaLabel,
): LearningIntelligenceSummary {
  return {
    targetPage,
    targetHref,
    ctaLabel,
    reason,
    momentumLabel,
    thinAreaLabel,
  };
}

function buildPlannerReason(signals: NormalizedSignals) {
  if (signals.hasPlanDirection || signals.hasPlannerActions) {
    return "Things are still light here, and one small weekly direction would help bring the week into view.";
  }

  return "Things are still light here, so one small weekly direction is the clearest place to begin.";
}

function buildCaptureReason(signals: NormalizedSignals) {
  if (signals.hasPlanDirection || signals.hasPlannerActions) {
    return "You have a weekly direction, but evidence is still light.";
  }

  if (signals.recentEvidenceCount > 0) {
    return "You have a starting point, but one more recent example would make this easier to shape.";
  }

  return "You have a starting point, and one more clear example would make this easier to shape.";
}

function buildPortfolioReason(signals: NormalizedSignals, storyIsNarrow: boolean) {
  if (storyIsNarrow) {
    return "You already have evidence here, but the learning story is still narrow.";
  }

  if (signals.recentEvidenceCount > 0) {
    return "You already have recent evidence here. Reviewing the portfolio is the clearest next move.";
  }

  return "You already have evidence here. Reviewing the portfolio is the clearest next move.";
}

function buildReportsReason(signals: NormalizedSignals) {
  if (signals.linkedEvidenceCount >= 2) {
    return "You have evidence connected to learning activity, so My Reports is the clearest place to reflect on progress.";
  }

  return "You have enough captured evidence to prepare a report from My Reports when you choose.";
}

export function deriveLearningIntelligence(
  input: LearningIntelligenceInput,
): LearningIntelligenceSummary {
  const signals = normalizeSignals(input);
  const {
    planningIsVisible,
    evidenceIsVisible,
    evidenceIsThin,
    storyIsNarrow,
    readyToReview,
    closeToUsable,
  } = classifyWorkflowState(signals);
  const isStartingFromScratch = !planningIsVisible && !evidenceIsVisible;
  const hasPlanningButNoEvidence = planningIsVisible && !evidenceIsVisible;
  const canShapeReportNow = closeToUsable;
  const shouldReviewPortfolio = readyToReview;

  if (isStartingFromScratch) {
    return buildSummary(
      "planner",
      buildPlannerHref(signals),
      "Set a weekly direction",
      buildPlannerReason(signals),
      "Getting started",
      "The week needs a starting point",
    );
  }

  if (hasPlanningButNoEvidence) {
    return buildSummary(
      "capture",
      buildCaptureHref(signals),
      "Capture a learning moment",
      buildCaptureReason(signals),
      "Building momentum",
      "Evidence is still thin",
    );
  }

  if (canShapeReportNow) {
    return buildSummary(
      "reports",
      buildReportsHref(signals),
      "Open My Reports",
      buildReportsReason(signals),
      "Close to usable",
      "A progress reflection would help next",
    );
  }

  if (shouldReviewPortfolio) {
    return buildSummary(
      "portfolio",
      buildPortfolioHref(signals),
      "Browse the portfolio",
      buildPortfolioReason(signals, storyIsNarrow),
      "Ready to review",
      storyIsNarrow ? "The learning story is still narrow" : undefined,
    );
  }

  if (evidenceIsThin) {
    return buildSummary(
      "capture",
      buildCaptureHref(signals),
      "Capture another learning moment",
      buildCaptureReason(signals),
      "Building momentum",
      "Evidence is still thin",
    );
  }

    return buildSummary(
      "portfolio",
      buildPortfolioHref(signals),
      "Browse the portfolio",
      buildPortfolioReason(signals, false),
      "Ready to review",
  );
}
