import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const migration = read(
  "supabase/migrations/20260815072411_calendar_schema_baseline_reconciliation.sql",
);
const resetSchema = read("sql/clean/20260507_clean_family_schema_reset_install_v2.sql");
const repairSchema = read("sql/clean/20260506_clean_family_schema_v4_repair_install.sql");
const calendarClient = read("lib/clean/calendar/client.ts");
const quickCaptureWorkspace = read("app/components/clean/CleanQuickCaptureWorkspace.tsx");
const unifiedCapture = read("lib/clean/evidence/unifiedCapture.ts");

const marketplaceDefinition = /create table if not exists public\.marketplace_resources \([\s\S]*?\n\);/;

describe("calendar schema baseline reconciliation", () => {
  it("records the authoritative Marketplace resource shape without speculative fields", () => {
    for (const source of [migration, resetSchema, repairSchema]) {
      const table = source.match(marketplaceDefinition)?.[0] ?? "";

      expect(table).toContain("id uuid primary key default gen_random_uuid()");
      expect(table).toContain("source text default 'shopify'");
      expect(table).toContain("external_product_id text not null");
      expect(table).toContain("external_variant_id text");
      expect(table).toContain("handle text not null");
      expect(table).toContain("title text not null");
      expect(table).toContain("thumbnail_url text");
      expect(table).toContain("marketplace_area text");
      expect(table).toContain("primary_collection text");
      expect(table).toContain("subcollection text");
      expect(table).toContain("resource_format text");
      expect(table).toContain("is_active boolean default true");
      expect(table).toContain("metadata jsonb default '{}'::jsonb");
      expect(table).toContain("created_at timestamptz default now()");
      expect(table).toContain("updated_at timestamptz default now()");
      expect(table).not.toMatch(/\b(description|learner_id|family_id)\b/);
    }
  });

  it("keeps both calendar columns nullable with their authoritative types", () => {
    expect(migration).toContain("add column if not exists completed_at timestamptz");
    expect(migration).toContain("add column if not exists marketplace_resource_id uuid");
    expect(migration).toContain("alter column completed_at drop not null");
    expect(migration).toContain("alter column marketplace_resource_id drop not null");

    for (const source of [resetSchema, repairSchema]) {
      expect(source).toMatch(/marketplace_resource_id uuid(?: null)?[,;]/);
      expect(source).toMatch(/completed_at timestamptz(?: null)?[,;]/);
      expect(source).not.toMatch(/marketplace_resource_id uuid not null/);
      expect(source).not.toMatch(/completed_at timestamptz not null/);
    }
  });

  it("uses a catalog-equivalent ON DELETE SET NULL foreign-key guard", () => {
    expect(migration).toContain("from pg_constraint constraint_row");
    expect(migration).toContain("constraint_row.contype = 'f'");
    expect(migration).toContain("constraint_row.conrelid = 'public.calendar_items'::regclass");
    expect(migration).toContain(
      "constraint_row.confrelid = 'public.marketplace_resources'::regclass",
    );
    expect(migration).toContain(
      "constraint_row.conkey = array[calendar_marketplace_attnum]::smallint[]",
    );
    expect(migration).toContain(
      "constraint_row.confkey = array[marketplace_id_attnum]::smallint[]",
    );
    expect(migration).toContain("constraint_row.confdeltype = 'n'");
    expect(migration).not.toMatch(/if not exists[\s\S]{0,240}conname/);
    expect(migration).toContain("foreign key (marketplace_resource_id)");
    expect(migration).toContain("references public.marketplace_resources(id)");
    expect(migration).toContain("on delete set null");
  });

  it("does not duplicate an equivalent single-column btree index", () => {
    expect(migration).toContain("from pg_index index_row");
    expect(migration).toContain("index_row.indnkeyatts = 1");
    expect(migration).toContain("index_row.indnatts = 1");
    expect(migration).toContain("index_row.indexprs is null");
    expect(migration).toContain("index_row.indpred is null");
    expect(migration).toContain("access_method.amname = 'btree'");
    expect(migration).toContain("calendar_marketplace_attnum = any(index_row.indkey)");
    expect(migration).toContain("create index idx_calendar_items_marketplace_resource_id");
    expect(migration).toContain("on public.calendar_items using btree (marketplace_resource_id)");
  });

  it("is rerunnable against an already reconciled database", () => {
    expect(migration).toContain("create extension if not exists pgcrypto");
    expect(migration).toContain("create table if not exists public.marketplace_resources");
    expect(migration.match(/add column if not exists/g)).toHaveLength(2);
    expect(migration.match(/if not exists \(/g)?.length).toBeGreaterThanOrEqual(2);
    expect(migration).toContain(
      "to_regclass('public.idx_calendar_items_marketplace_resource_id') is not null",
    );
    expect(migration).toContain("A conflicting Marketplace foreign key already exists");
    expect(migration).toContain(
      "Index name idx_calendar_items_marketplace_resource_id is already used by a different index definition",
    );
  });

  it("keeps the current reset and repair references aligned", () => {
    for (const source of [resetSchema, repairSchema]) {
      expect(source).toContain("foreign key (marketplace_resource_id)");
      expect(source).toContain("references public.marketplace_resources(id)");
      expect(source).toContain("on delete set null");
      expect(source).toContain("idx_calendar_items_marketplace_resource_id");
      expect(source).toContain("using btree (marketplace_resource_id)");
    }
  });

  it("preserves Marketplace linkage in the existing calendar client", () => {
    expect(calendarClient).toContain("marketplace_resource_id?: string | null");
    expect(calendarClient).toContain(
      "marketplaceResourceId: normalizeNullString(row.marketplace_resource_id)",
    );
    expect(calendarClient).toContain("marketplace_resource_id,completed_at");
  });

  it("keeps Quick Capture independent from calendar completion mutations", () => {
    for (const source of [quickCaptureWorkspace, unifiedCapture]) {
      expect(source).not.toContain('.from("calendar_items")');
      expect(source).not.toContain("updateCleanCalendarItem");
      expect(source).not.toContain("completed_at");
      expect(source).not.toContain("completedAt");
    }
  });
});
