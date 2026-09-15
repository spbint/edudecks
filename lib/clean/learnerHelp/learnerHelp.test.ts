import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260912100000_add_learner_help_requests.sql"), "utf8");
const day = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");
const learnerViewRoute = readFileSync(join(process.cwd(), "app/(learner-view)/learner-view/page.tsx"), "utf8");

describe("retired learner-operated help signal", () => {
  it("retains the historical table migration with family-scoped RLS", () => {
    expect(migration).toContain("create table if not exists public.learner_help_requests");
    expect(migration).toContain("source_type in ('calendar_item', 'on_deck_item')");
    expect(migration).toContain("learner_help_requests_active_source_idx");
    expect(migration).toContain("alter table public.learner_help_requests enable row level security");
    expect(migration).toContain("revoke all on public.learner_help_requests from anon");
    expect(migration).toContain("public.is_family_member(family_id)");
  });

  it("removes learner-operated help from the active parent product", () => {
    expect(day).not.toContain("learner_help_requests");
    expect(day).not.toContain("helpRequests");
    expect(day).not.toContain("helpError");
    expect(day).not.toContain("I need help");
    expect(day).not.toContain("Got it");
    expect(day).not.toContain("needs help");
  });

  it("retires the old route instead of rendering learner UI", () => {
    expect(learnerViewRoute).toContain('redirect(learnerId ? `/my-day?learner_id=${encodeURIComponent(learnerId)}` : "/my-day")');
  });
});
