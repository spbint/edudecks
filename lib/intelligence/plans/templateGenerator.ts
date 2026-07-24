import type {
  GenerationExecutionOptions,
  LearningPlanGenerationInput,
  LearningPlanGenerator,
} from "@/lib/intelligence/plans/types";

const commonSequence = (input: LearningPlanGenerationInput) => [
  {
    title: "Connect and notice",
    objective: "Connect the source idea to the learner's existing knowledge.",
    activity: `Discuss what stands out in the source and invite the learner to make an initial prediction. ${input.parentInstructions ?? ""}`.trim(),
    durationMinutes: input.durationUnit === "minutes" && input.duration ? Math.max(5, Math.round(input.duration * 0.25)) : 15,
    notes: "Capture the learner's language and questions without requiring a single correct starting point.",
  },
  {
    title: "Explore and make",
    objective: "Apply the source idea through a practical, observable activity.",
    activity: "Use the source as a prompt, then create, test, compare, or explain something connected to the learner's interests.",
    durationMinutes: input.durationUnit === "minutes" && input.duration ? Math.max(10, Math.round(input.duration * 0.5)) : 30,
    notes: "Adjust the complexity to the learner's age or stage and record useful evidence of thinking.",
  },
  {
    title: "Reflect and extend",
    objective: "Explain what was learned and identify a meaningful next step.",
    activity: "Review the result, ask a learner-generated question, and choose one small extension or improvement.",
    durationMinutes: input.durationUnit === "minutes" && input.duration ? Math.max(5, Math.round(input.duration * 0.25)) : 15,
    notes: "Use the reflection to inform the next learning experience rather than grading the learner's response.",
  },
];

function createPlan(input: LearningPlanGenerationInput, planType: "lesson" | "unit") {
  const subjectText = input.subjects.length ? input.subjects.join(", ") : "the learner's chosen subject area";
  const sourceLabel = input.source.title ?? input.source.provider ?? "the saved source";
  const sequence = planType === "lesson"
    ? commonSequence(input)
    : [
        ...commonSequence(input),
        {
          title: "Share and transfer",
          objective: "Transfer the learning to a new context or audience.",
          activity: "Present the learner's work or explanation, discuss feedback, and identify where the idea could be used next.",
          durationMinutes: null,
          notes: "Keep the transfer authentic and proportionate to the learner's stage.",
        },
      ];

  return {
    title: sourceLabel,
    overview: input.source.description ?? `A ${planType} learning experience inspired by ${sourceLabel}.`,
    subjects: input.subjects.length ? input.subjects : ["General learning"],
    ageStage: input.learnerAgeOrStage,
    learningIntentions: [
      `Explore the key idea from ${sourceLabel}.`,
      `Communicate thinking using ${subjectText}.`,
    ],
    successCriteria: [
      "The learner can explain what they noticed or discovered.",
      "The learner can show or describe a connected application.",
    ],
    sequence,
    resourceRequirements: [
      {
        name: "Source link and learner-selected materials",
        category: "Preparation",
        quantity: "As needed",
        required: true,
        url: input.source.canonicalUrl ?? input.source.finalUrl ?? input.source.originalUrl,
        notes: "Check suitability and accessibility before the activity.",
      },
    ],
    preparation: [
      "Review the source metadata and choose an age-appropriate starting question.",
      "Gather only the materials needed for the learner's chosen extension.",
    ],
    discussionQuestions: [
      "What do you notice first?",
      "What makes you think that?",
      "What would you like to try or find out next?",
    ],
    differentiation: [
      "Offer choices of drawing, speaking, making, writing, or demonstrating understanding.",
      "Model one step at a time and extend with an additional constraint when the learner is ready.",
    ],
    assessmentApproach: "Use observation, conversation, and the learner's work to identify evidence of understanding and the next useful step.",
    evidencePrompts: [
      "What did the learner say, make, test, or explain?",
      "What changed in the learner's thinking during the activity?",
    ],
    portfolioPrompts: [
      "Save one representative artefact, photo, recording, or learner explanation.",
      "Add a short learner or parent reflection describing the learning.",
    ],
    safetySupervisionNotes: [
      "A parent or responsible adult should review materials, links, tools, and supervision needs before starting.",
      "Do not reproduce unsafe instructions or access restricted content from the source.",
    ],
    limitationsAssumptions: [
      "This draft uses extracted metadata only and has not reviewed the full source page.",
      "The parent should verify accuracy, suitability, accessibility, and local curriculum fit before use.",
    ],
  };
}

export class TemplateLearningPlanGenerator implements LearningPlanGenerator {
  readonly provider = "template";
  readonly model = "deterministic-template";
  readonly modelVersion = "v1";

  async generateLessonPlan(input: LearningPlanGenerationInput, options: GenerationExecutionOptions) {
    void options;
    return createPlan(input, "lesson");
  }

  async generateUnitPlan(input: LearningPlanGenerationInput, options: GenerationExecutionOptions) {
    void options;
    return createPlan(input, "unit");
  }
}

export function createDefaultLearningPlanGenerator() {
  return new TemplateLearningPlanGenerator();
}
