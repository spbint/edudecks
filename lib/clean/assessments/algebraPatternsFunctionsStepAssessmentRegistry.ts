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
    ["Expression meaning n plus 3", "Section 1 - What Does the Expression Mean? What does n + 3 mean?", "Match the expression to its word meaning.", ["a number and 3 more", "a number take away 3", "3 groups of a number"], "a number and 3 more", numbers("Expression meaning match.", ["n + 3"]), "expression-meaning", "What does the expression mean?", ["operation-translation-error"]],
    ["Expression meaning m minus 2", "Section 1 - What Does the Expression Mean? What does m - 2 mean?", "Read the minus sign as take away.", ["a number take away 2", "a number and 2 more", "2 groups of a number"], "a number take away 2", numbers("Expression meaning match.", ["m - 2"]), "expression-meaning", "What does the expression mean?", ["sign-error"]],
    ["Write expression plus 4", "Section 2 - Write the Expression: Which expression means a number and 4 more?", "Use a letter for the number.", ["n + 4", "n - 4", "4 - n"], "n + 4", numbers("Write an expression.", ["a number", "+4"]), "write-the-expression", "Write the expression", ["reverse-operation"]],
    ["Write expression take away 3", "Section 2 - Write the Expression: Which expression means a number take away 3?", "Use subtraction from the number.", ["n - 3", "n + 3", "3 - n"], "n - 3", numbers("Write an expression.", ["a number", "-3"]), "write-the-expression", "Write the expression", ["reverse-subtraction-error"]],
    ["Solve n plus 2", "Section 3 - Solve the Equation: n + 2 = 7. What is n?", "Find the missing part that makes 7.", ["5", "7", "9"], "5", numbers("Solve simple equation.", ["n", "+2", "=7"]), "solve-the-equation", "Solve the equation", ["adds-instead-of-undoing"]],
    ["Solve m plus 5", "Section 3 - Solve the Equation: m + 5 = 12. What is m?", "Find the number that joins with 5 to make 12.", ["7", "5", "17"], "7", numbers("Solve simple equation.", ["m", "+5", "=12"]), "solve-the-equation", "Solve the equation", ["copies-known-number"]],
    ["Solve x minus 3", "Section 3 - Solve the Equation: x - 3 = 4. What is x?", "Think what number is 3 more than 4.", ["7", "1", "4"], "7", numbers("Solve simple equation.", ["x", "-3", "=4"]), "solve-the-equation", "Solve the equation", ["subtracts-again"]],
    ["Solve p minus 6", "Section 3 - Solve the Equation: p - 6 = 8. What is p?", "Find the starting number before 6 was taken away.", ["14", "2", "8"], "14", numbers("Solve simple equation.", ["p", "-6", "=8"]), "solve-the-equation", "Solve the equation", ["uses-result-as-unknown"]],
    ["Use rule n plus 3", "Section 4 - Use the Rule: Rule n + 3. What output matches n = 5?", "Put 5 into the rule and add 3.", ["8", "5", "3"], "8", numbers("Rule table n + 3.", ["n=2 -> 5", "n=5 -> ?"]), "use-the-rule", "Use the rule", ["uses-input-only"]],
    ["Use rule n minus 1", "Section 4 - Use the Rule: Rule n - 1. What output matches n = 6?", "Put 6 into the rule and take away 1.", ["5", "6", "7"], "5", numbers("Rule table n - 1.", ["n=3 -> 2", "n=6 -> ?"]), "use-the-rule", "Use the rule", ["wrong-direction"]],
    ["Sticker story equation", "Section 6 - Real-Life Equations: Ben has some stickers. He gets 3 more. Now he has 10. Which equation matches?", "Use a letter for the starting stickers.", ["s + 3 = 10", "s - 3 = 10", "3s = 10"], "s + 3 = 10", numbers("Sticker story equation.", ["s stickers", "+3", "=10"]), "real-life-equations", "Real-life equations", ["wrong-operation-context"]],
    ["Think expression equation", "Section 8 - Think and Explain: What is the difference between an expression and an equation?", "An equation has an equals sign; an expression does not need one.", ["An equation has an equals sign", "An expression must always have an equals sign", "They are always the same"], "An equation has an equals sign", numbers("Expression and equation comparison.", ["n + 3", "n + 3 = 8"]), "think-and-explain", "Think and explain", ["equals-sign-confusion"]],
  ],
  [
    ["Balanced statement", "Section 1 - Balanced or Not? Is 5 + 3 = 8 balanced?", "Work out each side of the equals sign.", ["Balanced", "Not Balanced", "Cannot tell"], "Balanced", numbers("Balance scale: 5 + 3 balances with 8.", ["5 + 3", "=", 8]), "balanced-or-not", "Balanced or not?", ["equals-sign-confusion"]],
    ["Unbalanced statement", "Section 1 - Balanced or Not? Is 7 + 2 = 10 balanced?", "Compare 9 on the left with 10 on the right.", ["Not Balanced", "Balanced", "Cannot tell"], "Not Balanced", numbers("Balance scale: 7 + 2 does not balance with 10.", ["7 + 2", "=", 10]), "balanced-or-not", "Balanced or not?", ["does-not-check-both-sides"]],
    ["Balanced subtraction", "Section 1 - Balanced or Not? Is 12 - 4 = 8 balanced?", "Check whether both sides have the same value.", ["Balanced", "Not Balanced", "Cannot tell"], "Balanced", numbers("Balance scale: 12 - 4 balances with 8.", ["12 - 4", "=", 8]), "balanced-or-not", "Balanced or not?", ["subtraction-check-error"]],
    ["Unbalanced addition", "Section 1 - Balanced or Not? Is 6 + 5 = 12 balanced?", "Compare 11 on the left with 12 on the right.", ["Not Balanced", "Balanced", "Cannot tell"], "Not Balanced", numbers("Balance scale: 6 + 5 does not balance with 12.", ["6 + 5", "=", 12]), "balanced-or-not", "Balanced or not?", ["assumes-equals-means-answer"]],
    ["Solve x plus 4", "Section 2 - Solve the Unknown: x + 4 = 10. What is x?", "Think of removing 4 from both sides of the balance.", ["6", "14", "4"], "6", numbers("Balance scale with x + 4 on one side and 10 on the other.", ["x + 4", "=", 10]), "solve-the-unknown", "Solve the unknown", ["adds-instead-of-undoing"]],
    ["Solve n minus 3", "Section 2 - Solve the Unknown: n - 3 = 5. What is n?", "Find the starting number before 3 was taken away.", ["8", "2", "5"], "8", numbers("Balance scale with n - 3 on one side and 5 on the other.", ["n - 3", "=", 5]), "solve-the-unknown", "Solve the unknown", ["subtracts-again"]],
    ["Solve m plus 7", "Section 2 - Solve the Unknown: m + 7 = 15. What is m?", "Undo adding 7 while keeping the balance.", ["8", "22", "7"], "8", numbers("Balance scale with m + 7 on one side and 15 on the other.", ["m + 7", "=", 15]), "solve-the-unknown", "Solve the unknown", ["copies-known-number"]],
    ["Solve p minus 8", "Section 2 - Solve the Unknown: p - 8 = 12. What is p?", "Find the number that becomes 12 after 8 is taken away.", ["20", "4", "12"], "20", numbers("Balance scale with p - 8 on one side and 12 on the other.", ["p - 8", "=", 12]), "solve-the-unknown", "Solve the unknown", ["uses-result-as-unknown"]],
    ["Think like balance plus", "Section 3 - Think Like a Balance: x + 3 = 9. Which step keeps the equation balanced?", "Do the same inverse move to both sides.", ["subtract 3 from both sides", "subtract 3 from the left only", "add 9 to both sides"], "subtract 3 from both sides", numbers("Balance model: x + 3 equals 9.", ["x + 3", "=", 9]), "balance-scale", "Think like a balance", ["one-side-only-error"]],
    ["Think like balance minus", "Section 3 - Think Like a Balance: m - 4 = 7. What is m?", "Undo subtracting 4 by adding 4 to both sides.", ["11", "3", "7"], "11", numbers("Balance model: m - 4 equals 7.", ["m - 4", "=", 7]), "balance-scale", "Think like a balance", ["wrong-inverse"]],
    ["Match equation plus", "Section 5 - Match the Equation: Which equation matches 'A number plus 3 equals 10'?", "Use a letter for the unknown number.", ["x + 3 = 10", "x - 3 = 10", "3x = 10"], "x + 3 = 10", numbers("Word sentence to equation.", ["number", "+3", "=10"]), "match-the-equation", "Match the equation", ["operation-translation-error"]],
    ["Match equation minus", "Section 5 - Match the Equation: Which equation matches 'A number minus 5 equals 7'?", "Take 5 away from the unknown number.", ["x - 5 = 7", "5 - x = 7", "x + 5 = 7"], "x - 5 = 7", numbers("Word sentence to equation.", ["number", "-5", "=7"]), "match-the-equation", "Match the equation", ["reverse-subtraction-error"]],
    ["Sticker story", "Section 6 - Real-Life Equations: Ben has some stickers. He gets 5 more. Now he has 13. Which equation and answer fit?", "Let s stand for Ben's starting stickers.", ["s + 5 = 13, s = 8", "s - 5 = 13, s = 18", "5s = 13, s = 8"], "s + 5 = 13, s = 8", numbers("Sticker story balance.", ["s stickers", "+5", "=13"]), "real-life-equations", "Real-life equations", ["wrong-operation-context"]],
    ["Marble story", "Section 6 - Real-Life Equations: Mia has some marbles. She gives away 7. Now she has 9. Which equation and answer fit?", "Let m stand for the starting marbles.", ["m - 7 = 9, m = 16", "m + 7 = 9, m = 2", "7 - m = 9, m = 16"], "m - 7 = 9, m = 16", numbers("Marble story balance.", ["m marbles", "-7", "=9"]), "real-life-equations", "Real-life equations", ["subtraction-context-error"]],
    ["Equals sign meaning", "Section 8 - Think and Explain: What does the equals sign mean in a balanced equation?", "The equals sign says both sides have the same value.", ["both sides have the same value", "the answer always comes next", "the left side is always bigger"], "both sides have the same value", numbers("Balanced relationship prompt.", ["left side", "=", "right side"]), "think-and-explain", "Think and explain", ["equals-sign-as-answer-only"]],
    ["Explain checking", "Section 8 - Think and Explain: How do you know x = 8 is correct for x + 5 = 13?", "Put 8 back into the equation and check the balance.", ["8 + 5 equals 13", "8 - 5 equals 13", "13 + 5 equals 8"], "8 + 5 equals 13", numbers("Check by substitution.", ["x = 8", "x + 5 = 13"]), "think-and-explain", "Think and explain", ["does-not-substitute"]],
  ],
  [
    ["Complete input plus two", "Section 1 - Complete the Table: Rule Output = Input + 2. What outputs match inputs 1, 2, 3, 4, 5?", "Add 2 to each input value.", ["3, 4, 5, 6, 7", "2, 4, 6, 8, 10", "1, 2, 3, 4, 5"], "3, 4, 5, 6, 7", numbers("Function table: output = input + 2.", ["1->?", "2->?", "3->?", "4->?", "5->?"]), "complete-the-table", "Complete the table", ["uses-input-as-output"]],
    ["Complete input times three", "Section 1 - Complete the Table: Rule Output = Input x 3. What outputs match inputs 1, 2, 3, 4, 5?", "Multiply each input by 3.", ["3, 6, 9, 12, 15", "4, 5, 6, 7, 8", "1, 3, 5, 7, 9"], "3, 6, 9, 12, 15", numbers("Function table: output = input x 3.", ["1->?", "2->?", "3->?", "4->?", "5->?"]), "complete-the-table", "Complete the table", ["adds-instead-of-multiplies"]],
    ["Find rule plus four", "Section 2 - Find the Rule: Input 1, 2, 3, 4 gives output 5, 6, 7, 8. Complete Output = Input + __.", "Compare each output with its input.", ["4", "5", "1"], "4", numbers("Rule table.", ["1->5", "2->6", "3->7", "4->8"]), "find-the-rule", "Find the rule", ["uses-first-output-as-rule"]],
    ["Find rule times two", "Section 2 - Find the Rule: Input 1, 2, 3, 4 gives output 2, 4, 6, 8. Which rule fits?", "Each output is double the input.", ["Output = Input x 2", "Output = Input + 2", "Output = Input + 4"], "Output = Input x 2", numbers("Rule table.", ["1->2", "2->4", "3->6", "4->8"]), "find-the-rule", "Find the rule", ["additive-for-multiplicative"]],
    ["Match plus two table", "Section 3 - Match the Table to the Rule: Which table matches Output = Input + 2?", "Look for outputs that are 2 more than the inputs.", ["1->3, 2->4, 3->5", "1->2, 2->4, 3->6", "1->4, 2->5, 3->6"], "1->3, 2->4, 3->5", numbers("Match table to rule +2.", ["Output = Input + 2"]), "match-table-rule", "Match table to rule", ["matches-by-first-row-only"]],
    ["Match times three table", "Section 3 - Match the Table to the Rule: Which table matches Output = Input x 3?", "Multiply each input by 3.", ["1->3, 2->6, 3->9", "1->4, 2->5, 3->6", "1->2, 2->4, 3->6"], "1->3, 2->6, 3->9", numbers("Match table to rule x3.", ["Output = Input x 3"]), "match-table-rule", "Match table to rule", ["chooses-add-three"]],
    ["Plot plus three point", "Section 4 - Plot the Relationship: Rule Output = Input + 3. Which point belongs on the graph when input is 2?", "Find the output first, then write the point.", ["(2, 5)", "(2, 3)", "(5, 2)"], "(2, 5)", numbers("Graph points for output = input + 3.", ["1,4", "2,?", "3,6"]), "plot-the-relationship", "Plot the relationship", ["reverses-coordinates"]],
    ["Plot plus three table", "Section 4 - Plot the Relationship: Rule Output = Input + 3. Which table is correct for inputs 1, 2, 3, 4?", "Add 3 to each input before plotting.", ["1->4, 2->5, 3->6, 4->7", "1->3, 2->6, 3->9, 4->12", "1->2, 2->3, 3->4, 4->5"], "1->4, 2->5, 3->6, 4->7", numbers("Table before graphing.", ["Output = Input + 3"]), "plot-the-relationship", "Plot the relationship", ["wrong-rule-used"]],
    ["Read increasing graph", "Section 5 - Read the Graph: A graph has points (1,3), (2,4), (3,5), (4,6). What is happening?", "As input grows, output grows by the same amount.", ["The graph shows an increasing pattern", "The output stays the same", "The output goes down"], "The graph shows an increasing pattern", numbers("Graph interpretation.", ["(1,3)", "(2,4)", "(3,5)", "(4,6)"]), "read-the-graph", "Read the graph", ["graph-trend-confusion"]],
    ["Read matching rule", "Section 5 - Read the Graph: Points (1,2), (2,4), (3,6), (4,8) match which rule?", "Compare the output with the input.", ["Output = Input x 2", "Output = Input + 2", "Output = Input + 4"], "Output = Input x 2", numbers("Graph points.", ["(1,2)", "(2,4)", "(3,6)", "(4,8)"]), "read-the-graph", "Read the graph", ["uses-difference-only"]],
    ["Rule to graph times two", "Section 6 - Rule -> Table -> Graph: Rule Output = Input x 2. Which point should be plotted for input 5?", "Use the rule, then plot input as x and output as y.", ["(5, 10)", "(10, 5)", "(5, 7)"], "(5, 10)", numbers("Rule to point.", ["Output = Input x 2", "Input 5"]), "rule-table-graph", "Rule to table to graph", ["reverses-coordinates"]],
    ["Arcade table", "Section 7 - Real-Life Function: Arcade cost is $5 entry fee plus $2 per game. What is the cost for 3 games?", "Start with 5 dollars, then add 2 dollars for each game.", ["$11", "$6", "$15"], "$11", numbers("Arcade function.", ["cost = 5 + 2 x games", "games=3"]), "real-life-function", "Real-life function", ["forgets-entry-fee"]],
    ["Arcade rule", "Section 7 - Real-Life Function: Which rule matches a $5 entry fee plus $2 per game?", "Use g for the number of games.", ["Cost = 5 + 2g", "Cost = 5g + 2", "Cost = 2 + g"], "Cost = 5 + 2g", numbers("Arcade rule card.", ["$5 entry", "$2 per game"]), "real-life-function", "Real-life function", ["swaps-fixed-and-changing"]],
    ["Connect representations", "Section 8 - Think and Explain: How are tables, rules and graphs connected?", "They show the same input-output relationship in different ways.", ["They can show the same relationship", "They are always unrelated", "Graphs do not use table values"], "They can show the same relationship", numbers("Table, rule, graph connection.", ["table", "rule", "graph"]), "think-and-explain", "Think and explain", ["representation-connection-gap"]],
    ["Predict with rule", "Section 8 - Think and Explain: Why is a rule useful?", "A rule lets you predict outputs for new inputs.", ["It helps predict new values", "It only works for one row", "It replaces checking patterns"], "It helps predict new values", numbers("Predict from a rule.", ["input", "rule", "output"]), "think-and-explain", "Think and explain", ["rule-purpose-gap"]],
  ],
  [
    ["Rule star growth", "Section 1 - What Is the Rule? A star pattern grows 1 star, 2 stars, 3 stars, 4 stars. What is the rule?", "Look at how many more stars are added each time.", ["Add 1", "Add 2", "Add 3"], "Add 1", groups("Star pattern grows by one.", [1, 2, 3, 4], ["group 1", "group 2", "group 3", "group 4"]), "what-is-the-rule", "What is the rule?", ["counts-total-only"]],
    ["Rule apples grow by two", "Section 1 - What Is the Rule? An apple pattern shows 2, 4, 6, 8. What is the rule?", "Compare each number to the next number.", ["Add 2", "Add 1", "Add 3"], "Add 2", numbers("Apple pattern.", [2, 4, 6, 8]), "what-is-the-rule", "What is the rule?", ["uses-first-number-as-rule"]],
    ["Rule circles grow by three", "Section 1 - What Is the Rule? A circle pattern shows 3, 6, 9, 12. What is the rule?", "The same amount is added each time.", ["Add 3", "Add 2", "Add 1"], "Add 3", groups("Circle groups grow by three.", [3, 6, 9, 12], ["first", "second", "third", "fourth"]), "what-is-the-rule", "What is the rule?", ["chooses-largest-option"]],
    ["Same rule add one", "Section 2 - Same Rule or Different Rule? Compare 1, 2, 3, 4 and 5, 6, 7, 8. Are they the same rule or different rule?", "Both patterns add the same amount each time.", ["Same Rule", "Different Rule", "Cannot tell"], "Same Rule", numbers("Compare add-one patterns.", ["1,2,3,4", "5,6,7,8"]), "same-rule-different-rule", "Same rule or different rule", ["compares-starting-number-only"]],
    ["Different rule twos and tens", "Section 2 - Same Rule or Different Rule? Compare 2, 4, 6, 8 and 10, 20, 30, 40. Are they the same rule or different rule?", "Check the change between each number.", ["Different Rule", "Same Rule", "Cannot tell"], "Different Rule", numbers("Compare different growth rules.", ["2,4,6,8", "10,20,30,40"]), "same-rule-different-rule", "Same rule or different rule", ["matches-even-numbers-only"]],
    ["Missing number twos", "Section 3 - Fill the Missing Number: 2, 4, __, 8. What is missing?", "Use the add 2 rule.", ["6", "5", "7"], "6", numbers("Fill missing number.", [2, 4, "?", 8]), "fill-the-missing-number", "Fill the missing number", ["fills-random-middle"]],
    ["Missing number fives", "Section 3 - Fill the Missing Number: 5, __, 15, 20. What is missing?", "Use the add 5 rule.", ["10", "8", "12"], "10", numbers("Fill missing number.", [5, "?", 15, 20]), "fill-the-missing-number", "Fill the missing number", ["uses-neighbour-only"]],
    ["Missing number odds", "Section 3 - Fill the Missing Number: 1, 3, 5, __. What is missing?", "Continue the odd-number pattern.", ["7", "6", "8"], "7", numbers("Fill missing odd number.", [1, 3, 5, "?"]), "fill-the-missing-number", "Fill the missing number", ["switches-to-even"]],
    ["Input output plus two", "Section 4 - Input and Output: Rule +2. Inputs 1, 2, 3, 4 give outputs 3, 4, __, 6. What output is missing?", "Add 2 to the input 3.", ["5", "4", "6"], "5", numbers("Input-output machine rule +2.", ["1->3", "2->4", "3->?", "4->6"]), "input-and-output", "Input and output", ["uses-input-only"]],
    ["Input output plus five", "Section 4 - Input and Output: Rule +5. Inputs 1, 2, 3, 4 give outputs 6, __, 8, 9. What output is missing?", "Add 5 to the input 2.", ["7", "6", "8"], "7", numbers("Input-output machine rule +5.", ["1->6", "2->?", "3->8", "4->9"]), "input-and-output", "Input and output", ["adds-wrong-amount"]],
    ["Build stars pattern", "Section 5 - Build the Pattern: A star pattern shows 1 star, 2 stars, 3 stars. What are the next two groups?", "Keep adding one star to each new group.", ["4 stars and 5 stars", "3 stars and 3 stars", "5 stars and 6 stars"], "4 stars and 5 stars", groups("Build the next star groups.", [1, 2, 3, 4, 5], ["group 1", "group 2", "group 3", "group 4", "group 5"]), "build-the-pattern", "Build the pattern", ["repeats-last-group"]],
    ["Make your own rule", "Sections 6 and 7 - Make Your Own Rule / Think and Talk: Which explanation shows two patterns can have the same rule?", "A same rule can start at a different number but change by the same amount.", ["Both patterns add 2 each time", "Both patterns start with 2", "Both patterns have four numbers"], "Both patterns add 2 each time", numbers("Explain a shared rule.", ["2,4,6,8", "10,12,14,16"]), "make-your-own-rule", "Make your own rule", ["compares-length-only"]],
  ],
  [
    ["Box unknown add", "Section 1 - What does the box mean? 3 + box = 8. What number does the box stand for?", "Find the number that makes the sentence true.", ["5", "4", "11"], "5", numbers("Unknown box equation.", [3, "+", "box", "=", 8]), "unknown-boxes", "What does the box mean?", ["adds-all-numbers"]],
    ["Box unknown subtract", "Section 1 - What does the box mean? 10 - box = 4. What number does the box stand for?", "Find how much was taken from 10 to leave 4.", ["6", "4", "14"], "6", numbers("Unknown box equation.", [10, "-", "box", "=", 4]), "unknown-boxes", "What does the box mean?", ["uses-answer-as-box"]],
    ["Replace box with n", "Section 2 - Replace the box with a letter. Which sentence matches box + 3 = 8?", "Use the letter n to stand for the unknown number.", ["n + 3 = 8", "3 + 8 = n", "n - 3 = 8"], "n + 3 = 8", numbers("Replace a box with n.", ["box + 3 = 8", "n + 3 = 8"]), "letters-for-unknowns", "Replace the box with a letter", ["letter-as-answer-only"]],
    ["Replace box with p", "Section 2 - Replace the box with a letter. Which sentence matches 12 - box = 5?", "Use the letter p to stand for the unknown number.", ["12 - p = 5", "p - 12 = 5", "12 + p = 5"], "12 - p = 5", numbers("Replace a box with p.", ["12 - box = 5", "12 - p = 5"]), "letters-for-unknowns", "Replace the box with a letter", ["operation-translation-error"]],
    ["Find rule blank", "Section 3 - What is the rule? A table shows input 1 gives output 4, input 2 gives output 5, input 3 gives output 6. Output = input + __. What number completes the rule?", "Compare each output with its input.", ["3", "2", "4"], "3", numbers("Input-output rule with blank.", ["1->4", "2->5", "3->6", "input + ?"]), "what-is-the-rule", "What is the rule?", ["uses-one-row-only"]],
    ["Use letter rule n plus 2", "Section 4 - Use a letter rule: Rule n + 2. What is the output when n is 4?", "Put 4 into the rule and add 2.", ["6", "4", "2"], "6", numbers("Letter rule table.", ["n=1 -> 3", "n=2 -> 4", "n=4 -> ?"]), "letter-rule-table", "Use a letter rule", ["uses-letter-as-fixed-number"]],
    ["Find letter a", "Section 5 - Which number does the letter stand for? a + 5 = 11. What is a?", "Find the missing part that makes 11.", ["6", "5", "16"], "6", numbers("Letter unknown equation.", ["a", "+5", "=11"]), "letter-unknowns", "Which number does the letter stand for?", ["adds-instead-of-undoing"]],
    ["Find letter b", "Section 5 - Which number does the letter stand for? b + 4 = 9. What is b?", "Find the number that joins with 4 to make 9.", ["5", "4", "13"], "5", numbers("Letter unknown equation.", ["b", "+4", "=9"]), "letter-unknowns", "Which number does the letter stand for?", ["copies-known-number"]],
    ["Find letter c", "Section 5 - Which number does the letter stand for? c - 2 = 7. What is c?", "Think what number is 2 more than 7.", ["9", "5", "7"], "9", numbers("Letter unknown equation.", ["c", "-2", "=7"]), "letter-unknowns", "Which number does the letter stand for?", ["subtracts-again"]],
    ["Pattern rule add three", "Section 6 - Pattern rules: A table shows input 1 -> 4, 2 -> 5, 3 -> 6, 4 -> 7. Which letter rule fits?", "The output is always 3 more than the input.", ["n + 3", "n + 4", "n - 3"], "n + 3", numbers("Pattern rule with a letter.", ["1->4", "2->5", "3->6", "4->7"]), "pattern-rules", "Pattern rules", ["matches-last-output"]],
    ["Create your own rule", "Section 7 - Create your own rule: A learner chooses rule n + 5. If n is 2, what output goes in the table?", "Use the chosen rule and add 5.", ["7", "5", "10"], "7", numbers("Create a rule table.", ["rule n+5", "n=2", "output ?"]), "create-your-own-rule", "Create your own rule", ["uses-rule-number-only"]],
    ["Think and explain variable", "Section 8 - Think and explain: What does a variable mean in these tasks?", "Choose the explanation that matches boxes, letters and rules.", ["a symbol that can stand for a number", "a decoration in the sentence", "the answer is always 1"], "a symbol that can stand for a number", numbers("Variable explanation prompt.", ["box", "letter", "rule"]), "think-and-explain", "Think and explain", ["symbol-without-meaning"]],
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
