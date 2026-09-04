import { describe, expect, it, vi } from "vitest";

const { trackProductEvent } = vi.hoisted(() => ({ trackProductEvent: vi.fn() }));
vi.mock("@/lib/clean/analytics/productAnalytics", () => ({ trackProductEvent }));

import { trackPathwayAnalyticsEvent } from "@/lib/clean/pathways/pathwayAnalytics";

describe("trackPathwayAnalyticsEvent", () => {
  it("emits only structural context with the canonical machine-safe progress label", () => {
    trackPathwayAnalyticsEvent("pathway_step_opened", {
      subjectKey: "mathematics",
      strandKey: "fractions-decimals-percentages",
      stageKey: "middle-primary",
      stepKey: "fractions-step-1",
      pathwayStepId: "mathematics-fractions-middle-primary-1",
      progressStatus: "Needs support",
      hasPractice: true,
      hasAssessment: true,
      hasWorksheet: true,
      hasNextStep: false,
    });

    expect(trackProductEvent).toHaveBeenCalledWith(
      "pathway_step_opened",
      expect.objectContaining({
        source: "pathways",
        subjectKey: "mathematics",
        strandKey: "fractions-decimals-percentages",
        progressStatus: "needs_support",
      }),
      undefined,
    );
    expect(JSON.stringify(trackProductEvent.mock.calls[0]?.[1])).not.toMatch(
      /learner|email|answer|response|evidence|text|name/i,
    );
  });

  it.each([
    ["Not checked yet", "not_checked_yet"],
    ["Developing", "developing"],
    ["Consolidating", "consolidating"],
    ["Secure", "secure"],
  ] as const)("maps %s safely", (progressStatus, expected) => {
    trackPathwayAnalyticsEvent("pathway_recommended_action_selected", { progressStatus });
    expect(trackProductEvent).toHaveBeenLastCalledWith(
      "pathway_recommended_action_selected",
      expect.objectContaining({ progressStatus: expected, source: "pathways" }),
      undefined,
    );
  });
});
