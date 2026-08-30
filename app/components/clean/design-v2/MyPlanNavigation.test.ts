import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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
  });

  it("renders neither flat desktop duplicates nor the retired page-level planning tabs", () => {
    expect(shell).toContain("<MyPlanNavGroup pathname={pathname} />");
    expect(shell).toContain('section.items.filter((item) => item.href !== "/my-calendar")');
    expect(existsSync(join(process.cwd(), "app/components/clean/design-v2/MyPlanHeader.tsx"))).toBe(false);
    expect(day).not.toContain("MyPlanHeader");
    expect(calendar).not.toContain("MyPlanHeader");
    expect(day).toContain("My Day");
    expect(calendar).toContain("My Calendar");
  });

  it("keeps mobile destinations compact but uses the same customer-facing names", () => {
    expect(shell).toContain('aria-label="My Day"');
    expect(shell).toContain("<span>My Day</span>");
    expect(shell).toContain('label: "My Calendar", section: "PLAN"');
    expect(shell).toContain("mylearna-v2-mobile-bottom-nav");
  });
});
