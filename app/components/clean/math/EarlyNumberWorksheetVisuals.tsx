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

export function isStep19EqualGroupsArraysActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "understand-simple-equal-groups-and-arrays" ||
    safe(id).startsWith("number-step-19-assess-") ||
    safe(id).startsWith("number-step-19-practice-")
  );
}

export function isStep20HalvesQuartersSharingActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "begin-halves-quarters-and-simple-sharing" ||
    safe(id).startsWith("number-step-20-assess-") ||
    safe(id).startsWith("number-step-20-practice-")
  );
}

export function isStep21LargeNumberCompareActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "read-write-order-and-compare-numbers-to-1000-and-beyond" ||
    safe(id).startsWith("number-step-21-assess-") ||
    safe(id).startsWith("number-step-21-practice-")
  );
}

export function isStep22HundredsTensOnesActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "understand-hundreds-tens-and-ones" ||
    safe(id).startsWith("number-step-22-assess-") ||
    safe(id).startsWith("number-step-22-practice-")
  );
}

export function isStep23PartitionRegroupActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "partition-and-regroup-two-and-three-digit-numbers" ||
    safe(id).startsWith("number-step-23-assess-") ||
    safe(id).startsWith("number-step-23-practice-")
  );
}

export function isStep24ZeroPlaceholderActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "use-zero-as-a-placeholder" ||
    safe(id).startsWith("number-step-24-assess-") ||
    safe(id).startsWith("number-step-24-practice-")
  );
}

export function isStep25PlaceValueAddSubtractActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "add-and-subtract-two-and-three-digit-numbers-using-place-value" ||
    safe(id).startsWith("number-step-25-assess-") ||
    safe(id).startsWith("number-step-25-practice-")
  );
}

export function isStep26MultiplicationFactsActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "recall-and-apply-multiplication-facts" ||
    safe(id).startsWith("number-step-26-assess-") ||
    safe(id).startsWith("number-step-26-practice-")
  );
}

export function isStep27ArraysGroupingKnownFactsActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "multiply-and-divide-using-arrays-grouping-and-known-facts" ||
    safe(id).startsWith("number-step-27-assess-") ||
    safe(id).startsWith("number-step-27-practice-")
  );
}

export function isStep28EstimateReasonablenessActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "estimate-and-check-reasonableness" ||
    safe(id).startsWith("number-step-28-assess-") ||
    safe(id).startsWith("number-step-28-practice-")
  );
}

export function isStep29UnitSimpleFractionsActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "recognise-and-represent-unit-fractions-and-simple-fractions" ||
    safe(id).startsWith("number-step-29-assess-") ||
    safe(id).startsWith("number-step-29-practice-")
  );
}

export function isStep30PracticalMoneyActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "solve-practical-number-problems-including-money" ||
    safe(id).startsWith("number-step-30-assess-") ||
    safe(id).startsWith("number-step-30-practice-")
  );
}

export function isStep31ExtendedPlaceValueActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "extend-place-value-to-larger-numbers" ||
    safe(id).startsWith("number-step-31-assess-") ||
    safe(id).startsWith("number-step-31-practice-")
  );
}

export function isStep32RoundEstimateLargerNumbersActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "round-and-estimate-with-larger-numbers" ||
    safe(id).startsWith("number-step-32-assess-") ||
    safe(id).startsWith("number-step-32-practice-")
  );
}

export function isStep33DecimalPlaceValueActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "extend-place-value-to-decimals" ||
    safe(id).startsWith("number-step-33-assess-") ||
    safe(id).startsWith("number-step-33-practice-")
  );
}

export function isStep34CompareOrderDecimalsActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "compare-and-order-decimals" ||
    safe(id).startsWith("number-step-34-assess-") ||
    safe(id).startsWith("number-step-34-practice-")
  );
}

export function isStep35EquivalentFractionsActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "compare-order-and-generate-equivalent-fractions" ||
    safe(id).startsWith("number-step-35-assess-") ||
    safe(id).startsWith("number-step-35-practice-")
  );
}

export function isStep36FractionAddSubtractActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "add-and-subtract-fractions-with-related-denominators" ||
    safe(id).startsWith("number-step-36-assess-") ||
    safe(id).startsWith("number-step-36-practice-")
  );
}

export function isStep37EfficientStrategiesActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "multiply-and-divide-larger-whole-numbers-using-efficient-strategies" ||
    safe(id).startsWith("number-step-37-assess-") ||
    safe(id).startsWith("number-step-37-practice-")
  );
}

export function isStep38RemaindersContextActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "interpret-remainders-in-context" ||
    safe(id).startsWith("number-step-38-assess-") ||
    safe(id).startsWith("number-step-38-practice-")
  );
}

export function isStep39FractionDecimalPercentActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "connect-fractions-decimals-and-percentages" ||
    safe(id).startsWith("number-step-39-assess-") ||
    safe(id).startsWith("number-step-39-practice-")
  );
}

export function isStep40FinancialModellingActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "use-mathematical-modelling-in-financial-and-real-world-contexts" ||
    safe(id).startsWith("number-step-40-assess-") ||
    safe(id).startsWith("number-step-40-practice-")
  );
}

export function isStep41FlexibleNumberFormsActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "work-fluently-with-integers-decimals-fractions-and-percentages" ||
    safe(id).startsWith("number-step-41-assess-") ||
    safe(id).startsWith("number-step-41-practice-")
  );
}

export function isStep42NegativeNumberLineActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "understand-negative-numbers-and-number-lines" ||
    safe(id).startsWith("number-step-42-assess-") ||
    safe(id).startsWith("number-step-42-practice-")
  );
}

export function isStep44PowersRootsActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "use-index-notation-powers-and-roots" ||
    safe(id).startsWith("number-step-44-assess-") ||
    safe(id).startsWith("number-step-44-practice-")
  );
}

export function isStep45RatioRatesActivity(id: string, stepKey?: string | null) {
  return (
    safe(stepKey) === "work-with-ratio-and-rates" ||
    safe(id).startsWith("number-step-45-assess-") ||
    safe(id).startsWith("number-step-45-practice-")
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

function EqualGroupsVisual({
  groups,
  inEachGroup,
}: {
  groups: number;
  inEachGroup: number;
}) {
  const kind = getCountingObjectKind(inEachGroup + groups, "cubes");

  return (
    <div
      aria-label={`${groups} equal groups with ${inEachGroup} objects in each group`}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))",
        gap: 8,
      }}
    >
      {Array.from({ length: Math.max(0, groups) }, (_, groupIndex) => (
        <div
          key={`equal-group-${groupIndex}`}
          style={{
            border: "2px solid #bfdbfe",
            borderRadius: "50%",
            background: "#f8fbff",
            minHeight: 92,
            padding: 10,
            display: "grid",
            placeItems: "center",
            boxShadow: "0 8px 18px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 5,
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {Array.from({ length: Math.max(0, inEachGroup) }, (_, itemIndex) => (
              <CountingObjectShape
                key={`equal-group-${groupIndex}-${itemIndex}`}
                kind={kind}
                index={itemIndex}
                size={22}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArrayRowsColumnsVisual({
  rows,
  columns,
}: {
  rows: number;
  columns: number;
}) {
  const total = rows * columns;

  return (
    <div
      aria-label={`Array with ${rows} rows and ${columns} columns, showing ${total} objects`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
          color: "#1d4ed8",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        <span>{rows} rows across</span>
        <span>{columns} columns down</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(18px, 1fr))`,
          gap: 7,
          justifyItems: "center",
          alignItems: "center",
          width: "min(100%, 280px)",
          margin: "0 auto",
        }}
      >
        {Array.from({ length: Math.max(0, total) }, (_, index) => (
          <span
            key={`array-dot-${index}`}
            aria-hidden="true"
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: index % 2 ? "#bfdbfe" : "#bbf7d0",
              border: `1px solid ${index % 2 ? "#1d4ed8" : "#15803d"}`,
              boxShadow: "0 5px 10px rgba(15,23,42,0.10)",
            }}
          />
        ))}
      </div>
      <div
        style={{
          border: "1px solid #ccfbf1",
          borderRadius: 14,
          background: "#f0fdfa",
          color: "#0f766e",
          padding: "8px 10px",
          fontSize: 12,
          fontWeight: 850,
          lineHeight: 1.4,
          textAlign: "center",
        }}
      >
        Rows go across. Columns go down. Same total: {total}.
      </div>
    </div>
  );
}

export function renderStep19WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const groups = visual.groupCounts[0];
  const inEachGroup = visual.groupCounts[1];
  if (
    groups === undefined ||
    inEachGroup === undefined ||
    !Number.isFinite(groups) ||
    !Number.isFinite(inEachGroup)
  ) {
    return null;
  }

  const total = groups * inEachGroup;
  const isArrayPrompt =
    prompt.toLowerCase().includes("rows") ||
    prompt.toLowerCase().includes("array") ||
    visual.labels.some((label) => label.toLowerCase().includes("row"));

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
          Equal groups have the same number in each group.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Groups and arrays
        </span>
      </div>

      <div
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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 18,
              background: "#ffffff",
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900 }}>
              {groups} equal groups of {inEachGroup}
            </div>
            <EqualGroupsVisual groups={groups} inEachGroup={inEachGroup} />
          </div>
          <ArrayRowsColumnsVisual rows={groups} columns={inEachGroup} />
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
          {isArrayPrompt
            ? `${groups} rows with ${inEachGroup} in each row shows ${total} altogether.`
            : `${groups} equal groups with ${inEachGroup} in each group shows ${total} altogether.`}
        </div>
      </div>
    </div>
  );
}

function parseMultiplicationFactPrompt(prompt: string) {
  const match = safe(prompt).match(/(\d{1,2})\s*(?:x|×|\*)\s*(\d{1,2})/i);
  if (!match) return null;
  return {
    groups: Number(match[1]),
    inEachGroup: Number(match[2]),
  };
}

export function renderStep26WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const parsed = parseMultiplicationFactPrompt(prompt);
  const groups = parsed?.groups ?? visual.groupCounts[0];
  const inEachGroup = parsed?.inEachGroup ?? visual.groupCounts[1];
  if (
    groups === undefined ||
    inEachGroup === undefined ||
    !Number.isFinite(groups) ||
    !Number.isFinite(inEachGroup)
  ) {
    return null;
  }

  const total = groups * inEachGroup;

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
          Recall the multiplication fact, then check it with groups and an array.
        </div>
        <span
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 999,
            background: "#f0fdf4",
            color: "#166534",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Multiplication fact
        </span>
      </div>

      <div
        aria-label={`Equation ${groups} times ${inEachGroup} equals blank. ${groups} equal groups with ${inEachGroup} in each group.`}
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
            border: "1px solid #ddd6fe",
            borderRadius: 18,
            background: "#f5f3ff",
            color: "#5b21b6",
            minHeight: 104,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr auto minmax(80px, 0.7fr)",
            gap: 10,
            alignItems: "center",
            padding: 14,
            textAlign: "center",
          }}
        >
          <strong style={{ fontSize: 36, fontWeight: 950 }}>{groups}</strong>
          <span style={{ fontSize: 30, fontWeight: 950 }}>×</span>
          <strong style={{ fontSize: 36, fontWeight: 950 }}>{inEachGroup}</strong>
          <span style={{ fontSize: 30, fontWeight: 950 }}>=</span>
          <span
            aria-label="Missing product box"
            style={{
              border: "2px solid #7c3aed",
              borderRadius: 16,
              background: "#ffffff",
              padding: "12px 10px",
              fontSize: 28,
              fontWeight: 950,
            }}
          >
            __
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              border: "1px solid #bfdbfe",
              borderRadius: 18,
              background: "#ffffff",
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900 }}>
              {groups} equal groups of {inEachGroup}
            </div>
            <EqualGroupsVisual groups={groups} inEachGroup={inEachGroup} />
          </div>
          <ArrayRowsColumnsVisual rows={groups} columns={inEachGroup} />
        </div>

        <div
          aria-label={`Multiplication sentence ${groups} times ${inEachGroup} equals ${total}`}
          style={{
            border: "1px solid #fed7aa",
            borderRadius: 16,
            background: "#fff7ed",
            color: "#c2410c",
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 850,
            lineHeight: 1.45,
            textAlign: "center",
          }}
        >
          {groups} groups of {inEachGroup} means {groups} × {inEachGroup} = {total}.
        </div>
      </div>
    </div>
  );
}

export function renderStep27WorksheetPromptVisual({
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const rows = visual.groupCounts[0];
  const columns = visual.groupCounts[1];
  if (
    rows === undefined ||
    columns === undefined ||
    !Number.isFinite(rows) ||
    !Number.isFinite(columns)
  ) {
    return null;
  }

  const total = rows * columns;

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
          Use the array, equal groups and known facts to multiply or divide.
        </div>
        <span
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 999,
            background: "#f5f3ff",
            color: "#6d28d9",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Arrays and facts
        </span>
      </div>

      <div
        aria-label={`Array with ${rows} rows and ${columns} columns. ${rows} times ${columns} equals ${total}. ${total} divided by ${rows} equals ${columns}.`}
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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <ArrayRowsColumnsVisual rows={rows} columns={columns} />
          <div
            style={{
              border: "1px solid #bfdbfe",
              borderRadius: 18,
              background: "#ffffff",
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900 }}>
              {rows} equal groups of {columns}
            </div>
            <EqualGroupsVisual groups={rows} inEachGroup={columns} />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 10,
          }}
        >
          <div
            aria-label={`Multiplication sentence ${rows} times ${columns} equals ${total}`}
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: 16,
              background: "#f0fdf4",
              color: "#166534",
              padding: "12px 10px",
              textAlign: "center",
              fontSize: 18,
              fontWeight: 950,
            }}
          >
            {rows} × {columns} = {total}
          </div>
          <div
            aria-label={`Division fact ${total} divided by ${rows} equals ${columns}`}
            style={{
              border: "1px solid #fed7aa",
              borderRadius: 16,
              background: "#fff7ed",
              color: "#c2410c",
              padding: "12px 10px",
              textAlign: "center",
              fontSize: 18,
              fontWeight: 950,
            }}
          >
            {total} ÷ {rows} = {columns}
          </div>
          <div
            aria-label={`Division fact ${total} divided by ${columns} equals ${rows}`}
            style={{
              border: "1px solid #ddd6fe",
              borderRadius: 16,
              background: "#f5f3ff",
              color: "#6d28d9",
              padding: "12px 10px",
              textAlign: "center",
              fontSize: 18,
              fontWeight: 950,
            }}
          >
            {total} ÷ {columns} = {rows}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseEstimatePrompt(prompt: string, visual: EarlyNumberVisualModel) {
  const match = safe(prompt)
    .replace(/,/g, "")
    .match(/(\d{1,4})\s*([+-])\s*(\d{1,4})/);
  if (match) {
    const a = Number(match[1]);
    const symbol = match[2] as "+" | "-";
    const b = Number(match[3]);
    return {
      a,
      b,
      symbol,
    };
  }

  const a = Number(safe(visual.numberCards[0]).replace(/,/g, ""));
  const b = Number(safe(visual.numberCards[1]).replace(/,/g, ""));
  if (Number.isFinite(a) && Number.isFinite(b)) {
    return { a, b, symbol: "+" as const };
  }

  return null;
}

function roundForEstimate(value: number, place: 10 | 100) {
  return Math.round(value / place) * place;
}

export function renderStep28WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const equation = parseEstimatePrompt(prompt, visual);
  if (!equation) return null;

  const place: 10 | 100 = Math.max(equation.a, equation.b) >= 100 ? 100 : 10;
  const roundedA = roundForEstimate(equation.a, place);
  const roundedB = roundForEstimate(equation.b, place);
  const estimate = equation.symbol === "+" ? roundedA + roundedB : roundedA - roundedB;
  const symbolWord = equation.symbol === "+" ? "plus" : "minus";

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
          Estimate first, then check whether the exact answer is reasonable.
        </div>
        <span
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 999,
            background: "#f0fdf4",
            color: "#166534",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Estimate and check
        </span>
      </div>

      <div
        aria-label={`Estimate ${equation.a} ${symbolWord} ${equation.b} by rounding to the nearest ${place}`}
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
            border: "1px solid #bfdbfe",
            borderRadius: 18,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: 14,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr auto minmax(80px, 0.7fr)",
            gap: 10,
            alignItems: "center",
            textAlign: "center",
            fontWeight: 950,
          }}
        >
          <strong style={{ fontSize: 30 }}>{equation.a}</strong>
          <span style={{ fontSize: 28 }}>{equation.symbol}</span>
          <strong style={{ fontSize: 30 }}>{equation.b}</strong>
          <span style={{ fontSize: 28 }}>=</span>
          <span
            style={{
              border: "2px solid #7c3aed",
              borderRadius: 16,
              background: "#ffffff",
              color: "#6d28d9",
              padding: "10px 8px",
              fontSize: 24,
            }}
          >
            about?
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 10,
          }}
        >
          <div
            aria-label={`${equation.a} rounds to ${roundedA} and ${equation.b} rounds to ${roundedB}`}
            style={{
              border: "1px solid #fed7aa",
              borderRadius: 16,
              background: "#fff7ed",
              color: "#c2410c",
              padding: 12,
              display: "grid",
              gap: 8,
              textAlign: "center",
              fontWeight: 900,
            }}
          >
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Round to nearest {place}
            </span>
            <strong style={{ fontSize: 20 }}>
              {equation.a} → {roundedA}
            </strong>
            <strong style={{ fontSize: 20 }}>
              {equation.b} → {roundedB}
            </strong>
          </div>

          <div
            aria-label={`Rounded estimate ${roundedA} ${symbolWord} ${roundedB} equals ${estimate}`}
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: 16,
              background: "#f0fdf4",
              color: "#166534",
              padding: 12,
              display: "grid",
              placeItems: "center",
              gap: 8,
              textAlign: "center",
              fontWeight: 950,
            }}
          >
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Estimate
            </span>
            <strong style={{ fontSize: 24 }}>
              {roundedA} {equation.symbol} {roundedB} = {estimate}
            </strong>
          </div>

          <div
            aria-label={`Exact answer box. The exact answer should be close to ${estimate}.`}
            style={{
              border: "1px solid #ddd6fe",
              borderRadius: 16,
              background: "#f5f3ff",
              color: "#6d28d9",
              padding: 12,
              display: "grid",
              placeItems: "center",
              gap: 8,
              textAlign: "center",
              fontWeight: 900,
            }}
          >
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Exact check
            </span>
            <strong style={{ fontSize: 18 }}>
              Exact answer should be close to {estimate}
            </strong>
          </div>
        </div>

        <div
          aria-label={`Reasonableness check. An exact answer is reasonable when it is close to ${estimate}.`}
          style={{
            border: "1px solid #ccfbf1",
            borderRadius: 16,
            background: "#f0fdfa",
            color: "#0f766e",
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 850,
            lineHeight: 1.45,
            textAlign: "center",
          }}
        >
          Reasonable answers are close to the estimate.
        </div>
      </div>
    </div>
  );
}

function parseFractionNotation(value: string) {
  const match = safe(value).match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  return {
    numerator: Number(match[1]),
    denominator: Number(match[2]),
  };
}

function denominatorFromWord(word: string) {
  const normalized = word.toLowerCase();
  if (normalized.startsWith("two")) return 2;
  if (normalized.startsWith("three")) return 3;
  if (normalized.startsWith("four")) return 4;
  if (normalized.startsWith("five")) return 5;
  if (normalized.startsWith("six")) return 6;
  if (normalized.startsWith("eight")) return 8;
  return null;
}

function inferStep29FractionFromPrompt(prompt: string) {
  const lower = prompt.toLowerCase();
  const shadedOutOf = lower.match(/(\d{1,2})\s+parts?\s+shaded\s+out\s+of\s+(\d{1,2})/);
  if (shadedOutOf) {
    return {
      numerator: Number(shadedOutOf[1]),
      denominator: Number(shadedOutOf[2]),
    };
  }

  const wordOutOf = lower.match(/\b(one|two|three|four)\s+out\s+of\s+(two|three|four|five|six|eight)/);
  if (wordOutOf) {
    const numerator = denominatorFromWord(wordOutOf[1]) ?? 1;
    const denominator = denominatorFromWord(wordOutOf[2]) ?? 2;
    return { numerator, denominator };
  }

  if (lower.includes("unit fraction")) return { numerator: 1, denominator: 6 };
  if (lower.includes("same as one half")) return { numerator: 1, denominator: 2 };
  if (lower.includes("whole")) return { numerator: 4, denominator: 4 };

  return { numerator: 1, denominator: 2 };
}

function fractionWords(numerator: number, denominator: number) {
  const denominatorWords: Record<number, string> = {
    2: "halves",
    3: "thirds",
    4: "quarters",
    5: "fifths",
    6: "sixths",
    8: "eighths",
  };
  const numeratorWords: Record<number, string> = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
  };
  if (numerator === 1 && denominator === 2) return "one half";
  return `${numeratorWords[numerator] ?? numerator} ${
    numerator === 1
      ? (denominatorWords[denominator] ?? "parts").replace(/s$/, "")
      : denominatorWords[denominator] ?? "parts"
  }`;
}

export function renderStep29WorksheetPromptVisual({
  prompt,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const fraction = inferStep29FractionFromPrompt(prompt);
  const isUnit = fraction.numerator === 1;

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
          Count the shaded equal parts, then match the fraction notation.
        </div>
        <span
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 999,
            background: "#f5f3ff",
            color: "#6d28d9",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {isUnit ? "Unit fraction" : "Simple fraction"}
        </span>
      </div>

      <div
        aria-label={`${fraction.numerator} out of ${fraction.denominator} equal parts shaded`}
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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <FractionShapeVisual
            numerator={fraction.numerator}
            denominator={fraction.denominator}
            label={`${fraction.numerator}/${fraction.denominator}`}
          />
          <div
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: 18,
              background: "#f0fdf4",
              color: "#166534",
              padding: 14,
              display: "grid",
              placeItems: "center",
              gap: 8,
              textAlign: "center",
              fontWeight: 900,
            }}
          >
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Fraction words
            </span>
            <strong style={{ fontSize: 22 }}>{fractionWords(fraction.numerator, fraction.denominator)}</strong>
            <span style={{ fontSize: 13, lineHeight: 1.35 }}>
              {fraction.numerator} shaded part{fraction.numerator === 1 ? "" : "s"} out of{" "}
              {fraction.denominator} equal parts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseMoneyAmount(value: string) {
  const match = safe(value).match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) ? amount : null;
}

function formatMoneyAmount(amount: number) {
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}

function getStep30MoneyDetails(prompt: string, visual: EarlyNumberVisualModel) {
  const visualAmounts = visual.numberCards
    .map(parseMoneyAmount)
    .filter((amount): amount is number => amount !== null);
  const promptAmounts =
    prompt
      .match(/\$\s*\d+(?:\.\d{1,2})?|\b\d+(?:\.\d{1,2})?\b/g)
      ?.map(parseMoneyAmount)
      .filter((amount): amount is number => amount !== null) ?? [];
  const amounts = visualAmounts.length >= 2 ? visualAmounts : promptAmounts;
  const first = amounts[0] ?? 10;
  const second = amounts[1] ?? 4;
  const lower = prompt.toLowerCase();
  const isChange =
    lower.includes("spend") ||
    lower.includes("left") ||
    lower.includes("change") ||
    lower.includes("pay with") ||
    lower.includes("paid with");
  const answer = amounts[2] ?? (isChange ? first - second : first + second);

  return {
    first,
    second,
    answer,
    mode: isChange ? ("change" as const) : ("total" as const),
  };
}

function MoneyToken({
  amount,
  tone = "note",
}: {
  amount: number;
  tone?: "note" | "coin";
}) {
  const isCoin = tone === "coin" || amount < 1;
  return (
    <span
      aria-label={`${formatMoneyAmount(amount)} ${isCoin ? "coin" : "note"}`}
      style={{
        border: `2px solid ${isCoin ? "#d97706" : "#15803d"}`,
        borderRadius: isCoin ? 999 : 12,
        background: isCoin ? "#fef3c7" : "#dcfce7",
        color: isCoin ? "#92400e" : "#166534",
        minWidth: isCoin ? 58 : 82,
        minHeight: isCoin ? 58 : 46,
        padding: isCoin ? 8 : "9px 12px",
        display: "inline-grid",
        placeItems: "center",
        fontSize: isCoin ? 17 : 20,
        fontWeight: 950,
        boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
      }}
    >
      {formatMoneyAmount(amount)}
    </span>
  );
}

function MoneyPanel({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "price" | "paid" | "change";
}) {
  const toneMap = {
    price: { border: "#bfdbfe", background: "#eff6ff", color: "#1d4ed8" },
    paid: { border: "#bbf7d0", background: "#f0fdf4", color: "#166534" },
    change: { border: "#ddd6fe", background: "#f5f3ff", color: "#6d28d9" },
  }[tone];

  return (
    <div
      aria-label={`${label} ${formatMoneyAmount(amount)}`}
      style={{
        border: `1px solid ${toneMap.border}`,
        borderRadius: 18,
        background: toneMap.background,
        padding: 12,
        display: "grid",
        gap: 8,
        justifyItems: "center",
        textAlign: "center",
      }}
    >
      <span
        style={{
          color: toneMap.color,
          fontSize: 12,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <MoneyToken amount={amount} />
    </div>
  );
}

export function renderStep30WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const details = getStep30MoneyDetails(prompt, visual);
  const isChange = details.mode === "change";

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
          Use the money cards to work out the total or the change.
        </div>
        <span
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 999,
            background: "#f0fdf4",
            color: "#166534",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {isChange ? "Find change" : "Find total"}
        </span>
      </div>

      <div
        aria-label={
          isChange
            ? `${formatMoneyAmount(details.first)} paid, ${formatMoneyAmount(details.second)} spent, find the money left`
            : `${formatMoneyAmount(details.first)} plus ${formatMoneyAmount(details.second)}, find the total`
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          <MoneyPanel
            label={isChange ? "Start with" : "Price 1"}
            amount={details.first}
            tone={isChange ? "paid" : "price"}
          />
          <MoneyPanel
            label={isChange ? "Spend" : "Price 2"}
            amount={details.second}
            tone="price"
          />
          <div
            aria-label={isChange ? "Change answer box" : "Total answer box"}
            style={{
              border: "2px dashed #7c3aed",
              borderRadius: 18,
              background: "#faf5ff",
              color: "#6d28d9",
              minHeight: 104,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              padding: 12,
              fontWeight: 950,
            }}
          >
            <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isChange ? "Money left" : "Total"}
            </span>
            <strong style={{ fontSize: 32 }}>__</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStep20FractionKind(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("quarter") || lower.includes("quarters") || lower.includes("1/4")) {
    return { denominator: 4, label: "one quarter", partsLabel: "quarters" };
  }

  return { denominator: 2, label: "one half", partsLabel: "halves" };
}

function getStep20ShareDetails(prompt: string) {
  const lower = prompt.toLowerCase();
  const shareMatch = lower.match(/\bshare\s+(\d{1,2}).*?(?:between|into)\s+(\d{1,2})/);
  if (shareMatch) {
    const total = Number(shareMatch[1]);
    const groups = Number(shareMatch[2]);
    return {
      total,
      groups,
      each: groups > 0 ? Math.floor(total / groups) : 0,
    };
  }

  const halfOfMatch = lower.match(/\bhalf\s+of\s+(\d{1,2})/);
  if (halfOfMatch) {
    const total = Number(halfOfMatch[1]);
    return { total, groups: 2, each: Math.floor(total / 2) };
  }

  const quarterOfMatch = lower.match(/\bquarter\s+of\s+(\d{1,2})/);
  if (quarterOfMatch) {
    const total = Number(quarterOfMatch[1]);
    return { total, groups: 4, each: Math.floor(total / 4) };
  }

  const fraction = getStep20FractionKind(prompt);
  const total = fraction.denominator === 4 ? 8 : 6;
  return {
    total,
    groups: fraction.denominator,
    each: Math.floor(total / fraction.denominator),
  };
}

function FractionShapeVisual({
  denominator,
  numerator = 1,
  selected = false,
  label,
  shape = "auto",
}: {
  denominator: number;
  numerator?: number;
  selected?: boolean;
  label?: string;
  shape?: "auto" | "circle" | "rectangle" | "grid";
}) {
  const displayLabel = label ?? `${numerator}/${denominator}`;
  const modelShape =
    shape === "auto"
      ? denominator === 3
        ? "circle"
        : denominator >= 5
          ? "grid"
          : "rectangle"
      : shape;
  const shadedParts = Math.max(0, Math.min(denominator, numerator));
  const gridColumns =
    denominator === 3 ? 3 : denominator === 4 ? 2 : denominator === 6 ? 3 : denominator === 8 ? 4 : denominator;
  const gridRows = Math.ceil(denominator / gridColumns);

  return (
    <div
      aria-label={`${modelShape} split into ${denominator} equal parts with ${shadedParts} shaded`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        padding: 12,
        display: "grid",
        gap: 10,
        minHeight: 138,
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900 }}>
        {displayLabel}
      </div>
      <div
        style={{
          border: "2px solid #1d4ed8",
          borderRadius: modelShape === "circle" ? 999 : 16,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns:
            modelShape === "rectangle"
              ? `repeat(${denominator}, 1fr)`
              : `repeat(${gridColumns}, 1fr)`,
          gridTemplateRows:
            modelShape === "rectangle" ? "1fr" : `repeat(${gridRows}, 1fr)`,
          minHeight: 84,
          background: "#ffffff",
        }}
      >
        {Array.from({ length: denominator }, (_, index) => (
          <span
            key={`fraction-part-${denominator}-${index}`}
            aria-hidden="true"
            style={{
              background: index < shadedParts ? "#bfdbfe" : "#ffffff",
              borderLeft:
                modelShape === "rectangle"
                  ? index > 0
                    ? "2px solid #1d4ed8"
                    : undefined
                  : index % gridColumns !== 0
                    ? "2px solid #1d4ed8"
                    : undefined,
              borderTop:
                modelShape !== "rectangle" && index >= gridColumns
                  ? "2px solid #1d4ed8"
                  : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FractionOfSetVisual({
  total,
  denominator,
  selected = false,
}: {
  total: number;
  denominator: number;
  selected?: boolean;
}) {
  const highlighted = Math.max(1, Math.floor(total / denominator));
  return (
    <div
      aria-label={`${total} stars split into ${denominator} equal groups with ${highlighted} highlighted as ${denominator === 4 ? "one quarter" : "one half"}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bbf7d0"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#f0fdf4",
        padding: 12,
        display: "grid",
        gap: 10,
        minHeight: 138,
      }}
    >
      <div style={{ color: "#166534", fontSize: 12, fontWeight: 900 }}>
        {denominator === 4 ? "Quarter of a set" : "Half of a set"}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(30px, 1fr))",
          gap: 8,
          alignItems: "center",
        }}
      >
        {Array.from({ length: total }, (_, index) => {
          const isHighlighted = index < highlighted;
          return (
            <span
              key={`fraction-set-${index}`}
              style={{
                border: `2px solid ${isHighlighted ? "#16a34a" : "#cbd5e1"}`,
                borderRadius: 999,
                background: isHighlighted ? "#dcfce7" : "#ffffff",
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CountingObjectShape kind="star" index={index} size={18} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SimpleSharingContainersVisual({
  total,
  groups,
  each,
}: {
  total: number;
  groups: number;
  each: number;
}) {
  const safeGroups = Math.max(1, Math.min(groups, 4));
  const safeEach = Math.max(0, Math.min(each, 6));
  return (
    <div
      aria-label={`${total} cookies shared equally between ${safeGroups} plates, ${safeEach} cookies on each plate`}
      style={{
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
          gap: 10,
        }}
      >
        {Array.from({ length: safeGroups }, (_, groupIndex) => (
          <div
            key={`share-container-${groupIndex}`}
            style={{
              border: "2px solid #fdba74",
              borderRadius: "50%",
              background: "#fff7ed",
              minHeight: 94,
              padding: 10,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
            }}
          >
            {Array.from({ length: safeEach }, (_, itemIndex) => (
              <CountingObjectShape
                key={`share-object-${groupIndex}-${itemIndex}`}
                kind="heart"
                index={groupIndex * safeEach + itemIndex}
                size={20}
              />
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          border: "1px solid #fed7aa",
          borderRadius: 14,
          background: "#fff7ed",
          color: "#c2410c",
          padding: "8px 10px",
          fontSize: 12,
          fontWeight: 850,
          textAlign: "center",
        }}
      >
        {safeGroups} equal shares. Each share has {safeEach}.
      </div>
    </div>
  );
}

export function renderStep20WorksheetPromptVisual({
  prompt,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const fraction = getStep20FractionKind(prompt);
  const sharing = getStep20ShareDetails(prompt);
  const lower = prompt.toLowerCase();
  const isSharingPrompt =
    lower.includes("share") ||
    lower.includes("fair") ||
    lower.includes("half of") ||
    lower.includes("quarter of");

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
          Look for equal parts and fair sharing.
        </div>
        <span
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 999,
            background: "#f5f3ff",
            color: "#6d28d9",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Halves and quarters
        </span>
      </div>

      <div
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
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <FractionShapeVisual denominator={fraction.denominator} />
          <FractionOfSetVisual total={sharing.total} denominator={fraction.denominator} />
        </div>
        {isSharingPrompt ? (
          <SimpleSharingContainersVisual
            total={sharing.total}
            groups={sharing.groups}
            each={sharing.each}
          />
        ) : null}
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
          {fraction.label} means one of {fraction.denominator} equal parts.
        </div>
      </div>
    </div>
  );
}

function formatLargeNumber(value: string | number) {
  const normalized = safe(value).replace(/,/g, "");
  if (!/^-?\d+$/.test(normalized)) return safe(value);
  return Number(normalized).toLocaleString("en-US");
}

function getLargeNumberValues(visual: EarlyNumberVisualModel) {
  return visual.numberCards
    .map((entry) => safe(entry))
    .filter(Boolean)
    .map((entry) => formatLargeNumber(entry));
}

function largeNumberToWords(value: string) {
  const number = Number(safe(value).replace(/,/g, ""));
  if (!Number.isFinite(number)) return safe(value);

  const underTwenty = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tensWords = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const underThousand = (part: number): string => {
    if (part < 20) return underTwenty[part];
    if (part < 100) {
      const tens = Math.floor(part / 10);
      const ones = part % 10;
      return ones ? `${tensWords[tens]}-${underTwenty[ones]}` : tensWords[tens];
    }
    const hundreds = Math.floor(part / 100);
    const rest = part % 100;
    return rest
      ? `${underTwenty[hundreds]} hundred and ${underThousand(rest)}`
      : `${underTwenty[hundreds]} hundred`;
  };

  if (number < 1000) return underThousand(number);
  const thousands = Math.floor(number / 1000);
  const rest = number % 1000;
  return rest ? `${underThousand(thousands)} thousand ${underThousand(rest)}` : `${underThousand(thousands)} thousand`;
}

function LargeNumberWorksheetCard({
  value,
  label = "Number",
  selected = false,
}: {
  value: string;
  label?: string;
  selected?: boolean;
}) {
  const formatted = formatLargeNumber(value);
  return (
    <div
      aria-label={`${label} ${largeNumberToWords(formatted)}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        minHeight: 132,
        padding: 12,
        display: "grid",
        placeItems: "center",
        gap: 8,
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          color: "#1d4ed8",
          fontSize: 12,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "#0f172a",
          fontSize: "clamp(28px, 6vw, 42px)",
          fontWeight: 950,
          lineHeight: 1,
        }}
      >
        {formatted}
      </div>
      <div style={{ color: "#475569", fontSize: 12, fontWeight: 800, lineHeight: 1.3 }}>
        {largeNumberToWords(formatted)}
      </div>
    </div>
  );
}

function LargeNumberOrderingVisual({ values }: { values: string[] }) {
  const ordered = values
    .map((value) => Number(value.replace(/,/g, "")))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
    .map((value) => formatLargeNumber(value));

  return (
    <div
      aria-label={`Ordering sequence ${ordered.map((value) => largeNumberToWords(value)).join(", ")}`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900 }}>
        Smallest to largest
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        {ordered.map((value, index) => (
          <React.Fragment key={`large-order-${value}-${index}`}>
            <span
              style={{
                border: "1px solid #bfdbfe",
                borderRadius: 14,
                background: "#eff6ff",
                color: "#1e3a8a",
                padding: "10px 12px",
                fontSize: 20,
                fontWeight: 950,
              }}
            >
              {value}
            </span>
            {index < ordered.length - 1 ? (
              <span aria-hidden="true" style={{ color: "#64748b", fontWeight: 950 }}>
                &lt;
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function LargeNumberComparisonVisual({ values }: { values: string[] }) {
  const numbers = values
    .map((value) => Number(value.replace(/,/g, "")))
    .filter(Number.isFinite);
  const left = numbers[0] ?? 742;
  const right = numbers[1] ?? 724;
  const symbol = left > right ? ">" : left < right ? "<" : "=";

  return (
    <div
      aria-label={`Compare ${largeNumberToWords(formatLargeNumber(left))} with ${largeNumberToWords(formatLargeNumber(right))}`}
      style={{
        border: "1px solid #fed7aa",
        borderRadius: 18,
        background: "#fff7ed",
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ color: "#c2410c", fontSize: 12, fontWeight: 900 }}>
        Compare numbers
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span
          style={{
            border: "1px solid #fdba74",
            borderRadius: 14,
            background: "#ffffff",
            color: "#0f172a",
            padding: "12px 10px",
            fontSize: 24,
            fontWeight: 950,
            textAlign: "center",
          }}
        >
          {formatLargeNumber(left)}
        </span>
        <span
          style={{
            border: "1px solid #fdba74",
            borderRadius: 14,
            background: "#ffedd5",
            color: "#c2410c",
            padding: "8px 12px",
            fontSize: 28,
            fontWeight: 950,
          }}
        >
          {symbol}
        </span>
        <span
          style={{
            border: "1px solid #fdba74",
            borderRadius: 14,
            background: "#ffffff",
            color: "#0f172a",
            padding: "12px 10px",
            fontSize: 24,
            fontWeight: 950,
            textAlign: "center",
          }}
        >
          {formatLargeNumber(right)}
        </span>
      </div>
    </div>
  );
}

function getExtendedPlaceValueDigits(value: string | number) {
  const normalized = safe(value).replace(/,/g, "");
  const padded = normalized.padStart(6, "0");
  const recentSix = padded.slice(-6);
  return recentSix.split("").map((digit) => Number(digit));
}

function getExpandedLargeNumber(value: string | number) {
  const normalized = safe(value).replace(/,/g, "");
  if (!/^\d+$/.test(normalized)) return [];

  return normalized
    .split("")
    .map((digit, index, digits) => {
      const place = digits.length - index - 1;
      const amount = Number(digit) * 10 ** place;
      return amount;
    })
    .filter((amount) => amount > 0);
}

function ExtendedPlaceValueChart({
  value,
  underlinedIndex,
}: {
  value: string | number;
  underlinedIndex?: number;
}) {
  const columns = ["HTh", "TTh", "Th", "H", "T", "O"];
  const labels = ["Hundred thousands", "Ten thousands", "Thousands", "Hundreds", "Tens", "Ones"];
  const digits = getExtendedPlaceValueDigits(value);

  return (
    <div
      aria-label={`Extended place value chart showing ${largeNumberToWords(formatLargeNumber(value))}`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(44px, 1fr))",
          gap: 6,
        }}
      >
        {columns.map((column, index) => (
          <div
            key={`extended-pv-${column}`}
            style={{
              border: "1px solid #bfdbfe",
              borderRadius: 12,
              overflow: "hidden",
              background: "#eff6ff",
              textAlign: "center",
            }}
          >
            <div
              style={{
                background: index < 3 ? "#dbeafe" : "#f0fdf4",
                color: index < 3 ? "#1d4ed8" : "#166534",
                padding: "7px 4px",
                fontSize: 11,
                fontWeight: 950,
              }}
              title={labels[index]}
            >
              {column}
            </div>
            <div
              style={{
                background: "#ffffff",
                color: "#0f172a",
                padding: "10px 4px",
                minHeight: 46,
                display: "grid",
                placeItems: "center",
                fontSize: 26,
                fontWeight: 950,
                textDecoration: underlinedIndex === index ? "underline" : undefined,
                textDecorationColor: "#7c3aed",
                textDecorationThickness: underlinedIndex === index ? 4 : undefined,
                textUnderlineOffset: underlinedIndex === index ? 5 : undefined,
              }}
            >
              {digits[index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LargeNumberExpandedFormVisual({ value }: { value: string | number }) {
  const parts = getExpandedLargeNumber(value);
  return (
    <div
      aria-label={`Expanded form ${parts.map(formatLargeNumber).join(" plus ")}`}
      style={{
        border: "1px solid #bbf7d0",
        borderRadius: 18,
        background: "#f0fdf4",
        color: "#166534",
        padding: 12,
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Expanded form
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {parts.map((part, index) => (
          <React.Fragment key={`expanded-large-${part}-${index}`}>
            <span
              style={{
                border: "1px solid #86efac",
                borderRadius: 12,
                background: "#ffffff",
                padding: "8px 10px",
                fontSize: 17,
                fontWeight: 950,
              }}
            >
              {formatLargeNumber(part)}
            </span>
            {index < parts.length - 1 ? (
              <span aria-hidden="true" style={{ fontWeight: 950 }}>
                +
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function renderStep31WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const values = getLargeNumberValues(visual);
  const focusValue = values[1] ?? values[0] ?? "120,045";
  const lower = prompt.toLowerCase();
  const isComparing =
    lower.includes("compare") ||
    lower.includes("greater") ||
    lower.includes("less") ||
    lower.includes("largest") ||
    lower.includes("smallest");
  const isDigitValue = lower.includes("value") || lower.includes("digit") || lower.includes("place");
  const digits = getExtendedPlaceValueDigits(focusValue);
  const firstNonZero = Math.max(0, digits.findIndex((digit) => digit > 0));

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
          Read each digit by its place, then match the larger number.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Extended place value
        </span>
      </div>

      <div
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        <LargeNumberWorksheetCard value={focusValue} label="Large number" />
        <ExtendedPlaceValueChart
          value={focusValue}
          underlinedIndex={isDigitValue ? firstNonZero : undefined}
        />
        {isComparing && values.length >= 2 ? (
          <LargeNumberComparisonVisual values={[values[0] ?? focusValue, focusValue]} />
        ) : (
          <LargeNumberExpandedFormVisual value={focusValue} />
        )}
      </div>
    </div>
  );
}

function roundToPlace(value: number, place: number) {
  return Math.round(value / place) * place;
}

function getStep32RoundingDetails(visual: EarlyNumberVisualModel) {
  const value = Number(safe(visual.numberCards[0]).replace(/,/g, ""));
  const answer = Number(safe(visual.numberCards[1]).replace(/,/g, ""));
  const safeValue = Number.isFinite(value) ? value : 1482;
  const safeAnswer = Number.isFinite(answer) ? answer : roundToPlace(safeValue, 100);
  const places = [10, 100, 1000, 10000, 100000, 1000000];
  const matchingPlace =
    places.find((place) => roundToPlace(safeValue, place) === safeAnswer) ??
    (safeValue >= 100000 ? 10000 : safeValue >= 10000 ? 1000 : safeValue >= 1000 ? 100 : 10);

  return {
    value: safeValue,
    answer: safeAnswer,
    place: matchingPlace,
  };
}

function formatPlaceLabel(place: number) {
  if (place === 10) return "nearest 10";
  if (place === 100) return "nearest 100";
  if (place === 1000) return "nearest 1,000";
  if (place === 10000) return "nearest 10,000";
  if (place === 100000) return "nearest 100,000";
  return "nearest 1,000,000";
}

function LargeNumberRoundingTable({ value, focusPlace }: { value: number; focusPlace: number }) {
  const places = [10, 100, 1000, 10000, 100000].filter(
    (place) => place <= Math.max(1000, value * 10),
  );

  return (
    <div
      aria-label={`Rounding table for ${largeNumberToWords(formatLargeNumber(value))}`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(120px, 1fr) minmax(120px, 1fr)",
          background: "#eff6ff",
          color: "#1d4ed8",
          fontSize: 12,
          fontWeight: 950,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <span style={{ padding: 10, borderRight: "1px solid #bfdbfe" }}>Round to</span>
        <span style={{ padding: 10 }}>Estimate</span>
      </div>
      {places.map((place) => {
        const isFocus = place === focusPlace;
        return (
          <div
            key={`rounding-row-${place}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(120px, 1fr) minmax(120px, 1fr)",
              borderTop: "1px solid #dbeafe",
              background: isFocus ? "#f5f3ff" : "#ffffff",
              color: isFocus ? "#6d28d9" : "#0f172a",
              fontWeight: isFocus ? 950 : 850,
            }}
          >
            <span style={{ padding: 10, borderRight: "1px solid #dbeafe" }}>
              {formatPlaceLabel(place)}
            </span>
            <span style={{ padding: 10 }}>{formatLargeNumber(roundToPlace(value, place))}</span>
          </div>
        );
      })}
    </div>
  );
}

export function renderStep32WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const details = getStep32RoundingDetails(visual);

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
          Round the larger number to a useful place value, then choose the best estimate.
        </div>
        <span
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 999,
            background: "#f5f3ff",
            color: "#6d28d9",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {formatPlaceLabel(details.place)}
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <LargeNumberWorksheetCard value={String(details.value)} label="Number to round" />
        <LargeNumberRoundingTable value={details.value} focusPlace={details.place} />
        <div
          aria-label={`Estimate answer box ${formatLargeNumber(details.answer)}`}
          style={{
            border: "2px dashed #7c3aed",
            borderRadius: 18,
            background: "#faf5ff",
            color: "#6d28d9",
            minHeight: 82,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 10,
            alignItems: "center",
            padding: 12,
            fontWeight: 950,
          }}
        >
          <span>Best estimate</span>
          <strong style={{ fontSize: 28 }}>__</strong>
        </div>
      </div>
    </div>
  );
}

function parseDecimalValue(value: string | number) {
  const normalized = safe(value);
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const [ones = "0", decimal = ""] = normalized.split(".");
  const tenths = decimal[0] ?? "0";
  const hundredths = decimal[1] ?? "0";
  return {
    raw: normalized,
    ones: Number(ones),
    tenths: Number(tenths),
    hundredths: Number(hundredths),
  };
}

function decimalWords(value: string | number) {
  const decimal = parseDecimalValue(value);
  if (!decimal) return safe(value);
  const parts = [`${decimal.ones} ones`, `${decimal.tenths} tenths`];
  if (safe(decimal.raw).includes(".") && safe(decimal.raw).split(".")[1]?.length > 1) {
    parts.push(`${decimal.hundredths} hundredths`);
  }
  return parts.join(", ");
}

function DecimalNumberCard({
  value,
  label = "Decimal",
  selected = false,
}: {
  value: string;
  label?: string;
  selected?: boolean;
}) {
  return (
    <div
      aria-label={`${label} ${decimalWords(value)}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        minHeight: 132,
        padding: 12,
        display: "grid",
        placeItems: "center",
        gap: 8,
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          color: "#1d4ed8",
          fontSize: 12,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "#0f172a",
          fontSize: 40,
          fontWeight: 950,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ color: "#475569", fontSize: 12, fontWeight: 800, lineHeight: 1.3 }}>
        {decimalWords(value)}
      </div>
    </div>
  );
}

function DecimalPlaceValueChart({ value }: { value: string }) {
  const decimal = parseDecimalValue(value) ?? { raw: value, ones: 0, tenths: 0, hundredths: 0 };
  const columns = [
    { key: "ones", label: "Ones", value: decimal.ones, color: "#1d4ed8", background: "#eff6ff" },
    { key: "point", label: ".", value: ".", color: "#64748b", background: "#f8fafc" },
    { key: "tenths", label: "Tenths", value: decimal.tenths, color: "#166534", background: "#f0fdf4" },
    { key: "hundredths", label: "Hundredths", value: decimal.hundredths, color: "#6d28d9", background: "#f5f3ff" },
  ];

  return (
    <div
      aria-label={`Decimal place value chart showing ${decimalWords(value)}`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 44px 1fr 1fr",
          gap: 6,
        }}
      >
        {columns.map((column) => (
          <div
            key={`decimal-column-${column.key}`}
            style={{
              border: "1px solid #bfdbfe",
              borderRadius: 12,
              overflow: "hidden",
              textAlign: "center",
              background: column.background,
            }}
          >
            <div
              style={{
                color: column.color,
                padding: "7px 4px",
                fontSize: 11,
                fontWeight: 950,
                textTransform: column.key === "point" ? undefined : "uppercase",
                letterSpacing: column.key === "point" ? undefined : "0.04em",
              }}
            >
              {column.label}
            </div>
            <div
              style={{
                background: "#ffffff",
                color: column.color,
                padding: "10px 4px",
                minHeight: 48,
                display: "grid",
                placeItems: "center",
                fontSize: column.key === "point" ? 34 : 28,
                fontWeight: 950,
              }}
            >
              {column.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecimalPartitionPanel({ value }: { value: string }) {
  const decimal = parseDecimalValue(value) ?? { raw: value, ones: 0, tenths: 0, hundredths: 0 };
  const hasHundredths = safe(value).includes(".") && safe(value).split(".")[1]?.length > 1;

  return (
    <div
      aria-label={`Partition ${value} as ${decimalWords(value)}`}
      style={{
        border: "1px solid #bbf7d0",
        borderRadius: 18,
        background: "#f0fdf4",
        color: "#166534",
        padding: 12,
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Partition
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span style={{ border: "1px solid #86efac", borderRadius: 12, background: "#ffffff", padding: "8px 10px", fontWeight: 950 }}>
          {decimal.ones} ones
        </span>
        <span aria-hidden="true" style={{ fontWeight: 950 }}>+</span>
        <span style={{ border: "1px solid #86efac", borderRadius: 12, background: "#ffffff", padding: "8px 10px", fontWeight: 950 }}>
          {decimal.tenths} tenths
        </span>
        {hasHundredths ? (
          <>
            <span aria-hidden="true" style={{ fontWeight: 950 }}>+</span>
            <span style={{ border: "1px solid #86efac", borderRadius: 12, background: "#ffffff", padding: "8px 10px", fontWeight: 950 }}>
              {decimal.hundredths} hundredths
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function renderStep33WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const focusValue = safe(visual.numberCards[0]) || safe(prompt.match(/\d+(?:\.\d+)?/)?.[0]) || "3.25";

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
          Read the decimal using ones, tenths and hundredths.
        </div>
        <span
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 999,
            background: "#f5f3ff",
            color: "#6d28d9",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Decimal place value
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <DecimalNumberCard value={focusValue} label="Decimal number" />
        <DecimalPlaceValueChart value={focusValue} />
        <DecimalPartitionPanel value={focusValue} />
      </div>
    </div>
  );
}

function compareDecimalValues(left: string, right: string) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) return "=";
  if (leftNumber > rightNumber) return ">";
  if (leftNumber < rightNumber) return "<";
  return "=";
}

function DecimalComparisonPanel({ left, right }: { left: string; right: string }) {
  const symbol = compareDecimalValues(left, right);
  return (
    <div
      aria-label={`Compare decimal ${left} with decimal ${right}`}
      style={{
        border: "1px solid #fed7aa",
        borderRadius: 18,
        background: "#fff7ed",
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ color: "#c2410c", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Compare aligned decimals
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(110px, 1fr) auto minmax(110px, 1fr)",
          gap: 10,
          alignItems: "center",
        }}
      >
        <DecimalPlaceValueChart value={left} />
        <span
          style={{
            border: "1px solid #fdba74",
            borderRadius: 999,
            background: "#ffedd5",
            color: "#c2410c",
            minWidth: 52,
            minHeight: 52,
            display: "grid",
            placeItems: "center",
            fontSize: 28,
            fontWeight: 950,
          }}
        >
          {symbol}
        </span>
        <DecimalPlaceValueChart value={right} />
      </div>
      <div
        style={{
          border: "1px solid #fdba74",
          borderRadius: 14,
          background: "#ffffff",
          color: "#9a3412",
          padding: "9px 10px",
          fontSize: 13,
          fontWeight: 850,
          textAlign: "center",
        }}
      >
        Compare ones first, then tenths, then hundredths. A trailing zero can hold a decimal place.
      </div>
    </div>
  );
}

export function renderStep34WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const left = safe(visual.numberCards[0]) || "0.6";
  const right = safe(visual.numberCards[1]) || "0.45";
  const ordered = [left, right].sort((a, b) => Number(a) - Number(b));

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
          Line up the decimal places, then choose the larger decimal or decide if they are equal.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Decimal comparison
        </span>
      </div>

      <div
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
            border: "1px solid #ddd6fe",
            borderRadius: 18,
            background: "#f5f3ff",
            color: "#6d28d9",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <DecimalComparisonPanel left={left} right={right} />
        <div
          aria-label={`Decimals ordered from smallest to largest: ${ordered.join(", ")}`}
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 18,
            background: "#f0fdf4",
            color: "#166534",
            padding: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 950,
          }}
        >
          <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Smallest to largest
          </span>
          {ordered.map((value, index) => (
            <React.Fragment key={`decimal-order-${value}-${index}`}>
              <span style={{ border: "1px solid #86efac", borderRadius: 12, background: "#ffffff", padding: "8px 10px" }}>
                {value}
              </span>
              {index < ordered.length - 1 ? <span aria-hidden="true">&lt;</span> : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function getFractionValue(fraction: { numerator: number; denominator: number }) {
  return fraction.denominator ? fraction.numerator / fraction.denominator : 0;
}

function FractionNotationCard({
  value,
  selected = false,
  label = "Fraction",
}: {
  value: string;
  selected?: boolean;
  label?: string;
}) {
  const fraction = parseFractionNotation(value);
  if (!fraction) return null;

  return (
    <div
      aria-label={`${label} ${fraction.numerator} over ${fraction.denominator}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
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
      <FractionShapeVisual
        denominator={fraction.denominator}
        numerator={fraction.numerator}
        label={value}
        selected={selected}
      />
      <div style={{ color: "#475569", fontSize: 12, fontWeight: 850, textAlign: "center" }}>
        {fractionWords(fraction.numerator, fraction.denominator)}
      </div>
    </div>
  );
}

function EquivalentFractionPanel({ left, right }: { left: string; right: string }) {
  const leftFraction = parseFractionNotation(left) ?? { numerator: 1, denominator: 2 };
  const rightFraction = parseFractionNotation(right) ?? { numerator: 2, denominator: 4 };
  const symbol =
    getFractionValue(leftFraction) > getFractionValue(rightFraction)
      ? ">"
      : getFractionValue(leftFraction) < getFractionValue(rightFraction)
        ? "<"
        : "=";
  const ordered = [left, right].sort((a, b) => {
    const fractionA = parseFractionNotation(a);
    const fractionB = parseFractionNotation(b);
    if (!fractionA || !fractionB) return 0;
    return getFractionValue(fractionA) - getFractionValue(fractionB);
  });

  return (
    <div
      aria-label={`Compare fractions ${left} and ${right}`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(130px, 1fr) auto minmax(130px, 1fr)",
          gap: 10,
          alignItems: "center",
        }}
      >
        <FractionNotationCard value={left} label="First fraction" />
        <span
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 999,
            background: "#f5f3ff",
            color: "#6d28d9",
            minWidth: 52,
            minHeight: 52,
            display: "grid",
            placeItems: "center",
            fontSize: 28,
            fontWeight: 950,
          }}
        >
          {symbol}
        </span>
        <FractionNotationCard value={right} label="Equivalent fraction" />
      </div>
      <div
        aria-label={`Fraction ordering strip ${ordered.join(", ")}`}
        style={{
          border: "1px solid #bbf7d0",
          borderRadius: 16,
          background: "#f0fdf4",
          color: "#166534",
          padding: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          alignItems: "center",
          fontWeight: 950,
        }}
      >
        <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Smallest to largest
        </span>
        {ordered.map((value, index) => (
          <React.Fragment key={`fraction-order-${value}-${index}`}>
            <span
              style={{
                border: "1px solid #86efac",
                borderRadius: 12,
                background: "#ffffff",
                padding: "8px 10px",
              }}
            >
              {value}
            </span>
            {index < ordered.length - 1 ? <span aria-hidden="true">&lt;</span> : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function greatestCommonDivisor(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function leastCommonMultiple(a: number, b: number): number {
  return Math.abs(a * b) / greatestCommonDivisor(a, b);
}

function parseFractionEquation(expression: string) {
  const match = safe(expression).match(/(\d+\/\d+)\s*([+-])\s*(\d+\/\d+)/);
  if (!match) return null;

  const left = parseFractionNotation(match[1]);
  const right = parseFractionNotation(match[3]);
  if (!left || !right) return null;

  return {
    leftText: match[1],
    operator: match[2],
    rightText: match[3],
    left,
    right,
  };
}

function FractionEquationPanel({ equation, answer }: { equation: string; answer: string }) {
  const parsed = parseFractionEquation(equation);
  const answerFraction = parseFractionNotation(answer);
  if (!parsed || !answerFraction) return null;

  const commonDenominator = leastCommonMultiple(
    parsed.left.denominator,
    parsed.right.denominator,
  );
  const sameDenominator = parsed.left.denominator === parsed.right.denominator;
  const operation = parsed.operator === "+" ? "Add" : "Subtract";
  const operationLabel = parsed.operator === "+" ? "addition" : "subtraction";

  return (
    <div
      aria-label={`${operation} fractions ${parsed.leftText} ${parsed.operator} ${parsed.rightText} equals ${answer}`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(120px, 1fr) auto minmax(120px, 1fr) auto minmax(120px, 1fr)",
          gap: 8,
          alignItems: "center",
        }}
      >
        <FractionNotationCard value={parsed.leftText} label="First fraction" />
        <span
          aria-hidden="true"
          style={{
            border: "1px solid #fed7aa",
            borderRadius: 999,
            background: "#fff7ed",
            color: "#9a3412",
            minWidth: 46,
            minHeight: 46,
            display: "grid",
            placeItems: "center",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          {parsed.operator}
        </span>
        <FractionNotationCard value={parsed.rightText} label="Second fraction" />
        <span
          aria-hidden="true"
          style={{
            color: "#1e3a8a",
            fontSize: 28,
            fontWeight: 950,
            textAlign: "center",
          }}
        >
          =
        </span>
        <FractionNotationCard value={answer} label="Answer fraction" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
        }}
      >
        <div
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 16,
            background: "#f0fdf4",
            color: "#166534",
            padding: 11,
            fontSize: 13,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          <strong>{operation} matching parts.</strong>
          <br />
          {sameDenominator
            ? `Both fractions use ${parsed.left.denominator} equal parts.`
            : `Rename to related parts with denominator ${commonDenominator}.`}
        </div>
        <div
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 16,
            background: "#f5f3ff",
            color: "#6d28d9",
            padding: 11,
            fontSize: 13,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          <strong>Write the answer clearly.</strong>
          <br />
          Use the answer choice that matches the fraction {operationLabel} equation.
        </div>
      </div>
    </div>
  );
}

function getStep37Operation(
  first: number,
  second: number,
  answer: number,
  prompt: string,
) {
  const normalizedPrompt = safe(prompt).toLowerCase();
  if (normalizedPrompt.includes(" x ") || normalizedPrompt.includes("multiply")) {
    return "multiply";
  }
  if (normalizedPrompt.includes("divide") || normalizedPrompt.includes("/")) {
    return "divide";
  }
  if (first * second === answer) return "multiply";
  if (second !== 0 && first / second === answer) return "divide";
  return answer > first ? "multiply" : "divide";
}

function StrategyNumberCard({ value, label }: { value: number; label: string }) {
  return (
    <div
      aria-label={`${label} ${value}`}
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 16,
        background: "#eff6ff",
        color: "#1e3a8a",
        padding: 12,
        display: "grid",
        gap: 5,
        textAlign: "center",
        minHeight: 92,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ fontSize: 30, fontWeight: 950, lineHeight: 1 }}>{value.toLocaleString()}</span>
    </div>
  );
}

function EfficientStrategyPanel({
  first,
  second,
  answer,
  prompt,
}: {
  first: number;
  second: number;
  answer: number;
  prompt: string;
}) {
  const operation = getStep37Operation(first, second, answer, prompt);
  const isMultiply = operation === "multiply";
  const symbol = isMultiply ? "x" : "/";
  const tens = Math.floor(first / 10) * 10;
  const ones = first - tens;
  const multiplicationHelper =
    ones > 0
      ? `Break apart ${first} into ${tens} and ${ones}.`
      : `Use place value and known facts for ${first}.`;
  const divisionHelper =
    second > 0
      ? `Partition ${first} into parts that divide by ${second}.`
      : `Use grouping to divide the total.`;

  return (
    <div
      aria-label={`${isMultiply ? "Multiplication" : "Division"} strategy card for ${first} ${symbol} ${second}`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(110px, 1fr) auto minmax(110px, 1fr) auto minmax(110px, 1fr)",
          gap: 8,
          alignItems: "center",
        }}
      >
        <StrategyNumberCard value={first} label={isMultiply ? "Factor" : "Total"} />
        <span
          aria-hidden="true"
          style={{
            border: "1px solid #fed7aa",
            borderRadius: 999,
            background: "#fff7ed",
            color: "#9a3412",
            minWidth: 46,
            minHeight: 46,
            display: "grid",
            placeItems: "center",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          {symbol}
        </span>
        <StrategyNumberCard value={second} label={isMultiply ? "Factor" : "Group size"} />
        <span
          aria-hidden="true"
          style={{
            color: "#1e3a8a",
            fontSize: 28,
            fontWeight: 950,
            textAlign: "center",
          }}
        >
          =
        </span>
        <div
          aria-label="Answer box"
          style={{
            border: "2px dashed #93c5fd",
            borderRadius: 16,
            background: "#f8fbff",
            color: "#1e3a8a",
            padding: 12,
            display: "grid",
            placeItems: "center",
            minHeight: 92,
            fontSize: 18,
            fontWeight: 950,
            textAlign: "center",
          }}
        >
          choose answer
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 10,
        }}
      >
        {(isMultiply
          ? [
              ["Break apart", multiplicationHelper],
              ["Known facts", `Use facts for ${second}, then adjust if needed.`],
              ["Place value", `Multiply each place-value part by ${second}.`],
            ]
          : [
              ["Partition", divisionHelper],
              ["Known facts", `Use multiplication facts for ${second}.`],
              ["Grouping", `Think how many groups of ${second} fit into ${first}.`],
            ]
        ).map(([label, text]) => (
          <div
            key={`${label}-${text}`}
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: 16,
              background: "#f0fdf4",
              color: "#166534",
              padding: 11,
              fontSize: 13,
              fontWeight: 850,
              lineHeight: 1.45,
            }}
          >
            <strong>{label}</strong>
            <br />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

function parseRemainderAnswer(value: string) {
  const match = safe(value).match(/(\d+)\s*(?:remainder|R)\s*(\d+)/i);
  if (!match) return null;
  return {
    quotient: Number(match[1]),
    remainder: Number(match[2]),
  };
}

function RemainderBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      aria-label={`${label} ${value}`}
      style={{
        border: "2px dashed #93c5fd",
        borderRadius: 16,
        background: "#f8fbff",
        color: "#1e3a8a",
        padding: 12,
        minHeight: 88,
        display: "grid",
        placeItems: "center",
        gap: 5,
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ fontSize: 24, fontWeight: 950, lineHeight: 1 }}>{value}</span>
    </div>
  );
}

function GroupsAndLeftoversVisual({ total, groupSize }: { total: number; groupSize: number }) {
  const quotient = groupSize > 0 ? Math.floor(total / groupSize) : 0;
  const remainder = groupSize > 0 ? total % groupSize : 0;
  const groupsToShow = Math.min(quotient, 6);

  return (
    <div
      aria-label={`${total} items grouped in groups of ${groupSize}, with ${remainder} left over`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 16,
        background: "#ffffff",
        padding: 10,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(86px, 1fr))",
          gap: 8,
        }}
      >
        {Array.from({ length: groupsToShow }, (_, groupIndex) => (
          <div
            key={`remainder-group-${groupIndex}`}
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: 999,
              background: "#f0fdf4",
              minHeight: 72,
              padding: 8,
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              alignContent: "center",
              justifyContent: "center",
            }}
          >
            {Array.from({ length: Math.min(groupSize, 10) }, (_, dotIndex) => (
              <span
                key={`remainder-dot-${groupIndex}-${dotIndex}`}
                aria-hidden="true"
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: "#22c55e",
                  border: "1px solid #16a34a",
                }}
              />
            ))}
          </div>
        ))}
        {quotient > groupsToShow ? (
          <div
            style={{
              border: "1px solid #bfdbfe",
              borderRadius: 16,
              background: "#eff6ff",
              color: "#1e3a8a",
              minHeight: 72,
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              textAlign: "center",
              padding: 8,
            }}
          >
            + {quotient - groupsToShow} more full groups
          </div>
        ) : null}
      </div>

      <div
        style={{
          border: "1px solid #fed7aa",
          borderRadius: 16,
          background: "#fff7ed",
          color: "#9a3412",
          padding: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontWeight: 900,
        }}
      >
        <span>Left over</span>
        {Array.from({ length: Math.min(remainder, 12) }, (_, index) => (
          <span
            key={`remainder-leftover-${index}`}
            aria-hidden="true"
            style={{
              width: 11,
              height: 11,
              borderRadius: 999,
              background: "#f97316",
              border: "1px solid #ea580c",
            }}
          />
        ))}
        <span>{remainder}</span>
      </div>
    </div>
  );
}

function DivisionRemainderPanel({ total, groupSize }: { total: number; groupSize: number }) {
  return (
    <div
      aria-label={`Division sentence ${total} divided by ${groupSize} equals quotient remainder`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(90px, 1fr) auto minmax(90px, 1fr) auto minmax(90px, 1fr) minmax(90px, 1fr)",
          gap: 8,
          alignItems: "center",
        }}
      >
        <StrategyNumberCard value={total} label="Total" />
        <span aria-hidden="true" style={{ color: "#1e3a8a", fontSize: 28, fontWeight: 950 }}>
          /
        </span>
        <StrategyNumberCard value={groupSize} label="Group size" />
        <span aria-hidden="true" style={{ color: "#1e3a8a", fontSize: 28, fontWeight: 950 }}>
          =
        </span>
        <RemainderBox label="Quotient" value="__" />
        <RemainderBox label="Remainder" value="R __" />
      </div>

      <GroupsAndLeftoversVisual total={total} groupSize={groupSize} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
        }}
      >
        {[
          ["Full groups", "The quotient tells how many complete groups are made."],
          ["Remainder", "The remainder tells what is left over or needs a context decision."],
          ["Context", "Decide whether leftovers stay out, need another group, or form a partial group."],
        ].map(([label, text]) => (
          <div
            key={`remainder-meaning-${label}`}
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: 16,
              background: "#f0fdf4",
              color: "#166534",
              padding: 11,
              fontSize: 13,
              fontWeight: 850,
              lineHeight: 1.45,
            }}
          >
            <strong>{label}</strong>
            <br />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

function parseFractionDecimalPercentSet(value: string) {
  const parts = safe(value)
    .split(",")
    .map((part) => safe(part));
  const fraction = parts.find((part) => Boolean(parseFractionNotation(part))) ?? "";
  const decimal = parts.find((part) => /^0?\.\d+$|^1(?:\.0+)?$/.test(part)) ?? "";
  const percent = parts.find((part) => part.endsWith("%")) ?? "";

  return {
    fraction,
    decimal,
    percent,
  };
}

function percentToShadedCount(percent: string, fallbackFraction: string) {
  const percentValue = Number(safe(percent).replace("%", ""));
  if (Number.isFinite(percentValue)) {
    return Math.max(0, Math.min(100, Math.round(percentValue)));
  }

  const fraction = parseFractionNotation(fallbackFraction);
  if (!fraction || !fraction.denominator) return 50;
  return Math.max(0, Math.min(100, Math.round((fraction.numerator / fraction.denominator) * 100)));
}

function PercentGridModel({
  percent,
  fraction,
  selected = false,
}: {
  percent: string;
  fraction: string;
  selected?: boolean;
}) {
  const shaded = percentToShadedCount(percent, fraction);

  return (
    <div
      aria-label={`${shaded} out of 100 squares shaded`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 16,
        background: "#ffffff",
        padding: 10,
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 2,
          maxWidth: 150,
          margin: "0 auto",
        }}
      >
        {Array.from({ length: 100 }, (_, index) => (
          <span
            key={`percent-grid-${index}`}
            aria-hidden="true"
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: index < shaded ? "#38bdf8" : "#e0f2fe",
              border: "1px solid #bae6fd",
            }}
          />
        ))}
      </div>
      <div style={{ color: "#0369a1", fontSize: 12, fontWeight: 900, textAlign: "center" }}>
        {shaded}/100 shaded
      </div>
    </div>
  );
}

function FdpConversionTable({
  fraction,
  decimal,
  percent,
  selected = false,
}: {
  fraction: string;
  decimal: string;
  percent: string;
  selected?: boolean;
}) {
  const rows = [
    ["Fraction", fraction],
    ["Decimal", decimal],
    ["Percentage", percent],
  ];

  return (
    <div
      aria-label={`Equivalent values ${fraction}, ${decimal}, ${percent}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        overflow: "hidden",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      {rows.map(([label, value], index) => (
        <div
          key={`fdp-row-${label}`}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(84px, 0.9fr) minmax(96px, 1.1fr)",
            borderTop: index === 0 ? "none" : "1px solid #dbeafe",
          }}
        >
          <div
            style={{
              background: index === 0 ? "#eff6ff" : index === 1 ? "#f0fdf4" : "#fff7ed",
              color: index === 0 ? "#1d4ed8" : index === 1 ? "#166534" : "#9a3412",
              padding: "9px 10px",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {label}
          </div>
          <div
            style={{
              color: "#0f172a",
              padding: "9px 10px",
              fontSize: 20,
              fontWeight: 950,
              lineHeight: 1.1,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              minHeight: 44,
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function FractionDecimalPercentPanel({
  fraction,
  decimal,
  percent,
}: {
  fraction: string;
  decimal: string;
  percent: string;
}) {
  const safeFraction = fraction || "1/2";
  const safeDecimal = decimal || "0.5";
  const safePercent = percent || "50%";

  return (
    <div
      aria-label={`Fraction decimal percentage equivalence ${safeFraction}, ${safeDecimal}, ${safePercent}`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
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
        <FractionNotationCard value={safeFraction} label="Fraction benchmark" />
        <PercentGridModel percent={safePercent} fraction={safeFraction} />
        <FdpConversionTable
          fraction={safeFraction}
          decimal={safeDecimal}
          percent={safePercent}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 10,
        }}
      >
        {[
          ["Fraction", "Shows equal parts of one whole."],
          ["Decimal", "Shows the same amount using place value."],
          ["Percentage", "Shows the amount out of 100."],
        ].map(([label, text]) => (
          <div
            key={`fdp-helper-${label}`}
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: 16,
              background: "#f0fdf4",
              color: "#166534",
              padding: 11,
              fontSize: 13,
              fontWeight: 850,
              lineHeight: 1.45,
            }}
          >
            <strong>{label}</strong>
            <br />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

function parseMoneyNumber(value: string) {
  const parsed = Number(safe(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWholeMoney(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function FinancialModelTable({
  start,
  change,
  isSpend,
}: {
  start: number;
  change: number;
  isSpend: boolean;
}) {
  const rows = [
    ["Starting amount", formatWholeMoney(start)],
    [isSpend ? "Spend" : "Change amount", `${isSpend ? "-" : "+"}${formatWholeMoney(Math.abs(change))}`],
    ["Model", isSpend ? `${formatWholeMoney(start)} - ${formatWholeMoney(Math.abs(change))}` : `${formatWholeMoney(start)} + ${formatWholeMoney(change)}`],
    ["Answer", "choose amount"],
  ];

  return (
    <div
      aria-label="Financial model table"
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      {rows.map(([label, value], index) => (
        <div
          key={`financial-row-${label}`}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(120px, 0.9fr) minmax(130px, 1.1fr)",
            borderTop: index === 0 ? "none" : "1px solid #dbeafe",
          }}
        >
          <div
            style={{
              background: index % 2 === 0 ? "#eff6ff" : "#f0fdf4",
              color: index % 2 === 0 ? "#1d4ed8" : "#166534",
              padding: "10px 12px",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {label}
          </div>
          <div
            style={{
              color: "#0f172a",
              padding: "10px 12px",
              fontSize: index === 2 ? 18 : 20,
              fontWeight: 950,
              textAlign: "center",
              display: "grid",
              placeItems: "center",
              minHeight: 48,
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function FinancialModelPanel({
  start,
  change,
  prompt,
}: {
  start: number;
  change: number;
  prompt: string;
}) {
  const isSpend = change < 0 || safe(prompt).toLowerCase().includes("spend");
  const displayChange = isSpend ? Math.abs(change) : change;
  const actionLabel = isSpend ? "subtract spending" : displayChange > 10 ? "add or compare" : "multiply or scale";

  return (
    <div
      aria-label={`Financial modelling card with ${formatWholeMoney(start)} and ${formatWholeMoney(displayChange)}`}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        <div
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 16,
            background: "#eff6ff",
            color: "#1e3a8a",
            padding: 12,
            display: "grid",
            gap: 8,
            minHeight: 118,
          }}
        >
          <strong style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Model first
          </strong>
          <span style={{ fontSize: 14, fontWeight: 850, lineHeight: 1.45 }}>
            Identify the starting amount, the change, and the operation before choosing an answer.
          </span>
        </div>
        <FinancialModelTable start={start} change={isSpend ? -displayChange : displayChange} isSpend={isSpend} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
        }}
      >
        {[
          ["Table", "Organise amounts before calculating."],
          ["Equation", `Use a model to ${actionLabel}.`],
          ["Check", "Compare the answer with the context."],
        ].map(([label, text]) => (
          <div
            key={`financial-helper-${label}`}
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: 16,
              background: "#f0fdf4",
              color: "#166534",
              padding: 11,
              fontSize: 13,
              fontWeight: 850,
              lineHeight: 1.45,
            }}
          >
            <strong>{label}</strong>
            <br />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

export function renderStep35WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const left = safe(visual.numberCards[0]) || safe(prompt.match(/\d+\/\d+/)?.[0]) || "1/2";
  const right = safe(visual.numberCards[1]) || "2/4";

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
          Compare the shaded fraction bars and look for equivalent fractions.
        </div>
        <span
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 999,
            background: "#f5f3ff",
            color: "#6d28d9",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Equivalent fractions
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <EquivalentFractionPanel left={left} right={right} />
      </div>
    </div>
  );
}

export function renderStep36WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const equation = safe(visual.numberCards[0]) || safe(prompt.match(/\d+\/\d+\s*[+-]\s*\d+\/\d+/)?.[0]) || "1/4 + 1/4";
  const answer = safe(visual.numberCards[1]) || "2/4";

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
          Align the fraction parts, then add or subtract the numerators.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Fraction equation
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <FractionEquationPanel equation={equation} answer={answer} />
      </div>
    </div>
  );
}

export function renderStep37WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const first = Number(safe(visual.numberCards[0]));
  const second = Number(safe(visual.numberCards[1]));
  const answer = Number(safe(visual.numberCards[2]));
  const safeFirst = Number.isFinite(first) && first > 0 ? first : 24;
  const safeSecond = Number.isFinite(second) && second > 0 ? second : 5;
  const safeAnswer = Number.isFinite(answer) && answer > 0 ? answer : safeFirst * safeSecond;

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
          Choose an efficient strategy: break apart, use known facts, place value, or grouping.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Efficient strategy
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <EfficientStrategyPanel
          first={safeFirst}
          second={safeSecond}
          answer={safeAnswer}
          prompt={prompt}
        />
      </div>
    </div>
  );
}

export function renderStep38WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const total = Number(visual.groupCounts[0] ?? visual.numberCards[0]);
  const groupSize = Number(visual.groupCounts[1] ?? visual.numberCards[1]);
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 25;
  const safeGroupSize = Number.isFinite(groupSize) && groupSize > 0 ? groupSize : 4;

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
          Solve the division, then decide what the remainder means in the situation.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Remainder context
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <DivisionRemainderPanel total={safeTotal} groupSize={safeGroupSize} />
      </div>
    </div>
  );
}

export function renderStep39WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const fraction = safe(visual.numberCards[0]) || "1/2";
  const decimal = safe(visual.numberCards[1]) || "0.5";
  const percent = safe(visual.numberCards[2]) || "50%";

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
          Match the fraction, decimal and percentage that show the same amount.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Equivalent values
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <FractionDecimalPercentPanel fraction={fraction} decimal={decimal} percent={percent} />
      </div>
    </div>
  );
}

export function renderStep40WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const start = parseMoneyNumber(visual.numberCards[0]) || 25;
  const change = parseMoneyNumber(visual.numberCards[1]) || 18;

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
          Build a model with a table or equation, then use it to solve the real-world problem.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Financial model
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <FinancialModelPanel start={start} change={change} prompt={prompt} />
      </div>
    </div>
  );
}

function NumberFormCard({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string;
  tone?: "blue" | "orange" | "green" | "purple";
}) {
  const colors = {
    blue: { border: "#bfdbfe", background: "#eff6ff", text: "#1e3a8a" },
    orange: { border: "#fed7aa", background: "#fff7ed", text: "#9a3412" },
    green: { border: "#bbf7d0", background: "#f0fdf4", text: "#166534" },
    purple: { border: "#ddd6fe", background: "#f5f3ff", text: "#5b21b6" },
  }[tone];

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        background: colors.background,
        color: colors.text,
        padding: 12,
        minHeight: 110,
        display: "grid",
        alignContent: "center",
        gap: 8,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}

function getStep41VisualMode(prompt: string) {
  const lower = safe(prompt).toLowerCase();
  if (lower.includes("use <") || lower.includes("__")) return "Compare mixed forms";
  if (lower.includes("sale") || lower.includes("discount") || lower.includes("gst")) {
    return "Real-world percentage problem";
  }
  if (lower.includes("scored") || lower.includes("pieces")) return "Best form for context";
  if (lower.includes("fraction")) return "Conversion panel";
  if (lower.includes("percentage") || lower.includes("percent")) return "Percentage conversion";
  return "Flexible number forms";
}

export function renderStep41WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const values = visual.numberCards.length
    ? visual.numberCards.map(safe).filter(Boolean)
    : ["0.25", "1/4", "25%"];
  const labels = values.map((_, index) => safe(visual.labels[index]) || `Form ${index + 1}`);
  const mode = getStep41VisualMode(prompt);
  const tones: Array<"blue" | "orange" | "green" | "purple"> = [
    "blue",
    "orange",
    "green",
    "purple",
  ];

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
          Switch between integers, decimals, fractions and percentages with purpose.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {mode}
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          {values.slice(0, 5).map((value, index) => (
            <NumberFormCard
              key={`${value}-${index}`}
              label={labels[index] || `Form ${index + 1}`}
              value={value}
              tone={tones[index % tones.length]}
            />
          ))}
        </div>
        <div
          style={{
            border: "1px dashed #bfdbfe",
            borderRadius: 18,
            background: "#f8fbff",
            color: "#1e3a8a",
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1.45,
          }}
        >
          Choose the form that makes the comparison, conversion or context easiest to reason
          about.
        </div>
      </div>
    </div>
  );
}

function parseSignedNumber(value: string | undefined, fallback: number) {
  const match = safe(value).replace("$", "").match(/-?\d+(?:\.\d+)?/);
  const parsed = Number(match?.[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function SignedNumberLine({
  min,
  max,
  start,
  end,
}: {
  min: number;
  max: number;
  start?: number | null;
  end?: number | null;
}) {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const span = Math.max(1, safeMax - safeMin);
  const position = (value: number) =>
    `${Math.max(0, Math.min(100, ((value - safeMin) / span) * 100))}%`;
  const zeroVisible = safeMin <= 0 && safeMax >= 0;
  const tickValues = Array.from(new Set([safeMin, -5, 0, 5, safeMax]))
    .filter((value) => value >= safeMin && value <= safeMax)
    .sort((a, b) => a - b);

  return (
    <div
      aria-label={`Number line from ${safeMin} to ${safeMax}`}
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 18,
        background: "#eff6ff",
        padding: "24px 14px 16px",
        minHeight: 150,
        display: "grid",
        alignContent: "center",
        gap: 14,
      }}
    >
      <div style={{ position: "relative", height: 64 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 30,
            height: 4,
            borderRadius: 999,
            background: "#1d4ed8",
          }}
        />
        {zeroVisible ? (
          <div
            style={{
              position: "absolute",
              left: position(0),
              top: 12,
              width: 3,
              height: 40,
              background: "#0f172a",
              borderRadius: 999,
            }}
          />
        ) : null}
        {typeof start === "number" ? (
          <div
            style={{
              position: "absolute",
              left: position(start),
              top: 5,
              transform: "translateX(-50%)",
              display: "grid",
              gap: 4,
              justifyItems: "center",
            }}
          >
            <span
              style={{
                border: "1px solid #fed7aa",
                borderRadius: 999,
                background: "#fff7ed",
                color: "#9a3412",
                padding: "3px 7px",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              start {start}
            </span>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ea580c" }} />
          </div>
        ) : null}
        {typeof end === "number" ? (
          <div
            style={{
              position: "absolute",
              left: position(end),
              top: 38,
              transform: "translateX(-50%)",
              display: "grid",
              gap: 4,
              justifyItems: "center",
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#16a34a" }} />
            <span
              style={{
                border: "1px solid #bbf7d0",
                borderRadius: 999,
                background: "#f0fdf4",
                color: "#166534",
                padding: "3px 7px",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              end {end}
            </span>
          </div>
        ) : null}
      </div>
      <div style={{ position: "relative", height: 24 }}>
        {tickValues.map((value) => (
          <span
            key={value}
            style={{
              position: "absolute",
              left: position(value),
              transform: "translateX(-50%)",
              color: value === 0 ? "#0f172a" : "#1e3a8a",
              fontSize: 12,
              fontWeight: value === 0 ? 950 : 850,
            }}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function getStep42VisualMode(prompt: string) {
  const lower = safe(prompt).toLowerCase();
  if (lower.includes("left") || lower.includes("right") || lower.includes("swims")) {
    return "Movement on a number line";
  }
  if (lower.includes("least to greatest") || lower.includes("order")) return "Ordering";
  if (lower.includes("<") || lower.includes("__")) return "Compare integers";
  if (lower.includes("temperature")) return "Temperature below zero";
  if (lower.includes("overdrawn") || lower.includes("balance")) return "Negative balance";
  if (lower.includes("halfway")) return "Halfway point";
  if (lower.includes("farther from 0")) return "Distance from zero";
  return "Negative number line";
}

export function renderStep42WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const values = visual.numberCards.map(safe).filter(Boolean);
  const numericValues = values.map((value, index) =>
    parseSignedNumber(value, index === 0 ? -10 : index === 1 ? 10 : 0),
  );
  const min = numericValues[0] ?? -10;
  const max = numericValues[1] ?? 10;
  const start = numericValues.length >= 4 ? numericValues[2] : null;
  const end = numericValues.length >= 4 ? numericValues[3] : numericValues[2] ?? null;
  const mode = getStep42VisualMode(prompt);

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
          Use zero as the centre point, then reason left, right, above and below zero.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {mode}
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <SignedNumberLine min={min} max={max} start={start} end={end} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          <NumberFormCard label="Left of zero" value="negative" tone="purple" />
          <NumberFormCard label="Centre" value="0" tone="blue" />
          <NumberFormCard label="Right of zero" value="positive" tone="green" />
        </div>
      </div>
    </div>
  );
}

function exponentDisplay(value: string) {
  return safe(value).replace(/\^2/g, "²").replace(/\^3/g, "³").replace(/\^4/g, "⁴");
}

function getStep44VisualMode(prompt: string) {
  const lower = safe(prompt).toLowerCase();
  if (lower.includes("repeated multiplication") || lower.includes("index notation")) {
    return "Index notation";
  }
  if (lower.includes("expand")) return "Expanded form";
  if (lower.includes("evaluate")) return "Evaluate powers";
  if (lower.includes("sqrt") || lower.includes("square root")) return "Square roots";
  if (lower.includes("inverse")) return "Inverse relationship";
  if (lower.includes("cube") || lower.includes("volume")) return "Cube context";
  if (lower.includes("area") || lower.includes("garden")) return "Square context";
  return "Powers and roots";
}

export function renderStep44WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const values = visual.numberCards.length
    ? visual.numberCards.map(safe).filter(Boolean)
    : ["2", "3", "2^3"];
  const labels = values.map((_, index) => safe(visual.labels[index]) || `Part ${index + 1}`);
  const mode = getStep44VisualMode(prompt);

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
          Use index notation for repeated multiplication, then connect powers and roots as
          inverse ideas.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {mode}
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {exponentDisplay(prompt)}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          {values.slice(0, 4).map((value, index) => (
            <NumberFormCard
              key={`${value}-${index}`}
              label={labels[index] || `Part ${index + 1}`}
              value={exponentDisplay(value)}
              tone={index % 3 === 0 ? "blue" : index % 3 === 1 ? "purple" : "green"}
            />
          ))}
        </div>
        <div
          style={{
            border: "1px dashed #bfdbfe",
            borderRadius: 18,
            background: "#f8fbff",
            color: "#1e3a8a",
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1.45,
            display: "grid",
            gap: 6,
          }}
        >
          <span>Base: the factor that repeats.</span>
          <span>Exponent: how many times the base repeats.</span>
          <span>Roots reverse powers for square and cube contexts.</span>
        </div>
      </div>
    </div>
  );
}

function getStep45VisualMode(prompt: string) {
  const lower = safe(prompt).toLowerCase();
  if (lower.includes("simplest form") || lower.includes("simplify")) {
    return "Ratio simplifier";
  }
  if (lower.includes("form 1:n")) return "Unit ratio";
  if (lower.includes("equivalent ratio")) return "Equivalent ratios";
  if (lower.includes("per hour") || lower.includes("per minute") || lower.includes("per kg")) {
    return "Unit rate";
  }
  if (lower.includes("scale factor") || lower.includes("enlarged")) return "Scale factor";
  if (lower.includes("recipe") || lower.includes("lemonade") || lower.includes("fruit punch")) {
    return "Recipe ratio";
  }
  if (lower.includes("apples") || lower.includes("girls") || lower.includes("boys")) {
    return "Part-to-part ratio";
  }
  return "Ratio and rates";
}

export function renderStep45WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const values = visual.numberCards.length
    ? visual.numberCards.map(safe).filter(Boolean)
    : ["6 : 9", "3", "2 : 3"];
  const labels = values.map((_, index) => safe(visual.labels[index]) || `Part ${index + 1}`);
  const mode = getStep45VisualMode(prompt);

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
          Compare quantities multiplicatively. Simplify ratios, build equivalent
          ratios, and divide to find unit rates.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {mode}
        </span>
      </div>

      <div
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
            border: "1px solid #fed7aa",
            borderRadius: 18,
            background: "#fff7ed",
            color: "#9a3412",
            padding: "11px 12px",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {prompt}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          {values.slice(0, 4).map((value, index) => (
            <NumberFormCard
              key={`${value}-${index}`}
              label={labels[index] || `Part ${index + 1}`}
              value={value}
              tone={index % 3 === 0 ? "blue" : index % 3 === 1 ? "purple" : "green"}
            />
          ))}
        </div>
        <div
          style={{
            border: "1px dashed #bfdbfe",
            borderRadius: 18,
            background: "#f8fbff",
            color: "#1e3a8a",
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1.45,
            display: "grid",
            gap: 6,
          }}
        >
          <span>Ratio: compare one quantity with another quantity.</span>
          <span>Equivalent ratios: multiply or divide both parts by the same factor.</span>
          <span>Unit rate: divide the total amount by the time or quantity.</span>
        </div>
      </div>
    </div>
  );
}

export function renderStep21WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const values = getLargeNumberValues(visual);
  const lower = prompt.toLowerCase();
  const isOrdering = lower.includes("smallest") || lower.includes("largest") || lower.includes("order");
  const isComparing =
    lower.includes("greater") ||
    lower.includes("smallest") ||
    lower.includes("largest") ||
    lower.includes("between");
  const focusValue = values[1] ?? values[0] ?? "1,000";

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
          Read the digits by place value, then compare or order the numbers.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Numbers to 1000+
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        <LargeNumberWorksheetCard value={focusValue} label="Numeral" />
        <div
          aria-label={`Number word ${largeNumberToWords(focusValue)}`}
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 18,
            background: "#f5f3ff",
            color: "#5b21b6",
            minHeight: 132,
            padding: 14,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1.25,
          }}
        >
          {largeNumberToWords(focusValue)}
        </div>
      </div>

      {isOrdering ? <LargeNumberOrderingVisual values={values} /> : null}
      {isComparing ? <LargeNumberComparisonVisual values={values} /> : null}
    </div>
  );
}

function PlaceValueBlock({
  kind,
  index,
}: {
  kind: "hundred" | "ten" | "one";
  index: number;
}) {
  if (kind === "hundred") {
    return (
      <span
        aria-hidden="true"
        style={{
          width: 58,
          height: 58,
          borderRadius: 10,
          border: "2px solid #1d4ed8",
          background:
            "linear-gradient(#dbeafe 1px, transparent 1px), linear-gradient(90deg, #dbeafe 1px, transparent 1px), #bfdbfe",
          backgroundSize: "10px 10px",
          boxShadow: "0 8px 16px rgba(15,23,42,0.10)",
        }}
      />
    );
  }

  if (kind === "ten") {
    return (
      <span
        aria-hidden="true"
        style={{
          width: 20,
          height: 68,
          borderRadius: 8,
          border: "2px solid #15803d",
          background:
            "linear-gradient(#bbf7d0 1px, transparent 1px), #86efac",
          backgroundSize: "100% 7px",
          boxShadow: "0 8px 16px rgba(15,23,42,0.10)",
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        border: "2px solid #ca8a04",
        background: index % 2 ? "#fef08a" : "#fde68a",
        boxShadow: "0 6px 12px rgba(15,23,42,0.10)",
      }}
    />
  );
}

function PlaceValueBlockGroup({
  kind,
  count,
}: {
  kind: "hundred" | "ten" | "one";
  count: number;
}) {
  const label =
    kind === "hundred"
      ? `${count} hundreds flats`
      : kind === "ten"
        ? `${count} tens rods`
        : `${count} ones cubes`;

  return (
    <div
      aria-label={label}
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 16,
        background: "#ffffff",
        padding: 10,
        display: "grid",
        gap: 8,
        alignContent: "start",
        minHeight: 136,
      }}
    >
      <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900 }}>
        {kind === "hundred" ? "Hundreds" : kind === "ten" ? "Tens" : "Ones"}: {count}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: kind === "hundred" ? 8 : 6,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Array.from({ length: Math.max(0, count) }, (_, index) => (
          <PlaceValueBlock key={`${kind}-${index}`} kind={kind} index={index} />
        ))}
        {count === 0 ? (
          <span
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 12,
              color: "#64748b",
              padding: "12px 14px",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            0
          </span>
        ) : null}
      </div>
    </div>
  );
}

function HTOChart({
  hundreds,
  tens,
  ones,
}: {
  hundreds: number;
  tens: number;
  ones: number;
}) {
  return (
    <div
      aria-label={`H T O chart showing ${hundreds} hundreds, ${tens} tens and ${ones} ones`}
      style={{
        border: "1px solid #ddd6fe",
        borderRadius: 18,
        background: "#f5f3ff",
        padding: 12,
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {[
          ["H", hundreds],
          ["T", tens],
          ["O", ones],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              border: "1px solid #c4b5fd",
              borderRadius: 14,
              background: "#ffffff",
              minHeight: 80,
              display: "grid",
              placeItems: "center",
              gap: 4,
              padding: 8,
            }}
          >
            <span style={{ color: "#6d28d9", fontSize: 12, fontWeight: 950 }}>{label}</span>
            <strong style={{ color: "#0f172a", fontSize: 30, lineHeight: 1 }}>
              {value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function parseHundredsTensOnesOption(option: string) {
  const normalized = safe(option).toLowerCase();
  const match = normalized.match(
    /(\d+)\s+hundreds?,\s*(\d+)\s+tens?\s+and\s+(\d+)\s+ones?/,
  );
  if (!match) return null;
  return {
    hundreds: Number(match[1]),
    tens: Number(match[2]),
    ones: Number(match[3]),
  };
}

function HundredsTensOnesChoiceCard({
  hundreds,
  tens,
  ones,
  selected = false,
}: {
  hundreds: number;
  tens: number;
  ones: number;
  selected?: boolean;
}) {
  const number = hundreds * 100 + tens * 10 + ones;
  return (
    <div
      aria-label={`Choose ${hundreds} hundreds, ${tens} tens and ${ones} ones`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        minHeight: 160,
        padding: 10,
        display: "grid",
        gap: 8,
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <HTOChart hundreds={hundreds} tens={tens} ones={ones} />
      <div
        style={{
          color: "#1d4ed8",
          fontSize: 12,
          fontWeight: 900,
          textAlign: "center",
        }}
      >
        {hundreds} hundreds + {tens} tens + {ones} ones = {number}
      </div>
    </div>
  );
}

export function renderStep22WorksheetPromptVisual({
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const hundreds = visual.groupCounts[0] ?? 0;
  const tens = visual.groupCounts[1] ?? 0;
  const ones = visual.groupCounts[2] ?? 0;
  const number = hundreds * 100 + tens * 10 + ones;

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
          Build the number from hundreds, tens and ones.
        </div>
        <span
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          H / T / O
        </span>
      </div>

      <div
        aria-label={`${hundreds} hundreds, ${tens} tens and ${ones} ones`}
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
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <PlaceValueBlockGroup kind="hundred" count={hundreds} />
          <PlaceValueBlockGroup kind="ten" count={tens} />
          <PlaceValueBlockGroup kind="one" count={ones} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(210px, 0.9fr) minmax(210px, 1fr)",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <HTOChart hundreds={hundreds} tens={tens} ones={ones} />
          <div
            aria-label={`Expanded form ${hundreds * 100} plus ${tens * 10} plus ${ones}`}
            style={{
              border: "1px solid #bbf7d0",
              borderRadius: 18,
              background: "#f0fdf4",
              color: "#166534",
              padding: 12,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              fontSize: 18,
              fontWeight: 900,
              lineHeight: 1.3,
            }}
          >
            {number} = {hundreds * 100} + {tens * 10} + {ones}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseHundredsAndRestOption(option: string) {
  const normalized = safe(option).toLowerCase();
  const match = normalized.match(/(\d+)\s+hundreds?\s+and\s+(\d+)/);
  if (!match) return null;
  return {
    hundreds: Number(match[1]),
    rest: Number(match[2]),
  };
}

function RegroupedPlaceValueChoiceCard({
  hundreds,
  rest,
  selected = false,
}: {
  hundreds: number;
  rest: number;
  selected?: boolean;
}) {
  const number = hundreds * 100 + rest;
  const tens = Math.floor(rest / 10);
  const ones = rest % 10;
  return (
    <div
      aria-label={`Choose ${hundreds} hundreds and ${rest}, making ${number}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        minHeight: 160,
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
          gap: 8,
          alignItems: "center",
        }}
      >
        <div
          style={{
            border: "1px solid #dbeafe",
            borderRadius: 14,
            background: "#eff6ff",
            padding: 8,
            display: "grid",
            placeItems: "center",
            gap: 4,
          }}
        >
          <strong style={{ color: "#1d4ed8", fontSize: 24 }}>{hundreds}</strong>
          <span style={{ color: "#475569", fontSize: 11, fontWeight: 850 }}>hundreds</span>
        </div>
        <span style={{ color: "#64748b", fontSize: 22, fontWeight: 950 }}>+</span>
        <div
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 14,
            background: "#f0fdf4",
            padding: 8,
            display: "grid",
            placeItems: "center",
            gap: 4,
          }}
        >
          <strong style={{ color: "#166534", fontSize: 24 }}>{rest}</strong>
          <span style={{ color: "#475569", fontSize: 11, fontWeight: 850 }}>
            {tens} tens, {ones} ones
          </span>
        </div>
      </div>
      <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900, textAlign: "center" }}>
        Same value: {number}
      </div>
    </div>
  );
}

export function renderStep23WorksheetPromptVisual({
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const hundreds = visual.groupCounts[0] ?? 0;
  const rest = visual.groupCounts[1] ?? 0;
  const standardTens = Math.floor(rest / 10);
  const standardOnes = rest % 10;
  const number = hundreds * 100 + rest;
  const regroupedHundreds = Math.max(0, hundreds - 1);
  const regroupedRest = rest + (hundreds > 0 ? 100 : 0);

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
          Partition the number, then regroup to show the same value another way.
        </div>
        <span
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: 999,
            background: "#f5f3ff",
            color: "#6d28d9",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Regrouping
        </span>
      </div>

      <div
        aria-label={`Number ${number} partitioned as ${hundreds} hundreds, ${standardTens} tens and ${standardOnes} ones, regrouped as ${regroupedHundreds} hundreds and ${regroupedRest}`}
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        <LargeNumberWorksheetCard value={String(number)} label="Number" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) auto minmax(220px, 1fr)",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900 }}>
              Standard partition
            </div>
            <HTOChart hundreds={hundreds} tens={standardTens} ones={standardOnes} />
          </div>
          <div
            aria-hidden="true"
            style={{
              display: "grid",
              placeItems: "center",
              color: "#64748b",
              fontSize: 26,
              fontWeight: 950,
            }}
          >
            =
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ color: "#6d28d9", fontSize: 12, fontWeight: 900 }}>
              Regrouped form
            </div>
            <RegroupedPlaceValueChoiceCard
              hundreds={regroupedHundreds}
              rest={regroupedRest}
            />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <PlaceValueBlockGroup kind="hundred" count={hundreds} />
          <PlaceValueBlockGroup kind="ten" count={standardTens} />
          <PlaceValueBlockGroup kind="one" count={standardOnes} />
        </div>
      </div>
    </div>
  );
}

function getStep24PlaceholderNumber(prompt: string, visual: EarlyNumberVisualModel) {
  const visualNumber = safe(visual.numberCards[0]).replace(/,/g, "");
  if (/^\d{2,4}$/.test(visualNumber)) return Number(visualNumber);

  const promptNumber = safe(prompt).replace(/,/g, "").match(/\d{2,4}/)?.[0];
  return promptNumber ? Number(promptNumber) : 0;
}

function getPlaceValueColumns(value: number) {
  const thousands = Math.floor(value / 1000);
  const hundreds = Math.floor((value % 1000) / 100);
  const tens = Math.floor((value % 100) / 10);
  const ones = value % 10;

  return value >= 1000
    ? [
        { key: "Th", label: "Thousands", digit: thousands, color: "#7c3aed" },
        { key: "H", label: "Hundreds", digit: hundreds, color: "#2563eb" },
        { key: "T", label: "Tens", digit: tens, color: "#16a34a" },
        { key: "O", label: "Ones", digit: ones, color: "#ea580c" },
      ]
    : [
        { key: "H", label: "Hundreds", digit: hundreds, color: "#2563eb" },
        { key: "T", label: "Tens", digit: tens, color: "#16a34a" },
        { key: "O", label: "Ones", digit: ones, color: "#ea580c" },
      ];
}

function ZeroPlaceholderChart({ value }: { value: number }) {
  const columns = getPlaceValueColumns(value);
  const zeroColumns = columns.filter((column) => column.digit === 0);
  const zeroLabel =
    zeroColumns.length > 0
      ? zeroColumns.map((column) => column.label.toLowerCase()).join(", ")
      : "no";

  return (
    <div
      aria-label={`Place-value chart showing ${columns
        .map((column) => `${column.digit} ${column.label.toLowerCase()}`)
        .join(", ")}. Zero holds the ${zeroLabel} place.`}
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns.length}, minmax(64px, 1fr))`,
          gap: 8,
        }}
      >
        {columns.map((column) => {
          const isZero = column.digit === 0;
          return (
            <div
              key={column.key}
              style={{
                border: `2px solid ${isZero ? "#f59e0b" : "#dbeafe"}`,
                borderRadius: 16,
                background: isZero ? "#fffbeb" : "#f8fafc",
                minHeight: 104,
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: column.color,
                  color: "#ffffff",
                  padding: "6px 4px",
                  fontSize: 12,
                  fontWeight: 950,
                  textAlign: "center",
                }}
              >
                {column.key}
              </div>
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  color: isZero ? "#b45309" : "#0f172a",
                  fontSize: 38,
                  fontWeight: 950,
                  lineHeight: 1,
                }}
              >
                {column.digit}
              </div>
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  color: isZero ? "#92400e" : "#475569",
                  padding: "5px 4px",
                  fontSize: 11,
                  fontWeight: 850,
                  textAlign: "center",
                }}
              >
                {isZero ? "holds place" : column.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ZeroPlaceholderSentence({ value }: { value: number }) {
  const columns = getPlaceValueColumns(value);
  return (
    <div
      aria-label={`Number sentence ${columns
        .map((column) => `${column.digit} ${column.label.toLowerCase()}`)
        .join(", ")} equals ${value.toLocaleString()}`}
      style={{
        border: "1px solid #bbf7d0",
        borderRadius: 18,
        background: "#f0fdf4",
        color: "#166534",
        padding: 12,
        textAlign: "center",
        fontSize: 16,
        fontWeight: 900,
        lineHeight: 1.45,
      }}
    >
      {columns.map((column) => `${column.digit} ${column.label.toLowerCase()}`).join(" + ")} ={" "}
      {value.toLocaleString()}
    </div>
  );
}

export function renderStep24WorksheetPromptVisual({
  prompt,
  visual,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const value = getStep24PlaceholderNumber(prompt, visual);

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
          Read the place-value chart and notice where zero is holding a place.
        </div>
        <span
          style={{
            border: "1px solid #fde68a",
            borderRadius: 999,
            background: "#fffbeb",
            color: "#b45309",
            padding: "7px 10px",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Zero placeholder
        </span>
      </div>

      <div
        style={{
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        <LargeNumberWorksheetCard value={value.toLocaleString()} label="Number" />
        <ZeroPlaceholderChart value={value} />
        <ZeroPlaceholderSentence value={value} />
      </div>
    </div>
  );
}

function parseStep25Equation(prompt: string) {
  const match = safe(prompt)
    .replace(/,/g, "")
    .match(/(\d{2,4})\s*([+-])\s*(\d{1,4})/);
  if (!match) return null;

  const start = Number(match[1]);
  const symbol = match[2] as "+" | "-";
  const change = Number(match[3]);
  return {
    start,
    change,
    symbol,
    answer: symbol === "+" ? start + change : start - change,
  };
}

function getHundredsTensOnes(value: number) {
  const hundreds = Math.floor((value % 1000) / 100);
  const tens = Math.floor((value % 100) / 10);
  const ones = value % 10;
  return { hundreds, tens, ones };
}

function PlaceValueCalculationBlocks({
  value,
  label,
  crossed,
}: {
  value: number;
  label: string;
  crossed?: boolean;
}) {
  const parts = getHundredsTensOnes(value);
  const blockKinds: Array<["hundred" | "ten" | "one", number]> = [
    ["hundred", parts.hundreds],
    ["ten", parts.tens],
    ["one", parts.ones],
  ];

  return (
    <div
      aria-label={`${label}: ${parts.hundreds} hundreds, ${parts.tens} tens and ${parts.ones} ones${
        crossed ? " crossed out" : ""
      }`}
      style={{
        border: `1px solid ${crossed ? "#fed7aa" : "#dbeafe"}`,
        borderRadius: 18,
        background: crossed ? "#fff7ed" : "#ffffff",
        padding: 12,
        display: "grid",
        gap: 10,
        minHeight: 180,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <strong style={{ color: crossed ? "#c2410c" : "#1d4ed8", fontSize: 13 }}>
          {label}
        </strong>
        <span
          style={{
            border: `1px solid ${crossed ? "#fed7aa" : "#bfdbfe"}`,
            borderRadius: 999,
            background: crossed ? "#ffedd5" : "#eff6ff",
            color: crossed ? "#c2410c" : "#1d4ed8",
            padding: "3px 7px",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {value}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {blockKinds.map(([kind, count]) => (
          <div
            key={kind}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              background: "#f8fafc",
              padding: 8,
              display: "grid",
              gap: 6,
              alignContent: "start",
              minHeight: 118,
              opacity: crossed ? 0.72 : 1,
            }}
          >
            <span style={{ color: "#475569", fontSize: 11, fontWeight: 900 }}>
              {kind === "hundred" ? "H" : kind === "ten" ? "T" : "O"}: {count}
            </span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                position: "relative",
              }}
            >
              {Array.from({ length: Math.max(0, count) }, (_, index) => (
                <span
                  key={`${kind}-${index}`}
                  style={{ position: "relative", display: "inline-grid", placeItems: "center" }}
                >
                  <PlaceValueBlock kind={kind} index={index} />
                  {crossed ? (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        width: kind === "hundred" ? 64 : 28,
                        height: 3,
                        borderRadius: 999,
                        background: "#dc2626",
                        transform: "rotate(-35deg)",
                      }}
                    />
                  ) : null}
                </span>
              ))}
              {count === 0 ? (
                <span
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 10,
                    color: "#64748b",
                    padding: "8px 10px",
                    fontSize: 16,
                    fontWeight: 900,
                  }}
                >
                  0
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function renderStep25WorksheetPromptVisual({
  prompt,
}: {
  prompt: string;
  visual: EarlyNumberVisualModel;
}) {
  const equation = parseStep25Equation(prompt);
  if (!equation) return null;

  const operation = equation.symbol === "+" ? "addition" : "subtraction";
  const tone =
    equation.symbol === "+"
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
          Use hundreds, tens and ones to solve the calculation.
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
          Place-value {operation}
        </span>
      </div>

      <div
        aria-label={
          equation.symbol === "+"
            ? `${equation.start} plus ${equation.change} shown with place-value blocks`
            : `${equation.start} minus ${equation.change} shown with place-value blocks crossed out`
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
            gridTemplateColumns: "minmax(220px, 1fr) auto minmax(220px, 1fr)",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          <PlaceValueCalculationBlocks value={equation.start} label="Start" />
          <div
            style={{
              color: tone.strong,
              fontSize: 34,
              fontWeight: 950,
              display: "grid",
              placeItems: "center",
            }}
          >
            {equation.symbol}
          </div>
          <PlaceValueCalculationBlocks
            value={equation.change}
            label={equation.symbol === "+" ? "Add" : "Subtract"}
            crossed={equation.symbol === "-"}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(180px, 1fr) auto minmax(120px, 0.7fr)",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          <HTOChart {...getHundredsTensOnes(equation.answer)} />
          <div
            aria-hidden="true"
            style={{
              color: "#64748b",
              fontSize: 28,
              fontWeight: 950,
              display: "grid",
              placeItems: "center",
            }}
          >
            =
          </div>
          <div
            aria-label="Answer box"
            style={{
              border: "2px solid #7c3aed",
              borderRadius: 18,
              background: "#f5f3ff",
              color: "#6d28d9",
              minHeight: 116,
              display: "grid",
              placeItems: "center",
              fontSize: 32,
              fontWeight: 950,
              boxShadow: "0 10px 22px rgba(124,58,237,0.14)",
            }}
          >
            __
          </div>
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

export function renderStep19WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,2}$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} label="Total" selected={selected} />;
}

export function renderStep20WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!normalized) return null;

  if (/^\d{1,2}$/.test(normalized)) {
    return <EarlyNumberWorksheetNumeralCard numeral={normalized} label="Choose" selected={selected} />;
  }

  const lower = normalized.toLowerCase();
  const mentionsQuarter = lower.includes("quarter") || lower.includes("1/4");
  const mentionsHalf = lower.includes("half") || lower.includes("halves") || lower.includes("1/2");
  const mentionsWhole = lower.includes("whole");
  const mentionsEqual = lower.includes("equal") || lower.includes("same amount") || lower.includes("fair");
  const mentionsUnequal =
    lower.includes("unequal") || lower.includes("different sizes") || lower.includes("not fair");

  const tone = mentionsUnequal
    ? { border: "#fed7aa", background: "#fff7ed", color: "#c2410c" }
    : mentionsQuarter
      ? { border: "#ddd6fe", background: "#f5f3ff", color: "#6d28d9" }
      : mentionsHalf || mentionsEqual
        ? { border: "#bfdbfe", background: "#eff6ff", color: "#1d4ed8" }
        : { border: "#e2e8f0", background: "#ffffff", color: "#334155" };

  return (
    <div
      aria-label={`Choose ${normalized}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : tone.border}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : tone.background,
        color: tone.color,
        minHeight: 144,
        padding: 12,
        display: "grid",
        gap: 9,
        alignItems: "center",
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      {mentionsQuarter || mentionsHalf ? (
        <FractionShapeVisual denominator={mentionsQuarter ? 4 : 2} selected={selected} />
      ) : (
        <div
          aria-hidden="true"
          style={{
            border: `1px solid ${tone.border}`,
            borderRadius: 16,
            background: "#ffffff",
            minHeight: 70,
            display: "grid",
            placeItems: "center",
            fontSize: 24,
            fontWeight: 950,
          }}
        >
          {mentionsWhole ? "1 whole" : mentionsUnequal ? "Not equal" : mentionsEqual ? "Equal" : "Choice"}
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 950, lineHeight: 1.2 }}>{normalized}</div>
    </div>
  );
}

export function renderStep21WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,3}(?:,\d{3})*$|^\d+$/.test(normalized)) return null;

  return <LargeNumberWorksheetCard value={normalized} label="Choose" selected={selected} />;
}

export function renderStep22WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const representation = parseHundredsTensOnesOption(option);
  if (!representation) return null;

  return (
    <HundredsTensOnesChoiceCard
      hundreds={representation.hundreds}
      tens={representation.tens}
      ones={representation.ones}
      selected={selected}
    />
  );
}

export function renderStep23WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const representation = parseHundredsAndRestOption(option);
  if (!representation) return null;

  return (
    <RegroupedPlaceValueChoiceCard
      hundreds={representation.hundreds}
      rest={representation.rest}
      selected={selected}
    />
  );
}

export function renderStep24WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!normalized) return null;

  const lower = normalized.toLowerCase();
  const isPlaceholder = lower.includes("holds") || lower.includes("place");
  const isWholeZero = lower.includes("always") || lower.includes("number is 0");
  const isIgnored = lower.includes("ignored");
  if (!isPlaceholder && !isWholeZero && !isIgnored) return null;

  const tone = isPlaceholder
    ? { border: "#bbf7d0", background: "#f0fdf4", color: "#166534", label: "Zero holds the place" }
    : isWholeZero
      ? {
          border: "#fed7aa",
          background: "#fff7ed",
          color: "#c2410c",
          label: "The whole number is not zero",
        }
      : {
          border: "#fde68a",
          background: "#fffbeb",
          color: "#b45309",
          label: "Zero cannot be ignored",
        };

  return (
    <div
      aria-label={`Choose ${normalized}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : tone.border}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : tone.background,
        color: tone.color,
        minHeight: 138,
        padding: 12,
        display: "grid",
        placeItems: "center",
        gap: 8,
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <strong style={{ fontSize: 18, fontWeight: 950, lineHeight: 1.2 }}>
        {normalized}
      </strong>
      <span style={{ color: tone.color, fontSize: 12, fontWeight: 850, lineHeight: 1.25 }}>
        {tone.label}
      </span>
    </div>
  );
}

export function renderStep25WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,4}$/.test(normalized)) return null;

  return <LargeNumberWorksheetCard value={normalized} label="Answer" selected={selected} />;
}

export function renderStep26WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,3}$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} label="Product" selected={selected} />;
}

export function renderStep27WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,3}$/.test(normalized)) return null;

  return <EarlyNumberWorksheetNumeralCard numeral={normalized} label="Total" selected={selected} />;
}

export function renderStep28WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,4}$/.test(normalized)) return null;

  return <LargeNumberWorksheetCard value={normalized} label="Estimate" selected={selected} />;
}

export function renderStep29WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  const fraction = parseFractionNotation(normalized);
  if (!fraction) return null;

  return (
    <div
      aria-label={`Choose ${fractionWords(fraction.numerator, fraction.denominator)}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        minHeight: 158,
        padding: 10,
        display: "grid",
        gap: 8,
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <FractionShapeVisual
        denominator={fraction.denominator}
        numerator={fraction.numerator}
        label={normalized}
        selected={selected}
      />
      <div
        style={{
          color: "#475569",
          fontSize: 12,
          fontWeight: 850,
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        {fractionWords(fraction.numerator, fraction.denominator)}
      </div>
    </div>
  );
}

export function renderStep30WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const amount = parseMoneyAmount(option);
  if (amount === null) return null;

  return (
    <div
      aria-label={`Choose ${formatMoneyAmount(amount)}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bbf7d0"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#f0fdf4",
        color: "#166534",
        minHeight: 148,
        padding: 12,
        display: "grid",
        gap: 9,
        placeItems: "center",
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <MoneyToken amount={amount} />
      <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Money answer
      </div>
    </div>
  );
}

export function renderStep31WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,7}(?:,\d{3})*$|^\d+$/.test(normalized)) return null;

  return <LargeNumberWorksheetCard value={normalized} label="Standard form" selected={selected} />;
}

export function renderStep32WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d{1,7}(?:,\d{3})*$|^\d+$/.test(normalized)) return null;

  return <LargeNumberWorksheetCard value={normalized} label="Estimate" selected={selected} />;
}

export function renderStep33WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;

  return <DecimalNumberCard value={normalized} label="Choose decimal" selected={selected} />;
}

export function renderStep34WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    return <DecimalNumberCard value={normalized} label="Greater decimal" selected={selected} />;
  }

  if (normalized.toLowerCase().includes("equal")) {
    return (
      <div
        aria-label="Choose they are equal"
        style={{
          border: `2px solid ${selected ? "#2563eb" : "#ddd6fe"}`,
          borderRadius: 18,
          background: selected ? "#eff6ff" : "#f5f3ff",
          color: "#6d28d9",
          minHeight: 132,
          padding: 12,
          display: "grid",
          placeItems: "center",
          gap: 8,
          textAlign: "center",
          boxShadow: selected
            ? "0 10px 22px rgba(37,99,235,0.18)"
            : "0 8px 18px rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>=</div>
        <div style={{ fontSize: 16, fontWeight: 950 }}>{normalized}</div>
        <div style={{ fontSize: 12, fontWeight: 850 }}>Equivalent decimals</div>
      </div>
    );
  }

  return null;
}

export function renderStep35WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!parseFractionNotation(normalized)) return null;

  return <FractionNotationCard value={normalized} label="Choose fraction" selected={selected} />;
}

export function renderStep36WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!parseFractionNotation(normalized)) return null;

  return <FractionNotationCard value={normalized} label="Choose answer fraction" selected={selected} />;
}

export function renderStep37WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  const value = Number(normalized.replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;

  return (
    <div
      aria-label={`Choose ${normalized}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        color: "#1e3a8a",
        minHeight: 132,
        padding: 12,
        display: "grid",
        placeItems: "center",
        gap: 8,
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 950, lineHeight: 1 }}>
        {value.toLocaleString()}
      </div>
      <div
        style={{
          border: "1px solid #bbf7d0",
          borderRadius: 999,
          background: "#f0fdf4",
          color: "#166534",
          padding: "5px 8px",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        Answer choice
      </div>
    </div>
  );
}

export function renderStep38WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  const parsed = parseRemainderAnswer(normalized);
  if (!parsed) return null;

  return (
    <div
      aria-label={`Choose ${parsed.quotient} remainder ${parsed.remainder}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        color: "#1e3a8a",
        minHeight: 132,
        padding: 12,
        display: "grid",
        gap: 10,
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <RemainderBox label="Quotient" value={String(parsed.quotient)} />
        <RemainderBox label="Remainder" value={`R ${parsed.remainder}`} />
      </div>
      <div
        style={{
          border: "1px solid #fed7aa",
          borderRadius: 999,
          background: "#fff7ed",
          color: "#9a3412",
          padding: "5px 8px",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {parsed.remainder} left over
      </div>
    </div>
  );
}

export function renderStep39WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  const parsed = parseFractionDecimalPercentSet(normalized);
  if (!parsed.fraction || !parsed.decimal || !parsed.percent) return null;

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        minHeight: 150,
      }}
    >
      <FdpConversionTable
        fraction={parsed.fraction}
        decimal={parsed.decimal}
        percent={parsed.percent}
        selected={selected}
      />
      <div
        style={{
          border: "1px solid #bae6fd",
          borderRadius: 999,
          background: "#f0f9ff",
          color: "#0369a1",
          padding: "5px 8px",
          fontSize: 12,
          fontWeight: 900,
          textAlign: "center",
        }}
      >
        Fraction - decimal - percentage
      </div>
    </div>
  );
}

export function renderStep40WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  const amount = parseMoneyNumber(normalized);
  if (!normalized.startsWith("$") || !Number.isFinite(amount)) return null;

  return (
    <div
      aria-label={`Choose ${normalized}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        color: "#1e3a8a",
        minHeight: 132,
        padding: 12,
        display: "grid",
        placeItems: "center",
        gap: 8,
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 950, lineHeight: 1 }}>
        {formatWholeMoney(amount)}
      </div>
      <div
        style={{
          border: "1px solid #bbf7d0",
          borderRadius: 999,
          background: "#f0fdf4",
          color: "#166534",
          padding: "5px 8px",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        Model result
      </div>
    </div>
  );
}

export function renderStep41WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!normalized) return null;

  const isSymbol = ["<", ">", "="].includes(normalized);
  const label = normalized.includes("%")
    ? "Percentage"
    : normalized.includes("/")
      ? "Fraction"
      : normalized.startsWith("$")
        ? "Money"
        : isSymbol
          ? "Compare"
          : normalized.includes(".")
            ? "Decimal"
            : "Number form";

  return (
    <div
      aria-label={`Choose ${normalized}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        color: "#1e3a8a",
        minHeight: 132,
        padding: 12,
        display: "grid",
        placeItems: "center",
        gap: 8,
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ fontSize: isSymbol ? 42 : 30, fontWeight: 950, lineHeight: 1 }}>
        {normalized}
      </div>
      <div
        style={{
          border: "1px solid #bae6fd",
          borderRadius: 999,
          background: "#f0f9ff",
          color: "#0369a1",
          padding: "5px 8px",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function renderStep42WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!normalized) return null;

  const isSymbol = ["<", ">", "="].includes(normalized);
  const isOrdering = normalized.includes(",");
  const isMoney = normalized.includes("$");
  const label = isSymbol
    ? "Compare"
    : isOrdering
      ? "Order"
      : isMoney
        ? "Balance"
        : normalized.startsWith("-")
          ? "Negative"
          : normalized === "0" || normalized.includes("same distance")
            ? "Zero or equal distance"
            : "Positive";

  return (
    <div
      aria-label={`Choose ${normalized}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        color: "#1e3a8a",
        minHeight: 132,
        padding: 12,
        display: "grid",
        placeItems: "center",
        gap: 8,
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ fontSize: isSymbol ? 42 : isOrdering ? 20 : 30, fontWeight: 950, lineHeight: 1.15 }}>
        {normalized}
      </div>
      <div
        style={{
          border: "1px solid #bae6fd",
          borderRadius: 999,
          background: "#f0f9ff",
          color: "#0369a1",
          padding: "5px 8px",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function renderStep44WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!normalized) return null;

  const label = normalized.includes("^")
    ? "Index notation"
    : normalized.includes("sqrt")
      ? "Root"
      : normalized.includes(" x ")
        ? "Expanded form"
        : normalized.includes("m") || normalized.includes("cm")
          ? "Context answer"
          : "Value";

  return (
    <div
      aria-label={`Choose ${normalized}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        color: "#1e3a8a",
        minHeight: 132,
        padding: 12,
        display: "grid",
        placeItems: "center",
        gap: 8,
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1.15 }}>
        {exponentDisplay(normalized)}
      </div>
      <div
        style={{
          border: "1px solid #bae6fd",
          borderRadius: 999,
          background: "#f0f9ff",
          color: "#0369a1",
          padding: "5px 8px",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function renderStep45WorksheetOptionCard({
  option,
  selected = false,
}: {
  option: string;
  selected?: boolean;
}) {
  const normalized = safe(option);
  if (!normalized) return null;

  const lower = normalized.toLowerCase();
  const label = normalized.includes(":")
    ? "Ratio"
    : lower.includes("km/h") || lower.includes("l/min") || lower.includes("per kg")
      ? "Unit rate"
      : lower.includes("cups") || lower.includes("cm") || lower.includes("l")
        ? "Context answer"
        : normalized.startsWith("$")
          ? "Unit price"
          : "Value";

  return (
    <div
      aria-label={`Choose ${normalized}`}
      style={{
        border: `2px solid ${selected ? "#2563eb" : "#bfdbfe"}`,
        borderRadius: 18,
        background: selected ? "#eff6ff" : "#ffffff",
        color: "#1e3a8a",
        minHeight: 132,
        padding: 12,
        display: "grid",
        placeItems: "center",
        gap: 8,
        textAlign: "center",
        boxShadow: selected
          ? "0 10px 22px rgba(37,99,235,0.18)"
          : "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ fontSize: normalized.length > 28 ? 18 : 30, fontWeight: 950, lineHeight: 1.15 }}>
        {normalized}
      </div>
      <div
        style={{
          border: "1px solid #bae6fd",
          borderRadius: 999,
          background: "#f0f9ff",
          color: "#0369a1",
          padding: "5px 8px",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {label}
      </div>
    </div>
  );
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
