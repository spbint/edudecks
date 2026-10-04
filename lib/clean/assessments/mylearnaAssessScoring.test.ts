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

  it("scores normalized short-answer responses", () => {
    const item: MyLearnaAssessmentItem = {
      ...MYLEARNA_ASSESS_DEMO_ITEMS[0],
      id: "short-answer-proof",
      template: "short-answer",
      stimulus: { type: "none", data: {} },
      response: {
        type: "short-answer",
        correctValue: "3500",
        acceptableValues: ["3,500"],
      },
    };

    expect(scoreAssessmentItem(item, [], 4, " 3,500 ").correct).toBe(true);
    expect(scoreAssessmentItem(item, [], 4, "3499").correct).toBe(false);
  });

  it("scores ordering responses by exact sequence rather than set membership", () => {
    const item: MyLearnaAssessmentItem = {
      ...MYLEARNA_ASSESS_DEMO_ITEMS[0],
      id: "ordering-proof-v1",
      version: 1,
      template: "ordering",
      stimulus: { type: "none", data: {} },
      response: {
        type: "ordering",
        options: [
          { id: "three", label: "3", value: 3 },
          { id: "one", label: "1", value: 1 },
          { id: "two", label: "2", value: 2 },
        ],
        correctOptionIds: ["one", "two", "three"],
      },
    };

    expect(
      scoreAssessmentItem(item, ["one", "two", "three"], 5).correct,
    ).toBe(true);
    expect(
      scoreAssessmentItem(item, ["three", "two", "one"], 5).correct,
    ).toBe(false);
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


it("normalizes safe fraction spacing and common minus characters without changing answer form", () => {
  const fractionItem: MyLearnaAssessmentItem = {
    ...MYLEARNA_ASSESS_DEMO_ITEMS[0],
    id: "fraction-format-proof-v1",
    version: 1,
    template: "short-answer",
    stimulus: { type: "none", data: {} },
    response: {
      type: "short-answer",
      correctValue: "5/8",
    },
  };

  const negativeItem: MyLearnaAssessmentItem = {
    ...fractionItem,
    id: "negative-format-proof-v1",
    response: {
      type: "short-answer",
      correctValue: "-4",
    },
  };

  expect(scoreAssessmentItem(fractionItem, [], 4, " 5 / 8 ").correct).toBe(true);
  expect(scoreAssessmentItem(fractionItem, [], 4, "0.625").correct).toBe(false);
  expect(scoreAssessmentItem(negativeItem, [], 4, "−4").correct).toBe(true);
});
