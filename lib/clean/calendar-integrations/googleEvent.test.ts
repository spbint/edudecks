import { describe, expect, it } from "vitest";
import {
  googleCalendarEventId,
  toGoogleCalendarEvent,
} from "@/lib/clean/calendar-integrations/googleEvent";
import type { CalendarEventProjection } from "@/lib/clean/calendar-integrations/types";

function projection(overrides: Partial<CalendarEventProjection> = {}): CalendarEventProjection {
  return {
    calendarItemId: "11111111-1111-4111-8111-111111111111",
    title: "Fractions, ratios; and \\ patterns\nnext line",
    plannedDate: "2026-08-15",
    startsAt: null,
    endsAt: null,
    allDay: true,
    learningArea: "Mathematics",
    version: "2026-08-15T08:00:00.000Z",
    ...overrides,
  };
}

describe("Google Calendar event mapping", () => {
  it("uses a stable opaque provider-valid event ID", () => {
    const first = googleCalendarEventId("connection-1", "item-1");
    expect(first).toBe(googleCalendarEventId("connection-1", "item-1"));
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toContain("item-1");
  });

  it("maps all-day items with an exclusive next-day end", () => {
    const event = toGoogleCalendarEvent(projection(), "event-id");
    expect(event.start).toEqual({ date: "2026-08-15" });
    expect(event.end).toEqual({ date: "2026-08-16" });
    expect(event.summary).toContain("Fractions");
    expect(event).not.toHaveProperty("description");
    expect(JSON.stringify(event)).not.toContain("calendarItemId");
    expect(JSON.stringify(event)).not.toContain("Mathematics");
  });

  it("maps stored timed instants to UTC without fabricating a timezone", () => {
    const event = toGoogleCalendarEvent(
      projection({
        allDay: false,
        startsAt: "2026-08-15T09:00:00+10:00",
        endsAt: "2026-08-15T10:15:00+10:00",
      }),
      "event-id",
    );
    expect(event.start).toEqual({ dateTime: "2026-08-14T23:00:00.000Z" });
    expect(event.end).toEqual({ dateTime: "2026-08-15T00:15:00.000Z" });
    expect(event.start).not.toHaveProperty("timeZone");
  });

  it("rejects partial or inverted timed ranges", () => {
    expect(() =>
      toGoogleCalendarEvent(
        projection({ allDay: false, startsAt: "2026-08-15T09:00:00Z" }),
        "event-id",
      ),
    ).toThrow("invalid_time_range");
  });
});
