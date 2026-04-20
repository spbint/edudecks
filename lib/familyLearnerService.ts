import { supabase } from "@/lib/supabaseClient";
import {
  familyYearLevelLabelFromStored,
  familyYearLevelOptionFromStored,
  familyYearLevelToStoredNumber,
} from "@/lib/familyLearnerYearLevel";
import {
  DEFAULT_FAMILY_SETTINGS,
  type DefaultChildLanding,
  type EvidencePrivacy,
  type ExperienceMode,
  type MarketKey,
  type WeekStart,
} from "@/lib/familySettings";

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
  yearLevelOption: string;
  yearLevelNumber: number | null;
  yearLabel: string;
};

type StudentInsertRow = {
  id?: string | null;
  family_profile_id?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  year_level?: number | null;
  created_at?: string | null;
};

type FamilyProfileIdRow = {
  id?: string | null;
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

function validateLearnerInput(input: CanonicalLearnerInput): ValidatedLearnerInput {
  const learnerName = safe(input.learnerName);
  if (!learnerName) {
    throw new Error("Add a name before saving.");
  }

  const parts = learnerName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || learnerName;
  const surname = parts.slice(1).join(" ") || null;
  const rawYearLevel = safe(input.yearLevel);
  const yearLevelOption = familyYearLevelOptionFromStored(input.yearLevel);

  if (rawYearLevel && !yearLevelOption) {
    throw new Error("Choose a year level from the list before saving.");
  }

  const yearLevelNumber = familyYearLevelToStoredNumber(input.yearLevel);
  const yearLabel = familyYearLevelLabelFromStored(input.yearLevel);

  return {
    learnerName,
    firstName,
    surname,
    yearLevelOption,
    yearLevelNumber,
    yearLabel,
  };
}

function toLearnerRecord(row: StudentInsertRow): CanonicalLearnerRecord {
  const label =
    safe(row.preferred_name) ||
    [safe(row.first_name), safe(row.surname)].filter(Boolean).join(" ").trim() ||
    "Unnamed learner";
  const yearLevel = row.year_level ?? null;
  const yearLabel = familyYearLevelLabelFromStored(yearLevel);

  return {
    id: safe(row.id),
    label,
    yearLabel,
    year_level: yearLevel,
    connectedAt: safe(row.created_at) || new Date().toISOString(),
  };
}

function buildFamilyProfileInsertPayload(userId: string) {
  return {
    user_id: userId,
    owner_user_id: userId,
    family_display_name: DEFAULT_FAMILY_SETTINGS.family_display_name,
    preferred_market: DEFAULT_FAMILY_SETTINGS.preferred_market as MarketKey,
    experience_mode: DEFAULT_FAMILY_SETTINGS.experience_mode as ExperienceMode,
    default_child_id: DEFAULT_FAMILY_SETTINGS.default_child_id,
    default_child_landing:
      DEFAULT_FAMILY_SETTINGS.default_child_landing as DefaultChildLanding,
    week_start: DEFAULT_FAMILY_SETTINGS.week_start as WeekStart,
    compact_mode: DEFAULT_FAMILY_SETTINGS.compact_mode,
    show_advanced_insights: DEFAULT_FAMILY_SETTINGS.show_advanced_insights,
    show_authority_guidance: DEFAULT_FAMILY_SETTINGS.show_authority_guidance,
    auto_open_last_child: DEFAULT_FAMILY_SETTINGS.auto_open_last_child,
    evidence_privacy_default:
      DEFAULT_FAMILY_SETTINGS.evidence_privacy_default as EvidencePrivacy,
    planner_auto_carry_forward:
      DEFAULT_FAMILY_SETTINGS.planner_auto_carry_forward,
    planner_show_weekend: DEFAULT_FAMILY_SETTINGS.planner_show_weekend,
    portfolio_print_style: DEFAULT_FAMILY_SETTINGS.portfolio_print_style,
    report_tone_default: DEFAULT_FAMILY_SETTINGS.report_tone_default,
    notifications_weekly_digest:
      DEFAULT_FAMILY_SETTINGS.notifications_weekly_digest,
    notifications_readiness_alerts:
      DEFAULT_FAMILY_SETTINGS.notifications_readiness_alerts,
    notifications_planner_nudges:
      DEFAULT_FAMILY_SETTINGS.notifications_planner_nudges,
    updated_at: new Date().toISOString(),
  };
}

export async function resolveCurrentFamilyProfileId(
  userId: string,
  options?: { ensure?: boolean },
) {
  const selectResponse = await withTimeout(
    supabase
      .from("family_profiles")
      .select("id")
      .eq("owner_user_id", userId)
      .limit(1)
      .maybeSingle(),
    "load family profile id",
  );

  if (selectResponse.error) {
    throw new Error(
      safe(selectResponse.error.message) ||
        "We couldn't confirm the family workspace yet.",
    );
  }

  const existingId = safe((selectResponse.data as FamilyProfileIdRow | null)?.id);
  if (existingId) {
    return existingId;
  }

  if (!options?.ensure) {
    return null;
  }

  const insertPayload = buildFamilyProfileInsertPayload(userId);
  const insertResponse = await withTimeout(
    supabase
      .from("family_profiles")
      .insert(insertPayload)
      .select("id")
      .single(),
    "create family profile",
  );

  if (!insertResponse.error) {
    const insertedId = safe(
      (insertResponse.data as FamilyProfileIdRow | null)?.id,
    );
    if (insertedId) {
      return insertedId;
    }
  }

  const insertMessage = safe(insertResponse.error?.message).toLowerCase();
  if (insertMessage.includes("duplicate")) {
    const retryResponse = await withTimeout(
      supabase
        .from("family_profiles")
        .select("id")
        .eq("owner_user_id", userId)
        .limit(1)
        .maybeSingle(),
      "reload family profile id",
    );

    if (retryResponse.error) {
      throw new Error(
        safe(retryResponse.error.message) ||
          "We couldn't reopen the family workspace yet.",
      );
    }

    const retryId = safe((retryResponse.data as FamilyProfileIdRow | null)?.id);
    if (retryId) {
      return retryId;
    }
  }

  throw new Error(
    safe(insertResponse.error?.message) ||
      "We couldn't prepare the family workspace yet.",
  );
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
    hasYearLevel: Boolean(validated.yearLevelOption),
  });

  const familyProfileId = await resolveCurrentFamilyProfileId(userId, {
    ensure: true,
  });

  const studentPayload = {
    family_profile_id: familyProfileId,
    first_name: validated.firstName,
    preferred_name: validated.firstName,
    surname: validated.surname,
    year_level: validated.yearLevelNumber,
  };

  console.info("[learner-create] insert attempted", {
    userId,
  });

  const studentResponse = await withTimeout(
    supabase
      .from("students")
      .insert(studentPayload)
      .select(
        "id,family_profile_id,preferred_name,first_name,surname,year_level,created_at",
      )
      .single(),
    "create learner",
  );

  if (studentResponse.error || !studentResponse.data) {
    console.error("[learner-create] insert failed", {
      userId,
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
    await withTimeout(
      supabase
        .from("students")
        .delete()
        .eq("id", learner.id)
        .eq("family_profile_id", familyProfileId),
      "rollback learner insert",
    ).catch((rollbackError) => {
      console.error("[learner-create] rollback failed", {
        userId,
        learnerId: learner.id,
        rollbackError,
      });
    });

    console.error("[learner-create] link failed", {
      userId,
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
  const familyProfileId = await resolveCurrentFamilyProfileId(userId);

  if (!familyProfileId) {
    throw new Error("The family workspace is not ready for learner updates yet.");
  }

  const learnerCheck = await withTimeout(
    supabase
      .from("students")
      .select("id")
      .eq("family_profile_id", familyProfileId)
      .eq("id", learnerId)
      .limit(1)
      .maybeSingle(),
    "validate learner ownership",
  );

  if (learnerCheck.error) {
    throw new Error(
      safe(learnerCheck.error.message) ||
        "We couldn't validate this learner yet.",
    );
  }

  if (!safe(learnerCheck.data?.id)) {
    throw new Error("This learner is not part of the current family workspace.");
  }

  const updateResponse = await withTimeout(
    supabase
      .from("students")
      .update({
        first_name: validated.firstName,
        preferred_name: validated.firstName,
        surname: validated.surname,
        year_level: validated.yearLevelNumber,
      })
      .eq("family_profile_id", familyProfileId)
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
  const familyProfileId = await resolveCurrentFamilyProfileId(userId);

  if (!familyProfileId) {
    throw new Error("The family workspace is not ready for learner removal yet.");
  }

  const response = await withTimeout(
    supabase
      .from("students")
      .delete()
      .eq("family_profile_id", familyProfileId)
      .eq("id", learnerId),
    "remove learner",
  );

  if (response.error) {
    throw new Error(
      safe(response.error.message) || "We couldn't remove this learner yet.",
    );
  }
}
