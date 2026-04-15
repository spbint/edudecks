import { describe, expect, it } from "vitest";
import {
  buildReportDocumentOverlay,
  buildReportExportPackCopy,
  buildReportSubmissionWorkflow,
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
