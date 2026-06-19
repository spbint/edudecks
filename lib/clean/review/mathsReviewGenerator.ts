import {
  getMathsReviewBankById,
  MATHS_REVIEW_BANKS,
  READY_MATHS_REVIEW_BANK_IDS,
  type MathsReviewBank,
  type MathsReviewBankGroup,
} from "@/lib/clean/review/mathsReviewBanks";

export type MathsReviewOrder = "sequential" | "random";
export type MathsReviewQuestionType = "input" | "choice";

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
};

type QuestionFactory = (bank: MathsReviewBank, settings: MathsReviewSettings, index: number) => MathsReviewQuestion;

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
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
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeChoices(correct: string, distractors: string[]) {
  const unique = [correct, ...distractors].filter((value, index, list) => list.indexOf(value) === index);
  return shuffle(unique).slice(0, 4);
}

function withBase(
  bank: MathsReviewBank,
  index: number,
  question: Omit<MathsReviewQuestion, "id" | "bankId" | "bankLabel" | "group">,
): MathsReviewQuestion {
  return {
    id: `${bank.id}-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    bankId: bank.id,
    bankLabel: bank.label,
    group: bank.group,
    ...question,
  };
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
    .filter((bankId) => READY_MATHS_REVIEW_BANK_IDS.has(bankId))
    .map((bankId) => getMathsReviewBankById(bankId))
    .filter((bank): bank is MathsReviewBank => Boolean(bank && factories[bank.id]));
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
      const factory = factories[bank.id];
      if (!factory) continue;
      questions.push(factory(bank, settings, questions.length));
    }
  }

  while (questions.length < cappedCount) {
    const bank = orderedBanks[questions.length % orderedBanks.length] ?? MATHS_REVIEW_BANKS[0];
    const factory = factories[bank.id];
    if (!factory) break;
    questions.push(factory(bank, settings, questions.length));
  }

  return settings.order === "random" ? shuffle(questions) : questions;
}

export function checkMathsReviewAnswer(question: MathsReviewQuestion, response: string) {
  const normalized = normalizeAnswer(response);
  return question.acceptableAnswers.some((answer) => normalizeAnswer(answer) === normalized);
}
