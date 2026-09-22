import { getLiveClassicalEncounters } from "@/lib/clean/curriculum/classicalCurriculumRegistry";

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

export const MYLEARNA_MARKETPLACE_RESOURCES: MyLearnaMarketplaceResource[] =
  getLiveClassicalEncounters().map((encounter) => ({
    externalProductId: encounter.distribution.externalProductId,
    handle: encounter.distribution.marketplaceHandle,
    title: encounter.title,
    brand: "MyLearna Classical",
    marketplaceArea: encounter.distribution.marketplaceArea,
    collection: encounter.distribution.collection,
    subcollection: encounter.distribution.subcollection,
    scope: encounter.distribution.scope,
    resourceFormat: encounter.resource.resourceType,
    coverImageUrl: encounter.resource.pageImageUrls[0] || "",
    description: encounter.distribution.description,
    bigQuestion: encounter.academic.bigQuestion,
    bandLabel: encounter.hierarchy.bandLabel,
    cycleLabel: encounter.hierarchy.cycleLabel,
    unitLabel: encounter.hierarchy.unitLabel,
    encounterLabel: encounter.hierarchy.encounterLabel,
    pageCount: encounter.resource.pageImageUrls.length,
    pdfHref: encounter.resource.pdfHref,
    pathwayHref:
      `/my-pathways?subjectKey=${encodeURIComponent(encounter.pathway.subjectKey)}` +
      `&strandKey=${encodeURIComponent(encounter.pathway.strandKey)}` +
      `&stageKey=${encodeURIComponent(encounter.pathway.stageKey)}` +
      `&pathwayStepId=${encodeURIComponent(encounter.pathway.pathwayStepId)}` +
      `&stepKey=${encodeURIComponent(encounter.pathway.stepKey)}`,
    pathwayStepId: encounter.pathway.pathwayStepId,
    accessModel: encounter.distribution.accessModel,
    entitlementKey: encounter.distribution.entitlementKey,
    unitBundleKey: encounter.distribution.unitBundleKey,
    cycleBundleKey: encounter.distribution.cycleBundleKey,
    futurePhysicalPackSupported: encounter.distribution.futurePhysicalPackSupported,
  }));

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
