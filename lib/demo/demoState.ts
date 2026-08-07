import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import { demoEvidenceDataset } from "@/lib/demo/demoEvidenceDataset";
import type {
  DemoAction,
  DemoReportViewModel,
  DemoState,
} from "@/lib/demo/demoTypes";

export const initialDemoState: DemoState = {
  activeView: "today",
  captureText:
    "Emma used measuring cups while cooking and explained how two quarters make one half.",
  capturedEvidence: null,
  captureIncludedInPortfolio: false,
  statusMessage: "",
};

const demoCaptureId = "demo-capture-emma-fractions";

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
        capturedEvidence: {
          id: demoCaptureId,
          learnerId: "emma",
          title: "Fractions in everyday life",
          type: "Temporary demo observation",
          note,
          observedOn: "2026-03-19",
          learningArea: "Maths",
          sourceLabel: "Your temporary demo addition",
          imageKey: "demo-capture-fractions",
          imageAlt: "Future sample image slot for Emma explaining fractions while cooking",
          imagePlaceholder: "Future sample image: fractions in everyday life",
          temporary: true,
        },
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
        statusMessage: "Learning moment added to Emma’s demo portfolio.",
      };
    case "reset":
      return initialDemoState;
    default:
      return state;
  }
}

export function buildDemoReportViewModel(
  state: DemoState,
): DemoReportViewModel {
  const emmaEvidence = demoEvidenceDataset.evidence
    .filter((item) => item.learnerId === "emma")
    .map((item) => ({
      id: item.id,
      title: item.title,
      observedOn: item.date,
      learningArea: item.learningArea,
      description: item.shortDescription,
      sourceLabel: item.imagePlaceholder,
      imageKey: item.imageKey,
      imageAlt: item.imageAlt,
      imagePlaceholder: item.imagePlaceholder,
    }));
  const capturedEvidence = state.captureIncludedInPortfolio
    ? state.capturedEvidence
    : null;

  if (capturedEvidence) {
    emmaEvidence.push({
      id: capturedEvidence.id,
      title: capturedEvidence.title,
      observedOn: "March 19, 2026",
      learningArea: capturedEvidence.learningArea,
      description: capturedEvidence.note,
      sourceLabel: capturedEvidence.sourceLabel,
      imageKey: capturedEvidence.imageKey,
      imageAlt: capturedEvidence.imageAlt,
      imagePlaceholder: capturedEvidence.imagePlaceholder,
    });
  }

  const portfolioSelections = demoEvidenceDataset.evidence
    .filter((item) => item.learnerId === "emma")
    .map((item) => ({
      id: item.id,
      title: item.title,
      reason: item.reflection ?? item.shortDescription,
    }));
  if (capturedEvidence) {
    portfolioSelections.push({
      id: capturedEvidence.id,
      title: capturedEvidence.title,
      reason: "Temporary demo portfolio selection from the capture step.",
    });
  }

  return {
    familyLabel: demoEvidenceDataset.family.name,
    learnerLabel: demoEvidenceDataset.learners[0].displayName,
    reportingPeriod: demoEvidenceDataset.family.reportingPeriod,
    summary: capturedEvidence
      ? "Emma’s fictional learning record now includes a family observation from everyday cooking, alongside her planned maths and science learning."
      : carterFamilyDemo.reports.Emma.split("\n\n")[0],
    evidenceEntries: emmaEvidence,
    portfolioSelections,
    strengths: [...carterFamilyDemo.data.strengths.Emma],
    focusAreas: [...carterFamilyDemo.data.focusAreas.Emma],
    suggestedNextSteps: capturedEvidence
      ? [
          "Keep noticing maths in ordinary family activities.",
          "Continue explaining fraction relationships with visual models.",
        ]
      : [...carterFamilyDemo.reports.nextSteps.Emma],
    generatedAt: "March 19, 2026",
    disclaimer: "Sample report generated from fictional demo data.",
  };
}
