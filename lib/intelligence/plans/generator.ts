import type {
  GenerationExecutionOptions,
  LearningPlanGenerationInput,
  LearningPlanGenerator,
} from "@/lib/intelligence/plans/types";

export type { LearningPlanGenerator } from "@/lib/intelligence/plans/types";
export { createDefaultLearningPlanGenerator } from "@/lib/intelligence/plans/templateGenerator";

export function isLearningPlanType(value: unknown): value is "lesson" | "unit" {
  return value === "lesson" || value === "unit";
}

export function planTypeLabel(planType: "lesson" | "unit") {
  return planType === "lesson" ? "lesson" : "unit";
}

export function callGenerator(
  generator: LearningPlanGenerator,
  input: LearningPlanGenerationInput,
  options: GenerationExecutionOptions,
) {
  return input.planType === "lesson"
    ? generator.generateLessonPlan(input, options)
    : generator.generateUnitPlan(input, options);
}
