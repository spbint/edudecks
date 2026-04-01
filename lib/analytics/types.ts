export type StudentRow = {
  id: string;
  class_id: string | null;
  first_name: string | null;
  preferred_name: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  created_at?: string | null;
  [k: string]: any;
};

export type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
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
  student_id: string | null;
  class_id: string | null;
  title?: string | null;
  notes?: string | null;
  note?: string | null;
  status?: string | null;
  priority?: string | null;
  tier?: any;
  strategy?: string | null;
  due_on?: string | null;
  next_review_on?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: any;
};

export type EvidenceFreshnessBucket = {
  label: string;
  days: number;
};

export type StudentAttributeTrend = "up" | "flat" | "down";

export type StudentAttribute = {
  key:
    | "reading"
    | "writing"
    | "mathematics"
    | "reasoning"
    | "focus"
    | "independence"
    | "organisation"
    | "task_completion"
    | "collaboration"
    | "resilience";
  label: string;
  score: number;
  trend: StudentAttributeTrend;
};

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
  statusLabel: "Stable" | "Watch" | "Attention";
  nextAction: string;
  evidenceFreshness: EvidenceFreshnessBucket[];
  attributes: StudentAttribute[];
};

export type StudentAttentionItem = {
  student_id: string;
  student_name: string;
  class_id: string | null;
  attention_score: number;
  status_label: "Stable" | "Watch" | "Attention";
  last_evidence_days: number | null;
  overdue_reviews: number;
  open_interventions: number;
  next_action: string;
  is_ilp: boolean;
};

export type ClassAnalytics = {
  klass: ClassRow | null;
  students: StudentRow[];
  evidence: EvidenceEntryRow[];
  interventions: InterventionRow[];
  studentAnalytics: StudentAnalytics[];
  classHealthScore: number;
  evidenceCoverage: EvidenceFreshnessBucket[];
  openInterventionCount: number;
  overdueReviewCount: number;
  attentionList: StudentAttentionItem[];
};