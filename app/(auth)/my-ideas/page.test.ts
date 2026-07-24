import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import MyIdeasPage from "@/app/(auth)/my-ideas/page";

describe("My Ideas route flag", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE;
    mocks.notFound.mockClear();
  });

  it("does not expose the route when the feature is disabled", () => {
    expect(() => MyIdeasPage()).toThrow("NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("renders the authenticated workspace when enabled", () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE = "true";

    expect(MyIdeasPage()).toBeTruthy();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
