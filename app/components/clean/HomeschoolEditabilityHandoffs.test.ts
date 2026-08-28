import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const calendar = read("app/components/clean/CleanCalendarWorkspace.tsx");
const profile = read("app/components/clean/CleanProfileWorkspace.tsx");
const settings = read("app/components/clean/CleanSettingsWorkspace.tsx");
const capture = read("app/components/clean/CleanCaptureWorkspace.tsx");
const portfolio = read("app/components/clean/CleanPortfolioWorkspace.tsx");
const reports = read("app/components/clean/CleanReportsWorkspace.tsx");
const day = read("app/components/clean/CleanDayWorkspace.tsx");
const pathways = read("app/components/clean/CleanPathwaysWorkspace.tsx");
const pathwayActions = read("app/components/clean/CleanPathwayStepActionRow.tsx");

describe("Homeschool editability and journey handoffs", () => {
  it("keeps saved learning years editable without creating a duplicate", () => {
    expect(calendar).toContain("updateCleanAcademicYear");
    expect(calendar).toContain("deleteCleanAcademicYear");
    expect(calendar).toContain("openAcademicYearEditor");
    expect(calendar).toContain("editingAcademicYearId");
    expect(calendar).toContain('"Save changes"');
    expect(calendar).toContain("closeAcademicYearEditor");
    expect(calendar).toContain('setPendingDelete({ type: "academic-year", year })');
    expect(calendar).toMatch(/Changing\s+its dates may place those records outside the year/);
    expect(calendar).not.toContain("createCleanAcademicYear(workspace.profile.id, input)");
  });

  it("keeps existing period, break, block and evidence edit paths", () => {
    expect(calendar).toContain("openLearningPeriodEditor");
    expect(calendar).toContain("handleLearningPeriodUpdate");
    expect(calendar).toContain("openEditPopover");
    expect(calendar).toContain("openEditRhythmPopover");
    expect(calendar).toContain("Save changes");
    expect(profile).toContain("updateCleanLearner");
    expect(settings).toContain("updateCleanFamilyProfile");
    expect(capture).toContain("saveUnifiedLearningCapture");
    expect(capture).toContain("{ entryId: editingEntryId || null }");
    expect(capture).toContain("includeInPortfolio");
    expect(capture).toContain("includeInReport");
  });

  it("keeps the core handoff sequence explicit", () => {
    expect(profile).toContain("Plan our usual week");
    expect(profile).toContain("Start with today");
    expect(settings).toContain("Set up My Calendar");
    expect(calendar).toContain("Add your first learning period");
    expect(calendar).toContain("Add your first weekly learning block");
    expect(calendar).toContain("Your first learning plan is ready");
    expect(calendar).toContain("Continue to My Day");
    expect(calendar).toContain("Add another block");
    expect(day).toContain("PUBLIC_PATHWAYS_ENABLED");
    expect(day).toContain("Quick Capture");
    expect(pathways).toContain("Add completed work");
    expect(pathwayActions).toContain("Add completed work");
    expect(capture).toContain("View portfolio");
    expect(portfolio).toContain("Create Report");
    expect(reports).toContain("Open output history");
    expect(profile).toContain("showActivationFork");
    expect(calendar).toContain("canAddBreakOrHoliday");
    expect(calendar).toContain("disabled={!selectedAcademicYear || !hasRealLearningPeriod}");
    expect(calendar).not.toContain("Skip for now");
  });

  it("does not replace canonical or permission-controlled fields with client-only editing", () => {
    expect(calendar).toContain("workspace.profile.id");
    expect(capture).toContain("workspace.profile.id");
    expect(profile).toContain("workspace.profile.id");
    expect(calendar).not.toContain("service_role");
    expect(capture).not.toContain("service_role");
  });
});
