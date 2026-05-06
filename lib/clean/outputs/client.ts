import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import type {
  CleanReportExport,
  CleanReportExportFormat,
  CreateCleanReportExportInput,
} from "@/lib/clean/outputs/types";

type ReportExportRow = {
  id: string;
  report_id: string;
  family_id: string;
  learner_id: string;
  export_format?: string | null;
  exported_by_user_id: string;
  created_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function normalizeExportFormat(value: unknown): CleanReportExportFormat {
  const format = safe(value);
  if (format === "html" || format === "docx") return format;
  return "pdf";
}

function toCleanReportExport(row: ReportExportRow): CleanReportExport {
  return {
    id: safe(row.id),
    reportId: safe(row.report_id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    exportFormat: normalizeExportFormat(row.export_format),
    exportedByUserId: safe(row.exported_by_user_id),
    createdAt: normalizeNullString(row.created_at),
  };
}

function sortExports(items: CleanReportExport[]) {
  return [...items].sort((left, right) => {
    const leftCreated = Date.parse(left.createdAt || "");
    const rightCreated = Date.parse(right.createdAt || "");

    if (!Number.isNaN(leftCreated) || !Number.isNaN(rightCreated)) {
      if (Number.isNaN(leftCreated)) return 1;
      if (Number.isNaN(rightCreated)) return -1;
      if (leftCreated !== rightCreated) return rightCreated - leftCreated;
    }

    return left.id.localeCompare(right.id);
  });
}

export async function listCleanReportExports(familyId: string, reportId: string) {
  if (!safe(reportId)) {
    throw new Error("A report is required.");
  }

  const response = await supabase
    .from("report_exports")
    .select(
      "id,report_id,family_id,learner_id,export_format,exported_by_user_id,created_at",
    )
    .eq("family_id", familyId)
    .eq("report_id", reportId)
    .order("created_at", { ascending: false });

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean report exports just now.",
      ),
    );
  }

  return sortExports(
    (response.data ?? []).map((row) => toCleanReportExport(row as ReportExportRow)),
  );
}

export async function createCleanReportExport(
  familyId: string,
  input: CreateCleanReportExportInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before recording a report export.");
  }

  const reportId = safe(input.reportId);
  const learnerId = safe(input.learnerId);
  const exportFormat = normalizeExportFormat(input.exportFormat);

  if (!reportId) {
    throw new Error("A report is required.");
  }

  if (!learnerId) {
    throw new Error("A learner is required.");
  }

  const response = await supabase
    .from("report_exports")
    .insert({
      report_id: reportId,
      family_id: familyId,
      learner_id: learnerId,
      export_format: exportFormat,
      exported_by_user_id: currentUserId,
    })
    .select(
      "id,report_id,family_id,learner_id,export_format,exported_by_user_id,created_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to record the clean report export.",
      ),
    );
  }

  return toCleanReportExport(response.data as ReportExportRow);
}
