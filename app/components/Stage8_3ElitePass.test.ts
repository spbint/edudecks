import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const captureSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCaptureWorkspace.tsx"),
  "utf8",
);
const providerSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanFamilyWorkspaceProvider.tsx"),
  "utf8",
);
const daySource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"),
  "utf8",
);
const calendarSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCalendarWorkspace.tsx"),
  "utf8",
);
const planningCacheSource = readFileSync(
  join(process.cwd(), "lib/clean/planning/cache.ts"),
  "utf8",
);
const planningTimingSource = readFileSync(
  join(process.cwd(), "lib/clean/performance/planningTiming.ts"),
  "utf8",
);
const layoutSource = readFileSync(
  join(process.cwd(), "app/(clean)/layout.tsx"),
  "utf8",
);

const primarySources = [
  "CleanDayWorkspace.tsx",
  "CleanCalendarWorkspace.tsx",
  "CleanCaptureWorkspace.tsx",
  "CleanPathwaysWorkspace.tsx",
  "CleanPortfolioWorkspace.tsx",
  "CleanCurriculumWorkspace.tsx",
  "CleanReportsWorkspace.tsx",
  "CleanSettingsWorkspace.tsx",
].map((fileName) =>
  readFileSync(join(process.cwd(), "app/components/clean", fileName), "utf8"),
);

describe("Stage 8.3 systemic mobile remediation", () => {
  it("keeps one clean workspace provider mounted across primary route changes", () => {
    expect(layoutSource).toContain("CleanFamilyWorkspaceProvider");
    expect(layoutSource).toContain(
      "<MyLearnaAppShellV2 initialUserEmail={authenticatedUser.email ?? null}>",
    );
    expect(primarySources.every((source) => !source.includes("<CleanFamilyWorkspaceProvider>"))).toBe(true);
  });

  it("protects warm refreshes and account transitions from stale clean data", () => {
    expect(providerSource).toContain("hasLoadedWorkspaceRef");
    expect(providerSource).toContain("requestGenerationRef");
    expect(providerSource).toContain("reloadInFlightRef");
    expect(providerSource).toContain("userIdRef");
    expect(providerSource).toContain("setWorkspace(INITIAL_STATE)");
  });

  it("releases Day and Calendar primary content before secondary setup hydration", () => {
    expect(providerSource).toContain("setLoading(false);");
    expect(providerSource).toContain("const nextSetupStatus = await loadCleanSetupStatus(nextWorkspace);");
    expect(daySource).toContain("const nextItems = await itemsPromise;");
    expect(daySource).toContain("void (async () => {");
    expect(calendarSource).toContain("calendarItemsRequestGenerationRef");
    expect(calendarSource).toContain("workspace.loading && !workspace.profile");
    expect(calendarSource).toContain("void reloadCalendarItems()");
    expect(daySource).toContain("setDayReloadNonce");
    expect(planningCacheSource).toContain("clearCleanPlanningCache");
    expect(planningCacheSource).toContain("userId");
    expect(planningCacheSource).toContain("familyId");
    expect(daySource).toContain("my-day-primary-loading-shell");
    expect(calendarSource).toContain("calendar-primary-loading-shell");
    expect(planningTimingSource).toContain("performanceApi.mark");
    expect(planningTimingSource).toContain("gatesPage");
    expect(calendarSource).not.toContain(
      "readyForCalendar && !workspace.setupLoading && workspace.profile && workspace.learners.length",
    );
  });

  it("guards contextual Capture at both selection and save boundaries", () => {
    expect(captureSource).toContain("resolveLearnerContext");
    expect(captureSource).toContain("availableLearners: workspace.learners");
    expect(captureSource).toContain("learnerContext:");
    expect(captureSource).toContain("role=\"alertdialog\"");
    expect(captureSource).toContain("Remove pathway connection");
    expect(captureSource).not.toContain("James");
    expect(captureSource).not.toContain("Kids");
  });
});
