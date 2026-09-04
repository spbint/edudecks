import { describe, expect, it } from "vitest";
import {
  appendPathwayCaptureReturnTo,
  buildPathwayStepReturnHref,
} from "@/lib/clean/pathways/pathwayNavigationContext";

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

  it.each([
    ["number-and-place-value", "middle-primary", "number-step-1"],
    ["operations-and-calculation", "upper-primary", "operations-step-1"],
    ["fractions-decimals-percentages", "upper-primary", "fractions-step-1"],
  ])("carries the exact %s card through generic Capture", (strandKey, stageKey, stepKey) => {
    const returnTo = buildPathwayStepReturnHref({
      pathname: "/my-pathways",
      subjectKey: "mathematics",
      strandKey,
      stageKey,
      pathwayStepId: `mathematics::${strandKey}::${stageKey}::${stepKey}`,
      stepKey,
      learnerId: "learner-a",
      detailPanelId: `pathway-step-${strandKey}-${stageKey}-1`,
    });
    const captureUrl = new URL(
      appendPathwayCaptureReturnTo(
        `/my-capture?source=my-pathways&learnerId=learner-a&subjectKey=mathematics&pathwayKey=${strandKey}&stageKey=${stageKey}&pathwayStepId=mathematics%3A%3A${strandKey}%3A%3A${stageKey}%3A%3A${stepKey}&stepKey=${stepKey}`,
        returnTo,
      ),
      "https://mylearna.test",
    );
    const returnedUrl = new URL(captureUrl.searchParams.get("returnTo") || "", "https://mylearna.test");

    expect(captureUrl.searchParams.get("learnerId")).toBe("learner-a");
    expect(captureUrl.searchParams.get("subjectKey")).toBe("mathematics");
    expect(captureUrl.searchParams.get("pathwayKey")).toBe(strandKey);
    expect(captureUrl.searchParams.get("stageKey")).toBe(stageKey);
    expect(captureUrl.searchParams.get("pathwayStepId")).toBe(
      `mathematics::${strandKey}::${stageKey}::${stepKey}`,
    );
    expect(captureUrl.searchParams.get("stepKey")).toBe(stepKey);
    expect(returnedUrl.searchParams.get("learnerId")).toBe("learner-a");
    expect(returnedUrl.searchParams.get("subjectKey")).toBe("mathematics");
    expect(returnedUrl.searchParams.get("strandKey")).toBe(strandKey);
    expect(returnedUrl.searchParams.get("stageKey")).toBe(stageKey);
    expect(returnedUrl.searchParams.get("pathwayStepId")).toBe(
      `mathematics::${strandKey}::${stageKey}::${stepKey}`,
    );
    expect(returnedUrl.searchParams.get("stepKey")).toBe(stepKey);
    expect(returnedUrl.hash).toBe(`#pathway-step-${strandKey}-${stageKey}-1`);
  });
});
