// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildLocalFamilyWorkspaceSnapshot: vi.fn(),
  isValidActiveLearnerId: vi.fn(() => false),
  loadFamilyWorkspace: vi.fn(),
  persistLearnersToLocalCache: vi.fn(),
  resolveCanonicalActiveLearnerId: vi.fn(() => ""),
  resolveEffectiveActiveLearnerId: vi.fn(() => ""),
  setActiveLearnerId: vi.fn(),
  useAuthUser: vi.fn(() => ({ user: { id: "user-1" } })),
}));

vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: mocks.useAuthUser,
}));

vi.mock("@/lib/familyWorkspace", () => ({
  ACTIVE_CHILD_EVENT: "active-child",
  FAMILY_WORKSPACE_EVENT: "family-workspace",
  buildLocalFamilyWorkspaceSnapshot: mocks.buildLocalFamilyWorkspaceSnapshot,
  isValidActiveLearnerId: mocks.isValidActiveLearnerId,
  loadFamilyWorkspace: mocks.loadFamilyWorkspace,
  persistLearnersToLocalCache: mocks.persistLearnersToLocalCache,
  resolveCanonicalActiveLearnerId: mocks.resolveCanonicalActiveLearnerId,
  resolveEffectiveActiveLearnerId: mocks.resolveEffectiveActiveLearnerId,
  setActiveLearnerId: mocks.setActiveLearnerId,
}));

import { FamilyWorkspaceProvider, useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";

const localWorkspace = {
  profile: {
    id: "local",
    family_display_name: "My family",
    default_child_id: null,
  },
  learners: [],
  userId: null,
  storageMode: "local" as const,
};

function Probe() {
  const workspace = useFamilyWorkspace();
  return React.createElement(
    "div",
    null,
    React.createElement("span", { "data-testid": "loading" }, String(workspace.loading)),
    React.createElement("span", { "data-testid": "error" }, workspace.error),
  );
}

describe("FamilyWorkspaceProvider compatibility failure handling", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("exits loading and exposes a local snapshot when workspace bootstrap fails", async () => {
    mocks.buildLocalFamilyWorkspaceSnapshot.mockReturnValue(localWorkspace);
    mocks.loadFamilyWorkspace.mockRejectedValue(new Error("bootstrap failed"));

    render(
      React.createElement(
        FamilyWorkspaceProvider,
        null,
        React.createElement(Probe),
      ),
    );

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("error").textContent).toContain("last local snapshot");
    expect(screen.getByTestId("error").textContent).toContain("bootstrap failed");
  });
});
