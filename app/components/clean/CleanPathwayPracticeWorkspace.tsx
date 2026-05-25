"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanPathwayPracticePlayer from "@/app/components/clean/CleanPathwayPracticePlayer";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import {
  buildPathwayCaptureContext,
  buildPathwayCaptureSearchParams,
} from "@/lib/clean/evidence/curriculumContext";
import {
  buildMiniCheckPlayerItems,
  buildPracticeEvidenceSummary,
  buildPracticePlayerItems,
  countMiniCheckTasks,
  countPracticeTasks,
  getCanonicalPracticeStepMeta,
  getPathwayIdentityLabel,
  getPracticeRecommendation,
  type PathwayPracticeActivity,
  type PracticeOutcome,
  type PracticePlayerTaskItem,
  type PracticeSectionType,
} from "@/lib/clean/pathways/practiceActivities";

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
  borderRadius: 22,
  background: "#ffffff",
  padding: "clamp(18px, 3vw, 24px)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
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
  borderRadius: 18,
  background: "#f8fbff",
  padding: 16,
  display: "grid",
  gap: 8,
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.2,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 12,
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

const textareaStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
  color: "#0f172a",
  minHeight: 90,
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

const monoTextStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: 12,
  color: "#475569",
  lineHeight: 1.6,
  wordBreak: "break-all",
};

const sectionToneMeta: Record<
  PracticeSectionType,
  { border: string; fill: string; text: string }
> = {
  understanding: {
    border: "#bfdbfe",
    fill: "#dbeafe",
    text: "#1d4ed8",
  },
  fluency: {
    border: "#bbf7d0",
    fill: "#dcfce7",
    text: "#166534",
  },
  problem_solving: {
    border: "#fde68a",
    fill: "#fef3c7",
    text: "#b45309",
  },
  reasoning: {
    border: "#ddd6fe",
    fill: "#ede9fe",
    text: "#6d28d9",
  },
};

const outcomeToneMeta: Record<
  PracticeOutcome,
  { border: string; fill: string; text: string }
> = {
  not_started: {
    border: "#e2e8f0",
    fill: "#ffffff",
    text: "#475569",
  },
  developing: {
    border: "#fde68a",
    fill: "#fffbeb",
    text: "#b45309",
  },
  secure: {
    border: "#bbf7d0",
    fill: "#f0fdf4",
    text: "#166534",
  },
  needs_support: {
    border: "#c7d2fe",
    fill: "#eef2ff",
    text: "#4338ca",
  },
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function getLearnerLabel(
  learner: {
    preferredName?: string | null;
    firstName?: string | null;
  } | null,
) {
  if (!learner) return "No learner selected";
  return safe(learner.preferredName) || safe(learner.firstName) || "Learner";
}

function getCompletedCount(
  items: PracticePlayerTaskItem[],
  completedTaskIds: string[],
) {
  return items.filter((item) => completedTaskIds.includes(item.task.id)).length;
}

function getResumeIndex(
  items: PracticePlayerTaskItem[],
  completedTaskIds: string[],
  currentIndex: number,
) {
  if (!items.length) return 0;
  const currentItem = items[currentIndex];
  if (currentItem && !completedTaskIds.includes(currentItem.task.id)) {
    return currentIndex;
  }
  const firstIncompleteIndex = items.findIndex(
    (item) => !completedTaskIds.includes(item.task.id),
  );
  if (firstIncompleteIndex >= 0) {
    return firstIncompleteIndex;
  }
  return Math.max(0, items.length - 1);
}

function PracticeWorkspaceBody({
  activity,
}: {
  activity: PathwayPracticeActivity;
}) {
  const { learners, loading } = useCleanFamilyWorkspace();
  const learner = learners[0] ?? null;
  const learnerLabel = getLearnerLabel(learner);
  const canonicalMeta = useMemo(
    () => getCanonicalPracticeStepMeta(activity),
    [activity],
  );
  const practiceItems = useMemo(() => buildPracticePlayerItems(activity), [activity]);
  const miniCheckItems = useMemo(() => buildMiniCheckPlayerItems(activity), [activity]);
  const practiceTaskTotal = useMemo(() => countPracticeTasks(activity), [activity]);
  const miniCheckTaskTotal = useMemo(() => countMiniCheckTasks(activity), [activity]);

  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [practicePlayerOpen, setPracticePlayerOpen] = useState(false);
  const [miniCheckPlayerOpen, setMiniCheckPlayerOpen] = useState(false);
  const [practicePlayerIndex, setPracticePlayerIndex] = useState(0);
  const [miniCheckPlayerIndex, setMiniCheckPlayerIndex] = useState(0);
  const [miniCheckOutcome, setMiniCheckOutcome] =
    useState<PracticeOutcome>("not_started");
  const [hasVisitedMiniCheck, setHasVisitedMiniCheck] = useState(false);
  const [showParentNote, setShowParentNote] = useState(false);
  const [parentNote, setParentNote] = useState("");

  const completedPracticeTaskCount = getCompletedCount(practiceItems, completedTaskIds);
  const completedMiniCheckCount = getCompletedCount(miniCheckItems, completedTaskIds);
  const recommendation = getPracticeRecommendation(miniCheckOutcome);
  const evidenceSummary = buildPracticeEvidenceSummary(
    activity,
    learner ? learnerLabel : null,
  );

  const captureHref = useMemo(() => {
    const context = buildPathwayCaptureContext({
      subjectKey: activity.subjectKey,
      subjectLabel: activity.strandLabel,
      pathwayKey: activity.strandKey,
      pathwayLabel: canonicalMeta.canonicalStrandTitle,
      stageKey: activity.stageKey,
      stageLabel: canonicalMeta.canonicalStageTitle,
      pathwayStepId: activity.pathwayStepId,
      stepKey: activity.stepKey,
      stepNumber: canonicalMeta.canonicalStepNumber,
      stepTitle: canonicalMeta.canonicalTitle,
      stepMeaning: canonicalMeta.canonicalMeaning,
      skillFocus: activity.myLearnaFocus,
      observedSkillStatus: "Practising",
    });

    if (!context) {
      return "/my-capture";
    }

    const params = buildPathwayCaptureSearchParams(context, {
      learnerId: learner?.id ?? null,
      learningAreaKey: activity.subjectKey,
      learningAreaLabel: activity.strandLabel,
    });

    return `/my-capture?${params.toString()}`;
  }, [activity, canonicalMeta, learner?.id]);

  const updateResponse = (taskId: string, value: string) => {
    setResponses((current) => ({
      ...current,
      [taskId]: value,
    }));
  };

  const markTaskComplete = (taskId: string) => {
    setCompletedTaskIds((current) =>
      current.includes(taskId) ? current : [...current, taskId],
    );
  };

  const openPracticePlayer = () => {
    setPracticePlayerIndex((current) =>
      getResumeIndex(practiceItems, completedTaskIds, current),
    );
    setPracticePlayerOpen(true);
  };

  const openMiniCheckPlayer = () => {
    setHasVisitedMiniCheck(true);
    setMiniCheckPlayerIndex((current) =>
      getResumeIndex(miniCheckItems, completedTaskIds, current),
    );
    setMiniCheckPlayerOpen(true);
  };

  const handlePracticeBack = () => {
    setPracticePlayerIndex((current) => Math.max(0, current - 1));
  };

  const handlePracticeNext = () => {
    const currentItem = practiceItems[practicePlayerIndex];
    if (!currentItem) return;
    markTaskComplete(currentItem.task.id);
    if (practicePlayerIndex >= practiceItems.length - 1) {
      setPracticePlayerOpen(false);
      return;
    }
    setPracticePlayerIndex((current) => current + 1);
  };

  const handleMiniCheckBack = () => {
    setMiniCheckPlayerIndex((current) => Math.max(0, current - 1));
  };

  const handleMiniCheckNext = () => {
    const currentItem = miniCheckItems[miniCheckPlayerIndex];
    if (!currentItem) return;
    markTaskComplete(currentItem.task.id);
    if (miniCheckPlayerIndex >= miniCheckItems.length - 1) {
      setMiniCheckPlayerOpen(false);
      return;
    }
    setMiniCheckPlayerIndex((current) => current + 1);
  };

  const resetPracticeLoop = () => {
    setCompletedTaskIds([]);
    setResponses({});
    setPracticePlayerIndex(0);
    setMiniCheckPlayerIndex(0);
    setMiniCheckOutcome("not_started");
    setHasVisitedMiniCheck(false);
    setParentNote("");
    setShowParentNote(false);
    setPracticePlayerOpen(false);
    setMiniCheckPlayerOpen(false);
  };

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon
          guidanceSlot={
            <section style={helperCardStyle}>
              <strong style={{ color: "#0f172a" }}>Focused practice player</strong>
              <div style={{ color: "#475569", lineHeight: 1.65 }}>
                This prototype keeps the real canonical pathway step and evidence context,
                but shifts the learner experience into a calmer one-task-at-a-time player.
              </div>
            </section>
          }
        />

        <section
          style={{
            ...cardStyle,
            border: "1px solid #bfdbfe",
            background:
              "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,251,255,1) 100%)",
            display: "grid",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>Practice + assessment prototype</div>
              <h1
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: "clamp(28px, 5vw, 38px)",
                  lineHeight: 1.08,
                }}
              >
                {activity.title}
              </h1>
              <div style={{ color: "#334155", fontSize: 16, lineHeight: 1.6 }}>
                {activity.strandLabel} {" · "} {activity.phaseLabel}
              </div>
            </div>

            <span
              style={{
                ...chipStyle,
                border: "1px solid #bfdbfe",
                background: "#dbeafe",
                color: "#1d4ed8",
              }}
            >
              Practice prototype
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <div style={compactCardStyle}>
              <div style={eyebrowStyle}>Focus</div>
              <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
                {activity.myLearnaFocus}
              </div>
              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                Learners explore how the same number can be made from different smaller parts.
              </div>
            </div>

            <div style={compactCardStyle}>
              <div style={eyebrowStyle}>Current learner</div>
              <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
                {loading ? "Loading workspace..." : learnerLabel}
              </div>
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                Practice state stays local in v2. Nothing is saved until you move into
                Capture or a later assessment flow.
              </div>
            </div>

            <div style={compactCardStyle}>
              <div style={eyebrowStyle}>Canonical pathway step</div>
              <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
                {canonicalMeta.canonicalTitle}
              </div>
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                Foundation / Kindergarten number partitioning stays as the real spine
                reference under this more parent-friendly practice title.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
              borderTop: "1px solid #dbeafe",
              paddingTop: 14,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  ...chipStyle,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#334155",
                }}
              >
                Canonical step: {canonicalMeta.canonicalTitle}
              </span>
              <span
                style={{
                  ...chipStyle,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#334155",
                }}
              >
                {canonicalMeta.canonicalLabel}
              </span>
              {activity.acaraCode ? (
                <span
                  style={{
                    ...chipStyle,
                    border: "1px solid #ddd6fe",
                    background: "#f5f3ff",
                    color: "#6d28d9",
                  }}
                >
                  ACARA provenance: {activity.acaraCode}
                </span>
              ) : null}
            </div>

            <div style={monoTextStyle}>
              Pathway step: {getPathwayIdentityLabel(activity)}
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <section style={cardStyle}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>Learn</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>Big idea</h2>
              <div style={{ color: "#475569", lineHeight: 1.7 }}>
                {activity.learnCard.bigIdea}
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
              }}
            >
              {["5 + 5", "6 + 4", "7 + 3", "8 + 2"].map((pair) => (
                <div
                  key={pair}
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 16,
                    background: "#f8fbff",
                    padding: "14px 12px",
                    color: "#1d4ed8",
                    fontWeight: 800,
                    fontSize: 18,
                    textAlign: "center",
                  }}
                >
                  {pair}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 18,
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                background: "#f8fafc",
                padding: 16,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={eyebrowStyle}>Parent tip</div>
              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                {activity.learnCard.parentTip}
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>How this practice works</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                One focused task at a time
              </h2>
              <div style={{ color: "#475569", lineHeight: 1.65 }}>
                Start the player to move through one prompt at a time with a visual work
                area, light support, and calm navigation. The overview page stays short so
                the learner is not hit with a full worksheet wall.
              </div>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {[
                "Open Practice to work through Understanding, Fluency, Problem Solving, and Reasoning.",
                "Use the Mini Check player separately when you want a lighter readiness check.",
                "Use the evidence summary and Capture link once you want to record the learning.",
              ].map((line, index) => (
                <div
                  key={line}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px minmax(0, 1fr)",
                    gap: 12,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1d4ed8",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>{line}</div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <div style={eyebrowStyle}>Practice</div>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                  Practice loop
                </h2>
                <div style={{ color: "#475569", lineHeight: 1.65 }}>
                  Four sections guide the learner through supported understanding before
                  moving into the mini check.
                </div>
              </div>

              <div style={{ ...compactCardStyle, minWidth: 170 }}>
                <div style={eyebrowStyle}>Progress</div>
                <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 28 }}>
                  {completedPracticeTaskCount}/{practiceTaskTotal}
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>Tasks completed</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              {activity.sections.map((section) => {
                const tone = sectionToneMeta[section.type];
                return (
                  <span
                    key={section.id}
                    style={{
                      ...chipStyle,
                      border: `1px solid ${tone.border}`,
                      background: tone.fill,
                      color: tone.text,
                    }}
                  >
                    {section.title}
                  </span>
                );
              })}
            </div>

            <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.55, marginTop: 12 }}>
              Understanding, Fluency, Problem Solving, and Reasoning stay inside the
              player rather than expanding into a long worksheet.
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button type="button" onClick={openPracticePlayer} style={buttonStyle}>
                {completedPracticeTaskCount ? "Resume practice" : "Start practice"}
              </button>
              <button type="button" onClick={resetPracticeLoop} style={secondaryButtonStyle}>
                Reset local progress
              </button>
            </div>
          </section>

          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <div style={eyebrowStyle}>Mini Check</div>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                  Quick readiness check
                </h2>
                <div style={{ color: "#475569", lineHeight: 1.65 }}>
                  Mini Check uses the same focused player pattern, but with lighter
                  scaffolding and a separate outcome for the practice loop.
                </div>
              </div>

              <div style={{ ...compactCardStyle, minWidth: 170 }}>
                <div style={eyebrowStyle}>Progress</div>
                <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 28 }}>
                  {completedMiniCheckCount}/{miniCheckTaskTotal}
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>Mini check tasks</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button type="button" onClick={openMiniCheckPlayer} style={buttonStyle}>
                {completedMiniCheckCount ? "Resume mini check" : "Start mini check"}
              </button>
            </div>

            {hasVisitedMiniCheck ? (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <div style={eyebrowStyle}>Mini Check outcome</div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Choose the best fit after the learner has moved through the Mini Check
                  prompts.
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {([
                    ["secure", "Secure"],
                    ["developing", "Developing"],
                    ["needs_support", "Needs support"],
                  ] as const).map(([value, label]) => {
                    const selected = miniCheckOutcome === value;
                    const tone = outcomeToneMeta[value];

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMiniCheckOutcome(value)}
                        style={{
                          border: `1px solid ${selected ? tone.border : "#cbd5e1"}`,
                          background: selected ? tone.fill : "#ffffff",
                          color: selected ? tone.text : "#0f172a",
                          borderRadius: 999,
                          padding: "10px 14px",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <section style={cardStyle}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>How assessment will connect</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                Connected, but not identical
              </h2>
              <div style={{ color: "#475569", lineHeight: 1.65 }}>
                Practice builds the skill with scaffolding. Assessment checks whether the
                learner can use the same idea independently in changed representations and
                contexts.
              </div>
            </div>

            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                background: "#f8fafc",
                padding: 16,
                display: "grid",
                gap: 10,
                marginTop: 16,
              }}
            >
              {activity.assessmentPreview.map((task) => (
                <div
                  key={task.id}
                  style={{
                    borderRadius: 12,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    padding: "10px 12px",
                    color: "#0f172a",
                    lineHeight: 1.55,
                  }}
                >
                  {task.prompt}
                </div>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>Next-step recommendation</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                {recommendation.title}
              </h2>
              <div style={{ color: "#475569", lineHeight: 1.65 }}>
                {recommendation.body}
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                border: `1px solid ${outcomeToneMeta[miniCheckOutcome].border}`,
                borderRadius: 16,
                background: outcomeToneMeta[miniCheckOutcome].fill,
                padding: 16,
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  ...eyebrowStyle,
                  color: outcomeToneMeta[miniCheckOutcome].text,
                }}
              >
                Recommendation status
              </div>
              <div style={{ color: "#0f172a", lineHeight: 1.6 }}>
                Suggested next steps come from the Mini Check outcome only. They do not
                write formal assessment confidence or change pathway progress status in v2.
              </div>
            </div>
          </section>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>Evidence summary</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                Suggested parent-friendly record
              </h2>
              <div
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 18,
                  background: "#f8fbff",
                  padding: 16,
                  color: "#334155",
                  lineHeight: 1.75,
                }}
              >
                {evidenceSummary}
              </div>

              {showParentNote ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={eyebrowStyle}>Parent note</div>
                  <textarea
                    value={parentNote}
                    onChange={(event) => setParentNote(event.target.value)}
                    placeholder="Add a quick observation, confidence note, or reminder before moving this into evidence later."
                    style={textareaStyle}
                  />
                </div>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Available next actions</div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Capture can receive canonical pathway context now. Parent notes and
                  practice attempts stay local-only in this prototype.
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 10,
                }}
              >
                <Link href={captureHref} style={buttonStyle}>
                  Save as evidence
                </Link>
                <button
                  type="button"
                  onClick={() => setShowParentNote((current) => !current)}
                  style={secondaryButtonStyle}
                >
                  Add parent note
                </button>
                <button
                  type="button"
                  onClick={openPracticePlayer}
                  style={secondaryButtonStyle}
                >
                  Practise again
                </button>
                <Link href="/my-pathways" style={secondaryButtonStyle}>
                  Go to next step
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <CleanPathwayPracticePlayer
        open={practicePlayerOpen}
        mode="practice"
        title={activity.title}
        items={practiceItems}
        currentIndex={practicePlayerIndex}
        responses={responses}
        completedTaskIds={completedTaskIds}
        onClose={() => setPracticePlayerOpen(false)}
        onBack={handlePracticeBack}
        onNext={handlePracticeNext}
        onResponseChange={updateResponse}
      />

      <CleanPathwayPracticePlayer
        open={miniCheckPlayerOpen}
        mode="mini_check"
        title={`${activity.title} / Mini Check`}
        items={miniCheckItems}
        currentIndex={miniCheckPlayerIndex}
        responses={responses}
        completedTaskIds={completedTaskIds}
        onClose={() => setMiniCheckPlayerOpen(false)}
        onBack={handleMiniCheckBack}
        onNext={handleMiniCheckNext}
        onResponseChange={updateResponse}
      />
    </div>
  );
}

export default function CleanPathwayPracticeWorkspace({
  activity,
}: {
  activity: PathwayPracticeActivity;
}) {
  return (
    <CleanFamilyWorkspaceProvider>
      <PracticeWorkspaceBody activity={activity} />
    </CleanFamilyWorkspaceProvider>
  );
}
