import { describe, expect, it } from "vitest";
import {
  enumerateMeasurementUnitsRouteCoverage,
  summarizeMeasurementUnitsRouteCoverage,
} from "./measurementUnitsRouteCoverage";

describe("measurement-units adaptive route coverage", () => {
  it("terminates every aggregate response route without missing content", () => {
    const summary = summarizeMeasurementUnitsRouteCoverage();

    expect(summary.pathCount).toBeGreaterThan(0);
    expect(summary.unresolvedPaths).toBe(0);
    expect(summary.terminalCounts["unresolved-missing-content"]).toBe(0);
  });

  it("keeps the measurement route within the first-slice per-area budget", () => {
    const summary = summarizeMeasurementUnitsRouteCoverage();

    expect(summary.minQuestions).toBeGreaterThanOrEqual(4);
    expect(summary.maxQuestions).toBeLessThanOrEqual(11);
    expect(summary.maxQuestions).toBeGreaterThanOrEqual(
      summary.minQuestions,
    );
  });

  it("ends only in adjacent bands or source progression endpoints", () => {
    expect(
      enumerateMeasurementUnitsRouteCoverage().every((path) =>
        ["adjacent-band", "top-endpoint", "bottom-endpoint"].includes(
          path.terminal,
        ),
      ),
    ).toBe(true);
  });

  it("exercises both lower and upper endpoint paths", () => {
    const summary = summarizeMeasurementUnitsRouteCoverage();

    expect(summary.terminalCounts["bottom-endpoint"]).toBeGreaterThan(0);
    expect(summary.terminalCounts["top-endpoint"]).toBeGreaterThan(0);
    expect(summary.terminalCounts["adjacent-band"]).toBeGreaterThan(0);
  });
});
