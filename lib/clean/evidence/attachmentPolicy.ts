export const CLEAN_CAPTURE_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// This policy mirrors the live private `evidence` Storage bucket. Keep these
// values aligned so Capture never offers a file that Storage will reject.
export const CLEAN_CAPTURE_MAX_FILE_BYTES = 10 * 1024 * 1024;

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const CLEAN_CAPTURE_FILE_ACCEPT = [
  ...SUPPORTED_IMAGE_MIME_TYPES,
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
].join(",");

export const CLEAN_CAPTURE_IMAGE_ACCEPT = Array.from(SUPPORTED_IMAGE_MIME_TYPES).join(",");

const SUPPORTED_DOCUMENT_MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

function fileExtension(name: string) {
  const normalized = name.trim().toLowerCase();
  const separator = normalized.lastIndexOf(".");
  return separator >= 0 ? normalized.slice(separator + 1) : "";
}

export function isSupportedCleanCaptureImage(file: { name: string; type: string }) {
  const extension = fileExtension(file.name);
  const mimeType = file.type.trim().toLowerCase();
  return (
    SUPPORTED_IMAGE_MIME_TYPES.has(mimeType) &&
    ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)
  );
}

export function isSupportedCleanCaptureFile(file: { name: string; type: string }) {
  if (isSupportedCleanCaptureImage(file)) return true;

  const extension = fileExtension(file.name);
  const mimeType = file.type.trim().toLowerCase();
  return SUPPORTED_DOCUMENT_MIME_TYPES_BY_EXTENSION[extension] === mimeType;
}
