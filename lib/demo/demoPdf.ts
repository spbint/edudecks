import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type PDFEmbeddedPage } from "pdf-lib";
import { buildDemoReportViewModel, initialDemoState } from "@/lib/demo/demoState";
import type { DemoReportViewModel, DemoState } from "@/lib/demo/demoTypes";
import {
  drawDashboardHeroCard,
  drawDashboardMetricGrid,
  type DashboardPdfComposer,
  type DashboardPdfMetricTile,
  type DashboardPdfPalette,
} from "@/lib/clean/outputs/dashboardPdfPrimitives";

const demoFooter =
  "Fictional demonstration learning record. No real child or family data is used. Families should check their local home education requirements before submitting records.";
const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 42;
const contentWidth = pageWidth - margin * 2;
const logoPath = "/branding/mylearna-logo.png";

const demoPalette: DashboardPdfPalette = {
  title: rgb(0.06, 0.11, 0.2),
  heading: rgb(0.1, 0.19, 0.36),
  body: rgb(0.2, 0.24, 0.31),
  muted: rgb(0.39, 0.45, 0.54),
  line: rgb(0.85, 0.89, 0.94),
  surface: rgb(0.97, 0.985, 1),
  accent: rgb(0.14, 0.38, 0.78),
  accentSurface: rgb(0.95, 0.97, 1),
  accentBorder: rgb(0.78, 0.86, 0.97),
  success: rgb(0.08, 0.48, 0.32),
  successSurface: rgb(0.94, 0.98, 0.96),
  successBorder: rgb(0.74, 0.9, 0.81),
  warning: rgb(0.72, 0.45, 0.08),
  warningSurface: rgb(1, 0.98, 0.93),
  warningBorder: rgb(0.96, 0.86, 0.67),
  lavender: rgb(0.38, 0.28, 0.76),
  lavenderSurface: rgb(0.96, 0.95, 1),
  lavenderBorder: rgb(0.84, 0.81, 0.98),
  neutral: rgb(0.33, 0.4, 0.49),
  neutralSurface: rgb(0.98, 0.99, 1),
  neutralBorder: rgb(0.86, 0.9, 0.94),
};

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
  drawTextBlock(page, demoFooter, regular, margin, 26, contentWidth - 88, 7.2, rgb(100 / 255, 116 / 255, 139 / 255), 9);
  page.drawText(`Page ${pageNumber} of 10`, { x: pageWidth - margin - 58, y: 26, size: 7.2, font: regular, color: rgb(100 / 255, 116 / 255, 139 / 255) });
}

function drawCenteredTextBlock(page: PDFPage, text: string, font: PDFFont, y: number, size: number, maxWidth: number, color: ReturnType<typeof rgb>, lineHeight: number) {
  const lines = wrapText(text, font, size, maxWidth);
  lines.forEach((line, index) => {
    const width = font.widthOfTextAtSize(line, size);
    page.drawText(line, { x: (pageWidth - width) / 2, y: y - index * lineHeight, size, font, color });
  });
  return y - lines.length * lineHeight;
}

function formatLongDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

async function loadDemoLogo(document: PDFDocument): Promise<PDFImage | null> {
  try {
    const response = await fetch(logoPath, { cache: "force-cache" });
    if (!response.ok) return null;
    return await document.embedPng(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function drawDemoLogo(composer: DashboardPdfComposer, logo: PDFImage | null) {
  if (!logo) return composer;
  const targetWidth = 118;
  const scale = targetWidth / logo.width;
  const width = targetWidth;
  const height = logo.height * scale;
  composer.page.drawImage(logo, {
    x: (composer.width - width) / 2,
    y: composer.y - height,
    width,
    height,
  });
  return { ...composer, y: composer.y - height - 16 };
}

async function embedWorksheetPage(document: PDFDocument, url?: string): Promise<PDFEmbeddedPage | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const source = await PDFDocument.load(await response.arrayBuffer());
    const page = source.getPage(0);
    const height = page.getHeight();
    return await document.embedPage(page, {
      left: 0,
      bottom: height * 0.45,
      right: page.getWidth(),
      top: height,
    });
  } catch {
    return null;
  }
}

function drawWorksheetPreview(page: PDFPage, embedded: PDFEmbeddedPage | null, regular: PDFFont, y: number) {
  const boxHeight = 330;
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
  page.drawText("Learning resource used for this activity", { x: margin + 12, y: boxY - 14, size: 7.8, font: regular, color: rgb(100 / 255, 116 / 255, 139 / 255) });
  return boxY - 28;
}

function drawSummaryPage(document: PDFDocument, model: DemoReportViewModel, logo: PDFImage | null, regular: PDFFont, bold: PDFFont) {
  const page = document.addPage([pageWidth, pageHeight]);
  let composer: DashboardPdfComposer = {
    doc: document,
    page,
    width: pageWidth,
    height: pageHeight,
    margin,
    footerSpace: 62,
    y: pageHeight - 42,
    regular,
    bold,
  };
  composer = drawDemoLogo(composer, logo);
  composer.y = drawCenteredTextBlock(page, "MyLearna Learning Report", bold, composer.y, 24, 470, demoPalette.title, 28) - 4;
  composer.y = drawCenteredTextBlock(page, "Emma Carter Learning Record", bold, composer.y, 17, 470, demoPalette.heading, 21) - 2;
  composer.y = drawCenteredTextBlock(page, "1 Mar 2026 to 31 Jul 2026", regular, composer.y, 10.75, 470, demoPalette.heading, 15) - 2;
  composer.y = drawCenteredTextBlock(page, "Prepared 8 Aug 2026", regular, composer.y, 10, 470, demoPalette.muted, 13) - 16;
  composer.y = drawDashboardHeroCard(composer, demoPalette, {
    eyebrow: "Learning snapshot",
    title: "Here is Emma's learning story and the work behind it.",
    subtitle: model.summary,
    supportingBadges: ["Report period: 1 Mar 2026 to 31 Jul 2026", "Status: Ready"],
    statLines: [
      { label: "Reporting period", value: "1 Mar 2026 to 31 Jul 2026", tone: "accent" },
      { label: "Status", value: "Ready", tone: "success" },
    ],
    spacingAfter: 12,
  }).y;

  const metricTiles: DashboardPdfMetricTile[] = [
    { label: "Learning areas", value: "1 represented", helper: "Mathematics", tone: "lavender" },
    { label: "Learning records", value: String(model.evidenceEntries.length), helper: "Included in this report", tone: "accent" },
    { label: "Latest learning", value: "24 Jul 2026", helper: "Most recent included record", tone: "success" },
    { label: "Learning area", value: "Mathematics", helper: "1 area represented", tone: "lavender" },
    { label: "Report status", value: "Ready", helper: "Prepared family learning report", tone: "success" },
  ];
  composer = drawDashboardMetricGrid(composer, demoPalette, metricTiles, { columns: 3, spacingAfter: 10 });
  const summaryLines = [
    `${model.evidenceEntries.length} learning records included in this report.`,
    "Mathematics is the represented learning area.",
    "Latest learning: 24 July 2026.",
  ];
  const summaryHeight = 76;
  const summaryTop = composer.y;
  composer.page.drawRectangle({ x: margin, y: summaryTop - summaryHeight, width: contentWidth, height: summaryHeight, color: demoPalette.surface, borderColor: demoPalette.accentBorder, borderWidth: 1 });
  composer.page.drawText("Included in this report", { x: margin + 14, y: summaryTop - 20, size: 11.5, font: bold, color: demoPalette.heading });
  let summaryY = summaryTop - 39;
  summaryLines.forEach((line) => {
    summaryY = drawTextBlock(composer.page, line, regular, margin + 14, summaryY, contentWidth - 28, 9.5, demoPalette.body, 12) - 2;
  });
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
  y = drawTextBlock(page, `${formatLongDate(entry.observedOn)} | ${entry.learningArea} | Progress: ${entry.progress}`, regular, margin, y, contentWidth, 10, undefined, 14) - 12;
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

  const logo = await loadDemoLogo(document);
  drawSummaryPage(document, model, logo, regular, bold);
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
