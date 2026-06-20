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

  it("keeps seeded shuffle stable", () => {
    const first = seededShuffle(["A", "B", "C", "D"], "sample-seed");
    const second = seededShuffle(["A", "B", "C", "D"], "sample-seed");

    expect(first).toEqual(second);
    expect(first.sort()).toEqual(["A", "B", "C", "D"]);
  });
});
