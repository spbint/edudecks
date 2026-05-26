/*
 * This file maps Years 6-10 Number concepts into MyLearna adaptive conceptual
 * progressions. It is intentionally separate from mathematicsNumberPrototype.ts
 * so secondary Number practice and assessment planning can evolve without
 * enlarging the existing prototype file.
 */

export type NumberProgressionBandKey =
  | "integers-coordinates-number-properties"
  | "rational-numbers-and-operations"
  | "percentages-ratio-financial-modelling"
  | "powers-roots-exponent-notation"
  | "terminating-recurring-rational-representations"
  | "irrational-and-real-numbers"
  | "approximation-estimation-error"
  | "surds-and-exact-form";

export type NumberProgressionYearBand =
  | "Year 6"
  | "Year 7"
  | "Year 8"
  | "Year 9"
  | "Year 10"
  | "Year 10A"
  | "Years 6-7"
  | "Years 7-8"
  | "Years 8-9"
  | "Years 9-10"
  | "Years 10-10A";

export type NumberVisualSupportLevel =
  | "concrete"
  | "representational"
  | "symbolic"
  | "mostly-symbolic";

export type NumberPracticeMode =
  | "guided-representation"
  | "symbolic-fluency"
  | "applied-context"
  | "reasoning-and-transfer"
  | "mixed-review";

export type NumberAssessmentMode =
  | "short-answer"
  | "multiple-choice"
  | "matching"
  | "ordering"
  | "classification"
  | "worked-expression"
  | "applied-problem"
  | "explain-or-justify";

export type NumberProgressionStepCandidate = {
  key: string;
  title: string;
  learnerFacingTitle: string;
  description: string;
  roughYearBand: NumberProgressionYearBand;
  prerequisiteStepKeys?: string[];
  practiceModes: NumberPracticeMode[];
  assessmentModes: NumberAssessmentMode[];
  visualSupportLevel: NumberVisualSupportLevel;
  samplePracticePrompts: string[];
  sampleAssessmentPrompts: string[];
  misconceptionTargets: string[];
  futureCanonicalLinkNotes?: string;
};

export type NumberProgressionBand = {
  key: NumberProgressionBandKey;
  title: string;
  learnerFacingTitle: string;
  purpose: string;
  roughYearBands: NumberProgressionYearBand[];
  prerequisiteBandKeys: NumberProgressionBandKey[];
  visualSupportLevel: NumberVisualSupportLevel;
  practiceModes: NumberPracticeMode[];
  assessmentModes: NumberAssessmentMode[];
  stepCandidates: NumberProgressionStepCandidate[];
};

export const YEARS_6_TO_10_NUMBER_PROGRESSION_BANDS: NumberProgressionBand[] = [
  {
    key: "integers-coordinates-number-properties",
    title: "Integers, coordinates and number properties",
    learnerFacingTitle: "Integers, coordinates and number properties",
    purpose:
      "Build understanding of directed number, coordinate location, and number properties as a foundation for later algebraic and real-number reasoning.",
    roughYearBands: ["Year 6", "Years 6-7"],
    prerequisiteBandKeys: [],
    visualSupportLevel: "representational",
    practiceModes: [
      "guided-representation",
      "symbolic-fluency",
      "reasoning-and-transfer",
      "mixed-review",
    ],
    assessmentModes: [
      "short-answer",
      "multiple-choice",
      "matching",
      "classification",
      "worked-expression",
    ],
    stepCandidates: [
      {
        key: "represent-integers-on-a-number-line",
        title: "Represent integers on a number line",
        learnerFacingTitle: "Place integers on a number line",
        description:
          "Use number lines to locate and compare positive and negative whole numbers.",
        roughYearBand: "Years 6-7",
        practiceModes: ["guided-representation", "symbolic-fluency", "mixed-review"],
        assessmentModes: ["short-answer", "multiple-choice", "ordering"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Place -3, 0, and 5 on the same number line.",
          "Which number is further left: -6 or -2?",
        ],
        sampleAssessmentPrompts: [
          "Represent -4 on a number line.",
          "Order -2, 7, 0, -5 from smallest to largest.",
        ],
        misconceptionTargets: [
          "Thinking negative numbers are always larger because the numeral has a bigger digit.",
          "Reversing left/right direction on the number line.",
        ],
        futureCanonicalLinkNotes:
          "Likely future Number and place value stage candidate connected to directed number and comparison.",
      },
      {
        key: "identify-coordinates-on-the-cartesian-plane",
        title: "Identify coordinates on the Cartesian plane",
        learnerFacingTitle: "Read and plot coordinates",
        description:
          "Interpret ordered pairs and connect horizontal and vertical movement to plotted points.",
        roughYearBand: "Years 6-7",
        prerequisiteStepKeys: ["represent-integers-on-a-number-line"],
        practiceModes: ["guided-representation", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["multiple-choice", "matching", "short-answer"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Plot the point (3, -2) on a coordinate grid.",
          "Describe how to move from the origin to (-4, 1).",
        ],
        sampleAssessmentPrompts: [
          "Identify the coordinates of the plotted point.",
          "Which point lies in the same row as (2, -3)?",
        ],
        misconceptionTargets: [
          "Swapping x- and y-coordinates.",
          "Starting movement on the vertical axis instead of the horizontal axis.",
        ],
        futureCanonicalLinkNotes:
          "May later cross-link with algebra and geometry strands, but belongs in Number planning for directed-number readiness.",
      },
      {
        key: "classify-prime-composite-and-square-numbers",
        title: "Classify prime, composite and square numbers",
        learnerFacingTitle: "Classify number properties",
        description:
          "Sort numbers using factor structure and connect square numbers to repeated multiplication.",
        roughYearBand: "Year 6",
        practiceModes: ["guided-representation", "symbolic-fluency", "mixed-review"],
        assessmentModes: ["classification", "multiple-choice", "matching"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Sort these numbers into prime, composite, and square groups.",
          "Use an array sketch to explain why 16 is a square number.",
        ],
        sampleAssessmentPrompts: [
          "Match each number to prime, composite, or square.",
          "Which statement about 29 is true?",
        ],
        misconceptionTargets: [
          "Treating 1 as a prime number.",
          "Thinking every even number is a square number.",
        ],
        futureCanonicalLinkNotes:
          "Likely prerequisite for factors, multiples, exponent structure, and algebraic reasoning steps.",
      },
      {
        key: "use-factor-trees-and-prime-factorisation",
        title: "Use factor trees and prime factorisation",
        learnerFacingTitle: "Break numbers into prime factors",
        description:
          "Use factor trees to decompose composite numbers into prime factors and compare equivalent decompositions.",
        roughYearBand: "Years 6-7",
        prerequisiteStepKeys: ["classify-prime-composite-and-square-numbers"],
        practiceModes: ["guided-representation", "symbolic-fluency", "reasoning-and-transfer"],
        assessmentModes: ["worked-expression", "short-answer", "multiple-choice"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Build a factor tree for 36 in two different ways.",
          "Circle the prime factors at the ends of the tree.",
        ],
        sampleAssessmentPrompts: [
          "Complete the factor tree for 84.",
          "Write 60 as a product of prime factors.",
        ],
        misconceptionTargets: [
          "Stopping a factor tree before all branches end in prime numbers.",
          "Treating different tree shapes as different prime factorizations.",
        ],
        futureCanonicalLinkNotes:
          "Strong candidate for a future canonical Number step before exponent notation and index laws.",
      },
    ],
  },
  {
    key: "rational-numbers-and-operations",
    title: "Rational numbers and operations",
    learnerFacingTitle: "Rational numbers and operations",
    purpose:
      "Develop equivalent representations and operations with rational numbers, including fractions, decimals and integers.",
    roughYearBands: ["Years 6-7", "Years 7-8"],
    prerequisiteBandKeys: ["integers-coordinates-number-properties"],
    visualSupportLevel: "representational",
    practiceModes: [
      "guided-representation",
      "symbolic-fluency",
      "applied-context",
      "mixed-review",
    ],
    assessmentModes: [
      "short-answer",
      "multiple-choice",
      "matching",
      "ordering",
      "worked-expression",
    ],
    stepCandidates: [
      {
        key: "compare-and-order-fractions",
        title: "Compare and order fractions",
        learnerFacingTitle: "Order fractions",
        description:
          "Compare fractions using benchmark quantities, common denominators, and number-line placement.",
        roughYearBand: "Years 6-7",
        practiceModes: ["guided-representation", "symbolic-fluency", "mixed-review"],
        assessmentModes: ["ordering", "multiple-choice", "short-answer"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Place 1/4, 3/8, and 1/2 on the same number line.",
          "Explain which is larger: 5/6 or 7/9.",
        ],
        sampleAssessmentPrompts: [
          "Order 2/3, 5/8, and 3/4 from smallest to largest.",
          "Which fraction is closest to 1?",
        ],
        misconceptionTargets: [
          "Comparing numerators only or denominators only.",
          "Assuming a larger denominator always means a larger fraction.",
        ],
      },
      {
        key: "represent-fractions-on-number-lines",
        title: "Represent fractions on number lines",
        learnerFacingTitle: "Place fractions on number lines",
        description:
          "Connect fraction size and equivalence to position on a number line rather than isolated part-whole pictures.",
        roughYearBand: "Years 6-7",
        prerequisiteStepKeys: ["compare-and-order-fractions"],
        practiceModes: ["guided-representation", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["multiple-choice", "matching", "short-answer"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Mark 3/4 on a number line from 0 to 1.",
          "Show where 5/4 would go on a number line.",
        ],
        sampleAssessmentPrompts: [
          "Select the point that represents 2/5.",
          "Which fraction matches the marked location between 1 and 2?",
        ],
        misconceptionTargets: [
          "Placing fractions by counting ticks without considering equal spacing.",
          "Treating improper fractions as impossible to place on the line.",
        ],
      },
      {
        key: "simplify-equivalent-fractions",
        title: "Simplify equivalent fractions",
        learnerFacingTitle: "Find equivalent fractions",
        description:
          "Use multiplicative structure to simplify and generate equivalent fractions.",
        roughYearBand: "Years 6-7",
        practiceModes: ["guided-representation", "symbolic-fluency", "reasoning-and-transfer"],
        assessmentModes: ["short-answer", "multiple-choice", "worked-expression"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Shade a fraction bar to show why 3/6 equals 1/2.",
          "Simplify 12/18 and explain the common factor used.",
        ],
        sampleAssessmentPrompts: [
          "Simplify 9/27.",
          "Which fraction is equivalent to 4/5?",
        ],
        misconceptionTargets: [
          "Subtracting the same number from numerator and denominator instead of dividing by a common factor.",
          "Believing a simplified fraction must always have smaller numerator and denominator by 1.",
        ],
      },
      {
        key: "add-and-subtract-fractions",
        title: "Add and subtract fractions",
        learnerFacingTitle: "Add and subtract fractions",
        description:
          "Operate with fractions using common denominators and equivalence rather than memorised procedures alone.",
        roughYearBand: "Years 7-8",
        prerequisiteStepKeys: ["simplify-equivalent-fractions"],
        practiceModes: ["guided-representation", "symbolic-fluency", "applied-context"],
        assessmentModes: ["worked-expression", "short-answer", "applied-problem"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Use fraction strips to show 2/5 + 1/3 before finding a common denominator.",
          "Solve 7/8 - 1/4 and explain why the denominators need attention.",
        ],
        sampleAssessmentPrompts: [
          "Calculate 2/5 + 1/3.",
          "Find 5/6 - 1/9.",
        ],
        misconceptionTargets: [
          "Adding denominators directly.",
          "Ignoring equivalence when denominators differ.",
        ],
      },
      {
        key: "operate-with-positive-rational-numbers",
        title: "Operate with positive rational numbers",
        learnerFacingTitle: "Work with fractions and decimals",
        description:
          "Move flexibly between fraction and decimal forms in calculations with positive rational numbers.",
        roughYearBand: "Years 7-8",
        prerequisiteStepKeys: ["add-and-subtract-fractions"],
        practiceModes: ["symbolic-fluency", "applied-context", "mixed-review"],
        assessmentModes: ["short-answer", "worked-expression", "applied-problem"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Calculate 1.5 + 3/4 and choose a helpful common representation.",
          "Solve a recipe scaling task with decimal and fraction quantities.",
        ],
        sampleAssessmentPrompts: [
          "Calculate 0.75 + 2/5.",
          "Choose the most efficient representation for solving a mixed rational-number problem.",
        ],
        misconceptionTargets: [
          "Treating decimals and fractions as unrelated systems.",
          "Switching representations mid-procedure without preserving value.",
        ],
      },
      {
        key: "operate-with-integers",
        title: "Operate with integers",
        learnerFacingTitle: "Calculate with positive and negative integers",
        description:
          "Use integer meaning and structure to calculate beyond whole-number rules.",
        roughYearBand: "Years 7-8",
        prerequisiteStepKeys: ["represent-integers-on-a-number-line"],
        practiceModes: ["guided-representation", "symbolic-fluency", "mixed-review"],
        assessmentModes: ["short-answer", "multiple-choice", "worked-expression"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Use a number line to show -8 - (-5) + 4.",
          "Write a real-world context for a temperature change of -3 then +7.",
        ],
        sampleAssessmentPrompts: [
          "Solve -8 - (-5) + 4.",
          "Which expression has the same value as -6 + 9?",
        ],
        misconceptionTargets: [
          "Treating subtracting a negative as making the value smaller.",
          "Ignoring operation order when multiple signs appear together.",
        ],
      },
      {
        key: "multiply-and-divide-decimals-by-powers-of-ten",
        title: "Multiply and divide decimals by powers of 10",
        learnerFacingTitle: "Scale decimals with powers of 10",
        description:
          "Use place-value structure to scale decimals efficiently when multiplying or dividing by powers of 10.",
        roughYearBand: "Years 6-7",
        practiceModes: ["guided-representation", "symbolic-fluency", "mixed-review"],
        assessmentModes: ["short-answer", "multiple-choice", "matching"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Use a place-value chart to show how 2.48 becomes 24.8.",
          "Explain what changes when dividing 63.5 by 100.",
        ],
        sampleAssessmentPrompts: [
          "Which operation changes 2.48 to 24.8?",
          "Calculate 63.5 / 100.",
        ],
        misconceptionTargets: [
          "Believing the decimal point moves by itself rather than digits shifting place value.",
          "Confusing multiplication by 10 with division by 10.",
        ],
      },
    ],
  },
  {
    key: "percentages-ratio-financial-modelling",
    title: "Percentages, ratio and financial modelling",
    learnerFacingTitle: "Percentages, ratio and financial modelling",
    purpose:
      "Apply rational-number thinking in practical percentage, ratio, financial and modelling contexts.",
    roughYearBands: ["Years 6-7", "Years 7-8"],
    prerequisiteBandKeys: ["rational-numbers-and-operations"],
    visualSupportLevel: "representational",
    practiceModes: [
      "guided-representation",
      "applied-context",
      "reasoning-and-transfer",
      "mixed-review",
    ],
    assessmentModes: [
      "short-answer",
      "multiple-choice",
      "applied-problem",
      "worked-expression",
      "explain-or-justify",
    ],
    stepCandidates: [
      {
        key: "find-percentage-of-a-quantity",
        title: "Find percentage of a quantity",
        learnerFacingTitle: "Find a percentage of an amount",
        description:
          "Use benchmark percentages, partitioning, and multiplicative reasoning to find percentages of whole quantities.",
        roughYearBand: "Years 6-7",
        practiceModes: ["guided-representation", "applied-context", "mixed-review"],
        assessmentModes: ["short-answer", "multiple-choice", "applied-problem"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Use a 10x10 grid to show 25% of 80.",
          "Find 15% of 60 by building from 10% and 5%.",
        ],
        sampleAssessmentPrompts: [
          "What is 20% of 45?",
          "What percentage of 200 is 50?",
        ],
        misconceptionTargets: [
          "Treating percent as a whole number without the per-hundred meaning.",
          "Adding 10% and 5% incorrectly when combining benchmark percentages.",
        ],
      },
      {
        key: "calculate-discounts-and-sale-prices",
        title: "Calculate discounts and sale prices",
        learnerFacingTitle: "Work out sale prices",
        description:
          "Use percentages to find discounts, reduced prices, and changes in shopping contexts.",
        roughYearBand: "Years 6-7",
        prerequisiteStepKeys: ["find-percentage-of-a-quantity"],
        practiceModes: ["applied-context", "symbolic-fluency", "mixed-review"],
        assessmentModes: ["short-answer", "applied-problem", "worked-expression"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "A $90 jacket is reduced by 20%. Find the discount and the sale price.",
          "Use a bar model to show the original price and the discount part.",
        ],
        sampleAssessmentPrompts: [
          "Find the price after a 20% discount on $65.",
          "A price rises by 5%. What is the new price?",
        ],
        misconceptionTargets: [
          "Subtracting 20 instead of 20%.",
          "Applying the percentage change to the wrong base amount.",
        ],
      },
      {
        key: "estimate-percentage-and-fraction-quantities",
        title: "Estimate percentage and fraction quantities",
        learnerFacingTitle: "Estimate using percentages and fractions",
        description:
          "Estimate quantities from visual or contextual information using flexible fraction-percentage thinking.",
        roughYearBand: "Years 6-7",
        practiceModes: ["guided-representation", "applied-context", "reasoning-and-transfer"],
        assessmentModes: ["multiple-choice", "short-answer", "explain-or-justify"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Estimate what fraction of the jar is filled by looking at the picture.",
          "About what percentage of the target has been reached on the progress bar?",
        ],
        sampleAssessmentPrompts: [
          "Estimate the percentage of the fundraising target reached.",
          "Which fraction is the best estimate for the shaded part?",
        ],
        misconceptionTargets: [
          "Over-reading a visual estimate as an exact answer.",
          "Confusing part-to-whole estimates with part-to-part comparisons.",
        ],
      },
      {
        key: "divide-quantities-by-ratio",
        title: "Divide quantities by ratio",
        learnerFacingTitle: "Share amounts in a ratio",
        description:
          "Split a quantity into parts using ratio structure and multiplicative scaling.",
        roughYearBand: "Years 7-8",
        practiceModes: ["guided-representation", "applied-context", "symbolic-fluency"],
        assessmentModes: ["short-answer", "applied-problem", "worked-expression"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Use a ratio bar to divide $96 in the ratio 1:3.",
          "Share 35 counters in the ratio 2:5.",
        ],
        sampleAssessmentPrompts: [
          "Divide $96 in the ratio 1:3.",
          "Share 72 in the ratio 3:5.",
        ],
        misconceptionTargets: [
          "Treating 1:3 as subtractive rather than multiplicative.",
          "Dividing by only one part of the ratio instead of the total number of parts.",
        ],
      },
      {
        key: "calculate-percentage-profit",
        title: "Calculate percentage profit",
        learnerFacingTitle: "Work out percentage profit",
        description:
          "Use percentage change to compare cost price and selling price in financial contexts.",
        roughYearBand: "Years 7-8",
        prerequisiteStepKeys: ["calculate-discounts-and-sale-prices"],
        practiceModes: ["applied-context", "symbolic-fluency", "reasoning-and-transfer"],
        assessmentModes: ["short-answer", "applied-problem", "worked-expression"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "A bike costs $240 and sells for $300. Find the profit and the percentage profit.",
          "Use a double bar to compare cost and selling price.",
        ],
        sampleAssessmentPrompts: [
          "Find the percentage profit when an item bought for $80 sells for $92.",
          "Which base amount should be used for percentage profit?",
        ],
        misconceptionTargets: [
          "Using selling price instead of cost price as the base.",
          "Turning the profit amount straight into a percent without division.",
        ],
      },
      {
        key: "calculate-percentage-error",
        title: "Calculate percentage error",
        learnerFacingTitle: "Compare estimate and actual value",
        description:
          "Measure the size of an estimation error relative to the actual value.",
        roughYearBand: "Years 7-8",
        practiceModes: ["applied-context", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["short-answer", "applied-problem", "explain-or-justify"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "An estimate is 18 minutes and the actual time is 20 minutes. Find the percentage error.",
          "Compare two estimates and decide which is more accurate relative to the actual result.",
        ],
        sampleAssessmentPrompts: [
          "Find the percentage error when the estimate is 54 and the actual value is 60.",
          "Which estimate has the smaller percentage error?",
        ],
        misconceptionTargets: [
          "Dividing by the estimate instead of the actual value.",
          "Confusing percent error with percent increase or decrease.",
        ],
      },
      {
        key: "solve-financial-modelling-problems",
        title: "Solve financial modelling problems",
        learnerFacingTitle: "Use percentages and ratio in financial contexts",
        description:
          "Combine ratio, percentage change, and practical context reading in multi-step financial situations.",
        roughYearBand: "Years 7-8",
        prerequisiteStepKeys: [
          "find-percentage-of-a-quantity",
          "calculate-discounts-and-sale-prices",
          "divide-quantities-by-ratio",
        ],
        practiceModes: ["applied-context", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["applied-problem", "worked-expression", "explain-or-justify"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "A fundraiser reaches 68% of a $2,500 target. How much has been raised and how much is left?",
          "Compare two phone plans using monthly cost and data ratio information.",
        ],
        sampleAssessmentPrompts: [
          "Expected population after a 10% decrease from 8,400.",
          "A savings goal rises by 5% after a price update. Find the new target amount.",
        ],
        misconceptionTargets: [
          "Losing track of the base quantity after the first step.",
          "Using additive reasoning in multiplicative financial contexts.",
        ],
      },
    ],
  },
  {
    key: "powers-roots-exponent-notation",
    title: "Powers, roots and exponent notation",
    learnerFacingTitle: "Powers, roots and exponent notation",
    purpose:
      "Connect square numbers, square roots, powers, exponent notation and expanded notation as preparation for algebraic number work.",
    roughYearBands: ["Year 7", "Years 7-8"],
    prerequisiteBandKeys: ["integers-coordinates-number-properties"],
    visualSupportLevel: "mostly-symbolic",
    practiceModes: [
      "guided-representation",
      "symbolic-fluency",
      "reasoning-and-transfer",
      "mixed-review",
    ],
    assessmentModes: [
      "short-answer",
      "multiple-choice",
      "matching",
      "worked-expression",
      "explain-or-justify",
    ],
    stepCandidates: [
      {
        key: "connect-perfect-squares-and-square-roots",
        title: "Connect perfect squares and square roots",
        learnerFacingTitle: "Connect square numbers and square roots",
        description:
          "Relate square arrays, square numbers, and inverse square-root relationships.",
        roughYearBand: "Year 7",
        practiceModes: ["guided-representation", "symbolic-fluency", "mixed-review"],
        assessmentModes: ["matching", "short-answer", "multiple-choice"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Sketch a 5 by 5 square array and connect it to 5^2.",
          "Match each perfect square to its square root.",
        ],
        sampleAssessmentPrompts: [
          "If 13^2 = 169, find square root 169.",
          "Which number has a square root of 12?",
        ],
        misconceptionTargets: [
          "Treating square root as 'divide by 2'.",
          "Confusing n^2 with 2n.",
        ],
      },
      {
        key: "estimate-non-perfect-square-roots",
        title: "Estimate non-perfect square roots between consecutive integers",
        learnerFacingTitle: "Estimate square roots",
        description:
          "Use nearby perfect squares to place non-perfect square roots between consecutive integers.",
        roughYearBand: "Years 7-8",
        prerequisiteStepKeys: ["connect-perfect-squares-and-square-roots"],
        practiceModes: ["guided-representation", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["short-answer", "multiple-choice", "ordering"],
        visualSupportLevel: "mostly-symbolic",
        samplePracticePrompts: [
          "Place square root 41 between two consecutive integers.",
          "Explain why square root 50 is greater than 7 but less than 8.",
        ],
        sampleAssessmentPrompts: [
          "Between which two integers does square root 41 lie?",
          "Which value is closest to square root 20?",
        ],
        misconceptionTargets: [
          "Rounding the number inside the radical before reasoning.",
          "Using addition instead of nearby square values.",
        ],
      },
      {
        key: "represent-natural-numbers-as-products-of-powers",
        title: "Represent natural numbers as products of powers",
        learnerFacingTitle: "Write numbers using powers",
        description:
          "Link repeated prime factors to exponent notation and compact structural representation.",
        roughYearBand: "Years 7-8",
        prerequisiteStepKeys: ["use-factor-trees-and-prime-factorisation"],
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["worked-expression", "short-answer", "matching"],
        visualSupportLevel: "mostly-symbolic",
        samplePracticePrompts: [
          "Write 72 as 2^a x 3^b.",
          "Match repeated multiplication strings to exponent form.",
        ],
        sampleAssessmentPrompts: [
          "Express 360 as a product of powers.",
          "Which exponent form matches 5 x 5 x 5 x 5?",
        ],
        misconceptionTargets: [
          "Adding repeated factors instead of counting occurrences.",
          "Using the exponent as a multiplier rather than repeated multiplication.",
        ],
      },
      {
        key: "use-powers-of-ten-in-expanded-notation",
        title: "Use powers of 10 in expanded notation",
        learnerFacingTitle: "Read and write powers of 10",
        description:
          "Connect place value and scientific structure using powers of 10 in expanded form.",
        roughYearBand: "Years 7-8",
        practiceModes: ["guided-representation", "symbolic-fluency", "mixed-review"],
        assessmentModes: ["matching", "short-answer", "multiple-choice"],
        visualSupportLevel: "mostly-symbolic",
        samplePracticePrompts: [
          "Rewrite 4,307 as expanded notation using powers of 10.",
          "Use a place-value table to connect digits with their powers of 10.",
        ],
        sampleAssessmentPrompts: [
          "Read the expanded notation 3 x 10^3 + 5 x 10^1 + 8.",
          "Write 70,040 using powers of 10.",
        ],
        misconceptionTargets: [
          "Mixing digit value with place value.",
          "Writing 10^0 incorrectly as 0.",
        ],
      },
      {
        key: "apply-exponent-notation",
        title: "Apply exponent notation",
        learnerFacingTitle: "Use exponent notation",
        description:
          "Translate between repeated multiplication, exponential form, and evaluated values.",
        roughYearBand: "Year 7",
        practiceModes: ["symbolic-fluency", "mixed-review"],
        assessmentModes: ["short-answer", "matching", "multiple-choice"],
        visualSupportLevel: "mostly-symbolic",
        samplePracticePrompts: [
          "Write 3 x 3 x 3 x 3 in exponent form.",
          "Evaluate 2^5 and explain what the exponent means.",
        ],
        sampleAssessmentPrompts: [
          "Write repeated multiplication in exponent form.",
          "Which expression equals 4^3?",
        ],
        misconceptionTargets: [
          "Reading 3^4 as 3 x 4.",
          "Confusing base and exponent roles.",
        ],
      },
      {
        key: "apply-exponent-laws-with-positive-integer-exponents",
        title: "Apply exponent laws with positive integer exponents",
        learnerFacingTitle: "Use exponent laws",
        description:
          "Simplify products and quotients of powers by reasoning from repeated multiplication patterns.",
        roughYearBand: "Years 7-8",
        prerequisiteStepKeys: ["apply-exponent-notation"],
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["worked-expression", "short-answer", "multiple-choice"],
        visualSupportLevel: "mostly-symbolic",
        samplePracticePrompts: [
          "Expand 6^4 x 6^2 before simplifying with an index law.",
          "Explain why 8^5 / 8^2 leaves three factors of 8.",
        ],
        sampleAssessmentPrompts: [
          "Simplify 6^4 x 6^7 x 6.",
          "Simplify 8^5 / 8^2.",
        ],
        misconceptionTargets: [
          "Multiplying exponents when multiplying powers with the same base.",
          "Subtracting bases instead of exponents in quotients.",
        ],
      },
    ],
  },
  {
    key: "terminating-recurring-rational-representations",
    title: "Terminating, recurring and rational representations",
    learnerFacingTitle: "Terminating, recurring and rational representations",
    purpose:
      "Strengthen understanding of fractions, decimals, terminating decimals and recurring decimals as rational representations.",
    roughYearBands: ["Year 8", "Years 8-9"],
    prerequisiteBandKeys: ["rational-numbers-and-operations"],
    visualSupportLevel: "symbolic",
    practiceModes: [
      "guided-representation",
      "symbolic-fluency",
      "reasoning-and-transfer",
      "mixed-review",
    ],
    assessmentModes: [
      "multiple-choice",
      "matching",
      "classification",
      "short-answer",
      "explain-or-justify",
    ],
    stepCandidates: [
      {
        key: "identify-terminating-decimals-from-fractions",
        title: "Identify terminating decimals from fractions",
        learnerFacingTitle: "Recognise terminating decimals",
        description:
          "Use denominator structure and decimal conversion patterns to identify when a rational number terminates.",
        roughYearBand: "Year 8",
        practiceModes: ["guided-representation", "symbolic-fluency", "mixed-review"],
        assessmentModes: ["multiple-choice", "classification", "short-answer"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Sort fractions by whether their decimal expansion terminates.",
          "Convert 3/8 and 2/15 to decimals and compare the outcomes.",
        ],
        sampleAssessmentPrompts: [
          "Which fraction converts to a terminating decimal?",
          "Explain why 7/20 terminates.",
        ],
        misconceptionTargets: [
          "Thinking every common fraction terminates because it can be written as a decimal.",
          "Missing the role of denominator factors.",
        ],
      },
      {
        key: "connect-recurring-decimals-to-fractions",
        title: "Connect recurring decimals to fractions",
        learnerFacingTitle: "Connect recurring decimals and fractions",
        description:
          "Recognise that recurring decimals are rational and link familiar recurring decimals to fractional forms.",
        roughYearBand: "Years 8-9",
        prerequisiteStepKeys: ["identify-terminating-decimals-from-fractions"],
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["matching", "multiple-choice", "worked-expression"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Match 0.333... and 0.666... to their fraction forms.",
          "Discuss why 0.6 recurring is not the same as 0.6 exactly.",
        ],
        sampleAssessmentPrompts: [
          "Which fraction is equivalent to 0.6 recurring?",
          "Match each recurring decimal to a fraction.",
        ],
        misconceptionTargets: [
          "Treating a recurring decimal as a rounded decimal.",
          "Believing recurring decimals are irrational because they go on forever.",
        ],
      },
      {
        key: "represent-recurring-decimals-with-correct-notation",
        title: "Represent recurring decimals with correct notation",
        learnerFacingTitle: "Write recurring decimals correctly",
        description:
          "Use bar notation accurately and distinguish the repeating block from the non-repeating part.",
        roughYearBand: "Year 8",
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["multiple-choice", "matching", "short-answer"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Write 0.1222... using recurring-decimal notation.",
          "Decide which digits repeat in 1.0454545...",
        ],
        sampleAssessmentPrompts: [
          "Select the correct recurring-decimal notation for 0.1222...",
          "Write 0.818181... with bar notation.",
        ],
        misconceptionTargets: [
          "Placing the recurring bar over too many or too few digits.",
          "Confusing repeating blocks with trailing decimal digits.",
        ],
      },
      {
        key: "recognise-rational-representations-across-forms",
        title: "Recognise rational representations across forms",
        learnerFacingTitle: "Recognise equivalent rational forms",
        description:
          "Move between fraction, decimal, percentage, and recurring forms to recognise equivalent rational values.",
        roughYearBand: "Years 8-9",
        prerequisiteStepKeys: [
          "identify-terminating-decimals-from-fractions",
          "connect-recurring-decimals-to-fractions",
        ],
        practiceModes: ["mixed-review", "reasoning-and-transfer", "symbolic-fluency"],
        assessmentModes: ["matching", "classification", "multiple-choice"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Group equivalent forms such as 3/4, 0.75, and 75%.",
          "Find which decimal, fraction, and percentage belong in the same family.",
        ],
        sampleAssessmentPrompts: [
          "Which three values are equivalent?",
          "Classify each representation as rational and match it to an equivalent form.",
        ],
        misconceptionTargets: [
          "Comparing forms by appearance instead of value.",
          "Treating percent and decimal forms as separate quantities.",
        ],
      },
    ],
  },
  {
    key: "irrational-and-real-numbers",
    title: "Irrational and real numbers",
    learnerFacingTitle: "Irrational and real numbers",
    purpose:
      "Develop real-number system understanding, including rational and irrational numbers, exact values and number-line placement.",
    roughYearBands: ["Year 8", "Year 9", "Years 8-9", "Years 9-10"],
    prerequisiteBandKeys: [
      "powers-roots-exponent-notation",
      "terminating-recurring-rational-representations",
    ],
    visualSupportLevel: "mostly-symbolic",
    practiceModes: [
      "guided-representation",
      "symbolic-fluency",
      "reasoning-and-transfer",
      "mixed-review",
    ],
    assessmentModes: [
      "multiple-choice",
      "classification",
      "matching",
      "short-answer",
      "applied-problem",
      "explain-or-justify",
    ],
    stepCandidates: [
      {
        key: "recognise-irrational-numbers-including-square-roots-and-pi",
        title: "Recognise irrational numbers including square roots and pi",
        learnerFacingTitle: "Recognise irrational numbers",
        description:
          "Identify common irrational forms and distinguish them from rational decimals and fractions.",
        roughYearBand: "Year 8",
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["multiple-choice", "classification", "matching"],
        visualSupportLevel: "mostly-symbolic",
        samplePracticePrompts: [
          "Sort values into rational and irrational groups.",
          "Explain why pi belongs in the irrational set.",
        ],
        sampleAssessmentPrompts: [
          "Select two irrational numbers.",
          "Which list contains only irrational numbers?",
        ],
        misconceptionTargets: [
          "Assuming every radical is irrational, including perfect squares.",
          "Thinking a long decimal is automatically irrational.",
        ],
      },
      {
        key: "classify-numbers-as-rational-or-irrational",
        title: "Classify numbers as rational or irrational",
        learnerFacingTitle: "Classify rational and irrational numbers",
        description:
          "Use definitions and equivalent forms to classify numbers consistently across several representations.",
        roughYearBand: "Years 8-9",
        prerequisiteStepKeys: [
          "recognise-irrational-numbers-including-square-roots-and-pi",
        ],
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["classification", "multiple-choice", "explain-or-justify"],
        visualSupportLevel: "mostly-symbolic",
        samplePracticePrompts: [
          "Sort 8/7, square root 31, 3.2, and square root 4 into rational and irrational.",
          "Justify one classification using an equivalent form.",
        ],
        sampleAssessmentPrompts: [
          "Sort the numbers into rational and irrational groups.",
          "Which statement about square root 7 is correct?",
        ],
        misconceptionTargets: [
          "Classifying by notation alone.",
          "Forgetting that terminating and recurring decimals are rational.",
        ],
      },
      {
        key: "identify-statements-about-irrational-numbers",
        title: "Identify statements about irrational numbers",
        learnerFacingTitle: "Reason about irrational numbers",
        description:
          "Evaluate truth statements about irrationality, exactness, and decimal expansion.",
        roughYearBand: "Year 9",
        prerequisiteStepKeys: ["classify-numbers-as-rational-or-irrational"],
        practiceModes: ["reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["multiple-choice", "explain-or-justify", "classification"],
        visualSupportLevel: "mostly-symbolic",
        samplePracticePrompts: [
          "Decide whether statements about square root 7 are always, sometimes, or never true.",
          "Explain why an irrational number cannot be written as a fraction of integers.",
        ],
        sampleAssessmentPrompts: [
          "Which statement about square root 7 is true?",
          "Choose the false statement about irrational numbers.",
        ],
        misconceptionTargets: [
          "Confusing approximate decimal values with exact values.",
          "Thinking irrational means 'negative' or 'imaginary'.",
        ],
      },
      {
        key: "place-rational-and-irrational-numbers-on-a-number-line",
        title: "Place rational and irrational numbers on a number line",
        learnerFacingTitle: "Place real numbers on a number line",
        description:
          "Approximate and locate rational and irrational numbers on a common number line.",
        roughYearBand: "Years 8-9",
        prerequisiteStepKeys: [
          "recognise-irrational-numbers-including-square-roots-and-pi",
          "estimate-non-perfect-square-roots",
        ],
        practiceModes: ["guided-representation", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["matching", "multiple-choice", "short-answer"],
        visualSupportLevel: "representational",
        samplePracticePrompts: [
          "Place 3.2, 8/7, square root 31, and square root 4 on the same number line.",
          "Estimate where pi would sit between two consecutive integers.",
        ],
        sampleAssessmentPrompts: [
          "Match square root 4, 3.2, square root 31 and 8/7 to number-line positions.",
          "Which point is closest to square root 5?",
        ],
        misconceptionTargets: [
          "Placing irrational numbers without estimating their size.",
          "Treating exact forms as if they cannot be located approximately.",
        ],
      },
      {
        key: "solve-applied-problems-involving-exact-real-number-values",
        title: "Solve applied problems involving exact real-number values",
        learnerFacingTitle: "Use exact real-number values in contexts",
        description:
          "Use exact real-number forms in geometry and measurement without collapsing everything to rounded decimals too early.",
        roughYearBand: "Years 9-10",
        prerequisiteStepKeys: [
          "place-rational-and-irrational-numbers-on-a-number-line",
          "recognise-irrational-numbers-including-square-roots-and-pi",
        ],
        practiceModes: ["applied-context", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["applied-problem", "worked-expression", "explain-or-justify"],
        visualSupportLevel: "mostly-symbolic",
        samplePracticePrompts: [
          "Find the exact area of a circle with radius 6 cm in terms of pi.",
          "Compare exact and approximate answers for a triangle with square root dimensions.",
        ],
        sampleAssessmentPrompts: [
          "Find the exact area of a circle in terms of pi.",
          "Calculate the exact area of a triangle involving square root 12.",
        ],
        misconceptionTargets: [
          "Replacing exact values with rounded decimals too early.",
          "Dropping radicals or pi when combining exact expressions.",
        ],
      },
    ],
  },
  {
    key: "approximation-estimation-error",
    title: "Approximation, estimation and error",
    learnerFacingTitle: "Approximation, estimation and error",
    purpose:
      "Understand how rounding, truncation and approximation affect calculations, repeated calculations and practical decisions.",
    roughYearBands: ["Year 7", "Year 9", "Year 10", "Years 9-10"],
    prerequisiteBandKeys: [
      "rational-numbers-and-operations",
      "irrational-and-real-numbers",
    ],
    visualSupportLevel: "symbolic",
    practiceModes: [
      "guided-representation",
      "symbolic-fluency",
      "applied-context",
      "reasoning-and-transfer",
      "mixed-review",
    ],
    assessmentModes: [
      "short-answer",
      "multiple-choice",
      "worked-expression",
      "applied-problem",
      "explain-or-justify",
    ],
    stepCandidates: [
      {
        key: "round-decimals-to-a-required-accuracy",
        title: "Round decimals to a required accuracy",
        learnerFacingTitle: "Round decimals accurately",
        description:
          "Round decimal values to whole numbers or decimal places while attending to place-value meaning.",
        roughYearBand: "Year 7",
        practiceModes: ["guided-representation", "symbolic-fluency", "mixed-review"],
        assessmentModes: ["short-answer", "multiple-choice", "matching"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Round 72.3028 to 1, 2, and 3 decimal places.",
          "Use a place-value chart to explain why 4.995 rounds the way it does.",
        ],
        sampleAssessmentPrompts: [
          "Round 72.3028 to 2 decimal places.",
          "Which value is 8.649 rounded to 1 decimal place?",
        ],
        misconceptionTargets: [
          "Looking at the wrong digit when rounding.",
          "Changing several digits instead of only the target place and the digits after it.",
        ],
      },
      {
        key: "estimate-sums-and-products-using-rounding",
        title: "Estimate sums and products using rounding",
        learnerFacingTitle: "Estimate with rounded numbers",
        description:
          "Use appropriate rounding to estimate sums and products efficiently and explain the estimate quality.",
        roughYearBand: "Year 7",
        prerequisiteStepKeys: ["round-decimals-to-a-required-accuracy"],
        practiceModes: ["symbolic-fluency", "applied-context", "mixed-review"],
        assessmentModes: ["short-answer", "worked-expression", "multiple-choice"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Estimate 3.05 + 6.73 by rounding each term.",
          "Estimate 3.72 x 2.25 by rounding each factor to 1 decimal place.",
        ],
        sampleAssessmentPrompts: [
          "Estimate 3.05 + 6.73 by rounding each term.",
          "Estimate 3.72 x 2.25 by rounding to 1 decimal place.",
        ],
        misconceptionTargets: [
          "Forgetting the estimate is approximate and then treating it as exact.",
          "Rounding one quantity appropriately and the other inconsistently.",
        ],
      },
      {
        key: "compare-exact-and-estimated-results",
        title: "Compare exact and estimated results",
        learnerFacingTitle: "Compare exact and estimated answers",
        description:
          "Interpret whether an estimate is sensible by comparing it to the exact calculation and the context.",
        roughYearBand: "Year 9",
        prerequisiteStepKeys: [
          "round-decimals-to-a-required-accuracy",
          "estimate-sums-and-products-using-rounding",
        ],
        practiceModes: ["reasoning-and-transfer", "applied-context", "mixed-review"],
        assessmentModes: ["applied-problem", "explain-or-justify", "short-answer"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Calculate an exact answer, then compare it with a rounded estimate and describe the difference.",
          "Decide whether an estimate is close enough for buying carpet.",
        ],
        sampleAssessmentPrompts: [
          "Compare the exact and estimated results for a product and state whether the estimate is sensible.",
          "Which estimate is more useful in this context?",
        ],
        misconceptionTargets: [
          "Assuming a smaller absolute difference always means a better estimate in every context.",
          "Comparing values without considering units or context purpose.",
        ],
      },
      {
        key: "truncate-and-round-values",
        title: "Truncate and round values",
        learnerFacingTitle: "Truncate and round decimals",
        description:
          "Distinguish between truncating and rounding and interpret how each changes a value.",
        roughYearBand: "Year 9",
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["short-answer", "multiple-choice", "classification"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Truncate and round Euler's number to a whole number and compare the outcomes.",
          "Explain the difference between truncating and rounding 11.67 / 2.12.",
        ],
        sampleAssessmentPrompts: [
          "Truncate and round Euler's number to a whole number.",
          "Which statement correctly compares truncation and rounding for the same value?",
        ],
        misconceptionTargets: [
          "Using truncation when the task asks for rounding.",
          "Thinking truncation and rounding give the same result except with zeros.",
        ],
      },
      {
        key: "analyse-approximation-error-in-contexts",
        title: "Analyse approximation error in contexts",
        learnerFacingTitle: "Analyse error in a real context",
        description:
          "Reason about how rounding and estimation affect decisions in practical measurement and financial situations.",
        roughYearBand: "Years 9-10",
        prerequisiteStepKeys: [
          "compare-exact-and-estimated-results",
          "truncate-and-round-values",
        ],
        practiceModes: ["applied-context", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["applied-problem", "worked-expression", "explain-or-justify"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Estimate room area after rounding dimensions and compare the result with the exact area.",
          "Investigate the error in a pedometer estimate caused by rounding stride length.",
        ],
        sampleAssessmentPrompts: [
          "Find the walking-distance error from a pedometer stride-length estimate.",
          "Estimate carpet area after rounding room dimensions and comment on the error.",
        ],
        misconceptionTargets: [
          "Ignoring compounding effects when several rounded values are used together.",
          "Describing error only qualitatively without comparing it to the calculation context.",
        ],
      },
      {
        key: "recognise-repeated-approximation-effects",
        title: "Recognise repeated approximation effects",
        learnerFacingTitle: "Recognise repeated rounding effects",
        description:
          "Understand how repeated approximations in formulas, measurement, and finance can accumulate over time.",
        roughYearBand: "Year 10",
        prerequisiteStepKeys: ["analyse-approximation-error-in-contexts"],
        practiceModes: ["applied-context", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["applied-problem", "explain-or-justify", "worked-expression"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Compare annual interest growth when the balance is rounded each year versus left exact until the end.",
          "Estimate circumference using a rounded diameter and discuss the effect.",
        ],
        sampleAssessmentPrompts: [
          "Explain the effect of rounding each year in a simple interest or compounding situation.",
          "Describe how rounding the diameter changes the circumference estimate.",
        ],
        misconceptionTargets: [
          "Assuming a small one-step rounding choice stays small after many steps.",
          "Treating every approximation as unbiased without checking direction of error.",
        ],
      },
    ],
  },
  {
    key: "surds-and-exact-form",
    title: "Surds and exact form",
    learnerFacingTitle: "Surds and exact form",
    purpose:
      "Manipulate exact irrational forms using surd notation, fractional indices, simplification and rationalising denominators.",
    roughYearBands: ["Year 10A", "Years 10-10A"],
    prerequisiteBandKeys: [
      "irrational-and-real-numbers",
      "powers-roots-exponent-notation",
    ],
    visualSupportLevel: "symbolic",
    practiceModes: [
      "symbolic-fluency",
      "reasoning-and-transfer",
      "mixed-review",
    ],
    assessmentModes: [
      "short-answer",
      "multiple-choice",
      "worked-expression",
      "applied-problem",
      "explain-or-justify",
    ],
    stepCandidates: [
      {
        key: "write-fractional-powers-in-surd-form",
        title: "Write fractional powers in surd form",
        learnerFacingTitle: "Connect fractional powers and surds",
        description:
          "Translate between fractional index notation and equivalent surd forms.",
        roughYearBand: "Year 10A",
        practiceModes: ["symbolic-fluency", "mixed-review"],
        assessmentModes: ["matching", "short-answer", "multiple-choice"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Rewrite 3^(1/2) and 5^(3/2) in surd form.",
          "Match each fractional index with an equivalent radical expression.",
        ],
        sampleAssessmentPrompts: [
          "Write 3^(1/2) in surd form.",
          "Which radical form matches x^(1/3)?",
        ],
        misconceptionTargets: [
          "Treating the fractional index as ordinary division.",
          "Confusing the denominator of the index with multiplication outside the radical.",
        ],
      },
      {
        key: "evaluate-fractional-powers",
        title: "Evaluate fractional powers",
        learnerFacingTitle: "Evaluate fractional powers",
        description:
          "Evaluate numerical expressions with fractional indices by connecting roots and powers in the correct order.",
        roughYearBand: "Years 10-10A",
        prerequisiteStepKeys: ["write-fractional-powers-in-surd-form"],
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer"],
        assessmentModes: ["short-answer", "worked-expression", "multiple-choice"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Evaluate 27^(2/3) by taking the cube root first, then squaring.",
          "Compare two methods for evaluating 16^(3/4).",
        ],
        sampleAssessmentPrompts: [
          "Evaluate 27^(2/3).",
          "Select the equivalent term for (0.1)^(1/2).",
        ],
        misconceptionTargets: [
          "Applying the numerator and denominator of the index in the wrong order.",
          "Losing the exact-form meaning by rounding too early.",
        ],
      },
      {
        key: "simplify-surds",
        title: "Simplify surds",
        learnerFacingTitle: "Simplify radicals",
        description:
          "Factor radicands to simplify surds and express results in exact form.",
        roughYearBand: "Year 10A",
        practiceModes: ["symbolic-fluency", "mixed-review"],
        assessmentModes: ["short-answer", "worked-expression", "multiple-choice"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Simplify square root 24 by identifying the largest square factor.",
          "Explain why square root 12 is 2 square root 3.",
        ],
        sampleAssessmentPrompts: [
          "Simplify square root 24.",
          "Which expression is equivalent to square root 75?",
        ],
        misconceptionTargets: [
          "Splitting square root (a + b) into square root a + square root b.",
          "Missing the largest square factor and stopping too early.",
        ],
      },
      {
        key: "multiply-surds",
        title: "Multiply surds",
        learnerFacingTitle: "Multiply surd expressions",
        description:
          "Multiply surds and then simplify to exact form using factor structure.",
        roughYearBand: "Years 10-10A",
        prerequisiteStepKeys: ["simplify-surds"],
        practiceModes: ["symbolic-fluency", "mixed-review"],
        assessmentModes: ["worked-expression", "short-answer", "multiple-choice"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Multiply square root 12 by square root 6, then simplify.",
          "Explain why multiplying surds first can reveal a square factor.",
        ],
        sampleAssessmentPrompts: [
          "Simplify square root 12 x square root 6.",
          "Which product is equivalent to 6 square root 2?",
        ],
        misconceptionTargets: [
          "Multiplying only the numbers outside the radical.",
          "Failing to simplify the resulting radical.",
        ],
      },
      {
        key: "add-and-subtract-like-surds",
        title: "Add and subtract like surds",
        learnerFacingTitle: "Combine like surds",
        description:
          "Recognise like surds and combine them in the same way as like algebraic terms.",
        roughYearBand: "Year 10A",
        prerequisiteStepKeys: ["simplify-surds"],
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["short-answer", "worked-expression", "multiple-choice"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Simplify square root 45 + square root 20 by rewriting each term first.",
          "Decide which surd terms are like terms before combining.",
        ],
        sampleAssessmentPrompts: [
          "Simplify square root 45 + square root 20.",
          "Which expression combines to 5 square root 5?",
        ],
        misconceptionTargets: [
          "Adding radicands directly.",
          "Trying to combine unlike surds before simplification.",
        ],
      },
      {
        key: "simplify-expressions-containing-multiple-surds",
        title: "Simplify expressions containing multiple surds",
        learnerFacingTitle: "Simplify multi-step surd expressions",
        description:
          "Simplify several surd terms in one expression and collect like exact forms accurately.",
        roughYearBand: "Years 10-10A",
        prerequisiteStepKeys: [
          "simplify-surds",
          "add-and-subtract-like-surds",
        ],
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer", "mixed-review"],
        assessmentModes: ["worked-expression", "short-answer", "explain-or-justify"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Simplify square root 12 + square root 45 - square root 48 step by step.",
          "Show each simplification before combining like surds.",
        ],
        sampleAssessmentPrompts: [
          "Simplify square root 12 + square root 45 - square root 48.",
          "Explain why two of the surd terms can combine after simplification.",
        ],
        misconceptionTargets: [
          "Skipping simplification and concluding terms are unlike.",
          "Losing signs when rewriting or combining terms.",
        ],
      },
      {
        key: "rationalise-denominators",
        title: "Rationalise denominators",
        learnerFacingTitle: "Rationalise a denominator",
        description:
          "Use equivalent forms to remove radicals from denominators while preserving exact value.",
        roughYearBand: "Years 10-10A",
        prerequisiteStepKeys: [
          "multiply-surds",
          "simplify-expressions-containing-multiple-surds",
        ],
        practiceModes: ["symbolic-fluency", "reasoning-and-transfer"],
        assessmentModes: ["worked-expression", "short-answer", "multiple-choice"],
        visualSupportLevel: "symbolic",
        samplePracticePrompts: [
          "Rationalise 6 / (1 + square root 10) using a conjugate.",
          "Explain why multiplying by a conjugate keeps the value equivalent.",
        ],
        sampleAssessmentPrompts: [
          "Rationalise 6 / (1 + square root 10).",
          "Which conjugate should be used to rationalise 4 / (3 - square root 2)?",
        ],
        misconceptionTargets: [
          "Multiplying numerator and denominator by the same surd instead of the conjugate when needed.",
          "Expanding the denominator incorrectly when using conjugates.",
        ],
      },
    ],
  },
];

export function getNumberProgressionBandByKey(key: NumberProgressionBandKey) {
  return YEARS_6_TO_10_NUMBER_PROGRESSION_BANDS.find((band) => band.key === key) || null;
}

export function getNumberProgressionStepCandidates() {
  return YEARS_6_TO_10_NUMBER_PROGRESSION_BANDS.flatMap((band) => band.stepCandidates);
}

export function getNumberProgressionStepsByBand(key: NumberProgressionBandKey) {
  return getNumberProgressionBandByKey(key)?.stepCandidates || [];
}
