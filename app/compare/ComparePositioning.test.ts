import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(join(process.cwd(), "app/compare/page.tsx"), "utf8");
const layout = readFileSync(join(process.cwd(), "app/compare/layout.tsx"), "utf8");

describe("public comparison positioning", () => {
  it("explains MyLearna against the main tool categories without naming competitors", () => {
    expect(page).toContain("Use any curriculum or planner. Keep the learning record in MyLearna.");
    expect(page).toContain("AI planner or lesson generator");
    expect(page).toContain("Conventional homeschool planner");
    expect(page).toContain("Spreadsheet or notes system");
    expect(page).toContain("MyLearna");
    expect(page).not.toMatch(/Homeschool Ledger|Homeschool Scheduler|Nohkoo/i);
  });

  it("positions MyLearna as the connected record rather than another lesson generator", () => {
    expect(page).toContain("MyLearna is the record layer");
    expect(page).toContain("what actually happened");
    expect(page).toContain("Plan → Capture → Portfolio → Understand → Report");
    expect(page).toContain("It does not need to replace your curriculum, books, co-op, AI planner or other resources.");
    expect(page).toContain("You do not need to replace the tools that already help your family.");
  });

  it("uses category-level language instead of risky yes-no competitor claims", () => {
    expect(page).toContain("Typical emphasis");
    expect(page).toContain("Varies by tool");
    expect(page).not.toContain("ComparisonStatus");
    expect(page).not.toContain("Authority-ready direction");
    expect(page).not.toContain("WHY SWITCH");
  });

  it("keeps the conversion path on the demo and free family space", () => {
    expect(page).toContain('/demo?source=compare-primary-demo');
    expect(page).toContain('/start-free?source=compare-secondary-family-space');
    expect(page).toContain('/demo?source=compare-bottom-demo');
    expect(page).toContain('/start-free?source=compare-bottom-family-space');
    expect(page).toContain("See how learning becomes a report");
    expect(page).toContain("Create your free family space");
    expect(page).not.toContain("View Pricing");
  });

  it("updates public metadata for the category comparison", () => {
    expect(layout).toContain("MyLearna vs AI Planners, Homeschool Planners & Spreadsheets");
    expect(layout).toContain("AI planners, homeschool planners, spreadsheets and notes");
    expect(layout).toContain("evidence, portfolios and reports");
  });
});
