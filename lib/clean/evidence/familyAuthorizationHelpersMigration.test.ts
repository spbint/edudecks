import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260917083821_repair_family_authorization_helpers.sql",
  ),
  "utf8",
).toLowerCase();

const verifier = readFileSync(
  join(process.cwd(), "supabase/security/verify_20260916_security_hardening.sql"),
  "utf8",
).toLowerCase();

describe("family authorization helper repair migration", () => {
  it("repairs both profile helper overloads against the current family model", () => {
    expect(
      migration.match(
        /create or replace function public\.mylearna_family_profile_owned_by_auth\(/g,
      ),
    ).toHaveLength(2);
    expect(migration).toContain("fp.created_by_user_id = auth.uid()");
    expect(migration).toContain("public.is_family_member(fp.id)");
    expect(migration).toContain("fp.id::text = pg_catalog.btrim(target_family_profile_id)");
    expect(migration).not.toMatch(/\bfp\.(?:user_id|owner_user_id)\b/);
  });

  it("keeps the privileged helpers unavailable to anonymous callers", () => {
    expect(migration).toContain(
      "revoke all on function public.mylearna_family_profile_owned_by_auth(uuid)",
    );
    expect(migration).toContain(
      "revoke all on function public.mylearna_family_profile_owned_by_auth(text)",
    );
    expect(migration).toContain(
      "revoke all on function public.mylearna_evidence_storage_object_owned_by_auth(text)",
    );
    expect(migration).toContain("from public, anon");
    expect(migration).toContain("to authenticated, service_role");
  });

  it("binds evidence authorization to the complete canonical storage path", () => {
    expect(migration).toContain("pg_catalog.array_length(object_path.segments, 1) = 6");
    expect(migration).toContain("ee.family_id::text = object_path.segments[2]");
    expect(migration).toContain("ee.learner_id::text = object_path.segments[4]");
    expect(migration).toContain("ee.id::text = object_path.segments[6]");
    expect(migration).toContain("public.is_family_member(ee.family_id)");
  });

  it("extends the read-only verifier with semantic and tamper checks", () => {
    expect(verifier).toContain("$verify_family_authorization_helpers$");
    expect(verifier).toContain("a current family member was denied by a repaired profile helper");
    expect(verifier).toContain("a family member crossed into an unrelated family profile");
    expect(verifier).toContain("evidence storage accepted a tampered family path segment");
    expect(verifier).toContain("evidence storage accepted a tampered learner path segment");
    expect(verifier).toContain("set transaction read only");
    expect(verifier).toContain("rollback;");
  });
});
