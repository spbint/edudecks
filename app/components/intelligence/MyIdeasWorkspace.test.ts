// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import MyIdeasWorkspace from "@/app/components/intelligence/MyIdeasWorkspace";
import type { IdeasService } from "@/lib/intelligence/ideas/service";
import type { Idea } from "@/lib/intelligence/types";
import type { GeneratedPlanContent, LearningPlanDraft, LearningPlanType, PlanReviewMetadata } from "@/lib/intelligence/plans/types";
import type { PlanReviewEnvelope } from "@/lib/intelligence/plans/reviewTypes";

vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: vi.fn(),
}));

const mockedUseAuthUser = vi.mocked(useAuthUser);

function makeIdea(url = "https://example.com/idea"): Idea {
  return {
    id: "idea-1",
    userId: "user-1",
    title: "Saved idea",
    description: "",
    tags: [],
    status: "active",
    sources: [
      {
        id: "source-1",
        ideaId: "idea-1",
        userId: "user-1",
        sourceType: "url",
        url,
        canonicalUrl: url,
        provider: null,
        title: null,
        description: null,
        siteName: null,
        imageUrl: null,
        author: null,
        publishedAt: null,
        metadataStatus: "pending",
        metadata: {},
        extractedAt: null,
        createdAt: "2026-07-23T00:00:00.000Z",
        updatedAt: "2026-07-23T00:00:00.000Z",
      },
    ],
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  };
}

function setupAuth() {
  mockedUseAuthUser.mockReturnValue({
    user: { id: "user-1" } as never,
    profile: null,
    loading: false,
  });
}

function renderWorkspace(service: IdeasService) {
  return render(React.createElement(MyIdeasWorkspace, { service }));
}

function makeReview(planType: LearningPlanType, workflowStatus: PlanReviewMetadata["workflowStatus"] = "approved", revision = 4): PlanReviewEnvelope {
  const content: GeneratedPlanContent = {
    planType,
    title: `${planType} plan`,
    overview: "A persisted plan.",
    subjects: ["Science"],
    ageStage: "Ages 8-10",
    duration: 45,
    durationUnit: "minutes",
    learningIntentions: ["Learn"],
    successCriteria: ["Explain"],
    sequence: [{ title: "Explore", objective: "Observe", activity: "Try it", durationMinutes: 20, notes: "" }],
    resourceRequirements: [{ name: "Paper", category: "Materials", quantity: "1", required: true, url: null, notes: "" }],
    preparation: ["Gather paper."],
    discussionQuestions: ["What changed?"],
    differentiation: [],
    assessmentApproach: "Discuss the result.",
    evidencePrompts: [],
    portfolioPrompts: [],
    safetySupervisionNotes: ["Supervise."],
    sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com/idea", finalUrl: null, canonicalUrl: null, title: "Idea", provider: "Example", extractedAt: "2026-07-23T00:00:00.000Z" },
    limitationsAssumptions: [],
    parentInstructions: null,
    generation: { provider: "template", model: "template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z", revision },
    validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" },
    review: { workflowStatus, originalGeneratedRevision: 1, revisionKind: revision > 1 ? "parent_edit" : "generated", changedFields: [], lastEditedAt: null, lastEditedByUserId: null, safetyAcknowledged: true, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" } },
  };
  const plan = {
    id: `${planType}-plan-1`, userId: "user-1", ideaId: "idea-1", title: content.title, summary: content.overview,
    learningArea: "Science", yearLevel: content.ageStage, objectives: content.learningIntentions, sourceIds: ["source-1"], sequence: [], resources: [],
    status: workflowStatus === "approved" ? "saved" : "draft", version: revision, provenance: {
      sources: [{ sourceId: "source-1", sourceUrl: "https://example.com/idea", sourceTitle: "Idea", sourceProvider: "Example", extractedAt: "2026-07-23T00:00:00.000Z" }],
      generation: { model: "template:template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z" }, parentEdits: [], finalApprovedVersion: workflowStatus === "approved" ? revision : null, finalApprovedAt: workflowStatus === "approved" ? "2026-07-23T01:00:00.000Z" : null, finalApprovedByUserId: workflowStatus === "approved" ? "user-1" : null,
    }, content: content as unknown as Record<string, unknown>, createdAt: "2026-07-23T00:00:00.000Z", updatedAt: "2026-07-23T01:00:00.000Z",
  } as unknown as LearningPlanDraft;
  return { plan, workflowStatus, currentRevision: revision, originalGeneratedRevision: 1, review: content.review!, provenance: plan.provenance };
}

function readyIdea() {
  const idea = makeIdea();
  idea.sources[0].metadata = { extractionStatus: "ready", title: "Idea", provider: "Example" };
  return idea;
}

function mockPlanReads(options: { lesson?: PlanReviewEnvelope | null; unit?: PlanReviewEnvelope | null; errorType?: LearningPlanType }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const href = String(input);
    if (init?.method === "POST") return new Response(JSON.stringify({ state: "ready", plan: options.lesson?.plan ?? null }), { status: 200 });
    const type: LearningPlanType = href.includes("/plans/unit/review") ? "unit" : "lesson";
    if (options.errorType === type) return new Response(JSON.stringify({ error: "internal database error" }), { status: 500 });
    const value = options[type];
    return value ? new Response(JSON.stringify(value), { status: 200 }) : new Response(JSON.stringify({ error: "Plan not found." }), { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("MyIdeasWorkspace", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows the empty state and validates before persistence", async () => {
    setupAuth();
    const service: IdeasService = {
      listForUser: vi.fn(async () => []),
      createForUser: vi.fn(),
    };

    renderWorkspace(service);
    expect(await screen.findByText("No ideas saved yet. Add your first link above.")).toBeTruthy();

    fireEvent.submit(screen.getByRole("button", { name: "Save idea" }));

    expect((await screen.findByRole("alert")).textContent).toContain("A source URL is required.");
    expect(service.createForUser).not.toHaveBeenCalled();
  });

  it("shows success after saving an idea", async () => {
    setupAuth();
    const service: IdeasService = {
      listForUser: vi.fn(async () => []),
      createForUser: vi.fn(async () => makeIdea()),
    };

    renderWorkspace(service);
    await screen.findByText("No ideas saved yet. Add your first link above.");
    fireEvent.change(screen.getByLabelText("Idea URL"), {
      target: { value: "https://example.com/idea" },
    });
    fireEvent.change(screen.getByLabelText("Optional idea title"), {
      target: { value: "A saved idea" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save idea" }));

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("Your idea was saved."),
    );
    expect(screen.getByText("https://example.com/idea")).toBeTruthy();
    expect(service.createForUser).toHaveBeenCalledWith("user-1", {
      url: "https://example.com/idea",
      title: "A saved idea",
    });
  });

  it("shows persistence errors without losing the form", async () => {
    setupAuth();
    const service: IdeasService = {
      listForUser: vi.fn(async () => []),
      createForUser: vi.fn(async () => {
        throw new Error("Storage is unavailable.");
      }),
    };

    renderWorkspace(service);
    await screen.findByText("No ideas saved yet. Add your first link above.");
    fireEvent.change(screen.getByLabelText("Idea URL"), {
      target: { value: "https://example.com/idea" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save idea" }));

    expect(await screen.findByText("Storage is unavailable.")).toBeTruthy();
    expect((screen.getByLabelText("Idea URL") as HTMLInputElement).value).toBe(
      "https://example.com/idea",
    );
  });

  it("restores an approved lesson plan after reload and exposes its persisted handoffs", async () => {
    setupAuth();
    vi.stubEnv("NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE", "true");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS", "true");
    const service: IdeasService = { listForUser: vi.fn(async () => [readyIdea()]), createForUser: vi.fn() };
    const fetchMock = mockPlanReads({ lesson: makeReview("lesson"), unit: null });

    renderWorkspace(service);

    expect(await screen.findByText("Plan status: Approved")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open approved plan" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "View preparation list" }).getAttribute("href")).toBe("/my-ideas/idea-1/sources/source-1/plans/lesson/preparation?planId=lesson-plan-1&revision=4");
    expect(screen.queryByRole("button", { name: "Generate draft" })).toBeNull();
    expect(fetchMock.mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
  });

  it("restores an editing lesson draft and does not offer duplicate generation", async () => {
    setupAuth();
    const service: IdeasService = { listForUser: vi.fn(async () => [readyIdea()]), createForUser: vi.fn() };
    mockPlanReads({ lesson: makeReview("lesson", "editing", 2), unit: null });

    renderWorkspace(service);

    expect(await screen.findByText("Plan status: Editing")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Review and edit plan" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Generate draft" })).toBeNull();
  });

  it("shows Generate draft only when the selected plan type has no persisted plan", async () => {
    setupAuth();
    const service: IdeasService = { listForUser: vi.fn(async () => [readyIdea()]), createForUser: vi.fn() };
    const fetchMock = mockPlanReads({ lesson: makeReview("lesson"), unit: null });

    renderWorkspace(service);
    await screen.findByRole("link", { name: "Open approved plan" });
    fireEvent.change(screen.getByLabelText("Plan type"), { target: { value: "unit" } });

    expect(await screen.findByRole("button", { name: "Generate draft" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Open approved plan" })).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/plans/lesson/review"), expect.objectContaining({ cache: "no-store" }));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/plans/unit/review"), expect.objectContaining({ cache: "no-store" }));
  });

  it("keeps the Ideas list visible when persisted plan hydration fails", async () => {
    setupAuth();
    const service: IdeasService = { listForUser: vi.fn(async () => [readyIdea()]), createForUser: vi.fn() };
    mockPlanReads({ errorType: "lesson", unit: null });

    renderWorkspace(service);

    expect(await screen.findByText("Saved idea")).toBeTruthy();
    expect((await screen.findByRole("alert")).textContent).toContain("Some saved plan details are temporarily unavailable.");
    expect(screen.queryByRole("button", { name: "Generate draft" })).toBeNull();
  });

  it("refreshes persisted state after successful generation without writing during hydration", async () => {
    setupAuth();
    const service: IdeasService = { listForUser: vi.fn(async () => [readyIdea()]), createForUser: vi.fn() };
    const persisted = makeReview("lesson", "editing", 1);
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const href = String(input);
      if (init?.method === "POST") return new Response(JSON.stringify({ state: "ready", plan: persisted.plan }), { status: 200 });
      if (href.includes("/plans/unit/review")) return new Response(JSON.stringify({ error: "Plan not found." }), { status: 404 });
      return fetchMock.mock.calls.filter(([calledInput]) => String(calledInput).includes("/plans/lesson/review")).length > 1
        ? new Response(JSON.stringify(persisted), { status: 200 })
        : new Response(JSON.stringify({ error: "Plan not found." }), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWorkspace(service);
    await screen.findByRole("button", { name: "Generate draft" });
    fireEvent.change(screen.getByLabelText("Learner age or stage"), { target: { value: "Ages 8-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate draft" }));

    expect(await screen.findByRole("link", { name: "Review and edit plan" })).toBeTruthy();
    expect(fetchMock.mock.calls.some(([calledInput, requestInit]) => String(calledInput).includes("/plans/lesson") && !requestInit?.method)).toBe(true);
    expect(fetchMock.mock.calls.some(([, requestInit]) => requestInit?.method === "POST")).toBe(true);
  });
});
