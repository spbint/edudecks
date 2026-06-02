import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentDepthItemCount,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export const FINANCIAL_REAL_WORLD_STRAND_KEY =
  "financial-and-real-world-mathematics";
export const FINANCIAL_REAL_WORLD_PARENT_FAMILY_KEY =
  "financial-and-real-world-mathematics";
export const FINANCIAL_REAL_WORLD_PARENT_FAMILY_TITLE =
  "Financial and real-world mathematics";
export const FINANCIAL_REAL_WORLD_ITEM_BANK_KEY =
  "financial-real-world-step-assessment-items-v1";
export const FINANCIAL_REAL_WORLD_SOURCE_ROUTE = "/assessments/number";

type FinancialCase = {
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

export type FinancialRealWorldStepSpec = {
  order: number;
  stepNumber: number;
  stageKey: CleanAssessmentStageKey;
  stageTitle: string;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  cases: FinancialCase[];
};

export type FinancialRealWorldStepAssessment = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof FINANCIAL_REAL_WORLD_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentBankKey: typeof FINANCIAL_REAL_WORLD_PARENT_FAMILY_KEY;
  parentBankTitle: typeof FINANCIAL_REAL_WORLD_PARENT_FAMILY_TITLE;
  parentItemBankKey: typeof FINANCIAL_REAL_WORLD_ITEM_BANK_KEY;
  progressionBandKey: typeof FINANCIAL_REAL_WORLD_PARENT_FAMILY_KEY;
  sourceRoute: typeof FINANCIAL_REAL_WORLD_SOURCE_ROUTE;
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
): FinancialCase {
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

function itemId(spec: FinancialRealWorldStepSpec, index: number) {
  return `financial-real-world-step-${spec.order}-assess-${String(
    index + 1,
  ).padStart(3, "0")}`;
}

function makeItem(
  spec: FinancialRealWorldStepSpec,
  item: FinancialCase,
  index: number,
): NumberAssessmentBankItem {
  return {
    id: itemId(spec, index),
    progressionBandKey: FINANCIAL_REAL_WORLD_PARENT_FAMILY_KEY,
    progressionStepKey: spec.stepKey,
    subElementKey: item.cluster,
    subElementTitle: item.clusterTitle,
    subElementDescription: spec.description,
    title: item.title,
    prompt: item.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "financial_real_world_context_card",
    options: item.options,
    expectedAnswer: item.answer,
    acceptableAnswers: [item.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: item.answer,
    misconceptionTargets: item.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: spec.stepKey,
      ifCorrectGoToStepKey: spec.stepKey,
      practiceRecommendation: `Practise ${spec.shortTitle.toLowerCase()} with money, price, budget, receipt, value-comparison, and decision cards.`,
      diagnosticNote: `Checks whether the learner can use ${spec.shortTitle.toLowerCase()} for this exact pathway step.`,
    },
    visualSupport: visual(item.visual),
  };
}

const FINANCIAL_STEP_TITLES: Array<
  [string, string, CleanAssessmentStageKey, string, number, string, string]
> = [
  ["Recognise money and simple exchange in play", "recognise-money-and-simple-exchange-in-play", "foundation-kindergarten", "Foundation / Kindergarten", 1, "Money and simple exchange", "Recognise familiar money, paying, trading, and simple value language in play and everyday routines."],
  ["Compare simple wants, needs, and choices", "compare-simple-wants-needs-and-choices", "foundation-kindergarten", "Foundation / Kindergarten", 2, "Wants, needs, and choices", "Compare simple choices and explain basic reasons about value, usefulness, and limits."],
  ["Use money amounts in simple practical tasks", "use-money-amounts-in-simple-practical-tasks", "lower-primary", "Lower Primary", 1, "Simple money amounts", "Recognise, combine, and compare familiar money amounts in practical contexts."],
  ["Talk about saving, spending, and choosing", "talk-about-saving-spending-and-choosing", "lower-primary", "Lower Primary", 2, "Saving, spending, and choosing", "Use early financial language to think about keeping, spending, waiting, and choosing."],
  ["Plan simple budgets and spending choices", "plan-simple-budgets-and-spending-choices", "middle-primary", "Middle Primary", 1, "Simple budgets", "Use totals, subtraction, and comparison to make choices within a spending limit."],
  ["Compare value and change in practical situations", "compare-value-and-change-in-practical-situations", "middle-primary", "Middle Primary", 2, "Value and change", "Use subtraction and unit comparison to reason about value and what remains after spending."],
  ["Use percentages and comparisons in shopping decisions", "use-percentages-and-comparisons-in-shopping-decisions", "upper-primary", "Upper Primary", 1, "Shopping percentages and comparisons", "Apply discounts, percentage ideas, and per-unit comparisons to decide which option is better value."],
  ["Plan savings or spending over time", "plan-savings-or-spending-over-time", "upper-primary", "Upper Primary", 2, "Savings or spending over time", "Use number, operations, and time thinking to plan toward a goal or manage staged choices."],
  ["Use several mathematical ideas in financial decisions", "use-several-mathematical-ideas-in-financial-decisions", "lower-secondary", "Lower Secondary", 1, "Integrated financial decisions", "Combine percentages, ratio, comparison, and data to judge cost, value, and trade-offs."],
  ["Interpret financial information critically", "interpret-financial-information-critically", "lower-secondary", "Lower Secondary", 2, "Critical financial interpretation", "Look beyond headline figures and question what a deal, plan, or comparison means in context."],
  ["Use financial mathematics in realistic planning", "use-financial-mathematics-in-realistic-planning", "years-9-10-consolidation", "Years 9-10 / consolidation", 1, "Realistic financial planning", "Apply financial reasoning to broader planning tasks with several constraints, options, and consequences."],
  ["Refine judgement, explanation, and evidence use in finance", "refine-judgement-explanation-and-evidence-use-in-finance", "years-9-10-consolidation", "Years 9-10 / consolidation", 2, "Financial judgement and evidence", "Communicate financial decisions clearly and judge whether a claim, budget, or option is reasonable."],
];

const CASE_BUILDERS: Array<() => FinancialCase[]> = [
  () => [
    makeCase("Shop play payment", "Which picture shows paying for an item?", "Find the card where money is given for something.", ["coin for apple", "shoe beside book", "empty basket"], "coin for apple", numbers("Shop play cards.", ["coin", "apple", "basket"]), "exchange", "Exchange", ["money-as-object-only"]),
    makeCase("Trade card", "Which action is a trade?", "Choose the swap.", ["give one token and get a sticker", "look at a sticker", "put toys away"], "give one token and get a sticker", groups("Token exchange.", [1, 1], ["token", "sticker"]), "exchange", "Exchange", ["trade-vs-looking"]),
    makeCase("Costs more", "A big toy costs more than a sticker. Which costs more?", "Compare the value words.", ["big toy", "sticker", "same"], "big toy", numbers("Price tags.", ["toy $$$", "sticker $"]), "compare-value", "Compare value", ["more-less-language"]),
    makeCase("Money use", "What is money used for in a shop?", "Think about buying.", ["paying for things", "measuring height", "telling time"], "paying for things", numbers("Shop context.", ["pay", "buy"]), "money-purpose", "Money purpose", ["context-vocabulary-gap"]),
    makeCase("Choose with tokens", "You have one token. Which choice can you get if each item needs one token?", "One token pays for one one-token item.", ["one sticker", "two stickers", "three stickers"], "one sticker", groups("One token choice.", [1], ["token"]), "exchange", "Exchange", ["one-to-many-confusion"]),
    makeCase("Free item", "Which item costs no tokens?", "Look for the zero label.", ["card marked 0 tokens", "card marked 2 tokens", "card marked 5 tokens"], "card marked 0 tokens", numbers("Token price tags.", ["0", "2", "5"]), "price-tags", "Price tags", ["zero-value-gap"]),
    makeCase("Simple value", "Which has greater value in shop play?", "Compare the price tags.", ["5-token car", "1-token pencil", "2-token sticker"], "5-token car", numbers("Price tags.", ["5 tokens", "1 token", "2 tokens"]), "compare-value", "Compare value", ["largest-tag-gap"]),
    makeCase("Pay or keep", "If you give away your only coin to buy a snack, what happens?", "The coin is spent.", ["you no longer have that coin", "you get two coins", "the coin grows"], "you no longer have that coin", groups("Spend one coin.", [1], ["coin spent"]), "spending", "Spending", ["spending-increases-money"]),
    makeCase("Exchange match", "Which matches: two tokens for a toy?", "Choose the matching token card.", ["2 tokens -> toy", "1 token -> toy", "0 tokens -> toy"], "2 tokens -> toy", groups("Two-token exchange.", [1, 1], ["token", "token"]), "exchange", "Exchange", ["token-count-error"]),
    makeCase("More or less", "Which phrase means a lower price?", "Use price language.", ["costs less", "costs more", "same price"], "costs less", numbers("Price language.", ["less", "more"]), "language", "Financial language", ["language-reversal"]),
    makeCase("Buying choice", "You can choose one item. Which action is a buying choice?", "Pick one item and pay for it.", ["choose a cup and pay a coin", "count clouds", "draw a line"], "choose a cup and pay a coin", numbers("Choice cards.", ["cup", "coin"]), "choice", "Choice", ["irrelevant-context"]),
    makeCase("Fair exchange", "A shop sign says 1 token = 1 turn. Which is fair?", "Match one token to one turn.", ["pay 1 token for 1 turn", "pay 1 token for no turn", "take 3 turns for free"], "pay 1 token for 1 turn", numbers("Token rule.", ["1 token", "1 turn"]), "exchange", "Exchange", ["rule-match-gap"]),
  ],
  () => [
    makeCase("Need or want", "Which is usually a need?", "Choose the thing people need.", ["water", "extra toy", "party balloon"], "water", numbers("Need and want cards.", ["water", "toy", "balloon"]), "needs-wants", "Needs and wants", ["want-need-confusion"]),
    makeCase("Limited choice", "You can pick one snack. What should you do?", "A limit means choose one.", ["choose one snack", "take every snack", "ignore the choice"], "choose one snack", groups("One-choice card.", [1], ["choice"]), "limits", "Limits", ["limit-ignored"]),
    makeCase("Useful choice", "Which is more useful for rain?", "Choose the practical option.", ["umbrella", "sand bucket", "party hat"], "umbrella", numbers("Rain choice.", ["umbrella", "bucket", "hat"]), "usefulness", "Usefulness", ["irrelevant-feature"]),
    makeCase("Better value", "Two stickers cost one token. One sticker costs one token. Which gives more stickers for one token?", "Compare what you get for the same token.", ["two stickers", "one sticker", "neither"], "two stickers", groups("Sticker choices.", [2, 1], ["two", "one"]), "value", "Value", ["same-price-value-gap"]),
    makeCase("Choose reason", "Which reason is about value?", "Value compares what you get with what it costs.", ["it gives more for the same token", "it is near the door", "it is blue"], "it gives more for the same token", numbers("Reason cards.", ["more", "same token"]), "reasoning", "Choice reasoning", ["non-mathematical-reason"]),
    makeCase("Want card", "Which is usually a want, not a need?", "Think about what is nice but not necessary.", ["new toy", "food", "water"], "new toy", numbers("Wants and needs.", ["toy", "food", "water"]), "needs-wants", "Needs and wants", ["need-want-gap"]),
    makeCase("Cannot choose all", "Why might you choose only one item?", "The choice is limited.", ["there is only enough for one", "numbers do not matter", "all items are free"], "there is only enough for one", numbers("Limit card.", ["enough for 1"]), "limits", "Limits", ["resource-limit-gap"]),
    makeCase("Best snack choice", "You want fruit. Which choice fits?", "Match the goal.", ["apple", "toy car", "crayon"], "apple", numbers("Choice cards.", ["apple", "car", "crayon"]), "choice", "Choice", ["goal-not-used"]),
    makeCase("Compare options", "Which choice gives more books?", "Compare the amounts.", ["3 books", "1 book", "0 books"], "3 books", groups("Book choices.", [3, 1, 0], ["A", "B", "C"]), "compare", "Compare choices", ["amount-comparison-gap"]),
    makeCase("Saving choice", "You want a bigger prize later. Which choice helps?", "Waiting can help save tokens.", ["save the token", "spend every token now", "throw it away"], "save the token", numbers("Token plan.", ["save", "spend"]), "saving", "Saving", ["saving-purpose-gap"]),
    makeCase("Explain choice", "Which explanation is strongest?", "Give a reason connected to the choice.", ["I chose it because it lasts longer", "I chose it because I blinked", "I chose it for no reason"], "I chose it because it lasts longer", numbers("Reason cards.", ["lasts longer"]), "reasoning", "Choice reasoning", ["weak-explanation"]),
    makeCase("Same cost choice", "Both items cost one token. Which question helps decide?", "If costs match, compare usefulness.", ["Which will I use more?", "Which is heavier to say?", "Which word is shorter?"], "Which will I use more?", numbers("Same cost.", ["1 token", "1 token"]), "choice", "Choice", ["irrelevant-comparison"]),
  ],
  () => [
    makeCase("Coin total", "Which amount matches $2 + $1?", "Add the dollar amounts.", ["$3", "$2", "$1"], "$3", groups("Dollar coins.", [2, 1], ["$2", "$1"]), "money-amounts", "Money amounts", ["coin-count-vs-value"]),
    makeCase("Price compare", "Which price is cheaper: $4 or $6?", "Cheaper means the smaller cost.", ["$4", "$6", "same"], "$4", numbers("Price tags.", ["$4", "$6"]), "compare-costs", "Compare costs", ["cheaper-larger-confusion"]),
    makeCase("Enough money", "You have $5. A book costs $4. Do you have enough?", "Compare $5 with $4.", ["yes", "no", "only if it is free"], "yes", numbers("Money and price.", ["have $5", "cost $4"]), "enough-money", "Enough money", ["budget-comparison-gap"]),
    makeCase("Simple total", "A pencil costs $2 and a rubber costs $3. How much altogether?", "Add the two prices.", ["$5", "$1", "$6"], "$5", groups("Shop total.", [2, 3], ["pencil", "rubber"]), "totals", "Totals", ["adds-wrong-values"]),
    makeCase("Money notation", "Which shows three dollars?", "Match the amount.", ["$3", "3c", "$30"], "$3", numbers("Money notation.", ["$3", "3c", "$30"]), "money-notation", "Money notation", ["dollars-cents-confusion"]),
    makeCase("Coin combination", "Which combination makes $4?", "Add the coin values.", ["$2 + $2", "$1 + $2", "$5 + $1"], "$2 + $2", groups("Coin combinations.", [2, 2], ["$2", "$2"]), "money-amounts", "Money amounts", ["combination-error"]),
    makeCase("More money", "Which amount is more: $8 or $5?", "Compare the dollar amounts.", ["$8", "$5", "same"], "$8", numbers("Money amounts.", ["$8", "$5"]), "compare-costs", "Compare costs", ["amount-order-error"]),
    makeCase("Buy one item", "You have $3. Which item can you buy?", "Choose an item that costs $3 or less.", ["hat $2", "game $5", "bag $4"], "hat $2", numbers("Price tags.", ["hat $2", "game $5", "bag $4"]), "enough-money", "Enough money", ["ignores-limit"]),
    makeCase("Find total", "Which number sentence matches: $1, $1, and $2?", "Add all three amounts.", ["1 + 1 + 2 = 4", "1 + 2 = 3", "2 - 1 = 1"], "1 + 1 + 2 = 4", groups("Money total.", [1, 1, 2], ["$1", "$1", "$2"]), "totals", "Totals", ["missing-addend"]),
    makeCase("Same amount", "Which amount is the same as five $1 coins?", "Five one-dollar coins make five dollars.", ["$5", "$1", "$10"], "$5", groups("Five $1 coins.", [1, 1, 1, 1, 1], ["$1", "$1", "$1", "$1", "$1"]), "equivalent-amounts", "Equivalent amounts", ["coin-count-gap"]),
    makeCase("Practical choice", "A snack is $2 and a drink is $2. Which total is right?", "Add $2 and $2.", ["$4", "$2", "$22"], "$4", groups("Snack and drink.", [2, 2], ["snack", "drink"]), "totals", "Totals", ["concatenates-digits"]),
    makeCase("Money statement", "Which statement is true?", "Compare the amounts.", ["$9 is more than $7", "$7 is more than $9", "$9 equals $7"], "$9 is more than $7", numbers("Compare amounts.", ["$9", "$7"]), "compare-costs", "Compare costs", ["comparison-language-gap"]),
  ],
  () => [
    makeCase("Spend or save", "You have $10 and spend $4. What happens to your money?", "Spending lowers the amount you have.", ["you have less money", "you have more money", "nothing changes"], "you have less money", numbers("Spend card.", ["$10", "spend $4"]), "spending", "Spending", ["spending-increases-money"]),
    makeCase("Saving goal", "You save $2 each week for 3 weeks. How much do you save?", "Add equal weekly amounts.", ["$6", "$5", "$3"], "$6", groups("Weekly saving.", [2, 2, 2], ["week", "week", "week"]), "saving", "Saving", ["repeated-addition-error"]),
    makeCase("Wait or buy", "You want a $9 item and have $5. Which choice helps?", "You need more money before buying.", ["save more money", "buy it now with $5", "spend the $5 on something else"], "save more money", numbers("Goal card.", ["have $5", "need $9"]), "planning", "Planning", ["budget-limit-ignored"]),
    makeCase("Left after spending", "You have $8 and spend $3. How much is left?", "Subtract the spending.", ["$5", "$11", "$3"], "$5", numbers("Money left.", ["$8", "-$3"]), "remaining", "Remaining money", ["adds-spending"]),
    makeCase("Choice reason", "Which reason supports saving?", "Saving helps with a later goal.", ["I need $4 more for the book", "I want to lose the money", "money cannot be counted"], "I need $4 more for the book", numbers("Saving reason.", ["goal", "$4 more"]), "reasoning", "Financial reasoning", ["weak-financial-reason"]),
    makeCase("Pocket money", "You get $3 and save $1. How much can you spend now?", "The saved amount is not spent now.", ["$2", "$3", "$4"], "$2", groups("Pocket money split.", [1, 2], ["save", "spend"]), "saving-spending", "Saving and spending", ["save-spend-total-confusion"]),
    makeCase("Better plan", "Which plan reaches $12 fastest?", "Compare weekly savings.", ["save $4 each week", "save $2 each week", "save $1 each week"], "save $4 each week", numbers("Savings rates.", ["$4/wk", "$2/wk", "$1/wk"]), "planning", "Planning", ["rate-comparison-gap"]),
    makeCase("Spending choice", "You need lunch and want a toy. Which should usually come first?", "Needs usually come before wants.", ["lunch", "toy", "neither"], "lunch", numbers("Need and want.", ["lunch", "toy"]), "needs-wants", "Needs and wants", ["priority-gap"]),
    makeCase("Change plan", "You planned to save $5, but saved $3. What changed?", "The saved amount is $2 less.", ["saved $2 less", "saved $2 more", "saved the same"], "saved $2 less", numbers("Savings change.", ["planned $5", "saved $3"]), "planning", "Planning", ["difference-direction-error"]),
    makeCase("Spending limit", "You can spend up to $6. Which basket fits?", "Choose a total no more than $6.", ["$2 + $3", "$4 + $4", "$6 + $2"], "$2 + $3", groups("Basket totals.", [2, 3], ["item", "item"]), "budget-limit", "Budget limit", ["over-budget-choice"]),
    makeCase("Delayed choice", "Why might someone wait before buying?", "Waiting can help save enough.", ["to save enough money", "to make the price invisible", "because totals do not matter"], "to save enough money", numbers("Wait and save.", ["goal", "save"]), "saving", "Saving", ["waiting-purpose-gap"]),
    makeCase("Track spending", "Which record helps track spending?", "Use a list or table of amounts.", ["spending list", "weather picture", "shape poster"], "spending list", numbers("Record choices.", ["spending", "amounts"]), "records", "Financial records", ["record-purpose-gap"]),
  ],
];

const MIDDLE_AND_LATER_CASES: FinancialCase[] = [
  makeCase("Budget fit", "You have $20. Which basket fits the budget?", "Add the prices and compare with $20.", ["$8 + $7", "$12 + $11", "$19 + $3"], "$8 + $7", numbers("Budget baskets.", ["$8+$7", "$12+$11", "$19+$3"]), "budgeting", "Budgeting", ["over-budget-choice"]),
  makeCase("Change due", "A total is $13. You pay $20. How much change?", "Subtract the total from the payment.", ["$7", "$33", "$13"], "$7", numbers("Receipt card.", ["pay $20", "cost $13"]), "change", "Change", ["adds-payment-cost"]),
  makeCase("Best value", "Which is better value: 4 pens for $8 or 3 pens for $9?", "Compare cost per pen.", ["4 pens for $8", "3 pens for $9", "same value"], "4 pens for $8", numbers("Unit price.", ["$2 each", "$3 each"]), "value", "Value comparison", ["compares-pack-price-only"]),
  makeCase("Discount amount", "A $40 jacket is 25% off. What is the discount?", "A quarter of $40 is $10.", ["$10", "$25", "$30"], "$10", groups("Discount model.", [10, 30], ["discount", "sale price"]), "discounts", "Discounts", ["discount-vs-sale-price"]),
  makeCase("Sale price", "A $50 item has $15 off. What is the sale price?", "Subtract the discount.", ["$35", "$65", "$15"], "$35", numbers("Sale tag.", ["$50", "-$15"]), "discounts", "Discounts", ["uses-discount-as-final"]),
  makeCase("Savings plan", "Save $12 each week for 5 weeks. How much is saved?", "Multiply weeks by weekly saving.", ["$60", "$17", "$50"], "$60", groups("Savings table.", [12, 12, 12, 12, 12], ["w1", "w2", "w3", "w4", "w5"]), "planning", "Planning", ["repeated-addition-gap"]),
  makeCase("Budget leftover", "A $75 budget spends $28 and $22. How much remains?", "Add spending, then subtract from the budget.", ["$25", "$50", "$125"], "$25", numbers("Budget table.", ["$75", "$28", "$22"]), "budgeting", "Budgeting", ["one-step-only"]),
  makeCase("Unit price", "Which has the lower unit price: 2 kg for $10 or 3 kg for $18?", "Compare dollars per kg.", ["2 kg for $10", "3 kg for $18", "same"], "2 kg for $10", numbers("Unit prices.", ["$5/kg", "$6/kg"]), "unit-price", "Unit price", ["total-price-comparison"]),
  makeCase("Claim check", "A sign says 'Half price: was $80, now $50'. What is wrong?", "Half of $80 is $40.", ["$50 is not half of $80", "$50 is free", "$80 is less than $50"], "$50 is not half of $80", numbers("Sale claim.", ["was $80", "now $50", "half=$40"]), "critique", "Financial critique", ["headline-trust-gap"]),
  makeCase("Phone plan", "Plan A is $24 for 6 GB. Plan B is $30 for 10 GB. Which is lower cost per GB?", "Compare unit prices.", ["Plan B", "Plan A", "same"], "Plan B", numbers("Plan table.", ["A $4/GB", "B $3/GB"]), "unit-price", "Unit price", ["total-cost-only"]),
  makeCase("Profit", "Bought for $80 and sold for $92. What is the profit?", "Subtract cost from selling price.", ["$12", "$172", "$80"], "$12", numbers("Profit card.", ["sell $92", "cost $80"]), "profit-loss", "Profit and loss", ["adds-cost-selling"]),
  makeCase("Interest", "5% of $200 is how much?", "Find 5 out of each 100 dollars.", ["$10", "$5", "$40"], "$10", groups("Interest model.", [5, 5, 95, 95], ["5%", "5%", "rest", "rest"]), "interest", "Interest", ["percent-of-whole-gap"]),
  makeCase("Compare plans", "Which information is missing before choosing a holiday plan?", "Check the full cost and conditions.", ["extra fees", "the colour of the brochure", "the font size"], "extra fees", numbers("Plan checklist.", ["price", "fees", "conditions"]), "critical-reading", "Critical reading", ["irrelevant-feature"]),
  makeCase("Reasonable cost", "A weekly bus pass is $300 for one local trip. Which judgement is reasonable?", "Use real-world benchmarks.", ["probably too high", "definitely free", "too low for any transport"], "probably too high", numbers("Reasonableness card.", ["$300", "one local trip"]), "reasonableness", "Reasonableness", ["benchmark-not-used"]),
  makeCase("Revise budget", "A plan had $120 for food. The cost rises by $15. What is the new food amount?", "Add the increase.", ["$135", "$105", "$15"], "$135", numbers("Budget revision.", ["$120", "+$15"]), "revision", "Revise plans", ["change-direction-error"]),
  makeCase("Evidence choice", "Which statement is best supported by a table showing $4/kg and $6/kg?", "Use the unit prices.", ["$4/kg is cheaper per kg", "$6/kg is cheaper", "unit price is not useful"], "$4/kg is cheaper per kg", numbers("Unit-price table.", ["$4/kg", "$6/kg"]), "evidence", "Evidence", ["evidence-not-used"]),
];

function middleAndLaterCases(offset: number) {
  return MIDDLE_AND_LATER_CASES.slice(offset, offset + 12).concat(
    MIDDLE_AND_LATER_CASES.slice(0, Math.max(0, offset + 12 - MIDDLE_AND_LATER_CASES.length)),
  );
}

const LATER_CASE_BUILDERS: Array<() => FinancialCase[]> = [
  () => middleAndLaterCases(0),
  () => middleAndLaterCases(1),
  () => middleAndLaterCases(2),
  () => middleAndLaterCases(3),
  () => middleAndLaterCases(4),
  () => middleAndLaterCases(5),
  () => middleAndLaterCases(6),
  () => middleAndLaterCases(7),
];

export const FINANCIAL_REAL_WORLD_STEP_SPECS: FinancialRealWorldStepSpec[] =
  FINANCIAL_STEP_TITLES.map(
    ([title, stepKey, stageKey, stageTitle, stepNumber, shortTitle, description], index) => ({
      order: index + 1,
      stepNumber,
      stageKey,
      stageTitle,
      stepKey,
      pathwayStepId: `mathematics::financial-and-real-world-mathematics::${stageKey}::${stepKey}`,
      title,
      shortTitle,
      description,
      cases: (CASE_BUILDERS[index] || LATER_CASE_BUILDERS[index - CASE_BUILDERS.length])?.() ?? [],
    }),
  );

export const FINANCIAL_REAL_WORLD_STEP_ASSESSMENTS: FinancialRealWorldStepAssessment[] =
  FINANCIAL_REAL_WORLD_STEP_SPECS.map((spec) => ({
    key: `financial-real-world-step-${spec.order}-${spec.stepKey}-assessment-v1`,
    stepNumber: spec.stepNumber,
    stepKey: spec.stepKey,
    pathwayStepId: spec.pathwayStepId,
    title: spec.title,
    shortTitle: spec.shortTitle,
    description: spec.description,
    subjectKey: "mathematics",
    strandKey: FINANCIAL_REAL_WORLD_STRAND_KEY,
    stageKey: spec.stageKey,
    parentBankKey: FINANCIAL_REAL_WORLD_PARENT_FAMILY_KEY,
    parentBankTitle: FINANCIAL_REAL_WORLD_PARENT_FAMILY_TITLE,
    parentItemBankKey: FINANCIAL_REAL_WORLD_ITEM_BANK_KEY,
    progressionBandKey: FINANCIAL_REAL_WORLD_PARENT_FAMILY_KEY,
    sourceRoute: FINANCIAL_REAL_WORLD_SOURCE_ROUTE,
    depthOptions: NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
    items: Array.isArray(spec.cases)
      ? spec.cases.map((item, index) => makeItem(spec, item, index))
      : [],
  }));

export function getFinancialRealWorldStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
) {
  const stepAssessmentKey = safe(context.stepAssessmentKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    FINANCIAL_REAL_WORLD_STEP_ASSESSMENTS.find(
      (assessment) =>
        (stepAssessmentKey && assessment.key === stepAssessmentKey) ||
        (pathwayStepId && assessment.pathwayStepId === pathwayStepId) ||
        (stepKey && assessment.stepKey === stepKey),
    ) || null
  );
}

export function getFinancialRealWorldStepAssessmentItemsForDepth(
  assessmentKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const assessment =
    FINANCIAL_REAL_WORLD_STEP_ASSESSMENTS.find(
      (candidate) => candidate.key === assessmentKey,
    ) || null;

  if (!assessment) return [];

  return assessment.items.slice(0, getNumberStepAssessmentDepthItemCount(depth));
}
