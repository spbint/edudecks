"use client";

import React, { useEffect } from "react";
import type {
  PracticePlayerTaskItem,
  PracticeSectionType,
  PracticeTask,
  PracticeVisual,
} from "@/lib/clean/pathways/practiceActivities";

type PlayerMode = "practice" | "mini_check";

type CleanPathwayPracticePlayerProps = {
  open: boolean;
  mode: PlayerMode;
  title: string;
  items: PracticePlayerTaskItem[];
  currentIndex: number;
  responses: Record<string, string>;
  completedTaskIds: string[];
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onResponseChange: (taskId: string, value: string) => void;
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.36)",
  backdropFilter: "blur(6px)",
  display: "grid",
  placeItems: "center",
  padding: "clamp(12px, 3vw, 24px)",
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  width: "min(980px, 100%)",
  maxHeight: "min(92vh, 920px)",
  overflow: "hidden",
  borderRadius: 22,
  background: "#ffffff",
  border: "1px solid #E7EAF2",
  boxShadow: "0 24px 70px rgba(23,32,75,0.18)",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 15,
  background: "#ffffff",
  color: "#0f172a",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.6,
};

const sectionMeta: Record<
  PracticeSectionType | "mini_check",
  {
    accent: string;
    border: string;
    fill: string;
    chipText: string;
    chipFill: string;
  }
> = {
  understanding: {
    accent: "#2563eb",
    border: "#bfdbfe",
    fill: "#f8fbff",
    chipText: "#1d4ed8",
    chipFill: "#dbeafe",
  },
  fluency: {
    accent: "#16a34a",
    border: "#bbf7d0",
    fill: "#f7fef9",
    chipText: "#166534",
    chipFill: "#dcfce7",
  },
  problem_solving: {
    accent: "#d97706",
    border: "#fde68a",
    fill: "#fffdf5",
    chipText: "#b45309",
    chipFill: "#fef3c7",
  },
  reasoning: {
    accent: "#8b5cf6",
    border: "#ddd6fe",
    fill: "#fbf9ff",
    chipText: "#6d28d9",
    chipFill: "#ede9fe",
  },
  mini_check: {
    accent: "#0f766e",
    border: "#99f6e4",
    fill: "#f0fdfa",
    chipText: "#0f766e",
    chipFill: "#ccfbf1",
  },
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function getVisualModelLabel(task: PracticeTask) {
  if (task.visualModelType === "ten_frame") return "Ten frame";
  if (task.visualModelType === "number_pairs") return "Number-pair cards";
  if (task.visualModelType === "part_part_whole") return "Part-part-whole model";
  if (task.visualModelType === "counter_groups") return "Grouped counters";
  if (task.visualModelType === "comparison_pairs") return "Comparison cards";
  return "Visual model";
}

function getLearnerActionLabel(task: PracticeTask) {
  if (task.learnerAction === "build") return "Build with objects";
  if (task.learnerAction === "match") return "Match the picture";
  if (task.learnerAction === "count") return "Count what you see";
  if (task.learnerAction === "compare") return "Compare two models";
  if (task.learnerAction === "explain") return "Explain your thinking";
  if (task.learnerAction === "choose") return "Choose the best match";
  if (task.learnerAction === "tell") return "Tell the answer";
  if (task.learnerAction === "write_number") return "Write the number";
  return "Show your thinking";
}

function getScaffoldLabel(task: PracticeTask) {
  if (task.scaffoldLevel === "high") return "High support";
  if (task.scaffoldLevel === "medium") return "Guided support";
  if (task.scaffoldLevel === "low") return "Lighter support";
  return "Practice support";
}

function getMiniCheckVariantLabel(task: PracticeTask) {
  if (task.miniCheckVariant === "lighter_scaffold") return "Light scaffold";
  if (task.miniCheckVariant === "reduced_prompting") return "Reduced prompting";
  if (task.miniCheckVariant === "independent_transfer") return "Independent transfer";
  if (task.miniCheckVariant === "misconception_check") return "Misconception check";
  return "Mini check";
}

function sumPair(pair: string) {
  const parts = pair
    .split("+")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((value) => Number.isFinite(value));

  if (parts.length !== 2) return null;
  return parts[0] + parts[1];
}

function CounterDot({
  filled,
  accent,
  hidden,
}: {
  filled: boolean;
  accent: string;
  hidden?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        border: `1.5px solid ${filled ? accent : "#cbd5e1"}`,
        background: hidden ? "#e2e8f0" : filled ? accent : "#ffffff",
        opacity: hidden ? 0.85 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: hidden ? "#475569" : "#ffffff",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {hidden ? "?" : ""}
    </div>
  );
}

function TenFrameVisual({
  filled,
  total = 10,
  accent,
}: {
  filled: number;
  total?: number;
  accent: string;
}) {
  const cells = Array.from({ length: total }, (_, index) => index < filled);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 10,
        width: "min(360px, 100%)",
      }}
    >
      {cells.map((isFilled, index) => (
        <div
          key={`ten-frame-${index}`}
          style={{
            aspectRatio: "1 / 1",
            borderRadius: 16,
            border: `1.5px solid ${isFilled ? accent : "#cbd5e1"}`,
            background: isFilled ? `${accent}18` : "#ffffff",
            display: "grid",
            placeItems: "center",
          }}
        >
          <CounterDot filled={isFilled} accent={accent} />
        </div>
      ))}
    </div>
  );
}

function NumberPairsVisual({
  pairs,
  accent,
}: {
  pairs: string[];
  accent: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: 12,
        width: "100%",
      }}
    >
      {pairs.map((pair) => (
        <div
          key={pair}
          style={{
            borderRadius: 18,
            border: `1px solid ${accent}33`,
            background: "#ffffff",
            padding: "18px 12px",
            display: "grid",
            gap: 6,
            justifyItems: "center",
          }}
        >
          <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 22 }}>{pair}</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>Number pair</div>
        </div>
      ))}
    </div>
  );
}

function PartPartWholeVisual({
  whole,
  partA,
  partB,
  accent,
}: {
  whole: number;
  partA?: number;
  partB?: number;
  accent: string;
}) {
  const partValue = (value?: number) => (typeof value === "number" ? String(value) : "?");

  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center", width: "100%" }}>
      <div
        style={{
          minWidth: 120,
          padding: "14px 18px",
          borderRadius: 18,
          border: `1.5px solid ${accent}`,
          background: `${accent}14`,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>Whole</div>
        <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 28 }}>{whole}</div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 360,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        {[partA, partB].map((part, index) => (
          <div
            key={`part-${index}-${partValue(part)}`}
            style={{
              padding: "14px 18px",
              borderRadius: 18,
              border: "1.5px solid #cbd5e1",
              background: "#ffffff",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>Part</div>
            <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 26 }}>
              {partValue(part)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CounterGroupsVisual({
  groups,
  hiddenGroupIndex,
  labels,
  accent,
}: {
  groups: number[];
  hiddenGroupIndex?: number;
  labels?: string[];
  accent: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
        width: "100%",
      }}
    >
      {groups.map((groupSize, groupIndex) => {
        const isHidden = hiddenGroupIndex === groupIndex;

        return (
          <div
            key={`group-${groupIndex}-${groupSize}`}
            style={{
              borderRadius: 18,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              padding: 14,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ color: "#0f172a", fontWeight: 700 }}>
                {labels?.[groupIndex] || `Group ${groupIndex + 1}`}
              </div>
              <div style={{ color: "#64748b", fontSize: 12 }}>
                {isHidden ? "Hidden part" : `${groupSize} shown`}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {Array.from({ length: groupSize }, (_, index) => (
                <CounterDot
                  key={`group-${groupIndex}-dot-${index}`}
                  filled={!isHidden}
                  hidden={isHidden}
                  accent={accent}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComparisonPairsVisual({
  pairs,
  accent,
}: {
  pairs: string[];
  accent: string;
}) {
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 420 }}>
      {pairs.map((pair) => (
        <div
          key={pair}
          style={{
            borderRadius: 18,
            border: `1px solid ${accent}33`,
            background: "#ffffff",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 22 }}>{pair}</div>
          <div style={{ color: "#475569", fontWeight: 700, fontSize: 18 }}>
            = {sumPair(pair) ?? "?"}
          </div>
        </div>
      ))}
    </div>
  );
}

function VisualWorkspace({
  task,
  accent,
}: {
  task: PracticeTask;
  accent: string;
}) {
  if (!task.visual) {
    return (
      <div
        style={{
          borderRadius: 24,
          border: "1px dashed #cbd5e1",
          background: "#ffffff",
          minHeight: 220,
          display: "grid",
          placeItems: "center",
          padding: 18,
          color: "#64748b",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Use counters, drawing, or a whiteboard beside this prompt, then record what the
        learner showed.
      </div>
    );
  }

  const visual: PracticeVisual = task.visual;

  return (
    <div
      style={{
        borderRadius: 24,
        border: `1px solid ${accent}33`,
        background: "#ffffff",
        minHeight: 220,
        padding: "clamp(16px, 4vw, 24px)",
        display: "grid",
        placeItems: "center",
      }}
    >
      {visual.type === "ten_frame" ? (
        <TenFrameVisual filled={visual.filled} total={visual.total} accent={accent} />
      ) : null}
      {visual.type === "number_pairs" ? (
        <NumberPairsVisual pairs={visual.pairs} accent={accent} />
      ) : null}
      {visual.type === "part_part_whole" ? (
        <PartPartWholeVisual
          whole={visual.whole}
          partA={visual.partA}
          partB={visual.partB}
          accent={accent}
        />
      ) : null}
      {visual.type === "counter_groups" ? (
        <CounterGroupsVisual
          groups={visual.groups}
          hiddenGroupIndex={visual.hiddenGroupIndex}
          labels={visual.labels}
          accent={accent}
        />
      ) : null}
      {visual.type === "comparison_pairs" ? (
        <ComparisonPairsVisual pairs={visual.pairs} accent={accent} />
      ) : null}
    </div>
  );
}

function ResponseField({
  task,
  value,
  onChange,
  accent,
}: {
  task: PracticeTask;
  value: string;
  onChange: (value: string) => void;
  accent: string;
}) {
  if (task.taskType === "select" && task.options?.length) {
    return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
            gap: 10,
          }}
        >
        {task.options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              style={{
                border: `1px solid ${selected ? accent : "#cbd5e1"}`,
                background: selected ? `${accent}14` : "#ffffff",
                color: selected ? accent : "#0f172a",
                borderRadius: 16,
                padding: "14px 12px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (task.taskType === "draw_or_explain" || task.taskType === "parent_observation") {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          task.taskType === "parent_observation"
            ? "Note what the learner said, showed, or used."
            : "Use paper or counters if helpful, then describe what the learner showed."
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
        task.oralResponseAllowed
          ? "Write the number or say it aloud."
          : "Write the answer here."
      }
      inputMode="numeric"
      style={inputStyle}
    />
  );
}

function InstructionalFocus({
  task,
  mode,
}: {
  task: PracticeTask;
  mode: PlayerMode;
}) {
  const hasLearningIntention = Boolean(safe(task.learningIntention));
  const hasSuccessCriteria = Boolean(safe(task.successCriteria));

  if (!hasLearningIntention && !hasSuccessCriteria) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      {hasLearningIntention ? (
        <div
          style={{
            borderRadius: 18,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "14px 16px",
            display: "grid",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            {mode === "mini_check" ? "We are checking whether..." : "We are learning to..."}
          </div>
          <div style={{ color: "#0f172a", lineHeight: 1.6, fontWeight: 700 }}>
            {task.learningIntention}
          </div>
        </div>
      ) : null}

      {hasSuccessCriteria ? (
        <div
          style={{
            borderRadius: 18,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "14px 16px",
            display: "grid",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Success looks like
          </div>
          <div style={{ color: "#475569", lineHeight: 1.6 }}>{task.successCriteria}</div>
        </div>
      ) : null}
    </div>
  );
}

function CraPromptCards({
  task,
  mode,
}: {
  task: PracticeTask;
  mode: PlayerMode;
}) {
  const hasConcrete = Boolean(safe(task.concretePrompt));
  const hasRepresentational = Boolean(safe(task.representationalPrompt));
  const hasAbstract = Boolean(safe(task.abstractPrompt));

  if (!hasConcrete && !hasRepresentational && !hasAbstract) {
    return null;
  }

  const cardStyle: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    padding: "14px 16px",
    display: "grid",
    gap: 8,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "#64748b",
    textTransform: "uppercase",
  };

  if (mode === "practice") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {hasConcrete ? (
          <div style={cardStyle}>
            <div style={labelStyle}>Try with objects</div>
            <div style={{ color: "#475569", lineHeight: 1.6 }}>{task.concretePrompt}</div>
          </div>
        ) : null}

        {hasRepresentational ? (
          <div style={cardStyle}>
            <div style={labelStyle}>Look at the model</div>
            <div style={{ color: "#475569", lineHeight: 1.6 }}>
              {task.representationalPrompt}
            </div>
          </div>
        ) : null}

        {hasAbstract ? (
          <div style={cardStyle}>
            <div style={labelStyle}>Now use the numbers</div>
            <div style={{ color: "#0f172a", lineHeight: 1.6, fontWeight: 700 }}>
              {task.abstractPrompt}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {hasRepresentational ? (
        <div style={cardStyle}>
          <div style={labelStyle}>Look at the model</div>
          <div style={{ color: "#475569", lineHeight: 1.6 }}>
            {task.representationalPrompt}
          </div>
        </div>
      ) : null}

      {hasAbstract ? (
        <div style={cardStyle}>
          <div style={labelStyle}>Try it yourself</div>
          <div style={{ color: "#0f172a", lineHeight: 1.6, fontWeight: 700 }}>
            {task.abstractPrompt}
          </div>
        </div>
      ) : null}

      {hasConcrete ? (
        <details
          style={{
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            padding: "12px 14px",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              color: "#0f172a",
              fontWeight: 700,
              listStyle: "none",
            }}
          >
            If needed, start with objects
          </summary>
          <div style={{ color: "#475569", lineHeight: 1.6, marginTop: 10 }}>
            {task.concretePrompt}
          </div>
        </details>
      ) : null}
    </div>
  );
}

export default function CleanPathwayPracticePlayer({
  open,
  mode,
  title,
  items,
  currentIndex,
  responses,
  completedTaskIds,
  onClose,
  onBack,
  onNext,
  onResponseChange,
}: CleanPathwayPracticePlayerProps) {
  const currentItem = items[currentIndex] ?? null;
  const totalTasks = items.length;

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !currentItem) {
    return null;
  }

  const tone = sectionMeta[currentItem.sectionType];
  const responseValue = responses[currentItem.task.id] || "";
  const completedCount = items.filter((item) =>
    completedTaskIds.includes(item.task.id),
  ).length;
  const progressPercent = totalTasks
    ? Math.min(100, Math.max(0, ((currentIndex + 1) / totalTasks) * 100))
    : 0;
  const isLastTask = currentIndex === totalTasks - 1;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={dialogStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 20px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span
                style={{
                  ...chipStyle,
                  border: `1px solid ${tone.border}`,
                  background: tone.chipFill,
                  color: tone.chipText,
                }}
              >
                {currentItem.sectionTitle}
              </span>
              <span
                style={{
                  ...chipStyle,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#475569",
                }}
              >
                Task {currentIndex + 1} of {totalTasks}
              </span>
              <span
                style={{
                  ...chipStyle,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#475569",
                }}
              >
                {completedCount} complete
              </span>
            </div>
            <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 22 }}>{title}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f172a",
              borderRadius: 999,
              minHeight: 40,
              padding: "0 14px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
            aria-label="Close practice player"
          >
            Close
          </button>
        </div>

        <div
          style={{
            padding: "0 20px 18px",
            borderBottom: "1px solid #e2e8f0",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "#e2e8f0",
              overflow: "hidden",
              marginTop: 14,
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                borderRadius: 999,
                background: tone.accent,
                transition: "width 180ms ease",
              }}
            />
          </div>
        </div>

        <div
          style={{
            overflowY: "auto",
            padding: "clamp(16px, 3vw, 24px)",
            display: "grid",
            gap: 18,
            background: tone.fill,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 8,
              borderRadius: 20,
              border: `1px solid ${tone.border}`,
              background: "#ffffff",
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              {mode === "mini_check" ? "Mini Check focus" : "Learner goal"}
            </div>
            <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 20 }}>
              {currentItem.learnerGoal || currentItem.sectionTitle}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {currentItem.task.visualModelType ? (
                <div
                  style={{
                    display: "inline-flex",
                    width: "fit-content",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 10px",
                  }}
                >
                  {getVisualModelLabel(currentItem.task)}
                </div>
              ) : null}
              <div
                style={{
                  display: "inline-flex",
                  width: "fit-content",
                  borderRadius: 999,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 10px",
                }}
              >
                {getLearnerActionLabel(currentItem.task)}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  width: "fit-content",
                  borderRadius: 999,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 10px",
                }}
              >
                {getScaffoldLabel(currentItem.task)}
              </div>
              {currentItem.task.oralResponseAllowed ? (
                <div
                  style={{
                    display: "inline-flex",
                    width: "fit-content",
                    borderRadius: 999,
                    border: "1px solid #dbeafe",
                    background: "#f8fbff",
                    color: "#1d4ed8",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 10px",
                  }}
                >
                  Oral answer is fine
                </div>
              ) : null}
              {mode === "mini_check" && currentItem.task.miniCheckVariant ? (
                <div
                  style={{
                    display: "inline-flex",
                    width: "fit-content",
                    borderRadius: 999,
                    border: "1px solid #ccfbf1",
                    background: "#f0fdfa",
                    color: "#0f766e",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 10px",
                  }}
                >
                  {getMiniCheckVariantLabel(currentItem.task)}
                </div>
              ) : null}
            </div>
          </div>

          <InstructionalFocus task={currentItem.task} mode={mode} />

          <details
            style={{
              borderRadius: 16,
              border: "1px solid #E7EAF2",
              background: "#ffffff",
              padding: "12px 14px",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                color: "#6C4DF6",
                fontWeight: 800,
                listStyle: "none",
              }}
            >
              {mode === "mini_check" ? "Need a small prompt?" : "Need a hint?"}
            </summary>
            <div style={{ marginTop: 12 }}>
              <CraPromptCards task={currentItem.task} mode={mode} />
            </div>
          </details>

          <VisualWorkspace task={currentItem.task} accent={tone.accent} />

          <div
            style={{
              display: "grid",
              gap: 14,
              borderRadius: 22,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              padding: "clamp(16px, 3vw, 22px)",
            }}
          >
            <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 24, lineHeight: 1.25 }}>
              {currentItem.task.abstractPrompt || currentItem.task.prompt}
            </div>

            <ResponseField
              task={currentItem.task}
              value={responseValue}
              onChange={(value) => onResponseChange(currentItem.task.id, value)}
              accent={tone.accent}
            />

            {currentItem.task.parentPrompt ? (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  padding: "12px 14px",
                  color: "#475569",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: "#0f172a" }}>Parent prompt:</strong>{" "}
                {currentItem.task.parentPrompt}
              </div>
            ) : null}

            {currentItem.task.reflectionPrompt ? (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid #dbeafe",
                  background: "#f8fbff",
                  padding: "12px 14px",
                  color: "#475569",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: "#0f172a" }}>Talk about it:</strong>{" "}
                {currentItem.task.reflectionPrompt}
              </div>
            ) : null}

            {currentItem.task.feedbackPrompt && safe(responseValue) ? (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  padding: "12px 14px",
                  color: "#475569",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: "#0f172a" }}>Helpful next prompt:</strong>{" "}
                {currentItem.task.feedbackPrompt}
              </div>
            ) : null}

            {currentItem.task.supportPrompt ? (
              <details
                style={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  padding: "12px 14px",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    color: "#0f172a",
                    fontWeight: 700,
                    listStyle: "none",
                  }}
                >
                  {mode === "mini_check" ? "Parent tip" : "Need a hint?"}
                </summary>
                <div style={{ color: "#475569", lineHeight: 1.65, marginTop: 10 }}>
                  {currentItem.task.supportPrompt}
                </div>
              </details>
            ) : null}

            {currentItem.task.misconceptionPrompt ? (
              <details
                style={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  padding: "12px 14px",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    color: "#0f172a",
                    fontWeight: 700,
                    listStyle: "none",
                  }}
                >
                  What to watch for
                </summary>
                <div style={{ color: "#475569", lineHeight: 1.65, marginTop: 10 }}>
                  {currentItem.task.misconceptionPrompt}
                </div>
              </details>
            ) : null}

            {safe(currentItem.task.expectedAnswer) && safe(responseValue) ? (
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.55 }}>
                <strong style={{ color: "#0f172a" }}>Parent check:</strong>{" "}
                {Array.isArray(currentItem.task.expectedAnswer)
                  ? currentItem.task.expectedAnswer.join(" or ")
                  : currentItem.task.expectedAnswer}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            padding: "16px 20px 20px",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            borderTop: "1px solid #e2e8f0",
            background: "#ffffff",
          }}
        >
          <button
            type="button"
            onClick={onBack}
            disabled={currentIndex === 0}
            style={{
              border: "1px solid #cbd5e1",
              background: currentIndex === 0 ? "#f8fafc" : "#ffffff",
              color: currentIndex === 0 ? "#94a3b8" : "#0f172a",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 700,
              cursor: currentIndex === 0 ? "default" : "pointer",
              minWidth: 110,
            }}
          >
            Back
          </button>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Exit
            </button>
            <button
              type="button"
              onClick={onNext}
              style={{
                border: `1px solid ${tone.accent}`,
                background: tone.accent,
                color: "#ffffff",
                borderRadius: 12,
                padding: "12px 18px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                minWidth: 120,
              }}
            >
              {isLastTask
                ? mode === "mini_check"
                  ? "Finish mini check"
                  : "Finish practice"
                : "Next"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
