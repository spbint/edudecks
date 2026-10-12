import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: vi.fn(() => []) })),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabaseClient", () => ({
  requireSupabasePublicEnv: vi.fn(() => ({
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "test-anon-key",
  })),
}));
vi.mock("@supabase/auth-helpers-nextjs", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser: mocks.getUser } })),
}));

import {
  buildAuthenticatedRouteLoginHref,
  requireAuthenticatedRoute,
} from "./serverRouteAuth";

describe("server authenticated route handoff", () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.redirect.mockReset();
  });

  it("preserves the safe My Learna destination and learner context", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await requireAuthenticatedRoute("/my-learna?learner_id=learner-a");

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?next=%2Fmy-learna%3Flearner_id%3Dlearner-a",
    );
  });

  it("rejects unsafe destinations at the server route boundary", () => {
    expect(
      buildAuthenticatedRouteLoginHref("https://example.com/elsewhere"),
    ).toBe("/login?next=%2Fmy-day");
    expect(buildAuthenticatedRouteLoginHref("//example.com/elsewhere")).toBe(
      "/login?next=%2Fmy-day",
    );
    expect(buildAuthenticatedRouteLoginHref("/\\example.com/elsewhere")).toBe(
      "/login?next=%2Fmy-day",
    );
  });

  it("does not redirect an authenticated user", async () => {
    const user = { id: "user-a" };
    mocks.getUser.mockResolvedValue({ data: { user }, error: null });

    await expect(requireAuthenticatedRoute("/my-learna")).resolves.toBe(user);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
