import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import type {
  CleanMasterTemplate,
  CleanMasterTemplateInput,
  CleanMasterTemplatesOptions,
  CleanMasterTemplateScopeType,
  CleanMasterTemplateUpdate,
  CleanTemplateBlock,
  CleanTemplateBlockInput,
  CleanTemplateBlocksOptions,
  CleanTemplateBlockUpdate,
} from "@/lib/clean/templates/types";

type MasterTemplateRow = {
  id: string;
  family_id: string;
  learner_id?: string | null;
  title: string;
  description?: string | null;
  scope_type?: string | null;
  is_active?: boolean | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type TemplateBlockRow = {
  id: string;
  family_id: string;
  master_template_id: string;
  learner_id?: string | null;
  weekday?: number | null;
  title: string;
  learning_area?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  program_id?: string | null;
  program_segment_id?: string | null;
  learner_program_assignment_id?: string | null;
  notes?: string | null;
  session_label?: string | null;
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

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(safe(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeScopeType(value: unknown): CleanMasterTemplateScopeType {
  return safe(value) === "learner" ? "learner" : "family";
}

function toCleanMasterTemplate(row: MasterTemplateRow): CleanMasterTemplate {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: normalizeNullString(row.learner_id),
    title: safe(row.title),
    description: normalizeNullString(row.description),
    scopeType: normalizeScopeType(row.scope_type),
    isActive: normalizeBoolean(row.is_active),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toCleanTemplateBlock(row: TemplateBlockRow): CleanTemplateBlock {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    masterTemplateId: safe(row.master_template_id),
    learnerId: normalizeNullString(row.learner_id),
    weekday: normalizeNumber(row.weekday),
    title: safe(row.title),
    learningArea: normalizeNullString(row.learning_area),
    startsAt: normalizeNullString(row.starts_at),
    endsAt: normalizeNullString(row.ends_at),
    programId: normalizeNullString(row.program_id),
    programSegmentId: normalizeNullString(row.program_segment_id),
    learnerProgramAssignmentId: normalizeNullString(row.learner_program_assignment_id),
    notes: normalizeNullString(row.notes),
    sessionLabel: normalizeNullString(row.session_label),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function sortMasterTemplates(items: CleanMasterTemplate[]) {
  return [...items].sort((left, right) => left.title.localeCompare(right.title));
}

function sortTemplateBlocks(items: CleanTemplateBlock[]) {
  return [...items].sort((left, right) => {
    if (left.weekday !== right.weekday) return left.weekday - right.weekday;
    const leftTime = safe(left.startsAt);
    const rightTime = safe(right.startsAt);
    const timeCompare = leftTime.localeCompare(rightTime);
    if (timeCompare !== 0) return timeCompare;
    return left.title.localeCompare(right.title);
  });
}

function sanitizeMasterTemplateInput(
  input: CleanMasterTemplateInput | CleanMasterTemplateUpdate,
) {
  return {
    learner_id:
      "learnerId" in input ? normalizeNullString(input.learnerId) : undefined,
    title: "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    description:
      "description" in input ? normalizeNullString(input.description) : undefined,
    scope_type:
      "scopeType" in input && input.scopeType !== undefined
        ? normalizeScopeType(input.scopeType)
        : undefined,
    is_active:
      "isActive" in input && input.isActive !== undefined
        ? input.isActive === true
        : undefined,
  };
}

function sanitizeTemplateBlockInput(
  input: CleanTemplateBlockInput | CleanTemplateBlockUpdate,
) {
  return {
    learner_id:
      "learnerId" in input ? normalizeNullString(input.learnerId) : undefined,
    weekday:
      "weekday" in input && input.weekday !== undefined ? normalizeNumber(input.weekday) : undefined,
    title: "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    learning_area:
      "learningArea" in input ? normalizeNullString(input.learningArea) : undefined,
    starts_at:
      "startsAt" in input ? normalizeNullString(input.startsAt) : undefined,
    ends_at: "endsAt" in input ? normalizeNullString(input.endsAt) : undefined,
    program_id:
      "programId" in input ? normalizeNullString(input.programId) : undefined,
    program_segment_id:
      "programSegmentId" in input
        ? normalizeNullString(input.programSegmentId)
        : undefined,
    learner_program_assignment_id:
      "learnerProgramAssignmentId" in input
        ? normalizeNullString(input.learnerProgramAssignmentId)
        : undefined,
    notes: "notes" in input ? normalizeNullString(input.notes) : undefined,
    session_label:
      "sessionLabel" in input ? normalizeNullString(input.sessionLabel) : undefined,
  };
}

export async function listCleanMasterTemplates(
  familyId: string,
  options: CleanMasterTemplatesOptions = {},
) {
  let query = supabase
    .from("master_templates")
    .select(
      "id,family_id,learner_id,title,description,scope_type,is_active,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("title", { ascending: true })
    .order("created_at", { ascending: true });

  if (safe(options.learnerId)) {
    query = query.eq("learner_id", safe(options.learnerId));
  }

  if (typeof options.isActive === "boolean") {
    query = query.eq("is_active", options.isActive);
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;
  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean master templates just now.",
      ),
    );
  }

  return sortMasterTemplates(
    (response.data ?? []).map((row) => toCleanMasterTemplate(row as MasterTemplateRow)),
  );
}

export async function createCleanMasterTemplate(
  familyId: string,
  input: CleanMasterTemplateInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before creating a master template.");
  }

  const payload = sanitizeMasterTemplateInput(input);
  if (!safe(payload.title)) {
    throw new Error("A master template title is required.");
  }

  const response = await supabase
    .from("master_templates")
    .insert({
      family_id: familyId,
      learner_id: payload.learner_id ?? null,
      title: payload.title,
      description: payload.description ?? null,
      scope_type: payload.scope_type ?? "family",
      is_active: payload.is_active ?? true,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,learner_id,title,description,scope_type,is_active,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean master template.",
      ),
    );
  }

  return toCleanMasterTemplate(response.data as MasterTemplateRow);
}

export async function updateCleanMasterTemplate(
  familyId: string,
  masterTemplateId: string,
  input: CleanMasterTemplateUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeMasterTemplateInput(input)).filter(([, value]) => value !== undefined),
  );

  const response = await supabase
    .from("master_templates")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", masterTemplateId)
    .select(
      "id,family_id,learner_id,title,description,scope_type,is_active,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean master template.",
      ),
    );
  }

  return toCleanMasterTemplate(response.data as MasterTemplateRow);
}

export async function deleteCleanMasterTemplate(
  familyId: string,
  masterTemplateId: string,
) {
  const response = await supabase
    .from("master_templates")
    .delete()
    .eq("family_id", familyId)
    .eq("id", masterTemplateId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean master template.",
      ),
    );
  }
}

export async function listCleanTemplateBlocks(
  familyId: string,
  masterTemplateId: string,
  options: CleanTemplateBlocksOptions = {},
) {
  let query = supabase
    .from("template_blocks")
    .select(
      "id,family_id,master_template_id,learner_id,weekday,title,learning_area,starts_at,ends_at,program_id,program_segment_id,learner_program_assignment_id,notes,session_label,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .eq("master_template_id", masterTemplateId)
    .order("weekday", { ascending: true })
    .order("starts_at", { ascending: true });

  if (safe(options.learnerId)) {
    query = query.eq("learner_id", safe(options.learnerId));
  }

  if (typeof options.weekday === "number" && Number.isFinite(options.weekday)) {
    query = query.eq("weekday", options.weekday);
  }

  const response = await query;
  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean template blocks just now.",
      ),
    );
  }

  return sortTemplateBlocks(
    (response.data ?? []).map((row) => toCleanTemplateBlock(row as TemplateBlockRow)),
  );
}

export async function createCleanTemplateBlock(
  familyId: string,
  masterTemplateId: string,
  input: CleanTemplateBlockInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before creating a template block.");
  }

  const payload = sanitizeTemplateBlockInput(input);
  if (!safe(payload.title)) throw new Error("A template block title is required.");
  if (!payload.weekday || payload.weekday < 1 || payload.weekday > 7) {
    throw new Error("A weekday between 1 and 7 is required.");
  }

  const response = await supabase
    .from("template_blocks")
    .insert({
      family_id: familyId,
      master_template_id: masterTemplateId,
      learner_id: payload.learner_id ?? null,
      weekday: payload.weekday,
      title: payload.title,
      learning_area: payload.learning_area ?? null,
      starts_at: payload.starts_at ?? null,
      ends_at: payload.ends_at ?? null,
      program_id: payload.program_id ?? null,
      program_segment_id: payload.program_segment_id ?? null,
      learner_program_assignment_id: payload.learner_program_assignment_id ?? null,
      notes: payload.notes ?? null,
      session_label: payload.session_label ?? null,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,master_template_id,learner_id,weekday,title,learning_area,starts_at,ends_at,program_id,program_segment_id,learner_program_assignment_id,notes,session_label,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean template block.",
      ),
    );
  }

  return toCleanTemplateBlock(response.data as TemplateBlockRow);
}

export async function updateCleanTemplateBlock(
  familyId: string,
  templateBlockId: string,
  input: CleanTemplateBlockUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeTemplateBlockInput(input)).filter(([, value]) => value !== undefined),
  );

  const response = await supabase
    .from("template_blocks")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", templateBlockId)
    .select(
      "id,family_id,master_template_id,learner_id,weekday,title,learning_area,starts_at,ends_at,program_id,program_segment_id,learner_program_assignment_id,notes,session_label,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean template block.",
      ),
    );
  }

  return toCleanTemplateBlock(response.data as TemplateBlockRow);
}

export async function deleteCleanTemplateBlock(
  familyId: string,
  templateBlockId: string,
) {
  const response = await supabase
    .from("template_blocks")
    .delete()
    .eq("family_id", familyId)
    .eq("id", templateBlockId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean template block.",
      ),
    );
  }
}
