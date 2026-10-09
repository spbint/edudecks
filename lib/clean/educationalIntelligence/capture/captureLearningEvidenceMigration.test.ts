import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20261009150337_capture_learning_evidence_v1.sql",
  ),
  "utf8",
);

describe("Capture Learning Evidence migration contract", () => {
  it("links existing governed Capture records rather than creating a media store", () => {
    expect(migration).toContain("create table public.learning_evidence_artifact_links");
    expect(migration).toContain("references public.evidence_entries(id)");
    expect(migration).not.toMatch(/bytea|media_bytes|attachment_content/i);
  });

  it("enforces learner/family ownership and participant linkage", () => {
    expect(migration).toContain("foreign key (family_id, learner_id)");
    expect(migration).toContain("public.evidence_entry_learner_links");
    expect(migration).toContain("public.is_family_member(family_id)");
    expect(migration).toContain("alter table public.learning_evidence_artifact_links enable row level security");
  });

  it("denies anonymous access and does not expose a public write path", () => {
    expect(migration).toContain("from public, anon, authenticated, service_role");
    expect(migration).not.toMatch(/grant .* to anon/i);
    expect(migration).not.toMatch(/grant .* to public/i);
  });

  it("stores human association provenance and relevance, not judgement", () => {
    expect(migration).toContain("assigned_by_user_id");
    expect(migration).toContain("curriculum_mapping_version");
    expect(migration).toContain("confirmed-relevant");
    expect(migration).not.toMatch(/developmental_status|recommendation_id|pathway_mutation|portfolio_inclusion/);
  });

  it("uses invoker functions with an empty search path and immutable link identity", () => {
    expect(migration.match(/security invoker/g)).toHaveLength(2);
    expect(migration.match(/set search_path = ''/g)).toHaveLength(2);
    expect(migration).toContain("Captured evidence construct identity is immutable.");
  });
});
