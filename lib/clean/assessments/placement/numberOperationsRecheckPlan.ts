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

const EVIDENCE_BY_AREA: Record<
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
    "the learner works out a total, change, discount or budget decision with decreasing support",
    "the learner explains why a financial choice or answer is reasonable",
  ],
};

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
}): NumberOperationsRecheckPlan {
  return {
    subElementKey: input.subElementKey,
    ...planForState(input.subElementKey, input.state),
    evidenceToLookFor: [...EVIDENCE_BY_AREA[input.subElementKey]],
  };
}
