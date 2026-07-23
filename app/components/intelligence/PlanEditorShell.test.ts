// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlanEditorShell from "@/app/components/intelligence/PlanEditorShell";
import type { GeneratedPlanContent } from "@/lib/intelligence/plans/types";

function makeContent(): GeneratedPlanContent {
  return {
    planType: "lesson", title: "Plan", overview: "Overview", subjects: ["Science"], ageStage: "Ages 8-10", duration: 30, durationUnit: "minutes", learningIntentions: ["Learn"], successCriteria: ["Explain"], sequence: [{ title: "Step", objective: "Objective", activity: "Activity", durationMinutes: 30, notes: "" }], resourceRequirements: [], preparation: [], discussionQuestions: [], differentiation: [], assessmentApproach: "Observe", evidencePrompts: [], portfolioPrompts: [], safetySupervisionNotes: [], limitationsAssumptions: [], sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com", finalUrl: null, canonicalUrl: null, title: "Source", provider: "Example", extractedAt: null }, parentInstructions: null, generation: { provider: "test", model: "test", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z", revision: 1 }, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" },
  };
}

describe("PlanEditorShell", () => {
  afterEach(() => cleanup());

  it("shows dirty state and protects the route from unload", () => {
    const content = makeContent();
    render(React.createElement(PlanEditorShell, { content, status: "editing", dirty: true, saving: false, validation: null, safetyAcknowledged: false, onSafetyAcknowledgedChange: vi.fn(), onChange: vi.fn(), onSave: vi.fn(), onValidate: vi.fn(), onApprove: vi.fn(), onReturnToDraft: vi.fn(), onArchive: vi.fn(), onRegenerate: vi.fn(), sequenceEditor: React.createElement("div"), resourceEditor: React.createElement("div") }));
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
