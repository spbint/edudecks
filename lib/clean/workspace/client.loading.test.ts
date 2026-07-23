import { afterEach, describe, expect, it, vi } from "vitest";
import type { FamilyProfile } from "@/lib/clean/family/types";
import {
  clearCleanPlanningTiming,
  getCleanPlanningTimingEvents,
} from "@/lib/clean/performance/planningTiming";

const mocks = vi.hoisted(() => ({
  getCurrentCleanUserId: vi.fn(),
  loadCleanFamilyProfile: vi.fn(),
  listCleanLearners: vi.fn(),
}));

vi.mock("@/lib/clean/family/client", () => ({
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE: "Schema missing",
  getCurrentCleanUserId: mocks.getCurrentCleanUserId,
  isCleanSchemaMissingError: vi.fn(() => false),
  loadCleanFamilyProfile: mocks.loadCleanFamilyProfile,
  normalizeCleanErrorMessage: vi.fn((error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
  ),
}));
vi.mock("@/lib/clean/learners/client", () => ({
  listCleanLearners: mocks.listCleanLearners,
}));

import {
  hydrateCleanWorkspaceFromFamilySnapshot,
  loadCleanWorkspace,
} from "@/lib/clean/workspace/client";
import type { FamilyWorkspaceState } from "@/lib/familyWorkspace";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(promiseResolve => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

const profile = {
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
} as FamilyProfile;

describe("clean workspace bootstrap timing", () => {
  afterEach(() => {
    clearCleanPlanningTiming();
    mocks.getCurrentCleanUserId.mockReset();
    mocks.loadCleanFamilyProfile.mockReset();
    mocks.listCleanLearners.mockReset();
  });

  it("measures the family and learner waterfall independently", async () => {
    const family = deferred({
      currentUserId: "user-1",
      profile,
      membership: null,
      members: [],
    });
    const learners = deferred<[]>();
    mocks.loadCleanFamilyProfile.mockReturnValue(family.promise);
    mocks.listCleanLearners.mockReturnValue(learners.promise);

    const workspacePromise = loadCleanWorkspace("user-1");
    await Promise.resolve();
    expect(mocks.loadCleanFamilyProfile).toHaveBeenCalledWith("user-1");
    expect(mocks.getCurrentCleanUserId).not.toHaveBeenCalled();
    expect(mocks.listCleanLearners).not.toHaveBeenCalled();

    family.resolve({
      currentUserId: "user-1",
      profile,
      membership: null,
      members: [],
    });
    await Promise.resolve();
    expect(mocks.listCleanLearners).toHaveBeenCalledWith("family-1");

    learners.resolve([]);
    await expect(workspacePromise).resolves.toMatchObject({
      currentUserId: "user-1",
      profile,
      learners: [],
    });

    const operations = getCleanPlanningTimingEvents().map(event => event.operation);
    expect(operations).toContain("workspace-family-context");
    expect(operations).toContain("workspace-learners");
  });

  it("only hydrates a warm snapshot for the authenticated account", () => {
    const snapshot = {
      storageMode: "database",
      userId: "user-1",
      profile: {
        id: "family-1",
        family_display_name: "Fixture family",
        owner_user_id: "user-1",
        reporting_mode: "family-summary",
        week_start: "monday",
        evidence_privacy_default: "family",
        portfolio_print_style: "calm",
        default_child_id: "learner-1",
      },
      learners: [{ id: "learner-1", label: "Fixture learner" }],
    } as unknown as FamilyWorkspaceState;

    expect(hydrateCleanWorkspaceFromFamilySnapshot(snapshot, "other-user")).toBeNull();
    expect(
      hydrateCleanWorkspaceFromFamilySnapshot(snapshot, "user-1"),
    ).toMatchObject({
      currentUserId: "user-1",
      profile: { id: "family-1" },
      learners: [{ id: "learner-1", familyId: "family-1" }],
    });
  });
});
