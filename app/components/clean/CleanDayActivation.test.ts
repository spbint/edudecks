import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");

describe("desktop My Day activation safeguards", () => {
  it("uses responsive CSS presentation rather than viewport-based render logic", () => {
    expect(source).toContain("mylearna-day-desktop-activation");
    expect(source).toContain("@media (min-width: 768px)");
    expect(source).toContain("@media (max-width: 767px)");
    expect(source).not.toMatch(/window\.innerWidth|navigator\.userAgent/);
  });

  it("preserves existing My Day, Calendar and Quick Capture routes", () => {
    expect(source).toContain('const calendarPathBase =');
    expect(source).toContain('const capturePathBase =');
    expect(source).toContain('href={calendarPathBase}');
    expect(source).toContain('mode=quick');
  });

  it("keeps the returning-empty Quick Add form visible on desktop", () => {
    expect(source).toContain("mylearna-day-quick-add-open");
    expect(source).toContain("mylearna-day-quick-add-form");
    expect(source).toContain("onClick={openQuickAdd}");
    expect(source).toContain("Create quick block");
    expect(source).toContain("onClick={closeQuickAdd}");
  });

  it("keeps the approved mobile flow from using the desktop-only empty state", () => {
    expect(source).toContain("mylearna-day-mature-content");
    expect(source).toContain("display: contents");
    expect(source).toContain("Capture something you already did");
    expect(source).toContain("Open My Calendar");
  });
});
