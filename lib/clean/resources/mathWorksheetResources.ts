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
const OPERATIONS_EQUAL_GROUPS_REPEATED_ADDITION_WORKSHEET_FILE =
  "MYL-MATH-OC-EE-S005-Model-Equal-Groups-And-Repeated-Addition.pdf";
const OPERATIONS_MULTIPLICATION_DIVISION_GROUPING_SHARING_WORKSHEET_FILE =
  "MYL-MATH-OC-EE-S006-Connect-Multiplication-And-Division-Through-Grouping-And-Sharing.pdf";
const OPERATIONS_WRITTEN_METHODS_MENTAL_STRATEGIES_WORKSHEET_FILE =
  "MYL-MATH-OC-EE-S007-Use-Written-Methods-And-Mental-Strategies-Flexibly.pdf";
const OPERATIONS_ESTIMATE_MULTI_STEP_PROBLEMS_WORKSHEET_FILE =
  "MYL-MATH-OC-EE-S008-Estimate-And-Solve-Multi-Step-Practical-Problems.pdf";
const OPERATIONS_EFFICIENT_STRATEGIES_NUMBER_FORMS_WORKSHEET_FILE =
  "MYL-MATH-OC-EE-S009-Choose-Efficient-Strategies-Across-Different-Number-Forms.pdf";
const OPERATIONS_RICHER_PRACTICAL_REASONING_WORKSHEET_FILE =
  "MYL-MATH-OC-EE-S010-Apply-Calculation-To-Richer-Practical-Reasoning.pdf";
const OPERATIONS_ALGEBRAIC_FINANCIAL_CONTEXTS_WORKSHEET_FILE =
  "MYL-MATH-OC-UE-S011-Use-Operations-Confidently-In-Algebraic-And-Financial-Contexts.pdf";
const OPERATIONS_JUDGEMENT_CHECKING_COMMUNICATION_WORKSHEET_FILE =
  "MYL-MATH-OC-UE-S012-Refine-Judgement-Checking-And-Mathematical-Communication.pdf";
const FDP_RECOGNISE_EQUAL_PARTS_WORKSHEET_FILE =
  "MYL-MATH-FDP-KEE-S001-Recognise-Equal-Parts-In-Real-Objects-And-Sharing-Situations.pdf";
const FDP_USE_HALVES_REAL_WORLD_WORKSHEET_FILE =
  "MYL-MATH-FDP-KEE-S002-Use-Halves-In-Simple-Real-World-Situations.pdf";
const FDP_HALVES_QUARTERS_SIMPLE_FRACTIONS_WORKSHEET_FILE =
  "MYL-MATH-FDP-KEE-S003-Use-Halves-Quarters-And-Simple-Fractions-In-Practical-Tasks.pdf";
const FDP_DESCRIBE_SIMPLE_FRACTION_SITUATIONS_WORKSHEET_FILE =
  "MYL-MATH-FDP-KEE-S004-Describe-Simple-Fraction-Situations-With-Confidence.pdf";
const FDP_REPRESENT_COMPARE_FRACTIONS_VISUAL_MODELS_WORKSHEET_FILE =
  "MYL-MATH-FDP-KEE-S005-Represent-And-Compare-Fractions-With-Visual-Models.pdf";
const FDP_EQUIVALENT_FRACTIONS_ORDER_FAMILIAR_AMOUNTS_WORKSHEET_FILE =
  "MYL-MATH-FDP-KEE-S006-Notice-Equivalent-Fractions-And-Order-Familiar-Amounts.pdf";
const FDP_FRACTIONS_TENTHS_HUNDREDTHS_DECIMALS_WORKSHEET_FILE =
  "MYL-MATH-FDP-EE-S007-Connect-Fractions-To-Tenths-And-Hundredths-As-Decimals.pdf";
const FDP_FRACTION_DECIMAL_PRACTICAL_COMPARISON_WORKSHEET_FILE =
  "MYL-MATH-FDP-EE-S008-Use-Fraction-Decimal-Connections-In-Practical-Comparison.pdf";
const FDP_PERCENTAGES_OUT_OF_100_WORKSHEET_FILE =
  "MYL-MATH-FDP-EE-S009-Understand-Percentages-As-Out-Of-100-Comparisons.pdf";
const FDP_FLEXIBLE_FRACTIONS_DECIMALS_PERCENTAGES_WORKSHEET_FILE =
  "MYL-MATH-FDP-EE-S010-Move-Flexibly-Between-Fractions-Decimals-And-Percentages.pdf";
const FDP_PROPORTIONAL_REASONING_SCALE_RATES_FINANCE_WORKSHEET_FILE =
  "MYL-MATH-FDP-UE-S011-Use-Proportional-Reasoning-In-Scale-Rates-And-Financial-Contexts.pdf";
const FDP_PROPORTIONAL_INFORMATION_DATA_DECISIONS_WORKSHEET_FILE =
  "MYL-MATH-FDP-UE-S012-Interpret-Proportional-Information-In-Data-And-Real-Decisions.pdf";
const APF_SIMPLE_REPEATING_PATTERNS_WORKSHEET_FILE =
  "MYL-MATH-APF-KEE-S001-Notice-And-Continue-Simple-Repeating-Patterns.pdf";
const APF_SORT_OBJECTS_EXPLAIN_RULE_WORKSHEET_FILE =
  "MYL-MATH-APF-KEE-S002-Sort-Objects-And-Explain-The-Rule.pdf";
const APF_GROWING_PATTERNS_DESCRIBE_CHANGE_WORKSHEET_FILE =
  "MYL-MATH-APF-KEE-S003-Continue-Growing-Patterns-And-Describe-The-Change.pdf";
const APF_MISSING_NUMBER_INPUT_OUTPUT_WORKSHEET_FILE =
  "MYL-MATH-APF-KEE-S004-Use-Missing-Number-And-Input-Output-Thinking.pdf";
const APF_TABLES_RULES_NUMBER_PATTERNS_WORKSHEET_FILE =
  "MYL-MATH-APF-KEE-S005-Use-Tables-And-Rules-To-Describe-Number-Patterns.pdf";
const APF_GENERALISE_RULES_EQUIVALENT_RELATIONSHIPS_WORKSHEET_FILE =
  "MYL-MATH-APF-KEE-S006-Generalise-Simple-Rules-And-Equivalent-Relationships.pdf";
const APF_SYMBOLS_LETTERS_UNKNOWN_RULE_WORKSHEET_FILE =
  "MYL-MATH-APF-UEMS-S007-Use-Symbols-Or-Letters-To-Show-An-Unknown-Or-Rule.pdf";
const APF_SIMPLE_EXPRESSIONS_EQUATIONS_WORKSHEET_FILE =
  "MYL-MATH-APF-UEMS-S008-Write-And-Interpret-Simple-Expressions-Or-Equations.pdf";
const APF_BALANCED_EQUATIONS_WORKSHEET_FILE =
  "MYL-MATH-APF-MS-S009-Solve-And-Explain-Equations-As-Balanced-Relationships.pdf";
const APF_TABLES_RULES_GRAPHS_FUNCTIONS_WORKSHEET_FILE =
  "MYL-MATH-APF-MS-S010-Connect-Tables-Rules-And-Graphs-In-Functional-Thinking.pdf";
const APF_ALGEBRA_MODELS_RELATIONSHIPS_WORKSHEET_FILE =
  "MYL-MATH-APF-MS-S011-Use-Algebra-To-Model-Relationships-Efficiently.pdf";
const APF_EXPLANATION_CHECKING_GENERALISING_WORKSHEET_FILE =
  "MYL-MATH-APF-MS-S012-Refine-Explanation-Checking-And-Generalising.pdf";
const MEASUREMENT_COMPARE_ATTRIBUTES_WORKSHEET_FILE =
  "MYL-MATH-MEA-KEE-S001-Compare-Everyday-Attributes-Directly.pdf";
const MEASUREMENT_TIME_MONEY_LANGUAGE_WORKSHEET_FILE =
  "MYL-MATH-MEA-KEE-S002-Use-Everyday-Time-And-Money-Language-In-Context.pdf";
const MEASUREMENT_INFORMAL_STANDARD_UNITS_WORKSHEET_FILE =
  "MYL-MATH-MEA-EE-S003-Measure-With-Informal-And-Early-Standard-Units.pdf";
const MEASUREMENT_FAMILIAR_TIME_MONEY_MEASURES_WORKSHEET_FILE =
  "MYL-MATH-MEA-EE-S004-Read-And-Use-Familiar-Time-And-Money-Measures.pdf";
const MEASUREMENT_STANDARD_UNITS_TOOLS_WORKSHEET_FILE =
  "MYL-MATH-MEA-EE-S005-Choose-Suitable-Standard-Units-And-Measuring-Tools.pdf";
const MEASUREMENT_ESTIMATE_CHECK_WORKSHEET_FILE =
  "MYL-MATH-MEA-EE-S006-Estimate-And-Check-Practical-Measurements.pdf";
const MEASUREMENT_CALCULATIONS_PRACTICAL_TASKS_WORKSHEET_FILE =
  "MYL-MATH-MEA-UE-S007-Use-Measurement-Calculations-In-Practical-Tasks.pdf";
const MEASUREMENT_FRACTIONS_DECIMALS_CONVERSIONS_WORKSHEET_FILE =
  "MYL-MATH-MEA-UE-S008-Use-Fractions-Decimals-And-Conversions-In-Measurement.pdf";
const MEASUREMENT_PRECISION_CONVERSIONS_WORKSHEET_FILE =
  "MYL-MATH-MEA-UE-S009-Choose-Precision-And-Conversions-Purposefully.pdf";
const MEASUREMENT_DESIGN_SCIENCE_CONTEXTS_WORKSHEET_FILE =
  "MYL-MATH-MEA-UE-S010-Apply-Measurement-Reasoning-In-Design-And-Science-Contexts.pdf";
const MEASUREMENT_MODELLING_DESIGN_WORKSHEET_FILE =
  "MYL-MATH-MEA-UE-S011-Use-Measurement-Confidently-In-Modelling-And-Design.pdf";
const MEASUREMENT_REASONABLENESS_ACCURACY_WORKSHEET_FILE =
  "MYL-MATH-MEA-UE-S012-Refine-Judgement-About-Reasonableness-And-Accuracy.pdf";
const GSR_RECOGNISE_FAMILIAR_SHAPES_WORKSHEET_FILE =
  "MYL-MATH-GSR-KEE-S001-Recognise-Familiar-Shapes-In-Everyday-Life.pdf";
const GSR_POSITION_DIRECTION_LANGUAGE_WORKSHEET_FILE =
  "MYL-MATH-GSR-KEE-S002-Use-Position-And-Direction-Language-In-Practical-Movement.pdf";
const GSR_SHAPE_FEATURES_SIMPLE_SYMMETRY_WORKSHEET_FILE =
  "MYL-MATH-GSR-KEE-S003-Describe-Shape-Features-And-Simple-Symmetry.pdf";
const GSR_SIMPLE_ROUTES_ARRANGEMENTS_WORKSHEET_FILE =
  "MYL-MATH-GSR-KEE-S004-Follow-And-Create-Simple-Routes-Or-Arrangements.pdf";
const GSR_CLASSIFY_SHAPES_PROPERTIES_WORKSHEET_FILE =
  "MYL-MATH-GSR-KEE-S005-Classify-Shapes-And-Reason-About-Properties.pdf";
const GSR_GRIDS_COORDINATES_TRANSFORMATIONS_WORKSHEET_FILE =
  "MYL-MATH-GSR-EE-S006-Use-Grids-Coordinates-And-Simple-Transformations.pdf";
const GSR_ANGLES_TURNS_ORIENTATION_WORKSHEET_FILE =
  "MYL-MATH-GSR-EE-S007-Use-Angles-Turns-And-Orientation-Meaningfully.pdf";
const GSR_VISUALISE_BUILD_2D_3D_WORKSHEET_FILE =
  "MYL-MATH-GSR-UE-S008-Visualise-And-Build-Shapes-In-Two-And-Three-Dimensions.pdf";
const GSR_GEOMETRIC_RELATIONSHIPS_TRANSFORMATIONS_WORKSHEET_FILE =
  "MYL-MATH-GSR-UE-S009-Reason-About-Geometric-Relationships-And-Transformations.pdf";
const GSR_SPATIAL_REASONING_DESIGN_MAPPING_LAYOUT_WORKSHEET_FILE =
  "MYL-MATH-GSR-UE-S010-Apply-Spatial-Reasoning-In-Design-Mapping-And-Layout.pdf";
const GSR_GEOMETRY_MODEL_INTERPRET_SPACE_WORKSHEET_FILE =
  "MYL-MATH-GSR-UE-S011-Use-Geometry-To-Model-And-Interpret-Space.pdf";
const GSR_REFINE_SPATIAL_JUDGEMENT_EXPLANATION_WORKSHEET_FILE =
  "MYL-MATH-GSR-UE-S012-Refine-Spatial-Judgement-And-Explanation.pdf";
const FINANCIAL_MONEY_SIMPLE_EXCHANGE_WORKSHEET_FILE =
  "MYL-MATH-FRM-KEE-S001-Recognise-Money-And-Simple-Exchange-In-Play.pdf";
const FINANCIAL_WANTS_NEEDS_CHOICES_WORKSHEET_FILE =
  "MYL-MATH-FRM-KEE-S002-Compare-Simple-Wants-Needs-And-Choices.pdf";
const FINANCIAL_MONEY_AMOUNTS_PRACTICAL_TASKS_WORKSHEET_FILE =
  "MYL-MATH-FRM-EE-S003-Use-Money-Amounts-In-Simple-Practical-Tasks.pdf";
const FINANCIAL_SAVING_SPENDING_CHOOSING_WORKSHEET_FILE =
  "MYL-MATH-FRM-EE-S004-Talk-About-Saving-Spending-And-Choosing.pdf";
const FINANCIAL_SIMPLE_BUDGETS_SPENDING_CHOICES_WORKSHEET_FILE =
  "MYL-MATH-FRM-MP-S005-Plan-Simple-Budgets-And-Spending-Choices.pdf";
const FINANCIAL_COMPARE_VALUE_CHANGE_WORKSHEET_FILE =
  "MYL-MATH-FRM-UE-S006-Compare-Value-And-Change-In-Practical-Situations.pdf";
const FINANCIAL_PERCENTAGES_COMPARISONS_SHOPPING_WORKSHEET_FILE =
  "MYL-MATH-FRM-UE-S007-Use-Percentages-And-Comparisons-In-Shopping-Decisions.pdf";
const FINANCIAL_SAVINGS_SPENDING_OVER_TIME_WORKSHEET_FILE =
  "MYL-MATH-FRM-UE-S008-Plan-Savings-Or-Spending-Over-Time.pdf";
const FINANCIAL_SEVERAL_IDEAS_DECISIONS_WORKSHEET_FILE =
  "MYL-MATH-FRM-LS-S009-Use-Several-Mathematical-Ideas-In-Financial-Decisions.pdf";
const FINANCIAL_INFORMATION_CRITICALLY_WORKSHEET_FILE =
  "MYL-MATH-FRM-LS-S010-Interpret-Financial-Information-Critically.pdf";
const FINANCIAL_REALISTIC_PLANNING_WORKSHEET_FILE =
  "MYL-MATH-FRM-HSF-S011-Use-Financial-Mathematics-In-Realistic-Planning.pdf";
const FINANCIAL_JUDGEMENT_EVIDENCE_FINANCE_WORKSHEET_FILE =
  "MYL-MATH-FRM-HSF-S012-Refine-Judgement-Explanation-And-Evidence-Use-In-Finance.pdf";
const PROBABILITY_EVERYDAY_CHANCE_LANGUAGE_WORKSHEET_FILE =
  "MYL-MATH-PC-KEE-S001-Use-Everyday-Chance-Language-Meaningfully.pdf";
const PROBABILITY_NOTICE_FAIRNESS_SIMPLE_GAMES_WORKSHEET_FILE =
  "MYL-MATH-PC-KEE-S002-Notice-Fairness-In-Simple-Games.pdf";
const PROBABILITY_COMPARE_LIKELY_UNLIKELY_EVENTS_WORKSHEET_FILE =
  "MYL-MATH-PC-EE-S003-Compare-Likely-And-Unlikely-Events.pdf";
const PROBABILITY_REPEATED_TRIAL_OUTCOMES_WORKSHEET_FILE =
  "MYL-MATH-PC-EE-S004-Record-Simple-Chance-Outcomes-From-Repeated-Trials.pdf";
const PROBABILITY_SIMPLE_FRACTION_CHANCE_WORKSHEET_FILE =
  "MYL-MATH-PC-MP-S005-Use-Simple-Fraction-Ideas-To-Describe-Chance.pdf";
const PROBABILITY_EXPECTED_ACTUAL_OUTCOMES_WORKSHEET_FILE =
  "MYL-MATH-PC-MP-S006-Compare-Expected-And-Actual-Outcomes.pdf";
const PROBABILITY_REPRESENT_CHANCE_WORKSHEET_FILE =
  "MYL-MATH-PC-UEMS-S007-Represent-Chance-With-Fractions-Decimals-Or-Percentages.pdf";
const PROBABILITY_JUDGE_FAIRNESS_LIKELIHOOD_WORKSHEET_FILE =
  "MYL-MATH-PC-UEMS-S008-Judge-Fairness-And-Likelihood-More-Precisely.pdf";
const PROBABILITY_THEORETICAL_EXPERIMENTAL_WORKSHEET_FILE =
  "MYL-MATH-PC-LS-S009-Compare-Theoretical-And-Experimental-Probability.pdf";
const PROBABILITY_RISK_UNCERTAINTY_WORKSHEET_FILE =
  "MYL-MATH-PC-LS-S010-Use-Probability-To-Judge-Risk-And-Uncertainty.pdf";
const PROBABILITY_DATA_RICH_CONTEXTS_WORKSHEET_FILE =
  "MYL-MATH-PC-HSF-S011-Interpret-Probability-In-Data-Rich-And-Realistic-Contexts.pdf";
const PROBABILITY_CRITIQUE_FAIRNESS_REASONING_WORKSHEET_FILE =
  "MYL-MATH-PC-HSF-S012-Refine-Critique-Explanation-And-Fairness-Reasoning.pdf";
const RATIO_COMPARE_GROUPS_FAIRNESS_WORKSHEET_FILE =
  "MYL-MATH-RPR-KEE-S001-Compare-Groups-And-Talk-About-Fairness.pdf";
const RATIO_DOUBLE_HALF_SAME_AMOUNT_WORKSHEET_FILE =
  "MYL-MATH-RPR-KEE-S002-Use-Double-Half-And-Same-Amount-In-Practical-Play.pdf";
const RATIO_MULTIPLICATIVE_COMPARISONS_WORKSHEET_FILE =
  "MYL-MATH-RPR-EE-S003-Describe-Simple-Multiplicative-Comparisons.pdf";
const RATIO_SCALE_SIMPLE_TASKS_WORKSHEET_FILE =
  "MYL-MATH-RPR-EE-S004-Scale-Simple-Tasks-Up-And-Down.pdf";
const RATIO_TABLES_DIAGRAMS_RELATED_QUANTITIES_WORKSHEET_FILE =
  "MYL-MATH-RPR-MP-S005-Use-Tables-Or-Diagrams-To-Compare-Related-Quantities.pdf";
const RATIO_SIMPLE_RATES_PRACTICAL_CONTEXTS_WORKSHEET_FILE =
  "MYL-MATH-RPR-MP-S006-Use-Simple-Rates-In-Practical-Contexts.pdf";
const STATISTICS_SORT_GROUP_FAMILIAR_INFORMATION_WORKSHEET_FILE =
  "MYL-MATH-STA-KEE-S001-Sort-And-Group-Familiar-Information.pdf";
const STATISTICS_MOST_LEAST_SAME_SIMPLE_DATA_WORKSHEET_FILE =
  "MYL-MATH-SDA-KEE-S002-Talk-About-Most-Least-And-Same-In-Simple-Data.pdf";
const STATISTICS_COLLECT_RECORD_SIMPLE_DATA_WORKSHEET_FILE =
  "MYL-MATH-SDA-EE-S003-Collect-And-Record-Simple-Data.pdf";
const STATISTICS_READ_DISCUSS_SIMPLE_GRAPHS_WORKSHEET_FILE =
  "MYL-MATH-SDA-EE-S004-Read-And-Discuss-Simple-Graphs.pdf";
const STATISTICS_ORGANISE_DISPLAY_DATA_WORKSHEET_FILE =
  "MYL-MATH-SDA-MP-S005-Choose-Useful-Ways-To-Organise-And-Display-Data.pdf";
const STATISTICS_COMPARE_CATEGORIES_TRENDS_WORKSHEET_FILE =
  "MYL-MATH-SDA-MP-S006-Compare-Categories-And-Describe-Trends.pdf";
const STATISTICS_RICHER_GRAPHS_SUMMARY_MEASURES_WORKSHEET_FILE =
  "MYL-MATH-SDA-UE-S007-Interpret-Richer-Graphs-And-Summary-Measures.pdf";
const STATISTICS_QUESTION_DISPLAYS_DATA_CLAIMS_WORKSHEET_FILE =
  "MYL-MATH-SDA-UE-S008-Question-Displays-And-Simple-Data-Claims.pdf";
const STATISTICS_PERCENTAGES_COMPARISONS_TRENDS_WORKSHEET_FILE =
  "MYL-MATH-SDA-UEMS-S009-Interpret-Data-Using-Percentages-Comparisons-And-Trends.pdf";
const STATISTICS_DATA_SUPPORTS_CLAIM_WORKSHEET_FILE =
  "MYL-MATH-SDA-MS-S010-Judge-Whether-Data-Supports-A-Claim.pdf";
const STATISTICS_INTERPRET_DATA_CRITICALLY_REAL_CONTEXTS_WORKSHEET_FILE =
  "MYL-MATH-SDA-HSF-S011-Interpret-Data-Critically-Across-Real-Contexts.pdf";
const STATISTICS_REFINE_EXPLANATION_QUESTIONING_EVIDENCE_WORKSHEET_FILE =
  "MYL-MATH-SDA-HSF-S012-Refine-Explanation-Questioning-And-Evidence-Use.pdf";

export const MATH_WORKSHEET_RESOURCES: MathWorksheetResource[] = [
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::foundation-kindergarten::recognise-money-and-simple-exchange-in-play",
    stepKey: "recognise-money-and-simple-exchange-in-play",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Kindergarten / Early Elementary",
    stepNumber: 1,
    pathwayStepTitle: "Recognise money and simple exchange in play",
    title: "Recognise Money And Simple Exchange In Play",
    concept:
      "Recognise money and use it in simple pretend buying, paying, swapping and exchanging.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_MONEY_SIMPLE_EXCHANGE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/foundation-kindergarten/${FINANCIAL_MONEY_SIMPLE_EXCHANGE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::foundation-kindergarten::compare-simple-wants-needs-and-choices",
    stepKey: "compare-simple-wants-needs-and-choices",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Kindergarten / Early Elementary",
    stepNumber: 2,
    pathwayStepTitle: "Compare simple wants, needs, and choices",
    title: "Compare Simple Wants, Needs, And Choices",
    concept:
      "Distinguish simple wants and needs, make choices based on needs, and talk about everyday family decisions.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_WANTS_NEEDS_CHOICES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/foundation-kindergarten/${FINANCIAL_WANTS_NEEDS_CHOICES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::lower-primary::use-money-amounts-in-simple-practical-tasks",
    stepKey: "use-money-amounts-in-simple-practical-tasks",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 3,
    pathwayStepTitle: "Use money amounts in simple practical tasks",
    title: "Use Money Amounts In Simple Practical Tasks",
    concept:
      "Use simple prices, count generic dollar coins and notes, pay for items, make money amounts, find simple change, and solve practical money tasks.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_MONEY_AMOUNTS_PRACTICAL_TASKS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/lower-primary/${FINANCIAL_MONEY_AMOUNTS_PRACTICAL_TASKS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::lower-primary::talk-about-saving-spending-and-choosing",
    stepKey: "talk-about-saving-spending-and-choosing",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 4,
    pathwayStepTitle: "Talk about saving, spending, and choosing",
    title: "Talk About Saving, Spending, And Choosing",
    concept:
      "Understand that money can be saved, spent, or used to make choices, and explain simple everyday money decisions.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_SAVING_SPENDING_CHOOSING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/lower-primary/${FINANCIAL_SAVING_SPENDING_CHOOSING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::middle-primary::plan-simple-budgets-and-spending-choices",
    stepKey: "plan-simple-budgets-and-spending-choices",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 5,
    pathwayStepTitle: "Plan simple budgets and spending choices",
    title: "Plan Simple Budgets And Spending Choices",
    concept:
      "Plan simple budgets, choose items within a budget, compare spending choices, save toward a goal, and decide whether choices are affordable and sensible.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_SIMPLE_BUDGETS_SPENDING_CHOICES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/middle-primary/${FINANCIAL_SIMPLE_BUDGETS_SPENDING_CHOICES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::middle-primary::compare-value-and-change-in-practical-situations",
    stepKey: "compare-value-and-change-in-practical-situations",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "middle-primary",
    stageDisplay: "Upper Elementary",
    stepNumber: 6,
    pathwayStepTitle: "Compare value and change in practical situations",
    title: "Compare Value And Change In Practical Situations",
    concept:
      "Compare prices, order values, calculate change, decide better value, and solve practical shopping and budget problems.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_COMPARE_VALUE_CHANGE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/upper-primary/${FINANCIAL_COMPARE_VALUE_CHANGE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::upper-primary::use-percentages-and-comparisons-in-shopping-decisions",
    stepKey: "use-percentages-and-comparisons-in-shopping-decisions",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 7,
    pathwayStepTitle: "Use percentages and comparisons in shopping decisions",
    title: "Use Percentages And Comparisons In Shopping Decisions",
    concept:
      "Use percentages, discounts, unit prices, comparisons and shopping budgets to decide better value and make smart shopping decisions.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_PERCENTAGES_COMPARISONS_SHOPPING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/upper-primary/${FINANCIAL_PERCENTAGES_COMPARISONS_SHOPPING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::upper-primary::plan-savings-or-spending-over-time",
    stepKey: "plan-savings-or-spending-over-time",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 8,
    pathwayStepTitle: "Plan savings or spending over time",
    title: "Plan Savings Or Spending Over Time",
    concept:
      "Plan how to save or spend money over time, set a goal, decide regular saving amounts, calculate time needed, and show savings growth using tables and number lines.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_SAVINGS_SPENDING_OVER_TIME_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/upper-primary/${FINANCIAL_SAVINGS_SPENDING_OVER_TIME_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::lower-secondary::use-several-mathematical-ideas-in-financial-decisions",
    stepKey: "use-several-mathematical-ideas-in-financial-decisions",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 9,
    pathwayStepTitle: "Use several mathematical ideas in financial decisions",
    title: "Use Several Mathematical Ideas In Financial Decisions",
    concept:
      "Use numbers, calculations, percentages, comparisons, tables, budgets, savings plans and reasoning to make smart financial choices.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_SEVERAL_IDEAS_DECISIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/lower-secondary/${FINANCIAL_SEVERAL_IDEAS_DECISIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::lower-secondary::interpret-financial-information-critically",
    stepKey: "interpret-financial-information-critically",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 10,
    pathwayStepTitle: "Interpret financial information critically",
    title: "Interpret Financial Information Critically",
    concept:
      "Read advertisements, offers, financial tables and graphs critically, compare claims, check calculations, and make evidence-based financial decisions.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_INFORMATION_CRITICALLY_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/lower-secondary/${FINANCIAL_INFORMATION_CRITICALLY_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::years-9-10-consolidation::use-financial-mathematics-in-realistic-planning",
    stepKey: "use-financial-mathematics-in-realistic-planning",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 11,
    pathwayStepTitle: "Use financial mathematics in realistic planning",
    title: "Use Financial Mathematics In Realistic Planning",
    concept:
      "Use financial mathematics in realistic planning, including budgets, discounts, weekly spending, savings plans, trip costs, future goals, priorities and trade-offs.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_REALISTIC_PLANNING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/years-9-10-consolidation/${FINANCIAL_REALISTIC_PLANNING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::financial-and-real-world-mathematics::years-9-10-consolidation::refine-judgement-explanation-and-evidence-use-in-finance",
    stepKey: "refine-judgement-explanation-and-evidence-use-in-finance",
    subjectKey: "mathematics",
    strandKey: "financial-and-real-world-mathematics",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 12,
    pathwayStepTitle:
      "Refine judgement, explanation, and evidence use in finance",
    title: "Refine Judgement, Explanation, And Evidence Use In Finance",
    concept:
      "Refine financial judgement, explain decisions clearly, use evidence and calculations to justify choices, and evaluate whether plans, deals and recommendations are sensible.",
    includesAnswerSheet: false,
    fileName: FINANCIAL_JUDGEMENT_EVIDENCE_FINANCE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/financial-and-real-world-mathematics/years-9-10-consolidation/${FINANCIAL_JUDGEMENT_EVIDENCE_FINANCE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::foundation-kindergarten::use-everyday-chance-language-meaningfully",
    stepKey: "use-everyday-chance-language-meaningfully",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 1,
    pathwayStepTitle: "Use everyday chance language meaningfully",
    title: "Use Everyday Chance Language Meaningfully",
    concept:
      "Use everyday chance words such as certain, likely, unlikely and impossible to describe events meaningfully.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_EVERYDAY_CHANCE_LANGUAGE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/foundation-kindergarten/${PROBABILITY_EVERYDAY_CHANCE_LANGUAGE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::foundation-kindergarten::notice-fairness-in-simple-games",
    stepKey: "notice-fairness-in-simple-games",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 2,
    pathwayStepTitle: "Notice fairness in simple games",
    title: "Notice Fairness In Simple Games",
    concept:
      "Notice whether simple games are fair by looking at rules, turns, equal chances, and whether each player has the same opportunity.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_NOTICE_FAIRNESS_SIMPLE_GAMES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/foundation-kindergarten/${PROBABILITY_NOTICE_FAIRNESS_SIMPLE_GAMES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::lower-primary::compare-likely-and-unlikely-events",
    stepKey: "compare-likely-and-unlikely-events",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 3,
    pathwayStepTitle: "Compare likely and unlikely events",
    title: "Compare Likely And Unlikely Events",
    concept:
      "Compare likely and unlikely events, recognise equally likely outcomes, order simple chances, and explain chance thinking using visual examples.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_COMPARE_LIKELY_UNLIKELY_EVENTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/lower-primary/${PROBABILITY_COMPARE_LIKELY_UNLIKELY_EVENTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::lower-primary::record-simple-chance-outcomes-from-repeated-trials",
    stepKey: "record-simple-chance-outcomes-from-repeated-trials",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 4,
    pathwayStepTitle: "Record simple chance outcomes from repeated trials",
    title: "Record Simple Chance Outcomes From Repeated Trials",
    concept:
      "Record simple outcomes from repeated chance trials, use tally marks and totals, and compare which outcomes happened more often or less often.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_REPEATED_TRIAL_OUTCOMES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/lower-primary/${PROBABILITY_REPEATED_TRIAL_OUTCOMES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::middle-primary::use-simple-fraction-ideas-to-describe-chance",
    stepKey: "use-simple-fraction-ideas-to-describe-chance",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 5,
    pathwayStepTitle: "Use simple fraction ideas to describe chance",
    title: "Use Simple Fraction Ideas To Describe Chance",
    concept:
      "Use simple fractions to describe chance, compare chances, connect fractions to likely/unlikely/certain/impossible, and record simple trial results as fractions of the total.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_SIMPLE_FRACTION_CHANCE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/middle-primary/${PROBABILITY_SIMPLE_FRACTION_CHANCE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::middle-primary::compare-expected-and-actual-outcomes",
    stepKey: "compare-expected-and-actual-outcomes",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 6,
    pathwayStepTitle: "Compare expected and actual outcomes",
    title: "Compare Expected And Actual Outcomes",
    concept:
      "Make predictions about chance activities, record repeated trial results, compare expected and actual outcomes, and use simple graphs to show results.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_EXPECTED_ACTUAL_OUTCOMES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/middle-primary/${PROBABILITY_EXPECTED_ACTUAL_OUTCOMES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::upper-primary::represent-chance-with-fractions-decimals-or-percentages",
    stepKey: "represent-chance-with-fractions-decimals-or-percentages",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 7,
    pathwayStepTitle:
      "Represent chance with fractions, decimals, or percentages",
    title: "Represent Chance With Fractions Decimals Or Percentages",
    concept:
      "Represent chance using fractions, decimals and percentages, convert between representations, compare chances, and use representations to make predictions.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_REPRESENT_CHANCE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/upper-primary/${PROBABILITY_REPRESENT_CHANCE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::upper-primary::judge-fairness-and-likelihood-more-precisely",
    stepKey: "judge-fairness-and-likelihood-more-precisely",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 8,
    pathwayStepTitle: "Judge fairness and likelihood more precisely",
    title: "Judge Fairness And Likelihood More Precisely",
    concept:
      "Judge fairness and likelihood more precisely using fractions, decimals, percentages, event comparisons, ordering, and reasoning.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_JUDGE_FAIRNESS_LIKELIHOOD_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/upper-primary/${PROBABILITY_JUDGE_FAIRNESS_LIKELIHOOD_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::lower-secondary::compare-theoretical-and-experimental-probability",
    stepKey: "compare-theoretical-and-experimental-probability",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 9,
    pathwayStepTitle: "Compare theoretical and experimental probability",
    title: "Compare Theoretical And Experimental Probability",
    concept:
      "Compare theoretical probability with experimental probability using repeated trials, outcome tables, probability differences, predictions, and explanations.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_THEORETICAL_EXPERIMENTAL_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/lower-secondary/${PROBABILITY_THEORETICAL_EXPERIMENTAL_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::lower-secondary::use-probability-to-judge-risk-and-uncertainty",
    stepKey: "use-probability-to-judge-risk-and-uncertainty",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 10,
    pathwayStepTitle: "Use probability to judge risk and uncertainty",
    title: "Use Probability To Judge Risk And Uncertainty",
    concept:
      "Use probability to judge risk and uncertainty, compare likelihoods, estimate risk levels, interpret real-life probability situations, and make safer or better decisions.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_RISK_UNCERTAINTY_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/lower-secondary/${PROBABILITY_RISK_UNCERTAINTY_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::years-9-10-consolidation::interpret-probability-in-data-rich-and-realistic-contexts",
    stepKey: "interpret-probability-in-data-rich-and-realistic-contexts",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 11,
    pathwayStepTitle: "Interpret probability in data-rich and realistic contexts",
    title: "Interpret Probability In Data-Rich And Realistic Contexts",
    concept:
      "Interpret probability in data-rich and realistic contexts using survey data, tables, graphs, real records, experimental probability, percentages, and evidence-based reasoning.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_DATA_RICH_CONTEXTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/years-9-10-consolidation/${PROBABILITY_DATA_RICH_CONTEXTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::probability-and-chance::years-9-10-consolidation::refine-critique-explanation-and-fairness-reasoning",
    stepKey: "refine-critique-explanation-and-fairness-reasoning",
    subjectKey: "mathematics",
    strandKey: "probability-and-chance",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 12,
    pathwayStepTitle: "Refine critique, explanation, and fairness reasoning",
    title: "Refine Critique Explanation And Fairness Reasoning",
    concept:
      "Refine probability critique, explanation and fairness reasoning by using data, probability calculations, evidence, and clear mathematical justification.",
    includesAnswerSheet: false,
    fileName: PROBABILITY_CRITIQUE_FAIRNESS_REASONING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/probability-and-chance/years-9-10-consolidation/${PROBABILITY_CRITIQUE_FAIRNESS_REASONING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::ratio-and-proportional-reasoning::foundation-kindergarten::compare-groups-and-talk-about-fairness",
    stepKey: "compare-groups-and-talk-about-fairness",
    subjectKey: "mathematics",
    strandKey: "ratio-and-proportional-reasoning",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 1,
    pathwayStepTitle: "Compare groups and talk about fairness",
    title: "Compare Groups And Talk About Fairness",
    concept:
      "Compare two simple groups, use more, fewer and same, notice whether sharing is fair, and explain how to make groups equal.",
    includesAnswerSheet: false,
    fileName: RATIO_COMPARE_GROUPS_FAIRNESS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/ratio-and-proportional-reasoning/foundation-kindergarten/${RATIO_COMPARE_GROUPS_FAIRNESS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::ratio-and-proportional-reasoning::foundation-kindergarten::use-double-half-and-same-amount-in-practical-play",
    stepKey: "use-double-half-and-same-amount-in-practical-play",
    subjectKey: "mathematics",
    strandKey: "ratio-and-proportional-reasoning",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 2,
    pathwayStepTitle:
      "Use double, half, and same amount in practical play",
    title: "Use Double Half And Same Amount In Practical Play",
    concept:
      "Use double, half and same amount in practical play, sharing and early comparison situations.",
    includesAnswerSheet: false,
    fileName: RATIO_DOUBLE_HALF_SAME_AMOUNT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/ratio-and-proportional-reasoning/foundation-kindergarten/${RATIO_DOUBLE_HALF_SAME_AMOUNT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::ratio-and-proportional-reasoning::lower-primary::describe-simple-multiplicative-comparisons",
    stepKey: "describe-simple-multiplicative-comparisons",
    subjectKey: "mathematics",
    strandKey: "ratio-and-proportional-reasoning",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 3,
    pathwayStepTitle: "Describe simple multiplicative comparisons",
    title: "Describe Simple Multiplicative Comparisons",
    concept:
      "Describe simple multiplicative comparisons using more, less, times as many, and as many as in visual and practical contexts.",
    includesAnswerSheet: false,
    fileName: RATIO_MULTIPLICATIVE_COMPARISONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/ratio-and-proportional-reasoning/lower-primary/${RATIO_MULTIPLICATIVE_COMPARISONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::ratio-and-proportional-reasoning::lower-primary::scale-simple-tasks-up-and-down",
    stepKey: "scale-simple-tasks-up-and-down",
    subjectKey: "mathematics",
    strandKey: "ratio-and-proportional-reasoning",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 4,
    pathwayStepTitle: "Scale simple tasks up and down",
    title: "Scale Simple Tasks Up And Down",
    concept:
      "Scale simple quantities up and down using whole-number multipliers and simple fractional amounts such as 1/2, 1/3 and 1/5 in practical contexts.",
    includesAnswerSheet: false,
    fileName: RATIO_SCALE_SIMPLE_TASKS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/ratio-and-proportional-reasoning/lower-primary/${RATIO_SCALE_SIMPLE_TASKS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::ratio-and-proportional-reasoning::middle-primary::use-tables-or-diagrams-to-compare-related-quantities",
    stepKey: "use-tables-or-diagrams-to-compare-related-quantities",
    subjectKey: "mathematics",
    strandKey: "ratio-and-proportional-reasoning",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 5,
    pathwayStepTitle:
      "Use tables or diagrams to compare related quantities",
    title: "Use Tables Or Diagrams To Compare Related Quantities",
    concept:
      "Use tables, diagrams, bar charts and pictographs to compare related quantities, complete missing values, identify simple rules, and solve real-life quantity comparison problems.",
    includesAnswerSheet: false,
    fileName: RATIO_TABLES_DIAGRAMS_RELATED_QUANTITIES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/ratio-and-proportional-reasoning/middle-primary/${RATIO_TABLES_DIAGRAMS_RELATED_QUANTITIES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::ratio-and-proportional-reasoning::middle-primary::use-simple-rates-in-practical-contexts",
    stepKey: "use-simple-rates-in-practical-contexts",
    subjectKey: "mathematics",
    strandKey: "ratio-and-proportional-reasoning",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 6,
    pathwayStepTitle: "Use simple rates in practical contexts",
    title: "Use Simple Rates In Practical Contexts",
    concept:
      "Read and use simple rates such as per, every and each, complete rate tables, find missing rates, and solve practical real-life rate problems.",
    includesAnswerSheet: false,
    fileName: RATIO_SIMPLE_RATES_PRACTICAL_CONTEXTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/ratio-and-proportional-reasoning/middle-primary/${RATIO_SIMPLE_RATES_PRACTICAL_CONTEXTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::foundation-kindergarten::sort-and-group-familiar-information",
    stepKey: "sort-and-group-familiar-information",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Kindergarten / Early Elementary",
    stepNumber: 1,
    pathwayStepTitle: "Sort and group familiar information",
    title: "Sort And Group Familiar Information",
    concept:
      "Sort familiar items into sensible groups, count each group, and explain a simple sorting rule.",
    includesAnswerSheet: false,
    fileName: STATISTICS_SORT_GROUP_FAMILIAR_INFORMATION_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/foundation-kindergarten/${STATISTICS_SORT_GROUP_FAMILIAR_INFORMATION_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::foundation-kindergarten::talk-about-most-least-and-same-in-simple-data",
    stepKey: "talk-about-most-least-and-same-in-simple-data",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Kindergarten / Early Elementary",
    stepNumber: 2,
    pathwayStepTitle: "Talk about most, least, and same in simple data",
    title: "Talk About Most, Least, And Same In Simple Data",
    concept:
      "Compare picture data using most, least, more, fewer and same.",
    includesAnswerSheet: false,
    fileName: STATISTICS_MOST_LEAST_SAME_SIMPLE_DATA_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/foundation-kindergarten/${STATISTICS_MOST_LEAST_SAME_SIMPLE_DATA_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::lower-primary::collect-and-record-simple-data",
    stepKey: "collect-and-record-simple-data",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 3,
    pathwayStepTitle: "Collect and record simple data",
    title: "Collect And Record Simple Data",
    concept:
      "Collect answers to a simple question, record them using tally marks, and use words such as most, least and same to describe the data.",
    includesAnswerSheet: false,
    fileName: STATISTICS_COLLECT_RECORD_SIMPLE_DATA_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/lower-primary/${STATISTICS_COLLECT_RECORD_SIMPLE_DATA_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::lower-primary::read-and-discuss-simple-graphs",
    stepKey: "read-and-discuss-simple-graphs",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 4,
    pathwayStepTitle: "Read and discuss simple graphs",
    title: "Read And Discuss Simple Graphs",
    concept:
      "Read simple picture graphs and bar graphs, use a key, identify most and least, count category values, compare categories and talk about what the graph shows.",
    includesAnswerSheet: false,
    fileName: STATISTICS_READ_DISCUSS_SIMPLE_GRAPHS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/lower-primary/${STATISTICS_READ_DISCUSS_SIMPLE_GRAPHS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::middle-primary::choose-useful-ways-to-organise-and-display-data",
    stepKey: "choose-useful-ways-to-organise-and-display-data",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 5,
    pathwayStepTitle: "Choose useful ways to organise and display data",
    title: "Choose Useful Ways To Organise And Display Data",
    concept:
      "Choose the most useful way to organise and display simple data using tally charts, picture graphs and bar graphs.",
    includesAnswerSheet: false,
    fileName: STATISTICS_ORGANISE_DISPLAY_DATA_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/middle-primary/${STATISTICS_ORGANISE_DISPLAY_DATA_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::middle-primary::compare-categories-and-describe-trends",
    stepKey: "compare-categories-and-describe-trends",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 6,
    pathwayStepTitle: "Compare categories and describe trends",
    title: "Compare Categories And Describe Trends",
    concept:
      "Compare categories using simple charts and graphs, and describe trends using words such as increased, decreased and stayed the same.",
    includesAnswerSheet: false,
    fileName: STATISTICS_COMPARE_CATEGORIES_TRENDS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/middle-primary/${STATISTICS_COMPARE_CATEGORIES_TRENDS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::upper-primary::interpret-richer-graphs-and-summary-measures",
    stepKey: "interpret-richer-graphs-and-summary-measures",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 7,
    pathwayStepTitle: "Interpret richer graphs and summary measures",
    title: "Interpret Richer Graphs And Summary Measures",
    concept:
      "Interpret richer graphs and use summary measures such as maximum, minimum, range, total, mean, median, quartiles and interquartile range to answer questions about data.",
    includesAnswerSheet: false,
    fileName: STATISTICS_RICHER_GRAPHS_SUMMARY_MEASURES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/upper-primary/${STATISTICS_RICHER_GRAPHS_SUMMARY_MEASURES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::upper-primary::question-displays-and-simple-data-claims",
    stepKey: "question-displays-and-simple-data-claims",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 8,
    pathwayStepTitle: "Question displays and simple data claims",
    title: "Question Displays And Simple Data Claims",
    concept:
      "Ask questions about data displays and make simple evidence-based claims using information from pictographs, bar graphs, tables, line graphs and summary measures.",
    includesAnswerSheet: false,
    fileName: STATISTICS_QUESTION_DISPLAYS_DATA_CLAIMS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/upper-primary/${STATISTICS_QUESTION_DISPLAYS_DATA_CLAIMS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::lower-secondary::interpret-data-using-percentages-comparisons-and-trends",
    stepKey: "interpret-data-using-percentages-comparisons-and-trends",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 9,
    pathwayStepTitle:
      "Interpret data using percentages, comparisons, and trends",
    title: "Interpret Data Using Percentages, Comparisons, And Trends",
    concept:
      "Interpret data using percentages, comparisons, and trends to answer questions and make evidence-based statements.",
    includesAnswerSheet: false,
    fileName: STATISTICS_PERCENTAGES_COMPARISONS_TRENDS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/lower-secondary/${STATISTICS_PERCENTAGES_COMPARISONS_TRENDS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::lower-secondary::judge-whether-data-supports-a-claim",
    stepKey: "judge-whether-data-supports-a-claim",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 10,
    pathwayStepTitle: "Judge whether data supports a claim",
    title: "Judge Whether Data Supports A Claim",
    concept:
      "Decide whether data supports a claim and explain reasoning using evidence from data displays, tables and summary measures.",
    includesAnswerSheet: false,
    fileName: STATISTICS_DATA_SUPPORTS_CLAIM_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/lower-secondary/${STATISTICS_DATA_SUPPORTS_CLAIM_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::years-9-10-consolidation::interpret-data-critically-across-real-contexts",
    stepKey: "interpret-data-critically-across-real-contexts",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 11,
    pathwayStepTitle: "Interpret data critically across real contexts",
    title: "Interpret Data Critically Across Real Contexts",
    concept:
      "Interpret data in real-world situations, compare displays, evaluate claims, recognise context, and explain conclusions using evidence.",
    includesAnswerSheet: false,
    fileName: STATISTICS_INTERPRET_DATA_CRITICALLY_REAL_CONTEXTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/years-9-10-consolidation/${STATISTICS_INTERPRET_DATA_CRITICALLY_REAL_CONTEXTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::statistics-and-data::years-9-10-consolidation::refine-explanation-questioning-and-evidence-use",
    stepKey: "refine-explanation-questioning-and-evidence-use",
    subjectKey: "mathematics",
    strandKey: "statistics-and-data",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 12,
    pathwayStepTitle: "Refine explanation, questioning, and evidence use",
    title: "Refine Explanation, Questioning, And Evidence Use",
    concept:
      "Use data carefully to ask thoughtful questions, give clear explanations, connect data to real situations, and support ideas with strong evidence.",
    includesAnswerSheet: false,
    fileName: STATISTICS_REFINE_EXPLANATION_QUESTIONING_EVIDENCE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/statistics-and-data/years-9-10-consolidation/${STATISTICS_REFINE_EXPLANATION_QUESTIONING_EVIDENCE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
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
      "mathematics::operations-and-calculation::middle-primary::model-equal-groups-and-repeated-addition",
    stepKey: "model-equal-groups-and-repeated-addition",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "middle-primary",
    stageDisplay: "Early Elementary",
    stepNumber: 5,
    pathwayStepTitle: "Model equal groups and repeated addition",
    title: "Model Equal Groups And Repeated Addition",
    concept:
      "Use equal groups and repeated addition to find total amounts and prepare for multiplication thinking.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_EQUAL_GROUPS_REPEATED_ADDITION_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/early-elementary/${OPERATIONS_EQUAL_GROUPS_REPEATED_ADDITION_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::middle-primary::connect-multiplication-and-division-through-grouping-and-sharing",
    stepKey: "connect-multiplication-and-division-through-grouping-and-sharing",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "middle-primary",
    stageDisplay: "Early Elementary",
    stepNumber: 6,
    pathwayStepTitle:
      "Connect multiplication and division through grouping and sharing",
    title: "Connect Multiplication And Division Through Grouping And Sharing",
    concept:
      "Use grouping and sharing models to connect multiplication and division facts in simple everyday contexts.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_MULTIPLICATION_DIVISION_GROUPING_SHARING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/early-elementary/${OPERATIONS_MULTIPLICATION_DIVISION_GROUPING_SHARING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::upper-primary::use-written-methods-and-mental-strategies-flexibly",
    stepKey: "use-written-methods-and-mental-strategies-flexibly",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 7,
    pathwayStepTitle: "Use written methods and mental strategies flexibly",
    title: "Use Written Methods And Mental Strategies Flexibly",
    concept:
      "Choose written methods and mental strategies flexibly for addition, subtraction, multiplication and division problems.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_WRITTEN_METHODS_MENTAL_STRATEGIES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/early-elementary/${OPERATIONS_WRITTEN_METHODS_MENTAL_STRATEGIES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::upper-primary::estimate-and-solve-multi-step-practical-problems",
    stepKey: "estimate-and-solve-multi-step-practical-problems",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 8,
    pathwayStepTitle: "Estimate and solve multi-step practical problems",
    title: "Estimate And Solve Multi-Step Practical Problems",
    concept:
      "Use estimation, multi-step calculation and reasonableness checks to solve practical problems.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_ESTIMATE_MULTI_STEP_PROBLEMS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/early-elementary/${OPERATIONS_ESTIMATE_MULTI_STEP_PROBLEMS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::lower-secondary::choose-efficient-strategies-across-different-number-forms",
    stepKey: "choose-efficient-strategies-across-different-number-forms",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 9,
    pathwayStepTitle: "Choose efficient strategies across different number forms",
    title: "Choose Efficient Strategies Across Different Number Forms",
    concept:
      "Choose efficient strategies across whole numbers, decimals, fractions, percentages and other number forms.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_EFFICIENT_STRATEGIES_NUMBER_FORMS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/early-elementary/${OPERATIONS_EFFICIENT_STRATEGIES_NUMBER_FORMS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::lower-secondary::apply-calculation-to-richer-practical-reasoning",
    stepKey: "apply-calculation-to-richer-practical-reasoning",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 10,
    pathwayStepTitle: "Apply calculation to richer practical reasoning",
    title: "Apply Calculation To Richer Practical Reasoning",
    concept:
      "Apply calculation to practical reasoning tasks that involve multi-step decisions, units, comparisons and checks.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_RICHER_PRACTICAL_REASONING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/early-elementary/${OPERATIONS_RICHER_PRACTICAL_REASONING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::years-9-10-consolidation::use-operations-confidently-in-algebraic-and-financial-contexts",
    stepKey: "use-operations-confidently-in-algebraic-and-financial-contexts",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 11,
    pathwayStepTitle:
      "Use operations confidently in algebraic and financial contexts",
    title: "Use Operations Confidently In Algebraic And Financial Contexts",
    concept:
      "Use operations confidently in algebraic, financial and practical contexts involving unknowns, formulas, percentages and multi-step reasoning.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_ALGEBRAIC_FINANCIAL_CONTEXTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/upper-primary/${OPERATIONS_ALGEBRAIC_FINANCIAL_CONTEXTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::operations-and-calculation::years-9-10-consolidation::refine-judgement-checking-and-mathematical-communication",
    stepKey: "refine-judgement-checking-and-mathematical-communication",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 12,
    pathwayStepTitle:
      "Refine judgement, checking, and mathematical communication",
    title: "Refine Judgement, Checking, And Mathematical Communication",
    concept:
      "Use estimation, checking, error analysis and clear mathematical communication to refine calculation decisions.",
    includesAnswerSheet: false,
    fileName: OPERATIONS_JUDGEMENT_CHECKING_COMMUNICATION_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/operations-and-calculation/upper-primary/${OPERATIONS_JUDGEMENT_CHECKING_COMMUNICATION_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::foundation-kindergarten::recognise-equal-parts-in-real-objects-and-sharing-situations",
    stepKey: "recognise-equal-parts-in-real-objects-and-sharing-situations",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 1,
    pathwayStepTitle:
      "Recognise equal parts in real objects and sharing situations",
    title:
      "Recognise Equal Parts In Real Objects And Sharing Situations",
    concept:
      "Recognise fair equal parts, unequal parts, halves and simple sharing situations using familiar real objects.",
    includesAnswerSheet: false,
    fileName: FDP_RECOGNISE_EQUAL_PARTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/foundation-kindergarten/${FDP_RECOGNISE_EQUAL_PARTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::foundation-kindergarten::use-halves-in-simple-real-world-situations",
    stepKey: "use-halves-in-simple-real-world-situations",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 2,
    pathwayStepTitle: "Use halves in simple real-world situations",
    title: "Use Halves In Simple Real-World Situations",
    concept:
      "Recognise, colour, share and complete halves in familiar food, shape and everyday sharing contexts.",
    includesAnswerSheet: false,
    fileName: FDP_USE_HALVES_REAL_WORLD_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/foundation-kindergarten/${FDP_USE_HALVES_REAL_WORLD_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::lower-primary::use-halves-quarters-and-simple-fractions-in-practical-tasks",
    stepKey: "use-halves-quarters-and-simple-fractions-in-practical-tasks",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 1,
    pathwayStepTitle:
      "Use halves, quarters, and simple fractions in practical tasks",
    title: "Use Halves, Quarters, And Simple Fractions In Practical Tasks",
    concept:
      "Use halves, quarters and simple fractions in practical sharing, folding, portioning and everyday measurement tasks.",
    includesAnswerSheet: false,
    fileName: FDP_HALVES_QUARTERS_SIMPLE_FRACTIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/lower-primary/${FDP_HALVES_QUARTERS_SIMPLE_FRACTIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::lower-primary::describe-simple-fraction-situations-with-confidence",
    stepKey: "describe-simple-fraction-situations-with-confidence",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 2,
    pathwayStepTitle: "Describe simple fraction situations with confidence",
    title: "Describe Simple Fraction Situations With Confidence",
    concept:
      "Describe halves, quarters and simple fraction situations using clear words, symbols, labels and everyday sharing contexts.",
    includesAnswerSheet: false,
    fileName: FDP_DESCRIBE_SIMPLE_FRACTION_SITUATIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/lower-primary/${FDP_DESCRIBE_SIMPLE_FRACTION_SITUATIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::middle-primary::represent-and-compare-fractions-with-visual-models",
    stepKey: "represent-and-compare-fractions-with-visual-models",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 1,
    pathwayStepTitle: "Represent and compare fractions with visual models",
    title: "Represent And Compare Fractions With Visual Models",
    concept:
      "Use pizzas, chocolate blocks, fraction strips, shape models and set models to represent and compare familiar fractions.",
    includesAnswerSheet: false,
    fileName: FDP_REPRESENT_COMPARE_FRACTIONS_VISUAL_MODELS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/middle-primary/${FDP_REPRESENT_COMPARE_FRACTIONS_VISUAL_MODELS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::middle-primary::notice-equivalent-fractions-and-order-familiar-amounts",
    stepKey: "notice-equivalent-fractions-and-order-familiar-amounts",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 2,
    pathwayStepTitle: "Notice equivalent fractions and order familiar amounts",
    title: "Notice Equivalent Fractions And Order Familiar Amounts",
    concept:
      "Use pizzas, chocolate bars, circles and fraction strips to notice equivalent fractions and order familiar amounts.",
    includesAnswerSheet: false,
    fileName: FDP_EQUIVALENT_FRACTIONS_ORDER_FAMILIAR_AMOUNTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/middle-primary/${FDP_EQUIVALENT_FRACTIONS_ORDER_FAMILIAR_AMOUNTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::upper-primary::connect-fractions-to-tenths-and-hundredths-as-decimals",
    stepKey: "connect-fractions-to-tenths-and-hundredths-as-decimals",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 1,
    pathwayStepTitle: "Connect fractions to tenths and hundredths as decimals",
    title: "Connect Fractions To Tenths And Hundredths As Decimals",
    concept:
      "Use tenths bars, hundred grids and real-life decimal visuals to connect fractions to decimal notation.",
    includesAnswerSheet: false,
    fileName: FDP_FRACTIONS_TENTHS_HUNDREDTHS_DECIMALS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/upper-primary/${FDP_FRACTIONS_TENTHS_HUNDREDTHS_DECIMALS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::upper-primary::use-fraction-decimal-connections-in-practical-comparison",
    stepKey: "use-fraction-decimal-connections-in-practical-comparison",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 2,
    pathwayStepTitle:
      "Use fraction-decimal connections in practical comparison",
    title: "Use Fraction-Decimal Connections In Practical Comparison",
    concept:
      "Use tenths bars, hundred grids and real-life models to match, compare and order connected fractions and decimals.",
    includesAnswerSheet: false,
    fileName: FDP_FRACTION_DECIMAL_PRACTICAL_COMPARISON_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/upper-primary/${FDP_FRACTION_DECIMAL_PRACTICAL_COMPARISON_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::lower-secondary::understand-percentages-as-out-of-100-comparisons",
    stepKey: "understand-percentages-as-out-of-100-comparisons",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 1,
    pathwayStepTitle: "Understand percentages as out-of-100 comparisons",
    title: "Understand Percentages As Out-Of-100 Comparisons",
    concept:
      "Use hundred grids, matching models and real-life contexts to understand percentages as comparisons out of 100.",
    includesAnswerSheet: false,
    fileName: FDP_PERCENTAGES_OUT_OF_100_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/lower-secondary/${FDP_PERCENTAGES_OUT_OF_100_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::lower-secondary::move-flexibly-between-fractions-decimals-and-percentages",
    stepKey: "move-flexibly-between-fractions-decimals-and-percentages",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 2,
    pathwayStepTitle:
      "Move flexibly between fractions, decimals, and percentages",
    title: "Move Flexibly Between Fractions, Decimals, And Percentages",
    concept:
      "Use models, equivalent cards and real-life contexts to move between fractions, decimals and percentages.",
    includesAnswerSheet: false,
    fileName: FDP_FLEXIBLE_FRACTIONS_DECIMALS_PERCENTAGES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/lower-secondary/${FDP_FLEXIBLE_FRACTIONS_DECIMALS_PERCENTAGES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::years-9-10-consolidation::use-proportional-reasoning-in-scale-rates-and-financial-contexts",
    stepKey: "use-proportional-reasoning-in-scale-rates-and-financial-contexts",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 1,
    pathwayStepTitle:
      "Use proportional reasoning in scale, rates, and financial contexts",
    title: "Use Proportional Reasoning In Scale, Rates, And Financial Contexts",
    concept:
      "Use map scales, rates, unit prices, scale drawings, recipes and discounts to reason proportionally in real contexts.",
    includesAnswerSheet: false,
    fileName: FDP_PROPORTIONAL_REASONING_SCALE_RATES_FINANCE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/years-9-10-consolidation/${FDP_PROPORTIONAL_REASONING_SCALE_RATES_FINANCE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::fractions-decimals-percentages::years-9-10-consolidation::interpret-proportional-information-in-data-and-real-decisions",
    stepKey: "interpret-proportional-information-in-data-and-real-decisions",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 2,
    pathwayStepTitle:
      "Interpret proportional information in data and real decisions",
    title: "Interpret Proportional Information In Data And Real Decisions",
    concept:
      "Use graphs, tables, rates, discounts and best-value comparisons to interpret proportional information in real decisions.",
    includesAnswerSheet: false,
    fileName: FDP_PROPORTIONAL_INFORMATION_DATA_DECISIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/fractions-decimals-percentages/years-9-10-consolidation/${FDP_PROPORTIONAL_INFORMATION_DATA_DECISIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::foundation-kindergarten::notice-and-continue-simple-repeating-patterns",
    stepKey: "notice-and-continue-simple-repeating-patterns",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 1,
    pathwayStepTitle: "Notice and continue simple repeating patterns",
    title: "Notice And Continue Simple Repeating Patterns",
    concept:
      "Notice, copy, continue and create simple repeating colour and shape patterns.",
    includesAnswerSheet: false,
    fileName: APF_SIMPLE_REPEATING_PATTERNS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/foundation-kindergarten/${APF_SIMPLE_REPEATING_PATTERNS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::foundation-kindergarten::sort-objects-and-explain-the-rule",
    stepKey: "sort-objects-and-explain-the-rule",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 2,
    pathwayStepTitle: "Sort objects and explain the rule",
    title: "Sort Objects And Explain The Rule",
    concept:
      "Sort familiar objects by colour, shape, size or type, find what does not belong, and explain the sorting rule.",
    includesAnswerSheet: false,
    fileName: APF_SORT_OBJECTS_EXPLAIN_RULE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/foundation-kindergarten/${APF_SORT_OBJECTS_EXPLAIN_RULE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::lower-primary::continue-growing-patterns-and-describe-the-change",
    stepKey: "continue-growing-patterns-and-describe-the-change",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 1,
    pathwayStepTitle: "Continue growing patterns and describe the change",
    title: "Continue Growing Patterns And Describe The Change",
    concept:
      "Continue simple growing patterns, describe what changes each time, and predict what comes next.",
    includesAnswerSheet: false,
    fileName: APF_GROWING_PATTERNS_DESCRIBE_CHANGE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/lower-primary/${APF_GROWING_PATTERNS_DESCRIBE_CHANGE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::lower-primary::use-missing-number-and-input-output-thinking",
    stepKey: "use-missing-number-and-input-output-thinking",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 2,
    pathwayStepTitle: "Use missing-number and input-output thinking",
    title: "Use Missing-Number And Input-Output Thinking",
    concept:
      "Use missing-number sequences and input-output machines to find unknowns, identify simple rules, and complete outputs.",
    includesAnswerSheet: false,
    fileName: APF_MISSING_NUMBER_INPUT_OUTPUT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/lower-primary/${APF_MISSING_NUMBER_INPUT_OUTPUT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::middle-primary::use-tables-and-rules-to-describe-number-patterns",
    stepKey: "use-tables-and-rules-to-describe-number-patterns",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 1,
    pathwayStepTitle: "Use tables and rules to describe number patterns",
    title: "Use Tables And Rules To Describe Number Patterns",
    concept:
      "Use tables, rules and growing groups to record, continue and explain number patterns.",
    includesAnswerSheet: false,
    fileName: APF_TABLES_RULES_NUMBER_PATTERNS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/middle-primary/${APF_TABLES_RULES_NUMBER_PATTERNS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::middle-primary::generalise-simple-rules-and-equivalent-relationships",
    stepKey: "generalise-simple-rules-and-equivalent-relationships",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 2,
    pathwayStepTitle: "Generalise simple rules and equivalent relationships",
    title: "Generalise Simple Rules And Equivalent Relationships",
    concept:
      "Compare visual and number patterns, identify shared rules, fill missing values and explain equivalent relationships.",
    includesAnswerSheet: false,
    fileName: APF_GENERALISE_RULES_EQUIVALENT_RELATIONSHIPS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/middle-primary/${APF_GENERALISE_RULES_EQUIVALENT_RELATIONSHIPS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::upper-primary::use-symbols-or-letters-to-show-an-unknown-or-rule",
    stepKey: "use-symbols-or-letters-to-show-an-unknown-or-rule",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 1,
    pathwayStepTitle: "Use symbols or letters to show an unknown or rule",
    title: "Use Symbols Or Letters To Show An Unknown Or Rule",
    concept:
      "Use boxes and letters to represent unknown numbers and simple rules in equations, tables and patterns.",
    includesAnswerSheet: false,
    fileName: APF_SYMBOLS_LETTERS_UNKNOWN_RULE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/upper-primary/${APF_SYMBOLS_LETTERS_UNKNOWN_RULE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::upper-primary::write-and-interpret-simple-expressions-or-equations",
    stepKey: "write-and-interpret-simple-expressions-or-equations",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 2,
    pathwayStepTitle: "Write and interpret simple expressions or equations",
    title: "Write And Interpret Simple Expressions Or Equations",
    concept:
      "Read, write and solve simple expressions and equations using letters, rule tables and real-life unknown stories.",
    includesAnswerSheet: false,
    fileName: APF_SIMPLE_EXPRESSIONS_EQUATIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/upper-primary/${APF_SIMPLE_EXPRESSIONS_EQUATIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::lower-secondary::solve-and-explain-equations-as-balanced-relationships",
    stepKey: "solve-and-explain-equations-as-balanced-relationships",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 1,
    pathwayStepTitle: "Solve and explain equations as balanced relationships",
    title: "Solve And Explain Equations As Balanced Relationships",
    concept:
      "Use balance-scale thinking to solve equations, explain inverse moves, match word statements and check unknown values.",
    includesAnswerSheet: false,
    fileName: APF_BALANCED_EQUATIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/lower-secondary/${APF_BALANCED_EQUATIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::lower-secondary::connect-tables-rules-and-graphs-in-functional-thinking",
    stepKey: "connect-tables-rules-and-graphs-in-functional-thinking",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 2,
    pathwayStepTitle:
      "Connect tables, rules, and graphs in functional thinking",
    title: "Connect Tables, Rules, And Graphs In Functional Thinking",
    concept:
      "Connect input-output tables, rules, plotted points, graphs and real-life function contexts.",
    includesAnswerSheet: false,
    fileName: APF_TABLES_RULES_GRAPHS_FUNCTIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/lower-secondary/${APF_TABLES_RULES_GRAPHS_FUNCTIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::years-9-10-consolidation::use-algebra-to-model-relationships-efficiently",
    stepKey: "use-algebra-to-model-relationships-efficiently",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 1,
    pathwayStepTitle: "Use algebra to model relationships efficiently",
    title: "Use Algebra To Model Relationships Efficiently",
    concept:
      "Use algebra rules, tables, substitution, graphs and real-world contexts to model relationships efficiently.",
    includesAnswerSheet: false,
    fileName: APF_ALGEBRA_MODELS_RELATIONSHIPS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/years-9-10-consolidation/${APF_ALGEBRA_MODELS_RELATIONSHIPS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::algebra-patterns-and-functions::years-9-10-consolidation::refine-explanation-checking-and-generalising",
    stepKey: "refine-explanation-checking-and-generalising",
    subjectKey: "mathematics",
    strandKey: "algebra-patterns-and-functions",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 2,
    pathwayStepTitle: "Refine explanation, checking, and generalising",
    title: "Refine Explanation, Checking, And Generalising",
    concept:
      "Explain rules, check solutions, interpret relationships, spot errors and generalise patterns clearly.",
    includesAnswerSheet: false,
    fileName: APF_EXPLANATION_CHECKING_GENERALISING_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/algebra-patterns-and-functions/years-9-10-consolidation/${APF_EXPLANATION_CHECKING_GENERALISING_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::foundation-kindergarten::compare-everyday-attributes-directly",
    stepKey: "compare-everyday-attributes-directly",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 1,
    pathwayStepTitle: "Compare everyday attributes directly",
    title: "Compare Everyday Attributes Directly",
    concept:
      "Compare everyday objects directly by length, height, capacity, mass, and same-or-different attributes.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_COMPARE_ATTRIBUTES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/foundation-kindergarten/${MEASUREMENT_COMPARE_ATTRIBUTES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::foundation-kindergarten::use-everyday-time-and-money-language-in-context",
    stepKey: "use-everyday-time-and-money-language-in-context",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 2,
    pathwayStepTitle: "Use everyday time and money language in context",
    title: "Use Everyday Time And Money Language In Context",
    concept:
      "Use everyday time words, order familiar daily events, recognise Australian coins, and compare simple costs.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_TIME_MONEY_LANGUAGE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/foundation-kindergarten/${MEASUREMENT_TIME_MONEY_LANGUAGE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::lower-primary::measure-with-informal-and-early-standard-units",
    stepKey: "measure-with-informal-and-early-standard-units",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 1,
    pathwayStepTitle: "Measure with informal and early standard units",
    title: "Measure With Informal And Early Standard Units",
    concept:
      "Measure lengths with blocks, paperclips and simple centimetre ruler readings, then compare and record results clearly.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_INFORMAL_STANDARD_UNITS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/lower-primary/${MEASUREMENT_INFORMAL_STANDARD_UNITS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::lower-primary::read-and-use-familiar-time-and-money-measures",
    stepKey: "read-and-use-familiar-time-and-money-measures",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 2,
    pathwayStepTitle: "Read and use familiar time and money measures",
    title: "Read And Use Familiar Time And Money Measures",
    concept:
      "Read o'clock times, match familiar events to times, count simple Australian coins, compare costs, and find simple shopping totals.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_FAMILIAR_TIME_MONEY_MEASURES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/lower-primary/${MEASUREMENT_FAMILIAR_TIME_MONEY_MEASURES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::middle-primary::choose-suitable-standard-units-and-measuring-tools",
    stepKey: "choose-suitable-standard-units-and-measuring-tools",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 1,
    pathwayStepTitle: "Choose suitable standard units and measuring tools",
    title: "Choose Suitable Standard Units And Measuring Tools",
    concept:
      "Choose sensible standard units and measuring tools for length, mass, capacity, time, and everyday contexts.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_STANDARD_UNITS_TOOLS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/middle-primary/${MEASUREMENT_STANDARD_UNITS_TOOLS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::middle-primary::estimate-and-check-practical-measurements",
    stepKey: "estimate-and-check-practical-measurements",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 2,
    pathwayStepTitle: "Estimate and check practical measurements",
    title: "Estimate And Check Practical Measurements",
    concept:
      "Estimate first, measure, compare, and reflect on whether practical measurements are close and reasonable.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_ESTIMATE_CHECK_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/middle-primary/${MEASUREMENT_ESTIMATE_CHECK_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::upper-primary::use-measurement-calculations-in-practical-tasks",
    stepKey: "use-measurement-calculations-in-practical-tasks",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 1,
    pathwayStepTitle: "Use measurement calculations in practical tasks",
    title: "Use Measurement Calculations In Practical Tasks",
    concept:
      "Use addition, subtraction and simple time reasoning with practical length, capacity, mass and everyday measurement contexts.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_CALCULATIONS_PRACTICAL_TASKS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/upper-primary/${MEASUREMENT_CALCULATIONS_PRACTICAL_TASKS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::upper-primary::use-fractions-decimals-and-conversions-in-measurement",
    stepKey: "use-fractions-decimals-and-conversions-in-measurement",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 2,
    pathwayStepTitle: "Use fractions, decimals, and conversions in measurement",
    title: "Use Fractions, Decimals, And Conversions In Measurement",
    concept:
      "Connect fraction, decimal and converted forms in practical metre, centimetre, litre and millilitre measurement contexts.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_FRACTIONS_DECIMALS_CONVERSIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/upper-primary/${MEASUREMENT_FRACTIONS_DECIMALS_CONVERSIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::lower-secondary::choose-precision-and-conversions-purposefully",
    stepKey: "choose-precision-and-conversions-purposefully",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 1,
    pathwayStepTitle: "Choose precision and conversions purposefully",
    title: "Choose Precision And Conversions Purposefully",
    concept:
      "Choose suitable units, convert measurements, compare precision, and judge whether practical measurements make sense.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_PRECISION_CONVERSIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/lower-secondary/${MEASUREMENT_PRECISION_CONVERSIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::lower-secondary::apply-measurement-reasoning-in-design-and-science-contexts",
    stepKey: "apply-measurement-reasoning-in-design-and-science-contexts",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "lower-secondary",
    stageDisplay: "Lower Secondary",
    stepNumber: 2,
    pathwayStepTitle: "Apply measurement reasoning in design and science contexts",
    title: "Apply Measurement Reasoning In Design And Science Contexts",
    concept:
      "Use measurement to plan, calculate, interpret data, and justify decisions in design and science contexts.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_DESIGN_SCIENCE_CONTEXTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/lower-secondary/${MEASUREMENT_DESIGN_SCIENCE_CONTEXTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::years-9-10-consolidation::use-measurement-confidently-in-modelling-and-design",
    stepKey: "use-measurement-confidently-in-modelling-and-design",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 1,
    pathwayStepTitle: "Use measurement confidently in modelling and design",
    title: "Use Measurement Confidently In Modelling And Design",
    concept:
      "Use measurement confidently to model playgrounds, garden boxes, tanks, plant growth, bookshelves and practical layouts.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_MODELLING_DESIGN_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/years-9-10-consolidation/${MEASUREMENT_MODELLING_DESIGN_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::measurement::years-9-10-consolidation::refine-judgement-about-reasonableness-and-accuracy",
    stepKey: "refine-judgement-about-reasonableness-and-accuracy",
    subjectKey: "mathematics",
    strandKey: "measurement",
    stageKey: "years-9-10-consolidation",
    stageDisplay: "Years 9-10 / consolidation",
    stepNumber: 2,
    pathwayStepTitle: "Refine judgement about reasonableness and accuracy",
    title: "Refine Judgement About Reasonableness And Accuracy",
    concept:
      "Judge whether measurements make sense, spot errors, compare accuracy, choose units, and explain measurement decisions.",
    includesAnswerSheet: false,
    fileName: MEASUREMENT_REASONABLENESS_ACCURACY_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/measurement/years-9-10-consolidation/${MEASUREMENT_REASONABLENESS_ACCURACY_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::foundation-kindergarten::recognise-familiar-shapes-in-everyday-life",
    stepKey: "recognise-familiar-shapes-in-everyday-life",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 1,
    pathwayStepTitle: "Recognise familiar shapes in everyday life",
    title: "Recognise Familiar Shapes In Everyday Life",
    concept:
      "Recognise circles, squares, triangles and rectangles in everyday objects, scenes and shape collections.",
    includesAnswerSheet: false,
    fileName: GSR_RECOGNISE_FAMILIAR_SHAPES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/foundation-kindergarten/${GSR_RECOGNISE_FAMILIAR_SHAPES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::foundation-kindergarten::use-position-and-direction-language-in-practical-movement",
    stepKey: "use-position-and-direction-language-in-practical-movement",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "foundation-kindergarten",
    stageDisplay: "Foundation / Kindergarten",
    stepNumber: 2,
    pathwayStepTitle: "Use position and direction language in practical movement",
    title: "Use Position And Direction Language In Practical Movement",
    concept:
      "Use position and direction words to describe object locations, follow movement instructions, and explain practical routes.",
    includesAnswerSheet: false,
    fileName: GSR_POSITION_DIRECTION_LANGUAGE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/foundation-kindergarten/${GSR_POSITION_DIRECTION_LANGUAGE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::lower-primary::describe-shape-features-and-simple-symmetry",
    stepKey: "describe-shape-features-and-simple-symmetry",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 1,
    pathwayStepTitle: "Describe shape features and simple symmetry",
    title: "Describe Shape Features And Simple Symmetry",
    concept:
      "Describe sides, corners and curved edges, compare familiar shapes, and recognise simple lines of symmetry.",
    includesAnswerSheet: false,
    fileName: GSR_SHAPE_FEATURES_SIMPLE_SYMMETRY_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/foundation-kindergarten/${GSR_SHAPE_FEATURES_SIMPLE_SYMMETRY_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::lower-primary::follow-and-create-simple-routes-or-arrangements",
    stepKey: "follow-and-create-simple-routes-or-arrangements",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 2,
    pathwayStepTitle: "Follow and create simple routes or arrangements",
    title: "Follow And Create Simple Routes Or Arrangements",
    concept:
      "Follow, trace, create and explain simple routes, paths, object arrangements and spatial plans.",
    includesAnswerSheet: false,
    fileName: GSR_SIMPLE_ROUTES_ARRANGEMENTS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/lower-primary/${GSR_SIMPLE_ROUTES_ARRANGEMENTS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::middle-primary::classify-shapes-and-reason-about-properties",
    stepKey: "classify-shapes-and-reason-about-properties",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 1,
    pathwayStepTitle: "Classify shapes and reason about properties",
    title: "Classify Shapes And Reason About Properties",
    concept:
      "Sort, compare and classify familiar shapes by sides, corners, angles, symmetry and other visible properties.",
    includesAnswerSheet: false,
    fileName: GSR_CLASSIFY_SHAPES_PROPERTIES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/middle-primary/${GSR_CLASSIFY_SHAPES_PROPERTIES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::middle-primary::use-grids-coordinates-and-simple-transformations",
    stepKey: "use-grids-coordinates-and-simple-transformations",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "middle-primary",
    stageDisplay: "Middle Primary",
    stepNumber: 2,
    pathwayStepTitle: "Use grids, coordinates, and simple transformations",
    title: "Use Grids, Coordinates, And Simple Transformations",
    concept:
      "Use grid coordinates to locate and plot objects, then describe simple slides, flips and turns.",
    includesAnswerSheet: false,
    fileName: GSR_GRIDS_COORDINATES_TRANSFORMATIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/middle-primary/${GSR_GRIDS_COORDINATES_TRANSFORMATIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::upper-primary::use-angles-turns-and-orientation-meaningfully",
    stepKey: "use-angles-turns-and-orientation-meaningfully",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 1,
    pathwayStepTitle: "Use angles, turns, and orientation meaningfully",
    title: "Use Angles, Turns, And Orientation Meaningfully",
    concept:
      "Use arrows, robot routes, right angles and turn language to describe direction, orientation and practical movement.",
    includesAnswerSheet: false,
    fileName: GSR_ANGLES_TURNS_ORIENTATION_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/upper-primary/${GSR_ANGLES_TURNS_ORIENTATION_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::upper-primary::visualise-and-build-shapes-in-two-and-three-dimensions",
    stepKey: "visualise-and-build-shapes-in-two-and-three-dimensions",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 2,
    pathwayStepTitle: "Visualise and build shapes in two and three dimensions",
    title: "Visualise And Build Shapes In Two And Three Dimensions",
    concept:
      "Classify 2D and 3D shapes, connect objects to shapes, count solid features, use nets, compare views and design with shapes.",
    includesAnswerSheet: false,
    fileName: GSR_VISUALISE_BUILD_2D_3D_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/upper-primary/${GSR_VISUALISE_BUILD_2D_3D_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::upper-primary::reason-about-geometric-relationships-and-transformations",
    stepKey: "reason-about-geometric-relationships-and-transformations",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 1,
    pathwayStepTitle: "Reason about geometric relationships and transformations",
    title: "Reason About Geometric Relationships And Transformations",
    concept:
      "Identify slides, flips and turns, describe transformations, reason about shape properties, and connect geometry to real-world design.",
    includesAnswerSheet: false,
    fileName: GSR_GEOMETRIC_RELATIONSHIPS_TRANSFORMATIONS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/lower-secondary/${GSR_GEOMETRIC_RELATIONSHIPS_TRANSFORMATIONS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::upper-primary::apply-spatial-reasoning-in-design-mapping-and-layout",
    stepKey: "apply-spatial-reasoning-in-design-mapping-and-layout",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 2,
    pathwayStepTitle: "Apply spatial reasoning in design, mapping, and layout",
    title: "Apply Spatial Reasoning In Design, Mapping, And Layout",
    concept:
      "Read maps, follow routes, design layouts, reason about floor plans, use scale, and apply compass directions in practical spatial planning.",
    includesAnswerSheet: false,
    fileName: GSR_SPATIAL_REASONING_DESIGN_MAPPING_LAYOUT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/lower-secondary/${GSR_SPATIAL_REASONING_DESIGN_MAPPING_LAYOUT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::upper-primary::use-geometry-to-model-and-interpret-space",
    stepKey: "use-geometry-to-model-and-interpret-space",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 1,
    pathwayStepTitle: "Use geometry to model and interpret space",
    title: "Use Geometry To Model And Interpret Space",
    concept:
      "Use classroom layouts, floor plans, architecture, block structures, scale drawings, maps and spatial designs to model and interpret space.",
    includesAnswerSheet: false,
    fileName: GSR_GEOMETRY_MODEL_INTERPRET_SPACE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/years-9-10-consolidation/${GSR_GEOMETRY_MODEL_INTERPRET_SPACE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::geometry-and-spatial-reasoning::upper-primary::refine-spatial-judgement-and-explanation",
    stepKey: "refine-spatial-judgement-and-explanation",
    subjectKey: "mathematics",
    strandKey: "geometry-and-spatial-reasoning",
    stageKey: "upper-primary",
    stageDisplay: "Upper Primary",
    stepNumber: 2,
    pathwayStepTitle: "Refine spatial judgement and explanation",
    title: "Refine Spatial Judgement And Explanation",
    concept:
      "Visualise, analyse maps, compare layouts, predict rotations, judge real spaces, build and explain structures, and evaluate spatial designs.",
    includesAnswerSheet: false,
    fileName: GSR_REFINE_SPATIAL_JUDGEMENT_EXPLANATION_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/geometry-and-spatial-reasoning/years-9-10-consolidation/${GSR_REFINE_SPATIAL_JUDGEMENT_EXPLANATION_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${SMALL_QUANTITIES_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${NUMBER_WORDS_TO_GROUPS_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${IDENTIFY_NUMERALS_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${COUNT_OBJECTS_TO_10_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${COUNT_OBJECTS_TO_20_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${COMPARE_GROUPS_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${ORDER_NUMBERS_SEQUENCE_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${PARTITION_COMBINE_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${OBJECT_STORIES_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${SHARE_EQUALLY_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/years-9-10-consolidation/${WORK_WITH_STANDARD_FORM_VERY_LARGE_SMALL_NUMBERS_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/years-9-10-consolidation/${USE_POWERS_ROOTS_INDICES_CONTEXT_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/years-9-10-consolidation/${CALCULATE_EXACTLY_FRACTIONS_MULTIPLES_PI_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/years-9-10-consolidation/${WORK_WITH_PERCENTAGE_CHANGE_GROWTH_DECAY_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/years-9-10-consolidation/${APPLY_RATIO_PROPORTION_RATES_CHANGE_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/years-9-10-consolidation/${USE_NUMBER_SKILLS_ALGEBRAIC_GRAPHICAL_CONTEXTS_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/years-9-10-consolidation/${SOLVE_FINANCIAL_REAL_WORLD_MODELLING_PROBLEMS_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/years-9-10-consolidation/${INTERPRET_LIMITS_ACCURACY_ROUNDING_WORKSHEET_FILE}`,
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
    href: `/resources/worksheets/maths/number-and-place-value/years-9-10-consolidation/${SELECT_EFFICIENT_CALCULATION_STRATEGIES_WORKSHEET_FILE}`,
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

  const exactResource = MATH_WORKSHEET_RESOURCES.find((resource) => {
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
  });

  if (exactResource) return exactResource;

  const stageAgnosticMatches = MATH_WORKSHEET_RESOURCES.filter(
    (resource) =>
      Boolean(stepKey) &&
      resource.stepKey === stepKey &&
      resource.subjectKey === subjectKey &&
      resource.strandKey === strandKey,
  );

  return stageAgnosticMatches.length === 1 ? stageAgnosticMatches[0] : null;
}
