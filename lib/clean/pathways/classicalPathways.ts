import { getLiveClassicalEncounters } from "@/lib/clean/curriculum/classicalCurriculumRegistry";
import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { PathwayStageKey } from "@/lib/clean/pathways/mathematicsNumberPrototype";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

export const DEFAULT_CLASSICAL_STRAND_KEY = "history-and-civilisation";

export const CLASSICAL_SUBJECT_OVERVIEW = {
  eyebrow: "MyLearna Classical · two-year cycle curriculum",
  title: "MyLearna Classical pathway overview",
  description:
    "MyLearna Classical connects history, geography, literature, language, reasoning, and cultural knowledge through coherent encounters. The first live sequence is Years 3-4, Cycle A: The Ancient World.",
  helper:
    "Open the current encounter, download the branded booklet, then use MyLearna to plan the learning, capture meaningful evidence, and preserve progress over time.",
};

export const CLASSICAL_DOMAIN_CARDS: SubjectStrandCard[] = [
  {
    key: "history-and-civilisation",
    title: "History & Civilisation",
    description:
      "Explore people, places, ideas, stories, artefacts, and change through connected civilisation studies.",
    whyItMatters:
      "A coherent historical narrative gives learners the background knowledge they need to understand literature, geography, ideas, and the modern world.",
    status: "first-detailed",
  },
];

function buildClassicalEncounterSteps(strandKey: string, stageKey: string) {
  return getLiveClassicalEncounters()
    .filter(
      (encounter) =>
        encounter.pathway.strandKey === strandKey &&
        encounter.pathway.stageKey === stageKey,
    )
    .sort((left, right) => left.encounterNumber - right.encounterNumber)
    .map((encounter) => ({
      id: encounter.encounterNumber,
      stepKey: encounter.pathway.stepKey,
      title: `${encounter.hierarchy.encounterLabel} · ${encounter.title}`,
      meaning: encounter.academic.meaning,
      skillFocus: encounter.academic.skillFocus,
      learningIntention: encounter.academic.learningIntention,
      successCriteria: [...encounter.academic.successCriteria],
      practiceActivity: encounter.academic.practiceActivity,
      evidenceExamples: [...encounter.academic.evidenceExamples],
      assessmentCheck: encounter.academic.assessmentCheck,
      nextStep: encounter.academic.nextStep,
      reportLanguage: encounter.academic.reportLanguage,
    }));
}

function buildClassicalHistoryAndCivilisationWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return {
    key: "history-and-civilisation",
    trackingKey: "history-and-civilisation",
    title: "History & Civilisation",
    subtitle:
      "Years 3-4 · Cycle A: The Ancient World. Learn through story, geography, narration, vocabulary, reasoning, and carefully designed printable encounters.",
    pathwayLabel: "MyLearna Classical · History & Civilisation",
    relationshipTitle: "How this classical pathway works",
    relationshipCopy:
      "Each encounter builds a connected store of knowledge. Learners read and observe, narrate in their own words, locate people and places, reason about causes and consequences, and preserve strong evidence in MyLearna.",
    currentFocusStageKey,
    stages: [
      {
        key: "foundation-kindergarten",
        title: "Foundation",
        helper:
          "The Foundation MyLearna Classical sequence is not live yet. This band will use the same flexible encounter model with developmentally appropriate narration, story, memory, observation, and culture.",
        steps: [],
      },
      {
        key: "lower-primary",
        title: "Years 1-2",
        helper:
          "The Years 1-2 MyLearna Classical cycle is in development. It will be released as its own two-year band rather than borrowing content from another age group.",
        steps: [],
      },
      {
        key: "middle-primary",
        title: "Years 3-4 · Cycle A: The Ancient World",
        helper:
          "Cycle A begins with the first civilisations and moves through the Ancient Near East, Egypt, Greece, Greek thought, and Rome. Families can move at their own pace rather than following a fixed school-week timetable.",
        steps: buildClassicalEncounterSteps("history-and-civilisation", "middle-primary"),
      },
      {
        key: "upper-primary",
        title: "Years 5-6",
        helper:
          "The Years 5-6 MyLearna Classical cycle is in development. Learners in this band are not automatically placed into the Years 3-4 sequence.",
        steps: [],
      },
      {
        key: "lower-secondary",
        title: "Years 7-8",
        helper:
          "The Years 7-8 MyLearna Classical cycle is in development and will introduce a more dialectical level of comparison, source work, and reasoning.",
        steps: [],
      },
      {
        key: "years-9-10-consolidation",
        title: "Years 9-10",
        helper:
          "The Years 9-10 MyLearna Classical cycle is in development and will use increasingly analytical and rhetorical responses.",
        steps: [],
      },
    ],
    portfolioSupport: [
      "Keep one strong piece from each encounter rather than every completed page.",
      "Narrations, maps, reasoning paragraphs, copywork, artefact observations, and photographs of notebook work can all provide meaningful evidence.",
      "Use My Capture and My Portfolio to preserve work that best shows growing historical knowledge and explanation.",
    ],
    reportingSupport: [
      "Report what the learner understands and can explain, not simply which booklet pages were completed.",
      "Strong evidence shows connected knowledge: people, places, vocabulary, chronology, cause and effect, and narration in the learner's own words.",
      "Cycle-level reporting can draw on selected portfolio evidence across multiple encounters.",
    ],
  };
}

export const CLASSICAL_STRAND_WORKSPACE_BUILDERS: Record<
  string,
  (currentFocusStageKey: PathwayStageKey) => MathematicsDetailedStrandWorkspace
> = {
  "history-and-civilisation": buildClassicalHistoryAndCivilisationWorkspace,
};
