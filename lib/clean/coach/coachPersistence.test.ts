import { describe, expect, it } from "vitest";
import {
  getCoachStorageKey,
  isCoachRecommendationDismissed,
  isCoachRecommendationSnoozed,
  readCoachPersistence,
  writeCoachPersistence,
} from "./coachPersistence";

describe("Coach persistence", () => {
  it("scopes storage by a non-identifying account hash", () => {
    const first = getCoachStorageKey("account-a");
    const second = getCoachStorageKey("account-b");
    expect(first).toMatch(/^mylearna\.coach\.v1\./);
    expect(first).not.toContain("account-a");
    expect(first).not.toBe(second);
  });

  it("stores a snooze without storing names or learner identifiers", () => {
    const storage = new Map<string, string>();
    const fakeStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    } as unknown as Storage;
    const key = getCoachStorageKey("account-a");
    writeCoachPersistence(fakeStorage, key, {
      snoozedRecommendationId: "activation-capture-learning",
      snoozedUntil: Date.now() + 1000,
    });
    const raw = storage.get(key || "") || "";
    expect(raw).not.toContain("learner");
    expect(isCoachRecommendationSnoozed(readCoachPersistence(fakeStorage, key), "activation-capture-learning")).toBe(true);
  });

  it("stores dismissal by recommendation without storing private workspace data", () => {
    const storage = new Map<string, string>();
    const fakeStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    } as unknown as Storage;
    const key = getCoachStorageKey("account-a");
    writeCoachPersistence(fakeStorage, key, {
      dismissedRecommendationId: "setup-weekly-block",
    });
    const state = readCoachPersistence(fakeStorage, key);
    expect(isCoachRecommendationDismissed(state, "setup-weekly-block")).toBe(true);
    expect(isCoachRecommendationDismissed(state, "activation-choose-pathway")).toBe(false);
    expect(storage.get(key || "")).not.toContain("learner");
  });

  it("fails safely for malformed persistence", () => {
    const fakeStorage = {
      getItem: () => "not-json",
      setItem: () => undefined,
    } as unknown as Storage;
    const key = getCoachStorageKey("account-a");
    expect(readCoachPersistence(fakeStorage, key)).toEqual({});
    expect(isCoachRecommendationDismissed(readCoachPersistence(fakeStorage, key), "setup-weekly-block")).toBe(false);
  });
});
