import { describe, expect, it } from "vitest";
import type { GeneratedPlanContent } from "@/lib/intelligence/plans/types";
import { validateEditablePlanContent } from "@/lib/intelligence/plans/reviewValidation";

function content(): GeneratedPlanContent {
  return {
    planType: "lesson",
    title: "Weather lab",
    overview: "Explore weather observations.",
    subjects: ["Science"],
    ageStage: "Ages 8-10",
    duration: 45,
    durationUnit: "minutes",
    learningIntentions: ["Observe patterns."],
    successCriteria: ["Explain one pattern."],
    sequence: [{ title: "Observe", objective: "Notice changes.", activity: "Record the sky.", durationMinutes: 20, notes: "" }],
    resourceRequirements: [{ name: "Paper", category: "Materials", quantity: "1", required: true, url: null, notes: "" }],
    preparation: ["Print a chart."],
    discussionQuestions: ["What changed?"],
    differentiation: ["Offer drawing or writing."],
    assessmentApproach: "Listen to the explanation.",
    evidencePrompts: ["What did the learner notice?"],
    portfolioPrompts: ["Save the chart."],
    safetySupervisionNotes: ["Check outdoor conditions."],
    sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com/article", finalUrl: "https://example.com/article", canonicalUrl: null, title: "Weather", provider: "Example", extractedAt: "2026-07-23T00:00:00.000Z" },
    limitationsAssumptions: ["Conditions may vary."],
    parentInstructions: "Keep it practical.",
    generation: { provider: "template", model: "template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z", revision: 1 },
    validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" },
  };
}

describe("editable plan validation", () => {
  it("requires essential fields and sequence steps", () => {
    const original = content();
    const result = validateEditablePlanContent({ ...original, title: "", sequence: [] }, original, false, () => new Date("2026-07-23T01:00:00.000Z"));
    expect(result.validation.valid).toBe(false);
    expect(result.validation.issues).toEqual(expect.arrayContaining(["title cannot be empty.", "sequence must contain at least one step."]));
  });

  it("blocks invalid resources and approval without safety acknowledgement", () => {
    const original = content();
    const result = validateEditablePlanContent({ ...original, resourceRequirements: [{ name: "", required: "yes", url: "not-a-url" }] }, original, false, () => new Date("2026-07-23T01:00:00.000Z"), true);
    expect(result.validation.valid).toBe(false);
    expect(result.validation.issues).toEqual(expect.arrayContaining([
      "resourceRequirements[0].name cannot be empty.",
      "resourceRequirements[0].required must be true or false.",
      "resourceRequirements[0].url must be an HTTP or HTTPS URL.",
      "Safety and supervision notes must be acknowledged before approval.",
    ]));
  });

  it("preserves source attribution, generation and parent instructions", () => {
    const original = content();
    const result = validateEditablePlanContent({ ...original, sourceAttribution: { ...original.sourceAttribution, originalUrl: "https://attacker.example" }, generation: { ...original.generation, model: "attacker" }, parentInstructions: "changed" }, original, true, () => new Date("2026-07-23T01:00:00.000Z"));
    expect(result.content.sourceAttribution).toEqual(original.sourceAttribution);
    expect(result.content.generation).toEqual(original.generation);
    expect(result.content.parentInstructions).toBe(original.parentInstructions);
  });
});
