import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import {
  buildCleanReportPdfFilename,
  generateCleanReportPdfBytes,
  parseCleanReportReflection,
  type CleanReportPdfEvidenceItem,
  type CleanReportPdfModel,
} from "@/lib/clean/outputs/pdf";
import type { LearningEvidenceEvent } from "@/lib/clean/evidence/learningEvidenceEvents";

const report = {
  id: "report-1",
  familyId: "family-1",
  learnerId: "learner-tony",
  reportingPeriodId: "period-1",
  title: "Tony Term 3 Learning Report",
  status: "draft" as const,
  createdByUserId: "user-1",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-17T00:00:00Z",
};

const reportingPeriod = {
  id: "period-1",
  familyId: "family-1",
  learnerId: "learner-tony",
  title: "Term 3 2026",
  startsOn: "2026-07-01",
  endsOn: "2026-09-30",
  createdByUserId: "user-1",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
};

function evidence(
  index: number,
  overrides: Partial<CleanReportPdfEvidenceItem> = {},
): CleanReportPdfEvidenceItem {
  return {
    id: `evidence-${index}`,
    title: `Mathematics completed work ${index}`,
    observedOn: `2026-07-${String(10 + index).padStart(2, "0")}`,
    learnerLabel: "Tony",
    learningArea: index === 3 ? "Arts" : "Mathematics",
    programTitle: null,
    segmentTitle: null,
    blockTitle: null,
    whatHappened:
      "Tony completed the activity, explained the strategy used, and checked the answer against the model.",
    reflection: index % 2 === 0 ? "I found the checking part easier today." : null,
    portfolioNote: "Parent note: Tony worked steadily and asked for help when needed.",
    sourceLabel: "worksheet_evidence",
    pathwayLabel: "Mathematics pathway",
    strandLabel: "Number and place value",
    stageLabel: "Upper elementary",
    stepLabel: "Use place value to solve practical problems",
    progressLevel: index === 1 ? "Consolidating" : index === 2 ? "Secure" : "Goal achieved",
    hasAttachment: overrides.hasAttachment ?? false,
    attachmentCount: overrides.attachmentCount ?? 0,
    previewImageUrl: overrides.previewImageUrl ?? null,
    previewImageStoragePath: overrides.previewImageStoragePath ?? null,
    previewImageAlt: "Completed work photo",
    ...overrides,
  };
}

function pathwayCheck(overrides: Partial<LearningEvidenceEvent> = {}): LearningEvidenceEvent {
  return {
    id: "check-1",
    learnerId: "learner-tony",
    familyId: "family-1",
    userId: "user-1",
    sourceType: "pathway_assessment",
    sourceId: "attempt-1",
    subject: "Mathematics",
    strand: "Number and place value",
    stage: "Upper elementary",
    pathwayId: "maths",
    stepId: "step-1",
    stepNumber: "1",
    stepTitle: "Use place value to solve practical problems",
    curriculumCodes: [],
    title: "Use place value check",
    summary: "Tony selected efficient strategies and checked most answers accurately.",
    evidenceDate: "2026-07-15T00:00:00Z",
    score: 0.8,
    questionCount: 5,
    attemptedCount: 5,
    correctCount: 4,
    incorrectCount: 1,
    notSureCount: 0,
    supportRecommendedCount: 0,
    parentJudgement: "Secure",
    reportEligible: true,
    portfolioEligible: true,
    outputEligible: true,
    route: null,
    metadata: {},
    ...overrides,
  };
}

function model(
  evidenceItems: CleanReportPdfEvidenceItem[],
  assessmentEvidenceItems: LearningEvidenceEvent[] = [],
): CleanReportPdfModel {
  return {
    report,
    learnerLabel: "Tony",
    reportingPeriod,
    sections: [],
    evidenceItems,
    assessmentEvidenceItems,
    preparedOnLabel: "17 Jul 2026",
    statusLabel: "Draft",
  };
}

async function pageCountFor(input: CleanReportPdfModel) {
  const bytes = await generateCleanReportPdfBytes(input);
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPageCount();
}

describe("clean learning report PDF", () => {
  it("sanitizes structured reflection metadata for published reports", () => {
    expect(parseCleanReportReflection("Parent note: Parent note: Testing Source: calendar")).toEqual({ parent: "Testing", learner: null, generic: null });
    expect(parseCleanReportReflection("Parent note: test Learner reflection: test Source: calendar")).toEqual({ parent: "test", learner: "test", generic: null });
    expect(parseCleanReportReflection("Learner reflection: I know that Jupiter is the largest planet Source: calendar")).toEqual({ parent: null, learner: "I know that Jupiter is the largest planet", generic: null });
    expect(parseCleanReportReflection("The source was a primary document.")).toEqual({ parent: null, learner: null, generic: "The source was a primary document." });
  });
  it("keeps zero-data reports concise", async () => {
    await expect(pageCountFor(model([]))).resolves.toBeLessThanOrEqual(2);
  });

  it("keeps one-record reports concise and useful", async () => {
    const count = await pageCountFor(model([evidence(1)]));
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(3);
  });

  it("keeps a Tony-style three-record report within the target range", async () => {
    const count = await pageCountFor(
      model([evidence(1), evidence(2), evidence(3)], [pathwayCheck()]),
    );
    expect(count).toBeGreaterThanOrEqual(2);
    expect(count).toBeLessThanOrEqual(4);
  });

  it("uses safe parent-facing filenames for formal learning reports", () => {
    expect(buildCleanReportPdfFilename("Tony", "Term 3 / 2026")).toBe(
      "MyLearna-Learning-Report-Tony-Term-3-2026.pdf",
    );
  });

  it("keeps raw metadata and old appendix language out of the generator", () => {
    const source = readFileSync(join(process.cwd(), "lib/clean/outputs/pdf.ts"), "utf8");
    expect(source).not.toContain("Evidence appendix");
    expect(source).not.toContain("Evidence context");
    expect(source).not.toContain("Source:");
    expect(source).not.toContain("Assessment evidence");
    expect(source).toContain("Selected learning records");
    expect(source).toContain("Learning area summaries");
  });
});
