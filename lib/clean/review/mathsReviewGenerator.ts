import {
  getMathsReviewBankById,
  MATHS_REVIEW_BANKS,
  type MathsReviewBank,
  type MathsReviewBankGroup,
} from "@/lib/clean/review/mathsReviewBanks";

export type MathsReviewOrder = "sequential" | "random";
export type MathsReviewQuestionType = "input" | "choice";
export type MathsReviewVisualModel =
  | "ten_frame"
  | "number_line"
  | "array_board"
  | "equal_groups_board"
  | "place_value_blocks"
  | "fraction_bar"
  | "ruler_board"
  | "capacity_jug"
  | "mass_scale"
  | "clock_face"
  | "shape_board"
  | "coordinate_grid"
  | "money_board";

export type MathsReviewVisualMetadata = {
  visualModel: MathsReviewVisualModel;
  interactionType:
    | "click_objects"
    | "interactive_number_line"
    | "build_array"
    | "equal_groups"
    | "build_place_value"
    | "interactive_fraction_bar"
    | "interactive_ruler"
    | "interactive_capacity_jug"
    | "interactive_mass_scale"
    | "interactive_clock"
    | "plot_coordinates"
    | "generic_money_model";
  values?: number[];
  labels?: string[];
  targetValue?: number | string;
  min?: number;
  max?: number;
  step?: number;
  targetLength?: number;
  measuredLength?: number;
  targetCapacity?: number;
  measuredCapacity?: number;
  containerLabel?: string;
  containerVisual?: string;
  fillLevel?: number;
  targetMass?: number;
  measuredMass?: number;
  scaleType?: "digital" | "balance" | "kitchen";
  conversionMode?: boolean;
  tolerance?: number;
  objectLabel?: string;
  objectVisual?: string;
  estimate?: number;
  showEstimate?: boolean;
  tickLabels?: Record<string, string>;
  allowedValues?: Array<number | string>;
  rows?: number;
  columns?: number;
  targetRows?: number;
  targetColumns?: number;
  total?: number;
  groupCount?: number;
  itemsPerGroup?: number;
  targetGroupCount?: number;
  targetItemsPerGroup?: number;
  selectedObjects?: string[];
  arrangementMode?: "array" | "equal_groups" | "repeated_addition" | "division_sharing";
  allowCommutativeArrays?: boolean;
  repeatedAdditionSentence?: string;
  multiplicationSentence?: string;
  divisionSentence?: string;
  shadedParts?: number;
  denominator?: number;
  wholeCount?: number;
  targetNumerator?: number;
  targetDenominator?: number;
  selectedParts?: number[];
  allowedFractions?: Array<{ numerator: number; denominator: number; wholeCount?: number; decimalEquivalent?: number }>;
  equivalentAccepted?: boolean;
  decimalEquivalent?: number;
  labelMode?: "fraction" | "decimal" | "percent" | "mixed" | "analogue" | "digital" | "both" | "ticks" | "numeric";
  promptValue?: number | string;
  hour?: number;
  minute?: number;
  targetHour?: number;
  targetMinute?: number;
  allowedMinutes?: number[];
  clockMode?: "read" | "set" | "match";
  eventContext?: string;
  currencySymbol?: string;
  currencyCode?: string;
  localisationMode?: "generic" | "AU" | "UK" | "US";
  tokenValues?: number[];
  selectedTokens?: number[];
  targetTotal?: number;
  priceTags?: Array<{ id: string; label: string; value: number }>;
  selectedPriceTagId?: string;
  itemContext?: string;
  showNotes?: boolean;
  showCoins?: boolean;
  allowMultipleTokens?: boolean;
  unit?: string;
  note?: string;
};

export type MathsReviewSettings = {
  selectedBankIds: string[];
  questionsPerFocusArea: number;
  lowestNumber: number;
  highestNumber: number;
  order: MathsReviewOrder;
  questionCount: number;
};

export type MathsReviewQuestion = {
  id: string;
  bankId: string;
  bankLabel: string;
  group: MathsReviewBankGroup;
  type: MathsReviewQuestionType;
  prompt: string;
  answer: string;
  acceptableAnswers: string[];
  choices?: string[];
  explanation: string;
  visualHint?: string;
  visual?: MathsReviewVisualMetadata;
};

type QuestionFactory = (bank: MathsReviewBank, settings: MathsReviewSettings, index: number) => MathsReviewQuestion;

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ");
}

function numberAnswer(value: number) {
  return String(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getRange(settings: MathsReviewSettings) {
  const low = Math.floor(Math.min(settings.lowestNumber, settings.highestNumber));
  const high = Math.floor(Math.max(settings.lowestNumber, settings.highestNumber));
  return {
    low: clamp(low, -10000, 10000),
    high: clamp(high, -10000, 10000),
  };
}

function randInt(min: number, max: number) {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T>(items: T[], seed: string) {
  const shuffled = [...items];
  let state = stableHash(seed) || 1;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = Math.imul(state ^ (state >>> 15), 2246822519) >>> 0;
    const swapIndex = state % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function makeChoices(correct: string, distractors: string[]) {
  const unique = [correct, ...distractors].filter((value, index, list) => list.indexOf(value) === index);
  return shuffle(unique).slice(0, 4);
}

function parseFractionValue(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();
  const mixed = text.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const wholeCount = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (Number.isFinite(wholeCount) && Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0) {
      return { wholeCount, numerator, denominator, decimalEquivalent: wholeCount + numerator / denominator };
    }
  }
  const fraction = text.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0) {
      return { wholeCount: 0, numerator, denominator, decimalEquivalent: numerator / denominator };
    }
  }
  const decimal = Number(text.replace(/[^0-9.-]/g, ""));
  if (Number.isFinite(decimal) && decimal > 0 && decimal < 1) {
    const denominator = text.includes("0.25") || text.includes(".25") || text.includes("0.75") || text.includes(".75") ? 4 : 10;
    const numerator = Math.round(decimal * denominator);
    return { wholeCount: 0, numerator, denominator, decimalEquivalent: decimal };
  }
  return null;
}

function parseTimeValue(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();
  const digital = text.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (digital) {
    const hour = Number(digital[1]);
    const minute = Number(digital[2]);
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      const wrapped = hour % 12 || 12;
      return { hour: wrapped, minute };
    }
  }
  const oclock = text.match(/(\d{1,2})\s*(?:o'clock|oclock|:00)?/);
  if (oclock) {
    const hour = Number(oclock[1]);
    if (Number.isFinite(hour)) return { hour: hour % 12 || 12, minute: 0 };
  }
  return null;
}

function buildMathsReviewVisual(
  bank: MathsReviewBank,
  question: Omit<MathsReviewQuestion, "id" | "bankId" | "bankLabel" | "group">,
): MathsReviewVisualMetadata {
  const numbers = [question.prompt, question.answer]
    .join(" ")
    .match(/-?\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((value) => Number.isFinite(value)) ?? [];
  const first = numbers[0] ?? (Number(question.answer) || 0);
  const target = Number(question.answer);

  if (bank.id === "subitising-ten-frame" || bank.id === "make-10" || bank.id === "make-20") {
    return {
      visualModel: "ten_frame",
      interactionType: "click_objects",
      targetValue: Number.isFinite(target) ? target : first,
      note: "Ten-frame model for quick number structure.",
    };
  }

  if (
    bank.group === "Counting" ||
    bank.id.includes("numberline") ||
    bank.id.includes("round-to") ||
    bank.id.includes("after") ||
    bank.id.includes("before") ||
    bank.id === "greater-than-less-than" ||
    bank.id.includes("smallest") ||
    bank.id.includes("largest")
  ) {
    return {
      visualModel: "number_line",
      interactionType: "interactive_number_line",
      values: numbers.slice(0, 6),
      targetValue: Number.isFinite(target) ? target : first,
      note: "Number-line model for order, counting and magnitude.",
    };
  }

  if (
    bank.group === "Multiplication Facts" ||
    bank.id === "multiplication" ||
    bank.id === "arrays" ||
    bank.id === "partially-covered-arrays" ||
    bank.id === "missing-factors"
  ) {
    const rows = Math.max(1, Math.min(12, numbers[0] || 3));
    const columns = Math.max(1, Math.min(12, numbers[1] || numbers[0] || 4));
    return {
      visualModel: "array_board",
      interactionType: "build_array",
      rows,
      columns,
      targetRows: rows,
      targetColumns: columns,
      total: rows * columns,
      targetValue: rows * columns,
      targetTotal: rows * columns,
      arrangementMode: "array",
      allowCommutativeArrays: true,
      repeatedAdditionSentence: Array.from({ length: rows }, () => String(columns)).join(" + "),
      multiplicationSentence: `${rows} x ${columns} = ${rows * columns}`,
      objectVisual: "counter",
      note: "Array model for groups, rows and columns.",
    };
  }

  if (bank.id === "division") {
    const total = Math.max(1, numbers[0] || 12);
    const groupCount = Math.max(1, numbers[1] || 3);
    const itemsPerGroup = Math.max(1, Math.round(total / groupCount));
    return {
      visualModel: "equal_groups_board",
      interactionType: "equal_groups",
      groupCount,
      itemsPerGroup,
      targetGroupCount: groupCount,
      targetItemsPerGroup: itemsPerGroup,
      total,
      targetTotal: total,
      arrangementMode: "division_sharing",
      divisionSentence: `${total} / ${groupCount} = ${itemsPerGroup}`,
      objectVisual: "counter",
      note: "Equal-groups model for sharing and division.",
    };
  }

  if (bank.group === "Place Value" || bank.id === "standard-partitioning") {
    return {
      visualModel: "place_value_blocks",
      interactionType: "build_place_value",
      targetValue: first,
      note: "Place-value blocks model for number structure.",
    };
  }

  if (bank.group === "Fractions and Decimals" || bank.id === "halve") {
    const parsed = parseFractionValue(question.answer) ?? parseFractionValue(question.acceptableAnswers[0]);
    const denominator = parsed?.denominator ?? (question.answer === "3/4" ? 4 : 2);
    const numerator = parsed?.numerator ?? (question.answer === "3/4" ? 3 : 1);
    const wholeCount = parsed?.wholeCount ?? 0;
    return {
      visualModel: "fraction_bar",
      interactionType: "interactive_fraction_bar",
      shadedParts: numerator,
      denominator,
      targetNumerator: numerator,
      targetDenominator: denominator,
      wholeCount,
      selectedParts: Array.from({ length: wholeCount * denominator + numerator }, (_, index) => index),
      allowedFractions: parsed ? [parsed] : undefined,
      equivalentAccepted: bank.id.includes("numberline") || bank.id.includes("decimal") || question.acceptableAnswers.length > 1,
      decimalEquivalent: parsed?.decimalEquivalent,
      labelMode: parsed && parsed.decimalEquivalent >= 1 ? "mixed" : bank.id.includes("decimal") ? "decimal" : "fraction",
      promptValue: question.answer,
      note: "Fraction bar model for part-whole reasoning.",
    };
  }

  if (bank.group === "Unit Conversion") {
    const targetLength = Number.isFinite(target) ? target : first;
    const unit = bank.id.startsWith("mm") ? "mm" : bank.id.includes("cm") ? "cm" : bank.id.includes("m-") || bank.id.includes("-m") ? "m" : bank.label;
    const max = Math.max(10, Math.ceil(targetLength * 1.15));
    if (bank.id === "ml-l") {
      const targetCapacity = Number.isFinite(target) ? target : first;
      const capacityUnit = String(question.answer).toLowerCase().includes("l") && !String(question.answer).toLowerCase().includes("ml") ? "L" : "mL";
      return {
        visualModel: "capacity_jug",
        interactionType: "interactive_capacity_jug",
        values: numbers.slice(0, 4),
        unit: capacityUnit,
        targetCapacity,
        measuredCapacity: targetCapacity,
        min: 0,
        max: Math.max(capacityUnit === "L" ? 2 : 1000, Math.ceil(targetCapacity * 1.15)),
        step: capacityUnit === "L" ? 0.25 : 50,
        containerLabel: "Measuring jug",
        containerVisual: "jug",
        fillLevel: 0,
        conversionMode: true,
        labelMode: "both",
        note: "Capacity jug model for litres and millilitres.",
      };
    }
    if (bank.id === "g-kg") {
      const targetMass = Number.isFinite(target) ? target : first;
      const massUnit = String(question.answer).toLowerCase().includes("kg") ? "kg" : "g";
      return {
        visualModel: "mass_scale",
        interactionType: "interactive_mass_scale",
        values: numbers.slice(0, 4),
        unit: massUnit,
        targetMass,
        measuredMass: targetMass,
        min: 0,
        max: Math.max(massUnit === "kg" ? 5 : 1000, Math.ceil(targetMass * 1.15)),
        step: massUnit === "kg" ? 0.5 : 50,
        objectLabel: "Package",
        objectVisual: "package",
        scaleType: "digital",
        conversionMode: true,
        labelMode: "both",
        note: "Mass scale model for grams and kilograms.",
      };
    }
    return {
      visualModel: "ruler_board",
      interactionType: "interactive_ruler",
      values: numbers.slice(0, 4),
      unit,
      targetLength,
      measuredLength: targetLength,
      min: 0,
      max,
      step: unit === "mm" ? 1 : targetLength % 1 === 0 ? 1 : 0.5,
      objectLabel: "Conversion length",
      objectVisual: "pencil",
      showEstimate: false,
      labelMode: "both",
      note: "Measurement tool model for conversion reasoning.",
    };
  }

  if (bank.group === "Time") {
    const parsed = parseTimeValue(question.answer) ?? parseTimeValue(question.prompt);
    const hour = parsed?.hour ?? Number(question.answer.match(/\d+/)?.[0] ?? numbers[0] ?? 3);
    const minute = parsed?.minute ?? (question.answer.includes(":45") ? 45 : question.answer.includes(":30") ? 30 : question.answer.includes(":15") ? 15 : 0);
    return {
      visualModel: "clock_face",
      interactionType: "interactive_clock",
      hour,
      minute,
      targetHour: hour,
      targetMinute: minute,
      allowedMinutes: bank.id === "1-min" ? Array.from({ length: 60 }, (_, index) => index) : bank.id === "5-min" ? Array.from({ length: 12 }, (_, index) => index * 5) : [0, 15, 30, 45],
      clockMode: bank.id.includes("match") ? "match" : "set",
      labelMode: "both",
      note: "Clock model for reading and converting time.",
    };
  }

  if (bank.group === "Australian Money") {
    const targetTotal = Number.isFinite(target) ? target : Number(String(question.answer).replace(/[^0-9.]/g, ""));
    return {
      visualModel: "money_board",
      interactionType: "generic_money_model",
      labels: ["1", "5", "10", "20", "50"],
      tokenValues: [1, 5, 10, 20, 50],
      selectedTokens: Number.isFinite(targetTotal) ? [targetTotal] : undefined,
      targetTotal: Number.isFinite(targetTotal) ? targetTotal : undefined,
      currencySymbol: "",
      currencyCode: "GEN",
      localisationMode: "generic",
      itemContext: bank.label,
      showCoins: true,
      showNotes: true,
      allowMultipleTokens: true,
      targetValue: question.answer,
      note: "Generic money model; local currency should be a localisation layer.",
    };
  }

  if (bank.id === "grid-reference") {
    return {
      visualModel: "coordinate_grid",
      interactionType: "plot_coordinates",
      targetValue: question.answer,
      note: "Coordinate grid model for location.",
    };
  }

  if (bank.group === "Spatial Structure") {
    return {
      visualModel: "shape_board",
      interactionType: "click_objects",
      labels: question.choices ?? [question.answer],
      targetValue: question.answer,
      note: "Shape board model for spatial structure.",
    };
  }

  return {
    visualModel: "number_line",
    interactionType: "interactive_number_line",
    values: numbers.slice(0, 6),
    targetValue: Number.isFinite(target) ? target : first,
    note: "Number-line model for review practice.",
  };
}

function withBase(
  bank: MathsReviewBank,
  index: number,
  question: Omit<MathsReviewQuestion, "id" | "bankId" | "bankLabel" | "group">,
): MathsReviewQuestion {
  const choices = question.choices
    ? seededShuffle(
        question.choices,
        `${bank.id}-${index}-${question.prompt}-${question.answer}`,
      )
    : undefined;
  const questionWithChoices = { ...question, choices };
  const visual = question.visual ?? buildMathsReviewVisual(bank, questionWithChoices);
  return {
    id: `${bank.id}-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    bankId: bank.id,
    bankLabel: bank.label,
    group: bank.group,
    visual,
    ...questionWithChoices,
  };
}

function choiceQuestion(
  bank: MathsReviewBank,
  index: number,
  prompt: string,
  answer: string,
  choices: string[],
  explanation: string,
  visualHint?: string,
  acceptableAnswers: string[] = [answer],
) {
  return withBase(bank, index, {
    type: "choice",
    prompt,
    answer,
    acceptableAnswers,
    choices,
    explanation,
    visualHint,
  });
}

function inputQuestion(
  bank: MathsReviewBank,
  index: number,
  prompt: string,
  answer: string,
  explanation: string,
  visualHint?: string,
  acceptableAnswers: string[] = [answer],
) {
  return withBase(bank, index, {
    type: "input",
    prompt,
    answer,
    acceptableAnswers,
    explanation,
    visualHint,
  });
}

function tenFrameVisual(value: number) {
  return Array.from({ length: 10 }, (_, index) => (index < value ? "●" : "○")).join(" ");
}

function factorList(value: number) {
  return Array.from({ length: value }, (_, index) => index + 1).filter((candidate) => value % candidate === 0);
}

function oneAfter(bank: MathsReviewBank, settings: MathsReviewSettings, index: number) {
  const { low, high } = getRange(settings);
  const value = randInt(low, high);
  const answer = value + 1;
  return withBase(bank, index, {
    type: "input",
    prompt: `What number comes one after ${value}?`,
    answer: numberAnswer(answer),
    acceptableAnswers: [numberAnswer(answer)],
    explanation: `${value} plus 1 is ${answer}.`,
    visualHint: "Think of the next counting number.",
  });
}

function oneBefore(bank: MathsReviewBank, settings: MathsReviewSettings, index: number) {
  const { low, high } = getRange(settings);
  const value = randInt(low + 1, high + 1);
  const answer = value - 1;
  return withBase(bank, index, {
    type: "input",
    prompt: `What number comes one before ${value}?`,
    answer: numberAnswer(answer),
    acceptableAnswers: [numberAnswer(answer)],
    explanation: `${value} minus 1 is ${answer}.`,
    visualHint: "Count back one step.",
  });
}

function offsetNumber(bank: MathsReviewBank, settings: MathsReviewSettings, index: number, offset: number, label: string) {
  const { low, high } = getRange(settings);
  const value = randInt(low, high);
  const answer = value + offset;
  return withBase(bank, index, {
    type: "input",
    prompt: `What number is ${label} ${value}?`,
    answer: numberAnswer(answer),
    acceptableAnswers: [numberAnswer(answer)],
    explanation: `${value} ${offset >= 0 ? "+" : "-"} ${Math.abs(offset)} = ${answer}.`,
    visualHint: offset > 0 ? "Move forward on a number line." : "Move backward on a number line.",
  });
}

function oddEven(bank: MathsReviewBank, settings: MathsReviewSettings, index: number) {
  const { low, high } = getRange(settings);
  const value = randInt(Math.max(0, low), Math.max(1, high));
  const answer = value % 2 === 0 ? "even" : "odd";
  return withBase(bank, index, {
    type: "choice",
    prompt: `Is ${value} odd or even?`,
    answer,
    acceptableAnswers: [answer],
    choices: ["odd", "even"],
    explanation: `${value} is ${answer} because it ${answer === "even" ? "can" : "cannot"} be shared into two equal whole-number groups.`,
  });
}

function doubleNumber(bank: MathsReviewBank, settings: MathsReviewSettings, index: number) {
  const { low, high } = getRange(settings);
  const value = randInt(Math.max(0, low), Math.max(1, high));
  const answer = value * 2;
  return withBase(bank, index, {
    type: "input",
    prompt: `Double ${value}.`,
    answer: numberAnswer(answer),
    acceptableAnswers: [numberAnswer(answer)],
    explanation: `${value} + ${value} = ${answer}.`,
    visualHint: "Double means two equal groups.",
  });
}

function halveNumber(bank: MathsReviewBank, settings: MathsReviewSettings, index: number) {
  const { low, high } = getRange(settings);
  const half = randInt(Math.max(1, Math.ceil(low / 2)), Math.max(2, Math.floor(high / 2)));
  const value = half * 2;
  return withBase(bank, index, {
    type: "input",
    prompt: `Halve ${value}.`,
    answer: numberAnswer(half),
    acceptableAnswers: [numberAnswer(half)],
    explanation: `${value} shared into two equal parts gives ${half} in each part.`,
    visualHint: "Halve means split into two equal parts.",
  });
}

function standardPartitioning(bank: MathsReviewBank, settings: MathsReviewSettings, index: number) {
  const { low, high } = getRange(settings);
  const value = randInt(Math.max(100, low), Math.max(999, high));
  const hundreds = Math.floor(value / 100) * 100;
  const tens = Math.floor((value % 100) / 10) * 10;
  const ones = value % 10;
  const correct = `${hundreds} + ${tens} + ${ones}`;
  return withBase(bank, index, {
    type: "choice",
    prompt: `Which partition shows ${value}?`,
    answer: correct,
    acceptableAnswers: [correct],
    choices: makeChoices(correct, [
      `${hundreds} + ${ones} + ${tens}`,
      `${hundreds + tens} + ${ones + 10}`,
      `${hundreds - 100} + ${tens + 100} + ${ones}`,
    ]),
    explanation: `${value} has ${hundreds} hundreds value, ${tens} tens value, and ${ones} ones.`,
    visualHint: "Break the number into hundreds, tens, and ones.",
  });
}

function roundTo(bank: MathsReviewBank, settings: MathsReviewSettings, index: number, place: number, label: string) {
  const { low, high } = getRange(settings);
  const value = randInt(Math.max(0, low), Math.max(place + 1, high));
  const answer = Math.round(value / place) * place;
  return withBase(bank, index, {
    type: "input",
    prompt: `Round ${value} to the nearest ${label}.`,
    answer: numberAnswer(answer),
    acceptableAnswers: [numberAnswer(answer)],
    explanation: `${value} rounds to ${answer} to the nearest ${label}.`,
    visualHint: "Look at the digit just to the right of the rounding place.",
  });
}

function identifyExtreme(bank: MathsReviewBank, settings: MathsReviewSettings, index: number, mode: "smallest" | "largest") {
  const { low, high } = getRange(settings);
  const values = shuffle(Array.from({ length: 8 }, () => randInt(low, high)))
    .filter((value, valueIndex, list) => list.indexOf(value) === valueIndex)
    .slice(0, 4);
  while (values.length < 4) values.push(randInt(low, high));
  const answer = mode === "smallest" ? Math.min(...values) : Math.max(...values);
  return withBase(bank, index, {
    type: "choice",
    prompt: `Choose the ${mode} number.`,
    answer: numberAnswer(answer),
    acceptableAnswers: [numberAnswer(answer)],
    choices: shuffle(values.map(numberAnswer)),
    explanation: `${answer} is the ${mode} number in the set.`,
  });
}

function greaterThanLessThan(bank: MathsReviewBank, settings: MathsReviewSettings, index: number) {
  const { low, high } = getRange(settings);
  const left = randInt(low, high);
  const right = randInt(low, high);
  const answer = left > right ? ">" : left < right ? "<" : "=";
  return withBase(bank, index, {
    type: "choice",
    prompt: `${left} __ ${right}`,
    answer,
    acceptableAnswers: [answer],
    choices: [">", "<", "="],
    explanation: `${left} is ${answer === ">" ? "greater than" : answer === "<" ? "less than" : "equal to"} ${right}.`,
  });
}

function counting(bank: MathsReviewBank, settings: MathsReviewSettings, index: number, direction: "forwards" | "backwards") {
  const { low, high } = getRange(settings);
  const start = direction === "forwards" ? randInt(low, high - 4) : randInt(low + 4, high);
  const sequence = Array.from({ length: 4 }, (_, sequenceIndex) =>
    direction === "forwards" ? start + sequenceIndex : start - sequenceIndex,
  );
  const answer = direction === "forwards" ? start + 4 : start - 4;
  return withBase(bank, index, {
    type: "input",
    prompt: `Continue counting ${direction}: ${sequence.join(", ")}, __`,
    answer: numberAnswer(answer),
    acceptableAnswers: [numberAnswer(answer)],
    explanation: `The next number is ${answer}.`,
    visualHint: direction === "forwards" ? "Count up by ones." : "Count back by ones.",
  });
}

function skipBy(bank: MathsReviewBank, settings: MathsReviewSettings, index: number, step: number) {
  const { low, high } = getRange(settings);
  const start = randInt(Math.max(0, low), Math.max(step, high - step * 4));
  const sequence = Array.from({ length: 4 }, (_, sequenceIndex) => start + sequenceIndex * step);
  const answer = start + step * 4;
  return withBase(bank, index, {
    type: "input",
    prompt: `Skip count by ${step}s: ${sequence.join(", ")}, __`,
    answer: numberAnswer(answer),
    acceptableAnswers: [numberAnswer(answer)],
    explanation: `Add ${step} each time. The next number is ${answer}.`,
    visualHint: `Each jump is ${step}.`,
  });
}

function timesBy(bank: MathsReviewBank, settings: MathsReviewSettings, index: number, factor: number) {
  const { low, high } = getRange(settings);
  const value = randInt(Math.max(0, low), Math.max(12, Math.min(12, high)));
  const answer = factor * value;
  return withBase(bank, index, {
    type: "input",
    prompt: `${factor} x ${value} = ?`,
    answer: numberAnswer(answer),
    acceptableAnswers: [numberAnswer(answer)],
    explanation: `${factor} groups of ${value} is ${answer}.`,
    visualHint: "Use a known multiplication fact.",
  });
}

function operation(bank: MathsReviewBank, settings: MathsReviewSettings, index: number, op: "addition" | "subtraction" | "multiplication" | "division") {
  const { low, high } = getRange(settings);
  if (op === "addition") {
    const left = randInt(low, high);
    const right = randInt(low, high);
    const answer = left + right;
    return withBase(bank, index, {
      type: "input",
      prompt: `${left} + ${right} = ?`,
      answer: numberAnswer(answer),
      acceptableAnswers: [numberAnswer(answer)],
      explanation: `${left} + ${right} = ${answer}.`,
    });
  }
  if (op === "subtraction") {
    const total = randInt(low, high);
    const part = randInt(low, total);
    const answer = total - part;
    return withBase(bank, index, {
      type: "input",
      prompt: `${total} - ${part} = ?`,
      answer: numberAnswer(answer),
      acceptableAnswers: [numberAnswer(answer)],
      explanation: `${total} - ${part} = ${answer}.`,
    });
  }
  if (op === "multiplication") {
    const left = randInt(1, 12);
    const right = randInt(1, 12);
    const answer = left * right;
    return withBase(bank, index, {
      type: "input",
      prompt: `${left} x ${right} = ?`,
      answer: numberAnswer(answer),
      acceptableAnswers: [numberAnswer(answer)],
      explanation: `${left} x ${right} = ${answer}.`,
    });
  }
  const divisor = randInt(1, 12);
  const quotient = randInt(1, 12);
  const dividend = divisor * quotient;
  return withBase(bank, index, {
    type: "input",
    prompt: `${dividend} / ${divisor} = ?`,
    answer: numberAnswer(quotient),
    acceptableAnswers: [numberAnswer(quotient)],
    explanation: `${dividend} shared into ${divisor} equal groups gives ${quotient}.`,
  });
}

function missingNumber(bank: MathsReviewBank, settings: MathsReviewSettings, index: number, op: "addition" | "subtraction") {
  const { low, high } = getRange(settings);
  if (op === "addition") {
    const missing = randInt(low, high);
    const known = randInt(low, high);
    const total = missing + known;
    return withBase(bank, index, {
      type: "input",
      prompt: `__ + ${known} = ${total}`,
      answer: numberAnswer(missing),
      acceptableAnswers: [numberAnswer(missing)],
      explanation: `${total} - ${known} = ${missing}.`,
      visualHint: "Use the inverse operation.",
    });
  }
  const start = randInt(Math.max(1, low), Math.max(2, high));
  const missing = randInt(0, start);
  const result = start - missing;
  return withBase(bank, index, {
    type: "input",
    prompt: `${start} - __ = ${result}`,
    answer: numberAnswer(missing),
    acceptableAnswers: [numberAnswer(missing)],
    explanation: `${start} - ${result} = ${missing}.`,
    visualHint: "Find the part that was taken away.",
  });
}

function missingFactor(bank: MathsReviewBank, _settings: MathsReviewSettings, index: number) {
  const missing = randInt(1, 12);
  const known = randInt(1, 12);
  const product = missing * known;
  return withBase(bank, index, {
    type: "input",
    prompt: `${known} x __ = ${product}`,
    answer: numberAnswer(missing),
    acceptableAnswers: [numberAnswer(missing)],
    explanation: `${product} / ${known} = ${missing}.`,
    visualHint: "Use the related division fact.",
  });
}

function generalMathsReviewQuestion(bank: MathsReviewBank, settings: MathsReviewSettings, index: number): MathsReviewQuestion {
  const { low, high } = getRange(settings);
  const positiveLow = Math.max(0, low);
  const positiveHigh = Math.max(20, high);

  switch (bank.id) {
    case "subitising-ten-frame": {
      const value = randInt(1, 10);
      return inputQuestion(
        bank,
        index,
        "How many dots are shown in the ten frame?",
        numberAnswer(value),
        `There are ${value} filled spaces.`,
        tenFrameVisual(value),
      );
    }
    case "subitising-dice": {
      const value = randInt(1, 6);
      return inputQuestion(bank, index, "How many dice dots?", numberAnswer(value), `The dice pattern shows ${value}.`, "● ".repeat(value).trim());
    }
    case "what-number": {
      const value = randInt(positiveLow, positiveHigh);
      return inputQuestion(bank, index, "What number is shown?", numberAnswer(value), `The number is ${value}.`, String(value));
    }
    case "write-numbers": {
      const value = randInt(positiveLow, positiveHigh);
      return inputQuestion(bank, index, `Write this number: ${value}`, numberAnswer(value), `Write ${value}.`);
    }
    case "doubles-to-10": {
      const value = randInt(1, 10);
      const answer = value * 2;
      return inputQuestion(bank, index, `Double ${value}.`, numberAnswer(answer), `${value} + ${value} = ${answer}.`);
    }
    case "near-doubles-to-10": {
      const value = randInt(1, 10);
      const answer = value + value + 1;
      return inputQuestion(bank, index, `${value} + ${value + 1} = ?`, numberAnswer(answer), `Use the double ${value} + ${value}, then add 1.`);
    }
    case "numberline-to-10": {
      const missing = randInt(0, 10);
      const line = Array.from({ length: 11 }, (_, value) => (value === missing ? "__" : String(value))).join(" ");
      return inputQuestion(bank, index, "Find the missing number on the number line.", numberAnswer(missing), `The missing number is ${missing}.`, line);
    }
    case "numberline-to-100": {
      const missing = randInt(0, 10) * 10;
      const line = Array.from({ length: 11 }, (_, value) => value * 10).map((value) => (value === missing ? "__" : String(value))).join(" ");
      return inputQuestion(bank, index, "Find the missing number on the number line.", numberAnswer(missing), `The missing number is ${missing}.`, line);
    }
    case "symbol-patterns":
      return choiceQuestion(bank, index, "What comes next? ▲ ● ▲ ● __", "▲", ["▲", "●", "■", "◆"], "The pattern repeats triangle, circle.");
    case "number-patterns": {
      const step = [2, 3, 5, 10][randInt(0, 3)];
      const start = randInt(1, 20);
      const sequence = [start, start + step, start + step * 2, start + step * 3];
      const answer = start + step * 4;
      return inputQuestion(bank, index, `Continue the pattern: ${sequence.join(", ")}, __`, numberAnswer(answer), `Add ${step} each time.`);
    }
    case "tens": {
      const tens = randInt(1, 9);
      return inputQuestion(bank, index, `How many tens are in ${tens * 10}?`, numberAnswer(tens), `${tens * 10} is ${tens} tens.`);
    }
    case "hundreds": {
      const hundreds = randInt(1, 9);
      return inputQuestion(bank, index, `How many hundreds are in ${hundreds * 100}?`, numberAnswer(hundreds), `${hundreds * 100} is ${hundreds} hundreds.`);
    }
    case "tens-hundreds-thousands": {
      const value = randInt(1000, 9999);
      const digit = Math.floor(value / 1000);
      return inputQuestion(bank, index, `What digit is in the thousands place in ${value}?`, numberAnswer(digit), `${digit} is in the thousands place.`);
    }
    case "tenths": {
      const tenths = randInt(1, 9);
      return inputQuestion(bank, index, `Write ${tenths} tenths as a decimal.`, `0.${tenths}`, `${tenths} tenths is 0.${tenths}.`, undefined, [`0.${tenths}`, `.${tenths}`]);
    }
    case "hundredths": {
      const hundredths = randInt(1, 99);
      const answer = (hundredths / 100).toFixed(2);
      return inputQuestion(bank, index, `Write ${hundredths} hundredths as a decimal.`, answer, `${hundredths} hundredths is ${answer}.`);
    }
    case "decimals-to-thousandths": {
      const thousandths = randInt(1, 999);
      const answer = (thousandths / 1000).toFixed(3);
      return inputQuestion(bank, index, `Write ${thousandths} thousandths as a decimal.`, answer, `${thousandths} thousandths is ${answer}.`);
    }
    case "form-largest-number":
    case "form-smallest-number": {
      const digits = shuffle([randInt(1, 9), randInt(0, 9), randInt(0, 9)]);
      const sorted = [...digits].sort((a, b) => (bank.id === "form-largest-number" ? b - a : a - b));
      if (bank.id === "form-smallest-number" && sorted[0] === 0) {
        const firstNonZeroIndex = sorted.findIndex((digit) => digit > 0);
        [sorted[0], sorted[firstNonZeroIndex]] = [sorted[firstNonZeroIndex], sorted[0]];
      }
      const answer = sorted.join("");
      return inputQuestion(bank, index, `Use ${digits.join(", ")} to form the ${bank.id === "form-largest-number" ? "largest" : "smallest"} number.`, answer, `The answer is ${answer}.`);
    }
    case "number-chart-forwards":
      return oneAfter(bank, settings, index);
    case "number-chart-backwards":
      return oneBefore(bank, settings, index);
    case "skip-counting":
      return skipBy(bank, settings, index, randInt(2, 12));
    case "visual-fractions":
      return choiceQuestion(bank, index, "What fraction is shaded? ■ ■ ■ □", "3/4", ["1/4", "1/2", "3/4", "4/4"], "Three out of four equal parts are shaded.");
    case "fractions-numberline":
      return inputQuestion(bank, index, "What fraction is halfway between 0 and 1?", "1/2", "Halfway between 0 and 1 is 1/2.", "0 ---- ? ---- 1", ["1/2", "2/4", "0.5"]);
    case "decimals-numberline":
      return inputQuestion(bank, index, "What decimal is halfway between 0 and 1?", "0.5", "Halfway between 0 and 1 is 0.5.", "0 ---- ? ---- 1", ["0.5", ".5", "1/2"]);
    case "arrays": {
      const rows = randInt(2, 5);
      const columns = randInt(2, 5);
      return inputQuestion(bank, index, `An array has ${rows} rows and ${columns} columns. How many altogether?`, numberAnswer(rows * columns), `${rows} x ${columns} = ${rows * columns}.`);
    }
    case "partially-covered-arrays": {
      const rows = randInt(2, 5);
      const columns = randInt(2, 5);
      const visible = rows * (columns - 1);
      return inputQuestion(bank, index, `An array has ${rows} rows and ${columns} columns. ${visible} are visible. How many are covered?`, numberAnswer(rows), `One column is covered, so ${rows} are covered.`);
    }
    case "grid-reference": {
      const column = ["A", "B", "C", "D"][randInt(0, 3)];
      const row = randInt(1, 4);
      return inputQuestion(bank, index, `Give the grid reference for column ${column}, row ${row}.`, `${column}${row}`, `Column ${column} and row ${row} is ${column}${row}.`);
    }
    case "column-or-row":
      return choiceQuestion(bank, index, "Objects arranged up and down make a...", "column", ["row", "column", "corner", "face"], "A column goes up and down.");
    case "2d-shape-identification":
      return choiceQuestion(bank, index, "Which shape has 3 sides?", "triangle", ["triangle", "square", "circle", "rectangle"], "A triangle has 3 sides.");
    case "2d-shape-drawing":
      return inputQuestion(bank, index, "Draw or name a 2D shape with 4 equal sides.", "square", "A square has 4 equal sides.", undefined, ["square"]);
    case "3d-objects":
      return choiceQuestion(bank, index, "Which 3D object is shaped like a ball?", "sphere", ["sphere", "cube", "cylinder", "cone"], "A sphere is ball-shaped.");
    case "recognising-angles":
      return choiceQuestion(bank, index, "What do we call the space where two lines meet?", "angle", ["angle", "face", "edge", "corner only"], "An angle is made where two lines meet.");
    case "comparing-angles":
      return choiceQuestion(bank, index, "Which angle is larger?", "120 degrees", ["30 degrees", "60 degrees", "90 degrees", "120 degrees"], "120 degrees is the largest angle listed.");
    case "recognising-right-angles":
      return choiceQuestion(bank, index, "A square corner is a...", "right angle", ["right angle", "straight angle", "acute angle", "curve"], "A square corner is a right angle.");
    case "mm-cm": {
      const cm = randInt(1, 20);
      return inputQuestion(bank, index, `${cm} cm = how many mm?`, numberAnswer(cm * 10), `There are 10 mm in 1 cm.`);
    }
    case "cm-m": {
      const metres = randInt(1, 10);
      return inputQuestion(bank, index, `${metres} m = how many cm?`, numberAnswer(metres * 100), `There are 100 cm in 1 m.`);
    }
    case "mm-m": {
      const metres = randInt(1, 5);
      return inputQuestion(bank, index, `${metres} m = how many mm?`, numberAnswer(metres * 1000), `There are 1000 mm in 1 m.`);
    }
    case "m-km": {
      const km = randInt(1, 10);
      return inputQuestion(bank, index, `${km} km = how many m?`, numberAnswer(km * 1000), `There are 1000 m in 1 km.`);
    }
    case "ml-l": {
      const litres = randInt(1, 5);
      return inputQuestion(bank, index, `${litres} L = how many mL?`, numberAnswer(litres * 1000), `There are 1000 mL in 1 L.`);
    }
    case "g-kg": {
      const kg = randInt(1, 10);
      return inputQuestion(bank, index, `${kg} kg = how many g?`, numberAnswer(kg * 1000), `There are 1000 g in 1 kg.`);
    }
    case "cm2-m2": {
      const squareMetres = randInt(1, 5);
      return inputQuestion(bank, index, `${squareMetres} m² = how many cm²?`, numberAnswer(squareMetres * 10000), `There are 10,000 cm² in 1 m².`);
    }
    case "make-10": {
      const value = randInt(0, 10);
      return inputQuestion(bank, index, `${value} + __ = 10`, numberAnswer(10 - value), `${value} needs ${10 - value} to make 10.`);
    }
    case "make-20": {
      const value = randInt(0, 20);
      return inputQuestion(bank, index, `${value} + __ = 20`, numberAnswer(20 - value), `${value} needs ${20 - value} to make 20.`);
    }
    case "listing-factors": {
      const value = [12, 18, 20, 24, 30, 36][randInt(0, 5)];
      const factors = factorList(value).join(", ");
      return inputQuestion(bank, index, `List the factors of ${value}.`, factors, `The factors of ${value} are ${factors}.`, undefined, [factors, factors.replace(/, /g, " ")]);
    }
    case "hour":
      return choiceQuestion(bank, index, "The minute hand points to 12 and the hour hand points to 4. What time is it?", "4:00", ["4:00", "12:04", "4:30", "12:00"], "That clock shows 4 o'clock.", undefined, ["4:00", "4 o'clock", "4 oclock"]);
    case "half-hour":
      return choiceQuestion(bank, index, "Half past 7 is written as...", "7:30", ["7:00", "7:15", "7:30", "8:30"], "Half past means 30 minutes after the hour.");
    case "quarter-hour":
      return choiceQuestion(bank, index, "Quarter past 3 is written as...", "3:15", ["3:15", "3:30", "3:45", "4:15"], "Quarter past means 15 minutes after the hour.");
    case "5-min": {
      return inputQuestion(bank, index, `Count by 5 minute marks: 0, 5, 10, __`, "15", "The next 5-minute mark is 15.");
    }
    case "1-min":
      return inputQuestion(bank, index, "What time is one minute after 6:14?", "6:15", "One minute after 6:14 is 6:15.");
    case "24-12-conversion":
      return inputQuestion(bank, index, "Write 14:00 as 12-hour time.", "2:00 pm", "14:00 is 2:00 pm.", undefined, ["2:00 pm", "2pm", "2 pm"]);
    case "time-facts":
      return inputQuestion(bank, index, "How many minutes are in 1 hour?", "60", "There are 60 minutes in 1 hour.");
    case "recognising-coins-and-notes":
      return choiceQuestion(bank, index, "Which Australian coin is gold and worth one dollar?", "$1", ["10c", "20c", "50c", "$1"], "The $1 coin is gold.");
    case "adding-notes-and-coins":
      return inputQuestion(bank, index, "$5 + $2 + 50c = ?", "$7.50", "$5 + $2 + 50c = $7.50.", undefined, ["$7.50", "7.50", "750c"]);
    case "adding-coins":
      return inputQuestion(bank, index, "20c + 20c + 10c = ?", "50c", "20c + 20c + 10c = 50c.", undefined, ["50c", "0.50", "$0.50"]);
    case "adding-notes":
      return inputQuestion(bank, index, "$10 + $5 + $5 = ?", "$20", "$10 + $5 + $5 = $20.", undefined, ["$20", "20"]);
    default: {
      const value = randInt(positiveLow, positiveHigh);
      return inputQuestion(bank, index, `${bank.label}: write the number shown.`, numberAnswer(value), `The answer is ${value}.`, String(value));
    }
  }
}

const factories: Record<string, QuestionFactory> = {
  "one-after": oneAfter,
  "one-before": oneBefore,
  "ten-after": (bank, settings, index) => offsetNumber(bank, settings, index, 10, "ten after"),
  "ten-before": (bank, settings, index) => offsetNumber(bank, settings, index, -10, "ten before"),
  "one-hundred-after": (bank, settings, index) => offsetNumber(bank, settings, index, 100, "one hundred after"),
  "one-hundred-before": (bank, settings, index) => offsetNumber(bank, settings, index, -100, "one hundred before"),
  "odd-even": oddEven,
  double: doubleNumber,
  halve: halveNumber,
  "standard-partitioning": standardPartitioning,
  "round-to-ten": (bank, settings, index) => roundTo(bank, settings, index, 10, "ten"),
  "round-to-hundred": (bank, settings, index) => roundTo(bank, settings, index, 100, "hundred"),
  "round-to-thousand": (bank, settings, index) => roundTo(bank, settings, index, 1000, "thousand"),
  "identify-smallest-number": (bank, settings, index) => identifyExtreme(bank, settings, index, "smallest"),
  "identify-largest-number": (bank, settings, index) => identifyExtreme(bank, settings, index, "largest"),
  "greater-than-less-than": greaterThanLessThan,
  "counting-forwards": (bank, settings, index) => counting(bank, settings, index, "forwards"),
  "counting-backwards": (bank, settings, index) => counting(bank, settings, index, "backwards"),
  addition: (bank, settings, index) => operation(bank, settings, index, "addition"),
  subtraction: (bank, settings, index) => operation(bank, settings, index, "subtraction"),
  multiplication: (bank, settings, index) => operation(bank, settings, index, "multiplication"),
  division: (bank, settings, index) => operation(bank, settings, index, "division"),
  "missing-number-addition": (bank, settings, index) => missingNumber(bank, settings, index, "addition"),
  "missing-number-subtraction": (bank, settings, index) => missingNumber(bank, settings, index, "subtraction"),
  "missing-factors": missingFactor,
};

for (let step = 2; step <= 12; step += 1) {
  factories[`skip-by-${step}s`] = (bank, settings, index) => skipBy(bank, settings, index, step);
  factories[`times-by-${step}`] = (bank, settings, index) => timesBy(bank, settings, index, step);
}

export function getReadyMathsReviewBanks(bankIds: string[]) {
  return bankIds
    .map((bankId) => getMathsReviewBankById(bankId))
    .filter((bank): bank is MathsReviewBank => Boolean(bank));
}

export function generateMathsReview(settings: MathsReviewSettings) {
  const readyBanks = getReadyMathsReviewBanks(settings.selectedBankIds);
  if (!readyBanks.length) return [];

  const questions: MathsReviewQuestion[] = [];
  const perFocus = clamp(Math.floor(settings.questionsPerFocusArea || 1), 1, 20);
  const cappedCount = clamp(Math.floor(settings.questionCount || 5), 1, 60);
  const orderedBanks = settings.order === "random" ? shuffle(readyBanks) : readyBanks;

  for (let round = 0; round < perFocus && questions.length < cappedCount; round += 1) {
    for (const bank of orderedBanks) {
      if (questions.length >= cappedCount) break;
      const factory = factories[bank.id] ?? generalMathsReviewQuestion;
      questions.push(factory(bank, settings, questions.length));
    }
  }

  while (questions.length < cappedCount) {
    const bank = orderedBanks[questions.length % orderedBanks.length] ?? MATHS_REVIEW_BANKS[0];
    const factory = factories[bank.id] ?? generalMathsReviewQuestion;
    questions.push(factory(bank, settings, questions.length));
  }

  return settings.order === "random" ? shuffle(questions) : questions;
}

export function checkMathsReviewAnswer(question: MathsReviewQuestion, response: string) {
  const normalized = normalizeAnswer(response);
  return question.acceptableAnswers.some((answer) => normalizeAnswer(answer) === normalized);
}
