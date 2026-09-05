import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");

describe("Desktop My Day task-first presentation", () => {
  it("places learner context and one spontaneous capture action before the activity list", () => {
    const desktopSource = source.slice(source.indexOf("if (mobileCompanion)"));
    const headerIndex = desktopSource.indexOf('data-testid="my-day-desktop-task-first"');
    const itemsIndex = desktopSource.indexOf("sortedVisibleItems.map((item)");

    expect(headerIndex).toBeGreaterThan(-1);
    expect(itemsIndex).toBeGreaterThan(headerIndex);
    expect(source).toContain('aria-label="Learner or family view"');
    expect(desktopSource.slice(headerIndex, itemsIndex)).toContain("Capture learning");
  });

  it("keeps planning utilities available but secondary to today’s learning", () => {
    expect(source).toContain("Plan and organise");
    expect(source).toContain("Add a quick block");
    expect(source).toContain("Print today's plan");
    expect(source).toContain("Open My Calendar");
  });

  it("does not mount optional My Day journey, guide or ribbon surfaces", () => {
    expect(source).not.toContain("CoreJourneyCue");
    expect(source).not.toContain("CleanPageIntroVideo");
    expect(source).not.toContain("CleanGuidanceRibbon");
    expect(source).not.toContain("GuidanceGettingStartedCard");
    expect(source).toContain('<CleanFirstRunSetupGate currentStep="day" />');
  });

  it("keeps retry and mobile read-only capture context contracts intact", () => {
    expect(source).toContain("setDayReloadNonce((current) => current + 1)");
    expect(source).toContain("calendar_item_id: item.id");
    expect(source).not.toContain("ensureCleanOperationalWeekFromUsualWeek");
  });
});
