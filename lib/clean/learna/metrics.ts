import { parsePathwayContextFromNodeIds } from "@/lib/clean/evidence/curriculumContext";
import { getEvidenceProgressLevel } from "@/lib/clean/portfolio/evidencePresentation";
import type {
  LearnaEvidenceMetricInput,
  LearnaMathStrandKey,
  LearnaMilestone,
  LearnaStrandConfig,
  LearnaStrandSummary,
  LearnaTrendPoint,
} from "@/lib/clean/learna/types";

export const LEARNA_MATH_STRANDS: LearnaStrandConfig[] = [
  {
    key: "number-and-place-value",
    code: "NPV",
    label: "Number and Place Value",
    shortLabel: "Number",
    colour: "#2563eb",
  },
  {
    key: "operations-and-calculation",
    code: "OC",
    label: "Operations and Calculation",
    shortLabel: "Calculation",
    colour: "#ea580c",
  },
  {
    key: "fractions-decimals-percentages",
    code: "FDP",
    label: "Fractions, Decimals and Percentages",
    shortLabel: "Fractions",
    colour: "#7c3aed",
  },
  {
    key: "algebra-patterns-and-functions",
    code: "APF",
    label: "Algebra, Patterns and Functions",
    shortLabel: "Patterns",
    colour: "#4f46e5",
  },
  {
    key: "measurement",
    code: "MEA",
    label: "Measurement",
    shortLabel: "Measure",
    colour: "#0d9488",
  },
  {
    key: "geometry-and-spatial-reasoning",
    code: "GSR",
    label: "Geometry and Spatial Reasoning",
    shortLabel: "Geometry",
    colour: "#16a34a",
  },
];

const STRAND_ALIASES: Record<LearnaMathStrandKey, string[]> = {
  "number-and-place-value": ["npv", "number", "place value"],
  "operations-and-calculation": ["oc", "operation", "calculation"],
  "fractions-decimals-percentages": ["fdp", "fraction", "decimal", "percentage"],
  "algebra-patterns-and-functions": ["apf", "algebra", "pattern", "function"],
  measurement: ["mea", "measurement", "measure"],
  "geometry-and-spatial-reasoning": ["gsr", "geometry", "spatial", "shape"],
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeDate(value: unknown) {
  const clean = safe(value);
  if (!clean) return "";
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfIsoWeek(date: Date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  return utc;
}

function formatWeekLabel(date: Date) {
  return `${date.getUTCDate()} ${date.toLocaleString("en-AU", {
    month: "short",
    timeZone: "UTC",
  })}`;
}

export function clampLearnaValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getLearnaEvidenceDate(entry: LearnaEvidenceMetricInput) {
  return normalizeDate(entry.observedOn) || normalizeDate(entry.createdAt);
}

export function inferLearnaEvidenceStrand(
  entry: Pick<
    LearnaEvidenceMetricInput,
    "title" | "whatHappened" | "reflection" | "learningArea" | "curriculumNodeIds"
  >,
): LearnaMathStrandKey | null {
  const pathwayContext = parsePathwayContextFromNodeIds(entry.curriculumNodeIds ?? []);
  const pathwayKey = safe(pathwayContext?.pathwayKey).toLowerCase();
  const pathwayLabel = safe(pathwayContext?.pathwayLabel).toLowerCase();

  for (const strand of LEARNA_MATH_STRANDS) {
    if (pathwayKey === strand.key || pathwayKey.includes(strand.key)) return strand.key;
    if (pathwayLabel.includes(strand.label.toLowerCase())) return strand.key;
  }

  const haystack = [
    entry.learningArea,
    entry.title,
    entry.whatHappened,
    entry.reflection,
    ...entry.curriculumNodeIds,
  ]
    .map((value) => safe(value).toLowerCase())
    .join(" ");

  for (const strand of LEARNA_MATH_STRANDS) {
    if (STRAND_ALIASES[strand.key].some((alias) => haystack.includes(alias))) {
      return strand.key;
    }
  }

  return null;
}

export function getLearnaProgressLabel(entry: Pick<LearnaEvidenceMetricInput, "reflection">) {
  return getEvidenceProgressLevel(entry.reflection) || null;
}

export function isLearnaSecureProgress(label: string | null | undefined) {
  return /goal achieved/i.test(safe(label));
}

export function buildLearnaTrendSeries(
  entries: LearnaEvidenceMetricInput[],
  options: { weeks?: number; today?: Date } = {},
): LearnaTrendPoint[] {
  const weeks = Math.max(1, options.weeks ?? 8);
  const today = options.today ?? new Date();
  const currentWeekStart = startOfIsoWeek(today);
  const starts = Array.from({ length: weeks }, (_, index) =>
    addDays(currentWeekStart, (index - weeks + 1) * 7),
  );
  const countByWeek = new Map(starts.map((date) => [date.toISOString().slice(0, 10), 0]));

  for (const entry of entries) {
    const date = getLearnaEvidenceDate(entry);
    if (!date) continue;
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) continue;
    const weekStart = startOfIsoWeek(parsed).toISOString().slice(0, 10);
    if (countByWeek.has(weekStart)) {
      countByWeek.set(weekStart, (countByWeek.get(weekStart) ?? 0) + 1);
    }
  }

  return starts.map((date) => {
    const weekStart = date.toISOString().slice(0, 10);
    return {
      weekStart,
      label: formatWeekLabel(date),
      count: countByWeek.get(weekStart) ?? 0,
    };
  });
}

export function buildLearnaStrandSummaries(
  entries: LearnaEvidenceMetricInput[],
  totalStepsByStrand: Partial<Record<LearnaMathStrandKey, number>>,
): LearnaStrandSummary[] {
  return LEARNA_MATH_STRANDS.map((strand) => {
    const strandEntries = entries.filter((entry) => inferLearnaEvidenceStrand(entry) === strand.key);
    const secureSteps = strandEntries.filter((entry) =>
      isLearnaSecureProgress(getLearnaProgressLabel(entry)),
    ).length;
    const evidenceCount = strandEntries.length;
    const reportReadyCount = strandEntries.filter((entry) => entry.includeInReport).length;
    const totalSteps = Math.max(0, totalStepsByStrand[strand.key] ?? 0);
    const secureRatio = totalSteps > 0 ? secureSteps / totalSteps : 0;
    const evidenceActivity = Math.min(1, evidenceCount / 8);
    const reportReadyRatio = evidenceCount > 0 ? reportReadyCount / evidenceCount : 0;
    const latestStatus = getLearnaProgressLabel(strandEntries[0] ?? { reflection: null });

    return {
      ...strand,
      totalSteps,
      secureSteps,
      evidenceCount,
      reportReadyCount,
      latestStatus,
      radarValue: clampLearnaValue(secureRatio * 50 + evidenceActivity * 30 + reportReadyRatio * 20),
    };
  });
}

export function buildLearnaMilestones(
  entries: LearnaEvidenceMetricInput[],
  options: { secureStepCount: number; reportReadyCount: number },
): LearnaMilestone[] {
  const photoEvidenceCount = entries.filter(
    (entry) => Boolean(entry.imageUrl) || entry.attachmentUrls.length > 0,
  ).length;

  return [
    { id: "first-evidence", label: "First capture", active: entries.length > 0 },
    { id: "ten-evidence", label: "10 captures", active: entries.length >= 10 },
    { id: "first-secure", label: "First secure step", active: options.secureStepCount > 0 },
    { id: "five-secure", label: "5 secure steps", active: options.secureStepCount >= 5 },
    { id: "report-ready", label: "Report ready", active: options.reportReadyCount > 0 },
    { id: "photo-evidence", label: "Photo evidence", active: photoEvidenceCount > 0 },
  ];
}
