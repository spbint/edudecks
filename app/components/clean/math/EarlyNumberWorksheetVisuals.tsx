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
