import { describe, expect, it } from "vitest";
import { buildPathwayStepReturnHref } from "@/lib/clean/pathways/pathwayNavigationContext";

describe("pathway learning-action return context", () => {
  it.each([
    ["number-and-place-value", "middle-primary", "number-step-1"],
    ["operations-and-calculation", "upper-primary", "operations-step-1"],
    ["fractions-decimals-percentages", "upper-primary", "fractions-step-1"],
  ])("preserves the exact %s pathway step", (strandKey, stageKey, stepKey) => {
    const href = buildPathwayStepReturnHref({
      pathname: "/my-pathways",
      subjectKey: "mathematics",
      strandKey,
      stageKey,
      pathwayStepId: `mathematics::${strandKey}::${stageKey}::${stepKey}`,
      stepKey,
      learnerId: "learner-a",
      detailPanelId: `pathway-step-${strandKey}-${stageKey}-1`,
    });
    const url = new URL(href, "https://mylearna.test");

    expect(url.searchParams.get("learnerId")).toBe("learner-a");
    expect(url.searchParams.get("subjectKey")).toBe("mathematics");
    expect(url.searchParams.get("strandKey")).toBe(strandKey);
    expect(url.searchParams.get("stageKey")).toBe(stageKey);
    expect(url.searchParams.get("stepKey")).toBe(stepKey);
    expect(url.searchParams.get("pathwayStepId")).toBe(
      `mathematics::${strandKey}::${stageKey}::${stepKey}`,
    );
    expect(url.hash).toBe(`#pathway-step-${strandKey}-${stageKey}-1`);
  });
});
