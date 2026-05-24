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

const EMPTY_STRAND_CARD: SubjectStrandCard = {
  key: "selected-strand",
  title: "Selected strand",
  description: "Choose a strand to open the detailed pathway workspace.",
  whyItMatters: "Detailed strand guidance will appear here when a populated strand is selected.",
  status: "coming-later",
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
  practising: number;
  notStarted: number;
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
  workspace: MathematicsDetailedStrandWorkspace,
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
  const savedStatus =
    savedPathwayStatuses[buildPathwayStepKey(workspace.key, stage.key, String(step.id))] ||
    savedPathwayStatuses[
      buildPathwayStepKey(workspace.trackingKey, stage.key, String(step.id))
    ];

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

function buildWorkspaceStageSummaryCounts(
  workspace: MathematicsDetailedStrandWorkspace,
  stage: MathematicsDetailedStrandStage,
  stageIndex: number,
  currentStageIndex: number,
  savedPathwayStatuses: SavedPathwayStatusMap,
): StageSummaryCounts {
  return stage.steps.reduce(
    (totals, step, stepIndex) => {
      const { status } = getWorkspaceDisplayedPathwayStatus(
        workspace,
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
      steps: stage.steps.length,
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
  // Keep subject and strand selection explicit so later planning, capture, calendar,
  // and reporting can point back to a stable subject -> strand -> stage -> step path.
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<PathwaySubjectKey>(
    DEFAULT_PATHWAY_SUBJECT_KEY,
  );
  const [selectedStrandKeyBySubject, setSelectedStrandKeyBySubject] = useState<
    Partial<Record<PathwaySubjectKey, string>>
  >({
    mathematics:
      DETAILED_SUBJECT_CONFIGS.mathematics?.defaultStrandKey ||
      NUMBER_AND_PLACE_VALUE_STRAND_KEY,
    english: DETAILED_SUBJECT_CONFIGS.english?.defaultStrandKey || "",
    science: DETAILED_SUBJECT_CONFIGS.science?.defaultStrandKey || "",
    humanities: DETAILED_SUBJECT_CONFIGS.humanities?.defaultStrandKey || "",
    technologies: DETAILED_SUBJECT_CONFIGS.technologies?.defaultStrandKey || "",
    arts: DETAILED_SUBJECT_CONFIGS.arts?.defaultStrandKey || "",
    "health-pe": DETAILED_SUBJECT_CONFIGS["health-pe"]?.defaultStrandKey || "",
  });
  const [stageOpenOverrides, setStageOpenOverrides] = useState<Record<string, boolean>>({});
  const [savedPathwayStatuses, setSavedPathwayStatuses] = useState<SavedPathwayStatusMap>({});
  const pathwayDetailWorkspaceRef = useRef<HTMLDivElement | null>(null);

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
  const currentLearnerFocusStageKey = useMemo(
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
      selectedSubjectWorkspace,
      selectedWorkspaceCurrentStage,
      selectedWorkspaceStageIndex,
      selectedWorkspaceStageIndex,
      savedPathwayStatuses,
    );
  }, [
    savedPathwayStatuses,
    selectedSubjectWorkspace,
    selectedWorkspaceCurrentStage,
    selectedWorkspaceStageIndex,
  ]);
  const selectedSubjectSummaryTitle = selectedSubjectSupportsDetailedPathways
    ? selectedSubjectWorkspace?.title || `${selectedSubject.title} pathways`
    : `${selectedSubject.title} pathways`;
  const selectedSubjectSummaryDescription = selectedSubjectSupportsDetailedPathways
    ? selectedSubjectWorkspace?.subtitle ||
      "Choose a strand to explore the next pathway focus for this learner."
    : selectedSubject.description;
  const selectedSubjectSummaryHelper = selectedSubjectSupportsDetailedPathways
    ? `Current stage focus: ${selectedWorkspaceCurrentStage?.title || "Choose a strand below"}`
    : selectedSubject.guidance;
  const selectedSubjectStatusLabel = selectedSubjectSupportsDetailedPathways
    ? "Detailed now"
    : "Coming gradually";

  const capturePathBase = pathname.startsWith("/clean-my-pathways")
    ? "/clean-my-capture"
    : "/my-capture";

  function handleSelectSubjectStrand(nextStrandKey: string) {
    setSelectedStrandKeyBySubject((current) => ({
      ...current,
      [selectedSubjectKey]: nextStrandKey,
    }));

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
                <div style={eyebrowStyle}>Current subject focus</div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>
                  {selectedSubjectSummaryTitle}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {selectedSubjectSummaryDescription}
                </div>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  {selectedSubjectSupportsDetailedPathways ? "Current stage focus: " : "Current status: "}
                  <strong style={{ color: "#0f172a" }}>
                    {selectedSubjectSupportsDetailedPathways
                      ? selectedWorkspaceCurrentStage?.title || "Choose a strand below"
                      : selectedSubjectStatusLabel}
                  </strong>
                </div>
                {!selectedSubjectSupportsDetailedPathways ? (
                  <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                    {selectedSubjectSummaryHelper}
                  </div>
                ) : null}
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
              <div style={eyebrowStyle}>Choose a subject</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>Subject pathways</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                Start with one subject, then move into strands, stages, and evidence.
                Mathematics, English, Science, Humanities & Social Sciences, Technologies,
                Arts, and Health / PE now use the detailed shared pathway engine across the
                full core subject map.
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
                    setSelectedSubjectKey(event.target.value as PathwaySubjectKey)
                  }
                  style={inputStyle}
                >
                  {PATHWAY_SUBJECTS.map((subject) => (
                    <option key={subject.key} value={subject.key}>
                      {subject.title}
                    </option>
                  ))}
                </select>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  Choose a subject first. Detailed strand workspaces will expand from this same
                  structure over time.
                </div>
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
                <div style={{ color: "#475569", lineHeight: 1.6 }}>{selectedSubject.description}</div>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>{selectedSubject.guidance}</div>
              </div>
            </div>
          </div>
        </section>

        {selectedSubjectSupportsDetailedPathways ? (
          <>
            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
                  <div style={eyebrowStyle}>{selectedDetailedSubjectConfig?.overviewEyebrow}</div>
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                    {selectedDetailedSubjectConfig?.overviewTitle}
                  </h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                    {selectedDetailedSubjectConfig?.overviewDescription}
                  </p>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                    {selectedDetailedSubjectConfig?.overviewHelper}
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 14,
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  }}
                >
                  {selectedSubjectDomainCards.map((domain) => {
                    const detailed = domain.status !== "coming-later";
                    const firstDetailed = domain.status === "first-detailed";
                    const selected = domain.key === selectedStrandKey;

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
                          transition:
                            "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
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
                  stageRailItems={selectedSubjectWorkspace.stages.map((stage, stageIndex) => ({
                    key: stage.key,
                    title: stage.title,
                    tone: getPathwayStageTone(stageIndex, selectedWorkspaceStageIndex),
                  }))}
                  summaryCards={[
                    {
                      label: "Current stage snapshot",
                      value: selectedWorkspaceCurrentStage?.title || "Current focus",
                      helper: "Prototype view for the selected learner's likely pathway stage.",
                    },
                    {
                      label: "secure steps",
                      value: String(selectedWorkspaceSnapshot?.secure || 0),
                      valueColor: "#166534",
                    },
                    {
                      label: "ready to assess",
                      value: String(selectedWorkspaceSnapshot?.readyToAssess || 0),
                      valueColor: "#6d28d9",
                    },
                    {
                      label: "evidence started",
                      value: String(selectedWorkspaceSnapshot?.evidenceStarted || 0),
                      valueColor: "#1d4ed8",
                    },
                    {
                      label: "practising",
                      value: String(selectedWorkspaceSnapshot?.practising || 0),
                      valueColor: "#c2410c",
                    },
                    {
                      label: "not started",
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
                          ? `Current pathway focus: ${selectedWorkspaceCurrentStage.title}`
                          : "Current pathway focus will show here.",
                        selectedSubjectWorkspace.stages[selectedWorkspaceStageIndex + 1]
                          ? `Next progression: ${selectedSubjectWorkspace.stages[selectedWorkspaceStageIndex + 1]?.title}`
                          : "This selected stage is currently the latest detailed progression in this strand.",
                      ],
                    },
                  ]}
                >
                  <div style={{ display: "grid", gap: 16 }}>
                    {selectedSubjectWorkspace.stages.map((stage, stageIndex) => (
                      <DetailedMathematicsStageCard
                        key={`${selectedSubjectWorkspace.key}-${stage.key}`}
                        strand={selectedSubjectWorkspace}
                        stage={stage}
                        stageIndex={stageIndex}
                        currentStageIndex={selectedWorkspaceStageIndex}
                        savedPathwayStatuses={savedPathwayStatuses}
                        selectedSubjectKey={selectedSubject.key}
                        selectedSubjectTitle={selectedSubject.title}
                        selectedLearnerId={selectedLearner?.id || ""}
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
                      />
                    ))}
                  </div>
                </MathematicsStrandWorkspaceShell>
              ) : (
                <PathwayComingLaterStrandSection domain={selectedSubjectDomain} />
              )}
            </section>
          </>
        ) : (
          <PathwaySubjectPlaceholderSection subject={selectedSubject} />
        )}

        <section style={helperCardStyle}>
          <strong style={{ color: "#0f172a" }}>Create a learning plan from a pathway</strong>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
            {selectedSubjectSupportsDetailedPathways
              ? "Later, MyLearna will help turn selected pathway steps into a simple learning plan that can be placed into My Calendar and My Day."
              : `${selectedSubject.title} pathways will later use the same subject -> strand -> stage -> step structure to support planning in My Calendar and My Day.`}
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
  selectedSubjectKey,
  selectedSubjectTitle,
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
  selectedSubjectKey: PathwaySubjectKey;
  selectedSubjectTitle: string;
  selectedLearnerId: string;
  isOpen: boolean;
  onToggle: () => void;
  capturePathBase: string;
}) {
  const tone = getPathwayStageTone(stageIndex, currentStageIndex);
  const panelId = `${strand.key}-stage-${stage.key}`;
  const summary = buildWorkspaceStageSummaryCounts(
    strand,
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
            selectedSubjectKey={selectedSubjectKey}
            selectedSubjectTitle={selectedSubjectTitle}
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
  selectedSubjectKey,
  selectedSubjectTitle,
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
  selectedSubjectKey: PathwaySubjectKey;
  selectedSubjectTitle: string;
  selectedLearnerId: string;
  capturePathBase: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const statusState = getWorkspaceDisplayedPathwayStatus(
    strand,
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
    const stepKey = buildPathwayRegistryStepKey(step.title, step.id);
    const params = buildPathwayCaptureSearchParams(
      {
        source: "my-pathways",
        subjectKey: selectedSubjectKey,
        subjectLabel: selectedSubjectTitle,
        pathwayKey: strand.key,
        pathwayLabel: strand.pathwayLabel,
        stageKey: stage.key,
        stageLabel: stage.title,
        stepKey,
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
