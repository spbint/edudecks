"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import { resolveCurriculumFrameworkMap } from "@/lib/clean/curriculum/frameworkMaps";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import {
  buildPathwayCaptureSearchParams,
  MY_PATHWAYS_SOURCE,
  parsePathwayContextFromNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import type { Learner } from "@/lib/clean/learners/types";
import {
  MATHEMATICS_DOMAIN_CARDS,
  NUMBER_PATHWAY_STAGES,
  type NumberPathwayStage,
  type NumberPathwayStep,
  type PathwayProgressStatus,
  type PathwayStageKey,
  getDemoPathwayStatus,
  getNumberPathwayStepGuidance,
  getStageProgressionLabel,
  inferPathwayStageFromYearLevel,
} from "@/lib/clean/pathways/mathematicsNumberPrototype";
import {
  OPERATIONS_AND_CALCULATION_WORKSPACE,
} from "@/lib/clean/pathways/mathematicsOperationsPrototype";
import { FRACTIONS_DECIMALS_PERCENTAGES_WORKSPACE } from "@/lib/clean/pathways/mathematicsFractionsPrototype";
import type {
  MathematicsDetailedStrandStage,
  MathematicsDetailedStrandStep,
  MathematicsDetailedStrandWorkspace,
} from "@/lib/clean/pathways/mathematicsDetailedStrands";

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

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  padding: 16,
  display: "grid",
  gap: 8,
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 16,
  background: "#f8fbff",
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

const NUMBER_AND_PLACE_VALUE_STRAND_KEY = "number-and-place-value";

const MATHEMATICS_STRAND_GUIDE_CONFIG: Record<
  string,
  MathematicsDetailedStrandWorkspace
> = {
  "operations-and-calculation": OPERATIONS_AND_CALCULATION_WORKSPACE,
  "fractions-decimals-percentages": FRACTIONS_DECIMALS_PERCENTAGES_WORKSPACE,
};

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

const disabledButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  opacity: 0.72,
  cursor: "default",
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
};

type SavedPathwayStatusMap = Record<string, PathwayProgressStatus>;

function safe(value: string | null | undefined) {
  return (value || "").trim();
}

function getLearnerLabel(learner: Learner | null) {
  if (!learner) return "No learner selected";
  return learner.preferredName || learner.firstName;
}

function splitCountryAndAuthorityLabels(countryAuthorityLabel: string, countryLabel: string) {
  const normalizedCountry = safe(countryLabel);
  const normalizedAuthority = safe(countryAuthorityLabel);

  if (!normalizedAuthority) {
    return {
      countryLabel: normalizedCountry || "Not recorded in MyLearna yet.",
      authorityLabel: "Not recorded in MyLearna yet.",
    };
  }

  if (normalizedCountry && normalizedAuthority.startsWith(`${normalizedCountry} / `)) {
    return {
      countryLabel: normalizedCountry,
      authorityLabel:
        normalizedAuthority.slice(normalizedCountry.length + 3) || "Not recorded in MyLearna yet.",
    };
  }

  return {
    countryLabel: normalizedCountry || "Not recorded in MyLearna yet.",
    authorityLabel: normalizedAuthority || "Not recorded in MyLearna yet.",
  };
}

function getStageTone(stage: PathwayStageKey, currentStage: PathwayStageKey) {
  const label = getStageProgressionLabel(stage, currentStage);

  if (label === "Current focus") {
    return {
      badge: "Current focus",
      border: "#93c5fd",
      background: "#eff6ff",
      shadow: "0 10px 24px rgba(59,130,246,0.10)",
      text: "#1d4ed8",
    };
  }

  if (label === "Next progression") {
    return {
      badge: "Next progression",
      border: "#ddd6fe",
      background: "#faf5ff",
      shadow: "0 8px 20px rgba(109,40,217,0.06)",
      text: "#6d28d9",
    };
  }

  return {
    badge: label,
    border: "#e2e8f0",
    background: "#ffffff",
    shadow: "0 4px 14px rgba(15,23,42,0.04)",
    text: "#64748b",
  };
}

function buildPathwayStepKey(pathwayKey: string, stageKey: string, stepNumber: string) {
  return `${safe(pathwayKey)}::${safe(stageKey)}::${safe(stepNumber)}`;
}

function mapObservedSkillStatusToPathwayStatus(
  observedSkillStatus: string | null | undefined,
): PathwayProgressStatus | null {
  const normalizedStatus = safe(observedSkillStatus).toLowerCase();

  if (normalizedStatus === "still developing") {
    return "Practising";
  }

  if (normalizedStatus === "developing") {
    return "Evidence started";
  }

  if (normalizedStatus === "secure" || normalizedStatus === "strong") {
    return "Secure";
  }

  return null;
}

function getDisplayedPathwayStatus(
  stepId: number,
  stageKey: PathwayStageKey,
  currentStage: PathwayStageKey,
  savedPathwayStatuses: SavedPathwayStatusMap,
) {
  const savedStatus =
    savedPathwayStatuses[buildPathwayStepKey("number", stageKey, String(stepId))];

  if (savedStatus) {
    return {
      status: savedStatus,
      fromSavedEvidence: true,
    };
  }

  return {
    status: getDemoPathwayStatus(stepId, stageKey, currentStage),
    fromSavedEvidence: false,
  };
}

function buildStageSummaryCounts(
  stage: NumberPathwayStage,
  currentStage: PathwayStageKey,
  savedPathwayStatuses: SavedPathwayStatusMap,
): StageSummaryCounts {
  return stage.steps.reduce(
    (totals, step) => {
      const { status } = getDisplayedPathwayStatus(
        step.id,
        stage.key,
        currentStage,
        savedPathwayStatuses,
      );

      if (status === "Secure") {
        totals.secure += 1;
      } else if (status === "Ready to assess") {
        totals.readyToAssess += 1;
      } else if (status === "Evidence started") {
        totals.evidenceStarted += 1;
      }

      return totals;
    },
    {
      steps: stage.steps.length,
      secure: 0,
      readyToAssess: 0,
      evidenceStarted: 0,
    },
  );
}

function getDetailedStageTone(stageIndex: number, currentStageIndex: number) {
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
    badge: "Coming next",
    border: "#e2e8f0",
    background: "#ffffff",
    shadow: "0 4px 14px rgba(15,23,42,0.04)",
    text: "#64748b",
  };
}

function getDetailedDisplayedPathwayStatus(
  pathwayKey: string,
  stage: MathematicsDetailedStrandStage,
  stageIndex: number,
  currentStageIndex: number,
  step: MathematicsDetailedStrandStep,
  stepIndex: number,
  savedPathwayStatuses: SavedPathwayStatusMap,
): {
  status: PathwayProgressStatus;
  fromSavedEvidence: boolean;
} {
  const savedStatus = savedPathwayStatuses[buildPathwayStepKey(pathwayKey, stage.key, String(step.id))];

  if (savedStatus) {
    return {
      status: savedStatus,
      fromSavedEvidence: true,
    };
  }

  if (stageIndex < currentStageIndex) {
    return {
      status: stepIndex === stage.steps.length - 1 ? "Ready to assess" : "Secure",
      fromSavedEvidence: false,
    };
  }

  if (stageIndex === currentStageIndex) {
    return {
      status: stepIndex === 0 ? "Evidence started" : "Practising",
      fromSavedEvidence: false,
    };
  }

  if (stageIndex === currentStageIndex + 1) {
    return {
      status: stepIndex === 0 ? "Practising" : "Not started",
      fromSavedEvidence: false,
    };
  }

  return {
    status: "Not started" as PathwayProgressStatus,
    fromSavedEvidence: false,
  };
}

function buildDetailedStageSummaryCounts(
  pathwayKey: string,
  stage: MathematicsDetailedStrandStage,
  stageIndex: number,
  currentStageIndex: number,
  savedPathwayStatuses: SavedPathwayStatusMap,
) {
  return stage.steps.reduce(
    (totals, step, stepIndex) => {
      const { status } = getDetailedDisplayedPathwayStatus(
        pathwayKey,
        stage,
        stageIndex,
        currentStageIndex,
        step,
        stepIndex,
        savedPathwayStatuses,
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
      secure: 0,
      readyToAssess: 0,
      evidenceStarted: 0,
      practising: 0,
      notStarted: 0,
    },
  );
}

function PathwaysWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const [selectedLearnerIdOverride, setSelectedLearnerIdOverride] = useState("");
  const [selectedMathematicsStrandKey, setSelectedMathematicsStrandKey] = useState(
    NUMBER_AND_PLACE_VALUE_STRAND_KEY,
  );
  const [stageOpenOverrides, setStageOpenOverrides] = useState<Record<string, boolean>>({});
  const [savedPathwayStatuses, setSavedPathwayStatuses] = useState<SavedPathwayStatusMap>({});
  const mathematicsDetailWorkspaceRef = useRef<HTMLDivElement | null>(null);

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

  const selectedLearnerLabel = getLearnerLabel(selectedLearner);
  const hasMultipleLearners = workspace.learners.length > 1;
  const currentStageFocus = useMemo(
    () => inferPathwayStageFromYearLevel(selectedLearner?.yearLevel),
    [selectedLearner?.yearLevel],
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
  const selectedMathematicsDomain =
    MATHEMATICS_DOMAIN_CARDS.find((domain) => domain.key === selectedMathematicsStrandKey) ||
    MATHEMATICS_DOMAIN_CARDS[0];
  const selectedMathematicsWorkspace =
    MATHEMATICS_STRAND_GUIDE_CONFIG[selectedMathematicsStrandKey] || null;

  useEffect(() => {
    let active = true;

    async function loadSavedPathwayStatuses() {
      if (
        !workspace.profile ||
        workspace.schemaMissing ||
        workspace.requiresFamilyCreation ||
        !selectedLearnerId
      ) {
        setSavedPathwayStatuses({});
        return;
      }

      try {
        const evidenceEntries = await listCleanEvidenceEntries(workspace.profile.id, {
          learnerId: selectedLearnerId,
        });

        if (!active) return;

        const nextSavedStatuses: SavedPathwayStatusMap = {};

        for (const entry of evidenceEntries) {
          const pathwayContext = parsePathwayContextFromNodeIds(entry.curriculumNodeIds);
          if (!pathwayContext || pathwayContext.source !== MY_PATHWAYS_SOURCE) continue;

          const pathwayKey = safe(pathwayContext.pathwayKey);
          const stageKey = safe(pathwayContext.stageKey);
          const stepNumber = safe(pathwayContext.stepNumber);
          const mappedStatus = mapObservedSkillStatusToPathwayStatus(
            pathwayContext.observedSkillStatus,
          );

          if (!pathwayKey || !stageKey || !stepNumber || !mappedStatus) {
            continue;
          }

          const statusKey = buildPathwayStepKey(pathwayKey, stageKey, stepNumber);
          if (!nextSavedStatuses[statusKey]) {
            nextSavedStatuses[statusKey] = mappedStatus;
          }
        }

        setSavedPathwayStatuses(nextSavedStatuses);
      } catch {
        if (!active) return;
        setSavedPathwayStatuses({});
      }
    }

    void loadSavedPathwayStatuses();

    return () => {
      active = false;
    };
  }, [
    selectedLearnerId,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  const currentStageSnapshot = useMemo(
    () =>
      NUMBER_PATHWAY_STAGES.find((stage) => stage.key === currentStageFocus)?.steps.reduce(
        (totals, step) => {
          const { status } = getDisplayedPathwayStatus(
            step.id,
            currentStageFocus,
            currentStageFocus,
            savedPathwayStatuses,
          );

          if (status === "Secure") {
            totals.secure += 1;
            return totals;
          }

          if (status === "Ready to assess") {
            totals.readyToAssess += 1;
            return totals;
          }

          if (status === "Evidence started") {
            totals.evidenceStarted += 1;
            return totals;
          }

          if (status === "Practising") {
            totals.practising += 1;
            return totals;
          }

          totals.notStarted += 1;
          return totals;
        },
        {
          secure: 0,
          readyToAssess: 0,
          evidenceStarted: 0,
          practising: 0,
          notStarted: 0,
        },
      ) || {
        secure: 0,
        readyToAssess: 0,
        evidenceStarted: 0,
        practising: 0,
        notStarted: 0,
      },
    [currentStageFocus, savedPathwayStatuses],
  );
  const selectedDetailedWorkspaceStageIndex = useMemo(() => {
    if (!selectedMathematicsWorkspace) return -1;
    return Math.max(
      0,
      selectedMathematicsWorkspace.stages.findIndex(
        (stage) => stage.key === selectedMathematicsWorkspace.currentFocusStageKey,
      ),
    );
  }, [selectedMathematicsWorkspace]);
  const selectedDetailedWorkspaceSnapshot = useMemo(() => {
    if (!selectedMathematicsWorkspace) return null;
    const currentStage =
      selectedMathematicsWorkspace.stages[selectedDetailedWorkspaceStageIndex] || null;
    if (!currentStage) return null;

    return buildDetailedStageSummaryCounts(
      selectedMathematicsWorkspace.key,
      currentStage,
      selectedDetailedWorkspaceStageIndex,
      selectedDetailedWorkspaceStageIndex,
      savedPathwayStatuses,
    );
  }, [
    savedPathwayStatuses,
    selectedDetailedWorkspaceStageIndex,
    selectedMathematicsWorkspace,
  ]);

  const capturePathBase = pathname.startsWith("/clean-my-pathways")
    ? "/clean-my-capture"
    : "/my-capture";

  function handleSelectMathematicsStrand(nextStrandKey: string) {
    setSelectedMathematicsStrandKey(nextStrandKey);

    const workspaceEl = mathematicsDetailWorkspaceRef.current;
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
                <div style={eyebrowStyle}>Pathway dashboard</div>
                <h1 style={{ margin: 0, fontSize: 30, color: "#0f172a" }}>My Pathways</h1>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: 16 }}>
                  Follow clear learning pathways that show what comes next, how to practise
                  it, and how to capture evidence along the way.
                </p>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Pathways help you see where a learner is, what comes next, and how
                  learning can turn into evidence for reports.
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
                  Prototype view - saved pathway evidence can now update step badges, and
                  broader assessment connections will keep developing.
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
                      <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                        Pathway view for the current learner.
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <strong style={{ color: "#0f172a" }}>
                      Add a learner before building a pathway view.
                    </strong>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      You can still explore the prototype pathway while learner details are
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
                <div style={eyebrowStyle}>Current mathematics focus</div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>Number pathway</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Number is the first detailed MyLearna pathway because it builds the
                  foundation for later mathematics.
                </div>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  Current stage focus:{" "}
                  <strong style={{ color: "#0f172a" }}>
                    {
                      NUMBER_PATHWAY_STAGES.find((stage) => stage.key === currentStageFocus)
                        ?.title
                    }
                  </strong>
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
                    : "Selected framework context will connect to My Settings as this pathway layer develops."}
                </div>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  {frameworkDetails?.settingsHint ||
                    "Future pathway guidance can later align with the framework selected in My Settings."}
                </div>
              </div>

              <div style={helperCardStyle}>
                <div style={eyebrowStyle}>Pathway loop</div>
                <strong style={{ color: "#0f172a" }}>
                  {"Pathway -> Practise -> Assess -> Evidence -> Curriculum coverage -> Reports / Outputs"}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  MyLearna is designed to guide the next step rather than only store the
                  record after the fact.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
              <div style={eyebrowStyle}>Mathematics F-10 / K-10 domain map</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>Mathematics pathway overview</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                This prototype shows the wider mathematics pathway map while highlighting
                Number as the foundational detailed strand, with Operations and calculation
                and Fractions, decimals, and percentages now added as detailed follow-on strands.
              </p>
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                Choose one strand to explore. The selected strand opens in the focused
                workspace below, so the page stays calm and readable as more detailed guides
                are added.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {MATHEMATICS_DOMAIN_CARDS.map((domain) => {
                const detailed = domain.status !== "coming-later";
                const firstDetailed = domain.status === "first-detailed";
                const selected = domain.key === selectedMathematicsStrandKey;

                return (
                  <button
                    key={domain.key}
                    type="button"
                    onClick={() => handleSelectMathematicsStrand(domain.key)}
                    aria-pressed={selected}
                    style={{
                      border: selected
                        ? "1px solid #3b82f6"
                        : detailed
                          ? "1px solid #93c5fd"
                          : "1px solid #e2e8f0",
                      borderRadius: 18,
                      background: selected ? "#eff6ff" : detailed ? "#f8fbff" : "#ffffff",
                      padding: 18,
                      display: "grid",
                      gap: 10,
                      width: "100%",
                      minWidth: 0,
                      textAlign: "left",
                      cursor: "pointer",
                      boxShadow: selected
                        ? "0 14px 30px rgba(59,130,246,0.14)"
                        : detailed
                          ? "0 12px 28px rgba(59,130,246,0.08)"
                        : "0 6px 18px rgba(15,23,42,0.04)",
                      transition: "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong style={{ color: "#0f172a", fontSize: 16, minWidth: 0 }}>
                        {domain.title}
                      </strong>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                        }}
                      >
                        <span
                          style={{
                            border: detailed ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                            background: detailed ? "#eff6ff" : "#f8fafc",
                            color: detailed ? "#1d4ed8" : "#64748b",
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {firstDetailed
                            ? "First detailed strand"
                            : detailed
                              ? "Detailed strand"
                              : "Coming later"}
                        </span>
                        {selected ? (
                          <span
                            style={{
                              border: "1px solid #93c5fd",
                              background: "#ffffff",
                              color: "#1d4ed8",
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            Selected
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>{domain.description}</div>
                    <div style={{ color: "#64748b", lineHeight: 1.6 }}>{domain.whyItMatters}</div>
                    <div style={{ color: "#1d4ed8", fontSize: 13, fontWeight: 700 }}>
                      {selected
                        ? "Showing this strand below"
                        : detailed
                          ? "Open this detailed strand"
                          : "Preview this strand"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section
          ref={mathematicsDetailWorkspaceRef}
          tabIndex={-1}
          style={{ ...cardStyle, scrollMarginTop: 24, outline: "none" }}
        >
          {selectedMathematicsStrandKey === NUMBER_AND_PLACE_VALUE_STRAND_KEY ? (
            <MathematicsStrandWorkspaceShell
              eyebrow="Selected strand"
              title={selectedMathematicsDomain.title}
              subtitle="Number and place value is the first detailed MyLearna strand because it builds the foundation for later mathematics."
              relationshipTitle="Why start here"
              relationshipCopy="This strand stays as the main number workspace. It shows the likely current stage for the selected learner, keeps step evidence visible, and supports the detailed step-by-step pathway flow."
              stageRailItems={NUMBER_PATHWAY_STAGES.map((stage) => ({
                key: stage.key,
                title: stage.title,
                tone: getStageTone(stage.key, currentStageFocus),
              }))}
              summaryCards={[
                {
                  label: "Current stage snapshot",
                  value:
                    NUMBER_PATHWAY_STAGES.find((stage) => stage.key === currentStageFocus)
                      ?.title || "Current focus",
                  helper: "Prototype view for the selected learner's likely pathway stage.",
                },
                {
                  label: "secure steps",
                  value: String(currentStageSnapshot.secure),
                  valueColor: "#166534",
                },
                {
                  label: "ready to assess",
                  value: String(currentStageSnapshot.readyToAssess),
                  valueColor: "#6d28d9",
                },
                {
                  label: "evidence started",
                  value: String(currentStageSnapshot.evidenceStarted),
                  valueColor: "#1d4ed8",
                },
                {
                  label: "practising",
                  value: String(currentStageSnapshot.practising),
                  valueColor: "#c2410c",
                },
                {
                  label: "not started",
                  value: String(currentStageSnapshot.notStarted),
                  valueColor: "#64748b",
                },
              ]}
              supportCards={[
                {
                  title: "Portfolio support",
                  items: [
                    "Save strong examples when a step shows clear reasoning, flexible strategy use, or a visible shift in confidence.",
                    "A short parent note about how the learner explained the number idea can strengthen later portfolio evidence.",
                  ],
                },
                {
                  title: "Reporting support",
                  items: [
                    "Captured number evidence can later support calm reporting about confidence, comparison, and explanation.",
                    "Progress over time is often easiest to see when earlier counting-based strategies are compared with later flexible reasoning.",
                  ],
                },
              ]}
            >
              <div style={{ display: "grid", gap: 16 }}>
                {NUMBER_PATHWAY_STAGES.map((stage) => (
                  <NumberStageCard
                    key={stage.key}
                    stage={stage}
                    currentStage={currentStageFocus}
                    savedPathwayStatuses={savedPathwayStatuses}
                    selectedLearnerId={selectedLearner?.id || ""}
                    isOpen={getStageOpenState(
                      NUMBER_AND_PLACE_VALUE_STRAND_KEY,
                      stage.key,
                      stage.key === currentStageFocus,
                    )}
                    onToggle={() =>
                      toggleStageOpen(
                        NUMBER_AND_PLACE_VALUE_STRAND_KEY,
                        stage.key,
                        stage.key === currentStageFocus,
                      )
                    }
                    capturePathBase={capturePathBase}
                  />
                ))}
              </div>
            </MathematicsStrandWorkspaceShell>
          ) : selectedMathematicsWorkspace ? (
            <MathematicsStrandWorkspaceShell
              eyebrow="Selected strand"
              title={selectedMathematicsWorkspace.title}
              subtitle={selectedMathematicsWorkspace.subtitle}
              relationshipTitle={selectedMathematicsWorkspace.relationshipTitle}
              relationshipCopy={selectedMathematicsWorkspace.relationshipCopy}
              stageRailItems={selectedMathematicsWorkspace.stages.map((stage, stageIndex) => ({
                key: stage.key,
                title: stage.title,
                tone: getDetailedStageTone(stageIndex, selectedDetailedWorkspaceStageIndex),
              }))}
              summaryCards={[
                {
                  label: "Current stage snapshot",
                  value:
                    selectedMathematicsWorkspace.stages[selectedDetailedWorkspaceStageIndex]
                      ?.title || "Current focus",
                  helper: "Prototype guidance for where this strand could begin for many families.",
                },
                {
                  label: "secure steps",
                  value: String(selectedDetailedWorkspaceSnapshot?.secure || 0),
                  valueColor: "#166534",
                },
                {
                  label: "ready to assess",
                  value: String(selectedDetailedWorkspaceSnapshot?.readyToAssess || 0),
                  valueColor: "#6d28d9",
                },
                {
                  label: "evidence started",
                  value: String(selectedDetailedWorkspaceSnapshot?.evidenceStarted || 0),
                  valueColor: "#1d4ed8",
                },
                {
                  label: "practising",
                  value: String(selectedDetailedWorkspaceSnapshot?.practising || 0),
                  valueColor: "#c2410c",
                },
                {
                  label: "not started",
                  value: String(selectedDetailedWorkspaceSnapshot?.notStarted || 0),
                  valueColor: "#64748b",
                },
              ]}
              supportCards={[
                {
                  title: "Portfolio support",
                  items: selectedMathematicsWorkspace.portfolioSupport,
                },
                {
                  title: "Reporting support",
                  items: selectedMathematicsWorkspace.reportingSupport,
                },
              ]}
            >
              <div style={{ display: "grid", gap: 16 }}>
                {selectedMathematicsWorkspace.stages.map((stage, stageIndex) => (
                  <DetailedMathematicsStageCard
                    key={`${selectedMathematicsWorkspace.key}-${stage.key}`}
                    strand={selectedMathematicsWorkspace}
                    stage={stage}
                    stageIndex={stageIndex}
                    currentStageIndex={selectedDetailedWorkspaceStageIndex}
                    savedPathwayStatuses={savedPathwayStatuses}
                    selectedLearnerId={selectedLearner?.id || ""}
                    isOpen={getStageOpenState(
                      selectedMathematicsWorkspace.key,
                      stage.key,
                      stage.key === selectedMathematicsWorkspace.currentFocusStageKey,
                    )}
                    onToggle={() =>
                      toggleStageOpen(
                        selectedMathematicsWorkspace.key,
                        stage.key,
                        stage.key === selectedMathematicsWorkspace.currentFocusStageKey,
                      )
                    }
                    capturePathBase={capturePathBase}
                  />
                ))}
              </div>
            </MathematicsStrandWorkspaceShell>
          ) : (
            <MathematicsComingLaterStrandSection domain={selectedMathematicsDomain} />
          )}
        </section>

        <section style={helperCardStyle}>
          <strong style={{ color: "#0f172a" }}>Create a learning plan from a pathway</strong>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
            Later, MyLearna will help turn selected pathway steps into a simple learning
            plan that can be placed into My Calendar and My Day.
          </p>
          <div>
            <button type="button" style={disabledButtonStyle} disabled>
              Coming later
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function MathematicsStrandWorkspaceShell({
  eyebrow,
  title,
  subtitle,
  relationshipTitle,
  relationshipCopy,
  stageRailItems,
  summaryCards,
  supportCards,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  relationshipTitle: string;
  relationshipCopy: string;
  stageRailItems: Array<{
    key: string;
    title: string;
    tone: { badge: string; border: string; background: string; shadow: string; text: string };
  }>;
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
        <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
          <div style={eyebrowStyle}>{eyebrow}</div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>{title}</h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>{subtitle}</p>
        </div>

        <div style={{ display: "grid", gap: 8, flex: "1 1 240px", minWidth: 0 }}>
          <div style={eyebrowStyle}>{relationshipTitle}</div>
          <div style={{ color: "#475569", lineHeight: 1.6 }}>{relationshipCopy}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "stretch",
        }}
      >
        {stageRailItems.map((stage) => (
          <div
            key={`rail-${stage.key}`}
            style={{
              border: `1px solid ${stage.tone.border}`,
              borderRadius: 999,
              background: stage.tone.background,
              padding: "10px 14px",
              display: "grid",
              gap: 4,
              boxShadow: stage.tone.shadow,
            }}
          >
            <span
              style={{
                color: stage.tone.text,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {stage.tone.badge}
            </span>
            <strong style={{ color: "#0f172a", fontSize: 13 }}>{stage.title}</strong>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        }}
      >
        {summaryCards.map((card, index) => (
          <div key={`${card.label}-${index}`} style={summaryCardStyle}>
            <div style={eyebrowStyle}>{card.label}</div>
            <strong
              style={{
                color: card.valueColor || "#0f172a",
                fontSize: card.valueColor ? 24 : 16,
              }}
            >
              {card.value}
            </strong>
            {card.helper ? (
              <div style={{ color: "#64748b", lineHeight: 1.6 }}>{card.helper}</div>
            ) : (
              <div style={{ color: "#475569" }}>{card.label}</div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {supportCards.map((card) => (
          <section key={card.title} style={helperCardStyle}>
            <div style={eyebrowStyle}>{card.title}</div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: "#475569",
                lineHeight: 1.7,
                display: "grid",
                gap: 6,
              }}
            >
              {card.items.map((item) => (
                <li key={`${card.title}-${item}`}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {children}
    </div>
  );
}

function DetailedMathematicsStageCard({
  strand,
  stage,
  stageIndex,
  currentStageIndex,
  savedPathwayStatuses,
  selectedLearnerId,
  isOpen,
  onToggle,
  capturePathBase,
}: {
  strand: MathematicsDetailedStrandWorkspace;
  stage: MathematicsDetailedStrandStage;
  stageIndex: number;
  currentStageIndex: number;
  savedPathwayStatuses: SavedPathwayStatusMap;
  selectedLearnerId: string;
  isOpen: boolean;
  onToggle: () => void;
  capturePathBase: string;
}) {
  const tone = getDetailedStageTone(stageIndex, currentStageIndex);
  const panelId = `${strand.key}-stage-${stage.key}`;
  const summary = buildDetailedStageSummaryCounts(
    strand.key,
    stage,
    stageIndex,
    currentStageIndex,
    savedPathwayStatuses,
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

  return (
    <section
      style={{
        border: `1px solid ${tone.border}`,
        borderRadius: 20,
        background: tone.background,
        padding: 18,
        display: "grid",
        gap: 14,
        boxShadow: tone.shadow,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${isOpen ? "Collapse" : "Expand"} stage ${stage.title}`}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          display: "grid",
          gap: 12,
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
          <div style={{ display: "grid", gap: 6, maxWidth: 760 }}>
            <span
              style={{
                color: tone.text,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {tone.badge}
            </span>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>{stage.title}</h3>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              color: tone.text,
              fontSize: 13,
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
                width: 30,
                height: 30,
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

        <div style={{ display: "grid", gap: 10 }}>
          {isOpen ? (
            <div style={{ color: "#475569", lineHeight: 1.6 }}>{stage.helper}</div>
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
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1.3,
                }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </button>

      <div
        id={panelId}
        hidden={!isOpen}
        style={isOpen ? { display: "grid", gap: 10 } : { display: "none" }}
      >
        {stage.steps.map((step, stepIndex) => (
          <DetailedMathematicsStepCard
            key={`${stage.key}-${step.id}`}
            strand={strand}
            stage={stage}
            stageIndex={stageIndex}
            currentStageIndex={currentStageIndex}
            step={step}
            stepIndex={stepIndex}
            savedPathwayStatuses={savedPathwayStatuses}
            selectedLearnerId={selectedLearnerId}
            capturePathBase={capturePathBase}
          />
        ))}
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
  savedPathwayStatuses,
  selectedLearnerId,
  capturePathBase,
}: {
  strand: MathematicsDetailedStrandWorkspace;
  stage: MathematicsDetailedStrandStage;
  stageIndex: number;
  currentStageIndex: number;
  step: MathematicsDetailedStrandStep;
  stepIndex: number;
  savedPathwayStatuses: SavedPathwayStatusMap;
  selectedLearnerId: string;
  capturePathBase: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const statusState = getDetailedDisplayedPathwayStatus(
    strand.key,
    stage,
    stageIndex,
    currentStageIndex,
    step,
    stepIndex,
    savedPathwayStatuses,
  );
  const status = statusState.status;
  const meta = statusMeta[status];
  const detailPanelId = `pathway-step-${strand.key}-${stage.key}-${step.id}`;
  const captureHref = useMemo(() => {
    const params = buildPathwayCaptureSearchParams(
      {
        source: "my-pathways",
        subjectKey: "mathematics",
        subjectLabel: "My Mathematics",
        pathwayKey: strand.key,
        pathwayLabel: strand.pathwayLabel,
        stageKey: stage.key,
        stageLabel: stage.title,
        stepNumber: String(step.id),
        stepTitle: step.title,
        stepMeaning: step.meaning,
        skillFocus: step.skillFocus,
      },
      {
        learnerId: selectedLearnerId || null,
        learningAreaKey: "mathematics",
        learningAreaLabel: "Mathematics",
      },
    );

    return `${capturePathBase}?${params.toString()}`;
  }, [
    capturePathBase,
    selectedLearnerId,
    stage.key,
    stage.title,
    step.id,
    step.meaning,
    step.skillFocus,
    step.title,
    strand.key,
    strand.pathwayLabel,
  ]);

  return (
    <article
      style={{
        border: `1px solid ${meta.border}`,
        borderRadius: 16,
        background: "#ffffff",
        padding: 16,
        display: "grid",
        gap: 12,
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
        <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                border: "1px solid #dbeafe",
                background: "#eff6ff",
                color: "#1d4ed8",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Step {step.id}
            </span>
            <strong style={{ color: "#0f172a", fontSize: 16 }}>{step.title}</strong>
          </div>
          <div style={{ color: "#475569", lineHeight: 1.7 }}>{step.meaning}</div>
        </div>

        <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
          <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
            <div
              title={meta.helper}
              style={{
                border: `1px solid ${meta.border}`,
                borderRadius: 999,
                background: meta.fill,
                padding: "8px 12px",
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
            {statusState.fromSavedEvidence ? (
              <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>
                Based on saved evidence
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls={detailPanelId}
            style={{
              border: "1px solid #dbeafe",
              background: "#ffffff",
              color: "#1d4ed8",
              borderRadius: 999,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{isOpen ? "Hide guidance" : "View guidance"}</span>
            <span
              aria-hidden="true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch" }}>
        <button
          type="button"
          style={{ ...disabledButtonStyle, flex: "1 1 140px" }}
          disabled
          title="Parent-guided practice for this pathway step will be added later."
          aria-label="Practise this pathway step"
        >
          Practise
        </button>
        <button
          type="button"
          style={{ ...disabledButtonStyle, flex: "1 1 140px" }}
          disabled
          title="Assessment checks coming later"
          aria-label="Assessment checks coming later for this pathway step"
        >
          Assess
        </button>
        <Link
          href={captureHref}
          style={{ ...buttonStyle, flex: "1 1 160px" }}
          title="Open My Capture with this pathway step already connected."
          aria-label="Capture evidence for this pathway step"
        >
          Capture evidence
        </Link>
      </div>

      <div
        id={detailPanelId}
        hidden={!isOpen}
        style={
          isOpen
            ? {
                border: "1px solid #dbeafe",
                borderRadius: 16,
                background: "#f8fbff",
                padding: 16,
                display: "grid",
                gap: 14,
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

function MathematicsComingLaterStrandSection({
  domain,
}: {
  domain: (typeof MATHEMATICS_DOMAIN_CARDS)[number];
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
              This strand guide is being developed.
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, flex: "1 1 240px", minWidth: 0 }}>
          <div style={eyebrowStyle}>Why it matters</div>
          <div style={{ color: "#475569", lineHeight: 1.6 }}>{domain.whyItMatters}</div>
        </div>
      </div>

      <section style={helperCardStyle}>
        <strong style={{ color: "#0f172a" }}>This strand guide is being developed.</strong>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
          The strand stays visible in the map so families can see what is coming next in
          the mathematics sequence without the page turning into a long curriculum archive.
        </p>
      </section>
    </div>
  );
}

function NumberStageCard({
  stage,
  currentStage,
  savedPathwayStatuses,
  selectedLearnerId,
  isOpen,
  onToggle,
  capturePathBase,
}: {
  stage: NumberPathwayStage;
  currentStage: PathwayStageKey;
  savedPathwayStatuses: SavedPathwayStatusMap;
  selectedLearnerId: string;
  isOpen: boolean;
  onToggle: () => void;
  capturePathBase: string;
}) {
  const tone = getStageTone(stage.key, currentStage);
  const summary = buildStageSummaryCounts(stage, currentStage, savedPathwayStatuses);
  const panelId = `number-pathway-stage-${stage.key}`;
  const summaryChips = [
    {
      key: "steps",
      label: `${summary.steps} steps`,
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

  return (
    <section
      style={{
        border: `1px solid ${tone.border}`,
        borderRadius: 20,
        background: tone.background,
        padding: 18,
        display: "grid",
        gap: 14,
        boxShadow: tone.shadow,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${isOpen ? "Collapse" : "Expand"} stage ${stage.title}`}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          display: "grid",
          gap: 12,
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
          <div style={{ display: "grid", gap: 6, maxWidth: 760 }}>
            <span
              style={{
                color: tone.text,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {tone.badge}
            </span>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>{stage.title}</h3>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              color: tone.text,
              fontSize: 13,
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
                width: 30,
                height: 30,
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

        <div style={{ display: "grid", gap: 10 }}>
          {isOpen ? (
            <div style={{ color: "#475569", lineHeight: 1.6 }}>{stage.helper}</div>
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
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1.3,
                }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </button>

      <div
        id={panelId}
        hidden={!isOpen}
        style={isOpen ? { display: "grid", gap: 10 } : { display: "none" }}
      >
        {stage.steps.map((step) => (
            <NumberStepCard
              key={`${stage.key}-${step.id}`}
              step={step}
              stageKey={stage.key}
              stageTitle={stage.title}
              savedPathwayStatuses={savedPathwayStatuses}
              selectedLearnerId={selectedLearnerId}
              currentStage={currentStage}
              capturePathBase={capturePathBase}
            />
        ))}
      </div>
    </section>
  );
}

function NumberStepCard({
  step,
  stageKey,
  stageTitle,
  savedPathwayStatuses,
  selectedLearnerId,
  currentStage,
  capturePathBase,
}: {
  step: NumberPathwayStep;
  stageKey: PathwayStageKey;
  stageTitle: string;
  savedPathwayStatuses: SavedPathwayStatusMap;
  selectedLearnerId: string;
  currentStage: PathwayStageKey;
  capturePathBase: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const statusState = getDisplayedPathwayStatus(
    step.id,
    stageKey,
    currentStage,
    savedPathwayStatuses,
  );
  const status = statusState.status;
  const meta = statusMeta[status];
  const guidance = useMemo(() => getNumberPathwayStepGuidance(step), [step]);
  const detailPanelId = `pathway-step-${stageKey}-${step.id}`;
  const practiceButtonLabel = `Practise this pathway step`;
  const assessButtonLabel = `Assessment checks coming later for this pathway step`;
  const captureButtonLabel = `Capture evidence for this pathway step`;
  const captureHref = useMemo(() => {
    const params = buildPathwayCaptureSearchParams(
      {
        source: "my-pathways",
        subjectKey: "mathematics",
        subjectLabel: "My Mathematics",
        pathwayKey: "number",
        pathwayLabel: "Number pathway",
        stageKey,
        stageLabel: stageTitle,
        stepNumber: String(step.id),
        stepTitle: step.title,
        stepMeaning: step.meaning,
        skillFocus: guidance.skillFocus,
      },
      {
        learnerId: selectedLearnerId || null,
        learningAreaKey: "mathematics",
        learningAreaLabel: "Mathematics",
      },
    );

    return `${capturePathBase}?${params.toString()}`;
  }, [
    capturePathBase,
    guidance.skillFocus,
    selectedLearnerId,
    stageKey,
    stageTitle,
    step.id,
    step.meaning,
    step.title,
  ]);

  return (
    <article
      style={{
        border: `1px solid ${meta.border}`,
        borderRadius: 16,
        background: "#ffffff",
        padding: 16,
        display: "grid",
        gap: 12,
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
        <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                border: "1px solid #dbeafe",
                background: "#eff6ff",
                color: "#1d4ed8",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Step {step.id}
            </span>
            <strong style={{ color: "#0f172a", fontSize: 16 }}>{step.title}</strong>
          </div>
          <div style={{ color: "#475569", lineHeight: 1.7 }}>{step.meaning}</div>
        </div>

        <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
          <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
            <div
              title={meta.helper}
              style={{
                border: `1px solid ${meta.border}`,
                borderRadius: 999,
                background: meta.fill,
                padding: "8px 12px",
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
            {statusState.fromSavedEvidence ? (
              <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>
                Based on saved evidence
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls={detailPanelId}
            style={{
              border: "1px solid #dbeafe",
              background: "#ffffff",
              color: "#1d4ed8",
              borderRadius: 999,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{isOpen ? "Hide guidance" : "View guidance"}</span>
            <span
              aria-hidden="true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch" }}>
        <button
          type="button"
          style={{ ...disabledButtonStyle, flex: "1 1 140px" }}
          disabled
          title="Parent-guided practice for this pathway step will be added later."
          aria-label={practiceButtonLabel}
        >
          Practise
        </button>
        <button
          type="button"
          style={{ ...disabledButtonStyle, flex: "1 1 140px" }}
          disabled
          title="Assessment checks coming later"
          aria-label={assessButtonLabel}
        >
          Assess
        </button>
        <Link
          href={captureHref}
          style={{ ...buttonStyle, flex: "1 1 160px" }}
          title="Open My Capture with this pathway step already connected."
          aria-label={captureButtonLabel}
        >
          Capture evidence
        </Link>
      </div>

      <div
        id={detailPanelId}
        hidden={!isOpen}
        style={
          isOpen
            ? {
                border: "1px solid #dbeafe",
                borderRadius: 16,
                background: "#f8fbff",
                padding: 16,
                display: "grid",
                gap: 14,
              }
            : { display: "none" }
        }
      >
        <PathwayStepGuidanceSection
          title="What this means"
          content={guidance.whatThisMeans}
        />
        <PathwayStepGuidanceSection
          title="Skill being developed"
          content={guidance.skillFocus}
        />
        <PathwayStepGuidanceSection
          title="Learning intention"
          content={guidance.learningIntention}
        />
        <PathwayStepGuidanceListSection
          title="Success looks like"
          items={guidance.successCriteria}
        />
        <PathwayStepGuidanceSection
          title="Try this activity"
          content={guidance.practiceActivity}
        />
        <PathwayStepGuidanceListSection
          title="Evidence you could capture"
          items={guidance.evidenceExamples}
        />
        <PathwayStepGuidanceSection
          title="Assessment check later"
          content={guidance.assessmentCheck}
        />
      </div>
    </article>
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
      <div style={{ color: "#475569", lineHeight: 1.7 }}>{content}</div>
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
          lineHeight: 1.7,
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
