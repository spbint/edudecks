import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const client = readFileSync(join(process.cwd(), "lib/clean/calendar/client.ts"), "utf8");
const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260910100000_add_calendar_pathway_context.sql"),
  "utf8",
);

describe("Calendar Pathways provenance", () => {
  it("stores explicit canonical context and leaves ordinary items null", () => {
    expect(client).toContain("pathway_step_id: payload.pathway_step_id ?? null");
    expect(client).toContain('"pathwayStepId" in input');
    expect(migration).toContain("pathway_step_id text null");
  });

  it("does not infer or backfill historical context", () => {
    expect(client).not.toMatch(/normalizeLearningAreaLabel|stepTitle.*calendarItem\.title/);
    expect(migration).not.toMatch(/update public\.calendar_items|insert into public\.calendar_items/i);
  });

  it("keeps pathway context when editing an unrelated field", () => {
    const updateSection = client.slice(client.indexOf("export async function updateCleanCalendarItem"));
    expect(updateSection).toContain("Object.entries(sanitizeCalendarItemInput(input))");
    expect(updateSection).toContain(".update(payload)");
    expect(updateSection).not.toContain("pathway_step_id: null");
  });
});
