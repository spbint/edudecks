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
  type CurriculumCoverageAssessmentSummary,
  type CurriculumCoverageLinkedEvidence,
  type CurriculumCoverageMatchSummary,
  type CurriculumCoverageStatus,
  type CurriculumCoverageSummary,
} from "@/lib/clean/curriculum/coverageSummary";
import {
  resolveCurriculumFrameworkMap,
  type ResolvedCurriculumFrameworkMap,
} from "@/lib/clean/curriculum/frameworkMaps";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { FamilyProfile } from "@/lib/clean/family/types";
import type { Learner } from "@/lib/clean/learners/types";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";

export const CURRICULUM_COVERAGE_EMPTY_COPY =
  "No curriculum-linked evidence has been captured yet.";

const CURRICULUM_COVERAGE_TITLE = "MyLearna Curriculum Coverage Record";
const CURRICULUM_COVERAGE_PURPOSE_NOTE =
  "This record shows how captured learning evidence is building across curriculum areas and reporting expectations.";
const CURRICULUM_COVERAGE_DISCLAIMER =
  "This record is designed to support family record keeping and reporting preparation. Families should check their local authority, state, or registration requirements before submitting records.";
const CURRICULUM_COVERAGE_FOOTER = "MyLearna \u2014 Plan. Capture. Grow.";
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
  assessmentStatuses?: CleanAssessmentSkillStatus[];
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

type LabelValueItem = {
  label: string;
  value: string;
};

type StatusBadge = {
  label: string;
  fill: ReturnType<typeof rgb>;
  border: ReturnType<typeof rgb>;
  text: ReturnType<typeof rgb>;
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

function buildAssessmentSummaryLine(summary: CurriculumCoverageAssessmentSummary) {
  const secureOrStrong = summary.secure + summary.strong;
  const developing = summary.developing + summary.stillDeveloping;

  return `Assessment confidence: ${summary.assessedCount} assessed, ${secureOrStrong} secure or strong, ${developing} developing or still developing, ${summary.notAssessedYet} not assessed yet.`;
}

function buildLatestEvidenceLine(entry: CleanEvidenceEntry | null) {
  if (!entry) return "Latest evidence: No evidence linked yet.";
  return `Latest evidence: ${getEvidenceTitle(entry)} - ${formatDateLabel(entry.observedOn)}`;
}

function buildLatestEvidenceLabel(entry: CleanEvidenceEntry | null) {
  if (!entry) return "No evidence linked yet.";
  return `${getEvidenceTitle(entry)} - ${formatDateLabel(entry.observedOn)}`;
}

function buildEvidenceExampleLabel(entry: CleanEvidenceEntry) {
  return `${getEvidenceTitle(entry)} - ${formatDateLabel(entry.observedOn)}`;
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
    assessmentStatuses: input.assessmentStatuses,
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

function drawHeading(
  composer: PdfComposer,
  text: string,
  level: 1 | 2 | 3 = 1,
  options?: { minFollowingSpace?: number },
) {
  const fontSize = level === 1 ? 18 : level === 2 ? 13.5 : 11.5;
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
    badge?: StatusBadge | null;
  },
) {
  const innerWidth = composer.width - composer.margin * 2 - 28;
  const badgeFontSize = 8.5;
  const badgeWidth = options?.badge
    ? Math.max(
        86,
        composer.bold.widthOfTextAtSize(options.badge.label, badgeFontSize) + 18,
      )
    : 0;
  const titleWidth = options?.badge ? Math.max(160, innerWidth - badgeWidth - 12) : innerWidth;
  const titleLines = wrapText(title, composer.bold, 12.5, titleWidth);
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

  if (options?.badge) {
    const badgeX = next.margin + 14 + innerWidth - badgeWidth;
    const badgeTop = top - 16;
    next.page.drawRectangle({
      x: badgeX,
      y: badgeTop - 18,
      width: badgeWidth,
      height: 18,
      color: options.badge.fill,
      borderColor: options.badge.border,
      borderWidth: 1,
    });
    next.page.drawText(options.badge.label, {
      x: badgeX + 9,
      y: badgeTop - 12,
      size: badgeFontSize,
      font: next.bold,
      color: options.badge.text,
    });
  }

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

function drawMetaCard(
  composer: PdfComposer,
  title: string,
  items: LabelValueItem[],
  options?: {
    fill?: ReturnType<typeof rgb>;
    border?: ReturnType<typeof rgb>;
  },
) {
  const width = composer.width - composer.margin * 2;
  const paddingX = 18;
  const paddingTop = 18;
  const rowGap = 12;
  const colGap = 16;
  const titleGap = 16;
  const labelFontSize = 8.5;
  const valueFontSize = 10.75;
  const valueLineHeight = 14.5;
  const titleHeight = 14;
  const columnWidth = (width - paddingX * 2 - colGap) / 2;
  const rows: Array<
    Array<{
      label: string;
      valueLines: string[];
      cellHeight: number;
    }>
  > = [];

  for (let index = 0; index < items.length; index += 2) {
    rows.push(
      items.slice(index, index + 2).map((item) => {
        const valueLines = wrapText(
          item.value || NOT_RECORDED_YET,
          composer.regular,
          valueFontSize,
          columnWidth,
        );
        const valueHeight = measureWrappedLines(valueLines, valueLineHeight);

        return {
          label: item.label,
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
    fill: options?.fill || next.theme.surface,
    border: options?.border || next.theme.accent,
  });

  next.page.drawText(title, {
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
      const columnX = next.margin + paddingX + columnIndex * (columnWidth + colGap);

      next.page.drawText(item.label.toUpperCase(), {
        x: columnX,
        y: cursorY,
        size: labelFontSize,
        font: next.bold,
        color: next.theme.muted,
      });

      drawPreparedLines(next, item.valueLines, {
        x: columnX,
        y: cursorY - 15,
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
        color: next.theme.line,
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
  const bodyLines = wrapText(body, composer.regular, 10.5, width);
  const titleHeight = 14;
  const bodyHeight = measureWrappedLines(bodyLines, 15);
  const totalHeight = 18 + titleHeight + 10 + bodyHeight + 16;
  const next = ensureSpace(composer, totalHeight + 10);
  const top = next.y;

  drawPanel(next, top, totalHeight, {
    fill: options?.fill || next.theme.surface,
    border: options?.border || next.theme.line,
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
    fontSize: 10.5,
    lineHeight: 15,
    color: next.theme.body,
  });

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

  const pageLabel = `${pageIndex + 1} / ${pageCount}`;
  const pageLabelWidth = composer.regular.widthOfTextAtSize(pageLabel, 8);
  composer.page.drawText(pageLabel, {
    x: composer.width - composer.margin - pageLabelWidth,
    y: footerY,
    size: 8,
    font: composer.regular,
    color: composer.theme.muted,
  });
}

function buildCoverageStatusCounts<TSummary extends { status: CurriculumCoverageStatus }>(
  summaries: TSummary[],
) {
  return summaries.reduce(
    (totals, summary) => {
      if (summary.status === "Evidence building") {
        totals.buildingCount += 1;
      } else if (summary.status === "Evidence started") {
        totals.startedCount += 1;
      } else {
        totals.noEvidenceCount += 1;
      }

      return totals;
    },
    {
      noEvidenceCount: 0,
      startedCount: 0,
      buildingCount: 0,
    },
  );
}

function getStatusBadge(status: CurriculumCoverageStatus): StatusBadge {
  if (status === "Evidence building") {
    return {
      label: status,
      fill: rgb(0.93, 0.97, 1),
      border: rgb(0.74, 0.84, 0.98),
      text: rgb(0.12, 0.31, 0.71),
    };
  }

  if (status === "Evidence started") {
    return {
      label: status,
      fill: rgb(0.94, 0.95, 1),
      border: rgb(0.78, 0.8, 0.98),
      text: rgb(0.27, 0.24, 0.73),
    };
  }

  return {
    label: status,
    fill: rgb(0.97, 0.98, 0.99),
    border: rgb(0.87, 0.9, 0.94),
    text: rgb(0.38, 0.45, 0.55),
  };
}

function getStatusCardStyle(status: CurriculumCoverageStatus) {
  if (status === "Evidence building") {
    return {
      fill: rgb(0.97, 0.99, 1),
      border: rgb(0.76, 0.86, 0.98),
    };
  }

  if (status === "Evidence started") {
    return {
      fill: rgb(0.98, 0.98, 1),
      border: rgb(0.82, 0.83, 0.98),
    };
  }

  return {
    fill: rgb(0.99, 0.99, 1),
    border: rgb(0.88, 0.91, 0.95),
  };
}

function buildAreaCoverageLines(summary: {
  count: number;
  status: CurriculumCoverageStatus;
  latestEntry: CleanEvidenceEntry | null;
  matchedEntries: CleanEvidenceEntry[];
  elementSummaries: Array<{ count: number }>;
  assessmentSummary: CurriculumCoverageAssessmentSummary;
}) {
  const elementsWithEvidenceCount = summary.elementSummaries.filter(
    (item) => item.count > 0,
  ).length;
  const exampleEntries = summary.matchedEntries.slice(0, 2);
  const lines = [
    `Evidence count: ${getEvidenceItemLabel(summary.count)}`,
    `Elements with evidence: ${elementsWithEvidenceCount} of ${summary.elementSummaries.length}`,
    buildLatestEvidenceLine(summary.latestEntry),
  ];

  if (summary.assessmentSummary.totalSteps > 0) {
    lines.splice(2, 0, buildAssessmentSummaryLine(summary.assessmentSummary));
  }

  if (!exampleEntries.length) {
    lines.push("Evidence examples: No evidence linked yet.");
    return lines;
  }

  exampleEntries.forEach((entry, index) => {
    lines.push(`Evidence example ${index + 1}: ${buildEvidenceExampleLabel(entry)}`);
  });

  return lines;
}

function buildElementCoverageLines(
  summary: Pick<
    CurriculumCoverageMatchSummary,
    "count" | "status" | "latestEntry" | "matchedEntries" | "assessmentSummary"
  >,
) {
  const lines = [
    `Linked evidence: ${getEvidenceItemLabel(summary.count)}`,
    buildLatestEvidenceLine(summary.latestEntry),
  ];
  if (summary.assessmentSummary.totalSteps > 0) {
    lines.splice(1, 0, buildAssessmentSummaryLine(summary.assessmentSummary));
  }
  const exampleEntry = summary.matchedEntries[0] ?? null;

  lines.push(
    exampleEntry
      ? `Example evidence: ${buildEvidenceExampleLabel(exampleEntry)}`
      : "Example evidence: No evidence linked yet.",
  );

  return lines;
}

function buildStatusGuideLines() {
  return [
    "No evidence yet: no linked evidence has been captured in MyLearna for this area yet.",
    "Evidence started: one linked evidence example has been captured for this area.",
    "Evidence building: two or more linked evidence examples are now on record for this area.",
  ];
}

function buildSectionGuideLines(model: CurriculumCoveragePdfModel) {
  const lines = [
    "Coverage summary: calm headline counts and a quick scan across the current framework.",
    "Learning area coverage: broad areas showing where evidence is starting to build.",
    "Curriculum element breakdown: wider elements sitting under each learning area.",
  ];

  if (model.coverageSummary.supplementaryAreaSummaries.length) {
    lines.push(
      `${model.resolvedFramework.supplementarySectionTitle}: additional support and reporting areas linked to the active framework.`,
    );
  }

  lines.push(
    "Evidence appendix: linked evidence entries grouped by learning area for easier review.",
  );

  return lines;
}

function buildQuickAreaScanLines(
  summaries: Array<{
    area: { label: string };
    status: CurriculumCoverageStatus;
    count: number;
  }>,
) {
  return summaries.map(
    (summary) =>
      `${summary.area.label}: ${summary.status} (${getEvidenceItemLabel(summary.count)})`,
  );
}

function buildAppendixGroups(model: CurriculumCoveragePdfModel) {
  const areaOrder = new Map(
    model.coverageSummary.areaSummaries.map((summary, index) => [summary.area.label, index]),
  );
  const groups = new Map<string, CurriculumCoverageLinkedEvidence[]>();

  model.coverageSummary.linkedEvidenceEntries.forEach((entry) => {
    const title = safe(entry.learningAreaLabel) || NOT_RECORDED_YET;
    const existing = groups.get(title) ?? [];
    existing.push(entry);
    groups.set(title, existing);
  });

  return [...groups.entries()]
    .sort((left, right) => {
      const leftOrder = areaOrder.get(left[0]);
      const rightOrder = areaOrder.get(right[0]);

      if (typeof leftOrder === "number" && typeof rightOrder === "number") {
        return leftOrder - rightOrder;
      }

      if (typeof leftOrder === "number") return -1;
      if (typeof rightOrder === "number") return 1;
      return left[0].localeCompare(right[0]);
    })
    .map(([title, entries]) => ({
      title,
      entries,
    }));
}

function buildCoverMetaItems(model: CurriculumCoveragePdfModel): LabelValueItem[] {
  return [
    { label: "Learner", value: model.learnerName },
    { label: "Family", value: model.familyName },
    { label: "Selected framework", value: model.frameworkLabel },
    { label: "Country / region", value: model.countryLabel },
    { label: "Authority / jurisdiction", value: model.authorityLabel },
    { label: "Date generated", value: model.generatedOnLabel },
  ];
}

function buildSummaryMetricCards(model: CurriculumCoveragePdfModel) {
  const areaStatusCounts = buildCoverageStatusCounts(model.coverageSummary.areaSummaries);
  const supplementaryStatusCounts = buildCoverageStatusCounts(
    model.coverageSummary.supplementaryAreaSummaries,
  );
  const latestLinkedEvidence = model.coverageSummary.linkedEvidenceEntries[0]?.entry ?? null;
  const cards = [
    {
      title: "Learning areas with evidence",
      description: `${model.coverageSummary.learningAreasWithEvidenceCount} of ${model.coverageSummary.areaSummaries.length} learning areas have linked evidence.`,
      lines: [
        `${areaStatusCounts.buildingCount} areas are in Evidence building.`,
        `${areaStatusCounts.startedCount} areas are in Evidence started.`,
        `${areaStatusCounts.noEvidenceCount} areas are still showing No evidence yet.`,
      ],
    },
    {
      title: "Total linked evidence entries",
      description: `${model.coverageSummary.totalLinkedEvidenceCount} linked evidence entries`,
      lines: [
        model.coverageSummary.hasLinkedEvidence
          ? `Latest linked evidence: ${buildLatestEvidenceLabel(latestLinkedEvidence)}`
          : CURRICULUM_COVERAGE_EMPTY_COPY,
      ],
    },
    {
      title: "Areas to revisit",
      description: `${model.coverageSummary.areasToRevisitCount} areas may need more evidence.`,
      lines: [
        "Use this as a calm prompt for where you may want to capture more next.",
        "A revisit area simply means no linked evidence has been captured there yet.",
      ],
    },
  ];

  if (model.coverageSummary.supplementaryAreaSummaries.length) {
    cards.push({
      title: model.resolvedFramework.supplementaryMetricLabel,
      description: `${model.coverageSummary.supplementaryAreasWithEvidenceCount} of ${model.coverageSummary.supplementaryAreaSummaries.length} areas have linked evidence.`,
      lines: [
        model.resolvedFramework.supplementaryMetricCopy,
        `${supplementaryStatusCounts.buildingCount} building, ${supplementaryStatusCounts.startedCount} started, ${supplementaryStatusCounts.noEvidenceCount} with no evidence yet.`,
      ],
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

  composer = drawMetaCard(
    composer,
    "At a glance",
    buildCoverMetaItems(model),
    {
      fill: theme.surface,
      border: theme.accent,
    },
  );
  composer = drawCard(
    composer,
    "How to read the language in this record",
    null,
    buildStatusGuideLines(),
  );
  composer = drawCard(
    composer,
    "What is included",
    null,
    buildSectionGuideLines(model),
  );
  composer = drawInfoCard(
    composer,
    "Family record keeping note",
    model.disclaimer,
  );
  composer = drawCard(
    composer,
    "Using this record",
    null,
    [
      "Use this record to see which learning areas already have evidence, which areas are beginning to build, and which areas you may want to revisit next.",
      "This is designed to support calm family review and reporting preparation rather than assessment scoring.",
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
  composer = drawCard(
    composer,
    "Quick area scan",
    "A simple scan of the current learning areas and their current evidence status.",
    buildQuickAreaScanLines(model.coverageSummary.areaSummaries),
  );

  if (model.coverageSummary.supplementaryAreaSummaries.length) {
    composer = drawCard(
      composer,
      model.resolvedFramework.supplementarySectionTitle,
      "These support areas are included because they are active for this framework.",
      buildQuickAreaScanLines(model.coverageSummary.supplementaryAreaSummaries),
    );
  }

  composer = startNewPage(composer);
  composer = drawHeading(composer, "Learning area coverage");
  composer = drawTextBlock(
    composer,
    "These broad learning areas come from your current family settings and show where evidence is starting to build.",
    {
      spacingAfter: 10,
    },
  );

  model.coverageSummary.areaSummaries.forEach((summary) => {
    const statusStyle = getStatusCardStyle(summary.status);
    composer = drawCard(
      composer,
      summary.area.label,
      summary.area.shortDescription,
      buildAreaCoverageLines(summary),
      {
        fill: statusStyle.fill,
        border: statusStyle.border,
        badge: getStatusBadge(summary.status),
      },
    );
  });

  composer = startNewPage(composer);
  composer = drawHeading(composer, "Curriculum element breakdown");
  composer = drawTextBlock(
    composer,
    "Each broad element below helps show what this learning is building toward.",
    {
      spacingAfter: 10,
    },
  );

  model.coverageSummary.areaSummaries.forEach((areaSummary) => {
    const areaStatusStyle = getStatusCardStyle(areaSummary.status);
    composer = drawHeading(composer, areaSummary.area.label, 2, {
      minFollowingSpace: 84,
    });
    composer = drawTextBlock(composer, areaSummary.area.shortDescription, {
      color: theme.muted,
      spacingAfter: 8,
    });
    composer = drawCard(
      composer,
      "Area overview",
      null,
      buildAreaCoverageLines(areaSummary),
      {
        fill: areaStatusStyle.fill,
        border: areaStatusStyle.border,
        badge: getStatusBadge(areaSummary.status),
      },
    );

    areaSummary.elementSummaries.forEach((elementSummary) => {
      const elementStatusStyle = getStatusCardStyle(elementSummary.status);
      composer = drawCard(
        composer,
        elementSummary.element.label,
        elementSummary.element.shortDescription,
        buildElementCoverageLines(elementSummary),
        {
          fill: elementStatusStyle.fill,
          border: elementStatusStyle.border,
          badge: getStatusBadge(elementSummary.status),
        },
      );
    });
  });

  if (model.coverageSummary.supplementaryAreaSummaries.length) {
    composer = startNewPage(composer);
    composer = drawHeading(composer, model.resolvedFramework.supplementarySectionTitle);
    composer = drawTextBlock(composer, model.resolvedFramework.supplementarySectionCopy, {
      spacingAfter: 10,
    });

    model.coverageSummary.supplementaryAreaSummaries.forEach((summary) => {
      const supplementaryStatusStyle = getStatusCardStyle(summary.status);
      composer = drawCard(
        composer,
        summary.area.label,
        summary.area.shortDescription,
        buildElementCoverageLines(summary),
        {
          fill: supplementaryStatusStyle.fill,
          border: supplementaryStatusStyle.border,
          badge: getStatusBadge(summary.status),
        },
      );
    });
  }

  composer = startNewPage(composer);
  composer = drawHeading(composer, "Evidence appendix");
  composer = drawTextBlock(
    composer,
    "This appendix groups linked evidence by learning area so it is easier to review when preparing reports, portfolio selections, or authority records.",
    {
      spacingAfter: 10,
    },
  );

  if (!model.coverageSummary.linkedEvidenceEntries.length) {
    composer = drawTextBlock(composer, CURRICULUM_COVERAGE_EMPTY_COPY);
  } else {
    buildAppendixGroups(model).forEach((group) => {
      composer = drawHeading(composer, group.title, 2, {
        minFollowingSpace: 72,
      });
      composer = drawTextBlock(
        composer,
        `${group.entries.length} linked evidence ${
          group.entries.length === 1 ? "entry" : "entries"
        } in this learning area.`,
        {
          color: theme.muted,
          spacingAfter: 8,
        },
      );

      group.entries.forEach((linkedEntry) => {
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
          `${formatDateLabel(linkedEntry.entry.observedOn)} | ${model.learnerName}`,
          appendixLines,
        );
      });
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
