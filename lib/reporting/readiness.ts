import { AssessmentEngineResult, AssessmentEngineSubjectSummary } from "@/lib/assessmentEngine";

export type ReadinessStatus = "Ready" | "Nearly Ready" | "Partial" | "Needs Evidence";

export type SubjectReadiness = {
  subjectName: string;
  status: ReadinessStatus;
  evidenceCount: number;
  recentEvidenceCount: number;
  assessmentSummary: string;
  explanation: string;
  nextCapture: string;
};

export type EvidenceGap = {
  standardId: string;
  officialCode: string;
  title: string;
  subjectName: string;
  reason: string;
};

export type ReadinessReport = {
  overallStatus: ReadinessStatus;
  explanation: string;
  subjectReadiness: SubjectReadiness[];
  evidenceGaps: EvidenceGap[];
  captureGuidance: string[];
  reportReady: boolean;
};

function normalizeScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function statusFromScore(score: number, insufficientRatio: number): ReadinessStatus {
  if (insufficientRatio >= 0.35) return "Needs Evidence";
  if (score >= 72) return "Ready";
  if (score >= 60) return "Nearly Ready";
  if (score >= 45) return "Partial";
  return "Needs Evidence";
}

function describeStatus(status: ReadinessStatus): string {
  if (status === "Ready") return "Signals are strong and sustained.";
  if (status === "Nearly Ready") return "Signals are close to landing; add a touch more recency or breadth.";
  if (status === "Partial") return "Judgements show momentum but still need reinforcing evidence.";
  return "Fresh evidence is needed to move standards off 'Needs Evidence'.";
}

function nextCaptureSuggestion(subjectName: string, status: ReadinessStatus, recentSignals: number) {
  if (status === "Ready") {
    return `Maintain variety for ${subjectName} by capturing a light update across a different context.`;
  }
  if (status === "Nearly Ready") {
    return `Add one more recent ${subjectName.toLowerCase()} sample (e.g., writing, discussion, or project note).`;
  }
  if (status === "Partial") {
    return `Capture a deeper ${subjectName.toLowerCase()} task with a short reflection to clarify the judgement.`;
  }
  return `Start with an evidence entry for ${subjectName} so we can move a standard off 'Needs Evidence'.`;
}

function subjectStatusFromSummary(summary: AssessmentEngineSubjectSummary): ReadinessStatus {
  const total =
    summary.secureCount +
    summary.developingCount +
    summary.emergingCount +
    summary.insufficientCount;
  const insufficientRatio = total ? summary.insufficientCount / total : 0;
  return statusFromScore(summary.averageScore, insufficientRatio);
}

function buildExplanation(
  result: AssessmentEngineResult,
  overallStatus: ReadinessStatus,
  freshnessDays: number | null
) {
  const avgScore = normalizeScore(result.headline.averageScore);
  const evidenceCount = result.headline.evidenceLinkedCount;
  const assessmentCount = result.headline.assessmentLinkedCount;
  const freshness = freshnessDays == null ? "dates unavailable" : `${freshnessDays} day${freshnessDays === 1 ? "" : "s"} ago`;
  return `${describeStatus(overallStatus)} Average score ${avgScore}, ${evidenceCount} evidence-linked standards, ${assessmentCount} assessment signals, freshest linked signal ${freshness}.`;
}

function aggregateSubjectSignals(result: AssessmentEngineResult) {
  const map = new Map<
    string,
    {
      evidenceCount: number;
      assessmentCount: number;
      recentSignals: number;
      standardCount: number;
    }
  >();

  for (const standard of result.standards) {
    const key = standard.subjectName || "General";
    if (!map.has(key)) {
      map.set(key, { evidenceCount: 0, assessmentCount: 0, recentSignals: 0, standardCount: 0 });
    }
    const entry = map.get(key)!;
    entry.evidenceCount += standard.evidenceCount;
    entry.assessmentCount += standard.assessmentCount;
    entry.standardCount += 1;
    if (standard.freshnessDays != null && standard.freshnessDays <= 30 && standard.evidenceCount + standard.assessmentCount > 0) {
      entry.recentSignals += 1;
    }
  }

  return map;
}

function buildSubjectReadiness(
  summary: AssessmentEngineSubjectSummary,
  signals: {
    evidenceCount: number;
    assessmentCount: number;
    recentSignals: number;
    standardCount: number;
  }
): SubjectReadiness {
  const status = subjectStatusFromSummary(summary);
  const totalSignals = signals.evidenceCount + signals.assessmentCount;
  const explanation = `${signals.evidenceCount} evidence pieces and ${signals.assessmentCount} assessments cover ${signals.standardCount} standards; ${signals.recentSignals} signals are within the last 30 days.`;
  const assessmentSummary = `${signals.assessmentCount} assessment signal${signals.assessmentCount === 1 ? "" : "s"}`;
  const nextCapture = nextCaptureSuggestion(summary.subjectName, status, signals.recentSignals);

  return {
    subjectName: summary.subjectName,
    status,
    evidenceCount: signals.evidenceCount,
    recentEvidenceCount: signals.recentSignals,
    assessmentSummary,
    explanation,
    nextCapture,
  };
}

function describeEvidenceGap(standard: AssessmentEngineResult["standards"][number]) {
  if (standard.evidenceCount + standard.assessmentCount === 0) {
    return `No evidence or assessments linked to this standard yet.`;
  }
  if (standard.freshnessDays != null && standard.freshnessDays > 45) {
    return `Latest signal is ${standard.freshnessDays} days old.`;
  }
  return "Signal quality is thin; consider a richer submission.";
}

export function buildReadinessReport(result: AssessmentEngineResult): ReadinessReport {
  const totalStandards = result.standards.length;
  const avgScore = normalizeScore(result.headline.averageScore);
  const totalInsufficient = result.standards.filter((row) => row.judgement === "Insufficient").length;
  const insufficientRatio = totalStandards ? totalInsufficient / totalStandards : 0;
  const overallStatus = statusFromScore(avgScore, insufficientRatio);
  const freshnessDays = result.standards
    .map((row) => row.freshnessDays)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b)[0] ?? null;

  const signals = aggregateSubjectSignals(result);

  const subjectReadiness = result.subjectSummaries.map((summary) => {
    const signal = signals.get(summary.subjectName) ?? {
      evidenceCount: 0,
      assessmentCount: 0,
      recentSignals: 0,
      standardCount: 0,
    };
    return buildSubjectReadiness(summary, signal);
  });

  const evidenceGaps = result.standards
    .filter((row) => row.evidenceCount + row.assessmentCount === 0)
    .slice(0, 4)
    .map((row) => ({
      standardId: row.standardId,
      officialCode: row.officialCode,
      title: row.title,
      subjectName: row.subjectName,
      reason: describeEvidenceGap(row),
    }));

  const captureGuidance = subjectReadiness
    .filter((subject) => subject.status !== "Ready")
    .slice(0, 3)
    .map((subject) => subject.nextCapture);

  if (!captureGuidance.length) {
    captureGuidance.push("Maintain the current evidence rhythm and capture a fresh perspective each term.");
  }

  return {
    overallStatus,
    explanation: buildExplanation(result, overallStatus, freshnessDays),
    subjectReadiness,
    evidenceGaps,
    captureGuidance,
    reportReady: overallStatus === "Ready" || overallStatus === "Nearly Ready",
  };
}
