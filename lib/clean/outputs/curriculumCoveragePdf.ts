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
  "No learning records have been captured yet.";

const CURRICULUM_COVERAGE_TITLE = "MyLearna Curriculum Coverage Record";
const CURRICULUM_COVERAGE_PURPOSE_NOTE =
  "A concise parent record of current learning areas, recent learning records, and visible pathway progress.";
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
  return `${count} learning ${count === 1 ? "record" : "records"}`;
}

function buildProgressJudgementLine(summary: CurriculumCoverageAssessmentSummary) {
  const secureOrStrong = summary.secure + summary.strong;
  const developing = summary.developing + summary.stillDeveloping;
  const parts: string[] = [];

  if (summary.assessedCount > 0) {
    parts.push(
      `${summary.assessedCount} progress ${summary.assessedCount === 1 ? "judgement" : "judgements"} saved`,
    );
  }

  if (secureOrStrong > 0) {
    parts.push(`${secureOrStrong} completed ${secureOrStrong === 1 ? "step" : "steps"}`);
  }

  if (developing > 0) {
    parts.push(`${developing} still building ${developing === 1 ? "step" : "steps"}`);
  }

  return parts.length ? parts.join(" | ") : "No progress judgement saved yet";
}

function buildLatestEvidenceLine(entry: CleanEvidenceEntry | null) {
  if (!entry) return "Recent learning: no record linked yet.";
  return `Recent learning: ${getEvidenceTitle(entry)} - ${formatDateLabel(entry.observedOn)}`;
}

function buildLatestEvidenceLabel(entry: CleanEvidenceEntry | null) {
  if (!entry) return "No learning record linked yet";
  return `${getEvidenceTitle(entry)} - ${formatDateLabel(entry.observedOn)}`;
}

function buildAssessmentSnapshot(
  summaries: Array<{ assessmentSummary: CurriculumCoverageAssessmentSummary }>,
) {
  return summaries.reduce(
    (totals, summary) => {
      totals.totalSteps += summary.assessmentSummary.totalSteps;
      totals.evidenceLinkedStepCount += summary.assessmentSummary.evidenceLinkedStepCount;
      totals.assessedCount += summary.assessmentSummary.assessedCount;
      totals.notAssessedYet += summary.assessmentSummary.notAssessedYet;
      totals.stillDeveloping += summary.assessmentSummary.stillDeveloping;
      totals.developing += summary.assessmentSummary.developing;
      totals.secure += summary.assessmentSummary.secure;
      totals.strong += summary.assessmentSummary.strong;
      return totals;
    },
    {
      totalSteps: 0,
      evidenceLinkedStepCount: 0,
      assessedCount: 0,
      notAssessedYet: 0,
      stillDeveloping: 0,
      developing: 0,
      secure: 0,
      strong: 0,
    } satisfies CurriculumCoverageAssessmentSummary,
  );
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

export function buildCleanCoverageRecordPdfFilename(
  learnerName: string,
  year: string | number | null | undefined,
) {
  const learnerPart = sanitizeFilePart(learnerName || "learner", "learner");
  const yearPart = resolveCoverageFilenameYear(year);
  return `MyLearna-Coverage-Record-${learnerPart}-${yearPart}.pdf`;
}

export const buildCurriculumCoveragePdfFilename = buildCleanCoverageRecordPdfFilename;

function resolveCoverageFilenameYear(value: string | number | null | undefined) {
  const clean = safe(value);
  const explicitYear = clean.match(/\b(20\d{2}|19\d{2})\b/)?.[1];
  return explicitYear || String(new Date().getFullYear());
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
  const titleWidth = innerWidth;
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

export function getCoveragePdfActiveAreaSummaries(model: CurriculumCoveragePdfModel) {
  return model.coverageSummary.areaSummaries
    .filter(
      (summary) =>
        summary.count > 0 ||
        summary.assessmentSummary.assessedCount > 0 ||
        summary.assessmentSummary.evidenceLinkedStepCount > 0,
    )
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.area.label.localeCompare(right.area.label);
    });
}

function buildLearningAreaLabel(count: number) {
  return `${count} ${count === 1 ? "learning area" : "learning areas"}`;
}

function buildActiveAreaSummaryLine(model: CurriculumCoveragePdfModel) {
  const activeAreas = getCoveragePdfActiveAreaSummaries(model);
  if (!activeAreas.length) {
    return "No learning area is active in this record yet.";
  }

  return `${buildLearningAreaLabel(activeAreas.length)} currently represented: ${activeAreas
    .map((summary) => summary.area.label)
    .join(", ")}.`;
}

function buildOverviewLines(model: CurriculumCoveragePdfModel): string[] {
  const activeAreas = getCoveragePdfActiveAreaSummaries(model);
  const assessmentSnapshot = buildAssessmentSnapshot(activeAreas);
  return [
    buildActiveAreaSummaryLine(model),
    `${getEvidenceItemLabel(model.coverageSummary.totalLinkedEvidenceCount)} saved for this learner.`,
    assessmentSnapshot.assessedCount > 0
      ? buildProgressJudgementLine(assessmentSnapshot)
      : "No progress judgement has been saved in this coverage record yet.",
  ];
}

function buildAreaLines(summary: ReturnType<typeof getCoveragePdfActiveAreaSummaries>[number]) {
  const lines = [
    getEvidenceItemLabel(summary.count),
    buildLatestEvidenceLine(summary.latestEntry),
  ];

  if (summary.assessmentSummary.assessedCount > 0) {
    lines.push(buildProgressJudgementLine(summary.assessmentSummary));
  }

  return lines;
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
  const latestLinkedEvidence = model.coverageSummary.linkedEvidenceEntries[0]?.entry ?? null;
  const activeAreaSummaries = getCoveragePdfActiveAreaSummaries(model);

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
    spacingAfter: 14,
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
    `${model.learnerName}'s learning overview`,
    latestLinkedEvidence
      ? `Latest learning record: ${buildLatestEvidenceLabel(latestLinkedEvidence)}`
      : "Start this record by saving a learning observation, work sample, or photo.",
    buildOverviewLines(model),
    {
      fill: theme.surface,
      border: theme.accent,
    },
  );
  composer = drawInfoCard(
    composer,
    "Family reporting note",
    model.disclaimer,
  );

  composer = drawHeading(composer, "Recent learning records");
  if (!model.coverageSummary.linkedEvidenceEntries.length) {
    composer = drawCard(
      composer,
      "No learning records yet",
      "This record will grow as observations, work samples, photos, or pathway evidence are saved.",
      [
        "Choose a pathway, add an observation, or capture completed work when useful learning happens.",
      ],
    );
  } else {
    model.coverageSummary.linkedEvidenceEntries.slice(0, 8).forEach((linkedEntry) => {
      const lines = [
        `Date: ${formatDateLabel(linkedEntry.entry.observedOn)}`,
        `Learning area: ${linkedEntry.learningAreaLabel || NOT_RECORDED_YET}`,
      ];

      if (safe(linkedEntry.curriculumElementLabel)) {
        lines.push(`Curriculum detail: ${safe(linkedEntry.curriculumElementLabel)}`);
      }

      lines.push(`Note: ${getEvidenceSnippet(linkedEntry.entry)}`);

      composer = drawCard(
        composer,
        getEvidenceTitle(linkedEntry.entry),
        `${formatDateLabel(linkedEntry.entry.observedOn)} | ${model.learnerName}`,
        lines,
      );
    });
  }

  composer = drawHeading(composer, "Current learning areas");
  if (!activeAreaSummaries.length) {
    composer = drawCard(
      composer,
      "No active learning area recorded yet",
      null,
      [
        "Other learning areas are not currently active in this learning period.",
        "They will appear here when a pathway, plan, or learning record is saved.",
      ],
    );
  } else {
    activeAreaSummaries.forEach((summary) => {
      composer = drawCard(
        composer,
        summary.area.label,
        summary.area.shortDescription,
        buildAreaLines(summary),
        {
          fill: summary.count > 0 ? rgb(0.97, 0.99, 1) : theme.surface,
          border: summary.count > 0 ? rgb(0.76, 0.86, 0.98) : theme.line,
        },
      );
    });
    composer = drawTextBlock(
      composer,
      "Other learning areas are not currently active in this learning period.",
      {
        color: theme.muted,
        spacingAfter: 8,
      },
    );
  }

  composer = drawHeading(composer, "Useful next records");
  composer = drawCard(
    composer,
    "What may be useful to capture next",
    null,
    activeAreaSummaries.length
      ? [
          "Add completed work for the current pathway step.",
          "Save a progress judgement after reviewing the work.",
          "Select the strongest examples for Portfolio or reporting when ready.",
        ]
      : [
          "Add a first observation or work sample.",
          "Add a first observation or work sample.",
          "Plan a learning activity and return here after work is saved.",
        ],
  );

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
