import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  type IParagraphOptions,
} from "docx";

import { buildPortfolioContentModel } from "@/lib/portfolioContent";
import type { ReportExportModel } from "@/lib/reportExport";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function stripHtml(value: string) {
  return safe(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeFilename(title: string) {
  return safe(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function metadataParagraph(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value || "Not available" }),
    ],
  });
}

function sectionHeading(
  text: string,
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1,
) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });
}

export function plainTextToDocxParagraphs(content: string, options?: IParagraphOptions) {
  const clean = stripHtml(content);
  if (!clean) {
    return [
      new Paragraph({
        text: "No persisted section content was available.",
        spacing: { after: 120 },
        ...(options || {}),
      }),
    ];
  }

  return clean
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        return [];
      }

      const bulletLines = lines.every((line) => /^[-*•]\s+/.test(line));
      if (bulletLines) {
        return lines.map(
          (line) =>
            new Paragraph({
              text: line.replace(/^[-*•]\s+/, ""),
              bullet: { level: 0 },
              spacing: { after: 80 },
              ...(options || {}),
            }),
        );
      }

      return [
        new Paragraph({
          text: lines.join("\n"),
          spacing: { after: 120 },
          ...(options || {}),
        }),
      ];
    });
}

function localizedPortfolioTerm(
  model: ReportExportModel,
  values: { us: string; au: string; fallback?: string },
) {
  const locale = safe(model.localeCode).toLowerCase();
  const jurisdiction = safe(model.jurisdictionCode).toLowerCase();
  if (locale.includes("en-us") || jurisdiction.startsWith("us-")) return values.us;
  if (locale.includes("en-au") || jurisdiction.startsWith("au-")) return values.au;
  return values.fallback || values.au;
}

export function buildAuthorityDocxDocument(model: ReportExportModel) {
  const children: Paragraph[] = [
    new Paragraph({
      text: model.reportTitle || "Authority Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    metadataParagraph("Learner", model.learnerName),
    metadataParagraph(
      "Jurisdiction",
      model.jurisdictionName || model.jurisdictionCode || "Not resolved",
    ),
    metadataParagraph(
      "Reporting period",
      model.reportingPeriodLabel || "Not available",
    ),
  ];

  model.sections.forEach((section) => {
    children.push(sectionHeading(section.title));
    children.push(...plainTextToDocxParagraphs(section.contentHtml));
  });

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

export function buildPortfolioDocxDocument(model: ReportExportModel) {
  const skillsLabel = localizedPortfolioTerm(model, {
    us: "Skills Practiced",
    au: "Skills Practised",
  });

  const portfolioContent = buildPortfolioContentModel({
    sections: model.sections.map((section) => ({
      id: section.sectionKey || section.title,
      section_key: section.sectionKey,
      title: section.title,
      contentHtml: section.contentHtml,
      learnerId: model.learnerId,
      reportDocumentId: model.reportDocumentId,
    })),
    packItems: model.packItems.map((item, index) => ({
      id: `pack-${index + 1}`,
      label: item.label,
      note: item.note,
      learnerId: model.learnerId,
      reportDocumentId: model.reportDocumentId,
    })),
    localeCode: model.localeCode,
  });

  const children: Paragraph[] = [
    new Paragraph({
      text: "Learning Portfolio",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: model.learnerName,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    metadataParagraph(
      "Reporting period",
      model.reportingPeriodLabel || "Current learning record",
    ),
  ];

  if (portfolioContent.highlights.length) {
    children.push(sectionHeading("Learning Highlights"));
    portfolioContent.highlights.forEach((item) => {
      children.push(
        new Paragraph({
          text: item.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 80 },
        }),
      );
      children.push(
        ...plainTextToDocxParagraphs(item.description || "Saved learning highlight."),
      );
    });
  }

  if (portfolioContent.workSamples.length) {
    children.push(sectionHeading("Projects and Work Samples"));
    portfolioContent.workSamples.forEach((item) => {
      children.push(
        new Paragraph({
          text: item.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 80 },
        }),
      );
      if (item.subjectLabel) {
        children.push(metadataParagraph("Subject", item.subjectLabel));
      }
      children.push(
        ...plainTextToDocxParagraphs(
          item.description || "Saved work sample from the portfolio record.",
        ),
      );
    });
  }

  if (portfolioContent.skills.length) {
    children.push(sectionHeading(skillsLabel));
    portfolioContent.skills.forEach((item) => {
      children.push(
        new Paragraph({
          text: `${item.label} (${item.count})`,
          bullet: { level: 0 },
          spacing: { after: 80 },
        }),
      );
    });
  }

  if (portfolioContent.reflections.length) {
    children.push(sectionHeading("Reflections"));
    portfolioContent.reflections.forEach((item) => {
      children.push(
        new Paragraph({
          text: item.prompt,
          bullet: { level: 0 },
          spacing: { after: 80 },
        }),
      );
    });
  }

  children.push(sectionHeading("Saved Portfolio Sections"));
  model.sections.forEach((section) => {
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 80 },
      }),
    );
    children.push(...plainTextToDocxParagraphs(section.contentHtml));
  });

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

export async function generateReportDocxBuffer(model: ReportExportModel) {
  const document =
    model.reportIntent === "portfolio"
      ? buildPortfolioDocxDocument(model)
      : buildAuthorityDocxDocument(model);

  return Packer.toBuffer(document);
}

export function buildDocxFilename(model: ReportExportModel) {
  const clean = sanitizeFilename(model.reportTitle);
  return `${clean || "report-export"}.docx`;
}
