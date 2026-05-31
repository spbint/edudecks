import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";

export const NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_KEY =
  "number-step-1-recognise-small-quantities-assessment-v1";

export const NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_STEP_KEY =
  "recognise-small-quantities-without-counting";

export const NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PATHWAY_STEP_ID =
  "mathematics::number-and-place-value::foundation-kindergarten::recognise-small-quantities-without-counting";

const STEP_DESCRIPTION =
  "Recognise small groups visually, match them to numerals, and notice that arrangement does not change quantity.";

function visual(description: string) {
  return {
    type: "context_card" as const,
    description,
  };
}

function item(
  id: string,
  clusterKey: string,
  clusterTitle: string,
  title: string,
  prompt: string,
  options: string[],
  expectedAnswer: string,
  visualDescription: string,
  misconceptionTargets: string[],
): NumberAssessmentBankItem {
  return {
    id,
    progressionBandKey: "place-value-and-whole-number-operations",
    progressionStepKey: NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_STEP_KEY,
    subElementKey: clusterKey,
    subElementTitle: clusterTitle,
    subElementDescription: STEP_DESCRIPTION,
    title,
    prompt,
    difficulty: "foundation",
    answerType: "multiple_choice",
    format: "visual_quantity_card",
    options,
    expectedAnswer,
    acceptableAnswers: [expectedAnswer],
    markingGuide: "Auto-check the selected quantity.",
    workedSolution: `The card shows ${expectedAnswer}.`,
    misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_STEP_KEY,
      ifCorrectGoToStepKey: NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_STEP_KEY,
      practiceRecommendation:
        "Practise quick-look dot cards and matching small quantities to numerals.",
      diagnosticNote:
        "This checks whether the learner can recognise a small quantity visually without counting one by one.",
    },
    visualSupport: visual(visualDescription),
  };
}

export const NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_ITEMS: NumberAssessmentBankItem[] = [
  item(
    "number-step-1-assess-001",
    "quick-recognition-1-to-3",
    "Quick recognition of 1-3",
    "Quick look: three dots",
    "A quick-look card shows three dots close together. Which number does it show?",
    ["1", "2", "3"],
    "3",
    "Quick-look dot card with three small dots in a triangle arrangement.",
    ["counting-one-by-one-dependence", "small-quantity-recognition-gap"],
  ),
  item(
    "number-step-1-assess-002",
    "recognising-4-to-5",
    "Recognising 4-5 in familiar arrangements",
    "Dice pattern: four",
    "A dice-like card shows four corner dots. Which number does it show?",
    ["3", "4", "5"],
    "4",
    "Dice-style four-dot pattern, one dot near each corner.",
    ["four-five-pattern-confusion", "small-quantity-recognition-gap"],
  ),
  item(
    "number-step-1-assess-003",
    "same-quantity-different-arrangement",
    "Same quantity, different arrangement",
    "Same amount as three",
    "Which card shows the same number of counters as a card with three counters?",
    ["A card with 2 counters", "A card with 3 counters spread out", "A card with 4 counters"],
    "A card with 3 counters spread out",
    "Three comparison cards: two counters close, three counters spread out, four counters in a line.",
    ["arrangement-changes-quantity-error", "spacing-quantity-confusion"],
  ),
  item(
    "number-step-1-assess-004",
    "quantity-not-spacing-or-size",
    "Quantity is not spacing or size",
    "Spread out counters",
    "One card has five counters spread far apart. What number does it show?",
    ["3", "5", "More than 5 because they are spread out"],
    "5",
    "Five counters spread across a card with large spaces between them.",
    ["spacing-quantity-confusion", "size-quantity-confusion"],
  ),
  item(
    "number-step-1-assess-005",
    "quick-recognition-1-to-3",
    "Quick recognition of 1-3",
    "Quick look: two counters",
    "A quick-look card flashes two counters. Which numeral matches?",
    ["1", "2", "3"],
    "2",
    "Two counters side by side on a quick-look card.",
    ["counting-one-by-one-dependence", "numeral-quantity-match-gap"],
  ),
  item(
    "number-step-1-assess-006",
    "recognising-4-to-5",
    "Recognising 4-5 in familiar arrangements",
    "Five frame pattern",
    "A five-frame-like card has five filled spaces. Which number matches?",
    ["4", "5", "6"],
    "5",
    "Five spaces in a row with all five filled by counters.",
    ["four-five-pattern-confusion", "numeral-quantity-match-gap"],
  ),
  item(
    "number-step-1-assess-007",
    "same-quantity-different-arrangement",
    "Same quantity, different arrangement",
    "Find another four",
    "Card A shows four counters in a square. Which card shows the same amount?",
    ["Four counters in a line", "Three counters in a triangle", "Five counters on a dice card"],
    "Four counters in a line",
    "Card A with four counters in a square, compared with line, triangle and dice-card options.",
    ["arrangement-changes-quantity-error", "four-five-pattern-confusion"],
  ),
  item(
    "number-step-1-assess-008",
    "quantity-not-spacing-or-size",
    "Quantity is not spacing or size",
    "Bigger counters",
    "Card A has three large counters. Card B has three small counters. Which statement is true?",
    ["Card A has more", "Card B has more", "They show the same number"],
    "They show the same number",
    "Two cards each with three counters; one card uses larger counters and the other smaller counters.",
    ["size-quantity-confusion", "arrangement-changes-quantity-error"],
  ),
  item(
    "number-step-1-assess-009",
    "quick-recognition-1-to-3",
    "Quick recognition of 1-3",
    "One dot",
    "A card shows one dot. Which number should be touched?",
    ["0", "1", "2"],
    "1",
    "Single dot centred on a quick-look card.",
    ["small-quantity-recognition-gap", "numeral-quantity-match-gap"],
  ),
  item(
    "number-step-1-assess-010",
    "recognising-4-to-5",
    "Recognising 4-5 in familiar arrangements",
    "Five on a dice card",
    "A dice-like card shows four corner dots and one middle dot. Which number is this?",
    ["4", "5", "6"],
    "5",
    "Dice-style five-dot pattern with four corner dots and one centre dot.",
    ["four-five-pattern-confusion", "counting-one-by-one-dependence"],
  ),
  item(
    "number-step-1-assess-011",
    "same-quantity-different-arrangement",
    "Same quantity, different arrangement",
    "Two different threes",
    "A card shows three counters in a row. Which card has the same number?",
    ["Three counters in a triangle", "Two counters far apart", "Four counters close together"],
    "Three counters in a triangle",
    "Three comparison cards using row, triangle, spaced pair and close group arrangements.",
    ["arrangement-changes-quantity-error", "spacing-quantity-confusion"],
  ),
  item(
    "number-step-1-assess-012",
    "quantity-not-spacing-or-size",
    "Quantity is not spacing or size",
    "Close group or spread group",
    "Card A has four counters close together. Card B has four counters spread out. Which card has more?",
    ["Card A", "Card B", "Neither, they are the same"],
    "Neither, they are the same",
    "Two four-counter cards: one compact group and one spread-out group.",
    ["spacing-quantity-confusion", "arrangement-changes-quantity-error"],
  ),
];

export function getNumberStep1RecogniseSmallQuantitiesAssessmentItemById(id: string) {
  return (
    NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_ITEMS.find(
      (assessmentItem) => assessmentItem.id === id,
    ) || null
  );
}
