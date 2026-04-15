import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    createClient: vi.fn(),
    loadLearnerCurriculumPageData: vi.fn(),
    loadReportSupportingEvidence: vi.fn(),
    existsSync: vi.fn(),
    mkdtemp: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    rm: vi.fn(),
    spawn: vi.fn(),
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/familyCurriculum", () => ({
  loadLearnerCurriculumPageData: mocks.loadLearnerCurriculumPageData,
}));

vi.mock("@/lib/familyEvidence", () => ({
  loadReportSupportingEvidence: mocks.loadReportSupportingEvidence,
}));

vi.mock("@/lib/supabaseClient", () => ({
  hasSupabaseEnv: true,
}));

vi.mock("node:fs", () => ({
  existsSync: mocks.existsSync,
  promises: {
    mkdtemp: mocks.mkdtemp,
    writeFile: mocks.writeFile,
    readFile: mocks.readFile,
    rm: mocks.rm,
  },
}));

vi.mock("node:child_process", () => ({
  spawn: mocks.spawn,
}));

import { loadCanonicalReportPdfData, renderReportPdf } from "@/lib/reportPdf";

function makeQueryBuilder(result: unknown) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
  };

  return builder;
}

function createPdfClientFixture(input?: {
  userId?: string | null;
  userError?: Error | null;
  familyProfile?: unknown;
  familyProfileError?: Error | null;
  draft?: unknown;
  draftError?: Error | null;
}) {
  const hasFamilyProfile = input && "familyProfile" in input;
  const hasDraft = input && "draft" in input;
  const familyProfileBuilder = makeQueryBuilder({
    data: hasFamilyProfile
      ? input?.familyProfile
      : {
          preferred_market: "au",
          curriculum_preferences: null,
        },
    error: input?.familyProfileError ?? null,
  });
  const draftBuilder = makeQueryBuilder({
    data: hasDraft
      ? input?.draft
      : ({
          id: "draft-123",
          student_id: "learner-1",
          child_id: null,
          child_name: "Avery",
          preferred_market: "",
          selected_evidence_ids: ["ev-1"],
          notes: "A calm note from home.",
        } as const),
    error: input?.draftError ?? null,
  });

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: input?.userId === null ? null : { id: input?.userId ?? "user-1" },
        },
        error: input?.userError ?? null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "family_profiles") return familyProfileBuilder;
      if (table === "report_drafts") return draftBuilder;
      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

function createCurriculumDataFixture() {
  return {
    framework: { id: "acf", name: "Australian Curriculum" },
    level: { id: "stage-2", name: "Stage 2" },
    totalOutcomes: 2,
    plannedLinkedOutcomeCount: 2,
    evidenceLinkedOutcomeCount: 1,
    plannedOnlyOutcomeCount: 1,
    evidenceOnlyOutcomeCount: 0,
    plannedAndEvidencedOutcomeCount: 1,
    totalPlanLinks: 2,
    totalEvidenceLinks: 1,
    trackedOutcomeCount: 2,
    statusCounts: { secure: 1 },
    areas: [
      {
        name: "English",
        plannedCount: 2,
        evidenceCount: 1,
        strands: [
          {
            outcomes: [
              { plannedCount: 1, evidenceCount: 1, status: "secure" },
              { plannedCount: 1, evidenceCount: 0, status: "developing" },
            ],
          },
        ],
      },
    ],
  };
}

function queueSpawnClose(code: number, stderr = "") {
  const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter };
  child.stderr = new EventEmitter();
  mocks.spawn.mockImplementationOnce(() => {
    queueMicrotask(() => {
      if (stderr) child.stderr.emit("data", stderr);
      child.emit("close", code);
    });
    return child as unknown as ReturnType<typeof mocks.spawn>;
  });
}

function queueSpawnError(error: Error) {
  const child = new EventEmitter() as EventEmitter & { stderr: EventEmitter };
  child.stderr = new EventEmitter();
  mocks.spawn.mockImplementationOnce(() => {
    queueMicrotask(() => {
      child.emit("error", error);
    });
    return child as unknown as ReturnType<typeof mocks.spawn>;
  });
}

describe("loadCanonicalReportPdfData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mocks.loadLearnerCurriculumPageData.mockResolvedValue(createCurriculumDataFixture());
    mocks.loadReportSupportingEvidence.mockResolvedValue([
      { id: "ev-1", title: "Observation note" },
    ]);
  });

  it("loads canonical PDF data successfully and returns the downstream shape", async () => {
    const client = createPdfClientFixture({
      familyProfile: {
        preferred_market: "au",
        curriculum_preferences: {
          country_id: "au",
          region_id: "nsw",
          framework_id: "acf",
          level_id: "stage-2",
          subject_ids: [],
          compliance_profile: {
            country: "Australia",
            state: "NSW",
          },
        },
      },
    });
    mocks.createClient.mockReturnValue(client);

    const result = await loadCanonicalReportPdfData({
      draftId: "draft-123",
      accessToken: "token-123",
    });

    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(client.auth.getUser).toHaveBeenCalledWith("token-123");
    expect(mocks.loadLearnerCurriculumPageData).toHaveBeenCalledWith({
      studentId: "learner-1",
      familyPreferences: {
        country_id: "au",
        region_id: "nsw",
        framework_id: "acf",
        level_id: "stage-2",
        subject_ids: [],
        compliance_profile: {
          country: "Australia",
          state: "NSW",
        },
      },
      client,
    });
    expect(mocks.loadReportSupportingEvidence).toHaveBeenCalledWith({
      evidenceIds: ["ev-1"],
      studentId: "learner-1",
      limit: 4,
      client,
    });
    expect(result).toMatchObject({
      learnerId: "learner-1",
      preferredMarket: "au",
      familyPreferences: {
        country_id: "au",
        region_id: "nsw",
      },
      supportingEvidence: [{ id: "ev-1", title: "Observation note" }],
    });
    expect(result.curriculumCoverage.ready).toBe(true);
    expect(result.parentLanguage.overall).toContain(
      "Planning and evidence are starting to line up well",
    );
  });

  it("falls back to default family preferences and family profile market when optional fields are absent", async () => {
    const client = createPdfClientFixture({
      familyProfile: {
        preferred_market: "uk",
        curriculum_preferences: null,
      },
      draft: {
        id: "draft-123",
        student_id: "learner-1",
        child_id: null,
        child_name: "Avery",
        preferred_market: "",
        selected_evidence_ids: [],
        notes: "",
      },
    });
    mocks.createClient.mockReturnValue(client);
    mocks.loadReportSupportingEvidence.mockResolvedValue([]);

    const result = await loadCanonicalReportPdfData({
      draftId: "draft-123",
      accessToken: "token-123",
    });

    expect(mocks.loadLearnerCurriculumPageData).toHaveBeenCalledWith({
      studentId: "learner-1",
      familyPreferences: {
        country_id: null,
        region_id: null,
        framework_id: null,
        level_id: null,
        subject_ids: [],
      },
      client,
    });
    expect(result.preferredMarket).toBe("uk");
    expect(result.familyPreferences).toEqual({
      country_id: null,
      region_id: null,
      framework_id: null,
      level_id: null,
      subject_ids: [],
    });
    expect(result.supportingEvidence).toEqual([]);
  });

  it("throws when the signed-in session is invalid", async () => {
    const client = createPdfClientFixture({
      userId: null,
      userError: new Error("session missing"),
    });
    mocks.createClient.mockReturnValue(client);

    await expect(
      loadCanonicalReportPdfData({
        draftId: "draft-123",
        accessToken: "token-123",
      }),
    ).rejects.toThrow("A valid signed-in session is required to export this report.");
  });

  it("throws when the report draft cannot be found", async () => {
    const client = createPdfClientFixture({ draft: null });
    mocks.createClient.mockReturnValue(client);

    await expect(
      loadCanonicalReportPdfData({
        draftId: "missing-draft",
        accessToken: "token-123",
      }),
    ).rejects.toThrow("Report draft not found.");
  });

  it("throws when no learner is attached to the draft", async () => {
    const client = createPdfClientFixture({
      draft: {
        id: "draft-123",
        student_id: "",
        child_id: "",
        child_name: "Avery",
        preferred_market: "au",
        selected_evidence_ids: [],
        notes: "",
      },
    });
    mocks.createClient.mockReturnValue(client);

    await expect(
      loadCanonicalReportPdfData({
        draftId: "draft-123",
        accessToken: "token-123",
      }),
    ).rejects.toThrow("No learner is attached to this draft.");
  });
});

describe("renderReportPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CHROME_PATH = "C:\\Chrome\\chrome.exe";
    mocks.existsSync.mockImplementation((candidate) => candidate === process.env.CHROME_PATH);
    mocks.mkdtemp.mockResolvedValue("C:\\temp\\edudecks-report-pdf-123");
    mocks.writeFile.mockResolvedValue(undefined);
    mocks.readFile.mockResolvedValue(Buffer.from("pdf-bytes"));
    mocks.rm.mockResolvedValue(undefined);
  });

  it("renders a PDF successfully and cleans up the temp directory", async () => {
    queueSpawnClose(0);

    const result = await renderReportPdf("<html><body>Report</body></html>");

    expect(mocks.writeFile).toHaveBeenCalledWith(
      "C:\\temp\\edudecks-report-pdf-123\\report.html",
      "<html><body>Report</body></html>",
      "utf8",
    );
    expect(mocks.spawn).toHaveBeenCalledOnce();
    const [browserPath, args, options] = mocks.spawn.mock.calls[0];
    expect(browserPath).toBe("C:\\Chrome\\chrome.exe");
    expect(args).toContain("--headless=new");
    expect(args).toContain("--print-to-pdf=C:\\temp\\edudecks-report-pdf-123\\report.pdf");
    expect(args).toContain("file:///C:/temp/edudecks-report-pdf-123/report.html");
    expect(options).toEqual({ windowsHide: true });
    expect(result).toEqual(Buffer.from("pdf-bytes"));
    expect(mocks.rm).toHaveBeenCalledWith("C:\\temp\\edudecks-report-pdf-123", {
      recursive: true,
      force: true,
    });
  });

  it("throws a clear error when no Chromium executable is available", async () => {
    mocks.existsSync.mockReturnValue(false);

    await expect(renderReportPdf("<html />")).rejects.toThrow(
      "A Chromium browser executable was not found for PDF export.",
    );
    expect(mocks.mkdtemp).not.toHaveBeenCalled();
  });

  it("surfaces Chromium render failures and still cleans up temp files", async () => {
    queueSpawnClose(1, "Chromium stderr failure");

    await expect(renderReportPdf("<html />")).rejects.toThrow("Chromium stderr failure");
    expect(mocks.rm).toHaveBeenCalledWith("C:\\temp\\edudecks-report-pdf-123", {
      recursive: true,
      force: true,
    });
  });

  it("propagates spawn errors and still cleans up temp files", async () => {
    queueSpawnError(new Error("spawn failed"));

    await expect(renderReportPdf("<html />")).rejects.toThrow("spawn failed");
    expect(mocks.rm).toHaveBeenCalledWith("C:\\temp\\edudecks-report-pdf-123", {
      recursive: true,
      force: true,
    });
  });
});
