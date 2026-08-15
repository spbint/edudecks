import { createHash } from "node:crypto";
import type { CalendarEventProjection } from "@/lib/clean/calendar-integrations/types";

const CALENDAR_NAME = "MyLearna Homeschool";
const PRODID = "-//MyLearna//Homeschool Calendar//EN";

export function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function foldIcsLine(line: string) {
  const segments: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const character of line) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (current && currentBytes + characterBytes > limit) {
      segments.push(current);
      current = character;
      currentBytes = characterBytes;
      limit = 74;
    } else {
      current += character;
      currentBytes += characterBytes;
    }
  }

  segments.push(current);
  return segments.join("\r\n ");
}

function formatDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return value.replace(/-/g, "");
}

function followingDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString().slice(0, 10).replace(/-/g, "");
}

function formatUtcTimestamp(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function stableUid(calendarItemId: string) {
  const digest = createHash("sha256")
    .update(`mylearna-calendar-item:${calendarItemId}`, "utf8")
    .digest("hex");
  return `${digest}@calendar.mylearna.com`;
}

function sequenceFromVersion(version: string | null) {
  if (!version) return 0;
  const parsed = Date.parse(version);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(2147483647, Math.floor(parsed / 1000)));
}

function renderEvent(event: CalendarEventProjection, generatedAt: string) {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${stableUid(event.calendarItemId)}`,
    `DTSTAMP:${formatUtcTimestamp(event.version) || generatedAt}`,
  ];
  const plannedDate = formatDateOnly(event.plannedDate);
  const timedStart = event.allDay ? null : formatUtcTimestamp(event.startsAt);
  const timedEnd = event.allDay ? null : formatUtcTimestamp(event.endsAt);

  if (timedStart) {
    lines.push(`DTSTART:${timedStart}`);
    if (timedEnd) lines.push(`DTEND:${timedEnd}`);
  } else if (plannedDate) {
    lines.push(`DTSTART;VALUE=DATE:${plannedDate}`);
    lines.push(`DTEND;VALUE=DATE:${followingDate(event.plannedDate)}`);
  } else {
    return [];
  }

  lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
  if (event.learningArea) {
    lines.push(`CATEGORIES:${escapeIcsText(event.learningArea)}`);
  }
  lines.push(`SEQUENCE:${sequenceFromVersion(event.version)}`);
  lines.push("END:VEVENT");
  return lines;
}

export function renderICalendar(
  events: CalendarEventProjection[],
  generatedAt = new Date().toISOString(),
) {
  const generatedTimestamp = formatUtcTimestamp(generatedAt);
  if (!generatedTimestamp) {
    throw new Error("A valid calendar generation timestamp is required.");
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(CALENDAR_NAME)}`,
    ...[...events]
      .sort(
        (left, right) =>
          left.plannedDate.localeCompare(right.plannedDate) ||
          left.calendarItemId.localeCompare(right.calendarItemId),
      )
      .flatMap((event) => renderEvent(event, generatedTimestamp)),
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
