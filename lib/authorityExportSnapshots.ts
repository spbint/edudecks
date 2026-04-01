import { supabase } from "@/lib/supabaseClient";

export type AuthorityExportType = "pdf" | "docx" | "print";

export type AuthoritySubmissionStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "revision-needed"
  | "archived";

export type AuthorityExportSnapshotRow = {
  id: string;
  draft_id: string;
  student_id: string | null;
  title: string | null;
  jurisdiction: string | null;
  confidence_score: number | null;
  confidence_band: string | null;
  selected_evidence_ids: string[];
  included_sections: string[];
  pack_config: any;
  export_type: AuthorityExportType | string | null;
  submission_status: AuthoritySubmissionStatus | string | null;
  created_at: string | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => safe(x)).filter(Boolean);
}

function safeRow(row: any): AuthorityExportSnapshotRow {
  return {
    id: safe(row?.id),
    draft_id: safe(row?.draft_id),
    student_id: safe(row?.student_id) || null,
    title: safe(row?.title) || null,
    jurisdiction: safe(row?.jurisdiction) || null,
    confidence_score:
      typeof row?.confidence_score === "number"
        ? row.confidence_score
        : Number.isFinite(Number(row?.confidence_score))
        ? Number(row.confidence_score)
        : null,
    confidence_band: safe(row?.confidence_band) || null,
    selected_evidence_ids: asStringArray(row?.selected_evidence_ids),
    included_sections: asStringArray(row?.included_sections),
    pack_config: row?.pack_config ?? null,
    export_type: safe(row?.export_type) || null,
    submission_status: safe(row?.submission_status) || "draft",
    created_at: safe(row?.created_at) || null,
  };
}

export async function saveAuthorityExportSnapshot(payload: {
  draftId: string;
  studentId?: string;
  title: string;
  jurisdiction: string;
  confidenceScore: number;
  confidenceBand: string;
  selectedEvidenceIds: string[];
  includedSections: string[];
  packConfig: any;
  exportType: AuthorityExportType;
  submissionStatus?: AuthoritySubmissionStatus;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase.from("authority_export_snapshots").insert({
    user_id: user.id,
    draft_id: payload.draftId,
    student_id: payload.studentId || null,
    title: payload.title,
    jurisdiction: payload.jurisdiction,
    confidence_score: payload.confidenceScore,
    confidence_band: payload.confidenceBand,
    selected_evidence_ids: payload.selectedEvidenceIds,
    included_sections: payload.includedSections,
    pack_config: payload.packConfig,
    export_type: payload.exportType,
    submission_status: payload.submissionStatus || "draft",
  });

  if (error) {
    console.error("Snapshot save failed:", error);
    throw new Error(error.message);
  }
}

export async function listAuthorityExportSnapshots(): Promise<
  AuthorityExportSnapshotRow[]
> {
  const { data, error } = await supabase
    .from("authority_export_snapshots")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Snapshot list failed:", error);
    throw new Error(error.message);
  }

  return (data || []).map(safeRow);
}

export async function updateAuthorityExportSnapshotStatus(payload: {
  snapshotId: string;
  submissionStatus: AuthoritySubmissionStatus;
}) {
  const { error } = await supabase
    .from("authority_export_snapshots")
    .update({
      submission_status: payload.submissionStatus,
    })
    .eq("id", payload.snapshotId);

  if (error) {
    console.error("Snapshot status update failed:", error);
    throw new Error(error.message);
  }
}