import { supabase } from "@/lib/supabaseClient";
import type {
  CreateCleanFamilyProfileInput,
  FamilyMember,
  FamilyProfile,
  LoadCleanFamilyProfileResult,
  UpdateCleanFamilyProfileInput,
} from "@/lib/clean/family/types";

export const CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE =
  "Clean family schema is not installed yet.";

type FamilyProfileRow = {
  id: string;
  created_by_user_id: string;
  display_name: string;
  country_code?: string | null;
  jurisdiction_code?: string | null;
  curriculum_framework_id?: string | null;
  reporting_mode?: string | null;
  week_start?: string | null;
  privacy_default?: string | null;
  export_style?: string | null;
  default_learner_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type FamilyMemberRow = {
  id: string;
  family_id: string;
  user_id: string;
  role?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function toFamilyProfile(row: FamilyProfileRow): FamilyProfile {
  return {
    id: safe(row.id),
    createdByUserId: safe(row.created_by_user_id),
    displayName: safe(row.display_name),
    countryCode: normalizeNullString(row.country_code),
    jurisdictionCode: normalizeNullString(row.jurisdiction_code),
    curriculumFrameworkId: normalizeNullString(row.curriculum_framework_id),
    reportingMode: safe(row.reporting_mode) || "family-summary",
    weekStart: safe(row.week_start) || "monday",
    privacyDefault: safe(row.privacy_default) || "family",
    exportStyle: safe(row.export_style) || "calm",
    defaultLearnerId: normalizeNullString(row.default_learner_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toFamilyMember(row: FamilyMemberRow): FamilyMember {
  const role = safe(row.role) as FamilyMember["role"];
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    userId: safe(row.user_id),
    role: role === "parent" || role === "caregiver" ? role : "owner",
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function sortMembers(rows: FamilyMember[]) {
  return [...rows].sort((left, right) => {
    const leftRank = left.role === "owner" ? 0 : left.role === "parent" ? 1 : 2;
    const rightRank = right.role === "owner" ? 0 : right.role === "parent" ? 1 : 2;

    if (leftRank !== rightRank) return leftRank - rightRank;

    const leftUpdated = Date.parse(left.updatedAt || left.createdAt || "");
    const rightUpdated = Date.parse(right.updatedAt || right.createdAt || "");

    if (!Number.isNaN(leftUpdated) || !Number.isNaN(rightUpdated)) {
      if (Number.isNaN(leftUpdated)) return 1;
      if (Number.isNaN(rightUpdated)) return -1;
      if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;
    }

    return left.id.localeCompare(right.id);
  });
}

export function isCleanSchemaMissingError(error: unknown) {
  const message = String(
    (error as { message?: unknown })?.message ??
      (error as { error_description?: unknown })?.error_description ??
      "",
  ).toLowerCase();

  return (
    message.includes("relation") ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("column") ||
    message.includes("function public.is_family_member")
  );
}

export function normalizeCleanErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (isCleanSchemaMissingError(error)) return CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE;
  return String((error as { message?: unknown })?.message ?? fallback).trim();
}

function sanitizeFamilyProfileInput(
  input: CreateCleanFamilyProfileInput | UpdateCleanFamilyProfileInput,
) {
  return {
    display_name:
      "displayName" in input && input.displayName !== undefined
        ? safe(input.displayName) || null
        : undefined,
    country_code:
      "countryCode" in input ? normalizeNullString(input.countryCode) : undefined,
    jurisdiction_code:
      "jurisdictionCode" in input
        ? normalizeNullString(input.jurisdictionCode)
        : undefined,
    curriculum_framework_id:
      "curriculumFrameworkId" in input
        ? normalizeNullString(input.curriculumFrameworkId)
        : undefined,
    reporting_mode:
      "reportingMode" in input ? normalizeNullString(input.reportingMode) : undefined,
    week_start: "weekStart" in input ? normalizeNullString(input.weekStart) : undefined,
    privacy_default:
      "privacyDefault" in input ? normalizeNullString(input.privacyDefault) : undefined,
    export_style:
      "exportStyle" in input ? normalizeNullString(input.exportStyle) : undefined,
    default_learner_id:
      "defaultLearnerId" in input
        ? normalizeNullString(input.defaultLearnerId)
        : undefined,
  };
}

export async function getCurrentCleanUserId() {
  const sessionResp = await supabase.auth.getSession();
  const sessionUserId = safe(sessionResp.data.session?.user?.id);
  if (sessionUserId) return sessionUserId;

  const userResp = await supabase.auth.getUser();
  return safe(userResp.data.user?.id) || null;
}

export async function loadCleanFamilyProfile(): Promise<LoadCleanFamilyProfileResult> {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    return {
      currentUserId: null,
      profile: null,
      membership: null,
      members: [],
    };
  }

  const membershipResp = await supabase
    .from("family_members")
    .select("id,family_id,user_id,role,created_by_user_id,created_at,updated_at")
    .eq("user_id", currentUserId);

  if (membershipResp.error) {
    throw membershipResp.error;
  }

  const selfMemberships = sortMembers(
    (membershipResp.data ?? []).map((row) => toFamilyMember(row as FamilyMemberRow)),
  );

  if (!selfMemberships.length) {
    return {
      currentUserId,
      profile: null,
      membership: null,
      members: [],
    };
  }

  const familyIds = [...new Set(selfMemberships.map((member) => member.familyId))];

  const profileResp = await supabase
    .from("family_profiles")
    .select(
      "id,created_by_user_id,display_name,country_code,jurisdiction_code,curriculum_framework_id,reporting_mode,week_start,privacy_default,export_style,default_learner_id,created_at,updated_at",
    )
    .in("id", familyIds);

  if (profileResp.error) {
    throw profileResp.error;
  }

  const profiles = (profileResp.data ?? []).map((row) => toFamilyProfile(row as FamilyProfileRow));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  const selectedMembership =
    selfMemberships.find((membership) => profileById.has(membership.familyId)) ?? null;
  const selectedProfile = selectedMembership
    ? profileById.get(selectedMembership.familyId) ?? null
    : null;

  if (!selectedProfile || !selectedMembership) {
    return {
      currentUserId,
      profile: null,
      membership: null,
      members: [],
    };
  }

  const familyMembersResp = await supabase
    .from("family_members")
    .select("id,family_id,user_id,role,created_by_user_id,created_at,updated_at")
    .eq("family_id", selectedProfile.id);

  if (familyMembersResp.error) {
    throw familyMembersResp.error;
  }

  return {
    currentUserId,
    profile: selectedProfile,
    membership: selectedMembership,
    members: sortMembers(
      (familyMembersResp.data ?? []).map((row) => toFamilyMember(row as FamilyMemberRow)),
    ),
  };
}

export async function createCleanFamilyProfile(
  input: CreateCleanFamilyProfileInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before creating a family profile.");
  }

  const existing = await loadCleanFamilyProfile();
  if (existing.profile) {
    throw new Error("A clean family profile already exists for this account.");
  }

  const displayName = safe(input.displayName);
  if (!displayName) {
    throw new Error("A family display name is required.");
  }

  const profilePayload = sanitizeFamilyProfileInput({
    ...input,
    displayName,
  });

  const profileResp = await supabase
    .from("family_profiles")
    .insert({
      created_by_user_id: currentUserId,
      display_name: displayName,
      country_code: profilePayload.country_code ?? null,
      jurisdiction_code: profilePayload.jurisdiction_code ?? null,
      curriculum_framework_id: profilePayload.curriculum_framework_id ?? null,
      reporting_mode: profilePayload.reporting_mode ?? "family-summary",
      week_start: profilePayload.week_start ?? "monday",
      privacy_default: profilePayload.privacy_default ?? "family",
      export_style: profilePayload.export_style ?? "calm",
    })
    .select(
      "id,created_by_user_id,display_name,country_code,jurisdiction_code,curriculum_framework_id,reporting_mode,week_start,privacy_default,export_style,default_learner_id,created_at,updated_at",
    )
    .maybeSingle();

  if (profileResp.error || !profileResp.data) {
    throw profileResp.error ?? new Error("Unable to create the clean family profile.");
  }

  return toFamilyProfile(profileResp.data as FamilyProfileRow);
}

export async function updateCleanFamilyProfile(
  familyId: string,
  input: UpdateCleanFamilyProfileInput,
) {
  const updatePayload = sanitizeFamilyProfileInput(input);

  if (
    updatePayload.display_name !== undefined &&
    !safe(updatePayload.display_name)
  ) {
    throw new Error("Family display name cannot be blank.");
  }

  const payload = Object.fromEntries(
    Object.entries(updatePayload).filter(([, value]) => value !== undefined),
  );

  const response = await supabase
    .from("family_profiles")
    .update(payload)
    .eq("id", familyId)
    .select(
      "id,created_by_user_id,display_name,country_code,jurisdiction_code,curriculum_framework_id,reporting_mode,week_start,privacy_default,export_style,default_learner_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw response.error ?? new Error("Unable to update the clean family profile.");
  }

  return toFamilyProfile(response.data as FamilyProfileRow);
}
