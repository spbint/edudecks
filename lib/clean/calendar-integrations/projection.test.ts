import { describe, expect, it } from "vitest";
import { projectCalendarItem } from "@/lib/clean/calendar-integrations/projection";

describe("external calendar event projection", () => {
  it("projects only the provider-neutral allowlist", () => {
    const projection = projectCalendarItem({
      id: "calendar-item-1",
      title: "Nature study",
      plannedDate: "2026-08-18",
      startsAt: null,
      endsAt: null,
      learningArea: "Science",
      updatedAt: "2026-08-15T01:02:03.000Z",
      description: "private note",
      learner_id: "learner-secret",
      learnerName: "Private Learner",
      reflection: "private reflection",
      attachmentUrl: "https://private.example/file",
      evidence: { text: "private evidence" },
      portfolio: { note: "private portfolio" },
    } as Parameters<typeof projectCalendarItem>[0] & Record<string, unknown>);

    expect(projection).toEqual({
      calendarItemId: "calendar-item-1",
      title: "Nature study",
      plannedDate: "2026-08-18",
      startsAt: null,
      endsAt: null,
      allDay: true,
      learningArea: "Science",
      version: "2026-08-15T01:02:03.000Z",
    });
    expect(JSON.stringify(projection)).not.toMatch(
      /private|learner|reflection|attachment|evidence|portfolio/i,
    );
  });

  it("uses the existing both-times-null all-day convention", () => {
    expect(
      projectCalendarItem({
        id: "1",
        title: "Timed",
        plannedDate: "2026-08-18",
        startsAt: "2026-08-18T01:00:00.000Z",
        endsAt: "2026-08-18T02:00:00.000Z",
        learningArea: null,
        updatedAt: null,
      }).allDay,
    ).toBe(false);
  });
});
