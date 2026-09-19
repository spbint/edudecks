import { describe, expect, it } from "vitest";
import { getAllPathwaySteps } from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  buildPathwayCalendarHandoffHref,
  resolvePathwayCalendarHandoff,
} from "./pathwayCalendarHandoff";

const registryItem = getAllPathwaySteps()[0]!;
const returnTo = "/my-pathways?subjectKey=mathematics#pathway-step-number-middle-primary-1";

describe("Pathways Calendar handoff", () => {
  it("uses only canonical structural identifiers in an internal Calendar href", () => {
    const href = buildPathwayCalendarHandoffHref({
      calendarPathname: "/my-calendar",
      learnerId: "learner-1",
      registryItem,
      returnTo,
    });
    const url = new URL(href, "https://mylearna.test");

    expect(url.pathname).toBe("/my-calendar");
    expect(url.searchParams.get("learner_id")).toBe("learner-1");
    expect(url.searchParams.get("pathwayStepId")).toBe(registryItem.id);
    expect(url.searchParams.get("returnTo")).toBe(returnTo);
    expect(url.search).not.toContain(encodeURIComponent(registryItem.stepTitle));
    expect(url.search).not.toContain(encodeURIComponent(registryItem.stepDescription));
  });

  it("rejects missing learners, non-canonical steps, and unsafe returns", () => {
    expect(buildPathwayCalendarHandoffHref({
      calendarPathname: "/my-calendar", learnerId: "", registryItem, returnTo,
    })).toBe("");
    expect(buildPathwayCalendarHandoffHref({
      calendarPathname: "/my-calendar", learnerId: "learner-1", registryItem: null, returnTo,
    })).toBe("");
    expect(buildPathwayCalendarHandoffHref({
      calendarPathname: "/my-calendar", learnerId: "learner-1", registryItem, returnTo: "https://example.com",
    })).toBe("");
  });

  it("resolves only current canonical steps and current-family learners", () => {
    expect(resolvePathwayCalendarHandoff({
      pathwayStepId: registryItem.id,
      learnerId: "learner-1",
      learnerIds: ["learner-1"],
      returnTo,
    })?.registryItem.id).toBe(registryItem.id);
    expect(resolvePathwayCalendarHandoff({
      pathwayStepId: "not-a-canonical-step", learnerId: "learner-1", learnerIds: ["learner-1"], returnTo,
    })).toBeNull();
    expect(resolvePathwayCalendarHandoff({
      pathwayStepId: registryItem.id, learnerId: "other-family", learnerIds: ["learner-1"], returnTo,
    })).toBeNull();
  });

  it("normalizes a supported legacy canonical alias before resolving the handoff", () => {
    const legacyId = "english::morphology-and-spelling::middle-primary::u001-prefix-re";
    const resolved = resolvePathwayCalendarHandoff({
      pathwayStepId: legacyId,
      learnerId: "learner-1",
      learnerIds: ["learner-1"],
      returnTo,
    });

    expect(resolved?.registryItem.id).toBe(
      "english::morphology-and-spelling::upper-elementary::u001-prefix-re",
    );
  });
});
