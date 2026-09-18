import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");

describe("Recover My Week surface", () => {
  it("keeps recovery contextual and queue-only", () => {
    expect(source).toContain("Recover my week");
    expect(source).toContain("Plans change. Choose what still matters.");
    expect(source).toContain("Keep in focus");
    expect(source).toContain("addPathwayStepToLearningQueue");
    expect(source).toContain("recoverCalendarItemToLearningQueue");
    expect(source).toContain("calendar-custom");
    expect(source).toContain("In focus");
    expect(source).toContain("Keep in focus for");
    expect(source).toContain("Choose who");
    expect(source).toContain("Whole family (all learners)");
    expect(source).toContain("WHOLE_FAMILY_RECOVERY_TARGET");
    expect(source).toContain("recoverWholeFamilyCalendarItemToLearningQueue");
    expect(source).toContain('disabled={updating || alreadyOnDeck || !recoveryTarget}');
    expect(source).toContain("learnerOptions.every");
    expect(source).toContain("recoveryOnDeckItems");
    expect(source).not.toContain("updateCleanCalendarItem(workspace.profile.id, recovery");
    expect(source).not.toContain("createCleanCalendarItem(workspace.profile.id, recovery");
  });

  it("keeps mobile navigation unchanged and avoids scheduling helpers", () => {
    expect(source).toContain("<MobileTodayContent");
    expect(source).not.toContain("materialize");
    expect(source).not.toContain("applyMasterWeek");
    expect(source).not.toContain("ensureProgram");
  });
});
