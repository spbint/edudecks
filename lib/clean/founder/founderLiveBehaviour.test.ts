import { describe, expect, it } from "vitest";
import type { FounderCustomerBase } from "@/lib/clean/founder/founderCustomers";
import type { FounderProductEvent, FounderTrackedEventName } from "@/lib/clean/founder/founderPosthog";
import { buildFounderLiveBehaviour } from "@/lib/clean/founder/founderLiveBehaviour";

function customer(userId: string, name: string): FounderCustomerBase {
  return {
    userId,
    familyId: `family-${userId}`,
    email: `${userId}@example.com`,
    joinedAt: "2026-08-20T00:00:00.000Z",
    lastSignInAt: null,
    familyDisplayName: name,
    countryCode: "AU",
    jurisdictionCode: "TAS",
    learnerCount: 1,
    profileCompleted: true,
  };
}

function event(
  userId: string,
  name: FounderTrackedEventName,
  occurredAt: string,
  route: string | null = null,
  area: string | null = null,
): FounderProductEvent {
  return { userId, event: name, occurredAt, route, area };
}

describe("Founder live behaviour", () => {
  it("builds live activity, estimated page dwell, sessions and cautious friction signals", () => {
    const now = new Date("2026-08-22T02:30:00.000Z");
    const customers = [customer("a", "Alpha Family"), customer("b", "Beta Family")];
    const events: FounderProductEvent[] = [
      event("a", "product_signed_in", "2026-08-22T01:55:00.000Z"),
      event("a", "app_page_viewed", "2026-08-22T02:00:00.000Z", "/my-day", "My Day"),
      event("a", "app_page_viewed", "2026-08-22T02:02:00.000Z", "/quick-capture", "Quick Capture"),
      event("a", "quick_capture_opened", "2026-08-22T02:02:10.000Z", "/quick-capture", "Quick Capture"),
      event("a", "app_page_viewed", "2026-08-22T02:04:00.000Z", "/my-day", "My Day"),
      event("b", "product_signed_in", "2026-08-22T02:28:30.000Z"),
      event("b", "app_page_viewed", "2026-08-22T02:29:00.000Z", "/my-portfolio", "Portfolio"),
      event("b", "portfolio_viewed", "2026-08-22T02:29:05.000Z", "/my-portfolio", "Portfolio"),
      event("synthetic", "app_page_viewed", "2026-08-22T02:29:30.000Z", "/my-day", "My Day"),
    ];

    const result = buildFounderLiveBehaviour(customers, events, now, true);

    expect(result.available).toBe(true);
    expect(result.activeNow.map((family) => family.displayName)).toEqual(["Beta Family"]);
    expect(result.last30Minutes).toEqual({ sessions: 2, pageMovements: 4, meaningfulActions: 1 });
    expect(result.recentSessions).toHaveLength(2);

    const alpha = result.recentSessions.find((session) => session.displayName === "Alpha Family");
    expect(alpha?.activeNow).toBe(false);
    expect(alpha?.bottlenecks.map((item) => item.kind)).toEqual(["capture-abandoned", "navigation-loop"]);
    expect(alpha?.events.find((item) => item.route === "/my-day")?.estimatedPageSeconds).toBe(120);

    expect(result.signals.map((signal) => signal.kind).sort()).toEqual(["capture-abandoned", "navigation-loop"]);
    expect(result.signals.every((signal) => signal.families.includes("Alpha Family"))).toBe(true);
  });

  it("starts a new behaviour session after thirty minutes without tracked activity", () => {
    const now = new Date("2026-08-22T02:00:00.000Z");
    const customers = [customer("a", "Alpha Family")];
    const events = [
      event("a", "product_signed_in", "2026-08-22T00:00:00.000Z"),
      event("a", "app_page_viewed", "2026-08-22T00:10:00.000Z", "/my-day", "My Day"),
      event("a", "app_page_viewed", "2026-08-22T01:00:01.000Z", "/my-portfolio", "Portfolio"),
    ];

    const result = buildFounderLiveBehaviour(customers, events, now, true);
    expect(result.recentSessions).toHaveLength(2);
  });

  it("does not call an unfinished capture a bottleneck while the family is still active", () => {
    const now = new Date("2026-08-22T02:30:00.000Z");
    const customers = [customer("a", "Alpha Family")];
    const events = [
      event("a", "app_page_viewed", "2026-08-22T02:29:00.000Z", "/quick-capture", "Quick Capture"),
      event("a", "quick_capture_opened", "2026-08-22T02:29:30.000Z", "/quick-capture", "Quick Capture"),
    ];

    const result = buildFounderLiveBehaviour(customers, events, now, true);
    expect(result.activeNow).toHaveLength(1);
    expect(result.recentSessions[0]?.bottlenecks).toEqual([]);
    expect(result.signals).toEqual([]);
  });
});
