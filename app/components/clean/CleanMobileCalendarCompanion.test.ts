import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCalendarWorkspace.tsx"),
  "utf8",
);
const mobileCalendarSource = source.slice(
  source.indexOf("function MobileCalendarContent"),
  source.indexOf("function CleanCalendarWorkspaceBody"),
);
const reloadStart = source.indexOf("const reloadCalendarItems");
const reloadEnd = source.indexOf("useEffect(() =>", reloadStart);
const reloadSource = source.slice(reloadStart, reloadEnd);

describe("Mobile Calendar companion experience", () => {
  it("uses the companion branch and puts glance-first views before planning administration", () => {
    expect(source).toContain("const mobileCompanion = useMobileCompanion();");
    expect(source).toContain("const mobileCalendarCompanion = mobileCompanion && !planningOnly;");
    expect(source).toContain("if (mobileCalendarCompanion) {");
    expect(mobileCalendarSource).toContain('aria-labelledby="mobile-calendar-title"');
    expect(mobileCalendarSource).toContain("Today");
    expect(mobileCalendarSource).toContain("Tomorrow");
    expect(mobileCalendarSource).toContain("Week");
  });

  it("uses compact date lists rather than desktop planning views or guidance", () => {
    expect(mobileCalendarSource).toContain("formatLongDateLabel(dateValue)");
    expect(mobileCalendarSource).toContain("formatCalendarTimeRange(item.startsAt, item.endsAt)");
    expect(mobileCalendarSource).toContain("overflowWrap: \"anywhere\"");
    expect(mobileCalendarSource).toContain("View actions");
    expect(mobileCalendarSource).not.toContain("Master Week");
    expect(mobileCalendarSource).not.toContain("Learning period");
    expect(mobileCalendarSource).not.toContain("Print / Download");
    expect(mobileCalendarSource).not.toContain("CoreJourneyCue");
  });

  it("keeps mobile Calendar reads bounded, learner-scoped and separate from desktop setup reads", () => {
    expect(source).toContain("const mobileCalendarStart");
    expect(source).toContain("const mobileCalendarEnd");
    expect(reloadSource).toContain("learnerId: selectedMobileLearnerId || null");
    expect(reloadSource).toContain('mobileCalendarView === "week" ? 100 : 50');
    expect(source).toContain("if (mobileCalendarCompanion) {");
    expect(source).toContain("void reloadSetupData();");
    expect(source).toContain("if (mobileCalendarCompanion) return;");
    expect(source).toContain("setEvidenceByCalendarItemId(new Map())");
  });

  it("keeps opening, view changes and retry read-only without Master Week materialisation", () => {
    expect(source).toContain("onRetry={() => void reloadCalendarItems()}");
    expect(mobileCalendarSource).not.toContain("materializeMasterWeekRange");
    expect(mobileCalendarSource).not.toContain("createCleanCalendarItem");
    expect(mobileCalendarSource).not.toContain("updateCleanCalendarItem");
    expect(mobileCalendarSource).not.toContain("deleteCleanCalendarItem");
    expect(reloadSource).not.toContain("materializeMasterWeekRange");
    expect(reloadSource).not.toMatch(/(?:create|update|delete)CleanCalendarItem/);
  });

  it("preserves existing Quick Capture context without creating evidence on navigation", () => {
    expect(source).toContain("buildItemCaptureHref={buildCalendarCaptureHref}");
    expect(source).toContain("calendar_item_id: item.id");
    expect(source).toContain("observed_on: item.plannedDate");
    expect(source).toContain("activity_title: item.title");
    expect(source).toContain("learning_area");
    expect(source).toContain("returnTo");
    expect(mobileCalendarSource).toContain("Capture learning");
    expect(mobileCalendarSource).not.toContain("createCleanEvidenceEntry");
  });

  it("handles Calendar errors locally and keeps empty states calm", () => {
    expect(mobileCalendarSource).toContain("We couldn&apos;t load your calendar.");
    expect(mobileCalendarSource).toContain("Try again");
    expect(mobileCalendarSource).toContain("Nothing planned this week.");
    expect(mobileCalendarSource).toContain("Nothing planned for");
    expect(mobileCalendarSource).toContain("Back to Today");
  });

  it("leaves the full desktop Calendar workspace after the mobile companion branch", () => {
    const desktopSource = source.slice(source.indexOf("if (mobileCalendarCompanion)"));
    expect(desktopSource).toContain("Master Week");
    expect(desktopSource).toContain("Learning period");
    expect(desktopSource).toContain("Print / Download");
    expect(desktopSource).toContain("Current Calendar");
  });
});
