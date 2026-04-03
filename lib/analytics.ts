import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

export type StudentRow = {
  id: string;
  class_id: string | null;
  first_name: string | null;
  preferred_name: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  is_archived?: boolean | null;
  created_at?: string | null;
  [k: string]: any;
};

export type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  created_at?: string | null;
  [k: string]: any;
};

export type EvidenceEntryRow = {
  id: string;
  student_id: string | null;
  class_id: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  learning_area?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  visibility?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

export type InterventionRow = {
  id: string;
  class_id: string | null;
  student_id: string | null;
  title?: string | null;
  notes?: string | null;
  note?: string | null;
  status?: string | null;
  priority?: string | null;
  tier?: any;
  strategy?: string | null;
  due_on?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_reviewed_at?: string | null;
  [k: string]: any;
};

export type AttributeRow = {
  key?: string;
  id?: string;
  code?: string;
  label?: string;
  name?: string;
  score?: number | null;
  value?: number | null;
  band?: string | null;
  status?: string | null;
  [k: string]: any;
};

export type EvidenceFreshnessRow = {
  label: string;
  days: number;
};

export type StudentStatusLabel = "Stable" | "Watch" | "Attention";

export type StudentAnalytics = {
  student: StudentRow | null;
  klass: ClassRow | null;

  evidence: EvidenceEntryRow[];
  interventions: InterventionRow[];
  openInterventions: InterventionRow[];
  overdueReviews: InterventionRow[];

  lastEvidenceDays: number | null;
  profileConfidence: number;
  attentionScore: number;
  statusLabel: StudentStatusLabel;
  nextAction: string;

  evidenceFreshness: EvidenceFreshnessRow[];
  attributes: AttributeRow[];
};

export type ClassCoverageRow = {
  label: string;
  days: number;
};

export type ClassAttentionRow = {
  student_id: string;
  student_name: string;
  attention_score: number;
  status_label: StudentStatusLabel;
  last_evidence_days: number | null;
  next_action: string;
  is_ilp: boolean;
};

export type ClassAnalytics = {
  klass: ClassRow | null;
  students: StudentRow[];
  studentAnalytics: StudentAnalytics[];

  evidence: EvidenceEntryRow[];
  interventions: InterventionRow[];

  classHealthScore: number;
  evidenceCoverage: ClassCoverageRow[];
  openInterventionCount: number;
  overdueReviewCount: number;
  attentionList: ClassAttentionRow[];
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("column") || msg.includes("relation"));
}

function daysSince(value: string | null | undefined): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const now = new Date();
  const then = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.max(0, Math.floor((today.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)));
}

function studentDisplayName(student: StudentRow | null | undefined) {
  if (!student) return "Student";
  const first = safe(student.preferred_name) || safe(student.first_name);
  const last = safe(student.surname || student.family_name);
  return `${first}${last ? ` ${last}` : ""}`.trim() || "Student";
}

function coalesceDate(...xs: Array<string | null | undefined>) {
  for (const x of xs) {
    if (safe(x)) return safe(x);
  }
  return "";
}

function effectiveEvidenceDate(e: EvidenceEntryRow) {
  return safe(e.occurred_on) || safe(e.created_at);
}

function effectiveInterventionDate(i: InterventionRow) {
  return safe(i.updated_at) || safe(i.created_at);
}

function reviewDate(i: InterventionRow) {
  return coalesceDate(i.review_due_on, i.review_due_date, i.next_review_on, i.due_on);
}

function isClosedStatus(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return s === "closed" || s === "done" || s === "resolved" || s === "archived";
}

function normaliseAttributeScore(raw: number | null | undefined) {
  const n = Number(raw ?? 0);
  if (!Number.isFinite(n)) return 0;
  if (n <= 20) return clamp(Math.round((n / 20) * 100), 0, 100);
  return clamp(Math.round(n), 0, 100);
}

function average(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function sortEvidenceNewest(a: EvidenceEntryRow, b: EvidenceEntryRow) {
  return effectiveEvidenceDate(b).localeCompare(effectiveEvidenceDate(a));
}

function sortInterventionsNewest(a: InterventionRow, b: InterventionRow) {
  return effectiveInterventionDate(b).localeCompare(effectiveInterventionDate(a));
}

function sortInterventionsByReview(a: InterventionRow, b: InterventionRow) {
  const da = reviewDate(a);
  const db = reviewDate(b);

  if (da && db) return da.localeCompare(db);
  if (da) return -1;
  if (db) return 1;

  return sortInterventionsNewest(a, b);
}

function computeEvidenceFreshness(evidence: EvidenceEntryRow[]): EvidenceFreshnessRow[] {
  const buckets = [
    { label: "Writing", matchers: ["writing", "english", "literacy"] },
    { label: "Mathematics", matchers: ["math", "mathematics", "numeracy"] },
    { label: "Reading", matchers: ["reading"] },
    { label: "Wellbeing", matchers: ["wellbeing", "well-being", "behaviour", "behavior", "pastoral"] },
  ];

  return buckets.map((bucket) => {
    const match = evidence.find((e) => {
      const area = safe(e.learning_area).toLowerCase();
      return bucket.matchers.some((m) => area.includes(m));
    });

    const d = match ? daysSince(effectiveEvidenceDate(match)) : null;
    return { label: bucket.label, days: d == null ? 999 : d };
  });
}

function inferNextAction(args: {
  lastEvidenceDays: number | null;
  overdueReviews: InterventionRow[];
  openInterventions: InterventionRow[];
  isIlp: boolean;
}) {
  if (args.overdueReviews.length > 0) return "Complete overdue review";
  if ((args.lastEvidenceDays ?? 999) > 21) return "Capture fresh evidence";
  if (args.openInterventions.length > 0) return "Monitor current intervention";
  if (args.isIlp) return "Check ILP support rhythm";
  return "Monitor current plan";
}

function computeProfileConfidence(args: {
  evidenceCount: number;
  interventionCount: number;
  freshness: EvidenceFreshnessRow[];
  attributes: AttributeRow[];
}) {
  let score = 20;

  score += Math.min(args.evidenceCount * 8, 35);
  score += Math.min(args.interventionCount * 4, 12);

  const freshCount = args.freshness.filter((x) => x.days <= 21).length;
  score += freshCount * 6;

  if (args.attributes.length > 0) score += 9;

  return clamp(Math.round(score), 0, 100);
}

function computeAttentionScore(args: {
  lastEvidenceDays: number | null;
  overdueReviews: InterventionRow[];
  openInterventions: InterventionRow[];
  isIlp: boolean;
  attributes: AttributeRow[];
}) {
  let score = 10;

  const last = args.lastEvidenceDays ?? 999;
  if (last > 7) score += 10;
  if (last > 14) score += 15;
  if (last > 21) score += 20;

  score += args.overdueReviews.length * 18;
  score += Math.min(args.openInterventions.length * 8, 20);

  if (args.isIlp) score += 8;

  const attrPercents = args.attributes.map((a) => normaliseAttributeScore(a.score ?? a.value));
  const lowest = attrPercents.length ? Math.min(...attrPercents) : null;
  if (lowest != null && lowest < 40) score += 12;
  else if (lowest != null && lowest < 55) score += 6;

  return clamp(Math.round(score), 0, 100);
}

function computeStatusLabel(attentionScore: number): StudentStatusLabel {
  if (attentionScore >= 70) return "Attention";
  if (attentionScore >= 40) return "Watch";
  return "Stable";
}

/* ───────────────────────── LOW-LEVEL LOADERS ───────────────────────── */

async function loadStudentById(studentId: string): Promise<StudentRow | null> {
  const tries = [
    "id,class_id,first_name,preferred_name,surname,family_name,is_ilp,is_archived,created_at",
    "id,class_id,first_name,preferred_name,surname,is_ilp,is_archived,created_at",
    "id,class_id,first_name,preferred_name,family_name,is_ilp,is_archived,created_at",
    "id,class_id,first_name,preferred_name,is_ilp,is_archived,created_at",
  ];

  for (const sel of tries) {
    const r = await supabase.from("students").select(sel).eq("id", studentId).maybeSingle();
    if (!r.error) return (((r.data as unknown) as StudentRow) || null);
    if (!isMissingColumnError(r.error)) throw r.error;
  }

  return null;
}

async function loadClassById(classId: string): Promise<ClassRow | null> {
  const tries = [
    "id,name,year_level,teacher_name,room,created_at",
    "id,name,year_level,created_at",
  ];

  for (const sel of tries) {
    const r = await supabase.from("classes").select(sel).eq("id", classId).maybeSingle();
    if (!r.error) return (((r.data as unknown) as ClassRow) || null);
    if (!isMissingColumnError(r.error)) throw r.error;
  }

  return null;
}

async function loadStudentsForClass(classId: string): Promise<StudentRow[]> {
  const tries = [
    "id,class_id,first_name,preferred_name,surname,family_name,is_ilp,is_archived,created_at",
    "id,class_id,first_name,preferred_name,surname,is_ilp,is_archived,created_at",
    "id,class_id,first_name,preferred_name,family_name,is_ilp,is_archived,created_at",
    "id,class_id,first_name,preferred_name,is_ilp,is_archived,created_at",
  ];

  for (const sel of tries) {
    const r = await supabase
      .from("students")
      .select(sel)
      .eq("class_id", classId)
      .order("preferred_name", { ascending: true })
      .order("first_name", { ascending: true });

    if (!r.error) {
      return ((((r.data ?? []) as unknown) as StudentRow[])).filter((s) => !s.is_archived);
    }
    if (!isMissingColumnError(r.error)) throw r.error;
  }

  return [];
}

async function loadEvidenceForStudent(studentId: string): Promise<EvidenceEntryRow[]> {
  const r = await supabase
    .from("evidence_entries")
    .select("id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,visibility,is_deleted")
    .eq("student_id", studentId)
    .eq("is_deleted", false)
    .order("occurred_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (r.error) {
    if (isMissingRelationOrColumn(r.error)) return [];
    throw r.error;
  }

  return ((((r.data ?? []) as unknown) as EvidenceEntryRow[]))
    .filter((x) => !x.is_deleted)
    .sort(sortEvidenceNewest);
}

async function loadEvidenceForClass(classId: string): Promise<EvidenceEntryRow[]> {
  const r = await supabase
    .from("evidence_entries")
    .select("id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,visibility,is_deleted")
    .eq("class_id", classId)
    .eq("is_deleted", false)
    .order("occurred_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(2000);

  if (r.error) {
    if (isMissingRelationOrColumn(r.error)) return [];
    throw r.error;
  }

  return ((((r.data ?? []) as unknown) as EvidenceEntryRow[]))
    .filter((x) => !x.is_deleted)
    .sort(sortEvidenceNewest);
}

async function loadInterventionsForStudent(studentId: string): Promise<InterventionRow[]> {
  const r = await supabase
    .from("interventions")
    .select("*")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (r.error) {
    if (isMissingRelationOrColumn(r.error)) return [];
    throw r.error;
  }

  return ((((r.data ?? []) as unknown) as InterventionRow[])).sort(sortInterventionsNewest);
}

async function loadInterventionsForClass(classId: string): Promise<InterventionRow[]> {
  const r = await supabase
    .from("interventions")
    .select("*")
    .eq("class_id", classId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(2000);

  if (r.error) {
    if (isMissingRelationOrColumn(r.error)) return [];
    throw r.error;
  }

  return ((((r.data ?? []) as unknown) as InterventionRow[])).sort(sortInterventionsNewest);
}

async function loadAttributesForStudent(_studentId: string): Promise<AttributeRow[]> {
  // Placeholder-friendly:
  // If you later add a real student attribute table/view, wire it here once.
  // For now this safely returns no attributes so all consumers still work.
  return [];
}

/* ───────────────────────── ANALYTICS BUILDERS ───────────────────────── */

function buildStudentAnalytics(args: {
  student: StudentRow | null;
  klass: ClassRow | null;
  evidence: EvidenceEntryRow[];
  interventions: InterventionRow[];
  attributes: AttributeRow[];
}): StudentAnalytics {
  const evidence = [...args.evidence].sort(sortEvidenceNewest);
  const interventions = [...args.interventions].sort(sortInterventionsNewest);

  const openInterventions = interventions
    .filter((i) => !isClosedStatus(i.status))
    .sort(sortInterventionsByReview);

  const overdueReviews = openInterventions.filter((i) => {
    const rd = reviewDate(i);
    const days = daysSince(rd);
    return days != null && days > 0;
  });

  const lastEvidenceDays = evidence.length ? daysSince(effectiveEvidenceDate(evidence[0])) : null;
  const evidenceFreshness = computeEvidenceFreshness(evidence);

  const profileConfidence = computeProfileConfidence({
    evidenceCount: evidence.length,
    interventionCount: interventions.length,
    freshness: evidenceFreshness,
    attributes: args.attributes,
  });

  const attentionScore = computeAttentionScore({
    lastEvidenceDays,
    overdueReviews,
    openInterventions,
    isIlp: !!args.student?.is_ilp,
    attributes: args.attributes,
  });

  const statusLabel = computeStatusLabel(attentionScore);
  const nextAction = inferNextAction({
    lastEvidenceDays,
    overdueReviews,
    openInterventions,
    isIlp: !!args.student?.is_ilp,
  });

  return {
    student: args.student,
    klass: args.klass,
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
    attributes: args.attributes,
  };
}

/* ───────────────────────── EXPORTED LOADERS ───────────────────────── */

export async function loadStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
  const student = await loadStudentById(studentId);
  const klass = student?.class_id ? await loadClassById(student.class_id) : null;

  const [evidence, interventions, attributes] = await Promise.all([
    loadEvidenceForStudent(studentId),
    loadInterventionsForStudent(studentId),
    loadAttributesForStudent(studentId),
  ]);

  return buildStudentAnalytics({
    student,
    klass,
    evidence,
    interventions,
    attributes,
  });
}

export async function loadClassAnalytics(classId: string): Promise<ClassAnalytics> {
  const klass = await loadClassById(classId);
  const [students, evidence, interventions] = await Promise.all([
    loadStudentsForClass(classId),
    loadEvidenceForClass(classId),
    loadInterventionsForClass(classId),
  ]);

  const evidenceByStudent = new Map<string, EvidenceEntryRow[]>();
  for (const ev of evidence) {
    const sid = safe(ev.student_id);
    if (!sid) continue;
    if (!evidenceByStudent.has(sid)) evidenceByStudent.set(sid, []);
    evidenceByStudent.get(sid)!.push(ev);
  }

  const interventionsByStudent = new Map<string, InterventionRow[]>();
  for (const iv of interventions) {
    const sid = safe(iv.student_id);
    if (!sid) continue;
    if (!interventionsByStudent.has(sid)) interventionsByStudent.set(sid, []);
    interventionsByStudent.get(sid)!.push(iv);
  }

  const studentAnalytics: StudentAnalytics[] = [];
  for (const student of students) {
    const sa = buildStudentAnalytics({
      student,
      klass,
      evidence: (evidenceByStudent.get(student.id) ?? []).sort(sortEvidenceNewest),
      interventions: (interventionsByStudent.get(student.id) ?? []).sort(sortInterventionsNewest),
      attributes: await loadAttributesForStudent(student.id),
    });
    studentAnalytics.push(sa);
  }

  const openInterventionCount = studentAnalytics.reduce((sum, s) => sum + s.openInterventions.length, 0);
  const overdueReviewCount = studentAnalytics.reduce((sum, s) => sum + s.overdueReviews.length, 0);

  const classHealthScore = clamp(
    Math.round(
      average(
        studentAnalytics.map((s) => {
          const freshness = s.lastEvidenceDays == null ? 20 : Math.max(0, 100 - s.lastEvidenceDays * 3);
          const reviewPenalty = s.overdueReviews.length * 18;
          const openPenalty = Math.max(0, s.openInterventions.length - 1) * 6;
          return clamp(freshness - reviewPenalty - openPenalty, 0, 100);
        })
      )
    ),
    0,
    100
  );

  const coverageLabels = ["Writing", "Mathematics", "Reading", "Wellbeing"];
  const evidenceCoverage: ClassCoverageRow[] = coverageLabels.map((label) => {
    const relevant = studentAnalytics
      .map((s) => s.evidenceFreshness.find((f) => f.label === label)?.days ?? 999)
      .filter((n) => Number.isFinite(n));

    const avg = relevant.length ? Math.round(average(relevant)) : 999;
    return { label, days: avg };
  });

  const attentionList: ClassAttentionRow[] = studentAnalytics
    .map((s) => ({
      student_id: safe(s.student?.id),
      student_name: studentDisplayName(s.student),
      attention_score: s.attentionScore,
      status_label: s.statusLabel,
      last_evidence_days: s.lastEvidenceDays,
      next_action: s.nextAction,
      is_ilp: !!s.student?.is_ilp,
    }))
    .sort((a, b) => b.attention_score - a.attention_score || a.student_name.localeCompare(b.student_name))
    .slice(0, 12);

  return {
    klass,
    students,
    studentAnalytics,
    evidence,
    interventions,
    classHealthScore,
    evidenceCoverage,
    openInterventionCount,
    overdueReviewCount,
    attentionList,
  };
}