import { describe, expect, it } from "vitest";
import {
  buildReportDocumentOverlay,
  buildReportExportPackCopy,
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
