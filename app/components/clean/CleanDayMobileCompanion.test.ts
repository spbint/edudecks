import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");
const mobileTodaySource = source.slice(
  source.indexOf("function MobileTodayContent"),
  source.indexOf("function CleanDayWorkspaceBody"),
);

describe("Mobile Today companion experience", () => {
  it("renders real Today content before secondary actions at the companion breakpoint", () => {
    expect(source).toContain("const mobileCompanion = useMobileCompanion();");
    expect(source).toContain("if (mobileCompanion) {");
    expect(mobileTodaySource).toContain('aria-labelledby="mobile-today-title"');
    expect(mobileTodaySource).toContain("Today&apos;s learning");
    expect(mobileTodaySource).toContain("dateLabel");
  });

  it("keeps planned cards compact, readable and limited to capture plus completion", () => {
    expect(mobileTodaySource).toContain("overflowWrap: \"anywhere\"");
    expect(mobileTodaySource).toContain("formatTimeLabel(item.startsAt)");
    expect(mobileTodaySource).toContain("item.learningArea");
    expect(mobileTodaySource).toContain("Capture learning");
    expect(mobileTodaySource).toContain('completed ? "Undo" : "Done"');
    expect(mobileTodaySource).not.toContain("Show details");
    expect(mobileTodaySource).not.toContain("Print today's plan");
  });

  it("uses existing Quick Capture context for planned and spontaneous learning without writes", () => {
    expect(source).toContain("const buildMobileItemCaptureHref");
    expect(source).toContain('mode: "quick"');
    expect(source).toContain("calendar_item_id: item.id");
    expect(source).toContain("observed_on: item.plannedDate");
    expect(source).toContain('activity_title", item.title');
    expect(source).toContain("returnTo: mobileDayReturnHref");
    expect(source).toContain("const mobileQuickCaptureHref");
    expect(mobileTodaySource).toContain("buildItemCaptureHref(item)");
    expect(mobileTodaySource).toContain("+ Capture learning");
    expect(mobileTodaySource).not.toContain("saveUnifiedLearningCapture");
  });

  it("keeps empty and first-value states calm, capture-first and calendar-secondary", () => {
    expect(mobileTodaySource).toContain('myDayPresentationState === "READY_FOR_FIRST_VALUE"');
    expect(mobileTodaySource).toContain("Nothing planned yet.");
    expect(mobileTodaySource).toContain("Nothing planned for today.");
    expect(mobileTodaySource).toContain("View calendar");
    expect(mobileTodaySource).not.toContain("My Settings");
    expect(mobileTodaySource).toContain('myDayPresentationState === "SETUP_INCOMPLETE"');
    expect(mobileTodaySource).toContain("Finish the essential family setup.");
  });

  it("keeps a My Day read timeout local, recoverable and free of calendar materialisation", () => {
    expect(mobileTodaySource).toContain("onRetry");
    expect(mobileTodaySource).toContain("Try again");
    expect(source).toContain('Sentry.captureException(error, {');
    expect(source).toContain('operation: "my-day-visible-activities"');
    expect(source).toContain('setItemsError("We couldn\'t load today\'s learning. Try again.")');
    expect(source).not.toContain("ensureCleanOperationalWeekFromUsualWeek");
  });

  it("does not reintroduce mobile guidance, analytics, Pathways or report administration", () => {
    expect(mobileTodaySource).not.toContain("CoreJourneyCue");
    expect(mobileTodaySource).not.toContain("CleanPageIntroVideo");
    expect(mobileTodaySource).not.toContain("CleanGuidanceRibbon");
    expect(mobileTodaySource).not.toContain("My Pathways");
    expect(mobileTodaySource).not.toContain("My Reports");
    expect(mobileTodaySource).not.toContain("Output");
  });

  it("leaves the full desktop My Day workspace after the mobile companion branch", () => {
    const desktopSource = source.slice(source.indexOf("if (mobileCompanion)"));
    expect(desktopSource).toContain("handleDailyPlannerDownload");
    expect(desktopSource).toContain("CleanGuidanceRibbon");
    expect(desktopSource).toContain("Open My Pathways");
    expect(desktopSource).toContain("Print today's plan");
  });
});
