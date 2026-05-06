import type { FamilyMember, FamilyProfile } from "@/lib/clean/family/types";
import type { Learner } from "@/lib/clean/learners/types";

export type CleanWorkspaceState = {
  currentUserId: string | null;
  profile: FamilyProfile | null;
  membership: FamilyMember | null;
  members: FamilyMember[];
  learners: Learner[];
  requiresFamilyCreation: boolean;
  schemaMissing: boolean;
  error: string | null;
};
