import { describe, expect, it } from "vitest";
import { getNumberOperationsPlacementItemById } from "./numberOperationsItemRegistry";

const STRATEGY_SENSITIVE_ITEMS = [
  {
    id: "myl-anchor-mul-p06-c-v1",
    promptIncludes: "uses that fact",
  },
  {
    id: "myl-boundary-add-p07-a-v1",
    promptIncludes: "uses compensation",
  },
  {
    id: "myl-boundary-add-p07-b-v1",
    promptIncludes: "reorders the addends",
  },
  {
    id: "myl-boundary-add-p08-a-v1",
    promptIncludes: "uses place value",
  },
  {
    id: "myl-boundary-mul-p07-a-v1",
    promptIncludes: "division equation",
  },
  {
    id: "myl-boundary-mul-p07-b-v1",
    promptIncludes: "distributive property",
  },
  {
    id: "myl-boundary-mul-p07-c-v1",
    promptIncludes: "doubling and halving",
  },
] as const;

describe("Number & Operations strategy-sensitive construct audit", () => {
  it("requires observable strategy evidence instead of inferring a named strategy from a final answer", () => {
    for (const expected of STRATEGY_SENSITIVE_ITEMS) {
      const entry = getNumberOperationsPlacementItemById(expected.id);
      expect(entry, expected.id).not.toBeNull();
      if (!entry) continue;

      expect(entry.item.response.type, expected.id).toBe("single-choice");
      expect(entry.item.prompt.toLowerCase(), expected.id).toContain(
        expected.promptIncludes.toLowerCase(),
      );
      expect(entry.item.response.correctOptionIds, expected.id).toHaveLength(1);
    }
  });

  it("keeps these source-sensitive probes in their intended progression levels", () => {
    const expectedCodes: Record<string, string> = {
      "myl-anchor-mul-p06-c-v1": "MYL-MATH-PROG-NSA-MUL-P06",
      "myl-boundary-add-p07-a-v1": "MYL-MATH-PROG-NSA-ADD-P07",
      "myl-boundary-add-p07-b-v1": "MYL-MATH-PROG-NSA-ADD-P07",
      "myl-boundary-add-p08-a-v1": "MYL-MATH-PROG-NSA-ADD-P08",
      "myl-boundary-mul-p07-a-v1": "MYL-MATH-PROG-NSA-MUL-P07",
      "myl-boundary-mul-p07-b-v1": "MYL-MATH-PROG-NSA-MUL-P07",
      "myl-boundary-mul-p07-c-v1": "MYL-MATH-PROG-NSA-MUL-P07",
    };

    for (const [itemId, code] of Object.entries(expectedCodes)) {
      const entry = getNumberOperationsPlacementItemById(itemId);
      expect(entry?.item.curriculum?.code, itemId).toBe(code);
    }
  });
});
