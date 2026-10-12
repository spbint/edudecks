import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { buildMyDataRedirectPath } from "@/app/(auth)/my-data/page";

const myLearnaRouteSource = readFileSync(
  join(process.cwd(), "app/(my-learna-auth)/my-learna/page.tsx"),
  "utf8",
);
const myLearnaLayoutSource = readFileSync(
  join(process.cwd(), "app/(my-learna-auth)/layout.tsx"),
  "utf8",
);
const myDataRouteSource = readFileSync(
  join(process.cwd(), "app/(auth)/my-data/page.tsx"),
  "utf8",
);

describe("My Learna canonical route", () => {
  it("guards the exact requested destination before rendering the workspace", () => {
    expect(myLearnaRouteSource).toContain("requireAuthenticatedRoute(");
    expect(myLearnaRouteSource).toContain("buildMyLearnaAuthDestination");
    expect(myLearnaRouteSource).toContain("CleanLearnaWorkspace");
    expect(myLearnaLayoutSource).not.toContain(
      'requireAuthenticatedRoute("/my-day")',
    );
  });

  it("keeps the existing authenticated family shell and setup guard", () => {
    expect(myLearnaLayoutSource).toContain("FamilyWorkspaceProvider");
    expect(myLearnaLayoutSource).toContain("CleanFamilyWorkspaceProvider");
    expect(myLearnaLayoutSource).toContain("MyLearnaAppShellV2");
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
    ).toBe(
      "/my-learna?learnerId=learner-123&subject=mathematics&tag=a&tag=b",
    );
  });
});
