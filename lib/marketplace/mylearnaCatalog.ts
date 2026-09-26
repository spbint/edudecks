import {
  CLASSICAL_CURRICULUM_REGISTRY,
  getLiveClassicalEncounters,
  type ClassicalEncounterDefinition,
} from "@/lib/clean/curriculum/classicalCurriculumRegistry";
import { buildClassicalCatalogueProjection } from "@/lib/marketplace/classicalCatalogueProjection";

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

export function buildMylearnaMarketplaceResources(
  encounters: readonly ClassicalEncounterDefinition[],
): MyLearnaMarketplaceResource[] {
  return getLiveClassicalEncounters(encounters).map((encounter) => {
    const projection = buildClassicalCatalogueProjection(encounter);
    return {
      externalProductId: projection.external_product_id,
      handle: projection.handle,
      title: projection.title,
      brand: projection.metadata.brand,
      marketplaceArea: projection.marketplace_area,
      collection: projection.primary_collection,
      subcollection: projection.subcollection,
      scope: projection.metadata.catalogue_kind,
      resourceFormat: projection.resource_format,
      coverImageUrl: projection.thumbnail_url || "",
      description: encounter.distribution.description,
      bigQuestion: projection.metadata.big_question,
      bandLabel: encounter.hierarchy.bandLabel,
      cycleLabel: encounter.hierarchy.cycleLabel,
      unitLabel: encounter.hierarchy.unitLabel,
      encounterLabel: encounter.hierarchy.encounterLabel,
      pageCount: projection.metadata.page_count,
      pdfHref: projection.metadata.pdf_href,
      pathwayHref:
        `/my-pathways?subjectKey=${encodeURIComponent(encounter.pathway.subjectKey)}` +
        `&strandKey=${encodeURIComponent(encounter.pathway.strandKey)}` +
        `&stageKey=${encodeURIComponent(encounter.pathway.stageKey)}` +
        `&pathwayStepId=${encodeURIComponent(encounter.pathway.pathwayStepId)}` +
        `&stepKey=${encodeURIComponent(encounter.pathway.stepKey)}`,
      pathwayStepId: projection.metadata.pathway_step_id,
      accessModel: projection.metadata.access_model,
      entitlementKey: projection.metadata.entitlement_key,
      unitBundleKey: projection.metadata.bundle_hierarchy.unit_key,
      cycleBundleKey: projection.metadata.bundle_hierarchy.cycle_key,
      futurePhysicalPackSupported:
        projection.metadata.future_physical_pack_supported,
    };
  });
}

export const MYLEARNA_MARKETPLACE_RESOURCES: MyLearnaMarketplaceResource[] =
  buildMylearnaMarketplaceResources(CLASSICAL_CURRICULUM_REGISTRY);

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
