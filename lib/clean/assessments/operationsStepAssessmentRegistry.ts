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
  feedback?: string;
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
    workedSolution: item.feedback ?? item.answer,
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
      {
        title: "Joining apples",
        prompt: "Ella has 3 apples. Sam gives her 2 more apples. How many apples does she have now?",
        practicePrompt: "Act out the story: start with 3 apples, then join 2 more apples. How many are there now?",
        options: ["5", "4", "3", "2"],
        answer: "5",
        visual: groups("3 apples join 2 more apples.", [3, 2], ["apples", "more apples"]),
        cluster: "joining-stories",
        clusterTitle: "Joining stories",
        misconceptionTargets: ["joins-but-does-not-count-change"],
        feedback: "3 apples joined with 2 more apples makes 5 apples.",
      },
      {
        title: "Joining balloons",
        prompt: "There are 4 balloons. 2 more balloons float up. How many balloons are there now?",
        practicePrompt: "Show 4 balloons. Add 2 more balloons. Count how many balloons there are now.",
        options: ["6", "5", "4", "2"],
        answer: "6",
        visual: groups("4 balloons join 2 more balloons.", [4, 2], ["balloons", "more balloons"]),
        cluster: "joining-stories",
        clusterTitle: "Joining stories",
        misconceptionTargets: ["counting-all-slip"],
        feedback: "4 and 2 more makes 6.",
      },
      {
        title: "Joining snails",
        prompt: "There are 2 snails on a log. 3 more snails crawl onto the log. How many snails are on the log now?",
        practicePrompt: "Put 2 snails on the log, then join 3 more snails. Count the snails altogether.",
        options: ["5", "4", "3", "2"],
        answer: "5",
        visual: groups("2 snails join 3 more snails.", [2, 3], ["snails", "more snails"]),
        cluster: "joining-stories",
        clusterTitle: "Joining stories",
        misconceptionTargets: ["one-to-one-counting-error"],
        feedback: "2 snails joined with 3 more snails makes 5 snails.",
      },
      {
        title: "Taking away crackers",
        prompt: "Mia has 5 crackers. She eats 2. How many crackers are left?",
        practicePrompt: "Show 5 crackers. Take away 2 crackers. Count how many crackers are left.",
        options: ["3", "2", "5", "7"],
        answer: "3",
        visual: groups("5 crackers with 2 eaten.", [5, 2], ["crackers", "eaten crackers"]),
        cluster: "taking-away-stories",
        clusterTitle: "Taking away stories",
        misconceptionTargets: ["counts-removed-instead-of-left"],
        feedback: "Start with 5. Take away 2. There are 3 left.",
      },
      {
        title: "Taking away birds",
        prompt: "There are 6 birds in a tree. 2 birds fly away. How many birds are left?",
        practicePrompt: "Show 6 birds. Move 2 birds away. Count the birds still in the tree.",
        options: ["4", "6", "2", "8"],
        answer: "4",
        visual: groups("6 birds with 2 flying away.", [6, 2], ["birds", "fly away"]),
        cluster: "taking-away-stories",
        clusterTitle: "Taking away stories",
        misconceptionTargets: ["removed-vs-left-confusion"],
        feedback: "6 birds take away 2 birds leaves 4 birds.",
      },
      {
        title: "Taking away toy cars",
        prompt: "Ben has 7 toy cars. He gives 3 to his friend. How many toy cars does he have now?",
        practicePrompt: "Show 7 toy cars. Take away the 3 toy cars Ben gives away. Count what is left.",
        options: ["4", "3", "7", "10"],
        answer: "4",
        visual: groups("7 toy cars with 3 given away.", [7, 3], ["toy cars", "given away"]),
        cluster: "taking-away-stories",
        clusterTitle: "Taking away stories",
        misconceptionTargets: ["counts-change-not-result"],
        feedback: "Start with 7 toy cars. Take away 3. Ben has 4 toy cars now.",
      },
      {
        title: "Match apple sentence",
        prompt: "Which number sentence matches the story? Ella has 3 apples. Sam gives her 2 more apples.",
        practicePrompt: "Say the apple story, then choose the number sentence that shows joining.",
        options: ["3 + 2 = 5", "3 - 2 = 1", "5 - 2 = 3", "2 + 5 = 7"],
        answer: "3 + 2 = 5",
        visual: groups("3 apples join 2 more apples.", [3, 2], ["apples", "more apples"]),
        cluster: "number-sentences",
        clusterTitle: "Number sentences",
        misconceptionTargets: ["operation-symbol-confusion"],
        feedback: "Sam gives more apples, so the matching number sentence is 3 + 2 = 5.",
      },
      {
        title: "Match cracker sentence",
        prompt: "Which number sentence matches the story? Mia has 5 crackers. She eats 2.",
        practicePrompt: "Say the cracker story, then choose the number sentence that shows taking away.",
        options: ["5 - 2 = 3", "5 + 2 = 7", "3 + 2 = 5", "2 - 5 = 3"],
        answer: "5 - 2 = 3",
        visual: groups("5 crackers with 2 eaten.", [5, 2], ["crackers", "eaten crackers"]),
        cluster: "number-sentences",
        clusterTitle: "Number sentences",
        misconceptionTargets: ["subtraction-order-confusion"],
        feedback: "Mia eats 2 crackers, so the matching number sentence is 5 - 2 = 3.",
      },
      {
        title: "Joining or taking away biscuits",
        prompt: "You have 3 biscuits. Your friend gives you 2 more. Is this joining or taking away?",
        practicePrompt: "Decide whether the biscuit group gets bigger or smaller.",
        options: ["Joining", "Taking away"],
        answer: "Joining",
        visual: groups("3 biscuits join 2 more biscuits.", [3, 2], ["biscuits", "more biscuits"]),
        cluster: "operation-language",
        clusterTitle: "Joining or taking away",
        misconceptionTargets: ["more-less-action-confusion"],
        feedback: "The group gets bigger because 2 more biscuits are joined.",
      },
      {
        title: "Joining or taking away stickers",
        prompt: "You had 5 stickers. You use 2 of them. Is this joining or taking away?",
        practicePrompt: "Decide whether the sticker group gets bigger or smaller.",
        options: ["Taking away", "Joining"],
        answer: "Taking away",
        visual: groups("5 stickers with 2 used.", [5, 2], ["stickers", "used stickers"]),
        cluster: "operation-language",
        clusterTitle: "Joining or taking away",
        misconceptionTargets: ["more-less-action-confusion"],
        feedback: "Using 2 stickers takes them away from the starting group.",
      },
      {
        title: "Choose picture for joining",
        prompt: "Which picture shows 4 + 2?",
        practicePrompt: "Look for the picture where 4 objects join with 2 more objects.",
        options: [
          "A group of 4 objects joined with a group of 2 objects",
          "A group of 4 objects with 2 crossed out",
          "A group of 2 objects only",
          "A group of 4 objects only",
        ],
        answer: "A group of 4 objects joined with a group of 2 objects",
        visual: groups("4 shells join 2 more shells.", [4, 2], ["shells", "more shells"]),
        cluster: "picture-match",
        clusterTitle: "Object and picture representations",
        misconceptionTargets: ["picture-operation-mismatch"],
        feedback: "4 + 2 shows two groups joining: 4 objects and 2 more objects.",
      },
      {
        title: "Choose picture for taking away",
        prompt: "Which picture shows 6 - 2?",
        practicePrompt: "Look for the picture where 6 objects have 2 taken away.",
        options: [
          "A group of 6 objects with 2 taken away",
          "A group of 6 objects joined with 2 more",
          "A group of 2 objects joined with 6 more",
          "A group of 6 objects only",
        ],
        answer: "A group of 6 objects with 2 taken away",
        visual: groups("6 blocks with 2 taken away.", [6, 2], ["blocks", "taken blocks"]),
        cluster: "picture-match",
        clusterTitle: "Object and picture representations",
        misconceptionTargets: ["addition-subtraction-picture-confusion"],
        feedback: "6 - 2 shows a starting group of 6 with 2 taken away.",
      },
      {
        title: "Blocks taken away",
        prompt: "There are 8 blocks. 3 blocks are taken away. How many blocks are left?",
        practicePrompt: "Show 8 blocks. Take away 3 blocks. Count how many blocks are left.",
        options: ["5", "11", "8", "3"],
        answer: "5",
        visual: groups("8 blocks with 3 taken away.", [8, 3], ["blocks", "taken blocks"]),
        cluster: "taking-away-stories",
        clusterTitle: "Taking away stories",
        misconceptionTargets: ["counts-change-not-result"],
        feedback: "Start with 8 blocks. Take away 3. There are 5 blocks left.",
      },
      {
        title: "Ducks joining",
        prompt: "There are 4 ducks. 3 more ducks join them. How many ducks are there now?",
        practicePrompt: "Show 4 ducks. Join 3 more ducks. Count the ducks altogether.",
        options: ["7", "4", "3", "1"],
        answer: "7",
        visual: groups("4 ducks join 3 more ducks.", [4, 3], ["ducks", "more ducks"]),
        cluster: "joining-stories",
        clusterTitle: "Joining stories",
        misconceptionTargets: ["near-total-confusion"],
        feedback: "4 ducks joined with 3 more ducks makes 7 ducks.",
      },
    ],
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
      {
        title: "Share apples equally",
        prompt: "Share 6 apples equally between 2 groups. How many apples does each group get?",
        practicePrompt: "Share 6 apples equally between 2 groups. Choose how many apples are in each group.",
        options: ["3", "2", "4", "6"],
        answer: "3",
        visual: groups("Share 6 apples equally between 2 groups.", [6, 2], ["apples", "groups"]),
        cluster: "fair-sharing",
        clusterTitle: "Fair sharing",
        misconceptionTargets: ["unequal-sharing-gap"],
        feedback: "6 apples shared equally into 2 groups gives 3 apples in each group.",
      },
      {
        title: "Share cookies equally",
        prompt: "Share 8 cookies equally between 2 groups. How many cookies does each group get?",
        practicePrompt: "Share 8 cookies equally between 2 groups. Choose how many cookies are in each group.",
        options: ["4", "2", "6", "8"],
        answer: "4",
        visual: groups("Share 8 cookies equally between 2 groups.", [8, 2], ["cookies", "groups"]),
        cluster: "fair-sharing",
        clusterTitle: "Fair sharing",
        misconceptionTargets: ["counts-total-instead-of-each-share"],
        feedback: "8 cookies shared equally into 2 groups gives 4 cookies in each group.",
      },
      {
        title: "Share pencils equally",
        prompt: "Share 10 pencils equally between 2 groups. How many pencils does each group get?",
        practicePrompt: "Share 10 pencils equally between 2 groups. Choose how many pencils are in each group.",
        options: ["5", "4", "6", "10"],
        answer: "5",
        visual: groups("Share 10 pencils equally between 2 groups.", [10, 2], ["pencils", "groups"]),
        cluster: "fair-sharing",
        clusterTitle: "Fair sharing",
        misconceptionTargets: ["equal-groups-count-error"],
        feedback: "10 pencils shared equally into 2 groups gives 5 pencils in each group.",
      },
      {
        title: "Compare cubes",
        prompt: "Which group has more? Group A has 5 green cubes. Group B has 4 yellow cubes.",
        practicePrompt: "Compare the two cube groups. Choose the group with more cubes.",
        options: ["Group A", "Group B", "They are the same"],
        answer: "Group A",
        visual: groups("Compare 5 green cubes and 4 yellow cubes.", [5, 4], ["Group A cubes", "Group B cubes"]),
        cluster: "compare-more",
        clusterTitle: "More, less, and same",
        misconceptionTargets: ["spacing-quantity-confusion"],
        feedback: "5 is more than 4.",
      },
      {
        title: "Compare flowers",
        prompt: "Which group has more? Group A has 3 flowers. Group B has 3 flowers.",
        practicePrompt: "Compare the two flower groups. Choose whether one group has more or they are the same.",
        options: ["They are the same", "Group A", "Group B"],
        answer: "They are the same",
        visual: groups("Compare 3 flowers and 3 flowers.", [3, 3], ["Group A flowers", "Group B flowers"]),
        cluster: "same-amount",
        clusterTitle: "More, less, and same",
        misconceptionTargets: ["same-means-close-confusion"],
        feedback: "Both groups have 3 flowers.",
      },
      {
        title: "Compare stars",
        prompt: "Two groups each have 5 stars. What should you write?",
        practicePrompt: "Look at the star groups and choose the word that describes them.",
        options: ["same", "more", "less", "different"],
        answer: "same",
        visual: groups("Compare two groups of 5 stars.", [5, 5], ["stars", "stars"]),
        cluster: "same-amount",
        clusterTitle: "More, less, and same",
        misconceptionTargets: ["comparison-language-confusion"],
        feedback: "Both groups have 5 stars, so they are the same.",
      },
      {
        title: "Difference with bears",
        prompt: "There are 6 red bears and 3 blue bears. How many more red bears are there than blue bears?",
        practicePrompt: "Match the bear groups and count the extra red bears.",
        options: ["3", "6", "2", "9"],
        answer: "3",
        visual: groups("Compare 6 red bears and 3 blue bears.", [6, 3], ["red bears", "blue bears"]),
        cluster: "simple-difference",
        clusterTitle: "Simple differences",
        misconceptionTargets: ["difference-vs-total-confusion"],
        feedback: "6 is 3 more than 3.",
      },
      {
        title: "Difference with bananas",
        prompt: "There are 5 bananas on the left and 2 bananas on the right. How many more bananas are on the left?",
        practicePrompt: "Pair the bananas, then count the extra bananas on the left.",
        options: ["3", "2", "5", "7"],
        answer: "3",
        visual: groups("Compare 5 bananas on the left and 2 bananas on the right.", [5, 2], ["left bananas", "right bananas"]),
        cluster: "simple-difference",
        clusterTitle: "Simple differences",
        misconceptionTargets: ["counts-all-instead-of-extras"],
        feedback: "5 is 3 more than 2.",
      },
      {
        title: "Difference with cars",
        prompt: "There are 4 green cars and 2 red cars. How many more green cars are there than red cars?",
        practicePrompt: "Compare the car groups and count how many extra green cars there are.",
        options: ["2", "4", "6", "1"],
        answer: "2",
        visual: groups("Compare 4 green cars and 2 red cars.", [4, 2], ["green cars", "red cars"]),
        cluster: "simple-difference",
        clusterTitle: "Simple differences",
        misconceptionTargets: ["comparison-direction-error"],
        feedback: "4 is 2 more than 2.",
      },
      {
        title: "Joining strawberries",
        prompt: "Mia has 2 strawberries. Her friend gives her 3 more. How many strawberries does Mia have now?",
        practicePrompt: "Start with 2 strawberries, then join 3 more strawberries. Count how many there are now.",
        options: ["5", "3", "2", "1"],
        answer: "5",
        visual: groups("2 strawberries join 3 more strawberries.", [2, 3], ["strawberries", "more strawberries"]),
        cluster: "joining-stories",
        clusterTitle: "Joining stories",
        misconceptionTargets: ["joins-but-does-not-count-change"],
        feedback: "2 and 3 more makes 5.",
      },
      {
        title: "Taking away toy cars",
        prompt: "Jack has 5 toy cars. He gives 2 to his brother. How many cars does Jack have left?",
        practicePrompt: "Start with 5 toy cars, then take away 2 toy cars. Count how many are left.",
        options: ["3", "2", "5", "7"],
        answer: "3",
        visual: groups("5 toy cars with 2 given away.", [5, 2], ["toy cars", "given away"]),
        cluster: "taking-away-stories",
        clusterTitle: "Taking away stories",
        misconceptionTargets: ["counts-removed-instead-of-left"],
        feedback: "Start with 5. Take away 2. There are 3 left.",
      },
      {
        title: "Choose sharing picture",
        prompt: "Which picture shows 8 cookies shared equally into 2 groups?",
        practicePrompt: "Choose the picture where 8 cookies are split into 2 equal groups.",
        options: [
          "Two groups of 4 cookies",
          "One group of 8 cookies and one empty group",
          "Two groups of 3 cookies",
          "Two groups of 5 cookies",
        ],
        answer: "Two groups of 4 cookies",
        visual: groups("Share 8 cookies equally into 2 groups.", [8, 2], ["cookies", "groups"]),
        cluster: "picture-match",
        clusterTitle: "Object and picture representations",
        misconceptionTargets: ["unequal-sharing-picture-confusion"],
        feedback: "8 cookies shared equally into 2 groups makes two groups of 4 cookies.",
      },
      {
        title: "Choose more picture",
        prompt: "Which picture shows a group that has more?",
        practicePrompt: "Look for the picture where one group has more objects than the other group.",
        options: [
          "5 cubes compared with 4 cubes",
          "3 flowers compared with 3 flowers",
          "2 cars compared with 4 cars, choosing 2",
          "4 shells compared with 4 shells",
        ],
        answer: "5 cubes compared with 4 cubes",
        visual: groups("Compare 5 cubes and 4 cubes.", [5, 4], ["cubes", "cubes"]),
        cluster: "picture-match",
        clusterTitle: "Object and picture representations",
        misconceptionTargets: ["picture-comparison-mismatch"],
        feedback: "5 cubes compared with 4 cubes shows a group that has more.",
      },
      {
        title: "Joining or taking away strawberries",
        prompt: "Mia has 2 strawberries. Her friend gives her 3 more. Is this joining or taking away?",
        practicePrompt: "Decide whether Mia's strawberries are joining together or being taken away.",
        options: ["Joining", "Taking away"],
        answer: "Joining",
        visual: groups("2 strawberries join 3 more strawberries.", [2, 3], ["strawberries", "more strawberries"]),
        cluster: "operation-language",
        clusterTitle: "Joining or taking away",
        misconceptionTargets: ["more-less-action-confusion"],
        feedback: "The group gets bigger because 3 more strawberries are joined.",
      },
      {
        title: "Joining or taking away toy cars",
        prompt: "Jack has 5 toy cars. He gives 2 to his brother. Is this joining or taking away?",
        practicePrompt: "Decide whether Jack's toy car group gets bigger or smaller.",
        options: ["Taking away", "Joining"],
        answer: "Taking away",
        visual: groups("5 toy cars with 2 given away.", [5, 2], ["toy cars", "given away"]),
        cluster: "operation-language",
        clusterTitle: "Joining or taking away",
        misconceptionTargets: ["more-less-action-confusion"],
        feedback: "Giving 2 toy cars to his brother takes them away from Jack's group.",
      },
      {
        title: "Difference with shells",
        prompt: "There are 7 shells in one group and 5 shells in another group. How many more shells are in the larger group?",
        practicePrompt: "Pair the shell groups and count the extra shells in the larger group.",
        options: ["2", "5", "7", "12"],
        answer: "2",
        visual: groups("Compare 7 shells and 5 shells.", [7, 5], ["shells", "shells"]),
        cluster: "simple-difference",
        clusterTitle: "Simple differences",
        misconceptionTargets: ["difference-vs-total-confusion"],
        feedback: "7 is 2 more than 5.",
      },
    ],
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
      {
        title: "Missing part to 8",
        prompt: "Use the part-whole model to find the missing part. 3 + __ = 8",
        practicePrompt: "The whole is 8. One part is 3. Choose the missing part.",
        options: ["5", "4", "6", "3"],
        answer: "5",
        visual: groups("Whole 8 with parts 3 and missing.", [8, 3, 5], ["whole", "part", "missing part"]),
        cluster: "missing-part-addition",
        clusterTitle: "Missing part addition",
        misconceptionTargets: ["counts-known-part-as-answer"],
        feedback: "3 and 5 make 8.",
      },
      {
        title: "Missing part to 12",
        prompt: "Use the part-whole model to find the missing part. __ + 7 = 12",
        practicePrompt: "The whole is 12. One part is 7. Choose the missing part.",
        options: ["5", "6", "4", "7"],
        answer: "5",
        visual: groups("Whole 12 with parts 7 and missing.", [12, 7, 5], ["whole", "part", "missing part"]),
        cluster: "missing-part-addition",
        clusterTitle: "Missing part addition",
        misconceptionTargets: ["missing-part-counting-error"],
        feedback: "5 and 7 make 12.",
      },
      {
        title: "Missing part to 15",
        prompt: "Use the part-whole model to find the missing part. 9 + __ = 15",
        practicePrompt: "The whole is 15. One part is 9. Choose the missing part.",
        options: ["6", "5", "7", "9"],
        answer: "6",
        visual: groups("Whole 15 with parts 9 and missing.", [15, 9, 6], ["whole", "part", "missing part"]),
        cluster: "missing-part-addition",
        clusterTitle: "Missing part addition",
        misconceptionTargets: ["counts-total-as-missing-part"],
        feedback: "9 and 6 make 15.",
      },
      {
        title: "Subtraction from 11",
        prompt: "Use the part-whole model to complete the subtraction sentence. 11 - 6 = __",
        practicePrompt: "The whole is 11. One part is 6. Choose the missing part.",
        options: ["5", "6", "4", "17"],
        answer: "5",
        visual: groups("Whole 11 with parts 6 and missing.", [11, 6, 5], ["whole", "part", "missing part"]),
        cluster: "missing-part-subtraction",
        clusterTitle: "Missing part subtraction",
        misconceptionTargets: ["adds-instead-of-subtracts"],
        feedback: "The whole is 11. One part is 6. The missing part is 5.",
      },
      {
        title: "Subtraction from 14",
        prompt: "Use the part-whole model to complete the subtraction sentence. 14 - 8 = __",
        practicePrompt: "The whole is 14. One part is 8. Choose the missing part.",
        options: ["6", "5", "7", "8"],
        answer: "6",
        visual: groups("Whole 14 with parts 8 and missing.", [14, 8, 6], ["whole", "part", "missing part"]),
        cluster: "missing-part-subtraction",
        clusterTitle: "Missing part subtraction",
        misconceptionTargets: ["subtracts-wrong-direction"],
        feedback: "14 split into 8 and 6, so 14 - 8 = 6.",
      },
      {
        title: "Subtraction from 17",
        prompt: "Use the part-whole model to complete the subtraction sentence. 17 - 10 = __",
        practicePrompt: "The whole is 17. One part is 10. Choose the missing part.",
        options: ["7", "6", "8", "10"],
        answer: "7",
        visual: groups("Whole 17 with parts 10 and missing.", [17, 10, 7], ["whole", "part", "missing part"]),
        cluster: "missing-part-subtraction",
        clusterTitle: "Missing part subtraction",
        misconceptionTargets: ["teen-number-part-gap"],
        feedback: "17 split into 10 and 7, so 17 - 10 = 7.",
      },
      {
        title: "Related facts to 10",
        prompt: "Which two number sentences match the part-whole model?",
        practicePrompt: "The whole is 10. The parts are 4 and 6. Choose matching related facts.",
        options: [
          "4 + 6 = 10 and 10 - 4 = 6",
          "4 + 10 = 6 and 10 - 6 = 4",
          "10 + 6 = 4 and 4 - 6 = 10",
          "6 - 4 = 10 and 10 + 4 = 6",
        ],
        answer: "4 + 6 = 10 and 10 - 4 = 6",
        visual: groups("Whole 10 with parts 4 and 6.", [10, 4, 6], ["whole", "part", "part"]),
        cluster: "related-facts",
        clusterTitle: "Related facts",
        misconceptionTargets: ["inverse-operation-gap"],
        feedback: "The parts 4 and 6 make 10, and 10 - 4 leaves 6.",
      },
      {
        title: "Related subtraction to 13",
        prompt: "Which number sentence matches the model?",
        practicePrompt: "The whole is 13. The parts are 5 and 8. Choose the matching subtraction fact.",
        options: ["13 - 5 = 8", "13 + 5 = 8", "5 - 8 = 13", "8 - 13 = 5"],
        answer: "13 - 5 = 8",
        visual: groups("Whole 13 with parts 5 and 8.", [13, 5, 8], ["whole", "part", "part"]),
        cluster: "related-facts",
        clusterTitle: "Related facts",
        misconceptionTargets: ["operation-symbol-confusion"],
        feedback: "The whole is 13. Taking away the part 5 leaves the part 8.",
      },
      {
        title: "One number fits two sentences",
        prompt: "Choose the number that completes both sentences. 4 + __ = 10 and 10 - 4 = __",
        practicePrompt: "Use the same missing part for the addition and subtraction sentence.",
        options: ["6", "5", "7", "8"],
        answer: "6",
        visual: groups("Whole 10 with parts 4 and missing.", [10, 4, 6], ["whole", "part", "missing part"]),
        cluster: "missing-number",
        clusterTitle: "Choose the missing number",
        misconceptionTargets: ["fact-family-missing-number-gap"],
        feedback: "The missing part is 6, so both sentences use 6.",
      },
      {
        title: "One number fits to 13",
        prompt: "Choose the number that completes both sentences. __ + 5 = 13 and 13 - 5 = __",
        practicePrompt: "Use the whole 13 and the known part 5 to find the missing part.",
        options: ["8", "7", "6", "9"],
        answer: "8",
        visual: groups("Whole 13 with parts 5 and missing.", [13, 5, 8], ["whole", "part", "missing part"]),
        cluster: "missing-number",
        clusterTitle: "Choose the missing number",
        misconceptionTargets: ["known-part-as-answer"],
        feedback: "The missing part is 8.",
      },
      {
        title: "Equal parts to 18",
        prompt: "Choose the number that completes both sentences. 9 + __ = 18 and 18 - 9 = __",
        practicePrompt: "The whole is 18 and one part is 9. Choose the missing part.",
        options: ["9", "8", "10", "7"],
        answer: "9",
        visual: groups("Whole 18 with parts 9 and missing.", [18, 9, 9], ["whole", "part", "missing part"]),
        cluster: "missing-number",
        clusterTitle: "Choose the missing number",
        misconceptionTargets: ["double-fact-gap"],
        feedback: "9 and 9 make 18.",
      },
      {
        title: "Cars in all",
        prompt: "Ben has 5 red cars and 7 blue cars. How many cars does he have in all?",
        practicePrompt: "The parts are 5 red cars and 7 blue cars. Choose the whole.",
        options: ["12", "10", "2", "13"],
        answer: "12",
        visual: groups("5 red cars and 7 blue cars make the whole.", [12, 5, 7], ["whole cars", "red cars", "blue cars"]),
        cluster: "story-problems",
        clusterTitle: "Part-whole story problems",
        misconceptionTargets: ["difference-instead-of-total"],
        feedback: "The two parts are 5 and 7. The whole is 12.",
      },
      {
        title: "Crayons left",
        prompt: "Mia has 14 crayons. She gives 6 crayons to her friend. How many crayons does Mia have left?",
        practicePrompt: "The whole is 14 crayons. One part is 6 crayons. Choose the missing part.",
        options: ["8", "7", "6", "20"],
        answer: "8",
        visual: groups("14 crayons with 6 given away.", [14, 6, 8], ["whole crayons", "given away", "left"]),
        cluster: "story-problems",
        clusterTitle: "Part-whole story problems",
        misconceptionTargets: ["adds-story-parts"],
        feedback: "The whole is 14. One part is 6. The missing part is 8.",
      },
      {
        title: "Students in class",
        prompt: "There are 16 students in the class. 8 are girls. The rest are boys. How many boys are there?",
        practicePrompt: "The whole is 16 students. One part is 8 girls. Choose the missing part.",
        options: ["8", "7", "9", "16"],
        answer: "8",
        visual: groups("16 students split into girls and boys.", [16, 8, 8], ["whole students", "girls", "boys"]),
        cluster: "story-problems",
        clusterTitle: "Part-whole story problems",
        misconceptionTargets: ["whole-as-missing-part"],
        feedback: "16 split into 8 and 8, so there are 8 boys.",
      },
      {
        title: "Match model to addition",
        prompt: "Which part-whole model matches 9 + __ = 15?",
        practicePrompt: "Choose the model with whole 15 and known part 9.",
        options: [
          "Whole 15, parts 9 and 6",
          "Whole 9, parts 15 and 6",
          "Whole 6, parts 9 and 15",
          "Whole 15, parts 8 and 7",
        ],
        answer: "Whole 15, parts 9 and 6",
        visual: groups("Match 9 + missing part = 15.", [15, 9, 6], ["whole", "part", "missing part"]),
        cluster: "model-match",
        clusterTitle: "Match models and number sentences",
        misconceptionTargets: ["whole-and-part-reversal"],
        feedback: "The whole is 15, and the parts are 9 and 6.",
      },
      {
        title: "Match model to subtraction",
        prompt: "Which part-whole model matches 14 - 8 = __?",
        practicePrompt: "Choose the model with whole 14 and known part 8.",
        options: [
          "Whole 14, parts 8 and 6",
          "Whole 8, parts 14 and 6",
          "Whole 6, parts 14 and 8",
          "Whole 14, parts 7 and 7",
        ],
        answer: "Whole 14, parts 8 and 6",
        visual: groups("Match 14 - 8 = missing part.", [14, 8, 6], ["whole", "part", "missing part"]),
        cluster: "model-match",
        clusterTitle: "Match models and number sentences",
        misconceptionTargets: ["subtraction-model-mismatch"],
        feedback: "The whole is 14, and the parts are 8 and 6.",
      },
      {
        title: "Correct sentence",
        prompt: "The whole is 17. One part is 10. The missing part is 7. Which sentence is correct?",
        practicePrompt: "Use the whole and parts to choose the correct subtraction sentence.",
        options: ["17 - 10 = 7", "10 - 17 = 7", "17 + 10 = 7", "7 - 10 = 17"],
        answer: "17 - 10 = 7",
        visual: groups("Whole 17 with parts 10 and 7.", [17, 10, 7], ["whole", "part", "part"]),
        cluster: "number-sentences",
        clusterTitle: "Number sentences",
        misconceptionTargets: ["subtraction-order-confusion"],
        feedback: "Start with the whole 17. Taking away the part 10 leaves 7.",
      },
    ],
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
