import type {
  ResourceFactoryQaDecision,
  ResourceFactoryQaReport,
} from "@/lib/resourceFactory/types";

export type ResourceFactoryQaThresholds = {
  factualScore: number;
  answerScore: number;
  qualityScore: number;
};

export const DEFAULT_RESOURCE_FACTORY_QA_THRESHOLDS: ResourceFactoryQaThresholds = {
  factualScore: 80,
  answerScore: 90,
  qualityScore: 75,
};

export function evaluateResourceFactoryQa(
  report: ResourceFactoryQaReport,
  thresholds: ResourceFactoryQaThresholds = DEFAULT_RESOURCE_FACTORY_QA_THRESHOLDS,
): {
  decision: ResourceFactoryQaDecision;
  reasons: string[];
} {
  const reasons: string[] = [];
  const criticalIssues = report.issues.filter((issue) => issue.severity === "critical");

  if (criticalIssues.length) {
    return {
      decision: "block",
      reasons: criticalIssues.map((issue) => `${issue.code}: ${issue.message}`),
    };
  }

  if (report.factualScore < thresholds.factualScore) {
    reasons.push(
      `Factual score ${report.factualScore} is below ${thresholds.factualScore}.`,
    );
  }
  if (report.answerScore < thresholds.answerScore) {
    reasons.push(
      `Answer score ${report.answerScore} is below ${thresholds.answerScore}.`,
    );
  }
  if (report.qualityScore < thresholds.qualityScore) {
    reasons.push(
      `Quality score ${report.qualityScore} is below ${thresholds.qualityScore}.`,
    );
  }

  return {
    decision: reasons.length ? "retry" : "pass",
    reasons,
  };
}
