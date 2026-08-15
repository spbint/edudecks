import { beforeEach, describe, expect, it, vi } from "vitest";

const { trackCoreJourneyEvent } = vi.hoisted(() => ({
  trackCoreJourneyEvent: vi.fn(),
}));

vi.mock("@/lib/clean/analytics/productAnalytics", () => ({
  trackCoreJourneyEvent,
}));

import { trackGoogleCalendarEvent } from "@/lib/clean/calendar-integrations/googleAnalytics";

describe("Google Calendar analytics privacy", () => {
  beforeEach(() => trackCoreJourneyEvent.mockClear());

  it("emits only allowlisted enum-safe properties", () => {
    trackGoogleCalendarEvent(
      "google_calendar_connection_succeeded",
      {
        outcome: "succeeded",
        route: "/my-settings",
        viewportCategory: "phone",
      },
    );
    expect(trackCoreJourneyEvent).toHaveBeenCalledWith(
      "google_calendar_connection_succeeded",
      {
        area: "calendar_connections",
        source: "google",
        outcome: "succeeded",
        route: "/my-settings",
        viewportCategory: "phone",
      },
    );
    const serialized = JSON.stringify(trackCoreJourneyEvent.mock.calls[0]);
    for (const sensitive of [
      "refresh_token",
      "access_token",
      "family_id",
      "calendar_item_id",
      "external_event_id",
      "learner",
      "filename",
      "email",
    ]) {
      expect(serialized).not.toContain(sensitive);
    }
  });
});
