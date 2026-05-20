"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
import CleanAppHeader from "@/app/components/clean/CleanAppHeader";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { resolveCurriculumFrameworkMap } from "@/lib/clean/curriculum/frameworkMaps";
import { buildPathwayCaptureSearchParams } from "@/lib/clean/evidence/curriculumContext";
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

const LOOP_STEPS = [
  {
    title: "Choose a pathway step",
    copy: "Start with the next useful skill instead of a long list of standards.",
  },
  {
    title: "Practise the skill",
    copy: "Use short, practical learning moments that fit family life.",
  },
  {
    title: "Check understanding",
    copy: "My Assessments will later help confirm how confidence is building.",
  },
  {
    title: "Capture evidence",
    copy: "Save a note, photo, or reflection while learning is still fresh.",
  },
  {
    title: "Build curriculum coverage",
    copy: "Evidence can later connect back to the selected framework in My Curriculum.",
  },
  {
    title: "Prepare reports and outputs",
    copy: "Reports become easier when progress and evidence already connect.",
  },
];

type StageSummaryCounts = {
  steps: number;
  secure: number;
  readyToAssess: number;
  evidenceStarted: number;
};

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

function buildStageSummaryCounts(
  stage: NumberPathwayStage,
  currentStage: PathwayStageKey,
): StageSummaryCounts {
  return stage.steps.reduce(
    (totals, step) => {
      const status = getDemoPathwayStatus(step.id, stage.key, currentStage);

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

function PathwaysWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const [selectedLearnerIdOverride, setSelectedLearnerIdOverride] = useState("");
  const [stageOpenOverrides, setStageOpenOverrides] = useState<
    Partial<Record<PathwayStageKey, boolean>>
  >({});

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

  const currentStageSnapshot = useMemo(
    () =>
      NUMBER_PATHWAY_STAGES.find((stage) => stage.key === currentStageFocus)?.steps.reduce(
        (totals, step) => {
          const status = getDemoPathwayStatus(step.id, currentStageFocus, currentStageFocus);

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
    [currentStageFocus],
  );

  const assessmentPathBase = pathname.startsWith("/clean-my-pathways")
    ? "/clean-my-assessments"
    : "/my-assessments";
  const capturePathBase = pathname.startsWith("/clean-my-pathways")
    ? "/clean-my-capture"
    : "/my-capture";

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
                  Prototype view - pathway progress will connect to assessments and evidence later.
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
                Number as the first detailed strand.
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
                const detailed = domain.status === "first-detailed";

                return (
                  <article
                    key={domain.key}
                    style={{
                      border: detailed ? "1px solid #93c5fd" : "1px solid #e2e8f0",
                      borderRadius: 18,
                      background: detailed ? "#f8fbff" : "#ffffff",
                      padding: 18,
                      display: "grid",
                      gap: 10,
                      boxShadow: detailed
                        ? "0 12px 28px rgba(59,130,246,0.08)"
                        : "0 6px 18px rgba(15,23,42,0.04)",
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
                      <strong style={{ color: "#0f172a", fontSize: 16 }}>{domain.title}</strong>
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
                        {detailed ? "First detailed strand" : "Coming later"}
                      </span>
                    </div>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>{domain.description}</div>
                    <div style={{ color: "#64748b", lineHeight: 1.6 }}>{domain.whyItMatters}</div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
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
                <div style={eyebrowStyle}>Number pathway</div>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>Number pathway</h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Number is the first detailed MyLearna pathway because it builds the
                  foundation for later mathematics.
                </p>
              </div>

              <div style={{ display: "grid", gap: 8, minWidth: 240 }}>
                <div style={eyebrowStyle}>Prototype note</div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Placeholder statuses below are for visual guidance only. Pathway progress
                  will connect to assessments and evidence later.
                </div>
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
              {NUMBER_PATHWAY_STAGES.map((stage) => {
                const tone = getStageTone(stage.key, currentStageFocus);

                return (
                  <div
                    key={`rail-${stage.key}`}
                    style={{
                      border: `1px solid ${tone.border}`,
                      borderRadius: 999,
                      background: tone.background,
                      padding: "10px 14px",
                      display: "grid",
                      gap: 4,
                      boxShadow: tone.shadow,
                    }}
                  >
                    <span
                      style={{
                        color: tone.text,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {tone.badge}
                    </span>
                    <strong style={{ color: "#0f172a", fontSize: 13 }}>{stage.title}</strong>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              }}
            >
              <div style={summaryCardStyle}>
                <div style={eyebrowStyle}>Current stage snapshot</div>
                <strong style={{ color: "#0f172a", fontSize: 16 }}>
                  {
                    NUMBER_PATHWAY_STAGES.find((stage) => stage.key === currentStageFocus)
                      ?.title
                  }
                </strong>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  Prototype view for the selected learner&apos;s likely pathway stage.
                </div>
              </div>
              <div style={summaryCardStyle}>
                <div style={{ color: "#166534", fontWeight: 800, fontSize: 24 }}>
                  {currentStageSnapshot.secure}
                </div>
                <div style={{ color: "#475569" }}>secure steps</div>
              </div>
              <div style={summaryCardStyle}>
                <div style={{ color: "#6d28d9", fontWeight: 800, fontSize: 24 }}>
                  {currentStageSnapshot.readyToAssess}
                </div>
                <div style={{ color: "#475569" }}>ready to assess</div>
              </div>
              <div style={summaryCardStyle}>
                <div style={{ color: "#1d4ed8", fontWeight: 800, fontSize: 24 }}>
                  {currentStageSnapshot.evidenceStarted}
                </div>
                <div style={{ color: "#475569" }}>evidence started</div>
              </div>
              <div style={summaryCardStyle}>
                <div style={{ color: "#c2410c", fontWeight: 800, fontSize: 24 }}>
                  {currentStageSnapshot.practising}
                </div>
                <div style={{ color: "#475569" }}>practising</div>
              </div>
              <div style={summaryCardStyle}>
                <div style={{ color: "#64748b", fontWeight: 800, fontSize: 24 }}>
                  {currentStageSnapshot.notStarted}
                </div>
                <div style={{ color: "#475569" }}>not started</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {NUMBER_PATHWAY_STAGES.map((stage) => (
                <NumberStageCard
                  key={stage.key}
                  stage={stage}
                  currentStage={currentStageFocus}
                  selectedLearnerId={selectedLearner?.id || ""}
                  isOpen={stageOpenOverrides[stage.key] ?? stage.key === currentStageFocus}
                  onToggle={() =>
                    setStageOpenOverrides((current) => ({
                      ...current,
                      [stage.key]: !(current[stage.key] ?? stage.key === currentStageFocus),
                    }))
                  }
                  assessmentPathBase={assessmentPathBase}
                  capturePathBase={capturePathBase}
                />
              ))}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
              <div style={eyebrowStyle}>How the pathway works</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                MyLearna guides the next step
              </h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                The pathway loop is designed to help families move from a clear next step to
                evidence and reporting without losing the thread.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              }}
            >
              {LOOP_STEPS.map((step, index) => (
                <article key={step.title} style={helperCardStyle}>
                  <div style={eyebrowStyle}>Step {index + 1}</div>
                  <strong style={{ color: "#0f172a" }}>{step.title}</strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>{step.copy}</div>
                </article>
              ))}
            </div>
          </div>
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

function NumberStageCard({
  stage,
  currentStage,
  selectedLearnerId,
  isOpen,
  onToggle,
  assessmentPathBase,
  capturePathBase,
}: {
  stage: NumberPathwayStage;
  currentStage: PathwayStageKey;
  selectedLearnerId: string;
  isOpen: boolean;
  onToggle: () => void;
  assessmentPathBase: string;
  capturePathBase: string;
}) {
  const tone = getStageTone(stage.key, currentStage);
  const summary = buildStageSummaryCounts(stage, currentStage);
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
              selectedLearnerId={selectedLearnerId}
              currentStage={currentStage}
              assessmentPathBase={assessmentPathBase}
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
  selectedLearnerId,
  currentStage,
  assessmentPathBase,
  capturePathBase,
}: {
  step: NumberPathwayStep;
  stageKey: PathwayStageKey;
  stageTitle: string;
  selectedLearnerId: string;
  currentStage: PathwayStageKey;
  assessmentPathBase: string;
  capturePathBase: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const status = getDemoPathwayStatus(step.id, stageKey, currentStage);
  const meta = statusMeta[status];
  const guidance = useMemo(() => getNumberPathwayStepGuidance(step), [step]);
  const detailPanelId = `pathway-step-${stageKey}-${step.id}`;
  const practiceButtonLabel = `Practise this pathway step`;
  const assessButtonLabel = `Assess this pathway step in My Assessments`;
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          style={disabledButtonStyle}
          disabled
          title="Parent-guided practice for this pathway step will be added later."
          aria-label={practiceButtonLabel}
        >
          Practise
        </button>
        <Link
          href={assessmentPathBase}
          style={secondaryButtonStyle}
          title="Open My Assessments to check understanding for this pathway step."
          aria-label={assessButtonLabel}
        >
          Assess
        </Link>
        <Link
          href={captureHref}
          style={secondaryButtonStyle}
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
