import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";

export const OPERATIONS_AND_CALCULATION_WORKSPACE: MathematicsDetailedStrandWorkspace = {
  key: "operations-and-calculation",
  title: "Operations and calculation",
  subtitle:
    "Operations and calculation grows naturally out of number and place value. It helps learners move from acting out problems and counting everything to choosing dependable strategies, checking whether answers make sense, and solving richer mathematical situations with more confidence.",
  pathwayLabel: "Operations and calculation pathway",
  relationshipTitle: "Why this strand follows Number",
  relationshipCopy:
    "Number and place value gives learners the structure of the number system. Operations and calculation turns that structure into useful, dependable action in real life and later mathematics.",
  currentFocusStageKey: "combining-and-separating-quantities",
  stages: [
    {
      key: "combining-and-separating-quantities",
      title: "Combining and separating quantities",
      helper:
        "This stage begins with stories, objects, and practical situations where quantities are joined, taken away, compared, and described.",
      steps: [
        {
          id: 1,
          title: "Act out joining and taking away in real situations",
          meaning:
            "Use objects, drawings, or movement to show what happens when quantities are combined or separated.",
          skillFocus: "seeing addition and subtraction as actions that can be modelled and explained",
          learningIntention:
            "Understand what is changing in a practical problem before worrying about a formal written method.",
          successCriteria: [
            "The learner can show a join or take-away story with objects or drawings.",
            "The learner can explain what the starting amount, change, and result represent.",
            "The learner can decide whether the situation is about adding or subtracting.",
          ],
          practiceActivity:
            "Use counters, toys, snack items, or quick family story problems and ask the learner to act out what changes each time.",
          evidenceExamples: [
            "a parent note about how clearly the learner explained the story",
            "a photo of counters, drawings, or annotated jottings",
            "a short verbal explanation recorded during a practical task",
          ],
          assessmentCheck:
            "Later, check whether the learner can identify the operation and explain what changed without relying only on trial and error.",
          nextStep:
            "Move toward comparing two quantities and noticing how much more or less one amount is than another.",
          reportLanguage:
            "The learner is beginning to model addition and subtraction situations clearly and explain what is happening in familiar practical tasks.",
        },
        {
          id: 2,
          title: "Compare quantities and describe the difference",
          meaning:
            "Notice whether one amount is more, less, or the same as another and describe the gap between them.",
          skillFocus: "comparing quantities and reasoning about difference rather than only totals",
          learningIntention:
            "Use comparison language confidently and begin connecting difference to subtraction thinking.",
          successCriteria: [
            "The learner can identify which quantity is greater or smaller.",
            "The learner can describe how many more or fewer are involved.",
            "The learner can choose a sensible way to check the comparison.",
          ],
          practiceActivity:
            "Compare snacks, card totals, score tallies, or household objects and ask how much more or less one amount is.",
          evidenceExamples: [
            "notes from a comparison discussion",
            "a worked example showing how the difference was found",
            "a simple score or tally comparison from a game",
          ],
          assessmentCheck:
            "Later, check whether the learner can compare quantities mentally or with quick jottings and justify the answer.",
          nextStep:
            "Build on these comparisons by using known number facts and part-whole thinking more flexibly.",
          reportLanguage:
            "The learner is growing in confidence when comparing quantities and can increasingly explain how much more or less one amount is than another.",
        },
      ],
    },
    {
      key: "addition-and-subtraction-strategies",
      title: "Addition and subtraction strategies",
      helper:
        "Here the learner begins to move beyond counting everything and starts choosing number facts, partitioning, and regrouping strategies more deliberately.",
      steps: [
        {
          id: 1,
          title: "Use known facts and part-whole thinking",
          meaning:
            "Recognise helpful number relationships and use them instead of rebuilding every calculation from the beginning.",
          skillFocus: "using known facts, doubles, near doubles, and part-whole relationships",
          learningIntention:
            "Choose quicker ways to solve addition and subtraction by noticing useful number structure.",
          successCriteria: [
            "The learner can explain which known fact helped.",
            "The learner can break a number into parts to make the calculation easier.",
            "The learner can describe why the strategy was sensible for that problem.",
          ],
          practiceActivity:
            "Use mental maths warm-ups, quick dice totals, or shopping-style problems that encourage facts and part-whole thinking.",
          evidenceExamples: [
            "mental maths observations recorded by a parent",
            "jottings that show partitioning or known-fact use",
            "a short explanation of why a strategy worked",
          ],
          assessmentCheck:
            "Later, check whether the learner can choose a known-fact strategy without being prompted toward a specific method.",
          nextStep:
            "Extend this into regrouping and clearer written recording when numbers become less manageable mentally.",
          reportLanguage:
            "The learner is beginning to rely more on known facts and part-whole reasoning, rather than counting each item individually.",
        },
        {
          id: 2,
          title: "Partition, regroup, and record calculations clearly",
          meaning:
            "Use place-value thinking to break numbers apart, regroup when needed, and keep the calculation process visible.",
          skillFocus: "partitioning numbers and using regrouping in addition and subtraction",
          learningIntention:
            "Keep written or visual working clear enough that the learner can follow and explain each step.",
          successCriteria: [
            "The learner can partition numbers into helpful parts.",
            "The learner can regroup when a calculation needs it.",
            "The learner can explain the working without losing track of place value.",
          ],
          practiceActivity:
            "Use open number lines, place-value jottings, or vertical methods alongside practical totals from family life.",
          evidenceExamples: [
            "annotated written working",
            "photos of open number lines or regrouping jottings",
            "a parent note about how confidently the learner explained the method",
          ],
          assessmentCheck:
            "Later, check whether the learner can regroup accurately and explain how place value supports the method.",
          nextStep:
            "Carry this flexible thinking into equal groups, repeated addition, and early multiplication ideas.",
          reportLanguage:
            "Worked examples show improving confidence with partitioning and regrouping, especially when the learner can explain the role of place value.",
        },
      ],
    },
    {
      key: "equal-groups-and-relationships",
      title: "Equal groups and operation relationships",
      helper:
        "This stage helps learners move from repeated counting to multiplicative thinking through equal groups, arrays, sharing, and inverse relationships.",
      steps: [
        {
          id: 1,
          title: "Model equal groups and repeated addition",
          meaning:
            "Notice situations where the same amount appears again and again, and represent that efficiently.",
          skillFocus: "grouping, repeated addition, and early multiplicative structure",
          learningIntention:
            "See equal groups as more than repeated counting and begin using arrays or organised groups to reason about totals.",
          successCriteria: [
            "The learner can organise objects into equal groups.",
            "The learner can describe the total as repeated addition.",
            "The learner can connect the model to an early multiplication idea.",
          ],
          practiceActivity:
            "Group counters, bake trays, egg cartons, Lego arrays, or game points into equal sets and discuss the total in different ways.",
          evidenceExamples: [
            "photos of arrays or grouped objects",
            "a short explanation comparing skip counting and repeated addition",
            "notes from a practical grouping task",
          ],
          assessmentCheck:
            "Later, check whether the learner can move between equal groups, repeated addition, and a multiplication sentence.",
          nextStep:
            "Use these models to understand how multiplication and division relate when grouping and sharing.",
          reportLanguage:
            "The learner is beginning to recognise equal-group situations and can represent them with repeated addition and early multiplication language.",
        },
        {
          id: 2,
          title: "Connect multiplication and division in grouping and sharing",
          meaning:
            "See multiplication and division as related ideas when quantities are organised into equal groups or shared fairly.",
          skillFocus: "linking multiplication and division through inverse thinking",
          learningIntention:
            "Use grouping and sharing contexts to explain how one operation helps check the other.",
          successCriteria: [
            "The learner can describe a grouping or sharing situation clearly.",
            "The learner can connect a multiplication fact to a related division fact.",
            "The learner can explain whether the problem is about finding groups, group size, or total.",
          ],
          practiceActivity:
            "Share snacks, organise game pieces, or solve practical grouping tasks where the learner can talk through the relationship between the operations.",
          evidenceExamples: [
            "a practical sharing or grouping example with explanation",
            "paired multiplication and division facts linked to one model",
            "a parent note about inverse-thinking language used by the learner",
          ],
          assessmentCheck:
            "Later, check whether the learner can use one operation to verify the other and explain the relationship in context.",
          nextStep:
            "Carry this multiplicative understanding into estimation, efficient strategy choice, and richer problems.",
          reportLanguage:
            "The learner is increasingly able to connect multiplication and division through practical grouping and sharing situations.",
        },
      ],
    },
    {
      key: "flexible-calculation-and-application",
      title: "Flexible calculation and application",
      helper:
        "This stage brings the earlier ideas together so learners can estimate, choose efficient strategies, and apply operations in richer real-life situations.",
      steps: [
        {
          id: 1,
          title: "Estimate first and check reasonableness",
          meaning:
            "Use a quick estimate before or after calculating so answers can be judged instead of accepted blindly.",
          skillFocus: "estimation and checking whether an answer makes sense",
          learningIntention:
            "Treat estimation as part of good mathematical reasoning rather than as a separate activity.",
          successCriteria: [
            "The learner can give a sensible rough estimate before or after solving.",
            "The learner can notice when an answer does not fit the context.",
            "The learner can explain how the estimate helped with checking.",
          ],
          practiceActivity:
            "Estimate shopping totals, travel time, recipe amounts, or game scores before calculating the exact answer.",
          evidenceExamples: [
            "a comparison of estimate and exact answer",
            "parent notes about reasonableness checks in everyday life",
            "a worked example showing how the learner corrected an answer",
          ],
          assessmentCheck:
            "Later, check whether the learner independently uses estimation as a checking habit during calculation.",
          nextStep:
            "Use that confidence to choose efficient methods and solve longer real-world problems with more than one step.",
          reportLanguage:
            "The learner is beginning to use estimation more purposefully to judge whether a calculated answer is reasonable in context.",
        },
        {
          id: 2,
          title: "Apply operations in richer real-world problems",
          meaning:
            "Bring addition, subtraction, multiplication, and division together in practical situations that require choice, planning, and explanation.",
          skillFocus: "choosing and combining operations in meaningful real-world problem solving",
          learningIntention:
            "Solve richer problems by deciding what the question is asking, selecting a method, and explaining the reasoning clearly.",
          successCriteria: [
            "The learner can identify which operation or combination of operations fits the problem.",
            "The learner can record or explain the working clearly.",
            "The learner can check the answer against the real situation.",
          ],
          practiceActivity:
            "Use shopping, meal planning, project measurement, budgeting, or game scoring tasks that need more than one step or decision.",
          evidenceExamples: [
            "a multi-step practical problem with explanation",
            "a project or budget summary using more than one operation",
            "a learner reflection on why a chosen strategy was useful",
          ],
          assessmentCheck:
            "Later, check whether the learner can solve a new real-world problem and justify why the chosen operations fit the situation.",
          nextStep:
            "This opens naturally into fractions, proportional reasoning, measurement, and richer mathematical modelling.",
          reportLanguage:
            "The learner is increasingly able to apply operations to real-world problems, explain decisions, and check whether the final answer makes sense.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one clear worked example that shows the learner moving from counting to a more flexible strategy.",
    "Save practical task summaries from shopping, cooking, planning, or games when the mathematics is visible and well explained.",
    "A short reflection about why a method was useful can strengthen portfolio evidence and later reporting.",
  ],
  reportingSupport: [
    "Parent notes can highlight increasing confidence, strategy choice, and explanation rather than only correct answers.",
    "Practical family tasks often provide the strongest reporting examples because the mathematics is visible in context.",
    "Collected evidence over time can show a shift from acting out problems to using efficient mental or written calculation strategies.",
  ],
};
