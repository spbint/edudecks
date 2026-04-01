import { supabase } from "@/lib/supabaseClient";

export type ReportRole = "core" | "appendix";

export type CurationFlags = {
  reportRole?: ReportRole;
  portfolioPinned?: boolean;
  conferencePinned?: boolean;
  exemplar?: boolean;
  weak?: boolean;
  needsRewrite?: boolean;
};

export type CurationMap = Record<string, CurationFlags>;

export type StudentEvidenceCurationRow = {
  id: string;
  student_id: string;
  evidence_id: string;
  report_role: ReportRole | null;
  portfolio_pinned: boolean;
  conference_pinned: boolean;
  exemplar: boolean;
  weak: boolean;
  needs_rewrite: boolean;
  created_at: string;
  updated_at: string;
};

function normalizeFlags(flags?: CurationFlags): CurationFlags {
  return {
    reportRole:
      flags?.reportRole === "core" || flags?.reportRole === "appendix"
        ? flags.reportRole
        : undefined,
    portfolioPinned: Boolean(flags?.portfolioPinned),
    conferencePinned: Boolean(flags?.conferencePinned),
    exemplar: Boolean(flags?.exemplar),
    weak: Boolean(flags?.weak),
    needsRewrite: Boolean(flags?.needsRewrite),
  };
}

function isEmptyFlags(flags?: CurationFlags) {
  const f = normalizeFlags(flags);
  return !(
    f.reportRole ||
    f.portfolioPinned ||
    f.conferencePinned ||
    f.exemplar ||
    f.weak ||
    f.needsRewrite
  );
}

export function rowToFlags(row: StudentEvidenceCurationRow): CurationFlags {
  return {
    reportRole: row.report_role ?? undefined,
    portfolioPinned: Boolean(row.portfolio_pinned),
    conferencePinned: Boolean(row.conference_pinned),
    exemplar: Boolean(row.exemplar),
    weak: Boolean(row.weak),
    needsRewrite: Boolean(row.needs_rewrite),
  };
}

export function rowsToCurationMap(
  rows: StudentEvidenceCurationRow[]
): CurationMap {
  return rows.reduce<CurationMap>((acc, row) => {
    acc[row.evidence_id] = rowToFlags(row);
    return acc;
  }, {});
}

export async function listStudentEvidenceCuration(studentId: string) {
  const { data, error } = await supabase
    .from("student_evidence_curation")
    .select("*")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as StudentEvidenceCurationRow[];
}

export async function upsertStudentEvidenceCuration(
  studentId: string,
  evidenceId: string,
  flags: CurationFlags
) {
  const normalized = normalizeFlags(flags);

  if (isEmptyFlags(normalized)) {
    const { error } = await supabase
      .from("student_evidence_curation")
      .delete()
      .eq("student_id", studentId)
      .eq("evidence_id", evidenceId);

    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase
    .from("student_evidence_curation")
    .upsert(
      {
        student_id: studentId,
        evidence_id: evidenceId,
        report_role: normalized.reportRole ?? null,
        portfolio_pinned: Boolean(normalized.portfolioPinned),
        conference_pinned: Boolean(normalized.conferencePinned),
        exemplar: Boolean(normalized.exemplar),
        weak: Boolean(normalized.weak),
        needs_rewrite: Boolean(normalized.needsRewrite),
      },
      { onConflict: "student_id,evidence_id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as StudentEvidenceCurationRow;
}

export async function deleteStudentEvidenceCuration(
  studentId: string,
  evidenceId: string
) {
  const { error } = await supabase
    .from("student_evidence_curation")
    .delete()
    .eq("student_id", studentId)
    .eq("evidence_id", evidenceId);

  if (error) throw error;
}

export async function replaceStudentEvidenceCurationMap(
  studentId: string,
  map: CurationMap
) {
  const rows = Object.entries(map)
    .map(([evidenceId, flags]) => {
      const normalized = normalizeFlags(flags);
      if (isEmptyFlags(normalized)) return null;

      return {
        student_id: studentId,
        evidence_id: evidenceId,
        report_role: normalized.reportRole ?? null,
        portfolio_pinned: Boolean(normalized.portfolioPinned),
        conference_pinned: Boolean(normalized.conferencePinned),
        exemplar: Boolean(normalized.exemplar),
        weak: Boolean(normalized.weak),
        needs_rewrite: Boolean(normalized.needsRewrite),
      };
    })
    .filter(Boolean) as Array<Record<string, any>>;

  const { error: deleteError } = await supabase
    .from("student_evidence_curation")
    .delete()
    .eq("student_id", studentId);

  if (deleteError) throw deleteError;

  if (!rows.length) return [];

  const { data, error } = await supabase
    .from("student_evidence_curation")
    .insert(rows)
    .select("*");

  if (error) throw error;
  return (data ?? []) as StudentEvidenceCurationRow[];
}