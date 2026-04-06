import { AssessmentEngineResult } from "@/lib/assessmentEngine";

export type ReportingMode = "parent_friendly" | "teacher_professional" | "authority_ready_concise";

type SubjectInsight = {
  subjectName: string;
  summary: string;
  strengths: string;
  growth: string;
  nextSteps: string;
  evidenceReadiness: string;
};

export type ReportingIntelligence = {
  mode: ReportingMode;
  overallSummary: string;
  strengths: string[];
  areasForGrowth: string[];
  nextSteps: string[];
  evidenceReadinessNote: string;
  subjectInsights: SubjectInsight[];
};

function describeDays(days: number | null) {
  if (days == null) return "unknown";
  if (days === 0) return "today";
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function toneLine(mode: ReportingMode, lines: { parent: string; teacher: string; authority: string }) {
  if (mode === "parent_friendly") return lines.parent;
  if (mode === "teacher_professional") return lines.teacher;
  return lines.authority;
}

function buildSubjectSummaryLine(summary: AssessmentEngineResult["subjectSummaries"][number], mode: ReportingMode) {
  const secure = summary.secureCount;
  const developing = summary.developingCount;
  const emerging = summary.emergingCount;
  const insufficient = summary.insufficientCount;
  const average = Math.round(summary.averageScore);
  const breakdown = `${secure} secure · ${developing} developing · ${emerging} emerging · ${insufficient} needing evidence`;
  return toneLine(mode, {
    parent: `In ${summary.subjectName}, we currently track ${breakdown} with a ${average}% average confidence.`,
    teacher: `${summary.subjectName}: ${breakdown} (avg ${average} pts).`,
    authority: `${summary.subjectName} ${breakdown}. Avg ${average}.`,
  });
}

function buildSubjectStrengthLine(summary: AssessmentEngineResult["subjectSummaries"][number], mode: ReportingMode) {
  const secure = summary.secureCount;
  const total = secure + summary.developingCount + summary.emergingCount + summary.insufficientCount;
  if (!total) {
    return toneLine(mode, {
      parent: `${summary.subjectName} has no judgements yet so we are still collecting signals.`,
      teacher: `${summary.subjectName} has no judgements to report yet.`,
      authority: `${summary.subjectName}: no judgements yet.`,
    });
  }
  const securePercent = Math.round((secure / total) * 100);
  return toneLine(mode, {
    parent: `${summary.subjectName} has ${securePercent}% of its judgements marked Secure, which gives us warm, reliable signals there.`,
    teacher: `${summary.subjectName} is ${securePercent}% secure by judgement counts.`,
    authority: `${summary.subjectName} ${securePercent}% secure.`,
  });
}

function buildSubjectGrowthLine(summary: AssessmentEngineResult["subjectSummaries"][number], mode: ReportingMode) {
  const needsEvidence = summary.insufficientCount;
  const emerging = summary.emergingCount;
  if (needsEvidence + emerging === 0) {
    return toneLine(mode, {
      parent: `${summary.subjectName} is tracking steadily across its standards.`,
      teacher: `${summary.subjectName} has balanced judgements.`,
      authority: `${summary.subjectName} is stable.`,
    });
  }
  return toneLine(mode, {
    parent: `${summary.subjectName} could use more evidence to shift ${needsEvidence} needing evidence and ${emerging} emerging judgements toward developing or secure.`,
    teacher: `${summary.subjectName} reports ${needsEvidence} needing evidence and ${emerging} emerging judgements; plan for further signals.`,
    authority: `${summary.subjectName} ${needsEvidence} needing evidence, ${emerging} emerging.`,
  });
}

function buildSubjectNextStepsLine(summary: AssessmentEngineResult["subjectSummaries"][number], mode: ReportingMode) {
  return toneLine(mode, {
    parent: `Next steps: gather more context-rich evidence or assessments in ${summary.subjectName}.`,
    teacher: `Plan targeted evidence capture for ${summary.subjectName} to balance the judgement mix.`,
    authority: `Next: strengthen ${summary.subjectName}.`,
  });
}

function computeFreshestSignal(result: AssessmentEngineResult) {
  const freshnessValues = result.standards
    .map((row) => row.freshnessDays)
    .filter((value): value is number => typeof value === "number");
  return freshnessValues.length ? Math.min(...freshnessValues) : null;
}

export function generateReportingIntelligence(
  result: AssessmentEngineResult,
  studentName: string,
  mode: ReportingMode = "parent_friendly"
): ReportingIntelligence {
  const headline = result.headline;
  const subjectSummaries = result.subjectSummaries;

  const sortedBySecure = [...subjectSummaries]
    .sort((a, b) => b.secureCount - a.secureCount || b.averageScore - a.averageScore)
    .slice(0, 2);

  const sortedForGrowth = [...subjectSummaries]
    .sort(
      (a, b) =>
        b.insufficientCount - a.insufficientCount ||
        b.emergingCount - a.emergingCount ||
        a.averageScore - b.averageScore
    )
    .slice(0, 2);

  const overallSummary = toneLine(mode, {
    parent: `${studentName} has ${headline.evidenceLinkedCount} standards supported by evidence and ${headline.assessmentLinkedCount} supported by assessments, averaging ${Math.round(
      headline.averageScore
    )} points.`,
    teacher: `${studentName}: ${headline.evidenceLinkedCount} evidence-linked standards, ${headline.assessmentLinkedCount} assessment signals, avg ${Math.round(
      headline.averageScore
    )}.`,
    authority: `Evidence ${headline.evidenceLinkedCount}, assessments ${headline.assessmentLinkedCount}, avg ${Math.round(
      headline.averageScore
    )}.`,
  });

  const strengths = sortedBySecure.map((summary) =>
    toneLine(mode, {
      parent: `Strength in ${summary.subjectName}: ${summary.secureCount} secure judgements plus ${Math.round(
        summary.averageScore
      )}% average confidence.`,
      teacher: `${summary.subjectName} leads with ${summary.secureCount} secure judgements.`,
      authority: `${summary.subjectName} strong (${summary.secureCount} secure).`,
    })
  );

  if (!strengths.length) {
    strengths.push(
      toneLine(mode, {
        parent: "No secure judgements yet; gathering evidence everywhere.",
        teacher: "No secure judgements yet.",
        authority: "No secure judgements.",
      })
    );
  }

  const areasForGrowth = sortedForGrowth.map((summary) =>
    toneLine(mode, {
      parent: `Focus on ${summary.subjectName}: ${summary.insufficientCount} needing evidence signals.`,
      teacher: `${summary.subjectName} has ${summary.insufficientCount} standards needing evidence.`,
      authority: `${summary.subjectName} needs evidence (${summary.insufficientCount}).`,
    })
  );

  if (!areasForGrowth.length) {
    areasForGrowth.push(
      toneLine(mode, {
        parent: "No single subject is currently flagged, but keep monitoring emerging judgements.",
        teacher: "No standout growth areas; keep an eye on emerging judgements.",
        authority: "Growth areas stable.",
      })
    );
  }

  const gapStandards = result.standards
    .filter((row) => row.judgement !== "Secure")
    .sort((a, b) => (a.judgementScore || 0) - (b.judgementScore || 0))
    .slice(0, 3);

  const nextSteps = gapStandards.map((standard) =>
    toneLine(mode, {
      parent: `${standard.officialCode} (${standard.subjectName}) needs: ${standard.nextStep}`,
      teacher: `${standard.officialCode} (${standard.strandName}) → ${standard.nextStep}`,
      authority: `${standard.officialCode} needs ${standard.nextStep}`,
    })
  );

  if (!nextSteps.length) {
    nextSteps.push(
      toneLine(mode, {
        parent: "Next steps will appear as more data arrives.",
        teacher: "Awaiting further data to recommend next steps.",
        authority: "No next steps.",
      })
    );
  }

  const freshnessDays = computeFreshestSignal(result);

  const evidenceReadinessNote = toneLine(mode, {
    parent: `Readiness note: ${headline.evidenceLinkedCount} evidence-linked standards, ${headline.assessmentLinkedCount} assessment signals, freshest signal ${describeDays(
      freshnessDays
    )}.`,
    teacher: `Readiness: ${headline.evidenceLinkedCount} evidence, ${headline.assessmentLinkedCount} assessments, freshest ${describeDays(
      freshnessDays
    )}.`,
    authority: `Evidence ${headline.evidenceLinkedCount}, assessments ${headline.assessmentLinkedCount}, freshest ${describeDays(
      freshnessDays
    )}.`,
  });

  const subjectInsights = subjectSummaries.slice(0, 4).map((summary) => ({
    subjectName: summary.subjectName,
    summary: buildSubjectSummaryLine(summary, mode),
    strengths: buildSubjectStrengthLine(summary, mode),
    growth: buildSubjectGrowthLine(summary, mode),
    nextSteps: buildSubjectNextStepsLine(summary, mode),
    evidenceReadiness: toneLine(mode, {
      parent: `Evidence readiness for ${summary.subjectName} follows the ${summary.secureCount} secure judgements we have logged.`,
      teacher: `${summary.subjectName} readiness: ${summary.secureCount} secure.`,
      authority: `${summary.subjectName} ready.`,
    }),
  }));

  return {
    mode,
    overallSummary,
    strengths,
    areasForGrowth,
    nextSteps,
    evidenceReadinessNote,
    subjectInsights,
  };
}
