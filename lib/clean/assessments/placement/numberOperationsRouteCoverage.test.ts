import { describe, expect, it } from "vitest";
import { NUMBER_OPERATIONS_ANCHOR_SETS } from "./numberOperationsAnchors";
import {
  enumerateNumberOperationsRouteCoverage,
  summarizeNumberOperationsRouteCoverage,
} from "./numberOperationsRouteCoverage";

describe("Number Operations adaptive route coverage", () => {
  it("terminates every enumerated first-slice route with no missing content", () => {
    for (const set of NUMBER_OPERATIONS_ANCHOR_SETS) {
      const summary = summarizeNumberOperationsRouteCoverage(set);

      expect(summary.pathCount).toBeGreaterThan(0);
      expect(summary.unresolvedPaths).toBe(0);
      expect(summary.terminalCounts["unresolved-missing-content"]).toBe(0);
    }
  });

  it("keeps every single-area route inside a bounded question load", () => {
    for (const set of NUMBER_OPERATIONS_ANCHOR_SETS) {
      const summary = summarizeNumberOperationsRouteCoverage(set);

      expect(summary.minQuestions).toBeGreaterThanOrEqual(4);
      expect(summary.maxQuestions).toBeLessThanOrEqual(11);
      expect(summary.maxQuestions).toBeGreaterThanOrEqual(
        summary.minQuestions,
      );
    }
  });

  it("keeps the complete five-area baseline under the v1 safety budget", () => {
    const summaries = NUMBER_OPERATIONS_ANCHOR_SETS.map(
      summarizeNumberOperationsRouteCoverage,
    );
    const minimum = summaries.reduce(
      (total, summary) => total + summary.minQuestions,
      0,
    );
    const maximum = summaries.reduce(
      (total, summary) => total + summary.maxQuestions,
      0,
    );

    expect(minimum).toBeGreaterThanOrEqual(20);
    expect(maximum).toBeLessThanOrEqual(55);
  });

  it("produces only adjacent bands or progression endpoints when content is complete", () => {
    for (const set of NUMBER_OPERATIONS_ANCHOR_SETS) {
      const paths = enumerateNumberOperationsRouteCoverage(set);
      expect(
        paths.every((path) =>
          ["adjacent-band", "top-endpoint", "bottom-endpoint"].includes(
            path.terminal,
          ),
        ),
      ).toBe(true);
    }
  });
});
