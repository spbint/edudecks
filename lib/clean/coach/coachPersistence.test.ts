import { describe, expect, it } from "vitest";
import {
  getCoachStorageKey,
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
});
