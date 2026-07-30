"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import {
  GuidancePageAction,
  GuidanceSetupProgress,
  GuidanceSetupNextAction,
} from "@/app/components/clean/guidance/GuidanceToggle";
import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  deleteCleanEvidenceEntry,
  listCleanEvidenceEntries,
} from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { saveUnifiedLearningCapture } from "@/lib/clean/evidence/unifiedCapture";
import { resolveLearnerContext } from "@/lib/clean/learnerContext";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";
import {
  buildCurriculumCaptureContext,
  buildPathwayCaptureContext,
  encodeCurriculumContextNodeIds,
  encodePathwayContextNodeIds,
  MY_CURRICULUM_SOURCE,
  MY_PATHWAYS_SOURCE,
  parseCurriculumCaptureContextFromSearchParams,
  parseCurriculumContextFromNodeIds,
  parsePathwayCaptureContextFromSearchParams,
  parsePathwayContextFromNodeIds,
  type CleanCurriculumCaptureContext,
  type CleanPathwayCaptureContext,
} from "@/lib/clean/evidence/curriculumContext";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  updateFamilyEvidenceEntryAttachments,
  uploadFamilyEvidenceFiles,
  type UploadedFamilyEvidenceFile,
} from "@/lib/familyEvidence";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type { CleanProgram, CleanProgramSegment } from "@/lib/clean/programs/types";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(18px, 4vw, 32px) clamp(12px, 4vw, 20px) 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1080,
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const PATHWAY_OBSERVED_SKILL_STATUS_OPTIONS = [
  "Needs support",
  "Working towards",
  "Consolidating",
  "Secure",
  "Goal achieved",
  "Goal achieved + extension",
] as const;

const WORKSHEET_PROGRESS_OPTIONS = [
  { value: "Needs support", status: "Still developing" },
  { value: "Working towards", status: "Developing" },
  { value: "Consolidating", status: "Developing" },
  { value: "Secure", status: "Secure" },
  { value: "Goal achieved", status: "Secure" },
  { value: "Goal achieved + extension", status: "Strong" },
] as const;

type WorksheetProgressLevel = (typeof WORKSHEET_PROGRESS_OPTIONS)[number]["value"];

type CapturePath = "standard" | "life";

const CANONICAL_LEARNING_AREAS = [
  "English",
  "Mathematics",
  "Science",
  "Humanities and Social Sciences",
  "Arts",
  "Technologies",
  "Health and Physical Education",
  "Languages",
  "Life skills",
] as const;

type LearningFromLifeSuggestion = {
  title: string;
  evidenceType: string;
  learningArea: string;
  tags: string[];
  observation: string;
  draftReportSentence: string;
  includeInPortfolio: boolean;
  includeInReport: boolean;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    0?: { transcript?: string };
    isFinal: boolean;
  }>;
};

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || !Number.isFinite(bytes)) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildLearningFromLifeSuggestion(
  description: string,
  learnerLabel: string,
): LearningFromLifeSuggestion {
  // Future AI suggestion services should plug in before this deterministic fallback.
  const text = description.toLowerCase();
  const learner = learnerLabel || "The learner";
  const fallback: LearningFromLifeSuggestion = {
    title: "Learning from life",
    evidenceType: "Real-world learning",
    learningArea: "Life skills",
    tags: ["real-world learning"],
    observation: `${learner} took part in a real-world learning activity.`,
    draftReportSentence: `${learner} used practical learning skills during a real-world activity.`,
    includeInPortfolio: true,
    includeInReport: true,
  };

  const mappings: Array<{
    keywords: string[];
    title: string;
    learningArea: string;
    tags: string[];
    observation: string;
    draftReportSentence: string;
  }> = [
    {
      keywords: ["baking", "cook", "recipe", "kitchen"],
      title: "Cooking and measurement",
      learningArea: "Maths, Science, Life skills",
      tags: ["measurement", "fractions", "procedural language"],
      observation: `${learner} followed practical steps, measured ingredients, and noticed changes during cooking.`,
      draftReportSentence: `${learner} applied measurement, sequencing, and observation skills through cooking.`,
    },
    {
      keywords: ["garden", "plant", "watering", "seed", "soil"],
      title: "Gardening observation",
      learningArea: "Science, Maths, Life skills",
      tags: ["plants", "growth", "measurement", "responsibility"],
      observation: `${learner} observed plants and took responsibility for a practical gardening task.`,
      draftReportSentence: `${learner} developed observation and responsibility through gardening and plant care.`,
    },
    {
      keywords: ["shop", "shopping", "budget", "money", "price", "receipt"],
      title: "Shopping and budgeting",
      learningArea: "Maths, English, Life skills",
      tags: ["money", "estimation", "reading labels", "budgeting"],
      observation: `${learner} used money, estimation, and decision-making in a shopping context.`,
      draftReportSentence: `${learner} applied practical money and reading skills during shopping and budgeting.`,
    },
    {
      keywords: ["nature", "walk", "beach", "park", "bird", "animal", "weather"],
      title: "Nature walk observation",
      learningArea: "Science, Geography, English",
      tags: ["observation", "place", "vocabulary", "environment"],
      observation: `${learner} noticed and described features of the natural environment.`,
      draftReportSentence: `${learner} built observation, vocabulary, and place awareness during a nature walk.`,
    },
    {
      keywords: ["lego", "building", "blocks", "build", "construction", "model"],
      title: "Building and design",
      learningArea: "Maths, Design and Technology",
      tags: ["spatial reasoning", "design", "problem solving"],
      observation: `${learner} planned, built, adjusted, and explained a practical design.`,
      draftReportSentence: `${learner} used spatial reasoning, design thinking, and problem solving while building.`,
    },
    {
      keywords: ["read", "reading", "aloud", "book", "story"],
      title: "Reading aloud",
      learningArea: "English",
      tags: ["reading", "oral language", "comprehension"],
      observation: `${learner} engaged with text and practised oral language through reading.`,
      draftReportSentence: `${learner} strengthened reading fluency, vocabulary, and comprehension through reading aloud.`,
    },
    {
      keywords: ["craft", "design", "draw", "paint", "making"],
      title: "Creative project",
      learningArea: "Arts, Design and Technology",
      tags: ["design", "fine motor", "creative choices"],
      observation: `${learner} made creative choices and refined a practical work sample.`,
      draftReportSentence: `${learner} developed creative decision-making and practical design skills through project work.`,
    },
    {
      keywords: ["game", "board game", "cards", "dice"],
      title: "Game-based learning",
      learningArea: "Maths, English, Social skills",
      tags: ["turn-taking", "strategy", "number", "reasoning"],
      observation: `${learner} practised strategy, reasoning, and turn-taking through a game.`,
      draftReportSentence: `${learner} used reasoning, communication, and strategy during game-based learning.`,
    },
  ];

  const match = mappings.find((mapping) =>
    mapping.keywords.some((keyword) => text.includes(keyword)),
  );

  if (!match) return fallback;

  return {
    evidenceType: "Real-world learning",
    includeInPortfolio: true,
    includeInReport: true,
    ...match,
  };
}

function buildLearningFromLifeReflection({
  evidenceType,
  tags,
  observation,
  draftReportSentence,
}: {
  evidenceType: string;
  tags: string;
  observation: string;
  draftReportSentence: string;
}) {
  return [
    evidenceType ? `Evidence type: ${evidenceType}` : "",
    tags ? `Tags: ${tags}` : "",
    observation ? `Parent observation: ${observation}` : "",
    draftReportSentence ? `Draft report sentence: ${draftReportSentence}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function getSpeechRecognitionErrorMessage(errorCode: string | undefined) {
  if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
    return "Microphone access was blocked. You can allow it in your browser settings or type instead.";
  }

  if (errorCode === "no-speech") {
    return "I couldn't catch anything. Try again, or type what happened.";
  }

  if (errorCode === "audio-capture") {
    return "I couldn't access the microphone. You can try again or type instead.";
  }

  if (errorCode === "network") {
    return "Speech input stopped. Try again, or type what happened.";
  }

  if (errorCode === "aborted") {
    return "Listening stopped. You can try again or type what happened.";
  }

  return "Speech input stopped. Try again, or type what happened.";
}

function getWorksheetParentNote(reflection: string) {
  return reflection
    .split("\n")
    .filter((line) => {
      const clean = line.trim();
      return (
        clean &&
        !/^Progress level:/i.test(clean) &&
        !/^Source:/i.test(clean) &&
        !/^Worksheet:/i.test(clean)
      );
    })
    .join("\n");
}

function logWorksheetUploadDiagnostic(
  phase: string,
  details: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "production") return;
  console.info("[worksheet-evidence-upload]", {
    phase,
    ...details,
  });
}

function uploadPhaseErrorMessage(phase: string, error: Error) {
  const message = error.message || "";
  if (phase === "context") {
    return "Photo upload could not start because evidence context was missing.";
  }
  if (/permission|policy|row-level|rls|unauthorized|not authorized/i.test(message)) {
    return "Storage permission error. Please try again or contact support.";
  }
  if (phase === "attachment-update") {
    return "Photo uploaded, but MyLearna could not attach it to this evidence record. Please try again.";
  }
  return "Photo upload failed. Check your connection and try again.";
}

type WorksheetAttachmentUpdateError = Error & {
  uploadedAttachments?: UploadedFamilyEvidenceFile[];
};

async function compressWorksheetEvidenceImage(file: File) {
  if (!file.type.startsWith("image/")) return file;
  if (typeof document === "undefined" || typeof Image === "undefined") return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("The selected image could not be prepared for upload."));
      nextImage.src = objectUrl;
    });

    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    if (scale >= 1 && file.size <= 2.5 * 1024 * 1024) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "worksheet-evidence";
    return new File([blob], `${baseName}-compressed.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function buildCalendarOptionLabel(item: CleanCalendarItem, learnerLabel: string) {
  return `${formatDateLabel(item.plannedDate)} - ${item.title} - ${learnerLabel}`;
}

function safeQueryValue(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function humanizeQuerySlug(value: string) {
  const normalized = safeQueryValue(value);
  if (!normalized) return "";

  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildCurriculumTitleSuggestion(
  context: CleanCurriculumCaptureContext | null,
) {
  if (!context) return "";

  const priorityLabel =
    context.curriculumElementLabel ||
    context.authorityEvidenceAreaLabel ||
    context.learningAreaLabel ||
    "";

  return priorityLabel ? `Evidence for ${priorityLabel}` : "";
}

function buildPathwayTitleSuggestion(
  context: CleanPathwayCaptureContext | null,
) {
  if (!context) return "";

  const stepNumber = safeQueryValue(context.stepNumber);
  const stepTitle = safeQueryValue(context.stepTitle);

  if (stepNumber && stepTitle) {
    return `Evidence for Step ${stepNumber} - ${stepTitle}`;
  }

  if (stepTitle) {
    return `Evidence for ${stepTitle}`;
  }

  return "";
}

function lowerCaseFirstLetter(value: string) {
  const text = safeQueryValue(value);
  if (!text) return "";
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function buildPathwayWhatHappenedSuggestion(
  context: CleanPathwayCaptureContext | null,
  learnerLabel: string,
) {
  if (!context) return "";

  const stepNumber = safeQueryValue(context.stepNumber);
  const stepTitle = safeQueryValue(context.stepTitle);
  const pathwayLabel = safeQueryValue(context.pathwayLabel) || "pathway";
  const stepMeaning = lowerCaseFirstLetter(safeQueryValue(context.stepMeaning));
  const learnerPrefix = safeQueryValue(learnerLabel) || "The learner";
  const stepLabel =
    stepNumber && stepTitle
      ? `Step ${stepNumber} - ${stepTitle}`
      : stepTitle || "this pathway step";

  const parts = [`${learnerPrefix} worked on ${stepLabel} in the ${pathwayLabel}.`];

  if (stepMeaning) {
    parts.push(`This step focuses on: ${safeQueryValue(context.stepMeaning)}`);
  }

  return parts.join(" ");
}

function getCurriculumContextRows(context: CleanCurriculumCaptureContext) {
  return [
    context.learningAreaLabel
      ? { label: "Learning area", value: context.learningAreaLabel }
      : null,
    context.curriculumElementLabel
      ? { label: "Curriculum element", value: context.curriculumElementLabel }
      : null,
    context.authorityEvidenceAreaLabel
      ? {
          label: "Authority evidence area",
          value: context.authorityEvidenceAreaLabel,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

function buildPathwayStepLabel(context: CleanPathwayCaptureContext | null) {
  if (!context) return "";

  const stepNumber = safeQueryValue(context.stepNumber);
  const stepTitle = safeQueryValue(context.stepTitle);

  if (stepNumber && stepTitle) {
    return `Step ${stepNumber} - ${stepTitle}`;
  }

  return stepTitle || "Pathway step";
}

function getPathwayContextRows(context: CleanPathwayCaptureContext) {
  return [
    context.pathwayLabel ? { label: "Pathway", value: context.pathwayLabel } : null,
    context.stageLabel ? { label: "Stage", value: context.stageLabel } : null,
    context.subjectLabel ? { label: "Subject", value: context.subjectLabel } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

function CleanCaptureWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const { user } = useAuthUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<CleanEvidenceEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [calendarItems, setCalendarItems] = useState<CleanCalendarItem[]>([]);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);
  const [recentNotesOpen, setRecentNotesOpen] = useState(false);
  const [capturePath, setCapturePath] = useState<CapturePath>("standard");

  const [learnerId, setLearnerId] = useState("");
  const [learnerChangePendingId, setLearnerChangePendingId] = useState("");
  const [observedOn, setObservedOn] = useState(getTodayDate);
  const [title, setTitle] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [reflection, setReflection] = useState("");
  const [learnerReflection, setLearnerReflection] = useState("");
  const [learningArea, setLearningArea] = useState("");
  const [programId, setProgramId] = useState("");
  const [calendarItemId, setCalendarItemId] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formCurriculumContext, setFormCurriculumContext] =
    useState<CleanCurriculumCaptureContext | null>(null);
  const [formPathwayContext, setFormPathwayContext] =
    useState<CleanPathwayCaptureContext | null>(null);
  const [pathwayObservedSkillStatus, setPathwayObservedSkillStatus] = useState("");
  const [worksheetProgressLevel, setWorksheetProgressLevel] =
    useState<WorksheetProgressLevel | "">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoSelectionMessage, setPhotoSelectionMessage] = useState("No photo attached yet.");
  const [lifeEvidenceType, setLifeEvidenceType] = useState("Real-world learning");
  const [lifeTags, setLifeTags] = useState("");
  const [lifeObservation, setLifeObservation] = useState("");
  const [lifeDraftReportSentence, setLifeDraftReportSentence] = useState("");
  const [lifeAddToPortfolio, setLifeAddToPortfolio] = useState(true);
  const [lifeIncludeInReport, setLifeIncludeInReport] = useState(true);
  const [lifeSuggestionsReady, setLifeSuggestionsReady] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechListening, setSpeechListening] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("Speech input is optional.");
  const [savedAttachments, setSavedAttachments] = useState<UploadedFamilyEvidenceFile[]>([]);
  const [lastSavedCurriculumContext, setLastSavedCurriculumContext] =
    useState<CleanCurriculumCaptureContext | null>(null);
  const [lastSavedPathwayContext, setLastSavedPathwayContext] =
    useState<CleanPathwayCaptureContext | null>(null);
  const [lastSavedReturnPath, setLastSavedReturnPath] = useState("");
  const [lastSavedEvidenceId, setLastSavedEvidenceId] = useState("");
  const [lastSavedLearnerLabel, setLastSavedLearnerLabel] = useState("");
  const [lastSavedTitle, setLastSavedTitle] = useState("");
  const [lastSavedDate, setLastSavedDate] = useState("");
  const [lastSavedLearningArea, setLastSavedLearningArea] = useState("");
  const [lastSavedPortfolioIncluded, setLastSavedPortfolioIncluded] = useState(true);
  const [lastSavedReportIncluded, setLastSavedReportIncluded] = useState(true);
  const [lastSavedWorksheetProgress, setLastSavedWorksheetProgress] = useState("");
  const [lastSavedPhotoAttached, setLastSavedPhotoAttached] = useState(false);
  const [lastSavedPhotoPreviewUrl, setLastSavedPhotoPreviewUrl] = useState("");
  const [pendingAttachmentEvidenceId, setPendingAttachmentEvidenceId] = useState("");
  const [pendingAttachmentError, setPendingAttachmentError] = useState("");
  const [pendingAttachmentFileName, setPendingAttachmentFileName] = useState("");
  const [pendingUploadedAttachments, setPendingUploadedAttachments] = useState<
    UploadedFamilyEvidenceFile[]
  >([]);
  const [savePhase, setSavePhase] = useState("");
  const [lastAppliedContextKey, setLastAppliedContextKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSessionHadTextRef = useRef(false);
  const speechSessionStoppedManuallyRef = useRef(false);
  const speechStartInProgressRef = useRef(false);

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const captureContextKey = searchParams.toString();
  const evidenceEntryIdFromQuery = safeQueryValue(searchParams.get("evidence_entry_id"));
  const calendarItemIdFromQuery = safeQueryValue(searchParams.get("calendar_item_id"));
  const learnerIdFromQuery =
    safeQueryValue(searchParams.get("learner_id")) ||
    safeQueryValue(searchParams.get("learnerId"));
  const programIdFromQuery = safeQueryValue(searchParams.get("program_id"));
  const programSegmentIdFromQuery = safeQueryValue(searchParams.get("program_segment_id"));
  const learningAreaFromQuery = safeQueryValue(searchParams.get("learningArea"));
  const curriculumElementFromQuery = safeQueryValue(searchParams.get("curriculumElement"));
  const curriculumElementLabelFromQuery = safeQueryValue(
    searchParams.get("curriculumElementLabel"),
  );
  const learningAreaLabelFromQuery = safeQueryValue(searchParams.get("learningAreaLabel"));
  const worksheetEvidenceMode =
    safeQueryValue(searchParams.get("worksheetEvidence")) === "1" ||
    safeQueryValue(searchParams.get("evidenceSource")) === "worksheet_evidence";
  const learningFromLifeActive = capturePath === "life" && !worksheetEvidenceMode;
  const worksheetTitleFromQuery = safeQueryValue(searchParams.get("worksheetTitle"));
  const worksheetHrefFromQuery = safeQueryValue(searchParams.get("worksheetHref"));
  const worksheetProgressFromQuery = safeQueryValue(searchParams.get("progressLevel"));
  const returnToFromQuery = safeQueryValue(searchParams.get("returnTo"));
  const observedOnFromQuery =
    safeQueryValue(searchParams.get("observed_on")) ||
    safeQueryValue(searchParams.get("planned_date"));
  const curriculumContextFromQuery = useMemo(
    () => parseCurriculumCaptureContextFromSearchParams(searchParams),
    [searchParams],
  );
  const pathwayContextFromQuery = useMemo(
    () => parsePathwayCaptureContextFromSearchParams(searchParams),
    [searchParams],
  );
  const curriculumReturnPath = pathname.startsWith("/clean-my-capture")
    ? "/clean-my-curriculum"
    : "/my-learna";
  const pathwaysReturnPath = pathname.startsWith("/clean-my-capture")
    ? "/clean-my-pathways"
    : "/my-pathways";
  const portfolioReturnPath = `${pathname.startsWith("/clean-my-capture") ? "/clean-my-portfolio" : "/my-portfolio"}${
    learnerIdFromQuery ? `?learner_id=${encodeURIComponent(learnerIdFromQuery)}` : ""
  }`;
  const portfolioLearningRecordPath = `${portfolioReturnPath}${
    portfolioReturnPath.includes("?") ? "&" : "?"
  }focus=learning-record`;
  const savedEvidencePortfolioPath = lastSavedEvidenceId
    ? `${portfolioReturnPath}${portfolioReturnPath.includes("?") ? "&" : "?"}latestEvidenceId=${encodeURIComponent(lastSavedEvidenceId)}&source=my-capture`
    : portfolioReturnPath;
  const savedEvidenceLearningRecordPath = lastSavedEvidenceId
    ? `${savedEvidencePortfolioPath}&focus=learning-record`
    : portfolioLearningRecordPath;
  const worksheetReturnPath =
    returnToFromQuery.startsWith("/") && !returnToFromQuery.startsWith("//")
      ? returnToFromQuery
      : pathwaysReturnPath;
  function appendSavedEvidenceReturnParams(href: string) {
    const [withoutHash, hash = ""] = href.split("#");
    const separator = withoutHash.includes("?") ? "&" : "?";
    const nextHref = lastSavedEvidenceId
      ? `${withoutHash}${separator}latestEvidenceId=${encodeURIComponent(lastSavedEvidenceId)}&source=my-capture`
      : withoutHash;
    return hash ? `${nextHref}#${hash}` : nextHref;
  }
  const savedEvidencePathwayReturnPath = appendSavedEvidenceReturnParams(
    lastSavedReturnPath || pathwaysReturnPath,
  );

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === programId) ?? null,
    [programId, programs],
  );

  const selectedCalendarItem = useMemo(
    () => calendarItems.find((item) => item.id === calendarItemId) ?? null,
    [calendarItemId, calendarItems],
  );

  const selectedProgramSegment = useMemo(() => {
    const linkedSegmentId =
      programSegmentIdFromQuery || selectedCalendarItem?.programSegmentId || "";
    if (!linkedSegmentId) return null;
    return programSegments.find((segment) => segment.id === linkedSegmentId) ?? null;
  }, [programSegmentIdFromQuery, programSegments, selectedCalendarItem?.programSegmentId]);

  const filteredPrograms = useMemo(() => {
    if (!learnerId) return programs;

    return programs.filter(
      (program) => program.learnerId === null || program.learnerId === learnerId,
    );
  }, [learnerId, programs]);

  const filteredCalendarItems = useMemo(() => {
    if (!learnerId) return calendarItems;

    return calendarItems.filter(
      (item) => item.learnerId === null || item.learnerId === learnerId,
    );
  }, [calendarItems, learnerId]);

  const reloadEntries = useCallback(async () => {
    if (!workspace.profile) return;

    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const nextEntries = await listCleanEvidenceEntries(workspace.profile.id, {
        limit: 50,
      });
      setEntries(nextEntries);
    } catch (error) {
      setEntriesError(
        normalizeCleanErrorMessage(
          error,
          "We could not load your capture notes just now.",
        ),
      );
    } finally {
      setEntriesLoading(false);
    }
  }, [workspace.profile]);

  const reloadLinkOptions = useCallback(async () => {
    if (!workspace.profile) return;

    setLinkingLoading(true);
    setLinkingError(null);
    try {
      const [nextPrograms, nextCalendarItems] = await Promise.all([
        listCleanPrograms(workspace.profile.id, { limit: 50 }),
        listCleanCalendarItems(workspace.profile.id, { limit: 50 }),
      ]);

      const nextProgramSegments = (
        await Promise.all(
          nextPrograms.map((program) =>
            listCleanProgramSegments(workspace.profile!.id, program.id),
          ),
        )
      ).flat();

      setPrograms(nextPrograms);
      setProgramSegments(nextProgramSegments);
      setCalendarItems(nextCalendarItems);
    } catch (error) {
      setLinkingError(
        normalizeCleanErrorMessage(
          error,
          "We could not load the optional calendar links just now.",
        ),
      );
    } finally {
      setLinkingLoading(false);
    }
  }, [workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setEntries([]);
      setPrograms([]);
      setProgramSegments([]);
      setCalendarItems([]);
      return;
    }

    void reloadEntries();
    void reloadLinkOptions();
  }, [
    reloadEntries,
    reloadLinkOptions,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    return () => {
      const recognition = speechRecognitionRef.current;
      if (!recognition) return;

      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // The browser may already have ended the speech session.
      }
      speechRecognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!workspace.learners.length) {
      setLearnerId("");
      return;
    }

    const currentIsValid = workspace.learners.some((learner) => learner.id === learnerId);
    if (currentIsValid) return;

    const hasAuthoritativeContext = Boolean(
      pathwayContextFromQuery ||
        worksheetEvidenceMode ||
        calendarItemIdFromQuery ||
        programSegmentIdFromQuery ||
        programIdFromQuery,
    );
    const hasInvalidExplicitLearner = Boolean(
      learnerIdFromQuery &&
        !workspace.learners.some((learner) => learner.id === learnerIdFromQuery),
    );
    if (hasAuthoritativeContext || hasInvalidExplicitLearner) {
      return;
    }

    const resolution = resolveLearnerContext({
      learners: workspace.learners,
      activeLearnerId: workspace.setupStatus.activeLearnerId,
      rememberedLearnerId: workspace.setupStatus.activeLearnerId,
    });
    setLearnerId(resolution.learner?.id || "");
  }, [
    calendarItemIdFromQuery,
    learnerId,
    learnerIdFromQuery,
    pathwayContextFromQuery,
    programIdFromQuery,
    programSegmentIdFromQuery,
    workspace.learners,
    workspace.setupStatus.activeLearnerId,
    worksheetEvidenceMode,
  ]);

  useEffect(() => {
    if (programId && !filteredPrograms.some((program) => program.id === programId)) {
      setProgramId("");
    }

    if (
      calendarItemId &&
      !filteredCalendarItems.some((item) => item.id === calendarItemId)
    ) {
      setCalendarItemId("");
    }
  }, [calendarItemId, filteredCalendarItems, filteredPrograms, programId]);

  const editingEntry = useMemo(
    () => entries.find((entry) => entry.id === editingEntryId) ?? null,
    [editingEntryId, entries],
  );

  function resetForm(
    nextLearnerId?: string,
    options: { keepCurriculumContext?: boolean; keepPathwayContext?: boolean } = {},
  ) {
    setEditingEntryId(null);
    setObservedOn(getTodayDate());
    setTitle("");
    setWhatHappened("");
    setReflection("");
    setLearnerReflection("");
    setLearningArea("");
    setLifeEvidenceType("Real-world learning");
    setLifeTags("");
    setLifeObservation("");
    setLifeDraftReportSentence("");
    setLifeAddToPortfolio(true);
    setLifeIncludeInReport(true);
    setLifeSuggestionsReady(false);
    speechSessionHadTextRef.current = false;
    speechSessionStoppedManuallyRef.current = false;
    speechStartInProgressRef.current = false;
    const activeRecognition = speechRecognitionRef.current;
    if (activeRecognition) {
      activeRecognition.onresult = null;
      activeRecognition.onerror = null;
      activeRecognition.onend = null;
    }
    try {
      activeRecognition?.stop();
    } catch {
      // The browser may already have ended the speech session.
    }
    speechRecognitionRef.current = null;
    setSpeechListening(false);
    setSpeechMessage("Speech input is optional.");
    setProgramId("");
    setCalendarItemId("");
    setPathwayObservedSkillStatus("");
    setWorksheetProgressLevel("");
    setPhotoFile(null);
    setPhotoName("");
    setPhotoSelectionMessage("No photo attached yet.");
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
    setSavedAttachments([]);
    setPendingAttachmentEvidenceId("");
    setPendingAttachmentError("");
    setPendingAttachmentFileName("");
    setPendingUploadedAttachments([]);
    if (!options.keepCurriculumContext) {
      setFormCurriculumContext(null);
    }
    if (!options.keepPathwayContext) {
      setFormPathwayContext(null);
    }
    setLearnerId(nextLearnerId ?? workspace.profile?.defaultLearnerId ?? workspace.learners[0]?.id ?? "");
  }

  function clearCaptureContext() {
    setLastAppliedContextKey("");
    router.replace(pathname);
  }

  function switchCapturePath(nextPath: CapturePath) {
    setCapturePath(nextPath);
    setMessage(null);
    setActionError(null);
    if (nextPath === "life") {
      setFormCurriculumContext(null);
      setFormPathwayContext(null);
      setProgramId("");
      setCalendarItemId("");
      setPathwayObservedSkillStatus("");
      setLifeEvidenceType((current) => current || "Real-world learning");
    }
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setActionError(null);
    setMessage(null);
    setSavedAttachments([]);
    setPendingUploadedAttachments([]);
    setPhotoFile(file);
    setPhotoName(file?.name ?? "");
    setPhotoSelectionMessage(
      file ? "Photo attached." : "No photo was selected. You can try again or save progress without a photo.",
    );
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : "";
    });
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoName("");
    setPhotoSelectionMessage("No photo attached yet.");
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  }

  function applyLearningFromLifeSuggestions() {
    if (!whatHappened.trim()) {
      setActionError("Add a short description first so MyLearna can suggest evidence details.");
      setMessage(null);
      return;
    }

    const learnerLabel =
      learnerOptions.find((option) => option.value === learnerId)?.label || "The learner";
    const suggestion = buildLearningFromLifeSuggestion(whatHappened, learnerLabel);

    setTitle(suggestion.title);
    setLifeEvidenceType(suggestion.evidenceType);
    setLearningArea(suggestion.learningArea);
    setLifeTags(suggestion.tags.join(", "));
    setLifeObservation(suggestion.observation);
    setLifeDraftReportSentence(suggestion.draftReportSentence);
    setLifeAddToPortfolio(suggestion.includeInPortfolio);
    setLifeIncludeInReport(suggestion.includeInReport);
    setLifeSuggestionsReady(true);
    setMessage(null);
    setActionError(null);
  }

  function appendSpeechTranscript(transcript: string) {
    const nextTranscript = transcript.trim();
    if (!nextTranscript) return;

    speechSessionHadTextRef.current = true;
    setWhatHappened((current) =>
      [current.trim(), nextTranscript].filter(Boolean).join(" "),
    );
    setLifeSuggestionsReady(false);
    setSpeechMessage("Transcript ready. Edit anything before saving.");
  }

  function clearActiveSpeechRecognition() {
    const recognition = speechRecognitionRef.current;
    speechStartInProgressRef.current = false;
    if (!recognition) return;

    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    speechRecognitionRef.current = null;
  }

  async function startSpeechInput() {
    if (typeof window === "undefined") return;

    if (speechRecognitionRef.current || speechStartInProgressRef.current) {
      return;
    }

    const recognitionConstructor =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;

    if (!recognitionConstructor) {
      setSpeechSupported(false);
      setSpeechMessage("Speech input is not supported in this browser. You can type instead.");
      return;
    }

    speechStartInProgressRef.current = true;
    setSpeechSupported(true);
    setSpeechListening(false);
    setSpeechMessage("Checking microphone permission...");
    speechSessionHadTextRef.current = false;
    speechSessionStoppedManuallyRef.current = false;
    setActionError(null);
    setMessage(null);

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        setSpeechListening(false);
        setSpeechMessage(
          name === "NotAllowedError" || name === "SecurityError"
            ? "Microphone access was blocked. You can allow it in your browser settings or type instead."
            : "Speech input stopped. Try again, or type what happened.",
        );
        speechStartInProgressRef.current = false;
        return;
      }
    }

    const recognition = new recognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-AU";
    speechRecognitionRef.current = recognition;
    speechStartInProgressRef.current = false;
    setSpeechListening(true);
    setSpeechMessage("Listening... speak now.");

    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += ` ${event.results[index]?.[0]?.transcript ?? ""}`;
      }
      if (transcript.trim()) {
        appendSpeechTranscript(transcript);
      }
    };
    recognition.onerror = (event) => {
      clearActiveSpeechRecognition();
      speechSessionStoppedManuallyRef.current = event.error === "aborted";
      setSpeechListening(false);
      setSpeechMessage(getSpeechRecognitionErrorMessage(event.error));
    };
    recognition.onend = () => {
      const capturedText = speechSessionHadTextRef.current;
      const stoppedManually = speechSessionStoppedManuallyRef.current;
      clearActiveSpeechRecognition();
      setSpeechListening(false);
      if (capturedText) {
        setSpeechMessage("Transcript ready. Edit anything before saving.");
      } else if (stoppedManually) {
        setSpeechMessage("Listening stopped. You can try again or type what happened.");
      } else {
        setSpeechMessage("I couldn't catch anything. Try again, or type what happened.");
      }
    };

    try {
      recognition.start();
    } catch {
      clearActiveSpeechRecognition();
      speechStartInProgressRef.current = false;
      setSpeechListening(false);
      setSpeechMessage("Speech input stopped. Try again, or type what happened.");
    }
  }

  function stopSpeechInput() {
    const recognition = speechRecognitionRef.current;
    if (!recognition) return;

    speechSessionStoppedManuallyRef.current = true;
    try {
      recognition.stop();
    } catch {
      clearActiveSpeechRecognition();
      setSpeechListening(false);
      setSpeechMessage(
        speechSessionHadTextRef.current
          ? "Transcript ready. Edit anything before saving."
          : "Listening stopped. You can try again or type what happened.",
      );
    }
  }

  function updateWorksheetProgress(nextProgress: WorksheetProgressLevel) {
    const selected = WORKSHEET_PROGRESS_OPTIONS.find((option) => option.value === nextProgress);
    setWorksheetProgressLevel(nextProgress);
    setPathwayObservedSkillStatus(selected?.status || "");
    setReflection((current) => {
      const withoutProgress = current
        .split("\n")
        .filter((line) => !/^Progress level:/i.test(line.trim()))
        .join("\n")
        .trim();
      return [`Progress level: ${nextProgress}`, withoutProgress].filter(Boolean).join("\n");
    });
  }

  async function finaliseWorksheetPhotoAttachment(
    evidenceId: string,
    uploadedAttachments: UploadedFamilyEvidenceFile[],
  ) {
    setSavePhase("Finalising attachment...");
    logWorksheetUploadDiagnostic("attachment-update-started", {
      evidenceEntryId: evidenceId,
      uploadedCount: uploadedAttachments.length,
      uploadedPaths: uploadedAttachments.map((attachment) =>
        attachment.path.split("/").slice(0, 6).join("/"),
      ),
    });

    const updateResult = await updateFamilyEvidenceEntryAttachments({
      evidenceId,
      attachmentUrls: uploadedAttachments.map((attachment) => ({
        path: attachment.path,
        name: attachment.label,
        mimeType: attachment.mimeType,
        size: attachment.size,
        kind: attachment.kind,
      })),
      imageUrl: uploadedAttachments.find((attachment) => attachment.kind === "image")?.path ?? null,
    });

    const storedAttachmentText = updateResult.attachmentUrls.join("\n");
    const missingAttachment = uploadedAttachments.find(
      (attachment) =>
        !storedAttachmentText.includes(attachment.path) &&
        updateResult.imageUrl !== attachment.path,
    );

    if (missingAttachment) {
      throw new Error("Evidence attachment update did not confirm the uploaded photo reference.");
    }

    logWorksheetUploadDiagnostic("attachment-update-succeeded", {
      evidenceEntryId: evidenceId,
      uploadedCount: uploadedAttachments.length,
      storedAttachmentCount: updateResult.attachmentUrls.length,
      imageUrlPresent: Boolean(updateResult.imageUrl),
    });
  }

  async function uploadWorksheetPhotoForEvidence(evidenceId: string, file: File) {
    if (!workspace.profile) {
      throw new Error("Family workspace is required before uploading a photo.");
    }
    if (!learnerId) {
      throw new Error("Choose a learner before uploading a photo.");
    }

    logWorksheetUploadDiagnostic("context", {
      evidenceEntryId: evidenceId,
      bucket: "evidence",
      storagePathPrefix: `family/${workspace.profile.id}/learner/${learnerId}/evidence/${evidenceId}`,
      fileName: file.name,
      fileType: file.type,
      originalSize: file.size,
      learnerIdPresent: Boolean(learnerId),
      familyIdPresent: Boolean(workspace.profile.id),
      userIdPresent: Boolean(user?.id),
    });

    const preparedFile = await compressWorksheetEvidenceImage(file);
    logWorksheetUploadDiagnostic("compression-complete", {
      evidenceEntryId: evidenceId,
      fileName: preparedFile.name,
      fileType: preparedFile.type,
      originalSize: file.size,
      compressedSize: preparedFile.size,
      compressedIsValid: preparedFile.size > 0 && preparedFile.type.startsWith("image/"),
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        setSavePhase(attempt === 1 ? "Uploading photo..." : "Retrying photo upload...");
        logWorksheetUploadDiagnostic("upload-started", {
          evidenceEntryId: evidenceId,
          bucket: "evidence",
          attempt,
          fileName: preparedFile.name,
          fileType: preparedFile.type,
          compressedSize: preparedFile.size,
        });
        const uploadResult = await uploadFamilyEvidenceFiles({
          familyProfileId: workspace.profile.id,
          studentId: learnerId,
          evidenceId,
          files: [preparedFile],
        });

        if (uploadResult.failed.length) {
          logWorksheetUploadDiagnostic("upload-failed", {
            evidenceEntryId: evidenceId,
            attempt,
            failures: uploadResult.failed.map((failure) => ({
              name: failure.name,
              message: failure.message,
              code: failure.code ?? null,
              status: failure.status ?? null,
            })),
          });
          throw new Error(
            uploadResult.failed
              .map((failure) => `${failure.name}: ${failure.message}`)
              .join(" "),
          );
        }

        const uploadedAttachments = uploadResult.uploaded;
        logWorksheetUploadDiagnostic("upload-succeeded", {
          evidenceEntryId: evidenceId,
          attempt,
          uploadedCount: uploadedAttachments.length,
          paths: uploadedAttachments.map((attachment) => attachment.path.split("/").slice(0, 6).join("/")),
        });

        try {
          await finaliseWorksheetPhotoAttachment(evidenceId, uploadedAttachments);
        } catch (attachmentError) {
          const rawAttachmentError =
            attachmentError instanceof Error
              ? attachmentError
              : new Error("The photo could not be linked to the evidence entry.");
          logWorksheetUploadDiagnostic("phase-failed", {
            evidenceEntryId: evidenceId,
            phase: "attachment-update",
            attempt,
            errorName: rawAttachmentError.name,
            errorMessage: rawAttachmentError.message,
            errorCode: (rawAttachmentError as unknown as { code?: unknown }).code ?? null,
            errorStatus: (rawAttachmentError as unknown as { status?: unknown }).status ?? null,
          });
          const nextError = new Error(
            uploadPhaseErrorMessage("attachment-update", rawAttachmentError),
          ) as WorksheetAttachmentUpdateError;
          nextError.uploadedAttachments = uploadedAttachments;
          throw nextError;
        }

        return uploadedAttachments;
      } catch (error) {
        const rawError = error instanceof Error ? error : new Error("The photo could not be uploaded.");
        const uploadedAttachments =
          (rawError as WorksheetAttachmentUpdateError).uploadedAttachments ?? [];
        if (uploadedAttachments.length) {
          throw rawError;
        }
        logWorksheetUploadDiagnostic("phase-failed", {
          evidenceEntryId: evidenceId,
          phase: "storage-upload",
          attempt,
          errorName: rawError.name,
          errorMessage: rawError.message,
          errorCode: (rawError as unknown as { code?: unknown }).code ?? null,
          errorStatus: (rawError as unknown as { status?: unknown }).status ?? null,
        });
        lastError = new Error(uploadPhaseErrorMessage("storage-upload", rawError));
        if (attempt >= 2) break;
      }
    }

    throw lastError ?? new Error("The photo could not be uploaded.");
  }

  useEffect(() => {
    if (
      !workspace.profile ||
      !captureContextKey ||
      captureContextKey === lastAppliedContextKey ||
      linkingLoading ||
      entriesLoading
    ) {
      return;
    }

    if (evidenceEntryIdFromQuery) {
      const existingEntry = entries.find((entry) => entry.id === evidenceEntryIdFromQuery);
      if (!existingEntry) return;

      const existingEntryCurriculumContext = parseCurriculumContextFromNodeIds(
        existingEntry.curriculumNodeIds,
      );
      const existingEntryPathwayContext = parsePathwayContextFromNodeIds(
        existingEntry.curriculumNodeIds,
      );
      setEditingEntryId(existingEntry.id);
      setLearnerId(existingEntry.learnerId);
      setObservedOn(existingEntry.observedOn);
      setTitle(existingEntry.title || "");
      setWhatHappened(existingEntry.whatHappened);
      setReflection(existingEntry.reflection || "");
      setLearnerReflection("");
      setLearningArea(existingEntry.learningArea || "");
      setProgramId(existingEntry.programId || "");
      setCalendarItemId(existingEntry.calendarItemId || calendarItemIdFromQuery || "");
      setFormCurriculumContext(existingEntryCurriculumContext);
      setFormPathwayContext(existingEntryPathwayContext);
      setPathwayObservedSkillStatus(
        safeQueryValue(existingEntryPathwayContext?.observedSkillStatus),
      );
      setMessage(null);
      setActionError(null);
      setLastSavedCurriculumContext(null);
      setLastSavedPathwayContext(null);
      setLastAppliedContextKey(captureContextKey);
      return;
    }

    const linkedCalendarItem = calendarItemIdFromQuery
      ? calendarItems.find((item) => item.id === calendarItemIdFromQuery) ?? null
      : null;
    const linkedProgram = programIdFromQuery
      ? programs.find((program) => program.id === programIdFromQuery) ?? null
      : null;
    const linkedSegment = programSegmentIdFromQuery
      ? programSegments.find((segment) => segment.id === programSegmentIdFromQuery) ?? null
      : null;
    const nextCurriculumContext = curriculumContextFromQuery;
    const nextPathwayContext = pathwayContextFromQuery;
    const derivedPathwayCurriculumContext = nextPathwayContext
      ? buildCurriculumCaptureContext({
          learningAreaKey: learningAreaFromQuery || "mathematics",
          learningAreaLabel: learningAreaLabelFromQuery || "Mathematics",
        })
      : null;
    const curriculumTitleSuggestion = buildCurriculumTitleSuggestion(nextCurriculumContext);
    const pathwayTitleSuggestion = buildPathwayTitleSuggestion(nextPathwayContext);

    const contextualLearnerId = nextPathwayContext
      ? learnerIdFromQuery || "missing-contextual-learner"
      : linkedCalendarItem?.learnerId || linkedSegment?.learnerId || linkedProgram?.learnerId || null;
    const learnerResolution = resolveLearnerContext({
      learners: workspace.learners,
      contextualLearnerId,
      explicitLearnerId: nextPathwayContext ? null : learnerIdFromQuery,
      activeLearnerId: workspace.setupStatus.activeLearnerId,
      rememberedLearnerId: workspace.setupStatus.activeLearnerId,
    });
    const nextLearnerId = learnerResolution.learner?.id || "";
    const nextLearner = learnerResolution.learner;
    const nextLearnerLabel = nextLearner
      ? getLearnerLabel(nextLearner.firstName, nextLearner.preferredName)
      : "The learner";
    const pathwayWhatHappenedSuggestion = buildPathwayWhatHappenedSuggestion(
      nextPathwayContext,
      nextLearnerLabel,
    );
    const progressQueryMatch = WORKSHEET_PROGRESS_OPTIONS.find(
      (option) => option.value === worksheetProgressFromQuery,
    );
    if (worksheetEvidenceMode && progressQueryMatch && !worksheetProgressLevel) {
      setWorksheetProgressLevel(progressQueryMatch.value);
    }
    const worksheetProgress = WORKSHEET_PROGRESS_OPTIONS.find(
      (option) => option.value === (worksheetProgressLevel || progressQueryMatch?.value),
    ) ?? null;
    const worksheetTitleSuggestion =
      worksheetEvidenceMode && nextPathwayContext
        ? `${safeQueryValue(nextPathwayContext.stepTitle) || "Completed worksheet"} - worksheet evidence`
        : "";
    const worksheetWhatHappenedSuggestion =
      worksheetEvidenceMode && nextPathwayContext
        ? [
            `Completed worksheet evidence for ${safeQueryValue(nextPathwayContext.pathwayLabel) || "this pathway"} / ${safeQueryValue(nextPathwayContext.stepTitle) || "this step"}.`,
            worksheetTitleFromQuery ? `Worksheet: ${worksheetTitleFromQuery}.` : "",
          ].filter(Boolean).join("\n")
        : "";

    setEditingEntryId(null);
    setLearnerId(nextLearnerId);
    setObservedOn(observedOnFromQuery || linkedCalendarItem?.plannedDate || getTodayDate());
    setTitle(
      worksheetTitleSuggestion ||
      pathwayTitleSuggestion ||
      curriculumTitleSuggestion ||
        linkedCalendarItem?.title ||
        linkedSegment?.title ||
        linkedProgram?.title ||
        curriculumElementLabelFromQuery ||
        humanizeQuerySlug(curriculumElementFromQuery) ||
        "",
    );
    setWhatHappened(worksheetWhatHappenedSuggestion || pathwayWhatHappenedSuggestion || "");
    setReflection(
      worksheetEvidenceMode
        ? [
            worksheetProgress ? `Progress level: ${worksheetProgress.value}` : "",
          ].filter(Boolean).join("\n")
        : "",
    );
    setLearningArea(
      derivedPathwayCurriculumContext?.learningAreaLabel ||
        nextCurriculumContext?.learningAreaLabel ||
        learningAreaLabelFromQuery ||
        learningAreaFromQuery ||
        linkedCalendarItem?.learningArea ||
        linkedProgram?.learningArea ||
        "",
    );
    setProgramId(programIdFromQuery || linkedCalendarItem?.programId || linkedProgram?.id || "");
    setCalendarItemId(calendarItemIdFromQuery || "");
    setFormCurriculumContext(derivedPathwayCurriculumContext || nextCurriculumContext);
    setFormPathwayContext(nextPathwayContext);
    setPathwayObservedSkillStatus(
      worksheetEvidenceMode
        ? worksheetProgress?.status || ""
        : safeQueryValue(nextPathwayContext?.observedSkillStatus),
    );
    setMessage(null);
    setActionError(null);
    setLastSavedCurriculumContext(null);
    setLastSavedPathwayContext(null);
    setLastSavedLearnerLabel("");
    setLastSavedReturnPath("");
    setLastSavedTitle("");
    setLastSavedDate("");
    setLastSavedLearningArea("");
    setLastSavedPortfolioIncluded(true);
    setLastSavedReportIncluded(true);
    setLastSavedWorksheetProgress("");
    setLastSavedPhotoAttached(false);
    setPendingAttachmentEvidenceId("");
    setPendingAttachmentError("");
    setPendingAttachmentFileName("");
    setSavePhase("");
    setLastAppliedContextKey(captureContextKey);
  }, [
    calendarItemIdFromQuery,
    calendarItems,
    captureContextKey,
    curriculumContextFromQuery,
    pathwayContextFromQuery,
    entries,
    entriesLoading,
    evidenceEntryIdFromQuery,
    curriculumElementFromQuery,
    curriculumElementLabelFromQuery,
    lastAppliedContextKey,
    learningAreaFromQuery,
    learningAreaLabelFromQuery,
    learnerIdFromQuery,
    linkingLoading,
    observedOnFromQuery,
    pathname,
    programIdFromQuery,
    programSegmentIdFromQuery,
    programSegments,
    programs,
    workspace.learners,
    workspace.profile,
    workspace.setupStatus.activeLearnerId,
    worksheetEvidenceMode,
    worksheetHrefFromQuery,
    worksheetProgressFromQuery,
    worksheetProgressLevel,
    worksheetTitleFromQuery,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);
    setPendingAttachmentError("");
    setPendingAttachmentEvidenceId("");
    setSavePhase("Saving evidence...");

    try {
      if (worksheetEvidenceMode && !worksheetProgressLevel) {
        throw new Error("Choose how it went before saving.");
      }

      if (learningFromLifeActive && !whatHappened.trim()) {
        throw new Error("Add what happened before saving this evidence.");
      }

      if (photoFile && !photoFile.type.startsWith("image/")) {
        throw new Error("Please choose an image file for this evidence.");
      }

      const maxImageSizeBytes = 10 * 1024 * 1024;
      if (photoFile && photoFile.size > maxImageSizeBytes) {
        throw new Error("Please choose an image smaller than 10 MB.");
      }

      const nextCurriculumContext = buildCurriculumCaptureContext(formCurriculumContext || {});
      const nextPathwayContext = buildPathwayCaptureContext({
        ...(formPathwayContext || {}),
        observedSkillStatus: safeQueryValue(pathwayObservedSkillStatus) || null,
      });
      const existingCurriculumNodeIds = editingEntry?.curriculumNodeIds ?? [];
      const curriculumNodeIds = encodeCurriculumContextNodeIds(
        existingCurriculumNodeIds,
        nextCurriculumContext,
      );
      const evidenceNodeIds = encodePathwayContextNodeIds(
        curriculumNodeIds,
        nextPathwayContext,
      );
      const sourceLearnerId = nextPathwayContext
        ? learnerIdFromQuery || null
        : selectedCalendarItem?.learnerId ||
          selectedProgramSegment?.learnerId ||
          selectedProgram?.learnerId ||
          null;
      const sourceType = sourceLearnerId
        ? worksheetEvidenceMode
          ? "worksheet"
          : nextPathwayContext
            ? "my-pathways"
            : calendarItemId
              ? "calendar"
              : "my-capture"
        : null;
      const learningFromLifeReflection = learningFromLifeActive
        ? buildLearningFromLifeReflection({
            evidenceType: lifeEvidenceType,
            tags: lifeTags,
            observation: lifeObservation,
            draftReportSentence: lifeDraftReportSentence,
          })
        : "";
      const captureResult = await saveUnifiedLearningCapture(
        {
          familyId: workspace.profile.id,
          learnerId,
          learnerContext: {
            familyId: workspace.profile.id,
            selectedLearnerId: learnerId,
            sourceLearnerId,
            sourceFamilyId: sourceLearnerId ? workspace.profile.id : null,
            sourceType,
            sourceId: calendarItemId || nextPathwayContext?.pathwayStepId || null,
          },
          availableLearners: workspace.learners,
          activityDate: observedOn,
          title: title || (learningFromLifeActive ? "Learning from life" : null),
          whatHappened,
          learningArea: learningArea || nextCurriculumContext?.learningAreaLabel || null,
          subjectKey: nextPathwayContext?.subjectKey ?? nextCurriculumContext?.learningAreaKey ?? null,
          strandKey: nextPathwayContext?.pathwayKey ?? null,
          stageKey: nextPathwayContext?.stageKey ?? null,
          pathwayStepId: nextPathwayContext?.pathwayStepId ?? null,
          stepKey: nextPathwayContext?.stepKey ?? null,
          stepTitle: nextPathwayContext?.stepTitle ?? null,
          progressJudgement: pathwayObservedSkillStatus || worksheetProgressLevel || null,
          parentNote: learningFromLifeActive ? learningFromLifeReflection : reflection || null,
          learnerReflection: learningFromLifeActive ? null : learnerReflection || null,
          sourceType: learningFromLifeActive
            ? "manual"
            : worksheetEvidenceMode
              ? "worksheet"
              : nextPathwayContext
                ? "my-pathways"
                : calendarItemId
                  ? "calendar"
                  : "my-capture",
          sourceId: worksheetEvidenceMode
            ? worksheetTitleFromQuery || nextPathwayContext?.pathwayStepId || null
            : calendarItemId || nextPathwayContext?.pathwayStepId || null,
          clientSubmissionId: [
            editingEntryId || "new",
            learnerId,
            observedOn,
            worksheetEvidenceMode ? worksheetTitleFromQuery : "",
            calendarItemId,
            nextPathwayContext?.pathwayStepId,
          ].filter(Boolean).join("::"),
          programId: programId || null,
          calendarItemId: calendarItemId || null,
          sourcePlanType: selectedCalendarItem?.sourcePlanType ?? null,
          sourcePlanId: selectedCalendarItem?.sourcePlanId ?? null,
          sourcePlanVersion: selectedCalendarItem?.sourcePlanVersion ?? null,
          sourcePlanSequenceIndex: selectedCalendarItem?.sourcePlanSequenceIndex ?? null,
          sourceIdeaId: selectedCalendarItem?.sourceIdeaId ?? null,
          sourceUrl: selectedCalendarItem?.sourceUrl ?? null,
          curriculumNodeIds: evidenceNodeIds,
          includeInPortfolio: lifeAddToPortfolio,
          includeInReport: lifeIncludeInReport,
        },
        { entryId: editingEntryId || null },
      );
      const savedEntry: CleanEvidenceEntry = captureResult.entry;

      if (editingEntryId) {
        trackProductEvent(
          "evidence_updated",
          {
            area: "my_capture",
            route: pathname,
            hasLearner: Boolean(learnerId),
            hasEvidence: true,
            subject: nextPathwayContext?.subjectKey ?? nextCurriculumContext?.learningAreaKey ?? null,
            strand: nextPathwayContext?.pathwayKey ?? null,
            source: learningFromLifeActive
              ? "learning_from_life"
              : nextPathwayContext
                ? "my_pathways"
                : nextCurriculumContext
                  ? "curriculum"
                  : "manual",
          },
          user?.id,
        );
      } else {
        trackProductEvent(
          "evidence_created",
          {
            area: "my_capture",
            route: pathname,
            hasLearner: Boolean(learnerId),
            hasEvidence: true,
            subject: nextPathwayContext?.subjectKey ?? nextCurriculumContext?.learningAreaKey ?? null,
            strand: nextPathwayContext?.pathwayKey ?? null,
            source: learningFromLifeActive
              ? "learning_from_life"
              : nextPathwayContext
                ? "my_pathways"
                : nextCurriculumContext
                  ? "curriculum"
                  : "manual",
          },
          user?.id,
        );
      }

      let uploadedAttachments: UploadedFamilyEvidenceFile[] = [];
      if (photoFile) {
        try {
          uploadedAttachments = await uploadWorksheetPhotoForEvidence(savedEntry.id, photoFile);
        } catch (uploadError) {
          const errorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : "The photo could not be uploaded. Check your connection and try again.";
          const uploadedAttachments =
            uploadError instanceof Error
              ? ((uploadError as WorksheetAttachmentUpdateError).uploadedAttachments ?? [])
              : [];
          setLastSavedCurriculumContext(null);
          setLastSavedPathwayContext(nextPathwayContext);
          setLastSavedReturnPath(worksheetEvidenceMode ? worksheetReturnPath : "");
          setLastSavedEvidenceId(savedEntry.id);
          setLastSavedWorksheetProgress(worksheetEvidenceMode ? worksheetProgressLevel : "");
          setLastSavedPhotoAttached(false);
          setPendingAttachmentEvidenceId(savedEntry.id);
          setPendingAttachmentError(errorMessage);
          setPendingAttachmentFileName(photoFile.name);
          setPendingUploadedAttachments(uploadedAttachments);
          setMessage(null);
          setActionError(null);
          await reloadEntries();
          return;
        }
      }

      setLastSavedCurriculumContext(nextPathwayContext ? null : nextCurriculumContext);
      setLastSavedPathwayContext(nextPathwayContext);
      setLastSavedReturnPath(worksheetEvidenceMode ? worksheetReturnPath : "");
      setLastSavedEvidenceId(savedEntry.id);
      setLastSavedLearnerLabel(
        learnerOptions.find((option) => option.value === savedEntry.learnerId)?.label || "",
      );
      setLastSavedTitle(savedEntry.title || "Learning record");
      setLastSavedDate(savedEntry.observedOn);
      setLastSavedLearningArea(savedEntry.learningArea || "");
      setLastSavedPortfolioIncluded(savedEntry.includeInPortfolio);
      setLastSavedReportIncluded(savedEntry.includeInReport);
      setLastSavedWorksheetProgress(worksheetEvidenceMode ? worksheetProgressLevel : "");
      setLastSavedPhotoAttached(Boolean(uploadedAttachments.length));
      setLastSavedPhotoPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return photoFile && uploadedAttachments.length ? URL.createObjectURL(photoFile) : "";
      });
      setMessage("Learning recorded.");
      const nextLearnerId = learnerId;
      resetForm(nextLearnerId);
      setSavedAttachments(uploadedAttachments);
      if (captureContextKey) {
        clearCaptureContext();
      }
      await reloadEntries();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this capture note.",
        ),
      );
    } finally {
      setSavePhase("");
      setSubmitting(false);
    }
  }

  async function retryPendingPhotoUpload() {
    if (!pendingAttachmentEvidenceId || !photoFile) return;

    setSubmitting(true);
    setActionError(null);
    setPendingAttachmentError("");
    try {
      const uploadedAttachments = await uploadWorksheetPhotoForEvidence(
        pendingAttachmentEvidenceId,
        photoFile,
      );
      setSavedAttachments(uploadedAttachments);
      setLastSavedPhotoAttached(Boolean(uploadedAttachments.length));
      setLastSavedPhotoPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return photoFile && uploadedAttachments.length ? URL.createObjectURL(photoFile) : "";
      });
      setPendingAttachmentEvidenceId("");
      setPendingAttachmentError("");
      setPendingAttachmentFileName("");
      setPendingUploadedAttachments([]);
      setMessage("Learning recorded.");
      setPhotoFile(null);
      setPhotoName("");
      setPhotoPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return "";
      });
      await reloadEntries();
    } catch (error) {
      setPendingAttachmentError(
        error instanceof Error
          ? error.message
          : "The photo could not be uploaded. Check your connection and try again.",
      );
    } finally {
      setSavePhase("");
      setSubmitting(false);
    }
  }

  async function retryPendingAttachmentLink() {
    if (!pendingAttachmentEvidenceId || !pendingUploadedAttachments.length) return;

    setSubmitting(true);
    setActionError(null);
    setPendingAttachmentError("");
    try {
      await finaliseWorksheetPhotoAttachment(
        pendingAttachmentEvidenceId,
        pendingUploadedAttachments,
      );
      const uploadedAttachments = pendingUploadedAttachments;
      setSavedAttachments(uploadedAttachments);
      setLastSavedPhotoAttached(Boolean(uploadedAttachments.length));
      setLastSavedPhotoPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return photoFile && uploadedAttachments.length ? URL.createObjectURL(photoFile) : "";
      });
      setPendingAttachmentEvidenceId("");
      setPendingAttachmentError("");
      setPendingAttachmentFileName("");
      setPendingUploadedAttachments([]);
      setMessage("Learning recorded.");
      setPhotoFile(null);
      setPhotoName("");
      setPhotoPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return "";
      });
      await reloadEntries();
    } catch (error) {
      setPendingAttachmentError(
        error instanceof Error
          ? error.message
          : "The photo could not be uploaded. Check your connection and try again.",
      );
    } finally {
      setSavePhase("");
      setSubmitting(false);
    }
  }

  async function handleDelete(entry: CleanEvidenceEntry) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanEvidenceEntry(workspace.profile.id, entry.id);
      if (editingEntryId === entry.id) {
        resetForm();
      }
      setMessage("Capture note deleted.");
      await reloadEntries();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not delete this capture note.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(entry: CleanEvidenceEntry) {
    const entryCurriculumContext = parseCurriculumContextFromNodeIds(
      entry.curriculumNodeIds,
    );
    const entryPathwayContext = parsePathwayContextFromNodeIds(entry.curriculumNodeIds);
    setEditingEntryId(entry.id);
    setLearnerId(entry.learnerId);
    setObservedOn(entry.observedOn);
    setTitle(entry.title || "");
    setWhatHappened(entry.whatHappened);
    setReflection(entry.reflection || "");
    setLearnerReflection("");
    setLearningArea(entry.learningArea || "");
    setProgramId(entry.programId || "");
    setCalendarItemId(entry.calendarItemId || "");
    setFormCurriculumContext(entryCurriculumContext);
    setFormPathwayContext(entryPathwayContext);
    setPathwayObservedSkillStatus(safeQueryValue(entryPathwayContext?.observedSkillStatus));
    setMessage(null);
    setActionError(null);
    setLastSavedCurriculumContext(null);
    setLastSavedPathwayContext(null);
  }

  const readyForCapture =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;
  const curriculumContextRows = useMemo(
    () => (formCurriculumContext ? getCurriculumContextRows(formCurriculumContext) : []),
    [formCurriculumContext],
  );
  const pathwayContextRows = useMemo(
    () => (formPathwayContext ? getPathwayContextRows(formPathwayContext) : []),
    [formPathwayContext],
  );
  const pathwayStepLabel = useMemo(
    () => buildPathwayStepLabel(formPathwayContext),
    [formPathwayContext],
  );
  const pathwayCaptureActive =
    formPathwayContext?.source === MY_PATHWAYS_SOURCE;
  const pathwayObservedStatusFieldVisible =
    pathwayCaptureActive &&
    !worksheetEvidenceMode &&
    Boolean(pathwayContextFromQuery || safeQueryValue(formPathwayContext?.observedSkillStatus));
  const curriculumCaptureActive =
    !pathwayCaptureActive && formCurriculumContext?.source === MY_CURRICULUM_SOURCE;
  const curriculumWhatHappenedPlaceholder = pathwayCaptureActive
    ? "What happened while working on this pathway step?"
    : curriculumCaptureActive
    ? "What did the learner do, and what does this learning show?"
    : "What happened";
  const reflectionPlaceholder = pathwayCaptureActive
    ? "What did you notice? How independently did the learner complete the task? What might come next?"
    : curriculumCaptureActive
    ? "What stood out, what support helped, or what could come next? (optional)"
    : "Parent note (optional)";
  const recentNotesPanelId = "clean-capture-recent-notes";
  const selectedLearnerLabel =
    learnerOptions.find((option) => option.value === learnerId)?.label || "";
  const sourceLearnerId = formPathwayContext
    ? learnerIdFromQuery || null
    : selectedCalendarItem?.learnerId ||
      selectedProgramSegment?.learnerId ||
      selectedProgram?.learnerId ||
      null;
  const learnerContextMismatch = Boolean(
    sourceLearnerId && learnerId && sourceLearnerId !== learnerId,
  );

  function handleLearnerChange(nextLearnerId: string) {
    if (sourceLearnerId && nextLearnerId !== sourceLearnerId) {
      setLearnerChangePendingId(nextLearnerId);
      return;
    }
    setLearnerId(nextLearnerId);
  }

  function removeLearnerContextForChange() {
    setFormPathwayContext(null);
    setFormCurriculumContext(null);
    setPathwayObservedSkillStatus("");
    setWorksheetProgressLevel("");
    setLearnerId(learnerChangePendingId);
    setLearnerChangePendingId("");
  }
  const worksheetCaptureStepTitle =
    safeQueryValue(formPathwayContext?.stepTitle) ||
    worksheetTitleFromQuery ||
    "Completed worksheet";
  const worksheetCaptureLearnerLabel = selectedLearnerLabel || "Selected learner";

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon />
        <style jsx global>{`
          @media (max-width: 720px) {
            .mylearna-capture-success-panel {
              padding: 14px !important;
              gap: 10px !important;
            }

            .mylearna-capture-success-actions {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }

            .mylearna-capture-success-actions > * {
              width: 100% !important;
              min-height: 46px !important;
            }

            .mylearna-capture-form-intro {
              display: none !important;
            }

            .mylearna-capture-intro {
              display: none !important;
            }

            .mylearna-capture-card {
              padding: 14px !important;
            }

            .mylearna-capture-card-header {
              align-items: flex-start !important;
            }

            .mylearna-capture-card-header h2 {
              font-size: 22px !important;
            }

            .mylearna-capture-refresh,
            .mylearna-capture-context-detail,
            .mylearna-capture-learner-date,
            .mylearna-capture-photo-help,
            .mylearna-capture-photo-action span:last-child {
              display: none !important;
            }

            .mylearna-capture-mobile-context {
              display: grid !important;
            }

            .mylearna-capture-pathway-context {
              padding: 12px !important;
              margin-top: 12px !important;
              gap: 6px !important;
            }

            .mylearna-capture-photo-section,
            .mylearna-capture-progress-section,
            .mylearna-capture-note-section {
              border-radius: 14px !important;
              padding: 12px !important;
            }

            .mylearna-capture-photo-actions {
              grid-template-columns: 1fr !important;
            }

            .mylearna-capture-photo-action {
              min-height: 54px !important;
              padding: 13px 14px !important;
            }

            .mylearna-capture-photo-action:first-child span:first-child {
              font-size: 0 !important;
            }

            .mylearna-capture-photo-action:first-child span:first-child::after {
              content: "Take or upload photo";
              font-size: 15px !important;
            }

            .mylearna-capture-progress-grid {
              grid-template-columns: 1fr !important;
            }

            .mylearna-capture-progress-grid button {
              min-height: 48px !important;
              text-align: center !important;
            }

            .mylearna-capture-note-section textarea {
              min-height: 74px !important;
            }

            .mylearna-capture-save-row {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }

            .mylearna-capture-save-row button {
              width: 100% !important;
              min-height: 48px !important;
              justify-content: center !important;
            }

            .mylearna-capture-later-additions {
              display: none !important;
            }
          }
        `}</style>
        <CleanFirstRunSetupGate currentStep="capture" />
        {!workspace.loading && !workspace.setupLoading && !workspace.setupStatus.hasEvidence ? (
          <GuidanceSetupProgress
            stepId="capture"
            title="Capture first learning evidence."
            body="Add a note, work sample or observation when meaningful learning happens."
          />
        ) : null}

        <CleanPageIntroVideo
          config={PAGE_INTRO_VIDEOS.myCapture}
          promptTitle="New to My Capture?"
          promptDescription="See how to save a quick learning moment."
        />

        <section className="mylearna-capture-intro" style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#64748b",
              }}
            >
              Learning moments
            </div>
            <h1 style={{ margin: 0, fontSize: 26, color: "#17204B", fontWeight: 650 }}>My Capture</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Save a quick learning moment. Add it to the portfolio later.
            </p>
            <div>
              <GuidancePageAction tourId="my-capture" />
            </div>
          </div>
        </section>

        {workspace.loading ? (
          <V2LoadingState
            title="Preparing capture"
            body="We are loading your learners, plans, and recent evidence."
          />
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              Learning evidence is temporarily unavailable. Try again shortly.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.error ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>Workspace error</strong>
            <p style={{ margin: 0, color: "#475569" }}>{workspace.error}</p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Create family profile first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Create your family profile first, then save learning moments here.
            </p>
          </section>
        ) : null}

        {readyForCapture && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Add a learner before saving a learning moment.
            </p>
          </section>
        ) : null}

        {readyForCapture && workspace.profile && workspace.learners.length ? (
          <>
            {learnerChangePendingId ? (
              <section
                role="alertdialog"
                aria-labelledby="capture-learner-change-title"
                style={{ ...cardStyle, borderColor: "#f59e0b", background: "#fffbeb" }}
              >
                <strong id="capture-learner-change-title" style={{ color: "#92400e" }}>
                  This completed work is connected to {selectedLearnerLabel || "the selected learner"}&apos;s pathway.
                </strong>
                <p style={{ margin: 0, color: "#78350f", lineHeight: 1.5 }}>
                  To record it for another learner, remove the pathway connection first.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLearnerId(sourceLearnerId || learnerId);
                      setLearnerChangePendingId("");
                    }}
                    style={buttonStyle}
                  >
                    Keep {selectedLearnerLabel || "this learner"}
                  </button>
                  <button
                    type="button"
                    onClick={removeLearnerContextForChange}
                    style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                  >
                    Remove pathway connection
                  </button>
                  <button
                    type="button"
                    onClick={() => setLearnerChangePendingId("")}
                    style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                  >
                    Cancel
                  </button>
                </div>
              </section>
            ) : null}
            <section
              className={worksheetEvidenceMode ? "mylearna-capture-card" : undefined}
              data-guidance-id="capture-add-evidence"
              data-capture-mode={
                worksheetEvidenceMode
                  ? "worksheet-evidence"
                  : learningFromLifeActive
                    ? "learning-from-life"
                    : "general"
              }
              style={cardStyle}
            >
            <div
              className="mylearna-capture-card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 data-guidance-id="capture-evidence-type" style={{ margin: 0, color: "#0f172a", fontSize: 20, fontWeight: 650 }}>
                    {worksheetEvidenceMode ? "Record completed work" : "Record learning"}
                  </h2>
                  <p className="mylearna-capture-form-intro" style={{ margin: "8px 0 0", color: "#475569" }}>
                    Record lessons, projects, outings and everyday learning in one place.
                  </p>
                  {worksheetEvidenceMode ? (
                    <div
                      className="mylearna-capture-mobile-context"
                      style={{
                        display: "none",
                        gap: 4,
                        marginTop: 8,
                        color: "#475569",
                        fontSize: 14,
                        lineHeight: 1.45,
                      }}
                    >
                      <strong style={{ color: "#0f172a" }}>
                        {worksheetCaptureLearnerLabel}
                      </strong>
                      <span>{worksheetCaptureStepTitle}</span>
                      <span style={{ color: "#64748b", fontSize: 12 }}>My Pathways</span>
                    </div>
                  ) : null}
                </div>
                <button
                  className="mylearna-capture-refresh"
                  type="button"
                  style={buttonStyle}
                  onClick={() => {
                    void reloadEntries();
                    void reloadLinkOptions();
                  }}
                  disabled={entriesLoading || linkingLoading || submitting}
                >
                  {entriesLoading || linkingLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {false && !worksheetEvidenceMode ? (
                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => switchCapturePath("life")}
                    style={{
                      border: `1px solid ${learningFromLifeActive ? "#6C4DF6" : "#E2E8F0"}`,
                      borderRadius: 16,
                      background: learningFromLifeActive ? "#F2EDFF" : "#FFFFFF",
                      color: "#17204B",
                      padding: 14,
                      minHeight: 74,
                      display: "grid",
                      gap: 4,
                      textAlign: "left",
                      cursor: "pointer",
                      boxShadow: "0 6px 18px rgba(23,32,75,0.035)",
                    }}
                  >
                    <strong style={{ fontSize: 16 }}>Guided record</strong>
                    <span style={{ color: "#5B6478", fontSize: 13 }}>
                      Real-world learning, parent reviewed.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchCapturePath("standard")}
                    style={{
                      border: `1px solid ${!learningFromLifeActive ? "#6C4DF6" : "#E2E8F0"}`,
                      borderRadius: 16,
                      background: !learningFromLifeActive ? "#F2EDFF" : "#FFFFFF",
                      color: "#17204B",
                      padding: 14,
                      minHeight: 74,
                      display: "grid",
                      gap: 4,
                      textAlign: "left",
                      cursor: "pointer",
                      boxShadow: "0 6px 18px rgba(23,32,75,0.035)",
                    }}
                  >
                    <strong style={{ fontSize: 16 }}>Standard record</strong>
                    <span style={{ color: "#5B6478", fontSize: 13 }}>
                      Existing note workflow.
                    </span>
                  </button>
                </div>
              ) : null}

              {pathwayCaptureActive && formPathwayContext ? (
                <div
                  className="mylearna-capture-pathway-context"
                  style={{
                    marginTop: 16,
                    border: "1px solid #bfdbfe",
                    borderRadius: 14,
                    padding: 14,
                    background: "#f8fbff",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Connected to</strong>
                  <div className="mylearna-capture-context-detail" style={{ color: "#475569", lineHeight: 1.6 }}>
                    This learning record is linked to:
                  </div>
                  <div style={{ color: "#0f172a", lineHeight: 1.6, fontWeight: 700 }}>
                    {pathwayStepLabel}
                  </div>
                  <div className="mylearna-capture-context-detail" style={{ display: "grid", gap: 4 }}>
                    {pathwayContextRows.map((row) => (
                      <div key={row.label} style={{ color: "#334155", lineHeight: 1.6 }}>
                        <strong style={{ color: "#0f172a" }}>{row.label}:</strong> {row.value}
                      </div>
                    ))}
                  </div>
                  <div className="mylearna-capture-context-detail" style={{ color: "#64748b", lineHeight: 1.6 }}>
                    This connection supports My Pathways, My Learna, Portfolio and Reports.
                  </div>
                  {worksheetEvidenceMode ? (
                    <div className="mylearna-capture-context-detail"
                      style={{
                        border: "1px solid #D9D0FF",
                        borderRadius: 14,
                        background: "#FFFFFF",
                        padding: 12,
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <strong style={{ color: "#17204B" }}>Worksheet</strong>
                      {worksheetTitleFromQuery ? (
                        <span style={{ color: "#475569", lineHeight: 1.5 }}>
                          {worksheetTitleFromQuery}
                        </span>
                      ) : null}
                      {worksheetHrefFromQuery ? (
                        <Link
                          href={worksheetHrefFromQuery}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#6C4DF6", fontWeight: 800 }}
                        >
                          Open worksheet
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {curriculumCaptureActive && curriculumContextRows.length ? (
                <div
                  style={{
                    marginTop: 16,
                    border: "1px solid #bfdbfe",
                    borderRadius: 14,
                    padding: 14,
                    background: "#f8fbff",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Connected to</strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    This learning record is linked to:
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {curriculumContextRows.map((row) => (
                      <div key={row.label} style={{ color: "#334155", lineHeight: 1.6 }}>
                        <strong style={{ color: "#0f172a" }}>{row.label}:</strong> {row.value}
                      </div>
                    ))}
                  </div>
                  <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                    This connection helps build My Learna and Reports.
                  </div>
                </div>
              ) : null}

              {selectedCalendarItem || selectedProgram || selectedProgramSegment ? (
                <div
                  style={{
                    marginTop: 16,
                    border: "1px solid #bfdbfe",
                    borderRadius: 14,
                    padding: 14,
                    background: "#eff6ff",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>
                    {selectedCalendarItem
                      ? `Capturing from: ${selectedCalendarItem.title}`
                      : "Capture context ready"}
                  </strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {selectedCalendarItem
                      ? formatDateLabel(selectedCalendarItem.plannedDate)
                      : formatDateLabel(observedOn)}
                    {selectedProgram ? ` - Program: ${selectedProgram.title}` : ""}
                    {selectedProgramSegment
                      ? ` - Week / segment: ${selectedProgramSegment.title}`
                      : ""}
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <div
                  className={worksheetEvidenceMode ? "mylearna-capture-learner-date" : undefined}
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <label data-guidance-id="capture-learner-select" style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>Learner</span>
                    <select
                      value={learnerId}
                      onChange={(event) => handleLearnerChange(event.target.value)}
                      aria-label="Learner"
                      aria-invalid={learnerContextMismatch || !learnerId ? true : undefined}
                      style={inputStyle}
                    >
                      <option value="">Select learner</option>
                      {learnerOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>Date of learning</span>
                    <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                      Choose the day this learning happened.
                    </span>
                    <input
                      type="date"
                      value={observedOn}
                      onChange={(event) => setObservedOn(event.target.value)}
                      style={inputStyle}
                    />
                  </label>
                </div>

                {learningFromLifeActive ? (
                  <div style={{ display: "grid", gap: 14 }}>
                    <div
                      style={{
                        border: "1px solid #D9D0FF",
                        borderRadius: 16,
                        background: "#FBFAFF",
                        padding: 14,
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <strong style={{ color: "#17204B", fontSize: 16 }}>
                        Speak or type what happened
                      </strong>
                      <textarea
                        value={whatHappened}
                        onChange={(event) => {
                          setWhatHappened(event.target.value);
                          setLifeSuggestionsReady(false);
                        }}
                        placeholder="Example: We baked muffins and measured the ingredients..."
                        style={{ ...textAreaStyle, minHeight: 110 }}
                      />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={speechListening ? stopSpeechInput : startSpeechInput}
                          disabled={submitting}
                          style={{
                            ...buttonStyle,
                            background: speechListening ? "#6C4DF6" : "#FFFFFF",
                            borderColor: "#D9D0FF",
                            color: speechListening ? "#FFFFFF" : "#17204B",
                            minHeight: 44,
                          }}
                        >
                          {speechListening ? "Stop listening" : "Speak description"}
                        </button>
                        <span style={{ color: "#64748B", fontSize: 13 }}>
                          {speechSupported || speechMessage !== "Speech input is optional."
                            ? speechMessage
                            : "Typing works on every device."}
                        </span>
                      </div>
                    </div>

                    <div
                      className="mylearna-capture-photo-section"
                      style={{
                        border: "1px dashed #CBD5E1",
                        borderRadius: 16,
                        background: "#F8FAFC",
                        padding: 14,
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <strong style={{ color: "#17204B" }}>Optional photo</strong>
                      <div
                        style={{
                          display: "grid",
                          gap: 10,
                          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                        }}
                      >
                        <label
                          style={{
                            border: "1px solid #D9D0FF",
                            borderRadius: 16,
                            background: "#FFFFFF",
                            padding: 14,
                            minHeight: 82,
                            display: "grid",
                            gap: 6,
                            cursor: submitting ? "default" : "pointer",
                          }}
                        >
                          <span style={{ color: "#17204B", fontWeight: 800 }}>
                            Take or upload photo
                          </span>
                          <span style={{ color: "#5B6478", fontSize: 13 }}>
                            Add a real-world learning image.
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={submitting}
                            onChange={handlePhotoChange}
                            style={{
                              position: "absolute",
                              width: 1,
                              height: 1,
                              opacity: 0,
                            }}
                          />
                        </label>
                        <div
                          style={{
                            border: photoFile ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                            borderRadius: 16,
                            background: photoFile ? "#F0FDF4" : "#FFFFFF",
                            padding: 12,
                            display: "grid",
                            gap: 8,
                          }}
                        >
                          <strong style={{ color: photoFile ? "#15803D" : "#475569", fontSize: 14 }}>
                            {photoFile ? "Photo attached" : "No photo yet"}
                          </strong>
                          <span style={{ color: "#64748B", fontSize: 13 }}>{photoSelectionMessage}</span>
                          {photoPreviewUrl ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photoPreviewUrl}
                                alt="Selected learning from life evidence preview"
                                style={{
                                  width: "100%",
                                  maxHeight: 180,
                                  objectFit: "cover",
                                  borderRadius: 14,
                                  border: "1px solid #BBF7D0",
                                }}
                              />
                              <button
                                type="button"
                                onClick={removePhoto}
                                disabled={submitting}
                                style={{ ...buttonStyle, background: "#FFFFFF", color: "#0F172A" }}
                              >
                                Remove photo
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        border: "1px solid #E2E8F0",
                        borderRadius: 16,
                        background: "#FFFFFF",
                        padding: 14,
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ display: "grid", gap: 4 }}>
                          <strong style={{ color: "#17204B", fontSize: 16 }}>
                            Review MyLearna&apos;s suggestions
                          </strong>
                          <span style={{ color: "#64748B", fontSize: 13 }}>
                            Edit anything before saving.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={applyLearningFromLifeSuggestions}
                          disabled={submitting}
                          style={{
                            ...buttonStyle,
                            minHeight: 44,
                            opacity: whatHappened.trim() ? 1 : 0.65,
                          }}
                        >
                          Suggest evidence details
                        </button>
                      </div>

                      {lifeSuggestionsReady ? (
                        <div style={{ display: "grid", gap: 10 }}>
                          <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Evidence title"
                            style={inputStyle}
                          />
                          <div
                            style={{
                              display: "grid",
                              gap: 10,
                              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            }}
                          >
                            <input
                              value={lifeEvidenceType}
                              onChange={(event) => setLifeEvidenceType(event.target.value)}
                              placeholder="Evidence type"
                              style={inputStyle}
                            />
                            <input
                              value={learningArea}
                              onChange={(event) => setLearningArea(event.target.value)}
                              placeholder="Learning area"
                              style={inputStyle}
                            />
                          </div>
                          <input
                            value={lifeTags}
                            onChange={(event) => setLifeTags(event.target.value)}
                            placeholder="Tags"
                            style={inputStyle}
                          />
                          <textarea
                            value={lifeObservation}
                            onChange={(event) => setLifeObservation(event.target.value)}
                            placeholder="Short parent observation"
                            style={{ ...textAreaStyle, minHeight: 86 }}
                          />
                          <textarea
                            value={lifeDraftReportSentence}
                            onChange={(event) => setLifeDraftReportSentence(event.target.value)}
                            placeholder="Optional draft report sentence"
                            style={{ ...textAreaStyle, minHeight: 86 }}
                          />
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <label style={{ display: "inline-flex", gap: 8, alignItems: "center", minHeight: 44 }}>
                              <input
                                type="checkbox"
                                checked={lifeAddToPortfolio}
                                onChange={(event) => setLifeAddToPortfolio(event.target.checked)}
                              />
                              Add to Portfolio
                            </label>
                            <label style={{ display: "inline-flex", gap: 8, alignItems: "center", minHeight: 44 }}>
                              <input
                                type="checkbox"
                                checked={lifeIncludeInReport}
                                onChange={(event) => setLifeIncludeInReport(event.target.checked)}
                              />
                              Report ready
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            border: "1px dashed #CBD5E1",
                            borderRadius: 14,
                            background: "#F8FAFC",
                            padding: 12,
                            color: "#64748B",
                            fontSize: 13,
                          }}
                        >
                          MyLearna can suggest details for your review. Nothing is saved until you approve.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {worksheetEvidenceMode ? (
                  <>
                    <div
                      className="mylearna-capture-photo-section"
                      style={{
                        border: "1px dashed #CBD5E1",
                        borderRadius: 16,
                        background: "#F8FAFC",
                        padding: 14,
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div
                        className="mylearna-capture-photo-actions"
                        style={{
                          display: "grid",
                          gap: 10,
                          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                        }}
                      >
                        <label
                          className="mylearna-capture-photo-action"
                          data-capture-photo-action="take-photo"
                          style={{
                            border: "1px solid #D9D0FF",
                            borderRadius: 16,
                            background: "#FFFFFF",
                            padding: 14,
                            minHeight: 104,
                            display: "grid",
                            gap: 7,
                            cursor: submitting ? "default" : "pointer",
                            boxShadow: "0 6px 18px rgba(23,32,75,0.035)",
                          }}
                        >
                          <span style={{ color: "#17204B", fontWeight: 850 }}>
                            Take photo
                          </span>
                          <span style={{ color: "#5B6478", fontSize: 13, lineHeight: 1.4 }}>
                            Use your camera to photograph the completed worksheet.
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={submitting}
                            onClick={() => {
                              setPhotoSelectionMessage("Camera opening. Take a photo or cancel to return here.");
                            }}
                            onBlur={() => {
                              if (!photoFile) {
                                setPhotoSelectionMessage(
                                  "No photo was selected. You can try again or save progress without a photo.",
                                );
                              }
                            }}
                            onChange={handlePhotoChange}
                            data-capture-photo-input-camera="active"
                            style={{
                              position: "absolute",
                              width: 1,
                              height: 1,
                              opacity: 0,
                            }}
                          />
                        </label>

                        <label
                          className="mylearna-capture-photo-action"
                          data-capture-photo-action="choose-library"
                          style={{
                            border: "1px solid #D9D0FF",
                            borderRadius: 16,
                            background: "#FFFFFF",
                            padding: 14,
                            minHeight: 104,
                            display: "grid",
                            gap: 7,
                            cursor: submitting ? "default" : "pointer",
                            boxShadow: "0 6px 18px rgba(23,32,75,0.035)",
                          }}
                        >
                          <span style={{ color: "#17204B", fontWeight: 850 }}>
                            Choose from photo library
                          </span>
                          <span style={{ color: "#5B6478", fontSize: 13, lineHeight: 1.4 }}>
                            Select an image you already took.
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={submitting}
                            onClick={() => {
                              setPhotoSelectionMessage("Photo library opening. Choose a photo or cancel to return here.");
                            }}
                            onBlur={() => {
                              if (!photoFile) {
                                setPhotoSelectionMessage(
                                  "No photo was selected. You can try again or save progress without a photo.",
                                );
                              }
                            }}
                            onChange={handlePhotoChange}
                            data-capture-photo-input-library="active"
                            style={{
                              position: "absolute",
                              width: 1,
                              height: 1,
                              opacity: 0,
                            }}
                          />
                        </label>
                      </div>
                      <p style={{ margin: 0, color: "#64748B", fontSize: 12, lineHeight: 1.45 }}>
                        Add a photo of the completed work.
                      </p>
                      <details className="mylearna-capture-photo-help" style={{ color: "#64748B", fontSize: 12 }}>
                        <summary style={{ cursor: "pointer", fontWeight: 800 }}>
                          Camera not working?
                        </summary>
                        <ul style={{ margin: "8px 0 0", paddingLeft: 18, display: "grid", gap: 4 }}>
                          <li>Make sure camera access is allowed for Safari or Chrome.</li>
                          <li>On iPhone, go to Settings, Privacy & Security, Camera and allow your browser.</li>
                          <li>You can also take a photo first, then choose it from your photo library.</li>
                        </ul>
                      </details>
                      <div
                        style={{
                          border: photoFile ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                          borderRadius: 14,
                          background: photoFile ? "#F0FDF4" : "#FFFFFF",
                          padding: 12,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <strong style={{ color: photoFile ? "#15803D" : "#475569", fontSize: 14 }}>
                          {photoFile ? "Photo attached" : "No photo attached yet"}
                        </strong>
                        <span style={{ color: "#64748B", fontSize: 13, lineHeight: 1.45 }}>
                          {photoSelectionMessage}
                        </span>
                        {photoPreviewUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photoPreviewUrl}
                              alt="Selected worksheet evidence preview"
                              data-capture-photo-preview="attached"
                              style={{
                                width: "100%",
                                maxHeight: 220,
                                objectFit: "cover",
                                borderRadius: 14,
                                border: "1px solid #BBF7D0",
                              }}
                            />
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{ color: "#475569", fontSize: 12, fontWeight: 700 }}>
                                {photoName}
                                {formatFileSize(photoFile?.size) ? ` / ${formatFileSize(photoFile?.size)}` : ""}
                              </span>
                              <label style={{ ...buttonStyle, background: "#FFFFFF", color: "#0F172A" }}>
                                Replace photo
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={submitting}
                                  onClick={() => {
                                    setPhotoSelectionMessage("Choose a replacement photo from your library.");
                                  }}
                                  onChange={handlePhotoChange}
                                  style={{
                                    position: "absolute",
                                    width: 1,
                                    height: 1,
                                    opacity: 0,
                                  }}
                                />
                              </label>
                              <button type="button" onClick={removePhoto} disabled={submitting} style={{ ...buttonStyle, background: "#FFFFFF", color: "#0F172A" }}>
                                Remove photo
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="mylearna-capture-progress-section" style={{ display: "grid", gap: 8 }} data-capture-progress-options="active">
                      <span style={{ color: "#17204B", fontWeight: 800 }}>
                        Progress judgement
                      </span>
                      <div
                        className="mylearna-capture-progress-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: 8,
                        }}
                      >
                        {WORKSHEET_PROGRESS_OPTIONS.map((option) => {
                          const selected = worksheetProgressLevel === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateWorksheetProgress(option.value)}
                              disabled={submitting}
                              style={{
                                border: `1px solid ${selected ? "#6C4DF6" : "#E7EAF2"}`,
                                borderRadius: 14,
                                background: selected ? "#F2EDFF" : "#FFFFFF",
                                color: selected ? "#5B21B6" : "#17204B",
                                padding: "11px 12px",
                                minHeight: 48,
                                fontWeight: 800,
                                cursor: submitting ? "default" : "pointer",
                                textAlign: "left",
                              }}
                            >
                              {option.value}
                            </button>
                          );
                        })}
                      </div>
                      {!worksheetProgressLevel ? (
                        <span style={{ color: "#B45309", fontSize: 13, fontWeight: 750 }}>
                          Choose how it went before saving.
                        </span>
                      ) : null}
                    </div>

                    <label className="mylearna-capture-note-section" style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>
                        Parent note
                      </span>
                      <textarea
                        value={getWorksheetParentNote(reflection)}
                        onChange={(event) => {
                          const progressLine = worksheetProgressLevel
                            ? `Progress level: ${worksheetProgressLevel}`
                            : "";
                          setReflection(
                            [
                              progressLine,
                              event.target.value,
                            ].filter(Boolean).join("\n"),
                          );
                        }}
                        placeholder="Optional: add context, support given, or what happened next."
                        style={textAreaStyle}
                      />
                    </label>
                    <label className="mylearna-capture-note-section" style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>
                        Learner reflection
                      </span>
                      <textarea
                        value={learnerReflection}
                        onChange={(event) => setLearnerReflection(event.target.value)}
                        placeholder="Optional: what felt easy, challenging, or worth trying next."
                        style={textAreaStyle}
                      />
                    </label>
                  </>
                ) : null}

                {!worksheetEvidenceMode && !learningFromLifeActive ? (
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={
                    curriculumCaptureActive
                      ? buildCurriculumTitleSuggestion(formCurriculumContext) || "Title (optional)"
                      : "Title (optional)"
                  }
                  style={inputStyle}
                />
                ) : null}

                {!worksheetEvidenceMode && !learningFromLifeActive ? (
                <div data-guidance-id="capture-note-field">
                  <textarea
                    value={whatHappened}
                    onChange={(event) => setWhatHappened(event.target.value)}
                    placeholder={curriculumWhatHappenedPlaceholder}
                    style={textAreaStyle}
                  />
                </div>
                ) : null}
                {curriculumCaptureActive ? (
                  <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                    What does this learning show?
                  </div>
                ) : null}

                {!worksheetEvidenceMode && !learningFromLifeActive ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>Parent note</span>
                      <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                        Add context, support given, or what happened next.
                      </span>
                      <textarea
                        value={reflection}
                        onChange={(event) => setReflection(event.target.value)}
                        placeholder={reflectionPlaceholder}
                        style={textAreaStyle}
                      />
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>Learner reflection</span>
                      <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                        Optional: what felt easy, challenging, or worth trying next.
                      </span>
                      <textarea
                        value={learnerReflection}
                        onChange={(event) => setLearnerReflection(event.target.value)}
                        placeholder="Optional learner reflection."
                        style={textAreaStyle}
                      />
                    </label>
                  </div>
                ) : null}

                {pathwayObservedStatusFieldVisible ? (
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      How did this skill look?
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                      This is your observation from this evidence. Formal assessment checks can
                      come later.
                    </span>
                    <select
                      value={pathwayObservedSkillStatus}
                      onChange={(event) => setPathwayObservedSkillStatus(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Not selected</option>
                      {PATHWAY_OBSERVED_SKILL_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {!worksheetEvidenceMode && !learningFromLifeActive ? (
                  <label data-guidance-id="capture-learning-area" style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>Learning area</span>
                    <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                      Choose a consistent learning area so records stay easy to find.
                    </span>
                    <select
                      value={learningArea}
                      onChange={(event) => setLearningArea(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Choose learning area</option>
                      {CANONICAL_LEARNING_AREAS.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <div
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    background: "#FFFFFF",
                    padding: 12,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Use this record</strong>
                  <label style={{ display: "grid", gap: 3 }}>
                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontWeight: 750, color: "#0f172a" }}>
                      <input
                        type="checkbox"
                        checked={lifeAddToPortfolio}
                        onChange={(event) => setLifeAddToPortfolio(event.target.checked)}
                      />
                      Add to Portfolio
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                      Keep this as part of the learner&apos;s selected work.
                    </span>
                  </label>
                  <label style={{ display: "grid", gap: 3 }}>
                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontWeight: 750, color: "#0f172a" }}>
                      <input
                        type="checkbox"
                        checked={lifeIncludeInReport}
                        onChange={(event) => setLifeIncludeInReport(event.target.checked)}
                      />
                      Include in Reports
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                      Make this record available when building learning reports.
                    </span>
                  </label>
                </div>

                {!worksheetEvidenceMode && !learningFromLifeActive ? (
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      Optional calendar block
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                      Link this evidence to a planned calendar block if it belongs to one.
                    </span>
                    <select
                      value={calendarItemId}
                      onChange={(event) => setCalendarItemId(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="">No optional calendar block</option>
                      {filteredCalendarItems.map((item) => {
                        const learnerLabel =
                          learnerOptions.find((option) => option.value === item.learnerId)
                            ?.label || "Family / all learners";

                        return (
                          <option key={item.id} value={item.id}>
                            {buildCalendarOptionLabel(item, learnerLabel)}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </div>
                ) : null}

                <div className={worksheetEvidenceMode ? "mylearna-capture-save-row" : undefined} data-guidance-id="capture-save" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    style={{
                      ...buttonStyle,
                      opacity: worksheetEvidenceMode && !worksheetProgressLevel ? 0.68 : 1,
                      cursor:
                        submitting || (worksheetEvidenceMode && !worksheetProgressLevel)
                          ? "not-allowed"
                          : "pointer",
                    }}
                    disabled={submitting || (worksheetEvidenceMode && !worksheetProgressLevel)}
                    data-capture-save={worksheetEvidenceMode ? "active" : undefined}
                  >
                    {submitting
                      ? worksheetEvidenceMode
                        ? savePhase || "Recording completed work..."
                        : "Saving..."
                      : worksheetEvidenceMode
                        ? photoFile
                          ? "Record completed work"
                          : "Record completed work without photo"
                        : "Record learning"}
                  </button>
                  {editingEntryId ? (
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                      onClick={() => {
                        resetForm();
                        if (captureContextKey) {
                          clearCaptureContext();
                        }
                      }}
                      disabled={submitting}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>

                {linkingError ? (
                  <p style={{ margin: 0, color: "#b91c1c" }}>{linkingError}</p>
                ) : null}
              </form>

              {pendingAttachmentError ? (
                <div
                  style={{
                    marginTop: 16,
                    border: "1px solid #FED7AA",
                    borderRadius: 14,
                    padding: 14,
                    background: "#FFF7ED",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <strong style={{ color: "#C2410C", fontSize: 16 }}>
                    Progress saved, but photo upload failed.
                  </strong>
                  <p style={{ margin: 0, color: "#9A3412", lineHeight: 1.5 }}>
                    {pendingAttachmentFileName ? `${pendingAttachmentFileName}: ` : ""}
                    {pendingAttachmentError}
                  </p>
                  <p style={{ margin: 0, color: "#9A3412", fontSize: 13, lineHeight: 1.45 }}>
                    Check your connection and try again. Your progress note has been saved.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={
                        pendingUploadedAttachments.length
                          ? retryPendingAttachmentLink
                          : retryPendingPhotoUpload
                      }
                      disabled={
                        submitting ||
                        (!pendingUploadedAttachments.length && !photoFile)
                      }
                      style={buttonStyle}
                    >
                      {submitting
                        ? savePhase || "Retrying photo upload..."
                        : pendingUploadedAttachments.length
                          ? "Retry attaching photo"
                          : "Retry photo upload"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingAttachmentError("");
                        setPendingAttachmentEvidenceId("");
                        setPendingAttachmentFileName("");
                        setPendingUploadedAttachments([]);
                        setLastSavedPhotoAttached(false);
                        setSavedAttachments([]);
                        setMessage("Learning recorded.");
                      }}
                      disabled={submitting}
                      style={{ ...buttonStyle, background: "#FFFFFF", color: "#0F172A" }}
                    >
                      Save without photo
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(savedEvidencePathwayReturnPath)}
                      disabled={submitting}
                      style={{ ...buttonStyle, background: "#FFFFFF", color: "#0F172A" }}
                    >
                      Return to pathway
                    </button>
                  </div>
                </div>
              ) : null}

              {message ? (
                <div
                  className="mylearna-capture-success-panel"
                  data-capture-success={lastSavedPathwayContext ? "saved" : undefined}
                  style={{
                    marginTop: 16,
                    border: "1px solid #99f6e4",
                    borderRadius: 14,
                    padding: 14,
                    background: "#f0fdfa",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <strong style={{ margin: 0, color: "#0f766e", fontSize: 16 }}>
                    Learning recorded
                  </strong>
                  {lastSavedPathwayContext ? (
                    <div style={{ display: "grid", gap: 4, color: "#0f766e", fontSize: 13 }}>
                      {lastSavedLearnerLabel ? <span>{lastSavedLearnerLabel}</span> : null}
                      {lastSavedWorksheetProgress ? (
                        <span>{lastSavedWorksheetProgress}</span>
                      ) : null}
                      <span>
                        {worksheetTitleFromQuery || lastSavedPathwayContext.stepTitle || "Worksheet step"}
                      </span>
                      <span>{lastSavedDate ? formatDateLabel(lastSavedDate) : ""}</span>
                      {lastSavedLearningArea ? <span>{lastSavedLearningArea}</span> : null}
                      <span>
                        {lastSavedPhotoAttached ? "Photo attached - " : ""}
                        {lastSavedPortfolioIncluded ? "Added to Portfolio" : "Not added to Portfolio"} -{" "}
                        {lastSavedReportIncluded ? "Included in Reports" : "Not included in Reports"}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 4, color: "#0f766e", fontSize: 13 }}>
                      {lastSavedLearnerLabel ? <span>{lastSavedLearnerLabel}</span> : null}
                      {lastSavedTitle ? <span>{lastSavedTitle}</span> : null}
                      {lastSavedDate ? <span>{formatDateLabel(lastSavedDate)}</span> : null}
                      {lastSavedLearningArea ? <span>{lastSavedLearningArea}</span> : null}
                      <span>
                        {lastSavedPortfolioIncluded ? "Added to Portfolio" : "Not added to Portfolio"} -{" "}
                        {lastSavedReportIncluded ? "Included in Reports" : "Not included in Reports"}
                      </span>
                    </div>
                  )}
                  {lastSavedPhotoPreviewUrl ? (
                    <div
                      role="img"
                      aria-label="Saved worksheet evidence preview"
                      style={{
                        width: 124,
                        height: 86,
                        borderRadius: 12,
                        border: "1px solid #99f6e4",
                        backgroundImage: `url(${lastSavedPhotoPreviewUrl})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }}
                    />
                  ) : null}
                  {savedAttachments.length ? (
                    <p style={{ margin: 0, color: "#0f766e", fontWeight: 700 }}>
                      Photo attached: {savedAttachments.map((attachment) => attachment.label).join(", ")}
                    </p>
                  ) : null}
                  {lastSavedPathwayContext ? (
                    <div className="mylearna-capture-success-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                        onClick={() => router.push(savedEvidencePathwayReturnPath)}
                      >
                        {lastSavedReturnPath ? "Return to pathway" : "Back to My Pathways"}
                      </button>
                      <Link href={savedEvidencePortfolioPath} style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a", textDecoration: "none" }}>
                        View portfolio
                      </Link>
                      <Link href={savedEvidenceLearningRecordPath} style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a", textDecoration: "none" }}>
                        Download learning record
                      </Link>
                      <button
                        type="button"
                        style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                        onClick={() => {
                          setMessage(null);
                          setLastSavedPathwayContext(null);
                          setLastSavedEvidenceId("");
                          setLastSavedTitle("");
                          setLastSavedDate("");
                          setLastSavedLearningArea("");
                          setLastSavedPortfolioIncluded(true);
                          setLastSavedReportIncluded(true);
                          setLastSavedWorksheetProgress("");
                          setLastSavedPhotoAttached(false);
                          setLastSavedPhotoPreviewUrl((current) => {
                            if (current) URL.revokeObjectURL(current);
                            return "";
                          });
                        }}
                      >
                        Add another capture
                      </button>
                    </div>
                  ) : null}
                  {lastSavedCurriculumContext ? (
                    <div>
                      <button
                        type="button"
                        style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                        onClick={() => router.push(curriculumReturnPath)}
                      >
                        Back to My Learna
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {actionError ? (
                <div
                  style={{
                    marginTop: 16,
                    border: "1px solid #fecaca",
                    borderRadius: 14,
                    padding: 14,
                    background: "#fef2f2",
                  }}
                >
                  <p style={{ margin: 0, color: "#b91c1c" }}>{actionError}</p>
                </div>
              ) : null}
            </section>

            {!worksheetEvidenceMode &&
            !lastSavedPathwayContext &&
            !workspace.setupLoading &&
            !workspace.setupStatus.hasEvidence ? (
            <section data-guidance-id="capture-next-portfolio" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Next step: My Portfolio</h2>
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                After you capture useful evidence, review it in My Portfolio and choose
                what should support reporting later.
              </p>
              <GuidanceSetupNextAction
                stepId="capture"
                nextHref="/my-portfolio"
                label="Continue to My Portfolio"
                helperText="Capture an evidence item when something useful has happened."
              />
            </section>
            ) : null}

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 14 }}>
                <button
                  type="button"
                  onClick={() => setRecentNotesOpen((current) => !current)}
                  aria-expanded={recentNotesOpen}
                  aria-controls={recentNotesPanelId}
                  style={{
                    width: "100%",
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    background: "#f8fafc",
                    padding: 14,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                        Recent learning
                      </h2>
                      <span
                        style={{
                          border: "1px solid #e2e8f0",
                          background: "#ffffff",
                          color: "#475569",
                          borderRadius: 999,
                          padding: "4px 8px",
                          fontSize: 12,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entries.length} {entries.length === 1 ? "note" : "notes"}
                      </span>
                    </div>
                    {!recentNotesOpen ? (
                      <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                        Review or edit recent learning records when needed.
                      </div>
                    ) : null}
                  </div>
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      border: "1px solid #dbeafe",
                      background: "#ffffff",
                      color: "#1d4ed8",
                      fontSize: 12,
                      fontWeight: 800,
                      transform: recentNotesOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 140ms ease",
                      flexShrink: 0,
                    }}
                  >
                    v
                  </span>
                </button>

                <div
                  id={recentNotesPanelId}
                  hidden={!recentNotesOpen}
                  style={recentNotesOpen ? { display: "grid", gap: 12 } : { display: "none" }}
                >
                  {entriesLoading ? (
                    <p style={{ margin: 0, color: "#475569" }}>Loading capture notes...</p>
                  ) : null}
                  {entriesError ? <p style={{ margin: 0, color: "#b91c1c" }}>{entriesError}</p> : null}

                  {!entriesLoading && !entriesError && !entries.length ? (
                    <p style={{ margin: 0, color: "#475569" }}>
                      {selectedLearnerLabel
                        ? `No evidence captured for ${selectedLearnerLabel} yet. When ${selectedLearnerLabel} completes learning, you can save a note, observation, or work sample here.`
                        : "No capture notes yet. When learning happens, you can save a note, observation, or work sample here."}
                    </p>
                  ) : null}

                  {!entriesLoading && !entriesError && entries.length ? (
                    <div style={{ display: "grid", gap: 12 }}>
                      {entries.map((entry) => {
                        const learnerLabel =
                          learnerOptions.find((option) => option.value === entry.learnerId)?.label ||
                          "Unknown learner";
                        const linkedProgram =
                          programs.find((program) => program.id === entry.programId)?.title ||
                          null;
                        const linkedCalendarItem =
                          calendarItems.find((item) => item.id === entry.calendarItemId) ?? null;
                        const entryCurriculumContext = parseCurriculumContextFromNodeIds(
                          entry.curriculumNodeIds,
                        );
                        const entryPathwayContext = parsePathwayContextFromNodeIds(
                          entry.curriculumNodeIds,
                        );
                        const linkedSegment =
                          linkedCalendarItem?.programSegmentId
                            ? programSegments.find(
                                (segment) => segment.id === linkedCalendarItem.programSegmentId,
                              )?.title ?? null
                            : null;

                        return (
                          <div
                            key={entry.id}
                            style={{
                              border: "1px solid #e2e8f0",
                              borderRadius: 14,
                              padding: 14,
                              display: "grid",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                              }}
                            >
                              <div>
                                <strong>{entry.title || "Untitled note"}</strong>
                                <div style={{ color: "#64748b", marginTop: 4 }}>
                                  {formatDateLabel(entry.observedOn)} - {learnerLabel}
                                  {entry.learningArea ? ` - ${entry.learningArea}` : ""}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                                  onClick={() => handleEdit(entry)}
                                  disabled={submitting}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  style={{ ...buttonStyle, background: "#b91c1c", borderColor: "#b91c1c" }}
                                  onClick={() => void handleDelete(entry)}
                                  disabled={submitting}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                              {entry.whatHappened}
                            </p>
                            {entry.reflection ? (
                              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                {entry.reflection}
                              </p>
                            ) : null}
                            {entryCurriculumContext ? (
                              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                                Curriculum link:{" "}
                                {[
                                  entryCurriculumContext.learningAreaLabel,
                                  entryCurriculumContext.curriculumElementLabel,
                                  entryCurriculumContext.authorityEvidenceAreaLabel,
                                ]
                                  .filter(Boolean)
                                  .join(" - ")}
                              </div>
                            ) : null}
                            {entryPathwayContext ? (
                              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                                Pathway link:{" "}
                                {[
                                  entryPathwayContext.pathwayLabel,
                                  entryPathwayContext.stageLabel,
                                  buildPathwayStepLabel(entryPathwayContext),
                                ]
                                  .filter(Boolean)
                                  .join(" - ")}
                              </div>
                            ) : null}
                            {entryPathwayContext?.observedSkillStatus ? (
                              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                                Observed skill status: {entryPathwayContext.observedSkillStatus}
                              </div>
                            ) : null}
                            {linkedProgram || linkedCalendarItem ? (
                              <div style={{ color: "#64748b", fontSize: 13 }}>
                                {linkedProgram ? `Program: ${linkedProgram}` : ""}
                                {linkedProgram && linkedSegment ? " | " : ""}
                                {linkedSegment ? `Week / segment: ${linkedSegment}` : ""}
                                {(linkedProgram || linkedSegment) && linkedCalendarItem ? " | " : ""}
                                {linkedCalendarItem ? `Block: ${linkedCalendarItem.title}` : ""}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        ) : null}

      </div>
    </div>
  );
}

export default function CleanCaptureWorkspace() {
  return <CleanCaptureWorkspaceBody />;
}
