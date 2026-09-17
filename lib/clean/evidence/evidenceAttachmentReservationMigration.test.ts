import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260917083005_finish_evidence_attachment_reservation_ambiguity.sql",
  ),
  "utf8",
);

describe("evidence attachment reservation migration", () => {
  it("qualifies quota updates without weakening the RPC contract", () => {
    expect(migration).not.toContain("on conflict (family_id, academic_year_id)");
    expect(migration).toContain("on conflict on constraint family_evidence_storage_usage_pkey");
    expect(migration).toContain("update public.family_evidence_storage_usage as usage");
    expect(migration).toContain("where usage.family_id = p_family_id");
    expect(migration).toContain("and usage.academic_year_id = target_year_id");
    expect(migration).toContain("returning usage.* into usage_row");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public, storage");
    expect(migration).toContain("mylearna_runtime_control_enabled('evidence_media_uploads')");
    expect(migration).toContain("mylearna_enforce_mutation_rate_limit");
    expect(migration).toContain("p_byte_size > 10485760");
    expect(migration).toContain("public.is_family_member(p_family_id)");
    expect(migration).toContain("grant execute on function public.mylearna_reserve_evidence_attachment_upload");
  });
});
