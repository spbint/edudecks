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
    ["Pencil estimate first", "Section 1 - Estimate First: Before measuring a pencil, which estimate makes sense?", "Estimate first, before using the ruler.", ["8 cm", "80 cm", "8 L"], "8 cm", numbers("Estimate first: pencil length.", ["pencil", "8 cm", "80 cm"]), "estimate-first", "Estimate first", ["unit-scale-error"]],
    ["Book estimate first", "Section 1 - Estimate First: Before measuring a book, which estimate makes sense?", "Choose a sensible book length estimate.", ["20 cm", "2 cm", "20 L"], "20 cm", numbers("Estimate first: book length.", ["book", "20 cm"]), "estimate-first", "Estimate first", ["unit-scale-error"]],
    ["Door estimate first", "Section 1 - Estimate First: Before measuring a door height, which estimate makes sense?", "Use an everyday height benchmark.", ["2 m", "2 cm", "20 L"], "2 m", numbers("Estimate first: door height.", ["door", "2 m"]), "estimate-first", "Estimate first", ["unit-scale-error"]],
    ["Bottle estimate first", "Section 1 - Estimate First: Before checking a juice bottle, which estimate makes sense?", "Choose a sensible capacity estimate.", ["600 mL", "600 L", "6 cm"], "600 mL", numbers("Estimate first: juice bottle.", ["bottle", "600 mL"]), "estimate-first", "Estimate first", ["unit-type-confusion"]],
    ["Estimate or measure classroom", "Section 2 - Estimate or Measure? For the length of a classroom, what should you do first?", "The worksheet asks you to decide whether an estimate or exact measurement is better.", ["Estimate first", "Guess without checking", "Use litres"], "Estimate first", numbers("Estimate or measure.", ["classroom length"]), "estimate-or-measure", "Estimate or measure?", ["estimation-purpose-gap"]],
    ["Estimate or measure pencil", "Section 2 - Estimate or Measure? For the exact length of a pencil, what is the better option?", "Choose the action that checks the estimate.", ["Measure with a ruler", "Use a bucket", "Count books"], "Measure with a ruler", numbers("Estimate or measure.", ["pencil", "ruler"]), "estimate-or-measure", "Estimate or measure?", ["tool-purpose-confusion"]],
    ["Pencil close check", "Section 3 - Check the Measurement: You estimated 9 cm. The pencil measures 8 cm. Is the estimate close?", "Compare your estimate with the actual measurement.", ["Close", "Not Close", "Wrong unit"], "Close", numbers("Estimate then measure.", ["estimate 9 cm", "actual 8 cm"]), "close-check", "Check the measurement", ["close-comparison-error"]],
    ["Book close check", "Section 3 - Check the Measurement: You estimated 8 cm. The book measures 20 cm. Is the estimate close?", "Compare estimate and actual measurement.", ["Not Close", "Close", "Same"], "Not Close", numbers("Estimate then measure.", ["estimate 8 cm", "actual 20 cm"]), "close-check", "Check the measurement", ["close-comparison-error"]],
    ["Bottle close check", "Section 3 - Check the Measurement: You estimated 500 mL. The bottle measures 600 mL. Is the estimate close?", "Decide whether the estimate is reasonably close.", ["Close", "Not Close", "Impossible"], "Close", numbers("Estimate then measure.", ["estimate 500 mL", "actual 600 mL"]), "close-check", "Check the measurement", ["capacity-benchmark-gap"]],
    ["Closest to 10 cm", "Section 6 - Which Is Closest? The actual length is 10 cm. Which estimate is closest?", "Compare the options with the actual measurement.", ["9 cm", "5 cm", "20 cm"], "9 cm", numbers("Closest estimate.", ["actual 10 cm", "5 cm", "9 cm", "20 cm"]), "closest-estimate", "Which is closest?", ["closest-value-error"]],
    ["Closest to 1 L", "Section 6 - Which Is Closest? The actual capacity is 1 L. Which estimate is closest?", "Choose the estimate nearest to the actual amount.", ["900 mL", "100 mL", "10 L"], "900 mL", numbers("Closest estimate.", ["actual 1 L", "900 mL"]), "closest-estimate", "Which is closest?", ["capacity-benchmark-gap"]],
    ["Why estimate", "Section 8 - Think and Talk: Why is estimating useful before measuring?", "Choose the reason that matches the estimate, measure, compare, reflect cycle.", ["It helps you check whether the measurement makes sense", "It replaces measuring forever", "It changes the object's size"], "It helps you check whether the measurement makes sense", numbers("Estimate, measure, compare, reflect.", ["estimate", "measure", "compare", "reflect"]), "reflect", "Think and talk", ["estimation-purpose-gap"]],
  ],
  [
    ["Ribbon total", "Section 1 - Add Lengths: A ribbon is 12 cm long and another ribbon is 8 cm long. What is the total length?", "Add the two ribbon lengths and keep the centimetre unit.", ["20 cm", "4 cm", "20 m"], "20 cm", numbers("Ribbon lengths.", ["12 cm", "+", "8 cm"]), "length-total", "Add lengths", ["drops-unit", "subtracts-instead"]],
    ["Pencil total", "Section 1 - Add Lengths: A pencil is 15 cm and an extra piece is 5 cm. What is the total length?", "Add the practical lengths.", ["20 cm", "10 cm", "75 cm"], "20 cm", numbers("Pencil lengths.", ["15 cm", "+", "5 cm"]), "length-total", "Add lengths", ["subtracts-instead"]],
    ["Book total", "Section 1 - Add Lengths: A book is 22 cm and another is 18 cm. What is the combined length?", "Use addition with centimetres.", ["40 cm", "4 cm", "40 kg"], "40 cm", numbers("Book lengths.", ["22 cm", "+", "18 cm"]), "length-total", "Add lengths", ["wrong-unit-record"]],
    ["Rope difference", "Section 2 - Compare Lengths: One rope is 30 cm and another is 18 cm. What is the difference?", "Subtract the shorter length from the longer length.", ["12 cm", "48 cm", "18 cm"], "12 cm", numbers("Rope comparison.", ["30 cm", "18 cm"]), "length-difference", "Compare lengths", ["adds-instead-of-subtracts"]],
    ["Ruler pencil difference", "Section 2 - Compare Lengths: A ruler is 30 cm and a pencil is 12 cm. How much longer is the ruler?", "Find the difference between the lengths.", ["18 cm", "42 cm", "12 cm"], "18 cm", numbers("Ruler and pencil.", ["30 cm", "12 cm"]), "length-difference", "Compare lengths", ["adds-instead-of-subtracts"]],
    ["Capacity total", "Section 3 - Capacity Problems: A bucket has 1 L and a bottle has 2 L. How much capacity altogether?", "Add the litre amounts.", ["3 L", "1 L", "3 kg"], "3 L", numbers("Capacity total.", ["1 L", "+", "2 L"]), "capacity", "Capacity problems", ["wrong-unit-record"]],
    ["Capacity remaining", "Section 3 - Capacity Problems: A jug has 3 L. You pour out 1 L. How much remains?", "Subtract the amount poured out.", ["2 L", "4 L", "2 kg"], "2 L", numbers("Capacity remaining.", ["3 L", "-", "1 L"]), "capacity", "Capacity problems", ["adds-instead-of-subtracts"]],
    ["Mass combined", "Section 4 - Mass Problems: One package is 4 kg and another is 6 kg. What is the combined mass?", "Add the package masses.", ["10 kg", "2 kg", "10 L"], "10 kg", numbers("Package masses.", ["4 kg", "+", "6 kg"]), "mass", "Mass problems", ["wrong-unit-record"]],
    ["Mass difference", "Section 4 - Mass Problems: A bag is 12 kg and another is 5 kg. What is the difference?", "Subtract to compare the masses.", ["7 kg", "17 kg", "7 cm"], "7 kg", numbers("Mass difference.", ["12 kg", "-", "5 kg"]), "mass", "Mass problems", ["adds-instead-of-subtracts"]],
    ["Finish time one hour", "Section 5 - Time Problems: A task starts at 3:00 pm and lasts 1 hour. What is the finishing time?", "Move forward one hour on the clock.", ["4:00 pm", "3:30 pm", "2:00 pm"], "4:00 pm", numbers("Time calculation.", ["3:00 pm", "+1 hour"]), "time", "Time problems", ["time-counting-error"]],
    ["Finish time thirty minutes", "Section 5 - Time Problems: A task starts at 12:30 pm and lasts 30 minutes. What is the finishing time?", "Move forward 30 minutes.", ["1:00 pm", "12:00 pm", "1:30 pm"], "1:00 pm", numbers("Time calculation.", ["12:30 pm", "+30 min"]), "time", "Time problems", ["half-hour-error"]],
    ["Choose the unit", "Section 7 - Choose the Correct Unit: Which unit best matches water in a bucket?", "Choose the practical measurement unit.", ["L", "kg", "min"], "L", numbers("Unit choice.", ["bucket water", "cm", "m", "kg", "L", "min"]), "unit-choice", "Choose the correct unit", ["attribute-unit-mismatch"]],
  ],
  [
    ["Half of one metre", "Section 1 - Fractions of a Measurement: What is 1/2 of 1 m?", "Use the metre strip and split it into two equal parts.", ["0.5 m", "0.25 m", "2 m"], "0.5 m", groups("One metre split in half.", [50, 50], ["1/2 m", "1/2 m"]), "fraction-measure", "Fractions of a measurement", ["half-of-wrong-unit"]],
    ["Quarter of eight metres", "Section 1 - Fractions of a Measurement: What is 1/4 of 8 m?", "Split 8 metres into four equal parts.", ["2 m", "4 m", "12 m"], "2 m", groups("Eight metres in quarters.", [2, 2, 2, 2], ["1/4", "1/4", "1/4", "1/4"]), "fraction-measure", "Fractions of a measurement", ["quarter-benchmark-gap"]],
    ["Three quarters of four litres", "Section 1 - Fractions of a Measurement: What is 3/4 of 4 L?", "Four litre parts make the whole; choose three parts.", ["3 L", "1 L", "4 L"], "3 L", groups("Four litres split into quarters.", [1, 1, 1, 1], ["1 L", "1 L", "1 L", "1 L"]), "fraction-measure", "Fractions of a measurement", ["uses-denominator-as-answer"]],
    ["Half metre decimal", "Section 2 - Write as a Decimal: Write 1/2 m as a decimal.", "Use the measurement decimal form.", ["0.5 m", "0.2 m", "1.2 m"], "0.5 m", numbers("Fraction to decimal measurement.", ["1/2 m", "0.5 m"]), "decimal-measure", "Write as a decimal", ["fraction-decimal-gap"]],
    ["Quarter litre decimal", "Section 2 - Write as a Decimal: Write 1/4 L as a decimal.", "A quarter is 0.25 of a whole litre.", ["0.25 L", "0.4 L", "1.4 L"], "0.25 L", numbers("Fraction to decimal measurement.", ["1/4 L", "0.25 L"]), "decimal-measure", "Write as a decimal", ["quarter-decimal-gap"]],
    ["One and a half metres", "Section 2 - Write as a Decimal: Write 1 1/2 m as a decimal.", "Combine one metre and half a metre.", ["1.5 m", "0.5 m", "2.5 m"], "1.5 m", numbers("Mixed measurement.", ["1 m", "+", "0.5 m"]), "decimal-measure", "Write as a decimal", ["mixed-number-decimal-gap"]],
    ["Centimetres to metres", "Section 3 - Convert the Units: Convert 150 cm to metres.", "Use 100 cm = 1 m.", ["1.5 m", "15 m", "0.15 m"], "1.5 m", numbers("Centimetres to metres.", ["150 cm", "1.5 m"]), "conversion", "Convert the units", ["conversion-scale-error"]],
    ["Millilitres to litres", "Section 3 - Convert the Units: Convert 2500 mL to litres.", "Use 1000 mL = 1 L.", ["2.5 L", "25 L", "0.25 L"], "2.5 L", numbers("Millilitres to litres.", ["2500 mL", "2.5 L"]), "conversion", "Convert the units", ["decimal-conversion-error"]],
    ["Greater length", "Section 4 - Which Is Greater? Which is larger: 0.5 m or 40 cm?", "Convert to the same unit before comparing.", ["0.5 m", "40 cm", "they are equal"], "0.5 m", numbers("Compare length.", ["0.5 m", "50 cm", "40 cm"]), "comparison", "Which is greater?", ["mixed-unit-comparison-error"]],
    ["Greater capacity", "Section 4 - Which Is Greater? Which is larger: 1.5 L or 1000 mL?", "Convert litres and millilitres to compare.", ["1.5 L", "1000 mL", "they are equal"], "1.5 L", numbers("Compare capacity.", ["1.5 L", "1500 mL", "1000 mL"]), "comparison", "Which is greater?", ["mixed-unit-comparison-error"]],
    ["Number line order", "Section 5 - Number Line Measurements: Which point comes between 0.5 m and 1 m?", "Use the quarter-metre number line.", ["0.75 m", "0.25 m", "1.25 m"], "0.75 m", numbers("Measurement number line.", ["0.25 m", "0.5 m", "0.75 m", "1 m"]), "number-line", "Number line measurements", ["decimal-order-error"]],
    ["Ribbon decimal problem", "Section 6 - Real-Life Measurement Problems: A ribbon is 2 m long. You cut off 0.75 m. How much remains?", "Subtract the decimal measurement in context.", ["1.25 m", "1.75 m", "2.75 m"], "1.25 m", numbers("Ribbon problem.", ["2 m", "-", "0.75 m"]), "real-life-measurement", "Real-life measurement problems", ["subtract-decimal-error"]],
  ],
  [
    ["Classroom unit", "Section 1 - Choose the Best Unit: Which unit best measures classroom length?", "Choose the unit that fits the classroom context.", ["m", "mL", "g"], "m", numbers("Best unit cards.", ["classroom length", "cm", "m", "km"]), "best-unit", "Choose the best unit", ["attribute-unit-mismatch"]],
    ["Watermelon unit", "Section 1 - Choose the Best Unit: Which unit best measures watermelon mass?", "Choose a sensible mass unit.", ["kg", "m", "L"], "kg", numbers("Best unit cards.", ["watermelon", "g", "kg"]), "best-unit", "Choose the best unit", ["attribute-unit-mismatch"]],
    ["Town distance unit", "Section 1 - Choose the Best Unit: Which unit best measures distance between towns?", "Choose the large-distance unit.", ["km", "cm", "mL"], "km", numbers("Best unit cards.", ["town", "town", "km"]), "best-unit", "Choose the best unit", ["unit-scale-error"]],
    ["Convert centimetres", "Section 2 - Convert the Measurement: Convert 250 cm to metres.", "Use 100 cm = 1 m.", ["2.5 m", "25 m", "0.25 m"], "2.5 m", numbers("Conversion card.", ["250 cm", "2.5 m"]), "conversion", "Convert the measurement", ["conversion-scale-error"]],
    ["Convert metres", "Section 2 - Convert the Measurement: Convert 3.5 m to centimetres.", "Use 1 m = 100 cm.", ["350 cm", "35 cm", "3500 cm"], "350 cm", numbers("Conversion card.", ["3.5 m", "350 cm"]), "conversion", "Convert the measurement", ["decimal-conversion-error"]],
    ["Convert millilitres", "Section 2 - Convert the Measurement: Convert 1500 mL to litres.", "Use 1000 mL = 1 L.", ["1.5 L", "15 L", "0.15 L"], "1.5 L", numbers("Conversion card.", ["1500 mL", "1.5 L"]), "conversion", "Convert the measurement", ["decimal-conversion-error"]],
    ["Convert kilograms", "Section 2 - Convert the Measurement: Convert 1.2 kg to grams.", "Use 1000 g = 1 kg.", ["1200 g", "120 g", "12 g"], "1200 g", numbers("Conversion card.", ["1.2 kg", "1200 g"]), "conversion", "Convert the measurement", ["decimal-conversion-error"]],
    ["More precise length", "Section 3 - Which Measurement Is More Precise? Which is more precise: 2 m or 2.35 m?", "Choose the measurement with more detail.", ["2.35 m", "2 m", "they are the same precision"], "2.35 m", numbers("Precision comparison.", ["2 m", "2.35 m"]), "precision", "Which is more precise?", ["precision-vs-size-confusion"]],
    ["More precise capacity", "Section 3 - Which Measurement Is More Precise? Which is more precise: 1 L or 1.25 L?", "Choose the more detailed capacity measure.", ["1.25 L", "1 L", "they are the same precision"], "1.25 L", numbers("Precision comparison.", ["1 L", "1.25 L"]), "precision", "Which is more precise?", ["precision-vs-size-confusion"]],
    ["Sensible pencil", "Section 5 - Which Answer Makes Sense? A pencil is most likely 15 cm or 15 m?", "Choose the practical measurement.", ["15 cm", "15 m", "15 kL"], "15 cm", numbers("Reasonable measurement.", ["pencil", "15 cm", "15 m"]), "reasonableness", "Which answer makes sense?", ["accepts-unreasonable-result"]],
    ["Measurement challenge", "Section 6 - Measurement Challenge: A rope is 3.5 m long. You cut off 75 cm. How much remains?", "Convert 75 cm to 0.75 m, then subtract.", ["2.75 m", "2.25 m", "4.25 m"], "2.75 m", numbers("Mixed-unit challenge.", ["3.5 m", "-", "75 cm"]), "challenge", "Measurement challenge", ["mixed-unit-calculation-error"]],
    ["Precision table", "Section 7 - Precision Investigation: Pencil = 17.4 cm, Book = 24.8 cm, Desk = 1.25 m. Which measurement is most precise?", "Use the worksheet table and compare the detail shown.", ["1.25 m", "17.4 cm", "24.8 cm"], "1.25 m", numbers("Precision table.", ["pencil 17.4 cm", "book 24.8 cm", "desk 1.25 m"]), "precision-investigation", "Precision investigation", ["precision-vs-size-confusion"]],
  ],
  [
    ["Garden bed area", "Section 1 - Design a Garden Bed: A garden bed is 25 m long and 12 m wide. What is the garden area?", "Multiply length by width for the garden area.", ["300 m2", "37 m2", "600 m2"], "300 m2", groups("Garden bed plan.", [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25], ["12 rows"]), "garden-design", "Design a garden bed", ["perimeter-area-confusion"]],
    ["Garden path total", "Section 1 - Design a Garden Bed: A 0.5 m path goes around a 25 m by 12 m garden. What outside dimensions include the path?", "Add 0.5 m to both sides of each dimension.", ["26 m by 13 m", "25.5 m by 12.5 m", "25 m by 13 m"], "26 m by 13 m", numbers("Garden with path.", ["25 m", "12 m", "0.5 m path"]), "garden-design", "Design a garden bed", ["adds-path-to-one-side-only"]],
    ["Birdhouse sheets", "Section 2 - Build a Birdhouse: The birdhouse needs 6 wood panels. Each sheet makes 3 panels. How many sheets are needed?", "Divide the panels needed by the panels per sheet.", ["2 sheets", "3 sheets", "9 sheets"], "2 sheets", groups("Birdhouse wood table.", [3, 3], ["sheet", "sheet"]), "birdhouse", "Build a birdhouse", ["multiplies-not-divides"]],
    ["Birdhouse area", "Section 2 - Build a Birdhouse: A side panel is 20 cm by 15 cm. What area of wood is needed for that panel?", "Multiply the side lengths.", ["300 cm2", "35 cm2", "70 cm2"], "300 cm2", numbers("Birdhouse side panel.", ["20 cm", "15 cm"]), "birdhouse", "Build a birdhouse", ["perimeter-area-confusion"]],
    ["Evaporation pattern", "Section 3 - Science Investigation: A 12 cm dish evaporates in 8 hours and an 18 cm dish evaporates in 6 hours. What is the pattern?", "Use the table to compare dish diameter and evaporation time.", ["larger dishes evaporate faster", "larger dishes evaporate slower", "diameter does not matter"], "larger dishes evaporate faster", numbers("Evaporation table.", ["12 cm -> 8 h", "18 cm -> 6 h"]), "science-investigation", "Science investigation", ["pattern-direction-error"]],
    ["Evaporation prediction", "Section 3 - Science Investigation: Based on the pattern, what is a sensible prediction for a 24 cm dish?", "The larger dish should take less time than the 18 cm dish.", ["4 hours", "10 hours", "24 hours"], "4 hours", numbers("Evaporation prediction.", ["18 cm -> 6 h", "24 cm -> ?"]), "science-investigation", "Science investigation", ["unreasonable-prediction"]],
    ["Terrarium fit", "Section 4 - Convert and Plan: A display is 120 cm by 60 cm. Three terrariums are 20 cm cubes. Do they fit in a row along the 120 cm side?", "Three 20 cm cubes need 60 cm of length.", ["Yes, they use 60 cm", "No, they need 180 cm", "No, each cube is 120 cm"], "Yes, they use 60 cm", groups("Terrarium display.", [20, 20, 20], ["cube", "cube", "cube"]), "convert-and-plan", "Convert and plan", ["dimension-fit-error"]],
    ["Terrarium remaining", "Section 4 - Convert and Plan: Three 20 cm terrariums sit along a 120 cm display. How much length remains?", "Subtract 60 cm from 120 cm.", ["60 cm", "40 cm", "100 cm"], "60 cm", numbers("Display planning.", ["120 cm", "-", "3 x 20 cm"]), "convert-and-plan", "Convert and plan", ["subtracts-one-item-only"]],
    ["Jug count", "Section 5 - Real-Life Measurement Problem: You have 2.25 L of water and a 750 mL jug. How many full jugs can you fill?", "Convert 2.25 L to 2250 mL, then divide by 750 mL.", ["3 full jugs", "2 full jugs", "4 full jugs"], "3 full jugs", groups("Jug fills.", [750, 750, 750], ["jug", "jug", "jug"]), "real-life-measurement", "Real-life measurement problem", ["litre-millilitre-conversion-error"]],
    ["Bridge constraint", "Section 6 - Engineering Design Challenge: The bridge must be 30 cm long, 10 cm tall, and hold 500 g. Which measurement checks the load requirement?", "The load requirement is about mass.", ["500 g", "30 cm", "10 cm"], "500 g", numbers("Bridge design brief.", ["30 cm long", "10 cm tall", "500 g load"]), "engineering-design", "Engineering design challenge", ["attribute-unit-mismatch"]],
    ["Leaf growth total", "Section 7 - Data and Measurement Reasoning: A leaf grows from 4 cm to 13 cm. What is the total increase?", "Subtract the starting length from the final length.", ["9 cm", "17 cm", "13 cm"], "9 cm", numbers("Leaf growth table.", ["start 4 cm", "week 7 13 cm"]), "data-reasoning", "Data and measurement reasoning", ["subtracts-in-wrong-order"]],
    ["Leaf prediction", "Section 7 - Data and Measurement Reasoning: If the leaf grows about 1.5 cm each week, what is a sensible Week 8 prediction after 13 cm?", "Add the average weekly increase to the latest measurement.", ["14.5 cm", "8 cm", "21 cm"], "14.5 cm", numbers("Leaf growth prediction.", ["13 cm", "+ 1.5 cm"]), "data-reasoning", "Data and measurement reasoning", ["ignores-average-increase"]],
  ],
  [
    ["Playground area", "Section 1 - Design a Playground: The playground is 12 m long and 8 m wide. What is the total area?", "Multiply length by width.", ["96 m2", "40 m2", "20 m2"], "96 m2", groups("Playground plan.", [12, 12, 12, 12, 12, 12, 12, 12], ["8 rows"]), "playground-planner", "Design a playground", ["perimeter-area-confusion"]],
    ["Playground path", "Section 1 - Design a Playground: A 1 m path surrounds a 12 m by 8 m playground. What outside dimensions include the path?", "Add 1 m to both sides of each dimension.", ["14 m by 10 m", "13 m by 9 m", "12 m by 10 m"], "14 m by 10 m", numbers("Playground with path.", ["12 m", "8 m", "1 m path"]), "playground-planner", "Design a playground", ["adds-path-to-one-side-only"]],
    ["Garden box units", "Section 2 - Build a Garden Box: A garden box is 2.5 m by 1.5 m. Which unit is most suitable for the design sketch?", "Use metres for a garden box.", ["metres", "millilitres", "grams"], "metres", numbers("Garden box sketch.", ["2.5 m", "1.5 m"]), "garden-box", "Build a garden box", ["attribute-unit-mismatch"]],
    ["Garden box tool", "Section 2 - Build a Garden Box: Which tool best measures a 2.5 m garden box?", "Choose a length measuring tool for a few metres.", ["measuring tape", "kitchen scale", "measuring jug"], "measuring tape", numbers("Garden box tools.", ["length", "2.5 m"]), "garden-box", "Build a garden box", ["wrong-tool-choice"]],
    ["Tank conversion", "Section 3 - Water Tank Design: Tank B holds 1.5 kL. How many litres is that?", "Use 1 kL = 1000 L.", ["1500 L", "150 L", "15 L"], "1500 L", numbers("Water tank conversion.", ["1.5 kL", "1500 L"]), "water-tank", "Water tank design", ["kilolitre-litre-conversion-error"]],
    ["Tank comparison", "Section 3 - Water Tank Design: Tank A holds 2500 L and Tank B holds 1.5 kL. Which tank is larger?", "Convert 1.5 kL to 1500 L, then compare.", ["Tank A", "Tank B", "They are equal"], "Tank A", numbers("Tank comparison.", ["A 2500 L", "B 1.5 kL"]), "water-tank", "Water tank design", ["compares-before-converting"]],
    ["Tank difference", "Section 3 - Water Tank Design: Tank A is 2500 L and Tank B is 1500 L. What is the difference?", "Subtract the smaller capacity from the larger capacity.", ["1000 L", "4000 L", "100 L"], "1000 L", numbers("Tank difference.", ["2500 L", "-", "1500 L"]), "water-tank", "Water tank design", ["subtracts-place-value-error"]],
    ["Plant pattern", "Section 4 - Plant Growth Investigation: Week 1 = 8 cm, Week 2 = 11 cm, Week 3 = 14 cm, Week 4 = 17 cm. What is the growth pattern?", "Compare each week to the next.", ["add 3 cm each week", "add 2 cm each week", "double each week"], "add 3 cm each week", numbers("Plant growth table.", ["8", "11", "14", "17"]), "plant-growth", "Plant growth investigation", ["pattern-difference-error"]],
    ["Plant week six", "Section 4 - Plant Growth Investigation: Using the pattern, what is the Week 6 height?", "Continue adding 3 cm from Week 4.", ["23 cm", "20 cm", "26 cm"], "23 cm", numbers("Plant growth prediction.", ["Week 4 17 cm", "+3", "+3"]), "plant-growth", "Plant growth investigation", ["predicts-one-week-only"]],
    ["Bookshelf design", "Section 5 - Measurement and Design Challenge: A bookshelf is 1 m wide, 1.8 m high, with three shelves. Which measurement should be labelled for height?", "Use the vertical measurement.", ["1.8 m", "1 m", "3 shelves"], "1.8 m", numbers("Bookshelf dimensions.", ["width 1 m", "height 1.8 m", "3 shelves"]), "bookshelf-design", "Measurement and design challenge", ["dimension-label-confusion"]],
    ["Convert metres", "Section 6 - Convert and Compare: Convert 2.5 m to centimetres.", "Use 100 cm = 1 m.", ["250 cm", "25 cm", "2500 cm"], "250 cm", numbers("Conversion card.", ["2.5 m", "250 cm"]), "convert-compare", "Convert and compare", ["decimal-conversion-error"]],
    ["Garden layout beds", "Section 7 - Real-Life Modelling Problem: An 8 m by 5 m space holds garden beds that are 2 m by 1 m. If all beds are aligned in a grid, how many beds can fit?", "Fit four 2 m lengths along 8 m and five 1 m widths along 5 m.", ["20 beds", "13 beds", "10 beds"], "20 beds", groups("Garden layout grid.", [4, 4, 4, 4, 4], ["row", "row", "row", "row", "row"]), "garden-layout", "Real-life modelling problem", ["uses-area-without-layout"]],
  ],
  [
    ["Pencil makes sense", "Section 1 - Does the Answer Make Sense? Pencil = 15 cm.", "Use a practical benchmark for a pencil length.", ["Makes Sense", "Does Not Make Sense", "Wrong attribute"], "Makes Sense", numbers("Reasonable measurement card.", ["pencil", "15 cm"]), "reasonableness", "Does the answer make sense?", ["benchmark-not-used"]],
    ["Dog mass check", "Section 1 - Does the Answer Make Sense? Dog = 250 kg.", "Judge whether the mass is reasonable for a dog.", ["Does Not Make Sense", "Makes Sense", "More accurate"], "Does Not Make Sense", numbers("Reasonable measurement card.", ["dog", "250 kg"]), "reasonableness", "Does the answer make sense?", ["accepts-unreasonable-result"]],
    ["Bottle capacity check", "Section 1 - Does the Answer Make Sense? Drink bottle = 600 L.", "Compare the capacity with a normal drink bottle.", ["Does Not Make Sense", "Makes Sense", "Same"], "Does Not Make Sense", numbers("Reasonable measurement card.", ["drink bottle", "600 L"]), "reasonableness", "Does the answer make sense?", ["capacity-benchmark-gap"]],
    ["Pencil error", "Section 2 - Spot the Measurement Mistake: A pencil is measured as 2 m. What is wrong?", "A pencil should be measured in centimetres, not metres this large.", ["the length is too large", "the object is missing", "2 m is exact"], "the length is too large", numbers("Measurement error.", ["pencil", "2 m"]), "spot-error", "Spot the measurement mistake", ["unit-scale-error"]],
    ["Pool error", "Section 2 - Spot the Measurement Mistake: A pool holds 50 mL. What is wrong?", "A pool capacity is much larger than millilitres.", ["the capacity is too small", "the pool is too long", "50 mL is enough"], "the capacity is too small", numbers("Measurement error.", ["pool", "50 mL"]), "spot-error", "Spot the measurement mistake", ["accepts-unreasonable-unit"]],
    ["Watermelon error", "Section 2 - Spot the Measurement Mistake: A watermelon weighs 300 kg. What is wrong?", "Use a mass benchmark for a watermelon.", ["the mass is too large", "the unit measures length", "it is reasonable"], "the mass is too large", numbers("Measurement error.", ["watermelon", "300 kg"]), "spot-error", "Spot the measurement mistake", ["benchmark-not-used"]],
    ["Estimate check pencil", "Section 3 - Estimate and Check: A pencil estimate is 16 cm and the actual length is 15 cm. What is the difference?", "Compare estimate and actual measurement.", ["1 cm", "31 cm", "15 cm"], "1 cm", numbers("Estimate and check.", ["estimate 16 cm", "actual 15 cm"]), "estimate-check", "Estimate and check", ["difference-calculation-error"]],
    ["Accuracy length", "Section 4 - Which Is More Accurate? Which measurement is more accurate: 5 m or 5.23 m?", "Choose the measurement with more detail.", ["5.23 m", "5 m", "they are equal"], "5.23 m", numbers("Accuracy comparison.", ["5 m", "5.23 m"]), "accuracy-comparison", "Which is more accurate?", ["precision-vs-size-confusion"]],
    ["Accuracy capacity", "Section 4 - Which Is More Accurate? Which measurement is more accurate: 2 L or 2.15 L?", "Choose the more precise capacity measure.", ["2.15 L", "2 L", "20 L"], "2.15 L", numbers("Accuracy comparison.", ["2 L", "2.15 L"]), "accuracy-comparison", "Which is more accurate?", ["precision-vs-size-confusion"]],
    ["Best unit classroom", "Section 5 - Choose the Best Measurement: Which unit best measures classroom length?", "Choose the sensible length unit.", ["m", "mL", "kg"], "m", numbers("Best unit reasoning.", ["classroom length"]), "best-unit", "Choose the best measurement", ["attribute-unit-mismatch"]],
    ["Book investigation", "Section 6 - Measurement Investigation: A book is measured as 21 cm, 22 cm, and 21.5 cm. Which is most accurate if the true length is between 21 and 22 cm?", "The decimal measurement gives more detail between 21 and 22.", ["21.5 cm", "21 cm", "22 cm"], "21.5 cm", numbers("Book measurement table.", ["21 cm", "22 cm", "21.5 cm"]), "measurement-investigation", "Measurement investigation", ["precision-vs-accuracy-confusion"]],
    ["Recipe jugs", "Section 7 - Real-Life Problem Solving: A recipe needs 2.5 L of water. You have a 1 L jug. How can you measure exactly 2.5 L?", "Use two full jugs plus half a jug.", ["2 full jugs and half a jug", "3 full jugs", "1 full jug"], "2 full jugs and half a jug", groups("Jug measurement.", [1, 1, 0.5], ["jug", "jug", "half jug"]), "real-life-problem", "Real-life problem solving", ["rounds-up-without-checking"]],
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
