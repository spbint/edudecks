import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260912100000_add_learner_help_requests.sql"), "utf8");
const learnerView = readFileSync(join(process.cwd(), "app/components/clean/CleanLearnerViewWorkspace.tsx"), "utf8");
const day = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");

describe("learner help signal", () => {
  it("uses one active source identity per learner and protects family access with RLS", () => {
    expect(migration).toContain("create table if not exists public.learner_help_requests");
    expect(migration).toContain("source_type in ('calendar_item', 'on_deck_item')");
    expect(migration).toContain("learner_help_requests_active_source_idx");
    expect(migration).toContain("alter table public.learner_help_requests enable row level security");
    expect(migration).toContain("revoke all on public.learner_help_requests from anon");
    expect(migration).toContain("public.is_family_member(family_id)");
  });

  it("keeps help actions tied to real Today and On Deck source IDs", () => {
    expect(learnerView).toContain('toggleHelp("calendar_item", item.id)');
    expect(learnerView).toContain('toggleHelp("on_deck_item", resolved.item.id)');
    expect(learnerView).toContain("I need help");
    expect(learnerView).toContain("I’m okay now");
    expect(day).toContain("parent_help_acknowledged");
    expect(day).toContain("needs help");
    expect(day).toContain("Got it");
  });

  it("keeps help loading secondary to the existing My Day core", () => {
    expect(day).toContain("listActiveLearnerHelpRequests");
    expect(day).toContain("helpError");
    expect(day).not.toContain("helpRequests && itemsLoading");
  });
});
