import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import type {
  CleanEvidenceEntriesOptions,
  CleanEvidenceEntry,
  CleanEvidenceEntryInput,
  CleanEvidenceEntryUpdate,
} from "@/lib/clean/evidence/types";
import { requestCoachStateRefresh, type CoachRefreshSource } from "@/lib/clean/coach/coachRefresh";

type EvidenceEntryRow = {
  id: string;
  family_id: string;
  learner_id: string;
  program_id?: string | null;
  calendar_item_id?: string | null;
  observed_on: string;
  title?: string | null;
  what_happened: string;
  reflection?: string | null;
  learning_area?: string | null;
  curriculum_node_ids?: unknown;
  attachment_urls?: unknown;
  image_url?: string | null;
  include_in_portfolio?: boolean | null;
  include_in_report?: boolean | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

const CLEAN_EVIDENCE_ENTRY_BASE_SELECT =
  "id,family_id,learner_id,program_id,calendar_item_id,observed_on,title,what_happened,reflection,learning_area,curriculum_node_ids,include_in_portfolio,include_in_report,created_by_user_id,created_at,updated_at";

const CLEAN_EVIDENCE_ENTRY_ATTACHMENT_SELECT =
  "id,family_id,learner_id,program_id,calendar_item_id,observed_on,title,what_happened,reflection,learning_area,curriculum_node_ids,attachment_urls,image_url,include_in_portfolio,include_in_report,created_by_user_id,created_at,updated_at";

export const CLEAN_EVIDENCE_CHANGED_EVENT = "edudecks:clean-evidence-changed";

export type CleanEvidenceChangedDetail = {
  familyId: string;
  learnerId?: string | null;
  source?: Extract<CoachRefreshSource, "evidence-created" | "evidence-updated" | "evidence-deleted">;
};

export function shouldRefreshCleanEvidenceForLearner(
  detail: CleanEvidenceChangedDetail,
  familyId: string,
  learnerId: string,
) {
  return detail.familyId === familyId && (!detail.learnerId || detail.learnerId === learnerId);
}

export function notifyCleanEvidenceChanged(
  detail: CleanEvidenceChangedDetail,
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<CleanEvidenceChangedDetail>(CLEAN_EVIDENCE_CHANGED_EVENT, {
      detail: {
        familyId: safe(detail.familyId),
        learnerId: safe(detail.learnerId) || null,
        source: detail.source,
      },
    }),
  );
  requestCoachStateRefresh(detail.source ?? "evidence-updated");
}

export function subscribeToCleanEvidenceChanges(
  listener: (detail: CleanEvidenceChangedDetail) => void,
) {
  if (typeof window === "undefined") return () => undefined;

  const handleChange = (event: Event) => {
    const detail = (event as CustomEvent<CleanEvidenceChangedDetail>).detail;
    if (!detail || typeof detail !== "object") return;
    listener(detail);
  };

  window.addEventListener(CLEAN_EVIDENCE_CHANGED_EVENT, handleChange);
  return () => window.removeEventListener(CLEAN_EVIDENCE_CHANGED_EVENT, handleChange);
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function sanitizeDate(value: unknown) {
  return safe(value);
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (value === true) return true;
  if (value === false) return false;
  return fallback;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => safe(entry))
    .filter((entry) => Boolean(entry));
}

function normalizeAttachmentArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry === "string") return safe(entry);
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        return safe(record.path) || safe(record.url) || safe(record.name);
      }
      return "";
    })
    .filter((entry) => Boolean(entry));
}

function toCleanEvidenceEntry(row: EvidenceEntryRow): CleanEvidenceEntry {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    programId: normalizeNullString(row.program_id),
    calendarItemId: normalizeNullString(row.calendar_item_id),
    observedOn: sanitizeDate(row.observed_on),
    title: normalizeNullString(row.title),
    whatHappened: safe(row.what_happened),
    reflection: normalizeNullString(row.reflection),
    learningArea: normalizeNullString(row.learning_area),
    curriculumNodeIds: normalizeStringArray(row.curriculum_node_ids),
    attachmentUrls: normalizeAttachmentArray(row.attachment_urls),
    imageUrl: normalizeNullString(row.image_url),
    includeInPortfolio: normalizeBoolean(row.include_in_portfolio, true),
    includeInReport: normalizeBoolean(row.include_in_report, true),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

export function sortEvidenceEntries(items: CleanEvidenceEntry[]) {
  return [...items].sort((left, right) => {
    const observedCompare = right.observedOn.localeCompare(left.observedOn);
    if (observedCompare !== 0) return observedCompare;

    const leftTimestamps = [left.createdAt, left.updatedAt]
      .map((value) => Date.parse(value || ""))
      .filter((value) => !Number.isNaN(value));
    const rightTimestamps = [right.createdAt, right.updatedAt]
      .map((value) => Date.parse(value || ""))
      .filter((value) => !Number.isNaN(value));
    const leftCreated = leftTimestamps.length ? Math.max(...leftTimestamps) : Number.NaN;
    const rightCreated = rightTimestamps.length ? Math.max(...rightTimestamps) : Number.NaN;

    if (!Number.isNaN(leftCreated) || !Number.isNaN(rightCreated)) {
      if (Number.isNaN(leftCreated)) return 1;
      if (Number.isNaN(rightCreated)) return -1;
      if (leftCreated !== rightCreated) return rightCreated - leftCreated;
    }

    return left.id.localeCompare(right.id);
  });
}

function sanitizeEvidenceEntryInput(
  input: CleanEvidenceEntryInput | CleanEvidenceEntryUpdate,
) {
  return {
    learner_id:
      "learnerId" in input && input.learnerId !== undefined
        ? normalizeNullString(input.learnerId)
        : undefined,
    program_id:
      "programId" in input ? normalizeNullString(input.programId) : undefined,
    calendar_item_id:
      "calendarItemId" in input
        ? normalizeNullString(input.calendarItemId)
        : undefined,
    observed_on:
      "observedOn" in input && input.observedOn !== undefined
        ? sanitizeDate(input.observedOn) || null
        : undefined,
    title: "title" in input ? normalizeNullString(input.title) : undefined,
    what_happened:
      "whatHappened" in input && input.whatHappened !== undefined
        ? safe(input.whatHappened) || null
        : undefined,
    reflection:
      "reflection" in input ? normalizeNullString(input.reflection) : undefined,
    learning_area:
      "learningArea" in input
        ? normalizeNullString(input.learningArea)
        : undefined,
    curriculum_node_ids:
      "curriculumNodeIds" in input && input.curriculumNodeIds !== undefined
        ? input.curriculumNodeIds
            .map((entry) => safe(entry))
            .filter((entry) => Boolean(entry))
        : undefined,
    include_in_portfolio:
      "includeInPortfolio" in input && input.includeInPortfolio !== undefined
        ? input.includeInPortfolio === true
        : undefined,
    include_in_report:
      "includeInReport" in input && input.includeInReport !== undefined
        ? input.includeInReport === true
        : undefined,
  };
}

export async function listCleanEvidenceEntries(
  familyId: string,
  options: CleanEvidenceEntriesOptions = {},
) {
  const learnerId = safe(options.learnerId);
  const programId = safe(options.programId);
  const calendarItemId = safe(options.calendarItemId);
  const fromDate = sanitizeDate(options.fromDate);
  const toDate = sanitizeDate(options.toDate);

  async function runQuery(selectProjection: string) {
    let query = supabase
      .from("evidence_entries")
      .select(selectProjection)
      .eq("family_id", familyId)
      .order("observed_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (learnerId) {
      query = query.eq("learner_id", learnerId);
    }

    if (programId) {
      query = query.eq("program_id", programId);
    }

    if (calendarItemId) {
      query = query.eq("calendar_item_id", calendarItemId);
    }

    if (fromDate) {
      query = query.gte("observed_on", fromDate);
    }

    if (toDate) {
      query = query.lte("observed_on", toDate);
    }

    if (typeof options.limit === "number" && options.limit > 0) {
      query = query.limit(options.limit);
    }

    return query;
  }

  let response = await runQuery(CLEAN_EVIDENCE_ENTRY_ATTACHMENT_SELECT);

  if (response.error) {
    response = await runQuery(CLEAN_EVIDENCE_ENTRY_BASE_SELECT);
  }

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean evidence entries just now.",
        "evidence",
      ),
    );
  }

  return sortEvidenceEntries(
    (((response.data ?? []) as unknown) as EvidenceEntryRow[]).map((row) =>
      toCleanEvidenceEntry(row),
    ),
  );
}

export async function createCleanEvidenceEntry(
  familyId: string,
  input: CleanEvidenceEntryInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before saving a capture note.");
  }

  const payload = sanitizeEvidenceEntryInput(input);

  if (!safe(payload.learner_id)) {
    throw new Error("A learner is required.");
  }

  if (!sanitizeDate(payload.observed_on)) {
    throw new Error("A date is required.");
  }

  if (!safe(payload.what_happened)) {
    throw new Error("What happened is required.");
  }

  const response = await supabase
    .from("evidence_entries")
    .insert({
      family_id: familyId,
      learner_id: payload.learner_id,
      program_id: payload.program_id ?? null,
      calendar_item_id: payload.calendar_item_id ?? null,
      observed_on: payload.observed_on,
      title: payload.title ?? null,
      what_happened: payload.what_happened,
      reflection: payload.reflection ?? null,
      learning_area: payload.learning_area ?? null,
      curriculum_node_ids: payload.curriculum_node_ids ?? [],
      include_in_portfolio: payload.include_in_portfolio ?? true,
      include_in_report: payload.include_in_report ?? true,
      created_by_user_id: currentUserId,
    })
    .select(CLEAN_EVIDENCE_ENTRY_BASE_SELECT)
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean evidence entry.",
        "evidence",
      ),
    );
  }

  const entry = toCleanEvidenceEntry(response.data as EvidenceEntryRow);
  notifyCleanEvidenceChanged({ familyId, learnerId: entry.learnerId, source: "evidence-created" });
  return entry;
}

export async function updateCleanEvidenceEntry(
  familyId: string,
  entryId: string,
  input: CleanEvidenceEntryUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeEvidenceEntryInput(input)).filter(([, value]) => value !== undefined),
  );

  if (payload.learner_id !== undefined && !safe(payload.learner_id)) {
    throw new Error("A learner is required.");
  }

  if (payload.observed_on !== undefined && !sanitizeDate(payload.observed_on)) {
    throw new Error("A date is required.");
  }

  if (payload.what_happened !== undefined && !safe(payload.what_happened)) {
    throw new Error("What happened is required.");
  }

  const response = await supabase
    .from("evidence_entries")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", entryId)
    .select(CLEAN_EVIDENCE_ENTRY_BASE_SELECT)
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean evidence entry.",
        "evidence",
      ),
    );
  }

  const entry = toCleanEvidenceEntry(response.data as EvidenceEntryRow);
  notifyCleanEvidenceChanged({ familyId, learnerId: entry.learnerId, source: "evidence-updated" });
  return entry;
}

export async function deleteCleanEvidenceEntry(
  familyId: string,
  entryId: string,
  learnerId?: string,
) {
  const response = await supabase
    .from("evidence_entries")
    .delete()
    .eq("family_id", familyId)
    .eq("id", entryId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean evidence entry.",
        "evidence",
      ),
    );
  }

  notifyCleanEvidenceChanged({ familyId, learnerId, source: "evidence-deleted" });
}
