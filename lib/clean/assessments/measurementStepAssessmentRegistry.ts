import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentDepthItemCount,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export const MEASUREMENT_STRAND_KEY = "measurement";
export const MEASUREMENT_PARENT_FAMILY_KEY = "measurement-foundations";
export const MEASUREMENT_PARENT_FAMILY_TITLE = "Measurement";
export const MEASUREMENT_ITEM_BANK_KEY = "measurement-step-assessment-items-v1";
export const MEASUREMENT_SOURCE_ROUTE = "/assessments/number";

type MeasurementCase = {
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

type RawMeasurementCase = [
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

export type MeasurementStepSpec = {
  order: number;
  stepNumber: number;
  stageKey: CleanAssessmentStageKey;
  stageTitle: string;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  cases: MeasurementCase[];
};

export type MeasurementStepAssessment = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof MEASUREMENT_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentBankKey: typeof MEASUREMENT_PARENT_FAMILY_KEY;
  parentBankTitle: typeof MEASUREMENT_PARENT_FAMILY_TITLE;
  parentItemBankKey: typeof MEASUREMENT_ITEM_BANK_KEY;
  progressionBandKey: typeof MEASUREMENT_PARENT_FAMILY_KEY;
  sourceRoute: typeof MEASUREMENT_SOURCE_ROUTE;
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
]: RawMeasurementCase): MeasurementCase {
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

function itemId(spec: MeasurementStepSpec, index: number) {
  return `measurement-step-${spec.order}-assess-${String(index + 1).padStart(
    3,
    "0",
  )}`;
}

function makeItem(
  spec: MeasurementStepSpec,
  item: MeasurementCase,
  index: number,
): NumberAssessmentBankItem {
  return {
    id: itemId(spec, index),
    progressionBandKey: MEASUREMENT_PARENT_FAMILY_KEY,
    progressionStepKey: spec.stepKey,
    subElementKey: item.cluster,
    subElementTitle: item.clusterTitle,
    subElementDescription: spec.description,
    title: item.title,
    prompt: item.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "measurement_visual_card",
    options: item.options,
    expectedAnswer: item.answer,
    acceptableAnswers: [item.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: item.answer,
    misconceptionTargets: item.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: spec.stepKey,
      ifCorrectGoToStepKey: spec.stepKey,
      practiceRecommendation: `Practise ${spec.shortTitle.toLowerCase()} with measuring strips, clocks, grids, unit cards, and practical context models.`,
      diagnosticNote: `Checks whether the learner can use ${spec.shortTitle.toLowerCase()} for this exact pathway step.`,
    },
    visualSupport: visual(item.visual),
  };
}

const MEASUREMENT_STEP_TITLES: Array<
  [string, string, CleanAssessmentStageKey, string, number, string, string]
> = [
  ["Compare everyday attributes directly", "compare-everyday-attributes-directly", "foundation-kindergarten", "Foundation / Kindergarten", 1, "Direct attribute comparison", "Compare everyday objects directly by length, mass, capacity, time, or amount."],
  ["Use everyday time and money language in context", "use-everyday-time-and-money-language-in-context", "foundation-kindergarten", "Foundation / Kindergarten", 2, "Everyday time and money language", "Use routine time and money language in practical contexts."],
  ["Measure with informal and early standard units", "measure-with-informal-and-early-standard-units", "lower-primary", "Lower Primary", 1, "Informal and early standard units", "Measure by repeating units consistently and recording the result clearly."],
  ["Read and use familiar time and money measures", "read-and-use-familiar-time-and-money-measures", "lower-primary", "Lower Primary", 2, "Familiar time and money measures", "Read and use clocks, calendars, coins, notes, and simple costs in context."],
  ["Choose suitable standard units and measuring tools", "choose-suitable-standard-units-and-measuring-tools", "middle-primary", "Middle Primary", 1, "Units and measuring tools", "Choose suitable units and tools and use them with practical accuracy."],
  ["Estimate and check practical measurements", "estimate-and-check-practical-measurements", "middle-primary", "Middle Primary", 2, "Estimate and check measurements", "Use estimates to judge whether practical measurement results are reasonable."],
  ["Use measurement calculations in practical tasks", "use-measurement-calculations-in-practical-tasks", "upper-primary", "Upper Primary", 1, "Measurement calculations", "Use calculation in practical measurement tasks involving space, time, quantity, and change."],
  ["Use fractions, decimals, and conversions in measurement", "use-fractions-decimals-and-conversions-in-measurement", "upper-primary", "Upper Primary", 2, "Fractional, decimal, and converted measures", "Use decimal, fractional, and converted measures reliably in practical tasks."],
  ["Choose precision and conversions purposefully", "choose-precision-and-conversions-purposefully", "lower-secondary", "Lower Secondary", 1, "Precision and conversions", "Choose appropriate precision and convert units for purposeful measurement reasoning."],
  ["Apply measurement reasoning in design and science contexts", "apply-measurement-reasoning-in-design-and-science-contexts", "lower-secondary", "Lower Secondary", 2, "Design and science measurement reasoning", "Use measurement to justify design, science, and planning decisions."],
  ["Use measurement confidently in modelling and design", "use-measurement-confidently-in-modelling-and-design", "years-9-10-consolidation", "Years 9-10 / consolidation", 1, "Measurement modelling and design", "Use measurement as part of practical modelling, design, and planning."],
  ["Refine judgement about reasonableness and accuracy", "refine-judgement-about-reasonableness-and-accuracy", "years-9-10-consolidation", "Years 9-10 / consolidation", 2, "Reasonableness and accuracy judgement", "Critique units, precision, and measurement results for real contexts."],
];

const RAW_MEASUREMENT_CASES: RawMeasurementCase[][] = [
  [
    ["Ruler or pencil", "Section 1 - Which Is Longer? Compare the ruler and the pencil. Which is longer?", "Look at the two objects side by side and choose the longer one.", ["ruler", "pencil", "same length"], "ruler", groups("Ruler is longer than pencil.", [9, 5], ["ruler", "pencil"]), "length", "Which is longer?", ["compares-object-name-not-length"]],
    ["Snake or caterpillar", "Section 1 - Which Is Longer? Compare the snake and the caterpillar. Which is longer?", "Look from end to end and choose the longer animal.", ["snake", "caterpillar", "same length"], "snake", groups("Snake is longer than caterpillar.", [10, 4], ["snake", "caterpillar"]), "length", "Which is longer?", ["selects-shorter"]],
    ["Crayon or scissors", "Section 1 - Which Is Longer? Compare the crayon and the scissors. Which is shorter?", "This time choose the shorter object.", ["crayon", "scissors", "same length"], "crayon", groups("Crayon is shorter than scissors.", [4, 7], ["crayon", "scissors"]), "length", "Which is shorter?", ["selects-longer"]],
    ["Tree or flower", "Section 2 - Which Is Taller? Compare the tree and the flower. Which is taller?", "Compare how high each one reaches.", ["tree", "flower", "same height"], "tree", groups("Tree is taller than flower.", [10, 3], ["tree", "flower"]), "height", "Which is taller?", ["height-language-confusion"]],
    ["Giraffe or dog", "Section 2 - Which Is Taller? Compare the giraffe and the dog. Which is shorter?", "Choose the animal that is not as tall.", ["dog", "giraffe", "same height"], "dog", groups("Dog is shorter than giraffe.", [4, 10], ["dog", "giraffe"]), "height", "Which is shorter?", ["selects-taller"]],
    ["House or car", "Section 2 - Which Is Taller? Compare the house and the car. Which is taller?", "Look at the top of each object.", ["house", "car", "same height"], "house", groups("House is taller than car.", [9, 4], ["house", "car"]), "height", "Which is taller?", ["compares-width-not-height"]],
    ["Glass or bucket", "Section 3 - Which Holds More? Compare the drink glass and the bucket. Which holds more?", "Think about which container can hold more.", ["bucket", "drink glass", "same amount"], "bucket", groups("Bucket holds more than drink glass.", [10, 3], ["bucket", "glass"]), "capacity", "Which holds more?", ["height-only-capacity"]],
    ["Cup or jar", "Section 3 - Which Holds More? Compare the cup and the jar. Which holds less?", "Choose the container that can hold less.", ["cup", "jar", "same amount"], "cup", groups("Cup holds less than jar.", [4, 8], ["cup", "jar"]), "capacity", "Which holds less?", ["selects-more"]],
    ["Watermelon or strawberry", "Section 4 - Heavier or Lighter? Compare the watermelon and the strawberry. Which is heavier?", "Think about which one would feel heavier to hold.", ["watermelon", "strawberry", "same mass"], "watermelon", groups("Watermelon is heavier than strawberry.", [10, 1], ["watermelon", "strawberry"]), "mass", "Heavier or lighter?", ["small-large-mass-confusion"]],
    ["Elephant or mouse", "Section 4 - Heavier or Lighter? Compare the elephant and the mouse. Which is lighter?", "Choose the animal that would feel lighter.", ["mouse", "elephant", "same mass"], "mouse", groups("Mouse is lighter than elephant.", [1, 10], ["mouse", "elephant"]), "mass", "Heavier or lighter?", ["large-means-answer"]],
    ["Same pencils", "Section 5 - Same or Different? Two pencils match in length. What should you choose?", "Look for whether the pair matches.", ["same", "different", "heavier"], "same", groups("Two equal pencils.", [6, 6], ["pencil", "pencil"]), "same-different", "Same or different?", ["same-different-confusion"]],
    ["Draw the bigger bucket", "Section 6 - Draw the Bigger One: Which choice shows a bigger bucket?", "Choose the picture that would match drawing a bigger bucket.", ["the bigger bucket", "the smaller bucket", "the same bucket"], "the bigger bucket", groups("Choose a bigger bucket.", [9, 4], ["bigger bucket", "smaller bucket"]), "draw-bigger", "Draw the bigger one", ["bigger-smaller-confusion"]],
  ],
  [
    ["Breakfast time word", "Section 1 - Time Words: A child is eating breakfast. Which time word fits best?", "Match the picture of breakfast to an everyday time word.", ["Morning", "Afternoon", "Evening", "Night"], "Morning", numbers("Time word picture.", ["breakfast", "morning"]), "time-words", "Time words", ["routine-word-confusion"]],
    ["Going to bed", "Section 1 - Time Words: A child is going to bed. Which time word fits best?", "Match bedtime to the everyday time word.", ["Night", "Morning", "Afternoon", "School"], "Night", numbers("Time word picture.", ["bed", "night"]), "time-words", "Time words", ["day-night-confusion"]],
    ["Going to school", "Section 1 - Time Words: A child is going to school. Which time word fits best?", "Think about when school usually starts.", ["Morning", "Night", "Dinner", "Bedtime"], "Morning", numbers("Time word picture.", ["school", "morning"]), "time-words", "Time words", ["routine-word-confusion"]],
    ["Eating dinner", "Section 1 - Time Words: A family is eating dinner. Which time word fits best?", "Match dinner to the everyday time word.", ["Evening", "Morning", "Afternoon", "School"], "Evening", numbers("Time word picture.", ["dinner", "evening"]), "time-words", "Time words", ["routine-word-confusion"]],
    ["Morning sequence", "Section 2 - What Happens First? Which event comes first: wake up, brush teeth, eat breakfast, go to school?", "Use the daily routine order from the worksheet.", ["Wake up", "Brush teeth", "Eat breakfast", "Go to school"], "Wake up", numbers("Daily sequence.", ["wake up", "brush teeth", "breakfast", "school"]), "sequence", "What happens first?", ["sequence-order-error"]],
    ["Home sequence", "Section 2 - What Happens First? Which event comes after school: school, home, dinner, bed?", "Follow the picture order from the worksheet.", ["Home", "Dinner", "Bed", "School"], "Home", numbers("Daily sequence.", ["school", "home", "dinner", "bed"]), "sequence", "What happens first?", ["sequence-order-error"]],
    ["Same time pair", "Section 3 - Same Time or Different Time? Breakfast and brushing teeth often happen in the morning. What should you choose?", "Compare whether the pictures belong to the same part of the day.", ["Same", "Different", "Costs more"], "Same", numbers("Same time pair.", ["breakfast", "brush teeth", "morning"]), "same-different-time", "Same time or different time?", ["same-different-confusion"]],
    ["Different time pair", "Section 3 - Same Time or Different Time? Going to school and going to bed happen at different times. What should you choose?", "Compare the parts of the day.", ["Different", "Same", "Costs less"], "Different", numbers("Different time pair.", ["school", "bed"]), "same-different-time", "Same time or different time?", ["same-different-confusion"]],
    ["Ten cent coin", "Section 4 - Recognise Coins: Which coin is 10 cent?", "Choose the Australian coin label shown on the worksheet.", ["10c", "20c", "50c", "$1"], "10c", numbers("Australian coin card.", ["10c", "20c", "50c", "$1"]), "coin-recognition", "Recognise coins", ["coin-label-confusion"]],
    ["One dollar coin", "Section 4 - Recognise Coins: Which coin is one dollar?", "Choose the coin label for one dollar.", ["$1", "10c", "20c", "50c"], "$1", numbers("Australian coin card.", ["10c", "20c", "50c", "$1"]), "coin-recognition", "Recognise coins", ["coin-label-confusion"]],
    ["Apple or balloon", "Section 5 - Which Costs More? An apple costs 10c and a balloon costs 20c. Which costs more?", "Compare the two price labels without adding money.", ["balloon", "apple", "same cost"], "balloon", groups("Simple cost comparison.", [10, 20], ["apple 10c", "balloon 20c"]), "costs-more-less", "Which costs more?", ["smaller-price-selected"]],
    ["Toy house or book", "Section 5 - Which Costs More? A toy house costs $10 and a book costs $3. Which costs less?", "Choose the item with the smaller price label.", ["book", "toy house", "same cost"], "book", groups("Simple cost comparison.", [10, 3], ["toy house $10", "book $3"]), "costs-more-less", "Which costs less?", ["larger-price-selected"]],
    ["Match juice box", "Section 6 - Money in Everyday Life: Which price card could match the juice box in the worksheet set?", "Match the everyday item to one of the simple money cards.", ["$1", "20c", "$10", "$5"], "$1", numbers("Everyday money match.", ["juice box", "$1"]), "money-match", "Money in everyday life", ["money-card-confusion"]],
    ["Think about money", "Section 7 - Think and Talk: Where might you use money?", "Choose the everyday place that matches the worksheet talk prompt.", ["at a shop", "inside a pillow", "under a tree"], "at a shop", numbers("Think and talk.", ["money", "shop"]), "think-and-talk", "Think and talk", ["money-context-gap"]],
  ],
  [
    ["Pencil blocks", "Section 1 - Measure with Blocks: A pencil is lined up with 6 blocks. How long is it?", "Count the blocks touching end to end.", ["6 blocks long", "5 blocks long", "6 centimetres"], "6 blocks long", groups("Pencil measured with blocks.", [1, 1, 1, 1, 1, 1], ["block", "block", "block", "block", "block", "block"]), "blocks", "Measure with blocks", ["missing-unit-label"]],
    ["Crayon blocks", "Section 1 - Measure with Blocks: A crayon is 4 blocks long. What should you write?", "Record the number and the informal unit.", ["4 blocks long", "4 paperclips long", "4 cm"], "4 blocks long", groups("Crayon measured with blocks.", [1, 1, 1, 1], ["block", "block", "block", "block"]), "blocks", "Measure with blocks", ["wrong-informal-unit"]],
    ["Book blocks", "Section 1 - Measure with Blocks: A book is 9 blocks long. Which record is clear?", "Include the block unit in the answer.", ["9 blocks long", "9", "blocks only"], "9 blocks long", groups("Book measured with blocks.", [1, 1, 1, 1, 1, 1, 1, 1, 1], ["b", "b", "b", "b", "b", "b", "b", "b", "b"]), "blocks", "Measure with blocks", ["no-unit-recorded"]],
    ["Pencil vs crayon", "Section 2 - Which Is Longer? A pencil is 6 blocks long and a crayon is 4 blocks long. Which is longer?", "Compare the two measured lengths.", ["pencil", "crayon", "same length"], "pencil", groups("Compare measured block lengths.", [6, 4], ["pencil", "crayon"]), "compare-measured-lengths", "Which is longer?", ["selects-smaller-measure"]],
    ["Book vs ruler", "Section 2 - Which Is Longer? A book is 9 blocks long and a ruler is 7 blocks long. Which is longer?", "Use the block counts to compare.", ["book", "ruler", "same length"], "book", groups("Compare measured block lengths.", [9, 7], ["book", "ruler"]), "compare-measured-lengths", "Which is longer?", ["selects-smaller-measure"]],
    ["Scissors paperclips", "Section 3 - Measure with Paperclips: Scissors are lined up with 5 paperclips. How long are they?", "Count the paperclips used as informal units.", ["5 paperclips long", "5 blocks long", "5 cm"], "5 paperclips long", groups("Scissors measured with paperclips.", [1, 1, 1, 1, 1], ["pc", "pc", "pc", "pc", "pc"]), "paperclips", "Measure with paperclips", ["wrong-informal-unit"]],
    ["Fork paperclips", "Section 3 - Measure with Paperclips: A fork is 4 paperclips long. What should you write?", "Record the number and the paperclip unit.", ["4 paperclips long", "4 blocks long", "4 rulers long"], "4 paperclips long", groups("Fork measured with paperclips.", [1, 1, 1, 1], ["pc", "pc", "pc", "pc"]), "paperclips", "Measure with paperclips", ["missing-unit-label"]],
    ["Toothbrush paperclips", "Section 3 - Measure with Paperclips: A toothbrush is 6 paperclips long. Which record matches?", "Use the worksheet's paperclip measuring idea.", ["6 paperclips long", "6 blocks long", "6 cups long"], "6 paperclips long", groups("Toothbrush measured with paperclips.", [1, 1, 1, 1, 1, 1], ["pc", "pc", "pc", "pc", "pc", "pc"]), "paperclips", "Measure with paperclips", ["wrong-informal-unit"]],
    ["Pencil centimetres", "Section 4 - Measure with Centimetres: A pencil reaches the 8 cm mark on a ruler. What is its length?", "Read the simple centimetre mark.", ["8 cm", "8 blocks", "8 paperclips"], "8 cm", numbers("Ruler from 0 to 8 cm.", [0, 1, 2, 3, 4, 5, 6, 7, 8]), "centimetres", "Measure with centimetres", ["wrong-unit-record"]],
    ["Crayon centimetres", "Section 4 - Measure with Centimetres: A crayon reaches the 5 cm mark. What is its length?", "Use the centimetre ruler reading.", ["5 cm", "5 blocks", "5 dollars"], "5 cm", numbers("Ruler from 0 to 5 cm.", [0, 1, 2, 3, 4, 5]), "centimetres", "Measure with centimetres", ["wrong-unit-record"]],
    ["Informal or standard", "Section 5 - Informal or Standard? Blocks and paperclips are examples of which kind of unit?", "Classify the worksheet measuring units.", ["Informal", "Standard", "Money"], "Informal", numbers("Unit cards.", ["blocks", "paperclips", "informal"]), "informal-standard", "Informal or standard?", ["informal-standard-confusion"]],
    ["Centimetres or ruler", "Section 5 - Informal or Standard? Centimetres on a ruler are which kind of unit?", "Classify the early standard unit.", ["Standard", "Informal", "Coin"], "Standard", numbers("Unit cards.", ["centimetres", "ruler", "standard"]), "informal-standard", "Informal or standard?", ["informal-standard-confusion"]],
    ["Draw five blocks", "Section 6 - Draw and Measure: Which line matches 5 blocks long?", "Choose the line with five equal block spaces.", ["the 5-block line", "the 8-block line", "the 3-block line"], "the 5-block line", groups("Selectable line lengths.", [5, 8, 3], ["5 blocks", "8 blocks", "3 blocks"]), "draw-and-measure", "Draw and measure", ["line-length-confusion"]],
    ["Why centimetres", "Section 7 - Think and Talk: Why do we use centimetres?", "Choose the reason that matches the worksheet discussion.", ["They help people measure with the same unit", "They make every object longer", "They are money"], "They help people measure with the same unit", numbers("Think and talk.", ["same unit", "centimetres"]), "think-and-talk", "Think and talk", ["standard-unit-purpose-gap"]],
  ],
  [
    ["Three o'clock", "Section 1 - Read the Clock: The minute hand points to 12 and the hour hand points to 3. What time is it?", "Read the o'clock time.", ["3 o'clock", "6 o'clock", "12 o'clock"], "3 o'clock", numbers("O'clock clock.", ["hour 3", "minute 12"]), "read-clock", "Read the clock", ["minute-hour-confusion"]],
    ["Six o'clock", "Section 1 - Read the Clock: The clock shows 6 o'clock. Which label matches?", "Match the o'clock clock to its label.", ["6 o'clock", "9 o'clock", "12 o'clock"], "6 o'clock", numbers("O'clock clock.", ["hour 6", "minute 12"]), "read-clock", "Read the clock", ["clock-label-confusion"]],
    ["Nine o'clock", "Section 1 - Read the Clock: Which time is shown when the hour hand points to 9 and the minute hand points to 12?", "Use only o'clock reading.", ["9 o'clock", "3 o'clock", "6 o'clock"], "9 o'clock", numbers("O'clock clock.", ["hour 9", "minute 12"]), "read-clock", "Read the clock", ["minute-hour-confusion"]],
    ["Wake up match", "Section 2 - Match the Time: Wake up matches which time?", "Match the familiar event to the worksheet time card.", ["7 o'clock", "9 o'clock", "6 o'clock"], "7 o'clock", numbers("Event time match.", ["wake up", "7 o'clock"]), "match-time", "Match the time", ["routine-time-confusion"]],
    ["School starts match", "Section 2 - Match the Time: School starts matches which time?", "Use the familiar school-start time card.", ["9 o'clock", "7 o'clock", "8 o'clock"], "9 o'clock", numbers("Event time match.", ["school starts", "9 o'clock"]), "match-time", "Match the time", ["routine-time-confusion"]],
    ["Dinner match", "Section 2 - Match the Time: Dinner matches which time?", "Match dinner to the worksheet time card.", ["6 o'clock", "9 o'clock", "12 o'clock"], "6 o'clock", numbers("Event time match.", ["dinner", "6 o'clock"]), "match-time", "Match the time", ["routine-time-confusion"]],
    ["Count cents", "Section 3 - Count the Money: A group has 10c, 20c and 50c. What is the total?", "Count the simple Australian coin values.", ["80c", "70c", "$1"], "80c", groups("Australian coins.", [10, 20, 50], ["10c", "20c", "50c"]), "count-money", "Count the money", ["coin-total-error"]],
    ["Count dollars", "Section 3 - Count the Money: Two $1 coins are together. What is the total?", "Count the simple dollar coins.", ["$2", "$1", "$10"], "$2", groups("Australian coins.", [1, 1], ["$1", "$1"]), "count-money", "Count the money", ["coin-count-vs-value"]],
    ["Apple lollipop compare", "Section 4 - Which Costs More? An apple costs 50c and a lollipop costs 20c. Which costs more?", "Compare the price labels.", ["apple", "lollipop", "same cost"], "apple", groups("Cost comparison.", [50, 20], ["apple 50c", "lollipop 20c"]), "costs-more-less", "Which costs more?", ["smaller-price-selected"]],
    ["Books pencil compare", "Section 4 - Which Costs More? Books cost $5 and a pencil costs $2. Which costs less?", "Choose the smaller price label.", ["pencil", "books", "same cost"], "pencil", groups("Cost comparison.", [5, 2], ["books $5", "pencil $2"]), "costs-more-less", "Which costs less?", ["larger-price-selected"]],
    ["Shopping cents", "Section 5 - Shopping Time: What is $1 + 50c?", "Add the simple shopping prices.", ["$1.50", "$1", "50c"], "$1.50", numbers("Shopping total.", ["$1", "+", "50c"]), "shopping-total", "Shopping time", ["simple-total-error"]],
    ["Shopping dollars", "Section 5 - Shopping Time: What is $3 + $2?", "Add the simple dollar prices.", ["$5", "$3", "$6"], "$5", numbers("Shopping total.", ["$3", "+", "$2"]), "shopping-total", "Shopping time", ["simple-total-error"]],
    ["Before school", "Section 6 - Before and After: Brushing teeth happens before school or after school?", "Choose before or after for a familiar routine.", ["Before school", "After school", "At bedtime"], "Before school", numbers("Before and after.", ["brush teeth", "school"]), "before-after", "Before and after", ["before-after-confusion"]],
    ["Draw six o'clock", "Section 7 - Real-Life Time: Dinner is at 6 o'clock. Which clock hands should you draw?", "Use an o'clock clock: minute hand on 12 and hour hand on 6.", ["hour hand on 6, minute hand on 12", "hour hand on 12, minute hand on 6", "both hands on 6"], "hour hand on 6, minute hand on 12", numbers("Draw clock hands.", ["6 o'clock", "hour 6", "minute 12"]), "real-life-time", "Real-life time", ["minute-hour-confusion"]],
    ["Why clocks", "Section 8 - Think and Talk: Why do we use clocks?", "Choose the everyday reason.", ["to know when things happen", "to count coins", "to make objects longer"], "to know when things happen", numbers("Think and talk.", ["clocks", "when things happen"]), "think-and-talk", "Think and talk", ["clock-purpose-gap"]],
  ],
  [
    ["Pencil length tool", "Section 1 - Choose the Tool: Which tool should you use to measure the length of a pencil?", "Match the pencil picture to the measuring tool.", ["ruler", "measuring jug", "clock"], "ruler", numbers("Pencil and tool cards.", ["pencil", "ruler", "jug", "clock"]), "tool-choice", "Tool choice", ["tool-purpose-confusion"]],
    ["Dog mass tool", "Section 1 - Choose the Tool: Which tool should you use to measure how heavy a dog is?", "Choose the tool that measures mass or weight.", ["scales", "ruler", "measuring jug"], "scales", numbers("Dog and tool cards.", ["dog", "scales", "ruler", "jug"]), "tool-choice", "Tool choice", ["tool-purpose-confusion"]],
    ["Milk capacity tool", "Section 1 - Choose the Tool: Which tool should you use to measure milk for a bottle?", "Choose the capacity measuring tool.", ["measuring jug", "clock", "ruler"], "measuring jug", numbers("Milk bottle and tool cards.", ["milk", "jug", "clock", "ruler"]), "tool-choice", "Tool choice", ["tool-purpose-confusion"]],
    ["Recess time tool", "Section 1 - Choose the Tool: Which tool helps measure when recess starts?", "Match the recess-time context to a time tool.", ["clock", "scales", "measuring jug"], "clock", numbers("Recess time cards.", ["recess", "clock"]), "tool-choice", "Tool choice", ["tool-purpose-confusion"]],
    ["Pencil unit", "Section 2 - Choose the Unit: Which standard unit is best for the length of a pencil?", "Choose a sensible length unit for a small object.", ["centimetres", "litres", "kilograms"], "centimetres", numbers("Pencil unit cards.", ["cm", "L", "kg"]), "unit-choice", "Unit choice", ["attribute-unit-mismatch"]],
    ["Dog unit", "Section 2 - Choose the Unit: Which standard unit is best for how heavy a dog is?", "Choose the mass unit for the dog.", ["kilograms", "centimetres", "litres"], "kilograms", numbers("Dog unit cards.", ["kg", "cm", "L"]), "unit-choice", "Unit choice", ["attribute-unit-mismatch"]],
    ["Bucket unit", "Section 2 - Choose the Unit: Which standard unit is best for how much water a bucket holds?", "Choose the capacity unit for the bucket.", ["litres", "grams", "centimetres"], "litres", numbers("Bucket unit cards.", ["bucket", "L", "g", "cm"]), "unit-choice", "Unit choice", ["attribute-unit-mismatch"]],
    ["Read the ruler", "Section 3 - Use the Tool: A pencil reaches the 12 cm mark on the ruler. What is its length?", "Read the ruler mark and include the unit.", ["12 cm", "12 kg", "12 L"], "12 cm", numbers("Ruler from 0 to 12 cm.", [0, 2, 4, 6, 8, 10, 12]), "tool-use", "Tool use", ["wrong-unit-record"]],
    ["Read the scales", "Section 3 - Use the Tool: The cat is on scales showing 4 kg. What should you record?", "Read the scale display and keep the mass unit.", ["4 kg", "4 cm", "4 L"], "4 kg", numbers("Cat on scales.", ["cat", "4 kg"]), "tool-use", "Tool use", ["wrong-unit-record"]],
    ["Read the jug", "Section 3 - Use the Tool: The measuring jug shows 2 L of water. What should you record?", "Read the jug marking and keep the capacity unit.", ["2 L", "2 kg", "2 cm"], "2 L", numbers("Measuring jug.", ["water", "2 L"]), "tool-use", "Tool use", ["wrong-unit-record"]],
    ["Match the measure", "Section 4 - Match the Measure: Which pair is matched correctly?", "Match each context to the correct kind of measure.", ["pencil length in centimetres", "milk capacity in kilograms", "dog mass in litres"], "pencil length in centimetres", numbers("Match measure cards.", ["pencil:cm", "milk:L", "dog:kg"]), "unit-choice", "Unit choice", ["unit-match-error"]],
    ["Best tool for recess", "Section 5 - Real-Life Measuring: Recess starts at a set time. Which tool should the class use?", "Choose the tool for a familiar school time context.", ["clock", "ruler", "scales"], "clock", numbers("Recess-time context.", ["recess", "clock"]), "time-measure", "Time measures", ["time-tool-confusion"]],
  ],
  [
    ["Estimate length", "Which is a sensible estimate for a pencil?", "Use everyday benchmarks.", ["15 cm", "15 m", "15 L"], "15 cm", numbers("Pencil estimate.", ["about 15 cm"]), "estimation", "Estimation", ["unit-scale-error"]],
    ["Estimate mass", "Which mass is sensible for a school bag?", "Choose a realistic amount.", ["4 kg", "400 kg", "4 m"], "4 kg", numbers("Bag estimate.", ["about 4 kg"]), "estimation", "Estimation", ["unreasonable-size"]],
    ["Estimate capacity", "Which capacity is sensible for a mug?", "Use a familiar benchmark.", ["250 mL", "25 L", "250 kg"], "250 mL", numbers("Mug capacity.", ["about 250 mL"]), "estimation", "Estimation", ["unit-type-confusion"]],
    ["Check result", "A pencil measured as 15 m. What should you notice?", "Compare with a sensible estimate.", ["that is too long", "that is sensible", "that is too short for any pencil"], "that is too long", numbers("Reasonableness check.", ["pencil", "15 m"]), "reasonableness", "Reasonableness", ["accepts-unreasonable-result"]],
    ["Estimate duration", "Which is a sensible time to brush teeth?", "Use a routine benchmark.", ["2 minutes", "2 hours", "2 seconds"], "2 minutes", numbers("Routine duration.", ["brush teeth", "2 min"]), "estimation", "Estimation", ["duration-scale-error"]],
    ["Estimate room", "Which is a sensible room length?", "Use everyday room benchmarks.", ["4 m", "4 cm", "400 km"], "4 m", numbers("Room length estimate.", ["about 4 m"]), "estimation", "Estimation", ["unit-scale-error"]],
    ["Compare estimate", "You estimate 1 L but measure 950 mL. What is true?", "Compare close measurements.", ["the estimate was close", "the estimate was impossible", "950 mL is bigger than 1 L by a lot"], "the estimate was close", numbers("Estimate and measure.", ["1 L", "950 mL"]), "checking", "Check estimates", ["conversion-benchmark-gap"]],
    ["Too heavy", "A loaf of bread recorded as 20 kg is probably?", "Check reasonableness.", ["too heavy", "reasonable", "too light for bread"], "too heavy", numbers("Bread mass.", ["20 kg"]), "reasonableness", "Reasonableness", ["no-practical-check"]],
    ["Best benchmark", "Which benchmark helps estimate 1 metre?", "Choose a familiar length.", ["about a large step", "a teaspoon of water", "one second"], "about a large step", numbers("Length benchmark.", ["1 m", "large step"]), "benchmarks", "Benchmarks", ["benchmark-type-mismatch"]],
    ["Estimate before measuring", "Why estimate before measuring?", "Think about checking the final result.", ["to notice unreasonable results", "to avoid using units", "to make the object change"], "to notice unreasonable results", numbers("Estimate then measure.", ["estimate", "measure", "check"]), "checking", "Check estimates", ["estimation-purpose-gap"]],
    ["Reasonable area", "Which is a sensible area for a small table top?", "Use square units.", ["1 m2", "100 m2", "1 L"], "1 m2", numbers("Area estimate.", ["table top", "1 m2"]), "estimation", "Estimation", ["area-unit-confusion"]],
    ["Check conversion", "A learner says 100 cm is much longer than 1 m. What should they know?", "Use metric benchmarks.", ["100 cm equals 1 m", "100 cm equals 10 m", "1 m equals 1 cm"], "100 cm equals 1 m", numbers("Metric benchmark.", ["100 cm", "1 m"]), "checking", "Check estimates", ["metric-equivalence-gap"]],
  ],
  [
    ["Perimeter rectangle", "A rectangle has sides 5 m and 3 m. What is the perimeter?", "Add all four sides.", ["16 m", "15 m2", "8 m"], "16 m", numbers("Rectangle sides.", ["5+3+5+3"]), "perimeter", "Perimeter", ["area-perimeter-confusion"]],
    ["Area rectangle", "A rectangle is 4 m by 6 m. What is the area?", "Multiply length by width.", ["24 m2", "20 m", "10 m2"], "24 m2", groups("Area grid 4 by 6.", [24], ["square metres"]), "area", "Area", ["perimeter-area-confusion"]],
    ["Elapsed time", "A task starts at 1:15 and ends at 2:00. How long did it take?", "Count forward on a timeline.", ["45 minutes", "1 hour", "15 minutes"], "45 minutes", numbers("Timeline.", ["1:15", "2:00"]), "duration", "Elapsed time", ["reads-clock-time-not-duration"]],
    ["Recipe double", "A recipe uses 300 mL milk. Double the recipe uses?", "Double the measurement.", ["600 mL", "302 mL", "150 mL"], "600 mL", groups("Double 300 mL.", [300, 300], ["milk", "milk"]), "calculation", "Measurement calculation", ["adds-small-number"]],
    ["Fence length", "A garden side lengths are 8 m, 5 m, 8 m, 5 m. How much fence?", "Find the perimeter.", ["26 m", "40 m2", "13 m"], "26 m", numbers("Fence perimeter.", [8, 5, 8, 5]), "perimeter", "Perimeter", ["counts-two-sides-only"]],
    ["Tile area", "A floor has 7 rows of 3 tiles. How many tiles cover it?", "Use rows times columns.", ["21 tiles", "10 tiles", "14 tiles"], "21 tiles", groups("Tile array.", [3, 3, 3, 3, 3, 3, 3], ["row", "row", "row", "row", "row", "row", "row"]), "area", "Area", ["adds-not-multiplies"]],
    ["Capacity sum", "A jug has 750 mL and another has 250 mL. How much altogether?", "Add the capacities.", ["1000 mL", "500 mL", "1 mL"], "1000 mL", numbers("Capacity total.", ["750 mL", "250 mL"]), "calculation", "Measurement calculation", ["decimal-place-gap"]],
    ["Distance difference", "You walk 2.5 km and your friend walks 1.8 km. How much farther?", "Subtract the distances.", ["0.7 km", "4.3 km", "1.7 km"], "0.7 km", numbers("Distance comparison.", ["2.5 km", "1.8 km"]), "calculation", "Measurement calculation", ["adds-instead-of-subtracts"]],
    ["Scale quantity", "One shelf is 90 cm. Three shelves need how much wood?", "Multiply by 3.", ["270 cm", "93 cm", "30 cm"], "270 cm", groups("Three shelves.", [90, 90, 90], ["shelf", "shelf", "shelf"]), "calculation", "Measurement calculation", ["uses-one-shelf-only"]],
    ["Unit in answer", "Which answer is written correctly for perimeter?", "Perimeter is a length measure.", ["18 cm", "18 cm2", "18 L"], "18 cm", numbers("Perimeter unit.", ["length around"]), "units", "Measurement units", ["area-unit-for-perimeter"]],
    ["Area model", "Which model has area 12 square units?", "Count rows and columns.", ["3 by 4 grid", "3 plus 4 line", "12 cm perimeter"], "3 by 4 grid", groups("Area 12.", [4, 4, 4], ["row", "row", "row"]), "area", "Area", ["area-model-gap"]],
    ["Practical choice", "Which calculation finds paint needed for a wall?", "Paint covers area.", ["area of the wall", "perimeter of the wall", "clock time"], "area of the wall", numbers("Paint context.", ["wall", "area"]), "calculation-choice", "Choose calculation", ["wrong-measure-choice"]],
  ],
  [
    ["Metres to centimetres", "Which conversion is correct?", "Use 100 cm in 1 m.", ["2 m = 200 cm", "2 m = 20 cm", "2 m = 2 cm"], "2 m = 200 cm", numbers("Metric length.", ["1 m=100 cm", "2 m=200 cm"]), "conversion", "Conversions", ["place-value-conversion-error"]],
    ["Litres to millilitres", "Which conversion is correct?", "Use 1000 mL in 1 L.", ["1.5 L = 1500 mL", "1.5 L = 150 mL", "1.5 L = 15 mL"], "1.5 L = 1500 mL", numbers("Capacity conversion.", ["1 L=1000 mL", "1.5 L=1500 mL"]), "conversion", "Conversions", ["decimal-conversion-error"]],
    ["Fraction measure", "Half a metre is how many centimetres?", "Half of 100 cm.", ["50 cm", "25 cm", "200 cm"], "50 cm", groups("One metre split in half.", [50, 50], ["half", "half"]), "fractional-measures", "Fractional measures", ["half-of-wrong-unit"]],
    ["Decimal length", "Which is the same as 3.4 m?", "Convert metres to centimetres.", ["340 cm", "34 cm", "304 cm"], "340 cm", numbers("Decimal length.", ["3.4 m", "340 cm"]), "decimal-measures", "Decimal measures", ["decimal-place-error"]],
    ["Kilograms to grams", "Which conversion is correct?", "Use 1000 g in 1 kg.", ["2.5 kg = 2500 g", "2.5 kg = 250 g", "2.5 kg = 25 g"], "2.5 kg = 2500 g", numbers("Mass conversion.", ["kg", "g"]), "conversion", "Conversions", ["decimal-conversion-error"]],
    ["Quarter litre", "A quarter of 1 L is?", "Use 1000 mL and split into 4 parts.", ["250 mL", "500 mL", "100 mL"], "250 mL", groups("Litre split into quarters.", [250, 250, 250, 250], ["1/4", "1/4", "1/4", "1/4"]), "fractional-measures", "Fractional measures", ["quarter-benchmark-gap"]],
    ["Compare decimals", "Which length is longer?", "Compare in the same unit.", ["1.2 m", "105 cm", "they are equal"], "1.2 m", numbers("1.2 m is 120 cm.", ["120 cm", "105 cm"]), "decimal-measures", "Decimal measures", ["compares-written-digits"]],
    ["Recipe decimal", "A recipe needs 0.75 L water. Which amount matches?", "Convert to millilitres.", ["750 mL", "75 mL", "7.5 mL"], "750 mL", numbers("Decimal capacity.", ["0.75 L", "750 mL"]), "decimal-measures", "Decimal measures", ["decimal-place-error"]],
    ["Mixed units", "Which is larger: 1500 mL or 1 L?", "Convert 1 L to 1000 mL.", ["1500 mL", "1 L", "they are equal"], "1500 mL", numbers("Capacity comparison.", ["1500 mL", "1000 mL"]), "conversion", "Conversions", ["mixed-unit-comparison-error"]],
    ["Fraction context", "A board is 2 m long. Half is?", "Find half of 2 m.", ["1 m", "50 cm", "4 m"], "1 m", groups("Two metres split into halves.", [1, 1], ["m", "m"]), "fractional-measures", "Fractional measures", ["half-of-100-only"]],
    ["Best representation", "Which measure is easiest for 1250 mL in litres?", "Use decimal litres.", ["1.25 L", "12.5 L", "0.125 L"], "1.25 L", numbers("Millilitres to litres.", ["1250 mL", "1.25 L"]), "decimal-measures", "Decimal measures", ["conversion-scale-error"]],
    ["Conversion purpose", "Why convert 1.2 m to 120 cm before comparing with 95 cm?", "Use the same unit.", ["same units make comparison clearer", "it changes the length", "centimetres are always bigger"], "same units make comparison clearer", numbers("Same-unit comparison.", ["1.2 m", "120 cm", "95 cm"]), "conversion-reasoning", "Conversion reasoning", ["conversion-purpose-gap"]],
  ],
  [
    ["Round length", "A length is 12.47 cm. Which is rounded to the nearest cm?", "Round to a whole centimetre.", ["12 cm", "12.5 cm", "13.47 cm"], "12 cm", numbers("Precision card.", ["12.47 cm", "nearest cm"]), "precision", "Precision", ["rounding-place-error"]],
    ["Appropriate precision", "Which precision is sensible for measuring medicine?", "Choose the careful measure.", ["nearest mL", "nearest kilometre", "nearest year"], "nearest mL", numbers("Medicine context.", ["small liquid dose"]), "precision-choice", "Precision choice", ["context-precision-gap"]],
    ["Convert area units", "Which conversion is correct?", "Use 100 cm in 1 m for length, but 10,000 cm2 in 1 m2.", ["1 m2 = 10000 cm2", "1 m2 = 100 cm2", "1 m2 = 10 cm2"], "1 m2 = 10000 cm2", numbers("Area unit conversion.", ["1 m by 1 m", "100 cm by 100 cm"]), "conversion", "Conversions", ["linear-area-conversion-confusion"]],
    ["Significant context", "A running time is 12.348 s. Which is suitable for a school race result?", "Use hundredths or tenths depending on context.", ["12.35 s", "12 km", "12 years"], "12.35 s", numbers("Race time precision.", ["12.348 s", "12.35 s"]), "precision", "Precision", ["unit-type-confusion"]],
    ["Convert speed", "A cyclist travels 30 km in 2 h. What is the speed?", "Use distance per hour.", ["15 km/h", "60 km/h", "32 km/h"], "15 km/h", numbers("Compound measure.", ["30 km", "2 h"]), "compound-measures", "Compound measures", ["multiplies-instead-of-divides"]],
    ["Density units", "Which unit suits density of a material?", "Density compares mass and volume.", ["g/cm3", "cm", "minutes"], "g/cm3", numbers("Density unit.", ["mass/volume"]), "compound-measures", "Compound measures", ["unit-relationship-gap"]],
    ["Precision decision", "Which task needs the most precise length?", "Compare contexts.", ["cutting a machine part", "estimating a walking route", "guessing room size"], "cutting a machine part", numbers("Precision contexts.", ["machine part", "walk", "room estimate"]), "precision-choice", "Precision choice", ["same-precision-all-contexts"]],
    ["Unit conversion", "0.006 km is how many metres?", "Use 1000 m in 1 km.", ["6 m", "60 m", "600 m"], "6 m", numbers("km to m.", ["0.006 km", "6 m"]), "conversion", "Conversions", ["decimal-conversion-error"]],
    ["Rounding impact", "Why might rounding too early cause a problem?", "Think about calculation accuracy.", ["the final answer may be less accurate", "units disappear", "the measurement becomes exact"], "the final answer may be less accurate", numbers("Rounding decision.", ["early rounding", "final answer"]), "precision", "Precision", ["rounding-purpose-gap"]],
    ["Tolerance", "A shelf must be 80 cm within 1 cm. Which length is acceptable?", "Accept 79 cm to 81 cm.", ["80.5 cm", "82 cm", "78 cm"], "80.5 cm", numbers("Tolerance range.", ["79", "80", "81"]), "tolerance", "Tolerance", ["range-check-error"]],
    ["Convert volume", "Which conversion is correct?", "Use 1000 cm3 in 1 L.", ["2 L = 2000 cm3", "2 L = 200 cm3", "2 L = 20 cm3"], "2 L = 2000 cm3", numbers("Volume-capacity link.", ["1 L=1000 cm3"]), "conversion", "Conversions", ["volume-conversion-gap"]],
    ["Explain unit choice", "Why use metres rather than millimetres for a sports field?", "Choose a practical unit size.", ["metres are a sensible scale", "millimetres are not lengths", "metres make it heavier"], "metres are a sensible scale", numbers("Field measurement.", ["m", "mm"]), "unit-choice", "Unit choice", ["unit-scale-reasoning-gap"]],
  ],
  [
    ["Design area", "A garden bed is 4 m by 3 m. Which measure helps plan soil coverage?", "Soil coverage uses area.", ["12 m2", "14 m", "7 m"], "12 m2", groups("Garden area grid.", [3, 3, 3, 3], ["row", "row", "row", "row"]), "design", "Design measurement", ["perimeter-area-confusion"]],
    ["Science reading", "A thermometer reads 37.8 C. Which statement is sensible?", "Interpret the measured temperature.", ["it is about 38 C", "it is 37.8 kg", "it is 378 L"], "it is about 38 C", numbers("Temperature reading.", ["37.8 C"]), "science", "Science measurement", ["unit-type-confusion"]],
    ["Scale plan", "A plan uses 1 cm for 2 m. A wall is 5 cm on the plan. Real length?", "Scale each centimetre to 2 m.", ["10 m", "7 m", "2.5 m"], "10 m", groups("Five scale units.", [2, 2, 2, 2, 2], ["m", "m", "m", "m", "m"]), "scale", "Scale", ["scale-direction-error"]],
    ["Material amount", "Which measurement helps order fence material?", "Fence material needs distance around.", ["perimeter", "area", "temperature"], "perimeter", numbers("Fence context.", ["around garden"]), "design", "Design measurement", ["wrong-measure-choice"]],
    ["Constraint check", "A box must fit through a 70 cm door. Which width fits?", "Compare width with the door opening.", ["65 cm", "75 cm", "90 cm"], "65 cm", numbers("Door width constraint.", ["door 70 cm", "box 65 cm"]), "constraints", "Constraints", ["constraint-inequality-error"]],
    ["Science rate", "A beaker loses 30 mL in 6 minutes. Rate?", "Use volume per minute.", ["5 mL/min", "36 mL/min", "180 mL/min"], "5 mL/min", numbers("Evaporation rate.", ["30 mL", "6 min"]), "science", "Science measurement", ["multiplies-rate"]],
    ["Layout decision", "Which measure helps check if a table fits a room corner?", "Use dimensions.", ["length and width", "cost only", "temperature"], "length and width", numbers("Room layout.", ["table dimensions"]), "design", "Design measurement", ["irrelevant-measure"]],
    ["Reasonable result", "A room area is calculated as 900 m2 for a bedroom. What should you do?", "Check against a practical benchmark.", ["recheck the measurement", "accept it as normal", "change m2 to minutes"], "recheck the measurement", numbers("Bedroom area check.", ["900 m2"]), "reasonableness", "Reasonableness", ["accepts-unreasonable-result"]],
    ["Unit in science", "Which unit would suit a plant height investigation?", "Choose a length unit.", ["centimetres", "litres per hour", "dollars"], "centimetres", numbers("Plant height.", ["cm"]), "science", "Science measurement", ["unit-purpose-confusion"]],
    ["Design volume", "A storage box is 2 m by 1 m by 1 m. Which calculation finds volume?", "Multiply the three dimensions.", ["2 x 1 x 1", "2 + 1 + 1", "2 x 1"], "2 x 1 x 1", groups("Box dimensions.", [2, 1, 1], ["length", "width", "height"]), "volume", "Volume", ["uses-area-not-volume"]],
    ["Scale direction", "A model is smaller than the real object. Which is true?", "Think about scale models.", ["real dimensions are larger", "model dimensions are heavier", "scale removes units"], "real dimensions are larger", numbers("Scale model.", ["model", "real object"]), "scale", "Scale", ["scale-direction-gap"]],
    ["Justify decision", "Which explanation best supports choosing litres for a tank?", "Match the unit to capacity.", ["litres measure capacity", "litres measure time", "litres measure length"], "litres measure capacity", numbers("Tank unit choice.", ["tank", "L"]), "reasoning", "Measurement reasoning", ["unit-justification-gap"]],
  ],
  [
    ["Model dimensions", "A scale model uses 1 cm for 5 m. What real length is 8 cm?", "Multiply by the scale factor.", ["40 m", "13 m", "1.6 m"], "40 m", groups("Eight scale units of 5 m.", [5, 5, 5, 5, 5, 5, 5, 5], ["m", "m", "m", "m", "m", "m", "m", "m"]), "modelling", "Measurement modelling", ["scale-factor-error"]],
    ["Project quantity", "One panel covers 1.5 m2. How many panels for 6 m2?", "Divide total area by panel area.", ["4 panels", "9 panels", "6 panels"], "4 panels", groups("Four panels cover 6 m2.", [1.5, 1.5, 1.5, 1.5], ["panel", "panel", "panel", "panel"]), "planning", "Planning quantities", ["multiplies-not-divides"]],
    ["Model variable", "In C = 12m for cable cost, what does 12 represent?", "Connect the model to the measure.", ["cost per metre", "total metres", "area"], "cost per metre", numbers("Cable model.", ["C=12m"]), "modelling", "Measurement modelling", ["coefficient-context-gap"]],
    ["Design fit", "A layout needs a gap of at least 90 cm. Which gap works?", "Check the constraint.", ["95 cm", "85 cm", "0.9 cm"], "95 cm", numbers("Gap constraint.", ["at least 90 cm"]), "constraints", "Constraints", ["inequality-direction-error"]],
    ["Interpret model", "A tank fills at 20 L/min. Which model gives volume V after t minutes?", "Use rate times time.", ["V = 20t", "V = t + 20", "V = 20/t"], "V = 20t", groups("20 L each minute.", [20, 20, 20], ["min", "min", "min"]), "modelling", "Measurement modelling", ["rate-model-error"]],
    ["Budget length", "Timber costs $8 per metre. What is cost for 7.5 m?", "Multiply unit cost by length.", ["$60", "$15.50", "$56"], "$60", numbers("Timber cost.", ["$8/m", "7.5 m"]), "planning", "Planning quantities", ["decimal-multiplication-gap"]],
    ["Compare designs", "Which design uses less material?", "Compare total measured length.", ["Design A: 18 m", "Design B: 21 m", "They are equal"], "Design A: 18 m", numbers("Material lengths.", ["A 18 m", "B 21 m"]), "design-comparison", "Design comparison", ["bigger-number-preference"]],
    ["Volume model", "Which formula models a rectangular prism volume?", "Use three dimensions.", ["V = length x width x height", "V = length + width", "V = 2(length + width)"], "V = length x width x height", groups("Prism dimensions.", [1, 1, 1], ["l", "w", "h"]), "modelling", "Measurement modelling", ["perimeter-formula-confusion"]],
    ["Reasonable scale", "A city map scale is 1 cm = 1 km. Which real distance matches 3.5 cm?", "Use the scale.", ["3.5 km", "35 km", "0.35 km"], "3.5 km", numbers("Map scale.", ["1 cm=1 km", "3.5 cm"]), "scale", "Scale", ["decimal-scale-error"]],
    ["Model evaluation", "Why check measurements in a model?", "Models need to fit the real context.", ["to see whether the model fits well enough", "to remove units", "to make all answers exact"], "to see whether the model fits well enough", numbers("Model check.", ["measure", "model", "evaluate"]), "model-checking", "Model checking", ["model-purpose-gap"]],
    ["Dimensional choice", "Which measure helps plan paint for a wall?", "Paint depends on surface area.", ["area", "elapsed time", "mass"], "area", numbers("Wall paint.", ["area"]), "planning", "Planning quantities", ["wrong-dimension-choice"]],
    ["Context interpretation", "A model says 4.2 rolls of tape are needed. What should you buy?", "Tape rolls are whole items.", ["5 rolls", "4 rolls", "4.2 rolls exactly"], "5 rolls", groups("Four rolls plus extra need.", [4, 1], ["full rolls", "extra"]), "planning", "Planning quantities", ["context-rounding-error"]],
  ],
  [
    ["Unreasonable unit", "A swimming pool capacity recorded as 40 mL is probably?", "Check the unit and size.", ["too small", "reasonable", "too large"], "too small", numbers("Pool capacity.", ["40 mL"]), "reasonableness", "Reasonableness", ["accepts-unreasonable-unit"]],
    ["Accuracy claim", "Which measurement is more precise?", "Compare the detail given.", ["12.48 cm", "12 cm", "about 10 cm"], "12.48 cm", numbers("Precision comparison.", ["12.48 cm", "12 cm", "~10 cm"]), "precision", "Precision", ["precision-vs-accuracy-confusion"]],
    ["Critique result", "A learner says a pencil is 18 kg. What should they check?", "Match object and unit.", ["the unit or measurement", "the pencil colour", "the day of the week"], "the unit or measurement", numbers("Pencil mass claim.", ["18 kg"]), "critique", "Critique measurements", ["no-unit-critique"]],
    ["Rounding context", "Which rounded length is sensible for ordering carpet?", "Use enough precision for the task.", ["nearest 0.1 m", "nearest 100 km", "nearest second"], "nearest 0.1 m", numbers("Carpet length precision.", ["room length"]), "precision-choice", "Precision choice", ["context-precision-gap"]],
    ["Check conversion", "A learner converts 3.6 m to 36 cm. What is wrong?", "Use 100 cm per metre.", ["it should be 360 cm", "it should be 3.6 cm", "it is correct"], "it should be 360 cm", numbers("Conversion critique.", ["3.6 m", "360 cm"]), "critique", "Critique measurements", ["decimal-conversion-error"]],
    ["Tolerance judgement", "A part must be 50 mm within 2 mm. Which measurement fails?", "Accept 48 mm to 52 mm.", ["53 mm", "51 mm", "49 mm"], "53 mm", numbers("Tolerance range.", ["48", "50", "52"]), "tolerance", "Tolerance", ["range-check-error"]],
    ["Reasonable speed", "A walking speed of 500 km/h is probably?", "Check against real-world benchmarks.", ["unreasonable", "reasonable", "too slow"], "unreasonable", numbers("Walking speed.", ["500 km/h"]), "reasonableness", "Reasonableness", ["benchmark-not-used"]],
    ["Unit fit", "Which unit best reports a phone screen length?", "Choose a suitable length unit.", ["centimetres", "litres", "tonnes"], "centimetres", numbers("Phone screen.", ["cm"]), "unit-choice", "Unit choice", ["unit-type-confusion"]],
    ["Error source", "Which could cause measurement error with a ruler?", "Think about tool use.", ["starting at 1 instead of 0", "writing the date", "using centimetres"], "starting at 1 instead of 0", numbers("Ruler error.", ["start at 1", "not 0"]), "measurement-error", "Measurement error", ["tool-error-gap"]],
    ["Revise decision", "A result is much larger than the estimate. What should you do first?", "Use checking habits.", ["recheck the measure and units", "ignore the estimate", "change the answer to dollars"], "recheck the measure and units", numbers("Estimate vs result.", ["estimate", "result", "check"]), "checking", "Checking", ["ignores-discrepancy"]],
    ["Believable area", "Which area is believable for a classroom?", "Use practical benchmarks.", ["60 m2", "60000 m2", "60 mL"], "60 m2", numbers("Classroom area.", ["about 60 m2"]), "reasonableness", "Reasonableness", ["unit-scale-error"]],
    ["Clear justification", "Which explanation best supports rounding 12.497 m to 12.5 m?", "Use place value and context.", ["12.497 is close to 12.5", "metres are bigger than decimals", "rounding changes the object"], "12.497 is close to 12.5", numbers("Rounding explanation.", ["12.497", "12.5"]), "communication", "Measurement communication", ["weak-rounding-explanation"]],
  ],
];

const MEASUREMENT_CASES: MeasurementCase[][] = RAW_MEASUREMENT_CASES.map(
  (cases) => cases.map(makeCase),
);

export const MEASUREMENT_STEP_SPECS: MeasurementStepSpec[] =
  MEASUREMENT_STEP_TITLES.map(
    ([title, stepKey, stageKey, stageTitle, stepNumber, shortTitle, description], index) => ({
      order: index + 1,
      stepNumber,
      stageKey,
      stageTitle,
      stepKey,
      pathwayStepId: `mathematics::measurement::${stageKey}::${stepKey}`,
      title,
      shortTitle,
      description,
      cases: MEASUREMENT_CASES[index],
    }),
  );

export const MEASUREMENT_STEP_ASSESSMENTS: MeasurementStepAssessment[] =
  MEASUREMENT_STEP_SPECS.map((spec) => ({
    key: `measurement-step-${spec.order}-${spec.stepKey}-assessment-v1`,
    stepNumber: spec.stepNumber,
    stepKey: spec.stepKey,
    pathwayStepId: spec.pathwayStepId,
    title: spec.title,
    shortTitle: spec.shortTitle,
    description: spec.description,
    subjectKey: "mathematics",
    strandKey: MEASUREMENT_STRAND_KEY,
    stageKey: spec.stageKey,
    parentBankKey: MEASUREMENT_PARENT_FAMILY_KEY,
    parentBankTitle: MEASUREMENT_PARENT_FAMILY_TITLE,
    parentItemBankKey: MEASUREMENT_ITEM_BANK_KEY,
    progressionBandKey: MEASUREMENT_PARENT_FAMILY_KEY,
    sourceRoute: MEASUREMENT_SOURCE_ROUTE,
    depthOptions: NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
    items: spec.cases.map((item, index) => makeItem(spec, item, index)),
  }));

export function getMeasurementStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
) {
  const stepAssessmentKey = safe(context.stepAssessmentKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    MEASUREMENT_STEP_ASSESSMENTS.find(
      (assessment) =>
        (stepAssessmentKey && assessment.key === stepAssessmentKey) ||
        (pathwayStepId && assessment.pathwayStepId === pathwayStepId) ||
        (stepKey && assessment.stepKey === stepKey),
    ) || null
  );
}

export function getMeasurementStepAssessmentItemsForDepth(
  assessmentKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const assessment =
    MEASUREMENT_STEP_ASSESSMENTS.find(
      (candidate) => candidate.key === assessmentKey,
    ) || null;

  if (!assessment) return [];

  return assessment.items.slice(0, getNumberStepAssessmentDepthItemCount(depth));
}
