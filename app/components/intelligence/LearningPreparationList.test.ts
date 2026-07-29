// @vitest-environment jsdom

import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LearningPreparationList, { PREPARATION_LOAD_TIMEOUT_MS } from "@/app/components/intelligence/LearningPreparationList";

const recommendation = { recommendationId: "plan:4:safety:0:supervise", objectType: "safety_supervision_action", title: "Safety and supervision", summary: "Supervise", category: "Safety", priorityRank: 1, reasonCode: "SAFETY_REQUIRED", parentReadableReason: "Required first.", required: true, resourceClassification: null, resourceKey: null, sourcePlan: { planId: "plan", revisionId: "revision", revisionNumber: 4 }, engineVersion: "engine", rulesVersion: "rules", provenance: { sourceProvenance: {}, generatedAt: "now" }, interaction: { recommendationId: "plan:4:safety:0:supervise", ownedDecision: null, saved: false, dismissed: false, prepared: false, completed: false } };

function renderList() {
  return render(React.createElement(LearningPreparationList, { ideaId: "idea", sourceId: "source", planType: "lesson", planId: "plan", revision: 4 }));
}

function successResponse(withRecommendation = false) {
  return new Response(JSON.stringify({ recommendations: withRecommendation ? [recommendation] : [], ownedRevision: { planId: "plan", revisionId: "revision", revisionNumber: 4 }, commerce: { status: "disabled", products: [], exclusions: [], unmatchedResourceKeys: [], generatedAt: "now" } }), { status: 200 });
}

describe("LearningPreparationList", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it("shows preparation categories and parent actions", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") return new Response("{}", { status: 200 });
      if (url.includes("/resources")) return new Response(JSON.stringify({ resources: [] }), { status: 200 });
      return new Response(JSON.stringify({ recommendations: [recommendation], ownedRevision: { planId: "plan", revisionId: "revision", revisionNumber: 4 }, commerce: { status: "disabled", products: [], exclusions: [], unmatchedResourceKeys: [], generatedAt: "now" } }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    renderList();
    expect((await screen.findAllByText("Safety and supervision")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Mark prepared" })).toBeTruthy();
    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(true));
  });

  it("ends loading with a bounded timeout, safe error, retry, and no impression event", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }));
    vi.stubGlobal("fetch", fetchMock);
    renderList();

    await act(async () => { await vi.advanceTimersByTimeAsync(PREPARATION_LOAD_TIMEOUT_MS); });
    expect(screen.getByRole("alert").textContent).toContain("taking too long to load");
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
  });

  it("starts one fresh request set on retry and prevents overlap", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const requestNumber = fetchMock.mock.calls.length;
      if (requestNumber <= 2) return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
      if (url.includes("/resources")) return Promise.resolve(new Response(JSON.stringify({ resources: [] }), { status: 200 }));
      return Promise.resolve(successResponse());
    });
    vi.stubGlobal("fetch", fetchMock);
    renderList();
    await act(async () => { await vi.advanceTimersByTimeAsync(PREPARATION_LOAD_TIMEOUT_MS); });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("aborts outstanding initial requests when unmounted", async () => {
    const aborts: AbortSignal[] = [];
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (init?.signal) aborts.push(init.signal);
      return new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderList();
    cleanup();
    expect(aborts.length).toBe(2);
    expect(aborts.every((signal) => signal.aborted)).toBe(true);
  });
});
