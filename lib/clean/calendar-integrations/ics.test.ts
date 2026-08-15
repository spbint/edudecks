import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  escapeIcsText,
  foldIcsLine,
  renderICalendar,
} from "@/lib/clean/calendar-integrations/ics";
import type { CalendarEventProjection } from "@/lib/clean/calendar-integrations/types";

function event(overrides: Partial<CalendarEventProjection> = {}): CalendarEventProjection {
  return {
    calendarItemId: "private-internal-id-123",
    title: "Maths block",
    plannedDate: "2026-08-18",
    startsAt: null,
    endsAt: null,
    allDay: true,
    learningArea: null,
    version: "2026-08-15T01:02:03.000Z",
    ...overrides,
  };
}

describe("RFC5545 calendar rendering", () => {
  it("renders untimed items as date-only events ending the following day", () => {
    const output = renderICalendar([event()], "2026-08-15T02:03:04.000Z");
    expect(output).toContain("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n");
    expect(output).toContain("X-WR-CALNAME:MyLearna Homeschool\r\n");
    expect(output).toContain("DTSTART;VALUE=DATE:20260818\r\n");
    expect(output).toContain("DTEND;VALUE=DATE:20260819\r\n");
  });

  it("handles next-day boundaries across months and years", () => {
    const output = renderICalendar(
      [event({ plannedDate: "2026-12-31" })],
      "2026-08-15T02:03:04.000Z",
    );
    expect(output).toContain("DTEND;VALUE=DATE:20270101");
  });

  it("renders timed items from stored instants in UTC", () => {
    const output = renderICalendar(
      [
        event({
          allDay: false,
          startsAt: "2026-08-18T09:30:00+10:00",
          endsAt: "2026-08-18T10:45:00+10:00",
        }),
      ],
      "2026-08-15T02:03:04.000Z",
    );
    expect(output).toContain("DTSTART:20260817T233000Z");
    expect(output).toContain("DTEND:20260818T004500Z");
    expect(output).not.toContain("TZID");
  });

  it("escapes text and includes the controlled learning-area category", () => {
    const output = renderICalendar(
      [
        event({
          title: "Read, write; reflect\\review\nnext",
          learningArea: "English;Literacy",
        }),
      ],
      "2026-08-15T02:03:04.000Z",
    );
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
    expect(output).toContain("SUMMARY:Read\\, write\\; reflect\\\\review\\nnext");
    expect(output).toContain("CATEGORIES:English\\;Literacy");
  });

  it("folds long UTF-8 lines at 75 octets without splitting characters", () => {
    const folded = foldIcsLine(`SUMMARY:${"Learning 🌿 学習 ".repeat(20)}`);
    const physicalLines = folded.split("\r\n");
    expect(physicalLines.length).toBeGreaterThan(1);
    expect(physicalLines.slice(1).every((line) => line.startsWith(" "))).toBe(true);
    expect(physicalLines.every((line) => Buffer.byteLength(line, "utf8") <= 75)).toBe(true);
  });

  it("emits DTSTAMP, SEQUENCE, CRLF and multiple same-day events", () => {
    const output = renderICalendar(
      [event({ calendarItemId: "item-a" }), event({ calendarItemId: "item-b" })],
      "2026-08-15T02:03:04.000Z",
    );
    expect(output).toContain("DTSTAMP:20260815T010203Z\r\n");
    expect(output).toMatch(/SEQUENCE:\d+\r\n/);
    expect(output.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(output.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("reflects updates and removal from the source-of-truth projection", () => {
    const initial = renderICalendar([event({ title: "Initial title" })]);
    const updated = renderICalendar([event({ title: "Updated title" })]);
    const removed = renderICalendar([]);
    expect(initial).toContain("SUMMARY:Initial title");
    expect(updated).toContain("SUMMARY:Updated title");
    expect(updated).not.toContain("SUMMARY:Initial title");
    expect(removed).not.toContain("BEGIN:VEVENT");
  });

  it("hashes internal IDs for stable UIDs and emits no private fields", () => {
    const first = renderICalendar([event()], "2026-08-15T02:03:04.000Z");
    const second = renderICalendar([event()], "2026-08-16T02:03:04.000Z");
    const uid = first.match(/UID:([^\r]+)/)?.[1];
    expect(uid).toBeTruthy();
    expect(second).toContain(`UID:${uid}`);
    expect(first).not.toContain("private-internal-id-123");
    expect(first).not.toContain("DESCRIPTION");
    expect(first).not.toMatch(/learner|evidence|portfolio|attachment|reflection/i);
  });

  it("keeps UID stable and increments SEQUENCE when the source version advances", () => {
    const before = renderICalendar([
      event({ version: "2026-08-15T01:02:03.000Z" }),
    ]);
    const after = renderICalendar([
      event({ version: "2026-08-15T01:02:08.000Z" }),
    ]);
    expect(after.match(/UID:([^\r]+)/)?.[1]).toBe(
      before.match(/UID:([^\r]+)/)?.[1],
    );
    expect(Number(after.match(/SEQUENCE:(\d+)/)?.[1])).toBeGreaterThan(
      Number(before.match(/SEQUENCE:(\d+)/)?.[1]),
    );
  });
});
