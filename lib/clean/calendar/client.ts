import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import type {
  CleanCalendarItem,
  CleanCalendarItemInput,
  CleanCalendarItemSourceType,
  CleanCalendarItemsOptions,
  CleanCalendarItemUpdate,
} from "@/lib/clean/calendar/types";

type CalendarItemRow = {
  id: string;
  family_id: string;
  learner_id?: string | null;
  program_id?: string | null;
  program_segment_id?: string | null;
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  planned_date: string;
  learning_area?: string | null;
  session_label?: string | null;
  source_type?: string | null;
  source_template_block_id?: string | null;
  source_program_segment_id?: string | null;
  generation_run_id?: string | null;
  is_highlighted?: boolean | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function normalizeBoolean(value: unknown) {
  return value === true;
}

function normalizeSourceType(value: unknown): CleanCalendarItemSourceType {
  const sourceType = safe(value);
  if (sourceType === "generated" || sourceType === "template") return sourceType;
  return "manual";
}

function sanitizeDate(value: unknown) {
  return safe(value);
}

function toCleanCalendarItem(row: CalendarItemRow): CleanCalendarItem {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: normalizeNullString(row.learner_id),
    programId: normalizeNullString(row.program_id),
    programSegmentId: normalizeNullString(row.program_segment_id),
    title: safe(row.title),
    description: normalizeNullString(row.description),
    startsAt: normalizeNullString(row.starts_at),
    endsAt: normalizeNullString(row.ends_at),
    plannedDate: sanitizeDate(row.planned_date),
    learningArea: normalizeNullString(row.learning_area),
    sessionLabel: normalizeNullString(row.session_label),
    sourceType: normalizeSourceType(row.source_type),
    sourceTemplateBlockId: normalizeNullString(row.source_template_block_id),
    sourceProgramSegmentId: normalizeNullString(row.source_program_segment_id),
    generationRunId: normalizeNullString(row.generation_run_id),
    isHighlighted: normalizeBoolean(row.is_highlighted),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function sortCalendarItems(items: CleanCalendarItem[]) {
  return [...items].sort((left, right) => {
    const dateCompare = left.plannedDate.localeCompare(right.plannedDate);
    if (dateCompare !== 0) return dateCompare;

    const leftTime = Date.parse(left.startsAt || left.createdAt || "");
    const rightTime = Date.parse(right.startsAt || right.createdAt || "");

    if (!Number.isNaN(leftTime) || !Number.isNaN(rightTime)) {
      if (Number.isNaN(leftTime)) return 1;
      if (Number.isNaN(rightTime)) return -1;
      if (leftTime !== rightTime) return leftTime - rightTime;
    }

    return left.title.localeCompare(right.title);
  });
}

function sanitizeCalendarItemInput(
  input: CleanCalendarItemInput | CleanCalendarItemUpdate,
) {
  return {
    learner_id:
      "learnerId" in input ? normalizeNullString(input.learnerId) : undefined,
    program_id:
      "programId" in input ? normalizeNullString(input.programId) : undefined,
    program_segment_id:
      "programSegmentId" in input
        ? normalizeNullString(input.programSegmentId)
        : undefined,
    title: "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    description:
      "description" in input
        ? normalizeNullString(input.description)
        : undefined,
    starts_at:
      "startsAt" in input ? normalizeNullString(input.startsAt) : undefined,
    ends_at: "endsAt" in input ? normalizeNullString(input.endsAt) : undefined,
    planned_date:
      "plannedDate" in input && input.plannedDate !== undefined
        ? sanitizeDate(input.plannedDate) || null
        : undefined,
    learning_area:
      "learningArea" in input ? normalizeNullString(input.learningArea) : undefined,
    session_label:
      "sessionLabel" in input ? normalizeNullString(input.sessionLabel) : undefined,
    source_type:
      "sourceType" in input && input.sourceType !== undefined
        ? normalizeSourceType(input.sourceType)
        : undefined,
    source_template_block_id:
      "sourceTemplateBlockId" in input
        ? normalizeNullString(input.sourceTemplateBlockId)
        : undefined,
    source_program_segment_id:
      "sourceProgramSegmentId" in input
        ? normalizeNullString(input.sourceProgramSegmentId)
        : undefined,
    generation_run_id:
      "generationRunId" in input
        ? normalizeNullString(input.generationRunId)
        : undefined,
    is_highlighted:
      "isHighlighted" in input && input.isHighlighted !== undefined
        ? input.isHighlighted === true
        : undefined,
  };
}

export async function listCleanCalendarItems(
  familyId: string,
  options: CleanCalendarItemsOptions = {},
) {
  let query = supabase
    .from("calendar_items")
    .select(
      "id,family_id,learner_id,program_id,program_segment_id,title,description,starts_at,ends_at,planned_date,learning_area,session_label,source_type,source_template_block_id,source_program_segment_id,generation_run_id,is_highlighted,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("planned_date", { ascending: true })
    .order("created_at", { ascending: true });

  const fromDate = sanitizeDate(options.fromDate);
  const toDate = sanitizeDate(options.toDate);
  const learnerId = safe(options.learnerId);

  if (fromDate) {
    query = query.gte("planned_date", fromDate);
  }

  if (toDate) {
    query = query.lte("planned_date", toDate);
  }

  if (learnerId) {
    query = query.eq("learner_id", learnerId);
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean calendar items just now.",
      ),
    );
  }

  return sortCalendarItems(
    (response.data ?? []).map((row) => toCleanCalendarItem(row as CalendarItemRow)),
  );
}

export async function createCleanCalendarItem(
  familyId: string,
  input: CleanCalendarItemInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before adding a calendar item.");
  }

  const payload = sanitizeCalendarItemInput(input);
  if (!safe(payload.title)) {
    throw new Error("A calendar item title is required.");
  }

  if (!sanitizeDate(payload.planned_date)) {
    throw new Error("A planned date is required.");
  }

  const response = await supabase
    .from("calendar_items")
    .insert({
      family_id: familyId,
      learner_id: payload.learner_id ?? null,
      program_id: payload.program_id ?? null,
      program_segment_id: payload.program_segment_id ?? null,
      title: payload.title,
      description: payload.description ?? null,
      starts_at: payload.starts_at ?? null,
      ends_at: payload.ends_at ?? null,
      planned_date: payload.planned_date,
      learning_area: payload.learning_area ?? null,
      session_label: payload.session_label ?? null,
      source_type: payload.source_type ?? "manual",
      source_template_block_id: payload.source_template_block_id ?? null,
      source_program_segment_id: payload.source_program_segment_id ?? null,
      generation_run_id: payload.generation_run_id ?? null,
      is_highlighted: payload.is_highlighted ?? false,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,learner_id,program_id,program_segment_id,title,description,starts_at,ends_at,planned_date,learning_area,session_label,source_type,source_template_block_id,source_program_segment_id,generation_run_id,is_highlighted,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean calendar item.",
      ),
    );
  }

  return toCleanCalendarItem(response.data as CalendarItemRow);
}

export async function updateCleanCalendarItem(
  familyId: string,
  calendarItemId: string,
  input: CleanCalendarItemUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeCalendarItemInput(input)).filter(([, value]) => value !== undefined),
  );

  if (payload.title !== undefined && !safe(payload.title)) {
    throw new Error("Calendar item title cannot be blank.");
  }

  if (payload.planned_date !== undefined && !sanitizeDate(payload.planned_date)) {
    throw new Error("Planned date cannot be blank.");
  }

  const response = await supabase
    .from("calendar_items")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", calendarItemId)
    .select(
      "id,family_id,learner_id,program_id,program_segment_id,title,description,starts_at,ends_at,planned_date,learning_area,session_label,source_type,source_template_block_id,source_program_segment_id,generation_run_id,is_highlighted,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean calendar item.",
      ),
    );
  }

  return toCleanCalendarItem(response.data as CalendarItemRow);
}

export async function deleteCleanCalendarItem(
  familyId: string,
  calendarItemId: string,
) {
  const response = await supabase
    .from("calendar_items")
    .delete()
    .eq("family_id", familyId)
    .eq("id", calendarItemId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean calendar item.",
      ),
    );
  }
}
