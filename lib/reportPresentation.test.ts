import { describe, expect, it } from "vitest";
import {
  buildReportDocumentOverlay,
  buildReportExportPackCopy,
  buildReportPeriodPresentation,
  buildReportSubmissionWorkflow,
  groupReportsByPeriod,
  getAuCompliancePhrases,
  getReportComplianceContext,
} from "@/lib/reportPresentation";

describe("getReportComplianceContext", () => {
  it("detects AU context from market and normalizes the state from compliance profile", () => {
    const result = getReportComplianceContext({
      market: "au",
      curriculumPreferences: {
        country_id: null,
        region_id: null,
        framework_id: null,
        level_id: null,
        subject_ids: [],
        compliance_profile: {
          country: "Australia",
          state: "new south wales",
        },
      } as any,
    });

    expect(result).toEqual({
      isAU: true,
      state: "NSW",
      country: "australia",
    });
  });

  it("falls back to country and region ids when market is not AU", () => {
    const result = getReportComplianceContext({
      market: "uk",
      curriculumPreferences: {
        country_id: "au",
        region_id: "tasmania",
        framework_id: null,
        level_id: null,
        subject_ids: [],
      } as any,
    });

    expect(result).toEqual({
      isAU: true,
      state: "TAS",
      country: "au",
    });
  });

  it("returns non-AU context when no AU signal is present", () => {
    const result = getReportComplianceContext({
      market: "us",
      curriculumPreferences: {
        country_id: "us",
        region_id: "california",
        framework_id: null,
        level_id: null,
        subject_ids: [],
      } as any,
    });

    expect(result).toEqual({
      isAU: false,
      state: null,
      country: "us",
    });
  });
});

describe("getAuCompliancePhrases", () => {
  it("returns NSW-specific phrasing", () => {
    const result = getAuCompliancePhrases("NSW");

    expect(result.subtitle).toContain("current learning goals");
    expect(result.evidenceSummaryFraming).toContain("goals guiding it");
    expect(result.appendixFraming).toContain("alongside the current learning goals");
  });

  it("returns TAS-specific phrasing", () => {
    const result = getAuCompliancePhrases("tasmania");

    expect(result.subtitle).toContain("progress being documented");
    expect(result.appendixFraming).toContain("documented learning picture");
  });

  it("falls back to the generic AU phrasing for other states", () => {
    const result = getAuCompliancePhrases("VIC");

    expect(result.subtitle).toBe(
      "This report reflects ongoing learning aligned with your selected curriculum.",
    );
    expect(result.appendixFraming).toBe(
      "Supporting records linked to this summary are included below.",
    );
  });
});

describe("buildReportDocumentOverlay", () => {
  it("returns the AU overlay copy", () => {
    const result = buildReportDocumentOverlay("au");

    expect(result.reportEyebrow).toBe("Australian homeschool learning report");
    expect(result.periodLabel).toBe("Learning period");
    expect(result.marketLabelText).toBe("National context");
    expect(result.outputRoleNote).toContain("print-ready version");
  });

  it("falls back to the generic overlay for unknown markets", () => {
    const result = buildReportDocumentOverlay("ca");

    expect(result.reportEyebrow).toBe("Homeschool learning report");
    expect(result.marketLabelText).toBe("Market context");
    expect(result.coverageNote).toContain("family reporting contexts");
  });
});

describe("buildReportExportPackCopy", () => {
  const auContext = { isAU: true, state: "NSW", country: "australia" } as const;

  it("returns null for non-AU reports", () => {
    const result = buildReportExportPackCopy({
      complianceContext: { isAU: false, state: null, country: "us" },
      hasMeaningfulCoverage: true,
      selectedEvidenceCount: 3,
      selectedAreasCount: 2,
      includeAppendix: true,
      supportingEvidenceCount: 2,
    });

    expect(result).toBeNull();
  });

  it("uses thin-data wording when no evidence has been selected", () => {
    const result = buildReportExportPackCopy({
      complianceContext: auContext,
      hasMeaningfulCoverage: false,
      selectedEvidenceCount: 0,
      selectedAreasCount: 0,
      includeAppendix: false,
      supportingEvidenceCount: 0,
    });

    expect(result).not.toBeNull();
    expect(result?.headerFraming).toContain("current picture of learning so far");
    expect(result?.actionFraming).toContain("learning picture grows");
    expect(result?.includedSummary).toContain(
      "with space for supporting records as more linked evidence is added.",
    );
    expect(result?.appendixFraming).toContain("will appear below");
    expect(result?.referenceLabel).toBe("Record reference");
  });

  it("uses stronger AU export-pack framing when coverage is meaningful", () => {
    const result = buildReportExportPackCopy({
      complianceContext: auContext,
      hasMeaningfulCoverage: true,
      selectedEvidenceCount: 4,
      selectedAreasCount: 3,
      includeAppendix: true,
      supportingEvidenceCount: 2,
    });

    expect(result?.headerFraming).toContain("alongside your homeschool documentation");
    expect(result?.actionFraming).toBe(
      "Print or save this report as part of your documentation.",
    );
    expect(result?.includedHeading).toBe("Included in this report");
    expect(result?.includedSummary).toBe(
      "This report includes the current summary, linked learning areas where available, and supporting records included below.",
    );
    expect(result?.appendixFraming).toBe(
      "Supporting records linked to this summary are included below as part of the same report pack.",
    );
  });

  it("mentions learning areas without overclaiming supporting records when none are linked yet", () => {
    const result = buildReportExportPackCopy({
      complianceContext: auContext,
      hasMeaningfulCoverage: false,
      selectedEvidenceCount: 2,
      selectedAreasCount: 1,
      includeAppendix: false,
      supportingEvidenceCount: 0,
    });

    expect(result?.headerFraming).toContain("continues to build");
    expect(result?.includedSummary).toBe(
      "This report includes the current summary and linked learning areas where available, with space for supporting records as more linked evidence is added.",
    );
  });
});

describe("buildReportSubmissionWorkflow", () => {
  const auContext = { isAU: true, state: "NSW", country: "australia" } as const;

  it("returns null for non-AU reports", () => {
    const result = buildReportSubmissionWorkflow({
      complianceContext: { isAU: false, state: null, country: "us" },
      isSavedDraft: true,
      hasMeaningfulCoverage: true,
      selectedEvidenceCount: 4,
      selectedCoreCount: 2,
      includeAppendix: true,
      supportingRecordsCount: 2,
      periodLabel: "Learning period",
    });

    expect(result).toBeNull();
  });

  it("maps thin AU report signals to the draft workflow state", () => {
    const result = buildReportSubmissionWorkflow({
      complianceContext: auContext,
      isSavedDraft: false,
      hasMeaningfulCoverage: false,
      selectedEvidenceCount: 0,
      selectedCoreCount: 0,
      includeAppendix: false,
      supportingRecordsCount: 0,
      periodLabel: "Learning period",
    });

    expect(result?.state).toBe("draft");
    expect(result?.label).toBe("Draft");
    expect(result?.detail).toContain("Still being shaped");
    expect(result?.actionFraming).toContain("still being shaped before record-keeping");
    expect(result?.periodNote).toBe(
      "Still building for this learning period before you save it with your records.",
    );
    expect(result?.actionFraming.toLowerCase()).not.toContain("must");
    expect(result?.actionFraming.toLowerCase()).not.toContain("failed");
  });

  it("maps usable AU review signals to ready for review", () => {
    const result = buildReportSubmissionWorkflow({
      complianceContext: auContext,
      isSavedDraft: true,
      hasMeaningfulCoverage: false,
      selectedEvidenceCount: 2,
      selectedCoreCount: 1,
      includeAppendix: false,
      supportingRecordsCount: 0,
      periodLabel: "Reporting period",
    });

    expect(result?.state).toBe("review");
    expect(result?.label).toBe("Ready for review");
    expect(result?.detail).toContain("Enough is in place to review this report");
    expect(result?.actionFraming).toContain("family learning record");
    expect(result?.actionFraming).not.toContain("prepared for saving");
    expect(result?.periodNote).toBe(
      "This report belongs to this reporting period and is ready to review before record-keeping.",
    );
  });

  it("maps stronger AU record-ready signals to prepared for records", () => {
    const result = buildReportSubmissionWorkflow({
      complianceContext: auContext,
      isSavedDraft: true,
      hasMeaningfulCoverage: true,
      selectedEvidenceCount: 4,
      selectedCoreCount: 2,
      includeAppendix: true,
      supportingRecordsCount: 2,
      periodLabel: "Learning period",
    });

    expect(result?.state).toBe("prepared");
    expect(result?.label).toBe("Prepared for records");
    expect(result?.detail).toBe("Organized for saving or sharing.");
    expect(result?.actionFraming).toBe(
      "This report has been prepared for saving or sharing alongside your records.",
    );
    expect(result?.periodNote).toBe(
      "Prepared for this learning period as part of your family learning record.",
    );
    expect(result?.actionFraming.toLowerCase()).not.toContain("compliant");
    expect(result?.actionFraming.toLowerCase()).not.toContain("approved");
    expect(result?.actionFraming.toLowerCase()).not.toContain("complete");
  });

  it("falls back safely when the period label is missing", () => {
    const result = buildReportSubmissionWorkflow({
      complianceContext: auContext,
      isSavedDraft: false,
      hasMeaningfulCoverage: false,
      selectedEvidenceCount: 1,
      selectedCoreCount: 0,
      includeAppendix: false,
      supportingRecordsCount: 0,
      periodLabel: "",
    });

    expect(result?.state).toBe("draft");
    expect(result?.periodNote).toBe(
      "Still building for this reporting period before you save it with your records.",
    );
  });

  it("treats core anchors alone as enough record support for the prepared state", () => {
    const result = buildReportSubmissionWorkflow({
      complianceContext: auContext,
      isSavedDraft: true,
      hasMeaningfulCoverage: true,
      selectedEvidenceCount: 3,
      selectedCoreCount: 2,
      includeAppendix: false,
      supportingRecordsCount: 0,
      periodLabel: "Learning period",
    });

    expect(result?.state).toBe("prepared");
    expect(result?.label).toBe("Prepared for records");
  });
});

describe("buildReportPeriodPresentation", () => {
  it("maps term mode to a calm term presentation", () => {
    const result = buildReportPeriodPresentation({
      periodMode: "term",
      periodLabel: "Term",
    });

    expect(result.kind).toBe("term");
    expect(result.label).toBe("Term");
    expect(result.heading).toBe("Reporting period");
    expect(result.note).toBe("This report reflects the learning captured in this term.");
    expect(result.exportNote).toBe(
      "Use this report as part of your record for this term.",
    );
  });

  it("maps semester mode to a semester presentation", () => {
    const result = buildReportPeriodPresentation({
      periodMode: "semester",
      periodLabel: "Semester",
    });

    expect(result.kind).toBe("semester");
    expect(result.label).toBe("Semester");
    expect(result.note).toContain("this semester");
    expect(result.exportNote).toContain("for this semester");
  });

  it("maps year mode to annual review wording", () => {
    const result = buildReportPeriodPresentation({
      periodMode: "year",
      periodLabel: "Year",
    });

    expect(result.kind).toBe("annual");
    expect(result.label).toBe("Annual review");
    expect(result.note).toContain("annual review");
    expect(result.exportNote).toContain("annual review");
  });

  it("falls back to a custom learning period for unknown modes", () => {
    const result = buildReportPeriodPresentation({
      periodMode: "all",
      periodLabel: "All Time",
    });

    expect(result.kind).toBe("custom");
    expect(result.label).toBe("All Time");
    expect(result.note).toBe("This report reflects the learning captured in this period so far.");
    expect(result.exportNote).toBe(
      "Use this report as part of your record for this period.",
    );
  });

  it("falls back safely when period inputs are missing", () => {
    const result = buildReportPeriodPresentation({});

    expect(result.kind).toBe("custom");
    expect(result.label).toBe("Custom learning period");
    expect(result.heading).toBe("Reporting period");
    expect(result.note).toContain("this period so far");
  });

  it("keeps period wording modest and non-bureaucratic", () => {
    const result = buildReportPeriodPresentation({
      periodMode: "term",
      periodLabel: "Term",
    });

    const combinedCopy = `${result.heading} ${result.note} ${result.exportNote}`.toLowerCase();

    expect(combinedCopy).not.toContain("official");
    expect(combinedCopy).not.toContain("complete");
    expect(combinedCopy).not.toContain("required");
    expect(combinedCopy).not.toContain("validated");
    expect(combinedCopy).not.toContain("compliant");
    expect(combinedCopy).not.toContain("authority");
  });
});

describe("groupReportsByPeriod", () => {
  type ReportFixture = {
    id: string;
    periodMode?: string | null;
    periodLabel?: string | null;
  };

  const getPeriodInput = (item: ReportFixture) => ({
    periodMode: item.periodMode,
    periodLabel: item.periodLabel,
  });

  it("groups term reports under the term bucket", () => {
    const reports: ReportFixture[] = [
      { id: "r1", periodMode: "term", periodLabel: "Term" },
      { id: "r2", periodMode: "term", periodLabel: "Term" },
    ];

    const result = groupReportsByPeriod(reports, getPeriodInput);

    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe("term");
    expect(result[0]?.label).toBe("Term");
    expect(result[0]?.items.map((item) => item.id)).toEqual(["r1", "r2"]);
  });

  it("groups semester and annual review reports into their own buckets", () => {
    const reports: ReportFixture[] = [
      { id: "semester-report", periodMode: "semester", periodLabel: "Semester" },
      { id: "annual-report", periodMode: "year", periodLabel: "Year" },
    ];

    const result = groupReportsByPeriod(reports, getPeriodInput);

    expect(result).toHaveLength(2);
    expect(result[0]?.key).toBe("semester");
    expect(result[0]?.label).toBe("Semester");
    expect(result[0]?.items[0]?.id).toBe("semester-report");
    expect(result[1]?.key).toBe("annual");
    expect(result[1]?.label).toBe("Annual review");
    expect(result[1]?.items[0]?.id).toBe("annual-report");
  });

  it("falls back unknown and missing period modes into the custom bucket", () => {
    const reports: ReportFixture[] = [
      { id: "unknown-period", periodMode: "all", periodLabel: "All Time" },
      { id: "missing-period", periodMode: null, periodLabel: null },
    ];

    const result = groupReportsByPeriod(reports, getPeriodInput);

    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe("custom");
    expect(result[0]?.label).toBe("All Time");
    expect(result[0]?.description).toBe("Reports grouped for this learning period.");
    expect(result[0]?.items.map((item) => item.id)).toEqual([
      "unknown-period",
      "missing-period",
    ]);
  });

  it("splits a mixed list into stable period groups while preserving assignment", () => {
    const reports: ReportFixture[] = [
      { id: "term-a", periodMode: "term", periodLabel: "Term" },
      { id: "custom-a", periodMode: "all", periodLabel: "All Time" },
      { id: "semester-a", periodMode: "semester", periodLabel: "Semester" },
      { id: "term-b", periodMode: "term", periodLabel: "Term" },
      { id: "annual-a", periodMode: "year", periodLabel: "Year" },
    ];

    const result = groupReportsByPeriod(reports, getPeriodInput);

    expect(result.map((group) => group.key)).toEqual([
      "term",
      "custom",
      "semester",
      "annual",
    ]);
    expect(result.find((group) => group.key === "term")?.items.map((item) => item.id)).toEqual([
      "term-a",
      "term-b",
    ]);
    expect(
      result.find((group) => group.key === "custom")?.items.map((item) => item.id),
    ).toEqual(["custom-a"]);
    expect(
      result.find((group) => group.key === "semester")?.items.map((item) => item.id),
    ).toEqual(["semester-a"]);
    expect(
      result.find((group) => group.key === "annual")?.items.map((item) => item.id),
    ).toEqual(["annual-a"]);
  });

  it("keeps grouping descriptions calm and non-bureaucratic", () => {
    const reports: ReportFixture[] = [
      { id: "term-a", periodMode: "term", periodLabel: "Term" },
      { id: "custom-a", periodMode: "all", periodLabel: "All Time" },
    ];

    const result = groupReportsByPeriod(reports, getPeriodInput);
    const combinedCopy = result
      .map((group) => `${group.label} ${group.description}`)
      .join(" ")
      .toLowerCase();

    expect(combinedCopy).not.toContain("required");
    expect(combinedCopy).not.toContain("validated");
    expect(combinedCopy).not.toContain("authority");
    expect(combinedCopy).not.toContain("compliant");
  });
});
