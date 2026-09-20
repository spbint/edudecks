import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const historicalFoundation = readSource(
  "supabase/migrations/20260919043525_add_media_entitlement_foundation.sql",
);
const launchMigration = readSource(
  "supabase/migrations/20260920052324_add_multi_currency_media_billing.sql",
);
const usageRpc = readSource(
  "supabase/migrations/20260919060938_fix_evidence_media_usage_archive_alias.sql",
);
const storageQuotaClient = readSource("lib/clean/evidence/storageQuota.ts");
const entitlementConstants = readSource("lib/clean/entitlements/evidenceMedia.ts");

function resolverSection(source: string) {
  const start = source.lastIndexOf("create or replace function public.mylearna_resolve_evidence_media_entitlement");
  const end = source.indexOf("revoke all on function public.mylearna_resolve_evidence_media_entitlement", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("launch Free evidence media allowance migration", () => {
  it("keeps the historical 250 MiB beta migration as an accurate record", () => {
    expect(historicalFoundation).toContain("'legacy_beta_compatibility'::text,");
    expect(historicalFoundation).toContain("262144000::bigint,");
  });

  it("replaces only the active resolver with an implicit 5 MiB family/year Free allowance", () => {
    const resolver = resolverSection(launchMigration);
    expect(resolver).toContain("'free'::text,");
    expect(resolver).toContain("5242880::bigint,");
    expect(resolver).toContain("target_year.starts_on");
    expect(resolver).toContain("target_year.ends_on");
    expect(resolver).not.toContain("262144000::bigint");
    expect(resolver).not.toMatch(/insert\s+into\s+public\.family_entitlements/i);
  });

  it("preserves paid precedence and fails closed for expired or revoked explicit grants", () => {
    const resolver = resolverSection(launchMigration);
    expect(resolver).toContain("entitlement_row.status in ('active', 'grace')");
    expect(resolver).toContain("entitlement_row.quota_bytes,");
    expect(resolver).toContain("0::bigint,");
    expect(resolver).toContain("if entitlement_row.id is not null then");
    expect(resolver).toContain("if target_year.id is null then");
  });

  it("keeps over-quota historical media non-destructive and clamps remaining capacity to zero", () => {
    expect(usageRpc).toContain("from public.mylearna_resolve_evidence_media_entitlement(p_family_id, p_observed_on)");
    expect(usageRpc).toContain("greatest(\n      0::bigint,");
    expect(`${launchMigration}\n${usageRpc}`).not.toMatch(/delete\s+from\s+public\.(family_media_assets|family_evidence_storage_usage)/i);
  });

  it("keeps the client fallback and resolver grant surface aligned to Free media", () => {
    expect(storageQuotaClient).toContain("FREE_FAMILY_MEDIA_ALLOWANCE_BYTES");
    expect(storageQuotaClient).toContain('entitlementSource: safe(row.entitlement_source) || "free"');
    expect(entitlementConstants).toContain("FREE_EVIDENCE_MEDIA_ALLOWANCE_BYTES = 5 * 1024 * 1024");
    expect(entitlementConstants).not.toContain("LEGACY_BETA_EVIDENCE_MEDIA_ALLOWANCE_BYTES");
    expect(launchMigration).toContain("grant execute on function public.mylearna_resolve_evidence_media_entitlement(uuid, date)\n  to authenticated");
  });
});
