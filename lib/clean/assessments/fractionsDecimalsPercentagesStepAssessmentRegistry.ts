import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentDepthItemCount,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export const FRACTIONS_DECIMALS_PERCENTAGES_STRAND_KEY =
  "fractions-decimals-percentages";
export const FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_KEY =
  "fractions-decimals-percentages-foundations";
export const FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_TITLE =
  "Fractions, decimals, and percentages";
export const FRACTIONS_DECIMALS_PERCENTAGES_ITEM_BANK_KEY =
  "fractions-decimals-percentages-step-assessment-items-v1";
export const FRACTIONS_DECIMALS_PERCENTAGES_SOURCE_ROUTE = "/assessments/number";

type FractionsCase = {
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

type RawFractionsCase = [
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

export type FractionsDecimalsPercentagesStepSpec = {
  order: number;
  stepNumber: number;
  stageKey: CleanAssessmentStageKey;
  stageTitle: string;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  cases: FractionsCase[];
};

export type FractionsDecimalsPercentagesStepAssessment = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof FRACTIONS_DECIMALS_PERCENTAGES_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentBankKey: typeof FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_KEY;
  parentBankTitle: typeof FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_TITLE;
  parentItemBankKey: typeof FRACTIONS_DECIMALS_PERCENTAGES_ITEM_BANK_KEY;
  progressionBandKey: typeof FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_KEY;
  sourceRoute: typeof FRACTIONS_DECIMALS_PERCENTAGES_SOURCE_ROUTE;
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
]: RawFractionsCase): FractionsCase {
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

function itemId(spec: FractionsDecimalsPercentagesStepSpec, index: number) {
  return `fractions-decimals-percentages-step-${spec.order}-assess-${String(
    index + 1,
  ).padStart(3, "0")}`;
}

function makeItem(
  spec: FractionsDecimalsPercentagesStepSpec,
  item: FractionsCase,
  index: number,
): NumberAssessmentBankItem {
  return {
    id: itemId(spec, index),
    progressionBandKey: FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_KEY,
    progressionStepKey: spec.stepKey,
    subElementKey: item.cluster,
    subElementTitle: item.clusterTitle,
    subElementDescription: spec.description,
    title: item.title,
    prompt: item.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "fraction_decimal_percentage_visual_card",
    options: item.options,
    expectedAnswer: item.answer,
    acceptableAnswers: [item.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: item.answer,
    misconceptionTargets: item.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: spec.stepKey,
      ifCorrectGoToStepKey: spec.stepKey,
      practiceRecommendation: `Practise ${spec.shortTitle.toLowerCase()} with fraction bars, grids, number lines, and context cards.`,
      diagnosticNote: `Checks whether the learner can use ${spec.shortTitle.toLowerCase()} for this exact pathway step.`,
    },
    visualSupport: visual(item.visual),
  };
}

const FRACTIONS_STEP_TITLES: Array<
  [
    string,
    string,
    CleanAssessmentStageKey,
    string,
    number,
    string,
    string,
  ]
> = [
  [
    "Recognise equal parts in real objects and sharing situations",
    "recognise-equal-parts-in-real-objects-and-sharing-situations",
    "foundation-kindergarten",
    "Foundation / Kindergarten",
    1,
    "Equal parts",
    "Recognise fair equal parts and unequal parts in familiar sharing and shape contexts.",
  ],
  [
    "Use halves in simple real-world situations",
    "use-halves-in-simple-real-world-situations",
    "foundation-kindergarten",
    "Foundation / Kindergarten",
    2,
    "Halves in real situations",
    "Identify and use halves in objects, shapes, and small collections.",
  ],
  [
    "Use halves, quarters, and simple fractions in practical tasks",
    "use-halves-quarters-and-simple-fractions-in-practical-tasks",
    "lower-primary",
    "Lower Primary",
    1,
    "Halves, quarters, and simple fractions",
    "Use familiar fractions in practical sharing, folding, and portioning tasks.",
  ],
  [
    "Describe simple fraction situations with confidence",
    "describe-simple-fraction-situations-with-confidence",
    "lower-primary",
    "Lower Primary",
    2,
    "Describe fraction situations",
    "Identify the whole, the parts, and the fraction language that fits a simple situation.",
  ],
  [
    "Represent and compare fractions with visual models",
    "represent-and-compare-fractions-with-visual-models",
    "middle-primary",
    "Middle Primary",
    1,
    "Visual fraction models",
    "Represent and compare familiar fractions using strips, sets, area models, and number lines.",
  ],
  [
    "Notice equivalent fractions and order familiar amounts",
    "notice-equivalent-fractions-and-order-familiar-amounts",
    "middle-primary",
    "Middle Primary",
    2,
    "Equivalent and ordered fractions",
    "Recognise simple equivalence and order familiar fractions with visual reasoning.",
  ],
  [
    "Connect fractions to tenths and hundredths as decimals",
    "connect-fractions-to-tenths-and-hundredths-as-decimals",
    "upper-primary",
    "Upper Primary",
    1,
    "Fractions and decimals",
    "Connect tenths and hundredths to decimal notation in practical contexts.",
  ],
  [
    "Use fraction-decimal connections in practical comparison",
    "use-fraction-decimal-connections-in-practical-comparison",
    "upper-primary",
    "Upper Primary",
    2,
    "Fraction-decimal comparison",
    "Compare practical quantities by moving between simple fractions and decimals.",
  ],
  [
    "Understand percentages as out-of-100 comparisons",
    "understand-percentages-as-out-of-100-comparisons",
    "lower-secondary",
    "Lower Secondary",
    1,
    "Percentages out of 100",
    "Interpret percentages as out-of-100 comparisons in scores, discounts, and visual models.",
  ],
  [
    "Move flexibly between fractions, decimals, and percentages",
    "move-flexibly-between-fractions-decimals-and-percentages",
    "lower-secondary",
    "Lower Secondary",
    2,
    "Fractions, decimals, and percentages",
    "Match and choose between equivalent fraction, decimal, and percentage representations.",
  ],
];

const RAW_FRACTIONS_CASES: RawFractionsCase[][] = [
  [
    ["Fair share picture", "Which picture shows equal parts?", "Look for pieces that are the same size.", ["Two equal pieces", "One large and one small piece", "Three uneven pieces"], "Two equal pieces", groups("Compare the parts.", [1, 1], ["same size", "same size"]), "equal-parts", "Equal parts", ["counts-pieces-not-equality"]],
    ["Unequal parts", "Which picture is not split fairly?", "Find the picture where one piece is bigger.", ["Two equal halves", "Four equal pieces", "One small and one large piece"], "One small and one large piece", groups("One share is bigger.", [1, 3], ["small", "large"]), "equal-parts", "Equal parts", ["fairness-size-gap"]],
    ["Sharing apples", "Two children share 4 apples equally. How many apples each?", "Deal the apples one at a time to two children.", ["1 each", "2 each", "4 each"], "2 each", groups("Share 4 apples equally.", [2, 2], ["child", "child"]), "fair-sharing", "Fair sharing", ["shares-whole-not-each"]],
    ["Same-size pieces", "A sandwich is cut into 2 same-size pieces. What is true?", "Check whether the two shares match.", ["The pieces are equal", "One piece must be bigger", "There are no parts"], "The pieces are equal", groups("Two matching sandwich pieces.", [1, 1], ["piece", "piece"]), "equal-parts", "Equal parts", ["equal-means-whole-confusion"]],
    ["Different-size pieces", "A cake is cut into 3 pieces, but one is much bigger. Are they equal parts?", "Compare the sizes before choosing.", ["Yes", "No", "Only if there are 3 pieces"], "No", groups("Three pieces, one larger.", [1, 1, 3], ["small", "small", "large"]), "unequal-parts", "Unequal parts", ["piece-count-over-size"]],
    ["Fair plate", "Which plate shows fair shares for two children?", "Find the two groups with the same amount.", ["3 and 3 grapes", "2 and 4 grapes", "1 and 5 grapes"], "3 and 3 grapes", groups("Compare the grape shares.", [3, 3, 2, 4], ["fair", "fair", "not", "not"]), "fair-sharing", "Fair sharing", ["same-total-not-same-share"]],
    ["Folded paper", "Which fold makes equal parts?", "Choose the fold that makes matching sides.", ["Fold down the middle", "Tear one small corner", "Fold a tiny flap"], "Fold down the middle", groups("Two matching folded sides.", [1, 1], ["left", "right"]), "equal-parts", "Equal parts", ["fold-without-equality"]],
    ["Which is fair", "Three children get 2 blocks, 2 blocks, and 2 blocks. Is it fair?", "Compare each share.", ["Fair", "Not fair", "Only two shares are fair"], "Fair", groups("Three equal shares.", [2, 2, 2], ["child", "child", "child"]), "fair-sharing", "Fair sharing", ["misses-all-shares-equal"]],
    ["Whole cut into parts", "A whole shape is split into equal parts. What must be true?", "Think about the size of each part.", ["Each part is the same size", "Each part has a different name", "There must be two parts"], "Each part is the same size", groups("Equal parts of one whole.", [1, 1, 1, 1], ["part", "part", "part", "part"]), "whole-and-parts", "Whole and parts", ["equal-parts-definition-gap"]],
    ["Picture mismatch", "Which picture does not show equal parts?", "Look for the model with uneven shares.", ["Four equal quarters", "Two equal halves", "Three uneven strips"], "Three uneven strips", groups("Uneven strips stand out.", [1, 1, 2], ["strip", "strip", "bigger"]), "unequal-parts", "Unequal parts", ["visual-equality-gap"]],
    ["Fair sharing words", "Which sentence means fair sharing?", "Choose the sentence where everyone gets the same amount.", ["Everyone gets the same amount", "One person gets the biggest amount", "The pieces are different sizes"], "Everyone gets the same amount", groups("Same amount for each person.", [2, 2], ["person", "person"]), "fair-sharing", "Fair sharing", ["fairness-language-gap"]],
    ["Equal parts reason", "Why are equal parts important?", "Think about what makes sharing fair.", ["They make fair shares", "They make one person get more", "They hide the whole"], "They make fair shares", groups("Equal shares are fair.", [3, 3], ["share", "share"]), "reasoning", "Reasoning about equality", ["purpose-of-equal-parts-gap"]],
  ],
  [
    ["Half of a shape", "Which picture shows one half?", "Look for one of two equal parts.", ["One of two equal parts shaded", "One of three equal parts shaded", "Two uneven parts shaded"], "One of two equal parts shaded", groups("One half is one of two equal parts.", [1, 1], ["shaded", "unshaded"]), "halves", "Halves", ["half-as-any-one-piece"]],
    ["Not a half", "Which picture is not a half?", "Check that there are two equal parts.", ["One of two equal parts", "One small part from an uneven split", "One side of a folded square"], "One small part from an uneven split", groups("Uneven pieces are not halves.", [1, 3], ["small", "large"]), "halves", "Halves", ["ignores-equal-parts"]],
    ["Half of 6", "Half of 6 counters is?", "Share 6 counters into two equal groups.", ["2", "3", "6"], "3", groups("Split 6 into two equal shares.", [3, 3], ["half", "half"]), "half-of-set", "Half of a set", ["whole-vs-half-confusion"]],
    ["Two halves", "Two halves make what?", "Put the two equal parts back together.", ["A whole", "A quarter", "A smaller half"], "A whole", groups("Two halves rebuild the whole.", [1, 1], ["half", "half"]), "whole-and-half", "Whole and half", ["halves-do-not-recombine"]],
    ["Half in context", "Which sentence uses half correctly?", "Find the sentence about two equal shares.", ["I shared 8 grapes into 4 and 4", "I shared 8 grapes into 2 and 6", "I kept all 8 grapes"], "I shared 8 grapes into 4 and 4", groups("8 grapes in two equal shares.", [4, 4], ["half", "half"]), "half-context", "Halves in context", ["equal-share-language-gap"]],
    ["Half of 10", "What is half of 10?", "Split 10 into two equal groups.", ["4", "5", "10"], "5", groups("Two equal groups from 10.", [5, 5], ["half", "half"]), "half-of-set", "Half of a set", ["counting-share-slip"]],
    ["Fold for halves", "Which fold shows halves?", "Choose the fold that makes two equal parts.", ["A middle fold", "A tiny corner fold", "Three equal folds"], "A middle fold", groups("Middle fold makes two halves.", [1, 1], ["half", "half"]), "half-models", "Half models", ["fold-count-confusion"]],
    ["Half on number track", "Which number is halfway from 0 to 10?", "Find the middle number.", ["4", "5", "6"], "5", numbers("Halfway between 0 and 10.", [0, 5, 10]), "halfway", "Halfway points", ["midpoint-off-by-one"]],
    ["Half of a collection", "Which group shows half of 8 stars?", "Find the group with 4 stars.", ["2 stars", "4 stars", "8 stars"], "4 stars", groups("Half of 8 is 4.", [4, 4], ["chosen half", "other half"]), "half-of-set", "Half of a set", ["selects-whole"]],
    ["Which matches half", "Which picture matches half of a pizza?", "Look for exactly one of two equal slices.", ["1 of 2 equal slices", "1 of 4 equal slices", "2 of 3 slices"], "1 of 2 equal slices", groups("Pizza in two equal slices.", [1, 1], ["chosen", "rest"]), "half-models", "Half models", ["denominator-gap"]],
    ["Half and whole", "If one half is shaded, how much is unshaded?", "There are two equal parts altogether.", ["One half", "One quarter", "The whole"], "One half", groups("One half shaded, one half unshaded.", [1, 1], ["shaded", "unshaded"]), "whole-and-half", "Whole and half", ["remaining-part-gap"]],
    ["Reason about half", "Which must be true for a part to be one half?", "Think about equal parts.", ["The whole has two equal parts", "The whole has any two parts", "The part is the biggest piece"], "The whole has two equal parts", groups("Two equal parts of one whole.", [1, 1], ["half", "half"]), "reasoning", "Reasoning about halves", ["half-definition-gap"]],
  ],
  [
    ["Quarter picture", "Which picture shows one quarter?", "Look for one of four equal parts.", ["1 of 4 equal parts", "1 of 2 equal parts", "1 of 3 uneven parts"], "1 of 4 equal parts", groups("Four equal parts.", [1, 1, 1, 1], ["shaded", "part", "part", "part"]), "quarters", "Quarters", ["quarter-as-any-four-pieces"]],
    ["Half or quarter", "Which is larger: one half or one quarter of the same whole?", "Compare the size of each equal part.", ["One half", "One quarter", "They are the same"], "One half", groups("Compare half and quarter.", [2, 1], ["half", "quarter"]), "compare-simple", "Compare simple fractions", ["larger-denominator-larger-part"]],
    ["Quarter of 8", "One quarter of 8 counters is?", "Share 8 counters into four equal groups.", ["2", "4", "8"], "2", groups("8 split into four equal shares.", [2, 2, 2, 2], ["1/4", "1/4", "1/4", "1/4"]), "fraction-of-set", "Fraction of a set", ["divides-by-numerator"]],
    ["Three quarters", "Which picture shows three quarters shaded?", "Look for 3 of 4 equal parts shaded.", ["3 of 4 equal parts", "1 of 4 equal parts", "3 uneven parts"], "3 of 4 equal parts", groups("Three quarters shaded.", [1, 1, 1, 1], ["shaded", "shaded", "shaded", "unshaded"]), "quarters", "Quarters", ["numerator-denominator-confusion"]],
    ["Practical half", "A recipe uses half a cup. Which model matches?", "Choose one of two equal cup parts.", ["1/2 cup", "1/4 cup", "2 whole cups"], "1/2 cup", groups("Cup split into two equal parts.", [1, 1], ["use", "leave"]), "practical-fractions", "Practical fractions", ["context-fraction-link-gap"]],
    ["Practical quarter", "Which measure is one quarter of a cup?", "Choose one of four equal cup parts.", ["1/4 cup", "1/2 cup", "1 whole cup"], "1/4 cup", groups("Cup split into four equal parts.", [1, 1, 1, 1], ["use", "part", "part", "part"]), "practical-fractions", "Practical fractions", ["quarter-measure-gap"]],
    ["Fraction name", "What fraction is 1 shaded part out of 3 equal parts?", "Use shaded parts over total equal parts.", ["1/3", "1/2", "3/1"], "1/3", groups("One shaded out of three.", [1, 1, 1], ["shaded", "part", "part"]), "fraction-names", "Fraction names", ["reverses-numerator-denominator"]],
    ["Two quarters", "Two quarters of the same whole is the same as?", "Put two quarter parts together.", ["One half", "One third", "One whole"], "One half", groups("Two quarters make half.", [1, 1, 1, 1], ["use", "use", "rest", "rest"]), "simple-equivalence", "Simple equivalence", ["two-quarters-gap"]],
    ["Share 12", "One quarter of 12 is?", "Split 12 into four equal groups.", ["3", "4", "6"], "3", groups("12 split into four equal shares.", [3, 3, 3, 3], ["1/4", "1/4", "1/4", "1/4"]), "fraction-of-set", "Fraction of a set", ["shares-into-two"]],
    ["Which shows whole", "Which model shows four quarters making one whole?", "Find all four equal quarter parts together.", ["1/4 + 1/4 + 1/4 + 1/4", "1/2 + 1/4", "1/3 + 1/3"], "1/4 + 1/4 + 1/4 + 1/4", groups("Four quarters fill the whole.", [1, 1, 1, 1], ["1/4", "1/4", "1/4", "1/4"]), "whole-and-parts", "Whole and parts", ["quarters-not-whole"]],
    ["Set fraction", "There are 6 counters. 3 are blue. What fraction is blue?", "Count blue over total counters.", ["3/6", "6/3", "1/6"], "3/6", groups("3 blue out of 6.", [3, 3], ["blue", "not blue"]), "fraction-of-set", "Fraction of a set", ["part-total-reversal"]],
    ["Which task uses quarters", "Which task is about quarters?", "Find the task with four equal parts.", ["Fold a paper into 4 equal parts", "Fold a paper into 2 equal parts", "Cut one tiny piece off"], "Fold a paper into 4 equal parts", groups("Four equal folds.", [1, 1, 1, 1], ["part", "part", "part", "part"]), "practical-fractions", "Practical fractions", ["quarter-definition-gap"]],
  ],
  [
    ["Find the whole", "In 2 out of 5 counters shaded, what is the whole?", "The whole is the full set.", ["5 counters", "2 counters", "3 counters"], "5 counters", groups("2 shaded out of 5 counters.", [2, 3], ["shaded", "not shaded"]), "whole-part-language", "Whole and part", ["part-as-whole"]],
    ["Match sentence", "Which sentence matches 3/4 of a shape shaded?", "Use shaded parts and total equal parts.", ["3 of 4 equal parts are shaded", "4 of 3 parts are shaded", "3 parts are unequal"], "3 of 4 equal parts are shaded", groups("Three of four parts shaded.", [1, 1, 1, 1], ["shade", "shade", "shade", "clear"]), "fraction-language", "Fraction language", ["language-order-gap"]],
    ["Name fraction", "A strip has 2 shaded parts out of 3 equal parts. Which fraction matches?", "Put shaded parts over total equal parts.", ["2/3", "3/2", "1/3"], "2/3", groups("2 shaded from 3 equal parts.", [1, 1, 1], ["shade", "shade", "clear"]), "fraction-names", "Fraction names", ["numerator-denominator-reversal"]],
    ["Describe set", "4 of 8 counters are red. Which description fits?", "Count the red part and the whole set.", ["4/8 are red", "8/4 are red", "4/4 are red"], "4/8 are red", groups("4 red out of 8.", [4, 4], ["red", "other"]), "set-fractions", "Set fractions", ["whole-set-gap"]],
    ["Whole changes", "Which fraction names 1 shaded part out of 4 equal parts?", "Use the total equal parts in this model.", ["1/4", "1/2", "4/1"], "1/4", groups("One shaded from four.", [1, 1, 1, 1], ["shade", "part", "part", "part"]), "whole-part-language", "Whole and part", ["uses-old-whole"]],
    ["Explain half", "Which explanation fits 1/2?", "Choose the explanation about one of two equal parts.", ["One of two equal parts", "Two of one part", "One of any two pieces"], "One of two equal parts", groups("Two equal parts.", [1, 1], ["one half", "one half"]), "fraction-language", "Fraction language", ["equal-word-omitted"]],
    ["Picture and words", "Which words match the picture: 2 shaded out of 4 equal parts?", "Match the shaded count and the total parts.", ["two quarters", "two halves", "four halves"], "two quarters", groups("2 of 4 equal parts shaded.", [1, 1, 1, 1], ["shade", "shade", "clear", "clear"]), "match-model", "Match model and words", ["uses-shaded-only"]],
    ["Missing words", "A fraction describes part of a __.", "Think about what the part belongs to.", ["whole", "symbol", "mistake"], "whole", groups("Part belongs to a whole.", [1, 3], ["part", "rest of whole"]), "whole-part-language", "Whole and part", ["whole-concept-gap"]],
    ["Context card", "A class has 6 learners. 2 wear hats. What fraction wear hats?", "Use hats over the whole class.", ["2/6", "6/2", "4/6"], "2/6", groups("2 hats out of 6 learners.", [2, 4], ["hats", "no hats"]), "set-fractions", "Set fractions", ["part-complement-confusion"]],
    ["Same whole", "Why must the whole be clear?", "Choose the reason that helps fractions make sense.", ["Fractions describe parts of a whole", "Fractions ignore the whole", "The whole is always 10"], "Fractions describe parts of a whole", groups("Different wholes change the fraction.", [2, 4], ["part", "whole"]), "reasoning", "Reasoning about wholes", ["whole-not-identified"]],
    ["Correct label", "Which label fits 3 shaded parts out of 5 equal parts?", "Count shaded parts, then count all equal parts.", ["3/5", "5/3", "2/5"], "3/5", groups("3 shaded from 5.", [3, 2], ["shaded", "clear"]), "fraction-names", "Fraction names", ["counts-unshaded-as-numerator"]],
    ["Confident description", "Which description is clearest?", "Choose the sentence that says the part and the whole.", ["2 of the 6 counters are shaded", "Some counters are shaded", "There are counters"], "2 of the 6 counters are shaded", groups("Clear part-whole description.", [2, 4], ["shaded", "unshaded"]), "fraction-language", "Fraction language", ["vague-description"]],
  ],
  [
    ["Compare strips", "Which fraction is larger: 1/2 or 1/4?", "Use the same whole and compare the strip sizes.", ["1/2", "1/4", "They are equal"], "1/2", groups("Same whole split into halves and quarters.", [2, 1], ["1/2", "1/4"]), "compare-fractions", "Compare fractions", ["larger-denominator-means-larger"]],
    ["Match model", "Which fraction matches 3 shaded parts out of 4?", "Count shaded parts over total equal parts.", ["3/4", "1/4", "4/3"], "3/4", groups("3 of 4 equal parts shaded.", [1, 1, 1, 1], ["shade", "shade", "shade", "clear"]), "represent-fractions", "Represent fractions", ["reverses-fraction"]],
    ["Number line half", "Where is 1/2 on the number line from 0 to 1?", "Find the middle point.", ["At the middle", "At 0", "At 1"], "At the middle", numbers("0 to 1 with half between.", [0, "1/2", 1]), "number-lines", "Number lines", ["halfway-location-gap"]],
    ["Set model", "Which set shows 2/3 shaded?", "Look for 2 shaded out of 3 equal objects.", ["2 shaded, 1 unshaded", "1 shaded, 2 unshaded", "3 shaded, 2 unshaded"], "2 shaded, 1 unshaded", groups("2 of 3 objects shaded.", [2, 1], ["shaded", "clear"]), "represent-fractions", "Represent fractions", ["part-whole-count-gap"]],
    ["Compare thirds", "Which is larger: 2/3 or 1/3?", "The whole is split into the same number of parts.", ["2/3", "1/3", "They are equal"], "2/3", groups("Same thirds, different shaded counts.", [2, 1], ["2 thirds", "1 third"]), "compare-fractions", "Compare fractions", ["ignores-numerator"]],
    ["Compare same numerator", "Which is larger: 1/3 or 1/6?", "One third is a bigger part than one sixth.", ["1/3", "1/6", "They are equal"], "1/3", groups("Compare unit fraction sizes.", [2, 1], ["1/3", "1/6"]), "compare-fractions", "Compare fractions", ["denominator-size-error"]],
    ["Area model", "A rectangle has 5 equal columns and 2 are shaded. Which fraction?", "Use shaded columns over total columns.", ["2/5", "5/2", "3/5"], "2/5", groups("2 shaded columns out of 5.", [2, 3], ["shaded", "clear"]), "area-models", "Area models", ["complement-as-answer"]],
    ["Number line quarters", "Which point shows 3/4?", "Find the third quarter mark between 0 and 1.", ["Third mark after 0", "First mark after 0", "The middle mark"], "Third mark after 0", numbers("Quarter marks from 0 to 1.", [0, "1/4", "1/2", "3/4", 1]), "number-lines", "Number lines", ["quarter-mark-count-error"]],
    ["Choose helpful model", "Which model helps compare 2/4 and 3/4?", "Use equal fourths for both fractions.", ["Two strips split into fourths", "One strip in halves and one in thirds", "A list of whole numbers"], "Two strips split into fourths", groups("Both strips use fourths.", [2, 3], ["2/4", "3/4"]), "model-choice", "Model choice", ["different-wholes-confusion"]],
    ["Compare quarters", "Which fraction is smaller: 1/4 or 3/4?", "Same whole, same fourths, fewer shaded parts.", ["1/4", "3/4", "They are equal"], "1/4", groups("Compare shaded fourths.", [1, 3], ["1/4", "3/4"]), "compare-fractions", "Compare fractions", ["more-shaded-confusion"]],
    ["Fraction wall", "Which pair uses the same whole?", "Choose models with matching whole length.", ["Two equal-length strips", "One short strip and one long strip", "Two unrelated sets"], "Two equal-length strips", groups("Same whole length matters.", [4, 4], ["strip A", "strip B"]), "whole-consistency", "Same whole", ["different-wholes-compared"]],
    ["Model reason", "Which answer is reasonable for 4/4?", "Four fourths fill the whole.", ["One whole", "One half", "One quarter"], "One whole", groups("4 of 4 parts filled.", [1, 1, 1, 1], ["fill", "fill", "fill", "fill"]), "area-models", "Area models", ["whole-from-parts-gap"]],
  ],
  [
    ["Equivalent halves", "Which fraction is equivalent to 1/2?", "Use a model where the same amount is shaded.", ["2/4", "1/4", "3/4"], "2/4", groups("Half and two quarters match.", [2, 2], ["shaded", "unshaded"]), "equivalence", "Equivalent fractions", ["equivalent-means-same-symbol"]],
    ["Order familiar", "Which order goes from smallest to largest?", "Compare the same whole.", ["1/4, 1/2, 3/4", "3/4, 1/2, 1/4", "1/2, 1/4, 3/4"], "1/4, 1/2, 3/4", numbers("Order on a number line.", [0, "1/4", "1/2", "3/4", 1]), "ordering", "Order fractions", ["order-direction-error"]],
    ["Equivalent quarters", "Which is the same amount as 2/4?", "Two quarters cover half the whole.", ["1/2", "1/4", "3/4"], "1/2", groups("2 quarters make 1 half.", [2, 2], ["2/4", "rest"]), "equivalence", "Equivalent fractions", ["two-quarters-not-half"]],
    ["Larger familiar", "Which is larger: 3/4 or 2/4?", "Same denominator, more shaded parts.", ["3/4", "2/4", "They are equal"], "3/4", groups("Compare fourths.", [3, 2], ["3/4", "2/4"]), "compare-order", "Compare and order", ["same-denominator-gap"]],
    ["Equivalent third pair", "Which pair shows the same amount?", "Look for matching shaded length.", ["1/2 and 2/4", "1/3 and 1/4", "3/4 and 1/4"], "1/2 and 2/4", groups("Equal shaded amounts.", [2, 2], ["2/4 shaded", "2/4 unshaded"]), "equivalence", "Equivalent fractions", ["visual-equivalence-gap"]],
    ["Not equivalent", "Which fraction is not equivalent to 1/2?", "Compare each amount to half.", ["2/4", "3/6", "3/4"], "3/4", groups("Three quarters is more than half.", [3, 1], ["3/4", "rest"]), "equivalence", "Equivalent fractions", ["all-even-fractions-equivalent"]],
    ["Place on line", "Which fraction belongs between 1/2 and 1?", "Find a value greater than half but less than one.", ["3/4", "1/4", "4/4"], "3/4", numbers("Between half and one.", [0, "1/2", "3/4", 1]), "ordering", "Order fractions", ["benchmark-gap"]],
    ["Same-size whole", "Why can 2/4 and 1/2 be equal?", "Think about the shaded amount of the same whole.", ["They cover the same amount", "They use the same numbers", "They have different wholes"], "They cover the same amount", groups("Same amount, different names.", [2, 2], ["shaded", "unshaded"]), "reasoning", "Reasoning about equivalence", ["symbol-only-thinking"]],
    ["Order thirds", "Which order is correct?", "With thirds, more thirds means a larger amount.", ["1/3, 2/3, 3/3", "3/3, 2/3, 1/3", "2/3, 1/3, 3/3"], "1/3, 2/3, 3/3", numbers("Thirds from 0 to 1.", [0, "1/3", "2/3", "3/3"]), "ordering", "Order fractions", ["thirds-order-error"]],
    ["Whole equivalence", "Which fraction equals one whole?", "All equal parts are shaded.", ["4/4", "3/4", "1/4"], "4/4", groups("Four of four parts filled.", [1, 1, 1, 1], ["shade", "shade", "shade", "shade"]), "equivalence", "Equivalent fractions", ["whole-fraction-gap"]],
    ["Compare benchmarks", "Which fraction is closest to 1?", "Use the benchmark line.", ["3/4", "1/4", "1/2"], "3/4", numbers("Benchmark fractions.", [0, "1/4", "1/2", "3/4", 1]), "compare-order", "Compare and order", ["benchmark-location-gap"]],
    ["Equivalent model", "Which model matches 3/6?", "Simplify the shaded amount with the picture.", ["One half shaded", "One third shaded", "One whole shaded"], "One half shaded", groups("3 out of 6 shaded.", [3, 3], ["shaded", "clear"]), "equivalence", "Equivalent fractions", ["does-not-see-half-in-sixths"]],
  ],
  [
    ["Tenths decimal", "Which decimal matches 3/10?", "Read three tenths as a decimal.", ["0.3", "0.03", "3.0"], "0.3", numbers("Three tenths.", ["3/10", "0.3"]), "tenths", "Tenths as decimals", ["tenths-hundredths-confusion"]],
    ["Hundredths decimal", "Which decimal matches 25/100?", "Read twenty-five hundredths.", ["0.25", "2.5", "0.025"], "0.25", groups("25 shaded out of 100.", [25, 75], ["shaded", "unshaded"]), "hundredths", "Hundredths as decimals", ["place-value-digit-shift"]],
    ["Decimal to fraction", "0.7 is the same as?", "Read the 7 in the tenths place.", ["7/10", "7/100", "70/10"], "7/10", numbers("0.7 means seven tenths.", ["0.7", "7/10"]), "tenths", "Tenths as decimals", ["decimal-as-whole-number"]],
    ["Money decimal", "Which amount is 0.50 dollars?", "Think about hundredths of a dollar.", ["50 cents", "5 cents", "500 cents"], "50 cents", groups("50 cents out of 100 cents.", [50, 50], ["50c", "rest"]), "money-context", "Money and decimals", ["money-place-value-gap"]],
    ["Hundredths grid", "Which decimal matches 8 shaded squares out of 100?", "Eight hundredths has a zero in the tenths place.", ["0.08", "0.8", "8.00"], "0.08", groups("8 shaded out of 100.", [8, 92], ["shaded", "clear"]), "hundredths", "Hundredths as decimals", ["missing-zero-placeholder"]],
    ["Tenth count", "A strip has 6 of 10 parts shaded. Which decimal?", "Use tenths.", ["0.6", "0.06", "6.10"], "0.6", groups("6 tenths shaded.", [6, 4], ["shaded", "clear"]), "tenths", "Tenths as decimals", ["tenths-hundredths-confusion"]],
    ["Fraction link", "Which fraction matches 0.4?", "The 4 is in the tenths place.", ["4/10", "4/100", "1/4"], "4/10", numbers("Four tenths.", ["0.4", "4/10"]), "fraction-decimal-link", "Fraction-decimal links", ["decimal-fraction-link-gap"]],
    ["Decimal place value", "In 0.32, the 3 means?", "Look at the tenths place.", ["3 tenths", "3 hundredths", "3 wholes"], "3 tenths", numbers("0.32 has 3 tenths and 2 hundredths.", ["0.32", "3 tenths", "2 hundredths"]), "place-value", "Decimal place value", ["digit-place-confusion"]],
    ["Hundredth place", "In 0.32, the 2 means?", "Look at the hundredths place.", ["2 hundredths", "2 tenths", "2 wholes"], "2 hundredths", numbers("0.32 place-value table.", ["0", ".", "3 tenths", "2 hundredths"]), "place-value", "Decimal place value", ["hundredths-place-gap"]],
    ["Quarter decimal", "Which decimal is the same as 1/4?", "One quarter of 100 is 25.", ["0.25", "0.4", "1.4"], "0.25", groups("One quarter of a hundred grid.", [25, 75], ["1/4", "rest"]), "fraction-decimal-link", "Fraction-decimal links", ["quarter-decimal-gap"]],
    ["Half decimal", "Which decimal is the same as 1/2?", "Half of 10 tenths is 5 tenths.", ["0.5", "0.2", "1.2"], "0.5", groups("Half of the strip shaded.", [5, 5], ["0.5", "rest"]), "fraction-decimal-link", "Fraction-decimal links", ["half-decimal-gap"]],
    ["Whole decimal", "Which decimal is the same as 100/100?", "All hundred parts make one whole.", ["1.00", "0.10", "0.01"], "1.00", groups("100 out of 100 shaded.", [100], ["whole"]), "hundredths", "Hundredths as decimals", ["whole-hundredths-gap"]],
  ],
  [
    ["Compare decimals", "Which is larger: 0.6 or 0.4?", "Compare tenths.", ["0.6", "0.4", "They are equal"], "0.6", numbers("Six tenths and four tenths.", ["0.4", "0.6"]), "decimal-comparison", "Compare decimals", ["decimal-whole-number-thinking"]],
    ["Fraction decimal match", "Which decimal matches 1/2?", "Use the half benchmark.", ["0.5", "0.2", "1.2"], "0.5", groups("Half is five tenths.", [5, 5], ["half", "rest"]), "fraction-decimal-link", "Fraction-decimal links", ["half-as-point-two"]],
    ["Money compare", "Which amount is more: $0.75 or $0.50?", "Compare the cents.", ["$0.75", "$0.50", "They are equal"], "$0.75", numbers("Compare cents.", ["50c", "75c"]), "money-context", "Money and decimals", ["decimal-length-confusion"]],
    ["Choose useful form", "Which form helps compare 1/4 and 0.30?", "Change 1/4 to 0.25.", ["0.25 and 0.30", "1/4 and 30", "25 and 0.30"], "0.25 and 0.30", numbers("Use decimals to compare.", ["1/4", "0.25", "0.30"]), "representation-choice", "Choose a representation", ["conversion-choice-gap"]],
    ["Compare fraction decimal", "Which is larger: 1/2 or 0.4?", "Use 1/2 = 0.5.", ["1/2", "0.4", "They are equal"], "1/2", numbers("Compare 0.5 and 0.4.", ["1/2", "0.5", "0.4"]), "fraction-decimal-comparison", "Fraction-decimal comparison", ["benchmark-gap"]],
    ["Measurement compare", "Which length is longer: 0.8 m or 0.65 m?", "Compare tenths first.", ["0.8 m", "0.65 m", "They are equal"], "0.8 m", numbers("0.8 is 0.80.", ["0.65", "0.80"]), "measurement-context", "Measurement context", ["more-digits-larger-error"]],
    ["Same amount", "Which amount is the same as 0.25?", "Use the quarter benchmark.", ["1/4", "1/2", "3/4"], "1/4", groups("25 hundredths is one quarter.", [25, 75], ["0.25", "rest"]), "equivalent-forms", "Equivalent forms", ["quarter-link-gap"]],
    ["Decimal order", "Which order is smallest to largest?", "Compare as hundredths.", ["0.2, 0.5, 0.75", "0.75, 0.5, 0.2", "0.5, 0.2, 0.75"], "0.2, 0.5, 0.75", numbers("Order on a decimal line.", [0, "0.2", "0.5", "0.75", 1]), "decimal-comparison", "Compare decimals", ["order-direction-error"]],
    ["Which is reasonable", "A snack costs $0.90. Is it more or less than half a dollar?", "Half a dollar is $0.50.", ["More", "Less", "The same"], "More", numbers("Compare $0.90 with $0.50.", ["$0.50", "$0.90"]), "money-context", "Money and decimals", ["money-benchmark-gap"]],
    ["Fraction benchmark", "Which decimal is closest to 1?", "Look at the benchmark number line.", ["0.9", "0.4", "0.1"], "0.9", numbers("Decimals between 0 and 1.", [0, "0.1", "0.4", "0.9", 1]), "decimal-comparison", "Compare decimals", ["benchmark-location-gap"]],
    ["Practical choice", "Which is easier for money: 3/4 dollar or 0.75 dollars?", "Choose the form usually used with cents.", ["0.75 dollars", "3/4 dollar", "They cannot match"], "0.75 dollars", groups("75 cents is three quarters of a dollar.", [75, 25], ["75c", "rest"]), "representation-choice", "Choose a representation", ["context-representation-gap"]],
    ["Equal decimal", "Which decimal is equal to 0.5?", "Write five tenths as hundredths.", ["0.50", "0.05", "5.0"], "0.50", groups("50 hundredths is five tenths.", [50, 50], ["0.50", "rest"]), "equivalent-forms", "Equivalent forms", ["trailing-zero-gap"]],
  ],
  [
    ["Percent meaning", "What does 25% mean?", "Read percent as out of 100.", ["25 out of 100", "25 out of 10", "100 out of 25"], "25 out of 100", groups("25 out of 100 shaded.", [25, 75], ["25%", "rest"]), "percent-meaning", "Percent meaning", ["percent-denominator-gap"]],
    ["Half percent", "Which percentage matches one half?", "Half of 100 is 50.", ["50%", "25%", "10%"], "50%", groups("Half of the hundred grid.", [50, 50], ["50%", "rest"]), "benchmark-percent", "Benchmark percentages", ["half-percent-gap"]],
    ["Quarter percent", "Which percentage matches one quarter?", "One quarter of 100 is 25.", ["25%", "50%", "75%"], "25%", groups("Quarter of a hundred grid.", [25, 75], ["25%", "rest"]), "benchmark-percent", "Benchmark percentages", ["quarter-percent-gap"]],
    ["Score context", "A quiz score is 80%. What does that mean?", "Use out-of-100 thinking.", ["80 out of 100", "8 out of 100", "80 out of 10"], "80 out of 100", groups("80 correct out of 100.", [80, 20], ["correct", "not correct"]), "percent-context", "Percent contexts", ["score-scale-confusion"]],
    ["Discount context", "A sign says 10% off. Which model matches?", "Ten percent is ten out of a hundred.", ["10 out of 100", "10 out of 10", "1 out of 100"], "10 out of 100", groups("10% discount part.", [10, 90], ["off", "still price"]), "percent-context", "Percent contexts", ["discount-percent-gap"]],
    ["Hundred grid", "Which picture shows 60% shaded?", "Look for 60 out of 100 shaded.", ["60 shaded, 40 unshaded", "6 shaded, 94 unshaded", "40 shaded, 60 unshaded"], "60 shaded, 40 unshaded", groups("60 out of 100.", [60, 40], ["shaded", "clear"]), "percent-models", "Percent models", ["complement-confusion"]],
    ["Percent to decimal", "Which decimal matches 75%?", "75% means 75 hundredths.", ["0.75", "7.5", "0.075"], "0.75", numbers("75 percent is 75 hundredths.", ["75%", "0.75"]), "percent-decimal-link", "Percent-decimal links", ["percent-decimal-place-error"]],
    ["Percent to fraction", "Which fraction matches 20%?", "Use out of 100.", ["20/100", "20/10", "100/20"], "20/100", groups("20 out of 100.", [20, 80], ["20%", "rest"]), "percent-fraction-link", "Percent-fraction links", ["fraction-order-error"]],
    ["Full percent", "Which percentage means the whole grid is shaded?", "All 100 out of 100 are shaded.", ["100%", "50%", "10%"], "100%", groups("Whole grid shaded.", [100], ["100%"]), "benchmark-percent", "Benchmark percentages", ["whole-percent-gap"]],
    ["Small percent", "Which is less: 30% or 70%?", "Compare out of 100.", ["30%", "70%", "They are equal"], "30%", groups("Compare 30 and 70 out of 100.", [30, 70], ["30%", "70%"]), "percent-comparison", "Compare percentages", ["larger-smaller-gap"]],
    ["Same amount", "Which amount is the same as 50%?", "Use the half benchmark.", ["1/2", "1/4", "1/5"], "1/2", groups("50% is half.", [50, 50], ["50%", "rest"]), "percent-fraction-link", "Percent-fraction links", ["benchmark-link-gap"]],
    ["Reasonable percent", "A learner says 120% of a test is less than the whole test. What should they notice?", "Compare 120% with 100%.", ["120% is more than a whole", "120% is half", "120% is always zero"], "120% is more than a whole", numbers("100% is one whole; 120% is more.", ["100%", "120%"]), "percent-reasoning", "Percent reasoning", ["over-100-percent-gap"]],
  ],
  [
    ["Match forms", "Which set shows the same amount?", "Use the half benchmark.", ["1/2, 0.5, 50%", "1/2, 0.2, 20%", "1/4, 0.5, 25%"], "1/2, 0.5, 50%", groups("Half in three forms.", [50, 50], ["50%", "rest"]), "equivalent-forms", "Equivalent forms", ["benchmark-match-gap"]],
    ["Quarter forms", "Which matches 25%?", "Use one quarter of 100.", ["1/4 and 0.25", "1/2 and 0.25", "3/4 and 0.25"], "1/4 and 0.25", groups("25 out of 100.", [25, 75], ["25%", "rest"]), "equivalent-forms", "Equivalent forms", ["quarter-form-gap"]],
    ["Decimal percent", "0.75 is the same as?", "Read 0.75 as 75 hundredths.", ["75%", "7.5%", "0.75%"], "75%", numbers("0.75 equals 75%.", ["0.75", "75%"]), "decimal-percent-link", "Decimal-percent links", ["decimal-percent-scale-error"]],
    ["Fraction decimal", "3/4 is the same as?", "Use the familiar quarter benchmark.", ["0.75", "0.34", "3.4"], "0.75", groups("Three quarters shaded.", [75, 25], ["0.75", "rest"]), "fraction-decimal-link", "Fraction-decimal links", ["three-quarter-decimal-gap"]],
    ["Choose comparison form", "Which form helps compare 40% and 1/2?", "Change 1/2 to 50%.", ["40% and 50%", "40 and 1/2", "0.40 and 50"], "40% and 50%", numbers("Use percent benchmarks.", ["40%", "1/2", "50%"]), "representation-choice", "Choose a representation", ["comparison-form-gap"]],
    ["Which is larger", "Which is larger: 0.6 or 50%?", "Change 50% to 0.5.", ["0.6", "50%", "They are equal"], "0.6", numbers("Compare 0.6 and 0.5.", ["50%", "0.5", "0.6"]), "compare-forms", "Compare forms", ["mixed-form-comparison-gap"]],
    ["Same as 10%", "Which decimal is the same as 10%?", "10% is 10 hundredths.", ["0.10", "1.0", "0.01"], "0.10", groups("10 out of 100.", [10, 90], ["10%", "rest"]), "decimal-percent-link", "Decimal-percent links", ["ten-percent-decimal-gap"]],
    ["Order forms", "Which order is smallest to largest?", "Convert to decimals or percentages.", ["25%, 0.5, 3/4", "3/4, 0.5, 25%", "0.5, 25%, 3/4"], "25%, 0.5, 3/4", numbers("Order 0.25, 0.5, 0.75.", ["25%", "0.5", "3/4"]), "order-forms", "Order forms", ["mixed-order-error"]],
    ["Practical score", "A score is 18 out of 20. Which percentage matches?", "18 out of 20 is 90 out of 100.", ["90%", "80%", "18%"], "90%", groups("Scale 18/20 to 90/100.", [90, 10], ["correct", "missed"]), "percent-context", "Percent contexts", ["scale-to-100-gap"]],
    ["Money form", "Which form is most useful for 75 cents?", "Money usually uses decimals.", ["$0.75", "75%", "3/4 of every amount"], "$0.75", groups("75 cents out of one dollar.", [75, 25], ["75c", "rest"]), "representation-choice", "Choose a representation", ["context-choice-gap"]],
    ["Equivalent pair", "Which pair is equivalent?", "Use known benchmark links.", ["0.2 and 20%", "0.2 and 2%", "2.0 and 20%"], "0.2 and 20%", numbers("0.2 is 20 hundredths.", ["0.2", "20%"]), "equivalent-forms", "Equivalent forms", ["decimal-percent-shift"]],
    ["Reasonable conversion", "A learner says 1/2 = 5%. What should they notice?", "Use the half benchmark.", ["1/2 is 50%", "1/2 is 5%", "1/2 is 0.05%"], "1/2 is 50%", groups("Half of 100 is 50.", [50, 50], ["50%", "rest"]), "reasoning", "Reasoning about forms", ["half-percent-place-error"]],
  ],
];

const FRACTIONS_CASES: FractionsCase[][] = RAW_FRACTIONS_CASES.map((cases) =>
  cases.map(makeCase),
);

export const FRACTIONS_DECIMALS_PERCENTAGES_STEP_SPECS: FractionsDecimalsPercentagesStepSpec[] =
  FRACTIONS_STEP_TITLES.map(
    ([title, stepKey, stageKey, stageTitle, stepNumber, shortTitle, description], index) => ({
      order: index + 1,
      stepNumber,
      stageKey,
      stageTitle,
      stepKey,
      pathwayStepId: `mathematics::fractions-decimals-percentages::${stageKey}::${stepKey}`,
      title,
      shortTitle,
      description,
      cases: FRACTIONS_CASES[index],
    }),
  );

export const FRACTIONS_DECIMALS_PERCENTAGES_STEP_ASSESSMENTS:
  FractionsDecimalsPercentagesStepAssessment[] =
  FRACTIONS_DECIMALS_PERCENTAGES_STEP_SPECS.map((spec) => ({
    key: `fractions-decimals-percentages-step-${spec.order}-${spec.stepKey}-assessment-v1`,
    stepNumber: spec.stepNumber,
    stepKey: spec.stepKey,
    pathwayStepId: spec.pathwayStepId,
    title: spec.title,
    shortTitle: spec.shortTitle,
    description: spec.description,
    subjectKey: "mathematics",
    strandKey: FRACTIONS_DECIMALS_PERCENTAGES_STRAND_KEY,
    stageKey: spec.stageKey,
    parentBankKey: FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_KEY,
    parentBankTitle: FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_TITLE,
    parentItemBankKey: FRACTIONS_DECIMALS_PERCENTAGES_ITEM_BANK_KEY,
    progressionBandKey: FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_KEY,
    sourceRoute: FRACTIONS_DECIMALS_PERCENTAGES_SOURCE_ROUTE,
    depthOptions: NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
    items: spec.cases.map((item, index) => makeItem(spec, item, index)),
  }));

export function getFractionsDecimalsPercentagesStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
) {
  const stepAssessmentKey = safe(context.stepAssessmentKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    FRACTIONS_DECIMALS_PERCENTAGES_STEP_ASSESSMENTS.find(
      (assessment) =>
        (stepAssessmentKey && assessment.key === stepAssessmentKey) ||
        (pathwayStepId && assessment.pathwayStepId === pathwayStepId) ||
        (stepKey && assessment.stepKey === stepKey),
    ) || null
  );
}

export function getFractionsDecimalsPercentagesStepAssessmentItemsForDepth(
  assessmentKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const assessment =
    FRACTIONS_DECIMALS_PERCENTAGES_STEP_ASSESSMENTS.find(
      (candidate) => candidate.key === assessmentKey,
    ) || null;

  if (!assessment) return [];

  return assessment.items.slice(0, getNumberStepAssessmentDepthItemCount(depth));
}
