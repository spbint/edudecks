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

export type EvidenceOutcomeLink = {
  outcomeId: string;
};

export type ReportSupportingEvidenceItem = {
  id: string;
  title: string;
  summary: string;
  occurredOn: string | null;
  learningArea: string;
  attachmentCount: number;
  attachmentNames: string[];
  attachmentLabel: string | null;
  attachments: Array<{
    fileName: string;
    mimeType: string;
    bucketName: string | null;
    objectPath: string | null;
    source: "evidence_files" | "legacy_reference";
  }>;
  linkedOutcomes: Array<{
    outcomeId: string;
    outcomeCode: string;
    outcomeLabel: string;
  }>;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function parseAttachmentArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => safe(entry)).filter(Boolean);
  }

  const single = safe(value);
  return single ? [single] : [];
}

function extractAttachmentName(value: string) {
  const trimmed = safe(value);
  if (!trimmed) return "";

  const normalized = trimmed.split("?")[0] ?? trimmed;
  const pieces = normalized.split(/[\\/]/).filter(Boolean);
  return pieces[pieces.length - 1] ?? trimmed;
}

function mimeToAttachmentLabel(mimeType: string) {
  const mime = safe(mimeType).toLowerCase();
  if (!mime) return null;
  if (mime.includes("pdf")) return "PDF attached";
  if (mime.startsWith("image/")) return "Image attached";
  if (mime.startsWith("audio/")) return "Audio attached";
  if (mime.startsWith("video/")) return "Video attached";
  return "Attachment available";
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
  client?: typeof supabase;
}): Promise<ReportSupportingEvidenceItem[]> {
  const client = input.client ?? supabase;
  const evidenceIds = Array.from(
    new Set(input.evidenceIds.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );

  if (!evidenceIds.length) return [];

  const evidenceResponse = await client
    .from("evidence_entries")
    .select(
      "id,title,summary,body,note,occurred_on,created_at,learning_area,student_id,is_deleted,attachment_urls,image_url,file_url,audio_url",
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
    attachment_urls?: string[] | string | null;
    image_url?: string | null;
    file_url?: string | null;
    audio_url?: string | null;
  }>).filter((row) => {
    if (input.studentId && String(row.student_id ?? "").trim() !== input.studentId.trim()) {
      return false;
    }
    return row.is_deleted !== true;
  });

  if (!evidenceRows.length) return [];

  const explicitOrder = new Map(evidenceIds.map((id, index) => [id, index]));
  const orderedEvidenceRows = [...evidenceRows].sort((a, b) => {
    const aId = String(a.id ?? "").trim();
    const bId = String(b.id ?? "").trim();
    const aIndex = explicitOrder.get(aId);
    const bIndex = explicitOrder.get(bId);

    if (typeof aIndex === "number" && typeof bIndex === "number") {
      return aIndex - bIndex;
    }

    if (typeof aIndex === "number") return -1;
    if (typeof bIndex === "number") return 1;

    const aDate = String(a.occurred_on ?? a.created_at ?? "").trim();
    const bDate = String(b.occurred_on ?? b.created_at ?? "").trim();
    if (aDate && bDate && aDate !== bDate) {
      return bDate.localeCompare(aDate);
    }

    return aId.localeCompare(bId);
  });

  const outcomeResponse = await client
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

  const evidenceFileResponse = await client
    .from("evidence_files")
    .select("evidence_id,bucket_name,original_filename,mime_type,file_size_bytes,object_path")
    .in(
      "evidence_id",
      orderedEvidenceRows.map((row) => String(row.id ?? "").trim()).filter(Boolean),
    );

  if (evidenceFileResponse.error) {
    throw evidenceFileResponse.error;
  }

  const outcomeMap = new Map<
    string,
    Array<{ outcomeId: string; outcomeCode: string; outcomeLabel: string }>
  >();
  const attachmentMap = new Map<
    string,
    Array<{ name: string; mimeType: string; objectPath: string; bucketName: string }>
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

  for (const row of (evidenceFileResponse.data ?? []) as Array<{
    evidence_id?: string | null;
    bucket_name?: string | null;
    original_filename?: string | null;
    mime_type?: string | null;
    object_path?: string | null;
  }>) {
    const evidenceId = safe(row.evidence_id);
    if (!evidenceId) continue;

    const objectPath = safe(row.object_path);
    const fileName = safe(row.original_filename) || extractAttachmentName(objectPath);
    const next = {
      name: fileName || "Attached file",
      mimeType: safe(row.mime_type),
      objectPath,
      bucketName: safe(row.bucket_name),
    };

    attachmentMap.set(evidenceId, [...(attachmentMap.get(evidenceId) ?? []), next]);
  }

  const limit = input.limit ?? 4;

  return orderedEvidenceRows.slice(0, limit).map((row) => {
    const id = safe(row.id);
    const summary = safe(row.summary) || safe(row.note) || safe(row.body);
    const storedAttachments = attachmentMap.get(id) ?? [];
    const legacyAttachmentValues = [
      ...parseAttachmentArray(row.attachment_urls),
      safe(row.image_url),
      safe(row.file_url),
      safe(row.audio_url),
    ].filter(Boolean);
    const legacyAttachmentNames = legacyAttachmentValues
      .map((value) => extractAttachmentName(value))
      .filter(Boolean);
    const attachmentCount = storedAttachments.length || legacyAttachmentValues.length;
    const attachmentNames =
      storedAttachments.length > 0
        ? storedAttachments.map((file) => file.name).filter(Boolean).slice(0, 3)
        : legacyAttachmentNames.slice(0, 3);
    const attachments =
      storedAttachments.length > 0
        ? storedAttachments.map((file) => ({
            fileName: file.name,
            mimeType: file.mimeType,
            bucketName: file.bucketName || null,
            objectPath: file.objectPath || null,
            source: "evidence_files" as const,
          }))
        : legacyAttachmentValues.map((value) => ({
            fileName: extractAttachmentName(value) || "Attached file",
            mimeType: "",
            bucketName: null,
            objectPath: value || null,
            source: "legacy_reference" as const,
          }));
    const attachmentLabel =
      storedAttachments.length > 0
        ? mimeToAttachmentLabel(storedAttachments[0]?.mimeType ?? "")
        : attachmentCount > 0
          ? attachmentCount === 1
            ? "Attachment available"
            : `${attachmentCount} attachments`
          : null;

    return {
      id,
      title: safe(row.title) || "Saved evidence",
      summary,
      occurredOn: safe(row.occurred_on) || safe(row.created_at) || null,
      learningArea: safe(row.learning_area) || "Learning area not set",
      attachmentCount,
      attachmentNames,
      attachmentLabel,
      attachments,
      linkedOutcomes: (outcomeMap.get(id) ?? []).slice(0, 3),
    };
  });
}
