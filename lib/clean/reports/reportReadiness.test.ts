import { describe, expect, it } from "vitest";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { buildReportReadinessSummary } from "./reportReadiness";

const entry = (id: string, overrides: Partial<CleanEvidenceEntry> = {}): CleanEvidenceEntry => ({
  id, familyId: "family-1", learnerId: "learner-1", participantLearnerIds: ["learner-1"],
  programId: null, calendarItemId: null, observedOn: "2026-09-10", title: null,
  whatHappened: "Learning happened", reflection: null, learningArea: "Mathematics",
  curriculumNodeIds: [], attachmentUrls: [], imageUrl: null, includeInPortfolio: true,
  includeInReport: true, createdByUserId: "user-1", createdAt: null, updatedAt: null, ...overrides,
});

describe("report readiness summary", () => {
  it("counts records once, separates report inclusion, and counts media", () => {
    const result = buildReportReadinessSummary([
      entry("math", { attachmentUrls: ["photo.jpg"] }),
      entry("english", { learningArea: "English", includeInReport: false }),
      entry("text", { learningArea: null }),
      entry("math", { attachmentUrls: ["duplicate.jpg"] }),
    ]);
    expect(result).toMatchObject({ recordCount: 3, reportIncludedCount: 2, mediaRecordCount: 1 });
    expect(result.subjects).toEqual([{ label: "English", count: 1 }, { label: "Mathematics", count: 1 }]);
  });

  it("uses explicit Pathways subject context and never guesses unknown areas", () => {
    const result = buildReportReadinessSummary([
      entry("pathway", { learningArea: null, curriculumNodeIds: ["pathway-source:my-pathways", "pathway-subject-key:english"] }),
      entry("unknown", { learningArea: "A subject mentioned in a note" }),
    ]);
    expect(result.subjects).toEqual([{ label: "English", count: 1 }]);
    expect(result.recordCount).toBe(2);
  });

  it("counts shared records once for the selected learner and keeps text-only learning", () => {
    const result = buildReportReadinessSummary([
      entry("shared", { participantLearnerIds: ["learner-1", "learner-2"], attachmentUrls: [] }),
      entry("shared", { participantLearnerIds: ["learner-1", "learner-2"], attachmentUrls: ["same.jpg"] }),
    ]);
    expect(result.recordCount).toBe(1);
    expect(result.mediaRecordCount).toBe(1);
  });
});
