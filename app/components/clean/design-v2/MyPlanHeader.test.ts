import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const headerSource = readFileSync(join(process.cwd(), "app/components/clean/design-v2/MyPlanHeader.tsx"), "utf8");
const shellSource = readFileSync(join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"), "utf8");

describe("desktop My Plan IA prototype", () => {
  it("provides Today and Calendar links with route-aware active state", () => {
    expect(headerSource).toContain('href="/my-day"');
    expect(headerSource).toContain('href="/my-calendar"');
    expect(headerSource).toContain('aria-current={onToday ? "page" : undefined}');
    expect(headerSource).toContain('aria-current={onCalendar ? "page" : undefined}');
    expect(headerSource).toContain('aria-label="My Plan"');
  });

  it("hides the prototype at the existing mobile breakpoint", () => {
    expect(headerSource).toContain("@media (max-width: 900px)");
    expect(headerSource).toContain("display: none !important");
    expect(headerSource).not.toMatch(/window\.innerWidth|navigator\.userAgent/);
  });

  it("uses one desktop My Plan destination while preserving mobile day/calendar navigation", () => {
    expect(shellSource).toContain('label: "My Plan"');
    expect(shellSource).toContain('href: "/my-day"');
    expect(shellSource).toContain('item.href !== "/my-calendar"');
    expect(shellSource).toContain('{ href: "/my-calendar", icon: "calendar" as const, label: "Plan"');
  });
});
