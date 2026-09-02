export type QuickCaptureSessionDraft = {
  learnerId: string;
  observedOn: string;
  caption: string;
  reflection: string;
  learningArea: string;
};

type QuickCaptureSessionDraftScope = {
  userId: string;
  familyId: string;
  calendarItemId?: string | null;
  programId?: string | null;
};

const STORAGE_PREFIX = "mylearna:quick-capture-session:";

export function getQuickCaptureSessionDraftKey(scope: QuickCaptureSessionDraftScope) {
  const context = scope.calendarItemId || scope.programId || "standalone";
  return `${STORAGE_PREFIX}${scope.userId}:${scope.familyId}:${context}`;
}

export function readQuickCaptureSessionDraft(key: string): QuickCaptureSessionDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuickCaptureSessionDraft>;
    if (
      typeof parsed.learnerId !== "string" ||
      typeof parsed.observedOn !== "string" ||
      typeof parsed.caption !== "string" ||
      typeof parsed.reflection !== "string" ||
      typeof parsed.learningArea !== "string"
    ) return null;
    return parsed as QuickCaptureSessionDraft;
  } catch {
    return null;
  }
}

export function writeQuickCaptureSessionDraft(key: string, draft: QuickCaptureSessionDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, JSON.stringify(draft));
}

export function clearQuickCaptureSessionDraft(key: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}
