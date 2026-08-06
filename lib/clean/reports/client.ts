import { supabase } from "@/lib/supabaseClient";
import { requestCoachStateRefresh } from "@/lib/clean/coach/coachRefresh";
import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import type {
  CleanReport,
  CleanReportInput,
  CleanReportsOptions,
  CleanReportSection,
  CleanReportSectionInput,
  CleanReportSectionsOptions,
  CleanReportStatus,
  CleanReportUpdate,
  CleanReportingPeriod,
  CleanReportingPeriodInput,
  CleanReportingPeriodsOptions,
  CleanReportingPeriodUpdate,
} from "@/lib/clean/reports/types";

type ReportingPeriodRow = {
  id: string;
  family_id: string;
  learner_id: string;
  title: string;
  starts_on: string;
  ends_on: string;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type ReportRow = {
  id: string;
  family_id: string;
  learner_id: string;
  reporting_period_id: string;
  title: string;
  status?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type ReportSectionRow = {
  id: string;
  report_id: string;
  family_id: string;
  learner_id: string;
  section_key: string;
  heading: string;
  content: string;
  sort_order?: number | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number.parseInt(safe(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeReportStatus(value: unknown): CleanReportStatus {
  const status = safe(value);
  if (status === "ready" || status === "archived") return status;
  return "draft";
}

function toCleanReportingPeriod(row: ReportingPeriodRow): CleanReportingPeriod {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    title: safe(row.title),
    startsOn: safe(row.starts_on),
    endsOn: safe(row.ends_on),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toCleanReport(row: ReportRow): CleanReport {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    reportingPeriodId: safe(row.reporting_period_id),
    title: safe(row.title),
    status: normalizeReportStatus(row.status),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toCleanReportSection(row: ReportSectionRow): CleanReportSection {
  return {
    id: safe(row.id),
    reportId: safe(row.report_id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    sectionKey: safe(row.section_key),
    heading: safe(row.heading),
    content: safe(row.content),
    sortOrder: normalizeNumber(row.sort_order),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function sortReportingPeriods(items: CleanReportingPeriod[]) {
  return [...items].sort((left, right) => {
    const startCompare = right.startsOn.localeCompare(left.startsOn);
    if (startCompare !== 0) return startCompare;
    return left.title.localeCompare(right.title);
  });
}

function sortReports(items: CleanReport[]) {
  return [...items].sort((left, right) => {
    const leftUpdated = Date.parse(left.updatedAt || left.createdAt || "");
    const rightUpdated = Date.parse(right.updatedAt || right.createdAt || "");

    if (!Number.isNaN(leftUpdated) || !Number.isNaN(rightUpdated)) {
      if (Number.isNaN(leftUpdated)) return 1;
      if (Number.isNaN(rightUpdated)) return -1;
      if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;
    }

    return left.title.localeCompare(right.title);
  });
}

function sortReportSections(items: CleanReportSection[]) {
  return [...items].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.heading.localeCompare(right.heading);
  });
}

function sanitizeReportingPeriodInput(
  input: CleanReportingPeriodInput | CleanReportingPeriodUpdate,
) {
  return {
    learner_id:
      "learnerId" in input && input.learnerId !== undefined
        ? normalizeNullString(input.learnerId)
        : undefined,
    title:
      "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    starts_on:
      "startsOn" in input && input.startsOn !== undefined
        ? safe(input.startsOn) || null
        : undefined,
    ends_on:
      "endsOn" in input && input.endsOn !== undefined
        ? safe(input.endsOn) || null
        : undefined,
  };
}

function sanitizeReportInput(input: CleanReportInput | CleanReportUpdate) {
  return {
    learner_id:
      "learnerId" in input && input.learnerId !== undefined
        ? normalizeNullString(input.learnerId)
        : undefined,
    reporting_period_id:
      "reportingPeriodId" in input && input.reportingPeriodId !== undefined
        ? normalizeNullString(input.reportingPeriodId)
        : undefined,
    title:
      "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    status:
      "status" in input && input.status !== undefined
        ? normalizeReportStatus(input.status)
        : undefined,
  };
}

function sanitizeReportSectionInput(input: CleanReportSectionInput) {
  return {
    report_id: normalizeNullString(input.reportId),
    learner_id: normalizeNullString(input.learnerId),
    section_key: safe(input.sectionKey) || null,
    heading: safe(input.heading) || null,
    content: safe(input.content),
    sort_order: normalizeNumber(input.sortOrder),
  };
}

export async function listCleanReportingPeriods(
  familyId: string,
  options: CleanReportingPeriodsOptions = {},
) {
  let query = supabase
    .from("reporting_periods")
    .select(
      "id,family_id,learner_id,title,starts_on,ends_on,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("starts_on", { ascending: false })
    .order("created_at", { ascending: false });

  const learnerId = safe(options.learnerId);

  if (learnerId) {
    query = query.eq("learner_id", learnerId);
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean reporting periods just now.",
      ),
    );
  }

  return sortReportingPeriods(
    (response.data ?? []).map((row) =>
      toCleanReportingPeriod(row as ReportingPeriodRow),
    ),
  );
}

export async function createCleanReportingPeriod(
  familyId: string,
  input: CleanReportingPeriodInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before creating a reporting period.");
  }

  const payload = sanitizeReportingPeriodInput(input);

  if (!safe(payload.learner_id)) {
    throw new Error("A learner is required.");
  }

  if (!safe(payload.title)) {
    throw new Error("A reporting period title is required.");
  }

  if (!safe(payload.starts_on) || !safe(payload.ends_on)) {
    throw new Error("Start and end dates are required.");
  }

  const response = await supabase
    .from("reporting_periods")
    .insert({
      family_id: familyId,
      learner_id: payload.learner_id,
      title: payload.title,
      starts_on: payload.starts_on,
      ends_on: payload.ends_on,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,learner_id,title,starts_on,ends_on,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean reporting period.",
      ),
    );
  }

  return toCleanReportingPeriod(response.data as ReportingPeriodRow);
}

export async function updateCleanReportingPeriod(
  familyId: string,
  reportingPeriodId: string,
  input: CleanReportingPeriodUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeReportingPeriodInput(input)).filter(
      ([, value]) => value !== undefined,
    ),
  );

  if (payload.learner_id !== undefined && !safe(payload.learner_id)) {
    throw new Error("A learner is required.");
  }

  if (payload.title !== undefined && !safe(payload.title)) {
    throw new Error("A reporting period title is required.");
  }

  const response = await supabase
    .from("reporting_periods")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", reportingPeriodId)
    .select(
      "id,family_id,learner_id,title,starts_on,ends_on,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean reporting period.",
      ),
    );
  }

  return toCleanReportingPeriod(response.data as ReportingPeriodRow);
}

export async function deleteCleanReportingPeriod(
  familyId: string,
  reportingPeriodId: string,
) {
  const response = await supabase
    .from("reporting_periods")
    .delete()
    .eq("family_id", familyId)
    .eq("id", reportingPeriodId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean reporting period.",
      ),
    );
  }
}

export async function listCleanReports(
  familyId: string,
  options: CleanReportsOptions = {},
) {
  let query = supabase
    .from("reports")
    .select(
      "id,family_id,learner_id,reporting_period_id,title,status,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  const learnerId = safe(options.learnerId);
  const reportingPeriodId = safe(options.reportingPeriodId);

  if (learnerId) {
    query = query.eq("learner_id", learnerId);
  }

  if (reportingPeriodId) {
    query = query.eq("reporting_period_id", reportingPeriodId);
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean reports just now.",
      ),
    );
  }

  return sortReports(
    (response.data ?? []).map((row) => toCleanReport(row as ReportRow)),
  );
}

export async function createCleanReport(
  familyId: string,
  input: CleanReportInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before creating a report.");
  }

  const payload = sanitizeReportInput(input);

  if (!safe(payload.learner_id)) {
    throw new Error("A learner is required.");
  }

  if (!safe(payload.reporting_period_id)) {
    throw new Error("A reporting period is required.");
  }

  if (!safe(payload.title)) {
    throw new Error("A report title is required.");
  }

  const response = await supabase
    .from("reports")
    .insert({
      family_id: familyId,
      learner_id: payload.learner_id,
      reporting_period_id: payload.reporting_period_id,
      title: payload.title,
      status: payload.status ?? "draft",
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,learner_id,reporting_period_id,title,status,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean report.",
      ),
    );
  }

  const report = toCleanReport(response.data as ReportRow);
  requestCoachStateRefresh("report-created");
  return report;
}

export async function updateCleanReport(
  familyId: string,
  reportId: string,
  input: CleanReportUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeReportInput(input)).filter(
      ([, value]) => value !== undefined,
    ),
  );

  if (payload.learner_id !== undefined && !safe(payload.learner_id)) {
    throw new Error("A learner is required.");
  }

  if (payload.reporting_period_id !== undefined && !safe(payload.reporting_period_id)) {
    throw new Error("A reporting period is required.");
  }

  if (payload.title !== undefined && !safe(payload.title)) {
    throw new Error("A report title is required.");
  }

  const response = await supabase
    .from("reports")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", reportId)
    .select(
      "id,family_id,learner_id,reporting_period_id,title,status,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean report.",
      ),
    );
  }

  const report = toCleanReport(response.data as ReportRow);
  requestCoachStateRefresh("report-updated");
  return report;
}

export async function deleteCleanReport(
  familyId: string,
  reportId: string,
) {
  const response = await supabase
    .from("reports")
    .delete()
    .eq("family_id", familyId)
    .eq("id", reportId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean report.",
      ),
    );
  }

  requestCoachStateRefresh("report-deleted");
}

export async function listCleanReportSections(
  familyId: string,
  reportId: string,
  options: CleanReportSectionsOptions = {},
) {
  let query = supabase
    .from("report_sections")
    .select(
      "id,report_id,family_id,learner_id,section_key,heading,content,sort_order,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .eq("report_id", reportId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const learnerId = safe(options.learnerId);
  if (learnerId) {
    query = query.eq("learner_id", learnerId);
  }

  const response = await query;

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean report sections just now.",
      ),
    );
  }

  return sortReportSections(
    (response.data ?? []).map((row) =>
      toCleanReportSection(row as ReportSectionRow),
    ),
  );
}

export async function upsertCleanReportSection(
  familyId: string,
  input: CleanReportSectionInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before saving a report section.");
  }

  const payload = sanitizeReportSectionInput(input);

  if (!safe(payload.report_id)) {
    throw new Error("A report is required.");
  }

  if (!safe(payload.learner_id)) {
    throw new Error("A learner is required.");
  }

  if (!safe(payload.section_key)) {
    throw new Error("A section key is required.");
  }

  if (!safe(payload.heading)) {
    throw new Error("A section heading is required.");
  }

  const existing = await supabase
    .from("report_sections")
    .select(
      "id,report_id,family_id,learner_id,section_key,heading,content,sort_order,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .eq("report_id", payload.report_id)
    .eq("section_key", payload.section_key)
    .maybeSingle();

  if (existing.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        existing.error,
        "We could not check the clean report section just now.",
      ),
    );
  }

  if (existing.data) {
    const updateResponse = await supabase
      .from("report_sections")
      .update({
        learner_id: payload.learner_id,
        heading: payload.heading,
        content: payload.content,
        sort_order: payload.sort_order,
      })
      .eq("family_id", familyId)
      .eq("id", safe(existing.data.id))
      .select(
        "id,report_id,family_id,learner_id,section_key,heading,content,sort_order,created_by_user_id,created_at,updated_at",
      )
      .maybeSingle();

    if (updateResponse.error || !updateResponse.data) {
      throw new Error(
        normalizeCleanErrorMessage(
          updateResponse.error,
          "Unable to update the clean report section.",
        ),
      );
    }

    return toCleanReportSection(updateResponse.data as ReportSectionRow);
  }

  const insertResponse = await supabase
    .from("report_sections")
    .insert({
      family_id: familyId,
      report_id: payload.report_id,
      learner_id: payload.learner_id,
      section_key: payload.section_key,
      heading: payload.heading,
      content: payload.content,
      sort_order: payload.sort_order ?? 0,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,report_id,family_id,learner_id,section_key,heading,content,sort_order,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (insertResponse.error || !insertResponse.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        insertResponse.error,
        "Unable to create the clean report section.",
      ),
    );
  }

  return toCleanReportSection(insertResponse.data as ReportSectionRow);
}
