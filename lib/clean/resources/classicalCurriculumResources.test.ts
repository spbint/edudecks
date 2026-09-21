import { describe, expect, it } from "vitest";
import {
  MYLEARNA_CLASSICAL_ENCOUNTER_1_ID,
  MYLEARNA_CLASSICAL_RESOURCES,
  getClassicalCurriculumResourceForPathwayStep,
} from "@/lib/clean/resources/classicalCurriculumResources";

describe("MyLearna Classical resources", () => {
  it("maps Encounter 1 to the approved branded booklet", () => {
    expect(MYLEARNA_CLASSICAL_RESOURCES).toHaveLength(1);

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
  });
});
