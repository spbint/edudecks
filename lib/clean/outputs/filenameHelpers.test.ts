import { describe, expect, it, vi } from "vitest";

import {
  buildCleanLearningRecordPdfFilename,
  buildCleanReportPdfFilename,
} from "@/lib/clean/outputs/pdf";
import { buildCleanCoverageRecordPdfFilename } from "@/lib/clean/outputs/curriculumCoveragePdf";
import { buildCleanWeeklyPlannerPdfFilename } from "@/lib/clean/outputs/weeklyPlanner";

/**
 * Documents the download-name contract for Clean PDF outputs:
 *
 * - filenames retain a stable, product-specific prefix and a single `.pdf`
 *   extension;
 * - user-provided labels are made safe for filesystem use without losing
 *   their identifying words; and
 * - date-derived names use the relevant reporting convention (calendar year,
 *   or ISO week-year and week number for weekly planners).
 */
describe("clean output PDF filenames", () => {
  it("uses stable names for parent-facing learning reports and records", () => {
    // Apostrophes are normalized so the learner's name remains recognizable
    // while the resulting filename is safe to download and share.
    expect(buildCleanLearningRecordPdfFilename("Sean O'Brien", "2026-06-24")).toBe(
      "MyLearna-Learning-Record-Sean-O-Brien-2026-06-24.pdf",
    );
    expect(buildCleanReportPdfFilename("Sean O'Brien", "Term 2 / 2026")).toBe(
      "MyLearna-Learning-Report-Sean-O-Brien-Term-2-2026.pdf",
    );
  });

  it("extracts a calendar year and sanitizes coverage-record learner names", () => {
    // Symbols such as ampersands are removed from the filename, while a year
    // embedded in a descriptive value is still used as the reporting year.
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

    // A missing year is resolved at generation time, not left blank in the
    // downloaded filename.
    expect(buildCleanCoverageRecordPdfFilename("Sean", null)).toBe(
      "MyLearna-Coverage-Record-Sean-2027.pdf",
    );

    vi.useRealTimers();
  });

  it("uses ISO week-year values and two-digit week numbers for weekly planners", () => {
    // The final days of December can belong to week 01 of the following ISO
    // year, so this boundary is intentionally tested alongside ordinary weeks.
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
    // Keep this assertion focused on the shared output guarantees rather than
    // duplicating the exact naming rules for every individual PDF type.
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
