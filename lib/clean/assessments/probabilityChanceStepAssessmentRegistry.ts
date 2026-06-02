import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentDepthItemCount,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export const PROBABILITY_CHANCE_STRAND_KEY = "probability-and-chance";
export const PROBABILITY_CHANCE_PARENT_FAMILY_KEY =
  "probability-and-chance-foundations";
export const PROBABILITY_CHANCE_PARENT_FAMILY_TITLE = "Probability and chance";
export const PROBABILITY_CHANCE_ITEM_BANK_KEY =
  "probability-and-chance-step-assessment-items-v1";
export const PROBABILITY_CHANCE_SOURCE_ROUTE = "/assessments/number";

type ProbabilityCase = {
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

export type ProbabilityChanceStepSpec = {
  order: number;
  stepNumber: number;
  stageKey: CleanAssessmentStageKey;
  stageTitle: string;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  cases: ProbabilityCase[];
};

export type ProbabilityChanceStepAssessment = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof PROBABILITY_CHANCE_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentBankKey: typeof PROBABILITY_CHANCE_PARENT_FAMILY_KEY;
  parentBankTitle: typeof PROBABILITY_CHANCE_PARENT_FAMILY_TITLE;
  parentItemBankKey: typeof PROBABILITY_CHANCE_ITEM_BANK_KEY;
  progressionBandKey: typeof PROBABILITY_CHANCE_PARENT_FAMILY_KEY;
  sourceRoute: typeof PROBABILITY_CHANCE_SOURCE_ROUTE;
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

function numbers(caption: string, values: Array<string | number>) {
  return `early-number|caption=${caption}|numbers=${values.join(",")}`;
}

function groups(caption: string, counts: number[], labels: string[] = counts.map(String)) {
  return `early-number|caption=${caption}|groups=${counts.join(",")}|labels=${labels.join(",")}`;
}

function makeCase(
  title: string,
  prompt: string,
  practicePrompt: string,
  options: string[],
  answer: string,
  visualDescription: string,
  cluster: string,
  clusterTitle: string,
  misconceptionTargets: string[],
): ProbabilityCase {
  return {
    title,
    prompt,
    practicePrompt,
    options,
    answer,
    visual: visualDescription,
    cluster,
    clusterTitle,
    misconceptionTargets,
  };
}

function itemId(spec: ProbabilityChanceStepSpec, index: number) {
  return `probability-chance-step-${spec.order}-assess-${String(index + 1).padStart(
    3,
    "0",
  )}`;
}

function makeItem(
  spec: ProbabilityChanceStepSpec,
  item: ProbabilityCase,
  index: number,
): NumberAssessmentBankItem {
  return {
    id: itemId(spec, index),
    progressionBandKey: PROBABILITY_CHANCE_PARENT_FAMILY_KEY,
    progressionStepKey: spec.stepKey,
    subElementKey: item.cluster,
    subElementTitle: item.clusterTitle,
    subElementDescription: spec.description,
    title: item.title,
    prompt: item.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "probability_chance_visual_card",
    options: item.options,
    expectedAnswer: item.answer,
    acceptableAnswers: [item.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: item.answer,
    misconceptionTargets: item.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: spec.stepKey,
      ifCorrectGoToStepKey: spec.stepKey,
      practiceRecommendation: `Practise ${spec.shortTitle.toLowerCase()} with spinners, dice, coin, counter-bag, sample-space, experiment, and risk cards.`,
      diagnosticNote: `Checks whether the learner can use ${spec.shortTitle.toLowerCase()} for this exact pathway step.`,
    },
    visualSupport: visual(item.visual),
  };
}

const PROBABILITY_STEP_TITLES: Array<
  [string, string, CleanAssessmentStageKey, string, number, string, string]
> = [
  ["Use everyday chance language meaningfully", "use-everyday-chance-language-meaningfully", "foundation-kindergarten", "Foundation / Kindergarten", 1, "Everyday chance language", "Use will, might, will not, likely, unlikely, certain, and impossible in familiar situations."],
  ["Notice fairness in simple games", "notice-fairness-in-simple-games", "foundation-kindergarten", "Foundation / Kindergarten", 2, "Fairness in simple games", "Notice whether a simple game gives equal opportunities and explain why."],
  ["Compare likely and unlikely events", "compare-likely-and-unlikely-events", "lower-primary", "Lower Primary", 1, "Likely and unlikely events", "Compare simple chance events as more likely, less likely, or equally likely."],
  ["Record simple chance outcomes from repeated trials", "record-simple-chance-outcomes-from-repeated-trials", "lower-primary", "Lower Primary", 2, "Repeated chance trials", "Record repeated chance outcomes and describe what happened most or least often."],
  ["Use simple fraction ideas to describe chance", "use-simple-fraction-ideas-to-describe-chance", "middle-primary", "Middle Primary", 1, "Fractions for chance", "Use part-whole fraction language to describe simple chance situations."],
  ["Compare expected and actual outcomes", "compare-expected-and-actual-outcomes", "middle-primary", "Middle Primary", 2, "Expected and actual outcomes", "Compare expected chance outcomes with what happened in trials."],
  ["Represent chance with fractions, decimals, or percentages", "represent-chance-with-fractions-decimals-or-percentages", "upper-primary", "Upper Primary", 1, "Probability representations", "Represent chance using fractions, decimals, or percentages and compare probabilities."],
  ["Judge fairness and likelihood more precisely", "judge-fairness-and-likelihood-more-precisely", "upper-primary", "Upper Primary", 2, "Precise fairness and likelihood", "Use probability representations or trial evidence to judge fairness and likelihood precisely."],
  ["Compare theoretical and experimental probability", "compare-theoretical-and-experimental-probability", "lower-secondary", "Lower Secondary", 1, "Theoretical and experimental probability", "Compare expected probability with experimental results and explain reasonable variation."],
  ["Use probability to judge risk and uncertainty", "use-probability-to-judge-risk-and-uncertainty", "lower-secondary", "Lower Secondary", 2, "Risk and uncertainty", "Use probability to compare risk, likelihood, and uncertainty in practical decisions."],
  ["Interpret probability in data-rich and realistic contexts", "interpret-probability-in-data-rich-and-realistic-contexts", "years-9-10-consolidation", "Years 9-10 / consolidation", 1, "Probability in realistic contexts", "Interpret realistic probability statements alongside data and context without overclaiming certainty."],
  ["Refine critique, explanation, and fairness reasoning", "refine-critique-explanation-and-fairness-reasoning", "years-9-10-consolidation", "Years 9-10 / consolidation", 2, "Critique and fairness reasoning", "Critique chance claims, explain fairness, and communicate uncertainty carefully."],
];

const EARLY_PROBABILITY_CASE_BUILDERS: Array<() => ProbabilityCase[]> = [
  () => [
    makeCase("Certain sunrise", "Which event is certain tomorrow?", "Choose what will happen in a normal day.", ["the sun will rise", "a dice will show 9", "it will rain sweets"], "the sun will rise", numbers("Chance language cards.", ["certain", "impossible", "might"]), "chance-language", "Chance language", ["certain-vs-likely"]),
    makeCase("Impossible dice", "Which event is impossible on a normal six-sided dice?", "Use the dice faces.", ["roll a 9", "roll a 4", "roll an even number"], "roll a 9", numbers("Dice faces.", [1, 2, 3, 4, 5, 6]), "impossible", "Impossible events", ["dice-outcome-gap"]),
    makeCase("Might happen", "Which event might happen?", "Choose something possible but not certain.", ["it might rain", "a square has no sides", "night will never come"], "it might rain", numbers("Weather chance card.", ["sunny", "cloudy", "rain"]), "possible", "Possible events", ["might-vs-certain"]),
    makeCase("Unlikely event", "Which event is unlikely?", "Choose the event that could happen but probably will not.", ["snow on a hot summer day", "eating lunch today", "the sun rising"], "snow on a hot summer day", numbers("Everyday chance.", ["likely", "unlikely"]), "likely-unlikely", "Likely and unlikely", ["unlikely-vs-impossible"]),
    makeCase("Will not", "Which event will not happen in a coin toss?", "Use the possible coin outcomes.", ["land on 5", "land on heads", "land on tails"], "land on 5", numbers("Coin outcomes.", ["heads", "tails"]), "impossible", "Impossible events", ["coin-outcome-gap"]),
    makeCase("Likely routine", "Which event is likely before bedtime?", "Use a familiar routine.", ["brush teeth", "fly to the moon", "roll a dice"], "brush teeth", numbers("Routine cards.", ["brush teeth", "moon trip"]), "likely-unlikely", "Likely and unlikely", ["context-likelihood-gap"]),
    makeCase("Chance word", "Which word means it cannot happen?", "Match the chance word.", ["impossible", "likely", "certain"], "impossible", numbers("Chance words.", ["certain", "possible", "impossible"]), "language", "Chance vocabulary", ["word-meaning-gap"]),
    makeCase("Certain bag", "A bag has only red counters. Which draw is certain?", "Look at all counters in the bag.", ["draw red", "draw blue", "draw green"], "draw red", groups("Only red counters.", [6], ["red"]), "certain", "Certain events", ["ignores-all-outcomes"]),
    makeCase("Possible bag", "A bag has red and blue counters. Which draw is possible?", "Choose an outcome in the bag.", ["blue", "yellow", "purple"], "blue", groups("Counter bag.", [3, 2], ["red", "blue"]), "possible", "Possible events", ["possible-outcome-gap"]),
    makeCase("Best chance word", "A spinner has one tiny green part. Landing on green is?", "Use chance language.", ["unlikely", "certain", "impossible"], "unlikely", groups("Spinner sections.", [1, 9], ["green", "other"]), "likely-unlikely", "Likely and unlikely", ["small-chance-impossible"]),
    makeCase("Explain chance", "Why is rolling a 3 possible on a normal dice?", "Check whether 3 is on the dice.", ["3 is one of the faces", "3 is bigger than 6", "dice have no numbers"], "3 is one of the faces", numbers("Dice faces.", [1, 2, 3, 4, 5, 6]), "reasoning", "Chance reasoning", ["evidence-language-gap"]),
    makeCase("Not guaranteed", "A weather forecast says rain is possible. What does that mean?", "Possible is not the same as certain.", ["it might rain", "it must rain", "it cannot rain"], "it might rain", numbers("Forecast card.", ["possible rain"]), "language", "Chance vocabulary", ["possible-certain-confusion"]),
  ],
  () => [
    makeCase("Fair spinner", "Which spinner is fair for red and blue?", "Compare equal sections.", ["red and blue equal", "red much larger", "blue missing"], "red and blue equal", groups("Spinner sections.", [4, 4], ["red", "blue"]), "fairness", "Fairness", ["fairness-size-gap"]),
    makeCase("Unfair game", "Which game is unfair?", "Look for one player having more winning spaces.", ["Player A has 5 spaces, Player B has 1", "both have 3 spaces", "both toss a coin"], "Player A has 5 spaces, Player B has 1", groups("Winning spaces.", [5, 1], ["A", "B"]), "fairness", "Fairness", ["equal-opportunity-gap"]),
    makeCase("Coin fair", "Why is a fair coin game usually fair for heads and tails?", "Compare the two sides.", ["two equally likely sides", "heads is always first", "tails is bigger"], "two equally likely sides", numbers("Coin sides.", ["heads", "tails"]), "fairness-reason", "Fairness reasons", ["coin-side-gap"]),
    makeCase("Make fair", "A spinner has 3 red and 1 blue section. What makes it fair for red and blue?", "Make the sections equal.", ["2 red and 2 blue", "4 red and 0 blue", "3 red and 3 green"], "2 red and 2 blue", groups("Adjust spinner sections.", [3, 1], ["red", "blue"]), "make-fair", "Make fair", ["changes-wrong-outcome"]),
    makeCase("Best chance", "Who has the better chance: A wins on 1,2,3,4 and B wins on 5,6?", "Count winning outcomes.", ["A", "B", "same chance"], "A", numbers("Dice winning outcomes.", ["A:1,2,3,4", "B:5,6"]), "fairness", "Fairness", ["counts-players-not-outcomes"]),
    makeCase("Equal chance", "Which dice game gives equal chance?", "Each player needs the same number of outcomes.", ["A: odd, B: even", "A: 1 only, B: 2,3,4", "A: 1,2,3, B: 4 only"], "A: odd, B: even", numbers("Dice game.", ["odd 3 outcomes", "even 3 outcomes"]), "fairness", "Fairness", ["outcome-count-gap"]),
    makeCase("Unfair bag", "A bag has 8 red and 2 blue counters. Which colour is favoured?", "The larger group is more likely.", ["red", "blue", "same"], "red", groups("Counter bag.", [8, 2], ["red", "blue"]), "favoured-outcome", "Favoured outcomes", ["more-likely-gap"]),
    makeCase("Fair draw", "Which bag is fair for red or blue?", "Find equal counts.", ["5 red and 5 blue", "8 red and 2 blue", "1 red and 9 blue"], "5 red and 5 blue", groups("Fair bag.", [5, 5], ["red", "blue"]), "fairness", "Fairness", ["ignores-counts"]),
    makeCase("Player complaint", "A player says the game is unfair because blue has more sections. What should you check?", "Compare outcome spaces.", ["number or size of sections", "player names", "spinner colour brightness"], "number or size of sections", numbers("Fairness checklist.", ["sections", "sizes"]), "fairness-reason", "Fairness reasons", ["irrelevant-feature"]),
    makeCase("Fair change", "A dice game: A wins on 1, B wins on 2,3,4,5,6. Which change is fairer?", "Give equal numbers of winning outcomes.", ["A wins odd, B wins even", "A wins 1 only", "B wins all numbers"], "A wins odd, B wins even", numbers("Fair dice outcomes.", ["odd", "even"]), "make-fair", "Make fair", ["fair-change-gap"]),
    makeCase("Chance and fairness", "Which statement is true?", "Fair means equal chance, not guaranteed wins.", ["a fair game can still have surprising results", "fair means both always win", "unfair means impossible"], "a fair game can still have surprising results", numbers("Fairness concept.", ["fair", "random results"]), "fairness-reason", "Fairness reasons", ["fair-guarantees-outcome"]),
    makeCase("Explain unfair", "Why is a spinner with 7 red and 1 blue unfair for blue?", "Compare the sections.", ["blue has fewer chances", "blue is a cooler colour", "red cannot happen"], "blue has fewer chances", groups("Unfair spinner.", [7, 1], ["red", "blue"]), "reasoning", "Fairness reasoning", ["explanation-not-probabilistic"]),
  ],
  () => [
    makeCase("More likely bag", "Which colour is more likely from 6 red and 2 blue?", "Compare the counts.", ["red", "blue", "same"], "red", groups("Counter bag.", [6, 2], ["red", "blue"]), "compare-likelihood", "Compare likelihood", ["more-less-confusion"]),
    makeCase("Equally likely", "Which draw is equally likely?", "Look for equal counts.", ["4 red and 4 blue", "6 red and 2 blue", "1 red and 7 blue"], "4 red and 4 blue", groups("Equal bag.", [4, 4], ["red", "blue"]), "equally-likely", "Equally likely", ["equal-chance-gap"]),
    makeCase("Less likely", "A spinner has 8 yellow and 1 purple section. Which is less likely?", "Find the smaller outcome space.", ["purple", "yellow", "same"], "purple", groups("Spinner sections.", [8, 1], ["yellow", "purple"]), "compare-likelihood", "Compare likelihood", ["less-likely-gap"]),
    makeCase("Weather comparison", "A forecast says rain 20%, sun 70%. Which is more likely?", "Compare percentages.", ["sun", "rain", "same"], "sun", numbers("Weather forecast.", ["rain 20%", "sun 70%"]), "compare-likelihood", "Compare likelihood", ["percent-comparison-error"]),
    makeCase("Dice compare", "Which is more likely on a dice?", "Count outcomes.", ["roll an even number", "roll a 6", "same"], "roll an even number", numbers("Dice outcomes.", ["even: 2,4,6", "6 only"]), "sample-space", "Sample space", ["counts-labels-not-outcomes"]),
    makeCase("Coin compare", "Heads and tails on a fair coin are?", "Compare the two sides.", ["equally likely", "heads is certain", "tails is impossible"], "equally likely", numbers("Coin sides.", ["heads", "tails"]), "equally-likely", "Equally likely", ["coin-bias-assumption"]),
    makeCase("Best chance", "Which bag gives the best chance of blue?", "Compare blue counts out of total.", ["5 blue, 1 red", "2 blue, 4 red", "1 blue, 5 red"], "5 blue, 1 red", groups("Blue chance bags.", [5, 1, 2, 4, 1, 5], ["blue", "red", "blue", "red", "blue", "red"]), "compare-likelihood", "Compare likelihood", ["absolute-vs-relative-gap"]),
    makeCase("Impossible compare", "Which event is less likely than rolling a 1?", "Impossible is less likely than possible.", ["rolling a 9", "rolling a 2", "rolling an odd number"], "rolling a 9", numbers("Dice faces.", [1, 2, 3, 4, 5, 6]), "impossible", "Impossible events", ["impossible-likelihood-gap"]),
    makeCase("Likely word", "A bag has mostly green counters. Drawing green is?", "Use likely language.", ["likely", "impossible", "equally likely"], "likely", groups("Mostly green bag.", [9, 1], ["green", "red"]), "language", "Chance language", ["mostly-vocabulary-gap"]),
    makeCase("Compare spinners", "Spinner A has 2 red out of 4. Spinner B has 3 red out of 4. Which gives red a better chance?", "Compare red sections.", ["Spinner B", "Spinner A", "same"], "Spinner B", groups("Red sections.", [2, 2, 3, 1], ["A red", "A other", "B red", "B other"]), "compare-likelihood", "Compare likelihood", ["spinner-comparison-gap"]),
    makeCase("Equal dice chances", "Rolling a 2 and rolling a 5 on a fair dice are?", "Each single face has one chance.", ["equally likely", "2 is more likely", "5 is impossible"], "equally likely", numbers("Dice single outcomes.", [2, 5]), "equally-likely", "Equally likely", ["single-outcome-bias"]),
    makeCase("Explain comparison", "Why is blue more likely in a bag with 7 blue and 3 red?", "Use the counts.", ["there are more blue counters", "blue is first", "red cannot be drawn"], "there are more blue counters", groups("Counter bag.", [7, 3], ["blue", "red"]), "reasoning", "Likelihood reasoning", ["weak-explanation"]),
  ],
  () => [
    makeCase("Coin tally", "A coin is tossed 10 times: heads 6, tails 4. Which happened more?", "Read the tally.", ["heads", "tails", "same"], "heads", groups("Coin results.", [6, 4], ["heads", "tails"]), "record-results", "Record results", ["reads-wrong-row"]),
    makeCase("Dice tally", "A dice roll tally shows 1:2, 2:5, 3:1. Which result happened most?", "Find the largest tally.", ["2", "1", "3"], "2", numbers("Dice tally.", ["1:2", "2:5", "3:1"]), "record-results", "Record results", ["largest-tally-error"]),
    makeCase("Record method", "Which record helps track repeated spins?", "Use a tally or table.", ["tally chart", "blank page", "story title"], "tally chart", numbers("Recording choices.", ["tally", "table"]), "recording", "Recording", ["record-purpose-gap"]),
    makeCase("Total trials", "A table shows red 3 and blue 7. How many trials?", "Add all outcomes.", ["10", "7", "3"], "10", groups("Trial results.", [3, 7], ["red", "blue"]), "totals", "Trial totals", ["partial-total"]),
    makeCase("Least often", "Results: A 8, B 2, C 5. Which happened least?", "Find the smallest count.", ["B", "A", "C"], "B", numbers("Outcome table.", ["A 8", "B 2", "C 5"]), "record-results", "Record results", ["least-error"]),
    makeCase("Repeated trials", "Why repeat a chance experiment?", "More trials give more information.", ["to see patterns in outcomes", "to make chance stop", "to guarantee one result"], "to see patterns in outcomes", numbers("Trial card.", ["repeat", "record", "compare"]), "experimental-chance", "Experimental chance", ["repeat-purpose-gap"]),
    makeCase("Tally mark", "Which tally shows four wins?", "Count marks.", ["||||", "||", "||||/"], "||||", numbers("Tally cards.", ["||||", "||||/"]), "recording", "Recording", ["tally-five-confusion"]),
    makeCase("Outcome label", "What should a results table include?", "Tables need outcome names.", ["outcome labels and counts", "only colours", "no numbers"], "outcome labels and counts", numbers("Results table parts.", ["outcome", "count"]), "recording", "Recording", ["missing-labels"]),
    makeCase("Most in spins", "A spinner landed green 9 times and orange 4 times. Which happened most?", "Compare the counts.", ["green", "orange", "same"], "green", groups("Spinner results.", [9, 4], ["green", "orange"]), "record-results", "Record results", ["most-error"]),
    makeCase("Unexpected short run", "A fair coin gets heads 4 times in a row. What is true?", "Short runs can be surprising.", ["this can happen", "the coin cannot be fair", "tails is impossible"], "this can happen", numbers("Coin run.", ["H", "H", "H", "H"]), "experimental-chance", "Experimental chance", ["short-run-certainty"]),
    makeCase("Result statement", "Which statement matches red 6, blue 6?", "Compare recorded outcomes.", ["red and blue happened the same number of times", "red happened more", "blue did not happen"], "red and blue happened the same number of times", groups("Trial results.", [6, 6], ["red", "blue"]), "statements", "Result statements", ["unsupported-statement"]),
    makeCase("Connect results", "A bag has many red counters and red was drawn most. What does the result suggest?", "Connect chance to outcomes carefully.", ["red may be more likely", "red is guaranteed", "blue is impossible"], "red may be more likely", groups("Trial and bag clue.", [8, 2], ["red", "blue"]), "reasoning", "Trial reasoning", ["overclaims-results"]),
  ],
];
void EARLY_PROBABILITY_CASE_BUILDERS;

function middleAndLaterCases(offset: number): ProbabilityCase[] {
  const contexts = [
    ["spinner", groups("Spinner parts.", [1, 3], ["win", "other"])],
    ["bag", groups("Counter bag.", [2, 6], ["blue", "red"])],
    ["dice", numbers("Dice outcomes.", [1, 2, 3, 4, 5, 6])],
    ["coin", numbers("Coin outcomes.", ["heads", "tails"])],
  ] as const;

  const base: ProbabilityCase[] = [
    makeCase("Probability fraction", "A spinner has 1 winning part out of 4. Which probability matches?", "Use winning parts out of all parts.", ["1/4", "3/4", "4/1"], "1/4", contexts[0][1], "representations", "Probability representations", ["part-whole-reversal"]),
    makeCase("Expected result", "If a fair coin is tossed 20 times, which result is most reasonable?", "Use about half heads.", ["about 10 heads", "exactly 20 heads every time", "no heads possible"], "about 10 heads", numbers("Expected coin results.", ["20 tosses", "about half"]), "expected-actual", "Expected and actual", ["expected-guaranteed"]),
    makeCase("Actual variation", "Expected red is 50%, but a trial gives red 6 out of 10. What is true?", "Short trials can vary.", ["the result is possible variation", "the experiment is impossible", "red is guaranteed"], "the result is possible variation", groups("Expected and actual.", [5, 5, 6, 4], ["expected red", "expected other", "actual red", "actual other"]), "variation", "Variation", ["variation-as-error"]),
    makeCase("Percentage chance", "Which is the same as 1/2 chance?", "Connect common probability forms.", ["50%", "10%", "100%"], "50%", numbers("Equivalent forms.", ["1/2", "0.5", "50%"]), "representations", "Probability representations", ["fraction-percent-gap"]),
    makeCase("Decimal chance", "Which decimal matches 25% chance?", "Convert the percentage.", ["0.25", "2.5", "25"], "0.25", numbers("Probability forms.", ["25%", "0.25"]), "representations", "Probability representations", ["decimal-scale-error"]),
    makeCase("Fair probability", "Which game is fair?", "Compare probabilities for each player.", ["A 1/2, B 1/2", "A 3/4, B 1/4", "A 1, B 0"], "A 1/2, B 1/2", numbers("Fair game probabilities.", ["1/2", "1/2"]), "fairness", "Fairness", ["fairness-probability-gap"]),
    makeCase("Theoretical chance", "On a normal dice, what is the theoretical chance of rolling a 6?", "Use one favourable outcome out of six.", ["1/6", "1/2", "6/1"], "1/6", contexts[2][1], "theoretical", "Theoretical probability", ["sample-space-error"]),
    makeCase("Experimental chance", "A spinner lands blue 12 times in 30 spins. Which experimental probability matches?", "Use observed blue out of total spins.", ["12/30", "30/12", "12/18"], "12/30", numbers("Experimental results.", ["blue 12", "total 30"]), "experimental", "Experimental probability", ["observed-total-confusion"]),
    makeCase("Risk comparison", "Which option has lower risk?", "Compare the chance of loss.", ["5% chance of loss", "25% chance of loss", "50% chance of loss"], "5% chance of loss", numbers("Risk cards.", ["5%", "25%", "50%"]), "risk", "Risk", ["risk-percent-comparison"]),
    makeCase("Data-rich probability", "A forecast says 80% chance of rain. What does it not guarantee?", "Probability is not certainty.", ["that rain is certain", "that rain is likely", "that rain is possible"], "that rain is certain", numbers("Forecast probability.", ["80% rain"]), "interpretation", "Interpretation", ["probability-guarantee"]),
    makeCase("Critique claim", "A game owner says a prize is easy to win, but the chance is 1/100. What should you question?", "Compare the claim with the probability.", ["the claim is too strong", "1/100 means certain", "the prize is impossible to name"], "the claim is too strong", numbers("Chance claim.", ["easy?", "1/100"]), "critique", "Critique", ["claim-probability-mismatch"]),
    makeCase("Careful explanation", "Which statement is careful for 70% chance?", "Use probability language without certainty.", ["likely, but not guaranteed", "certain", "impossible"], "likely, but not guaranteed", numbers("Probability number line.", ["0%", "70%", "100%"]), "communication", "Communication", ["overclaims-certainty"]),
  ];

  return base.map((item, index) => ({
    ...item,
    title: `${item.title}${offset ? ` ${offset + index}` : ""}`,
  }));
}

const CASE_BUILDERS: Array<() => ProbabilityCase[]> = [
  () => [
    makeCase("Certain sunrise", "Which event is certain tomorrow?", "Choose what will happen in a normal day.", ["the sun will rise", "a dice will show 9", "it will rain sweets"], "the sun will rise", numbers("Chance language cards.", ["certain", "impossible", "might"]), "chance-language", "Chance language", ["certain-vs-likely"]),
    makeCase("Impossible dice", "Which event is impossible on a normal six-sided dice?", "Use the dice faces.", ["roll a 9", "roll a 4", "roll an even number"], "roll a 9", numbers("Dice faces.", [1, 2, 3, 4, 5, 6]), "impossible", "Impossible events", ["dice-outcome-gap"]),
    makeCase("Might happen", "Which event might happen?", "Choose something possible but not certain.", ["it might rain", "a square has no sides", "night will never come"], "it might rain", numbers("Weather chance card.", ["sunny", "cloudy", "rain"]), "possible", "Possible events", ["might-vs-certain"]),
    makeCase("Unlikely event", "Which event is unlikely?", "Choose the event that could happen but probably will not.", ["snow on a hot summer day", "eating lunch today", "the sun rising"], "snow on a hot summer day", numbers("Everyday chance.", ["likely", "unlikely"]), "likely-unlikely", "Likely and unlikely", ["unlikely-vs-impossible"]),
    makeCase("Coin impossibility", "Which event will not happen in a coin toss?", "Use the possible coin outcomes.", ["land on 5", "land on heads", "land on tails"], "land on 5", numbers("Coin outcomes.", ["heads", "tails"]), "impossible", "Impossible events", ["coin-outcome-gap"]),
    makeCase("Likely routine", "Which event is likely before bedtime?", "Use a familiar routine.", ["brush teeth", "fly to the moon", "roll a dice"], "brush teeth", numbers("Routine cards.", ["brush teeth", "moon trip"]), "likely-unlikely", "Likely and unlikely", ["context-likelihood-gap"]),
    makeCase("Chance word", "Which word means it cannot happen?", "Match the chance word.", ["impossible", "likely", "certain"], "impossible", numbers("Chance words.", ["certain", "possible", "impossible"]), "language", "Chance vocabulary", ["word-meaning-gap"]),
    makeCase("Certain bag", "A bag has only red counters. Which draw is certain?", "Look at all counters in the bag.", ["draw red", "draw blue", "draw green"], "draw red", groups("Only red counters.", [6], ["red"]), "certain", "Certain events", ["ignores-all-outcomes"]),
    makeCase("Possible bag", "A bag has red and blue counters. Which draw is possible?", "Choose an outcome in the bag.", ["blue", "yellow", "purple"], "blue", groups("Counter bag.", [3, 2], ["red", "blue"]), "possible", "Possible events", ["possible-outcome-gap"]),
    makeCase("Best chance word", "A spinner has one tiny green part. Landing on green is?", "Use chance language.", ["unlikely", "certain", "impossible"], "unlikely", groups("Spinner sections.", [1, 9], ["green", "other"]), "likely-unlikely", "Likely and unlikely", ["small-chance-impossible"]),
    makeCase("Explain chance", "Why is rolling a 3 possible on a normal dice?", "Check whether 3 is on the dice.", ["3 is one of the faces", "3 is bigger than 6", "dice have no numbers"], "3 is one of the faces", numbers("Dice faces.", [1, 2, 3, 4, 5, 6]), "reasoning", "Chance reasoning", ["evidence-language-gap"]),
    makeCase("Not guaranteed", "A weather forecast says rain is possible. What does that mean?", "Possible is not the same as certain.", ["it might rain", "it must rain", "it cannot rain"], "it might rain", numbers("Forecast card.", ["possible rain"]), "language", "Chance vocabulary", ["possible-certain-confusion"]),
  ],
  () => [
    makeCase("Fair spinner", "Which spinner is fair for red and blue?", "Compare equal sections.", ["red and blue equal", "red much larger", "blue missing"], "red and blue equal", groups("Spinner sections.", [4, 4], ["red", "blue"]), "fairness", "Fairness", ["fairness-size-gap"]),
    makeCase("Unfair game", "Which game is unfair?", "Look for one player having more winning spaces.", ["Player A has 5 spaces, Player B has 1", "both have 3 spaces", "both toss a coin"], "Player A has 5 spaces, Player B has 1", groups("Winning spaces.", [5, 1], ["A", "B"]), "fairness", "Fairness", ["equal-opportunity-gap"]),
    makeCase("Coin fair", "Why is a fair coin game usually fair for heads and tails?", "Compare the two sides.", ["two equally likely sides", "heads is always first", "tails is bigger"], "two equally likely sides", numbers("Coin sides.", ["heads", "tails"]), "fairness-reason", "Fairness reasons", ["coin-side-gap"]),
    makeCase("Make fair", "A spinner has 3 red and 1 blue section. What makes it fair for red and blue?", "Make the sections equal.", ["2 red and 2 blue", "4 red and 0 blue", "3 red and 3 green"], "2 red and 2 blue", groups("Adjust spinner sections.", [3, 1], ["red", "blue"]), "make-fair", "Make fair", ["changes-wrong-outcome"]),
    makeCase("Better chance", "Who has the better chance: A wins on 1,2,3,4 and B wins on 5,6?", "Count winning outcomes.", ["A", "B", "same chance"], "A", numbers("Dice winning outcomes.", ["A:1,2,3,4", "B:5,6"]), "fairness", "Fairness", ["counts-players-not-outcomes"]),
    makeCase("Equal chance", "Which dice game gives equal chance?", "Each player needs the same number of outcomes.", ["A: odd, B: even", "A: 1 only, B: 2,3,4", "A: 1,2,3, B: 4 only"], "A: odd, B: even", numbers("Dice game.", ["odd 3 outcomes", "even 3 outcomes"]), "fairness", "Fairness", ["outcome-count-gap"]),
    makeCase("Unfair bag", "A bag has 8 red and 2 blue counters. Which colour is favoured?", "The larger group is more likely.", ["red", "blue", "same"], "red", groups("Counter bag.", [8, 2], ["red", "blue"]), "favoured-outcome", "Favoured outcomes", ["more-likely-gap"]),
    makeCase("Fair draw", "Which bag is fair for red or blue?", "Find equal counts.", ["5 red and 5 blue", "8 red and 2 blue", "1 red and 9 blue"], "5 red and 5 blue", groups("Fair bag.", [5, 5], ["red", "blue"]), "fairness", "Fairness", ["ignores-counts"]),
    makeCase("Fairness check", "What should you check when a game feels unfair?", "Compare outcome spaces.", ["number or size of chances", "player names", "colour brightness"], "number or size of chances", numbers("Fairness checklist.", ["chances", "sizes"]), "fairness-reason", "Fairness reasons", ["irrelevant-feature"]),
    makeCase("Fair change", "Which change makes a dice game fairer?", "Give equal numbers of winning outcomes.", ["A wins odd, B wins even", "A wins 1 only", "B wins all numbers"], "A wins odd, B wins even", numbers("Fair dice outcomes.", ["odd", "even"]), "make-fair", "Make fair", ["fair-change-gap"]),
    makeCase("Fair but random", "Which statement is true?", "Fair means equal chance, not guaranteed wins.", ["a fair game can still have surprising results", "fair means both always win", "unfair means impossible"], "a fair game can still have surprising results", numbers("Fairness concept.", ["fair", "random results"]), "fairness-reason", "Fairness reasons", ["fair-guarantees-outcome"]),
    makeCase("Explain unfair", "Why is a spinner with 7 red and 1 blue unfair for blue?", "Compare the sections.", ["blue has fewer chances", "blue is a cooler colour", "red cannot happen"], "blue has fewer chances", groups("Unfair spinner.", [7, 1], ["red", "blue"]), "reasoning", "Fairness reasoning", ["explanation-not-probabilistic"]),
  ],
  () => [
    makeCase("More likely bag", "Which colour is more likely from 6 red and 2 blue?", "Compare the counts.", ["red", "blue", "same"], "red", groups("Counter bag.", [6, 2], ["red", "blue"]), "compare-likelihood", "Compare likelihood", ["more-less-confusion"]),
    makeCase("Equally likely", "Which draw is equally likely?", "Look for equal counts.", ["4 red and 4 blue", "6 red and 2 blue", "1 red and 7 blue"], "4 red and 4 blue", groups("Equal bag.", [4, 4], ["red", "blue"]), "equally-likely", "Equally likely", ["equal-chance-gap"]),
    makeCase("Less likely", "A spinner has 8 yellow and 1 purple section. Which is less likely?", "Find the smaller outcome space.", ["purple", "yellow", "same"], "purple", groups("Spinner sections.", [8, 1], ["yellow", "purple"]), "compare-likelihood", "Compare likelihood", ["less-likely-gap"]),
    makeCase("Weather comparison", "A forecast says rain 20%, sun 70%. Which is more likely?", "Compare percentages.", ["sun", "rain", "same"], "sun", numbers("Weather forecast.", ["rain 20%", "sun 70%"]), "compare-likelihood", "Compare likelihood", ["percent-comparison-error"]),
    makeCase("Dice compare", "Which is more likely on a dice?", "Count outcomes.", ["roll an even number", "roll a 6", "same"], "roll an even number", numbers("Dice outcomes.", ["even: 2,4,6", "6 only"]), "sample-space", "Sample space", ["counts-labels-not-outcomes"]),
    makeCase("Coin compare", "Heads and tails on a fair coin are?", "Compare the two sides.", ["equally likely", "heads is certain", "tails is impossible"], "equally likely", numbers("Coin sides.", ["heads", "tails"]), "equally-likely", "Equally likely", ["coin-bias-assumption"]),
    makeCase("Best blue chance", "Which bag gives the best chance of blue?", "Compare blue counts out of total.", ["5 blue, 1 red", "2 blue, 4 red", "1 blue, 5 red"], "5 blue, 1 red", groups("Blue chance bags.", [5, 1, 2, 4, 1, 5], ["blue", "red", "blue", "red", "blue", "red"]), "compare-likelihood", "Compare likelihood", ["absolute-vs-relative-gap"]),
    makeCase("Impossible compare", "Which event is less likely than rolling a 1?", "Impossible is less likely than possible.", ["rolling a 9", "rolling a 2", "rolling an odd number"], "rolling a 9", numbers("Dice faces.", [1, 2, 3, 4, 5, 6]), "impossible", "Impossible events", ["impossible-likelihood-gap"]),
    makeCase("Mostly green", "A bag has mostly green counters. Drawing green is?", "Use likely language.", ["likely", "impossible", "equally likely"], "likely", groups("Mostly green bag.", [9, 1], ["green", "red"]), "language", "Chance language", ["mostly-vocabulary-gap"]),
    makeCase("Compare spinners", "Spinner A has 2 red out of 4. Spinner B has 3 red out of 4. Which gives red a better chance?", "Compare red sections.", ["Spinner B", "Spinner A", "same"], "Spinner B", groups("Red sections.", [2, 2, 3, 1], ["A red", "A other", "B red", "B other"]), "compare-likelihood", "Compare likelihood", ["spinner-comparison-gap"]),
    makeCase("Equal dice chances", "Rolling a 2 and rolling a 5 on a fair dice are?", "Each single face has one chance.", ["equally likely", "2 is more likely", "5 is impossible"], "equally likely", numbers("Dice single outcomes.", [2, 5]), "equally-likely", "Equally likely", ["single-outcome-bias"]),
    makeCase("Explain comparison", "Why is blue more likely in a bag with 7 blue and 3 red?", "Use the counts.", ["there are more blue counters", "blue is first", "red cannot be drawn"], "there are more blue counters", groups("Counter bag.", [7, 3], ["blue", "red"]), "reasoning", "Likelihood reasoning", ["weak-explanation"]),
  ],
  () => [
    makeCase("Coin tally", "A coin is tossed 10 times: heads 6, tails 4. Which happened more?", "Read the tally.", ["heads", "tails", "same"], "heads", groups("Coin results.", [6, 4], ["heads", "tails"]), "record-results", "Record results", ["reads-wrong-row"]),
    makeCase("Dice tally", "A dice roll tally shows 1:2, 2:5, 3:1. Which result happened most?", "Find the largest tally.", ["2", "1", "3"], "2", numbers("Dice tally.", ["1:2", "2:5", "3:1"]), "record-results", "Record results", ["largest-tally-error"]),
    makeCase("Record method", "Which record helps track repeated spins?", "Use a tally or table.", ["tally chart", "blank page", "story title"], "tally chart", numbers("Recording choices.", ["tally", "table"]), "recording", "Recording", ["record-purpose-gap"]),
    makeCase("Total trials", "A table shows red 3 and blue 7. How many trials?", "Add all outcomes.", ["10", "7", "3"], "10", groups("Trial results.", [3, 7], ["red", "blue"]), "totals", "Trial totals", ["partial-total"]),
    makeCase("Least often", "Results: A 8, B 2, C 5. Which happened least?", "Find the smallest count.", ["B", "A", "C"], "B", numbers("Outcome table.", ["A 8", "B 2", "C 5"]), "record-results", "Record results", ["least-error"]),
    makeCase("Repeat trials", "Why repeat a chance experiment?", "More trials give more information.", ["to see patterns in outcomes", "to make chance stop", "to guarantee one result"], "to see patterns in outcomes", numbers("Trial card.", ["repeat", "record", "compare"]), "experimental-chance", "Experimental chance", ["repeat-purpose-gap"]),
    makeCase("Tally four", "Which tally shows four wins?", "Count marks.", ["||||", "||", "||||/"], "||||", numbers("Tally cards.", ["||||", "||||/"]), "recording", "Recording", ["tally-five-confusion"]),
    makeCase("Table labels", "What should a results table include?", "Tables need outcome names.", ["outcome labels and counts", "only colours", "no numbers"], "outcome labels and counts", numbers("Results table parts.", ["outcome", "count"]), "recording", "Recording", ["missing-labels"]),
    makeCase("Most spins", "A spinner landed green 9 times and orange 4 times. Which happened most?", "Compare the counts.", ["green", "orange", "same"], "green", groups("Spinner results.", [9, 4], ["green", "orange"]), "record-results", "Record results", ["most-error"]),
    makeCase("Short run", "A fair coin gets heads 4 times in a row. What is true?", "Short runs can be surprising.", ["this can happen", "the coin cannot be fair", "tails is impossible"], "this can happen", numbers("Coin run.", ["H", "H", "H", "H"]), "experimental-chance", "Experimental chance", ["short-run-certainty"]),
    makeCase("Same results", "Which statement matches red 6, blue 6?", "Compare recorded outcomes.", ["red and blue happened the same number of times", "red happened more", "blue did not happen"], "red and blue happened the same number of times", groups("Trial results.", [6, 6], ["red", "blue"]), "statements", "Result statements", ["unsupported-statement"]),
    makeCase("Connect results", "A bag has many red counters and red was drawn most. What does the result suggest?", "Connect chance to outcomes carefully.", ["red may be more likely", "red is guaranteed", "blue is impossible"], "red may be more likely", groups("Trial and bag clue.", [8, 2], ["red", "blue"]), "reasoning", "Trial reasoning", ["overclaims-results"]),
  ],
  () => middleAndLaterCases(0),
  () => middleAndLaterCases(12),
  () => middleAndLaterCases(24),
  () => middleAndLaterCases(36),
  () => middleAndLaterCases(48),
  () => middleAndLaterCases(60),
  () => middleAndLaterCases(72),
  () => middleAndLaterCases(84),
];

export const PROBABILITY_CHANCE_STEP_SPECS: ProbabilityChanceStepSpec[] =
  PROBABILITY_STEP_TITLES.map(
    ([title, stepKey, stageKey, stageTitle, stepNumber, shortTitle, description], index) => ({
      order: index + 1,
      stepNumber,
      stageKey,
      stageTitle,
      stepKey,
      pathwayStepId: `mathematics::probability-and-chance::${stageKey}::${stepKey}`,
      title,
      shortTitle,
      description,
      cases: CASE_BUILDERS[index]?.() ?? [],
    }),
  );

export const PROBABILITY_CHANCE_STEP_ASSESSMENTS: ProbabilityChanceStepAssessment[] =
  PROBABILITY_CHANCE_STEP_SPECS.map((spec) => ({
    key: `probability-chance-step-${spec.order}-${spec.stepKey}-assessment-v1`,
    stepNumber: spec.stepNumber,
    stepKey: spec.stepKey,
    pathwayStepId: spec.pathwayStepId,
    title: spec.title,
    shortTitle: spec.shortTitle,
    description: spec.description,
    subjectKey: "mathematics",
    strandKey: PROBABILITY_CHANCE_STRAND_KEY,
    stageKey: spec.stageKey,
    parentBankKey: PROBABILITY_CHANCE_PARENT_FAMILY_KEY,
    parentBankTitle: PROBABILITY_CHANCE_PARENT_FAMILY_TITLE,
    parentItemBankKey: PROBABILITY_CHANCE_ITEM_BANK_KEY,
    progressionBandKey: PROBABILITY_CHANCE_PARENT_FAMILY_KEY,
    sourceRoute: PROBABILITY_CHANCE_SOURCE_ROUTE,
    depthOptions: NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
    items: Array.isArray(spec.cases)
      ? spec.cases.map((item, index) => makeItem(spec, item, index))
      : [],
  }));

export function getProbabilityChanceStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
) {
  const stepAssessmentKey = safe(context.stepAssessmentKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    PROBABILITY_CHANCE_STEP_ASSESSMENTS.find(
      (assessment) =>
        (stepAssessmentKey && assessment.key === stepAssessmentKey) ||
        (pathwayStepId && assessment.pathwayStepId === pathwayStepId) ||
        (stepKey && assessment.stepKey === stepKey),
    ) || null
  );
}

export function getProbabilityChanceStepAssessmentItemsForDepth(
  assessmentKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const assessment =
    PROBABILITY_CHANCE_STEP_ASSESSMENTS.find(
      (candidate) => candidate.key === assessmentKey,
    ) || null;

  if (!assessment) return [];

  return assessment.items.slice(0, getNumberStepAssessmentDepthItemCount(depth));
}
