import { describe, expect, it } from "vitest";
import { buildFounderBehaviourIntelligence } from "@/lib/clean/founder/founderBehaviour";
import type { FounderDashboardData } from "@/lib/clean/founder/founderDashboard";

function customer(overrides: Partial<FounderDashboardData["customers"][number]> = {}) {
  return {
    userId: "family-1",
    familyId: "family-row-1",
    email: "parent@example.com",
    joinedAt: "2026-08-22T00:10:00.000Z",
    lastSignInAt: "2026-08-22T00:40:00.000Z",
    familyDisplayName: "Example Family",
    countryCode: "AU",
    jurisdictionCode: "TAS",
    learnerCount: 2,
    profileCompleted: true,
    displayName: "Example Family",
    lastActiveAt: "2026-08-22T00:40:00.000Z",
    activeDays30: 3,
    myDayViews: 2,
    calendarActions: 1,
    captureOpens: 1,
    capturesSaved: 0,
    portfolioViews: 0,
    reportViews: 0,
    coachUses: 0,
    pathwayViews: 0,
    topArea: "My Day",
    status: "New" as const,
    recentActivity: [
      { occurredAt: "2026-08-22T00:40:00.000Z", label: "Planned learning in Calendar" },
      { occurredAt: "2026-08-22T00:30:00.000Z", label: "Opened My Day" },
    ],
    ...overrides,
  };
}

function dashboard(customers: FounderDashboardData["customers"]): FounderDashboardData {
  return {
    generatedAt: "2026-08-22T01:00:00.000Z",
    productActivityAvailable: true,
    today: { newFamilies: 1, activeFamilies: 1, returningFamilies: 0, meaningfulActions: 1 },
    whatChanged: "1 new family joined today.",
    trends: { periodLabel: "Last 7 days", summary: "Steady.", items: [] },
    attention: [],
    customers,
    journey: [
      { label: "Joined", count: customers.length, percent: 1 },
      { label: "Set up family", count: customers.length, percent: 1 },
      { label: "Planned learning", count: customers.length, percent: 1 },
      { label: "Saved first capture", count: 0, percent: 0 },
      { label: "Viewed Portfolio", count: 0, percent: 0 },
      { label: "Reached Reports", count: 0, percent: 0 },
    ],
    biggestDrop: "Planned learning → Saved first capture",
    featureUsage: [{ label: "My Day", users: customers.length, actions: 2 }],
    returnHealth: { activeLast7Days: customers.length, activeLast30Days: customers.length, goingQuiet: 0 },
    acquisitionToday: { Direct: 1 },
  };
}

describe("Founder behaviour intelligence", () => {
  it("turns headline counts into who-level drill-down groups", () => {
    const result = buildFounderBehaviourIntelligence(dashboard([customer()]));
    expect(result.todayDetails.newFamilies.map((family) => family.displayName)).toEqual(["Example Family"]);
    expect(result.todayDetails.activeFamilies).toHaveLength(1);
    expect(result.todayDetails.learningActions[0]).toMatchObject({
      displayName: "Example Family",
      label: "Planned learning in Calendar",
    });
  });

  it("summarizes repeat use and stickiness without percentage inflation", () => {
    const result = buildFounderBehaviourIntelligence(dashboard([
      customer(),
      customer({ userId: "family-2", displayName: "Second Family", activeDays30: 1 }),
    ]));
    expect(result.engagement.activeLast30Days).toBe(2);
    expect(result.engagement.repeatFamilies).toBe(1);
    expect(result.engagement.regularFamilies).toBe(1);
    expect(result.engagement.repeatRate).toBe(0.5);
    expect(result.engagement.averageActiveDays).toBe(2);
  });

  it("identifies the exact families between adjacent journey stages", () => {
    const result = buildFounderBehaviourIntelligence(dashboard([customer()]));
    const drop = result.journeyDrops.find((item) => item.to === "Saved first capture");
    expect(drop?.count).toBe(1);
    expect(drop?.families[0].displayName).toBe("Example Family");
  });

  it("summarizes recent cross-feature paths and preserves the family behind them", () => {
    const result = buildFounderBehaviourIntelligence(dashboard([customer()]));
    expect(result.observedPaths[0]).toMatchObject({ from: "My Day", to: "Calendar" });
    expect(result.observedPaths[0].families[0].displayName).toBe("Example Family");
  });

  it("uses the complete 30-day activity stream for exact actions and paths", () => {
    const result = buildFounderBehaviourIntelligence(dashboard([
      customer({
        recentActivity: [{ occurredAt: "2026-08-22T00:50:00.000Z", label: "Saved a learning capture" }],
        activity30: [
          { occurredAt: "2026-08-22T00:50:00.000Z", label: "Saved a learning capture" },
          { occurredAt: "2026-08-22T00:40:00.000Z", label: "Planned learning in Calendar" },
          { occurredAt: "2026-08-22T00:30:00.000Z", label: "Opened My Day" },
        ],
      }),
    ]));

    expect(result.todayDetails.learningActions.map((item) => item.label)).toEqual([
      "Saved a learning capture",
      "Planned learning in Calendar",
    ]);
    expect(result.observedPaths.map((path) => `${path.from} → ${path.to}`)).toEqual([
      "My Day → Calendar",
      "Calendar → Quick Capture",
    ]);
  });

  it("calls out when repeat engagement is concentrated in one family", () => {
    const result = buildFounderBehaviourIntelligence(dashboard([
      customer({ activeDays30: 16 }),
      customer({ userId: "family-2", displayName: "Second Family", activeDays30: 1 }),
      customer({ userId: "family-3", displayName: "Third Family", activeDays30: 1 }),
      customer({ userId: "family-4", displayName: "Fourth Family", activeDays30: 1 }),
      customer({ userId: "family-5", displayName: "Fifth Family", activeDays30: 1 }),
    ]));

    expect(result.founderRead).toContain("Current repeat engagement is concentrated in one family");
    expect(result.founderRead).toContain("the other 4 active families have each used MyLearna on one day");
  });

  it("labels a repeated one-family path as a within-family pattern rather than broad behaviour", () => {
    const result = buildFounderBehaviourIntelligence(dashboard([
      customer({
        activity30: [
          { occurredAt: "2026-08-22T00:10:00.000Z", label: "Opened My Day" },
          { occurredAt: "2026-08-22T00:20:00.000Z", label: "Planned learning in Calendar" },
          { occurredAt: "2026-08-22T00:30:00.000Z", label: "Opened My Day" },
          { occurredAt: "2026-08-22T00:40:00.000Z", label: "Saved a Calendar plan" },
        ],
      }),
      customer({ userId: "family-2", displayName: "Second Family", recentActivity: [], activity30: [], activeDays30: 1 }),
    ]));

    expect(result.observedPaths[0]).toMatchObject({ from: "My Day", to: "Calendar", count: 2 });
    expect(result.founderRead).toContain("repeated within-family pattern");
    expect(result.founderRead).toContain("should not yet be read as a broad customer pattern");
  });
});
