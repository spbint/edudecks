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
    ["Red circle blue square", "Section 1 - What Comes Next? The pattern is red circle, blue square, red circle, blue square. What comes next?", "Say the pattern aloud and choose the next shape.", ["red circle", "blue square", "green triangle"], "red circle", numbers("Red circle and blue square repeat.", ["red circle", "blue square", "red circle", "blue square", "?"]), "what-comes-next", "What comes next?", ["chooses-last-item"]],
    ["Green triangle yellow star", "Section 1 - What Comes Next? The pattern is green triangle, yellow star, green triangle, yellow star. What comes next?", "Look for the two-shape repeating unit.", ["green triangle", "yellow star", "purple heart"], "green triangle", numbers("Green triangle and yellow star repeat.", ["green triangle", "yellow star", "green triangle", "yellow star", "?"]), "what-comes-next", "What comes next?", ["alternation-slip"]],
    ["Purple heart orange circle", "Section 1 - What Comes Next? The pattern is purple heart, orange circle, purple heart, orange circle. What comes next?", "Repeat the first shape in the pair.", ["purple heart", "orange circle", "blue square"], "purple heart", numbers("Purple heart and orange circle repeat.", ["purple heart", "orange circle", "purple heart", "orange circle", "?"]), "what-comes-next", "What comes next?", ["copies-nearest-shape"]],
    ["Square triangle next two", "Section 2 - Continue the Pattern: square, triangle, square, triangle. What are the next two shapes?", "Continue the repeating pair.", ["square, triangle", "triangle, square", "square, square"], "square, triangle", numbers("Square and triangle repeat.", ["square", "triangle", "square", "triangle", "?", "?"]), "continue-the-pattern", "Continue the pattern", ["reverses-next-pair"]],
    ["Circle square next two", "Section 2 - Continue the Pattern: circle, square, circle, square. What are the next two shapes?", "Keep the same circle then square order.", ["circle, square", "square, circle", "circle, circle"], "circle, square", numbers("Circle and square repeat.", ["circle", "square", "circle", "square", "?", "?"]), "continue-the-pattern", "Continue the pattern", ["repeats-one-shape"]],
    ["Star heart next two", "Section 2 - Continue the Pattern: star, heart, star, heart. What are the next two shapes?", "Continue the star-heart pattern.", ["star, heart", "heart, star", "heart, heart"], "star, heart", numbers("Star and heart repeat.", ["star", "heart", "star", "heart", "?", "?"]), "continue-the-pattern", "Continue the pattern", ["loses-place-in-sequence"]],
    ["Find the pattern rule", "Section 3 - What Is the Pattern? red circle, blue square, red circle, blue square. Which rule fits?", "Choose the rule that describes the repeating unit.", ["red circle then blue square repeats", "all circles repeat", "the shapes get bigger"], "red circle then blue square repeats", numbers("Pattern rule card.", ["red circle", "blue square", "red circle", "blue square"]), "what-is-the-pattern", "What is the pattern?", ["unclear-rule-language"]],
    ["Complete missing middle", "Section 4 - Complete the Pattern: star, heart, __, heart. What is missing?", "Use the repeating unit star, heart.", ["star", "heart", "square"], "star", numbers("Complete the missing shape.", ["star", "heart", "?", "heart"]), "complete-the-pattern", "Complete the pattern", ["fills-random-middle"]],
    ["Complete missing end", "Section 4 - Complete the Pattern: square, triangle, square, triangle, square, __. What is missing?", "Check what follows square in the pattern.", ["triangle", "square", "circle"], "triangle", numbers("Square and triangle repeat.", ["square", "triangle", "square", "triangle", "square", "?"]), "complete-the-pattern", "Complete the pattern", ["copies-nearest-shape"]],
    ["Make your own AB pattern", "Section 5 - Make Your Own Pattern: Which pattern is a repeating AB pattern?", "Choose a pattern that uses two shapes in the same order again and again.", ["circle, square, circle, square", "circle, circle, square, star", "triangle, star, heart, square"], "circle, square, circle, square", numbers("Pattern builder choice.", ["circle", "square", "circle", "square"]), "make-your-own-pattern", "Make your own pattern", ["not-repeating-unit"]],
    ["Make your own pattern unit", "Section 5 - Make Your Own Pattern: Which two-shape unit could you repeat to make star, heart, star, heart?", "Find the smallest part to build again.", ["star, heart", "star, star", "heart, heart"], "star, heart", numbers("Build from a repeating unit.", ["star", "heart", "star", "heart"]), "make-your-own-pattern", "Make your own pattern", ["uses-whole-pattern-as-unit"]],
    ["Look around pattern", "Section 6 - Look Around: Which example shows a repeating pattern you might find at home or school?", "Choose the example that repeats in the same order.", ["red tile, blue tile, red tile, blue tile", "one pencil on a desk", "three different books in any order"], "red tile, blue tile, red tile, blue tile", numbers("Look around for a repeating pattern.", ["red tile", "blue tile", "red tile", "blue tile"]), "look-around", "Look around", ["pattern-context-gap"]],
  ],
  [
    ["Sort by colour", "Section 1 - Sort Objects: Which object belongs in the red group with the red ball and red star?", "Look for the object with the same colour.", ["red triangle", "blue triangle", "yellow star"], "red triangle", numbers("Sort by colour.", ["red ball", "red star", "red triangle"]), "sort-objects", "Sort objects", ["names-wrong-attribute"]],
    ["Sort by shape", "Section 1 - Sort Objects: Which object belongs with the triangles?", "Use the shape rule, not the colour.", ["green triangle", "green ball", "yellow star"], "green triangle", numbers("Sort by shape.", ["triangle", "triangle", "?"]), "sort-objects", "Sort objects", ["colour-over-shape"]],
    ["Sort by size", "Section 1 - Sort Objects: Which object belongs in the big things group?", "Focus on size.", ["big teddy bear", "small teddy bear", "tiny apple"], "big teddy bear", numbers("Sort by size.", ["big ball", "big star", "?"]), "sort-objects", "Sort objects", ["shape-instead-of-size"]],
    ["Identify colour rule", "Section 2 - Identify the Rule: Apples and strawberries are in one group. Bananas are not. What rule could fit?", "Look for the shared feature in the group.", ["red things", "yellow things", "things with wheels"], "red things", numbers("Rule card: red fruit group.", ["apple", "strawberry", "banana out"]), "identify-the-rule", "Identify the rule", ["object-type-bias"]],
    ["Identify type rule", "Section 2 - Identify the Rule: Cars and bikes are together. Flowers are not. What is the rule?", "Think about what cars and bikes have in common.", ["things with wheels", "things that grow", "things that are stars"], "things with wheels", numbers("Rule card: wheels.", ["car", "bike", "flower out"]), "identify-the-rule", "Identify the rule", ["category-feature-gap"]],
    ["Does not belong colour", "Section 3 - Circle the Object That Does Not Belong: red ball, red star, red heart, blue square. Which does not belong?", "Find the object that breaks the colour rule.", ["blue square", "red star", "red heart"], "blue square", numbers("Odd one out by colour.", ["red ball", "red star", "red heart", "blue square"]), "does-not-belong", "Does not belong", ["ignores-exception"]],
    ["Does not belong type", "Section 3 - Circle the Object That Does Not Belong: dog, frog, butterfly, car. Which does not belong?", "Three are animals and one is a vehicle.", ["car", "frog", "butterfly"], "car", numbers("Odd one out by type.", ["dog", "frog", "butterfly", "car"]), "does-not-belong", "Does not belong", ["real-world-feature-gap"]],
    ["Make a sorting rule", "Section 4 - Make Your Own Sorting Rule: You put stars and hearts together, but leave triangles out. Which rule could explain your sort?", "Choose a sensible rule for the group.", ["shapes that are not triangles", "only triangles", "things with wheels"], "shapes that are not triangles", numbers("Make a sorting rule.", ["star", "heart", "triangle out"]), "make-a-rule", "Make your own sorting rule", ["over-specific-rule"]],
    ["Explain shape rule", "Section 5 - Explain the Rule: Balls and wheels are together. What explains the group?", "Name what the objects have in common.", ["They are round", "They are all flowers", "They are all big"], "They are round", numbers("Explain the rule.", ["ball", "wheel", "round"]), "explain-the-rule", "Explain the rule", ["unclear-rule-language"]],
    ["Find odd one out", "Section 6 - Find the Odd One Out: apple, banana, flower, strawberry. Which one is different by type?", "Most are fruit. One is not.", ["flower", "banana", "apple"], "flower", numbers("Find the odd one out.", ["apple", "banana", "flower", "strawberry"]), "odd-one-out", "Find the odd one out", ["misses-type-rule"]],
    ["Two-feature sorting", "Section 6 - Find the Odd One Out: small blue star, small blue heart, big blue star. Which does not match the rule small and blue?", "Check both size and colour.", ["big blue star", "small blue heart", "small blue star"], "big blue star", numbers("Rule has two features: small and blue.", ["small", "blue"]), "odd-one-out", "Find the odd one out", ["checks-one-feature-only"]],
    ["Think and talk", "Section 7 - Think and Talk: Why does a yellow banana belong with a yellow star?", "Choose the explanation that names the sorting rule.", ["They are both yellow", "They are both fruit", "They both have wheels"], "They are both yellow", numbers("Think and talk sorting explanation.", ["yellow banana", "yellow star"]), "think-and-talk", "Think and talk", ["object-type-bias"]],
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
    ["Missing number count by ones", "Section 1 - Find the Missing Number: 1, 2, 3, __, 5, 6. What number is missing?", "Count by ones and fill the blank.", ["4", "3", "6"], "4", numbers("Missing number sequence.", [1, 2, 3, "?", 5, 6]), "find-the-missing-number", "Find the missing number", ["copies-nearest-number"]],
    ["Missing number count by twos", "Section 1 - Find the Missing Number: 2, 4, __, 8, 10, 12. What number is missing?", "The sequence counts by twos.", ["6", "5", "7"], "6", numbers("Count by twos.", [2, 4, "?", 8, 10, 12]), "find-the-missing-number", "Find the missing number", ["counts-by-one"]],
    ["Missing number count by threes", "Section 1 - Find the Missing Number: 3, 6, 9, __, 15, 18. What number is missing?", "Add 3 each time.", ["12", "10", "13"], "12", numbers("Count by threes.", [3, 6, 9, "?", 15, 18]), "find-the-missing-number", "Find the missing number", ["wrong-skip-count"]],
    ["What comes next tens", "Section 2 - What Comes Next? 10, 20, 30, 40, __. What comes next?", "Keep adding 10.", ["50", "45", "60"], "50", numbers("Add 10 pattern.", [10, 20, 30, 40, "?"]), "what-comes-next", "What comes next?", ["adds-last-digit"]],
    ["What comes next twos", "Section 2 - What Comes Next? 2, 4, 6, 8, __. What comes next?", "Keep adding 2.", ["10", "9", "12"], "10", numbers("Add 2 pattern.", [2, 4, 6, 8, "?"]), "what-comes-next", "What comes next?", ["counts-one-too-far"]],
    ["Input-output add 2", "Section 3 - Input -> Output Machines: Rule +2. If 3 goes into the machine, what comes out?", "Add 2 to the input.", ["5", "3", "6"], "5", numbers("Machine rule +2.", ["1->3", "2->4", "3->?", "4->6"]), "input-output-machines", "Input-output machines", ["uses-input-only"]],
    ["Input-output add 3", "Section 3 - Input -> Output Machines: Rule +3. If 4 goes into the machine, what comes out?", "Add 3 to the input.", ["7", "6", "8"], "7", numbers("Machine rule +3.", ["2->5", "4->?", "6->9", "8->?"]), "input-output-machines", "Input-output machines", ["does-not-apply-rule"]],
    ["Find rule add 3", "Section 4 - What Is the Rule? A table shows 1 -> 4, 2 -> 5, 3 -> 6. What is the rule?", "Compare each output with its input.", ["+3", "+4", "+5"], "+3", numbers("Find the table rule.", ["1->4", "2->5", "3->6"]), "what-is-the-rule", "What is the rule?", ["uses-one-row-only"]],
    ["Find rule add 5", "Section 4 - What Is the Rule? A table shows 2 -> 7, 4 -> 9, 6 -> 11. What is the rule?", "Each output is 5 more than the input.", ["+5", "+3", "+4"], "+5", numbers("Find the table rule.", ["2->7", "4->9", "6->11"]), "what-is-the-rule", "What is the rule?", ["matches-number-in-rule-only"]],
    ["Use rule plus 10", "Section 5 - Use the Rule: Rule +10. What is the output for input 15?", "Use the machine card and add 10.", ["25", "15", "10"], "25", numbers("Machine card rule +10.", ["15 -> ?"]), "use-the-rule", "Use the rule", ["uses-input-only"]],
    ["Use rule minus 2", "Section 5 - Use the Rule: Rule -2. What is the output for input 11?", "Subtract 2 from the input.", ["9", "13", "2"], "9", numbers("Machine card rule -2.", ["11 -> ?"]), "use-the-rule", "Use the rule", ["operation-direction-error"]],
    ["Problem and own machine", "Sections 6 and 7 - Solve the Problems / Make Your Own Input-Output Machine: A fish bowl rule adds 4 fish. If 5 fish go in, how many come out?", "Use the rule, then explain the machine as add 4.", ["9 fish", "5 fish", "4 fish"], "9 fish", numbers("Fish bowl input-output machine.", ["input 5 fish", "rule +4", "output ?"]), "solve-and-build-machines", "Solve problems and build machines", ["context-rule-gap"]],
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
    ["Complete apples table", "Section 1 - Complete the Table: Apples show 2, 4, 6, __, __. Which two numbers complete the table?", "Use the table pattern and keep adding 2.", ["8, 10", "7, 8", "9, 12"], "8, 10", numbers("Apples table.", [2, 4, 6, "?", "?"]), "complete-the-table", "Complete the table", ["counts-by-one"]],
    ["Complete stars table", "Section 1 - Complete the Table: Stars show 1, 3, 5, __, __. Which two numbers complete the table?", "The star table grows by 2 each time.", ["7, 9", "6, 7", "8, 10"], "7, 9", numbers("Stars table.", [1, 3, 5, "?", "?"]), "complete-the-table", "Complete the table", ["copies-last-number"]],
    ["Complete blocks table", "Section 1 - Complete the Table: Blocks show 5, 10, 15, __, __. Which two numbers complete the table?", "Keep adding 5 blocks.", ["20, 25", "16, 17", "25, 30"], "20, 25", numbers("Blocks table.", [5, 10, 15, "?", "?"]), "complete-the-table", "Complete the table", ["adds-one-instead"]],
    ["Find rule add 2", "Section 2 - What Is the Rule? A table shows 1 -> 2, 2 -> 4, 3 -> 6, 4 -> 8. What is the rule?", "Look at how the output changes as the input changes.", ["Add 2", "Add 1", "Add 3"], "Add 2", numbers("Rule table.", ["1->2", "2->4", "3->6", "4->8"]), "what-is-the-rule", "What is the rule?", ["uses-one-row-only"]],
    ["Find rule add 5", "Section 2 - What Is the Rule? A table shows 1 -> 5, 2 -> 10, 3 -> 15, 4 -> 20. What is the rule?", "The outputs go up by 5 each row.", ["Add 5", "Add 2", "Add 10"], "Add 5", numbers("Rule table.", ["1->5", "2->10", "3->15", "4->20"]), "what-is-the-rule", "What is the rule?", ["chooses-largest-number"]],
    ["Continue twos pattern", "Section 3 - Continue the Pattern: 2, 4, 6, 8, __, __. Which numbers come next?", "Continue counting by twos.", ["10, 12", "9, 10", "12, 14"], "10, 12", numbers("Continue number pattern.", [2, 4, 6, 8, "?", "?"]), "continue-the-pattern", "Continue the pattern", ["counts-by-one"]],
    ["Continue fives pattern", "Section 3 - Continue the Pattern: 5, 10, 15, 20, __, __. Which numbers come next?", "Continue counting by fives.", ["25, 30", "21, 22", "30, 35"], "25, 30", numbers("Continue number pattern.", [5, 10, 15, 20, "?", "?"]), "continue-the-pattern", "Continue the pattern", ["adds-ten-instead"]],
    ["Continue odd pattern", "Section 3 - Continue the Pattern: 1, 3, 5, 7, __, __. Which numbers come next?", "Continue the odd-number pattern.", ["9, 11", "8, 9", "10, 12"], "9, 11", numbers("Continue odd numbers.", [1, 3, 5, 7, "?", "?"]), "continue-the-pattern", "Continue the pattern", ["switches-to-even"]],
    ["Fill output table six", "Section 4 - Fill the Missing Number: Input 1, 2, 3, 4 gives output 3, 6, __, 12. What output is missing?", "Follow the outputs 3, 6, 9, 12.", ["9", "8", "10"], "9", numbers("Input-output table.", ["1->3", "2->6", "3->?", "4->12"]), "fill-the-missing-number", "Fill the missing number", ["does-not-extend-table"]],
    ["Fill output table ten", "Section 4 - Fill the Missing Number: Input 1, 2, 3, 4 gives output 5, __, 15, 20. What output is missing?", "Follow the outputs 5, 10, 15, 20.", ["10", "8", "12"], "10", numbers("Input-output table.", ["1->5", "2->?", "3->15", "4->20"]), "fill-the-missing-number", "Fill the missing number", ["uses-input-as-output"]],
    ["Draw stars groups", "Section 5 - Draw the Pattern: Group 1 has 1 star, Group 2 has 2 stars, Group 3 has 3 stars. How many stars are in Groups 4 and 5?", "Each group has one more star than the group number before it.", ["4 and 5", "3 and 4", "5 and 6"], "4 and 5", groups("Growing star groups.", [1, 2, 3, 4, 5], ["group 1", "group 2", "group 3", "group 4", "group 5"]), "draw-the-pattern", "Draw the pattern", ["repeats-group-three"]],
    ["Make your own table", "Sections 6 and 7 - Make Your Own Table / Think and Talk: A learner makes Group 1 = 3, Group 2 = 6, Group 3 = 9, Group 4 = 12. Which rule explains the table?", "Use a clear rule to describe how the table grows.", ["Add 3 each time", "Add 1 each time", "Take away 3 each time"], "Add 3 each time", numbers("Make a growing table.", ["G1=3", "G2=6", "G3=9", "G4=12"]), "make-your-own-table", "Make your own table", ["unclear-rule-language"]],
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
