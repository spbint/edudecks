// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlanReviewWorkspace from "@/app/components/intelligence/PlanReviewWorkspace";
import type { GeneratedPlanContent, PlanWorkflowStatus } from "@/lib/intelligence/plans/types";
import type { PlanReviewEnvelope } from "@/lib/intelligence/plans/reviewTypes";

function makeContent(title = "Weather lab", workflowStatus: PlanWorkflowStatus = "editing", safetyAcknowledged = false): GeneratedPlanContent {
  return {
    planType: "lesson", title, overview: "Explore observations.", subjects: ["Science"], ageStage: "Ages 8-10", duration: 45, durationUnit: "minutes",
    learningIntentions: ["Observe patterns."], successCriteria: ["Explain one pattern."],
    sequence: [{ title: "Observe", objective: "Notice changes.", activity: "Record the sky.", durationMinutes: 20, notes: "" }],
    resourceRequirements: [{ name: "Paper", category: "Materials", quantity: "1", required: true, url: null, notes: "" }],
    preparation: [], discussionQuestions: [], differentiation: [], assessmentApproach: "Discuss the chart.", evidencePrompts: [], portfolioPrompts: [], safetySupervisionNotes: ["Check conditions."], limitationsAssumptions: [],
    sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com/article", finalUrl: "https://example.com/final", canonicalUrl: "https://example.com/canonical", title: "Weather", provider: "Example", extractedAt: "2026-07-23T00:00:00.000Z" },
    parentInstructions: "Keep it practical.", generation: { provider: "template", model: "template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z", revision: 1 },
    validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" },
    review: { workflowStatus, originalGeneratedRevision: 1, revisionKind: "generated", changedFields: [], lastEditedAt: null, lastEditedByUserId: null, safetyAcknowledged, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" } },
  };
}

function makeEnvelope({ title = "Weather lab", revision = 1, workflowStatus = "editing" as PlanWorkflowStatus, safetyAcknowledged = false } = {}): PlanReviewEnvelope {
  const nextContent = makeContent(title, workflowStatus, safetyAcknowledged);
  const provenance = {
    sources: [{ sourceId: "source-1", sourceUrl: "https://example.com/article", sourceTitle: "Weather", sourceProvider: "Example", extractedAt: "2026-07-23T00:00:00.000Z" }],
    generation: { model: "template:template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z" },
    parentEdits: [], finalApprovedVersion: workflowStatus === "approved" ? revision : null, finalApprovedAt: null, finalApprovedByUserId: null,
  };
  return {
    plan: { id: "plan-1", userId: "user-1", ideaId: "idea-1", title, summary: nextContent.overview, learningArea: "Science", yearLevel: nextContent.ageStage, objectives: nextContent.learningIntentions, durationMinutes: nextContent.duration, sourceIds: ["source-1"], sequence: [], resources: [], status: workflowStatus === "approved" ? "saved" : "draft", version: revision, provenance, content: nextContent as unknown as Record<string, unknown>, createdAt: "2026-07-23T00:00:00.000Z", updatedAt: "2026-07-23T00:00:00.000Z" } as unknown as PlanReviewEnvelope["plan"],
    workflowStatus, currentRevision: revision, originalGeneratedRevision: 1, review: nextContent.review!, provenance,
  };
}

function response(payload: unknown, ok = true) {
  return { ok, json: async () => payload };
}

function setupFetch(post: (body: { action: string; content?: GeneratedPlanContent }) => { payload: unknown; ok?: boolean }) {
  const fetchMock = vi.fn(async (_input: string, init?: RequestInit) => {
    if (!init?.method) return response(makeEnvelope());
    const result = post(JSON.parse(String(init.body)));
    return response(result.payload, result.ok !== false);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderReview() {
  render(React.createElement(PlanReviewWorkspace, { ideaId: "idea-1", sourceId: "source-1", planType: "lesson" }));
}

function editAndAcknowledge() {
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Updated weather lab" } });
  fireEvent.click(screen.getByLabelText("I acknowledge the safety and supervision notes."));
}

describe("PlanReviewWorkspace state synchronisation", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("uses the saved baseline for approval and detects a later edit", async () => {
    const fetchMock = setupFetch((body) => body.action === "save"
      ? { payload: makeEnvelope({ title: body.content?.title, revision: 2, safetyAcknowledged: true }) }
      : { payload: makeEnvelope({ title: "Updated weather lab", revision: 2, workflowStatus: "approved", safetyAcknowledged: true }) });
    renderReview();
    await screen.findByRole("button", { name: "Save draft" });
    editAndAcknowledge();
    expect(screen.getByRole("status", { name: "Plan review status: Unsaved changes" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByRole("status", { name: "Plan review status: All changes saved" });
    fireEvent.click(screen.getByRole("button", { name: "Approve plan" }));
    await waitFor(() => expect(screen.getByText("Review status: approved")).toBeTruthy());
    const postBodies = fetchMock.mock.calls.slice(1).map(([, init]) => JSON.parse(String(init?.body)) as { action: string });
    expect(postBodies.map((body) => body.action)).toEqual(["save", "approve"]);
    expect(screen.queryByText("Save your edits before validating or changing the plan status.")).toBeNull();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "A later edit" } });
    expect(screen.getByRole("status", { name: "Plan review status: Unsaved changes" })).toBeTruthy();
  });

  it("saves the current edit before validation", async () => {
    const fetchMock = setupFetch((body) => body.action === "save"
      ? { payload: makeEnvelope({ title: body.content?.title, revision: 2, safetyAcknowledged: true }) }
      : { payload: makeEnvelope({ title: "Updated weather lab", revision: 2, workflowStatus: "ready_for_approval", safetyAcknowledged: true }) });
    renderReview();
    await screen.findByRole("button", { name: "Save draft" });
    editAndAcknowledge();
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    await waitFor(() => expect(screen.getByText("Review status: ready for approval")).toBeTruthy());
    const postBodies = fetchMock.mock.calls.slice(1).map(([, init]) => JSON.parse(String(init?.body)) as { action: string });
    expect(postBodies.map((body) => body.action)).toEqual(["save", "validate"]);
  });

  it("keeps failed saves dirty and blocks approval", async () => {
    const fetchMock = setupFetch(() => ({ payload: { error: "Save failed.", code: "invalid_input" }, ok: false }));
    renderReview();
    await screen.findByRole("button", { name: "Save draft" });
    editAndAcknowledge();
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText("Save failed.");
    expect(screen.getByRole("status", { name: "Plan review status: Unsaved changes" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Approve plan" }));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBe(3));
    const postBodies = fetchMock.mock.calls.slice(1).map(([, init]) => JSON.parse(String(init?.body)) as { action: string });
    expect(postBodies.map((body) => body.action)).toEqual(["save", "save"]);
    expect(postBodies.some((body) => body.action === "approve")).toBe(false);
  });

  it.each(["archive", "return_to_draft"] as const)("saves before %s using the current dirty state", async (action) => {
    const fetchMock = setupFetch((body) => body.action === "save"
      ? { payload: makeEnvelope({ title: body.content?.title, revision: 2, safetyAcknowledged: true }) }
      : { payload: makeEnvelope({ title: "Updated weather lab", revision: 2, workflowStatus: action === "archive" ? "archived" : "returned_to_draft", safetyAcknowledged: true }) });
    renderReview();
    await screen.findByRole("button", { name: "Save draft" });
    editAndAcknowledge();
    fireEvent.click(screen.getByRole("button", { name: action === "archive" ? "Archive" : "Return to draft" }));
    await waitFor(() => expect(screen.getByText(`Review status: ${action === "archive" ? "archived" : "returned to draft"}`)).toBeTruthy());
    const postBodies = fetchMock.mock.calls.slice(1).map(([, init]) => JSON.parse(String(init?.body)) as { action: string });
    expect(postBodies.map((body) => body.action)).toEqual(["save", action]);
  });
});
