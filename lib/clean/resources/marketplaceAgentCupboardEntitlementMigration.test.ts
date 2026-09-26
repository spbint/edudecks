import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "supabase/migrations/20260926141000_marketplace_agent_cupboard_entitlements.sql",
  "utf8",
);

describe("Agent Marketplace -> Resource Cupboard entitlement bridge", () => {
  it("creates a family-scoped paid Marketplace entitlement authority", () => {
    expect(source).toContain("create table if not exists public.family_marketplace_entitlements");
    expect(source).toContain("marketplace_resource_id uuid not null references public.marketplace_resources");
    expect(source).toContain("where status = 'active'");
    expect(source).toContain("family marketplace entitlements select own family");
    expect(source).toContain("public.is_family_member(family_id)");
  });

  it("allows first-party, free-testing and family-included resources but gates paid resources", () => {
    expect(source).toContain("catalogue.source = 'mylearna'");
    expect(source).toContain("'free_testing'");
    expect(source).toContain("'family_included'");
    expect(source).toContain("catalogue.metadata ->> 'access_model' = 'paid'");
    expect(source).toContain("public.family_marketplace_entitlements");
  });

  it("enforces the access rule in both the save RPC and the authoritative insert trigger", () => {
    const helperCall =
      "public.mylearna_family_can_access_marketplace_resource";
    expect(source.match(new RegExp(helperCall, "g"))?.length).toBeGreaterThanOrEqual(3);
    expect(source).toContain("create or replace function public.mylearna_validate_family_resource()");
    expect(source).toContain("create or replace function public.mylearna_save_marketplace_resource_to_cupboard");
    expect(source).toContain("source in ('mylearna', 'mylearna_agent')");
  });

  it("keeps entitlement grants server-only for later Stripe completion", () => {
    expect(source).toContain("mylearna_grant_marketplace_entitlement");
    expect(source).toContain("metadata ->> 'access_model' = 'paid'");
    expect(source).toContain("from public, anon, authenticated");
    expect(source).toContain("to service_role");
  });
});
