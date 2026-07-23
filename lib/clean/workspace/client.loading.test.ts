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

import { loadCleanWorkspace } from "@/lib/clean/workspace/client";

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

    const workspacePromise = loadCleanWorkspace();
    await Promise.resolve();
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
});
