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
    expect(source).toContain(
      "new.sub_element_key = any(attempt.scope_sub_elements)",
    );
    expect(source).toContain(
      "Baseline response does not match its attempt scope.",
    );
    expect(source).toContain(
      "Baseline attempt scope must not contain duplicates.",
    );
    expect(source).toContain(
      "source_route = '/assessments/maths-starting-point'",
    );
    expect(source).toContain("scope_sub_elements text[]");
    expect(source).toContain("expected_sub_elements between 1 and 5");
    expect(source).toContain(
      "cardinality(scope_sub_elements) = expected_sub_elements",
    );
    expect(source).toContain("unresolved_sub_elements <@ scope_sub_elements");
    expect(source).toContain(
      "sub_element_key = 'counting-processes' and progression_level between 1 and 8",
    );
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
    expect(source).toContain(
      "revoke all on public.assessment_baseline_attempts from authenticated",
    );
    expect(source).toContain(
      "revoke all on public.assessment_baseline_responses from authenticated",
    );
    expect(source).not.toMatch(
      /grant (select|insert|update|delete).*assessment_baseline_/i,
    );
    expect(source).toContain("security definer");
    expect(source).toContain(
      "on conflict (family_id, learner_id, client_submission_id)",
    );
  });

  it("ships as a review-only migration with rollback notes", () => {
    expect(source).toContain("DESIGN / REVIEW MIGRATION ONLY");
    expect(source).toContain("DO NOT APPLY");
    expect(source).toContain("Rollback");
  });
});


it("keeps the save RPC dollar-quoted and scope-aware", () => {
  expect(source).toContain(
    "set search_path = public\nas $$\ndeclare",
  );
  expect(source).not.toContain(
    "set search_path = public\nas $\ndeclare",
  );
  expect(source).toContain(
    "scopeSubElements must match expectedSubElements",
  );
  expect(source).toContain(
    "scopeSubElements must not contain duplicates",
  );
  expect(source).toContain(
    "assessedSubElements must fit inside the requested scope",
  );
});


it("requires the embedded profile and evidence snapshots to agree with the attempt scope", () => {
  expect(source).toContain(
    "profileSnapshot scope must match scopeSubElements.",
  );
  expect(source).toContain(
    "evidencePreviewSnapshot scope must match scopeSubElements.",
  );
  expect(source).toContain(
    "profileSnapshot expectedSubElements must match the attempt.",
  );
  expect(source).toContain(
    "evidencePreviewSnapshot expectedSubElements must match the attempt.",
  );
  expect(source).toContain(
    "unresolvedSubElements must stay inside scopeSubElements.",
  );
  expect(source).toContain(
    "A complete baseline must cover its full requested scope.",
  );
});


it("requires every requested area to be assessed or explicitly unresolved", () => {
  expect(source).toContain(
    "assessment_baseline_attempts_scope_resolution_check",
  );
  expect(source).toContain(
    "assessed_sub_elements + cardinality(unresolved_sub_elements)",
  );
  expect(source).toContain(
    "assessment_baseline_attempts_status_resolution_check",
  );
  expect(source).toContain(
    "Baseline unresolved areas must not contain duplicates.",
  );
  expect(source).toContain(
    "unresolvedSubElements must not contain duplicates.",
  );
  expect(source).toContain(
    "Every requested scope area must be assessed or unresolved.",
  );
});
