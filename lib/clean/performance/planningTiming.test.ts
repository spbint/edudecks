import { describe, expect, it } from "vitest";
import {
  beginCleanPlanningTiming,
  clearCleanPlanningTiming,
  getCleanPlanningTimingEvents,
  recordCleanPlanningMilestone,
} from "@/lib/clean/performance/planningTiming";

describe("clean planning timing diagnostics", () => {
  it("records anonymous durations, outcomes, and duplicate counts", async () => {
    clearCleanPlanningTiming();
    const first = beginCleanPlanningTiming({
      operation: "family-workspace",
      criticality: "bootstrap-critical",
      gatesPage: true,
      requestKey: "workspace",
    });
    const duplicate = beginCleanPlanningTiming({
      operation: "family-workspace",
      criticality: "bootstrap-critical",
      gatesPage: true,
      requestKey: "workspace",
    });

    await Promise.resolve();
    first("success");
    duplicate("error");

    const events = getCleanPlanningTimingEvents();
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.operation)).toEqual([
      "family-workspace",
      "family-workspace",
    ]);
    expect(events[0]?.duplicateNumber).toBe(0);
    expect(events[1]?.duplicateNumber).toBe(1);
    expect(events[1]?.outcome).toBe("error");
    expect(events.every((event) => event.durationMs >= 0)).toBe(true);
  });

  it("records milestones without exposing private request data", () => {
    clearCleanPlanningTiming();
    recordCleanPlanningMilestone({
      operation: "my-day-primary-content",
      criticality: "page-primary",
      gatesPage: false,
    });

    expect(getCleanPlanningTimingEvents()).toEqual([
      expect.objectContaining({
        operation: "my-day-primary-content",
        criticality: "page-primary",
        gatesPage: false,
        outcome: "success",
      }),
    ]);
  });
});
