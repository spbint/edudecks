export type MathsReviewBankGroup =
  | "Number"
  | "Place Value"
  | "Compare Numbers"
  | "Counting"
  | "Fractions and Decimals"
  | "Spatial Structure"
  | "Unit Conversion"
  | "Multiplication Facts"
  | "Addition, Subtraction, Multiplication and Division"
  | "Time"
  | "Australian Money";

export type MathsReviewBankStatus = "ready" | "coming-soon";

export type MathsReviewBank = {
  id: string;
  label: string;
  group: MathsReviewBankGroup;
  stageHint?: string;
  status: MathsReviewBankStatus;
};

export const MATHS_REVIEW_GROUPS: MathsReviewBankGroup[] = [
  "Number",
  "Place Value",
  "Compare Numbers",
  "Counting",
  "Fractions and Decimals",
  "Spatial Structure",
  "Unit Conversion",
  "Multiplication Facts",
  "Addition, Subtraction, Multiplication and Division",
  "Time",
  "Australian Money",
];

const ready = "ready" as const;
const soon = "coming-soon" as const;

export const MATHS_REVIEW_BANKS: MathsReviewBank[] = [
  { id: "subitising-ten-frame", label: "Subitising ten frame", group: "Number", stageHint: "Early number", status: soon },
  { id: "subitising-dice", label: "Subitising dice", group: "Number", stageHint: "Early number", status: soon },
  { id: "what-number", label: "What number?", group: "Number", stageHint: "Early number", status: soon },
  { id: "write-numbers", label: "Write numbers", group: "Number", stageHint: "Early number", status: soon },
  { id: "one-after", label: "One after", group: "Number", stageHint: "Counting", status: ready },
  { id: "one-before", label: "One before", group: "Number", stageHint: "Counting", status: ready },
  { id: "ten-after", label: "Ten after", group: "Number", stageHint: "Place value", status: ready },
  { id: "ten-before", label: "Ten before", group: "Number", stageHint: "Place value", status: ready },
  { id: "one-hundred-after", label: "One hundred after", group: "Number", stageHint: "Place value", status: ready },
  { id: "one-hundred-before", label: "One hundred before", group: "Number", stageHint: "Place value", status: ready },
  { id: "odd-even", label: "Odd/even", group: "Number", stageHint: "Number properties", status: ready },
  { id: "double", label: "Double", group: "Number", stageHint: "Facts", status: ready },
  { id: "doubles-to-10", label: "Doubles to 10", group: "Number", stageHint: "Facts", status: soon },
  { id: "near-doubles-to-10", label: "Near doubles to 10", group: "Number", stageHint: "Facts", status: soon },
  { id: "halve", label: "Halve", group: "Number", stageHint: "Facts", status: ready },
  { id: "standard-partitioning", label: "Standard partitioning", group: "Number", stageHint: "Place value", status: ready },
  { id: "numberline-to-10", label: "Numberline to 10", group: "Number", stageHint: "Number lines", status: soon },
  { id: "numberline-to-100", label: "Numberline to 100", group: "Number", stageHint: "Number lines", status: soon },
  { id: "round-to-ten", label: "Round to ten", group: "Number", stageHint: "Rounding", status: ready },
  { id: "round-to-hundred", label: "Round to hundred", group: "Number", stageHint: "Rounding", status: ready },
  { id: "round-to-thousand", label: "Round to thousand", group: "Number", stageHint: "Rounding", status: ready },
  { id: "symbol-patterns", label: "Symbol patterns", group: "Number", stageHint: "Patterns", status: soon },
  { id: "number-patterns", label: "Number patterns", group: "Number", stageHint: "Patterns", status: soon },

  { id: "tens", label: "Tens", group: "Place Value", stageHint: "Place value", status: soon },
  { id: "hundreds", label: "Hundreds", group: "Place Value", stageHint: "Place value", status: soon },
  { id: "tens-hundreds-thousands", label: "Tens/hundreds/thousands", group: "Place Value", stageHint: "Place value", status: soon },
  { id: "tenths", label: "Tenths", group: "Place Value", stageHint: "Decimals", status: soon },
  { id: "hundredths", label: "Hundredths", group: "Place Value", stageHint: "Decimals", status: soon },
  { id: "decimals-to-thousandths", label: "Decimals to thousandths", group: "Place Value", stageHint: "Decimals", status: soon },

  { id: "identify-smallest-number", label: "Identify smallest number", group: "Compare Numbers", stageHint: "Comparison", status: ready },
  { id: "identify-largest-number", label: "Identify largest number", group: "Compare Numbers", stageHint: "Comparison", status: ready },
  { id: "form-largest-number", label: "Form largest number", group: "Compare Numbers", stageHint: "Comparison", status: soon },
  { id: "form-smallest-number", label: "Form smallest number", group: "Compare Numbers", stageHint: "Comparison", status: soon },
  { id: "greater-than-less-than", label: "Greater than/less than", group: "Compare Numbers", stageHint: "Comparison", status: ready },

  { id: "counting-forwards", label: "Counting forwards", group: "Counting", stageHint: "Counting", status: ready },
  { id: "counting-backwards", label: "Counting backwards", group: "Counting", stageHint: "Counting", status: ready },
  { id: "number-chart-forwards", label: "Number chart forwards", group: "Counting", stageHint: "Counting", status: soon },
  { id: "number-chart-backwards", label: "Number chart backwards", group: "Counting", stageHint: "Counting", status: soon },
  { id: "skip-counting", label: "Skip counting", group: "Counting", stageHint: "Counting", status: soon },
  { id: "skip-by-2s", label: "Skip by 2s", group: "Counting", stageHint: "Skip counting", status: ready },
  { id: "skip-by-3s", label: "Skip by 3s", group: "Counting", stageHint: "Skip counting", status: ready },
  { id: "skip-by-4s", label: "Skip by 4s", group: "Counting", stageHint: "Skip counting", status: ready },
  { id: "skip-by-5s", label: "Skip by 5s", group: "Counting", stageHint: "Skip counting", status: ready },
  { id: "skip-by-6s", label: "Skip by 6s", group: "Counting", stageHint: "Skip counting", status: ready },
  { id: "skip-by-7s", label: "Skip by 7s", group: "Counting", stageHint: "Skip counting", status: ready },
  { id: "skip-by-8s", label: "Skip by 8s", group: "Counting", stageHint: "Skip counting", status: ready },
  { id: "skip-by-9s", label: "Skip by 9s", group: "Counting", stageHint: "Skip counting", status: ready },
  { id: "skip-by-10s", label: "Skip by 10s", group: "Counting", stageHint: "Skip counting", status: ready },
  { id: "skip-by-11s", label: "Skip by 11s", group: "Counting", stageHint: "Skip counting", status: ready },
  { id: "skip-by-12s", label: "Skip by 12s", group: "Counting", stageHint: "Skip counting", status: ready },

  { id: "visual-fractions", label: "Visual fractions", group: "Fractions and Decimals", stageHint: "Fractions", status: soon },
  { id: "fractions-numberline", label: "Fractions - numberline", group: "Fractions and Decimals", stageHint: "Fractions", status: soon },
  { id: "decimals-numberline", label: "Decimals - numberline", group: "Fractions and Decimals", stageHint: "Decimals", status: soon },

  { id: "arrays", label: "Arrays", group: "Spatial Structure", stageHint: "Multiplicative thinking", status: soon },
  { id: "partially-covered-arrays", label: "Partially covered arrays", group: "Spatial Structure", stageHint: "Multiplicative thinking", status: soon },
  { id: "grid-reference", label: "Grid reference", group: "Spatial Structure", stageHint: "Location", status: soon },
  { id: "column-or-row", label: "Column or row", group: "Spatial Structure", stageHint: "Arrays", status: soon },
  { id: "2d-shape-identification", label: "2D shape identification", group: "Spatial Structure", stageHint: "Shape", status: soon },
  { id: "2d-shape-drawing", label: "2D shape drawing", group: "Spatial Structure", stageHint: "Shape", status: soon },
  { id: "3d-objects", label: "3D objects", group: "Spatial Structure", stageHint: "Objects", status: soon },
  { id: "recognising-angles", label: "Recognising angles", group: "Spatial Structure", stageHint: "Angles", status: soon },
  { id: "comparing-angles", label: "Comparing angles", group: "Spatial Structure", stageHint: "Angles", status: soon },
  { id: "recognising-right-angles", label: "Recognising right angles", group: "Spatial Structure", stageHint: "Angles", status: soon },

  { id: "mm-cm", label: "mm/cm", group: "Unit Conversion", stageHint: "Measurement", status: soon },
  { id: "cm-m", label: "cm/m", group: "Unit Conversion", stageHint: "Measurement", status: soon },
  { id: "mm-m", label: "mm/m", group: "Unit Conversion", stageHint: "Measurement", status: soon },
  { id: "m-km", label: "m/km", group: "Unit Conversion", stageHint: "Measurement", status: soon },
  { id: "ml-l", label: "ml/l", group: "Unit Conversion", stageHint: "Measurement", status: soon },
  { id: "g-kg", label: "g/kg", group: "Unit Conversion", stageHint: "Measurement", status: soon },
  { id: "cm2-m2", label: "cm2/m2", group: "Unit Conversion", stageHint: "Measurement", status: soon },

  { id: "times-by-1", label: "Times by 1", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-2", label: "Times by 2", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-3", label: "Times by 3", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-4", label: "Times by 4", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-5", label: "Times by 5", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-6", label: "Times by 6", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-7", label: "Times by 7", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-8", label: "Times by 8", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-9", label: "Times by 9", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-10", label: "Times by 10", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-11", label: "Times by 11", group: "Multiplication Facts", stageHint: "Facts", status: ready },
  { id: "times-by-12", label: "Times by 12", group: "Multiplication Facts", stageHint: "Facts", status: ready },

  { id: "make-10", label: "Make 10", group: "Addition, Subtraction, Multiplication and Division", stageHint: "Facts", status: soon },
  { id: "make-20", label: "Make 20", group: "Addition, Subtraction, Multiplication and Division", stageHint: "Facts", status: soon },
  { id: "addition", label: "Addition", group: "Addition, Subtraction, Multiplication and Division", stageHint: "Operations", status: ready },
  { id: "missing-number-addition", label: "Missing number addition", group: "Addition, Subtraction, Multiplication and Division", stageHint: "Operations", status: ready },
  { id: "subtraction", label: "Subtraction", group: "Addition, Subtraction, Multiplication and Division", stageHint: "Operations", status: ready },
  { id: "missing-number-subtraction", label: "Missing number subtraction", group: "Addition, Subtraction, Multiplication and Division", stageHint: "Operations", status: ready },
  { id: "multiplication", label: "Multiplication", group: "Addition, Subtraction, Multiplication and Division", stageHint: "Operations", status: ready },
  { id: "division", label: "Division", group: "Addition, Subtraction, Multiplication and Division", stageHint: "Operations", status: ready },
  { id: "missing-factors", label: "Missing factors", group: "Addition, Subtraction, Multiplication and Division", stageHint: "Operations", status: ready },
  { id: "listing-factors", label: "Listing factors", group: "Addition, Subtraction, Multiplication and Division", stageHint: "Operations", status: soon },

  { id: "hour", label: "Hour", group: "Time", stageHint: "Time", status: soon },
  { id: "half-hour", label: "Half hour", group: "Time", stageHint: "Time", status: soon },
  { id: "quarter-hour", label: "Quarter hour", group: "Time", stageHint: "Time", status: soon },
  { id: "5-min", label: "5 min", group: "Time", stageHint: "Time", status: soon },
  { id: "1-min", label: "1 min", group: "Time", stageHint: "Time", status: soon },
  { id: "24-12-conversion", label: "24/12 conversion", group: "Time", stageHint: "Time", status: soon },
  { id: "time-facts", label: "Time facts", group: "Time", stageHint: "Time", status: soon },

  { id: "recognising-coins-and-notes", label: "Recognising coins and notes", group: "Australian Money", stageHint: "Money", status: soon },
  { id: "adding-notes-and-coins", label: "Adding notes & coins", group: "Australian Money", stageHint: "Money", status: soon },
  { id: "adding-coins", label: "Adding coins", group: "Australian Money", stageHint: "Money", status: soon },
  { id: "adding-notes", label: "Adding notes", group: "Australian Money", stageHint: "Money", status: soon },
];

export const READY_MATHS_REVIEW_BANK_IDS = new Set(
  MATHS_REVIEW_BANKS.filter((bank) => bank.status === "ready").map((bank) => bank.id),
);

export function getMathsReviewBankById(id: string) {
  return MATHS_REVIEW_BANKS.find((bank) => bank.id === id) ?? null;
}
