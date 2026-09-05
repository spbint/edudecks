// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = { prefetch: vi.fn(), replace: vi.fn() };
const mobileMediaQuery = {
  matches: true,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

vi.mock("next/image", () => ({
  default: () => <div />,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/my-day",
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: () => ({ user: { id: "user-1", email: "parent@example.test" } }),
}));

vi.mock("@/app/components/clean/CleanFamilyWorkspaceProvider", () => ({
  useCleanFamilyWorkspace: () => ({
    loading: false,
    setupLoading: false,
    error: null,
    schemaMissing: false,
    profile: { id: "family-1" },
    learners: [{ id: "learner-1" }],
  }),
}));

vi.mock("@/lib/clean/setup/familySetupRouteGuard", () => ({
  getFamilySetupRedirectPath: () => null,
  isFamilyProfileRoute: () => false,
  shouldHoldForFamilySetup: () => false,
}));

vi.mock("@/app/components/clean/analytics/ProductAnalyticsProvider", () => ({ default: () => null }));
vi.mock("@/app/components/clean/CleanAccountMenu", () => ({ default: () => <button type="button">Account menu</button> }));
vi.mock("@/app/components/clean/CleanCommunityNotificationsMenu", () => ({ default: () => null }));
vi.mock("@/app/components/clean/ReportProblemButton", () => ({ default: () => null }));
vi.mock("@/app/components/clean/guidance/GuidedStartFamilySetup", () => ({ default: () => null }));

import MyLearnaAppShellV2 from "./MyLearnaAppShellV2";

function renderShell() {
  return render(<MyLearnaAppShellV2><p>Page content</p></MyLearnaAppShellV2>);
}

describe("MyLearna mobile More navigation accessibility", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    router.prefetch.mockReset();
    router.replace.mockReset();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue(mobileMediaQuery),
    });
  });

  it("opens an accessible modal and moves focus to its Close control", async () => {
    renderShell();

    const more = screen.getByRole("button", { name: "Open More navigation", hidden: true });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(more);

    const dialog = await screen.findByRole("dialog", { hidden: true });
    const close = screen.getByRole("button", { name: "Close", hidden: true });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("mylearna-mobile-more-title");
    expect(more.getAttribute("aria-controls")).toBe("mylearna-mobile-more-navigation");
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(close);
  });

  it("closes with Close or Escape and restores focus to the More trigger", async () => {
    renderShell();
    const more = screen.getByRole("button", { name: "Open More navigation", hidden: true });

    fireEvent.click(more);
    fireEvent.click(await screen.findByRole("button", { name: "Close", hidden: true }));
    await waitFor(() => expect(screen.queryByRole("dialog", { hidden: true })).toBeNull());
    expect(document.activeElement).toBe(more);

    fireEvent.click(more);
    await screen.findByRole("dialog", { hidden: true });
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { hidden: true })).toBeNull());
    expect(document.activeElement).toBe(more);
  });

  it("contains Tab navigation and closes normally when a destination is selected", async () => {
    renderShell();

    fireEvent.click(screen.getByRole("button", { name: "Open More navigation", hidden: true }));
    const close = await screen.findByRole("button", { name: "Close", hidden: true });
    const lastLink = screen.getByRole("link", { name: "Help and feedback", hidden: true });

    lastLink.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastLink);

    const dialog = within(screen.getByRole("dialog", { hidden: true }));
    expect(dialog.queryByRole("link", { name: "My Settings", hidden: true })).toBeNull();
    const account = dialog.getByRole("link", { name: "Account", hidden: true });
    expect(account.getAttribute("href")).toBe("/my-profile");
    fireEvent.click(account);
    await waitFor(() => expect(screen.queryByRole("dialog", { hidden: true })).toBeNull());
  });
});
