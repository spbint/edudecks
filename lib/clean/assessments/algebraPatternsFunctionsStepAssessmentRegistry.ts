import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentDepthItemCount,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export const ALGEBRA_PATTERNS_FUNCTIONS_STRAND_KEY =
  "algebra-patterns-and-functions";
export const ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_KEY =
  "algebra-patterns-functions-foundations";
export const ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_TITLE =
  "Algebra, patterns and functions";
export const ALGEBRA_PATTERNS_FUNCTIONS_ITEM_BANK_KEY =
  "algebra-patterns-functions-step-assessment-items-v1";
export const ALGEBRA_PATTERNS_FUNCTIONS_SOURCE_ROUTE = "/assessments/number";

type AlgebraCase = {
  title: string;
  prompt: string;
  practicePrompt: string;
  options: string[];
  answer: string;
  visual: string;
  cluster: string;
  clusterTitle: string;
  misconceptionTargets: string[];
};

type RawAlgebraCase = [
  string,
  string,
  string,
  string[],
  string,
  string,
  string,
  string,
  string[],
];

export type AlgebraPatternsFunctionsStepSpec = {
  order: number;
  stepNumber: number;
  stageKey: CleanAssessmentStageKey;
  stageTitle: string;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  cases: AlgebraCase[];
};

export type AlgebraPatternsFunctionsStepAssessment = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof ALGEBRA_PATTERNS_FUNCTIONS_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentBankKey: typeof ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_KEY;
  parentBankTitle: typeof ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_TITLE;
  parentItemBankKey: typeof ALGEBRA_PATTERNS_FUNCTIONS_ITEM_BANK_KEY;
  progressionBandKey: typeof ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_KEY;
  sourceRoute: typeof ALGEBRA_PATTERNS_FUNCTIONS_SOURCE_ROUTE;
  depthOptions: typeof NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS;
  items: NumberAssessmentBankItem[];
};

type StepAssessmentContext = {
  stepKey?: string | null;
  pathwayStepId?: string | null;
  stepAssessmentKey?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function visual(description: string) {
  return { type: "context_card" as const, description };
}

function groups(caption: string, counts: number[], labels: string[] = counts.map(String)) {
  return `early-number|caption=${caption}|groups=${counts.join(",")}|labels=${labels.join(",")}`;
}

function numbers(caption: string, values: Array<string | number>) {
  return `early-number|caption=${caption}|numbers=${values.join(",")}`;
}

function makeCase([
  title,
  prompt,
  practicePrompt,
  options,
  answer,
  visual,
  cluster,
  clusterTitle,
  misconceptionTargets,
]: RawAlgebraCase): AlgebraCase {
  return {
    title,
    prompt,
    practicePrompt,
    options,
    answer,
    visual,
    cluster,
    clusterTitle,
    misconceptionTargets,
  };
}

function itemId(spec: AlgebraPatternsFunctionsStepSpec, index: number) {
  return `algebra-patterns-functions-step-${spec.order}-assess-${String(
    index + 1,
  ).padStart(3, "0")}`;
}

function makeItem(
  spec: AlgebraPatternsFunctionsStepSpec,
  item: AlgebraCase,
  index: number,
): NumberAssessmentBankItem {
  return {
    id: itemId(spec, index),
    progressionBandKey: ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_KEY,
    progressionStepKey: spec.stepKey,
    subElementKey: item.cluster,
    subElementTitle: item.clusterTitle,
    subElementDescription: spec.description,
    title: item.title,
    prompt: item.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "algebra_patterns_functions_visual_card",
    options: item.options,
    expectedAnswer: item.answer,
    acceptableAnswers: [item.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: item.answer,
    misconceptionTargets: item.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: spec.stepKey,
      ifCorrectGoToStepKey: spec.stepKey,
      practiceRecommendation: `Practise ${spec.shortTitle.toLowerCase()} with pattern cards, tables, rule cards, equations, and context models.`,
      diagnosticNote: `Checks whether the learner can use ${spec.shortTitle.toLowerCase()} for this exact pathway step.`,
    },
    visualSupport: visual(item.visual),
  };
}

const ALGEBRA_STEP_TITLES: Array<
  [string, string, CleanAssessmentStageKey, string, number, string, string]
> = [
  [
    "Notice and continue simple repeating patterns",
    "notice-and-continue-simple-repeating-patterns",
    "foundation-kindergarten",
    "Foundation / Kindergarten",
    1,
    "Simple repeating patterns",
    "Continue simple repeating patterns and identify the repeating unit.",
  ],
  [
    "Sort objects and explain the rule",
    "sort-objects-and-explain-the-rule",
    "foundation-kindergarten",
    "Foundation / Kindergarten",
    2,
    "Sorting by rule",
    "Sort objects by a shared feature and explain the rule that decides what belongs.",
  ],
  [
    "Continue growing patterns and describe the change",
    "continue-growing-patterns-and-describe-the-change",
    "lower-primary",
    "Lower Primary",
    1,
    "Growing patterns",
    "Continue growing patterns and describe how the pattern changes each time.",
  ],
  [
    "Use missing-number and input-output thinking",
    "use-missing-number-and-input-output-thinking",
    "lower-primary",
    "Lower Primary",
    2,
    "Missing numbers and input-output",
    "Use simple missing-number sentences and input-output rules to reason about unknown values.",
  ],
  [
    "Use tables and rules to describe number patterns",
    "use-tables-and-rules-to-describe-number-patterns",
    "middle-primary",
    "Middle Primary",
    1,
    "Tables and rules",
    "Record number patterns in tables and use rules to extend related values.",
  ],
  [
    "Generalise simple rules and equivalent relationships",
    "generalise-simple-rules-and-equivalent-relationships",
    "middle-primary",
    "Middle Primary",
    2,
    "Generalising and equivalence",
    "Recognise general rules and different-looking relationships that produce the same outcome.",
  ],
  [
    "Use symbols or letters to show an unknown or rule",
    "use-symbols-or-letters-to-show-an-unknown-or-rule",
    "upper-primary",
    "Upper Primary",
    1,
    "Symbols for unknowns and rules",
    "Use symbols or letters as meaningful placeholders for unknown or changing values.",
  ],
  [
    "Write and interpret simple expressions or equations",
    "write-and-interpret-simple-expressions-or-equations",
    "upper-primary",
    "Upper Primary",
    2,
    "Expressions and equations",
    "Write, read, and check simple expressions or equations from patterns and contexts.",
  ],
  [
    "Solve and explain equations as balanced relationships",
    "solve-and-explain-equations-as-balanced-relationships",
    "lower-secondary",
    "Lower Secondary",
    1,
    "Balanced equations",
    "Solve equations while explaining how each step keeps the relationship balanced.",
  ],
  [
    "Connect tables, rules, and graphs in functional thinking",
    "connect-tables-rules-and-graphs-in-functional-thinking",
    "lower-secondary",
    "Lower Secondary",
    2,
    "Tables, rules, and graphs",
    "Connect the same functional relationship across tables, rules, and simple graphs.",
  ],
  [
    "Use algebra to model relationships efficiently",
    "use-algebra-to-model-relationships-efficiently",
    "years-9-10-consolidation",
    "Years 9-10 / consolidation",
    1,
    "Algebraic modelling",
    "Choose and use algebraic models to predict, compare, and explain relationships.",
  ],
  [
    "Refine explanation, checking, and generalising",
    "refine-explanation-checking-and-generalising",
    "years-9-10-consolidation",
    "Years 9-10 / consolidation",
    2,
    "Explain, check, and generalise",
    "Justify algebraic conclusions, check claims, and communicate general rules clearly.",
  ],
];

const RAW_ALGEBRA_CASES: RawAlgebraCase[][] = [
  [
    ["AB pattern", "What comes next: red, blue, red, blue, ...?", "Say the pattern aloud, then choose the next colour.", ["red", "blue", "green"], "red", numbers("Repeating pattern.", ["red", "blue", "red", "blue", "?"]), "repeating-unit", "Repeating unit", ["chooses-last-item"]],
    ["AAB pattern", "What comes next: clap, clap, tap, clap, clap, tap, ...?", "Find the repeating part first.", ["clap", "tap", "stamp"], "clap", numbers("The repeating part is clap, clap, tap.", ["clap", "clap", "tap", "clap", "clap", "tap", "?"]), "repeating-unit", "Repeating unit", ["tracks-single-item-only"]],
    ["Shape pattern", "Which shape comes next: circle, square, circle, square, ...?", "Look for the two-shape unit.", ["circle", "square", "triangle"], "circle", numbers("Circle, square repeats.", ["circle", "square", "circle", "square", "?"]), "continue-pattern", "Continue patterns", ["alternation-slip"]],
    ["Find the unit", "Which part repeats in star, moon, star, moon?", "Choose the smallest part that keeps repeating.", ["star, moon", "star, star", "moon, moon"], "star, moon", numbers("Find the repeating unit.", ["star", "moon", "star", "moon"]), "repeating-unit", "Repeating unit", ["uses-whole-pattern-as-unit"]],
    ["Missing bead", "Red, yellow, red, yellow, red, __. What is missing?", "Match the pattern unit.", ["yellow", "red", "blue"], "yellow", numbers("Alternating beads.", ["red", "yellow", "red", "yellow", "red", "?"]), "missing-pattern", "Missing pattern parts", ["copies-nearest-colour"]],
    ["Movement pattern", "Jump, turn, clap, jump, turn, clap, __. What comes next?", "Repeat the movement unit.", ["jump", "turn", "clap"], "jump", numbers("Movement pattern.", ["jump", "turn", "clap", "jump", "turn", "clap", "?"]), "continue-pattern", "Continue patterns", ["loses-place-in-sequence"]],
    ["Copy pattern", "Which pattern matches blue, blue, green?", "Choose the same repeating structure.", ["red, red, yellow", "red, yellow, red", "yellow, red, red"], "red, red, yellow", numbers("AAB structure.", ["blue", "blue", "green"]), "structure-match", "Match structure", ["matches-colour-not-structure"]],
    ["Odd one out", "Which item breaks the pattern: square, circle, square, circle, triangle?", "Check what should come after circle.", ["triangle", "circle", "square"], "triangle", numbers("One item does not fit.", ["square", "circle", "square", "circle", "triangle"]), "pattern-error", "Find pattern errors", ["does-not-check-unit"]],
    ["Next two", "What are the next two items: dog, cat, dog, cat, ...?", "Continue the repeating pair.", ["dog, cat", "cat, dog", "dog, dog"], "dog, cat", numbers("Two-item repeat.", ["dog", "cat", "dog", "cat", "?", "?"]), "continue-pattern", "Continue patterns", ["reverses-next-pair"]],
    ["Longer unit", "Which part repeats in red, blue, green, red, blue, green?", "Find the smallest repeating group.", ["red, blue, green", "red, blue", "green, red"], "red, blue, green", numbers("Three-item repeating unit.", ["red", "blue", "green", "red", "blue", "green"]), "repeating-unit", "Repeating unit", ["short-unit-error"]],
    ["Create same pattern", "Which set follows the same pattern as clap, tap, tap?", "Look for ABB structure.", ["red, blue, blue", "red, red, blue", "blue, red, blue"], "red, blue, blue", numbers("ABB structure.", ["clap", "tap", "tap"]), "structure-match", "Match structure", ["surface-feature-match"]],
    ["Explain pattern", "What is happening in leaf, flower, leaf, flower?", "Choose the best rule.", ["leaf then flower repeats", "flowers get bigger", "only leaves repeat"], "leaf then flower repeats", numbers("Leaf and flower repeat.", ["leaf", "flower", "leaf", "flower"]), "rule-language", "Describe rules", ["unclear-rule-language"]],
  ],
  [
    ["Colour sort", "Which rule sorts red blocks together?", "Look at what is the same about the group.", ["same colour", "same size", "same number"], "same colour", numbers("A group of red blocks.", ["red", "red", "red"]), "sorting-rule", "Sorting rules", ["names-wrong-attribute"]],
    ["Shape sort", "Which object belongs with the circles?", "Use the shape rule.", ["circle", "square", "triangle"], "circle", numbers("Rule: circles only.", ["circle", "circle", "?"]), "belongs", "Belongs by rule", ["colour-over-shape"]],
    ["Does not fit", "A group has blue, blue, blue, red. Which one does not fit?", "Find the item that breaks the colour rule.", ["red", "blue", "all fit"], "red", numbers("Most items are blue.", ["blue", "blue", "blue", "red"]), "exception", "Rule exceptions", ["ignores-exception"]],
    ["Size rule", "Which rule matches big ball, big box, big cup?", "Focus on size.", ["big things", "round things", "red things"], "big things", numbers("Shared feature: big.", ["big ball", "big box", "big cup"]), "sorting-rule", "Sorting rules", ["shape-instead-of-size"]],
    ["Choose group", "Which item belongs in a group of things with wheels?", "Use the shared feature.", ["bike", "book", "sock"], "bike", numbers("Rule: has wheels.", ["car", "scooter", "?"]), "belongs", "Belongs by rule", ["category-feature-gap"]],
    ["Two groups", "Buttons are sorted into red and not red. Where does a blue button go?", "Check the rule for each group.", ["not red", "red", "both groups"], "not red", numbers("Groups: red and not red.", ["red group", "not red group"]), "classification", "Classification", ["binary-rule-confusion"]],
    ["Explain rule", "Stars and circles are together, squares are not. What could the rule be?", "Look for the shared feature.", ["round or curved shapes", "four-sided shapes", "only squares"], "round or curved shapes", numbers("Stars and circles grouped.", ["star", "circle", "square out"]), "rule-language", "Explain rules", ["over-specific-rule"]],
    ["Sort numbers", "Which number belongs with 2, 4, 6?", "Use the rule for the group.", ["8", "7", "9"], "8", numbers("Even number group.", [2, 4, 6, "?"]), "number-sorting", "Sort numbers", ["pattern-not-rule"]],
    ["Rule check", "Rule: animals that fly. Which does not belong?", "Apply the rule to each item.", ["fish", "bird", "bat"], "fish", numbers("Flying animals group.", ["bird", "bat", "fish"]), "exception", "Rule exceptions", ["real-world-feature-gap"]],
    ["Change rule", "A triangle was in the red group. What rule might have been used?", "Notice colour can be the rule, not shape.", ["red things", "triangles only", "big things"], "red things", numbers("A red triangle in a group.", ["red triangle", "red square"]), "rule-flexibility", "Flexible rules", ["assumes-one-rule-only"]],
    ["Sort by two rules", "Which item fits: small and blue?", "Check both parts of the rule.", ["small blue bead", "large blue bead", "small red bead"], "small blue bead", numbers("Rule has two features.", ["small", "blue"]), "two-feature-rule", "Two-feature rules", ["checks-one-feature-only"]],
    ["Best explanation", "Why does the red car belong with red blocks?", "Choose the shared feature.", ["They are red", "They are blocks", "They are the same toy"], "They are red", numbers("Different objects, same colour.", ["red car", "red block"]), "rule-language", "Explain rules", ["object-type-bias"]],
  ],
  [
    ["Grow by 2", "What comes next: 2, 4, 6, 8, ...?", "Look at how much is added each time.", ["10", "9", "12"], "10", numbers("Add 2 each time.", [2, 4, 6, 8, "?"]), "growing-rule", "Growing rules", ["counts-one-too-far"]],
    ["Tower growth", "Towers have 1, 3, 5 blocks. How many in the next tower?", "Each tower grows by 2 blocks.", ["7", "6", "8"], "7", groups("Growing towers.", [1, 3, 5, 7], ["stage 1", "stage 2", "stage 3", "next"]), "growing-pattern", "Growing patterns", ["uses-stage-number-only"]],
    ["Add 5", "What comes next: 5, 10, 15, 20, ...?", "Add the same amount again.", ["25", "30", "21"], "25", numbers("Add 5 each time.", [5, 10, 15, 20, "?"]), "growing-rule", "Growing rules", ["adds-last-digit"]],
    ["Describe change", "A pattern goes 3, 6, 9, 12. What happens each time?", "Compare neighbouring values.", ["add 3", "add 6", "double"], "add 3", numbers("Find the change.", [3, 6, 9, 12]), "describe-change", "Describe change", ["confuses-term-with-change"]],
    ["Picture growth", "Stage 1 has 4 tiles, stage 2 has 7, stage 3 has 10. Stage 4 has?", "Keep adding 3.", ["13", "12", "14"], "13", groups("Tile stages.", [4, 7, 10, 13], ["1", "2", "3", "4"]), "growing-pattern", "Growing patterns", ["off-by-one-stage"]],
    ["Find missing term", "6, 8, __, 12. Which number is missing?", "The pattern adds 2.", ["10", "9", "11"], "10", numbers("Missing term in add 2 pattern.", [6, 8, "?", 12]), "missing-term", "Missing terms", ["fills-random-middle"]],
    ["Continue shapes", "A row adds one square each step: 2, 3, 4. What is next?", "Use the same growth.", ["5", "6", "4"], "5", groups("Add one square each step.", [2, 3, 4, 5], ["1", "2", "3", "next"]), "growing-pattern", "Growing patterns", ["repeats-last-term"]],
    ["Rule choice", "Which rule fits 4, 8, 12, 16?", "Look for the same change.", ["add 4 each time", "add 8 each time", "take 4 each time"], "add 4 each time", numbers("Rule for the sequence.", [4, 8, 12, 16]), "rule-choice", "Rule choice", ["uses-first-number-as-rule"]],
    ["Predict further", "A pattern starts 2, 5, 8. What is the fifth number?", "Keep adding 3: 2, 5, 8, 11, 14.", ["14", "11", "13"], "14", numbers("Predict the fifth term.", [2, 5, 8, 11, 14]), "predict", "Predict terms", ["answers-next-not-fifth"]],
    ["Same change", "Which pattern grows in the same way as 1, 4, 7?", "Find another add 3 pattern.", ["2, 5, 8", "2, 4, 8", "3, 6, 12"], "2, 5, 8", numbers("Same change of 3.", ["1,4,7", "2,5,8"]), "compare-rules", "Compare rules", ["matches-start-not-change"]],
    ["Spot error", "Which number breaks the pattern 10, 13, 16, 20, 22?", "The rule should add 3 each time.", ["20", "22", "13"], "20", numbers("Add 3 pattern with one error.", [10, 13, 16, 20, 22]), "pattern-error", "Find errors", ["does-not-check-each-step"]],
    ["Explain next", "Why is 18 next in 6, 9, 12, 15, ...?", "Choose the rule-based explanation.", ["add 3 each time", "18 is even", "15 plus 15 is 30"], "add 3 each time", numbers("Explain the next term.", [6, 9, 12, 15, 18]), "reasoning", "Pattern reasoning", ["weak-explanation"]],
  ],
  [
    ["Missing add", "What number makes 7 + __ = 10 true?", "Think what must be added to 7.", ["3", "2", "17"], "3", numbers("Missing addend.", [7, "+", "?", "=", 10]), "missing-number", "Missing numbers", ["adds-all-numbers"]],
    ["Missing subtract", "What number makes 12 - __ = 8 true?", "Think how far 12 goes down to 8.", ["4", "5", "20"], "4", numbers("Missing subtractor.", [12, "-", "?", "=", 8]), "missing-number", "Missing numbers", ["inverse-operation-error"]],
    ["Input-output add", "A machine adds 4. Input 6 gives output?", "Add 4 to the input.", ["10", "9", "2"], "10", numbers("Input-output: add 4.", ["in 6", "out ?"]), "input-output", "Input-output rules", ["uses-input-only"]],
    ["Find rule", "Input 3 gives 8. Input 5 gives 10. Which rule fits?", "Compare each output with its input.", ["add 5", "add 3", "double"], "add 5", numbers("Rule table.", ["3 -> 8", "5 -> 10"]), "rule-choice", "Rule choice", ["uses-one-row-only"]],
    ["Output table", "Rule: double. Input 7 gives output?", "Double the input.", ["14", "9", "7"], "14", numbers("Double machine.", ["in 7", "out ?"]), "input-output", "Input-output rules", ["adds-two-instead"]],
    ["Missing input", "Rule: add 6. Output is 15. What was the input?", "Use the inverse and subtract 6.", ["9", "21", "6"], "9", numbers("Find input for add 6.", ["in ?", "out 15"]), "inverse-thinking", "Inverse thinking", ["adds-instead-of-subtracts"]],
    ["True sentence", "Which sentence is true?", "Check both sides.", ["8 + 5 = 13", "8 + 5 = 12", "8 + 5 = 15"], "8 + 5 = 13", numbers("Check number sentences.", ["8+5", 13]), "truth-check", "Check truth", ["equals-as-answer-only"]],
    ["Balance missing", "9 + 4 = __ + 5. What number is missing?", "Both sides must total 13.", ["8", "9", "4"], "8", numbers("Balanced sentence.", ["9+4", "?+5"]), "balance", "Balance", ["balances-last-number-only"]],
    ["Machine chain", "A machine adds 3, then doubles. Start with 4. What comes out?", "Do the steps in order.", ["14", "11", "10"], "14", numbers("4 -> add 3 -> 7 -> double -> 14.", [4, 7, 14]), "rule-sequence", "Rule sequences", ["wrong-order-error"]],
    ["Complete table", "Rule: subtract 2. Input 11 gives output?", "Subtract 2 from 11.", ["9", "13", "2"], "9", numbers("Input-output: subtract 2.", ["11 -> ?"]), "input-output", "Input-output rules", ["operation-direction-error"]],
    ["Which fits", "Which input-output pair fits the rule add 7?", "Check output = input + 7.", ["4 -> 11", "4 -> 7", "4 -> 14"], "4 -> 11", numbers("Check add 7.", ["4 -> 11"]), "rule-check", "Check rules", ["matches-number-in-rule-only"]],
    ["Unknown in context", "There are 18 stickers after adding 6 more. How many were there first?", "Undo adding 6.", ["12", "24", "6"], "12", numbers("Unknown start.", ["?", "+6", "=18"]), "inverse-thinking", "Inverse thinking", ["uses-final-as-start"]],
  ],
  [
    ["Table add 3", "Rule: output = input + 3. What output matches input 8?", "Use the rule row by row.", ["11", "8", "5"], "11", numbers("Input-output table.", ["8 -> ?", "+3"]), "tables", "Tables", ["does-not-apply-rule"]],
    ["Find table rule", "Which rule fits 2 -> 6, 4 -> 12, 5 -> 15?", "Compare output to input.", ["multiply by 3", "add 4", "multiply by 2"], "multiply by 3", numbers("Table rule.", ["2->6", "4->12", "5->15"]), "rule-choice", "Rule choice", ["additive-rule-bias"]],
    ["Extend table", "A table follows multiply by 4. Input 6 gives output?", "Multiply the input by 4.", ["24", "10", "18"], "24", numbers("Multiply by 4 table.", ["6 -> ?"]), "tables", "Tables", ["adds-factor"]],
    ["Missing row", "Rule: output = input - 5. Which row is correct?", "Subtract 5 from the input.", ["12 -> 7", "12 -> 17", "12 -> 5"], "12 -> 7", numbers("Subtract 5 table.", ["12 -> ?"]), "tables", "Tables", ["operation-direction-error"]],
    ["Describe rule", "A pattern is 1, 4, 7, 10. Which rule describes it?", "Look at the change between terms.", ["start at 1 and add 3", "start at 3 and add 1", "double each time"], "start at 1 and add 3", numbers("Sequence rule.", [1, 4, 7, 10]), "number-patterns", "Number patterns", ["incomplete-rule"]],
    ["Step table", "Stage 1 has 5 tiles, stage 2 has 8, stage 3 has 11. Stage 4 has?", "Use the table rule add 3.", ["14", "13", "16"], "14", groups("Tile pattern table.", [5, 8, 11, 14], ["1", "2", "3", "4"]), "growing-patterns", "Growing patterns", ["stage-count-confusion"]],
    ["Input 0", "Rule: output = 2 x input + 1. What is the output when input is 0?", "Substitute 0 carefully.", ["1", "0", "2"], "1", numbers("Use 2 x input + 1.", ["input 0", "output ?"]), "tables", "Tables", ["zero-input-error"]],
    ["Compare rules", "Which table follows add 4?", "Check each row with the same rule.", ["1 -> 5, 2 -> 6, 3 -> 7", "1 -> 4, 2 -> 8, 3 -> 12", "1 -> 5, 2 -> 7, 3 -> 9"], "1 -> 5, 2 -> 6, 3 -> 7", numbers("Add 4 table.", ["1->5", "2->6", "3->7"]), "rule-check", "Check rules", ["checks-one-row-only"]],
    ["Term rule", "The rule is term = 3 x stage + 2. Stage 4 has?", "Multiply 4 by 3, then add 2.", ["14", "12", "17"], "14", numbers("Stage rule.", ["3 x 4 + 2"]), "rule-use", "Use rules", ["wrong-operation-order"]],
    ["Which input", "Rule: output = input x 5. Which input gives output 35?", "Use inverse thinking.", ["7", "30", "5"], "7", numbers("Find input.", ["? x 5 = 35"]), "inverse-table", "Inverse tables", ["divides-wrong-way"]],
    ["Complete pattern", "A number pattern starts 9, 14, 19. Which table row comes next?", "Add 5 each time.", ["4 -> 24", "4 -> 20", "4 -> 19"], "4 -> 24", numbers("Stage and term table.", ["1->9", "2->14", "3->19", "4->?"]), "tables", "Tables", ["answers-stage-number"]],
    ["Rule in words", "Which words match output = input x 2 - 1?", "Translate the operations in order.", ["double the input, then subtract 1", "subtract 1, then double", "add 2, then subtract 1"], "double the input, then subtract 1", numbers("Rule card.", ["input", "x2", "-1", "output"]), "rule-language", "Rule language", ["operation-order-language"]],
  ],
  [
    ["Same result", "Which expression has the same value as 6 + 4?", "Find another way to make 10.", ["5 + 5", "6 + 5", "4 + 4"], "5 + 5", numbers("Equivalent totals.", ["6+4", "5+5"]), "equivalence", "Equivalence", ["matches-shared-number"]],
    ["Equivalent split", "Which is equivalent to 8 x 5?", "Use known facts or grouping.", ["4 x 10", "8 + 5", "8 x 4"], "4 x 10", groups("Both show 40.", [40, 40], ["8x5", "4x10"]), "equivalence", "Equivalence", ["operation-confusion"]],
    ["General rule", "Which rule fits 3, 6, 9, 12?", "Describe what is always true.", ["multiples of 3", "all numbers over 5", "add 6"], "multiples of 3", numbers("General rule.", [3, 6, 9, 12]), "generalising", "Generalising", ["over-specific-rule"]],
    ["Always true", "Which statement is always true for 5 + n?", "Think about what changing n does.", ["It is 5 more than n", "It is always 5", "It is always even"], "It is 5 more than n", numbers("Expression meaning.", ["n", "n+5"]), "generalising", "Generalising", ["variable-as-fixed"]],
    ["Equivalent rule", "Which rule gives the same output as add 6 then add 4?", "Combine the changes.", ["add 10", "add 2", "multiply by 10"], "add 10", numbers("Equivalent rule.", ["+6", "+4", "+10"]), "equivalent-rules", "Equivalent rules", ["keeps-steps-separated"]],
    ["Use property", "Which expression matches 7 x 6 using a split?", "Split 6 into 5 and 1.", ["7 x 5 + 7 x 1", "7 + 5 + 1", "6 x 5 + 1"], "7 x 5 + 7 x 1", groups("Split multiplication.", [35, 7], ["7x5", "7x1"]), "equivalent-expressions", "Equivalent expressions", ["distribution-gap"]],
    ["Same relationship", "Which pair has the same relationship as 4 -> 9?", "This rule adds 5.", ["7 -> 12", "7 -> 14", "7 -> 5"], "7 -> 12", numbers("Same add 5 relationship.", ["4->9", "7->12"]), "relationship-match", "Relationship match", ["same-difference-gap"]],
    ["Not equivalent", "Which expression is not equivalent to 3 x 8?", "Compare the values.", ["3 + 8", "8 + 8 + 8", "6 x 4"], "3 + 8", numbers("Check equivalence.", ["3x8", "3+8"]), "equivalence", "Equivalence", ["operation-symbol-confusion"]],
    ["Write general rule", "A pattern has 2 tiles at stage 1, 4 at stage 2, 6 at stage 3. Which rule fits?", "Use stage number n.", ["2 x n", "n + 2", "2 + n"], "2 x n", numbers("Stage n rule.", ["1->2", "2->4", "3->6"]), "generalising", "Generalising", ["uses-additive-rule"]],
    ["Equivalent sentence", "Which sentence keeps the balance of 9 + 6 = 15?", "Use another expression for 15.", ["9 + 6 = 10 + 5", "9 + 6 = 10 + 6", "9 + 6 = 9 + 5"], "9 + 6 = 10 + 5", numbers("Balanced equivalents.", ["9+6", "10+5"]), "balance", "Balance", ["one-side-change-only"]],
    ["Explain equivalence", "Why are n + 3 + 2 and n + 5 equivalent?", "Combine the constants.", ["3 + 2 is 5", "n is 5", "they use different letters"], "3 + 2 is 5", numbers("Combine constants.", ["n+3+2", "n+5"]), "equivalent-expressions", "Equivalent expressions", ["variable-value-confusion"]],
    ["Check a claim", "A learner says x + x is the same as x + 2 for every x. Which value shows it is not always true?", "Test a value.", ["x = 3", "x = 2", "x = 0"], "x = 3", numbers("Test the claim.", ["x+x", "x+2", "x=3"]), "counterexample", "Counterexamples", ["checks-one-fitting-case-only"]],
  ],
  [
    ["Symbol meaning", "In n + 4, what does n stand for?", "Think about the unknown or changing number.", ["a number", "the plus sign", "always 4"], "a number", numbers("Expression card.", ["n", "+", 4]), "variables", "Variables", ["letter-as-label-only"]],
    ["Unknown total", "A box has b books. Then 3 more are added. Which expression shows the total?", "Use b for the starting books.", ["b + 3", "3 - b", "b x 3"], "b + 3", numbers("Books context.", ["b books", "+3"]), "expression-match", "Expression match", ["wrong-operation-context"]],
    ["Changing value", "Which symbol could show the number of tickets bought?", "Use a letter as a placeholder.", ["t", "=", "+"], "t", numbers("Ticket variable.", ["t tickets"]), "variables", "Variables", ["symbol-type-confusion"]],
    ["Substitute", "If x = 5, what is x + 7?", "Replace x with 5.", ["12", "7", "5"], "12", numbers("Substitution.", ["x=5", "x+7"]), "substitution", "Substitution", ["does-not-replace-variable"]],
    ["Rule with n", "A pattern has n stages and 2 tiles are added each stage. Which expression shows 2 times n?", "Choose the expression for two groups of n.", ["2n", "n + 2", "n - 2"], "2n", groups("Two equal copies of n.", [2, 2], ["n", "n"]), "expression-match", "Expression match", ["additive-vs-multiplicative"]],
    ["Unknown equation", "Which equation shows a number plus 6 equals 14?", "Use a symbol for the unknown number.", ["a + 6 = 14", "a - 6 = 14", "6a = 14"], "a + 6 = 14", numbers("Unknown plus 6.", ["a", "+6", "=14"]), "equations", "Equations", ["operation-translation-error"]],
    ["What changes", "In y = 3x, which value changes when x changes?", "Think about related values.", ["y", "the equals sign", "3 only"], "y", numbers("Related variables.", ["x", "3x", "y"]), "variables", "Variables", ["constant-variable-confusion"]],
    ["Use letter rule", "Rule: output is 4 more than input p. Which expression shows output?", "Translate '4 more than p'.", ["p + 4", "4 - p", "4p"], "p + 4", numbers("Rule card.", ["p", "+4"]), "rule-notation", "Rule notation", ["word-order-error"]],
    ["Check variable value", "If m = 10, which statement is true?", "Substitute 10 for m.", ["m - 3 = 7", "m - 3 = 13", "m + 3 = 10"], "m - 3 = 7", numbers("m equals 10.", ["m=10", "m-3"]), "substitution", "Substitution", ["sign-error"]],
    ["Symbol in context", "A plant is h cm tall. It grows 5 cm. Which expression shows its new height?", "Keep the starting height as h.", ["h + 5", "5h", "h - 5"], "h + 5", numbers("Height context.", ["h cm", "+5 cm"]), "expression-match", "Expression match", ["multiplication-for-addition"]],
    ["Unknown difference", "Which expression means 8 less than q?", "Less than means subtract from q.", ["q - 8", "8 - q", "q + 8"], "q - 8", numbers("Difference expression.", ["q", "-8"]), "expression-language", "Expression language", ["reverse-subtraction-error"]],
    ["Variable is not fixed", "Which statement is true about k in k + 1?", "A variable can stand for different values.", ["k can change", "k must be 1", "k is the answer sign"], "k can change", numbers("Variable card.", ["k", "k+1"]), "variables", "Variables", ["variable-fixed-misconception"]],
  ],
  [
    ["Write expression", "Which expression matches 'a number plus 9'?", "Use a letter for the number.", ["n + 9", "n - 9", "9n"], "n + 9", numbers("Translate words to expression.", ["number", "+9"]), "expressions", "Expressions", ["operation-translation-error"]],
    ["Equation from story", "A bag has p pencils. 4 are added to make 15. Which equation fits?", "Connect each part of the story.", ["p + 4 = 15", "p - 4 = 15", "4p = 15"], "p + 4 = 15", numbers("Pencil story.", ["p", "+4", "=15"]), "equations", "Equations", ["wrong-operation-context"]],
    ["Interpret 3x", "What does 3x mean in a tile pattern?", "Think of 3 times the value of x.", ["3 groups of x", "x plus 3 only", "x divided by 3"], "3 groups of x", groups("Three copies of x.", [3, 3, 3], ["x", "x", "x"]), "expression-meaning", "Expression meaning", ["coefficient-as-addend"]],
    ["Check equation", "If x = 6, which equation is true?", "Substitute 6.", ["x + 4 = 10", "x + 4 = 8", "x - 4 = 10"], "x + 4 = 10", numbers("Check with x=6.", ["x+4", 10]), "substitution", "Substitution", ["does-not-check-both-sides"]],
    ["Interpret equation", "What does a + 5 = 12 tell you?", "Read the equation as a relationship.", ["a plus 5 is 12", "a is always 5", "12 plus 5 is a"], "a plus 5 is 12", numbers("Equation meaning.", ["a", "+5", "=12"]), "equation-meaning", "Equation meaning", ["equals-as-command"]],
    ["Expression from table", "A table rule is input x 2 + 1. Which expression shows the output for input n?", "Use n for the input.", ["2n + 1", "n + 2 + 1", "2 + n"], "2n + 1", numbers("Rule table.", ["n", "x2", "+1"]), "rule-notation", "Rule notation", ["operation-order-error"]],
    ["Missing notation", "Which equation shows 'twice a number is 18'?", "Twice means multiply by 2.", ["2n = 18", "n + 2 = 18", "n - 2 = 18"], "2n = 18", groups("Twice the unknown.", [2, 2], ["n", "n"]), "equations", "Equations", ["twice-as-add-two"]],
    ["Evaluate expression", "If t = 4, what is 5t + 2?", "Multiply first, then add.", ["22", "13", "30"], "22", numbers("Evaluate 5t+2.", ["t=4", "5x4+2"]), "substitution", "Substitution", ["order-error"]],
    ["Which story", "Which story matches 7 + c?", "Look for a fixed 7 plus a changing amount.", ["7 stickers plus c more", "7 groups of c", "c fewer than 7"], "7 stickers plus c more", numbers("Expression-story match.", ["7", "+", "c"]), "story-match", "Story match", ["operation-context-confusion"]],
    ["Equation solution check", "Which value makes y - 3 = 9 true?", "Add 3 to both sides or test the options.", ["12", "6", "9"], "12", numbers("Check y-3=9.", ["y", "-3", "=9"]), "solution-check", "Solution check", ["inverse-error"]],
    ["Equivalent expression", "Which expression is equivalent to 4n + 2n?", "Combine like terms.", ["6n", "6 + n", "8n"], "6n", groups("Four n plus two n.", [4, 2], ["n groups", "n groups"]), "equivalent-expressions", "Equivalent expressions", ["adds-coefficients-to-variable"]],
    ["Interpret variables", "In c = 12p, what does 12 likely represent if p is packets and c is counters?", "Read the relationship.", ["12 counters per packet", "12 packets per counter", "12 unknowns"], "12 counters per packet", groups("Each packet has 12 counters.", [12, 12], ["packet", "packet"]), "context-meaning", "Context meaning", ["variable-role-confusion"]],
  ],
  [
    ["Balance idea", "Which move keeps x + 5 = 12 balanced?", "Do the same inverse step to both sides.", ["subtract 5 from both sides", "subtract 5 from the left only", "add 12 to both sides"], "subtract 5 from both sides", numbers("Balanced equation.", ["x+5", "=", 12]), "balance", "Balance", ["one-side-only-error"]],
    ["Solve addition", "Solve x + 7 = 15.", "Undo adding 7.", ["8", "22", "7"], "8", numbers("x + 7 = 15.", ["x", "+7", "=15"]), "solve-equations", "Solve equations", ["adds-instead-of-subtracts"]],
    ["Solve subtraction", "Solve y - 4 = 11.", "Undo subtracting 4.", ["15", "7", "44"], "15", numbers("y - 4 = 11.", ["y", "-4", "=11"]), "solve-equations", "Solve equations", ["subtracts-again"]],
    ["Solve multiply", "Solve 3a = 18.", "Divide by 3.", ["6", "15", "54"], "6", groups("Three equal a groups make 18.", [6, 6, 6], ["a", "a", "a"]), "solve-equations", "Solve equations", ["multiplies-again"]],
    ["Solve divide", "Solve b / 5 = 4.", "Undo dividing by 5.", ["20", "9", "1"], "20", numbers("b divided by 5 equals 4.", ["b/5", "=", 4]), "solve-equations", "Solve equations", ["division-inverse-error"]],
    ["Check solution", "Which value checks x - 6 = 13?", "Test each value.", ["19", "7", "13"], "19", numbers("Check x - 6 = 13.", ["x", "-6", "=13"]), "solution-check", "Check solutions", ["does-not-substitute"]],
    ["Two-step solve", "Solve 2x + 3 = 11.", "Subtract 3, then divide by 2.", ["4", "7", "5"], "4", numbers("Two-step equation.", ["2x", "+3", "=11"]), "two-step", "Two-step equations", ["wrong-step-order"]],
    ["Balance scale", "A balance shows x + 2 on one side and 9 on the other. What is x?", "Remove 2 from both sides.", ["7", "11", "2"], "7", groups("Balance model.", [7, 2, 9], ["x", "2", "total"]), "balance", "Balance", ["total-vs-unknown"]],
    ["Equation in context", "A ticket and $4 costs $16. Ticket cost is t. Which equation and value fit?", "Set up then solve.", ["t + 4 = 16, t = 12", "t - 4 = 16, t = 20", "4t = 16, t = 4"], "t + 4 = 16, t = 12", numbers("Ticket context.", ["t", "+$4", "=$16"]), "context-equations", "Context equations", ["wrong-model"]],
    ["Keep balance", "If 5x = 30, which first step is sensible?", "Undo multiplying by 5.", ["divide both sides by 5", "subtract 5 from both sides", "add 30 to both sides"], "divide both sides by 5", numbers("Solve 5x = 30.", ["5x", "=", 30]), "balance", "Balance", ["uses-additive-inverse"]],
    ["Find error", "A learner solves x + 9 = 20 by writing x = 29. What went wrong?", "They should undo adding 9.", ["They added 9 instead of subtracting 9", "They divided by 9", "They used the correct inverse"], "They added 9 instead of subtracting 9", numbers("Error analysis.", ["x+9=20", "x=29"]), "error-analysis", "Error analysis", ["inverse-error"]],
    ["Explain check", "Why does x = 6 solve 4x = 24?", "Substitute and check both sides.", ["4 x 6 equals 24", "6 plus 4 equals 24", "24 minus 6 equals 4"], "4 x 6 equals 24", groups("Four groups of 6.", [6, 6, 6, 6], ["x", "x", "x", "x"]), "reasoning", "Equation reasoning", ["weak-check-explanation"]],
  ],
  [
    ["Table to rule", "Which rule fits x: 1, 2, 3 and y: 3, 6, 9?", "Compare y with x.", ["y = 3x", "y = x + 3", "y = x - 3"], "y = 3x", numbers("Table values.", ["1->3", "2->6", "3->9"]), "representations", "Representations", ["additive-rule-bias"]],
    ["Rule to table", "Rule y = x + 4. Which row is correct?", "Add 4 to x.", ["x=5, y=9", "x=5, y=20", "x=5, y=1"], "x=5, y=9", numbers("Use y=x+4.", ["x=5", "y=?"]), "tables", "Tables", ["wrong-operation"]],
    ["Graph point", "Which point fits y = 2x?", "Double x to get y.", ["(4, 8)", "(4, 6)", "(8, 4)"], "(4, 8)", numbers("Coordinate pair.", ["x=4", "y=8"]), "graphs", "Graphs", ["coordinate-order-error"]],
    ["Same relationship", "Which table and rule match?", "Check the row with the rule.", ["1->5, 2->6 and y=x+4", "1->5, 2->10 and y=x+4", "1->5, 2->7 and y=2x"], "1->5, 2->6 and y=x+4", numbers("Match table and rule.", ["1->5", "2->6", "y=x+4"]), "representation-match", "Match representations", ["checks-one-value-only"]],
    ["Graph meaning", "A graph of y = 5x goes through (0,0) and (2,10). What is the rate of change?", "Look at how much y changes for each x.", ["5", "10", "2"], "5", numbers("Graph points.", ["0,0", "2,10", "rate 5"]), "graphs", "Graphs", ["uses-y-value-as-rate"]],
    ["Input-output graph", "A table has x: 0,1,2 and y: 1,3,5. Which rule fits?", "y increases by 2 and starts at 1.", ["y = 2x + 1", "y = x + 2", "y = 3x"], "y = 2x + 1", numbers("Table to linear rule.", ["0->1", "1->3", "2->5"]), "functional-rules", "Functional rules", ["ignores-start-value"]],
    ["Plot check", "Which point does not fit y = x + 2?", "Check y is 2 more than x.", ["(3, 4)", "(4, 6)", "(1, 3)"], "(3, 4)", numbers("Check points.", ["y=x+2", "(3,4)"]), "graphs", "Graphs", ["point-not-checked"]],
    ["Rule comparison", "Which rule has outputs that grow faster?", "Compare the multiplier on x.", ["y = 4x", "y = x + 4", "y = 2x"], "y = 4x", numbers("Compare rules.", ["4x", "x+4", "2x"]), "functional-rules", "Functional rules", ["constant-vs-rate-confusion"]],
    ["Table extension", "For y = 3x + 2, what is y when x = 6?", "Multiply first, then add 2.", ["20", "18", "11"], "20", numbers("Use rule y=3x+2.", ["x=6", "3x+2"]), "tables", "Tables", ["operation-order-error"]],
    ["Context graph", "A plant starts at 4 cm and grows 2 cm each week. Which rule fits height h after w weeks?", "Start value plus weekly growth.", ["h = 2w + 4", "h = 4w + 2", "h = 2w"], "h = 2w + 4", numbers("Plant growth.", ["start 4", "+2 each week"]), "context-rules", "Context rules", ["missing-start-value"]],
    ["Interpret slope", "In y = 6x, what happens when x increases by 1?", "Use the coefficient of x.", ["y increases by 6", "y increases by 1", "y becomes 6"], "y increases by 6", numbers("Rate of change.", ["x +1", "y +6"]), "graphs", "Graphs", ["rate-language-gap"]],
    ["Representation choice", "Which representation best shows how every input links to an output?", "Choose a structured function representation.", ["input-output table", "single number only", "unlabelled picture"], "input-output table", numbers("Input-output links.", ["x", "rule", "y"]), "representations", "Representations", ["representation-purpose-gap"]],
  ],
  [
    ["Cost model", "A hall costs $50 plus $10 per hour. Which model gives cost c for h hours?", "Use fixed cost plus hourly cost.", ["c = 50 + 10h", "c = 50h + 10", "c = 10h"], "c = 50 + 10h", numbers("Hire cost model.", ["$50", "+$10 per hour"]), "modelling", "Modelling", ["fixed-cost-position-error"]],
    ["Predict from model", "If c = 3n + 2, what is c when n = 8?", "Substitute 8 into the model.", ["26", "24", "11"], "26", numbers("Use c=3n+2.", ["n=8", "c=?"]), "prediction", "Prediction", ["operation-order-error"]],
    ["Choose model", "A pattern starts with 5 tiles and adds 4 each stage. Which model fits stage s?", "Start value plus repeated growth.", ["T = 4s + 1", "T = 5s + 4", "T = s + 4"], "T = 4s + 1", numbers("Stage pattern.", ["1->5", "+4 each stage"]), "modelling", "Modelling", ["start-stage-adjustment-gap"]],
    ["Compare models", "Which model grows faster?", "Compare the coefficient of x.", ["y = 7x + 2", "y = 3x + 20", "y = x + 50"], "y = 7x + 2", numbers("Model comparison.", ["7x+2", "3x+20", "x+50"]), "model-comparison", "Model comparison", ["starting-value-bias"]],
    ["Model context", "A taxi costs $6 booking fee plus $2 per km. What does 2 represent in c = 6 + 2k?", "Connect the coefficient to the context.", ["cost per kilometre", "booking fee", "number of taxis"], "cost per kilometre", numbers("Taxi model.", ["c=6+2k"]), "context-meaning", "Context meaning", ["coefficient-context-gap"]],
    ["Use table", "A model is y = 5x - 1. Which row is correct?", "Substitute the x value.", ["x=4, y=19", "x=4, y=20", "x=4, y=15"], "x=4, y=19", numbers("Model table.", ["5x-1", "x=4"]), "prediction", "Prediction", ["subtract-part-ignored"]],
    ["Reasonable model", "Which model matches 'double a number, then subtract 3'?", "Translate the words in order.", ["y = 2x - 3", "y = x - 6", "y = 3x - 2"], "y = 2x - 3", numbers("Rule words.", ["double x", "-3"]), "modelling", "Modelling", ["order-language-error"]],
    ["Inverse use", "A model p = 4b gives pencils for boxes. If p = 28, what is b?", "Use inverse reasoning.", ["7", "24", "112"], "7", groups("Four pencils per box.", [4, 4, 4, 4, 4, 4, 4], ["box", "box", "box", "box", "box", "box", "box"]), "inverse-model", "Inverse models", ["multiplies-instead-of-divides"]],
    ["Model fit", "Which table fits y = 2x + 5?", "Check each row.", ["0->5, 2->9, 4->13", "0->2, 2->5, 4->8", "0->0, 2->4, 4->8"], "0->5, 2->9, 4->13", numbers("Model fit table.", ["0->5", "2->9", "4->13"]), "model-check", "Check models", ["ignores-intercept"]],
    ["Compare prediction", "For y = 2x + 10, which prediction is correct for x = 15?", "Multiply, then add.", ["40", "30", "25"], "40", numbers("Predict y.", ["2x+10", "x=15"]), "prediction", "Prediction", ["adds-before-multiplies"]],
    ["Practical variable", "In A = lw for rectangle area, what does w represent?", "Read the model variables.", ["width", "whole number", "weight only"], "width", numbers("Area model.", ["A", "=", "l", "x", "w"]), "context-meaning", "Context meaning", ["variable-name-confusion"]],
    ["Model choice", "Which situation is best modelled by y = 12x?", "Look for 12 for each one.", ["12 stickers in each pack", "$12 start fee plus $1 each", "12 fewer each time"], "12 stickers in each pack", groups("12 per pack.", [12, 12, 12], ["pack", "pack", "pack"]), "model-choice", "Model choice", ["fixed-vs-per-confusion"]],
  ],
  [
    ["Check claim", "A learner says 2n + 3 is the same as 2(n + 3). Which value shows the claim is false?", "Test a value and compare.", ["n = 1", "n = 0", "n = 3"], "n = 1", numbers("2n+3 vs 2(n+3).", ["n=1", "5 vs 8"]), "checking", "Check claims", ["checks-one-side-only"]],
    ["Clear explanation", "Which explanation best supports 3(x + 2) = 3x + 6?", "Use the distributive idea.", ["3 groups of x + 2 gives 3x and 6", "3 plus 2 is 5", "x must be 6"], "3 groups of x + 2 gives 3x and 6", groups("Three groups of x plus 2.", [3, 6], ["3x", "6"]), "communication", "Communicate reasoning", ["weak-justification"]],
    ["General statement", "Which statement is always true?", "Check the structure, not one example.", ["n + n = 2n", "n + 2 = 2n", "n - 1 = n"], "n + n = 2n", groups("Two copies of n.", [2, 2], ["n", "n"]), "generalising", "Generalising", ["single-example-generalisation"]],
    ["Find error", "A learner simplifies 4a + 3a to 7a squared. What went wrong?", "Like terms add coefficients.", ["They changed a to a squared", "They added the coefficients", "They subtracted the terms"], "They changed a to a squared", numbers("Like terms.", ["4a+3a", "7a"]), "error-analysis", "Error analysis", ["exponent-confusion"]],
    ["Reasonable answer", "For y = 8x + 2 and x = 10, which estimate is reasonable?", "8 x 10 plus a little more.", ["about 82", "about 18", "about 800"], "about 82", numbers("Estimate model value.", ["8x+2", "x=10"]), "checking", "Check reasonableness", ["scale-estimate-error"]],
    ["Critique rule", "A table is 1->4, 2->7, 3->10. Which rule fits all rows?", "Find the start and change.", ["y = 3x + 1", "y = 4x", "y = x + 4"], "y = 3x + 1", numbers("Check all rows.", ["1->4", "2->7", "3->10"]), "rule-critique", "Rule critique", ["checks-one-row-only"]],
    ["Counterexample", "Which value disproves 'x + 4 is always even'?", "Find one value that makes it odd.", ["x = 1", "x = 2", "x = 4"], "x = 1", numbers("Counterexample.", ["1+4=5"]), "counterexample", "Counterexamples", ["tests-fitting-only"]],
    ["Method comparison", "Which methods both solve 5x = 45?", "Compare valid inverse methods.", ["divide by 5 or ask 5 times what is 45", "subtract 5 or add 45", "multiply by 5 or divide by 45"], "divide by 5 or ask 5 times what is 45", groups("Five equal groups make 45.", [9, 9, 9, 9, 9], ["x", "x", "x", "x", "x"]), "method-comparison", "Compare methods", ["method-validity-gap"]],
    ["Explain graph", "A line for y = 2x + 3 starts at 3. What does that show?", "Interpret the starting value.", ["the value when x is 0 is 3", "the rate is 3", "x is always 3"], "the value when x is 0 is 3", numbers("Graph start.", ["x=0", "y=3"]), "communication", "Communicate reasoning", ["intercept-rate-confusion"]],
    ["Check solution", "Which check proves x = 4 solves 2x + 5 = 13?", "Substitute 4.", ["2 x 4 + 5 = 13", "2 + 4 + 5 = 11", "4 + 5 = 13"], "2 x 4 + 5 = 13", numbers("Substitution check.", ["x=4", "2x+5"]), "checking", "Check solutions", ["partial-substitution"]],
    ["Generalise pattern", "A pattern has terms 6, 11, 16. Which rule is likely for term n?", "Use the common difference and first term.", ["5n + 1", "6n + 5", "n + 5"], "5n + 1", numbers("Term rule.", ["1->6", "2->11", "3->16"]), "generalising", "Generalising", ["uses-first-term-as-coefficient"]],
    ["Choose clear conclusion", "Which conclusion is clearest after testing a rule in a table?", "State the evidence and the decision.", ["The rule works for every row shown, so it fits this table", "The rule looks nice", "The numbers are big"], "The rule works for every row shown, so it fits this table", numbers("Communication card.", ["check rows", "state conclusion"]), "communication", "Communicate reasoning", ["unsupported-conclusion"]],
  ],
];

const ALGEBRA_CASES: AlgebraCase[][] = RAW_ALGEBRA_CASES.map((cases) =>
  cases.map(makeCase),
);

export const ALGEBRA_PATTERNS_FUNCTIONS_STEP_SPECS: AlgebraPatternsFunctionsStepSpec[] =
  ALGEBRA_STEP_TITLES.map(
    ([title, stepKey, stageKey, stageTitle, stepNumber, shortTitle, description], index) => ({
      order: index + 1,
      stepNumber,
      stageKey,
      stageTitle,
      stepKey,
      pathwayStepId: `mathematics::algebra-patterns-and-functions::${stageKey}::${stepKey}`,
      title,
      shortTitle,
      description,
      cases: ALGEBRA_CASES[index],
    }),
  );

export const ALGEBRA_PATTERNS_FUNCTIONS_STEP_ASSESSMENTS:
  AlgebraPatternsFunctionsStepAssessment[] =
  ALGEBRA_PATTERNS_FUNCTIONS_STEP_SPECS.map((spec) => ({
    key: `algebra-patterns-functions-step-${spec.order}-${spec.stepKey}-assessment-v1`,
    stepNumber: spec.stepNumber,
    stepKey: spec.stepKey,
    pathwayStepId: spec.pathwayStepId,
    title: spec.title,
    shortTitle: spec.shortTitle,
    description: spec.description,
    subjectKey: "mathematics",
    strandKey: ALGEBRA_PATTERNS_FUNCTIONS_STRAND_KEY,
    stageKey: spec.stageKey,
    parentBankKey: ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_KEY,
    parentBankTitle: ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_TITLE,
    parentItemBankKey: ALGEBRA_PATTERNS_FUNCTIONS_ITEM_BANK_KEY,
    progressionBandKey: ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_KEY,
    sourceRoute: ALGEBRA_PATTERNS_FUNCTIONS_SOURCE_ROUTE,
    depthOptions: NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
    items: spec.cases.map((item, index) => makeItem(spec, item, index)),
  }));

export function getAlgebraPatternsFunctionsStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
) {
  const stepAssessmentKey = safe(context.stepAssessmentKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    ALGEBRA_PATTERNS_FUNCTIONS_STEP_ASSESSMENTS.find(
      (assessment) =>
        (stepAssessmentKey && assessment.key === stepAssessmentKey) ||
        (pathwayStepId && assessment.pathwayStepId === pathwayStepId) ||
        (stepKey && assessment.stepKey === stepKey),
    ) || null
  );
}

export function getAlgebraPatternsFunctionsStepAssessmentItemsForDepth(
  assessmentKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const assessment =
    ALGEBRA_PATTERNS_FUNCTIONS_STEP_ASSESSMENTS.find(
      (candidate) => candidate.key === assessmentKey,
    ) || null;

  if (!assessment) return [];

  return assessment.items.slice(0, getNumberStepAssessmentDepthItemCount(depth));
}
