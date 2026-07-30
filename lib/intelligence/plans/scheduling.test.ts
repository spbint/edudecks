import { describe, expect, it } from "vitest";
import { schedulePlanForUser } from "@/lib/intelligence/plans/scheduling";

const snapshot = {
  planType: "lesson", title: "Foil boat investigation", overview: "Explore buoyancy.", subjects: ["Science"], ageStage: "Ages 8–10", duration: 45, durationUnit: "minutes", sequence: [], resourceRequirements: [], learningIntentions: [], successCriteria: [], preparation: [], discussionQuestions: [], differentiation: [], assessmentApproach: "Observe", evidencePrompts: [], portfolioPrompts: [], safetySupervisionNotes: [], sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com/activity" }, generation: { revision: 3 }, validation: { valid: true },
};

function clientFor() {
  const writes: Array<Record<string, unknown>> = [];
  const storedKeys = new Set<string>();
  const row = { id: "plan-1", user_id: "user-1", idea_id: "idea-1", title: "Foil boat investigation", summary: "Explore buoyancy.", learning_area: "Science", year_level: "Ages 8–10", objectives: [], source_ids: ["source-1"], status: "saved", current_version: 3, final_approved_version: null, provenance: {}, content: snapshot, duration_minutes: 45 };
  type FakeQuery = {
    select: () => FakeQuery;
    eq: () => FakeQuery;
    in: () => FakeQuery;
    limit: () => FakeQuery;
    maybeSingle: () => Promise<{ data: unknown; error: null }>;
    insert: (item: Record<string, unknown>) => { select: () => { maybeSingle: () => Promise<{ data: { id: string } | null; error: { code: string } | null }> } };
    then: (resolve: (value: unknown) => unknown) => unknown;
  };
  function query(table: string): FakeQuery {
    const value = {
      select: () => value,
      eq: () => value,
      in: () => value,
      limit: () => value,
      maybeSingle: async () => table === "intelligence_lesson_plans"
        ? { data: row, error: null }
        : table === "calendar_items" && writes[0]
          ? { data: { id: `calendar-1` }, error: null }
          : { data: null, error: null },
      insert: (item: Record<string, unknown>) => ({ select: () => ({ maybeSingle: async () => {
        const key = String(item.source_plan_schedule_key);
        if (storedKeys.has(key)) return { data: null, error: { code: "23505" } };
        storedKeys.add(key);
        writes.push(item);
        return { data: { id: `calendar-${writes.length}` }, error: null };
      } }) }),
      then: (resolve: (value: unknown) => unknown) => resolve(table === "family_members" ? { data: [{ family_id: "family-1" }], error: null } : table === "learners" ? { data: [{ id: "learner-1" }], error: null } : { data: writes.map((item, index) => ({ id: String(item.id ?? `calendar-${index + 1}`) })), error: null }),
    } as FakeQuery;
    return value;
  }
  return { writes, client: { from: (table: string) => query(table) } };
}

describe("plan scheduling", () => {
  it("stores the exact plan version, snapshot, source and deterministic schedule key", async () => {
    const state = clientFor();
    const result = await schedulePlanForUser(state.client, "user-1", "lesson", "plan-1", { learnerIds: ["learner-1"], plannedDate: "2026-08-03" });
    expect(result.created).toBe(1);
    expect(state.writes[0]).toMatchObject({ family_id: "family-1", learner_id: "learner-1", source_plan_type: "lesson", source_plan_id: "plan-1", source_plan_version: 3, source_plan_snapshot: snapshot, source_type: "generated", delivery_status: "planned" });
    expect(String(state.writes[0].source_plan_schedule_key)).toHaveLength(64);
  });

  it("does not duplicate an identical retry", async () => {
    const state = clientFor();
    const input = { learnerIds: ["learner-1"], plannedDate: "2026-08-03" };
    await schedulePlanForUser(state.client, "user-1", "lesson", "plan-1", input);
    const retry = await schedulePlanForUser(state.client, "user-1", "lesson", "plan-1", input);
    expect(retry.created).toBe(0);
    expect(retry.alreadyExisting).toBe(1);
    expect(state.writes).toHaveLength(1);
  });
});
