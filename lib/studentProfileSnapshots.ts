import { supabase } from "@/lib/supabaseClient";

export type SnapshotStatus = "draft" | "final" | "archived";

export type StudentProfileSnapshotInput = {
  studentId: string;
  classId?: string | null;
  snapshotTitle?: string;

  attentionStatus?: string | null;
  nextAction?: string | null;
  momentum?: string | null;

  evidenceQuality: number;
  reportingReadiness: number;
  authorityReadiness: number;
  trajectoryForecast: number;
  supportEffectiveness: number;
  conferenceReadiness: number;

  totalEvidence: number;
  evidence30d: number;
  openInterventionsCount: number;
  overdueReviewsCount: number;
  lastEvidenceAt?: string | null;

  strongAreas: string[];
  watchAreas: string[];

  nextActions: any[];

  scoreCardJson: any;
  reportingSummaryJson: any;
  conferenceBriefJson: any;
  curationJson: any;
  selectedEvidenceIds: string[];

  snapshotJson: any;
  status?: SnapshotStatus;
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function createStudentProfileSnapshot(
  input: StudentProfileSnapshotInput
) {
  const { data, error } = await supabase
    .from("student_profile_snapshots")
    .insert({
      student_id: input.studentId,
      class_id: input.classId ?? null,
      snapshot_title:
        input.snapshotTitle || `Snapshot ${new Date().toISOString().slice(0, 10)}`,

      attention_status: input.attentionStatus,
      next_action: input.nextAction,
      momentum: input.momentum,

      evidence_quality: clamp(input.evidenceQuality),
      reporting_readiness: clamp(input.reportingReadiness),
      authority_readiness: clamp(input.authorityReadiness),
      trajectory_forecast: clamp(input.trajectoryForecast),
      support_effectiveness: clamp(input.supportEffectiveness),
      conference_readiness: clamp(input.conferenceReadiness),

      total_evidence: input.totalEvidence,
      evidence_30d: input.evidence30d,
      open_interventions_count: input.openInterventionsCount,
      overdue_reviews_count: input.overdueReviewsCount,
      last_evidence_at: input.lastEvidenceAt,

      strong_areas: input.strongAreas,
      watch_areas: input.watchAreas,
      next_actions: input.nextActions,

      score_card_json: input.scoreCardJson,
      reporting_summary_json: input.reportingSummaryJson,
      conference_brief_json: input.conferenceBriefJson,
      curation_json: input.curationJson,
      selected_evidence_ids: input.selectedEvidenceIds,

      snapshot_json: input.snapshotJson,
      status: input.status || "draft",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listStudentProfileSnapshots(studentId: string) {
  const { data, error } = await supabase
    .from("student_profile_snapshots")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateSnapshotStatus(id: string, status: SnapshotStatus) {
  const { data, error } = await supabase
    .from("student_profile_snapshots")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSnapshot(id: string) {
  const { error } = await supabase
    .from("student_profile_snapshots")
    .delete()
    .eq("id", id);

  if (error) throw error;
}