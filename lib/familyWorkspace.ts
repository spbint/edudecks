import {
  DEFAULT_FAMILY_SETTINGS,
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

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isMissingColumnError(error: unknown) {
  const message = String((error as { message?: unknown })?.message ?? "").toLowerCase();
  return message.includes("does not exist") && message.includes("column");
}

export function learnerDisplayName(learner: FamilyLearner | null | undefined) {
  return safe(learner?.label) || "Learner";
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
          yearLabel: learner.yearLabel || "",
          year_level: learner.year_level ?? "",
        })),
      ),
    );
  } catch {
    // ignore local cache failures
  }
}

export function loadLearnersFromLocalCache(): FamilyLearner[] {
  return loadChildrenFromLocalStorage().map((child) => ({
    id: child.id,
    label: child.label,
    yearLabel:
      safe((child as { yearLabel?: string | null }).yearLabel) ||
      (safe((child as { year_level?: string | number | null }).year_level)
        ? `Year ${safe((child as { year_level?: string | number | null }).year_level)}`
        : ""),
    year_level: Number.isFinite(Number((child as { year_level?: string | number | null }).year_level))
      ? Number((child as { year_level?: string | number | null }).year_level)
      : null,
    connectedAt: null,
  }));
}

export async function getCurrentFamilyUserId(): Promise<string | null> {
  if (!hasSupabaseEnv) return null;

  const sessionResp = await supabase.auth.getSession();
  if (sessionResp.data.session?.user?.id) {
    return sessionResp.data.session.user.id;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("getCurrentFamilyUserId error", error);
    return null;
  }

  return user?.id ?? null;
}

export async function loadLinkedLearners(userId: string): Promise<FamilyLearner[]> {
  const { data: links, error: linksError } = await supabase
    .from("parent_student_links")
    .select("student_id,created_at,sort_order")
    .eq("parent_user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (linksError) {
    throw linksError;
  }

  if (!links?.length) return [];

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
    const response = await supabase.from("students").select(select).in("id", orderedIds);
    if (!response.error) {
      students = ((response.data ?? []) as unknown) as Array<Record<string, unknown>>;
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

  const studentMap = new Map((students ?? []).map((student) => [student.id, student]));

  const learners = orderedIds
    .map((id) => {
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
        year_level: Number.isFinite(Number(student.year_level)) ? Number(student.year_level) : null,
        connectedAt: linkRow?.created_at ?? null,
      } satisfies FamilyLearner;
    });

  return learners.filter(Boolean) as FamilyLearner[];
}

export async function loadFamilyWorkspace(): Promise<FamilyWorkspaceState> {
  const localSettings = loadSettingsFromLocalStorage();
  const localLearners = loadLearnersFromLocalCache();
  const localProfile = {
    ...DEFAULT_FAMILY_SETTINGS,
    ...localSettings,
    default_child_id: localSettings.default_child_id || localLearners[0]?.id || null,
  };

  const userId = await getCurrentFamilyUserId();

  if (!userId || !hasSupabaseEnv) {
    return {
      profile: {
        id: "local",
        ...localProfile,
      },
      learners: localLearners,
      userId,
      storageMode: "local",
    };
  }

  const [profile, learners] = await Promise.all([
    loadFamilyProfile(),
    loadLinkedLearners(userId),
  ]);

  const mergedProfile: FamilyProfileRow = {
    ...profile,
    default_child_id:
      profile.default_child_id || localProfile.default_child_id || learners[0]?.id || null,
  };

  persistSettingsToLocalStorage(mergedProfile);
  persistLearnersToLocalCache(learners);

  return {
    profile: mergedProfile,
    learners,
    userId,
    storageMode: "database",
  };
}

export async function saveFamilyWorkspaceSettings(
  settings: FamilySettings,
): Promise<FamilyProfileRow> {
  persistSettingsToLocalStorage(settings);
  return upsertFamilyProfile(settings);
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
    const response = await supabase.from("students").insert(payload).select("id").single();
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

  const linkInsert = await supabase.from("parent_student_links").upsert(
    {
      parent_user_id: userId,
      student_id: studentId,
      relationship_label: "child",
      sort_order: 0,
    },
    { onConflict: "parent_user_id,student_id" },
  );

  if (linkInsert.error) {
    throw linkInsert.error;
  }

  return studentId;
}

export async function removeLinkedLearner(userId: string, learnerId: string) {
  const res = await supabase
    .from("parent_student_links")
    .delete()
    .eq("parent_user_id", userId)
    .eq("student_id", learnerId);

  if (res.error) {
    throw res.error;
  }
}

export function getStoredActiveLearnerId() {
  if (typeof window === "undefined") return "";
  return safe(window.localStorage.getItem(ACTIVE_STUDENT_ID_KEY));
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
    new CustomEvent(ACTIVE_CHILD_EVENT, { detail: { childId: clean || undefined } }),
  );
}

export function resolveEffectiveActiveLearnerId(
  learners: FamilyLearner[],
  profile?: Pick<FamilySettings, "default_child_id" | "auto_open_last_child"> | null,
) {
  const stored = getStoredActiveLearnerId();

  return (
    learners.find((learner) => learner.id === stored)?.id ||
    learners.find((learner) => learner.id === safe(profile?.default_child_id))?.id ||
    learners[0]?.id ||
    ""
  );
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
