import { supabase } from "@/lib/supabaseClient";

import {
  calculateClassHealth,
  calculateProfileConfidence,
  calculateStudentAttentionScore,
  deriveAttributes,
  deriveNextAction,
  deriveStatusLabel,
  getEvidenceFreshness,
  getLastEvidenceDays,
  getOpenInterventions,
  getOverdueReviews,
} from "./student";

import { isMissingRelationOrColumn, studentDisplayName } from "./helpers";

import type {
  ClassAnalytics,
  ClassRow,
  EvidenceEntryRow,
  InterventionRow,
  StudentAnalytics,
  StudentAttentionItem,
  StudentRow,
} from "./types";

/* ───────────────────────── STUDENT LOADERS ───────────────────────── */

async function loadStudent(studentId: string) {
  const candidates = [
    "id,class_id,first_name,preferred_name,surname,family_name,is_ilp,created_at",
    "id,class_id,first_name,preferred_name,surname,is_ilp,created_at",
    "id,class_id,first_name,preferred_name,family_name,is_ilp,created_at",
    "id,class_id,first_name,preferred_name,is_ilp,created_at",
  ];

  let found: StudentRow | null = null;

  for (const sel of candidates) {
    const r = await supabase.from("students").select(sel).eq("id", studentId).maybeSingle();

    if (!r.error) {
      found = (r.data as any) || null;
      break;
    }

    if (!isMissingRelationOrColumn(r.error)) throw r.error;
  }

  return found;
}

async function loadStudentsInClass(classId: string) {
  const candidates = [
    "id,class_id,first_name,preferred_name,surname,family_name,is_ilp,created_at",
    "id,class_id,first_name,preferred_name,surname,is_ilp,created_at",
    "id,class_id,first_name,preferred_name,family_name,is_ilp,created_at",
    "id,class_id,first_name,preferred_name,is_ilp,created_at",
  ];

  let found: StudentRow[] = [];

  for (const sel of candidates) {
    const r = await supabase
      .from("students")
      .select(sel)
      .eq("class_id", classId)
      .order("preferred_name", { ascending: true })
      .limit(500);

    if (!r.error) {
      found = ((r.data as any[]) ?? []) as StudentRow[];
      break;
    }

    if (!isMissingRelationOrColumn(r.error)) throw r.error;
  }

  return found.sort((a, b) => studentDisplayName(a).localeCompare(studentDisplayName(b)));
}

async function loadClass(classId: string | null) {
  if (!classId) return null;

  const c = await supabase
    .from("classes")
    .select("id,name,year_level,teacher_name,room")
    .eq("id", classId)
    .maybeSingle();

  if (c.error && !isMissingRelationOrColumn(c.error)) throw c.error;

  return ((c.data as any) || null) as ClassRow | null;
}

async function loadEvidence(studentId: string) {
  const r = await supabase
    .from("evidence_entries")
    .select(
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,visibility,is_deleted"
    )
    .eq("student_id", studentId)
    .eq("is_deleted", false)
    .order("occurred_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(300);

  if (r.error && !isMissingRelationOrColumn(r.error)) throw r.error;

  return (((r.data as any[]) ?? []) as EvidenceEntryRow[]).filter((x) => !x.is_deleted);
}

async function loadInterventions(studentId: string) {
  const r = await supabase
    .from("interventions")
    .select(
      "id,student_id,class_id,title,notes,note,status,priority,tier,strategy,due_on,next_review_on,review_due_on,review_due_date,created_at,updated_at"
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (r.error && !isMissingRelationOrColumn(r.error)) throw r.error;

  return (((r.data as any[]) ?? []) as InterventionRow[]) || [];
}

/* ───────────────────────── STUDENT ANALYTICS ───────────────────────── */

export async function loadStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
  const student = await loadStudent(studentId);

  const [klass, evidence, interventions] = await Promise.all([
    loadClass(student?.class_id ?? null),
    loadEvidence(studentId),
    loadInterventions(studentId),
  ]);

  const openInterventions = getOpenInterventions(interventions);
  const overdueReviews = getOverdueReviews(interventions);
  const lastEvidenceDays = getLastEvidenceDays(evidence);
  const evidenceFreshness = getEvidenceFreshness(evidence);

  const profileConfidence = calculateProfileConfidence(
    evidence,
    overdueReviews,
    lastEvidenceDays
  );

  const attentionScore = calculateStudentAttentionScore({
    lastEvidenceDays,
    overdueReviewCount: overdueReviews.length,
    openInterventionCount: openInterventions.length,
  });

  const statusLabel = deriveStatusLabel({
    lastEvidenceDays,
    overdueReviewCount: overdueReviews.length,
  });

  const nextAction = deriveNextAction({
    lastEvidenceDays,
    overdueReviewCount: overdueReviews.length,
    evidenceFreshness,
    openInterventionCount: openInterventions.length,
  });

  const attributes = deriveAttributes(evidence, interventions);

  return {
    student,
    klass,
    evidence,
    interventions,
    openInterventions,
    overdueReviews,
    lastEvidenceDays,
    profileConfidence,
    attentionScore,
    statusLabel,
    nextAction,
    evidenceFreshness,
    attributes,
  };
}

/* ───────────────────────── ATTENTION LIST ───────────────────────── */

export async function loadStudentAttentionList(
  studentIds: string[]
): Promise<StudentAttentionItem[]> {
  const rows = await Promise.all(studentIds.map((id) => loadStudentAnalytics(id)));

  return rows
    .map((row) => ({
      student_id: row.student?.id || "",
      student_name: studentDisplayName(row.student),
      class_id: row.student?.class_id || null,
      attention_score: row.attentionScore,
      status_label: row.statusLabel,
      last_evidence_days: row.lastEvidenceDays,
      overdue_reviews: row.overdueReviews.length,
      open_interventions: row.openInterventions.length,
      next_action: row.nextAction,
      is_ilp: !!row.student?.is_ilp,
    }))
    .sort((a, b) => a.attention_score - b.attention_score);
}

/* ───────────────────────── CLASS ANALYTICS ───────────────────────── */

export async function loadClassAnalytics(classId: string): Promise<ClassAnalytics> {
  const [klass, students] = await Promise.all([
    loadClass(classId),
    loadStudentsInClass(classId),
  ]);

  const studentAnalytics = await Promise.all(
    students.map(async (student) => {
      try {
        return await loadStudentAnalytics(student.id);
      } catch {
        return {
          student,
          klass,
          evidence: [],
          interventions: [],
          openInterventions: [],
          overdueReviews: [],
          lastEvidenceDays: null,
          profileConfidence: 0,
          attentionScore: 0,
          statusLabel: "Watch" as const,
          nextAction: "Monitor current plan",
          evidenceFreshness: [],
          attributes: [],
        } satisfies StudentAnalytics;
      }
    })
  );

  const allEvidence = studentAnalytics.flatMap((s) => s.evidence);
  const allInterventions = studentAnalytics.flatMap((s) => s.interventions);

  const openInterventionCount = studentAnalytics.reduce(
    (sum, s) => sum + s.openInterventions.length,
    0
  );

  const overdueReviewCount = studentAnalytics.reduce(
    (sum, s) => sum + s.overdueReviews.length,
    0
  );

  const classHealthScore = calculateClassHealth(studentAnalytics);

  const coverageLabels = ["Reading", "Writing", "Maths", "Behaviour", "Wellbeing"];

  const evidenceCoverage = coverageLabels.map((label) => {
    const values = studentAnalytics
      .map((s) => s.evidenceFreshness.find((x) => x.label === label)?.days)
      .filter((v): v is number => typeof v === "number");

    const days =
      values.length > 0
        ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
        : 999;

    return { label, days };
  });

  const attentionList: StudentAttentionItem[] = studentAnalytics
    .map((row) => ({
      student_id: row.student?.id || "",
      student_name: studentDisplayName(row.student),
      class_id: row.student?.class_id || null,
      attention_score: row.attentionScore,
      status_label: row.statusLabel,
      last_evidence_days: row.lastEvidenceDays,
      overdue_reviews: row.overdueReviews.length,
      open_interventions: row.openInterventions.length,
      next_action: row.nextAction,
      is_ilp: !!row.student?.is_ilp,
    }))
    .sort((a, b) => a.attention_score - b.attention_score);

  return {
    klass,
    students,
    evidence: allEvidence,
    interventions: allInterventions,
    studentAnalytics,
    classHealthScore,
    evidenceCoverage,
    openInterventionCount,
    overdueReviewCount,
    attentionList,
  };
}