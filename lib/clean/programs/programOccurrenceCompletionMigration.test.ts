import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260901095639_complete_program_lesson_occurrences.sql"),
  "utf8",
);

describe("Program occurrence completion migration contract", () => {
  it("adds durable occurrence completion and backfills only already-completed linked Calendar items", () => {
    expect(migration).toContain("add column completed_at timestamptz null");
    expect(migration).toContain("from public.calendar_items item");
    expect(migration).toContain("item.id = occurrence.calendar_item_id");
    expect(migration).toContain("item.completed_at is not null");
  });

  it("atomically mirrors Calendar completion while preserving the first completion timestamp on retries", () => {
    expect(migration).toContain("create or replace function public.clean_set_calendar_item_completion");
    expect(migration).toContain("for update;");
    expect(migration).toContain("coalesce(calendar_row.completed_at, p_completed_at)");
    expect(migration).toContain("update public.calendar_items");
    expect(migration).toContain("update public.program_occurrences");
    expect(migration).toContain("calendar_item_id = p_calendar_item_id");
  });

  it("keeps the completion mutation authenticated and unavailable to anon", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("public.is_family_member(p_family_id)");
    expect(migration).toContain("revoke all on function public.clean_set_calendar_item_completion(uuid, uuid, timestamptz) from public");
    expect(migration).toContain("revoke all on function public.clean_set_calendar_item_completion(uuid, uuid, timestamptz) from anon");
    expect(migration).toContain("grant execute on function public.clean_set_calendar_item_completion(uuid, uuid, timestamptz) to authenticated");
    expect(migration).toContain("grant execute on function public.clean_set_calendar_item_completion(uuid, uuid, timestamptz) to service_role");
  });
});
