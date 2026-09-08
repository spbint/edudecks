import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20260908092403_add_on_deck_learning_queue.sql",
  "utf8",
);
const policyRepairMigration = readFileSync(
  "supabase/migrations/20260908094707_repair_on_deck_learning_queue_policies.sql",
  "utf8",
);
const client = readFileSync("lib/clean/onDeck/client.ts", "utf8");

describe("On Deck persistence migration", () => {
  it("creates a family and learner scoped learning queue table", () => {
    expect(migration).toContain("create table if not exists public.learning_queue_items");
    expect(migration).toContain("family_id uuid not null references public.family_profiles");
    expect(migration).toContain("learner_id uuid not null references public.learners");
    expect(migration).toContain("source_type text not null default 'pathway_step'");
  });

  it("prevents duplicate learner/pathway step queue items authoritatively", () => {
    expect(migration).toContain("constraint learning_queue_items_unique_source");
    expect(migration).toContain("unique (family_id, learner_id, source_type, pathway_step_id)");
    expect(client).toContain("isUniqueQueueItemConflict");
  });

  it("uses RLS and does not grant anonymous queue access", () => {
    expect(migration).toContain("alter table public.learning_queue_items enable row level security");
    expect(migration).toContain("revoke all on public.learning_queue_items from anon");
    expect(migration).toContain("to authenticated");
    expect(migration).toContain("public.is_family_member(family_id)");
  });

  it("validates learners belong to the same family at the write boundary", () => {
    expect(migration).toContain("mylearna_validate_learning_queue_item");
    expect(migration).toContain("before insert or update on public.learning_queue_items");
    expect(migration).toContain("learner.family_id = new.family_id");
    expect(migration).toContain("learner.family_id = public.learning_queue_items.family_id");
    expect(policyRepairMigration).toContain(
      "learner.family_id = public.learning_queue_items.family_id",
    );
    expect(migration).toContain("Choose a learner from this family.");
    expect(migration).toContain("On Deck item identity cannot be changed.");
  });

  it("does not introduce Calendar, evidence, assessment, or pathway progress writes", () => {
    expect(client).not.toContain("calendar_items");
    expect(client).not.toContain("evidence_entries");
    expect(client).not.toContain("assessment");
    expect(client).not.toContain("pathway_progress");
    expect(migration).not.toContain("calendar_items");
    expect(migration).not.toContain("public.evidence_entries");
  });
});
