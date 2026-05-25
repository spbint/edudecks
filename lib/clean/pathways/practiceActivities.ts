import {
  getPathwayStepById,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";

export type PracticeOutcome =
  | "not_started"
  | "developing"
  | "secure"
  | "needs_support";

export type PracticeSectionType =
  | "understanding"
  | "fluency"
  | "problem_solving"
  | "reasoning";

export type PracticeTaskType =
  | "select"
  | "short_answer"
  | "draw_or_explain"
  | "parent_observation";

export type PracticeVisual =
  | {
      type: "number_pairs";
      pairs: string[];
    }
  | {
      type: "ten_frame";
      filled: number;
      total?: number;
    }
  | {
      type: "part_part_whole";
      whole: number;
      partA?: number;
      partB?: number;
    }
  | {
      type: "counter_groups";
      groups: number[];
      hiddenGroupIndex?: number;
      labels?: string[];
    }
  | {
      type: "comparison_pairs";
      pairs: string[];
    };

export type PracticeTask = {
  id: string;
  prompt: string;
  taskType: PracticeTaskType;
  expectedAnswer?: string | string[];
  concretePrompt?: string;
  representationalPrompt?: string;
  abstractPrompt?: string;
  parentPrompt?: string;
  supportPrompt?: string;
  options?: string[];
  visual?: PracticeVisual;
  visualModelType?: PracticeVisual["type"];
  scaffoldLevel?: "high" | "medium" | "low";
};

export type PracticeSection = {
  id: string;
  type: PracticeSectionType;
  title: string;
  learnerGoal: string;
  tasks: PracticeTask[];
};

export type PathwayPracticeActivity = {
  pathwayStepId: string;
  subjectKey: string;
  strandKey: string;
  stageKey: string;
  stepKey: string;
  title: string;
  strandLabel: string;
  phaseLabel: string;
  myLearnaFocus: string;
  canonicalStepTitle: string;
  canonicalStepMeaning: string;
  canonicalStageTitle: string;
  acaraCode?: string;
  learnCard: {
    bigIdea: string;
    example: string;
    parentTip: string;
  };
  sections: PracticeSection[];
  miniCheck: PracticeTask[];
  assessmentPreview: PracticeTask[];
  evidenceSummaryTemplate: string;
};

export type PracticePlayerTaskItem = {
  key: string;
  sectionId: string;
  sectionType: PracticeSectionType | "mini_check";
  sectionTitle: string;
  learnerGoal: string | null;
  task: PracticeTask;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function requireCanonicalStep() {
  const step = getPathwayStepById(
    "mathematics",
    "number-and-place-value",
    "foundation-kindergarten",
    "partition-and-combine-small-collections-up-to-10",
  );

  if (!step) {
    throw new Error(
      "The canonical practice prototype step was not found in the pathway step registry.",
    );
  }

  return step;
}

const CANONICAL_MAKE_NUMBERS_TO_10_STEP = requireCanonicalStep();

export const makeNumbersTo10Practice: PathwayPracticeActivity = {
  pathwayStepId: CANONICAL_MAKE_NUMBERS_TO_10_STEP.id,
  subjectKey: CANONICAL_MAKE_NUMBERS_TO_10_STEP.subjectKey,
  strandKey: CANONICAL_MAKE_NUMBERS_TO_10_STEP.strandKey,
  stageKey: CANONICAL_MAKE_NUMBERS_TO_10_STEP.stageKey,
  stepKey: CANONICAL_MAKE_NUMBERS_TO_10_STEP.stepKey,
  title: "Make numbers to 10 in different ways",
  strandLabel: CANONICAL_MAKE_NUMBERS_TO_10_STEP.subjectTitle,
  phaseLabel: "Number Foundations",
  myLearnaFocus: "Part-part-whole thinking",
  canonicalStepTitle: CANONICAL_MAKE_NUMBERS_TO_10_STEP.stepTitle,
  canonicalStepMeaning: CANONICAL_MAKE_NUMBERS_TO_10_STEP.stepDescription,
  canonicalStageTitle: CANONICAL_MAKE_NUMBERS_TO_10_STEP.stageTitle,
  acaraCode: "AC9MFN04",
  learnCard: {
    bigIdea:
      "Numbers can be broken into smaller parts. The same number can be made in more than one way.",
    example: "10 can be made as 5 + 5, 6 + 4, 7 + 3, or 8 + 2.",
    parentTip:
      "Use counters, blocks, buttons or snacks. Ask: 'Can you show me another way to make the same number?'",
  },
  sections: [
    {
      id: "understanding",
      type: "understanding",
      title: "Understanding",
      learnerGoal: "I can see two parts that make a whole number.",
      tasks: [
        {
          id: "u1",
          prompt: "Which pair makes 5? 2 and 3, 1 and 2, or 4 and 4?",
          taskType: "select",
          expectedAnswer: "2 and 3",
          concretePrompt:
            "Use counters, buttons, or small toys to make one group of 2 and one group of 3. Push the groups together and count the whole.",
          representationalPrompt:
            "Look at the number-pair cards and notice which picture shows two parts making 5.",
          abstractPrompt: "Choose the pair that makes 5.",
          parentPrompt:
            "The learner can point, move objects, or answer aloud. An adult can tap the choice if needed.",
          options: ["2 and 3", "1 and 2", "4 and 4"],
          visual: {
            type: "number_pairs",
            pairs: ["2 + 3", "1 + 2", "4 + 4"],
          },
          visualModelType: "number_pairs",
          scaffoldLevel: "high",
        },
        {
          id: "u2",
          prompt: "Which pair makes 10? 6 and 4, 3 and 3, or 8 and 1?",
          taskType: "select",
          expectedAnswer: "6 and 4",
          concretePrompt:
            "Make 10 with counters or snacks, then split them into two parts in different ways and compare them.",
          representationalPrompt:
            "Look at the number-pair cards and find the one that shows a whole of 10.",
          abstractPrompt: "Choose the pair that makes 10.",
          parentPrompt:
            "Ask: Which two parts join to make the whole group of 10? The learner can answer by pointing.",
          options: ["6 and 4", "3 and 3", "8 and 1"],
          visual: {
            type: "number_pairs",
            pairs: ["6 + 4", "3 + 3", "8 + 1"],
          },
          visualModelType: "number_pairs",
          scaffoldLevel: "high",
        },
      ],
    },
    {
      id: "fluency",
      type: "fluency",
      title: "Fluency",
      learnerGoal: "I can find the missing part.",
      tasks: [
        {
          id: "f1",
          prompt: "4 and __ make 10.",
          taskType: "short_answer",
          expectedAnswer: "6",
          concretePrompt:
            "Build 10 with objects. Move 4 to one side. How many objects are still needed to make the whole 10?",
          representationalPrompt:
            "Look at the ten frame. Count the filled counters and the empty spaces.",
          abstractPrompt: "4 and __ make 10.",
          parentPrompt:
            "The learner can count the empty spaces aloud. An adult can type the number if needed.",
          visual: {
            type: "ten_frame",
            filled: 4,
            total: 10,
          },
          visualModelType: "ten_frame",
          scaffoldLevel: "high",
        },
        {
          id: "f2",
          prompt: "7 and __ make 10.",
          taskType: "short_answer",
          expectedAnswer: "3",
          concretePrompt:
            "Start with a group of 10 objects. Put 7 in one group. How many are left to finish the whole?",
          representationalPrompt:
            "Use the ten frame to count how many spaces are still empty.",
          abstractPrompt: "7 and __ make 10.",
          parentPrompt:
            "If needed, ask the learner to tap each empty space while counting aloud.",
          visual: {
            type: "ten_frame",
            filled: 7,
            total: 10,
          },
          visualModelType: "ten_frame",
          scaffoldLevel: "medium",
        },
        {
          id: "f3",
          prompt: "2 and __ make 8.",
          taskType: "short_answer",
          expectedAnswer: "6",
          concretePrompt:
            "Make 8 objects. Put 2 in one part. How many need to go in the other part?",
          representationalPrompt:
            "Look at the part-part-whole model. One part is 2 and the whole is 8.",
          abstractPrompt: "2 and __ make 8.",
          parentPrompt:
            "The learner can answer orally or by showing the other part with counters first.",
          visual: {
            type: "part_part_whole",
            whole: 8,
            partA: 2,
          },
          visualModelType: "part_part_whole",
          scaffoldLevel: "medium",
        },
      ],
    },
    {
      id: "problem-solving",
      type: "problem_solving",
      title: "Problem Solving",
      learnerGoal: "I can use number parts in a simple situation.",
      tasks: [
        {
          id: "p1",
          prompt:
            "There are 10 apples. 6 are red and the rest are green. How many are green?",
          taskType: "short_answer",
          expectedAnswer: "4",
          concretePrompt:
            "Use 10 counters as apples. Make 6 red apples. The rest are green. Count the green apples.",
          representationalPrompt:
            "Look at the grouped counters. One group shows the red apples and one group shows the green apples.",
          abstractPrompt:
            "There are 10 apples. 6 are red. How many are green?",
          parentPrompt:
            "Keep the story short. The learner can count the green group or say the answer aloud.",
          visual: {
            type: "counter_groups",
            groups: [6, 4],
            labels: ["red", "green"],
          },
          visualModelType: "counter_groups",
          scaffoldLevel: "medium",
        },
        {
          id: "p2",
          prompt:
            "There are 8 counters. Some are blue and 5 are yellow. How many are blue?",
          taskType: "short_answer",
          expectedAnswer: "3",
          concretePrompt:
            "Use 8 counters. Show 5 yellow counters. Cover the counters that must be blue and then uncover them to count.",
          representationalPrompt:
            "Look at the grouped counters. One part is hidden and the other part shows 5 yellow counters.",
          abstractPrompt:
            "There are 8 counters. 5 are yellow. How many are blue?",
          parentPrompt:
            "Ask: What is the whole? What part can you see? The learner can answer after counting the hidden part.",
          visual: {
            type: "counter_groups",
            groups: [3, 5],
            hiddenGroupIndex: 0,
            labels: ["blue", "yellow"],
          },
          visualModelType: "counter_groups",
          scaffoldLevel: "medium",
        },
      ],
    },
    {
      id: "reasoning",
      type: "reasoning",
      title: "Reasoning",
      learnerGoal: "I can show the same number in more than one way.",
      tasks: [
        {
          id: "r1",
          prompt: "Show or explain two different ways to make 10.",
          taskType: "draw_or_explain",
          concretePrompt:
            "Use counters, linking cubes, or snacks to make 10 in one way. Then rearrange them to make 10 in a different way.",
          representationalPrompt:
            "Use the part-part-whole model or quick sketches to show two pairs that make the same whole.",
          abstractPrompt: "Show or say two different ways to make 10.",
          parentPrompt:
            "The learner can build, point, draw, or answer orally. You can record their words for them.",
          supportPrompt: "For example: 5 and 5 is one way. What is another way?",
          visual: {
            type: "part_part_whole",
            whole: 10,
          },
          visualModelType: "part_part_whole",
          scaffoldLevel: "medium",
        },
        {
          id: "r2",
          prompt: "Is 6 and 4 the same total as 7 and 3? How do you know?",
          taskType: "parent_observation",
          concretePrompt:
            "Make 6 and 4 with one set of objects. Make 7 and 3 with another set. Compare the two totals.",
          representationalPrompt:
            "Look at both number-pair models and notice what stays the same and what changes.",
          abstractPrompt:
            "Are 6 + 4 and 7 + 3 the same total? Explain how you know.",
          parentPrompt:
            "Accept oral explanation, pointing, or showing with counters. Long writing is not needed.",
          supportPrompt:
            "The child may explain using counters, fingers, drawing, or mental reasoning.",
          visual: {
            type: "comparison_pairs",
            pairs: ["6 + 4", "7 + 3"],
          },
          visualModelType: "comparison_pairs",
          scaffoldLevel: "medium",
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mc1",
      prompt: "8 and __ make 10.",
      taskType: "short_answer",
      expectedAnswer: "2",
      concretePrompt:
        "If needed, build 10 with objects and move 8 to one side before answering.",
      representationalPrompt:
        "Look at the ten frame and notice how many spaces are still empty.",
      abstractPrompt: "8 and __ make 10.",
      parentPrompt:
        "Keep support light here. The learner can answer aloud while looking at the model.",
      visual: {
        type: "ten_frame",
        filled: 8,
        total: 10,
      },
      visualModelType: "ten_frame",
      scaffoldLevel: "low",
    },
    {
      id: "mc2",
      prompt: "Which makes 9? 5 and 4, 6 and 6, or 2 and 5?",
      taskType: "select",
      expectedAnswer: "5 and 4",
      concretePrompt:
        "If needed, make each pair with counters and compare which whole is 9.",
      representationalPrompt:
        "Look at the number-pair cards and spot the pair that matches 9.",
      abstractPrompt: "Choose the pair that makes 9.",
      parentPrompt:
        "Offer less prompting than in practice. The learner can point or say the answer.",
      options: ["5 and 4", "6 and 6", "2 and 5"],
      visual: {
        type: "number_pairs",
        pairs: ["5 + 4", "6 + 6", "2 + 5"],
      },
      visualModelType: "number_pairs",
      scaffoldLevel: "low",
    },
    {
      id: "mc3",
      prompt: "Show another way to make 7.",
      taskType: "draw_or_explain",
      concretePrompt:
        "If needed, make 7 with objects, then rearrange them into two parts in a different way.",
      representationalPrompt:
        "Use the part-part-whole model or a quick sketch to show another way to make 7.",
      abstractPrompt: "Show or say another way to make 7.",
      parentPrompt:
        "Allow an oral answer or a quick sketch. The learner does not need to write a long explanation.",
      visual: {
        type: "part_part_whole",
        whole: 7,
      },
      visualModelType: "part_part_whole",
      scaffoldLevel: "low",
    },
  ],
  assessmentPreview: [
    {
      id: "ap1",
      prompt: "6 + __ = 10",
      taskType: "short_answer",
    },
    {
      id: "ap2",
      prompt: "Which two numbers make 8?",
      taskType: "select",
    },
    {
      id: "ap3",
      prompt: "There are 9 counters. 4 are hidden. How many can you see?",
      taskType: "short_answer",
    },
    {
      id: "ap4",
      prompt: "Show a different way to make 10.",
      taskType: "draw_or_explain",
    },
    {
      id: "ap5",
      prompt: "True or false: 3 and 6 make 10. Explain or correct it.",
      taskType: "parent_observation",
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised making numbers to 10 in different ways using part-part-whole thinking. They worked with missing parts, simple number stories, and explaining more than one way to make the same number.",
};

export const PATHWAY_PRACTICE_ACTIVITIES = Object.freeze([makeNumbersTo10Practice]);

export function getPathwayPracticeActivityByStepId(pathwayStepId: string) {
  const normalizedPathwayStepId = safe(pathwayStepId);
  return (
    PATHWAY_PRACTICE_ACTIVITIES.find(
      (activity) => activity.pathwayStepId === normalizedPathwayStepId,
    ) || null
  );
}

export function getCanonicalPracticePrototypeStep() {
  return CANONICAL_MAKE_NUMBERS_TO_10_STEP;
}

export function buildPracticeEvidenceSummary(
  activity: PathwayPracticeActivity,
  learnerLabel?: string | null,
) {
  const template = safe(activity.evidenceSummaryTemplate);
  if (!template) {
    const sectionSummary = activity.sections
      .map((section) => section.title.toLowerCase())
      .join(", ");
    const subjectLabel = safe(activity.strandLabel) || "this learner";

    return `${learnerLabel || "This learner"} practised ${activity.title.toLowerCase()} in ${subjectLabel}. The activity included ${sectionSummary}.`;
  }

  if (safe(learnerLabel)) {
    return template.replace("this learner", safe(learnerLabel));
  }

  return template;
}

export function getPracticeRecommendation(outcome: PracticeOutcome) {
  if (outcome === "secure") {
    return {
      title: "Ready for the next step",
      body: "Move forward to simple addition and subtraction stories using numbers to 10.",
    };
  }

  if (outcome === "developing") {
    return {
      title: "Keep practising this step",
      body: "Repeat the fluency and reasoning activities with counters or ten frames.",
    };
  }

  if (outcome === "needs_support") {
    return {
      title: "Step back for support",
      body: "Return to counting collections and recognising small groups before practising missing parts again.",
    };
  }

  return {
    title: "Start the practice loop",
    body: "Begin with the Learn card, then complete each practice section.",
  };
}

export function buildPracticePlayerItems(activity: PathwayPracticeActivity) {
  return activity.sections.flatMap((section) =>
    section.tasks.map((task) => ({
      key: `${section.id}::${task.id}`,
      sectionId: section.id,
      sectionType: section.type,
      sectionTitle: section.title,
      learnerGoal: section.learnerGoal,
      task,
    })),
  );
}

export function buildMiniCheckPlayerItems(activity: PathwayPracticeActivity) {
  return activity.miniCheck.map((task) => ({
    key: `mini-check::${task.id}`,
    sectionId: "mini-check",
    sectionType: "mini_check" as const,
    sectionTitle: "Mini Check",
    learnerGoal: "Try the skill with lighter support and choose the best-fit outcome.",
    task,
  }));
}

export function countPracticeTasks(activity: PathwayPracticeActivity) {
  return activity.sections.reduce((total, section) => total + section.tasks.length, 0);
}

export function countMiniCheckTasks(activity: PathwayPracticeActivity) {
  return activity.miniCheck.length;
}

export function getPathwayIdentityLabel(item: Pick<PathwayPracticeActivity, "pathwayStepId">) {
  return safe(item.pathwayStepId);
}

export function getCanonicalPracticeStepMeta(
  activity: PathwayPracticeActivity,
  registryItem: PathwayStepRegistryItem = CANONICAL_MAKE_NUMBERS_TO_10_STEP,
) {
  return {
    canonicalStrandTitle: registryItem.strandTitle,
    canonicalTitle: registryItem.stepTitle,
    canonicalMeaning: registryItem.stepDescription,
    canonicalStageTitle: registryItem.stageTitle,
    canonicalStepNumber: registryItem.legacyStepNumber,
    canonicalLabel: `${registryItem.subjectTitle} / ${registryItem.strandTitle} / ${registryItem.stageTitle}`,
    pathwayStepId: activity.pathwayStepId,
  };
}
