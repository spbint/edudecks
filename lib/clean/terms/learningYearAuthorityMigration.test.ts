import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260921084848_add_learning_year_authority_foundation.sql",
);
const migration = fs.readFileSync(migrationPath, "utf8");
const termsClient = fs.readFileSync(path.join(process.cwd(), "lib/clean/terms/client.ts"), "utf8");
const calendar = fs.readFileSync(path.join(process.cwd(), "app/components/clean/CleanCalendarWorkspace.tsx"), "utf8");

describe("Learning Year authority foundation migration contract", () => {
  it("adds nullable timezone authority without treating compatibility suggestions as confirmation", () => {
    expect(migration).toContain("add column if not exists time_zone text");
    expect(migration).toContain("add column if not exists time_zone_confirmed_at timestamptz");
    expect(migration).toContain("pg_catalog.pg_timezone_names");
    expect(migration).toContain("time_zone_confirmed_at = null");
    expect(migration).not.toMatch(/set\s+time_zone_confirmed_at\s*=\s*now\(\)[\s\S]*from suggestions/i);
  });

  it("keeps existing geography defaults compatible without making them destructive authority", () => {
    expect(migration).toMatch(/when 'NSW' then 'Australia\/Sydney'/);
    expect(migration).toMatch(/when 'TX' then 'America\/Chicago'/);
    expect(migration).toContain("time_zone_confirmed_at = null");
  });

  it("aligns strict dates and prevents inclusive family overlaps", () => {
    expect(migration).toContain("check (ends_on > starts_on)");
    expect(migration).toContain("create extension if not exists btree_gist");
    expect(migration).toContain("exclude using gist");
    expect(migration).toContain("daterange(starts_on, ends_on, '[]') with &&");
  });

  it("provides explicitly transitional current-year resolution and a confirmation-gated cutoff", () => {
    expect(migration).toContain("mylearna_resolve_current_academic_year");
    expect(migration).toContain("at time zone academic_year.time_zone");
    expect(migration).toContain("else coalesce(p_at, now())::date");
    expect(migration).toContain("'legacy_date'");
    expect(migration).toContain("Never use resolution_source other than confirmed_timezone for purge");
    expect(migration).toContain("mylearna_learning_year_cutoff_utc");
    expect(migration).toContain("p_time_zone_confirmed_at is null");
    expect(migration).toContain("(p_ends_on + 1)::timestamp at time zone p_time_zone");
  });

  it("adds governed RPCs without revoking the old live application's direct CRUD", () => {
    expect(migration).toContain("mylearna_create_academic_year");
    expect(migration).toContain("mylearna_update_academic_year");
    expect(migration).toContain("mylearna_delete_academic_year");
    expect(migration).not.toMatch(/revoke\s+(insert|update|delete|insert,\s*update,\s*delete)[^;]*academic_years[^;]*authenticated/i);
    expect(termsClient).toContain('supabase.rpc("mylearna_create_academic_year"');
    expect(termsClient).toContain('supabase.rpc("mylearna_update_academic_year"');
    expect(termsClient).toContain('supabase.rpc("mylearna_delete_academic_year"');
  });

  it("allows exactly one dependent unconfirmed timezone confirmation or correction", () => {
    for (const dependency of [
      "family_media_assets",
      "evidence_attachment_upload_reservations",
      "billing_checkout_intents",
      "family_entitlements",
    ]) {
      expect(migration).toContain(dependency);
    }
    const guard = migration.slice(
      migration.indexOf("create or replace function public.mylearna_guard_academic_year_authority"),
      migration.indexOf("drop trigger if exists mylearna_academic_year_authority_before_write"),
    );
    expect(guard).toContain("old.time_zone_confirmed_at is not null");
    expect(guard).toContain("new.time_zone_confirmed_at is null");
    expect(guard).toContain("Confirm the corrected learning year timezone when saving it.");
    expect(guard).toContain("new.starts_on is distinct from old.starts_on");
    expect(guard).toContain("new.ends_on is distinct from old.ends_on");
    expect(guard).toContain("new.family_id is distinct from old.family_id");
    expect(guard).toContain("new.country_code is distinct from old.country_code");
    expect(guard).not.toContain("new.title is distinct from old.title");
    expect(guard).toContain("return old");
    expect(migration).toContain("cannot be deleted because media or billing activity already belongs to it");
  });

  it("defers entitlement, reservation, DML, and lifecycle hardening to Phase A2", () => {
    expect(migration).not.toContain("create or replace function public.mylearna_resolve_evidence_media_entitlement");
    expect(migration).not.toContain("mylearna_current_year_before_media_reservation");
    expect(migration).not.toContain("mylearna_require_current_year_for_media_reservation");
    expect(migration).not.toMatch(/revoke\s+(insert|update|delete|insert,\s*update,\s*delete)[^;]*academic_years/i);
    expect(migration).not.toMatch(/delete\s+from\s+(storage\.objects|public\.evidence_entries|public\.family_media_assets)/i);
    expect(migration).not.toMatch(/cron\.schedule|purge_after\s*=|lifecycle_status\s*=\s*'purge_pending'/i);
    expect(migration).toContain("Phase A2 hardening is deliberately deferred");
    expect(migration).toContain("revoke direct academic_years");
    expect(migration).toContain("cut entitlement and reservation authority over");
    expect(migration).toContain("remove the legacy-date fallback");
  });

  it("is additive and preserves old live Calendar, setup, checkout, media, Manage Media, and text Capture database contracts", () => {
    expect(migration).toContain("add column if not exists time_zone text");
    expect(migration).not.toMatch(/time_zone\s+text\s+not\s+null/i);
    expect(migration).not.toMatch(/revoke\s+(insert|update|delete|insert,\s*update,\s*delete)[^;]*academic_years/i);
    expect(migration).not.toContain("create or replace function public.mylearna_resolve_evidence_media_entitlement");
    expect(migration).not.toContain("mylearna_current_year_before_media_reservation");
    expect(migration).not.toMatch(/(?:before|after)\s+(?:insert|update|delete)[^;]*public\.evidence_entries/i);
    expect(migration).not.toMatch(/delete\s+from\s+public\.evidence_entries/i);
  });

  it("adds explicit timezone confirmation UX", () => {
    expect(calendar).toContain("Learning year timezone");
    expect(calendar).toContain("Used to determine the start and end of this learning year.");
    expect(calendar).toContain("confirmTimeZone: true");
  });
});
