import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const coreMigration = readFileSync(resolve(process.cwd(), "sql/20260723_intelligence_engine_v1.sql"), "utf8").toLowerCase();
const recommendationMigration = readFileSync(resolve(process.cwd(), "sql/20260724_recommendation_engine_v1.sql"), "utf8").toLowerCase();
const commerceMigration = readFileSync(resolve(process.cwd(), "sql/20260724_shopify_commerce_pilot_v1.sql"), "utf8").toLowerCase();
const privilegeMigration = readFileSync(resolve(process.cwd(), "sql/20260725_intelligence_privileges_v1.sql"), "utf8").toLowerCase();
const schemaMigrations = [coreMigration, recommendationMigration, commerceMigration];
const migration = privilegeMigration;

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

const expectedCoreTables = tables.slice(0, 7);
const expectedRecommendationTables = tables.slice(7, 9);
const expectedCommerceTables = tables.slice(9);
const orderedSchema = schemaMigrations.join("\n");

function identifiersIn(source: string) {
  return [...source.matchAll(/public\.(intelligence_[a-z0-9_]+)/g)].map((match) => match[1]);
}

function uniqueIdentifiers(values: string[]) {
  return [...new Set(values)].sort();
}

function tableDeclarations(source: string) {
  return [...source.matchAll(/create table if not exists public\.(intelligence_[a-z0-9_]+)\s*\(/g)].map((match) => ({
    table: match[1],
    start: match.index ?? 0,
  }));
}

function tableBody(source: string, declaration: { start: number }) {
  const openParen = source.indexOf("(", declaration.start);
  const close = source.indexOf("\n);", openParen);
  return source.slice(openParen + 1, close < 0 ? source.length : close);
}

function referencedKeysForTable(table: string) {
  const keys: string[] = [];
  for (const source of schemaMigrations) {
    const declarations = tableDeclarations(source);
    const declaration = declarations.find((item) => item.table === table);
    if (!declaration) continue;
    const body = tableBody(source, declaration);
    for (const match of body.matchAll(/^\s*([a-z0-9_]+)\s+[^,\n]+\bprimary key\b/gm)) {
      keys.push(match[1]);
    }
    for (const match of body.matchAll(/(?:unique|primary key)\s*\(([^)]+)\)/g)) {
      keys.push(match[1].replace(/\s+/g, ""));
    }
  }

  for (const match of orderedSchema.matchAll(
    new RegExp(`create unique index[\\s\\S]*?on public\\.${table}\\s*\\(([^)]+)\\)`, "g"),
  )) {
    keys.push(match[1].replace(/\s+/g, ""));
  }

  return keys;
}

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

describe("intelligence schema migration contract", () => {
  it("declares the expected tables in migration order", () => {
    expect(uniqueIdentifiers(tableDeclarations(coreMigration).map((item) => item.table))).toEqual(
      [...expectedCoreTables].sort(),
    );
    expect(uniqueIdentifiers(tableDeclarations(recommendationMigration).map((item) => item.table))).toEqual(
      [...expectedRecommendationTables].sort(),
    );
    expect(uniqueIdentifiers(tableDeclarations(commerceMigration).map((item) => item.table))).toEqual(
      [...expectedCommerceTables].sort(),
    );
    expect(uniqueIdentifiers(tableDeclarations(orderedSchema).map((item) => item.table))).toEqual(
      [...tables].sort(),
    );
  });

  it("defines the composite tenant keys required by the foreign keys", () => {
    for (const table of [
      "intelligence_lesson_plans",
      "intelligence_unit_plans",
      "intelligence_lesson_sequences",
    ]) {
      expect(referencedKeysForTable(table)).toContain("id,user_id");
    }
    expect(coreMigration).toMatch(
      /constraint intelligence_lesson_plans_id_user_unique\s+unique\s*\(\s*id\s*,\s*user_id\s*\)/,
    );
    expect(coreMigration).toMatch(
      /constraint intelligence_unit_plans_id_user_unique\s+unique\s*\(\s*id\s*,\s*user_id\s*\)/,
    );
    expect(coreMigration).toMatch(
      /constraint intelligence_lesson_sequences_id_user_unique\s+unique\s*\(\s*id\s*,\s*user_id\s*\)/,
    );
  });

  it("backs every internal foreign key with a primary or unique key and valid ordering", () => {
    const declarations = tableDeclarations(orderedSchema);

    for (const declaration of declarations) {
      const body = tableBody(orderedSchema, declaration);
      for (const match of body.matchAll(
        /foreign key\s*\(([^)]+)\)\s*references\s+public\.([a-z0-9_]+)\s*\(([^)]+)\)/g,
      )) {
        const localColumns = match[1].replace(/\s+/g, "");
        const referencedTable = match[2];
        const referencedColumns = match[3].replace(/\s+/g, "");
        const referencedDeclaration = declarations.find((item) => item.table === referencedTable);
        if (!referencedDeclaration) continue;

        expect(referencedDeclaration.start).toBeLessThan(declaration.start);
        expect(localColumns.split(",").length).toBe(referencedColumns.split(",").length);
        if (localColumns.includes(",")) {
          expect(localColumns.split(",")).toContain("user_id");
          expect(referencedColumns.split(",")).toContain("user_id");
        }
        expect(referencedKeysForTable(referencedTable)).toContain(referencedColumns);
      }
    }
  });

  it("enables RLS on exactly the 13 intelligence tables", () => {
    const rlsTables = uniqueIdentifiers(
      schemaMigrations.flatMap((source) =>
        [...source.matchAll(/alter table public\.(intelligence_[a-z0-9_]+) enable row level security/g)].map(
          (match) => match[1],
        ),
      ),
    );
    expect(rlsTables).toEqual([...tables].sort());
  });

  it("keeps the privilege migration scoped to exactly those 13 tables", () => {
    expect(uniqueIdentifiers(identifiersIn(privilegeMigration))).toEqual([...tables].sort());
  });
});
