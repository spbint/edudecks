"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CleanContentIssueReportButton from "@/app/components/clean/CleanContentIssueReportButton";
import type {
  ActivityPlayerV4Props,
  ActivityPlayerV4Sample,
  ActivityPlayerV4VisualMode,
} from "@/app/components/clean/activity-player-v4/ActivityPlayerV4.types";

const tokens = {
  page: "#F7F9FC",
  card: "#FFFFFF",
  navy: "#17204B",
  slate: "#5B6478",
  purple: "#6C4DF6",
  lavender: "#F2EDFF",
  green: "#2F9D68",
  mint: "#ECFDF4",
  amber: "#F59E0B",
  softAmber: "#FFF7E6",
  red: "#E85D75",
  softRed: "#FFF0F3",
  border: "#E7EAF2",
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: string) {
  return safe(value).toLowerCase().replace(/\s+/g, " ");
}

function isCorrect(sample: ActivityPlayerV4Sample, selected: string | null) {
  return Boolean(selected) && normalize(selected || "") === normalize(sample.expectedAnswer);
}

function parseNumbers(description: string | null | undefined) {
  const text = safe(description);
  const encodedNumbers = text.match(/numbers=([^|]+)/i)?.[1];
  if (encodedNumbers) {
    return encodedNumbers.split(",").map((item) => safe(item)).filter(Boolean);
  }
  const encodedGroups = text.match(/groups=([^|]+)/i)?.[1];
  if (encodedGroups) {
    return encodedGroups.split(",").map((item) => safe(item)).filter(Boolean);
  }
  return [];
}

function parseCaption(description: string | null | undefined) {
  const text = safe(description);
  return text.match(/caption=([^|]+)/i)?.[1] ?? text;
}

function inferCount(value: string) {
  const digit = safe(value).match(/\b\d+\b/)?.[0];
  return digit ? Number(digit) : null;
}

function DotThumbnail({ count, mode }: { count: number; mode: ActivityPlayerV4VisualMode }) {
  const compact = mode === "compact";
  const dotSize = compact ? 6 : 12;
  const boxSize = compact ? 46 : 128;
  const columns = count > 6 ? 4 : 3;

  return (
    <div
      aria-label={`${count} dots`}
      style={{
        width: "100%",
        minHeight: compact ? 36 : 96,
        maxHeight: compact ? 54 : 150,
        border: `1px solid ${tokens.border}`,
        borderRadius: compact ? 10 : 16,
        background: compact ? "#F8FAFC" : "#FFFFFF",
        display: "grid",
        placeItems: "center",
        padding: compact ? 4 : 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: boxSize,
          maxWidth: "100%",
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, ${dotSize}px)`,
          gap: compact ? 4 : 9,
          justifyContent: "center",
        }}
      >
        {Array.from({ length: Math.max(0, Math.min(count, 24)) }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: 999,
              background: tokens.purple,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MathVisualRendererV4({
  description,
  option,
  mode,
}: {
  description?: string | null;
  option?: string;
  mode: ActivityPlayerV4VisualMode;
}) {
  const count = option ? inferCount(option) : null;
  const values = parseNumbers(description);
  const caption = parseCaption(description);
  const compact = mode === "compact";

  if (count !== null && count >= 0 && count <= 12) {
    return <DotThumbnail count={count} mode={mode} />;
  }

  if (values.length) {
    return (
      <div
        aria-label={caption}
        style={{
          border: `1px solid ${tokens.border}`,
          borderRadius: compact ? 10 : 16,
          background: compact ? "#F8FAFC" : "#FFFFFF",
          padding: compact ? 6 : 14,
          display: "flex",
          flexWrap: "wrap",
          gap: compact ? 5 : 9,
          alignItems: "center",
          justifyContent: compact ? "center" : "flex-start",
          maxHeight: compact ? 66 : undefined,
          overflow: "hidden",
        }}
      >
        {values.slice(0, compact ? 6 : 12).map((value, index) => (
          <span
            key={`${value}-${index}`}
            style={{
              border: `1px solid ${tokens.border}`,
              borderRadius: 999,
              background: compact ? "#FFFFFF" : tokens.lavender,
              color: tokens.navy,
              padding: compact ? "3px 6px" : "6px 10px",
              fontSize: compact ? 11 : 14,
              fontWeight: 650,
              lineHeight: 1.2,
            }}
          >
            {value}
          </span>
        ))}
      </div>
    );
  }

  if (!description) return null;

  return (
    <div
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: compact ? 10 : 16,
        background: "#F8FAFC",
        color: tokens.slate,
        padding: compact ? 7 : 14,
        fontSize: compact ? 12 : 14,
        lineHeight: 1.45,
        maxHeight: compact ? 64 : undefined,
        overflow: "hidden",
      }}
    >
      {caption}
    </div>
  );
}

function ActivityProgress({
  current,
  total,
  mode,
}: {
  current: number;
  total: number;
  mode: ActivityPlayerV4Sample["mode"];
}) {
  const progress = total ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  const color = mode === "assess" ? tokens.green : tokens.purple;

  return (
    <div style={{ display: "grid", gap: 7 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          color: tokens.slate,
          fontSize: 12,
          fontWeight: 550,
        }}
      >
        <span>Question {current} of {total}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: "#E9ECF5", overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function AnswerOptionV4({
  label,
  option,
  selected,
  submitted,
  correct,
  visualDescription,
  onSelect,
}: {
  label: string;
  option: string;
  selected: boolean;
  submitted: boolean;
  correct: boolean;
  visualDescription?: string | null;
  onSelect: () => void;
}) {
  const borderColor = submitted && selected ? (correct ? tokens.green : tokens.red) : selected ? tokens.purple : tokens.border;
  const background = submitted && selected ? (correct ? tokens.mint : tokens.softRed) : selected ? tokens.lavender : "#FFFFFF";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        minHeight: 54,
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        background,
        color: tokens.navy,
        padding: "9px 10px",
        display: "grid",
        gridTemplateColumns: "26px minmax(0, 1fr)",
        alignItems: "center",
        gap: 9,
        textAlign: "left",
        font: "inherit",
        cursor: "pointer",
        boxShadow: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          border: `1px solid ${borderColor}`,
          background: "#FFFFFF",
          color: selected ? borderColor : tokens.slate,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 650,
        }}
      >
        {label}
      </span>
      <span style={{ display: "grid", gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 14, lineHeight: 1.35, fontWeight: 550 }}>{option}</span>
        <MathVisualRendererV4 description={visualDescription} option={option} mode="compact" />
      </span>
    </button>
  );
}

function HintDrawerV4({ hint }: { hint?: string | null }) {
  if (!hint) return null;

  return (
    <details
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: 14,
        background: "#FFFFFF",
        padding: "9px 11px",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          color: tokens.purple,
          fontSize: 13,
          fontWeight: 650,
          lineHeight: 1.35,
        }}
      >
        Need a hint?
      </summary>
      <div style={{ marginTop: 9, color: tokens.navy, fontSize: 13, lineHeight: 1.5 }}>
        {hint}
      </div>
    </details>
  );
}

function FeedbackPanelV4({
  correct,
  feedback,
}: {
  correct: boolean;
  feedback?: string | null;
}) {
  return (
    <div
      role="status"
      style={{
        border: `1px solid ${correct ? "#BBF7D0" : "#FDE68A"}`,
        borderRadius: 15,
        background: correct ? tokens.mint : tokens.softAmber,
        color: tokens.navy,
        padding: 12,
        display: "grid",
        gap: 5,
      }}
    >
      <strong style={{ color: correct ? tokens.green : tokens.amber, fontSize: 14, fontWeight: 650 }}>
        {correct ? "Good thinking." : "Not quite."}
      </strong>
      {feedback ? <span style={{ fontSize: 13, lineHeight: 1.5 }}>{feedback}</span> : null}
    </div>
  );
}

export default function ActivityPlayerV4({ samples }: ActivityPlayerV4Props) {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [mode, setMode] = useState<ActivityPlayerV4Sample["mode"]>("practice");
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sample = samples[sampleIndex] ?? samples[0];
  const effectiveMode = mode;
  const selectedCorrect = isCorrect(sample, selected);
  const hasNext = sampleIndex < samples.length - 1;

  const answerLabels = useMemo(() => ["A", "B", "C", "D", "E", "F"], []);

  function moveToSample(index: number) {
    setSampleIndex(index);
    setMode(samples[index]?.mode ?? "practice");
    setSelected(null);
    setSubmitted(false);
  }

  if (!sample) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: tokens.page, color: tokens.navy }}>
      <style jsx global>{`
        @media (max-width: 860px) {
          .activity-v4-canvas-grid {
            grid-template-columns: 1fr !important;
          }
          .activity-v4-header {
            align-items: flex-start !important;
            flex-direction: column !important;
          }
          .activity-v4-answer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <header
        className="activity-v4-header"
        style={{
          minHeight: 58,
          borderBottom: `1px solid ${tokens.border}`,
          background: "rgba(247,249,252,0.94)",
          backdropFilter: "blur(14px)",
          padding: "10px clamp(12px, 3vw, 24px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          href="/my-pathways"
          style={{
            color: tokens.navy,
            textDecoration: "none",
            border: `1px solid ${tokens.border}`,
            background: "#FFFFFF",
            borderRadius: 999,
            padding: "8px 11px",
            fontSize: 13,
            fontWeight: 650,
          }}
        >
          &larr; Back to My Pathways
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              borderRadius: 999,
              background: effectiveMode === "assess" ? tokens.mint : tokens.lavender,
              color: effectiveMode === "assess" ? tokens.green : tokens.purple,
              padding: "4px 9px",
              fontSize: 12,
              fontWeight: 650,
            }}
          >
            {effectiveMode === "assess" ? "Assess" : "Practise"}
          </span>
          <span style={{ color: tokens.slate, fontSize: 13 }}>{sample.stepLabel}</span>
        </div>
        <div style={{ color: tokens.slate, fontSize: 13 }}>Activity Player V4 lab</div>
      </header>

      <main style={{ padding: "clamp(14px, 4vw, 32px)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 14 }}>
          <section
            style={{
              border: `1px solid ${tokens.border}`,
              borderRadius: 22,
              background: tokens.card,
              boxShadow: "0 14px 36px rgba(23,32,75,0.065)",
              padding: "clamp(14px, 2.6vw, 22px)",
              display: "grid",
              gap: 16,
            }}
          >
            <ActivityProgress current={sampleIndex + 1} total={samples.length} mode={effectiveMode} />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {samples.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => moveToSample(index)}
                  style={{
                    border: `1px solid ${index === sampleIndex ? tokens.purple : tokens.border}`,
                    background: index === sampleIndex ? tokens.lavender : "#FFFFFF",
                    color: index === sampleIndex ? tokens.purple : tokens.slate,
                    borderRadius: 999,
                    padding: "7px 10px",
                    fontSize: 12,
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["practice", "assess"] as const).map((nextMode) => (
                <button
                  key={nextMode}
                  type="button"
                  onClick={() => {
                    setMode(nextMode);
                    setSelected(null);
                    setSubmitted(false);
                  }}
                  style={{
                    border: `1px solid ${mode === nextMode ? tokens.purple : tokens.border}`,
                    background: mode === nextMode ? tokens.lavender : "#FFFFFF",
                    color: mode === nextMode ? tokens.purple : tokens.navy,
                    borderRadius: 999,
                    padding: "7px 10px",
                    fontSize: 12,
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  {nextMode === "practice" ? "Practise" : "Assess"}
                </button>
              ))}
            </div>

            <div
              className="activity-v4-canvas-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
                gap: 18,
                alignItems: "start",
              }}
            >
              <div style={{ display: "grid", gap: 13 }}>
                <div style={{ color: tokens.slate, fontSize: 13, fontWeight: 600 }}>
                  {sample.source}
                </div>
                <h1
                  style={{
                    margin: 0,
                    color: tokens.navy,
                    fontSize: "clamp(22px, 3vw, 28px)",
                    lineHeight: 1.18,
                    fontWeight: 650,
                  }}
                >
                  {sample.prompt}
                </h1>
                <MathVisualRendererV4 description={sample.visualDescription} mode="full" />
              </div>

              <aside style={{ display: "grid", gap: 11 }}>
                <div
                  className="activity-v4-answer-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: sample.options.length <= 4 ? "repeat(2, minmax(0, 1fr))" : "1fr",
                    gap: 9,
                  }}
                >
                  {sample.options.map((option, index) => (
                    <AnswerOptionV4
                      key={`${sample.id}-${option}`}
                      label={answerLabels[index] ?? String(index + 1)}
                      option={option}
                      selected={selected === option}
                      submitted={submitted}
                      correct={normalize(option) === normalize(sample.expectedAnswer)}
                      visualDescription={sample.visualDescription}
                      onSelect={() => {
                        setSelected(option);
                        setSubmitted(false);
                      }}
                    />
                  ))}
                </div>

                <HintDrawerV4 hint={effectiveMode === "practice" || submitted ? sample.hint : sample.hint} />

                {submitted ? (
                  <FeedbackPanelV4 correct={selectedCorrect} feedback={sample.feedback} />
                ) : null}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "space-between" }}>
                  <CleanContentIssueReportButton
                    context={{
                      mode: effectiveMode === "assess" ? "assessment" : "practice",
                      stepTitle: sample.title,
                      itemId: effectiveMode === "assess" ? sample.id : null,
                      taskId: effectiveMode === "practice" ? sample.id : null,
                      prompt: sample.prompt,
                      responseType: "multiple_choice",
                      visualSupport: sample.visualDescription
                        ? { type: "context_card", description: sample.visualDescription }
                        : {},
                      context: {
                        labRoute: "/dev/activity-player-v4",
                        source: sample.source,
                      },
                    }}
                  />
                  <button
                    type="button"
                    disabled={!selected}
                    onClick={() => {
                      if (!submitted) {
                        setSubmitted(true);
                        return;
                      }
                      if (hasNext) {
                        moveToSample(sampleIndex + 1);
                      } else {
                        setSelected(null);
                        setSubmitted(false);
                        setSampleIndex(0);
                      }
                    }}
                    style={{
                      border: "1px solid #17204B",
                      background: selected ? "#17204B" : "#E7EAF2",
                      color: selected ? "#FFFFFF" : tokens.slate,
                      borderRadius: 12,
                      padding: "10px 14px",
                      fontSize: 14,
                      fontWeight: 650,
                      cursor: selected ? "pointer" : "not-allowed",
                    }}
                  >
                    {!submitted ? "Submit answer" : hasNext ? "Next question" : "Restart preview"}
                  </button>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
