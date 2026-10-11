import { describe, expect, it } from "vitest";
import { EI_V1_POLICY } from "@/lib/clean/ei/policy";

describe("EI v1 policy", () => {
  it("keeps assessment thresholds ordered and bounded", () => {
    const assessment = EI_V1_POLICY.assessment;

    expect(assessment.negativeCorrectRatioAtOrBelow).toBeGreaterThanOrEqual(0);
    expect(assessment.positiveCorrectRatioAtOrAbove).toBeLessThanOrEqual(1);
    expect(
      assessment.negativeCorrectRatioAtOrBelow,
    ).toBeLessThan(assessment.positiveCorrectRatioAtOrAbove);
  });

  it("keeps evidence-band thresholds ordered", () => {
    const policy = EI_V1_POLICY.evidenceBalance;

    expect(policy.needsAttentionUpperExclusive).toBeGreaterThanOrEqual(0);
    expect(policy.needsAttentionUpperExclusive).toBeLessThan(
      policy.mixedUpperExclusive,
    );
    expect(policy.mixedUpperExclusive).toBeLessThan(
      policy.promisingUpperExclusive,
    );
    expect(policy.promisingUpperExclusive).toBeLessThanOrEqual(1);
  });

  it("does not assign the same adult judgement to conflicting policy buckets", () => {
    const policy = EI_V1_POLICY.adultJudgement;
    const allStates = [
      ...policy.positiveHigh,
      ...policy.positiveModerate,
      ...policy.negativeModerate,
      ...policy.nonDirectional,
      ...policy.ignored,
    ];

    expect(new Set(allStates).size).toBe(allStates.length);
  });

  it("carries explicit policy and engine versions", () => {
    expect(EI_V1_POLICY.policyId).toBeTruthy();
    expect(EI_V1_POLICY.policyVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(EI_V1_POLICY.evidenceBalanceEngineVersion).toBeTruthy();
    expect(EI_V1_POLICY.learnerThreadAdapterVersion).toBeTruthy();
  });
});
