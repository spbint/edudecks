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

function drawMetaRow(composer: PdfComposer, label: string, value: string) {
  return drawTextBlock(composer, `${label}: ${value || "Not available"}`, {
    fontSize: 10.5,
    lineHeight: 14,
    spacingAfter: 4,
  });
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

function drawSummaryCard(
  composer: PdfComposer,
  title: string,
  lines: string[],
) {
  const width = composer.width - composer.margin * 2;
  const fontSize = 10.5;
  const lineHeight = 14;
  const totalHeight = 20 + 18 + lines.length * lineHeight + 10;
  const next = ensureSpace(composer, totalHeight + 12);
  const top = next.y;
  const boxHeight = totalHeight;

  next.page.drawRectangle({
    x: next.margin,
    y: top - boxHeight + 4,
    width,
    height: boxHeight,
    color: next.theme.surface,
    borderColor: next.theme.accent,
    borderWidth: 1,
  });

  next.page.drawText(title, {
    x: next.margin + 14,
    y: top - 16,
    size: 11.5,
    font: next.bold,
    color: next.theme.heading,
  });

  let cursor = top - 34;
  lines.forEach((line) => {
    next.page.drawText(line, {
      x: next.margin + 14,
      y: cursor,
      size: fontSize,
      font: next.regular,
      color: next.theme.body,
    });
    cursor -= lineHeight;
  });

  next.y = top - boxHeight - 8;
  return next;
}

function drawEvidenceMeta(composer: PdfComposer, item: CleanReportPdfEvidenceItem) {
  const metaLines = [
    `Observed: ${formatDateLabel(item.observedOn)}`,
    `Learner: ${item.learnerLabel || "Unknown learner"}`,
    item.learningArea ? `Learning area: ${item.learningArea}` : "",
    item.programTitle ? `Program: ${item.programTitle}` : "",
    item.segmentTitle ? `Week / segment: ${item.segmentTitle}` : "",
    item.blockTitle ? `Block: ${item.blockTitle}` : "",
  ].filter(Boolean);

  let next = composer;
  metaLines.forEach((line) => {
    next = drawTextBlock(next, line, {
      fontSize: 10.25,
      lineHeight: 14,
      color: next.theme.muted,
      spacingAfter: 2,
    });
  });
  next.y += 2;
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

  composer = drawMetaRow(composer, "Learner", model.learnerLabel);
  composer = drawMetaRow(composer, "Reporting period", model.reportingPeriod?.title || "Unassigned");
  composer = drawMetaRow(composer, "Dates", formatDateRange(model.reportingPeriod));
  composer = drawMetaRow(composer, "Prepared on", model.preparedOnLabel);
  composer = drawMetaRow(composer, "Report status", model.statusLabel);
  composer = drawDivider(composer);

  composer = drawSummaryCard(composer, "Summary", [
    `Portfolio evidence: ${model.evidenceItems.length}`,
    `Report sections: ${model.sections.length}`,
    `Report title: ${model.report.title}`,
  ]);

  composer = drawHeading(composer, "Evidence summary", 2);
  if (model.evidenceItems.length) {
    model.evidenceItems.forEach((item, index) => {
      const summaryBits = [
        formatDateLabel(item.observedOn),
        item.learningArea || "",
      ].filter(Boolean);
      composer = drawTextBlock(
        composer,
        `${index + 1}. ${item.title}${summaryBits.length ? ` (${summaryBits.join(" | ")})` : ""}`,
        {
          fontSize: 10.5,
          lineHeight: 14,
          spacingAfter: 4,
        },
      );
    });
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
        composer = drawHeading(composer, section.heading || "Untitled section", 3);
        composer = drawTextBlock(
          composer,
          normalizeText(section.content) || "No section content yet.",
          {
            fontSize: 11,
            lineHeight: 16,
            spacingAfter: 8,
          },
        );
      });
  } else {
    composer = drawTextBlock(composer, "No report sections have been saved yet.", {
      fontSize: 10.5,
      lineHeight: 14,
    });
  }

  composer = drawHeading(composer, "Selected evidence details", 2);
  if (model.evidenceItems.length) {
    model.evidenceItems.forEach((item, index) => {
      composer = drawHeading(composer, `${index + 1}. ${item.title}`, 3);
      composer = drawEvidenceMeta(composer, item);
      composer = drawTextBlock(composer, `What happened: ${item.whatHappened}`, {
        fontSize: 10.75,
        lineHeight: 15,
        spacingAfter: 6,
      });

      if (item.reflection) {
        composer = drawTextBlock(composer, `Reflection / next step: ${item.reflection}`, {
          fontSize: 10.75,
          lineHeight: 15,
          spacingAfter: 6,
        });
      }

      if (item.portfolioNote) {
        composer = drawTextBlock(composer, `Portfolio note: ${item.portfolioNote}`, {
          fontSize: 10.75,
          lineHeight: 15,
          spacingAfter: 6,
        });
      }
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
