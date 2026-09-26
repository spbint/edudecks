import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260921102400_allow_classical_assessment_skill_status_subject.sql",
  ),
  "utf8",
).toLowerCase();

const cleanReference = readFileSync(
  join(process.cwd(), "sql/clean/20260524_clean_assessment_pathway_step_columns.sql"),
  "utf8",
).toLowerCase();

describe("MyLearna Classical progress persistence", () => {
  it("allows Classical in the persisted assessment skill status subject constraint", () => {
    expect(migration).toContain(
      "drop constraint if exists assessment_skill_statuses_subject_key_check",
    );
    expect(migration).toContain(
      "add constraint assessment_skill_statuses_subject_key_check",
    );
    expect(migration).toContain("'classical'");
    expect(migration).toContain("'mathematics'");
    expect(migration).toContain("'english'");
    expect(migration).toContain("'science'");
    expect(migration).toContain("'humanities'");
    expect(migration).toContain("'technologies'");
    expect(migration).toContain("'arts'");
    expect(migration).toContain("'health-pe'");
    expect(migration).toContain(
      "validate constraint assessment_skill_statuses_subject_key_check",
    );
  });

  it("keeps the clean rebuild reference aligned with the production migration", () => {
    expect(cleanReference).toContain("'classical'");
    expect(cleanReference).toContain(
      "constraint assessment_skill_statuses_subject_key_check",
    );
  });
});
