import { describe, expect, it } from "vitest";
import {
  FREE_FAMILY_LEARNER_LIMIT,
  FREE_FAMILY_LEARNER_LIMIT_MESSAGE,
  FREE_FAMILY_PORTFOLIO_STORAGE_BYTES,
  FREE_PORTFOLIO_STORAGE_FULL_MESSAGE,
  FREE_PORTFOLIO_STORAGE_NEAR_LIMIT_MESSAGE,
  getFreeLearnerLimitState,
  getFreePortfolioStoragePresentation,
  wouldExceedFreePortfolioStorageAllowance,
  type FreePortfolioStorageUsage,
} from "@/lib/clean/entitlements/freeGuardrails";

function usage(overrides: Partial<FreePortfolioStorageUsage>): FreePortfolioStorageUsage {
  return {
    familyId: "family-1",
    academicYearId: "year-2026",
    allowanceBytes: FREE_FAMILY_PORTFOLIO_STORAGE_BYTES,
    usedBytes: 0,
    reservedBytes: 0,
    remainingBytes: FREE_FAMILY_PORTFOLIO_STORAGE_BYTES,
    ...overrides,
  };
}

describe("MyLearna Free V1 guardrails", () => {
  it.each([
    [0, true],
    [1, true],
    [2, true],
  ])("allows adding a learner when the family has %i learners", (learnerCount, expected) => {
    expect(getFreeLearnerLimitState(learnerCount).canAddLearner).toBe(expected);
  });

  it("blocks a fourth learner while preserving existing learner counts", () => {
    expect(getFreeLearnerLimitState(3)).toEqual({
      learnerCount: 3,
      limit: FREE_FAMILY_LEARNER_LIMIT,
      canAddLearner: false,
      message: FREE_FAMILY_LEARNER_LIMIT_MESSAGE,
    });

    expect(getFreeLearnerLimitState(5)).toMatchObject({
      learnerCount: 5,
      canAddLearner: false,
      message: FREE_FAMILY_LEARNER_LIMIT_MESSAGE,
    });
  });

  it("stays quiet below 70 percent storage usage", () => {
    expect(
      getFreePortfolioStoragePresentation(
        usage({
          usedBytes: 160 * 1024 * 1024,
          remainingBytes: 90 * 1024 * 1024,
        }),
      ),
    ).toEqual({ level: "none", message: null });
  });

  it("shows restrained usage at 70 percent storage usage", () => {
    expect(
      getFreePortfolioStoragePresentation(
        usage({
          usedBytes: 176 * 1024 * 1024,
          remainingBytes: 74 * 1024 * 1024,
        }),
      ),
    ).toEqual({
      level: "usage",
      message: "Portfolio storage: 176 MB of 250 MB used this learning year.",
    });
  });

  it("shows the near-limit message at 90 percent storage usage", () => {
    expect(
      getFreePortfolioStoragePresentation(
        usage({
          usedBytes: 225 * 1024 * 1024,
          remainingBytes: 25 * 1024 * 1024,
        }),
      ),
    ).toEqual({
      level: "near-limit",
      message: FREE_PORTFOLIO_STORAGE_NEAR_LIMIT_MESSAGE,
    });
  });

  it("shows the full message at or above the allowance", () => {
    expect(
      getFreePortfolioStoragePresentation(
        usage({
          usedBytes: 250 * 1024 * 1024,
          remainingBytes: 0,
        }),
      ),
    ).toEqual({
      level: "full",
      message: FREE_PORTFOLIO_STORAGE_FULL_MESSAGE,
    });
  });

  it("allows uploads under and exactly to the remaining allowance", () => {
    const currentUsage = usage({
      usedBytes: 240 * 1024 * 1024,
      remainingBytes: 10 * 1024 * 1024,
    });

    expect(wouldExceedFreePortfolioStorageAllowance(currentUsage, 1)).toBe(false);
    expect(wouldExceedFreePortfolioStorageAllowance(currentUsage, 10 * 1024 * 1024)).toBe(false);
  });

  it("rejects an incoming upload that exceeds remaining allowance", () => {
    expect(
      wouldExceedFreePortfolioStorageAllowance(
        usage({
          usedBytes: 249 * 1024 * 1024,
          remainingBytes: 1 * 1024 * 1024,
        }),
        2 * 1024 * 1024,
      ),
    ).toBe(true);
  });
});
