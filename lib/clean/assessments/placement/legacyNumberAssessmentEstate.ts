import {
  NUMBER_ASSESSMENT_BANKS,
  type NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import { NUMBER_OPERATIONS_ANCHOR_SETS } from "./numberOperationsAnchors";

export type LegacyNumberDisposition =
  | "keep-candidate"
  | "rewrite"
  | "hold-broader-mathematics";

export type LegacyNumberSourceFit =
  | "direct-fit"
  | "partial-fit"
  | "held-broader-mathematics";

export type LegacyNumberOperationsContinuum =
  | "number-place-value"
  | "counting-processes"
  | "additive-strategies"
  | "multiplicative-strategies"
  | "understanding-money";

export type LegacyNumberAssessmentOverlayRow = {
  bankKey: NumberAssessmentBankKey;
  bankTitle: string;
  itemId: string;
  legacyProgressionStepKey: string;
  legacySubElementKey: string;
  itemTitle: string;
  sourceFit: LegacyNumberSourceFit;
  disposition: LegacyNumberDisposition;
  numberOperationsContinuum: LegacyNumberOperationsContinuum | null;
  placementReuseCandidate: boolean;
  auditedAnchorReuse: boolean;
};

const FULL_HOLD_BANKS = new Set<NumberAssessmentBankKey>([
  "irrational-and-real-numbers",
  "terminating-recurring-rational-representations",
  "surds-and-exact-form",
]);

const POWER_ITEMS_RETAINED_FROM_BROADER_HOLD = new Set([
  "powers-roots-perfect-square-001",
  "powers-roots-powers-of-ten-005",
  "powers-roots-prime-powers-006",
  "powers-roots-factor-tree-007",
]);

const PARTIAL_FIT_ITEM_IDS = new Set([
  "percent-ratio-finance-discount-sale-price-007",
  "percent-ratio-finance-discount-order-008",
  "percent-ratio-finance-classify-change-009",
  "percent-ratio-finance-modelling-explanation-011",
  "percent-ratio-finance-context-problem-012",
  "decimals-foundations-money-measurement-011",
  "money-practical-contexts-measurement-007",
  "money-practical-contexts-time-008",
  "money-practical-contexts-operation-classification-009",
  "money-practical-contexts-budget-010",
  "money-practical-contexts-reasonableness-011",
  "money-practical-contexts-misconception-012",
  "rational-ops-context-money-012",
  "integers-coordinates-properties-context-012",
]);

const PARTIAL_KEEP_ITEM_IDS = new Set([
  "percent-ratio-finance-discount-sale-price-007",
]);

const FULL_NUMBER_OPERATIONS_CANDIDATE_BANKS = new Set<NumberAssessmentBankKey>([
  "place-value-and-whole-number-operations",
  "additive-strategies-and-problem-solving",
  "multiplication-division-fluency",
  "money-and-practical-number-contexts",
  "decimals-foundations",
]);

const INTEGER_NUMBER_OPERATIONS_CANDIDATE_IDS = new Set([
  "integers-coordinates-properties-order-integers-001",
  "integers-coordinates-properties-calculate-integers-002",
  "integers-coordinates-properties-integer-working-003",
  "integers-coordinates-properties-factor-multiple-classify-007",
  "integers-coordinates-properties-divisibility-008",
  "integers-coordinates-properties-common-factor-multiple-009",
  "integers-coordinates-properties-prime-composite-010",
  "integers-coordinates-properties-true-statements-011",
  "integers-coordinates-properties-context-012",
]);

const PERCENT_FINANCE_NUMBER_OPERATIONS_CANDIDATE_IDS = new Set([
  "percent-ratio-finance-discount-sale-price-007",
  "percent-ratio-finance-discount-order-008",
  "percent-ratio-finance-classify-change-009",
  "percent-ratio-finance-error-correction-010",
  "percent-ratio-finance-modelling-explanation-011",
  "percent-ratio-finance-context-problem-012",
]);

const POWER_NUMBER_OPERATIONS_CANDIDATE_IDS = new Set([
  "powers-roots-powers-of-ten-005",
  "powers-roots-prime-powers-006",
  "powers-roots-factor-tree-007",
]);

const auditedAnchorReuseIds = new Set(
  NUMBER_OPERATIONS_ANCHOR_SETS.flatMap((set) =>
    set.anchors.flatMap((anchor) => [
      ...anchor.slots.map((slot) => slot.existingItemId),
      anchor.reserveSlot?.existingItemId,
    ]),
  ).filter((itemId): itemId is string => Boolean(itemId)),
);

function isHeld(bankKey: NumberAssessmentBankKey, itemId: string) {
  if (FULL_HOLD_BANKS.has(bankKey)) return true;
  if (bankKey !== "powers-roots-exponent-notation") return false;
  return !POWER_ITEMS_RETAINED_FROM_BROADER_HOLD.has(itemId);
}

function sourceFit(
  bankKey: NumberAssessmentBankKey,
  itemId: string,
): LegacyNumberSourceFit {
  if (isHeld(bankKey, itemId)) return "held-broader-mathematics";
  if (PARTIAL_FIT_ITEM_IDS.has(itemId)) return "partial-fit";
  return "direct-fit";
}

function disposition(
  fit: LegacyNumberSourceFit,
  itemId: string,
): LegacyNumberDisposition {
  if (fit === "held-broader-mathematics") return "hold-broader-mathematics";
  if (fit === "partial-fit" && !PARTIAL_KEEP_ITEM_IDS.has(itemId)) return "rewrite";
  return "keep-candidate";
}

function numberOperationsContinuum(
  bankKey: NumberAssessmentBankKey,
  itemId: string,
): LegacyNumberOperationsContinuum | null {
  if (bankKey === "place-value-and-whole-number-operations") {
    if (/-00[1-6]$/.test(itemId)) return "number-place-value";
    if (/-00[7-9]$/.test(itemId)) return "additive-strategies";
    return "multiplicative-strategies";
  }
  if (bankKey === "additive-strategies-and-problem-solving") {
    return "additive-strategies";
  }
  if (bankKey === "multiplication-division-fluency") {
    return "multiplicative-strategies";
  }
  if (bankKey === "money-and-practical-number-contexts") {
    return "understanding-money";
  }
  if (bankKey === "decimals-foundations") {
    return "number-place-value";
  }
  if (bankKey === "integers-coordinates-number-properties") {
    if (!INTEGER_NUMBER_OPERATIONS_CANDIDATE_IDS.has(itemId)) return null;
    return /-(00[1-3])$/.test(itemId)
      ? "number-place-value"
      : "multiplicative-strategies";
  }
  if (bankKey === "percentages-ratio-financial-modelling") {
    return PERCENT_FINANCE_NUMBER_OPERATIONS_CANDIDATE_IDS.has(itemId)
      ? "understanding-money"
      : null;
  }
  if (bankKey === "powers-roots-exponent-notation") {
    if (!POWER_NUMBER_OPERATIONS_CANDIDATE_IDS.has(itemId)) return null;
    return itemId === "powers-roots-powers-of-ten-005"
      ? "number-place-value"
      : "multiplicative-strategies";
  }
  return null;
}

export function getLegacyNumberAssessmentOverlay(): LegacyNumberAssessmentOverlayRow[] {
  return NUMBER_ASSESSMENT_BANKS.flatMap((bank) =>
    bank.items.map((item) => {
      const fit = sourceFit(bank.key, item.id);
      const continuum = numberOperationsContinuum(bank.key, item.id);
      return {
        bankKey: bank.key,
        bankTitle: bank.title,
        itemId: item.id,
        legacyProgressionStepKey: item.progressionStepKey,
        legacySubElementKey: item.subElementKey,
        itemTitle: item.title,
        sourceFit: fit,
        disposition: disposition(fit, item.id),
        numberOperationsContinuum: continuum,
        placementReuseCandidate: continuum !== null,
        auditedAnchorReuse: auditedAnchorReuseIds.has(item.id),
      };
    }),
  );
}

export const LEGACY_NUMBER_ASSESSMENT_OVERLAY_V03 = {
  status: "provisional-source-and-construct-overlay",
  methodology: [
    "source-fit",
    "progression-placement",
    "placement-eligibility",
    "reuse-decision",
    "source-indicator",
    "visual-interaction-action",
  ],
  expected: {
    bankCount: 16,
    itemCount: 192,
    disposition: {
      keepCandidate: 135,
      rewrite: 13,
      holdBroaderMathematics: 44,
    },
    sourceFit: {
      directFit: 134,
      partialFit: 14,
      heldBroaderMathematics: 44,
    },
    numberOperationsReuseCandidates: 78,
    auditedAnchorReuse: 11,
  },
} as const;

export function summarizeLegacyNumberAssessmentOverlay() {
  const rows = getLegacyNumberAssessmentOverlay();
  const count = <T extends string>(values: T[], target: T) =>
    values.filter((value) => value === target).length;

  const dispositions = rows.map((row) => row.disposition);
  const fits = rows.map((row) => row.sourceFit);
  const continua = (
    [
      "number-place-value",
      "counting-processes",
      "additive-strategies",
      "multiplicative-strategies",
      "understanding-money",
    ] as LegacyNumberOperationsContinuum[]
  ).map((key) => ({
    key,
    count: rows.filter((row) => row.numberOperationsContinuum === key).length,
    auditedAnchorReuse: rows.filter(
      (row) => row.numberOperationsContinuum === key && row.auditedAnchorReuse,
    ).length,
  }));

  return {
    bankCount: NUMBER_ASSESSMENT_BANKS.length,
    itemCount: rows.length,
    disposition: {
      keepCandidate: count(dispositions, "keep-candidate"),
      rewrite: count(dispositions, "rewrite"),
      holdBroaderMathematics: count(dispositions, "hold-broader-mathematics"),
    },
    sourceFit: {
      directFit: count(fits, "direct-fit"),
      partialFit: count(fits, "partial-fit"),
      heldBroaderMathematics: count(fits, "held-broader-mathematics"),
    },
    numberOperationsReuseCandidates: rows.filter(
      (row) => row.placementReuseCandidate,
    ).length,
    auditedAnchorReuse: rows.filter((row) => row.auditedAnchorReuse).length,
    continua,
  };
}
