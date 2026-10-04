import { describe, expect, it } from "vitest";
import { NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY } from "./numberOperationsItemRegistry";

function superscriptExponent(value: string) {
  const map: Record<string, string> = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
    "⁻": "-",
  };
  return Array.from(value)
    .map((char) => map[char] ?? char)
    .join("");
}

function parseOrderedNumber(label: string) {
  const clean = label.trim().replaceAll(",", "");
  const scientific = clean.match(
    /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*×\s*10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)$/,
  );
  if (scientific) {
    const coefficient = Number(scientific[1]);
    const exponent = Number(superscriptExponent(scientific[2]));
    return coefficient * 10 ** exponent;
  }

  const numeric = Number(clean);
  if (!Number.isFinite(numeric)) {
    throw new Error(`Unsupported ordering label: ${label}`);
  }
  return numeric;
}

describe("Number & Operations answer-key audit", () => {
  it("keeps every numeric ordering answer in true ascending order", () => {
    const ordering = NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.filter(
      (entry) => entry.item.response.type === "ordering",
    );

    expect(ordering).toHaveLength(8);

    for (const entry of ordering) {
      const options = new Map(
        (entry.item.response.options || []).map((option) => [
          option.id,
          option.label,
        ]),
      );
      const orderedValues = (entry.item.response.correctOptionIds || []).map(
        (id) => parseOrderedNumber(options.get(id) || ""),
      );
      const sorted = [...orderedValues].sort((a, b) => a - b);

      expect(orderedValues, entry.item.id).toEqual(sorted);
    }
  });

  it("locks higher-risk arithmetic, fraction, money and scientific-notation keys", () => {
    const expected: Record<string, string> = {
      "myl-anchor-add-p09-a-v1": "5/8",
      "myl-search-add-p10-a-v1": "31/24",
      "myl-search-add-p10-b-v1": "-1",
      "myl-search-mul-p10-a-v1": "92.2",
      "myl-search-mul-p10-b-v1": "10000",
      "myl-anchor-mon-p05-b-v1": "5.90",
      "myl-anchor-mon-p08-a-v1": "72",
      "myl-anchor-mon-p08-b-v1": "30",
      "myl-search-mon-p09-b-v1": "25",
      "myl-search-mon-p10-a-v1": "1210",
      "myl-boundary-mul-p08-a-v1": "36",
      "myl-boundary-mul-p08-b-v1": "431",
      "myl-boundary-mon-p06-a-v1": "7.45",
      "myl-boundary-mon-p06-b-v1": "6.65",
      "myl-boundary-mon-p07-a-v1": "22.50",
      "myl-boundary-mon-p07-c-v1": "111",
      "myl-anchor-mon-p05-c-v1": "4.80",
      "myl-confirm-npv-p09-b-v1": "3.6",
    };

    const byId = new Map(
      NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.map((entry) => [
        entry.item.id,
        entry.item,
      ]),
    );

    for (const [itemId, correctValue] of Object.entries(expected)) {
      const item = byId.get(itemId);
      expect(item, itemId).toBeTruthy();
      expect(item?.response.type, itemId).toBe("short-answer");
      expect(item?.response.correctValue, itemId).toBe(correctValue);
    }
  });

  it("includes every canonical short-answer key in its accepted-answer set", () => {
    for (const entry of NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY) {
      if (entry.item.response.type !== "short-answer") continue;
      const canonical = String(entry.item.response.correctValue ?? "").trim();
      const accepted = entry.item.response.acceptableValues || [];

      expect(canonical, entry.item.id).not.toBe("");
      expect(accepted, entry.item.id).toContain(canonical);
    }
  });
});


it("locks higher-risk choice and multi-select keys", () => {
  const expected: Record<string, string[]> = {
    "myl-anchor-npv-p06-a-v1": [
      "four-thousands-three-hundreds",
      "three-thousands-thirteen-hundreds",
      "forty-three-hundreds",
    ],
    "myl-anchor-mon-p02-a-v1": ["a"],
    "myl-anchor-mon-p05-a-v1": ["a"],
    "myl-anchor-mul-p09-a-v1": ["a"],
    "myl-search-npv-p10-a-v1": ["d"],
    "myl-search-npv-p10-b-v1": ["c"],
    "myl-search-mon-p09-a-v1": ["b"],
    "myl-boundary-npv-p07-a-v1": ["b"],
    "myl-boundary-npv-p07-b-v1": ["b"],
    "myl-boundary-mon-p04-a-v1": ["a"],
    "myl-boundary-mon-p04-b-v1": ["a", "b", "c"],
    "myl-boundary-mon-p04-c-v1": ["b"],
    "myl-boundary-mon-p06-c-v1": ["a"],
    "myl-confirm-npv-p06-a-v1": [
      "6k2h4t",
      "62h4t",
      "5k12h4t",
    ],
    "myl-confirm-npv-p07-a-v1": ["7-05"],
    "myl-confirm-npv-p10-a-v1": ["8e9"],
  };

  const byId = new Map(
    NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.map((entry) => [
      entry.item.id,
      entry.item,
    ]),
  );

  for (const [itemId, correctOptionIds] of Object.entries(expected)) {
    const item = byId.get(itemId);
    expect(item, itemId).toBeTruthy();
    expect(
      item?.response.correctOptionIds,
      itemId,
    ).toEqual(correctOptionIds);
  }
});
