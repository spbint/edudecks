import "server-only";

import {
  PDFiumLibrary,
  type PDFiumPageRenderOptions,
} from "@hyzyla/pdfium";
import sharp from "sharp";

let libraryPromise: ReturnType<typeof PDFiumLibrary.init> | null = null;

function getPdfiumLibrary() {
  if (!libraryPromise) {
    libraryPromise = PDFiumLibrary.init();
  }
  return libraryPromise;
}

async function encodePng(options: PDFiumPageRenderOptions) {
  return sharp(options.data, {
    raw: {
      width: options.width,
      height: options.height,
      channels: 4,
    },
  })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toBuffer();
}

export async function renderResourceFactoryWorksheetPreviewPng(
  pdfBytes: Uint8Array,
) {
  if (!pdfBytes.byteLength) {
    throw new Error("Worksheet PDF is empty.");
  }

  const library = await getPdfiumLibrary();
  const document = await library.loadDocument(Buffer.from(pdfBytes));

  try {
    let firstPage = null;
    for (const page of document.pages()) {
      firstPage = page;
      break;
    }

    if (!firstPage) {
      throw new Error("Worksheet PDF does not contain a page to preview.");
    }

    const rendered = await firstPage.render({
      scale: 2,
      render: encodePng,
    });

    return new Uint8Array(rendered.data);
  } finally {
    document.destroy();
  }
}
