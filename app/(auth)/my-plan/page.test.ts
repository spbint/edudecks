import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("My Plan compatibility route", () => {
  it("defaults to Today", () => {
    const source = readFileSync(join(process.cwd(), "app/(auth)/my-plan/page.tsx"), "utf8");
    expect(source).toContain('redirect("/my-day")');
  });
});
