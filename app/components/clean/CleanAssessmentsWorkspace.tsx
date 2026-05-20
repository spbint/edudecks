"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import CleanAppHeader from "@/app/components/clean/CleanAppHeader";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import {
  buildAssessmentEvidenceLinkKey,
  encodeAssessmentEvidenceNodeIds,
  listCleanAssessmentSkillStatuses,
  parseAssessmentEvidenceLinkFromNodeIds,
  upsertCleanAssessmentSkillStatus,
} from "@/lib/clean/assessments/client";
import {
  CLEAN_ASSESSMENT_STAGE_KEYS,
  CLEAN_ASSESSMENT_STATUS_VALUES,
  type CleanAssessmentEvidenceLink,
  type CleanAssessmentSkillStatus,
  type CleanAssessmentStageKey,
  type CleanAssessmentStatusValue,
  type CleanAssessmentSubjectKey,
} from "@/lib/clean/assessments/types";
import {
  resolveCurriculumFrameworkMap,
  type CurriculumFrameworkElement,
  type CurriculumFrameworkLearningArea,
  type ResolvedCurriculumFrameworkMap,
} from "@/lib/clean/curriculum/frameworkMaps";
import { createCleanEvidenceEntry, listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import {
  buildCurriculumCaptureContext,
  encodeCurriculumContextNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { Learner } from "@/lib/clean/learners/types";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 16,
  background: "#f8fbff",
  padding: 16,
  display: "grid",
  gap: 8,
};

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  padding: 16,
  display: "grid",
  gap: 8,
};

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#ffffff",
  padding: 16,
  display: "grid",
  gap: 8,
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: "vertical",
  fontFamily: "inherit",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#64748b",
  textTransform: "uppercase",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const disabledButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  cursor: "default",
  opacity: 0.72,
};

const ASSESSMENT_STAGES = CLEAN_ASSESSMENT_STAGE_KEYS;
const ASSESSMENT_STATUSES = CLEAN_ASSESSMENT_STATUS_VALUES;

type AssessmentStage = CleanAssessmentStageKey;
type AssessmentStatus = CleanAssessmentStatusValue;
type AssessmentSubjectKey = CleanAssessmentSubjectKey;

type AssessmentSkillRow = {
  skillArea: string;
  stages: Record<AssessmentStage, AssessmentStatus>;
};

type AssessmentSkillDetail = {
  summary: string;
  bullets: string[];
};

type AssessmentSubject = {
  key: AssessmentSubjectKey;
  title: string;
  helper: string;
  summaryCopy: string;
  rows: AssessmentSkillRow[];
  prototypeCopy: string;
  skillDetails: Record<string, AssessmentSkillDetail>;
};

type StatusMeta = {
  fill: string;
  border: string;
  text: string;
  dot: string;
  cellLabel: string;
  helper: string;
  scoringHint: string;
  detailMeaning: string;
};

type AssessmentTileSelection = {
  subjectKey: AssessmentSubjectKey;
  skillKey: string;
  skillArea: string;
  stage: AssessmentStage;
};

type AssessmentTileFeedback = {
  tone: "success" | "error";
  message: string;
} | null;

const STATUS_META: Record<AssessmentStatus, StatusMeta> = {
  "Not assessed yet": {
    fill: "#f8fafc",
    border: "#e2e8f0",
    text: "#64748b",
    dot: "#94a3b8",
    cellLabel: "Not assessed",
    helper: "No assessment recorded yet.",
    scoringHint: "Suggested later model: no assessment recorded",
    detailMeaning:
      "No assessment has been recorded for this skill and stage yet. This simply means the tracker is ready to begin.",
  },
  "Still developing": {
    fill: "#f5f3ff",
    border: "#ddd6fe",
    text: "#6d28d9",
    dot: "#8b5cf6",
    cellLabel: "Still developing",
    helper: "Early understanding is still developing.",
    scoringHint: "Suggested later model: below 50%",
    detailMeaning:
      "Early understanding is still developing. The learner may need more support, examples, or practice before this feels secure.",
  },
  Developing: {
    fill: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    dot: "#3b82f6",
    cellLabel: "Developing",
    helper: "Confidence is starting to build.",
    scoringHint: "Suggested later model: 50-79%",
    detailMeaning:
      "Confidence is starting to build. The learner can show some understanding but may need more practice across different examples.",
  },
  Secure: {
    fill: "#f0fdf4",
    border: "#bbf7d0",
    text: "#166534",
    dot: "#22c55e",
    cellLabel: "Secure",
    helper: "The skill is looking more settled.",
    scoringHint: "Suggested later model: 80%+",
    detailMeaning:
      "The skill is looking settled. The learner can usually apply this skill with confidence.",
  },
  Strong: {
    fill: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    dot: "#f97316",
    cellLabel: "Strong",
    helper: "Repeated confidence or standout performance.",
    scoringHint: "Suggested later model: 90%+ or repeated secure result",
    detailMeaning:
      "Repeated confidence or standout performance is showing. This may later be used for strong evidence or extension.",
  },
};

function buildStageStatusMap(
  foundation: AssessmentStatus,
  lowerPrimary: AssessmentStatus,
  middlePrimary: AssessmentStatus,
  upperPrimary: AssessmentStatus,
  lowerSecondary: AssessmentStatus,
) {
  return {
    Foundation: foundation,
    "Lower Primary": lowerPrimary,
    "Middle Primary": middlePrimary,
    "Upper Primary": upperPrimary,
    "Lower Secondary": lowerSecondary,
  } satisfies Record<AssessmentStage, AssessmentStatus>;
}

const MATHEMATICS_ROWS: AssessmentSkillRow[] = [
  {
    skillArea: "Number sense",
    stages: buildStageStatusMap("Developing", "Secure", "Strong", "Secure", "Developing"),
  },
  {
    skillArea: "Place value",
    stages: buildStageStatusMap(
      "Still developing",
      "Developing",
      "Secure",
      "Secure",
      "Developing",
    ),
  },
  {
    skillArea: "Addition and subtraction",
    stages: buildStageStatusMap("Secure", "Secure", "Strong", "Secure", "Developing"),
  },
  {
    skillArea: "Multiplication and division",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Developing",
      "Secure",
      "Developing",
      "Still developing",
    ),
  },
  {
    skillArea: "Fractions",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Still developing",
      "Developing",
      "Secure",
      "Developing",
    ),
  },
  {
    skillArea: "Decimals and percentages",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Not assessed yet",
      "Developing",
      "Secure",
      "Still developing",
    ),
  },
  {
    skillArea: "Measurement",
    stages: buildStageStatusMap("Developing", "Secure", "Developing", "Secure", "Developing"),
  },
  {
    skillArea: "Geometry / space",
    stages: buildStageStatusMap("Developing", "Developing", "Secure", "Secure", "Developing"),
  },
  {
    skillArea: "Data / statistics",
    stages: buildStageStatusMap(
      "Still developing",
      "Developing",
      "Developing",
      "Secure",
      "Developing",
    ),
  },
  {
    skillArea: "Mathematical modelling and problem solving",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Developing",
      "Developing",
      "Secure",
      "Strong",
    ),
  },
  {
    skillArea: "Reasoning and explanation",
    stages: buildStageStatusMap(
      "Still developing",
      "Developing",
      "Developing",
      "Secure",
      "Strong",
    ),
  },
];

const ENGLISH_ROWS: AssessmentSkillRow[] = [
  {
    skillArea: "Reading comprehension",
    stages: buildStageStatusMap("Developing", "Secure", "Secure", "Strong", "Secure"),
  },
  {
    skillArea: "Vocabulary",
    stages: buildStageStatusMap("Developing", "Developing", "Secure", "Secure", "Developing"),
  },
  {
    skillArea: "Spelling / word knowledge",
    stages: buildStageStatusMap(
      "Still developing",
      "Developing",
      "Secure",
      "Developing",
      "Still developing",
    ),
  },
  {
    skillArea: "Writing sentences",
    stages: buildStageStatusMap("Secure", "Secure", "Strong", "Secure", "Developing"),
  },
  {
    skillArea: "Writing paragraphs and texts",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Developing",
      "Developing",
      "Secure",
      "Strong",
    ),
  },
  {
    skillArea: "Grammar and punctuation",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Still developing",
      "Developing",
      "Secure",
      "Developing",
    ),
  },
  {
    skillArea: "Speaking and listening",
    stages: buildStageStatusMap("Developing", "Secure", "Secure", "Strong", "Secure"),
  },
  {
    skillArea: "Text response",
    stages: buildStageStatusMap(
      "Not assessed yet",
      "Developing",
      "Developing",
      "Secure",
      "Developing",
    ),
  },
];

const MATHEMATICS_SKILL_DETAILS: Record<string, AssessmentSkillDetail> = {
  "Number sense": {
    summary: "May include reading, representing, ordering, and comparing numbers.",
    bullets: [
      "reading and representing numbers",
      "ordering and comparing numbers",
      "noticing quantity and magnitude",
      "using numbers confidently in everyday situations",
    ],
  },
  "Place value": {
    summary:
      "May include understanding digit value, partitioning numbers, and regrouping.",
    bullets: [
      "reading and writing numbers",
      "partitioning numbers",
      "comparing and ordering numbers",
      "explaining the value of digits",
    ],
  },
  "Addition and subtraction": {
    summary:
      "May include solving addition and subtraction problems using mental, written, and practical strategies.",
    bullets: [
      "mental strategies",
      "written methods",
      "practical problem solving",
      "checking whether answers are reasonable",
    ],
  },
  "Multiplication and division": {
    summary:
      "May include grouping, sharing, arrays, multiplication facts, and division strategies.",
    bullets: [
      "grouping and sharing",
      "arrays and repeated addition",
      "multiplication facts",
      "division strategies",
    ],
  },
  Fractions: {
    summary:
      "May include parts of a whole, equivalent fractions, comparing fractions, and using fractions in practical contexts.",
    bullets: [
      "parts of a whole",
      "equivalent fractions",
      "comparing fractions",
      "using fractions in practical contexts",
    ],
  },
  "Decimals and percentages": {
    summary:
      "May include decimal place value, percentages, and connecting fractions, decimals, and percentages.",
    bullets: [
      "decimal place value",
      "understanding percentages",
      "connecting fractions, decimals, and percentages",
      "applying these ideas in practical problems",
    ],
  },
  Measurement: {
    summary:
      "May include length, mass, capacity, time, money, area, perimeter, and choosing appropriate units.",
    bullets: [
      "length, mass, and capacity",
      "time and money",
      "area and perimeter",
      "choosing and using appropriate units",
    ],
  },
  "Geometry / space": {
    summary:
      "May include shapes, position, direction, symmetry, angles, and spatial reasoning.",
    bullets: [
      "recognising and describing shapes",
      "position and direction",
      "symmetry and angles",
      "using spatial reasoning",
    ],
  },
  "Data / statistics": {
    summary:
      "May include collecting, sorting, representing, interpreting, and discussing data.",
    bullets: [
      "collecting and sorting data",
      "representing data clearly",
      "interpreting graphs or tables",
      "discussing what data shows",
    ],
  },
  "Mathematical modelling and problem solving": {
    summary:
      "May include applying maths to real situations, choosing strategies, and explaining solutions.",
    bullets: [
      "applying maths to real situations",
      "choosing useful strategies",
      "explaining solutions",
      "checking and refining answers",
    ],
  },
  "Reasoning and explanation": {
    summary:
      "May include explaining thinking, checking reasonableness, justifying answers, and using mathematical language.",
    bullets: [
      "explaining mathematical thinking",
      "checking whether answers are reasonable",
      "justifying answers",
      "using mathematical language clearly",
    ],
  },
};

const ENGLISH_SKILL_DETAILS: Record<string, AssessmentSkillDetail> = {
  "Reading comprehension": {
    summary:
      "May include understanding texts, retrieving information, making inferences, and discussing meaning.",
    bullets: [
      "retrieving information from texts",
      "making inferences",
      "discussing meaning",
      "showing understanding across different text types",
    ],
  },
  Vocabulary: {
    summary:
      "May include word meaning, word choice, synonyms, topic words, and language growth.",
    bullets: [
      "understanding word meaning",
      "using stronger word choice",
      "working with synonyms and topic words",
      "growing language confidence over time",
    ],
  },
  "Spelling / word knowledge": {
    summary:
      "May include spelling patterns, phonics, morphology, and word families.",
    bullets: [
      "spelling patterns",
      "phonics knowledge",
      "morphology and word parts",
      "using word families",
    ],
  },
  "Writing sentences": {
    summary:
      "May include sentence structure, clarity, punctuation, and expressing complete ideas.",
    bullets: [
      "building complete sentences",
      "using punctuation clearly",
      "making ideas clear",
      "improving sentence control",
    ],
  },
  "Writing paragraphs and texts": {
    summary:
      "May include planning, organising ideas, writing longer responses, and improving drafts.",
    bullets: [
      "planning writing",
      "organising ideas into paragraphs",
      "writing longer responses",
      "improving drafts",
    ],
  },
  "Grammar and punctuation": {
    summary:
      "May include grammar choices, punctuation, sentence control, and editing.",
    bullets: [
      "grammar choices",
      "punctuation use",
      "sentence control",
      "editing and improving writing",
    ],
  },
  "Speaking and listening": {
    summary:
      "May include explaining ideas, listening carefully, discussion, oral presentation, and responding to questions.",
    bullets: [
      "explaining ideas clearly",
      "listening carefully",
      "joining discussion",
      "responding to questions",
    ],
  },
  "Text response": {
    summary:
      "May include responding to stories, information texts, media, and personal reading.",
    bullets: [
      "responding to stories",
      "discussing information texts",
      "thinking about media texts",
      "reflecting on personal reading",
    ],
  },
};

const SUBJECTS: Record<AssessmentSubjectKey, AssessmentSubject> = {
  mathematics: {
    key: "mathematics",
    title: "My Mathematics",
    helper: "Number and core mathematical skills",
    summaryCopy:
      "My Mathematics focuses on number, operations, problem solving, reasoning, measurement, geometry, and data skills across the learner's stage progression.",
    rows: MATHEMATICS_ROWS,
    prototypeCopy:
      "This is a visual prototype. Assessment checks and saved results will come later.",
    skillDetails: MATHEMATICS_SKILL_DETAILS,
  },
  english: {
    key: "english",
    title: "My English",
    helper: "Reading, writing, language, and communication skills",
    summaryCopy:
      "My English focuses on reading, vocabulary, spelling, writing, grammar, speaking and listening, and text response across the learner's stage progression.",
    rows: ENGLISH_ROWS,
    prototypeCopy:
      "This is a visual prototype. Assessment checks and saved results will come later.",
    skillDetails: ENGLISH_SKILL_DETAILS,
  },
};

function getAssessmentRow(
  subjectKey: AssessmentSubjectKey,
  skillArea: string,
) {
  return SUBJECTS[subjectKey].rows.find((row) => row.skillArea === skillArea) ?? null;
}

function getAssessmentDemoStatus(
  subjectKey: AssessmentSubjectKey,
  skillArea: string,
  stage: AssessmentStage,
): AssessmentStatus {
  return getAssessmentRow(subjectKey, skillArea)?.stages[stage] ?? "Not assessed yet";
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function toAssessmentSkillKey(skillArea: string) {
  return safe(skillArea)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildAssessmentStatusLookupKey(
  subjectKey: AssessmentSubjectKey,
  skillKey: string,
  stage: AssessmentStage,
) {
  return `${subjectKey}::${skillKey}::${stage}`;
}

function formatAssessmentSavedAt(value: string | null) {
  const parsed = Date.parse(value || "");
  if (Number.isNaN(parsed)) return null;

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function getLearnerLabel(learner: Learner | null) {
  if (!learner) return "No learner selected";
  return learner.preferredName || learner.firstName;
}

function splitCountryAndAuthorityLabels(countryAuthorityLabel: string, countryLabel: string) {
  const normalizedCountry = safe(countryLabel);
  const normalizedAuthority = safe(countryAuthorityLabel);

  if (
    !normalizedAuthority ||
    normalizedAuthority.toLowerCase() === normalizedCountry.toLowerCase()
  ) {
    return {
      countryLabel: normalizedCountry || "Not recorded in MyLearna yet.",
      authorityLabel: "Not recorded in MyLearna yet.",
    };
  }

  const prefix = `${normalizedCountry} / `;
  if (normalizedAuthority.startsWith(prefix)) {
    return {
      countryLabel: normalizedCountry || "Not recorded in MyLearna yet.",
      authorityLabel:
        normalizedAuthority.slice(prefix.length) || "Not recorded in MyLearna yet.",
    };
  }

  return {
    countryLabel: normalizedCountry || "Not recorded in MyLearna yet.",
    authorityLabel: normalizedAuthority,
  };
}

function inferStageFocusFromYearLevel(yearLevel: string | null | undefined): AssessmentStage {
  const normalized = safe(yearLevel).toLowerCase();

  if (!normalized) return "Middle Primary";

  if (
    /\b(foundation|prep|kindergarten|kindy|reception)\b/.test(normalized) ||
    /\b(?:year|grade)\s*0\b/.test(normalized) ||
    normalized === "k"
  ) {
    return "Foundation";
  }

  if (normalized.includes("lower primary")) return "Lower Primary";
  if (normalized.includes("middle primary")) return "Middle Primary";
  if (normalized.includes("upper primary")) return "Upper Primary";
  if (normalized.includes("lower secondary")) return "Lower Secondary";

  const numericMatch =
    normalized.match(/\b(?:year|grade)\s*(\d+)\b/) || normalized.match(/\b(\d+)\b/);
  const numericValue = numericMatch ? Number.parseInt(numericMatch[1], 10) : Number.NaN;

  if (numericValue === 1 || numericValue === 2) return "Lower Primary";
  if (numericValue === 3 || numericValue === 4) return "Middle Primary";
  if (numericValue === 5 || numericValue === 6) return "Upper Primary";
  if (numericValue >= 7) return "Lower Secondary";

  return "Middle Primary";
}

function getStageProgressionMeta(stage: AssessmentStage, currentStage: AssessmentStage) {
  const currentStageIndex = ASSESSMENT_STAGES.indexOf(currentStage);
  const stageIndex = ASSESSMENT_STAGES.indexOf(stage);

  if (stageIndex === currentStageIndex) {
    return {
      badge: "Current focus",
      helper: "Highlighted for this learner right now",
    };
  }

  if (stageIndex < currentStageIndex) {
    return {
      badge: "Before",
      helper: "Earlier foundations",
    };
  }

  if (stageIndex === currentStageIndex + 1) {
    return {
      badge: "Later",
      helper: "Next progression",
    };
  }

  return {
    badge: "Later",
    helper: "Later progression",
  };
}

function normalizeAssessmentMatchText(value: unknown) {
  return safe(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toAssessmentMatchTokens(values: Array<string | null | undefined>) {
  return [...new Set(
    values
      .flatMap((value) => normalizeAssessmentMatchText(value).split(/\s+/))
      .map((token) => token.trim())
      .filter((token) => token.length > 2),
  )];
}

function getCurriculumMatchValues(item: {
  key: string;
  label: string;
  keywords: string[];
  legacyKeys?: string[];
  legacyLabels?: string[];
}) {
  return [
    item.key,
    item.label,
    ...item.keywords,
    ...(item.legacyKeys || []),
    ...(item.legacyLabels || []),
  ];
}

function scoreCurriculumMatch(
  item: {
    key: string;
    label: string;
    keywords: string[];
    legacyKeys?: string[];
    legacyLabels?: string[];
  },
  tokens: string[],
) {
  const normalizedLabel = normalizeAssessmentMatchText(item.label);
  const normalizedValues = getCurriculumMatchValues(item)
    .map((value) => normalizeAssessmentMatchText(value))
    .filter(Boolean);

  return tokens.reduce((score, token) => {
    if (normalizedLabel === token) {
      return score + 6;
    }

    if (normalizedValues.some((value) => value === token)) {
      return score + 4;
    }

    if (normalizedValues.some((value) => value.includes(token))) {
      return score + 2;
    }

    return score;
  }, 0);
}

function findAssessmentLearningArea(
  resolvedFramework: ResolvedCurriculumFrameworkMap,
  subjectKey: AssessmentSubjectKey,
): CurriculumFrameworkLearningArea | null {
  const subjectTokens =
    subjectKey === "mathematics"
      ? ["mathematics", "maths", "math", "numeracy", "number"]
      : ["english", "literacy", "reading", "writing", "language"];

  let bestMatch: CurriculumFrameworkLearningArea | null = null;
  let bestScore = 0;

  resolvedFramework.map.learningAreas.forEach((area) => {
    const score = scoreCurriculumMatch(area, subjectTokens);
    if (score > bestScore) {
      bestMatch = area;
      bestScore = score;
    }
  });

  return bestScore > 0 ? bestMatch : null;
}

function findAssessmentCurriculumElement(
  learningArea: CurriculumFrameworkLearningArea | null,
  skillArea: string,
  skillDetail: AssessmentSkillDetail | null,
): CurriculumFrameworkElement | null {
  if (!learningArea) return null;

  const skillTokens = toAssessmentMatchTokens([
    skillArea,
    skillDetail?.summary || "",
    ...(skillDetail?.bullets || []),
  ]);

  let bestMatch: CurriculumFrameworkElement | null = null;
  let bestScore = 0;

  learningArea.elements.forEach((element) => {
    const score = scoreCurriculumMatch(element, skillTokens);
    if (score > bestScore) {
      bestMatch = element;
      bestScore = score;
    }
  });

  return bestScore > 0 ? bestMatch : null;
}

function getAssessmentStatusNarrative(status: AssessmentStatus) {
  if (status === "Not assessed yet") {
    return "has a saved assessment judgement ready to begin or revisit";
  }

  if (status === "Still developing") {
    return "is showing early confidence";
  }

  if (status === "Developing") {
    return "is building confidence";
  }

  if (status === "Secure") {
    return "is showing secure confidence";
  }

  return "is showing strong confidence";
}

function getAssessmentEvidenceObservedOn(record: CleanAssessmentSkillStatus | null) {
  const timestamp = safe(record?.updatedAt || record?.createdAt);
  if (/^\d{4}-\d{2}-\d{2}/.test(timestamp)) {
    return timestamp.slice(0, 10);
  }

  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function AssessmentsWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const [selectedLearnerIdOverride, setSelectedLearnerIdOverride] = useState("");
  const [selectedSubjectKey, setSelectedSubjectKey] =
    useState<AssessmentSubjectKey>("mathematics");
  const [stageFocusOverride, setStageFocusOverride] = useState<{
    learnerId: string;
    stage: AssessmentStage;
  } | null>(null);
  const [assessmentStatuses, setAssessmentStatuses] = useState<CleanAssessmentSkillStatus[]>([]);
  const [assessmentEvidenceEntries, setAssessmentEvidenceEntries] = useState<CleanEvidenceEntry[]>(
    [],
  );
  const [assessmentStatusesLoading, setAssessmentStatusesLoading] = useState(false);
  const [assessmentStatusesError, setAssessmentStatusesError] = useState<string | null>(null);
  const [isSavingAssessmentStatus, setIsSavingAssessmentStatus] = useState(false);
  const [isCreatingAssessmentEvidence, setIsCreatingAssessmentEvidence] = useState(false);
  const [selectedTile, setSelectedTile] = useState<AssessmentTileSelection | null>(null);
  const [selectedTileDraftStatus, setSelectedTileDraftStatus] =
    useState<AssessmentStatus>("Not assessed yet");
  const [selectedTileDraftNote, setSelectedTileDraftNote] = useState("");
  const [selectedTileFeedback, setSelectedTileFeedback] = useState<AssessmentTileFeedback>(null);
  const [selectedTileEvidenceFeedback, setSelectedTileEvidenceFeedback] =
    useState<AssessmentTileFeedback>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const capturePathBase = pathname.startsWith("/clean-my-assessments")
    ? "/clean-my-capture"
    : "/my-capture";

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner),
      })),
    [workspace.learners],
  );

  const selectedLearnerId = useMemo(() => {
    const currentIsValid = workspace.learners.some(
      (learner) => learner.id === selectedLearnerIdOverride,
    );
    if (currentIsValid) return selectedLearnerIdOverride;
    if (!workspace.learners.length) return "";

    const defaultLearnerId = workspace.profile?.defaultLearnerId;
    const defaultIsValid = defaultLearnerId
      ? workspace.learners.some((learner) => learner.id === defaultLearnerId)
      : false;

    return defaultIsValid ? defaultLearnerId || "" : workspace.learners[0]?.id || "";
  }, [selectedLearnerIdOverride, workspace.learners, workspace.profile?.defaultLearnerId]);

  const selectedLearner = useMemo(
    () => workspace.learners.find((learner) => learner.id === selectedLearnerId) ?? null,
    [selectedLearnerId, workspace.learners],
  );

  const inferredStageFocus = useMemo(
    () => inferStageFocusFromYearLevel(selectedLearner?.yearLevel),
    [selectedLearner?.yearLevel],
  );
  const stageFocus = useMemo(() => {
    const stageFocusLearnerId = selectedLearner?.id || "";
    if (stageFocusOverride?.learnerId === stageFocusLearnerId) {
      return stageFocusOverride.stage;
    }
    return inferredStageFocus;
  }, [inferredStageFocus, selectedLearner?.id, stageFocusOverride]);

  const selectedTileIdentity = useMemo(() => {
    if (!selectedTile) return "";

    return [
      selectedLearner?.id || "no-learner",
      selectedTile.subjectKey,
      selectedTile.skillKey,
      selectedTile.stage,
    ].join(":");
  }, [selectedLearner?.id, selectedTile]);

  useEffect(() => {
    if (!selectedTileIdentity) return;

    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedTile(null);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedTileIdentity]);

  const selectedFamilyId = workspace.profile?.id || "";

  useEffect(() => {
    let isCurrent = true;

    async function loadAssessmentStatuses() {
      if (!selectedFamilyId || !selectedLearnerId) {
        if (!isCurrent) return;
        setAssessmentStatuses([]);
        setAssessmentStatusesError(null);
        setAssessmentStatusesLoading(false);
        return;
      }

      setAssessmentStatusesLoading(true);
      setAssessmentStatusesError(null);

      try {
        const nextStatuses = await listCleanAssessmentSkillStatuses(
          selectedFamilyId,
          selectedLearnerId,
        );

        if (!isCurrent) return;
        setAssessmentStatuses(nextStatuses);
      } catch (error) {
        if (!isCurrent) return;

        setAssessmentStatuses([]);
        setAssessmentStatusesError(
          String(
            (error as { message?: unknown })?.message ??
              "Saved skill statuses could not be loaded right now.",
          ).trim(),
        );
      } finally {
        if (isCurrent) {
          setAssessmentStatusesLoading(false);
        }
      }
    }

    void loadAssessmentStatuses();

    return () => {
      isCurrent = false;
    };
  }, [selectedFamilyId, selectedLearnerId]);

  useEffect(() => {
    let isCurrent = true;

    async function loadAssessmentEvidenceEntries() {
      if (!selectedFamilyId || !selectedLearnerId) {
        if (!isCurrent) return;
        setAssessmentEvidenceEntries([]);
        return;
      }

      try {
        const nextEntries = await listCleanEvidenceEntries(selectedFamilyId, {
          learnerId: selectedLearnerId,
        });

        if (!isCurrent) return;
        setAssessmentEvidenceEntries(nextEntries);
      } catch {
        if (!isCurrent) return;
        setAssessmentEvidenceEntries([]);
      }
    }

    void loadAssessmentEvidenceEntries();

    return () => {
      isCurrent = false;
    };
  }, [selectedFamilyId, selectedLearnerId]);

  const selectedSubject = SUBJECTS[selectedSubjectKey];
  const savedAssessmentStatusMap = useMemo(() => {
    const next = new Map<string, CleanAssessmentSkillStatus>();

    assessmentStatuses.forEach((item) => {
      next.set(
        buildAssessmentStatusLookupKey(item.subjectKey, item.skillKey, item.stageKey),
        item,
      );
    });

    return next;
  }, [assessmentStatuses]);
  const linkedAssessmentEvidenceMap = useMemo(() => {
    const next = new Map<string, CleanEvidenceEntry>();

    assessmentEvidenceEntries.forEach((entry) => {
      const link = parseAssessmentEvidenceLinkFromNodeIds(entry.curriculumNodeIds);
      if (!link) return;

      const linkKey = buildAssessmentEvidenceLinkKey(link.statusRecordId, link.statusSavedAt);
      if (!linkKey) return;

      const existing = next.get(linkKey);
      if (!existing) {
        next.set(linkKey, entry);
        return;
      }

      const existingTime = Date.parse(existing.updatedAt || existing.createdAt || "");
      const entryTime = Date.parse(entry.updatedAt || entry.createdAt || "");

      if (Number.isNaN(existingTime) || entryTime > existingTime) {
        next.set(linkKey, entry);
      }
    });

    return next;
  }, [assessmentEvidenceEntries]);

  function getSavedAssessmentStatusRecord(
    subjectKey: AssessmentSubjectKey,
    skillArea: string,
    stage: AssessmentStage,
  ) {
    return (
      savedAssessmentStatusMap.get(
        buildAssessmentStatusLookupKey(subjectKey, toAssessmentSkillKey(skillArea), stage),
      ) ?? null
    );
  }

  function getDisplayedAssessmentStatus(
    subjectKey: AssessmentSubjectKey,
    skillArea: string,
    stage: AssessmentStage,
  ) {
    return (
      getSavedAssessmentStatusRecord(subjectKey, skillArea, stage)?.status ??
      getAssessmentDemoStatus(subjectKey, skillArea, stage)
    );
  }

  const stageFocusAdjustedForView = useMemo(() => {
    const selectedLearnerKey = selectedLearner?.id || "";
    return (
      Boolean(selectedLearnerKey) &&
      stageFocusOverride?.learnerId === selectedLearnerKey &&
      stageFocusOverride.stage !== inferredStageFocus
    );
  }, [inferredStageFocus, selectedLearner?.id, stageFocusOverride]);
  const currentStageSnapshot = useMemo(
    () =>
      selectedSubject.rows.reduce(
        (totals, row) => {
          const status =
            savedAssessmentStatusMap.get(
              buildAssessmentStatusLookupKey(
                selectedSubject.key,
                toAssessmentSkillKey(row.skillArea),
                stageFocus,
              ),
            )?.status ?? getAssessmentDemoStatus(selectedSubject.key, row.skillArea, stageFocus);

          if (status === "Secure" || status === "Strong") {
            totals.secureOrStrong += 1;
            return totals;
          }

          if (status === "Developing") {
            totals.developing += 1;
            return totals;
          }

          if (status === "Still developing") {
            totals.stillDeveloping += 1;
            return totals;
          }

          totals.notAssessedYet += 1;
          return totals;
        },
        {
          secureOrStrong: 0,
          developing: 0,
          stillDeveloping: 0,
          notAssessedYet: 0,
        },
      ),
    [selectedSubject, stageFocus, savedAssessmentStatusMap],
  );
  const resolvedFramework = useMemo(() => resolveCurriculumFrameworkMap(workspace.profile), [
    workspace.profile,
  ]);

  const frameworkDetails = useMemo(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      return null;
    }

    const splitLabels = splitCountryAndAuthorityLabels(
      resolvedFramework.countryAuthorityLabel,
      resolvedFramework.map.countryLabel,
    );

    return {
      countryLabel: splitLabels.countryLabel,
      frameworkLabel: resolvedFramework.frameworkDisplayLabel,
      authorityLabel: splitLabels.authorityLabel,
      settingsHint:
        !safe(workspace.profile.countryCode) || !safe(workspace.profile.curriculumFrameworkId)
          ? "Framework details can be adjusted in My Settings."
          : resolvedFramework.settingsHint,
    };
  }, [
    resolvedFramework,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  const selectedLearnerLabel = getLearnerLabel(selectedLearner);
  const hasMultipleLearners = workspace.learners.length > 1;

  const selectedTileDetail = selectedTile
    ? SUBJECTS[selectedTile.subjectKey].skillDetails[selectedTile.skillArea]
    : null;
  const selectedTileSubject = selectedTile ? SUBJECTS[selectedTile.subjectKey] : null;
  const selectedTileStatusRecord = selectedTile
    ? getSavedAssessmentStatusRecord(
        selectedTile.subjectKey,
        selectedTile.skillArea,
        selectedTile.stage,
      )
    : null;
  const selectedTileDisplayedStatus = selectedTile
    ? getDisplayedAssessmentStatus(
        selectedTile.subjectKey,
        selectedTile.skillArea,
        selectedTile.stage,
      )
    : null;
  const selectedTileStatusMeta = selectedTileDisplayedStatus
    ? STATUS_META[selectedTileDisplayedStatus]
    : null;
  const selectedTileLastUpdatedLabel = formatAssessmentSavedAt(
    selectedTileStatusRecord?.updatedAt || selectedTileStatusRecord?.createdAt || null,
  );
  const selectedTileSavedAt =
    selectedTileStatusRecord?.updatedAt || selectedTileStatusRecord?.createdAt || null;
  const selectedTileHasUnsavedChanges = selectedTileStatusRecord
    ? selectedTileDraftStatus !== selectedTileStatusRecord.status ||
      selectedTileDraftNote !== (selectedTileStatusRecord.note || "")
    : false;
  const selectedTileEvidenceLinkKey = selectedTileStatusRecord
    ? buildAssessmentEvidenceLinkKey(selectedTileStatusRecord.id, selectedTileSavedAt)
    : "";
  const selectedTileLinkedEvidenceEntry = selectedTileEvidenceLinkKey
    ? linkedAssessmentEvidenceMap.get(selectedTileEvidenceLinkKey) ?? null
    : null;
  const selectedTileLinkedEvidenceLabel = formatAssessmentSavedAt(
    selectedTileLinkedEvidenceEntry?.createdAt || selectedTileLinkedEvidenceEntry?.observedOn || null,
  );
  const selectedTileStageMessage = selectedTile
    ? selectedTile.stage === stageFocus
      ? "This skill sits within the learner's current stage focus. At this stage, the focus is on building confidence, applying the skill in different contexts, and preparing for the next progression step."
      : `This skill sits within the wider progression around ${stageFocus}. It helps show what came before or what comes next as confidence builds over time.`
    : "";

  function openAssessmentTile(row: AssessmentSkillRow, stage: AssessmentStage) {
    const displayedStatus = getDisplayedAssessmentStatus(selectedSubject.key, row.skillArea, stage);
    const savedStatusRecord = getSavedAssessmentStatusRecord(
      selectedSubject.key,
      row.skillArea,
      stage,
    );

    setSelectedTile({
      subjectKey: selectedSubject.key,
      skillKey: toAssessmentSkillKey(row.skillArea),
      skillArea: row.skillArea,
      stage,
    });
    setSelectedTileDraftStatus(displayedStatus);
    setSelectedTileDraftNote(savedStatusRecord?.note || "");
    setSelectedTileFeedback(null);
    setSelectedTileEvidenceFeedback(null);
  }

  function updateSelectedTileDraftStatus(status: AssessmentStatus) {
    setSelectedTileDraftStatus(status);
    setSelectedTileFeedback(null);
    setSelectedTileEvidenceFeedback(null);
  }

  function updateSelectedTileDraftNote(note: string) {
    setSelectedTileDraftNote(note);
    setSelectedTileFeedback(null);
    setSelectedTileEvidenceFeedback(null);
  }

  async function saveSelectedTileStatus() {
    if (!selectedTile || !selectedLearner || !selectedFamilyId) {
      setSelectedTileFeedback({
        tone: "error",
        message: "Add a learner before saving a skill status.",
      });
      return;
    }

    setIsSavingAssessmentStatus(true);
    setSelectedTileEvidenceFeedback(null);

    try {
      const savedStatus = await upsertCleanAssessmentSkillStatus(selectedFamilyId, {
        learnerId: selectedLearner.id,
        subjectKey: selectedTile.subjectKey,
        skillKey: selectedTile.skillKey,
        stageKey: selectedTile.stage,
        status: selectedTileDraftStatus,
        note: selectedTileDraftNote,
      });

      setAssessmentStatuses((current) => {
        const next = current.filter(
          (item) =>
            !(
              item.familyId === savedStatus.familyId &&
              item.learnerId === savedStatus.learnerId &&
              item.subjectKey === savedStatus.subjectKey &&
              item.skillKey === savedStatus.skillKey &&
              item.stageKey === savedStatus.stageKey
            ),
        );

        next.push(savedStatus);
        return next;
      });

      setSelectedTileDraftStatus(savedStatus.status);
      setSelectedTileDraftNote(savedStatus.note || "");
      setSelectedTileFeedback({
        tone: "success",
        message: "Skill status saved.",
      });
    } catch {
      setSelectedTileFeedback({
        tone: "error",
        message: "Could not save this skill status. Please try again.",
      });
    } finally {
      setIsSavingAssessmentStatus(false);
    }
  }

  async function createEvidenceFromSavedStatus() {
    if (
      !selectedTile ||
      !selectedTileDetail ||
      !selectedTileSubject ||
      !selectedTileStatusRecord ||
      !selectedLearner ||
      !selectedFamilyId
    ) {
      setSelectedTileEvidenceFeedback({
        tone: "error",
        message: "Save this skill status before creating an evidence note.",
      });
      return;
    }

    if (selectedTileHasUnsavedChanges) {
      setSelectedTileEvidenceFeedback({
        tone: "error",
        message: "Save the latest status changes before creating an evidence note.",
      });
      return;
    }

    if (selectedTileLinkedEvidenceEntry) {
      setSelectedTileEvidenceFeedback({
        tone: "success",
        message: "Evidence already linked for this saved status.",
      });
      return;
    }

    setIsCreatingAssessmentEvidence(true);
    setSelectedTileEvidenceFeedback(null);

    try {
      const learningArea = findAssessmentLearningArea(resolvedFramework, selectedTile.subjectKey);
      const curriculumElement = findAssessmentCurriculumElement(
        learningArea,
        selectedTile.skillArea,
        selectedTileDetail,
      );
      const curriculumContext = buildCurriculumCaptureContext({
        learningAreaKey: learningArea?.key || null,
        learningAreaLabel: learningArea?.label || null,
        curriculumElementKey: curriculumElement?.key || null,
        curriculumElementLabel: curriculumElement?.label || null,
      });
      const evidenceLink = {
        sourceContext: "my-assessments",
        statusRecordId: selectedTileStatusRecord.id,
        statusSavedAt: selectedTileSavedAt,
        subjectKey: selectedTile.subjectKey,
        skillKey: selectedTile.skillKey,
        stageKey: selectedTile.stage,
        assessmentStatus: selectedTileStatusRecord.status,
      } satisfies CleanAssessmentEvidenceLink;
      const curriculumNodeIds = encodeAssessmentEvidenceNodeIds(
        encodeCurriculumContextNodeIds([], curriculumContext),
        evidenceLink,
      );

      const createdEvidence = await createCleanEvidenceEntry(selectedFamilyId, {
        learnerId: selectedLearner.id,
        observedOn: getAssessmentEvidenceObservedOn(selectedTileStatusRecord),
        title: `Assessment evidence - ${selectedTile.skillArea}`,
        whatHappened: `${selectedLearnerLabel} ${getAssessmentStatusNarrative(
          selectedTileStatusRecord.status,
        )} in ${selectedTile.skillArea} at ${selectedTile.stage} stage in ${
          selectedTileSubject.title
        }.`,
        reflection: selectedTileStatusRecord.note || null,
        learningArea: learningArea?.label || selectedTileSubject.title,
        curriculumNodeIds,
        includeInPortfolio: true,
        includeInReport: true,
      });

      setAssessmentEvidenceEntries((current) => [createdEvidence, ...current]);
      setSelectedTileEvidenceFeedback({
        tone: "success",
        message: "Added to learning evidence.",
      });
    } catch {
      setSelectedTileEvidenceFeedback({
        tone: "error",
        message: "Could not create this evidence note. Please try again.",
      });
    } finally {
      setIsCreatingAssessmentEvidence(false);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanAppHeader />

        <section
          style={{
            ...cardStyle,
            padding: 24,
            background:
              "linear-gradient(180deg, rgba(248,251,255,1) 0%, rgba(255,255,255,1) 100%)",
          }}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 10, maxWidth: 760 }}>
                <div style={eyebrowStyle}>Assessment dashboard</div>
                <h1 style={{ margin: 0, fontSize: 30, color: "#0f172a" }}>My Assessments</h1>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: 16 }}>
                  See assessed skill confidence across the learner&apos;s current stage and
                  wider progression.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span
                  style={{
                    border: "1px solid #bfdbfe",
                    background: "#ffffff",
                    color: "#1d4ed8",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1.4,
                  }}
                >
                  Manual status tracking is now available. Assessment checks will come later.
                </span>
                <Link href="/my-settings" style={secondaryButtonStyle}>
                  My Settings
                </Link>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Selected learner</div>
                {workspace.loading ? (
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    Loading learner details...
                  </div>
                ) : selectedLearner ? (
                  hasMultipleLearners ? (
                    <>
                      <label style={{ color: "#334155", fontWeight: 700 }}>
                        Viewing assessment map for
                      </label>
                      <select
                        value={selectedLearnerId}
                        onChange={(event) => {
                          setSelectedLearnerIdOverride(event.target.value);
                          setSelectedTile(null);
                        }}
                        style={inputStyle}
                      >
                        {learnerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <strong style={{ color: "#0f172a", fontSize: 16 }}>
                        {selectedLearnerLabel}
                      </strong>
                      <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                        Learner context for the current assessment dashboard.
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <strong style={{ color: "#0f172a" }}>
                      Add a learner before tracking assessments.
                    </strong>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      You can still explore the prototype tracker while learner details are
                      being set up.
                    </div>
                    <div>
                      <Link href="/my-profile" style={secondaryButtonStyle}>
                        Open My Profile
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Subject view</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(Object.values(SUBJECTS) as AssessmentSubject[]).map((subject) => {
                    const active = subject.key === selectedSubjectKey;

                    return (
                      <button
                        key={subject.key}
                        type="button"
                        onClick={() => {
                          setSelectedSubjectKey(subject.key);
                          setSelectedTile(null);
                        }}
                        aria-pressed={active}
                        style={{
                          border: active ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                          background: active ? "#eff6ff" : "#ffffff",
                          color: active ? "#1d4ed8" : "#0f172a",
                          borderRadius: 999,
                          padding: "10px 12px",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          transition: "border-color 140ms ease, box-shadow 140ms ease",
                        }}
                      >
                        {subject.title}
                      </button>
                    );
                  })}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.7 }}>{selectedSubject.summaryCopy}</div>
              </div>

              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Current stage focus</div>
                <strong style={{ color: "#0f172a", fontSize: 20 }}>{stageFocus}</strong>
                <label style={{ color: "#334155", fontWeight: 700 }}>Stage focus</label>
                <select
                  value={stageFocus}
                  onChange={(event) =>
                    setStageFocusOverride({
                      learnerId: selectedLearner?.id || "",
                      stage: event.target.value as AssessmentStage,
                    })
                  }
                  style={inputStyle}
                >
                  {ASSESSMENT_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  {stageFocusAdjustedForView
                    ? "Stage focus is adjusted for this view only."
                    : "Based on the learner's year level where available."}
                </div>
              </div>

              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Framework context</div>
                <strong style={{ color: "#0f172a", fontSize: 16 }}>
                  {frameworkDetails?.frameworkLabel || "Framework details will connect to My Settings later."}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {frameworkDetails
                    ? `${frameworkDetails.countryLabel}${
                        frameworkDetails.authorityLabel !== "Not recorded in MyLearna yet."
                          ? ` · ${frameworkDetails.authorityLabel}`
                          : ""
                      }`.replace("Â·", "/")
                    : "Selected framework context will connect to My Settings as this layer develops."}
                </div>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  {frameworkDetails?.settingsHint ||
                    "The assessment pathway will later map back to the framework selected in My Settings."}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, padding: 18 }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 6, maxWidth: 720 }}>
                <div style={eyebrowStyle}>Legend and progression</div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Current stage stays highlighted while the wider progression remains visible.
                </div>
              </div>
              <span
                style={{
                  border: "1px solid #dbeafe",
                  background: "#ffffff",
                  color: "#1d4ed8",
                  borderRadius: 999,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Current stage: {stageFocus}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              }}
            >
              <div style={{ ...helperCardStyle, padding: 14 }}>
                <div style={eyebrowStyle}>Status legend</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ASSESSMENT_STATUSES.map((status) => {
                    const meta = STATUS_META[status];

                    return (
                      <div
                        key={status}
                        title={meta.helper}
                        style={{
                          border: `1px solid ${meta.border}`,
                          borderRadius: 999,
                          background: meta.fill,
                          padding: "8px 10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: meta.dot,
                            flexShrink: 0,
                          }}
                        />
                        <strong style={{ color: meta.text, fontSize: 12 }}>{status}</strong>
                      </div>
                    );
                  })}
                </div>
                <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                  Open any skill tile for fuller status detail.
                </div>
              </div>

              <div style={{ ...compactCardStyle, padding: 14 }}>
                <div style={eyebrowStyle}>Progression strip</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ASSESSMENT_STAGES.map((stage) => {
                    const isFocusedStage = stage === stageFocus;
                    const progressionMeta = getStageProgressionMeta(stage, stageFocus);

                    return (
                      <div
                        key={`progression-${stage}`}
                        style={{
                          border: isFocusedStage ? "1px solid #93c5fd" : "1px solid #e2e8f0",
                          borderRadius: 999,
                          background: isFocusedStage ? "#eff6ff" : "#ffffff",
                          padding: "8px 12px",
                          display: "grid",
                          gap: 4,
                          boxShadow: isFocusedStage
                            ? "0 8px 18px rgba(59,130,246,0.10)"
                            : "0 2px 8px rgba(15,23,42,0.03)",
                        }}
                      >
                        <span
                          style={{
                            color: isFocusedStage ? "#1d4ed8" : "#64748b",
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          {progressionMeta.badge}
                        </span>
                        <strong style={{ color: "#0f172a", fontSize: 13 }}>{stage}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, padding: 18 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 8, maxWidth: 700 }}>
                <div style={eyebrowStyle}>Visual tracker</div>
                <h2 style={{ margin: 0, color: "#0f172a" }}>{selectedSubject.title}</h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Click any skill tile to explore how confidence looks across the learner&apos;s
                  current stage and wider progression.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              }}
            >
              <div style={{ ...compactCardStyle, background: "#ffffff" }}>
                <div style={eyebrowStyle}>{stageFocus} snapshot</div>
                <strong style={{ color: "#0f172a" }}>Current stage</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Using the displayed statuses in the selected stage column for {selectedSubject.title}.
                </div>
              </div>
              <div style={{ ...summaryCardStyle, padding: 14 }}>
                <strong style={{ color: "#0f172a", fontSize: 22 }}>
                  {currentStageSnapshot.secureOrStrong}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.5 }}>secure or strong</div>
              </div>
              <div style={{ ...summaryCardStyle, padding: 14 }}>
                <strong style={{ color: "#0f172a", fontSize: 22 }}>
                  {currentStageSnapshot.developing}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.5 }}>developing</div>
              </div>
              <div style={{ ...summaryCardStyle, padding: 14 }}>
                <strong style={{ color: "#0f172a", fontSize: 22 }}>
                  {currentStageSnapshot.stillDeveloping}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.5 }}>still developing</div>
              </div>
              <div style={{ ...summaryCardStyle, padding: 14 }}>
                <strong style={{ color: "#0f172a", fontSize: 22 }}>
                  {currentStageSnapshot.notAssessedYet}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.5 }}>not assessed yet</div>
              </div>
            </div>

            {assessmentStatusesLoading ? (
              <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                Loading saved skill statuses...
              </div>
            ) : null}

            {assessmentStatusesError ? (
              <div style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>
                  Saved skill statuses could not be loaded right now.
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Demo statuses are still showing while manual tracking reconnects.
                </div>
              </div>
            ) : null}

            <div
              style={{
                border: "1px solid #dbeafe",
                borderRadius: 20,
                background:
                  "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
                padding: 12,
                overflowX: "auto",
              }}
            >
              <div style={{ minWidth: 920, display: "grid", gap: 8 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "220px repeat(5, minmax(120px, 1fr))",
                    gap: 8,
                    alignItems: "stretch",
                  }}
                >
                  <div
                    style={{
                      ...compactCardStyle,
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      background: "#ffffff",
                      padding: 14,
                    }}
                  >
                    <div style={eyebrowStyle}>Skill area</div>
                    <strong style={{ color: "#0f172a" }}>{selectedSubject.title}</strong>
                    <div style={{ color: "#64748b", lineHeight: 1.5 }}>
                      {selectedSubject.helper}
                    </div>
                  </div>

                  {ASSESSMENT_STAGES.map((stage) => {
                    const isFocusedStage = stage === stageFocus;
                    const progressionMeta = getStageProgressionMeta(stage, stageFocus);

                    return (
                      <div
                        key={stage}
                        style={{
                          ...compactCardStyle,
                          alignContent: "center",
                          justifyItems: "start",
                          padding: 12,
                          background: isFocusedStage ? "#eff6ff" : "#ffffff",
                          border: isFocusedStage
                            ? "1px solid #93c5fd"
                            : "1px solid #e2e8f0",
                          boxShadow: isFocusedStage
                            ? "0 10px 22px rgba(59,130,246,0.12)"
                            : "0 2px 8px rgba(15,23,42,0.03)",
                          opacity: isFocusedStage ? 1 : 0.9,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            alignItems: "center",
                            width: "100%",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              ...eyebrowStyle,
                              color: isFocusedStage ? "#1d4ed8" : "#64748b",
                            }}
                          >
                            {progressionMeta.badge}
                          </div>
                          {isFocusedStage ? (
                            <span
                              style={{
                                border: "1px solid #bfdbfe",
                                background: "#ffffff",
                                color: "#1d4ed8",
                                borderRadius: 999,
                                padding: "4px 8px",
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                              }}
                            >
                              Current focus
                            </span>
                          ) : null}
                        </div>
                        <strong style={{ color: "#0f172a", fontSize: 15 }}>{stage}</strong>
                      </div>
                    );
                  })}
                </div>

                {selectedSubject.rows.map((row) => (
                  <div
                    key={row.skillArea}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "220px repeat(5, minmax(120px, 1fr))",
                      gap: 8,
                      alignItems: "stretch",
                    }}
                  >
                    <div
                      style={{
                        ...compactCardStyle,
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        background: "#ffffff",
                        justifyContent: "center",
                        padding: 14,
                      }}
                    >
                      <strong style={{ color: "#0f172a", fontSize: 15 }}>{row.skillArea}</strong>
                      <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
                        Universal skill area
                      </div>
                    </div>

                    {ASSESSMENT_STAGES.map((stage) => {
                      const status = getDisplayedAssessmentStatus(
                        selectedSubject.key,
                        row.skillArea,
                        stage,
                      );
                      const savedStatusRecord = getSavedAssessmentStatusRecord(
                        selectedSubject.key,
                        row.skillArea,
                        stage,
                      );
                      const meta = STATUS_META[status];
                      const isFocusedStage = stage === stageFocus;

                      return (
                        <button
                          key={`${row.skillArea}-${stage}`}
                          type="button"
                          aria-label={`${row.skillArea}, ${stage}, ${status}`}
                          onClick={() => openAssessmentTile(row, stage)}
                          style={{
                            border: isFocusedStage
                              ? "2px solid #60a5fa"
                              : `1px solid ${meta.border}`,
                            borderRadius: 14,
                            background: meta.fill,
                            padding: 12,
                            minHeight: 86,
                            display: "grid",
                            gap: 8,
                            alignContent: "start",
                            boxShadow: isFocusedStage
                              ? "0 12px 24px rgba(59,130,246,0.12)"
                              : "0 3px 8px rgba(15,23,42,0.03)",
                            cursor: "pointer",
                            textAlign: "left",
                            opacity: isFocusedStage ? 1 : 0.9,
                            transition:
                              "box-shadow 140ms ease, border-color 140ms ease, transform 140ms ease",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                minWidth: 0,
                              }}
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 999,
                                  background: meta.dot,
                                  flexShrink: 0,
                                }}
                              />
                              <strong style={{ color: meta.text, fontSize: 13 }}>
                                {meta.cellLabel}
                              </strong>
                            </span>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                flexWrap: "wrap",
                                justifyContent: "flex-end",
                              }}
                            >
                              <span
                                style={{
                                  border: "1px solid #e2e8f0",
                                  background: "#ffffff",
                                  color: "#475569",
                                  borderRadius: 999,
                                  padding: "4px 7px",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                }}
                              >
                                {savedStatusRecord ? "Saved" : "Demo"}
                              </span>
                              {isFocusedStage ? (
                                <span
                                  style={{
                                    border: "1px solid #bfdbfe",
                                    background: "#ffffff",
                                    color: "#1d4ed8",
                                    borderRadius: 999,
                                    padding: "4px 7px",
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Focus
                                </span>
                              ) : null}
                            </span>
                          </div>
                          <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5 }}>
                            {status}
                          </div>
                          <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 700 }}>
                            Open detail
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>Coming later</div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>Future assessment actions</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                These are the next pieces planned for the assessment layer once the
                visual tracker is in place.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              }}
            >
              <article style={compactCardStyle}>
                <div style={eyebrowStyle}>Assessment checks</div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>
                  Start assessment checks
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Short skill checks will help update the tracker and create evidence for
                  reports.
                </div>
                <div>
                  <button type="button" style={disabledButtonStyle} disabled>
                    Coming later
                  </button>
                </div>
              </article>

              <article style={compactCardStyle}>
                <div style={eyebrowStyle}>Assessment exports</div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>
                  Assessment result exports
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Export assessment summaries that can support reports, curriculum
                  coverage, and portfolio review.
                </div>
                <div>
                  <button type="button" style={disabledButtonStyle} disabled>
                    Coming later
                  </button>
                </div>
              </article>

              <article style={compactCardStyle}>
                <div style={eyebrowStyle}>Framework mapping</div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>Framework crosswalk</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Assessment results will later be mapped to the selected curriculum
                  framework in My Settings.
                </div>
                <div>
                  <button type="button" style={disabledButtonStyle} disabled>
                    Coming later
                  </button>
                </div>
              </article>

              <article style={compactCardStyle}>
                <div style={eyebrowStyle}>Future subjects</div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>
                  More assessment areas
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  More assessment areas can be added later while keeping the same learner
                  view and stage-focused tracker pattern.
                </div>
                <div>
                  <button type="button" style={disabledButtonStyle} disabled>
                    Coming later
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        {selectedTile && selectedTileDetail && selectedTileSubject && selectedTileStatusMeta ? (
          <div
            role="presentation"
            onClick={() => setSelectedTile(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.42)",
              display: "grid",
              placeItems: "center",
              padding: 16,
              zIndex: 100,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="assessment-tile-detail-heading"
              aria-describedby="assessment-tile-detail-body"
              onClick={(event) => event.stopPropagation()}
              style={{
                width: "min(760px, 100%)",
                maxHeight: "min(88vh, 900px)",
                overflowY: "auto",
                border: "1px solid #dbeafe",
                borderRadius: 22,
                background: "#ffffff",
                boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
                padding: 22,
                display: "grid",
                gap: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{
                      color: "#1d4ed8",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Skill tile detail
                  </div>
                  <h2
                    id="assessment-tile-detail-heading"
                    style={{ margin: 0, color: "#0f172a", fontSize: 24 }}
                  >
                    {selectedTile.skillArea} - {selectedTile.stage}
                  </h2>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    Viewing assessment detail for {selectedLearnerLabel}.
                  </div>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setSelectedTile(null)}
                  style={secondaryButtonStyle}
                >
                  Close
                </button>
              </div>

              <div
                id="assessment-tile-detail-body"
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                }}
              >
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Subject</div>
                  <strong style={{ color: "#0f172a" }}>{selectedTileSubject.title}</strong>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Skill area</div>
                  <strong style={{ color: "#0f172a" }}>{selectedTile.skillArea}</strong>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Stage</div>
                  <strong style={{ color: "#0f172a" }}>{selectedTile.stage}</strong>
                </div>
                <div
                  style={{
                    border: `1px solid ${selectedTileStatusMeta.border}`,
                    borderRadius: 16,
                    background: selectedTileStatusMeta.fill,
                    padding: 16,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={eyebrowStyle}>
                    {selectedTileStatusRecord ? "Saved status" : "Displayed status"}
                  </div>
                  <strong style={{ color: selectedTileStatusMeta.text }}>
                    {selectedTileDisplayedStatus}
                  </strong>
                  {selectedTileLastUpdatedLabel ? (
                    <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.6 }}>
                      Last updated: {selectedTileLastUpdatedLabel}
                    </div>
                  ) : null}
                </div>
              </div>

              <section style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>What this status means</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  {selectedTileStatusMeta.detailMeaning}
                </p>
              </section>

              <section style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>Why this stage matters</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  {selectedTileStageMessage}
                </p>
              </section>

              <section style={compactCardStyle}>
                <strong style={{ color: "#0f172a" }}>What this skill may include</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  {selectedTileDetail.summary}
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    color: "#475569",
                    display: "grid",
                    gap: 6,
                    lineHeight: 1.6,
                  }}
                >
                  {selectedTileDetail.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </section>

              {selectedTileStatusRecord?.note ? (
                <section style={compactCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Saved note</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                    {selectedTileStatusRecord.note}
                  </p>
                </section>
              ) : null}

              <section style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>What comes next</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Assessment checks will later help confirm whether this skill is still
                  developing, developing, secure, or strong.
                </p>
              </section>

              <section style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>Update this skill status</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Use this to record your current judgement for this learner. Formal
                  assessment checks will come later.
                </p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ASSESSMENT_STATUSES.map((status) => {
                    const meta = STATUS_META[status];
                    const active = selectedTileDraftStatus === status;

                    return (
                      <button
                        key={`draft-status-${status}`}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateSelectedTileDraftStatus(status)}
                        style={{
                          border: active ? `1px solid ${meta.dot}` : `1px solid ${meta.border}`,
                          background: active ? meta.fill : "#ffffff",
                          color: active ? meta.text : "#334155",
                          borderRadius: 999,
                          padding: "9px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ color: "#334155", fontWeight: 700 }}>Optional note</label>
                  <textarea
                    value={selectedTileDraftNote}
                    onChange={(event) => updateSelectedTileDraftNote(event.target.value)}
                    placeholder="Optional note about what you observed or want to revisit."
                    style={textareaStyle}
                  />
                </div>

                {selectedTileFeedback ? (
                  <div
                    style={{
                      border:
                        selectedTileFeedback.tone === "success"
                          ? "1px solid #bbf7d0"
                          : "1px solid #fecaca",
                      background:
                        selectedTileFeedback.tone === "success" ? "#f0fdf4" : "#fef2f2",
                      color:
                        selectedTileFeedback.tone === "success" ? "#166534" : "#b91c1c",
                      borderRadius: 14,
                      padding: "10px 12px",
                      lineHeight: 1.6,
                    }}
                  >
                    {selectedTileFeedback.message}
                  </div>
                ) : null}

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTile(null)}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveSelectedTileStatus()}
                    disabled={isSavingAssessmentStatus || !selectedLearner || !selectedFamilyId}
                    style={isSavingAssessmentStatus ? disabledButtonStyle : buttonStyle}
                  >
                    {isSavingAssessmentStatus ? "Saving..." : "Save status"}
                  </button>
                </div>

                {selectedTileStatusRecord ? (
                  <div
                    style={{
                      border: "1px solid #dbeafe",
                      background: "#ffffff",
                      borderRadius: 14,
                      padding: 14,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>
                      {selectedTileLinkedEvidenceEntry
                        ? "Added to learning evidence"
                        : "Create evidence note"}
                    </strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                      Use this to add the current assessment judgement into your learning
                      evidence and reports.
                    </p>

                    {selectedTileHasUnsavedChanges ? (
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>
                        Save this status to create an evidence note from the latest judgement.
                      </div>
                    ) : selectedTileLinkedEvidenceEntry ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ color: "#166534", lineHeight: 1.6 }}>
                          Evidence already linked for this saved status.
                          {selectedTileLinkedEvidenceLabel
                            ? ` Added ${selectedTileLinkedEvidenceLabel}.`
                            : ""}
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Link
                            href={`${capturePathBase}?evidence_entry_id=${selectedTileLinkedEvidenceEntry.id}`}
                            style={secondaryButtonStyle}
                          >
                            Open evidence
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => void createEvidenceFromSavedStatus()}
                          disabled={isCreatingAssessmentEvidence}
                          style={
                            isCreatingAssessmentEvidence ? disabledButtonStyle : secondaryButtonStyle
                          }
                        >
                          {isCreatingAssessmentEvidence
                            ? "Creating evidence..."
                            : "Create evidence note"}
                        </button>
                      </div>
                    )}

                    {selectedTileEvidenceFeedback ? (
                      <div
                        style={{
                          border:
                            selectedTileEvidenceFeedback.tone === "success"
                              ? "1px solid #bbf7d0"
                              : "1px solid #fecaca",
                          background:
                            selectedTileEvidenceFeedback.tone === "success"
                              ? "#f0fdf4"
                              : "#fef2f2",
                          color:
                            selectedTileEvidenceFeedback.tone === "success"
                              ? "#166534"
                              : "#b91c1c",
                          borderRadius: 14,
                          padding: "10px 12px",
                          lineHeight: 1.6,
                        }}
                      >
                        {selectedTileEvidenceFeedback.message}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>Future assessment actions</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Manual status tracking and evidence links are now available. Next,
                  MyLearna will add formal assessment checks, saved results, and
                  assessment summaries.
                </p>
                <div>
                  <button type="button" style={disabledButtonStyle} disabled>
                    Assessment checks coming later
                  </button>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanAssessmentsWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <AssessmentsWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
