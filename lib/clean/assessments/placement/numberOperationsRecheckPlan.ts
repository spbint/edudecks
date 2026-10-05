import type { NumberOperationsParentAreaState } from "./numberOperationsParentUtility";
import type { NumberOperationsSubElementKey } from "./numberOperationsPlacementResult";

export type NumberOperationsRecheckTrigger =
  | "after-observation"
  | "after-practice"
  | "after-foundation-work"
  | "when-ready-for-extension";

export type NumberOperationsRecheckPlan = {
  subElementKey: NumberOperationsSubElementKey;
  trigger: NumberOperationsRecheckTrigger;
  headline: string;
  guidance: string;
  evidenceToLookFor: string[];
  minimumFreshEvidence: number;
  repeatSameItemsImmediately: false;
};

const GENERIC_EVIDENCE_BY_AREA: Record<
  NumberOperationsSubElementKey,
  string[]
> = {
  "number-place-value": [
    "the learner reads, represents or renames a number without being prompted through each place",
    "the learner explains why two number representations have the same value",
    "the learner uses place value when comparing, ordering or rounding",
  ],
  "counting-processes": [
    "the learner keeps track of a collection without double-counting or skipping items",
    "the learner uses an efficient count or grouping strategy rather than restarting from one",
    "the learner can explain what comes next, before or after in the sequence being used",
  ],
  "additive-strategies": [
    "the learner chooses an addition or subtraction strategy without being told which method to use",
    "the learner uses part-whole, bridging or place-value ideas accurately",
    "the learner checks whether the result is reasonable in the context",
  ],
  "multiplicative-strategies": [
    "the learner recognises equal groups, sharing or grouping structure in a new problem",
    "the learner chooses multiplication or division appropriately",
    "the learner uses known facts, inverse relationships or flexible calculation rather than repeated guessing",
  ],
  "understanding-money": [
    "the learner recognises and compares money values accurately in a practical situation",
    "the learner works out an appropriate money calculation or comparison with decreasing support",
    "the learner explains why a financial choice or answer is reasonable",
  ],
};

function evidenceForArea(
  subElementKey: NumberOperationsSubElementKey,
  targetP?: number | null,
) {
  if (!targetP) return [...GENERIC_EVIDENCE_BY_AREA[subElementKey]];

  if (subElementKey === "number-place-value") {
    if (targetP <= 3) {
      return [
        "the learner recognises or reads the numeral without digit-order confusion",
        "the learner connects a small quantity or number name with the matching numeral",
        "the learner notices useful number structure such as ten and some more when it is present",
      ];
    }
    if (targetP <= 6) {
      return [
        "the learner uses place value when reading, comparing or renaming numbers",
        "the learner explains an equivalent place-value representation",
        "the learner uses zero, rounding or tenths accurately when those ideas arise",
      ];
    }
    return [
      "the learner compares or orders decimal or signed values from place-value magnitude",
      "the learner explains how a digit's value changes across place-value positions",
      "the learner uses powers of ten, rounding or scientific notation accurately when relevant",
    ];
  }

  if (subElementKey === "counting-processes") {
    if (targetP <= 2) {
      return [
        "the learner recognises number words or very small quantities without unnecessary counting",
        "the learner uses a stable count when counting a very small collection",
        "the learner matches the count to the objects without skipping or double-counting",
      ];
    }
    if (targetP <= 5) {
      return [
        "the learner keeps one-to-one track of objects and understands the last count as the total",
        "the learner continues a count from a number other than one",
        "the learner identifies the next or previous number without restarting from one when ready",
      ];
    }
    return [
      "the learner continues skip-counting patterns accurately from different starting points",
      "the learner groups larger quantities efficiently and accounts for any remainder",
      "the learner extends counting flexibly beyond whole-number sequences when appropriate",
    ];
  }

  if (subElementKey === "additive-strategies") {
    if (targetP <= 3) {
      return [
        "the learner represents joining or taking-away situations with objects, drawings or mental images",
        "the learner keeps track of both quantities when finding a total or remainder",
        "the learner's explanation shows whether they count all, count on, or use another emerging strategy",
      ];
    }
    if (targetP <= 6) {
      return [
        "the learner counts on or back from a useful starting number rather than restarting from one",
        "the learner uses part-whole or bridge-to-ten ideas without being told the method",
        "the learner explains subtraction as a difference or missing part when appropriate",
      ];
    }
    return [
      "the learner selects a flexible additive strategy suited to the numbers",
      "the learner uses place value, inverse relationships or equivalent forms accurately",
      "the learner checks the reasonableness of decimal, fraction or larger-number results",
    ];
  }

  if (subElementKey === "multiplicative-strategies") {
    if (targetP <= 3) {
      return [
        "the learner recognises equal groups or equal sharing in a practical situation",
        "the learner treats each group as one repeated unit rather than unrelated objects",
        "the learner keeps track of concealed or visible groups accurately",
      ];
    }
    if (targetP <= 6) {
      return [
        "the learner connects equal groups, arrays or sharing with multiplication or division",
        "the learner uses known facts or related multiples rather than relying only on repeated counting",
        "the learner interprets multiplication and division symbols in the context of the problem",
      ];
    }
    return [
      "the learner chooses inverse, distributive, factor or other flexible multiplicative strategies appropriately",
      "the learner solves multi-step multiplicative situations without losing the structure of the problem",
      "the learner works accurately with factors, exponents, rational numbers or scientific notation when relevant",
    ];
  }

  if (targetP <= 2) {
    return [
      "the learner recognises familiar Australian money denominations by face value",
      "the learner sorts or orders money values rather than judging by physical size alone",
      "the learner identifies when a practical situation involves using money",
    ];
  }
  if (targetP <= 5) {
    return [
      "the learner counts money according to value rather than simply counting the number of pieces",
      "the learner recognises equivalent ways to make the same amount",
      "the learner records dollars and cents in standard notation with decreasing support",
    ];
  }
  return [
    "the learner calculates totals, change or repeated costs accurately in a practical context",
    "the learner uses percentages or proportional comparisons when the situation requires them",
    "the learner explains why a financial comparison or decision is reasonable",
  ];
}

function planForState(
  subElementKey: NumberOperationsSubElementKey,
  state: NumberOperationsParentAreaState,
): Omit<NumberOperationsRecheckPlan, "subElementKey" | "evidenceToLookFor"> {
  switch (state) {
    case "verify-in-learning":
      return {
        trigger: "after-observation",
        headline: "Check again after one or two real examples",
        guidance:
          "Do not repeat the same electronic questions yet. Watch the skill in normal learning or a practical task first, then use fresh assessment evidence to confirm the starting point.",
        minimumFreshEvidence: 1,
        repeatSameItemsImmediately: false,
      };
    case "strengthen-foundations":
      return {
        trigger: "after-foundation-work",
        headline: "Recheck after the foundation has had time to settle",
        guidance:
          "Use several supported learning opportunities first. Recheck when the learner can attempt the idea with less prompting, using fresh items rather than memorised answers.",
        minimumFreshEvidence: 2,
        repeatSameItemsImmediately: false,
      };
    case "build-next":
      return {
        trigger: "after-practice",
        headline: "Recheck after a short run of successful practice",
        guidance:
          "Give the recommended next learning several opportunities in different examples. Recheck when the learner is starting to use the idea independently, not simply because a certain number of days has passed.",
        minimumFreshEvidence: 2,
        repeatSameItemsImmediately: false,
      };
    case "extend":
      return {
        trigger: "when-ready-for-extension",
        headline: "No immediate recheck needed",
        guidance:
          "Move into richer or unfamiliar applications. Check again only when the next learning decision needs fresh evidence, rather than repeatedly testing an area that is already showing strong evidence.",
        minimumFreshEvidence: 2,
        repeatSameItemsImmediately: false,
      };
  }
}

export function buildNumberOperationsRecheckPlan(input: {
  subElementKey: NumberOperationsSubElementKey;
  state: NumberOperationsParentAreaState;
  targetP?: number | null;
}): NumberOperationsRecheckPlan {
  return {
    subElementKey: input.subElementKey,
    ...planForState(input.subElementKey, input.state),
    evidenceToLookFor: evidenceForArea(input.subElementKey, input.targetP),
  };
}
