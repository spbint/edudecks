"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import { CleanFeedbackPrompt } from "@/app/components/clean/CleanPersonalisationCards";
import CleanPathwayStepActionRow from "@/app/components/clean/CleanPathwayStepActionRow";
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
  type NumberAutoCheckStatus,
  type NumberPathwayEvidenceStatusOverride,
  type NumberPathwayRevealGroups,
  type NumberPathwayRevealStep,
} from "@/lib/clean/assessments/numberPathwayAssessmentAlignment";
import {
  getStepAssessmentForPathwayStep,
} from "@/lib/clean/assessments/stepAssessmentRegistry";
import {
  getStepPracticeForPathwayStep,
} from "@/lib/clean/practice/stepPracticeRegistry";
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
  getAllPathwaySteps,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  getPathwayPracticeActivityByStepId,
} from "@/lib/clean/pathways/practiceActivities";
import { getWorksheetResourceForPathwayStep } from "@/lib/clean/resources/mathWorksheetResources";
import { supabase } from "@/lib/supabaseClient";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
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
import {
  readPathwayPlacement,
  savePathwayPlacement,
  type PathwayPlacementMethod,
} from "@/lib/clean/pathways/pathwayPlacement";
import type {
  MathematicsDetailedStrandStage,
  MathematicsDetailedStrandStep,
  MathematicsDetailedStrandWorkspace,
} from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

const shellStyle: React.CSSProperties = {
  minHeight: "auto",
  background: "transparent",
  padding: 0,
  boxSizing: "border-box",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1240,
  margin: "0 auto",
  display: "grid",
  gap: 18,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 20,
  background: "#ffffff",
  padding: "clamp(16px, 3vw, 24px)",
  boxShadow: "0 8px 24px rgba(23,32,75,0.06)",
};

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 16,
  background: "#ffffff",
  padding: 14,
  display: "grid",
  gap: 8,
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 16,
  background: "#F2EDFF",
  padding: 14,
  display: "grid",
  gap: 8,
};

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 16,
  background: "#ffffff",
  padding: 14,
  display: "grid",
  gap: 8,
  boxShadow: "0 8px 24px rgba(23,32,75,0.045)",
};

const curriculumChipStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 999,
  background: "#ffffff",
  color: "#17204B",
  padding: "7px 11px",
  fontSize: 13,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const EMPTY_STRAND_CARD: SubjectStrandCard = {
  key: "selected-strand",
  title: "Selected strand",
  description: "Choose a strand to open the detailed pathway workspace.",
  whyItMatters: "Detailed strand guidance will appear here when a populated strand is selected.",
  status: "coming-later",
};

const PATHWAYS_UI_STORAGE_KEY = "mylearna:clean-pathways-ui:v2";
const PATHWAYS_INTERACTION_STORAGE_KEY = "mylearna:clean-pathways-interaction:v1";

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
  border: "1px solid #6C4DF6",
  background: "#6C4DF6",
  color: "#ffffff",
  borderRadius: 14,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  minHeight: 44,
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #E7EAF2",
  background: "#ffffff",
  color: "#17204B",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  color: "#6C4DF6",
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

const worksheetEvidenceProgressMeta: Record<
  string,
  { label: string; fill: string; border: string; text: string; dot: string; helper: string }
> = {
  "needs support": {
    label: "Needs support",
    fill: "#fff1f2",
    border: "#fecdd3",
    text: "#be123c",
    dot: "#fb7185",
    helper: "Worksheet evidence saved. This step still needs support.",
  },
  "working towards": {
    label: "Working towards",
    fill: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    dot: "#fb923c",
    helper: "Worksheet evidence saved. This step is developing.",
  },
  consolidating: {
    label: "Consolidating",
    fill: "#fffbeb",
    border: "#fde68a",
    text: "#92400e",
    dot: "#f59e0b",
    helper: "Worksheet evidence saved. This step is close to secure.",
  },
  "goal achieved": {
    label: "Goal achieved",
    fill: "#ecfdf5",
    border: "#bbf7d0",
    text: "#166534",
    dot: "#22c55e",
    helper: "Worksheet evidence saved. This step is achieved.",
  },
  "goal achieved + extension": {
    label: "Goal achieved + extension",
    fill: "#eef2ff",
    border: "#c7d2fe",
    text: "#3730a3",
    dot: "#6366f1",
    helper: "Worksheet evidence saved with extension.",
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

function getWorksheetEvidenceProgressLabel(entry: CleanEvidenceEntry | null | undefined) {
  const text = `${entry?.whatHappened || ""}\n${entry?.reflection || ""}`;
  const match = text.match(/Progress level:\s*([^\n.]+)/i);
  return match?.[1]?.trim() || null;
}

function getWorksheetEvidenceProgressMeta(entry: CleanEvidenceEntry | null | undefined) {
  const label = getWorksheetEvidenceProgressLabel(entry);
  if (!label) return null;
  return worksheetEvidenceProgressMeta[label.toLowerCase()] ?? null;
}

function getNumberAutoCheckStatusFromEvidence(
  progress: PathwayProgressStatus | null | undefined,
  progressLabel: string | null | undefined,
): NumberAutoCheckStatus | null {
  const normalizedLabel = String(progressLabel ?? "").trim().toLowerCase();

  if (normalizedLabel === "needs support") {
    return "Needs support";
  }

  if (normalizedLabel === "working towards") {
    return "Developing";
  }

  if (normalizedLabel === "consolidating") {
    return "Consolidating";
  }

  if (normalizedLabel === "goal achieved" || normalizedLabel === "goal achieved + extension") {
    return "Secure";
  }

  if (progress === "Secure") {
    return "Secure";
  }

  if (progress === "Evidence started" || progress === "Practising") {
    return "Developing";
  }

  return null;
}

function formatWorksheetEvidenceDate(entry: CleanEvidenceEntry | null | undefined) {
  const value = entry?.observedOn || entry?.createdAt || "";
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10) || null;

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function getPathwayInteractionKey(
  learnerId: string,
  subjectKey: PathwaySubjectKey,
  strandKey: string,
) {
  return [learnerId, subjectKey, strandKey].map((value) => String(value ?? "").trim()).join("::");
}

function readPathwayInteractionStarted(
  learnerId: string,
  subjectKey: PathwaySubjectKey,
  strandKey: string,
) {
  if (typeof window === "undefined") return false;
  const key = getPathwayInteractionKey(learnerId, subjectKey, strandKey);
  if (!key.replace(/:/g, "")) return false;

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(PATHWAYS_INTERACTION_STORAGE_KEY) || "{}",
    );
    return Boolean(parsed && typeof parsed === "object" && parsed[key]);
  } catch {
    return false;
  }
}

function writePathwayInteractionStarted(
  learnerId: string,
  subjectKey: PathwaySubjectKey,
  strandKey: string,
) {
  if (typeof window === "undefined") return;
  const key = getPathwayInteractionKey(learnerId, subjectKey, strandKey);
  if (!key.replace(/:/g, "")) return;

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(PATHWAYS_INTERACTION_STORAGE_KEY) || "{}",
    );
    window.localStorage.setItem(
      PATHWAYS_INTERACTION_STORAGE_KEY,
      JSON.stringify({
        ...(parsed && typeof parsed === "object" ? parsed : {}),
        [key]: new Date().toISOString(),
      }),
    );
  } catch {
    window.localStorage.setItem(
      PATHWAYS_INTERACTION_STORAGE_KEY,
      JSON.stringify({ [key]: new Date().toISOString() }),
    );
  }
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

function appendWorksheetEvidenceCaptureParams(
  href: string,
  worksheetResource: NonNullable<ReturnType<typeof getWorksheetResourceForPathwayStep>>,
  returnTo: string,
) {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("worksheetEvidence", "1");
  params.set("evidenceSource", "worksheet_evidence");
  params.set("worksheetId", worksheetResource.fileName);
  params.set("worksheetTitle", worksheetResource.title);
  params.set("worksheetHref", worksheetResource.href);
  params.set("worksheetFileName", worksheetResource.fileName);
  params.set("includeInPortfolio", "1");
  params.set("includeInReport", "1");
  params.set("returnTo", returnTo);
  return `${path}?${params.toString()}`;
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
  const latestEvidenceIdFromQuery = searchParams.get("latestEvidenceId") || "";
  const sourceFromQuery = searchParams.get("source") || "";
  const showPathwayEvidenceUpdatedBanner =
    Boolean(latestEvidenceIdFromQuery) && sourceFromQuery === "my-capture";
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
  const [pathwayInteractionVersion, setPathwayInteractionVersion] = useState(0);
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

  const reloadUnifiedPathwayStepState = useCallback(async () => {
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

      setUnifiedPathwayStepStateIndex(
        buildUnifiedPathwayStepStateIndex({
          evidenceEntries,
          assessmentStatuses,
        }),
      );
    } catch {
      setUnifiedPathwayStepStateIndex(new Map());
    }
  }, [
    selectedLearnerId,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => {
      if (active) {
        void reloadUnifiedPathwayStepState();
      }
    });

    return () => {
      active = false;
    };
  }, [reloadUnifiedPathwayStepState]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void reloadUnifiedPathwayStepState();
      }
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [reloadUnifiedPathwayStepState]);

  useEffect(() => {
    if (!workspace.profile || !selectedLearnerId) return;

    const channel = supabase
      .channel(`pathway-evidence-${workspace.profile.id}-${selectedLearnerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "evidence_entries",
          filter: `learner_id=eq.${selectedLearnerId}`,
        },
        () => {
          void reloadUnifiedPathwayStepState();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reloadUnifiedPathwayStepState, selectedLearnerId, workspace.profile]);

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

    const evidenceStatusByPathwayStepId = new Map<string, NumberPathwayEvidenceStatusOverride>();
    orderedSteps.forEach((step) => {
      const stepState = getUnifiedPathwayStepState(unifiedPathwayStepStateIndex, step.pathwayStepId);
      const evidenceStatus = getNumberAutoCheckStatusFromEvidence(
        stepState?.pathwayProgressFromEvidence,
        stepState?.latestEvidenceProgressLevel,
      );
      if (evidenceStatus) {
        evidenceStatusByPathwayStepId.set(step.pathwayStepId, {
          status: evidenceStatus,
          updatedAt: stepState?.latestEvidenceStatusAt || 0,
        });
      }
    });

    return getNumberPathwayRevealGroups(orderedSteps, assessmentAttempts, {
      subjectKey: selectedSubjectKey,
      strandKey: selectedSubjectWorkspace.key,
      evidenceStatusByPathwayStepId,
    });
  }, [
    assessmentAttempts,
    regionalStageContext,
    selectedSubjectKey,
    selectedSubjectWorkspace,
    unifiedPathwayStepStateIndex,
  ]);
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
    ? "Assess understanding"
    : selectedWorkspaceSnapshot?.practising || selectedWorkspaceSnapshot?.evidenceStarted
      ? "Practise"
      : "Open the current focus";
  const selectedSubjectSummaryTitle = selectedSubjectSupportsDetailedPathways
    ? selectedSubjectWorkspace?.title ||
      selectedSubjectDomain.title ||
      `${selectedSubject.title} pathways`
    : `${selectedSubject.title} pathways`;
  const selectedSubjectSummaryHelper = selectedSubjectSupportsDetailedPathways
    ? `Current focus: ${currentLearningZoneStageTitle}.`
    : selectedSubject.guidance;
  const selectedSubjectStatusLabel = selectedSubjectSupportsDetailedPathways
    ? "View details"
    : "Coming gradually";
  const topSnapshotTitle = selectedStrandIsActive
    ? selectedSubjectSummaryTitle
    : "Choose a pathway strand below";
  const topSnapshotStageLabel = selectedStrandIsActive
    ? currentLearningZoneStageTitle
    : "Select a strand to see the current pathway";
  const topSnapshotStagePrefix = selectedStrandIsActive
    ? "Focus: "
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
  const pathwaysPathBase = pathname.startsWith("/clean-my-pathways")
    ? "/clean-my-pathways"
    : "/my-pathways";
  const placementPathBase = `${pathwaysPathBase}/placement`;
  const requestedPathwayStepId = searchParams.get("pathwayStepId") || "";
  const selectedPlacement = useMemo(() => {
    if (!selectedLearner || !selectedStrandKey) return null;
    return readPathwayPlacement(
      selectedLearner.id,
      selectedSubjectKey,
      selectedStrandKey,
    );
  }, [selectedLearner, selectedStrandKey, selectedSubjectKey]);
  const selectedPlacementStep = useMemo(() => {
    let focusStepId =
      requestedPathwayStepId ||
      selectedPlacement?.pathwayStepId ||
      currentLearningZoneStartStep?.pathwayStepId ||
      "";
    if (
      !requestedPathwayStepId &&
      selectedPlacement?.pathwayStepId &&
      currentLearningZoneStartStep?.pathwayStepId &&
      selectedPlacement.pathwayStepId !== currentLearningZoneStartStep.pathwayStepId
    ) {
      const placedStepState = getUnifiedPathwayStepState(
        unifiedPathwayStepStateIndex,
        selectedPlacement.pathwayStepId,
      );
      const placedEvidenceStatus = getNumberAutoCheckStatusFromEvidence(
        placedStepState?.pathwayProgressFromEvidence,
        placedStepState?.latestEvidenceProgressLevel,
      );
      if (placedEvidenceStatus === "Secure") {
        focusStepId = currentLearningZoneStartStep.pathwayStepId;
      }
    }
    if (!focusStepId) return null;
    return getAllPathwaySteps().find((step) => step.id === focusStepId) || null;
  }, [
    currentLearningZoneStartStep,
    requestedPathwayStepId,
    selectedPlacement,
    unifiedPathwayStepStateIndex,
  ]);
  const selectedPlacementStrandSteps = useMemo(
    () =>
      selectedPlacementStep
        ? getAllPathwaySteps().filter(
            (step) =>
              step.subjectKey === selectedPlacementStep.subjectKey &&
              step.strandKey === selectedPlacementStep.strandKey,
          )
        : [],
    [selectedPlacementStep],
  );
  const selectedPlacementStepIndex = selectedPlacementStep
    ? selectedPlacementStrandSteps.findIndex((step) => step.id === selectedPlacementStep.id)
    : -1;
  const previousPlacementStep =
    selectedPlacementStepIndex > 0
      ? selectedPlacementStrandSteps[selectedPlacementStepIndex - 1]
      : null;
  const nextPlacementStep =
    selectedPlacementStepIndex >= 0 &&
    selectedPlacementStepIndex < selectedPlacementStrandSteps.length - 1
      ? selectedPlacementStrandSteps[selectedPlacementStepIndex + 1]
      : null;
  const placementEntryHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedLearnerId) {
      params.set("learnerId", selectedLearnerId);
    }
    params.set("subjectKey", selectedSubjectKey);
    if (selectedStrandKey) {
      params.set("strandKey", selectedStrandKey);
    }
    return `${placementPathBase}?${params.toString()}`;
  }, [placementPathBase, selectedLearnerId, selectedStrandKey, selectedSubjectKey]);
  const manualPlacementEntryHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedLearnerId) {
      params.set("learnerId", selectedLearnerId);
    }
    params.set("subjectKey", selectedSubjectKey);
    if (selectedStrandKey) {
      params.set("strandKey", selectedStrandKey);
    }
    params.set("mode", "manual");
    return `${placementPathBase}?${params.toString()}`;
  }, [placementPathBase, selectedLearnerId, selectedStrandKey, selectedSubjectKey]);
  const selectedPlacementReturnHref = selectedPlacementStep
    ? buildPathwayStepReturnHref({
        pathname,
        subjectKey: selectedPlacementStep.subjectKey,
        strandKey: selectedPlacementStep.strandKey,
        learnerId: selectedLearnerId,
        detailPanelId: `pathway-step-${selectedPlacementStep.strandKey}-${selectedPlacementStep.stageKey}-${selectedPlacementStep.stepKey}`,
      })
    : pathname;
  const selectedPlacementPractice = selectedPlacementStep
    ? getStepPracticeForPathwayStep({
        pathwayStepId: selectedPlacementStep.id,
        stepKey: selectedPlacementStep.stepKey,
        strandKey: selectedPlacementStep.strandKey,
      })
    : null;
  const selectedPlacementAssessment = selectedPlacementStep
    ? getStepAssessmentForPathwayStep({
        pathwayStepId: selectedPlacementStep.id,
        stepKey: selectedPlacementStep.stepKey,
        strandKey: selectedPlacementStep.strandKey,
      })
    : null;
  const selectedPlacementWorksheet = selectedPlacementStep
    ? getWorksheetResourceForPathwayStep({
        pathwayStepId: selectedPlacementStep.id,
        stepKey: selectedPlacementStep.stepKey,
        subjectKey: selectedPlacementStep.subjectKey,
        strandKey: selectedPlacementStep.strandKey,
        stageKey: selectedPlacementStep.stageKey,
      })
    : null;
  const selectedPlacementStageTitle =
    selectedPlacementWorksheet?.stageDisplay ||
    selectedPlacementStep?.stageTitle ||
    selectedWorkspaceCurrentStageTitle;
  const selectedPlacementUnifiedState = selectedPlacementStep
    ? getUnifiedPathwayStepState(unifiedPathwayStepStateIndex, selectedPlacementStep.id)
    : null;
  const selectedPlacementLatestEvidenceEntry =
    selectedPlacementUnifiedState?.latestEvidenceEntry ?? null;
  const selectedPlacementEvidenceProgressMeta =
    selectedPlacementUnifiedState?.latestStatusSource === "evidence"
      ? getWorksheetEvidenceProgressMeta(selectedPlacementLatestEvidenceEntry)
      : null;
  const selectedPlacementHasEvidenceAttachment =
    Boolean(selectedPlacementLatestEvidenceEntry?.imageUrl) ||
    Boolean(selectedPlacementLatestEvidenceEntry?.attachmentUrls.length);
  const selectedPlacementEvidenceDate = formatWorksheetEvidenceDate(
    selectedPlacementLatestEvidenceEntry,
  );
  const selectedPlacementWorksheetEvidenceHref = useMemo(() => {
    if (!selectedPlacementStep || !selectedPlacementWorksheet) return "";

    const params = buildPathwayCaptureSearchParams(
      {
        source: "my-pathways",
        subjectKey: selectedPlacementStep.subjectKey,
        subjectLabel: selectedSubject.title,
        pathwayKey: selectedPlacementStep.strandKey,
        pathwayLabel: selectedSubjectWorkspace?.title || selectedPlacementStep.strandKey,
        stageKey: selectedPlacementStep.stageKey,
        stageLabel: selectedPlacementStageTitle,
        pathwayStepId: selectedPlacementStep.id,
        stepKey: selectedPlacementStep.stepKey,
        stepNumber: String(selectedPlacementStep.legacyStepNumber || selectedPlacementStep.stepOrder || selectedPlacementStep.stepKey),
        stepTitle: selectedPlacementStep.stepTitle,
        stepMeaning: selectedPlacementStep.stepDescription,
        skillFocus: selectedPlacementStep.stepTitle,
      },
      {
        learnerId: selectedLearnerId || null,
        learningAreaKey: selectedPlacementStep.subjectKey,
        learningAreaLabel: selectedSubject.title,
      },
    );

    return appendWorksheetEvidenceCaptureParams(
      `${capturePathBase}?${params.toString()}`,
      selectedPlacementWorksheet,
      selectedPlacementReturnHref,
    );
  }, [
    capturePathBase,
    selectedLearnerId,
    selectedPlacementReturnHref,
    selectedPlacementStep,
    selectedPlacementStageTitle,
    selectedPlacementWorksheet,
    selectedSubject.title,
    selectedSubjectWorkspace?.title,
  ]);
  const selectedPlacementHasInteraction =
    selectedPlacementStep && selectedLearner
      ? readPathwayInteractionStarted(
          selectedLearner.id,
          selectedPlacementStep.subjectKey,
          selectedPlacementStep.strandKey,
        ) || pathwayInteractionVersion > 0
      : false;
  const selectedPlacementPracticeHref = selectedPlacementPractice
    ? (() => {
        const params = new URLSearchParams();
        params.set("stepPracticeKey", selectedPlacementPractice.key);
        params.set("subjectKey", selectedPlacementPractice.subjectKey);
        params.set("strandKey", selectedPlacementPractice.strandKey);
        params.set("stageKey", selectedPlacementPractice.stageKey);
        params.set("pathwayStepId", selectedPlacementPractice.pathwayStepId);
        params.set("stepKey", selectedPlacementStep?.stepKey || selectedPlacementPractice.stepKey);
        params.set("returnTo", selectedPlacementReturnHref);
        if (selectedLearnerId) params.set("learnerId", selectedLearnerId);
        return `/practice/number-targeted?${params.toString()}`;
      })()
    : "";
  const selectedPlacementAssessmentHref = selectedPlacementAssessment
    ? (() => {
        const params = new URLSearchParams();
        params.set("source", "my-pathways");
        params.set("stepAssessmentKey", selectedPlacementAssessment.key);
        params.set("subjectKey", selectedPlacementAssessment.subjectKey);
        params.set("strandKey", selectedPlacementAssessment.strandKey);
        params.set("stageKey", selectedPlacementAssessment.stageKey);
        params.set("pathwayStepId", selectedPlacementAssessment.pathwayStepId);
        params.set("stepKey", selectedPlacementStep?.stepKey || selectedPlacementAssessment.stepKey);
        params.set("returnTo", selectedPlacementReturnHref);
        params.set("progressionBandKey", selectedPlacementAssessment.progressionBandKey);
        params.set("itemBankKey", selectedPlacementAssessment.parentItemBankKey);
        if (selectedLearnerId) params.set("learnerId", selectedLearnerId);
        return `/assessments/number?${params.toString()}`;
      })()
    : "";

  function updateCurrentPathwayStep(
    nextStep: typeof selectedPlacementStep,
    method: PathwayPlacementMethod,
  ) {
    if (!nextStep || !selectedLearner) return;
    writePathwayInteractionStarted(
      selectedLearner.id,
      nextStep.subjectKey,
      nextStep.strandKey,
    );
    setPathwayInteractionVersion((current) => current + 1);

    savePathwayPlacement({
      learnerId: selectedLearner.id,
      subjectKey: nextStep.subjectKey,
      strandKey: nextStep.strandKey,
      pathwayStepId: nextStep.id,
      method,
    });

    const params = new URLSearchParams(searchParams.toString());
    params.set("learnerId", selectedLearner.id);
    params.set("subjectKey", nextStep.subjectKey);
    params.set("strandKey", nextStep.strandKey);
    params.set("pathwayStepId", nextStep.id);
    params.set("placement", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function scrollToCurrentStepPanel() {
    if (selectedPlacementStep && selectedLearner) {
      writePathwayInteractionStarted(
        selectedLearner.id,
        selectedPlacementStep.subjectKey,
        selectedPlacementStep.strandKey,
      );
      setPathwayInteractionVersion((current) => current + 1);
    }
    const workspaceEl = pathwayDetailWorkspaceRef.current;
    if (!workspaceEl) return;
    workspaceEl.scrollIntoView({ behavior: "smooth", block: "start" });
    workspaceEl.focus({ preventScroll: true });
  }

  function markSelectedPathwayInteraction() {
    if (!selectedPlacementStep || !selectedLearner) return;
    writePathwayInteractionStarted(
      selectedLearner.id,
      selectedPlacementStep.subjectKey,
      selectedPlacementStep.strandKey,
    );
    setPathwayInteractionVersion((current) => current + 1);
  }

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

        .mylearna-pathway-guidance-mobile {
          display: none;
        }

        @media (max-width: 720px) {
          .mylearna-pathway-return-banner {
            align-items: flex-start !important;
          }

          .mylearna-pathway-step-card {
            padding: 10px !important;
            gap: 8px !important;
            border-radius: 14px !important;
          }

          .mylearna-pathway-step-card-header,
          .mylearna-pathway-step-status-row {
            align-items: flex-start !important;
            justify-content: flex-start !important;
          }

          .mylearna-pathway-step-title-block > div:nth-child(2) {
            display: none !important;
          }

          .mylearna-pathway-step-status-row {
            width: 100% !important;
          }

          .mylearna-pathway-step-status-row > * {
            min-height: 34px !important;
          }

          .mylearna-worksheet-action-card {
            padding: 12px !important;
            gap: 10px !important;
            box-shadow: none !important;
          }

          .mylearna-worksheet-action-copy span:last-child {
            display: none !important;
          }

          .mylearna-worksheet-action-buttons {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .mylearna-worksheet-action-buttons > a,
          .mylearna-worksheet-action-buttons > button {
            width: 100% !important;
            min-height: 46px !important;
          }

          .mylearna-pathway-guidance-desktop {
            display: none !important;
          }

          .mylearna-pathway-guidance-mobile {
            display: block !important;
            grid-column: 1 / -1;
          }

          .mylearna-pathway-guidance-mobile > summary {
            min-height: 42px;
            cursor: pointer;
            color: #1d4ed8;
            font-size: 14px;
            font-weight: 800;
          }
        }
      `}</style>
      <div style={wrapStyle}>
        <section
          data-guidance-id="pathways-current-step"
          style={{
            ...cardStyle,
            padding: "clamp(20px, 3vw, 30px)",
            border: selectedPlacementEvidenceProgressMeta
              ? `1px solid ${selectedPlacementEvidenceProgressMeta.border}`
              : selectedPlacementStep
              ? "1px solid #D9D0FF"
              : cardStyle.border,
            background: selectedPlacementEvidenceProgressMeta
              ? selectedPlacementEvidenceProgressMeta.fill
              : selectedPlacementStep
              ? "linear-gradient(135deg, #FFFFFF 0%, #F7F3FF 100%)"
              : "#ffffff",
            boxShadow: selectedPlacementEvidenceProgressMeta
              ? "0 14px 34px rgba(23,32,75,0.08)"
              : selectedPlacementStep
              ? "0 14px 34px rgba(108,77,246,0.10)"
              : cardStyle.boxShadow,
          }}
        >
          {!selectedLearner ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>Pathway starting point</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                Choose a learner to begin
              </h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Add or choose a learner before finding a pathway starting point.
              </p>
              <div>
                <Link href="/my-profile" style={secondaryButtonStyle}>
                  Open My Profile
                </Link>
              </div>
            </div>
          ) : selectedPlacementStep ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ ...eyebrowStyle, textTransform: "none", letterSpacing: 0 }}>
                  What should we do next?
                </div>
                <h1 style={{ margin: 0, color: "#17204B", fontSize: "clamp(26px, 4vw, 32px)", lineHeight: 1.1, fontWeight: 650 }}>
                  My Pathways
                </h1>
                <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.5, maxWidth: 760 }}>
                  Choose the next skill, practise with support, then check understanding.
                </p>
              </div>
              <div
                aria-label="Curriculum context"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ ...curriculumChipStyle, color: "#6C4DF6", background: "#F2EDFF", borderColor: "#D9D0FF" }}>
                  {selectedPlacementStep.subjectTitle || selectedSubject.title}
                </span>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>/</span>
                <span style={curriculumChipStyle}>
                  {selectedPlacementStep.strandTitle || selectedSubjectWorkspace?.title || "Selected strand"}
                </span>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>/</span>
                <span style={curriculumChipStyle}>
                  {selectedPlacementStageTitle}
                </span>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>/</span>
                <span style={{ ...curriculumChipStyle, color: "#5B6478" }}>
                  Step {selectedPlacementStep.legacyStepNumber || selectedPlacementStep.stepOrder || selectedPlacementStep.stepKey}
                </span>
              </div>
              <div
                style={{
                  border: "1px solid #D9D0FF",
                  borderRadius: 22,
                  background: "linear-gradient(145deg, #FFFFFF 0%, #F2EDFF 100%)",
                  padding: "clamp(18px, 3vw, 26px)",
                  display: "grid",
                  gap: 14,
                  boxShadow: "0 14px 34px rgba(108,77,246,0.10)",
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ ...curriculumChipStyle, borderColor: "#D9D0FF", background: "#ffffff", color: "#6C4DF6" }}>
                    Current step
                  </span>
                  <span style={{ ...curriculumChipStyle, color: "#5B6478" }}>
                    {topSnapshotNextAction}
                  </span>
                  {selectedPlacementEvidenceProgressMeta ? (
                    <span
                      style={{
                        ...curriculumChipStyle,
                        borderColor: selectedPlacementEvidenceProgressMeta.border,
                        background: "#ffffff",
                        color: selectedPlacementEvidenceProgressMeta.text,
                      }}
                    >
                      {selectedPlacementEvidenceProgressMeta.label}
                    </span>
                  ) : null}
                  {selectedPlacementUnifiedState?.linkedEvidenceCount ? (
                    <span
                      style={{
                        ...curriculumChipStyle,
                        borderColor: selectedPlacementEvidenceProgressMeta?.border || "#bfdbfe",
                        background: "#ffffff",
                        color: selectedPlacementEvidenceProgressMeta?.text || "#1d4ed8",
                      }}
                    >
                      Evidence attached
                    </span>
                  ) : null}
                  {selectedPlacementEvidenceDate ? (
                    <span
                      style={{
                        ...curriculumChipStyle,
                        borderColor: "#e2e8f0",
                        background: "#ffffff",
                        color: "#475569",
                      }}
                    >
                      Saved {selectedPlacementEvidenceDate}
                    </span>
                  ) : null}
                  {selectedPlacementHasEvidenceAttachment ? (
                    <span
                      style={{
                        ...curriculumChipStyle,
                        borderColor: "#ccfbf1",
                        background: "#f0fdfa",
                        color: "#0f766e",
                      }}
                    >
                      Photo attached
                    </span>
                  ) : null}
                  {selectedPlacementLatestEvidenceEntry?.includeInPortfolio ? (
                    <span
                      style={{
                        ...curriculumChipStyle,
                        borderColor: "#dbeafe",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                      }}
                    >
                      Portfolio
                    </span>
                  ) : null}
                  {selectedPlacementLatestEvidenceEntry?.includeInReport ? (
                    <span
                      style={{
                        ...curriculumChipStyle,
                        borderColor: "#ddd6fe",
                        background: "#f5f3ff",
                        color: "#6d28d9",
                      }}
                    >
                      Reports
                    </span>
                  ) : null}
                </div>
                <strong style={{ color: "#17204B", fontSize: "clamp(22px, 3vw, 28px)", lineHeight: 1.15, fontWeight: 650 }}>
                  {selectedPlacementStep.stepTitle}
                </strong>
                <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.55, maxWidth: 860 }}>
                  {selectedPlacementStep.stepDescription}
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {selectedPlacementWorksheet ? (
                    <>
                      <Link
                        href={selectedPlacementWorksheet.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={markSelectedPathwayInteraction}
                        style={buttonStyle}
                      >
                        Open worksheet
                      </Link>
                      <Link
                        href={selectedPlacementWorksheetEvidenceHref}
                        onClick={markSelectedPathwayInteraction}
                        style={buttonStyle}
                        data-worksheet-evidence-action="add-completed-work"
                      >
                        Add completed work
                      </Link>
                    </>
                  ) : selectedPlacementPracticeHref ? (
                    <Link
                      href={selectedPlacementPracticeHref}
                      onClick={markSelectedPathwayInteraction}
                      style={buttonStyle}
                    >
                      Start practise
                    </Link>
                  ) : (
                    <button type="button" onClick={scrollToCurrentStepPanel} style={buttonStyle}>
                      Start learning
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={scrollToCurrentStepPanel}
                    style={secondaryButtonStyle}
                  >
                    View pathway map
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gap: 10 }} aria-label="Learning package actions">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ ...eyebrowStyle, textTransform: "none", letterSpacing: 0 }}>
                    {selectedPlacementWorksheet ? "Worksheet evidence" : "Practise / Assess"}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  }}
                >
                  {selectedPlacementWorksheet ? (
                    <>
                      <Link
                        href={selectedPlacementWorksheet.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={markSelectedPathwayInteraction}
                        style={{
                          ...summaryCardStyle,
                          minHeight: 78,
                          borderColor: "#D9D0FF",
                          background: "linear-gradient(180deg, #FFFFFF 0%, #F8F5FF 100%)",
                          textDecoration: "none",
                          padding: 12,
                        }}
                        aria-label={`Open worksheet for ${selectedPlacementWorksheet.title}`}
                      >
                        <span style={eyebrowStyle}>Worksheet</span>
                        <strong style={{ color: "#17204B", fontSize: 15, fontWeight: 650 }}>
                          Complete this step on paper.
                        </strong>
                        <span style={{ color: "#5B6478", lineHeight: 1.4, fontSize: 13 }}>
                          Open worksheet
                        </span>
                      </Link>
                      <Link
                        href={selectedPlacementWorksheetEvidenceHref}
                        onClick={markSelectedPathwayInteraction}
                        style={{
                          ...summaryCardStyle,
                          minHeight: 78,
                          borderColor: "#D9D0FF",
                          background: "#FFFFFF",
                          textAlign: "left",
                          padding: 12,
                          cursor: "pointer",
                          textDecoration: "none",
                        }}
                        data-worksheet-evidence-action="add-completed-work"
                      >
                        <span style={eyebrowStyle}>Evidence</span>
                        <strong style={{ color: "#17204B", fontSize: 15, fontWeight: 650 }}>
                          Add completed work.
                        </strong>
                        <span style={{ color: "#5B6478", lineHeight: 1.4, fontSize: 13 }}>
                          Take or upload a photo
                        </span>
                      </Link>
                    </>
                  ) : selectedPlacementPracticeHref ? (
                    <Link
                      href={selectedPlacementPracticeHref}
                      onClick={markSelectedPathwayInteraction}
                      style={{
                        ...summaryCardStyle,
                        minHeight: 78,
                        borderColor: "#D9D0FF",
                        background: "linear-gradient(180deg, #FFFFFF 0%, #F8F5FF 100%)",
                        textDecoration: "none",
                        padding: 12,
                      }}
                    >
                      <span style={eyebrowStyle}>Practise</span>
                      <strong style={{ color: "#17204B", fontSize: 15, fontWeight: 650 }}>Try it with support.</strong>
                      <span style={{ color: "#5B6478", lineHeight: 1.4, fontSize: 13 }}>
                        Start practise
                      </span>
                    </Link>
                  ) : null}
                  {!selectedPlacementWorksheet && selectedPlacementAssessmentHref ? (
                    <Link
                      href={selectedPlacementAssessmentHref}
                      onClick={markSelectedPathwayInteraction}
                      style={{
                        ...summaryCardStyle,
                        minHeight: 78,
                        borderColor: "#CDEFD9",
                        background: "linear-gradient(180deg, #FFFFFF 0%, #ECFDF4 100%)",
                        textDecoration: "none",
                        padding: 12,
                      }}
                    >
                      <span style={{ ...eyebrowStyle, color: "#2F9D68" }}>Assess</span>
                      <strong style={{ color: "#17204B", fontSize: 15, fontWeight: 650 }}>
                        Check understanding.
                      </strong>
                      <span style={{ color: "#5B6478", lineHeight: 1.4, fontSize: 13 }}>
                        Start assessment
                      </span>
                    </Link>
                  ) : !selectedPlacementWorksheet ? (
                    <div style={{ ...summaryCardStyle, minHeight: 78, opacity: 0.72, background: "#F8FAFC", padding: 12 }}>
                      <span style={{ ...eyebrowStyle, color: "#2F9D68" }}>Assess</span>
                      <strong style={{ color: "#17204B", fontSize: 15, fontWeight: 650 }}>
                        Assessment coming
                      </strong>
                      <span style={{ color: "#5B6478", lineHeight: 1.4, fontSize: 13 }}>
                        This assessment is coming soon.
                      </span>
                    </div>
                  ) : null}
                </div>
                {selectedPlacementWorksheet ? (
                  <details
                    data-optional-digital-tools="collapsed"
                    style={{
                      border: "1px solid #E7EAF2",
                      borderRadius: 14,
                      background: "#ffffff",
                      padding: "8px 10px",
                    }}
                  >
                    <summary style={{ cursor: "pointer", color: "#5B6478", fontSize: 13, fontWeight: 600 }}>
                      Optional digital tools
                    </summary>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      {selectedPlacementPracticeHref ? (
                        <Link
                          href={selectedPlacementPracticeHref}
                          onClick={markSelectedPathwayInteraction}
                          style={{ ...secondaryButtonStyle, minHeight: 36, padding: "7px 10px", fontSize: 13 }}
                        >
                          Try interactive practice
                        </Link>
                      ) : null}
                      {selectedPlacementAssessmentHref ? (
                        <Link
                          href={selectedPlacementAssessmentHref}
                          onClick={markSelectedPathwayInteraction}
                          style={{ ...secondaryButtonStyle, minHeight: 36, padding: "7px 10px", fontSize: 13 }}
                        >
                          Legacy digital check
                        </Link>
                      ) : null}
                    </div>
                  </details>
                ) : null}
                <details style={{ border: "1px solid #E7EAF2", borderRadius: 14, background: "#ffffff", padding: "8px 10px" }}>
                  <summary style={{ cursor: "pointer", color: "#5B6478", fontSize: 13, fontWeight: 600 }}>
                    Adjust this step
                  </summary>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <button
                  type="button"
                  disabled={!nextPlacementStep}
                  onClick={() => updateCurrentPathwayStep(nextPlacementStep, "moved_forward")}
                  style={{
                    ...secondaryButtonStyle,
                    opacity: nextPlacementStep ? 1 : 0.55,
                  }}
                >
                  Too easy - move forward
                </button>
                <button
                  type="button"
                  disabled={!previousPlacementStep}
                  onClick={() => updateCurrentPathwayStep(previousPlacementStep, "moved_back")}
                  style={{
                    ...secondaryButtonStyle,
                    opacity: previousPlacementStep ? 1 : 0.55,
                  }}
                >
                  Too hard - try an earlier step
                </button>
                <Link
                  href={manualPlacementEntryHref}
                  onClick={markSelectedPathwayInteraction}
                  style={secondaryButtonStyle}
                >
                  Choose a different step
                </Link>
                  </div>
                </details>
              </div>
              {!nextPlacementStep && selectedPlacementStepIndex >= 0 ? (
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  You&apos;re at the end of this strand for now.
                </p>
              ) : null}
              {!previousPlacementStep && selectedPlacementStepIndex >= 0 ? (
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  This is the first step in this strand.
                </p>
              ) : null}
              {selectedPlacementHasInteraction ? (
                <div
                  style={{
                    border: "1px solid #bbf7d0",
                    borderRadius: 14,
                    background: "#f0fdf4",
                    padding: 14,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <strong style={{ color: "#166534" }}>Pathway started</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Ready to keep going. Open the current step to add worksheet evidence directly.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={scrollToCurrentStepPanel}
                      style={buttonStyle}
                    >
                      Open current step
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>Pathway starting point</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                Start a pathway for {selectedLearnerLabel}
              </h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Choose a focus and MyLearna will suggest a calm starting step.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={placementEntryHref} style={buttonStyle}>
                  Start a pathway
                </Link>
                <Link href={manualPlacementEntryHref} style={secondaryButtonStyle}>
                  Choose manually
                </Link>
              </div>
            </div>
          )}
        </section>

        <CleanFirstRunSetupGate currentStep="pathways" />

        <section
          data-guidance-id="pathways-context-summary"
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
                <div style={eyebrowStyle}>Status</div>
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
                  Pathway map
                </span>
                <Link href="/my-settings" style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>
                  My Settings
                </Link>
                <GuidancePageAction tourId="my-pathways" />
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
                <div style={eyebrowStyle}>Current view</div>
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
                <div style={eyebrowStyle}>Latest assessment</div>
                <strong style={{ color: "#0f172a", fontSize: 14 }}>
                  {latestAssessmentAttempt
                    ? getAssessmentAttemptDisplayTitle(latestAssessmentAttempt)
                    : "No assessment saved yet"}
                </strong>
                <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>
                  {latestAssessmentAttempt
                    ? `Saved ${formatAssessmentAttemptSavedAt(
                        latestAssessmentAttempt.completedAt || latestAssessmentAttempt.createdAt,
                      ) || "recently"}`
                    : "Use Assess when ready."}
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
                    ? "Start with the step above."
                    : "Choose a strand below."}
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
            <CleanFeedbackPrompt pageName="My Pathways" />
          </div>
        </details>

        {showPathwayEvidenceUpdatedBanner ? (
          <section
            className="mylearna-pathway-return-banner"
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: 16,
              background: "#f0fdf4",
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 3 }}>
              <strong style={{ color: "#166534", fontSize: 15 }}>
                Step updated from your latest evidence
              </strong>
              <span style={{ color: "#166534", fontSize: 13 }}>
                The step card now uses the newest saved progress.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("latestEvidenceId");
                params.delete("source");
                const nextQuery = params.toString();
                router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
              }}
              style={{ ...secondaryButtonStyle, minHeight: 38, padding: "7px 10px" }}
            >
              Dismiss
            </button>
          </section>
        ) : null}

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
              <div style={eyebrowStyle}>Choose a subject</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22, fontWeight: 650 }}>Pathway map</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Choose a pathway focus.
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
                      label: "Step band",
                      value: currentLearningZoneStageTitle,
                      helper: "A pathway map label, not a grade judgement.",
                    },
                    {
                      label: "Secure steps",
                      value: String(selectedWorkspaceSnapshot?.secure || 0),
                      valueColor: "#166534",
                    },
                    {
                      label: "Assessments ready",
                      value: String(selectedWorkspaceSnapshot?.readyToAssess || 0),
                      valueColor: "#6d28d9",
                    },
                    {
                      label: "Evidence examples",
                      value: String(selectedWorkspaceSnapshot?.evidenceStarted || 0),
                      valueColor: "#1d4ed8",
                    },
                    {
                      label: "Practise activities",
                      value: String(selectedWorkspaceSnapshot?.practising || 0),
                      valueColor: "#c2410c",
                    },
                    {
                      label: "Other steps",
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
                          ? `Current focus: ${currentLearningZoneStageTitle}.`
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
                    data-guidance-id="pathways-stage-filter"
                    style={{
                      border: "1px solid #E7EAF2",
                      borderRadius: 16,
                      background: "#F8FAFC",
                      padding: 8,
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
                          minHeight: 36,
                          padding: "7px 11px",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {densityMode === "compact" ? "Compact view" : "Full view"}
                      </button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
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
                              border: selected ? "1px solid #6C4DF6" : "1px solid #E7EAF2",
                              background: selected ? "#F2EDFF" : "#ffffff",
                              color: selected ? "#6C4DF6" : "#17204B",
                              borderRadius: 999,
                              minHeight: 36,
                              padding: "7px 11px",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
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
                              border: selected ? "1px solid #2F9D68" : "1px solid #E7EAF2",
                              background: selected ? "#f0fdfa" : "#ffffff",
                              color: selected ? "#2F9D68" : "#17204B",
                              borderRadius: 999,
                              minHeight: 36,
                              padding: "7px 11px",
                              fontSize: 13,
                              fontWeight: 600,
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
                              familyId={workspace.profile?.id || ""}
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
            <div style={eyebrowStyle}>Current note</div>
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
  const displayedStageTitle = worksheetResource?.stageDisplay || step.stageTitle;
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
  const worksheetEvidenceHref = worksheetResource
    ? (() => {
        const captureBase = returnPath.startsWith("/clean-my-pathways")
          ? "/clean-my-capture"
          : "/my-capture";
        const params = buildPathwayCaptureSearchParams(
          {
            source: "my-pathways",
            subjectKey: "mathematics",
            subjectLabel: "Mathematics",
            pathwayKey: stepStrandKey,
            pathwayLabel: stepStrandKey,
            stageKey: step.stageKey,
            stageLabel: displayedStageTitle,
            pathwayStepId: step.pathwayStepId,
            stepKey: step.stepKey,
            stepNumber: String(getRevealStepDisplayNumber(step)),
            stepTitle: step.title,
            stepMeaning: step.title,
            skillFocus: step.title,
          },
          {
            learnerId: learnerId || null,
            learningAreaKey: "mathematics",
            learningAreaLabel: "Mathematics",
          },
        );
        return appendWorksheetEvidenceCaptureParams(
          `${captureBase}?${params.toString()}`,
          worksheetResource,
          stepReturnHref,
        );
      })()
    : "";

  return (
    <div
      className="mylearna-compact-pathway-row"
      style={{
        border: `1px solid ${primary ? tone.border : "#E7EAF2"}`,
        borderRadius: primary ? 16 : 14,
        background: "#ffffff",
        padding: primary ? 14 : "12px 14px",
        display: "grid",
        gridTemplateColumns: primary ? "1fr" : "minmax(0, 1fr) minmax(160px, auto)",
        alignItems: "center",
        gap: primary ? 10 : 14,
        opacity: compact && step.autoCheck.status !== "Not checked yet" ? 0.86 : 1,
        boxShadow: primary ? "0 8px 24px rgba(23,32,75,0.045)" : "0 3px 10px rgba(23,32,75,0.025)",
      }}
    >
      <div style={{ display: "grid", gap: primary ? 8 : 5, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span
            style={{
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              color: "#1d4ed8",
              borderRadius: 999,
              padding: "3px 8px",
              fontSize: 11,
              fontWeight: 650,
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
              fontWeight: 650,
            }}
          >
            {step.autoCheck.status}
          </span>
        </div>
        <div
          style={{
            color: "#17204B",
            fontWeight: primary ? 650 : 600,
            lineHeight: 1.25,
            fontSize: primary ? "clamp(16px, 2vw, 20px)" : 15,
          }}
        >
          {step.title}
        </div>
        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>
          {displayedStageTitle}
          {step.alignment ? ` · ${step.alignment.bank.shortTitle}` : ""}
        </div>
      </div>
      {assessmentHref || practiceHref || worksheetResource ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: primary ? "flex-start" : "flex-end",
            alignItems: "center",
          }}
        >
          {worksheetResource ? (
            <>
              <Link
                href={worksheetResource.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...secondaryButtonStyle,
                  width: "fit-content",
                  minHeight: 34,
                  padding: "7px 10px",
                  fontSize: 13,
                }}
                aria-label={`Open worksheet for ${worksheetResource.title}`}
              >
                Open worksheet
              </Link>
              <Link
                href={worksheetEvidenceHref}
                style={{
                  ...secondaryButtonStyle,
                  width: "fit-content",
                  minHeight: 34,
                  padding: "7px 10px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
                data-worksheet-evidence-action="add-completed-work"
              >
                Add completed work
              </Link>
              {(practiceHref || assessmentHref) ? (
                <details style={{ fontSize: 12, color: "#64748b" }} data-optional-digital-tools="collapsed">
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                    Optional digital tools
                  </summary>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {practiceHref ? (
                      <Link
                        href={practiceHref}
                        style={{
                          ...secondaryButtonStyle,
                          width: "fit-content",
                          minHeight: 32,
                          padding: "6px 9px",
                          fontSize: 12,
                        }}
                      >
                        Try interactive practice
                      </Link>
                    ) : null}
                    {assessmentHref ? (
                      <Link
                        href={assessmentHref}
                        style={{
                          ...secondaryButtonStyle,
                          width: "fit-content",
                          minHeight: 32,
                          padding: "6px 9px",
                          fontSize: 12,
                        }}
                      >
                        Legacy digital check
                      </Link>
                    ) : null}
                  </div>
                </details>
              ) : null}
            </>
          ) : (
            <>
              {practiceHref ? (
                <Link
                  href={practiceHref}
                  style={{
                    ...secondaryButtonStyle,
                    width: "fit-content",
                    minHeight: 34,
                    padding: "7px 10px",
                    fontSize: 13,
                  }}
                >
                  Continue practise
                </Link>
              ) : null}
              {assessmentHref ? (
                <Link
                  href={assessmentHref}
                  style={{
                    ...secondaryButtonStyle,
                    width: "fit-content",
                    minHeight: 34,
                    padding: "7px 10px",
                    fontSize: 13,
                  }}
                >
                  Assess
                </Link>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>
          Learning activity coming soon.
        </div>
      )}
      {!worksheetResource && !practiceHref && assessmentHref ? (
        <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>
          Practise is coming soon.
        </div>
      ) : null}
      {!worksheetResource && !assessmentHref && practiceHref ? (
        <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>
          Assessment is coming soon.
        </div>
      ) : null}
      <style jsx global>{`
        .mylearna-pathway-guidance-mobile {
          display: none;
        }

        @media (max-width: 720px) {
          .mylearna-compact-pathway-row {
            grid-template-columns: 1fr !important;
          }

          .mylearna-compact-pathway-row > div:nth-child(2) {
            justify-content: flex-start !important;
          }

          .mylearna-pathway-step-card {
            padding: 10px !important;
            gap: 8px !important;
            border-radius: 14px !important;
          }

          .mylearna-pathway-step-card-header,
          .mylearna-pathway-step-status-row {
            align-items: flex-start !important;
            justify-content: flex-start !important;
          }

          .mylearna-pathway-step-title-block > div:nth-child(2) {
            display: none !important;
          }

          .mylearna-pathway-step-status-row {
            width: 100% !important;
          }

          .mylearna-pathway-step-status-row > * {
            min-height: 34px !important;
          }

          .mylearna-worksheet-action-card {
            padding: 12px !important;
            gap: 10px !important;
            box-shadow: none !important;
          }

          .mylearna-worksheet-action-copy span:last-child {
            display: none !important;
          }

          .mylearna-worksheet-action-buttons {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .mylearna-worksheet-action-buttons > a,
          .mylearna-worksheet-action-buttons > button {
            width: 100% !important;
            min-height: 46px !important;
          }

          .mylearna-pathway-guidance-desktop {
            display: none !important;
          }

          .mylearna-pathway-guidance-mobile {
            display: block !important;
            grid-column: 1 / -1;
          }

          .mylearna-pathway-guidance-mobile > summary {
            min-height: 42px;
            cursor: pointer;
            color: #1d4ed8;
            font-size: 14px;
            font-weight: 800;
          }
        }
      `}</style>
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
        gridTemplateColumns: "1fr",
        gap: 10,
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
        borderTop: "1px solid #E7EAF2",
        paddingTop: 10,
      }}
    >
      <summary style={{ cursor: "pointer", color: "#17204B", fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
        {title} ({steps.length})
      </summary>
      {open ? (
        <div style={{ marginTop: 10 }}>
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
          <div style={{ ...eyebrowStyle, textTransform: "none", letterSpacing: 0 }}>Pathway focus</div>
          <span
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 999,
              background: "#eff6ff",
              color: "#1d4ed8",
              padding: "4px 8px",
              fontSize: 12,
              fontWeight: 650,
            }}
          >
            {getRevealFocusLabel(currentStartStep, groups)}
          </span>
        </div>
        <h3
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "clamp(18px, 2vw, 21px)",
            fontWeight: 650,
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
              <div style={{ ...eyebrowStyle, textTransform: "none", letterSpacing: 0 }}>Needs polish</div>
              <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>
                Skills that may need another practice round.
              </div>
              <NumberRevealStepList
                steps={groups.needsPolish}
                learnerId={learnerId}
                returnPath={returnPath}
              />
            </section>
          ) : null}

          <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
            <div style={{ ...eyebrowStyle, textTransform: "none", letterSpacing: 0 }}>Current focus</div>
            <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>
              Current focus and next steps.
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
          <div style={{ ...eyebrowStyle, textTransform: "none", letterSpacing: 0 }}>Start here</div>
          <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>
            Choose an early check or open the pathway map.
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
  familyId,
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
  familyId: string;
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
                gridTemplateColumns: "1fr",
                gap: 10,
                borderTop: "1px solid #E7EAF2",
                padding: 10,
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
            familyId={familyId}
            selectedLearnerId={selectedLearnerId}
            returnPath={returnPath}
            capturePathBase={capturePathBase}
            assessPathBase={assessPathBase}
            assessmentAttempts={assessmentAttempts}
            isOpen={expandedStepId === detailPanelId}
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
  familyId,
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
  familyId: string;
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
  const statusPathwayStepId = statusState.pathwayStepId;
  const stageKey = stage.key;
  const strandKey = strand.key;
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
    statusPathwayStepId,
  );
  const confidenceStatusLabel = stepUnifiedState?.assessmentConfidence || "Not checked yet";
  const latestEvidenceEntry = stepUnifiedState?.latestEvidenceEntry ?? null;
  const evidenceProgressMeta =
    stepUnifiedState?.latestStatusSource === "evidence"
      ? getWorksheetEvidenceProgressMeta(latestEvidenceEntry)
      : null;
  const statusChipMeta =
    evidenceProgressMeta ||
    (exactStepContext && confidenceStatusLabel === "Not checked yet"
      ? statusMeta["Not started"]
      : meta);
  const evidenceLinkedCount = stepUnifiedState?.linkedEvidenceCount || 0;
  const canonicalStepKey = useMemo(
    () => buildPathwayRegistryStepKey(step.title, step.id),
    [step.id, step.title],
  );
  const numberAssessmentAlignment = isNumberPathwayContext(selectedSubjectKey, strandKey)
    ? getNumberAssessmentAlignmentForPathwayStep({
        subjectKey: selectedSubjectKey,
        strandKey,
        stageKey,
        pathwayStepId: statusPathwayStepId,
        stepKey: canonicalStepKey,
      })
    : null;
  const numberAssessmentBank = numberAssessmentAlignment?.bank ?? null;
  const canonicalPathwayStepId =
    statusPathwayStepId ||
    resolveCanonicalPathwayStepIdFromParts({
      subjectKey: selectedSubjectKey,
      pathwayKey: strandKey,
      stageKey,
      stepKey: canonicalStepKey,
      stepNumber: String(step.id),
    });
  const practiceActivity = canonicalPathwayStepId
    ? getPathwayPracticeActivityByStepId(canonicalPathwayStepId)
    : null;
  const exactStepAssessment = getStepAssessmentForPathwayStep({
    pathwayStepId: canonicalPathwayStepId,
    stepKey: canonicalStepKey,
    strandKey,
  });
  const exactStepPractice = getStepPracticeForPathwayStep({
    pathwayStepId: canonicalPathwayStepId,
    stepKey: canonicalStepKey,
    strandKey,
  });
  const worksheetResource = getWorksheetResourceForPathwayStep({
    pathwayStepId: canonicalPathwayStepId,
    stepKey: canonicalStepKey,
    subjectKey: selectedSubjectKey,
    strandKey,
    stageKey,
  });
  const displayedStageTitle = worksheetResource?.stageDisplay || stage.title;
  const captureReturnTo = buildPathwayStepReturnHref({
    pathname: returnPath,
    subjectKey: selectedSubjectKey,
    strandKey,
    learnerId: selectedLearnerId,
    detailPanelId,
  });
  const captureParams = buildPathwayCaptureSearchParams(
    {
      source: "my-pathways",
      subjectKey: selectedSubjectKey,
      subjectLabel: selectedSubjectTitle,
      pathwayKey: strandKey,
      pathwayLabel: strand.pathwayLabel,
      stageKey,
      stageLabel: displayedStageTitle,
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
  const captureBaseHref = `${capturePathBase}?${captureParams.toString()}`;
  const captureHref = worksheetResource
    ? appendWorksheetEvidenceCaptureParams(captureBaseHref, worksheetResource, captureReturnTo)
    : captureBaseHref;
  const assessHref = (() => {
    if (!canonicalPathwayStepId) {
      return assessPathBase;
    }

    const isNumberContext = isNumberPathwayContext(selectedSubjectKey, strandKey);
    const returnTo = buildPathwayStepReturnHref({
      pathname: returnPath,
      subjectKey: selectedSubjectKey,
      strandKey,
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
    params.set("strandKey", strandKey);
    params.set("stageKey", stageKey);
    params.set("pathwayStepId", canonicalPathwayStepId);
    params.set("stepKey", canonicalStepKey);
    params.set("returnTo", returnTo);

    if (selectedLearnerId) {
      params.set("learnerId", selectedLearnerId);
    }

    return `${assessPathBase}?${params.toString()}`;
  })();
  const exactPracticeHref = (() => {
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
  })();
  const autoCheckStatus = numberAssessmentAlignment
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
        };
  const worksheetStatus = worksheetResource ? "Worksheet ready" : "No worksheet";
  const worksheetFileName = worksheetResource?.fileName || "";
  const hasEvidenceAttachment =
    Boolean(latestEvidenceEntry?.imageUrl) ||
    Boolean(latestEvidenceEntry?.attachmentUrls.length);
  const latestEvidenceDate = formatWorksheetEvidenceDate(latestEvidenceEntry);
  const isStepSecure =
    evidenceProgressMeta?.label === "Goal achieved" ||
    evidenceProgressMeta?.label === "Goal achieved + extension" ||
    status === "Secure";
  const nextDetailedStep = (() => {
    const currentStageStep = stage.steps[stepIndex + 1] || null;
    if (currentStageStep) {
      return { stage, step: currentStageStep };
    }

    const nextStage = strand.stages[stageIndex + 1] || null;
    const nextStageStep = nextStage?.steps[0] || null;
    return nextStage && nextStageStep ? { stage: nextStage, step: nextStageStep } : null;
  })();
  const nextDetailedStepHref = nextDetailedStep
    ? buildPathwayStepReturnHref({
        pathname: returnPath,
        subjectKey: selectedSubjectKey,
        strandKey,
        learnerId: selectedLearnerId,
        detailPanelId: `pathway-step-${strand.key}-${nextDetailedStep.stage.key}-${nextDetailedStep.step.id}`,
      })
    : "";

  return (
    <article
      className="mylearna-pathway-step-card"
      data-guidance-id="pathways-step-card"
      style={{
        border: evidenceProgressMeta
          ? `1px solid ${evidenceProgressMeta.border}`
          : "1px solid #E7EAF2",
        borderRadius: 14,
        background: evidenceProgressMeta ? evidenceProgressMeta.fill : "#ffffff",
        padding: densityMode === "compact" ? "9px 10px" : "11px 12px",
        display: "grid",
        gap: densityMode === "compact" ? 7 : 9,
        boxShadow: evidenceProgressMeta
          ? "0 8px 22px rgba(23,32,75,0.06)"
          : "0 3px 10px rgba(23,32,75,0.025)",
      }}
    >
      <div
        className="mylearna-pathway-step-card-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div className="mylearna-pathway-step-title-block" style={{ display: "grid", gap: 4, maxWidth: 760, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                border: "1px solid #dbeafe",
                background: "#eff6ff",
                color: "#1d4ed8",
                borderRadius: 999,
                padding: "2px 7px",
                fontSize: 11,
                fontWeight: 650,
              }}
            >
              Step {displayStepNumber}
            </span>
            <strong style={{ color: "#17204B", fontSize: 13, lineHeight: 1.25, fontWeight: 600 }}>
              {step.title}
            </strong>
          </div>
          {isOpen ? (
            <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45 }}>{step.meaning}</div>
          ) : null}
        </div>

        <div className="mylearna-pathway-step-status-row" style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div
              data-guidance-id="pathways-progress-status"
              title={
                evidenceProgressMeta?.helper ||
                (exactStepContext ? confidenceStatusLabel : meta.helper)
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
              <strong style={{ color: statusChipMeta.text, fontSize: 12, fontWeight: 650 }}>
                {evidenceProgressMeta
                  ? evidenceProgressMeta.label
                  : exactStepContext && confidenceStatusLabel !== "Not checked yet"
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
                fontWeight: 650,
                lineHeight: 1.3,
              }}
              title={worksheetFileName || "No worksheet is available for this step yet."}
            >
              {worksheetStatus}
            </div>

          {evidenceLinkedCount > 0 ? (
            <span
              style={{
                border: evidenceProgressMeta
                  ? `1px solid ${evidenceProgressMeta.border}`
                  : "1px solid #bfdbfe",
                borderRadius: 999,
                background: "#ffffff",
                color: evidenceProgressMeta?.text || "#1d4ed8",
                padding: "4px 7px",
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              Evidence attached
            </span>
          ) : null}

          {latestEvidenceDate ? (
            <span
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 999,
                background: "#ffffff",
                color: "#475569",
                padding: "4px 7px",
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              Saved {latestEvidenceDate}
            </span>
          ) : null}

          {hasEvidenceAttachment ? (
            <span
              style={{
                border: "1px solid #ccfbf1",
                borderRadius: 999,
                background: "#f0fdfa",
                color: "#0f766e",
                padding: "4px 7px",
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              Photo attached
            </span>
          ) : null}

          {latestEvidenceEntry?.includeInPortfolio ? (
            <span
              style={{
                border: "1px solid #dbeafe",
                borderRadius: 999,
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "4px 7px",
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              Portfolio
            </span>
          ) : null}

          {latestEvidenceEntry?.includeInReport ? (
            <span
              style={{
                border: "1px solid #ddd6fe",
                borderRadius: 999,
                background: "#f5f3ff",
                color: "#6d28d9",
                padding: "4px 7px",
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              Reports
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
              fontWeight: 650,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{isOpen ? "Hide support" : "More support"}</span>
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
          {isStepSecure && nextDetailedStepHref ? (
            <Link
              href={nextDetailedStepHref}
              style={{
                border: "1px solid #bbf7d0",
                background: "#ffffff",
                color: "#166534",
                borderRadius: 999,
                padding: "4px 7px",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Next step
            </Link>
          ) : null}
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
        familyId={familyId}
        learnerId={selectedLearnerId}
        subjectKey={selectedSubjectKey}
        subjectTitle={selectedSubjectTitle}
        strandKey={strand.key}
        strandTitle={strand.title}
        stageKey={stage.key}
        stageTitle={displayedStageTitle}
        pathwayStepId={canonicalPathwayStepId || ""}
        stepKey={canonicalStepKey}
        stepTitle={step.title}
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
            ? "Assessment is coming soon for this step."
            : null
        }
        worksheetResource={worksheetResource}
        latestEvidenceEntry={stepUnifiedState?.latestEvidenceEntry ?? null}
      />

      <div
        id={detailPanelId}
        hidden={!isOpen}
        style={
          isOpen
            ? {
                border: "1px solid #E7EAF2",
                borderRadius: 16,
                background: "#ffffff",
                padding: 12,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }
            : { display: "none" }
        }
      >
        <div className="mylearna-pathway-guidance-desktop" style={{ display: "contents" }}>
          <PathwayStepGuidanceSection title="What this means" content={step.meaning} />
          <PathwayStepGuidanceSection title="Skill focus" content={step.skillFocus} />
          <PathwayStepGuidanceSection title="Learning goal" content={step.learningIntention} />
          <PathwayStepGuidanceListSection title="Success looks like" items={step.successCriteria} />
          <PathwayStepGuidanceSection title="Try this activity" content={step.practiceActivity} />
          <PathwayStepGuidanceListSection title="Evidence idea" items={step.evidenceExamples.slice(0, 2)} />
          <PathwayStepGuidanceSection
            title="Assess later"
            content={step.assessmentCheck}
          />
        </div>
        <details className="mylearna-pathway-guidance-mobile">
          <summary>More learning support</summary>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <PathwayStepGuidanceSection title="What this means" content={step.meaning} />
            <PathwayStepGuidanceSection title="Learning goal" content={step.learningIntention} />
            <PathwayStepGuidanceListSection title="Success looks like" items={step.successCriteria} />
            <PathwayStepGuidanceSection title="Try this activity" content={step.practiceActivity} />
            <PathwayStepGuidanceListSection title="Evidence idea" items={step.evidenceExamples.slice(0, 2)} />
          </div>
        </details>
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
    <section
      style={{
        border: "1px solid #E7EAF2",
        borderRadius: 14,
        background: "#F8FAFC",
        padding: 10,
        display: "grid",
        gap: 5,
      }}
    >
      <div style={{ ...eyebrowStyle, color: "#6C4DF6", fontSize: 10 }}>{title}</div>
      <div style={{ color: "#5B6478", lineHeight: 1.45, fontSize: 13 }}>{content}</div>
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
    <section
      style={{
        border: "1px solid #E7EAF2",
        borderRadius: 14,
        background: "#F8FAFC",
        padding: 10,
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ ...eyebrowStyle, color: "#6C4DF6", fontSize: 10 }}>{title}</div>
      <ul
        style={{
          margin: 0,
          paddingLeft: 16,
          color: "#5B6478",
          fontSize: 13,
          lineHeight: 1.45,
          display: "grid",
          gap: 4,
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
