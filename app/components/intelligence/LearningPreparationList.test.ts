// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LearningPreparationList from "@/app/components/intelligence/LearningPreparationList";

describe("LearningPreparationList", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("shows preparation categories and parent actions", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/resources")) return new Response(JSON.stringify({ resources: [] }), { status: 200 });
      return new Response(JSON.stringify({ recommendations: [{ recommendationId: "plan:4:safety:0:supervise", objectType: "safety_supervision_action", title: "Safety and supervision", summary: "Supervise", category: "Safety", priorityRank: 1, reasonCode: "SAFETY_REQUIRED", parentReadableReason: "Required first.", required: true, resourceClassification: null, resourceKey: null, sourcePlan: { planId: "plan", revisionId: "revision", revisionNumber: 4 }, engineVersion: "engine", rulesVersion: "rules", provenance: { sourceProvenance: {}, generatedAt: "now" }, interaction: { recommendationId: "plan:4:safety:0:supervise", ownedDecision: null, saved: false, dismissed: false, prepared: false, completed: false } }] }), { status: 200 });
    }));
    render(React.createElement(LearningPreparationList, { ideaId: "idea", sourceId: "source", planType: "lesson", planId: "plan", revision: 4 }));
    expect((await screen.findAllByText("Safety and supervision")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Mark prepared" })).toBeTruthy();
  });
});
