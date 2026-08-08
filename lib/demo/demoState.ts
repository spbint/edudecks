import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import { demoEvidenceDataset, type DemoEvidenceRecord } from "@/lib/demo/demoEvidenceDataset";
import type {
  DemoAction,
  DemoEvidenceEntry,
  DemoReportViewModel,
  DemoState,
} from "@/lib/demo/demoTypes";

const primaryEvidence = demoEvidenceDataset.evidence.find(
  (item) => item.learnerId === "emma" && item.step === 4,
) as DemoEvidenceRecord;

export const initialDemoState: DemoState = {
  activeView: "today",
  captureText:
    "Emma doubled a small recipe and explained how the quantities changed together.",
  capturedEvidence: null,
  captureIncludedInPortfolio: false,
  statusMessage: "",
};

function toDemoEvidenceEntry(
  item: DemoEvidenceRecord,
  note = item.whatHappened,
  temporary = false,
): DemoEvidenceEntry {
  return {
    id: item.id,
    learnerId: item.learnerId,
    title: item.title,
    type: temporary ? "Temporary demo observation" : item.evidenceType,
    note,
    observedOn: item.date,
    learningArea: item.learningArea,
    pathway: item.pathway,
    step: item.step,
    progress: item.progress,
    sourceLabel: item.imagePlaceholder,
    imageKey: item.imageKey,
    imageAlt: item.imageAlt,
    imagePlaceholder: item.imagePlaceholder,
    worksheetUrl: item.worksheetUrl,
    temporary,
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "navigate":
      return { ...state, activeView: action.view, statusMessage: "" };
    case "update-capture-text":
      return { ...state, captureText: action.value, statusMessage: "" };
    case "add-learning-moment": {
      const note = state.captureText.trim();
      if (!note) {
        return {
          ...state,
          activeView: "capture",
          statusMessage: "Add a short note before saving this demo learning moment.",
        };
      }

      return {
        ...state,
        activeView: "portfolio",
        capturedEvidence: toDemoEvidenceEntry(primaryEvidence, note, true),
        captureIncludedInPortfolio: false,
        statusMessage: "Learning moment added to this fictional demo.",
      };
    }
    case "add-capture-to-portfolio":
      if (!state.capturedEvidence) return state;
      return {
        ...state,
        activeView: "report",
        captureIncludedInPortfolio: true,
        statusMessage: "Learning moment added to Emma's demo portfolio.",
      };
    case "reset":
      return initialDemoState;
    default:
      return state;
  }
}

function buildReportEvidenceEntry(
  item: DemoEvidenceRecord,
  state: DemoState,
): DemoReportViewModel["evidenceEntries"][number] {
  const captured = state.captureIncludedInPortfolio && state.capturedEvidence?.id === item.id
    ? state.capturedEvidence
    : null;

  return {
    id: item.id,
    title: item.title,
    observedOn: item.date,
    learningArea: item.learningArea,
    pathway: item.pathway,
    step: item.step,
    progress: item.progress,
    whatHappened: captured?.note ?? item.whatHappened,
    parentObservation: item.parentObservation,
    learnerReflection: item.learnerReflection,
    worksheetUrl: item.worksheetUrl,
    imageKey: item.imageKey,
    imageAlt: item.imageAlt,
    imagePlaceholder: item.imagePlaceholder,
  };
}

export function buildDemoReportViewModel(state: DemoState): DemoReportViewModel {
  const emmaRecords = demoEvidenceDataset.evidence.filter(
    (item) => item.learnerId === "emma" && item.includeInReport,
  );

  return {
    familyLabel: "Carter Family",
    learnerLabel: "Emma Carter",
    reportingPeriod: demoEvidenceDataset.family.reportingPeriod,
    preparedOnLabel: demoEvidenceDataset.family.preparedOn,
    summary:
      "This learning report brings together selected learning records and pathway progress for Emma during the March-July 2026 reporting period. Across this period, Emma developed her understanding of proportional reasoning from simple scaling and related quantities through to ratio tables, unit rates, real-world comparisons, graphs, financial situations and mathematical justification.",
    evidenceEntries: emmaRecords.map((item) => buildReportEvidenceEntry(item, state)),
    portfolioSelections: emmaRecords.map((item) => ({
      id: item.id,
      title: item.title,
      reason: item.parentObservation,
    })),
    strengths: [...carterFamilyDemo.data.strengths.Emma],
    focusAreas: [...carterFamilyDemo.data.focusAreas.Emma],
    suggestedNextSteps: [...carterFamilyDemo.reports.nextSteps.Emma],
    pathway: "Ratio and Proportional Reasoning",
    pathwaySummary:
      "Emma has moved from representing simple multiplicative relationships visually to applying proportional reasoning flexibly and explaining her mathematical decisions.",
    generatedAt: demoEvidenceDataset.family.preparedOn,
    disclaimer: "Sample report generated from fictional demo data.",
  };
}
