import type {
  NumberAssessmentBankItem,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentDepthItemCount,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export const OPERATIONS_STRAND_KEY = "operations-and-calculation";
export const OPERATIONS_PARENT_FAMILY_KEY = "operations-and-calculation-foundations";
export const OPERATIONS_PARENT_FAMILY_TITLE = "Operations and calculation";
export const OPERATIONS_ITEM_BANK_KEY = "operations-step-assessment-items-v1";
export const OPERATIONS_SOURCE_ROUTE = "/assessments/number";

type OperationCase = {
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

export type OperationsStepSpec = {
  order: number;
  stepNumber: number;
  stageKey: CleanAssessmentStageKey;
  stageTitle: string;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  cases: OperationCase[];
};

export type OperationsStepAssessment = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof OPERATIONS_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentBankKey: typeof OPERATIONS_PARENT_FAMILY_KEY;
  parentBankTitle: typeof OPERATIONS_PARENT_FAMILY_TITLE;
  parentItemBankKey: typeof OPERATIONS_ITEM_BANK_KEY;
  progressionBandKey: typeof OPERATIONS_PARENT_FAMILY_KEY;
  sourceRoute: typeof OPERATIONS_SOURCE_ROUTE;
  depthOptions: typeof NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS;
  items: NumberAssessmentBankItem[];
};

type StepAssessmentContext = {
  stepKey?: string | null;
  pathwayStepId?: string | null;
  stepAssessmentKey?: string | null;
};

function visual(description: string) {
  return {
    type: "context_card" as const,
    description,
  };
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function itemId(spec: OperationsStepSpec, index: number) {
  return `operations-step-${spec.order}-assess-${String(index + 1).padStart(3, "0")}`;
}

function makeItem(spec: OperationsStepSpec, item: OperationCase, index: number): NumberAssessmentBankItem {
  return {
    id: itemId(spec, index),
    progressionBandKey: OPERATIONS_PARENT_FAMILY_KEY,
    progressionStepKey: spec.stepKey,
    subElementKey: item.cluster,
    subElementTitle: item.clusterTitle,
    subElementDescription: spec.description,
    title: item.title,
    prompt: item.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "early_operations_visual_card",
    options: item.options,
    expectedAnswer: item.answer,
    acceptableAnswers: [item.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: item.answer,
    misconceptionTargets: item.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: spec.stepKey,
      ifCorrectGoToStepKey: spec.stepKey,
      practiceRecommendation: `Practise ${spec.shortTitle} with counters, number lines, and short story cards.`,
      diagnosticNote: `Checks whether the learner can use ${spec.shortTitle.toLowerCase()} for this exact pathway step.`,
    },
    visualSupport: visual(item.visual),
  };
}

function groups(caption: string, counts: number[], labels: string[] = counts.map(String)) {
  return `early-number|caption=${caption}|groups=${counts.join(",")}|labels=${labels.join(",")}`;
}

function numbers(caption: string, values: Array<string | number>) {
  return `early-number|caption=${caption}|numbers=${values.join(",")}`;
}

export const OPERATIONS_STEP_SPECS: OperationsStepSpec[] = [
  {
    order: 1,
    stepNumber: 1,
    stageKey: "foundation-kindergarten",
    stageTitle: "Foundation / Kindergarten",
    stepKey: "act-out-joining-and-taking-away-in-everyday-stories",
    pathwayStepId:
      "mathematics::operations-and-calculation::foundation-kindergarten::act-out-joining-and-taking-away-in-everyday-stories",
    title: "Act out joining and taking away in everyday stories",
    shortTitle: "Joining and taking away",
    description: "Identify and solve small joining and taking-away stories using visible changes.",
    cases: [
      ["Join 2 and 1", "Two counters join one more. How many altogether?", "Move 2 counters, then add 1. How many are there now?", ["2", "3", "4"], "3", groups("Start with 2. Add 1 more.", [2, 1], ["start", "join"]), "joining-stories", "Joining stories", ["joins-but-does-not-count-change"]],
      ["Take 1 from 4", "Four counters. One is taken away. How many are left?", "Cover 1 counter from 4. Count what is left.", ["2", "3", "4"], "3", groups("Start with 4. Take 1 away.", [4, 1], ["start", "take away"]), "taking-away-stories", "Taking away stories", ["counts-removed-instead-of-left"]],
      ["Choose the joining story", "Which number sentence matches 3 counters joined by 2 more?", "Say the story, then choose the matching sentence.", ["3 + 2 = 5", "3 - 2 = 1", "2 - 3 = 1"], "3 + 2 = 5", groups("3 counters join 2 counters.", [3, 2], ["3", "2"]), "match-operation", "Match the operation", ["operation-symbol-confusion"]],
      ["Choose the take-away story", "Which number sentence matches 5 counters with 2 taken away?", "Start at 5, take away 2, then choose the sentence.", ["5 + 2 = 7", "5 - 2 = 3", "2 - 5 = 3"], "5 - 2 = 3", groups("5 counters. 2 are taken away.", [5, 2], ["5", "take 2"]), "match-operation", "Match the operation", ["subtraction-order-confusion"]],
      ["Join to 6", "Four counters join two more. How many altogether?", "Build 4, slide in 2 more, then count the total.", ["5", "6", "7"], "6", groups("Join the two groups.", [4, 2], ["4", "2"]), "joining-stories", "Joining stories", ["counting-all-slip"]],
      ["Left from 6", "Six counters. Three are taken away. How many are left?", "Cross out 3 from 6. Count the counters not crossed out.", ["2", "3", "4"], "3", groups("Take 3 away from 6.", [6, 3], ["6", "take 3"]), "taking-away-stories", "Taking away stories", ["removed-vs-left-confusion"]],
      ["Picture for add", "Which picture matches 2 + 3?", "Look for 2 counters and 3 counters joining.", ["2 and 3 joining", "5 with 3 taken away", "3 and 3 joining"], "2 and 3 joining", groups("Find the joining picture.", [2, 3, 5], ["2 and 3", "5 take 3", "3 and 3"]), "picture-match", "Match pictures", ["picture-operation-mismatch"]],
      ["Picture for subtract", "Which picture matches 7 - 4?", "Look for 7 counters with 4 taken away.", ["7 with 4 taken away", "7 and 4 joining", "4 with 3 taken away"], "7 with 4 taken away", groups("Find the taking-away picture.", [7, 4, 3], ["7 take 4", "7 and 4", "4 take 3"]), "picture-match", "Match pictures", ["addition-subtraction-picture-confusion"]],
      ["Story result 8", "Five counters join three more. How many altogether?", "Add 3 counters to 5 and count the new total.", ["7", "8", "9"], "8", groups("5 counters join 3 more.", [5, 3], ["5", "3"]), "joining-stories", "Joining stories", ["one-to-one-counting-error"]],
      ["Story result 4", "Nine counters. Five are taken away. How many are left?", "Start with 9 and remove 5. Count what remains.", ["3", "4", "5"], "4", groups("9 counters. Take away 5.", [9, 5], ["9", "take 5"]), "taking-away-stories", "Taking away stories", ["counts-change-not-result"]],
      ["Same action", "Which story is about taking away?", "Read each story and find the one where the group gets smaller.", ["3 join 2", "6 lose 2", "4 join 1"], "6 lose 2", groups("Which group gets smaller?", [3, 2, 6], ["join", "lose", "join"]), "operation-language", "Operation language", ["more-less-action-confusion"]],
      ["Same total", "Which joining story makes 7?", "Build each joining story and find the one with 7 altogether.", ["4 + 3", "5 + 3", "6 + 2"], "4 + 3", groups("Which two groups make 7?", [4, 3, 5], ["4", "3", "5"]), "joining-stories", "Joining stories", ["near-total-confusion"]],
    ].map(([title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets]) => ({
      title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets,
    } as OperationCase)),
  },
  {
    order: 2,
    stepNumber: 2,
    stageKey: "foundation-kindergarten",
    stageTitle: "Foundation / Kindergarten",
    stepKey: "share-compare-and-notice-simple-differences",
    pathwayStepId:
      "mathematics::operations-and-calculation::foundation-kindergarten::share-compare-and-notice-simple-differences",
    title: "Share, compare, and notice simple differences",
    shortTitle: "Share and compare",
    description: "Compare small groups, notice simple differences, and recognise fair sharing.",
    cases: [
      ["More group", "Which card has more counters?", "Point to the card with the larger group.", ["Card A", "Card B", "They are the same"], "Card B", groups("Compare the cards.", [3, 5], ["Card A", "Card B"]), "compare-more", "More and fewer", ["spacing-quantity-confusion"]],
      ["Fewer group", "Which card has fewer counters?", "Find the card with the smaller group.", ["Card A", "Card B", "They are the same"], "Card A", groups("Compare the cards.", [2, 4], ["Card A", "Card B"]), "compare-fewer", "More and fewer", ["more-fewer-language-confusion"]],
      ["Same group", "Which answer is true?", "Line up the counters and decide what is true.", ["Card A has more", "Card B has more", "They are the same"], "They are the same", groups("Compare equal groups.", [5, 5], ["Card A", "Card B"]), "same-amount", "Same amount", ["same-means-close-confusion"]],
      ["One more", "Card A has 4. Card B has 5. How many more does Card B have?", "Match counters to see the extra counter.", ["1 more", "2 more", "5 more"], "1 more", groups("Match the counters.", [4, 5], ["Card A", "Card B"]), "simple-difference", "Simple difference", ["difference-vs-total-confusion"]],
      ["Two fewer", "Card A has 6. Card B has 4. How many fewer does Card B have?", "Pair the counters and count the extras.", ["1 fewer", "2 fewer", "4 fewer"], "2 fewer", groups("Compare 6 and 4.", [6, 4], ["Card A", "Card B"]), "simple-difference", "Simple difference", ["comparison-direction-error"]],
      ["Fair share two", "Share 6 counters between 2 children. How many each?", "Deal the counters one at a time to two children.", ["2 each", "3 each", "4 each"], "3 each", groups("Share 6 counters fairly.", [6], ["6 counters"]), "fair-sharing", "Fair sharing", ["unequal-sharing-gap"]],
      ["Fair or unfair", "Two children get 3 counters and 2 counters. Is it fair?", "Compare the two shares.", ["Fair", "Not fair", "Same as 6"], "Not fair", groups("Compare the shares.", [3, 2], ["Child A", "Child B"]), "fair-sharing", "Fair sharing", ["fair-same-confusion"]],
      ["Make fair", "Card A has 5. Card B has 3. What makes them the same?", "Add counters to the smaller group until both match.", ["Add 1 to Card B", "Add 2 to Card B", "Take 2 from Card B"], "Add 2 to Card B", groups("Make the groups equal.", [5, 3], ["Card A", "Card B"]), "balance-groups", "Balance groups", ["add-to-wrong-group"]],
      ["More with ten", "Which card has more?", "Compare the two ten-frame groups.", ["Card A", "Card B", "They are the same"], "Card A", groups("Compare 9 and 7.", [9, 7], ["Card A", "Card B"]), "compare-more", "More and fewer", ["large-small-visual-confusion"]],
      ["Difference three", "Card A has 8. Card B has 5. How many more does Card A have?", "Pair the counters, then count the extras on Card A.", ["2 more", "3 more", "4 more"], "3 more", groups("Compare 8 and 5.", [8, 5], ["Card A", "Card B"]), "simple-difference", "Simple difference", ["difference-counting-error"]],
      ["Share among three", "Share 9 counters between 3 children. How many each?", "Deal 9 counters equally to 3 children.", ["2 each", "3 each", "4 each"], "3 each", groups("Share 9 counters fairly.", [9], ["9 counters"]), "fair-sharing", "Fair sharing", ["equal-groups-count-error"]],
      ["Cannot share evenly", "Can 5 counters be shared equally between 2 children with no leftover?", "Deal 5 counters to two children and watch for leftovers.", ["Yes", "No", "Only if one gets 3"], "No", groups("Try sharing 5 counters.", [5], ["5 counters"]), "fair-or-not", "Fair or not fair", ["leftover-not-noticed"]],
    ].map(([title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets]) => ({
      title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets,
    } as OperationCase)),
  },
  {
    order: 3,
    stepNumber: 1,
    stageKey: "lower-primary",
    stageTitle: "Lower Primary",
    stepKey: "use-counting-strategies-and-known-facts-more-efficiently",
    pathwayStepId:
      "mathematics::operations-and-calculation::lower-primary::use-counting-strategies-and-known-facts-more-efficiently",
    title: "Use counting strategies and known facts more efficiently",
    shortTitle: "Counting strategies and facts",
    description: "Use counting-on, counting-back, doubles, near doubles, and known facts for small calculations.",
    cases: [
      ["Count on 3", "Start at 6 and count on 3. What do you land on?", "Put your finger on 6, make 3 jumps, then choose the number.", ["8", "9", "10"], "9", numbers("Count on from 6.", [6, 7, 8, 9]), "count-on", "Counting on", ["counts-from-one-instead-of-counting-on"]],
      ["Count back 2", "Start at 8 and count back 2. What do you land on?", "Step back two places from 8.", ["5", "6", "7"], "6", numbers("Count back from 8.", [8, 7, 6, 5]), "count-back", "Counting back", ["count-back-direction-error"]],
      ["Double 4", "Which double fact helps with 4 + 4?", "Say the double fact, then choose the total.", ["6", "8", "9"], "8", groups("Double 4.", [4, 4], ["4", "4"]), "doubles", "Doubles", ["double-total-confusion"]],
      ["Near double", "Which fact helps with 5 + 6?", "Think 5 + 5, then one more.", ["5 + 5", "6 - 5", "5 + 2"], "5 + 5", groups("5 and 6 is near double 5.", [5, 6], ["5", "6"]), "near-doubles", "Near doubles", ["near-double-not-used"]],
      ["Count on larger", "Which is the quickest way to solve 9 + 2?", "Start with the larger number and count on.", ["Count 1, 2, 3... all objects", "Start at 9 and count on 2", "Start at 2 and count on 9"], "Start at 9 and count on 2", numbers("Start at 9 and jump 2.", [9, 10, 11]), "strategy-choice", "Strategy choice", ["inefficient-count-all"]],
      ["Back from ten", "10 - 3 = ?", "Count back 3 from 10.", ["6", "7", "8"], "7", numbers("Count back from 10.", [10, 9, 8, 7]), "count-back", "Counting back", ["subtraction-counting-slip"]],
      ["Known fact", "If 6 + 4 = 10, what is 4 + 6?", "Turn the two parts around and keep the same total.", ["8", "10", "12"], "10", groups("The same two parts are turned around.", [6, 4], ["6", "4"]), "known-facts", "Known facts", ["commutativity-gap"]],
      ["Doubles plus one", "7 + 8 is one more than which double?", "Find the double that is close to 7 + 8.", ["7 + 7", "8 + 8", "6 + 6"], "7 + 7", groups("7 and 8 is near double 7.", [7, 8], ["7", "8"]), "near-doubles", "Near doubles", ["chooses-far-fact"]],
      ["Count on answer", "13 + 2 = ?", "Start at 13 and count on 2.", ["14", "15", "16"], "15", numbers("Count on two.", [13, 14, 15]), "count-on", "Counting on", ["teen-counting-slip"]],
      ["Count back answer", "14 - 3 = ?", "Start at 14 and count back 3.", ["10", "11", "12"], "11", numbers("Count back three.", [14, 13, 12, 11]), "count-back", "Counting back", ["teen-count-back-slip"]],
      ["Fact pair", "Which known fact makes 10?", "Choose the pair that makes 10.", ["6 + 4", "6 + 5", "6 + 6"], "6 + 4", groups("Find a ten fact.", [6, 4, 5], ["6", "4", "5"]), "known-facts", "Known facts", ["make-ten-fact-gap"]],
      ["Efficient subtraction", "Which strategy helps with 12 - 2?", "Look for a quick count-back fact.", ["Count back 2 from 12", "Count all counters from 1", "Add 12 and 2"], "Count back 2 from 12", numbers("Step back two.", [12, 11, 10]), "strategy-choice", "Strategy choice", ["operation-strategy-mismatch"]],
    ].map(([title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets]) => ({
      title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets,
    } as OperationCase)),
  },
  {
    order: 4,
    stepNumber: 2,
    stageKey: "lower-primary",
    stageTitle: "Lower Primary",
    stepKey: "use-part-whole-thinking-for-addition-and-subtraction",
    pathwayStepId:
      "mathematics::operations-and-calculation::lower-primary::use-part-whole-thinking-for-addition-and-subtraction",
    title: "Use part-whole thinking for addition and subtraction",
    shortTitle: "Part-whole addition and subtraction",
    description: "Break numbers into parts and recombine them to solve addition and subtraction.",
    cases: [
      ["Parts make 7", "Which parts make 7?", "Use a part-whole mat to make 7.", ["3 and 4", "3 and 5", "7 and 1"], "3 and 4", groups("Make 7 from two parts.", [3, 4], ["part", "part"]), "make-whole", "Make the whole", ["part-total-confusion"]],
      ["Missing part", "5 and __ make 9. What is missing?", "Start with 5, add counters until you have 9.", ["3", "4", "5"], "4", groups("Find the missing part.", [5, 4], ["5", "missing"]), "missing-part", "Missing part", ["counts-total-as-missing-part"]],
      ["Break 10", "Which shows 10 broken into two parts?", "Choose the parts that recombine to 10.", ["6 and 4", "6 and 5", "10 and 2"], "6 and 4", groups("Break 10 into parts.", [6, 4], ["6", "4"]), "break-apart", "Break apart", ["whole-included-as-part"]],
      ["Use make ten", "8 + 5 can be solved by making 10. Which split helps?", "Split 5 into 2 and 3 so 8 can become 10.", ["2 and 3", "4 and 1", "5 and 5"], "2 and 3", groups("8 needs 2 to make 10.", [8, 2, 3], ["8", "2", "3"]), "make-ten", "Make ten", ["make-ten-split-error"]],
      ["Related subtraction", "If 6 + 3 = 9, which subtraction fact matches?", "Use the same whole and parts.", ["9 - 3 = 6", "6 - 3 = 9", "9 + 3 = 6"], "9 - 3 = 6", groups("Whole 9 with parts 6 and 3.", [6, 3], ["6", "3"]), "fact-family", "Fact family", ["inverse-operation-gap"]],
      ["Part-whole picture", "The whole is 12. One part is 7. What is the other part?", "Count from 7 up to 12 to find the missing part.", ["4", "5", "6"], "5", groups("Whole 12, one part 7.", [7, 5], ["7", "missing"]), "missing-part", "Missing part", ["missing-part-counting-error"]],
      ["Recombine parts", "20 + 5 + 3 = ?", "Combine the easy parts first.", ["25", "28", "30"], "28", groups("Combine 20, 5, and 3.", [5, 3], ["5", "3"]), "recombine", "Recombine parts", ["ignores-one-part"]],
      ["Partition 14", "Which partition of 14 helps solve 14 + 6?", "Break 14 into 10 and 4, then add 6.", ["10 and 4", "8 and 4", "14 and 6"], "10 and 4", groups("Use 10 and 4.", [10, 4, 6], ["10", "4", "6"]), "partition", "Partition numbers", ["unhelpful-partition-choice"]],
      ["Bridge through 10", "9 + 4 = ?", "Move 1 from 4 to make 10, then add the rest.", ["12", "13", "14"], "13", groups("9 needs 1, then 3 left.", [9, 1, 3], ["9", "1", "3"]), "make-ten", "Make ten", ["bridge-through-ten-error"]],
      ["Subtract in parts", "15 - 7 can be thought of as 15 - 5 - 2. What is the answer?", "Take away 5, then take away 2 more.", ["7", "8", "9"], "8", numbers("Step back in parts.", [15, 10, 8]), "subtract-parts", "Subtract in parts", ["subtracts-only-first-part"]],
      ["Choose true equation", "Which equation is true?", "Check the parts against the whole.", ["7 + 5 = 12", "7 + 5 = 13", "12 - 7 = 6"], "7 + 5 = 12", groups("Parts 7 and 5 make 12.", [7, 5], ["7", "5"]), "fact-family", "Fact family", ["equation-balance-gap"]],
      ["Find helpful split", "Which split of 16 helps with 16 - 9?", "Split 16 into 10 and 6 so you can compare with 9.", ["10 and 6", "8 and 8", "16 and 9"], "10 and 6", groups("Split 16 into tens and ones.", [10, 6], ["10", "6"]), "partition", "Partition numbers", ["place-value-partition-gap"]],
    ].map(([title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets]) => ({
      title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets,
    } as OperationCase)),
  },
];

const LATER_STEP_SPECS: OperationsStepSpec[] = [
  {
    order: 5,
    stepNumber: 1,
    stageKey: "middle-primary",
    stageTitle: "Middle Primary",
    stepKey: "model-equal-groups-and-repeated-addition",
    pathwayStepId:
      "mathematics::operations-and-calculation::middle-primary::model-equal-groups-and-repeated-addition",
    title: "Model equal groups and repeated addition",
    shortTitle: "Equal groups and repeated addition",
    description: "Represent equal groups, arrays, skip counting, and repeated addition.",
    cases: [
      ["3 groups of 4", "Which repeated addition matches 3 groups of 4?", "Write one addend for each equal group.", ["4 + 4 + 4", "3 + 4", "3 + 3 + 3 + 3"], "4 + 4 + 4", groups("3 equal groups of 4.", [4, 4, 4], ["group", "group", "group"]), "equal-groups", "Equal groups", ["groups-vs-size-confusion"]],
      ["Array total", "A 2 by 5 array has how many counters?", "Count rows of 5 or columns of 2.", ["7", "10", "12"], "10", groups("2 rows of 5.", [5, 5], ["row", "row"]), "arrays", "Arrays", ["array-row-column-gap"]],
      ["Skip count", "Count by 3s: 3, 6, 9, __.", "Use equal jumps of 3.", ["10", "11", "12"], "12", numbers("Skip count by 3.", [3, 6, 9, 12]), "skip-count", "Skip counting", ["skip-count-sequence-slip"]],
      ["Multiplication match", "Which multiplication matches 5 + 5 + 5 + 5?", "Count the number of equal groups and the size of each group.", ["4 x 5", "5 x 5", "4 + 5"], "4 x 5", groups("Four equal groups of 5.", [5, 5, 5, 5], ["1", "2", "3", "4"]), "repeated-addition", "Repeated addition", ["multiplication-factor-order-gap"]],
      ["Equal or not", "Which set shows equal groups?", "Look for every group having the same number.", ["2, 2, 2", "2, 3, 2", "1, 2, 3"], "2, 2, 2", groups("Only one set is equal.", [2, 2, 2], ["A", "A", "A"]), "equal-groups", "Equal groups", ["unequal-groups-accepted"]],
      ["4 groups of 3", "What is the total for 4 groups of 3?", "Add 3 four times.", ["7", "12", "13"], "12", groups("4 groups of 3.", [3, 3, 3, 3], ["group", "group", "group", "group"]), "equal-groups", "Equal groups", ["repeated-addition-total-error"]],
      ["Array sentence", "Which sentence matches 3 rows of 4?", "Use rows and counters in each row.", ["3 x 4 = 12", "3 + 4 = 7", "4 - 3 = 1"], "3 x 4 = 12", groups("3 rows of 4.", [4, 4, 4], ["row", "row", "row"]), "arrays", "Arrays", ["operation-symbol-confusion"]],
      ["Repeated addition total", "6 + 6 + 6 = ?", "Add the same amount three times.", ["12", "18", "21"], "18", groups("Three groups of 6.", [6, 6, 6], ["6", "6", "6"]), "repeated-addition", "Repeated addition", ["skip-counting-error"]],
      ["Find group size", "There are 4 equal groups and 20 counters altogether. How many in each group?", "Share 20 into 4 equal groups.", ["4", "5", "6"], "5", groups("20 shared into 4 equal groups.", [5, 5, 5, 5], ["group", "group", "group", "group"]), "unknown-group-size", "Unknown group size", ["total-vs-group-size-confusion"]],
      ["Choose array", "Which picture matches 2 x 6?", "Look for 2 rows with 6 in each row.", ["2 rows of 6", "6 rows of 6", "2 rows of 2"], "2 rows of 6", groups("2 rows of 6.", [6, 6], ["row", "row"]), "arrays", "Arrays", ["factor-picture-mismatch"]],
      ["Skip count by 5", "Count by 5s: 5, 10, 15, __.", "Make one more equal jump of 5.", ["18", "20", "25"], "20", numbers("Skip count by 5.", [5, 10, 15, 20]), "skip-count", "Skip counting", ["skip-count-by-one"]],
      ["Repeated addition choice", "Which repeated addition matches 6 x 2?", "Use 6 groups of 2.", ["2 + 2 + 2 + 2 + 2 + 2", "6 + 2", "6 + 6"], "2 + 2 + 2 + 2 + 2 + 2", groups("6 groups of 2.", [2, 2, 2, 2, 2, 2], ["1", "2", "3", "4", "5", "6"]), "repeated-addition", "Repeated addition", ["factor-role-confusion"]],
    ].map(([title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets]) => ({
      title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets,
    } as OperationCase)),
  },
  {
    order: 6,
    stepNumber: 2,
    stageKey: "middle-primary",
    stageTitle: "Middle Primary",
    stepKey: "connect-multiplication-and-division-through-grouping-and-sharing",
    pathwayStepId:
      "mathematics::operations-and-calculation::middle-primary::connect-multiplication-and-division-through-grouping-and-sharing",
    title: "Connect multiplication and division through grouping and sharing",
    shortTitle: "Multiplication and division links",
    description: "Connect multiplication and division facts through grouping, sharing, and inverse thinking.",
    cases: [
      ["Share 12 by 3", "12 counters shared into 3 equal groups gives how many in each group?", "Deal 12 counters into 3 equal groups.", ["3", "4", "6"], "4", groups("12 shared into 3 groups.", [4, 4, 4], ["group", "group", "group"]), "sharing-division", "Sharing division", ["share-group-count-confusion"]],
      ["Group 15 by 5", "15 counters grouped in 5s makes how many groups?", "Make groups of 5 until all 15 counters are used.", ["2", "3", "5"], "3", groups("15 grouped in 5s.", [5, 5, 5], ["group", "group", "group"]), "grouping-division", "Grouping division", ["group-size-vs-group-count"]],
      ["Inverse fact", "If 4 x 6 = 24, which division fact matches?", "Use the same three numbers in a division fact.", ["24 ÷ 6 = 4", "24 ÷ 4 = 6", "Both are true"], "Both are true", groups("24 as 4 groups of 6.", [6, 6, 6, 6], ["1", "2", "3", "4"]), "inverse-facts", "Inverse facts", ["inverse-fact-gap"]],
      ["Unknown total", "There are 5 groups of 3. What is the total?", "Use multiplication to find the whole.", ["8", "15", "18"], "15", groups("5 groups of 3.", [3, 3, 3, 3, 3], ["1", "2", "3", "4", "5"]), "unknown-total", "Unknown total", ["adds-factors-only"]],
      ["Unknown groups", "20 ÷ 4 asks which question?", "Read the division as grouping or sharing.", ["How many groups of 4 are in 20?", "What is 20 + 4?", "What is 20 x 4?"], "How many groups of 4 are in 20?", groups("20 grouped in 4s.", [4, 4, 4, 4, 4], ["group", "group", "group", "group", "group"]), "division-meaning", "Division meaning", ["division-as-only-sharing"]],
      ["Fact family", "Which fact belongs with 3 x 7 = 21?", "Use 21 as the whole and 3 and 7 as factors.", ["21 ÷ 7 = 3", "21 + 7 = 28", "7 - 3 = 4"], "21 ÷ 7 = 3", groups("21 as 3 groups of 7.", [7, 7, 7], ["group", "group", "group"]), "fact-family", "Fact family", ["unrelated-fact-choice"]],
      ["Equal sharing", "18 counters shared between 6 children gives how many each?", "Deal 18 counters to 6 children equally.", ["2", "3", "4"], "3", groups("6 equal shares of 3.", [3, 3, 3, 3, 3, 3], ["1", "2", "3", "4", "5", "6"]), "sharing-division", "Sharing division", ["sharing-count-error"]],
      ["Groups of 2", "How many groups of 2 are in 14?", "Circle pairs until 14 is used.", ["6", "7", "8"], "7", groups("14 grouped in twos.", [2, 2, 2, 2, 2, 2, 2], ["1", "2", "3", "4", "5", "6", "7"]), "grouping-division", "Grouping division", ["pair-counting-error"]],
      ["Check division", "Which multiplication checks 16 ÷ 4 = 4?", "Multiply the answer by the divisor.", ["4 x 4 = 16", "16 x 4 = 64", "16 - 4 = 12"], "4 x 4 = 16", groups("4 groups of 4 make 16.", [4, 4, 4, 4], ["4", "4", "4", "4"]), "inverse-facts", "Inverse facts", ["check-with-wrong-operation"]],
      ["Unknown factor", "__ x 5 = 30. What is missing?", "Ask how many groups of 5 make 30.", ["5", "6", "7"], "6", groups("30 as groups of 5.", [5, 5, 5, 5, 5, 5], ["1", "2", "3", "4", "5", "6"]), "unknown-factor", "Unknown factor", ["unknown-factor-gap"]],
      ["Division sentence", "Which sentence matches 24 shared into 4 equal groups?", "Choose the division sentence for sharing.", ["24 ÷ 4 = 6", "24 x 4 = 96", "24 - 4 = 20"], "24 ÷ 4 = 6", groups("4 equal shares of 6.", [6, 6, 6, 6], ["share", "share", "share", "share"]), "division-meaning", "Division meaning", ["operation-symbol-confusion"]],
      ["Related facts", "Which set is a fact family for 5, 8, and 40?", "Use multiplication and division with the same three numbers.", ["5 x 8 = 40 and 40 ÷ 8 = 5", "5 + 8 = 13 and 40 - 8 = 32", "40 x 5 = 8 and 8 ÷ 5 = 40"], "5 x 8 = 40 and 40 ÷ 8 = 5", groups("5 groups of 8 make 40.", [8, 8, 8, 8, 8], ["1", "2", "3", "4", "5"]), "fact-family", "Fact family", ["fact-family-operation-mix"]],
    ].map(([title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets]) => ({
      title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets,
    } as OperationCase)),
  },
];

const UPPER_STEP_TITLES = [
  ["Use written methods and mental strategies flexibly", "use-written-methods-and-mental-strategies-flexibly", "upper-primary", "Upper Primary", "Written and mental strategies"],
  ["Estimate and solve multi-step practical problems", "estimate-and-solve-multi-step-practical-problems", "upper-primary", "Upper Primary", "Multi-step practical problems"],
  ["Choose efficient strategies across different number forms", "choose-efficient-strategies-across-different-number-forms", "lower-secondary", "Lower Secondary", "Efficient strategies"],
  ["Apply calculation to richer practical reasoning", "apply-calculation-to-richer-practical-reasoning", "lower-secondary", "Lower Secondary", "Practical reasoning"],
  ["Use operations confidently in algebraic and financial contexts", "use-operations-confidently-in-algebraic-and-financial-contexts", "years-9-10-consolidation", "Years 9-10 / consolidation", "Algebraic and financial contexts"],
  ["Refine judgement, checking, and mathematical communication", "refine-judgement-checking-and-mathematical-communication", "years-9-10-consolidation", "Years 9-10 / consolidation", "Judgement and communication"],
] as const;

const UPPER_CASES: OperationCase[][] = [
  [
    ["Choose method", "Which method is sensible for 48 + 19?", "Look for a near-tens adjustment.", ["48 + 20 - 1", "48 - 20", "19 - 48"], "48 + 20 - 1", numbers("Use compensation.", [48, 68, 67]), "strategy-choice", "Strategy choice", ["compensation-gap"]],
    ["Regroup add", "36 + 27 = ?", "Add tens and ones, regrouping ten ones as one ten.", ["53", "63", "73"], "63", groups("36 and 27 as tens and ones.", [6, 7], ["ones", "ones"]), "written-addition", "Written addition", ["regrouping-error"]],
    ["Subtract method", "Which method helps with 72 - 38?", "Take away 40, then add 2 back.", ["72 - 40 + 2", "72 + 40 - 2", "38 - 72"], "72 - 40 + 2", numbers("Use compensation for subtraction.", [72, 32, 34]), "written-subtraction", "Written subtraction", ["subtraction-compensation-error"]],
    ["Mental double", "25 + 25 + 8 = ?", "Use double 25, then add 8.", ["50", "58", "68"], "58", groups("Double 25, add 8.", [5, 5, 8], ["25", "25", "8"]), "mental-strategy", "Mental strategy", ["ignores-extra-addend"]],
    ["Column check", "Which answer is closest to 198 + 305?", "Estimate 200 + 300 first.", ["403", "503", "603"], "503", numbers("Estimate, then calculate.", [200, 300, 500]), "estimation-check", "Estimation check", ["estimate-not-used"]],
    ["Missing addend", "47 + __ = 80. What is missing?", "Count up from 47 to 80 in parts.", ["23", "33", "43"], "33", numbers("Count up to 80.", [47, 50, 80]), "missing-number", "Missing number", ["count-up-gap"]],
    ["Regroup subtract", "94 - 56 = ?", "Subtract by taking 50, then 6.", ["38", "42", "48"], "38", numbers("Subtract in parts.", [94, 44, 38]), "written-subtraction", "Written subtraction", ["subtracts-digits-independently"]],
    ["Choose efficient", "Which is quickest for 99 + 36?", "Make 99 into 100, then adjust.", ["100 + 35", "99 - 36", "90 + 30 only"], "100 + 35", numbers("Adjust 99 to 100.", [99, 100, 135]), "strategy-choice", "Strategy choice", ["adjustment-direction-error"]],
    ["Two digit add", "68 + 24 = ?", "Add 20, then 4.", ["82", "92", "94"], "92", numbers("Add in parts.", [68, 88, 92]), "written-addition", "Written addition", ["place-value-addition-error"]],
    ["Two digit subtract", "81 - 29 = ?", "Subtract 30, then add 1 back.", ["51", "52", "62"], "52", numbers("Subtract 30, adjust 1.", [81, 51, 52]), "written-subtraction", "Written subtraction", ["compensation-direction-error"]],
    ["Compare methods", "Which method keeps place value clear for 146 + 32?", "Choose the method that separates tens and ones.", ["146 + 30 + 2", "146 + 3 + 2", "146 - 32"], "146 + 30 + 2", numbers("Add tens, then ones.", [146, 176, 178]), "place-value-control", "Place-value control", ["tens-ones-confusion"]],
    ["Check reasonableness", "A learner gets 47 + 52 = 79. What should they notice?", "Estimate 50 + 50 first.", ["79 is too small", "79 is too large", "79 is exact"], "79 is too small", numbers("Estimate near 100.", [47, 52, 100]), "estimation-check", "Estimation check", ["unreasonable-answer-accepted"]],
  ],
  [
    ["Shopping total", "A book costs 12 dollars and a pen costs 4 dollars. You buy 2 books and 1 pen. What is the total?", "Find two books first, then add the pen.", ["16 dollars", "24 dollars", "28 dollars"], "28 dollars", groups("Two books and one pen.", [12, 12, 4], ["book", "book", "pen"]), "multi-step", "Multi-step problems", ["misses-one-step"]],
    ["Estimate first", "Which estimate is sensible for 39 + 62?", "Round to friendly tens.", ["40 + 60 = 100", "30 + 60 = 90", "40 + 70 = 110"], "40 + 60 = 100", numbers("Estimate with tens.", [39, 40, 62, 60]), "estimation", "Estimation", ["rounding-choice-gap"]],
    ["Leftover", "You have 30 counters. You use 8, then 7 more. How many are left?", "Subtract the total used from 30.", ["14", "15", "16"], "15", numbers("Subtract in two steps.", [30, 22, 15]), "multi-step", "Multi-step problems", ["does-only-first-operation"]],
    ["Choose operations", "Which operations solve: 3 packs with 6 cards each, then 4 cards lost?", "Find the total, then subtract the lost cards.", ["multiply then subtract", "add then divide", "subtract then multiply"], "multiply then subtract", groups("3 packs of 6, then 4 lost.", [6, 6, 6, 4], ["pack", "pack", "pack", "lost"]), "operation-choice", "Operation choice", ["wrong-operation-order"]],
    ["Distance", "A walk is 18 km. You walk 7 km in the morning and 6 km later. How many km remain?", "Add the distance walked, then subtract from 18.", ["4 km", "5 km", "6 km"], "5 km", numbers("18 minus 7, then 6.", [18, 11, 5]), "multi-step", "Multi-step problems", ["context-total-gap"]],
    ["Reasonable product", "Which is the best estimate for 19 x 4?", "Round 19 to 20.", ["40", "80", "120"], "80", groups("About 20 groups of 4.", [4, 4, 4, 4], ["sample", "sample", "sample", "sample"]), "estimation", "Estimation", ["multiplication-estimate-gap"]],
    ["Two operations", "A game score starts at 45, gains 20, then loses 8. What is the score?", "Add first, then subtract.", ["57", "63", "73"], "57", numbers("45 plus 20, minus 8.", [45, 65, 57]), "multi-step", "Multi-step problems", ["operation-sequence-error"]],
    ["Interpret answer", "24 snacks are shared equally by 5 children. Which answer makes sense?", "Think about leftovers in the situation.", ["4 each with 4 left over", "5 each with none left", "6 each with 4 left over"], "4 each with 4 left over", groups("Share 24 among 5.", [4, 4, 4, 4, 4, 4], ["groups", "left", "left", "left", "left", "left"]), "interpret-context", "Interpret answers", ["remainder-context-gap"]],
    ["Check total", "You estimate 48 + 51 as about 100. Which exact answer is reasonable?", "Compare the exact answer with the estimate.", ["79", "99", "129"], "99", numbers("Estimate near 100.", [48, 51, 99]), "reasonableness", "Reasonableness", ["estimate-not-compared"]],
    ["Project materials", "Each shelf needs 4 brackets. How many brackets for 6 shelves?", "Use equal groups.", ["10", "20", "24"], "24", groups("6 shelves, 4 brackets each.", [4, 4, 4, 4, 4, 4], ["1", "2", "3", "4", "5", "6"]), "operation-choice", "Operation choice", ["add-factors-only"]],
    ["Budget", "You have 50 dollars. You spend 18 dollars and 13 dollars. How much is left?", "Add spending, then subtract from the budget.", ["19 dollars", "21 dollars", "31 dollars"], "19 dollars", numbers("50 minus total spending.", [50, 32, 19]), "multi-step", "Multi-step problems", ["budget-total-gap"]],
    ["Which plan", "Which plan solves 7 bags with 5 apples each, plus 6 loose apples?", "Find apples in bags, then add loose apples.", ["7 x 5 + 6", "7 + 5 x 6", "7 x 6 - 5"], "7 x 5 + 6", groups("Bags plus loose apples.", [5, 5, 5, 5, 5, 5, 5, 6], ["bags", "bags", "bags", "bags", "bags", "bags", "bags", "loose"]), "operation-choice", "Operation choice", ["multi-step-expression-gap"]],
  ],
  [
    ["Decimal add", "Which strategy helps with 3.8 + 2.5?", "Make 3.8 into 4.0, then adjust.", ["4.0 + 2.3", "3.0 + 2.0", "3.8 - 2.5"], "4.0 + 2.3", numbers("Use compensation with decimals.", ["3.8", "4.0", "6.3"]), "decimal-strategy", "Decimal strategies", ["decimal-compensation-gap"]],
    ["Integer change", "The temperature is -3 and rises 8 degrees. What is the new temperature?", "Move 8 steps up from -3.", ["3", "5", "8"], "5", numbers("Move on the number line.", [-3, 0, 5]), "integer-operations", "Integer operations", ["integer-direction-error"]],
    ["Fraction pair", "Which fact helps with 1/2 + 1/4?", "Rename halves as quarters.", ["2/4 + 1/4", "1/2 - 1/4", "1/4 + 1/4 + 1/4 + 1/4"], "2/4 + 1/4", numbers("Use equivalent parts.", ["1/2", "2/4", "3/4"]), "fraction-strategy", "Fraction strategies", ["fraction-denominator-gap"]],
    ["Percent discount", "10% of 80 dollars is?", "Find one tenth of 80.", ["8 dollars", "10 dollars", "18 dollars"], "8 dollars", groups("10 equal parts of 80.", [8, 8, 8, 8, 8, 8, 8, 8, 8, 8], ["10% parts", "", "", "", "", "", "", "", "", ""]), "percent-strategy", "Percent strategies", ["percent-of-whole-gap"]],
    ["Choose form", "Which form makes 0.25 x 12 easier?", "Use a fraction meaning for 0.25.", ["1/4 of 12", "25 x 12", "12 - 0.25"], "1/4 of 12", numbers("0.25 is one quarter.", ["0.25", "1/4", "12"]), "number-form", "Number forms", ["decimal-fraction-link-gap"]],
    ["Negative subtraction", "5 - 8 = ?", "Start at 5 and move 8 steps down.", ["-3", "3", "13"], "-3", numbers("Move down from 5.", [5, 0, -3]), "integer-operations", "Integer operations", ["subtract-to-negative-gap"]],
    ["Efficient multiply", "Which is efficient for 25 x 16?", "Use 25 x 4 = 100.", ["25 x 4 x 4", "25 + 16", "16 - 25"], "25 x 4 x 4", groups("Break 16 into 4 x 4.", [4, 4, 4, 4], ["4", "4", "4", "4"]), "strategy-choice", "Strategy choice", ["factorisation-strategy-gap"]],
    ["Decimal compare", "Which estimate is sensible for 9.7 x 3?", "Round 9.7 to 10.", ["About 30", "About 13", "About 90"], "About 30", numbers("Estimate 10 x 3.", ["9.7", "10", "30"]), "estimation", "Estimation", ["decimal-estimate-error"]],
    ["Fraction subtraction", "3/4 - 1/4 = ?", "Subtract like quarters.", ["1/4", "2/4", "4/4"], "2/4", numbers("Use quarter parts.", ["3/4", "2/4"]), "fraction-strategy", "Fraction strategies", ["subtracts-denominators"]],
    ["Percent link", "50% of 36 is?", "Use half of 36.", ["16", "18", "20"], "18", groups("Split 36 into two equal parts.", [18, 18], ["half", "half"]), "percent-strategy", "Percent strategies", ["percent-benchmark-gap"]],
    ["Mixed forms", "Which strategy helps with 2.5 + 1/2?", "Change 1/2 to 0.5.", ["2.5 + 0.5", "2.5 + 5", "2.5 - 0.5"], "2.5 + 0.5", numbers("Connect half and decimal.", ["1/2", "0.5", "3.0"]), "number-form", "Number forms", ["mixed-form-conversion-gap"]],
    ["Check answer", "A learner says 4.9 + 5.2 = 91. What should they notice?", "Estimate 5 + 5 first.", ["91 is too large", "91 is exact", "91 is too small"], "91 is too large", numbers("Estimate near 10.", ["4.9", "5.2", "10"]), "reasonableness", "Reasonableness", ["place-value-decimal-error"]],
  ],
  [
    ["Unit price", "3 notebooks cost 12 dollars. What is the cost for 1 notebook?", "Divide the total cost by the number of notebooks.", ["3 dollars", "4 dollars", "9 dollars"], "4 dollars", groups("12 dollars across 3 notebooks.", [4, 4, 4], ["book", "book", "book"]), "rates", "Rates and unit price", ["unit-rate-gap"]],
    ["Recipe scale", "A recipe uses 2 cups for 4 people. How many cups for 8 people?", "Double the people, so double the cups.", ["3 cups", "4 cups", "8 cups"], "4 cups", groups("Scale the recipe.", [2, 2], ["4 people", "4 more"]), "scaling", "Scaling", ["scale-factor-gap"]],
    ["Travel total", "A trip has 35 km, then 28 km, then 17 km. What total distance?", "Add the three distances.", ["70 km", "80 km", "90 km"], "80 km", numbers("Add distances in parts.", [35, 63, 80]), "multi-step-context", "Multi-step context", ["misses-one-addend"]],
    ["Best operation", "A 60 dollar bill is split equally between 4 people. Which operation?", "Sharing equally uses division.", ["60 ÷ 4", "60 x 4", "60 + 4"], "60 ÷ 4", groups("Split 60 into 4 equal shares.", [15, 15, 15, 15], ["share", "share", "share", "share"]), "operation-choice", "Operation choice", ["context-operation-gap"]],
    ["Discount", "A 40 dollar item has 25% off. How much is the discount?", "25% is one quarter.", ["10 dollars", "15 dollars", "25 dollars"], "10 dollars", groups("One quarter of 40.", [10, 10, 10, 10], ["25%", "", "", ""]), "finance-context", "Finance context", ["percent-discount-gap"]],
    ["Area context", "A rectangle is 6 m by 7 m. What is its area?", "Multiply length by width.", ["13 m2", "36 m2", "42 m2"], "42 m2", groups("6 rows of 7 square metres.", [7, 7, 7, 7, 7, 7], ["row", "row", "row", "row", "row", "row"]), "measurement-context", "Measurement context", ["area-perimeter-confusion"]],
    ["Compare plans", "Plan A costs 18 dollars. Plan B costs 6 dollars per month for 4 months. Which costs less?", "Find Plan B total, then compare.", ["Plan A", "Plan B", "They are the same"], "Plan A", groups("Plan B is 4 groups of 6.", [6, 6, 6, 6], ["month", "month", "month", "month"]), "finance-context", "Finance context", ["comparison-after-calculation-gap"]],
    ["Rate", "A cyclist travels 45 km in 3 hours. How far per hour?", "Divide distance by hours.", ["12 km", "15 km", "18 km"], "15 km", groups("45 km split across 3 hours.", [15, 15, 15], ["hour", "hour", "hour"]), "rates", "Rates and unit price", ["rate-unit-gap"]],
    ["Reasonable context", "Which answer is reasonable for 198 + 203 + 99?", "Estimate 200 + 200 + 100.", ["300", "500", "700"], "500", numbers("Estimate the total.", [200, 200, 100, 500]), "reasonableness", "Reasonableness", ["estimate-context-gap"]],
    ["Scale down", "A map scale says 1 cm represents 5 km. What does 4 cm represent?", "Use 4 groups of 5 km.", ["9 km", "20 km", "45 km"], "20 km", groups("4 scale units of 5 km.", [5, 5, 5, 5], ["1 cm", "1 cm", "1 cm", "1 cm"]), "scaling", "Scaling", ["scale-unit-confusion"]],
    ["Interpret remainder", "50 seats are arranged in rows of 8. How many full rows?", "Count full groups of 8 and note leftovers.", ["6 full rows", "7 full rows", "8 full rows"], "6 full rows", groups("6 full rows of 8 use 48 seats.", [8, 8, 8, 8, 8, 8, 2], ["row", "row", "row", "row", "row", "row", "left"]), "interpret-context", "Interpret context", ["rounds-remainder-wrongly"]],
    ["Choose expression", "A taxi costs 5 dollars plus 3 dollars per km. Which expression for 7 km?", "Use fixed cost plus distance cost.", ["5 + 3 x 7", "5 x 3 + 7", "5 + 3 + 7"], "5 + 3 x 7", groups("Fixed cost plus 7 km charges.", [5, 3, 3, 3, 3, 3, 3, 3], ["fixed", "km", "km", "km", "km", "km", "km", "km"]), "operation-choice", "Operation choice", ["expression-context-gap"]],
  ],
  [
    ["Substitute formula", "A cost is 12 + 4n. What is the cost when n = 5?", "Replace n with 5, then multiply before adding.", ["32", "60", "80"], "32", numbers("Use 12 + 4 x 5.", [12, 20, 32]), "algebra-substitution", "Algebra substitution", ["order-of-operations-error"]],
    ["Unit price compare", "Which is cheaper per item: 3 for 12 dollars or 5 for 18 dollars?", "Find each unit price before comparing.", ["3 for 12 dollars", "5 for 18 dollars", "They are the same"], "5 for 18 dollars", groups("Compare unit prices.", [4, 4, 4, 3, 3, 3, 3, 3], ["3-pack", "", "", "5-pack", "", "", "", ""]), "financial-comparison", "Financial comparison", ["compares-total-not-unit-price"]],
    ["Simple interest", "Simple interest is P x r x t. Which expression finds interest for 200 dollars at 5% for 2 years?", "Change 5% to 0.05, then multiply.", ["200 x 0.05 x 2", "200 + 0.05 + 2", "200 x 5 x 2"], "200 x 0.05 x 2", numbers("Use P x r x t.", [200, "0.05", 2]), "finance-formulas", "Finance formulas", ["percent-decimal-gap"]],
    ["Rate equation", "A car travels at 60 km/h for 3 hours. Which calculation finds distance?", "Use distance = speed x time.", ["60 x 3", "60 ÷ 3", "60 + 3"], "60 x 3", groups("3 equal hours of 60 km.", [60, 60, 60], ["hour", "hour", "hour"]), "formula-choice", "Formula choice", ["rate-operation-gap"]],
    ["Spreadsheet total", "A spreadsheet cell uses =B2*C2. If B2 is 7 and C2 is 9, what is the result?", "Multiply the two cell values.", ["16", "63", "79"], "63", groups("7 groups of 9.", [9, 9, 9, 9, 9, 9, 9], ["B2", "", "", "", "", "", ""]), "spreadsheet-calculation", "Spreadsheet calculation", ["cell-operation-confusion"]],
    ["Discount price", "A 90 dollar jacket has 20% off. What is the sale price?", "Find 20% of 90, then subtract from 90.", ["18 dollars", "72 dollars", "110 dollars"], "72 dollars", groups("20% discount from 90.", [18, 72], ["discount", "sale price"]), "financial-context", "Financial context", ["discount-vs-sale-price-confusion"]],
    ["Formula inverse", "If A = l x w and A = 48 with l = 6, what is w?", "Divide the area by the known length.", ["6", "8", "12"], "8", groups("48 split into 6 equal rows.", [8, 8, 8, 8, 8, 8], ["row", "row", "row", "row", "row", "row"]), "formula-inverse", "Formula inverse", ["inverse-operation-gap"]],
    ["Profit", "A product costs 35 dollars to make and sells for 50 dollars. What is the profit?", "Subtract cost from selling price.", ["15 dollars", "35 dollars", "85 dollars"], "15 dollars", numbers("Selling price minus cost.", [50, 35, 15]), "financial-context", "Financial context", ["adds-cost-and-price"]],
    ["Algebra expression", "Which expression represents 8 more than 3 groups of x?", "Build the groups first, then add 8.", ["3x + 8", "8x + 3", "3 + x + 8"], "3x + 8", groups("Three groups plus 8.", [3, 8], ["3 groups of x", "8 more"]), "algebra-expression", "Algebra expression", ["coefficient-constant-confusion"]],
    ["Currency conversion", "1 token is worth 4 points. How many points are 15 tokens worth?", "Multiply tokens by points per token.", ["19", "45", "60"], "60", groups("15 tokens at 4 points each.", [4, 4, 4, 4, 4], ["sample", "sample", "sample", "sample", "sample"]), "rate-context", "Rate context", ["rate-multiplication-gap"]],
    ["Break-even", "A stall pays 30 dollars in costs and earns 6 dollars per sale. How many sales to cover costs?", "Find how many groups of 6 make 30.", ["5 sales", "6 sales", "36 sales"], "5 sales", groups("30 split into groups of 6.", [6, 6, 6, 6, 6], ["sale", "sale", "sale", "sale", "sale"]), "financial-comparison", "Financial comparison", ["break-even-operation-gap"]],
    ["Check context", "A formula gives 4.5 people. What should you do in a ticket-booking context?", "Think about whether a fractional person makes sense.", ["Book 4 tickets", "Book 5 tickets", "Book 4.5 tickets"], "Book 5 tickets", groups("Tickets must be whole.", [4, 1], ["4 people", "extra person"]), "context-interpretation", "Context interpretation", ["rounding-context-gap"]],
  ],
  [
    ["Estimate check", "Before calculating 49 x 21, which estimate is sensible?", "Round to 50 x 20.", ["About 100", "About 1000", "About 10000"], "About 1000", numbers("Estimate 50 x 20.", [50, 20, 1000]), "estimation", "Estimation", ["estimate-scale-error"]],
    ["Spot impossible", "A learner says 198 + 203 = 301. What should they notice?", "Estimate 200 + 200.", ["301 is too small", "301 is too large", "301 is exact"], "301 is too small", numbers("Estimate near 400.", [198, 203, 400]), "reasonableness", "Reasonableness", ["unreasonable-sum-accepted"]],
    ["Explain method", "Which explanation best matches 24 x 15 = 24 x 10 + 24 x 5?", "Look for splitting 15 into helpful parts.", ["Split 15 into 10 and 5", "Split 24 into 10 and 5", "Add 24 and 15 first"], "Split 15 into 10 and 5", groups("Break 15 into 10 and 5.", [10, 5], ["10 groups", "5 groups"]), "method-communication", "Method communication", ["partition-explanation-gap"]],
    ["Check subtraction", "Which calculation checks 83 - 47 = 36?", "Use the inverse operation.", ["36 + 47 = 83", "83 + 47 = 130", "47 - 36 = 11"], "36 + 47 = 83", numbers("Use inverse addition.", [36, 47, 83]), "inverse-checking", "Inverse checking", ["wrong-check-operation"]],
    ["Rounding decision", "A bus seats 28 people. A group has 85 people. How many buses are needed?", "Divide, then round up for the context.", ["3 buses", "4 buses", "5 buses"], "4 buses", groups("85 people in buses of 28.", [28, 28, 28, 1], ["bus", "bus", "bus", "extra"]), "context-judgement", "Context judgement", ["rounds-down-with-remainder"]],
    ["Compare answers", "Which answer is most reasonable for 12.4 + 8.9?", "Estimate 12 + 9.", ["11.3", "21.3", "113"], "21.3", numbers("Estimate near 21.", ["12.4", "8.9", "21"]), "reasonableness", "Reasonableness", ["decimal-place-value-error"]],
    ["Communicate sequence", "Which plan is clearest for: buy 4 tickets at 18 dollars and pay a 6 dollar fee?", "Do the repeated cost, then add the fee.", ["4 x 18 + 6", "4 + 18 x 6", "18 - 6 x 4"], "4 x 18 + 6", groups("Four tickets plus one fee.", [18, 18, 18, 18, 6], ["ticket", "ticket", "ticket", "ticket", "fee"]), "communication", "Communication", ["operation-order-expression-gap"]],
    ["Identify error", "A learner solves 6 + 4 x 5 as 50. What happened?", "Check the order of operations.", ["They added before multiplying", "They multiplied before adding", "They estimated correctly"], "They added before multiplying", numbers("Multiply before adding.", [4, 5, 20, 26]), "error-analysis", "Error analysis", ["order-of-operations-gap"]],
    ["Choose check", "Which check helps after 19 x 6 = 114?", "Use a nearby estimate.", ["20 x 6 = 120, so 114 is reasonable", "10 x 6 = 60, so 114 is impossible", "19 + 6 = 25, so 114 is wrong"], "20 x 6 = 120, so 114 is reasonable", groups("Compare with 20 groups of 6.", [6, 6, 6, 6, 6], ["sample", "sample", "sample", "sample", "sample"]), "estimation-check", "Estimation check", ["poor-estimate-choice"]],
    ["Units matter", "A result is 240 minutes. Which conversion communicates it clearly?", "Convert minutes to hours.", ["2 hours", "3 hours", "4 hours"], "4 hours", groups("240 minutes in 60-minute hours.", [60, 60, 60, 60], ["hour", "hour", "hour", "hour"]), "units-communication", "Units communication", ["unit-conversion-gap"]],
    ["Revise answer", "A shopping estimate was 30 dollars, but the exact total is 58 dollars. What should you do?", "Compare estimate and exact result.", ["Accept it without checking", "Recheck the calculation or estimate", "Change 58 to 30"], "Recheck the calculation or estimate", numbers("Estimate and exact are far apart.", [30, 58]), "checking-habit", "Checking habit", ["estimate-exact-gap-not-noticed"]],
    ["Best explanation", "Which explanation best supports 96 ÷ 8 = 12?", "Connect division with multiplication.", ["Because 12 x 8 = 96", "Because 96 - 8 = 88", "Because 96 + 8 = 104"], "Because 12 x 8 = 96", groups("12 groups of 8 make 96.", [8, 8, 8, 8, 8, 8], ["sample", "sample", "sample", "sample", "sample", "sample"]), "mathematical-communication", "Mathematical communication", ["explanation-not-linked-to-operation"]],
  ],
].map((items) =>
  items.map(([title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets]) => ({
    title, prompt, practicePrompt, options, answer, visual, cluster, clusterTitle, misconceptionTargets,
  } as OperationCase)),
);

OPERATIONS_STEP_SPECS.push(
  ...LATER_STEP_SPECS,
  ...UPPER_STEP_TITLES.map(([title, stepKey, stageKey, stageTitle, shortTitle], index) => ({
    order: index + 7,
    stepNumber: index % 2 === 0 ? 1 : 2,
    stageKey,
    stageTitle,
    stepKey,
    pathwayStepId: `mathematics::operations-and-calculation::${stageKey}::${stepKey}`,
    title,
    shortTitle,
    description: `Use ${shortTitle.toLowerCase()} with clear operation choices, checking, and visual models.`,
    cases: UPPER_CASES[index],
  })),
);

export const OPERATIONS_STEP_ASSESSMENTS: OperationsStepAssessment[] =
  OPERATIONS_STEP_SPECS.map((spec) => ({
    key: `operations-step-${spec.order}-${spec.stepKey}-assessment-v1`,
    stepNumber: spec.stepNumber,
    stepKey: spec.stepKey,
    pathwayStepId: spec.pathwayStepId,
    title: spec.title,
    shortTitle: spec.shortTitle,
    description: spec.description,
    subjectKey: "mathematics",
    strandKey: OPERATIONS_STRAND_KEY,
    stageKey: spec.stageKey,
    parentBankKey: OPERATIONS_PARENT_FAMILY_KEY,
    parentBankTitle: OPERATIONS_PARENT_FAMILY_TITLE,
    parentItemBankKey: OPERATIONS_ITEM_BANK_KEY,
    progressionBandKey: OPERATIONS_PARENT_FAMILY_KEY,
    sourceRoute: OPERATIONS_SOURCE_ROUTE,
    depthOptions: NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
    items: spec.cases.map((item, index) => makeItem(spec, item, index)),
  }));

export function getOperationsStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
) {
  const stepAssessmentKey = safe(context.stepAssessmentKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    OPERATIONS_STEP_ASSESSMENTS.find(
      (assessment) =>
        (stepAssessmentKey && assessment.key === stepAssessmentKey) ||
        (pathwayStepId && assessment.pathwayStepId === pathwayStepId) ||
        (stepKey && assessment.stepKey === stepKey),
    ) || null
  );
}

export function getOperationsStepAssessmentItemsForDepth(
  assessmentKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const assessment =
    OPERATIONS_STEP_ASSESSMENTS.find((candidate) => candidate.key === assessmentKey) ||
    null;

  if (!assessment) return [];

  return assessment.items.slice(0, getNumberStepAssessmentDepthItemCount(depth));
}
