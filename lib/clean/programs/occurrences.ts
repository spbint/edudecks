import { supabase } from "@/lib/supabaseClient";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";

export type ProgramOccurrenceAllocation = {
  id: string;
  calendarItemId: string;
  lessonTitleSnapshot: string;
};

export async function allocateCleanProgramOccurrence(
  familyId: string,
  learnerProgramAssignmentId: string,
  calendarItemId: string,
) {
  const response = await supabase.rpc("clean_allocate_program_occurrence", {
    p_family_id: familyId,
    p_learner_program_assignment_id: learnerProgramAssignmentId,
    p_calendar_item_id: calendarItemId,
  });

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(response.error, "We could not allocate this Program lesson."),
    );
  }

  const row = Array.isArray(response.data) ? response.data[0] : response.data;
  if (!row) return null;
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id ?? "").trim(),
    calendarItemId: String(value.calendar_item_id ?? "").trim(),
    lessonTitleSnapshot: String(value.lesson_title_snapshot ?? "").trim(),
  } satisfies ProgramOccurrenceAllocation;
}
