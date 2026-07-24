import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "sql/20260725_intelligence_privileges_v1.sql"), "utf8").toLowerCase();

const tables = [
  "intelligence_ideas",
  "intelligence_idea_sources",
  "intelligence_lesson_plans",
  "intelligence_unit_plans",
  "intelligence_lesson_sequences",
  "intelligence_resource_requirements",
  "intelligence_plan_versions",
  "intelligence_family_owned_resources",
  "intelligence_recommendation_interaction_events",
  "intelligence_commerce_resource_mappings",
  "intelligence_learning_baskets",
  "intelligence_learning_basket_items",
  "intelligence_commerce_events",
];

describe("intelligence least-privilege migration contract", () => {
  it("revokes inherited access from anon and grants service_role explicitly", () => {
    expect(migration).toMatch(/revoke all privileges on table[\s\S]*from public, anon, authenticated, service_role;/);
    for (const table of tables) expect(migration).toContain(`public.${table}`);
    expect(migration).toMatch(/grant all privileges on table[\s\S]*to service_role;/);
  });

  it("preserves owner RLS and basket-item parent ownership", () => {
    for (const table of [
      "intelligence_ideas", "intelligence_idea_sources", "intelligence_lesson_plans", "intelligence_unit_plans",
      "intelligence_lesson_sequences", "intelligence_resource_requirements", "intelligence_plan_versions",
      "intelligence_family_owned_resources", "intelligence_learning_baskets",
    ]) {
      expect(migration).toMatch(new RegExp(`on public\\.${table} for all to authenticated[\\s\\S]*user_id = auth\\.uid\\(\\)`));
    }
    expect(migration).toMatch(/intelligence basket items select own basket[\s\S]*exists \([\s\S]*intelligence_learning_baskets b[\s\S]*b\.user_id = auth\.uid\(\)/);
  });

  it("restricts append-only events to the required operations", () => {
    expect(migration).toMatch(/grant select, insert on table[\s\S]*intelligence_recommendation_interaction_events[\s\S]*to authenticated;/);
    expect(migration).toMatch(/grant insert on table[\s\S]*intelligence_commerce_events[\s\S]*to authenticated;/);
    expect(migration).toMatch(/intelligence recommendation events insert own[\s\S]*for insert to authenticated[\s\S]*user_id = auth\.uid\(\)/);
    expect(migration).toMatch(/intelligence commerce events insert own[\s\S]*for insert to authenticated[\s\S]*user_id = auth\.uid\(\)/);
  });

  it("requires admin app metadata for mapping writes while allowing authenticated reads", () => {
    expect(migration).toMatch(/grant select, insert, update, delete on table[\s\S]*intelligence_commerce_resource_mappings[\s\S]*to authenticated;/);
    expect(migration).toMatch(/intelligence commerce mappings read authenticated[\s\S]*for select to authenticated[\s\S]*using \(true\)/);
    expect(migration).toMatch(/intelligence commerce mappings admin insert[\s\S]*app_metadata[\s\S]*role[\s\S]*admin/);
    expect(migration).toMatch(/intelligence commerce mappings admin update[\s\S]*app_metadata[\s\S]*role[\s\S]*admin/);
    expect(migration).toMatch(/intelligence commerce mappings admin delete[\s\S]*app_metadata[\s\S]*role[\s\S]*admin/);
  });

  it("documents privilege inspection and server-only service-role usage", () => {
    expect(migration).toContain("has_table_privilege");
    expect(migration).toContain("must never be placed in next_public_*");
    expect(migration).toMatch(/server-only repository using[\s\S]*service_role/);
  });
});
