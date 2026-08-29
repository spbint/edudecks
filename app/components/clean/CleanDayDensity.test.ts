import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"),
  "utf8",
);

describe("My Day desktop density safeguards", () => {
  it("suppresses the mature tutorial stack only for populated desktop days", () => {
    expect(source).toContain("@media (min-width: 901px)");
    expect(source).toContain(".mylearna-day-shell-populated_day .mylearna-day-mature-top");
    expect(source).toContain("display: none !important");
  });

  it("keeps first-value and setup states represented by the shared state surface", () => {
    expect(source).toContain("mylearna-day-shell-ready_for_first_value");
    expect(source).toContain("mylearna-day-shell-setup_incomplete");
    expect(source).toContain("mylearna-day-first-value");
  });

  it("does not apply the populated desktop rule at the mobile breakpoint", () => {
    expect(source).toContain("@media (max-width: 767px)");
    expect(source).toContain(".mylearna-day-mature-content");
    expect(source).toContain("@media (min-width: 901px)");
  });
});
