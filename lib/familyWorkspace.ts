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
import { isMissingLearnerColumnError } from "@/lib/familyLearners";
import {
  familyYearLevelLabelFromStored,
  familyYearLevelToStoredNumber,
} from "@/lib/familyLearnerYearLevel";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

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
  family_profile_child_id?: string | null;
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
  family_profile_child_id?: string | null;
};

type FamilyProfileChildLinkRow = {
  id: string;
  family_profile_id?: string | null;
  child_id?: string | null;
  created_at?: string | null;
};

type StudentRow = {
  id: string;
  user_id?: string | null;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  last_name?: string | null;
  year_level?: number | string | null;
  created_at?: string | null;
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isDatabaseFamilyProfileId(value: unknown) {
  const id = safe(value);
  return !!id && id !== "local" && !id.startsWith("local-");
}

function looksLikeUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    safe(value),
  );
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
    map.set(learner.id, {
      ...(map.get(learner.id) ?? {}),
      ...learner,
    });
  }

  for (const learner of primary) {
    map.set(learner.id, {
      ...(map.get(learner.id) ?? {}),
      ...learner,
    });
  }

  return Array.from(map.values());
}

function learnerMatchesCandidate(
  learner: LearnerIdentity,
  candidate: string | null | undefined,
) {
  const clean = safe(candidate);
  if (!clean) return false;
  return (
    learner.id === clean ||
    safe(learner.family_profile_child_id) === clean
  );
}

function resolveWorkspaceDefaultLearnerId(
  learners: LearnerIdentity[],
  ...candidates: Array<string | null | undefined>
) {
  for (const candidate of candidates) {
    const clean = safe(candidate);
    const matchedLearner = clean
      ? learners.find((learner) => learnerMatchesCandidate(learner, clean)) ?? null
      : null;
    if (matchedLearner) {
      return matchedLearner.id;
    }
  }

  return learners[0]?.id || null;
}

function splitLearnerName(value: string) {
  const parts = safe(value).split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "Learner";
  const surname = parts.join(" ").trim() || null;
  return {
    firstName,
    preferredName: firstName,
    surname,
    lastName: surname,
  };
}

function normalizeStudentLabel(student: StudentRow) {
  const preferred = safe(student.preferred_name);
  const firstName = safe(student.first_name);
  const surname = safe(student.surname || student.last_name);
  const name = [preferred || firstName, surname].filter(Boolean).join(" ").trim();
  return name || preferred || firstName || "Learner";
}

async function ensureDatabaseFamilyProfile(userId: string) {
  let profile = await withTimeout(loadFamilyProfile(), "load family profile");

  if (!isDatabaseFamilyProfileId(profile.id)) {
    profile = await withTimeout(
      upsertFamilyProfile(profile),
      "create family profile",
    );
  }

  if (!isDatabaseFamilyProfileId(profile.id)) {
    throw new Error("A synced family profile is required before adding learners.");
  }

  return {
    ...profile,
    user_id: safe(profile.user_id) || userId,
    owner_user_id: safe(profile.owner_user_id) || userId,
  };
}

async function loadFamilyProfileChildLinks(familyProfileId: string) {
  const response = await supabase
    .from("family_profile_children")
    .select("id,family_profile_id,child_id,created_at")
    .eq("family_profile_id", familyProfileId)
    .order("created_at", { ascending: true });

  if (response.error) throw response.error;
  return (response.data ?? []) as FamilyProfileChildLinkRow[];
}

async function loadStudentRowsByIds(studentIds: string[]) {
  if (!studentIds.length) return [];

  const selectVariants = [
    "id,user_id,first_name,preferred_name,surname,last_name,year_level,created_at",
    "id,user_id,first_name,preferred_name,last_name,year_level,created_at",
    "id,user_id,first_name,preferred_name,year_level,created_at",
  ];

  let lastError: unknown = null;

  for (const select of selectVariants) {
    const response = await supabase
      .from("students")
      .select(select)
      .in("id", studentIds);

    if (!response.error) {
      return ((response.data ?? []) as unknown) as StudentRow[];
    }

    lastError = response.error;
    if (!isMissingLearnerColumnError(response.error)) {
      throw response.error;
    }
  }

  if (lastError) throw lastError;
  return [];
}

function mapStudentRowToLearner(
  student: StudentRow,
  link: FamilyProfileChildLinkRow | null,
): FamilyLearner {
  const yearLevel = familyYearLevelToStoredNumber(student.year_level);

  return {
    id: safe(student.id),
    label: normalizeStudentLabel(student),
    yearLabel: familyYearLevelLabelFromStored(yearLevel),
    year_level: yearLevel,
    connectedAt: safe(link?.created_at) || safe(student.created_at) || null,
    family_profile_child_id: safe(link?.id) || null,
  };
}

async function resolveFamilyProfileChildLinkId(
  familyProfileId: string,
  learnerId: string,
): Promise<string | null> {
  const cleanFamilyProfileId = safe(familyProfileId);
  const cleanLearnerId = safe(learnerId);
  if (!cleanFamilyProfileId || !cleanLearnerId) return null;

  const response = await supabase
    .from("family_profile_children")
    .select("id")
    .eq("family_profile_id", cleanFamilyProfileId)
    .eq("child_id", cleanLearnerId)
    .limit(1)
    .maybeSingle();

  if (response.error) throw response.error;
  return safe(response.data?.id) || null;
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
          family_profile_child_id: learner.family_profile_child_id ?? null,
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
      family_profile_child_id:
        safe((child as { family_profile_child_id?: string | null }).family_profile_child_id) ||
        null,
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
  const cleanFamilyProfileId = safe(familyProfileId);
  if (!cleanFamilyProfileId) return [];

  const links = await loadFamilyProfileChildLinks(cleanFamilyProfileId);
  const childIds = Array.from(
    new Set(links.map((link) => safe(link.child_id)).filter(Boolean)),
  );

  if (!childIds.length) return [];

  const students = await loadStudentRowsByIds(childIds);
  const studentById = new Map(
    students.map((student) => [safe(student.id), student] as const),
  );
  const rows: FamilyLearner[] = [];

  for (const link of links) {
    const childId = safe(link.child_id);
    const student = studentById.get(childId);
    if (!student) continue;
    rows.push(mapStudentRowToLearner(student, link));
  }

  return rows;
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
    const databaseProfileReady = isDatabaseFamilyProfileId(profile.id);
    const cachedDatabaseLearners = localLearners.filter(
      (learner) =>
        looksLikeUuid(learner.id) &&
        dbLearners.some((dbLearner) => dbLearner.id === learner.id),
    );
    const learners = databaseProfileReady
      ? mergeLearners(dbLearners, cachedDatabaseLearners)
      : mergeLearners(dbLearners, localLearners);
    const defaultChildLinkId = safe(profile.default_child_id) || null;

    const mergedProfile: FamilyProfileRow = {
      ...localProfile,
      ...profile,
      default_child_link_id: defaultChildLinkId,
      default_child_id: resolveWorkspaceDefaultLearnerId(
        learners,
        defaultChildLinkId,
        localProfile.default_child_id,
      ),
    };

    persistSettingsToLocalStorage(mergedProfile);
    persistLearnersToLocalCache(learners, { notify: false });

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
    const uiDefaultChildId = safe(settings.default_child_id) || null;
    const rawDefaultChildLinkId =
      safe(saved.default_child_id) ||
      safe(
        (settings as FamilySettings & { default_child_link_id?: string | null })
          .default_child_link_id,
      ) ||
      null;
    const normalizedSaved: FamilyProfileRow = {
      ...saved,
      default_child_link_id: rawDefaultChildLinkId,
      default_child_id: uiDefaultChildId,
    };
    persistSettingsToLocalStorage(normalizedSaved);
    dispatchFamilyWorkspaceEvent();
    return normalizedSaved;
  } catch (error) {
    throw error;
  }
}

export async function setDefaultLearner(
  profile: FamilySettings,
  learnerId: string | null,
): Promise<FamilyProfileRow> {
  const cleanLearnerId = safe(learnerId) || null;
  const familyProfileId = safe((profile as FamilyProfileRow).id);
  const defaultChildLinkId =
    cleanLearnerId && isDatabaseFamilyProfileId(familyProfileId)
      ? await resolveFamilyProfileChildLinkId(familyProfileId, cleanLearnerId)
      : null;

  if (cleanLearnerId && isDatabaseFamilyProfileId(familyProfileId) && !defaultChildLinkId) {
    throw new Error("This learner is not linked to the current family profile.");
  }

  const saved = await saveFamilyWorkspaceSettings({
    ...profile,
    default_child_id: cleanLearnerId,
    default_child_link_id: defaultChildLinkId,
  } as FamilySettings & { default_child_link_id?: string | null });

  setActiveLearnerId(cleanLearnerId);
  return {
    ...saved,
    default_child_id: cleanLearnerId,
    default_child_link_id: defaultChildLinkId,
  };
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
  const authenticatedUserId = safe(userId);
  if (!authenticatedUserId) {
    throw new Error("A signed-in user is required before adding learners.");
  }

  const profile = await ensureDatabaseFamilyProfile(authenticatedUserId);
  const yearLevelNumber = familyYearLevelToStoredNumber(yearLevel);
  const nextLabel = safe(learnerName) || "Learner";
  const existingLearners = await loadLinkedLearners(authenticatedUserId, profile.id);
  const duplicate = existingLearners.find((learner) => {
    const sameName = safe(learner.label).toLowerCase() === nextLabel.toLowerCase();
    const sameYear =
      familyYearLevelToStoredNumber(learner.year_level) === yearLevelNumber;
    return sameName && sameYear;
  });

  if (duplicate) {
    if (!safe(profile.default_child_id) && safe(duplicate.family_profile_child_id)) {
      await supabase
        .from("family_profiles")
        .update({ default_child_id: duplicate.family_profile_child_id })
        .eq("id", profile.id);
    }
    persistLearnersToLocalCache(
      mergeLearners([duplicate], loadLearnersFromLocalCache()),
    );
    dispatchFamilyWorkspaceEvent({ childId: duplicate.id });
    return duplicate;
  }

  const nameParts = splitLearnerName(nextLabel);
  const studentPayloadVariants = [
    {
      user_id: authenticatedUserId,
      first_name: nameParts.firstName,
      preferred_name: nameParts.preferredName,
      surname: nameParts.surname,
      last_name: nameParts.lastName,
      year_level: yearLevelNumber,
    },
    {
      user_id: authenticatedUserId,
      first_name: nameParts.firstName,
      preferred_name: nameParts.preferredName,
      last_name: nameParts.lastName,
      year_level: yearLevelNumber,
    },
    {
      user_id: authenticatedUserId,
      first_name: nameParts.firstName,
      preferred_name: nameParts.preferredName,
      year_level: yearLevelNumber,
    },
  ];

  let createdStudent: StudentRow | null = null;
  let lastError: unknown = null;

  for (const payload of studentPayloadVariants) {
    const response = await supabase
      .from("students")
      .insert(payload)
      .select("id,user_id,first_name,preferred_name,surname,last_name,year_level,created_at")
      .single();

    if (!response.error) {
      createdStudent = response.data as StudentRow;
      break;
    }

    lastError = response.error;
    if (!isMissingLearnerColumnError(response.error)) {
      throw response.error;
    }
  }

  if (!createdStudent) {
    throw lastError instanceof Error ? lastError : new Error("This learner could not be created.");
  }

  const linkResponse = await supabase
    .from("family_profile_children")
    .insert({
      family_profile_id: profile.id,
      child_id: createdStudent.id,
    })
    .select("id,family_profile_id,child_id,created_at")
    .single();

  if (linkResponse.error) {
    await supabase.from("students").delete().eq("id", createdStudent.id);
    throw linkResponse.error;
  }

  if (!safe(profile.default_child_id)) {
    await supabase
      .from("family_profiles")
      .update({ default_child_id: safe(linkResponse.data?.id) || null })
      .eq("id", profile.id);
  }

  const createdLearner: FamilyLearner = {
    ...mapStudentRowToLearner(
      createdStudent,
      linkResponse.data as FamilyProfileChildLinkRow,
    ),
    yearLabel: familyYearLevelLabelFromStored(yearLevelNumber),
    year_level: yearLevelNumber,
    year_band: safe(options?.yearBand) || null,
    curriculum_framework_id: safe(options?.frameworkId) || null,
    curriculum_jurisdiction_id: safe(options?.jurisdictionId) || null,
    reporting_mode: safe(options?.reportingMode) || null,
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
  const authenticatedUserId = safe(userId);
  const cleanLearnerId = safe(learnerId);
  if (!authenticatedUserId || !cleanLearnerId) {
    throw new Error("A synced learner is required before saving.");
  }

  const yearLevelNumber = familyYearLevelToStoredNumber(yearLevel);
  const nextLabel = safe(learnerName) || "Learner";
  const nameParts = splitLearnerName(nextLabel);
  const payloadVariants = [
    {
      first_name: nameParts.firstName,
      preferred_name: nameParts.preferredName,
      surname: nameParts.surname,
      last_name: nameParts.lastName,
      year_level: yearLevelNumber,
    },
    {
      first_name: nameParts.firstName,
      preferred_name: nameParts.preferredName,
      last_name: nameParts.lastName,
      year_level: yearLevelNumber,
    },
    {
      first_name: nameParts.firstName,
      preferred_name: nameParts.preferredName,
      year_level: yearLevelNumber,
    },
  ];

  let lastError: unknown = null;

  for (const payload of payloadVariants) {
    const response = await supabase
      .from("students")
      .update(payload)
      .eq("id", cleanLearnerId)
      .eq("user_id", authenticatedUserId)
      .select("id")
      .single();

    if (!response.error) {
      lastError = null;
      break;
    }

    lastError = response.error;
    if (!isMissingLearnerColumnError(response.error)) {
      throw response.error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error("This learner could not be updated.");
  }

  const nextLearners = loadLearnersFromLocalCache().map((learner) =>
    learner.id === cleanLearnerId
      ? {
          ...learner,
          label: nextLabel,
          yearLabel: familyYearLevelLabelFromStored(yearLevelNumber),
          year_level: yearLevelNumber,
          year_band:
            options?.yearBand === undefined ? learner.year_band ?? null : safe(options?.yearBand) || null,
          curriculum_framework_id:
            options?.frameworkId === undefined
              ? learner.curriculum_framework_id ?? null
              : safe(options?.frameworkId) || null,
          curriculum_jurisdiction_id:
            options?.jurisdictionId === undefined
              ? learner.curriculum_jurisdiction_id ?? null
              : safe(options?.jurisdictionId) || null,
          reporting_mode:
            options?.reportingMode === undefined
              ? learner.reporting_mode ?? null
              : safe(options?.reportingMode) || null,
        }
      : learner,
  );
  persistLearnersToLocalCache(nextLearners, { notify: false });
  dispatchFamilyWorkspaceEvent({ childId: cleanLearnerId });
}

export async function removeLinkedLearner(userId: string, learnerId: string) {
  const authenticatedUserId = safe(userId);
  const cleanLearnerId = safe(learnerId);
  if (!authenticatedUserId || !cleanLearnerId) {
    throw new Error("A synced learner is required before removing.");
  }

  const profile = await ensureDatabaseFamilyProfile(authenticatedUserId);
  const deleteLinks = await supabase
    .from("family_profile_children")
    .delete()
    .eq("family_profile_id", profile.id)
    .eq("child_id", cleanLearnerId)
    .select("id");

  if (deleteLinks.error) throw deleteLinks.error;

  persistLearnersToLocalCache(
    loadLearnersFromLocalCache().filter((learner) => learner.id !== cleanLearnerId),
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
    learners.find((learner) => learnerMatchesCandidate(learner, stored))?.id ||
    learners.find((learner) => learnerMatchesCandidate(learner, safe(profile?.default_child_id)))
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
