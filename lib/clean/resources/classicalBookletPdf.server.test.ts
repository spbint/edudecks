import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MYLEARNA_CLASSICAL_ENCOUNTER_ONE } from "@/lib/clean/curriculum/classicalCurriculumRegistry";

const pdfMocks = vi.hoisted(() => {
  const drawImage = vi.fn();
  const pdf = {
    setTitle: vi.fn(),
    setAuthor: vi.fn(),
    setSubject: vi.fn(),
    setKeywords: vi.fn(),
    embedPng: vi.fn(async () => ({ width: 1200, height: 1600 })),
    addPage: vi.fn(() => ({ drawImage })),
    save: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
  };
  return { drawImage, pdf, create: vi.fn(async () => pdf) };
});

vi.mock("pdf-lib", () => ({
  PDFDocument: { create: pdfMocks.create },
}));

import { buildClassicalBookletPdfResponse } from "@/lib/clean/resources/classicalBookletPdf.server";

describe("Classical booklet PDF delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("preserves Encounter 1's public PDF contract using trusted registry assets", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await buildClassicalBookletPdfResponse("y3-4-a-u1-e01");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="${MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource.fileName}"`,
    );
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=3600, s-maxage=86400",
    );
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(
      MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource.pageImageUrls,
    );
    expect(fetchMock.mock.calls.every(([, init]) => init?.cache === "force-cache")).toBe(true);
    expect(pdfMocks.pdf.embedPng).toHaveBeenCalledTimes(10);
    expect(pdfMocks.pdf.addPage).toHaveBeenCalledTimes(10);
    expect(pdfMocks.pdf.setTitle).toHaveBeenCalledWith(
      MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource.pdfMetadata.title,
    );
  });

  it("returns 404 without fetching anything for an unknown booklet key", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await buildClassicalBookletPdfResponse("not-a-booklet");

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Classical booklet not found.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(pdfMocks.create).not.toHaveBeenCalled();
  });

  it("keeps the existing safe failure response when a trusted page cannot load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));

    const response = await buildClassicalBookletPdfResponse("y3-4-a-u1-e01");

    expect(response.status).toBe(502);
    expect(await response.text()).toBe("The booklet could not be generated right now.");
  });
});
