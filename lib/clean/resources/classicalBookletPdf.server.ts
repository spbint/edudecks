import { PDFDocument } from "pdf-lib";
import { getLiveClassicalEncounterByBookletKey } from "@/lib/clean/curriculum/classicalCurriculumRegistry";

export async function buildClassicalBookletPdfResponse(bookletKey: string) {
  const encounter = getLiveClassicalEncounterByBookletKey(bookletKey);
  if (!encounter) {
    return new Response("Classical booklet not found.", { status: 404 });
  }

  try {
    const pdf = await PDFDocument.create();
    pdf.setTitle(encounter.resource.pdfMetadata.title);
    pdf.setAuthor(encounter.resource.pdfMetadata.author);
    pdf.setSubject(encounter.resource.pdfMetadata.subject);
    pdf.setKeywords([...encounter.resource.pdfMetadata.keywords]);

    const pageBuffers = await Promise.all(
      encounter.resource.pageImageUrls.map(async (imageUrl) => {
        const response = await fetch(imageUrl, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`Could not load booklet page: ${response.status}`);
        }
        return new Uint8Array(await response.arrayBuffer());
      }),
    );

    for (const pageBytes of pageBuffers) {
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
        "content-disposition": `attachment; filename="${encounter.resource.fileName}"`,
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
