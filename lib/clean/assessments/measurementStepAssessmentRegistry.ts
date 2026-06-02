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
    ["Longer object", "Which object is longer?", "Compare the two lengths side by side.", ["the ribbon", "the button", "they are the same"], "the ribbon", groups("Ribbon is longer than button.", [8, 2], ["ribbon", "button"]), "length", "Length comparison", ["compares-size-not-length"]],
    ["Heavier object", "Which object is heavier?", "Think about which would pull down a balance scale.", ["the rock", "the feather", "they are the same"], "the rock", groups("Balance scale comparison.", [9, 1], ["rock", "feather"]), "mass", "Mass comparison", ["large-light-object-confusion"]],
    ["Holds more", "Which container holds more?", "Compare how much each container can hold.", ["the jug", "the cup", "they hold the same"], "the jug", groups("Capacity comparison.", [10, 4], ["jug", "cup"]), "capacity", "Capacity comparison", ["height-only-capacity"]],
    ["Shorter object", "Which object is shorter?", "Look only at length.", ["the pencil", "the ruler", "they are the same"], "the pencil", groups("Pencil and ruler lengths.", [5, 12], ["pencil", "ruler"]), "length", "Length comparison", ["selects-longer"]],
    ["Fuller container", "Which container is fuller?", "Compare the amount inside.", ["Container A", "Container B", "neither"], "Container A", groups("Container A has more fill.", [8, 3], ["A", "B"]), "capacity", "Capacity comparison", ["container-size-vs-fill"]],
    ["Takes longer", "Which activity takes longer?", "Compare the time needed.", ["watching a movie", "brushing teeth", "they take the same"], "watching a movie", numbers("Time comparison.", ["movie: long", "teeth: short"]), "time", "Time comparison", ["routine-time-gap"]],
    ["Lighter object", "Which object is lighter?", "Think about mass, not size.", ["the balloon", "the brick", "they are the same"], "the balloon", groups("Mass comparison.", [1, 10], ["balloon", "brick"]), "mass", "Mass comparison", ["large-means-heavy"]],
    ["Attribute choice", "Which word compares how tall something is?", "Choose the measurement word for height.", ["taller", "heavier", "fuller"], "taller", numbers("Attribute words.", ["height", "mass", "capacity"]), "language", "Comparison language", ["attribute-language-confusion"]],
    ["Direct compare", "How can you decide which stick is longer?", "Use a direct comparison method.", ["line up the ends", "weigh the sticks", "shake the sticks"], "line up the ends", numbers("Direct length comparison.", ["same start", "compare ends"]), "method", "Comparison method", ["poor-comparison-method"]],
    ["Same length", "Two straws start and end at the same points. What is true?", "Look at the matching ends.", ["same length", "one is heavier", "one is fuller"], "same length", groups("Aligned straws.", [6, 6], ["straw", "straw"]), "length", "Length comparison", ["alignment-gap"]],
    ["Capacity word", "Which word describes how much a bottle can hold?", "Choose the measurement attribute.", ["capacity", "mass", "length"], "capacity", numbers("Measurement attributes.", ["hold", "capacity"]), "language", "Measurement language", ["attribute-vocabulary-gap"]],
    ["Best comparison", "Which comparison makes sense?", "Match the attribute to the objects.", ["which bag is heavier", "which cup is taller in minutes", "which clock is fuller"], "which bag is heavier", numbers("Sensible comparison.", ["bag: mass", "cup: capacity", "clock: time"]), "reasoning", "Attribute reasoning", ["mismatched-attribute"]],
  ],
  [
    ["Today or tomorrow", "Which word means the day after today?", "Use everyday calendar language.", ["tomorrow", "yesterday", "morning"], "tomorrow", numbers("Routine words.", ["today", "tomorrow"]), "time-language", "Time language", ["sequence-word-confusion"]],
    ["Before school", "Which happens before lunch?", "Think about a normal day order.", ["breakfast", "dinner", "bedtime"], "breakfast", numbers("Day routine.", ["breakfast", "lunch", "dinner"]), "routine", "Routine order", ["routine-sequence-gap"]],
    ["More money", "Which coin amount is more?", "Compare the amounts.", ["$2", "50c", "they are the same"], "$2", groups("Money amount comparison.", [200, 50], ["$2", "50c"]), "money", "Money language", ["coin-size-bias"]],
    ["Less time", "Which takes less time?", "Choose the shorter routine.", ["putting on shoes", "sleeping overnight", "school day"], "putting on shoes", numbers("Routine durations.", ["shoes: short", "sleep: long"]), "duration", "Duration language", ["duration-scale-gap"]],
    ["Cost word", "Which word tells how much something costs?", "Use shop-play language.", ["price", "morning", "length"], "price", numbers("Money context.", ["item", "price"]), "money", "Money language", ["context-vocabulary-gap"]],
    ["Clock context", "Which object helps you know the time?", "Choose the time tool.", ["clock", "cup", "ruler"], "clock", numbers("Time tools.", ["clock", "calendar"]), "tools", "Measurement tools", ["tool-purpose-confusion"]],
    ["Calendar context", "Which tool helps find the day of the week?", "Choose the calendar tool.", ["calendar", "balance scale", "jug"], "calendar", numbers("Calendar card.", ["Mon", "Tue", "Wed"]), "tools", "Measurement tools", ["tool-purpose-confusion"]],
    ["Spend or save", "You have $5 and spend $2. What happens to your money?", "Think about spending.", ["you have less money", "you have more money", "time passes"], "you have less money", numbers("Money change.", ["$5", "spend $2"]), "money", "Money language", ["spending-increases-money"]],
    ["Later event", "Which event is later in the day?", "Use routine order.", ["dinner", "breakfast", "morning tea"], "dinner", numbers("Day order.", ["breakfast", "morning tea", "dinner"]), "routine", "Routine order", ["before-after-confusion"]],
    ["Wait time", "If you wait a long time, which word fits?", "Choose the duration word.", ["longer", "cheaper", "heavier"], "longer", numbers("Waiting time.", ["short wait", "long wait"]), "duration", "Duration language", ["attribute-language-confusion"]],
    ["Money match", "Which amount matches two $1 coins?", "Count the dollars.", ["$2", "$1", "$10"], "$2", groups("Two one-dollar coins.", [1, 1], ["$1", "$1"]), "money", "Money language", ["coin-count-vs-value"]],
    ["Routine measure", "Which is a time question?", "Look for a question about when or how long.", ["What time is dinner?", "How heavy is the bag?", "How full is the bottle?"], "What time is dinner?", numbers("Measurement question types.", ["time", "mass", "capacity"]), "time-language", "Time language", ["measurement-type-confusion"]],
  ],
  [
    ["Same unit", "Why should you use the same block each time to measure a book?", "Think about a fair measurement.", ["so the units match", "so the book gets longer", "so the blocks change size"], "so the units match", numbers("Repeated equal units.", ["block", "block", "block"]), "unit-consistency", "Unit consistency", ["mixed-unit-error"]],
    ["Count units", "A pencil is 6 paper clips long. What is the measurement?", "Count the repeated units.", ["6 paper clips", "6 pencils", "1 paper clip"], "6 paper clips", groups("Six paper clips along a pencil.", [1, 1, 1, 1, 1, 1], ["pc", "pc", "pc", "pc", "pc", "pc"]), "informal-units", "Informal units", ["missing-unit-label"]],
    ["No gaps", "How should blocks be placed to measure length?", "Use careful repeated units.", ["touching with no gaps", "spread far apart", "stacked on top"], "touching with no gaps", numbers("Measuring strip.", ["no gaps", "no overlaps"]), "unit-placement", "Unit placement", ["gaps-overlaps"]],
    ["Best unit", "Which unit is sensible for measuring a desk length?", "Choose a repeated unit that fits the object.", ["hand spans", "drops of water", "seconds"], "hand spans", numbers("Informal unit choice.", ["desk", "hand span"]), "unit-choice", "Unit choice", ["attribute-unit-mismatch"]],
    ["Early standard", "Which unit could measure a short pencil?", "Choose a length unit.", ["centimetres", "litres", "minutes"], "centimetres", numbers("Length unit card.", ["cm", "L", "min"]), "standard-units", "Early standard units", ["unit-type-confusion"]],
    ["Capacity unit", "Which unit could measure water in a cup?", "Choose a capacity unit.", ["millilitres", "centimetres", "kilograms"], "millilitres", numbers("Capacity unit card.", ["mL", "cm", "kg"]), "standard-units", "Early standard units", ["unit-type-confusion"]],
    ["Mass unit", "Which unit could measure the mass of a lunchbox?", "Choose a mass unit.", ["grams", "minutes", "metres"], "grams", numbers("Mass unit card.", ["g", "min", "m"]), "standard-units", "Early standard units", ["unit-type-confusion"]],
    ["Measure start", "Where should you start measuring with a ruler?", "Line the object up carefully.", ["at 0", "at 5", "past the end"], "at 0", numbers("Ruler start.", [0, 1, 2, 3, 4]), "tool-use", "Tool use", ["starts-at-one"]],
    ["Record result", "A tower is 9 cubes tall. Which record is clear?", "Include the number and unit.", ["9 cubes", "9", "cubes"], "9 cubes", groups("Tower measured in cubes.", [9], ["cubes"]), "recording", "Record measurements", ["no-unit-recorded"]],
    ["Compare units", "A book measures 8 blocks or 16 small cubes. Why are the numbers different?", "The unit size changed.", ["small cubes are smaller units", "the book changed size", "counting does not matter"], "small cubes are smaller units", numbers("Different unit sizes.", ["8 blocks", "16 cubes"]), "unit-size", "Unit size", ["measurement-number-only"]],
    ["Repeat unit", "Which picture would give a better length measure?", "Look for equal repeated units.", ["equal tiles in a row", "different toys in a row", "coins piled up"], "equal tiles in a row", groups("Equal repeated units.", [1, 1, 1, 1], ["tile", "tile", "tile", "tile"]), "unit-consistency", "Unit consistency", ["uses-unequal-units"]],
    ["Estimate with units", "If a ruler shows about 12 cm, which record is sensible?", "Use the measured unit.", ["about 12 cm", "about 12 litres", "about 12 days"], "about 12 cm", numbers("Length record.", ["12 cm"]), "recording", "Record measurements", ["wrong-unit-record"]],
  ],
  [
    ["Clock hour", "What time is shown by the hour hand on 3 and minute hand on 12?", "Read the hour first.", ["3 o'clock", "12 o'clock", "3:30"], "3 o'clock", numbers("Clock face.", ["hour 3", "minute 12"]), "time", "Read clocks", ["minute-hour-confusion"]],
    ["Half past", "Which time means half past 4?", "Half past is 30 minutes after the hour.", ["4:30", "4:00", "5:30"], "4:30", numbers("Clock time.", ["4", "30 minutes"]), "time", "Read clocks", ["half-past-next-hour"]],
    ["Calendar day", "If today is Monday, what day is tomorrow?", "Move one day forward.", ["Tuesday", "Sunday", "Friday"], "Tuesday", numbers("Week sequence.", ["Mon", "Tue", "Wed"]), "calendar", "Calendar measures", ["day-sequence-error"]],
    ["Coin value", "Which amount is 50c + 20c?", "Add the coin values.", ["70c", "50c", "$1.20"], "70c", groups("Coin values.", [50, 20], ["50c", "20c"]), "money", "Money measures", ["coin-count-error"]],
    ["Simple cost", "A snack costs $3. You pay with $5. How much change?", "Find the difference.", ["$2", "$8", "$3"], "$2", numbers("Shop context.", ["$5", "-$3"]), "money", "Money measures", ["adds-cost-and-payment"]],
    ["Duration hour", "A game starts at 2:00 and ends at 3:00. How long did it take?", "Count the elapsed time.", ["1 hour", "2 hours", "30 minutes"], "1 hour", numbers("Timeline.", ["2:00", "3:00"]), "duration", "Duration", ["reads-end-time-as-duration"]],
    ["Morning routine", "Which time is earlier?", "Compare the clock times.", ["7:30", "8:00", "9:00"], "7:30", numbers("Time order.", ["7:30", "8:00", "9:00"]), "time-order", "Time order", ["hour-minute-order-gap"]],
    ["Money total", "Which total matches $2 + $2 + $1?", "Add the dollars.", ["$5", "$4", "$6"], "$5", groups("Dollar coins.", [2, 2, 1], ["$2", "$2", "$1"]), "money", "Money measures", ["coin-total-error"]],
    ["Calendar week", "How many days are in one week?", "Use calendar knowledge.", ["7", "5", "12"], "7", numbers("Calendar week.", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]), "calendar", "Calendar measures", ["school-week-only"]],
    ["Quarter past", "Which time is quarter past 6?", "Quarter past is 15 minutes after the hour.", ["6:15", "6:45", "7:15"], "6:15", numbers("Clock quarter past.", ["6", "15"]), "time", "Read clocks", ["quarter-past-confusion"]],
    ["Timetable next", "The bus leaves at 9:10 and 9:40. Which leaves later?", "Compare the minutes after 9.", ["9:40", "9:10", "both same"], "9:40", numbers("Timetable row.", ["9:10", "9:40"]), "timetable", "Timetables", ["later-earlier-confusion"]],
    ["Best measure", "Which measure tells how long homework took?", "Choose duration.", ["30 minutes", "$30", "30 cm"], "30 minutes", numbers("Measurement types.", ["duration", "money", "length"]), "duration", "Duration", ["unit-type-confusion"]],
  ],
  [
    ["Length tool", "Which tool would you use to measure a table length?", "Choose a length measuring tool.", ["tape measure", "kitchen scales", "clock"], "tape measure", numbers("Tool choice.", ["length", "tape measure"]), "tool-choice", "Tool choice", ["tool-purpose-confusion"]],
    ["Mass tool", "Which tool would measure the mass of flour?", "Choose a mass measuring tool.", ["kitchen scales", "ruler", "calendar"], "kitchen scales", numbers("Mass tool.", ["flour", "scales"]), "tool-choice", "Tool choice", ["tool-purpose-confusion"]],
    ["Capacity tool", "Which tool would measure water for a recipe?", "Choose a capacity tool.", ["measuring jug", "stopwatch", "ruler"], "measuring jug", numbers("Capacity tool.", ["water", "jug"]), "tool-choice", "Tool choice", ["tool-purpose-confusion"]],
    ["Best length unit", "Which unit is best for a classroom length?", "Choose a sensible standard unit.", ["metres", "millilitres", "grams"], "metres", numbers("Classroom length.", ["m", "mL", "g"]), "unit-choice", "Unit choice", ["unit-type-confusion"]],
    ["Small length", "Which unit is best for a pencil length?", "Choose a sensible length unit.", ["centimetres", "kilometres", "litres"], "centimetres", numbers("Pencil length.", ["cm", "km", "L"]), "unit-choice", "Unit choice", ["scale-of-unit-error"]],
    ["Recipe mass", "Which unit is sensible for sugar in a recipe?", "Choose a mass unit.", ["grams", "metres", "hours"], "grams", numbers("Recipe unit.", ["sugar", "g"]), "unit-choice", "Unit choice", ["attribute-unit-mismatch"]],
    ["Read ruler", "A ruler mark ends at 14 cm. What is the length?", "Read the mark with the unit.", ["14 cm", "14 kg", "14 L"], "14 cm", numbers("Ruler reading.", [0, 5, 10, 14]), "tool-use", "Tool use", ["wrong-unit-record"]],
    ["Thermometer", "Which tool measures temperature?", "Choose the temperature tool.", ["thermometer", "balance scale", "tape measure"], "thermometer", numbers("Temperature tool.", ["degrees", "thermometer"]), "tool-choice", "Tool choice", ["tool-purpose-confusion"]],
    ["Elapsed time tool", "Which tool helps time a race?", "Choose a timing tool.", ["stopwatch", "jug", "ruler"], "stopwatch", numbers("Timing tool.", ["start", "stop"]), "tool-choice", "Tool choice", ["tool-purpose-confusion"]],
    ["Accurate measure", "Why should you read a ruler straight on?", "Avoid reading the mark wrongly.", ["to measure more accurately", "to make it longer", "to change the unit"], "to measure more accurately", numbers("Ruler accuracy.", ["eye level", "mark"]), "accuracy", "Accuracy", ["accuracy-purpose-gap"]],
    ["Unit match", "Which pair matches correctly?", "Match quantity and unit.", ["capacity in litres", "length in kilograms", "time in centimetres"], "capacity in litres", numbers("Match units.", ["capacity:L", "length:m", "mass:kg"]), "unit-choice", "Unit choice", ["unit-match-error"]],
    ["Context choice", "Which unit is reasonable for the distance between two towns?", "Choose a large distance unit.", ["kilometres", "centimetres", "millilitres"], "kilometres", numbers("Town distance.", ["km"]), "unit-choice", "Unit choice", ["unit-scale-error"]],
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
