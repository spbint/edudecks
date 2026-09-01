import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260901073906_materialize_program_lessons_from_master_week.sql"),
  "utf8",
);

describe("Program occurrence migration contract", () => {
  it("uses an assignment-linked Master Week block and immutable occurrence snapshots", () => {
    expect(migration).toContain("add column learner_program_assignment_id uuid null");
    expect(migration).toContain("create table public.program_occurrences");
    expect(migration).toContain("program_lesson_id uuid not null");
    expect(migration).toContain("lesson_position_snapshot integer not null");
    expect(migration).toContain("program_title_snapshot text not null");
    expect(migration).toContain("lesson_title_snapshot text not null");
    expect(migration).toContain("unique (calendar_item_id)");
    expect(migration).toContain("unique (learner_program_assignment_id, program_lesson_id)");
  });

  it("serializes allocation and explicitly restricts the mutation RPC", () => {
    expect(migration).toContain("for update;");
    expect(migration).toContain("security definer");
    expect(migration).toContain("revoke all on function public.clean_allocate_program_occurrence(uuid, uuid, uuid) from public");
    expect(migration).toContain("revoke all on function public.clean_allocate_program_occurrence(uuid, uuid, uuid) from anon");
    expect(migration).toContain("grant execute on function public.clean_allocate_program_occurrence(uuid, uuid, uuid) to authenticated");
  });
});
