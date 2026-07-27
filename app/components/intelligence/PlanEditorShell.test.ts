// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("makes saving, saved, approval, and secondary actions explicit", () => {
    const content = makeContent();
    const onSave = vi.fn();
    const onApprove = vi.fn();
    const { rerender } = render(React.createElement(PlanEditorShell, { content, status: "editing", dirty: true, saving: false, validation: null, safetyAcknowledged: false, onSafetyAcknowledgedChange: vi.fn(), onChange: vi.fn(), onSave, onValidate: vi.fn(), onApprove, onReturnToDraft: vi.fn(), onArchive: vi.fn(), onRegenerate: vi.fn(), sequenceEditor: React.createElement("div"), resourceEditor: React.createElement("div") }));

    const save = screen.getByRole("button", { name: "Save draft" });
    expect(save.tagName).toBe("BUTTON");
    expect(save.className).toContain("plan-review-action-save");
    expect(save.getAttribute("data-dirty")).toBe("true");
    expect((save as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole("button", { name: "Approve plan" }).className).toContain("plan-review-action-approve");
    expect(screen.getByRole("button", { name: "Archive" }).className).toContain("plan-review-action-destructive");
    const actionBar = screen.getByRole("region", { name: "Plan review actions" });
    expect(actionBar).toBeTruthy();
    expect(actionBar.querySelector(".plan-review-actions")).toBeTruthy();
    expect(actionBar.querySelectorAll("button").length).toBe(6);

    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
    save.focus();
    expect(document.activeElement).toBe(save);

    rerender(React.createElement(PlanEditorShell, { content, status: "editing", dirty: true, saving: true, validation: null, safetyAcknowledged: false, onSafetyAcknowledgedChange: vi.fn(), onChange: vi.fn(), onSave, onValidate: vi.fn(), onApprove, onReturnToDraft: vi.fn(), onArchive: vi.fn(), onRegenerate: vi.fn(), sequenceEditor: React.createElement("div"), resourceEditor: React.createElement("div") }));
    expect((screen.getByRole("button", { name: "Saving..." }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Approve plan" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("status", { name: "Plan review status: Saving..." })).toBeTruthy();

    rerender(React.createElement(PlanEditorShell, { content, status: "saved", dirty: false, saving: false, validation: null, safetyAcknowledged: false, onSafetyAcknowledgedChange: vi.fn(), onChange: vi.fn(), onSave, onValidate: vi.fn(), onApprove, onReturnToDraft: vi.fn(), onArchive: vi.fn(), onRegenerate: vi.fn(), sequenceEditor: React.createElement("div"), resourceEditor: React.createElement("div") }));
    expect(screen.getByRole("button", { name: "Save draft" }).getAttribute("data-dirty")).toBe("false");
    expect(screen.getByRole("status", { name: "Plan review status: All changes saved" })).toBeTruthy();
  });
});
