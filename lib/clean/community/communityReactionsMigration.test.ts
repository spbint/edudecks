import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260919225702_add_community_reactions.sql"),
  "utf8",
);
const client = readFileSync(join(process.cwd(), "lib/clean/community/client.ts"), "utf8");

describe("community_reactions migration contract", () => {
  it("creates the canonical reaction schema and query indexes", () => {
    expect(migration).toContain("create table if not exists public.community_reactions");
    expect(migration).toContain("id uuid primary key default gen_random_uuid()");
    expect(migration).toContain("target_type text not null");
    expect(migration).toContain("target_id uuid not null");
    expect(migration).toContain("reaction_type text not null");
    expect(migration).toContain("user_id uuid not null");
    expect(migration).toContain("created_at timestamptz not null default now()");
    expect(migration).toContain("unique (target_type, target_id, reaction_type, user_id)");
    expect(migration).toContain("community_reactions_target_idx");
    expect(migration).toContain("(target_type, target_id)");
    expect(migration).toContain("community_reactions_user_idx");
    expect(migration).toContain("(user_id)");
  });

  it("limits reaction and target types to the canonical Community values", () => {
    expect(migration).toContain("target_type in ('thread', 'post')");
    expect(migration).toContain("reaction_type in ('like', 'helpful', 'thanks')");
  });

  it("enables RLS and keeps direct access authenticated-only without UPDATE", () => {
    expect(migration).toContain("alter table public.community_reactions enable row level security");
    expect(migration).toContain("revoke all on public.community_reactions from public, anon, authenticated");
    expect(migration).toContain("grant select, insert, delete on public.community_reactions to authenticated");
    expect(migration).not.toMatch(/grant[^;]*\bupdate\b[^;]*community_reactions/i);
    expect(migration).not.toMatch(/for update\b/i);
  });

  it("allows reads and inserts only for valid open thread or post targets", () => {
    expect(migration).toContain('"clean community reactions select open targets"');
    expect(migration).toContain('"clean community reactions insert own open target"');
    expect(migration).toContain("from public.community_threads thread_row");
    expect(migration).toContain("from public.community_posts post_row");
    expect(migration).toContain("join public.community_threads thread_row on thread_row.id = post_row.thread_id");
    expect(migration).toContain("thread_row.status = 'open'");
    expect(migration).toContain("post_row.status = 'open'");
    expect(migration).toContain("user_id = (select auth.uid())");
  });

  it("limits deletion to the signed-in reaction owner", () => {
    expect(migration).toContain('"clean community reactions delete own"');
    expect(migration).toContain("for delete");
    expect(migration).toContain("using (user_id = (select auth.uid()))");
  });

  it("matches the active Community client table and column contract", () => {
    expect(client).toContain('.from("community_reactions")');
    expect(client).toContain('"id,target_type,target_id,reaction_type,user_id,created_at"');
    expect(client).toContain("target_type: targetType");
    expect(client).toContain("target_id: targetId");
    expect(client).toContain("reaction_type: reactionType");
    expect(client).toContain("user_id: currentUserId");
  });
});
