// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  signInWithPasswordMock,
  resetPasswordForEmailMock,
  replaceMock,
  refreshMock,
} = vi.hoisted(() => ({
  signInWithPasswordMock: vi.fn(),
  resetPasswordForEmailMock: vi.fn(),
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/lib/supabaseClient", () => ({
  hasSupabaseEnv: true,
  supabase: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
  },
}));
vi.mock("@/lib/authRedirect", () => ({
  buildAuthCallbackUrl: () => "https://www.mylearna.com/auth/callback?next=%2Ffounder%2Fpassword",
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));

import FounderLoginForm from "./FounderLoginForm";

describe("FounderLoginForm", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    resetPasswordForEmailMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("locks the page to the fixed Founder account and renders only a password field", () => {
    render(<FounderLoginForm />);
    expect(screen.getByRole("heading", { name: "MyLearna Founder" })).toBeTruthy();
    expect(screen.getByText("sean@mylearna.com")).toBeTruthy();
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(screen.getByLabelText("Password")).toBeTruthy();
  });

  it("uses the fixed Founder email for password authentication", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "founder-user" } },
      error: null,
    });
    render(<FounderLoginForm />);
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "not-a-real-password" },
    });
    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() =>
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: "sean@mylearna.com",
        password: "not-a-real-password",
      }),
    );
    expect(replaceMock).toHaveBeenCalledWith("/founder");
  });

  it("sends password setup only to the fixed Founder email", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null });
    render(<FounderLoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Set or reset Founder password" }));
    await waitFor(() =>
      expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
        "sean@mylearna.com",
        {
          redirectTo:
            "https://www.mylearna.com/auth/callback?next=%2Ffounder%2Fpassword",
        },
      ),
    );
    expect((await screen.findByRole("status")).textContent).toContain(
      "sean@mylearna.com",
    );
  });

  it("shows only the safe generic message when authentication fails", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });
    render(<FounderLoginForm />);
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "not-a-real-password" },
    });
    fireEvent.submit(screen.getByRole("form"));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "The Founder account could not be verified.",
    );
    expect(document.body.textContent).not.toContain("Invalid login credentials");
  });
});
