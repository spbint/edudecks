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
  [
    "Use proportional reasoning in scale, rates, and financial contexts",
    "use-proportional-reasoning-in-scale-rates-and-financial-contexts",
    "years-9-10-consolidation",
    "Years 9-10 / consolidation",
    1,
    "Proportional reasoning",
    "Use proportional relationships in scale, rates, unit pricing, and financial percentage contexts.",
  ],
  [
    "Interpret proportional information in data and real decisions",
    "interpret-proportional-information-in-data-and-real-decisions",
    "years-9-10-consolidation",
    "Years 9-10 / consolidation",
    2,
    "Proportional interpretation",
    "Interpret percentages, rates, and comparisons in data-based and practical decision contexts.",
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
    ["Find the half apple", "Section 1 - Find the Half: Which picture shows half an apple?", "Choose the apple cut into two same-size pieces, with one piece shown.", ["One of two equal apple pieces", "A tiny apple bite", "A whole apple"], "One of two equal apple pieces", groups("Half an apple means one of two equal apple pieces.", [1, 1], ["chosen half", "other half"]), "find-the-half", "Find the half", ["half-as-any-piece"]],
    ["Find the half sandwich", "Section 1 - Find the Half: Which sandwich picture shows half?", "Look for the sandwich shared into two equal parts.", ["One of two equal sandwich pieces", "One small corner piece", "Three uneven sandwich pieces"], "One of two equal sandwich pieces", groups("A sandwich cut fairly into two equal pieces.", [1, 1], ["half", "half"]), "find-the-half", "Find the half", ["ignores-equal-size"]],
    ["Find the half pizza", "Section 1 - Find the Half: Which pizza picture shows one half?", "Pick exactly one of two equal pizza slices.", ["1 of 2 equal pizza slices", "1 of 4 pizza slices", "2 uneven pizza pieces"], "1 of 2 equal pizza slices", groups("Pizza split into two equal slices.", [1, 1], ["chosen", "rest"]), "find-the-half", "Find the half", ["counts-slices-not-halves"]],
    ["Colour half the circle", "Section 2 - Colour One Half: Which choice colours one half of the circle?", "Choose one of two equal circle parts.", ["Colour one of two equal parts", "Colour one tiny part", "Colour the whole circle"], "Colour one of two equal parts", groups("Circle split into two equal parts.", [1, 1], ["colour", "leave"]), "colour-one-half", "Colour one half", ["colours-unequal-part"]],
    ["Colour half the rectangle", "Section 2 - Colour One Half: Which choice colours half the rectangle?", "Look for one equal side of the rectangle coloured.", ["Colour one of two equal rectangle parts", "Colour three parts", "Colour a small corner only"], "Colour one of two equal rectangle parts", groups("Rectangle split into two matching parts.", [1, 1], ["colour", "leave"]), "colour-one-half", "Colour one half", ["half-by-area-gap"]],
    ["Colour half the heart", "Section 2 - Colour One Half: Which heart has one half coloured?", "Choose the heart with one matching side coloured.", ["One of two equal heart sides coloured", "A tiny heart tip coloured", "Both sides coloured"], "One of two equal heart sides coloured", groups("Heart split into matching left and right halves.", [1, 1], ["colour", "leave"]), "colour-one-half", "Colour one half", ["symmetry-half-gap"]],
    ["Share a sandwich", "Section 3 - Real-Life Halves: One sandwich is shared between 2 children. What does each child get?", "Share the sandwich fairly into two equal parts.", ["One half of the sandwich", "The whole sandwich", "A tiny unequal piece"], "One half of the sandwich", groups("One sandwich shared between two children.", [1, 1], ["child", "child"]), "real-life-halves", "Real-life halves", ["sharing-whole-not-half"]],
    ["Share strawberries", "Section 3 - Real-Life Halves: 6 strawberries are shared between 2 friends. How many does each friend get?", "Deal 6 strawberries fairly into two equal groups.", ["3 strawberries", "2 strawberries", "6 strawberries"], "3 strawberries", groups("6 strawberries shared equally.", [3, 3], ["friend", "friend"]), "real-life-halves", "Real-life halves", ["half-of-set-slip"]],
    ["Half of cookies", "Section 3 - Real-Life Halves: What is half of 8 cookies?", "Split 8 cookies into two equal groups.", ["4 cookies", "2 cookies", "8 cookies"], "4 cookies", groups("8 cookies shared into two equal groups.", [4, 4], ["half", "half"]), "real-life-halves", "Real-life halves", ["selects-whole"]],
    ["Circle halves pictures", "Section 4 - Circle the Pictures That Show Halves: Which picture shows halves?", "Choose the real object cut into two equal parts.", ["Watermelon cut into two equal pieces", "Bread torn into one big and one small piece", "Cucumber cut into three uneven pieces"], "Watermelon cut into two equal pieces", groups("Check the cake, watermelon, bread, orange, chocolate block and cucumber for equal halves.", [1, 1, 1, 2], ["yes", "yes", "no", "unequal"]), "circle-halves", "Pictures that show halves", ["piece-count-over-equality"]],
    ["Complete the other half", "Section 5 - Draw the Other Half: Which choice completes the missing half of the butterfly?", "Pick the matching mirror half.", ["A matching mirror half", "A smaller wing", "A different shape"], "A matching mirror half", groups("The other half should match the first half.", [1, 1], ["given half", "matching half"]), "draw-the-other-half", "Draw the other half", ["mirror-completion-gap"]],
    ["Think about half", "Section 6 - Think and Answer: What does half mean?", "Choose the clearest explanation of half.", ["Two equal parts of one whole", "Any two pieces", "The biggest part"], "Two equal parts of one whole", groups("A half is one of two equal parts.", [1, 1], ["half", "half"]), "think-and-answer", "Think and answer", ["half-definition-gap"]],
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
    ["Half pizza words", "Section 1 - What Fraction Do You See? A pizza is cut into two equal slices and one slice is shown. What fraction do you see?", "Match the half pizza to the fraction word and symbol.", ["one half and 1/2", "one quarter and 1/4", "one whole"], "one half and 1/2", groups("Half pizza: one of two equal slices.", [1, 1], ["shown", "rest"]), "what-fraction", "What fraction do you see?", ["half-quarter-confusion"]],
    ["Quarter cake words", "Section 1 - What Fraction Do You See? A cake is cut into four equal pieces and one piece is shown. What fraction do you see?", "Match the quarter cake to the fraction word and symbol.", ["one quarter and 1/4", "one half and 1/2", "one whole"], "one quarter and 1/4", groups("Quarter cake: one of four equal pieces.", [1, 1, 1, 1], ["shown", "piece", "piece", "piece"]), "what-fraction", "What fraction do you see?", ["counts-shaded-only"]],
    ["Half chocolate block", "Section 1 - What Fraction Do You See? Half of a chocolate block is shaded. Which label matches?", "Look for one of two equal parts of the chocolate block.", ["one half", "one quarter", "four quarters"], "one half", groups("Chocolate block split into two equal parts.", [1, 1], ["shaded", "unshaded"]), "what-fraction", "What fraction do you see?", ["symbol-word-gap"]],
    ["Match half circle", "Section 2 - Match the Picture to the Fraction: Which label matches a half circle?", "Match the picture to 1/2 and one half.", ["1/2 - one half", "1/4 - one quarter", "2/4 - two quarters"], "1/2 - one half", groups("Circle split into two equal parts.", [1, 1], ["colour", "leave"]), "match-picture", "Match picture to fraction", ["notation-match-gap"]],
    ["Match quarter square", "Section 2 - Match the Picture to the Fraction: Which label matches one square part shaded out of four equal parts?", "Match the quarter square to 1/4 and one quarter.", ["1/4 - one quarter", "1/2 - one half", "4/1 - four wholes"], "1/4 - one quarter", groups("Square grid with one of four equal parts shaded.", [1, 1, 1, 1], ["shade", "clear", "clear", "clear"]), "match-picture", "Match picture to fraction", ["denominator-gap"]],
    ["Sandwich sentence", "Section 3 - Describe the Situation: Two children share one sandwich equally. Complete the sentence: Each child gets ____.", "Choose the fraction words that describe the sharing situation.", ["one half of the sandwich", "one quarter of the sandwich", "one whole sandwich"], "one half of the sandwich", groups("One sandwich shared by two children.", [1, 1], ["child", "child"]), "describe-situation", "Describe the situation", ["whole-share-confusion"]],
    ["Cookie sentence", "Section 3 - Describe the Situation: Four friends share four cookies equally. Complete the sentence: Each friend gets ____ cookie.", "Share the cookies equally and describe one friend's share.", ["one", "one half", "one quarter"], "one", groups("Four cookies shared by four friends.", [1, 1, 1, 1], ["friend", "friend", "friend", "friend"]), "describe-situation", "Describe the situation", ["share-count-gap"]],
    ["Pizza piece sentence", "Section 3 - Describe the Situation: A pizza is cut into four equal pieces. One piece is called a ____.", "Use the fraction word for one of four equal pieces.", ["quarter", "half", "whole"], "quarter", groups("Pizza cut into four equal pieces.", [1, 1, 1, 1], ["piece", "piece", "piece", "piece"]), "describe-situation", "Describe the situation", ["quarter-language-gap"]],
    ["Draw one half", "Section 4 - Draw and Label: Which drawing and label show one half?", "Choose the model split into two equal parts with one part labelled.", ["two equal parts labelled one half / 1/2", "four equal parts labelled one quarter / 1/4", "one uneven part labelled half"], "two equal parts labelled one half / 1/2", groups("Draw one half by splitting the whole into two equal parts.", [1, 1], ["1/2", "1/2"]), "draw-and-label", "Draw and label", ["draws-unequal-half"]],
    ["Draw one quarter", "Section 4 - Draw and Label: Which drawing and label show one quarter?", "Choose the model split into four equal parts with one part labelled.", ["four equal parts labelled one quarter / 1/4", "two equal parts labelled one half / 1/2", "three uneven parts"], "four equal parts labelled one quarter / 1/4", groups("Draw one quarter by splitting the whole into four equal parts.", [1, 1, 1, 1], ["1/4", "part", "part", "part"]), "draw-and-label", "Draw and label", ["draws-two-parts-for-quarter"]],
    ["Circle correct statement", "Section 5 - Circle the Correct Statement: A rectangle strip has one of two equal parts coloured. Which statement is correct?", "Select the description that matches the coloured strip.", ["One half is coloured", "One quarter is coloured", "The whole strip is coloured"], "One half is coloured", groups("Coloured rectangle strip.", [1, 1], ["coloured", "not coloured"]), "correct-statement", "Circle the correct statement", ["statement-picture-mismatch"]],
    ["Think about equal parts", "Section 6 - Think and Answer: What do equal parts mean?", "Choose the clearest explanation.", ["parts are the same size", "parts can be any size", "only one part exists"], "parts are the same size", groups("Equal parts are matching shares of one whole.", [1, 1, 1, 1], ["part", "part", "part", "part"]), "think-and-answer", "Think and answer", ["equal-parts-language-gap"]],
  ],
  [
    ["Match half pizza", "Section 1 - Match the Fraction: Which label matches the half pizza?", "Match the pizza visual to its fraction label.", ["1/2", "1/4", "3/4"], "1/2", groups("Half pizza: one of two equal slices.", [1, 1], ["shown", "rest"]), "match-the-fraction", "Match the fraction", ["half-quarter-confusion"]],
    ["Match half chocolate", "Section 1 - Match the Fraction: Which label matches the chocolate block with two of four equal pieces shaded?", "Match the chocolate visual to its fraction label.", ["2/4", "1/4", "3/4"], "2/4", groups("Chocolate block with 2 of 4 equal pieces shaded.", [2, 2], ["shaded", "unshaded"]), "match-the-fraction", "Match the fraction", ["two-fourths-gap"]],
    ["Match circle three quarters", "Section 1 - Match the Fraction: Which label matches a circle with 3 of 4 parts shaded?", "Count shaded parts and total equal parts.", ["3/4", "1/4", "1/2"], "3/4", groups("Circle showing 3 of 4 equal parts.", [1, 1, 1, 1], ["shade", "shade", "shade", "clear"]), "match-the-fraction", "Match the fraction", ["numerator-denominator-confusion"]],
    ["Colour one half", "Section 2 - Colour the Fraction: Which model correctly colours 1/2 of a circle?", "Choose the circle with one of two equal parts coloured.", ["one of two equal parts coloured", "one of four equal parts coloured", "three of four parts coloured"], "one of two equal parts coloured", groups("Circle split into two equal parts.", [1, 1], ["colour", "clear"]), "colour-the-fraction", "Colour the fraction", ["colours-wrong-denominator"]],
    ["Colour one quarter", "Section 2 - Colour the Fraction: Which square grid correctly colours 1/4?", "Choose one of four equal parts coloured.", ["one of four equal parts coloured", "two of four equal parts coloured", "one of two equal parts coloured"], "one of four equal parts coloured", groups("Square grid split into four equal parts.", [1, 1, 1, 1], ["colour", "clear", "clear", "clear"]), "colour-the-fraction", "Colour the fraction", ["quarter-colouring-gap"]],
    ["Colour three quarters", "Section 2 - Colour the Fraction: Which quartered circle correctly colours 3/4?", "Choose three of four equal parts coloured.", ["three of four equal parts coloured", "one of four equal parts coloured", "two of four equal parts coloured"], "three of four equal parts coloured", groups("Quartered circle with three parts coloured.", [1, 1, 1, 1], ["colour", "colour", "colour", "clear"]), "colour-the-fraction", "Colour the fraction", ["counts-clear-instead"]],
    ["Compare half and quarter", "Section 3 - Compare the Pictures: Which is larger, 1/2 or 1/4?", "Use the side-by-side visual models before choosing.", ["1/2 is larger", "1/4 is larger", "they are equal"], "1/2 is larger", groups("Compare half pizza with quarter pizza.", [2, 1], ["1/2", "1/4"]), "compare-pictures", "Compare the pictures", ["larger-denominator-larger"]],
    ["Compare three quarters", "Section 3 - Compare the Pictures: Which is larger, 3/4 or 1/4?", "Compare shaded parts in the same-sized model.", ["3/4 is larger", "1/4 is larger", "they are equal"], "3/4 is larger", groups("Compare 3 of 4 parts with 1 of 4 part.", [3, 1], ["3/4", "1/4"]), "compare-pictures", "Compare the pictures", ["ignores-shaded-count"]],
    ["Half of apples", "Section 4 - Show the Fraction: Which shows half of 8 apples?", "Choose the set with 4 apples selected.", ["4 apples selected", "2 apples selected", "8 apples selected"], "4 apples selected", groups("Half of 8 apples.", [4, 4], ["selected", "not selected"]), "show-the-fraction", "Show the fraction", ["selects-whole-set"]],
    ["Quarter of cookies", "Section 4 - Show the Fraction: Which shows one quarter of 8 cookies?", "Split 8 cookies into four equal groups.", ["2 cookies selected", "4 cookies selected", "1 cookie selected"], "2 cookies selected", groups("Quarter of 8 cookies.", [2, 2, 2, 2], ["selected", "group", "group", "group"]), "show-the-fraction", "Show the fraction", ["quarters-as-half"]],
    ["Pizza remaining", "Section 5 - Real-Life Fractions: A pizza is cut into 4 equal pieces. 2 pieces are eaten. What fraction remains?", "Use the pizza pieces to find the fraction remaining.", ["2/4 remains", "1/4 remains", "4/4 remains"], "2/4 remains", groups("Pizza with 2 eaten and 2 remaining.", [2, 2], ["eaten", "remaining"]), "real-life-fractions", "Real-life fractions", ["eaten-vs-remaining"]],
    ["Think compare", "Section 6 - Think and Answer: Which is bigger, 1/2 or 1/4?", "Choose the answer with a visual reason.", ["1/2 because half of the same whole is bigger than one quarter", "1/4 because 4 is bigger than 2", "they are always the same"], "1/2 because half of the same whole is bigger than one quarter", groups("Compare same-sized wholes split into halves and quarters.", [2, 1], ["1/2", "1/4"]), "think-and-answer", "Think and answer", ["denominator-size-error"]],
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
  [
    ["Map scale", "A map uses 1 cm for 5 km. What does 4 cm represent?", "Multiply the scale distance by 4.", ["20 km", "9 km", "45 km"], "20 km", groups("Four scale units of 5 km.", [5, 5, 5, 5], ["1 cm", "1 cm", "1 cm", "1 cm"]), "scale", "Scale reasoning", ["adds-scale-values"]],
    ["Unit price", "3 notebooks cost $12. What is the cost for 1 notebook?", "Divide the total cost by the number of notebooks.", ["$4", "$9", "$36"], "$4", groups("$12 split across 3 notebooks.", [4, 4, 4], ["book", "book", "book"]), "rates", "Rates and unit price", ["compares-total-not-unit"]],
    ["Recipe scale", "A recipe uses 2 cups for 4 people. How many cups for 10 people?", "Find the scale factor from 4 to 10.", ["5 cups", "8 cups", "12 cups"], "5 cups", groups("2 cups for 4 people, scaled to 10 people.", [2, 2, 1], ["4 people", "4 people", "2 people"]), "scaling", "Scaling", ["additive-scaling-error"]],
    ["Percentage change", "A $80 jacket is 25% off. What is the discount?", "25% is one quarter of the price.", ["$20", "$25", "$60"], "$20", groups("One quarter of $80.", [20, 20, 20, 20], ["25%", "25%", "25%", "25%"]), "financial-percent", "Financial percentages", ["discount-vs-sale-price"]],
    ["Best buy", "Which is cheaper per item: 4 for $10 or 6 for $18?", "Compare the unit prices.", ["4 for $10", "6 for $18", "They are the same"], "4 for $10", groups("Compare unit prices: $2.50 and $3.", [10, 18], ["4 items", "6 items"]), "unit-price", "Unit price comparison", ["compares-pack-price-only"]],
    ["Rate table", "A car travels 150 km in 3 hours. What is the average speed?", "Divide distance by time.", ["50 km/h", "45 km/h", "153 km/h"], "50 km/h", groups("150 km shared across 3 hours.", [50, 50, 50], ["hour", "hour", "hour"]), "rates", "Rates and unit price", ["rate-operation-confusion"]],
    ["Scale drawing", "A drawing is made at 1:20 scale. A 3 cm drawing length represents what real length?", "Each drawing centimetre represents 20 cm.", ["60 cm", "23 cm", "6 cm"], "60 cm", groups("3 drawing centimetres, each worth 20 cm.", [20, 20, 20], ["cm", "cm", "cm"]), "scale", "Scale reasoning", ["ratio-order-confusion"]],
    ["Interest context", "5% of $200 is?", "Find 5 out of each 100 dollars.", ["$10", "$5", "$40"], "$10", groups("5% of two hundreds.", [5, 5, 95, 95], ["5%", "5%", "rest", "rest"]), "financial-percent", "Financial percentages", ["percent-of-whole-gap"]],
    ["Compare rates", "Runner A goes 12 km in 2 h. Runner B goes 15 km in 3 h. Who is faster?", "Compare kilometres per hour.", ["Runner A", "Runner B", "They are the same"], "Runner A", numbers("Runner A: 6 km/h. Runner B: 5 km/h.", ["12/2", "15/3", "6 > 5"]), "rates", "Rates and unit price", ["total-distance-comparison"]],
    ["Proportion equation", "If 2 tickets cost $18, what do 5 tickets cost at the same rate?", "Find the cost per ticket, then multiply by 5.", ["$45", "$36", "$90"], "$45", groups("Each ticket costs $9.", [9, 9, 9, 9, 9], ["ticket", "ticket", "ticket", "ticket", "ticket"]), "proportional-relationships", "Proportional relationships", ["uses-additive-difference"]],
    ["Currency rate", "1 token is worth 4 points. How many points are 18 tokens worth?", "Multiply tokens by points per token.", ["72 points", "22 points", "54 points"], "72 points", groups("18 tokens at 4 points each.", [4, 4, 4, 4, 4, 4], ["sample", "sample", "sample", "sample", "sample", "sample"]), "rates", "Rates and unit price", ["rate-multiplication-gap"]],
    ["Reasonable scale", "A model car is 1/10 the real length. The real car is 4 m long. How long is the model?", "Take one tenth of the real length.", ["0.4 m", "4.1 m", "40 m"], "0.4 m", numbers("One tenth of 4 m.", ["4 m", "1/10", "0.4 m"]), "scale", "Scale reasoning", ["scale-direction-error"]],
  ],
  [
    ["Chart percent", "A chart says 35% of learners walk to school. What does this mean?", "Read the percentage as out of 100 learners.", ["35 out of 100", "35 out of 10", "100 out of 35"], "35 out of 100", groups("35 of 100 learners.", [35, 65], ["walk", "other"]), "percent-interpretation", "Interpret percentages", ["percent-denominator-gap"]],
    ["Data comparison", "Class A has 18 of 30 correct. Class B has 21 of 35 correct. Which class has the higher percentage?", "Compare both as percentages or simplified rates.", ["They are the same", "Class A", "Class B"], "They are the same", numbers("18/30 = 60%, 21/35 = 60%.", ["18/30", "21/35", "60%"]), "proportional-comparison", "Proportional comparison", ["compares-correct-counts-only"]],
    ["Reasonable claim", "A survey of 20 people says 75% chose music. How many people is that?", "75% is three quarters.", ["15 people", "12 people", "75 people"], "15 people", groups("Three quarters of 20.", [5, 5, 5, 5], ["25%", "25%", "25%", "25%"]), "survey-context", "Survey context", ["percent-as-count"]],
    ["Risk statement", "Which statement best explains 1 in 4?", "Connect the ratio to a percentage.", ["About 25%", "About 4%", "About 75%"], "About 25%", groups("1 part out of 4.", [1, 3], ["event", "not event"]), "ratio-percent-link", "Ratio and percent links", ["ratio-percent-scale-gap"]],
    ["Budget share", "Rent is $450 from a $1500 monthly budget. What percentage is rent?", "Compare rent to the whole budget.", ["30%", "45%", "3%"], "30%", groups("$450 out of $1500 is 30%.", [30, 70], ["rent", "other"]), "financial-interpretation", "Financial interpretation", ["part-whole-budget-gap"]],
    ["Misleading total", "Store A sold 40 out of 50 items. Store B sold 60 out of 100 items. Which sold the greater proportion?", "Compare proportions, not just totals sold.", ["Store A", "Store B", "They are the same"], "Store A", numbers("40/50 = 80%, 60/100 = 60%.", ["80%", "60%"]), "proportional-comparison", "Proportional comparison", ["compares-absolute-counts"]],
    ["Rate decision", "A plan costs $24 for 6 GB. Another costs $30 for 10 GB. Which has the lower cost per GB?", "Find dollars per GB.", ["$30 for 10 GB", "$24 for 6 GB", "They are the same"], "$30 for 10 GB", groups("Compare $4/GB and $3/GB.", [4, 3], ["plan A", "plan B"]), "rate-interpretation", "Rate interpretation", ["total-price-comparison"]],
    ["Percent increase", "A value rises from 50 to 60. What is the percentage increase?", "The increase is 10 out of the original 50.", ["20%", "10%", "60%"], "20%", numbers("Increase 10 from original 50.", [50, 60, "10/50 = 20%"]), "percent-change", "Percent change", ["uses-new-value-as-increase"]],
    ["Estimate check", "A report says 49% of 200 people is about 100 people. Is this reasonable?", "49% is close to half.", ["Yes", "No, it should be about 50", "No, it should be about 200"], "Yes", groups("About half of 200.", [100, 100], ["about 49%", "rest"]), "reasonableness", "Reasonableness", ["no-benchmark-check"]],
    ["Data wording", "Which conclusion is supported by 70% choosing option A?", "Choose a statement that matches more than half.", ["Most chose option A", "No one chose option A", "Exactly half chose option A"], "Most chose option A", groups("70 out of 100 chose A.", [70, 30], ["A", "other"]), "data-interpretation", "Data interpretation", ["percent-language-gap"]],
    ["Compare samples", "Group X has 8 successes out of 10. Group Y has 70 successes out of 100. Which rate is higher?", "Compare 80% and 70%.", ["Group X", "Group Y", "They are equal"], "Group X", numbers("8/10 = 80%, 70/100 = 70%.", ["80%", "70%"]), "proportional-comparison", "Proportional comparison", ["larger-sample-bias"]],
    ["Decision check", "A discount changes $120 to $90. What discount percentage is this?", "The discount is $30 out of the original $120.", ["25%", "30%", "75%"], "25%", groups("$30 discount from $120.", [30, 90], ["discount", "sale price"]), "financial-interpretation", "Financial interpretation", ["sale-price-vs-discount-percent"]],
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
