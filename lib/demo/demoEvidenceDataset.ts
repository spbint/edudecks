import type { DemoLearnerId } from "@/lib/demo/carterFamilyDemoData";

export type DemoProgress = "Developing" | "Consolidating" | "Secure";

export type DemoEvidenceRecord = {
  id: string;
  learnerId: DemoLearnerId;
  title: string;
  pathway: string;
  step: number;
  progress: DemoProgress;
  shortDescription: string;
  whatHappened: string;
  parentObservation: string;
  learnerReflection: string;
  learningArea: string;
  date: string;
  reflection: string;
  includeInPortfolio: true;
  includeInReport: true;
  evidenceType: "Worksheet and observation" | "Work sample" | "Observation";
  imageKey: string;
  imageAlt: string;
  imagePlaceholder: string;
  worksheetUrl?: string;
  tags?: string[];
  curriculumNote?: string;
};

const worksheetRoot = "/resources/worksheets/maths/ratio-and-proportional-reasoning";

export const carterRatioWorksheetUrls = {
  4: `${worksheetRoot}/lower-primary/MYL-MATH-RPR-EE-S004-Scale-Simple-Tasks-Up-And-Down.pdf`,
  5: `${worksheetRoot}/middle-primary/MYL-MATH-RPR-MP-S005-Use-Tables-Or-Diagrams-To-Compare-Related-Quantities.pdf`,
  6: `${worksheetRoot}/middle-primary/MYL-MATH-RPR-MP-S006-Use-Simple-Rates-In-Practical-Contexts.pdf`,
  8: `${worksheetRoot}/upper-primary/MYL-MATH-RPR-E-S008-Apply-Scale-And-Unit-Comparison-In-Real-Tasks.pdf`,
  9: `${worksheetRoot}/lower-secondary/MYL-MATH-RPR-E-S009-Use-Ratio-Tables-And-Unit-Rates-To-Solve-Practical-Problems.pdf`,
  10: `${worksheetRoot}/lower-secondary/MYL-MATH-RPR-E-S010-Judge-Fairness-Value-And-Efficiency-Proportionally.pdf`,
  11: `${worksheetRoot}/years-9-10-consolidation/MYL-MATH-RPR-E-S011-Apply-Proportional-Reasoning-In-Graphs-Finance-And-Modelling.pdf`,
  12: `${worksheetRoot}/years-9-10-consolidation/MYL-MATH-RPR-E-S012-Refine-Judgement-And-Communication-In-Proportional-Problems.pdf`,
} as const;

const pathway = "Ratio and Proportional Reasoning";
const area = "Mathematics";
const worksheetCaption = "Learning resource used for this activity";

function emmaRecord(input: Omit<DemoEvidenceRecord, "learnerId" | "pathway" | "learningArea" | "includeInPortfolio" | "includeInReport" | "evidenceType" | "imagePlaceholder"> & { step: keyof typeof carterRatioWorksheetUrls; evidenceType?: DemoEvidenceRecord["evidenceType"] }): DemoEvidenceRecord {
  return {
    ...input,
    learnerId: "emma",
    pathway,
    learningArea: area,
    includeInPortfolio: true,
    includeInReport: true,
    evidenceType: input.evidenceType ?? "Worksheet and observation",
    imagePlaceholder: worksheetCaption,
    worksheetUrl: carterRatioWorksheetUrls[input.step],
  };
}

export const demoEvidenceDataset = {
  family: {
    name: "The Carter Family",
    parentDisplayName: "Sarah Carter",
    location: "North Carolina, USA",
    learningYear: "2025-2026 learning year",
    reportingPeriod: "1 March 2026 to 31 July 2026",
    preparedOn: "8 August 2026",
  },
  learners: [
    { id: "emma", displayName: "Emma Carter", age: 8, grade: "Grade 3" },
    { id: "noah", displayName: "Noah Carter", age: 11, grade: "Grade 6" },
  ] satisfies Array<{ id: DemoLearnerId; displayName: string; age: number; grade: string }>,
  evidence: [
    emmaRecord({
      id: "demo-evidence-emma-step-4",
      title: "Step 4 - Scale Simple Tasks Up and Down",
      step: 4,
      progress: "Developing",
      shortDescription: "Emma explored how quantities change when they are scaled up or down.",
      whatHappened: "Emma explored how quantities change when they are scaled up or down. She used pictures and simple number relationships to work with ideas such as twice as many, half as many and one-third as many.",
      parentObservation: "Emma was confident when scaling whole-number groups up. She needed more thinking time when scaling down by fractions but became more accurate when she represented the starting quantity visually.",
      learnerReflection: "Drawing the groups helped me see what changed.",
      reflection: "Drawing the groups helped Emma see what changed.",
      date: "2026-03-12",
      imageKey: "demo-worksheet-step-4",
      imageAlt: "First-page preview of the fictional MyLearna worksheet about scaling simple tasks up and down",
      tags: ["scaling", "multiplicative relationships"],
      curriculumNote: "Representing simple multiplicative relationships visually",
    }),
    emmaRecord({
      id: "demo-evidence-emma-step-5",
      title: "Step 5 - Use Tables or Diagrams to Compare Related Quantities",
      step: 5,
      progress: "Consolidating",
      shortDescription: "Emma used tables and diagrams to compare quantities that change according to a consistent rule.",
      whatHappened: "Emma used tables and diagrams to compare quantities that change according to a consistent rule. She identified patterns in repeated groups and used information from tables and visual displays to find missing values.",
      parentObservation: "Emma increasingly recognised the rule without needing to count every object individually. She explained that one quantity changed because the other quantity was increasing by the same repeated amount.",
      learnerReflection: "The table made the pattern easier to notice.",
      reflection: "The table made the pattern easier for Emma to notice.",
      date: "2026-03-27",
      imageKey: "demo-worksheet-step-5",
      imageAlt: "First-page preview of the fictional MyLearna worksheet about comparing related quantities with tables and diagrams",
      tags: ["tables", "diagrams", "comparison"],
      curriculumNote: "Recognising consistent relationships between quantities",
    }),
    emmaRecord({
      id: "demo-evidence-emma-step-6",
      title: "Step 6 - Use Simple Rates in Practical Contexts",
      step: 6,
      progress: "Consolidating",
      shortDescription: "Emma interpreted simple rates in practical problems involving distance, water, printing and everyday quantities.",
      whatHappened: "Emma interpreted simple rates and used them to solve practical problems involving distance, water, printing and everyday quantities.",
      parentObservation: "Emma understood the repeated relationship quickly when the rate was given in familiar language. She began to use multiplication rather than repeated addition when the quantities became larger.",
      learnerReflection: "I worked out how much happens each time and then multiplied it.",
      reflection: "Emma worked out how much happens each time and then multiplied it.",
      date: "2026-04-17",
      imageKey: "demo-worksheet-step-6",
      imageAlt: "First-page preview of the fictional MyLearna worksheet about simple rates in train, water and printer contexts",
      tags: ["rates", "practical problems"],
      curriculumNote: "Using repeated relationships in familiar contexts",
    }),
    emmaRecord({
      id: "demo-evidence-emma-step-8",
      title: "Step 8 - Apply Scale and Unit Comparison in Real Tasks",
      step: 8,
      progress: "Consolidating",
      shortDescription: "Emma used scale relationships and unit conversion in maps, floor plans, recipes and measurement problems.",
      whatHappened: "Emma used scale relationships and unit conversion in maps, floor plans, recipes and measurement problems.",
      parentObservation: "Emma was particularly engaged by the map-scale and floor-plan tasks. She sometimes needed to pause and identify the correct units before calculating, but her reasoning became more systematic.",
      learnerReflection: "I have to check the units before I work out the answer.",
      reflection: "Emma is learning to check the units before calculating.",
      date: "2026-05-08",
      imageKey: "demo-worksheet-step-8",
      imageAlt: "First-page preview of the fictional MyLearna worksheet about map scale, unit conversion and scale drawings",
      tags: ["scale", "units", "measurement"],
      curriculumNote: "Applying proportional relationships in measurement and design",
    }),
    emmaRecord({
      id: "demo-evidence-emma-step-9",
      title: "Step 9 - Use Ratio Tables and Unit Rates to Solve Practical Problems",
      step: 9,
      progress: "Secure",
      shortDescription: "Emma constructed ratio tables, found unit rates and solved practical problems involving cost, distance, quantities and recipes.",
      whatHappened: "Emma constructed and interpreted ratio tables, found unit rates and used those rates to solve practical problems involving cost, distance, quantities and recipes.",
      parentObservation: "Emma began choosing ratio tables independently and recognised that finding the amount for one unit often made comparisons much easier.",
      learnerReflection: "Finding the amount for one helped me compare the choices.",
      reflection: "Emma found that calculating one unit made comparisons easier.",
      date: "2026-05-29",
      imageKey: "demo-worksheet-step-9",
      imageAlt: "First-page preview of the fictional MyLearna worksheet about ratio tables and unit rates",
      tags: ["ratio tables", "unit rates", "recipes"],
      curriculumNote: "Choosing efficient representations for proportional problems",
    }),
    emmaRecord({
      id: "demo-evidence-emma-step-10",
      title: "Step 10 - Judge Fairness, Value and Efficiency Proportionally",
      step: 10,
      progress: "Secure",
      shortDescription: "Emma used proportional comparisons to decide which situations were fair, better value or more efficient.",
      whatHappened: "Emma used proportional comparisons to decide whether situations were fair, which options offered better value and which processes were more efficient.",
      parentObservation: "Emma was able to calculate unit comparisons accurately and increasingly explained why one option was fairer or better value instead of simply giving an answer.",
      learnerReflection: "The cheapest one is not always the best value.",
      reflection: "Emma is explaining the reasoning behind value judgements more clearly.",
      date: "2026-06-19",
      imageKey: "demo-worksheet-step-10",
      imageAlt: "First-page preview of the fictional MyLearna worksheet about fairness, better value and efficiency",
      tags: ["fairness", "value", "efficiency"],
      curriculumNote: "Explaining proportional decisions in practical contexts",
    }),
    emmaRecord({
      id: "demo-evidence-emma-step-11",
      title: "Step 11 - Apply Proportional Reasoning in Graphs, Finance and Modelling",
      step: 11,
      progress: "Secure",
      shortDescription: "Emma applied proportional reasoning across graphs, financial calculations, unit-rate comparisons, scale drawings and real-world models.",
      whatHappened: "Emma applied proportional reasoning across graphs, financial calculations, unit-rate comparisons, scale drawings and real-world models.",
      parentObservation: "Emma showed increasing flexibility in deciding which representation to use. She could move between tables, graphs and calculations and explain what the mathematical relationship meant in the context of the problem.",
      learnerReflection: "The graph shows the same relationship as the numbers.",
      reflection: "Emma is moving between tables, graphs and calculations with growing flexibility.",
      date: "2026-07-10",
      imageKey: "demo-worksheet-step-11",
      imageAlt: "First-page preview of the fictional MyLearna worksheet about graphs, finance and proportional modelling",
      tags: ["graphs", "finance", "modelling"],
      curriculumNote: "Connecting representations to real-world relationships",
    }),
    emmaRecord({
      id: "demo-evidence-emma-step-12",
      title: "Step 12 - Refine Judgement and Communication in Proportional Problems",
      step: 12,
      progress: "Secure",
      shortDescription: "Emma checked whether answers were reasonable, compared solution methods and explained proportional decisions clearly.",
      whatHappened: "Emma checked whether proposed answers were reasonable, compared different solution methods and explained proportional decisions using calculations, representations and written reasoning.",
      parentObservation: "Emma is increasingly able to recognise when an answer does not make sense before being told. Her explanations are becoming more precise, and she can compare two valid methods rather than assuming there is only one correct way to solve a problem.",
      learnerReflection: "I check whether my answer makes sense before I finish.",
      reflection: "Emma checks whether an answer makes sense and compares valid methods.",
      date: "2026-07-24",
      imageKey: "demo-worksheet-step-12",
      imageAlt: "First-page preview of the fictional MyLearna worksheet about reasonableness, explanation and comparing methods",
      tags: ["reasonableness", "communication", "justification"],
      curriculumNote: "Refining mathematical judgement and communication",
    }),
    {
      id: "demo-evidence-noah-garden",
      learnerId: "noah",
      title: "Garden growth investigation",
      pathway: "Garden growth investigation",
      step: 0,
      progress: "Consolidating",
      shortDescription: "Noah recorded garden changes and explained one pattern in the growth data.",
      whatHappened: "Noah updated a garden growth table and explained one pattern he noticed.",
      parentObservation: "Noah returned to the measurements and improved the precision of his explanation.",
      learnerReflection: "The table helped me see the change over time.",
      learningArea: "Science",
      date: "2026-03-17",
      reflection: "Noah connected measurement and explanation in his garden project.",
      includeInPortfolio: true,
      includeInReport: true,
      evidenceType: "Observation",
      imageKey: "demo-noah-garden",
      imageAlt: "Fictional garden growth notes from Noah's secondary Carter demo exploration",
      imagePlaceholder: "Secondary fictional demo item",
    },
    {
      id: "demo-evidence-noah-ratio",
      learnerId: "noah",
      title: "Recipe ratio scaling",
      pathway: "Ratios and proportional reasoning",
      step: 0,
      progress: "Secure",
      shortDescription: "Noah scaled a recipe for different numbers of people and explained the ratio relationship.",
      whatHappened: "Noah scaled a recipe for different numbers of people and explained the ratio relationship.",
      parentObservation: "Noah used multiplication to scale the recipe and checked whether the quantities were sensible.",
      learnerReflection: "I can scale each ingredient by the same amount.",
      learningArea: "Mathematics",
      date: "2026-03-18",
      reflection: "Noah explained a practical ratio relationship.",
      includeInPortfolio: true,
      includeInReport: true,
      evidenceType: "Work sample",
      imageKey: "demo-noah-recipe",
      imageAlt: "Fictional recipe scaling notes from Noah's secondary Carter demo exploration",
      imagePlaceholder: "Secondary fictional demo item",
    },
  ] satisfies DemoEvidenceRecord[],
} as const;

export type DemoEvidenceDataset = typeof demoEvidenceDataset;
