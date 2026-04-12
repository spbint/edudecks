import { supabase } from "@/lib/supabaseClient";
import { isMissingLearnerRelationOrColumn } from "@/lib/familyLearners";

export type CreateFamilyEvidenceInput = {
  familyProfileId: string;
  studentId: string;
  createdByUserId: string;
  title: string;
  summary: string;
  occurredOn?: string | null;
  evidenceType?: string | null;
  visibility?: string | null;
  metadata?: Record<string, unknown>;
};

export async function loadEvidenceEntriesWithVariants<T>(
  selectVariants: string[],
  options?: {
    studentId?: string | null;
    studentIds?: string[] | null;
    includeDeleted?: boolean;
    limit?: number;
  },
): Promise<T[]> {
  const studentId = options?.studentId ?? null;
  const studentIds = options?.studentIds ?? null;
  const includeDeleted = options?.includeDeleted === true;
  const limit = options?.limit ?? null;

  if (Array.isArray(studentIds) && studentIds.length === 0) {
    return [];
  }

  let lastError: unknown = null;

  for (const select of selectVariants) {
    let query = supabase.from("evidence_entries").select(select);

    if (studentId) {
      query = query.eq("student_id", studentId);
    } else if (Array.isArray(studentIds)) {
      query = query.in("student_id", studentIds);
    }

    if (!includeDeleted) {
      query = query.eq("is_deleted", false);
    }

    query = query
      .order("occurred_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const response = await query;
    if (!response.error) {
      const rows = ((response.data ?? []) as unknown) as Array<{
        is_deleted?: boolean | null;
      }>;
      return rows.filter((row) => includeDeleted || row.is_deleted !== true) as T[];
    }

    lastError = response.error;
    if (!isMissingLearnerRelationOrColumn(response.error)) {
      throw response.error;
    }
  }

  if (lastError) throw lastError;
  return [];
}

export async function createFamilyEvidenceEntry(
  input: CreateFamilyEvidenceInput,
): Promise<{ id: string }> {
  const response = await supabase
    .from("evidence_entries")
    .insert({
      family_profile_id: input.familyProfileId,
      student_id: input.studentId,
      created_by_user_id: input.createdByUserId,
      title: input.title,
      summary: input.summary,
      body: input.summary,
      evidence_type: input.evidenceType ?? "note",
      occurred_on: input.occurredOn ?? null,
      visibility: input.visibility ?? "private",
      metadata: input.metadata ?? {},
      is_deleted: false,
    })
    .select("id")
    .single();

  if (response.error) {
    throw response.error;
  }

  return { id: String(response.data?.id ?? "").trim() };
}
