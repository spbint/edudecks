import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./CleanDayWorkspace.tsx", import.meta.url), "utf8");

describe("empty My Day secondary workspace", () => {
  it("keeps the returning-empty day in the shared workspace composition", () => {
    expect(source).toContain('myDayPresentationState === "SETUP_INCOMPLETE" || myDayPresentationState === "READY_FOR_FIRST_VALUE"');
    expect(source).toContain('mylearna-day-mature-content-${myDayPresentationState.toLowerCase()}');
    expect(source).not.toContain("mylearna-day-mature-content-returning_empty {\n              display: none");
  });

  it("uses scheduled language and keeps secondary entry points outside the calendar read", () => {
    expect(source).toContain("Nothing scheduled for today yet.");
    expect(source).not.toContain("LearnerViewEntry");
    expect(source).toContain("<OnDeckSection");
    expect(source).toContain("listLearningQueueItems(");
    expect(source).toContain("listCleanCalendarItems(");
    expect(source).not.toContain("createCleanCalendarItem(.*OnDeck");
  });

  it("keeps learner-specific family filtering without a learner-operated mode", () => {
    expect(source).toContain("selectedLearnerId || null");
    expect(source).not.toContain("/learner-view");
    expect(source).not.toContain("Open ${learner.label}'s learner view");
  });

  it("hands On Deck capture to the existing Capture route without serialising item text", () => {
    expect(source).toContain('source: "on_deck"');
    expect(source).toContain('queue_item_id: item.id');
    expect(source).toContain('returnTo: buildLearnerContextHref(buildDayPath(selectedDate), item.learnerId)');
    expect(source).toContain("Capture learning");
    expect(source).not.toContain("customNote: item.customNote");
  });
});
