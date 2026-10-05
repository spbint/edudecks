export type AnchorItemStatus =
  | "reuse-candidate"
  | "reuse-audited"
  | "new-blueprint"
  | "implemented-draft"
  | "implemented-draft-accessibility-review"
  | "implemented-draft-asset-review"
  | "implemented-hybrid-routing-only"
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
  evidenceMode: "direct" | "hybrid-observed" | "asset-review";
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
  minP: number;
  maxP: number;
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
    minP: 1,
    maxP: 10,
    lowerP: 3,
    initialP: 6,
    upperP: 9,
    anchors: [
      {
        progressionId: "MYL-MATH-PROG-NSA-NPV-P03",
        pLevel: 3,
        role: "lower",
        evidenceMode: "direct",
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
        evidenceMode: "direct",
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
        evidenceMode: "direct",
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
    minP: 1,
    maxP: 8,
    lowerP: 2,
    initialP: 5,
    upperP: 7,
    anchors: [
      {
        progressionId: "MYL-MATH-PROG-NSA-CNT-P02",
        pLevel: 2,
        role: "lower",
        evidenceMode: "hybrid-observed",
        sourcePages: [5],
        slots: [
          slot("MYL-ANCHOR-CNT-P02-A", "A", "Subitise a small collection up to about five.", "single_choice", "controlled dot set", "implemented-hybrid-routing-only"),
          slot("MYL-ANCHOR-CNT-P02-B", "B", "Count a very small visible collection accurately.", "single_choice", "counter tokens", "implemented-hybrid-routing-only"),
        ],
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-CNT-P05",
        pLevel: 5,
        role: "initial",
        evidenceMode: "direct",
        sourcePages: [5],
        slots: [
          slot("MYL-ANCHOR-CNT-P05-A", "A", "Find the next or previous number from an arbitrary point within 1–100.", "numeric_entry", "text-first", "implemented-draft"),
          slot("MYL-ANCHOR-CNT-P05-B", "B", "Match a numeral to a collection up to 20 from a deterministic visual collection.", "numeric_entry", "controlled scattered counter set; varied arrangements required in later boundary pool", "implemented-draft-accessibility-review"),
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
        evidenceMode: "direct",
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
    minP: 1,
    maxP: 10,
    lowerP: 3,
    initialP: 6,
    upperP: 9,
    anchors: [
      {
        progressionId: "MYL-MATH-PROG-NSA-ADD-P03",
        pLevel: 3,
        role: "lower",
        evidenceMode: "hybrid-observed",
        sourcePages: [6],
        slots: [
          slot("MYL-ANCHOR-ADD-P03-A", "A", "Solve an additive situation after two small quantities are concealed.", "numeric_entry", "concealed quantity context", "implemented-hybrid-routing-only"),
          slot("MYL-ANCHOR-ADD-P03-B", "B", "Sample a second concealed-quantity task; exact strategy still requires observation.", "numeric_entry", "concealed quantity context", "implemented-hybrid-routing-only"),
        ],
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-ADD-P06",
        pLevel: 6,
        role: "initial",
        evidenceMode: "direct",
        sourcePages: [6],
        slots: [
          slot("MYL-ANCHOR-ADD-P06-A", "A", "Use a flexible strategy such as bridging to 10 within 20.", "single_choice", "text-first / part-part-whole optional", "implemented-draft"),
          slot("MYL-ANCHOR-ADD-P06-B", "B", "Use part-part-whole knowledge to solve a missing-addend problem.", "single_choice", "text-first / part-part-whole working", "implemented-draft"),
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
        evidenceMode: "direct",
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
    minP: 1,
    maxP: 10,
    lowerP: 3,
    initialP: 6,
    upperP: 9,
    anchors: [
      {
        progressionId: "MYL-MATH-PROG-NSA-MUL-P03",
        pLevel: 3,
        role: "lower",
        evidenceMode: "hybrid-observed",
        sourcePages: [7],
        slots: [
          slot("MYL-ANCHOR-MUL-P03-A", "A", "Determine a total from concealed equal groups using imagined composite units.", "numeric_entry", "closed-pack context", "implemented-hybrid-routing-only"),
          slot("MYL-ANCHOR-MUL-P03-B", "B", "Use composite-unit counting when individual items are not visible.", "numeric_entry", "closed-box context", "implemented-hybrid-routing-only"),
        ],
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-MUL-P06",
        pLevel: 6,
        role: "initial",
        evidenceMode: "direct",
        sourcePages: [7],
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
          "Use a known multiple to calculate a related multiple.",
          "single_choice",
          "text-first / related-fact support optional",
          "implemented-draft",
        ),
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-MUL-P09",
        pLevel: 9,
        role: "upper",
        evidenceMode: "direct",
        sourcePages: [7],
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
    minP: 1,
    maxP: 10,
    lowerP: 2,
    initialP: 5,
    upperP: 8,
    anchors: [
      {
        progressionId: "MYL-MATH-PROG-NSA-MON-P02",
        pLevel: 2,
        role: "lower",
        evidenceMode: "asset-review",
        sourcePages: [13],
        slots: [
          slot("MYL-ANCHOR-MON-P02-A", "A", "Order Australian money denominations by face value.", "single_choice", "schematic denomination tokens", "implemented-draft-asset-review"),
          slot("MYL-ANCHOR-MON-P02-B", "B", "Count the number of money tokens sharing the same denomination.", "numeric_entry", "schematic denomination tokens", "implemented-draft-asset-review"),
        ],
      },
      {
        progressionId: "MYL-MATH-PROG-NSA-MON-P05",
        pLevel: 5,
        role: "initial",
        evidenceMode: "direct",
        sourcePages: [13],
        slots: [
          slot(
            "MYL-ANCHOR-MON-P05-A",
            "A",
            "Write a money amount using standard dollars-and-cents decimal notation.",
            "short_symbolic",
            "money place-value table optional",
            "reuse-audited",
            "money-practical-contexts-money-notation-002",
          ),
          slot("MYL-ANCHOR-MON-P05-B", "B", "Determine the total value of a larger mixed money collection.", "numeric_entry", "text-first until currency-token assets are approved", "implemented-draft"),
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
        evidenceMode: "direct",
        sourcePages: [13],
        slots: [
          slot(
            "MYL-ANCHOR-MON-P08-A",
            "A",
            "Calculate a percentage discount and sale price.",
            "numeric_entry",
            "money / percentage context card",
            "reuse-audited",
            "percent-ratio-finance-discount-sale-price-007",
          ),
          slot("MYL-ANCHOR-MON-P08-B", "B", "Interpret a percentage interest rate and calculate simple interest.", "numeric_entry", "finance context card", "implemented-draft"),
        ],
      },
    ],
  },
];


export function getAnchorEvidenceMode(
  anchorSet: NumberOperationsAnchorSet,
  pLevel: number,
) {
  return anchorSet.anchors.find((anchor) => anchor.pLevel === pLevel)?.evidenceMode || null;
}

export function getProgressionEvidenceMode(
  anchorSet: NumberOperationsAnchorSet,
  pLevel: number,
): NumberOperationsAnchor["evidenceMode"] {
  const anchorMode = getAnchorEvidenceMode(anchorSet, pLevel);
  if (anchorMode) return anchorMode;

  if (anchorSet.key === "number-place-value" && pLevel === 1) {
    return "hybrid-observed";
  }
  if (anchorSet.key === "counting-processes" && pLevel <= 4) {
    return "hybrid-observed";
  }
  if (anchorSet.key === "additive-strategies" && pLevel <= 5) {
    return "hybrid-observed";
  }
  if (anchorSet.key === "multiplicative-strategies" && pLevel <= 4) {
    return "hybrid-observed";
  }
  if (anchorSet.key === "understanding-money" && pLevel <= 2) {
    return "asset-review";
  }

  return "direct";
}


export type PlacementEvidencePolicy = {
  mayRoute: boolean;
  maySupportExactPlacement: boolean;
  confidenceCeiling: "routing-only" | "moderate" | "high-eligible";
  reason: string;
};

export function getPlacementEvidencePolicy(input: {
  evidenceMode: NumberOperationsAnchor["evidenceMode"];
  observerVerified?: boolean;
  assetApproved?: boolean;
}): PlacementEvidencePolicy {
  if (input.evidenceMode === "hybrid-observed") {
    if (input.observerVerified) {
      return {
        mayRoute: true,
        maySupportExactPlacement: true,
        confidenceCeiling: "high-eligible",
        reason:
          "Observed strategy evidence is present; exact placement still requires construct-diverse boundary confirmation.",
      };
    }
    return {
      mayRoute: true,
      maySupportExactPlacement: false,
      confidenceCeiling: "routing-only",
      reason:
        "Digital correctness can route the learner, but the source construct depends on observed strategy or behaviour.",
    };
  }

  if (input.evidenceMode === "asset-review") {
    if (input.assetApproved) {
      return {
        mayRoute: true,
        maySupportExactPlacement: true,
        confidenceCeiling: "high-eligible",
        reason:
          "The trusted score-bearing asset set is approved; normal boundary evidence rules still apply.",
      };
    }
    return {
      mayRoute: false,
      maySupportExactPlacement: false,
      confidenceCeiling: "routing-only",
      reason:
        "Production routing is blocked until the trusted score-bearing asset set is approved.",
    };
  }

  return {
    mayRoute: true,
    maySupportExactPlacement: true,
    confidenceCeiling: "high-eligible",
    reason:
      "Direct digital evidence is permitted, subject to item review, boundary confirmation and later calibration.",
  };
}

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



export function nextSearchTarget(
  anchorSet: NumberOperationsAnchorSet,
  route: BranchAnchorRoute,
) {
  if (route.kind === "search-down") {
    return route.fromP > anchorSet.minP ? route.fromP - 1 : null;
  }
  if (route.kind === "search-up") {
    return route.fromP < anchorSet.maxP ? route.fromP + 1 : null;
  }
  return null;
}


export type SearchClusterRoute =
  | { kind: "awaiting" }
  | { kind: "search-down"; fromP: number }
  | { kind: "search-up"; fromP: number }
  | { kind: "bracket"; lowerP: number; upperP: number }
  | { kind: "endpoint"; relation: "below-or-around" | "at-least"; pLevel: number };

export function routeSearchCluster(
  anchorSet: NumberOperationsAnchorSet,
  direction: "down" | "up",
  pLevel: number,
  results: [BinaryAnchorResult, BinaryAnchorResult],
): SearchClusterRoute {
  const score = scoreCluster(results);
  if (score === null) return { kind: "awaiting" };

  if (direction === "up") {
    if (score === 2) {
      return pLevel >= anchorSet.maxP
        ? { kind: "endpoint", relation: "at-least", pLevel }
        : { kind: "search-up", fromP: pLevel };
    }
    return {
      kind: "bracket",
      lowerP: Math.max(anchorSet.minP, pLevel - 1),
      upperP: pLevel,
    };
  }

  if (score === 0) {
    return pLevel <= anchorSet.minP
      ? { kind: "endpoint", relation: "below-or-around", pLevel }
      : { kind: "search-down", fromP: pLevel };
  }

  return {
    kind: "bracket",
    lowerP: pLevel,
    upperP: Math.min(anchorSet.maxP, pLevel + 1),
  };
}

export type ProgressionBracket = {
  lowerP: number;
  upperP: number;
};

export function nextBoundaryTarget(bracket: ProgressionBracket) {
  if (bracket.upperP - bracket.lowerP <= 1) return null;
  return Math.floor((bracket.lowerP + bracket.upperP) / 2);
}

export function applyBoundaryEvidence(
  bracket: ProgressionBracket,
  targetP: number,
  supported: boolean,
): ProgressionBracket {
  if (targetP <= bracket.lowerP || targetP >= bracket.upperP) {
    throw new Error("Boundary target must sit strictly inside the current bracket.");
  }
  return supported
    ? { lowerP: targetP, upperP: bracket.upperP }
    : { lowerP: bracket.lowerP, upperP: targetP };
}

export function bracketFromBranchRoute(route: BranchAnchorRoute): ProgressionBracket | null {
  return route.kind === "bracket"
    ? { lowerP: route.lowerP, upperP: route.upperP }
    : null;
}

export function getNumberOperationsAnchorSet(key: NumberOperationsAnchorSet["key"]) {
  return NUMBER_OPERATIONS_ANCHOR_SETS.find((anchorSet) => anchorSet.key === key) || null;
}

export const NUMBER_OPERATIONS_ANCHOR_SOURCE = {
  title: "QCAA Numeracy general capability — Sequence of numeracy progressions",
  version: "Australian Curriculum v9.0 · March 2024",
  url: "https://www.qcaa.qld.edu.au/p-10/aciq/version-9/general-capabilities",
} as const;
