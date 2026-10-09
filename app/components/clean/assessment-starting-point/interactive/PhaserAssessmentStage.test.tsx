// @vitest-environment jsdom

import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StartingPointPlayerModel } from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import {
  adaptAssessmentItemForStartingPointPlayer,
  scoreStartingPointPlayerAnswer,
} from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import { getStartingPointRendererQaItems } from "@/lib/clean/assessments/interactivePlayer/startingPointRendererCoverage";
import PhaserAssessmentStage, {
  shouldInitializePhaser,
} from "./PhaserAssessmentStage";

const { gameMock, destroyMock, lifecycle } = vi.hoisted(() => ({
  gameMock: vi.fn(),
  destroyMock: vi.fn(),
  lifecycle: { scene: null as { create: () => void } | null },
}));

vi.mock("phaser", () => {
  const displayObject = () => {
    const object = {
      setOrigin: () => object,
      setStrokeStyle: () => object,
      setAlpha: () => object,
      setScale: () => object,
      setRotation: () => object,
      setShadow: () => object,
      setFillStyle: () => object,
      add: () => object,
    };
    return object;
  };
  class Scene {
    cameras = { main: { setBackgroundColor: vi.fn(), fadeIn: vi.fn() } };
    add = {
      rectangle: vi.fn(displayObject),
      ellipse: vi.fn(displayObject),
      circle: vi.fn(displayObject),
      arc: vi.fn(displayObject),
      polygon: vi.fn(displayObject),
      line: vi.fn(() => ({ ...displayObject(), setLineWidth: () => displayObject() })),
      container: vi.fn(displayObject),
      text: vi.fn(displayObject),
      graphics: vi.fn(() => ({
        ...displayObject(),
        lineStyle: vi.fn(),
        strokeEllipse: vi.fn(),
        lineBetween: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        strokePath: vi.fn(),
        strokeRect: vi.fn(),
        fillStyle: vi.fn(),
        fillCircle: vi.fn(),
      })),
    };
    tweens = { add: vi.fn() };
    input = { setDraggable: vi.fn() };
  }
  gameMock.mockImplementation(function MockGame(config: { scene: new () => { create: () => void } }) {
    lifecycle.scene = new config.scene();
    return { destroy: destroyMock };
  });
  return {
    default: {
      AUTO: "AUTO",
      Game: gameMock,
      Scene,
      Scale: { FIT: "FIT", CENTER_HORIZONTALLY: "CENTER_HORIZONTALLY" },
      Geom: { Point: class Point { constructor(public x: number, public y: number) {} } },
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

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: true })),
  });
});

afterEach(() => {
  cleanup();
  gameMock.mockClear();
  destroyMock.mockClear();
  lifecycle.scene = null;
});

describe("Phaser numeric presentation stimuli", () => {
  it("keeps numeric entry without a presentation stimulus DOM-only", async () => {
    const onSubmit = vi.fn();
    const model = numericModel(null);
    render(<PhaserAssessmentStage model={model} onSubmit={onSubmit} />);

    expect(screen.getByLabelText("Number keypad")).toBeTruthy();
    expect(screen.queryByLabelText("Interactive stimulus area")).toBeNull();
    await Promise.resolve();
    expect(gameMock).not.toHaveBeenCalled();
    expect(shouldInitializePhaser(numericModel(null))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSubmit).toHaveBeenCalledWith({
      itemId: model.itemId,
      itemVersion: model.itemVersion,
      selectedOptionIds: [],
      responseValue: "3",
    });
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
      expect(screen.getByRole("status").textContent).toMatch(/preparing question/i);
      expect(screen.getByRole("button", { name: "3" })).toHaveProperty("disabled", true);
      await waitFor(() => expect(gameMock).toHaveBeenCalledTimes(1));
      act(() => lifecycle.scene?.create());
      await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
      expect(screen.getByRole("button", { name: "3" })).toHaveProperty("disabled", false);
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
    expect(screen.getByRole("status").textContent).toMatch(/preparing question/i);
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
