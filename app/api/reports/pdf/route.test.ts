import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  buildReportPdfFilename: vi.fn(),
  buildReportPdfHtml: vi.fn(),
  loadCanonicalReportPdfData: vi.fn(),
  renderReportPdf: vi.fn(),
}));

vi.mock("@/lib/reportPdf", () => ({
  buildReportPdfFilename: mocks.buildReportPdfFilename,
  buildReportPdfHtml: mocks.buildReportPdfHtml,
  loadCanonicalReportPdfData: mocks.loadCanonicalReportPdfData,
  renderReportPdf: mocks.renderReportPdf,
}));

import { GET } from "@/app/api/reports/pdf/route";

function makeRequest(path: string, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

describe("GET /api/reports/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadCanonicalReportPdfData.mockResolvedValue({
      draft: { id: "draft-123", title: "Avery Report" },
    });
    mocks.buildReportPdfHtml.mockReturnValue("<html>pdf</html>");
    mocks.renderReportPdf.mockResolvedValue(Buffer.from("pdf-bytes"));
    mocks.buildReportPdfFilename.mockReturnValue("avery-report.pdf");
  });

  it("returns a pdf response for a valid request", async () => {
    const response = await GET(makeRequest("/api/reports/pdf?draftId=draft-123", "token-123"));

    expect(mocks.loadCanonicalReportPdfData).toHaveBeenCalledWith({
      draftId: "draft-123",
      accessToken: "token-123",
    });
    expect(mocks.buildReportPdfHtml).toHaveBeenCalledWith({
      draft: { id: "draft-123", title: "Avery Report" },
    });
    expect(mocks.renderReportPdf).toHaveBeenCalledWith("<html>pdf</html>");
    expect(mocks.buildReportPdfFilename).toHaveBeenCalledWith({
      id: "draft-123",
      title: "Avery Report",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="avery-report.pdf"',
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(Buffer.from("pdf-bytes"));
  });

  it("returns 400 when draftId is missing and does not call the PDF helpers", async () => {
    const response = await GET(makeRequest("/api/reports/pdf", "token-123"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A draftId query parameter is required.",
    });
    expect(mocks.loadCanonicalReportPdfData).not.toHaveBeenCalled();
    expect(mocks.buildReportPdfHtml).not.toHaveBeenCalled();
    expect(mocks.renderReportPdf).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer token is missing and does not call the PDF helpers", async () => {
    const response = await GET(makeRequest("/api/reports/pdf?draftId=draft-123"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "A signed-in access token is required for PDF export.",
    });
    expect(mocks.loadCanonicalReportPdfData).not.toHaveBeenCalled();
    expect(mocks.buildReportPdfHtml).not.toHaveBeenCalled();
    expect(mocks.renderReportPdf).not.toHaveBeenCalled();
  });

  it("returns 404 when the PDF data loader reports a missing draft", async () => {
    mocks.loadCanonicalReportPdfData.mockRejectedValueOnce(new Error("Report draft not found."));

    const response = await GET(makeRequest("/api/reports/pdf?draftId=missing", "token-123"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Report draft not found.",
    });
  });

  it("returns 400 when the PDF data loader reports learner context failure", async () => {
    mocks.loadCanonicalReportPdfData.mockRejectedValueOnce(
      new Error("No learner is attached to this draft."),
    );

    const response = await GET(makeRequest("/api/reports/pdf?draftId=draft-123", "token-123"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No learner is attached to this draft.",
    });
  });

  it("returns 401 when the PDF data loader reports a token or session failure", async () => {
    mocks.loadCanonicalReportPdfData.mockRejectedValueOnce(
      new Error("A valid signed-in session is required to export this report."),
    );

    const response = await GET(makeRequest("/api/reports/pdf?draftId=draft-123", "token-123"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "A valid signed-in session is required to export this report.",
    });
  });

  it("returns 500 when downstream PDF rendering fails", async () => {
    mocks.renderReportPdf.mockRejectedValueOnce(new Error("Chromium failed to render the report PDF."));

    const response = await GET(makeRequest("/api/reports/pdf?draftId=draft-123", "token-123"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Chromium failed to render the report PDF.",
    });
  });

  it("falls back to a safe generic 500 message when the thrown error has no usable message", async () => {
    mocks.loadCanonicalReportPdfData.mockRejectedValueOnce({ message: "   " });

    const response = await GET(makeRequest("/api/reports/pdf?draftId=draft-123", "token-123"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to generate report PDF.",
    });
  });
});
