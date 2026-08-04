import { describe, expect, it } from "vitest";
import {
  deriveGuidedStartStep,
  getGuidedStartStepNumber,
  getGuidedStartStorageKey,
  isGuidedStartComplete,
  readGuidedStartState,
  writeGuidedStartState,
} from "./guidedMissions";

describe("guided-start-family-setup mission state", () => {
  it("derives the next step from authorised workspace state", () => {
    expect(deriveGuidedStartStep({ hasProfile: false, learnerCount: 0, pathname: "/my-profile" })).toBe("family-details");
    expect(deriveGuidedStartStep({ hasProfile: true, learnerCount: 0, pathname: "/my-profile" })).toBe("first-learner");
    expect(deriveGuidedStartStep({ hasProfile: true, learnerCount: 1, pathname: "/my-profile" })).toBe("continue-settings");
    expect(deriveGuidedStartStep({ hasProfile: true, learnerCount: 1, pathname: "/my-settings" })).toBe("complete");
  });

  it("only considers the mission complete after the real settings route is reached", () => {
    expect(isGuidedStartComplete({ hasProfile: true, learnerCount: 1, pathname: "/my-profile" })).toBe(false);
    expect(isGuidedStartComplete({ hasProfile: true, learnerCount: 0, pathname: "/my-settings" })).toBe(false);
    expect(isGuidedStartComplete({ hasProfile: true, learnerCount: 1, pathname: "/my-settings" })).toBe(true);
  });

  it("keeps persisted state resumable and scoped without storing the raw user id", () => {
    const storage = new Map<string, string>();
    const adapter: Storage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => void storage.set(key, value),
      removeItem: (key) => void storage.delete(key),
      clear: () => void storage.clear(),
      key: (index) => Array.from(storage.keys())[index] ?? null,
      get length() {
        return storage.size;
      },
    };
    const userId = "user-with-private-identifiers@example.test";
    const key = getGuidedStartStorageKey(userId);
    const state = { status: "paused" as const, step: "first-learner" as const, welcomeDismissed: true };

    writeGuidedStartState(adapter, key, state);

    expect(key).not.toContain(userId);
    expect(readGuidedStartState(adapter, key)).toEqual(state);
    expect(getGuidedStartStepNumber("welcome")).toBe(1);
    expect(getGuidedStartStepNumber("first-learner")).toBe(3);
  });
});
