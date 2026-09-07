export const FREE_FAMILY_LEARNER_LIMIT = 3;
export const FREE_FAMILY_PORTFOLIO_STORAGE_BYTES = 250 * 1024 * 1024;
export const FREE_FAMILY_LEARNER_LIMIT_MESSAGE =
  "MyLearna Free supports up to 3 learners per family.";
export const FREE_PORTFOLIO_STORAGE_FULL_MESSAGE =
  "Your Portfolio storage is full for this learning year. Everything you've already captured is safe. You can continue using MyLearna and adding text learning records.";
export const FREE_PORTFOLIO_STORAGE_NEAR_LIMIT_MESSAGE =
  "Your Portfolio is nearly at this year's storage allowance.";

export type FreeLearnerLimitState = {
  learnerCount: number;
  limit: number;
  canAddLearner: boolean;
  message: string | null;
};

export type FreePortfolioStorageUsage = {
  familyId: string;
  academicYearId: string | null;
  allowanceBytes: number;
  usedBytes: number;
  reservedBytes: number;
  remainingBytes: number;
};

export type FreePortfolioStoragePresentation = {
  level: "none" | "usage" | "near-limit" | "full";
  message: string | null;
};

export function getFreeLearnerLimitState(learnerCount: number): FreeLearnerLimitState {
  const normalizedCount = Math.max(0, Math.floor(Number(learnerCount) || 0));
  const canAddLearner = normalizedCount < FREE_FAMILY_LEARNER_LIMIT;

  return {
    learnerCount: normalizedCount,
    limit: FREE_FAMILY_LEARNER_LIMIT,
    canAddLearner,
    message: canAddLearner ? null : FREE_FAMILY_LEARNER_LIMIT_MESSAGE,
  };
}

export function bytesToWholeMb(bytes: number) {
  return Math.round(Math.max(0, bytes) / (1024 * 1024));
}

export function getFreePortfolioStoragePresentation(
  usage: FreePortfolioStorageUsage | null,
): FreePortfolioStoragePresentation {
  if (!usage) return { level: "none", message: null };

  const allowanceBytes = Math.max(1, usage.allowanceBytes);
  const usedBytes = Math.max(0, usage.usedBytes + usage.reservedBytes);
  const ratio = usedBytes / allowanceBytes;

  if (usage.remainingBytes <= 0 || ratio >= 1) {
    return {
      level: "full",
      message: FREE_PORTFOLIO_STORAGE_FULL_MESSAGE,
    };
  }

  if (ratio >= 0.9) {
    return {
      level: "near-limit",
      message: FREE_PORTFOLIO_STORAGE_NEAR_LIMIT_MESSAGE,
    };
  }

  if (ratio >= 0.7) {
    return {
      level: "usage",
      message: `Portfolio storage: ${bytesToWholeMb(usedBytes)} MB of ${bytesToWholeMb(
        allowanceBytes,
      )} MB used this learning year.`,
    };
  }

  return { level: "none", message: null };
}

export function wouldExceedFreePortfolioStorageAllowance(
  usage: FreePortfolioStorageUsage,
  incomingBytes: number,
) {
  return Math.max(0, incomingBytes) > Math.max(0, usage.remainingBytes);
}
