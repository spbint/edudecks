import React from "react";

type DotPosition = {
  x: number;
  y: number;
};

export type EarlyNumberVisualModel = {
  caption: string;
  labels: string[];
  groupCounts: number[];
  numberCards: string[];
};

const NUMBER_WORDS: Record<string, string> = {
  zero: "ZERO",
  one: "ONE",
  two: "TWO",
  three: "THREE",
  four: "FOUR",
  five: "FIVE",
  six: "SIX",
  seven: "SEVEN",
  eight: "EIGHT",
  nine: "NINE",
  ten: "TEN",
};

const COUNT_WORDS: Record<string, number> = {
  no: 0,
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
};

const dotLayouts: Record<number, DotPosition[]> = {
  0: [],
  1: [{ x: 50, y: 50 }],
  2: [
    { x: 34, y: 50 },
    { x: 66, y: 50 },
  ],
  3: [
    { x: 50, y: 30 },
    { x: 34, y: 68 },
    { x: 66, y: 68 },
  ],
  4: [
    { x: 34, y: 32 },
    { x: 66, y: 32 },
    { x: 34, y: 68 },
    { x: 66, y: 68 },
  ],
  5: [
    { x: 34, y: 32 },
    { x: 66, y: 32 },
    { x: 50, y: 50 },
    { x: 34, y: 68 },
    { x: 66, y: 68 },
  ],
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function isStep2NumberWordActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "match-spoken-number-names-to-quantities" ||
    safe(id).startsWith("number-step-2-assess-") ||
    safe(id).startsWith("number-step-2-practice-")
  );
}

export function parseEarlyNumberVisualDescription(
  description: string | undefined,
): EarlyNumberVisualModel | null {
  const raw = String(description || "");
  if (!raw.startsWith("early-number|")) return null;

  const parts = Object.fromEntries(
    raw
      .split("|")
      .slice(1)
      .map((part) => {
        const [key, ...rest] = part.split("=");
        return [key, rest.join("=")];
      }),
  );

  return {
    caption: String(parts.caption || "Use the visual card."),
    labels: String(parts.labels || "")
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean),
    groupCounts: String(parts.groups || "")
      .split(",")
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry) && entry >= 0),
    numberCards: String(parts.numbers || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  };
}

function getNumberWord(prompt: string, caption: string) {
  const source = `${prompt} ${caption}`.toLowerCase();
  for (const [word, label] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(source)) {
      return label;
    }
  }
  return "";
}

function getCountFromLabel(label: string, visual: EarlyNumberVisualModel | null) {
  const normalized = safe(label).toLowerCase();
  const matchingLabelIndex = visual?.labels.findIndex(
    (candidate) => candidate.toLowerCase() === normalized,
  );
  if (
    matchingLabelIndex !== undefined &&
    matchingLabelIndex >= 0 &&
    visual?.groupCounts[matchingLabelIndex] !== undefined
  ) {
    return visual.groupCounts[matchingLabelIndex] ?? null;
  }

  const digit = normalized.match(/\b\d+\b/)?.[0];
  if (digit) return Number(digit);

  for (const [word, count] of Object.entries(COUNT_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(normalized)) {
      return count;
    }
  }

  return null;
}

function getDots(count: number) {
  if (count <= 5) return dotLayouts[count] ?? [];

  const columns: number = count > 8 ? 5 : 4;
  const rows = Math.ceil(count / columns);
  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: columns === 1 ? 50 : 18 + (64 / Math.max(1, columns - 1)) * column,
      y: rows === 1 ? 50 : 24 + (52 / Math.max(1, rows - 1)) * row,
    };
  });
}

export function EarlyNumberWorksheetDotCard({
  count,
  label,
  selected = false,
}: {
  count: number;
  label: string;
  selected?: boolean;
}) {
  const dots = getDots(count);
  const dotSize = count > 8 ? 12 : count > 5 ? 14 : 18;

  return (
    <div
      aria-label={`Group showing ${count} dot${count === 1 ? "" : "s"}`}
      style={{
        border: `2px solid ${selected ? "#1d4ed8" : "#bfdbfe"}`,
        borderRadius: 18,
        background: "#ffffff",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
        padding: 10,
        display: "grid",
        gap: 8,
        minHeight: 132,
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 82,
          borderRadius: 16,
          border: "1px solid #dbeafe",
          background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
          overflow: "hidden",
        }}
      >
        {dots.map((dot, index) => (
          <span
            key={`${dot.x}-${dot.y}-${index}`}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: dotSize,
              height: dotSize,
              borderRadius: 999,
              background: "#2563eb",
              border: "2px solid #1e40af",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 5px 12px rgba(37,99,235,0.22)",
            }}
          />
        ))}
        {!dots.length ? (
          <span
            style={{
              display: "grid",
              height: "100%",
              minHeight: 82,
              placeItems: "center",
              color: "#64748b",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            No dots
          </span>
        ) : null}
      </div>
      <div style={{ color: "#475569", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
        {label}
      </div>
    </div>
  );
}

export function renderStep2WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const numberWord = getNumberWord(prompt, visual.caption);

  return (
    <div
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 22,
        background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
        padding: 16,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          border: "1px solid #bfdbfe",
          borderRadius: 18,
          background: "#eff6ff",
          padding: "14px 16px",
          display: "grid",
          gap: 4,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "#1d4ed8",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          An adult says
        </div>
        <div style={{ color: "#0f172a", fontSize: 34, fontWeight: 950, lineHeight: 1 }}>
          {numberWord || visual.caption}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <span
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 999,
            background: "#f0fdf4",
            color: "#15803d",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          Listen
        </span>
        <span
          style={{
            border: "1px solid #fed7aa",
            borderRadius: 999,
            background: "#fff7ed",
            color: "#c2410c",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          Think
        </span>
        <span
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 999,
            background: "#f5f3ff",
            color: "#6d28d9",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          Match the group
        </span>
      </div>
    </div>
  );
}

export function renderStep2WorksheetOptionCard({
  option,
  visual,
  selected = false,
}: {
  option: string;
  visual: EarlyNumberVisualModel | null;
  selected?: boolean;
}) {
  const count = getCountFromLabel(option, visual);
  if (count === null || !Number.isFinite(count)) return null;

  return <EarlyNumberWorksheetDotCard count={count} label={option} selected={selected} />;
}
