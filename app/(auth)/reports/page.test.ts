// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";

const mockUseSearchParams = vi.fn();
const mockUseRouter = vi.fn();
const mockUseFamilyWorkspace = vi.fn();
const mockListReportDrafts = vi.fn();
const mockLoadReportDraftById = vi.fn();
const mockLoadEvidenceEntriesWithVariants = vi.fn();
const mockLoadLearnerCurriculumPageData = vi.fn();
const mockLoadFamilyWeeklyPlan = vi.fn();
const mockReadGuidedCompletionSnapshot = vi.fn();
const mockWriteGuidedCompletionSnapshot = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => mockUseRouter(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/app/components/FamilyWorkspaceProvider", () => ({
  useFamilyWorkspace: () => mockUseFamilyWorkspace(),
}));

vi.mock("@/app/components/GuidedCompletionFeedback", () => ({
  default: () => null,
}));

vi.mock("@/app/components/FamilyHandoffNote", () => ({
  default: () => null,
}));

vi.mock("@/lib/familyEvidence", () => ({
  loadEvidenceEntriesWithVariants: (...args: any[]) =>
    mockLoadEvidenceEntriesWithVariants(...args),
}));

vi.mock("@/lib/reportDrafts", async () => {
  const actual = await vi.importActual<typeof import("@/lib/reportDrafts")>(
    "@/lib/reportDrafts",
  );
  return {
    ...actual,
    listReportDrafts: (...args: any[]) => mockListReportDrafts(...args),
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

vi.mock("@/lib/familyCommandHandoff", () => ({
  FAMILY_SHELL_HANDOFF_QUERY_PARAM: "handoff",
  resolveFamilyShellHandoff: () => null,
}));

vi.mock("@/lib/familyWorkspace", () => ({
  resolveCanonicalActiveLearnerId: (learners: Array<{ id: string }>) => learners[0]?.id || "",
}));

vi.mock("@/lib/guidedCompletionSnapshot", () => ({
  readGuidedCompletionSnapshot: (...args: any[]) => mockReadGuidedCompletionSnapshot(...args),
  writeGuidedCompletionSnapshot: (...args: any[]) => mockWriteGuidedCompletionSnapshot(...args),
}));

type DraftFixture = {
  id: string;
  title: string;
  child_name: string;
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
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

function makeDraft(overrides: Partial<DraftFixture>): DraftFixture {
  return {
    id: overrides.id || "draft-1",
    title: overrides.title || "Sample Draft",
    child_name: overrides.child_name || "Ava",
    report_mode: overrides.report_mode || "family-summary",
    period_mode:
      overrides.period_mode === undefined ? "term" : overrides.period_mode,
    preferred_market: overrides.preferred_market || "au",
    selected_evidence_ids: overrides.selected_evidence_ids || [],
    selection_meta: overrides.selection_meta || {},
    selected_areas: overrides.selected_areas || [],
    include_appendix: overrides.include_appendix ?? false,
    include_action_plan: overrides.include_action_plan ?? true,
    include_weekly_plan: overrides.include_weekly_plan ?? true,
    include_readiness_notes: overrides.include_readiness_notes ?? true,
    notes: overrides.notes || "",
    status: overrides.status || "draft",
    created_at: overrides.created_at || "2026-04-01T00:00:00.000Z",
    updated_at: overrides.updated_at || "2026-04-10T00:00:00.000Z",
  };
}

function getSavedReportsSection() {
  const heading = screen.getByText("Saved reports");
  const section = heading.closest("section");
  if (!section) {
    throw new Error("Missing saved reports section");
  }
  return section as HTMLElement;
}

function getGroupSection(label: string) {
  const heading = within(getSavedReportsSection()).getByText(`Reporting period: ${label}`);
  const groupContainer = heading.parentElement?.parentElement;
  if (!groupContainer) {
    throw new Error(`Missing group container for ${label}`);
  }
  return groupContainer as HTMLElement;
}

async function renderReportsPage() {
  const module = await import("@/app/(auth)/reports/page");
  render(React.createElement(module.default));
  await screen.findByText("Saved reports");
}

beforeEach(() => {
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
  mockUseRouter.mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  });
  mockUseFamilyWorkspace.mockReturnValue({
    workspace: {
      profile: {
        id: "family-1",
        preferred_market: "au",
        curriculum_preferences: {
          country_id: "au",
          region_id: "tasmania",
          framework_id: null,
          level_id: null,
          subject_ids: [],
        },
        report_tone_default: "family-summary",
        show_authority_guidance: true,
      },
      learners: [{ id: "learner-1", label: "Ava Example", yearLabel: "Year 3" }],
    },
    activeLearnerId: "learner-1",
    setActiveLearner: vi.fn(),
    error: "",
  });
  mockLoadEvidenceEntriesWithVariants.mockResolvedValue([]);
  mockLoadReportDraftById.mockResolvedValue(null);
  mockLoadLearnerCurriculumPageData.mockResolvedValue(null);
  mockLoadFamilyWeeklyPlan.mockResolvedValue({ actions: [] });
  mockReadGuidedCompletionSnapshot.mockReturnValue(null);
  mockWriteGuidedCompletionSnapshot.mockReturnValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("/reports grouped saved drafts UI", () => {
  it("renders mixed saved drafts under grouped reporting-period sections", async () => {
    mockListReportDrafts.mockResolvedValue([
      makeDraft({
        id: "term-draft",
        title: "Term Draft",
        period_mode: "term",
        selected_evidence_ids: ["e1", "e2"],
        selection_meta: {
          e1: { role: "core" },
          e2: { role: "core" },
        },
        selected_areas: ["Literacy", "Science"],
      }),
      makeDraft({
        id: "semester-draft",
        title: "Semester Draft",
        period_mode: "semester",
        selected_evidence_ids: ["e3"],
        selection_meta: {
          e3: { role: "core" },
        },
        selected_areas: ["Numeracy"],
      }),
      makeDraft({
        id: "annual-draft",
        title: "Annual Draft",
        period_mode: "year",
        selected_evidence_ids: ["e4"],
        selection_meta: {
          e4: { role: "core" },
        },
        selected_areas: ["Humanities"],
      }),
    ]);

    await renderReportsPage();

    const savedReportsSection = getSavedReportsSection();

    expect(within(savedReportsSection).getByText("Reporting period: Term")).toBeTruthy();
    expect(within(savedReportsSection).getByText("Reporting period: Semester")).toBeTruthy();
    expect(within(savedReportsSection).getByText("Reporting period: Annual review")).toBeTruthy();
    expect(
      within(savedReportsSection).getAllByText(
        "These reports belong to the same reporting window.",
      ),
    ).toHaveLength(3);

    expect(within(getGroupSection("Term")).getByText("Term Draft")).toBeTruthy();
    expect(within(getGroupSection("Semester")).getByText("Semester Draft")).toBeTruthy();
    expect(within(getGroupSection("Annual review")).getByText("Annual Draft")).toBeTruthy();

    expect(within(getGroupSection("Term")).getByText("Prepared for records")).toBeTruthy();
    expect(within(getGroupSection("Semester")).getByText("Ready for review")).toBeTruthy();
    expect(
      within(getGroupSection("Term")).getByText(
        "Prepared for this term as part of your family learning record.",
      ),
    ).toBeTruthy();
  });

  it("renders a custom fallback group for unknown or missing period data", async () => {
    mockListReportDrafts.mockResolvedValue([
      makeDraft({
        id: "custom-unknown",
        title: "Unknown Period Draft",
        period_mode: "all",
        selected_evidence_ids: [],
        selection_meta: {},
        selected_areas: [],
      }),
      makeDraft({
        id: "custom-missing",
        title: "Missing Period Draft",
        period_mode: null,
        selected_evidence_ids: [],
        selection_meta: {},
        selected_areas: [],
        updated_at: "2026-04-11T00:00:00.000Z",
      }),
    ]);

    await renderReportsPage();

    const savedReportsSection = getSavedReportsSection();

    expect(within(savedReportsSection).getByText("Reporting period: All Time")).toBeTruthy();
    expect(
      within(savedReportsSection).getByText("Reports grouped for this learning period."),
    ).toBeTruthy();

    const customSection = getGroupSection("All Time");
    expect(within(customSection).getByText("Unknown Period Draft")).toBeTruthy();
    expect(within(customSection).getByText("Missing Period Draft")).toBeTruthy();
    expect(within(customSection).getAllByText("Draft")).toHaveLength(2);
  });
});
