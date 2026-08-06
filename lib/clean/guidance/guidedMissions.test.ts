import { describe, expect, it } from "vitest";
import {
  getGuidedStartStorageKey,
  reconcileGuidedStartState,
  readGuidedStartState,
} from "@/app/components/clean/guidance/guidedMissions";

describe("Guided Start real-state reconciliation", () => {
  it("reopens family details when persisted completion conflicts with an empty workspace", () => {
    expect(reconcileGuidedStartState({
      persistedState: { status: "completed", step: "complete", welcomeDismissed: true },
      hasProfile: false,
      learnerCount: 0,
      pathname: "/my-profile",
    })).toEqual({ status: "not_started", step: "family-details", welcomeDismissed: false });
  });

  it("reconciles a completed record to the learner step when the profile exists", () => {
    expect(reconcileGuidedStartState({
      persistedState: { status: "completed", step: "complete", welcomeDismissed: true },
      hasProfile: true,
      learnerCount: 0,
      pathname: "/my-profile",
    })).toMatchObject({ status: "not_started", step: "first-learner" });
  });

  it("preserves a compatible pause while correcting its real next step", () => {
    expect(reconcileGuidedStartState({
      persistedState: { status: "paused", step: "family-details", welcomeDismissed: true },
      hasProfile: false,
      learnerCount: 0,
      pathname: "/my-profile",
    })).toMatchObject({ status: "paused", step: "family-details" });
  });

  it("marks genuinely complete setup only after the settings handoff route is reached", () => {
    expect(reconcileGuidedStartState({
      persistedState: { status: "active", step: "continue-settings", welcomeDismissed: true },
      hasProfile: true,
      learnerCount: 1,
      pathname: "/my-settings",
    })).toEqual({ status: "completed", step: "complete", welcomeDismissed: true });
  });

  it("uses malformed storage as a safe empty state and scopes keys per account", () => {
    const values = new Map([["mission", "not-json"]]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: () => undefined,
    } as unknown as Storage;
    expect(readGuidedStartState(storage, "mission")).toBeNull();
    expect(getGuidedStartStorageKey("account-a")).not.toBe(getGuidedStartStorageKey("account-b"));
  });
});
