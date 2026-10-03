import { describe, expect, it } from "vitest";
import { getNumberPlaceValueOperationsAssessmentItemById } from "@/lib/clean/assessments/numberPlaceValueOperationsAssessmentItems";
import { getNumberMultiplicationDivisionFluencyAssessmentItemById } from "@/lib/clean/assessments/numberMultiplicationDivisionFluencyAssessmentItems";

describe("P0 audited reuse candidates", () => {
  it("keeps the Number and place value P6 pair on distinct source constructs", () => {
    const renaming = getNumberPlaceValueOperationsAssessmentItemById(
      "place-value-ops-flexible-renaming-003",
    );
    const rounding = getNumberPlaceValueOperationsAssessmentItemById(
      "place-value-ops-rounding-gap-006",
    );

    expect(renaming).toMatchObject({
      progressionStepKey: "read-write-and-partition-whole-numbers",
      answerType: "multi_select",
      format: "flexible_renaming",
    });
    expect(renaming?.correctOptionIds).toHaveLength(3);

    expect(rounding).toMatchObject({
      progressionStepKey: "compare-order-and-round-whole-numbers",
      answerType: "fill_gap",
      format: "whole_number_rounding",
      gapAnswer: "3500",
    });
  });

  it("uses P6 multiplicative context/fact evidence rather than the P7 inverse-operation construct", () => {
    const multiplication = getNumberMultiplicationDivisionFluencyAssessmentItemById(
      "multiplication-division-fluency-context-problem-011",
    );
    const sharing = getNumberMultiplicationDivisionFluencyAssessmentItemById(
      "multiplication-division-fluency-sharing-004",
    );
    const inverse = getNumberMultiplicationDivisionFluencyAssessmentItemById(
      "multiplication-division-fluency-inverse-working-009",
    );

    expect(multiplication).toMatchObject({
      answerType: "numeric",
      format: "multiplicative_context_problem",
      expectedAnswer: "72",
    });
    expect(sharing).toMatchObject({
      answerType: "numeric",
      format: "division_sharing",
      expectedAnswer: "4",
    });

    // This remains useful content, but the source progression places explicit
    // multiplication/division inverse-operation reasoning above the chosen P6 anchor.
    expect(inverse?.progressionStepKey).toBe("use-fact-families-and-inverse-relationships");
  });
});
