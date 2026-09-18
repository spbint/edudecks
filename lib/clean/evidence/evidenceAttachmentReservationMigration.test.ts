import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260918061041_fix_evidence_storage_trigger_auth_context.sql",
  ),
  "utf8",
);

describe("evidence storage trigger auth-context migration", () => {
  it("preserves RLS auth while authorizing internal trigger work by durable identity", () => {
    expect(migration).not.toContain("on conflict (family_id, academic_year_id)");
    expect(migration).toContain("update public.family_evidence_storage_usage as usage");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public, storage");
    expect(migration).toContain("mylearna_runtime_control_enabled('evidence_media_uploads')");
    expect(migration).not.toContain("create or replace function public.mylearna_evidence_storage_object_owned_by_auth");
    expect(migration).not.toContain("auth.uid()");
    expect(migration).toContain("mylearna_evidence_storage_object_owned_by_user");
    expect(migration).toContain("family_members as fm");
    expect(migration).toContain("fp.created_by_user_id = actor_user_id");
    expect(migration).toContain("grant execute on function public.mylearna_evidence_storage_object_owned_by_user(text, uuid)");
    expect(migration).toContain("status = 'reserved'");
    expect(migration).toContain("expires_at >= now()");
    expect(migration).toContain("reservation_row.created_by_user_id");
    expect(migration).toContain("reservation_row.family_id::text <> path_segments[2]");
    expect(migration).toContain("reservation_row.learner_id::text <> path_segments[4]");
    expect(migration).toContain("reservation_row.evidence_entry_id::text <> path_segments[6]");
    expect(migration).toContain("if actual_size <= 0 then");
    expect(migration).toContain("if new_size <= 0 then");
    expect(migration).toContain("return new;");
    expect(migration).toContain("status = 'uploaded'");
    expect(migration).toContain("actual_byte_size = new_size");
    expect(migration).toContain("reserved_bytes = greatest(0, usage.reserved_bytes - reservation_row.byte_size)");
    expect(migration).toContain("used_bytes = usage.used_bytes + new_size");
    expect(migration).toContain("delta_size := new_size - coalesce(reservation_row.actual_byte_size, old_size)");
    expect(migration).toContain("new_size > 10485760");
    expect(migration).toContain("grant execute on function public.mylearna_apply_storage_insert_to_free_quota");
    expect(migration).toContain("revoke all on function public.mylearna_evidence_storage_object_owned_by_user(text, uuid)");
  });
});
