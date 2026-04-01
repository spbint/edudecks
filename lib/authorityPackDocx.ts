import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ReportDraftRow } from "@/lib/reportDrafts";
import type {
  AuthorityPackConfig,
  AuthorityPackSectionKey,
} from "@/lib/authorityPackConfig";
import type { AuthorityEvidenceRow } from "@/lib/authorityPackData";

type BuildAuthorityPackDocxInput = {
  draft: ReportDraftRow;
  config: AuthorityPackConfig;
  evidenceRows: AuthorityEvidenceRow[];
};

const BRAND = {
  navy: "0F172A",
  slate: "475569",
  muted: "64748B",
  border: "E2E8F0",
  soft: "F8FAFC",
  blue: "2563EB",
  blueSoft: "EFF6FF",
  blueBorder: "BFDBFE",
  green: "166534",
  greenSoft: "F0FDF4",
  greenBorder: "BBF7D0",
  amber: "9A3412",
  amberSoft: "FFF7ED",
  amberBorder: "FED7AA",
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

function heading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    thematicBreak: false,
    style: "Normal",
    children: [
      new TextRun({
        text,
        bold: true,
        size: 30,
        color: BRAND.navy,
      }),
    ],
  });
}

function smallLabel(text: string) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        color: BRAND.muted,
        size: 18,
        characterSpacing: 25,
      }),
    ],
  });
}

function body(text: string, after = 120) {
  return new Paragraph({
    spacing: { after },
    children: [
      new TextRun({
        text,
        color: BRAND.slate,
        size: 22,
      }),
    ],
  });
}

function bullet(text: string) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        color: BRAND.slate,
        size: 22,
      }),
    ],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 120, after: 180 },
    border: {
      bottom: {
        color: BRAND.border,
        size: 6,
        style: BorderStyle.SINGLE,
      },
    },
  });
}

function cardParagraphs(lines: string[]) {
  return lines.map((line, index) =>
    new Paragraph({
      spacing: { after: index === lines.length - 1 ? 0 : 70 },
      children: [
        new TextRun({
          text: line,
          color: BRAND.slate,
          size: 22,
        }),
      ],
    })
  );
}

function cardBox(lines: string[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: {
              top: 160,
              bottom: 160,
              left: 180,
              right: 180,
            },
            shading: {
              type: ShadingType.CLEAR,
              fill: BRAND.soft,
              color: "auto",
            },
            borders: {
              top: { style: BorderStyle.SINGLE, color: BRAND.border, size: 8 },
              bottom: { style: BorderStyle.SINGLE, color: BRAND.border, size: 8 },
              left: { style: BorderStyle.SINGLE, color: BRAND.border, size: 8 },
              right: { style: BorderStyle.SINGLE, color: BRAND.border, size: 8 },
            },
            children: cardParagraphs(lines),
          }),
        ],
      }),
    ],
  });
}

function evidenceCard(row: AuthorityEvidenceRow) {
  const title = safe(row.title) || "Evidence item";
  const metaParts = [
    safe((row as any).learningArea || (row as any).learning_area),
    safe((row as any).occurredOn || (row as any).occurred_on),
    row.role === "appendix" ? "Appendix" : "Core",
    row.required ? "Required" : "",
  ].filter(Boolean);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: {
              top: 160,
              bottom: 160,
              left: 180,
              right: 180,
            },
            shading: {
              type: ShadingType.CLEAR,
              fill: "FFFFFF",
              color: "auto",
            },
            borders: {
              top: { style: BorderStyle.SINGLE, color: BRAND.border, size: 8 },
              bottom: { style: BorderStyle.SINGLE, color: BRAND.border, size: 8 },
              left: { style: BorderStyle.SINGLE, color: BRAND.border, size: 8 },
              right: { style: BorderStyle.SINGLE, color: BRAND.border, size: 8 },
            },
            children: [
              new Paragraph({
                spacing: { after: 70 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    color: BRAND.navy,
                    size: 25,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 90 },
                children: [
                  new TextRun({
                    text: metaParts.join(" • "),
                    color: BRAND.muted,
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: safe(row.summary) || "No summary text available.",
                    color: BRAND.slate,
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function metadataTable(draft: ReportDraftRow, config: AuthorityPackConfig, readiness: number) {
  const rows: Array<[string, string]> = [
    ["Child", draft.child_name],
    ["Mode", modeLabel(draft.report_mode)],
    ["Period", periodLabel(draft.period_mode)],
    ["Jurisdiction", marketLabel(config.jurisdiction)],
    ["Prepared", shortDate(new Date().toISOString())],
    ["Readiness", `${readiness}%`],
  ];

  return new Table({
    width: { size: 74, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              borders: noBorders(),
              margins: { top: 70, bottom: 70, left: 0, right: 80 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label.toUpperCase(),
                      bold: true,
                      color: BRAND.muted,
                      size: 19,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 66, type: WidthType.PERCENTAGE },
              borders: noBorders(),
              margins: { top: 70, bottom: 70, left: 0, right: 0 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: value,
                      color: BRAND.navy,
                      size: 23,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    ),
  });
}

function noBorders() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };
}

export async function buildAuthorityPackDocx(
  input: BuildAuthorityPackDocxInput
): Promise<Blob> {
  const { draft, config, evidenceRows } = input;
  const includedSections = Object.keys(config.includeSections || {}).filter(
    (k) => config.includeSections[k as AuthorityPackSectionKey]
  ) as AuthorityPackSectionKey[];
  const readiness = buildReadinessScore(draft, config, evidenceRows);

  const children: Array<Paragraph | Table> = [];

  children.push(
    new Paragraph({
      spacing: { after: 120 },
      border: {
        top: {
          color: BRAND.blue,
          size: 24,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 140, after: 20 },
      children: [
        new TextRun({
          text: "EDUDECKS AUTHORITY PACK",
          bold: true,
          color: BRAND.muted,
          size: 20,
          characterSpacing: 30,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: config.title,
          bold: true,
          color: BRAND.navy,
          size: 44,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: `${draft.child_name} — ${marketLabel(config.jurisdiction)}`,
          color: BRAND.slate,
          size: 28,
        }),
      ],
    })
  );

  children.push(
    cardBox([
      "Prepared from structured learning evidence.",
      "This authority pack presents a branded, evidence-led summary of current progress, selected supporting records, and submission-ready sections shaped inside EduDecks.",
    ])
  );

  children.push(new Paragraph({ spacing: { after: 220 } }));
  children.push(metadataTable(draft, config, readiness));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  if (config.includeSections.overview) {
    children.push(heading("Overview"));
    children.push(
      cardBox([
        "This authority pack has been prepared from a saved EduDecks report object.",
        "It presents a calmer, evidence-led snapshot of current learning progress and selected supporting records.",
      ])
    );
  }

  if (config.includeSections.coverage) {
    children.push(heading("Coverage Snapshot"));
    children.push(
      body(
        `${draft.selected_areas.join(" • ")}`
      )
    );
    children.push(
      body(
        `Selected areas: ${draft.selected_areas.length}. Core evidence: ${selectedCoreCount(
          draft
        )}. Appendix evidence: ${selectedAppendixCount(
          draft
        )}. Required-marked evidence: ${selectedRequiredCount(draft)}.`,
        60
      )
    );
    children.push(divider());
  }

  if (config.includeSections.evidence) {
    children.push(heading("Selected Evidence"));
    evidenceRows.forEach((row, index) => {
      children.push(evidenceCard(row));
      if (index < evidenceRows.length - 1) {
        children.push(new Paragraph({ spacing: { after: 80 } }));
      }
    });
    children.push(divider());
  }

  if (config.includeSections.appendix) {
    children.push(heading("Appendix Summary"));
    children.push(
      body(`Appendix evidence available: ${selectedAppendixCount(draft)}.`)
    );
    children.push(divider());
  }

  if (config.includeSections["action-plan"]) {
    children.push(heading("Action Plan"));
    children.push(
      bullet("Continue collecting representative evidence across the selected areas.")
    );
    children.push(
      bullet("Retain strong core anchors and keep the record balanced over time.")
    );
    children.push(
      bullet("Use this pack as a checkpoint rather than the full learning record.")
    );
    children.push(divider());
  }

  if (config.includeSections["weekly-plan"]) {
    children.push(heading("Weekly Plan"));
    children.push(
      bullet("Capture one meaningful learning moment early in the week.")
    );
    children.push(
      bullet("Add one broader example mid-week to show balance.")
    );
    children.push(
      bullet("Review and retain one strong evidence item at week’s end.")
    );
    children.push(divider());
  }

  if (config.includeSections["readiness-notes"]) {
    children.push(heading("Readiness Notes"));
    children.push(
      cardBox([
        `Submission readiness: ${readiness}%`,
        `This pack includes ${evidenceRows.length} included evidence item${
          evidenceRows.length === 1 ? "" : "s"
        }, with ${selectedCoreCount(draft)} core anchor${
          selectedCoreCount(draft) === 1 ? "" : "s"
        } and ${selectedRequiredCount(draft)} required-marked item${
          selectedRequiredCount(draft) === 1 ? "" : "s"
        }.`,
      ])
    );
    children.push(divider());
  }

  if (config.includeSections["parent-note"] && draft.notes?.trim()) {
    children.push(heading("Parent Note"));
    children.push(cardBox([draft.notes]));
    children.push(divider());
  }

  if (config.emphasisNote.trim()) {
    children.push(heading("Authority Emphasis"));
    children.push(cardBox([config.emphasisNote]));
    children.push(divider());
  }

  if (config.reviewerNote.trim()) {
    children.push(heading("Reviewer Note"));
    children.push(cardBox([config.reviewerNote]));
    children.push(divider());
  }

  children.push(heading("Included Sections"));
  includedSections.forEach((key) => children.push(bullet(sectionLabel(key))));

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Aptos",
            size: 22,
            color: BRAND.slate,
          },
          paragraph: {
            spacing: {
              after: 80,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 900,
              bottom: 900,
              left: 900,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: {
                    color: BRAND.border,
                    size: 6,
                    style: BorderStyle.SINGLE,
                  },
                },
                spacing: { before: 120, after: 0 },
                children: [
                  new TextRun({
                    text: "Generated by EduDecks  •  Authority-ready homeschool reporting  •  Page ",
                    color: BRAND.muted,
                    size: 18,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    color: BRAND.muted,
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}