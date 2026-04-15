import JSZip from "jszip";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildReportPdfFilename: vi.fn(),
  buildReportPdfHtml: vi.fn(),
  createReportPdfClient: vi.fn(),
  loadCanonicalReportPdfData: vi.fn(),
  renderReportPdf: vi.fn(),
}));

vi.mock("@/lib/reportPdf", () => ({
  buildReportPdfFilename: mocks.buildReportPdfFilename,
  buildReportPdfHtml: mocks.buildReportPdfHtml,
  createReportPdfClient: mocks.createReportPdfClient,
  loadCanonicalReportPdfData: mocks.loadCanonicalReportPdfData,
  renderReportPdf: mocks.renderReportPdf,
}));

import { buildSubmissionPack } from "@/lib/reportPack";

function makeReportData(overrides: Record<string, unknown> = {}) {
  return {
    draft: {
      id: "draft-123",
      title: "Term 1 Learning Report",
      child_name: "Avery",
    },
    preferredMarket: "au",
    supportingEvidence: [
      {
        id: "ev-1",
        title: "Science journal entry",
        occurredOn: "2026-03-14",
        learningArea: "Science",
        attachmentCount: 1,
        linkedOutcomes: [
          {
            outcomeCode: "SC1",
            outcomeLabel: "Observes and records changes",
          },
        ],
        attachments: [
          {
            fileName: "journal scan.pdf",
            source: "evidence_files",
            mimeType: "application/pdf",
            bucketName: "evidence",
            objectPath: "family/ev-1/journal.pdf",
          },
        ],
      },
    ],
    ...overrides,
  } as any;
}

function makeClient(downloadResult?: { error: Error | null; data: { arrayBuffer: () => Promise<ArrayBuffer> } | null }) {
  return {
    storage: {
      from: vi.fn(() => ({
        download: vi.fn(async () => downloadResult ?? {
          error: null,
          data: {
            arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer,
          },
        }),
      })),
    },
  };
}

async function readZipEntries(bytes: Buffer) {
  const zip = await JSZip.loadAsync(bytes);
  const entries = Object.keys(zip.files).sort();
  return { zip, entries };
}

describe("buildSubmissionPack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadCanonicalReportPdfData.mockResolvedValue(makeReportData());
    mocks.createReportPdfClient.mockReturnValue(makeClient());
    mocks.buildReportPdfHtml.mockReturnValue("<html>pdf</html>");
    mocks.renderReportPdf.mockResolvedValue(Buffer.from("pdf-bytes"));
    mocks.buildReportPdfFilename.mockReturnValue("avery-report.pdf");
  });

  it("builds a submission pack with the report pdf, manifests, and bundled attachments", async () => {
    const result = await buildSubmissionPack({
      draftId: "draft-123",
      accessToken: "token-123",
    });

    expect(mocks.loadCanonicalReportPdfData).toHaveBeenCalledWith({
      draftId: "draft-123",
      accessToken: "token-123",
    });
    expect(mocks.createReportPdfClient).toHaveBeenCalledWith("token-123");
    expect(mocks.buildReportPdfHtml).toHaveBeenCalledWith(makeReportData());
    expect(mocks.renderReportPdf).toHaveBeenCalledWith("<html>pdf</html>");

    const { zip, entries } = await readZipEntries(result.bytes);
    expect(result.filename).toBe("Term-1-Learning-Report-submission-pack.zip");
    expect(entries).toEqual([
      "attachments/",
      "attachments/Evidence-1-01-journal-scan.pdf",
      "avery-report.pdf",
      "evidence-manifest.json",
      "evidence-manifest.txt",
    ]);

    const manifest = JSON.parse(
      await zip.file("evidence-manifest.json")!.async("string"),
    );
    expect(manifest).toMatchObject({
      draftId: "draft-123",
      reportTitle: "Term 1 Learning Report",
      learnerName: "Avery",
      preferredMarket: "au",
      files: {
        reportPdf: "avery-report.pdf",
      },
    });
    expect(manifest.evidence).toEqual([
      expect.objectContaining({
        reference: "Evidence 1",
        evidenceId: "ev-1",
        title: "Science journal entry",
        attachmentCount: 1,
        bundledAttachmentCount: 1,
        referencedOnlyAttachmentCount: 0,
        linkedOutcomes: ["SC1 Observes and records changes"],
        attachments: [
          expect.objectContaining({
            fileName: "journal scan.pdf",
            includedInPack: true,
            packPath: "attachments/Evidence-1-01-journal-scan.pdf",
          }),
        ],
      }),
    ]);

    const manifestText = await zip.file("evidence-manifest.txt")!.async("string");
    expect(manifestText).toContain("Evidence Manifest");
    expect(manifestText).toContain("Report PDF: avery-report.pdf");
    expect(manifestText).toContain("Evidence 1: Science journal entry");
    expect(manifestText).toContain("Attachments bundled: 1");
  });

  it("keeps referenced attachments out of the zip when they cannot be downloaded", async () => {
    mocks.createReportPdfClient.mockReturnValue(
      makeClient({
        error: new Error("download failed"),
        data: null,
      }),
    );

    const result = await buildSubmissionPack({
      draftId: "draft-123",
      accessToken: "token-123",
    });

    const { zip, entries } = await readZipEntries(result.bytes);
    expect(entries).toEqual([
      "avery-report.pdf",
      "evidence-manifest.json",
      "evidence-manifest.txt",
    ]);

    const manifest = JSON.parse(
      await zip.file("evidence-manifest.json")!.async("string"),
    );
    expect(manifest.evidence[0]).toMatchObject({
      attachmentCount: 1,
      bundledAttachmentCount: 0,
      referencedOnlyAttachmentCount: 1,
      attachments: [
        expect.objectContaining({
          includedInPack: false,
          packPath: null,
        }),
      ],
    });

    const manifestText = await zip.file("evidence-manifest.txt")!.async("string");
    expect(manifestText).toContain("Attachments bundled: 0");
    expect(manifestText).toContain("Attachments referenced only: 1");
  });

  it("omits attachment bundling cleanly when supporting evidence has no usable file attachments", async () => {
    mocks.loadCanonicalReportPdfData.mockResolvedValue(
      makeReportData({
        supportingEvidence: [
          {
            id: "ev-1",
            title: "Maths observation",
            occurredOn: null,
            learningArea: "Mathematics",
            attachmentCount: 0,
            linkedOutcomes: [],
            attachments: [],
          },
        ],
      }),
    );

    const result = await buildSubmissionPack({
      draftId: "draft-123",
      accessToken: "token-123",
    });

    const { zip, entries } = await readZipEntries(result.bytes);
    expect(entries).toEqual([
      "avery-report.pdf",
      "evidence-manifest.json",
      "evidence-manifest.txt",
    ]);

    const manifest = JSON.parse(
      await zip.file("evidence-manifest.json")!.async("string"),
    );
    expect(manifest.evidence[0]).toMatchObject({
      title: "Maths observation",
      attachmentCount: 0,
      bundledAttachmentCount: 0,
      referencedOnlyAttachmentCount: 0,
      linkedOutcomes: [],
      attachments: [],
    });
  });

  it("falls back to calm generic naming when the report title and learner name are blank", async () => {
    mocks.loadCanonicalReportPdfData.mockResolvedValue(
      makeReportData({
        draft: {
          id: "draft-123",
          title: "   ",
          child_name: "   ",
        },
      }),
    );
    mocks.buildReportPdfFilename.mockReturnValue("learning-report.pdf");

    const result = await buildSubmissionPack({
      draftId: "draft-123",
      accessToken: "token-123",
    });

    expect(result.filename).toBe("learning-report-submission-pack.zip");
    expect(result.manifest).toMatchObject({
      reportTitle: "Learning Report",
      learnerName: "Learner",
      files: {
        reportPdf: "learning-report.pdf",
      },
    });
  });

  it("surfaces downstream pdf generation failures without swallowing them", async () => {
    mocks.renderReportPdf.mockRejectedValueOnce(new Error("Chromium failed to render the report PDF."));

    await expect(
      buildSubmissionPack({
        draftId: "draft-123",
        accessToken: "token-123",
      }),
    ).rejects.toThrow("Chromium failed to render the report PDF.");
  });
});
