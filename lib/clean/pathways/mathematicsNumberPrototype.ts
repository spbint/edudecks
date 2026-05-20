export type PathwayDomainStatus = "first-detailed" | "coming-later";

export type PathwayProgressStatus =
  | "Not started"
  | "Practising"
  | "Evidence started"
  | "Ready to assess"
  | "Secure";

export type PathwayStageKey =
  | "foundation-kindergarten"
  | "lower-primary"
  | "middle-primary"
  | "upper-primary"
  | "lower-secondary"
  | "years-9-10-consolidation";

export type MathematicsDomainCard = {
  key: string;
  title: string;
  description: string;
  whyItMatters: string;
  status: PathwayDomainStatus;
};

export type NumberPathwayStep = {
  id: number;
  title: string;
  meaning: string;
  skillFocus?: string;
  learningIntention?: string;
  successCriteria?: string[];
  practiceActivity?: string;
  evidenceExamples?: string[];
  assessmentCheck?: string;
};

export type NumberPathwayStage = {
  key: PathwayStageKey;
  title: string;
  helper: string;
  steps: NumberPathwayStep[];
};

export type NumberPathwayStepGuidance = {
  whatThisMeans: string;
  skillFocus: string;
  learningIntention: string;
  successCriteria: string[];
  practiceActivity: string;
  evidenceExamples: string[];
  assessmentCheck: string;
};

export const PATHWAY_STAGE_ORDER: PathwayStageKey[] = [
  "foundation-kindergarten",
  "lower-primary",
  "middle-primary",
  "upper-primary",
  "lower-secondary",
  "years-9-10-consolidation",
];

export const PATHWAY_PROGRESS_STATUSES: PathwayProgressStatus[] = [
  "Not started",
  "Practising",
  "Evidence started",
  "Ready to assess",
  "Secure",
];

export const MATHEMATICS_DOMAIN_CARDS: MathematicsDomainCard[] = [
  {
    key: "number-and-place-value",
    title: "Number and place value",
    description: "Build confidence with quantities, counting, numerals, and how numbers are structured.",
    whyItMatters:
      "This is the foundation for calculation, fractions, algebra, financial maths, and everyday decisions.",
    status: "first-detailed",
  },
  {
    key: "operations-and-calculation",
    title: "Operations and calculation",
    description: "Use addition, subtraction, multiplication, and division flexibly and accurately.",
    whyItMatters:
      "Learners need dependable calculation strategies before they can solve richer problems independently.",
    status: "coming-later",
  },
  {
    key: "fractions-decimals-percentages",
    title: "Fractions, decimals, percentages",
    description: "Understand parts, proportions, and equivalent ways of describing quantity.",
    whyItMatters:
      "These ideas show up in recipes, money, measurement, data, algebra, and real-world comparison.",
    status: "coming-later",
  },
  {
    key: "ratio-and-proportional-reasoning",
    title: "Ratio and proportional reasoning",
    description: "Compare relationships between amounts and reason about scaling, rates, and fairness.",
    whyItMatters:
      "Proportional thinking supports later algebra, graphs, percentages, and practical decision-making.",
    status: "coming-later",
  },
  {
    key: "algebra-patterns-and-functions",
    title: "Algebra, patterns and functions",
    description: "Notice structure, describe patterns, and generalise mathematical relationships.",
    whyItMatters:
      "This helps learners move from specific examples to broader rules and mathematical reasoning.",
    status: "coming-later",
  },
  {
    key: "measurement",
    title: "Measurement",
    description: "Measure length, mass, capacity, time, money, area, and other attributes meaningfully.",
    whyItMatters:
      "Measurement connects mathematics to everyday life, practical tasks, and scientific thinking.",
    status: "coming-later",
  },
  {
    key: "geometry-and-spatial-reasoning",
    title: "Geometry and spatial reasoning",
    description: "Work with shape, position, direction, angles, symmetry, and spatial relationships.",
    whyItMatters:
      "Spatial thinking supports design, navigation, problem solving, and later geometry and graphs.",
    status: "coming-later",
  },
  {
    key: "statistics-and-data",
    title: "Statistics and data",
    description: "Collect, organise, interpret, and discuss information using meaningful representations.",
    whyItMatters:
      "Learners need data literacy to reason about patterns, trends, and claims in everyday life.",
    status: "coming-later",
  },
  {
    key: "probability-and-chance",
    title: "Probability and chance",
    description: "Explore likelihood, uncertainty, and how chance events can be described and compared.",
    whyItMatters:
      "This supports decision-making, data interpretation, and more mature mathematical reasoning.",
    status: "coming-later",
  },
  {
    key: "financial-and-real-world-mathematics",
    title: "Financial and real-world mathematics",
    description: "Use mathematics in budgeting, comparison, planning, and everyday practical contexts.",
    whyItMatters:
      "Families often want mathematics to feel useful, visible, and connected to real decisions.",
    status: "coming-later",
  },
  {
    key: "mathematical-reasoning-modelling-and-explanation",
    title: "Mathematical reasoning, modelling and explanation",
    description: "Explain thinking, justify choices, and use mathematics to model meaningful situations.",
    whyItMatters:
      "Reasoning helps learners move beyond answers to confidence, communication, and transfer.",
    status: "coming-later",
  },
];

export const NUMBER_PATHWAY_STAGES: NumberPathwayStage[] = [
  {
    key: "foundation-kindergarten",
    title: "Foundation / Kindergarten",
    helper: "Early counting, quantity, and combining ideas begin here.",
    steps: [
      {
        id: 1,
        title: "Recognise small quantities without counting",
        meaning: "Notice small groups straight away and begin trusting what a quantity looks like.",
      },
      {
        id: 2,
        title: "Match spoken number names to quantities",
        meaning: "Connect number words such as one, two, and three to real sets of objects.",
      },
      {
        id: 3,
        title: "Identify numerals 0-10",
        meaning: "Recognise written numerals and connect them to familiar quantities.",
      },
      {
        id: 4,
        title: "Count objects accurately to 10",
        meaning: "Touch or move objects one by one while keeping the counting sequence steady.",
      },
      {
        id: 5,
        title: "Count objects accurately to 20",
        meaning: "Keep one-to-one counting going beyond 10 without losing track.",
      },
      {
        id: 6,
        title: "Compare groups as more, fewer or same",
        meaning: "Look at two collections and decide which has more, fewer, or the same amount.",
      },
      {
        id: 7,
        title: "Order numbers in a short sequence",
        meaning: "Arrange familiar numbers in the correct order and notice what comes before or after.",
      },
      {
        id: 8,
        title: "Partition and combine small collections up to 10",
        meaning: "Break small amounts apart and put them back together in different ways.",
      },
      {
        id: 9,
        title: "Represent simple addition and subtraction stories with objects",
        meaning: "Use counters, toys, or drawings to show joining and taking away.",
      },
      {
        id: 10,
        title: "Share small collections equally",
        meaning: "Begin noticing what fair sharing looks like with small sets.",
      },
    ],
  },
  {
    key: "lower-primary",
    title: "Lower Primary",
    helper: "Counting grows into place value, facts, and early grouping.",
    steps: [
      {
        id: 11,
        title: "Count forwards and backwards within 100 or 120",
        meaning: "Move confidently along the counting sequence and notice number patterns.",
      },
      {
        id: 12,
        title: "Read, write and order numbers to 100 or 120",
        meaning: "Recognise, record, and compare two-digit numbers in practical contexts.",
      },
      {
        id: 13,
        title: "Skip count by 2s, 5s and 10s",
        meaning: "Use repeated counting patterns that later support multiplication and money.",
      },
      {
        id: 14,
        title: "Understand that ten ones make one ten",
        meaning: "See place value as groups rather than as isolated digits.",
      },
      {
        id: 15,
        title: "Partition two-digit numbers into tens and ones",
        meaning: "Break numbers into place-value parts such as 34 as 3 tens and 4 ones.",
      },
      {
        id: 16,
        title: "Rename two-digit numbers in different ways",
        meaning: "Flexibly regroup tens and ones, such as 26 as 2 tens and 6 ones or 1 ten and 16 ones.",
      },
      {
        id: 17,
        title: "Add and subtract within 20 using known facts",
        meaning: "Use familiar facts and number relationships rather than counting every time.",
      },
      {
        id: 18,
        title: "Add and subtract one- and two-digit numbers with support",
        meaning: "Use drawings, equipment, and place-value thinking to solve early written problems.",
      },
      {
        id: 19,
        title: "Understand simple equal groups and arrays",
        meaning: "See repeated groups and rows as the beginning of multiplication and division.",
      },
      {
        id: 20,
        title: "Begin halves, quarters and simple sharing",
        meaning: "Use everyday language of fair parts while sharing and folding simple wholes.",
      },
    ],
  },
  {
    key: "middle-primary",
    title: "Middle Primary",
    helper: "Place value strengthens and number work becomes more flexible and practical.",
    steps: [
      {
        id: 21,
        title: "Read, write, order and compare numbers to 1000 and beyond",
        meaning: "Work with larger whole numbers confidently in reading, writing, and comparison.",
      },
      {
        id: 22,
        title: "Understand hundreds, tens and ones",
        meaning: "Use three-digit place value to describe how numbers are built.",
      },
      {
        id: 23,
        title: "Partition and regroup two- and three-digit numbers",
        meaning: "Break apart and recombine numbers flexibly to support calculation.",
      },
      {
        id: 24,
        title: "Use zero as a placeholder",
        meaning: "Understand that zero can hold a place inside a number and changes its value.",
      },
      {
        id: 25,
        title: "Add and subtract two- and three-digit numbers using place value",
        meaning: "Use regrouping, partitioning, and efficient written or mental strategies.",
      },
      {
        id: 26,
        title: "Recall and apply multiplication facts",
        meaning: "Use familiar multiplication facts accurately and connect them to division.",
      },
      {
        id: 27,
        title: "Multiply and divide using arrays, grouping and known facts",
        meaning: "Solve practical multiplicative problems with structure rather than guesswork.",
      },
      {
        id: 28,
        title: "Estimate and check reasonableness",
        meaning: "Use rough answers to judge whether an exact answer makes sense.",
      },
      {
        id: 29,
        title: "Recognise and represent unit fractions and simple fractions",
        meaning: "Show simple fractions with drawings, objects, and practical sharing situations.",
      },
      {
        id: 30,
        title: "Solve practical number problems including money",
        meaning: "Use number knowledge in shopping, change, and everyday comparisons.",
      },
    ],
  },
  {
    key: "upper-primary",
    title: "Upper Primary",
    helper: "Whole-number confidence extends into decimals, fractions, and larger calculations.",
    steps: [
      {
        id: 31,
        title: "Extend place value to larger numbers",
        meaning: "Read, write, and interpret numbers well beyond the early primary range.",
      },
      {
        id: 32,
        title: "Round and estimate with larger numbers",
        meaning: "Use approximation to support checking, planning, and mental calculation.",
      },
      {
        id: 33,
        title: "Extend place value to decimals",
        meaning: "See tenths, hundredths, and decimal notation as part of the number system.",
      },
      {
        id: 34,
        title: "Compare and order decimals",
        meaning: "Reason about decimal size using place value rather than digit count alone.",
      },
      {
        id: 35,
        title: "Compare, order and generate equivalent fractions",
        meaning: "Recognise when fractions represent the same amount and place them in order.",
      },
      {
        id: 36,
        title: "Add and subtract fractions with related denominators",
        meaning: "Combine and compare fractions when the parts can be sensibly aligned.",
      },
      {
        id: 37,
        title: "Multiply and divide larger whole numbers using efficient strategies",
        meaning: "Choose written and mental methods that match the numbers and the problem.",
      },
      {
        id: 38,
        title: "Interpret remainders in context",
        meaning: "Decide what a remainder means in sharing, grouping, or real-world situations.",
      },
      {
        id: 39,
        title: "Connect fractions, decimals and percentages",
        meaning: "Move between different ways of describing the same proportion.",
      },
      {
        id: 40,
        title: "Use mathematical modelling in financial and real-world contexts",
        meaning: "Apply number understanding to budgeting, comparison, planning, and everyday decisions.",
      },
    ],
  },
  {
    key: "lower-secondary",
    title: "Lower Secondary",
    helper: "Number work becomes more fluent, connected, and useful across broader problem solving.",
    steps: [
      {
        id: 41,
        title: "Work fluently with integers, decimals, fractions and percentages",
        meaning: "Use different number forms flexibly and switch between them with purpose.",
      },
      {
        id: 42,
        title: "Understand negative numbers and number lines",
        meaning: "Use numbers below zero in context and reason about direction and comparison.",
      },
      {
        id: 43,
        title: "Use factors, multiples, primes and divisibility",
        meaning: "Notice number structure and use it to simplify problems and reasoning.",
      },
      {
        id: 44,
        title: "Use index notation, powers and roots",
        meaning: "Represent repeated multiplication efficiently and connect it to inverse ideas.",
      },
      {
        id: 45,
        title: "Work with ratio and rates",
        meaning: "Compare quantities multiplicatively and use rates in meaningful contexts.",
      },
      {
        id: 46,
        title: "Use proportional reasoning",
        meaning: "Scale up or down, compare fairly, and reason about equivalent relationships.",
      },
      {
        id: 47,
        title: "Solve multi-step number problems",
        meaning: "Plan and carry out a sequence of calculations rather than solving in one move.",
      },
      {
        id: 48,
        title: "Apply estimation, rounding and bounds",
        meaning: "Use approximation and limits of accuracy to judge answers sensibly.",
      },
      {
        id: 49,
        title: "Explain calculation choices and reasonableness",
        meaning: "Describe why a chosen method fits the problem and whether the answer seems sensible.",
      },
      {
        id: 50,
        title: "Use number relationships to support algebraic thinking",
        meaning: "Connect number patterns and equivalence to later algebra and function ideas.",
      },
    ],
  },
  {
    key: "years-9-10-consolidation",
    title: "Years 9-10 / consolidation",
    helper: "Number understanding is consolidated for unfamiliar problems, algebra, and real-world modelling.",
    steps: [
      {
        id: 51,
        title: "Work with standard form and very large or very small numbers",
        meaning: "Represent scale efficiently when ordinary notation becomes awkward.",
      },
      {
        id: 52,
        title: "Use powers, roots and indices in context",
        meaning: "Apply exponential and inverse ideas in calculations and mathematical models.",
      },
      {
        id: 53,
        title: "Calculate exactly with fractions and multiples of pi where appropriate",
        meaning: "Preserve exact values when estimation would lose important structure.",
      },
      {
        id: 54,
        title: "Work with percentage change, growth and decay",
        meaning: "Reason about increase, decrease, and repeated change in practical settings.",
      },
      {
        id: 55,
        title: "Apply ratio, proportion and rates of change",
        meaning: "Use multiplicative thinking in more demanding financial, graphical, and scientific contexts.",
      },
      {
        id: 56,
        title: "Use number skills in algebraic and graphical contexts",
        meaning: "Bring numerical fluency into equations, graphs, and coordinate reasoning.",
      },
      {
        id: 57,
        title: "Solve financial and real-world modelling problems",
        meaning: "Use mathematics to compare options, justify decisions, and interpret outcomes.",
      },
      {
        id: 58,
        title: "Interpret limits of accuracy and rounding",
        meaning: "Understand how measurement, rounding, and approximation affect conclusions.",
      },
      {
        id: 59,
        title: "Select efficient calculation strategies for unfamiliar problems",
        meaning: "Choose, adapt, and combine methods when the answer path is not obvious.",
      },
      {
        id: 60,
        title: "Justify and communicate mathematical reasoning",
        meaning: "Explain methods clearly, compare approaches, and defend conclusions with evidence.",
      },
    ],
  },
];

export function inferPathwayStageFromYearLevel(yearLevel: string | null | undefined): PathwayStageKey {
  const raw = (yearLevel || "").trim().toLowerCase();

  if (!raw) return "middle-primary";

  if (
    raw === "f" ||
    raw === "k" ||
    raw.includes("foundation") ||
    raw.includes("prep") ||
    raw.includes("kindergarten") ||
    raw.includes("kindy") ||
    raw.includes("reception")
  ) {
    return "foundation-kindergarten";
  }

  const match = raw.match(/\b(\d{1,2})\b/);
  const yearNumber = match ? Number.parseInt(match[1] || "", 10) : Number.NaN;

  if (!Number.isNaN(yearNumber)) {
    if (yearNumber <= 2) return "lower-primary";
    if (yearNumber <= 4) return "middle-primary";
    if (yearNumber <= 6) return "upper-primary";
    if (yearNumber <= 8) return "lower-secondary";
    if (yearNumber <= 10) return "years-9-10-consolidation";
  }

  return "middle-primary";
}

export function getStageIndex(stage: PathwayStageKey) {
  return PATHWAY_STAGE_ORDER.indexOf(stage);
}

export function getStageProgressionLabel(
  stage: PathwayStageKey,
  currentStage: PathwayStageKey,
) {
  const diff = getStageIndex(stage) - getStageIndex(currentStage);

  if (diff < 0) return "Earlier foundations";
  if (diff === 0) return "Current focus";
  if (diff === 1) return "Next progression";
  return "Later progression";
}

export function getDemoPathwayStatus(
  stepId: number,
  stage: PathwayStageKey,
  currentStage: PathwayStageKey,
): PathwayProgressStatus {
  const diff = getStageIndex(stage) - getStageIndex(currentStage);

  if (diff <= -2) {
    return stepId % 5 === 0 ? "Evidence started" : "Secure";
  }

  if (diff === -1) {
    const cycle = stepId % 4;
    if (cycle === 0) return "Secure";
    if (cycle === 1) return "Ready to assess";
    return "Evidence started";
  }

  if (diff === 0) {
    const cycle = stepId % 6;
    if (cycle === 0) return "Secure";
    if (cycle === 1 || cycle === 2) return "Practising";
    if (cycle === 3) return "Evidence started";
    if (cycle === 4) return "Ready to assess";
    return "Not started";
  }

  if (diff === 1) {
    const cycle = stepId % 4;
    if (cycle === 0) return "Ready to assess";
    if (cycle === 1) return "Practising";
    return "Not started";
  }

  return stepId % 7 === 0 ? "Practising" : "Not started";
}

type StepGuidanceCategory =
  | "counting"
  | "place-value"
  | "calculation"
  | "multiplicative"
  | "fractions-and-proportion"
  | "estimation"
  | "real-world"
  | "abstract-number"
  | "reasoning";

function normalizeStepPhrase(title: string) {
  const trimmed = title.trim().replace(/[.]+$/, "");
  return trimmed ? trimmed.charAt(0).toLowerCase() + trimmed.slice(1) : "use this number skill";
}

function detectStepGuidanceCategory(step: NumberPathwayStep): StepGuidanceCategory {
  const text = `${step.title} ${step.meaning}`.toLowerCase();

  if (
    text.includes("justify") ||
    text.includes("communicate") ||
    text.includes("explain") ||
    text.includes("reasoning") ||
    text.includes("algebraic thinking")
  ) {
    return "reasoning";
  }

  if (
    text.includes("money") ||
    text.includes("financial") ||
    text.includes("real-world") ||
    text.includes("practical number problems") ||
    text.includes("modelling")
  ) {
    return "real-world";
  }

  if (
    text.includes("estimate") ||
    text.includes("round") ||
    text.includes("bounds") ||
    text.includes("reasonableness")
  ) {
    return "estimation";
  }

  if (
    text.includes("fraction") ||
    text.includes("decimal") ||
    text.includes("percentage") ||
    text.includes("ratio") ||
    text.includes("proportion") ||
    text.includes("rate")
  ) {
    return "fractions-and-proportion";
  }

  if (
    text.includes("multiply") ||
    text.includes("divide") ||
    text.includes("array") ||
    text.includes("equal groups") ||
    text.includes("grouping") ||
    text.includes("sharing") ||
    text.includes("share small collections")
  ) {
    return "multiplicative";
  }

  if (
    text.includes("add") ||
    text.includes("subtract") ||
    text.includes("joining") ||
    text.includes("taking away")
  ) {
    return "calculation";
  }

  if (
    text.includes("place value") ||
    text.includes("tens") ||
    text.includes("ones") ||
    text.includes("hundreds") ||
    text.includes("digit") ||
    text.includes("placeholder") ||
    text.includes("standard form")
  ) {
    return "place-value";
  }

  if (
    text.includes("negative") ||
    text.includes("integer") ||
    text.includes("prime") ||
    text.includes("factor") ||
    text.includes("multiple") ||
    text.includes("divisibility") ||
    text.includes("index") ||
    text.includes("power") ||
    text.includes("root")
  ) {
    return "abstract-number";
  }

  return "counting";
}

function getDefaultSkillFocus(category: StepGuidanceCategory) {
  switch (category) {
    case "place-value":
      return "Place value and number structure.";
    case "calculation":
      return "Calculation using number relationships and efficient strategies.";
    case "multiplicative":
      return "Multiplicative thinking through grouping, sharing, arrays, and known facts.";
    case "fractions-and-proportion":
      return "Part-whole understanding and proportional reasoning.";
    case "estimation":
      return "Estimating, checking, and judging whether answers make sense.";
    case "real-world":
      return "Applying number understanding in practical and real-life situations.";
    case "abstract-number":
      return "Working with more abstract number relationships, notation, and structure.";
    case "reasoning":
      return "Explaining mathematical thinking and choosing sensible strategies.";
    default:
      return "Counting, quantity, and early number confidence.";
  }
}

function getDefaultSuccessCriteria(category: StepGuidanceCategory) {
  switch (category) {
    case "place-value":
      return [
        "can read, build, or represent the number clearly",
        "can explain the value of each digit or part",
        "can partition or regroup the number in a sensible way",
        "can compare or check the number using place-value thinking",
      ];
    case "calculation":
      return [
        "can choose a sensible strategy for the calculation",
        "can solve the problem with growing accuracy",
        "can explain how the strategy worked",
        "can check whether the answer makes sense",
      ];
    case "multiplicative":
      return [
        "can show the groups, sharing, or array clearly",
        "can connect the model to the numbers in the problem",
        "can use known facts or repeated patterns to help",
        "can explain what the answer means in context",
      ];
    case "fractions-and-proportion":
      return [
        "can represent the amount clearly using drawings, models, or numbers",
        "can compare or connect different forms of the same amount",
        "can explain what each part means",
        "can use the idea in a short practical example",
      ];
    case "estimation":
      return [
        "can make a sensible estimate before or after solving",
        "can explain why the estimate is reasonable",
        "can compare the exact answer with the estimate",
        "can notice when an answer does not look right",
      ];
    case "real-world":
      return [
        "can identify the important numbers in the situation",
        "can choose a method that fits the task",
        "can explain the decision or conclusion clearly",
        "can connect the answer back to the real context",
      ];
    case "abstract-number":
      return [
        "can represent the idea using correct notation where appropriate",
        "can use the number relationship accurately",
        "can explain what the notation or structure means",
        "can apply the idea in a short example",
      ];
    case "reasoning":
      return [
        "can explain the mathematical idea in their own words",
        "can justify the chosen method or conclusion",
        "can compare approaches or notice patterns",
        "can check whether the thinking is sensible",
      ];
    default:
      return [
        "can show the quantity or count accurately",
        "can match the number to objects, words, or symbols",
        "can explain what the number or pattern means",
        "can use the idea in a short practical example",
      ];
  }
}

function getDefaultPracticeActivity(category: StepGuidanceCategory, step: NumberPathwayStep) {
  switch (category) {
    case "place-value":
      return `Use a place-value chart, base-ten materials, quick sketches, or bundled objects to explore how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to build an example, explain it, and then change part of it to describe what changed.`;
    case "calculation":
      return `Use counters, drawings, an open number line, or small written examples to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to talk through the method and check the answer afterwards.`;
    case "multiplicative":
      return `Use equal groups, sharing tasks, counters, or arrays to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Keep the numbers small at first, then vary the example and ask the learner to explain the pattern.`;
    case "fractions-and-proportion":
      return `Use fraction strips, food, measuring tools, drawings, or everyday comparisons to explore how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to show the idea in more than one way and explain what stays the same.`;
    case "estimation":
      return `Before solving a short problem, ask the learner to make a rough estimate connected to ${normalizeStepPhrase(
        step.title,
      )}. Solve the task together, then compare the exact answer with the estimate and discuss why it was sensible or not.`;
    case "real-world":
      return `Use a simple real-life scenario to practise how to ${normalizeStepPhrase(
        step.title,
      )}. This could be shopping, measuring, budgeting, planning, or comparing options. Ask the learner to explain the decision as well as the answer.`;
    case "abstract-number":
      return `Use a few carefully chosen examples to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Encourage the learner to write the notation clearly, explain what it means, and compare different examples side by side.`;
    case "reasoning":
      return `Set up one short problem or statement connected to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to explain their thinking aloud, justify the method, and say how they know the answer is sensible.`;
    default:
      return `Use small objects, number cards, dot patterns, or drawings to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to show the idea, say it aloud, and repeat it in a slightly different example.`;
  }
}

function getDefaultEvidenceExamples(category: StepGuidanceCategory) {
  switch (category) {
    case "place-value":
      return [
        "photo of a place-value model, chart, or worked example",
        "parent note describing how the learner explained each part",
        "short written example showing partitioning or regrouping",
      ];
    case "calculation":
      return [
        "worked example showing the chosen strategy",
        "parent note about how the learner explained the calculation",
        "photo of number-line, drawing, or equipment used to solve it",
      ];
    case "multiplicative":
      return [
        "photo of arrays, groups, or sharing materials",
        "short written or oral explanation of the grouping pattern",
        "parent note about how the learner used facts or repeated reasoning",
      ];
    case "fractions-and-proportion":
      return [
        "photo or drawing showing the fraction, decimal, or ratio model",
        "parent note describing how the learner compared or explained the parts",
        "short written example connecting two forms of the same amount",
      ];
    case "estimation":
      return [
        "photo or note showing the estimate and the exact answer",
        "parent reflection about how the learner judged reasonableness",
        "short written comparison of what was close and what changed",
      ];
    case "real-world":
      return [
        "photo or note from a real-life maths task",
        "brief explanation of the learner's decision or comparison",
        "written example showing how the mathematics was applied in context",
      ];
    case "abstract-number":
      return [
        "short worked example using the correct notation",
        "parent note describing how the learner explained the structure",
        "photo of a comparison or pattern the learner noticed",
      ];
    case "reasoning":
      return [
        "audio, note, or written explanation of the learner's thinking",
        "example showing how the learner justified an answer",
        "parent reflection on how clearly the reasoning was communicated",
      ];
    default:
      return [
        "photo of objects, cards, or drawings used during the task",
        "parent note describing how the learner counted or compared",
        "short written or spoken example showing the idea clearly",
      ];
  }
}

export function getNumberPathwayStepGuidance(
  step: NumberPathwayStep,
): NumberPathwayStepGuidance {
  const category = detectStepGuidanceCategory(step);
  const successCriteria =
    step.successCriteria?.filter((item) => item.trim().length > 0) ||
    getDefaultSuccessCriteria(category);
  const evidenceExamples =
    step.evidenceExamples?.filter((item) => item.trim().length > 0) ||
    getDefaultEvidenceExamples(category);

  return {
    whatThisMeans: step.meaning,
    skillFocus: step.skillFocus || getDefaultSkillFocus(category),
    learningIntention:
      step.learningIntention ||
      `The learner is learning to ${normalizeStepPhrase(step.title)}.`,
    successCriteria,
    practiceActivity: step.practiceActivity || getDefaultPracticeActivity(category, step),
    evidenceExamples,
    assessmentCheck:
      step.assessmentCheck ||
      `A future assessment check could ask the learner to ${normalizeStepPhrase(
        step.title,
      )} independently and explain their thinking.`,
  };
}
