import { beforeEach, describe, expect, it, vi } from "vitest";

const { trackCoreJourneyEvent } = vi.hoisted(() => ({
  trackCoreJourneyEvent: vi.fn(),
}));

vi.mock("@/lib/clean/analytics/productAnalytics", () => ({
  trackCoreJourneyEvent,
}));

import { trackMicrosoftCalendarEvent } from "@/lib/clean/calendar-integrations/microsoftAnalytics";

describe("Microsoft Calendar analytics privacy", () => {
  beforeEach(() => trackCoreJourneyEvent.mockClear());

  it("emits only the calendar analytics allowlist", () => {
    trackMicrosoftCalendarEvent("microsoft_calendar_connection_succeeded", {
      outcome: "succeeded",
      route: "/my-settings",
      viewportCategory: "phone",
    });
    expect(trackCoreJourneyEvent).toHaveBeenCalledWith(
      "microsoft_calendar_connection_succeeded",
      {
        area: "calendar_connections",
        source: "microsoft",
        outcome: "succeeded",
        route: "/my-settings",
        viewportCategory: "phone",
      },
    );
    expect(JSON.stringify(trackCoreJourneyEvent.mock.calls[0])).not.toMatch(
      /token|secret|family_id|calendar_item_id|external_event|learner|email|title|filename/i,
    );
  });
});
