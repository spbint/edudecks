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
});
