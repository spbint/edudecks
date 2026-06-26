import { describe, expect, it } from "vitest";

import {
  buildLearnaMilestones,
  buildLearnaStrandSummaries,
  buildLearnaTrendSeries,
  clampLearnaValue,
  inferLearnaEvidenceStrand,
} from "@/lib/clean/learna/metrics";
import type { LearnaEvidenceMetricInput } from "@/lib/clean/learna/types";

function evidence(
  id: string,
  overrides: Partial<LearnaEvidenceMetricInput> = {},
): LearnaEvidenceMetricInput {
  return {
    id,
    learnerId: "learner-1",
    observedOn: "2026-06-24",
    title: null,
    whatHappened: "",
    reflection: null,
    learningArea: null,
    curriculumNodeIds: [],
    attachmentUrls: [],
    imageUrl: null,
    includeInPortfolio: true,
    includeInReport: true,
    createdAt: null,
    ...overrides,
  };
}

describe("Learna dashboard metrics", () => {
  it("infers maths strands from parent-facing evidence text", () => {
    expect(inferLearnaEvidenceStrand(evidence("1", { learningArea: "Geometry" }))).toBe(
      "geometry-and-spatial-reasoning",
    );
    expect(inferLearnaEvidenceStrand(evidence("2", { title: "Fractions worksheet" }))).toBe(
      "fractions-decimals-percentages",
    );
  });

  it("builds an evidence trend series without NaN values", () => {
    const series = buildLearnaTrendSeries(
      [
        evidence("1", { observedOn: "2026-06-22" }),
        evidence("2", { observedOn: "2026-06-23" }),
        evidence("3", { observedOn: "2026-06-15" }),
      ],
      { weeks: 2, today: new Date("2026-06-26T00:00:00Z") },
    );

    expect(series.map((point) => point.count)).toEqual([1, 2]);
    expect(series.every((point) => Number.isFinite(point.count))).toBe(true);
  });

  it("maps strand summaries with safe radar values", () => {
    const summaries = buildLearnaStrandSummaries(
      [
        evidence("1", {
          learningArea: "Number",
          reflection: "Progress level: Goal achieved.",
        }),
        evidence("2", {
          learningArea: "Number",
          reflection: "Progress level: Working towards.",
          includeInReport: false,
        }),
      ],
      { "number-and-place-value": 10 },
    );

    const number = summaries.find((summary) => summary.code === "NPV");
    expect(number?.evidenceCount).toBe(2);
    expect(number?.secureSteps).toBe(1);
    expect(number?.radarValue).toBeGreaterThan(0);
    expect(summaries.every((summary) => summary.radarValue >= 0 && summary.radarValue <= 100)).toBe(
      true,
    );
  });

  it("clamps radar values and builds simple milestones", () => {
    expect(clampLearnaValue(Number.NaN)).toBe(0);
    expect(clampLearnaValue(180)).toBe(100);

    const milestones = buildLearnaMilestones(
      [evidence("1", { imageUrl: "/photo.jpg" })],
      { secureStepCount: 1, reportReadyCount: 1 },
    );

    expect(milestones.filter((milestone) => milestone.active).map((milestone) => milestone.id)).toEqual(
      ["first-evidence", "first-secure", "report-ready", "photo-evidence"],
    );
  });
});
