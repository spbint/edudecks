import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { buildPortfolioContentModel } from "@/lib/portfolioContent";
import type { ReportExportModel } from "@/lib/reportExport";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function stripHtml(value: string) {
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

function sanitizeFilename(title: string) {
  return safe(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type PdfTheme = {
  titleColor: ReturnType<typeof rgb>;
  headingColor: ReturnType<typeof rgb>;
  bodyColor: ReturnType<typeof rgb>;
  accentColor: ReturnType<typeof rgb>;
};

type PdfComposer = {
  doc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
  margin: number;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
  theme: PdfTheme;
};

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const paragraphs = stripHtml(text).split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const lines: string[] = [];

  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth || !current) {
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
    margin: 48,
    y: page.getHeight() - 56,
    regular,
    bold,
    theme,
  };
}

function ensureSpace(composer: PdfComposer, needed: number) {
  if (composer.y - needed > composer.margin) {
    return composer;
  }

  const page = composer.doc.addPage([composer.width, composer.height]);
  return {
    ...composer,
    page,
    y: composer.height - 56,
  };
}

function drawRule(composer: PdfComposer) {
  composer.page.drawLine({
    start: { x: composer.margin, y: composer.y },
    end: { x: composer.width - composer.margin, y: composer.y },
    thickness: 1,
    color: composer.theme.accentColor,
  });
  composer.y -= 12;
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
  const color = options?.color || composer.theme.bodyColor;
  const spacingAfter = options?.spacingAfter ?? 10;
  const maxWidth = composer.width - composer.margin * 2;
  const lines = wrapText(text, font, fontSize, maxWidth);
  let next = ensureSpace(composer, lines.length * lineHeight + spacingAfter);

  lines.forEach((line) => {
    if (!line) {
      next.y -= lineHeight * 0.6;
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

function drawHeading(
  composer: PdfComposer,
  text: string,
  level: 1 | 2 | 3 = 1,
) {
  const fontSize = level === 1 ? 20 : level === 2 ? 15 : 12;
  const spacingBefore = level === 1 ? 18 : 14;
  let next = ensureSpace(composer, fontSize + spacingBefore + 18);
  next.y -= spacingBefore;
  next.page.drawText(text, {
    x: next.margin,
    y: next.y,
    size: fontSize,
    font: next.bold,
    color: level === 1 ? next.theme.titleColor : next.theme.headingColor,
  });
  next.y -= fontSize + 6;
  return next;
}

function drawMetaRow(composer: PdfComposer, label: string, value: string) {
  const line = `${label}: ${value || "Not available"}`;
  return drawTextBlock(composer, line, {
    font: composer.regular,
    fontSize: 10.5,
    lineHeight: 14,
    color: composer.theme.bodyColor,
    spacingAfter: 4,
  });
}

function localizedPortfolioTerm(
  model: ReportExportModel,
  values: { us: string; au: string; fallback?: string },
) {
  const locale = safe(model.localeCode).toLowerCase();
  const jurisdiction = safe(model.jurisdictionCode).toLowerCase();
  if (locale.includes("en-us") || jurisdiction.startsWith("us-")) return values.us;
  if (locale.includes("en-au") || jurisdiction.startsWith("au-")) return values.au;
  return values.fallback || values.au;
}

async function buildAuthorityPdf(model: ReportExportModel) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let composer = createComposer(doc, regular, bold, {
    titleColor: rgb(0.1, 0.16, 0.28),
    headingColor: rgb(0.12, 0.2, 0.36),
    bodyColor: rgb(0.2, 0.24, 0.31),
    accentColor: rgb(0.83, 0.87, 0.92),
  });

  composer = drawHeading(composer, model.reportTitle || "Authority Report", 1);
  composer = drawMetaRow(composer, "Learner", model.learnerName);
  composer = drawMetaRow(
    composer,
    "Jurisdiction",
    model.jurisdictionName || model.jurisdictionCode || "Not resolved",
  );
  composer = drawMetaRow(
    composer,
    "Reporting period",
    model.reportingPeriodLabel || "Not available",
  );
  drawRule(composer);

  model.sections.forEach((section) => {
    composer = drawHeading(composer, section.title, 2);
    composer = drawTextBlock(
      composer,
      stripHtml(section.contentHtml) || "No persisted section content was available.",
      { spacingAfter: 10 },
    );
  });

  return doc.save();
}

async function buildPortfolioPdf(model: ReportExportModel) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let composer = createComposer(doc, regular, bold, {
    titleColor: rgb(0.34, 0.21, 0.14),
    headingColor: rgb(0.48, 0.29, 0.18),
    bodyColor: rgb(0.33, 0.28, 0.24),
    accentColor: rgb(0.91, 0.84, 0.76),
  });

  const skillsLabel = localizedPortfolioTerm(model, {
    us: "Skills Practiced",
    au: "Skills Practised",
  });

  const portfolioContent = buildPortfolioContentModel({
    sections: model.sections.map((section) => ({
      id: section.sectionKey || section.title,
      section_key: section.sectionKey,
      title: section.title,
      contentHtml: section.contentHtml,
      learnerId: model.learnerId,
      reportDocumentId: model.reportDocumentId,
    })),
    packItems: model.packItems.map((item, index) => ({
      id: `pack-${index + 1}`,
      label: item.label,
      note: item.note,
      learnerId: model.learnerId,
      reportDocumentId: model.reportDocumentId,
    })),
    localeCode: model.localeCode,
  });

  composer = drawHeading(composer, "Learning Portfolio", 1);
  composer = drawTextBlock(composer, model.learnerName, {
    font: bold,
    fontSize: 14,
    color: composer.theme.headingColor,
    spacingAfter: 8,
  });
  composer = drawMetaRow(
    composer,
    "Reporting period",
    model.reportingPeriodLabel || "Current learning record",
  );
  composer = drawTextBlock(
    composer,
    "A record of learning, growth, projects, and reflections.",
    {
      font: regular,
      fontSize: 11,
      spacingAfter: 12,
    },
  );
  drawRule(composer);

  if (portfolioContent.highlights.length) {
    composer = drawHeading(composer, "Learning Highlights", 2);
    portfolioContent.highlights.forEach((item) => {
      composer = drawHeading(composer, item.title, 3);
      composer = drawTextBlock(composer, item.description || "Saved learning highlight.");
    });
  }

  if (portfolioContent.workSamples.length) {
    composer = drawHeading(composer, "Projects and Work Samples", 2);
    portfolioContent.workSamples.forEach((item) => {
      composer = drawHeading(composer, item.title, 3);
      if (item.subjectLabel) {
        composer = drawMetaRow(composer, "Subject", item.subjectLabel);
      }
      composer = drawTextBlock(
        composer,
        item.description || "Saved work sample from the portfolio record.",
      );
    });
  }

  if (portfolioContent.skills.length) {
    composer = drawHeading(composer, skillsLabel, 2);
    portfolioContent.skills.forEach((item) => {
      composer = drawTextBlock(composer, `${item.label} (${item.count})`, {
        spacingAfter: 4,
      });
    });
  }

  if (portfolioContent.reflections.length) {
    composer = drawHeading(composer, "Reflections", 2);
    portfolioContent.reflections.forEach((item) => {
      composer = drawTextBlock(composer, `• ${item.prompt}`, {
        spacingAfter: 4,
      });
    });
  }

  composer = drawHeading(composer, "Saved Portfolio Sections", 2);
  model.sections.forEach((section) => {
    composer = drawHeading(composer, section.title, 3);
    composer = drawTextBlock(
      composer,
      stripHtml(section.contentHtml) || "No persisted section content was available.",
    );
  });

  return doc.save();
}

export async function generateReportPdfBuffer(model: ReportExportModel) {
  return model.reportIntent === "portfolio"
    ? buildPortfolioPdf(model)
    : buildAuthorityPdf(model);
}

export function buildPdfFilename(model: ReportExportModel) {
  const clean = sanitizeFilename(model.reportTitle);
  return `${clean || "report-export"}.pdf`;
}
