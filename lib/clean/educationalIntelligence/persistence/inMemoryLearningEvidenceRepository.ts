import {
  stableCanonicalJson,
  validateCanonicalLearningEvidenceSave,
  type LearningEvidencePersistenceRepository,
  type PersistedLearningEvidenceAttempt,
  type PersistedLearningEvidenceResult,
  type SaveCanonicalLearningEvidenceInput,
} from "./learningEvidencePersistence";

type Ownership = Readonly<Record<string, readonly string[]>>;

function cloneAttempt(value: PersistedLearningEvidenceAttempt) {
  return structuredClone(value);
}

function cloneResult(value: PersistedLearningEvidenceResult) {
  return structuredClone(value);
}

function attemptIdentity(input: SaveCanonicalLearningEvidenceInput) {
  return [
    input.familyId,
    input.learnerId,
    input.attempt.assessmentId,
    input.attempt.assessmentVersion,
    input.attempt.attemptId,
    input.attempt.resultSchemaVersion,
  ].join("::");
}

export function createInMemoryLearningEvidenceRepository(input: {
  familyLearners: Ownership;
  now?: () => string;
}): LearningEvidencePersistenceRepository {
  const now = input.now ?? (() => new Date().toISOString());
  const attempts = new Map<
    string,
    { value: PersistedLearningEvidenceAttempt; canonical: string }
  >();
  const results = new Map<
    string,
    { value: PersistedLearningEvidenceResult; canonical: string }
  >();

  function owns(familyId: string, learnerId: string) {
    return input.familyLearners[familyId]?.includes(learnerId) === true;
  }

  function requireOwnership(familyId: string, learnerId: string) {
    if (!owns(familyId, learnerId)) {
      throw new Error("Learner does not belong to this family.");
    }
  }

  return {
    async saveCanonicalResults(rawInput) {
      const save = validateCanonicalLearningEvidenceSave(rawInput);
      requireOwnership(save.familyId, save.learnerId);
      const identity = attemptIdentity(save);
      const canonicalAttempt = stableCanonicalJson(save.attempt);
      const existing = attempts.get(identity);

      if (existing) {
        if (existing.canonical !== canonicalAttempt) {
          throw new Error(
            "Canonical attempt identity conflicts with different educational content.",
          );
        }
        const savedResults = [...results.values()]
          .map((entry) => entry.value)
          .filter((result) => result.attemptStorageId === existing.value.storageId)
          .sort((left, right) =>
            left.result.construct.continuumId.localeCompare(
              right.result.construct.continuumId,
            ),
          );
        if (savedResults.length !== save.results.length) {
          throw new Error("Existing canonical attempt has an incomplete result set.");
        }
        for (const result of save.results) {
          const stored = results.get(`${save.familyId}::${result.id}`);
          if (!stored || stored.canonical !== stableCanonicalJson(result)) {
            throw new Error(
              "Canonical result identity conflicts with different educational content.",
            );
          }
        }
        return {
          attempt: cloneAttempt(existing.value),
          results: savedResults.map(cloneResult),
          reused: true,
        };
      }

      // Validate every identity before mutating either map. This mirrors the
      // database function's single transaction and prevents partial profiles.
      for (const result of save.results) {
        const key = `${save.familyId}::${result.id}`;
        const stored = results.get(key);
        if (stored && stored.canonical !== stableCanonicalJson(result)) {
          throw new Error(
            "Canonical result identity conflicts with different educational content.",
          );
        }
      }

      const createdAt = now();
      const persistedAttempt: PersistedLearningEvidenceAttempt = {
        ...structuredClone(save.attempt),
        storageId: `attempt-storage-${attempts.size + 1}`,
        familyId: save.familyId,
        learnerId: save.learnerId,
        createdByUserId: save.actorUserId,
        createdAt,
      };
      const persistedResults = save.results.map(
        (result, index): PersistedLearningEvidenceResult => ({
          storageId: `result-storage-${results.size + index + 1}`,
          attemptStorageId: persistedAttempt.storageId,
          familyId: save.familyId,
          learnerId: save.learnerId,
          result: structuredClone(result),
          review: {
            reviewState: "not-reviewed",
            confirmationState: "not-confirmed",
            portfolioInclusion: "not-decided",
            humanNoteReference: null,
          },
          createdAt,
        }),
      );

      attempts.set(identity, {
        value: persistedAttempt,
        canonical: canonicalAttempt,
      });
      persistedResults.forEach((result) => {
        results.set(`${save.familyId}::${result.result.id}`, {
          value: result,
          canonical: stableCanonicalJson(result.result),
        });
      });

      return {
        attempt: cloneAttempt(persistedAttempt),
        results: persistedResults.map(cloneResult),
        reused: false,
      };
    },

    async loadResult(query) {
      requireOwnership(query.familyId, query.learnerId);
      const value = results.get(`${query.familyId}::${query.resultId}`)?.value;
      if (!value || value.learnerId !== query.learnerId) return null;
      return cloneResult(value);
    },

    async listLearnerResultHistory(query) {
      requireOwnership(query.familyId, query.learnerId);
      return [...results.values()]
        .map((entry) => entry.value)
        .filter(
          (result) =>
            result.familyId === query.familyId &&
            result.learnerId === query.learnerId,
        )
        .sort(
          (left, right) =>
            Date.parse(left.result.evaluatedAt) - Date.parse(right.result.evaluatedAt),
        )
        .map(cloneResult);
    },

    async listLearnerAssessmentResults(query) {
      const history = await this.listLearnerResultHistory(query);
      return history.filter(
        ({ result }) =>
          result.product.moduleId === query.moduleId &&
          result.assessment.assessmentId === query.assessmentId,
      );
    },

    async listAttemptsChronologically(query) {
      requireOwnership(query.familyId, query.learnerId);
      return [...attempts.values()]
        .map((entry) => entry.value)
        .filter(
          (attempt) =>
            attempt.familyId === query.familyId &&
            attempt.learnerId === query.learnerId,
        )
        .sort(
          (left, right) =>
            Date.parse(left.evaluatedAt) - Date.parse(right.evaluatedAt),
        )
        .map(cloneAttempt);
    },
  };
}
