// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CleanSetupStatus } from "@/lib/clean/setup/setupStatus";
import type { CleanWorkspaceState } from "@/lib/clean/workspace/types";

const mocks = vi.hoisted(() => ({
  loadCleanWorkspace: vi.fn(),
  loadCleanSetupStatus: vi.fn(),
  useAuthUser: vi.fn(),
  useFamilyWorkspace: vi.fn(),
  hydrateCleanWorkspaceFromFamilySnapshot: vi.fn<
    () => CleanWorkspaceState | null
  >(() => null),
}));

vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: mocks.useAuthUser,
}));
vi.mock("@/lib/clean/workspace/client", () => ({
  hydrateCleanWorkspaceFromFamilySnapshot:
    mocks.hydrateCleanWorkspaceFromFamilySnapshot,
  loadCleanWorkspace: mocks.loadCleanWorkspace,
}));
vi.mock("@/app/components/FamilyWorkspaceProvider", () => ({
  useFamilyWorkspace: mocks.useFamilyWorkspace,
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

const familyWorkspace = {
  profile: { id: "family-1" },
  learners: [],
  userId: "user-1",
  storageMode: "database" as const,
};

const signedOutWorkspace: CleanWorkspaceState = {
  ...workspace,
  currentUserId: null,
  profile: null,
  learners: [],
  requiresFamilyCreation: false,
  error: "You need to sign in to use the clean family workspace.",
};

describe("CleanFamilyWorkspaceProvider progressive loading", () => {
  beforeEach(() => {
    mocks.useAuthUser.mockReturnValue({ user: { id: "user-1" }, loading: false });
    mocks.useFamilyWorkspace.mockReturnValue({ workspace: familyWorkspace });
    mocks.hydrateCleanWorkspaceFromFamilySnapshot.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    mocks.loadCleanWorkspace.mockReset();
    mocks.loadCleanSetupStatus.mockReset();
    mocks.useAuthUser.mockReset();
    mocks.useFamilyWorkspace.mockReset();
    mocks.hydrateCleanWorkspaceFromFamilySnapshot.mockReset();
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

  it("does not warm-seed or reuse a legacy workspace while signed out", async () => {
    mocks.useAuthUser.mockReturnValue({ user: null, loading: false });
    mocks.loadCleanWorkspace.mockResolvedValue(signedOutWorkspace);

    render(
      React.createElement(
        CleanFamilyWorkspaceProvider,
        null,
        React.createElement(Probe),
      ),
    );

    await waitFor(() =>
      expect(mocks.loadCleanWorkspace).toHaveBeenCalledWith(null),
    );
    expect(mocks.hydrateCleanWorkspaceFromFamilySnapshot).not.toHaveBeenCalled();
    expect(screen.queryByTestId("workspace-ready")).toBeNull();
  });

  it("hides User A's workspace immediately when the confirmed session changes", () => {
    const pendingWorkspace = deferred<CleanWorkspaceState>();
    mocks.hydrateCleanWorkspaceFromFamilySnapshot.mockReturnValue(workspace);
    mocks.loadCleanWorkspace.mockReturnValue(pendingWorkspace.promise);

    const rendered = render(
      React.createElement(
        CleanFamilyWorkspaceProvider,
        null,
        React.createElement(Probe),
      ),
    );

    expect(screen.getByTestId("workspace-ready")).toBeTruthy();

    mocks.useAuthUser.mockReturnValue({ user: { id: "user-b" }, loading: false });
    rendered.rerender(
      React.createElement(
        CleanFamilyWorkspaceProvider,
        null,
        React.createElement(Probe),
      ),
    );

    expect(screen.queryByTestId("workspace-ready")).toBeNull();
    expect(screen.getByTestId("workspace-loading").textContent).toBe("true");
  });

  it("waits for AuthUserProvider before considering a legacy warm snapshot", () => {
    mocks.useAuthUser.mockReturnValue({ user: null, loading: true });

    render(
      React.createElement(
        CleanFamilyWorkspaceProvider,
        null,
        React.createElement(Probe),
      ),
    );

    expect(mocks.hydrateCleanWorkspaceFromFamilySnapshot).not.toHaveBeenCalled();
    expect(mocks.loadCleanWorkspace).not.toHaveBeenCalled();
  });

  it("passes only the confirmed AuthUserProvider id to warm snapshot validation", async () => {
    mocks.useAuthUser.mockReturnValue({ user: { id: "user-b" }, loading: false });
    mocks.loadCleanWorkspace.mockResolvedValue({ ...workspace, currentUserId: "user-b" });

    render(
      React.createElement(
        CleanFamilyWorkspaceProvider,
        null,
        React.createElement(Probe),
      ),
    );

    await waitFor(() =>
      expect(mocks.hydrateCleanWorkspaceFromFamilySnapshot).toHaveBeenCalledWith(
        familyWorkspace,
        "user-b",
      ),
    );
  });
});
