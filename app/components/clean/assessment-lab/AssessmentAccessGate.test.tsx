// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import { useAuthUser } from "@/app/components/AuthUserProvider";

vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: vi.fn(),
}));

const mockedUseAuthUser = vi.mocked(useAuthUser);

describe("AssessmentAccessGate release hygiene", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("does not render internal release language in the allowed Practice experience", () => {
    mockedUseAuthUser.mockReturnValue({
      user: { id: "staff-1", email: "staff@mylearna.com" },
      profile: { is_admin: true },
      loading: false,
    } as ReturnType<typeof useAuthUser>);

    render(
      <AssessmentAccessGate mode="legacy">
        <main>
          <a href="/my-pathways?pathwayStepId=step-1">Return to My Pathways</a>
          <button type="button">Finish practice</button>
        </main>
      </AssessmentAccessGate>,
    );

    expect(screen.getByRole("button", { name: "Finish practice" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Return to My Pathways" })).toBeTruthy();
    expect(screen.queryByText(/legacy assessment experience/i)).toBeNull();
    expect(screen.queryByText(/deprecated/i)).toBeNull();
    expect(screen.queryByText(/hidden from customers/i)).toBeNull();
  });

  it("keeps unavailable assessment messaging customer-safe", () => {
    mockedUseAuthUser.mockReturnValue({
      user: { id: "parent-1", email: "parent@example.com" },
      profile: { is_admin: false },
      loading: false,
    } as ReturnType<typeof useAuthUser>);

    render(
      <AssessmentAccessGate mode="legacy">
        <main>Practice content</main>
      </AssessmentAccessGate>,
    );

    expect(screen.getByRole("heading", { name: "Assessment unavailable" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Return to My Pathways" })).toBeTruthy();
    expect(screen.queryByText(/legacy|deprecated|hidden from customers|internal|migration|phase|v1|v2/i)).toBeNull();
  });
});
