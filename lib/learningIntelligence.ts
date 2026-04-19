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

function withStudent(path: string, studentId?: string) {
  if (!studentId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}studentId=${encodeURIComponent(studentId)}`;
}

function buildCaptureHref(input: LearningIntelligenceInput) {
  const params = new URLSearchParams();
  params.set("focus", "start-evidence");
  if (input.studentId) params.set("prefillLearnerId", input.studentId);
  return `/capture?${params.toString()}`;
}

function buildPortfolioHref(input: LearningIntelligenceInput) {
  const params = new URLSearchParams();
  if (input.studentId) params.set("studentId", input.studentId);
  if (input.highlightEvidenceId) {
    params.set("highlightEvidenceId", input.highlightEvidenceId);
  }
  const query = params.toString();
  return query ? `/portfolio?${query}` : "/portfolio";
}

function buildReportsHref(input: LearningIntelligenceInput) {
  const params = new URLSearchParams();
  params.set("focus", "refine-evidence");
  if (input.studentId) params.set("studentId", input.studentId);
  if (input.highlightEvidenceId) {
    params.set("highlightEvidenceId", input.highlightEvidenceId);
  }
  return `/reports?${params.toString()}`;
}

export function deriveLearningIntelligence(
  input: LearningIntelligenceInput,
): LearningIntelligenceSummary {
  const evidenceCount = input.evidenceCount ?? 0;
  const recentEvidenceCount = input.recentEvidenceCount ?? 0;
  const linkedEvidenceCount = input.linkedEvidenceCount ?? 0;
  const coverageAreaCount = input.coverageAreaCount ?? 0;
  const hasPlanDirection = Boolean(input.hasPlanDirection);
  const hasPlannerActions = Boolean(input.hasPlannerActions);
  const hasSavedDraft = Boolean(input.hasSavedDraft);
  const hasReportSelection = Boolean(input.hasReportSelection);
  const hasFamilyNote = Boolean(input.hasFamilyNote);

  if (hasPlanDirection && evidenceCount === 0) {
    return {
      targetPage: "capture",
      targetHref: buildCaptureHref(input),
      ctaLabel: "Capture a learning moment",
      reason: "You already have a direction in place, and one saved moment would make it easier to shape.",
      momentumLabel: "Building momentum",
      thinAreaLabel: "Evidence is still thin",
    };
  }

  if (evidenceCount === 0) {
    return {
      targetPage: hasPlanDirection || hasPlannerActions ? "capture" : "planner",
      targetHref:
        hasPlanDirection || hasPlannerActions
          ? buildCaptureHref(input)
          : withStudent("/planner?focus=start-planning", input.studentId),
      ctaLabel:
        hasPlanDirection || hasPlannerActions
          ? "Capture a learning moment"
          : "Set a weekly direction",
      reason:
        hasPlanDirection || hasPlannerActions
          ? "Things are still light here, so a simple capture is the best next step."
          : "Things are still light here, so one small weekly direction is the clearest place to begin.",
      momentumLabel: "Getting started",
      thinAreaLabel: hasPlanDirection || hasPlannerActions ? "Evidence is still thin" : "The week needs a starting point",
    };
  }

  if (hasSavedDraft || hasReportSelection || linkedEvidenceCount >= 2 || (evidenceCount >= 4 && hasFamilyNote)) {
    return {
      targetPage: "reports",
      targetHref: buildReportsHref(input),
      ctaLabel: "Shape this into a report",
      reason: "You already have enough here to begin shaping a report.",
      momentumLabel: "Close to usable",
      thinAreaLabel: hasFamilyNote ? "A short draft would help next" : "A short report draft would help next",
    };
  }

  if (evidenceCount >= 2) {
    return {
      targetPage: "portfolio",
      targetHref: buildPortfolioHref(input),
      ctaLabel: "Browse the portfolio",
      reason:
        coverageAreaCount <= 1
          ? "You already have evidence here. Reviewing the portfolio is the clearest next move before adding more."
          : "You already have evidence here. Reviewing the portfolio is the clearest next move.",
      momentumLabel: recentEvidenceCount > 0 ? "Building momentum" : "Ready to review",
      thinAreaLabel:
        coverageAreaCount <= 1
          ? "The learning story is still narrow"
          : linkedEvidenceCount === 0
            ? "The record would benefit from a clearer review"
            : undefined,
    };
  }

  return {
    targetPage: "capture",
    targetHref: buildCaptureHref(input),
    ctaLabel: "Capture another learning moment",
    reason: "You have a starting point, and one more clear example would make this easier to shape.",
    momentumLabel: "Building momentum",
    thinAreaLabel: recentEvidenceCount > 0 ? "The record is still light" : "A newer example would help",
  };
}
