import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
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
const LOGO_PATH = "/branding/mylearna-logo.png";

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

function buildEvidenceMetaLine(item: CleanReportPdfEvidenceItem) {
  return [
    item.observedOn ? formatDateLabel(item.observedOn) : "",
    safe(item.learningArea),
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildEvidenceContextLine(item: CleanReportPdfEvidenceItem) {
  const parts = [
    safe(item.programTitle) ? `Program: ${safe(item.programTitle)}` : "",
    safe(item.segmentTitle) ? `Week / segment: ${safe(item.segmentTitle)}` : "",
    safe(item.blockTitle) ? `Block: ${safe(item.blockTitle)}` : "",
  ].filter(Boolean);

  return parts.join(" | ");
}

async function loadSafeLogoImage(doc: PDFDocument) {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch(LOGO_PATH, { cache: "force-cache" });
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    return await doc.embedPng(bytes);
  } catch {
    return null;
  }
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

function startNewPage(composer: PdfComposer) {
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

function drawCenteredTextBlock(
  composer: PdfComposer,
  text: string,
  options?: {
    font?: PDFFont;
    fontSize?: number;
    lineHeight?: number;
    color?: ReturnType<typeof rgb>;
    spacingAfter?: number;
    maxWidth?: number;
  },
) {
  const font = options?.font || composer.regular;
  const fontSize = options?.fontSize || 11;
  const lineHeight = options?.lineHeight || fontSize + 4;
  const color = options?.color || composer.theme.body;
  const spacingAfter = options?.spacingAfter ?? 10;
  const maxWidth =
    options?.maxWidth || composer.width - composer.margin * 2;
  const lines = wrapText(text, font, fontSize, maxWidth);
  const next = ensureSpace(composer, lines.length * lineHeight + spacingAfter);

  lines.forEach((line) => {
    if (!line) {
      next.y -= lineHeight * 0.5;
      return;
    }

    const textWidth = font.widthOfTextAtSize(line, fontSize);
    next.page.drawText(line, {
      x: (next.width - textWidth) / 2,
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

function drawHeading(
  composer: PdfComposer,
  text: string,
  level: 1 | 2 | 3 = 1,
  options?: { minFollowingSpace?: number },
) {
  const fontSize = level === 1 ? 22 : level === 2 ? 16 : 13;
  const spacingBefore = level === 1 ? 16 : 12;
  const next = ensureSpace(
    composer,
    fontSize + spacingBefore + 14 + (options?.minFollowingSpace ?? 0),
  );
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

function drawCenteredRule(composer: PdfComposer, width = 120) {
  const next = ensureSpace(composer, 16);
  const startX = (next.width - width) / 2;
  next.page.drawLine({
    start: { x: startX, y: next.y },
    end: { x: startX + width, y: next.y },
    thickness: 1,
    color: next.theme.accent,
  });
  next.y -= 14;
  return next;
}

function drawHeaderLogo(
  composer: PdfComposer,
  logo: PDFImage | null,
) {
  if (!logo) return composer;

  const next = ensureSpace(composer, 78);
  const targetWidth = 138;
  const scale = targetWidth / logo.width;
  const logoWidth = targetWidth;
  const logoHeight = logo.height * scale;
  next.page.drawImage(logo, {
    x: (next.width - logoWidth) / 2,
    y: next.y - logoHeight,
    width: logoWidth,
    height: logoHeight,
  });
  next.y -= logoHeight + 12;
  return next;
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

  next.page.drawText("At a glance", {
    x: next.margin + paddingX,
    y: top - paddingTop,
    size: 11,
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
  const itemPrepared = items.map((item, index) => {
    const titleLines = wrapText(
      `${index + 1}. ${item.title}`,
      composer.bold,
      11.5,
      width,
    );
    const meta = buildEvidenceMetaLine(item);
    const metaLines = meta
      ? wrapText(meta, composer.regular, 9.75, width)
      : [];
    return { titleLines, metaLines };
  });
  const contentHeight = itemPrepared.reduce((sum, item) => {
    const titleHeightUsed = measureWrappedLines(item.titleLines, 15);
    const metaHeightUsed = item.metaLines.length
      ? measureWrappedLines(item.metaLines, 13) + 2
      : 0;
    return sum + titleHeightUsed + metaHeightUsed + 10;
  }, 0);
  const totalHeight = 18 + titleHeight + 12 + contentHeight + 16;
  const next = ensureSpace(composer, totalHeight + 10);
  const top = next.y;

  drawPanel(next, top, totalHeight, {
    fill: next.theme.surface,
    border: next.theme.accent,
  });

  next.page.drawText("Selected evidence in this record", {
    x: next.margin + 14,
    y: top - 18,
    size: 11.5,
    font: next.bold,
    color: next.theme.heading,
  });

  let cursor = top - 40;
  itemPrepared.forEach((item, index) => {
    cursor = drawPreparedLines(next, item.titleLines, {
      x: next.margin + 14,
      y: cursor,
      font: next.bold,
      fontSize: 11.5,
      lineHeight: 15,
      color: next.theme.heading,
    });

    if (item.metaLines.length) {
      cursor = drawPreparedLines(next, item.metaLines, {
        x: next.margin + 14,
        y: cursor,
        font: next.regular,
        fontSize: 9.75,
        lineHeight: 13,
        color: next.theme.muted,
      });
      cursor -= 2;
    }

    if (index < itemPrepared.length - 1) {
      next.page.drawLine({
        start: { x: next.margin + 14, y: cursor },
        end: { x: next.width - next.margin - 14, y: cursor },
        thickness: 1,
        color: next.theme.accent,
      });
      cursor -= 10;
    }
  });

  next.y = top - totalHeight - 8;
  return next;
}

function drawReportSectionCard(
  composer: PdfComposer,
  section: CleanReportSection,
) {
  const width = composer.width - composer.margin * 2 - 22;
  const sectionLabel = `Section ${section.sortOrder}`;
  const headingLines = wrapText(
    section.heading || "Untitled section",
    composer.bold,
    15,
    width,
  );
  const bodyLines = wrapText(
    normalizeText(section.content) || "No section content yet.",
    composer.regular,
    11.25,
    width,
  );
  const totalHeight =
    12 +
    11 +
    12 +
    measureWrappedLines(headingLines, 19) +
    12 +
    measureWrappedLines(bodyLines, 17) +
    16;
  let next = ensureSpace(composer, totalHeight + 10);
  const top = next.y;

  next.page.drawRectangle({
    x: next.margin,
    y: top - totalHeight + 6,
    width: 3,
    height: totalHeight - 12,
    color: rgb(0.76, 0.84, 0.96),
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
    y: top - 42,
    font: next.bold,
    fontSize: 15,
    lineHeight: 19,
    color: next.theme.heading,
  });

  drawPreparedLines(next, bodyLines, {
    x: next.margin + 14,
    y: afterHeading - 8,
    font: next.regular,
    fontSize: 11.25,
    lineHeight: 17,
    color: next.theme.body,
  });

  next.y = top - totalHeight - 2;
  next = drawDivider(next);
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
  const metaLine = [
    item.observedOn ? `Observed ${formatDateLabel(item.observedOn)}` : "",
    item.learnerLabel ? `Learner ${item.learnerLabel}` : "",
    safe(item.learningArea) ? `Learning area ${safe(item.learningArea)}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  const contextLine = buildEvidenceContextLine(item);
  const metaLines = metaLine
    ? wrapText(metaLine, composer.regular, 10, width)
    : [];
  const contextLines = contextLine
    ? wrapText(contextLine, composer.regular, 9.5, width)
    : [];
  const narrativeBlocks = [
    {
      label: "What happened",
      lines: wrapText(normalizeText(item.whatHappened), composer.regular, 10.75, width),
    },
    ...(normalizeText(item.reflection)
      ? [
          {
            label: "Reflection",
            lines: wrapText(normalizeText(item.reflection), composer.regular, 10.75, width),
          },
        ]
      : []),
    ...(normalizeText(item.portfolioNote)
      ? [
          {
            label: "Portfolio note",
            lines: wrapText(normalizeText(item.portfolioNote), composer.regular, 10.75, width),
          },
        ]
      : []),
  ];
  const narrativeHeight = narrativeBlocks.reduce(
    (sum, block) => sum + 11 + 6 + measureWrappedLines(block.lines, 15) + 10,
    0,
  );
  const totalHeight =
    18 +
    measureWrappedLines(titleLines, 17) +
    10 +
    (metaLines.length ? measureWrappedLines(metaLines, 13) + 6 : 0) +
    (contextLines.length ? measureWrappedLines(contextLines, 12) + 8 : 0) +
    narrativeHeight +
    10;
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

  if (metaLines.length) {
    cursor = drawPreparedLines(next, metaLines, {
      x: next.margin + 14,
      y: cursor,
      font: next.regular,
      fontSize: 10,
      lineHeight: 13,
      color: next.theme.muted,
    });
    cursor -= 4;
  }

  if (contextLines.length) {
    cursor = drawPreparedLines(next, contextLines, {
      x: next.margin + 14,
      y: cursor,
      font: next.regular,
      fontSize: 9.5,
      lineHeight: 12,
      color: next.theme.muted,
    });
    cursor -= 8;
  }

  narrativeBlocks.forEach((block, blockIndex) => {
    next.page.drawText(block.label.toUpperCase(), {
      x: next.margin + 14,
      y: cursor,
      size: 9.25,
      font: next.bold,
      color: next.theme.muted,
    });
    cursor = drawPreparedLines(next, block.lines, {
      x: next.margin + 14,
      y: cursor - 16,
      font: next.regular,
      fontSize: 10.75,
      lineHeight: 15,
      color: next.theme.body,
    });
    if (blockIndex < narrativeBlocks.length - 1) {
      cursor -= 8;
      next.page.drawLine({
        start: { x: next.margin + 14, y: cursor },
        end: { x: next.width - next.margin - 14, y: cursor },
        thickness: 1,
        color: next.theme.accent,
      });
      cursor -= 10;
    }
  });

  next.y = top - totalHeight - 8;
  return next;
}

function addFooter(doc: PDFDocument, regular: PDFFont, theme: PdfTheme) {
  const pageCount = doc.getPageCount();
  doc.getPages().forEach((page, index) => {
    page.drawLine({
      start: { x: 46, y: 44 },
      end: { x: page.getWidth() - 46, y: 44 },
      thickness: 0.8,
      color: theme.accent,
    });
    page.drawText(DISCLAIMER_TEXT, {
      x: 46,
      y: 26,
      size: 8.25,
      font: regular,
      color: theme.muted,
      maxWidth: page.getWidth() - 148,
    });
    page.drawText(`Page ${index + 1} of ${pageCount}`, {
      x: page.getWidth() - 92,
      y: 26,
      size: 8.25,
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
  const logo = await loadSafeLogoImage(doc);
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
    accent: rgb(0.85, 0.89, 0.94),
    surface: rgb(0.97, 0.985, 1),
  };
  const overviewText = model.reportingPeriod
    ? `This learning record brings together selected portfolio evidence and written report sections for ${model.learnerLabel} during ${model.reportingPeriod.title}.`
    : `This learning record brings together selected portfolio evidence and written report sections for ${model.learnerLabel}.`;

  let composer = createComposer(doc, regular, bold, theme);

  composer = drawHeaderLogo(composer, logo);
  composer = drawCenteredTextBlock(composer, "MyLearna Learning Record", {
    font: bold,
    fontSize: 25,
    lineHeight: 29,
    color: theme.title,
    spacingAfter: 8,
    maxWidth: 420,
  });
  composer = drawCenteredTextBlock(composer, model.report.title || "Untitled report", {
    font: bold,
    fontSize: 17,
    lineHeight: 21,
    color: theme.heading,
    spacingAfter: 8,
    maxWidth: 430,
  });
  composer = drawCenteredTextBlock(
    composer,
    model.reportingPeriod
      ? `Family learning record for ${model.learnerLabel} covering ${model.reportingPeriod.title}.`
      : `Family learning record for ${model.learnerLabel}.`,
    {
      fontSize: 11.25,
      lineHeight: 16,
      spacingAfter: 6,
      color: theme.heading,
      maxWidth: 420,
    },
  );
  composer = drawCenteredTextBlock(
    composer,
    "Prepared as a calm, practical learning record to support home education reporting and family record keeping.",
    {
      fontSize: 10.75,
      lineHeight: 15,
      spacingAfter: 14,
      color: theme.body,
      maxWidth: 420,
    },
  );
  composer = drawCenteredRule(composer, 136);
  composer = drawMetaCard(composer, [
    { label: "Learner", value: model.learnerLabel },
    {
      label: "Reporting period",
      value: model.reportingPeriod?.title || "Unassigned",
    },
    { label: "Dates", value: formatDateRange(model.reportingPeriod) },
    { label: "Prepared on", value: model.preparedOnLabel },
    { label: "Status", value: model.statusLabel },
  ]);
  composer = drawInfoCard(
    composer,
    "Overview",
    overviewText,
    {
      fill: rgb(0.98, 0.99, 1),
      border: theme.accent,
    },
  );
  composer = drawSummaryCard(composer, "Learning record snapshot", [
    `${model.evidenceItems.length} selected ${model.evidenceItems.length === 1 ? "evidence entry supports" : "evidence entries support"} this learning record.`,
    `${model.sections.length} written ${model.sections.length === 1 ? "section shapes" : "sections shape"} the narrative of the report.`,
    `Learning areas represented: ${learningAreas.length ? learningAreas.join(", ") : "Not recorded"}.`,
  ]);

  composer = startNewPage(composer);
  composer = drawHeading(composer, "Evidence summary", 2, {
    minFollowingSpace: model.evidenceItems.length ? 120 : 40,
  });
  composer = drawTextBlock(
    composer,
    "A quick view of the selected evidence included in this learning record.",
    {
      fontSize: 10.75,
      lineHeight: 15,
      spacingAfter: 8,
      color: theme.muted,
    },
  );
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

  composer = drawHeading(composer, "Report sections", 2, {
    minFollowingSpace: model.sections.length ? 140 : 40,
  });
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

  composer = drawHeading(composer, "Selected evidence details", 2, {
    minFollowingSpace: model.evidenceItems.length ? 180 : 40,
  });
  composer = drawTextBlock(
    composer,
    "These notes show the selected evidence that sits behind the written report and helps trace the learning record back to the source entries.",
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
