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
};

export type NumberPathwayStage = {
  key: PathwayStageKey;
  title: string;
  helper: string;
  steps: NumberPathwayStep[];
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
