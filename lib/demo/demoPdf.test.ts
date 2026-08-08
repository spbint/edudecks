import { PDFDocument } from "pdf-lib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCarterFamilyDemoPdfBytes } from "@/lib/demo/demoPdf";

afterEach(() => {
  vi.unstubAllGlobals();
});

async function sourceWorksheetBytes() {
  const source = await PDFDocument.create();
  const page = source.addPage([300, 420]);
  page.drawRectangle({ x: 10, y: 10, width: 20, height: 20 });
  return source.save();
}

describe("Carter demo sample report PDF", () => {
  it("creates one summary page, one pathway page and eight Emma record pages", async () => {
    const worksheetBytes = await sourceWorksheetBytes();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => worksheetBytes })));

    const bytes = await buildCarterFamilyDemoPdfBytes();
    const document = await PDFDocument.load(bytes);

    expect(document.getPageCount()).toBe(10);
  });

  it("keeps the ten-page report usable when a worksheet preview cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, arrayBuffer: async () => new ArrayBuffer(0) })));

    const bytes = await buildCarterFamilyDemoPdfBytes();
    const document = await PDFDocument.load(bytes);

    expect(document.getPageCount()).toBe(10);
  });
});
