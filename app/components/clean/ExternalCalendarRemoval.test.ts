import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { finalProductNavSections } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import {
  PUBLIC_ASSESSMENTS_ENABLED,
  PUBLIC_PATHWAYS_ENABLED,
} from "@/lib/clean/publicVisibility";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

function productionSources(path: string): string[] {
  const directory = join(root, path);
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return productionSources(entryPath.slice(root.length + 1));
    return /\.(?:ts|tsx)$/.test(entryPath) && !/\.(?:test|spec)\.(?:ts|tsx)$/.test(entryPath)
      ? [entryPath]
      : [];
  });
}

const settingsSource = read("app/components/clean/CleanSettingsWorkspace.tsx");
const applicationSource = productionSources("app")
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
const removedProviderCopy = [
  "Apple Calendar",
  "Google Calendar",
  "Microsoft Calendar",
  "Microsoft 365 Calendar",
  "Outlook Calendar",
  "Calendar connections",
  "Add to Apple Calendar",
  "Copy calendar link",
  "AppleCalendarConnectionCard",
  "mylearna-calendar-connections-card",
  "webcal://",
];

describe("external calendar removal", () => {
  it("keeps Settings focused on MyLearna's internal calendar", () => {
    for (const removedText of removedProviderCopy) {
      expect(settingsSource).not.toContain(removedText);
    }

    expect(settingsSource).toContain("Next step: My Calendar");
    expect(settingsSource).toContain('href="/my-calendar"');
    expect(settingsSource).toContain("Open My Calendar");
  });

  it("does not expose or link the removed provider routes", () => {
    expect(existsSync(join(root, "app/api/calendar-connections/apple/route.ts"))).toBe(false);
    expect(existsSync(join(root, "app/api/calendar-feeds/[feed]/route.ts"))).toBe(false);
    expect(applicationSource).not.toContain("/api/calendar-connections/apple");
    expect(applicationSource).not.toContain("/api/calendar-feeds/");
    expect(applicationSource).not.toContain("apple_calendar_");
    for (const removedText of removedProviderCopy) {
      expect(applicationSource).not.toContain(removedText);
    }
  });

  it("preserves the Core journey and current product visibility", () => {
    expect(finalProductNavSections.map((section) => section.items.map((item) => item.label))).toEqual([
      ["My Calendar"],
      ["Quick Capture", "My Portfolio"],
      ["My Learna", "My Reports"],
    ]);
    expect(read("app/components/clean/design-v2/MyLearnaAppShellV2.tsx")).toContain(
      'href: "/my-day"',
    );
    expect(PUBLIC_PATHWAYS_ENABLED).toBe(false);
    expect(PUBLIC_ASSESSMENTS_ENABLED).toBe(false);
  });

  it("keeps internal planning and capture entry points in place", () => {
    expect(read("app/(auth)/my-calendar/page.tsx")).toContain("CleanCalendarWorkspace");
    expect(read("app/(auth)/my-day/page.tsx")).toContain("CleanDayWorkspace");
    expect(read("app/components/clean/CleanCalendarPopover.tsx")).toContain("Add learning block");
    expect(read("app/(auth)/my-capture/page.tsx")).toContain("CleanCaptureWorkspace");
    expect(read("app/(auth)/my-portfolio/page.tsx")).toContain("CleanPortfolioWorkspace");
    expect(read("app/(auth)/my-reports/page.tsx")).toContain("CleanReportsWorkspace");
    expect(read("app/(auth)/my-learna/page.tsx")).toContain("CleanLearnaWorkspace");
  });
});
