import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260919060938_fix_evidence_media_usage_archive_alias.sql",
  ),
  "utf8",
);

describe("evidence media usage archive alias correction migration", () => {
  it("replaces only the customer usage RPC with its existing public contract", () => {
    expect(source).toContain("create or replace function public.mylearna_get_evidence_media_usage(");
    expect(source).toContain("p_family_id uuid,");
    expect(source).toContain("p_observed_on date default current_date");
    expect(source).toContain("family_id uuid,");
    expect(source).toContain("academic_year_id uuid,");
    expect(source).toContain("entitlement_source text,");
    expect(source).toContain("entitlement_status text,");
    expect(source).toContain("quota_bytes bigint,");
    expect(source).toContain("used_bytes bigint,");
    expect(source).toContain("reserved_bytes bigint,");
    expect(source).toContain("remaining_bytes bigint,");
    expect(source).toContain("historical_archive_bytes bigint,");
    expect(source).toContain("unresolved_legacy_archive_bytes bigint,");
    expect(source).toContain("is_compatibility_fallback boolean");
    expect(source).not.toContain("create table");
    expect(source).not.toContain("alter table");
    expect(source).not.toContain("create policy");
  });

  it("uses distinct archive aliases and removes the invalid unresolved alias reference", () => {
    expect(source).toContain("sum(legacy_media_asset.byte_size)");
    expect(source).toContain("sum(unresolved_media_asset.byte_size)");
    expect(source).toContain("as unresolved_media_asset");
    expect(source).not.toContain("sum(asset.byte_size)");
  });

  it("preserves the usage resolver, hardened execution context, and intended grants", () => {
    expect(source).toContain("from public.mylearna_resolve_evidence_media_entitlement(p_family_id, p_observed_on)");
    expect(source).toContain("security definer");
    expect(source).toContain("set search_path = public");
    expect(source).toContain("revoke all on function public.mylearna_get_evidence_media_usage(uuid, date)");
    expect(source).toContain("from public, anon;");
    expect(source).toContain("grant execute on function public.mylearna_get_evidence_media_usage(uuid, date)");
    expect(source).toContain("to authenticated;");
  });
});
