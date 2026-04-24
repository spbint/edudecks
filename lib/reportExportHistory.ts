import type { ReportGateStatus } from "@/lib/reportCompletionGate";
import { supabase } from "@/lib/supabaseClient";

type QueryClient = Pick<typeof supabase, "from">;

export type ReportExportPhase = "validated_server_export";
export type ReportExportFormat = "html" | "docx";

export type ReportExportHistoryEntry = {
  id: string;
  reportDocumentId: string;
  reportingPeriodId: string | null;
  learnerId: string;
  familyId: string | null;
  jurisdictionCode: string | null;
  exportFormat: ReportExportFormat;
  exportPhase: ReportExportPhase;
  exportedByUserId: string | null;
  exportedByDisplayName: string | null;
  validationStatus: ReportGateStatus;
  validationScore: number | null;
  filename: string | null;
  contentHash: string | null;
  sectionCount: number | null;
  createdAt: string;
};

export type ReportExportHistoryInput = Omit<
  ReportExportHistoryEntry,
  "id" | "createdAt"
>;

type LoadReportExportHistoryInput = {
  reportDocumentId: string;
  limit?: number;
  client?: QueryClient;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeReportExportHistoryEntry(
  row: unknown,
): ReportExportHistoryEntry {
  const data = asObject(row);
  return {
    id: safe(data.id),
    reportDocumentId: safe(data.report_document_id),
    reportingPeriodId: safe(data.reporting_period_id) || null,
    learnerId: safe(data.learner_id),
    familyId: safe(data.family_id) || null,
    jurisdictionCode: safe(data.jurisdiction_code) || null,
    exportFormat: (safe(data.export_format) || "html") as ReportExportFormat,
    exportPhase:
      (safe(data.export_phase) || "validated_server_export") as ReportExportPhase,
    exportedByUserId: safe(data.exported_by_user_id) || null,
    exportedByDisplayName: safe(data.exported_by_display_name) || null,
    validationStatus: (safe(data.validation_status) || "ready_for_export") as ReportGateStatus,
    validationScore: asNumber(data.validation_score),
    filename: safe(data.filename) || null,
    contentHash: safe(data.content_hash) || null,
    sectionCount: asNumber(data.section_count),
    createdAt: safe(data.exported_at) || safe(data.created_at) || "",
  };
}

export async function recordReportExportEvent(
  client: QueryClient,
  payload: ReportExportHistoryInput,
) {
  const response = await client
    .from("report_export_events")
    .insert({
      report_document_id: payload.reportDocumentId,
      reporting_period_id: payload.reportingPeriodId,
      learner_id: payload.learnerId,
      family_id: payload.familyId,
      jurisdiction_code: payload.jurisdictionCode,
      export_format: payload.exportFormat,
      export_phase: payload.exportPhase,
      exported_by_user_id: payload.exportedByUserId,
      exported_by_display_name: payload.exportedByDisplayName,
      validation_status: payload.validationStatus,
      validation_score: payload.validationScore,
      filename: payload.filename,
      content_hash: payload.contentHash,
      section_count: payload.sectionCount,
    })
    .select("*")
    .maybeSingle();

  if (response.error) {
    throw response.error;
  }

  if (!response.data) {
    throw new Error("Report export event could not be saved.");
  }

  return normalizeReportExportHistoryEntry(response.data);
}

export async function loadReportExportHistory(
  input: LoadReportExportHistoryInput,
): Promise<ReportExportHistoryEntry[]> {
  const db = input.client ?? supabase;
  const response = await db
    .from("report_export_events")
    .select("*")
    .eq("report_document_id", input.reportDocumentId)
    .order("exported_at", { ascending: false })
    .limit(input.limit ?? 8);

  if (response.error) {
    throw response.error;
  }

  return Array.isArray(response.data)
    ? response.data.map((row) => normalizeReportExportHistoryEntry(row))
    : [];
}

export function summarizeReportExportHistoryEntry(
  entry: ReportExportHistoryEntry,
) {
  const when = entry.createdAt ? new Date(entry.createdAt) : null;
  return {
    exportedAtLabel:
      when && !Number.isNaN(when.getTime())
        ? when.toLocaleString()
        : entry.createdAt || "Unknown",
    validationLabel: entry.validationStatus.replace("_", " "),
    exporterLabel:
      entry.exportedByDisplayName || entry.exportedByUserId || "Unknown",
  };
}
