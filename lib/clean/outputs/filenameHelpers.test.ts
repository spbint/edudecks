import { describe, expect, it, vi } from "vitest";

import {
  buildCleanLearningRecordPdfFilename,
  buildCleanReportPdfFilename,
} from "@/lib/clean/outputs/pdf";
import { buildCleanCoverageRecordPdfFilename } from "@/lib/clean/outputs/curriculumCoveragePdf";
import { buildCleanWeeklyPlannerPdfFilename } from "@/lib/clean/outputs/weeklyPlanner";

describe("clean output PDF filenames", () => {
  it("builds parent-facing learning report and learning record filenames", () => {
    expect(buildCleanLearningRecordPdfFilename("Sean O'Brien", "2026-06-24")).toBe(
      "MyLearna-Learning-Record-Sean-O-Brien-2026-06-24.pdf",
    );
    expect(buildCleanReportPdfFilename("Sean O'Brien", "Term 2 / 2026")).toBe(
      "MyLearna-Learning-Report-Sean-O-Brien-Term-2-2026.pdf",
    );
  });

  it("builds coverage record filenames with safe learner names and year values", () => {
    expect(buildCleanCoverageRecordPdfFilename("Madeleine & James", 2026)).toBe(
      "MyLearna-Coverage-Record-Madeleine-James-2026.pdf",
    );
    expect(buildCleanCoverageRecordPdfFilename("Sean", "Generated 24 Jun 2026")).toBe(
      "MyLearna-Coverage-Record-Sean-2026.pdf",
    );
  });

  it("falls back to the current year for coverage record filenames", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-03-12T00:00:00Z"));

    expect(buildCleanCoverageRecordPdfFilename("Sean", null)).toBe(
      "MyLearna-Coverage-Record-Sean-2027.pdf",
    );

    vi.useRealTimers();
  });

  it("builds weekly planner filenames with ISO week-year and two-digit week numbers", () => {
    expect(buildCleanWeeklyPlannerPdfFilename("2026-06-22")).toBe(
      "MyLearna-Weekly-Planner-2026-W26.pdf",
    );
    expect(buildCleanWeeklyPlannerPdfFilename("2026-01-05")).toBe(
      "MyLearna-Weekly-Planner-2026-W02.pdf",
    );
    expect(buildCleanWeeklyPlannerPdfFilename("2025-12-29")).toBe(
      "MyLearna-Weekly-Planner-2026-W01.pdf",
    );
  });

  it("does not produce unsafe or double-extension PDF filenames", () => {
    const filenames = [
      buildCleanLearningRecordPdfFilename("A / B", "2026-06-24"),
      buildCleanCoverageRecordPdfFilename("A / B", 2026),
      buildCleanWeeklyPlannerPdfFilename("2026-06-22"),
      buildCleanReportPdfFilename("A / B", "Term 1"),
    ];

    expect(filenames.every((filename) => /^[A-Za-z0-9.-]+\.pdf$/.test(filename))).toBe(true);
    expect(filenames.every((filename) => !/\.pdf\.pdf$/i.test(filename))).toBe(true);
    expect(filenames.every((filename) => !filename.includes("--"))).toBe(true);
  });
});
