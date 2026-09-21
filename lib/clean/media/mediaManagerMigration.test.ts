import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260921015837_add_family_media_manager_removal.sql"),
  "utf8",
);
const quotaFoundation = readFileSync(
  join(process.cwd(), "supabase/migrations/20260907072856_free_v1_usage_guardrails.sql"),
  "utf8",
);
const usageResolver = readFileSync(
  join(process.cwd(), "supabase/migrations/20260919060938_fix_evidence_media_usage_archive_alias.sql"),
  "utf8",
);

describe("Manage Media migration contract", () => {
  it("detaches only the deleted path and leaves other attachment array members", () => {
    expect(migration).toContain("jsonb_array_elements(p_references) with ordinality");
    expect(migration).toContain("where not public.mylearna_evidence_attachment_matches_path");
    expect(migration).toContain("jsonb_agg(reference.value order by reference.ordinality)");
    expect(migration).toContain("evidence.attachment_urls");
  });

  it("preserves the evidence row, text, metadata and learner participant links", () => {
    expect(migration).toContain("update public.evidence_entries as evidence");
    expect(migration).not.toMatch(/delete\s+from\s+public\.evidence_entries/i);
    expect(migration).not.toMatch(/(update|delete\s+from)\s+public\.evidence_entry_learner_links/i);
    expect(migration).not.toMatch(/what_happened\s*=|observed_on\s*=|title\s*=/i);
  });

  it("purges through the established Storage lifecycle and remains idempotent", () => {
    expect(migration).toContain("create or replace function public.mylearna_mark_evidence_media_asset_purged_from_storage()");
    expect(migration).toContain("where asset.object_path = old.name");
    expect(migration).toContain("asset.lifecycle_status <> 'purged'");
    expect(migration).toContain("purged_at = coalesce(asset.purged_at, now())");
    expect(migration).not.toMatch(/delete\s+from\s+storage\.objects/i);
  });

  it("uses the existing authoritative byte decrement exactly once", () => {
    const deleteFunction = quotaFoundation.slice(
      quotaFoundation.indexOf("create or replace function public.mylearna_apply_storage_delete_to_free_quota()"),
      quotaFoundation.indexOf("create or replace function public.mylearna_apply_storage_update_to_free_quota()"),
    );
    expect(deleteFunction).toContain("usage.used_bytes - coalesce(nullif(actual_size, 0), reservation_row.actual_byte_size, reservation_row.byte_size)");
    expect(deleteFunction).toContain("where usage.family_id = reservation_row.family_id");
    expect(deleteFunction).toContain("and usage.academic_year_id = reservation_row.academic_year_id");
    expect(migration).not.toContain("used_bytes =");
  });

  it("does not inflate current-year remaining quota when historical media is removed", () => {
    expect(usageResolver).toContain("where usage_entry.family_id = p_family_id");
    expect(usageResolver).toContain("usage_entry.academic_year_id = resolution.academic_year_id");
    expect(usageResolver).toContain("historical_media_asset.academic_year_id <> resolution.academic_year_id");
  });
});
