import { describe, expect, it } from "vitest";
import { COUNTING_P5_ANCHOR_ITEMS } from "./numberOperationsP0Items";

describe("Counting P5 executable anchor items", () => {
  it("keeps the P5 pair explicit and draft-only", () => {
    expect(COUNTING_P5_ANCHOR_ITEMS).toHaveLength(2);
    expect(COUNTING_P5_ANCHOR_ITEMS.map((item) => item.id)).toEqual([
      "myl-anchor-cnt-p05-a-v1",
      "myl-anchor-cnt-p05-b-v1",
    ]);
    expect(COUNTING_P5_ANCHOR_ITEMS.every((item) => item.status === "draft")).toBe(true);
    expect(
      COUNTING_P5_ANCHOR_ITEMS.every(
        (item) => item.curriculum?.code === "MYL-MATH-PROG-NSA-CNT-P05",
      ),
    ).toBe(true);
  });

  it("uses a text-first sequence item and a deterministic visual collection item", () => {
    const [sequence, collection] = COUNTING_P5_ANCHOR_ITEMS;

    expect(sequence).toMatchObject({
      template: "short-answer",
      prompt: "What number comes immediately before 63?",
      stimulus: { type: "none" },
      response: { type: "short-answer", correctValue: "62" },
    });

    expect(collection).toMatchObject({
      template: "short-answer",
      prompt: "How many counters are shown?",
      stimulus: {
        type: "array",
        data: { rows: 2, columns: 7, itemShape: "circle" },
      },
      response: { type: "short-answer", correctValue: "14" },
    });
    expect(collection.analytics?.tags).toContain(
      "visual-counting-separate-accessible-form-required",
    );
  });
});
