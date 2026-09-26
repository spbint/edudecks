import { getPathwayStepsBySubject } from "@/lib/clean/pathways/pathwayStepRegistry";
import type {
  ResourceFactoryDifficulty,
  ResourceFactoryGenerationSeed,
  ResourceFactoryType,
} from "@/lib/resourceFactory/types";

export type ResourceFactoryVariant = {
  resourceType: ResourceFactoryType;
  difficulty: ResourceFactoryDifficulty;
  questionCount: number;
};

export const RESOURCE_FACTORY_MATH_VARIANTS: readonly ResourceFactoryVariant[] = [
  { resourceType: "practice", difficulty: "developing", questionCount: 16 },
  { resourceType: "revision", difficulty: "secure", questionCount: 20 },
  { resourceType: "skill-check", difficulty: "secure", questionCount: 12 },
  { resourceType: "challenge", difficulty: "challenge", questionCount: 12 },
];

function slugify(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

export function buildResourceFactoryId(input: {
  pathwayStepId: string;
  resourceType: ResourceFactoryType;
}) {
  return `MYL-AUTO-MATH-${stableHash(
    `${input.pathwayStepId}::${input.resourceType}`,
  )}`;
}

export function buildMathResourceFactoryPlan(input?: {
  existingResourceIds?: Iterable<string>;
  limit?: number;
  variants?: readonly ResourceFactoryVariant[];
}): ResourceFactoryGenerationSeed[] {
  const existing = new Set(
    Array.from(input?.existingResourceIds ?? []).map((value) =>
      String(value).trim().toUpperCase(),
    ),
  );
  const variants = input?.variants?.length
    ? input.variants
    : RESOURCE_FACTORY_MATH_VARIANTS;
  const limit = Math.max(1, Math.min(100, input?.limit ?? 10));
  const seeds: ResourceFactoryGenerationSeed[] = [];

  const steps = getPathwayStepsBySubject("mathematics").sort(
    (left, right) =>
      left.strandOrder - right.strandOrder ||
      left.stageOrder - right.stageOrder ||
      left.stepOrder - right.stepOrder,
  );

  for (const step of steps) {
    for (const variant of variants) {
      const resourceId = buildResourceFactoryId({
        pathwayStepId: step.id,
        resourceType: variant.resourceType,
      });
      if (existing.has(resourceId.toUpperCase())) continue;

      const slug = slugify(
        `${step.strandKey}-${step.stageKey}-${step.stepKey}-${variant.resourceType}`,
      );

      seeds.push({
        resourceId,
        slug,
        yearLevels: [step.stageTitle],
        strand: step.strandTitle,
        skill: step.skillFocus || step.stepTitle,
        resourceType: variant.resourceType,
        difficulty: variant.difficulty,
        questionCount: variant.questionCount,
      });

      if (seeds.length >= limit) return seeds;
    }
  }

  return seeds;
}
