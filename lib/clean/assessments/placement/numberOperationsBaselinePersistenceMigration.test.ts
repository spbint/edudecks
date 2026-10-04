import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "sql/clean/20261004_number_operations_baseline_persistence_review.sql",
  ),
  "utf8",
);

describe("Number & Operations baseline persistence review migration", () => {
  it("creates separate baseline attempt and response tables without changing pathway status", () => {
    expect(source).toContain(
      "create table if not exists public.assessment_baseline_attempts",
    );
    expect(source).toContain(
      "create table if not exists public.assessment_baseline_responses",
    );
    expect(source).not.toContain("assessment_skill_statuses");
    expect(source).not.toContain("pathway_progress");
  });

  it("uses current family RLS plus same-family learner validation", () => {
    expect(source).toContain("public.is_family_member(family_id)");
    expect(source).toContain("learner.family_id = public.assessment_baseline_attempts.family_id");
    expect(source).toContain("learner.family_id = public.assessment_baseline_responses.family_id");
    expect(source).toContain("Choose a learner from this family.");
  });

  it("keeps the foundation dark while preserving idempotent atomic-save machinery", () => {
    expect(source).toContain("client_submission_id");
    expect(source).toContain("assessment_baseline_attempts_unique_submission");
    expect(source).toContain("mylearna_save_number_operations_baseline");
    expect(source).toContain(
      "revoke all on function public.mylearna_save_number_operations_baseline",
    );
    expect(source).toContain("from authenticated");
    expect(source).not.toMatch(
      /grant execute on function public\.mylearna_save_number_operations_baseline/,
    );
  });

  it("ships as a review-only migration with rollback notes", () => {
    expect(source).toContain("DESIGN / REVIEW MIGRATION ONLY");
    expect(source).toContain("DO NOT APPLY");
    expect(source).toContain("Rollback");
  });
});
