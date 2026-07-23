import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  getCurrentCleanUserId,
  isCleanSchemaMissingError,
  loadCleanFamilyProfile,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { listCleanLearners } from "@/lib/clean/learners/client";
import type { CleanWorkspaceState } from "@/lib/clean/workspace/types";
import type { FamilyWorkspaceState } from "@/lib/familyWorkspace";
import { beginCleanPlanningTiming } from "@/lib/clean/performance/planningTiming";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

/**
 * Converts the already authenticated legacy workspace into a safe, displayable
 * clean snapshot. It is only a warm seed; the clean tables remain authoritative
 * and refresh in the background.
 */
export function hydrateCleanWorkspaceFromFamilySnapshot(
  snapshot: FamilyWorkspaceState,
  authenticatedUserId: string | null | undefined,
): CleanWorkspaceState | null {
  const userId = safe(authenticatedUserId);
  const profileId = safe(snapshot.profile.id);
  if (
    snapshot.storageMode !== "database" ||
    !userId ||
    snapshot.userId !== userId ||
    !profileId ||
    profileId === "local"
  ) {
    return null;
  }

  return {
    currentUserId: userId,
    profile: {
      id: profileId,
      createdByUserId: safe(snapshot.profile.owner_user_id) || userId,
      displayName: safe(snapshot.profile.family_display_name) || "Family workspace",
      countryCode: safe(snapshot.profile.country) || null,
      jurisdictionCode: safe(snapshot.profile.curriculum_jurisdiction_id) || null,
      curriculumFrameworkId: safe(snapshot.profile.curriculum_framework_id) || null,
      reportingMode: safe(snapshot.profile.reporting_mode) || "family-summary",
      weekStart: safe(snapshot.profile.week_start) || "monday",
      privacyDefault: safe(snapshot.profile.evidence_privacy_default) || "family",
      exportStyle: safe(snapshot.profile.portfolio_print_style) || "calm",
      defaultLearnerId: safe(snapshot.profile.default_child_id) || null,
      createdAt: safe(snapshot.profile.created_at) || null,
      updatedAt: safe(snapshot.profile.updated_at) || null,
    },
    membership: null,
    members: [],
    learners: snapshot.learners
      .filter((learner) => safe(learner.id))
      .map((learner) => ({
        id: safe(learner.id),
        familyId: profileId,
        firstName: safe(learner.label) || "Learner",
        preferredName: null,
        surname: null,
        yearLevel: safe(learner.yearLabel) || safe(learner.year_level) || null,
        notes: null,
        createdByUserId: userId,
        createdAt: safe(learner.connectedAt) || null,
        updatedAt: safe(learner.connectedAt) || null,
      })),
    requiresFamilyCreation: false,
    schemaMissing: false,
    error: snapshot.syncIssue ?? null,
  };
}

export async function loadCleanWorkspace(
  authenticatedUserId?: string | null,
): Promise<CleanWorkspaceState> {
  const familyTiming = beginCleanPlanningTiming({
    operation: "workspace-family-context",
    criticality: "bootstrap-critical",
    gatesPage: true,
    requestKey: "workspace-family-context",
  });
  try {
    const familyState = await loadCleanFamilyProfile(authenticatedUserId);
    familyTiming("success");

    if (!familyState.currentUserId) {
      return {
        currentUserId: null,
        profile: null,
        membership: null,
        members: [],
        learners: [],
        requiresFamilyCreation: false,
        schemaMissing: false,
        error: "You need to sign in to use the clean family workspace.",
      };
    }

    if (!familyState.profile) {
      return {
        currentUserId: familyState.currentUserId,
        profile: null,
        membership: null,
        members: [],
        learners: [],
        requiresFamilyCreation: true,
        schemaMissing: false,
        error: null,
      };
    }

    const learnerTiming = beginCleanPlanningTiming({
      operation: "workspace-learners",
      criticality: "bootstrap-critical",
      gatesPage: true,
      requestKey: `workspace-learners:${familyState.profile.id}`,
    });
    let learners: Awaited<ReturnType<typeof listCleanLearners>>;
    try {
      learners = await listCleanLearners(familyState.profile.id);
      learnerTiming("success");
    } catch (error) {
      learnerTiming("error");
      throw error;
    }

    return {
      currentUserId: familyState.currentUserId,
      profile: familyState.profile,
      membership: familyState.membership,
      members: familyState.members,
      learners,
      requiresFamilyCreation: false,
      schemaMissing: false,
      error: null,
    };
  } catch (error) {
    familyTiming("error");
    const currentUserId =
      safe(authenticatedUserId) || (await getCurrentCleanUserId().catch(() => null));

    return {
      currentUserId,
      profile: null,
      membership: null,
      members: [],
      learners: [],
      requiresFamilyCreation: false,
      schemaMissing: isCleanSchemaMissingError(error),
      error: isCleanSchemaMissingError(error)
        ? CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE
        : normalizeCleanErrorMessage(
            error,
            "We could not load the clean family workspace just now.",
          ),
    };
  }
}
