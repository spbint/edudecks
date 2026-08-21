// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  getUserMock,
  updateUserMock,
  maybeSingleMock,
  eqMock,
  selectMock,
  fromMock,
  replaceMock,
  refreshMock,
} = vi.hoisted(() => {
  const maybeSingleMock = vi.fn();
  const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ select: selectMock }));

  return {
    getUserMock: vi.fn(),
    updateUserMock: vi.fn(),
    maybeSingleMock,
    eqMock,
    selectMock,
    fromMock,
    replaceMock: vi.fn(),
    refreshMock: vi.fn(),
  };
});

vi.mock("@/lib/supabaseClient", () => ({
  hasSupabaseEnv: true,
  supabase: {
    auth: {
      getUser: getUserMock,
      updateUser: updateUserMock,
    },
    from: fromMock,
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));

import FounderPasswordForm from "./FounderPasswordForm";

describe("FounderPasswordForm", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    getUserMock.mockReset();
    updateUserMock.mockReset();
    maybeSingleMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
    fromMock.mockClear();
    selectMock.mockClear();
    eqMock.mockClear();

    getUserMock.mockResolvedValue({
      data: { user: { id: "founder-user", email: "sean@mylearna.com" } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({ data: { is_admin: true }, error: null });
  });

  it("only enables password setup after the Founder email and admin profile are verified", async () => {
    render(<FounderPasswordForm />);
    expect(await screen.findByRole("heading", { name: "Set your Founder password" })).toBeTruthy();
    expect(screen.getByText(/sean@mylearna.com/)).toBeTruthy();
    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(eqMock).toHaveBeenCalledWith("id", "founder-user");
  });

  it("saves a 16+ character password for the verified Founder session", async () => {
    updateUserMock.mockResolvedValue({ error: null });
    render(<FounderPasswordForm />);
    await screen.findByRole("heading", { name: "Set your Founder password" });

    const password = "a-very-long-founder-password";
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: password } });
    fireEvent.submit(screen.getByRole("form"));

    await waitFor(() => expect(updateUserMock).toHaveBeenCalledWith({ password }));
    expect(replaceMock).toHaveBeenCalledWith("/founder");
  });

  it("fails closed for a session that is not the fixed Founder account", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "ordinary-user", email: "other@example.com" } },
      error: null,
    });
    render(<FounderPasswordForm />);
    expect(await screen.findByRole("heading", { name: "Founder link required" })).toBeTruthy();
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});
