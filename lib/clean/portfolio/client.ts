import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import type {
  CleanPortfolioHighlight,
  CleanPortfolioHighlightInput,
  CleanPortfolioHighlightsOptions,
  CleanPortfolioHighlightUpdate,
  CleanPortfolioItem,
  CleanPortfolioItemsOptions,
} from "@/lib/clean/portfolio/types";

type PortfolioHighlightRow = {
  id: string;
  family_id: string;
  learner_id: string;
  evidence_entry_id?: string | null;
  calendar_item_id?: string | null;
  note?: string | null;
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

function toCleanPortfolioHighlight(
  row: PortfolioHighlightRow,
): CleanPortfolioHighlight {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    evidenceEntryId: normalizeNullString(row.evidence_entry_id),
    calendarItemId: normalizeNullString(row.calendar_item_id),
    note: normalizeNullString(row.note),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function sortHighlights(items: CleanPortfolioHighlight[]) {
  return [...items].sort((left, right) => {
    const leftUpdated = Date.parse(left.updatedAt || left.createdAt || "");
    const rightUpdated = Date.parse(right.updatedAt || right.createdAt || "");

    if (!Number.isNaN(leftUpdated) || !Number.isNaN(rightUpdated)) {
      if (Number.isNaN(leftUpdated)) return 1;
      if (Number.isNaN(rightUpdated)) return -1;
      if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;
    }

    return left.id.localeCompare(right.id);
  });
}

function sanitizePortfolioHighlightInput(
  input: CleanPortfolioHighlightInput | CleanPortfolioHighlightUpdate,
) {
  return {
    learner_id:
      "learnerId" in input && input.learnerId !== undefined
        ? normalizeNullString(input.learnerId)
        : undefined,
    evidence_entry_id:
      "evidenceEntryId" in input
        ? normalizeNullString(input.evidenceEntryId)
        : undefined,
    calendar_item_id:
      "calendarItemId" in input
        ? normalizeNullString(input.calendarItemId)
        : undefined,
    note: "note" in input ? normalizeNullString(input.note) : undefined,
  };
}

export async function listCleanPortfolioHighlights(
  familyId: string,
  options: CleanPortfolioHighlightsOptions = {},
) {
  let query = supabase
    .from("portfolio_highlights")
    .select(
      "id,family_id,learner_id,evidence_entry_id,calendar_item_id,note,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  const learnerId = safe(options.learnerId);
  const evidenceEntryId = safe(options.evidenceEntryId);

  if (learnerId) {
    query = query.eq("learner_id", learnerId);
  }

  if (evidenceEntryId) {
    query = query.eq("evidence_entry_id", evidenceEntryId);
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean portfolio highlights just now.",
      ),
    );
  }

  return sortHighlights(
    (response.data ?? []).map((row) =>
      toCleanPortfolioHighlight(row as PortfolioHighlightRow),
    ),
  );
}

export async function listCleanPortfolioItems(
  familyId: string,
  options: CleanPortfolioItemsOptions = {},
): Promise<CleanPortfolioItem[]> {
  const [evidenceEntries, highlights] = await Promise.all([
    listCleanEvidenceEntries(familyId, {
      learnerId: options.learnerId || null,
      limit: options.limit,
    }),
    listCleanPortfolioHighlights(familyId, {
      learnerId: options.learnerId || null,
      limit: options.limit,
    }),
  ]);

  const highlightByEvidenceId = new Map(
    highlights
      .filter((highlight) => Boolean(highlight.evidenceEntryId))
      .map((highlight) => [highlight.evidenceEntryId as string, highlight]),
  );

  return evidenceEntries.map((evidence) => {
    const highlight = highlightByEvidenceId.get(evidence.id) ?? null;
    return {
      evidence,
      highlight,
      isHighlighted: Boolean(highlight),
    };
  });
}

export async function createCleanPortfolioHighlight(
  familyId: string,
  input: CleanPortfolioHighlightInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before saving a portfolio highlight.");
  }

  const payload = sanitizePortfolioHighlightInput(input);

  if (!safe(payload.learner_id)) {
    throw new Error("A learner is required.");
  }

  if (!safe(payload.evidence_entry_id) && !safe(payload.calendar_item_id)) {
    throw new Error("A portfolio highlight needs an evidence or calendar link.");
  }

  const response = await supabase
    .from("portfolio_highlights")
    .insert({
      family_id: familyId,
      learner_id: payload.learner_id,
      evidence_entry_id: payload.evidence_entry_id ?? null,
      calendar_item_id: payload.calendar_item_id ?? null,
      note: payload.note ?? null,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,learner_id,evidence_entry_id,calendar_item_id,note,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean portfolio highlight.",
      ),
    );
  }

  return toCleanPortfolioHighlight(response.data as PortfolioHighlightRow);
}

export async function updateCleanPortfolioHighlight(
  familyId: string,
  highlightId: string,
  input: CleanPortfolioHighlightUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizePortfolioHighlightInput(input)).filter(
      ([, value]) => value !== undefined,
    ),
  );

  if (payload.learner_id !== undefined && !safe(payload.learner_id)) {
    throw new Error("A learner is required.");
  }

  const response = await supabase
    .from("portfolio_highlights")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", highlightId)
    .select(
      "id,family_id,learner_id,evidence_entry_id,calendar_item_id,note,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean portfolio highlight.",
      ),
    );
  }

  return toCleanPortfolioHighlight(response.data as PortfolioHighlightRow);
}

export async function deleteCleanPortfolioHighlight(
  familyId: string,
  highlightId: string,
) {
  const response = await supabase
    .from("portfolio_highlights")
    .delete()
    .eq("family_id", familyId)
    .eq("id", highlightId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean portfolio highlight.",
      ),
    );
  }
}
