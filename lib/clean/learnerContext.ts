import type { Learner } from "@/lib/clean/learners/types";

export type LearnerContextSource =
  | "my-capture"
  | "my-pathways"
  | "worksheet"
  | "calendar"
  | "portfolio"
  | "reports"
  | "my-data"
  | "manual";

export type LearnerContextSnapshot = {
  familyId: string;
  selectedLearnerId: string | null;
  sourceLearnerId?: string | null;
  sourceFamilyId?: string | null;
  sourceType?: LearnerContextSource | null;
  sourceId?: string | null;
};

export type LearnerContextResolution = {
  learner: Learner | null;
  reason: "context" | "explicit" | "active" | "remembered" | "only" | "selection" | "invalid" | "mismatch";
  mismatch: boolean;
};

export type LearnerContextResolutionOptions = {
  learners: Learner[];
  contextualLearnerId?: string | null;
  explicitLearnerId?: string | null;
  activeLearnerId?: string | null;
  rememberedLearnerId?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function findLearner(learners: Learner[], learnerId: string | null | undefined) {
  const id = safe(learnerId);
  if (!id) return null;
  return learners.find((learner) => learner.id === id) ?? null;
}

/**
 * Resolves learner context without allowing a remembered or active learner to
 * override an authoritative route/source learner. An invalid explicit or
 * contextual id deliberately resolves to selection instead of falling back.
 */
export function resolveLearnerContext({
  learners,
  contextualLearnerId,
  explicitLearnerId,
  activeLearnerId,
  rememberedLearnerId,
}: LearnerContextResolutionOptions): LearnerContextResolution {
  const contextualId = safe(contextualLearnerId);
  const explicitId = safe(explicitLearnerId);
  const hasContextualId = Boolean(contextualId);
  const hasExplicitId = Boolean(explicitId);

  if (hasContextualId) {
    const contextualLearner = findLearner(learners, contextualId);
    if (!contextualLearner) {
      return { learner: null, reason: "invalid", mismatch: false };
    }

    if (hasExplicitId && explicitId !== contextualId) {
      return { learner: contextualLearner, reason: "mismatch", mismatch: true };
    }

    return { learner: contextualLearner, reason: "context", mismatch: false };
  }

  if (hasExplicitId) {
    const explicitLearner = findLearner(learners, explicitId);
    return explicitLearner
      ? { learner: explicitLearner, reason: "explicit", mismatch: false }
      : { learner: null, reason: "invalid", mismatch: false };
  }

  const activeLearner = findLearner(learners, activeLearnerId);
  if (activeLearner) return { learner: activeLearner, reason: "active", mismatch: false };

  const rememberedLearner = findLearner(learners, rememberedLearnerId);
  if (rememberedLearner) {
    return { learner: rememberedLearner, reason: "remembered", mismatch: false };
  }

  if (learners.length === 1) {
    return { learner: learners[0], reason: "only", mismatch: false };
  }

  return { learner: null, reason: learners.length ? "selection" : "invalid", mismatch: false };
}

export function validateLearnerContext(
  learners: Learner[],
  context: LearnerContextSnapshot,
) {
  const familyId = safe(context.familyId);
  const selectedLearnerId = safe(context.selectedLearnerId);
  const sourceLearnerId = safe(context.sourceLearnerId);
  const sourceFamilyId = safe(context.sourceFamilyId);
  const selectedLearner = findLearner(learners, selectedLearnerId);
  const sourceLearner = findLearner(learners, sourceLearnerId);
  const contextualSource = Boolean(sourceLearnerId || sourceFamilyId || context.sourceType);

  if (!familyId) {
    throw new Error("A family workspace is required before recording learning.");
  }

  if (!selectedLearnerId || !selectedLearner) {
    throw new Error("Choose the learner who completed the learning.");
  }

  if (selectedLearner.familyId !== familyId) {
    throw new Error("Choose a learner from this family to continue.");
  }

  if (sourceFamilyId && sourceFamilyId !== familyId) {
    throw new Error("This learning connection is no longer available.");
  }

  if (contextualSource && (!sourceLearnerId || !sourceLearner)) {
    throw new Error("This learning connection is no longer available.");
  }

  if (sourceLearner && sourceLearner.familyId !== familyId) {
    throw new Error("This learning connection is no longer available.");
  }

  if (sourceLearnerId && selectedLearnerId !== sourceLearnerId) {
    const learnerLabel = sourceLearner?.preferredName || sourceLearner?.firstName || "the selected learner";
    const connectionLabel = context.sourceType === "worksheet" ? "worksheet" : "pathway";
    throw new Error(
      `This completed work is connected to ${learnerLabel}'s ${connectionLabel}. To record it for another learner, remove the connection first.`,
    );
  }

  return selectedLearner;
}

export function isLearnerContextCurrent(
  learners: Learner[],
  context: LearnerContextSnapshot,
) {
  try {
    validateLearnerContext(learners, context);
    return true;
  } catch {
    return false;
  }
}
