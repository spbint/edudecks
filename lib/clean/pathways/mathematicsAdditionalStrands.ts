import type {
  MathematicsDetailedStrandStage,
  MathematicsDetailedStrandStep,
  MathematicsDetailedStrandWorkspace,
} from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { PathwayStageKey } from "@/lib/clean/pathways/mathematicsNumberPrototype";

const STAGE_TITLES: Record<PathwayStageKey, string> = {
  "foundation-kindergarten": "Foundation / Kindergarten",
  "lower-primary": "Lower Primary",
  "middle-primary": "Middle Primary",
  "upper-primary": "Upper Primary",
  "lower-secondary": "Lower Secondary",
  "years-9-10-consolidation": "Years 9-10 / consolidation",
};

function stage(
  key: PathwayStageKey,
  helper: string,
  steps: MathematicsDetailedStrandStep[],
): MathematicsDetailedStrandStage {
  return {
    key,
    title: STAGE_TITLES[key],
    helper,
    steps,
  };
}

type StrandConfig = Omit<MathematicsDetailedStrandWorkspace, "currentFocusStageKey">;

function buildWorkspace(
  currentFocusStageKey: PathwayStageKey,
  config: StrandConfig,
): MathematicsDetailedStrandWorkspace {
  return {
    ...config,
    currentFocusStageKey,
  };
}

export function buildRatioAndProportionalReasoningWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return buildWorkspace(currentFocusStageKey, {
    key: "ratio-and-proportional-reasoning",
    trackingKey: "ratio-and-proportional-reasoning",
    title: "Ratio and proportional reasoning",
    subtitle:
      "Ratio and proportional reasoning builds on number, operations, and fractions. It helps learners compare quantities, scale ideas up and down, reason about fairness and rates, and make sense of relationships that stay in balance.",
    pathwayLabel: "Ratio and proportional reasoning pathway",
    relationshipTitle: "What this strand builds on",
    relationshipCopy:
      "This strand builds on number relationships, dependable calculation, and fractions, decimals, and percentages. It connects strongly to recipes, maps, measurement, finance, and later algebra.",
    stages: [
      stage(
        "foundation-kindergarten",
        "Early proportional ideas begin with fairness, equal groups, same-size shares, and noticing when two collections match or do not match.",
        [
          {
            id: 1,
            title: "Compare groups and talk about fairness",
            meaning:
              "Notice when two groups match, when one has more, and when sharing feels fair or unfair.",
            skillFocus:
              "early comparison, matching, and fairness language as foundations for later ratio thinking",
            learningIntention:
              "Use practical comparisons to see that mathematics can describe balance and fairness, not only totals.",
            successCriteria: [
              "The learner can say whether groups are the same or different.",
              "The learner can explain whether a sharing situation feels fair.",
              "The learner can suggest how to make two groups match more closely.",
            ],
            practiceActivity:
              "Share snacks, match toy groups, or compare collections and talk about what would make the situation fairer or more balanced.",
            evidenceExamples: [
              "a parent note about fairness language used in play",
              "photos of practical sharing or matching tasks",
              "a short verbal explanation of how two groups were compared",
            ],
            assessmentCheck:
              "Later, check whether the learner can explain fairness or matching without relying only on guesswork.",
            nextStep:
              "Build on fairness by using simple multiplicative language such as double, half, and same amount.",
            reportLanguage:
              "The learner is beginning to compare groups thoughtfully and use everyday fairness language to describe balanced and unbalanced situations.",
          },
          {
            id: 2,
            title: "Use double, half, and same amount in practical play",
            meaning:
              "Connect simple scaling ideas to visible quantities in everyday situations.",
            skillFocus:
              "early multiplicative language that later supports ratio, scaling, and proportional comparison",
            learningIntention:
              "Recognise that some comparisons are about how amounts relate, not only how many there are.",
            successCriteria: [
              "The learner can make a set that is the same size, double, or half of another simple set.",
              "The learner can use double, half, or same amount language sensibly.",
              "The learner can explain the comparison with objects or drawings.",
            ],
            practiceActivity:
              "Use blocks, counters, or food portions and ask the learner to make another group that is the same, double, or half.",
            evidenceExamples: [
              "photos of scaled groups made with objects",
              "a simple drawing showing same, double, or half",
              "parent observations from a practical comparison task",
            ],
            assessmentCheck:
              "Later, check whether the learner can make and describe simple scaled groups independently.",
            nextStep:
              "Carry these ideas into lower-primary grouping, recipes, and simple multiplicative comparisons.",
            reportLanguage:
              "The learner is beginning to use simple scaling language such as same, double, and half in practical comparison tasks.",
          },
        ],
      ),
      stage(
        "lower-primary",
        "Learners begin comparing quantities multiplicatively, not just additively. Simple sharing, grouping, and scaling tasks help them see how one amount can relate to another.",
        [
          {
            id: 1,
            title: "Describe simple multiplicative comparisons",
            meaning:
              "Notice when one amount is twice as many, half as much, or another simple comparison of a related quantity.",
            skillFocus:
              "moving from more/less language toward simple multiplicative comparison",
            learningIntention:
              "See that some comparisons are best described by how quantities scale, not only by the difference between them.",
            successCriteria: [
              "The learner can describe a simple comparison such as double or half.",
              "The learner can model the comparison with groups, drawings, or counters.",
              "The learner can explain which quantity is being compared to which.",
            ],
            practiceActivity:
              "Compare scores, toy groups, or snack amounts and ask the learner to describe how one amount relates to the other.",
            evidenceExamples: [
              "a parent note about how the learner described a comparison",
              "photos of grouped materials showing the relationship",
              "a short explanation using double, half, or same-size language",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose a useful comparison description independently.",
            nextStep:
              "Use these relationships when scaling simple recipes, constructions, or repeated group tasks.",
            reportLanguage:
              "The learner is beginning to describe simple multiplicative comparisons more clearly and can increasingly show how one quantity relates to another.",
          },
          {
            id: 2,
            title: "Scale simple tasks up and down",
            meaning:
              "Apply doubling, halving, and other simple scale changes in practical family contexts.",
            skillFocus:
              "early scaling in recipes, building, drawing, and grouped tasks",
            learningIntention:
              "Use scaling ideas in situations where the amount changes but the relationship stays sensible.",
            successCriteria: [
              "The learner can double or halve a simple quantity in context.",
              "The learner can explain what stayed related when the quantity changed.",
              "The learner can check whether the scaled result makes sense.",
            ],
            practiceActivity:
              "Double a snack recipe, halve a drawing measure, or build a repeated pattern with twice as many pieces.",
            evidenceExamples: [
              "a practical scaling task summary",
              "annotated drawings or jottings from a recipe or building activity",
              "a learner explanation of how the amount changed",
            ],
            assessmentCheck:
              "Later, check whether the learner can apply doubling or halving sensibly in a fresh context.",
            nextStep:
              "Extend scaling into tables, unit rates, and more deliberate proportional relationships.",
            reportLanguage:
              "The learner is becoming more confident in scaling simple practical tasks and explaining how quantities change while the relationship stays meaningful.",
          },
        ],
      ),
      stage(
        "middle-primary",
        "Ratio thinking becomes more organised here through tables, diagrams, grouped quantities, and clearer reasoning about rates and equivalent relationships.",
        [
          {
            id: 1,
            title: "Use tables or diagrams to compare related quantities",
            meaning:
              "Record two linked quantities in a way that makes the relationship easier to see and extend.",
            skillFocus:
              "organising proportional relationships with simple tables, drawings, or grouped models",
            learningIntention:
              "Represent a relationship clearly enough to reason about how the quantities change together.",
            successCriteria: [
              "The learner can record two linked quantities clearly.",
              "The learner can extend the pattern while keeping the relationship consistent.",
              "The learner can explain what stays the same in the relationship.",
            ],
            practiceActivity:
              "Use ingredient tables, grouped counters, or map-style comparisons where two quantities change together in a predictable way.",
            evidenceExamples: [
              "a comparison table or diagram",
              "a parent note about how the learner extended the relationship",
              "a short explanation of what stayed the same as the quantities changed",
            ],
            assessmentCheck:
              "Later, check whether the learner can build and interpret a simple proportional table independently.",
            nextStep:
              "Carry this into rates and unit comparisons where the relationship needs to be simplified or checked.",
            reportLanguage:
              "The learner is beginning to organise related quantities more clearly and can increasingly explain how proportional relationships stay consistent.",
          },
          {
            id: 2,
            title: "Use simple rates in practical contexts",
            meaning:
              "Compare quantities through ideas such as each, per, or for every in everyday tasks.",
            skillFocus:
              "unit comparison and rate language in real family contexts",
            learningIntention:
              "Use rates as a practical way of comparing value, speed, fairness, or efficiency.",
            successCriteria: [
              "The learner can interpret simple per or for every language.",
              "The learner can compare two practical situations using a unit rate idea.",
              "The learner can explain which option is fairer, faster, or better value and why.",
            ],
            practiceActivity:
              "Compare pack values, speeds in games, or simple map distances and ask which rate makes more sense.",
            evidenceExamples: [
              "a worked comparison using unit ideas",
              "a shopping or game-rate discussion note",
              "a learner explanation of which choice offered better value or fairness",
            ],
            assessmentCheck:
              "Later, check whether the learner can use simple unit thinking to compare unfamiliar situations.",
            nextStep:
              "Build toward fraction, decimal, and percentage links in upper-primary proportional reasoning.",
            reportLanguage:
              "The learner is growing in confidence when using simple rate ideas to compare practical choices and explain value or fairness.",
          },
        ],
      ),
      stage(
        "upper-primary",
        "This stage connects proportional reasoning more deliberately to fractions, decimals, percentages, scale, and unit comparisons in meaningful situations.",
        [
          {
            id: 1,
            title: "Use fractions, decimals, or percentages in proportional comparison",
            meaning:
              "Choose a useful form to compare linked quantities and explain how the relationship works.",
            skillFocus:
              "connecting proportional reasoning to fraction, decimal, and percentage understanding",
            learningIntention:
              "See that equivalent proportional ideas can often be represented in more than one useful way.",
            successCriteria: [
              "The learner can choose a sensible representation for a proportional comparison.",
              "The learner can explain how the linked quantities compare.",
              "The learner can justify why the chosen form helps with the task.",
            ],
            practiceActivity:
              "Compare recipe amounts, win rates, discounts, or measured quantities and discuss whether fractions, decimals, or percentages help most.",
            evidenceExamples: [
              "annotated work showing a chosen representation",
              "a learner reflection about why one form was useful",
              "a parent note from a proportional comparison discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can move between helpful forms during a proportional task with growing independence.",
            nextStep:
              "Use this flexibility in scale drawings, map work, and richer unit-rate decisions.",
            reportLanguage:
              "The learner is becoming more flexible in using fractions, decimals, or percentages to describe proportional relationships clearly.",
          },
          {
            id: 2,
            title: "Apply scale and unit comparison in real tasks",
            meaning:
              "Use proportional relationships when enlarging, reducing, mapping, planning, or comparing value.",
            skillFocus:
              "scale, unit rate, and proportional decision-making in everyday applications",
            learningIntention:
              "Apply ratio thinking in ways that support accurate planning and better judgement.",
            successCriteria: [
              "The learner can scale a simple drawing, recipe, or plan sensibly.",
              "The learner can compare value or distance using proportional reasoning.",
              "The learner can explain how the relationship was maintained.",
            ],
            practiceActivity:
              "Use map keys, scale drawings, doubled recipes, or unit-price shopping tasks where the learner must keep the relationship consistent.",
            evidenceExamples: [
              "a scaled drawing or map task",
              "a recipe or shopping comparison summary",
              "a learner explanation of how scale was maintained",
            ],
            assessmentCheck:
              "Later, check whether the learner can use scale or unit comparison reliably in a new practical context.",
            nextStep:
              "Carry this into lower-secondary ratio tables, rates, and proportional problem solving.",
            reportLanguage:
              "The learner is increasingly able to apply scale and unit comparison in practical situations and explain how the relationship stays consistent.",
          },
        ],
      ),
      stage(
        "lower-secondary",
        "Current focus moves into deliberate ratio, rate, and proportion problem solving, where learners choose strategies and justify the relationships they use.",
        [
          {
            id: 1,
            title: "Use ratio tables and unit rates to solve practical problems",
            meaning:
              "Solve proportional problems by organising the relationship clearly and checking that the linked quantities stay in balance.",
            skillFocus:
              "choosing efficient proportional strategies for ratio and rate situations",
            learningIntention:
              "Use structured reasoning rather than trial and error when solving ratio and proportion tasks.",
            successCriteria: [
              "The learner can represent a ratio or rate problem clearly.",
              "The learner can choose a helpful proportional strategy such as a table or unit rate.",
              "The learner can explain how the result stays consistent with the original relationship.",
            ],
            practiceActivity:
              "Use travel-time comparisons, recipe scaling, pack-value questions, or map problems that need deliberate proportional structure.",
            evidenceExamples: [
              "a ratio table or organised proportional solution",
              "a parent note about strategy choice in a real task",
              "a learner explanation of why the answer stays in proportion",
            ],
            assessmentCheck:
              "Later, check whether the learner can solve a fresh proportional problem and justify the strategy used.",
            nextStep:
              "Build this into proportional graphs, finance, and later algebraic relationships.",
            reportLanguage:
              "The learner is developing more deliberate proportional strategies and can increasingly explain how ratio and rate relationships stay balanced.",
          },
          {
            id: 2,
            title: "Judge fairness, value, and efficiency proportionally",
            meaning:
              "Use proportional thinking to compare value, speed, density, fairness, or efficiency in real decisions.",
            skillFocus:
              "interpreting proportional relationships to support real-world judgement",
            learningIntention:
              "See proportion as a practical decision-making tool rather than only a calculation method.",
            successCriteria: [
              "The learner can compare two options using a proportional lens.",
              "The learner can explain which choice is fairer, better value, or more efficient and why.",
              "The learner can check whether the conclusion fits the context.",
            ],
            practiceActivity:
              "Compare unit pricing, game statistics, travel choices, or sharing arrangements and ask the learner to justify the better option.",
            evidenceExamples: [
              "a budget or value comparison",
              "a learner explanation of a fairness decision",
              "a short written reflection on why one option was more efficient",
            ],
            assessmentCheck:
              "Later, check whether the learner uses proportional reasoning spontaneously when judging practical choices.",
            nextStep:
              "This supports later algebra, finance, measurement modelling, and critical interpretation of data.",
            reportLanguage:
              "The learner is increasingly able to use ratio and proportional reasoning to judge fairness, value, and efficiency in practical contexts.",
          },
        ],
      ),
      stage(
        "years-9-10-consolidation",
        "Later consolidation applies proportional reasoning across algebraic relationships, finance, graphs, measurement, and modelling, with stronger emphasis on justification and communication.",
        [
          {
            id: 1,
            title: "Apply proportional reasoning in graphs, finance, and modelling",
            meaning:
              "Use ratio and rate thinking confidently in situations where relationships must be represented, interpreted, or modelled.",
            skillFocus:
              "transferring proportional understanding into later mathematical and practical contexts",
            learningIntention:
              "Treat proportional reasoning as a connected tool across subjects and real-life decision-making.",
            successCriteria: [
              "The learner can interpret or build a proportional model in context.",
              "The learner can connect ratio and rate thinking to finance, measurement, or graph relationships.",
              "The learner can explain why the model is a sensible fit for the situation.",
            ],
            practiceActivity:
              "Explore scale drawings, financial change, distance-time contexts, or graph relationships that depend on consistent proportional thinking.",
            evidenceExamples: [
              "a later-stage proportional model or graph task",
              "a learner explanation linking ratio ideas to a practical context",
              "a parent summary of proportional reasoning used in a modelling activity",
            ],
            assessmentCheck:
              "Later, check whether the learner can apply proportional reasoning reliably when the context is less familiar.",
            nextStep:
              "Continue strengthening algebraic, statistical, and financial applications that depend on stable proportional relationships.",
            reportLanguage:
              "The learner is consolidating proportional reasoning across finance, graphs, measurement, and modelling and can explain how the relationships operate in context.",
          },
          {
            id: 2,
            title: "Refine judgement and communication in proportional problems",
            meaning:
              "Check whether proportional conclusions are reasonable and communicate the logic behind them clearly.",
            skillFocus:
              "critical judgement, checking, and explanation in later proportional reasoning",
            learningIntention:
              "Treat checking and explanation as essential parts of proportional problem solving.",
            successCriteria: [
              "The learner can explain why a proportional answer is or is not reasonable.",
              "The learner can identify when a representation or strategy does not fit the relationship well.",
              "The learner can communicate the proportional pathway clearly from start to finish.",
            ],
            practiceActivity:
              "Review worked examples, compare alternative methods, or critique real-world proportional claims in media, maps, and finance.",
            evidenceExamples: [
              "annotated corrections or critique notes",
              "a learner explanation comparing two possible strategies",
              "a written or verbal justification of a proportional conclusion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently uses checking and critique habits in unfamiliar proportional tasks.",
            nextStep:
              "These habits continue to support algebra, finance, measurement, and more formal mathematical modelling.",
            reportLanguage:
              "The learner is strengthening the habit of checking, critiquing, and clearly communicating proportional reasoning in later mathematical work.",
          },
        ],
      ),
    ],
    portfolioSupport: [
      "Keep one strong practical scaling task and one later-stage value or rate comparison so the portfolio shows growth from fairness to formal proportional reasoning.",
      "Save learner explanations about why a relationship stayed balanced, because that often shows understanding more clearly than the final answer alone.",
      "Maps, recipes, speed comparisons, and unit-price decisions often provide strong portfolio evidence because the ratio thinking is visible in context.",
    ],
    reportingSupport: [
      "Reporting can highlight the learner's growing ability to compare linked quantities, justify fairness, and choose sensible strategies for rate and scale problems.",
      "Evidence is often strongest when ratio ideas are applied in recipes, maps, value comparisons, or practical planning rather than only in isolated exercises.",
      "Collected examples over time can show a shift from simple fairness language toward confident proportional reasoning across multiple contexts.",
    ],
  });
}

export function buildAlgebraPatternsAndFunctionsWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return buildWorkspace(currentFocusStageKey, {
    key: "algebra-patterns-and-functions",
    trackingKey: "algebra-patterns-and-functions",
    title: "Algebra, patterns and functions",
    subtitle:
      "Algebra grows out of number structure, operations, and reasoning. It helps learners notice patterns, describe rules, generalise relationships, and use symbols to express ideas clearly and efficiently.",
    pathwayLabel: "Algebra, patterns and functions pathway",
    relationshipTitle: "What this strand builds on",
    relationshipCopy:
      "This strand builds on number relationships, operations, and mathematical reasoning. It supports later equations, graphs, functions, modelling, and flexible problem solving.",
    stages: [
      stage(
        "foundation-kindergarten",
        "Early algebra begins with noticing what repeats, what changes, and what stays the same in patterns, sorting, and simple rules.",
        [
          {
            id: 1,
            title: "Notice and continue simple repeating patterns",
            meaning:
              "Recognise what comes next in a repeated sequence and explain what is repeating.",
            skillFocus:
              "pattern recognition and describing regularity in everyday materials",
            learningIntention:
              "See that mathematics can describe predictable structure, not only counting.",
            successCriteria: [
              "The learner can continue a simple repeating pattern.",
              "The learner can explain what part is repeating.",
              "The learner can create a similar pattern of their own.",
            ],
            practiceActivity:
              "Use beads, blocks, movements, sounds, or drawing patterns and ask the learner to continue and describe the rule.",
            evidenceExamples: [
              "photos of repeating patterns",
              "a parent note about how the learner described the pattern",
              "a simple created pattern with verbal explanation",
            ],
            assessmentCheck:
              "Later, check whether the learner can identify the repeating unit in a new pattern without being shown first.",
            nextStep:
              "Build on this by sorting and describing simple rules that decide what belongs in a group.",
            reportLanguage:
              "The learner is beginning to notice repeated structure and can increasingly continue and describe simple patterns.",
          },
          {
            id: 2,
            title: "Sort objects and explain the rule",
            meaning:
              "Group objects, pictures, or actions according to a simple shared feature and explain the thinking.",
            skillFocus:
              "rule-based sorting and early classification as preparation for later generalising",
            learningIntention:
              "Recognise that a rule can describe what belongs together and what does not.",
            successCriteria: [
              "The learner can sort items into groups using a clear rule.",
              "The learner can explain the feature that was used.",
              "The learner can notice when an item does not fit the rule.",
            ],
            practiceActivity:
              "Sort buttons, toys, shapes, or picture cards by colour, size, shape, or another shared feature and talk about the rule.",
            evidenceExamples: [
              "photos of sorted sets",
              "a learner explanation of the chosen rule",
              "a parent note about how the learner noticed exceptions",
            ],
            assessmentCheck:
              "Later, check whether the learner can invent and explain a sensible sorting rule independently.",
            nextStep:
              "Carry this rule-based thinking into lower-primary pattern growth and missing-number relationships.",
            reportLanguage:
              "The learner is growing in confidence when sorting by rule and explaining what features different items have in common.",
          },
        ],
      ),
      stage(
        "lower-primary",
        "Learners begin working with growing patterns, missing numbers, and simple rules that can be described in words, pictures, or number sequences.",
        [
          {
            id: 1,
            title: "Continue growing patterns and describe the change",
            meaning:
              "Notice how a pattern grows or changes each time and explain what is happening.",
            skillFocus:
              "describing growth and regular change in patterns",
            learningIntention:
              "Move from noticing repetition to noticing change that follows a rule.",
            successCriteria: [
              "The learner can continue a simple growing pattern correctly.",
              "The learner can describe how the pattern changes each time.",
              "The learner can predict the next part using the rule.",
            ],
            practiceActivity:
              "Use block towers, dot patterns, or drawing sequences that grow by the same amount and ask the learner to continue and explain them.",
            evidenceExamples: [
              "photos or sketches of a growing pattern",
              "a learner explanation of how the pattern changes",
              "parent notes about predicting what comes next",
            ],
            assessmentCheck:
              "Later, check whether the learner can identify the rule in a new growing pattern with less support.",
            nextStep:
              "Use these same ideas in missing-number sentences and simple input-output tasks.",
            reportLanguage:
              "The learner is beginning to recognise how patterns grow and can increasingly describe the rule behind the change.",
          },
          {
            id: 2,
            title: "Use missing-number and input-output thinking",
            meaning:
              "Work with simple number sentences or machine-style rules where something is unknown and must be reasoned out.",
            skillFocus:
              "early functional thinking and inverse reasoning",
            learningIntention:
              "See that a relationship can be described even when one part is missing or changes according to a rule.",
            successCriteria: [
              "The learner can solve a simple missing-number sentence.",
              "The learner can describe what a simple input-output rule does.",
              "The learner can check whether a value fits the relationship.",
            ],
            practiceActivity:
              "Use number machines, simple boxes, or missing-number balances and ask the learner to work out the unknown.",
            evidenceExamples: [
              "jottings from a missing-number task",
              "a learner explanation of an input-output rule",
              "a parent note about how the learner checked an answer",
            ],
            assessmentCheck:
              "Later, check whether the learner can use inverse reasoning rather than guess-and-check alone.",
            nextStep:
              "Extend this rule-based thinking into tables, relationships, and early symbolic notation.",
            reportLanguage:
              "The learner is becoming more confident with missing-number and simple rule-based tasks and can explain the relationship more clearly.",
          },
        ],
      ),
      stage(
        "middle-primary",
        "Algebraic thinking becomes more deliberate here through tables, pattern rules, equivalent expressions, and clearer generalising about number relationships.",
        [
          {
            id: 1,
            title: "Use tables and rules to describe number patterns",
            meaning:
              "Record inputs and outputs or step-by-step changes so a relationship can be seen and extended clearly.",
            skillFocus:
              "organising pattern rules with tables and structured recording",
            learningIntention:
              "Represent a pattern clearly enough to explain how the values change together.",
            successCriteria: [
              "The learner can record a simple table of related values.",
              "The learner can explain the rule connecting the values.",
              "The learner can extend the table correctly using the rule.",
            ],
            practiceActivity:
              "Use number-machine tables, shape patterns, or practical sequences and ask the learner to record the relationship.",
            evidenceExamples: [
              "a completed input-output table",
              "a learner explanation of the rule used",
              "parent notes from a discussion about how the values changed",
            ],
            assessmentCheck:
              "Later, check whether the learner can create and interpret a simple relationship table independently.",
            nextStep:
              "Use these relationships to generalise and describe the rule more efficiently.",
            reportLanguage:
              "The learner is increasingly able to organise number patterns in tables and explain the rule linking the values.",
          },
          {
            id: 2,
            title: "Generalise simple rules and equivalent relationships",
            meaning:
              "Recognise when different-looking expressions or strategies still produce the same outcome.",
            skillFocus:
              "generalising and noticing equivalence in number relationships",
            learningIntention:
              "Move from working case by case to describing what is always true about a relationship.",
            successCriteria: [
              "The learner can describe a rule that fits several examples.",
              "The learner can notice when two strategies or expressions are equivalent.",
              "The learner can explain why the relationship stays true.",
            ],
            practiceActivity:
              "Compare two ways of building a pattern, splitting a number, or recording a rule and discuss why they still match.",
            evidenceExamples: [
              "a rule written in words alongside examples",
              "annotated comparison of equivalent relationships",
              "a learner explanation of why two methods give the same result",
            ],
            assessmentCheck:
              "Later, check whether the learner can explain a general rule rather than only listing examples.",
            nextStep:
              "Carry this into variable notation, expressions, and early equation work.",
            reportLanguage:
              "The learner is beginning to generalise patterns and recognise equivalent relationships with growing clarity and confidence.",
          },
        ],
      ),
      stage(
        "upper-primary",
        "Learners now begin using variables, expressions, and clearer rule notation while still keeping meaning connected to patterns, number, and practical examples.",
        [
          {
            id: 1,
            title: "Use symbols or letters to show an unknown or rule",
            meaning:
              "Treat a symbol as a useful placeholder for a value or relationship, not just as a mysterious new object.",
            skillFocus:
              "variable use and symbolic representation connected to meaning",
            learningIntention:
              "Use algebraic symbols to describe relationships more efficiently while understanding what they stand for.",
            successCriteria: [
              "The learner can use a symbol to show an unknown or changing value.",
              "The learner can explain what the symbol represents in context.",
              "The learner can substitute sensible values and check the result.",
            ],
            practiceActivity:
              "Use missing-value rules, practical formulas, or simple pattern rules and replace repeated wording with a clear symbol.",
            evidenceExamples: [
              "a worked example using a variable",
              "a learner explanation of what the symbol represents",
              "parent notes from a substitution or rule discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can use a symbol meaningfully rather than as a copied procedure.",
            nextStep:
              "Extend symbol use into expressions, equivalent forms, and equation solving.",
            reportLanguage:
              "The learner is becoming more confident in using symbols to represent unknowns or rules and can increasingly explain what the symbols mean.",
          },
          {
            id: 2,
            title: "Write and interpret simple expressions or equations",
            meaning:
              "Represent a relationship with concise notation and connect it back to the original pattern or context.",
            skillFocus:
              "expressions, equations, and meaning-making in simple algebraic forms",
            learningIntention:
              "Use notation as a clear communication tool rather than as separate symbolic work detached from understanding.",
            successCriteria: [
              "The learner can write a simple expression or equation from a pattern or context.",
              "The learner can explain what each part of the notation represents.",
              "The learner can check whether the notation fits the original situation.",
            ],
            practiceActivity:
              "Translate simple story relationships, growing patterns, or number machines into expressions or equations and talk through the meaning.",
            evidenceExamples: [
              "a practical relationship written as an equation",
              "annotated work linking notation to the original problem",
              "a learner reflection on why the expression made the rule shorter to describe",
            ],
            assessmentCheck:
              "Later, check whether the learner can move between words, tables, and notation with growing independence.",
            nextStep:
              "Carry this into lower-secondary equation solving, graph relationships, and functional thinking.",
            reportLanguage:
              "The learner is increasingly able to represent simple relationships with expressions or equations and explain how the notation connects to meaning.",
          },
        ],
      ),
      stage(
        "lower-secondary",
        "Current focus broadens into equations, functional relationships, and symbolic reasoning that connects tables, graphs, and algebraic forms more deliberately.",
        [
          {
            id: 1,
            title: "Solve and explain equations as balanced relationships",
            meaning:
              "Treat an equation as a relationship that must stay balanced while reasoning about the unknown.",
            skillFocus:
              "equation solving with attention to balance, structure, and explanation",
            learningIntention:
              "Use algebraic reasoning to solve for unknown values while understanding how the relationship is preserved.",
            successCriteria: [
              "The learner can solve a simple equation accurately.",
              "The learner can explain why each step keeps the relationship balanced.",
              "The learner can check whether the result makes sense in context.",
            ],
            practiceActivity:
              "Use balance-style equations, contextual formulas, or missing-value relationships and ask the learner to explain the reasoning step by step.",
            evidenceExamples: [
              "annotated equation-solving work",
              "a learner explanation of balance or inverse steps",
              "parent notes from a symbolic reasoning discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can solve a fresh equation and justify the method used.",
            nextStep:
              "Connect equations to graphs, tables, and changing relationships.",
            reportLanguage:
              "The learner is developing more confidence in solving equations and can increasingly explain how the balance of the relationship is preserved.",
          },
          {
            id: 2,
            title: "Connect tables, rules, and graphs in functional thinking",
            meaning:
              "See that one relationship can be represented through values, words, notation, and graphs.",
            skillFocus:
              "functional thinking across multiple representations",
            learningIntention:
              "Recognise that relationships can be expressed in different ways while still describing the same underlying pattern.",
            successCriteria: [
              "The learner can connect a rule to a table or graph.",
              "The learner can explain how change in one quantity affects another.",
              "The learner can describe what the representation shows about the relationship.",
            ],
            practiceActivity:
              "Use input-output tables, coordinate plots, or practical variable relationships and compare how each representation shows the pattern.",
            evidenceExamples: [
              "a table linked to a graph or rule",
              "a learner explanation of how quantities change together",
              "parent notes from a discussion about which representation was most helpful",
            ],
            assessmentCheck:
              "Later, check whether the learner can move between representations with growing independence.",
            nextStep:
              "This supports later modelling, graph interpretation, and more mature algebraic generalising.",
            reportLanguage:
              "The learner is increasingly able to connect tables, rules, and graphs and explain how a functional relationship behaves.",
          },
        ],
      ),
      stage(
        "years-9-10-consolidation",
        "Later consolidation uses algebra more flexibly for modelling, generalising, and communicating relationships across mathematics and real-life problems.",
        [
          {
            id: 1,
            title: "Use algebra to model relationships efficiently",
            meaning:
              "Represent a practical or mathematical relationship in a way that makes prediction, comparison, or explanation easier.",
            skillFocus:
              "modelling with algebraic expressions, equations, and functional relationships",
            learningIntention:
              "Use algebra as a tool for seeing structure and making relationships easier to work with.",
            successCriteria: [
              "The learner can choose an algebraic model that fits the relationship.",
              "The learner can use the model to predict or compare values.",
              "The learner can explain how the model connects to the original situation.",
            ],
            practiceActivity:
              "Model growing costs, geometric patterns, simple finance, or measurement relationships and use the model to predict future values.",
            evidenceExamples: [
              "an algebraic model linked to a real situation",
              "a learner explanation of why the model was useful",
              "a parent summary of algebraic reasoning in a practical task",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose and justify an algebraic model in a new context.",
            nextStep:
              "Continue strengthening algebra as part of broader modelling, statistics, finance, and science applications.",
            reportLanguage:
              "The learner is consolidating the ability to use algebraic relationships to model, predict, and explain meaningful situations.",
          },
          {
            id: 2,
            title: "Refine explanation, checking, and generalising",
            meaning:
              "Use algebraic reasoning to justify conclusions, critique patterns, and explain what is always true.",
            skillFocus:
              "clear communication and generalising in later algebraic thinking",
            learningIntention:
              "Treat explanation and checking as integral parts of algebraic work, not extras added after the answer.",
            successCriteria: [
              "The learner can justify why an algebraic conclusion makes sense.",
              "The learner can identify whether a general rule really fits all cases described.",
              "The learner can communicate the reasoning clearly in words, notation, or diagrams.",
            ],
            practiceActivity:
              "Critique rules, compare two symbolic approaches, or explain why a general statement works across several examples.",
            evidenceExamples: [
              "annotated rule critique or comparison",
              "a written or verbal explanation of a general statement",
              "a learner reflection on how checking improved the final conclusion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently uses explanation and checking habits in later algebraic work.",
            nextStep:
              "These habits support later functions, modelling, finance, science applications, and more confident mathematical communication.",
            reportLanguage:
              "The learner is strengthening the ability to generalise, check, and communicate algebraic reasoning with increasing maturity.",
          },
        ],
      ),
    ],
    portfolioSupport: [
      "Keep one clear pattern or rule example from an earlier stage and one later symbolic or functional example so growth from noticing to generalising is visible.",
      "Learner explanations matter here because they show whether symbols and rules still connect back to meaning.",
      "Practical modelling tasks often provide strong portfolio evidence because the algebraic thinking is linked to a visible relationship.",
    ],
    reportingSupport: [
      "Reporting can highlight the learner's growing ability to notice structure, describe rules, and represent changing relationships more efficiently.",
      "Evidence is often strongest when algebra is connected to patterns, tables, or practical modelling rather than treated as isolated symbolic work.",
      "Collected examples over time can show a shift from noticing repeated structure toward confident use of variables, equations, and functional relationships.",
    ],
  });
}

export function buildMeasurementWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return buildWorkspace(currentFocusStageKey, {
    key: "measurement",
    trackingKey: "measurement",
    title: "Measurement",
    subtitle:
      "Measurement applies number, operations, fractions, decimals, and geometry in practical life. It helps learners choose units, estimate sensibly, measure accurately, and interpret what a measurement means in context.",
    pathwayLabel: "Measurement pathway",
    relationshipTitle: "What this strand builds on",
    relationshipCopy:
      "Measurement builds on counting, place value, operations, fraction and decimal understanding, and spatial reasoning. It supports science, design, planning, time management, and everyday family decision-making.",
    stages: [
      stage(
        "foundation-kindergarten",
        "Early measurement begins by noticing attributes such as length, mass, capacity, time, and money in practical family life, even before formal units are secure.",
        [
          {
            id: 1,
            title: "Compare everyday attributes directly",
            meaning:
              "Notice whether something is longer, heavier, fuller, shorter, lighter, or emptier by comparing real objects directly.",
            skillFocus:
              "recognising measurable attributes before formal units are introduced",
            learningIntention:
              "Understand that objects and events can be compared in measurable ways.",
            successCriteria: [
              "The learner can compare two objects by length, mass, or capacity.",
              "The learner can use simple comparison language sensibly.",
              "The learner can explain how the comparison was decided.",
            ],
            practiceActivity:
              "Compare toys, containers, books, or bundles and talk about which is longer, heavier, fuller, or takes longer.",
            evidenceExamples: [
              "photos of direct comparison activities",
              "a parent note about comparison language used",
              "a short learner explanation of how the decision was made",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose the relevant attribute when comparing unfamiliar objects.",
            nextStep:
              "Build on this by using informal units and everyday time or money language more deliberately.",
            reportLanguage:
              "The learner is beginning to notice measurable attributes in everyday objects and can increasingly compare them using simple practical language.",
          },
          {
            id: 2,
            title: "Use everyday time and money language in context",
            meaning:
              "Connect routine experiences such as today, tomorrow, more time, less time, coins, and cost to practical measurement ideas.",
            skillFocus:
              "early awareness of time and money as meaningful measurable contexts",
            learningIntention:
              "Recognise that measurement ideas show up in routines, schedules, and simple family transactions.",
            successCriteria: [
              "The learner can use simple time words meaningfully.",
              "The learner can recognise familiar money or cost situations in play.",
              "The learner can describe simple measurement-related experiences from daily life.",
            ],
            practiceActivity:
              "Talk through routines, waiting times, shop play, or simple spend-and-save scenarios during family life.",
            evidenceExamples: [
              "a parent note about time or money language used naturally",
              "photos of measurement-rich play or routine tasks",
              "a simple learner explanation of a time or cost situation",
            ],
            assessmentCheck:
              "Later, check whether the learner can connect everyday routine language to simple measurable situations.",
            nextStep:
              "Carry these ideas into informal measuring and clearer use of units.",
            reportLanguage:
              "The learner is growing in awareness that time and money can be described and discussed as practical measurement ideas in everyday life.",
          },
        ],
      ),
      stage(
        "lower-primary",
        "Learners begin measuring with informal units and early standard units, using comparison, iteration, and routine contexts such as time, money, and simple length or capacity tasks.",
        [
          {
            id: 1,
            title: "Measure with informal and early standard units",
            meaning:
              "Use repeated units to find out how long, tall, full, or heavy something is, and begin connecting this to familiar standard units.",
            skillFocus:
              "iterating units and understanding measurement as repeated comparison",
            learningIntention:
              "Recognise that measurements depend on using a unit consistently and counting or recording it clearly.",
            successCriteria: [
              "The learner can measure with repeated informal units.",
              "The learner can explain why the same unit should be used consistently.",
              "The learner can record the result in a simple clear way.",
            ],
            practiceActivity:
              "Measure with blocks, footsteps, hand spans, paper clips, or early rulers and compare the results.",
            evidenceExamples: [
              "photos of informal measuring tasks",
              "a learner explanation of why the same unit mattered",
              "a simple record of measured results",
            ],
            assessmentCheck:
              "Later, check whether the learner measures more carefully and consistently when the unit is repeated.",
            nextStep:
              "Use standard tools and units more confidently in familiar length, time, and money situations.",
            reportLanguage:
              "The learner is becoming more confident in measuring with repeated units and is beginning to understand why consistency matters.",
          },
          {
            id: 2,
            title: "Read and use familiar time and money measures",
            meaning:
              "Use clocks, calendars, coins, notes, and simple costs in practical routine situations.",
            skillFocus:
              "working with routine measurement contexts that matter in everyday life",
            learningIntention:
              "Use measurement ideas in practical family decisions and routines, not only in isolated exercises.",
            successCriteria: [
              "The learner can read or describe familiar times and routine time changes.",
              "The learner can recognise and use simple money amounts in context.",
              "The learner can explain a practical time or cost decision.",
            ],
            practiceActivity:
              "Use timetables, routines, shop play, or simple spending tasks that require telling time or comparing amounts.",
            evidenceExamples: [
              "a routine-planning or time record",
              "a simple shop-play or cost-comparison example",
              "a parent note about practical time or money reasoning",
            ],
            assessmentCheck:
              "Later, check whether the learner can use familiar time and money measures with increasing independence.",
            nextStep:
              "Build toward more accurate use of standard units, tools, and simple calculations in measurement tasks.",
            reportLanguage:
              "The learner is increasingly able to use familiar time and money measures in practical everyday situations.",
          },
        ],
      ),
      stage(
        "middle-primary",
        "Measurement becomes more accurate here through standard units, clearer tool use, and deliberate choices about which unit or method best suits the task.",
        [
          {
            id: 1,
            title: "Choose suitable standard units and measuring tools",
            meaning:
              "Decide which unit and tool best fit the quantity being measured and use them with growing accuracy.",
            skillFocus:
              "unit selection, tool use, and accuracy in practical measurement",
            learningIntention:
              "See measurement as a choice-based activity where sensible units and tools matter.",
            successCriteria: [
              "The learner can choose a suitable unit for the task.",
              "The learner can use a measuring tool with growing accuracy.",
              "The learner can explain why that unit or tool was appropriate.",
            ],
            practiceActivity:
              "Measure household items, ingredients, elapsed time, or simple spaces and ask the learner to justify the tool and unit chosen.",
            evidenceExamples: [
              "annotated measuring work",
              "a learner explanation of tool or unit choice",
              "parent notes about careful tool use",
            ],
            assessmentCheck:
              "Later, check whether the learner can independently choose sensible units and measure accurately enough for the context.",
            nextStep:
              "Use measurement more flexibly with simple calculations, perimeter, area, capacity, and elapsed time.",
            reportLanguage:
              "The learner is becoming more deliberate about choosing suitable units and tools and can increasingly measure with practical accuracy.",
          },
          {
            id: 2,
            title: "Estimate and check practical measurements",
            meaning:
              "Use a sensible estimate before or after measuring so results can be judged rather than accepted blindly.",
            skillFocus:
              "estimation and reasonableness in measurement contexts",
            learningIntention:
              "Treat estimation as part of good measuring and checking habits.",
            successCriteria: [
              "The learner can make a sensible estimate before or after measuring.",
              "The learner can notice when a result does not seem reasonable.",
              "The learner can explain how the estimate helped with checking.",
            ],
            practiceActivity:
              "Estimate the length of a room, the mass of a bag, the capacity of a jug, or the time needed for a task, then compare with an actual measurement.",
            evidenceExamples: [
              "a before-and-after estimate record",
              "a learner explanation of how the measurement compared with the estimate",
              "parent notes from a practical estimation discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner uses estimation spontaneously as a measurement-checking habit.",
            nextStep:
              "Carry this into multi-step measurement calculations and more complex unit relationships.",
            reportLanguage:
              "The learner is beginning to use estimation purposefully when measuring and checking whether a practical result is reasonable.",
          },
        ],
      ),
      stage(
        "upper-primary",
        "This stage brings measurement and calculation together through perimeter, area, capacity, elapsed time, angles, conversions, and more deliberate use of fractions and decimals.",
        [
          {
            id: 1,
            title: "Use measurement calculations in practical tasks",
            meaning:
              "Apply number and calculation skills to real measuring tasks that involve more than just reading a tool.",
            skillFocus:
              "combining measurement with calculation and interpretation",
            learningIntention:
              "Use measurement to solve practical problems involving space, time, quantity, and change.",
            successCriteria: [
              "The learner can solve a practical measurement problem using the relevant calculation.",
              "The learner can explain which units were used and why.",
              "The learner can relate the answer back to the context.",
            ],
            practiceActivity:
              "Use fence lengths, recipe amounts, elapsed-time planning, or room-layout tasks that require calculation as well as measuring.",
            evidenceExamples: [
              "a practical measurement task with working",
              "annotated perimeter, area, or time calculations",
              "a learner explanation of how the numbers connect to the measurement",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose and apply the right measurement calculation in a new context.",
            nextStep:
              "Build this into more confident conversions, decimal measures, and accuracy decisions.",
            reportLanguage:
              "The learner is increasingly able to combine measurement with calculation in practical tasks and explain how the result fits the context.",
          },
          {
            id: 2,
            title: "Use fractions, decimals, and conversions in measurement",
            meaning:
              "Work with parts of units and convert between related measures when that supports accuracy or interpretation.",
            skillFocus:
              "decimal and fractional measurement with growing flexibility",
            learningIntention:
              "Recognise that many practical measurements are not whole-number amounts and still need to be used confidently.",
            successCriteria: [
              "The learner can interpret a decimal or fractional measure in context.",
              "The learner can make a sensible simple conversion between related units.",
              "The learner can explain why the conversion or representation was useful.",
            ],
            practiceActivity:
              "Use measuring tapes, recipes, timed activities, or practical design tasks that involve decimal lengths, masses, or capacities.",
            evidenceExamples: [
              "annotated decimal or fractional measurement work",
              "a conversion task with explanation",
              "parent notes from a practical measurement discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can use decimal or fractional measures reliably in new practical tasks.",
            nextStep:
              "Carry this into lower-secondary accuracy, compound measures, and more formal measurement reasoning.",
            reportLanguage:
              "The learner is becoming more flexible with decimal and fractional measurement and can increasingly use conversions to support accurate practical work.",
          },
        ],
      ),
      stage(
        "lower-secondary",
        "Current focus broadens into more deliberate accuracy, conversions, compound measures, and measurement reasoning in scientific, financial, and design-style contexts.",
        [
          {
            id: 1,
            title: "Choose precision and conversions purposefully",
            meaning:
              "Decide how accurate a measurement needs to be and convert units in ways that support clear reasoning.",
            skillFocus:
              "accuracy, precision, and unit conversion in purposeful contexts",
            learningIntention:
              "Measure with judgement, not only procedure, by matching accuracy and units to the task.",
            successCriteria: [
              "The learner can choose an appropriate level of precision for the task.",
              "The learner can convert units accurately enough for the context.",
              "The learner can explain why that degree of accuracy was sensible.",
            ],
            practiceActivity:
              "Use science-style recording, room planning, cost-per-unit measures, or design tasks where unit choice and precision both matter.",
            evidenceExamples: [
              "a measurement task showing chosen precision",
              "a conversion example with explanation",
              "a learner note about why a rounded or exact result was appropriate",
            ],
            assessmentCheck:
              "Later, check whether the learner can justify precision and conversion decisions in an unfamiliar task.",
            nextStep:
              "Apply this judgement in compound measures, volume, angle reasoning, and modelling contexts.",
            reportLanguage:
              "The learner is developing more confidence in choosing suitable precision and unit conversions for practical measurement tasks.",
          },
          {
            id: 2,
            title: "Apply measurement reasoning in design and science contexts",
            meaning:
              "Use measurement to support planning, interpreting, and justifying real tasks where units, scale, and constraints matter.",
            skillFocus:
              "measurement as a tool for modelling and practical decision-making",
            learningIntention:
              "See measurement as a connected part of solving design, science, and planning problems.",
            successCriteria: [
              "The learner can use measurement to justify a practical decision.",
              "The learner can connect units, scale, or dimensions to the purpose of the task.",
              "The learner can check whether the final measurement result is reasonable.",
            ],
            practiceActivity:
              "Plan a layout, interpret a science reading, compare materials, or work through a design brief that depends on accurate measurement reasoning.",
            evidenceExamples: [
              "a design or science measurement summary",
              "a learner explanation of why the measurements mattered",
              "parent notes from a planning or layout discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can use measurement reasoning effectively when the task is less structured.",
            nextStep:
              "This supports later geometry, science, finance, modelling, and more advanced applied mathematics.",
            reportLanguage:
              "The learner is increasingly able to apply measurement reasoning in practical design and science-related contexts and explain the decisions made.",
          },
        ],
      ),
      stage(
        "years-9-10-consolidation",
        "Later consolidation strengthens measurement in modelling, tolerance, complex unit reasoning, and practical problem solving across subjects and real life.",
        [
          {
            id: 1,
            title: "Use measurement confidently in modelling and design",
            meaning:
              "Represent real situations with measurements that are accurate, meaningful, and useful for planning or analysis.",
            skillFocus:
              "measurement-informed modelling and later practical application",
            learningIntention:
              "Use measurement as part of a broader modelling process rather than as an isolated skill.",
            successCriteria: [
              "The learner can build or interpret a model that depends on measurement.",
              "The learner can explain how the chosen units and dimensions support the task.",
              "The learner can evaluate whether the model fits the real situation well enough.",
            ],
            practiceActivity:
              "Model a room layout, budget a project quantity, compare material use, or interpret measured scientific information in context.",
            evidenceExamples: [
              "a modelling or planning task using measurement",
              "annotated dimensions or unit choices",
              "a learner explanation of how measurement supported the model",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose and use measurements confidently in a fresh modelling task.",
            nextStep:
              "Continue strengthening design, science, and finance applications where measurement supports decisions and accuracy.",
            reportLanguage:
              "The learner is consolidating the ability to use measurement confidently in modelling and practical planning tasks.",
          },
          {
            id: 2,
            title: "Refine judgement about reasonableness and accuracy",
            meaning:
              "Check whether measurement results, units, and levels of precision make sense for the real situation.",
            skillFocus:
              "critical measurement judgement in later mathematical and practical contexts",
            learningIntention:
              "Treat accuracy and reasonableness as normal parts of later measurement work.",
            successCriteria: [
              "The learner can explain whether a measured result is believable.",
              "The learner can identify when a unit or level of precision does not fit the task.",
              "The learner can revise or justify the measurement decision clearly.",
            ],
            practiceActivity:
              "Critique measurement choices in plans, diagrams, science reports, or project work and discuss whether they are sensible.",
            evidenceExamples: [
              "a critique of a measurement result or unit choice",
              "a learner reflection on revising a measurement decision",
              "parent notes from a reasonableness discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently uses checking and critique habits in unfamiliar measurement problems.",
            nextStep:
              "These habits support later science, design, geometry, finance, and real-world modelling with measurement.",
            reportLanguage:
              "The learner is strengthening the ability to judge accuracy, choose sensible units, and explain whether measurement results are reasonable in context.",
          },
        ],
      ),
    ],
    portfolioSupport: [
      "Keep one strong practical measuring task and one later calculation-based measurement task so the portfolio shows both hands-on and analytical growth.",
      "Photographs, annotated diagrams, and short explanations often make measurement evidence clearer than final answers alone.",
      "Time, money, cooking, science, and home-project examples often provide the strongest portfolio evidence because the measurement purpose is visible.",
    ],
    reportingSupport: [
      "Reporting can highlight the learner's growing ability to choose suitable units, estimate sensibly, measure accurately, and explain why results make sense.",
      "Practical measurement evidence is often strongest when it comes from family routines, design tasks, or science-style investigations rather than isolated drill work.",
      "Collected examples over time can show a shift from direct comparison and informal units toward confident use of standard units, calculations, and judgement.",
    ],
  });
}

export function buildGeometryAndSpatialReasoningWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return buildWorkspace(currentFocusStageKey, {
    key: "geometry-and-spatial-reasoning",
    trackingKey: "geometry-and-spatial-reasoning",
    title: "Geometry and spatial reasoning",
    subtitle:
      "Geometry and spatial reasoning helps learners work with shape, position, direction, symmetry, angles, transformation, and visualisation. It connects strongly to measurement, design, mapping, and practical problem solving.",
    pathwayLabel: "Geometry and spatial reasoning pathway",
    relationshipTitle: "What this strand builds on",
    relationshipCopy:
      "This strand builds on visual models, measurement, and mathematical reasoning. It supports design, mapping, construction, graphs, art, and practical spatial judgement.",
    stages: [
      stage(
        "foundation-kindergarten",
        "Early geometry begins with noticing shapes, describing where things are, and moving through space with growing confidence.",
        [
          {
            id: 1,
            title: "Recognise familiar shapes in everyday life",
            meaning:
              "Notice common shapes in objects, pictures, and constructions and describe what they look like.",
            skillFocus:
              "shape recognition and early visual classification",
            learningIntention:
              "See that shapes are part of everyday surroundings and can be named, compared, and discussed.",
            successCriteria: [
              "The learner can recognise familiar simple shapes.",
              "The learner can match a shape to an everyday object.",
              "The learner can describe a simple feature of the shape.",
            ],
            practiceActivity:
              "Go on a shape hunt at home, sort blocks, or build pictures with cut-out shapes and talk about what each one looks like.",
            evidenceExamples: [
              "photos of a shape hunt or construction",
              "a parent note about shape language used",
              "a simple drawing or explanation linking a shape to an object",
            ],
            assessmentCheck:
              "Later, check whether the learner can recognise familiar shapes when their size or orientation changes.",
            nextStep:
              "Use this recognition alongside position and direction language in movement and arrangement tasks.",
            reportLanguage:
              "The learner is beginning to recognise familiar shapes and talk about them more confidently in everyday contexts.",
          },
          {
            id: 2,
            title: "Use position and direction language in practical movement",
            meaning:
              "Describe where things are and how to move around or place objects in space.",
            skillFocus:
              "spatial language and navigation in play and routine contexts",
            learningIntention:
              "Develop confidence using words that describe location, direction, and arrangement.",
            successCriteria: [
              "The learner can use simple position words meaningfully.",
              "The learner can follow or give a simple directional instruction.",
              "The learner can describe where an object is in relation to another.",
            ],
            practiceActivity:
              "Use obstacle courses, toy arrangements, treasure hunts, or drawing instructions that depend on left, right, above, below, near, or turn language.",
            evidenceExamples: [
              "a parent note about spatial language in play",
              "photos of a direction or arrangement task",
              "a learner explanation of where something was placed",
            ],
            assessmentCheck:
              "Later, check whether the learner can use position and direction words more independently in new settings.",
            nextStep:
              "Build on this with shape features, symmetry, and simple route reasoning.",
            reportLanguage:
              "The learner is growing in confidence with position and direction language and can increasingly describe spatial relationships in practical tasks.",
          },
        ],
      ),
      stage(
        "lower-primary",
        "Learners begin noticing shape features, simple symmetry, and clearer route or arrangement thinking through drawing, building, and movement tasks.",
        [
          {
            id: 1,
            title: "Describe shape features and simple symmetry",
            meaning:
              "Notice sides, corners, curved edges, and mirror-like balance in familiar shapes and pictures.",
            skillFocus:
              "describing shape properties and early symmetry",
            learningIntention:
              "Use geometry language to explain what makes one shape similar to or different from another.",
            successCriteria: [
              "The learner can describe simple features of a familiar shape.",
              "The learner can identify or create a simple line of symmetry.",
              "The learner can compare two shapes using sensible language.",
            ],
            practiceActivity:
              "Fold paper shapes, sort pattern blocks, or sketch symmetrical pictures and discuss what is the same on both sides.",
            evidenceExamples: [
              "photos of folded or symmetrical work",
              "a learner explanation of shape features",
              "parent notes from a shape comparison discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can recognise simple symmetry in less obvious examples.",
            nextStep:
              "Carry this into shape classification and more deliberate visual reasoning.",
            reportLanguage:
              "The learner is beginning to describe familiar shape features more clearly and is becoming more confident with simple symmetry.",
          },
          {
            id: 2,
            title: "Follow and create simple routes or arrangements",
            meaning:
              "Use spatial reasoning to organise objects, follow directions, or plan simple pathways.",
            skillFocus:
              "practical navigation and arrangement thinking",
            learningIntention:
              "Use spatial reasoning to plan or interpret movement and arrangement in meaningful contexts.",
            successCriteria: [
              "The learner can follow a simple route or arrangement instruction.",
              "The learner can create a simple route or plan for someone else.",
              "The learner can explain the spatial choices made.",
            ],
            practiceActivity:
              "Use simple maps, treasure paths, floor grids, or building tasks that require deliberate arrangement or route planning.",
            evidenceExamples: [
              "a drawn route or arrangement plan",
              "a parent note about how the learner followed directions",
              "a learner explanation of spatial choices",
            ],
            assessmentCheck:
              "Later, check whether the learner can create and explain a simple route more independently.",
            nextStep:
              "Build toward grids, transformations, angles, and more structured spatial visualisation.",
            reportLanguage:
              "The learner is increasingly able to use spatial reasoning when following or creating simple routes and arrangements.",
          },
        ],
      ),
      stage(
        "middle-primary",
        "Geometry becomes more structured through classification, coordinates, transformations, and clearer reasoning about angles, symmetry, and spatial relationships.",
        [
          {
            id: 1,
            title: "Classify shapes and reason about properties",
            meaning:
              "Sort and compare shapes by properties such as sides, angles, symmetry, and other visible features.",
            skillFocus:
              "classification and reasoning about geometric properties",
            learningIntention:
              "Use properties, not only appearance, to describe and compare geometric figures.",
            successCriteria: [
              "The learner can classify familiar shapes by useful properties.",
              "The learner can explain why a shape belongs in a particular group.",
              "The learner can notice similarities and differences between related shapes.",
            ],
            practiceActivity:
              "Sort drawings, nets, pattern blocks, or photographed objects by property and discuss why each group makes sense.",
            evidenceExamples: [
              "a classified shape set with labels",
              "a learner explanation of group choices",
              "parent notes from a geometry discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can classify and justify a new set of shapes with less support.",
            nextStep:
              "Use these same properties in coordinate, transformation, and angle work.",
            reportLanguage:
              "The learner is becoming more confident in classifying shapes by their properties and explaining the reasoning behind those decisions.",
          },
          {
            id: 2,
            title: "Use grids, coordinates, and simple transformations",
            meaning:
              "Describe position and movement more precisely through turns, slides, flips, and grid-based location.",
            skillFocus:
              "structured spatial reasoning through position and transformation",
            learningIntention:
              "Represent movement and location more clearly than informal direction language alone allows.",
            successCriteria: [
              "The learner can locate or describe points and positions on a simple grid.",
              "The learner can show or describe a simple transformation.",
              "The learner can explain how the figure changed or stayed the same.",
            ],
            practiceActivity:
              "Use grid drawings, coordinate treasure maps, or shape-transform tasks that involve slides, flips, and turns.",
            evidenceExamples: [
              "a coordinate or grid task",
              "annotated transformation work",
              "a learner explanation of how a shape moved or changed",
            ],
            assessmentCheck:
              "Later, check whether the learner can use grid or transformation language more independently.",
            nextStep:
              "Carry this into upper-primary spatial reasoning, angle work, and design applications.",
            reportLanguage:
              "The learner is increasingly able to use grids, coordinates, and simple transformations to describe spatial relationships more precisely.",
          },
        ],
      ),
      stage(
        "upper-primary",
        "Learners bring angle, transformation, nets, and spatial visualisation together so geometry can support design, measurement, and practical reasoning more strongly.",
        [
          {
            id: 1,
            title: "Use angles, turns, and orientation meaningfully",
            meaning:
              "Recognise and compare angles and use turning or orientation language more deliberately in practical tasks.",
            skillFocus:
              "angle awareness and directional reasoning in spatial tasks",
            learningIntention:
              "See angles and turns as useful ways of describing spatial change and position.",
            successCriteria: [
              "The learner can recognise and compare familiar angle sizes.",
              "The learner can describe turns or changes in direction clearly.",
              "The learner can connect angle language to a practical or drawn example.",
            ],
            practiceActivity:
              "Use routes, sport movement, construction, or drawing tasks where turning and angle language help explain the action.",
            evidenceExamples: [
              "annotated turning or angle tasks",
              "a learner explanation of direction change",
              "parent notes from a practical movement or drawing discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose and use angle language appropriately in new situations.",
            nextStep:
              "Use angle reasoning alongside shape properties, transformations, and measurement.",
            reportLanguage:
              "The learner is becoming more confident in using angle and turning language to describe spatial change and position.",
          },
          {
            id: 2,
            title: "Visualise and build shapes in two and three dimensions",
            meaning:
              "Move between drawings, nets, models, and real objects to reason about shape and space.",
            skillFocus:
              "spatial visualisation and shape construction",
            learningIntention:
              "Use visual reasoning to understand how shapes fit together, unfold, or look from different viewpoints.",
            successCriteria: [
              "The learner can interpret or build a simple net or model.",
              "The learner can describe features of a three-dimensional shape from its representation.",
              "The learner can explain how two-dimensional and three-dimensional views connect.",
            ],
            practiceActivity:
              "Build models, fold nets, sketch top or side views, or use household packaging to discuss how shapes fit together.",
            evidenceExamples: [
              "photos of built models or nets",
              "a learner explanation linking a net to a solid",
              "parent notes about spatial reasoning during a design task",
            ],
            assessmentCheck:
              "Later, check whether the learner can visualise simple shape changes or views with less support.",
            nextStep:
              "Carry this into lower-secondary geometric reasoning, scale, and formal spatial justification.",
            reportLanguage:
              "The learner is increasingly able to visualise and build shapes across two and three dimensions and explain how those representations connect.",
          },
        ],
      ),
      stage(
        "lower-secondary",
        "Current focus strengthens geometric reasoning through angle relationships, transformations, spatial justification, and clearer links between geometry, measurement, and design.",
        [
          {
            id: 1,
            title: "Reason about geometric relationships and transformations",
            meaning:
              "Use properties, angle relationships, and transformations to justify geometric conclusions more clearly.",
            skillFocus:
              "geometric justification and relational reasoning",
            learningIntention:
              "Move from describing shapes to explaining why geometric relationships hold.",
            successCriteria: [
              "The learner can use properties or angle relationships to justify a claim.",
              "The learner can describe a transformation and its effect accurately.",
              "The learner can explain how geometry connects to the problem context.",
            ],
            practiceActivity:
              "Use angle puzzles, transformation tasks, tiling patterns, or design examples where the learner must justify what stays the same or changes.",
            evidenceExamples: [
              "annotated geometric reasoning work",
              "a learner explanation of a transformation or angle relationship",
              "parent notes from a justification discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can justify a geometric conclusion without relying only on visual guesswork.",
            nextStep:
              "Use this confidence in scale, design, coordinate geometry, and later modelling.",
            reportLanguage:
              "The learner is developing stronger geometric reasoning and can increasingly justify angle, transformation, and shape relationships with clearer explanation.",
          },
          {
            id: 2,
            title: "Apply spatial reasoning in design, mapping, and layout",
            meaning:
              "Use geometry to plan, interpret, or critique arrangements of space in practical contexts.",
            skillFocus:
              "applied geometry in layout, mapping, and design decisions",
            learningIntention:
              "See geometry as a practical tool for organising and understanding space.",
            successCriteria: [
              "The learner can use geometry to solve a layout or mapping task.",
              "The learner can explain how shape, angle, position, or transformation affected the decision.",
              "The learner can check whether the geometric solution is practical and reasonable.",
            ],
            practiceActivity:
              "Plan a room, interpret a map, design a pattern, or solve a layout challenge that depends on spatial reasoning.",
            evidenceExamples: [
              "a design or mapping task with explanation",
              "a learner reflection on spatial choices made",
              "parent notes from a layout or planning discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can apply spatial reasoning effectively in a less structured real task.",
            nextStep:
              "This supports later measurement, modelling, coordinate work, and design-oriented mathematics.",
            reportLanguage:
              "The learner is increasingly able to apply geometry and spatial reasoning to design, mapping, and layout situations in a thoughtful way.",
          },
        ],
      ),
      stage(
        "years-9-10-consolidation",
        "Later consolidation uses geometry more flexibly for modelling, coordinate reasoning, design, proof-style explanation, and critical spatial judgement.",
        [
          {
            id: 1,
            title: "Use geometry to model and interpret space",
            meaning:
              "Apply geometric relationships to plans, diagrams, transformations, and coordinate-based representations of real situations.",
            skillFocus:
              "geometric modelling and later applied spatial reasoning",
            learningIntention:
              "Use geometry as a structured language for understanding space, not only as a list of shape facts.",
            successCriteria: [
              "The learner can build or interpret a geometric model of a situation.",
              "The learner can connect coordinate, angle, or transformation reasoning to the model.",
              "The learner can explain why the model is a useful fit for the task.",
            ],
            practiceActivity:
              "Work with plans, digital design-style drawings, transformed images, or coordinate-based representations and explain what the geometry shows.",
            evidenceExamples: [
              "a geometric model or plan with explanation",
              "annotated coordinate or transformation reasoning",
              "a learner reflection on how geometry supported the task",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose and interpret a geometric model in a new context.",
            nextStep:
              "Continue strengthening geometry across design, graphs, measurement, and later mathematical proof.",
            reportLanguage:
              "The learner is consolidating the ability to use geometry and spatial reasoning to model and interpret space in meaningful contexts.",
          },
          {
            id: 2,
            title: "Refine spatial judgement and explanation",
            meaning:
              "Check whether geometric reasoning is sound and communicate it clearly using diagrams, language, and linked ideas.",
            skillFocus:
              "critical explanation and judgement in later geometry",
            learningIntention:
              "Treat explanation, checking, and representation as essential parts of geometric work.",
            successCriteria: [
              "The learner can explain a geometric conclusion clearly and logically.",
              "The learner can identify when a spatial claim or diagram is misleading or incomplete.",
              "The learner can revise or strengthen a geometric explanation when needed.",
            ],
            practiceActivity:
              "Critique diagrams, compare two geometric approaches, or justify a design or layout decision with clear reasoning.",
            evidenceExamples: [
              "a written or verbal geometric justification",
              "annotated critique of a diagram or claim",
              "parent notes from a later-stage reasoning discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently checks and refines geometric explanations in unfamiliar tasks.",
            nextStep:
              "These habits support later modelling, measurement, design, graphs, and more formal mathematical proof.",
            reportLanguage:
              "The learner is strengthening the ability to judge, justify, and clearly communicate geometric reasoning in later mathematical work.",
          },
        ],
      ),
    ],
    portfolioSupport: [
      "Keep one strong construction, mapping, or layout task and one later reasoning example so the portfolio shows both visual exploration and structured geometric thinking.",
      "Photographs, diagrams, and learner explanations often make spatial understanding much clearer than final answers alone.",
      "Design, art, mapping, and building tasks often provide the strongest portfolio evidence because the geometry is visible and purposeful.",
    ],
    reportingSupport: [
      "Reporting can highlight the learner's growing confidence in recognising shapes, using spatial language, and justifying geometric ideas more clearly over time.",
      "Evidence is often strongest when geometry is connected to drawing, design, mapping, or practical arrangement tasks rather than isolated shape worksheets.",
      "Collected examples over time can show a shift from noticing shapes and position toward confident use of properties, transformations, and spatial explanation.",
    ],
  });
}

export function buildStatisticsAndDataWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return buildWorkspace(currentFocusStageKey, {
    key: "statistics-and-data",
    trackingKey: "statistics-and-data",
    title: "Statistics and data",
    subtitle:
      "Statistics and data helps learners ask questions, collect information, organise it clearly, notice patterns, and interpret claims with growing care. It connects strongly to number, reasoning, percentages, and probability.",
    pathwayLabel: "Statistics and data pathway",
    relationshipTitle: "What this strand builds on",
    relationshipCopy:
      "This strand builds on counting, number comparison, reasoning, and later percentage and probability ideas. It supports decision-making, interpretation, and critical thinking in everyday life.",
    stages: [
      stage(
        "foundation-kindergarten",
        "Early data ideas begin with sorting, matching, and talking about what is the same, different, or most common in familiar collections.",
        [
          {
            id: 1,
            title: "Sort and group familiar information",
            meaning:
              "Organise objects, pictures, or simple choices into groups that make sense and talk about what was noticed.",
            skillFocus:
              "categorising and noticing patterns in simple sets",
            learningIntention:
              "Recognise that information can be organised to make it easier to see and discuss.",
            successCriteria: [
              "The learner can sort items into sensible groups.",
              "The learner can explain how the groups were chosen.",
              "The learner can notice a simple pattern such as which group has more.",
            ],
            practiceActivity:
              "Sort toys, leaves, snacks, or picture cards and talk about what the groups show.",
            evidenceExamples: [
              "photos of grouped collections",
              "a learner explanation of how the sorting rule worked",
              "a parent note about noticing most, least, or same",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose a useful grouping rule independently.",
            nextStep:
              "Build on this by counting grouped information and talking about simple comparisons.",
            reportLanguage:
              "The learner is beginning to organise familiar information into sensible groups and can increasingly talk about simple patterns in the results.",
          },
          {
            id: 2,
            title: "Talk about most, least, and same in simple data",
            meaning:
              "Use comparison language to describe what a small collection or group of information is showing.",
            skillFocus:
              "describing simple data comparisons in everyday language",
            learningIntention:
              "Use observations from sorted information to make simple statements about what is most common or least common.",
            successCriteria: [
              "The learner can identify which group has most or least.",
              "The learner can describe whether two groups are the same.",
              "The learner can explain what the data is showing in a simple way.",
            ],
            practiceActivity:
              "Use favourite-colour votes, snack choices, or weather tallies and discuss what the results show.",
            evidenceExamples: [
              "a parent note from a data conversation",
              "a simple tally or group comparison",
              "a short learner explanation of what was most or least common",
            ],
            assessmentCheck:
              "Later, check whether the learner can describe simple data comparisons more independently.",
            nextStep:
              "Carry this into lower-primary tallying and simple graphs.",
            reportLanguage:
              "The learner is growing in confidence when describing simple data using language such as most, least, and same.",
          },
        ],
      ),
      stage(
        "lower-primary",
        "Learners begin collecting information deliberately, recording it with tallies or simple graphs, and explaining what the results show.",
        [
          {
            id: 1,
            title: "Collect and record simple data",
            meaning:
              "Gather information from a question or observation and record it so it can be counted and discussed.",
            skillFocus:
              "basic data collection and clear recording",
            learningIntention:
              "Understand that a good question and a clear record help make information easier to interpret.",
            successCriteria: [
              "The learner can help gather information for a simple question.",
              "The learner can record results clearly with tallies, marks, or symbols.",
              "The learner can explain what the record represents.",
            ],
            practiceActivity:
              "Survey favourite books, count weather over several days, or record simple family choices using tallies or symbols.",
            evidenceExamples: [
              "a simple tally or survey sheet",
              "a learner explanation of what was counted",
              "parent notes from a data-collection task",
            ],
            assessmentCheck:
              "Later, check whether the learner can gather and record data more independently for a simple question.",
            nextStep:
              "Use the recorded data in picture graphs or bar-style representations.",
            reportLanguage:
              "The learner is beginning to collect and record simple data more clearly and can explain what the results represent.",
          },
          {
            id: 2,
            title: "Read and discuss simple graphs",
            meaning:
              "Use a simple data display to answer questions and talk about what is most, least, or equal.",
            skillFocus:
              "interpreting straightforward representations of data",
            learningIntention:
              "See a graph as a useful picture of information, not only as a drawing activity.",
            successCriteria: [
              "The learner can identify what a simple graph is showing.",
              "The learner can answer direct questions from the graph.",
              "The learner can describe one or two patterns noticed in the data.",
            ],
            practiceActivity:
              "Make simple picture or bar graphs from family surveys and ask what the display shows.",
            evidenceExamples: [
              "a simple graph with questions answered",
              "a learner explanation of what the graph shows",
              "a parent note about patterns the learner noticed",
            ],
            assessmentCheck:
              "Later, check whether the learner can interpret a simple graph without being guided to each feature.",
            nextStep:
              "Build toward comparing categories, choosing useful displays, and asking better questions.",
            reportLanguage:
              "The learner is increasingly able to read simple graphs and describe clear patterns in the information shown.",
          },
        ],
      ),
      stage(
        "middle-primary",
        "Data work becomes more purposeful here through better questions, clearer displays, and more thoughtful comparison of categories and trends.",
        [
          {
            id: 1,
            title: "Choose useful ways to organise and display data",
            meaning:
              "Decide how to show information clearly so the main pattern or comparison is easier to see.",
            skillFocus:
              "selecting and organising data displays for clarity",
            learningIntention:
              "Recognise that different displays can help different questions or comparisons.",
            successCriteria: [
              "The learner can choose a sensible way to organise the data.",
              "The learner can explain why the display helps show the information.",
              "The learner can create a display that can be read by someone else.",
            ],
            practiceActivity:
              "Compare tables, tally charts, and graphs from a small survey or investigation and discuss which one shows the pattern most clearly.",
            evidenceExamples: [
              "a chosen data display with explanation",
              "a learner comparison of two display types",
              "parent notes from a data-organisation discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose and justify a useful display for a new set of data.",
            nextStep:
              "Use this organisation to compare categories and talk more carefully about trends.",
            reportLanguage:
              "The learner is beginning to choose more useful ways to organise and display data and can increasingly explain why a format was helpful.",
          },
          {
            id: 2,
            title: "Compare categories and describe trends",
            meaning:
              "Look across a data set and describe which categories are larger, smaller, similar, or changing in noticeable ways.",
            skillFocus:
              "comparison and interpretation of emerging patterns in data",
            learningIntention:
              "Use data displays to make sensible observations rather than only reading single values.",
            successCriteria: [
              "The learner can compare two or more categories from a display.",
              "The learner can describe a trend or clear pattern.",
              "The learner can support the observation with evidence from the display.",
            ],
            practiceActivity:
              "Use weekly weather charts, reading logs, spending records, or simple sports data and talk about what patterns seem to be emerging.",
            evidenceExamples: [
              "a data comparison with short written interpretation",
              "a learner explanation of a trend noticed",
              "parent notes from a graph discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can make and support a simple data-based claim independently.",
            nextStep:
              "Carry this into larger data sets, percentages, averages, and questioning whether displays could mislead.",
            reportLanguage:
              "The learner is increasingly able to compare categories in data and describe patterns or trends with reference to the evidence shown.",
          },
        ],
      ),
      stage(
        "upper-primary",
        "Learners now work with richer displays, averages, percentages, and more careful interpretation of what data can and cannot show.",
        [
          {
            id: 1,
            title: "Interpret richer graphs and summary measures",
            meaning:
              "Use graphs, tables, and simple summary measures to understand what a data set is suggesting.",
            skillFocus:
              "reading more complex displays and using summary information",
            learningIntention:
              "Look beyond single values and notice overall patterns, comparisons, and typical results.",
            successCriteria: [
              "The learner can read a richer graph or table accurately.",
              "The learner can use a simple summary such as average or total to support interpretation.",
              "The learner can explain what the data suggests overall.",
            ],
            practiceActivity:
              "Use household spending charts, reading statistics, temperature records, or sports tables and discuss the overall picture.",
            evidenceExamples: [
              "annotated graph interpretation work",
              "a learner explanation using a total or average",
              "parent notes from a richer data discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can interpret a less familiar display with reasonable independence.",
            nextStep:
              "Use this confidence to question whether data displays are clear, fair, or potentially misleading.",
            reportLanguage:
              "The learner is becoming more confident in interpreting richer graphs and using summary information to describe what a data set suggests.",
          },
          {
            id: 2,
            title: "Question displays and simple data claims",
            meaning:
              "Notice that the way data is collected or shown can affect the conclusions people draw from it.",
            skillFocus:
              "critical interpretation of data displays and claims",
            learningIntention:
              "Treat data as something to interpret thoughtfully, not just accept at face value.",
            successCriteria: [
              "The learner can identify a feature of a display that affects interpretation.",
              "The learner can question whether a claim is fully supported by the data shown.",
              "The learner can explain what other information might be useful.",
            ],
            practiceActivity:
              "Compare two graphs of similar information, look at media claims, or discuss how survey questions affect the results.",
            evidenceExamples: [
              "a critique of a graph or claim",
              "a learner explanation of why a display could be misleading",
              "parent notes from a data-claim discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently notices issues with clarity or fairness in a data display.",
            nextStep:
              "Build toward lower-secondary reasoning with percentages, variability, and evidence-based claims.",
            reportLanguage:
              "The learner is beginning to question data displays and simple claims more thoughtfully, rather than accepting them without review.",
          },
        ],
      ),
      stage(
        "lower-secondary",
        "Current focus includes percentages, broader data interpretation, and more careful reasoning about what evidence supports a conclusion and what does not.",
        [
          {
            id: 1,
            title: "Interpret data using percentages, comparisons, and trends",
            meaning:
              "Use percentages, rates, and comparisons to describe what a data set suggests more precisely.",
            skillFocus:
              "connecting numerical reasoning to stronger data interpretation",
            learningIntention:
              "Use number relationships to make data interpretation clearer and more informative.",
            successCriteria: [
              "The learner can use a percentage or comparative measure to interpret data.",
              "The learner can explain a trend or contrast more precisely than before.",
              "The learner can connect the numbers back to the context of the data.",
            ],
            practiceActivity:
              "Interpret survey results, sports data, spending records, or environmental observations using percentages or comparative language.",
            evidenceExamples: [
              "a percentage-based data interpretation",
              "annotated graphs or tables with conclusions",
              "a learner explanation connecting the numbers to the situation",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose a helpful numerical lens for interpreting a fresh data set.",
            nextStep:
              "Use this precision to question claims, variability, and fairness more deliberately.",
            reportLanguage:
              "The learner is increasingly able to interpret data with greater precision by using percentages, comparisons, and clearer trend language.",
          },
          {
            id: 2,
            title: "Judge whether data supports a claim",
            meaning:
              "Look at evidence, question assumptions, and decide whether a conclusion is justified by the data available.",
            skillFocus:
              "evidence-based reasoning and critique in data contexts",
            learningIntention:
              "Treat data interpretation as a reasoning task, not only a graph-reading exercise.",
            successCriteria: [
              "The learner can decide whether a claim is supported by the data shown.",
              "The learner can explain what evidence supports or weakens the claim.",
              "The learner can suggest what extra information might improve the conclusion.",
            ],
            practiceActivity:
              "Review charts from media, family surveys, or project records and discuss whether the conclusions drawn are fair and well supported.",
            evidenceExamples: [
              "a written or verbal critique of a data claim",
              "a learner explanation of missing or weak evidence",
              "parent notes from a data-judgement discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently questions the strength of a data-based claim.",
            nextStep:
              "This supports later statistics, probability, financial interpretation, and critical reasoning across subjects.",
            reportLanguage:
              "The learner is developing stronger judgement about whether data truly supports a claim and can increasingly explain the evidence used.",
          },
        ],
      ),
      stage(
        "years-9-10-consolidation",
        "Later consolidation strengthens critical interpretation, variability, sampling awareness, and clearer communication of evidence-based conclusions.",
        [
          {
            id: 1,
            title: "Interpret data critically across real contexts",
            meaning:
              "Use statistical thinking to interpret patterns, variability, and comparisons in realistic data sets.",
            skillFocus:
              "critical statistical interpretation in later contexts",
            learningIntention:
              "Recognise that useful data interpretation depends on context, evidence, and thoughtful judgement.",
            successCriteria: [
              "The learner can interpret a more complex or realistic data set thoughtfully.",
              "The learner can discuss patterns, outliers, or variability where relevant.",
              "The learner can explain what conclusions are sensible and what remains uncertain.",
            ],
            practiceActivity:
              "Interpret broader survey results, environmental data, spending patterns, or sports records and discuss what can reasonably be concluded.",
            evidenceExamples: [
              "a later-stage data interpretation summary",
              "annotated analysis of a realistic data set",
              "a learner explanation of uncertainty or variability",
            ],
            assessmentCheck:
              "Later, check whether the learner can interpret unfamiliar data critically without overclaiming.",
            nextStep:
              "Continue strengthening evidence-based reasoning in finance, science, civics, and wider real-world decision-making.",
            reportLanguage:
              "The learner is consolidating the ability to interpret data critically and communicate evidence-based conclusions with more maturity.",
          },
          {
            id: 2,
            title: "Refine explanation, questioning, and evidence use",
            meaning:
              "Communicate what the data shows, what it does not show, and how confident a conclusion should be.",
            skillFocus:
              "clear communication and critique in later data reasoning",
            learningIntention:
              "Treat questioning, evidence use, and careful explanation as central habits in statistics and data work.",
            successCriteria: [
              "The learner can communicate a data-based conclusion clearly.",
              "The learner can question weak claims or missing evidence thoughtfully.",
              "The learner can explain the limits of the interpretation as well as the strengths.",
            ],
            practiceActivity:
              "Write or discuss short data summaries, compare competing claims, or critique how a report uses evidence.",
            evidenceExamples: [
              "a written data summary with caveats",
              "a learner critique of weak evidence use",
              "parent notes from a statistics discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently uses careful evidence language when interpreting data.",
            nextStep:
              "These habits continue to support probability, finance, media literacy, science, and later modelling.",
            reportLanguage:
              "The learner is strengthening the ability to question, justify, and communicate statistical conclusions with appropriate care and balance.",
          },
        ],
      ),
    ],
    portfolioSupport: [
      "Keep one clear early data collection example and one later interpretation or critique example so the portfolio shows growth from organising information to reasoning from evidence.",
      "Learner explanations are especially useful here because they reveal whether conclusions come from the data or from guesswork.",
      "Family surveys, reading logs, weather records, budgets, and sports data often provide strong portfolio evidence because the context is easy to understand.",
    ],
    reportingSupport: [
      "Reporting can highlight the learner's growing ability to collect information, choose useful displays, and make evidence-based observations with increasing care.",
      "Examples are often strongest when the learner explains what the data shows, what patterns were noticed, and how reliable the conclusion seems.",
      "Collected evidence over time can show a shift from simple sorting and graph reading toward critical interpretation and thoughtful questioning of data claims.",
    ],
  });
}

export function buildProbabilityAndChanceWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return buildWorkspace(currentFocusStageKey, {
    key: "probability-and-chance",
    trackingKey: "probability-and-chance",
    title: "Probability and chance",
    subtitle:
      "Probability and chance helps learners describe uncertainty, compare likelihood, and judge fairness in games and real situations. It builds naturally on fractions, statistics, and mathematical reasoning.",
    pathwayLabel: "Probability and chance pathway",
    relationshipTitle: "What this strand builds on",
    relationshipCopy:
      "This strand builds on fraction thinking, data interpretation, and reasoning. It connects to games, prediction, risk, statistics, and later decision-making.",
    stages: [
      stage(
        "foundation-kindergarten",
        "Early chance ideas begin with everyday language about what might happen, what is certain, and what seems unlikely in familiar games and routines.",
        [
          {
            id: 1,
            title: "Use everyday chance language meaningfully",
            meaning:
              "Talk about whether something will happen, might happen, or probably will not happen in simple familiar situations.",
            skillFocus:
              "recognising uncertainty through practical language and experience",
            learningIntention:
              "Use everyday language to describe chance in ways that connect to real experiences.",
            successCriteria: [
              "The learner can use words such as will, might, or won't in a sensible way.",
              "The learner can relate the language to a familiar event.",
              "The learner can explain why an event seems more or less likely.",
            ],
            practiceActivity:
              "Discuss weather, game turns, story events, or simple routines and ask what is certain, possible, or unlikely.",
            evidenceExamples: [
              "a parent note about chance language in discussion",
              "a simple oral prediction from a game or routine",
              "a learner explanation of why an event might happen",
            ],
            assessmentCheck:
              "Later, check whether the learner can use chance language in a fresh context without heavy prompting.",
            nextStep:
              "Build on this by comparing which of two events seems more likely or fair.",
            reportLanguage:
              "The learner is beginning to use everyday chance language more meaningfully and can increasingly explain simple ideas about likelihood.",
          },
          {
            id: 2,
            title: "Notice fairness in simple games",
            meaning:
              "Use early chance thinking to decide whether a simple game or choice feels fair.",
            skillFocus:
              "linking probability ideas to fairness in play",
            learningIntention:
              "Recognise that chance can help explain whether a game gives equal opportunities.",
            successCriteria: [
              "The learner can say whether a simple game seems fair or unfair.",
              "The learner can describe one reason for that judgement.",
              "The learner can suggest a small change to make a game fairer.",
            ],
            practiceActivity:
              "Play spinner, card, or dice-style games and talk about who has the better chance and why.",
            evidenceExamples: [
              "a parent note from a fairness discussion",
              "a learner suggestion for improving a game",
              "a simple drawing or explanation of why one outcome was favoured",
            ],
            assessmentCheck:
              "Later, check whether the learner can notice fairness issues without needing the answer pointed out.",
            nextStep:
              "Carry this into lower-primary comparisons of likely and unlikely outcomes.",
            reportLanguage:
              "The learner is growing in confidence when noticing fairness in simple games and can increasingly give a reason for the judgement made.",
          },
        ],
      ),
      stage(
        "lower-primary",
        "Learners begin comparing events more deliberately, describing what is more or less likely, and connecting chance language to repeated practical experiences.",
        [
          {
            id: 1,
            title: "Compare likely and unlikely events",
            meaning:
              "Decide which event seems more likely, less likely, or equally likely in simple contexts.",
            skillFocus:
              "relative likelihood in familiar chance situations",
            learningIntention:
              "Use comparison language to reason about chance rather than only label single events.",
            successCriteria: [
              "The learner can compare two simple chance events.",
              "The learner can use likely, unlikely, or equally likely sensibly.",
              "The learner can explain the comparison with a practical reason.",
            ],
            practiceActivity:
              "Compare spinner sections, card colours, or simple weather possibilities and discuss which event seems more likely and why.",
            evidenceExamples: [
              "a learner explanation comparing two events",
              "a parent note about probability language used",
              "a simple record of likely and unlikely choices",
            ],
            assessmentCheck:
              "Later, check whether the learner can make and justify simple likelihood comparisons independently.",
            nextStep:
              "Build on this through repeated trials and tallying what actually happens.",
            reportLanguage:
              "The learner is becoming more confident in comparing likely and unlikely events and can increasingly justify the comparison made.",
          },
          {
            id: 2,
            title: "Record simple chance outcomes from repeated trials",
            meaning:
              "Notice that a chance event can be repeated and the results recorded to help discussion.",
            skillFocus:
              "early experimental probability through simple trials",
            learningIntention:
              "Connect chance language to actual outcomes rather than treating it as guesswork alone.",
            successCriteria: [
              "The learner can take part in repeated simple chance trials.",
              "The learner can record or tally the outcomes clearly.",
              "The learner can describe what happened most or least often.",
            ],
            practiceActivity:
              "Flip coins, spin spinners, or roll dice several times and keep a simple record of the results.",
            evidenceExamples: [
              "a simple tally of repeated outcomes",
              "a learner explanation of which result happened more often",
              "parent notes from a practical chance activity",
            ],
            assessmentCheck:
              "Later, check whether the learner can connect repeated results to a simple judgement about likelihood.",
            nextStep:
              "Use these records to compare expected and actual outcomes more thoughtfully.",
            reportLanguage:
              "The learner is beginning to record repeated chance outcomes and use those results to talk more clearly about what happened.",
          },
        ],
      ),
      stage(
        "middle-primary",
        "Chance becomes more structured through tallying, fraction language, and clearer reasoning about fairness and repeated results.",
        [
          {
            id: 1,
            title: "Use simple fraction ideas to describe chance",
            meaning:
              "Describe the likelihood of a simple event using part-whole language where the possible outcomes are visible or easy to list.",
            skillFocus:
              "connecting fraction understanding to probability",
            learningIntention:
              "See that chance can often be described as a part of all the possible outcomes.",
            successCriteria: [
              "The learner can list or describe simple possible outcomes.",
              "The learner can use a simple fraction to describe a chance situation.",
              "The learner can explain what the fraction represents in context.",
            ],
            practiceActivity:
              "Use coloured counters, simple spinners, or card sets and ask what fraction of the outcomes fit a particular event.",
            evidenceExamples: [
              "a worked example using fraction language for chance",
              "a learner explanation of the possible outcomes",
              "parent notes from a probability discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can connect fraction ideas to unfamiliar chance examples with growing confidence.",
            nextStep:
              "Use this same thinking to compare expected results with what happens in experiments.",
            reportLanguage:
              "The learner is beginning to connect fraction ideas to simple chance situations and can increasingly explain what the representation means.",
          },
          {
            id: 2,
            title: "Compare expected and actual outcomes",
            meaning:
              "Notice that repeated trials may vary but still show patterns connected to how likely an event is.",
            skillFocus:
              "experimental probability and fairness reasoning",
            learningIntention:
              "Use data from repeated trials to think more carefully about fairness and likelihood.",
            successCriteria: [
              "The learner can compare what was expected with what actually happened.",
              "The learner can notice when a short run of results looks surprising.",
              "The learner can explain whether repeated results still seem fair overall.",
            ],
            practiceActivity:
              "Repeat chance experiments, record outcomes, and compare the tally to what was expected before the trials began.",
            evidenceExamples: [
              "a trial record with expected and actual comparison",
              "a learner explanation of whether the game still seemed fair",
              "parent notes from a chance experiment discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can use data from trials to refine a fairness judgement.",
            nextStep:
              "Carry this into decimal, percentage, and richer lower-secondary probability comparisons.",
            reportLanguage:
              "The learner is increasingly able to compare expected and actual chance outcomes and use those results to discuss fairness more thoughtfully.",
          },
        ],
      ),
      stage(
        "upper-primary",
        "Probability now connects more clearly to fractions, decimals, and percentages, with growing confidence in comparing and representing likelihood.",
        [
          {
            id: 1,
            title: "Represent chance with fractions, decimals, or percentages",
            meaning:
              "Use different forms to describe and compare simple probabilities more flexibly.",
            skillFocus:
              "flexible representation of probability",
            learningIntention:
              "Recognise that probability can be expressed in different but connected ways depending on what is most useful.",
            successCriteria: [
              "The learner can describe a simple probability in more than one form.",
              "The learner can explain which form is useful in the task.",
              "The learner can compare two probabilities using a clear representation.",
            ],
            practiceActivity:
              "Use spinners, surveys, game outcomes, or weather-style likelihood scales and compare fraction, decimal, or percentage descriptions.",
            evidenceExamples: [
              "a probability comparison using more than one form",
              "a learner explanation of why one form was useful",
              "parent notes from a representation discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose and interpret a helpful representation independently.",
            nextStep:
              "Use this flexibility when comparing games, risks, or repeated outcomes more critically.",
            reportLanguage:
              "The learner is becoming more flexible in representing and comparing simple probabilities using fractions, decimals, and percentages.",
          },
          {
            id: 2,
            title: "Judge fairness and likelihood more precisely",
            meaning:
              "Use probability language and representation to make clearer decisions about games, choices, and risk.",
            skillFocus:
              "more precise reasoning about fairness and chance",
            learningIntention:
              "Use probability as a reasoning tool rather than only as a game outcome label.",
            successCriteria: [
              "The learner can compare two probability situations precisely enough to justify a decision.",
              "The learner can explain whether a game or choice is fair.",
              "The learner can support the judgement with representation or trial evidence.",
            ],
            practiceActivity:
              "Compare games, raffle-style choices, or classroom-style chance tasks and decide which seems fairer or more likely to lead to a result.",
            evidenceExamples: [
              "a fairness judgement with supporting evidence",
              "a learner explanation of a probability comparison",
              "parent notes from a game-analysis discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can justify a fairness decision without relying only on intuition.",
            nextStep:
              "Build toward lower-secondary probability using data, representation, and reasoned interpretation.",
            reportLanguage:
              "The learner is increasingly able to judge fairness and likelihood with more precise language and supporting reasoning.",
          },
        ],
      ),
      stage(
        "lower-secondary",
        "Current focus strengthens links between probability, data, and reasoning, especially when comparing theoretical expectations with experimental results.",
        [
          {
            id: 1,
            title: "Compare theoretical and experimental probability",
            meaning:
              "Use representation and trial data together to reason about what should happen and what actually happened.",
            skillFocus:
              "linking theoretical and experimental probability through interpretation",
            learningIntention:
              "Understand that trials may vary while still relating to an expected probability pattern over time.",
            successCriteria: [
              "The learner can describe the expected probability of a simple event.",
              "The learner can compare the expected result with trial data.",
              "The learner can explain whether the difference seems reasonable.",
            ],
            practiceActivity:
              "Run repeated experiments, record the data, and discuss how close or far the results were from the expected chance.",
            evidenceExamples: [
              "a table or graph comparing expected and actual results",
              "a learner explanation of why variation might occur",
              "parent notes from a probability-data discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can interpret variation in experimental results without treating every difference as an error.",
            nextStep:
              "Use this reasoning to judge chance claims, risks, and uncertainty more critically.",
            reportLanguage:
              "The learner is developing stronger understanding of the relationship between theoretical and experimental probability and can increasingly explain reasonable variation.",
          },
          {
            id: 2,
            title: "Use probability to judge risk and uncertainty",
            meaning:
              "Apply chance reasoning to games, decisions, and practical situations where outcomes are uncertain.",
            skillFocus:
              "interpreting risk, chance, and uncertainty in practical contexts",
            learningIntention:
              "See probability as a tool for making thoughtful judgments when outcomes are not certain.",
            successCriteria: [
              "The learner can compare the risk or likelihood of different options.",
              "The learner can justify a probability-based choice or judgement.",
              "The learner can explain what remains uncertain even after the comparison.",
            ],
            practiceActivity:
              "Discuss games, weather forecasts, safety scenarios, or simple financial or practical risks and compare how likely different outcomes seem.",
            evidenceExamples: [
              "a written or verbal risk comparison",
              "a learner explanation of an uncertain choice",
              "parent notes from a probability decision discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can use probability reasoning thoughtfully in a new uncertain situation.",
            nextStep:
              "This supports later data interpretation, modelling, science reasoning, and critical judgement about uncertain claims.",
            reportLanguage:
              "The learner is increasingly able to use probability ideas to judge risk and uncertainty and explain the reasoning behind those decisions.",
          },
        ],
      ),
      stage(
        "years-9-10-consolidation",
        "Later consolidation uses probability more flexibly in data interpretation, risk reasoning, modelling, and critique of chance-based claims.",
        [
          {
            id: 1,
            title: "Interpret probability in data-rich and realistic contexts",
            meaning:
              "Use probability ideas alongside data and context to judge how likely outcomes are and how strong conclusions should be.",
            skillFocus:
              "later probability interpretation across realistic scenarios",
            learningIntention:
              "Use probability as part of broader evidence-based reasoning rather than as an isolated topic.",
            successCriteria: [
              "The learner can interpret a realistic probability situation thoughtfully.",
              "The learner can connect probability to supporting data or context.",
              "The learner can explain what the probability does and does not guarantee.",
            ],
            practiceActivity:
              "Discuss weather data, sports chances, medical-style risk language, or practical forecasts and what conclusions are sensible.",
            evidenceExamples: [
              "a later-stage probability interpretation summary",
              "a learner explanation of what a probability statement really means",
              "parent notes from a risk or forecast discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can interpret a realistic probability statement without overclaiming certainty.",
            nextStep:
              "Continue strengthening links to data, modelling, and critical interpretation of uncertain information.",
            reportLanguage:
              "The learner is consolidating the ability to interpret probability in realistic contexts and explain what level of certainty or uncertainty is justified.",
          },
          {
            id: 2,
            title: "Refine critique, explanation, and fairness reasoning",
            meaning:
              "Communicate chance-based reasoning clearly and question whether games, claims, or conclusions are fair and well supported.",
            skillFocus:
              "critical judgement and communication in later probability",
            learningIntention:
              "Treat fairness, explanation, and critique as central habits in probability work.",
            successCriteria: [
              "The learner can critique a chance claim or game with clear reasoning.",
              "The learner can explain whether the evidence supports the conclusion.",
              "The learner can communicate uncertainty carefully rather than oversimplifying.",
            ],
            practiceActivity:
              "Critique game rules, compare probability claims, or explain why a chance-based argument is or is not convincing.",
            evidenceExamples: [
              "a critique of a probability claim or game",
              "a written or verbal explanation of fairness reasoning",
              "parent notes from a later-stage probability discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently questions fairness and evidence in new chance-based situations.",
            nextStep:
              "These habits support later statistics, finance, media literacy, modelling, and mature decision-making under uncertainty.",
            reportLanguage:
              "The learner is strengthening the ability to critique, explain, and communicate probability reasoning with increasing care and maturity.",
          },
        ],
      ),
    ],
    portfolioSupport: [
      "Keep one strong experimental chance task and one later fairness or risk-judgement example so the portfolio shows growth from informal chance language to reasoned probability.",
      "Trial records, learner explanations, and short critiques are often more revealing than final answers alone in this strand.",
      "Games, forecasts, simple surveys, and risk discussions often provide strong portfolio evidence because the uncertainty is visible and worth explaining.",
    ],
    reportingSupport: [
      "Reporting can highlight the learner's growing confidence in describing likelihood, recording outcomes, and judging fairness or uncertainty more carefully over time.",
      "Examples are often strongest when the learner explains why an event seems likely, fair, or risky rather than only stating the outcome.",
      "Collected evidence over time can show a shift from everyday chance language toward more precise use of fractions, percentages, data, and critical interpretation.",
    ],
  });
}

export function buildFinancialAndRealWorldMathematicsWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return buildWorkspace(currentFocusStageKey, {
    key: "financial-and-real-world-mathematics",
    trackingKey: "financial-and-real-world-mathematics",
    title: "Financial and real-world mathematics",
    subtitle:
      "Financial and real-world mathematics applies operations, percentages, ratio, data, and reasoning to budgeting, spending, planning, comparison, and value-based decisions that matter in everyday family life.",
    pathwayLabel: "Financial and real-world mathematics pathway",
    relationshipTitle: "What this strand builds on",
    relationshipCopy:
      "This strand applies number, operations, percentages, ratio, measurement, and data in practical contexts. It supports budgeting, comparison, planning, and later financial judgement.",
    stages: [
      stage(
        "foundation-kindergarten",
        "Early financial understanding begins with recognising exchange, noticing that things have value, and talking about simple choices in familiar routines and play.",
        [
          {
            id: 1,
            title: "Recognise money and simple exchange in play",
            meaning:
              "Notice that items can be bought, traded, or chosen, and that money represents value in practical life.",
            skillFocus:
              "early awareness of value and exchange",
            learningIntention:
              "Recognise that mathematics helps describe practical choices about getting, giving, and comparing things.",
            successCriteria: [
              "The learner can recognise familiar money or exchange situations.",
              "The learner can role-play simple buying or trading scenarios.",
              "The learner can explain that some items cost more or less than others.",
            ],
            practiceActivity:
              "Use shop play, token systems, or simple family choice activities and talk about paying, choosing, and comparing.",
            evidenceExamples: [
              "photos of shop play or exchange tasks",
              "a parent note about value language used",
              "a simple learner explanation of a buying choice",
            ],
            assessmentCheck:
              "Later, check whether the learner can talk about simple value and exchange ideas more independently.",
            nextStep:
              "Build on this by comparing prices and making small practical choices in lower-primary contexts.",
            reportLanguage:
              "The learner is beginning to recognise simple exchange and value ideas in practical play and everyday family life.",
          },
          {
            id: 2,
            title: "Compare simple wants, needs, and choices",
            meaning:
              "Talk about simple decisions where not everything can be chosen at once and some options seem better value than others.",
            skillFocus:
              "early comparison and decision-making in real-life contexts",
            learningIntention:
              "Notice that mathematical thinking can support practical choices, even before formal calculations are strong.",
            successCriteria: [
              "The learner can compare two simple choices.",
              "The learner can explain a basic reason for preferring one option.",
              "The learner can notice that some things are limited and choices matter.",
            ],
            practiceActivity:
              "Discuss snack choices, reward tokens, or pretend shopping where the learner chooses between options and explains why.",
            evidenceExamples: [
              "a parent note about decision language used",
              "a learner explanation of a simple choice",
              "a short record of a wants/needs comparison",
            ],
            assessmentCheck:
              "Later, check whether the learner can compare simple options with clearer reasoning about value or usefulness.",
            nextStep:
              "Carry this into using money amounts and making simple comparisons more deliberately.",
            reportLanguage:
              "The learner is growing in awareness that practical choices can be compared and explained with early mathematical reasoning about value and usefulness.",
          },
        ],
      ),
      stage(
        "lower-primary",
        "Learners begin using money amounts, simple totals, and comparisons in practical contexts such as shopping, saving, and deciding between options.",
        [
          {
            id: 1,
            title: "Use money amounts in simple practical tasks",
            meaning:
              "Recognise, combine, and compare familiar money amounts in context.",
            skillFocus:
              "early financial number use in practical situations",
            learningIntention:
              "Use number understanding to make everyday money situations more visible and meaningful.",
            successCriteria: [
              "The learner can recognise familiar amounts or combinations of money.",
              "The learner can compare simple costs or totals.",
              "The learner can explain a basic money-related choice.",
            ],
            practiceActivity:
              "Use shop play, price labels, or simple saving jars and ask the learner to compare costs or totals.",
            evidenceExamples: [
              "a simple price or total comparison",
              "a learner explanation of a buying or saving choice",
              "parent notes from a practical money task",
            ],
            assessmentCheck:
              "Later, check whether the learner can use simple money amounts with less scaffolding.",
            nextStep:
              "Build toward planning, change, and better-value comparisons in practical tasks.",
            reportLanguage:
              "The learner is becoming more confident in using simple money amounts and comparing costs in familiar practical situations.",
          },
          {
            id: 2,
            title: "Talk about saving, spending, and choosing",
            meaning:
              "Use early financial language to think about keeping, using, or delaying spending for a practical reason.",
            skillFocus:
              "financial decision language in everyday family life",
            learningIntention:
              "Recognise that money decisions often involve choice, planning, and trade-offs.",
            successCriteria: [
              "The learner can describe a simple saving or spending choice.",
              "The learner can explain one reason for waiting or choosing differently.",
              "The learner can connect the choice to value or usefulness.",
            ],
            practiceActivity:
              "Use pocket-money style examples, wish-list choices, or family planning conversations and ask the learner to explain the decision.",
            evidenceExamples: [
              "a learner reflection on a saving or spending choice",
              "a parent note from a financial discussion",
              "a simple comparison of two practical options",
            ],
            assessmentCheck:
              "Later, check whether the learner can explain simple trade-offs more clearly and independently.",
            nextStep:
              "Carry this into budgets, change, comparison shopping, and better-value decisions.",
            reportLanguage:
              "The learner is growing in confidence when discussing simple saving and spending choices and can increasingly explain the thinking behind them.",
          },
        ],
      ),
      stage(
        "middle-primary",
        "Financial mathematics becomes more practical here through budgets, change, value comparison, and planning decisions that connect clearly to operations.",
        [
          {
            id: 1,
            title: "Plan simple budgets and spending choices",
            meaning:
              "Use totals, subtraction, and comparison to make practical decisions within a limit.",
            skillFocus:
              "budgeting and planning within constraints",
            learningIntention:
              "Recognise that financial mathematics helps organise real choices when resources are limited.",
            successCriteria: [
              "The learner can plan within a simple spending limit.",
              "The learner can compare different options against the same budget.",
              "The learner can explain why the final choice was sensible.",
            ],
            practiceActivity:
              "Plan a snack budget, book fair amount, small outing, or resource purchase and compare several options before choosing.",
            evidenceExamples: [
              "a simple budget or spending plan",
              "annotated option comparisons",
              "a learner explanation of why a final choice was made",
            ],
            assessmentCheck:
              "Later, check whether the learner can plan and adjust a simple budget with growing independence.",
            nextStep:
              "Build this into change, better-buy comparisons, and more deliberate planning.",
            reportLanguage:
              "The learner is beginning to use budgeting ideas more purposefully and can increasingly compare options within a practical spending limit.",
          },
          {
            id: 2,
            title: "Compare value and change in practical situations",
            meaning:
              "Use subtraction and unit comparison to decide which option gives more value or what remains after spending.",
            skillFocus:
              "value comparison and remaining-amount reasoning",
            learningIntention:
              "Use financial mathematics to support real family decisions rather than only calculating isolated totals.",
            successCriteria: [
              "The learner can work out simple change or remaining amounts.",
              "The learner can compare two practical options for value.",
              "The learner can explain why one option seems better or more sensible.",
            ],
            practiceActivity:
              "Compare pack sizes, prices, or leftover money after purchases and discuss what makes an option better value.",
            evidenceExamples: [
              "a change or remaining-money example",
              "a value comparison with explanation",
              "parent notes from a practical shopping discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can explain better-value decisions with clearer numerical support.",
            nextStep:
              "Carry this into percentage discounts, data-informed choices, and longer planning tasks.",
            reportLanguage:
              "The learner is increasingly able to compare value and work out what remains after spending in practical family contexts.",
          },
        ],
      ),
      stage(
        "upper-primary",
        "This stage connects financial thinking more strongly to percentages, unit rates, planning, and practical judgement about cost, savings, and value.",
        [
          {
            id: 1,
            title: "Use percentages and comparisons in shopping decisions",
            meaning:
              "Apply discounts, percentage ideas, or per-unit comparisons to decide which option is better value.",
            skillFocus:
              "financial application of percentages and proportional comparison",
            learningIntention:
              "Use connected mathematical ideas to make more informed and realistic spending decisions.",
            successCriteria: [
              "The learner can interpret a simple discount or percentage in context.",
              "The learner can compare options using cost, quantity, or percentage reasoning.",
              "The learner can justify which option is better value.",
            ],
            practiceActivity:
              "Compare sale items, bulk buys, or quantity-price combinations and ask the learner to explain the best choice.",
            evidenceExamples: [
              "a discount or better-buy comparison",
              "a learner explanation of the financial choice",
              "parent notes from a value discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can combine price and proportion information confidently in a new task.",
            nextStep:
              "Build this into longer planning, saving, and trade-off decisions.",
            reportLanguage:
              "The learner is becoming more confident in using discounts, percentages, and comparisons to make sensible practical shopping decisions.",
          },
          {
            id: 2,
            title: "Plan savings or spending over time",
            meaning:
              "Use number, operations, and time thinking to plan toward a goal or manage a sequence of financial choices.",
            skillFocus:
              "financial planning over time",
            learningIntention:
              "Recognise that money decisions often unfold across several steps, not only in one-off purchases.",
            successCriteria: [
              "The learner can plan toward a simple savings or spending goal.",
              "The learner can explain how time, amount, or priorities affect the plan.",
              "The learner can adjust the plan when conditions change.",
            ],
            practiceActivity:
              "Plan savings for a book or outing, compare weekly budgets, or organise staged spending decisions.",
            evidenceExamples: [
              "a simple savings or spending plan",
              "a learner reflection about priorities or adjustments",
              "parent notes from a planning discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can revise a plan sensibly when one value changes.",
            nextStep:
              "Carry this into lower-secondary financial decision-making using data, percentages, and comparison more critically.",
            reportLanguage:
              "The learner is increasingly able to plan savings or spending over time and explain how financial choices connect to goals and priorities.",
          },
        ],
      ),
      stage(
        "lower-secondary",
        "Current focus brings operations, percentages, ratio, and data together in more realistic financial decisions about value, trade-offs, and planning.",
        [
          {
            id: 1,
            title: "Use several mathematical ideas in financial decisions",
            meaning:
              "Combine percentages, ratio, comparison, and data to judge cost, value, and practical trade-offs.",
            skillFocus:
              "integrated financial reasoning using multiple strands",
            learningIntention:
              "Use mathematics flexibly to compare options rather than relying on a single surface feature such as cheapest price.",
            successCriteria: [
              "The learner can compare options using more than one financial factor.",
              "The learner can explain how percentages, rates, or totals affected the decision.",
              "The learner can justify the final judgement clearly.",
            ],
            practiceActivity:
              "Compare subscription options, travel costs, phone plans, bulk purchases, or project budgets using several pieces of information.",
            evidenceExamples: [
              "a multi-factor financial comparison",
              "a learner explanation of the trade-offs considered",
              "parent notes from a later-stage financial discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can integrate multiple financial considerations in a fresh practical task.",
            nextStep:
              "Use this reasoning in longer-term planning, risk, and more formal financial interpretation.",
            reportLanguage:
              "The learner is developing stronger financial judgement and can increasingly combine several mathematical ideas when comparing practical options.",
          },
          {
            id: 2,
            title: "Interpret financial information critically",
            meaning:
              "Look beyond the headline figure and question what a deal, plan, or comparison really means in context.",
            skillFocus:
              "critical interpretation of financial claims and information",
            learningIntention:
              "Treat financial mathematics as a reasoning task that involves checking, questioning, and context-based judgement.",
            successCriteria: [
              "The learner can identify what information matters in a financial example.",
              "The learner can question a claim or apparent bargain thoughtfully.",
              "The learner can explain what further information would improve the decision.",
            ],
            practiceActivity:
              "Review sale claims, advertisements, comparison tables, or budget proposals and discuss what is clear, unclear, or potentially misleading.",
            evidenceExamples: [
              "a critique of a financial claim or comparison",
              "a learner explanation of missing information",
              "parent notes from a financial judgement discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently questions surface-level financial claims in new contexts.",
            nextStep:
              "This supports later real-world planning, citizenship, finance, and evidence-based decision-making.",
            reportLanguage:
              "The learner is increasingly able to interpret financial information critically and explain which evidence supports a practical decision.",
          },
        ],
      ),
      stage(
        "years-9-10-consolidation",
        "Later consolidation strengthens realistic budgeting, comparison, interpretation, and justification so financial mathematics supports mature real-world decision-making.",
        [
          {
            id: 1,
            title: "Use financial mathematics in realistic planning",
            meaning:
              "Apply financial reasoning to broader planning tasks that involve several constraints, options, and consequences.",
            skillFocus:
              "later-stage applied financial planning and modelling",
            learningIntention:
              "Use mathematics to support realistic planning rather than isolated transaction questions.",
            successCriteria: [
              "The learner can organise a realistic financial plan or comparison.",
              "The learner can explain the assumptions, priorities, and trade-offs involved.",
              "The learner can justify why the final plan is sensible in context.",
            ],
            practiceActivity:
              "Plan a project budget, travel option, savings goal, or household-style comparison where several variables affect the final choice.",
            evidenceExamples: [
              "a realistic budget or plan",
              "annotated comparison of options and trade-offs",
              "a learner explanation of why the chosen plan fit the priorities",
            ],
            assessmentCheck:
              "Later, check whether the learner can apply financial reasoning effectively in a new multi-step context.",
            nextStep:
              "Continue strengthening decision-making habits that connect mathematics to real family, community, and adult-life contexts.",
            reportLanguage:
              "The learner is consolidating the ability to use financial mathematics in realistic planning and can explain how priorities, trade-offs, and evidence shaped the decision.",
          },
          {
            id: 2,
            title: "Refine judgement, explanation, and evidence use in finance",
            meaning:
              "Communicate financial decisions clearly and judge whether a claim, budget, or option is genuinely reasonable.",
            skillFocus:
              "clear communication and critique in later financial reasoning",
            learningIntention:
              "Treat explanation, checking, and evidence use as normal parts of practical financial thinking.",
            successCriteria: [
              "The learner can explain a financial decision clearly and with relevant evidence.",
              "The learner can critique an unrealistic or weak financial claim.",
              "The learner can revise a plan when the numbers or priorities change.",
            ],
            practiceActivity:
              "Critique budgets, revise plans after a changed cost, or explain why one practical option is more sustainable or realistic than another.",
            evidenceExamples: [
              "a written or verbal financial justification",
              "a critique of an unrealistic plan or claim",
              "parent notes from a later-stage decision discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently uses evidence and revision habits in new financial contexts.",
            nextStep:
              "These habits support real-world decision-making, modelling, data interpretation, and confident applied mathematics beyond school-style tasks.",
            reportLanguage:
              "The learner is strengthening the ability to justify, critique, and revise financial decisions thoughtfully using clear mathematical evidence.",
          },
        ],
      ),
    ],
    portfolioSupport: [
      "Keep one practical budgeting or comparison example and one later critique or planning example so the portfolio shows growth from simple value awareness to informed decision-making.",
      "Short reflections about why a choice was sensible can be especially strong here because they reveal whether the mathematics actually supported the decision.",
      "Shopping, saving, event planning, and household comparisons often provide strong portfolio evidence because the context is easy to understand and genuinely useful.",
    ],
    reportingSupport: [
      "Reporting can highlight the learner's growing confidence in using mathematics for value comparison, budgeting, planning, and practical decision-making.",
      "Examples are strongest when the learner explains not only the calculation but why a choice was better, fairer, or more realistic in context.",
      "Collected evidence over time can show a shift from simple money awareness toward more mature judgement about trade-offs, percentages, and longer-term planning.",
    ],
  });
}

export function buildMathematicalReasoningModellingAndExplanationWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return buildWorkspace(currentFocusStageKey, {
    key: "mathematical-reasoning-modelling-and-explanation",
    trackingKey: "mathematical-reasoning-modelling-and-explanation",
    title: "Mathematical reasoning, modelling and explanation",
    subtitle:
      "This strand integrates the rest of mathematics. It helps learners explain thinking, choose strategies, model real situations, justify conclusions, and connect ideas across number, algebra, measurement, data, probability, and finance.",
    pathwayLabel: "Mathematical reasoning, modelling and explanation pathway",
    relationshipTitle: "How this strand connects across mathematics",
    relationshipCopy:
      "This strand does not reteach every other strand. It helps learners use what they already know more flexibly, communicate their reasoning clearly, and model meaningful situations with increasing confidence.",
    stages: [
      stage(
        "foundation-kindergarten",
        "Early mathematical reasoning begins with noticing, explaining simple choices, and using objects, drawings, or actions to show what is happening.",
        [
          {
            id: 1,
            title: "Explain simple mathematical choices",
            meaning:
              "Talk about why something was counted, grouped, matched, or chosen in a simple task.",
            skillFocus:
              "early reasoning through verbal explanation and visible action",
            learningIntention:
              "Recognise that mathematics is not only about answers but also about explaining thinking.",
            successCriteria: [
              "The learner can give a simple reason for a mathematical choice.",
              "The learner can show the idea with objects, drawings, or action.",
              "The learner can respond to a gentle follow-up question about the choice.",
            ],
            practiceActivity:
              "Ask why a group was sorted that way, why one answer seems bigger, or how a result was shown with counters or drawings.",
            evidenceExamples: [
              "a parent note about a simple mathematical explanation",
              "photos of a model with the learner's explanation",
              "a short verbal reasoning record",
            ],
            assessmentCheck:
              "Later, check whether the learner can explain a simple choice without needing the reason supplied first.",
            nextStep:
              "Build on this by comparing more than one possible way to show or solve something.",
            reportLanguage:
              "The learner is beginning to explain simple mathematical choices and can increasingly show thinking with objects, drawings, or spoken reasoning.",
          },
          {
            id: 2,
            title: "Use objects or drawings to model an idea",
            meaning:
              "Represent a simple mathematical situation so someone else can understand what is happening.",
            skillFocus:
              "early modelling of mathematical ideas",
            learningIntention:
              "Use a model to make mathematical thinking visible and discussable.",
            successCriteria: [
              "The learner can choose objects, drawings, or marks to represent an idea.",
              "The learner can explain what each part of the model shows.",
              "The learner can use the model to check or communicate the thinking.",
            ],
            practiceActivity:
              "Use counters, marks, sketches, or physical arrangements to show number stories, comparisons, or sharing situations.",
            evidenceExamples: [
              "a simple drawing or object model",
              "a learner explanation of what the model represents",
              "parent notes from a modelling conversation",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose a useful model independently in a simple new context.",
            nextStep:
              "Carry this into lower-primary reasoning where more than one strategy or model can be compared.",
            reportLanguage:
              "The learner is growing in confidence when using simple models to show mathematical thinking and explain what is happening.",
          },
        ],
      ),
      stage(
        "lower-primary",
        "Learners begin comparing strategies, explaining why one method works, and using simple models, pictures, or words to support their conclusions.",
        [
          {
            id: 1,
            title: "Compare two simple ways of solving or showing something",
            meaning:
              "Recognise that a mathematical idea can be represented or solved in more than one way.",
            skillFocus:
              "strategy comparison and explanation",
            learningIntention:
              "See that mathematical thinking can be flexible and that different approaches can still lead to the same conclusion.",
            successCriteria: [
              "The learner can compare two strategies or models.",
              "The learner can say something helpful about how they are similar or different.",
              "The learner can explain which one seemed easier and why.",
            ],
            practiceActivity:
              "Compare two counting methods, two drawings, or two ways of grouping and ask which helped most and why.",
            evidenceExamples: [
              "a learner explanation comparing two approaches",
              "a parent note about why one method felt clearer",
              "annotated work showing both approaches",
            ],
            assessmentCheck:
              "Later, check whether the learner can compare methods without only saying one is right or wrong.",
            nextStep:
              "Build on this by using clearer language and models to justify conclusions.",
            reportLanguage:
              "The learner is beginning to compare simple strategies and can increasingly explain why one method or model seemed more useful.",
          },
          {
            id: 2,
            title: "Use words and models to justify a simple answer",
            meaning:
              "Support a mathematical answer with a short explanation and a visible model or representation.",
            skillFocus:
              "early justification through combined verbal and visual reasoning",
            learningIntention:
              "Treat a mathematical answer as something that can be shown and explained, not only stated.",
            successCriteria: [
              "The learner can give a simple reason for an answer.",
              "The learner can support the answer with a model, drawing, or record.",
              "The learner can respond to a follow-up question with some clarity.",
            ],
            practiceActivity:
              "Ask the learner to show and explain why a total, comparison, or pattern answer makes sense using words and a simple representation.",
            evidenceExamples: [
              "a worked example with explanation",
              "a learner explanation linked to a drawing or model",
              "parent notes from a justification discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner gives and supports a justification more independently.",
            nextStep:
              "Carry this into middle-primary reasoning where strategies, patterns, and conclusions are explained more deliberately.",
            reportLanguage:
              "The learner is growing in confidence when justifying simple answers with words, drawings, and practical models.",
          },
        ],
      ),
      stage(
        "middle-primary",
        "Reasoning becomes more deliberate through strategy choice, pattern explanation, and modelling simple practical situations with enough detail to support a conclusion.",
        [
          {
            id: 1,
            title: "Choose and explain a sensible strategy",
            meaning:
              "Select a method that fits the problem and explain why it was a helpful choice.",
            skillFocus:
              "strategy choice and reflective explanation",
            learningIntention:
              "Use reasoning to choose a method, not only to check it after the fact.",
            successCriteria: [
              "The learner can choose a strategy that fits the task.",
              "The learner can explain why the strategy is sensible.",
              "The learner can say whether another strategy might also have worked.",
            ],
            practiceActivity:
              "Solve practical maths tasks and ask the learner to explain why a particular strategy, model, or representation was chosen.",
            evidenceExamples: [
              "a learner explanation of strategy choice",
              "annotated work showing the selected method",
              "parent notes from a reasoning discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose and justify a sensible strategy in a fresh context.",
            nextStep:
              "Build this into modelling tasks where the mathematics must represent a real situation clearly.",
            reportLanguage:
              "The learner is increasingly able to choose a sensible mathematical strategy and explain why it suits the task.",
          },
          {
            id: 2,
            title: "Model a simple practical situation mathematically",
            meaning:
              "Represent a real situation with numbers, diagrams, tables, or symbols so the problem becomes easier to understand.",
            skillFocus:
              "modelling practical situations with clear mathematical structure",
            learningIntention:
              "Use mathematics to simplify and clarify a real situation while still keeping the meaning visible.",
            successCriteria: [
              "The learner can identify the key quantities or relationships in a situation.",
              "The learner can represent them in a useful mathematical way.",
              "The learner can explain how the model connects to the original situation.",
            ],
            practiceActivity:
              "Model a shopping choice, recipe problem, measurement task, or game score situation using drawings, tables, or simple number work.",
            evidenceExamples: [
              "a practical modelling example",
              "a learner explanation linking the model to the real situation",
              "parent notes from a modelling discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose a useful model independently for a familiar practical task.",
            nextStep:
              "Carry this into upper-primary multi-step reasoning and stronger communication across strands.",
            reportLanguage:
              "The learner is beginning to model practical situations more clearly and can increasingly explain how the mathematics represents the real task.",
          },
        ],
      ),
      stage(
        "upper-primary",
        "This stage strengthens multi-step reasoning, clearer communication, and more deliberate modelling across number, measurement, geometry, and data-rich tasks.",
        [
          {
            id: 1,
            title: "Explain multi-step reasoning clearly",
            meaning:
              "Talk or write through a mathematical pathway so another person can follow the decisions made.",
            skillFocus:
              "clear communication of linked mathematical decisions",
            learningIntention:
              "Treat explanation as part of the mathematical work, especially when a problem has several steps.",
            successCriteria: [
              "The learner can describe the main steps taken in order.",
              "The learner can explain why each step was needed.",
              "The learner can connect the final answer back to the original question.",
            ],
            practiceActivity:
              "Use shopping, planning, measurement, or data tasks with several decisions and ask the learner to talk or write through the pathway used.",
            evidenceExamples: [
              "a multi-step worked example with commentary",
              "a learner explanation of the reasoning sequence",
              "parent notes from a structured reasoning conversation",
            ],
            assessmentCheck:
              "Later, check whether the learner can explain a multi-step pathway without losing the logic of the sequence.",
            nextStep:
              "Build toward more critical comparison of strategies and stronger modelling in lower-secondary contexts.",
            reportLanguage:
              "The learner is increasingly able to communicate multi-step mathematical reasoning clearly and connect the final conclusion back to the original task.",
          },
          {
            id: 2,
            title: "Refine models and check whether they fit",
            meaning:
              "Review whether a chosen table, diagram, equation, or representation actually captures the important parts of the situation.",
            skillFocus:
              "checking and improving models rather than accepting the first version automatically",
            learningIntention:
              "Treat models as tools that can be refined when they do not show the situation clearly enough.",
            successCriteria: [
              "The learner can explain what the model shows well.",
              "The learner can notice when something important is missing or unclear.",
              "The learner can improve the model or choose a better one when needed.",
            ],
            practiceActivity:
              "Compare two possible models for a practical situation and discuss which one fits the task more clearly and why.",
            evidenceExamples: [
              "a revised model with explanation",
              "a learner reflection on why one model was better",
              "parent notes from a model-comparison discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can critique and improve a model with growing independence.",
            nextStep:
              "Carry this into lower-secondary reasoning, justification, and cross-strand modelling.",
            reportLanguage:
              "The learner is becoming more thoughtful about whether a mathematical model fits the task and can increasingly refine it when needed.",
          },
        ],
      ),
      stage(
        "lower-secondary",
        "Current focus strengthens justification, model selection, representation choice, and flexible reasoning across multiple strands of mathematics.",
        [
          {
            id: 1,
            title: "Choose representations and strategies deliberately",
            meaning:
              "Select the form of mathematics that best suits the task and explain why it helps.",
            skillFocus:
              "deliberate representation and strategy choice across strands",
            learningIntention:
              "Use mathematical flexibility to make thinking clearer, more efficient, and better connected to the context.",
            successCriteria: [
              "The learner can choose a useful representation or strategy for a task.",
              "The learner can explain why the choice is helpful.",
              "The learner can compare it with an alternative approach when needed.",
            ],
            practiceActivity:
              "Use mixed-strand tasks involving number, data, measurement, or algebra and ask the learner to justify the representation chosen.",
            evidenceExamples: [
              "a task showing deliberate representation choice",
              "a learner comparison of two possible approaches",
              "parent notes from a reasoning and strategy discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can make and justify a good representation choice in a new context.",
            nextStep:
              "Use this flexibility in modelling, critique, and later cross-disciplinary applications.",
            reportLanguage:
              "The learner is developing stronger judgement about which mathematical representations and strategies best suit a task and can increasingly explain the choices made.",
          },
          {
            id: 2,
            title: "Justify conclusions across connected strands",
            meaning:
              "Bring together ideas from more than one strand and explain how they support a conclusion or decision.",
            skillFocus:
              "integrated reasoning and justification across mathematics",
            learningIntention:
              "Treat mathematics as a connected system where several ideas may support one conclusion.",
            successCriteria: [
              "The learner can identify which mathematical ideas are being used together.",
              "The learner can explain how those ideas support the conclusion.",
              "The learner can check whether the final decision or answer fits the wider context.",
            ],
            practiceActivity:
              "Use practical tasks that mix measurement, ratio, data, or finance and ask the learner to explain how the strands worked together.",
            evidenceExamples: [
              "an integrated multi-strand task",
              "a learner explanation linking several ideas",
              "parent notes from a cross-strand reasoning conversation",
            ],
            assessmentCheck:
              "Later, check whether the learner can justify a conclusion that depends on more than one mathematical strand.",
            nextStep:
              "This supports later modelling, formal communication, and flexible real-world mathematics.",
            reportLanguage:
              "The learner is increasingly able to justify conclusions by drawing together ideas from more than one strand of mathematics.",
          },
        ],
      ),
      stage(
        "years-9-10-consolidation",
        "Later consolidation strengthens modelling, critique, explanation, and mathematical communication so learners can use mathematics flexibly, thoughtfully, and convincingly.",
        [
          {
            id: 1,
            title: "Model realistic situations with clear assumptions and limits",
            meaning:
              "Build and use mathematical models while recognising that every model simplifies reality in some way.",
            skillFocus:
              "later-stage modelling with awareness of assumptions and limitations",
            learningIntention:
              "Use mathematics to make realistic situations more understandable while still checking what the model leaves out.",
            successCriteria: [
              "The learner can identify the key features of a situation to model.",
              "The learner can explain the assumptions built into the model.",
              "The learner can judge whether the model is useful and where its limits are.",
            ],
            practiceActivity:
              "Model spending, travel, space, growth, or data situations and discuss what was simplified and why.",
            evidenceExamples: [
              "a later-stage modelling task with assumptions noted",
              "a learner explanation of what the model shows and misses",
              "parent notes from a modelling and critique discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can build and critique a useful model in a fresh context.",
            nextStep:
              "Continue strengthening flexible problem solving, cross-disciplinary application, and mature mathematical communication.",
            reportLanguage:
              "The learner is consolidating the ability to model realistic situations mathematically and explain both the usefulness and the limits of the model chosen.",
          },
          {
            id: 2,
            title: "Refine explanation, critique, and mathematical communication",
            meaning:
              "Communicate reasoning clearly, question weak conclusions, and improve the clarity or strength of a mathematical argument.",
            skillFocus:
              "mature mathematical communication and critique",
            learningIntention:
              "Treat explanation, critique, and revision as normal and valuable parts of mathematical work.",
            successCriteria: [
              "The learner can communicate a mathematical argument clearly.",
              "The learner can identify gaps or weak points in a conclusion.",
              "The learner can refine the explanation or representation to make the reasoning stronger.",
            ],
            practiceActivity:
              "Review worked solutions, compare two arguments, or explain and then refine a modelling decision or mathematical claim.",
            evidenceExamples: [
              "a refined explanation or critique",
              "a learner comparison of stronger and weaker reasoning",
              "parent notes from a later-stage explanation discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently revises and strengthens mathematical communication in unfamiliar tasks.",
            nextStep:
              "These habits support confident learning across all later strands and real-world mathematical decision-making.",
            reportLanguage:
              "The learner is strengthening the ability to communicate, critique, and refine mathematical reasoning with increasing maturity and flexibility.",
          },
        ],
      ),
    ],
    portfolioSupport: [
      "Keep one early explanation example and one later modelling or critique example so the portfolio shows growth from showing thinking to refining mathematical communication.",
      "This strand is often strongest when learners speak or write about their choices, because the evidence shows how mathematics is being connected and justified.",
      "Integrated tasks that draw on several strands often provide the best portfolio evidence here because the reasoning is visible across the whole pathway.",
    ],
    reportingSupport: [
      "Reporting can highlight the learner's growing confidence in explaining thinking, choosing strategies, refining models, and justifying conclusions across several strands of mathematics.",
      "Examples are especially strong when the learner communicates why a representation or strategy was chosen and how the final conclusion was checked.",
      "Collected evidence over time can show a shift from simple explanation and modelling toward more mature critique, communication, and flexible cross-strand reasoning.",
    ],
  });
}
