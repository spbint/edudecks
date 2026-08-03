export type QuickCaptureDraft = {
  learnerId: string;
  observedOn: string;
  caption: string;
  learningArea: string;
  photoFile: File | null;
};

let pendingDraft: QuickCaptureDraft | null = null;

export function setQuickCaptureDraft(draft: QuickCaptureDraft) {
  pendingDraft = draft;
}

export function consumeQuickCaptureDraft() {
  const draft = pendingDraft;
  pendingDraft = null;
  return draft;
}
