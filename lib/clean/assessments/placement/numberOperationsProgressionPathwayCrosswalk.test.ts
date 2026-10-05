import { describe, expect, it } from "vitest";
import { getNumeracyProgressionSubElement } from "./numeracyProgressionRegistry";
import {
  NUMBER_OPERATIONS_CROSSWALK_SOURCE,
  NUMBER_OPERATIONS_PROGRESSION_PATHWAY_CROSSWALK,
  getNumberOperationsProgressionPathwayCrosswalkEntry,
  resolveNumberOperationsCrosswalkStep,
} from "./numberOperationsProgressionPathwayCrosswalk";

describe("Number & Operations progression-to-Pathways crosswalk", () => {
  it("keeps every crosswalk source page inside the canonical progression source pages", () => {
    for (const entry of NUMBER_OPERATIONS_PROGRESSION_PATHWAY_CROSSWALK) {
      const source = getNumeracyProgressionSubElement(entry.subElementKey);
      expect(source, entry.subElementKey).not.toBeNull();
      if (!source) continue;

      for (const page of entry.sourcePages) {
        expect(
          source.sourcePages,
          `${entry.subElementKey} P${entry.pLevel} page ${page}`,
        ).toContain(page);
      }
    }
  });

  it("covers all 48 levels in the five first-slice continua", () => {
    expect(NUMBER_OPERATIONS_PROGRESSION_PATHWAY_CROSSWALK).toHaveLength(48);
    expect(
      new Set(
        NUMBER_OPERATIONS_PROGRESSION_PATHWAY_CROSSWALK.map(
          (entry) => `${entry.subElementKey}:p${entry.pLevel}`,
        ),
      ).size,
    ).toBe(48);
  });

  it("resolves every source-guided target to a real canonical My Pathways step", () => {
    const guided = NUMBER_OPERATIONS_PROGRESSION_PATHWAY_CROSSWALK.filter(
      (entry) => entry.confidence === "source-guided-step",
    );
    expect(guided.length).toBeGreaterThan(40);
    for (const entry of guided) {
      const resolved = resolveNumberOperationsCrosswalkStep(entry);
      expect(resolved, `${entry.subElementKey} P${entry.pLevel}`).not.toBeNull();
      expect(resolved?.subjectKey).toBe("mathematics");
    }
  });

  it("keeps counting levels with mixed or distributed constructs at strand level", () => {
    for (const pLevel of [1, 7, 8]) {
      expect(
        getNumberOperationsProgressionPathwayCrosswalkEntry(
          "counting-processes",
          pLevel,
        ),
      ).toMatchObject({ confidence: "strand-level", target: null });
    }
  });

  it("keeps source-guided mappings explicit about their limitation", () => {
    expect(NUMBER_OPERATIONS_CROSSWALK_SOURCE.rule).toMatch(
      /recommended next-learning handoff/i,
    );
    expect(NUMBER_OPERATIONS_CROSSWALK_SOURCE.rule).toMatch(
      /not a claim.*equivalent/i,
    );
  });
});
