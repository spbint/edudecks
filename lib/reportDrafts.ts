import { supabase } from "@/lib/supabaseClient";

export type ReportMode =
  | "family-summary"
  | "authority-ready"
  | "progress-review"
  | string;

export type PeriodMode =
  | "term"
  | "semester"
  | "year"
  | "all"
  | string;

export type PreferredMarket = "au" | "uk" | "us" | string;

export type ReportDraftStatus =
  | "draft"
  | "final"
  | "submitted"
  | "archived"
  | string;

export type SelectionMetaItem = {
  role?: "core" | "appendix" | string;
  required?: boolean;
  note?: string;
};

export type SelectionMetaMap = Record<string, SelectionMetaItem>;

export type ReportDraftRow = {
  id: string;
  user_id?: string | null;

  child_id?: string | null;
  student_id?: string | null;

  child_name: string;

  title: string;

  report_mode: ReportMode;
  period_mode: PeriodMode;
  preferred_market: PreferredMarket;

  selected_evidence_ids: string[];
  selection_meta: SelectionMetaMap;
  selected_areas: string[];

  include_appendix: boolean;
  include_action_plan: boolean;
  include_weekly_plan: boolean;
  include_readiness_notes: boolean;

  notes: string;

  status: ReportDraftStatus;

  created_at: string | null;
  updated_at: string | null;
};

export type SaveReportDraftInput = {
  id?: string;
  child_id?: string | null;
  student_id?: string | null;
  child_name?: string;
  title?: string;
  report_mode?: ReportMode;
  period_mode?: PeriodMode;
  preferred_market?: PreferredMarket;
  selected_evidence_ids?: string[];
  selection_meta?: SelectionMetaMap;
  selected_areas?: string[];
  include_appendix?: boolean;
  include_action_plan?: boolean;
  include_weekly_plan?: boolean;
  include_readiness_notes?: boolean;
  notes?: string;
  status?: ReportDraftStatus;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((x) => safe(x)).filter(Boolean)));
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function asObject<T extends object>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

function normalizeStatus(value: unknown): ReportDraftStatus {
  const s = safe(value).toLowerCase();
  if (s === "final") return "final";
  if (s === "submitted") return "submitted";
  if (s === "archived") return "archived";
  return "draft";
}

function sanitizeSelectionMeta(value: unknown): SelectionMetaMap {
  const raw = asObject<Record<string, unknown>>(value, {});
  const next: SelectionMetaMap = {};

  for (const key of Object.keys(raw)) {
    const cleanKey = safe(key);
    if (!cleanKey) continue;

    const item = asObject<Record<string, unknown>>(raw[key], {});
    next[cleanKey] = {
      role:
        safe(item.role) === "appendix"
          ? "appendix"
          : safe(item.role) === "core"
          ? "core"
          : undefined,
      required: asBoolean(item.required, false),
      note: safe(item.note) || undefined,
    };
  }

  return next;
}

function deriveTitle(row: any) {
  const explicit = safe(row?.title);
  if (explicit) return explicit;

  const childName = safe(row?.child_name) || "Child";
  const mode = modeLabel(row?.report_mode || "family-summary");
  const period = periodLabel(row?.period_mode || "term");
  return `${childName} • ${mode} • ${period}`;
}

function normalizeSelectedAreas(row: any): string[] {
  if (Array.isArray(row?.selected_areas)) {
    return asStringArray(row.selected_areas);
  }

  const meta = sanitizeSelectionMeta(row?.selection_meta);
  const inferred = new Set<string>();

  for (const key of Object.keys(meta)) {
    const item = meta[key];
    const note = safe(item?.note);
    if (note) inferred.add(note);
  }

  return [...inferred];
}

function normalizeRow(row: any): ReportDraftRow {
  return {
    id: safe(row?.id),
    user_id: safe(row?.user_id) || null,

    child_id: safe(row?.child_id) || null,
    student_id: safe(row?.student_id) || null,

    child_name: safe(row?.child_name) || "Child",

    title: deriveTitle(row),

    report_mode: safe(row?.report_mode) || "family-summary",
    period_mode: safe(row?.period_mode) || "term",
    preferred_market: safe(row?.preferred_market) || "au",

    selected_evidence_ids: asStringArray(row?.selected_evidence_ids),
    selection_meta: sanitizeSelectionMeta(row?.selection_meta),
    selected_areas: normalizeSelectedAreas(row),

    include_appendix: asBoolean(row?.include_appendix, false),
    include_action_plan: asBoolean(row?.include_action_plan, false),
    include_weekly_plan: asBoolean(row?.include_weekly_plan, false),
    include_readiness_notes: asBoolean(row?.include_readiness_notes, false),

    notes: safe(row?.notes),

    status: normalizeStatus(row?.status),

    created_at: safe(row?.created_at) || null,
    updated_at: safe(row?.updated_at) || null,
  };
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || "Failed to resolve current session.");
  }

  if (!session?.user?.id) {
    throw new Error("User not authenticated.");
  }

  return session.user.id;
}

function assertValidDraftId(id: unknown): string {
  const value = safe(id);
  if (!value) throw new Error("A valid report draft ID is required.");
  return value;
}

function buildPayload(input: SaveReportDraftInput, userId: string) {
  const childName = safe(input.child_name) || "Child";
  const reportMode = safe(input.report_mode) || "family-summary";
  const periodMode = safe(input.period_mode) || "term";

  return {
    user_id: userId,

    child_id: safe(input.child_id) || null,
    student_id: safe(input.student_id) || null,

    child_name: childName,

    title:
      safe(input.title) ||
      `${childName} • ${modeLabel(reportMode)} • ${periodLabel(periodMode)}`,

    report_mode: reportMode,
    period_mode: periodMode,
    preferred_market: safe(input.preferred_market) || "au",

    selected_evidence_ids: asStringArray(input.selected_evidence_ids),
    selection_meta: sanitizeSelectionMeta(input.selection_meta),
    selected_areas: asStringArray(input.selected_areas),

    include_appendix: Boolean(input.include_appendix),
    include_action_plan: Boolean(input.include_action_plan),
    include_weekly_plan: Boolean(input.include_weekly_plan),
    include_readiness_notes: Boolean(input.include_readiness_notes),

    notes: safe(input.notes),
    status: normalizeStatus(input.status),

    updated_at: new Date().toISOString(),
  };
}

async function getOwnedDraftOrNull(
  id: string,
  userId: string
): Promise<ReportDraftRow | null> {
  const { data, error } = await supabase
    .from("report_drafts")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load report draft.");
  }

  return data ? normalizeRow(data) : null;
}

function assertMutableDraftStatus(status: ReportDraftStatus) {
  if (status === "final" || status === "submitted" || status === "archived") {
    throw new Error(
      `This report is locked because its status is '${status}'. Duplicate it to continue editing.`
    );
  }
}

export function marketLabel(value?: string | null) {
  const v = safe(value).toLowerCase();
  if (v === "au") return "Australia";
  if (v === "uk") return "United Kingdom";
  if (v === "us") return "United States";
  return value || "Unknown";
}

export function modeLabel(value?: string | null) {
  const v = safe(value).toLowerCase();
  if (v === "family-summary") return "Family Summary";
  if (v === "authority-ready") return "Authority Ready";
  if (v === "progress-review") return "Progress Review";
  return value || "Unknown";
}

export function periodLabel(value?: string | null) {
  const v = safe(value).toLowerCase();
  if (v === "term") return "Term";
  if (v === "semester") return "Semester";
  if (v === "year") return "Year";
  if (v === "all") return "All Time";
  return value || "Unknown";
}

export async function listReportDrafts(): Promise<ReportDraftRow[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("report_drafts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to list report drafts.");
  }

  return (data || []).map(normalizeRow);
}

export async function loadLatestReportDraft(): Promise<ReportDraftRow | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("report_drafts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load latest report draft.");
  }

  return data ? normalizeRow(data) : null;
}

export async function loadReportDraftById(
  id: string
): Promise<ReportDraftRow | null> {
  const safeId = assertValidDraftId(id);
  const userId = await getCurrentUserId();

  const draft = await getOwnedDraftOrNull(safeId, userId);
  return draft;
}

export async function saveReportDraft(
  input: SaveReportDraftInput
): Promise<ReportDraftRow> {
  const userId = await getCurrentUserId();
  const payload = buildPayload(input, userId);

  if (safe(input.id)) {
    const existing = await getOwnedDraftOrNull(assertValidDraftId(input.id), userId);

    if (!existing) {
      throw new Error("Report draft not found.");
    }

    assertMutableDraftStatus(existing.status);

    const { data, error } = await supabase
      .from("report_drafts")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to update report draft.");
    }

    if (!data) {
      throw new Error("Report draft update returned no row.");
    }

    return normalizeRow(data);
  }

  const { data, error } = await supabase
    .from("report_drafts")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to create report draft.");
  }

  if (!data) {
    throw new Error("Report draft create returned no row.");
  }

  return normalizeRow(data);
}

export async function updateReportDraftStatus(
  id: string,
  status: ReportDraftStatus
): Promise<ReportDraftRow> {
  const safeId = assertValidDraftId(id);
  const userId = await getCurrentUserId();
  const existing = await getOwnedDraftOrNull(safeId, userId);

  if (!existing) {
    throw new Error("Report draft not found.");
  }

  const nextStatus = normalizeStatus(status);

  if (existing.status === "submitted" && nextStatus !== "submitted") {
    throw new Error("Submitted reports cannot be moved back to an editable state.");
  }

  const { data, error } = await supabase
    .from("report_drafts")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", safeId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to update report status.");
  }

  if (!data) {
    throw new Error("Report status update returned no row.");
  }

  return normalizeRow(data);
}

export async function finalizeReportDraft(id: string): Promise<ReportDraftRow> {
  return updateReportDraftStatus(id, "final");
}

export async function submitReportDraft(id: string): Promise<ReportDraftRow> {
  return updateReportDraftStatus(id, "submitted");
}

export async function archiveReportDraft(id: string): Promise<ReportDraftRow> {
  return updateReportDraftStatus(id, "archived");
}

export async function deleteReportDraft(id: string): Promise<void> {
  const safeId = assertValidDraftId(id);
  const userId = await getCurrentUserId();
  const existing = await getOwnedDraftOrNull(safeId, userId);

  if (!existing) {
    throw new Error("Report draft not found.");
  }

  if (existing.status === "submitted") {
    throw new Error("Submitted reports cannot be deleted.");
  }

  const { error } = await supabase
    .from("report_drafts")
    .delete()
    .eq("id", safeId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to delete report draft.");
  }
}

export async function duplicateReportDraft(id: string): Promise<ReportDraftRow> {
  const current = await loadReportDraftById(id);

  if (!current) {
    throw new Error("Could not find report draft to duplicate.");
  }

  return saveReportDraft({
    child_id: current.child_id,
    student_id: current.student_id,
    child_name: current.child_name,
    title: `${current.title} (Copy)`,
    report_mode: current.report_mode,
    period_mode: current.period_mode,
    preferred_market: current.preferred_market,
    selected_evidence_ids: current.selected_evidence_ids,
    selection_meta: current.selection_meta,
    selected_areas: current.selected_areas,
    include_appendix: current.include_appendix,
    include_action_plan: current.include_action_plan,
    include_weekly_plan: current.include_weekly_plan,
    include_readiness_notes: current.include_readiness_notes,
    notes: current.notes,
    status: "draft",
  });
}