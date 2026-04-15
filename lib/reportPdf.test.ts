import { describe, expect, it } from "vitest";
import { buildReportPdfFilename, buildReportPdfHtml } from "@/lib/reportPdf";

function buildPdfData(overrides: Record<string, unknown> = {}) {
  return {
    draft: {
      id: "draft-123",
      title: "Term 1 Learning Report",
      child_name: "Avery",
      report_mode: "family-summary",
      period_mode: "term",
      preferred_market: "au",
      selected_evidence_ids: ["ev-1", "ev-2"],
      selection_meta: {
        "ev-1": { role: "core" },
        "ev-2": { role: "appendix" },
      },
      include_appendix: true,
      selected_areas: ["English", "Science"],
      notes: "A calm note from home.",
    },
    learnerId: "learner-1",
    curriculumCoverage: {
      ready: true,
      reason: "ok",
      areas: [],
      totalOutcomes: 8,
      plannedOutcomes: 4,
      linkedOutcomes: 3,
      plannedOnlyOutcomes: 1,
      evidenceOnlyOutcomes: 0,
      plannedAndEvidencedOutcomes: 2,
      planLinks: 4,
      evidenceLinks: 3,
      secureOutcomes: 1,
      trackedOutcomes: 5,
      uncoveredOutcomes: 5,
      planningAheadAreas: ["Mathematics"],
      evidenceAheadAreas: [],
      strongestAreas: ["English", "Science"],
      weakestAreas: ["HASS"],
    },
    parentLanguage: {
      overall:
        "Planning and evidence are starting to line up well in English, which gives this report a more trustworthy base.",
      strengths:
        "There is early overlap between planned learning and captured evidence, which is a good sign that the record is becoming more complete.",
      nextStep:
        "Add a little more evidence in Mathematics so the thinner planned areas catch up.",
    },
    supportingEvidence: [
      {
        id: "ev-1",
        title: "Science journal entry",
        learningArea: "Science",
        occurredOn: "2026-03-14",
        linkedOutcomes: [
          {
            outcomeCode: "SC1",
            outcomeLabel: "Observes and records changes",
          },
        ],
        attachmentCount: 1,
        attachmentLabel: "Attachment available",
        attachmentNames: ["journal.pdf"],
        summary: "Observed and recorded plant growth over two weeks.",
      },
    ],
    familyPreferences: {
      country_id: "au",
      region_id: "nsw",
      framework_id: "acf",
      level_id: "stage-2",
      subject_ids: [],
      compliance_profile: {
        country: "Australia",
        state: "NSW",
      },
    },
    preferredMarket: "au",
    ...overrides,
  } as any;
}

describe("buildReportPdfHtml", () => {
  it("returns a usable HTML document with the core report sections and learner context", () => {
    const html = buildReportPdfHtml(buildPdfData());

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<title>Term 1 Learning Report</title>");
    expect(html).toContain("Avery");
    expect(html).toContain("Summary of Learning");
    expect(html).toContain("Curriculum Coverage Summary");
    expect(html).toContain("Recommended Next Steps");
    expect(html).toContain("Supporting Evidence Appendix");
    expect(html).toContain("Reference: Evidence 1");
  });

  it("propagates NSW-specific AU wording and export-pack framing into the PDF HTML", () => {
    const html = buildReportPdfHtml(buildPdfData());

    expect(html).toContain("Australian homeschool learning report");
    expect(html).toContain("current learning goals");
    expect(html).toContain(
      "Prepared as part of your family learning record. Use this version for printing, saving, or sharing alongside your homeschool documentation.",
    );
    expect(html).toContain("Included in this report");
    expect(html).toContain(
      "This report includes the current summary, linked learning areas where available, and supporting records included below.",
    );
    expect(html).toContain(
      "Supporting records linked to this summary are included below as part of the same report pack.",
    );
    expect(html).toContain("Record reference draft-123");
  });

  it("renders QLD and TAS state-aware phrasing in the PDF path", () => {
    const qldHtml = buildReportPdfHtml(
      buildPdfData({
        familyPreferences: {
          country_id: "au",
          region_id: "qld",
          framework_id: "acf",
          level_id: "stage-2",
          subject_ids: [],
          compliance_profile: {
            country: "Australia",
            state: "Queensland",
          },
        },
      }),
    );
    const tasHtml = buildReportPdfHtml(
      buildPdfData({
        familyPreferences: {
          country_id: "au",
          region_id: "tas",
          framework_id: "acf",
          level_id: "stage-2",
          subject_ids: [],
          compliance_profile: {
            country: "Australia",
            state: "Tasmania",
          },
        },
      }),
    );

    expect(qldHtml).toContain("learning taking shape over time");
    expect(qldHtml).toContain("learning picture builds over time");
    expect(tasHtml).toContain("progress being documented");
    expect(tasHtml).toContain("documented learning picture");
  });

  it("falls back to generic AU phrasing when the AU state is missing or unsupported", () => {
    const html = buildReportPdfHtml(
      buildPdfData({
        familyPreferences: {
          country_id: "au",
          region_id: "vic",
          framework_id: "acf",
          level_id: "stage-2",
          subject_ids: [],
          compliance_profile: {
            country: "Australia",
            state: "Victoria",
          },
        },
      }),
    );

    expect(html).toContain(
      "This report reflects ongoing learning aligned with your selected curriculum.",
    );
    expect(html).toContain(
      "Supporting records linked to this summary are included below.",
    );
    expect(html).not.toContain("current learning goals");
    expect(html).not.toContain("learning taking shape over time");
    expect(html).not.toContain("progress being documented");
  });

  it("omits AU-only framing for non-AU reports while keeping the PDF structure intact", () => {
    const html = buildReportPdfHtml(
      buildPdfData({
        preferredMarket: "us",
        familyPreferences: {
          country_id: "us",
          region_id: "ca",
          framework_id: "common-core",
          level_id: "grade-3",
          subject_ids: [],
        },
      }),
    );

    expect(html).toContain("US home education report");
    expect(html).toContain("Summary of Learning");
    expect(html).toContain("Reference draft-123");
    expect(html).not.toContain("Included in this report");
    expect(html).not.toContain("Record reference");
    expect(html).not.toContain("Prepared as part of your family learning record");
    expect(html).not.toContain("current learning goals");
  });

  it("uses calm thin-data wording in the PDF path when evidence is minimal", () => {
    const html = buildReportPdfHtml(
      buildPdfData({
        draft: {
          id: "draft-thin",
          title: "",
          child_name: "",
          report_mode: "family-summary",
          period_mode: "term",
          preferred_market: "au",
          selected_evidence_ids: [],
          selection_meta: {},
          include_appendix: false,
          selected_areas: [],
          notes: "",
        },
        curriculumCoverage: {
          ready: false,
          reason: "no-curriculum",
          areas: [],
          totalOutcomes: 0,
          plannedOutcomes: 0,
          linkedOutcomes: 0,
          plannedOnlyOutcomes: 0,
          evidenceOnlyOutcomes: 0,
          plannedAndEvidencedOutcomes: 0,
          planLinks: 0,
          evidenceLinks: 0,
          secureOutcomes: 0,
          trackedOutcomes: 0,
          uncoveredOutcomes: 0,
          planningAheadAreas: [],
          evidenceAheadAreas: [],
          strongestAreas: [],
          weakestAreas: [],
        },
        parentLanguage: {
          overall:
            "There is not enough curriculum context yet to build a strong report summary for this learner.",
          strengths:
            "The learner is in the family workspace, but curriculum selection still needs to be finished before the report can interpret coverage properly.",
          nextStep:
            "Finish curriculum setup in Settings so planning and evidence can be read against the right outcomes.",
        },
        supportingEvidence: [],
      }),
    );

    expect(html).toContain("Learning Report");
    expect(html).toContain("Learner");
    expect(html).toContain("Building evidence base.");
    expect(html).toContain("current picture of learning so far");
    expect(html).toContain("No supporting evidence has been linked to this report yet.");
    expect(html).toContain(
      "Supporting records will appear here as more linked evidence is added to the draft.",
    );
    expect(html).not.toContain("insufficient");
    expect(html).not.toContain("incomplete");
    expect(html).not.toContain("missing required evidence");
    expect(html).not.toContain("low confidence");
  });
});

describe("buildReportPdfFilename", () => {
  it("sanitizes the title into a stable pdf filename", () => {
    const result = buildReportPdfFilename({
      title: 'Avery: Term 1 / Science & Maths?* Report',
    });

    expect(result).toBe("avery-term-1-science-&-maths-report.pdf");
  });

  it("falls back to a generic filename when the title is blank", () => {
    const result = buildReportPdfFilename({
      title: "   ",
    });

    expect(result).toBe("learning-report.pdf");
  });
});
