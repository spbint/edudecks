import {
  getCurrentCleanUserId,
  updateCleanFamilyProfile,
} from "@/lib/clean/family/client";
import { supabase } from "@/lib/supabaseClient";
import type {
  CreateCleanLearnerInput,
  Learner,
  UpdateCleanLearnerInput,
} from "@/lib/clean/learners/types";

type LearnerRow = {
  id: string;
  family_id: string;
  first_name: string;
  preferred_name?: string | null;
  surname?: string | null;
  year_level?: string | null;
  notes?: string | null;
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

function toLearner(row: LearnerRow): Learner {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    firstName: safe(row.first_name),
    preferredName: normalizeNullString(row.preferred_name),
    surname: normalizeNullString(row.surname),
    yearLevel: normalizeNullString(row.year_level),
    notes: normalizeNullString(row.notes),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function sortLearners(rows: Learner[]) {
  return [...rows].sort((left, right) => {
    const leftLabel = (left.preferredName || left.firstName).toLowerCase();
    const rightLabel = (right.preferredName || right.firstName).toLowerCase();
    return leftLabel.localeCompare(rightLabel);
  });
}

function sanitizeLearnerInput(
  input: CreateCleanLearnerInput | UpdateCleanLearnerInput,
) {
  return {
    first_name:
      "firstName" in input && input.firstName !== undefined
        ? safe(input.firstName) || null
        : undefined,
    preferred_name:
      "preferredName" in input
        ? normalizeNullString(input.preferredName)
        : undefined,
    surname: "surname" in input ? normalizeNullString(input.surname) : undefined,
    year_level:
      "yearLevel" in input ? normalizeNullString(input.yearLevel) : undefined,
    notes: "notes" in input ? normalizeNullString(input.notes) : undefined,
  };
}

export async function listCleanLearners(familyId: string) {
  const response = await supabase
    .from("learners")
    .select(
      "id,family_id,first_name,preferred_name,surname,year_level,notes,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId);

  if (response.error) {
    throw response.error;
  }

  return sortLearners((response.data ?? []).map((row) => toLearner(row as LearnerRow)));
}

export async function createCleanLearner(
  familyId: string,
  input: CreateCleanLearnerInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before adding a learner.");
  }

  const payload = sanitizeLearnerInput(input);
  if (!safe(payload.first_name)) {
    throw new Error("A learner first name is required.");
  }

  const response = await supabase
    .from("learners")
    .insert({
      family_id: familyId,
      first_name: payload.first_name,
      preferred_name: payload.preferred_name ?? null,
      surname: payload.surname ?? null,
      year_level: payload.year_level ?? null,
      notes: payload.notes ?? null,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,first_name,preferred_name,surname,year_level,notes,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw response.error ?? new Error("Unable to create the learner.");
  }

  return toLearner(response.data as LearnerRow);
}

export async function updateCleanLearner(
  familyId: string,
  learnerId: string,
  input: UpdateCleanLearnerInput,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeLearnerInput(input)).filter(([, value]) => value !== undefined),
  );

  if (payload.first_name !== undefined && !safe(payload.first_name)) {
    throw new Error("Learner first name cannot be blank.");
  }

  const response = await supabase
    .from("learners")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", learnerId)
    .select(
      "id,family_id,first_name,preferred_name,surname,year_level,notes,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw response.error ?? new Error("Unable to update the learner.");
  }

  return toLearner(response.data as LearnerRow);
}

export async function setDefaultCleanLearner(
  familyId: string,
  learnerId: string,
) {
  return updateCleanFamilyProfile(familyId, {
    defaultLearnerId: learnerId,
  });
}
