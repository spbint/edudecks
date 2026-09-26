import { describe, expect, it } from "vitest";
import { MYLEARNA_CLASSICAL_ENCOUNTER_ONE, MYLEARNA_CLASSICAL_ENCOUNTER_TWO, MYLEARNA_CLASSICAL_ENCOUNTER_THREE, MYLEARNA_CLASSICAL_ENCOUNTER_FOUR, MYLEARNA_CLASSICAL_ENCOUNTER_FIVE, MYLEARNA_CLASSICAL_ENCOUNTER_SIX, MYLEARNA_CLASSICAL_ENCOUNTER_SEVEN } from "@/lib/clean/curriculum/classicalCurriculumRegistry";
import {
  MYLEARNA_MARKETPLACE_RESOURCES,
  getMylearnaMarketplaceResourceByExternalProductId,
  getMylearnaMarketplaceResourceByHandle,
} from "@/lib/marketplace/mylearnaCatalog";

describe("MyLearna Marketplace Classical adapter", () => {
  it("projects Encounter 1 from the canonical registry without identity drift", () => {
    const encounter = MYLEARNA_CLASSICAL_ENCOUNTER_ONE;
    expect(MYLEARNA_MARKETPLACE_RESOURCES).toHaveLength(7);
    expect(MYLEARNA_MARKETPLACE_RESOURCES[0]).toEqual({
      externalProductId: encounter.distribution.externalProductId,
      handle: encounter.distribution.marketplaceHandle,
      title: encounter.title,
      brand: "MyLearna Classical",
      marketplaceArea: encounter.distribution.marketplaceArea,
      collection: encounter.distribution.collection,
      subcollection: encounter.distribution.subcollection,
      scope: encounter.distribution.scope,
      resourceFormat: encounter.resource.resourceType,
      coverImageUrl: encounter.resource.pageImageUrls[0],
      description: encounter.distribution.description,
      bigQuestion: encounter.academic.bigQuestion,
      bandLabel: encounter.hierarchy.bandLabel,
      cycleLabel: encounter.hierarchy.cycleLabel,
      unitLabel: encounter.hierarchy.unitLabel,
      encounterLabel: encounter.hierarchy.encounterLabel,
      pageCount: 10,
      pdfHref: encounter.resource.pdfHref,
      pathwayHref:
        "/my-pathways?subjectKey=classical&strandKey=history-and-civilisation&stageKey=middle-primary&pathwayStepId=" +
        encodeURIComponent(encounter.pathway.pathwayStepId) +
        "&stepKey=from-wandering-to-settlement",
      pathwayStepId: encounter.pathway.pathwayStepId,
      accessModel: "family_included",
      entitlementKey: "family_subscription",
      unitBundleKey: "classical-y3-4-a-u1",
      cycleBundleKey: "classical-y3-4-a",
      futurePhysicalPackSupported: true,
    });
  });

  it("resolves the same canonical catalogue item through both stable external keys", () => {
    const item = MYLEARNA_MARKETPLACE_RESOURCES[0];
    expect(getMylearnaMarketplaceResourceByHandle(item.handle)).toBe(item);
    expect(getMylearnaMarketplaceResourceByExternalProductId(item.externalProductId)).toBe(item);
  });

  it("projects Encounter 2 into Marketplace with the canonical release identity", () => {
    const encounter = MYLEARNA_CLASSICAL_ENCOUNTER_TWO;
    const item = getMylearnaMarketplaceResourceByHandle(
      encounter.distribution.marketplaceHandle,
    );

    expect(item).toMatchObject({
      externalProductId: "MYL-CLASSICAL-Y34-A-U1-E02",
      handle: "classical-y3-4-a-u1-e02-rivers-and-civilisation",
      title: "Rivers and Civilisation",
      scope: "encounter",
      resourceFormat: "booklet-pdf",
      coverImageUrl: encounter.resource.pageImageUrls[0],
      pageCount: 10,
      pdfHref: "/api/classical/booklets/y3-4-a-u1-e02",
      pathwayStepId:
        "classical::history-and-civilisation::middle-primary::rivers-and-civilisation",
      accessModel: "family_included",
      entitlementKey: "family_subscription",
      unitBundleKey: "classical-y3-4-a-u1",
      cycleBundleKey: "classical-y3-4-a",
      futurePhysicalPackSupported: true,
    });
    expect(
      getMylearnaMarketplaceResourceByExternalProductId(
        "MYL-CLASSICAL-Y34-A-U1-E02",
      ),
    ).toBe(item);
  });


  it("projects Encounter 5 into Marketplace with the canonical release identity", () => {
    const encounter = MYLEARNA_CLASSICAL_ENCOUNTER_FIVE;
    const item = getMylearnaMarketplaceResourceByHandle(
      encounter.distribution.marketplaceHandle,
    );

    expect(item).toMatchObject({
      externalProductId: "MYL-CLASSICAL-Y34-A-U1-E05",
      handle: "classical-y3-4-a-u1-e05-trade-travel-and-exchange",
      title: "Trade, Travel and Exchange",
      scope: "encounter",
      resourceFormat: "booklet-pdf",
      coverImageUrl: encounter.resource.pageImageUrls[0],
      pageCount: 10,
      pdfHref: "/api/classical/booklets/y3-4-a-u1-e05",
      pathwayStepId:
        "classical::history-and-civilisation::middle-primary::trade-travel-and-exchange",
      accessModel: "family_included",
      entitlementKey: "family_subscription",
      unitBundleKey: "classical-y3-4-a-u1",
      cycleBundleKey: "classical-y3-4-a",
      futurePhysicalPackSupported: true,
    });
    expect(
      getMylearnaMarketplaceResourceByExternalProductId(
        "MYL-CLASSICAL-Y34-A-U1-E05",
      ),
    ).toBe(item);
  });



  it("projects Encounters 3 and 4 into Marketplace with canonical release identities", () => {
    const encounters = [
      MYLEARNA_CLASSICAL_ENCOUNTER_THREE,
      MYLEARNA_CLASSICAL_ENCOUNTER_FOUR,
    ] as const;
    for (const encounter of encounters) {
      const item = getMylearnaMarketplaceResourceByHandle(
        encounter.distribution.marketplaceHandle,
      );
      expect(item).toMatchObject({
        externalProductId: encounter.distribution.externalProductId,
        handle: encounter.distribution.marketplaceHandle,
        title: encounter.title,
        scope: "encounter",
        resourceFormat: "booklet-pdf",
        coverImageUrl: encounter.resource.pageImageUrls[0],
        pageCount: encounter.resource.pageImageUrls.length,
        pdfHref: encounter.resource.pdfHref,
        pathwayStepId: encounter.pathway.pathwayStepId,
        accessModel: "family_included",
        entitlementKey: "family_subscription",
        unitBundleKey: "classical-y3-4-a-u1",
        cycleBundleKey: "classical-y3-4-a",
        futurePhysicalPackSupported: true,
      });
      expect(
        getMylearnaMarketplaceResourceByExternalProductId(
          encounter.distribution.externalProductId,
        ),
      ).toBe(item);
    }
  });



  it("projects Encounters 6 and 7 into Marketplace with canonical release identities", () => {
    for (const encounter of [
      MYLEARNA_CLASSICAL_ENCOUNTER_SIX,
      MYLEARNA_CLASSICAL_ENCOUNTER_SEVEN,
    ] as const) {
      const item = getMylearnaMarketplaceResourceByHandle(
        encounter.distribution.marketplaceHandle,
      );
      expect(item).toMatchObject({
        externalProductId: encounter.distribution.externalProductId,
        handle: encounter.distribution.marketplaceHandle,
        title: encounter.title,
        scope: "encounter",
        resourceFormat: "booklet-pdf",
        coverImageUrl: encounter.resource.pageImageUrls[0],
        pageCount: 10,
        pdfHref: encounter.resource.pdfHref,
        pathwayStepId: encounter.pathway.pathwayStepId,
        accessModel: "family_included",
        entitlementKey: "family_subscription",
        unitBundleKey: "classical-y3-4-a-u1",
        cycleBundleKey: "classical-y3-4-a",
        futurePhysicalPackSupported: true,
      });
      expect(
        getMylearnaMarketplaceResourceByExternalProductId(
          encounter.distribution.externalProductId,
        ),
      ).toBe(item);
    }
  });


});
