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

  it("places On Deck after the primary Today learning area and before the broader Pathways prompt", () => {
    const desktopSource = source.slice(source.indexOf("if (mobileCompanion)"));
    const todayCardIndex = desktopSource.indexOf('data-guidance-id="my-day-today-plan"');
    const onDeckIndex = desktopSource.indexOf("<OnDeckSection");
    const pathwaysPromptIndex = desktopSource.indexOf('data-guidance-id="my-day-next-pathways"');

    expect(todayCardIndex).toBeGreaterThan(-1);
    expect(onDeckIndex).toBeGreaterThan(todayCardIndex);
    expect(pathwaysPromptIndex).toBeGreaterThan(onDeckIndex);
    expect(source).toContain("Keep the next few pieces of learning in focus.");
    expect(source).toContain("No dates required.");
    expect(source).toContain("Choose from Pathways");
  });

  it("keeps On Deck persistence independent from Calendar, evidence, and Pathway progress", () => {
    expect(source).toContain("listLearningQueueItems");
    expect(source).toContain("resolveOnDeckItem");
    expect(source).not.toContain('source_type: "on_deck"');
    expect(source).not.toContain("savePathwayPlacement(");
    expect(source).not.toContain("createCleanEvidenceEntry");
  });

  it("keeps retry and mobile read-only capture context contracts intact", () => {
    expect(source).toContain("setDayReloadNonce((current) => current + 1)");
    expect(source).toContain("calendar_item_id: item.id");
    expect(source).not.toContain("ensureCleanOperationalWeekFromUsualWeek");
  });
});
