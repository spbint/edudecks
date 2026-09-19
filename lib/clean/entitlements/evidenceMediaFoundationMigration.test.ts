import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260919043525_add_media_entitlement_foundation.sql",
  ),
  "utf8",
);
const storageQuotaClient = readFileSync(
  join(process.cwd(), "lib/clean/evidence/storageQuota.ts"),
  "utf8",
);

function migrationSection(start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("media entitlement foundation migration", () => {
  it("creates family/year entitlement facts with immutable period snapshots and current uniqueness", () => {
    expect(source).toContain("create table if not exists public.family_entitlements");
    expect(source).toContain("academic_year_id uuid not null references public.academic_years(id) on delete restrict");
    expect(source).toContain("period_starts_on date not null");
    expect(source).toContain("period_ends_on date not null");
    expect(source).toContain("period_label text not null");
    expect(source).toContain("quota_bytes bigint not null");
    expect(source).toContain("check (quota_bytes > 0)");
    expect(source).toContain("check (entitlement_key = 'evidence_media')");
    expect(source).toContain("status in ('active', 'grace', 'expired', 'revoked')");
    expect(source).toContain("provider in ('manual', 'stripe', 'none')");
    expect(source).toContain("source in ('manual', 'complimentary', 'founding', 'legacy', 'stripe')");
    expect(source).toContain("family_entitlements_one_current_evidence_media_idx");
    expect(source).toContain("status in ('active', 'grace')");
    expect(source).toContain("family_entitlements_provider_reference_idx");
    expect(source).toContain("mylearna_validate_family_entitlement_period");
    expect(source).toContain("academic_year.family_id = new.family_id");
    expect(source).toContain("Entitlement learning year is not available for this family.");
  });

  it("keeps commercial mutation out of normal authenticated client access", () => {
    expect(source).toContain("alter table public.family_entitlements enable row level security");
    expect(source).toContain("alter table public.family_media_assets enable row level security");
    expect(source).toContain("revoke all on table public.family_entitlements from public, anon, authenticated");
    expect(source).toContain("revoke all on table public.family_media_assets from public, anon, authenticated");
    expect(source).toContain("grant all on table public.family_entitlements to service_role");
    expect(source).toContain("public.is_family_member(family_id)");
  });

  it("resolves only family-owned academic years and retains the approved beta compatibility allowance", () => {
    expect(source).toContain("mylearna_resolve_evidence_media_entitlement");
    expect(source).toContain("academic_year.family_id = p_family_id");
    expect(source).toContain("legacy_beta_compatibility");
    expect(source).toContain("262144000::bigint");
    expect(source).toContain("is_compatibility_fallback");
    expect(source).toContain("entitlement_row.status in ('active', 'grace')");
    expect(source).toContain("auth.uid() is null or not public.is_family_member(p_family_id)");
  });

  it("uses explicit entitlement precedence and fails closed for expired or revoked grants", () => {
    const resolver = migrationSection(
      "create or replace function public.mylearna_resolve_evidence_media_entitlement",
      "revoke all on function public.mylearna_resolve_evidence_media_entitlement",
    );

    expect(resolver).toContain("entitlement_row.status in ('active', 'grace')");
    expect(resolver).toContain("entitlement_row.quota_bytes,");
    expect(resolver).toContain("0::bigint,");
    expect(source).toContain("family/year with no explicit entitlement receives the temporary 250 MiB");
    expect(source).toContain("explicit expired or revoked grants fail closed");
    expect(resolver).toContain("'legacy_beta_compatibility'::text,");
    expect(resolver).toContain("262144000::bigint,");
  });

  it("provides a read-only entitlement usage surface without exposing provider references", () => {
    expect(source).toContain("mylearna_get_evidence_media_usage");
    expect(source).toContain("historical_archive_bytes bigint");
    expect(source).toContain("This usage RPC is read-only");
    expect(storageQuotaClient).toContain('rpc("mylearna_get_evidence_media_usage"');
    expect(storageQuotaClient).not.toContain("provider_reference");
    expect(storageQuotaClient).not.toContain("entitlement_id");

    const usageRpc = migrationSection(
      "create or replace function public.mylearna_get_evidence_media_usage",
      "revoke all on function public.mylearna_get_evidence_media_usage",
    );
    expect(usageRpc).toContain("unresolved_legacy_archive_bytes bigint");
    expect(usageRpc).not.toContain("entitlement_id");
    expect(usageRpc).not.toContain("provider_reference");
    expect(usageRpc).toContain("greatest(");
    expect(usageRpc).toContain("resolution.quota_bytes");
  });

  it("preserves reservation-first upload validation, including the 10 MiB attachment ceiling", () => {
    expect(source).toContain("mylearna_reserve_evidence_attachment_upload");
    expect(source).toContain("mylearna_runtime_control_enabled('evidence_media_uploads')");
    expect(source).toContain("mylearna_enforce_mutation_rate_limit(");
    expect(source).toContain("p_byte_size > 10485760");
    expect(source).toContain("Attachment storage path does not match this evidence record.");
    expect(source).toContain("on conflict on constraint family_evidence_storage_usage_pkey do update");
    expect(source).toContain("reserved_bytes = usage.reserved_bytes + p_byte_size");
  });

  it("adds a non-destructive media ledger and deterministic legacy metadata backfill", () => {
    expect(source).toContain("create table if not exists public.family_media_assets");
    expect(source).toContain("lifecycle_status in ('active', 'grace', 'purge_pending', 'purged')");
    expect(source).toContain("asset_source in ('legacy_backfill', 'upload_reservation')");
    expect(source).toContain("zz_mylearna_evidence_media_asset_after_write");
    expect(source).toContain("zz_mylearna_evidence_media_asset_after_delete");
    expect(source).toContain("Deterministic, metadata-only legacy backfill");
    expect(source).not.toMatch(/delete\s+from\s+storage\.objects/i);
    expect(source).not.toMatch(/delete\s+from\s+public\.evidence_entries/i);
  });

  it("validates every populated media-asset relationship and the evidence attachment byte ceiling", () => {
    const validator = migrationSection(
      "create or replace function public.mylearna_validate_family_media_asset",
      "revoke all on function public.mylearna_validate_family_media_asset",
    );

    expect(source).toContain("check (byte_size > 0 and byte_size <= 10485760)");
    expect(validator).toContain("learner.family_id = new.family_id");
    expect(validator).toContain("evidence.family_id = new.family_id");
    expect(validator).toContain("evidence_row.learner_id <> new.learner_id");
    expect(validator).toContain("academic_year.family_id = new.family_id");
    expect(validator).toContain("entitlement.family_id = new.family_id");
    expect(validator).toContain("entitlement.entitlement_key = 'evidence_media'");
    expect(validator).toContain("entitlement_row.academic_year_id <> new.academic_year_id");
    expect(validator).toContain("new.academic_year_id is null");
    expect(source).toContain("mylearna_validate_family_media_asset_before_write");
  });

  it("preserves unresolved grandfathered media outside purge processing without inventing relationships", () => {
    expect(source).toContain("create table if not exists public.family_unresolved_legacy_media_assets");
    expect(source).toContain("unresolved_reason in ('missing_evidence_entry', 'missing_current_owner')");
    expect(source).toContain("preservation_status = 'preserved_unresolved'");
    expect(source).toContain("This table has no purge state by");
    const assetValidator = migrationSection(
      "create or replace function public.mylearna_validate_family_media_asset",
      "revoke all on function public.mylearna_validate_family_media_asset",
    );
    expect(assetValidator).toContain("if new.academic_year_id is not null then");
    expect(source).toContain("Canonical objects with no evidence row are preserved separately");
    expect(source).toContain("current family or learner row is absent");
    expect(source).toContain("'missing_current_owner'");
    expect(source).toContain("left join public.evidence_entries as evidence");
    expect(source).toContain("left join public.family_profiles as family");
    expect(source).toContain("left join public.learners as learner");
    expect(source).toContain("and evidence.id is null");
    expect(source).toContain("unresolved_legacy_archive_bytes");
    expect(source).not.toMatch(/delete\s+from\s+public\.family_unresolved_legacy_media_assets/i);
  });

  it("does not allow ordinary clients to forge ledger or unresolved-preservation rows", () => {
    expect(source).toContain("alter table public.family_unresolved_legacy_media_assets enable row level security");
    expect(source).toContain("revoke all on table public.family_unresolved_legacy_media_assets from public, anon, authenticated");
    expect(source).toContain("grant all on table public.family_unresolved_legacy_media_assets to service_role");
    expect(source).toContain("security definer");
    expect(source).toContain("set search_path = public, storage");
  });

  it("keeps Resource Cupboard and text evidence outside this entitlement foundation", () => {
    expect(source).not.toContain("learning-resources");
    expect(source).not.toContain("family_resource_storage_usage");
    expect(source).not.toContain("mylearna_resource_storage_allowance_bytes");
    expect(source).not.toContain("before insert on public.evidence_entries");
  });
});
