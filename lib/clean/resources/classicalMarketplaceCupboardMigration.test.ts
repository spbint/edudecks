import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "supabase/migrations/20260921113000_classical_marketplace_cupboard.sql",
  "utf8",
);

describe("Classical Marketplace to Resource Cupboard migration", () => {
  it("seeds Encounter 1 as a first-party bundle-ready catalogue asset", () => {
    expect(source).toContain("'mylearna'");
    expect(source).toContain("'MYL-CLASSICAL-Y34-A-U1-E01'");
    expect(source).toContain("'catalogue_kind', 'encounter'");
    expect(source).toContain("'unit_key', 'classical-y3-4-a-u1'");
    expect(source).toContain("'cycle_key', 'classical-y3-4-a'");
    expect(source).toContain("'future_physical_pack_supported', true");
    expect(source).toContain("'pdf_href', '/api/classical/booklets/y3-4-a-u1-e01'");
  });

  it("stores one family pointer to the catalogue item rather than cloning PDF bytes", () => {
    expect(source).toContain("marketplace_resource_id uuid");
    expect(source).toContain("unique (family_id, marketplace_resource_id)");
    expect(source).toContain("'catalogue'");
    expect(source).not.toContain("family_resource_files (");
    expect(source).not.toContain("insert into storage.objects");
  });

  it("makes save-to-Cupboard idempotent and family-scoped", () => {
    expect(source).toContain("mylearna_save_marketplace_resource_to_cupboard");
    expect(source).toContain("public.is_family_member(p_family_id)");
    expect(source).toContain("where family_id = p_family_id");
    expect(source).toContain("and marketplace_resource_id = catalogue_row.id");
    expect(source).toContain("if saved_id is not null then");
    expect(source).toContain("return saved_id;");
  });

  it("keeps the future Family subscription entitlement identity in catalogue metadata", () => {
    expect(source).toContain("'access_model', 'family_included'");
    expect(source).toContain("'entitlement_key', 'family_subscription'");
    expect(source).toContain("'included_with_family', true");
  });
});
