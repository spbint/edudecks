import { describe, expect, it } from "vitest";
import {
  enumerateProportionalRouteCoverage,
  summarizeProportionalRouteCoverage,
} from "./proportionalRouteCoverage";

describe("Proportional thinking route coverage", () => {
  it("terminates every response path without missing content", () => {
    const summary = summarizeProportionalRouteCoverage();
    expect(summary.pathCount).toBeGreaterThan(0);
    expect(summary.unresolvedPaths).toBe(0);
  });

  it("keeps each route bounded", () => {
    const summary = summarizeProportionalRouteCoverage();
    expect(summary.minQuestions).toBeGreaterThanOrEqual(4);
    expect(summary.maxQuestions).toBeLessThanOrEqual(9);
  });

  it("ends only at adjacent bands or source endpoints", () => {
    expect(
      enumerateProportionalRouteCoverage().every((path) =>
        ["adjacent-band", "top-endpoint", "bottom-endpoint"].includes(
          path.terminal,
        ),
      ),
    ).toBe(true);
  });
});
