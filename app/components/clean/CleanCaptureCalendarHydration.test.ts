import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCaptureWorkspace.tsx"),
  "utf8",
);

describe("calendar-linked Capture hydration", () => {
  it("uses the resolved calendar item for title, learning area, selection, learner and date", () => {
    expect(source).toContain("const linkedCalendarItem = calendarItemIdFromQuery");
    expect(source).toContain("if (calendarItemIdFromQuery && !linkedCalendarItem) return;");
    expect(source).toContain("linkedCalendarItem?.title");
    expect(source).toContain("linkedCalendarItem?.learningArea");
    expect(source).toContain("setCalendarItemId(calendarItemIdFromQuery || \"\")");
    expect(source).toContain("linkedCalendarItem?.learnerId");
    expect(source).toContain("observedOnFromQuery || linkedCalendarItem?.plannedDate");
  });

  it("preserves standalone Capture and explicit higher-priority context", () => {
    expect(source).toContain("setCalendarItemId(calendarItemIdFromQuery || \"\")");
    expect(source).toContain("worksheetTitleSuggestion ||");
    expect(source).toContain("pathwayTitleSuggestion ||");
    expect(source).toContain("curriculumTitleSuggestion ||");
    expect(source).toContain("learningAreaLabelFromQuery ||");
    expect(source).toContain("learningAreaFromQuery ||");
    expect(source).toContain("setLastSavedMyDayReturnPath(");
    expect(source).toContain("calendarItemIdFromQuery");
  });

  it("does not clobber fields edited while linked data is loading or refreshed", () => {
    expect(source).toContain("const captureContextEditsRef = useRef<CaptureContextEditState>");
    expect(source).toContain("if (!contextEdits.title) setTitle(nextTitle);");
    expect(source).toContain("if (!contextEdits.learningArea) setLearningArea(nextLearningArea);");
    expect(source).toContain("if (!contextEdits.calendarItemId)");
    expect(source).toContain('markCaptureContextEdited("title")');
    expect(source).toContain('markCaptureContextEdited("learningArea")');
    expect(source).toContain('markCaptureContextEdited("calendarItemId")');
    expect(source).toContain("!calendarItemIdFromQuery");
  });
});
