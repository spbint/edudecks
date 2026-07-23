// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CleanSetupStatus } from "@/lib/clean/setup/setupStatus";
import type { CleanWorkspaceState } from "@/lib/clean/workspace/types";

const mocks = vi.hoisted(() => ({
  loadCleanWorkspace: vi.fn(),
  loadCleanSetupStatus: vi.fn(),
  useAuthUser: vi.fn(() => ({ user: { id: "user-1" } })),
}));

vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: mocks.useAuthUser,
}));
vi.mock("@/lib/clean/workspace/client", () => ({
  hydrateCleanWorkspaceFromFamilySnapshot: vi.fn(() => null),
  loadCleanWorkspace: mocks.loadCleanWorkspace,
}));
vi.mock("@/lib/clean/setup/setupStateClient", () => ({
  buildEmptyCleanSetupStatus: vi.fn(() => ({
    activeLearnerId: null,
    hasEvidence: false,
    hasLearningYear: false,
    hasLearningPeriods: false,
    hasPathway: false,
    hasPortfolio: false,
    hasReports: false,
    nextStep: null,
  })),
  loadCleanSetupStatus: mocks.loadCleanSetupStatus,
}));

import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function Probe() {
  const workspace = useCleanFamilyWorkspace();
  return React.createElement(
    "div",
    null,
    React.createElement("span", { "data-testid": "workspace-loading" }, String(workspace.loading)),
    React.createElement("span", { "data-testid": "setup-loading" }, String(workspace.setupLoading)),
    workspace.profile
      ? React.createElement("span", { "data-testid": "workspace-ready" }, "workspace-ready")
      : null,
  );
}

const workspace: CleanWorkspaceState = {
  currentUserId: "user-1",
  profile: {
    id: "family-1",
    createdByUserId: "user-1",
    displayName: "Test family",
    countryCode: null,
    jurisdictionCode: null,
    curriculumFrameworkId: null,
    reportingMode: "simple",
    weekStart: "monday",
    privacyDefault: "private",
    exportStyle: "standard",
    defaultLearnerId: null,
    createdAt: null,
    updatedAt: null,
  },
  membership: null,
  members: [],
  learners: [],
  requiresFamilyCreation: false,
  schemaMissing: false,
  error: null,
};

const setupStatus = {
  activeLearnerId: null,
  hasEvidence: false,
  hasLearningYear: false,
  hasLearningPeriods: false,
  hasPathway: false,
  hasPortfolio: false,
  hasReports: false,
  nextStep: null,
} as unknown as CleanSetupStatus;

describe("CleanFamilyWorkspaceProvider progressive loading", () => {
  afterEach(() => {
    cleanup();
    mocks.loadCleanWorkspace.mockReset();
    mocks.loadCleanSetupStatus.mockReset();
  });

  it("fails fast when a clean workspace consumer is outside the provider", () => {
    expect(() => render(React.createElement(Probe))).toThrowError(
      "useCleanFamilyWorkspace must be used within CleanFamilyWorkspaceProvider.",
    );
  });

  it("publishes the workspace before slow setup enrichment settles", async () => {
    const setup = deferred<CleanSetupStatus>();
    mocks.loadCleanWorkspace.mockResolvedValue(workspace);
    mocks.loadCleanSetupStatus.mockReturnValue(setup.promise);

    render(
      React.createElement(
        CleanFamilyWorkspaceProvider,
        null,
        React.createElement(Probe),
      ),
    );

    await waitFor(() => expect(screen.getByTestId("workspace-ready")).toBeTruthy());
    expect(screen.getByTestId("workspace-loading").textContent).toBe("false");
    expect(screen.getByTestId("setup-loading").textContent).toBe("true");
    expect(mocks.loadCleanSetupStatus).toHaveBeenCalledTimes(1);

    setup.resolve(setupStatus);
    await waitFor(() =>
      expect(screen.getByTestId("setup-loading").textContent).toBe("false"),
    );
  });

  it("exits setup loading when optional enrichment fails", async () => {
    mocks.loadCleanWorkspace.mockResolvedValue(workspace);
    mocks.loadCleanSetupStatus.mockRejectedValue(new Error("slow setup"));

    render(
      React.createElement(
        CleanFamilyWorkspaceProvider,
        null,
        React.createElement(Probe),
      ),
    );

    await waitFor(() => expect(screen.getByTestId("workspace-ready")).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId("setup-loading").textContent).toBe("false"),
    );
    expect(screen.getByTestId("workspace-loading").textContent).toBe("false");
  });
});
