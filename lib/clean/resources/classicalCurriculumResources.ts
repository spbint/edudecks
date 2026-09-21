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
  "classical::history-and-civilisation::middle-primary::from-wandering-to-settlement";

export const MYLEARNA_CLASSICAL_RESOURCES: ClassicalCurriculumResource[] = [
  {
    curriculumKey: "mylearna-classical",
    bandKey: "years-3-4",
    cycleKey: "a",
    unitKey: "first-civilisations",
    encounterNumber: 1,
    bigQuestion: "Why would people choose to live in one place?",
    pathwayStepId: MYLEARNA_CLASSICAL_ENCOUNTER_1_ID,
    stepKey: "from-wandering-to-settlement",
    subjectKey: "classical",
    strandKey: "history-and-civilisation",
    stageKey: "middle-primary",
    stageDisplay: "Years 3-4 · Cycle A: The Ancient World",
    stepNumber: 1,
    pathwayStepTitle: "Encounter 1 · From Wandering to Settlement",
    title: "From Wandering to Settlement",
    curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E01",
    marketplaceExternalProductId: "MYL-CLASSICAL-Y34-A-U1-E01",
    concept: "From mobile communities to early settled farming communities",
    includesAnswerSheet: true,
    regionalVariants: [],
    containsRegionalMoneyPages: false,
    fileName: "MyLearna-Classical-Y3-4-Cycle-A-Encounter-1-From-Wandering-to-Settlement.pdf",
    href: "/api/classical/booklets/y3-4-a-u1-e01",
    resourceType: "booklet-pdf",
    pageImageUrls: [
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-01.png?v=1789982608",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-02.png?v=1789982615",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-03.png?v=1789982645",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-04.png?v=1789982654",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-05.png?v=1789982664",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-06.png?v=1789982674",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-07.png?v=1789982683",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-08.png?v=1789982692",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-09.png?v=1789982699",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-10.png?v=1789982708",
    ],
  },
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function getClassicalCurriculumResourceForPathwayStep(
  context: WorksheetStepContext,
): ClassicalCurriculumResource | null {
  const pathwayStepId = safe(context.pathwayStepId);
  if (pathwayStepId) {
    return MYLEARNA_CLASSICAL_RESOURCES.find(
      (resource) => resource.pathwayStepId === pathwayStepId,
    ) ?? null;
  }

  const stepKey = safe(context.stepKey);
  const subjectKey = safe(context.subjectKey);
  const strandKey = safe(context.strandKey);
  const stageKey = safe(context.stageKey);

  const exactMatches = MYLEARNA_CLASSICAL_RESOURCES.filter(
    (resource) =>
      resource.stepKey === stepKey &&
      resource.subjectKey === subjectKey &&
      resource.strandKey === strandKey &&
      resource.stageKey === stageKey,
  );

  return exactMatches.length === 1 ? exactMatches[0] : null;
}

export function getClassicalCurriculumResourceByCode(code: string) {
  const cleanCode = safe(code).toUpperCase();
  return MYLEARNA_CLASSICAL_RESOURCES.find(
    (resource) => resource.curriculumCode?.toUpperCase() === cleanCode,
  ) ?? null;
}
