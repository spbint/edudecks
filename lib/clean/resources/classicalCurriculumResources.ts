import {
  MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
  getClassicalEncounterByCurriculumCode,
  getClassicalEncounterByPathwayIdentity,
  getClassicalEncounterByPathwayStepId,
  getLiveClassicalEncounters,
  type ClassicalEncounterDefinition,
} from "@/lib/clean/curriculum/classicalCurriculumRegistry";
import type { WorksheetResource, WorksheetStepContext } from "@/lib/clean/resources/worksheetResources";

export type ClassicalCurriculumResource = WorksheetResource & {
  curriculumKey: "mylearna-classical";
  bandKey: "years-3-4";
  cycleKey: "a";
  unitKey: "first-civilisations";
  encounterNumber: number;
  bigQuestion: string;
  pageImageUrls: string[];
};

export const MYLEARNA_CLASSICAL_ENCOUNTER_1_ID =
  MYLEARNA_CLASSICAL_ENCOUNTER_ONE.pathway.pathwayStepId;

function toClassicalCurriculumResource(
  encounter: ClassicalEncounterDefinition,
): ClassicalCurriculumResource {
  return {
    curriculumKey: encounter.curriculumKey,
    bandKey: encounter.hierarchy.bandKey,
    cycleKey: encounter.hierarchy.cycleKey,
    unitKey: encounter.hierarchy.unitKey,
    encounterNumber: encounter.encounterNumber,
    bigQuestion: encounter.academic.bigQuestion,
    pathwayStepId: encounter.pathway.pathwayStepId,
    stepKey: encounter.pathway.stepKey,
    subjectKey: encounter.pathway.subjectKey,
    strandKey: encounter.pathway.strandKey,
    stageKey: encounter.pathway.stageKey,
    stageDisplay: `${encounter.hierarchy.bandLabel.replace("–", "-")} · ${encounter.hierarchy.cycleLabel}`,
    stepNumber: encounter.encounterNumber,
    pathwayStepTitle: `${encounter.hierarchy.encounterLabel} · ${encounter.title}`,
    title: encounter.title,
    curriculumCode: encounter.curriculumCode,
    marketplaceExternalProductId: encounter.distribution.externalProductId,
    concept: encounter.academic.coreConcept,
    includesAnswerSheet: encounter.resource.includesAnswerGuidance,
    regionalVariants: [],
    containsRegionalMoneyPages: false,
    fileName: encounter.resource.fileName,
    href: encounter.resource.pdfHref,
    resourceType: encounter.resource.resourceType,
    previewImageUrl: encounter.resource.pageImageUrls[0],
    pageImageUrls: [...encounter.resource.pageImageUrls],
  };
}

const RESOURCE_BY_ENCOUNTER = new Map(
  getLiveClassicalEncounters().map((encounter) => [
    encounter,
    toClassicalCurriculumResource(encounter),
  ]),
);

function resourceForEncounter(encounter: ClassicalEncounterDefinition | null) {
  return encounter ? RESOURCE_BY_ENCOUNTER.get(encounter) ?? null : null;
}

export const MYLEARNA_CLASSICAL_RESOURCES: ClassicalCurriculumResource[] =
  getLiveClassicalEncounters().map((encounter) => RESOURCE_BY_ENCOUNTER.get(encounter)!);

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function getClassicalCurriculumResourceForPathwayStep(
  context: WorksheetStepContext,
): ClassicalCurriculumResource | null {
  const pathwayStepId = safe(context.pathwayStepId);
  if (pathwayStepId) {
    return resourceForEncounter(getClassicalEncounterByPathwayStepId(pathwayStepId));
  }

  return resourceForEncounter(
    getClassicalEncounterByPathwayIdentity({
      subjectKey: safe(context.subjectKey),
      strandKey: safe(context.strandKey),
      stageKey: safe(context.stageKey),
      stepKey: safe(context.stepKey),
    }),
  );
}

export function getClassicalCurriculumResourceByCode(code: string) {
  return resourceForEncounter(getClassicalEncounterByCurriculumCode(code));
}
