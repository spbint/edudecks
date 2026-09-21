import {
  MYLEARNA_CLASSICAL_RESOURCES,
} from "@/lib/clean/resources/classicalCurriculumResources";

export type MyLearnaMarketplaceResourceScope =
  | "encounter"
  | "unit"
  | "cycle"
  | "physical-pack";

export type MyLearnaMarketplaceResource = {
  externalProductId: string;
  handle: string;
  title: string;
  brand: string;
  marketplaceArea: string;
  collection: string;
  subcollection: string;
  scope: MyLearnaMarketplaceResourceScope;
  resourceFormat: string;
  coverImageUrl: string;
  description: string;
  bigQuestion: string;
  bandLabel: string;
  cycleLabel: string;
  unitLabel: string;
  encounterLabel: string;
  pageCount: number;
  pdfHref: string;
  pathwayHref: string;
  pathwayStepId: string;
  accessModel: "family_included";
  entitlementKey: "family_subscription";
  unitBundleKey: string;
  cycleBundleKey: string;
  futurePhysicalPackSupported: boolean;
};

const encounterOne = MYLEARNA_CLASSICAL_RESOURCES[0];

if (!encounterOne?.curriculumCode) {
  throw new Error("MyLearna Classical Encounter 1 catalogue identity is missing.");
}

export const MYLEARNA_MARKETPLACE_RESOURCES: MyLearnaMarketplaceResource[] = [
  {
    externalProductId: encounterOne.curriculumCode,
    handle: "classical-y3-4-a-u1-e01-from-wandering-to-settlement",
    title: encounterOne.title,
    brand: "MyLearna Classical",
    marketplaceArea: "Curriculum",
    collection: "MyLearna Classical",
    subcollection: "Years 3–4 · Cycle A: The Ancient World",
    scope: "encounter",
    resourceFormat: encounterOne.resourceType,
    coverImageUrl: encounterOne.pageImageUrls[0] || "",
    description:
      "A complete MyLearna Classical encounter exploring how farming helped some communities move toward more permanent settlement. The branded booklet combines knowledge, vocabulary, map work, narration, grammar, writing, reasoning and portfolio-ready evidence.",
    bigQuestion: encounterOne.bigQuestion,
    bandLabel: "Years 3–4",
    cycleLabel: "Cycle A: The Ancient World",
    unitLabel: "Unit 1: The First Civilisations",
    encounterLabel: "Encounter 1",
    pageCount: encounterOne.pageImageUrls.length,
    pdfHref: encounterOne.href,
    pathwayHref:
      "/my-pathways?subjectKey=classical&strandKey=history-and-civilisation&stageKey=middle-primary&pathwayStepId=" +
      encodeURIComponent(encounterOne.pathwayStepId) +
      "&stepKey=" +
      encodeURIComponent(encounterOne.stepKey),
    pathwayStepId: encounterOne.pathwayStepId,
    accessModel: "family_included",
    entitlementKey: "family_subscription",
    unitBundleKey: "classical-y3-4-a-u1",
    cycleBundleKey: "classical-y3-4-a",
    futurePhysicalPackSupported: true,
  },
];

export function getMylearnaMarketplaceResourceByHandle(handle: string) {
  const cleanHandle = String(handle ?? "").trim().toLowerCase();
  return (
    MYLEARNA_MARKETPLACE_RESOURCES.find(
      (resource) => resource.handle.toLowerCase() === cleanHandle,
    ) ?? null
  );
}

export function getMylearnaMarketplaceResourceByExternalProductId(
  externalProductId: string,
) {
  const cleanId = String(externalProductId ?? "").trim().toUpperCase();
  return (
    MYLEARNA_MARKETPLACE_RESOURCES.find(
      (resource) => resource.externalProductId.toUpperCase() === cleanId,
    ) ?? null
  );
}
