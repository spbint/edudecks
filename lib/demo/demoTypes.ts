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
  sourceLabel: string;
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

export type DemoReportViewModel = {
  familyLabel: string;
  learnerLabel: string;
  reportingPeriod: string;
  summary: string;
  evidenceEntries: Array<{
    id: string;
    title: string;
    observedOn: string;
    learningArea: string;
    description: string;
    sourceLabel: string;
  }>;
  portfolioSelections: Array<{
    id: string;
    title: string;
    reason: string;
  }>;
  strengths: string[];
  focusAreas: string[];
  suggestedNextSteps: string[];
  generatedAt: string;
  disclaimer: string;
};
