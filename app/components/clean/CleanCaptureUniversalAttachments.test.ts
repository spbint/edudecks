import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLEAN_CAPTURE_FILE_ACCEPT,
  CLEAN_CAPTURE_MAX_FILE_BYTES,
  isSupportedCleanCaptureFile,
} from "@/lib/clean/evidence/attachmentPolicy";

const captureSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCaptureWorkspace.tsx"),
  "utf8",
);
const quickCaptureSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanQuickCaptureWorkspace.tsx"),
  "utf8",
);
const attachmentControlsSource = readFileSync(
  join(process.cwd(), "app/components/clean/evidence/CleanEvidenceAttachmentControls.tsx"),
  "utf8",
);
const attachmentHookSource = readFileSync(
  join(process.cwd(), "lib/clean/evidence/useCleanEvidenceAttachments.ts"),
  "utf8",
);
const attachmentPolicySource = readFileSync(
  join(process.cwd(), "lib/clean/evidence/attachmentPolicy.ts"),
  "utf8",
);
const daySource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"),
  "utf8",
);
const familyEvidenceSource = readFileSync(join(process.cwd(), "lib/familyEvidence.ts"), "utf8");

describe("universal Quick Capture attachments", () => {
  it("allows conservative common evidence files and rejects unsupported formats", () => {
    expect(CLEAN_CAPTURE_FILE_ACCEPT).toContain(".pdf");
    expect(CLEAN_CAPTURE_FILE_ACCEPT).toContain(".docx");
    expect(CLEAN_CAPTURE_MAX_FILE_BYTES).toBe(25 * 1024 * 1024);
    expect(isSupportedCleanCaptureFile({ name: "reading.pdf", type: "application/pdf" })).toBe(true);
    expect(isSupportedCleanCaptureFile({ name: "notes.docx", type: "" })).toBe(true);
    expect(isSupportedCleanCaptureFile({ name: "archive.zip", type: "application/zip" })).toBe(false);
  });

  it("shows the same camera, library, file, replace and remove controls in both modes", () => {
    expect(captureSource).toContain("CleanEvidenceAttachmentControls");
    expect(quickCaptureSource).toContain("CleanEvidenceAttachmentControls");
    for (const label of ["Take photo", "Choose photo", "Upload file", "Replace photo", "Remove photo", "Replace file", "Remove file"]) {
      expect(attachmentControlsSource).toContain(label);
    }
    expect(attachmentControlsSource).toContain("CLEAN_CAPTURE_FILE_ACCEPT");
    expect(attachmentHookSource).toContain("uploadFamilyEvidenceFiles");
  });

  it("keeps linked context and existing evidence defaults on the canonical save path", () => {
    expect(captureSource).toContain("title: title ||");
    expect(captureSource).toContain("learningArea: learningArea ||");
    expect(captureSource).toContain("calendarItemId: calendarItemId || null");
    expect(captureSource).toContain("includeInPortfolio: lifeAddToPortfolio");
    expect(captureSource).toContain("includeInReport: lifeIncludeInReport");
    expect(captureSource).toContain("lastSavedMyDayReturnPath");
    expect(captureSource).toContain("Back to My Day");
    expect(quickCaptureSource).toContain("includeInPortfolio: true");
    expect(quickCaptureSource).toContain("includeInReport: true");
    expect(quickCaptureSource).toContain('parentNote: reflection.trim() || null');
    expect(quickCaptureSource).toContain("calendarItemId: requestedCalendarItemId || null");
  });

  it("persists file attachments through the existing evidence columns", () => {
    expect(attachmentHookSource).toContain("fileUrl: uploadResult.uploaded.find");
    expect(attachmentHookSource).toContain("const files = [photoFile, evidenceFile]");
    expect(attachmentHookSource).toContain("attachmentMetadata(uploadResult.uploaded)");
    expect(familyEvidenceSource).toContain("file_url");
    expect(familyEvidenceSource).toContain("attachment_urls");
  });

  it("keeps selected attachments local until the save path invokes upload", () => {
    expect(attachmentHookSource).toContain("if (!files.length) return []");
    expect(attachmentControlsSource).not.toContain("uploadFamilyEvidenceFiles");
    expect(attachmentControlsSource).not.toContain("updateFamilyEvidenceEntryAttachments");
  });

  it("revalidates selected files immediately before the shared storage helper", () => {
    expect(attachmentHookSource).toContain("const currentValidationError = validateSelectedAttachments();");
    expect(attachmentHookSource).toContain("const uploadResult = await uploadFamilyEvidenceFiles");
    expect(attachmentHookSource.indexOf("const currentValidationError")).toBeLessThan(
      attachmentHookSource.indexOf("const uploadResult = await uploadFamilyEvidenceFiles"),
    );
    expect(attachmentPolicySource).toContain("SUPPORTED_DOCUMENT_EXTENSIONS");
  });

  it("keeps completion separate and gives My Day one obvious capture action", () => {
    expect(daySource).toContain("✓ Learning captured");
    expect(daySource).toContain("Quick Capture");
    expect(daySource).not.toContain("setCompletedAt");
  });
});
