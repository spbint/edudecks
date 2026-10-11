import { describe, expect, it } from "vitest";
import {
  NUMBER_OPERATIONS_CROSSWALK_SOURCE,
  NUMBER_OPERATIONS_PROGRESSION_PATHWAY_CROSSWALK,
  getNumberOperationsProgressionPathwayCrosswalkEntry,
  resolveNumberOperationsCrosswalkStep,
} from "./numberOperationsProgressionPathwayCrosswalk";

describe("Number & Operations progression-to-Pathways crosswalk", () => {
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

  it("keeps deliberately ambiguous later counting levels at strand level", () => {
    expect(
      getNumberOperationsProgressionPathwayCrosswalkEntry(
        "counting-processes",
        7,
      ),
    ).toMatchObject({ confidence: "strand-level", target: null });
    expect(
      getNumberOperationsProgressionPathwayCrosswalkEntry(
        "counting-processes",
        8,
      ),
    ).toMatchObject({ confidence: "strand-level", target: null });
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
