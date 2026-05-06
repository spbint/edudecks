import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  getCurrentCleanUserId,
  isCleanSchemaMissingError,
  loadCleanFamilyProfile,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { listCleanLearners } from "@/lib/clean/learners/client";
import type { CleanWorkspaceState } from "@/lib/clean/workspace/types";

export async function loadCleanWorkspace(): Promise<CleanWorkspaceState> {
  try {
    const familyState = await loadCleanFamilyProfile();

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

    const learners = await listCleanLearners(familyState.profile.id);

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
    const currentUserId = await getCurrentCleanUserId().catch(() => null);

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
