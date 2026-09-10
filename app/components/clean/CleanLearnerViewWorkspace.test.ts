import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./CleanLearnerViewWorkspace.tsx", import.meta.url), "utf8");
const daySource = readFileSync(new URL("./CleanDayWorkspace.tsx", import.meta.url), "utf8");

describe("Learner View", () => {
  it("uses the selected learner, existing completion, and existing queue reorder paths", () => {
    expect(source).toContain("searchParams.get(\"learner_id\")");
    expect(source).toContain("listCleanCalendarItems");
    expect(source).toContain("updateCleanCalendarItem");
    expect(source).toContain("moveLearningQueueItem");
    expect(source).toContain("Do this next");
    expect(source).toContain("Back to parent view");
  });

  it("does not expose parent navigation or learner-authentication systems", () => {
    expect(source).not.toContain("CleanAppShell");
    expect(source).not.toContain("AuthProvider");
    expect(source).not.toContain("Reports");
    expect(source).not.toContain("Portfolio");
    expect(source).not.toContain("settings");
  });

  it("offers the entry point only when My Day has a selected learner", () => {
    expect(daySource).toContain("selectedLearnerId ? `/learner-view?learner_id=");
    expect(daySource).toContain("Open learner view");
  });
});
