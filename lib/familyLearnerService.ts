import {
  loadFamilyProfile,
  loadSettingsFromLocalStorage,
  upsertFamilyProfile,
} from "@/lib/familySettings";
import { supabase } from "@/lib/supabaseClient";

export type CanonicalLearnerInput = {
  learnerName: string;
  yearLevel?: string | number | null;
};

export type CanonicalLearnerRecord = {
  id: string;
  label: string;
  yearLabel: string;
  year_level: number | null;
  connectedAt: string | null;
};

type ValidatedLearnerInput = {
  learnerName: string;
  firstName: string;
  surname: string | null;
  yearLabel: string;
};

type StudentInsertRow = {
  id?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  year_level_label?: string | null;
  created_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  label: string,
  ms = 12000,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`${label} timed out after ${ms}ms.`));
      }, ms);
    }),
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  }) as Promise<T>;
}

function buildYearLevelLabel(yearLevel: string | number | null | undefined) {
  const clean = safe(yearLevel).replace(/^year\s+/i, "");
  if (!clean) return "";

  const numericYear = Number(clean);
  if (!Number.isFinite(numericYear) || numericYear < 0) {
    throw new Error("Year level must be a number when provided.");
  }

  return `Year ${numericYear}`;
}

function parseYearLevelNumber(yearLabel: string) {
  const clean = safe(yearLabel).replace(/^year\s+/i, "");
  if (!clean) return null;
  const numericYear = Number(clean);
  return Number.isFinite(numericYear) ? numericYear : null;
}

function validateLearnerInput(input: CanonicalLearnerInput): ValidatedLearnerInput {
  const learnerName = safe(input.learnerName);
  if (!learnerName) {
    throw new Error("Add a name before saving.");
  }

  const parts = learnerName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || learnerName;
  const surname = parts.slice(1).join(" ") || null;
  const yearLabel = buildYearLevelLabel(input.yearLevel);

  return {
    learnerName,
    firstName,
    surname,
    yearLabel,
  };
}

async function resolveFamilyProfileId(userId: string) {
  const existingProfile = await loadFamilyProfile();
  const familyProfile =
    safe(existingProfile.id) && existingProfile.id !== "local"
      ? existingProfile
      : await upsertFamilyProfile(loadSettingsFromLocalStorage());
  const familyProfileId = safe(familyProfile.id);

  if (!familyProfileId || familyProfileId === "local") {
    throw new Error("We couldn't resolve this family's profile yet.");
  }

  console.info("[learner-create] family profile resolved", {
    userId,
    familyProfileId,
  });

  return familyProfileId;
}

function toLearnerRecord(row: StudentInsertRow): CanonicalLearnerRecord {
  const label =
    safe(row.preferred_name) ||
    [safe(row.first_name), safe(row.surname)].filter(Boolean).join(" ").trim() ||
    "Unnamed learner";
  const yearLabel = safe(row.year_level_label);

  return {
    id: safe(row.id),
    label,
    yearLabel,
    year_level: parseYearLevelNumber(yearLabel),
    connectedAt: safe(row.created_at) || new Date().toISOString(),
  };
}

export async function createCanonicalFamilyLearner(
  userId: string,
  input: CanonicalLearnerInput,
) {
  console.info("[learner-create] requested", {
    userId,
  });

  const validated = validateLearnerInput(input);

  console.info("[learner-create] payload validated", {
    userId,
    hasYearLevel: Boolean(validated.yearLabel),
  });

  const familyProfileId = await resolveFamilyProfileId(userId);

  const studentPayload = {
    family_profile_id: familyProfileId,
    first_name: validated.firstName,
    preferred_name: validated.firstName,
    surname: validated.surname,
    year_level_label: validated.yearLabel || null,
  };

  console.info("[learner-create] insert attempted", {
    userId,
    familyProfileId,
  });

  const studentResponse = await withTimeout(
    supabase
      .from("students")
      .insert(studentPayload)
      .select("id,preferred_name,first_name,surname,year_level_label,created_at")
      .single(),
    "create learner",
  );

  if (studentResponse.error || !studentResponse.data) {
    console.error("[learner-create] insert failed", {
      userId,
      familyProfileId,
      message: safe(studentResponse.error?.message),
    });
    throw new Error(
      safe(studentResponse.error?.message) || "We couldn't add this learner yet.",
    );
  }

  const learner = toLearnerRecord(studentResponse.data as StudentInsertRow);

  const linkPayload = {
    family_profile_id: familyProfileId,
    user_id: userId,
    student_id: learner.id,
    relationship_role: "parent",
  };

  const linkResponse = await withTimeout(
    supabase
      .from("parent_student_links")
      .upsert(linkPayload, { onConflict: "user_id,student_id" }),
    "link learner",
  );

  if (linkResponse.error) {
    console.error("[learner-create] link failed", {
      userId,
      familyProfileId,
      learnerId: learner.id,
      message: safe(linkResponse.error.message),
    });
    throw new Error(
      safe(linkResponse.error.message) ||
        "We couldn't link this learner to the family workspace yet.",
    );
  }

  console.info("[learner-create] insert succeeded", {
    userId,
    familyProfileId,
    learnerId: learner.id,
  });

  return learner;
}

export async function updateCanonicalFamilyLearner(
  userId: string,
  learnerId: string,
  input: CanonicalLearnerInput,
) {
  const validated = validateLearnerInput(input);

  const linkCheck = await withTimeout(
    supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("user_id", userId)
      .eq("student_id", learnerId)
      .limit(1)
      .maybeSingle(),
    "validate learner link",
  );

  if (linkCheck.error) {
    throw new Error(
      safe(linkCheck.error.message) || "We couldn't validate this learner link.",
    );
  }

  if (!safe(linkCheck.data?.student_id)) {
    throw new Error("This learner is not linked to the current family workspace.");
  }

  const updateResponse = await withTimeout(
    supabase
      .from("students")
      .update({
        first_name: validated.firstName,
        preferred_name: validated.firstName,
        surname: validated.surname,
        year_level_label: validated.yearLabel || null,
      })
      .eq("id", learnerId),
    "update learner",
  );

  if (updateResponse.error) {
    throw new Error(
      safe(updateResponse.error.message) || "We couldn't update this learner yet.",
    );
  }
}

export async function removeCanonicalFamilyLearner(userId: string, learnerId: string) {
  const response = await withTimeout(
    supabase
      .from("parent_student_links")
      .delete()
      .eq("user_id", userId)
      .eq("student_id", learnerId),
    "remove learner",
  );

  if (response.error) {
    throw new Error(
      safe(response.error.message) || "We couldn't remove this learner yet.",
    );
  }
}
