// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { clearLocalSessionForAccountSwitch } from "@/lib/authSessionEscape";

const identityKeys = [
  "edudecks_family_settings_v1",
  "edudecks_children_seed_v1",
  "edudecks_active_student_id",
  "mylearna.clean.activeLearnerByFamily.v1",
];

describe("account-switch browser cleanup", () => {
  afterEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("removes only identity-bearing family cache from both browser stores", () => {
    for (const key of identityKeys) {
      window.localStorage.setItem(key, "stale-family-a");
      window.sessionStorage.setItem(key, "stale-family-a");
    }
    window.localStorage.setItem("unrelated-preference", "keep-local");
    window.sessionStorage.setItem("unrelated-session-state", "keep-session");

    clearLocalSessionForAccountSwitch();

    for (const key of identityKeys) {
      expect(window.localStorage.getItem(key)).toBeNull();
      expect(window.sessionStorage.getItem(key)).toBeNull();
    }
    expect(window.localStorage.getItem("unrelated-preference")).toBe("keep-local");
    expect(window.sessionStorage.getItem("unrelated-session-state")).toBe("keep-session");
  });
});
