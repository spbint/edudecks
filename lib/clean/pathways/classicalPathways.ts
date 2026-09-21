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
        steps: [
          {
            id: 1,
            stepKey: "from-wandering-to-settlement",
            title: "Encounter 1 · From Wandering to Settlement",
            meaning:
              "Understand how farming helped some communities remain in one place for longer and how food storage and surplus could support increasingly complex settlements.",
            skillFocus:
              "historical narration, cause and effect, early civilisation vocabulary, map orientation, and evidence-based explanation",
            learningIntention:
              "I am learning how farming helped some communities build more permanent settlements.",
            successCriteria: [
              "I can explain at least one relationship between agriculture and permanent settlement.",
              "I can use key words such as agriculture, settlement, domesticate, and surplus accurately.",
              "I can compare a moving community with a settled farming community.",
              "I can narrate an important idea from the encounter in my own words.",
            ],
            practiceActivity:
              "Use the MyLearna Classical Encounter 1 booklet. Read and discuss the learning pages, complete the compare-and-sort and map work, narrate the learning, then choose Level A or Level B writing and reasoning tasks.",
            evidenceExamples: [
              "a completed map or compare-and-sort activity",
              "an oral or written narration",
              "copywork, prepared dictation, or a reasoning paragraph",
              "a photographed notebook page or parent discussion note",
            ],
            assessmentCheck:
              "Can the learner explain how farming made permanent settlement more practical, using at least one accurate cause-and-effect relationship rather than only defining vocabulary?",
            nextStep:
              "Continue to Encounter 2: Rivers and Civilisation — why did so many early civilisations grow near rivers?",
            reportLanguage:
              "The learner is developing understanding of how changes in food production contributed to permanent settlement and increasingly complex communities, and can communicate this understanding through narration, map work, and historical reasoning.",
          },
        ],
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
