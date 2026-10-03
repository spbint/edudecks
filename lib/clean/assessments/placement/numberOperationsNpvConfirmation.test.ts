import { describe, expect, it } from "vitest";
import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { evaluateNpvAdjacentBandConfirmation } from "./numberOperationsNpvConfirmation";

function response(id: string, correct: boolean): MyLearnaAssessmentResponse {
  return {
    itemId: id,
    selectedOptionIds: [],
    correct,
    skillId: id + "-skill",
    misconceptionTags: correct ? [] : ["gap"],
  };
}

describe("NPV adjacent-band confirmation", () => {
  it("reports lower supported and upper not yet when fresh evidence separates the band", () => {
    const result = evaluateNpvAdjacentBandConfirmation({
      lowerP: 4,
      upperP: 5,
      lowerResponses: [response("l1", true), response("l2", true)],
      upperResponses: [response("u1", true), response("u2", false)],
    });

    expect(result).toMatchObject({
      outcome: "lower-supported-upper-not-yet",
      lowerCorrect: 2,
      upperCorrect: 1,
      confidence: "confirmation-supported",
    });
    expect(result.claim).toMatch(/supports P4 indicators/i);
    expect(result.claim).toMatch(/P5 is not yet consistently demonstrated/i);
  });

  it("reports evidence reaches the upper side when both fresh levels are supported", () => {
    const result = evaluateNpvAdjacentBandConfirmation({
      lowerP: 8,
      upperP: 9,
      lowerResponses: [response("l1", true), response("l2", true)],
      upperResponses: [response("u1", true), response("u2", true)],
    });

    expect(result).toMatchObject({
      outcome: "both-supported",
      confidence: "confirmation-supported",
    });
    expect(result.interpretation).toMatch(/evidence reaches P9/i);
    expect(result.nextAction).toMatch(/P10/i);
  });

  it("withholds stronger placement when fresh lower evidence is inconsistent", () => {
    const result = evaluateNpvAdjacentBandConfirmation({
      lowerP: 5,
      upperP: 6,
      lowerResponses: [response("l1", true), response("l2", false)],
      upperResponses: [response("u1", false), response("u2", false)],
    });

    expect(result).toMatchObject({
      outcome: "evidence-inconsistent",
      confidence: "routing-only",
    });
    expect(result.claim).toMatch(/not yet consistent enough/i);
  });

  it("keeps P1 confirmation behind the observation ceiling", () => {
    const result = evaluateNpvAdjacentBandConfirmation({
      lowerP: 1,
      upperP: 2,
      lowerResponses: [response("l1", true), response("l2", true)],
      upperResponses: [response("u1", true), response("u2", false)],
    });

    expect(result.confidence).toBe("routing-only");
  });

  it("requires an adjacent band and two fresh items per side", () => {
    expect(() =>
      evaluateNpvAdjacentBandConfirmation({
        lowerP: 4,
        upperP: 6,
        lowerResponses: [response("l1", true), response("l2", true)],
        upperResponses: [response("u1", true), response("u2", true)],
      }),
    ).toThrow(/adjacent progression band/i);

    expect(() =>
      evaluateNpvAdjacentBandConfirmation({
        lowerP: 4,
        upperP: 5,
        lowerResponses: [response("l1", true)],
        upperResponses: [response("u1", true), response("u2", true)],
      }),
    ).toThrow(/two fresh items/i);
  });
});