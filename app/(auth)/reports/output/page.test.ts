// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

const mockUseSearchParams = vi.fn();
const mockUseFamilyWorkspace = vi.fn();
const mockLoadReportDraftById = vi.fn();
const mockLoadLearnerCurriculumPageData = vi.fn();
const mockLoadFamilyWeeklyPlan = vi.fn();
const mockLoadReportSupportingEvidence = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/app/components/FamilyWorkspaceProvider", () => ({
  useFamilyWorkspace: () => mockUseFamilyWorkspace(),
}));

vi.mock("@/lib/reportDrafts", async () => {
  const actual = await vi.importActual<typeof import("@/lib/reportDrafts")>(
    "@/lib/reportDrafts",
  );
  return {
    ...actual,
    loadReportDraftById: (...args: any[]) => mockLoadReportDraftById(...args),
  };
});

vi.mock("@/lib/familyCurriculum", async () => {
  const actual = await vi.importActual<typeof import("@/lib/familyCurriculum")>(
    "@/lib/familyCurriculum",
  );
  return {
    ...actual,
    loadLearnerCurriculumPageData: (...args: any[]) =>
      mockLoadLearnerCurriculumPageData(...args),
  };
});

vi.mock("@/lib/familyPlanner", async () => {
  const actual = await vi.importActual<typeof import("@/lib/familyPlanner")>(
    "@/lib/familyPlanner",
  );
  return {
    ...actual,
    loadFamilyWeeklyPlan: (...args: any[]) => mockLoadFamilyWeeklyPlan(...args),
  };
});

vi.mock("@/lib/familyEvidence", async () => {
  const actual = await vi.importActual<typeof import("@/lib/familyEvidence")>(
    "@/lib/familyEvidence",
  );
  return {
    ...actual,
    loadReportSupportingEvidence: (...args: any[]) =>
      mockLoadReportSupportingEvidence(...args),
  };
});

type DraftFixture = {
  id: string;
  child_id?: string | null;
  student_id?: string | null;
  child_name: string;
  title: string;
  report_mode: string;
  period_mode?: string | null;
  preferred_market?: string;
  selected_evidence_ids: string[];
  selection_meta: Record<string, { role?: "core" | "appendix"; required?: boolean }>;
  selected_areas: string[];
  include_appendix: boolean;
  include_action_plan: boolean;
  include_weekly_plan: boolean;
  include_readiness_notes: boolean;
  notes: string;
  created_at: string | null;
  updated_at: string | null;
};

function makeDraft(overrides: Partial<DraftFixture> = {}): DraftFixture {
  return {
    id: overrides.id || "draft-1",
    child_id: overrides.child_id ?? "learner-1",
    student_id: overrides.student_id ?? "learner-1",
    child_name: overrides.child_name || "Ava",
    title: overrides.title || "Sample Output Draft",
    report_mode: overrides.report_mode || "family-summary",
    period_mode: overrides.period_mode === undefined ? "term" : overrides.period_mode,
    preferred_market: overrides.preferred_market || "au",
    selected_evidence_ids: overrides.selected_evidence_ids || [],
    selection_meta: overrides.selection_meta || {},
    selected_areas: overrides.selected_areas || [],
    include_appendix: overrides.include_appendix ?? false,
    include_action_plan: overrides.include_action_plan ?? true,
    include_weekly_plan: overrides.include_weekly_plan ?? true,
    include_readiness_notes: overrides.include_readiness_notes ?? true,
    notes: overrides.notes || "",
    created_at: overrides.created_at || "2026-04-01T00:00:00.000Z",
    updated_at: overrides.updated_at || "2026-04-10T00:00:00.000Z",
  };
}

async function renderOutputPage() {
  const module = await import("@/app/(auth)/reports/output/page");
  render(React.createElement(module.default));
  await screen.findByText("Summary of Learning");
}

beforeEach(() => {
  mockUseSearchParams.mockReturnValue({
    get: (key: string) => (key === "draftId" ? "draft-1" : null),
  });
  mockUseFamilyWorkspace.mockReturnValue({
    workspace: {
      profile: {
        id: "family-1",
        preferred_market: "au",
        curriculum_preferences: {
          country_id: "au",
          region_id: "nsw",
          framework_id: null,
          level_id: null,
          subject_ids: [],
          compliance_profile: {
            country: "Australia",
            state: "NSW",
          },
        },
      },
      learners: [{ id: "learner-1", label: "Ava Example" }],
    },
    activeLearnerId: "learner-1",
    setActiveLearner: vi.fn(),
    error: "",
  });
  mockLoadLearnerCurriculumPageData.mockResolvedValue(null);
  mockLoadFamilyWeeklyPlan.mockResolvedValue({ actions: [] });
  mockLoadReportSupportingEvidence.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("/reports/output framing", () => {
  it("renders workflow, period, export, and AU overlay framing for AU usable data", async () => {
    mockLoadReportDraftById.mockResolvedValue(
      makeDraft({
        title: "AU Prepared Draft",
        period_mode: "term",
        selected_evidence_ids: ["e1", "e2"],
        selection_meta: {
          e1: { role: "core" },
          e2: { role: "core" },
        },
        selected_areas: ["Literacy", "Science"],
        include_appendix: true,
      }),
    );

    await renderOutputPage();

    expect(screen.getByText("Ready for review")).toBeTruthy();
    expect(
      screen.getByText((_, element) => element?.textContent === "Reporting period: Term"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /This report reflects ongoing learning aligned with your selected curriculum/i,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Use this report as part of your record for this term."),
    ).toBeTruthy();
  });

  it("renders calm fallback framing for minimal non-AU data without AU overlay", async () => {
    mockUseFamilyWorkspace.mockReturnValue({
      workspace: {
        profile: {
          id: "family-2",
          preferred_market: "us",
          curriculum_preferences: {
            country_id: "us",
            region_id: "california",
            framework_id: null,
            level_id: null,
            subject_ids: [],
          },
        },
        learners: [{ id: "learner-1", label: "Ava Example" }],
      },
      activeLearnerId: "learner-1",
      setActiveLearner: vi.fn(),
      error: "",
    });
    mockLoadReportDraftById.mockResolvedValue(
      makeDraft({
        title: "Thin Draft",
        preferred_market: "us",
        period_mode: null,
        selected_evidence_ids: [],
        selection_meta: {},
        selected_areas: [],
        include_appendix: false,
      }),
    );

    await renderOutputPage();

    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Reporting period: Custom learning period",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Use this report as part of your record for this period.")).toBeTruthy();
    expect(screen.queryByText(/selected curriculum/i)).toBeNull();

    const pageText = document.body.textContent?.toLowerCase() || "";
    expect(pageText).not.toContain("required");
    expect(pageText).not.toContain("complete");
    expect(pageText).not.toContain("validated");
    expect(pageText).not.toContain("compliant");
    expect(pageText).not.toContain("failed");

    await waitFor(() => {
      expect(
        screen.getByText(/the report is still building its base/i),
      ).toBeTruthy();
    });
  });
});
