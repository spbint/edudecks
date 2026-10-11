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
      "Choose one or two familiar numbers that suit the learner. Ask them to name or read the number, show what it means with objects or a drawing if helpful, and explain which of two numbers represents more or less.",
    evidenceToLookFor: [
      "whether the numeral or number name is recognised accurately",
      "whether the learner connects the numeral with the quantity or value it represents",
      "whether useful grouping, tens or place-value ideas appear naturally when the numbers are large enough",
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
      "whether the learner uses sharing, grouping, skip counting or repeated addition in a way that fits the task",
      "whether a known fact or repeated-unit idea is used independently when the learner is ready",
    ],
  },
  "understanding-money": {
    subElementKey: "understanding-money",
    label: "Understanding money",
    headline: "Use familiar real money or a shopping situation",
    tryThis:
      "Use real or familiar money, price labels, or a simple family shopping example. Ask the learner to recognise values, compare costs, make a total, or explain a choice that suits their current experience.",
    evidenceToLookFor: [
      "whether familiar money values and denominations are recognised accurately",
      "whether the learner compares or combines money values meaningfully for their current experience",
      "whether a simple value, total or choice can be explained in their own words",
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
