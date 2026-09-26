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

export const RESOURCE_FACTORY_PRIMARY_STAGE_KEYS = [
  "lower-primary",
  "middle-primary",
  "upper-elementary",
  "upper-primary",
] as const;

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
  stageKeys?: readonly string[];
}): ResourceFactoryGenerationSeed[] {
  const existing = new Set(
    Array.from(input?.existingResourceIds ?? []).map((value) =>
      String(value).trim().toUpperCase(),
    ),
  );
  const variants = input?.variants?.length
    ? input.variants
    : RESOURCE_FACTORY_MATH_VARIANTS;
  const stageKeys = new Set(
    input?.stageKeys?.length
      ? input.stageKeys
      : RESOURCE_FACTORY_PRIMARY_STAGE_KEYS,
  );
  const limit = Math.max(1, Math.min(100, input?.limit ?? 10));
  const seeds: ResourceFactoryGenerationSeed[] = [];

  const steps = getPathwayStepsBySubject("mathematics")
    .filter((step) => stageKeys.has(step.stageKey))
    .sort(
      (left, right) =>
        left.stageOrder - right.stageOrder ||
        left.strandOrder - right.strandOrder ||
        left.stepOrder - right.stepOrder,
    );

  for (const variant of variants) {
    for (const step of steps) {
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
        pathwayStepId: step.id,
        stageKey: step.stageKey,
        stepKey: step.stepKey,
      });

      if (seeds.length >= limit) return seeds;
    }
  }

  return seeds;
}
