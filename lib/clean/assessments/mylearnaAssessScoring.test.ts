import { describe, expect, it } from "vitest";
import { MYLEARNA_ASSESS_DEMO_ITEMS } from "@/lib/clean/assessments/mylearnaAssessDemoItems";
import {
  canUseAssessmentItem,
  scoreAssessmentItem,
  summarizeAssessmentAttempt,
} from "@/lib/clean/assessments/mylearnaAssessScoring";
import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";

describe("MyLearna Assess V1 scoring", () => {
  it("scores a correct single-choice response", () => {
    const item = MYLEARNA_ASSESS_DEMO_ITEMS[0];
    const response = scoreAssessmentItem(item, ["b"], 12);

    expect(response).toMatchObject({
      itemId: "npv-subitise-001",
      selectedOptionIds: ["b"],
      correct: true,
      skillId: "subitise-small-collections",
      misconceptionTags: [],
      timeSpentSeconds: 12,
    });
  });

  it("records misconception tags for incorrect responses", () => {
    const item = MYLEARNA_ASSESS_DEMO_ITEMS[0];
    const response = scoreAssessmentItem(item, ["a"]);

    expect(response.correct).toBe(false);
    expect(response.misconceptionTags).toEqual([
      "counts-one-by-one",
      "confuses-scattered-arrangements",
    ]);
  });

  it("summarizes score and skill performance", () => {
    const responses = [
      scoreAssessmentItem(MYLEARNA_ASSESS_DEMO_ITEMS[0], ["b"]),
      scoreAssessmentItem(MYLEARNA_ASSESS_DEMO_ITEMS[1], ["a"]),
    ];

    const summary = summarizeAssessmentAttempt(MYLEARNA_ASSESS_DEMO_ITEMS.slice(0, 2), responses);

    expect(summary.correctItems).toBe(1);
    expect(summary.totalItems).toBe(2);
    expect(summary.percentage).toBe(50);
    expect(summary.skillSummaries).toEqual([
      {
        skillId: "subitise-small-collections",
        skillName: "Recognise small collections without counting",
        correct: 1,
        total: 2,
      },
    ]);
  });
});

describe("MyLearna Assess V1 visibility", () => {
  it("allows internal users to use draft items in the lab", () => {
    expect(
      canUseAssessmentItem(
        MYLEARNA_ASSESS_DEMO_ITEMS[0],
        { role: "staff" },
        null,
        "lab",
      ),
    ).toBe(true);
  });

  it("keeps draft items unavailable to customers", () => {
    expect(
      canUseAssessmentItem(
        MYLEARNA_ASSESS_DEMO_ITEMS[0],
        { role: "member" },
        null,
        "customer",
      ),
    ).toBe(false);
  });

  it("allows published items in future customer contexts", () => {
    const publishedItem: MyLearnaAssessmentItem = {
      ...MYLEARNA_ASSESS_DEMO_ITEMS[0],
      status: "published",
    };

    expect(canUseAssessmentItem(publishedItem, null, null, "customer")).toBe(true);
  });
});
