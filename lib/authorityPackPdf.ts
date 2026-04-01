import jsPDF from "jspdf";
import type { ReportDraftRow } from "@/lib/reportDrafts";
import type {
  AuthorityPackConfig,
  AuthorityPackSectionKey,
} from "@/lib/authorityPackConfig";
import type { AuthorityEvidenceRow } from "@/lib/authorityPackData";

type BuildAuthorityPackPdfInput = {
  draft: ReportDraftRow;
  config: AuthorityPackConfig;
  evidenceRows: AuthorityEvidenceRow[];
};

const BRAND = {
  navy: [15, 23, 42] as [number, number, number],
  slate: [51, 65, 85] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  soft: [248, 250, 252] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  blueSoft: [239, 246, 255] as [number, number, number],
  blueBorder: [191, 219, 254] as [number, number, number],
  green: [22, 101, 52] as [number, number, number],
  greenSoft: [240, 253, 244] as [number, number, number],
  greenBorder: [187, 247, 208] as [number, number, number],
  amber: [154, 52, 18] as [number, number, number],
  amberSoft: [255, 247, 237] as [number, number, number],
  amberBorder: [254, 215, 170] as [number, number, number],
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function shortDate(value?: string | null) {
  const s = safe(value);
  if (!s) return "-";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toLocaleDateString();
  } catch {
    return s.slice(0, 10);
  }
}

function marketLabel(market: "au" | "uk" | "us") {
  if (market === "uk") return "United Kingdom";
  if (market === "us") return "United States";
  return "Australia";
}

function modeLabel(mode: string) {
  if (mode === "authority-ready") return "Authority ready";
  if (mode === "progress-review") return "Progress review";
  return "Family summary";
}

function periodLabel(period: string) {
  if (period === "semester") return "Semester";
  if (period === "year") return "Year";
  if (period === "all") return "All time";
  return "Term";
}

function sectionLabel(key: AuthorityPackSectionKey) {
  switch (key) {
    case "cover":
      return "Cover page";
    case "overview":
      return "Overview";
    case "coverage":
      return "Coverage snapshot";
    case "evidence":
      return "Selected evidence";
    case "appendix":
      return "Appendix";
    case "action-plan":
      return "Action plan";
    case "weekly-plan":
      return "Weekly plan";
    case "readiness-notes":
      return "Readiness notes";
    case "parent-note":
      return "Parent note";
    default:
      return key;
  }
}

function selectedCoreCount(draft: ReportDraftRow) {
  return draft.selected_evidence_ids.filter(
    (id) => draft.selection_meta?.[id]?.role !== "appendix"
  ).length;
}

function selectedAppendixCount(draft: ReportDraftRow) {
  return draft.selected_evidence_ids.filter(
    (id) => draft.selection_meta?.[id]?.role === "appendix"
  ).length;
}

function selectedRequiredCount(draft: ReportDraftRow) {
  return draft.selected_evidence_ids.filter((id) =>
    Boolean(draft.selection_meta?.[id]?.required)
  ).length;
}

function buildReadinessScore(
  draft: ReportDraftRow,
  config: AuthorityPackConfig,
  evidenceRows: AuthorityEvidenceRow[]
) {
  let score = 20;

  if (draft.report_mode === "authority-ready") score += 18;
  if (evidenceRows.length >= 4) score += 18;
  else if (evidenceRows.length >= 2) score += 12;
  else if (evidenceRows.length >= 1) score += 6;

  if (selectedCoreCount(draft) >= 2) score += 10;
  if (selectedAppendixCount(draft) >= 1) score += 7;
  if (selectedRequiredCount(draft) >= 1) score += 7;
  if (draft.selected_areas.length >= 4) score += 8;
  if (draft.include_readiness_notes) score += 6;
  if (config.includeSections?.evidence) score += 4;
  if (config.includeSections?.coverage) score += 4;
  if (config.includeSections?.overview) score += 4;
  if (config.includeSections?.["readiness-notes"]) score += 4;

  return Math.min(score, 100);
}

export async function buildAuthorityPackPdf(
  input: BuildAuthorityPackPdfInput
): Promise<Blob> {
  const { draft, config, evidenceRows } = input;
  const includedSections = Object.keys(config.includeSections || {}).filter(
    (k) => config.includeSections[k as AuthorityPackSectionKey]
  ) as AuthorityPackSectionKey[];
  const readiness = buildReadinessScore(draft, config, evidenceRows);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 54;
  const topMargin = 52;
  const bottomMargin = 54;
  const usableWidth = pageWidth - marginX * 2;
  const footerY = pageHeight - 26;
  const bottomLimit = pageHeight - bottomMargin - 24;

  let y = topMargin;

  function addFooter() {
    const pageCount = doc.getNumberOfPages();
    doc.setPage(pageCount);

    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(1);
    doc.line(marginX, pageHeight - 40, pageWidth - marginX, pageHeight - 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    doc.text("Generated by EduDecks", marginX, footerY);
    doc.text("Authority-ready homeschool reporting", pageWidth / 2, footerY, {
      align: "center",
    });
    doc.text(`Page ${pageCount}`, pageWidth - marginX, footerY, {
      align: "right",
    });
  }

  function newPage() {
    addFooter();
    doc.addPage();
    y = topMargin;
  }

  function ensureSpace(required = 28) {
    if (y + required > bottomLimit) {
      newPage();
    }
  }

  function addGap(size = 12) {
    y += size;
  }

  function addAccentBar() {
    doc.setFillColor(...BRAND.blue);
    doc.rect(marginX, y, usableWidth, 8, "F");
    y += 20;
  }

  function addOverline(text: string) {
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.muted);
    doc.text(text.toUpperCase(), marginX, y);
    y += 16;
  }

  function addH1(text: string) {
    ensureSpace(42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...BRAND.navy);
    const lines = doc.splitTextToSize(text, usableWidth);
    doc.text(lines, marginX, y);
    y += lines.length * 30;
  }

  function addH2(text: string) {
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(...BRAND.navy);
    const lines = doc.splitTextToSize(text, usableWidth);
    doc.text(lines, marginX, y);
    y += lines.length * 19;
  }

  function addBody(text: string, width = usableWidth) {
    ensureSpace(20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.slate);
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, marginX, y);
    y += lines.length * 16;
  }

  function addBodyAt(text: string, x: number, yy: number, width: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.slate);
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, x, yy);
    return lines.length * 16;
  }

  function addDivider() {
    ensureSpace(18);
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(1);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 18;
  }

  function roundedPanel(
    x: number,
    yy: number,
    w: number,
    h: number,
    fill: [number, number, number],
    border: [number, number, number]
  ) {
    doc.setFillColor(...fill);
    doc.setDrawColor(...border);
    doc.setLineWidth(1);
    doc.roundedRect(x, yy, w, h, 10, 10, "FD");
  }

  function addInfoBox(lines: string[], tone: "blue" | "green" | "amber" = "blue") {
    const fill =
      tone === "green"
        ? BRAND.greenSoft
        : tone === "amber"
        ? BRAND.amberSoft
        : BRAND.blueSoft;
    const border =
      tone === "green"
        ? BRAND.greenBorder
        : tone === "amber"
        ? BRAND.amberBorder
        : BRAND.blueBorder;

    const rendered = lines.flatMap((text) =>
      doc.splitTextToSize(text, usableWidth - 32)
    );
    const estimatedHeight = rendered.length * 16 + 22;

    ensureSpace(estimatedHeight + 6);
    roundedPanel(marginX, y, usableWidth, estimatedHeight, fill, border);

    let innerY = y + 18;
    lines.forEach((text) => {
      const split = doc.splitTextToSize(text, usableWidth - 32);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...BRAND.slate);
      doc.text(split, marginX + 16, innerY);
      innerY += split.length * 16;
    });

    y += estimatedHeight + 12;
  }

  function addMetaGrid(items: Array<[string, string]>) {
    const leftX = marginX;
    const rightX = marginX + usableWidth * 0.34;
    const rowHeight = 31;

    ensureSpace(items.length * rowHeight + 8);

    items.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.muted);
      doc.text(label.toUpperCase(), leftX, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...BRAND.navy);
      doc.text(value, rightX, y);

      y += rowHeight;
    });
  }

  function addEvidenceCard(row: AuthorityEvidenceRow) {
    const title = safe(row.title) || "Evidence item";
    const metaParts = [
      safe((row as any).learningArea || (row as any).learning_area),
      safe((row as any).occurredOn || (row as any).occurred_on),
      row.role === "appendix" ? "Appendix" : "Core",
      row.required ? "Required" : "",
    ].filter(Boolean);

    const summaryText = safe(row.summary) || "No summary text available.";
    const titleLines = doc.splitTextToSize(title, usableWidth - 32);
    const metaLines = doc.splitTextToSize(metaParts.join(" • "), usableWidth - 32);
    const summaryLines = doc.splitTextToSize(summaryText, usableWidth - 32);
    const h =
      titleLines.length * 18 +
      metaLines.length * 14 +
      summaryLines.length * 16 +
      34;

    ensureSpace(h + 8);
    roundedPanel(marginX, y, usableWidth, h, [255, 255, 255], BRAND.border);

    let innerY = y + 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BRAND.navy);
    doc.text(titleLines, marginX + 16, innerY);
    innerY += titleLines.length * 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.muted);
    doc.text(metaLines, marginX + 16, innerY);
    innerY += metaLines.length * 14 + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.slate);
    doc.text(summaryLines, marginX + 16, innerY);

    y += h + 10;
  }

  function addBullet(text: string) {
    ensureSpace(18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.slate);
    const lines = doc.splitTextToSize(text, usableWidth - 18);
    doc.text("•", marginX, y);
    doc.text(lines, marginX + 14, y);
    y += lines.length * 16;
  }

  // Cover page
  addAccentBar();
  addOverline("EduDecks Authority Pack");
  addH1(config.title);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.slate);
  doc.text(`${draft.child_name} — ${marketLabel(config.jurisdiction)}`, marginX, y);
  y += 28;

  addInfoBox(
    [
      "Prepared from structured learning evidence.",
      "This authority pack presents a branded, evidence-led summary of current progress, selected supporting records, and submission-ready sections shaped inside EduDecks.",
    ],
    "blue"
  );

  addGap(8);
  addMetaGrid([
    ["Child", draft.child_name],
    ["Mode", modeLabel(draft.report_mode)],
    ["Period", periodLabel(draft.period_mode)],
    ["Jurisdiction", marketLabel(config.jurisdiction)],
    ["Prepared", shortDate(new Date().toISOString())],
    ["Readiness", `${readiness}%`],
  ]);

  newPage();

  // Main content
  if (config.includeSections.overview) {
    addH2("Overview");
    addInfoBox(
      [
        "This authority pack has been prepared from a saved EduDecks report object.",
        "It presents a calmer, evidence-led snapshot of current learning progress and selected supporting records.",
      ],
      "blue"
    );
  }

  if (config.includeSections.coverage) {
    addH2("Coverage Snapshot");
    addBody(draft.selected_areas.join(" • "));
    addBody(
      `Selected areas: ${draft.selected_areas.length}. Core evidence: ${selectedCoreCount(
        draft
      )}. Appendix evidence: ${selectedAppendixCount(
        draft
      )}. Required-marked evidence: ${selectedRequiredCount(draft)}.`
    );
    addDivider();
  }

  if (config.includeSections.evidence) {
    addH2("Selected Evidence");
    evidenceRows.forEach((row) => addEvidenceCard(row));
    addDivider();
  }

  if (config.includeSections.appendix) {
    addH2("Appendix Summary");
    addBody(`Appendix evidence available: ${selectedAppendixCount(draft)}.`);
    addDivider();
  }

  if (config.includeSections["action-plan"]) {
    addH2("Action Plan");
    addBullet("Continue collecting representative evidence across the selected areas.");
    addBullet("Retain strong core anchors and keep the record balanced over time.");
    addBullet("Use this pack as a checkpoint rather than the full learning record.");
    addDivider();
  }

  if (config.includeSections["weekly-plan"]) {
    addH2("Weekly Plan");
    addBullet("Capture one meaningful learning moment early in the week.");
    addBullet("Add one broader example mid-week to show balance.");
    addBullet("Review and retain one strong evidence item at week’s end.");
    addDivider();
  }

  if (config.includeSections["readiness-notes"]) {
    addH2("Readiness Notes");
    addInfoBox(
      [
        `Submission readiness: ${readiness}%`,
        `This pack includes ${evidenceRows.length} included evidence item${
          evidenceRows.length === 1 ? "" : "s"
        }, with ${selectedCoreCount(draft)} core anchor${
          selectedCoreCount(draft) === 1 ? "" : "s"
        } and ${selectedRequiredCount(draft)} required-marked item${
          selectedRequiredCount(draft) === 1 ? "" : "s"
        }.`,
      ],
      readiness >= 80 ? "green" : readiness >= 60 ? "blue" : "amber"
    );
    addDivider();
  }

  if (config.includeSections["parent-note"] && draft.notes?.trim()) {
    addH2("Parent Note");
    addInfoBox([draft.notes], "blue");
    addDivider();
  }

  if (config.emphasisNote.trim()) {
    addH2("Authority Emphasis");
    addInfoBox([config.emphasisNote], "amber");
    addDivider();
  }

  if (config.reviewerNote.trim()) {
    addH2("Reviewer Note");
    addInfoBox([config.reviewerNote], "blue");
    addDivider();
  }

  addH2("Included Sections");
  includedSections.forEach((key) => addBullet(sectionLabel(key)));

  addFooter();
  return doc.output("blob");
}