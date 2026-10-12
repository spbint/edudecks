import type { LearningEvidenceResultV1 } from "./learningEvidenceResult";
import { presentLearningChange, type LearningChangePresentationV1 } from "./learningChangePresentation";
import {
  presentMathematicsLearningProfile,
  type MathematicsLearningProfilePresentationV1,
} from "./mathematicsLearningProfilePresentation";
import { projectNumberOperationsLearningChange } from "./numberOperationsLearningChange";
import { projectNumberOperationsLearningProfile } from "./numberOperationsLearningProfile";

export type MyLearnaReadOnlyIntelligence = {
  currentProfile: MathematicsLearningProfilePresentationV1 | null;
  comparison: LearningChangePresentationV1 | null;
};

function completeAttempts(results: readonly LearningEvidenceResultV1[]) {
  const attempts = new Map<string, LearningEvidenceResultV1[]>();
  for (const result of results) {
    const attemptId = result.assessment.attemptId;
    attempts.set(attemptId, [...(attempts.get(attemptId) ?? []), result]);
  }

  return [...attempts.values()]
    .flatMap((attemptResults) => {
      try {
        const profile = projectNumberOperationsLearningProfile(attemptResults);
        return [{ results: attemptResults, profile }];
      } catch {
        return [];
      }
    })
    .sort((left, right) => {
      const byDate = Date.parse(left.profile.assessedAt) - Date.parse(right.profile.assessedAt);
      return byDate || left.profile.assessment.attemptId.localeCompare(right.profile.assessment.attemptId);
    });
}

/**
 * Read-only presentation over already-canonical results. This projection never
 * scores evidence, changes history, or asks Pathways to mutate learner state.
 */
export function projectMyLearnaReadOnlyIntelligence(input: {
  results: readonly LearningEvidenceResultV1[];
  learnerDisplayName?: string | null;
}): MyLearnaReadOnlyIntelligence {
  const attempts = completeAttempts(input.results);
  const current = attempts.at(-1);
  if (!current) return { currentProfile: null, comparison: null };

  const currentProfile = presentMathematicsLearningProfile({
    profile: current.profile,
    learnerDisplayName: input.learnerDisplayName,
  });
  const previous = attempts.at(-2);
  if (!previous) return { currentProfile, comparison: null };

  try {
    return {
      currentProfile,
      comparison: presentLearningChange({
        comparison: projectNumberOperationsLearningChange({
          previousResults: previous.results,
          currentResults: current.results,
        }),
        learnerDisplayName: input.learnerDisplayName,
      }),
    };
  } catch {
    return { currentProfile, comparison: null };
  }
}
