import {
  NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberIntegersCoordinatesPropertiesAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_INTEGERS_COORDINATES_PROPERTIES_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-integers-coordinates-properties-practice-module-v1",
  progressionBandKey: "integers-coordinates-number-properties",
  title: "Integers, coordinates and number properties",
  shortTitle: "Integers and coordinates",
  description:
    "Practise integer ordering and operations, coordinate reasoning, factors and multiples, divisibility, primes, composites and number properties.",
  yearBandLabel: "Years 6-8",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "years-9-10-consolidation",
  stepKey: "integers-coordinates-number-properties",
  pathwayStepId:
    "mathematics::number-and-place-value::years-9-10-consolidation::integers-coordinates-number-properties",
  relatedAssessmentBankKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Integers include positive numbers, negative numbers and zero. Number lines help compare and calculate with integers, coordinates show position using x then y, and number properties help explain factors, multiples, primes, composites and divisibility.",
    keyLanguage: [
      "integer",
      "negative number",
      "number line",
      "coordinate",
      "x-coordinate",
      "y-coordinate",
      "quadrant",
      "factor",
      "multiple",
      "divisibility",
      "prime",
      "composite",
    ],
    workedExample:
      "The point (-3, 4) means 3 units left and 4 units up. The number 18 is composite because it has more than two factors, including 1, 2, 3, 6, 9 and 18.",
    parentTip:
      "This module helps learners reason about number structure and position, which supports later algebra, graphing and rational-number work.",
  },
  sections: [
    {
      id: "integer-ordering-and-operations",
      type: "understanding",
      title: "Integer ordering and operations",
      learnerGoal:
        "I can compare, order and operate with positive and negative integers.",
      tasks: [
        {
          id: "integer-ordering-order-number-line",
          title: "Order integers",
          prompt: "Order from smallest to largest: -7, 4, -2, 0.",
          taskType: "short_answer",
          expectedAnswer: "-7, -2, 0, 4",
          acceptableAnswers: ["-7, -2, 0, 4", "-7 -2 0 4"],
          workedSolution:
            "On a number line, smaller numbers are further left. The order is -7, -2, 0, 4.",
          supportPrompt:
            "Place zero first, then compare which negative values are further left.",
          misconceptionTargets: ["negative-number-ordering-error"],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-order-integers-001",
          ],
        },
        {
          id: "integer-ordering-calculate-expression",
          title: "Calculate with signs",
          prompt: "Calculate -6 + 9 - 4.",
          taskType: "numeric",
          expectedAnswer: "-1",
          acceptableAnswers: ["-1"],
          workedSolution:
            "-6 + 9 = 3, then 3 - 4 = -1.",
          supportPrompt:
            "Use a number line: move right for adding and left for subtracting.",
          misconceptionTargets: [
            "integer-operation-sign-error",
            "subtraction-as-smaller-error",
          ],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-calculate-integers-002",
          ],
        },
        {
          id: "integer-ordering-select-working",
          title: "Select correct integer working",
          prompt: "Which working correctly calculates 5 - (-3)?",
          taskType: "multiple_choice",
          options: [
            "Subtracting -3 is the same as adding 3, so 5 - (-3) = 8.",
            "Subtraction always makes a number smaller, so the answer is 2.",
            "Ignore the negative sign and calculate 5 - 3 = 2.",
            "Two negatives make a negative, so the answer is -8.",
          ],
          expectedAnswer:
            "Subtracting -3 is the same as adding 3, so 5 - (-3) = 8.",
          acceptableAnswers: [
            "Subtracting -3 is the same as adding 3, so 5 - (-3) = 8.",
          ],
          workedSolution:
            "Subtracting a negative moves in the positive direction. 5 - (-3) = 5 + 3 = 8.",
          supportPrompt:
            "Ask what direction subtracting a negative moves on the number line.",
          misconceptionTargets: [
            "integer-operation-sign-error",
            "subtraction-as-smaller-error",
          ],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-integer-working-003",
          ],
        },
      ],
    },
    {
      id: "coordinates-and-integer-position",
      type: "fluency",
      title: "Coordinates and integer position",
      learnerGoal:
        "I can read, plot and reason about points using integer coordinates.",
      tasks: [
        {
          id: "coordinates-position-identify-point",
          title: "Identify a coordinate",
          prompt:
            "A point is 3 units right of the origin and 2 units below the origin. Write its coordinates.",
          taskType: "short_answer",
          expectedAnswer: "(3, -2)",
          acceptableAnswers: ["(3, -2)", "3,-2", "3, -2"],
          workedSolution:
            "Right gives x = 3. Below gives y = -2. Coordinates are written x first, then y: (3, -2).",
          supportPrompt:
            "Read the horizontal movement first, then the vertical movement.",
          misconceptionTargets: [
            "coordinate-order-reversal",
            "quadrant-sign-confusion",
          ],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-identify-coordinate-004",
          ],
        },
        {
          id: "coordinates-position-match-quadrants",
          title: "Match coordinates to locations",
          prompt:
            "Match each coordinate to its location: (4, 2), (-3, 5), (0, -6).",
          taskType: "sort_or_match",
          expectedAnswer:
            "(4, 2) Quadrant I; (-3, 5) Quadrant II; (0, -6) on the y-axis below the origin",
          acceptableAnswers: [
            "(4, 2) Quadrant I; (-3, 5) Quadrant II; (0, -6) on the y-axis below the origin",
          ],
          workedSolution:
            "Positive x and positive y is Quadrant I. Negative x and positive y is Quadrant II. If x = 0, the point is on the y-axis.",
          supportPrompt:
            "Use the signs of x and y to decide the quadrant or axis.",
          misconceptionTargets: [
            "quadrant-sign-confusion",
            "coordinate-order-reversal",
          ],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-coordinate-match-005",
          ],
        },
        {
          id: "coordinates-position-grid-movement",
          title: "Move on a coordinate grid",
          prompt:
            "Start at (-2, 3). Move 5 units right and 4 units down. What is the new point?",
          taskType: "short_answer",
          expectedAnswer: "(3, -1)",
          acceptableAnswers: ["(3, -1)", "3,-1", "3, -1"],
          workedSolution:
            "Moving right increases x: -2 + 5 = 3. Moving down decreases y: 3 - 4 = -1. The new point is (3, -1).",
          supportPrompt:
            "Left and right change x. Up and down change y.",
          misconceptionTargets: [
            "coordinate-order-reversal",
            "integer-operation-sign-error",
          ],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-coordinate-movement-006",
          ],
        },
      ],
    },
    {
      id: "factors-multiples-and-divisibility",
      type: "problem_solving",
      title: "Factors, multiples and divisibility",
      learnerGoal:
        "I can identify factors, multiples and divisibility relationships.",
      tasks: [
        {
          id: "factors-multiples-classify-relationships",
          title: "Classify factor and multiple statements",
          prompt:
            "Classify each statement: 3 is a factor of 12; 20 is a multiple of 5; 7 is a factor of 20.",
          taskType: "sort_or_match",
          expectedAnswer:
            "3 is a factor of 12; 20 is a multiple of 5; 7 is neither for 20",
          acceptableAnswers: [
            "3 is a factor of 12; 20 is a multiple of 5; 7 is neither for 20",
          ],
          workedSolution:
            "3 divides 12 exactly, so it is a factor. 20 = 5 x 4, so 20 is a multiple of 5. 7 does not divide 20 exactly.",
          supportPrompt:
            "A factor divides exactly into a number. A multiple is made by multiplying.",
          misconceptionTargets: [
            "factor-multiple-confusion",
            "divisibility-rule-error",
          ],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-factor-multiple-classify-007",
          ],
        },
        {
          id: "factors-multiples-divisibility-rule",
          title: "Use a divisibility rule",
          prompt: "Which option explains why 156 is divisible by 3?",
          taskType: "multiple_choice",
          options: [
            "1 + 5 + 6 = 12, and 12 is divisible by 3.",
            "156 ends in 6, so it is divisible by 3.",
            "156 is greater than 100, so it is divisible by 3.",
            "156 has three digits, so it is divisible by 3.",
          ],
          expectedAnswer: "1 + 5 + 6 = 12, and 12 is divisible by 3.",
          acceptableAnswers: ["1 + 5 + 6 = 12, and 12 is divisible by 3."],
          workedSolution:
            "A number is divisible by 3 if its digit sum is divisible by 3. Here 1 + 5 + 6 = 12, and 12 is divisible by 3.",
          supportPrompt:
            "For divisibility by 3, add the digits first.",
          misconceptionTargets: ["divisibility-rule-error"],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-divisibility-008",
          ],
        },
        {
          id: "factors-multiples-common-factor",
          title: "Find a common factor",
          prompt: "Find the highest common factor of 18 and 24.",
          taskType: "numeric",
          expectedAnswer: "6",
          acceptableAnswers: ["6"],
          workedSolution:
            "Factors of 18 include 1, 2, 3, 6, 9, 18. Factors of 24 include 1, 2, 3, 4, 6, 8, 12, 24. The highest common factor is 6.",
          supportPrompt:
            "List factors of each number, then choose the largest shared factor.",
          misconceptionTargets: [
            "common-factor-multiple-confusion",
            "factor-multiple-confusion",
          ],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-common-factor-multiple-009",
          ],
        },
      ],
    },
    {
      id: "primes-composites-and-number-properties",
      type: "reasoning",
      title: "Primes, composites and number properties",
      learnerGoal:
        "I can classify numbers and reason about prime, composite and other number properties.",
      tasks: [
        {
          id: "prime-composite-one-correction",
          title: "Correct a prime misconception",
          prompt:
            "A learner says 1 is prime because it has one factor. Which correction is best?",
          taskType: "multiple_choice",
          options: [
            "1 is neither prime nor composite because a prime number has exactly two factors.",
            "1 is composite because it has fewer than two factors.",
            "1 is prime because it is odd.",
            "1 is prime because it is the first counting number.",
          ],
          expectedAnswer:
            "1 is neither prime nor composite because a prime number has exactly two factors.",
          acceptableAnswers: [
            "1 is neither prime nor composite because a prime number has exactly two factors.",
          ],
          workedSolution:
            "A prime number has exactly two factors. The number 1 has only one factor, so it is neither prime nor composite.",
          supportPrompt:
            "Count the number of factors, not just whether the number is odd or small.",
          misconceptionTargets: [
            "prime-composite-classification-error",
            "one-as-prime-error",
          ],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-prime-composite-010",
          ],
        },
        {
          id: "prime-composite-true-statements",
          title: "Select true properties",
          prompt: "Which set contains only true statements about 36?",
          taskType: "multiple_choice",
          options: [
            "36 is a square number, composite, and a multiple of 6.",
            "36 is prime, odd, and a multiple of 6.",
            "36 is square, prime, and odd.",
            "36 is composite, odd, and not a multiple of 6.",
          ],
          expectedAnswer:
            "36 is a square number, composite, and a multiple of 6.",
          acceptableAnswers: [
            "36 is a square number, composite, and a multiple of 6.",
          ],
          workedSolution:
            "36 = 6 x 6, so it is square and a multiple of 6. It has more than two factors, so it is composite.",
          supportPrompt:
            "Check each property one at a time using factors and multiples.",
          misconceptionTargets: [
            "prime-composite-classification-error",
            "even-odd-property-error",
            "factor-multiple-confusion",
          ],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-true-statements-011",
          ],
        },
        {
          id: "prime-composite-context-explanation",
          title: "Use factors in a context",
          prompt:
            "A game makes teams of equal size from 30 players. Which explanation best uses number properties?",
          taskType: "multiple_choice",
          options: [
            "Team sizes must be factors of 30, such as 2, 3, 5, 6, 10 or 15.",
            "Only prime team sizes work because 30 is composite.",
            "Any team size works because 30 is even.",
            "Team sizes must be multiples of 30.",
          ],
          expectedAnswer:
            "Team sizes must be factors of 30, such as 2, 3, 5, 6, 10 or 15.",
          acceptableAnswers: [
            "Team sizes must be factors of 30, such as 2, 3, 5, 6, 10 or 15.",
          ],
          workedSolution:
            "Equal teams mean the team size must divide 30 exactly, so the possible team sizes are factors of 30.",
          supportPrompt:
            "Equal groups connect to factors because they divide the total exactly.",
          misconceptionTargets: [
            "number-property-context-error",
            "factor-multiple-confusion",
            "prime-composite-classification-error",
          ],
          relatedAssessmentItemIds: [
            "integers-coordinates-properties-context-012",
          ],
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-integer-ordering-operations",
      title: "Mini Check: integer ordering",
      prompt: "Order from smallest to largest: -5, 2, -1, 0.",
      taskType: "short_answer",
      expectedAnswer: "-5, -1, 0, 2",
      acceptableAnswers: ["-5, -1, 0, 2", "-5 -1 0 2"],
      workedSolution:
        "On a number line, -5 is furthest left, then -1, then 0, then 2.",
      supportPrompt:
        "Compare positions on the number line rather than digit size alone.",
      misconceptionTargets: ["negative-number-ordering-error"],
      relatedAssessmentItemIds: [
        "integers-coordinates-properties-order-integers-001",
      ],
    },
    {
      id: "mini-check-coordinates-position",
      title: "Mini Check: coordinate movement",
      prompt:
        "Start at (1, -2). Move 4 units left and 6 units up. What is the new point?",
      taskType: "short_answer",
      expectedAnswer: "(-3, 4)",
      acceptableAnswers: ["(-3, 4)", "-3,4", "-3, 4"],
      workedSolution:
        "Moving left decreases x: 1 - 4 = -3. Moving up increases y: -2 + 6 = 4. The new point is (-3, 4).",
      supportPrompt:
        "Track x for left/right and y for up/down.",
      misconceptionTargets: [
        "coordinate-order-reversal",
        "integer-operation-sign-error",
      ],
      relatedAssessmentItemIds: [
        "integers-coordinates-properties-coordinate-movement-006",
      ],
    },
    {
      id: "mini-check-factors-multiples-divisibility",
      title: "Mini Check: common factor",
      prompt: "Find the highest common factor of 20 and 30.",
      taskType: "numeric",
      expectedAnswer: "10",
      acceptableAnswers: ["10"],
      workedSolution:
        "Factors of 20 include 1, 2, 4, 5, 10, 20. Factors of 30 include 1, 2, 3, 5, 6, 10, 15, 30. The highest common factor is 10.",
      supportPrompt:
        "List factors for each number, then find the largest shared one.",
      misconceptionTargets: [
        "common-factor-multiple-confusion",
        "factor-multiple-confusion",
      ],
      relatedAssessmentItemIds: [
        "integers-coordinates-properties-common-factor-multiple-009",
      ],
    },
    {
      id: "mini-check-prime-composite-properties",
      title: "Mini Check: number properties",
      prompt: "Which set contains only true statements about 25?",
      taskType: "multiple_choice",
      options: [
        "25 is composite, a square number, and a multiple of 5.",
        "25 is prime, even, and a multiple of 5.",
        "25 is composite, even, and a multiple of 10.",
        "25 is prime, square, and a factor of 10.",
      ],
      expectedAnswer:
        "25 is composite, a square number, and a multiple of 5.",
      acceptableAnswers: [
        "25 is composite, a square number, and a multiple of 5.",
      ],
      workedSolution:
        "25 = 5 x 5, so it is square. It has factors 1, 5 and 25, so it is composite. It is also a multiple of 5.",
      supportPrompt:
        "Use factor pairs to check each property.",
      misconceptionTargets: [
        "prime-composite-classification-error",
        "factor-multiple-confusion",
        "even-odd-property-error",
      ],
      relatedAssessmentItemIds: [
        "integers-coordinates-properties-true-statements-011",
      ],
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised integers, coordinates and number properties. They worked on integer ordering and operations, coordinate movement, factors and multiples, divisibility, and prime/composite reasoning.",
};

export const NUMBER_INTEGERS_COORDINATES_PROPERTIES_PRACTICE_MODULES =
  Object.freeze([NUMBER_INTEGERS_COORDINATES_PROPERTIES_PRACTICE_MODULE]);

export function getNumberIntegersCoordinatesPropertiesPracticeModuleById(
  id: string,
) {
  const normalizedId = safe(id);
  return (
    NUMBER_INTEGERS_COORDINATES_PROPERTIES_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberIntegersCoordinatesPropertiesPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_INTEGERS_COORDINATES_PROPERTIES_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
