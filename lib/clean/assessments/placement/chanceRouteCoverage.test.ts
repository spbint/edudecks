import { describe, expect, it } from "vitest";
import {
  enumerateChanceRouteCoverage,
  summarizeChanceRouteCoverage,
} from "./chanceRouteCoverage";

describe("Understanding chance route coverage", () => {
  it("terminates every response path without missing content", () => {
    const summary = summarizeChanceRouteCoverage();

    expect(summary.pathCount).toBeGreaterThan(0);
    expect(summary.unresolvedPaths).toBe(0);
    expect(summary.terminalCounts["unresolved-missing-content"]).toBe(0);
  });

  it("keeps the full chance route inside a bounded question load", () => {
    const summary = summarizeChanceRouteCoverage();

    expect(summary.minQuestions).toBeGreaterThanOrEqual(4);
    expect(summary.maxQuestions).toBeLessThanOrEqual(9);
  });

  it("ends only at adjacent bands or source endpoints", () => {
    expect(
      enumerateChanceRouteCoverage().every((path) =>
        ["adjacent-band", "top-endpoint", "bottom-endpoint"].includes(
          path.terminal,
        ),
      ),
    ).toBe(true);
  });

  it("exercises lower endpoint, upper endpoint and adjacent bands", () => {
    const summary = summarizeChanceRouteCoverage();

    expect(summary.terminalCounts["bottom-endpoint"]).toBeGreaterThan(0);
    expect(summary.terminalCounts["top-endpoint"]).toBeGreaterThan(0);
    expect(summary.terminalCounts["adjacent-band"]).toBeGreaterThan(0);
  });
});
