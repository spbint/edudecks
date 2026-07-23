import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const authLayoutSource = readFileSync(
  join(process.cwd(), "app/(auth)/layout.tsx"),
  "utf8",
);
const cleanLayoutSource = readFileSync(
  join(process.cwd(), "app/(clean)/layout.tsx"),
  "utf8",
);

const canonicalRoutes = [
  ["my-day", "CleanDayWorkspace"],
  ["my-calendar", "CleanCalendarWorkspace"],
  ["my-capture", "CleanCaptureWorkspace"],
  ["my-pathways", "CleanPathwaysWorkspace"],
  ["my-portfolio", "CleanPortfolioWorkspace"],
  ["my-data", "CleanCurriculumWorkspace"],
  ["my-reports", "CleanReportsWorkspace"],
] as const;

describe("canonical authenticated clean workspace bootstrap", () => {
  it("mounts one clean provider inside the persistent authenticated provider", () => {
    expect(authLayoutSource).toContain(
      'import CleanFamilyWorkspaceProvider from "@/app/components/clean/CleanFamilyWorkspaceProvider";',
    );
    expect(authLayoutSource).toMatch(
      /<FamilyWorkspaceProvider>[\s\S]*<CleanFamilyWorkspaceProvider>[\s\S]*<MyLearnaAppShellV2>/,
    );
    expect(authLayoutSource).toContain(
      "</CleanFamilyWorkspaceProvider>",
    );
  });

  it.each(canonicalRoutes)(
    "keeps %s on the clean workspace consumer path",
    (route, workspaceComponent) => {
      const source = readFileSync(
        join(process.cwd(), `app/(auth)/${route}/page.tsx`),
        "utf8",
      );
      expect(source).toContain(workspaceComponent);
      expect(source).not.toContain("CleanFamilyWorkspaceProvider");
    },
  );

  it("does not use the clean provider's silent loading default", () => {
    const providerSource = readFileSync(
      join(process.cwd(), "app/components/clean/CleanFamilyWorkspaceProvider.tsx"),
      "utf8",
    );
    expect(providerSource).toContain(
      "useCleanFamilyWorkspace must be used within CleanFamilyWorkspaceProvider.",
    );
    expect(providerSource).toContain(
      "createContext<\n  CleanFamilyWorkspaceContextValue | undefined",
    );
  });

  it("keeps the clean settings route on the same provider hierarchy", () => {
    const settingsSource = readFileSync(
      join(process.cwd(), "app/(clean)/my-settings/page.tsx"),
      "utf8",
    );
    expect(settingsSource).toContain("CleanSettingsWorkspace");
    expect(cleanLayoutSource).toMatch(
      /<FamilyWorkspaceProvider>[\s\S]*<CleanFamilyWorkspaceProvider>[\s\S]*<MyLearnaAppShellV2>/,
    );
  });
});
