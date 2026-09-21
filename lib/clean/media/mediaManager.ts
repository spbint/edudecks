export type FamilyMediaLifecycleStatus = "active" | "grace" | "purge_pending" | "purged";

export type FamilyMediaManagerItem = {
  assetId: string;
  academicYearId: string | null;
  learningYearLabel: string;
  byteSize: number;
  mimeType: string;
  mediaKind: "image" | "audio" | "file";
  previewUrl: string | null;
  previewAvailable: boolean;
  learnerIds: string[];
  learnerLabels: string[];
  evidenceTitle: string;
  evidenceDescription: string | null;
  observedOn: string;
  uploadedAt: string | null;
};

export type FamilyMediaManagerPayload = {
  items: FamilyMediaManagerItem[];
  learnerOptions: Array<{ id: string; label: string }>;
  learningYearOptions: Array<{ id: string; label: string }>;
};

export type FamilyMediaRemovalResult = {
  status: "removed" | "already_removed";
  assetId: string;
  byteSize: number;
  academicYearId: string | null;
};

export type FamilyMediaRemovalTarget = {
  assetId: string;
  familyId: string;
  learnerId: string | null;
  evidenceEntryId: string | null;
  academicYearId: string | null;
  objectPath: string;
  byteSize: number;
  lifecycleStatus: FamilyMediaLifecycleStatus;
};

export type FamilyMediaEvidenceRelationship = {
  id: string;
  familyId: string;
  learnerId: string | null;
};

export interface FamilyMediaRemovalRepository {
  isFamilyMember(input: { familyId: string; userId: string }): Promise<boolean>;
  findRemovalTarget(input: { familyId: string; assetId: string }): Promise<FamilyMediaRemovalTarget | null>;
  findEvidenceRelationship(input: {
    familyId: string;
    evidenceEntryId: string;
  }): Promise<FamilyMediaEvidenceRelationship | null>;
  removeStorageObject(objectPath: string): Promise<void>;
  getLifecycleStatus(assetId: string): Promise<FamilyMediaLifecycleStatus | null>;
  evidenceStillReferencesPath(input: {
    familyId: string;
    evidenceEntryId: string;
    objectPath: string;
  }): Promise<boolean>;
}

export class FamilyMediaManagerError extends Error {
  constructor(
    public readonly code:
      | "authentication_required"
      | "family_forbidden"
      | "asset_not_found"
      | "asset_relationship_invalid"
      | "storage_remove_failed"
      | "removal_incomplete",
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FamilyMediaManagerError";
  }
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function canonicalEvidenceObjectPrefix(target: FamilyMediaRemovalTarget) {
  if (!target.learnerId || !target.evidenceEntryId) return null;
  return `family/${target.familyId}/learner/${target.learnerId}/evidence/${target.evidenceEntryId}/`;
}

export async function removeManagedFamilyMedia(input: {
  familyId: string;
  assetId: string;
  userId: string;
  repository: FamilyMediaRemovalRepository;
}): Promise<FamilyMediaRemovalResult> {
  const familyId = clean(input.familyId);
  const assetId = clean(input.assetId);
  const userId = clean(input.userId);

  if (!userId) {
    throw new FamilyMediaManagerError(
      "authentication_required",
      "Sign in to manage family media.",
      401,
    );
  }
  if (!familyId || !assetId) {
    throw new FamilyMediaManagerError(
      "asset_not_found",
      "This media item is unavailable.",
      404,
    );
  }

  if (!(await input.repository.isFamilyMember({ familyId, userId }))) {
    throw new FamilyMediaManagerError(
      "family_forbidden",
      "This family media library is unavailable.",
      403,
    );
  }

  const target = await input.repository.findRemovalTarget({ familyId, assetId });
  if (!target) {
    throw new FamilyMediaManagerError(
      "asset_not_found",
      "This media item is unavailable.",
      404,
    );
  }

  if (target.lifecycleStatus === "purged") {
    return {
      status: "already_removed",
      assetId: target.assetId,
      byteSize: target.byteSize,
      academicYearId: target.academicYearId,
    };
  }

  const expectedPrefix = canonicalEvidenceObjectPrefix(target);
  if (!expectedPrefix || !target.objectPath.startsWith(expectedPrefix)) {
    throw new FamilyMediaManagerError(
      "asset_relationship_invalid",
      "This media item could not be matched to its learning record.",
      409,
    );
  }

  const evidence = await input.repository.findEvidenceRelationship({
    familyId,
    evidenceEntryId: target.evidenceEntryId as string,
  });
  if (
    !evidence ||
    evidence.familyId !== familyId ||
    evidence.learnerId !== target.learnerId
  ) {
    throw new FamilyMediaManagerError(
      "asset_relationship_invalid",
      "This media item could not be matched to its learning record.",
      409,
    );
  }

  try {
    await input.repository.removeStorageObject(target.objectPath);
  } catch {
    throw new FamilyMediaManagerError(
      "storage_remove_failed",
      "This media file could not be removed right now. The learning record remains safe.",
      503,
    );
  }

  const [lifecycleStatus, stillReferenced] = await Promise.all([
    input.repository.getLifecycleStatus(target.assetId),
    input.repository.evidenceStillReferencesPath({
      familyId,
      evidenceEntryId: target.evidenceEntryId as string,
      objectPath: target.objectPath,
    }),
  ]);

  if (lifecycleStatus !== "purged" || stillReferenced) {
    throw new FamilyMediaManagerError(
      "removal_incomplete",
      "The media removal could not be confirmed. The learning record remains safe.",
      500,
    );
  }

  return {
    status: "removed",
    assetId: target.assetId,
    byteSize: target.byteSize,
    academicYearId: target.academicYearId,
  };
}

export function sortFamilyMediaItems(
  items: FamilyMediaManagerItem[],
  ordering: "largest" | "newest" = "largest",
) {
  return [...items].sort((left, right) => {
    if (ordering === "newest") {
      const dateDelta = Date.parse(right.uploadedAt || right.observedOn) - Date.parse(left.uploadedAt || left.observedOn);
      if (Number.isFinite(dateDelta) && dateDelta !== 0) return dateDelta;
    }
    return right.byteSize - left.byteSize || right.observedOn.localeCompare(left.observedOn);
  });
}
