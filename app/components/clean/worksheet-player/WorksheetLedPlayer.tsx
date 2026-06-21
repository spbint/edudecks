"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

const tokens = {
  page: "#F7F9FC",
  card: "#FFFFFF",
  navy: "#17204B",
  slate: "#5B6478",
  border: "#E7EAF2",
  purple: "#6C4DF6",
  lavender: "#F2EDFF",
  green: "#2F9D68",
  mint: "#ECFDF4",
  amber: "#B7791F",
  softAmber: "#FFF7E6",
  red: "#C2415D",
  softRed: "#FFF0F3",
};

export type WorksheetLedMark = "correct" | "almost" | "needs_support";

export type WorksheetLedActivity = {
  id: string;
  title: string;
  prompt: string;
  mode: "practise" | "assess";
  expectedAnswer?: string;
  explanation?: string;
  supportHint?: string;
  visualDescription?: string;
  worksheetReference?: string;
};

export type WorksheetLedPlayerProps = {
  activities: WorksheetLedActivity[];
  chrome?: "standalone" | "embedded";
  onMark?: (input: {
    activity: WorksheetLedActivity;
    mark: WorksheetLedMark;
    response: string;
    index: number;
  }) => void;
  onComplete?: () => void;
};

export function shouldUseWorksheetLedPlayer(activities?: WorksheetLedActivity[] | null) {
  return Boolean(activities?.length);
}

export default function WorksheetLedPlayer({
  activities,
  chrome = "standalone",
  onMark,
  onComplete,
}: WorksheetLedPlayerProps) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [marks, setMarks] = useState<Record<string, WorksheetLedMark>>({});
  const activity = activities[index];
  const progress = activities.length ? ((index + 1) / activities.length) * 100 : 0;

  if (!activities.length) {
    return (
      <section style={{ padding: 20, color: tokens.navy }}>
        No worksheet-led activities available.
      </section>
    );
  }

  const selectedMark = marks[activity.id];
  const isAssess = activity.mode === "assess";

  const markActivity = (mark: WorksheetLedMark) => {
    setMarks((current) => ({ ...current, [activity.id]: mark }));
    onMark?.({
      activity,
      mark,
      response: formatMarkResponse(mark, activity.expectedAnswer),
      index,
    });
  };

  const goNext = () => {
    if (index >= activities.length - 1) {
      onComplete?.();
      return;
    }
    setIndex((current) => current + 1);
    setRevealed(false);
  };

  return (
    <main
      data-worksheet-led-player="polished-v1"
      style={{
        minHeight: chrome === "standalone" ? "100vh" : undefined,
        background: tokens.page,
        padding: "clamp(14px, 2.4vw, 24px)",
      }}
    >
      <section style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 14 }}>
        <header style={headerStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={eyebrowStyle}>
                {isAssess ? "Worksheet check" : "Worksheet practice"}
              </span>
              <span style={{ color: tokens.slate, fontSize: 13, fontWeight: 720 }}>
                Task {index + 1} of {activities.length}
              </span>
            </div>
            <div style={progressTrackStyle}>
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: isAssess ? tokens.green : tokens.purple,
                }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            <p style={{ margin: 0, color: tokens.slate, fontSize: 13, fontWeight: 700 }}>
              {activity.title}
            </p>
            <h1 style={promptStyle}>{activity.prompt}</h1>
          </div>
        </header>

        <section style={taskCardStyle}>
          <div style={worksheetAreaStyle}>
            <span style={worksheetLabelStyle}>Worksheet task</span>
            {activity.visualDescription ? (
              <p style={visualDescriptionStyle}>{activity.visualDescription}</p>
            ) : (
              <p style={visualDescriptionStyle}>
                Work from the worksheet-style prompt, then reveal the answer when ready.
              </p>
            )}
          </div>

          {activity.supportHint && !revealed ? (
            <details style={detailsStyle}>
              <summary style={summaryStyle}>Hint</summary>
              <p style={{ margin: "8px 0 0", color: tokens.slate, lineHeight: 1.5 }}>
                {activity.supportHint}
              </p>
            </details>
          ) : null}

          {revealed ? (
            <section style={answerStyle}>
              <span style={worksheetLabelStyle}>Answer</span>
              <strong style={{ color: tokens.navy, fontSize: "clamp(22px, 3vw, 30px)", lineHeight: 1.18 }}>
                {activity.expectedAnswer || "Use the marking guide."}
              </strong>
              {activity.explanation ? (
                <p style={{ margin: 0, color: tokens.slate, lineHeight: 1.5, fontSize: 15 }}>
                  {activity.explanation}
                </p>
              ) : null}
            </section>
          ) : null}
        </section>

        <footer style={footerStyle}>
          <button
            type="button"
            onClick={() => {
              setIndex((current) => Math.max(0, current - 1));
              setRevealed(false);
            }}
            disabled={index === 0}
            style={buttonStyle("secondary")}
          >
            Previous
          </button>

          {!revealed ? (
            <button type="button" onClick={() => setRevealed(true)} style={buttonStyle("primary")}>
              Show answer
            </button>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
              {(["correct", "almost", "needs_support"] as const).map((mark) => (
                <button
                  key={mark}
                  type="button"
                  onClick={() => markActivity(mark)}
                  style={markButtonStyle(mark, selectedMark === mark)}
                >
                  {markLabel(mark)}
                </button>
              ))}
            </div>
          )}

          <button type="button" onClick={goNext} style={buttonStyle("secondary")}>
            {index >= activities.length - 1 ? "Finish" : "Next"}
          </button>
        </footer>
      </section>
    </main>
  );
}

function formatMarkResponse(mark: WorksheetLedMark, answer?: string) {
  const prefix = mark === "correct" ? "Correct" : mark === "almost" ? "Almost" : "Needs support";
  return answer ? `${prefix}: ${answer}` : prefix;
}

function markLabel(mark: WorksheetLedMark) {
  if (mark === "correct") return "Correct";
  if (mark === "almost") return "Almost";
  return "Needs support";
}

function buttonStyle(variant: "primary" | "secondary") {
  return {
    border: variant === "primary" ? 0 : `1px solid ${tokens.border}`,
    borderRadius: 999,
    background: variant === "primary" ? tokens.purple : "#FFFFFF",
    color: variant === "primary" ? "#FFFFFF" : tokens.navy,
    padding: "10px 15px",
    minHeight: 42,
    font: "inherit",
    fontSize: 14,
    fontWeight: 760,
    cursor: "pointer",
    boxShadow: variant === "primary" ? "0 8px 16px rgba(108,77,246,0.16)" : "none",
  } satisfies CSSProperties;
}

function markButtonStyle(mark: WorksheetLedMark, selected: boolean) {
  const tone =
    mark === "correct"
      ? { color: tokens.green, background: tokens.mint, border: "rgba(47,157,104,0.35)" }
      : mark === "almost"
        ? { color: tokens.amber, background: tokens.softAmber, border: "rgba(183,121,31,0.32)" }
        : { color: tokens.red, background: tokens.softRed, border: "rgba(194,65,93,0.28)" };

  return {
    border: `1px solid ${selected ? tone.color : tone.border}`,
    borderRadius: 999,
    background: selected ? tone.background : "#FFFFFF",
    color: selected ? tone.color : tokens.navy,
    padding: "10px 13px",
    minHeight: 42,
    font: "inherit",
    fontSize: 14,
    fontWeight: 760,
    cursor: "pointer",
  } satisfies CSSProperties;
}

const headerStyle = {
  border: `1px solid ${tokens.border}`,
  borderRadius: 20,
  background: "#FFFFFF",
  padding: "clamp(16px, 2.2vw, 22px)",
  display: "grid",
  gap: 13,
  boxShadow: "0 8px 22px rgba(23,32,75,0.04)",
} satisfies CSSProperties;

const taskCardStyle = {
  border: `1px solid ${tokens.border}`,
  borderRadius: 20,
  background: "#FFFFFF",
  padding: "clamp(16px, 2.4vw, 24px)",
  display: "grid",
  gap: 14,
  boxShadow: "0 8px 22px rgba(23,32,75,0.035)",
} satisfies CSSProperties;

const worksheetAreaStyle = {
  border: `1px solid ${tokens.border}`,
  borderRadius: 18,
  background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
  minHeight: 240,
  padding: "clamp(18px, 3vw, 30px)",
  display: "grid",
  alignContent: "center",
  gap: 12,
} satisfies CSSProperties;

const answerStyle = {
  border: `1px solid rgba(47,157,104,0.35)`,
  borderRadius: 18,
  background: tokens.mint,
  padding: "clamp(16px, 2.2vw, 22px)",
  display: "grid",
  gap: 9,
} satisfies CSSProperties;

const footerStyle = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
} satisfies CSSProperties;

const eyebrowStyle = {
  borderRadius: 999,
  background: tokens.lavender,
  color: tokens.purple,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
} satisfies CSSProperties;

const promptStyle = {
  margin: 0,
  color: tokens.navy,
  fontSize: "clamp(22px, 3vw, 28px)",
  lineHeight: 1.2,
  fontWeight: 760,
} satisfies CSSProperties;

const visualDescriptionStyle = {
  margin: 0,
  color: tokens.navy,
  fontSize: "clamp(20px, 3vw, 28px)",
  lineHeight: 1.25,
  fontWeight: 690,
  textAlign: "center",
} satisfies CSSProperties;

const worksheetLabelStyle = {
  color: tokens.slate,
  fontSize: 13,
  fontWeight: 760,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
} satisfies CSSProperties;

const progressTrackStyle = {
  height: 6,
  borderRadius: 999,
  background: "#E9ECF5",
  overflow: "hidden",
} satisfies CSSProperties;

const detailsStyle = {
  border: `1px solid ${tokens.border}`,
  borderRadius: 16,
  background: "#FFFFFF",
  padding: "12px 14px",
} satisfies CSSProperties;

const summaryStyle = {
  cursor: "pointer",
  color: tokens.navy,
  fontWeight: 760,
} satisfies CSSProperties;
