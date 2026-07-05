import { assessmentFlags } from "@/lib/clean/assessments/assessmentFlags";

export type AssessmentViewer = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
  isInternal?: boolean | null;
  isAdmin?: boolean | null;
};

export type AssessmentProfile = {
  is_admin?: boolean | null;
};

// TODO: Replace these future-compatible fields with the canonical staff role/claim
// once the auth profile schema is finalized for internal MyLearna staff tooling.
export function isInternalUser(
  viewer?: AssessmentViewer | null,
  profile?: AssessmentProfile | null,
) {
  return Boolean(
    profile?.is_admin ||
      viewer?.isAdmin ||
      viewer?.isInternal ||
      viewer?.role === "admin" ||
      viewer?.role === "staff",
  );
}

export function canAccessAssessmentLab(
  viewer?: AssessmentViewer | null,
  profile?: AssessmentProfile | null,
) {
  return assessmentFlags.assessmentLabEnabledForStaff && isInternalUser(viewer, profile);
}

export function canAccessLegacyAssessments(
  viewer?: AssessmentViewer | null,
  profile?: AssessmentProfile | null,
) {
  if (assessmentFlags.customerAssessmentsEnabled) return true;
  return assessmentFlags.legacyAssessmentsVisibleToStaff && isInternalUser(viewer, profile);
}
