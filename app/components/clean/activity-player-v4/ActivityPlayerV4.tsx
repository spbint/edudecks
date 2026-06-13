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

type ObjectKind =
  | "apple"
  | "lemon"
  | "strawberry"
  | "book"
  | "pencil"
  | "coin"
  | "block"
  | "shell"
  | "sticker"
  | "cup"
  | "ticket"
  | "counter";

type ParsedVisual = {
  caption: string;
  numbers: string[];
  groups: number[];
  labels: string[];
  objectKind: ObjectKind;
};

const WORD_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const OBJECT_WORDS: Array<[ObjectKind, string[]]> = [
  ["apple", ["apple", "apples"]],
  ["lemon", ["lemon", "lemons"]],
  ["strawberry", ["strawberry", "strawberries"]],
  ["book", ["book", "books"]],
  ["pencil", ["pencil", "pencils"]],
  ["coin", ["coin", "coins"]],
  ["block", ["block", "blocks"]],
  ["shell", ["shell", "shells"]],
  ["sticker", ["sticker", "stickers", "star"]],
  ["cup", ["cup", "cups"]],
  ["ticket", ["ticket", "tickets"]],
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: string) {
  return safe(value).toLowerCase().replace(/\s+/g, " ");
}

function isCorrect(sample: ActivityPlayerV4Sample, selected: string | null) {
  return Boolean(selected) && normalize(selected || "") === normalize(sample.expectedAnswer);
}

function extractList(description: string, key: "numbers" | "groups" | "labels") {
  const value = description.match(new RegExp(`${key}=([^|]+)`, "i"))?.[1];
  return value ? value.split(",").map((item) => safe(item)).filter(Boolean) : [];
}

function inferObjectKind(text: string): ObjectKind {
  const lower = text.toLowerCase();
  const match = OBJECT_WORDS.find(([, words]) => words.some((word) => lower.includes(word)));
  return match?.[0] ?? "counter";
}

function parseVisual(description?: string | null): ParsedVisual {
  const text = safe(description);
  const caption = text.match(/caption=([^|]+)/i)?.[1] ?? text;
  const numbers = extractList(text, "numbers");
  const labels = extractList(text, "labels");
  const groups = extractList(text, "groups")
    .map((item) => Number(item.replace(/[^\d.-]/g, "")))
    .filter((item) => Number.isFinite(item));

  return {
    caption,
    numbers,
    groups,
    labels,
    objectKind: inferObjectKind(`${caption} ${labels.join(" ")} ${text}`),
  };
}

function inferCount(value?: string | null) {
  const text = safe(value);
  const digit = text.match(/\b\d+\b/)?.[0];
  if (digit) return Number(digit);

  const lower = text.toLowerCase();
  const word = Object.keys(WORD_NUMBERS).find((key) => new RegExp(`\\b${key}\\b`).test(lower));
  return word ? WORD_NUMBERS[word] : null;
}

function isMathSymbolOption(option: string) {
  return /[\^*/=:$]|sqrt|km|kg|\$|cups?|hours?|h\b/i.test(option);
}

function ObjectGlyph({
  kind,
  size,
  index,
}: {
  kind: ObjectKind;
  size: number;
  index: number;
}) {
  const radius = Math.max(4, size / 2);
  const baseStyle = {
    width: size,
    height: size,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  } as const;

  if (kind === "coin") {
    return (
      <span aria-hidden="true" style={{ ...baseStyle, borderRadius: 999, background: "#FDE68A", border: "1px solid #F59E0B" }} />
    );
  }

  if (kind === "ticket") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          width: size * 1.28,
          borderRadius: 4,
          background: "#EEF2FF",
          border: `1px solid ${tokens.purple}`,
        }}
      />
    );
  }

  if (kind === "book") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          width: size * 0.82,
          borderRadius: 3,
          background: index % 2 ? "#DBEAFE" : tokens.lavender,
          border: `1px solid ${tokens.border}`,
        }}
      />
    );
  }

  if (kind === "pencil") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          width: size * 1.45,
          height: Math.max(6, size * 0.34),
          borderRadius: 999,
          background: "#FDE68A",
          border: "1px solid #F59E0B",
        }}
      />
    );
  }

  if (kind === "block") {
    return (
      <span aria-hidden="true" style={{ ...baseStyle, borderRadius: 5, background: "#DBEAFE", border: `1px solid ${tokens.border}` }} />
    );
  }

  if (kind === "cup") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          width: size * 0.9,
          height: size * 0.82,
          borderRadius: "4px 4px 8px 8px",
          background: "#E0F2FE",
          border: `1px solid ${tokens.border}`,
        }}
      />
    );
  }

  if (kind === "lemon") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          borderRadius: `${radius}px ${radius + 5}px`,
          background: "#FDE047",
          border: "1px solid #EAB308",
          transform: "rotate(-18deg)",
        }}
      />
    );
  }

  if (kind === "strawberry") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          borderRadius: "55% 55% 65% 65%",
          background: "#F87171",
          border: "1px solid #E85D75",
        }}
      />
    );
  }

  if (kind === "apple") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...baseStyle,
          borderRadius: "48% 48% 55% 55%",
          background: "#FCA5A5",
          border: "1px solid #E85D75",
        }}
      />
    );
  }

  if (kind === "shell") {
    return (
      <span aria-hidden="true" style={{ ...baseStyle, borderRadius: "60% 40% 55% 45%", background: "#FDEDD3", border: `1px solid ${tokens.border}` }} />
    );
  }

  if (kind === "sticker") {
    return (
      <span aria-hidden="true" style={{ ...baseStyle, borderRadius: 999, background: tokens.softAmber, border: "1px solid #F59E0B" }} />
    );
  }

  return (
    <span aria-hidden="true" style={{ ...baseStyle, borderRadius: 999, background: tokens.purple }} />
  );
}

function CounterGroupVisual({
  count,
  mode,
  kind,
}: {
  count: number;
  mode: ActivityPlayerV4VisualMode;
  kind: ObjectKind;
}) {
  const compact = mode === "compact";
  const feedback = mode === "feedback";
  const size = compact ? 9 : feedback ? 12 : 18;
  const gap = compact ? 4 : feedback ? 6 : 10;
  const visibleCount = Math.max(0, Math.min(count, compact ? 12 : 24));

  return (
    <div
      aria-label={`${count} ${kind === "counter" ? "counters" : kind}`}
      style={{
        width: "100%",
        minHeight: compact ? 32 : feedback ? 42 : 118,
        maxHeight: compact ? 66 : feedback ? 78 : 170,
        border: `1px solid ${tokens.border}`,
        borderRadius: compact ? 10 : 16,
        background: compact ? "#F8FAFC" : "#FFFFFF",
        display: "grid",
        placeItems: "center",
        padding: compact ? 5 : feedback ? 9 : 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap,
          maxWidth: compact ? 82 : 220,
        }}
      >
        {Array.from({ length: visibleCount }, (_, index) => (
          <ObjectGlyph key={index} kind={kind} size={size} index={index} />
        ))}
      </div>
    </div>
  );
}

function NumberChipVisual({
  values,
  mode,
  caption,
}: {
  values: string[];
  mode: ActivityPlayerV4VisualMode;
  caption: string;
}) {
  const compact = mode === "compact";
  const feedback = mode === "feedback";

  return (
    <div
      aria-label={caption || values.join(", ")}
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: compact ? 10 : 16,
        background: compact ? "#F8FAFC" : "#FFFFFF",
        padding: compact ? 5 : feedback ? 9 : 14,
        display: "flex",
        flexWrap: "wrap",
        gap: compact ? 4 : 8,
        alignItems: "center",
        justifyContent: compact ? "center" : "flex-start",
        maxHeight: compact ? 62 : undefined,
        overflow: "hidden",
      }}
    >
      {values.slice(0, compact ? 4 : 12).map((value, index) => (
        <span
          key={`${value}-${index}`}
          style={{
            border: `1px solid ${tokens.border}`,
            borderRadius: 999,
            background: compact ? "#FFFFFF" : tokens.lavender,
            color: tokens.navy,
            padding: compact ? "2px 6px" : "6px 10px",
            fontSize: compact ? 11 : 14,
            fontWeight: 600,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function SimpleTableVisual({
  values,
  mode,
  caption,
}: {
  values: string[];
  mode: ActivityPlayerV4VisualMode;
  caption: string;
}) {
  const compact = mode === "compact";
  const rows = values.filter(Boolean);

  if (compact) {
    return (
      <div
        aria-label={caption || rows.join(", ")}
        style={{
          border: `1px solid ${tokens.border}`,
          borderRadius: 10,
          background: "#F8FAFC",
          padding: 5,
          display: "grid",
          gap: 3,
          maxHeight: 66,
          overflow: "hidden",
        }}
      >
        {rows.slice(0, 3).map((row, index) => {
          const [left, right] = row.includes(":") ? row.split(":") : [row, ""];
          return (
            <div
              key={`${row}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: right ? "1fr 1fr" : "1fr",
                gap: 3,
              }}
            >
              <span style={{ borderRadius: 5, background: "#FFFFFF", padding: "2px 4px", fontSize: 10, color: tokens.navy }}>{left}</span>
              {right ? <span style={{ borderRadius: 5, background: "#FFFFFF", padding: "2px 4px", fontSize: 10, color: tokens.navy }}>{right}</span> : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      aria-label={caption || rows.join(", ")}
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: 16,
        background: "#FFFFFF",
        padding: 14,
        display: "grid",
        gap: 10,
      }}
    >
      {caption ? <div style={{ color: tokens.slate, fontSize: 13, fontWeight: 600 }}>{caption}</div> : null}
      <div style={{ display: "grid", gap: 6 }}>
        {rows.slice(0, 5).map((row, index) => {
          const [left, right] = row.includes(":") ? row.split(":") : [row, ""];
          return (
            <div
              key={`${row}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: right ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
                gap: 6,
                alignItems: "center",
              }}
            >
              <span style={{ borderRadius: 10, background: "#F8FAFC", border: `1px solid ${tokens.border}`, padding: "7px 9px", fontSize: 13, color: tokens.navy }}>
                {left}
              </span>
              {right ? (
                <span style={{ borderRadius: 10, background: "#F8FAFC", border: `1px solid ${tokens.border}`, padding: "7px 9px", fontSize: 13, color: tokens.navy }}>
                  {right}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextVisual({
  text,
  mode,
}: {
  text: string;
  mode: ActivityPlayerV4VisualMode;
}) {
  if (mode === "compact") return null;

  return (
    <div
      style={{
        border: `1px solid ${tokens.border}`,
        borderRadius: mode === "feedback" ? 14 : 16,
        background: "#F8FAFC",
        color: tokens.slate,
        padding: mode === "feedback" ? 10 : 14,
        fontSize: mode === "feedback" ? 13 : 14,
        lineHeight: 1.5,
      }}
    >
      {text}
    </div>
  );
}

function MathVisualRendererV4({
  description,
  option,
  mode,
  kind,
}: {
  description?: string | null;
  option?: string;
  mode: ActivityPlayerV4VisualMode;
  kind?: ActivityPlayerV4Sample["visualKind"];
}) {
  const parsed = parseVisual(description);
  const optionCount = inferCount(option);
  const supportCount = inferCount(parsed.caption || description);
  const resolvedKind = kind ?? (parsed.numbers.some((value) => value.includes(":")) ? "table" : "text");
  const objectKind = parsed.objectKind;
  const compact = mode === "compact";

  if (compact && option) {
    if ((resolvedKind === "dots" || resolvedKind === "objects") && optionCount !== null && optionCount >= 0 && optionCount <= 12) {
      return <CounterGroupVisual count={optionCount} mode={mode} kind={objectKind} />;
    }

    if (resolvedKind === "table" && parsed.numbers.length) {
      return <SimpleTableVisual values={parsed.numbers} mode={mode} caption={parsed.caption} />;
    }

    if (resolvedKind === "numbers" && isMathSymbolOption(option)) {
      return <NumberChipVisual values={[option]} mode={mode} caption={option} />;
    }

    if (/^\s*\d+(\.\d+)?\s*$/.test(option) && Number(option) <= 12) {
      return <CounterGroupVisual count={Number(option)} mode={mode} kind="counter" />;
    }

    return null;
  }

  if (resolvedKind === "table" && parsed.numbers.length) {
    return <SimpleTableVisual values={parsed.numbers} mode={mode} caption={parsed.caption} />;
  }

  if (parsed.groups.length) {
    return (
      <div style={{ display: "grid", gap: mode === "feedback" ? 8 : 10 }}>
        {parsed.caption ? <div style={{ color: tokens.slate, fontSize: 13, fontWeight: 600 }}>{parsed.caption}</div> : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
          {parsed.groups.slice(0, 6).map((count, index) => (
            <div key={`${count}-${index}`} style={{ display: "grid", gap: 5 }}>
              <CounterGroupVisual count={count} mode={mode} kind={objectKind} />
              {parsed.labels[index] ? (
                <span style={{ color: tokens.slate, fontSize: 12, textAlign: "center" }}>{parsed.labels[index]}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if ((resolvedKind === "dots" || resolvedKind === "objects") && supportCount !== null && supportCount >= 0 && supportCount <= 12) {
    return <CounterGroupVisual count={supportCount} mode={mode} kind={objectKind} />;
  }

  if (parsed.numbers.length) {
    return <NumberChipVisual values={parsed.numbers} mode={mode} caption={parsed.caption} />;
  }

  if (!description) return null;

  return <TextVisual text={parsed.caption} mode={mode} />;
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
  visualKind,
  onSelect,
}: {
  label: string;
  option: string;
  selected: boolean;
  submitted: boolean;
  correct: boolean;
  visualDescription?: string | null;
  visualKind?: ActivityPlayerV4Sample["visualKind"];
  onSelect: () => void;
}) {
  const borderColor = submitted && selected ? (correct ? tokens.green : tokens.red) : selected ? tokens.purple : tokens.border;
  const background = submitted && selected ? (correct ? tokens.mint : tokens.softRed) : selected ? tokens.lavender : "#FFFFFF";
  const stateLabel = submitted && selected ? (correct ? "Correct" : "Try again") : selected ? "Selected" : "";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${label}. ${option}${stateLabel ? `. ${stateLabel}` : ""}`}
      style={{
        minHeight: 54,
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        background,
        color: tokens.navy,
        padding: "9px 10px",
        display: "grid",
        gridTemplateColumns: "24px minmax(0, 1fr)",
        alignItems: "center",
        gap: 8,
        textAlign: "left",
        font: "inherit",
        cursor: "pointer",
        boxShadow: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
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
        <span style={{ fontSize: 14, lineHeight: 1.32, fontWeight: 550 }}>{option}</span>
        <MathVisualRendererV4
          description={visualDescription}
          option={option}
          mode="compact"
          kind={visualKind}
        />
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
  visualDescription,
  visualKind,
}: {
  correct: boolean;
  feedback?: string | null;
  visualDescription?: string | null;
  visualKind?: ActivityPlayerV4Sample["visualKind"];
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
        gap: 8,
      }}
    >
      <strong style={{ color: correct ? tokens.green : tokens.amber, fontSize: 14, fontWeight: 650 }}>
        {correct ? "Good thinking." : "Not quite."}
      </strong>
      {feedback ? <span style={{ fontSize: 13, lineHeight: 1.5 }}>{feedback}</span> : null}
      {visualDescription ? (
        <MathVisualRendererV4 description={visualDescription} mode="feedback" kind={visualKind} />
      ) : null}
    </div>
  );
}

export default function ActivityPlayerV4({ samples }: ActivityPlayerV4Props) {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [mode, setMode] = useState<ActivityPlayerV4Sample["mode"]>("practice");
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sample = samples[sampleIndex] ?? samples[0];
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

  const effectiveMode = mode;
  const selectedCorrect = isCorrect(sample, selected);
  const hasNext = sampleIndex < samples.length - 1;

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
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
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
            </div>

            <div
              className="activity-v4-canvas-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.12fr) minmax(340px, 0.88fr)",
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
                    fontSize: "clamp(22px, 3vw, 30px)",
                    lineHeight: 1.16,
                    fontWeight: 650,
                  }}
                >
                  {sample.prompt}
                </h1>
                <MathVisualRendererV4
                  description={sample.visualDescription}
                  mode="full"
                  kind={sample.visualKind}
                />
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
                      visualKind={sample.visualKind}
                      onSelect={() => {
                        setSelected(option);
                        setSubmitted(false);
                      }}
                    />
                  ))}
                </div>

                <HintDrawerV4 hint={sample.hint} />

                {submitted ? (
                  <FeedbackPanelV4
                    correct={selectedCorrect}
                    feedback={sample.feedback}
                    visualDescription={sample.visualDescription}
                    visualKind={sample.visualKind}
                  />
                ) : null}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "space-between", alignItems: "center" }}>
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
                        visualKind: sample.visualKind,
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
