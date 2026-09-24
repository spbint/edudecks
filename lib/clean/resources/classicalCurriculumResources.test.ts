import { describe, expect, it } from "vitest";
import { MYLEARNA_CLASSICAL_ENCOUNTER_ONE, MYLEARNA_CLASSICAL_ENCOUNTER_TWO, MYLEARNA_CLASSICAL_ENCOUNTER_THREE, MYLEARNA_CLASSICAL_ENCOUNTER_FOUR, MYLEARNA_CLASSICAL_ENCOUNTER_FIVE } from "@/lib/clean/curriculum/classicalCurriculumRegistry";
import {
  MYLEARNA_CLASSICAL_ENCOUNTER_1_ID,
  MYLEARNA_CLASSICAL_RESOURCES,
  getClassicalCurriculumResourceForPathwayStep,
} from "@/lib/clean/resources/classicalCurriculumResources";

describe("MyLearna Classical resources", () => {
  it("maps Encounter 1 to the approved branded booklet", () => {
    expect(MYLEARNA_CLASSICAL_RESOURCES).toHaveLength(5);

    const resource = getClassicalCurriculumResourceForPathwayStep({
      pathwayStepId: MYLEARNA_CLASSICAL_ENCOUNTER_1_ID,
      subjectKey: "classical",
      strandKey: "history-and-civilisation",
      stageKey: "middle-primary",
      stepKey: "from-wandering-to-settlement",
    });

    expect(resource).toMatchObject({
      pathwayStepId: MYLEARNA_CLASSICAL_ENCOUNTER_1_ID,
      resourceType: "booklet-pdf",
      curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E01",
      href: "/api/classical/booklets/y3-4-a-u1-e01",
      includesAnswerSheet: true,
      encounterNumber: 1,
    });
    expect(resource?.pageImageUrls).toHaveLength(10);
    expect(resource?.pageImageUrls.every((url) => url.startsWith("https://cdn.shopify.com/"))).toBe(true);
    expect(resource?.pageImageUrls).toEqual(
      MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource.pageImageUrls,
    );
    expect(resource?.previewImageUrl).toBe(
      MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource.pageImageUrls[0],
    );
    expect(resource?.title).toBe(MYLEARNA_CLASSICAL_ENCOUNTER_ONE.title);
    expect(resource?.bigQuestion).toBe(
      MYLEARNA_CLASSICAL_ENCOUNTER_ONE.academic.bigQuestion,
    );
  });

  it("maps Encounter 2 to the released Rivers and Civilisation booklet", () => {
    const encounter = MYLEARNA_CLASSICAL_ENCOUNTER_TWO;
    const resource = getClassicalCurriculumResourceForPathwayStep({
      pathwayStepId: encounter.pathway.pathwayStepId,
      subjectKey: encounter.pathway.subjectKey,
      strandKey: encounter.pathway.strandKey,
      stageKey: encounter.pathway.stageKey,
      stepKey: encounter.pathway.stepKey,
    });

    expect(resource).toMatchObject({
      pathwayStepId: encounter.pathway.pathwayStepId,
      resourceType: "booklet-pdf",
      curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E02",
      href: "/api/classical/booklets/y3-4-a-u1-e02",
      includesAnswerSheet: true,
      encounterNumber: 2,
      title: "Rivers and Civilisation",
    });
    expect(resource?.pageImageUrls).toEqual(encounter.resource.pageImageUrls);
    expect(resource?.pageImageUrls).toHaveLength(10);
    expect(resource?.previewImageUrl).toBe(encounter.resource.pageImageUrls[0]);
  });


  it("maps Encounter 5 to the released Trade, Travel and Exchange booklet", () => {
    const encounter = MYLEARNA_CLASSICAL_ENCOUNTER_FIVE;
    const resource = getClassicalCurriculumResourceForPathwayStep({
      pathwayStepId: encounter.pathway.pathwayStepId,
      subjectKey: encounter.pathway.subjectKey,
      strandKey: encounter.pathway.strandKey,
      stageKey: encounter.pathway.stageKey,
      stepKey: encounter.pathway.stepKey,
    });

    expect(resource).toMatchObject({
      pathwayStepId: encounter.pathway.pathwayStepId,
      resourceType: "booklet-pdf",
      curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E05",
      href: "/api/classical/booklets/y3-4-a-u1-e05",
      includesAnswerSheet: true,
      encounterNumber: 5,
      title: "Trade, Travel and Exchange",
    });
    expect(resource?.pageImageUrls).toEqual(encounter.resource.pageImageUrls);
    expect(resource?.pageImageUrls).toHaveLength(10);
    expect(resource?.previewImageUrl).toBe(encounter.resource.pageImageUrls[0]);
  });



  it("maps Encounters 3 and 4 to their released approved booklets", () => {
    const cases = [
      [MYLEARNA_CLASSICAL_ENCOUNTER_THREE, "MYL-CLASSICAL-Y34-A-U1-E03", 15],
      [MYLEARNA_CLASSICAL_ENCOUNTER_FOUR, "MYL-CLASSICAL-Y34-A-U1-E04", 16],
    ] as const;

    for (const [encounter, curriculumCode, pageCount] of cases) {
      const resource = getClassicalCurriculumResourceForPathwayStep({
        pathwayStepId: encounter.pathway.pathwayStepId,
        subjectKey: encounter.pathway.subjectKey,
        strandKey: encounter.pathway.strandKey,
        stageKey: encounter.pathway.stageKey,
        stepKey: encounter.pathway.stepKey,
      });
      expect(resource).toMatchObject({
        pathwayStepId: encounter.pathway.pathwayStepId,
        resourceType: "booklet-pdf",
        curriculumCode,
        href: encounter.resource.pdfHref,
        includesAnswerSheet: true,
        encounterNumber: encounter.encounterNumber,
        title: encounter.title,
      });
      expect(resource?.pageImageUrls).toEqual(encounter.resource.pageImageUrls);
      expect(resource?.pageImageUrls).toHaveLength(pageCount);
      expect(resource?.previewImageUrl).toBe(encounter.resource.pageImageUrls[0]);
    }
  });


});
