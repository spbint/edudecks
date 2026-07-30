// @vitest-environment jsdom

import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as { email?: string | null } | null,
    loading: true,
  },
}));

vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: () => ({
    user: mocks.authState.user,
    loading: mocks.authState.loading,
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/my-calendar",
  useRouter: () => ({ prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => React.createElement("img", props),
}));

vi.mock("@/app/components/clean/analytics/ProductAnalyticsProvider", () => ({
  default: () => null,
}));

vi.mock("@/app/components/clean/CleanCommunityNotificationsMenu", () => ({
  default: () => null,
}));

vi.mock("@/app/components/clean/ReportProblemButton", () => ({
  default: () => null,
}));

import CleanAccountMenu from "@/app/components/clean/CleanAccountMenu";
import MyLearnaAppShellV2 from "@/app/components/clean/design-v2/MyLearnaAppShellV2";

function shell(initialUserEmail: string | null) {
  return React.createElement(
    MyLearnaAppShellV2,
    { initialUserEmail },
    React.createElement("div", null, "Calendar content"),
  );
}

describe("authenticated shell account hydration", () => {
  afterEach(() => {
    cleanup();
    mocks.authState = { user: null, loading: true };
  });

  it("hydrates without a mismatch when the server seeds the signed-in email", async () => {
    const signedInUser = { email: "sean@mylearna.com" };
    mocks.authState = { user: null, loading: true };
    const serverMarkup = renderToString(shell(signedInUser.email));

    expect(serverMarkup).toContain(">SE<");
    expect(serverMarkup).toContain("sean@mylearna.com");

    const container = document.createElement("div");
    container.innerHTML = serverMarkup;
    document.body.appendChild(container);

    mocks.authState = { user: signedInUser, loading: false };
    const recoverableErrors: unknown[] = [];

    await act(async () => {
      hydrateRoot(container, shell(signedInUser.email), {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

    expect(recoverableErrors).toEqual([]);
    expect(screen.getByText("SE")).toBeTruthy();
    expect(screen.getByText("sean@mylearna.com")).toBeTruthy();
  });

  it("keeps the safe ME/Profile fallback when no email is available", () => {
    render(React.createElement(CleanAccountMenu, { email: null }));

    expect(screen.getByText("ME")).toBeTruthy();
    expect(screen.getByText("Profile")).toBeTruthy();
  });
});
