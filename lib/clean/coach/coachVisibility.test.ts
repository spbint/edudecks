import { describe, expect, it } from "vitest";
import { shouldShowAutomaticCoachCard } from "./coachVisibility";
import type { CoachRecommendation } from "./types";

const recommendation: CoachRecommendation = {
  id: "setup-learning-year",
  category: "setup",
  priority: 1,
  audience: "new-family",
  title: "Create your learning year",
  body: "Set the dates for your family year.",
  reason: "Your family has not created a learning year yet.",
  primaryActionLabel: "Open My Calendar",
  primaryRoute: "/my-calendar",
  mandatorySetup: true,
  canSnooze: false,
};

describe("automatic Coach visibility", () => {
  it("suppresses setup recommendations while Guided Start is visible", () => {
    expect(shouldShowAutomaticCoachCard({ recommendation, guidanceEnabled: true, guidedStartVisible: true, guidanceSetupStatus: "active", route: "/my-profile", focusedRoute: false })).toBe(false);
  });

  it("does not create a silent setup gap after a paused mission", () => {
    expect(shouldShowAutomaticCoachCard({ recommendation, guidanceEnabled: true, guidedStartVisible: false, guidanceSetupStatus: "skipped", route: "/my-profile", focusedRoute: false })).toBe(true);
  });

  it("suppresses automatic guidance when disabled or focused", () => {
    expect(shouldShowAutomaticCoachCard({ recommendation, guidanceEnabled: false, guidedStartVisible: false, guidanceSetupStatus: "skipped", route: "/my-calendar", focusedRoute: false })).toBe(false);
    expect(shouldShowAutomaticCoachCard({ recommendation, guidanceEnabled: true, guidedStartVisible: false, guidanceSetupStatus: "skipped", route: "/my-calendar", focusedRoute: true })).toBe(false);
  });

  it("suppresses stale recommendations while authoritative state refreshes", () => {
    expect(shouldShowAutomaticCoachCard({
      recommendation,
      guidanceEnabled: true,
      guidedStartVisible: false,
      guidanceSetupStatus: "skipped",
      route: "/my-calendar",
      focusedRoute: false,
      stateRefreshing: true,
    })).toBe(false);
  });
});
