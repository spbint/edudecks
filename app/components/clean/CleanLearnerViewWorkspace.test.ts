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

  it("makes Learner View discoverable without a preselected learner", () => {
    expect(daySource).toContain("function LearnerViewEntry");
    expect(daySource).toContain("learnerOptions.length === 1");
    expect(daySource).toContain("Who is learning?");
    expect(daySource).toContain("Open ${learner.label}'s learner view");
    expect(daySource).not.toContain("href={`/my-day?learner_id=");
    expect(daySource).toContain("/learner-view?learner_id=");
    expect(daySource).toContain("<LearnerViewEntry compact");
    expect(daySource).toContain("<LearnerViewEntry learnerOptions={learnerOptions}");
  });

  it("keeps learner choice as navigation without adding persistence or parent navigation", () => {
    expect(daySource).not.toContain("createLearner");
    expect(daySource).not.toContain("setLearner");
    expect(daySource).not.toContain("learnerViewHref");
    expect(daySource).not.toContain("bottom-navigation");
    expect(daySource).toContain('aria-label="Learner or family view"');
  });
});
