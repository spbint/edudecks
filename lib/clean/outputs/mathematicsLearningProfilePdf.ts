import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { MathematicsLearningProfilePresentationV1 } from "@/lib/clean/educationalIntelligence/mathematicsLearningProfilePresentation";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type PdfPlanCard = {
  title: string;
  badge?: string;
  paragraphs: string[];
};

export type MathematicsLearningProfilePdfPlan = {
  title: string;
  learner: string;
  assessedDate: string;
  attemptLabel: string;
  scopeStatement: string;
  pages: Array<{
    heading: string;
    introduction?: string;
    cards: PdfPlanCard[];
    closingParagraphs?: string[];
  }>;
};

function safePdfText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeFilenamePart(value: unknown, fallback: string) {
  const normalized = String(value ?? "")
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return normalized || fallback;
}

export function buildMathematicsLearningProfilePdfFilename(
  learnerDisplayName: string,
  assessedAt: string,
) {
  const learner = safeFilenamePart(learnerDisplayName, "Learner");
  const timestamp = Date.parse(assessedAt);
  const date = Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString().slice(0, 10)
    : "Profile";
  return `MyLearna-Mathematics-Learning-Profile-${learner}-${date}.pdf`;
}

export function buildMathematicsLearningProfilePdfPlan(
  profile: MathematicsLearningProfilePresentationV1,
): MathematicsLearningProfilePdfPlan {
  return {
    title: profile.title,
    learner: profile.learner.displayName,
    assessedDate: profile.assessment.assessedDateLabel,
    attemptLabel: profile.assessment.attemptLabel,
    scopeStatement: profile.scope.statement,
    pages: [
      {
        heading: "Five-area overview",
        introduction: `${profile.overview.headline}. ${profile.overview.independenceStatement}`,
        cards: profile.areas.map((area) => ({
          title: area.areaName,
          badge: area.statusLabel,
          paragraphs: [area.statusExplanation],
        })),
      },
      {
        heading: "Detailed learning profile",
        introduction:
          "Each interpretation below comes from the canonical evidence result. Missing evidence is left open rather than treated as failure.",
        cards: profile.areas.map((area) => ({
          title: area.areaName,
          badge: area.evidence.sufficiencyLabel,
          paragraphs: [
            area.learningPosition.heading,
            area.learningPosition.explanation,
            area.evidence.whyStatement,
            ...(area.evidence.limitationStatement
              ? [area.evidence.limitationStatement]
              : []),
          ],
        })),
      },
      {
        heading: "Recommended next learning",
        introduction:
          "These next steps preserve the deterministic Starting Point recommendations. Opening a learning link does not automatically change My Pathways.",
        cards: profile.areas.map((area) => ({
          title: area.areaName,
          badge: area.nextLearning.available ? "Next learning" : "Evidence first",
          paragraphs: [area.nextLearning.heading, area.nextLearning.explanation],
        })),
        closingParagraphs: [
          profile.evidenceGuide.heading,
          ...profile.evidenceGuide.paragraphs,
          profile.evidenceGuide.parentControlStatement,
        ],
      },
    ],
  };
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safePdfText(text).split(/\s+/).filter(Boolean);
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

function drawLines(input: {
  page: PDFPage;
  lines: string[];
  x: number;
  y: number;
  font: PDFFont;
  size: number;
  lineHeight: number;
  color: ReturnType<typeof rgb>;
}) {
  let y = input.y;
  for (const line of input.lines) {
    input.page.drawText(line, {
      x: input.x,
      y,
      font: input.font,
      size: input.size,
      color: input.color,
    });
    y -= input.lineHeight;
  }
  return y;
}

function drawHeader(input: {
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  plan: MathematicsLearningProfilePdfPlan;
  pageHeading: string;
}) {
  const ink = rgb(0.09, 0.13, 0.29);
  const muted = rgb(0.35, 0.39, 0.49);
  input.page.drawText("MYLEARNA - NUMBER & OPERATIONS PROFILE", {
    x: MARGIN,
    y: PAGE_HEIGHT - 52,
    font: input.bold,
    size: 8.5,
    color: rgb(0.36, 0.23, 0.91),
  });
  input.page.drawText(safePdfText(input.pageHeading), {
    x: MARGIN,
    y: PAGE_HEIGHT - 82,
    font: input.bold,
    size: 21,
    color: ink,
  });
  input.page.drawText(
    safePdfText(`${input.plan.learner} | ${input.plan.assessedDate} | ${input.plan.attemptLabel}`),
    {
      x: MARGIN,
      y: PAGE_HEIGHT - 102,
      font: input.regular,
      size: 9.5,
      color: muted,
    },
  );
  input.page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 116 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 116 },
    thickness: 1,
    color: rgb(0.86, 0.84, 0.97),
  });
  return PAGE_HEIGHT - 138;
}

function drawCard(input: {
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  card: PdfPlanCard;
  y: number;
}) {
  const titleLines = wrapText(input.card.title, input.bold, 11, CONTENT_WIDTH - 150);
  const paragraphLines = input.card.paragraphs.map((paragraph) =>
    wrapText(paragraph, input.regular, 9, CONTENT_WIDTH - 24),
  );
  const textHeight =
    titleLines.length * 14 +
    paragraphLines.reduce((sum, lines) => sum + lines.length * 12 + 5, 0);
  const height = Math.max(66, textHeight + 24);

  input.page.drawRectangle({
    x: MARGIN,
    y: input.y - height,
    width: CONTENT_WIDTH,
    height,
    color: rgb(0.985, 0.982, 1),
    borderColor: rgb(0.84, 0.82, 0.96),
    borderWidth: 1,
  });

  let cursor = drawLines({
    page: input.page,
    lines: titleLines,
    x: MARGIN + 12,
    y: input.y - 18,
    font: input.bold,
    size: 11,
    lineHeight: 14,
    color: rgb(0.09, 0.13, 0.29),
  });

  if (input.card.badge) {
    const badge = safePdfText(input.card.badge);
    const width = Math.min(138, input.bold.widthOfTextAtSize(badge, 8) + 16);
    input.page.drawRectangle({
      x: PAGE_WIDTH - MARGIN - width - 10,
      y: input.y - 27,
      width,
      height: 18,
      color: rgb(0.94, 0.93, 1),
      borderColor: rgb(0.78, 0.74, 0.98),
      borderWidth: 1,
    });
    input.page.drawText(badge, {
      x: PAGE_WIDTH - MARGIN - width - 2,
      y: input.y - 21,
      font: input.bold,
      size: 8,
      color: rgb(0.29, 0.23, 0.69),
    });
  }

  cursor -= 3;
  for (const lines of paragraphLines) {
    cursor = drawLines({
      page: input.page,
      lines,
      x: MARGIN + 12,
      y: cursor,
      font: input.regular,
      size: 9,
      lineHeight: 12,
      color: rgb(0.27, 0.31, 0.39),
    });
    cursor -= 5;
  }
  return input.y - height - 9;
}

function addFooters(doc: PDFDocument, regular: PDFFont) {
  const pages = doc.getPages();
  pages.forEach((page, index) => {
    page.drawLine({
      start: { x: MARGIN, y: 42 },
      end: { x: PAGE_WIDTH - MARGIN, y: 42 },
      thickness: 0.8,
      color: rgb(0.86, 0.84, 0.97),
    });
    page.drawText("Number & Operations only - no overall Maths score", {
      x: MARGIN,
      y: 26,
      font: regular,
      size: 8,
      color: rgb(0.39, 0.45, 0.54),
    });
    page.drawText(`Page ${index + 1} of ${pages.length}`, {
      x: PAGE_WIDTH - MARGIN - 58,
      y: 26,
      font: regular,
      size: 8,
      color: rgb(0.39, 0.45, 0.54),
    });
  });
}

export async function generateMathematicsLearningProfilePdfBytes(
  profile: MathematicsLearningProfilePresentationV1,
) {
  const plan = buildMathematicsLearningProfilePdfPlan(profile);
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  plan.pages.forEach((pagePlan, pageIndex) => {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = drawHeader({ page, regular, bold, plan, pageHeading: pagePlan.heading });

    if (pageIndex === 0) {
      const scopeLines = wrapText(plan.scopeStatement, regular, 9.5, CONTENT_WIDTH);
      y = drawLines({
        page,
        lines: scopeLines,
        x: MARGIN,
        y,
        font: regular,
        size: 9.5,
        lineHeight: 13,
        color: rgb(0.27, 0.31, 0.39),
      }) - 8;
    }

    if (pagePlan.introduction) {
      y = drawLines({
        page,
        lines: wrapText(pagePlan.introduction, regular, 9.5, CONTENT_WIDTH),
        x: MARGIN,
        y,
        font: regular,
        size: 9.5,
        lineHeight: 13,
        color: rgb(0.27, 0.31, 0.39),
      }) - 10;
    }

    pagePlan.cards.forEach((card) => {
      y = drawCard({ page, regular, bold, card, y });
    });

    if (pagePlan.closingParagraphs?.length) {
      y -= 4;
      pagePlan.closingParagraphs.forEach((paragraph, index) => {
        const isHeading = index === 0;
        y = drawLines({
          page,
          lines: wrapText(paragraph, isHeading ? bold : regular, isHeading ? 12 : 9, CONTENT_WIDTH),
          x: MARGIN,
          y,
          font: isHeading ? bold : regular,
          size: isHeading ? 12 : 9,
          lineHeight: isHeading ? 15 : 12,
          color: isHeading ? rgb(0.09, 0.13, 0.29) : rgb(0.27, 0.31, 0.39),
        }) - 6;
      });
    }
  });

  addFooters(doc, regular);
  return doc.save();
}
