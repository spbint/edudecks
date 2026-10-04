import type { NumberOperationsSubElementKey } from "./numberOperationsPlacementResult";

export type NumberOperationsUnresolvedGuidance = {
  subElementKey: NumberOperationsSubElementKey;
  label: string;
  headline: string;
  tryThis: string;
  evidenceToLookFor: string[];
};

const GUIDANCE: Record<
  NumberOperationsSubElementKey,
  NumberOperationsUnresolvedGuidance
> = {
  "number-place-value": {
    subElementKey: "number-place-value",
    label: "Number and place value",
    headline: "Use a familiar number in a practical context",
    tryThis:
      "Choose a number that makes sense for the learner and ask them to read it, build or draw it, compare it with another number, or explain another way to represent the same value.",
    evidenceToLookFor: [
      "whether the learner reads the number without digit-order confusion",
      "whether place value is used when explaining or renaming the number",
      "whether comparisons are explained from value rather than appearance",
    ],
  },
  "counting-processes": {
    subElementKey: "counting-processes",
    label: "Counting processes",
    headline: "Watch the learner count real objects",
    tryThis:
      "Use a small collection of everyday objects and ask the learner how many there are. Let them organise or group the objects in their own way rather than telling them how to count.",
    evidenceToLookFor: [
      "one-to-one tracking without skipping or double-counting",
      "whether the final number is understood as the total quantity",
      "whether the learner starts grouping or using a more efficient count",
    ],
  },
  "additive-strategies": {
    subElementKey: "additive-strategies",
    label: "Additive strategies",
    headline: "Give one simple joining or difference story",
    tryThis:
      "Use an everyday addition or subtraction situation and ask the learner to work it out in any way they choose. Avoid naming a method before they begin.",
    evidenceToLookFor: [
      "whether the learner counts all, counts on/back, or uses known facts",
      "whether part-whole or place-value ideas appear naturally",
      "whether the learner can explain why the answer makes sense",
    ],
  },
  "multiplicative-strategies": {
    subElementKey: "multiplicative-strategies",
    label: "Multiplicative strategies",
    headline: "Use an equal-groups or sharing situation",
    tryThis:
      "Make equal groups with real objects, or share a collection equally, and ask the learner to work out the total or amount in each group without prescribing multiplication or division.",
    evidenceToLookFor: [
      "whether equal groups are recognised as one repeated unit",
      "whether the learner chooses multiplication, division, skip counting, or repeated addition appropriately",
      "whether known facts or inverse relationships are used independently",
    ],
  },
  "understanding-money": {
    subElementKey: "understanding-money",
    label: "Understanding money",
    headline: "Use familiar real money or a shopping situation",
    tryThis:
      "Use real or familiar money, price labels, or a simple family shopping example. Ask the learner to recognise values, compare costs, make a total, or explain a choice that suits their current experience.",
    evidenceToLookFor: [
      "whether money values and denominations are recognised accurately",
      "whether dollars and cents are combined or compared meaningfully",
      "whether totals, change, value, or budgeting choices can be explained",
    ],
  },
};

export function getNumberOperationsUnresolvedGuidance(
  subElementKey: NumberOperationsSubElementKey,
) {
  return GUIDANCE[subElementKey];
}

export function buildNumberOperationsUnresolvedGuidance(
  subElementKeys: NumberOperationsSubElementKey[],
) {
  return Array.from(new Set(subElementKeys)).map(
    (subElementKey) => GUIDANCE[subElementKey],
  );
}
