import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentDepthItemCount,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export const RATIO_PROPORTIONAL_REASONING_STRAND_KEY =
  "ratio-and-proportional-reasoning";
export const RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_KEY =
  "ratio-and-proportional-reasoning-foundations";
export const RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_TITLE =
  "Ratio and proportional reasoning";
export const RATIO_PROPORTIONAL_REASONING_ITEM_BANK_KEY =
  "ratio-proportional-reasoning-step-assessment-items-v1";
export const RATIO_PROPORTIONAL_REASONING_SOURCE_ROUTE = "/assessments/number";

type RatioCase = {
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

type RawRatioCase = [
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

export type RatioProportionalReasoningStepSpec = {
  order: number;
  stepNumber: number;
  stageKey: CleanAssessmentStageKey;
  stageTitle: string;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  cases: RatioCase[];
};

export type RatioProportionalReasoningStepAssessment = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof RATIO_PROPORTIONAL_REASONING_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentBankKey: typeof RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_KEY;
  parentBankTitle: typeof RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_TITLE;
  parentItemBankKey: typeof RATIO_PROPORTIONAL_REASONING_ITEM_BANK_KEY;
  progressionBandKey: typeof RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_KEY;
  sourceRoute: typeof RATIO_PROPORTIONAL_REASONING_SOURCE_ROUTE;
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
]: RawRatioCase): RatioCase {
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

function itemId(spec: RatioProportionalReasoningStepSpec, index: number) {
  return `ratio-proportional-reasoning-step-${spec.order}-assess-${String(
    index + 1,
  ).padStart(3, "0")}`;
}

function makeItem(
  spec: RatioProportionalReasoningStepSpec,
  item: RatioCase,
  index: number,
): NumberAssessmentBankItem {
  return {
    id: itemId(spec, index),
    progressionBandKey: RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_KEY,
    progressionStepKey: spec.stepKey,
    subElementKey: item.cluster,
    subElementTitle: item.clusterTitle,
    subElementDescription: spec.description,
    title: item.title,
    prompt: item.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "ratio_proportional_reasoning_visual_card",
    options: item.options,
    expectedAnswer: item.answer,
    acceptableAnswers: [item.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: item.answer,
    misconceptionTargets: item.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: spec.stepKey,
      ifCorrectGoToStepKey: spec.stepKey,
      practiceRecommendation: `Practise ${spec.shortTitle.toLowerCase()} with ratio tables, double number lines, bar models, and practical context cards.`,
      diagnosticNote: `Checks whether the learner can use ${spec.shortTitle.toLowerCase()} for this exact pathway step.`,
    },
    visualSupport: visual(item.visual),
  };
}

const RATIO_STEP_TITLES: Array<
  [string, string, CleanAssessmentStageKey, string, number, string, string]
> = [
  [
    "Compare groups and talk about fairness",
    "compare-groups-and-talk-about-fairness",
    "foundation-kindergarten",
    "Foundation / Kindergarten",
    1,
    "Fair group comparison",
    "Compare groups, notice matching amounts, and explain fair or unfair sharing.",
  ],
  [
    "Use double, half, and same amount in practical play",
    "use-double-half-and-same-amount-in-practical-play",
    "foundation-kindergarten",
    "Foundation / Kindergarten",
    2,
    "Double, half, and same amount",
    "Use simple scaling language with visible groups in practical play.",
  ],
  [
    "Describe simple multiplicative comparisons",
    "describe-simple-multiplicative-comparisons",
    "lower-primary",
    "Lower Primary",
    1,
    "Simple multiplicative comparisons",
    "Describe related quantities using double, half, twice as many, and equal groups.",
  ],
  [
    "Scale simple tasks up and down",
    "scale-simple-tasks-up-and-down",
    "lower-primary",
    "Lower Primary",
    2,
    "Scale simple tasks",
    "Double, halve, and scale practical quantities while keeping relationships sensible.",
  ],
  [
    "Use tables or diagrams to compare related quantities",
    "use-tables-or-diagrams-to-compare-related-quantities",
    "middle-primary",
    "Middle Primary",
    1,
    "Tables and diagrams",
    "Organise linked quantities in tables, diagrams, and grouped models.",
  ],
  [
    "Use simple rates in practical contexts",
    "use-simple-rates-in-practical-contexts",
    "middle-primary",
    "Middle Primary",
    2,
    "Simple rates",
    "Use each, per, and for every language to compare practical rates.",
  ],
  [
    "Use fractions, decimals, or percentages in proportional comparison",
    "use-fractions-decimals-or-percentages-in-proportional-comparison",
    "upper-primary",
    "Upper Primary",
    1,
    "Proportional comparison forms",
    "Choose fractions, decimals, or percentages to compare proportional relationships.",
  ],
  [
    "Apply scale and unit comparison in real tasks",
    "apply-scale-and-unit-comparison-in-real-tasks",
    "upper-primary",
    "Upper Primary",
    2,
    "Scale and unit comparison",
    "Apply scale, unit rates, and proportional decisions in practical tasks.",
  ],
  [
    "Use ratio tables and unit rates to solve practical problems",
    "use-ratio-tables-and-unit-rates-to-solve-practical-problems",
    "lower-secondary",
    "Lower Secondary",
    1,
    "Ratio tables and unit rates",
    "Use structured ratio tables and unit rates to solve practical proportional problems.",
  ],
  [
    "Judge fairness, value, and efficiency proportionally",
    "judge-fairness-value-and-efficiency-proportionally",
    "lower-secondary",
    "Lower Secondary",
    2,
    "Proportional judgement",
    "Use proportional reasoning to judge fairness, value, speed, and efficiency.",
  ],
  [
    "Apply proportional reasoning in graphs, finance, and modelling",
    "apply-proportional-reasoning-in-graphs-finance-and-modelling",
    "years-9-10-consolidation",
    "Years 9-10 / consolidation",
    1,
    "Graphs, finance, and modelling",
    "Apply proportional relationships in graphs, finance, measurement, and modelling contexts.",
  ],
  [
    "Refine judgement and communication in proportional problems",
    "refine-judgement-and-communication-in-proportional-problems",
    "years-9-10-consolidation",
    "Years 9-10 / consolidation",
    2,
    "Proportional judgement and communication",
    "Check, critique, and communicate proportional reasoning clearly in later problems.",
  ],
];

const RAW_RATIO_CASES: RawRatioCase[][] = [
  [
    ["Same groups", "Which pair of groups is fair?", "Match the two groups and look for the same amount.", ["3 and 3", "2 and 4", "1 and 5"], "3 and 3", groups("Compare two shares.", [3, 3], ["share", "share"]), "fairness", "Fairness", ["same-total-not-same-share"]],
    ["More group", "Which group has more?", "Point to the group with the larger amount.", ["Group A", "Group B", "They are the same"], "Group B", groups("Group A has 2, Group B has 5.", [2, 5], ["A", "B"]), "comparison", "Compare groups", ["more-less-language-confusion"]],
    ["Make fair", "Sam has 4 blocks. Mia has 2 blocks. What makes the groups match?", "Add blocks to the smaller group until they match.", ["Give Mia 2 more", "Give Sam 2 more", "Take 1 from Mia"], "Give Mia 2 more", groups("Make 4 and 2 match.", [4, 2], ["Sam", "Mia"]), "fairness", "Fairness", ["adjusts-wrong-group"]],
    ["Fair share", "Six counters are shared between two children. Which share is fair?", "Split the counters into two equal groups.", ["3 and 3", "4 and 2", "5 and 1"], "3 and 3", groups("Share 6 equally.", [3, 3], ["child", "child"]), "sharing", "Fair sharing", ["unequal-sharing"]],
    ["Unequal share", "Which share is not fair?", "Find the two shares that do not match.", ["2 and 2", "3 and 3", "5 and 2"], "5 and 2", groups("Compare the shares.", [5, 2], ["larger", "smaller"]), "sharing", "Fair sharing", ["ignores-unequal-size"]],
    ["Same amount words", "Which sentence matches two equal groups?", "Choose the sentence where both groups match.", ["They have the same amount", "One has more", "Both are empty"], "They have the same amount", groups("Two matching groups.", [4, 4], ["A", "B"]), "language", "Fairness language", ["same-word-gap"]],
    ["Balanced plates", "Plate A has 5 grapes. Plate B has 5 grapes. What is true?", "Compare the plates.", ["The plates are balanced", "Plate A has more", "Plate B has more"], "The plates are balanced", groups("Balanced plates.", [5, 5], ["A", "B"]), "balance", "Balance", ["balance-meaning-gap"]],
    ["Not balanced", "Which pair is unbalanced?", "Look for the pair where one side has more.", ["4 and 4", "6 and 3", "2 and 2"], "6 and 3", groups("One side has more.", [6, 3], ["side", "side"]), "balance", "Balance", ["unbalanced-not-noticed"]],
    ["Fair or unfair", "Three children get 2, 2, and 3 counters. Is it fair?", "Compare all the shares.", ["Fair", "Not fair", "Only if there are 7 counters"], "Not fair", groups("Three shares.", [2, 2, 3], ["child", "child", "child"]), "sharing", "Fair sharing", ["checks-only-two-shares"]],
    ["Match another group", "A group has 4 counters. Which group is the same amount?", "Choose the matching group.", ["4 counters", "3 counters", "5 counters"], "4 counters", groups("Match the target group.", [4, 4, 3], ["target", "same", "not same"]), "comparison", "Compare groups", ["off-by-one-match"]],
    ["Fairness reason", "Why is 3 and 3 fair for two children?", "Think about the amount each child gets.", ["Each child gets the same amount", "One child gets more", "There are three children"], "Each child gets the same amount", groups("Equal shares.", [3, 3], ["child", "child"]), "reasoning", "Fairness reasoning", ["fairness-reason-gap"]],
    ["Fix unfair share", "Two shares are 6 and 4. Which change makes them equal?", "Move one item from the larger share to the smaller share.", ["5 and 5", "7 and 3", "6 and 5"], "5 and 5", groups("Balance 6 and 4.", [6, 4], ["large", "small"]), "balance", "Balance", ["balance-adjustment-error"]],
  ],
  [
    ["Same amount", "Which group is the same as 5?", "Find the matching amount.", ["5", "10", "2"], "5", groups("Target 5.", [5, 5, 10], ["target", "same", "double"]), "same-amount", "Same amount", ["same-vs-double"]],
    ["Double 3", "What is double 3?", "Make two groups of 3.", ["6", "3", "9"], "6", groups("Two groups of 3.", [3, 3], ["3", "3"]), "double", "Double", ["double-adds-one-group-only"]],
    ["Half of 8", "What is half of 8?", "Split 8 into two equal groups.", ["4", "2", "8"], "4", groups("8 split into two halves.", [4, 4], ["half", "half"]), "half", "Half", ["half-vs-whole"]],
    ["Double picture", "Which picture shows double 4?", "Look for two equal groups of 4.", ["4 and 4", "4 and 2", "4 and 1"], "4 and 4", groups("Double 4.", [4, 4], ["4", "4"]), "double", "Double", ["double-picture-gap"]],
    ["Same as 6", "Which comparison says same amount?", "Choose the group that matches 6.", ["6 and 6", "6 and 3", "6 and 12"], "6 and 6", groups("Compare with 6.", [6, 6, 3, 12], ["target", "same", "half", "double"]), "same-amount", "Same amount", ["comparison-language-gap"]],
    ["Half picture", "Which picture shows half of 10?", "Look for one of two equal groups from 10.", ["5 counters", "10 counters", "2 counters"], "5 counters", groups("10 split into 5 and 5.", [5, 5], ["half", "half"]), "half", "Half", ["selects-total"]],
    ["Double 5", "Double 5 is?", "Use two groups of 5.", ["10", "7", "15"], "10", groups("Two fives.", [5, 5], ["5", "5"]), "double", "Double", ["counting-slip"]],
    ["Half of 12", "Half of 12 is?", "Share 12 into two equal groups.", ["6", "4", "10"], "6", groups("Two equal groups from 12.", [6, 6], ["half", "half"]), "half", "Half", ["division-by-wrong-number"]],
    ["Which is double", "Which pair shows double?", "Find one group twice as large as the other.", ["3 and 6", "3 and 4", "3 and 3"], "3 and 6", groups("6 is double 3.", [3, 6], ["small", "double"]), "multiplicative-language", "Scaling language", ["more-instead-of-double"]],
    ["Which is half", "Which pair shows half?", "Find one group that is half of the other.", ["4 and 8", "4 and 6", "4 and 4"], "4 and 8", groups("4 is half of 8.", [4, 8], ["half", "whole"]), "multiplicative-language", "Scaling language", ["half-as-minus-two"]],
    ["Build double", "A tower has 6 blocks. How many blocks in a double tower?", "Make two towers of 6.", ["12", "8", "6"], "12", groups("Double the tower.", [6, 6], ["tower", "tower"]), "double", "Double", ["double-context-gap"]],
    ["Build half", "A row has 14 counters. Half the row has how many?", "Split the row into two equal parts.", ["7", "12", "2"], "7", groups("14 split into two equal parts.", [7, 7], ["half", "half"]), "half", "Half", ["half-context-gap"]],
  ],
  [
    ["Twice as many", "Which statement matches 4 and 8?", "Compare how many 4s make 8.", ["8 is twice as many as 4", "8 is half of 4", "8 is the same as 4"], "8 is twice as many as 4", groups("4 and 8.", [4, 8], ["4", "8"]), "twice", "Twice as many", ["additive-only-comparison"]],
    ["Half as much", "Which statement matches 5 and 10?", "Think about the smaller group compared with the larger group.", ["5 is half as much as 10", "5 is double 10", "5 is the same as 10"], "5 is half as much as 10", groups("5 and 10.", [5, 10], ["5", "10"]), "half-comparison", "Half comparison", ["comparison-direction-error"]],
    ["Three times", "Which group is 3 times as many as 2?", "Make three groups of 2.", ["6", "5", "3"], "6", groups("Three groups of 2.", [2, 2, 2], ["2", "2", "2"]), "times-as-many", "Times as many", ["multiplier-as-addend"]],
    ["Compare 6 and 18", "18 is how many times 6?", "Count equal groups of 6.", ["3 times", "12 times", "2 times"], "3 times", groups("18 as groups of 6.", [6, 6, 6], ["6", "6", "6"]), "times-as-many", "Times as many", ["difference-as-scale"]],
    ["Double not more", "Which is a multiplicative comparison?", "Choose the sentence about scaling.", ["12 is double 6", "12 is 6 more than 6", "12 and 6 are even"], "12 is double 6", groups("Compare 6 and 12.", [6, 12], ["6", "12"]), "language", "Comparison language", ["additive-vs-multiplicative"]],
    ["Half relationship", "Which pair shows one amount half as much?", "Find the pair where the larger is double the smaller.", ["7 and 14", "7 and 10", "7 and 7"], "7 and 14", groups("7 is half of 14.", [7, 14], ["half", "whole"]), "half-comparison", "Half comparison", ["half-pair-gap"]],
    ["Four times", "A small bag has 3 marbles. A large bag has 12. Which comparison fits?", "Think 4 groups of 3.", ["The large bag has 4 times as many", "The large bag has 3 times as many", "They are the same"], "The large bag has 4 times as many", groups("12 as four groups of 3.", [3, 3, 3, 3], ["3", "3", "3", "3"]), "times-as-many", "Times as many", ["scale-factor-gap"]],
    ["Which model matches", "Which model matches 2 times as many?", "Find two equal copies of the smaller group.", ["5 and 10", "5 and 7", "5 and 5"], "5 and 10", groups("10 is two groups of 5.", [5, 5], ["copy", "copy"]), "model-match", "Model match", ["ratio-model-gap"]],
    ["Compare direction", "If 20 is 5 times 4, what is 4 compared with 20?", "Reverse the comparison carefully.", ["One fifth of 20", "Five times 20", "Four more than 20"], "One fifth of 20", groups("20 split into five groups of 4.", [4, 4, 4, 4, 4], ["1/5", "1/5", "1/5", "1/5", "1/5"]), "comparison-direction", "Comparison direction", ["reverse-comparison-error"]],
    ["Same scale", "Which comparison keeps the same scale idea as 3 to 6?", "3 to 6 means double.", ["4 to 8", "4 to 6", "4 to 12"], "4 to 8", groups("Both are double relationships.", [3, 6, 4, 8], ["3", "6", "4", "8"]), "equivalent-comparison", "Equivalent comparison", ["same-difference-error"]],
    ["Context comparison", "A recipe uses 2 cups flour and 6 cups water. Water is how many times the flour?", "Compare 6 with 2.", ["3 times", "4 times", "8 times"], "3 times", groups("6 is three groups of 2.", [2, 2, 2], ["2", "2", "2"]), "context-comparison", "Context comparison", ["total-vs-factor"]],
    ["Which is not multiplicative", "Which sentence is not a multiplicative comparison?", "Find the sentence about difference, not scale.", ["10 is 4 more than 6", "10 is double 5", "15 is three times 5"], "10 is 4 more than 6", numbers("Difference vs scale.", [6, 10, 5, 15]), "language", "Comparison language", ["operation-language-confusion"]],
  ],
  [
    ["Double recipe", "A snack mix uses 2 cups oats. Double the recipe uses?", "Double the amount of oats.", ["4 cups", "2 cups", "6 cups"], "4 cups", groups("Double 2 cups.", [2, 2], ["original", "extra copy"]), "doubling", "Doubling", ["adds-wrong-amount"]],
    ["Halve recipe", "A recipe uses 8 spoons of yoghurt. Half the recipe uses?", "Take half of 8.", ["4 spoons", "6 spoons", "16 spoons"], "4 spoons", groups("Split 8 into two equal parts.", [4, 4], ["use", "other half"]), "halving", "Halving", ["halves-by-subtracting-two"]],
    ["Scale pattern", "A bracelet uses 3 red beads and 2 blue beads. Double it uses?", "Double both colours.", ["6 red and 4 blue", "6 red and 2 blue", "3 red and 4 blue"], "6 red and 4 blue", groups("Double each part.", [3, 2, 3, 2], ["red", "blue", "red", "blue"]), "scale-both", "Scale both quantities", ["scales-one-part-only"]],
    ["Scale down", "Half of 10 green blocks and 6 yellow blocks is?", "Halve each colour.", ["5 green and 3 yellow", "8 green and 4 yellow", "10 green and 3 yellow"], "5 green and 3 yellow", groups("Halve both parts.", [5, 3, 5, 3], ["use green", "use yellow", "rest", "rest"]), "scale-both", "Scale both quantities", ["half-one-quantity-only"]],
    ["Tripled task", "One kit needs 4 screws. Three kits need?", "Use three groups of 4.", ["12 screws", "7 screws", "8 screws"], "12 screws", groups("Three kits.", [4, 4, 4], ["kit", "kit", "kit"]), "scaling-up", "Scaling up", ["multiplier-addition-confusion"]],
    ["Check scaled pair", "Which pair keeps the same relationship as 2 paint to 5 water?", "Scale both numbers by the same factor.", ["4 paint to 10 water", "4 paint to 5 water", "2 paint to 10 water"], "4 paint to 10 water", groups("Double both parts.", [2, 5, 4, 10], ["2", "5", "4", "10"]), "equivalent-ratio", "Equivalent ratio", ["scales-one-side"]],
    ["Which is not scaled", "Which is not a double of 3 apples and 4 oranges?", "Double both parts.", ["6 apples and 8 oranges", "6 apples and 4 oranges", "3 apples and 4 oranges"], "6 apples and 4 oranges", groups("Only apples doubled.", [3, 4, 6, 4], ["orig A", "orig O", "new A", "new O"]), "scale-both", "Scale both quantities", ["partial-scaling"]],
    ["Scale by 5", "One table seats 6 people. Five tables seat?", "Use five equal groups of 6.", ["30 people", "11 people", "25 people"], "30 people", groups("Five tables.", [6, 6, 6, 6, 6], ["table", "table", "table", "table", "table"]), "scaling-up", "Scaling up", ["adds-factor"]],
    ["Halve drawing", "A drawing is 12 cm long. Half-size is?", "Halve 12 cm.", ["6 cm", "10 cm", "24 cm"], "6 cm", numbers("Half-size drawing.", [12, 6]), "halving", "Halving", ["scale-direction-error"]],
    ["Double drawing", "A 5 cm drawing is doubled. What length now?", "Multiply by 2.", ["10 cm", "7 cm", "3 cm"], "10 cm", numbers("Double the length.", [5, 10]), "doubling", "Doubling", ["length-difference-error"]],
    ["Same relationship", "Which scaled recipe matches 1 cup syrup to 3 cups water?", "Keep syrup and water in the same relationship.", ["2 cups syrup to 6 cups water", "2 cups syrup to 3 cups water", "1 cup syrup to 6 cups water"], "2 cups syrup to 6 cups water", groups("Double both parts.", [1, 3, 2, 6], ["1", "3", "2", "6"]), "equivalent-ratio", "Equivalent ratio", ["same-total-not-same-ratio"]],
    ["Reasonable scale", "A half-size model of 18 cm should be?", "Half-size means half the length.", ["9 cm", "20 cm", "36 cm"], "9 cm", numbers("Half of 18.", [18, 9]), "scale-checking", "Scale checking", ["unreasonable-scale-not-checked"]],
  ],
  [
    ["Table match", "Which table keeps 2 apples for 3 oranges?", "Look for both numbers multiplied by the same amount.", ["2:3, 4:6, 6:9", "2:3, 4:5, 6:7", "2:3, 3:4, 4:5"], "2:3, 4:6, 6:9", numbers("Equivalent ratio table.", ["2:3", "4:6", "6:9"]), "ratio-tables", "Ratio tables", ["additive-table-pattern"]],
    ["Diagram match", "Which diagram matches 1 red for every 2 blue?", "Find groups with twice as many blue as red.", ["2 red and 4 blue", "2 red and 2 blue", "4 red and 2 blue"], "2 red and 4 blue", groups("1 red for every 2 blue, doubled.", [2, 4], ["red", "blue"]), "diagrams", "Diagrams", ["part-order-confusion"]],
    ["Extend table", "For every 3 cups flour, use 5 cups water. What matches 6 cups flour?", "Double both quantities.", ["10 cups water", "8 cups water", "15 cups water"], "10 cups water", numbers("3:5 doubled is 6:10.", ["3:5", "6:10"]), "extend-table", "Extend tables", ["scales-one-column"]],
    ["Find missing", "A table shows 4 tickets cost $20. What do 2 tickets cost?", "Halve both tickets and cost.", ["$10", "$18", "$40"], "$10", numbers("Halve 4:$20 to 2:$10.", [4, "$20", 2, "$10"]), "missing-value", "Missing values", ["halves-count-not-cost"]],
    ["Same relationship", "Which pair has the same relationship as 5 km in 10 min?", "Keep minutes per kilometre the same.", ["10 km in 20 min", "10 km in 15 min", "5 km in 20 min"], "10 km in 20 min", numbers("Double both distance and time.", ["5 km", "10 min", "10 km", "20 min"]), "equivalent-relationships", "Equivalent relationships", ["same-difference-error"]],
    ["Table error", "Which row breaks the 2:5 relationship?", "Check each row against the same scale factor.", ["4:10", "6:15", "8:15"], "8:15", numbers("Check rows.", ["2:5", "4:10", "6:15", "8:15"]), "error-checking", "Check tables", ["table-row-not-checked"]],
    ["Bar model", "A tape shows 3 equal red parts and 6 equal blue parts. Which ratio fits?", "Compare red parts to blue parts.", ["3:6", "6:3", "9:3"], "3:6", groups("Tape parts.", [3, 6], ["red", "blue"]), "diagrams", "Diagrams", ["ratio-order-error"]],
    ["Recipe table", "2 batches need 8 eggs. How many eggs for 5 batches?", "Find 4 eggs per batch, then scale to 5.", ["20 eggs", "13 eggs", "10 eggs"], "20 eggs", numbers("Batch table: 2 to 8, 5 to 20.", [2, 8, 5, 20]), "ratio-tables", "Ratio tables", ["unit-rate-gap"]],
    ["Double number line", "Which double number line matches 3 bags for $12?", "Each bag is $4.", ["1 bag $4, 2 bags $8, 3 bags $12", "1 bag $3, 2 bags $6, 3 bags $12", "1 bag $12, 2 bags $24, 3 bags $36"], "1 bag $4, 2 bags $8, 3 bags $12", numbers("Bags and dollars.", [1, "$4", 2, "$8", 3, "$12"]), "double-number-line", "Double number lines", ["line-scale-error"]],
    ["Equivalent table", "Which row is equivalent to 7:4?", "Multiply both parts by the same factor.", ["14:8", "14:4", "7:8"], "14:8", numbers("7:4 doubled.", ["7:4", "14:8"]), "equivalent-relationships", "Equivalent relationships", ["scales-one-side"]],
    ["Interpret row", "A table says 9 pencils cost $18. What does one pencil cost?", "Divide both quantities by 9.", ["$2", "$9", "$27"], "$2", numbers("Unit row from 9:$18.", [9, "$18", 1, "$2"]), "missing-value", "Missing values", ["unit-value-gap"]],
    ["Choose diagram", "Which diagram helps compare 4:6 and 8:12?", "Use equal groups to show both are doubled.", ["Two matching bar models", "One unrelated number list", "A clock face"], "Two matching bar models", groups("4:6 doubled to 8:12.", [4, 6, 8, 12], ["4", "6", "8", "12"]), "model-choice", "Model choice", ["unhelpful-model-choice"]],
  ],
  [
    ["Each price", "A pack of 4 costs $12. What is the cost each?", "Divide dollars by items.", ["$3 each", "$4 each", "$16 each"], "$3 each", groups("$12 across 4 items.", [3, 3, 3, 3], ["item", "item", "item", "item"]), "unit-rate", "Unit rate", ["total-vs-each"]],
    ["For every", "A recipe uses 2 cups rice for every 5 cups water. Which statement matches?", "Use the for every relationship.", ["For 4 cups rice, use 10 cups water", "For 4 cups rice, use 5 cups water", "For 2 cups rice, use 10 cups water"], "For 4 cups rice, use 10 cups water", groups("Double 2:5 to 4:10.", [2, 5, 4, 10], ["2", "5", "4", "10"]), "for-every", "For every", ["for-every-scale-gap"]],
    ["Speed rate", "A cyclist rides 24 km in 2 hours. What is the rate?", "Find kilometres per hour.", ["12 km/h", "22 km/h", "48 km/h"], "12 km/h", numbers("24 km in 2 hours.", [24, 2, 12]), "speed-rate", "Speed rate", ["rate-operation-error"]],
    ["Better value", "Which is better value: 3 for $9 or 5 for $20?", "Compare cost per item.", ["3 for $9", "5 for $20", "They are the same"], "3 for $9", numbers("Unit prices: $3 and $4.", ["$9/3", "$20/5"]), "unit-comparison", "Unit comparison", ["total-price-only"]],
    ["Per minute", "A machine makes 30 labels in 5 minutes. How many per minute?", "Divide labels by minutes.", ["6 labels", "25 labels", "150 labels"], "6 labels", groups("30 labels across 5 minutes.", [6, 6, 6, 6, 6], ["min", "min", "min", "min", "min"]), "unit-rate", "Unit rate", ["multiply-instead-of-divide"]],
    ["Same rate", "Which rate is the same as 18 pages in 3 minutes?", "Find pages per minute.", ["6 pages in 1 minute", "3 pages in 18 minutes", "9 pages in 3 minutes"], "6 pages in 1 minute", numbers("18 pages / 3 minutes = 6 per minute.", [18, 3, 6]), "equivalent-rate", "Equivalent rates", ["rate-order-error"]],
    ["Fair share rate", "12 counters for 4 players means?", "Find counters per player.", ["3 counters each", "4 counters each", "8 counters each"], "3 counters each", groups("12 shared among 4 players.", [3, 3, 3, 3], ["player", "player", "player", "player"]), "unit-rate", "Unit rate", ["share-count-error"]],
    ["Compare speeds", "Runner A travels 10 km in 2 h. Runner B travels 18 km in 3 h. Who is faster?", "Compare km per hour.", ["Runner B", "Runner A", "They are the same"], "Runner B", numbers("A: 5 km/h, B: 6 km/h.", ["10/2", "18/3"]), "speed-rate", "Speed rate", ["distance-only-comparison"]],
    ["Unit from table", "8 cups cost $24. What is the cost per cup?", "Find one cup.", ["$3", "$8", "$16"], "$3", numbers("8 cups to $24, 1 cup to $3.", [8, "$24", 1, "$3"]), "unit-rate", "Unit rate", ["unit-row-gap"]],
    ["Rate language", "Which phrase is a rate?", "Look for per or each language.", ["60 kilometres per hour", "60 kilometres", "60 hours"], "60 kilometres per hour", numbers("Rate language.", ["km", "per", "hour"]), "language", "Rate language", ["rate-language-gap"]],
    ["Same value", "Which pack has the same unit price as 2 for $6?", "2 for $6 is $3 each.", ["5 for $15", "5 for $10", "3 for $12"], "5 for $15", numbers("Same $3 each.", ["2:$6", "5:$15"]), "equivalent-rate", "Equivalent rates", ["same-total-confusion"]],
    ["Which is fairer", "A game gives 15 points for 3 tasks. What is a fair score for 5 tasks at the same rate?", "Find points per task, then scale to 5.", ["25 points", "18 points", "45 points"], "25 points", groups("5 points per task.", [5, 5, 5, 5, 5], ["task", "task", "task", "task", "task"]), "for-every", "For every", ["additive-rate-error"]],
  ],
  [
    ["Use percent", "Which form helps compare 18 wins out of 20?", "A percentage makes the comparison easy.", ["90%", "18%", "20%"], "90%", groups("18 out of 20 scaled to 90 out of 100.", [90, 10], ["wins", "losses"]), "percent-comparison", "Percent comparison", ["part-as-percent-of-100-gap"]],
    ["Use fraction", "Which fraction matches 6 successes out of 8?", "Use successes over total attempts.", ["6/8", "8/6", "2/8"], "6/8", groups("6 successes out of 8.", [6, 2], ["success", "other"]), "fraction-comparison", "Fraction comparison", ["part-total-reversal"]],
    ["Use decimal", "Which decimal matches 7 out of 10?", "Seven tenths is 0.7.", ["0.7", "0.07", "7.0"], "0.7", numbers("7/10 = 0.7.", ["7/10", "0.7"]), "decimal-comparison", "Decimal comparison", ["decimal-place-error"]],
    ["Compare forms", "Which is larger: 75% or 0.6?", "Change to the same form.", ["75%", "0.6", "They are equal"], "75%", numbers("75% = 0.75, and 0.75 > 0.6.", ["0.75", "0.6"]), "compare-forms", "Compare forms", ["mixed-form-gap"]],
    ["Fair comparison", "Which team has the better success rate?", "Compare percentages.", ["Team A: 8 of 10", "Team B: 15 of 20", "They are the same"], "Team A: 8 of 10", numbers("A = 80%, B = 75%.", ["8/10", "15/20"]), "proportional-comparison", "Proportional comparison", ["absolute-count-bias"]],
    ["Choose form", "Which form is useful for 45 out of 100?", "Out of 100 links directly to percent.", ["45%", "0.45 only", "45/10"], "45%", groups("45 out of 100.", [45, 55], ["part", "rest"]), "representation-choice", "Representation choice", ["percent-link-gap"]],
    ["Equivalent forms", "Which set shows the same proportion?", "Match fraction, decimal, and percent.", ["1/4, 0.25, 25%", "1/4, 0.4, 25%", "1/2, 0.25, 50%"], "1/4, 0.25, 25%", groups("One quarter of a whole.", [25, 75], ["25%", "rest"]), "equivalent-forms", "Equivalent forms", ["benchmark-link-gap"]],
    ["Discount compare", "Which discount is larger: 0.2 of the price or 15%?", "Change 0.2 to 20%.", ["0.2 of the price", "15%", "They are equal"], "0.2 of the price", numbers("0.2 = 20%.", ["0.2", "20%", "15%"]), "financial-comparison", "Financial comparison", ["decimal-percent-link-gap"]],
    ["Fraction to percent", "Which percentage matches 3/5?", "Scale fifths to hundredths.", ["60%", "35%", "30%"], "60%", groups("3/5 equals 60/100.", [60, 40], ["part", "rest"]), "percent-comparison", "Percent comparison", ["scale-to-100-error"]],
    ["Decimal to fraction", "Which fraction matches 0.4 of a group?", "0.4 is four tenths.", ["4/10", "4/100", "1/4"], "4/10", numbers("0.4 = 4/10.", ["0.4", "4/10"]), "decimal-comparison", "Decimal comparison", ["tenths-hundredths-confusion"]],
    ["Which comparison is fair", "Which comparison is fairer for quiz results?", "Use percentages because totals differ.", ["18/20 and 27/30 as percentages", "18 and 27 only", "20 and 30 only"], "18/20 and 27/30 as percentages", numbers("Compare rates, not just scores.", ["18/20", "27/30"]), "proportional-comparison", "Proportional comparison", ["compares-counts-only"]],
    ["Reasonable form", "A learner says 50% is less than 0.4. What should they notice?", "Change 50% to 0.5.", ["50% is greater than 0.4", "50% is less than 0.4", "They cannot be compared"], "50% is greater than 0.4", numbers("50% = 0.5.", ["50%", "0.5", "0.4"]), "compare-forms", "Compare forms", ["mixed-form-order-error"]],
  ],
  [
    ["Map scale", "A map uses 1 cm for 4 km. What does 5 cm represent?", "Multiply the real distance by 5.", ["20 km", "9 km", "45 km"], "20 km", groups("Five scale units of 4 km.", [4, 4, 4, 4, 4], ["cm", "cm", "cm", "cm", "cm"]), "scale", "Scale", ["scale-addition-error"]],
    ["Unit price", "Which is cheaper per item: 4 for $12 or 6 for $15?", "Find the cost per item.", ["6 for $15", "4 for $12", "They are the same"], "6 for $15", numbers("Unit prices: $3 and $2.50.", ["$12/4", "$15/6"]), "unit-comparison", "Unit comparison", ["total-price-bias"]],
    ["Scale drawing", "A 3 cm drawing represents 15 m. What does 1 cm represent?", "Find the unit scale.", ["5 m", "12 m", "45 m"], "5 m", numbers("3 cm to 15 m, 1 cm to 5 m.", [3, 15, 1, 5]), "scale", "Scale", ["unit-scale-gap"]],
    ["Recipe scale", "A recipe for 3 people uses 600 g pasta. How much for 5 people?", "Find 200 g per person, then scale to 5.", ["1000 g", "800 g", "3000 g"], "1000 g", groups("200 g per person.", [200, 200, 200, 200, 200], ["person", "person", "person", "person", "person"]), "scaling", "Scaling", ["additive-scaling-error"]],
    ["Best rate", "Which speed is faster?", "Compare kilometres per hour.", ["90 km in 1.5 h", "100 km in 2 h", "They are equal"], "90 km in 1.5 h", numbers("90/1.5 = 60, 100/2 = 50.", ["60 km/h", "50 km/h"]), "rate-comparison", "Rate comparison", ["distance-only-error"]],
    ["Unit conversion", "A cord costs $18 for 9 m. What is the cost per metre?", "Divide cost by metres.", ["$2 per m", "$9 per m", "$27 per m"], "$2 per m", numbers("9 m to $18, 1 m to $2.", [9, "$18", 1, "$2"]), "unit-comparison", "Unit comparison", ["unit-rate-operation-error"]],
    ["Scale down", "A plan is 1:50. A 2 cm plan length is what real length?", "Each plan cm is 50 cm in real life.", ["100 cm", "52 cm", "25 cm"], "100 cm", groups("Two scale units of 50 cm.", [50, 50], ["cm", "cm"]), "scale", "Scale", ["ratio-direction-error"]],
    ["Shopping value", "Which pack is better value?", "Compare dollars per kilogram.", ["3 kg for $12", "5 kg for $25", "They are equal"], "3 kg for $12", numbers("$4/kg and $5/kg.", ["$12/3", "$25/5"]), "unit-comparison", "Unit comparison", ["pack-size-bias"]],
    ["Scale factor", "A photo is enlarged from 4 cm wide to 12 cm wide. What scale factor?", "Compare new width to original width.", ["3", "8", "16"], "3", numbers("12 is 3 times 4.", [4, 12, 3]), "scale-factor", "Scale factor", ["difference-as-scale-factor"]],
    ["Same scale", "Which enlargement keeps the same scale as 5 cm to 20 cm?", "The scale factor is 4.", ["7 cm to 28 cm", "7 cm to 21 cm", "7 cm to 12 cm"], "7 cm to 28 cm", numbers("Scale factor 4.", ["5 to 20", "7 to 28"]), "scale-factor", "Scale factor", ["same-difference-error"]],
    ["Map decision", "A map route is 6 cm. Scale is 1 cm to 3 km. Which distance is right?", "Use 6 groups of 3 km.", ["18 km", "9 km", "63 km"], "18 km", groups("Six scale units.", [3, 3, 3, 3, 3, 3], ["km", "km", "km", "km", "km", "km"]), "scale", "Scale", ["scale-multiplication-gap"]],
    ["Unit compare context", "Which comparison uses unit thinking?", "Look for each or per language.", ["Cost per litre", "Total bottle cost only", "Bottle colour"], "Cost per litre", numbers("Unit comparison.", ["cost", "per", "litre"]), "unit-comparison", "Unit comparison", ["unit-language-gap"]],
  ],
  [
    ["Ratio table missing", "A ratio table has 3:8 and 6:16. What matches 9?", "Multiply 3 by 3, so multiply 8 by 3.", ["24", "19", "18"], "24", numbers("3:8, 6:16, 9:24.", ["3:8", "6:16", "9:24"]), "ratio-table", "Ratio tables", ["additive-table-error"]],
    ["Unit rate solve", "7 tickets cost $42. What do 3 tickets cost?", "Find $6 per ticket, then multiply by 3.", ["$18", "$21", "$45"], "$18", groups("$6 per ticket.", [6, 6, 6], ["ticket", "ticket", "ticket"]), "unit-rate", "Unit rate", ["uses-total-as-unit"]],
    ["Recipe proportion", "4 cups flour need 10 cups water. How much water for 6 cups flour?", "Scale by 1.5 or use 2.5 cups water per cup flour.", ["15 cups", "12 cups", "20 cups"], "15 cups", numbers("4:10 equals 6:15.", ["4", "10", "6", "15"]), "proportion", "Proportion", ["non-proportional-addition"]],
    ["Distance rate", "A train travels 180 km in 3 h. How far in 5 h at the same speed?", "Find 60 km per hour.", ["300 km", "185 km", "108 km"], "300 km", groups("60 km each hour.", [60, 60, 60, 60, 60], ["h", "h", "h", "h", "h"]), "unit-rate", "Unit rate", ["time-addition-error"]],
    ["Table row check", "Which row does not fit 5 kg for $20?", "The unit price is $4 per kg.", ["10 kg for $40", "2 kg for $8", "8 kg for $28"], "8 kg for $28", numbers("$4 per kg rows.", ["5:$20", "10:$40", "2:$8", "8:$28"]), "table-check", "Check tables", ["row-not-checked"]],
    ["Double line", "Which double number line fits 2 hours to 150 km?", "Each hour is 75 km.", ["1 h 75 km, 2 h 150 km, 4 h 300 km", "1 h 50 km, 2 h 150 km, 4 h 200 km", "1 h 150 km, 2 h 300 km"], "1 h 75 km, 2 h 150 km, 4 h 300 km", numbers("Hours and kilometres.", [1, 75, 2, 150, 4, 300]), "double-number-line", "Double number lines", ["line-scale-gap"]],
    ["Best strategy", "Which strategy helps solve 12 pens for $30 and 20 pens cost?", "Find the unit cost first.", ["Use $2.50 per pen", "Add 8 to $30", "Multiply 12 and 30"], "Use $2.50 per pen", numbers("12 pens to $30, 1 pen to $2.50.", [12, "$30", 1, "$2.50"]), "strategy-choice", "Strategy choice", ["inefficient-or-wrong-strategy"]],
    ["Equivalent ratio", "Which ratio is equivalent to 12:15?", "Divide both parts by 3.", ["4:5", "3:5", "12:5"], "4:5", numbers("12:15 simplifies to 4:5.", ["12:15", "4:5"]), "equivalent-ratio", "Equivalent ratios", ["simplifies-one-part"]],
    ["Proportional value", "If 5 folders cost $7.50, what do 2 folders cost?", "Find $1.50 per folder.", ["$3.00", "$5.50", "$15.00"], "$3.00", groups("$1.50 per folder.", [3, 3], ["two folders", ""]), "unit-rate", "Unit rate", ["decimal-unit-rate-gap"]],
    ["Missing factor", "A scale table changes 6 to 24. What does 9 change to with the same factor?", "The scale factor is 4.", ["36", "27", "30"], "36", numbers("Multiply by 4.", [6, 24, 9, 36]), "scale-factor", "Scale factor", ["factor-vs-difference"]],
    ["Which is proportional", "Which pair keeps the same relationship as 8 workers finish 24 tasks?", "Each worker is linked to 3 tasks.", ["12 workers finish 36 tasks", "12 workers finish 28 tasks", "4 workers finish 24 tasks"], "12 workers finish 36 tasks", numbers("3 tasks per worker.", ["8:24", "12:36"]), "proportion", "Proportion", ["same-addition-error"]],
    ["Interpret answer", "A unit-rate solution gives 4.5 buses. What should happen for a real trip?", "Buses must be whole, so round up.", ["Use 5 buses", "Use 4 buses", "Use 4.5 buses"], "Use 5 buses", groups("4 full buses plus extra people.", [4, 1], ["full buses", "extra"]), "context-interpretation", "Interpret context", ["context-rounding-gap"]],
  ],
  [
    ["Fair comparison", "Two children share 12 and 18 counters with 3 children in one group and 6 in the other. Which is fairer?", "Compare counters per child.", ["12 counters for 3 children", "18 counters for 6 children", "They are the same"], "12 counters for 3 children", numbers("4 each vs 3 each.", ["12/3", "18/6"]), "fairness", "Fairness", ["total-count-bias"]],
    ["Best value", "Which is better value?", "Compare cost per kilogram.", ["2 kg for $8", "5 kg for $25", "They are the same"], "2 kg for $8", numbers("$4/kg and $5/kg.", ["8/2", "25/5"]), "value", "Value", ["larger-pack-assumption"]],
    ["Efficiency", "Machine A makes 80 parts in 4 h. Machine B makes 90 parts in 5 h. Which is more efficient?", "Compare parts per hour.", ["Machine A", "Machine B", "They are equal"], "Machine A", numbers("A: 20/h, B: 18/h.", ["80/4", "90/5"]), "efficiency", "Efficiency", ["total-output-bias"]],
    ["Speed choice", "Which trip is faster?", "Compare speed.", ["150 km in 2 h", "180 km in 3 h", "They are equal"], "150 km in 2 h", numbers("75 km/h vs 60 km/h.", ["150/2", "180/3"]), "speed", "Speed", ["distance-only-bias"]],
    ["Density", "Which mix tastes stronger: 2 scoops in 500 mL or 3 scoops in 900 mL?", "Compare scoops per mL or mL per scoop.", ["2 scoops in 500 mL", "3 scoops in 900 mL", "They are the same"], "2 scoops in 500 mL", numbers("250 mL per scoop vs 300 mL per scoop.", ["500/2", "900/3"]), "density", "Density", ["more-scoops-bias"]],
    ["Fair score", "Player A scores 18 from 30 shots. Player B scores 15 from 20 shots. Who has the better rate?", "Compare percentages.", ["Player B", "Player A", "They are equal"], "Player B", numbers("A 60%, B 75%.", ["18/30", "15/20"]), "fairness", "Fairness", ["made-shots-only"]],
    ["Fuel efficiency", "Car A uses 8 L for 100 km. Car B uses 10 L for 150 km. Which uses less fuel per km?", "Compare litres per kilometre.", ["Car B", "Car A", "They are equal"], "Car B", numbers("A 0.08 L/km, B about 0.067 L/km.", ["8/100", "10/150"]), "efficiency", "Efficiency", ["lower-total-fuel-bias"]],
    ["Sharing judgement", "Which sharing is fairer?", "Compare each person's share.", ["20 snacks for 5 people", "18 snacks for 6 people", "They are the same"], "20 snacks for 5 people", numbers("4 each vs 3 each.", ["20/5", "18/6"]), "fairness", "Fairness", ["group-size-bias"]],
    ["Value claim", "A learner says 10 for $18 is always better than 6 for $12 because 10 is more. What should they check?", "Compare cost per item.", ["Unit price", "Total number only", "Package colour"], "Unit price", numbers("Compare per item.", ["$18/10", "$12/6"]), "judgement", "Judgement", ["total-quantity-bias"]],
    ["Efficient worker", "Worker A packs 45 boxes in 3 h. Worker B packs 70 boxes in 5 h. Who packs faster?", "Compare boxes per hour.", ["Worker A", "Worker B", "They are equal"], "Worker A", numbers("A 15/h, B 14/h.", ["45/3", "70/5"]), "efficiency", "Efficiency", ["total-output-bias"]],
    ["Fair discount", "Which discount is better?", "Compare percentage discount.", ["$20 off $100", "$15 off $60", "They are equal"], "$15 off $60", numbers("20% vs 25%.", ["20/100", "15/60"]), "value", "Value", ["dollar-amount-bias"]],
    ["Reasonable conclusion", "Which conclusion fits 30 correct out of 50 and 42 correct out of 70?", "Compare the proportions.", ["They are the same rate", "42 out of 70 is better", "30 out of 50 is better"], "They are the same rate", numbers("Both are 60%.", ["30/50", "42/70"]), "judgement", "Judgement", ["absolute-count-bias"]],
  ],
  [
    ["Graph through origin", "Which graph could show a proportional relationship?", "Look for a straight line through zero.", ["A straight line through zero", "A curved line", "A line that starts at 5"], "A straight line through zero", numbers("Proportional graph clue.", [0, "same rate", "straight line"]), "graphs", "Proportional graphs", ["graph-origin-gap"]],
    ["Distance graph", "A graph shows 60 km in 1 hour and 120 km in 2 hours. What is the speed?", "Use distance per hour.", ["60 km/h", "120 km/h", "30 km/h"], "60 km/h", numbers("Distance-time graph points.", ["1h:60", "2h:120"]), "graphs", "Proportional graphs", ["reads-total-as-rate"]],
    ["Finance model", "Simple interest is 5% per year on $400. What is one year of interest?", "Find 5% of 400.", ["$20", "$5", "$80"], "$20", groups("5% of four hundreds.", [5, 5, 5, 5, 95, 95, 95, 95], ["5%", "5%", "5%", "5%", "rest", "rest", "rest", "rest"]), "finance", "Financial modelling", ["percent-of-whole-gap"]],
    ["Scale model", "A model uses scale 1:25. A 4 cm model length represents what real length?", "Multiply the model length by 25.", ["100 cm", "29 cm", "6.25 cm"], "100 cm", groups("Four model centimetres, each worth 25 cm.", [25, 25, 25, 25], ["cm", "cm", "cm", "cm"]), "scale-modelling", "Scale modelling", ["scale-direction-error"]],
    ["Graph equation", "Which equation represents direct proportion with constant 3?", "Direct proportion can be written y = kx.", ["y = 3x", "y = x + 3", "y = 3 - x"], "y = 3x", numbers("Direct proportion model.", ["x", "3x", "y"]), "algebraic-models", "Algebraic models", ["additive-model-confusion"]],
    ["Unit price model", "A table shows 2 kg costs $9 and 6 kg costs $27. What is the constant cost per kg?", "Divide cost by kilograms.", ["$4.50/kg", "$9/kg", "$13.50/kg"], "$4.50/kg", numbers("Cost per kg stays constant.", ["2:$9", "6:$27", "$4.50/kg"]), "finance", "Financial modelling", ["unit-rate-decimal-gap"]],
    ["Currency model", "A conversion rate is 1 token = 6 credits. Which equation models credits c for tokens t?", "Credits are 6 times tokens.", ["c = 6t", "c = t + 6", "t = 6c"], "c = 6t", groups("Each token is 6 credits.", [6, 6, 6], ["token", "token", "token"]), "algebraic-models", "Algebraic models", ["variable-order-confusion"]],
    ["Graph point", "If y = 4x, which point fits?", "Multiply x by 4 to get y.", ["(3, 12)", "(3, 7)", "(12, 3)"], "(3, 12)", numbers("Use y = 4x.", ["x=3", "y=12"]), "graphs", "Proportional graphs", ["coordinate-order-error"]],
    ["Measurement model", "A spring stretches 2 cm for every 5 kg. What stretch for 20 kg?", "Scale 5 kg to 20 kg by 4.", ["8 cm", "17 cm", "50 cm"], "8 cm", numbers("5kg:2cm, 20kg:8cm.", ["5:2", "20:8"]), "measurement", "Measurement modelling", ["additive-scaling"]],
    ["Compare models", "Which model is proportional?", "Check whether the ratio stays constant.", ["Cost = $3 per ticket", "Cost = $3 plus $2 per ticket", "Cost starts at $5"], "Cost = $3 per ticket", numbers("No fixed starting cost.", ["0 tickets:$0", "1 ticket:$3"]), "model-choice", "Model choice", ["fixed-cost-proportion-confusion"]],
    ["Finance graph", "A savings graph goes through (0,0), (2,50), and (4,100). How much is saved per week?", "Find the constant rate.", ["$25/week", "$50/week", "$100/week"], "$25/week", numbers("Savings graph points.", ["2:$50", "4:$100"]), "graphs", "Proportional graphs", ["point-value-as-rate"]],
    ["Model fit", "A taxi costs $5 plus $2 per km. Is this direct proportion from distance to cost?", "Check whether zero distance costs zero dollars.", ["No, there is a fixed $5 cost", "Yes, every graph is proportional", "Yes, because the cost increases"], "No, there is a fixed $5 cost", numbers("Fixed cost breaks direct proportion.", ["0 km:$5", "1 km:$7"]), "model-choice", "Model choice", ["increase-means-proportional"]],
  ],
  [
    ["Check reasonableness", "A learner says 25% of $80 is $60. What should they notice?", "25% is one quarter.", ["$60 is too large", "$60 is correct", "$60 is too small"], "$60 is too large", groups("One quarter of 80 is 20.", [20, 20, 20, 20], ["25%", "25%", "25%", "25%"]), "checking", "Check reasonableness", ["benchmark-not-used"]],
    ["Critique table", "Which row breaks the relationship 4 L paint for 10 m2?", "Check the same scale factor.", ["8 L for 20 m2", "2 L for 5 m2", "6 L for 20 m2"], "6 L for 20 m2", numbers("Paint coverage table.", ["4:10", "8:20", "2:5", "6:20"]), "critique", "Critique proportional work", ["table-row-not-critiqued"]],
    ["Explain strategy", "Which explanation best supports 3 bags for $15 and 8 bags for $40?", "Use the same cost per bag.", ["Both use $5 per bag", "Both add 5", "Both have 3 bags"], "Both use $5 per bag", groups("$5 per bag.", [5, 5, 5, 5, 5, 5, 5, 5], ["bag", "bag", "bag", "bag", "bag", "bag", "bag", "bag"]), "communication", "Communicate reasoning", ["explanation-not-linked-to-rate"]],
    ["Spot non-proportional", "A table shows 1 item $7, 2 items $9, 3 items $11. Is cost proportional to items?", "Check whether the cost per item stays the same.", ["No", "Yes", "Only for 3 items"], "No", numbers("Cost per item changes.", ["1:$7", "2:$9", "3:$11"]), "critique", "Critique proportional work", ["linear-means-proportional"]],
    ["Choose clear working", "Which working is clearest for 9 kg costs $36, find 4 kg?", "Find the unit rate first.", ["$36 ÷ 9 = $4, then 4 x $4", "$36 + 4", "9 x 36"], "$36 ÷ 9 = $4, then 4 x $4", numbers("Unit-rate working.", [9, "$36", 1, "$4", 4, "$16"]), "communication", "Communicate reasoning", ["unclear-method-choice"]],
    ["Estimate first", "Before calculating 49% of 198, which estimate is sensible?", "49% is close to 50%, and 198 is close to 200.", ["About 100", "About 20", "About 400"], "About 100", groups("About half of 200.", [100, 100], ["about 49%", "rest"]), "checking", "Check reasonableness", ["poor-estimate-benchmark"]],
    ["Find error", "A learner scales 5:12 to 10:17. What went wrong?", "Check whether both parts were multiplied by the same factor.", ["They added 5 to both parts", "They doubled both parts", "They found a unit rate"], "They added 5 to both parts", numbers("5:12 should double to 10:24.", ["5:12", "10:17"]), "error-analysis", "Error analysis", ["additive-ratio-error"]],
    ["Communicate conclusion", "Which conclusion is clearest for $18 for 3 tickets and $30 for 5 tickets?", "State the unit rate and comparison.", ["Both are $6 per ticket, so they match", "$30 is bigger, so it is worse", "5 tickets is more"], "Both are $6 per ticket, so they match", numbers("Compare per ticket.", ["18/3", "30/5", "$6"]), "communication", "Communicate reasoning", ["total-only-conclusion"]],
    ["Check graph claim", "A line is straight but starts at y = 4. Is it direct proportion?", "Direct proportion starts at zero.", ["No", "Yes", "Only if it goes up"], "No", numbers("Direct proportion goes through zero.", ["starts at 4", "not zero"]), "critique", "Critique proportional work", ["straight-line-only-error"]],
    ["Rounding decision", "A calculation says 6.2 buses are needed. What should the final decision be?", "Think about the practical context.", ["Use 7 buses", "Use 6 buses", "Use 6.2 buses"], "Use 7 buses", groups("Six full buses plus extra people.", [6, 1], ["full", "extra"]), "context-judgement", "Context judgement", ["rounding-context-error"]],
    ["Alternative methods", "Which two methods should give the same result for 6 notebooks cost $15 and 10 notebooks cost?", "Compare unit rate and scale factor methods.", ["Find $2.50 each or multiply by 10/6", "Add 4 to $15 or subtract 6", "Multiply 6 by 15 or add 10"], "Find $2.50 each or multiply by 10/6", numbers("Two valid proportional methods.", ["unit rate", "scale factor"]), "method-comparison", "Compare methods", ["method-validity-gap"]],
    ["Justify answer", "Which justification best supports 40% of 250 = 100?", "Use a clear proportional link.", ["10% is 25, so 40% is 4 x 25", "40 plus 250 is 290", "250 minus 40 is 210"], "10% is 25, so 40% is 4 x 25", groups("Four tens of percent.", [25, 25, 25, 25], ["10%", "10%", "10%", "10%"]), "communication", "Communicate reasoning", ["justification-not-proportional"]],
  ],
];

const RATIO_CASES: RatioCase[][] = RAW_RATIO_CASES.map((cases) =>
  cases.map(makeCase),
);

export const RATIO_PROPORTIONAL_REASONING_STEP_SPECS: RatioProportionalReasoningStepSpec[] =
  RATIO_STEP_TITLES.map(
    ([title, stepKey, stageKey, stageTitle, stepNumber, shortTitle, description], index) => ({
      order: index + 1,
      stepNumber,
      stageKey,
      stageTitle,
      stepKey,
      pathwayStepId: `mathematics::ratio-and-proportional-reasoning::${stageKey}::${stepKey}`,
      title,
      shortTitle,
      description,
      cases: RATIO_CASES[index],
    }),
  );

export const RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS:
  RatioProportionalReasoningStepAssessment[] =
  RATIO_PROPORTIONAL_REASONING_STEP_SPECS.map((spec) => ({
    key: `ratio-proportional-reasoning-step-${spec.order}-${spec.stepKey}-assessment-v1`,
    stepNumber: spec.stepNumber,
    stepKey: spec.stepKey,
    pathwayStepId: spec.pathwayStepId,
    title: spec.title,
    shortTitle: spec.shortTitle,
    description: spec.description,
    subjectKey: "mathematics",
    strandKey: RATIO_PROPORTIONAL_REASONING_STRAND_KEY,
    stageKey: spec.stageKey,
    parentBankKey: RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_KEY,
    parentBankTitle: RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_TITLE,
    parentItemBankKey: RATIO_PROPORTIONAL_REASONING_ITEM_BANK_KEY,
    progressionBandKey: RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_KEY,
    sourceRoute: RATIO_PROPORTIONAL_REASONING_SOURCE_ROUTE,
    depthOptions: NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
    items: spec.cases.map((item, index) => makeItem(spec, item, index)),
  }));

export function getRatioProportionalReasoningStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
) {
  const stepAssessmentKey = safe(context.stepAssessmentKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS.find(
      (assessment) =>
        (stepAssessmentKey && assessment.key === stepAssessmentKey) ||
        (pathwayStepId && assessment.pathwayStepId === pathwayStepId) ||
        (stepKey && assessment.stepKey === stepKey),
    ) || null
  );
}

export function getRatioProportionalReasoningStepAssessmentItemsForDepth(
  assessmentKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const assessment =
    RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS.find(
      (candidate) => candidate.key === assessmentKey,
    ) || null;

  if (!assessment) return [];

  return assessment.items.slice(0, getNumberStepAssessmentDepthItemCount(depth));
}
