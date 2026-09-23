import { describe, expect, it } from "vitest";
import {
  CLASSICAL_CURRICULUM_REGISTRY,
  MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
  MYLEARNA_CLASSICAL_ENCOUNTER_TWO,
  getClassicalEncounterByCurriculumCode,
  getClassicalEncounterByMarketplaceHandle,
  getClassicalEncounterByPathwayIdentity,
  getClassicalEncounterByPathwayStepId,
  getLiveClassicalEncounterByBookletKey,
  validateClassicalCurriculumRegistry,
  type ClassicalEncounterDefinition,
} from "@/lib/clean/curriculum/classicalCurriculumRegistry";

const EXPECTED_PAGES = [
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
] as const;

describe("MyLearna Classical curriculum registry", () => {
  it("contains Encounter 1 exactly once with its stable identity", () => {
    expect(CLASSICAL_CURRICULUM_REGISTRY).toHaveLength(2);
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_ONE).toMatchObject({
      curriculumKey: "mylearna-classical",
      curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E01",
      encounterKey: "years-3-4-cycle-a-unit-1-encounter-1",
      encounterNumber: 1,
      title: "From Wandering to Settlement",
      releaseState: "live",
      hierarchy: {
        bandKey: "years-3-4",
        cycleKey: "a",
        unitKey: "first-civilisations",
      },
      pathway: {
        subjectKey: "classical",
        strandKey: "history-and-civilisation",
        stageKey: "middle-primary",
        stepKey: "from-wandering-to-settlement",
        pathwayStepId:
          "classical::history-and-civilisation::middle-primary::from-wandering-to-settlement",
      },
    });
  });

  it("releases Encounter 2 with approved identity and assets", () => {
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_TWO).toMatchObject({
      curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E02",
      encounterKey: "years-3-4-cycle-a-unit-1-encounter-2",
      encounterNumber: 2,
      title: "Rivers and Civilisation",
      releaseState: "live",
      pathway: {
        subjectKey: "classical",
        strandKey: "history-and-civilisation",
        stageKey: "middle-primary",
        stepKey: "rivers-and-civilisation",
        pathwayStepId:
          "classical::history-and-civilisation::middle-primary::rivers-and-civilisation",
      },
      resource: {
        bookletKey: "y3-4-a-u1-e02",
        pdfHref: "/api/classical/booklets/y3-4-a-u1-e02",
        fileName:
          "MyLearna-Classical-Y3-4-Cycle-A-Encounter-2-Rivers-and-Civilisation.pdf",
      },
      distribution: {
        externalProductId: "MYL-CLASSICAL-Y34-A-U1-E02",
        marketplaceHandle: "classical-y3-4-a-u1-e02-rivers-and-civilisation",
        encounterBundleKey: "classical-y3-4-a-u1-e02",
        unitBundleKey: "classical-y3-4-a-u1",
        cycleBundleKey: "classical-y3-4-a",
      },
    });
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_TWO.resource.pageImageUrls).toHaveLength(10);
    expect(
      MYLEARNA_CLASSICAL_ENCOUNTER_TWO.resource.pageImageUrls.every((url) =>
        url.startsWith("https://cdn.shopify.com/"),
      ),
    ).toBe(true);
    expect(getClassicalEncounterByCurriculumCode("MYL-CLASSICAL-Y34-A-U1-E02")).toBe(
      MYLEARNA_CLASSICAL_ENCOUNTER_TWO,
    );
    expect(
      getClassicalEncounterByMarketplaceHandle(
        "classical-y3-4-a-u1-e02-rivers-and-civilisation",
      ),
    ).toBe(MYLEARNA_CLASSICAL_ENCOUNTER_TWO);
    expect(getLiveClassicalEncounterByBookletKey("y3-4-a-u1-e02")).toBe(
      MYLEARNA_CLASSICAL_ENCOUNTER_TWO,
    );
  });

  it("keeps all externally stable registry identities unique", () => {
    const uniqueCount = (values: readonly string[]) => new Set(values).size;
    expect(uniqueCount(CLASSICAL_CURRICULUM_REGISTRY.map((item) => item.curriculumCode))).toBe(
      CLASSICAL_CURRICULUM_REGISTRY.length,
    );
    expect(uniqueCount(CLASSICAL_CURRICULUM_REGISTRY.map((item) => item.encounterKey))).toBe(
      CLASSICAL_CURRICULUM_REGISTRY.length,
    );
    expect(uniqueCount(CLASSICAL_CURRICULUM_REGISTRY.map((item) => item.pathway.pathwayStepId))).toBe(
      CLASSICAL_CURRICULUM_REGISTRY.length,
    );
    expect(
      uniqueCount(
        CLASSICAL_CURRICULUM_REGISTRY.map((item) =>
          item.distribution.externalProductId.toLowerCase(),
        ),
      ),
    ).toBe(CLASSICAL_CURRICULUM_REGISTRY.length);
    const liveEncounters = CLASSICAL_CURRICULUM_REGISTRY.filter(
      (item) => item.releaseState === "live",
    );
    expect(
      uniqueCount(liveEncounters.map((item) => item.distribution.marketplaceHandle)),
    ).toBe(liveEncounters.length);
    expect(
      uniqueCount(
        CLASSICAL_CURRICULUM_REGISTRY.map(
          (item) => item.distribution.encounterBundleKey,
        ),
      ),
    ).toBe(CLASSICAL_CURRICULUM_REGISTRY.length);
  });

  it("preserves all booklet and distribution identities", () => {
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource).toMatchObject({
      resourceType: "booklet-pdf",
      bookletKey: "y3-4-a-u1-e01",
      pdfHref: "/api/classical/booklets/y3-4-a-u1-e01",
      fileName:
        "MyLearna-Classical-Y3-4-Cycle-A-Encounter-1-From-Wandering-to-Settlement.pdf",
      includesAnswerGuidance: true,
    });
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource.pageImageUrls).toEqual(EXPECTED_PAGES);
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_ONE.distribution).toMatchObject({
      externalProductId: "MYL-CLASSICAL-Y34-A-U1-E01",
      marketplaceHandle: "classical-y3-4-a-u1-e01-from-wandering-to-settlement",
      accessModel: "family_included",
      entitlementKey: "family_subscription",
      encounterBundleKey: "classical-y3-4-a-u1-e01",
      unitBundleKey: "classical-y3-4-a-u1",
      cycleBundleKey: "classical-y3-4-a",
      futurePhysicalPackSupported: true,
    });
  });

  it("preserves the approved academic definition", () => {
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_ONE.academic.bigQuestion).toBe(
      "Why would people choose to live in one place?",
    );
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_ONE.academic.learningIntention).toBe(
      "I am learning how farming helped some communities build more permanent settlements.",
    );
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_ONE.academic.successCriteria).toHaveLength(4);
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_ONE.academic.reportLanguage).toContain(
      "changes in food production",
    );
  });

  it("supports every downstream stable lookup without a database round trip", () => {
    const expected = MYLEARNA_CLASSICAL_ENCOUNTER_ONE;
    expect(getClassicalEncounterByCurriculumCode(expected.curriculumCode)).toBe(expected);
    expect(getClassicalEncounterByPathwayStepId(expected.pathway.pathwayStepId)).toBe(expected);
    expect(getClassicalEncounterByPathwayIdentity(expected.pathway)).toBe(expected);
    expect(getClassicalEncounterByMarketplaceHandle(expected.distribution.marketplaceHandle)).toBe(expected);
    expect(getLiveClassicalEncounterByBookletKey(expected.resource.bookletKey)).toBe(expected);
    expect(getLiveClassicalEncounterByBookletKey("unknown")).toBeNull();
  });

  it("rejects duplicate stable identities and pathway identity drift", () => {
    const duplicate = {
      ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
      encounterKey: "another-encounter",
    } as ClassicalEncounterDefinition;
    expect(() =>
      validateClassicalCurriculumRegistry([
        MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
        duplicate,
      ]),
    ).toThrow(/Duplicate Classical curriculum code/);

    const drifted = {
      ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
      pathway: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.pathway,
        stepKey: "changed-step-key",
      },
    } as ClassicalEncounterDefinition;
    expect(() => validateClassicalCurriculumRegistry([drifted])).toThrow(
      /pathwayStepId does not match its component identity/,
    );
  });

  it("rejects case-variant duplicate Marketplace external product IDs", () => {
    const duplicateExternalProductId = {
      ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
      curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E99",
      encounterKey: "years-3-4-cycle-a-unit-1-encounter-99",
      encounterNumber: 99,
      pathway: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.pathway,
        stepKey: "duplicate-external-product-id",
        pathwayStepId:
          "classical::history-and-civilisation::middle-primary::duplicate-external-product-id",
      },
      resource: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource,
        bookletKey: "y3-4-a-u1-e99",
      },
      distribution: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.distribution,
        externalProductId: "myl-classical-y34-a-u1-e01",
        marketplaceHandle: "classical-y3-4-a-u1-e99-duplicate-product-id",
      },
    } as ClassicalEncounterDefinition;

    expect(() =>
      validateClassicalCurriculumRegistry([
        MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
        duplicateExternalProductId,
      ]),
    ).toThrow(/Duplicate Classical Marketplace external product ID/);
  });

  it("rejects case-variant duplicate catalogue encounter bundle keys", () => {
    const duplicateBundleKey = {
      ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
      curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E98",
      encounterKey: "years-3-4-cycle-a-unit-1-encounter-98",
      encounterNumber: 98,
      pathway: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.pathway,
        stepKey: "duplicate-bundle-key",
        pathwayStepId:
          "classical::history-and-civilisation::middle-primary::duplicate-bundle-key",
      },
      resource: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource,
        bookletKey: "y3-4-a-u1-e98",
      },
      distribution: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.distribution,
        externalProductId: "MYL-CLASSICAL-Y34-A-U1-E98",
        marketplaceHandle: "classical-y3-4-a-u1-e98-duplicate-bundle-key",
        encounterBundleKey: "CLASSICAL-Y3-4-A-U1-E01",
      },
    } as ClassicalEncounterDefinition;

    expect(() =>
      validateClassicalCurriculumRegistry([
        MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
        duplicateBundleKey,
      ]),
    ).toThrow(/Duplicate Classical catalogue encounter bundle key/);
  });
});
