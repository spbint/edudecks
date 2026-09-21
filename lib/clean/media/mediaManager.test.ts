import { describe, expect, it, vi } from "vitest";
import {
  FamilyMediaManagerError,
  removeManagedFamilyMedia,
  sortFamilyMediaItems,
  type FamilyMediaManagerItem,
  type FamilyMediaRemovalRepository,
} from "@/lib/clean/media/mediaManager";

function repository(overrides: Partial<FamilyMediaRemovalRepository> = {}): FamilyMediaRemovalRepository {
  return {
    isFamilyMember: vi.fn().mockResolvedValue(true),
    findRemovalTarget: vi.fn().mockResolvedValue({
      assetId: "asset-1",
      familyId: "family-1",
      learnerId: "learner-1",
      evidenceEntryId: "evidence-1",
      academicYearId: "year-current",
      objectPath: "family/family-1/learner/learner-1/evidence/evidence-1/server-file.jpg",
      byteSize: 4096,
      lifecycleStatus: "active",
    }),
    findEvidenceRelationship: vi.fn().mockResolvedValue({
      id: "evidence-1",
      familyId: "family-1",
      learnerId: "learner-1",
    }),
    removeStorageObject: vi.fn().mockResolvedValue(undefined),
    getLifecycleStatus: vi.fn().mockResolvedValue("purged"),
    evidenceStillReferencesPath: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe("family media removal", () => {
  it("derives the object path and authoritative byte size from the selected asset", async () => {
    const repo = repository();
    const result = await removeManagedFamilyMedia({
      familyId: "family-1",
      assetId: "asset-1",
      userId: "user-1",
      repository: repo,
    });

    expect(repo.findRemovalTarget).toHaveBeenCalledWith({ familyId: "family-1", assetId: "asset-1" });
    expect(repo.removeStorageObject).toHaveBeenCalledWith(
      "family/family-1/learner/learner-1/evidence/evidence-1/server-file.jpg",
    );
    expect(result).toEqual({
      status: "removed",
      assetId: "asset-1",
      byteSize: 4096,
      academicYearId: "year-current",
    });
  });

  it("blocks cross-family removal before loading or deleting an asset", async () => {
    const repo = repository({ isFamilyMember: vi.fn().mockResolvedValue(false) });
    await expect(removeManagedFamilyMedia({
      familyId: "family-other",
      assetId: "asset-1",
      userId: "user-1",
      repository: repo,
    })).rejects.toMatchObject<Partial<FamilyMediaManagerError>>({ code: "family_forbidden", status: 403 });
    expect(repo.findRemovalTarget).not.toHaveBeenCalled();
    expect(repo.removeStorageObject).not.toHaveBeenCalled();
  });

  it("requires the canonical family, learner and evidence relationship", async () => {
    const repo = repository({
      findRemovalTarget: vi.fn().mockResolvedValue({
        assetId: "asset-1",
        familyId: "family-1",
        learnerId: "learner-1",
        evidenceEntryId: "evidence-1",
        academicYearId: "year-current",
        objectPath: "family/family-other/learner/learner-1/evidence/evidence-1/file.jpg",
        byteSize: 123,
        lifecycleStatus: "active",
      }),
    });
    await expect(removeManagedFamilyMedia({
      familyId: "family-1",
      assetId: "asset-1",
      userId: "user-1",
      repository: repo,
    })).rejects.toMatchObject({ code: "asset_relationship_invalid" });
    expect(repo.removeStorageObject).not.toHaveBeenCalled();
  });

  it("returns safely for a repeated removal without deleting or decrementing twice", async () => {
    const repo = repository({
      findRemovalTarget: vi.fn().mockResolvedValue({
        assetId: "asset-1",
        familyId: "family-1",
        learnerId: "learner-1",
        evidenceEntryId: "evidence-1",
        academicYearId: "year-current",
        objectPath: "family/family-1/learner/learner-1/evidence/evidence-1/file.jpg",
        byteSize: 4096,
        lifecycleStatus: "purged",
      }),
    });
    await expect(removeManagedFamilyMedia({
      familyId: "family-1",
      assetId: "asset-1",
      userId: "user-1",
      repository: repo,
    })).resolves.toMatchObject({ status: "already_removed", byteSize: 4096 });
    expect(repo.removeStorageObject).not.toHaveBeenCalled();
  });

  it("fails closed if the lifecycle trigger does not purge and detach the reference", async () => {
    const repo = repository({
      getLifecycleStatus: vi.fn().mockResolvedValue("active"),
      evidenceStillReferencesPath: vi.fn().mockResolvedValue(true),
    });
    await expect(removeManagedFamilyMedia({
      familyId: "family-1",
      assetId: "asset-1",
      userId: "user-1",
      repository: repo,
    })).rejects.toMatchObject({ code: "removal_incomplete", status: 500 });
  });
});

describe("family media ordering", () => {
  const item = (assetId: string, byteSize: number, uploadedAt: string): FamilyMediaManagerItem => ({
    assetId,
    academicYearId: "year-1",
    learningYearLabel: "2026",
    byteSize,
    mimeType: "image/jpeg",
    mediaKind: "image",
    previewUrl: null,
    previewAvailable: false,
    learnerIds: ["learner-1"],
    learnerLabels: ["Learner"],
    evidenceTitle: "Record",
    evidenceDescription: null,
    observedOn: uploadedAt.slice(0, 10),
    uploadedAt,
  });

  it("defaults to largest files first and can order newest first", () => {
    const items = [item("small-new", 100, "2026-09-20T00:00:00Z"), item("large-old", 500, "2026-01-01T00:00:00Z")];
    expect(sortFamilyMediaItems(items).map((entry) => entry.assetId)).toEqual(["large-old", "small-new"]);
    expect(sortFamilyMediaItems(items, "newest").map((entry) => entry.assetId)).toEqual(["small-new", "large-old"]);
  });
});
