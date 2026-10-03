import { describe, expect, it } from "vitest";
import {
  ADDITIVE_P3_ANCHOR_ITEMS,
  ADDITIVE_P6_ANCHOR_ITEMS,
  ADDITIVE_P9_ANCHOR_ITEMS,
  COUNTING_P2_ANCHOR_ITEMS,
  COUNTING_P5_ANCHOR_ITEMS,
  COUNTING_P7_ANCHOR_ITEMS,
  MULTIPLICATIVE_P3_ANCHOR_ITEMS,
  MULTIPLICATIVE_P6_ANCHOR_ITEMS,
  MULTIPLICATIVE_P9_ANCHOR_ITEMS,
  MONEY_P2_ANCHOR_ITEMS,
  MONEY_P5_ANCHOR_ITEMS,
  MONEY_P8_ANCHOR_ITEMS,
  NPV_P3_ANCHOR_ITEMS,
  NPV_P6_ANCHOR_ITEMS,
  NPV_P9_ANCHOR_ITEMS,
  NUMBER_OPERATIONS_BOUNDARY_CLUSTERS,
  NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS,
  NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS,
  NUMBER_OPERATIONS_SEARCH_CLUSTERS,
} from "./numberOperationsP0Items";

describe("Number & Operations executable P0 anchor items", () => {
  it("keeps the implemented clusters explicit and draft-only", () => {
    expect(Object.keys(NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS)).toEqual([
      "number-place-value-p3",
      "number-place-value-p6",
      "number-place-value-p9",
      "counting-processes-p2",
      "counting-processes-p5",
      "counting-processes-p7",
      "additive-strategies-p3",
      "additive-strategies-p6",
      "additive-strategies-p9",
      "multiplicative-strategies-p3",
      "multiplicative-strategies-p6",
      "multiplicative-strategies-p9",
      "understanding-money-p2",
      "understanding-money-p5",
      "understanding-money-p8",
    ]);

    const all = Object.values(NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS).flat();
    expect(all).toHaveLength(30);
    expect(all.every((item) => item.status === "draft")).toBe(true);
  });

  it("provides direct boundary-search pools across the first Number & Operations slice", () => {
    expect(Object.keys(NUMBER_OPERATIONS_BOUNDARY_CLUSTERS)).toEqual([
      "number-place-value-p4",
      "number-place-value-p5",
      "number-place-value-p7",
      "number-place-value-p8",
      "counting-processes-p6",
      "additive-strategies-p7",
      "additive-strategies-p8",
      "multiplicative-strategies-p7",
      "multiplicative-strategies-p8",
      "understanding-money-p6",
      "understanding-money-p7",
    ]);
    expect(
      Object.values(NUMBER_OPERATIONS_BOUNDARY_CLUSTERS).flat(),
    ).toHaveLength(33);
    expect(
      Object.values(NUMBER_OPERATIONS_BOUNDARY_CLUSTERS)
        .flat()
        .every((item) => item.status === "draft"),
    ).toBe(true);
  });

  it("provides direct search clusters for the currently reachable non-hybrid endpoint searches", () => {
    expect(Object.keys(NUMBER_OPERATIONS_SEARCH_CLUSTERS)).toEqual([
      "number-place-value-p1",
      "number-place-value-p2",
      "number-place-value-p10",
      "counting-processes-p8",
      "additive-strategies-p10",
      "multiplicative-strategies-p10",
      "understanding-money-p9",
      "understanding-money-p10",
    ]);
    expect(
      Object.values(NUMBER_OPERATIONS_SEARCH_CLUSTERS).flat(),
    ).toHaveLength(16);
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

  it("implements hybrid lower clusters for routing without upgrading their evidence ceiling", () => {
    const allHybrid = [
      ...COUNTING_P2_ANCHOR_ITEMS,
      ...ADDITIVE_P3_ANCHOR_ITEMS,
      ...MULTIPLICATIVE_P3_ANCHOR_ITEMS,
    ];
    expect(allHybrid).toHaveLength(6);
    expect(
      allHybrid.every((item) => item.analytics?.tags?.includes("hybrid-routing-only")),
    ).toBe(true);
  });

  it("implements the direct Counting P7 upper anchor cluster", () => {
    expect(COUNTING_P7_ANCHOR_ITEMS).toHaveLength(2);
    expect(COUNTING_P7_ANCHOR_ITEMS[0].response.correctValue).toBe("28");
    expect(COUNTING_P7_ANCHOR_ITEMS[1].response.correctValue).toBe("47");
  });

  it("implements Money P2 with deterministic denomination tokens while keeping asset review explicit", () => {
    expect(MONEY_P2_ANCHOR_ITEMS).toHaveLength(2);
    expect(MONEY_P2_ANCHOR_ITEMS[0].stimulus.type).toBe("currency-tokens");
    expect(MONEY_P2_ANCHOR_ITEMS[1].stimulus.type).toBe("currency-tokens");
    expect(MONEY_P2_ANCHOR_ITEMS[1].response.correctValue).toBe("3");
    expect(MONEY_P2_ANCHOR_ITEMS[0].analytics?.tags).toContain("currency-token-review");
  });

  it("implements Money P5 and P8 without waiting for denomination artwork", () => {
    expect(MONEY_P5_ANCHOR_ITEMS).toHaveLength(2);
    expect(MONEY_P8_ANCHOR_ITEMS).toHaveLength(2);
    expect(MONEY_P5_ANCHOR_ITEMS[0].response.correctOptionIds).toEqual(["a"]);
    expect(MONEY_P5_ANCHOR_ITEMS[1].response.correctValue).toBe("5.90");
    expect(MONEY_P8_ANCHOR_ITEMS[0].response.correctValue).toBe("72");
    expect(MONEY_P8_ANCHOR_ITEMS[1].response.correctValue).toBe("30");
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
