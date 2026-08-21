// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithPasswordMock, replaceMock, refreshMock } = vi.hoisted(() => ({
  signInWithPasswordMock: vi.fn(),
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/lib/supabaseClient", () => ({ hasSupabaseEnv: true, supabase: { auth: { signInWithPassword: signInWithPasswordMock } } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: replaceMock, refresh: refreshMock }) }));

import FounderLoginForm from "./FounderLoginForm";

describe("FounderLoginForm", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("renders email and password fields", () => {
    render(<FounderLoginForm />);
    expect(screen.getByRole("heading", { name: "MyLearna Founder" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
  });

  it("uses password authentication and routes successful sign-in to Founder", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: "founder-user" } }, error: null });
    render(<FounderLoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sean@mylearna.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "not-a-real-password" } });
    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() => expect(signInWithPasswordMock).toHaveBeenCalledWith({ email: "sean@mylearna.com", password: "not-a-real-password" }));
    expect(replaceMock).toHaveBeenCalledWith("/founder");
  });

  it("shows only the safe generic message when authentication fails", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: null }, error: { message: "Invalid login credentials" } });
    render(<FounderLoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "wrong@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "not-a-real-password" } });
    fireEvent.submit(screen.getByRole("form"));
    expect((await screen.findByRole("alert")).textContent).toBe("The email or password could not be verified.");
    expect(document.body.textContent).not.toContain("Invalid login credentials");
  });
});
