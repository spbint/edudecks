import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type {
  CleanReport,
  CleanReportSection,
  CleanReportingPeriod,
} from "@/lib/clean/reports/types";

export type CleanReportPdfEvidenceItem = {
  id: string;
  title: string;
  observedOn: string | null;
  learnerLabel: string;
  learningArea: string | null;
  programTitle: string | null;
  segmentTitle: string | null;
  blockTitle: string | null;
  whatHappened: string;
  reflection: string | null;
  portfolioNote: string | null;
};

export type CleanReportPdfModel = {
  report: CleanReport;
  learnerLabel: string;
  reportingPeriod: CleanReportingPeriod | null;
  sections: CleanReportSection[];
  evidenceItems: CleanReportPdfEvidenceItem[];
  preparedOnLabel: string;
  statusLabel: string;
};

type PdfTheme = {
  title: ReturnType<typeof rgb>;
  heading: ReturnType<typeof rgb>;
  body: ReturnType<typeof rgb>;
  muted: ReturnType<typeof rgb>;
  accent: ReturnType<typeof rgb>;
  surface: ReturnType<typeof rgb>;
};

type PdfComposer = {
  doc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
  margin: number;
  footerSpace: number;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
  theme: PdfTheme;
};

const DISCLAIMER_TEXT =
  "This document is a family learning record. Families should check their local home education authority requirements before submitting records.";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeText(value: string | null | undefined) {
  return safe(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeFilePart(value: string, fallback: string) {
  const clean = safe(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || fallback;
}

function formatDateLabel(value: string | null | undefined) {
  const clean = safe(value);
  if (!clean) return "Not set";
  const date = new Date(`${clean}T00:00:00`);
  if (Number.isNaN(date.getTime())) return clean;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(period: CleanReportingPeriod | null) {
  if (!period) return "Dates not set";
  return `${formatDateLabel(period.startsOn)} to ${formatDateLabel(period.endsOn)}`;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const paragraphs = normalizeText(text)
    .split(/\n+/)
    .map((item) => item.trim());

  const lines: string[] = [];

  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      lines.push("");
      return;
    }

    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (!current || width <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    });

    if (current) {
      lines.push(current);
    }

    lines.push("");
  });

  while (lines.length && !lines[lines.length - 1]) {
    lines.pop();
  }

  return lines;
}

function createComposer(
  doc: PDFDocument,
  regular: PDFFont,
  bold: PDFFont,
  theme: PdfTheme,
): PdfComposer {
  const page = doc.addPage([595.28, 841.89]);
  return {
    doc,
    page,
    width: page.getWidth(),
    height: page.getHeight(),
    margin: 46,
    footerSpace: 56,
    y: page.getHeight() - 54,
    regular,
    bold,
    theme,
  };
}

function ensureSpace(composer: PdfComposer, needed: number) {
  if (composer.y - needed > composer.margin + composer.footerSpace) {
    return composer;
  }

  const page = composer.doc.addPage([composer.width, composer.height]);
  return {
    ...composer,
    page,
    y: composer.height - 54,
  };
}

function drawTextBlock(
  composer: PdfComposer,
  text: string,
  options?: {
    font?: PDFFont;
    fontSize?: number;
    lineHeight?: number;
    color?: ReturnType<typeof rgb>;
    spacingAfter?: number;
  },
) {
  const font = options?.font || composer.regular;
  const fontSize = options?.fontSize || 11;
  const lineHeight = options?.lineHeight || fontSize + 4;
  const color = options?.color || composer.theme.body;
  const spacingAfter = options?.spacingAfter ?? 10;
  const maxWidth = composer.width - composer.margin * 2;
  const lines = wrapText(text, font, fontSize, maxWidth);
  const next = ensureSpace(composer, lines.length * lineHeight + spacingAfter);

  lines.forEach((line) => {
    if (!line) {
      next.y -= lineHeight * 0.5;
      return;
    }

    next.page.drawText(line, {
      x: next.margin,
      y: next.y,
      size: fontSize,
      font,
      color,
    });
    next.y -= lineHeight;
  });

  next.y -= spacingAfter;
  return next;
}

function drawHeading(composer: PdfComposer, text: string, level: 1 | 2 | 3 = 1) {
  const fontSize = level === 1 ? 22 : level === 2 ? 16 : 13;
  const spacingBefore = level === 1 ? 16 : 12;
  const next = ensureSpace(composer, fontSize + spacingBefore + 14);
  next.y -= spacingBefore;
  next.page.drawText(text, {
    x: next.margin,
    y: next.y,
    size: fontSize,
    font: next.bold,
    color: level === 1 ? next.theme.title : next.theme.heading,
  });
  next.y -= fontSize + 6;
  return next;
}

function drawDivider(composer: PdfComposer) {
  composer.page.drawLine({
    start: { x: composer.margin, y: composer.y },
    end: { x: composer.width - composer.margin, y: composer.y },
    thickness: 1,
    color: composer.theme.accent,
  });
  composer.y -= 14;
  return composer;
}

function measureWrappedLines(lines: string[], lineHeight: number) {
  return lines.reduce(
    (total, line) => total + (line ? lineHeight : lineHeight * 0.5),
    0,
  );
}

function drawPreparedLines(
  composer: PdfComposer,
  lines: string[],
  options: {
    x: number;
    y: number;
    font: PDFFont;
    fontSize: number;
    lineHeight: number;
    color: ReturnType<typeof rgb>;
  },
) {
  let cursor = options.y;
  lines.forEach((line) => {
    if (!line) {
      cursor -= options.lineHeight * 0.5;
      return;
    }

    composer.page.drawText(line, {
      x: options.x,
      y: cursor,
      size: options.fontSize,
      font: options.font,
      color: options.color,
    });
    cursor -= options.lineHeight;
  });

  return cursor;
}

function drawPanel(
  composer: PdfComposer,
  top: number,
  height: number,
  options?: {
    fill?: ReturnType<typeof rgb>;
    border?: ReturnType<typeof rgb>;
  },
) {
  composer.page.drawRectangle({
    x: composer.margin,
    y: top - height,
    width: composer.width - composer.margin * 2,
    height,
    color: options?.fill || rgb(1, 1, 1),
    borderColor: options?.border || composer.theme.accent,
    borderWidth: 1,
  });
}

function drawMetaCard(
  composer: PdfComposer,
  items: Array<{ label: string; value: string }>,
) {
  const width = composer.width - composer.margin * 2;
  const paddingX = 18;
  const paddingTop = 18;
  const rowGap = 12;
  const colGap = 16;
  const titleGap = 16;
  const labelFontSize = 9;
  const valueFontSize = 11;
  const valueLineHeight = 15;
  const titleHeight = 14;
  const columnWidth = (width - paddingX * 2 - colGap) / 2;
  const rows: Array<
    Array<{
      label: string;
      value: string;
      valueLines: string[];
      cellHeight: number;
    }>
  > = [];

  for (let index = 0; index < items.length; index += 2) {
    rows.push(
      items.slice(index, index + 2).map((item) => {
        const valueLines = wrapText(
          item.value || "Not available",
          composer.regular,
          valueFontSize,
          columnWidth,
        );
        const valueHeight = measureWrappedLines(valueLines, valueLineHeight);
        return {
          ...item,
          valueLines,
          cellHeight: 12 + 4 + valueHeight,
        };
      }),
    );
  }

  const rowHeights = rows.map((row) =>
    Math.max(...row.map((item) => item.cellHeight)),
  );
  const contentHeight =
    rowHeights.reduce((sum, height) => sum + height, 0) +
    Math.max(0, rows.length - 1) * rowGap;
  const totalHeight = paddingTop + titleHeight + titleGap + contentHeight + 18;
  const next = ensureSpace(composer, totalHeight + 10);
  const top = next.y;
  drawPanel(next, top, totalHeight, {
    fill: next.theme.surface,
    border: next.theme.accent,
  });

  next.page.drawText("Report details", {
    x: next.margin + paddingX,
    y: top - paddingTop,
    size: 10.5,
    font: next.bold,
    color: next.theme.heading,
  });

  let cursorY = top - paddingTop - titleGap;
  rows.forEach((row, rowIndex) => {
    const rowHeight = rowHeights[rowIndex] || 0;
    row.forEach((item, columnIndex) => {
      const columnX =
        next.margin + paddingX + columnIndex * (columnWidth + colGap);

      next.page.drawText(item.label.toUpperCase(), {
        x: columnX,
        y: cursorY,
        size: labelFontSize,
        font: next.bold,
        color: next.theme.muted,
      });

      drawPreparedLines(next, item.valueLines, {
        x: columnX,
        y: cursorY - 16,
        font: next.regular,
        fontSize: valueFontSize,
        lineHeight: valueLineHeight,
        color: next.theme.body,
      });
    });

    if (rowIndex < rows.length - 1) {
      next.page.drawLine({
        start: { x: next.margin + paddingX, y: cursorY - rowHeight - 6 },
        end: { x: next.margin + width - paddingX, y: cursorY - rowHeight - 6 },
        thickness: 1,
        color: next.theme.accent,
      });
    }

    cursorY -= rowHeight + rowGap;
  });

  next.y = top - totalHeight - 8;
  return next;
}

function drawInfoCard(
  composer: PdfComposer,
  title: string,
  body: string,
  options?: {
    fill?: ReturnType<typeof rgb>;
    border?: ReturnType<typeof rgb>;
  },
) {
  const width = composer.width - composer.margin * 2 - 32;
  const bodyLines = wrapText(body, composer.regular, 11, width);
  const titleHeight = 14;
  const bodyHeight = measureWrappedLines(bodyLines, 16);
  const totalHeight = 18 + titleHeight + 10 + bodyHeight + 16;
  const next = ensureSpace(composer, totalHeight + 10);
  const top = next.y;

  drawPanel(next, top, totalHeight, {
    fill: options?.fill || next.theme.surface,
    border: options?.border || next.theme.accent,
  });

  next.page.drawText(title, {
    x: next.margin + 16,
    y: top - 18,
    size: 11,
    font: next.bold,
    color: next.theme.heading,
  });

  drawPreparedLines(next, bodyLines, {
    x: next.margin + 16,
    y: top - 38,
    font: next.regular,
    fontSize: 11,
    lineHeight: 16,
    color: next.theme.body,
  });

  next.y = top - totalHeight - 8;
  return next;
}

function drawSummaryCard(
  composer: PdfComposer,
  title: string,
  lines: string[],
) {
  const width = composer.width - composer.margin * 2 - 28;
  const lineHeight = 15;
  const prepared = lines.map((line) =>
    wrapText(line, composer.regular, 10.75, width),
  );
  const contentHeight = prepared.reduce(
    (sum, linesForItem) => sum + measureWrappedLines(linesForItem, lineHeight),
    0,
  );
  const totalHeight = 18 + 14 + 12 + contentHeight + 16;
  const next = ensureSpace(composer, totalHeight + 10);
  const top = next.y;

  drawPanel(next, top, totalHeight, {
    fill: next.theme.surface,
    border: next.theme.accent,
  });

  next.page.drawText(title, {
    x: next.margin + 14,
    y: top - 18,
    size: 11.5,
    font: next.bold,
    color: next.theme.heading,
  });

  let cursor = top - 40;
  prepared.forEach((itemLines) => {
    cursor = drawPreparedLines(next, itemLines, {
      x: next.margin + 14,
      y: cursor,
      font: next.regular,
      fontSize: 10.75,
      lineHeight,
      color: next.theme.body,
    });
    cursor -= 4;
  });

  next.y = top - totalHeight - 8;
  return next;
}

function drawEvidenceSummaryCard(
  composer: PdfComposer,
  items: CleanReportPdfEvidenceItem[],
) {
  const width = composer.width - composer.margin * 2 - 28;
  const titleHeight = 14;
  const rowHeight = 14;
  const itemLines = items.map((item, index) => {
    const learningArea = safe(item.learningArea);
    const meta = [formatDateLabel(item.observedOn), learningArea]
      .filter(Boolean)
      .join(" | ");

    return wrapText(
      `${index + 1}. ${item.title}${meta ? ` (${meta})` : ""}`,
      composer.regular,
      10.5,
      width,
    );
  });
  const contentHeight = itemLines.reduce(
    (sum, lines) => sum + measureWrappedLines(lines, rowHeight) + 3,
    0,
  );
  const totalHeight = 18 + titleHeight + 12 + contentHeight + 16;
  const next = ensureSpace(composer, totalHeight + 10);
  const top = next.y;

  drawPanel(next, top, totalHeight, {
    fill: rgb(1, 1, 1),
    border: next.theme.accent,
  });

  next.page.drawText("Evidence summary", {
    x: next.margin + 14,
    y: top - 18,
    size: 11.5,
    font: next.bold,
    color: next.theme.heading,
  });

  let cursor = top - 40;
  itemLines.forEach((lines, index) => {
    cursor = drawPreparedLines(next, lines, {
      x: next.margin + 14,
      y: cursor,
      font: next.regular,
      fontSize: 10.5,
      lineHeight: rowHeight,
      color: next.theme.body,
    });

    if (index < itemLines.length - 1) {
      cursor -= 3;
    }
  });

  next.y = top - totalHeight - 8;
  return next;
}

function drawReportSectionCard(
  composer: PdfComposer,
  section: CleanReportSection,
) {
  const width = composer.width - composer.margin * 2 - 28;
  const sectionLabel = `Section ${section.sortOrder}`;
  const headingLines = wrapText(
    section.heading || "Untitled section",
    composer.bold,
    14,
    width,
  );
  const bodyLines = wrapText(
    normalizeText(section.content) || "No section content yet.",
    composer.regular,
    11,
    width,
  );
  const totalHeight =
    18 +
    11 +
    10 +
    measureWrappedLines(headingLines, 18) +
    10 +
    measureWrappedLines(bodyLines, 16) +
    18;
  const next = ensureSpace(composer, totalHeight + 10);
  const top = next.y;

  drawPanel(next, top, totalHeight, {
    fill: rgb(1, 1, 1),
    border: next.theme.accent,
  });

  next.page.drawText(sectionLabel, {
    x: next.margin + 14,
    y: top - 18,
    size: 9.5,
    font: next.bold,
    color: next.theme.muted,
  });

  const afterHeading = drawPreparedLines(next, headingLines, {
    x: next.margin + 14,
    y: top - 38,
    font: next.bold,
    fontSize: 14,
    lineHeight: 18,
    color: next.theme.heading,
  });

  drawPreparedLines(next, bodyLines, {
    x: next.margin + 14,
    y: afterHeading - 8,
    font: next.regular,
    fontSize: 11,
    lineHeight: 16,
    color: next.theme.body,
  });

  next.y = top - totalHeight - 8;
  return next;
}

function drawEvidenceDetailCard(
  composer: PdfComposer,
  item: CleanReportPdfEvidenceItem,
  index: number,
) {
  const width = composer.width - composer.margin * 2 - 28;
  const titleLines = wrapText(
    `${index + 1}. ${item.title}`,
    composer.bold,
    13,
    width,
  );
  const detailRows = [
    ["Observed", formatDateLabel(item.observedOn)],
    ["Learner", item.learnerLabel || "Unknown learner"],
    ["Learning area", item.learningArea || "Not recorded"],
    ["Program", item.programTitle || "Not linked"],
    ["Week / segment", item.segmentTitle || "Not linked"],
    ["Block", item.blockTitle || "Not linked"],
    ["What happened", item.whatHappened],
    ["Reflection / next step", item.reflection || "Not recorded"],
  ] as const;
  const optionalRows = item.portfolioNote
    ? ([["Portfolio note", item.portfolioNote]] as const)
    : [];
  const rows = [...detailRows, ...optionalRows];
  const preparedRows = rows.map(([label, value]) => ({
    label,
    lines: wrapText(value, composer.regular, 10.5, width),
  }));
  const rowsHeight = preparedRows.reduce(
    (sum, row) => sum + 12 + 4 + measureWrappedLines(row.lines, 14) + 6,
    0,
  );
  const totalHeight =
    18 +
    measureWrappedLines(titleLines, 17) +
    12 +
    rowsHeight +
    12;
  const next = ensureSpace(composer, totalHeight + 10);
  const top = next.y;

  drawPanel(next, top, totalHeight, {
    fill: next.theme.surface,
    border: next.theme.accent,
  });

  let cursor = drawPreparedLines(next, titleLines, {
    x: next.margin + 14,
    y: top - 18,
    font: next.bold,
    fontSize: 13,
    lineHeight: 17,
    color: next.theme.heading,
  });

  cursor -= 4;
  preparedRows.forEach((row) => {
    next.page.drawText(`${row.label}:`, {
      x: next.margin + 14,
      y: cursor,
      size: 9.75,
      font: next.bold,
      color: next.theme.muted,
    });
    cursor = drawPreparedLines(next, row.lines, {
      x: next.margin + 14,
      y: cursor - 14,
      font: next.regular,
      fontSize: 10.5,
      lineHeight: 14,
      color: next.theme.body,
    });
    cursor -= 6;
  });

  next.y = top - totalHeight - 8;
  return next;
}

function addFooter(doc: PDFDocument, regular: PDFFont, theme: PdfTheme) {
  const pageCount = doc.getPageCount();
  doc.getPages().forEach((page, index) => {
    page.drawLine({
      start: { x: 46, y: 42 },
      end: { x: page.getWidth() - 46, y: 42 },
      thickness: 1,
      color: theme.accent,
    });
    page.drawText(DISCLAIMER_TEXT, {
      x: 46,
      y: 28,
      size: 8.5,
      font: regular,
      color: theme.muted,
      maxWidth: page.getWidth() - 130,
    });
    page.drawText(`Page ${index + 1} of ${pageCount}`, {
      x: page.getWidth() - 100,
      y: 28,
      size: 8.5,
      font: regular,
      color: theme.muted,
    });
  });
}

export function buildCleanReportPdfFilename(
  learnerLabel: string | null | undefined,
  reportingPeriodTitle: string | null | undefined,
) {
  const learnerPart = sanitizeFilePart(learnerLabel || "", "Learner");
  const periodPart = sanitizeFilePart(reportingPeriodTitle || "", "Report");
  return `MyLearna-Report-${learnerPart}-${periodPart}.pdf`;
}

export async function generateCleanReportPdfBytes(model: CleanReportPdfModel) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const learningAreas = Array.from(
    new Set(
      model.evidenceItems
        .map((item) => safe(item.learningArea))
        .filter(Boolean),
    ),
  );
  const theme: PdfTheme = {
    title: rgb(0.06, 0.11, 0.2),
    heading: rgb(0.1, 0.19, 0.36),
    body: rgb(0.2, 0.24, 0.31),
    muted: rgb(0.39, 0.45, 0.54),
    accent: rgb(0.82, 0.86, 0.92),
    surface: rgb(0.96, 0.98, 1),
  };

  let composer = createComposer(doc, regular, bold, theme);

  composer = drawTextBlock(composer, "MyLearna", {
    font: bold,
    fontSize: 12,
    color: theme.heading,
    lineHeight: 14,
    spacingAfter: 6,
  });
  composer = drawHeading(composer, "MyLearna Learning Record", 1);
  composer = drawTextBlock(
    composer,
    "Prepared as a family learning record to support home education reporting.",
    {
      fontSize: 11.5,
      lineHeight: 16,
      spacingAfter: 12,
    },
  );
  composer = drawMetaCard(composer, [
    { label: "Learner", value: model.learnerLabel },
    {
      label: "Reporting period",
      value: model.reportingPeriod?.title || "Unassigned",
    },
    { label: "Dates", value: formatDateRange(model.reportingPeriod) },
    { label: "Prepared on", value: model.preparedOnLabel },
    { label: "Status", value: model.statusLabel },
    { label: "Report title", value: model.report.title || "Untitled report" },
  ]);
  composer = drawInfoCard(
    composer,
    "Overview",
    "This report brings together the selected portfolio evidence and written sections for the reporting period.",
    {
      fill: rgb(0.98, 0.99, 1),
      border: theme.accent,
    },
  );
  composer = drawDivider(composer);

  composer = drawHeading(composer, "Summary", 2);
  composer = drawSummaryCard(composer, "Reporting snapshot", [
    `Portfolio evidence: ${model.evidenceItems.length}`,
    `Report sections: ${model.sections.length}`,
    `Report title: ${model.report.title}`,
    `Learning areas: ${learningAreas.length ? learningAreas.join(", ") : "Not recorded"}`,
  ]);

  composer = drawHeading(composer, "Evidence summary", 2);
  if (model.evidenceItems.length) {
    composer = drawEvidenceSummaryCard(composer, model.evidenceItems);
  } else {
    composer = drawTextBlock(
      composer,
      "No selected portfolio evidence is attached to this report yet.",
      {
        fontSize: 10.5,
        lineHeight: 14,
      },
    );
  }

  composer = drawHeading(composer, "Report sections", 2);
  if (model.sections.length) {
    model.sections
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .forEach((section) => {
        composer = drawReportSectionCard(composer, section);
      });
  } else {
    composer = drawTextBlock(composer, "No report sections have been saved yet.", {
      fontSize: 10.5,
      lineHeight: 14,
    });
  }

  composer = drawHeading(composer, "Selected evidence details", 2);
  composer = drawTextBlock(
    composer,
    "These evidence notes sit alongside the written report sections and show the source records selected for this period.",
    {
      fontSize: 10.75,
      lineHeight: 15,
      spacingAfter: 8,
      color: theme.muted,
    },
  );
  if (model.evidenceItems.length) {
    model.evidenceItems.forEach((item, index) => {
      composer = drawEvidenceDetailCard(composer, item, index);
    });
  } else {
    composer = drawTextBlock(
      composer,
      "No selected evidence details are available for this report yet.",
      {
        fontSize: 10.5,
        lineHeight: 14,
      },
    );
  }

  addFooter(doc, regular, theme);
  return doc.save();
}
