import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentDepthItemCount,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export const STATISTICS_DATA_STRAND_KEY = "statistics-and-data";
export const STATISTICS_DATA_PARENT_FAMILY_KEY = "statistics-and-data-foundations";
export const STATISTICS_DATA_PARENT_FAMILY_TITLE = "Statistics and data";
export const STATISTICS_DATA_ITEM_BANK_KEY =
  "statistics-and-data-step-assessment-items-v1";
export const STATISTICS_DATA_SOURCE_ROUTE = "/assessments/number";

type StatisticsCase = {
  title: string;
  prompt: string;
  practicePrompt: string;
  options: string[];
  answer: string;
  visual: string;
  cluster: string;
  clusterTitle: string;
  misconceptionTargets: string[];
};

export type StatisticsDataStepSpec = {
  order: number;
  stepNumber: number;
  stageKey: CleanAssessmentStageKey;
  stageTitle: string;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  cases: StatisticsCase[];
};

export type StatisticsDataStepAssessment = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof STATISTICS_DATA_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentBankKey: typeof STATISTICS_DATA_PARENT_FAMILY_KEY;
  parentBankTitle: typeof STATISTICS_DATA_PARENT_FAMILY_TITLE;
  parentItemBankKey: typeof STATISTICS_DATA_ITEM_BANK_KEY;
  progressionBandKey: typeof STATISTICS_DATA_PARENT_FAMILY_KEY;
  sourceRoute: typeof STATISTICS_DATA_SOURCE_ROUTE;
  depthOptions: typeof NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS;
  items: NumberAssessmentBankItem[];
};

type StepAssessmentContext = {
  stepKey?: string | null;
  pathwayStepId?: string | null;
  stepAssessmentKey?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function visual(description: string) {
  return { type: "context_card" as const, description };
}

function numbers(caption: string, values: Array<string | number>) {
  return `early-number|caption=${caption}|numbers=${values.join(",")}`;
}

function groups(caption: string, counts: number[], labels: string[] = counts.map(String)) {
  return `early-number|caption=${caption}|groups=${counts.join(",")}|labels=${labels.join(",")}`;
}

function makeCase(
  title: string,
  prompt: string,
  practicePrompt: string,
  options: string[],
  answer: string,
  visualDescription: string,
  cluster: string,
  clusterTitle: string,
  misconceptionTargets: string[],
): StatisticsCase {
  return {
    title,
    prompt,
    practicePrompt,
    options,
    answer,
    visual: visualDescription,
    cluster,
    clusterTitle,
    misconceptionTargets,
  };
}

function itemId(spec: StatisticsDataStepSpec, index: number) {
  return `statistics-data-step-${spec.order}-assess-${String(index + 1).padStart(
    3,
    "0",
  )}`;
}

function makeItem(
  spec: StatisticsDataStepSpec,
  item: StatisticsCase,
  index: number,
): NumberAssessmentBankItem {
  return {
    id: itemId(spec, index),
    progressionBandKey: STATISTICS_DATA_PARENT_FAMILY_KEY,
    progressionStepKey: spec.stepKey,
    subElementKey: item.cluster,
    subElementTitle: item.clusterTitle,
    subElementDescription: spec.description,
    title: item.title,
    prompt: item.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "statistics_data_visual_card",
    options: item.options,
    expectedAnswer: item.answer,
    acceptableAnswers: [item.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: item.answer,
    misconceptionTargets: item.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: spec.stepKey,
      ifCorrectGoToStepKey: spec.stepKey,
      practiceRecommendation: `Practise ${spec.shortTitle.toLowerCase()} with sorting cards, tally charts, graph cards, tables, and data-claim contexts.`,
      diagnosticNote: `Checks whether the learner can use ${spec.shortTitle.toLowerCase()} for this exact pathway step.`,
    },
    visualSupport: visual(item.visual),
  };
}

const STATISTICS_STEP_TITLES: Array<
  [string, string, CleanAssessmentStageKey, string, number, string, string]
> = [
  ["Sort and group familiar information", "sort-and-group-familiar-information", "foundation-kindergarten", "Foundation / Kindergarten", 1, "Sorting familiar information", "Sort familiar items into sensible groups and notice simple patterns."],
  ["Talk about most, least, and same in simple data", "talk-about-most-least-and-same-in-simple-data", "foundation-kindergarten", "Foundation / Kindergarten", 2, "Most, least, and same", "Use most, least, and same language to describe simple data groups."],
  ["Collect and record simple data", "collect-and-record-simple-data", "lower-primary", "Lower Primary", 1, "Collect and record data", "Gather simple information and record it clearly with tallies, marks, or symbols."],
  ["Read and discuss simple graphs", "read-and-discuss-simple-graphs", "lower-primary", "Lower Primary", 2, "Simple graph interpretation", "Read simple picture or bar graphs and describe what they show."],
  ["Choose useful ways to organise and display data", "choose-useful-ways-to-organise-and-display-data", "middle-primary", "Middle Primary", 1, "Organise and display data", "Choose useful tables, tally charts, or graphs to show data clearly."],
  ["Compare categories and describe trends", "compare-categories-and-describe-trends", "middle-primary", "Middle Primary", 2, "Compare categories and trends", "Compare categories and describe patterns or trends supported by data."],
  ["Interpret richer graphs and summary measures", "interpret-richer-graphs-and-summary-measures", "upper-primary", "Upper Primary", 1, "Richer graphs and summaries", "Use richer graphs, tables, totals, averages, and ranges to interpret data."],
  ["Question displays and simple data claims", "question-displays-and-simple-data-claims", "upper-primary", "Upper Primary", 2, "Question displays and claims", "Notice when displays, survey questions, or claims need careful interpretation."],
  ["Interpret data using percentages, comparisons, and trends", "interpret-data-using-percentages-comparisons-and-trends", "lower-secondary", "Lower Secondary", 1, "Percentages, comparisons, and trends", "Use percentages, rates, comparisons, and trend language to interpret data more precisely."],
  ["Judge whether data supports a claim", "judge-whether-data-supports-a-claim", "lower-secondary", "Lower Secondary", 2, "Data-supported claims", "Decide whether a conclusion is justified by the data and identify missing evidence."],
  ["Interpret data critically across real contexts", "interpret-data-critically-across-real-contexts", "years-9-10-consolidation", "Years 9-10 / consolidation", 1, "Critical data interpretation", "Interpret realistic data sets with attention to patterns, variability, outliers, and uncertainty."],
  ["Refine explanation, questioning, and evidence use", "refine-explanation-questioning-and-evidence-use", "years-9-10-consolidation", "Years 9-10 / consolidation", 2, "Explain, question, and use evidence", "Communicate data conclusions clearly while questioning weak evidence and limits."],
];

const CASE_BUILDERS: Array<() => StatisticsCase[]> = [
  () => [
    makeCase("Fruit sort", "Which group should the apple go in?", "Look at the sorting rule, then place the item.", ["fruit", "toy", "clothing"], "fruit", numbers("Sorting cards.", ["apple", "banana", "ball", "sock"]), "sorting", "Sorting", ["category-feature-gap"]),
    makeCase("Colour group", "Which item belongs in the blue group?", "Use colour as the rule.", ["blue car", "red cup", "green leaf"], "blue car", numbers("Rule: blue items.", ["blue car", "red cup", "green leaf"]), "sorting", "Sorting", ["wrong-attribute"]),
    makeCase("Shape group", "Which card belongs with circles?", "Use shape, not colour.", ["circle button", "square tile", "triangle flag"], "circle button", numbers("Circle group.", ["circle", "square", "triangle"]), "classification", "Classification", ["colour-over-shape"]),
    makeCase("Animal group", "Which belongs with animals?", "Check what kind of item it is.", ["cat", "chair", "spoon"], "cat", numbers("Animal sorting.", ["dog", "bird", "cat"]), "classification", "Classification", ["category-vocabulary-gap"]),
    makeCase("Does not fit", "Which item does not fit the fruit group?", "Find the item outside the rule.", ["truck", "pear", "orange"], "truck", numbers("Fruit group with one mismatch.", ["pear", "orange", "truck"]), "exceptions", "Exceptions", ["ignores-outlier"]),
    makeCase("Same group", "Which two items could go in the same group?", "Choose items sharing a feature.", ["red ball and red hat", "red ball and blue book", "hat and sandwich"], "red ball and red hat", numbers("Shared feature cards.", ["red ball", "red hat", "blue book"]), "sorting", "Sorting", ["shared-feature-gap"]),
    makeCase("Sorting rule", "Buttons are sorted into big and small. What is the rule?", "Name the attribute used.", ["size", "day", "sound"], "size", numbers("Big and small button groups.", ["big", "small"]), "rule-language", "Rule language", ["attribute-language-gap"]),
    makeCase("Useful group", "Which group helps answer 'What snacks do we have?'", "Choose a useful food grouping.", ["snacks", "things with wheels", "things that fly"], "snacks", numbers("Question and group.", ["snack question"]), "purpose", "Purposeful sorting", ["irrelevant-grouping"]),
    makeCase("Count groups", "There are 4 red blocks and 2 blue blocks. Which group has more?", "Compare the grouped counts.", ["red blocks", "blue blocks", "same"], "red blocks", groups("Grouped blocks.", [4, 2], ["red", "blue"]), "compare-groups", "Compare groups", ["more-less-confusion"]),
    makeCase("Same amount", "Which groups have the same number?", "Compare the two group counts.", ["3 shells and 3 stones", "4 shells and 2 stones", "5 shells and 1 stone"], "3 shells and 3 stones", groups("Same-count groups.", [3, 3], ["shells", "stones"]), "compare-groups", "Compare groups", ["same-vs-similar"]),
    makeCase("Better sort", "Which sorting rule is clearer for toy cars and toy trains?", "Choose a rule someone else can follow.", ["type of toy", "favourite one", "nice things"], "type of toy", numbers("Toy transport cards.", ["cars", "trains"]), "rule-quality", "Rule quality", ["unclear-rule"]),
    makeCase("What was noticed", "A group has 5 leaves and 1 flower. What can you say?", "Use the grouped information.", ["there are more leaves", "there are more flowers", "they are the same"], "there are more leaves", groups("Nature cards.", [5, 1], ["leaves", "flowers"]), "data-talk", "Data talk", ["does-not-compare-counts"]),
  ],
  () => [
    makeCase("Most votes", "Which category has the most votes?", "Compare the group sizes.", ["dogs", "cats", "fish"], "dogs", groups("Pet votes.", [6, 3, 2], ["dogs", "cats", "fish"]), "most-least", "Most and least", ["reads-first-category-only"]),
    makeCase("Fewest votes", "Which category has the least?", "Find the smallest group.", ["fish", "dogs", "cats"], "fish", groups("Pet votes.", [6, 3, 2], ["dogs", "cats", "fish"]), "most-least", "Most and least", ["most-least-confusion"]),
    makeCase("Same count", "Which groups are the same?", "Look for matching counts.", ["red and blue", "red and green", "blue and green"], "red and blue", groups("Colour choices.", [4, 4, 2], ["red", "blue", "green"]), "same", "Same amount", ["same-label-gap"]),
    makeCase("More than", "Banana has 5 votes and apple has 3. Which has more?", "Compare 5 and 3.", ["banana", "apple", "same"], "banana", groups("Snack votes.", [5, 3], ["banana", "apple"]), "compare", "Compare data", ["number-comparison-slip"]),
    makeCase("Less than", "Which group has fewer: 2 sunny days or 5 rainy days?", "Compare the counts.", ["sunny", "rainy", "same"], "sunny", groups("Weather days.", [2, 5], ["sunny", "rainy"]), "compare", "Compare data", ["fewer-vocabulary-gap"]),
    makeCase("Data statement", "Which statement matches the picture graph?", "Use the graph counts.", ["dogs were most popular", "fish were most popular", "cats and fish were the same"], "dogs were most popular", groups("Pet graph.", [7, 4, 1], ["dogs", "cats", "fish"]), "statements", "Data statements", ["unsupported-statement"]),
    makeCase("Equal groups", "Two groups both have 6. What word fits?", "Use comparison language.", ["same", "least", "more"], "same", groups("Equal groups.", [6, 6], ["A", "B"]), "same", "Same amount", ["comparison-word-confusion"]),
    makeCase("Most common", "Which choice was most common?", "Most common means the biggest count.", ["blue", "green", "yellow"], "blue", groups("Favourite colours.", [8, 5, 3], ["blue", "green", "yellow"]), "most-least", "Most and least", ["common-vocabulary-gap"]),
    makeCase("Least common", "Which choice was least common?", "Least common means the smallest count.", ["yellow", "blue", "green"], "yellow", groups("Favourite colours.", [8, 5, 3], ["blue", "green", "yellow"]), "most-least", "Most and least", ["least-vocabulary-gap"]),
    makeCase("Compare two", "Cars have 4 votes and bikes have 6. Which has 2 more?", "Compare the counts.", ["bikes", "cars", "same"], "bikes", groups("Transport votes.", [4, 6], ["cars", "bikes"]), "compare", "Compare data", ["difference-gap"]),
    makeCase("Simple conclusion", "What does this data show: 1 soup vote, 6 pasta votes?", "Choose the supported statement.", ["pasta was chosen more", "soup was chosen more", "no one chose pasta"], "pasta was chosen more", groups("Lunch choices.", [1, 6], ["soup", "pasta"]), "statements", "Data statements", ["conclusion-not-supported"]),
    makeCase("No data", "Can you tell the favourite colour if no votes were counted?", "Think about evidence.", ["no", "yes", "only if blue"], "no", numbers("No vote cards yet.", ["no data"]), "evidence", "Evidence", ["claims-without-data"]),
  ],
  () => [
    makeCase("Tally total", "How many votes are shown by ||||?", "Count the tally marks.", ["4", "5", "3"], "4", numbers("Tally marks.", ["||||"]), "tallies", "Tallies", ["tally-count-error"]),
    makeCase("Five tally", "Which tally shows 5?", "Look for a group of five marks.", ["||||/", "|||", "||||"], "||||/", numbers("Tally group of five.", ["||||/"]), "tallies", "Tallies", ["five-tally-gap"]),
    makeCase("Record choice", "Which record is clearest for favourite fruit votes?", "Choose a countable record.", ["tally chart", "random drawing", "blank page"], "tally chart", numbers("Recording choices.", ["tally chart", "blank"]), "recording", "Recording", ["record-purpose-gap"]),
    makeCase("Survey question", "Which question can collect simple data?", "Choose a countable question.", ["What fruit do you like best?", "Is fruit nice?", "Tell me everything"], "What fruit do you like best?", numbers("Survey question cards.", ["fruit choices"]), "questions", "Questions", ["unclear-question"]),
    makeCase("Count data", "A tally chart has apple 3 and pear 6. How many pear votes?", "Read the table row.", ["6", "3", "9"], "6", numbers("Tally chart.", ["apple 3", "pear 6"]), "read-records", "Read records", ["reads-wrong-row"]),
    makeCase("Collect fairly", "How should each person vote in a class survey?", "Use one response per person.", ["one vote each", "some people vote twice", "teacher guesses"], "one vote each", numbers("Survey rule.", ["one person", "one vote"]), "fair-collection", "Fair collection", ["duplicate-votes"]),
    makeCase("Missing total", "There are 2 cat votes and 4 dog votes. How many votes altogether?", "Add the recorded counts.", ["6", "4", "2"], "6", groups("Pet vote counts.", [2, 4], ["cat", "dog"]), "totals", "Totals", ["does-not-total"]),
    makeCase("Symbol record", "In a picture graph, one star means one vote. How many votes are 4 stars?", "Use the key.", ["4", "1", "8"], "4", numbers("Picture graph key.", ["star=1", "****"]), "picture-graphs", "Picture graphs", ["graph-key-error"]),
    makeCase("Clear label", "What should a tally chart include?", "Charts need category labels.", ["category labels", "only colours", "no headings"], "category labels", numbers("Tally chart parts.", ["category", "tally", "total"]), "recording", "Recording", ["missing-labels"]),
    makeCase("Best data", "Which data answers 'How many rainy days this week?'", "Choose the relevant record.", ["weather tally", "favourite food tally", "shoe-size list"], "weather tally", numbers("Question and data source.", ["rainy days"]), "relevance", "Relevant data", ["irrelevant-data-source"]),
    makeCase("Table total", "A table shows red 5, blue 3, green 2. How many votes?", "Add all rows.", ["10", "8", "5"], "10", numbers("Vote table.", ["red 5", "blue 3", "green 2"]), "totals", "Totals", ["partial-total"]),
    makeCase("Explain record", "What does each tally mark usually show?", "Connect marks to counted items.", ["one response or item", "five every time", "a category name"], "one response or item", numbers("Tally meaning.", ["| = one"]), "recording", "Recording", ["tally-meaning-gap"]),
  ],
  () => [
    makeCase("Most in graph", "Which category has the tallest bar?", "Find the tallest bar.", ["blue", "red", "green"], "blue", groups("Bar graph.", [3, 7, 4], ["red", "blue", "green"]), "read-graphs", "Read graphs", ["bar-height-error"]),
    makeCase("Fewest in graph", "Which category has the fewest?", "Find the shortest bar.", ["red", "blue", "green"], "red", groups("Bar graph.", [3, 7, 4], ["red", "blue", "green"]), "read-graphs", "Read graphs", ["fewest-error"]),
    makeCase("Graph total", "A picture graph shows 4 apples and 5 pears. How many pictures?", "Add the pictures.", ["9", "5", "4"], "9", groups("Picture graph.", [4, 5], ["apples", "pears"]), "totals", "Graph totals", ["partial-total"]),
    makeCase("Equal bars", "Which bars are equal?", "Look for matching heights.", ["cats and dogs", "cats and birds", "dogs and fish"], "cats and dogs", groups("Pet graph.", [5, 5, 2], ["cats", "dogs", "birds"]), "compare-graphs", "Compare graphs", ["equal-height-gap"]),
    makeCase("Graph title", "What does a graph title tell you?", "Think about what the graph is about.", ["the graph topic", "the answer to every question", "the tallest bar only"], "the graph topic", numbers("Graph parts.", ["title", "labels", "bars"]), "graph-features", "Graph features", ["title-purpose-gap"]),
    makeCase("Axis labels", "Why do graph labels matter?", "Labels tell what categories and numbers mean.", ["they explain the data", "they decorate the graph", "they make bars taller"], "they explain the data", numbers("Graph labels.", ["category", "count"]), "graph-features", "Graph features", ["label-purpose-gap"]),
    makeCase("Difference", "A graph shows 8 sunny days and 5 rainy days. How many more sunny?", "Compare the two counts.", ["3", "13", "5"], "3", groups("Weather graph.", [8, 5], ["sunny", "rainy"]), "compare-graphs", "Compare graphs", ["adds-instead-of-subtracts"]),
    makeCase("Supported statement", "Which statement is supported by the graph?", "Use the displayed counts.", ["blue has more than green", "green has most", "red and blue are same"], "blue has more than green", groups("Colour graph.", [4, 8, 6], ["red", "blue", "green"]), "statements", "Data statements", ["unsupported-claim"]),
    makeCase("Picture key", "Each picture means 2 votes. Three pictures mean?", "Use the graph key.", ["6 votes", "3 votes", "2 votes"], "6 votes", numbers("Picture graph key.", ["picture=2", "3 pictures"]), "picture-graphs", "Picture graphs", ["key-not-used"]),
    makeCase("Read row", "A table says Monday 12, Tuesday 9. Which day has fewer?", "Compare the table values.", ["Tuesday", "Monday", "same"], "Tuesday", numbers("Table row values.", ["Mon 12", "Tue 9"]), "tables", "Tables", ["table-row-error"]),
    makeCase("Graph match", "Which graph matches red 2, blue 5?", "Choose bars with those heights.", ["red shorter than blue", "red taller than blue", "both equal"], "red shorter than blue", groups("Data: red 2, blue 5.", [2, 5], ["red", "blue"]), "display-match", "Display match", ["graph-data-mismatch"]),
    makeCase("Graph conclusion", "What does the graph show overall?", "Look across categories.", ["blue is the most common choice", "red has no votes", "all categories are equal"], "blue is the most common choice", groups("Colour graph.", [4, 9, 6], ["red", "blue", "green"]), "interpretation", "Interpretation", ["overclaims-graph"]),
  ],
  () => [
    makeCase("Best display", "Which display is useful for comparing favourite sports counts?", "Choose a display for category counts.", ["bar graph", "clock face", "number line only"], "bar graph", numbers("Display choices.", ["sports counts", "bar graph"]), "display-choice", "Display choice", ["wrong-display-type"]),
    makeCase("Table use", "Which display is useful for exact values in rows?", "Tables show values clearly.", ["table", "unlabelled picture", "random drawing"], "table", numbers("Display choices.", ["table rows"]), "display-choice", "Display choice", ["display-purpose-gap"]),
    makeCase("Tally use", "Which display helps while collecting votes?", "Tallies are useful during collection.", ["tally chart", "line graph", "calendar only"], "tally chart", numbers("Collecting votes.", ["tally"]), "display-choice", "Display choice", ["collection-display-gap"]),
    makeCase("Graph from data", "Which graph matches apples 4, pears 6, bananas 2?", "Look for bars 4, 6, and 2.", ["pear tallest, banana shortest", "apple tallest", "all equal"], "pear tallest, banana shortest", groups("Fruit data.", [4, 6, 2], ["apples", "pears", "bananas"]), "display-match", "Display match", ["data-display-mismatch"]),
    makeCase("Useful labels", "What makes a data display easier to read?", "Choose clear display features.", ["title and labels", "no labels", "tiny bars only"], "title and labels", numbers("Display features.", ["title", "labels", "scale"]), "display-quality", "Display quality", ["missing-labels"]),
    makeCase("Choose scale", "A graph has values up to 40. Which scale is sensible?", "Use a scale that reaches the data.", ["0 to 40", "0 to 5", "100 to 200"], "0 to 40", numbers("Graph scale.", ["max 40"]), "scale", "Graph scale", ["scale-range-error"]),
    makeCase("Frequency table", "Which table shows how often each choice happened?", "Frequency means count.", ["choice and count table", "story paragraph", "calendar"], "choice and count table", numbers("Frequency table.", ["choice", "count"]), "frequency", "Frequency", ["frequency-vocabulary-gap"]),
    makeCase("Grouped display", "Which display helps compare boys and girls by activity?", "Use a display with categories and groups.", ["grouped bar graph", "single picture", "clock"], "grouped bar graph", numbers("Grouped comparison.", ["activity", "group"]), "display-choice", "Display choice", ["multi-category-gap"]),
    makeCase("Data order", "Which organisation helps find the largest number?", "Ordering helps comparison.", ["sort values from smallest to largest", "hide the values", "mix labels"], "sort values from smallest to largest", numbers("Ordered data.", [2, 4, 7, 9]), "organisation", "Organisation", ["organisation-purpose-gap"]),
    makeCase("Display purpose", "A line graph is most useful for?", "Line graphs show change over time.", ["showing change over time", "sorting shoes by colour", "showing one object"], "showing change over time", numbers("Display purposes.", ["time", "line graph"]), "display-choice", "Display choice", ["line-graph-purpose-gap"]),
    makeCase("Clear table", "Which table layout is clearest?", "Use labelled columns.", ["Category | Count", "Count only", "No headings"], "Category | Count", numbers("Table headings.", ["Category", "Count"]), "display-quality", "Display quality", ["heading-gap"]),
    makeCase("Justify display", "Why choose a bar graph for snack votes?", "Snack votes are category counts.", ["it compares category counts clearly", "it tells the time", "it measures length"], "it compares category counts clearly", groups("Snack counts.", [5, 8, 3], ["fruit", "crackers", "yoghurt"]), "reasoning", "Display reasoning", ["display-justification-gap"]),
  ],
  () => [
    makeCase("Category comparison", "Which category increased from week 1 to week 2?", "Compare the two week values.", ["reading", "swimming", "cycling"], "reading", numbers("Weekly table.", ["reading 4->7", "swimming 5->5", "cycling 6->3"]), "trends", "Trends", ["trend-direction-error"]),
    makeCase("Decreasing trend", "Which data shows a decrease?", "Look for values going down.", ["9, 7, 5", "2, 4, 6", "5, 5, 5"], "9, 7, 5", numbers("Trend cards.", ["9,7,5", "2,4,6", "5,5,5"]), "trends", "Trends", ["increase-decrease-confusion"]),
    makeCase("Similar categories", "Which two categories are similar?", "Compare close values.", ["A 10 and B 11", "A 10 and C 3", "B 11 and C 3"], "A 10 and B 11", numbers("Category values.", ["A 10", "B 11", "C 3"]), "compare", "Compare categories", ["similarity-gap"]),
    makeCase("Big difference", "Which comparison has the biggest difference?", "Subtract or compare gaps.", ["20 and 5", "12 and 10", "8 and 7"], "20 and 5", numbers("Difference cards.", ["20 vs 5", "12 vs 10", "8 vs 7"]), "compare", "Compare categories", ["difference-size-error"]),
    makeCase("Trend statement", "Which statement fits 3, 5, 8, 11?", "Look at the overall direction.", ["the values go up", "the values go down", "the values stay same"], "the values go up", numbers("Trend sequence.", [3, 5, 8, 11]), "trends", "Trends", ["single-value-focus"]),
    makeCase("Evidence claim", "Which evidence supports 'rain increased'?", "Use the data values.", ["rain days 2 then 5", "rain days 5 then 2", "rain days 3 then 3"], "rain days 2 then 5", numbers("Weather evidence.", ["2->5", "5->2", "3->3"]), "evidence", "Evidence", ["claim-evidence-mismatch"]),
    makeCase("Compare categories", "A graph shows apples 12 and pears 7. How many more apples?", "Find the difference.", ["5", "19", "7"], "5", groups("Fruit categories.", [12, 7], ["apples", "pears"]), "compare", "Compare categories", ["adds-instead-of-compares"]),
    makeCase("Stable trend", "Which data is stable?", "Look for little or no change.", ["6, 6, 7, 6", "1, 4, 8, 12", "12, 8, 4, 1"], "6, 6, 7, 6", numbers("Trend types.", ["stable", "increasing", "decreasing"]), "trends", "Trends", ["variation-language-gap"]),
    makeCase("Supported pattern", "Which statement is supported by the table?", "Match the claim to data.", ["week 3 had the most sales", "week 1 had no sales", "sales were equal each week"], "week 3 had the most sales", numbers("Sales table.", ["W1 8", "W2 12", "W3 15"]), "statements", "Data statements", ["unsupported-pattern"]),
    makeCase("Trend over time", "Which display would best show temperature across a week?", "Change over time is often shown with a line graph.", ["line graph", "shape card", "clock only"], "line graph", numbers("Temperature over days.", ["Mon", "Tue", "Wed"]), "display-choice", "Display choice", ["trend-display-gap"]),
    makeCase("Careful wording", "Which claim is careful?", "Avoid overclaiming.", ["more students chose soccer in this survey", "everyone likes soccer", "no one likes music"], "more students chose soccer in this survey", groups("Activity survey.", [9, 4], ["soccer", "music"]), "communication", "Data communication", ["overgeneralisation"]),
    makeCase("Compare totals", "Class A has 18 votes and Class B has 24. Which is true?", "Compare totals.", ["Class B has 6 more", "Class A has 6 more", "They are equal"], "Class B has 6 more", numbers("Class totals.", [18, 24]), "compare", "Compare categories", ["difference-error"]),
  ],
  () => [
    makeCase("Find average", "The scores are 4, 6, and 8. What is the mean?", "Add and divide by 3.", ["6", "18", "8"], "6", numbers("Mean card.", [4, 6, 8]), "summaries", "Summary measures", ["mean-procedure-error"]),
    makeCase("Find range", "The values are 3, 9, 10. What is the range?", "Largest minus smallest.", ["7", "10", "3"], "7", numbers("Range card.", [3, 9, 10]), "summaries", "Summary measures", ["range-vs-largest"]),
    makeCase("Read table", "Which value is largest in the table?", "Compare all entries.", ["18", "12", "9"], "18", numbers("Table values.", [12, 18, 9]), "read-displays", "Read displays", ["largest-reading-error"]),
    makeCase("Median", "The ordered values are 2, 5, 9. What is the median?", "Median is the middle value.", ["5", "2", "9"], "5", numbers("Ordered data.", [2, 5, 9]), "summaries", "Summary measures", ["median-vs-mean"]),
    makeCase("Line graph", "A line graph rises from Monday to Friday. What does it show?", "Interpret the overall direction.", ["values increased", "values decreased", "values stayed equal"], "values increased", numbers("Line graph trend.", ["Mon low", "Fri high"]), "graphs", "Richer graphs", ["trend-direction-error"]),
    makeCase("Total from table", "A table shows 15, 20, and 5. What is the total?", "Add all values.", ["40", "35", "20"], "40", numbers("Table values.", [15, 20, 5]), "summaries", "Summary measures", ["partial-total"]),
    makeCase("Use summary", "Which summary describes 8, 8, 9, 9?", "Choose a reasonable typical value.", ["typical value is about 8 or 9", "typical value is 20", "typical value is 0"], "typical value is about 8 or 9", numbers("Data set.", [8, 8, 9, 9]), "interpretation", "Interpretation", ["unreasonable-summary"]),
    makeCase("Outlier", "Which value is an outlier in 5, 6, 6, 7, 30?", "Find the unusual value.", ["30", "6", "5"], "30", numbers("Outlier card.", [5, 6, 6, 7, 30]), "variation", "Variation", ["outlier-gap"]),
    makeCase("Graph scale", "A graph scale counts by 10s. What does a bar at 30 mean?", "Read the scale.", ["30", "3", "10"], "30", numbers("Scale by 10.", [0, 10, 20, 30]), "graphs", "Richer graphs", ["scale-reading-error"]),
    makeCase("Summary support", "Which statement uses data evidence?", "Choose a statement with numbers from data.", ["The mean score was 12", "Scores felt nice", "The chart is colourful"], "The mean score was 12", numbers("Summary evidence.", ["mean 12"]), "evidence", "Evidence", ["non-data-statement"]),
    makeCase("Compare means", "Class A mean is 72 and Class B mean is 68. Which is higher?", "Compare the summary measures.", ["Class A", "Class B", "same"], "Class A", numbers("Class means.", ["A 72", "B 68"]), "summaries", "Summary measures", ["mean-comparison-error"]),
    makeCase("Reasonable summary", "Which summary is reasonable for times 11, 12, 13 minutes?", "The values are close together.", ["most times are around 12 minutes", "times are around 100 minutes", "no times were recorded"], "most times are around 12 minutes", numbers("Time data.", [11, 12, 13]), "interpretation", "Interpretation", ["summary-reasonableness-gap"]),
  ],
  () => [
    makeCase("Cut axis", "A bar graph starts its vertical axis at 90, not 0. What could happen?", "Think about visual exaggeration.", ["differences may look bigger", "data becomes impossible", "labels disappear"], "differences may look bigger", numbers("Misleading axis.", ["axis starts at 90"]), "misleading", "Misleading displays", ["axis-effect-gap"]),
    makeCase("Unsupported claim", "A survey of 5 friends says 'everyone loves soccer'. What is the issue?", "The sample is very small and narrow.", ["too few people were asked", "soccer has no data", "friends cannot answer"], "too few people were asked", numbers("Survey sample.", ["5 friends"]), "claims", "Data claims", ["overgeneralisation"]),
    makeCase("Fair question", "Which survey question is fairer?", "Avoid leading wording.", ["Which snack do you prefer?", "Don't you love apples most?", "Why are bananas bad?"], "Which snack do you prefer?", numbers("Survey questions.", ["fair", "leading"]), "survey-questions", "Survey questions", ["leading-question-gap"]),
    makeCase("Missing key", "A picture graph has icons but no key. What is missing?", "The key tells icon value.", ["what each icon means", "the paper colour", "the biggest word"], "what each icon means", numbers("Picture graph missing key.", ["icons", "no key"]), "display-quality", "Display quality", ["graph-key-gap"]),
    makeCase("Claim check", "A claim says blue is most popular, but the graph shows red has 12 and blue has 8. Is it supported?", "Compare the counts.", ["no", "yes", "not enough labels"], "no", groups("Colour graph.", [12, 8], ["red", "blue"]), "claims", "Data claims", ["claim-data-mismatch"]),
    makeCase("Scale choice", "Which display could be misleading?", "Look for distorted scale.", ["bars not starting at zero", "clear labels and zero axis", "table with values"], "bars not starting at zero", numbers("Display features.", ["zero axis", "cut axis"]), "misleading", "Misleading displays", ["misleading-feature-gap"]),
    makeCase("Need more data", "Which information would improve a claim about all students?", "Ask a wider group.", ["data from more students", "one friend's opinion", "no survey"], "data from more students", numbers("Evidence quality.", ["more students"]), "evidence", "Evidence", ["sample-size-gap"]),
    makeCase("Display clarity", "Which graph is clearer?", "Choose clear labels and scale.", ["labelled graph with even scale", "unlabelled graph", "graph with mixed units"], "labelled graph with even scale", numbers("Graph quality.", ["labels", "even scale"]), "display-quality", "Display quality", ["clarity-gap"]),
    makeCase("Survey bias", "Which question is biased?", "Find wording that pushes an answer.", ["Why is our team the best?", "Which team do you support?", "How many games did you watch?"], "Why is our team the best?", numbers("Biased question.", ["leading wording"]), "survey-questions", "Survey questions", ["bias-vocabulary-gap"]),
    makeCase("Extra info", "A graph shows test scores but not how many students. What extra information helps?", "Sample size matters.", ["number of students", "font used", "graph colour"], "number of students", numbers("Missing context.", ["scores", "sample size?"]), "evidence", "Evidence", ["missing-context-gap"]),
    makeCase("Question display", "Why compare two graphs with the same scale?", "Same scale makes comparison fairer.", ["to compare fairly", "to make one bar taller", "to hide the data"], "to compare fairly", numbers("Graph scale comparison.", ["same scale"]), "misleading", "Misleading displays", ["scale-fairness-gap"]),
    makeCase("Careful conclusion", "Which conclusion is careful?", "Limit the claim to the data.", ["In this survey, red was chosen most", "Red is everyone's favourite forever", "No other colours matter"], "In this survey, red was chosen most", groups("Survey results.", [9, 6, 2], ["red", "blue", "green"]), "communication", "Careful claims", ["overclaiming"]),
  ],
  () => [
    makeCase("Percentage result", "A survey has 20 yes votes out of 50. Which percentage is yes?", "Use part out of total.", ["40%", "20%", "50%"], "40%", numbers("Survey percentage.", ["20/50", "40%"]), "percentages", "Percentages", ["percent-calculation-error"]),
    makeCase("Compare rates", "Class A has 8/10 correct and Class B has 15/25 correct. Which rate is higher?", "Compare percentages.", ["Class A", "Class B", "same"], "Class A", numbers("Rates.", ["8/10=80%", "15/25=60%"]), "comparisons", "Comparisons", ["absolute-count-bias"]),
    makeCase("Trend percent", "Attendance rose from 60% to 75%. What happened?", "Compare percentages.", ["attendance increased", "attendance decreased", "attendance stayed the same"], "attendance increased", numbers("Percentage trend.", ["60%", "75%"]), "trends", "Trends", ["trend-direction-error"]),
    makeCase("Fair comparison", "Which comparison is fairer for two different-sized groups?", "Use a percentage or rate.", ["percentage of each group", "total count only", "first row only"], "percentage of each group", numbers("Different group sizes.", ["rates", "percentages"]), "comparisons", "Comparisons", ["total-count-bias"]),
    makeCase("Graph trend", "A line graph goes up, then down, then up. Which word fits?", "Describe the pattern.", ["varied", "always increased", "always decreased"], "varied", numbers("Line graph shape.", ["up", "down", "up"]), "trends", "Trends", ["oversimplifies-trend"]),
    makeCase("Context meaning", "If 90% passed a test, what does that mean?", "Interpret the percentage.", ["most students passed", "no one passed", "exactly 9 students passed always"], "most students passed", numbers("Pass percentage.", ["90%"]), "percentages", "Percentages", ["percent-context-gap"]),
    makeCase("Compare trend", "Which data shows the strongest increase?", "Compare changes.", ["10 to 30", "10 to 12", "30 to 29"], "10 to 30", numbers("Change cards.", ["10->30", "10->12", "30->29"]), "trends", "Trends", ["change-size-error"]),
    makeCase("Supported comparison", "Which statement is supported by 45% chose A and 30% chose B?", "Compare the percentages.", ["A was chosen more than B", "B was chosen more than A", "A and B were equal"], "A was chosen more than B", numbers("Choice percentages.", ["A 45%", "B 30%"]), "claims", "Data claims", ["claim-evidence-mismatch"]),
    makeCase("Rate context", "A plant grew 12 cm in 4 weeks. What rate is that?", "Divide growth by weeks.", ["3 cm/week", "16 cm/week", "48 cm/week"], "3 cm/week", numbers("Growth rate.", ["12 cm", "4 weeks"]), "rates", "Rates", ["rate-operation-error"]),
    makeCase("Percent total", "If 25% of 80 students chose art, how many chose art?", "Find one quarter of 80.", ["20", "25", "60"], "20", groups("80 split into quarters.", [20, 20, 20, 20], ["25%", "25%", "25%", "25%"]), "percentages", "Percentages", ["percent-of-quantity-gap"]),
    makeCase("Precise language", "Which phrase is more precise?", "Use numbers from the data.", ["sales rose by 12%", "sales got nicer", "sales were colourful"], "sales rose by 12%", numbers("Precise trend language.", ["+12%"]), "communication", "Communication", ["non-data-language"]),
    makeCase("Trend limit", "A graph shows three weeks of data. Which claim is careful?", "Do not overclaim beyond the data.", ["sales rose during these three weeks", "sales will rise forever", "all shops are the same"], "sales rose during these three weeks", numbers("Three-week graph.", ["W1", "W2", "W3"]), "communication", "Communication", ["overclaiming"]),
  ],
  () => [
    makeCase("Supported claim", "Data shows 70% chose bus and 30% chose walk. Which claim is supported?", "Use the percentages.", ["more chose bus than walk", "more chose walk", "everyone chose bus"], "more chose bus than walk", numbers("Travel choices.", ["bus 70%", "walk 30%"]), "claims", "Supported claims", ["unsupported-claim"]),
    makeCase("Weak evidence", "A claim about all teens uses data from 4 cousins. What is weak?", "Think about sample size and spread.", ["the sample is too small and narrow", "cousins cannot answer", "percentages are impossible"], "the sample is too small and narrow", numbers("Sample card.", ["4 cousins"]), "evidence", "Evidence quality", ["sample-bias-gap"]),
    makeCase("Missing evidence", "A graph claims homework improves scores but shows no homework data. What is missing?", "The evidence needs both variables.", ["homework information", "bar colours", "a title only"], "homework information", numbers("Claim and missing variable.", ["scores", "homework?"]), "evidence", "Evidence quality", ["missing-variable-gap"]),
    makeCase("Causation caution", "Ice cream sales and sunburn both rise in summer. What should you avoid claiming?", "Correlation is not always causation.", ["ice cream causes sunburn", "both increase in summer", "summer data can be compared"], "ice cream causes sunburn", numbers("Two trends.", ["ice cream up", "sunburn up"]), "claims", "Supported claims", ["correlation-causation-gap"]),
    makeCase("Better evidence", "Which evidence better supports a school-wide claim?", "Use a broader sample.", ["survey from many year groups", "one class only", "one teacher's guess"], "survey from many year groups", numbers("Evidence choices.", ["many groups", "one class"]), "evidence", "Evidence quality", ["sample-quality-gap"]),
    makeCase("Claim strength", "Which claim is strongest?", "Choose the claim directly supported by data.", ["In the sample, 62% preferred A", "Everyone prefers A", "A is always best"], "In the sample, 62% preferred A", numbers("Survey result.", ["62% preferred A"]), "communication", "Communication", ["overclaiming"]),
    makeCase("Extra information", "What extra information helps judge a survey result?", "Context and sample matter.", ["who was surveyed and how many", "font size", "page colour"], "who was surveyed and how many", numbers("Survey context.", ["who?", "how many?"]), "evidence", "Evidence quality", ["context-gap"]),
    makeCase("Contradicting data", "A claim says profits rose, but the table shows 100, 90, 80. Is it supported?", "Read the trend.", ["no", "yes", "not enough labels"], "no", numbers("Profit table.", [100, 90, 80]), "claims", "Supported claims", ["trend-claim-mismatch"]),
    makeCase("Decision from data", "Which decision is supported by most students choosing later start?", "Use the majority result carefully.", ["consider a later start time", "cancel school", "ignore the survey"], "consider a later start time", numbers("Start-time survey.", ["later: most"]), "decisions", "Data decisions", ["decision-overreach"]),
    makeCase("Weak graph", "Which graph issue weakens a claim?", "Look for missing scale.", ["no scale on the axis", "clear title", "labelled categories"], "no scale on the axis", numbers("Graph quality.", ["no scale"]), "display-quality", "Display quality", ["scale-gap"]),
    makeCase("Supported by table", "A table shows 12 wins and 8 losses. Which statement fits?", "Use the table values.", ["there were more wins than losses", "losses were greater", "wins and losses were equal"], "there were more wins than losses", numbers("Record table.", ["wins 12", "losses 8"]), "claims", "Supported claims", ["table-reading-error"]),
    makeCase("Limit of data", "A survey from one city is used to describe a whole country. What is the limit?", "The sample may not represent everyone.", ["one city may not represent the country", "cities cannot have surveys", "country data needs no sample"], "one city may not represent the country", numbers("Sample limit.", ["one city", "whole country"]), "evidence", "Evidence quality", ["representativeness-gap"]),
  ],
  () => [
    makeCase("Outlier effect", "Data 10, 11, 12, 100 has what feature?", "Look for unusual values.", ["100 is an outlier", "all values are close", "10 is the largest"], "100 is an outlier", numbers("Data set.", [10, 11, 12, 100]), "critical-interpretation", "Critical interpretation", ["outlier-not-noticed"]),
    makeCase("Variation", "Which data set has more variation?", "Compare the spread.", ["2, 10, 20", "9, 10, 11", "10, 10, 10"], "2, 10, 20", numbers("Variation comparison.", ["2,10,20", "9,10,11"]), "variation", "Variation", ["spread-gap"]),
    makeCase("Uncertainty", "Which conclusion is careful for a small sample?", "Acknowledge uncertainty.", ["this suggests a pattern, but more data is needed", "this proves it forever", "data is useless"], "this suggests a pattern, but more data is needed", numbers("Small sample.", ["n=8"]), "uncertainty", "Uncertainty", ["overclaiming"]),
    makeCase("Real context", "A cost graph rises sharply in winter. Which context might explain it?", "Connect data to real context.", ["heating costs increased", "winter has no bills", "graphs cannot show costs"], "heating costs increased", numbers("Cost trend.", ["winter rise"]), "context", "Context", ["context-interpretation-gap"]),
    makeCase("Sampling issue", "A poll asks only people at a gym about exercise habits. What is the issue?", "The sample may be biased.", ["sample may over-represent active people", "gyms cannot collect data", "exercise is not data"], "sample may over-represent active people", numbers("Sampling context.", ["gym poll"]), "sampling", "Sampling", ["sample-bias-gap"]),
    makeCase("Compare distributions", "Which data set has a higher typical value?", "Compare the centres.", ["20, 21, 22", "8, 9, 10", "1, 20, 40"], "20, 21, 22", numbers("Data sets.", ["20,21,22", "8,9,10"]), "variation", "Variation", ["typical-value-gap"]),
    makeCase("Outlier caution", "Why might a mean be misleading?", "Outliers can pull the mean.", ["an outlier can affect it", "means never use data", "all means are false"], "an outlier can affect it", numbers("Mean and outlier.", ["typical", "outlier"]), "summaries", "Summary measures", ["mean-limit-gap"]),
    makeCase("Evidence limit", "Which statement shows a data limit?", "Name what remains uncertain.", ["the sample was small, so confidence is limited", "the bars are blue", "numbers are written"], "the sample was small, so confidence is limited", numbers("Limit statement.", ["small sample"]), "uncertainty", "Uncertainty", ["limit-language-gap"]),
    makeCase("Pattern and exception", "Monthly sales mostly increased, except April. What should a summary mention?", "Include pattern and exception.", ["overall increase with an April dip", "always increased", "always decreased"], "overall increase with an April dip", numbers("Monthly trend.", ["up", "up", "dip", "up"]), "critical-interpretation", "Critical interpretation", ["ignores-exception"]),
    makeCase("Realistic conclusion", "Environmental data from one week is used to predict a whole year. What is careful?", "Limit conclusions.", ["one week is not enough for the whole year", "one week proves the year", "weather has no data"], "one week is not enough for the whole year", numbers("Time sample.", ["1 week", "1 year"]), "uncertainty", "Uncertainty", ["time-sample-gap"]),
    makeCase("Data quality", "Which issue affects data quality?", "Look for measurement or collection problems.", ["missing responses", "clear labels", "larger sample"], "missing responses", numbers("Data quality.", ["missing responses"]), "data-quality", "Data quality", ["quality-factor-gap"]),
    makeCase("Balanced interpretation", "Which interpretation is balanced?", "Use evidence and caution.", ["scores improved in this group, but causes are unclear", "the new program definitely caused all improvement", "nothing changed because one score fell"], "scores improved in this group, but causes are unclear", numbers("Interpretation card.", ["improved", "cause unclear"]), "communication", "Communication", ["causal-overclaim"]),
  ],
  () => [
    makeCase("Evidence language", "Which phrase uses evidence carefully?", "Choose cautious data language.", ["the data suggests", "the data proves forever", "my guess says"], "the data suggests", numbers("Evidence language.", ["suggests", "proves"]), "communication", "Communication", ["overstrong-language"]),
    makeCase("Question weak claim", "A report says 'best ever' with no comparison data. What should you ask?", "Ask for supporting evidence.", ["compared with what data?", "what colour is the report?", "who drew the graph?"], "compared with what data?", numbers("Claim critique.", ["best ever", "no comparison"]), "questioning", "Questioning", ["missing-comparison-gap"]),
    makeCase("Clear conclusion", "Which conclusion is clearest?", "Use data and context.", ["In this survey, 68% preferred option A", "A is nicer", "everyone chose A"], "In this survey, 68% preferred option A", numbers("Survey conclusion.", ["68% A"]), "communication", "Communication", ["unclear-conclusion"]),
    makeCase("Limit statement", "Which statement explains a limit?", "Name what data cannot show.", ["the survey does not show why people chose A", "the survey has labels", "the graph has bars"], "the survey does not show why people chose A", numbers("Survey limit.", ["what", "not why"]), "limits", "Limits", ["limit-not-identified"]),
    makeCase("Question evidence", "Which question improves evidence use?", "Ask about sample and method.", ["Who was surveyed?", "What font was used?", "Is blue a nice colour?"], "Who was surveyed?", numbers("Evidence question.", ["who?", "how many?"]), "questioning", "Questioning", ["irrelevant-question"]),
    makeCase("Balanced summary", "Which summary is balanced?", "Include strengths and uncertainty.", ["Most values rose, but the sample was small", "Everything rose forever", "No conclusion is possible ever"], "Most values rose, but the sample was small", numbers("Balanced summary.", ["trend", "small sample"]), "communication", "Communication", ["unbalanced-summary"]),
    makeCase("Use caveat", "Why add 'in this sample' to a conclusion?", "It shows the claim is limited to collected data.", ["to avoid overclaiming", "to hide the data", "to change the result"], "to avoid overclaiming", numbers("Caveat card.", ["in this sample"]), "limits", "Limits", ["caveat-purpose-gap"]),
    makeCase("Weak evidence", "Which evidence is weakest for a national claim?", "Look for narrow evidence.", ["one small class survey", "national random sample", "large multi-city survey"], "one small class survey", numbers("Evidence options.", ["small class", "national sample"]), "evidence", "Evidence quality", ["representativeness-gap"]),
    makeCase("Improve claim", "How can 'people like it' be improved?", "Use data detail.", ["72% of surveyed families liked it", "it is just good", "everyone everywhere likes it"], "72% of surveyed families liked it", numbers("Claim improvement.", ["72%", "surveyed families"]), "communication", "Communication", ["data-detail-gap"]),
    makeCase("Check graph", "What should you check before trusting a graph?", "Check scale, labels, and source.", ["scale, labels, and source", "only the colour", "only the biggest bar"], "scale, labels, and source", numbers("Graph checklist.", ["scale", "labels", "source"]), "questioning", "Questioning", ["graph-critique-gap"]),
    makeCase("Evidence strength", "Which statement explains stronger evidence?", "Use quality and amount of data.", ["larger, relevant sample with clear method", "brighter graph colours", "shorter title"], "larger, relevant sample with clear method", numbers("Evidence strength.", ["sample", "method"]), "evidence", "Evidence quality", ["evidence-quality-gap"]),
    makeCase("Final judgement", "Which data conclusion is appropriately careful?", "Use evidence without overclaiming.", ["The data supports this for the surveyed group", "This is true for everyone forever", "The graph proves the cause"], "The data supports this for the surveyed group", numbers("Careful judgement.", ["supported", "surveyed group"]), "communication", "Communication", ["overclaiming"]),
  ],
];

export const STATISTICS_DATA_STEP_SPECS: StatisticsDataStepSpec[] =
  STATISTICS_STEP_TITLES.map(
    ([title, stepKey, stageKey, stageTitle, stepNumber, shortTitle, description], index) => ({
      order: index + 1,
      stepNumber,
      stageKey,
      stageTitle,
      stepKey,
      pathwayStepId: `mathematics::statistics-and-data::${stageKey}::${stepKey}`,
      title,
      shortTitle,
      description,
      cases: CASE_BUILDERS[index](),
    }),
  );

export const STATISTICS_DATA_STEP_ASSESSMENTS: StatisticsDataStepAssessment[] =
  STATISTICS_DATA_STEP_SPECS.map((spec) => ({
    key: `statistics-data-step-${spec.order}-${spec.stepKey}-assessment-v1`,
    stepNumber: spec.stepNumber,
    stepKey: spec.stepKey,
    pathwayStepId: spec.pathwayStepId,
    title: spec.title,
    shortTitle: spec.shortTitle,
    description: spec.description,
    subjectKey: "mathematics",
    strandKey: STATISTICS_DATA_STRAND_KEY,
    stageKey: spec.stageKey,
    parentBankKey: STATISTICS_DATA_PARENT_FAMILY_KEY,
    parentBankTitle: STATISTICS_DATA_PARENT_FAMILY_TITLE,
    parentItemBankKey: STATISTICS_DATA_ITEM_BANK_KEY,
    progressionBandKey: STATISTICS_DATA_PARENT_FAMILY_KEY,
    sourceRoute: STATISTICS_DATA_SOURCE_ROUTE,
    depthOptions: NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
    items: spec.cases.map((item, index) => makeItem(spec, item, index)),
  }));

export function getStatisticsDataStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
) {
  const stepAssessmentKey = safe(context.stepAssessmentKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    STATISTICS_DATA_STEP_ASSESSMENTS.find(
      (assessment) =>
        (stepAssessmentKey && assessment.key === stepAssessmentKey) ||
        (pathwayStepId && assessment.pathwayStepId === pathwayStepId) ||
        (stepKey && assessment.stepKey === stepKey),
    ) || null
  );
}

export function getStatisticsDataStepAssessmentItemsForDepth(
  assessmentKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const assessment =
    STATISTICS_DATA_STEP_ASSESSMENTS.find(
      (candidate) => candidate.key === assessmentKey,
    ) || null;

  if (!assessment) return [];

  return assessment.items.slice(0, getNumberStepAssessmentDepthItemCount(depth));
}
