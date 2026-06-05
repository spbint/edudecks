export type DemoLearnerId = "emma" | "noah";
export type DemoWeekId = "week-1" | "week-2" | "week-3" | "week-4";

export type DemoLearner = {
  id: DemoLearnerId;
  name: string;
  age: number;
  grade: string;
  focus: Record<string, string>;
};

export type DemoCalendarBlock = {
  id: string;
  weekId: DemoWeekId;
  date: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  time: string;
  learnerId: DemoLearnerId;
  subject: string;
  title: string;
  note: string;
};

export type DemoEvidence = {
  id: string;
  learnerId: DemoLearnerId;
  title: string;
  type: string;
  note: string;
};

export type DemoPortfolioItem = DemoEvidence & {
  reason: string;
};

export type DemoPathway = {
  learnerId: DemoLearnerId;
  subject: string;
  pathway: string;
  currentFocus: string;
  status: "Developing" | "Secure";
  secureHistory: string[];
  currentStep: string;
  later: string[];
  assessment: {
    question: string;
    options: string[];
    signal: "Developing" | "Secure";
    summary: string;
  };
};

const weekStarts = [
  ["week-1", "2026-03-02"],
  ["week-2", "2026-03-09"],
  ["week-3", "2026-03-16"],
  ["week-4", "2026-03-23"],
] as const;

const dayOffsets = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
} as const;

function addDays(dateValue: string, offset: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function block(
  weekId: DemoWeekId,
  weekStart: string,
  day: DemoCalendarBlock["day"],
  learnerId: DemoLearnerId,
  time: string,
  subject: string,
  title: string,
  note: string,
): DemoCalendarBlock {
  const date = addDays(weekStart, dayOffsets[day]);
  return {
    id: `${weekId}-${day.toLowerCase()}-${learnerId}-${subject.toLowerCase().replaceAll(" ", "-")}`,
    weekId,
    date,
    day,
    time,
    learnerId,
    subject,
    title,
    note,
  };
}

function buildWeek(weekId: DemoWeekId, weekStart: string, weekNumber: number) {
  const emmaMath =
    weekNumber < 3 ? "Fraction strips and equal parts" : "Equivalent fraction models";
  const noahMath =
    weekNumber < 3 ? "Ratio tables and multiplicative comparison" : "Equivalent ratios in recipes";

  return [
    block(weekId, weekStart, "Monday", "emma", "9:00 AM", "ELA", "Reading response", "Charlotte's Web discussion and response notes."),
    block(weekId, weekStart, "Monday", "emma", "10:15 AM", "Math", emmaMath, "Visual fraction models and number sense practice."),
    block(weekId, weekStart, "Monday", "emma", "1:00 PM", "Science", "Plant life cycle observation", "Bean plant sketch, height note, and vocabulary check."),
    block(weekId, weekStart, "Monday", "noah", "9:00 AM", "ELA", "Evidence-based reading notes", "Read nonfiction passage and mark supporting evidence."),
    block(weekId, weekStart, "Monday", "noah", "10:15 AM", "Math", noahMath, "Use ratio tables and real-world comparison cards."),
    block(weekId, weekStart, "Monday", "noah", "1:00 PM", "Science", "Ecosystem observation", "Garden ecosystem notes and food-web vocabulary."),

    block(weekId, weekStart, "Tuesday", "emma", "9:00 AM", "ELA", "Paragraph writing", "Topic sentence, details, and closing sentence practice."),
    block(weekId, weekStart, "Tuesday", "emma", "10:15 AM", "Math", "Fraction practice", "Hands-on practice with halves, thirds, fourths, and equivalent pairs."),
    block(weekId, weekStart, "Tuesday", "emma", "1:00 PM", "Social Studies", "Communities past and present", "Compare local community helpers with early American communities."),
    block(weekId, weekStart, "Tuesday", "noah", "9:00 AM", "ELA", "Expository paragraph", "Draft a paragraph with a claim, evidence, and explanation."),
    block(weekId, weekStart, "Tuesday", "noah", "10:15 AM", "Math", "Ratio practice", "Scale recipe and map-distance examples."),
    block(weekId, weekStart, "Tuesday", "noah", "1:00 PM", "Social Studies", "U.S. regions", "Map major regions and physical features."),

    block(weekId, weekStart, "Wednesday", "emma", "9:30 AM", "Science", "Plant investigation", "Measure and draw plant growth changes."),
    block(weekId, weekStart, "Wednesday", "emma", "11:00 AM", "Arts", "Botanical sketching", "Nature journal sketch with labels and color notes."),
    block(weekId, weekStart, "Wednesday", "emma", "2:00 PM", "Portfolio", "Evidence review", "Choose one work sample and add a parent note."),
    block(weekId, weekStart, "Wednesday", "noah", "9:30 AM", "Science", "Food web investigation", "Build a food web from garden observations."),
    block(weekId, weekStart, "Wednesday", "noah", "11:00 AM", "Project", "Garden growth data", "Record measurements and update the project table."),
    block(weekId, weekStart, "Wednesday", "noah", "2:00 PM", "Portfolio", "Evidence review", "Select a diagram or paragraph draft for the portfolio."),

    block(weekId, weekStart, "Thursday", "emma", "9:00 AM", "Math", "Assessment - Equivalent fractions", "Short auto-check with visual fraction models."),
    block(weekId, weekStart, "Thursday", "emma", "10:15 AM", "ELA", "Charlotte's Web paragraph response", "Refine details and check paragraph structure."),
    block(weekId, weekStart, "Thursday", "emma", "1:00 PM", "Capture", "Capture evidence/work sample", "Add fraction model photo or writing sample note."),
    block(weekId, weekStart, "Thursday", "noah", "9:00 AM", "Math", "Assessment - Equivalent ratios", "Short auto-check using recipe scaling."),
    block(weekId, weekStart, "Thursday", "noah", "10:15 AM", "ELA", "Expository paragraph refinement", "Revise for evidence and explanation."),
    block(weekId, weekStart, "Thursday", "noah", "1:00 PM", "Capture", "Capture evidence/work sample", "Add ratio or ecosystem work sample note."),

    block(weekId, weekStart, "Friday", "emma", "9:30 AM", "Project", "Garden project day", "Connect plant observations with drawings and oral explanation."),
    block(weekId, weekStart, "Friday", "emma", "11:00 AM", "Reflection", "Weekly reflection", "Name one thing that felt stronger and one next step."),
    block(weekId, weekStart, "Friday", "emma", "1:30 PM", "Records", "Parent record review", "Sarah reviews notes and marks portfolio candidates."),
    block(weekId, weekStart, "Friday", "noah", "9:30 AM", "Project", "Garden growth investigation", "Update data table and explain one pattern."),
    block(weekId, weekStart, "Friday", "noah", "11:00 AM", "Reflection", "Weekly reflection", "Review ratio, writing, and project progress."),
    block(weekId, weekStart, "Friday", "noah", "1:30 PM", "Records", "Parent record review", "Sarah reviews notes and marks portfolio candidates."),
  ];
}

export const carterFamilyDemo = {
  family: {
    name: "The Carter Family",
    parent: "Sarah Carter",
    location: "North Carolina, USA",
    note: "This is a fictional demo family using sample data. No account is required.",
  },
  learners: [
    {
      id: "emma",
      name: "Emma Carter",
      age: 8,
      grade: "Grade 3",
      focus: {
        Math: "Fractions and number sense",
        ELA: "Reading response and paragraph writing",
        Science: "Plant life cycles and observation",
        "Social Studies": "Local communities and early American communities",
        Arts: "Botanical sketching and nature journal work",
      },
    },
    {
      id: "noah",
      name: "Noah Carter",
      age: 11,
      grade: "Grade 6",
      focus: {
        Math: "Ratios and proportional reasoning",
        ELA: "Expository writing and evidence-based paragraphs",
        Science: "Ecosystems and food webs",
        "Social Studies": "U.S. geography and regional features",
        Project: "Garden growth investigation and data recording",
      },
    },
  ] satisfies DemoLearner[],
  timetable: weekStarts.flatMap(([weekId, weekStart], index) =>
    buildWeek(weekId, weekStart, index + 1),
  ),
  currentDay: {
    date: "Thursday, March 19, 2026",
    blocks: [
      "Emma: Math assessment - Equivalent fractions",
      "Emma: ELA - Charlotte's Web paragraph response",
      "Emma: Science - Plant growth observation",
      "Noah: Math assessment - Equivalent ratios",
      "Noah: ELA - Expository paragraph refinement",
      "Noah: Science - Ecosystem food web explanation",
    ],
  },
  pathways: [
    {
      learnerId: "emma",
      subject: "Math",
      pathway: "Fractions and number sense",
      currentFocus: "Equivalent fractions with visual models",
      status: "Developing",
      secureHistory: ["Recognise equal parts", "Use halves, thirds, and fourths"],
      currentStep: "Build equivalent fractions with visual models",
      later: ["Compare simple fractions", "Use fractions on a number line"],
      assessment: {
        question: "Which fraction is equal to 1/2?",
        options: ["2/4", "1/3", "3/5"],
        signal: "Developing",
        summary:
          "Emma selected the correct visual model with support, but needs more practice explaining equivalent fractions independently.",
      },
    },
    {
      learnerId: "noah",
      subject: "Math",
      pathway: "Ratios and proportional reasoning",
      currentFocus: "Equivalent ratios in real-world contexts",
      status: "Secure",
      secureHistory: ["Multiplication and division strategies", "Multiplicative comparison"],
      currentStep: "Use equivalent ratios in real-world contexts",
      later: ["Percentages and proportional comparisons", "Scale and rate problems"],
      assessment: {
        question:
          "A recipe uses 2 cups of oats for 4 servings. How many cups are needed for 8 servings?",
        options: ["3 cups", "4 cups", "6 cups"],
        signal: "Secure",
        summary: "Noah correctly used proportional reasoning to scale the recipe.",
      },
    },
  ] satisfies DemoPathway[],
  evidence: [
    { id: "e1", learnerId: "emma", title: "Equivalent fraction models", type: "Photo and parent observation", note: "Emma used fraction strips to show that 1/2 and 2/4 can represent the same amount. She explained her thinking using the visual model, but needs more practice comparing fractions without support." },
    { id: "e2", learnerId: "emma", title: "Charlotte's Web paragraph response", type: "Work sample", note: "Emma wrote a paragraph response using a topic sentence and supporting details." },
    { id: "e3", learnerId: "emma", title: "Plant growth journal", type: "Observation and photo", note: "Emma recorded changes in bean plant growth and used labeled drawings to show observations." },
    { id: "e4", learnerId: "emma", title: "Community map", type: "Work sample", note: "Emma created a simple map showing important places in a local community and described how people use them." },
    { id: "e5", learnerId: "noah", title: "Ratio recipe scaling", type: "Work sample", note: "Noah scaled a pancake recipe for different numbers of people and explained the ratio relationship." },
    { id: "e6", learnerId: "noah", title: "Ecosystem food web", type: "Diagram and observation", note: "Noah created a food web showing producers, consumers, and decomposers in a garden ecosystem." },
    { id: "e7", learnerId: "noah", title: "Expository writing draft", type: "Work sample", note: "Noah wrote an explanatory paragraph using evidence from his science investigation." },
    { id: "e8", learnerId: "noah", title: "U.S. regions map task", type: "Work sample", note: "Noah labeled major U.S. regions and described physical features that influence settlement and land use." },
  ] satisfies DemoEvidence[],
  portfolio: [
    { id: "p1", learnerId: "emma", title: "Equivalent fraction models", type: "Photo and parent observation", note: "Emma used visual models to compare equivalent fractions.", reason: "This evidence shows mathematical reasoning, visual modelling, and growing independence when explaining fraction relationships." },
    { id: "p2", learnerId: "emma", title: "Plant growth journal", type: "Observation and photo", note: "Emma labeled plant changes across March.", reason: "This shows careful science observation and use of labeled drawings." },
    { id: "p3", learnerId: "emma", title: "Charlotte's Web paragraph response", type: "Work sample", note: "Emma wrote a structured response paragraph.", reason: "This shows reading comprehension, paragraph structure, and supporting details." },
    { id: "p4", learnerId: "noah", title: "Ratio recipe scaling", type: "Work sample", note: "Noah scaled a pancake recipe for different servings.", reason: "This shows practical ratio reasoning and clear mathematical explanation." },
    { id: "p5", learnerId: "noah", title: "Ecosystem food web", type: "Diagram and observation", note: "Noah created and explained a garden ecosystem food web.", reason: "This shows science vocabulary, diagramming, and systems thinking." },
    { id: "p6", learnerId: "noah", title: "Expository writing draft", type: "Work sample", note: "Noah used evidence from his investigation in an explanatory paragraph.", reason: "This shows evidence-based writing and revision." },
  ] satisfies DemoPortfolioItem[],
  data: {
    evidenceCollected: "24 items this month",
    learningMomentum: "Active across all four weeks",
    pathwayActivity: "2 current Math pathways in progress",
    reportingReadiness: "Strong evidence base building for March records",
    strengths: {
      Emma: ["Visual math models", "Science observation", "Reading discussion"],
      Noah: ["Practical ratio reasoning", "Science diagrams", "Project organization"],
    },
    focusAreas: {
      Emma: ["Equivalent fractions", "Paragraph detail", "Independent written explanation"],
      Noah: ["Percentage connections", "Evidence-based writing", "Written mathematical explanations"],
    },
  },
  reports: {
    period: "March 2026",
    Emma:
      "Emma has been developing confidence with fractions and number sense. She can recognize equal parts, use visual models to represent halves, thirds, and fourths, and is beginning to identify equivalent fractions using fraction strips and drawings. Her recent evidence shows growing independence when explaining how two fractions can represent the same amount.\n\nEmma also completed learning in reading, writing, science, and social studies. Her portfolio includes a Charlotte's Web paragraph response, a plant growth journal, and a local community mapping task.",
    Noah:
      "Noah has been applying ratio and proportional reasoning to practical contexts. He can use multiplication and division strategies to compare quantities and is developing confidence with equivalent ratios and percentage-based problems. His work samples show improving accuracy and clearer mathematical reasoning.\n\nNoah also completed work in expository writing, ecosystems, and U.S. geography. His portfolio includes a ratio recipe task, a food web diagram, and an explanatory writing draft.",
    nextSteps: {
      Emma: [
        "Continue practising equivalent fractions using visual models.",
        "Build paragraph detail in written responses.",
        "Use science observations to support labeled explanations.",
      ],
      Noah: [
        "Continue applying ratios in real-world contexts.",
        "Strengthen percentage connections.",
        "Develop written explanations using evidence from investigations.",
      ],
    },
  },
  outputs: [
    "Monthly learning report",
    "Portfolio summary",
    "Evidence record",
    "Learning coverage snapshot",
  ],
} as const;
