import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isAllowedResourcePdf, RESOURCE_FILE_MAX_BYTES, RESOURCE_STORAGE_ALLOWANCE_BYTES } from "@/lib/clean/onDeck/resourceFiles";

const migration = readFileSync("supabase/migrations/20260913090000_custom_learning_pdf_resources.sql", "utf8");
const finalisationMigration = readFileSync("supabase/migrations/20260913100000_allow_reserved_pdf_resource_upload_finalisation.sql", "utf8");

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

  it("models Storage finalisation as an idempotent reserved-to-used transition", () => {
    type State = { status: "reserved" | "uploaded" | "released"; declared: number; actual: number | null; reserved: number; used: number; file: "pending" | "ready" | "deleted" };
    const finalize = (state: State, actual: number): State => state.status !== "reserved"
      ? state
      : { ...state, status: "uploaded", actual, reserved: state.reserved - state.declared, used: state.used + actual, file: "ready" };
    const release = (state: State): State => state.status === "reserved"
      ? { ...state, status: "released", reserved: Math.max(0, state.reserved - state.declared), file: "deleted" }
      : state;
    const initial: State = { status: "reserved", declared: 9316926, actual: null, reserved: 9316926, used: 0, file: "pending" };
    const uploaded = finalize(initial, 8890000);
    expect(uploaded).toMatchObject({ status: "uploaded", actual: 8890000, reserved: 0, used: 8890000, file: "ready" });
    expect(finalize(uploaded, 8890000)).toEqual(uploaded);
    expect(release(initial)).toMatchObject({ status: "released", reserved: 0, used: 0, file: "deleted" });
    expect(release(uploaded)).toEqual(uploaded);
  });

  it("allows only exact reserved resource-object metadata finalisation", () => {
    expect(finalisationMigration).toContain('create policy "mylearna learning resources update reserved"');
    expect(finalisationMigration).toContain("for update");
    expect(finalisationMigration).toContain("reservation.created_by_user_id = auth.uid()");
    expect(finalisationMigration).toContain("file_row.object_path = name");
    expect(finalisationMigration).toContain("file_row.status in ('pending', 'ready')");
    expect(finalisationMigration).toContain("reservation.status in ('reserved', 'uploaded')");
    expect(finalisationMigration).not.toContain("using (true)");
  });
});
