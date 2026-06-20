export type ActivityV5Mode = "practise" | "assess";

export type ActivityV5InteractionType =
  | "drag_to_place"
  | "click_objects"
  | "plot_coordinates"
  | "rotate_shape"
  | "flip_reflection"
  | "build_array"
  | "equal_groups"
  | "two_pan_balance"
  | "move_along_route"
  | "interactive_ruler"
  | "interactive_capacity_jug"
  | "interactive_mass_scale"
  | "interactive_clock"
  | "interactive_fraction_bar"
  | "fraction_comparison"
  | "interactive_number_line"
  | "build_place_value"
  | "generic_money_model";

export type ActivityV5VisualModel =
  | "shape_board"
  | "route_grid"
  | "coordinate_grid"
  | "turn_board"
  | "reflection_grid"
  | "array_board"
  | "equal_groups_board"
  | "two_pan_balance_board"
  | "ruler_board"
  | "capacity_jug"
  | "mass_scale"
  | "clock_face"
  | "fraction_bar"
  | "fraction_comparison_board"
  | "number_line"
  | "place_value_blocks"
  | "money_board";

export type ActivityV5Object = {
  id: string;
  label: string;
  type?: string;
  value?: number | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  draggable?: boolean;
  selectable?: boolean;
};

export type ActivityV5Target = {
  id: string;
  label: string;
  x?: number;
  y?: number;
  accepts?: string[];
};

export type ActivityV5FractionSpec = {
  numerator: number;
  denominator: number;
  wholeCount?: number;
  decimalEquivalent?: number;
};

export type ActivityV5PriceTag = {
  id: string;
  label: string;
  value: number;
};

export type ActivityV5BalanceItem = {
  id: string;
  label: string;
  value?: number;
  unknown?: boolean;
};

export type ActivityV5ResponseState = {
  placements?: Record<string, string>;
  selectedObjectIds?: string[];
  plottedCoordinates?: string[];
  orientation?: number;
  reflectedCells?: string[];
  rows?: number;
  columns?: number;
  targetRows?: number;
  targetColumns?: number;
  total?: number;
  targetTotal?: number;
  groupCount?: number;
  itemsPerGroup?: number;
  targetGroupCount?: number;
  targetItemsPerGroup?: number;
  selectedObjects?: string[];
  arrangementMode?: "array" | "equal_groups" | "repeated_addition" | "division_sharing";
  allowCommutativeArrays?: boolean;
  repeatedAdditionSentence?: string;
  multiplicationSentence?: string;
  divisionSentence?: string;
  leftItems?: ActivityV5BalanceItem[];
  rightItems?: ActivityV5BalanceItem[];
  leftTotal?: number;
  rightTotal?: number;
  targetBalance?: "balanced" | "left_heavier" | "right_heavier";
  selectedBalance?: "balanced" | "left_heavier" | "right_heavier";
  unknownSide?: "left" | "right";
  unknownValue?: number;
  equationText?: string;
  balanceMode?: "compare" | "solve_unknown" | "build_balance";
  allowEquivalentValues?: boolean;
  routePath?: string[];
  finalPosition?: string;
  unit?: "cm" | "mm" | "m" | string;
  conversionMode?: boolean;
  targetLength?: number;
  measuredLength?: number;
  targetCapacity?: number;
  measuredCapacity?: number;
  containerLabel?: string;
  containerVisual?: string;
  fillLevel?: number;
  targetMass?: number;
  measuredMass?: number;
  scaleType?: "digital" | "balance" | "kitchen";
  objectLabel?: string;
  objectVisual?: string;
  estimate?: number;
  showEstimate?: boolean;
  hour?: number;
  minute?: number;
  targetHour?: number;
  targetMinute?: number;
  allowedMinutes?: number[];
  clockMode?: "read" | "set" | "match";
  eventContext?: string;
  shadedParts?: number;
  denominator?: number;
  wholeCount?: number;
  targetNumerator?: number;
  targetDenominator?: number;
  selectedParts?: number[];
  allowedFractions?: ActivityV5FractionSpec[];
  equivalentAccepted?: boolean;
  decimalEquivalent?: number;
  leftFraction?: ActivityV5FractionSpec;
  rightFraction?: ActivityV5FractionSpec;
  comparisonAnswer?: "left" | "right" | "equal";
  leftLabel?: string;
  rightLabel?: string;
  labelMode?: "fraction" | "decimal" | "percent" | "mixed" | "analogue" | "digital" | "both" | "ticks" | "numeric";
  promptValue?: number | string;
  numberLineValue?: number | string;
  tens?: number;
  ones?: number;
  hundreds?: number;
  currencySymbol?: string;
  currencyCode?: string;
  localisationMode?: "generic" | "AU" | "UK" | "US";
  tokenValues?: number[];
  selectedTokens?: number[];
  priceTags?: ActivityV5PriceTag[];
  selectedPriceTagId?: string;
  itemContext?: string;
  showNotes?: boolean;
  showCoins?: boolean;
  allowMultipleTokens?: boolean;
  moneyTotal?: number;
  selectedTokenIds?: string[];
  selectedOption?: string;
  min?: number;
  max?: number;
  step?: number;
  tickLabels?: Record<string, string>;
  targetValue?: number | string;
  allowedValues?: Array<number | string>;
  placedValue?: number | string;
};

export type ActivityV5CorrectState = ActivityV5ResponseState & {
  tolerance?: number;
  acceptedOptions?: string[];
};

export type ActivityV5Feedback = {
  correct: string;
  incorrect: string;
  hint?: string;
};

export type ActivityV5 = {
  id: string;
  strand: string;
  step: string;
  mode: ActivityV5Mode;
  prompt: string;
  instruction: string;
  interactionType: ActivityV5InteractionType;
  visualModel: ActivityV5VisualModel;
  objects: ActivityV5Object[];
  targets: ActivityV5Target[];
  correctState: ActivityV5CorrectState;
  feedback: ActivityV5Feedback;
  supportHint?: string;
  answerOptions?: string[];
  randomisationSeed?: string;
  worksheetReference?: string;
  metadata?: Record<string, unknown>;
};

export type ActivityV5CheckResult = {
  correct: boolean;
  message: string;
  expectedSummary: string;
};

export type ActivityPlayerV5Props = {
  activities: ActivityV5[];
  chrome?: "standalone" | "embedded";
  onSubmitAnswer?: (input: {
    activity: ActivityV5;
    response: ActivityV5ResponseState;
    correct: boolean;
    index: number;
  }) => void;
  onComplete?: () => void;
};
