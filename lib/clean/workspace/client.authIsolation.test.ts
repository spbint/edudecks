import { describe, expect, it } from "vitest";
import { hydrateCleanWorkspaceFromFamilySnapshot } from "@/lib/clean/workspace/client";
import type { FamilyWorkspaceState } from "@/lib/familyWorkspace";

const databaseSnapshot = {
  profile: {
    id: "family-a",
    owner_user_id: "user-a",
    family_display_name: "Family A",
  },
  learners: [{ id: "learner-a", label: "Learner A" }],
  userId: "user-a",
  storageMode: "database",
} as FamilyWorkspaceState;

describe("clean workspace warm snapshot identity checks", () => {
  it("accepts only a database snapshot owned by the confirmed current user", () => {
    expect(
      hydrateCleanWorkspaceFromFamilySnapshot(databaseSnapshot, "user-a"),
    ).toMatchObject({
      currentUserId: "user-a",
      profile: { id: "family-a" },
      learners: [{ id: "learner-a" }],
    });
  });

  it("rejects a previous account snapshot", () => {
    expect(
      hydrateCleanWorkspaceFromFamilySnapshot(databaseSnapshot, "user-b"),
    ).toBeNull();
  });

  it("rejects a signed-out or local fallback snapshot", () => {
    expect(
      hydrateCleanWorkspaceFromFamilySnapshot(databaseSnapshot, null),
    ).toBeNull();
    expect(
      hydrateCleanWorkspaceFromFamilySnapshot(
        { ...databaseSnapshot, storageMode: "local" },
        "user-a",
      ),
    ).toBeNull();
  });
});
