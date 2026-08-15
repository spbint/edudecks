import { createHash } from "node:crypto";
import type { MicrosoftEventBody } from "@/lib/clean/calendar-integrations/microsoftApi";
import type { CalendarEventProjection } from "@/lib/clean/calendar-integrations/types";

function followingDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("invalid_planned_date");
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function graphUtcDateTime(value: Date) {
  return value.toISOString().replace(/Z$/, "");
}

export function microsoftCalendarTransactionId(
  connectionId: string,
  calendarItemId: string,
) {
  const hash = createHash("sha256")
    .update(`mylearna-microsoft-event:${connectionId}:${calendarItemId}`, "utf8")
    .digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function toMicrosoftCalendarEvent(
  event: CalendarEventProjection,
  transactionId: string,
): MicrosoftEventBody {
  const categories = event.learningArea ? [event.learningArea] : undefined;
  if (event.allDay) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.plannedDate)) {
      throw new Error("invalid_planned_date");
    }
    return {
      subject: event.title,
      start: {
        dateTime: `${event.plannedDate}T00:00:00.0000000`,
        timeZone: "UTC",
      },
      end: {
        dateTime: `${followingDate(event.plannedDate)}T00:00:00.0000000`,
        timeZone: "UTC",
      },
      isAllDay: true,
      categories,
      transactionId,
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
    subject: event.title,
    start: { dateTime: graphUtcDateTime(startsAt), timeZone: "UTC" },
    end: { dateTime: graphUtcDateTime(endsAt), timeZone: "UTC" },
    isAllDay: false,
    categories,
    transactionId,
  };
}
