import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import type {
  CleanProgram,
  CleanProgramInput,
  CleanProgramsOptions,
  CleanProgramSegment,
  CleanProgramSegmentInput,
  CleanProgramSegmentUpdate,
  CleanProgramStatus,
  CleanProgramUpdate,
  CleanProgramLesson,
  CleanProgramLessonInput,
  CleanProgramLessonUpdate,
  LearnerProgramAssignment,
} from "@/lib/clean/programs/types";
import { parsePastedProgramLessonTitles } from "@/lib/clean/programs/programLessons";

type ProgramRow = {
  id: string;
  family_id: string;
  learner_id?: string | null;
  title: string;
  description?: string | null;
  learning_area?: string | null;
  curriculum_node_ids?: unknown;
  status?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProgramSegmentRow = {
  id: string;
  family_id: string;
  program_id: string;
  learner_id?: string | null;
  title: string;
  description?: string | null;
  segment_order?: number | null;
  starts_on?: string | null;
  ends_on?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProgramLessonRow = {
  id: string;
  family_id: string;
  program_id: string;
  position: number;
  title: string;
  instructions?: string | null;
  estimated_duration_minutes?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type LearnerProgramAssignmentRow = {
  id: string;
  family_id: string;
  program_id: string;
  learner_id: string;
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

function normalizeProgramStatus(value: unknown): CleanProgramStatus {
  const status = safe(value);
  if (status === "draft" || status === "archived") return status;
  return "active";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => safe(entry))
    .filter((entry) => Boolean(entry));
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number.parseInt(safe(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCleanProgram(row: ProgramRow): CleanProgram {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: normalizeNullString(row.learner_id),
    title: safe(row.title),
    description: normalizeNullString(row.description),
    learningArea: normalizeNullString(row.learning_area),
    curriculumNodeIds: normalizeStringArray(row.curriculum_node_ids),
    status: normalizeProgramStatus(row.status),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toCleanProgramSegment(row: ProgramSegmentRow): CleanProgramSegment {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    programId: safe(row.program_id),
    learnerId: normalizeNullString(row.learner_id),
    title: safe(row.title),
    notes: normalizeNullString(row.description),
    segmentOrder: normalizeNumber(row.segment_order),
    startsOn: normalizeNullString(row.starts_on),
    endsOn: normalizeNullString(row.ends_on),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toCleanProgramLesson(row: ProgramLessonRow): CleanProgramLesson {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    programId: safe(row.program_id),
    position: normalizeNumber(row.position),
    title: safe(row.title),
    instructions: normalizeNullString(row.instructions),
    estimatedDurationMinutes:
      row.estimated_duration_minutes === null || row.estimated_duration_minutes === undefined
        ? null
        : normalizeNumber(row.estimated_duration_minutes),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toLearnerProgramAssignment(
  row: LearnerProgramAssignmentRow,
): LearnerProgramAssignment {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    programId: safe(row.program_id),
    learnerId: safe(row.learner_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function sortPrograms(items: CleanProgram[]) {
  return [...items].sort((left, right) => {
    const leftUpdated = Date.parse(left.updatedAt || left.createdAt || "");
    const rightUpdated = Date.parse(right.updatedAt || right.createdAt || "");

    if (!Number.isNaN(leftUpdated) || !Number.isNaN(rightUpdated)) {
      if (Number.isNaN(leftUpdated)) return 1;
      if (Number.isNaN(rightUpdated)) return -1;
      if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;
    }

    return left.title.localeCompare(right.title);
  });
}

function sortProgramSegments(items: CleanProgramSegment[]) {
  return [...items].sort((left, right) => {
    if (left.segmentOrder !== right.segmentOrder) {
      return left.segmentOrder - right.segmentOrder;
    }

    return left.title.localeCompare(right.title);
  });
}

function sortProgramLessons(items: CleanProgramLesson[]) {
  return [...items].sort((left, right) => {
    if (left.position !== right.position) return left.position - right.position;
    return left.id.localeCompare(right.id);
  });
}

function normalizePositiveNumberOrNull(value: unknown) {
  if (value === null || value === undefined || safe(value) === "") return null;
  const number = normalizeNumber(value);
  return number > 0 ? number : null;
}

function sanitizeProgramLessonInput(
  input: CleanProgramLessonInput | CleanProgramLessonUpdate,
) {
  return {
    title: "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    instructions:
      "instructions" in input ? normalizeNullString(input.instructions) : undefined,
    estimated_duration_minutes:
      "estimatedDurationMinutes" in input
        ? normalizePositiveNumberOrNull(input.estimatedDurationMinutes)
        : undefined,
  };
}

function sanitizeProgramInput(input: CleanProgramInput | CleanProgramUpdate) {
  return {
    learner_id:
      "learnerId" in input ? normalizeNullString(input.learnerId) : undefined,
    title: "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    description:
      "description" in input
        ? normalizeNullString(input.description)
        : undefined,
    learning_area:
      "learningArea" in input
        ? normalizeNullString(input.learningArea)
        : undefined,
    curriculum_node_ids:
      "curriculumNodeIds" in input && input.curriculumNodeIds !== undefined
        ? input.curriculumNodeIds
            .map((entry) => safe(entry))
            .filter((entry) => Boolean(entry))
        : undefined,
    status:
      "status" in input && input.status !== undefined
        ? normalizeProgramStatus(input.status)
        : undefined,
  };
}

function sanitizeProgramSegmentInput(
  input: CleanProgramSegmentInput | CleanProgramSegmentUpdate,
) {
  return {
    learner_id:
      "learnerId" in input ? normalizeNullString(input.learnerId) : undefined,
    title: "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    description:
      "notes" in input ? normalizeNullString(input.notes) : undefined,
    segment_order:
      "segmentOrder" in input && input.segmentOrder !== undefined
        ? normalizeNumber(input.segmentOrder)
        : undefined,
    starts_on:
      "startsOn" in input ? normalizeNullString(input.startsOn) : undefined,
    ends_on:
      "endsOn" in input ? normalizeNullString(input.endsOn) : undefined,
  };
}

export async function listCleanPrograms(
  familyId: string,
  options: CleanProgramsOptions = {},
) {
  let query = supabase
    .from("programs")
    .select(
      "id,family_id,learner_id,title,description,learning_area,curriculum_node_ids,status,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  const learnerId = safe(options.learnerId);
  const status = safe(options.status);

  if (learnerId) {
    query = query.eq("learner_id", learnerId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean programs just now.",
      ),
    );
  }

  return sortPrograms((response.data ?? []).map((row) => toCleanProgram(row as ProgramRow)));
}

export async function createCleanProgram(
  familyId: string,
  input: CleanProgramInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before adding a program.");
  }

  const payload = sanitizeProgramInput(input);
  if (!safe(payload.title)) {
    throw new Error("A program title is required.");
  }

  const response = await supabase
    .from("programs")
    .insert({
      family_id: familyId,
      learner_id: payload.learner_id ?? null,
      title: payload.title,
      description: payload.description ?? null,
      learning_area: payload.learning_area ?? null,
      curriculum_node_ids: payload.curriculum_node_ids ?? [],
      status: payload.status ?? "active",
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,learner_id,title,description,learning_area,curriculum_node_ids,status,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean program.",
      ),
    );
  }

  return toCleanProgram(response.data as ProgramRow);
}

export async function updateCleanProgram(
  familyId: string,
  programId: string,
  input: CleanProgramUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeProgramInput(input)).filter(([, value]) => value !== undefined),
  );

  if (payload.title !== undefined && !safe(payload.title)) {
    throw new Error("Program title cannot be blank.");
  }

  const response = await supabase
    .from("programs")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", programId)
    .select(
      "id,family_id,learner_id,title,description,learning_area,curriculum_node_ids,status,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean program.",
      ),
    );
  }

  return toCleanProgram(response.data as ProgramRow);
}

export async function deleteCleanProgram(
  familyId: string,
  programId: string,
) {
  const response = await supabase
    .from("programs")
    .delete()
    .eq("family_id", familyId)
    .eq("id", programId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean program.",
      ),
    );
  }
}

export async function listCleanProgramSegments(
  familyId: string,
  programId: string,
) {
  const response = await supabase
    .from("program_segments")
    .select(
      "id,family_id,program_id,learner_id,title,description,segment_order,starts_on,ends_on,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .eq("program_id", programId)
    .order("segment_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean program segments just now.",
      ),
    );
  }

  return sortProgramSegments(
    (response.data ?? []).map((row) => toCleanProgramSegment(row as ProgramSegmentRow)),
  );
}

export async function createCleanProgramSegment(
  familyId: string,
  programId: string,
  input: CleanProgramSegmentInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before adding a program segment.");
  }

  const payload = sanitizeProgramSegmentInput(input);
  if (!safe(payload.title)) {
    throw new Error("A segment title is required.");
  }

  const response = await supabase
    .from("program_segments")
    .insert({
      family_id: familyId,
      program_id: programId,
      learner_id: payload.learner_id ?? null,
      title: payload.title,
      description: payload.description ?? null,
      segment_order: payload.segment_order ?? 0,
      starts_on: payload.starts_on ?? null,
      ends_on: payload.ends_on ?? null,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,program_id,learner_id,title,description,segment_order,starts_on,ends_on,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean program segment.",
      ),
    );
  }

  return toCleanProgramSegment(response.data as ProgramSegmentRow);
}

export async function updateCleanProgramSegment(
  familyId: string,
  segmentId: string,
  input: CleanProgramSegmentUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeProgramSegmentInput(input)).filter(([, value]) => value !== undefined),
  );

  if (payload.title !== undefined && !safe(payload.title)) {
    throw new Error("Segment title cannot be blank.");
  }

  const response = await supabase
    .from("program_segments")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", segmentId)
    .select(
      "id,family_id,program_id,learner_id,title,description,segment_order,starts_on,ends_on,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean program segment.",
      ),
    );
  }

  return toCleanProgramSegment(response.data as ProgramSegmentRow);
}

export async function deleteCleanProgramSegment(
  familyId: string,
  segmentId: string,
) {
  const response = await supabase
    .from("program_segments")
    .delete()
    .eq("family_id", familyId)
    .eq("id", segmentId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean program segment.",
      ),
    );
  }
}

const programLessonSelect =
  "id,family_id,program_id,position,title,instructions,estimated_duration_minutes,created_at,updated_at";
const learnerProgramAssignmentSelect =
  "id,family_id,program_id,learner_id,created_at,updated_at";

export async function listLearnerProgramAssignments(
  familyId: string,
  programId?: string,
) {
  let query = supabase
    .from("learner_program_assignments")
    .select(learnerProgramAssignmentSelect)
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });

  if (safe(programId)) {
    query = query.eq("program_id", safe(programId));
  }

  const response = await query;
  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(response.error, "We could not load assigned learners just now."),
    );
  }

  return (response.data ?? []).map((row) =>
    toLearnerProgramAssignment(row as LearnerProgramAssignmentRow),
  );
}

export async function assignLearnersToCleanProgram(
  familyId: string,
  programId: string,
  learnerIds: string[],
) {
  const uniqueLearnerIds = [...new Set(learnerIds.map((id) => safe(id)).filter(Boolean))];
  if (!uniqueLearnerIds.length) throw new Error("Select at least one learner.");

  const response = await supabase.rpc("clean_assign_program_learners", {
    p_family_id: familyId,
    p_program_id: programId,
    p_learner_ids: uniqueLearnerIds,
  });
  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(response.error, "We could not assign these learners just now."),
    );
  }
}

export async function removeLearnerProgramAssignment(
  familyId: string,
  programId: string,
  learnerId: string,
) {
  const response = await supabase
    .from("learner_program_assignments")
    .delete()
    .eq("family_id", familyId)
    .eq("program_id", programId)
    .eq("learner_id", learnerId)
    .select("id")
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(response.error, "We could not remove this learner just now."),
    );
  }
}

export async function listCleanProgramLessons(familyId: string, programId: string) {
  const response = await supabase
    .from("program_lessons")
    .select(programLessonSelect)
    .eq("family_id", familyId)
    .eq("program_id", programId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(response.error, "We could not load these lessons just now."),
    );
  }

  return sortProgramLessons(
    (response.data ?? []).map((row) => toCleanProgramLesson(row as ProgramLessonRow)),
  );
}

export async function listCleanProgramLessonCounts(familyId: string) {
  const response = await supabase
    .from("program_lessons")
    .select("program_id")
    .eq("family_id", familyId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(response.error, "We could not load program lesson counts just now."),
    );
  }

  return (response.data ?? []).reduce<Record<string, number>>((counts, row) => {
    const programId = safe((row as { program_id?: unknown }).program_id);
    if (programId) counts[programId] = (counts[programId] ?? 0) + 1;
    return counts;
  }, {});
}

export function normalizeBulkProgramLessonTitles(value: string) {
  return parsePastedProgramLessonTitles(value);
}

export async function addCleanProgramLessons(
  familyId: string,
  programId: string,
  lessons: CleanProgramLessonInput[],
) {
  const titles = lessons
    .map((lesson) => sanitizeProgramLessonInput(lesson))
    .filter(
      (
        lesson,
      ): lesson is {
        title: string;
        instructions: string | null | undefined;
        estimated_duration_minutes: number | null | undefined;
      } => Boolean(lesson.title),
    );

  if (!titles.length) throw new Error("Add at least one lesson title.");

  const response = await supabase.rpc("clean_append_program_lessons", {
    p_family_id: familyId,
    p_program_id: programId,
    p_lessons: titles.map((lesson) => ({
      title: lesson.title,
      instructions: lesson.instructions ?? null,
      estimated_duration_minutes: lesson.estimated_duration_minutes ?? null,
    })),
  });

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(response.error, "We could not add these lessons just now."),
    );
  }
}

export async function updateCleanProgramLesson(
  familyId: string,
  lessonId: string,
  input: CleanProgramLessonUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeProgramLessonInput(input)).filter(([, value]) => value !== undefined),
  );

  if (payload.title !== undefined && !safe(payload.title)) {
    throw new Error("Lesson title cannot be blank.");
  }

  const response = await supabase
    .from("program_lessons")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", lessonId)
    .select(programLessonSelect)
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(response.error, "We could not update this lesson just now."),
    );
  }

  return toCleanProgramLesson(response.data as ProgramLessonRow);
}

export async function reorderCleanProgramLessons(
  familyId: string,
  programId: string,
  lessonIds: string[],
) {
  const uniqueLessonIds = [...new Set(lessonIds.map((id) => safe(id)).filter(Boolean))];
  if (uniqueLessonIds.length !== lessonIds.length) {
    throw new Error("Each lesson can appear only once in the order.");
  }

  const response = await supabase.rpc("clean_reorder_program_lessons", {
    p_family_id: familyId,
    p_program_id: programId,
    p_lesson_ids: uniqueLessonIds,
  });

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(response.error, "We could not reorder these lessons just now."),
    );
  }
}

export async function removeCleanProgramLesson(
  familyId: string,
  programId: string,
  lessonId: string,
) {
  const response = await supabase.rpc("clean_remove_program_lesson", {
    p_family_id: familyId,
    p_program_id: programId,
    p_lesson_id: lessonId,
  });

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(response.error, "We could not remove this lesson just now."),
    );
  }
}
