import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  finalProductNavSections,
  getVisibleDesktopSectionItems,
  routeCrumbs,
} from "@/app/components/clean/design-v2/MyLearnaAppShellV2";

const shell = readFileSync(
  join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"),
  "utf8",
);
const day = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");
const calendar = readFileSync(join(process.cwd(), "app/components/clean/CleanCalendarWorkspace.tsx"), "utf8");

describe("My Plan navigation hierarchy", () => {
  it("uses a non-navigating My Plan control with accessible child destinations", () => {
    expect(shell).toContain("function MyPlanNavGroup");
    expect(shell).toContain("<span>My Plan</span>");
    expect(shell).toContain('aria-controls="mylearna-my-plan-navigation"');
    expect(shell).toContain("aria-expanded={expanded}");
    expect(shell).not.toContain('href="/my-plan"');
    expect(shell).toContain('href: "/my-day"');
    expect(shell).toContain('href: "/my-calendar"');
    expect(shell).not.toContain('href: "/my-programs"');
  });

  it("automatically expands for My Day and My Calendar while keeping active children accessible", () => {
    expect(shell).toContain("const planActive = myPlanNavItems.some");
    expect(shell).toContain("if (planActive) setExpanded(true)");
    expect(shell).toContain('aria-current={active ? "page" : undefined}');
    expect(shell).toContain('"/clean-my-day"');
    expect(shell).toContain('"/clean-my-calendar"');
    expect(shell).toContain('"/home"');
    expect(shell).toContain('"/my-plan"');
    expect(shell).toContain('"/calendar"');
    expect(shell).toContain('"/my-month"');
    expect(shell).toContain('"/planner"');
    expect(shell).not.toContain('"/my-programs"');
  });

  it("renders neither flat desktop duplicates nor the retired page-level planning tabs", () => {
    expect(shell).toContain("<MyPlanNavGroup pathname={pathname} />");
    expect(shell).toContain("getVisibleDesktopSectionItems(section.items)");
    expect(existsSync(join(process.cwd(), "app/components/clean/design-v2/MyPlanHeader.tsx"))).toBe(false);
    expect(day).not.toContain("MyPlanHeader");
    expect(calendar).not.toContain("MyPlanHeader");
    expect(day).toContain("My Day");
    expect(calendar).toContain("My Calendar");
  });

  it("uses My Plan as the non-navigating breadcrumb parent for planning routes", () => {
    expect(routeCrumbs("/my-day")).toEqual([{ label: "My Plan" }, { label: "My Day" }]);
    expect(routeCrumbs("/my-calendar")).toEqual([{ label: "My Plan" }, { label: "My Calendar" }]);
    expect(routeCrumbs("/home")).toEqual([{ label: "My Plan" }, { label: "My Day" }]);
    expect(routeCrumbs("/planner")).toEqual([{ label: "My Plan" }, { label: "My Calendar" }]);
    expect(routeCrumbs("/my-programs")).toEqual([{ label: "My Day", href: "/my-day" }, { label: "MyLearna" }]);
  });

  it("does not render a desktop section heading without visible children", () => {
    const planSection = finalProductNavSections.find((section) => section.label === "PLAN");
    const captureSection = finalProductNavSections.find((section) => section.label === "CAPTURE");

    expect(getVisibleDesktopSectionItems(planSection?.items ?? [])).toEqual([]);
    expect(getVisibleDesktopSectionItems(captureSection?.items ?? []).map((item) => item.label)).toEqual([
      "Quick Capture",
      "My Portfolio",
    ]);
  });

  it("keeps mobile destinations compact but uses the same customer-facing names", () => {
    expect(shell).toContain('aria-label="My Day"');
    expect(shell).toContain("<span>My Day</span>");
    expect(shell).toContain('label: "My Calendar", section: "PLAN"');
    expect(shell).toContain("mylearna-v2-mobile-bottom-nav");
    expect(shell).not.toContain("programsNavItem");
  });
});
