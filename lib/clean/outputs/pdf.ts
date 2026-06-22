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
import type { LearningEvidenceEvent } from "@/lib/clean/evidence/learningEvidenceEvents";
import {
  drawDashboardHeroCard,
  drawDashboardMetricGrid,
  drawDashboardMiniCardGrid,
  type DashboardPdfMetricTile,
  type DashboardPdfMiniCard,
  type DashboardPdfPalette,
  type DashboardPdfTone,
} from "@/lib/clean/outputs/dashboardPdfPrimitives";

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
  sourceLabel?: string | null;
  pathwayLabel?: string | null;
  strandLabel?: string | null;
  stageLabel?: string | null;
  stepLabel?: string | null;
  progressLevel?: string | null;
  hasAttachment?: boolean;
  attachmentCount?: number;
};

export type CleanReportPdfModel = {
  report: CleanReport;
  learnerLabel: string;
  reportingPeriod: CleanReportingPeriod | null;
  sections: CleanReportSection[];
  evidenceItems: CleanReportPdfEvidenceItem[];
  assessmentEvidenceItems?: LearningEvidenceEvent[];
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
  "Family learning record. Check local home education requirements before submitting.";
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

function buildEvidenceContextLine(item: CleanReportPdfEvidenceItem) {
  const parts = [
    safe(item.sourceLabel) ? `Source: ${safe(item.sourceLabel)}` : "",
    safe(item.stepLabel) ? safe(item.stepLabel) : "",
    safe(item.progressLevel) ? `Progress: ${safe(item.progressLevel)}` : "",
    item.hasAttachment ? "Photo/evidence attached" : "",
    safe(item.programTitle) ? `Program: ${safe(item.programTitle)}` : "",
    safe(item.segmentTitle) ? `Week / segment: ${safe(item.segmentTitle)}` : "",
    safe(item.blockTitle) ? `Block: ${safe(item.blockTitle)}` : "",
  ].filter(Boolean);

  return parts.join(" | ");
}

function truncateAtWord(value: string, maxLength: number) {
  const clean = normalizeText(value).replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;

  const sliced = clean.slice(0, Math.max(0, maxLength - 3)).trimEnd();
  const lastSpace = sliced.lastIndexOf(" ");
  const base = lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced;
  return `${base.replace(/[.,;:!?-]+$/, "")}...`;
}

function formatEvidenceEventDateLabel(value: string | null | undefined) {
  const clean = safe(value);
  if (!clean) return "Not set";
  const date = new Date(clean);
  if (Number.isNaN(date.getTime())) return clean.slice(0, 10) || clean;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildDashboardPalette(theme: PdfTheme): DashboardPdfPalette {
  return {
    title: theme.title,
    heading: theme.heading,
    body: theme.body,
    muted: theme.muted,
    line: theme.accent,
    surface: theme.surface,
    accent: rgb(0.14, 0.38, 0.78),
    accentSurface: rgb(0.95, 0.97, 1),
    accentBorder: rgb(0.78, 0.86, 0.97),
    success: rgb(0.08, 0.48, 0.32),
    successSurface: rgb(0.94, 0.98, 0.96),
    successBorder: rgb(0.74, 0.9, 0.81),
    warning: rgb(0.72, 0.45, 0.08),
    warningSurface: rgb(1, 0.98, 0.93),
    warningBorder: rgb(0.96, 0.86, 0.67),
    lavender: rgb(0.38, 0.28, 0.76),
    lavenderSurface: rgb(0.96, 0.95, 1),
    lavenderBorder: rgb(0.84, 0.81, 0.98),
    neutral: rgb(0.33, 0.4, 0.49),
    neutralSurface: rgb(0.98, 0.99, 1),
    neutralBorder: rgb(0.86, 0.9, 0.94),
  };
}

function getLatestEvidenceItem(items: CleanReportPdfEvidenceItem[]) {
  return [...items].sort((left, right) => {
    const leftValue = Date.parse(`${safe(left.observedOn)}T00:00:00`) || 0;
    const rightValue = Date.parse(`${safe(right.observedOn)}T00:00:00`) || 0;
    return rightValue - leftValue;
  })[0] ?? null;
}

function getLatestAssessmentEvidenceItem(items: LearningEvidenceEvent[]) {
  return [...items].sort((left, right) => {
    const leftValue = Date.parse(safe(left.evidenceDate)) || 0;
    const rightValue = Date.parse(safe(right.evidenceDate)) || 0;
    return rightValue - leftValue;
  })[0] ?? null;
}

function getLatestRecordDateLabel(
  evidenceItems: CleanReportPdfEvidenceItem[],
  assessmentEvidenceItems: LearningEvidenceEvent[],
) {
  const latestEvidence = getLatestEvidenceItem(evidenceItems);
  const latestAssessment = getLatestAssessmentEvidenceItem(assessmentEvidenceItems);
  const evidenceTime = Date.parse(`${safe(latestEvidence?.observedOn)}T00:00:00`) || 0;
  const assessmentTime = Date.parse(safe(latestAssessment?.evidenceDate)) || 0;

  if (!evidenceTime && !assessmentTime) return "Waiting";
  if (assessmentTime > evidenceTime) {
    return formatEvidenceEventDateLabel(latestAssessment?.evidenceDate);
  }

  return formatDateLabel(latestEvidence?.observedOn);
}

function buildLearningAreaList(
  evidenceItems: CleanReportPdfEvidenceItem[],
  assessmentEvidenceItems: LearningEvidenceEvent[],
) {
  return Array.from(
    new Set(
      [
        ...evidenceItems.map((item) => safe(item.learningArea)),
        ...assessmentEvidenceItems.map((item) => safe(item.subject || item.strand)),
      ].filter(Boolean),
    ),
  );
}

function getReportDisplayTitle(model: CleanReportPdfModel) {
  const learner = safe(model.learnerLabel) || "Learner";
  return `${learner} Learning Record`;
}

type EvidenceSummaryGroup = {
  id: string;
  area: string;
  title: string;
  count: number;
  latestDate: string | null;
  sampleTitle: string;
};

function getEvidenceGroupTitle(item: CleanReportPdfEvidenceItem) {
  const title = safe(item.title) || "Learning evidence";
  const stepMatch = title.match(/Step\s+(\d+)\s*[-:]\s*(.+)$/i);
  if (stepMatch) {
    return `Step ${stepMatch[1]} - ${stepMatch[2].trim()}`;
  }

  return title;
}

function buildEvidenceSummaryGroups(items: CleanReportPdfEvidenceItem[]) {
  const groups = new Map<string, EvidenceSummaryGroup>();

  items.forEach((item) => {
    const area = safe(item.learningArea) || "Learning evidence";
    const title = getEvidenceGroupTitle(item);
    const key = `${area.toLowerCase()}::${title.toLowerCase()}`;
    const current = groups.get(key);
    const itemDate = safe(item.observedOn) || null;

    if (!current) {
      groups.set(key, {
        id: key,
        area,
        title,
        count: 1,
        latestDate: itemDate,
        sampleTitle: safe(item.title) || title,
      });
      return;
    }

    current.count += 1;
    if (itemDate && (!current.latestDate || itemDate > current.latestDate)) {
      current.latestDate = itemDate;
      current.sampleTitle = safe(item.title) || title;
    }
  });

  return Array.from(groups.values()).sort((left, right) => {
    const areaCompare = left.area.localeCompare(right.area);
    if (areaCompare !== 0) return areaCompare;
    return (right.latestDate || "").localeCompare(left.latestDate || "");
  });
}

function groupEvidenceItemsByArea(items: CleanReportPdfEvidenceItem[]) {
  const groups = new Map<string, CleanReportPdfEvidenceItem[]>();

  items.forEach((item) => {
    const area = safe(item.learningArea) || "Learning evidence";
    const current = groups.get(area) ?? [];
    current.push(item);
    groups.set(area, current);
  });

  return Array.from(groups.entries())
    .map(([area, groupedItems]) => ({
      area,
      items: groupedItems.sort((left, right) =>
        (right.observedOn || "").localeCompare(left.observedOn || ""),
      ),
    }))
    .sort((left, right) => left.area.localeCompare(right.area));
}

function getReportStatusTone(statusLabel: string): DashboardPdfTone {
  const normalized = safe(statusLabel).toLowerCase();
  if (normalized.includes("ready")) return "success";
  if (normalized.includes("draft")) return "warning";
  return "accent";
}

function buildLearningRecordMetricTiles(
  model: CleanReportPdfModel,
  learningAreas: string[],
): DashboardPdfMetricTile[] {
  const assessmentEvidenceCount = model.assessmentEvidenceItems?.length ?? 0;
  return [
    {
      label: "Selected evidence",
      value: String(model.evidenceItems.length),
      helper: model.evidenceItems.length
        ? "Report-included evidence entries"
        : "Waiting for first report evidence",
      tone: "accent",
    },
    {
      label: "Learning areas",
      value: String(learningAreas.length),
      helper: learningAreas.length
        ? learningAreas.slice(0, 3).join(", ")
        : "Not recorded yet",
      tone: "lavender",
    },
    {
      label: "Pathway checks",
      value: String(assessmentEvidenceCount),
      helper: assessmentEvidenceCount
        ? "Report-ready assessment evidence"
        : "No completed checks in this record",
      tone: assessmentEvidenceCount ? "success" : "neutral",
    },
    {
      label: "Latest evidence",
      value: getLatestRecordDateLabel(model.evidenceItems, model.assessmentEvidenceItems ?? []),
      helper: "Most recent selected evidence or pathway check",
      tone:
        model.evidenceItems.length || (model.assessmentEvidenceItems?.length ?? 0)
          ? "success"
          : "neutral",
    },
  ];
}

function buildEvidenceHighlightCards(items: CleanReportPdfEvidenceItem[]): DashboardPdfMiniCard[] {
  const groups = buildEvidenceSummaryGroups(items);
  const visibleItems = groups.slice(0, 7).map((group) => {
    const latestText = group.latestDate ? `Latest: ${formatDateLabel(group.latestDate)}` : "Date not recorded";
    const countText = `${group.count} evidence ${group.count === 1 ? "entry" : "entries"}`;

    return {
      eyebrow: group.area,
      title: group.title,
      description: `${countText} | ${latestText}`,
      lines: [
        group.count > 1
          ? "Grouped summary. Full individual details are included in the evidence appendix."
          : truncateAtWord(group.sampleTitle, 96),
      ],
      badge: countText,
      tone: "accent" as DashboardPdfTone,
    };
  });

  if (groups.length > 7) {
    visibleItems.push({
      eyebrow: "More evidence",
      title: `${groups.length - 7} more evidence ${groups.length - 7 === 1 ? "group" : "groups"}`,
      description: "Full details are included in the evidence appendix.",
      lines: [
        `${items.length} selected evidence ${items.length === 1 ? "entry" : "entries"} are included in total.`,
      ],
      badge: "Details",
      tone: "neutral",
    });
  }

  return visibleItems;
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
  palette: DashboardPdfPalette,
) {
  return drawDashboardMiniCardGrid(
    composer,
    palette,
    buildEvidenceHighlightCards(items),
    {
      columns: 2,
      spacingAfter: 12,
    },
  );
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
    ...(buildEvidenceContextLine(item)
      ? [
          {
            label: "Evidence context",
            lines: wrapText(buildEvidenceContextLine(item), composer.regular, 10.75, width),
          },
        ]
      : []),
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

function drawAssessmentEvidenceDetailCard(
  composer: PdfComposer,
  item: LearningEvidenceEvent,
  index: number,
) {
  const width = composer.width - composer.margin * 2 - 28;
  const stepLabel = item.stepNumber ? `Step ${item.stepNumber} check` : "Pathway check";
  const stepTitle = safe(item.stepTitle) || safe(item.title) || "Pathway assessment";
  const titleLines = wrapText(
    stepTitle,
    composer.bold,
    14,
    width,
  );
  const metaLine = [
    item.evidenceDate ? `Completed ${formatEvidenceEventDateLabel(item.evidenceDate)}` : "",
    item.subject ? `Subject ${item.subject}` : "",
    item.strand ? `Strand ${item.strand}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  const metaLines = metaLine ? wrapText(metaLine, composer.regular, 10, width) : [];
  const noteLines = wrapText(
    "Included as report-ready pathway evidence.",
    composer.regular,
    10.25,
    width,
  );
  const pillRows = [
    `Result: ${item.correctCount} / ${item.questionCount} correct`,
    `Support recommended: ${item.supportRecommendedCount}`,
    `Not sure: ${item.notSureCount}`,
    item.parentJudgement ? `Parent judgement: ${item.parentJudgement}` : "",
  ].filter(Boolean);
  const totalHeight =
    18 +
    12 +
    12 +
    measureWrappedLines(titleLines, 18) +
    8 +
    (metaLines.length ? measureWrappedLines(metaLines, 13) + 6 : 0) +
    Math.ceil(pillRows.length / 2) * 22 +
    8 +
    measureWrappedLines(noteLines, 13) +
    16;
  const next = ensureSpace(composer, totalHeight + 10);
  const top = next.y;

  drawPanel(next, top, totalHeight, {
    fill: rgb(0.96, 0.99, 0.97),
    border: rgb(0.76, 0.9, 0.81),
  });

  next.page.drawText(`Assessment evidence ${index + 1}`.toUpperCase(), {
    x: next.margin + 14,
    y: top - 18,
    size: 8.25,
    font: next.bold,
    color: rgb(0.08, 0.48, 0.32),
  });

  next.page.drawText(stepLabel.toUpperCase(), {
    x: next.margin + 14,
    y: top - 34,
    size: 9.25,
    font: next.bold,
    color: next.theme.muted,
  });

  let cursor = drawPreparedLines(next, titleLines, {
    x: next.margin + 14,
    y: top - 52,
    font: next.bold,
    fontSize: 14,
    lineHeight: 18,
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

  cursor -= 2;
  const pillGap = 8;
  const pillWidth = (width - pillGap) / 2;
  pillRows.forEach((pill, pillIndex) => {
    const column = pillIndex % 2;
    const row = Math.floor(pillIndex / 2);
    const x = next.margin + 14 + column * (pillWidth + pillGap);
    const y = cursor - row * 22;
    next.page.drawRectangle({
      x,
      y: y - 14,
      width: pillWidth,
      height: 18,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.74, 0.9, 0.81),
      borderWidth: 1,
    });
    next.page.drawText(pill, {
      x: x + 7,
      y: y - 8,
      size: 8.5,
      font: next.bold,
      color: rgb(0.08, 0.39, 0.24),
    });
  });
  cursor -= Math.ceil(pillRows.length / 2) * 22 + 4;

  drawPreparedLines(next, noteLines, {
    x: next.margin + 14,
    y: cursor,
    font: next.regular,
    fontSize: 10.25,
    lineHeight: 13,
    color: next.theme.body,
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
  const assessmentEvidenceItems = model.assessmentEvidenceItems ?? [];
  const learningAreas = buildLearningAreaList(model.evidenceItems, assessmentEvidenceItems);
  const theme: PdfTheme = {
    title: rgb(0.06, 0.11, 0.2),
    heading: rgb(0.1, 0.19, 0.36),
    body: rgb(0.2, 0.24, 0.31),
    muted: rgb(0.39, 0.45, 0.54),
    accent: rgb(0.85, 0.89, 0.94),
    surface: rgb(0.97, 0.985, 1),
  };
  const dashboardPalette = buildDashboardPalette(theme);
  const displayTitle = getReportDisplayTitle(model);
  const periodTitle = model.reportingPeriod?.title || "Current learning record";
  const periodDates = formatDateRange(model.reportingPeriod);
  const overviewText = model.reportingPeriod
    ? `This learning record brings together selected portfolio evidence and pathway checks for ${model.learnerLabel} during ${model.reportingPeriod.title}.`
    : `This learning record brings together selected portfolio evidence and pathway checks for ${model.learnerLabel}.`;

  let composer = createComposer(doc, regular, bold, theme);

  composer = drawHeaderLogo(composer, logo);
  composer = drawCenteredTextBlock(composer, "MyLearna Learning Record", {
    font: bold,
    fontSize: 24,
    lineHeight: 28,
    color: theme.title,
    spacingAfter: 6,
    maxWidth: 420,
  });
  composer = drawCenteredTextBlock(composer, displayTitle, {
    font: bold,
    fontSize: 17,
    lineHeight: 21,
    color: theme.heading,
    spacingAfter: 4,
    maxWidth: 430,
  });
  composer = drawCenteredTextBlock(
    composer,
    `${periodTitle} | ${periodDates}`,
    {
      fontSize: 10.75,
      lineHeight: 15,
      spacingAfter: 8,
      color: theme.heading,
      maxWidth: 420,
    },
  );
  composer = drawCenteredTextBlock(
    composer,
    `Prepared ${model.preparedOnLabel}`,
    {
      fontSize: 10,
      lineHeight: 13,
      spacingAfter: 10,
      color: theme.muted,
      maxWidth: 420,
    },
  );
  composer = drawCenteredRule(composer, 120);
  composer = drawDashboardHeroCard(composer, dashboardPalette, {
    eyebrow: "Learning snapshot",
    title: "Here is the learning story and the evidence behind it.",
    subtitle: overviewText,
    supportingBadges: [
      `Report period: ${periodDates}`,
      `Status: ${model.statusLabel}`,
    ],
    note:
      "Summary first, details later. Selected evidence and pathway checks are grouped for easier review before the appendix.",
    statLines: [
      {
        label: "Reporting period",
        value: periodDates,
        tone: "accent",
      },
      {
        label: "Status",
        value: model.statusLabel,
        tone: getReportStatusTone(model.statusLabel),
      },
      {
        label: "Learning areas",
        value: learningAreas.length
          ? `${learningAreas.length} represented`
          : "Not recorded yet",
        tone: learningAreas.length ? "lavender" : "neutral",
      },
      {
        label: "Pathway checks",
        value: assessmentEvidenceItems.length
          ? `${assessmentEvidenceItems.length} included`
          : "None included yet",
        tone: assessmentEvidenceItems.length ? "success" : "neutral",
      },
    ],
  });
  composer = drawDashboardMetricGrid(
    composer,
    dashboardPalette,
    buildLearningRecordMetricTiles(model, learningAreas),
    {
      columns: 3,
      spacingAfter: 10,
    },
  );
  composer = drawSummaryCard(composer, "Included in this record", [
    `${model.evidenceItems.length} selected evidence ${model.evidenceItems.length === 1 ? "entry" : "entries"}.`,
    `${assessmentEvidenceItems.length} pathway ${assessmentEvidenceItems.length === 1 ? "check" : "checks"}.`,
    `${learningAreas.length} learning ${learningAreas.length === 1 ? "area" : "areas"} represented${learningAreas.length ? `: ${learningAreas.join(", ")}.` : "."}`,
    `Latest evidence: ${getLatestRecordDateLabel(model.evidenceItems, assessmentEvidenceItems)}.`,
  ]);

  composer = startNewPage(composer);
  composer = drawHeading(composer, "Evidence by learning area", 2, {
    minFollowingSpace: model.evidenceItems.length ? 120 : 40,
  });
  composer = drawTextBlock(
    composer,
    "Grouped summary of report-included evidence. Full individual evidence entries are included later in the appendix.",
    {
      fontSize: 10.75,
      lineHeight: 15,
      spacingAfter: 8,
      color: theme.muted,
    },
  );
  if (model.evidenceItems.length) {
    composer = drawEvidenceSummaryCard(composer, model.evidenceItems, dashboardPalette);
  } else {
    composer = drawTextBlock(
      composer,
      "No report-included evidence is attached to this report yet.",
      {
        fontSize: 10.5,
        lineHeight: 14,
      },
    );
  }

  composer = drawHeading(composer, "Pathway assessment evidence", 2, {
    minFollowingSpace: assessmentEvidenceItems.length ? 150 : 40,
  });
  composer = drawTextBlock(
    composer,
    "Completed pathway checks are included as report-ready evidence for this learning record.",
    {
      fontSize: 10.75,
      lineHeight: 15,
      spacingAfter: 8,
      color: theme.muted,
    },
  );
  if (assessmentEvidenceItems.length) {
    assessmentEvidenceItems.forEach((item, index) => {
      composer = drawAssessmentEvidenceDetailCard(composer, item, index);
    });
  } else {
    composer = drawTextBlock(
      composer,
      "No completed pathway checks match this report period yet.",
      {
        fontSize: 10.5,
        lineHeight: 14,
      },
    );
  }

  if (model.sections.length) {
    composer = drawHeading(composer, "Report sections", 2, {
      minFollowingSpace: 140,
    });
    model.sections
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .forEach((section) => {
        composer = drawReportSectionCard(composer, section);
      });
  }

  composer = drawHeading(composer, "Evidence appendix", 2, {
    minFollowingSpace: model.evidenceItems.length ? 180 : 40,
  });
  composer = drawTextBlock(
    composer,
    "These notes sit behind the written report and make it easier to trace the learning record back to the source entries, including My Pathways worksheet evidence.",
    {
      fontSize: 10.75,
      lineHeight: 15,
      spacingAfter: 8,
      color: theme.muted,
    },
  );
  if (model.evidenceItems.length) {
    let evidenceIndex = 0;
    groupEvidenceItemsByArea(model.evidenceItems).forEach((group) => {
      composer = drawHeading(composer, group.area, 3, {
        minFollowingSpace: 120,
      });
      group.items.forEach((item) => {
        evidenceIndex += 1;
        composer = drawEvidenceDetailCard(composer, item, evidenceIndex - 1);
      });
    });
  } else {
    composer = drawTextBlock(
      composer,
      "No report-included evidence details are available for this report yet.",
      {
        fontSize: 10.5,
        lineHeight: 14,
      },
    );
  }

  addFooter(doc, regular, theme);
  return doc.save();
}
