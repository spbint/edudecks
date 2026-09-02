// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  clearQuickCaptureSessionDraft,
  getQuickCaptureSessionDraftKey,
  readQuickCaptureSessionDraft,
  writeQuickCaptureSessionDraft,
} from "./quickCaptureSessionDraft";

const draft = {
  learnerId: "learner-1",
  observedOn: "2026-09-02",
  caption: "Collected leaves",
  reflection: "Noticed the veins.",
  learningArea: "Science",
};

describe("Quick Capture session draft", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("restores only serialisable text fields in the same family and contextual capture", () => {
    const key = getQuickCaptureSessionDraftKey({ userId: "user-1", familyId: "family-1", calendarItemId: "calendar-1" });
    writeQuickCaptureSessionDraft(key, draft);
    expect(readQuickCaptureSessionDraft(key)).toEqual(draft);
    expect(readQuickCaptureSessionDraft(getQuickCaptureSessionDraftKey({ userId: "user-2", familyId: "family-1", calendarItemId: "calendar-1" }))).toBeNull();
    expect(readQuickCaptureSessionDraft(getQuickCaptureSessionDraftKey({ userId: "user-1", familyId: "family-2", calendarItemId: "calendar-1" }))).toBeNull();
  });

  it("does not persist File or Blob data and clears after an intentional reset", () => {
    const key = getQuickCaptureSessionDraftKey({ userId: "user-1", familyId: "family-1" });
    writeQuickCaptureSessionDraft(key, draft);
    expect(window.sessionStorage.getItem(key)).not.toMatch(/File|Blob|photo|bytes/i);
    clearQuickCaptureSessionDraft(key);
    expect(readQuickCaptureSessionDraft(key)).toBeNull();
  });
});
