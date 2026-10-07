// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StartingPointPlayerModel } from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import {
  adaptAssessmentItemForStartingPointPlayer,
  scoreStartingPointPlayerAnswer,
} from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import { getStartingPointRendererQaItems } from "@/lib/clean/assessments/interactivePlayer/startingPointRendererCoverage";
import PhaserAssessmentStage, {
  shouldInitializePhaser,
} from "./PhaserAssessmentStage";

const { gameMock, destroyMock } = vi.hoisted(() => ({
  gameMock: vi.fn(),
  destroyMock: vi.fn(),
}));

vi.mock("phaser", () => {
  class Scene {}
  gameMock.mockImplementation(function MockGame() {
    return { destroy: destroyMock };
  });
  return {
    default: {
      AUTO: "AUTO",
      Game: gameMock,
      Scene,
      Scale: { FIT: "FIT", CENTER_HORIZONTALLY: "CENTER_HORIZONTALLY" },
    },
  };
});

const numericModel = (
  presentationStimulus: StartingPointPlayerModel["presentationStimulus"],
): StartingPointPlayerModel => ({
  kind: "numeric-entry",
  itemId: "numeric-presentation-test",
  itemVersion: 1,
  prompt: "How many?",
  options: [],
  stimulus: { type: "none", data: {} },
  allowsMultiple: false,
  requiresPracticalAlternative: false,
  presentationStimulus,
  readAloud: "listen-essential",
});

const numericPresentationCases: Array<[
  string,
  NonNullable<StartingPointPlayerModel["presentationStimulus"]>,
]> = [
  ["counter-groups", { type: "counter-groups", groups: [3, 2], action: "combine" }],
  ["closed-groups", { type: "closed-groups", groups: [5, 3], objectLabel: "counters" }],
  ["currency-repeat", { type: "currency-repeat", count: 4, denomination: "50c" }],
];

afterEach(() => {
  cleanup();
  gameMock.mockClear();
  destroyMock.mockClear();
});

describe("Phaser numeric presentation stimuli", () => {
  it("keeps numeric entry without a presentation stimulus DOM-only", async () => {
    render(<PhaserAssessmentStage model={numericModel(null)} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Number keypad")).toBeTruthy();
    expect(screen.queryByLabelText("Interactive stimulus area")).toBeNull();
    await Promise.resolve();
    expect(gameMock).not.toHaveBeenCalled();
    expect(shouldInitializePhaser(numericModel(null))).toBe(false);
  });

  it.each(numericPresentationCases)(
    "initializes Phaser for numeric-entry %s stimuli while retaining one keypad",
    async (_type, presentationStimulus) => {
      const onSubmit = vi.fn();
      const model = numericModel(presentationStimulus);
      render(<PhaserAssessmentStage model={model} onSubmit={onSubmit} />);

      expect(shouldInitializePhaser(model)).toBe(true);
      expect(screen.getByLabelText("Interactive stimulus area")).toBeTruthy();
      expect(screen.getAllByLabelText("Number keypad")).toHaveLength(1);
      expect(screen.queryByRole("textbox")).toBeNull();
      await waitFor(() => expect(gameMock).toHaveBeenCalledTimes(1));

      fireEvent.click(screen.getByRole("button", { name: "3" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(onSubmit).toHaveBeenCalledWith({
        itemId: model.itemId,
        itemVersion: model.itemVersion,
        selectedOptionIds: [],
        responseValue: "3",
      });
    },
  );

  it("does not change multiple-choice presentation-stimulus initialization", async () => {
    const model: StartingPointPlayerModel = {
      ...numericModel({ type: "counter-groups", groups: [5] }),
      kind: "multiple-choice",
      options: [
        { id: "a", label: "4" },
        { id: "b", label: "5" },
      ],
    };
    render(<PhaserAssessmentStage model={model} onSubmit={vi.fn()} />);

    expect(shouldInitializePhaser(model)).toBe(true);
    expect(screen.getByLabelText("Interactive answer area")).toBeTruthy();
    expect(screen.queryByLabelText("Number keypad")).toBeNull();
    await waitFor(() => expect(gameMock).toHaveBeenCalledTimes(1));
  });

  it("covers every active numeric-entry presentation stimulus through the Phaser path", () => {
    const affected = getStartingPointRendererQaItems()
      .map(({ item }) => ({ item, model: adaptAssessmentItemForStartingPointPlayer(item) }))
      .filter(({ model }) => model.kind === "numeric-entry" && model.presentationStimulus !== null);

    expect(affected.map(({ item }) => item.id)).toEqual([
      "myl-recheck-add-p01-b-v1",
      "myl-search-add-p01-b-v1",
      "myl-recheck-add-p02-a-v1",
      "myl-recheck-add-p02-b-v1",
      "myl-search-add-p02-a-v1",
      "myl-search-add-p02-b-v1",
      "myl-recheck-add-p03-a-v1",
      "myl-recheck-add-p03-b-v1",
      "myl-anchor-add-p03-a-v1",
      "myl-anchor-add-p03-b-v1",
      "myl-recheck-mul-p01-a-v1",
      "myl-recheck-mul-p01-b-v1",
      "myl-search-mul-p01-a-v1",
      "myl-search-mul-p01-b-v1",
      "myl-recheck-mul-p02-a-v1",
      "myl-recheck-mul-p02-b-v1",
      "myl-search-mul-p02-a-v1",
      "myl-search-mul-p02-b-v1",
      "myl-recheck-mul-p03-a-v1",
      "myl-recheck-mul-p03-b-v1",
      "myl-anchor-mul-p03-a-v1",
      "myl-anchor-mul-p03-b-v1",
      "myl-recheck-mon-p03-a-v1",
      "myl-recheck-mon-p03-b-v1",
      "myl-boundary-mon-p03-a-v1",
      "myl-boundary-mon-p03-b-v1",
      "myl-boundary-mon-p03-c-v1",
    ]);
    expect(affected).toHaveLength(27);
    expect(affected.every(({ model }) => shouldInitializePhaser(model))).toBe(true);
    expect(
      affected.reduce<Record<string, number>>((counts, { model }) => {
        const type = model.presentationStimulus?.type ?? "missing";
        counts[type] = (counts[type] ?? 0) + 1;
        return counts;
      }, {}),
    ).toEqual({
      "counter-groups": 14,
      "closed-groups": 8,
      "currency-repeat": 5,
    });

    for (const { item, model } of affected) {
      const responseValue = String(item.response.correctValue ?? "");
      expect(
        scoreStartingPointPlayerAnswer({
          item,
          answer: {
            itemId: model.itemId,
            itemVersion: model.itemVersion,
            selectedOptionIds: [],
            responseValue,
          },
          timeSpentSeconds: 1,
        }).correct,
        item.id,
      ).toBe(true);
    }
  });
});
