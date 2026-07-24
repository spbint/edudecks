import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildMyDataRedirectPath } from "@/app/(auth)/my-data/page";

const myLearnaRouteSource = readFileSync(join(process.cwd(), "app/(auth)/my-learna/page.tsx"), "utf8");
const myDataRouteSource = readFileSync(join(process.cwd(), "app/(auth)/my-data/page.tsx"), "utf8");

describe("My Learna canonical route", () => {
  it("renders the authenticated My Learna workspace", () => {
    expect(myLearnaRouteSource).toContain("CleanLearnaWorkspace");
    expect(myLearnaRouteSource).not.toContain("redirect(");
  });

  it("redirects legacy My Data bookmarks to My Learna", () => {
    expect(myDataRouteSource).toContain("redirect(buildMyDataRedirectPath");
    expect(buildMyDataRedirectPath()).toBe("/my-learna");
  });

  it("preserves multiple and repeated query parameters", () => {
    expect(
      buildMyDataRedirectPath({
        learnerId: "learner-123",
        subject: "mathematics",
        tag: ["a", "b"],
      }),
    ).toBe("/my-learna?learnerId=learner-123&subject=mathematics&tag=a&tag=b");
  });
});
