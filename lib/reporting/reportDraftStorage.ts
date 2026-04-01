/* lib/reporting/reportDraftStorage.ts */

export type SavedReportDraft = {
  id: string;
  createdAt: string;
  updatedAt: string;

  studentId: string;
  frameworkId: string;
  periodMode: "term" | "semester" | "year" | "all";
  reportMode: "family-summary" | "authority-ready" | "progress-review";
  presetKey:
    | "family-summary"
    | "authority-pack"
    | "term-review"
    | "semester-review"
    | "annual-summary"
    | "portfolio-showcase";

  selectedEvidenceIds: string[];
  selectionMeta: Record<
    string,
    {
      role: "core" | "appendix";
      required: boolean;
    }
  >;

  engineVersion: string;
};

const INDEX_KEY = "edudecks.reports.savedDraftIds";
const ACTIVE_DRAFT_KEY = "edudecks.reports.activeDraftId";

function draftKey(id: string) {
  return `edudecks.reports.draft.${id}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uuidLike() {
  return `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listSavedDraftIds(): string[] {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(localStorage.getItem(INDEX_KEY), []);
}

export function listSavedDrafts(): SavedReportDraft[] {
  if (typeof window === "undefined") return [];
  const ids = listSavedDraftIds();
  return ids
    .map((id) => getSavedDraft(id))
    .filter(Boolean) as SavedReportDraft[];
}

export function getSavedDraft(id: string): SavedReportDraft | null {
  if (typeof window === "undefined") return null;
  return safeParse<SavedReportDraft | null>(
    localStorage.getItem(draftKey(id)),
    null
  );
}

export function getActiveDraftId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_DRAFT_KEY);
}

export function setActiveDraftId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_DRAFT_KEY, id);
}

export function clearActiveDraftId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_DRAFT_KEY);
}

export function saveDraft(
  input: Omit<SavedReportDraft, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  }
): SavedReportDraft {
  if (typeof window === "undefined") {
    throw new Error("Draft storage is only available in the browser.");
  }

  const now = new Date().toISOString();
  const id = input.id || uuidLike();
  const existing = getSavedDraft(id);

  const draft: SavedReportDraft = {
    id,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    studentId: input.studentId,
    frameworkId: input.frameworkId,
    periodMode: input.periodMode,
    reportMode: input.reportMode,
    presetKey: input.presetKey,
    selectedEvidenceIds: input.selectedEvidenceIds || [],
    selectionMeta: input.selectionMeta || {},
    engineVersion: input.engineVersion || "v4",
  };

  localStorage.setItem(draftKey(id), JSON.stringify(draft));

  const ids = listSavedDraftIds();
  if (!ids.includes(id)) {
    localStorage.setItem(INDEX_KEY, JSON.stringify([id, ...ids].slice(0, 50)));
  }

  setActiveDraftId(id);
  return draft;
}

export function deleteDraft(id: string) {
  if (typeof window === "undefined") return;

  localStorage.removeItem(draftKey(id));

  const ids = listSavedDraftIds().filter((x) => x !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));

  const activeId = getActiveDraftId();
  if (activeId === id) {
    clearActiveDraftId();
  }
}