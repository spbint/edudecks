import JSZip from "jszip";
import { formatEvidenceReference } from "@/lib/reportPresentation";
import {
  buildReportPdfFilename,
  buildReportPdfHtml,
  createReportPdfClient,
  loadCanonicalReportPdfData,
  renderReportPdf,
} from "@/lib/reportPdf";

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function shortDate(value?: string | null) {
  const s = safe(value);
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toLocaleDateString();
  } catch {
    return s.slice(0, 10);
  }
}

function sanitizePathPart(value: string) {
  return (
    safe(value)
      .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "file"
  );
}

function buildSubmissionPackFilename(title: string) {
  return `${sanitizePathPart(title || "learning-report")}-submission-pack.zip`;
}

function buildManifestText(input: {
  draftId: string;
  reportPdfName: string;
  learnerName: string;
  market: string;
  items: Array<{
    reference: string;
    title: string;
    occurredOn: string | null;
    learningArea: string;
    linkedOutcomes: string[];
    attachmentCount: number;
    bundledAttachmentCount: number;
    referencedOnlyAttachmentCount: number;
  }>;
}) {
  const lines = [
    "Evidence Manifest",
    `Draft: ${input.draftId}`,
    `Learner: ${input.learnerName}`,
    `Market: ${input.market}`,
    `Report PDF: ${input.reportPdfName}`,
    "",
  ];

  for (const item of input.items) {
    lines.push(`${item.reference}: ${item.title}`);
    lines.push(`Date: ${shortDate(item.occurredOn)}`);
    lines.push(`Learning area: ${item.learningArea}`);
    lines.push(
      `Linked outcomes: ${
        item.linkedOutcomes.length ? item.linkedOutcomes.join(" | ") : "None listed"
      }`,
    );
    lines.push(`Attachments referenced: ${item.attachmentCount}`);
    lines.push(`Attachments bundled: ${item.bundledAttachmentCount}`);
    if (item.referencedOnlyAttachmentCount > 0) {
      lines.push(
        `Attachments referenced only: ${item.referencedOnlyAttachmentCount}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function buildSubmissionPack(input: {
  draftId: string;
  accessToken: string;
}) {
  const reportData = await loadCanonicalReportPdfData(input);
  const client = createReportPdfClient(input.accessToken);
  const html = buildReportPdfHtml(reportData);
  const pdfBytes = await renderReportPdf(html);
  const reportPdfName = buildReportPdfFilename(reportData.draft);
  const zip = new JSZip();

  zip.file(reportPdfName, pdfBytes);

  const manifestItems: Array<{
    reference: string;
    evidenceId: string;
    title: string;
    occurredOn: string | null;
    learningArea: string;
    linkedOutcomes: string[];
    attachmentCount: number;
    bundledAttachmentCount: number;
    referencedOnlyAttachmentCount: number;
    attachments: Array<{
      fileName: string;
      source: string;
      includedInPack: boolean;
      packPath: string | null;
      mimeType: string | null;
      bucketName: string | null;
      objectPath: string | null;
    }>;
  }> = [];

  for (const [index, item] of reportData.supportingEvidence.entries()) {
    const reference = formatEvidenceReference(index);
    const attachmentEntries: Array<{
      fileName: string;
      source: string;
      includedInPack: boolean;
      packPath: string | null;
      mimeType: string | null;
      bucketName: string | null;
      objectPath: string | null;
    }> = [];

    let bundledAttachmentCount = 0;

    for (const [attachmentIndex, attachment] of item.attachments.entries()) {
      let includedInPack = false;
      let packPath: string | null = null;

      if (
        attachment.source === "evidence_files" &&
        attachment.bucketName &&
        attachment.objectPath
      ) {
        const downloadResponse = await client.storage
          .from(attachment.bucketName)
          .download(attachment.objectPath);

        if (!downloadResponse.error && downloadResponse.data) {
          const attachmentBytes = Buffer.from(
            await downloadResponse.data.arrayBuffer(),
          );
          const fileName = sanitizePathPart(attachment.fileName || "attachment");
          packPath = `attachments/${sanitizePathPart(reference)}-${String(
            attachmentIndex + 1,
          ).padStart(2, "0")}-${fileName}`;
          zip.file(packPath, attachmentBytes);
          includedInPack = true;
          bundledAttachmentCount += 1;
        }
      }

      attachmentEntries.push({
        fileName: attachment.fileName,
        source: attachment.source,
        includedInPack,
        packPath,
        mimeType: attachment.mimeType || null,
        bucketName: attachment.bucketName || null,
        objectPath: attachment.objectPath || null,
      });
    }

    manifestItems.push({
      reference,
      evidenceId: item.id,
      title: item.title,
      occurredOn: item.occurredOn,
      learningArea: item.learningArea,
      linkedOutcomes: item.linkedOutcomes.map((outcome) =>
        outcome.outcomeCode
          ? `${outcome.outcomeCode} ${outcome.outcomeLabel}`
          : outcome.outcomeLabel,
      ),
      attachmentCount: item.attachmentCount,
      bundledAttachmentCount,
      referencedOnlyAttachmentCount: Math.max(
        item.attachmentCount - bundledAttachmentCount,
        0,
      ),
      attachments: attachmentEntries,
    });
  }

  const manifest = {
    draftId: reportData.draft.id,
    reportTitle: safe(reportData.draft.title) || "Learning Report",
    learnerName: safe(reportData.draft.child_name) || "Learner",
    preferredMarket: reportData.preferredMarket,
    generatedAt: new Date().toISOString(),
    files: {
      reportPdf: reportPdfName,
    },
    evidence: manifestItems,
  };

  zip.file("evidence-manifest.json", JSON.stringify(manifest, null, 2));
  zip.file(
    "evidence-manifest.txt",
    buildManifestText({
      draftId: manifest.draftId,
      reportPdfName,
      learnerName: manifest.learnerName,
      market: manifest.preferredMarket,
      items: manifestItems,
    }),
  );

  const zipBytes = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    bytes: zipBytes,
    filename: buildSubmissionPackFilename(
      safe(reportData.draft.title) || "learning-report",
    ),
    manifest,
  };
}
