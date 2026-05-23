import type {
  MathematicsDetailedStrandStep,
  MathematicsDetailedStrandWorkspace,
} from "@/lib/clean/pathways/mathematicsDetailedStrands";

export type PathwayDomainStatus = "first-detailed" | "detailed" | "coming-later";

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
    status: "detailed",
  },
  {
    key: "fractions-decimals-percentages",
    title: "Fractions, decimals, and percentages",
    description: "Understand parts, proportions, and equivalent ways of describing quantity.",
    whyItMatters:
      "These ideas show up in recipes, money, measurement, data, algebra, and real-world comparison.",
    status: "detailed",
  },
  {
    key: "ratio-and-proportional-reasoning",
    title: "Ratio and proportional reasoning",
    description: "Compare relationships between amounts and reason about scaling, rates, and fairness.",
    whyItMatters:
      "Proportional thinking supports later algebra, graphs, percentages, and practical decision-making.",
    status: "detailed",
  },
  {
    key: "algebra-patterns-and-functions",
    title: "Algebra, patterns and functions",
    description: "Notice structure, describe patterns, and generalise mathematical relationships.",
    whyItMatters:
      "This helps learners move from specific examples to broader rules and mathematical reasoning.",
    status: "detailed",
  },
  {
    key: "measurement",
    title: "Measurement",
    description: "Measure length, mass, capacity, time, money, area, and other attributes meaningfully.",
    whyItMatters:
      "Measurement connects mathematics to everyday life, practical tasks, and scientific thinking.",
    status: "detailed",
  },
  {
    key: "geometry-and-spatial-reasoning",
    title: "Geometry and spatial reasoning",
    description: "Work with shape, position, direction, angles, symmetry, and spatial relationships.",
    whyItMatters:
      "Spatial thinking supports design, navigation, problem solving, and later geometry and graphs.",
    status: "detailed",
  },
  {
    key: "statistics-and-data",
    title: "Statistics and data",
    description: "Collect, organise, interpret, and discuss information using meaningful representations.",
    whyItMatters:
      "Learners need data literacy to reason about patterns, trends, and claims in everyday life.",
    status: "detailed",
  },
  {
    key: "probability-and-chance",
    title: "Probability and chance",
    description: "Explore likelihood, uncertainty, and how chance events can be described and compared.",
    whyItMatters:
      "This supports decision-making, data interpretation, and more mature mathematical reasoning.",
    status: "detailed",
  },
  {
    key: "financial-and-real-world-mathematics",
    title: "Financial and real-world mathematics",
    description: "Use mathematics in budgeting, comparison, planning, and everyday practical contexts.",
    whyItMatters:
      "Families often want mathematics to feel useful, visible, and connected to real decisions.",
    status: "detailed",
  },
  {
    key: "mathematical-reasoning-modelling-and-explanation",
    title: "Mathematical reasoning, modelling and explanation",
    description: "Explain thinking, justify choices, and use mathematics to model meaningful situations.",
    whyItMatters:
      "Reasoning helps learners move beyond answers to confidence, communication, and transfer.",
    status: "detailed",
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
  | "counting-early-number"
  | "place-value"
  | "addition-subtraction"
  | "multiplication-division"
  | "fractions"
  | "decimals-percentages"
  | "ratio-proportional-thinking"
  | "negative-integers"
  | "powers-roots-standard-form"
  | "financial-real-world-modelling"
  | "reasoning-estimation-checking"
  | "general-number";

function normalizeStepPhrase(title: string) {
  const trimmed = title.trim().replace(/[.]+$/, "");
  return trimmed ? trimmed.charAt(0).toLowerCase() + trimmed.slice(1) : "use this number skill";
}

function hasAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getStepGuidanceSourceText(step: NumberPathwayStep) {
  return `${step.title} ${step.meaning}`.toLowerCase();
}

function detectStepGuidanceCategory(step: NumberPathwayStep): StepGuidanceCategory {
  const text = getStepGuidanceSourceText(step);

  if (
    hasAnyKeyword(text, [
      "money",
      "financial",
      "real-world",
      "modelling",
      "modeling",
      "practical number problems",
      "budget",
      "shopping",
    ])
  ) {
    return "financial-real-world-modelling";
  }

  if (
    hasAnyKeyword(text, [
      "justify",
      "communicate",
      "reasoning",
      "reasonableness",
      "estimate",
      "estimation",
      "round",
      "bounds",
      "checking",
      "check",
      "efficient calculation strategies",
      "explain calculation choices",
      "select efficient calculation strategies",
    ])
  ) {
    return "reasoning-estimation-checking";
  }

  if (
    hasAnyKeyword(text, [
      "ratio",
      "ratios",
      "rate",
      "rates",
      "proportion",
      "proportional",
      "scaling",
      "equivalent relationships",
      "rate of change",
    ])
  ) {
    return "ratio-proportional-thinking";
  }

  if (
    hasAnyKeyword(text, [
      "negative",
      "integer",
      "integers",
      "number line",
      "number lines",
      "below zero",
    ])
  ) {
    return "negative-integers";
  }

  if (
    hasAnyKeyword(text, [
      "standard form",
      "powers",
      "power",
      "roots",
      "root",
      "indices",
      "index notation",
      "very large",
      "very small",
    ])
  ) {
    return "powers-roots-standard-form";
  }

  if (
    hasAnyKeyword(text, [
      "decimal",
      "decimals",
      "percentage",
      "percentages",
      "percent",
      "tenths",
      "hundredths",
      "thousandths",
      "percentage change",
      "growth and decay",
    ])
  ) {
    return "decimals-percentages";
  }

  if (
    hasAnyKeyword(text, [
      "fraction",
      "fractions",
      "equivalent fractions",
      "unit fractions",
      "numerator",
      "denominator",
    ])
  ) {
    return "fractions";
  }

  if (
    hasAnyKeyword(text, [
      "multiply",
      "multiplication",
      "divide",
      "division",
      "arrays",
      "array",
      "equal groups",
      "grouping",
      "group",
      "groups",
      "sharing",
      "share small collections",
      "facts",
      "fact families",
      "related division facts",
      "remainders",
      "remainder",
    ])
  ) {
    return "multiplication-division";
  }

  if (
    hasAnyKeyword(text, [
      "add",
      "subtract",
      "addition",
      "subtraction",
      "joining",
      "taking away",
      "inverse operation",
      "inverse relationship",
    ])
  ) {
    return "addition-subtraction";
  }

  if (
    hasAnyKeyword(text, [
      "place value",
      "hundreds",
      "tens",
      "ones",
      "digit",
      "digits",
      "placeholder",
      "partition",
      "partitioning",
      "expanded form",
      "rename",
      "renaming",
      "regroup",
      "regrouping",
      "two-digit",
      "three-digit",
    ])
  ) {
    return "place-value";
  }

  if (
    hasAnyKeyword(text, [
      "count",
      "counting",
      "quantity",
      "quantities",
      "numeral",
      "numerals",
      "spoken number names",
      "number names",
      "order numbers",
      "counting sequence",
      "small collections",
      "more, fewer or same",
    ])
  ) {
    return "counting-early-number";
  }

  return "general-number";
}

function getDefaultSkillFocus(category: StepGuidanceCategory) {
  switch (category) {
    case "counting-early-number":
      return "Counting, quantity, numeral recognition, and early number relationships.";
    case "place-value":
      return "Place value, digit value, partitioning, renaming, and comparing numbers.";
    case "addition-subtraction":
      return "Addition and subtraction using part-part-whole thinking, known facts, and regrouping.";
    case "multiplication-division":
      return "Multiplicative thinking, fact recall, equal groups, arrays, and the connection between multiplication and division.";
    case "fractions":
      return "Parts of a whole, equal parts, fraction language, and comparing or generating equivalent fractions.";
    case "decimals-percentages":
      return "Decimal place value, percentages as parts per hundred, and links between fractions, decimals, and percentages.";
    case "ratio-proportional-thinking":
      return "Comparing quantities, scaling, equivalent ratios, rates, and proportional reasoning.";
    case "negative-integers":
      return "Working with integers, negative numbers, and position on a number line.";
    case "powers-roots-standard-form":
      return "Using powers, roots, indices, and standard form to represent and work with scale efficiently.";
    case "financial-real-world-modelling":
      return "Applying number understanding in budgeting, comparison, planning, and real-world modelling.";
    case "reasoning-estimation-checking":
      return "Estimating, checking reasonableness, comparing strategies, and justifying mathematical thinking.";
    default:
      return "General number understanding, number relationships, and flexible strategy use.";
  }
}

function getDefaultLearningIntention(category: StepGuidanceCategory, step: NumberPathwayStep) {
  const text = getStepGuidanceSourceText(step);
  const phrase = normalizeStepPhrase(step.title);

  switch (category) {
    case "counting-early-number":
      return `The learner is learning to ${phrase} and connect numbers to quantities, words, and symbols.`;
    case "place-value":
      return `The learner is learning to ${phrase} and use place value to explain how numbers are built.`;
    case "addition-subtraction":
      return `The learner is learning to ${phrase} and use number relationships, partitioning, and regrouping to solve calculations.`;
    case "multiplication-division":
      if (
        hasAnyKeyword(text, ["multiplication facts", "recall and apply multiplication facts", "fact families"])
      ) {
        return "The learner is learning to recall and apply multiplication facts and connect them to related division facts.";
      }
      return `The learner is learning to ${phrase} and use equal groups, arrays, facts, and related division reasoning to solve problems.`;
    case "fractions":
      return `The learner is learning to ${phrase} and use equal parts, fraction language, and visual models to explain the idea.`;
    case "decimals-percentages":
      if (hasAnyKeyword(text, ["percentage change", "growth and decay"])) {
        return "The learner is learning to interpret and calculate percentage change, including increase, decrease, growth, and decay.";
      }
      return `The learner is learning to ${phrase} and connect decimal place value with fractions, percentages, money, or measurement.`;
    case "ratio-proportional-thinking":
      return `The learner is learning to ${phrase} and use scaling, comparison, and equivalent relationships to reason proportionally.`;
    case "negative-integers":
      return `The learner is learning to ${phrase} and reason about position, direction, and comparison on a number line.`;
    case "powers-roots-standard-form":
      return `The learner is learning to ${phrase} and use efficient notation to describe scale or repeated multiplication.`;
    case "financial-real-world-modelling":
      return `The learner is learning to ${phrase} and apply number understanding to a practical real-world decision or model.`;
    case "reasoning-estimation-checking":
      return `The learner is learning to ${phrase} and explain why an answer or strategy makes sense.`;
    default:
      return `The learner is learning to ${phrase} and use number understanding more flexibly.`;
  }
}

function getDefaultSuccessCriteria(category: StepGuidanceCategory, step: NumberPathwayStep) {
  const text = getStepGuidanceSourceText(step);

  switch (category) {
    case "counting-early-number":
      return [
        "can count, match, or order the numbers accurately",
        "can connect the number to objects, words, or numerals",
        "can show the amount or sequence in more than one way",
        "can explain what comes before, after, more, fewer, or the same",
      ];
    case "place-value":
      return [
        "can read and build numbers clearly",
        "can explain the value of each digit",
        "can partition numbers by place value",
        "can compare numbers using place value",
      ];
    case "addition-subtraction":
      return [
        "can choose an addition or subtraction strategy that fits the numbers",
        "can use place value or known facts to support calculation",
        "can explain regrouping where needed",
        "can check using the inverse operation or another method",
      ];
    case "multiplication-division":
      if (
        hasAnyKeyword(text, ["multiplication facts", "recall and apply multiplication facts", "fact families"])
      ) {
        return [
          "can recall familiar multiplication facts",
          "can represent facts using arrays or equal groups",
          "can connect multiplication to related division facts",
          "can explain how they know the answer",
        ];
      }
      return [
        "can represent the problem using arrays, equal groups, or sharing",
        "can use multiplication or division facts to support the answer",
        "can explain what the numbers mean in the model",
        "can connect the answer to the context, including any remainder where needed",
      ];
    case "fractions":
      return [
        "can show the fraction using equal parts, models, or a number line",
        "can explain what the numerator and denominator mean where appropriate",
        "can compare, order, or match equivalent fractions",
        "can connect the fraction to a practical example or visual model",
      ];
    case "decimals-percentages":
      if (hasAnyKeyword(text, ["percentage change", "growth and decay"])) {
        return [
          "can identify whether the change is an increase or decrease",
          "can calculate or estimate the percentage change sensibly",
          "can connect percentage change to the original amount",
          "can explain what the change means in context",
        ];
      }
      return [
        "can use decimal place value accurately",
        "can compare or order decimals or percentages sensibly",
        "can connect fractions, decimals, percentages, money, or measurement where needed",
        "can explain what the value means in context",
      ];
    case "ratio-proportional-thinking":
      return [
        "can compare quantities using ratio or rate language",
        "can scale a relationship up or down consistently",
        "can identify or build equivalent ratios where needed",
        "can explain why the relationship stays proportional",
      ];
    case "negative-integers":
      return [
        "can place or compare integers accurately on a number line",
        "can explain how values change above and below zero",
        "can use integer language correctly in context",
        "can solve a short example involving negative numbers",
      ];
    case "powers-roots-standard-form":
      return [
        "can use the notation correctly and explain what it means",
        "can rewrite or calculate examples with growing accuracy",
        "can connect the notation to scale, repeated multiplication, or inverse ideas",
        "can explain why the notation is useful in that context",
      ];
    case "financial-real-world-modelling":
      return [
        "can identify the important numbers in the situation",
        "can choose a method that fits the real-life task",
        "can explain the decision, comparison, or conclusion clearly",
        "can connect the answer back to the real context",
      ];
    case "reasoning-estimation-checking":
      return [
        "can estimate before or after solving",
        "can explain why an answer is reasonable",
        "can compare strategies or justify a method",
        "can use checking, inverse thinking, or rounding to review the answer",
      ];
    default:
      return [
        "can show the number idea clearly in an example",
        "can notice useful number relationships or patterns",
        "can explain the strategy or relationship in simple language",
        "can apply the idea in a short follow-up task",
      ];
  }
}

function getDefaultPracticeActivity(category: StepGuidanceCategory, step: NumberPathwayStep) {
  const text = getStepGuidanceSourceText(step);

  switch (category) {
    case "counting-early-number":
      return `Use small objects, numeral cards, dot patterns, or sequencing cards to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to show the amount, say it, and compare or order it in a second example.`;
    case "place-value":
      return `Use base-ten blocks, bundles, drawings, or a place-value chart to explore how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to build an example, explain each digit, then partition, rename, compare, or reorder the number.`;
    case "addition-subtraction":
      return `Use a part-part-whole model, open number line, quick sketch, or place-value materials to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Encourage the learner to use known facts, partitioning, or regrouping and then check the answer using the inverse operation.`;
    case "multiplication-division":
      if (
        hasAnyKeyword(text, ["multiplication facts", "recall and apply multiplication facts", "fact families"])
      ) {
        return "Use arrays, groups of objects, skip counting, and multiplication fact cards. Ask the learner to build 4 groups of 6, say the matching multiplication fact, then explain the related division fact.";
      }
      return `Use arrays, equal groups, sharing tasks, skip counting, or fact families to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to show the model, say the matching number sentence, and explain how multiplication and division are connected.`;
    case "fractions":
      return `Use fraction strips, food, measuring tools, drawings, or everyday comparisons to explore how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to show equal parts, label the fraction, and compare or order the examples using a model or number line.`;
    case "decimals-percentages":
      if (hasAnyKeyword(text, ["percentage change", "growth and decay"])) {
        return "Use sale prices, growth examples, tables, or simple graphs to explore percentage change. Ask the learner to compare the original and new amount, describe the increase or decrease, and explain what the percentage means.";
      }
      return `Use place-value charts, hundred grids, money, or measurement examples to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to connect tenths, hundredths, fractions, decimals, or percentages in more than one way.`;
    case "ratio-proportional-thinking":
      return `Use recipes, mixtures, scale drawings, maps, or rate tables to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to scale a relationship up or down and explain why the comparison stays consistent.`;
    case "negative-integers":
      return `Use a number line, temperature examples, floor levels, or simple gains and losses to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to point to the value, compare it with another integer, and explain the direction of change.`;
    case "powers-roots-standard-form":
      return `Use a few carefully chosen examples, calculators where appropriate, and scale comparisons to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to rewrite the value, explain the notation, and compare it with an ordinary form.`;
    case "financial-real-world-modelling":
      return `Use a practical family example to practise how to ${normalizeStepPhrase(
        step.title,
      )}. This could involve budgeting, shopping, comparing prices, planning a trip, or choosing between options. Ask the learner to explain both the calculation and the decision.`;
    case "reasoning-estimation-checking":
      return `Before solving a short problem, ask the learner to make a rough estimate connected to ${normalizeStepPhrase(
        step.title,
      )}. Solve the task together, then compare the exact answer with the estimate and discuss why it was sensible or not.`;
    default:
      return `Use a short worked example, a quick practical context, or simple number cards to practise how to ${normalizeStepPhrase(
        step.title,
      )}. Ask the learner to show the idea, explain the method, and then try a similar example independently.`;
  }
}

function getDefaultEvidenceExamples(category: StepGuidanceCategory) {
  switch (category) {
    case "counting-early-number":
      return [
        "photo of objects, numeral cards, or dot patterns used during the task",
        "parent note describing how the learner counted, matched, or ordered the numbers",
        "short written or spoken example showing the quantity clearly",
      ];
    case "place-value":
      return [
        "photo of a place-value chart, bundles, or base-ten model",
        "written expanded form or partitioned number example",
        "parent note explaining how the learner described each digit",
        "short comparison or ordering task",
      ];
    case "addition-subtraction":
      return [
        "worked example showing the chosen strategy",
        "parent note about how the learner explained regrouping or partitioning",
        "photo of a number line, part-part-whole model, or equipment used",
        "short check using the inverse operation",
      ];
    case "multiplication-division":
      return [
        "photo of arrays or grouped objects",
        "short written multiplication or division fact family",
        "parent note about recall accuracy or strategy use",
        "completed fact practice sheet later",
      ];
    case "fractions":
      return [
        "photo or drawing showing equal parts, fraction strips, or a number line",
        "parent note describing how the learner explained the numerator and denominator",
        "short comparison, ordering, or equivalent-fraction example",
      ];
    case "decimals-percentages":
      return [
        "photo or note showing decimal place value, money, or measurement work",
        "worked example connecting fractions, decimals, and percentages",
        "parent note describing how the learner explained the value",
        "short percentage or percentage-change example",
      ];
    case "ratio-proportional-thinking":
      return [
        "photo or note from a recipe, mixture, scale, or rate activity",
        "table or drawing showing equivalent ratios or scaling",
        "parent note about how the learner explained the proportional relationship",
      ];
    case "negative-integers":
      return [
        "number-line example showing integer position or movement",
        "parent note describing how the learner compared values below and above zero",
        "short real-life example using temperature, levels, or gains and losses",
      ];
    case "powers-roots-standard-form":
      return [
        "worked example using indices, roots, or standard form",
        "parent note describing how the learner explained the notation",
        "comparison showing why the notation was useful for scale or efficiency",
      ];
    case "financial-real-world-modelling":
      return [
        "photo or note from a real-life maths task",
        "brief explanation of the learner's decision, comparison, or model",
        "written example showing how the mathematics was applied in context",
      ];
    case "reasoning-estimation-checking":
      return [
        "photo or note showing the estimate and the exact answer",
        "parent reflection about how the learner checked reasonableness",
        "short written comparison of two strategies or why one answer made sense",
      ];
    default:
      return [
        "worked example or quick note showing the number idea in action",
        "parent note describing how the learner explained the relationship or method",
        "short written or spoken example showing the idea clearly",
      ];
  }
}

function getDefaultAssessmentCheck(category: StepGuidanceCategory, step: NumberPathwayStep) {
  const text = getStepGuidanceSourceText(step);
  const phrase = normalizeStepPhrase(step.title);

  switch (category) {
    case "counting-early-number":
      return `A future assessment check could ask the learner to ${phrase} independently using objects, numerals, or simple number cards.`;
    case "place-value":
      return `A future assessment check could ask the learner to ${phrase} independently and explain the value of each digit or part.`;
    case "addition-subtraction":
      return `A future assessment check could ask the learner to ${phrase} independently and check the answer using the inverse operation.`;
    case "multiplication-division":
      if (
        hasAnyKeyword(text, ["multiplication facts", "recall and apply multiplication facts", "fact families"])
      ) {
        return "A future assessment check could ask the learner to recall and apply multiplication facts independently and explain the related division fact.";
      }
      return `A future assessment check could ask the learner to ${phrase} independently and explain the matching array, grouping, or division idea.`;
    case "fractions":
      return `A future assessment check could ask the learner to ${phrase} independently using a model, number line, or short written explanation.`;
    case "decimals-percentages":
      if (hasAnyKeyword(text, ["percentage change", "growth and decay"])) {
        return "A future assessment check could ask the learner to calculate percentage change independently and explain whether the result shows growth or decay.";
      }
      return `A future assessment check could ask the learner to ${phrase} independently and connect the decimal or percentage to a fraction, money, or measurement context.`;
    case "ratio-proportional-thinking":
      return `A future assessment check could ask the learner to ${phrase} independently and explain how the ratio or rate stays proportional.`;
    case "negative-integers":
      return `A future assessment check could ask the learner to ${phrase} independently on a number line or in a short real-life context.`;
    case "powers-roots-standard-form":
      return `A future assessment check could ask the learner to ${phrase} independently and explain what the notation means in that context.`;
    case "financial-real-world-modelling":
      return `A future assessment check could ask the learner to ${phrase} independently and justify the decision or model using the numbers involved.`;
    case "reasoning-estimation-checking":
      return `A future assessment check could ask the learner to ${phrase} independently and explain why the strategy or answer is reasonable.`;
    default:
      return `A future assessment check could ask the learner to ${phrase} independently and explain their thinking.`;
  }
}

export function getNumberPathwayStepGuidance(
  step: NumberPathwayStep,
): NumberPathwayStepGuidance {
  const category = detectStepGuidanceCategory(step);
  const successCriteria =
    step.successCriteria?.filter((item) => item.trim().length > 0) ||
    getDefaultSuccessCriteria(category, step);
  const evidenceExamples =
    step.evidenceExamples?.filter((item) => item.trim().length > 0) ||
    getDefaultEvidenceExamples(category);

  return {
    whatThisMeans: step.meaning,
    skillFocus: step.skillFocus || getDefaultSkillFocus(category),
    learningIntention: step.learningIntention || getDefaultLearningIntention(category, step),
    successCriteria,
    practiceActivity: step.practiceActivity || getDefaultPracticeActivity(category, step),
    evidenceExamples,
    assessmentCheck: step.assessmentCheck || getDefaultAssessmentCheck(category, step),
  };
}

function buildNumberWorkspaceStep(step: NumberPathwayStep): MathematicsDetailedStrandStep {
  const guidance = getNumberPathwayStepGuidance(step);

  return {
    id: step.id,
    title: step.title,
    meaning: step.meaning,
    skillFocus: guidance.skillFocus,
    learningIntention: guidance.learningIntention,
    successCriteria: guidance.successCriteria,
    practiceActivity: guidance.practiceActivity,
    evidenceExamples: guidance.evidenceExamples,
    assessmentCheck: guidance.assessmentCheck,
    nextStep: "Follow the next pathway step when this idea begins to feel more settled.",
    reportLanguage:
      "Parent observations can note growing confidence, clearer explanations, and stronger number reasoning over time.",
  };
}

export function buildNumberAndPlaceValueWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return {
    key: "number-and-place-value",
    trackingKey: "number",
    title: "Number and place value",
    subtitle:
      "Number and place value is the foundation strand for later mathematics. It helps learners build confidence with quantity, counting, comparison, place value, and the structure of the number system before later ideas become more complex.",
    pathwayLabel: "Number pathway",
    relationshipTitle: "Why start here",
    relationshipCopy:
      "This strand gives the clearest starting point for most learners because it supports later calculation, fractions, proportional thinking, measurement, and practical decision-making.",
    currentFocusStageKey,
    stages: NUMBER_PATHWAY_STAGES.map((stage) => ({
      key: stage.key,
      title: stage.title,
      helper: stage.helper,
      steps: stage.steps.map(buildNumberWorkspaceStep),
    })),
    portfolioSupport: [
      "Save strong number evidence when a learner explains a strategy clearly or shows a visible shift from counting to more confident reasoning.",
      "Photos of worked thinking, number lines, or practical counting tasks can show progress well over time.",
      "Short parent notes about how the learner compared, regrouped, or justified an answer can strengthen later portfolio evidence.",
    ],
    reportingSupport: [
      "Reporting can highlight growing confidence with counting, place value, comparison, and flexible number strategies rather than only correct answers.",
      "Collected evidence over time can show how the learner moved from concrete quantity work toward more fluent number reasoning.",
      "Practical family tasks often make number understanding easier to describe clearly in a calm homeschool report.",
    ],
  };
}
