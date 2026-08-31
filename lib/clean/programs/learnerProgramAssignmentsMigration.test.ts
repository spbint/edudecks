import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260831094038_add_learner_program_assignments.sql"),
  "utf8",
);

describe("learner_program_assignments migration contract", () => {
  it("creates a durable, unique same-family Program-to-learner relationship", () => {
    expect(migration).toContain("create table if not exists public.learner_program_assignments");
    expect(migration).toContain("foreign key (family_id, program_id)");
    expect(migration).toContain("foreign key (family_id, learner_id)");
    expect(migration).toContain("unique (program_id, learner_id)");
    expect(migration).toContain("learners_family_id_id_key unique (family_id, id)");
  });

  it("keeps assignments family-private and blocks new assignment to archived Programs", () => {
    expect(migration).toContain("alter table public.learner_program_assignments enable row level security");
    expect(migration).toContain('"clean learner program assignments select own family"');
    expect(migration).toContain('"clean learner program assignments insert own family"');
    expect(migration).toContain('"clean learner program assignments delete own family"');
    expect(migration).toContain("p.status <> 'archived'");
    expect(migration).toContain("revoke all on public.learner_program_assignments from anon");
  });

  it("makes bulk assignment idempotent without adding sequencing or learning-progress state", () => {
    expect(migration).toContain("clean_assign_program_learners");
    expect(migration).toContain("on conflict (program_id, learner_id) do nothing");
    expect(migration).not.toMatch(/current_lesson|completion_percentage|calendar_items|assessment_skill_statuses|evidence_entries/i);
  });
});
