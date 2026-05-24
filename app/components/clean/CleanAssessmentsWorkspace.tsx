"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
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
  getCleanAssessmentStageTitle,
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
  buildPathwayCaptureContext,
  encodeCurriculumContextNodeIds,
  encodePathwayContextNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { Learner } from "@/lib/clean/learners/types";
import {
  DETAILED_SUBJECT_CONFIGS,
  type DetailedSubjectConfig,
} from "@/lib/clean/pathways/detailedSubjectConfigs";
import type {
  MathematicsDetailedStrandStep,
  MathematicsDetailedStrandWorkspace,
} from "@/lib/clean/pathways/mathematicsDetailedStrands";
import {
  getStageProgressionLabel,
  inferPathwayStageFromYearLevel,
  type PathwayStageKey,
} from "@/lib/clean/pathways/mathematicsNumberPrototype";
import {
  buildPathwayRegistryStepKey,
  buildPathwayStepId,
  getPathwayStepsByStrand,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  buildUnifiedPathwayStepStateIndex,
  getUnifiedPathwayStepState,
} from "@/lib/clean/pathways/pathwayStepState";
import {
  PATHWAY_SUBJECTS,
} from "@/lib/clean/pathways/pathwaySubjects";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(18px, 4vw, 32px) clamp(12px, 4vw, 20px) 48px",
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

function buildSnapshotCardStyle(
  border: string,
  background: string,
): React.CSSProperties {
  return {
    ...summaryCardStyle,
    padding: 14,
    border: `1px solid ${border}`,
    background,
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
  };
}

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

type AssessmentSubject = {
  key: AssessmentSubjectKey;
  title: string;
  helper: string;
  summaryCopy: string;
  strands: SubjectStrandCard[];
  defaultStrandKey: string;
};

type AssessmentStepView = {
  registryItem: PathwayStepRegistryItem;
  step: MathematicsDetailedStrandStep;
  subjectTitle: string;
  subjectSummary: string;
  strandTitle: string;
  strandDescription: string;
  strandWhyItMatters: string;
  stageTitle: string;
  stageHelper: string;
  pathwayLabel: string;
};

type AssessmentStageView = {
  key: AssessmentStage;
  title: string;
  helper: string;
  steps: AssessmentStepView[];
};

type AssessmentTileSelection = {
  subjectKey: AssessmentSubjectKey;
  strandKey: string;
  stageKey: AssessmentStage;
  pathwayStepId: string;
};

type AssessmentTileFeedback = {
  tone: "success" | "error";
  message: string;
} | null;

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

type StageSnapshot = {
  secureOrStrong: number;
  developing: number;
  stillDeveloping: number;
  notAssessedYet: number;
};

const STATUS_META: Record<AssessmentStatus, StatusMeta> = {
  "Not assessed yet": {
    fill: "#f8fafc",
    border: "#e2e8f0",
    text: "#64748b",
    dot: "#94a3b8",
    cellLabel: "Not assessed",
    helper: "No assessment recorded yet.",
    scoringHint: "No assessment recorded yet.",
    detailMeaning:
      "No assessment has been recorded for this pathway step yet. The tracker is ready whenever you want to save a judgement.",
  },
  "Still developing": {
    fill: "#f5f3ff",
    border: "#ddd6fe",
    text: "#6d28d9",
    dot: "#8b5cf6",
    cellLabel: "Still developing",
    helper: "Early understanding is still developing.",
    scoringHint: "Early confidence is still building.",
    detailMeaning:
      "Early understanding is still developing. The learner may need more support, examples, or repetition before this feels settled.",
  },
  Developing: {
    fill: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    dot: "#3b82f6",
    cellLabel: "Developing",
    helper: "Confidence is starting to build.",
    scoringHint: "Growing confidence is becoming more visible.",
    detailMeaning:
      "Confidence is starting to build. The learner can show some understanding but still benefits from practice across different examples.",
  },
  Secure: {
    fill: "#f0fdf4",
    border: "#bbf7d0",
    text: "#166534",
    dot: "#22c55e",
    cellLabel: "Secure",
    helper: "The step is looking more settled.",
    scoringHint: "Understanding looks settled and repeatable.",
    detailMeaning:
      "The step looks settled. The learner can usually apply this idea with dependable confidence.",
  },
  Strong: {
    fill: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    dot: "#f97316",
    cellLabel: "Strong",
    helper: "Repeated confidence or standout performance.",
    scoringHint: "Confidence is sustained, fluent, or extending beyond expectation.",
    detailMeaning:
      "Repeated confidence or standout performance is showing. This can support richer evidence, extension, or next-step planning.",
  },
};

const ASSESSMENT_SUBJECTS = PATHWAY_SUBJECTS.filter(
  (subject) => subject.status === "detailed",
)
  .map((subject) => {
    const config = DETAILED_SUBJECT_CONFIGS[subject.key];
    if (!config) {
      throw new Error(`Assessments is missing detailed subject config for "${subject.key}".`);
    }

    return {
      key: subject.key,
      title: subject.title,
      helper: subject.guidance,
      summaryCopy: subject.description,
      strands: config.domainCards,
      defaultStrandKey: config.defaultStrandKey,
    } satisfies AssessmentSubject;
  });

const ASSESSMENT_SUBJECTS_BY_KEY = Object.fromEntries(
  ASSESSMENT_SUBJECTS.map((subject) => [subject.key, subject]),
) as Record<AssessmentSubjectKey, AssessmentSubject>;

const DEFAULT_ASSESSMENT_SUBJECT_KEY =
  (ASSESSMENT_SUBJECTS[0]?.key || "mathematics") as AssessmentSubjectKey;

function safe(value: unknown) {
  return String(value ?? "").trim();
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

function buildAssessmentStatusLookupKey(
  subjectKey: AssessmentSubjectKey,
  skillKey: string,
  stageKey: AssessmentStage,
) {
  return `${subjectKey}::${skillKey}::${stageKey}`;
}

function normalizeAssessmentMatchText(value: unknown) {
  return safe(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toAssessmentMatchTokens(values: Array<string | null | undefined>) {
  return [
    ...new Set(
      values
        .flatMap((value) => normalizeAssessmentMatchText(value).split(/\s+/))
        .map((token) => token.trim())
        .filter((token) => token.length > 2),
    ),
  ];
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
  subject: AssessmentSubject,
): CurriculumFrameworkLearningArea | null {
  const subjectTokens = toAssessmentMatchTokens([subject.title, subject.summaryCopy, subject.helper]);

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
  stepView: AssessmentStepView,
): CurriculumFrameworkElement | null {
  if (!learningArea) return null;

  const skillTokens = toAssessmentMatchTokens([
    stepView.strandTitle,
    stepView.strandDescription,
    stepView.registryItem.stepTitle,
    stepView.registryItem.stepDescription,
    stepView.step.skillFocus,
    stepView.step.learningIntention,
    ...stepView.step.successCriteria,
    ...stepView.step.evidenceExamples,
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
    return "has an assessment judgement ready to begin or revisit";
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

function getAssessmentProgressionMeta(stage: AssessmentStage, currentStage: AssessmentStage) {
  const progressionLabel = getStageProgressionLabel(stage, currentStage as PathwayStageKey);

  if (progressionLabel === "Current focus") {
    return {
      badge: "Current focus",
      helper: "This is the main assessment band for the learner right now.",
    };
  }

  if (progressionLabel === "Next progression") {
    return {
      badge: "Next progression",
      helper: "These steps help show what learning is building toward next.",
    };
  }

  if (progressionLabel === "Later progression") {
    return {
      badge: "Later progression",
      helper: "These later steps stay visible for longer-term direction.",
    };
  }

  return {
    badge: "Earlier steps",
    helper: "These earlier steps help show what foundations sit underneath.",
  };
}

function formatLegacyAssessmentSkillLabel(skillKey: string) {
  return safe(skillKey)
    .split("-")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function buildDefaultSelectedStrands() {
  return ASSESSMENT_SUBJECTS.reduce(
    (next, subject) => {
      next[subject.key] = subject.defaultStrandKey;
      return next;
    },
    {} as Partial<Record<AssessmentSubjectKey, string>>,
  );
}

function buildAssessmentStageViews(
  subject: AssessmentSubject,
  selectedStrandCard: SubjectStrandCard,
  subjectConfig: DetailedSubjectConfig,
  stageFocus: AssessmentStage,
) {
  const workspaceBuilder = subjectConfig.workspaceBuilders[selectedStrandCard.key];
  if (!workspaceBuilder) {
    return {
      workspace: null,
      stages: [] as AssessmentStageView[],
      stepMap: new Map<string, AssessmentStepView>(),
    };
  }

  const workspace = workspaceBuilder(stageFocus) as MathematicsDetailedStrandWorkspace;
  const registryItems = getPathwayStepsByStrand(subject.key, selectedStrandCard.key);
  const registryById = new Map(registryItems.map((item) => [item.id, item]));
  const stageViews: AssessmentStageView[] = [];
  const stepMap = new Map<string, AssessmentStepView>();

  workspace.stages.forEach((stage) => {
    const stageStepKeys = new Set<string>();
    const stageSteps: AssessmentStepView[] = [];

    stage.steps.forEach((step, index) => {
      const explicitStepKey = safe(
        (step as Record<string, unknown>).stepKey ?? (step as Record<string, unknown>).key,
      );
      const stepKey = buildPathwayRegistryStepKey(
        explicitStepKey || step.title,
        safe(step.id) || String(index + 1),
        stageStepKeys,
      );
      stageStepKeys.add(stepKey);

      const pathwayStepId = buildPathwayStepId(
        subject.key,
        selectedStrandCard.key,
        stage.key,
        stepKey,
      );
      const registryItem = registryById.get(pathwayStepId);
      if (!registryItem) {
        return;
      }

      const stepView: AssessmentStepView = {
        registryItem,
        step,
        subjectTitle: subject.title,
        subjectSummary: subject.summaryCopy,
        strandTitle: selectedStrandCard.title,
        strandDescription: selectedStrandCard.description,
        strandWhyItMatters: selectedStrandCard.whyItMatters,
        stageTitle: stage.title,
        stageHelper: stage.helper,
        pathwayLabel: workspace.pathwayLabel,
      };

      stageSteps.push(stepView);
      stepMap.set(pathwayStepId, stepView);
    });

    stageViews.push({
      key: stage.key as AssessmentStage,
      title: stage.title,
      helper: stage.helper,
      steps: stageSteps,
    });
  });

  return {
    workspace,
    stages: stageViews,
    stepMap,
  };
}

function getStageSnapshot(
  steps: AssessmentStepView[],
  getStatus: (stepView: AssessmentStepView) => AssessmentStatus,
): StageSnapshot {
  return steps.reduce(
    (totals, stepView) => {
      const status = getStatus(stepView);

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
  );
}

function AssessmentsWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const [selectedLearnerIdOverride, setSelectedLearnerIdOverride] = useState("");
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<AssessmentSubjectKey>(
    DEFAULT_ASSESSMENT_SUBJECT_KEY,
  );
  const [selectedStrandKeys, setSelectedStrandKeys] = useState<
    Partial<Record<AssessmentSubjectKey, string>>
  >(buildDefaultSelectedStrands());
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
    () => inferPathwayStageFromYearLevel(selectedLearner?.yearLevel),
    [selectedLearner?.yearLevel],
  );

  const stageFocus = useMemo(() => {
    const stageFocusLearnerId = selectedLearner?.id || "";
    if (stageFocusOverride?.learnerId === stageFocusLearnerId) {
      return stageFocusOverride.stage;
    }
    return inferredStageFocus;
  }, [inferredStageFocus, selectedLearner?.id, stageFocusOverride]);

  const selectedFamilyId = workspace.profile?.id || "";
  const selectedSubject = ASSESSMENT_SUBJECTS_BY_KEY[selectedSubjectKey];
  const selectedStrandKey =
    selectedStrandKeys[selectedSubjectKey] || selectedSubject.defaultStrandKey;
  const selectedStrandCard =
    selectedSubject.strands.find((strand) => strand.key === selectedStrandKey) ||
    selectedSubject.strands[0] ||
    null;
  const selectedSubjectConfig = DETAILED_SUBJECT_CONFIGS[selectedSubjectKey] || null;

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
              "Saved assessment statuses could not be loaded right now.",
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
  const unifiedPathwayStepStateIndex = useMemo(
    () =>
      buildUnifiedPathwayStepStateIndex({
        assessmentStatuses,
        evidenceEntries: assessmentEvidenceEntries,
      }),
    [assessmentEvidenceEntries, assessmentStatuses],
  );

  const selectedStrandView = useMemo(() => {
    if (!selectedStrandCard || !selectedSubjectConfig) {
      return {
        workspace: null,
        stages: [] as AssessmentStageView[],
        stepMap: new Map<string, AssessmentStepView>(),
      };
    }

    return buildAssessmentStageViews(
      selectedSubject,
      selectedStrandCard,
      selectedSubjectConfig,
      stageFocus,
    );
  }, [selectedStrandCard, selectedSubject, selectedSubjectConfig, stageFocus]);

  const selectedStageViews = selectedStrandView.stages;
  const selectedStepMap = selectedStrandView.stepMap;

  const stageFocusAdjustedForView = useMemo(() => {
    const selectedLearnerKey = selectedLearner?.id || "";
    return (
      Boolean(selectedLearnerKey) &&
      stageFocusOverride?.learnerId === selectedLearnerKey &&
      stageFocusOverride.stage !== inferredStageFocus
    );
  }, [inferredStageFocus, selectedLearner?.id, stageFocusOverride]);

  const currentStageView =
    selectedStageViews.find((stage) => stage.key === stageFocus) || selectedStageViews[0] || null;

  function getSavedAssessmentStatusRecord(
    subjectKey: AssessmentSubjectKey,
    pathwayStepId: string,
    stageKey: AssessmentStage,
  ) {
    return (
      savedAssessmentStatusMap.get(
        buildAssessmentStatusLookupKey(subjectKey, pathwayStepId, stageKey),
      ) ?? null
    );
  }

  function getDisplayedAssessmentStatus(stepView: AssessmentStepView) {
    return (
      getSavedAssessmentStatusRecord(
        stepView.registryItem.subjectKey,
        stepView.registryItem.id,
        stepView.registryItem.stageKey as AssessmentStage,
      )?.status ?? "Not assessed yet"
    );
  }

  const currentStageSnapshot = useMemo(
    () =>
      getStageSnapshot(currentStageView?.steps || [], (stepView) => {
        const savedStatus = savedAssessmentStatusMap.get(
          buildAssessmentStatusLookupKey(
            stepView.registryItem.subjectKey,
            stepView.registryItem.id,
            stepView.registryItem.stageKey as AssessmentStage,
          ),
        );
        return savedStatus?.status ?? "Not assessed yet";
      }),
    [currentStageView, savedAssessmentStatusMap],
  );

  const legacyAssessmentStatusesForSubject = useMemo(
    () =>
      assessmentStatuses.filter(
        (item) => item.subjectKey === selectedSubjectKey && !item.pathwayStepId,
      ),
    [assessmentStatuses, selectedSubjectKey],
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

  const selectedTileIdentity = useMemo(() => {
    if (!selectedTile) return "";

    return [
      selectedLearner?.id || "no-learner",
      selectedTile.subjectKey,
      selectedTile.strandKey,
      selectedTile.stageKey,
      selectedTile.pathwayStepId,
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

  const selectedTileDetail = selectedTile
    ? selectedStepMap.get(selectedTile.pathwayStepId) ?? null
    : null;
  const selectedTileStatusRecord =
    selectedTile && selectedTileDetail
      ? getSavedAssessmentStatusRecord(
          selectedTile.subjectKey,
          selectedTile.pathwayStepId,
          selectedTile.stageKey,
        )
      : null;
  const selectedTileDisplayedStatus = selectedTileDetail
    ? getDisplayedAssessmentStatus(selectedTileDetail)
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
  const selectedTileUnifiedState = selectedTile
    ? getUnifiedPathwayStepState(unifiedPathwayStepStateIndex, selectedTile.pathwayStepId)
    : null;
  const selectedTileLinkedEvidenceCount = selectedTileUnifiedState?.linkedEvidenceCount || 0;
  const selectedTileLinkedEvidenceLabel = formatAssessmentSavedAt(
    selectedTileLinkedEvidenceEntry?.createdAt ||
      selectedTileLinkedEvidenceEntry?.observedOn ||
      null,
  );
  const selectedTileStageMessage =
    selectedTile && selectedTileDetail
      ? selectedTile.stageKey === stageFocus
        ? `${selectedTileDetail.stageHelper} This is the learner's current assessment band, so the focus is on what they can now do with growing confidence and consistency.`
        : `${selectedTileDetail.stageHelper} This step stays visible so you can see what foundations sit underneath or what learning is building toward next.`
      : "";

  function openAssessmentTile(stepView: AssessmentStepView) {
    const displayedStatus = getDisplayedAssessmentStatus(stepView);
    const savedStatusRecord = getSavedAssessmentStatusRecord(
      stepView.registryItem.subjectKey,
      stepView.registryItem.id,
      stepView.registryItem.stageKey as AssessmentStage,
    );

    setSelectedTile({
      subjectKey: stepView.registryItem.subjectKey,
      strandKey: stepView.registryItem.strandKey,
      stageKey: stepView.registryItem.stageKey as AssessmentStage,
      pathwayStepId: stepView.registryItem.id,
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
        message: "Add a learner before saving an assessment confidence judgement.",
      });
      return;
    }

    setIsSavingAssessmentStatus(true);
    setSelectedTileEvidenceFeedback(null);

    try {
      const selectedTileStep = selectedTileDetail;
      const savedStatus = await upsertCleanAssessmentSkillStatus(selectedFamilyId, {
        learnerId: selectedLearner.id,
        subjectKey: selectedTile.subjectKey,
        skillKey: selectedTile.pathwayStepId,
        stageKey: selectedTile.stageKey,
        status: selectedTileDraftStatus,
        note: selectedTileDraftNote,
        pathwayStepId: selectedTile.pathwayStepId,
        strandKey: selectedTile.strandKey,
        stepKey: selectedTileStep?.registryItem.stepKey || null,
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
        message: "Assessment confidence saved.",
      });
    } catch {
      setSelectedTileFeedback({
        tone: "error",
        message: "Could not save this assessment confidence. Please try again.",
      });
    } finally {
      setIsSavingAssessmentStatus(false);
    }
  }

  async function createEvidenceFromSavedStatus() {
    if (
      !selectedTile ||
      !selectedTileDetail ||
      !selectedTileStatusRecord ||
      !selectedLearner ||
      !selectedFamilyId
    ) {
      setSelectedTileEvidenceFeedback({
        tone: "error",
        message: "Save this assessment confidence before creating an evidence note.",
      });
      return;
    }

    if (selectedTileHasUnsavedChanges) {
      setSelectedTileEvidenceFeedback({
        tone: "error",
        message: "Save the latest confidence changes before creating an evidence note.",
      });
      return;
    }

    if (selectedTileLinkedEvidenceEntry) {
      setSelectedTileEvidenceFeedback({
        tone: "success",
        message: "Evidence is already linked for this saved assessment confidence.",
      });
      return;
    }

    setIsCreatingAssessmentEvidence(true);
    setSelectedTileEvidenceFeedback(null);

    try {
      const learningArea = findAssessmentLearningArea(resolvedFramework, selectedSubject);
      const curriculumElement = findAssessmentCurriculumElement(
        learningArea,
        selectedTileDetail,
      );
      const curriculumContext = buildCurriculumCaptureContext({
        learningAreaKey: learningArea?.key || null,
        learningAreaLabel: learningArea?.label || null,
        curriculumElementKey: curriculumElement?.key || null,
        curriculumElementLabel: curriculumElement?.label || null,
      });
      const pathwayContext = buildPathwayCaptureContext({
        subjectKey: selectedTileDetail.registryItem.subjectKey,
        subjectLabel: selectedTileDetail.subjectTitle,
        pathwayKey: selectedTileDetail.registryItem.strandKey,
        pathwayLabel: selectedTileDetail.strandTitle,
        stageKey: selectedTileDetail.registryItem.stageKey,
        stageLabel: selectedTileDetail.stageTitle,
        pathwayStepId: selectedTileDetail.registryItem.id,
        stepKey: selectedTileDetail.registryItem.stepKey,
        stepNumber: selectedTileDetail.registryItem.legacyStepNumber,
        stepTitle: selectedTileDetail.registryItem.stepTitle,
        stepMeaning: selectedTileDetail.registryItem.stepDescription,
        skillFocus: selectedTileDetail.registryItem.skillFocus,
        observedSkillStatus: selectedTileStatusRecord.status,
      });
      const evidenceLink = {
        sourceContext: "my-assessments",
        statusRecordId: selectedTileStatusRecord.id,
        statusSavedAt: selectedTileSavedAt,
        subjectKey: selectedTile.subjectKey,
        skillKey: selectedTile.pathwayStepId,
        stageKey: selectedTile.stageKey,
        assessmentStatus: selectedTileStatusRecord.status,
      } satisfies CleanAssessmentEvidenceLink;
      const curriculumNodeIds = encodeAssessmentEvidenceNodeIds(
        encodePathwayContextNodeIds(
          encodeCurriculumContextNodeIds([], curriculumContext),
          pathwayContext,
        ),
        evidenceLink,
      );

      const createdEvidence = await createCleanEvidenceEntry(selectedFamilyId, {
        learnerId: selectedLearner.id,
        observedOn: getAssessmentEvidenceObservedOn(selectedTileStatusRecord),
        title: `Assessment evidence - ${selectedTileDetail.registryItem.stepTitle}`,
        whatHappened: `${selectedLearnerLabel} ${getAssessmentStatusNarrative(
          selectedTileStatusRecord.status,
        )} in ${selectedTileDetail.registryItem.stepTitle} within ${
          selectedTileDetail.strandTitle
        } at ${selectedTileDetail.stageTitle} in ${selectedTileDetail.subjectTitle}.`,
        reflection: selectedTileStatusRecord.note || null,
        learningArea: learningArea?.label || selectedTileDetail.subjectTitle,
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
        <CleanWorkflowRibbon />

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
                  Assess confidence against the same pathway steps used in My Pathways. Choose a
                  subject, narrow to one strand, and save a calm judgement against the learner&apos;s
                  current steps.
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
                  Manual confidence tracking now writes to pathway-linked step IDs.
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
                alignItems: "start",
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
                        Learner context for the current assessment workspace.
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <strong style={{ color: "#0f172a" }}>
                      Add a learner before tracking assessment confidence.
                    </strong>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      You can still explore the workspace while learner details are being set up.
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
                  {ASSESSMENT_SUBJECTS.map((subject) => {
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
                        }}
                      >
                        {subject.title}
                      </button>
                    );
                  })}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.7 }}>
                  {selectedSubject.summaryCopy}
                </div>
              </div>

              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Strand focus</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selectedSubject.strands.map((strand) => {
                    const active = strand.key === selectedStrandCard?.key;

                    return (
                      <button
                        key={strand.key}
                        type="button"
                        onClick={() => {
                          setSelectedStrandKeys((current) => ({
                            ...current,
                            [selectedSubject.key]: strand.key,
                          }));
                          setSelectedTile(null);
                        }}
                        aria-pressed={active}
                        style={{
                          border: active ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                          background: active ? "#eff6ff" : "#ffffff",
                          color: active ? "#1d4ed8" : "#0f172a",
                          borderRadius: 12,
                          padding: "10px 12px",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          textAlign: "left",
                        }}
                      >
                        {strand.title}
                      </button>
                    );
                  })}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.7 }}>
                  {selectedStrandCard?.description || "Choose a strand to narrow the assessment view."}
                </div>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  {selectedStrandCard?.whyItMatters || selectedSubject.helper}
                </div>
              </div>

              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Current stage focus</div>
                <strong style={{ color: "#0f172a", fontSize: 20 }}>
                  {getCleanAssessmentStageTitle(stageFocus)}
                </strong>
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
                      {getCleanAssessmentStageTitle(stage)}
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
                  {frameworkDetails?.frameworkLabel ||
                    "Framework details will connect to My Settings later."}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {frameworkDetails
                    ? `${frameworkDetails.countryLabel}${
                        frameworkDetails.authorityLabel !== "Not recorded in MyLearna yet."
                          ? ` / ${frameworkDetails.authorityLabel}`
                          : ""
                      }`
                    : "Selected framework context will connect to My Settings as this layer develops."}
                </div>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  {frameworkDetails?.settingsHint ||
                    "The assessment workspace will later map back to the framework selected in My Settings."}
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
                  Confidence is saved against pathway steps, while the stage focus helps you keep
                  the learner&apos;s current band in view.
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
                Current stage: {getCleanAssessmentStageTitle(stageFocus)}
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
                <div style={eyebrowStyle}>Confidence legend</div>
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
                  Open any pathway step to save confidence or create linked evidence.
                </div>
              </div>

              <div style={{ ...compactCardStyle, padding: 14 }}>
                <div style={eyebrowStyle}>Progression strip</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ASSESSMENT_STAGES.map((stage) => {
                    const isFocusedStage = stage === stageFocus;
                    const progressionMeta = getAssessmentProgressionMeta(stage, stageFocus);

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
                        <strong style={{ color: "#0f172a", fontSize: 13 }}>
                          {getCleanAssessmentStageTitle(stage)}
                        </strong>
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
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>Current strand snapshot</div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>
                {selectedStrandCard?.title || "Assessment strand"}
              </h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                {selectedStrandCard?.whyItMatters ||
                  "Choose one strand and use the saved confidence view to stay focused."}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              }}
            >
              <div style={buildSnapshotCardStyle("#dbeafe", "#f8fbff")}>
                <div style={eyebrowStyle}>Current stage steps</div>
                <strong style={{ color: "#0f172a", fontSize: 24 }}>
                  {currentStageView?.steps.length || 0}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Steps currently visible in {getCleanAssessmentStageTitle(stageFocus)}.
                </div>
              </div>

              <div style={buildSnapshotCardStyle("#bbf7d0", "#f0fdf4")}>
                <div style={eyebrowStyle}>Secure or strong</div>
                <strong style={{ color: "#166534", fontSize: 24 }}>
                  {currentStageSnapshot.secureOrStrong}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Saved confidence already looks more settled here.
                </div>
              </div>

              <div style={buildSnapshotCardStyle("#bfdbfe", "#eff6ff")}>
                <div style={eyebrowStyle}>Developing</div>
                <strong style={{ color: "#1d4ed8", fontSize: 24 }}>
                  {currentStageSnapshot.developing + currentStageSnapshot.stillDeveloping}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Steps where confidence is still building.
                </div>
              </div>

              <div style={buildSnapshotCardStyle("#e2e8f0", "#f8fafc")}>
                <div style={eyebrowStyle}>Not assessed yet</div>
                <strong style={{ color: "#475569", fontSize: 24 }}>
                  {currentStageSnapshot.notAssessedYet}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Steps still waiting for a saved judgement.
                </div>
              </div>
            </div>

            {assessmentStatusesLoading ? (
              <div style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>Loading saved assessment confidence</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Pulling the latest saved judgements for this learner now.
                </div>
              </div>
            ) : null}

            {assessmentStatusesError ? (
              <div
                style={{
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  borderRadius: 16,
                  padding: 14,
                  lineHeight: 1.6,
                }}
              >
                {assessmentStatusesError}
              </div>
            ) : null}
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
              <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
                <div style={eyebrowStyle}>Assessment workspace</div>
                <h2 style={{ margin: 0, color: "#0f172a" }}>
                  {selectedSubject.title} - {selectedStrandCard?.title || "Selected strand"}
                </h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Open a pathway step to save assessment confidence, add a note, and link evidence
                  without leaving the shared learning spine.
                </p>
              </div>
            </div>

            <div style={helperCardStyle}>
              <strong style={{ color: "#0f172a" }}>How to use this view</strong>
              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                Start with the current focus stage. Earlier and later stages stay visible so you
                can judge confidence within the learner&apos;s wider progression, not in isolation.
              </div>
            </div>

            {legacyAssessmentStatusesForSubject.length ? (
              <div style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>Legacy saved assessment statuses</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Older assessment records from the previous skill tracker are still preserved.
                  New saves now use canonical pathway step IDs. Legacy rows remain visible here
                  until a later migration maps them more precisely.
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {legacyAssessmentStatusesForSubject.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid #dbeafe",
                        borderRadius: 12,
                        background: "#ffffff",
                        padding: 12,
                        display: "grid",
                        gap: 4,
                      }}
                    >
                      <strong style={{ color: "#0f172a" }}>
                        {formatLegacyAssessmentSkillLabel(item.skillKey)}
                      </strong>
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>
                        {getCleanAssessmentStageTitle(item.stageKey)} - {item.status}
                      </div>
                    </div>
                  ))}
                  {legacyAssessmentStatusesForSubject.length > 6 ? (
                    <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                      {legacyAssessmentStatusesForSubject.length - 6} more legacy records are also
                      preserved.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 14 }}>
              {selectedStageViews.map((stageView) => {
                const isFocusedStage = stageView.key === stageFocus;
                const progressionMeta = getAssessmentProgressionMeta(stageView.key, stageFocus);
                const stageSnapshot = getStageSnapshot(stageView.steps, (stepView) =>
                  getDisplayedAssessmentStatus(stepView),
                );

                return (
                  <article
                    key={stageView.key}
                    style={{
                      border: isFocusedStage ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                      borderRadius: 18,
                      background: isFocusedStage ? "#f8fbff" : "#ffffff",
                      padding: 16,
                      display: "grid",
                      gap: 14,
                      boxShadow: isFocusedStage
                        ? "0 12px 26px rgba(59,130,246,0.08)"
                        : "0 6px 18px rgba(15,23,42,0.03)",
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
                      <div style={{ display: "grid", gap: 6, maxWidth: 760 }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              border: isFocusedStage ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                              background: "#ffffff",
                              color: isFocusedStage ? "#1d4ed8" : "#64748b",
                              borderRadius: 999,
                              padding: "5px 9px",
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                            }}
                          >
                            {progressionMeta.badge}
                          </span>
                          <span
                            style={{
                              border: "1px solid #e2e8f0",
                              background: "#ffffff",
                              color: "#475569",
                              borderRadius: 999,
                              padding: "5px 9px",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {stageView.steps.length} steps
                          </span>
                        </div>
                        <strong style={{ color: "#0f172a", fontSize: 18 }}>{stageView.title}</strong>
                        <div style={{ color: "#475569", lineHeight: 1.6 }}>{stageView.helper}</div>
                        <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                          {progressionMeta.helper}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                          minWidth: "min(100%, 320px)",
                        }}
                      >
                        <div style={buildSnapshotCardStyle("#bbf7d0", "#f0fdf4")}>
                          <div style={eyebrowStyle}>Secure / strong</div>
                          <strong style={{ color: "#166534", fontSize: 20 }}>
                            {stageSnapshot.secureOrStrong}
                          </strong>
                        </div>
                        <div style={buildSnapshotCardStyle("#bfdbfe", "#eff6ff")}>
                          <div style={eyebrowStyle}>Developing</div>
                          <strong style={{ color: "#1d4ed8", fontSize: 20 }}>
                            {stageSnapshot.developing + stageSnapshot.stillDeveloping}
                          </strong>
                        </div>
                        <div style={buildSnapshotCardStyle("#e2e8f0", "#f8fafc")}>
                          <div style={eyebrowStyle}>Not assessed</div>
                          <strong style={{ color: "#475569", fontSize: 20 }}>
                            {stageSnapshot.notAssessedYet}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      }}
                    >
                      {stageView.steps.map((stepView) => {
                        const status = getDisplayedAssessmentStatus(stepView);
                        const savedStatusRecord = getSavedAssessmentStatusRecord(
                          stepView.registryItem.subjectKey,
                          stepView.registryItem.id,
                          stepView.registryItem.stageKey as AssessmentStage,
                        );
                        const linkedEvidenceCount =
                          getUnifiedPathwayStepState(
                            unifiedPathwayStepStateIndex,
                            stepView.registryItem.id,
                          )?.linkedEvidenceCount || 0;
                        const meta = STATUS_META[status];

                        return (
                          <button
                            key={stepView.registryItem.id}
                            type="button"
                            onClick={() => openAssessmentTile(stepView)}
                            aria-label={`${stepView.registryItem.stepTitle}, ${stageView.title}, ${status}`}
                            style={{
                              border: `1px solid ${meta.border}`,
                              borderRadius: 16,
                              background: "#ffffff",
                              padding: 14,
                              display: "grid",
                              gap: 10,
                              textAlign: "left",
                              cursor: "pointer",
                              boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
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
                                {savedStatusRecord ? "Saved" : "Not saved"}
                              </span>
                            </div>

                            <div style={{ display: "grid", gap: 6 }}>
                              <strong style={{ color: "#0f172a", fontSize: 15 }}>
                                {stepView.registryItem.stepTitle}
                              </strong>
                              <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
                                {stepView.registryItem.stepDescription}
                              </div>
                              <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5 }}>
                                Evidence linked:{" "}
                                <strong style={{ color: "#0f172a" }}>{linkedEvidenceCount}</strong>
                              </div>
                            </div>

                            <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 700 }}>
                              Open assessment detail
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>Coming later</div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>Future assessment actions</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                The next layer will add structured checks, saved summaries, and clearer reporting
                views while still using the same subject -&gt; strand -&gt; stage -&gt; step spine.
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
                <strong style={{ color: "#0f172a", fontSize: 18 }}>Structured checks</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Gentle checks will later help confirm whether a saved judgement is still
                  developing, developing, secure, or strong.
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
                  Assessment summaries
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Export assessment summaries that can support reports, curriculum review, and
                  planning conversations.
                </div>
                <div>
                  <button type="button" style={disabledButtonStyle} disabled>
                    Coming later
                  </button>
                </div>
              </article>

              <article style={compactCardStyle}>
                <div style={eyebrowStyle}>Legacy migration</div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>Legacy status mapping</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Older assessment rows can be mapped more precisely into the pathway spine in a
                  later migration pass.
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

        {selectedTile && selectedTileDetail && selectedTileStatusMeta ? (
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
                    Assessment step detail
                  </div>
                  <h2
                    id="assessment-tile-detail-heading"
                    style={{ margin: 0, color: "#0f172a", fontSize: 24 }}
                  >
                    {selectedTileDetail.registryItem.stepTitle}
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
                  <strong style={{ color: "#0f172a" }}>{selectedTileDetail.subjectTitle}</strong>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Strand</div>
                  <strong style={{ color: "#0f172a" }}>{selectedTileDetail.strandTitle}</strong>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Developmental band</div>
                  <strong style={{ color: "#0f172a" }}>{selectedTileDetail.stageTitle}</strong>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Linked evidence</div>
                  <strong style={{ color: "#0f172a" }}>{selectedTileLinkedEvidenceCount}</strong>
                  <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.6 }}>
                    Evidence already attached to this same pathway step.
                  </div>
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
                    {selectedTileStatusRecord ? "Saved confidence" : "Displayed confidence"}
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
                <strong style={{ color: "#0f172a" }}>What this step means</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  {selectedTileDetail.registryItem.stepDescription}
                </p>
              </section>

              <section style={helperCardStyle}>
                <strong style={{ color: "#0f172a" }}>Why this stage matters</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  {selectedTileStageMessage}
                </p>
              </section>

              <section
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <article style={compactCardStyle}>
                  <strong style={{ color: "#0f172a" }}>What the learner is practising</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                    {selectedTileDetail.step.skillFocus}
                  </p>
                  <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                    {selectedTileDetail.step.learningIntention}
                  </div>
                </article>

                <article style={compactCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Assessment check</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                    {selectedTileDetail.step.assessmentCheck}
                  </p>
                </article>
              </section>

              <section style={compactCardStyle}>
                <strong style={{ color: "#0f172a" }}>What to look for</strong>
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
                  {selectedTileDetail.step.successCriteria.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ul>
              </section>

              <section
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <article style={compactCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Practice suggestion</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                    {selectedTileDetail.step.practiceActivity}
                  </p>
                </article>

                <article style={compactCardStyle}>
                  <strong style={{ color: "#0f172a" }}>What evidence could look like</strong>
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
                    {selectedTileDetail.step.evidenceExamples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </article>
              </section>

              <section
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <article style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>Report language</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                    {selectedTileDetail.step.reportLanguage}
                  </p>
                </article>

                <article style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>What comes next</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                    {selectedTileDetail.step.nextStep}
                  </p>
                </article>
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
                <strong style={{ color: "#0f172a" }}>Update assessment confidence</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Use this to record your current judgement for this pathway step. Formal
                  assessment checks can sit on top of this later.
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
                    {isSavingAssessmentStatus ? "Saving..." : "Save confidence"}
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
                      Add this saved confidence into learning evidence so portfolio and reporting
                      views can read the same pathway step later.
                    </p>

                    {selectedTileHasUnsavedChanges ? (
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>
                        Save this confidence first to create an evidence note from the latest
                        judgement.
                      </div>
                    ) : selectedTileLinkedEvidenceEntry ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ color: "#166534", lineHeight: 1.6 }}>
                          Evidence already linked for this saved confidence.
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
                  Manual confidence tracking and evidence links are now aligned to pathway step
                  IDs. Next, MyLearna can add structured checks and step-level summaries on top of
                  the same shared learning spine.
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
