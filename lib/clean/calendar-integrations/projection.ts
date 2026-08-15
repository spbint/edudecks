import type {
  CalendarEventProjection,
  CalendarProjectionSource,
} from "@/lib/clean/calendar-integrations/types";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function nullable(value: unknown) {
  return safe(value) || null;
}

export function projectCalendarItem(
  source: CalendarProjectionSource,
): CalendarEventProjection {
  const startsAt = nullable(source.startsAt);
  const endsAt = nullable(source.endsAt);

  return {
    calendarItemId: safe(source.id),
    title: safe(source.title),
    plannedDate: safe(source.plannedDate),
    startsAt,
    endsAt,
    allDay: startsAt === null && endsAt === null,
    learningArea: nullable(source.learningArea),
    version: nullable(source.updatedAt),
  };
}
