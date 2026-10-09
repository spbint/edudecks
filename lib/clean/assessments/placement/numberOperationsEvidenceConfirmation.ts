import type { NumberOperationsEvidencePreview } from "./numberOperationsEvidencePreview";

export type NumberOperationsEvidenceConfirmationDraft = {
  schema: "mylearna-number-operations-evidence-confirmation";
  schemaVersion: 1;
  sourceType: NumberOperationsEvidencePreview["sourceType"];
  sourceFormId: NumberOperationsEvidencePreview["sourceFormId"];
  frameworkId: NumberOperationsEvidencePreview["frameworkId"];
  confirmedAt: string;
  parentAcknowledgedStartingPoint: true;
  includeInPortfolio: boolean;
  includeInReport: boolean;
  parentNote: string | null;
  title: string;
  summary: string;
  learningArea: NumberOperationsEvidencePreview["learningArea"];
  scopeSubElements: NumberOperationsEvidencePreview["scopeSubElements"];
  curriculumNodeIds: string[];
  resultBands: NumberOperationsEvidencePreview["resultBands"];
  safeguards: {
    updatesPathwayStatusAutomatically: false;
    updatesAssessmentConfidenceAutomatically: false;
    createsFormalReportStatementAutomatically: false;
  };
};

function cleanNote(value: string | null | undefined) {
  const note = String(value ?? "").trim();
  return note || null;
}

function iso(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("confirmedAt must be a valid ISO-compatible datetime.");
  }
  return new Date(parsed).toISOString();
}

export function buildNumberOperationsEvidenceConfirmationDraft(input: {
  preview: NumberOperationsEvidencePreview;
  parentAcknowledgedStartingPoint: boolean;
  includeInPortfolio: boolean;
  includeInReport: boolean;
  parentNote?: string | null;
  confirmedAt?: string;
}): NumberOperationsEvidenceConfirmationDraft {
  if (!input.parentAcknowledgedStartingPoint) {
    throw new Error(
      "Parent acknowledgement is required before assessment evidence can be confirmed.",
    );
  }

  if (!input.preview.requiresParentConfirmation) {
    throw new Error("This evidence preview does not require the expected confirmation gate.");
  }

  if (
    input.preview.assessedSubElements < 1 ||
    !input.preview.resultBands.length ||
    !input.preview.curriculumNodeIds.length ||
    !input.preview.portfolioEligibleAfterConfirmation
  ) {
    throw new Error(
      "No reportable assessment evidence is available to confirm yet.",
    );
  }

  if (input.includeInReport && !input.preview.reportEligibleAfterConfirmation) {
    throw new Error(
      "This starting-point evidence still needs stronger verification before it can be made available for reports.",
    );
  }

  return {
    schema: "mylearna-number-operations-evidence-confirmation",
    schemaVersion: 1,
    sourceType: input.preview.sourceType,
    sourceFormId: input.preview.sourceFormId,
    frameworkId: input.preview.frameworkId,
    confirmedAt: iso(input.confirmedAt || new Date().toISOString()),
    parentAcknowledgedStartingPoint: true,
    includeInPortfolio: input.includeInPortfolio,
    includeInReport: input.includeInReport,
    parentNote: cleanNote(input.parentNote),
    title: input.preview.title,
    summary: input.preview.summary,
    learningArea: input.preview.learningArea,
    scopeSubElements: [...input.preview.scopeSubElements],
    curriculumNodeIds: [...input.preview.curriculumNodeIds],
    resultBands: input.preview.resultBands.map((result) => ({ ...result })),
    safeguards: {
      updatesPathwayStatusAutomatically: false,
      updatesAssessmentConfidenceAutomatically: false,
      createsFormalReportStatementAutomatically: false,
    },
  };
}
