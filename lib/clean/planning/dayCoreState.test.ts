import { describe, expect, it } from "vitest";
import { getCleanDayCoreState } from "./dayCoreState";

const readyInput = {
  readyForDay: true,
  itemsLoading: false,
  itemsError: null,
  dayPrimaryKey: "user:family:2026-09-12",
  itemsResolvedKey: "user:family:2026-09-12",
  presentationState: "POPULATED_DAY" as const,
};

describe("My Day core presentation state", () => {
  it("shows error when the Calendar request has failed, even if stale loading state remains", () => {
    expect(getCleanDayCoreState({ ...readyInput, itemsLoading: true, itemsError: "timed out" })).toBe("error");
  });

  it("does not remain loading after a terminal Calendar error", () => {
    expect(getCleanDayCoreState({ ...readyInput, itemsError: "timed out", presentationState: null })).toBe("error");
  });

  it("keeps stable unresolved work in loading and settled matching data ready", () => {
    expect(getCleanDayCoreState({ ...readyInput, itemsLoading: true })).toBe("loading");
    expect(getCleanDayCoreState(readyInput)).toBe("ready");
  });
});
