import type { DemoLearnerId } from "@/lib/demo/carterFamilyDemoData";

export type DemoViewId = "today" | "capture" | "portfolio" | "report";

export type DemoEvidenceEntry = {
  id: string;
  learnerId: DemoLearnerId;
  title: string;
  type: string;
  note: string;
  observedOn: string;
  learningArea: string;
  pathway: string;
  step: number;
  progress: string;
  sourceLabel: string;
  imageKey: string;
  imageAlt: string;
  imagePlaceholder: string;
  worksheetUrl?: string;
  temporary?: boolean;
};

export type DemoState = {
  activeView: DemoViewId;
  captureText: string;
  capturedEvidence: DemoEvidenceEntry | null;
  captureIncludedInPortfolio: boolean;
  statusMessage: string;
};

export type DemoAction =
  | { type: "navigate"; view: DemoViewId }
  | { type: "update-capture-text"; value: string }
  | { type: "add-learning-moment" }
  | { type: "add-capture-to-portfolio" }
  | { type: "reset" };

export type DemoReportEvidenceEntry = {
  id: string;
  title: string;
  observedOn: string;
  learningArea: string;
  pathway: string;
  step: number;
  progress: string;
  whatHappened: string;
  parentObservation: string;
  learnerReflection: string;
  worksheetUrl?: string;
  imageKey: string;
  imageAlt: string;
  imagePlaceholder: string;
};

export type DemoReportViewModel = {
  familyLabel: string;
  learnerLabel: string;
  reportingPeriod: string;
  preparedOnLabel: string;
  summary: string;
  evidenceEntries: DemoReportEvidenceEntry[];
  portfolioSelections: Array<{
    id: string;
    title: string;
    reason: string;
  }>;
  strengths: string[];
  focusAreas: string[];
  suggestedNextSteps: string[];
  pathway: string;
  pathwaySummary: string;
  generatedAt: string;
  disclaimer: string;
};
