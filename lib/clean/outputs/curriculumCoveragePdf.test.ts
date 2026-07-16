import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { FamilyProfile } from "@/lib/clean/family/types";
import type { Learner } from "@/lib/clean/learners/types";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  buildPathwayCaptureContext,
  encodePathwayContextNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import { buildPathwayStepId } from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  buildCurriculumCoveragePdfModel,
  generateCurriculumCoveragePdfBytes,
  getCoveragePdfActiveAreaSummaries,
} from "@/lib/clean/outputs/curriculumCoveragePdf";

const profile: FamilyProfile = {
  id: "family-1",
  createdByUserId: "user-1",
  displayName: "Learner Family",
  countryCode: "US",
  jurisdictionCode: "FL",
  curriculumFrameworkId: null,
  reportingMode: "standard",
  weekStart: "monday",
  privacyDefault: "family",
  exportStyle: "clean",
  defaultLearnerId: "learner-1",
  createdAt: null,
  updatedAt: null,
};

const learner: Learner = {
  id: "learner-1",
  familyId: "family-1",
  firstName: "Tony",
  preferredName: null,
  surname: "Learner",
  yearLevel: "Foundation",
  notes: null,
  createdByUserId: "user-1",
  createdAt: null,
  updatedAt: null,
};

function makeMathEvidence(index: number): CleanEvidenceEntry {
  const stepKeys = [
    "recognise-small-quantities-without-counting",
    "match-spoken-number-names-to-quantities",
    "identify-numerals-0-10",
    "count-objects-accurately-to-10",
  ];
  const stepKey = stepKeys[index % stepKeys.length];
  const pathwayStepId = buildPathwayStepId(
    "mathematics",
    "number-and-place-value",
    "foundation-kindergarten",
    stepKey,
  );
  const pathwayContext = buildPathwayCaptureContext({
    source: "my-pathways",
    subjectKey: "mathematics",
    subjectLabel: "Mathematics",
    pathwayKey: "number-and-place-value",
    pathwayLabel: "Number and place value",
    stageKey: "foundation-kindergarten",
    stageLabel: "Foundation / Kindergarten",
    pathwayStepId,
    stepKey,
    stepNumber: String(index + 1),
    stepTitle: `Number pathway step ${index + 1}`,
    stepMeaning: "Use concrete materials to show number understanding.",
    skillFocus: "number work",
    observedSkillStatus: "Evidence started",
  });

  return {
    id: `evidence-${index + 1}`,
    familyId: "family-1",
    learnerId: "learner-1",
    programId: null,
    calendarItemId: null,
    observedOn: `2026-07-${String(10 + index).padStart(2, "0")}`,
    title: `Mathematics learning record ${index + 1}`,
    whatHappened: "Tony completed useful number pathway work with counters and a worksheet.",
    reflection: null,
    learningArea: "Mathematics",
    curriculumNodeIds: encodePathwayContextNodeIds([], pathwayContext),
    attachmentUrls: [],
    imageUrl: null,
    includeInPortfolio: index === 0,
    includeInReport: index === 0,
    createdByUserId: "user-1",
    createdAt: `2026-07-${String(10 + index).padStart(2, "0")}T09:00:00.000Z`,
    updatedAt: `2026-07-${String(10 + index).padStart(2, "0")}T09:00:00.000Z`,
  };
}

async function getPdfPageCount(entries: CleanEvidenceEntry[]) {
  const model = buildCurriculumCoveragePdfModel({
    profile,
    learner,
    entries,
    assessmentStatuses: [],
    generatedOn: "2026-07-15",
  });
  const bytes = await generateCurriculumCoveragePdfBytes(model);
  const pdf = await PDFDocument.load(bytes);
  return {
    model,
    bytes,
    pageCount: pdf.getPageCount(),
  };
}

describe("curriculum coverage PDF", () => {
  it("uses active or evidence-backed areas instead of inactive subject sections", () => {
    const model = buildCurriculumCoveragePdfModel({
      profile,
      learner,
      entries: [makeMathEvidence(0), makeMathEvidence(1), makeMathEvidence(2)],
      assessmentStatuses: [],
      generatedOn: "2026-07-15",
    });

    const activeAreas = getCoveragePdfActiveAreaSummaries(model);

    expect(activeAreas.map((summary) => summary.area.label)).toEqual(["Mathematics"]);
    expect(model.coverageSummary.areaSummaries.length).toBeGreaterThan(activeAreas.length);
  });

  it("keeps a three-record Mathematics coverage PDF concise", async () => {
    const result = await getPdfPageCount([
      makeMathEvidence(0),
      makeMathEvidence(1),
      makeMathEvidence(2),
    ]);

    expect(result.pageCount).toBeGreaterThanOrEqual(2);
    expect(result.pageCount).toBeLessThanOrEqual(4);
    expect(getCoveragePdfActiveAreaSummaries(result.model)).toHaveLength(1);
  });

  it("omits inactive subject sections and deficit wording from a three-record coverage PDF", async () => {
    const result = await getPdfPageCount([
      makeMathEvidence(0),
      makeMathEvidence(1),
      makeMathEvidence(2),
    ]);
    const activeAreaLabels = getCoveragePdfActiveAreaSummaries(result.model).map(
      (summary) => summary.area.label,
    );
    const decodedPdfBytes = new TextDecoder("latin1").decode(result.bytes);

    expect(result.pageCount).toBeGreaterThanOrEqual(2);
    expect(result.pageCount).toBeLessThanOrEqual(4);
    expect(activeAreaLabels).toEqual(["Mathematics"]);
    expect(activeAreaLabels).not.toContain("English");
    expect(decodedPdfBytes).not.toContain("waiting for evidence");
    expect(decodedPdfBytes).not.toContain("not assessed yet");
    expect(decodedPdfBytes).not.toContain("1/9 learning areas");
    expect(decodedPdfBytes.toLowerCase()).not.toContain("deficit");
    expect(decodedPdfBytes.toLowerCase()).not.toContain("whole-curriculum");
  });

  it("creates concise useful PDFs for zero and one learning record", async () => {
    const empty = await getPdfPageCount([]);
    const single = await getPdfPageCount([makeMathEvidence(0)]);

    expect(empty.pageCount).toBeLessThanOrEqual(2);
    expect(single.pageCount).toBeLessThanOrEqual(3);
  });

  it("paginates many learning records without returning to inactive subject pages", async () => {
    const entries = Array.from({ length: 14 }, (_, index) => makeMathEvidence(index));
    const result = await getPdfPageCount(entries);

    expect(result.pageCount).toBeGreaterThan(3);
    expect(result.pageCount).toBeLessThanOrEqual(8);
    expect(getCoveragePdfActiveAreaSummaries(result.model).map((summary) => summary.area.label)).toEqual([
      "Mathematics",
    ]);
  });
});
