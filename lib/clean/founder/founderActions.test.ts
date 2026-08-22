import { describe, expect, it } from "vitest";
import { buildFounderActions } from "@/lib/clean/founder/founderActions";
import type { FounderDashboardData } from "@/lib/clean/founder/founderDashboard";

const NOW = "2026-08-22T00:00:00.000Z";

function customer(overrides: Partial<FounderDashboardData["customers"][number]> = {}) {
  return {
    userId: "family-1",
    familyId: "family-row-1",
    email: "parent@example.com",
    joinedAt: "2026-08-21T12:00:00.000Z",
    lastSignInAt: "2026-08-21T13:00:00.000Z",
    familyDisplayName: "Example Family",
    countryCode: "AU",
    jurisdictionCode: "TAS",
    learnerCount: 1,
    profileCompleted: true,
    displayName: "Example Family",
    lastActiveAt: "2026-08-21T13:00:00.000Z",
    activeDays30: 1,
    myDayViews: 0,
    calendarActions: 0,
    captureOpens: 0,
    capturesSaved: 0,
    portfolioViews: 0,
    reportViews: 0,
    coachUses: 0,
    pathwayViews: 0,
    topArea: null,
    status: "New" as const,
    recentActivity: [],
    activity30: [],
    ...overrides,
  };
}

function dashboard(customers: FounderDashboardData["customers"]): FounderDashboardData {
  return {
    generatedAt: NOW,
    productActivityAvailable: true,
    today: { newFamilies: 0, activeFamilies: 0, returningFamilies: 0, meaningfulActions: 0 },
    whatChanged: "Nothing changed.",
    trends: { periodLabel: "Last 7 days", summary: "Steady.", items: [] },
    attention: [],
    customers,
    journey: [],
    biggestDrop: null,
    featureUsage: [],
    returnHealth: { activeLast7Days: 0, activeLast30Days: 0, goingQuiet: 0 },
    acquisitionToday: null,
  };
}

describe("Founder Actions", () => {
  it("prioritizes a personal welcome for a genuine new family", () => {
    const actions = buildFounderActions(dashboard([customer()]), new Date(NOW));
    expect(actions[0]).toMatchObject({ kind: "welcome", confidence: "Worth doing now" });
    expect(actions[0].emailDraft?.subject).toBe("Welcome to MyLearna");
  });

  it("offers setup help after the first day when setup is incomplete", () => {
    const actions = buildFounderActions(dashboard([customer({
      joinedAt: "2026-08-19T00:00:00.000Z",
      profileCompleted: false,
      learnerCount: 0,
      status: "Setting up",
    })]), new Date(NOW));
    expect(actions[0]?.kind).toBe("setup-help");
  });

  it("detects first-value friction when planning has not become a capture", () => {
    const actions = buildFounderActions(dashboard([customer({
      joinedAt: "2026-08-18T00:00:00.000Z",
      myDayViews: 3,
      calendarActions: 2,
      lastActiveAt: "2026-08-21T00:00:00.000Z",
      status: "Active",
    })]), new Date(NOW));
    expect(actions[0]?.kind).toBe("first-value-gap");
    expect(actions[0]?.evidence).toContain("0 learning captures saved");
  });

  it("surfaces going-quiet families without pretending to know why", () => {
    const actions = buildFounderActions(dashboard([customer({
      joinedAt: "2026-07-01T00:00:00.000Z",
      lastActiveAt: "2026-08-10T00:00:00.000Z",
      activeDays30: 2,
      status: "Going quiet",
    })]), new Date(NOW));
    expect(actions[0]).toMatchObject({ kind: "going-quiet", confidence: "Worth watching" });
    expect(actions[0]?.why).toMatch(/without assuming|worth checking|natural pause/i);
  });

  it("turns sustained meaningful use into a feedback opportunity", () => {
    const actions = buildFounderActions(dashboard([customer({
      joinedAt: "2026-07-01T00:00:00.000Z",
      lastActiveAt: "2026-08-21T00:00:00.000Z",
      activeDays30: 7,
      capturesSaved: 4,
      portfolioViews: 3,
      reportViews: 1,
      status: "Active",
    })]), new Date(NOW));
    expect(actions[0]).toMatchObject({ kind: "feedback", confidence: "Opportunity" });
  });

  it("caps the daily queue at five and gives each family only its strongest current action", () => {
    const customers = Array.from({ length: 7 }, (_, index) => customer({
      userId: `family-${index}`,
      familyId: `family-row-${index}`,
      displayName: `Family ${index}`,
      email: `family${index}@example.com`,
    }));
    const actions = buildFounderActions(dashboard(customers), new Date(NOW));
    expect(actions).toHaveLength(5);
    expect(new Set(actions.map((action) => action.family.userId)).size).toBe(5);
  });
});
