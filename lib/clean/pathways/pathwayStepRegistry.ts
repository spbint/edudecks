import type { CleanAssessmentStatusValue } from "@/lib/clean/assessments/types";
import {
  DETAILED_SUBJECT_CONFIGS,
} from "@/lib/clean/pathways/detailedSubjectConfigs";
import type {
  MathematicsDetailedStrandStep,
} from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type {
  PathwayProgressStatus,
  PathwayStageKey,
} from "@/lib/clean/pathways/mathematicsNumberPrototype";
import {
  PATHWAY_SUBJECTS,
  type PathwaySubjectKey,
} from "@/lib/clean/pathways/pathwaySubjects";

export type PathwayStepIdentity = {
  subjectKey: PathwaySubjectKey;
  strandKey: string;
  stageKey: string;
  stepKey: string;
};

export type PathwayStepStatusContext = {
  pathwayProgress?: PathwayProgressStatus | null;
  assessmentConfidence?: CleanAssessmentStatusValue | null;
  evidenceLinked?: boolean;
};

export type PathwayStepRegistryItem = PathwayStepIdentity & {
  id: string;
  subjectTitle: string;
  subjectOrder: number;
  strandTitle: string;
  strandOrder: number;
  stageTitle: string;
  stageOrder: number;
  stepTitle: string;
  stepDescription: string;
  stepOrder: number;
  pathwayLabel: string;
  legacyPathwayKey: string;
  legacyStepNumber: string;
  skillFocus: string | null;
};

export type PathwayStepRegistrySummary = {
  subjectCount: number;
  strandCount: number;
  stepCount: number;
};

const REGISTRY_BUILD_FOCUS_STAGE_KEY: PathwayStageKey = "middle-primary";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function slugify(value: unknown) {
  return safe(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getExplicitStepKey(step: MathematicsDetailedStrandStep) {
  const candidate = safe(
    (step as Record<string, unknown>).stepKey ?? (step as Record<string, unknown>).key,
  );
  return candidate || null;
}

export function buildPathwayRegistryStepKey(
  stepTitle: string,
  fallbackId: string | number,
  existingKeys: Set<string> | null = null,
) {
  const explicit = slugify(stepTitle);
  const fallback = `step-${slugify(fallbackId) || "item"}`;
  const baseKey = explicit || fallback;

  if (!existingKeys || !existingKeys.has(baseKey)) {
    return baseKey;
  }

  const dedupedKey = `${baseKey}-${slugify(fallbackId) || "item"}`;
  if (!existingKeys.has(dedupedKey)) {
    return dedupedKey;
  }

  return `${dedupedKey}-duplicate`;
}

export function buildPathwayStepId(
  subjectKey: PathwaySubjectKey,
  strandKey: string,
  stageKey: string,
  stepKey: string,
) {
  return [safe(subjectKey), safe(strandKey), safe(stageKey), safe(stepKey)].join("::");
}

function assertRequiredField(
  label: string,
  value: string,
  context: Record<string, string>,
) {
  if (value) return value;

  throw new Error(
    `Missing ${label} while building the pathway step registry (${Object.entries(context)
      .map(([key, item]) => `${key}=${item}`)
      .join(", ")}).`,
  );
}

function buildPathwayStepRegistry() {
  const items: PathwayStepRegistryItem[] = [];
  const seenIds = new Set<string>();
  const detailedSubjects = PATHWAY_SUBJECTS.filter((subject) => subject.status === "detailed");

  detailedSubjects.forEach((subject, subjectIndex) => {
    const subjectConfig = DETAILED_SUBJECT_CONFIGS[subject.key];
    if (!subjectConfig) {
      throw new Error(
        `Detailed subject "${subject.key}" is missing a pathway config.`,
      );
    }

    subjectConfig.domainCards.forEach((strandCard, strandIndex) => {
      const buildWorkspace = subjectConfig.workspaceBuilders[strandCard.key];
      if (!buildWorkspace) {
        throw new Error(
          `Subject "${subject.key}" is missing a workspace builder for strand "${strandCard.key}".`,
        );
      }

      const workspace = buildWorkspace(REGISTRY_BUILD_FOCUS_STAGE_KEY);
      const strandKey = assertRequiredField("strand key", safe(workspace.key), {
        subjectKey: subject.key,
        strandCardKey: strandCard.key,
      });
      const strandTitle = assertRequiredField("strand title", safe(workspace.title), {
        subjectKey: subject.key,
        strandKey,
      });
      const legacyPathwayKey = assertRequiredField(
        "legacy pathway key",
        safe(workspace.trackingKey),
        {
          subjectKey: subject.key,
          strandKey,
        },
      );
      const pathwayLabel = assertRequiredField("pathway label", safe(workspace.pathwayLabel), {
        subjectKey: subject.key,
        strandKey,
      });

      workspace.stages.forEach((stage, stageIndex) => {
        const stageKey = assertRequiredField("stage key", safe(stage.key), {
          subjectKey: subject.key,
          strandKey,
        });
        const stageTitle = assertRequiredField("stage title", safe(stage.title), {
          subjectKey: subject.key,
          strandKey,
          stageKey,
        });
        const stageStepKeys = new Set<string>();

        stage.steps.forEach((step, stepIndex) => {
          const explicitStepKey = slugify(getExplicitStepKey(step));
          const derivedStepKey = buildPathwayRegistryStepKey(
            safe(step.title),
            safe(step.id) || String(stepIndex + 1),
            stageStepKeys,
          );
          const stepKey = explicitStepKey || derivedStepKey;

          if (stageStepKeys.has(stepKey)) {
            throw new Error(
              `Duplicate step key "${stepKey}" inside subject "${subject.key}", strand "${strandKey}", stage "${stageKey}".`,
            );
          }
          stageStepKeys.add(stepKey);

          const stepTitle = assertRequiredField("step title", safe(step.title), {
            subjectKey: subject.key,
            strandKey,
            stageKey,
            stepKey,
          });
          const stepDescription = assertRequiredField(
            "step description",
            safe(step.meaning),
            {
              subjectKey: subject.key,
              strandKey,
              stageKey,
              stepKey,
            },
          );
          const legacyStepNumber = assertRequiredField(
            "legacy step number",
            safe(step.id),
            {
              subjectKey: subject.key,
              strandKey,
              stageKey,
              stepKey,
            },
          );
          const id = buildPathwayStepId(subject.key, strandKey, stageKey, stepKey);

          if (seenIds.has(id)) {
            throw new Error(`Duplicate canonical pathway step id "${id}".`);
          }
          seenIds.add(id);

          items.push({
            id,
            subjectKey: subject.key,
            subjectTitle: subject.title,
            subjectOrder: subjectIndex + 1,
            strandKey,
            strandTitle,
            strandOrder: strandIndex + 1,
            stageKey,
            stageTitle,
            stageOrder: stageIndex + 1,
            stepKey,
            stepTitle,
            stepDescription,
            stepOrder: stepIndex + 1,
            pathwayLabel,
            legacyPathwayKey,
            legacyStepNumber,
            skillFocus: safe(step.skillFocus) || null,
          });
        });
      });
    });
  });

  if (!items.length) {
    throw new Error("No pathway steps were registered.");
  }

  return Object.freeze(items);
}

export const PATHWAY_STEP_REGISTRY = buildPathwayStepRegistry();

export const PATHWAY_STEP_REGISTRY_SUMMARY: PathwayStepRegistrySummary = Object.freeze({
  subjectCount: new Set(PATHWAY_STEP_REGISTRY.map((item) => item.subjectKey)).size,
  strandCount: new Set(
    PATHWAY_STEP_REGISTRY.map((item) => `${item.subjectKey}::${item.strandKey}`),
  ).size,
  stepCount: PATHWAY_STEP_REGISTRY.length,
});

const REGISTRY_BY_ID = new Map(PATHWAY_STEP_REGISTRY.map((item) => [item.id, item]));

export function getAllPathwaySteps() {
  return PATHWAY_STEP_REGISTRY;
}

export function getPathwayStepsBySubject(subjectKey: PathwaySubjectKey) {
  return PATHWAY_STEP_REGISTRY.filter((item) => item.subjectKey === subjectKey);
}

export function getPathwayStepsByStrand(subjectKey: PathwaySubjectKey, strandKey: string) {
  return PATHWAY_STEP_REGISTRY.filter(
    (item) => item.subjectKey === subjectKey && item.strandKey === safe(strandKey),
  );
}

export function getPathwayStepById(
  subjectKey: PathwaySubjectKey,
  strandKey: string,
  stageKey: string,
  stepKey: string,
) {
  return (
    REGISTRY_BY_ID.get(buildPathwayStepId(subjectKey, strandKey, stageKey, stepKey)) || null
  );
}
