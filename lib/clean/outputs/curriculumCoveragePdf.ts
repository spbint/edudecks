import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

import {
  buildCurriculumCoverageSummary,
  type CurriculumCoverageSummary,
} from "@/lib/clean/curriculum/coverageSummary";
import {
  resolveCurriculumFrameworkMap,
  type ResolvedCurriculumFrameworkMap,
} from "@/lib/clean/curriculum/frameworkMaps";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { FamilyProfile } from "@/lib/clean/family/types";
import type { Learner } from "@/lib/clean/learners/types";

export const CURRICULUM_COVERAGE_EMPTY_COPY =
  "No curriculum-linked evidence has been captured yet.";

const CURRICULUM_COVERAGE_TITLE = "MyLearna Curriculum Coverage Record";
const CURRICULUM_COVERAGE_PURPOSE_NOTE =
  "This record shows how captured learning evidence is building across curriculum areas and reporting expectations.";
const CURRICULUM_COVERAGE_DISCLAIMER =
  "This record is designed to support family record keeping and reporting preparation. Families should check their local authority, state, or registration requirements before submitting records.";
const CURRICULUM_COVERAGE_FOOTER = "MyLearna — Plan. Capture. Grow.";
const LOGO_PATH = "/branding/mylearna-logo.png";
const NOT_RECORDED_YET = "Not recorded in MyLearna yet.";

export type CurriculumCoveragePdfModel = {
  title: string;
  purposeNote: string;
  disclaimer: string;
  footerLine: string;
  learnerName: string;
  familyName: string;
  frameworkLabel: string;
  countryLabel: string;
  authorityLabel: string;
  generatedOnLabel: string;
  resolvedFramework: ResolvedCurriculumFrameworkMap;
  coverageSummary: CurriculumCoverageSummary;
};

export type BuildCurriculumCoveragePdfModelInput = {
  profile: FamilyProfile;
  learner: Learner;
  entries: CleanEvidenceEntry[];
  generatedOn?: string | null;
};

type PdfTheme = {
  title: ReturnType<typeof rgb>;
  heading: ReturnType<typeof rgb>;
  body: ReturnType<typeof rgb>;
  muted: ReturnType<typeof rgb>;
  accent: ReturnType<typeof rgb>;
  line: ReturnType<typeof rgb>;
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

function summarizeText(value: string | null | undefined, maxLength = 220) {
  const text = normalizeText(value);
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
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
  if (!clean) return NOT_RECORDED_YET;
  const date = new Date(`${clean}T00:00:00`);
  if (Number.isNaN(date.getTime())) return clean;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDisplayName(learner: Learner) {
  const preferred = safe(learner.preferredName);
  const firstName = safe(learner.firstName);
  const surname = safe(learner.surname);
  const givenName = preferred || firstName;

  return surname ? `${givenName} ${surname}` : givenName;
}

function getEvidenceTitle(entry: CleanEvidenceEntry) {
  return safe(entry.title) || summarizeText(entry.whatHappened, 72) || "Learning evidence";
}

function getEvidenceSnippet(entry: CleanEvidenceEntry) {
  return (
    summarizeText(entry.whatHappened, 180) ||
    summarizeText(entry.reflection, 180) ||
    "No short note recorded yet."
  );
}

function getEvidenceItemLabel(count: number) {
  return `${count} evidence ${count === 1 ? "item" : "items"}`;
}

function buildLatestEvidenceLine(entry: CleanEvidenceEntry | null) {
  if (!entry) return "Latest evidence: No evidence linked yet.";
  return `Latest evidence: ${getEvidenceTitle(entry)} - ${formatDateLabel(entry.observedOn)}`;
}

function splitCountryAndAuthorityLabels(model: ResolvedCurriculumFrameworkMap) {
  const countryLabel = safe(model.map.countryLabel) || NOT_RECORDED_YET;
  const countryAuthorityLabel = safe(model.countryAuthorityLabel);

  if (
    !countryAuthorityLabel ||
    countryAuthorityLabel.toLowerCase() === countryLabel.toLowerCase()
  ) {
    return {
      countryLabel,
      authorityLabel: NOT_RECORDED_YET,
    };
  }

  const prefix = `${countryLabel} / `;
  if (countryAuthorityLabel.startsWith(prefix)) {
    return {
      countryLabel,
      authorityLabel: countryAuthorityLabel.slice(prefix.length) || NOT_RECORDED_YET,
    };
  }

  return {
    countryLabel,
    authorityLabel: countryAuthorityLabel,
  };
}

export function buildCurriculumCoveragePdfModel(
  input: BuildCurriculumCoveragePdfModelInput,
): CurriculumCoveragePdfModel {
  const resolvedFramework = resolveCurriculumFrameworkMap(input.profile);
  const coverageSummary = buildCurriculumCoverageSummary({
    resolvedFramework,
    entries: input.entries,
  });
  const learnerName = formatDisplayName(input.learner) || input.learner.firstName || "Learner";
  const { countryLabel, authorityLabel } = splitCountryAndAuthorityLabels(resolvedFramework);

  return {
    title: CURRICULUM_COVERAGE_TITLE,
    purposeNote: CURRICULUM_COVERAGE_PURPOSE_NOTE,
    disclaimer: CURRICULUM_COVERAGE_DISCLAIMER,
    footerLine: CURRICULUM_COVERAGE_FOOTER,
    learnerName,
    familyName: safe(input.profile.displayName) || NOT_RECORDED_YET,
    frameworkLabel: resolvedFramework.frameworkDisplayLabel,
    countryLabel,
    authorityLabel,
    generatedOnLabel: formatDateLabel(
      safe(input.generatedOn) || new Date().toISOString().slice(0, 10),
    ),
    resolvedFramework,
    coverageSummary,
  };
}

export function buildCurriculumCoveragePdfFilename(
  learnerName: string,
  generatedOnLabel: string,
) {
  const learnerPart = sanitizeFilePart(learnerName || "learner", "learner");
  const datePart = sanitizeFilePart(generatedOnLabel || "coverage-record", "coverage-record");
  return `MyLearna-Curriculum-Coverage-Record-${learnerPart}-${datePart}.pdf`;
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
      if (!current || font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
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

function measureWrappedLines(lines: string[], lineHeight: number) {
  return lines.reduce(
    (total, line) => total + (line ? lineHeight : lineHeight * 0.5),
    0,
  );
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
    margin: 44,
    footerSpace: 54,
    y: page.getHeight() - 52,
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
    y: composer.height - 52,
  };
}

function startNewPage(composer: PdfComposer) {
  const page = composer.doc.addPage([composer.width, composer.height]);
  return {
    ...composer,
    page,
    y: composer.height - 52,
  };
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
  const fontSize = options?.fontSize || 10.5;
  const lineHeight = options?.lineHeight || fontSize + 3.5;
  const color = options?.color || composer.theme.body;
  const spacingAfter = options?.spacingAfter ?? 10;
  const maxWidth = composer.width - composer.margin * 2;
  const lines = wrapText(text, font, fontSize, maxWidth);
  const next = ensureSpace(composer, measureWrappedLines(lines, lineHeight) + spacingAfter);

  next.y = drawPreparedLines(next, lines, {
    x: next.margin,
    y: next.y,
    font,
    fontSize,
    lineHeight,
    color,
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
  },
) {
  const font = options?.font || composer.regular;
  const fontSize = options?.fontSize || 10.5;
  const lineHeight = options?.lineHeight || fontSize + 3.5;
  const color = options?.color || composer.theme.body;
  const spacingAfter = options?.spacingAfter ?? 10;
  const maxWidth = composer.width - composer.margin * 2;
  const lines = wrapText(text, font, fontSize, maxWidth);
  const next = ensureSpace(composer, measureWrappedLines(lines, lineHeight) + spacingAfter);

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

function drawHeading(composer: PdfComposer, text: string, level: 1 | 2 | 3 = 1) {
  const fontSize = level === 1 ? 18 : level === 2 ? 13.5 : 11.5;
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
    color: composer.theme.line,
  });
  composer.y -= 14;
  return composer;
}

function drawHeaderLogo(composer: PdfComposer, logo: PDFImage | null) {
  if (!logo) return composer;

  const next = ensureSpace(composer, 80);
  const targetWidth = 138;
  const scale = targetWidth / logo.width;
  const logoHeight = logo.height * scale;
  next.page.drawImage(logo, {
    x: (next.width - targetWidth) / 2,
    y: next.y - logoHeight,
    width: targetWidth,
    height: logoHeight,
  });
  next.y -= logoHeight + 14;
  return next;
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
    borderColor: options?.border || composer.theme.line,
    borderWidth: 1,
  });
}

function drawCard(
  composer: PdfComposer,
  title: string,
  description: string | null,
  lines: string[],
  options?: {
    fill?: ReturnType<typeof rgb>;
    border?: ReturnType<typeof rgb>;
  },
) {
  const innerWidth = composer.width - composer.margin * 2 - 28;
  const titleLines = wrapText(title, composer.bold, 12.5, innerWidth);
  const descriptionLines = description
    ? wrapText(description, composer.regular, 10.25, innerWidth)
    : [];
  const lineGroups = lines.map((line) => wrapText(line, composer.regular, 10.25, innerWidth));
  const titleHeight = measureWrappedLines(titleLines, 16);
  const descriptionHeight = descriptionLines.length
    ? measureWrappedLines(descriptionLines, 14)
    : 0;
  const contentHeight = lineGroups.reduce(
    (sum, group) => sum + measureWrappedLines(group, 14),
    0,
  );
  const groupGap = Math.max(0, lineGroups.length - 1) * 4;
  const totalHeight =
    18 +
    titleHeight +
    (descriptionLines.length ? 8 + descriptionHeight : 0) +
    (lineGroups.length ? 12 + contentHeight + groupGap : 0) +
    16;
  const next = ensureSpace(composer, totalHeight + 8);
  const top = next.y;

  drawPanel(next, top, totalHeight, {
    fill: options?.fill || next.theme.surface,
    border: options?.border || next.theme.line,
  });

  let cursor = drawPreparedLines(next, titleLines, {
    x: next.margin + 14,
    y: top - 18,
    font: next.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: next.theme.heading,
  });

  if (descriptionLines.length) {
    cursor -= 6;
    cursor = drawPreparedLines(next, descriptionLines, {
      x: next.margin + 14,
      y: cursor,
      font: next.regular,
      fontSize: 10.25,
      lineHeight: 14,
      color: next.theme.body,
    });
  }

  if (lineGroups.length) {
    cursor -= 8;
    lineGroups.forEach((group, index) => {
      cursor = drawPreparedLines(next, group, {
        x: next.margin + 14,
        y: cursor,
        font: next.regular,
        fontSize: 10.25,
        lineHeight: 14,
        color: next.theme.body,
      });
      if (index < lineGroups.length - 1) {
        cursor -= 4;
      }
    });
  }

  next.y = top - totalHeight - 8;
  return next;
}

function drawFooter(
  composer: PdfComposer,
  footerLine: string,
  pageIndex: number,
  pageCount: number,
) {
  const footerY = composer.margin - 8;
  composer.page.drawLine({
    start: { x: composer.margin, y: footerY + 16 },
    end: { x: composer.width - composer.margin, y: footerY + 16 },
    thickness: 1,
    color: composer.theme.line,
  });

  composer.page.drawText(footerLine, {
    x: composer.margin,
    y: footerY,
    size: 8,
    font: composer.regular,
    color: composer.theme.muted,
  });

  composer.page.drawText(`${pageIndex + 1} / ${pageCount}`, {
    x: composer.width - composer.margin - 24,
    y: footerY,
    size: 8,
    font: composer.regular,
    color: composer.theme.muted,
  });
}

function buildSummaryMetricCards(model: CurriculumCoveragePdfModel) {
  const cards = [
    {
      title: "Learning areas with evidence",
      description: `${model.coverageSummary.learningAreasWithEvidenceCount} of ${model.coverageSummary.areaSummaries.length} learning areas are building evidence.`,
      lines: ["Evidence building across the current curriculum map."],
    },
    {
      title: "Total linked evidence entries",
      description: `${model.coverageSummary.totalLinkedEvidenceCount} linked evidence entries`,
      lines: [
        model.coverageSummary.hasLinkedEvidence
          ? "Evidence is building across your learning record."
          : CURRICULUM_COVERAGE_EMPTY_COPY,
      ],
    },
    {
      title: "Areas to revisit",
      description: `${model.coverageSummary.areasToRevisitCount} areas may need more evidence.`,
      lines: ["Use this as a calm prompt for where you may want to capture more next."],
    },
  ];

  if (model.coverageSummary.supplementaryAreaSummaries.length) {
    cards.push({
      title: model.resolvedFramework.supplementaryMetricLabel,
      description: `${model.coverageSummary.supplementaryAreasWithEvidenceCount} of ${model.coverageSummary.supplementaryAreaSummaries.length} areas have linked evidence.`,
      lines: [model.resolvedFramework.supplementaryMetricCopy],
    });
  }

  return cards;
}

export async function generateCurriculumCoveragePdfBytes(
  model: CurriculumCoveragePdfModel,
) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const theme: PdfTheme = {
    title: rgb(0.08, 0.16, 0.28),
    heading: rgb(0.13, 0.27, 0.49),
    body: rgb(0.2, 0.26, 0.34),
    muted: rgb(0.39, 0.46, 0.56),
    accent: rgb(0.22, 0.45, 0.78),
    line: rgb(0.85, 0.89, 0.94),
    surface: rgb(0.97, 0.98, 1),
  };
  let composer = createComposer(doc, regular, bold, theme);
  const logo = await loadSafeLogoImage(doc);

  composer.page.drawRectangle({
    x: 0,
    y: 0,
    width: composer.width,
    height: composer.height,
    color: rgb(1, 1, 1),
  });

  composer = drawHeaderLogo(composer, logo);
  composer = drawCenteredTextBlock(composer, model.title, {
    font: bold,
    fontSize: 20,
    lineHeight: 24,
    color: theme.title,
    spacingAfter: 10,
  });
  composer = drawCenteredTextBlock(composer, model.purposeNote, {
    fontSize: 10.5,
    lineHeight: 14,
    color: theme.muted,
    spacingAfter: 18,
  });

  composer = drawCard(
    composer,
    "Coverage overview",
    null,
    [
      `Learner: ${model.learnerName}`,
      `Family: ${model.familyName}`,
      `Selected framework: ${model.frameworkLabel}`,
      `Country / region: ${model.countryLabel}`,
      `Authority / jurisdiction: ${model.authorityLabel}`,
      `Date generated: ${model.generatedOnLabel}`,
    ],
    {
      fill: theme.surface,
      border: theme.accent,
    },
  );
  composer = drawCard(
    composer,
    "How to use this record",
    model.disclaimer,
    [
      "Use this record to see which learning areas have evidence, which areas are still building, and which areas you may want to revisit next.",
    ],
  );

  composer = startNewPage(composer);
  composer = drawHeading(composer, "Coverage summary");
  composer = drawTextBlock(composer, model.resolvedFramework.helperCopy, {
    color: theme.body,
    spacingAfter: 10,
  });

  buildSummaryMetricCards(model).forEach((card) => {
    composer = drawCard(composer, card.title, card.description, card.lines);
  });

  composer = drawDivider(composer);
  composer = drawHeading(composer, "Learning area coverage");
  composer = drawTextBlock(
    composer,
    "These broad learning areas come from your current family settings and show where evidence is starting to build.",
    {
      spacingAfter: 10,
    },
  );

  model.coverageSummary.areaSummaries.forEach((summary) => {
    composer = drawCard(
      composer,
      summary.area.label,
      summary.area.shortDescription,
      [
        `Status: ${summary.status}`,
        `Evidence count: ${getEvidenceItemLabel(summary.count)}`,
        buildLatestEvidenceLine(summary.latestEntry),
      ],
    );
  });

  composer = drawDivider(composer);
  composer = drawHeading(composer, "Curriculum element breakdown");
  composer = drawTextBlock(
    composer,
    "Each broad element below helps show what this learning is building toward.",
    {
      spacingAfter: 10,
    },
  );

  model.coverageSummary.areaSummaries.forEach((areaSummary) => {
    composer = drawHeading(composer, areaSummary.area.label, 2);
    composer = drawTextBlock(composer, areaSummary.area.shortDescription, {
      color: theme.muted,
      spacingAfter: 8,
    });

    areaSummary.elementSummaries.forEach((elementSummary) => {
      composer = drawCard(
        composer,
        elementSummary.element.label,
        elementSummary.element.shortDescription,
        [
          `Status: ${elementSummary.status}`,
          `Linked evidence: ${getEvidenceItemLabel(elementSummary.count)}`,
          buildLatestEvidenceLine(elementSummary.latestEntry),
        ],
      );
    });
  });

  if (model.coverageSummary.supplementaryAreaSummaries.length) {
    composer = drawDivider(composer);
    composer = drawHeading(composer, model.resolvedFramework.supplementarySectionTitle);
    composer = drawTextBlock(composer, model.resolvedFramework.supplementarySectionCopy, {
      spacingAfter: 10,
    });

    model.coverageSummary.supplementaryAreaSummaries.forEach((summary) => {
      composer = drawCard(
        composer,
        summary.area.label,
        summary.area.shortDescription,
        [
          `Status: ${summary.status}`,
          `Evidence count: ${getEvidenceItemLabel(summary.count)}`,
          buildLatestEvidenceLine(summary.latestEntry),
        ],
      );
    });
  }

  composer = drawDivider(composer);
  composer = drawHeading(composer, "Evidence appendix");

  if (!model.coverageSummary.linkedEvidenceEntries.length) {
    composer = drawTextBlock(composer, CURRICULUM_COVERAGE_EMPTY_COPY);
  } else {
    model.coverageSummary.linkedEvidenceEntries.forEach((linkedEntry) => {
      const appendixLines = [
        `Date: ${formatDateLabel(linkedEntry.entry.observedOn)}`,
        `Learner: ${model.learnerName}`,
        `Learning area: ${linkedEntry.learningAreaLabel || NOT_RECORDED_YET}`,
      ];

      if (safe(linkedEntry.curriculumElementLabel)) {
        appendixLines.push(
          `Curriculum element: ${safe(linkedEntry.curriculumElementLabel)}`,
        );
      }

      if (safe(linkedEntry.authorityEvidenceAreaLabel)) {
        appendixLines.push(
          `Authority evidence area: ${safe(linkedEntry.authorityEvidenceAreaLabel)}`,
        );
      }

      appendixLines.push(`Note: ${getEvidenceSnippet(linkedEntry.entry)}`);

      composer = drawCard(
        composer,
        getEvidenceTitle(linkedEntry.entry),
        null,
        appendixLines,
      );
    });
  }

  const pages = doc.getPages();
  pages.forEach((page, index) => {
    drawFooter(
      {
        ...composer,
        page,
      },
      model.footerLine,
      index,
      pages.length,
    );
  });

  return await doc.save();
}
