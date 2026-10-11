import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import type { ResourceFactoryWorksheetSpec } from "@/lib/resourceFactory/types";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 46;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;

function safePdfText(value: string) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E\n]/g, "?");
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of safePdfText(text).split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawWrappedText(input: {
  page: PDFPage;
  text: string;
  font: PDFFont;
  size: number;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight?: number;
}) {
  const lineHeight = input.lineHeight ?? input.size * 1.35;
  let y = input.y;
  for (const line of wrapText(input.text, input.font, input.size, input.maxWidth)) {
    input.page.drawText(line, {
      x: input.x,
      y,
      size: input.size,
      font: input.font,
      color: rgb(0.12, 0.15, 0.2),
    });
    y -= lineHeight;
  }
  return y;
}

async function buildResourceFactoryPdf(
  spec: ResourceFactoryWorksheetSpec,
  mode: "worksheet" | "answers",
) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = A4_HEIGHT - MARGIN;

  const resetPage = (continuation = false) => {
    page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    y = A4_HEIGHT - MARGIN;
    if (continuation) {
      page.drawText(safePdfText(spec.title), {
        x: MARGIN,
        y,
        size: 10,
        font: bold,
        color: rgb(0.2, 0.24, 0.32),
      });
      y -= 24;
    }
  };

  page.drawText("MyLearna", {
    x: MARGIN,
    y,
    size: 16,
    font: bold,
    color: rgb(0.06, 0.11, 0.2),
  });
  page.drawText(mode === "answers" ? "ANSWER KEY" : "WORKSHEET", {
    x: A4_WIDTH - MARGIN - 78,
    y: y + 2,
    size: 9,
    font: bold,
    color: rgb(0.32, 0.37, 0.46),
  });
  y -= 34;

  y = drawWrappedText({
    page,
    text: spec.title,
    font: bold,
    size: 20,
    x: MARGIN,
    y,
    maxWidth: CONTENT_WIDTH,
    lineHeight: 25,
  });
  y -= 5;

  const meta = `${spec.yearLevels.join(", ")}  |  ${spec.strand}  |  ${spec.skill}`;
  y = drawWrappedText({
    page,
    text: meta,
    font: regular,
    size: 9,
    x: MARGIN,
    y,
    maxWidth: CONTENT_WIDTH,
    lineHeight: 13,
  });
  y -= 12;

  y = drawWrappedText({
    page,
    text: spec.instructions,
    font: regular,
    size: 10,
    x: MARGIN,
    y,
    maxWidth: CONTENT_WIDTH,
    lineHeight: 14,
  });
  y -= 12;

  if (spec.workedExample.prompt) {
    page.drawText("Worked example", {
      x: MARGIN,
      y,
      size: 11,
      font: bold,
      color: rgb(0.06, 0.11, 0.2),
    });
    y -= 17;
    y = drawWrappedText({
      page,
      text: `${spec.workedExample.prompt}\n${spec.workedExample.working}\nAnswer: ${spec.workedExample.answer}`,
      font: regular,
      size: 9.5,
      x: MARGIN + 10,
      y,
      maxWidth: CONTENT_WIDTH - 20,
      lineHeight: 13,
    });
    y -= 12;
  }

  for (const question of spec.questions) {
    const detail =
      mode === "answers"
        ? `${question.prompt}\nAnswer: ${question.answer}${question.working ? `\nWorking: ${question.working}` : ""}`
        : question.prompt;
    const estimatedLines = wrapText(detail, regular, 10, CONTENT_WIDTH - 26).length;
    const requiredHeight = estimatedLines * 14 + 28;

    if (y - requiredHeight < 64) {
      resetPage(true);
    }

    page.drawText(`${question.id}.`, {
      x: MARGIN,
      y,
      size: 10,
      font: bold,
      color: rgb(0.06, 0.11, 0.2),
    });

    y = drawWrappedText({
      page,
      text: detail,
      font: regular,
      size: 10,
      x: MARGIN + 26,
      y,
      maxWidth: CONTENT_WIDTH - 26,
      lineHeight: 14,
    });

    if (mode === "worksheet") {
      y -= 24;
      page.drawLine({
        start: { x: MARGIN + 26, y },
        end: { x: A4_WIDTH - MARGIN, y },
        thickness: 0.6,
        color: rgb(0.75, 0.78, 0.82),
      });
      y -= 16;
    } else {
      y -= 14;
    }
  }

  if (mode === "worksheet" && spec.parentNotes) {
    if (y < 120) resetPage(true);
    page.drawText("Parent note", {
      x: MARGIN,
      y,
      size: 10,
      font: bold,
      color: rgb(0.06, 0.11, 0.2),
    });
    y -= 16;
    drawWrappedText({
      page,
      text: spec.parentNotes,
      font: regular,
      size: 9,
      x: MARGIN,
      y,
      maxWidth: CONTENT_WIDTH,
      lineHeight: 13,
    });
  }

  for (const currentPage of doc.getPages()) {
    currentPage.drawText("MyLearna - Plan. Capture. Grow.", {
      x: MARGIN,
      y: 28,
      size: 8,
      font: regular,
      color: rgb(0.45, 0.49, 0.56),
    });
  }

  return doc.save();
}

export function buildResourceFactoryWorksheetPdf(
  spec: ResourceFactoryWorksheetSpec,
) {
  return buildResourceFactoryPdf(spec, "worksheet");
}

export function buildResourceFactoryAnswerPdf(
  spec: ResourceFactoryWorksheetSpec,
) {
  return buildResourceFactoryPdf(spec, "answers");
}
