import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  buildServerValidatedReportExport: vi.fn(),
}));

vi.mock("@/lib/reportExport", () => ({
  buildServerValidatedReportExport: mocks.buildServerValidatedReportExport,
}));

import { GET } from "@/app/api/report/export/route";

function makeRequest(path: string, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

describe("GET /api/report/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when reportDocumentId is missing", async () => {
    const response = await GET(makeRequest("/api/report/export", "token-123"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A reportDocumentId query parameter is required.",
      code: "missing_report_document_id",
    });
    expect(mocks.buildServerValidatedReportExport).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer token is missing", async () => {
    const response = await GET(
      makeRequest("/api/report/export?reportDocumentId=report-123"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "A signed-in access token is required for report export.",
      code: "unauthorized",
    });
    expect(mocks.buildServerValidatedReportExport).not.toHaveBeenCalled();
  });

  it("returns a structured blocker response when validation fails", async () => {
    mocks.buildServerValidatedReportExport.mockResolvedValueOnce({
      ok: false,
      status: 409,
      code: "report_not_ready",
      error: "This report is blocked.",
      validation: {
        status: "blocked",
        summary: "This report is blocked.",
        nextAction: "Complete the missing section",
        blockers: [{ code: "missing_section_content", label: "Sections", detail: "Missing" }],
        warnings: [],
        info: [],
      },
    });

    const response = await GET(
      makeRequest("/api/report/export?reportDocumentId=report-123", "token-123"),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "This report is blocked.",
      code: "report_not_ready",
      status: 409,
      validation: {
        status: "blocked",
        summary: "This report is blocked.",
        nextAction: "Complete the missing section",
        blockers: [{ code: "missing_section_content", label: "Sections", detail: "Missing" }],
        warnings: [],
        info: [],
      },
    });
  });

  it("returns printable HTML when the export is ready", async () => {
    mocks.buildServerValidatedReportExport.mockResolvedValueOnce({
      ok: true,
      status: 200,
      filename: "report-export.html",
      html: "<html><body>Ready</body></html>",
      exportModel: {
        reportDocumentId: "report-123",
        learnerId: "learner-123",
        learnerName: "Learner",
        jurisdictionName: "Tasmania",
        jurisdictionCode: "AU-TAS",
        reportingPeriodLabel: "2026 Annual Review",
        reportTitle: "Final report",
        generatedAt: new Date().toISOString(),
        gateStatus: "ready_for_export",
        gateScore: 100,
        summary: "Ready",
        nextAction: null,
        completedSectionCount: 3,
        totalSectionCount: 3,
        completedArtifactCount: 4,
        totalArtifactCount: 4,
        sections: [],
        artifacts: [],
        blockers: [],
        warnings: [],
        info: [],
      },
      validation: {
        learnerId: "learner-123",
        reportDocumentId: "report-123",
        reportingPeriodId: "period-123",
        jurisdictionCode: "AU-TAS",
        status: "ready_for_export",
        score: 100,
        blockers: [],
        warnings: [],
        info: [],
        sectionStates: [],
        artifactStates: [],
        completedSectionCount: 3,
        totalSectionCount: 3,
        completedArtifactCount: 4,
        totalArtifactCount: 4,
        summary: "Ready",
        nextAction: null,
      },
    });

    const response = await GET(
      makeRequest("/api/report/export?reportDocumentId=report-123&mode=download", "token-123"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("x-report-export-filename")).toBe("report-export.html");
    expect(await response.text()).toContain("Ready");
  });
});
