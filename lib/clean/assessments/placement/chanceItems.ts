import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";

const noneStimulus = { type: "none" as const, data: {} };

function curriculum(code: string, yearLevel: string) {
  return {
    country: "Australia",
    jurisdiction: "QCAA Numeracy general capability",
    yearLevel,
    strand: "Statistics and probability",
    substrand: "Understanding chance",
    code,
  };
}

function short(input: {
  id: string;
  code: string;
  yearLevel: string;
  skillId: string;
  skillName: string;
  prompt: string;
  correctValue: string;
  acceptableValues?: string[];
  misconceptionTags?: string[];
  tags: string[];
}): MyLearnaAssessmentItem {
  return {
    id: input.id,
    version: 1,
    status: "draft",
    curriculum: curriculum(input.code, input.yearLevel),
    skill: { id: input.skillId, name: input.skillName },
    misconceptionTags: input.misconceptionTags || [],
    difficulty: 2,
    template: "short-answer",
    prompt: input.prompt,
    stimulus: noneStimulus,
    response: {
      type: "short-answer",
      correctValue: input.correctValue,
      acceptableValues: input.acceptableValues || [input.correctValue],
    },
    feedback: { correct: "Correct.", incorrect: "Not quite." },
    analytics: {
      tags: ["assessment-lab", "understanding-chance", ...input.tags],
    },
  };
}

function choice(input: {
  id: string;
  code: string;
  yearLevel: string;
  skillId: string;
  skillName: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  correctOptionIds: string[];
  misconceptionTags?: string[];
  tags: string[];
}): MyLearnaAssessmentItem {
  return {
    id: input.id,
    version: 1,
    status: "draft",
    curriculum: curriculum(input.code, input.yearLevel),
    skill: { id: input.skillId, name: input.skillName },
    misconceptionTags: input.misconceptionTags || [],
    difficulty: 2,
    template: "multiple-choice",
    prompt: input.prompt,
    stimulus: noneStimulus,
    response: {
      type: "single-choice",
      options: input.options.map((option) => ({
        ...option,
        value: option.label,
      })),
      correctOptionIds: input.correctOptionIds,
    },
    feedback: { correct: "Correct.", incorrect: "Not quite." },
    analytics: {
      tags: ["assessment-lab", "understanding-chance", ...input.tags],
    },
  };
}

export const CHANCE_P2_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-anchor-cha-p02-a-v1",
    code: "MYL-MATH-PROG-SP-CHA-P02",
    yearLevel: "Years 3–5",
    skillId: "chance-p2-compare-likelihood",
    skillName: "Compare likelihood in non-quantitative terms",
    prompt:
      "A bag contains 8 blue counters and 2 red counters. Without looking, which colour is more likely to be selected?",
    options: [
      { id: "blue", label: "Blue" },
      { id: "red", label: "Red" },
      { id: "equal", label: "They are equally likely" },
      { id: "certain-blue", label: "Blue is certain" },
    ],
    correctOptionIds: ["blue"],
    misconceptionTags: ["chance-likelihood-comparison-error"],
    tags: ["p2", "anchor"],
  }),
  choice({
    id: "myl-anchor-cha-p02-b-v1",
    code: "MYL-MATH-PROG-SP-CHA-P02",
    yearLevel: "Years 3–5",
    skillId: "chance-p2-variation",
    skillName: "Recognise variation in chance experiments",
    prompt:
      "A fair six-sided die is rolled 20 times. Which statement is most accurate?",
    options: [
      {
        id: "variation",
        label:
          "The results can vary; each number does not have to appear the same number of times.",
      },
      {
        id: "exact",
        label:
          "Each number must appear exactly the same number of times.",
      },
      {
        id: "six-every-six",
        label:
          "A 6 must appear once in every six rolls.",
      },
      {
        id: "repeat",
        label:
          "The sequence of results must repeat after six rolls.",
      },
    ],
    correctOptionIds: ["variation"],
    misconceptionTags: ["chance-experiment-variation-error"],
    tags: ["p2", "anchor"],
  }),
];

export const CHANCE_P4_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-anchor-cha-p04-a-v1",
    code: "MYL-MATH-PROG-SP-CHA-P04",
    yearLevel: "Year 6",
    skillId: "chance-p4-theoretical-probability",
    skillName: "Express theoretical probability from equally likely outcomes",
    prompt:
      "A fair six-sided die is rolled once. What is the probability of rolling an even number? Give your answer as a fraction.",
    correctValue: "1/2",
    acceptableValues: ["1/2", "3/6", "0.5", "50%"],
    misconceptionTags: ["theoretical-probability-error"],
    tags: ["p4", "anchor", "direct-digital"],
  }),
  choice({
    id: "myl-anchor-cha-p04-b-v1",
    code: "MYL-MATH-PROG-SP-CHA-P04",
    yearLevel: "Year 6",
    skillId: "chance-p4-representations",
    skillName: "Recognise equivalent probability representations",
    prompt: "Which decimal is equivalent to a 75% probability?",
    options: [
      { id: "0-075", label: "0.075" },
      { id: "0-75", label: "0.75" },
      { id: "7-5", label: "7.5" },
      { id: "75", label: "75" },
    ],
    correctOptionIds: ["0-75"],
    misconceptionTags: ["probability-representation-conversion-error"],
    tags: ["p4", "anchor", "direct-digital"],
  }),
];

export const CHANCE_P6_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-anchor-cha-p06-a-v1",
    code: "MYL-MATH-PROG-SP-CHA-P06",
    yearLevel: "Years 8–10",
    skillId: "chance-p6-conditional-table",
    skillName: "Reason conditionally from two-way data",
    prompt:
      "A survey records: among 20 students who play a sport, 12 ride a bike to school and 8 do not. Among 20 students who do not play a sport, 5 ride a bike and 15 do not. If a selected student is known to play a sport, what is the probability that the student rides a bike? Give a decimal.",
    correctValue: "0.6",
    acceptableValues: ["0.6", ".6", "60%", "3/5", "12/20"],
    misconceptionTags: ["conditional-probability-denominator-error"],
    tags: ["p6", "anchor", "direct-digital"],
  }),
  choice({
    id: "myl-anchor-cha-p06-b-v1",
    code: "MYL-MATH-PROG-SP-CHA-P06",
    yearLevel: "Years 8–10",
    skillId: "chance-p6-media-uncertainty",
    skillName: "Evaluate a probability claim while acknowledging uncertainty",
    prompt:
      "A forecast says there is an 80% chance of rain, but it does not rain. Which conclusion is most accurate?",
    options: [
      {
        id: "not-certain",
        label:
          "An 80% chance is high but not certain, so no rain is still a possible outcome.",
      },
      {
        id: "forecast-false",
        label:
          "The forecast must have been false because rain did not occur.",
      },
      {
        id: "means-eight-hours",
        label:
          "It means it should rain for exactly 80% of the day.",
      },
      {
        id: "next-certain",
        label:
          "Because it did not rain, rain is now certain next time.",
      },
    ],
    correctOptionIds: ["not-certain"],
    misconceptionTags: ["probability-certainty-confusion"],
    tags: ["p6", "anchor", "direct-digital"],
  }),
];

export const CHANCE_P4_RESERVE_ITEM = choice({
  id: "myl-anchor-cha-p04-c-v1",
  code: "MYL-MATH-PROG-SP-CHA-P04",
  yearLevel: "Year 6",
  skillId: "chance-p4-probability-scale",
  skillName: "Locate impossible and certain events on the 0–1 probability scale",
  prompt:
    "What is the probability of rolling a 7 on one roll of a standard six-sided die?",
  options: [
    { id: "zero", label: "0" },
    { id: "one-sixth", label: "1/6" },
    { id: "half", label: "1/2" },
    { id: "one", label: "1" },
  ],
  correctOptionIds: ["zero"],
  misconceptionTags: ["probability-scale-boundary-error"],
  tags: ["p4", "reserve-probe", "direct-digital"],
});

export const CHANCE_P1_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-search-cha-p01-a-v1",
    code: "MYL-MATH-PROG-SP-CHA-P01",
    yearLevel: "Years 3–5",
    skillId: "chance-p1-everyday-likelihood",
    skillName: "Describe an everyday occurrence as certain, possible or impossible",
    prompt:
      "A class puts five different names in a hat and draws one without looking. Before the draw, which statement is best?",
    options: [
      { id: "one-possible", label: "Each of the five names might be drawn." },
      { id: "first-certain", label: "The first name placed in the hat is certain to be drawn." },
      { id: "none", label: "It is impossible for any name to be drawn." },
    ],
    correctOptionIds: ["one-possible"],
    misconceptionTags: ["everyday-chance-language-error"],
    tags: ["p1", "search-probe", "contextual-routing", "routing-only"],
  }),
  choice({
    id: "myl-search-cha-p01-b-v1",
    code: "MYL-MATH-PROG-SP-CHA-P01",
    yearLevel: "Years 3–5",
    skillId: "chance-p1-prediction-language",
    skillName: "Use might/will language appropriately",
    prompt:
      "Which statement describes something that might happen rather than something guaranteed?",
    options: [
      { id: "rain", label: "It might rain tomorrow." },
      { id: "after-monday", label: "Tuesday comes after Monday." },
      { id: "six-seven", label: "Six is less than seven." },
    ],
    correctOptionIds: ["rain"],
    misconceptionTags: ["chance-certainty-language-error"],
    tags: ["p1", "search-probe", "contextual-routing", "routing-only"],
  }),
];

export const CHANCE_P3_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-boundary-cha-p03-a-v1",
    code: "MYL-MATH-PROG-SP-CHA-P03",
    yearLevel: "Years 3–5",
    skillId: "chance-p3-independent-trials",
    skillName: "Recognise independence in repeated coin tosses",
    prompt:
      "A fair coin has landed heads seven times in a row. What is most accurate about the next toss?",
    options: [
      { id: "equal", label: "Heads and tails are still equally likely." },
      { id: "tails-due", label: "Tails is now more likely because it is due." },
      { id: "heads-streak", label: "Heads is now more likely because of the streak." },
      { id: "certain-tail", label: "The next toss must be tails." },
    ],
    correctOptionIds: ["equal"],
    misconceptionTags: ["gambler-fallacy"],
    tags: ["p3", "boundary-probe", "direct-digital"],
  }),
  choice({
    id: "myl-boundary-cha-p03-b-v1",
    code: "MYL-MATH-PROG-SP-CHA-P03",
    yearLevel: "Years 3–5",
    skillId: "chance-p3-fairness",
    skillName: "Identify an unfair feature in a chance game",
    prompt:
      "In a game, one player gets two turns for every one turn the other player gets. What is the main fairness problem?",
    options: [
      { id: "unequal-turns", label: "The players have unequal numbers of turns." },
      { id: "too-random", label: "The game contains chance." },
      { id: "needs-table", label: "The results are not recorded in a table." },
      { id: "no-problem", label: "There is no fairness problem." },
    ],
    correctOptionIds: ["unequal-turns"],
    misconceptionTags: ["chance-game-fairness-error"],
    tags: ["p3", "boundary-probe", "direct-digital"],
  }),
  choice({
    id: "myl-boundary-cha-p03-c-v1",
    code: "MYL-MATH-PROG-SP-CHA-P03",
    yearLevel: "Years 3–5",
    skillId: "chance-p3-possible-outcomes",
    skillName: "Identify all possible outcomes of a one-step experiment",
    prompt: "A fair coin is tossed once. Which list gives all possible outcomes?",
    options: [
      { id: "ht", label: "Heads, tails" },
      { id: "hht", label: "Heads, heads, tails" },
      { id: "heads", label: "Heads only" },
      { id: "numbers", label: "1, 2" },
    ],
    correctOptionIds: ["ht"],
    misconceptionTags: ["possible-outcomes-error"],
    tags: ["p3", "boundary-probe", "direct-digital"],
  }),
];

export const CHANCE_P5_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-boundary-cha-p05-a-v1",
    code: "MYL-MATH-PROG-SP-CHA-P05",
    yearLevel: "Year 7",
    skillId: "chance-p5-compound-two-coins",
    skillName: "Calculate a simple compound-event probability",
    prompt:
      "Two fair coins are tossed. What is the probability of getting exactly one head? Give a fraction.",
    correctValue: "1/2",
    acceptableValues: ["1/2", "2/4", "0.5", "50%"],
    misconceptionTags: ["compound-event-counting-error"],
    tags: ["p5", "boundary-probe", "direct-digital"],
  }),
  short({
    id: "myl-boundary-cha-p05-b-v1",
    code: "MYL-MATH-PROG-SP-CHA-P05",
    yearLevel: "Year 7",
    skillId: "chance-p5-complement",
    skillName: "Use complementary probabilities",
    prompt:
      "A fair six-sided die is rolled. The probability of rolling a 3 is 1/6. What is the probability of not rolling a 3? Give a fraction.",
    correctValue: "5/6",
    acceptableValues: ["5/6"],
    misconceptionTags: ["probability-complement-error"],
    tags: ["p5", "boundary-probe", "direct-digital"],
  }),
  choice({
    id: "myl-boundary-cha-p05-c-v1",
    code: "MYL-MATH-PROG-SP-CHA-P05",
    yearLevel: "Year 7",
    skillId: "chance-p5-without-replacement",
    skillName: "Reason about probability without replacement",
    prompt:
      "A bag has 3 red and 2 blue counters. One red counter is removed and not replaced. What happens to the probability of drawing red next?",
    options: [
      { id: "decreases", label: "It decreases." },
      { id: "increases", label: "It increases." },
      { id: "same", label: "It stays exactly the same." },
      { id: "certain", label: "It becomes certain." },
    ],
    correctOptionIds: ["decreases"],
    misconceptionTags: ["without-replacement-probability-error"],
    tags: ["p5", "boundary-probe", "direct-digital"],
  }),
];

export const CHANCE_EXECUTABLE_ANCHORS = {
  "understanding-chance-p2": CHANCE_P2_ANCHOR_ITEMS,
  "understanding-chance-p4": CHANCE_P4_ANCHOR_ITEMS,
  "understanding-chance-p6": CHANCE_P6_ANCHOR_ITEMS,
} as const;

export const CHANCE_SEARCH_CLUSTERS = {
  "understanding-chance-p1": CHANCE_P1_SEARCH_ITEMS,
} as const;

export const CHANCE_BOUNDARY_CLUSTERS = {
  "understanding-chance-p3": CHANCE_P3_BOUNDARY_ITEMS,
  "understanding-chance-p5": CHANCE_P5_BOUNDARY_ITEMS,
} as const;
