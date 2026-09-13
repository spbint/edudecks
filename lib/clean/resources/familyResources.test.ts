import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { familyResourceTypeLabel } from "@/lib/clean/resources/familyResources";

const migration = readFileSync("supabase/migrations/20260913032028_family_resource_cupboard.sql", "utf8");
const quotaMigration = readFileSync("supabase/migrations/20260913041441_align_resource_cupboard_free_quota.sql", "utf8");
const featureFiles = `${readFileSync("lib/clean/onDeck/resourceFiles.ts", "utf8")}\n${readFileSync("lib/clean/onDeck/client.ts", "utf8")}`;

describe("My Resource Cupboard foundation", () => {
  it("keeps the three V1 resource kinds clear", () => {
    expect(familyResourceTypeLabel("web_link")).toBe("Website");
    expect(familyResourceTypeLabel("reference")).toBe("Book / curriculum / reference");
    expect(familyResourceTypeLabel("file")).toBe("PDF");
  });

  it("uses one family resource entity and association pointer", () => {
    expect(migration).toContain("create table if not exists public.family_resources");
    expect(migration).toContain("add column if not exists family_resource_id uuid");
    expect(migration).toContain("family_resource_id uuid references public.family_resources(id)");
    expect(migration).toContain("select distinct on (r.family_id, r.resource_type, r.url, r.reference_text, r.resource_file_id)");
    expect(migration).toContain("alter table public.custom_learning_resources disable trigger");
    expect(migration).toContain("alter table public.custom_learning_resources enable trigger");
  });

  it("keeps ownership and deletion safe", () => {
    expect(migration).toContain("public.is_family_member(family_id)");
    expect(migration).toContain("created_by_user_id = auth.uid()");
    expect(migration).toContain("delete unused family");
    expect(migration).toContain("not exists (\n    select 1 from public.custom_learning_resources");
    expect(migration).toContain("262144000");
    expect(migration).not.toContain("family_evidence_storage_usage");
  });

  it("keeps the Free Cupboard allowance aligned without corrupting usage", () => {
    expect(quotaMigration).toContain("alter column allowance_bytes set default 262144000");
    expect(quotaMigration).toContain("greatest(262144000, used_bytes + reserved_bytes)");
    expect(quotaMigration).not.toContain("delete from public.family_resource");
    expect(quotaMigration).not.toContain("family_evidence_storage_usage");
  });

  it("makes PDF upload save to the Cupboard before attaching", () => {
    expect(featureFiles).toContain("createUploadedPdfFamilyResource");
    expect(featureFiles).toContain("attachFamilyResourceToCustomLearning");
    expect(featureFiles).toContain("mylearna_reserve_resource_file_upload");
    expect(featureFiles).not.toContain("mylearna_reserve_evidence_attachment_upload");
  });
});
