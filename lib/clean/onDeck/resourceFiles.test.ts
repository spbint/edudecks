import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isAllowedResourcePdf, RESOURCE_FILE_MAX_BYTES, RESOURCE_STORAGE_ALLOWANCE_BYTES } from "@/lib/clean/onDeck/resourceFiles";

const migration = readFileSync("supabase/migrations/20260913090000_custom_learning_pdf_resources.sql", "utf8");

function file(name: string, type: string, size: number) {
  return { name, type, size } as File;
}

describe("custom learning PDF resources", () => {
  it("keeps the V1 PDF client guardrails explicit", () => {
    expect(isAllowedResourcePdf(file("lesson.pdf", "application/pdf", 100))).toBe(true);
    expect(isAllowedResourcePdf(file("lesson.pdf", "text/plain", 100))).toBe(false);
    expect(isAllowedResourcePdf(file("lesson.pdf", "application/pdf", RESOURCE_FILE_MAX_BYTES + 1))).toBe(false);
    expect(RESOURCE_STORAGE_ALLOWANCE_BYTES).toBe(524288000);
  });

  it("defines additive private storage, quota, reservation, and association security", () => {
    expect(migration).toContain("'learning-resources', 'learning-resources', false, 26214400");
    expect(migration).toContain("array['application/pdf']");
    expect(migration).toContain("create table if not exists public.family_resource_files");
    expect(migration).toContain("create table if not exists public.family_resource_storage_usage");
    expect(migration).toContain("create table if not exists public.resource_file_upload_reservations");
    expect(migration).toContain("resource_type in ('web_link', 'reference', 'file')");
    expect(migration).toContain("resource_type = 'file' and resource_file_id is not null");
    expect(migration).toContain("mylearna_reserve_resource_file_upload");
    expect(migration).toContain("mylearna_apply_resource_storage_insert");
    expect(migration).toContain("mylearna_apply_resource_storage_delete");
    expect(migration).toContain("mylearna_runtime_control_enabled('resource_file_uploads')");
    expect(migration).toContain("resource_file_upload_reservation");
    expect(migration).toContain("mylearna learning resources insert reserved");
    expect(migration).toContain("mylearna learning resources select family");
    expect(migration).toContain("family_resource_storage_usage_capacity_check");
    expect(migration).not.toContain("family_evidence_storage_usage");
  });
});
