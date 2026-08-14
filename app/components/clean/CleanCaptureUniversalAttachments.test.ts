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
    for (const source of [captureSource, quickCaptureSource]) {
      expect(source.includes("Take photo") || source.includes("Take a photo")).toBe(true);
      expect(source).toContain("Choose photo");
      expect(source).toContain("Upload file");
      expect(source).toContain("Remove photo");
      expect(source).toContain("Remove file");
      expect(source).toContain("CLEAN_CAPTURE_FILE_ACCEPT");
      expect(source).toContain("uploadFamilyEvidenceFiles");
    }
    expect(captureSource).toContain("Replace photo");
    expect(captureSource).toContain("Replace file");
    expect(quickCaptureSource).toContain("Replace photo");
  });

  it("keeps linked context and existing evidence defaults on the canonical save path", () => {
    expect(captureSource).toContain("title: title ||");
    expect(captureSource).toContain("learningArea: learningArea ||");
    expect(captureSource).toContain("calendarItemId: calendarItemId || null");
    expect(captureSource).toContain("includeInPortfolio: lifeAddToPortfolio");
    expect(captureSource).toContain("includeInReport: lifeIncludeInReport");
    expect(captureSource).toContain("lastSavedMyDayReturnPath");
    expect(captureSource).toContain("Return to My Day");
    expect(quickCaptureSource).toContain("includeInPortfolio: true");
    expect(quickCaptureSource).toContain("includeInReport: true");
    expect(quickCaptureSource).toContain('parentNote: reflection.trim() || null');
    expect(quickCaptureSource).not.toContain("calendarItemId:");
  });

  it("persists file attachments through the existing evidence columns", () => {
    expect(captureSource).toContain("fileUrl: uploadedAttachments.find");
    expect(quickCaptureSource).toContain("fileUrl: uploaded.find");
    expect(familyEvidenceSource).toContain("file_url");
    expect(familyEvidenceSource).toContain("attachment_urls");
  });

  it("keeps completion separate and gives My Day one obvious capture action", () => {
    expect(daySource).toContain("✓ Learning captured");
    expect(daySource).toContain("Quick Capture");
    expect(daySource).not.toContain("setCompletedAt");
  });
});
