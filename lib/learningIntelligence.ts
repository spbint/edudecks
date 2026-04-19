export type WorkflowPage = "planner" | "capture" | "portfolio" | "reports";

export type LearningIntelligenceInput = {
  studentId?: string;
  highlightEvidenceId?: string;
  hasPlanDirection?: boolean;
  hasPlannerActions?: boolean;
  evidenceCount?: number;
  recentEvidenceCount?: number;
  linkedEvidenceCount?: number;
  coverageAreaCount?: number;
  hasSavedDraft?: boolean;
  hasReportSelection?: boolean;
  hasFamilyNote?: boolean;
};

export type LearningIntelligenceSummary = {
  targetPage: WorkflowPage;
  targetHref: string;
  ctaLabel: string;
  reason: string;
  momentumLabel: string;
  thinAreaLabel?: string;
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
  hasSavedDraft: boolean;
  hasReportSelection: boolean;
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
    hasSavedDraft: Boolean(input.hasSavedDraft),
    hasReportSelection: Boolean(input.hasReportSelection),
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
  params.set("focus", "refine-evidence");
  if (signals.studentId) params.set("studentId", signals.studentId);
  if (signals.highlightEvidenceId) {
    params.set("highlightEvidenceId", signals.highlightEvidenceId);
  }
  return `/reports?${params.toString()}`;
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
    signals.hasSavedDraft ||
    signals.hasReportSelection ||
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
  momentumLabel: string,
  thinAreaLabel?: string,
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

  if (!planningIsVisible && !evidenceIsVisible) {
    return buildSummary(
      "planner",
      buildPlannerHref(signals),
      "Set a weekly direction",
      "Things are still light here, so one small weekly direction is the clearest place to begin.",
      "Getting started",
      "The week needs a starting point",
    );
  }

  if (planningIsVisible && !evidenceIsVisible) {
    return buildSummary(
      "capture",
      buildCaptureHref(signals),
      "Capture a learning moment",
      "You already have a direction in place, and one saved moment would make it easier to shape.",
      "Building momentum",
      "Evidence is still thin",
    );
  }

  if (closeToUsable) {
    return buildSummary(
      "reports",
      buildReportsHref(signals),
      "Shape this into a report",
      "You already have enough here to begin shaping a report.",
      "Close to usable",
      "A short report draft would help next",
    );
  }

  if (readyToReview) {
    return buildSummary(
      "portfolio",
      buildPortfolioHref(signals),
      "Browse the portfolio",
      storyIsNarrow
        ? "You already have evidence here. Reviewing the portfolio is the clearest next move before adding more."
        : "You already have evidence here. Reviewing the portfolio is the clearest next move.",
      "Ready to review",
      storyIsNarrow ? "The learning story is still narrow" : undefined,
    );
  }

  if (evidenceIsThin) {
    return buildSummary(
      "capture",
      buildCaptureHref(signals),
      "Capture another learning moment",
      "You have a starting point, and one more clear example would make this easier to shape.",
      "Building momentum",
      "Evidence is still thin",
    );
  }

  return buildSummary(
    "portfolio",
    buildPortfolioHref(signals),
    "Browse the portfolio",
    "You already have evidence here. Reviewing the portfolio is the clearest next move.",
    "Ready to review",
  );
}
