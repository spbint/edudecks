import * as Sentry from "@sentry/nextjs";
import { getCurrentCleanUserId, normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import { supabase } from "@/lib/supabaseClient";

export const RESOURCE_FILE_BUCKET = "learning-resources";
export const RESOURCE_FILE_MAX_BYTES = 26214400;
export const RESOURCE_STORAGE_ALLOWANCE_BYTES = 524288000;

function clean(value: unknown) { return String(value ?? "").trim(); }

function resourceSizeBucket(bytes: number) {
  if (bytes < 1024 * 1024) return "under_1mb";
  if (bytes <= 5 * 1024 * 1024) return "1_to_5mb";
  if (bytes <= 15 * 1024 * 1024) return "5_to_15mb";
  return "15_to_25mb";
}

function captureResourceUploadError(error: unknown, stage: "reservation" | "storage_upload" | "resource_attachment" | "cleanup", bytes: number) {
  const source = error as { code?: unknown; status?: unknown; message?: unknown };
  Sentry.captureException(error instanceof Error ? error : new Error("Resource PDF upload failed."), {
    level: "warning",
    tags: { operation: "resource_pdf_upload", stage, bucket: RESOURCE_FILE_BUCKET, size_bucket: resourceSizeBucket(bytes) },
    extra: {
      supabase_code: clean(source?.code) || undefined,
      supabase_status: source?.status ?? undefined,
      supabase_message: clean(source?.message) || undefined,
    },
  });
}

export function resourceFileSizeLabel(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 1024 * 1024 ? 1 : 2)} MB`;
}

export function isAllowedResourcePdf(file: File | null | undefined) {
  return Boolean(file && file.type === "application/pdf" && file.size > 0 && file.size <= RESOURCE_FILE_MAX_BYTES && /\.pdf$/i.test(file.name));
}

export async function getResourceStorageUsage(familyId: string) {
  const response = await supabase.from("family_resource_storage_usage").select("allowance_bytes,used_bytes,reserved_bytes").eq("family_id", familyId).maybeSingle();
  if (response.error) throw new Error(normalizeCleanErrorMessage(response.error, "Resource storage is unavailable right now."));
  const row = response.data as { allowance_bytes?: number; used_bytes?: number; reserved_bytes?: number } | null;
  const allowance = Number(row?.allowance_bytes ?? RESOURCE_STORAGE_ALLOWANCE_BYTES);
  const used = Number(row?.used_bytes ?? 0);
  const reserved = Number(row?.reserved_bytes ?? 0);
  return { allowanceBytes: allowance, usedBytes: used, reservedBytes: reserved, remainingBytes: Math.max(0, allowance - used - reserved) };
}

export async function uploadCustomLearningPdf(input: { familyId: string; customLearningItemId: string; file: File }) {
  const userId = await getCurrentCleanUserId();
  if (!userId) throw new Error("You need to sign in before uploading a PDF.");
  if (!isAllowedResourcePdf(input.file)) throw new Error(input.file.type !== "application/pdf" ? "Choose a PDF file." : input.file.size > RESOURCE_FILE_MAX_BYTES ? "PDF files can be up to 25 MB." : "Choose a PDF file with a .pdf filename.");
  const reserved = await supabase.rpc("mylearna_reserve_resource_file_upload", {
    p_family_id: input.familyId, p_custom_learning_item_id: input.customLearningItemId,
    p_original_filename: input.file.name, p_mime_type: input.file.type, p_byte_size: input.file.size,
  });
  if (reserved.error) {
    captureResourceUploadError(reserved.error, "reservation", input.file.size);
    throw new Error(normalizeCleanErrorMessage(reserved.error, "We could not reserve this PDF upload."));
  }
  const row = (Array.isArray(reserved.data) ? reserved.data[0] : reserved.data) as { reservation_id: string; resource_file_id: string; object_path: string };
  if (!row?.reservation_id || !row.object_path) throw new Error("PDF upload reservation was not confirmed.");
  let failureStage: "storage_upload" | "resource_attachment" = "storage_upload";
  try {
    const upload = await supabase.storage.from(RESOURCE_FILE_BUCKET).upload(row.object_path, input.file, { upsert: false, contentType: "application/pdf" });
    if (upload.error) throw upload.error;
    failureStage = "resource_attachment";
    const attached = await supabase.from("custom_learning_resources").insert({
      family_id: input.familyId, custom_learning_item_id: input.customLearningItemId, resource_type: "file",
      label: input.file.name, url: null, reference_text: null, resource_file_id: row.resource_file_id, created_by_user_id: userId,
    }).select("id,resource_type,label,url,reference_text,resource_file_id,position").single();
    if (attached.error) throw attached.error;
    return attached.data;
  } catch (error) {
    captureResourceUploadError(error, failureStage, input.file.size);
    const released = await supabase.rpc("mylearna_release_resource_file_upload", { p_reservation_id: row.reservation_id });
    if (released.error) captureResourceUploadError(released.error, "cleanup", input.file.size);
    throw new Error(normalizeCleanErrorMessage(error, "The PDF could not be uploaded. You can try again from Resources."));
  }
}

export async function openCustomLearningPdf(objectPath: string) {
  if (!clean(objectPath)) throw new Error("This PDF is not available right now.");
  const response = await supabase.storage.from(RESOURCE_FILE_BUCKET).createSignedUrl(objectPath, 10 * 60);
  if (response.error || !response.data?.signedUrl) throw new Error(normalizeCleanErrorMessage(response.error, "This PDF is not available right now."));
  window.open(response.data.signedUrl, "_blank", "noopener,noreferrer");
  return response.data.signedUrl;
}
