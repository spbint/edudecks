import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFEmbeddedPage } from "pdf-lib";
import { buildDemoReportViewModel, initialDemoState } from "@/lib/demo/demoState";
import type { DemoReportViewModel, DemoState } from "@/lib/demo/demoTypes";

const demoFooter =
  "Fictional demonstration learning record. No real child or family data is used. Families should check their local home education requirements before submitting records.";
const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 42;
const contentWidth = pageWidth - margin * 2;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawTextBlock(page: PDFPage, text: string, font: PDFFont, x: number, y: number, maxWidth: number, size: number, color = rgb(71 / 255, 85 / 255, 105 / 255), lineHeight = size * 1.45) {
  const lines = wrapText(text, font, size, maxWidth);
  lines.forEach((line, index) => {
    page.drawText(line, { x, y: y - index * lineHeight, size, font, color });
  });
  return y - lines.length * lineHeight;
}

function drawHeading(page: PDFPage, text: string, font: PDFFont, y: number, size = 18) {
  page.drawText(text, { x: margin, y, size, font, color: rgb(15 / 255, 23 / 255, 42 / 255) });
  return y - size * 1.45;
}

function drawFooter(page: PDFPage, regular: PDFFont, pageNumber: number) {
  page.drawLine({ start: { x: margin, y: 38 }, end: { x: pageWidth - margin, y: 38 }, thickness: 0.7, color: rgb(203 / 255, 213 / 255, 225 / 255) });
  drawTextBlock(page, demoFooter, regular, margin, 26, contentWidth - 48, 7.2, rgb(100 / 255, 116 / 255, 139 / 255), 9);
  page.drawText(`Page ${pageNumber}`, { x: pageWidth - margin - 38, y: 26, size: 7.2, font: regular, color: rgb(100 / 255, 116 / 255, 139 / 255) });
}

function drawLabelValue(page: PDFPage, label: string, value: string, regular: PDFFont, bold: PDFFont, x: number, y: number, width: number) {
  page.drawText(label.toUpperCase(), { x, y, size: 7.5, font: bold, color: rgb(37 / 255, 99 / 255, 235 / 255) });
  return drawTextBlock(page, value, bold, x, y - 13, width, 11, rgb(15 / 255, 23 / 255, 42 / 255), 14) - 8;
}

async function embedWorksheetPage(document: PDFDocument, url?: string): Promise<PDFEmbeddedPage | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const source = await PDFDocument.load(await response.arrayBuffer());
    return await document.embedPage(source.getPage(0));
  } catch {
    return null;
  }
}

function drawWorksheetPreview(page: PDFPage, embedded: PDFEmbeddedPage | null, regular: PDFFont, y: number) {
  const boxHeight = 288;
  const boxY = y - boxHeight;
  page.drawRectangle({ x: margin, y: boxY, width: contentWidth, height: boxHeight, color: rgb(248 / 255, 250 / 255, 252 / 255), borderColor: rgb(203 / 255, 213 / 255, 225 / 255), borderWidth: 1 });
  if (!embedded) {
    page.drawText("Worksheet preview unavailable", { x: margin + 18, y: boxY + boxHeight / 2, size: 11, font: regular, color: rgb(71 / 255, 85 / 255, 105 / 255) });
    return boxY - 18;
  }

  const scale = Math.min((contentWidth - 22) / embedded.width, (boxHeight - 22) / embedded.height);
  const width = embedded.width * scale;
  const height = embedded.height * scale;
  page.drawPage(embedded, { x: margin + (contentWidth - width) / 2, y: boxY + (boxHeight - height) / 2, width, height });
  return boxY - 18;
}

function drawSummaryPage(document: PDFDocument, model: DemoReportViewModel, regular: PDFFont, bold: PDFFont) {
  const page = document.addPage([pageWidth, pageHeight]);
  page.drawRectangle({ x: margin, y: pageHeight - 82, width: 6, height: 52, color: rgb(37 / 255, 99 / 255, 235 / 255) });
  page.drawText("MYLEARNA LEARNING REPORT", { x: margin + 18, y: pageHeight - 48, size: 9, font: bold, color: rgb(37 / 255, 99 / 255, 235 / 255) });
  page.drawText("Emma Carter Learning Record", { x: margin + 18, y: pageHeight - 72, size: 22, font: bold, color: rgb(15 / 255, 23 / 255, 42 / 255) });

  let y = pageHeight - 132;
  y = drawLabelValue(page, "Reporting period", model.reportingPeriod, regular, bold, margin, y, 190);
  y = drawLabelValue(page, "Prepared", model.preparedOnLabel, regular, bold, margin, y, 190);
  y = drawLabelValue(page, "Learning area", "Mathematics", regular, bold, margin, y, 190);

  page.drawRectangle({ x: 304, y: pageHeight - 282, width: 249, height: 152, color: rgb(248 / 255, 251 / 255, 255 / 255), borderColor: rgb(191 / 255, 219 / 255, 254 / 255), borderWidth: 1 });
  page.drawText("LEARNING SNAPSHOT", { x: 320, y: pageHeight - 154, size: 8, font: bold, color: rgb(37 / 255, 99 / 255, 235 / 255) });
  page.drawText("Ready", { x: 320, y: pageHeight - 184, size: 20, font: bold, color: rgb(22 / 255, 101 / 255, 52 / 255) });
  drawTextBlock(page, "1 learning area represented", regular, 320, pageHeight - 207, 205, 9);
  drawTextBlock(page, `${model.evidenceEntries.length} learning records`, regular, 320, pageHeight - 226, 205, 9);
  drawTextBlock(page, "Latest learning: 24 Jul 2026", regular, 320, pageHeight - 245, 205, 9);

  y = pageHeight - 330;
  y = drawHeading(page, "Learning Snapshot", bold, y, 16);
  y = drawTextBlock(page, "Here is Emma's learning story and the work behind it.", bold, margin, y, contentWidth, 14, rgb(15 / 255, 23 / 255, 42 / 255), 19) - 10;
  drawTextBlock(page, model.summary, regular, margin, y, contentWidth, 10.5, undefined, 15);
  drawFooter(page, regular, 1);
}

function drawPathwayPage(document: PDFDocument, model: DemoReportViewModel, regular: PDFFont, bold: PDFFont) {
  const page = document.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 70;
  page.drawText("MATHEMATICS / PATHWAY SUMMARY", { x: margin, y, size: 9, font: bold, color: rgb(37 / 255, 99 / 255, 235 / 255) });
  y -= 28;
  y = drawHeading(page, "Mathematics", bold, y, 22);
  y = drawTextBlock(page, "8 learning records | Latest: 24 July 2026", regular, margin, y, contentWidth, 10.5) - 14;
  y = drawTextBlock(page, model.pathwaySummary, regular, margin, y, contentWidth, 10.5, undefined, 15) - 26;
  y = drawHeading(page, model.pathway, bold, y, 16);

  const stages = [
    ["Developing", "Simple scaling and related quantities"],
    ["Consolidating", "Rates, ratios, tables and unit comparisons"],
    ["Increasingly secure", "Real-world proportional reasoning, judgement and mathematical communication"],
  ];
  stages.forEach(([label, text], index) => {
    const height = index === 2 ? 92 : 76;
    page.drawRectangle({ x: margin, y: y - height, width: contentWidth, height, color: index === 2 ? rgb(240 / 255, 253 / 255, 244 / 255) : rgb(248 / 255, 250 / 255, 252 / 255), borderColor: index === 2 ? rgb(187 / 255, 247 / 255, 208 / 255) : rgb(226 / 255, 232 / 255, 240 / 255), borderWidth: 1 });
    page.drawText(label, { x: margin + 16, y: y - 25, size: 11, font: bold, color: index === 2 ? rgb(22 / 255, 101 / 255, 52 / 255) : rgb(15 / 255, 23 / 255, 42 / 255) });
    drawTextBlock(page, text, regular, margin + 16, y - 46, contentWidth - 32, 10, undefined, 14);
    y -= height + 14;
  });
  drawFooter(page, regular, 2);
}

async function drawEvidencePage(document: PDFDocument, model: DemoReportViewModel, index: number, regular: PDFFont, bold: PDFFont) {
  const entry = model.evidenceEntries[index];
  const page = document.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 64;
  page.drawText(`MATHEMATICS · STEP ${entry.step}`, { x: margin, y, size: 9, font: bold, color: rgb(37 / 255, 99 / 255, 235 / 255) });
  y -= 25;
  y = drawHeading(page, entry.title, bold, y, 17);
  y = drawTextBlock(page, `${entry.observedOn} | ${entry.learningArea} | Progress: ${entry.progress}`, regular, margin, y, contentWidth, 10, undefined, 14) - 12;
  y = drawTextBlock(page, `Connected pathway step: Step ${entry.step}`, bold, margin, y, contentWidth, 9.5, rgb(71 / 255, 85 / 255, 105 / 255), 13) - 10;
  y = drawWorksheetPreview(page, await embedWorksheetPage(document, entry.worksheetUrl), regular, y);

  const sections: Array<[string, string]> = [
    ["What happened", entry.whatHappened],
    ["Parent observation", entry.parentObservation],
    ["Learner reflection", entry.learnerReflection],
  ];
  for (const [heading, text] of sections) {
    y = drawTextBlock(page, heading, bold, margin, y, contentWidth, 10.5, rgb(15 / 255, 23 / 255, 42 / 255), 15) - 3;
    y = drawTextBlock(page, text, regular, margin, y, contentWidth, 9.5, undefined, 13) - 10;
  }
  drawFooter(page, regular, index + 3);
}

export async function buildCarterFamilyDemoPdfBytes(state: DemoState = initialDemoState) {
  const model = buildDemoReportViewModel(state);
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);

  drawSummaryPage(document, model, regular, bold);
  drawPathwayPage(document, model, regular, bold);
  for (let index = 0; index < model.evidenceEntries.length; index += 1) {
    await drawEvidencePage(document, model, index, regular, bold);
  }
  return document.save();
}

export async function downloadCarterFamilyDemoPdf(_outputTitle = "Emma's Learning Report", state: DemoState = initialDemoState) {
  void _outputTitle;
  const bytes = await buildCarterFamilyDemoPdfBytes(state);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mylearna-emma-learning-report-sample.pdf";
  anchor.click();
  URL.revokeObjectURL(url);
}

export const demoPdfLabels = {
  beforeDownload: "This sample report uses fictional Carter Family data only. It is a demonstration learning record, not an official homeschool compliance document.",
  header: "MyLearna Learning Report - Emma Carter",
  subheader: "Fictional demonstration data | 8 learning records | Mathematics",
  footer: demoFooter,
};
