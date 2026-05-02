import {
  DEFAULT_FAMILY_SETTINGS,
  getCurrentUserId,
  loadChildrenFromLocalStorage,
  loadFamilyProfile,
  loadSettingsFromLocalStorage,
  persistSettingsToLocalStorage,
  upsertFamilyProfile,
  type FamilyProfileRow,
  type FamilySettings,
} from "@/lib/familySettings";
import {
  familyYearLevelLabelFromStored,
  familyYearLevelToStoredNumber,
} from "@/lib/familyLearnerYearLevel";
import { hasSupabaseEnv } from "@/lib/supabaseClient";

export const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
export const ACTIVE_CHILD_EVENT = "edudecksActiveChildChanged";
export const FAMILY_CHILDREN_CACHE_KEY = "edudecks_children_seed_v1";
export const FAMILY_WORKSPACE_EVENT = "edudecksFamilyWorkspaceChanged";

export type FamilyLearner = {
  id: string;
  label: string;
  yearLabel?: string;
  year_level?: number | null;
  year_band?: string | null;
  curriculum_framework_id?: string | null;
  curriculum_jurisdiction_id?: string | null;
  reporting_mode?: string | null;
  connectedAt?: string | null;
};

export type FamilyWorkspaceState = {
  profile: FamilyProfileRow;
  learners: FamilyLearner[];
  userId: string | null;
  storageMode: "database" | "local";
  syncIssue?: string;
};

type LearnerIdentity = {
  id: string;
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isDatabaseFamilyProfileId(value: unknown) {
  const id = safe(value);
  return !!id && id !== "local" && !id.startsWith("local-");
}

async function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  label: string,
  ms = 8000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${ms}ms.`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function mergeLearners(
  primary: FamilyLearner[],
  secondary: FamilyLearner[],
): FamilyLearner[] {
  const map = new Map<string, FamilyLearner>();

  for (const learner of secondary) {
    map.set(learner.id, learner);
  }

  for (const learner of primary) {
    map.set(learner.id, learner);
  }

  return Array.from(map.values());
}

function resolveWorkspaceDefaultLearnerId(
  learners: LearnerIdentity[],
  ...candidates: Array<string | null | undefined>
) {
  for (const candidate of candidates) {
    const clean = safe(candidate);
    if (clean && learners.some((learner) => learner.id === clean)) {
      return clean;
    }
  }

  return learners[0]?.id || null;
}

function dispatchFamilyWorkspaceEvent(detail?: {
  childId?: string;
  learners?: FamilyLearner[];
}) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(FAMILY_WORKSPACE_EVENT, {
      detail: detail ?? {},
    }),
  );
}

export function learnerDisplayName(learner: FamilyLearner | null | undefined) {
  return safe(learner?.label) || "Learner";
}

export function buildLocalFamilyWorkspaceSnapshot(): FamilyWorkspaceState {
  const localSettings = loadSettingsFromLocalStorage();
  const localLearners = loadLearnersFromLocalCache();

  const localProfile: FamilyProfileRow = {
    id: "local",
    ...DEFAULT_FAMILY_SETTINGS,
    ...localSettings,
    default_child_id:
      localSettings.default_child_id || localLearners[0]?.id || null,
  };

  return {
    profile: localProfile,
    learners: localLearners,
    userId: null,
    storageMode: "local",
  };
}

export function persistLearnersToLocalCache(
  learners: FamilyLearner[],
  options?: { notify?: boolean },
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      FAMILY_CHILDREN_CACHE_KEY,
      JSON.stringify(
        learners.map((learner) => ({
          id: learner.id,
          name: learner.label,
          label: learner.label,
          yearLabel: learner.yearLabel || "",
          year_level: learner.year_level ?? "",
          year_band: learner.year_band ?? "",
          curriculum_framework_id: learner.curriculum_framework_id ?? "",
          curriculum_jurisdiction_id: learner.curriculum_jurisdiction_id ?? "",
          reporting_mode: learner.reporting_mode ?? "",
          connectedAt: learner.connectedAt ?? null,
        })),
      ),
    );
  } catch {
    // ignore local cache failures
  }

  if (options?.notify !== false) {
    dispatchFamilyWorkspaceEvent({ learners });
  }
}

export function loadLearnersFromLocalCache(): FamilyLearner[] {
  return loadChildrenFromLocalStorage().map((child) => {
    const yearLevel = familyYearLevelToStoredNumber(
      (child as { year_level?: string | number | null }).year_level ??
        (child as { yearLabel?: string | null }).yearLabel,
    );

    return {
      id: child.id,
      label: child.label,
      yearLabel: familyYearLevelLabelFromStored(yearLevel),
      year_level: yearLevel,
      year_band: safe((child as { year_band?: string | null }).year_band) || null,
      curriculum_framework_id:
        safe((child as { curriculum_framework_id?: string | null }).curriculum_framework_id) || null,
      curriculum_jurisdiction_id:
        safe((child as { curriculum_jurisdiction_id?: string | null }).curriculum_jurisdiction_id) || null,
      reporting_mode:
        safe((child as { reporting_mode?: string | null }).reporting_mode) || null,
      connectedAt:
        safe((child as { connectedAt?: string | null }).connectedAt) || null,
    };
  });
}

export async function getCurrentFamilyUserId(): Promise<string | null> {
  return getCurrentUserId();
}

export async function loadLinkedLearners(
  userId: string,
  familyProfileId?: string | null,
): Promise<FamilyLearner[]> {
  void userId;
  void familyProfileId;
  return [];
}

export async function loadFamilyWorkspace(): Promise<FamilyWorkspaceState> {
  const localSnapshot = buildLocalFamilyWorkspaceSnapshot();
  const localLearners = localSnapshot.learners;
  const localProfile = localSnapshot.profile;

  const userId = await getCurrentFamilyUserId();

  if (!userId || !hasSupabaseEnv) {
    return localSnapshot;
  }

  let profile = localProfile;
  let dbLearners: FamilyLearner[] = [];
  let syncIssue = "";

  try {
    profile = await withTimeout(loadFamilyProfile(), "load family profile");
    if (!isDatabaseFamilyProfileId(profile.id)) {
      profile = await withTimeout(
        upsertFamilyProfile(profile),
        "create family profile",
      );
    }
  } catch (error) {
    console.error("loadFamilyProfile fallback", error);
    syncIssue = "Family profile is using the local fallback.";
  }

  if (!isDatabaseFamilyProfileId(profile.id)) {
    syncIssue ||= "Family profile is using the local fallback.";
  } else {
    try {
      dbLearners = await withTimeout(
        loadLinkedLearners(userId, profile.id),
        "load family learners",
      );
    } catch (error) {
      console.error("loadLinkedLearners fallback", error);
      syncIssue = "Learners are using the local fallback.";
    }
  }

  try {
    const learners = mergeLearners(dbLearners, localLearners);

    const mergedProfile: FamilyProfileRow = {
      ...localProfile,
      ...profile,
      default_child_id: resolveWorkspaceDefaultLearnerId(
        learners,
        profile.default_child_id,
        localProfile.default_child_id,
      ),
    };

    persistSettingsToLocalStorage(mergedProfile);
    persistLearnersToLocalCache(learners, { notify: false });

    const databaseProfileReady = isDatabaseFamilyProfileId(mergedProfile.id);

    return {
      profile: mergedProfile,
      learners,
      userId,
      storageMode: databaseProfileReady ? "database" : "local",
      syncIssue: syncIssue || undefined,
    };
  } catch (error) {
    console.error("loadFamilyWorkspace fallback", error);
    return {
      ...localSnapshot,
      userId,
      syncIssue: "Family workspace is using the local fallback.",
    };
  }
}

export async function saveFamilyWorkspaceSettings(
  settings: FamilySettings,
): Promise<FamilyProfileRow> {
  persistSettingsToLocalStorage(settings);

  try {
    const saved = await upsertFamilyProfile(settings);
    persistSettingsToLocalStorage(saved);
    dispatchFamilyWorkspaceEvent();
    return saved;
  } catch (error) {
    throw error;
  }
}

export async function setDefaultLearner(
  profile: FamilySettings,
  learnerId: string | null,
): Promise<FamilyProfileRow> {
  const saved = await saveFamilyWorkspaceSettings({
    ...profile,
    default_child_id: learnerId,
  });

  setActiveLearnerId(learnerId);
  return saved;
}

export async function createLinkedLearner(
  userId: string,
  learnerName: string,
  yearLevel: string,
  options?: {
    yearBand?: string | null;
    frameworkId?: string | null;
    jurisdictionId?: string | null;
    reportingMode?: string | null;
  },
): Promise<FamilyLearner> {
  void userId;
  const yearLevelNumber = familyYearLevelToStoredNumber(yearLevel);
  const createdLearner: FamilyLearner = {
    id: `local-${Date.now()}`,
    label: safe(learnerName) || "Learner",
    yearLabel: familyYearLevelLabelFromStored(yearLevelNumber),
    year_level: yearLevelNumber,
    year_band: safe(options?.yearBand) || null,
    curriculum_framework_id: safe(options?.frameworkId) || null,
    curriculum_jurisdiction_id: safe(options?.jurisdictionId) || null,
    reporting_mode: safe(options?.reportingMode) || null,
    connectedAt: new Date().toISOString(),
  };

  persistLearnersToLocalCache(
    mergeLearners([createdLearner], loadLearnersFromLocalCache()),
  );
  dispatchFamilyWorkspaceEvent({ childId: createdLearner.id });
  return createdLearner;
}

export async function updateLinkedLearner(
  userId: string,
  learnerId: string,
  learnerName: string,
  yearLevel: string,
  options?: {
    yearBand?: string | null;
    frameworkId?: string | null;
    jurisdictionId?: string | null;
    reportingMode?: string | null;
  },
) {
  void userId;
  const yearLevelNumber = familyYearLevelToStoredNumber(yearLevel);
  const nextLearners = loadLearnersFromLocalCache().map((learner) =>
    learner.id === learnerId
      ? {
          ...learner,
          label: safe(learnerName) || learner.label,
          yearLabel: familyYearLevelLabelFromStored(yearLevelNumber),
          year_level: yearLevelNumber,
          year_band: safe(options?.yearBand) || null,
          curriculum_framework_id: safe(options?.frameworkId) || null,
          curriculum_jurisdiction_id: safe(options?.jurisdictionId) || null,
          reporting_mode: safe(options?.reportingMode) || null,
        }
      : learner,
  );
  persistLearnersToLocalCache(nextLearners, { notify: false });
  dispatchFamilyWorkspaceEvent({ childId: learnerId });
}

export async function removeLinkedLearner(userId: string, learnerId: string) {
  void userId;
  persistLearnersToLocalCache(
    loadLearnersFromLocalCache().filter((learner) => learner.id !== learnerId),
    { notify: false },
  );
  dispatchFamilyWorkspaceEvent();
}

export function getStoredActiveLearnerId() {
  if (typeof window === "undefined") return "";
  return safe(window.localStorage.getItem(ACTIVE_STUDENT_ID_KEY));
}

export function isValidActiveLearnerId(
  learners: LearnerIdentity[],
  learnerId: string | null | undefined,
) {
  const clean = safe(learnerId);
  return !!clean && learners.some((learner) => learner.id === clean);
}

export function setActiveLearnerId(learnerId: string | null | undefined) {
  if (typeof window === "undefined") return;

  const clean = safe(learnerId);

  if (clean) {
    window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, clean);
  } else {
    window.localStorage.removeItem(ACTIVE_STUDENT_ID_KEY);
  }

  window.dispatchEvent(
    new CustomEvent(ACTIVE_CHILD_EVENT, {
      detail: { childId: clean || undefined },
    }),
  );
}

export function resolveEffectiveActiveLearnerId(
  learners: LearnerIdentity[],
  profile?: Pick<FamilySettings, "default_child_id" | "auto_open_last_child"> | null,
) {
  const stored = getStoredActiveLearnerId();

  return (
    learners.find((learner) => learner.id === stored)?.id ||
    learners.find((learner) => learner.id === safe(profile?.default_child_id))
      ?.id ||
    learners[0]?.id ||
    ""
  );
}

export function resolveCanonicalActiveLearnerId(
  learners: LearnerIdentity[],
  profile?: Pick<FamilySettings, "default_child_id" | "auto_open_last_child"> | null,
  ...candidates: Array<string | null | undefined>
) {
  for (const candidate of candidates) {
    if (isValidActiveLearnerId(learners, candidate)) {
      return safe(candidate);
    }
  }

  return resolveEffectiveActiveLearnerId(learners, profile);
}

export function syncEffectiveActiveLearner(
  learners: FamilyLearner[],
  profile?: Pick<FamilySettings, "default_child_id" | "auto_open_last_child"> | null,
) {
  const nextId = resolveEffectiveActiveLearnerId(learners, profile);
  if (nextId) {
    setActiveLearnerId(nextId);
  }
  return nextId;
}
