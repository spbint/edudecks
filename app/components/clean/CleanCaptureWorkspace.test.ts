import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCaptureWorkspace.tsx"),
  "utf8",
);

describe("My Capture success receipt", () => {
  it("makes a complete saved record replace the reset form and announces it", () => {
    expect(source).toContain("const showSavedReceipt = Boolean(lastSavedEvidenceId && !pendingAttachmentError);");
    expect(source).toContain("{!showSavedReceipt ? (");
    expect(source).toContain('role="status"');
    expect(source).toContain("successReceiptRef.current?.focus()");
    expect(source).toContain("✓ Learning saved");
  });

  it("keeps the proof and handoffs tied to the saved evidence", () => {
    expect(source).toContain("Added to ${lastSavedLearnerLabel || \"your learner\"}'s Portfolio.");
    expect(source).toContain("lastSavedPhotoAttached && lastSavedPhotoPreviewUrl");
    expect(source).toContain("Saved learning photo preview");
    expect(source).toContain("latestEvidenceId=${encodeURIComponent(lastSavedEvidenceId)}&source=my-capture");
    expect(source).toContain("View in My Portfolio");
  });

  it("keeps contextual returns, capture another, and attachment recovery distinct", () => {
    expect(source).toContain("Back to My Day");
    expect(source).toContain("Return to pathway");
    expect(source).toContain("Back to My Learna");
    expect(source).toContain("function captureAnother()");
    expect(source).toContain("capture_another_selected");
    expect(source).toContain("Retry attachment");
    expect(source).toContain("Retry attachment");
  });

  it("continues to accept only safe internal return paths while general Capture has no return requirement", () => {
    expect(source).toContain('returnToFromQuery.startsWith("/") && !returnToFromQuery.startsWith("//")');
    expect(source).toContain('const returnToFromQuery = safeQueryValue(searchParams.get("returnTo"));');
    expect(source).toContain('const pathwaysReturnPath = pathname.startsWith("/clean-my-capture")');
  });
});
