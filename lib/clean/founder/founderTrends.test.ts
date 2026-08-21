import { describe, expect, it } from "vitest";
import type { FounderCustomerBase } from "@/lib/clean/founder/founderCustomers";
import type { FounderProductEvent } from "@/lib/clean/founder/founderPosthog";
import { buildFounderTrendIntelligence } from "@/lib/clean/founder/founderTrends";

const now = new Date("2026-08-21T09:00:00.000Z");

function customer(userId: string, joinedAt: string): FounderCustomerBase {
  return {
    userId,
    familyId: `family-${userId}`,
    email: `${userId}@example.com`,
    joinedAt,
    lastSignInAt: joinedAt,
    familyDisplayName: `${userId} family`,
    countryCode: "AU",
    jurisdictionCode: "TAS",
    learnerCount: 1,
    profileCompleted: true,
  };
}

function event(userId: string, eventName: FounderProductEvent["event"], occurredAt: string): FounderProductEvent {
  return {
    userId,
    event: eventName,
    occurredAt,
    route: null,
    area: null,
  };
}

describe("Founder trend intelligence", () => {
  it("compares the current seven days with the previous seven in plain language", () => {
    const customers = [
      customer("alpha", "2026-08-20T09:00:00.000Z"),
      customer("beta", "2026-08-18T09:00:00.000Z"),
      customer("gamma", "2026-08-10T09:00:00.000Z"),
    ];
    const events = [
      event("alpha", "daily_plan_viewed", "2026-08-20T10:00:00.000Z"),
      event("alpha", "quick_capture_saved", "2026-08-20T10:10:00.000Z"),
      event("beta", "portfolio_viewed", "2026-08-18T10:00:00.000Z"),
      event("gamma", "daily_plan_viewed", "2026-08-10T10:00:00.000Z"),
    ];

    const result = buildFounderTrendIntelligence(customers, events, true, now);
    const active = result.items.find((item) => item.label === "Active families");
    const capture = result.items.find((item) => item.label === "Quick Capture");

    expect(active).toMatchObject({ current: 2, previous: 1, status: "Growing" });
    expect(capture).toMatchObject({ current: 1, previous: 0, status: "New" });
    expect(result.summary).toContain("More families are using MyLearna");
    expect(result.summary).toContain("Quick Capture is reaching more families");
  });

  it("uses waiting language rather than technical analytics jargon when product activity is not connected", () => {
    const result = buildFounderTrendIntelligence(
      [customer("alpha", "2026-08-20T09:00:00.000Z")],
      [],
      false,
      now,
    );

    const active = result.items.find((item) => item.label === "Active families");
    expect(active).toMatchObject({ current: null, previous: null, status: "Waiting" });
    expect(result.summary).toContain("private activity feed");
    expect(JSON.stringify(result)).not.toMatch(/distinct_id|HogQL|DAU|cohort/i);
  });

  it("does not count events for accounts omitted from the eligible customer set", () => {
    const result = buildFounderTrendIntelligence(
      [customer("genuine", "2026-08-20T09:00:00.000Z")],
      [
        event("genuine", "quick_capture_saved", "2026-08-20T10:00:00.000Z"),
        event("synthetic", "quick_capture_saved", "2026-08-20T10:05:00.000Z"),
      ],
      true,
      now,
    );

    const capture = result.items.find((item) => item.label === "Quick Capture");
    expect(capture).toMatchObject({ current: 1, previous: 0 });
  });
});
