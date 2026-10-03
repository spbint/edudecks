// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  sendChallenge: vi.fn(),
  sendMagicLink: vi.fn(),
  verifyOtp: vi.fn(),
  getSession: vi.fn(),
  track: vi.fn(),
  loadProfile: vi.fn(),
  searchParams: new URLSearchParams("next=%2Ffounder"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: vi.fn() }),
  useSearchParams: () => mocks.searchParams,
}));
vi.mock("@/app/components/PublicSiteShell", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: () => ({ user: null, loading: false }),
}));
vi.mock("@/lib/supabaseClient", () => ({
  hasSupabaseEnv: true,
  MISSING_PUBLIC_SUPABASE_ENV_MESSAGE: "Missing configuration",
  supabase: {
    auth: {
      verifyOtp: mocks.verifyOtp,
      getSession: mocks.getSession,
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}));
vi.mock("@/lib/authMagicLink", () => ({
  getMagicLinkRetryAfterMs: vi.fn(() => undefined),
  MAGIC_LINK_CLIENT_RESEND_DELAY_MS: 60000,
  mapMagicLinkError: vi.fn(() => "We could not send the sign-in email."),
  sendEmailAuthChallenge: mocks.sendChallenge,
  sendMagicLink: mocks.sendMagicLink,
}));
vi.mock("@/lib/authAnalytics", () => ({
  markPendingProductEntry: vi.fn(),
  resetAuthAttempt: vi.fn(),
  trackAuthEvent: mocks.track,
}));
vi.mock("@/lib/clean/family/client", () => ({ loadCleanFamilyProfile: mocks.loadProfile }));
vi.mock("@/lib/clean/setup/setupFlow", () => ({ hasRequiredLearningSettings: vi.fn(() => true) }));
vi.mock("@/lib/authPendingMarketplaceDestination", () => ({ rememberPendingMarketplaceDestination: vi.fn() }));
vi.mock("@/lib/familySignOut", () => ({ completeFamilySignOut: vi.fn() }));
vi.mock("@/lib/signupPrefill", () => ({ readSignupPrefill: vi.fn(() => null) }));

import EmailAuthPage from "./EmailAuthPage";

function submitEmail(email = "founder@example.com") {
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

describe("EmailAuthPage OTP login", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_MYLEARNA_EMAIL_AUTH_MODE", "");
    mocks.replace.mockReset();
    mocks.sendChallenge.mockReset().mockResolvedValue({});
    mocks.sendMagicLink.mockReset();
    mocks.verifyOtp.mockReset().mockResolvedValue({ error: null });
    mocks.getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: "founder" } } } });
    mocks.track.mockReset();
    mocks.loadProfile.mockReset().mockResolvedValue({ profile: { id: "profile" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reveals the six-digit OTP state after email submission", async () => {
    render(<EmailAuthPage mode="login" />);
    submitEmail();

    expect(await screen.findByText("Enter your sign-in code", { selector: "div" })).toBeTruthy();
    expect(screen.getAllByText("We sent a six-digit code to your email.").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Six-digit sign-in code")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Verify code" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByLabelText("Email address")).toBeNull();
  });

  it("submits a six-digit OTP, establishes the session, and preserves the Founder destination", async () => {
    render(<EmailAuthPage mode="login" />);
    submitEmail();
    const code = await screen.findByLabelText("Six-digit sign-in code");
    fireEvent.change(code, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));

    await waitFor(() => expect(mocks.verifyOtp).toHaveBeenCalledWith({ email: "founder@example.com", token: "123456", type: "email" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/founder"), { timeout: 3000 });
    expect(mocks.track).toHaveBeenCalledWith("auth_verification_succeeded", expect.objectContaining({ challengeType: "otp_code" }));
    expect(mocks.track).toHaveBeenCalledWith("auth_session_ready", expect.objectContaining({ route: "/founder" }));
  });

  it("shows safe invalid-or-expired messaging", async () => {
    mocks.verifyOtp.mockResolvedValueOnce({ error: new Error("Token has expired") });
    render(<EmailAuthPage mode="login" />);
    submitEmail();
    fireEvent.change(await screen.findByLabelText("Six-digit sign-in code"), { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));

    expect(await screen.findByText(/invalid or has expired/i)).toBeTruthy();
    expect(document.body.textContent).not.toContain("Token has expired");
  });

  it("enforces the resend cooldown and lets the user change email", async () => {
    vi.useFakeTimers();
    render(<EmailAuthPage mode="login" />);
    submitEmail();
    await act(async () => Promise.resolve());

    const cooldownButton = screen.getByRole("button", { name: /Resend available in 60s/i });
    expect((cooldownButton as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { vi.advanceTimersByTime(60000); });
    expect((screen.getByRole("button", { name: "Resend code" }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Change email" }));
    expect(screen.getByLabelText("Email address")).toBeTruthy();
    expect(screen.queryByLabelText("Six-digit sign-in code")).toBeNull();
  });

  it("does not reveal whether an email address has an account", async () => {
    mocks.sendChallenge.mockRejectedValueOnce(Object.assign(new Error("User not found"), { code: "user_not_found" }));
    render(<EmailAuthPage mode="login" />);
    submitEmail("unknown@example.com");

    expect(await screen.findByLabelText("Six-digit sign-in code")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/user not found|couldn't find.*account/i);
  });
});
