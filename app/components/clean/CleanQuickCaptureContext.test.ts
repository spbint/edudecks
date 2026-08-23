import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/components/clean/CleanQuickCaptureWorkspace.tsx"),
  "utf8",
);

describe("contextual Quick Capture", () => {
  it("preserves the planned occurrence date and calendar linkage", () => {
    expect(source).toContain('searchParams.get("calendar_item_id")');
    expect(source).toContain('searchParams.get("observed_on")');
    expect(source).toContain("calendarItemId: requestedCalendarItemId || null");
    expect(source).toContain("activityDate: observedOn");
  });

  it("preserves safe program and learning-area context", () => {
    expect(source).toContain('searchParams.get("program_id")');
    expect(source).toContain("programId: requestedProgramId || null");
    expect(source).toContain('searchParams.get("learning_area")');
    expect(source).toContain("useState(requestedLearningArea)");
  });

  it("keeps the existing unified capture pipeline and safe return path", () => {
    expect(source).toContain("saveUnifiedLearningCapture");
    expect(source).toContain("safeQuickCaptureReturnPath");
  });
});
