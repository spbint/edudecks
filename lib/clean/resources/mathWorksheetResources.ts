import type { PathwaySubjectKey } from "@/lib/clean/pathways/pathwaySubjects";

export type MathWorksheetResourceType = "worksheet-pdf";

export type MathWorksheetResource = {
  pathwayStepId: string;
  stepKey: string;
  subjectKey: PathwaySubjectKey;
  strandKey: string;
  stageKey: string;
  stageDisplay?: string;
  stepNumber: number;
  pathwayStepTitle?: string;
  title: string;
  curriculumCode?: string;
  concept?: string;
  includesAnswerSheet?: boolean;
  regionalVariants?: string[];
  containsRegionalMoneyPages?: boolean;
  fileName: string;
  href: string;
  resourceType: MathWorksheetResourceType;
};

export type MathWorksheetStepContext = {
  pathwayStepId?: string | null;
  stepKey?: string | null;
  subjectKey?: string | null;
  strandKey?: string | null;
  stageKey?: string | null;
};

const SMALL_QUANTITIES_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S001-Recognise-Small-Quantities-Without-Counting.pdf";
const NUMBER_WORDS_TO_GROUPS_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S002-Match-Spoken-Number-Names-To-Quantities.pdf";
const IDENTIFY_NUMERALS_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S003-Identify-Numerals-0-10.pdf";
const COUNT_OBJECTS_TO_10_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S004-Count-Objects-Accurately-To-10.pdf";
const COUNT_OBJECTS_TO_20_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S005-Count-Objects-Accurately-To-20.pdf";
const COMPARE_GROUPS_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S006-Compare-Groups-More-Fewer-Or-Same.pdf";
const ORDER_NUMBERS_SEQUENCE_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S007-Order-Numbers-In-A-Short-Sequence.pdf";
const PARTITION_COMBINE_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S008-Partition-And-Combine-Small-Collections-Up-To-10.pdf";
const OBJECT_STORIES_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S009-Represent-Simple-Addition-And-Subtraction-Stories-With-Objects.pdf";
const SHARE_EQUALLY_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S010-Share-Small-Collections-Equally.pdf";
const COUNT_FORWARDS_BACKWARDS_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S011-Count-Forwards-And-Backwards-Within-100-Or-120.pdf";
const READ_WRITE_ORDER_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S012-Read-Write-And-Order-Numbers-To-100-Or-120.pdf";
const SKIP_COUNT_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S013-Skip-Count-By-2s-5s-And-10s.pdf";
const TEN_ONES_MAKE_TEN_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S014-Understand-That-Ten-Ones-Make-One-Ten.pdf";
const PARTITION_TWO_DIGIT_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S015-Partition-Two-Digit-Numbers-Into-Tens-And-Ones.pdf";
const RENAME_TWO_DIGIT_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S016-Rename-Two-Digit-Numbers-In-Different-Ways.pdf";
const ADD_SUBTRACT_WITHIN_20_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S017-Add-And-Subtract-Within-20-Using-Known-Facts.pdf";
const ADD_SUBTRACT_WITH_SUPPORT_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S018-Add-And-Subtract-One-And-Two-Digit-Numbers-With-Support.pdf";
const EQUAL_GROUPS_ARRAYS_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S019-Understand-Simple-Equal-Groups-And-Arrays.pdf";
const HALVES_QUARTERS_SHARING_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S020-Begin-Halves-Quarters-And-Simple-Sharing.pdf";
const READ_WRITE_ORDER_COMPARE_1000_WORKSHEET_FILE =
  "MYL-MATH-NPV-MP-S021-Read-Write-Order-And-Compare-Numbers-To-1000-And-Beyond.pdf";
const HUNDREDS_TENS_ONES_WORKSHEET_FILE =
  "MYL-MATH-NPV-MP-S022-Understand-Hundreds-Tens-And-Ones.pdf";
const PARTITION_REGROUP_TWO_THREE_DIGIT_WORKSHEET_FILE =
  "MYL-MATH-NPV-MP-S023-Partition-And-Regroup-Two-And-Three-Digit-Numbers.pdf";
const ZERO_PLACEHOLDER_WORKSHEET_FILE =
  "MYL-MATH-NPV-MP-S024-Use-Zero-As-A-Placeholder.pdf";
const ADD_SUBTRACT_PLACE_VALUE_WORKSHEET_FILE =
  "MYL-MATH-NPV-MP-S025-Add-And-Subtract-Two-And-Three-Digit-Numbers-Using-Place-Value.pdf";
const MULTIPLICATION_FACTS_WORKSHEET_FILE =
  "MYL-MATH-NPV-MP-S026-Recall-And-Apply-Multiplication-Facts.pdf";
const MULTIPLY_DIVIDE_ARRAYS_GROUPING_WORKSHEET_FILE =
  "MYL-MATH-NPV-MP-S027-Multiply-And-Divide-Using-Arrays-Grouping-And-Known-Facts.pdf";
const ESTIMATE_REASONABLENESS_WORKSHEET_FILE =
  "MYL-MATH-NPV-MP-S028-Estimate-And-Check-Reasonableness.pdf";
const UNIT_SIMPLE_FRACTIONS_WORKSHEET_FILE =
  "MYL-MATH-NPV-MP-S029-Recognise-And-Represent-Unit-Fractions-And-Simple-Fractions.pdf";
const PRACTICAL_MONEY_PROBLEMS_WORKSHEET_FILE =
  "MYL-MATH-NPV-MP-S030-Solve-Practical-Number-Problems-Including-Money.pdf";
const EXTEND_PLACE_VALUE_LARGER_NUMBERS_WORKSHEET_FILE =
  "MYL-MATH-NPV-UP-S031-Extend-Place-Value-To-Larger-Numbers.pdf";
const ROUND_ESTIMATE_LARGER_NUMBERS_WORKSHEET_FILE =
  "MYL-MATH-NPV-UP-S032-Round-And-Estimate-With-Larger-Numbers.pdf";
const EXTEND_PLACE_VALUE_DECIMALS_WORKSHEET_FILE =
  "MYL-MATH-NPV-UP-S033-Extend-Place-Value-To-Decimals.pdf";
const COMPARE_ORDER_DECIMALS_WORKSHEET_FILE =
  "MYL-MATH-NPV-UP-S034-Compare-And-Order-Decimals.pdf";
const COMPARE_ORDER_EQUIVALENT_FRACTIONS_WORKSHEET_FILE =
  "MYL-MATH-NPV-UP-S035-Compare-Order-And-Generate-Equivalent-Fractions.pdf";
const ADD_SUBTRACT_FRACTIONS_RELATED_DENOMINATORS_WORKSHEET_FILE =
  "MYL-MATH-NPV-UP-S036-Add-And-Subtract-Fractions-With-Related-Denominators.pdf";
const MULTIPLY_DIVIDE_LARGER_WHOLE_NUMBERS_WORKSHEET_FILE =
  "MYL-MATH-NPV-UP-S037-Multiply-And-Divide-Larger-Whole-Numbers-Using-Efficient-Strategies.pdf";
const INTERPRET_REMAINDERS_CONTEXT_WORKSHEET_FILE =
  "MYL-MATH-NPV-UP-S038-Interpret-Remainders-In-Context.pdf";
const CONNECT_FRACTIONS_DECIMALS_PERCENTAGES_WORKSHEET_FILE =
  "MYL-MATH-NPV-UP-S039-Connect-Fractions-Decimals-And-Percentages.pdf";
const MATHEMATICAL_MODELLING_FINANCIAL_CONTEXTS_WORKSHEET_FILE =
  "MYL-MATH-NPV-UP-S040-Use-Mathematical-Modelling-In-Financial-And-Real-World-Contexts.pdf";
const WORK_FLUENTLY_INTEGER_DECIMAL_FRACTION_PERCENTAGE_WORKSHEET_FILE =
  "MYL-MATH-NPV-LS-S041-Work-Fluently-With-Integers-Decimals-Fractions-And-Percentages.pdf";
const UNDERSTAND_NEGATIVE_NUMBERS_NUMBER_LINES_WORKSHEET_FILE =
  "MYL-MATH-NPV-LS-S042-Understand-Negative-Numbers-And-Number-Lines.pdf";
const USE_INDEX_NOTATION_POWERS_ROOTS_WORKSHEET_FILE =
  "MYL-MATH-NPV-LS-S044-Use-Index-Notation-Powers-And-Roots.pdf";
const WORK_WITH_RATIO_RATES_WORKSHEET_FILE =
  "MYL-MATH-NPV-LS-S045-Work-With-Ratio-And-Rates.pdf";
const USE_PROPORTIONAL_REASONING_WORKSHEET_FILE =
  "MYL-MATH-NPV-LS-S046-Use-Proportional-Reasoning.pdf";
const APPLY_ESTIMATION_ROUNDING_BOUNDS_WORKSHEET_FILE =
  "MYL-MATH-NPV-LS-S048-Apply-Estimation-Rounding-And-Bounds.pdf";
const EXPLAIN_CALCULATION_CHOICES_REASONABLENESS_WORKSHEET_FILE =
  "MYL-MATH-NPV-LS-S049-Explain-Calculation-Choices-And-Reasonableness.pdf";
const USE_NUMBER_RELATIONSHIPS_ALGEBRAIC_THINKING_WORKSHEET_FILE =
  "MYL-MATH-NPV-LS-S050-Use-Number-Relationships-To-Support-Algebraic-Thinking.pdf";
const WORK_WITH_STANDARD_FORM_VERY_LARGE_SMALL_NUMBERS_WORKSHEET_FILE =
  "MYL-MATH-NPV-HSF-S051-Work-With-Standard-Form-And-Very-Large-Or-Very-Small-Numbers.pdf";
const USE_POWERS_ROOTS_INDICES_CONTEXT_WORKSHEET_FILE =
  "MYL-MATH-NPV-HSF-S052-Use-Powers-Roots-And-Indices-In-Context.pdf";
const CALCULATE_EXACTLY_FRACTIONS_MULTIPLES_PI_WORKSHEET_FILE =
  "MYL-MATH-NPV-HSF-S053-Calculate-Exactly-With-Fractions-And-Multiples-Of-Pi-Where-Appropriate.pdf";
const WORK_WITH_PERCENTAGE_CHANGE_GROWTH_DECAY_WORKSHEET_FILE =
  "MYL-MATH-NPV-HSF-S054-Work-With-Percentage-Change-Growth-And-Decay.pdf";
const APPLY_RATIO_PROPORTION_RATES_CHANGE_WORKSHEET_FILE =
  "MYL-MATH-NPV-HSF-S055-Apply-Ratio-Proportion-And-Rates-Of-Change.pdf";
const USE_NUMBER_SKILLS_ALGEBRAIC_GRAPHICAL_CONTEXTS_WORKSHEET_FILE =
  "MYL-MATH-NPV-HSF-S056-Use-Number-Skills-In-Algebraic-And-Graphical-Contexts.pdf";
const SOLVE_FINANCIAL_REAL_WORLD_MODELLING_PROBLEMS_WORKSHEET_FILE =
  "MYL-MATH-NPV-HSF-S057-Solve-Financial-And-Real-World-Modelling-Problems.pdf";
const INTERPRET_LIMITS_ACCURACY_ROUNDING_WORKSHEET_FILE =
  "MYL-MATH-NPV-HSF-S058-Interpret-Limits-Of-Accuracy-And-Rounding.pdf";
const SELECT_EFFICIENT_CALCULATION_STRATEGIES_WORKSHEET_FILE =
  "MYL-MATH-NPV-HSF-S059-Select-Efficient-Calculation-Strategies-For-Unfamiliar-Problems.pdf";
const OPERATIONS_ACT_OUT_JOINING_TAKING_AWAY_WORKSHEET_FILE =
  "MYL-MATH-OC-KEE-S001-Act-Out-Joining-And-Taking-Away-In-Everyday-Stories.pdf";
const OPERATIONS_SHARE_COMPARE_DIFFERENCES_WORKSHEET_FILE =
  "MYL-MATH-OC-KEE-S002-Share-Compare-And-Notice-Simple-Differences.pdf";
const OPERATIONS_COUNTING_STRATEGIES_KNOWN_FACTS_WORKSHEET_FILE =
  "MYL-MATH-OC-EE-S003-Use-Counting-Strategies-And-Known-Facts-More-Efficiently.pdf";
const OPERATIONS_PART_WHOLE_ADDITION_SUBTRACTION_WORKSHEET_FILE =
  "MYL-MATH-OC-EE-S004-Use-Part-Whole-Thinking-For-Addition-And-Subtraction.pdf";

export const MATH_WORKSHEET_RESOURCES: MathWorksheetResource[] = [
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::foundation-kindergarten::act-out-joining-and-taking-away-in-everyday-stories",
    stepKey: "act-out-joining-and-taking-away-in-everyday-stories",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Kindergarten / Early Elementary",
    stepNumber: 1,
    pathwayStepTitle: "Act out joining and taking away in everyday stories",
    title: "Act Out Joining And Taking Away In Everyday Stories",
    concept:
      "Use objects, pictures and number sentences to act out joining and taking away in everyday stories.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_ACT_OUT_JOINING_TAKING_AWAY_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/kindergarten-early-elementary/${OPERATIONS_ACT_OUT_JOINING_TAKING_AWAY_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::foundation-kindergarten::share-compare-and-notice-simple-differences",
    stepKey: "share-compare-and-notice-simple-differences",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Kindergarten / Early Elementary",
    stepNumber: 2,
    pathwayStepTitle: "Share, compare, and notice simple differences",
    title: "Share, Compare, And Notice Simple Differences",
    concept:
      "Share objects equally, compare groups, notice simple differences and solve simple everyday stories.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_SHARE_COMPARE_DIFFERENCES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/kindergarten-early-elementary/${OPERATIONS_SHARE_COMPARE_DIFFERENCES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::lower-primary::use-counting-strategies-and-known-facts-more-efficiently",
    stepKey: "use-counting-strategies-and-known-facts-more-efficiently",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "lower-primary",
    stageDisplay: "Early Elementary",
    stepNumber: 3,
    pathwayStepTitle: "Use counting strategies and known facts more efficiently",
    title: "Use Counting Strategies And Known Facts More Efficiently",
    concept:
      "Use counting-on, counting-back and known facts to solve simple addition and subtraction problems more efficiently.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_COUNTING_STRATEGIES_KNOWN_FACTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/early-elementary/${OPERATIONS_COUNTING_STRATEGIES_KNOWN_FACTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::lower-primary::use-part-whole-thinking-for-addition-and-subtraction",
    stepKey: "use-part-whole-thinking-for-addition-and-subtraction",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "lower-primary",
    stageDisplay: "Early Elementary",
    stepNumber: 4,
    pathwayStepTitle: "Use part-whole thinking for addition and subtraction",
    title: "Use Part-Whole Thinking For Addition And Subtraction",
    concept:
      "Use part-whole models to connect addition and subtraction, find missing parts, and solve simple story problems.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_PART_WHOLE_ADDITION_SUBTRACTION_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/early-elementary/${OPERATIONS_PART_WHOLE_ADDITION_SUBTRACTION_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::recognise-small-quantities-without-counting",
    stepKey: "recognise-small-quantities-without-counting",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 1,
    pathwayStepTitle: "Recognise small quantities without counting",
    title: "Recognise Small Quantities Without Counting",
    fileName: SMALL_QUANTITIES_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/foundation/${SMALL_QUANTITIES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::match-spoken-number-names-to-quantities",
    stepKey: "match-spoken-number-names-to-quantities",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 2,
    pathwayStepTitle: "Match spoken number names to quantities",
    title: "Match Number Words to Groups",
    curriculumCode: "AC9MFN02",
    concept: "Match spoken number names to quantities",
    fileName: NUMBER_WORDS_TO_GROUPS_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/foundation/${NUMBER_WORDS_TO_GROUPS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::identify-numerals-0-10",
    stepKey: "identify-numerals-0-10",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 3,
    pathwayStepTitle: "Identify numerals 0-10",
    title: "Identify Numerals 0 to 10",
    concept: "Recognise numerals from 0 to 10",
    fileName: IDENTIFY_NUMERALS_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/foundation/${IDENTIFY_NUMERALS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::count-objects-accurately-to-10",
    stepKey: "count-objects-accurately-to-10",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 4,
    pathwayStepTitle: "Count objects accurately to 10",
    title: "Count Objects to 10",
    concept: "Count objects accurately to 10",
    fileName: COUNT_OBJECTS_TO_10_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/foundation/${COUNT_OBJECTS_TO_10_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::count-objects-accurately-to-20",
    stepKey: "count-objects-accurately-to-20",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 5,
    pathwayStepTitle: "Count objects accurately to 20",
    title: "Count Objects to 20",
    concept: "Count objects accurately to 20",
    fileName: COUNT_OBJECTS_TO_20_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/foundation/${COUNT_OBJECTS_TO_20_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::compare-groups-as-more-fewer-or-same",
    stepKey: "compare-groups-as-more-fewer-or-same",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 6,
    pathwayStepTitle: "Compare groups as more, fewer or same",
    title: "Compare Groups: More, Fewer or Same",
    concept: "Compare groups as more, fewer or the same",
    fileName: COMPARE_GROUPS_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/foundation/${COMPARE_GROUPS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::order-numbers-in-a-short-sequence",
    stepKey: "order-numbers-in-a-short-sequence",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 7,
    pathwayStepTitle: "Order numbers in a short sequence",
    title: "Order Numbers in a Short Sequence",
    concept: "Order numbers in a short sequence",
    fileName: ORDER_NUMBERS_SEQUENCE_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/foundation/${ORDER_NUMBERS_SEQUENCE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::partition-and-combine-small-collections-up-to-10",
    stepKey: "partition-and-combine-small-collections-up-to-10",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 8,
    pathwayStepTitle: "Partition and combine small collections up to 10",
    title: "Partition and Combine Small Collections up to 10",
    concept: "Partition and combine small collections up to 10",
    fileName: PARTITION_COMBINE_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/foundation/${PARTITION_COMBINE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::represent-simple-addition-and-subtraction-stories-with-objects",
    stepKey: "represent-simple-addition-and-subtraction-stories-with-objects",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 9,
    pathwayStepTitle: "Represent simple addition and subtraction stories with objects",
    title: "Represent Addition and Subtraction Stories with Objects",
    concept: "Use objects to represent simple addition and subtraction stories",
    fileName: OBJECT_STORIES_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/foundation/${OBJECT_STORIES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::share-small-collections-equally",
    stepKey: "share-small-collections-equally",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 10,
    pathwayStepTitle: "Share small collections equally",
    title: "Share Small Collections Equally",
    concept: "Share small collections equally into groups",
    fileName: SHARE_EQUALLY_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/foundation/${SHARE_EQUALLY_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::count-forwards-and-backwards-within-100-or-120",
    stepKey: "count-forwards-and-backwards-within-100-or-120",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 11,
    pathwayStepTitle: "Count forwards and backwards within 100 or 120",
    title: "Count Forwards and Backwards",
    concept: "Count forwards and backwards within 120",
    includesAnswerSheet: true,
    fileName: COUNT_FORWARDS_BACKWARDS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${COUNT_FORWARDS_BACKWARDS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::read-write-and-order-numbers-to-100-or-120",
    stepKey: "read-write-and-order-numbers-to-100-or-120",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 12,
    pathwayStepTitle: "Read, write and order numbers to 100 or 120",
    title: "Read, Write and Order Numbers to 100 or 120",
    concept: "Read, write and order numbers to 100 or 120",
    includesAnswerSheet: true,
    fileName: READ_WRITE_ORDER_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${READ_WRITE_ORDER_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::skip-count-by-2s-5s-and-10s",
    stepKey: "skip-count-by-2s-5s-and-10s",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 13,
    pathwayStepTitle: "Skip count by 2s, 5s and 10s",
    title: "Skip Count by 2s, 5s and 10s",
    concept: "Skip count by 2s, 5s and 10s",
    includesAnswerSheet: true,
    fileName: SKIP_COUNT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${SKIP_COUNT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::understand-that-ten-ones-make-one-ten",
    stepKey: "understand-that-ten-ones-make-one-ten",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 14,
    pathwayStepTitle: "Understand that ten ones make one ten",
    title: "Understand that Ten Ones Make One Ten",
    concept: "Understand that 10 ones can be grouped as 1 ten",
    includesAnswerSheet: false,
    fileName: TEN_ONES_MAKE_TEN_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${TEN_ONES_MAKE_TEN_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::partition-two-digit-numbers-into-tens-and-ones",
    stepKey: "partition-two-digit-numbers-into-tens-and-ones",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 15,
    pathwayStepTitle: "Partition two-digit numbers into tens and ones",
    title: "Partition Two-Digit Numbers into Tens and Ones",
    concept: "Partition two-digit numbers into tens and ones",
    includesAnswerSheet: false,
    fileName: PARTITION_TWO_DIGIT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${PARTITION_TWO_DIGIT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::rename-two-digit-numbers-in-different-ways",
    stepKey: "rename-two-digit-numbers-in-different-ways",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 16,
    pathwayStepTitle: "Rename two-digit numbers in different ways",
    title: "Rename Two-Digit Numbers in Different Ways",
    concept: "Rename two-digit numbers using different tens-and-ones combinations",
    includesAnswerSheet: false,
    fileName: RENAME_TWO_DIGIT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${RENAME_TWO_DIGIT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::add-and-subtract-within-20-using-known-facts",
    stepKey: "add-and-subtract-within-20-using-known-facts",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 17,
    pathwayStepTitle: "Add and subtract within 20 using known facts",
    title: "Add and Subtract Within 20 Using Known Facts",
    concept: "Use known facts to add and subtract within 20",
    includesAnswerSheet: false,
    fileName: ADD_SUBTRACT_WITHIN_20_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${ADD_SUBTRACT_WITHIN_20_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::add-and-subtract-one-and-two-digit-numbers-with-support",
    stepKey: "add-and-subtract-one-and-two-digit-numbers-with-support",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 18,
    pathwayStepTitle: "Add and subtract one- and two-digit numbers with support",
    title: "Add and Subtract One- and Two-Digit Numbers",
    concept: "Add and subtract one- and two-digit numbers using visual support",
    includesAnswerSheet: false,
    fileName: ADD_SUBTRACT_WITH_SUPPORT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${ADD_SUBTRACT_WITH_SUPPORT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::understand-simple-equal-groups-and-arrays",
    stepKey: "understand-simple-equal-groups-and-arrays",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 19,
    pathwayStepTitle: "Understand simple equal groups and arrays",
    title: "Understand Simple Equal Groups and Arrays",
    concept: "Recognise equal groups and simple arrays as structured collections",
    includesAnswerSheet: false,
    fileName: EQUAL_GROUPS_ARRAYS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${EQUAL_GROUPS_ARRAYS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::begin-halves-quarters-and-simple-sharing",
    stepKey: "begin-halves-quarters-and-simple-sharing",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 20,
    pathwayStepTitle: "Begin halves, quarters and simple sharing",
    title: "Begin Halves, Quarters and Simple Sharing",
    concept: "Recognise halves and quarters and share small collections equally",
    includesAnswerSheet: false,
    fileName: HALVES_QUARTERS_SHARING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${HALVES_QUARTERS_SHARING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::read-write-order-and-compare-numbers-to-1000-and-beyond",
    stepKey: "read-write-order-and-compare-numbers-to-1000-and-beyond",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 21,
    pathwayStepTitle: "Read, write, order and compare numbers to 1000 and beyond",
    title: "Read, Write, Order and Compare Numbers to 1000 and Beyond",
    concept: "Read, write, order and compare numbers to 1000 and beyond",
    includesAnswerSheet: false,
    fileName: READ_WRITE_ORDER_COMPARE_1000_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/middle-primary/${READ_WRITE_ORDER_COMPARE_1000_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::understand-hundreds-tens-and-ones",
    stepKey: "understand-hundreds-tens-and-ones",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 22,
    pathwayStepTitle: "Understand hundreds, tens and ones",
    title: "Understand Hundreds, Tens and Ones",
    concept: "Understand and represent three-digit numbers using hundreds, tens and ones",
    includesAnswerSheet: false,
    fileName: HUNDREDS_TENS_ONES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/middle-primary/${HUNDREDS_TENS_ONES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::partition-and-regroup-two-and-three-digit-numbers",
    stepKey: "partition-and-regroup-two-and-three-digit-numbers",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 23,
    pathwayStepTitle: "Partition and regroup two- and three-digit numbers",
    title: "Partition and Regroup Two- and Three-Digit Numbers",
    concept: "Partition and regroup two- and three-digit numbers using hundreds, tens and ones",
    includesAnswerSheet: false,
    fileName: PARTITION_REGROUP_TWO_THREE_DIGIT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/middle-primary/${PARTITION_REGROUP_TWO_THREE_DIGIT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::use-zero-as-a-placeholder",
    stepKey: "use-zero-as-a-placeholder",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 24,
    pathwayStepTitle: "Use zero as a placeholder",
    title: "Use Zero as a Placeholder",
    concept: "Use zero as a placeholder in hundreds, tens and ones place-value numbers",
    includesAnswerSheet: false,
    fileName: ZERO_PLACEHOLDER_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/middle-primary/${ZERO_PLACEHOLDER_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::add-and-subtract-two-and-three-digit-numbers-using-place-value",
    stepKey: "add-and-subtract-two-and-three-digit-numbers-using-place-value",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 25,
    pathwayStepTitle: "Add and subtract two- and three-digit numbers using place value",
    title: "Add and Subtract Two- and Three-Digit Numbers Using Place Value",
    concept: "Use place value to add and subtract two- and three-digit numbers",
    includesAnswerSheet: false,
    fileName: ADD_SUBTRACT_PLACE_VALUE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/middle-primary/${ADD_SUBTRACT_PLACE_VALUE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::recall-and-apply-multiplication-facts",
    stepKey: "recall-and-apply-multiplication-facts",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 26,
    pathwayStepTitle: "Recall and apply multiplication facts",
    title: "Recall and Apply Multiplication Facts",
    concept: "Recall and apply multiplication facts in equations, groups and word problems",
    includesAnswerSheet: false,
    fileName: MULTIPLICATION_FACTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/middle-primary/${MULTIPLICATION_FACTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::multiply-and-divide-using-arrays-grouping-and-known-facts",
    stepKey: "multiply-and-divide-using-arrays-grouping-and-known-facts",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 27,
    pathwayStepTitle: "Multiply and divide using arrays, grouping and known facts",
    title: "Multiply and Divide Using Arrays, Grouping and Known Facts",
    concept: "Use arrays, equal groups and known facts to multiply and divide",
    includesAnswerSheet: false,
    fileName: MULTIPLY_DIVIDE_ARRAYS_GROUPING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/middle-primary/${MULTIPLY_DIVIDE_ARRAYS_GROUPING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::estimate-and-check-reasonableness",
    stepKey: "estimate-and-check-reasonableness",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 28,
    pathwayStepTitle: "Estimate and check reasonableness",
    title: "Estimate and Check Reasonableness",
    concept: "Estimate using rounding and check whether exact answers are reasonable",
    includesAnswerSheet: false,
    fileName: ESTIMATE_REASONABLENESS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/middle-primary/${ESTIMATE_REASONABLENESS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::recognise-and-represent-unit-fractions-and-simple-fractions",
    stepKey: "recognise-and-represent-unit-fractions-and-simple-fractions",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 29,
    pathwayStepTitle: "Recognise and represent unit fractions and simple fractions",
    title: "Recognise and Represent Unit Fractions and Simple Fractions",
    concept:
      "Recognise, write and represent unit fractions and simple fractions using shaded shapes and fraction words",
    includesAnswerSheet: false,
    fileName: UNIT_SIMPLE_FRACTIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/middle-primary/${UNIT_SIMPLE_FRACTIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::solve-practical-number-problems-including-money",
    stepKey: "solve-practical-number-problems-including-money",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 30,
    pathwayStepTitle: "Solve practical number problems including money",
    title: "Solve Practical Number Problems Including Money",
    concept:
      "Solve practical number problems involving money, totals, change and multi-step contexts",
    includesAnswerSheet: false,
    regionalVariants: ["US", "AU"],
    containsRegionalMoneyPages: true,
    fileName: PRACTICAL_MONEY_PROBLEMS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/middle-primary/${PRACTICAL_MONEY_PROBLEMS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::upper-primary::extend-place-value-to-larger-numbers",
    stepKey: "extend-place-value-to-larger-numbers",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 31,
    pathwayStepTitle: "Extend place value to larger numbers",
    title: "Extend Place Value to Larger Numbers",
    concept:
      "Read, write, compare, round and build larger numbers using extended place value",
    includesAnswerSheet: false,
    fileName: EXTEND_PLACE_VALUE_LARGER_NUMBERS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/upper-primary/${EXTEND_PLACE_VALUE_LARGER_NUMBERS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::upper-primary::round-and-estimate-with-larger-numbers",
    stepKey: "round-and-estimate-with-larger-numbers",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 32,
    pathwayStepTitle: "Round and estimate with larger numbers",
    title: "Round and Estimate with Larger Numbers",
    concept:
      "Round larger numbers to different place values and use estimation to solve and check problems",
    includesAnswerSheet: false,
    fileName: ROUND_ESTIMATE_LARGER_NUMBERS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/upper-primary/${ROUND_ESTIMATE_LARGER_NUMBERS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::upper-primary::extend-place-value-to-decimals",
    stepKey: "extend-place-value-to-decimals",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 33,
    pathwayStepTitle: "Extend place value to decimals",
    title: "Extend Place Value to Decimals",
    concept: "Read, partition, compare, order and solve problems using decimals",
    includesAnswerSheet: false,
    fileName: EXTEND_PLACE_VALUE_DECIMALS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/upper-primary/${EXTEND_PLACE_VALUE_DECIMALS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::upper-primary::compare-and-order-decimals",
    stepKey: "compare-and-order-decimals",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 34,
    pathwayStepTitle: "Compare and order decimals",
    title: "Compare and Order Decimals",
    concept: "Compare decimals, order decimals and solve decimal comparison problems",
    includesAnswerSheet: false,
    fileName: COMPARE_ORDER_DECIMALS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/upper-primary/${COMPARE_ORDER_DECIMALS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::upper-primary::compare-order-and-generate-equivalent-fractions",
    stepKey: "compare-order-and-generate-equivalent-fractions",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 35,
    pathwayStepTitle: "Compare, order and generate equivalent fractions",
    title: "Compare, Order and Generate Equivalent Fractions",
    concept:
      "Compare, order and generate equivalent fractions using fraction notation and simple fraction reasoning",
    includesAnswerSheet: false,
    fileName: COMPARE_ORDER_EQUIVALENT_FRACTIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/upper-primary/${COMPARE_ORDER_EQUIVALENT_FRACTIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::upper-primary::add-and-subtract-fractions-with-related-denominators",
    stepKey: "add-and-subtract-fractions-with-related-denominators",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 36,
    pathwayStepTitle: "Add and subtract fractions with related denominators",
    title: "Add and Subtract Fractions with Related Denominators",
    concept:
      "Add and subtract fractions with related denominators, simplify answers, and solve fraction word problems",
    includesAnswerSheet: false,
    fileName: ADD_SUBTRACT_FRACTIONS_RELATED_DENOMINATORS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/upper-primary/${ADD_SUBTRACT_FRACTIONS_RELATED_DENOMINATORS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::upper-primary::multiply-and-divide-larger-whole-numbers-using-efficient-strategies",
    stepKey: "multiply-and-divide-larger-whole-numbers-using-efficient-strategies",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 37,
    pathwayStepTitle: "Multiply and divide larger whole numbers using efficient strategies",
    title: "Multiply and Divide Larger Whole Numbers Using Efficient Strategies",
    concept:
      "Use efficient strategies such as partitioning, known facts, place value and grouping to multiply and divide larger whole numbers",
    includesAnswerSheet: false,
    fileName: MULTIPLY_DIVIDE_LARGER_WHOLE_NUMBERS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/upper-primary/${MULTIPLY_DIVIDE_LARGER_WHOLE_NUMBERS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::upper-primary::interpret-remainders-in-context",
    stepKey: "interpret-remainders-in-context",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 38,
    pathwayStepTitle: "Interpret remainders in context",
    title: "Interpret Remainders in Context",
    concept:
      "Solve division problems with remainders and interpret what the remainder means in real-world contexts",
    includesAnswerSheet: false,
    fileName: INTERPRET_REMAINDERS_CONTEXT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/upper-primary/${INTERPRET_REMAINDERS_CONTEXT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::upper-primary::connect-fractions-decimals-and-percentages",
    stepKey: "connect-fractions-decimals-and-percentages",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 39,
    pathwayStepTitle: "Connect fractions, decimals and percentages",
    title: "Connect Fractions, Decimals and Percentages",
    concept:
      "Connect equivalent fractions, decimals and percentages using tables, visual models and real-world problems",
    includesAnswerSheet: false,
    fileName: CONNECT_FRACTIONS_DECIMALS_PERCENTAGES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/upper-primary/${CONNECT_FRACTIONS_DECIMALS_PERCENTAGES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::upper-primary::use-mathematical-modelling-in-financial-and-real-world-contexts",
    stepKey: "use-mathematical-modelling-in-financial-and-real-world-contexts",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 40,
    pathwayStepTitle: "Use mathematical modelling in financial and real-world contexts",
    title: "Use Mathematical Modelling in Financial and Real-World Contexts",
    concept:
      "Use mathematical models such as tables, diagrams and equations to solve financial and real-world problems",
    includesAnswerSheet: false,
    fileName: MATHEMATICAL_MODELLING_FINANCIAL_CONTEXTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/upper-primary/${MATHEMATICAL_MODELLING_FINANCIAL_CONTEXTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-secondary::work-fluently-with-integers-decimals-fractions-and-percentages",
    stepKey: "work-fluently-with-integers-decimals-fractions-and-percentages",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 41,
    pathwayStepTitle: "Work fluently with integers, decimals, fractions and percentages",
    title: "Work Fluently with Integers, Decimals, Fractions and Percentages",
    concept:
      "Use integers, decimals, fractions and percentages flexibly, convert between forms, compare values and choose the most useful form for a situation",
    includesAnswerSheet: false,
    fileName: WORK_FLUENTLY_INTEGER_DECIMAL_FRACTION_PERCENTAGE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-secondary/${WORK_FLUENTLY_INTEGER_DECIMAL_FRACTION_PERCENTAGE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-secondary::understand-negative-numbers-and-number-lines",
    stepKey: "understand-negative-numbers-and-number-lines",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 42,
    pathwayStepTitle: "Understand negative numbers and number lines",
    title: "Understand Negative Numbers and Number Lines",
    concept:
      "Use negative numbers and number lines to reason about direction, comparison and real-world contexts below zero",
    includesAnswerSheet: false,
    fileName: UNDERSTAND_NEGATIVE_NUMBERS_NUMBER_LINES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-secondary/${UNDERSTAND_NEGATIVE_NUMBERS_NUMBER_LINES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-secondary::use-index-notation-powers-and-roots",
    stepKey: "use-index-notation-powers-and-roots",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 44,
    pathwayStepTitle: "Use index notation, powers and roots",
    title: "Use Index Notation, Powers and Roots",
    concept:
      "Use index notation to represent repeated multiplication, evaluate powers, find square roots and connect powers and roots as inverse operations",
    includesAnswerSheet: false,
    fileName: USE_INDEX_NOTATION_POWERS_ROOTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-secondary/${USE_INDEX_NOTATION_POWERS_ROOTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-secondary::work-with-ratio-and-rates",
    stepKey: "work-with-ratio-and-rates",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 45,
    pathwayStepTitle: "Work with ratio and rates",
    title: "Work with Ratio and Rates",
    concept:
      "Compare quantities multiplicatively, simplify and generate equivalent ratios, and use rates in meaningful real-world contexts",
    includesAnswerSheet: false,
    fileName: WORK_WITH_RATIO_RATES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-secondary/${WORK_WITH_RATIO_RATES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-secondary::use-proportional-reasoning",
    stepKey: "use-proportional-reasoning",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 46,
    pathwayStepTitle: "Use proportional reasoning",
    title: "Use Proportional Reasoning",
    concept:
      "Scale quantities up or down, compare fairly using unit rates, and reason about equivalent proportional relationships",
    includesAnswerSheet: false,
    fileName: USE_PROPORTIONAL_REASONING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-secondary/${USE_PROPORTIONAL_REASONING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-secondary::apply-estimation-rounding-and-bounds",
    stepKey: "apply-estimation-rounding-and-bounds",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 48,
    pathwayStepTitle: "Apply estimation, rounding and bounds",
    title: "Apply Estimation, Rounding and Bounds",
    concept:
      "Use approximation, rounding and lower/upper bounds to judge answers sensibly and reason about limits of accuracy",
    includesAnswerSheet: false,
    fileName: APPLY_ESTIMATION_ROUNDING_BOUNDS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-secondary/${APPLY_ESTIMATION_ROUNDING_BOUNDS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-secondary::explain-calculation-choices-and-reasonableness",
    stepKey: "explain-calculation-choices-and-reasonableness",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 49,
    pathwayStepTitle: "Explain calculation choices and reasonableness",
    title: "Explain Calculation Choices and Reasonableness",
    concept:
      "Choose, explain and compare calculation strategies, then judge whether answers are reasonable in context",
    includesAnswerSheet: false,
    fileName: EXPLAIN_CALCULATION_CHOICES_REASONABLENESS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-secondary/${EXPLAIN_CALCULATION_CHOICES_REASONABLENESS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-secondary::use-number-relationships-to-support-algebraic-thinking",
    stepKey: "use-number-relationships-to-support-algebraic-thinking",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 50,
    pathwayStepTitle: "Use number relationships to support algebraic thinking",
    title: "Use Number Relationships to Support Algebraic Thinking",
    concept:
      "Use number patterns, rules, tables and nth-term relationships to support early algebraic reasoning",
    includesAnswerSheet: false,
    fileName: USE_NUMBER_RELATIONSHIPS_ALGEBRAIC_THINKING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-secondary/${USE_NUMBER_RELATIONSHIPS_ALGEBRAIC_THINKING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::work-with-standard-form-and-very-large-or-very-small-numbers",
    stepKey: "work-with-standard-form-and-very-large-or-very-small-numbers",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 51,
    pathwayStepTitle:
      "Work with standard form and very large or very small numbers",
    title: "Work With Standard Form And Very Large Or Very Small Numbers",
    concept:
      "Use and interpret numbers written in standard form, including very large and very small numbers.",
    includesAnswerSheet: false,
    fileName: WORK_WITH_STANDARD_FORM_VERY_LARGE_SMALL_NUMBERS_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/high-school-foundations/${WORK_WITH_STANDARD_FORM_VERY_LARGE_SMALL_NUMBERS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::use-powers-roots-and-indices-in-context",
    stepKey: "use-powers-roots-and-indices-in-context",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 52,
    pathwayStepTitle: "Use powers, roots and indices in context",
    title: "Use Powers, Roots And Indices In Context",
    concept:
      "Apply index laws, powers and roots to simplify expressions and solve real-world problems.",
    includesAnswerSheet: false,
    fileName: USE_POWERS_ROOTS_INDICES_CONTEXT_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/high-school-foundations/${USE_POWERS_ROOTS_INDICES_CONTEXT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::calculate-exactly-with-fractions-and-multiples-of-pi-where-appropriate",
    stepKey:
      "calculate-exactly-with-fractions-and-multiples-of-pi-where-appropriate",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 53,
    pathwayStepTitle:
      "Calculate exactly with fractions and multiples of pi where appropriate",
    title: "Calculate Exactly With Fractions And Multiples Of Pi Where Appropriate",
    concept:
      "Calculate exactly using fractions and multiples of pi, leaving answers in simplest exact form where appropriate.",
    includesAnswerSheet: false,
    fileName: CALCULATE_EXACTLY_FRACTIONS_MULTIPLES_PI_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/high-school-foundations/${CALCULATE_EXACTLY_FRACTIONS_MULTIPLES_PI_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::work-with-percentage-change-growth-and-decay",
    stepKey: "work-with-percentage-change-growth-and-decay",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 54,
    pathwayStepTitle: "Work with percentage change, growth and decay",
    title: "Work With Percentage Change, Growth And Decay",
    concept:
      "Solve problems involving percentage increase, decrease, compound growth and compound decay.",
    includesAnswerSheet: false,
    fileName: WORK_WITH_PERCENTAGE_CHANGE_GROWTH_DECAY_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/high-school-foundations/${WORK_WITH_PERCENTAGE_CHANGE_GROWTH_DECAY_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::apply-ratio-proportion-and-rates-of-change",
    stepKey: "apply-ratio-proportion-and-rates-of-change",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 55,
    pathwayStepTitle: "Apply ratio, proportion and rates of change",
    title: "Apply Ratio, Proportion And Rates Of Change",
    concept:
      "Solve problems using ratio, proportion and rates of change in real-life contexts.",
    includesAnswerSheet: false,
    fileName: APPLY_RATIO_PROPORTION_RATES_CHANGE_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/high-school-foundations/${APPLY_RATIO_PROPORTION_RATES_CHANGE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::use-number-skills-in-algebraic-and-graphical-contexts",
    stepKey: "use-number-skills-in-algebraic-and-graphical-contexts",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 56,
    pathwayStepTitle: "Use number skills in algebraic and graphical contexts",
    title: "Use Number Skills In Algebraic And Graphical Contexts",
    concept:
      "Apply number skills to simplify algebraic expressions, solve equations and interpret graphs.",
    includesAnswerSheet: false,
    fileName: USE_NUMBER_SKILLS_ALGEBRAIC_GRAPHICAL_CONTEXTS_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/high-school-foundations/${USE_NUMBER_SKILLS_ALGEBRAIC_GRAPHICAL_CONTEXTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::solve-financial-and-real-world-modelling-problems",
    stepKey: "solve-financial-and-real-world-modelling-problems",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 57,
    pathwayStepTitle: "Solve financial and real-world modelling problems",
    title: "Solve Financial And Real-World Modelling Problems",
    concept:
      "Solve multi-step financial and real-world modelling problems involving money, budgets, best buys, measurement, time and practical decision-making.",
    includesAnswerSheet: false,
    fileName: SOLVE_FINANCIAL_REAL_WORLD_MODELLING_PROBLEMS_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/high-school-foundations/${SOLVE_FINANCIAL_REAL_WORLD_MODELLING_PROBLEMS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::interpret-limits-of-accuracy-and-rounding",
    stepKey: "interpret-limits-of-accuracy-and-rounding",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 58,
    pathwayStepTitle: "Interpret limits of accuracy and rounding",
    title: "Interpret Limits Of Accuracy And Rounding",
    concept:
      "Solve problems involving limits of accuracy, estimates and rounding in real-life contexts.",
    includesAnswerSheet: false,
    fileName: INTERPRET_LIMITS_ACCURACY_ROUNDING_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/high-school-foundations/${INTERPRET_LIMITS_ACCURACY_ROUNDING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::select-efficient-calculation-strategies-for-unfamiliar-problems",
    stepKey: "select-efficient-calculation-strategies-for-unfamiliar-problems",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 59,
    pathwayStepTitle:
      "Select efficient calculation strategies for unfamiliar problems",
    title: "Select Efficient Calculation Strategies For Unfamiliar Problems",
    concept:
      "Choose and use efficient calculation strategies for unfamiliar problems, explaining strategy choice clearly.",
    includesAnswerSheet: false,
    fileName: SELECT_EFFICIENT_CALCULATION_STRATEGIES_WORKSHEET_FILE,
    href: `/worksheets/mathematics/number-place-value/high-school-foundations/${SELECT_EFFICIENT_CALCULATION_STRATEGIES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function getWorksheetResourceForPathwayStep(
  context: MathWorksheetStepContext,
): MathWorksheetResource | null {
  const pathwayStepId = safe(context.pathwayStepId);
  const stepKey = safe(context.stepKey);
  const subjectKey = safe(context.subjectKey);
  const strandKey = safe(context.strandKey);
  const stageKey = safe(context.stageKey);

  return (
    MATH_WORKSHEET_RESOURCES.find((resource) => {
      if (pathwayStepId && resource.pathwayStepId === pathwayStepId) {
        return true;
      }

      return (
        Boolean(stepKey) &&
        resource.stepKey === stepKey &&
        resource.subjectKey === subjectKey &&
        resource.strandKey === strandKey &&
        resource.stageKey === stageKey
      );
    }) ?? null
  );
}
