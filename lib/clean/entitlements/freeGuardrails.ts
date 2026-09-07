export const LEARNER_ABUSE_CEILING_LIMIT = 20;
export const LEARNER_ABUSE_CEILING_MESSAGE =
  "We couldn't add another learner to this family. Please contact MyLearna support if you need help.";
export const FREE_FAMILY_PORTFOLIO_STORAGE_BYTES = 250 * 1024 * 1024;
export const FREE_PORTFOLIO_STORAGE_FULL_MESSAGE =
  "Your Portfolio storage is full for this learning year. Everything you've already captured is safe. You can continue using MyLearna and adding text learning records.";
export const FREE_PORTFOLIO_STORAGE_NEAR_LIMIT_MESSAGE =
  "Your Portfolio is nearly at this year's storage allowance.";
export const PLATFORM_RATE_LIMIT_MESSAGE =
  "That's a lot of activity at once. Please wait a moment and try again.";
export const NEW_FAMILY_ACTIVATION_PAUSED_MESSAGE =
  "MyLearna is temporarily pausing new family setup. Please try again shortly.";
export const MEDIA_UPLOADS_PAUSED_MESSAGE =
  "Media uploads are temporarily unavailable. You can still save a text learning record and use the rest of MyLearna.";

export type PlatformRuntimeControlKey =
  | "new_family_activation"
  | "evidence_media_uploads";

export type PlatformRuntimeControlState = {
  controlKey: PlatformRuntimeControlKey;
  isEnabled: boolean;
  reasonCode: string | null;
};

export type LearnerAbuseCeilingState = {
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

export function getLearnerAbuseCeilingState(learnerCount: number): LearnerAbuseCeilingState {
  const normalizedCount = Math.max(0, Math.floor(Number(learnerCount) || 0));
  const canAddLearner = normalizedCount < LEARNER_ABUSE_CEILING_LIMIT;

  return {
    learnerCount: normalizedCount,
    limit: LEARNER_ABUSE_CEILING_LIMIT,
    canAddLearner,
    message: canAddLearner ? null : LEARNER_ABUSE_CEILING_MESSAGE,
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

export function normalizePlatformGuardrailMessage(error: unknown, fallback: string) {
  const message = String((error as { message?: unknown })?.message ?? fallback).trim();
  if (/temporarily pausing new family setup/i.test(message)) {
    return NEW_FAMILY_ACTIVATION_PAUSED_MESSAGE;
  }
  if (/media uploads are temporarily unavailable/i.test(message)) {
    return MEDIA_UPLOADS_PAUSED_MESSAGE;
  }
  if (/lot of activity at once|rate limit|too many requests/i.test(message)) {
    return PLATFORM_RATE_LIMIT_MESSAGE;
  }
  return message || fallback;
}
