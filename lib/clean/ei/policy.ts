export const EI_V1_POLICY = {
  policyId: "mylearna-educational-intelligence",
  policyVersion: "0.1.0",
  evidenceBalanceEngineVersion: "ei-evidence-balance-v1",
  learnerThreadAdapterVersion: "learner-thread-ei-v1",
  assessment: {
    positiveCorrectRatioAtOrAbove: 0.8,
    negativeCorrectRatioAtOrBelow: 0.4,
  },
  evidenceBalance: {
    minimumDirectionalGroupsForSignal: 2,
    highConfidenceMinimumDirectionalGroups: 3,
    highConfidenceMinimumDirectionalSourceKinds: 2,
    needsAttentionUpperExclusive: 0.35,
    mixedUpperExclusive: 0.6,
    promisingUpperExclusive: 0.8,
  },
  adultJudgement: {
    positiveHigh: [
      "secure",
      "strong",
      "goal achieved",
      "goal achieved + extension",
    ],
    positiveModerate: ["consolidating"],
    negativeModerate: [
      "beginning",
      "needs support",
      "still developing",
    ],
    nonDirectional: ["developing", "working towards"],
    ignored: ["not assessed yet"],
  },
} as const;

export type EiV1Policy = typeof EI_V1_POLICY;
