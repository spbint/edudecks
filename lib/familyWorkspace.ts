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
  connectedAt?: string | null;
};

export type FamilyWorkspaceState = {
  profile: FamilyProfileRow;
  learners: FamilyLearner[];
  userId: string | null;
  storageMode: "database" | "local";
};

type LearnerIdentity = {
  id: string;
};

type QueryResponse<T> = {
  data: T | null;
  error: { message?: string | null } | null;
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isMissingColumnError(error: unknown) {
  const message = String(
    (error as { message?: unknown })?.message ?? "",
  ).toLowerCase();
  return message.includes("does not exist") && message.includes("column");
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

function buildYearLabel(yearLevel: string | number | null | undefined) {
  const clean = safe(yearLevel);
  return clean ? `Year ${clean}` : "";
}

function parseYearLevel(yearLabel: string | number | null | undefined) {
  const clean = safe(yearLabel).replace(/^Year\s+/i, "");
  const numeric = Number(clean);
  return Number.isFinite(numeric) ? numeric : null;
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

export function persistLearnersToLocalCache(learners: FamilyLearner[]) {
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
          connectedAt: learner.connectedAt ?? null,
        })),
      ),
    );
  } catch {
    // ignore local cache failures
  }

  dispatchFamilyWorkspaceEvent({ learners });
}

export function loadLearnersFromLocalCache(): FamilyLearner[] {
  return loadChildrenFromLocalStorage().map((child) => ({
    id: child.id,
    label: child.label,
    yearLabel:
      safe((child as { yearLabel?: string | null }).yearLabel) ||
      buildYearLabel(
        (child as { year_level?: string | number | null }).year_level,
      ),
    year_level: parseYearLevel(
      (child as { year_level?: string | number | null }).year_level,
    ),
    connectedAt:
      safe((child as { connectedAt?: string | null }).connectedAt) || null,
  }));
}

export async function getCurrentFamilyUserId(): Promise<string | null> {
  return getCurrentUserId();
}

export async function loadLinkedLearners(
  userId: string,
): Promise<FamilyLearner[]> {
  const linksResponse = (await withTimeout(
    supabase
      .from("parent_student_links")
      .select("student_id,created_at,sort_order")
      .eq("parent_user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    "load learner links",
  )) as QueryResponse<
    Array<{
      student_id?: string | null;
      created_at?: string | null;
      sort_order?: number | null;
    }>
  >;

  const links = linksResponse.data ?? [];
  const linksError = linksResponse.error;

  if (linksError) {
    throw linksError;
  }

  if (!links.length) return [];

  const orderedIds = Array.from(
    new Set(links.map((link) => safe(link.student_id)).filter(Boolean)),
  );

  if (!orderedIds.length) return [];

  const studentSelectVariants = [
    "id,preferred_name,first_name,surname,family_name,year_level",
    "id,preferred_name,first_name,surname,year_level",
    "id,preferred_name,first_name,family_name,year_level",
    "id,preferred_name,first_name,year_level",
  ];

  let students: Array<Record<string, unknown>> = [];
  let lastStudentsError: unknown = null;

  for (const select of studentSelectVariants) {
    const response = (await withTimeout(
      supabase.from("students").select(select).in("id", orderedIds),
      "load students",
    )) as QueryResponse<Array<Record<string, unknown>>>;

    if (!response.error) {
      students = response.data ?? [];
      lastStudentsError = null;
      break;
    }

    lastStudentsError = response.error;

    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  if (lastStudentsError) {
    throw lastStudentsError;
  }

  const studentMap = new Map(
    (students ?? []).map((student) => [student.id, student]),
  );

  const learners = orderedIds.map((id) => {
    const student = studentMap.get(id);
    if (!student) return null;

    const label =
      safe(student.preferred_name) ||
      [safe(student.first_name), safe(student.surname), safe(student.family_name)]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "Unnamed learner";

    const yearLabel = Number.isFinite(Number(student.year_level))
      ? `Year ${student.year_level}`
      : "";

    const linkRow = links.find((row) => safe(row.student_id) === id);

    return {
      id,
      label,
      yearLabel,
      year_level: Number.isFinite(Number(student.year_level))
        ? Number(student.year_level)
        : null,
      connectedAt: linkRow?.created_at ?? null,
    } satisfies FamilyLearner;
  });

  return learners.filter(Boolean) as FamilyLearner[];
}

export async function loadFamilyWorkspace(): Promise<FamilyWorkspaceState> {
  const localSnapshot = buildLocalFamilyWorkspaceSnapshot();
  const localLearners = localSnapshot.learners;
  const localProfile = localSnapshot.profile;

  const userId = await getCurrentFamilyUserId();

  if (!userId || !hasSupabaseEnv) {
    return localSnapshot;
  }

  try {
    const [profile, dbLearners] = await withTimeout(
      Promise.all([
        loadFamilyProfile().catch(() => localProfile) as Promise<FamilyProfileRow>,
        loadLinkedLearners(userId).catch((error) => {
          console.error("loadLinkedLearners fallback", error);
          return localLearners;
        }),
      ]),
      "load family workspace",
    );

    const learners = mergeLearners(dbLearners, localLearners);

    const mergedProfile: FamilyProfileRow = {
      ...localProfile,
      ...profile,
      default_child_id:
        profile.default_child_id ||
        localProfile.default_child_id ||
        learners[0]?.id ||
        null,
    };

    persistSettingsToLocalStorage(mergedProfile);
    persistLearnersToLocalCache(learners);

    return {
      profile: mergedProfile,
      learners,
      userId,
      storageMode:
        learners.some((learner) => learner.id.startsWith("local-")) ||
        dbLearners.length === 0
          ? "local"
          : "database",
    };
  } catch (error) {
    console.error("loadFamilyWorkspace fallback", error);
    return {
      ...localSnapshot,
      userId,
    };
  }
}

export async function saveFamilyWorkspaceSettings(
  settings: FamilySettings,
): Promise<FamilyProfileRow> {
  const startedAt = Date.now();
  console.info("saveFamilyWorkspaceSettings payload", settings);
  persistSettingsToLocalStorage(settings);

  try {
    console.info("saveFamilyWorkspaceSettings before DB call", {
      startedAt: new Date(startedAt).toISOString(),
    });

    const saved = await upsertFamilyProfile(settings);

    console.info("saveFamilyWorkspaceSettings after DB call", {
      durationMs: Date.now() - startedAt,
      saved,
    });

    persistSettingsToLocalStorage(saved);
    dispatchFamilyWorkspaceEvent();
    return saved;
  } catch (error) {
    console.error("saveFamilyWorkspaceSettings failed", {
      durationMs: Date.now() - startedAt,
      error,
      settings,
    });
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
): Promise<string> {
  const cleanName = safe(learnerName);
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || cleanName;
  const surname = parts.slice(1).join(" ") || null;
  const numericYear = Number(safe(yearLevel));

  const studentPayloadVariants: Array<Record<string, unknown>> = [
    {
      user_id: userId,
      first_name: firstName,
      preferred_name: firstName,
      surname,
      year_level: Number.isFinite(numericYear) ? numericYear : null,
      class_id: null,
      is_ilp: false,
    },
    {
      user_id: userId,
      first_name: firstName,
      preferred_name: firstName,
      family_name: surname,
      year_level: Number.isFinite(numericYear) ? numericYear : null,
      class_id: null,
      is_ilp: false,
    },
    {
      user_id: userId,
      first_name: firstName,
      preferred_name: firstName,
      year_level: Number.isFinite(numericYear) ? numericYear : null,
      class_id: null,
      is_ilp: false,
    },
    {
      user_id: userId,
      first_name: firstName,
      preferred_name: firstName,
      year_level: Number.isFinite(numericYear) ? numericYear : null,
    },
    {
      first_name: firstName,
      preferred_name: firstName,
      surname,
      year_level: Number.isFinite(numericYear) ? numericYear : null,
    },
  ];

  let studentId = "";
  let lastInsertError: unknown = null;

  for (const payload of studentPayloadVariants) {
    const response = (await withTimeout(
      supabase.from("students").insert(payload).select("id").single(),
      "create student",
    )) as QueryResponse<{ id?: string | number | null }>;

    if (!response.error && response.data?.id) {
      studentId = String(response.data.id);
      lastInsertError = null;
      break;
    }

    lastInsertError = response.error;

    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  if (!studentId) {
    throw lastInsertError ?? new Error("Could not create learner record.");
  }

  const linkInsert = (await withTimeout(
    supabase.from("parent_student_links").upsert(
      {
        parent_user_id: userId,
        student_id: studentId,
        relationship_label: "child",
        sort_order: 0,
      },
      { onConflict: "parent_user_id,student_id" },
    ),
    "link learner",
  )) as QueryResponse<unknown>;

  if (linkInsert.error) {
    throw linkInsert.error;
  }

  dispatchFamilyWorkspaceEvent({ childId: studentId });
  return studentId;
}

export async function updateLinkedLearner(
  userId: string,
  learnerId: string,
  learnerName: string,
  yearLevel: string,
) {
  const cleanName = safe(learnerName);
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || cleanName;
  const surname = parts.slice(1).join(" ") || null;
  const numericYear = Number(safe(yearLevel));

  const linkCheck = (await withTimeout(
    supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_user_id", userId)
      .eq("student_id", learnerId)
      .limit(1)
      .maybeSingle(),
    "validate linked learner",
  )) as QueryResponse<{ student_id?: string | null }>;

  if (linkCheck.error) {
    throw linkCheck.error;
  }

  if (!safe(linkCheck.data?.student_id)) {
    throw new Error("This learner is not linked to the current family workspace.");
  }

  const basePayload: Record<string, unknown> = {
    first_name: firstName,
    preferred_name: firstName,
    year_level: Number.isFinite(numericYear) ? numericYear : null,
  };

  const payloadVariants: Array<Record<string, unknown>> = [
    { ...basePayload, surname },
    { ...basePayload, family_name: surname },
    basePayload,
  ];

  let lastUpdateError: unknown = null;

  for (const payload of payloadVariants) {
    const response = (await withTimeout(
      supabase.from("students").update(payload).eq("id", learnerId),
      "update learner",
    )) as QueryResponse<unknown>;

    if (!response.error) {
      dispatchFamilyWorkspaceEvent({ childId: learnerId });
      return;
    }

    lastUpdateError = response.error;

    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastUpdateError ?? new Error("Could not update learner record.");
}

export async function removeLinkedLearner(userId: string, learnerId: string) {
  const res = (await withTimeout(
    supabase
      .from("parent_student_links")
      .delete()
      .eq("parent_user_id", userId)
      .eq("student_id", learnerId),
    "remove linked learner",
  )) as QueryResponse<unknown>;

  if (res.error) {
    throw res.error;
  }

  dispatchFamilyWorkspaceEvent({ childId: learnerId });
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
