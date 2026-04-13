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

export type EvidenceOutcomeLink = {
  outcomeId: string;
};

export type ReportSupportingEvidenceItem = {
  id: string;
  title: string;
  summary: string;
  occurredOn: string | null;
  learningArea: string;
  linkedOutcomes: Array<{
    outcomeId: string;
    outcomeCode: string;
    outcomeLabel: string;
  }>;
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

export async function loadEvidenceOutcomeLinks(
  evidenceId: string,
): Promise<EvidenceOutcomeLink[]> {
  const response = await supabase
    .from("evidence_outcomes")
    .select("outcome_id")
    .eq("evidence_id", evidenceId);

  if (response.error) {
    throw response.error;
  }

  return ((response.data ?? []) as Array<{ outcome_id?: string | null }>).map((row) => ({
    outcomeId: String(row.outcome_id ?? "").trim(),
  })).filter((row) => row.outcomeId);
}

export async function linkEvidenceToOutcomes(input: {
  evidenceId: string;
  outcomeIds: string[];
}): Promise<void> {
  const uniqueOutcomeIds = Array.from(
    new Set(input.outcomeIds.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );

  if (!input.evidenceId.trim()) {
    throw new Error("Evidence ID is required.");
  }

  const existing = await loadEvidenceOutcomeLinks(input.evidenceId);
  const existingIds = new Set(existing.map((row) => row.outcomeId));
  const missingOutcomeIds = uniqueOutcomeIds.filter((id) => !existingIds.has(id));

  if (!missingOutcomeIds.length) return;

  const response = await supabase.from("evidence_outcomes").insert(
    missingOutcomeIds.map((outcomeId) => ({
      evidence_id: input.evidenceId,
      outcome_id: outcomeId,
    })),
  );

  if (response.error) {
    throw response.error;
  }
}

export async function loadReportSupportingEvidence(input: {
  evidenceIds: string[];
  studentId?: string | null;
  limit?: number;
}): Promise<ReportSupportingEvidenceItem[]> {
  const evidenceIds = Array.from(
    new Set(input.evidenceIds.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );

  if (!evidenceIds.length) return [];

  const evidenceResponse = await supabase
    .from("evidence_entries")
    .select(
      "id,title,summary,body,note,occurred_on,created_at,learning_area,student_id,is_deleted",
    )
    .in("id", evidenceIds)
    .eq("is_deleted", false)
    .order("occurred_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (evidenceResponse.error) {
    throw evidenceResponse.error;
  }

  const evidenceRows = ((evidenceResponse.data ?? []) as Array<{
    id?: string | null;
    title?: string | null;
    summary?: string | null;
    body?: string | null;
    note?: string | null;
    occurred_on?: string | null;
    created_at?: string | null;
    learning_area?: string | null;
    student_id?: string | null;
    is_deleted?: boolean | null;
  }>).filter((row) => {
    if (input.studentId && String(row.student_id ?? "").trim() !== input.studentId.trim()) {
      return false;
    }
    return row.is_deleted !== true;
  });

  if (!evidenceRows.length) return [];

  const outcomeResponse = await supabase
    .from("evidence_outcomes")
    .select(
      "evidence_id,outcome_id,curriculum_outcomes!inner(code,short_label,full_text)",
    )
    .in(
      "evidence_id",
      evidenceRows.map((row) => String(row.id ?? "").trim()).filter(Boolean),
    );

  if (outcomeResponse.error) {
    throw outcomeResponse.error;
  }

  const outcomeMap = new Map<
    string,
    Array<{ outcomeId: string; outcomeCode: string; outcomeLabel: string }>
  >();

  for (const row of (outcomeResponse.data ?? []) as Array<{
    evidence_id?: string | null;
    outcome_id?: string | null;
    curriculum_outcomes?:
      | {
          code?: string | null;
          short_label?: string | null;
          full_text?: string | null;
        }
      | Array<{
          code?: string | null;
          short_label?: string | null;
          full_text?: string | null;
        }>
      | null;
  }>) {
    const evidenceId = String(row.evidence_id ?? "").trim();
    const outcomeId = String(row.outcome_id ?? "").trim();
    if (!evidenceId || !outcomeId) continue;

    const curriculumOutcome = Array.isArray(row.curriculum_outcomes)
      ? row.curriculum_outcomes[0]
      : row.curriculum_outcomes ?? null;

    const next = {
      outcomeId,
      outcomeCode: String(curriculumOutcome?.code ?? "").trim(),
      outcomeLabel:
        String(curriculumOutcome?.short_label ?? "").trim() ||
        String(curriculumOutcome?.full_text ?? "").trim() ||
        "Outcome",
    };

    outcomeMap.set(evidenceId, [...(outcomeMap.get(evidenceId) ?? []), next]);
  }

  const limit = input.limit ?? 4;

  return evidenceRows.slice(0, limit).map((row) => {
    const id = String(row.id ?? "").trim();
    const summary =
      String(row.summary ?? "").trim() ||
      String(row.note ?? "").trim() ||
      String(row.body ?? "").trim();

    return {
      id,
      title: String(row.title ?? "").trim() || "Saved evidence",
      summary,
      occurredOn: String(row.occurred_on ?? row.created_at ?? "").trim() || null,
      learningArea: String(row.learning_area ?? "").trim() || "Learning area not set",
      linkedOutcomes: (outcomeMap.get(id) ?? []).slice(0, 3),
    };
  });
}
