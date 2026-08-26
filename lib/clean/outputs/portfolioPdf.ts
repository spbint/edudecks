import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFFont, type PDFPage } from "pdf-lib";
import { supabase } from "@/lib/supabaseClient";
import { FAMILY_EVIDENCE_STORAGE_BUCKET } from "@/lib/familyEvidence";
import type { CleanReportPdfEvidenceItem } from "./pdf";
import type { LearningEvidenceEvent } from "@/lib/clean/evidence/learningEvidenceEvents";

export type CleanPortfolioPdfModel = {
  learnerLabel: string;
  startsOn: string | null;
  endsOn: string | null;
  preparedOnLabel: string;
  portfolioEvidenceItems: CleanReportPdfEvidenceItem[];
  recordEvidenceItems: CleanReportPdfEvidenceItem[];
  assessmentEvidenceItems?: LearningEvidenceEvent[];
};

export type PortfolioImageFit = { x: number; y: number; width: number; height: number };

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const MAX_NORMALISED_IMAGE_BYTES = 3 * 1024 * 1024;

const COLORS = {
  navy: rgb(0.06, 0.11, 0.2),
  heading: rgb(0.1, 0.19, 0.36),
  body: rgb(0.2, 0.24, 0.31),
  muted: rgb(0.39, 0.45, 0.54),
  blue: rgb(0.22, 0.42, 0.78),
  blueWash: rgb(0.94, 0.97, 1),
  lavender: rgb(0.42, 0.34, 0.75),
  warm: rgb(0.99, 0.98, 0.95),
  line: rgb(0.86, 0.89, 0.94),
};

type Composer = {
  doc: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  y: number;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function cleanText(value: unknown) {
  return safe(value)
    .replace(/<br\s*\/?>(\r?\n)?/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: unknown, max = 180) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 3).trimEnd();
  const space = cut.lastIndexOf(" ");
  return `${(space > 40 ? cut.slice(0, space) : cut)}...`;
}

function dateLabel(value: string | null | undefined) {
  const text = safe(value);
  if (!text) return "Date not recorded";
  const date = new Date(`${text.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? text.slice(0, 10)
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function dateRange(model: CleanPortfolioPdfModel) {
  if (!model.startsOn && !model.endsOn) return "Learning year";
  return `${dateLabel(model.startsOn)} – ${dateLabel(model.endsOn)}`;
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitImage(image: { width: number; height: number }, frame: { x: number; y: number; width: number; height: number }, mode: "cover" | "contain" = "contain"): PortfolioImageFit {
  if (image.width <= 0 || image.height <= 0 || frame.width <= 0 || frame.height <= 0) return frame;
  const scale = mode === "cover"
    ? Math.max(frame.width / image.width, frame.height / image.height)
    : Math.min(frame.width / image.width, frame.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: frame.x + (frame.width - width) / 2, y: frame.y + (frame.height - height) / 2, width, height };
}

export function getPortfolioImageFit(
  image: { width: number; height: number },
  frame: { x: number; y: number; width: number; height: number },
  mode: "cover" | "contain" = "contain",
) {
  return fitImage(image, frame, mode);
}

function newComposer(doc: PDFDocument, regular: PDFFont, bold: PDFFont): Composer {
  return { doc, page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]), regular, bold, y: PAGE_HEIGHT - MARGIN };
}

function newPage(composer: Composer) {
  return newComposer(composer.doc, composer.regular, composer.bold);
}

function text(composer: Composer, value: string, x: number, size: number, color = COLORS.body, font = composer.regular, maxWidth?: number) {
  composer.page.drawText(value, { x, y: composer.y, size, color, font, ...(maxWidth ? { maxWidth } : {}) });
  composer.y -= size + 7;
}

function lines(composer: Composer, value: string, x: number, size: number, width: number, color = COLORS.body, font = composer.regular, lineHeight = size + 5) {
  for (const line of wrap(value, font, size, width)) {
    composer.page.drawText(line, { x, y: composer.y, size, color, font });
    composer.y -= lineHeight;
  }
}

function header(composer: Composer, label: string) {
  text(composer, label.toUpperCase(), MARGIN, 9, COLORS.blue, composer.bold);
  composer.y -= 4;
}

function footer(doc: PDFDocument, regular: PDFFont, learner: string) {
  const total = doc.getPageCount();
  doc.getPages().forEach((page, index) => {
    if (index === 0) return;
    page.drawLine({ start: { x: MARGIN, y: 40 }, end: { x: PAGE_WIDTH - MARGIN, y: 40 }, thickness: 0.7, color: COLORS.line });
    page.drawText(`${learner} · Learning Portfolio`, { x: MARGIN, y: 25, size: 8, font: regular, color: COLORS.muted });
    page.drawText(`Page ${index + 1} of ${total} · MyLearna`, { x: PAGE_WIDTH - 170, y: 25, size: 8, font: regular, color: COLORS.muted });
  });
}

async function imageUrl(item: CleanReportPdfEvidenceItem) {
  if (typeof window === "undefined") return null;
  if (safe(item.previewImageUrl)) return safe(item.previewImageUrl);
  if (!safe(item.previewImageStoragePath)) return null;
  try {
    const result = await supabase.storage.from(FAMILY_EVIDENCE_STORAGE_BUCKET).createSignedUrl(safe(item.previewImageStoragePath), 10 * 60);
    return safe(result.data?.signedUrl) || null;
  } catch {
    return null;
  }
}

async function embedImage(doc: PDFDocument, item: CleanReportPdfEvidenceItem, cache: Map<string, PDFImage | null>) {
  const url = await imageUrl(item);
  if (!url) return null;
  if (cache.has(url)) return cache.get(url) ?? null;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength) return null;
    const contentType = safe(response.headers.get("content-type")).toLowerCase();
    let image: PDFImage | null = null;
    const isPng = contentType.includes("png") || url.split("?")[0].toLowerCase().endsWith(".png");
    const isJpeg = contentType.includes("jpeg") || contentType.includes("jpg") || /\.jpe?g($|\?)/i.test(url);
    if (bytes.byteLength <= MAX_NORMALISED_IMAGE_BYTES && isPng) image = await doc.embedPng(bytes);
    else if (bytes.byteLength <= MAX_NORMALISED_IMAGE_BYTES && isJpeg) image = await doc.embedJpg(bytes);
    else if (typeof window !== "undefined" && typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(new Blob([bytes]));
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (blob) image = await doc.embedJpg(await blob.arrayBuffer());
      bitmap.close();
    }
    cache.set(url, image);
    return image;
  } catch {
    cache.set(url, null);
    return null;
  }
}

function drawImage(composer: Composer, image: PDFImage, frame: { x: number; y: number; width: number; height: number }, mode: "cover" | "contain") {
  const fit = fitImage(image, frame, mode);
  composer.page.drawImage(image, fit);
}

function drawCover(composer: Composer, model: CleanPortfolioPdfModel, hero: PDFImage | null) {
  const page = composer.page;
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: COLORS.warm });
  if (hero) {
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT * 0.36, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.64, color: rgb(0.9, 0.92, 0.95) });
    drawImage(composer, hero, { x: 0, y: PAGE_HEIGHT * 0.36, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.64 }, "cover");
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT * 0.36, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.64, color: rgb(0.05, 0.08, 0.16), opacity: 0.1 });
  }
  composer.y = hero ? PAGE_HEIGHT * 0.29 : PAGE_HEIGHT * 0.7;
  text(composer, safe(model.learnerLabel).toUpperCase(), MARGIN, 30, COLORS.navy, composer.bold, PAGE_WIDTH - MARGIN * 2);
  text(composer, "Learning Portfolio", MARGIN, 21, COLORS.heading, composer.bold);
  text(composer, `${dateRange(model)}\nPrepared ${safe(model.preparedOnLabel)}`, MARGIN, 11, COLORS.muted);
  page.drawText("Created with MyLearna", { x: MARGIN, y: 48, size: 9, font: composer.regular, color: COLORS.muted });
}

function drawAtGlance(composer: Composer, model: CleanPortfolioPdfModel) {
  header(composer, "Learning at a glance");
  text(composer, `${model.learnerLabel}'s Learning at a Glance`, MARGIN, 24, COLORS.navy, composer.bold);
  text(composer, dateRange(model), MARGIN, 11, COLORS.muted);
  const all = model.portfolioEvidenceItems;
  const areas = [...new Set(all.map((item) => safe(item.learningArea)).filter(Boolean))];
  const metrics = [
    [`${all.length}`, "learning moments"],
    [`${model.portfolioEvidenceItems.length}`, "Portfolio highlights"],
    [`${areas.length}`, "learning areas"],
    ...(model.assessmentEvidenceItems?.length ? [[String(model.assessmentEvidenceItems.length), "pathway checks"]] : []),
  ];
  composer.y -= 18;
  metrics.forEach(([value, label], index) => {
    const x = MARGIN + (index % 2) * 260;
    const y = composer.y - Math.floor(index / 2) * 78;
    composer.page.drawRectangle({ x, y: y - 48, width: 235, height: 62, color: COLORS.blueWash, borderColor: COLORS.line, borderWidth: 1 });
    composer.page.drawText(value, { x: x + 14, y: y - 13, size: 20, font: composer.bold, color: COLORS.heading });
    composer.page.drawText(label, { x: x + 14, y: y - 34, size: 10, font: composer.regular, color: COLORS.muted });
  });
  composer.y -= Math.ceil(metrics.length / 2) * 78 + 14;
  if (areas.length) {
    text(composer, "Learning areas", MARGIN, 14, COLORS.heading, composer.bold);
    lines(composer, areas.join("  ·  "), MARGIN, 12, PAGE_WIDTH - MARGIN * 2, COLORS.body, composer.regular, 18);
  }
  if (all.length) {
    composer.y -= 16;
    lines(composer, `This portfolio brings together ${all.length} learning ${all.length === 1 ? "moment" : "moments"}${areas.length ? ` across ${areas.join(", ")}` : ""}.`, MARGIN, 12, PAGE_WIDTH - MARGIN * 2, COLORS.body);
  }
}

function drawHighlights(composer: Composer, items: CleanReportPdfEvidenceItem[], images: Map<string, PDFImage | null>) {
  header(composer, "Portfolio highlights");
  text(composer, "Selected learning moments", MARGIN, 23, COLORS.navy, composer.bold);
  composer.y -= 8;
  items.slice(0, 6).forEach((item, index) => {
    if (composer.y < 150) Object.assign(composer, newPage(composer));
    const image = images.get(item.id) ?? null;
    const top = composer.y;
    if (image) drawImage(composer, image, { x: MARGIN, y: top - 86, width: 126, height: 78 }, "cover");
    const x = image ? MARGIN + 144 : MARGIN;
    text(composer, `${index + 1}. ${safe(item.title) || "Learning moment"}`, x, 13, COLORS.heading, composer.bold, PAGE_WIDTH - x - MARGIN);
    text(composer, `${dateLabel(item.observedOn)}${safe(item.learningArea) ? ` · ${safe(item.learningArea)}` : ""}`, x, 10, COLORS.muted);
    lines(composer, truncate(item.whatHappened, 150), x, 10.5, PAGE_WIDTH - x - MARGIN, COLORS.body, composer.regular, 14);
    composer.y = Math.min(composer.y, top - 100) - 16;
  });
}

function drawEvidence(composer: Composer, items: CleanReportPdfEvidenceItem[], images: Map<string, PDFImage | null>) {
  header(composer, "Learning evidence");
  text(composer, "Learning moments", MARGIN, 23, COLORS.navy, composer.bold);
  composer.y -= 8;
  items.forEach((item, index) => {
    const image = images.get(item.id) ?? null;
    const photoHeight = image ? 150 : 0;
    const narrative = [cleanText(item.whatHappened), cleanText(item.reflection)].filter(Boolean).join("\n\n");
    const needed = 80 + photoHeight + Math.min(180, wrap(narrative, composer.regular, 10.5, PAGE_WIDTH - MARGIN * 2).length * 14);
    if (composer.y < needed + 70) Object.assign(composer, newPage(composer));
    if (item.progressLevel || item.pathwayLabel) header(composer, item.pathwayLabel || "Learning moment");
    text(composer, `${index + 1}. ${safe(item.title) || "Learning moment"}`, MARGIN, 15, COLORS.heading, composer.bold);
    text(composer, `${dateLabel(item.observedOn)}${safe(item.learningArea) ? ` · ${safe(item.learningArea)}` : ""}`, MARGIN, 10, COLORS.muted);
    if (image) {
      drawImage(composer, image, { x: MARGIN, y: composer.y - photoHeight, width: PAGE_WIDTH - MARGIN * 2, height: photoHeight }, "contain");
      composer.y -= photoHeight + 12;
    }
    lines(composer, truncate(item.whatHappened, 900), MARGIN, 10.5, PAGE_WIDTH - MARGIN * 2, COLORS.body, composer.regular, 14);
    if (cleanText(item.reflection)) {
      composer.y -= 4;
      text(composer, "Reflection", MARGIN, 9, COLORS.muted, composer.bold);
      lines(composer, truncate(item.reflection, 500), MARGIN, 10.5, PAGE_WIDTH - MARGIN * 2, COLORS.body, composer.regular, 14);
    }
    const context = [item.programTitle, item.segmentTitle, item.stepLabel, item.progressLevel].filter(Boolean).join(" · ");
    if (context) text(composer, context, MARGIN, 9, COLORS.muted);
    composer.y -= 12;
  });
}

function drawPathways(composer: Composer, items: LearningEvidenceEvent[]) {
  if (!items.length) return;
  header(composer, "Progress & pathways");
  text(composer, "Pathway checks", MARGIN, 23, COLORS.navy, composer.bold);
  items.forEach((item) => {
    if (composer.y < 150) Object.assign(composer, newPage(composer));
    text(composer, safe(item.stepTitle) || safe(item.title) || "Pathway check", MARGIN, 13, COLORS.heading, composer.bold);
    text(composer, `${dateLabel(item.evidenceDate)} · ${safe(item.subject || item.strand)}`, MARGIN, 10, COLORS.muted);
    lines(composer, `Result: ${item.correctCount} / ${item.questionCount} correct · Support recommended: ${item.supportRecommendedCount}${item.parentJudgement ? ` · Parent judgement: ${item.parentJudgement}` : ""}`, MARGIN, 10.5, PAGE_WIDTH - MARGIN * 2);
    composer.y -= 8;
  });
}

function drawRecord(composer: Composer, model: CleanPortfolioPdfModel) {
  header(composer, "Learning record");
  text(composer, "Formal Learning Record", MARGIN, 23, COLORS.navy, composer.bold);
  text(composer, "A chronological record of included learning.", MARGIN, 11, COLORS.muted);
  const items = [...model.recordEvidenceItems].sort((a, b) => (a.observedOn || "").localeCompare(b.observedOn || ""));
  items.forEach((item) => {
    if (composer.y < 105) Object.assign(composer, newPage(composer));
    composer.page.drawLine({ start: { x: MARGIN, y: composer.y + 4 }, end: { x: PAGE_WIDTH - MARGIN, y: composer.y + 4 }, thickness: 0.5, color: COLORS.line });
    text(composer, dateLabel(item.observedOn), MARGIN, 9.5, COLORS.muted, composer.bold);
    text(composer, safe(item.title) || "Learning moment", MARGIN + 104, 10.5, COLORS.heading, composer.bold);
    text(composer, [safe(item.learningArea), truncate(item.whatHappened, 120)].filter(Boolean).join(" · "), MARGIN + 104, 9.5, COLORS.body);
  });
  if (!items.length) text(composer, "No formal learning-record items are available for this portfolio yet.", MARGIN, 11, COLORS.muted);
}

export function buildCleanPortfolioPdfFilename(learnerLabel: string | null | undefined, generatedOn: string | null | undefined) {
  const learner = safe(learnerLabel).normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "Learner";
  const date = safe(generatedOn).slice(0, 10) || new Date().toISOString().slice(0, 10);
  return `MyLearna-${learner}-Learning-Portfolio-${date}.pdf`;
}

export async function generateCleanPortfolioPdfBytes(model: CleanPortfolioPdfModel) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${safe(model.learnerLabel) || "Learner"} Learning Portfolio`);
  doc.setAuthor("MyLearna");
  doc.setCreator("MyLearna");
  doc.setSubject("Learning Portfolio");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const cache = new Map<string, PDFImage | null>();
  const all = model.portfolioEvidenceItems;
  const heroItem = all.find((item) => safe(item.previewImageUrl) || safe(item.previewImageStoragePath));
  const hero = heroItem ? await embedImage(doc, heroItem, cache) : null;
  if (heroItem) cache.set(heroItem.id, hero);
  let composer = newComposer(doc, regular, bold);
  drawCover(composer, model, hero);
  composer = newPage(composer);
  drawAtGlance(composer, model);
  const imageItems = [...new Map(all.map((item) => [item.id, item])).values()];
  for (const item of imageItems) if (!cache.has(item.id)) {
    const image = await embedImage(doc, item, cache);
    cache.set(item.id, image);
  }
  if (all.some((item) => item.previewImageUrl || item.previewImageStoragePath)) {
    composer = newPage(composer);
    drawHighlights(composer, all, cache);
  }
  if (all.length) {
    composer = newPage(composer);
    drawEvidence(composer, all, cache);
  }
  if (model.assessmentEvidenceItems?.length) {
    composer = newPage(composer);
    drawPathways(composer, model.assessmentEvidenceItems);
  }
  composer = newPage(composer);
  drawRecord(composer, model);
  footer(doc, regular, safe(model.learnerLabel) || "Learner");
  return doc.save();
}
