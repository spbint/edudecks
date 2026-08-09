import { inflateSync } from "node:zlib";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, PDFName } from "pdf-lib";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const assetDirectory = "public/resources/homeschool-answers/record-keeping";
const fullGuide = join(root, assetDirectory, "MyLearna-What-Homeschool-Records-Should-You-Keep.pdf");
const starterKit = join(root, assetDirectory, "MyLearna-Homeschool-Record-Keeping-Starter-Kit.pdf");

function decodePdfLiteral(value: string) {
  return value
    .replace(/\\([\\()])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r");
}

async function extractPdfPages(filePath: string) {
  const document = await PDFDocument.load(readFileSync(filePath));
  const pages: string[] = [];

  for (const page of document.getPages()) {
    const text: string[] = [];
    const contentsReference = page.node.get(PDFName.of("Contents"));
    if (!contentsReference) { pages.push(""); continue; }
    const stream = document.context.lookup(contentsReference) as { contents?: Uint8Array };
    if (!stream.contents) { pages.push(""); continue; }

    let bytes = stream.contents;
    try {
      bytes = inflateSync(bytes);
    } catch {
      // Uncompressed PDF content is valid and needs no further processing.
    }

    const raw = Buffer.from(bytes).toString("latin1");
    for (const match of raw.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)) {
      text.push(decodePdfLiteral(match[1]));
    }
    pages.push(text.join(" ").replace(/\s+/g, " "));
  }

  return pages;
}

async function extractPdfText(filePath: string) {
  return (await extractPdfPages(filePath)).join(" ").replace(/\s+/g, " ");
}

describe("record-keeping publication PDF assets", () => {
  it("publishes valid canonical PDF assets without editorial placeholders", async () => {
    expect(existsSync(fullGuide)).toBe(true);
    expect(existsSync(starterKit)).toBe(true);

    const guideDocument = await PDFDocument.load(readFileSync(fullGuide));
    const starterDocument = await PDFDocument.load(readFileSync(starterKit));
    expect(guideDocument.getPageCount()).toBe(7);
    expect(starterDocument.getPageCount()).toBe(2);
  });

  it("keeps the full guide publication-ready and U.S. English", async () => {
    const text = await extractPdfText(fullGuide);
    const rawPdf = readFileSync(fullGuide).toString("latin1");
    expect(text).toContain("What Homeschool Records Should You Keep?");
    expect(text).toContain("A Practical Guide for U.S. Families");
    expect(text).toContain("Keep the story, not the pile");
    for (const term of ["Administrative", "Evidence", "Context", "Progress", "Today", "Capture", "Portfolio", "Report", "Emma Carter", "August 9, 2026"]) {
      expect(text).toContain(term);
    }
    for (const footerTerm of ["MyLearna | Homeschool Answers", "General educational information only - not legal advice.", "Page"]) {
      expect(text).toContain(footerTerm);
    }
    expect(text).not.toContain("Fictional demonstration learning record");
    expect(text).not.toMatch(/PRODUCTION IMAGE SLOT|Insert the production|Insert Emma Capture|editorial production|programme|organise|organised|standardised|maths|labelled|unlabelled|artefact|9 August 2026/i);
    const stateIntroduction = "These examples are not complete legal summaries. Verify current guidance directly.";
    expect(text.split(stateIntroduction).length - 1).toBe(1);
    expect(rawPdf).toContain("/URI");
    for (const domain of ["nysed.gov", "fldoe.org", "flsenate.gov", "pa.gov", "legis.state.pa.us", "tea.texas.gov"]) {
      expect(rawPdf).toContain(domain);
    }

    const pages = await extractPdfPages(fullGuide);
    expect(pages.every((page) => page.length > 40)).toBe(true);
    const evidencePage = pages.findIndex((page) => page.includes("What counts as homeschool learning evidence"));
    const statePage = pages.findIndex((page) => page.includes("Four state examples"));
    expect(evidencePage).toBeGreaterThanOrEqual(0);
    expect(
      pages[evidencePage].includes("Math lesson") ||
      pages.some((page) => page.includes("Learning experience") && page.includes("Math lesson")),
    ).toBe(true);
    expect(statePage).toBeGreaterThanOrEqual(0);
    expect(pages[statePage]).toContain("New York");
  });

  it("keeps the starter kit concise, useful and U.S. English", async () => {
    const text = await extractPdfText(starterKit);
    for (const term of ["HOMESCHOOL RECORD-KEEPING STARTER KIT", "Keep the story, not the pile", "Administrative", "Evidence", "Context", "Progress", "15-minute weekly routine"]) {
      expect(text).toContain(term);
    }
    for (const footerTerm of ["MyLearna | Homeschool Answers", "General educational information only - not legal advice.", "Page"]) {
      expect(text).toContain(footerTerm);
    }
    expect(text).not.toContain("Fictional demonstration learning record");
    expect(text).not.toMatch(/PRODUCTION IMAGE SLOT|Insert the production|Insert Emma Capture|editorial production|programme|organise|organised|standardised|maths|labelled|unlabelled|artefact|9 August 2026/i);
  });
});
