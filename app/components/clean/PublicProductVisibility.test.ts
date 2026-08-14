import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { finalProductNavSections } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import {
  PUBLIC_ASSESSMENTS_ENABLED,
  PUBLIC_PATHWAYS_ENABLED,
} from "@/lib/clean/publicVisibility";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("public product visibility", () => {
  it("keeps Pathways and Assessments private while retaining the Core navigation", () => {
    expect(PUBLIC_PATHWAYS_ENABLED).toBe(false);
    expect(PUBLIC_ASSESSMENTS_ENABLED).toBe(false);
    expect(finalProductNavSections.flatMap((section) => section.items.map((item) => item.label))).toEqual([
      "My Calendar",
      "Quick Capture",
      "My Portfolio",
      "My Learna",
      "My Reports",
    ]);
  });

  it("retains private route implementations and hides normal Pathways handoffs", () => {
    const shell = read("app/components/clean/design-v2/MyLearnaAppShellV2.tsx");
    const day = read("app/components/clean/CleanDayWorkspace.tsx");
    const setup = read("lib/clean/setup/setupStatus.ts");

    expect(shell).toContain('href: "/my-pathways"');
    expect(shell).toContain('pathname === "/my-pathways"');
    expect(day).toContain("PUBLIC_PATHWAYS_ENABLED");
    expect(setup).toContain("PUBLIC_PATHWAYS_ENABLED");
    expect(setup).toContain('type: "capture-evidence"');
  });

  it("uses Quick Capture as the public label without changing its route", () => {
    const capture = read("app/components/clean/CleanCaptureWorkspace.tsx");
    const shell = read("app/components/clean/design-v2/MyLearnaAppShellV2.tsx");

    expect(capture).toContain(">Quick Capture</h1>");
    expect(shell).toContain('href: "/my-capture", label: "Quick Capture"');
    expect(shell).toContain('"/my-capture?mode=quick"');
  });
});
