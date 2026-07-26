import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabaseClient", () => ({
  hasSupabaseEnv: true,
  supabase: {
    from: mocks.from,
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

import { loadLinkedLearners } from "@/lib/familyWorkspace";

function makeQuery(
  result: { data?: unknown; error?: unknown },
  terminal: "order" | "in",
) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => (terminal === "order" ? Promise.resolve(result) : chain));
  chain.in = vi.fn(() => (terminal === "in" ? Promise.resolve(result) : chain));
  return chain;
}

function queueQueries(
  queries: Array<{ table: string; chain: Record<string, ReturnType<typeof vi.fn>> }>,
) {
  const pending = [...queries];
  mocks.from.mockImplementation((table: string) => {
    const next = pending.shift();
    if (!next) throw new Error(`Unexpected Supabase table: ${table}`);
    expect(table).toBe(next.table);
    return next.chain;
  });
}

describe("family workspace learner schema compatibility", () => {
  afterEach(() => {
    mocks.from.mockReset();
  });

  it("loads clean-schema learners scoped by family_id when legacy bridges are absent", async () => {
    queueQueries([
      {
        table: "family_profile_children",
        chain: makeQuery({
          data: null,
          error: { code: "42P01", message: "relation family_profile_children does not exist" },
        }, "order"),
      },
      {
        table: "parent_student_links",
        chain: makeQuery({
          data: null,
          error: { code: "42P01", message: "relation parent_student_links does not exist" },
        }, "order"),
      },
      {
        table: "learners",
        chain: makeQuery({
          data: [{
            id: "learner-clean",
            family_id: "family-clean",
            first_name: "Alex",
            preferred_name: "Alex",
            surname: "Learner",
            year_level: 3,
            created_at: "2026-07-25T00:00:00.000Z",
          }],
          error: null,
        }, "order"),
      },
    ]);

    const learners = await loadLinkedLearners("user-1", "family-clean");

    expect(learners).toHaveLength(1);
    expect(learners[0]).toMatchObject({ id: "learner-clean", label: "Alex Learner" });
  });

  it("loads legacy students through the family and parent link scopes", async () => {
    queueQueries([
      {
        table: "family_profile_children",
        chain: makeQuery({
          data: [{
            id: "family-child-1",
            family_profile_id: "family-legacy",
            child_id: "student-1",
            created_at: "2026-07-25T00:00:00.000Z",
          }],
          error: null,
        }, "order"),
      },
      {
        table: "parent_student_links",
        chain: makeQuery({
          data: null,
          error: { code: "42P01", message: "relation parent_student_links does not exist" },
        }, "order"),
      },
      {
        table: "learners",
        chain: makeQuery({
          data: null,
          error: { code: "42P01", message: "relation learners does not exist" },
        }, "order"),
      },
      {
        table: "students",
        chain: makeQuery({
          data: [{
            id: "student-1",
            first_name: "Jamie",
            last_name: "Student",
            year_level: 5,
            created_at: "2026-07-25T00:00:00.000Z",
          }],
          error: null,
        }, "in"),
      },
    ]);

    const learners = await loadLinkedLearners("user-1", "family-legacy");

    expect(learners).toHaveLength(1);
    expect(learners[0]).toMatchObject({
      id: "student-1",
      label: "Jamie Student",
      family_profile_child_id: "family-child-1",
    });
  });

  it("does not swallow learner RLS failures as a schema compatibility case", async () => {
    queueQueries([
      {
        table: "family_profile_children",
        chain: makeQuery({
          data: null,
          error: { code: "42501", message: "permission denied for table family_profile_children" },
        }, "order"),
      },
    ]);

    await expect(loadLinkedLearners("user-1", "family-1")).rejects.toMatchObject({
      code: "42501",
    });
  });
});
