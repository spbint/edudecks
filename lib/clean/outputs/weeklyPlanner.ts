import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
} from "pdf-lib";

import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  formatCalendarTimeRange,
  normalizeLearningAreaLabel,
} from "@/lib/clean/calendar/planningIntegrity";
import type { CleanTemplateBlock } from "@/lib/clean/templates/types";

export type CleanWeeklyPlannerEntry = {
  id: string;
  plannedDate: string;
  title: string;
  timeLabel: string | null;
  learnerLabel: string | null;
  learningArea: string | null;
  programTitle: string | null;
  segmentTitle: string | null;
  sessionLabel: string | null;
  notes: string | null;
};

export type CleanWeeklyPlannerPdfModel = {
  familyName: string | null;
  learnerLabel: string | null;
  weekStartsOn: string;
  weekEndsOn: string;
  sourceLabel: string | null;
  entries: CleanWeeklyPlannerEntry[];
  includedDates?: string[];
  viewLabel?: string | null;
};

export type CleanMonthlyPlannerPdfModel = {
  familyName: string | null;
  learnerLabel: string | null;
  monthStartsOn: string;
  entries: CleanWeeklyPlannerEntry[];
};

export type CleanDailyPlannerPdfModel = {
  familyName: string | null;
  learnerLabel: string | null;
  plannedDate: string;
  entries: CleanWeeklyPlannerEntry[];
};

type PlannerLabelMaps = {
  learnerLabelById?: Map<string, string>;
  programLabelById?: Map<string, string>;
  segmentLabelById?: Map<string, string>;
};

const LANDSCAPE_A4 = [841.89, 595.28] as const;
const LOGO_PATH = "/branding/mylearna-logo.png";
const EMPTY_WEEK_NOTE = "No learning blocks planned for this week yet.";
const FOOTER_TEXT = "Family learning plan. Adjust as needed for your homeschool day.";
const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function sanitizeFilePart(value: string, fallback: string) {
  const clean = safe(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || fallback;
}

function normalizeText(value: string | null | undefined) {
  return safe(value)
    .replace(/\s+/g, " ")
    .trim();
}

function addDays(dateValue: string, dayOffset: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setDate(date.getDate() + dayOffset);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getWeekDates(weekStartsOn: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStartsOn, index));
}

function getWeekStart(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getMonthStart(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue.slice(0, 8) + "01";
  date.setDate(1);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getMonthGridDates(monthStartsOn: string) {
  const gridStart = getWeekStart(monthStartsOn);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function formatDateLabel(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  },
) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, options);
}

function formatLongDateLabel(value: string) {
  return formatDateLabel(value, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatWeekRangeLabel(startsOn: string, endsOn: string) {
  return `${formatDateLabel(startsOn, {
    weekday: "short",
    day: "numeric",
    month: "short",
  })} to ${formatDateLabel(endsOn, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function formatMonthLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function buildPlannerTimeLabel(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
) {
  return formatCalendarTimeRange(startsAt, endsAt);
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const normalized = normalizeText(text);
  if (!normalized) return [] as string[];

  const words = normalized.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  return lines;
}

function ellipsizeText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const normalized = normalizeText(text);
  if (!normalized) return "";
  if (font.widthOfTextAtSize(normalized, fontSize) <= maxWidth) {
    return normalized;
  }

  let current = normalized;
  while (current.length > 1) {
    const candidate = `${current}...`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      return candidate;
    }

    current = current.slice(0, -1).trimEnd();
  }

  return "...";
}

function clampWrappedLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  maxLines: number,
) {
  const lines = wrapText(text, font, fontSize, maxWidth);
  if (lines.length <= maxLines) return lines;

  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = ellipsizeText(
    [...lines.slice(maxLines - 1)].join(" "),
    font,
    fontSize,
    maxWidth,
  );
  return visible;
}

function drawTextLines(
  page: ReturnType<PDFDocument["addPage"]>,
  lines: string[],
  x: number,
  y: number,
  options: {
    font: PDFFont;
    fontSize: number;
    lineHeight: number;
    color: ReturnType<typeof rgb>;
  },
) {
  let cursor = y;
  lines.forEach((line) => {
    if (!line) return;

    page.drawText(line, {
      x,
      y: cursor,
      size: options.fontSize,
      font: options.font,
      color: options.color,
    });
    cursor -= options.lineHeight;
  });

  return cursor;
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

function buildEntryMetaLines(entry: CleanWeeklyPlannerEntry) {
  const primary = [safe(entry.learnerLabel), safe(entry.learningArea)]
    .filter(Boolean)
    .join(" • ");
  const secondary = [
    safe(entry.programTitle),
    safe(entry.segmentTitle) || safe(entry.sessionLabel),
  ]
    .filter(Boolean)
    .join(" • ");

  return [primary || null, secondary || null].filter(
    (value): value is string => Boolean(value),
  );
}

function estimateEntryHeight(
  entry: CleanWeeklyPlannerEntry,
  width: number,
  regular: PDFFont,
  bold: PDFFont,
) {
  const innerWidth = width - 16;
  const titleLines = clampWrappedLines(entry.title, bold, 10, innerWidth, 2);
  const metaLines = buildEntryMetaLines(entry).flatMap((line) =>
    clampWrappedLines(line, regular, 7.5, innerWidth, 1),
  );

  let height = 18;
  if (entry.timeLabel) height += 10;
  height += titleLines.length * 12;
  height += metaLines.length * 9;
  return Math.max(height, 42);
}

function drawPlannerEntry(
  page: ReturnType<PDFDocument["addPage"]>,
  entry: CleanWeeklyPlannerEntry,
  x: number,
  y: number,
  width: number,
  regular: PDFFont,
  bold: PDFFont,
) {
  const theme = {
    surface: rgb(0.97, 0.98, 1),
    border: rgb(0.84, 0.89, 0.95),
    accent: rgb(0.22, 0.45, 0.78),
    body: rgb(0.15, 0.23, 0.34),
    muted: rgb(0.39, 0.46, 0.56),
  };
  const height = estimateEntryHeight(entry, width, regular, bold);
  const innerWidth = width - 16;

  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
  });

  page.drawRectangle({
    x,
    y: y - 4,
    width,
    height: 4,
    color: theme.accent,
  });

  let cursor = y - 14;
  if (entry.timeLabel) {
    cursor = drawTextLines(page, [entry.timeLabel], x + 8, cursor, {
      font: bold,
      fontSize: 7.5,
      lineHeight: 9,
      color: theme.accent,
    });
  }

  cursor = drawTextLines(
    page,
    clampWrappedLines(entry.title, bold, 10, innerWidth, 2),
    x + 8,
    cursor,
    {
      font: bold,
      fontSize: 10,
      lineHeight: 11.5,
      color: theme.body,
    },
  );

  buildEntryMetaLines(entry).forEach((line) => {
    cursor = drawTextLines(
      page,
      clampWrappedLines(line, regular, 7.5, innerWidth, 1),
      x + 8,
      cursor - 1,
      {
        font: regular,
        fontSize: 7.5,
        lineHeight: 8.5,
        color: theme.muted,
      },
    );
  });

  return height;
}

function drawDayCard(
  page: ReturnType<PDFDocument["addPage"]>,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    dayLabel: string;
    dateLabel: string;
    entries: CleanWeeklyPlannerEntry[];
    isWeekend?: boolean;
    emptyLabel: string;
    regular: PDFFont;
    bold: PDFFont;
  },
) {
  const theme = {
    card: options.isWeekend ? rgb(0.985, 0.989, 0.996) : rgb(1, 1, 1),
    header: options.isWeekend ? rgb(0.95, 0.97, 0.99) : rgb(0.97, 0.98, 1),
    border: rgb(0.84, 0.89, 0.95),
    title: rgb(0.14, 0.2, 0.31),
    muted: rgb(0.39, 0.46, 0.56),
    empty: rgb(0.49, 0.56, 0.66),
  };

  page.drawRectangle({
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    color: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
  });

  page.drawRectangle({
    x: options.x,
    y: options.y + options.height - 34,
    width: options.width,
    height: 34,
    color: theme.header,
  });

  page.drawText(options.dayLabel, {
    x: options.x + 10,
    y: options.y + options.height - 20,
    size: 12,
    font: options.bold,
    color: theme.title,
  });

  page.drawText(options.dateLabel, {
    x: options.x + 10,
    y: options.y + options.height - 31,
    size: 8,
    font: options.regular,
    color: theme.muted,
  });

  let cursor = options.y + options.height - 46;
  const bottomLimit = options.y + 12;

  if (!options.entries.length) {
    const lines = clampWrappedLines(
      options.emptyLabel,
      options.regular,
      8,
      options.width - 20,
      4,
    );
    drawTextLines(page, lines, options.x + 10, cursor, {
      font: options.regular,
      fontSize: 8,
      lineHeight: 10,
      color: theme.empty,
    });
    return;
  }

  for (let index = 0; index < options.entries.length; index += 1) {
    const entry = options.entries[index];
    const entryHeight = estimateEntryHeight(
      entry,
      options.width - 20,
      options.regular,
      options.bold,
    );

    if (cursor - entryHeight < bottomLimit) {
      const remaining = options.entries.length - index;
      page.drawText(`+ ${remaining} more`, {
        x: options.x + 10,
        y: Math.max(cursor - 4, bottomLimit),
        size: 8,
        font: options.bold,
        color: theme.muted,
      });
      return;
    }

    const drawnHeight = drawPlannerEntry(
      page,
      entry,
      options.x + 10,
      cursor,
      options.width - 20,
      options.regular,
      options.bold,
    );
    cursor -= drawnHeight + 8;
  }
}

function drawNotesCard(
  page: ReturnType<PDFDocument["addPage"]>,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    regular: PDFFont;
    bold: PDFFont;
  },
) {
  const theme = {
    card: rgb(0.995, 0.998, 0.994),
    header: rgb(0.955, 0.982, 0.96),
    border: rgb(0.82, 0.9, 0.84),
    title: rgb(0.14, 0.2, 0.31),
    muted: rgb(0.39, 0.46, 0.56),
    line: rgb(0.84, 0.89, 0.95),
  };

  page.drawRectangle({
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    color: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
  });

  page.drawRectangle({
    x: options.x,
    y: options.y + options.height - 34,
    width: options.width,
    height: 34,
    color: theme.header,
  });

  page.drawText("Family notes", {
    x: options.x + 10,
    y: options.y + options.height - 20,
    size: 12,
    font: options.bold,
    color: theme.title,
  });

  page.drawText("Meals, outings, supplies, or reminders", {
    x: options.x + 10,
    y: options.y + options.height - 31,
    size: 8,
    font: options.regular,
    color: theme.muted,
  });

  const lineGap = 24;
  let cursor = options.y + options.height - 56;
  const lineRight = options.x + options.width - 12;

  while (cursor > options.y + 18) {
    page.drawLine({
      start: { x: options.x + 12, y: cursor },
      end: { x: lineRight, y: cursor },
      thickness: 1,
      color: theme.line,
    });
    cursor -= lineGap;
  }
}

function drawPlannerFooter(
  page: ReturnType<PDFDocument["addPage"]>,
  regular: PDFFont,
  width: number,
  margin: number,
  y: number,
  lineColor: ReturnType<typeof rgb>,
  textColor: ReturnType<typeof rgb>,
) {
  page.drawLine({
    start: { x: margin, y: y + 17 },
    end: { x: width - margin, y: y + 17 },
    thickness: 1,
    color: lineColor,
  });

  const footerWidth = regular.widthOfTextAtSize(FOOTER_TEXT, 8.5);
  page.drawText(FOOTER_TEXT, {
    x: Math.max(margin, (width - footerWidth) / 2),
    y,
    size: 8.5,
    font: regular,
    color: textColor,
  });
}

export function buildCleanWeeklyPlannerEntriesFromCalendarItems(
  items: CleanCalendarItem[],
  labels: PlannerLabelMaps = {},
) {
  return items.map((item) => ({
    id: item.id,
    plannedDate: item.plannedDate,
    title: item.title,
    timeLabel: buildPlannerTimeLabel(item.startsAt, item.endsAt),
    learnerLabel: item.learnerId
      ? labels.learnerLabelById?.get(item.learnerId) ?? "Learner"
      : null,
    learningArea: normalizeLearningAreaLabel(item.learningArea) || null,
    programTitle: item.programId
      ? labels.programLabelById?.get(item.programId) ?? null
      : null,
    segmentTitle: item.programSegmentId
      ? labels.segmentLabelById?.get(item.programSegmentId) ?? null
      : null,
    sessionLabel: item.sessionLabel ?? null,
    notes: item.description ?? null,
  }));
}

export function buildCleanWeeklyPlannerEntriesFromTemplateBlocks(
  weekStartsOn: string,
  templateBlocks: CleanTemplateBlock[],
  labels: PlannerLabelMaps = {},
) {
  const weekDates = getWeekDates(weekStartsOn);

  return templateBlocks
    .filter((block) => block.weekday >= 1 && block.weekday <= 7)
    .map((block) => ({
      id: block.id,
      plannedDate: weekDates[block.weekday - 1] || weekStartsOn,
      title: block.title,
      timeLabel: buildPlannerTimeLabel(block.startsAt, block.endsAt),
      learnerLabel: block.learnerId
        ? labels.learnerLabelById?.get(block.learnerId) ?? "Learner"
        : null,
      learningArea: normalizeLearningAreaLabel(block.learningArea) || null,
      programTitle: block.programId
        ? labels.programLabelById?.get(block.programId) ?? null
        : null,
      segmentTitle: block.programSegmentId
        ? labels.segmentLabelById?.get(block.programSegmentId) ?? null
        : null,
      sessionLabel: block.sessionLabel ?? null,
      notes: block.notes ?? null,
    }));
}

export function buildCleanWeeklyPlannerPdfFilename(
  weekStartsOn: string,
) {
  const { year, week } = getIsoWeekParts(weekStartsOn);
  return `MyLearna-Weekly-Planner-${year}-W${String(week).padStart(2, "0")}.pdf`;
}

function getIsoWeekParts(value: string) {
  const parsed = new Date(`${safe(value)}T00:00:00Z`);
  const date = Number.isNaN(parsed.getTime())
    ? new Date()
    : new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));

  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return { year, week };
}

export function buildCleanMonthlyPlannerPdfFilename(
  familyName: string | null | undefined,
  monthStartsOn: string,
) {
  const familyPart = sanitizeFilePart(safe(familyName) || "family", "family");
  return `MyLearna-Monthly-Plan-${familyPart}-${monthStartsOn.slice(0, 7)}.pdf`;
}

export function buildCleanDailyPlannerPdfFilename(
  familyName: string | null | undefined,
  plannedDate: string,
) {
  const familyPart = sanitizeFilePart(safe(familyName) || "family", "family");
  return `MyLearna-Daily-Plan-${familyPart}-${plannedDate}.pdf`;
}

export async function generateCleanWeeklyPlannerPdfBytes(
  model: CleanWeeklyPlannerPdfModel,
) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([...LANDSCAPE_A4]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadSafeLogoImage(doc);

  const width = page.getWidth();
  const height = page.getHeight();
  const margin = 30;
  const headerHeight = 104;
  const footerHeight = 28;
  const hasEmptyState = model.entries.length === 0;
  const noticeHeight = hasEmptyState ? 36 : 0;
  const gridTop = height - margin - headerHeight - noticeHeight;
  const gridBottom = margin + footerHeight;
  const rowGap = 12;
  const columnGap = 12;
  const cardWidth = (width - margin * 2 - columnGap * 3) / 4;
  const cardHeight = (gridTop - gridBottom - rowGap) / 2;

  const theme = {
    background: rgb(1, 1, 1),
    header: rgb(0.96, 0.98, 0.995),
    accent: rgb(0.22, 0.45, 0.78),
    line: rgb(0.84, 0.89, 0.95),
    body: rgb(0.15, 0.23, 0.34),
    muted: rgb(0.39, 0.46, 0.56),
    empty: rgb(0.97, 0.98, 1),
  };

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: theme.background,
  });

  page.drawRectangle({
    x: margin,
    y: height - margin - headerHeight,
    width: width - margin * 2,
    height: headerHeight,
    color: theme.header,
    borderColor: theme.line,
    borderWidth: 1,
  });

  if (logo) {
    const targetWidth = 92;
    const scale = targetWidth / logo.width;
    page.drawImage(logo, {
      x: margin + 16,
      y: height - margin - 60,
      width: targetWidth,
      height: logo.height * scale,
    });
  }

  const titleX = logo ? margin + 124 : margin + 18;
  const labelText = [safe(model.familyName), safe(model.learnerLabel)]
    .filter(Boolean)
    .join(" • ");

  page.drawText("Weekly fridge plan", {
    x: titleX,
    y: height - margin - 26,
    size: 10,
    font: bold,
    color: theme.accent,
  });

  page.drawText("MyLearna Weekly Plan", {
    x: titleX,
    y: height - margin - 48,
    size: 24,
    font: bold,
    color: theme.body,
  });

  if (labelText) {
    page.drawText(labelText, {
      x: titleX,
      y: height - margin - 66,
      size: 10,
      font: regular,
      color: theme.muted,
    });
  }

  if (model.sourceLabel) {
    page.drawText(model.sourceLabel, {
      x: titleX,
      y: height - margin - 82,
      size: 9,
      font: regular,
      color: theme.muted,
    });
  }

  if (model.viewLabel) {
    page.drawText(model.viewLabel, {
      x: titleX,
      y: height - margin - 96,
      size: 8.5,
      font: regular,
      color: theme.muted,
    });
  }

  const weekPanelWidth = 180;
  const weekPanelHeight = 56;
  const weekPanelX = width - margin - weekPanelWidth - 16;
  const weekPanelY = height - margin - weekPanelHeight - 24;

  page.drawRectangle({
    x: weekPanelX,
    y: weekPanelY,
    width: weekPanelWidth,
    height: weekPanelHeight,
    color: rgb(1, 1, 1),
    borderColor: theme.line,
    borderWidth: 1,
  });

  page.drawText("Week", {
    x: weekPanelX + 12,
    y: weekPanelY + 38,
    size: 9,
    font: bold,
    color: theme.accent,
  });

  drawTextLines(
    page,
    clampWrappedLines(
      formatWeekRangeLabel(model.weekStartsOn, model.weekEndsOn),
      regular,
      10,
      weekPanelWidth - 24,
      2,
    ),
    weekPanelX + 12,
    weekPanelY + 24,
    {
      font: regular,
      fontSize: 10,
      lineHeight: 11,
      color: theme.body,
    },
  );

  if (hasEmptyState) {
    page.drawRectangle({
      x: margin,
      y: gridTop + 8,
      width: width - margin * 2,
      height: 28,
      color: theme.empty,
      borderColor: theme.line,
      borderWidth: 1,
    });

    page.drawText(EMPTY_WEEK_NOTE, {
      x: margin + 12,
      y: gridTop + 17,
      size: 10,
      font: regular,
      color: theme.muted,
    });
  }

  const entriesByDate = new Map<string, CleanWeeklyPlannerEntry[]>();
  model.entries.forEach((entry) => {
    const existing = entriesByDate.get(entry.plannedDate) ?? [];
    existing.push(entry);
    entriesByDate.set(entry.plannedDate, existing);
  });

  const weekDates =
    model.includedDates?.length ? model.includedDates : getWeekDates(model.weekStartsOn);

  if (weekDates.length <= 5) {
    const schoolCardWidth = (width - margin * 2 - columnGap * 4) / 5;
    const schoolCardHeight = gridTop - gridBottom;

    weekDates.forEach((dateValue, index) => {
      drawDayCard(page, {
        x: margin + index * (schoolCardWidth + columnGap),
        y: gridBottom,
        width: schoolCardWidth,
        height: schoolCardHeight,
        dayLabel: WEEKDAY_LABELS[index] || formatLongDateLabel(dateValue),
        dateLabel: formatLongDateLabel(dateValue),
        entries: entriesByDate.get(dateValue) ?? [],
        emptyLabel: hasEmptyState ? "No blocks planned" : "No blocks planned",
        regular,
        bold,
      });
    });
  } else {
    const topRowY = gridBottom + cardHeight + rowGap;
    const bottomRowY = gridBottom;

    weekDates.slice(0, 4).forEach((dateValue, index) => {
      drawDayCard(page, {
        x: margin + index * (cardWidth + columnGap),
        y: topRowY,
        width: cardWidth,
        height: cardHeight,
        dayLabel: WEEKDAY_LABELS[index] || formatLongDateLabel(dateValue),
        dateLabel: formatLongDateLabel(dateValue),
        entries: entriesByDate.get(dateValue) ?? [],
        emptyLabel: hasEmptyState ? "No blocks planned" : "No blocks planned",
        regular,
        bold,
      });
    });

    weekDates.slice(4).forEach((dateValue, index) => {
      drawDayCard(page, {
        x: margin + index * (cardWidth + columnGap),
        y: bottomRowY,
        width: cardWidth,
        height: cardHeight,
        dayLabel: WEEKDAY_LABELS[index + 4] || formatLongDateLabel(dateValue),
        dateLabel: formatLongDateLabel(dateValue),
        entries: entriesByDate.get(dateValue) ?? [],
        emptyLabel: hasEmptyState ? "No blocks planned" : "No blocks planned",
        isWeekend: index >= 1,
        regular,
        bold,
      });
    });

    drawNotesCard(page, {
      x: margin + 3 * (cardWidth + columnGap),
      y: bottomRowY,
      width: cardWidth,
      height: cardHeight,
      regular,
      bold,
    });
  }

  drawPlannerFooter(page, regular, width, margin, margin + 4, theme.line, theme.muted);

  return await doc.save();
}

export async function generateCleanMonthlyPlannerPdfBytes(
  model: CleanMonthlyPlannerPdfModel,
) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([...LANDSCAPE_A4]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadSafeLogoImage(doc);
  const width = page.getWidth();
  const height = page.getHeight();
  const margin = 30;
  const theme = {
    background: rgb(1, 1, 1),
    header: rgb(0.96, 0.98, 0.995),
    accent: rgb(0.22, 0.45, 0.78),
    line: rgb(0.84, 0.89, 0.95),
    body: rgb(0.15, 0.23, 0.34),
    muted: rgb(0.39, 0.46, 0.56),
    outside: rgb(0.97, 0.98, 1),
  };

  page.drawRectangle({ x: 0, y: 0, width, height, color: theme.background });
  page.drawRectangle({
    x: margin,
    y: height - margin - 78,
    width: width - margin * 2,
    height: 78,
    color: theme.header,
    borderColor: theme.line,
    borderWidth: 1,
  });

  if (logo) {
    const targetWidth = 86;
    const scale = targetWidth / logo.width;
    page.drawImage(logo, {
      x: margin + 16,
      y: height - margin - 52,
      width: targetWidth,
      height: logo.height * scale,
    });
  }

  const titleX = logo ? margin + 118 : margin + 18;
  const labelText = [safe(model.familyName), safe(model.learnerLabel)]
    .filter(Boolean)
    .join(" • ");

  page.drawText("MyLearna Monthly Plan", {
    x: titleX,
    y: height - margin - 30,
    size: 24,
    font: bold,
    color: theme.body,
  });
  page.drawText(formatMonthLabel(model.monthStartsOn), {
    x: titleX,
    y: height - margin - 50,
    size: 12,
    font: regular,
    color: theme.muted,
  });
  if (labelText) {
    page.drawText(labelText, {
      x: titleX,
      y: height - margin - 66,
      size: 9,
      font: regular,
      color: theme.muted,
    });
  }

  const entriesByDate = new Map<string, CleanWeeklyPlannerEntry[]>();
  model.entries.forEach((entry) => {
    const existing = entriesByDate.get(entry.plannedDate) ?? [];
    existing.push(entry);
    entriesByDate.set(entry.plannedDate, existing);
  });

  const monthStart = getMonthStart(model.monthStartsOn);
  const dates = getMonthGridDates(monthStart);
  const gridTop = height - margin - 112;
  const footerY = margin + 4;
  const gridBottom = margin + 28;
  const columnGap = 6;
  const rowGap = 7;
  const cellWidth = (width - margin * 2 - columnGap * 6) / 7;
  const headerHeight = 18;
  const cellHeight = (gridTop - gridBottom - headerHeight - rowGap * 5) / 6;

  WEEKDAY_LABELS.forEach((label, index) => {
    page.drawText(label.slice(0, 3).toUpperCase(), {
      x: margin + index * (cellWidth + columnGap) + 4,
      y: gridTop,
      size: 8,
      font: bold,
      color: theme.muted,
    });
  });

  dates.forEach((dateValue, index) => {
    const column = index % 7;
    const row = Math.floor(index / 7);
    const x = margin + column * (cellWidth + columnGap);
    const y = gridTop - headerHeight - row * (cellHeight + rowGap) - cellHeight;
    const entries = entriesByDate.get(dateValue) ?? [];
    const outsideMonth = getMonthStart(dateValue) !== monthStart;

    page.drawRectangle({
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      color: outsideMonth ? theme.outside : rgb(1, 1, 1),
      borderColor: theme.line,
      borderWidth: 1,
    });

    page.drawText(formatDateLabel(dateValue, { day: "numeric" }), {
      x: x + 7,
      y: y + cellHeight - 14,
      size: 8.5,
      font: bold,
      color: outsideMonth ? theme.muted : theme.body,
    });

    let cursor = y + cellHeight - 28;
    entries.slice(0, 3).forEach((entry) => {
      const line = ellipsizeText(entry.title, regular, 7.5, cellWidth - 14);
      page.drawText(line, {
        x: x + 7,
        y: cursor,
        size: 7.5,
        font: regular,
        color: theme.body,
      });
      cursor -= 10;
    });

    if (entries.length > 3) {
      page.drawText(`+ ${entries.length - 3} more`, {
        x: x + 7,
        y: cursor,
        size: 7.5,
        font: bold,
        color: theme.accent,
      });
    }
  });

  drawPlannerFooter(page, regular, width, margin, footerY, theme.line, theme.muted);
  return await doc.save();
}

export async function generateCleanDailyPlannerPdfBytes(model: CleanDailyPlannerPdfModel) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadSafeLogoImage(doc);
  const width = page.getWidth();
  const height = page.getHeight();
  const margin = 46;
  const theme = {
    background: rgb(1, 1, 1),
    header: rgb(0.96, 0.98, 0.995),
    accent: rgb(0.22, 0.45, 0.78),
    line: rgb(0.84, 0.89, 0.95),
    body: rgb(0.15, 0.23, 0.34),
    muted: rgb(0.39, 0.46, 0.56),
    surface: rgb(0.97, 0.98, 1),
  };

  page.drawRectangle({ x: 0, y: 0, width, height, color: theme.background });
  page.drawRectangle({
    x: margin,
    y: height - margin - 94,
    width: width - margin * 2,
    height: 94,
    color: theme.header,
    borderColor: theme.line,
    borderWidth: 1,
  });

  if (logo) {
    const targetWidth = 92;
    const scale = targetWidth / logo.width;
    page.drawImage(logo, {
      x: margin + 14,
      y: height - margin - 58,
      width: targetWidth,
      height: logo.height * scale,
    });
  }

  const titleX = logo ? margin + 124 : margin + 16;
  const labelText = [safe(model.familyName), safe(model.learnerLabel)]
    .filter(Boolean)
    .join(" • ");
  page.drawText("MyLearna Daily Plan", {
    x: titleX,
    y: height - margin - 32,
    size: 24,
    font: bold,
    color: theme.body,
  });
  page.drawText(formatLongDateLabel(model.plannedDate), {
    x: titleX,
    y: height - margin - 54,
    size: 12,
    font: regular,
    color: theme.muted,
  });
  if (labelText) {
    page.drawText(labelText, {
      x: titleX,
      y: height - margin - 72,
      size: 9.5,
      font: regular,
      color: theme.muted,
    });
  }

  let cursor = height - margin - 126;
  const cardWidth = width - margin * 2;
  const footerLimit = margin + 54;
  const entries = [...model.entries].sort((left, right) =>
    (left.timeLabel || "").localeCompare(right.timeLabel || "") || left.title.localeCompare(right.title),
  );

  if (!entries.length) {
    page.drawRectangle({
      x: margin,
      y: cursor - 74,
      width: cardWidth,
      height: 74,
      color: theme.surface,
      borderColor: theme.line,
      borderWidth: 1,
    });
    page.drawText("No blocks planned", {
      x: margin + 16,
      y: cursor - 24,
      size: 14,
      font: bold,
      color: theme.body,
    });
    page.drawText("Use this open space to sketch the day as it unfolds.", {
      x: margin + 16,
      y: cursor - 44,
      size: 10,
      font: regular,
      color: theme.muted,
    });
    cursor -= 92;
  } else {
    entries.forEach((entry) => {
      if (cursor < footerLimit + 92) return;
      const lines = clampWrappedLines(entry.title, bold, 12, cardWidth - 70, 2);
      const metaLines = buildEntryMetaLines(entry).flatMap((line) =>
        clampWrappedLines(line, regular, 9, cardWidth - 70, 1),
      );
      const notesLines = entry.notes
        ? clampWrappedLines(entry.notes, regular, 9, cardWidth - 70, 2)
        : [];
      const cardHeight = Math.max(
        66,
        22 + lines.length * 14 + metaLines.length * 11 + notesLines.length * 11,
      );

      page.drawRectangle({
        x: margin,
        y: cursor - cardHeight,
        width: cardWidth,
        height: cardHeight,
        color: rgb(1, 1, 1),
        borderColor: theme.line,
        borderWidth: 1,
      });
      page.drawRectangle({
        x: margin + 14,
        y: cursor - 31,
        width: 14,
        height: 14,
        borderColor: theme.accent,
        borderWidth: 1.2,
      });
      if (entry.timeLabel) {
        page.drawText(entry.timeLabel, {
          x: margin + 42,
          y: cursor - 18,
          size: 8.5,
          font: bold,
          color: theme.accent,
        });
      }

      let textCursor = cursor - (entry.timeLabel ? 33 : 22);
      textCursor = drawTextLines(page, lines, margin + 42, textCursor, {
        font: bold,
        fontSize: 12,
        lineHeight: 14,
        color: theme.body,
      });
      textCursor = drawTextLines(page, metaLines, margin + 42, textCursor - 1, {
        font: regular,
        fontSize: 9,
        lineHeight: 11,
        color: theme.muted,
      });
      drawTextLines(page, notesLines, margin + 42, textCursor - 2, {
        font: regular,
        fontSize: 9,
        lineHeight: 11,
        color: theme.muted,
      });

      cursor -= cardHeight + 10;
    });
  }

  page.drawText("Notes", {
    x: margin,
    y: Math.max(cursor - 8, footerLimit + 84),
    size: 13,
    font: bold,
    color: theme.body,
  });
  let noteY = Math.max(cursor - 30, footerLimit + 62);
  while (noteY > footerLimit + 8) {
    page.drawLine({
      start: { x: margin, y: noteY },
      end: { x: width - margin, y: noteY },
      thickness: 1,
      color: theme.line,
    });
    noteY -= 24;
  }

  drawPlannerFooter(page, regular, width, margin, margin + 18, theme.line, theme.muted);
  return await doc.save();
}
