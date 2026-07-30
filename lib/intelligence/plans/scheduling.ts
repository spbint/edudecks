import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLearningPlanForUser } from "@/lib/intelligence/plans/library";
import type { LearningPlanType } from "@/lib/intelligence/plans/types";

export type SchedulePlanInput = {
  learnerIds?: string[];
  wholeFamily?: boolean;
  plannedDate?: string;
  startDate?: string;
  cadence?: "daily" | "weekdays" | "weekly";
  startsAt?: string | null;
  endsAt?: string | null;
};

export class PlanSchedulingError extends Error {
  readonly code: "invalid_input" | "not_found" | "forbidden" | "conflict" | "persistence_failure";
  constructor(code: PlanSchedulingError["code"], message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PlanSchedulingError";
    this.code = code;
  }
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function dateValue(value: unknown) {
  const text = safe(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateText(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function scheduleDates(start: Date, count: number, cadence: SchedulePlanInput["cadence"]) {
  const dates: Date[] = [];
  let cursor = start;
  while (dates.length < count) {
    if (cadence !== "weekdays" || (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6)) dates.push(cursor);
    cursor = addDays(cursor, cadence === "weekly" ? 7 : 1);
  }
  return dates;
}

function scheduleKey(familyId: string, learnerId: string | null, type: LearningPlanType, planId: string, version: number, index: number, date: string) {
  return createHash("sha256").update([familyId, learnerId ?? "whole-family", type, planId, version, index, date].join("|")).digest("hex");
}

function sourceUrl(content: Record<string, unknown>) {
  const attribution = content.sourceAttribution && typeof content.sourceAttribution === "object" ? content.sourceAttribution as Record<string, unknown> : {};
  const value = attribution.canonicalUrl ?? attribution.finalUrl ?? attribution.originalUrl;
  const text = safe(value);
  return /^https?:\/\//i.test(text) ? text.slice(0, 2000) : null;
}

export async function schedulePlanForUser(
  client: Pick<SupabaseClient, "from">,
  userId: string,
  planType: LearningPlanType,
  planId: string,
  input: SchedulePlanInput,
) {
  const plan = await getLearningPlanForUser(userId, planType, planId, client);
  if (!plan) throw new PlanSchedulingError("not_found", "That plan is not available.");
  if (plan.displayStatus === "Archived") throw new PlanSchedulingError("forbidden", "Archived plans cannot be scheduled.");

  const learnerIds = [...new Set((input.learnerIds ?? []).map(safe).filter(Boolean))];
  if (!input.wholeFamily && !learnerIds.length) throw new PlanSchedulingError("invalid_input", "Choose a learner or Whole family.");
  const familyMembership = await client.from("family_members").select("family_id").eq("user_id", userId).limit(20);
  if (familyMembership.error || !familyMembership.data?.length) throw new PlanSchedulingError("forbidden", "Your family workspace is not available.", { cause: familyMembership.error });
  const familyId = safe(familyMembership.data[0].family_id);
  if (!familyId) throw new PlanSchedulingError("forbidden", "Your family workspace is not available.");

  if (learnerIds.length) {
    const learners = await client.from("learners").select("id").eq("family_id", familyId).in("id", learnerIds);
    if (learners.error || (learners.data ?? []).length !== learnerIds.length) throw new PlanSchedulingError("forbidden", "Choose learners from your family workspace.", { cause: learners.error });
  }

  const content = plan.content as unknown as Record<string, unknown>;
  const sequence = Array.isArray(content.sequence) ? content.sequence : [];
  const count = planType === "unit" ? sequence.length : 1;
  if (!count) throw new PlanSchedulingError("invalid_input", "This plan has no schedulable learning sequence.");
  const start = dateValue(input.plannedDate ?? input.startDate);
  if (!start) throw new PlanSchedulingError("invalid_input", "Choose a valid date.");
  const dates = scheduleDates(start, count, planType === "unit" ? (input.cadence ?? "daily") : "daily");
  const targets = input.wholeFamily ? [null] : learnerIds;
  const url = sourceUrl(content);
  const rows = targets.flatMap((learnerId) => dates.map((date, index) => {
    const item = planType === "unit" ? sequence[index] as Record<string, unknown> : content;
    const title = safe(item?.title) || plan.plan.title || "Learning plan";
    const sessionLabel = planType === "unit" ? `Lesson ${index + 1} of ${count}` : "Lesson plan";
    const key = scheduleKey(familyId, learnerId, planType, plan.plan.id, plan.plan.version, planType === "unit" ? index : 0, dateText(date));
    return {
      family_id: familyId,
      learner_id: learnerId,
      title,
      description: safe(item?.objective) || safe(content.overview) || null,
      planned_date: dateText(date),
      starts_at: safe(input.startsAt) || null,
      ends_at: safe(input.endsAt) || null,
      learning_area: Array.isArray(content.subjects) ? safe(content.subjects[0]) || null : null,
      session_label: sessionLabel,
      source_type: "generated",
      is_highlighted: false,
      created_by_user_id: userId,
      source_plan_type: planType,
      source_plan_id: plan.plan.id,
      source_plan_version: plan.plan.version,
      source_plan_sequence_index: planType === "unit" ? index : 0,
      source_plan_snapshot: content,
      source_idea_id: plan.sourceIdeaId,
      source_url: url,
      source_plan_schedule_key: key,
      delivery_status: "planned",
    };
  }));

  const response = await client.from("calendar_items").upsert(rows, { onConflict: "source_plan_schedule_key", ignoreDuplicates: true }).select("id");
  if (response.error) throw new PlanSchedulingError("persistence_failure", "We could not schedule this plan.", { cause: response.error });
  const existing = await client.from("calendar_items").select("id").eq("family_id", familyId).in("source_plan_schedule_key", rows.map((row) => row.source_plan_schedule_key));
  if (existing.error) throw new PlanSchedulingError("persistence_failure", "We could not confirm the scheduled plan.", { cause: existing.error });
  const ids = (existing.data ?? []).map((row) => safe(row.id));
  return { created: response.data?.length ?? 0, alreadyExisting: Math.max(0, ids.length - (response.data?.length ?? 0)), calendarItemIds: ids, familyId };
}
