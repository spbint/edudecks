import { describe, expect, it } from "vitest";
import {
  checkActivityV5Answer,
  seededShuffle,
} from "@/app/components/clean/activity-player-v5/answerChecking";
import type { ActivityV5 } from "@/app/components/clean/activity-player-v5/types";

function activity(overrides: Partial<ActivityV5>): ActivityV5 {
  return {
    id: "test",
    strand: "Mathematics",
    step: "Sample",
    mode: "practise",
    prompt: "Prompt",
    instruction: "Instruction",
    interactionType: "plot_coordinates",
    visualModel: "coordinate_grid",
    objects: [],
    targets: [],
    correctState: {},
    feedback: {
      correct: "Correct",
      incorrect: "Incorrect",
    },
    ...overrides,
  };
}

describe("ActivityPlayer v5 answer checking", () => {
  it("checks plotted coordinates without depending on order", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "plot_coordinates",
        correctState: { plottedCoordinates: ["A1", "B2"] },
      }),
      { plottedCoordinates: ["B2", "A1"] },
    );

    expect(result.correct).toBe(true);
  });

  it("checks move along route by final position", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "move_along_route",
        visualModel: "route_grid",
        correctState: { finalPosition: "D3" },
      }),
      { finalPosition: "D3" },
    );

    expect(result.correct).toBe(true);
  });

  it("checks ruler answers with tolerance", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_ruler",
        visualModel: "ruler_board",
        correctState: { measuredLength: 6, tolerance: 0.5 },
      }),
      { measuredLength: 6.25 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks exact centimetre ruler answers", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_ruler",
        visualModel: "ruler_board",
        correctState: { unit: "cm", targetLength: 8, tolerance: 0 },
      }),
      { unit: "cm", measuredLength: 8 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks half-centimetre ruler answers", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_ruler",
        visualModel: "ruler_board",
        correctState: { unit: "cm", targetLength: 8.5, step: 0.5, tolerance: 0 },
      }),
      { unit: "cm", measuredLength: 8.5 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks millimetre ruler answers", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_ruler",
        visualModel: "ruler_board",
        correctState: { unit: "mm", targetLength: 85, step: 1, tolerance: 0 },
      }),
      { unit: "mm", measuredLength: 85 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks ruler unit conversion when metadata provides units", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_ruler",
        visualModel: "ruler_board",
        correctState: { unit: "cm", targetLength: 8, tolerance: 0 },
      }),
      { unit: "mm", measuredLength: 80 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks exact dynamic number-line values", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_number_line",
        visualModel: "number_line",
        correctState: { min: 0, max: 100, step: 10, targetValue: 70 },
      }),
      { placedValue: 70 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks decimal number-line values with tolerance", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_number_line",
        visualModel: "number_line",
        correctState: { min: 0, max: 1, step: 0.1, targetValue: 0.3, tolerance: 0.02 },
      }),
      { placedValue: 0.31 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks negative number-line ranges", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_number_line",
        visualModel: "number_line",
        correctState: { min: -10, max: 10, step: 1, targetValue: -4 },
      }),
      { placedValue: -4 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks exact fraction-bar answers", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_fraction_bar",
        visualModel: "fraction_bar",
        correctState: { targetNumerator: 3, targetDenominator: 4 },
      }),
      { shadedParts: 3, denominator: 4 },
    );

    expect(result.correct).toBe(true);
  });

  it("accepts equivalent fraction-bar answers when enabled", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_fraction_bar",
        visualModel: "fraction_bar",
        correctState: { targetNumerator: 1, targetDenominator: 2, equivalentAccepted: true },
      }),
      { shadedParts: 2, denominator: 4 },
    );

    expect(result.correct).toBe(true);
  });

  it("rejects equivalent fraction-bar answers when equivalence is disabled", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_fraction_bar",
        visualModel: "fraction_bar",
        correctState: { targetNumerator: 1, targetDenominator: 2, equivalentAccepted: false },
      }),
      { shadedParts: 2, denominator: 4 },
    );

    expect(result.correct).toBe(false);
  });

  it("checks decimal-equivalent fraction bars with tolerance", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_fraction_bar",
        visualModel: "fraction_bar",
        correctState: { targetNumerator: 1, targetDenominator: 2, decimalEquivalent: 0.5, tolerance: 0.001 },
      }),
      { shadedParts: 5, denominator: 10 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks mixed-number fraction-bar representations", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_fraction_bar",
        visualModel: "fraction_bar",
        correctState: { wholeCount: 1, targetNumerator: 1, targetDenominator: 2, labelMode: "mixed" },
      }),
      { wholeCount: 1, shadedParts: 1, denominator: 2 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks o'clock clock answers", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_clock",
        visualModel: "clock_face",
        correctState: { targetHour: 3, targetMinute: 0, allowedMinutes: [0, 15, 30, 45] },
      }),
      { hour: 3, minute: 0 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks half-hour clock answers", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_clock",
        visualModel: "clock_face",
        correctState: { targetHour: 6, targetMinute: 30, allowedMinutes: [0, 15, 30, 45] },
      }),
      { hour: 6, minute: 30 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks quarter-hour clock answers", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_clock",
        visualModel: "clock_face",
        correctState: { targetHour: 7, targetMinute: 15, allowedMinutes: [0, 15, 30, 45] },
      }),
      { hour: 7, minute: 15 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks 5-minute clock answers", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_clock",
        visualModel: "clock_face",
        correctState: { targetHour: 12, targetMinute: 5, allowedMinutes: Array.from({ length: 12 }, (_, index) => index * 5) },
      }),
      { hour: 12, minute: 5 },
    );

    expect(result.correct).toBe(true);
  });

  it("handles 12-hour clock wrap", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "interactive_clock",
        visualModel: "clock_face",
        correctState: { targetHour: 12, targetMinute: 0 },
      }),
      { hour: 24, minute: 0 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks exact generic money token selection", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "generic_money_model",
        visualModel: "money_board",
        correctState: { selectedTokens: [10], tokenValues: [1, 5, 10, 20, 50] },
      }),
      { selectedTokens: [10] },
    );

    expect(result.correct).toBe(true);
  });

  it("checks generic money target totals", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "generic_money_model",
        visualModel: "money_board",
        correctState: { targetTotal: 20, tokenValues: [1, 5, 10, 20, 50] },
      }),
      { moneyTotal: 20 },
    );

    expect(result.correct).toBe(true);
  });

  it("checks multiple-token generic money totals", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "generic_money_model",
        visualModel: "money_board",
        correctState: { targetTotal: 20, tokenValues: [1, 5, 10, 20, 50], allowMultipleTokens: true },
      }),
      { selectedTokens: [10, 5, 5] },
    );

    expect(result.correct).toBe(true);
  });

  it("checks generic money price comparison by selected tag", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "generic_money_model",
        visualModel: "money_board",
        correctState: {
          selectedPriceTagId: "item-expensive",
          priceTags: [
            { id: "item-cheap", label: "Book", value: 5 },
            { id: "item-expensive", label: "Game", value: 10 },
          ],
        },
      }),
      { selectedPriceTagId: "item-expensive" },
    );

    expect(result.correct).toBe(true);
  });

  it("checks decimal generic money totals with tolerance", () => {
    const result = checkActivityV5Answer(
      activity({
        interactionType: "generic_money_model",
        visualModel: "money_board",
        correctState: { targetTotal: 7.5, tolerance: 0.01 },
      }),
      { moneyTotal: 7.505 },
    );

    expect(result.correct).toBe(true);
  });

  it("keeps seeded shuffle stable", () => {
    const first = seededShuffle(["A", "B", "C", "D"], "sample-seed");
    const second = seededShuffle(["A", "B", "C", "D"], "sample-seed");

    expect(first).toEqual(second);
    expect(first.sort()).toEqual(["A", "B", "C", "D"]);
  });
});
