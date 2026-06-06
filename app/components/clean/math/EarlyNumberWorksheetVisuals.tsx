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

export function isStep3NumeralActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "identify-numerals-0-10" ||
    safe(id).startsWith("number-step-3-assess-") ||
    safe(id).startsWith("number-step-3-practice-")
  );
}

export function isStep4CountingObjectsActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "count-objects-accurately-to-10" ||
    safe(id).startsWith("number-step-4-assess-") ||
    safe(id).startsWith("number-step-4-practice-")
  );
}

export function isStep5CountingObjectsActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "count-objects-accurately-to-20" ||
    safe(id).startsWith("number-step-5-assess-") ||
    safe(id).startsWith("number-step-5-practice-")
  );
}

export function isStep6CompareGroupsActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "compare-groups-as-more-fewer-or-same" ||
    safe(id).startsWith("number-step-6-assess-") ||
    safe(id).startsWith("number-step-6-practice-")
  );
}

export function isStep7OrderNumbersActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "order-numbers-in-a-short-sequence" ||
    safe(id).startsWith("number-step-7-assess-") ||
    safe(id).startsWith("number-step-7-practice-")
  );
}

export function isStep8PartWholeActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "partition-and-combine-small-collections-up-to-10" ||
    safe(id).startsWith("number-step-8-assess-") ||
    safe(id).startsWith("number-step-8-practice-")
  );
}

export function isStep9ObjectStoryActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "represent-simple-addition-and-subtraction-stories-with-objects" ||
    safe(id).startsWith("number-step-9-assess-") ||
    safe(id).startsWith("number-step-9-practice-")
  );
}

export function isStep10EqualSharingActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "share-small-collections-equally" ||
    safe(id).startsWith("number-step-10-assess-") ||
    safe(id).startsWith("number-step-10-practice-")
  );
}

export function isStep11CountingSequenceActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "count-forwards-and-backwards-within-100-or-120" ||
    safe(id).startsWith("number-step-11-assess-") ||
    safe(id).startsWith("number-step-11-practice-")
  );
}

export function isStep12ReadWriteOrderActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "read-write-and-order-numbers-to-100-or-120" ||
    safe(id).startsWith("number-step-12-assess-") ||
    safe(id).startsWith("number-step-12-practice-")
  );
}

export function isStep13SkipCountingActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "skip-count-by-2s-5s-and-10s" ||
    safe(id).startsWith("number-step-13-assess-") ||
    safe(id).startsWith("number-step-13-practice-")
  );
}

export function isStep16RenameTwoDigitActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "rename-two-digit-numbers-in-different-ways" ||
    safe(id).startsWith("number-step-16-assess-") ||
    safe(id).startsWith("number-step-16-practice-")
  );
}

export function isStep17AddSubtractWithin20Activity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "add-and-subtract-within-20-using-known-facts" ||
    safe(id).startsWith("number-step-17-assess-") ||
    safe(id).startsWith("number-step-17-practice-")
  );
}

export function isStep18SupportedAddSubtractActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "add-and-subtract-one-and-two-digit-numbers-with-support" ||
    safe(id).startsWith("number-step-18-assess-") ||
    safe(id).startsWith("number-step-18-practice-")
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

function getTargetNumeral(prompt: string, caption: string) {
  const source = `${prompt} ${caption}`.toLowerCase();
  const orderedPatterns = [
    /\b(?:number|numeral|card|group)\s+(?:is|shows|matches)\s+(10|[0-9]|zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/,
    /\b(?:choose|find|select)\s+(?:the\s+)?(?:number\s+)?(10|[0-9]|zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/,
    /\b(?:matches|match)\s+(10|[0-9]|zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/,
  ];

  for (const pattern of orderedPatterns) {
    const match = source.match(pattern)?.[1];
    if (!match) continue;
    return String(COUNT_WORDS[match] ?? match);
  }

  const digit = source.match(/\b10\b|\b[0-9]\b/)?.[0];
  if (digit) return digit;

  for (const [word, count] of Object.entries(COUNT_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(source)) {
      return String(count);
    }
  }

  return "";
}

function getStep7TargetIndex(prompt: string, numbers: string[]) {
  const source = prompt.toLowerCase();
  const referencedNumber = source.match(/\b10\b|\b[0-9]\b/)?.[0];

  if (source.includes("between")) {
    return Math.max(0, Math.floor(numbers.length / 2));
  }

  if (referencedNumber) {
    const index = numbers.indexOf(referencedNumber);
    if (source.includes("after")) return Math.min(numbers.length - 1, index + 1);
    if (source.includes("before")) return Math.max(0, index - 1);
  }

  return Math.max(0, Math.floor(numbers.length / 2));
}

function parsePartPair(option: string) {
  const match = safe(option)
    .toLowerCase()
    .match(/\b(\d{1,2})\s*(?:and|\+)\s*(\d{1,2})\b/);
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  return { first, second };
}

function parseTensOnesRepresentation(value: string) {
  const match = safe(value)
    .toLowerCase()
    .match(/\b(\d{1,2})\s+tens?\s+and\s+(\d{1,2})\s+ones?\b/);
  if (!match) return null;

  const tens = Number(match[1]);
  const ones = Number(match[2]);
  if (!Number.isFinite(tens) || !Number.isFinite(ones)) return null;

  return { tens, ones, total: tens * 10 + ones };
}

function getStoryOperation(prompt: string) {
  const source = prompt.toLowerCase();
  if (
    source.includes("taken away") ||
    source.includes("take away") ||
    source.includes("left") ||
    source.includes("swim away") ||
    source.includes("removed")
  ) {
    return "subtract" as const;
  }

  return "add" as const;
}

function getAddSubtractWithin20Operation(prompt: string) {
  const source = prompt.toLowerCase();
  if (
    source.includes("left") ||
    source.includes("take away") ||
    source.includes("subtract") ||
    source.includes("minus")
  ) {
    return "subtract" as const;
  }

  return "add" as const;
}

function getSharingGroupCount(prompt: string) {
  const source = prompt.toLowerCase();
  const match = source.match(/\bbetween\s+(\d{1,2})\b/)?.[1];
  const count = Number(match);
  return Number.isFinite(count) && count > 0 ? count : 2;
}

function getSequenceDirection(prompt: string) {
  const source = prompt.toLowerCase();
  if (
    source.includes("before") ||
    source.includes("back") ||
    source.includes("backwards") ||
    source.includes("count back")
  ) {
    return "backward" as const;
  }

  return "forward" as const;
}

function getSkipCountStep(prompt: string) {
  const source = prompt.toLowerCase();
  if (/\b10s\b|\bby\s+10\b|\bby\s+tens\b/.test(source)) return 10;
  if (/\b5s\b|\bby\s+5\b|\bby\s+fives\b/.test(source)) return 5;
  return 2;
}

function getSkipCountTone(step: number) {
  if (step === 5) {
    return {
      border: "#bbf7d0",
      background: "#f0fdf4",
      strong: "#15803d",
      soft: "#dcfce7",
    };
  }

  if (step === 10) {
    return {
      border: "#fed7aa",
      background: "#fff7ed",
      strong: "#c2410c",
      soft: "#ffedd5",
    };
  }

  return {
    border: "#bfdbfe",
    background: "#eff6ff",
    strong: "#1d4ed8",
    soft: "#dbeafe",
  };
}

function getSkipCountLabel(step: number) {
  if (step === 10) return "10s";
  if (step === 5) return "5s";
  return "2s";
}

function getStep13SkipCountSequence(
  prompt: string,
  visual: EarlyNumberVisualModel,
  step: number,
) {
  const answer = Number(visual.numberCards[visual.numberCards.length - 1]);
  const promptNumbers = prompt
    .match(/\b\d{1,3}\b/g)
    ?.map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry)) ?? [];
  const sequenceNumbers = promptNumbers.filter((entry) => entry !== step);

  if (prompt.includes("__") && Number.isFinite(answer)) {
    return [...sequenceNumbers, answer].map(String);
  }

  if (Number.isFinite(answer)) {
    return [answer - step * 3, answer - step * 2, answer - step, answer]
      .filter((entry) => entry >= 0)
      .map(String);
  }

  return visual.numberCards;
}

function getNumberWordPrompt(prompt: string) {
  const source = prompt.trim();
  const lower = source.toLowerCase();
  if (lower.includes("tens") || lower.includes("ones")) return "";
  if (lower.includes("smallest") || lower.includes("largest")) return "";

  const match = source.match(/(?:is|matches)\s+(.+?)\??$/i)?.[1];
  return match ? match.trim() : "";
}

function getPlaceValueParts(prompt: string) {
  const match = prompt.match(/(\d+)\s+tens?\s+and\s+(\d+)\s+ones?/i);
  if (!match) return null;
  return {
    tens: Number(match[1]),
    ones: Number(match[2]),
  };
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

type CountingObjectKind =
  | "apple"
  | "star"
  | "cube"
  | "fish"
  | "leaf"
  | "flower"
  | "heart"
  | "sun"
  | "triangle"
  | "circle";

const COUNTING_OBJECT_KINDS: CountingObjectKind[] = [
  "apple",
  "star",
  "cube",
  "fish",
  "leaf",
  "flower",
  "heart",
  "sun",
  "triangle",
  "circle",
];

function getCountingObjectKind(count: number, label = ""): CountingObjectKind {
  const normalized = label.toLowerCase();
  if (normalized.includes("apple")) return "apple";
  if (normalized.includes("star")) return "star";
  if (normalized.includes("cube")) return "cube";
  if (normalized.includes("fish")) return "fish";
  if (normalized.includes("leaf")) return "leaf";
  if (normalized.includes("flower")) return "flower";
  if (normalized.includes("heart")) return "heart";
  if (normalized.includes("sun")) return "sun";
  if (normalized.includes("triangle")) return "triangle";

  return COUNTING_OBJECT_KINDS[count % COUNTING_OBJECT_KINDS.length] || "circle";
}

function getCountingObjectName(kind: CountingObjectKind, count: number) {
  const plural: Record<CountingObjectKind, string> = {
    apple: "apples",
    star: "stars",
    cube: "cubes",
    fish: "fish",
    leaf: "leaves",
    flower: "flowers",
    heart: "hearts",
    sun: "suns",
    triangle: "triangles",
    circle: "objects",
  };
  const singular: Record<CountingObjectKind, string> = {
    apple: "apple",
    star: "star",
    cube: "cube",
    fish: "fish",
    leaf: "leaf",
    flower: "flower",
    heart: "heart",
    sun: "sun",
    triangle: "triangle",
    circle: "object",
  };

  return count === 1 ? singular[kind] : plural[kind];
}

function CountingObjectShape({
  kind,
  index,
  size,
}: {
  kind: CountingObjectKind;
  index: number;
  size: number;
}) {
  const commonStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: "inline-block",
    position: "relative",
    filter: "drop-shadow(0 4px 8px rgba(15,23,42,0.12))",
  };

  if (kind === "star") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...commonStyle,
          background: "#f59e0b",
          clipPath:
            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 56%, 79% 91%, 50% 70%, 21% 91%, 32% 56%, 2% 35%, 39% 35%)",
        }}
      />
    );
  }

  if (kind === "cube") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...commonStyle,
          borderRadius: 7,
          background: index % 2 ? "#60a5fa" : "#93c5fd",
          border: "2px solid #2563eb",
        }}
      />
    );
  }

  if (kind === "fish") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...commonStyle,
          width: Math.round(size * 1.3),
          borderRadius: "55% 45% 45% 55%",
          background: "#38bdf8",
          border: "2px solid #0284c7",
        }}
      >
        <span
          style={{
            position: "absolute",
            right: Math.round(size * -0.32),
            top: Math.round(size * 0.23),
            width: 0,
            height: 0,
            borderTop: `${Math.round(size * 0.27)}px solid transparent`,
            borderBottom: `${Math.round(size * 0.27)}px solid transparent`,
            borderLeft: `${Math.round(size * 0.38)}px solid #0284c7`,
          }}
        />
      </span>
    );
  }

  if (kind === "leaf") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...commonStyle,
          borderRadius: "80% 0 80% 0",
          background: "#22c55e",
          border: "2px solid #15803d",
          transform: `rotate(${index % 2 ? -18 : 18}deg)`,
        }}
      />
    );
  }

  if (kind === "apple") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...commonStyle,
          borderRadius: "55% 55% 48% 48%",
          background: "#ef4444",
          border: "2px solid #b91c1c",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: Math.round(size * -0.27),
            left: Math.round(size * 0.5),
            width: Math.max(4, Math.round(size * 0.19)),
            height: Math.max(7, Math.round(size * 0.38)),
            borderRadius: 999,
            background: "#92400e",
            transform: "rotate(16deg)",
          }}
        />
      </span>
    );
  }

  if (kind === "flower") {
    return (
      <span aria-hidden="true" style={{ ...commonStyle }}>
        {[0, 1, 2, 3, 4].map((petal) => (
          <span
            key={petal}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: Math.round(size * 0.44),
              height: Math.round(size * 0.44),
              borderRadius: 999,
              background: "#f472b6",
              transform: `translate(-50%, -50%) rotate(${petal * 72}deg) translateY(${Math.round(
                size * -0.28,
              )}px)`,
            }}
          />
        ))}
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: Math.round(size * 0.38),
            height: Math.round(size * 0.38),
            borderRadius: 999,
            background: "#facc15",
            transform: "translate(-50%, -50%)",
            border: "1px solid #ca8a04",
          }}
        />
      </span>
    );
  }

  if (kind === "heart") {
    return (
      <span aria-hidden="true" style={{ ...commonStyle, transform: "rotate(-45deg)" }}>
        <span
          style={{
            position: "absolute",
            inset: "28% 12% 10% 12%",
            background: "#fb7185",
            borderRadius: 4,
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "12%",
            top: "10%",
            width: "42%",
            height: "42%",
            borderRadius: 999,
            background: "#fb7185",
          }}
        />
        <span
          style={{
            position: "absolute",
            right: "12%",
            top: "10%",
            width: "42%",
            height: "42%",
            borderRadius: 999,
            background: "#fb7185",
          }}
        />
      </span>
    );
  }

  if (kind === "sun") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...commonStyle,
          borderRadius: 999,
          background: "#facc15",
          border: "2px solid #eab308",
          boxShadow: `0 0 0 ${Math.max(3, Math.round(size * 0.15))}px #fef3c7`,
        }}
      />
    );
  }

  if (kind === "triangle") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...commonStyle,
          background: "#a78bfa",
          clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
          borderRadius: 4,
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...commonStyle,
        borderRadius: 999,
        background: "#2563eb",
        border: "2px solid #1e40af",
      }}
    />
  );
}

export function EarlyNumberWorksheetObjectGroupCard({
  count,
  label,
  selected = false,
}: {
  count: number;
  label: string;
  selected?: boolean;
}) {
  const kind = getCountingObjectKind(count, label);
  const objectName = getCountingObjectName(kind, count);
  const largeGroup = count > 10;
  const objectSize = largeGroup ? 20 : 26;

  return (
    <div
      aria-label={`Group showing ${count} ${objectName}`}
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
        minHeight: largeGroup ? 188 : 150,
      }}
    >
      <div
        style={{
          minHeight: largeGroup ? 142 : 96,
          borderRadius: 16,
          border: "1px solid #dbeafe",
          background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(24px, 1fr))",
          alignItems: "center",
          justifyItems: "center",
          gap: largeGroup ? 6 : 8,
          padding: largeGroup ? 10 : 12,
        }}
      >
        {Array.from({ length: Math.max(0, count) }, (_, index) => (
          <CountingObjectShape
            key={`${kind}-${index}`}
            kind={kind}
            index={index}
            size={objectSize}
          />
        ))}
      </div>
      <div style={{ color: "#475569", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
        {label}
      </div>
    </div>
  );
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

function BaseTenRodsAndCubes({
  tens,
  ones,
  compact = false,
}: {
  tens: number;
  ones: number;
  compact?: boolean;
}) {
  const rodHeight = compact ? 48 : 68;
  const cubeSize = compact ? 12 : 15;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
        gap: compact ? 6 : 10,
        alignItems: "center",
      }}
    >
      <div
        aria-label={`${tens} tens`}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: compact ? 4 : 6,
          alignItems: "center",
          justifyContent: "center",
          minHeight: compact ? 54 : 76,
        }}
      >
        {Array.from({ length: Math.max(0, tens) }, (_, index) => (
          <span
            key={`ten-rod-${index}`}
            aria-hidden="true"
            style={{
              width: compact ? 12 : 16,
              height: rodHeight,
              borderRadius: 7,
              border: "2px solid #1d4ed8",
              background:
                "repeating-linear-gradient(to bottom, #bfdbfe 0 8%, #93c5fd 8% 10%)",
              boxShadow: "0 8px 16px rgba(37,99,235,0.12)",
            }}
          />
        ))}
      </div>
      <div
        aria-label={`${ones} ones`}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(10px, 1fr))",
          gap: compact ? 3 : 5,
          justifyItems: "center",
          alignItems: "center",
          minHeight: compact ? 54 : 76,
        }}
      >
        {Array.from({ length: Math.max(0, ones) }, (_, index) => (
          <span
            key={`one-cube-${index}`}
            aria-hidden="true"
            style={{
              width: cubeSize,
              height: cubeSize,
              borderRadius: 4,
              border: "1px solid #15803d",
              background: "#bbf7d0",
              boxShadow: "0 5px 10px rgba(21,128,61,0.12)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TensOnesRepresentationCard({
  tens,
  ones,
  label,
  selected = false,
  compact = false,
}: {
  tens: number;
  ones: number;
  label: string;
  selected?: boolean;
  compact?: boolean;
}) {
  const total = tens * 10 + ones;

  return (
    <div
      aria-label={`${label}: ${tens} tens and ${ones} ones, showing ${total}`}
      style={{
        border: `2px solid ${selected ? "#1d4ed8" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        minHeight: compact ? 140 : 178,
        padding: compact ? 9 : 12,
        display: "grid",
        gap: 8,
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "#1d4ed8",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 999,
            background: "#f0fdf4",
            color: "#166534",
            padding: "4px 7px",
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          {total}
        </span>
      </div>
      <BaseTenRodsAndCubes tens={tens} ones={ones} compact={compact} />
      <div
        style={{
          color: "#334155",
          fontSize: compact ? 12 : 14,
          fontWeight: 850,
          textAlign: "center",
          lineHeight: 1.35,
        }}
      >
        {tens} {tens === 1 ? "ten" : "tens"} and {ones} {ones === 1 ? "one" : "ones"}
      </div>
    </div>
  );
}

export function EarlyNumberWorksheetNumeralCard({
  numeral,
  label,
  selected = false,
}: {
  numeral: string;
  label?: string;
  selected?: boolean;
}) {
  return (
    <div
      aria-label={`Numeral ${numeral}`}
      style={{
        border: `2px solid ${selected ? "#1d4ed8" : "#bfdbfe"}`,
        borderRadius: 18,
        background: "#ffffff",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
        padding: "12px 10px",
        display: "grid",
        gap: 8,
        minHeight: 126,
        placeItems: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "100%",
          minHeight: 82,
          borderRadius: 16,
          border: "1px solid #dbeafe",
          background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
          color: "#1d4ed8",
          display: "grid",
          placeItems: "center",
          fontSize: numeral.length > 1 ? 46 : 56,
          fontWeight: 950,
          lineHeight: 1,
        }}
      >
        {numeral}
      </div>
      {label ? (
        <div style={{ color: "#475569", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
          {label}
        </div>
      ) : null}
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

export function renderStep3WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const targetNumeral = getTargetNumeral(prompt, visual.caption);
  const singleQuantityTarget =
    !visual.numberCards.length && visual.groupCounts.length === 1
      ? visual.groupCounts[0]
      : null;

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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 18,
            background: "#eff6ff",
            padding: 12,
            display: "grid",
            gap: 8,
            alignContent: "center",
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
            Target numeral
          </div>
          {targetNumeral ? (
            <EarlyNumberWorksheetNumeralCard numeral={targetNumeral} />
          ) : singleQuantityTarget !== null && singleQuantityTarget !== undefined ? (
            <EarlyNumberWorksheetDotCard
              count={singleQuantityTarget}
              label={visual.labels[0] || `${singleQuantityTarget} counters`}
            />
          ) : (
            <div style={{ color: "#0f172a", fontSize: 18, fontWeight: 850 }}>
              {visual.caption}
            </div>
          )}
        </div>
        <div
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 18,
            background: "#f5f3ff",
            padding: 14,
            display: "grid",
            alignContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              color: "#6d28d9",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Look carefully
          </div>
          <div style={{ color: "#334155", fontSize: 14, lineHeight: 1.45, fontWeight: 700 }}>
            Match the same numeral, then choose the card that fits.
          </div>
        </div>
      </div>
    </div>
  );
}

export function renderStep4WorksheetPromptVisual({
  visual,
}: {
  visual: EarlyNumberVisualModel;
}) {
  const count = visual.groupCounts[0];
  if (count === undefined || !Number.isFinite(count)) return null;

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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          alignItems: "stretch",
        }}
      >
        <EarlyNumberWorksheetObjectGroupCard
          count={count}
          label={visual.labels[0] || visual.caption || `${count} objects`}
        />
        <div
          style={{
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            padding: 14,
            display: "grid",
            alignContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              color: "#c2410c",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Count one by one
          </div>
          <div style={{ color: "#334155", fontSize: 14, lineHeight: 1.45, fontWeight: 700 }}>
            Touch each object with your eyes, say one number for each object, then choose the
            matching numeral.
          </div>
        </div>
      </div>
    </div>
  );
}

export function renderStep6WorksheetPromptVisual({
  visual,
}: {
  visual: EarlyNumberVisualModel;
}) {
  const firstCount = visual.groupCounts[0];
  const secondCount = visual.groupCounts[1];
  if (
    firstCount === undefined ||
    secondCount === undefined ||
    !Number.isFinite(firstCount) ||
    !Number.isFinite(secondCount)
  ) {
    return null;
  }

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
          color: "#1e3a8a",
          fontSize: 14,
          fontWeight: 850,
          lineHeight: 1.45,
        }}
      >
        Compare the first group with the second group.
      </div>
      <div
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
          gap: 10,
          alignItems: "stretch",
          padding: 10,
        }}
      >
        <div aria-label={`First group showing ${firstCount} objects`} style={{ display: "grid" }}>
          <div
            style={{
              color: "#1d4ed8",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            First group
          </div>
          <EarlyNumberWorksheetObjectGroupCard
            count={firstCount}
            label={visual.labels[0] || "First group"}
          />
        </div>
        <div
          aria-hidden="true"
          style={{
            width: 2,
            borderRadius: 999,
            background: "linear-gradient(180deg, #bfdbfe 0%, #93c5fd 100%)",
            alignSelf: "stretch",
            margin: "26px 0 4px",
          }}
        />
        <div aria-label={`Second group showing ${secondCount} objects`} style={{ display: "grid" }}>
          <div
            style={{
              color: "#6d28d9",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Second group
          </div>
          <EarlyNumberWorksheetObjectGroupCard
            count={secondCount}
            label={visual.labels[1] || "Second group"}
          />
        </div>
      </div>
      <div
        style={{
          border: "1px solid #bbf7d0",
          borderRadius: 16,
          background: "#f0fdf4",
          color: "#166534",
          padding: "10px 12px",
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.45,
        }}
      >
        Choose the statement that matches the comparison.
      </div>
    </div>
  );
}

export function renderStep7WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const numbers = visual.numberCards;
  if (!numbers.length) return null;

  const targetIndex = getStep7TargetIndex(prompt, numbers);

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
          color: "#1e3a8a",
          fontSize: 14,
          fontWeight: 850,
          lineHeight: 1.45,
        }}
      >
        Use the number cards from left to right.
      </div>
      <div
        aria-label={`Ordered sequence ${numbers.join(", ")}`}
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(1, numbers.length)}, minmax(56px, 1fr))`,
            gap: 8,
            alignItems: "stretch",
          }}
        >
          {numbers.map((number, index) => {
            const isTarget = index === targetIndex;
            return (
              <div
                key={`${number}-${index}`}
                aria-label={
                  isTarget
                    ? `Target slot in sequence, number ${number}`
                    : `Number card ${number}`
                }
                style={{
                  border: `2px solid ${isTarget ? "#7c3aed" : "#bfdbfe"}`,
                  borderRadius: 18,
                  background: isTarget ? "#f5f3ff" : "#eff6ff",
                  color: isTarget ? "#6d28d9" : "#1d4ed8",
                  minHeight: 86,
                  display: "grid",
                  placeItems: "center",
                  fontSize: number.length > 1 ? 36 : 44,
                  fontWeight: 950,
                  lineHeight: 1,
                  boxShadow: isTarget
                    ? "0 10px 22px rgba(124,58,237,0.14)"
                    : "0 8px 18px rgba(15,23,42,0.06)",
                }}
              >
                {isTarget ? "?" : number}
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "#64748b",
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <span>Smallest</span>
          <span aria-hidden="true" style={{ color: "#2563eb", fontSize: 18 }}>
            &rarr;
          </span>
          <span>Largest</span>
        </div>
      </div>
      <div
        style={{
          border: "1px solid #ddd6fe",
          borderRadius: 16,
          background: "#f5f3ff",
          color: "#6d28d9",
          padding: "10px 12px",
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.45,
        }}
      >
        Choose the number that belongs in the question mark slot.
      </div>
    </div>
  );
}

export function renderStep8WorksheetPromptVisual({
  visual,
}: {
  visual: EarlyNumberVisualModel;
}) {
  const whole = visual.groupCounts[0];
  if (whole === undefined || !Number.isFinite(whole)) return null;

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
          color: "#1e3a8a",
          fontSize: 14,
          fontWeight: 850,
          lineHeight: 1.45,
        }}
      >
        Start with the whole collection, then choose two parts that make it.
      </div>
      <div
        aria-label={`Number bond showing whole ${whole} with two missing parts`}
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 14,
          display: "grid",
          gap: 12,
          justifyItems: "center",
        }}
      >
        <EarlyNumberWorksheetDotCard count={whole} label={`Whole ${whole}`} />
        <div
          aria-hidden="true"
          style={{
            width: "72%",
            height: 28,
            borderLeft: "2px solid #93c5fd",
            borderRight: "2px solid #93c5fd",
            borderTop: "2px solid #93c5fd",
            borderRadius: "18px 18px 0 0",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(84px, 1fr))",
            gap: 12,
            width: "min(320px, 100%)",
          }}
        >
          {["Part", "Part"].map((label, index) => (
            <div
              key={`${label}-${index}`}
              aria-label={`${label} ${index + 1} missing`}
              style={{
                border: "2px dashed #c4b5fd",
                borderRadius: 18,
                background: "#f5f3ff",
                color: "#6d28d9",
                minHeight: 76,
                display: "grid",
                placeItems: "center",
                fontSize: 16,
                fontWeight: 900,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          border: "1px solid #bbf7d0",
          borderRadius: 16,
          background: "#f0fdf4",
          color: "#166534",
          padding: "10px 12px",
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.45,
        }}
      >
        The two parts should combine to make the whole.
      </div>
    </div>
  );
}

export function renderStep9WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const start = visual.groupCounts[0];
  const change = visual.groupCounts[1];
  if (
    start === undefined ||
    change === undefined ||
    !Number.isFinite(start) ||
    !Number.isFinite(change)
  ) {
    return null;
  }

  const operation = getStoryOperation(prompt);
  const operationSymbol = operation === "add" ? "+" : "-";
  const operationLabel = operation === "add" ? "Objects join" : "Objects are taken away";

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
          color: "#1e3a8a",
          fontSize: 14,
          fontWeight: 850,
          lineHeight: 1.45,
        }}
      >
        Show the story with objects: start, change, then result.
      </div>
      <div
        aria-label={`Story visual showing ${start} objects ${operation === "add" ? "plus" : "minus"} ${change} objects`}
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(104px, 0.8fr)",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              color: "#1d4ed8",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Start
          </div>
          <EarlyNumberWorksheetObjectGroupCard count={start} label={`${start} objects`} />
        </div>
        <div
          aria-hidden="true"
          style={{
            color: operation === "add" ? "#15803d" : "#c2410c",
            fontSize: 32,
            fontWeight: 950,
            textAlign: "center",
          }}
        >
          {operationSymbol}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              color: operation === "add" ? "#15803d" : "#c2410c",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Change
          </div>
          <EarlyNumberWorksheetObjectGroupCard count={change} label={`${change} objects`} />
        </div>
        <div
          aria-hidden="true"
          style={{ color: "#64748b", fontSize: 32, fontWeight: 950, textAlign: "center" }}
        >
          =
        </div>
        <div
          aria-label="Result is missing"
          style={{
            border: "2px dashed #c4b5fd",
            borderRadius: 18,
            background: "#f5f3ff",
            color: "#6d28d9",
            minHeight: 122,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            padding: 12,
            fontSize: 18,
            fontWeight: 900,
          }}
        >
          Result?
        </div>
      </div>
      <div
        style={{
          border: `1px solid ${operation === "add" ? "#bbf7d0" : "#fed7aa"}`,
          borderRadius: 16,
          background: operation === "add" ? "#f0fdf4" : "#fff7ed",
          color: operation === "add" ? "#166534" : "#c2410c",
          padding: "10px 12px",
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.45,
        }}
      >
        {operationLabel}. Choose the result.
      </div>
    </div>
  );
}

export function renderStep10WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const total = visual.groupCounts[0];
  if (total === undefined || !Number.isFinite(total)) return null;

  const groupCount = getSharingGroupCount(prompt);
  const canShareEqually = total % groupCount === 0;
  const eachGroupCount = canShareEqually ? total / groupCount : null;

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
          color: "#1e3a8a",
          fontSize: 14,
          fontWeight: 850,
          lineHeight: 1.45,
        }}
      >
        Share the whole collection fairly into equal groups.
      </div>
      <div
        aria-label={
          canShareEqually && eachGroupCount !== null
            ? `${total} objects shared equally between ${groupCount} groups, with ${eachGroupCount} in each group`
            : `${total} objects to try sharing equally between ${groupCount} groups`
        }
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div
              style={{
                color: "#1d4ed8",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              Total collection
            </div>
            <EarlyNumberWorksheetObjectGroupCard count={total} label={`${total} objects`} />
          </div>
          <div
            aria-hidden="true"
            style={{
              color: "#15803d",
              fontSize: 26,
              fontWeight: 950,
              textAlign: "center",
            }}
          >
            &rarr;
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <div
              style={{
                color: "#15803d",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              {groupCount} equal groups
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(groupCount, 4)}, minmax(76px, 1fr))`,
                gap: 8,
              }}
            >
              {Array.from({ length: groupCount }, (_, index) => (
                <div
                  key={`sharing-group-${index}`}
                  style={{
                    border: "2px solid #bbf7d0",
                    borderRadius: 18,
                    background: "#f0fdf4",
                    minHeight: 118,
                    padding: 8,
                    display: "grid",
                    gap: 6,
                    alignContent: "center",
                    justifyItems: "center",
                  }}
                >
                  <div
                    style={{
                      color: "#166534",
                      fontSize: 11,
                      fontWeight: 900,
                      textTransform: "uppercase",
                    }}
                  >
                    Group {index + 1}
                  </div>
                  {eachGroupCount !== null ? (
                    <EarlyNumberWorksheetObjectGroupCard
                      count={eachGroupCount}
                      label={`${eachGroupCount} each`}
                    />
                  ) : (
                    <div
                      style={{
                        color: "#166534",
                        fontSize: 30,
                        fontWeight: 950,
                        minHeight: 66,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      ?
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          border: "1px solid #ddd6fe",
          borderRadius: 16,
          background: "#f5f3ff",
          color: "#6d28d9",
          padding: "10px 12px",
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.45,
        }}
      >
        Each group should have the same amount.
      </div>
    </div>
  );
}

export function renderStep11WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const numbers = visual.numberCards;
  if (!numbers.length) return null;

  const direction = getSequenceDirection(prompt);
  const targetIndex = Math.max(0, Math.floor(numbers.length / 2));

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
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 850, lineHeight: 1.45 }}>
          Follow the number sequence and choose the missing number.
        </div>
        <span
          style={{
            border: `1px solid ${direction === "forward" ? "#bbf7d0" : "#fed7aa"}`,
            borderRadius: 999,
            background: direction === "forward" ? "#f0fdf4" : "#fff7ed",
            color: direction === "forward" ? "#166534" : "#c2410c",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Count {direction === "forward" ? "forwards" : "backwards"}
        </span>
      </div>
      <div
        aria-label={`${direction === "forward" ? "Forward" : "Backward"} counting sequence ${numbers.join(", ")}`}
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(1, numbers.length)}, minmax(70px, 1fr))`,
            gap: 8,
          }}
        >
          {numbers.map((number, index) => {
            const missing = index === targetIndex;
            return (
              <div
                key={`${number}-${index}`}
                aria-label={missing ? "Missing number box" : `Number ${number}`}
                style={{
                  border: `2px solid ${missing ? "#7c3aed" : "#bfdbfe"}`,
                  borderRadius: 16,
                  background: missing ? "#f5f3ff" : "#eff6ff",
                  color: missing ? "#6d28d9" : "#1d4ed8",
                  minHeight: 76,
                  display: "grid",
                  placeItems: "center",
                  fontSize: missing ? 22 : number.length > 2 ? 30 : 36,
                  fontWeight: 950,
                  lineHeight: 1,
                  boxShadow: missing
                    ? "0 10px 22px rgba(124,58,237,0.14)"
                    : "0 8px 18px rgba(15,23,42,0.06)",
                }}
              >
                {missing ? "__" : number}
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: direction === "forward" ? "flex-start" : "flex-end",
            color: "#64748b",
            fontSize: 12,
            fontWeight: 850,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <span aria-hidden="true">
            {direction === "forward" ? "left to right ->" : "<- right to left"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function renderStep12WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const numbers = visual.numberCards;
  if (!numbers.length) return null;

  const numberWordPrompt = getNumberWordPrompt(prompt);
  const placeValueParts = getPlaceValueParts(prompt);
  const asksOrdering = /smallest|largest/i.test(prompt);

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
          color: "#1e3a8a",
          fontSize: 14,
          fontWeight: 850,
          lineHeight: 1.45,
        }}
      >
        Match the number representation to the correct numeral.
      </div>
      <div
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 14,
          display: "grid",
          gap: 12,
        }}
      >
        {placeValueParts ? (
          <div
            aria-label={`${placeValueParts.tens} tens and ${placeValueParts.ones} ones`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 10,
              alignItems: "center",
            }}
          >
            <EarlyNumberWorksheetNumeralCard
              numeral={String(placeValueParts.tens)}
              label="tens"
            />
            <div style={{ color: "#64748b", fontSize: 24, fontWeight: 950 }}>+</div>
            <EarlyNumberWorksheetNumeralCard
              numeral={String(placeValueParts.ones)}
              label="ones"
            />
          </div>
        ) : numberWordPrompt ? (
          <div
            aria-label={`Number word ${numberWordPrompt}`}
            style={{
              border: "2px solid #bfdbfe",
              borderRadius: 18,
              background: "#eff6ff",
              color: "#1d4ed8",
              minHeight: 118,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              padding: 16,
              fontSize: 28,
              fontWeight: 950,
              lineHeight: 1.1,
            }}
          >
            {numberWordPrompt}
          </div>
        ) : asksOrdering ? (
          <div
            aria-label={`Number cards ${numbers.join(", ")}`}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.max(1, numbers.length)}, minmax(70px, 1fr))`,
              gap: 8,
            }}
          >
            {numbers.map((number) => (
              <EarlyNumberWorksheetNumeralCard key={number} numeral={number} />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.max(1, numbers.length)}, minmax(70px, 1fr))`,
              gap: 8,
            }}
          >
            {numbers.map((number) => (
              <EarlyNumberWorksheetNumeralCard key={number} numeral={number} />
            ))}
          </div>
        )}
      </div>
      <div
        style={{
          border: "1px solid #ddd6fe",
          borderRadius: 16,
          background: "#f5f3ff",
          color: "#6d28d9",
          padding: "10px 12px",
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.45,
        }}
      >
        {asksOrdering
          ? "Choose the number that fits the ordering question."
          : "Choose the numeral that matches."}
      </div>
    </div>
  );
}

export function renderStep13WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const step = getSkipCountStep(prompt);
  const numbers = getStep13SkipCountSequence(prompt, visual, step);
  if (!numbers.length) return null;

  const tone = getSkipCountTone(step);
  const targetIndex = Math.max(0, numbers.length - 1);
  const sequenceLabel = numbers
    .map((number, index) => (index === targetIndex ? "missing number" : number))
    .join(", ");

  return (
    <div
      style={{
        border: `1px solid ${tone.border}`,
        borderRadius: 22,
        background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
        padding: 16,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 850, lineHeight: 1.45 }}>
          Follow the skip-counting pattern and choose the missing number.
        </div>
        <span
          style={{
            border: `1px solid ${tone.border}`,
            borderRadius: 999,
            background: tone.background,
            color: tone.strong,
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Count by {getSkipCountLabel(step)}
        </span>
      </div>
      <div
        aria-label={`Skip counting by ${getSkipCountLabel(step)} sequence ${sequenceLabel}`}
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(1, numbers.length)}, minmax(70px, 1fr))`,
            gap: 8,
          }}
        >
          {numbers.map((number, index) => {
            const missing = index === targetIndex;
            return (
              <div
                key={`${number}-${index}`}
                aria-label={missing ? "Missing number box" : `Number ${number}`}
                style={{
                  border: `2px solid ${missing ? "#7c3aed" : tone.border}`,
                  borderRadius: 16,
                  background: missing ? "#f5f3ff" : tone.background,
                  color: missing ? "#6d28d9" : tone.strong,
                  minHeight: 76,
                  display: "grid",
                  placeItems: "center",
                  fontSize: missing ? 22 : number.length > 2 ? 30 : 36,
                  fontWeight: 950,
                  lineHeight: 1,
                  boxShadow: missing
                    ? "0 10px 22px rgba(124,58,237,0.14)"
                    : "0 8px 18px rgba(15,23,42,0.06)",
                }}
              >
                {missing ? "__" : number}
              </div>
            );
          })}
        </div>
        <div
          style={{
            border: `1px solid ${tone.border}`,
            borderRadius: 14,
            background: tone.soft,
            color: tone.strong,
            padding: "9px 10px",
            fontSize: 12,
            fontWeight: 850,
            lineHeight: 1.4,
          }}
        >
          Each jump adds {step}. Keep the same pattern.
        </div>
      </div>
    </div>
  );
}

export function renderStep16WorksheetPromptVisual({
  visual,
}: {
  visual: EarlyNumberVisualModel;
}) {
  const tens = visual.groupCounts[0];
  const ones = visual.groupCounts[1];
  if (
    tens === undefined ||
    ones === undefined ||
    !Number.isFinite(tens) ||
    !Number.isFinite(ones)
  ) {
    return null;
  }

  const total = tens * 10 + ones;
  const renamedTens = Math.max(0, tens - 1);
  const renamedOnes = ones + (tens > 0 ? 10 : 0);

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
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 850, lineHeight: 1.45 }}>
          Trade one ten for ten ones. The total stays the same.
        </div>
        <div
          aria-label={`Number ${total}`}
          style={{
            border: "2px solid #bfdbfe",
            borderRadius: 18,
            background: "#eff6ff",
            color: "#1d4ed8",
            minWidth: 82,
            minHeight: 62,
            display: "grid",
            placeItems: "center",
            fontSize: 36,
            fontWeight: 950,
          }}
        >
          {total}
        </div>
      </div>
      <div
        aria-label={`Number ${total} shown as ${tens} tens and ${ones} ones, and also as ${renamedTens} tens and ${renamedOnes} ones`}
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          <TensOnesRepresentationCard tens={tens} ones={ones} label="Way 1" />
          <div
            aria-hidden="true"
            style={{
              borderLeft: "2px dotted #93c5fd",
              minHeight: "100%",
            }}
          />
          <TensOnesRepresentationCard
            tens={renamedTens}
            ones={renamedOnes}
            label="Way 2"
          />
        </div>
        <div
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 16,
            background: "#f0fdf4",
            color: "#166534",
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {tens} tens and {ones} ones is the same number as {renamedTens} tens and{" "}
          {renamedOnes} ones.
        </div>
      </div>
    </div>
  );
}

export function renderStep17WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const start = visual.groupCounts[0];
  const change = visual.groupCounts[1];
  if (
    start === undefined ||
    change === undefined ||
    !Number.isFinite(start) ||
    !Number.isFinite(change)
  ) {
    return null;
  }

  const operation = getAddSubtractWithin20Operation(prompt);
  const symbol = operation === "add" ? "+" : "-";
  const tone =
    operation === "add"
      ? { border: "#bbf7d0", background: "#f0fdf4", strong: "#166534" }
      : { border: "#fed7aa", background: "#fff7ed", strong: "#c2410c" };

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
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 850, lineHeight: 1.45 }}>
          Use a known fact to solve the equation.
        </div>
        <span
          style={{
            border: `1px solid ${tone.border}`,
            borderRadius: 999,
            background: tone.background,
            color: tone.strong,
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {operation === "add" ? "Addition fact" : "Subtraction fact"}
        </span>
      </div>
      <div
        aria-label={`Equation ${start} ${operation === "add" ? "plus" : "minus"} ${change} equals blank`}
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(84px, 0.65fr)",
            gap: 10,
            alignItems: "center",
          }}
        >
          <EarlyNumberWorksheetObjectGroupCard count={start} label={`${start}`} />
          <div
            style={{
              color: tone.strong,
              fontSize: 34,
              fontWeight: 950,
              textAlign: "center",
            }}
          >
            {symbol}
          </div>
          <EarlyNumberWorksheetObjectGroupCard count={change} label={`${change}`} />
          <div style={{ color: "#64748b", fontSize: 34, fontWeight: 950 }}>=</div>
          <div
            aria-label="Answer box"
            style={{
              border: "2px solid #7c3aed",
              borderRadius: 18,
              background: "#f5f3ff",
              color: "#6d28d9",
              minHeight: 118,
              display: "grid",
              placeItems: "center",
              fontSize: 28,
              fontWeight: 950,
              boxShadow: "0 10px 22px rgba(124,58,237,0.14)",
            }}
          >
            __
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${tone.border}`,
            borderRadius: 16,
            background: tone.background,
            color: tone.strong,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          Think: {start} {symbol} {change} = ?
        </div>
      </div>
    </div>
  );
}

function CrossOutOnesVisual({
  ones,
  crossedOut,
}: {
  ones: number;
  crossedOut: number;
}) {
  return (
    <div
      aria-label={`${ones} ones with ${crossedOut} crossed out`}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(18px, 1fr))",
        gap: 6,
        justifyItems: "center",
        alignItems: "center",
      }}
    >
      {Array.from({ length: Math.max(0, ones) }, (_, index) => {
        const crossed = index < crossedOut;
        return (
          <span
            key={`cross-one-${index}`}
            aria-hidden="true"
            style={{
              position: "relative",
              width: 18,
              height: 18,
              borderRadius: 5,
              border: `1px solid ${crossed ? "#dc2626" : "#15803d"}`,
              background: crossed ? "#fee2e2" : "#bbf7d0",
              boxShadow: "0 5px 10px rgba(15,23,42,0.10)",
            }}
          >
            {crossed ? (
              <>
                <span
                  style={{
                    position: "absolute",
                    left: 2,
                    right: 2,
                    top: "50%",
                    height: 2,
                    borderRadius: 999,
                    background: "#dc2626",
                    transform: "rotate(45deg)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 2,
                    right: 2,
                    top: "50%",
                    height: 2,
                    borderRadius: 999,
                    background: "#dc2626",
                    transform: "rotate(-45deg)",
                  }}
                />
              </>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function WorksheetNumberLineJump({
  start,
  change,
  operation,
}: {
  start: number;
  change: number;
  operation: "add" | "subtract";
}) {
  const end = operation === "add" ? start + change : start - change;
  const min = 0;
  const max = Math.max(20, start, end);
  const startPercent = (Math.max(min, Math.min(max, start)) / max) * 100;
  const endPercent = (Math.max(min, Math.min(max, end)) / max) * 100;
  const left = Math.min(startPercent, endPercent);
  const width = Math.max(8, Math.abs(endPercent - startPercent));

  return (
    <div
      aria-label={`Number line from zero to ${max} showing a jump from ${start} to ${end}`}
      style={{
        border: "1px solid #fed7aa",
        borderRadius: 16,
        background: "#fff7ed",
        padding: "28px 12px 12px",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ position: "relative", height: 46 }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 16,
            height: 3,
            borderRadius: 999,
            background: "#fb923c",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${left}%`,
            bottom: 18,
            width: `${width}%`,
            height: 24,
            borderTop: "3px solid #f97316",
            borderLeft: operation === "subtract" ? "3px solid #f97316" : "none",
            borderRight: operation === "add" ? "3px solid #f97316" : "none",
            borderRadius: "999px 999px 0 0",
          }}
        />
        {[0, start, end, max]
          .filter((value, index, values) => values.indexOf(value) === index)
          .map((value) => (
            <div
              key={`line-${value}`}
              style={{
                position: "absolute",
                left: `${(value / max) * 100}%`,
                bottom: 0,
                transform: "translateX(-50%)",
                display: "grid",
                justifyItems: "center",
                gap: 3,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 2,
                  height: 14,
                  borderRadius: 999,
                  background: "#c2410c",
                }}
              />
              <strong style={{ color: "#9a3412", fontSize: 11 }}>{value}</strong>
            </div>
          ))}
      </div>
      <div style={{ color: "#c2410c", fontSize: 12, fontWeight: 850, lineHeight: 1.4 }}>
        Start at {start}. Jump {operation === "add" ? "forward" : "back"} {change} to {end}.
      </div>
    </div>
  );
}

export function renderStep18WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const tens = visual.groupCounts[0];
  const ones = visual.groupCounts[1];
  const change = visual.groupCounts[2];
  if (
    tens === undefined ||
    ones === undefined ||
    change === undefined ||
    !Number.isFinite(tens) ||
    !Number.isFinite(ones) ||
    !Number.isFinite(change)
  ) {
    return null;
  }

  const start = tens * 10 + ones;
  const operation = getAddSubtractWithin20Operation(prompt);
  const symbol = operation === "add" ? "+" : "-";
  const answer = operation === "add" ? start + change : start - change;
  const tone =
    operation === "add"
      ? { border: "#bbf7d0", background: "#f0fdf4", strong: "#166534" }
      : { border: "#fed7aa", background: "#fff7ed", strong: "#c2410c" };

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
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 850, lineHeight: 1.45 }}>
          Use tens, ones, and the number line to solve.
        </div>
        <span
          style={{
            border: `1px solid ${tone.border}`,
            borderRadius: 999,
            background: tone.background,
            color: tone.strong,
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {operation === "add" ? "Supported addition" : "Supported subtraction"}
        </span>
      </div>

      <div
        aria-label={
          operation === "add"
            ? `${start} plus ${change} shown with ${tens} ten rods, ${ones} ones and ${change} more ones`
            : `${start} minus ${change} shown with ${tens} ten rods and ${ones} ones, with ${change} ones crossed out`
        }
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.2fr) auto minmax(0, 0.8fr) auto minmax(84px, 0.55fr)",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 16,
              background: "#f8fbff",
              padding: 10,
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900 }}>
              {start} = {tens} tens and {ones} ones
            </div>
            {operation === "subtract" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <BaseTenRodsAndCubes tens={tens} ones={0} compact />
                <CrossOutOnesVisual ones={ones} crossedOut={change} />
              </div>
            ) : (
              <BaseTenRodsAndCubes tens={tens} ones={ones} compact />
            )}
          </div>
          <div style={{ color: tone.strong, fontSize: 34, fontWeight: 950 }}>{symbol}</div>
          <div
            style={{
              border: `1px solid ${tone.border}`,
              borderRadius: 16,
              background: tone.background,
              padding: 10,
              display: "grid",
              placeItems: "center",
              gap: 6,
              minHeight: 104,
            }}
          >
            <strong style={{ color: tone.strong, fontSize: 30 }}>{change}</strong>
            <span style={{ color: tone.strong, fontSize: 12, fontWeight: 850 }}>
              {operation === "add" ? "more ones" : "ones crossed out"}
            </span>
          </div>
          <div style={{ color: "#64748b", fontSize: 34, fontWeight: 950 }}>=</div>
          <div
            aria-label="Answer box"
            style={{
              border: "2px solid #7c3aed",
              borderRadius: 18,
              background: "#f5f3ff",
              color: "#6d28d9",
              minHeight: 104,
              display: "grid",
              placeItems: "center",
              fontSize: 28,
              fontWeight: 950,
              boxShadow: "0 10px 22px rgba(124,58,237,0.14)",
            }}
          >
            __
          </div>
        </div>

        <WorksheetNumberLineJump start={start} change={change} operation={operation} />
        <div
          style={{
            border: `1px solid ${tone.border}`,
            borderRadius: 16,
            background: tone.background,
            color: tone.strong,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          Think: {start} {symbol} {change} = {answer}
        </div>
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

export function renderStep4WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^(10|[0-9])$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} selected={selected} />;
}

export function renderStep6WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!normalized) return null;

  const lower = normalized.toLowerCase();
  const isSame = lower.includes("same");
  const isMore = lower.includes("more");
  const isFewer = lower.includes("fewer");
  if (!isSame && !isMore && !isFewer) return null;

  const display = normalized
    .replace("Card A", "First group")
    .replace("Card B", "Second group")
    .replace("They are", "Groups are");
  const tone = isSame
    ? { border: "#ddd6fe", background: "#f5f3ff", color: "#6d28d9" }
    : isMore
      ? { border: "#bbf7d0", background: "#f0fdf4", color: "#15803d" }
      : { border: "#fed7aa", background: "#fff7ed", color: "#c2410c" };

  return (
    <div
      aria-label={display}
      style={{
        border: `2px solid ${selected ? "#1d4ed8" : tone.border}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : tone.background,
        color: tone.color,
        minHeight: 116,
        padding: 12,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        fontSize: 18,
        fontWeight: 900,
        lineHeight: 1.18,
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      {display}
    </div>
  );
}

export function renderStep7WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^(10|11|12|13|14|15|16|17|18|19|20|[0-9])$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} selected={selected} />;
}

export function renderStep8WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const pair = parsePartPair(option);
  if (!pair) return null;

  return (
    <div
      aria-label={`Number bond parts ${pair.first} and ${pair.second}`}
      style={{
        border: `2px solid ${selected ? "#1d4ed8" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        minHeight: 150,
        padding: 10,
        display: "grid",
        gap: 8,
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            border: "1px solid #dbeafe",
            borderRadius: 16,
            background: "#eff6ff",
            color: "#1d4ed8",
            minHeight: 70,
            display: "grid",
            placeItems: "center",
            fontSize: 34,
            fontWeight: 950,
          }}
        >
          {pair.first}
        </div>
        <div style={{ color: "#64748b", fontSize: 20, fontWeight: 900 }}>+</div>
        <div
          style={{
            border: "1px solid #dbeafe",
            borderRadius: 16,
            background: "#f5f3ff",
            color: "#6d28d9",
            minHeight: 70,
            display: "grid",
            placeItems: "center",
            fontSize: 34,
            fontWeight: 950,
          }}
        >
          {pair.second}
        </div>
      </div>
      <div style={{ color: "#475569", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
        {pair.first} and {pair.second}
      </div>
    </div>
  );
}

export function renderStep9WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^(10|[0-9])$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} label="Result" selected={selected} />;
}

export function renderStep10WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  const eachMatch = normalized.match(/^(\d{1,2})\s+each$/i)?.[1];
  if (eachMatch) {
    return (
      <EarlyNumberWorksheetNumeralCard numeral={eachMatch} label="Each group" selected={selected} />
    );
  }

  if (/^(Fair|Not fair)$/i.test(normalized)) {
    const isFair = normalized.toLowerCase() === "fair";
    return (
      <div
        aria-label={isFair ? "This can be shared fairly" : "This cannot be shared fairly"}
        style={{
          border: `2px solid ${selected ? "#1d4ed8" : isFair ? "#bbf7d0" : "#fed7aa"}`,
          borderRadius: 18,
          background: selected ? "#eff6ff" : isFair ? "#f0fdf4" : "#fff7ed",
          color: isFair ? "#166534" : "#c2410c",
          minHeight: 126,
          padding: 12,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          fontSize: 22,
          fontWeight: 950,
          boxShadow: selected
            ? "0 10px 22px rgba(37,99,235,0.18)"
            : "0 8px 18px rgba(15,23,42,0.06)",
        }}
      >
        {normalized}
      </div>
    );
  }

  return null;
}

export function renderStep11WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,3}$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} label="Missing number" selected={selected} />;
}

export function renderStep12WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,3}$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} label="Choose numeral" selected={selected} />;
}

export function renderStep13WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,3}$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} label="Missing number" selected={selected} />;
}

export function renderStep16WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const representation = parseTensOnesRepresentation(option);
  if (!representation) return null;

  return (
    <TensOnesRepresentationCard
      tens={representation.tens}
      ones={representation.ones}
      label="Rename"
      selected={selected}
      compact
    />
  );
}

export function renderStep17WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,2}$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} label="Answer" selected={selected} />;
}

export function renderStep18WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,2}$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} label="Answer" selected={selected} />;
}

export function renderStep3WorksheetOptionCard({
  option,
  visual,
  selected = false,
}: {
  option: string;
  visual: EarlyNumberVisualModel | null;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (/^(10|[0-9])$/.test(normalized)) {
    return <EarlyNumberWorksheetNumeralCard numeral={normalized} selected={selected} />;
  }

  const count = getCountFromLabel(option, visual);
  if (count === null || !Number.isFinite(count)) return null;

  return <EarlyNumberWorksheetDotCard count={count} label={option} selected={selected} />;
}
