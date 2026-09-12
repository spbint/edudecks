import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isSafeCustomWebLink } from "@/lib/clean/onDeck/client";

const migration = readFileSync("supabase/migrations/20260912054134_custom_learning_resources.sql", "utf8");

describe("custom learning resources", () => {
  it("accepts only normal HTTP(S) web links", () => {
    expect(isSafeCustomWebLink("https://example.com/lesson")).toBe(true);
    expect(isSafeCustomWebLink("http://example.com/lesson")).toBe(true);
    expect(isSafeCustomWebLink("javascript:alert(1)")).toBe(false);
    expect(isSafeCustomWebLink("data:text/html,hello")).toBe(false);
    expect(isSafeCustomWebLink("//example.com/lesson")).toBe(false);
  });

  it("defines source-aware resource storage and family security", () => {
    expect(migration).toContain("create table if not exists public.custom_learning_resources");
    expect(migration).toContain("resource_type in ('web_link', 'reference')");
    expect(migration).toContain("reference_text is null");
    expect(migration).toContain("url is null");
    expect(migration).toContain("references public.custom_learning_items(id) on delete cascade");
    expect(migration).toContain("alter table public.custom_learning_resources enable row level security");
    expect(migration).toContain("revoke all on public.custom_learning_resources from anon");
    expect(migration).toContain("mylearna_create_custom_learning_queue_item_with_resource");
    expect(migration).not.toContain("storage.objects");
    expect(migration).not.toContain("calendar_items");
  });
});
