import { describe, expect, it } from "vitest";
import {
  LEARNER_ABUSE_CEILING_LIMIT,
  LEARNER_ABUSE_CEILING_MESSAGE,
  FREE_FAMILY_PORTFOLIO_STORAGE_BYTES,
  FREE_PORTFOLIO_STORAGE_FULL_MESSAGE,
  FREE_PORTFOLIO_STORAGE_NEAR_LIMIT_MESSAGE,
  getLearnerAbuseCeilingState,
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
    [19, true],
    [20, false],
  ])("allows adding a learner when the family has %i learners", (learnerCount, expected) => {
    expect(getLearnerAbuseCeilingState(learnerCount).canAddLearner).toBe(expected);
  });

  it("blocks an additional learner when the family already has 20 learners", () => {
    expect(getLearnerAbuseCeilingState(20)).toEqual({
      learnerCount: 20,
      limit: LEARNER_ABUSE_CEILING_LIMIT,
      canAddLearner: false,
      message: LEARNER_ABUSE_CEILING_MESSAGE,
    });
  });

  it("does not include a legacy 3-learner free-facing message", () => {
    expect(LEARNER_ABUSE_CEILING_MESSAGE).not.toContain("MyLearna Free supports up to 3 learners per family.");
  });

  it("keeps the family storage allowance fixed at 250 MB", () => {
    expect(FREE_FAMILY_PORTFOLIO_STORAGE_BYTES).toBe(262144000);
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
