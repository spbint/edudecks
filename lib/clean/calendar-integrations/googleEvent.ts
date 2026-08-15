import { createHash } from "node:crypto";
import type { GoogleEventBody } from "@/lib/clean/calendar-integrations/googleApi";
import type { CalendarEventProjection } from "@/lib/clean/calendar-integrations/types";

function followingDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("invalid_planned_date");
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function sequenceFromVersion(value: string | null) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.min(2147483647, Math.floor(timestamp / 1000)));
}

export function googleCalendarEventId(connectionId: string, calendarItemId: string) {
  return createHash("sha256")
    .update(`mylearna-google-event:${connectionId}:${calendarItemId}`, "utf8")
    .digest("hex");
}

export function toGoogleCalendarEvent(
  event: CalendarEventProjection,
  eventId: string,
): GoogleEventBody {
  const base = {
    id: eventId,
    summary: event.title,
    sequence: sequenceFromVersion(event.version),
    reminders: { useDefault: true },
  };
  if (event.allDay) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.plannedDate)) {
      throw new Error("invalid_planned_date");
    }
    return {
      ...base,
      start: { date: event.plannedDate },
      end: { date: followingDate(event.plannedDate) },
    };
  }

  const startsAt = event.startsAt ? new Date(event.startsAt) : null;
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;
  if (
    !startsAt ||
    !endsAt ||
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    endsAt.getTime() <= startsAt.getTime()
  ) {
    throw new Error("invalid_time_range");
  }
  return {
    ...base,
    start: { dateTime: startsAt.toISOString() },
    end: { dateTime: endsAt.toISOString() },
  };
}
