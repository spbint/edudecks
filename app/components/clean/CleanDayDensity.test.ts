import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"),
  "utf8",
);

describe("My Day desktop density safeguards", () => {
  it("uses a task-first desktop header and removes the legacy overview from the desktop working view", () => {
    expect(source).toContain("@media (min-width: 901px)");
    expect(source).toContain("mylearna-day-desktop-task-header");
    expect(source).toContain("my-day-desktop-task-first");
    expect(source).toContain(".mylearna-day-overview-card");
    expect(source).toContain(".mylearna-day-legacy-toolbar");
    expect(source).toContain("display: none !important");
  });

  it("keeps first-value and setup states represented by the shared state surface", () => {
    expect(source).toContain("mylearna-day-shell-ready_for_first_value");
    expect(source).toContain("mylearna-day-shell-setup_incomplete");
    expect(source).toContain("mylearna-day-first-value");
  });

  it("keeps the companion branch separate from desktop density rules", () => {
    expect(source).toContain("@media (max-width: 767px)");
    expect(source).toContain(".mylearna-day-mature-content");
    expect(source).toContain("@media (min-width: 901px)");
  });
});
