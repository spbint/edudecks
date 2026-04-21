import { supabase } from "@/lib/supabaseClient";
import { isMissingLearnerRelationOrColumn } from "@/lib/familyLearners";

export type CreateFamilyEvidenceInput = {
  studentId: string;
  userId?: string | null;
  title: string;
  summary: string;
  note?: string | null;
  occurredOn?: string | null;
  learningArea?: string | null;
  evidenceType?: string | null;
  visibility?: string | null;
  attachmentUrls?: string[] | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  fileUrl?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

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

  if (Array.isArray(studentIds) && studentIds.length === 0) return [];

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

    if (limit) query = query.limit(limit);

    const response = await query;
    if (!response.error) {
      const rows = ((response.data ?? []) as unknown) as Array<{ is_deleted?: boolean | null }>;
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
  const note = safe(input.note) || safe(input.summary);
  const attachmentUrls = Array.isArray(input.attachmentUrls)
    ? input.attachmentUrls.map((value) => safe(value)).filter(Boolean)
    : [];

  const response = await supabase
    .from("evidence_entries")
    .insert({
      student_id: input.studentId,
      user_id: safe(input.userId) || null,
      title: input.title,
      summary: input.summary,
      body: input.summary,
      note,
      evidence_type: input.evidenceType ?? "note",
      occurred_on: input.occurredOn ?? null,
      learning_area: safe(input.learningArea) || null,
      visibility: input.visibility ?? "private",
      attachment_urls: attachmentUrls.length ? attachmentUrls : null,
      image_url: safe(input.imageUrl) || null,
      audio_url: safe(input.audioUrl) || null,
      file_url: safe(input.fileUrl) || null,
      is_deleted: false,
    })
    .select("id")
    .single();

  if (response.error) throw response.error;
  return { id: String(response.data?.id ?? "").trim() };
}
