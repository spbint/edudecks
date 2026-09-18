import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").toLowerCase();

const migration = read(
  "supabase/migrations/20260917095615_contain_legacy_storage_owner_policies.sql",
);
const verifier = read("supabase/security/verify_20260916_security_hardening.sql");
const evidenceStorage = read("lib/familyEvidence.ts");
const evidenceClient = read("lib/clean/evidence/client.ts");
const resourceStorage = read("lib/clean/onDeck/resourceFiles.ts");

describe("legacy Storage owner-policy containment", () => {
  it("removes only the four bucket-agnostic owner policies", () => {
    expect(migration.match(/drop policy if exists/g)).toHaveLength(4);
    expect(migration).toContain('drop policy if exists "users can access own files"');
    expect(migration).toContain('drop policy if exists "users can delete own files"');
    expect(migration).toContain('drop policy if exists "users can update own files"');
    expect(migration).toContain('drop policy if exists "users can upload own files"');
    expect(migration).not.toMatch(/drop policy if exists "mylearna/);
    expect(migration).not.toContain("create policy");
  });

  it("fails closed unless every required bucket-specific policy exists", () => {
    for (const policy of [
      "mylearna evidence storage insert own",
      "mylearna evidence storage select own",
      "mylearna evidence storage update own",
      "mylearna evidence storage delete own",
      "mylearna learning resources insert reserved",
      "mylearna learning resources select family",
      "mylearna learning resources update reserved",
    ]) {
      expect(migration).toContain(`policy.policyname = '${policy}'`);
    }

    expect(migration).toContain("mylearna_evidence_attachment_upload_reserved");
    expect(migration).toContain("mylearna_evidence_storage_object_owned_by_auth");
    expect(migration).toContain("mylearna_resource_file_upload_reserved");
    expect(migration).toContain("policy.roles @> array['authenticated']::name[]");
    expect(migration).toContain("rls must remain enabled on storage.objects");
  });

  it("preserves the supported evidence upload and deletion lifecycle", () => {
    const reserveIndex = evidenceStorage.indexOf("reservefamilyevidenceattachmentupload({");
    const uploadIndex = evidenceStorage.indexOf(".upload(objectpath");
    const deleteStart = evidenceClient.indexOf("export async function deletecleanevidenceentry");
    const deleteSource = evidenceClient.slice(deleteStart);

    expect(reserveIndex).toBeGreaterThan(-1);
    expect(uploadIndex).toBeGreaterThan(reserveIndex);
    expect(evidenceStorage).toContain(".remove(paths)");
    expect(deleteSource.indexOf("await removefamilyevidencefiles(storagepaths)")).toBeGreaterThan(-1);
    expect(deleteSource.indexOf("await removefamilyevidencefiles(storagepaths)")).toBeLessThan(
      deleteSource.indexOf(".delete()"),
    );
    expect(migration).not.toMatch(/delete\s+from\s+storage\.objects/i);
  });

  it("preserves reserved PDF upload and family-scoped read paths", () => {
    const reserveIndex = resourceStorage.indexOf('supabase.rpc("mylearna_reserve_resource_file_upload"');
    const uploadIndex = resourceStorage.indexOf(".upload(row.object_path");

    expect(reserveIndex).toBeGreaterThan(-1);
    expect(uploadIndex).toBeGreaterThan(reserveIndex);
    expect(resourceStorage).toContain(".createsignedurl(objectpath");
  });

  it("extends the read-only verifier without deleting Storage objects", () => {
    expect(verifier).toContain("$verify_storage_policy_containment$");
    expect(verifier).toContain("legacy bucket-agnostic storage owner policy remains");
    expect(verifier).toContain("orphaned evidence object remains visible through the mylearna helper");
    expect(verifier).toContain("set transaction read only");
    expect(verifier).toContain("rollback;");
    expect(verifier).not.toMatch(/delete\s+from\s+storage\.objects/i);
  });
});
