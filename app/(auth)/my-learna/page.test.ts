import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { buildMyLearnaRedirectPath } from "@/app/(auth)/my-learna/page";

describe("my-learna redirect", () => {
  it("redirects old My Learna bookmarks to My Data", () => {
    expect(buildMyLearnaRedirectPath()).toBe("/my-data");
  });

  it("preserves learner context and other query parameters", () => {
    expect(
      buildMyLearnaRedirectPath({
        learner: "learner-123",
        view: "progress",
        tag: ["a", "b"],
      }),
    ).toBe("/my-data?learner=learner-123&view=progress&tag=a&tag=b");
  });
});
