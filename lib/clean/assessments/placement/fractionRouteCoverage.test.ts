import { describe, expect, it } from "vitest";
import {
  enumerateFractionRouteCoverage,
  summarizeFractionRouteCoverage,
} from "./fractionRouteCoverage";

describe("Interpreting fractions route coverage", () => {
  it("terminates every response path without missing content", () => {
    const summary = summarizeFractionRouteCoverage();

    expect(summary.pathCount).toBeGreaterThan(0);
    expect(summary.unresolvedPaths).toBe(0);
    expect(summary.terminalCounts["unresolved-missing-content"]).toBe(0);
  });

  it("keeps the full fraction route within a bounded question load", () => {
    const summary = summarizeFractionRouteCoverage();

    expect(summary.minQuestions).toBeGreaterThanOrEqual(4);
    expect(summary.maxQuestions).toBeLessThanOrEqual(11);
  });

  it("ends only at adjacent bands or source endpoints", () => {
    expect(
      enumerateFractionRouteCoverage().every((path) =>
        ["adjacent-band", "top-endpoint", "bottom-endpoint"].includes(
          path.terminal,
        ),
      ),
    ).toBe(true);
  });

  it("exercises lower endpoint, upper endpoint and adjacent bands", () => {
    const summary = summarizeFractionRouteCoverage();

    expect(summary.terminalCounts["bottom-endpoint"]).toBeGreaterThan(0);
    expect(summary.terminalCounts["top-endpoint"]).toBeGreaterThan(0);
    expect(summary.terminalCounts["adjacent-band"]).toBeGreaterThan(0);
  });
});
