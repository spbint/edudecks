import {
  getPathwayStepsByStrand,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import type {
  NumberOperationsSubElementKey,
} from "./numberOperationsPlacementResult";

export type NumberOperationsCrosswalkStepDescriptor = {
  strandKey:
    | "number-and-place-value"
    | "operations-and-calculation"
    | "financial-and-real-world-mathematics";
  stageKey: string;
  stepTitle: string;
};

export type NumberOperationsProgressionPathwayCrosswalkEntry = {
  subElementKey: NumberOperationsSubElementKey;
  pLevel: number;
  sourceFocus: string;
  sourcePages: number[];
  target: NumberOperationsCrosswalkStepDescriptor | null;
  confidence: "source-guided-step" | "strand-level";
  rationale: string;
};

const step = (
  strandKey: NumberOperationsCrosswalkStepDescriptor["strandKey"],
  stageKey: string,
  stepTitle: string,
): NumberOperationsCrosswalkStepDescriptor => ({
  strandKey,
  stageKey,
  stepTitle,
});

const sourceGuided = (
  subElementKey: NumberOperationsSubElementKey,
  pLevel: number,
  sourceFocus: string,
  sourcePages: number[],
  target: NumberOperationsCrosswalkStepDescriptor,
  rationale: string,
): NumberOperationsProgressionPathwayCrosswalkEntry => ({
  subElementKey,
  pLevel,
  sourceFocus,
  sourcePages,
  target,
  confidence: "source-guided-step",
  rationale,
});

const strandOnly = (
  subElementKey: NumberOperationsSubElementKey,
  pLevel: number,
  sourceFocus: string,
  sourcePages: number[],
  rationale: string,
): NumberOperationsProgressionPathwayCrosswalkEntry => ({
  subElementKey,
  pLevel,
  sourceFocus,
  sourcePages,
  target: null,
  confidence: "strand-level",
  rationale,
});

export const NUMBER_OPERATIONS_PROGRESSION_PATHWAY_CROSSWALK: NumberOperationsProgressionPathwayCrosswalkEntry[] = [
  sourceGuided("number-place-value", 1, "familiar number names and numerals", [2, 3], step("number-and-place-value", "foundation-kindergarten", "Identify numerals 0-10"), "The pathway step is the closest next-learning action for early numeral recognition; it is not claimed as a one-to-one equivalence."),
  sourceGuided("number-place-value", 2, "small quantities, numerals to 10 and early tens structure", [2, 3], step("number-and-place-value", "foundation-kindergarten", "Recognise small quantities without counting"), "The source indicators include subitising and recognising small quantities, which this pathway step directly develops."),
  sourceGuided("number-place-value", 3, "numerals to 20 and early part-whole structure", [2, 3], step("number-and-place-value", "foundation-kindergarten", "Count objects accurately to 20"), "This is a practical next-learning step near the source level while part-whole evidence remains represented separately in the pathway."),
  sourceGuided("number-place-value", 4, "ordering to 20 and one ten as ten ones", [2, 3], step("number-and-place-value", "lower-primary", "Understand that ten ones make one ten"), "The source introduces the base-ten unit relationship explicitly."),
  sourceGuided("number-place-value", 5, "two-digit place value and flexible renaming", [2, 3], step("number-and-place-value", "lower-primary", "Rename two-digit numbers in different ways"), "The source and pathway both focus on flexible two-digit renaming."),
  sourceGuided("number-place-value", 6, "four-digit place value, rounding and tenths", [3, 4], step("number-and-place-value", "middle-primary", "Read, write, order and compare numbers to 1000 and beyond"), "This provides the safest entry into the larger-number part of P6; decimal and rounding follow as separate pathway steps."),
  sourceGuided("number-place-value", 7, "larger numerals and decimals to hundredths", [3, 4], step("number-and-place-value", "upper-primary", "Extend place value to decimals"), "The source explicitly extends place value into decimal notation."),
  sourceGuided("number-place-value", 8, "decimal place value, comparison and rounding", [3, 4], step("number-and-place-value", "upper-primary", "Compare and order decimals"), "The source and pathway share the decimal comparison and ordering construct."),
  sourceGuided("number-place-value", 9, "negative numbers and multiplicative place-value relationships", [3, 4], step("number-and-place-value", "lower-secondary", "Understand negative numbers and number lines"), "Negative-number representation is a direct, bounded construct match at this level."),
  sourceGuided("number-place-value", 10, "very large and small numbers and scientific notation", [3, 4], step("number-and-place-value", "years-9-10-consolidation", "Work with standard form and very large or very small numbers"), "The source and pathway directly align around very large/small numbers and standard/scientific notation."),

  sourceGuided("counting-processes", 1, "number words in early counting sequences", [5], step("number-and-place-value", "foundation-kindergarten", "Match spoken number names to quantities"), "This is the closest practical pathway entry for early number-word meaning."),
  sourceGuided("counting-processes", 2, "subitising very small collections", [5], step("number-and-place-value", "foundation-kindergarten", "Recognise small quantities without counting"), "The construct is directly represented by the pathway step."),
  sourceGuided("counting-processes", 3, "one-to-one counting and cardinality", [5], step("number-and-place-value", "foundation-kindergarten", "Count objects accurately to 10"), "The pathway step directly develops stable one-to-one counting."),
  sourceGuided("counting-processes", 4, "next/previous number and keeping track of counted items", [5], step("number-and-place-value", "foundation-kindergarten", "Order numbers in a short sequence"), "The step provides the nearest next action for before/after sequence knowledge."),
  sourceGuided("counting-processes", 5, "next/previous within 100 and collections to 20", [5], step("number-and-place-value", "lower-primary", "Count forwards and backwards within 100 or 120"), "The source and pathway directly share forward/backward sequence fluency."),
  sourceGuided("counting-processes", 6, "skip counting by twos, fives and tens", [5], step("number-and-place-value", "lower-primary", "Skip count by 2s, 5s and 10s"), "The source and pathway step are a direct construct match."),
  strandOnly("counting-processes", 7, "off-decade skip counting and efficient grouping of large quantities", [5], "No single current pathway step captures both off-decade sequences and strategic grouping strongly enough for a specific-step claim."),
  strandOnly("counting-processes", 8, "flexible counting with rational and negative numbers", [5], "The current pathway distributes these ideas across later Number work rather than one dedicated counting step."),

  sourceGuided("additive-strategies", 1, "joining and taking away with collections", [6], step("operations-and-calculation", "foundation-kindergarten", "Act out joining and taking away in everyday stories"), "The source and pathway directly share emergent joining/taking-away actions."),
  sourceGuided("additive-strategies", 2, "perceptual additive situations with visible materials", [6], step("operations-and-calculation", "foundation-kindergarten", "Act out joining and taking away in everyday stories"), "The pathway keeps the source construct grounded in concrete stories and materials."),
  sourceGuided("additive-strategies", 3, "figurative additive tasks with concealed collections", [6], step("operations-and-calculation", "lower-primary", "Use counting strategies and known facts more efficiently"), "This is the next pathway action as the learner moves from visible collections toward mental/counting strategies."),
  sourceGuided("additive-strategies", 4, "counting-on strategies for addition", [6], step("operations-and-calculation", "lower-primary", "Use counting strategies and known facts more efficiently"), "The pathway step directly develops counting-on and increasingly efficient facts."),
  sourceGuided("additive-strategies", 5, "counting-back and related subtraction strategies", [6], step("operations-and-calculation", "lower-primary", "Use counting strategies and known facts more efficiently"), "The step covers the same transition from count-based to more efficient additive strategy use."),
  sourceGuided("additive-strategies", 6, "flexible combinations to 10 and part-whole reasoning", [6], step("operations-and-calculation", "lower-primary", "Use part-whole thinking for addition and subtraction"), "Part-whole reasoning is explicit in both source and pathway."),
  sourceGuided("additive-strategies", 7, "flexible two-digit addition and subtraction", [6], step("operations-and-calculation", "lower-primary", "Use part-whole thinking for addition and subtraction"), "The existing pathway step is the closest construct-aligned transition before later written/mental methods."),
  sourceGuided("additive-strategies", 8, "three-digit and larger additive strategies", [6], step("operations-and-calculation", "upper-primary", "Use written methods and mental strategies flexibly"), "The source calls for flexible mental, written and technology-supported additive strategies."),
  sourceGuided("additive-strategies", 9, "additive strategies with decimals and fractions", [6], step("operations-and-calculation", "lower-secondary", "Choose efficient strategies across different number forms"), "The pathway step explicitly broadens calculation strategy choice across number forms."),
  sourceGuided("additive-strategies", 10, "multi-step addition and subtraction with rational numbers", [6], step("operations-and-calculation", "lower-secondary", "Apply calculation to richer practical reasoning"), "The source moves to multi-step rational-number problems, matching the richer-reasoning pathway action."),

  sourceGuided("multiplicative-strategies", 1, "forming and sharing equal groups", [7], step("operations-and-calculation", "foundation-kindergarten", "Share, compare, and notice simple differences"), "The pathway step provides the concrete equal-sharing entry point."),
  sourceGuided("multiplicative-strategies", 2, "visible equal groups and skip-counted multiples", [7], step("operations-and-calculation", "foundation-kindergarten", "Share, compare, and notice simple differences"), "This remains the safest concrete pathway action before formal grouping."),
  sourceGuided("multiplicative-strategies", 3, "imagined equal groups and composite units", [7], step("operations-and-calculation", "middle-primary", "Model equal groups and repeated addition"), "The source shifts toward composite-unit reasoning, which the pathway models through equal groups and repeated addition."),
  sourceGuided("multiplicative-strategies", 4, "repeated abstract composite units", [7], step("operations-and-calculation", "middle-primary", "Model equal groups and repeated addition"), "Repeated addition/subtraction of composite units is directly developed by this pathway step."),
  sourceGuided("multiplicative-strategies", 5, "coordinating multiplication and division representations", [7], step("operations-and-calculation", "middle-primary", "Connect multiplication and division through grouping and sharing"), "The source explicitly coordinates multiplication and division representations."),
  sourceGuided("multiplicative-strategies", 6, "flexible single-digit multiplication and division", [7, 8], step("operations-and-calculation", "upper-primary", "Use written methods and mental strategies flexibly"), "The pathway action matches the move to flexible fact and strategy use."),
  sourceGuided("multiplicative-strategies", 7, "inverse operations and flexible multi-digit strategy use", [7, 8], step("operations-and-calculation", "upper-primary", "Use written methods and mental strategies flexibly"), "The source emphasises inverse relationships and flexible strategy choice."),
  sourceGuided("multiplicative-strategies", 8, "multi-step multiplicative problems with natural numbers", [7, 8], step("operations-and-calculation", "upper-primary", "Estimate and solve multi-step practical problems"), "The source and pathway both move into multi-step practical multiplicative reasoning."),
  sourceGuided("multiplicative-strategies", 9, "prime factors and rational-number multiplication/division", [7, 8], step("operations-and-calculation", "lower-secondary", "Choose efficient strategies across different number forms"), "The pathway action captures the source shift into rational and structurally richer number forms."),
  sourceGuided("multiplicative-strategies", 10, "multiplicative reasoning with decimals, scientific notation and rational numbers", [7, 8], step("operations-and-calculation", "years-9-10-consolidation", "Use operations confidently in algebraic and financial contexts"), "This is a source-guided later-calculation handoff rather than a claim that the pathway step is equivalent to the entire P10 indicator set."),

  sourceGuided("understanding-money", 1, "recognising money situations and face values", [12, 13], step("financial-and-real-world-mathematics", "foundation-kindergarten", "Recognise money and simple exchange in play"), "The source and pathway directly share early money recognition."),
  sourceGuided("understanding-money", 2, "sorting and ordering denominations", [12, 13], step("financial-and-real-world-mathematics", "lower-primary", "Use money amounts in simple practical tasks"), "The pathway action provides a practical context for denomination comparison and ordering."),
  sourceGuided("understanding-money", 3, "counting small money collections and writing values", [12, 13], step("financial-and-real-world-mathematics", "lower-primary", "Use money amounts in simple practical tasks"), "The pathway action directly supports counting and recording money amounts."),
  sourceGuided("understanding-money", 4, "equivalent money representations", [12, 13], step("financial-and-real-world-mathematics", "lower-primary", "Use money amounts in simple practical tasks"), "Equivalent money values are naturally practised through the existing practical-money step."),
  sourceGuided("understanding-money", 5, "larger money collections and dollars/cents decimal notation", [12, 13], step("financial-and-real-world-mathematics", "middle-primary", "Compare value and change in practical situations"), "The source and pathway both require interpreting money values beyond simple identification."),
  sourceGuided("understanding-money", 6, "totals, change and additive money reasoning", [13], step("financial-and-real-world-mathematics", "middle-primary", "Compare value and change in practical situations"), "The pathway step directly supports totals and change in practical transactions."),
  sourceGuided("understanding-money", 7, "multiplicative money problems and simple budgets", [13], step("financial-and-real-world-mathematics", "middle-primary", "Plan simple budgets and spending choices"), "Budgeting and repeated-purchase reasoning are explicit in both source and pathway."),
  sourceGuided("understanding-money", 8, "percentage change, discounts and simple interest", [13], step("financial-and-real-world-mathematics", "upper-primary", "Use percentages and comparisons in shopping decisions"), "The source and pathway share percentage-based shopping decisions; interest work can follow through later finance steps."),
  sourceGuided("understanding-money", 9, "best buys, payment plans and percentage profit/loss", [13], step("financial-and-real-world-mathematics", "lower-secondary", "Use several mathematical ideas in financial decisions"), "The pathway action directly supports comparison among rates, plans, discounts and financial choices."),
  sourceGuided("understanding-money", 10, "compound-interest and longer-term financial decisions", [13], step("financial-and-real-world-mathematics", "years-9-10-consolidation", "Use financial mathematics in realistic planning"), "The pathway step is the intended later-stage home for compound-interest and realistic financial planning."),
];

const byKey = new Map(
  NUMBER_OPERATIONS_PROGRESSION_PATHWAY_CROSSWALK.map((entry) => [
    `${entry.subElementKey}:p${entry.pLevel}`,
    entry,
  ]),
);

export function getNumberOperationsProgressionPathwayCrosswalkEntry(
  subElementKey: NumberOperationsSubElementKey,
  pLevel: number,
) {
  return byKey.get(`${subElementKey}:p${pLevel}`) || null;
}

export function resolveNumberOperationsCrosswalkStep(
  entry: NumberOperationsProgressionPathwayCrosswalkEntry,
): PathwayStepRegistryItem | null {
  if (!entry.target) return null;
  return (
    getPathwayStepsByStrand("mathematics", entry.target.strandKey).find(
      (candidate) =>
        candidate.stageKey === entry.target?.stageKey &&
        candidate.stepTitle === entry.target?.stepTitle,
    ) || null
  );
}

export const NUMBER_OPERATIONS_CROSSWALK_SOURCE = {
  authority: "Queensland Curriculum & Assessment Authority",
  title: "Numeracy general capability — Sequence of numeracy progressions",
  curriculumVersion: "Australian Curriculum Version 9.0",
  publication: "March 2024",
  url: "https://www.qcaa.qld.edu.au/downloads/aciqv9/general-resources/ac9_gc_progressions_numeracy.pdf",
  rule:
    "A source-guided pathway step is a recommended next-learning handoff, not a claim that one MyLearna step is equivalent to an entire progression level.",
} as const;
