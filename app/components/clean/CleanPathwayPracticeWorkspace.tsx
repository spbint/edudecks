"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import {
  buildPathwayCaptureContext,
  buildPathwayCaptureSearchParams,
} from "@/lib/clean/evidence/curriculumContext";
import {
  buildPracticeEvidenceSummary,
  getCanonicalPracticeStepMeta,
  getPathwayIdentityLabel,
  getPracticeRecommendation,
  type PathwayPracticeActivity,
  type PracticeOutcome,
  type PracticeSection,
  type PracticeSectionType,
  type PracticeTask,
  type PracticeTaskType,
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
  color: "#0f172a",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
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
  {
    border: string;
    background: string;
    chipBackground: string;
    chipText: string;
    accent: string;
  }
> = {
  understanding: {
    border: "#bfdbfe",
    background: "#f8fbff",
    chipBackground: "#dbeafe",
    chipText: "#1d4ed8",
    accent: "#2563eb",
  },
  fluency: {
    border: "#bbf7d0",
    background: "#f6fef8",
    chipBackground: "#dcfce7",
    chipText: "#166534",
    accent: "#16a34a",
  },
  problem_solving: {
    border: "#fde68a",
    background: "#fffdf5",
    chipBackground: "#fef3c7",
    chipText: "#b45309",
    accent: "#d97706",
  },
  reasoning: {
    border: "#ddd6fe",
    background: "#fbf9ff",
    chipBackground: "#ede9fe",
    chipText: "#6d28d9",
    accent: "#8b5cf6",
  },
};

const miniCheckToneMeta: Record<
  PracticeOutcome,
  { border: string; background: string; text: string }
> = {
  not_started: {
    border: "#e2e8f0",
    background: "#ffffff",
    text: "#475569",
  },
  developing: {
    border: "#fde68a",
    background: "#fffbeb",
    text: "#b45309",
  },
  secure: {
    border: "#bbf7d0",
    background: "#f0fdf4",
    text: "#166534",
  },
  needs_support: {
    border: "#c7d2fe",
    background: "#eef2ff",
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
    surname?: string | null;
  } | null,
) {
  if (!learner) return "No learner selected";
  return safe(learner.preferredName) || safe(learner.firstName) || "Learner";
}

function formatTaskTypeLabel(taskType: PracticeTaskType) {
  if (taskType === "select") return "Choose together";
  if (taskType === "short_answer") return "Quick answer";
  if (taskType === "draw_or_explain") return "Draw or explain";
  return "Parent observation";
}

function formatExpectedAnswer(task: PracticeTask) {
  if (Array.isArray(task.expectedAnswer)) {
    return task.expectedAnswer.join(" or ");
  }
  return safe(task.expectedAnswer);
}

function countSectionTasks(sections: PracticeSection[]) {
  return sections.reduce((total, section) => total + section.tasks.length, 0);
}

function TaskResponseField({
  task,
  value,
  onChange,
}: {
  task: PracticeTask;
  value: string;
  onChange: (value: string) => void;
}) {
  if (task.taskType === "draw_or_explain" || task.taskType === "parent_observation") {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          task.taskType === "parent_observation"
            ? "Jot down what the learner said, showed, or used."
            : "Sketch, describe, or record the learner's idea here."
        }
        style={textareaStyle}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={
        task.taskType === "select"
          ? "Note the chosen pair or answer."
          : "Write the missing number or short answer."
      }
      style={inputStyle}
    />
  );
}

function PracticeTaskCard({
  task,
  isComplete,
  responseValue,
  onToggleComplete,
  onChangeResponse,
  showExpectedAnswer,
}: {
  task: PracticeTask;
  isComplete: boolean;
  responseValue: string;
  onToggleComplete: () => void;
  onChangeResponse: (value: string) => void;
  showExpectedAnswer: boolean;
}) {
  const expectedAnswer = formatExpectedAnswer(task);

  return (
    <article
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        background: "#ffffff",
        padding: 14,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            ...chipStyle,
            border: "1px solid #dbeafe",
            background: "#f8fbff",
            color: "#1d4ed8",
          }}
        >
          {formatTaskTypeLabel(task.taskType)}
        </span>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#475569",
            fontSize: 13,
          }}
        >
          <input type="checkbox" checked={isComplete} onChange={onToggleComplete} />
          Complete
        </label>
      </div>

      <div style={{ color: "#0f172a", fontWeight: 700, lineHeight: 1.6 }}>{task.prompt}</div>

      <TaskResponseField
        task={task}
        value={responseValue}
        onChange={onChangeResponse}
      />

      {task.supportPrompt ? (
        <div
          style={{
            borderRadius: 12,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: "10px 12px",
            color: "#475569",
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: "#0f172a" }}>Support prompt:</strong> {task.supportPrompt}
        </div>
      ) : null}

      {showExpectedAnswer && expectedAnswer ? (
        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: "#0f172a" }}>Parent check:</strong> {expectedAnswer}
        </div>
      ) : null}
    </article>
  );
}

function PracticeSectionCard({
  section,
  completedTaskIds,
  responses,
  onToggleTask,
  onResponseChange,
}: {
  section: PracticeSection;
  completedTaskIds: string[];
  responses: Record<string, string>;
  onToggleTask: (taskId: string) => void;
  onResponseChange: (taskId: string, value: string) => void;
}) {
  const tone = sectionToneMeta[section.type];
  const completedCount = section.tasks.filter((task) =>
    completedTaskIds.includes(task.id),
  ).length;

  return (
    <section
      style={{
        ...cardStyle,
        border: `1px solid ${tone.border}`,
        background: tone.background,
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <span
            style={{
              ...chipStyle,
              border: `1px solid ${tone.border}`,
              background: tone.chipBackground,
              color: tone.chipText,
              width: "fit-content",
            }}
          >
            {section.title}
          </span>
          <div style={{ color: "#0f172a", fontSize: 20, fontWeight: 800 }}>
            {section.learnerGoal}
          </div>
        </div>

        <div
          style={{
            ...compactCardStyle,
            minWidth: 160,
            border: `1px solid ${tone.border}`,
            background: "#ffffff",
          }}
        >
          <div style={{ ...eyebrowStyle, color: tone.accent }}>Section progress</div>
          <div style={{ color: "#0f172a", fontSize: 24, fontWeight: 800 }}>
            {completedCount}/{section.tasks.length}
          </div>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Tasks marked complete
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {section.tasks.map((task) => (
          <PracticeTaskCard
            key={task.id}
            task={task}
            isComplete={completedTaskIds.includes(task.id)}
            responseValue={responses[task.id] || ""}
            onToggleComplete={() => onToggleTask(task.id)}
            onChangeResponse={(value) => onResponseChange(task.id, value)}
            showExpectedAnswer
          />
        ))}
      </div>
    </section>
  );
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
  const totalPracticeTasks = useMemo(
    () => countSectionTasks(activity.sections),
    [activity.sections],
  );
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [miniCheckOutcome, setMiniCheckOutcome] =
    useState<PracticeOutcome>("not_started");
  const [showParentNote, setShowParentNote] = useState(false);
  const [parentNote, setParentNote] = useState("");

  const completedPracticeTaskCount = completedTaskIds.length;
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

  const resetPracticeLoop = () => {
    setCompletedTaskIds([]);
    setResponses({});
    setMiniCheckOutcome("not_started");
    setParentNote("");
    setShowParentNote(false);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((item) => item !== taskId)
        : [...current, taskId],
    );
  };

  const updateResponse = (taskId: string, value: string) => {
    setResponses((current) => ({
      ...current,
      [taskId]: value,
    }));
  };

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon
          guidanceSlot={
            <section style={helperCardStyle}>
              <strong style={{ color: "#0f172a" }}>Prototype learning loop</strong>
              <div style={{ color: "#475569", lineHeight: 1.65 }}>
                This practice view sits on one canonical pathway step and shows how
                guided practice, a mini check, later assessment, and evidence can stay
                connected without becoming a separate curriculum system.
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
                {activity.strandLabel} · {activity.phaseLabel}
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
                Practice state stays local in v1. Nothing is saved until you move into
                Capture or a later assessment flow.
              </div>
            </div>

            <div style={compactCardStyle}>
              <div style={eyebrowStyle}>Practice progress</div>
              <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
                {completedPracticeTaskCount}/{totalPracticeTasks} tasks
              </div>
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                Work through understanding, fluency, problem solving, and reasoning
                before choosing a mini-check outcome.
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
                    border: "1px solid #ede9fe",
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
              <div style={eyebrowStyle}>Example</div>
              <div style={{ color: "#0f172a", fontWeight: 700, lineHeight: 1.6 }}>
                {activity.learnCard.example}
              </div>
              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                <strong style={{ color: "#0f172a" }}>Parent tip:</strong>{" "}
                {activity.learnCard.parentTip}
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={eyebrowStyle}>Practice loop</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                What happens on this page
              </h2>
              <div style={{ color: "#475569", lineHeight: 1.65 }}>
                Start with the Learn card, complete each practice section with as much
                support as needed, then use the Mini Check to decide whether this step is
                ready to move forward or needs another round.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 16,
              }}
            >
              {[
                "Learn the idea with clear examples.",
                "Practise with support across four section types.",
                "Choose a Mini Check outcome for the practice loop.",
                "Use the evidence summary as a starting point for capture.",
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

        <section style={{ display: "grid", gap: 20 }}>
          <div style={eyebrowStyle}>Practise</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {activity.sections.map((section) => (
              <PracticeSectionCard
                key={section.id}
                section={section}
                completedTaskIds={completedTaskIds}
                responses={responses}
                onToggleTask={toggleTaskCompletion}
                onResponseChange={updateResponse}
              />
            ))}
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
              <div style={eyebrowStyle}>Mini check</div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                Quick readiness check
              </h2>
              <div style={{ color: "#475569", lineHeight: 1.65, maxWidth: 760 }}>
                Keep the support lighter here. This outcome stays inside the practice loop
                and does not replace formal assessment confidence in My Assessments.
              </div>
            </div>

            <div
              style={{
                ...compactCardStyle,
                minWidth: 220,
                border: `1px solid ${miniCheckToneMeta[miniCheckOutcome].border}`,
                background: miniCheckToneMeta[miniCheckOutcome].background,
              }}
            >
              <div style={{ ...eyebrowStyle, color: miniCheckToneMeta[miniCheckOutcome].text }}>
                Mini Check outcome
              </div>
              <div
                style={{
                  color: miniCheckToneMeta[miniCheckOutcome].text,
                  fontSize: 20,
                  fontWeight: 800,
                  textTransform: "capitalize",
                }}
              >
                {miniCheckOutcome === "not_started"
                  ? "Not started"
                  : miniCheckOutcome.replace("_", " ")}
              </div>
              <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.5 }}>
                Choose the best fit after the learner tries the questions more independently.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginTop: 18,
            }}
          >
            {activity.miniCheck.map((task) => (
              <article
                key={task.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  background: "#ffffff",
                  padding: 14,
                  display: "grid",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    ...chipStyle,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#475569",
                    width: "fit-content",
                  }}
                >
                  {formatTaskTypeLabel(task.taskType)}
                </span>
                <div style={{ color: "#0f172a", fontWeight: 700, lineHeight: 1.6 }}>
                  {task.prompt}
                </div>
                <TaskResponseField
                  task={task}
                  value={responses[task.id] || ""}
                  onChange={(value) => updateResponse(task.id, value)}
                />
              </article>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            {([
              ["secure", "Secure"],
              ["developing", "Developing"],
              ["needs_support", "Needs support"],
            ] as const).map(([value, label]) => {
              const isSelected = miniCheckOutcome === value;
              const tone = miniCheckToneMeta[value];

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMiniCheckOutcome(value)}
                  style={{
                    border: `1px solid ${isSelected ? tone.border : "#cbd5e1"}`,
                    background: isSelected ? tone.background : "#ffffff",
                    color: isSelected ? tone.text : "#0f172a",
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
                Practice helps the learner build the skill with scaffolding. Assessment
                checks whether they can use the same idea independently in new
                representations and contexts.
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

            <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.55, marginTop: 12 }}>
              Formal assessment confidence still belongs in My Assessments. This page only
              previews how assessment questions should transfer the same pathway step into
              fresh representations.
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
                border: `1px solid ${miniCheckToneMeta[miniCheckOutcome].border}`,
                borderRadius: 16,
                background: miniCheckToneMeta[miniCheckOutcome].background,
                padding: 16,
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  ...eyebrowStyle,
                  color: miniCheckToneMeta[miniCheckOutcome].text,
                }}
              >
                Why this is suggested
              </div>
              <div style={{ color: "#0f172a", lineHeight: 1.6 }}>
                Suggested next steps are based on the Mini Check outcome, not on formal
                confidence saving. That keeps practice flow and assessment judgement
                clearly separate.
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
                  v1 keeps these actions light. Capture can receive the canonical pathway
                  context now, while parent notes and practice attempts remain local only.
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
                  onClick={resetPracticeLoop}
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
