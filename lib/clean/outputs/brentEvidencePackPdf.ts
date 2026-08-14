import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import {
  BRENT_COUNTRY_LABEL,
  BRENT_DISCLAIMER,
  BRENT_EMPTY_EVIDENCE_COPY,
  BRENT_FOOTER_DISCLAIMER,
  BRENT_LOCAL_AUTHORITY_LABEL,
  BRENT_NATION_LABEL,
  BRENT_OUTPUT_TITLE,
} from "@/lib/clean/authority/brent";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import type { FamilyProfile } from "@/lib/clean/family/types";
import type { Learner } from "@/lib/clean/learners/types";
import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";
import type {
  CleanReport,
  CleanReportSection,
  CleanReportingPeriod,
} from "@/lib/clean/reports/types";

export type BrentEvidencePackField = {
  label: string;
  value: string;
};

export type BrentEvidencePackOutcome = {
  focusArea: string;
  progressObserved: string;
  evidenceUsed: string;
  nextSupportNeeded: string;
};

export type BrentEvidencePackEvidenceItem = {
  id: string;
  observedOn: string | null;
  observedOnLabel: string;
  learnerLabel: string;
  learningArea: string;
  title: string;
  summary: string;
  programLabel: string | null;
  segmentLabel: string | null;
  isHighlighted: boolean;
};

export type BrentEvidencePackEvidenceGroup = {
  title: string;
  items: BrentEvidencePackEvidenceItem[];
};

export type BrentEvidencePackAcademicSection = {
  title: string;
  summary: string;
  evidenceExamples: string;
};

export type BrentEvidencePackSendArea = {
  title: string;
  strengthsProgress: string;
  currentNeedsSupport: string;
  evidenceExamples: string;
};

export type BrentEvidencePackPromptResponse = {
  prompt: string;
  response: string;
};

export type BrentEvidencePackNextStep = {
  label: string;
  value: string;
};

export type BrentEvidencePackModel = {
  title: string;
  disclaimer: string;
  footerDisclaimer: string;
  preparedNote: string;
  familyName: string;
  learnerName: string;
  localAuthorityLabel: string;
  nationLabel: string;
  countryLabel: string;
  generatedOnLabel: string;
  reportingPeriodLabel: string;
  sourceReportTitle: string | null;
  learnerDetails: BrentEvidencePackField[];
  parentCarerDetails: BrentEvidencePackField[];
  contributors: string[];
  learningOverview: BrentEvidencePackField[];
  progressAgainstOutcomes: BrentEvidencePackOutcome[];
  evidenceOfAttainment: BrentEvidencePackEvidenceGroup[];
  academicProgress: BrentEvidencePackAcademicSection[];
  sendAreas: BrentEvidencePackSendArea[];
  youngPersonViews: BrentEvidencePackPromptResponse[];
  parentCarerViews: BrentEvidencePackPromptResponse[];
  nextSteps: BrentEvidencePackNextStep[];
  evidenceAppendix: BrentEvidencePackEvidenceItem[];
  evidenceCount: number;
  highlightedEvidenceCount: number;
  hasEvidence: boolean;
};

export type BuildBrentEvidencePackModelInput = {
  profile: FamilyProfile;
  learner: Learner;
  reportingPeriods: CleanReportingPeriod[];
  sourceReport: CleanReport | null;
  sourceReportSections: CleanReportSection[];
  portfolioItems: CleanPortfolioItem[];
  calendarItems: CleanCalendarItem[];
  learnerLabelById?: Map<string, string>;
  programLabelById?: Map<string, string>;
  segmentLabelById?: Map<string, string>;
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

const LOGO_PATH = "/branding/mylearna-logo.png";
const NOT_RECORDED_YET = "Not recorded in MyLearna yet.";
const NO_FORMAL_OUTCOMES_YET =
  "No formal outcomes have been added yet. Use Quick Capture, My Portfolio, and My Reports to build supporting evidence.";
const NO_ATTENDANCE_NOTE =
  "No attendance percentage is calculated in this prototype.";
const NO_EVIDENCE_IN_AREA = "No evidence recorded in this area yet.";
const NO_SEND_NOTES = "No notes recorded in this area yet.";

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

function formatDateRange(startsOn: string | null | undefined, endsOn: string | null | undefined) {
  if (!safe(startsOn) || !safe(endsOn)) return NOT_RECORDED_YET;
  return `${formatDateLabel(startsOn)} to ${formatDateLabel(endsOn)}`;
}

function formatDisplayName(learner: Learner) {
  const preferred = safe(learner.preferredName);
  const firstName = safe(learner.firstName);
  const surname = safe(learner.surname);
  const givenName = preferred || firstName;

  return surname ? `${givenName} ${surname}` : givenName;
}

function findLearnerReportingPeriod(
  reportingPeriods: CleanReportingPeriod[],
  sourceReport: CleanReport | null,
) {
  if (sourceReport) {
    const matched = reportingPeriods.find(
      (period) => period.id === sourceReport.reportingPeriodId,
    );
    if (matched) return matched;
  }

  return reportingPeriods[0] ?? null;
}

function tokenize(text: string) {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function matchesKeywords(text: string, keywords: string[]) {
  const tokens = tokenize(text);
  return keywords.some((keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    return tokens.some(
      (token) =>
        token === normalizedKeyword ||
        token.includes(normalizedKeyword) ||
        normalizedKeyword.includes(token),
    );
  });
}

function findSectionMatch(
  sections: CleanReportSection[],
  keywords: string[],
) {
  return (
    sections.find((section) =>
      matchesKeywords(`${section.heading} ${section.content}`, keywords),
    ) ?? null
  );
}

function findEvidenceMatches(
  items: BrentEvidencePackEvidenceItem[],
  keywords: string[],
) {
  return items.filter((item) =>
    matchesKeywords(
      `${item.learningArea} ${item.title} ${item.summary} ${safe(item.programLabel)}`,
      keywords,
    ),
  );
}

function pickPromptResponse(
  sections: CleanReportSection[],
  prompts: Array<{ prompt: string; keywords: string[] }>,
) {
  return prompts.map((item) => {
    const match = findSectionMatch(sections, item.keywords);
    return {
      prompt: item.prompt,
      response: match ? summarizeText(match.content, 260) : NOT_RECORDED_YET,
    };
  });
}

function buildEvidenceItems(
  input: BuildBrentEvidencePackModelInput,
) {
  const calendarItemById = new Map(
    input.calendarItems.map((item) => [item.id, item]),
  );

  return input.portfolioItems.map((item) => {
    const linkedCalendarItem = item.evidence.calendarItemId
      ? calendarItemById.get(item.evidence.calendarItemId) ?? null
      : null;
    const title = safe(item.evidence.title) || summarizeText(item.evidence.whatHappened, 56);
    const programLabel =
      (item.evidence.programId
        ? input.programLabelById?.get(item.evidence.programId) ?? null
        : null) ||
      (linkedCalendarItem?.programId
        ? input.programLabelById?.get(linkedCalendarItem.programId) ?? null
        : null);
    const segmentLabel =
      linkedCalendarItem?.programSegmentId
        ? input.segmentLabelById?.get(linkedCalendarItem.programSegmentId) ?? null
        : null;
    const learningArea =
      safe(item.evidence.learningArea) ||
      safe(linkedCalendarItem?.learningArea) ||
      "General learning";

    return {
      id: item.evidence.id,
      observedOn: item.evidence.observedOn,
      observedOnLabel: formatDateLabel(item.evidence.observedOn),
      learnerLabel:
        input.learnerLabelById?.get(item.evidence.learnerId) || input.learner.firstName,
      learningArea,
      title: title || "Learning evidence",
      summary:
        summarizeText(item.highlight?.note, 180) ||
        summarizeText(item.evidence.reflection, 180) ||
        summarizeText(item.evidence.whatHappened, 180),
      programLabel,
      segmentLabel,
      isHighlighted: item.isHighlighted,
    };
  });
}

function buildOutcomeRows(
  sections: CleanReportSection[],
  evidenceItems: BrentEvidencePackEvidenceItem[],
) {
  if (!sections.length) return [] as BrentEvidencePackOutcome[];

  return sections.slice(0, 6).map((section) => {
    const matchedEvidence = findEvidenceMatches(evidenceItems, tokenize(section.heading)).slice(
      0,
      3,
    );

    return {
      focusArea: section.heading || "Outcome / focus area",
      progressObserved: summarizeText(section.content, 260) || NOT_RECORDED_YET,
      evidenceUsed: matchedEvidence.length
        ? matchedEvidence.map((item) => item.title).join("; ")
        : BRENT_EMPTY_EVIDENCE_COPY,
      nextSupportNeeded:
        summarizeText(findSectionMatch(sections, ["next", "support", section.heading])?.content, 180) ||
        "Add next support notes in My Reports when they are available.",
    };
  });
}

function buildEvidenceGroups(evidenceItems: BrentEvidencePackEvidenceItem[]) {
  const groups = new Map<string, BrentEvidencePackEvidenceItem[]>();

  evidenceItems.forEach((item) => {
    const key = item.learningArea || "General learning";
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  });

  return [...groups.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([title, items]) => ({
      title,
      items: [...items].sort((left, right) => safe(left.observedOn).localeCompare(safe(right.observedOn))),
    }));
}

function buildAcademicSection(
  title: string,
  items: BrentEvidencePackEvidenceItem[],
  sections: CleanReportSection[],
  keywords: string[],
) {
  const matchedItems = items.filter((item) =>
    keywords.some((keyword) =>
      item.learningArea.toLowerCase().includes(keyword.toLowerCase()),
    ),
  );
  const relevantItems = matchedItems.length ? matchedItems : items;
  const sectionMatch = findSectionMatch(sections, keywords);

  if (!relevantItems.length && !sectionMatch) {
    return {
      title,
      summary: NO_EVIDENCE_IN_AREA,
      evidenceExamples: NO_EVIDENCE_IN_AREA,
    };
  }

  return {
    title,
    summary:
      summarizeText(sectionMatch?.content, 220) ||
      `${relevantItems.length} evidence item${relevantItems.length === 1 ? "" : "s"} recorded. ${
        relevantItems[relevantItems.length - 1]
          ? `Latest example: ${relevantItems[relevantItems.length - 1].title}.`
          : ""
      }`.trim(),
    evidenceExamples: relevantItems.length
      ? relevantItems.slice(0, 3).map((item) => item.title).join("; ")
      : NO_EVIDENCE_IN_AREA,
  };
}

function buildSendArea(
  title: string,
  sections: CleanReportSection[],
  evidenceItems: BrentEvidencePackEvidenceItem[],
  keywords: string[],
) {
  const sectionMatch = findSectionMatch(sections, keywords);
  const evidenceMatches = findEvidenceMatches(evidenceItems, keywords).slice(0, 3);

  return {
    title,
    strengthsProgress:
      summarizeText(sectionMatch?.content, 220) ||
      (evidenceMatches.length
        ? "Examples have been captured in this area through day-to-day learning evidence."
        : NO_SEND_NOTES),
    currentNeedsSupport:
      sectionMatch
        ? "Current needs and support can be refined further in My Reports as the review pack develops."
        : NO_SEND_NOTES,
    evidenceExamples: evidenceMatches.length
      ? evidenceMatches.map((item) => item.title).join("; ")
      : NO_SEND_NOTES,
  };
}

function buildLearningOverview(
  reportingPeriod: CleanReportingPeriod | null,
  reportingPeriods: CleanReportingPeriod[],
  calendarItems: CleanCalendarItem[],
) {
  const uniqueBlockTitles = [...new Set(calendarItems.map((item) => safe(item.title)).filter(Boolean))];
  const reportingYearLabel = reportingPeriod?.title || reportingPeriods[0]?.title || NOT_RECORDED_YET;
  const periodsLabel = reportingPeriods.length
    ? reportingPeriods.slice(0, 5).map((period) => period.title).join("; ")
    : NOT_RECORDED_YET;

  return [
    {
      label: "School year / reporting year",
      value: reportingYearLabel,
    },
    {
      label: "Learning period dates",
      value: reportingPeriod
        ? formatDateRange(reportingPeriod.startsOn, reportingPeriod.endsOn)
        : NOT_RECORDED_YET,
    },
    {
      label: "Learning periods",
      value: periodsLabel,
    },
    {
      label: "Weekly rhythm / calendar blocks summary",
      value: uniqueBlockTitles.length
        ? `${calendarItems.length} planned block${calendarItems.length === 1 ? "" : "s"} recorded. Examples: ${uniqueBlockTitles.slice(0, 6).join("; ")}`
        : "Weekly rhythm has not been planned in MyLearna yet.",
    },
    {
      label: "Attendance / engagement note",
      value: NO_ATTENDANCE_NOTE,
    },
  ];
}

export function buildBrentEvidencePackModel(
  input: BuildBrentEvidencePackModelInput,
): BrentEvidencePackModel {
  const learnerName = formatDisplayName(input.learner);
  const reportingPeriod = findLearnerReportingPeriod(
    input.reportingPeriods,
    input.sourceReport,
  );
  const generatedOnLabel = formatDateLabel(
    safe(input.generatedOn) || new Date().toISOString().slice(0, 10),
  );
  const evidenceItems = buildEvidenceItems(input);
  const evidenceGroups = buildEvidenceGroups(evidenceItems);
  const highlightedEvidenceCount = evidenceItems.filter((item) => item.isHighlighted).length;
  const sourceSections = [...input.sourceReportSections].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return {
    title: BRENT_OUTPUT_TITLE,
    disclaimer: BRENT_DISCLAIMER,
    footerDisclaimer: BRENT_FOOTER_DISCLAIMER,
    preparedNote:
      "Prepared as a supporting evidence pack aligned to Brent annual review expectations.",
    familyName: input.profile.displayName || "MyLearna family",
    learnerName,
    localAuthorityLabel: BRENT_LOCAL_AUTHORITY_LABEL,
    nationLabel: BRENT_NATION_LABEL,
    countryLabel: BRENT_COUNTRY_LABEL,
    generatedOnLabel,
    reportingPeriodLabel: reportingPeriod
      ? `${reportingPeriod.title} (${formatDateRange(
          reportingPeriod.startsOn,
          reportingPeriod.endsOn,
        )})`
      : NOT_RECORDED_YET,
    sourceReportTitle: input.sourceReport?.title || null,
    learnerDetails: [
      { label: "Learner name", value: learnerName || NOT_RECORDED_YET },
      {
        label: "Preferred name",
        value: safe(input.learner.preferredName) || NOT_RECORDED_YET,
      },
      { label: "Date of birth", value: NOT_RECORDED_YET },
      {
        label: "Year level / year group",
        value: safe(input.learner.yearLevel) || NOT_RECORDED_YET,
      },
      { label: "Home language", value: NOT_RECORDED_YET },
      { label: "Parent / carer contact", value: NOT_RECORDED_YET },
    ],
    parentCarerDetails: [
      {
        label: "Family display name",
        value: input.profile.displayName || NOT_RECORDED_YET,
      },
      { label: "Parent / carer name", value: NOT_RECORDED_YET },
      { label: "Email", value: NOT_RECORDED_YET },
      { label: "Phone", value: NOT_RECORDED_YET },
      { label: "Address", value: NOT_RECORDED_YET },
    ],
    contributors: [
      learnerName,
      input.profile.displayName || "Family record",
      input.sourceReport?.title ? `Report notes: ${input.sourceReport.title}` : "MyLearna evidence records",
    ],
    learningOverview: buildLearningOverview(
      reportingPeriod,
      input.reportingPeriods,
      input.calendarItems,
    ),
    progressAgainstOutcomes: buildOutcomeRows(sourceSections, evidenceItems),
    evidenceOfAttainment: evidenceGroups,
    academicProgress: [
      buildAcademicSection("English", evidenceItems, sourceSections, ["english", "literacy", "reading", "writing"]),
      buildAcademicSection("Mathematics", evidenceItems, sourceSections, ["mathematics", "math", "numeracy"]),
      buildAcademicSection("Science", evidenceItems, sourceSections, ["science", "stem"]),
      buildAcademicSection("Other learning areas", evidenceItems.filter((item) => {
        const area = item.learningArea.toLowerCase();
        return !area.includes("english") && !area.includes("math") && !area.includes("mathematics") && !area.includes("science");
      }), sourceSections, ["humanities", "art", "technology", "languages", "health", "music"]),
    ],
    sendAreas: [
      buildSendArea(
        "Communication and interaction",
        sourceSections,
        evidenceItems,
        ["communication", "interaction", "speech", "language"],
      ),
      buildSendArea(
        "Cognition and learning",
        sourceSections,
        evidenceItems,
        ["cognition", "learning", "attention", "memory", "processing"],
      ),
      buildSendArea(
        "Social, emotional and mental health",
        sourceSections,
        evidenceItems,
        ["social", "emotional", "mental", "wellbeing", "anxiety", "regulation"],
      ),
      buildSendArea(
        "Physical and sensory",
        sourceSections,
        evidenceItems,
        ["physical", "sensory", "mobility", "hearing", "vision", "motor"],
      ),
    ],
    youngPersonViews: pickPromptResponse(sourceSections, [
      { prompt: "What I like", keywords: ["like", "enjoy", "interests", "favourite"] },
      { prompt: "What is working", keywords: ["working", "success", "strength", "progress"] },
      { prompt: "What is not working", keywords: ["not working", "challenge", "difficult", "barrier"] },
      { prompt: "Hopes, dreams and aspirations", keywords: ["hope", "dream", "aspiration", "future"] },
      { prompt: "Support I need to stay healthy and safe", keywords: ["healthy", "safe", "support", "wellbeing"] },
    ]),
    parentCarerViews: pickPromptResponse(sourceSections, [
      { prompt: "Progress seen this year", keywords: ["parent", "carer", "family", "progress"] },
      { prompt: "What is working", keywords: ["parent", "carer", "working", "strength"] },
      { prompt: "What is not working", keywords: ["parent", "carer", "concern", "barrier"] },
      { prompt: "Concerns", keywords: ["concern", "worry", "risk"] },
      { prompt: "Aspirations / hopes", keywords: ["aspiration", "hope", "future"] },
      { prompt: "Support needed", keywords: ["support", "needs", "help"] },
    ]),
    nextSteps: [
      {
        label: "Suggested next steps",
        value:
          summarizeText(findSectionMatch(sourceSections, ["next", "steps"])?.content, 220) ||
          NOT_RECORDED_YET,
      },
      {
        label: "Future outcomes",
        value:
          summarizeText(findSectionMatch(sourceSections, ["future", "outcomes", "goals"])?.content, 220) ||
          NOT_RECORDED_YET,
      },
      {
        label: "Support needed",
        value:
          summarizeText(findSectionMatch(sourceSections, ["support", "needed", "provision"])?.content, 220) ||
          NOT_RECORDED_YET,
      },
      {
        label: "Review notes",
        value:
          summarizeText(findSectionMatch(sourceSections, ["review", "summary", "notes"])?.content, 220) ||
          NOT_RECORDED_YET,
      },
    ],
    evidenceAppendix: evidenceItems,
    evidenceCount: evidenceItems.length,
    highlightedEvidenceCount,
    hasEvidence: evidenceItems.length > 0,
  };
}

export function buildBrentEvidencePackPdfFilename(
  learnerName: string,
  generatedOnLabel: string,
) {
  const learnerPart = sanitizeFilePart(learnerName || "learner", "learner");
  const datePart = sanitizeFilePart(generatedOnLabel || "pack", "pack");
  return `MyLearna-Brent-EHCP-Evidence-Pack-${learnerPart}-${datePart}.pdf`;
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
  const lines = wrapText(text, font, fontSize, composer.width - composer.margin * 2);
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

function drawHeading(composer: PdfComposer, text: string, level: 1 | 2 = 1) {
  const fontSize = level === 1 ? 19 : 14;
  const spacingBefore = level === 1 ? 14 : 10;
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

function drawFieldRows(
  composer: PdfComposer,
  fields: BrentEvidencePackField[],
) {
  let next = composer;

  fields.forEach((field) => {
    next = ensureSpace(next, 34);
    next.page.drawRectangle({
      x: next.margin,
      y: next.y - 26,
      width: next.width - next.margin * 2,
      height: 28,
      color: next.theme.surface,
      borderColor: next.theme.line,
      borderWidth: 1,
    });

    next.page.drawText(`${field.label}:`, {
      x: next.margin + 10,
      y: next.y - 11,
      size: 9,
      font: next.bold,
      color: next.theme.heading,
    });

    const valueLines = wrapText(
      field.value,
      next.regular,
      9,
      next.width - next.margin * 2 - 140,
    );
    const firstValue = valueLines[0] || "";
    next.page.drawText(firstValue, {
      x: next.margin + 108,
      y: next.y - 11,
      size: 9,
      font: next.regular,
      color: next.theme.body,
    });
    next.y -= 34;

    valueLines.slice(1).forEach((line) => {
      next = drawTextBlock(next, line, {
        fontSize: 9,
        lineHeight: 11,
        spacingAfter: 2,
      });
    });
  });

  return next;
}

function drawBulletList(composer: PdfComposer, items: string[]) {
  if (!items.length) {
    return drawTextBlock(composer, NOT_RECORDED_YET);
  }

  let next = composer;
  items.forEach((item) => {
    next = drawTextBlock(next, `- ${item}`, {
      fontSize: 10,
      lineHeight: 13,
      spacingAfter: 4,
    });
  });
  return next;
}

function drawOutcomeRows(
  composer: PdfComposer,
  outcomes: BrentEvidencePackOutcome[],
) {
  if (!outcomes.length) {
    return drawTextBlock(composer, NO_FORMAL_OUTCOMES_YET);
  }

  let next = composer;
  outcomes.forEach((outcome) => {
    next = drawTextBlock(next, outcome.focusArea, {
      font: next.bold,
      fontSize: 11,
      lineHeight: 13,
      spacingAfter: 3,
      color: next.theme.heading,
    });
    next = drawTextBlock(next, `Progress observed: ${outcome.progressObserved}`, {
      fontSize: 9,
      lineHeight: 11,
      spacingAfter: 2,
    });
    next = drawTextBlock(next, `Evidence used: ${outcome.evidenceUsed}`, {
      fontSize: 9,
      lineHeight: 11,
      spacingAfter: 2,
    });
    next = drawTextBlock(next, `Next support needed: ${outcome.nextSupportNeeded}`, {
      fontSize: 9,
      lineHeight: 11,
      spacingAfter: 6,
    });
  });
  return next;
}

function drawEvidenceGroups(
  composer: PdfComposer,
  groups: BrentEvidencePackEvidenceGroup[],
) {
  if (!groups.length) {
    return drawTextBlock(composer, BRENT_EMPTY_EVIDENCE_COPY);
  }

  let next = composer;
  groups.forEach((group) => {
    next = drawHeading(next, group.title, 2);
    group.items.slice(0, 8).forEach((item) => {
      next = drawTextBlock(
        next,
        `${item.observedOnLabel} | ${item.title}${item.programLabel ? ` | Program: ${item.programLabel}` : ""}`,
        {
          font: next.bold,
          fontSize: 9.5,
          lineHeight: 11,
          spacingAfter: 2,
        },
      );
      next = drawTextBlock(next, item.summary, {
        fontSize: 9,
        lineHeight: 11,
        spacingAfter: 6,
      });
    });
  });
  return next;
}

function drawPromptResponses(
  composer: PdfComposer,
  items: BrentEvidencePackPromptResponse[],
) {
  let next = composer;
  items.forEach((item) => {
    next = drawTextBlock(next, item.prompt, {
      font: next.bold,
      fontSize: 10,
      lineHeight: 12,
      spacingAfter: 2,
    });
    next = drawTextBlock(next, item.response, {
      fontSize: 9.5,
      lineHeight: 12,
      spacingAfter: 8,
    });
  });
  return next;
}

function drawAcademicSections(
  composer: PdfComposer,
  sections: BrentEvidencePackAcademicSection[],
) {
  let next = composer;
  sections.forEach((section) => {
    next = drawHeading(next, section.title, 2);
    next = drawTextBlock(next, section.summary, {
      fontSize: 9.5,
      lineHeight: 12,
      spacingAfter: 4,
    });
    next = drawTextBlock(next, `Evidence examples: ${section.evidenceExamples}`, {
      fontSize: 9,
      lineHeight: 11,
      spacingAfter: 8,
    });
  });
  return next;
}

function drawSendAreas(
  composer: PdfComposer,
  areas: BrentEvidencePackSendArea[],
) {
  let next = composer;
  areas.forEach((area) => {
    next = drawHeading(next, area.title, 2);
    next = drawTextBlock(next, `Strengths / progress: ${area.strengthsProgress}`, {
      fontSize: 9.5,
      lineHeight: 12,
      spacingAfter: 3,
    });
    next = drawTextBlock(next, `Current needs / support: ${area.currentNeedsSupport}`, {
      fontSize: 9.5,
      lineHeight: 12,
      spacingAfter: 3,
    });
    next = drawTextBlock(next, `Evidence / examples: ${area.evidenceExamples}`, {
      fontSize: 9.5,
      lineHeight: 12,
      spacingAfter: 8,
    });
  });
  return next;
}

function drawNextSteps(
  composer: PdfComposer,
  nextSteps: BrentEvidencePackNextStep[],
) {
  let next = composer;
  nextSteps.forEach((step) => {
    next = drawTextBlock(next, step.label, {
      font: next.bold,
      fontSize: 10,
      lineHeight: 12,
      spacingAfter: 2,
    });
    next = drawTextBlock(next, step.value, {
      fontSize: 9.5,
      lineHeight: 12,
      spacingAfter: 8,
    });
  });
  return next;
}

function drawAppendix(
  composer: PdfComposer,
  appendixItems: BrentEvidencePackEvidenceItem[],
) {
  if (!appendixItems.length) {
    return drawTextBlock(composer, BRENT_EMPTY_EVIDENCE_COPY);
  }

  let next = composer;
  appendixItems.forEach((item) => {
    next = drawTextBlock(
      next,
      `${item.observedOnLabel} | ${item.learnerLabel} | ${item.learningArea} | ${item.title}${item.isHighlighted ? " | Portfolio highlight" : ""}`,
      {
        font: next.bold,
        fontSize: 9,
        lineHeight: 11,
        spacingAfter: 2,
      },
    );
    next = drawTextBlock(next, item.summary, {
      fontSize: 9,
      lineHeight: 11,
      spacingAfter: 6,
    });
  });
  return next;
}

function drawFooter(composer: PdfComposer, pageIndex: number, pageCount: number) {
  const footerY = composer.margin - 8;
  composer.page.drawLine({
    start: { x: composer.margin, y: footerY + 16 },
    end: { x: composer.width - composer.margin, y: footerY + 16 },
    thickness: 1,
    color: composer.theme.line,
  });

  composer.page.drawText(BRENT_FOOTER_DISCLAIMER, {
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

export async function generateBrentEvidencePackPdfBytes(
  model: BrentEvidencePackModel,
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

  if (logo) {
    const targetWidth = 132;
    const scale = targetWidth / logo.width;
    composer.page.drawImage(logo, {
      x: (composer.width - targetWidth) / 2,
      y: composer.y - 62,
      width: targetWidth,
      height: logo.height * scale,
    });
    composer.y -= logo.height * scale + 18;
  }

  const centeredTitleWidth = bold.widthOfTextAtSize(model.title, 20);
  composer.page.drawText(model.title, {
    x: (composer.width - centeredTitleWidth) / 2,
    y: composer.y,
    size: 20,
    font: bold,
    color: theme.title,
  });
  composer.y -= 28;

  composer = drawTextBlock(composer, model.preparedNote, {
    fontSize: 10.5,
    lineHeight: 13,
    color: theme.muted,
    spacingAfter: 18,
  });

  composer.page.drawRectangle({
    x: composer.margin,
    y: composer.y - 120,
    width: composer.width - composer.margin * 2,
    height: 124,
    color: theme.surface,
    borderColor: theme.line,
    borderWidth: 1,
  });

  const coverFields = [
    `Learner: ${model.learnerName}`,
    `Family: ${model.familyName}`,
    `Local authority: ${model.localAuthorityLabel}`,
    `Nation: ${model.nationLabel}`,
    `Country: ${model.countryLabel}`,
    `Date generated: ${model.generatedOnLabel}`,
  ];
  let coverY = composer.y - 18;
  coverFields.forEach((field) => {
    composer.page.drawText(field, {
      x: composer.margin + 14,
      y: coverY,
      size: 10.5,
      font: regular,
      color: theme.body,
    });
    coverY -= 16;
  });
  composer.y -= 138;

  composer = drawTextBlock(composer, model.disclaimer, {
    fontSize: 9.5,
    lineHeight: 12,
    color: theme.muted,
    spacingAfter: 8,
  });

  let working = {
    ...composer,
    page: doc.addPage([composer.width, composer.height]),
    y: composer.height - 52,
  };

  working = drawHeading(working, "Learner / pupil details");
  working = drawFieldRows(working, model.learnerDetails);
  working = drawDivider(working);
  working = drawHeading(working, "Parent / carer details");
  working = drawFieldRows(working, model.parentCarerDetails);
  working = drawDivider(working);
  working = drawHeading(working, "Contributors");
  working = drawBulletList(working, model.contributors);
  working = drawDivider(working);
  working = drawHeading(working, "Learning and attendance overview");
  working = drawFieldRows(working, model.learningOverview);
  working = drawDivider(working);
  working = drawHeading(working, "Progress against outcomes");
  working = drawOutcomeRows(working, model.progressAgainstOutcomes);
  working = drawDivider(working);
  working = drawHeading(working, "Evidence of attainment over time");
  working = drawEvidenceGroups(working, model.evidenceOfAttainment);
  working = drawDivider(working);
  working = drawHeading(working, "Academic progress");
  working = drawAcademicSections(working, model.academicProgress);
  working = drawDivider(working);
  working = drawHeading(working, "SEND areas of need");
  working = drawSendAreas(working, model.sendAreas);
  working = drawDivider(working);
  working = drawHeading(working, "Young person views");
  working = drawPromptResponses(working, model.youngPersonViews);
  working = drawDivider(working);
  working = drawHeading(working, "Parent / carer views");
  working = drawPromptResponses(working, model.parentCarerViews);
  working = drawDivider(working);
  working = drawHeading(working, "Next steps and support planning");
  working = drawNextSteps(working, model.nextSteps);
  working = drawDivider(working);
  working = drawHeading(working, "Evidence appendix");
  working = drawAppendix(working, model.evidenceAppendix);

  const pages = doc.getPages();
  pages.forEach((page, index) => {
    drawFooter(
      {
        ...working,
        page,
      },
      index,
      pages.length,
    );
  });

  return await doc.save();
}
