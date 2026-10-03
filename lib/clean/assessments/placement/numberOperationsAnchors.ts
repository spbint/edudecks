export type AnchorItemStatus =
  | "reuse-candidate"
  | "reuse-audited"
  | "new-blueprint"
  | "implemented-draft"
  | "implemented-draft-accessibility-review"
  | "new-hybrid-blueprint"
  | "new-blueprint-currency-review";

export type AnchorItemSlot = {
  slot: "A" | "B" | "C";
  blueprintId: string;
  construct: string;
  responseType: string;
  trustedVisual: string;
  status: AnchorItemStatus;
  existingItemId?: string;
};

export type NumberOperationsAnchor = {
  progressionId: string;
  pLevel: number;
  role: "lower" | "initial" | "upper";
  sourcePages: number[];
  slots: [AnchorItemSlot, AnchorItemSlot];
  reserveSlot?: AnchorItemSlot;
};

export type NumberOperationsAnchorSet = {
  key:
    | "number-place-value"
    | "counting-processes"
    | "additive-strategies"
    | "multiplicative-strategies"
    | "understanding-money";
  label: string;
  lowerP: number;
  initialP: number;
  upperP: number;
  anchors: [NumberOperationsAnchor, NumberOperationsAnchor, NumberOperationsAnchor];
};

const slot = (
  blueprintId: string,
  slotName: "A" | "B" | "C",
  construct: string,
  responseType: string,
  trustedVisual: string,
  status: AnchorItemStatus,
  existingItemId?: string,
): AnchorItemSlot => ({
  blueprintId,
  slot: slotName,
  construct,
  responseType,
  trustedVisual,
  status,
  ...(existingItemId ? { existingItemId } : {}),
});

export const NUMBER_OPERATIONS_ANCHOR_SETS: NumberOperationsAnchorSet[] = [
  {
    key: "number-place-value",
    label: "Number and place value",
    lowerP: 3,
    initialP: 6,
    upperP: 9,
    anchors: [
      {
        progressionId: "MYL-MATH-PROG-NSA-NPV-P03",
        pLevel: 3,
        role: "lower",
        sourcePages: [2, 3],
        slots: [
          slot("MYL-ANCHOR-NPV-P03-A", "A", "Recognise and interpret a teen numeral.", "single_choice", "numeral cards", "implemented-draft"),
          slot("MYL-ANCHOR-NPV-P03-B", "B", "Represent a teen number as one ten and some more.", "single_choice or numeric_entry", "place-value blocks", "implemented-draft"),
        ],
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-NPV-P06",
        pLevel: 6,
        role: "initial",
        sourcePages: [3, 4],
        slots: [
          slot(
            "MYL-ANCHOR-NPV-P06-A",
            "A",
            "Flexibly rename a four-digit number using equivalent place-value units.",
            "multi_select",
            "place-value table / exchange model",
            "reuse-audited",
            "place-value-ops-flexible-renaming-003",
          ),
          slot(
            "MYL-ANCHOR-NPV-P06-B",
            "B",
            "Round a natural number to the nearest hundred.",
            "numeric_entry",
            "number line optional",
            "reuse-audited",
            "place-value-ops-rounding-gap-006",
          ),
        ],
        reserveSlot: slot(
          "MYL-ANCHOR-NPV-P06-C",
          "C",
          "Represent tenths using decimal notation.",
          "numeric_entry",
          "text-first / decimal place-value support optional",
          "implemented-draft",
        ),
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-NPV-P09",
        pLevel: 9,
        role: "upper",
        sourcePages: [3, 4],
        slots: [
          slot(
            "MYL-ANCHOR-NPV-P09-A",
            "A",
            "Order negative and positive values using number-line magnitude.",
            "ordering",
            "number line",
            "reuse-audited",
            "integers-coordinates-properties-order-integers-001",
          ),
          slot(
            "MYL-ANCHOR-NPV-P09-B",
            "B",
            "Round a decimal to a specified number of decimal places.",
            "numeric_entry",
            "place-value table optional",
            "reuse-audited",
            "approx-round-decimal-001",
          ),
        ],
      },
    ],
  },
  {
    key: "counting-processes",
    label: "Counting processes",
    lowerP: 2,
    initialP: 5,
    upperP: 7,
    anchors: [
      {
        progressionId: "MYL-MATH-PROG-NSA-CNT-P02",
        pLevel: 2,
        role: "lower",
        sourcePages: [5],
        slots: [
          slot("MYL-ANCHOR-CNT-P02-A", "A", "Subitise a small collection up to about five.", "single_choice", "controlled dot set", "new-hybrid-blueprint"),
          slot("MYL-ANCHOR-CNT-P02-B", "B", "Count a very small visible collection accurately.", "single_choice", "counter tokens", "new-hybrid-blueprint"),
        ],
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-CNT-P05",
        pLevel: 5,
        role: "initial",
        sourcePages: [5],
        slots: [
          slot("MYL-ANCHOR-CNT-P05-A", "A", "Find the next or previous number from an arbitrary point within 1–100.", "numeric_entry", "text-first", "implemented-draft"),
          slot("MYL-ANCHOR-CNT-P05-B", "B", "Match a numeral to a collection up to 20 from a deterministic visual collection.", "numeric_entry", "array renderer for v0; varied arrangements required in later boundary pool", "implemented-draft-accessibility-review"),
        ],
        reserveSlot: slot(
          "MYL-ANCHOR-CNT-P05-C",
          "C",
          "Use zero to denote that no objects are present.",
          "single_choice",
          "text-first",
          "implemented-draft",
        ),
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-CNT-P07",
        pLevel: 7,
        role: "upper",
        sourcePages: [5],
        slots: [
          slot("MYL-ANCHOR-CNT-P07-A", "A", "Continue a skip-count sequence by fives off the decade.", "numeric_entry", "text-first / number line optional", "implemented-draft"),
          slot("MYL-ANCHOR-CNT-P07-B", "B", "Count a larger quantity in groups and add the residual.", "numeric_entry", "grouped tens and ones representation", "implemented-draft"),
        ],
      },
    ],
  },
  {
    key: "additive-strategies",
    label: "Additive strategies",
    lowerP: 3,
    initialP: 6,
    upperP: 9,
    anchors: [
      {
        progressionId: "MYL-MATH-PROG-NSA-ADD-P03",
        pLevel: 3,
        role: "lower",
        sourcePages: [6],
        slots: [
          slot("MYL-ANCHOR-ADD-P03-A", "A", "Solve an additive situation after two small quantities are concealed.", "numeric_entry", "concealed counter groups", "new-hybrid-blueprint"),
          slot("MYL-ANCHOR-ADD-P03-B", "B", "Capture supporting process evidence for a concealed-quantity task.", "strategy_capture + numeric_entry", "concealed counter groups", "new-hybrid-blueprint"),
        ],
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-ADD-P06",
        pLevel: 6,
        role: "initial",
        sourcePages: [6],
        slots: [
          slot("MYL-ANCHOR-ADD-P06-A", "A", "Use a flexible strategy such as bridging to 10 within 20.", "single_choice", "text-first / part-part-whole optional", "implemented-draft"),
          slot("MYL-ANCHOR-ADD-P06-B", "B", "Use part-part-whole knowledge to solve a missing-addend problem.", "numeric_entry", "part-part-whole model optional", "implemented-draft"),
        ],
        reserveSlot: slot(
          "MYL-ANCHOR-ADD-P06-C",
          "C",
          "Interpret subtraction as a difference between two numbers.",
          "single_choice",
          "number line optional",
          "implemented-draft",
        ),
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-ADD-P09",
        pLevel: 9,
        role: "upper",
        sourcePages: [6],
        slots: [
          slot(
            "MYL-ANCHOR-ADD-P09-A",
            "A",
            "Add fractions with related denominators and use a common denominator.",
            "fraction_entry",
            "fraction bar optional",
            "reuse-audited",
            "rational-ops-add-related-denominators-004",
          ),
          slot("MYL-ANCHOR-ADD-P09-B", "B", "Add or subtract decimals using place value to three decimal places.", "numeric_entry", "place-value table optional", "implemented-draft"),
        ],
      },
    ],
  },
  {
    key: "multiplicative-strategies",
    label: "Multiplicative strategies",
    lowerP: 3,
    initialP: 6,
    upperP: 9,
    anchors: [
      {
        progressionId: "MYL-MATH-PROG-NSA-MUL-P03",
        pLevel: 3,
        role: "lower",
        sourcePages: [7],
        slots: [
          slot("MYL-ANCHOR-MUL-P03-A", "A", "Determine a total from concealed equal groups using imagined composite units.", "numeric_entry", "composite-unit pack renderer", "new-hybrid-blueprint"),
          slot("MYL-ANCHOR-MUL-P03-B", "B", "Use composite-unit counting when individual items are not visible.", "numeric_entry", "composite-unit pack renderer", "new-hybrid-blueprint"),
        ],
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-MUL-P06",
        pLevel: 6,
        role: "initial",
        sourcePages: [7, 8],
        slots: [
          slot(
            "MYL-ANCHOR-MUL-P06-A",
            "A",
            "Use flexible single-digit multiplication in a multiplicative context.",
            "numeric_entry",
            "context card / array optional",
            "reuse-audited",
            "multiplication-division-fluency-context-problem-011",
          ),
          slot(
            "MYL-ANCHOR-MUL-P06-B",
            "B",
            "Interpret and solve a single-digit equal-sharing division context.",
            "numeric_entry",
            "equal-sharing context / counters optional",
            "reuse-audited",
            "multiplication-division-fluency-sharing-004",
          ),
        ],
        reserveSlot: slot(
          "MYL-ANCHOR-MUL-P06-C",
          "C",
          "Interpret a remainder after grouping by a single-digit quantity.",
          "single_choice",
          "equal-groups context / counters optional",
          "implemented-draft",
        ),
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-MUL-P09",
        pLevel: 9,
        role: "upper",
        sourcePages: [7, 8],
        slots: [
          slot(
            "MYL-ANCHOR-MUL-P09-A",
            "A",
            "Express a natural number as a product of prime factors using exponent form.",
            "short_symbolic",
            "factor tree optional",
            "reuse-audited",
            "powers-roots-prime-powers-006",
          ),
          slot(
            "MYL-ANCHOR-MUL-P09-B",
            "B",
            "Use multiplicative reasoning to calculate a fraction of a quantity.",
            "numeric_entry",
            "fraction bar optional",
            "reuse-audited",
            "rational-ops-context-money-012",
          ),
        ],
      },
    ],
  },
  {
    key: "understanding-money",
    label: "Understanding money",
    lowerP: 2,
    initialP: 5,
    upperP: 8,
    anchors: [
      {
        progressionId: "MYL-MATH-PROG-NSA-MON-P02",
        pLevel: 2,
        role: "lower",
        sourcePages: [12],
        slots: [
          slot("MYL-ANCHOR-MON-P02-A", "A", "Order Australian coins or notes by face value.", "ordering", "versioned Australian currency tokens", "new-blueprint-currency-review"),
          slot("MYL-ANCHOR-MON-P02-B", "B", "Count the number of pieces sharing the same denomination.", "numeric_entry", "versioned Australian currency tokens", "new-blueprint-currency-review"),
        ],
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-MON-P05",
        pLevel: 5,
        role: "initial",
        sourcePages: [12],
        slots: [
          slot(
            "MYL-ANCHOR-MON-P05-A",
            "A",
            "Write a money amount using standard dollars-and-cents decimal notation.",
            "short_symbolic",
            "money place-value table optional",
            "reuse-candidate",
            "money-practical-contexts-money-notation-002",
          ),
          slot("MYL-ANCHOR-MON-P05-B", "B", "Determine the total value of a larger mixed collection of notes and coins.", "numeric_entry", "versioned Australian currency tokens", "new-blueprint-currency-review"),
        ],
        reserveSlot: slot(
          "MYL-ANCHOR-MON-P05-C",
          "C",
          "Determine the value of a mixed money collection from stated denominations.",
          "numeric_entry",
          "text-first money list",
          "implemented-draft",
        ),
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-MON-P08",
        pLevel: 8,
        role: "upper",
        sourcePages: [13],
        slots: [
          slot(
            "MYL-ANCHOR-MON-P08-A",
            "A",
            "Calculate a percentage discount and sale price.",
            "numeric_entry",
            "money / percentage context card",
            "reuse-candidate",
            "percent-ratio-finance-discount-sale-price-007",
          ),
          slot("MYL-ANCHOR-MON-P08-B", "B", "Interpret a percentage interest rate and calculate simple interest.", "numeric_entry", "finance context card", "new-blueprint"),
        ],
      },
    ],
  },
];

export type BinaryAnchorResult = 0 | 1 | null;

export type InitialAnchorRoute =
  | { kind: "awaiting"; score: null }
  | { kind: "down"; score: 0; targetP: number }
  | { kind: "same-level-extra"; score: 1; targetP: number }
  | { kind: "up"; score: 2; targetP: number };

function scoreCluster(results: [BinaryAnchorResult, BinaryAnchorResult]) {
  if (results.some((result) => result === null)) return null;
  return (results[0] || 0) + (results[1] || 0);
}

export function routeInitialAnchor(
  anchorSet: NumberOperationsAnchorSet,
  results: [BinaryAnchorResult, BinaryAnchorResult],
): InitialAnchorRoute {
  const score = scoreCluster(results);
  if (score === null) return { kind: "awaiting", score: null };
  if (score === 0) return { kind: "down", score: 0, targetP: anchorSet.lowerP };
  if (score === 1) return { kind: "same-level-extra", score: 1, targetP: anchorSet.initialP };
  return { kind: "up", score: 2, targetP: anchorSet.upperP };
}

export function resolveInitialAnchorWithReserve(
  anchorSet: NumberOperationsAnchorSet,
  results: [BinaryAnchorResult, BinaryAnchorResult],
  reserveResult: BinaryAnchorResult,
): InitialAnchorRoute {
  const initial = routeInitialAnchor(anchorSet, results);
  if (initial.kind !== "same-level-extra" || reserveResult === null) return initial;

  return reserveResult === 1
    ? { kind: "up", score: 2, targetP: anchorSet.upperP }
    : { kind: "down", score: 0, targetP: anchorSet.lowerP };
}

export type BranchAnchorRoute =
  | { kind: "awaiting" }
  | { kind: "search-down"; fromP: number }
  | { kind: "search-up"; fromP: number }
  | { kind: "bracket"; lowerP: number; upperP: number };

export function routeBranchAnchor(
  anchorSet: NumberOperationsAnchorSet,
  initialRoute: InitialAnchorRoute,
  results: [BinaryAnchorResult, BinaryAnchorResult],
): BranchAnchorRoute {
  if (initialRoute.kind === "awaiting" || initialRoute.kind === "same-level-extra") {
    return { kind: "awaiting" };
  }
  const score = scoreCluster(results);
  if (score === null) return { kind: "awaiting" };

  if (initialRoute.kind === "up") {
    if (score === 2) return { kind: "search-up", fromP: anchorSet.upperP };
    return { kind: "bracket", lowerP: anchorSet.initialP, upperP: anchorSet.upperP };
  }

  if (score === 0) return { kind: "search-down", fromP: anchorSet.lowerP };
  return { kind: "bracket", lowerP: anchorSet.lowerP, upperP: anchorSet.initialP };
}

export function getNumberOperationsAnchorSet(key: NumberOperationsAnchorSet["key"]) {
  return NUMBER_OPERATIONS_ANCHOR_SETS.find((anchorSet) => anchorSet.key === key) || null;
}

export const NUMBER_OPERATIONS_ANCHOR_SOURCE = {
  title: "QCAA Numeracy general capability — Sequence of numeracy progressions",
  version: "Australian Curriculum v9.0 · March 2024",
  url: "https://www.qcaa.qld.edu.au/p-10/aciq/version-9/general-capabilities",
} as const;
