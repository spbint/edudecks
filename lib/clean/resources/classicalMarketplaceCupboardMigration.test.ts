import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "supabase/migrations/20260921113000_classical_marketplace_cupboard.sql",
  "utf8",
);
const hardeningSource = readFileSync(
  "supabase/migrations/20260921122748_harden_classical_marketplace_cupboard_rpc.sql",
  "utf8",
);
const hardening = readFileSync(
  "supabase/migrations/20260921123000_harden_classical_marketplace_cupboard_rpc.sql",
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

  it("makes save-to-Cupboard atomic, idempotent, and family-scoped", () => {
    expect(source).toContain("mylearna_save_marketplace_resource_to_cupboard");
    expect(source).toContain("public.is_family_member(p_family_id)");
    expect(source).toContain(
      "on conflict (family_id, marketplace_resource_id) do nothing",
    );
    expect(source).toContain("returning id into saved_id");
    expect(source).toContain("if saved_id is null then");
    expect(source).toContain("where family_id = p_family_id");
    expect(source).toContain("and marketplace_resource_id = catalogue_row.id");
    expect(source).toContain("return saved_id;");
  });

  it("runs the family-scoped save RPC as the authenticated caller", () => {
    expect(hardening).toContain(
      "alter function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)",
    );
    expect(hardening).toContain("security invoker");
    expect(hardening).toContain("from public, anon");
    expect(hardening).toContain("to authenticated");
  });

  it("keeps the catalogue save RPC on invoker privileges with anonymous execution denied", () => {
    expect(hardeningSource).toContain(
      "alter function public.mylearna_save_marketplace_resource_to_cupboard(uuid, text)",
    );
    expect(hardeningSource).toContain("security invoker");
    expect(hardeningSource).toContain("from public, anon");
    expect(hardeningSource).toContain("to authenticated, service_role");
    expect(hardeningSource).not.toContain("security definer");
  });

  it("keeps the future Family subscription entitlement identity in catalogue metadata", () => {
    expect(source).toContain("'access_model', 'family_included'");
    expect(source).toContain("'entitlement_key', 'family_subscription'");
    expect(source).toContain("'included_with_family', true");
  });
});
