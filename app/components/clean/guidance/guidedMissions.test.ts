import { describe, expect, it } from "vitest";
import {
  deriveGuidedStartStep,
  getGuidedStartStepNumber,
  getGuidedStartStorageKey,
  isGuidedStartComplete,
  readGuidedStartState,
  shouldAutoOfferGuidedStart,
  writeGuidedStartState,
} from "./guidedMissions";

describe("guided-start-family-setup mission state", () => {
  it("derives the next step from authorised workspace state", () => {
    expect(deriveGuidedStartStep({ hasProfile: false, learnerCount: 0, pathname: "/my-profile" })).toBe("family-details");
    expect(deriveGuidedStartStep({ hasProfile: true, learnerCount: 0, pathname: "/my-profile" })).toBe("first-learner");
    expect(deriveGuidedStartStep({ hasProfile: true, learnerCount: 1, pathname: "/my-profile" })).toBe("activation-choice");
    expect(deriveGuidedStartStep({ hasProfile: true, learnerCount: 1, pathname: "/my-settings" })).toBe("complete");
  });

  it("keeps the legacy settings completion rule available", () => {
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

  it("auto-offers only after real workspace resolution for an incomplete account", () => {
    const base = {
      guidanceEnabled: true,
      guidanceHydrated: true,
      workspaceLoading: false,
      setupLoading: false,
      schemaMissing: false,
      error: null,
      hasProfile: false,
      learnerCount: 0,
    };

    expect(shouldAutoOfferGuidedStart({ ...base, persistedState: null })).toBe(true);
    expect(
      shouldAutoOfferGuidedStart({ ...base, persistedState: { status: "paused", step: "family-details", welcomeDismissed: true } }),
    ).toBe(false);
    expect(shouldAutoOfferGuidedStart({ ...base, workspaceLoading: true, persistedState: null })).toBe(false);
    expect(shouldAutoOfferGuidedStart({ ...base, hasProfile: true, learnerCount: 1, persistedState: null })).toBe(true);
  });
});
