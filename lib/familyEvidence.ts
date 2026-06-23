import { supabase } from "@/lib/supabaseClient";
import { isMissingLearnerRelationOrColumn } from "@/lib/familyLearners";

type QueryClient = Pick<typeof supabase, "from">;
type StorageClient = Pick<typeof supabase, "storage">;

// Evidence attachments are child and compliance sensitive.
// New attachment records store private storage paths in metadata, not public URLs.
// Signed URLs are created only at render/export time. Legacy public URL records
// remain supported temporarily for compatibility and should be migrated to
// private paths later.
export const FAMILY_EVIDENCE_STORAGE_BUCKET = "evidence";
const FAMILY_EVIDENCE_SIGNED_URL_TTL_SECONDS = 10 * 60;

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
  attachmentUrls?: Array<string | StoredFamilyEvidenceAttachment> | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  fileUrl?: string | null;
  linkedLearningBlockId?: string | null;
  curriculumOutcomeIds?: string[] | null;
  outcomeStatusById?: Record<string, "understood" | "in_progress" | "needs_support"> | null;
};

export type FamilyEvidenceAttachmentKind = "image" | "file" | "audio";

export type StoredFamilyEvidenceAttachment = {
  path: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
  kind?: FamilyEvidenceAttachmentKind | null;
};

export type FamilyEvidenceAttachmentLink = {
  url: string | null;
  label: string;
  kind: FamilyEvidenceAttachmentKind;
  path: string | null;
  mimeType: string | null;
  size: number | null;
  isLegacyPublicUrl: boolean;
};

export type FamilyEvidenceAttachmentSummary = {
  attachments: FamilyEvidenceAttachmentLink[];
  attachmentCount: number;
  imageUrl: string | null;
  fileUrl: string | null;
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
  label: string;
  path: string;
  mimeType: string | null;
  size: number | null;
  kind: FamilyEvidenceAttachmentKind;
};

export type FailedFamilyEvidenceFileUpload = {
  name: string;
  message: string;
  code?: string | null;
  status?: string | number | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function visibilityForEvidenceInsert(value: unknown) {
  const clean = safe(value).toLowerCase();
  if (clean === "teacher") return "teacher";
  return null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function asObject(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function looksLikeStoragePath(value: string) {
  if (!value) return false;
  if (isAbsoluteUrl(value)) return false;
  if (value.startsWith("{") || value.startsWith("[")) return false;
  return value.includes("/") && !value.includes(" ");
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function stripAttachmentToken(filename: string) {
  return filename
    .replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "")
    .replace(/^\d{10,}-[a-z0-9]{4,}-/i, "")
    .replace(/^\d{10,}-/i, "");
}

function attachmentLabelFromReference(reference: string) {
  const clean = safe(reference);
  if (!clean) return "Attachment";

  const withoutQuery = clean.split("?")[0] || clean;
  const filename = safeDecode(withoutQuery.split("/").pop() || "");
  const stripped = stripAttachmentToken(filename);
  return stripped || filename || "Attachment";
}

function attachmentKindFromReference(reference: string): FamilyEvidenceAttachmentKind {
  const normalized = attachmentLabelFromReference(reference).toLowerCase();

  if (/\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i.test(normalized)) {
    return "image";
  }
  if (/\.(mp3|m4a|wav|ogg|aac)$/i.test(normalized)) {
    return "audio";
  }
  return "file";
}

function attachmentKindFromMimeType(
  mimeType: string | null,
  fallbackReference: string,
): FamilyEvidenceAttachmentKind {
  const normalized = safe(mimeType).toLowerCase();
  if (normalized.startsWith("image/")) return "image";
  if (normalized.startsWith("audio/")) return "audio";
  if (normalized) return "file";
  return attachmentKindFromReference(fallbackReference);
}

function attachmentKindFromFile(file: Pick<File, "type" | "name">): FamilyEvidenceAttachmentKind {
  return attachmentKindFromMimeType(safe(file.type) || null, file.name);
}

function sanitizeAttachmentFilename(filename: string) {
  return safe(filename).replace(/[^a-zA-Z0-9._-]/g, "-") || "attachment";
}

function uniqueAttachmentToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function evidenceDescriptionFor(row: Record<string, unknown>) {
  return safe(row.note) || safe(row.summary) || safe(row.body) || null;
}

function flattenAttachmentValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  const raw = safe(value);
  if (!raw) return [];

  if (raw.startsWith("[") || raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch {
      return [raw];
    }
  }

  return [raw];
}

function normalizeStoredAttachment(value: unknown): StoredFamilyEvidenceAttachment | null {
  const row = asObject(value);
  if (!row) return null;

  const path =
    safe(row.path) ||
    safe(row.storagePath) ||
    safe(row.objectPath) ||
    "";
  if (!path) return null;

  const name =
    safe(row.name) ||
    safe(row.label) ||
    safe(row.filename) ||
    attachmentLabelFromReference(path);

  const mimeType = safe(row.mimeType) || safe(row.contentType) || null;
  const size =
    toNullableNumber(row.size) ??
    toNullableNumber(row.sizeBytes) ??
    toNullableNumber(row.fileSizeBytes);
  const kind = attachmentKindFromMimeType(mimeType, name || path);

  return {
    path,
    name,
    mimeType,
    size,
    kind,
  };
}

function normalizeAttachmentLink(value: unknown): FamilyEvidenceAttachmentLink | null {
  const stored = normalizeStoredAttachment(value);
  if (stored) {
    return {
      url: null,
      label: stored.name,
      kind: stored.kind || attachmentKindFromReference(stored.name || stored.path),
      path: stored.path,
      mimeType: stored.mimeType || null,
      size: stored.size ?? null,
      isLegacyPublicUrl: false,
    };
  }

  const row = asObject(value);
  if (row) {
    const url = safe(row.url) || safe(row.publicUrl) || safe(row.href);
    if (url) {
      const mimeType = safe(row.mimeType) || safe(row.contentType) || null;
      const label = safe(row.name) || safe(row.label) || attachmentLabelFromReference(url);
      return {
        url,
        label,
        kind: attachmentKindFromMimeType(mimeType, label || url),
        path: null,
        mimeType,
        size:
          toNullableNumber(row.size) ??
          toNullableNumber(row.sizeBytes) ??
          toNullableNumber(row.fileSizeBytes),
        isLegacyPublicUrl: true,
      };
    }
    return null;
  }

  const raw = safe(value);
  if (!raw) return null;

  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return normalizeAttachmentLink(parsed[0]);
      }
      return normalizeAttachmentLink(parsed);
    } catch {
      return null;
    }
  }

  if (isAbsoluteUrl(raw)) {
    return {
      url: raw,
      label: attachmentLabelFromReference(raw),
      kind: attachmentKindFromReference(raw),
      path: null,
      mimeType: null,
      size: null,
      isLegacyPublicUrl: true,
    };
  }

  if (looksLikeStoragePath(raw)) {
    return {
      url: null,
      label: attachmentLabelFromReference(raw),
      kind: attachmentKindFromReference(raw),
      path: raw,
      mimeType: null,
      size: null,
      isLegacyPublicUrl: false,
    };
  }

  return null;
}

function dedupeAttachmentLinks(attachments: FamilyEvidenceAttachmentLink[]) {
  const seen = new Set<string>();
  return attachments.filter((attachment) => {
    const key =
      safe(attachment.path) ||
      safe(attachment.url) ||
      `${attachment.kind}:${attachment.label.toLowerCase()}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function serializeStoredAttachmentValue(value: string | StoredFamilyEvidenceAttachment) {
  if (typeof value === "string") return safe(value);

  const stored = normalizeStoredAttachment(value);
  if (!stored) return "";

  return JSON.stringify({
    path: stored.path,
    name: stored.name,
    mimeType: stored.mimeType || null,
    size: stored.size ?? null,
    kind: stored.kind || attachmentKindFromReference(stored.name || stored.path),
  });
}

function serializeAttachmentValues(values: Array<string | StoredFamilyEvidenceAttachment> | null | undefined) {
  if (!Array.isArray(values)) return [];
  return unique(values.map((value) => serializeStoredAttachmentValue(value)));
}

function logFamilyEvidenceAttachmentDiagnostic(
  phase: string,
  details: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "production") return;
  console.info("[family-evidence-attachments]", {
    phase,
    ...details,
  });
}

function isEvidenceAttachmentSchemaError(error: unknown) {
  const row = asObject(error);
  const code = safe(row?.code);
  const message = safe(row?.message);
  const details = safe(row?.details);
  const hint = safe(row?.hint);
  const combined = `${code} ${message} ${details} ${hint}`;

  return (
    code === "PGRST204" ||
    /schema cache|could not find|column .* does not exist|attachment_urls|image_url|audio_url|file_url/i.test(
      combined,
    )
  );
}

function attachmentPathSet(values: string[]) {
  const paths = new Set<string>();
  values.forEach((value) => {
    const raw = safe(value);
    const stored =
      normalizeStoredAttachment(value) ||
      (raw.startsWith("{")
        ? (() => {
            try {
              return normalizeStoredAttachment(JSON.parse(raw));
            } catch {
              return null;
            }
          })()
        : null);
    const path = safe(stored?.path) || (looksLikeStoragePath(raw) ? raw : "");
    if (path) paths.add(path);
  });
  return paths;
}

export function summarizeFamilyEvidenceAttachments(input: {
  attachment_urls?: unknown;
  image_url?: unknown;
  file_url?: unknown;
  audio_url?: unknown;
}): FamilyEvidenceAttachmentSummary {
  const attachments = dedupeAttachmentLinks(
    [
      input.image_url,
      input.file_url,
      input.audio_url,
      ...flattenAttachmentValues(input.attachment_urls),
    ]
      .map((value) => normalizeAttachmentLink(value))
      .filter(Boolean) as FamilyEvidenceAttachmentLink[],
  );

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

export async function resolveFamilyEvidenceAttachmentLinks(
  attachments: FamilyEvidenceAttachmentLink[],
  options?: {
    includeSignedUrls?: boolean;
    includeSignedImageUrls?: boolean;
    signedUrlExpiresInSeconds?: number;
    storageClient?: StorageClient;
  },
) {
  const storage = options?.storageClient ?? supabase;
  const signedUrlExpiresInSeconds =
    options?.signedUrlExpiresInSeconds ?? FAMILY_EVIDENCE_SIGNED_URL_TTL_SECONDS;

  return Promise.all(
    attachments.map(async (attachment) => {
      if (attachment.url || !attachment.path) return attachment;

      const shouldSign =
        options?.includeSignedUrls ||
        (options?.includeSignedImageUrls && attachment.kind === "image");

      if (!shouldSign) return attachment;

      const response = await storage.storage
        .from(FAMILY_EVIDENCE_STORAGE_BUCKET)
        .createSignedUrl(attachment.path, signedUrlExpiresInSeconds);

      if (response.error) {
        return attachment;
      }

      const signedUrl = safe(response.data?.signedUrl);
      if (!signedUrl) return attachment;

      return {
        ...attachment,
        url: signedUrl,
      };
    }),
  );
}

export async function resolveFamilyEvidenceAttachmentSummary(
  input: {
    attachment_urls?: unknown;
    image_url?: unknown;
    file_url?: unknown;
    audio_url?: unknown;
  },
  options?: {
    includeSignedUrls?: boolean;
    includeSignedImageUrls?: boolean;
    signedUrlExpiresInSeconds?: number;
    storageClient?: StorageClient;
  },
): Promise<FamilyEvidenceAttachmentSummary> {
  const summary = summarizeFamilyEvidenceAttachments(input);
  if (!summary.attachmentCount) return summary;

  const attachments = await resolveFamilyEvidenceAttachmentLinks(summary.attachments, options);
  return {
    attachments,
    attachmentCount: attachments.length,
    imageUrl: attachments.find((item) => item.kind === "image")?.url || null,
    fileUrl:
      attachments.find((item) => item.kind === "file")?.url ||
      attachments.find((item) => item.kind === "audio")?.url ||
      null,
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
  const attachmentUrls = serializeAttachmentValues(input.attachmentUrls);
  const occurredOn = safe(input.occurredOn) || todayYmd();
  const visibility = visibilityForEvidenceInsert(input.visibility);

  const curriculumOutcomeIds = Array.isArray(input.curriculumOutcomeIds)
    ? input.curriculumOutcomeIds.map((value) => safe(value)).filter(Boolean)
    : [];

  const basePayload = {
    student_id: input.studentId,
    user_id: safe(input.userId) || null,
    title: input.title,
    summary: input.summary,
    body: input.summary,
    note,
    evidence_type: input.evidenceType ?? "note",
    occurred_on: occurredOn,
    learning_area: safe(input.learningArea) || null,
    attachment_urls: attachmentUrls.length ? attachmentUrls : null,
    image_url: safe(input.imageUrl) || null,
    audio_url: safe(input.audioUrl) || null,
    file_url: safe(input.fileUrl) || null,
    linked_learning_plan_item_id: safe(input.linkedLearningBlockId) || null,
    curriculum_outcome_ids: curriculumOutcomeIds.length ? curriculumOutcomeIds : [],
    outcome_status_by_id: input.outcomeStatusById ?? {},
    is_deleted: false,
  };

  const primaryPayload = visibility
    ? {
        ...basePayload,
        visibility,
      }
    : basePayload;

  const response = await supabase
    .from("evidence_entries")
    .insert(primaryPayload)
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
      occurred_on: occurredOn,
      learning_area: safe(input.learningArea) || null,
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
  studentId?: string | null;
  attachmentUrls?: Array<string | StoredFamilyEvidenceAttachment> | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  fileUrl?: string | null;
}): Promise<{
  id: string;
  attachmentUrls: string[];
  imageUrl: string | null;
}> {
  const evidenceId = safe(input.evidenceId);
  const studentId = safe(input.studentId);
  if (!evidenceId) {
    throw new Error("Evidence ID is required before attachments can be updated.");
  }

  const attachmentUrls = serializeAttachmentValues(input.attachmentUrls);
  const updatePayload: Record<string, unknown> = {};
  const hasAttachmentUrls = Object.prototype.hasOwnProperty.call(input, "attachmentUrls");
  const hasImageUrl = Object.prototype.hasOwnProperty.call(input, "imageUrl");
  const hasAudioUrl = Object.prototype.hasOwnProperty.call(input, "audioUrl");
  const hasFileUrl = Object.prototype.hasOwnProperty.call(input, "fileUrl");

  if (hasAttachmentUrls) {
    updatePayload.attachment_urls = attachmentUrls.length ? attachmentUrls : null;
  }
  if (hasImageUrl) {
    updatePayload.image_url = safe(input.imageUrl) || null;
  }
  if (hasAudioUrl) {
    updatePayload.audio_url = safe(input.audioUrl) || null;
  }
  if (hasFileUrl) {
    updatePayload.file_url = safe(input.fileUrl) || null;
  }

  if (!Object.keys(updatePayload).length) {
    throw new Error("No attachment fields were provided for this evidence entry.");
  }

  let query = supabase
    .from("evidence_entries")
    .update(updatePayload)
    .eq("id", evidenceId);

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  logFamilyEvidenceAttachmentDiagnostic("update-started", {
    evidenceId,
    filteredByLegacyStudentId: Boolean(studentId),
    updatedColumns: Object.keys(updatePayload),
    attachmentCount: attachmentUrls.length,
  });

  const response = await query
    .select("id,attachment_urls,image_url")
    .single();

  if (response.error) {
    logFamilyEvidenceAttachmentDiagnostic("update-failed", {
      evidenceId,
      code: safe((response.error as unknown as { code?: unknown }).code) || null,
      message: response.error.message,
      details: safe((response.error as unknown as { details?: unknown }).details) || null,
      hint: safe((response.error as unknown as { hint?: unknown }).hint) || null,
      status: safe((response.error as unknown as { status?: unknown }).status) || null,
    });

    if (isEvidenceAttachmentSchemaError(response.error)) {
      throw new Error(
        "Evidence attachment columns are not available in the live schema cache. Run the evidence attachment migration and refresh the Supabase schema cache.",
      );
    }

    throw response.error;
  }

  const row = (response.data ?? {}) as {
    id?: unknown;
    attachment_urls?: unknown;
    image_url?: unknown;
  };
  const storedAttachmentValues = serializeAttachmentValues(
    flattenAttachmentValues(row.attachment_urls)
      .map((value) => {
        const stored = normalizeStoredAttachment(value);
        return stored ?? safe(value);
      })
      .filter(Boolean) as Array<string | StoredFamilyEvidenceAttachment>,
  );
  const expectedPaths = attachmentPathSet(attachmentUrls);
  const storedPaths = attachmentPathSet(storedAttachmentValues);
  const storedImageUrl = safe(row.image_url) || null;
  const expectedImageUrl = safe(input.imageUrl) || null;
  const hasStoredAllExpectedAttachments =
    !expectedPaths.size ||
    Array.from(expectedPaths).every((path) => storedPaths.has(path));
  const hasStoredExpectedImage =
    !expectedImageUrl ||
    storedImageUrl === expectedImageUrl ||
    storedPaths.has(expectedImageUrl);

  logFamilyEvidenceAttachmentDiagnostic("update-succeeded", {
    evidenceId,
    storedAttachmentCount: storedAttachmentValues.length,
    storedImageUrlPresent: Boolean(storedImageUrl),
    verifiedAttachments: hasStoredAllExpectedAttachments,
    verifiedImage: hasStoredExpectedImage,
  });

  if (!hasStoredAllExpectedAttachments || !hasStoredExpectedImage) {
    throw new Error("Evidence attachment update did not persist the uploaded photo reference.");
  }

  return {
    id: safe(row.id) || evidenceId,
    attachmentUrls: storedAttachmentValues,
    imageUrl: storedImageUrl,
  };
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
    const objectPath = `family/${familyProfileId}/learner/${studentId}/evidence/${evidenceId}/${uniqueAttachmentToken()}-${safeName}`;
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
        code: safe((uploadError as unknown as { code?: unknown }).code) || null,
        status:
          safe((uploadError as unknown as { statusCode?: unknown }).statusCode) ||
          safe((uploadError as unknown as { status?: unknown }).status) ||
          null,
      });
      continue;
    }

    uploaded.push({
      label: safe(file.name) || attachmentLabelFromReference(objectPath),
      path: objectPath,
      mimeType: safe(file.type) || null,
      size: typeof file.size === "number" ? file.size : null,
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
  storageClient?: StorageClient;
  includeSignedImageUrls?: boolean;
  signedUrlExpiresInSeconds?: number;
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

  const records = await Promise.all(
    rows.map(async (row, index) => {
      const summary =
        input.includeSignedImageUrls
          ? await resolveFamilyEvidenceAttachmentSummary(row, {
              includeSignedImageUrls: true,
              signedUrlExpiresInSeconds: input.signedUrlExpiresInSeconds,
              storageClient: input.storageClient,
            })
          : summarizeFamilyEvidenceAttachments(row);
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
    }),
  );

  return records.filter(Boolean) as FamilyEvidenceAttachmentRecord[];
}
