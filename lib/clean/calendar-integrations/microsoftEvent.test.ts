import { describe, expect, it } from "vitest";
import {
  microsoftCalendarTransactionId,
  toMicrosoftCalendarEvent,
} from "@/lib/clean/calendar-integrations/microsoftEvent";

describe("Microsoft Calendar event projection", () => {
  it("renders date-only events with an exclusive next-day end", () => {
    const event = toMicrosoftCalendarEvent(
      {
        calendarItemId: "item-1",
        title: "Nature study",
        plannedDate: "2026-08-15",
        startsAt: null,
        endsAt: null,
        allDay: true,
        learningArea: "Science",
        version: null,
      },
      "transaction-id",
    );
    expect(event).toEqual({
      subject: "Nature study",
      start: { dateTime: "2026-08-15T00:00:00.0000000", timeZone: "UTC" },
      end: { dateTime: "2026-08-16T00:00:00.0000000", timeZone: "UTC" },
      isAllDay: true,
      categories: ["Science"],
      transactionId: "transaction-id",
    });
  });

  it("uses stored instants in UTC for timed events", () => {
    const event = toMicrosoftCalendarEvent(
      {
        calendarItemId: "item-2",
        title: "Mathematics",
        plannedDate: "2026-08-15",
        startsAt: "2026-08-15T01:15:00+00:00",
        endsAt: "2026-08-15T02:45:00+00:00",
        allDay: false,
        learningArea: null,
        version: "2026-08-15T00:00:00Z",
      },
      "transaction-id",
    );
    expect(event.start).toEqual({
      dateTime: "2026-08-15T01:15:00.000",
      timeZone: "UTC",
    });
    expect(event.end.dateTime).toBe("2026-08-15T02:45:00.000");
  });

  it("has a deterministic provider-safe transaction id", () => {
    const first = microsoftCalendarTransactionId("connection", "item");
    expect(first).toBe(microsoftCalendarTransactionId("connection", "item"));
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(first).not.toContain("connection");
    expect(first).not.toContain("item");
  });

  it("cannot emit descriptions, evidence, learners, reports or URLs", () => {
    const serialized = JSON.stringify(
      toMicrosoftCalendarEvent(
        {
          calendarItemId: "item",
          title: "Approved title",
          plannedDate: "2026-08-15",
          startsAt: null,
          endsAt: null,
          allDay: true,
          learningArea: null,
          version: null,
        },
        "transaction-id",
      ),
    );
    expect(serialized).not.toMatch(
      /description|evidence|learner|reflection|attachment|portfolio|report|https?:/i,
    );
  });
});
