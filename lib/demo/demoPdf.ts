import jsPDF from "jspdf";
import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";

const demoFooter =
  "This PDF uses fictional sample data and is provided for MyLearna demonstration purposes only.";

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 6,
) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addFooter(doc: jsPDF, pageNumber: number) {
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(demoFooter, 14, 286);
  doc.text(`Page ${pageNumber}`, 184, 286);
}

function ensureSpace(doc: jsPDF, y: number, pageNumber: number, needed = 28) {
  if (y + needed < 278) return { y, pageNumber };

  addFooter(doc, pageNumber);
  doc.addPage();
  return { y: 20, pageNumber: pageNumber + 1 };
}

export function downloadCarterFamilyDemoPdf(outputTitle = "Monthly learning report") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let pageNumber = 1;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("Sample Demo Report — Carter Family", 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text("Fictional data for demonstration purposes only", 14, y);
  y += 9;

  doc.setTextColor(71, 85, 105);
  doc.text(`MyLearna sample output: ${outputTitle}`, 14, y);
  y += 6;
  doc.text("Period: March 2026", 14, y);
  y += 6;
  doc.text("Learners: Emma Carter — Grade 3; Noah Carter — Grade 6", 14, y);
  y += 10;

  const sections: Array<[string, string | string[]]> = [
    [
      "Family overview",
      `${carterFamilyDemo.family.parent} is using this fictional public demo to organize homeschool planning, evidence, portfolio selections, and report preparation for Emma and Noah Carter in North Carolina.`,
    ],
    [
      "Four-week learning summary",
      "March includes weekly ELA, Math, Science, Social Studies, project, reflection, and parent record review blocks. Thursday is used for short Math checks and evidence capture.",
    ],
    [
      "Math pathway summary",
      carterFamilyDemo.pathways.map(
        (pathway) =>
          `${pathway.learnerId === "emma" ? "Emma" : "Noah"}: ${pathway.pathway}. Current focus: ${pathway.currentFocus}. Auto-check signal: ${pathway.assessment.signal}.`,
      ),
    ],
    [
      "Evidence highlights",
      carterFamilyDemo.evidence.map(
        (item) =>
          `${item.learnerId === "emma" ? "Emma" : "Noah"} — ${item.title}: ${item.note}`,
      ),
    ],
    [
      "Portfolio highlights",
      carterFamilyDemo.portfolio.map(
        (item) =>
          `${item.learnerId === "emma" ? "Emma" : "Noah"} — ${item.title}: ${item.reason}`,
      ),
    ],
    [
      "Suggested next steps",
      [
        ...carterFamilyDemo.reports.nextSteps.Emma.map((step) => `Emma: ${step}`),
        ...carterFamilyDemo.reports.nextSteps.Noah.map((step) => `Noah: ${step}`),
      ],
    ],
  ];

  for (const [heading, content] of sections) {
    const checked = ensureSpace(doc, y, pageNumber, 26);
    y = checked.y;
    pageNumber = checked.pageNumber;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(heading, 14, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);

    const entries = Array.isArray(content) ? content : [content];
    for (const entry of entries) {
      const entryCheck = ensureSpace(doc, y, pageNumber, 18);
      y = entryCheck.y;
      pageNumber = entryCheck.pageNumber;
      y = addWrappedText(doc, `• ${entry}`, 16, y, 176, 5.2) + 2;
    }
    y += 3;
  }

  addFooter(doc, pageNumber);
  doc.save("mylearna-carter-family-sample-demo-report.pdf");
}

export const demoPdfLabels = {
  beforeDownload:
    "This is a fictional demo PDF created from sample Carter Family data. It is for demonstration purposes only and is not a real homeschool record.",
  header: "Sample Demo Report — Carter Family",
  subheader: "Fictional data for demonstration purposes only",
  footer: demoFooter,
};
