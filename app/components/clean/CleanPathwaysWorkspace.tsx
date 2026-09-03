"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import { CleanFeedbackPrompt } from "@/app/components/clean/CleanPersonalisationCards";
import CleanPathwayStepActionRow from "@/app/components/clean/CleanPathwayStepActionRow";
import CleanPathwayProgressConfirmation from "@/app/components/clean/CleanPathwayProgressConfirmation";
import { GuidancePageAction } from "@/app/components/clean/guidance/GuidanceToggle";
import { listCleanAssessmentSkillStatuses } from "@/lib/clean/assessments/client";
import { listAssessmentAttemptsForLearner } from "@/lib/clean/assessments/attemptClient";
import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import { getStepAssessmentForPathwayStep } from "@/lib/clean/assessments/stepAssessmentRegistry";
import { getStepPracticeForPathwayStep } from "@/lib/clean/practice/stepPracticeRegistry";
import {
  getNumberPathwayRevealGroups,
  type NumberAutoCheckStatus,
  type NumberPathwayEvidenceStatusOverride,
  type NumberPathwayRevealGroups,
  type NumberPathwayRevealStep,
} from "@/lib/clean/assessments/numberPathwayAssessmentAlignment";
import { getRegionalStageLabel } from "@/lib/clean/regionalStageLabels";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";
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
import { buildPathwayStepReturnHref } from "@/lib/clean/pathways/pathwayNavigationContext";
import { getWorksheetResourceForPathwayStep } from "@/lib/clean/resources/mathWorksheetResources";
import { supabase } from "@/lib/supabaseClient";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  buildUnifiedPathwayStepStateIndex,
  getUnifiedPathwayStepEvidenceCount,
  getUnifiedPathwayStepState,
  isUnifiedPathwayStepComplete,
  resolveCanonicalPathwayStepIdFromParts,
  type UnifiedPathwayStepStateIndex,
} from "@/lib/clean/pathways/pathwayStepState";
import {
  buildExplainableProgressStory,
  type ExplainableProgressNextAction,
} from "@/lib/clean/pathways/explainableProgressStory";
import type { ParentProgressStatus } from "@/lib/clean/pathways/parentProgress";
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
const PATHWAYS_MANUAL_COMPLETION_STORAGE_KEY =
  "mylearna:clean-pathways-manual-completion:v1";

type PathwayWorksheetFilter = "all" | "with" | "missing";
type PathwayDensityMode = "compact" | "full";

type PersistedPathwaysUiState = {
  selectedLearnerId?: string;
  selectedSubjectKey?: PathwaySubjectKey;
  selectedStrandKeyBySubject?: Partial<Record<PathwaySubjectKey, string>>;
  hasExplicitStrandSelection?: boolean;
  strandSelectorExpanded?: boolean;
  activeStageKeyByStrand?: Record<string, string>;
  expandedStepId?: string | null;
  worksheetFilter?: PathwayWorksheetFilter;
  densityMode?: PathwayDensityMode;
  scrollY?: number;
};

type ManualPathwayCompletionRecord = {
  completed: boolean;
  completedAt?: string;
};

type ManualPathwayCompletionMap = Record<string, ManualPathwayCompletionRecord>;

type PathwayThumbnailVisibility = "hidden" | "staff" | "internalPreview" | "draft" | "published";

type PathwayThumbnailCandidate = {
  src?: string;
  url?: string;
  alt?: string;
  label?: string;
  visibility?: PathwayThumbnailVisibility;
  imageVisibility?: PathwayThumbnailVisibility;
  imagePublished?: boolean;
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

function readManualPathwayCompletions(): ManualPathwayCompletionMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PATHWAYS_MANUAL_COMPLETION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as ManualPathwayCompletionMap)
      : {};
  } catch {
    return {};
  }
}

function writeManualPathwayCompletions(nextState: ManualPathwayCompletionMap) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      PATHWAYS_MANUAL_COMPLETION_STORAGE_KEY,
      JSON.stringify(nextState),
    );
  } catch {
    // Manual completion remains a local convenience until backend sync is wired.
  }
}

function buildManualPathwayCompletionKey(learnerId: string, pathwayStepId: string) {
  return `${learnerId || "learner"}::${pathwayStepId || "step"}`;
}

function canViewDraftPathwayImages(viewer: { isStaffPreview?: boolean } | null) {
  return Boolean(viewer?.isStaffPreview);
}

function getVisiblePathwayThumbnail(
  resource: unknown,
  viewer: { isStaffPreview?: boolean } | null,
): { src: string; alt: string; label?: string; staffOnly: boolean } | null {
  const candidate =
    resource && typeof resource === "object"
      ? ((resource as { thumbnail?: PathwayThumbnailCandidate; image?: PathwayThumbnailCandidate })
          .thumbnail ||
          (resource as { image?: PathwayThumbnailCandidate }).image)
      : null;
  if (!candidate) return null;

  const visibility = candidate.visibility || candidate.imageVisibility;
  const src = candidate.src || candidate.url || "";
  if (!src) return null;

  const isPublished = candidate.imagePublished === true || visibility === "published";
  if (isPublished) {
    return {
      src,
      alt: candidate.alt || candidate.label || "Pathway resource preview",
      label: candidate.label,
      staffOnly: false,
    };
  }

  if (canViewDraftPathwayImages(viewer)) {
    return {
      src,
      alt: candidate.alt || candidate.label || "Internal pathway resource preview",
      label:
        visibility === "hidden"
          ? "Hidden from customers"
          : visibility === "internalPreview"
            ? "Internal preview"
            : "Draft image",
      staffOnly: true,
    };
  }

  return null;
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
    helper: "This step is active in the pathway.",
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
    helper: "This step looks ready for more evidence or completion.",
  },
  Secure: {
    fill: "#ecfdf5",
    border: "#bbf7d0",
    text: "#166534",
    dot: "#22c55e",
    helper: "Confidence looks more settled at this step.",
  },
};

function getCustomerPathwayStatusLabel(status: string) {
  if (status === "Ready to assess") return "Ready for evidence";
  if (status === "Practising") return "In progress";
  return status;
}

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
    helper: "Completed worksheet work recorded. This step still needs support.",
  },
  "working towards": {
    label: "Working towards",
    fill: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    dot: "#fb923c",
    helper: "Completed worksheet work recorded. This step is developing.",
  },
  consolidating: {
    label: "Consolidating",
    fill: "#fffbeb",
    border: "#fde68a",
    text: "#92400e",
    dot: "#f59e0b",
    helper: "Completed worksheet work recorded. This step is close to secure.",
  },
  secure: {
    label: "Secure",
    fill: "#ecfdf5",
    border: "#bbf7d0",
    text: "#166534",
    dot: "#22c55e",
    helper: "Completed worksheet work recorded. This step is secure.",
  },
  "goal achieved": {
    label: "Goal achieved",
    fill: "#ecfdf5",
    border: "#bbf7d0",
    text: "#166534",
    dot: "#22c55e",
    helper: "Completed worksheet work recorded. This step is achieved.",
  },
  "goal achieved + extension": {
    label: "Goal achieved + extension",
    fill: "#eef2ff",
    border: "#c7d2fe",
    text: "#3730a3",
    dot: "#6366f1",
    helper: "Completed worksheet work recorded with extension.",
  },
};

type StageSummaryCounts = {
  steps: number;
  secure: number;
  evidenceLinked: number;
  readyToAssess: number;
  evidenceStarted: number;
  practising: number;
  notStarted: number;
};

const parentProgressChipMeta: Record<
  ParentProgressStatus,
  { fill: string; border: string; text: string; dot: string }
> = {
  "Not checked yet": { fill: "#F8FAFC", border: "#E2E8F0", text: "#64748B", dot: "#94A3B8" },
  "Needs support": { fill: "#FFF1F2", border: "#FECDD3", text: "#BE123C", dot: "#FB7185" },
  Developing: { fill: "#FFF7ED", border: "#FED7AA", text: "#C2410C", dot: "#FB923C" },
  Consolidating: { fill: "#FFFBEB", border: "#FDE68A", text: "#92400E", dot: "#F59E0B" },
  Secure: { fill: "#ECFDF5", border: "#BBF7D0", text: "#166534", dot: "#22C55E" },
};

function getLearnerLabel(learner: Learner | null) {
  if (!learner) return "No learner selected";
  return learner.preferredName || learner.firstName;
}

function formatMissingSetupItems(items: string[]) {
  if (items.length <= 1) return items[0] || "your setup";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
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
      const { status, pathwayStepId } = getWorkspaceDisplayedPathwayStatus(
        subjectKey,
        workspace,
        stage,
        stageIndex,
        currentStageIndex,
        step,
        stepIndex,
        unifiedPathwayStepStateIndex,
      );
      const evidenceCount = getUnifiedPathwayStepEvidenceCount(
        unifiedPathwayStepStateIndex,
        pathwayStepId,
      );

      if (evidenceCount > 0) {
        totals.evidenceLinked += evidenceCount;
      }

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
      evidenceLinked: 0,
      readyToAssess: 0,
      evidenceStarted: 0,
      practising: 0,
      notStarted: 0,
    },
  );
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
  const [activeStageKeyByStrand, setActiveStageKeyByStrand] = useState<Record<string, string>>(
    () => persistedUiState.activeStageKeyByStrand || {},
  );
  const [expandedStepId, setExpandedStepId] = useState<string | null>(
    () => getReturnedPathwayDetailPanelId() || persistedUiState.expandedStepId || null,
  );
  const [worksheetFilter, setWorksheetFilter] = useState<PathwayWorksheetFilter>(
    () => persistedUiState.worksheetFilter || "all",
  );
  const [densityMode, setDensityMode] = useState<PathwayDensityMode>(
    () => persistedUiState.densityMode || "compact",
  );
  const [pathwayInteractionVersion, setPathwayInteractionVersion] = useState(0);
  const [worksheetOpenedForStepId, setWorksheetOpenedForStepId] = useState("");
  const [manualCompletions, setManualCompletions] = useState<ManualPathwayCompletionMap>(
    () => readManualPathwayCompletions(),
  );
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
      activeStageKeyByStrand,
      expandedStepId,
      worksheetFilter,
      densityMode,
      scrollY: typeof window === "undefined" ? 0 : window.scrollY,
    };
    writePersistedPathwaysUiState(nextState);
  }, [
    activeStageKeyByStrand,
    densityMode,
    expandedStepId,
    hasExplicitStrandSelection,
    selectedStrandKeyBySubject,
    selectedSubjectKey,
    strandSelectorExpanded,
    worksheetFilter,
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
    return workspace.setupStatus.activeLearnerId || "";
  }, [selectedLearnerIdOverride, workspace.learners, workspace.setupStatus.activeLearnerId]);

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
  const learnerSetupKnown = !workspace.loading && !workspace.schemaMissing;
  const missingLearnerSetup = learnerSetupKnown && !workspace.setupStatus.hasLearner;
  const planningSetupKnown = !workspace.setupLoading;
  const missingLearningYearSetup = planningSetupKnown && !workspace.setupStatus.hasLearningYear;
  const missingLearningPeriodSetup =
    planningSetupKnown &&
    workspace.setupStatus.hasLearningYear &&
    !workspace.setupStatus.hasTeachingPeriod;
  const missingSetupItems = [
    missingLearnerSetup ? "a learner" : null,
    missingLearningYearSetup ? "a learning year" : null,
    missingLearningPeriodSetup ? "your first learning period" : null,
  ].filter(Boolean) as string[];
  const missingSetupSummary = formatMissingSetupItems(missingSetupItems);
  const showPathwaysSetupBanner = missingSetupItems.length > 0;
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
  const selectedWorkspaceActiveStageKey = useMemo(() => {
    if (!selectedSubjectWorkspace) return "";
    const queryStageKey = searchParams.get("stageKey") || "";
    const persistedStageKey = activeStageKeyByStrand[selectedSubjectWorkspace.key] || "";
    const preferredStageKey =
      queryStageKey ||
      persistedStageKey ||
      selectedSubjectWorkspace.currentFocusStageKey ||
      selectedSubjectWorkspace.stages[selectedWorkspaceStageIndex]?.key ||
      selectedSubjectWorkspace.stages[0]?.key ||
      "";

    return selectedSubjectWorkspace.stages.some((stage) => stage.key === preferredStageKey)
      ? preferredStageKey
      : selectedSubjectWorkspace.stages[0]?.key || "";
  }, [
    activeStageKeyByStrand,
    searchParams,
    selectedSubjectWorkspace,
    selectedWorkspaceStageIndex,
  ]);
  const selectedWorkspaceActiveStageIndex = useMemo(() => {
    if (!selectedSubjectWorkspace) return -1;
    return Math.max(
      0,
      selectedSubjectWorkspace.stages.findIndex(
        (stage) => stage.key === selectedWorkspaceActiveStageKey,
      ),
    );
  }, [selectedSubjectWorkspace, selectedWorkspaceActiveStageKey]);
  const selectedWorkspaceActiveStage = useMemo(() => {
    if (!selectedSubjectWorkspace) return null;
    return selectedSubjectWorkspace.stages[selectedWorkspaceActiveStageIndex] || null;
  }, [selectedSubjectWorkspace, selectedWorkspaceActiveStageIndex]);

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
  const currentStageEvidenceCount = selectedWorkspaceSnapshot?.evidenceLinked || 0;
  const nextActionLabel = currentStageEvidenceCount
    ? "Add completed work"
    : "Open current step";
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
        stageKey: selectedPlacementStep.stageKey,
        pathwayStepId: selectedPlacementStep.id,
        stepKey: selectedPlacementStep.stepKey,
        learnerId: selectedLearnerId,
        detailPanelId: `pathway-step-${selectedPlacementStep.strandKey}-${selectedPlacementStep.stageKey}-${selectedPlacementStep.stepKey}`,
      })
    : pathname;
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
  const selectedPlacementCaptureHref = useMemo(() => {
    if (!selectedPlacementStep) return capturePathBase;

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
        stepNumber: String(
          selectedPlacementStep.legacyStepNumber ||
            selectedPlacementStep.stepOrder ||
            selectedPlacementStep.stepKey,
        ),
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

    return `${capturePathBase}?${params.toString()}`;
  }, [
    capturePathBase,
    selectedLearnerId,
    selectedPlacementStageTitle,
    selectedPlacementStep,
    selectedSubject.title,
    selectedSubjectWorkspace?.title,
  ]);
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

  function markSelectedWorksheetOpened() {
    markSelectedPathwayInteraction();
    if (selectedPlacementStep) {
      setWorksheetOpenedForStepId(
        selectedPlacementStep.stepKey ||
          selectedPlacementStep.legacyStepNumber ||
          selectedPlacementStep.stepTitle,
      );
    }
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

  function handleSelectWorkspaceStage(stageKey: string) {
    if (!selectedSubjectWorkspace) return;
    setActiveStageKeyByStrand((current) => ({
      ...current,
      [selectedSubjectWorkspace.key]: stageKey,
    }));
    setExpandedStepId(null);

    const params = new URLSearchParams(searchParams.toString());
    params.set("stageKey", stageKey);
    if (selectedLearnerId) {
      params.set("learnerId", selectedLearnerId);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleManualCompletionChange(pathwayStepId: string, completed: boolean) {
    if (!pathwayStepId) return;
    const key = buildManualPathwayCompletionKey(selectedLearnerId, pathwayStepId);
    setManualCompletions((current) => {
      const next = { ...current };
      if (completed) {
        next[key] = {
          completed: true,
          completedAt: new Date().toISOString(),
        };
      } else {
        delete next[key];
      }
      writeManualPathwayCompletions(next);
      return next;
    });
  }

  function handlePathwayProgressSaved() {
    void reloadUnifiedPathwayStepState();
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

          .mylearna-pathways-hero-copy,
          .mylearna-pathways-subject-description,
          .mylearna-pathways-selected-strand-description {
            display: none !important;
          }

          .mylearna-pathways-selected-strand-card {
            padding: 12px !important;
          }

          .mylearna-pathways-current-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .mylearna-pathways-current-actions > * {
            width: 100% !important;
            min-height: 46px !important;
            justify-content: center !important;
          }

          .mylearna-pathway-stage-summary {
            grid-template-columns: 1fr !important;
          }

          .mylearna-pathway-stage-tabs {
            margin-inline: -2px;
          }
        }
      `}</style>
      <div style={wrapStyle}>
        {showPathwaysSetupBanner ? (
          <section
            style={{
              ...cardStyle,
              border: "1px solid #fde68a",
              background: "#fffbeb",
              boxShadow: "0 8px 24px rgba(146,64,14,0.08)",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ ...eyebrowStyle, color: "#92400e" }}>Setup guidance</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                Complete your setup to receive personalised pathway recommendations
              </h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Add {missingSetupSummary}
                {workspace.setupStatus.counts.breaks > 0 && missingLearningPeriodSetup
                  ? ". A break or holiday is saved, but regular pathway planning still needs a genuine learning period."
                  : " so MyLearna can recommend suitable steps and connect activities to your calendar."}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {missingLearnerSetup ? (
                <Link href="/my-profile" style={buttonStyle}>
                  Add or choose a learner
                </Link>
              ) : null}
              {missingLearningYearSetup || missingLearningPeriodSetup ? (
                <Link href="/my-calendar" style={secondaryButtonStyle}>
                  Add a learning period
                </Link>
              ) : null}
              <a href="#pathways-map" style={secondaryButtonStyle}>
                Continue exploring
              </a>
            </div>
          </section>
        ) : null}

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
          {workspace.loading ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>Pathway starting point</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                Loading learner details...
              </h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                We&apos;re checking your family workspace before choosing a pathway view.
              </p>
            </div>
          ) : !selectedLearner ? (
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
                <p className="mylearna-pathways-hero-copy" style={{ margin: 0, color: "#5B6478", lineHeight: 1.5, maxWidth: 760 }}>
                  Choose one useful step, complete the worksheet, then add completed work.
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
                <p className="mylearna-pathways-hero-copy" style={{ margin: 0, color: "#5B6478", lineHeight: 1.55, maxWidth: 860 }}>
                  {selectedPlacementStep.stepDescription}
                </p>
                <div className="mylearna-pathways-current-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {selectedPlacementWorksheet ? (
                    <>
                      <Link
                        href={selectedPlacementWorksheet.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={markSelectedWorksheetOpened}
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
                {selectedPlacementWorksheet &&
                worksheetOpenedForStepId ===
                  (selectedPlacementStep.stepKey ||
                    selectedPlacementStep.legacyStepNumber ||
                    selectedPlacementStep.stepTitle) ? (
                  <div
                    style={{
                      border: "1px solid #bfdbfe",
                      borderRadius: 999,
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      padding: "8px 12px",
                      fontSize: 13,
                      fontWeight: 800,
                      width: "fit-content",
                    }}
                  >
                    Worksheet opened. Next: add completed work.
                  </div>
                ) : null}
              </div>
              <div style={{ display: "grid", gap: 10 }} aria-label="Learning package actions">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ ...eyebrowStyle, textTransform: "none", letterSpacing: 0 }}>
                    {selectedPlacementWorksheet ? "Worksheet evidence" : "Evidence and next step"}
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
                        onClick={markSelectedWorksheetOpened}
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
                  ) : !selectedPlacementWorksheet ? (
                    <Link
                      href={selectedPlacementCaptureHref}
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
                    >
                      <span style={eyebrowStyle}>Evidence</span>
                      <strong style={{ color: "#17204B", fontSize: 15, fontWeight: 650 }}>
                        Capture this step.
                      </strong>
                      <span style={{ color: "#5B6478", lineHeight: 1.4, fontSize: 13 }}>
                        Add a note or photo
                      </span>
                    </Link>
                  ) : null}
                </div>
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
                Choose a starting point for {selectedLearnerLabel}
              </h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Choose a focus and MyLearna will suggest a calm starting step.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={placementEntryHref} style={buttonStyle}>
                  Choose a starting point
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
          id="pathways-map"
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
                <div style={eyebrowStyle}>Recent learning</div>
                <strong style={{ color: "#0f172a", fontSize: 14 }}>
                  {currentStageEvidenceCount
                    ? `${currentStageEvidenceCount} example${
                        currentStageEvidenceCount === 1 ? "" : "s"
                      } added`
                    : "No learning records yet"}
                </strong>
                <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>
                  Use the worksheet or My Capture when ready.
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
                Step updated from your latest completed work
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
                <div className="mylearna-pathways-subject-description" style={{ color: "#475569", lineHeight: 1.5 }}>
                  {selectedSubject.description}
                </div>
              </div>
            </div>
          </div>
        </section>

        {selectedSubjectSupportsDetailedPathways ? (
          <>
            <section className="mylearna-pathways-selected-strand-card" style={cardStyle}>
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
                      <div className="mylearna-pathways-selected-strand-description" style={{ color: "#64748b", lineHeight: 1.5 }}>
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
                      label: "Evidence examples",
                      value: String(currentStageEvidenceCount),
                      valueColor: "#1d4ed8",
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

                  <PathwayStageJourney
                    strand={selectedSubjectWorkspace}
                    activeStage={selectedWorkspaceActiveStage}
                    activeStageIndex={selectedWorkspaceActiveStageIndex}
                    currentStageIndex={selectedWorkspaceStageIndex}
                    unifiedPathwayStepStateIndex={unifiedPathwayStepStateIndex}
                    assessmentAttempts={assessmentAttempts}
                    selectedSubjectKey={selectedSubject.key}
                    selectedSubjectTitle={selectedSubject.title}
                    familyId={workspace.profile?.id || ""}
                    selectedLearnerId={selectedLearner?.id || ""}
                    returnPath={pathname}
                    capturePathBase={capturePathBase}
                    worksheetFilter={worksheetFilter}
                    onWorksheetFilterChange={setWorksheetFilter}
                    densityMode={densityMode}
                    onDensityModeChange={setDensityMode}
                    expandedStepId={expandedStepId}
                    onExpandedStepChange={setExpandedStepId}
                    regionalStageContext={regionalStageContext}
                    manualCompletions={manualCompletions}
                    onManualCompletionChange={handleManualCompletionChange}
                    onPathwayProgressSaved={handlePathwayProgressSaved}
                    onActiveStageChange={handleSelectWorkspaceStage}
                  />
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
  const worksheetResource = getWorksheetResourceForPathwayStep({
    pathwayStepId: step.pathwayStepId,
    stepKey: step.stepKey,
    subjectKey: "mathematics",
    strandKey: pathwayStepStrandKey,
    stageKey: step.stageKey,
  });
  const displayedStageTitle = worksheetResource?.stageDisplay || step.stageTitle;
  const stepStrandKey = pathwayStepStrandKey;
  const stepReturnHref = buildPathwayStepReturnHref({
    pathname: returnPath,
    subjectKey: "mathematics",
    strandKey: stepStrandKey,
    stageKey: step.stageKey,
    pathwayStepId: step.pathwayStepId,
    stepKey: step.stepKey,
    learnerId,
    detailPanelId: `pathway-step-${stepStrandKey}-${step.stageKey}-${step.id}`,
  });
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
      {worksheetResource ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: primary ? "flex-start" : "flex-end",
            alignItems: "center",
          }}
        >
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
        </div>
      ) : (
        <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>
          Open the full pathway card to add completed work for this step.
        </div>
      )}
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
    return null;
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

function PathwayStageJourney({
  strand,
  activeStage,
  activeStageIndex,
  currentStageIndex,
  unifiedPathwayStepStateIndex,
  assessmentAttempts,
  selectedSubjectKey,
  selectedSubjectTitle,
  familyId,
  selectedLearnerId,
  returnPath,
  capturePathBase,
  worksheetFilter,
  onWorksheetFilterChange,
  densityMode,
  onDensityModeChange,
  expandedStepId,
  onExpandedStepChange,
  regionalStageContext,
  manualCompletions,
  onManualCompletionChange,
  onPathwayProgressSaved,
  onActiveStageChange,
}: {
  strand: MathematicsDetailedStrandWorkspace;
  activeStage: MathematicsDetailedStrandStage | null;
  activeStageIndex: number;
  currentStageIndex: number;
  unifiedPathwayStepStateIndex: UnifiedPathwayStepStateIndex;
  assessmentAttempts: CleanAssessmentAttempt[];
  selectedSubjectKey: PathwaySubjectKey;
  selectedSubjectTitle: string;
  familyId: string;
  selectedLearnerId: string;
  returnPath: string;
  capturePathBase: string;
  worksheetFilter: PathwayWorksheetFilter;
  onWorksheetFilterChange: (filter: PathwayWorksheetFilter) => void;
  densityMode: PathwayDensityMode;
  onDensityModeChange: React.Dispatch<React.SetStateAction<PathwayDensityMode>>;
  expandedStepId: string | null;
  onExpandedStepChange: (stepId: string | null) => void;
  regionalStageContext: string | null;
  manualCompletions: ManualPathwayCompletionMap;
  onManualCompletionChange: (pathwayStepId: string, completed: boolean) => void;
  onPathwayProgressSaved: () => void;
  onActiveStageChange: (stageKey: string) => void;
}) {
  const activeStageTitle = activeStage
    ? getRegionalStageLabel(activeStage.key, regionalStageContext, activeStage.title)
    : "Choose a stage";
  const activeSummary =
    activeStage && activeStageIndex >= 0
      ? buildWorkspaceStageSummaryCounts(
          selectedSubjectKey,
          strand,
          activeStage,
          activeStageIndex,
          currentStageIndex,
          unifiedPathwayStepStateIndex,
        )
      : null;
  const completedCount = activeSummary ? activeSummary.secure : 0;
  const progressPercent =
    activeSummary && activeSummary.steps
      ? Math.round((completedCount / activeSummary.steps) * 100)
      : 0;
  const viewingCurrentStage = activeStageIndex === currentStageIndex;
  const viewedStagePrefix = viewingCurrentStage ? "Your current stage" : "Viewing stage";
  const viewedStageHelper = viewingCurrentStage
    ? "Choose one useful step, then let the pathway guide what comes next."
    : "Browsing this stage will not change the learner's current step or next step.";

  return (
    <div style={{ display: "grid", gap: 14 }} data-guidance-id="pathways-stage-flow">
      <section
        style={{
          border: "1px solid #E7EAF2",
          borderRadius: 18,
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
          padding: "16px",
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(180px, auto)",
            gap: 14,
            alignItems: "center",
          }}
          className="mylearna-pathway-stage-summary"
        >
          <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
            <div style={eyebrowStyle}>{viewedStagePrefix}</div>
            <h3 style={{ margin: 0, color: "#17204B", fontSize: "clamp(20px, 3vw, 25px)" }}>
              {activeStageTitle}
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.45 }}>
              {viewedStageHelper}
            </p>
          </div>
          <div
            aria-label={`${completedCount} of ${activeSummary?.steps || 0} steps complete`}
            style={{
              border: "1px solid #E7EAF2",
              borderRadius: 16,
              background: "#ffffff",
              padding: 12,
              display: "grid",
              gap: 8,
              minWidth: 180,
            }}
          >
            <strong style={{ color: "#0f172a", fontSize: 20 }}>{progressPercent}%</strong>
            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 750 }}>
              {completedCount} of {activeSummary?.steps || 0} steps complete
            </span>
            <div
              aria-hidden="true"
              style={{
                height: 7,
                borderRadius: 999,
                background: "#e2e8f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "#2F9D68",
                }}
              />
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Pathway stages"
          className="mylearna-pathway-stage-tabs"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {strand.stages.map((stage, stageIndex) => {
            const selected = activeStage?.key === stage.key;
            const tone = getPathwayStageTone(stageIndex, currentStageIndex);
            const stageTitle = getRegionalStageLabel(stage.key, regionalStageContext, stage.title);
            return (
              <button
                key={stage.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onActiveStageChange(stage.key)}
                style={{
                  border: selected ? `1px solid ${tone.border}` : "1px solid #E7EAF2",
                  background: selected ? tone.background : "#ffffff",
                  color: selected ? tone.text : "#334155",
                  borderRadius: 999,
                  padding: "9px 12px",
                  minHeight: 42,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {stageIndex < currentStageIndex ? "✓ " : stageIndex === currentStageIndex ? "● " : "○ "}
                {stageTitle}
                {selected && !viewingCurrentStage ? " (viewing)" : ""}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() =>
              onDensityModeChange((current) => (current === "compact" ? "full" : "compact"))
            }
            style={{ ...secondaryButtonStyle, minHeight: 36, padding: "7px 11px", fontSize: 13 }}
          >
            {densityMode === "compact" ? "Compact cards" : "Full cards"}
          </button>
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
                onClick={() => onWorksheetFilterChange(value)}
                style={{
                  border: selected ? "1px solid #2F9D68" : "1px solid #E7EAF2",
                  background: selected ? "#f0fdfa" : "#ffffff",
                  color: selected ? "#166534" : "#334155",
                  borderRadius: 999,
                  minHeight: 36,
                  padding: "7px 11px",
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {activeStage ? (
        <DetailedMathematicsStageCard
          strand={strand}
          stage={activeStage}
          stageIndex={activeStageIndex}
          currentStageIndex={currentStageIndex}
          unifiedPathwayStepStateIndex={unifiedPathwayStepStateIndex}
          assessmentAttempts={assessmentAttempts}
          selectedSubjectKey={selectedSubjectKey}
          selectedSubjectTitle={selectedSubjectTitle}
          familyId={familyId}
          selectedLearnerId={selectedLearnerId}
          returnPath={returnPath}
          capturePathBase={capturePathBase}
          worksheetFilter={worksheetFilter}
          densityMode={densityMode}
          expandedStepId={expandedStepId}
          onExpandedStepChange={onExpandedStepChange}
          regionalStageContext={regionalStageContext}
          manualCompletions={manualCompletions}
          onManualCompletionChange={onManualCompletionChange}
          onPathwayProgressSaved={onPathwayProgressSaved}
        />
      ) : null}
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
  const remainingCurrentFocusSteps = groups.currentLearningZone.filter(
    (step) => step.pathwayStepId !== currentStartStep?.pathwayStepId,
  );
  const remainingStarterSteps = starterSteps.filter(
    (step) => step.pathwayStepId !== currentStartStep?.pathwayStepId,
  );

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
            : `Start with ${strandTitle}`}
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
                Skills that may need another worksheet, resource, or evidence example.
              </div>
              <NumberRevealStepList
                steps={groups.needsPolish}
                learnerId={learnerId}
                returnPath={returnPath}
              />
            </section>
          ) : null}

          {remainingCurrentFocusSteps.length ? (
            <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
              <div style={{ ...eyebrowStyle, textTransform: "none", letterSpacing: 0 }}>Current focus</div>
              <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>
                Current focus and next steps.
              </div>
              <NumberRevealStepList
                steps={remainingCurrentFocusSteps}
                learnerId={learnerId}
                returnPath={returnPath}
              />
            </section>
          ) : null}

          {groups.secureHistory.length ? (
            <NumberRevealLazyStepSection
              title="Secure history"
              steps={groups.secureHistory}
              learnerId={learnerId}
              returnPath={returnPath}
              compact
            />
          ) : null}
          {groups.laterPathway.length ? (
            <NumberRevealLazyStepSection
              title="Later pathway"
              steps={groups.laterPathway}
              learnerId={learnerId}
              returnPath={returnPath}
              compact
            />
          ) : null}
        </>
      ) : (
        <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
          <div style={{ ...eyebrowStyle, textTransform: "none", letterSpacing: 0 }}>Start here</div>
          <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>
            Open the first useful step or use the pathway map.
          </div>
          {remainingStarterSteps.length ? (
            <NumberRevealStepList
              steps={remainingStarterSteps}
              learnerId={learnerId}
              returnPath={returnPath}
            />
          ) : null}
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
  assessmentAttempts,
  selectedSubjectKey,
  selectedSubjectTitle,
  familyId,
  selectedLearnerId,
  returnPath,
  capturePathBase,
  worksheetFilter,
  densityMode,
  expandedStepId,
  onExpandedStepChange,
  regionalStageContext,
  manualCompletions,
  onManualCompletionChange,
  onPathwayProgressSaved,
}: {
  strand: MathematicsDetailedStrandWorkspace;
  stage: MathematicsDetailedStrandStage;
  stageIndex: number;
  currentStageIndex: number;
  unifiedPathwayStepStateIndex: UnifiedPathwayStepStateIndex;
  assessmentAttempts: CleanAssessmentAttempt[];
  selectedSubjectKey: PathwaySubjectKey;
  selectedSubjectTitle: string;
  familyId: string;
  selectedLearnerId: string;
  returnPath: string;
  capturePathBase: string;
  worksheetFilter: PathwayWorksheetFilter;
  densityMode: PathwayDensityMode;
  expandedStepId: string | null;
  onExpandedStepChange: (stepId: string | null) => void;
  regionalStageContext: string | null;
  manualCompletions: ManualPathwayCompletionMap;
  onManualCompletionChange: (pathwayStepId: string, completed: boolean) => void;
  onPathwayProgressSaved: () => void;
}) {
  const tone = getPathwayStageTone(stageIndex, currentStageIndex);
  const stageDisplayTitle = getRegionalStageLabel(
    stage.key,
    regionalStageContext,
    stage.title,
  );
  const stageRelationshipLabel =
    stageIndex === currentStageIndex
      ? "Currently working here"
      : stageIndex < currentStageIndex
        ? "Earlier stage"
        : "Later stage";
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
        border: `1px solid ${tone.border}`,
        borderRadius: 18,
        background: "#ffffff",
        padding: 0,
        display: "grid",
        gap: 0,
        boxShadow: "0 8px 24px rgba(23,32,75,0.045)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          padding: "8px 10px",
          textAlign: "left",
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
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18 }}>
              {stageDisplayTitle}
            </h3>
          </div>

          <div style={{ color: tone.text, fontSize: 12, fontWeight: 800 }}>
            {stageRelationshipLabel}
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>{stage.helper}</div>
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
      </div>

      <div
        id={panelId}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 10,
          borderTop: "1px solid #E7EAF2",
          padding: 10,
        }}
      >
        {filteredSteps.length ? filteredSteps.map((step) => {
          const stepIndex = stage.steps.findIndex((candidate) => candidate.id === step.id);
          const detailPanelId = `pathway-step-${strand.key}-${stage.key}-${step.id}`;
          const manualPathwayStepId =
            getDetailedStepCanonicalPathwayStepId({
              subjectKey: selectedSubjectKey,
              strand,
              stage,
              step,
            }) || "";
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
            assessmentAttempts={assessmentAttempts}
            selectedSubjectKey={selectedSubjectKey}
            selectedSubjectTitle={selectedSubjectTitle}
            familyId={familyId}
            selectedLearnerId={selectedLearnerId}
            returnPath={returnPath}
            capturePathBase={capturePathBase}
            isOpen={expandedStepId === detailPanelId}
            onToggle={() =>
            onExpandedStepChange(expandedStepId === detailPanelId ? null : detailPanelId)
            }
            densityMode={densityMode}
            manualCompletion={
              manualCompletions[
                buildManualPathwayCompletionKey(selectedLearnerId, manualPathwayStepId)
              ] || null
            }
            onManualCompletionChange={onManualCompletionChange}
            onPathwayProgressSaved={onPathwayProgressSaved}
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
  assessmentAttempts,
  selectedSubjectKey,
  selectedSubjectTitle,
  familyId,
  selectedLearnerId,
  returnPath,
  capturePathBase,
  isOpen,
  onToggle,
  densityMode,
  manualCompletion,
  onManualCompletionChange,
  onPathwayProgressSaved,
}: {
  strand: MathematicsDetailedStrandWorkspace;
  stage: MathematicsDetailedStrandStage;
  stageIndex: number;
  currentStageIndex: number;
  step: MathematicsDetailedStrandStep;
  stepIndex: number;
  unifiedPathwayStepStateIndex: UnifiedPathwayStepStateIndex;
  assessmentAttempts: CleanAssessmentAttempt[];
  selectedSubjectKey: PathwaySubjectKey;
  selectedSubjectTitle: string;
  familyId: string;
  selectedLearnerId: string;
  returnPath: string;
  capturePathBase: string;
  isOpen: boolean;
  onToggle: () => void;
  densityMode: PathwayDensityMode;
  manualCompletion: ManualPathwayCompletionRecord | null;
  onManualCompletionChange: (pathwayStepId: string, completed: boolean) => void;
  onPathwayProgressSaved: () => void;
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
  const canonicalStepKey = useMemo(
    () => buildPathwayRegistryStepKey(step.title, step.id),
    [step.id, step.title],
  );
  const canonicalPathwayStepId =
    statusPathwayStepId ||
    resolveCanonicalPathwayStepIdFromParts({
      subjectKey: selectedSubjectKey,
      pathwayKey: strandKey,
      stageKey,
      stepKey: canonicalStepKey,
      stepNumber: String(step.id),
    });
  const registryStep = canonicalPathwayStepId
    ? getAllPathwaySteps().find((item) => item.id === canonicalPathwayStepId) || null
    : null;
  const stepUnifiedState = getUnifiedPathwayStepState(
    unifiedPathwayStepStateIndex,
    registryStep?.id || canonicalPathwayStepId,
  );
  const progressStory = buildExplainableProgressStory({
    pathwayStepId: registryStep?.id || canonicalPathwayStepId || "",
    stepState: stepUnifiedState,
    attempts: assessmentAttempts,
  });
  const confidenceStatusLabel = stepUnifiedState?.assessmentConfidence || "Not checked yet";
  const latestEvidenceEntry = stepUnifiedState?.latestEvidenceEntry ?? null;
  const evidenceProgressMeta =
    progressStory.currentProgressSource !== "parent-confirmation" &&
    stepUnifiedState?.latestStatusSource === "evidence"
      ? getWorksheetEvidenceProgressMeta(latestEvidenceEntry)
      : null;
  const statusChipMeta =
    progressStory.currentProgressSource === "parent-confirmation"
      ? parentProgressChipMeta[progressStory.currentProgress]
      : evidenceProgressMeta ||
    (exactStepContext && confidenceStatusLabel === "Not checked yet"
      ? statusMeta["Not started"]
      : meta);
  const evidenceLinkedCount = stepUnifiedState?.linkedEvidenceCount || 0;
  const worksheetResource = getWorksheetResourceForPathwayStep({
    pathwayStepId: canonicalPathwayStepId,
    stepKey: canonicalStepKey,
    subjectKey: selectedSubjectKey,
    strandKey,
    stageKey,
  });
  const visibleThumbnail = getVisiblePathwayThumbnail(worksheetResource, {
    isStaffPreview: false,
  });
  const displayedStageTitle = worksheetResource?.stageDisplay || stage.title;
  const captureReturnTo = buildPathwayStepReturnHref({
    pathname: returnPath,
    subjectKey: selectedSubjectKey,
    strandKey,
    stageKey,
    pathwayStepId: canonicalPathwayStepId,
    stepKey: canonicalStepKey,
    learnerId: selectedLearnerId,
    detailPanelId,
  });
  const exactStepAssessment = exactStepContext
    ? getStepAssessmentForPathwayStep({
        pathwayStepId: canonicalPathwayStepId,
        stepKey: canonicalStepKey,
        strandKey,
      })
    : null;
  const exactStepPractice = exactStepContext
    ? getStepPracticeForPathwayStep({
        pathwayStepId: canonicalPathwayStepId,
        stepKey: canonicalStepKey,
        strandKey,
      })
    : null;
  const assessmentHref = exactStepAssessment
    ? `/assessments/number?${new URLSearchParams({
        source: "my-pathways",
        stepAssessmentKey: exactStepAssessment.key,
        subjectKey: exactStepAssessment.subjectKey,
        strandKey: exactStepAssessment.strandKey,
        stageKey: exactStepAssessment.stageKey,
        pathwayStepId: exactStepAssessment.pathwayStepId,
        stepKey: exactStepAssessment.stepKey,
        progressionBandKey: exactStepAssessment.progressionBandKey,
        itemBankKey: exactStepAssessment.parentItemBankKey,
        learnerId: selectedLearnerId,
        returnTo: captureReturnTo,
      }).toString()}`
    : "";
  const practiceHref = exactStepPractice
    ? `/practice/number-targeted?${new URLSearchParams({
        source: "my-pathways",
        stepPracticeKey: exactStepPractice.key,
        subjectKey: exactStepPractice.subjectKey,
        strandKey: exactStepPractice.strandKey,
        stageKey: exactStepPractice.stageKey,
        pathwayStepId: exactStepPractice.pathwayStepId,
        stepKey: exactStepPractice.stepKey,
        learnerId: selectedLearnerId,
        returnTo: captureReturnTo,
      }).toString()}`
    : "";
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
  const worksheetStatus = worksheetResource ? "Worksheet ready" : "No worksheet";
  const worksheetFileName = worksheetResource?.fileName || "";
  const hasEvidenceAttachment =
    Boolean(latestEvidenceEntry?.imageUrl) ||
    Boolean(latestEvidenceEntry?.attachmentUrls.length);
  const latestEvidenceDate = formatWorksheetEvidenceDate(latestEvidenceEntry);
  const isStepSecure =
    isUnifiedPathwayStepComplete(stepUnifiedState) ||
    evidenceProgressMeta?.label === "Goal achieved" ||
    evidenceProgressMeta?.label === "Goal achieved + extension" ||
    status === "Secure";
  const manualComplete = Boolean(manualCompletion?.completed);
  const stepComplete = manualComplete || isStepSecure;
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
        stageKey: nextDetailedStep.stage.key,
        pathwayStepId: resolveCanonicalPathwayStepIdFromParts({
          subjectKey: selectedSubjectKey,
          pathwayKey: strandKey,
          stageKey: nextDetailedStep.stage.key,
          stepKey: buildPathwayRegistryStepKey(
            nextDetailedStep.step.title,
            nextDetailedStep.step.id,
          ),
          stepNumber: String(nextDetailedStep.step.id),
        }),
        stepKey: buildPathwayRegistryStepKey(
          nextDetailedStep.step.title,
          nextDetailedStep.step.id,
        ),
        learnerId: selectedLearnerId,
        detailPanelId: `pathway-step-${strand.key}-${nextDetailedStep.stage.key}-${nextDetailedStep.step.id}`,
      })
    : "";

  return (
    <article
      className="mylearna-pathway-step-card"
      data-guidance-id="pathways-step-card"
      style={{
        border: stepComplete
          ? "1px solid #dbe3ef"
          : evidenceProgressMeta
          ? `1px solid ${evidenceProgressMeta.border}`
          : "1px solid #E7EAF2",
        borderRadius: 14,
        background: stepComplete
          ? "#F8FAFC"
          : evidenceProgressMeta
            ? evidenceProgressMeta.fill
            : "#ffffff",
        padding: densityMode === "compact" ? "11px 12px" : "14px 15px",
        display: "grid",
        gap: densityMode === "compact" ? 9 : 11,
        opacity: stepComplete ? 0.78 : 1,
        boxShadow: stepComplete
          ? "none"
          : evidenceProgressMeta
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

        <div className="mylearna-pathway-step-status-row" style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
          {isStepSecure ? (
            <span
              style={{
                border: "1px solid #bbf7d0",
                borderRadius: 999,
                background: "#f0fdf4",
                color: "#166534",
                padding: "5px 8px",
                minHeight: 34,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 12,
                fontWeight: 750,
                lineHeight: 1.2,
              }}
            >
              Complete
            </span>
          ) : (
            <label
              onClick={(event) => event.stopPropagation()}
              style={{
                border: manualComplete ? "1px solid #bbf7d0" : "1px solid #dbeafe",
                borderRadius: 999,
                background: manualComplete ? "#f0fdf4" : "#ffffff",
                color: manualComplete ? "#166534" : "#1d4ed8",
                padding: "5px 8px",
                minHeight: 34,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 750,
                lineHeight: 1.2,
              }}
            >
              <input
                type="checkbox"
                checked={manualComplete}
                onChange={(event) =>
                  onManualCompletionChange(canonicalPathwayStepId || "", event.target.checked)
                }
                aria-label={`${manualComplete ? "Complete" : "Mark complete"}: ${step.title}`}
                style={{ width: 16, height: 16, margin: 0, accentColor: "#2F9D68" }}
              />
              <span>{manualComplete ? "Complete" : "Mark complete"}</span>
            </label>
          )}
            <div
              data-guidance-id="pathways-progress-status"
              title={
                progressStory.currentProgressSource === "parent-confirmation"
                  ? "Confirmed by you."
                  : evidenceProgressMeta?.helper ||
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
                {progressStory.currentProgressSource === "parent-confirmation"
                  ? progressStory.currentProgress
                  : evidenceProgressMeta
                  ? evidenceProgressMeta.label
                  : exactStepContext && confidenceStatusLabel !== "Not checked yet"
                    ? getCustomerPathwayStatusLabel(confidenceStatusLabel)
                    : getCustomerPathwayStatusLabel(status)}
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
        </div>
      </div>

      {visibleThumbnail ? (
        <figure
          style={{
            margin: 0,
            border: "1px solid #E7EAF2",
            borderRadius: 14,
            overflow: "hidden",
            background: "#F8FAFC",
            display: "grid",
            gap: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={visibleThumbnail.src}
            alt={visibleThumbnail.alt}
            style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }}
          />
          {visibleThumbnail.staffOnly ? (
            <figcaption
              style={{
                padding: "6px 9px",
                color: "#92400e",
                background: "#fffbeb",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {visibleThumbnail.label || "Hidden from customers"}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <CleanPathwayStepActionRow
        captureHref={captureHref}
        practiceHref={practiceHref}
        assessmentHref={assessmentHref}
        nextStepHref={isStepSecure ? nextDetailedStepHref : ""}
        autoCheckStatus={progressStory.latestCheck?.factualStatus || null}
        parentProgress={progressStory.currentProgress}
        emphasizePrimary={stageIndex === currentStageIndex && stepIndex === 0}
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
        confidenceStatusLabel={confidenceStatusLabel}
        isExactStepContext={exactStepContext}
        worksheetResource={worksheetResource}
        latestEvidenceEntry={stepUnifiedState?.latestEvidenceEntry ?? null}
        manualComplete={stepComplete}
        onManualCompletionChange={
          canonicalPathwayStepId
            ? (completed) => onManualCompletionChange(canonicalPathwayStepId, completed)
            : undefined
        }
      />

      {isOpen && registryStep ? (
        <CleanPathwayProgressConfirmation
          familyId={familyId}
          learnerId={selectedLearnerId}
          subjectKey={registryStep.subjectKey}
          stageKey={registryStep.stageKey as CleanAssessmentStageKey}
          strandKey={registryStep.strandKey}
          stepKey={registryStep.stepKey}
          pathwayStepId={registryStep.id}
          confirmedStatus={stepUnifiedState?.assessmentStatusRecord?.status || null}
          evidenceSuggestion={
            stepUnifiedState?.assessmentStatusRecord
              ? null
              : getWorksheetEvidenceProgressLabel(latestEvidenceEntry)
          }
          onSaved={onPathwayProgressSaved}
        />
      ) : null}

      {isOpen ? <ExplainableProgressStorySection story={progressStory} /> : null}

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
          <PathwayStepGuidanceSection title="Support activity" content={step.practiceActivity} />
          <PathwayStepGuidanceListSection title="Evidence idea" items={step.evidenceExamples.slice(0, 2)} />
          <PathwayStepGuidanceSection
            title="Check later"
            content={step.assessmentCheck}
          />
        </div>
        <details className="mylearna-pathway-guidance-mobile">
          <summary>More learning support</summary>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <PathwayStepGuidanceSection title="What this means" content={step.meaning} />
            <PathwayStepGuidanceSection title="Learning goal" content={step.learningIntention} />
            <PathwayStepGuidanceListSection title="Success looks like" items={step.successCriteria} />
            <PathwayStepGuidanceSection title="Support activity" content={step.practiceActivity} />
            <PathwayStepGuidanceListSection title="Evidence idea" items={step.evidenceExamples.slice(0, 2)} />
          </div>
        </details>
      </div>
    </article>
  );
}

function getReturnedPathwayDetailPanelId() {
  if (typeof window === "undefined") return "";
  const panelId = window.location.hash.replace(/^#/, "");
  return panelId.startsWith("pathway-step-") ? panelId : "";
}

function formatProgressStoryDate(value: string | null) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function nextActionCopy(action: ExplainableProgressNextAction) {
  switch (action) {
    case "confirm-progress":
      return "Confirm progress";
    case "more-support":
      return "Use the support activity";
    case "check-understanding":
      return "Check understanding";
    case "next-step":
      return "Continue to the next step";
    case "review-this-step":
      return "Review this step and update progress";
    case "add-completed-work":
    default:
      return "Add completed work";
  }
}

function ExplainableProgressStorySection({
  story,
}: {
  story: ReturnType<typeof buildExplainableProgressStory>;
}) {
  const confirmedDate = formatProgressStoryDate(story.currentProgressConfirmedAt);
  const observedDate = formatProgressStoryDate(story.latestObservedAt);
  const evidenceDate = formatProgressStoryDate(story.latestEvidence?.observedOn || null);
  const checkDate = formatProgressStoryDate(story.latestCheck?.completedAt || null);
  const checkSummary = story.latestCheck
    ? story.latestCheck.itemCount > 0
      ? `${story.latestCheck.correctCount} of ${story.latestCheck.itemCount} correct`
      : story.latestCheck.factualStatus
    : null;

  return (
    <section
      aria-label="Explainable progress"
      style={{
        border: "1px solid #DDD6FE",
        borderRadius: 16,
        background: "#FAF9FF",
        padding: 14,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <div style={eyebrowStyle}>Current progress</div>
        <strong style={{ color: "#17204B", fontSize: 18 }}>{story.currentProgress}</strong>
        {story.currentProgressSource === "parent-confirmation" ? (
          <span style={{ color: "#5B6478", fontSize: 13 }}>
            Confirmed by you{confirmedDate ? ` · ${confirmedDate}` : ""}
          </span>
        ) : (
          <span style={{ color: "#5B6478", fontSize: 13 }}>
            No progress confirmation has been saved yet.
          </span>
        )}
      </div>

      <div style={{ display: "grid", gap: 7 }}>
        <div style={eyebrowStyle}>Why this is shown</div>
        {story.supportingEvidenceCount ? (
          <div style={{ color: "#334155", fontSize: 13 }}>
            {story.supportingEvidenceCount} supporting learning {story.supportingEvidenceCount === 1 ? "record" : "records"}
            {story.latestEvidence
              ? ` · Latest: ${story.latestEvidence.title}${evidenceDate ? ` · ${evidenceDate}` : ""}`
              : ""}
          </div>
        ) : null}
        {story.latestObservedProgress ? (
          <div style={{ color: "#334155", fontSize: 13 }}>
            Latest observed progress: <strong>{story.latestObservedProgress}</strong>
            {observedDate ? ` · ${observedDate}` : ""}
          </div>
        ) : null}
        {story.completedCheckCount ? (
          <div style={{ color: "#334155", fontSize: 13 }}>
            {story.completedCheckCount} completed {story.completedCheckCount === 1 ? "check" : "checks"}
            {checkSummary ? ` · Latest: ${checkSummary}` : ""}
            {checkDate ? ` · ${checkDate}` : ""}
          </div>
        ) : null}
        {!story.supportingEvidenceCount && !story.latestObservedProgress && !story.completedCheckCount ? (
          <div style={{ color: "#5B6478", fontSize: 13 }}>
            No supporting learning records or completed checks have been saved yet.
          </div>
        ) : null}
      </div>

      {story.hasSignalConflict && story.conflictExplanation ? (
        <p
          style={{
            margin: 0,
            borderLeft: "3px solid #F59E0B",
            paddingLeft: 10,
            color: "#854D0E",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {story.conflictExplanation}
        </p>
      ) : null}

      <div style={{ display: "grid", gap: 3 }}>
        <div style={eyebrowStyle}>Next</div>
        <strong style={{ color: "#17204B", fontSize: 14 }}>{nextActionCopy(story.nextAction)}</strong>
      </div>
    </section>
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
  return <PathwaysWorkspaceBody />;
}
