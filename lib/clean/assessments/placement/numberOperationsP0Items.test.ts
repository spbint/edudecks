import { describe, expect, it } from "vitest";
import {
  ADDITIVE_P6_ANCHOR_ITEMS,
  ADDITIVE_P9_ANCHOR_ITEMS,
  COUNTING_P5_ANCHOR_ITEMS,
  MULTIPLICATIVE_P6_ANCHOR_ITEMS,
  MULTIPLICATIVE_P9_ANCHOR_ITEMS,
  NPV_P3_ANCHOR_ITEMS,
  NPV_P6_ANCHOR_ITEMS,
  NPV_P9_ANCHOR_ITEMS,
  NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS,
  NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS,
} from "./numberOperationsP0Items";

describe("Number & Operations executable P0 anchor items", () => {
  it("keeps the implemented clusters explicit and draft-only", () => {
    expect(Object.keys(NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS)).toEqual([
      "number-place-value-p3",
      "number-place-value-p6",
      "number-place-value-p9",
      "counting-processes-p5",
      "additive-strategies-p6",
      "additive-strategies-p9",
      "multiplicative-strategies-p6",
      "multiplicative-strategies-p9",
    ]);

    const all = Object.values(NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS).flat();
    expect(all).toHaveLength(16);
    expect(all.every((item) => item.status === "draft")).toBe(true);
  });

  it("provides one reserve probe for every initial routing anchor", () => {
    expect(Object.keys(NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS)).toEqual([
      "number-place-value-p6",
      "counting-processes-p5",
      "additive-strategies-p6",
      "multiplicative-strategies-p6",
      "understanding-money-p5",
    ]);
    expect(
      Object.values(NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS).every(
        (item) => item.status === "draft",
      ),
    ).toBe(true);
  });

  it("preserves the Number and place value lower/mid/upper progression identities", () => {
    expect(NPV_P3_ANCHOR_ITEMS.every((item) => item.curriculum?.code === "MYL-MATH-PROG-NSA-NPV-P03")).toBe(true);
    expect(NPV_P6_ANCHOR_ITEMS.every((item) => item.curriculum?.code === "MYL-MATH-PROG-NSA-NPV-P06")).toBe(true);
    expect(NPV_P9_ANCHOR_ITEMS.every((item) => item.curriculum?.code === "MYL-MATH-PROG-NSA-NPV-P09")).toBe(true);
  });

  it("uses multi-select for the source-audited P6 flexible-renaming anchor", () => {
    const item = NPV_P6_ANCHOR_ITEMS[0];
    expect(item.response.type).toBe("multiple-choice");
    expect(item.response.correctOptionIds).toEqual([
      "four-thousands-three-hundreds",
      "three-thousands-thirteen-hundreds",
      "forty-three-hundreds",
    ]);
  });

  it("keeps Counting P5 text-first and deterministic-visual anchors", () => {
    const [sequence, collection] = COUNTING_P5_ANCHOR_ITEMS;
    expect(sequence).toMatchObject({
      prompt: "What number comes immediately before 63?",
      stimulus: { type: "none" },
      response: { type: "short-answer", correctValue: "62" },
    });
    expect(collection).toMatchObject({
      prompt: "How many counters are shown?",
      stimulus: { type: "array", data: { rows: 2, columns: 7 } },
      response: { type: "short-answer", correctValue: "14" },
    });
    expect(collection.analytics?.tags).toContain(
      "visual-counting-separate-accessible-form-required",
    );
  });

  it("implements the direct Additive and Multiplicative anchor clusters without the hybrid lower strategy anchors", () => {
    expect(ADDITIVE_P6_ANCHOR_ITEMS).toHaveLength(2);
    expect(ADDITIVE_P9_ANCHOR_ITEMS).toHaveLength(2);
    expect(MULTIPLICATIVE_P6_ANCHOR_ITEMS).toHaveLength(2);
    expect(MULTIPLICATIVE_P9_ANCHOR_ITEMS).toHaveLength(2);

    expect(ADDITIVE_P6_ANCHOR_ITEMS[1].response.correctValue).toBe("7");
    expect(ADDITIVE_P9_ANCHOR_ITEMS[0].response.correctValue).toBe("5/8");
    expect(MULTIPLICATIVE_P6_ANCHOR_ITEMS[1].response.correctValue).toBe("4");
    expect(MULTIPLICATIVE_P9_ANCHOR_ITEMS[1].response.correctValue).toBe("24");
  });
});
