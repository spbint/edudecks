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
  yearBand?: string | null;
  frameworkId?: string | null;
  jurisdictionId?: string | null;
  reportingMode?: string | null;
};

export type CanonicalLearnerRecord = {
  id: string;
  label: string;
  yearLabel: string;
  year_level: number | null;
  year_band: string | null;
  curriculum_framework_id: string | null;
  curriculum_jurisdiction_id: string | null;
  reporting_mode: string | null;
  connectedAt: string | null;
};

type ValidatedLearnerInput = {
  learnerName: string;
  firstName: string;
  surname: string | null;
  yearLevelOption: string;
  yearLevelNumber: number | null;
  yearBand: string | null;
  frameworkId: string | null;
  jurisdictionId: string | null;
  reportingMode: string | null;
};

type FamilyProfileIdRow = {
  id?: string | null;
};

type StudentRow = {
  id?: string | null;
  family_profile_id?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  year_level?: number | null;
  year_band?: string | null;
  curriculum_framework_id?: string | null;
  curriculum_jurisdiction_id?: string | null;
  reporting_mode?: string | null;
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
    if (timer) clearTimeout(timer);
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

  return {
    learnerName,
    firstName,
    surname,
    yearLevelOption,
    yearLevelNumber: familyYearLevelToStoredNumber(input.yearLevel),
    yearBand: safe(input.yearBand) || null,
    frameworkId: safe(input.frameworkId) || null,
    jurisdictionId: safe(input.jurisdictionId) || null,
    reportingMode: safe(input.reportingMode) || null,
  };
}

function toLearnerRecord(row: StudentRow): CanonicalLearnerRecord {
  const label =
    safe(row.preferred_name) ||
    [safe(row.first_name), safe(row.surname)].filter(Boolean).join(" ").trim() ||
    "Unnamed learner";
  const yearLevel = row.year_level ?? null;

  return {
    id: safe(row.id),
    label,
    yearLabel: familyYearLevelLabelFromStored(yearLevel),
    year_level: yearLevel,
    year_band: safe(row.year_band) || null,
    curriculum_framework_id: safe(row.curriculum_framework_id) || null,
    curriculum_jurisdiction_id: safe(row.curriculum_jurisdiction_id) || null,
    reporting_mode: safe(row.reporting_mode) || null,
    connectedAt: safe(row.created_at) || new Date().toISOString(),
  };
}

function buildFamilyProfileInsertPayload(userId: string) {
  return {
    user_id: userId,
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
      .eq("user_id", userId)
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

  const insertResponse = await withTimeout(
    supabase
      .from("family_profiles")
      .insert(buildFamilyProfileInsertPayload(userId))
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
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle(),
      "reload family profile id",
    );

    if (retryResponse.error) {
      throw new Error(
        safe(retryResponse.error.message) ||
          "We couldn't confirm the family workspace yet.",
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
  const validated = validateLearnerInput(input);
  const familyProfileId = await resolveCurrentFamilyProfileId(userId, {
    ensure: true,
  });

  const basePayload = {
    family_profile_id: familyProfileId,
    first_name: validated.firstName,
    preferred_name: validated.firstName,
    surname: validated.surname,
    year_level: validated.yearLevelNumber,
  };
  const selectBase =
    "id,family_profile_id,preferred_name,first_name,surname,year_level,created_at";

  const createResponse = await withTimeout(
    supabase.from("students").insert(basePayload).select(selectBase).single(),
    "create learner",
  );

  if (createResponse.error || !createResponse.data) {
    throw new Error(
      safe(createResponse.error?.message) || "We couldn't add this learner yet.",
    );
  }

  return toLearnerRecord(createResponse.data as StudentRow);
}

export async function updateCanonicalFamilyLearner(
  userId: string,
  learnerId: string,
  input: CanonicalLearnerInput,
) {
  const validated = validateLearnerInput(input);
  const familyProfileId = await resolveCurrentFamilyProfileId(userId);

  if (!familyProfileId) {
    throw new Error("We couldn't confirm the family workspace yet.");
  }

  const learnerCheck = await withTimeout(
    supabase
      .from("students")
      .select("id")
      .eq("id", learnerId)
      .eq("family_profile_id", familyProfileId)
      .limit(1)
      .maybeSingle(),
    "validate learner ownership",
  );

  if (learnerCheck.error) {
    throw new Error(
      safe(learnerCheck.error.message) ||
        "We couldn't confirm the family workspace yet.",
    );
  }

  if (!safe((learnerCheck.data as { id?: string | null } | null)?.id)) {
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
      .eq("id", learnerId)
      .eq("family_profile_id", familyProfileId),
    "update learner",
  );

  if (updateResponse.error) {
    throw new Error(
      safe(updateResponse.error.message) ||
        "We couldn't update this learner yet.",
    );
  }
}

export async function removeCanonicalFamilyLearner(
  userId: string,
  learnerId: string,
) {
  const familyProfileId = await resolveCurrentFamilyProfileId(userId);

  if (!familyProfileId) {
    throw new Error("We couldn't confirm the family workspace yet.");
  }

  const deleteResponse = await withTimeout(
    supabase
      .from("students")
      .delete()
      .eq("id", learnerId)
      .eq("family_profile_id", familyProfileId),
    "remove learner",
  );

  if (deleteResponse.error) {
    throw new Error(
      safe(deleteResponse.error.message) ||
        "We couldn't remove this learner yet.",
    );
  }
}
