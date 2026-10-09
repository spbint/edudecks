import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261009102003_learning_evidence_persistence_v1.sql",
  ),
  "utf8",
);

describe("Learning Evidence Persistence V1 migration contract", () => {
  it("defines separate attempt, immutable result and mutable review records", () => {
    expect(migration).toContain("create table public.learning_evidence_attempts");
    expect(migration).toContain("create table public.learning_evidence_results");
    expect(migration).toContain("create table public.learning_evidence_result_reviews");
    expect(migration).toContain("learning_evidence_attempts_identity_key");
    expect(migration).toContain("learning_evidence_results_identity_key");
    expect(migration).toContain("learning_evidence_attempts_append_only");
    expect(migration).toContain("learning_evidence_results_append_only");
  });

  it("indexes tenancy, learner, assessment, continuum, construct, status and time", () => {
    expect(migration).toContain("learning_evidence_attempts_learner_history_idx");
    expect(migration).toContain("learning_evidence_attempts_assessment_history_idx");
    expect(migration).toContain("learning_evidence_results_construct_history_idx");
    expect(migration).toContain("learning_evidence_results_status_idx");
    expect(migration).toMatch(/continuum_id,[\s\S]*construct_id,[\s\S]*evaluated_at desc/);
    expect(migration).toMatch(/developmental_status,[\s\S]*evidence_sufficiency/);
  });

  it("binds every attempt and result to an existing learner in the same family", () => {
    expect(migration).toContain("learners_family_id_id_key unique (family_id, id)");
    expect(migration).toMatch(
      /learning_evidence_attempts_learner_family_fk[\s\S]*foreign key \(family_id, learner_id\)[\s\S]*references public\.learners\(family_id, id\)/,
    );
    expect(migration).toMatch(
      /learning_evidence_results_learner_family_fk[\s\S]*foreign key \(family_id, learner_id\)[\s\S]*references public\.learners\(family_id, id\)/,
    );
    expect(migration).toMatch(
      /learning_evidence_results_attempt_family_learner_fk[\s\S]*foreign key \(family_id, learner_id, attempt_id\)[\s\S]*references public\.learning_evidence_attempts\(family_id, learner_id, id\)/,
    );
    expect(migration).toContain(
      "learning_evidence_result_reviews_result_owner_fk",
    );
  });

  it("enables family-scoped RLS and denies anonymous or browser writes", () => {
    for (const table of [
      "learning_evidence_attempts",
      "learning_evidence_results",
      "learning_evidence_result_reviews",
    ]) {
      expect(migration).toContain(
        `alter table public.${table} enable row level security`,
      );
      expect(migration).toContain(
        `revoke all on table public.${table} from public, anon, authenticated`,
      );
      expect(migration).toContain(`grant select on table public.${table} to authenticated`);
    }
    expect(migration.match(/for insert\s+to authenticated/gi)).toBeNull();
    expect(migration).toContain("(select auth.uid()) is not null");
    expect(migration).toContain("public.is_family_member(family_id)");
  });

  it("keeps the atomic save RPC service-role-only and checks actor ownership", () => {
    expect(migration).toContain("mylearna_save_learning_evidence_results_v1");
    expect(migration).toContain("security invoker");
    expect(migration).toMatch(
      /revoke all on function public\.mylearna_save_learning_evidence_results_v1[\s\S]*from public, anon, authenticated/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.mylearna_save_learning_evidence_results_v1[\s\S]*to service_role/,
    );
    expect(migration).toMatch(
      /family_members[\s\S]*membership\.family_id = p_family_id[\s\S]*membership\.user_id = p_actor_user_id/,
    );
    expect(migration).toContain("Learner does not belong to this family.");
  });

  it("enforces idempotent content equality and atomic five-continuum persistence", () => {
    expect(migration).toContain("canonical_content_hash");
    expect(migration).toContain(
      "Canonical attempt identity conflicts with different educational content.",
    );
    expect(migration).toContain(
      "Canonical result identity conflicts with different educational content.",
    );
    expect(migration).toContain(
      "Number & Operations persistence requires five independent continuum results.",
    );
    expect(migration.trimStart().startsWith("-- Learning Evidence Persistence V1")).toBe(
      true,
    );
    expect(migration).toMatch(/begin;[\s\S]*commit;/);
  });

  it("preserves append-only recommendation history and neutral human defaults", () => {
    expect(migration).toContain("pathway_mutation = 'not-requested'");
    expect(migration).toContain("review_state text not null default 'not-reviewed'");
    expect(migration).toContain(
      "confirmation_state text not null default 'not-confirmed'",
    );
    expect(migration).toContain(
      "portfolio_inclusion text not null default 'not-decided'",
    );
  });
});
