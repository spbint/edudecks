import type { PathwaySubjectKey } from "@/lib/clean/pathways/pathwaySubjects";

export type PathwayPlacementMethod =
  | "suggested"
  | "manual"
  | "moved_forward"
  | "moved_back"
  | "placement_check";

export type PathwayPlacement = {
  learnerId: string;
  subjectKey: PathwaySubjectKey;
  strandKey: string;
  pathwayStepId: string;
  method: PathwayPlacementMethod;
  createdAt: string;
  updatedAt: string;
};

export type SavePathwayPlacementInput = {
  learnerId: string;
  subjectKey: PathwaySubjectKey;
  strandKey: string;
  pathwayStepId: string;
  method: PathwayPlacementMethod;
};

const PATHWAY_PLACEMENT_STORAGE_KEY = "mylearna.pathwayPlacements.v1";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function getPathwayPlacementKey(
  learnerId: string,
  subjectKey: PathwaySubjectKey,
  strandKey: string,
) {
  return [safe(learnerId), safe(subjectKey), safe(strandKey)].join("::");
}

function isPathwayPlacement(value: unknown): value is PathwayPlacement {
  const candidate = value as Partial<PathwayPlacement>;
  return Boolean(
    safe(candidate?.learnerId) &&
      safe(candidate?.subjectKey) &&
      safe(candidate?.strandKey) &&
      safe(candidate?.pathwayStepId),
  );
}

export function readPathwayPlacements() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(PATHWAY_PLACEMENT_STORAGE_KEY) || "[]",
    );
    return Array.isArray(parsed) ? parsed.filter(isPathwayPlacement) : [];
  } catch {
    return [];
  }
}

export function readPathwayPlacement(
  learnerId: string,
  subjectKey: PathwaySubjectKey,
  strandKey: string,
) {
  const key = getPathwayPlacementKey(learnerId, subjectKey, strandKey);
  return (
    readPathwayPlacements().find(
      (placement) =>
        getPathwayPlacementKey(
          placement.learnerId,
          placement.subjectKey,
          placement.strandKey,
        ) === key,
    ) || null
  );
}

export function hasAnyPathwayPlacementForLearner(learnerId: string) {
  const normalizedLearnerId = safe(learnerId);
  if (!normalizedLearnerId) return false;
  return readPathwayPlacements().some(
    (placement) => placement.learnerId === normalizedLearnerId,
  );
}

export function savePathwayPlacement(input: SavePathwayPlacementInput) {
  if (typeof window === "undefined") return null;

  const learnerId = safe(input.learnerId);
  const strandKey = safe(input.strandKey);
  const pathwayStepId = safe(input.pathwayStepId);

  if (!learnerId || !strandKey || !pathwayStepId) {
    return null;
  }

  const now = new Date().toISOString();
  const key = getPathwayPlacementKey(learnerId, input.subjectKey, strandKey);
  const current = readPathwayPlacements();
  const existing = current.find(
    (placement) =>
      getPathwayPlacementKey(
        placement.learnerId,
        placement.subjectKey,
        placement.strandKey,
      ) === key,
  );
  const nextPlacement: PathwayPlacement = {
    learnerId,
    subjectKey: input.subjectKey,
    strandKey,
    pathwayStepId,
    method: input.method,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const nextPlacements = [
    ...current.filter(
      (placement) =>
        getPathwayPlacementKey(
          placement.learnerId,
          placement.subjectKey,
          placement.strandKey,
        ) !== key,
    ),
    nextPlacement,
  ];

  window.localStorage.setItem(
    PATHWAY_PLACEMENT_STORAGE_KEY,
    JSON.stringify(nextPlacements),
  );

  return nextPlacement;
}
