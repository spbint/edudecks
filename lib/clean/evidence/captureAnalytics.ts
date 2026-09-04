export type CaptureSourceSurface =
  | "pathways"
  | "my_day"
  | "calendar"
  | "quick_capture"
  | "general"
  | "other_internal";

export function resolveCaptureSourceSurface(input: {
  isQuickCapture?: boolean;
  hasPathwayContext?: boolean;
  hasCalendarItem?: boolean;
  returnTo?: string | null;
}): CaptureSourceSurface {
  if (input.isQuickCapture) return "quick_capture";
  if (input.hasPathwayContext) return "pathways";

  const returnTo = String(input.returnTo ?? "");
  if (returnTo.startsWith("/my-day") || returnTo.startsWith("/clean-my-day")) {
    return "my_day";
  }
  if (input.hasCalendarItem) return "calendar";
  return "general";
}

export function captureAttachmentCategory(files: Array<{ type?: string | null; mimeType?: string | null }>) {
  return files.some((file) => String(file.type ?? file.mimeType ?? "").toLowerCase().startsWith("image/"))
    ? "image"
    : "document";
}
