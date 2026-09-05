import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildActionablePathwayRecommendation } from "@/lib/clean/pathways/pathwayRecommendationNavigation";
import { getAllPathwaySteps, getPathwayStepById } from "@/lib/clean/pathways/pathwayStepRegistry";

const learnerId = "learner-a";
const numberStep = getPathwayStepById(
  "mathematics",
  "number-and-place-value",
  "middle-primary",
  "estimate-and-check-reasonableness",
);

function recommendationFor(
  parentProgress: Parameters<typeof buildActionablePathwayRecommendation>[0]["parentProgress"],
) {
  expect(numberStep).not.toBeNull();
  return buildActionablePathwayRecommendation({
    learnerId,
    step: numberStep!,
    autoCheckStatus: null,
    parentProgress,
  });
}

describe("My Learna actionable Pathways recommendation", () => {
  it("is a thin adapter over the canonical Pathways resolver, not a second status rule table", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/clean/pathways/pathwayRecommendationNavigation.ts"),
      "utf8",
    );

    expect(source).toContain("resolvePathwayNextAction");
    expect(source).toContain("buildPathwayStepReturnHref");
    expect(source).not.toContain('case "Secure"');
    expect(source).not.toContain('case "Developing"');
  });

  it.each([
    ["Not checked yet", "check-understanding"],
    ["Needs support", "practise"],
    ["Developing", "practise"],
    ["Consolidating", "check-understanding"],
    ["Secure", "next-step"],
  ] as const)("matches Pathways for %s", (status, expectedAction) => {
    const recommendation = recommendationFor(status);

    expect(recommendation.action).toBe(expectedAction);
    expect(recommendation.href).toContain("/my-pathways?");
  });

  it("preserves the complete exact current-step context and expanded card hash", () => {
    const recommendation = recommendationFor("Developing");
    const href = new URL(recommendation.href, "https://mylearna.test");

    expect(href.searchParams.get("learnerId")).toBe(learnerId);
    expect(href.searchParams.get("subjectKey")).toBe(numberStep!.subjectKey);
    expect(href.searchParams.get("strandKey")).toBe(numberStep!.strandKey);
    expect(href.searchParams.get("stageKey")).toBe(numberStep!.stageKey);
    expect(href.searchParams.get("pathwayStepId")).toBe(numberStep!.id);
    expect(href.searchParams.get("stepKey")).toBe(numberStep!.stepKey);
    expect(href.hash).toBe(
      `#pathway-step-${numberStep!.strandKey}-${numberStep!.stageKey}-${numberStep!.legacyStepNumber}`,
    );
  });

  it.each([
    ["number-and-place-value", "middle-primary"],
    ["operations-and-calculation", "middle-primary"],
    ["fractions-decimals-percentages", "middle-primary"],
  ])("keeps %s recommendations inside their exact strand", (strandKey, stageKey) => {
    const step = getAllPathwaySteps().find(
      (candidate) =>
        candidate.subjectKey === "mathematics" &&
        candidate.strandKey === strandKey &&
        candidate.stageKey === stageKey,
    );
    expect(step).toBeTruthy();
    const recommendation = buildActionablePathwayRecommendation({
      learnerId,
      step: step!,
      autoCheckStatus: null,
      parentProgress: "Not checked yet",
    });
    const href = new URL(recommendation.href, "https://mylearna.test");

    expect(href.searchParams.get("strandKey")).toBe(strandKey);
    expect(href.searchParams.get("pathwayStepId")).toBe(step!.id);
  });

  it("targets the exact canonical next card when Secure has a next step", () => {
    const recommendation = recommendationFor("Secure");
    const href = new URL(recommendation.href, "https://mylearna.test");

    expect(recommendation.action).toBe("next-step");
    expect(recommendation.targetStep.id).not.toBe(numberStep!.id);
    expect(href.searchParams.get("pathwayStepId")).toBe(recommendation.targetStep.id);
    expect(href.searchParams.get("stepKey")).toBe(recommendation.targetStep.stepKey);
    expect(href.hash).toBe(
      `#pathway-step-${recommendation.targetStep.strandKey}-${recommendation.targetStep.stageKey}-${recommendation.targetStep.legacyStepNumber}`,
    );
  });
});
