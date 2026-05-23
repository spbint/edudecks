import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { PathwayStageKey } from "@/lib/clean/pathways/mathematicsNumberPrototype";

export function buildOperationsAndCalculationWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return {
    key: "operations-and-calculation",
    trackingKey: "operations-and-calculation",
    title: "Operations and calculation",
    subtitle:
      "Operations and calculation grows out of number sense. It helps learners move from acting out stories and counting everything to choosing efficient strategies, checking whether answers make sense, and solving practical mathematical problems with growing confidence.",
    pathwayLabel: "Operations and calculation pathway",
    relationshipTitle: "How this strand develops",
    relationshipCopy:
      "This pathway shows how early joining, separating, sharing, and grouping develop into flexible calculation across whole numbers, decimals, fractions, percentages, and later real-world problem solving.",
    currentFocusStageKey,
    stages: [
      {
        key: "foundation-kindergarten",
        title: "Foundation / Kindergarten",
        helper:
          "Early operations begin with real objects, stories, movement, and everyday situations where quantities are joined, taken away, compared, and shared fairly.",
        steps: [
          {
            id: 1,
            title: "Act out joining and taking away in everyday stories",
            meaning:
              "Use objects, drawings, and movement to show what happens when quantities are combined or separated.",
            skillFocus:
              "recognising addition and subtraction as actions that can be seen, modelled, and explained",
            learningIntention:
              "Understand what is changing in a practical situation before worrying about formal written methods.",
            successCriteria: [
              "The learner can show a joining or taking-away story with objects or drawings.",
              "The learner can describe the starting amount, the change, and the result.",
              "The learner can explain whether the situation is about adding, taking away, or comparing.",
            ],
            practiceActivity:
              "Use counters, snacks, toys, or family story problems and ask the learner to show what changes each time.",
            evidenceExamples: [
              "a parent note about how clearly the learner explained the story",
              "a photo of counters, drawings, or simple maths play",
              "a short verbal explanation captured during a practical task",
            ],
            assessmentCheck:
              "Later, check whether the learner can identify the operation in a simple story without relying only on trial and error.",
            nextStep:
              "Move from acting out changes to noticing simple number patterns and more/less comparisons.",
            reportLanguage:
              "The learner is beginning to model addition and subtraction situations clearly and can explain what is changing in familiar practical tasks.",
          },
          {
            id: 2,
            title: "Share, compare, and notice simple differences",
            meaning:
              "Compare two quantities, talk about fairness, and describe whether one amount is more, less, or the same.",
            skillFocus:
              "using comparison and sharing language as a foundation for later subtraction and division thinking",
            learningIntention:
              "Recognise that operations help describe real situations involving difference, fairness, and simple sharing.",
            successCriteria: [
              "The learner can say which quantity is greater, smaller, or the same.",
              "The learner can talk about fair and unfair sharing in practical situations.",
              "The learner can describe how much more or less in simple examples.",
            ],
            practiceActivity:
              "Compare snack amounts, game counters, or collections and talk about how to make them fair or how much more or less there is.",
            evidenceExamples: [
              "notes from a comparison or sharing discussion",
              "photos of practical sharing with a learner explanation",
              "a simple record of how the learner described the difference between two amounts",
            ],
            assessmentCheck:
              "Later, check whether the learner can compare small quantities and explain a fair share without heavy prompting.",
            nextStep:
              "Build on this by using counting-on, counting-back, and known facts more deliberately.",
            reportLanguage:
              "The learner is growing in confidence when comparing quantities and describing simple sharing and difference in everyday contexts.",
          },
        ],
      },
      {
        key: "lower-primary",
        title: "Lower Primary",
        helper:
          "Learners begin moving beyond counting everything. They start using number facts, counting-on and counting-back, and clearer part-whole strategies for addition and subtraction.",
        steps: [
          {
            id: 1,
            title: "Use counting strategies and known facts more efficiently",
            meaning:
              "Solve addition and subtraction problems by choosing helpful number facts and counting strategies instead of rebuilding every total from the start.",
            skillFocus:
              "counting-on, counting-back, doubles, near doubles, and early fact recall",
            learningIntention:
              "Notice useful number relationships that make addition and subtraction quicker and more dependable.",
            successCriteria: [
              "The learner can explain which known fact or counting strategy helped.",
              "The learner can solve simple calculations without counting every object one by one.",
              "The learner can describe why a chosen strategy made sense for the problem.",
            ],
            practiceActivity:
              "Use dice games, score tallies, and shopping-style questions that encourage counting-on, facts, and quick mental strategies.",
            evidenceExamples: [
              "mental maths observations recorded by a parent",
              "jottings that show a counting-on or known-fact strategy",
              "a short learner explanation of why one strategy was quicker than another",
            ],
            assessmentCheck:
              "Later, check whether the learner can choose a sensible addition or subtraction strategy without being told which one to use.",
            nextStep:
              "Extend this thinking into part-whole reasoning and clearer recording of how numbers are broken apart and recombined.",
            reportLanguage:
              "The learner is beginning to rely more on counting strategies and known facts, rather than recounting each amount from the beginning.",
          },
          {
            id: 2,
            title: "Use part-whole thinking for addition and subtraction",
            meaning:
              "Break numbers into parts, recombine them, and use that structure to solve calculations more flexibly.",
            skillFocus:
              "partitioning, recombining, and explaining number relationships clearly",
            learningIntention:
              "Use number structure to make addition and subtraction easier to understand and record.",
            successCriteria: [
              "The learner can split numbers into helpful parts.",
              "The learner can explain how the parts help solve the problem.",
              "The learner can keep track of the whole amount while working with the parts.",
            ],
            practiceActivity:
              "Use number lines, place-value jottings, or quick story totals where numbers can be partitioned in more than one way.",
            evidenceExamples: [
              "annotated part-whole working",
              "photos of number-line or partitioning jottings",
              "a parent note about how confidently the learner explained the parts used",
            ],
            assessmentCheck:
              "Later, check whether the learner can partition numbers flexibly and choose a helpful combination independently.",
            nextStep:
              "Carry this flexible thinking into equal groups, repeated addition, and early multiplicative ideas.",
            reportLanguage:
              "Worked examples show increasing confidence with part-whole thinking and a growing ability to explain how numbers can be split and recombined.",
          },
        ],
      },
      {
        key: "middle-primary",
        title: "Middle Primary",
        helper:
          "Operations expand into equal groups, repeated addition, sharing, arrays, and early multiplication and division relationships.",
        steps: [
          {
            id: 1,
            title: "Model equal groups and repeated addition",
            meaning:
              "Recognise situations where the same amount appears again and again, and represent that more efficiently than repeated counting.",
            skillFocus:
              "grouping, arrays, skip counting, and repeated addition as early multiplicative thinking",
            learningIntention:
              "See equal groups as a pattern that can be organised, described, and solved more efficiently.",
            successCriteria: [
              "The learner can organise objects into equal groups or arrays.",
              "The learner can describe the total as repeated addition or skip counting.",
              "The learner can connect the model to an early multiplication idea.",
            ],
            practiceActivity:
              "Group Lego pieces, egg cartons, baking trays, or game points into equal sets and discuss the total in different ways.",
            evidenceExamples: [
              "photos of equal groups or arrays",
              "a short explanation comparing skip counting and repeated addition",
              "notes from a practical grouping task",
            ],
            assessmentCheck:
              "Later, check whether the learner can move between equal groups, repeated addition, and a multiplication sentence.",
            nextStep:
              "Use those same models to connect multiplication and division through grouping and sharing.",
            reportLanguage:
              "The learner is beginning to recognise equal-group situations and can represent them with repeated addition and early multiplication language.",
          },
          {
            id: 2,
            title: "Connect multiplication and division through grouping and sharing",
            meaning:
              "Use practical grouping and fair-sharing situations to understand how multiplication and division relate to one another.",
            skillFocus:
              "linking multiplication and division through inverse thinking and practical models",
            learningIntention:
              "Explain whether a problem is about groups, group size, sharing, or total, and use that to choose an operation.",
            successCriteria: [
              "The learner can describe a grouping or sharing situation clearly.",
              "The learner can connect a multiplication fact to a related division fact.",
              "The learner can explain what the unknown quantity represents in context.",
            ],
            practiceActivity:
              "Share snacks, organise counters, or solve practical grouping tasks where the learner talks through how the operations connect.",
            evidenceExamples: [
              "a practical sharing or grouping example with explanation",
              "paired multiplication and division facts linked to one model",
              "a parent note about inverse-thinking language used by the learner",
            ],
            assessmentCheck:
              "Later, check whether the learner can use one operation to verify the other and explain the relationship in context.",
            nextStep:
              "Build this into more complex written methods, multi-step problems, and deliberate estimation.",
            reportLanguage:
              "The learner is increasingly able to connect multiplication and division through practical grouping and sharing situations.",
          },
        ],
      },
      {
        key: "upper-primary",
        title: "Upper Primary",
        helper:
          "Learners bring written methods, mental strategies, estimation, and multi-step reasoning together so calculation becomes more dependable and purposeful.",
        steps: [
          {
            id: 1,
            title: "Use written methods and mental strategies flexibly",
            meaning:
              "Choose between mental, informal, and written methods depending on the numbers and the context.",
            skillFocus:
              "written methods, regrouping, place-value control, and efficient strategy choice",
            learningIntention:
              "Solve calculations clearly and accurately while understanding why a method works.",
            successCriteria: [
              "The learner can choose a suitable mental or written strategy for the problem.",
              "The learner can record working clearly enough to explain each step.",
              "The learner can use place value accurately when regrouping or partitioning.",
            ],
            practiceActivity:
              "Use budget totals, project materials, measurement conversions, or game scores that invite different methods and comparison of efficiency.",
            evidenceExamples: [
              "annotated written working",
              "a learner explanation comparing two possible methods",
              "a parent note about when the learner chose a more efficient strategy independently",
            ],
            assessmentCheck:
              "Later, check whether the learner can select a suitable method for a new problem and justify why it was sensible.",
            nextStep:
              "Pair method choice with estimation and reasonableness so the learner judges answers rather than accepting them automatically.",
            reportLanguage:
              "The learner is showing growing confidence with written and mental calculation methods and is becoming more deliberate in choosing between them.",
          },
          {
            id: 2,
            title: "Estimate and solve multi-step practical problems",
            meaning:
              "Use more than one operation, estimate first, and check whether an answer makes sense in a practical context.",
            skillFocus:
              "multi-step calculation, estimation, and checking reasonableness",
            learningIntention:
              "Use operations as connected tools for solving richer problems, not as isolated exercises.",
            successCriteria: [
              "The learner can identify which operations are needed in a practical problem.",
              "The learner can use an estimate to judge whether the answer seems reasonable.",
              "The learner can explain the working clearly and relate it back to the situation.",
            ],
            practiceActivity:
              "Plan meals, compare shopping totals, estimate travel time, or solve project-based maths tasks that require more than one calculation decision.",
            evidenceExamples: [
              "a multi-step practical problem with explanation",
              "a comparison of estimate and exact answer",
              "a learner reflection on why a chosen strategy was useful",
            ],
            assessmentCheck:
              "Later, check whether the learner independently uses estimation as part of checking during longer calculations.",
            nextStep:
              "Carry this flexibility into operations involving integers, decimals, fractions, and percentages in later mathematics.",
            reportLanguage:
              "The learner is increasingly able to solve multi-step practical problems and use estimation to judge whether a calculated answer is reasonable.",
          },
        ],
      },
      {
        key: "lower-secondary",
        title: "Lower Secondary",
        helper:
          "The current focus broadens operations across integers, decimals, fractions, and percentages, with greater emphasis on efficient strategy choice and clear mathematical reasoning.",
        steps: [
          {
            id: 1,
            title: "Choose efficient strategies across different number forms",
            meaning:
              "Work flexibly with whole numbers, integers, decimals, fractions, and percentages by selecting methods that fit the structure of the problem.",
            skillFocus:
              "efficient strategy choice across a wider range of number types",
            learningIntention:
              "Recognise that different forms of number still connect through the same operational thinking, while sometimes needing different methods.",
            successCriteria: [
              "The learner can choose a method that suits the numbers involved.",
              "The learner can explain how the chosen strategy supports accuracy and efficiency.",
              "The learner can shift between mental and written calculation when appropriate.",
            ],
            practiceActivity:
              "Use percentage discounts, fraction totals, decimal measures, temperature changes, or financial examples that require deliberate strategy choice.",
            evidenceExamples: [
              "annotated working across more than one number form",
              "a comparison of two possible strategies",
              "parent notes from a discussion about why one method was more efficient",
            ],
            assessmentCheck:
              "Later, check whether the learner can adapt strategy confidently when a problem mixes different number forms.",
            nextStep:
              "Use this flexibility in proportion, finance, algebraic substitution, and applied measurement reasoning.",
            reportLanguage:
              "The learner is developing more flexible calculation strategies across integers, decimals, fractions, and percentages and can increasingly justify the choices made.",
          },
          {
            id: 2,
            title: "Apply calculation to richer practical reasoning",
            meaning:
              "Bring operations together in budgeting, measurement, rate, and proportional contexts where reasoning matters as much as the final answer.",
            skillFocus:
              "explaining and checking calculation in realistic multi-step contexts",
            learningIntention:
              "Use operations confidently as part of broader mathematical decision-making and interpretation.",
            successCriteria: [
              "The learner can plan a multi-step solution pathway.",
              "The learner can explain how each operation supports the overall problem.",
              "The learner can check whether the final result fits the context and units.",
            ],
            practiceActivity:
              "Use budgeting, recipes, travel planning, simple finance, or project design tasks that require reasoning as well as calculation.",
            evidenceExamples: [
              "a practical project summary using several operations",
              "a learner explanation of how the steps in a calculation sequence fit together",
              "a parent note about how the learner checked the reasonableness of a result",
            ],
            assessmentCheck:
              "Later, check whether the learner can solve a fresh practical problem and justify the sequence of operations chosen.",
            nextStep:
              "This supports later algebraic manipulation, more formal finance, modelling, and consolidation of efficient reasoning habits.",
            reportLanguage:
              "The learner is increasingly able to apply calculation to richer practical reasoning tasks and explain how the sequence of operations fits the problem context.",
          },
        ],
      },
      {
        key: "years-9-10-consolidation",
        title: "Years 9-10 / consolidation",
        helper:
          "Later consolidation uses operations confidently across algebraic, financial, measurement, and modelling contexts, with increasing emphasis on judgement, efficiency, and communication.",
        steps: [
          {
            id: 1,
            title: "Use operations confidently in algebraic and financial contexts",
            meaning:
              "Apply calculation strategies in situations that involve formulas, substitutions, rates, financial decisions, and structured problem solving.",
            skillFocus:
              "transferring operational understanding into algebraic, financial, and modelling situations",
            learningIntention:
              "See operations as tools that continue to matter when mathematics becomes more abstract or more realistic.",
            successCriteria: [
              "The learner can use calculation accurately within algebraic or financial examples.",
              "The learner can interpret results in the context of the problem rather than stopping at the procedure.",
              "The learner can explain how number sense supports more formal mathematical work.",
            ],
            practiceActivity:
              "Explore percentage change, unit pricing, spreadsheet-style calculations, simple formula substitution, or measurement modelling tasks.",
            evidenceExamples: [
              "a financial or algebra-connected worked example",
              "a learner reflection about how earlier calculation skills supported a more advanced task",
              "a parent summary of reasoning used in a modelling-style activity",
            ],
            assessmentCheck:
              "Later, check whether the learner can apply efficient calculation reliably when the mathematics is embedded in a less familiar context.",
            nextStep:
              "Continue strengthening algebraic reasoning, proportional thinking, and mathematical modelling with secure calculation underneath.",
            reportLanguage:
              "The learner is consolidating operational understanding in more advanced financial, algebraic, and measurement-based contexts and can explain reasoning with growing maturity.",
          },
          {
            id: 2,
            title: "Refine judgement, checking, and mathematical communication",
            meaning:
              "Use estimation, reasonableness, and explanation as normal parts of calculation in later mathematics.",
            skillFocus:
              "judging whether answers make sense and communicating calculation reasoning clearly",
            learningIntention:
              "Treat checking, reviewing, and explaining as essential habits in mathematical work.",
            successCriteria: [
              "The learner can estimate or predict a sensible result before or after calculating.",
              "The learner can identify when an answer does not fit the context and revise it.",
              "The learner can communicate the reasoning behind a calculation pathway clearly.",
            ],
            practiceActivity:
              "Review financial comparisons, measurement tasks, or modelling problems and ask the learner to justify the answer as well as solve it.",
            evidenceExamples: [
              "a before-and-after estimate record",
              "annotated corrections showing why an answer was revised",
              "a verbal or written explanation of a complete problem-solving pathway",
            ],
            assessmentCheck:
              "Later, check whether the learner independently uses checking and justification habits during unfamiliar multi-step problems.",
            nextStep:
              "These habits continue to support later algebra, statistics, finance, measurement, and formal problem solving.",
            reportLanguage:
              "The learner is strengthening the habit of checking, refining, and communicating calculation decisions, which supports more confident work across later mathematics.",
          },
        ],
      },
    ],
    portfolioSupport: [
      "Keep one worked example from an earlier stage and one from the current stage so progress from modelling to flexible strategy choice is visible.",
      "Save practical task summaries from shopping, cooking, budgeting, games, or projects when the learner's reasoning is clearly explained.",
      "Short reflections about why a strategy was chosen can strengthen portfolio evidence and later reporting.",
    ],
    reportingSupport: [
      "Reporting can highlight increasing independence in choosing strategies, checking reasonableness, and explaining why an operation fits the task.",
      "Practical family tasks often provide the strongest reporting examples because the mathematics is visible in context rather than isolated on a worksheet.",
      "Collected evidence over time can show a shift from acting out and counting to flexible calculation across a wider range of number forms.",
    ],
  };
}
