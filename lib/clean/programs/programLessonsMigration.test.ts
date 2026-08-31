import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260831073110_add_program_lessons.sql"),
  "utf8",
);

describe("program_lessons migration contract", () => {
  it("creates a durable, family-owned ordered lesson table with RLS", () => {
    expect(migration).toContain("create table if not exists public.program_lessons");
    expect(migration).toContain("family_id uuid not null references public.family_profiles(id)");
    expect(migration).toContain("foreign key (family_id, program_id)");
    expect(migration).toContain("unique (program_id, position) deferrable initially immediate");
    expect(migration).toContain("alter table public.program_lessons enable row level security");
    expect(migration).toContain('"clean program lessons select own family"');
    expect(migration).toContain('"clean program lessons insert own family"');
    expect(migration).toContain('"clean program lessons update own family"');
    expect(migration).toContain('"clean program lessons delete own family"');
  });

  it("uses program-row locking and complete order validation for append/reorder/remove", () => {
    expect(migration).toContain("clean_append_program_lessons");
    expect(migration).toContain("clean_reorder_program_lessons");
    expect(migration).toContain("clean_remove_program_lesson");
    expect(migration).toContain("for update");
    expect(migration).toContain("Lesson order does not match this program.");
    expect(migration).toContain("set constraints program_lessons_program_position_key deferred");
  });

  it("does not introduce assignment, calendar, completion, or attainment state", () => {
    expect(migration).not.toMatch(/learner_program_assignments|calendar_items|assessment_skill_statuses|completed_at/i);
  });
});
