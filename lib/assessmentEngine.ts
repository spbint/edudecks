import { supabase } from "@/lib/supabaseClient";

export type AssessmentEngineFilters = {
  classId?: string;
  studentId?: string;
  frameworkId?: string;
};

export type AssessmentEngineClass = {
  id: string;
  name: string;
  year_level: number | null;
};

export type AssessmentEngineStudent = {
  id: string;
  class_id: string | null;
  display_name: string;
};

export type AssessmentEngineFramework = {
  id: string;
  code: string;
  name: string;
};

export type AssessmentJudgementStatus =
  | "Secure"
  | "Developing"
  | "Emerging"
  | "Insufficient";

export type AssessmentJudgementConfidence = "High" | "Moderate" | "Low";

export type AssessmentEngineStandardRow = {
  standardId: string;
  frameworkId: string;
  officialCode: string;
  title: string;
  subjectName: string;
  strandName: string;
  levelLabel: string;
  judgement: AssessmentJudgementStatus;
  confidence: AssessmentJudgementConfidence;
  judgementScore: number;
  freshnessDays: number | null;
  evidenceCount: number;
  assessmentCount: number;
  evidenceStrength: number;
  assessmentStrength: number;
  overallStrength: number;
  latestEvidenceDate: string | null;
  latestAssessmentDate: string | null;
  rationale: string;
  nextStep: string;
};

export type AssessmentEngineSubjectSummary = {
  subjectName: string;
  secureCount: number;
  developingCount: number;
  emergingCount: number;
  insufficientCount: number;
  averageScore: number;
};

export type AssessmentEngineGap = {
  standardId: string;
  officialCode: string;
  title: string;
  subjectName: string;
  reason: string;
};

export type AssessmentEngineResult = {
  classes: AssessmentEngineClass[];
  students: AssessmentEngineStudent[];
  frameworks: AssessmentEngineFramework[];
  standards: AssessmentEngineStandardRow[];
  subjectSummaries: AssessmentEngineSubjectSummary[];
  headline: {
    secureCount: number;
    developingCount: number;
    emergingCount: number;
    insufficientCount: number;
    averageScore: number;
    evidenceLinkedCount: number;
    assessmentLinkedCount: number;
  };
  gaps: AssessmentEngineGap[];
};

type StudentRow = {
  id: string;
  class_id?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
};

type ClassRow = {
  id: string;
  name?: string | null;
  year_level?: number | null;
};

type FrameworkRow = {
  id: string;
  code?: string | null;
  name?: string | null;
  is_active?: boolean | null;
};

type StandardRow = {
  id: string;
  framework_id: string;
  official_code?: string | null;
  title?: string | null;
  description?: string | null;
  subject?: { name?: string | null } | null;
  strand?: { name?: string | null } | null;
  level?: {
    normalized_level_label?: string | null;
    official_level_label?: string | null;
  } | null;
};

type EvidenceEntryRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  note?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
};

type EvidenceLinkRow = {
  evidence_id?: string | null;
  curriculum_standard_id?: string | null;
  confidence?: number | null;
};

type AssessmentLinkRow = {
  assessment_id?: string | null;
  curriculum_standard_id?: string | null;
  confidence?: number | null;
};

type AssessmentResultRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  assessment_id?: string | null;
  assessment_instrument_id?: string | null;
  instrument_id?: string | null;
  assessed_at?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  score_numeric?: number | null;
  raw_score?: number | null;
  percentile?: number | null;
  stanine?: number | null;
  score_stanine?: number | null;
  score_band?: string | null;
  band?: string | null;
};

type InstrumentRow = {
  id: string;
  assessment_id?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function numberOrNull(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isMissingRelationOrColumn(error: any) {
  const message = String(error?.message ?? "").toLowerCase();
  return (
    message.includes("does not exist") &&
    (message.includes("relation") || message.includes("column"))
  );
}

async function trySelect<T>(table: string, selectVariants: string[]) {
  for (const select of selectVariants) {
    const response = await supabase.from(table).select(select);
    if (!response.error) {
      return { data: ((response.data ?? []) as unknown) as T[] };
    }
    if (!isMissingRelationOrColumn(response.error)) throw response.error;
  }
  return { data: [] as T[] };
}

function displayName(student: StudentRow) {
  return (
    `${safe(student.preferred_name || student.first_name)} ${safe(
      student.surname || student.family_name || student.last_name
    )}`.trim() || "Student"
  );
}

function itemDate(item: {
  occurred_on?: string | null;
  assessed_at?: string | null;
  created_at?: string | null;
}) {
  return (
    safe(item.occured_on) ||
    safe(item.occurred_on) ||
    safe(item.assessed_at) ||
    safe(item.created_at) ||
    ""
  );
}

function daysSince(dateValue: string | null) {
  const value = safe(dateValue);
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function evidenceTextQuality(row: EvidenceEntryRow) {
  const length = [
    safe(row.title),
    safe(row.summary),
    safe(row.body),
    safe(row.note),
  ]
    .join(" ")
    .trim().length;

  if (length >= 350) return 100;
  if (length >= 220) return 82;
  if (length >= 120) return 64;
  if (length >= 50) return 42;
  if (length > 0) return 24;
  return 10;
}

function freshnessScore(days: number | null) {
  if (days == null) return 0;
  if (days <= 14) return 100;
  if (days <= 30) return 82;
  if (days <= 60) return 62;
  if (days <= 90) return 38;
  return 20;
}

function assessmentSignalStrength(row: AssessmentResultRow) {
  const stanine = numberOrNull(row.stanine ?? row.score_stanine);
  const percentile = numberOrNull(row.percentile);
  const raw = numberOrNull(row.score_numeric ?? row.raw_score);
  const band = safe(row.score_band || row.band).toLowerCase();

  if (stanine != null) return clamp(((stanine - 1) / 8) * 100);
  if (percentile != null) return clamp(percentile);
  if (band.includes("well above")) return 92;
  if (band.includes("above")) return 82;
  if (band.includes("at") || band.includes("on")) return 70;
  if (band.includes("approach") || band.includes("below")) return 46;
  if (raw != null) return 60;
  return 35;
}

function judgementFromScore(score: number, evidenceCount: number, assessmentCount: number) {
  if (evidenceCount + assessmentCount === 0) return "Insufficient" as const;
  if (score >= 75) return "Secure" as const;
  if (score >= 55) return "Developing" as const;
  return "Emerging" as const;
}

function confidenceFromSignals(args: {
  evidenceCount: number;
  assessmentCount: number;
  avgLinkConfidence: number;
  freshnessDays: number | null;
}) {
  const freshness = args.freshnessDays == null ? 0 : args.freshnessDays <= 45 ? 1 : 0;
  const density = args.evidenceCount >= 2 ? 1 : 0;
  const triangulation = args.assessmentCount >= 1 ? 1 : 0;
  const confidence = args.avgLinkConfidence >= 0.7 ? 1 : 0;
  const score = freshness + density + triangulation + confidence;
  if (score >= 3) return "High" as const;
  if (score >= 2) return "Moderate" as const;
  return "Low" as const;
}

function nextStepFromJudgement(args: {
  judgement: AssessmentJudgementStatus;
  freshnessDays: number | null;
  evidenceCount: number;
  assessmentCount: number;
}) {
  if (args.evidenceCount === 0 && args.assessmentCount === 0) {
    return "Link the first evidence item or assessment result to this standard.";
  }
  if ((args.freshnessDays ?? 999) > 45) {
    return "Capture fresher evidence before locking in a stronger judgement.";
  }
  if (args.assessmentCount === 0) {
    return "Add an assessment-aligned signal to strengthen the judgement.";
  }
  if (args.judgement === "Emerging") {
    return "Collect another strong example showing the learner can repeat the skill independently.";
  }
  if (args.judgement === "Developing") {
    return "Keep gathering varied evidence to confirm the performance is secure across contexts.";
  }
  return "Maintain light monitoring and refresh evidence when the learning moves to a new context.";
}

function rationaleFromJudgement(args: {
  evidenceCount: number;
  assessmentCount: number;
  freshnessDays: number | null;
  judgement: AssessmentJudgementStatus;
}) {
  const freshness =
    args.freshnessDays == null
      ? "with no clear recent date"
      : `with the latest signal ${args.freshnessDays} day${args.freshnessDays === 1 ? "" : "s"} ago`;

  if (args.evidenceCount + args.assessmentCount === 0) {
    return "No linked evidence or assessment signal is available for this standard yet.";
  }

  return `${args.evidenceCount} linked evidence item${
    args.evidenceCount === 1 ? "" : "s"
  } and ${args.assessmentCount} assessment signal${
    args.assessmentCount === 1 ? "" : "s"
  } support a ${args.judgement.toLowerCase()} judgement, ${freshness}.`;
}

export async function loadAssessmentEngine(
  filters: AssessmentEngineFilters = {}
): Promise<AssessmentEngineResult> {
  const [classesRes, studentsRes, frameworksRes, standardsRes] = await Promise.all([
    trySelect<ClassRow>("classes", ["id,name,year_level"]),
    trySelect<StudentRow>("students", [
      "id,class_id,preferred_name,first_name,surname,family_name,last_name",
      "id,class_id,preferred_name,first_name,surname,last_name",
      "id,class_id,preferred_name,first_name",
    ]),
    trySelect<FrameworkRow>("curriculum_frameworks", ["id,code,name,is_active"]),
    trySelect<StandardRow>("curriculum_standards", [
      "id,framework_id,official_code,title,description,subject:curriculum_subjects(name),strand:curriculum_strands(name),level:curriculum_levels(normalized_level_label,official_level_label)",
      "id,framework_id,official_code,title,description",
    ]),
  ]);

  const classes = classesRes.data
    .map((row) => ({
      id: row.id,
      name: safe(row.name) || "Class",
      year_level: row.year_level ?? null,
    }))
    .sort((a, b) => (a.year_level ?? 999) - (b.year_level ?? 999) || a.name.localeCompare(b.name));

  const students = studentsRes.data
    .map((row) => ({
      id: row.id,
      class_id: row.class_id ?? null,
      display_name: displayName(row),
    }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));

  const frameworks = frameworksRes.data
    .filter((row) => row.is_active !== false)
    .map((row) => ({
      id: row.id,
      code: safe(row.code),
      name: safe(row.name) || "Framework",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const effectiveFrameworkId = safe(filters.frameworkId) || frameworks[0]?.id || "";
  const filteredStandards = standardsRes.data.filter(
    (row) => !effectiveFrameworkId || row.framework_id === effectiveFrameworkId
  );

  const effectiveStudentIds = new Set(
    students
      .filter((row) => {
        if (filters.studentId) return row.id === filters.studentId;
        if (filters.classId) return row.class_id === filters.classId;
        return true;
      })
      .map((row) => row.id)
  );

  const [evidenceRes, evidenceLinksRes, assessmentLinksRes, assessmentResultsRes, instrumentsRes] =
    await Promise.all([
      trySelect<EvidenceEntryRow>("evidence_entries", [
        "id,student_id,class_id,title,summary,body,note,occurred_on,created_at,is_deleted",
        "id,student_id,class_id,title,summary,body,occurred_on,created_at",
      ]),
      trySelect<EvidenceLinkRow>("evidence_curriculum_links", [
        "evidence_id,curriculum_standard_id,confidence",
      ]),
      trySelect<AssessmentLinkRow>("assessment_curriculum_links", [
        "assessment_id,curriculum_standard_id,confidence",
      ]),
      trySelect<AssessmentResultRow>("assessment_results", [
        "id,student_id,class_id,assessment_id,assessment_instrument_id,instrument_id,assessed_at,occurred_on,created_at,score_numeric,raw_score,percentile,stanine,score_stanine,score_band,band",
        "id,student_id,class_id,assessment_instrument_id,instrument_id,assessed_at,created_at,score_numeric,percentile,stanine,score_stanine,score_band,band",
      ]),
      trySelect<InstrumentRow>("assessment_instruments", [
        "id,assessment_id",
        "id",
      ]),
    ]);

  const evidenceRows = evidenceRes.data.filter((row) => {
    if (row.is_deleted === true) return false;
    const studentId = safe(row.student_id);
    if (!studentId) return false;
    if (effectiveStudentIds.size && !effectiveStudentIds.has(studentId)) return false;
    if (filters.classId && safe(row.class_id) && safe(row.class_id) !== safe(filters.classId)) {
      return false;
    }
    return true;
  });

  const evidenceById = new Map(evidenceRows.map((row) => [row.id, row]));
  const evidenceLinksByStandard = new Map<string, EvidenceLinkRow[]>();

  for (const link of evidenceLinksRes.data) {
    const standardId = safe(link.curriculum_standard_id);
    const evidenceId = safe(link.evidence_id);
    if (!standardId || !evidenceId || !evidenceById.has(evidenceId)) continue;
    if (!evidenceLinksByStandard.has(standardId)) evidenceLinksByStandard.set(standardId, []);
    evidenceLinksByStandard.get(standardId)!.push(link);
  }

  const instrumentToAssessment = new Map<string, string>();
  for (const instrument of instrumentsRes.data) {
    const instrumentId = safe(instrument.id);
    const assessmentId = safe(instrument.assessment_id);
    if (instrumentId && assessmentId) instrumentToAssessment.set(instrumentId, assessmentId);
  }

  const assessmentResults = assessmentResultsRes.data.filter((row) => {
    const studentId = safe(row.student_id);
    if (!studentId) return false;
    if (effectiveStudentIds.size && !effectiveStudentIds.has(studentId)) return false;
    if (filters.classId && safe(row.class_id) && safe(row.class_id) !== safe(filters.classId)) {
      return false;
    }
    return true;
  });

  const assessmentResultsByLinkId = new Map<string, AssessmentResultRow[]>();
  for (const row of assessmentResults) {
    const keys = new Set<string>();
    const directAssessmentId = safe(row.assessment_id);
    const assessmentInstrumentId = safe(row.assessment_instrument_id);
    const instrumentId = safe(row.instrument_id);

    if (directAssessmentId) keys.add(directAssessmentId);
    if (assessmentInstrumentId) {
      keys.add(assessmentInstrumentId);
      const mapped = instrumentToAssessment.get(assessmentInstrumentId);
      if (mapped) keys.add(mapped);
    }
    if (instrumentId) {
      keys.add(instrumentId);
      const mapped = instrumentToAssessment.get(instrumentId);
      if (mapped) keys.add(mapped);
    }

    for (const key of keys) {
      if (!assessmentResultsByLinkId.has(key)) assessmentResultsByLinkId.set(key, []);
      assessmentResultsByLinkId.get(key)!.push(row);
    }
  }

  const assessmentLinksByStandard = new Map<string, AssessmentLinkRow[]>();
  for (const link of assessmentLinksRes.data) {
    const standardId = safe(link.curriculum_standard_id);
    const assessmentId = safe(link.assessment_id);
    if (!standardId || !assessmentId) continue;
    if (!assessmentLinksByStandard.has(standardId)) assessmentLinksByStandard.set(standardId, []);
    assessmentLinksByStandard.get(standardId)!.push(link);
  }

  const standardRows: AssessmentEngineStandardRow[] = filteredStandards.map((standard) => {
    const evidenceLinks = evidenceLinksByStandard.get(standard.id) ?? [];
    const evidenceItems = evidenceLinks
      .map((link) => evidenceById.get(safe(link.evidence_id)))
      .filter(Boolean) as EvidenceEntryRow[];

    const assessmentLinks = assessmentLinksByStandard.get(standard.id) ?? [];
    const assessmentItems = assessmentLinks.flatMap(
      (link) => assessmentResultsByLinkId.get(safe(link.assessment_id)) ?? []
    );

    const latestEvidenceDate =
      evidenceItems
        .map((row) => itemDate(row))
        .filter(Boolean)
        .sort()
        .reverse()[0] ?? null;

    const latestAssessmentDate =
      assessmentItems
        .map((row) => itemDate(row))
        .filter(Boolean)
        .sort()
        .reverse()[0] ?? null;

    const freshnessDays = daysSince(
      [latestEvidenceDate, latestAssessmentDate].filter(Boolean).sort().reverse()[0] ?? null
    );

    const avgEvidenceConfidence = average(
      evidenceLinks.map((link) => numberOrNull(link.confidence) ?? 0.6)
    );
    const avgAssessmentConfidence = average(
      assessmentLinks.map((link) => numberOrNull(link.confidence) ?? 0.7)
    );
    const avgLinkConfidence = average(
      [...evidenceLinks, ...assessmentLinks].map(
        (link) => numberOrNull((link as any).confidence) ?? 0.65
      )
    );

    const evidenceStrength = clamp(
      evidenceItems.length * 16 +
        average(evidenceItems.map(evidenceTextQuality)) * 0.34 +
        avgEvidenceConfidence * 28 +
        freshnessScore(freshnessDays) * 0.22
    );

    const assessmentStrength = clamp(
      assessmentItems.length * 18 +
        average(assessmentItems.map(assessmentSignalStrength)) * 0.52 +
        avgAssessmentConfidence * 24
    );

    const overallStrength = clamp(evidenceStrength * 0.62 + assessmentStrength * 0.38);
    const judgement = judgementFromScore(
      overallStrength,
      evidenceItems.length,
      assessmentItems.length
    );
    const confidence = confidenceFromSignals({
      evidenceCount: evidenceItems.length,
      assessmentCount: assessmentItems.length,
      avgLinkConfidence,
      freshnessDays,
    });

    return {
      standardId: standard.id,
      frameworkId: standard.framework_id,
      officialCode: safe(standard.official_code) || "Standard",
      title: safe(standard.title || standard.description) || "Untitled standard",
      subjectName: safe(standard.subject?.name) || "General",
      strandName: safe(standard.strand?.name) || "Unassigned strand",
      levelLabel:
        safe(standard.level?.normalized_level_label || standard.level?.official_level_label) ||
        "Unspecified level",
      judgement,
      confidence,
      judgementScore: overallStrength,
      freshnessDays,
      evidenceCount: evidenceItems.length,
      assessmentCount: assessmentItems.length,
      evidenceStrength,
      assessmentStrength,
      overallStrength,
      latestEvidenceDate,
      latestAssessmentDate,
      rationale: rationaleFromJudgement({
        evidenceCount: evidenceItems.length,
        assessmentCount: assessmentItems.length,
        freshnessDays,
        judgement,
      }),
      nextStep: nextStepFromJudgement({
        judgement,
        freshnessDays,
        evidenceCount: evidenceItems.length,
        assessmentCount: assessmentItems.length,
      }),
    };
  });

  const subjectSummaries = Array.from(
    standardRows.reduce<Map<string, AssessmentEngineSubjectSummary>>((map, row) => {
      const key = row.subjectName;
      if (!map.has(key)) {
        map.set(key, {
          subjectName: key,
          secureCount: 0,
          developingCount: 0,
          emergingCount: 0,
          insufficientCount: 0,
          averageScore: 0,
        });
      }
      const summary = map.get(key)!;
      if (row.judgement === "Secure") summary.secureCount += 1;
      else if (row.judgement === "Developing") summary.developingCount += 1;
      else if (row.judgement === "Emerging") summary.emergingCount += 1;
      else summary.insufficientCount += 1;
      summary.averageScore += row.judgementScore;
      return map;
    }, new Map())
  )
    .map(([, summary]) => {
      const total =
        summary.secureCount +
        summary.developingCount +
        summary.emergingCount +
        summary.insufficientCount;
      return {
        ...summary,
        averageScore: total ? clamp(summary.averageScore / total) : 0,
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore || a.subjectName.localeCompare(b.subjectName));

  const headline = {
    secureCount: standardRows.filter((row) => row.judgement === "Secure").length,
    developingCount: standardRows.filter((row) => row.judgement === "Developing").length,
    emergingCount: standardRows.filter((row) => row.judgement === "Emerging").length,
    insufficientCount: standardRows.filter((row) => row.judgement === "Insufficient").length,
    averageScore: standardRows.length ? clamp(average(standardRows.map((row) => row.judgementScore))) : 0,
    evidenceLinkedCount: standardRows.filter((row) => row.evidenceCount > 0).length,
    assessmentLinkedCount: standardRows.filter((row) => row.assessmentCount > 0).length,
  };

  const gaps = standardRows
    .filter(
      (row) =>
        row.judgement === "Insufficient" ||
        (row.judgement === "Emerging" && (row.freshnessDays ?? 999) > 45)
    )
    .sort(
      (a, b) =>
        (b.freshnessDays ?? 999) - (a.freshnessDays ?? 999) ||
        a.judgementScore - b.judgementScore
    )
    .slice(0, 8)
    .map((row) => ({
      standardId: row.standardId,
      officialCode: row.officialCode,
      title: row.title,
      subjectName: row.subjectName,
      reason:
        row.evidenceCount + row.assessmentCount === 0
          ? "No linked evidence or assessment signal yet."
          : row.freshnessDays != null && row.freshnessDays > 45
          ? `Latest linked signal is ${row.freshnessDays} days old.`
          : "Current linked signals are still too thin to support a stronger judgement.",
    }));

  return {
    classes,
    students,
    frameworks,
    standards: standardRows.sort(
      (a, b) =>
        b.judgementScore - a.judgementScore ||
        a.subjectName.localeCompare(b.subjectName) ||
        a.officialCode.localeCompare(b.officialCode)
    ),
    subjectSummaries,
    headline,
    gaps,
  };
}
