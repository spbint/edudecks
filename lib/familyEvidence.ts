import { supabase } from "@/lib/supabaseClient";
import { isMissingLearnerRelationOrColumn } from "@/lib/familyLearners";

type QueryClient = Pick<typeof supabase, "from">;

export const FAMILY_EVIDENCE_STORAGE_BUCKET = "evidence";

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
  linkedLearningBlockId?: string | null;
  curriculumOutcomeIds?: string[] | null;
  outcomeStatusById?: Record<string, "understood" | "in_progress" | "needs_support"> | null;
};

export type FamilyEvidenceAttachmentKind = "image" | "file" | "audio";

export type FamilyEvidenceAttachmentLink = {
  url: string;
  label: string;
  kind: FamilyEvidenceAttachmentKind;
};

export type FamilyEvidenceAttachmentRecord = {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  learningArea: string | null;
  evidenceType: string | null;
  attachmentCount: number;
  attachments: FamilyEvidenceAttachmentLink[];
  imageUrl: string | null;
  fileUrl: string | null;
  linkedLearningBlockId: string | null;
};

export type UploadedFamilyEvidenceFile = {
  url: string;
  label: string;
  path: string;
  kind: FamilyEvidenceAttachmentKind;
};

export type FailedFamilyEvidenceFileUpload = {
  name: string;
  message: string;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeAttachmentUrlList(value: unknown) {
  if (Array.isArray(value)) {
    return unique(value.map((entry) => safe(entry)));
  }

  const raw = safe(value);
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return unique(parsed.map((entry) => safe(entry)));
      }
    } catch {
      return [raw];
    }
  }

  return [raw];
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function attachmentLabelFromUrl(url: string) {
  const clean = safe(url);
  if (!clean) return "Attachment";

  const withoutQuery = clean.split("?")[0] || clean;
  const filename = safeDecode(withoutQuery.split("/").pop() || "");
  const strippedTimestamp = filename.replace(/^\d{10,}-/, "");
  return strippedTimestamp || filename || "Attachment";
}

function attachmentKindFromUrl(url: string): FamilyEvidenceAttachmentKind {
  const normalized = attachmentLabelFromUrl(url).toLowerCase();

  if (/\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i.test(normalized)) {
    return "image";
  }
  if (/\.(mp3|m4a|wav|ogg|aac)$/i.test(normalized)) {
    return "audio";
  }
  return "file";
}

function attachmentKindFromFile(file: Pick<File, "type" | "name">): FamilyEvidenceAttachmentKind {
  const type = safe(file.type).toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("audio/")) return "audio";
  if (type) return "file";
  return attachmentKindFromUrl(file.name);
}

function sanitizeAttachmentFilename(filename: string) {
  return safe(filename).replace(/[^a-zA-Z0-9._-]/g, "-") || "attachment";
}

function evidenceDescriptionFor(row: Record<string, unknown>) {
  return (
    safe(row.note) ||
    safe(row.summary) ||
    safe(row.body) ||
    null
  );
}

export function summarizeFamilyEvidenceAttachments(input: {
  attachment_urls?: unknown;
  image_url?: unknown;
  file_url?: unknown;
  audio_url?: unknown;
}) {
  const orderedUrls = unique([
    safe(input.image_url),
    safe(input.file_url),
    safe(input.audio_url),
    ...normalizeAttachmentUrlList(input.attachment_urls),
  ]);

  const attachments = orderedUrls.map((url) => ({
    url,
    label: attachmentLabelFromUrl(url),
    kind: attachmentKindFromUrl(url),
  }));

  const primaryImage = attachments.find((item) => item.kind === "image")?.url || null;
  const primaryFile =
    attachments.find((item) => item.kind === "file")?.url ||
    attachments.find((item) => item.kind === "audio")?.url ||
    null;

  return {
    attachments,
    attachmentCount: attachments.length,
    imageUrl: primaryImage,
    fileUrl: primaryFile,
  };
}

export function attachmentCountLabel(count: number) {
  if (count <= 0) return "No attachments";
  if (count === 1) return "1 attachment";
  return `${count} attachments`;
}

export async function loadEvidenceEntriesWithVariants<T>(
  selectVariants: string[],
  options?: {
    studentId?: string | null;
    studentIds?: string[] | null;
    includeDeleted?: boolean;
    limit?: number;
    dateFrom?: string | null;
    dateTo?: string | null;
    client?: QueryClient;
  },
): Promise<T[]> {
  const studentId = options?.studentId ?? null;
  const studentIds = options?.studentIds ?? null;
  const includeDeleted = options?.includeDeleted === true;
  const limit = options?.limit ?? null;
  const dateFrom = safe(options?.dateFrom);
  const dateTo = safe(options?.dateTo);
  const db = options?.client ?? supabase;

  if (Array.isArray(studentIds) && studentIds.length === 0) return [];

  let lastError: unknown = null;

  for (const select of selectVariants) {
    let query = db.from("evidence_entries").select(select);

    if (studentId) {
      query = query.eq("student_id", studentId);
    } else if (Array.isArray(studentIds)) {
      query = query.in("student_id", studentIds);
    }

    if (!includeDeleted) {
      query = query.eq("is_deleted", false);
    }

    if (dateFrom) {
      query = query.gte("occurred_on", dateFrom);
    }

    if (dateTo) {
      query = query.lte("occurred_on", dateTo);
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

  const curriculumOutcomeIds = Array.isArray(input.curriculumOutcomeIds)
    ? input.curriculumOutcomeIds.map((value) => safe(value)).filter(Boolean)
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
      linked_learning_plan_item_id: safe(input.linkedLearningBlockId) || null,
      curriculum_outcome_ids: curriculumOutcomeIds.length ? curriculumOutcomeIds : [],
      outcome_status_by_id: input.outcomeStatusById ?? {},
      is_deleted: false,
    })
    .select("id")
    .single();

  if (!response.error) {
    return { id: String(response.data?.id ?? "").trim() };
  }

  if (!isMissingLearnerRelationOrColumn(response.error)) throw response.error;

  const fallback = await supabase
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

  if (fallback.error) throw fallback.error;
  return { id: String(fallback.data?.id ?? "").trim() };
}

export async function updateFamilyEvidenceEntryAttachments(input: {
  evidenceId: string;
  attachmentUrls?: string[] | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  fileUrl?: string | null;
}) {
  const evidenceId = safe(input.evidenceId);
  if (!evidenceId) {
    throw new Error("Evidence ID is required before attachments can be updated.");
  }

  const attachmentUrls = unique(
    Array.isArray(input.attachmentUrls)
      ? input.attachmentUrls.map((value) => safe(value))
      : [],
  );

  const response = await supabase
    .from("evidence_entries")
    .update({
      attachment_urls: attachmentUrls.length ? attachmentUrls : null,
      image_url: safe(input.imageUrl) || null,
      audio_url: safe(input.audioUrl) || null,
      file_url: safe(input.fileUrl) || null,
    })
    .eq("id", evidenceId)
    .select("id")
    .single();

  if (response.error) throw response.error;
  return { id: safe(response.data?.id) || evidenceId };
}

export async function uploadFamilyEvidenceFiles(input: {
  familyProfileId: string;
  studentId: string;
  evidenceId: string;
  files: File[];
}) {
  const familyProfileId = safe(input.familyProfileId);
  const studentId = safe(input.studentId);
  const evidenceId = safe(input.evidenceId);
  const files = Array.isArray(input.files) ? input.files : [];

  if (!familyProfileId || !studentId || !evidenceId) {
    throw new Error("Family, learner, and evidence context are required before uploading.");
  }

  const uploaded: UploadedFamilyEvidenceFile[] = [];
  const failed: FailedFamilyEvidenceFileUpload[] = [];

  for (const file of files) {
    const safeName = sanitizeAttachmentFilename(file.name);
    const objectPath = `family/${familyProfileId}/learner/${studentId}/evidence/${evidenceId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(FAMILY_EVIDENCE_STORAGE_BUCKET)
      .upload(objectPath, file, {
        upsert: false,
        contentType: safe(file.type) || undefined,
      });

    if (uploadError) {
      failed.push({
        name: file.name,
        message: safe(uploadError.message) || "Upload failed.",
      });
      continue;
    }

    const { data: publicData } = supabase.storage
      .from(FAMILY_EVIDENCE_STORAGE_BUCKET)
      .getPublicUrl(objectPath);

    const publicUrl = safe(publicData?.publicUrl);
    if (!publicUrl) {
      failed.push({
        name: file.name,
        message: "A file link could not be created after upload.",
      });
      continue;
    }

    uploaded.push({
      url: publicUrl,
      label: safe(file.name) || attachmentLabelFromUrl(publicUrl),
      path: objectPath,
      kind: attachmentKindFromFile(file),
    });
  }

  return { uploaded, failed };
}

export async function loadEvidenceAttachmentRecords(input: {
  studentId?: string | null;
  studentIds?: string[] | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit?: number;
  client?: QueryClient;
}) {
  const rows = await loadEvidenceEntriesWithVariants<Record<string, unknown>>(
    [
      "id,title,summary,body,note,occurred_on,learning_area,evidence_type,image_url,file_url,audio_url,attachment_urls,linked_learning_plan_item_id,created_at",
      "id,title,summary,body,note,occurred_on,learning_area,evidence_type,image_url,file_url,audio_url,attachment_urls,created_at",
    ],
    {
      studentId: input.studentId,
      studentIds: input.studentIds,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      limit: input.limit,
      client: input.client,
    },
  );

  return rows
    .map((row, index) => {
      const summary = summarizeFamilyEvidenceAttachments(row);
      if (!summary.attachmentCount) return null;

      return {
        id: safe(row.id) || `evidence-${index + 1}`,
        title: safe(row.title) || safe(row.summary) || "Learning evidence",
        description: evidenceDescriptionFor(row),
        date: safe(row.occurred_on) || safe(row.created_at) || null,
        learningArea: safe(row.learning_area) || null,
        evidenceType: safe(row.evidence_type) || null,
        attachmentCount: summary.attachmentCount,
        attachments: summary.attachments,
        imageUrl: summary.imageUrl,
        fileUrl: summary.fileUrl,
        linkedLearningBlockId: safe(row.linked_learning_plan_item_id) || null,
      } satisfies FamilyEvidenceAttachmentRecord;
    })
    .filter(Boolean) as FamilyEvidenceAttachmentRecord[];
}
