import { beforeEach, describe, expect, it, vi } from "vitest";

const trackCoreJourneyEvent = vi.hoisted(() => vi.fn());

vi.mock("@/lib/clean/analytics/productAnalytics", () => ({
  trackCoreJourneyEvent,
}));

import { trackAppleCalendarEvent } from "@/lib/clean/calendar-integrations/analytics";

describe("Apple Calendar analytics privacy", () => {
  beforeEach(() => trackCoreJourneyEvent.mockReset());

  it("emits only the calendar connection allowlist", () => {
    trackAppleCalendarEvent(
      "apple_calendar_feed_created",
      {
        outcome: "succeeded",
        route: "/my-settings",
        feedUrl: "https://private.example/token.ics",
        token: "secret",
        familyId: "family-secret",
        title: "private learning title",
      } as never,
      "user-1",
    );

    expect(trackCoreJourneyEvent).toHaveBeenCalledWith(
      "apple_calendar_feed_created",
      {
        area: "calendar_connections",
        source: "apple",
        outcome: "succeeded",
        route: "/my-settings",
      },
      "user-1",
    );
    expect(JSON.stringify(trackCoreJourneyEvent.mock.calls)).not.toMatch(
      /token|feedUrl|family-secret|private learning/i,
    );
  });
});
