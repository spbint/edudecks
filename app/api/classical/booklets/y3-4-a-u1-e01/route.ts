import { PDFDocument } from "pdf-lib";
import {
  getClassicalCurriculumResourceByCode,
} from "@/lib/clean/resources/classicalCurriculumResources";

export const runtime = "nodejs";
export const revalidate = 86400;

const RESOURCE_CODE = "MYL-CLASSICAL-Y34-A-U1-E01";

export async function GET() {
  const resource = getClassicalCurriculumResourceByCode(RESOURCE_CODE);
  if (!resource) {
    return new Response("Classical booklet not found.", { status: 404 });
  }

  try {
    const pdf = await PDFDocument.create();
    pdf.setTitle("MyLearna Classical - Encounter 1 - From Wandering to Settlement");
    pdf.setAuthor("MyLearna");
    pdf.setSubject("Years 3-4 · Cycle A: The Ancient World · Unit 1: The First Civilisations");
    pdf.setKeywords([
      "MyLearna Classical",
      "homeschool curriculum",
      "ancient world",
      "history",
      "Years 3-4",
    ]);

    for (const imageUrl of resource.pageImageUrls) {
      const response = await fetch(imageUrl, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`Could not load booklet page: ${response.status}`);
      }

      const pageBytes = new Uint8Array(await response.arrayBuffer());
      const image = await pdf.embedPng(pageBytes);
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    const bytes = await pdf.save({ useObjectStreams: true });
    const body = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${resource.fileName}"`,
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Could not build MyLearna Classical booklet", error);
    return new Response("The booklet could not be generated right now.", {
      status: 502,
    });
  }
}
