export type GuidedProgressPage =
  | "capture"
  | "portfolio"
  | "planner"
  | "reports"
  | "output"
  | "authority";

export type GuidedProgressSignals = {
  page: GuidedProgressPage;
  evidenceCount?: number;
  distinctLearningAreas?: number;
  hasWeeklyFocus?: boolean;
  checklistCount?: number;
  hasDraft?: boolean;
  selectedEvidenceCount?: number;
  outputOpened?: boolean;
  authorityStarted?: boolean;
};

export type GuidedConfidenceState =
  | "Getting started"
  | "Building momentum"
  | "Shaping direction"
  | "Strong foundation"
  | "Ready for report"
  | "Ready to share"
  | "Submission ready";

function count(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
  }
  return 0;
}

function yes(value: unknown): boolean {
  return value === true;
}

function pluralize(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function buildGuidedProgressSignals(
  partial: Partial<GuidedProgressSignals>
): GuidedProgressSignals {
  return {
    page: partial.page || "capture",
    evidenceCount: count(partial.evidenceCount),
    distinctLearningAreas: count(partial.distinctLearningAreas),
    hasWeeklyFocus: yes(partial.hasWeeklyFocus),
    checklistCount: count(partial.checklistCount),
    hasDraft: yes(partial.hasDraft),
    selectedEvidenceCount: count(partial.selectedEvidenceCount),
    outputOpened: yes(partial.outputOpened),
    authorityStarted: yes(partial.authorityStarted),
  };
}

export function getConfidenceState(
  signals: GuidedProgressSignals
): GuidedConfidenceState {
  const evidenceCount = count(signals.evidenceCount);
  const distinctLearningAreas = count(signals.distinctLearningAreas);
  const checklistCount = count(signals.checklistCount);
  const selectedEvidenceCount = count(signals.selectedEvidenceCount);

  switch (signals.page) {
    case "capture":
      if (evidenceCount >= 3) return "Strong foundation";
      if (evidenceCount >= 1) return "Building momentum";
      return "Getting started";

    case "portfolio":
      if (distinctLearningAreas >= 3 || evidenceCount >= 4) return "Strong foundation";
      return "Building momentum";

    case "planner":
      if (!signals.hasWeeklyFocus) return "Shaping direction";
      if (checklistCount >= 4) return "Strong foundation";
      return "Building momentum";

    case "reports":
      if (selectedEvidenceCount >= 3 && distinctLearningAreas >= 2) return "Ready for report";
      if (selectedEvidenceCount >= 1) return "Building momentum";
      return "Getting started";

    case "output":
      return "Ready to share";

    case "authority":
      if (signals.authorityStarted || signals.hasDraft) return "Submission ready";
      return "Ready to share";

    default:
      return "Getting started";
  }
}

export function getProgressSignal(signals: GuidedProgressSignals): string {
  const evidenceCount = count(signals.evidenceCount);
  const distinctLearningAreas = count(signals.distinctLearningAreas);
  const checklistCount = count(signals.checklistCount);
  const selectedEvidenceCount = count(signals.selectedEvidenceCount);

  switch (signals.page) {
    case "capture":
      if (evidenceCount === 0) return "No learning moments captured yet.";
      return `${pluralize(evidenceCount, "learning moment")} captured.`;

    case "portfolio":
      if (distinctLearningAreas >= 3) {
        return `${pluralize(distinctLearningAreas, "learning area")} represented.`;
      }
      if (evidenceCount > 0) {
        return `${pluralize(evidenceCount, "moment")} shaping the story.`;
      }
      return "The story is ready to begin.";

    case "planner":
      if (!signals.hasWeeklyFocus) return "Weekly focus not set yet.";
      if (checklistCount > 0) {
        return `Weekly focus set with ${pluralize(checklistCount, "checklist item")}.`;
      }
      return "Weekly focus set.";

    case "reports":
      if (selectedEvidenceCount === 0) return "No evidence selected yet.";
      if (distinctLearningAreas >= 2) {
        return `${pluralize(selectedEvidenceCount, "evidence item")} selected across ${pluralize(
          distinctLearningAreas,
          "area"
        )}.`;
      }
      return `${pluralize(selectedEvidenceCount, "evidence item")} selected.`;

    case "output":
      return signals.outputOpened ? "Output reviewed." : "Output ready for review.";

    case "authority":
      return signals.authorityStarted
        ? "Submission path opened."
        : "Authority path ready.";

    default:
      return "Progress is taking shape.";
  }
}

export function getNextMilestone(signals: GuidedProgressSignals): string {
  const evidenceCount = count(signals.evidenceCount);
  const distinctLearningAreas = count(signals.distinctLearningAreas);
  const checklistCount = count(signals.checklistCount);
  const selectedEvidenceCount = count(signals.selectedEvidenceCount);

  switch (signals.page) {
    case "capture":
      if (evidenceCount === 0) return "Capture your first moment to begin the story.";
      if (evidenceCount <= 2) return "Add one more moment to build momentum.";
      return "You have enough to start shaping a portfolio.";

    case "portfolio":
      if (distinctLearningAreas >= 3 || evidenceCount >= 4) {
        return "This portfolio is becoming strong enough to support reporting.";
      }
      return "Add 2-3 moments to make the story clearer.";

    case "planner":
      if (!signals.hasWeeklyFocus) return "Choose one focus for the week.";
      if (checklistCount >= 4) return "You have enough direction for this week.";
      if (checklistCount > 0) return "One or two more small actions will support the week.";
      return "Add a couple of simple actions to support the week.";

    case "reports":
      if (selectedEvidenceCount === 0) return "Choose one strong evidence item to begin.";
      if (selectedEvidenceCount >= 3 && distinctLearningAreas >= 2) {
        return "You are ready to continue into output.";
      }
      if (distinctLearningAreas < 2) return "One broader example will strengthen this report.";
      return "You have enough to keep shaping this report.";

    case "output":
      return "Save or export when it feels clear enough.";

    case "authority":
      return "Review and export when you feel ready.";

    default:
      return "Keep strengthening the next step.";
  }
}
