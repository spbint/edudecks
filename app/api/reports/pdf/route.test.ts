import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  buildPdfFilename: vi.fn(),
  buildServerValidatedReportExportPayload: vi.fn(),
  generateReportPdfBuffer: vi.fn(),
  recordValidatedReportExportEvent: vi.fn(),
}));

vi.mock("@/lib/reportExport", () => ({
  buildServerValidatedReportExportPayload: mocks.buildServerValidatedReportExportPayload,
  recordValidatedReportExportEvent: mocks.recordValidatedReportExportEvent,
}));

vi.mock("@/lib/reportPdfExport", () => ({
  buildPdfFilename: mocks.buildPdfFilename,
  generateReportPdfBuffer: mocks.generateReportPdfBuffer,
}));

import { GET } from "@/app/api/reports/pdf/route";

function makeRequest(path: string, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

const validation = {
  status: "ready_for_export",
  summary: "Ready for export.",
  nextAction: null,
  blockers: [],
  warnings: [],
  info: [],
};

describe("GET /api/reports/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildServerValidatedReportExportPayload.mockResolvedValue({
      ok: true,
      status: 200,
      exportModel: { reportDocumentId: "report-123", learnerId: "learner-123" },
      validation,
    });
    mocks.generateReportPdfBuffer.mockResolvedValue(Buffer.from("pdf-bytes"));
    mocks.buildPdfFilename.mockReturnValue("learner-report.pdf");
    mocks.recordValidatedReportExportEvent.mockResolvedValue(null);
  });

  it("requires the current reportDocumentId contract", async () => {
    const response = await GET(makeRequest("/api/reports/pdf?draftId=draft-123", "token-123"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A reportDocumentId query parameter is required.",
      code: "missing_report_document_id",
    });
    expect(mocks.buildServerValidatedReportExportPayload).not.toHaveBeenCalled();
  });

  it("requires a signed-in access token before export", async () => {
    const response = await GET(makeRequest("/api/reports/pdf?reportDocumentId=report-123"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "A signed-in access token is required for report export.",
      code: "unauthorized",
    });
  });

  it("returns the validated readiness blocker without generating a PDF", async () => {
    mocks.buildServerValidatedReportExportPayload.mockResolvedValueOnce({
      ok: false,
      status: 409,
      code: "report_not_ready",
      error: "No approved assessment results are available for this report.",
      validation: {
        status: "blocked",
        summary: "No approved assessment results are available for this report.",
        nextAction: "Approve an assessment result",
        blockers: [{ code: "no_approved_results", label: "Approved results", detail: "Required" }],
        warnings: [],
        info: [],
      },
    });

    const response = await GET(
      makeRequest("/api/reports/pdf?reportDocumentId=report-123", "token-123"),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "No approved assessment results are available for this report.",
      code: "report_not_ready",
      status: 409,
      validation: { status: "blocked", nextAction: "Approve an assessment result" },
    });
    expect(mocks.generateReportPdfBuffer).not.toHaveBeenCalled();
  });

  it("generates a PDF from the validated learner-scoped payload", async () => {
    const response = await GET(
      makeRequest("/api/reports/pdf?reportDocumentId=report-123", "token-123"),
    );

    expect(mocks.buildServerValidatedReportExportPayload).toHaveBeenCalledWith({
      reportDocumentId: "report-123",
      accessToken: "token-123",
    });
    expect(mocks.generateReportPdfBuffer).toHaveBeenCalledWith({
      reportDocumentId: "report-123",
      learnerId: "learner-123",
    });
    expect(mocks.buildPdfFilename).toHaveBeenCalledWith({
      reportDocumentId: "report-123",
      learnerId: "learner-123",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="learner-report.pdf"',
    );
    expect(response.headers.get("x-report-export-status")).toBe("ready_for_export");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(Buffer.from("pdf-bytes"));
  });
});
