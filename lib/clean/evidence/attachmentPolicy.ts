export const CLEAN_CAPTURE_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const CLEAN_CAPTURE_MAX_FILE_BYTES = 25 * 1024 * 1024;

export const CLEAN_CAPTURE_FILE_ACCEPT = [
  "image/*",
  ".pdf",
  ".doc",
  ".docx",
  ".odt",
  ".rtf",
  ".txt",
].join(",");

const SUPPORTED_DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "odt",
  "rtf",
  "txt",
]);

function fileExtension(name: string) {
  const normalized = name.trim().toLowerCase();
  const separator = normalized.lastIndexOf(".");
  return separator >= 0 ? normalized.slice(separator + 1) : "";
}

export function isSupportedCleanCaptureFile(file: { name: string; type: string }) {
  const mimeType = file.type.trim().toLowerCase();
  return mimeType.startsWith("image/") || SUPPORTED_DOCUMENT_EXTENSIONS.has(fileExtension(file.name));
}
