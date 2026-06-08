"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import { CleanBetaFeedbackPrompt } from "@/app/components/clean/CleanPersonalisationCards";
import CleanPathwayStepActionRow from "@/app/components/clean/CleanPathwayStepActionRow";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import { GuidancePageAction } from "@/app/components/clean/guidance/GuidanceToggle";
import { listCleanAssessmentSkillStatuses } from "@/lib/clean/assessments/client";
import { listAssessmentAttemptsForLearner } from "@/lib/clean/assessments/attemptClient";
import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import {
  NUMBER_ASSESSMENT_BANKS,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  getExactStepAutoCheckStatusForPathwayStep,
  getAutoCheckStatusForPathwayStep,
  getNumberAssessmentAlignmentForPathwayStep,
  getNumberPathwayRevealGroups,
  type NumberPathwayRevealGroups,
  type NumberPathwayRevealStep,
} from "@/lib/clean/assessments/numberPathwayAssessmentAlignment";
import {
  getStepAssessmentForPathwayStep,
} from "@/lib/clean/assessments/stepAssessmentRegistry";
import {
  getStepPracticeForPathwayStep,
} from "@/lib/clean/practice/stepPracticeRegistry";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";
import { getRegionalStageLabel } from "@/lib/clean/regionalStageLabels";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import {
  buildPathwayCaptureSearchParams,
} from "@/lib/clean/evidence/curriculumContext";
import type { Learner } from "@/lib/clean/learners/types";
import {
  type PathwayProgressStatus,
  inferPathwayStageFromYearLevel,
} from "@/lib/clean/pathways/mathematicsNumberPrototype";
import {
  DETAILED_SUBJECT_CONFIGS,
  NUMBER_AND_PLACE_VALUE_STRAND_KEY,
} from "@/lib/clean/pathways/detailedSubjectConfigs";
import {
  buildPathwayRegistryStepKey,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  getPathwayPracticeActivityByStepId,
} from "@/lib/clean/pathways/practiceActivities";
import { getWorksheetResourceForPathwayStep } from "@/lib/clean/resources/mathWorksheetResources";
import {
  buildUnifiedPathwayStepStateIndex,
  getUnifiedPathwayStepState,
  resolveCanonicalPathwayStepIdFromParts,
  type UnifiedPathwayStepStateIndex,
} from "@/lib/clean/pathways/pathwayStepState";
import {
  DEFAULT_PATHWAY_SUBJECT_KEY,
  PATHWAY_SUBJECTS,
  type PathwaySubjectDefinition,
  type PathwaySubjectKey,
} from "@/lib/clean/pathways/pathwaySubjects";
import type {
  MathematicsDetailedStrandStage,
  MathematicsDetailedStrandStep,
  MathematicsDetailedStrandWorkspace,
} from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(10px, 3vw, 20px) clamp(8px, 3vw, 16px) 36px",
  boxSizing: "border-box",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gap: 24,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#ffffff",
  padding: 12,
  boxShadow: "0 4px 14px rgba(15,23,42,0.035)",
};

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  background: "#f8fafc",
  padding: 10,
  display: "grid",
  gap: 6,
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 12,
  background: "#f8fbff",
  padding: 10,
  display: "grid",
  gap: 6,
};

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  background: "#ffffff",
  padding: 10,
  display: "grid",
  gap: 6,
  boxShadow: "0 3px 10px rgba(15,23,42,0.03)",
};

const EMPTY_STRAND_CARD: SubjectStrandCard = {
  key: "selected-strand",
  title: "Selected strand",
  description: "Choose a strand to open the detailed pathway workspace.",
  whyItMatters: "Detailed strand guidance will appear here when a populated strand is selected.",
  status: "coming-later",
};

const PATHWAYS_UI_STORAGE_KEY = "mylearna:clean-pathways-ui:v2";

type PathwayZoneViewMode = "current" | "nearby" | "full";
type PathwayWorksheetFilter = "all" | "with" | "missing";
type PathwayDensityMode = "compact" | "full";

type PersistedPathwaysUiState = {
  selectedLearnerId?: string;
  selectedSubjectKey?: PathwaySubjectKey;
  selectedStrandKeyBySubject?: Partial<Record<PathwaySubjectKey, string>>;
  hasExplicitStrandSelection?: boolean;
  strandSelectorExpanded?: boolean;
  stageOpenOverrides?: Record<string, boolean>;
  expandedStepId?: string | null;
  zoneViewMode?: PathwayZoneViewMode;
  worksheetFilter?: PathwayWorksheetFilter;
  densityMode?: PathwayDensityMode;
  scrollY?: number;
};

function readPersistedPathwaysUiState(): PersistedPathwaysUiState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PATHWAYS_UI_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePersistedPathwaysUiState(nextState: PersistedPathwaysUiState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PATHWAYS_UI_STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // Persistence is a convenience layer only.
  }
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
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

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#64748b",
  textTransform: "uppercase",
};

const statusMeta: Record<
  PathwayProgressStatus,
  { fill: string; border: string; text: string; dot: string; helper: string }
> = {
  "Not started": {
    fill: "#f8fafc",
    border: "#e2e8f0",
    text: "#64748b",
    dot: "#94a3b8",
    helper: "A useful next step is still ahead in this pathway.",
  },
  Practising: {
    fill: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    dot: "#f97316",
    helper: "This step is active for practice and repetition.",
  },
  "Evidence started": {
    fill: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    dot: "#3b82f6",
    helper: "Some learning evidence could begin to build here.",
  },
  "Ready to assess": {
    fill: "#f5f3ff",
    border: "#ddd6fe",
    text: "#6d28d9",
    dot: "#8b5cf6",
    helper: "This step looks ready for a gentle understanding check.",
  },
  Secure: {
    fill: "#ecfdf5",
    border: "#bbf7d0",
    text: "#166534",
    dot: "#22c55e",
    helper: "Confidence looks more settled at this step.",
  },
};

type StageSummaryCounts = {
  steps: number;
  secure: number;
  readyToAssess: number;
  evidenceStarted: number;
  practising: number;
  notStarted: number;
};

function getLearnerLabel(learner: Learner | null) {
  if (!learner) return "No learner selected";
  return learner.preferredName || learner.firstName;
}

function isNumberPathwayContext(subjectKey: string, strandKey: string) {
  return subjectKey === "mathematics" && strandKey === NUMBER_AND_PLACE_VALUE_STRAND_KEY;
}

function supportsExactStepPathwayContext(subjectKey: string, strandKey: string) {
  return (
    subjectKey === "mathematics" &&
      (strandKey === NUMBER_AND_PLACE_VALUE_STRAND_KEY ||
        strandKey === "operations-and-calculation" ||
        strandKey === "fractions-decimals-percentages" ||
        strandKey === "ratio-and-proportional-reasoning" ||
        strandKey === "algebra-patterns-and-functions" ||
        strandKey === "measurement" ||
        strandKey === "geometry-and-spatial-reasoning" ||
        strandKey === "statistics-and-data" ||
        strandKey === "probability-and-chance" ||
        strandKey === "financial-and-real-world-mathematics")
    );
}

function getStrandKeyFromPathwayStepId(pathwayStepId: string) {
  return pathwayStepId.split("::")[1] || NUMBER_AND_PLACE_VALUE_STRAND_KEY;
}

function getRevealStepDisplayNumber(step: NumberPathwayRevealStep) {
  return step.displayOrder ?? step.order + 1;
}

function getRevealFocusLabel(
  currentStep: NumberPathwayRevealStep | null,
  groups: NumberPathwayRevealGroups,
) {
  if (!currentStep) return "No signal yet";

  if (
    currentStep.autoCheck.status === "Developing" ||
    currentStep.autoCheck.status === "Needs support"
  ) {
    return `Keep working on Step ${getRevealStepDisplayNumber(currentStep)}`;
  }

  if (
    currentStep.autoCheck.status === "Secure" ||
    currentStep.autoCheck.status === "Consolidating"
  ) {
    const nextActiveStep = [
      ...groups.currentLearningZone,
      ...groups.laterPathway,
    ].find(
      (step) =>
        step.autoCheck.status !== "Secure" &&
        step.autoCheck.status !== "Consolidating",
    );

    if (nextActiveStep) {
      return `Next focus: Step ${getRevealStepDisplayNumber(nextActiveStep)}`;
    }
  }

  return `Next focus: Step ${getRevealStepDisplayNumber(currentStep)}`;
}

function buildPathwayStepReturnHref({
  pathname,
  subjectKey,
  strandKey,
  learnerId,
  detailPanelId,
}: {
  pathname: string;
  subjectKey: string;
  strandKey: string;
  learnerId?: string | null;
  detailPanelId: string;
}) {
  const params = new URLSearchParams();
  params.set("subjectKey", subjectKey);
  params.set("strandKey", strandKey);
  if (learnerId) {
    params.set("learnerId", learnerId);
  }

  return `${pathname}?${params.toString()}#${detailPanelId}`;
}

function getNumberBankForAttempt(attempt: CleanAssessmentAttempt) {
  return (
    NUMBER_ASSESSMENT_BANKS.find(
      (bank) =>
        bank.itemBankKey === attempt.itemBankKey ||
        bank.progressionBandKey === attempt.progressionBandKey ||
        bank.pathwayStepId === attempt.pathwayStepId ||
        bank.stepKey === attempt.stepKey,
    ) ?? null
  );
}

function getAttemptPrototypeMetadata(attempt: CleanAssessmentAttempt) {
  const summarySnapshot = attempt.summarySnapshot;
  const metadata =
    summarySnapshot && typeof summarySnapshot === "object"
      ? summarySnapshot.prototypeMetadata
      : null;
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : null;
}

function getAssessmentAttemptDisplayTitle(attempt: CleanAssessmentAttempt) {
  const prototypeMetadata = getAttemptPrototypeMetadata(attempt);
  const stepTitle = String(prototypeMetadata?.stepTitle ?? "").trim();
  if (stepTitle) return stepTitle;

  return getNumberBankForAttempt(attempt)?.shortTitle || "Assessment saved";
}

function formatAssessmentAttemptSavedAt(value: string | null) {
  const parsed = Date.parse(value || "");
  if (Number.isNaN(parsed)) return null;

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function getPathwayStageTone(stageIndex: number, currentStageIndex: number) {
  if (stageIndex === currentStageIndex) {
    return {
      badge: "Current focus",
      border: "#93c5fd",
      background: "#eff6ff",
      shadow: "0 10px 24px rgba(59,130,246,0.10)",
      text: "#1d4ed8",
    };
  }

  if (stageIndex === currentStageIndex + 1) {
    return {
      badge: "Next progression",
      border: "#ddd6fe",
      background: "#faf5ff",
      shadow: "0 8px 20px rgba(109,40,217,0.06)",
      text: "#6d28d9",
    };
  }

  if (stageIndex < currentStageIndex) {
    return {
      badge: "Earlier steps",
      border: "#cbd5e1",
      background: "#ffffff",
      shadow: "0 4px 14px rgba(15,23,42,0.04)",
      text: "#475569",
    };
  }

  return {
    badge: "Later progression",
    border: "#e2e8f0",
    background: "#ffffff",
    shadow: "0 4px 14px rgba(15,23,42,0.04)",
    text: "#64748b",
  };
}

function getWorkspaceDisplayedPathwayStatus(
  subjectKey: PathwaySubjectKey,
  workspace: MathematicsDetailedStrandWorkspace,
  stage: MathematicsDetailedStrandStage,
  stageIndex: number,
  currentStageIndex: number,
  step: MathematicsDetailedStrandStep,
  stepIndex: number,
  unifiedPathwayStepStateIndex: UnifiedPathwayStepStateIndex,
): {
  status: PathwayProgressStatus;
  fromSavedEvidence: boolean;
  pathwayStepId: string | null;
} {
  const stepKey = buildPathwayRegistryStepKey(step.title, step.id);
  const pathwayStepId = resolveCanonicalPathwayStepIdFromParts({
    subjectKey,
    pathwayKey: workspace.key,
    stageKey: stage.key,
    stepKey,
    stepNumber: String(step.id),
  });
  const savedStatus = getUnifiedPathwayStepState(
    unifiedPathwayStepStateIndex,
    pathwayStepId,
  )?.pathwayProgressFromEvidence;

  if (savedStatus) {
    return {
      status: savedStatus,
      fromSavedEvidence: true,
      pathwayStepId,
    };
  }

  if (stageIndex < currentStageIndex) {
    return {
      status: stepIndex === stage.steps.length - 1 ? "Ready to assess" : "Secure",
      fromSavedEvidence: false,
      pathwayStepId,
    };
  }

  if (stageIndex === currentStageIndex) {
    return {
      status: stepIndex === 0 ? "Evidence started" : "Practising",
      fromSavedEvidence: false,
      pathwayStepId,
    };
  }

  if (stageIndex === currentStageIndex + 1) {
    return {
      status: stepIndex === 0 ? "Practising" : "Not started",
      fromSavedEvidence: false,
      pathwayStepId,
    };
  }

  return {
    status: "Not started" as PathwayProgressStatus,
    fromSavedEvidence: false,
    pathwayStepId,
  };
}

function buildWorkspaceStageSummaryCounts(
  subjectKey: PathwaySubjectKey,
  workspace: MathematicsDetailedStrandWorkspace,
  stage: MathematicsDetailedStrandStage,
  stageIndex: number,
  currentStageIndex: number,
  unifiedPathwayStepStateIndex: UnifiedPathwayStepStateIndex,
): StageSummaryCounts {
  return stage.steps.reduce(
    (totals, step, stepIndex) => {
      const { status } = getWorkspaceDisplayedPathwayStatus(
        subjectKey,
        workspace,
        stage,
        stageIndex,
        currentStageIndex,
        step,
        stepIndex,
        unifiedPathwayStepStateIndex,
      );

      if (status === "Secure") {
        totals.secure += 1;
      } else if (status === "Ready to assess") {
        totals.readyToAssess += 1;
      } else if (status === "Evidence started") {
        totals.evidenceStarted += 1;
      } else if (status === "Practising") {
        totals.practising += 1;
      } else {
        totals.notStarted += 1;
      }

      return totals;
    },
    {
      steps: stage.steps.length,
      secure: 0,
      readyToAssess: 0,
      evidenceStarted: 0,
      practising: 0,
      notStarted: 0,
    },
  );
}

function getStageIsVisibleForZoneMode(
  stageIndex: number,
  currentStageIndex: number,
  zoneViewMode: PathwayZoneViewMode,
) {
  if (zoneViewMode === "full") return true;
  if (zoneViewMode === "nearby") return Math.abs(stageIndex - currentStageIndex) <= 1;
  return stageIndex === currentStageIndex;
}

function getDetailedStepCanonicalPathwayStepId({
  subjectKey,
  strand,
  stage,
  step,
}: {
  subjectKey: PathwaySubjectKey;
  strand: MathematicsDetailedStrandWorkspace;
  stage: MathematicsDetailedStrandStage;
  step: MathematicsDetailedStrandStep;
}) {
  const stepKey = buildPathwayRegistryStepKey(step.title, step.id);
  return resolveCanonicalPathwayStepIdFromParts({
    subjectKey,
    pathwayKey: strand.key,
    stageKey: stage.key,
    stepKey,
    stepNumber: String(step.id),
  });
}

function getDetailedStepWorksheetResource({
  subjectKey,
  strand,
  stage,
  step,
}: {
  subjectKey: PathwaySubjectKey;
  strand: MathematicsDetailedStrandWorkspace;
  stage: MathematicsDetailedStrandStage;
  step: MathematicsDetailedStrandStep;
}) {
  const stepKey = buildPathwayRegistryStepKey(step.title, step.id);
  const pathwayStepId = getDetailedStepCanonicalPathwayStepId({
    subjectKey,
    strand,
    stage,
    step,
  });

  return getWorksheetResourceForPathwayStep({
    pathwayStepId,
    stepKey,
    subjectKey,
    strandKey: strand.key,
    stageKey: stage.key,
  });
}

function getStepPassesWorksheetFilter(
  worksheetResource: ReturnType<typeof getWorksheetResourceForPathwayStep>,
  worksheetFilter: PathwayWorksheetFilter,
) {
  if (worksheetFilter === "with") return Boolean(worksheetResource);
  if (worksheetFilter === "missing") return !worksheetResource;
  return true;
}

function PathwaysWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const regionalStageContext =
    workspace.profile?.countryCode || workspace.profile?.jurisdictionCode || null;
  const persistedUiState = useMemo(() => readPersistedPathwaysUiState(), []);
  const initialSubjectKey = useMemo(() => {
    const subjectParam = searchParams.get("subjectKey");
    return (
      PATHWAY_SUBJECTS.find((subject) => subject.key === subjectParam)?.key ||
      PATHWAY_SUBJECTS.find((subject) => subject.key === persistedUiState.selectedSubjectKey)
        ?.key ||
      DEFAULT_PATHWAY_SUBJECT_KEY
    );
  }, [persistedUiState.selectedSubjectKey, searchParams]);
  const initialStrandWasSelected = useMemo(() => {
    const strandParam = searchParams.get("strandKey");
    const subjectConfig = DETAILED_SUBJECT_CONFIGS[initialSubjectKey];
    return Boolean(
      strandParam && subjectConfig?.domainCards.some((domain) => domain.key === strandParam),
    ) || Boolean(persistedUiState.hasExplicitStrandSelection);
  }, [initialSubjectKey, persistedUiState.hasExplicitStrandSelection, searchParams]);
  const initialStrandKeyBySubject = useMemo(() => {
    const strandParam = searchParams.get("strandKey");
    const subjectConfig = DETAILED_SUBJECT_CONFIGS[initialSubjectKey];
    const queryStrandIsValid = Boolean(
      strandParam && subjectConfig?.domainCards.some((domain) => domain.key === strandParam),
    );

    return {
      ...persistedUiState.selectedStrandKeyBySubject,
      mathematics:
        initialSubjectKey === "mathematics" && queryStrandIsValid
          ? strandParam || ""
          : persistedUiState.selectedStrandKeyBySubject?.mathematics ||
            DETAILED_SUBJECT_CONFIGS.mathematics?.defaultStrandKey ||
            NUMBER_AND_PLACE_VALUE_STRAND_KEY,
      english:
        initialSubjectKey === "english" && queryStrandIsValid
          ? strandParam || ""
          : persistedUiState.selectedStrandKeyBySubject?.english ||
            DETAILED_SUBJECT_CONFIGS.english?.defaultStrandKey || "",
      science:
        initialSubjectKey === "science" && queryStrandIsValid
          ? strandParam || ""
          : persistedUiState.selectedStrandKeyBySubject?.science ||
            DETAILED_SUBJECT_CONFIGS.science?.defaultStrandKey || "",
      humanities:
        initialSubjectKey === "humanities" && queryStrandIsValid
          ? strandParam || ""
          : persistedUiState.selectedStrandKeyBySubject?.humanities ||
            DETAILED_SUBJECT_CONFIGS.humanities?.defaultStrandKey || "",
      technologies:
        initialSubjectKey === "technologies" && queryStrandIsValid
          ? strandParam || ""
          : persistedUiState.selectedStrandKeyBySubject?.technologies ||
            DETAILED_SUBJECT_CONFIGS.technologies?.defaultStrandKey || "",
      arts:
        initialSubjectKey === "arts" && queryStrandIsValid
          ? strandParam || ""
          : persistedUiState.selectedStrandKeyBySubject?.arts ||
            DETAILED_SUBJECT_CONFIGS.arts?.defaultStrandKey || "",
      "health-pe":
        initialSubjectKey === "health-pe" && queryStrandIsValid
          ? strandParam || ""
          : persistedUiState.selectedStrandKeyBySubject?.["health-pe"] ||
            DETAILED_SUBJECT_CONFIGS["health-pe"]?.defaultStrandKey || "",
    } satisfies Partial<Record<PathwaySubjectKey, string>>;
  }, [initialSubjectKey, persistedUiState.selectedStrandKeyBySubject, searchParams]);
  const [selectedLearnerIdOverride, setSelectedLearnerIdOverride] = useState(
    () => searchParams.get("learnerId") || persistedUiState.selectedLearnerId || "",
  );
  // Keep subject and strand selection explicit so later planning, capture, calendar,
  // and reporting can point back to a stable subject -> strand -> stage -> step path.
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<PathwaySubjectKey>(
    initialSubjectKey,
  );
  const [hasExplicitStrandSelection, setHasExplicitStrandSelection] =
    useState(initialStrandWasSelected);
  const [strandSelectorExpanded, setStrandSelectorExpanded] =
    useState(
      persistedUiState.strandSelectorExpanded ??
        (!initialStrandWasSelected && !persistedUiState.hasExplicitStrandSelection),
    );
  const [selectedStrandKeyBySubject, setSelectedStrandKeyBySubject] = useState<
    Partial<Record<PathwaySubjectKey, string>>
  >(() => initialStrandKeyBySubject);
  const [stageOpenOverrides, setStageOpenOverrides] = useState<Record<string, boolean>>(
    () => persistedUiState.stageOpenOverrides || {},
  );
  const [expandedStepId, setExpandedStepId] = useState<string | null>(
    () => persistedUiState.expandedStepId || null,
  );
  const [zoneViewMode, setZoneViewMode] = useState<PathwayZoneViewMode>(
    () => persistedUiState.zoneViewMode || "current",
  );
  const [worksheetFilter, setWorksheetFilter] = useState<PathwayWorksheetFilter>(
    () => persistedUiState.worksheetFilter || "all",
  );
  const [densityMode, setDensityMode] = useState<PathwayDensityMode>(
    () => persistedUiState.densityMode || "compact",
  );
  const [exploreStepsOpen, setExploreStepsOpen] = useState(false);
  const [unifiedPathwayStepStateIndex, setUnifiedPathwayStepStateIndex] =
    useState<UnifiedPathwayStepStateIndex>(new Map());
  const [assessmentAttempts, setAssessmentAttempts] = useState<CleanAssessmentAttempt[]>([]);
  const pathwayDetailWorkspaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nextState: PersistedPathwaysUiState = {
      selectedSubjectKey,
      selectedStrandKeyBySubject,
      hasExplicitStrandSelection,
      strandSelectorExpanded,
      stageOpenOverrides,
      expandedStepId,
      zoneViewMode,
      worksheetFilter,
      densityMode,
      scrollY: typeof window === "undefined" ? 0 : window.scrollY,
    };
    writePersistedPathwaysUiState(nextState);
  }, [
    densityMode,
    expandedStepId,
    hasExplicitStrandSelection,
    selectedStrandKeyBySubject,
    selectedSubjectKey,
    stageOpenOverrides,
    strandSelectorExpanded,
    worksheetFilter,
    zoneViewMode,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const restoreScroll = Number(persistedUiState.scrollY || 0);
    if (!restoreScroll || searchParams.toString()) return;

    window.requestAnimationFrame(() => window.scrollTo({ top: restoreScroll }));
  }, [persistedUiState.scrollY, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function persistScrollPosition() {
      const current = readPersistedPathwaysUiState();
      writePersistedPathwaysUiState({
        ...current,
        scrollY: window.scrollY,
      });
    }

    window.addEventListener("beforeunload", persistScrollPosition);
    return () => window.removeEventListener("beforeunload", persistScrollPosition);
  }, []);

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

  useEffect(() => {
    if (!selectedLearnerId) return;
    const current = readPersistedPathwaysUiState();
    writePersistedPathwaysUiState({
      ...current,
      selectedLearnerId,
    });
  }, [selectedLearnerId]);

  const selectedLearnerLabel = getLearnerLabel(selectedLearner);
  const hasMultipleLearners = workspace.learners.length > 1;
  const currentLearnerFocusStageKey = useMemo(
    () => inferPathwayStageFromYearLevel(selectedLearner?.yearLevel),
    [selectedLearner?.yearLevel],
  );

  const selectedSubject =
    PATHWAY_SUBJECTS.find((subject) => subject.key === selectedSubjectKey) || PATHWAY_SUBJECTS[0];
  const selectedDetailedSubjectConfig = DETAILED_SUBJECT_CONFIGS[selectedSubjectKey] || null;
  const selectedSubjectSupportsDetailedPathways = Boolean(selectedDetailedSubjectConfig);
  const selectedStrandKey = selectedDetailedSubjectConfig
    ? selectedStrandKeyBySubject[selectedSubjectKey] || selectedDetailedSubjectConfig.defaultStrandKey
    : "";
  const selectedSubjectDomainCards = selectedDetailedSubjectConfig?.domainCards || [];
  const selectedSubjectDomain =
    selectedSubjectDomainCards.find((domain) => domain.key === selectedStrandKey) ||
    selectedSubjectDomainCards[0] ||
    EMPTY_STRAND_CARD;
  const selectedSubjectWorkspace = useMemo(() => {
    if (!selectedDetailedSubjectConfig) return null;

    const buildWorkspace = selectedDetailedSubjectConfig.workspaceBuilders[selectedStrandKey];
    return buildWorkspace ? buildWorkspace(currentLearnerFocusStageKey) : null;
  }, [currentLearnerFocusStageKey, selectedDetailedSubjectConfig, selectedStrandKey]);
  const selectedStrandIsActive =
    selectedSubjectSupportsDetailedPathways && hasExplicitStrandSelection;

  useEffect(() => {
    let active = true;

    async function loadUnifiedPathwayStepState() {
      if (
        !workspace.profile ||
        workspace.schemaMissing ||
        workspace.requiresFamilyCreation ||
        !selectedLearnerId
      ) {
        setUnifiedPathwayStepStateIndex(new Map());
        return;
      }

      try {
        const [evidenceEntries, assessmentStatuses] = await Promise.all([
          listCleanEvidenceEntries(workspace.profile.id, {
            learnerId: selectedLearnerId,
          }),
          listCleanAssessmentSkillStatuses(workspace.profile.id, selectedLearnerId),
        ]);

        if (!active) return;

        setUnifiedPathwayStepStateIndex(
          buildUnifiedPathwayStepStateIndex({
            evidenceEntries,
            assessmentStatuses,
          }),
        );
      } catch {
        if (!active) return;
        setUnifiedPathwayStepStateIndex(new Map());
      }
    }

    void loadUnifiedPathwayStepState();

    return () => {
      active = false;
    };
  }, [
    selectedLearnerId,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    let active = true;

    async function loadAssessmentAttempts() {
      if (
        !workspace.profile ||
        workspace.schemaMissing ||
        workspace.requiresFamilyCreation ||
        !selectedLearnerId
      ) {
        setAssessmentAttempts([]);
        return;
      }

      try {
        const nextAttempts = await listAssessmentAttemptsForLearner(workspace.profile.id, {
          learnerId: selectedLearnerId,
          subjectKey: selectedSubjectKey,
          strandKey: selectedStrandKey,
          status: "completed",
          limit: 50,
        });

        if (!active) return;
        setAssessmentAttempts(nextAttempts);
      } catch {
        if (!active) return;
        setAssessmentAttempts([]);
      }
    }

    void loadAssessmentAttempts();

    return () => {
      active = false;
    };
  }, [
    selectedLearnerId,
    selectedStrandKey,
    selectedSubjectKey,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  const selectedWorkspaceStageIndex = useMemo(() => {
    if (!selectedSubjectWorkspace) return -1;
    return Math.max(
      0,
      selectedSubjectWorkspace.stages.findIndex(
        (stage) => stage.key === selectedSubjectWorkspace.currentFocusStageKey,
      ),
    );
  }, [selectedSubjectWorkspace]);
  const selectedWorkspaceCurrentStage = useMemo(() => {
    if (!selectedSubjectWorkspace) return null;
    return selectedSubjectWorkspace.stages[selectedWorkspaceStageIndex] || null;
  }, [selectedSubjectWorkspace, selectedWorkspaceStageIndex]);
  const selectedWorkspaceSnapshot = useMemo(() => {
    if (!selectedSubjectWorkspace || !selectedWorkspaceCurrentStage) return null;

    return buildWorkspaceStageSummaryCounts(
      selectedSubjectKey,
      selectedSubjectWorkspace,
      selectedWorkspaceCurrentStage,
      selectedWorkspaceStageIndex,
      selectedWorkspaceStageIndex,
      unifiedPathwayStepStateIndex,
    );
  }, [
    selectedSubjectKey,
    selectedSubjectWorkspace,
    selectedWorkspaceCurrentStage,
    selectedWorkspaceStageIndex,
    unifiedPathwayStepStateIndex,
  ]);
  const visibleAssessmentAttempts = useMemo(
    () =>
      assessmentAttempts.filter(
        (attempt) =>
          attempt.learnerId === selectedLearnerId &&
          attempt.subjectKey === selectedSubjectKey &&
          attempt.strandKey === selectedStrandKey,
      ),
    [assessmentAttempts, selectedLearnerId, selectedStrandKey, selectedSubjectKey],
  );
  const latestAssessmentAttempt = visibleAssessmentAttempts[0] ?? null;
  const numberPathwayRevealGroups = useMemo(() => {
    if (
      !selectedSubjectWorkspace ||
      !supportsExactStepPathwayContext(selectedSubjectKey, selectedSubjectWorkspace.key)
    ) {
      return null;
    }

    const orderedSteps = selectedSubjectWorkspace.stages.flatMap((stage) =>
      stage.steps.map((step) => {
        const stepKey = buildPathwayRegistryStepKey(step.title, step.id);
        const pathwayStepId = resolveCanonicalPathwayStepIdFromParts({
          subjectKey: selectedSubjectKey,
          pathwayKey: selectedSubjectWorkspace.key,
          stageKey: stage.key,
          stepKey,
          stepNumber: String(step.id),
        }) || [
          selectedSubjectKey,
          selectedSubjectWorkspace.key,
          stage.key,
          stepKey,
        ].join("::");

        return {
          id: step.id,
          displayOrder: 0,
          title: step.title,
          stageKey: stage.key,
          stageTitle: getRegionalStageLabel(stage.key, regionalStageContext, stage.title),
          stepKey,
          pathwayStepId,
        };
      }),
    ).map((step, index) => ({ ...step, displayOrder: index + 1 }));

    return getNumberPathwayRevealGroups(orderedSteps, assessmentAttempts, {
      subjectKey: selectedSubjectKey,
      strandKey: selectedSubjectWorkspace.key,
    });
  }, [assessmentAttempts, regionalStageContext, selectedSubjectKey, selectedSubjectWorkspace]);
  const currentLearningZoneStartStep =
    numberPathwayRevealGroups?.currentLearningZone[0] || null;
  const selectedWorkspaceCurrentStageTitle = selectedWorkspaceCurrentStage
    ? getRegionalStageLabel(
        selectedWorkspaceCurrentStage.key,
        regionalStageContext,
        selectedWorkspaceCurrentStage.title,
      )
    : null;
  const currentLearningZoneStageTitle =
    currentLearningZoneStartStep?.stageTitle ||
    selectedWorkspaceCurrentStageTitle ||
    "Choose a strand below";
  const nextActionLabel = selectedWorkspaceSnapshot?.readyToAssess
    ? "Check understanding"
    : selectedWorkspaceSnapshot?.practising || selectedWorkspaceSnapshot?.evidenceStarted
      ? "Practise"
      : "Open the current focus";
  const selectedSubjectSummaryTitle = selectedSubjectSupportsDetailedPathways
    ? selectedSubjectWorkspace?.title ||
      selectedSubjectDomain.title ||
      `${selectedSubject.title} pathways`
    : `${selectedSubject.title} pathways`;
  const selectedSubjectSummaryHelper = selectedSubjectSupportsDetailedPathways
    ? `Current learning zone begins at: ${currentLearningZoneStageTitle}`
    : selectedSubject.guidance;
  const selectedSubjectStatusLabel = selectedSubjectSupportsDetailedPathways
    ? "Detailed now"
    : "Coming gradually";
  const topSnapshotTitle = selectedStrandIsActive
    ? selectedSubjectSummaryTitle
    : "Choose a pathway strand below";
  const topSnapshotStageLabel = selectedStrandIsActive
    ? currentLearningZoneStageTitle
    : "Select a strand to see the current pathway";
  const topSnapshotStagePrefix = selectedStrandIsActive
    ? "Current learning zone begins at: "
    : "Pathway view: ";
  const topSnapshotNextAction = selectedStrandIsActive
    ? nextActionLabel
    : "Choose a strand";
  const pathwaysHeading = selectedLearner
    ? `${selectedLearnerLabel}'s current pathway`
    : "My Pathways";

  const capturePathBase = pathname.startsWith("/clean-my-pathways")
    ? "/clean-my-capture"
    : "/my-capture";
  const assessPathBase = pathname.startsWith("/clean-my-pathways")
    ? "/clean-my-assessments"
    : "/my-assessments";

  function replacePathwayViewParams(nextSubjectKey: PathwaySubjectKey, nextStrandKey: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subjectKey", nextSubjectKey);
    params.set("strandKey", nextStrandKey);
    if (selectedLearnerId) {
      params.set("learnerId", selectedLearnerId);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSelectSubject(nextSubjectKey: PathwaySubjectKey) {
    const nextStrandKey =
      selectedStrandKeyBySubject[nextSubjectKey] ||
      DETAILED_SUBJECT_CONFIGS[nextSubjectKey]?.defaultStrandKey ||
      "";
    setSelectedSubjectKey(nextSubjectKey);
    setHasExplicitStrandSelection(Boolean(nextStrandKey));
    setStrandSelectorExpanded(!nextStrandKey);
    replacePathwayViewParams(nextSubjectKey, nextStrandKey);
  }

  function handleSelectSubjectStrand(nextStrandKey: string) {
    setSelectedStrandKeyBySubject((current) => ({
      ...current,
      [selectedSubjectKey]: nextStrandKey,
    }));
    setHasExplicitStrandSelection(true);
    setStrandSelectorExpanded(false);
    replacePathwayViewParams(selectedSubjectKey, nextStrandKey);

    const workspaceEl = pathwayDetailWorkspaceRef.current;
    if (!workspaceEl) return;

    workspaceEl.scrollIntoView({ behavior: "smooth", block: "start" });
    workspaceEl.focus({ preventScroll: true });
  }

  function getStageOpenState(strandKey: string, stageKey: string, defaultOpen: boolean) {
    return stageOpenOverrides[`${strandKey}::${stageKey}`] ?? defaultOpen;
  }

  function toggleStageOpen(strandKey: string, stageKey: string, defaultOpen: boolean) {
    setStageOpenOverrides((current) => {
      const stateKey = `${strandKey}::${stageKey}`;
      return {
        ...current,
        [stateKey]: !(current[stateKey] ?? defaultOpen),
      };
    });
  }

  return (
    <div style={shellStyle}>
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
      `}</style>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon />

        <details
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            background: "#ffffff",
            padding: "8px 10px",
          }}
        >
          <summary style={{ cursor: "pointer", color: "#334155", fontSize: 13, fontWeight: 800 }}>
            Help and page guide
          </summary>
          <div style={{ marginTop: 10 }}>
            <CleanPageIntroVideo
              config={PAGE_INTRO_VIDEOS.myPathways}
              promptTitle="New to My Pathways?"
              promptDescription="Watch a quick guide to see how pathway steps, practice, assessment and evidence work together."
            />
          </div>
        </details>

        <section
          data-guidance-id="pathways-current-step"
          style={{
            ...cardStyle,
            padding: 10,
            background:
              "linear-gradient(180deg, rgba(248,251,255,1) 0%, rgba(255,255,255,1) 100%)",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
                <div style={eyebrowStyle}>Current pathway</div>
                <h1 style={{ margin: 0, fontSize: 24, color: "#0f172a" }}>{pathwaysHeading}</h1>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span
                  style={{
                    border: "1px solid #bfdbfe",
                    background: "#ffffff",
                    color: "#1d4ed8",
                    borderRadius: 999,
                    padding: "5px 8px",
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.4,
                  }}
                >
                  Parent pathway map
                </span>
                <Link href="/my-settings" style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>
                  My Settings
                </Link>
                <GuidancePageAction anchorId="pathways-current-step" />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 0,
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  padding: "8px 10px 4px 0",
                  display: "grid",
                  gap: 4,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={eyebrowStyle}>Selected learner</div>
                {workspace.loading ? (
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    Loading learner details...
                  </div>
                ) : selectedLearner ? (
                  hasMultipleLearners ? (
                    <>
                      <label style={{ color: "#334155", fontWeight: 700 }}>
                        Viewing pathways for
                      </label>
                      <select
                        value={selectedLearnerId}
                        onChange={(event) => setSelectedLearnerIdOverride(event.target.value)}
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
                      <div style={{ color: "#64748b", lineHeight: 1.5 }}>Current learner</div>
                    </>
                  )
                ) : (
                  <>
                    <strong style={{ color: "#0f172a" }}>
                      Add a learner before building a pathway view.
                    </strong>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      You can still explore the pathway map while learner details are
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

              <div
                style={{
                  padding: "8px 10px 4px",
                  display: "grid",
                  gap: 4,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={eyebrowStyle}>Current pathway view</div>
                <strong style={{ color: "#0f172a", fontSize: 15 }}>
                  {topSnapshotTitle}
                </strong>
                <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>
                  {selectedSubjectSupportsDetailedPathways
                    ? topSnapshotStagePrefix
                    : "Current status: "}
                  <strong style={{ color: "#0f172a" }}>
                    {selectedSubjectSupportsDetailedPathways
                      ? topSnapshotStageLabel
                      : selectedSubjectStatusLabel}
                  </strong>
                </div>
                {!selectedSubjectSupportsDetailedPathways ? (
                  <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>
                    {selectedSubjectSummaryHelper}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  padding: "8px 10px 4px",
                  display: "grid",
                  gap: 4,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={eyebrowStyle}>Latest check</div>
                <strong style={{ color: "#0f172a", fontSize: 14 }}>
                  {latestAssessmentAttempt
                    ? getAssessmentAttemptDisplayTitle(latestAssessmentAttempt)
                    : "No check saved yet"}
                </strong>
                <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>
                  {latestAssessmentAttempt
                    ? `Saved ${formatAssessmentAttemptSavedAt(
                        latestAssessmentAttempt.completedAt || latestAssessmentAttempt.createdAt,
                      ) || "recently"}`
                    : "Use Check understanding when ready."}
                </div>
              </div>

              <div
                style={{
                  padding: "8px 0 4px 10px",
                  display: "grid",
                  gap: 4,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={eyebrowStyle}>Next action</div>
                <strong style={{ color: "#0f172a" }}>{topSnapshotNextAction}</strong>
                <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.4 }}>
                  {selectedStrandIsActive
                    ? "Use the current step panel below."
                    : "Pick from the pathway strands below."}
                </div>
              </div>
            </div>
          </div>
        </section>

        <details
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            background: "#ffffff",
            padding: "8px 10px",
          }}
        >
          <summary style={{ cursor: "pointer", color: "#334155", fontSize: 13, fontWeight: 800 }}>
            Feedback
          </summary>
          <div style={{ marginTop: 10 }}>
            <CleanBetaFeedbackPrompt pageName="My Pathways" />
          </div>
        </details>

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
              <div style={eyebrowStyle}>Choose a subject</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>Subject pathways</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Choose one subject and strand. The pathway below keeps the current focus visible.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              }}
            >
              <div style={compactCardStyle}>
                <label htmlFor="pathway-subject-selector" style={{ color: "#334155", fontWeight: 700 }}>
                  Viewing pathways for
                </label>
                <select
                  id="pathway-subject-selector"
                  value={selectedSubjectKey}
                  onChange={(event) =>
                    handleSelectSubject(event.target.value as PathwaySubjectKey)
                  }
                  style={inputStyle}
                >
                  {PATHWAY_SUBJECTS.map((subject) => (
                    <option key={subject.key} value={subject.key}>
                      {subject.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={helperCardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={eyebrowStyle}>Selected subject</div>
                  <span
                    style={{
                      border: selectedSubject.status === "detailed"
                        ? "1px solid #bfdbfe"
                        : "1px solid #e2e8f0",
                      background: selectedSubject.status === "detailed" ? "#eff6ff" : "#f8fafc",
                      color: selectedSubject.status === "detailed" ? "#1d4ed8" : "#64748b",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {selectedSubjectStatusLabel}
                  </span>
                </div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>{selectedSubject.title}</strong>
                <div style={{ color: "#475569", lineHeight: 1.5 }}>
                  {selectedSubject.description}
                </div>
              </div>
            </div>
          </div>
        </section>

        {selectedSubjectSupportsDetailedPathways ? (
          <>
            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 10 }}>
                {selectedStrandIsActive && !strandSelectorExpanded ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
                      <div style={eyebrowStyle}>Selected strand</div>
                      <strong style={{ color: "#0f172a", fontSize: 20 }}>
                        {selectedSubjectDomain.title}
                      </strong>
                      <div style={{ color: "#64748b", lineHeight: 1.5 }}>
                        {selectedSubjectDomain.description}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStrandSelectorExpanded(true)}
                      style={secondaryButtonStyle}
                    >
                      Change strand
                    </button>
                  </div>
                ) : (
                  <>
                    <details>
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "#0f172a",
                          fontWeight: 800,
                          lineHeight: 1.5,
                        }}
                      >
                        {selectedDetailedSubjectConfig?.overviewTitle}
                      </summary>
                      <div style={{ display: "grid", gap: 8, marginTop: 10, maxWidth: 760 }}>
                        <div style={eyebrowStyle}>
                          {selectedDetailedSubjectConfig?.overviewEyebrow}
                        </div>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                          {selectedDetailedSubjectConfig?.overviewDescription}
                        </p>
                        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
                          {selectedDetailedSubjectConfig?.overviewHelper}
                        </p>
                      </div>
                    </details>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "stretch",
                      }}
                    >
                      {selectedSubjectDomainCards.map((domain) => {
                        const detailed = domain.status !== "coming-later";
                        const firstDetailed = domain.status === "first-detailed";
                        const selected =
                          hasExplicitStrandSelection && domain.key === selectedStrandKey;

                        return (
                          <button
                            key={domain.key}
                            type="button"
                            onClick={() => handleSelectSubjectStrand(domain.key)}
                            aria-pressed={selected}
                            style={{
                              border: selected
                                ? "1px solid #3b82f6"
                                : detailed
                                  ? "1px solid #93c5fd"
                                  : "1px solid #e2e8f0",
                              borderRadius: 12,
                              background: selected ? "#eff6ff" : detailed ? "#f8fbff" : "#ffffff",
                              padding: "9px 11px",
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "auto",
                              minWidth: "min(100%, 180px)",
                              textAlign: "left",
                              cursor: "pointer",
                              boxShadow: selected
                                ? "0 8px 18px rgba(59,130,246,0.12)"
                                : detailed
                                  ? "0 5px 14px rgba(59,130,246,0.06)"
                                  : "0 3px 10px rgba(15,23,42,0.03)",
                              transition:
                                "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
                            }}
                          >
                            <strong style={{ color: "#0f172a", fontSize: 13, minWidth: 0 }}>
                              {domain.title}
                            </strong>
                            <span
                              style={{
                                border: selected
                                  ? "1px solid #93c5fd"
                                  : detailed
                                    ? "1px solid #bfdbfe"
                                    : "1px solid #e2e8f0",
                                background: selected
                                  ? "#ffffff"
                                  : detailed
                                    ? "#eff6ff"
                                    : "#f8fafc",
                                color: detailed ? "#1d4ed8" : "#64748b",
                                borderRadius: 999,
                                padding: "4px 7px",
                                fontSize: 11,
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {selected
                                ? "Selected"
                                : firstDetailed
                                  ? "Detailed"
                                  : detailed
                                    ? "Open"
                                    : "Soon"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </section>

            {selectedStrandIsActive ? (
              <section
                ref={pathwayDetailWorkspaceRef}
                tabIndex={-1}
                style={{ ...cardStyle, scrollMarginTop: 24, outline: "none" }}
              >
                {selectedSubjectWorkspace ? (
                <MathematicsStrandWorkspaceShell
                  eyebrow="Selected strand"
                  title={selectedSubjectWorkspace.title}
                  subtitle={selectedSubjectWorkspace.subtitle}
                  relationshipTitle={selectedSubjectWorkspace.relationshipTitle}
                  relationshipCopy={selectedSubjectWorkspace.relationshipCopy}
                  summaryCards={[
                    {
                      label: "Zone",
                      value: currentLearningZoneStageTitle,
                      helper: "Based on the first visible step in the current learning zone.",
                    },
                    {
                      label: "Secure",
                      value: String(selectedWorkspaceSnapshot?.secure || 0),
                      valueColor: "#166534",
                    },
                    {
                      label: "Assess",
                      value: String(selectedWorkspaceSnapshot?.readyToAssess || 0),
                      valueColor: "#6d28d9",
                    },
                    {
                      label: "Evidence",
                      value: String(selectedWorkspaceSnapshot?.evidenceStarted || 0),
                      valueColor: "#1d4ed8",
                    },
                    {
                      label: "Practice",
                      value: String(selectedWorkspaceSnapshot?.practising || 0),
                      valueColor: "#c2410c",
                    },
                    {
                      label: "New",
                      value: String(selectedWorkspaceSnapshot?.notStarted || 0),
                      valueColor: "#64748b",
                    },
                  ]}
                  supportCards={[
                    {
                      title: "Portfolio support",
                      items: selectedSubjectWorkspace.portfolioSupport,
                    },
                    {
                      title: "Reporting support",
                      items: selectedSubjectWorkspace.reportingSupport,
                    },
                    {
                      title: "What comes next",
                      items: [
                        selectedWorkspaceCurrentStage
                          ? `Current learning zone begins at: ${currentLearningZoneStageTitle}`
                          : "Current pathway focus will show here.",
                        selectedSubjectWorkspace.stages[selectedWorkspaceStageIndex + 1]
                          ? `Next progression: ${getRegionalStageLabel(
                              selectedSubjectWorkspace.stages[selectedWorkspaceStageIndex + 1]?.key || "",
                              regionalStageContext,
                              selectedSubjectWorkspace.stages[selectedWorkspaceStageIndex + 1]?.title,
                            )}`
                          : "This selected stage is currently the latest detailed progression in this strand.",
                      ],
                    },
                  ]}
                >
                  {numberPathwayRevealGroups ? (
                    <NumberPathwayRevealPanel
                      groups={numberPathwayRevealGroups}
                      learnerLabel={selectedLearnerLabel}
                      learnerId={selectedLearner?.id || ""}
                      returnPath={pathname}
                      strandTitle={selectedSubjectWorkspace.title}
                    />
                  ) : null}

                  <div
                    style={{
                      borderTop: "1px solid #e2e8f0",
                      borderBottom: "1px solid #e2e8f0",
                      background: "#ffffff",
                      padding: "8px 0",
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ ...eyebrowStyle, whiteSpace: "nowrap" }}>Pathway view</div>
                      <button
                        type="button"
                        onClick={() =>
                          setDensityMode((current) =>
                            current === "compact" ? "full" : "compact",
                          )
                        }
                        style={{
                          ...secondaryButtonStyle,
                          padding: "7px 10px",
                          fontSize: 12,
                        }}
                      >
                        {densityMode === "compact" ? "Compact view" : "Full view"}
                      </button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {([
                        ["current", "Current zone only"],
                        ["nearby", "Current + nearby"],
                        ["full", "Full pathway"],
                      ] as const).map(([value, label]) => {
                        const selected = zoneViewMode === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setZoneViewMode(value)}
                            style={{
                              border: selected ? "1px solid #1d4ed8" : "1px solid #cbd5e1",
                              background: selected ? "#eff6ff" : "#ffffff",
                              color: selected ? "#1d4ed8" : "#0f172a",
                              borderRadius: 999,
                              padding: "6px 9px",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {([
                        ["all", "All steps"],
                        ["with", "With worksheets"],
                        ["missing", "Missing worksheets"],
                      ] as const).map(([value, label]) => {
                        const selected = worksheetFilter === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setWorksheetFilter(value)}
                            style={{
                              border: selected ? "1px solid #0f766e" : "1px solid #cbd5e1",
                              background: selected ? "#f0fdfa" : "#ffffff",
                              color: selected ? "#0f766e" : "#0f172a",
                              borderRadius: 999,
                              padding: "6px 9px",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <details
                    open={exploreStepsOpen}
                    onToggle={(event) => setExploreStepsOpen(event.currentTarget.open)}
                  >
                    <summary
                      style={{
                        cursor: "pointer",
                        color: "#0f172a",
                        fontWeight: 800,
                        padding: "8px 0",
                      }}
                    >
                      Explore all pathway steps
                    </summary>
                    {exploreStepsOpen ? (
                      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
                        {selectedSubjectWorkspace.stages
                          .map((stage, stageIndex) => ({ stage, stageIndex }))
                          .filter(({ stageIndex }) =>
                            getStageIsVisibleForZoneMode(
                              stageIndex,
                              selectedWorkspaceStageIndex,
                              zoneViewMode,
                            ),
                          )
                          .map(({ stage, stageIndex }) => (
                            <DetailedMathematicsStageCard
                              key={`${selectedSubjectWorkspace.key}-${stage.key}`}
                              strand={selectedSubjectWorkspace}
                              stage={stage}
                              stageIndex={stageIndex}
                              currentStageIndex={selectedWorkspaceStageIndex}
                              unifiedPathwayStepStateIndex={unifiedPathwayStepStateIndex}
                              selectedSubjectKey={selectedSubject.key}
                              selectedSubjectTitle={selectedSubject.title}
                              selectedLearnerId={selectedLearner?.id || ""}
                              returnPath={pathname}
                              isOpen={getStageOpenState(
                                selectedSubjectWorkspace.key,
                                stage.key,
                                stage.key === selectedSubjectWorkspace.currentFocusStageKey,
                              )}
                              onToggle={() =>
                                toggleStageOpen(
                                  selectedSubjectWorkspace.key,
                                  stage.key,
                                  stage.key === selectedSubjectWorkspace.currentFocusStageKey,
                                )
                              }
                              capturePathBase={capturePathBase}
                              assessPathBase={assessPathBase}
                              assessmentAttempts={assessmentAttempts}
                              worksheetFilter={worksheetFilter}
                              densityMode={densityMode}
                              expandedStepId={expandedStepId}
                              onExpandedStepChange={setExpandedStepId}
                              regionalStageContext={regionalStageContext}
                            />
                          ))}
                      </div>
                    ) : null}
                  </details>
                </MathematicsStrandWorkspaceShell>
                ) : (
                  <PathwayComingLaterStrandSection domain={selectedSubjectDomain} />
                )}
              </section>
            ) : null}
          </>
        ) : (
          <PathwaySubjectPlaceholderSection subject={selectedSubject} />
        )}

        <details style={helperCardStyle}>
          <summary style={{ cursor: "pointer", color: "#0f172a", fontWeight: 800 }}>
            Future planning support
          </summary>
          <p style={{ margin: "10px 0 0", color: "#475569", lineHeight: 1.6 }}>
            {selectedSubjectSupportsDetailedPathways
              ? "Later, MyLearna will help turn selected pathway steps into a simple learning plan that can be placed into My Calendar and My Day."
              : `${selectedSubject.title} pathways will later use the same subject -> strand -> stage -> step structure to support planning in My Calendar and My Day.`}
          </p>
        </details>
      </div>
    </div>
  );
}

function PathwaySubjectPlaceholderSection({
  subject,
}: {
  subject: PathwaySubjectDefinition;
}) {
  return (
    <section style={cardStyle}>
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 8, maxWidth: 820 }}>
          <div style={eyebrowStyle}>Selected subject</div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>{subject.title} pathways</h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>{subject.description}</p>
          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>{subject.guidance}</p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <section style={helperCardStyle}>
            <div style={eyebrowStyle}>Likely future strands</div>
            <div style={{ display: "grid", gap: 8 }}>
              {subject.futureStrands.map((strand) => (
                <div key={`${subject.key}-${strand}`} style={{ color: "#475569", lineHeight: 1.6 }}>
                  {strand}
                </div>
              ))}
            </div>
          </section>

          <section style={summaryCardStyle}>
            <div style={eyebrowStyle}>How this will help</div>
            <div style={{ display: "grid", gap: 8, color: "#475569", lineHeight: 1.6 }}>
              <div>Choose a strand or domain inside the subject.</div>
              <div>Review current focus, next steps, and evidence ideas.</div>
              <div>Build portfolio and reporting support over time.</div>
            </div>
          </section>

          <section style={summaryCardStyle}>
            <div style={eyebrowStyle}>Current beta note</div>
            <div style={{ color: "#475569", lineHeight: 1.6 }}>{subject.placeholderNote}</div>
            <div style={{ color: "#64748b", lineHeight: 1.6 }}>
              Mathematics, English, Science, Humanities & Social Sciences, Technologies,
              Arts, and Health / PE are currently detailed while the wider pathway
              architecture can still expand into future optional areas later.
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function MathematicsStrandWorkspaceShell({
  eyebrow,
  title,
  subtitle,
  relationshipTitle,
  relationshipCopy,
  summaryCards,
  supportCards,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  relationshipTitle: string;
  relationshipCopy: string;
  summaryCards: Array<{
    label: string;
    value: string;
    helper?: string;
    valueColor?: string;
  }>;
  supportCards: Array<{
    title: string;
    items: string[];
  }>;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: 8,
        }}
      >
        <div style={{ display: "grid", gap: 3, maxWidth: 760 }}>
          <div style={eyebrowStyle}>{eyebrow}</div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>{title}</h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.35 }}>
            {subtitle}
          </p>
        </div>

        <details style={{ flex: "0 1 260px", minWidth: 0 }}>
          <summary style={{ cursor: "pointer", color: "#334155", fontSize: 13, fontWeight: 800 }}>
            {relationshipTitle}
          </summary>
          <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45, marginTop: 6 }}>
            {relationshipCopy}
          </div>
        </details>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          background: "#ffffff",
          padding: "8px 10px",
        }}
      >
        <span style={{ ...eyebrowStyle, marginRight: 2 }}>Progress summary</span>
        {summaryCards.map((card, index) => (
          <span
            key={`${card.label}-${index}`}
            title={card.helper || card.label}
            style={{
              border: "none",
              borderRadius: 999,
              background: card.valueColor ? "#f8fafc" : "transparent",
              color: card.valueColor || "#334155",
              padding: "3px 6px",
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: "#64748b", fontWeight: 700 }}>{card.label}</span>
            <strong
              style={{
                color: card.valueColor || "#0f172a",
                fontSize: 12,
              }}
            >
              {card.value}
            </strong>
          </span>
        ))}
      </div>

      {children}

      <details
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          background: "#ffffff",
          padding: "8px 10px",
        }}
      >
        <summary style={{ cursor: "pointer", color: "#0f172a", fontWeight: 800 }}>
          More pathway support
        </summary>
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            marginTop: 10,
          }}
        >
          {supportCards.map((card) => (
            <section
              key={card.title}
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: 8,
                display: "grid",
                gap: 5,
              }}
            >
              <div style={eyebrowStyle}>{card.title}</div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  color: "#475569",
                  lineHeight: 1.5,
                  display: "grid",
                  gap: 5,
                }}
              >
                {card.items.map((item) => (
                  <li key={`${card.title}-${item}`}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </details>
    </div>
  );
}

function getAutoCheckTone(status: string) {
  if (status === "Secure" || status === "Consolidating") {
    return {
      border: "#bbf7d0",
      background: "#f0fdf4",
      text: "#166534",
    };
  }

  if (status === "Developing") {
    return {
      border: "#fde68a",
      background: "#fffbeb",
      text: "#92400e",
    };
  }

  if (status === "Needs support") {
    return {
      border: "#fed7aa",
      background: "#fff7ed",
      text: "#c2410c",
    };
  }

  return {
    border: "#e2e8f0",
    background: "#ffffff",
    text: "#64748b",
  };
}

function NumberRevealStepCard({
  step,
  learnerId,
  returnPath,
  compact = false,
  primary = false,
}: {
  step: NumberPathwayRevealStep;
  learnerId: string;
  returnPath: string;
  compact?: boolean;
  primary?: boolean;
}) {
  const tone = getAutoCheckTone(step.autoCheck.status);
  const pathwayStepStrandKey = getStrandKeyFromPathwayStepId(step.pathwayStepId);
  const exactStepAssessment = getStepAssessmentForPathwayStep({
    pathwayStepId: step.pathwayStepId,
    stepKey: step.stepKey,
    strandKey: pathwayStepStrandKey,
  });
  const exactStepPractice = getStepPracticeForPathwayStep({
    pathwayStepId: step.pathwayStepId,
    stepKey: step.stepKey,
    strandKey: pathwayStepStrandKey,
  });
  const worksheetResource = getWorksheetResourceForPathwayStep({
    pathwayStepId: step.pathwayStepId,
    stepKey: step.stepKey,
    subjectKey: "mathematics",
    strandKey: pathwayStepStrandKey,
    stageKey: step.stageKey,
  });
  const stepStrandKey = exactStepAssessment?.strandKey ??
    exactStepPractice?.strandKey ??
    pathwayStepStrandKey;
  const stepReturnHref = buildPathwayStepReturnHref({
    pathname: returnPath,
    subjectKey: "mathematics",
    strandKey: stepStrandKey,
    learnerId,
    detailPanelId: `pathway-step-${stepStrandKey}-${step.stageKey}-${step.id}`,
  });
  const assessmentHref = exactStepAssessment
    ? (() => {
        const params = new URLSearchParams();
        params.set("source", "my-pathways");
        params.set("stepAssessmentKey", exactStepAssessment.key);
        params.set("subjectKey", exactStepAssessment.subjectKey);
        params.set("strandKey", exactStepAssessment.strandKey);
        params.set("stageKey", exactStepAssessment.stageKey);
        params.set("pathwayStepId", step.pathwayStepId);
        params.set("stepKey", step.stepKey);
        params.set("returnTo", stepReturnHref);
        params.set("progressionBandKey", exactStepAssessment.progressionBandKey);
        params.set("itemBankKey", exactStepAssessment.parentItemBankKey);
        if (learnerId) params.set("learnerId", learnerId);
        return `/assessments/number?${params.toString()}`;
      })()
    : "";
  const practiceHref = exactStepPractice
    ? (() => {
        const params = new URLSearchParams();
        params.set("stepPracticeKey", exactStepPractice.key);
        params.set("subjectKey", exactStepPractice.subjectKey);
        params.set("strandKey", exactStepPractice.strandKey);
        params.set("stageKey", exactStepPractice.stageKey);
        params.set("pathwayStepId", step.pathwayStepId);
        params.set("stepKey", step.stepKey);
        params.set("returnTo", stepReturnHref);
        if (learnerId) params.set("learnerId", learnerId);
        return `/practice/number-targeted?${params.toString()}`;
      })()
    : "";

  return (
    <div
      style={{
        border: `1px solid ${tone.border}`,
        borderRadius: 12,
        background: primary ? "#ffffff" : compact ? "#ffffff" : tone.background,
        padding: primary ? 12 : compact ? "9px 10px" : 12,
        display: "grid",
        gap: primary ? 10 : 7,
        opacity: compact && step.autoCheck.status !== "Not checked yet" ? 0.86 : 1,
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span
          style={{
            border: "1px solid #dbeafe",
            background: "#eff6ff",
            color: "#1d4ed8",
            borderRadius: 999,
            padding: "3px 8px",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          Step {getRevealStepDisplayNumber(step)}
        </span>
        <span
          style={{
            border: `1px solid ${tone.border}`,
            background: tone.background,
            color: tone.text,
            borderRadius: 999,
            padding: "3px 8px",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {step.autoCheck.status}
        </span>
      </div>
      <div
        style={{
          color: "#0f172a",
          fontWeight: 800,
          lineHeight: 1.25,
          fontSize: primary ? "clamp(16px, 2vw, 20px)" : 14,
        }}
      >
        {step.title}
      </div>
      <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>
        {step.stageTitle}
        {step.alignment ? ` / ${step.alignment.bank.shortTitle}` : ""}
        {step.autoCheck.scope === "sub-element" ? " / focus-level signal" : ""}
      </div>
      {assessmentHref || practiceHref || worksheetResource ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {practiceHref ? (
            <Link
              href={practiceHref}
              style={{
                ...secondaryButtonStyle,
                width: "fit-content",
                padding: "7px 10px",
                fontSize: 12,
              }}
            >
              Practise
            </Link>
          ) : null}
          {assessmentHref ? (
            <Link
              href={assessmentHref}
              style={{
                ...secondaryButtonStyle,
                width: "fit-content",
                padding: "7px 10px",
                fontSize: 12,
              }}
            >
              {exactStepAssessment ? "Assess" : "Check"}
            </Link>
          ) : null}
          {worksheetResource ? (
            <Link
              href={worksheetResource.href}
              target="_blank"
              rel="noreferrer"
              style={{
                ...secondaryButtonStyle,
                width: "fit-content",
                padding: "7px 10px",
                fontSize: 12,
              }}
              aria-label={`Download worksheet PDF for ${worksheetResource.title}`}
            >
              Worksheet
            </Link>
          ) : null}
        </div>
      ) : (
        <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>
          Exact practice and assessment are coming next for this step.
        </div>
      )}
      {!practiceHref && assessmentHref ? (
        <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>
          Exact practice is coming next for this step.
        </div>
      ) : null}
      {!assessmentHref && practiceHref ? (
        <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>
          Exact assessment is coming next for this step.
        </div>
      ) : null}
    </div>
  );
}

function NumberRevealStepList({
  steps,
  learnerId,
  returnPath,
  compact,
}: {
  steps: NumberPathwayRevealStep[];
  learnerId: string;
  returnPath: string;
  compact?: boolean;
}) {
  if (!steps.length) {
    return (
      <div style={{ color: "#64748b", lineHeight: 1.5 }}>
        Nothing to show in this group yet.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))",
        gap: compact ? 8 : 16,
      }}
    >
      {steps.map((step) => (
        <NumberRevealStepCard
          key={`${step.stageKey}-${step.id}`}
          step={step}
          learnerId={learnerId}
          returnPath={returnPath}
          compact={compact}
        />
      ))}
    </div>
  );
}

function NumberRevealLazyStepSection({
  title,
  steps,
  learnerId,
  returnPath,
  compact,
}: {
  title: string;
  steps: NumberPathwayRevealStep[];
  learnerId: string;
  returnPath: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      style={{
        borderTop: "1px solid #e2e8f0",
        paddingTop: 8,
      }}
    >
      <summary style={{ cursor: "pointer", color: "#0f172a", fontWeight: 800 }}>
        {title} ({steps.length})
      </summary>
      {open ? (
        <div style={{ marginTop: 12 }}>
          <NumberRevealStepList
            steps={steps}
            learnerId={learnerId}
            returnPath={returnPath}
            compact={compact}
          />
        </div>
      ) : null}
    </details>
  );
}

function NumberPathwayRevealPanel({
  groups,
  learnerLabel,
  learnerId,
  returnPath,
  strandTitle,
}: {
  groups: NumberPathwayRevealGroups;
  learnerLabel: string;
  learnerId: string;
  returnPath: string;
  strandTitle: string;
}) {
  const starterSteps = groups.laterPathway.slice(0, 4);
  const currentStartStep = groups.currentLearningZone[0] ?? starterSteps[0] ?? null;

  return (
    <section
      style={{
        border: "none",
        borderRadius: 0,
        background: "transparent",
        padding: 0,
        display: "grid",
        gap: 16,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={eyebrowStyle}>Individualised pathway</div>
          <span
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 999,
              background: "#eff6ff",
              color: "#1d4ed8",
              padding: "4px 8px",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {getRevealFocusLabel(currentStartStep, groups)}
          </span>
        </div>
        <h3
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "clamp(18px, 2vw, 22px)",
          }}
        >
          {groups.hasSavedAttempts
            ? `${learnerLabel}'s next focus`
            : `Start with a ${strandTitle} check`}
        </h3>
      </div>

      {currentStartStep ? (
        <div
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 14,
            background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
            padding: 12,
          }}
        >
          <NumberRevealStepCard
            step={currentStartStep}
            learnerId={learnerId}
            returnPath={returnPath}
            primary
          />
        </div>
      ) : null}

      {groups.hasSavedAttempts ? (
        <>
          {groups.needsPolish.length ? (
            <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
              <div style={eyebrowStyle}>Needs polish</div>
              <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>
                Earlier checked steps that were developing or needed support stay visible here.
              </div>
              <NumberRevealStepList
                steps={groups.needsPolish}
                learnerId={learnerId}
                returnPath={returnPath}
              />
            </section>
          ) : null}

          <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
            <div style={eyebrowStyle}>Current learning zone</div>
            <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>
              These are the steps to work on now.
            </div>
            <NumberRevealStepList
              steps={groups.currentLearningZone.filter(
                (step) => step.pathwayStepId !== currentStartStep?.pathwayStepId,
              )}
              learnerId={learnerId}
              returnPath={returnPath}
            />
          </section>

          <NumberRevealLazyStepSection
            title="Secure history"
            steps={groups.secureHistory}
            learnerId={learnerId}
            returnPath={returnPath}
            compact
          />
          <NumberRevealLazyStepSection
            title="Later pathway"
            steps={groups.laterPathway}
            learnerId={learnerId}
            returnPath={returnPath}
            compact
          />
        </>
      ) : (
        <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
          <div style={eyebrowStyle}>Starter guidance</div>
          <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>
            No saved auto-checked {strandTitle} attempt is available for this learner yet.
            Choose one of these early pathway checks or open the full pathway below.
          </div>
          <NumberRevealStepList
            steps={starterSteps.filter(
              (step) => step.pathwayStepId !== currentStartStep?.pathwayStepId,
            )}
            learnerId={learnerId}
            returnPath={returnPath}
          />
        </section>
      )}
    </section>
  );
}

function DetailedMathematicsStageCard({
  strand,
  stage,
  stageIndex,
  currentStageIndex,
  unifiedPathwayStepStateIndex,
  selectedSubjectKey,
  selectedSubjectTitle,
  selectedLearnerId,
  returnPath,
  isOpen,
  onToggle,
  capturePathBase,
  assessPathBase,
  assessmentAttempts,
  worksheetFilter,
  densityMode,
  expandedStepId,
  onExpandedStepChange,
  regionalStageContext,
}: {
  strand: MathematicsDetailedStrandWorkspace;
  stage: MathematicsDetailedStrandStage;
  stageIndex: number;
  currentStageIndex: number;
  unifiedPathwayStepStateIndex: UnifiedPathwayStepStateIndex;
  selectedSubjectKey: PathwaySubjectKey;
  selectedSubjectTitle: string;
  selectedLearnerId: string;
  returnPath: string;
  isOpen: boolean;
  onToggle: () => void;
  capturePathBase: string;
  assessPathBase: string;
  assessmentAttempts: CleanAssessmentAttempt[];
  worksheetFilter: PathwayWorksheetFilter;
  densityMode: PathwayDensityMode;
  expandedStepId: string | null;
  onExpandedStepChange: (stepId: string | null) => void;
  regionalStageContext: string | null;
}) {
  const tone = getPathwayStageTone(stageIndex, currentStageIndex);
  const stageDisplayTitle = getRegionalStageLabel(
    stage.key,
    regionalStageContext,
    stage.title,
  );
  const panelId = `${strand.key}-stage-${stage.key}`;
  const summary = buildWorkspaceStageSummaryCounts(
    selectedSubjectKey,
    strand,
    stage,
    stageIndex,
    currentStageIndex,
    unifiedPathwayStepStateIndex,
  );
  const summaryChips = [
    {
      key: "steps",
      label: `${stage.steps.length} steps`,
      border: "#e2e8f0",
      background: "#ffffff",
      color: "#475569",
    },
    summary.secure > 0
      ? {
          key: "secure",
          label: `${summary.secure} secure`,
          border: "#bbf7d0",
          background: "#ecfdf5",
          color: "#166534",
        }
      : null,
    summary.readyToAssess > 0
      ? {
          key: "ready",
          label: `${summary.readyToAssess} ready to assess`,
          border: "#ddd6fe",
          background: "#f5f3ff",
          color: "#6d28d9",
        }
      : null,
    summary.evidenceStarted > 0
      ? {
          key: "evidence",
          label: `${summary.evidenceStarted} evidence started`,
          border: "#bfdbfe",
          background: "#eff6ff",
          color: "#1d4ed8",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    border: string;
    background: string;
    color: string;
  }>;
  const filteredSteps = stage.steps.filter((step) =>
    getStepPassesWorksheetFilter(
      getDetailedStepWorksheetResource({
        subjectKey: selectedSubjectKey,
        strand,
        stage,
        step,
      }),
      worksheetFilter,
    ),
  );

  return (
    <section
      style={{
        border: `1px solid ${isOpen ? tone.border : "#e2e8f0"}`,
        borderRadius: 12,
        background: "#ffffff",
        padding: 0,
        display: "grid",
        gap: 0,
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${isOpen ? "Collapse" : "Expand"} stage ${stageDisplayTitle}`}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          padding: "8px 10px",
          textAlign: "left",
          cursor: "pointer",
          display: "grid",
          gap: 6,
          outlineOffset: 3,
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
          <div style={{ display: "grid", gap: 4, maxWidth: 760 }}>
            <span
              style={{
                color: tone.text,
              fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {tone.badge}
            </span>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 16 }}>
              {stageDisplayTitle}
            </h3>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: tone.text,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span>{isOpen ? "Collapse stage" : "Expand stage"}</span>
            <span
              aria-hidden="true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 999,
                border: `1px solid ${tone.border}`,
                background: "#ffffff",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 140ms ease",
                boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
              }}
            >
              v
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          {isOpen ? (
            <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>{stage.helper}</div>
          ) : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {summaryChips.map((chip) => (
              <span
                key={chip.key}
                style={{
                  border: `1px solid ${chip.border}`,
                  background: chip.background,
                  color: chip.color,
                  borderRadius: 999,
                  padding: "4px 7px",
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1.3,
                }}
              >
                {chip.label}
              </span>
            ))}
            {worksheetFilter !== "all" ? (
              <span
                style={{
                  border: "1px solid #ccfbf1",
                  background: "#f0fdfa",
                  color: "#0f766e",
                  borderRadius: 999,
                  padding: "4px 7px",
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1.3,
                }}
              >
                {filteredSteps.length} shown
              </span>
            ) : null}
          </div>
        </div>
      </button>

      <div
        id={panelId}
        hidden={!isOpen}
        style={
          isOpen
            ? {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
                borderTop: "1px solid #e2e8f0",
                padding: 12,
              }
            : { display: "none" }
        }
      >
        {filteredSteps.length ? filteredSteps.map((step) => {
          const stepIndex = stage.steps.findIndex((candidate) => candidate.id === step.id);
          const detailPanelId = `pathway-step-${strand.key}-${stage.key}-${step.id}`;
          return (
          <DetailedMathematicsStepCard
            key={`${stage.key}-${step.id}`}
            strand={strand}
            stage={stage}
            stageIndex={stageIndex}
            currentStageIndex={currentStageIndex}
            step={step}
            stepIndex={stepIndex}
            unifiedPathwayStepStateIndex={unifiedPathwayStepStateIndex}
            selectedSubjectKey={selectedSubjectKey}
            selectedSubjectTitle={selectedSubjectTitle}
            selectedLearnerId={selectedLearnerId}
            returnPath={returnPath}
            capturePathBase={capturePathBase}
            assessPathBase={assessPathBase}
            assessmentAttempts={assessmentAttempts}
            isOpen={expandedStepId === detailPanelId || densityMode === "full"}
            onToggle={() =>
            onExpandedStepChange(expandedStepId === detailPanelId ? null : detailPanelId)
            }
            densityMode={densityMode}
          />
          );
        }) : (
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 0,
              background: "#ffffff",
              padding: 10,
              color: "#64748b",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            No steps match the current worksheet filter in this zone.
          </div>
        )}
      </div>
    </section>
  );
}

function DetailedMathematicsStepCard({
  strand,
  stage,
  stageIndex,
  currentStageIndex,
  step,
  stepIndex,
  unifiedPathwayStepStateIndex,
  selectedSubjectKey,
  selectedSubjectTitle,
  selectedLearnerId,
  returnPath,
  capturePathBase,
  assessPathBase,
  assessmentAttempts,
  isOpen,
  onToggle,
  densityMode,
}: {
  strand: MathematicsDetailedStrandWorkspace;
  stage: MathematicsDetailedStrandStage;
  stageIndex: number;
  currentStageIndex: number;
  step: MathematicsDetailedStrandStep;
  stepIndex: number;
  unifiedPathwayStepStateIndex: UnifiedPathwayStepStateIndex;
  selectedSubjectKey: PathwaySubjectKey;
  selectedSubjectTitle: string;
  selectedLearnerId: string;
  returnPath: string;
  capturePathBase: string;
  assessPathBase: string;
  assessmentAttempts: CleanAssessmentAttempt[];
  isOpen: boolean;
  onToggle: () => void;
  densityMode: PathwayDensityMode;
}) {
  const statusState = getWorkspaceDisplayedPathwayStatus(
    selectedSubjectKey,
    strand,
    stage,
    stageIndex,
    currentStageIndex,
    step,
    stepIndex,
    unifiedPathwayStepStateIndex,
  );
  const status = statusState.status;
  const meta = statusMeta[status];
  const exactStepContext = supportsExactStepPathwayContext(selectedSubjectKey, strand.key);
  const displayStepNumber =
    strand.stages
      .slice(0, stageIndex)
      .reduce((total, candidateStage) => total + candidateStage.steps.length, 0) +
    stepIndex +
    1;
  const detailPanelId = `pathway-step-${strand.key}-${stage.key}-${step.id}`;
  const stepUnifiedState = getUnifiedPathwayStepState(
    unifiedPathwayStepStateIndex,
    statusState.pathwayStepId,
  );
  const confidenceStatusLabel = stepUnifiedState?.assessmentConfidence || "Not saved";
  const statusChipMeta =
    exactStepContext && confidenceStatusLabel === "Not saved"
      ? statusMeta["Not started"]
      : meta;
  const evidenceLinkedCount = stepUnifiedState?.linkedEvidenceCount || 0;
  const canonicalStepKey = useMemo(
    () => buildPathwayRegistryStepKey(step.title, step.id),
    [step.id, step.title],
  );
  const numberAssessmentAlignment = useMemo(
    () =>
      isNumberPathwayContext(selectedSubjectKey, strand.key)
        ? getNumberAssessmentAlignmentForPathwayStep({
            subjectKey: selectedSubjectKey,
            strandKey: strand.key,
            stageKey: stage.key,
            pathwayStepId: statusState.pathwayStepId,
            stepKey: canonicalStepKey,
          })
        : null,
    [canonicalStepKey, selectedSubjectKey, stage.key, statusState.pathwayStepId, strand.key],
  );
  const numberAssessmentBank = numberAssessmentAlignment?.bank ?? null;
  const canonicalPathwayStepId = useMemo(
    () =>
      statusState.pathwayStepId ||
      resolveCanonicalPathwayStepIdFromParts({
        subjectKey: selectedSubjectKey,
        pathwayKey: strand.key,
        stageKey: stage.key,
        stepKey: canonicalStepKey,
        stepNumber: String(step.id),
      }),
    [
      canonicalStepKey,
      selectedSubjectKey,
      stage.key,
      statusState.pathwayStepId,
      step.id,
      strand.key,
    ],
  );
  const practiceActivity = useMemo(
    () =>
      canonicalPathwayStepId
        ? getPathwayPracticeActivityByStepId(canonicalPathwayStepId)
        : null,
    [canonicalPathwayStepId],
  );
  const exactStepAssessment = useMemo(
    () =>
      getStepAssessmentForPathwayStep({
        pathwayStepId: canonicalPathwayStepId,
        stepKey: canonicalStepKey,
        strandKey: strand.key,
      }),
    [canonicalPathwayStepId, canonicalStepKey, strand.key],
  );
  const exactStepPractice = useMemo(
    () =>
      getStepPracticeForPathwayStep({
        pathwayStepId: canonicalPathwayStepId,
        stepKey: canonicalStepKey,
        strandKey: strand.key,
      }),
    [canonicalPathwayStepId, canonicalStepKey, strand.key],
  );
  const worksheetResource = useMemo(
    () =>
      getWorksheetResourceForPathwayStep({
        pathwayStepId: canonicalPathwayStepId,
        stepKey: canonicalStepKey,
        subjectKey: selectedSubjectKey,
        strandKey: strand.key,
        stageKey: stage.key,
      }),
    [canonicalPathwayStepId, canonicalStepKey, selectedSubjectKey, stage.key, strand.key],
  );
  const captureHref = useMemo(() => {
    const params = buildPathwayCaptureSearchParams(
      {
        source: "my-pathways",
        subjectKey: selectedSubjectKey,
        subjectLabel: selectedSubjectTitle,
        pathwayKey: strand.key,
        pathwayLabel: strand.pathwayLabel,
        stageKey: stage.key,
        stageLabel: stage.title,
        pathwayStepId: canonicalPathwayStepId,
        stepKey: canonicalStepKey,
        stepNumber: String(step.id),
        stepTitle: step.title,
        stepMeaning: step.meaning,
        skillFocus: step.skillFocus,
      },
      {
        learnerId: selectedLearnerId || null,
        learningAreaKey: selectedSubjectKey,
        learningAreaLabel: selectedSubjectTitle,
      },
    );

    return `${capturePathBase}?${params.toString()}`;
  }, [
    canonicalPathwayStepId,
    canonicalStepKey,
    capturePathBase,
    selectedLearnerId,
    selectedSubjectKey,
    selectedSubjectTitle,
    strand.key,
    stage.key,
    stage.title,
    step.id,
    step.meaning,
    step.skillFocus,
    step.title,
    strand.pathwayLabel,
  ]);
  const assessHref = useMemo(() => {
    if (!canonicalPathwayStepId) {
      return assessPathBase;
    }

    const isNumberContext = isNumberPathwayContext(selectedSubjectKey, strand.key);
    const returnTo = buildPathwayStepReturnHref({
      pathname: returnPath,
      subjectKey: selectedSubjectKey,
      strandKey: strand.key,
      learnerId: selectedLearnerId,
      detailPanelId,
    });

    if (exactStepAssessment) {
        const params = new URLSearchParams();
        params.set("source", "my-pathways");
        params.set("stepAssessmentKey", exactStepAssessment.key);
        params.set("subjectKey", exactStepAssessment.subjectKey);
        params.set("strandKey", exactStepAssessment.strandKey);
        params.set("stageKey", exactStepAssessment.stageKey);
        params.set("pathwayStepId", canonicalPathwayStepId);
        params.set("stepKey", canonicalStepKey);
        params.set("returnTo", returnTo);
        params.set("progressionBandKey", exactStepAssessment.progressionBandKey);
        params.set("itemBankKey", exactStepAssessment.parentItemBankKey);
        if (selectedLearnerId) {
          params.set("learnerId", selectedLearnerId);
        }

        return `/assessments/number?${params.toString()}`;
    }

    if (isNumberContext) {
      return "";
    }

    const params = new URLSearchParams();
    params.set("source", "my-pathways");
    params.set("openStep", canonicalStepKey);
    params.set("subjectKey", selectedSubjectKey);
    params.set("strandKey", strand.key);
    params.set("stageKey", stage.key);
    params.set("pathwayStepId", canonicalPathwayStepId);
    params.set("stepKey", canonicalStepKey);
    params.set("returnTo", returnTo);

    if (selectedLearnerId) {
      params.set("learnerId", selectedLearnerId);
    }

    return `${assessPathBase}?${params.toString()}`;
  }, [
    assessPathBase,
    canonicalPathwayStepId,
    canonicalStepKey,
    detailPanelId,
    exactStepAssessment,
    returnPath,
    selectedLearnerId,
    selectedSubjectKey,
    stage.key,
    strand.key,
  ]);
  const exactPracticeHref = useMemo(() => {
    if (!exactStepPractice) return "";

    const params = new URLSearchParams();
    const pathwayStepId = canonicalPathwayStepId || exactStepPractice.pathwayStepId;
    params.set("source", "my-pathways");
    params.set("stepPracticeKey", exactStepPractice.key);
    params.set("subjectKey", exactStepPractice.subjectKey);
    params.set("strandKey", exactStepPractice.strandKey);
    params.set("stageKey", exactStepPractice.stageKey);
    params.set("pathwayStepId", pathwayStepId);
    params.set("stepKey", canonicalStepKey);
    params.set(
      "returnTo",
      buildPathwayStepReturnHref({
        pathname: returnPath,
        subjectKey: exactStepPractice.subjectKey,
        strandKey: exactStepPractice.strandKey,
        learnerId: selectedLearnerId,
        detailPanelId,
      }),
    );
    if (selectedLearnerId) {
      params.set("learnerId", selectedLearnerId);
    }

    return `/practice/number-targeted?${params.toString()}`;
  }, [
    canonicalPathwayStepId,
    canonicalStepKey,
    detailPanelId,
    exactStepPractice,
    returnPath,
    selectedLearnerId,
  ]);
  const autoCheckStatus = useMemo(
    () =>
      numberAssessmentAlignment
        ? getAutoCheckStatusForPathwayStep(assessmentAttempts, numberAssessmentAlignment)
        : exactStepAssessment
          ? getExactStepAutoCheckStatusForPathwayStep(assessmentAttempts, {
              subjectKey: exactStepAssessment.subjectKey,
              strandKey: exactStepAssessment.strandKey,
              pathwayStepId: exactStepAssessment.pathwayStepId,
              stepKey: exactStepAssessment.stepKey,
              stepAssessmentKey: exactStepAssessment.key,
            })
          : {
              status: "Not checked yet" as const,
              attempt: null,
              scope: "none" as const,
            },
    [assessmentAttempts, exactStepAssessment, numberAssessmentAlignment],
  );
  const worksheetStatus = worksheetResource ? "Worksheet attached" : "Worksheet missing";
  const worksheetFileName = worksheetResource?.fileName || "";

  return (
    <article
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        background: "#ffffff",
        padding: densityMode === "compact" ? 8 : 12,
        display: "grid",
        gap: densityMode === "compact" ? 6 : 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 4, maxWidth: 760, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                border: "1px solid #dbeafe",
                background: "#eff6ff",
                color: "#1d4ed8",
                borderRadius: 999,
                padding: "2px 7px",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              Step {displayStepNumber}
            </span>
            <strong style={{ color: "#0f172a", fontSize: 13, lineHeight: 1.25 }}>
              {step.title}
            </strong>
          </div>
          {isOpen ? (
            <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45 }}>{step.meaning}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div
              title={
                exactStepContext
                  ? `Saved confidence is ${confidenceStatusLabel}.`
                  : meta.helper
              }
              style={{
                border: `1px solid ${statusChipMeta.border}`,
                borderRadius: 999,
                background: statusChipMeta.fill,
                padding: "4px 7px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: statusChipMeta.dot,
                  flexShrink: 0,
                }}
              />
              <strong style={{ color: statusChipMeta.text, fontSize: 12 }}>
                {exactStepContext && confidenceStatusLabel !== "Not saved"
                  ? confidenceStatusLabel
                  : status}
              </strong>
            </div>

            <div
              style={{
                border: `1px solid ${worksheetResource ? "#bbf7d0" : "#e2e8f0"}`,
                borderRadius: 999,
                background: worksheetResource ? "#f0fdf4" : "#f8fafc",
                color: worksheetResource ? "#166534" : "#64748b",
                padding: "4px 7px",
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.3,
              }}
              title={worksheetFileName || "No mapped worksheet PDF for this step yet."}
            >
              {worksheetStatus}
            </div>

          {evidenceLinkedCount > 0 ? (
            <span
              style={{
                border: "1px solid #bfdbfe",
                borderRadius: 999,
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "4px 7px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {evidenceLinkedCount} evidence
            </span>
          ) : null}

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={detailPanelId}
            style={{
              border: "1px solid #dbeafe",
              background: "#ffffff",
              color: "#1d4ed8",
              borderRadius: 999,
              padding: "4px 7px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{isOpen ? "Hide details" : "Details"}</span>
            <span
              aria-hidden="true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                height: 18,
                borderRadius: 999,
                border: "1px solid #dbeafe",
                background: "#eff6ff",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 140ms ease",
                fontSize: 11,
              }}
            >
              v
            </span>
          </button>
        </div>
      </div>

      <CleanPathwayStepActionRow
        activity={
          exactStepContext
            ? null
            : practiceActivity
        }
        assessHref={assessHref}
        captureHref={captureHref}
        practiceHref={exactPracticeHref}
        practiceTitle={exactStepPractice?.title ?? null}
        assessmentBankTitle={
          exactStepAssessment
            ? numberAssessmentBank?.title ?? exactStepAssessment.parentBankTitle
            : null
        }
        exactAssessmentTitle={exactStepAssessment?.title ?? null}
        autoCheckStatusLabel={
          exactStepAssessment ? autoCheckStatus.status : null
        }
        autoCheckStatusScope={
          exactStepAssessment && autoCheckStatus.scope !== "none"
            ? autoCheckStatus.scope
            : null
        }
        confidenceStatusLabel={confidenceStatusLabel}
        isExactStepContext={exactStepContext}
        noAssessmentMessage={
          exactStepContext && !exactStepAssessment
            ? "Exact assessment is coming next for this step."
            : null
        }
        worksheetResource={worksheetResource}
      />

      <div
        id={detailPanelId}
        hidden={!isOpen}
        style={
          isOpen
            ? {
                border: "1px solid #dbeafe",
                borderRadius: 14,
                background: "#f8fbff",
                padding: 10,
                display: "grid",
                gap: 10,
              }
            : { display: "none" }
        }
      >
        <PathwayStepGuidanceSection title="What this means" content={step.meaning} />
        <PathwayStepGuidanceSection title="Skill being developed" content={step.skillFocus} />
        <PathwayStepGuidanceSection title="Learning intention" content={step.learningIntention} />
        <PathwayStepGuidanceListSection title="Success looks like" items={step.successCriteria} />
        <PathwayStepGuidanceSection title="Try this activity" content={step.practiceActivity} />
        <PathwayStepGuidanceListSection
          title="Evidence you could capture"
          items={step.evidenceExamples}
        />
        <PathwayStepGuidanceSection
          title="Assessment check later"
          content={step.assessmentCheck}
        />
      </div>
    </article>
  );
}

function PathwayComingLaterStrandSection({
  domain,
}: {
  domain: SubjectStrandCard;
}) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 8, maxWidth: 820 }}>
          <div style={eyebrowStyle}>Selected strand</div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>{domain.title}</h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>{domain.description}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#64748b",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Coming later
            </span>
            <span style={{ color: "#64748b", fontSize: 13 }}>
              This strand workspace is being developed.
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, flex: "1 1 240px", minWidth: 0 }}>
          <div style={eyebrowStyle}>Why it matters</div>
          <div style={{ color: "#475569", lineHeight: 1.6 }}>{domain.whyItMatters}</div>
        </div>
      </div>

      <section style={helperCardStyle}>
        <strong style={{ color: "#0f172a" }}>This strand workspace is being developed.</strong>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
          The strand stays visible in the map so families can see what is coming next in
          this subject without the page turning into a long curriculum archive.
        </p>
      </section>
    </div>
  );
}

function PathwayStepGuidanceSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section style={{ display: "grid", gap: 6 }}>
      <div style={{ ...eyebrowStyle, color: "#1d4ed8" }}>{title}</div>
      <div style={{ color: "#475569", lineHeight: 1.5 }}>{content}</div>
    </section>
  );
}

function PathwayStepGuidanceListSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <div style={{ ...eyebrowStyle, color: "#1d4ed8" }}>{title}</div>
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          color: "#475569",
          lineHeight: 1.5,
          display: "grid",
          gap: 6,
        }}
      >
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function CleanPathwaysWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <PathwaysWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
