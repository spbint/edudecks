import jsPDF from "jspdf";

export type GuidedStartSession = {
  child: {
    name: string;
    yearLevel?: string;
  };
  plan: {
    category: string;
    title: string;
    suggestedDay?: string;
  };
  calendar: {
    weekLabel?: string;
    scheduledDay?: string;
  };
  capture: {
    happened: string;
    showed?: string;
    note?: string;
  };
  report: {
    summary: string;
  };
  portfolio: {
    previewTitle?: string;
  };
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function bodyText(doc: jsPDF, text: string, x: number, y: number, width: number) {
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return lines.length * 16;
}

export async function buildGuidedStartPdf(session: GuidedStartSession): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 54;
  const usableWidth = pageWidth - marginX * 2;
  let y = 58;

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(marginX, y, usableWidth, 86, 16, 16, "F");
  y += 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("GUIDED HOMESCHOOL RECORD", marginX + 18, y);
  y += 24;

  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.text("Your first learning record", marginX + 18, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text("Created with EduDecks Family - guided homeschool records", marginX + 18, y);
  y += 42;

  const sections: Array<[string, string]> = [
    ["Child", safe(session.child.name) || "Your child"],
    ["Year level", safe(session.child.yearLevel) || "Not added yet"],
    ["Planned activity", safe(session.plan.title) || "Not added yet"],
    [
      "Calendar placement",
      [safe(session.calendar.weekLabel), safe(session.calendar.scheduledDay)]
        .filter(Boolean)
        .join(" - ") || "This week",
    ],
    ["Captured learning moment", safe(session.capture.happened) || "Not added yet"],
    ["What it showed", safe(session.capture.showed) || "Not added yet"],
    ["Optional note", safe(session.capture.note) || "No extra note added"],
    ["Report-ready summary", safe(session.report.summary) || "Not added yet"],
    ["Portfolio preview", safe(session.portfolio.previewTitle) || "Your first learning story"],
  ];

  for (const [label, value] of sections) {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    const valueLines = doc.splitTextToSize(value, usableWidth - 32);
    const boxHeight = Math.max(54, valueLines.length * 16 + 28);
    doc.roundedRect(marginX, y, usableWidth, boxHeight, 12, 12, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), marginX + 16, y + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    bodyText(doc, value, marginX + 16, y + 38, usableWidth - 32);

    y += boxHeight + 12;

    if (y > 700) {
      doc.addPage();
      y = 58;
    }
  }

  return doc.output("blob");
}
