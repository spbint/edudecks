// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { accessMock, redirectMock, notFoundMock } = vi.hoisted(() => ({
  accessMock: vi.fn(),
  redirectMock: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
  notFoundMock: vi.fn(() => { throw new Error("NOT_FOUND"); }),
}));

vi.mock("@/lib/clean/founder/founderAccess", () => ({ getFounderAccessContext: accessMock }));
vi.mock("@/lib/authRedirect", () => ({ buildAuthCallbackUrl: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: redirectMock, notFound: notFoundMock, useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/supabaseClient", () => ({ hasSupabaseEnv: false, supabase: null }));

import FounderLoginPage from "./page";

describe("Founder login route", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    accessMock.mockReset();
    redirectMock.mockClear();
    notFoundMock.mockClear();
  });

  it("renders the private login form for an unauthenticated visitor", async () => {
    accessMock.mockResolvedValue({ decision: "unauthenticated", user: null });
    render(await FounderLoginPage());
    expect(screen.getByRole("heading", { name: "MyLearna Founder" })).toBeTruthy();
    expect(screen.getByText("sean@mylearna.com")).toBeTruthy();
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(screen.getByLabelText("Password")).toBeTruthy();
  });

  it("redirects an already-authorised Founder to the dashboard", async () => {
    accessMock.mockResolvedValue({ decision: "allowed", user: { id: "founder-user" } });
    await expect(FounderLoginPage()).rejects.toThrow("REDIRECT:/founder");
  });

  it("fails closed for an authenticated non-Founder", async () => {
    accessMock.mockResolvedValue({ decision: "forbidden", user: { id: "ordinary-user" } });
    await expect(FounderLoginPage()).rejects.toThrow("NOT_FOUND");
  });
});
