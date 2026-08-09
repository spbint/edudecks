import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");

describe("homeschool record-keeping authority resource", () => {
  const page = read("app/homeschool-record-keeping/page.tsx");
  const hub = read("app/homeschool-answers/page.tsx");

  it("is a server-rendered canonical resource with an immediate answer", () => {
    expect(page).not.toContain('"use client"');
    expect(page).toContain('path: "/homeschool-record-keeping"');
    expect(page).toContain("Most homeschool families benefit from keeping four kinds of records");
    expect(page).toContain("You usually do not need to save every worksheet.");
    expect(page).toContain("Keep the story, not the pile.");
    expect(page).toContain("not legal advice");
    expect(page).toContain("Administrative");
    expect(page).toContain("Evidence");
    expect(page).toContain("Context");
    expect(page).toContain("Progress");
  });

  it("contains the complete practical guide structure and visible FAQ", () => {
    for (const id of [
      "quick-answer", "four-layer-system", "what-to-keep", "what-to-skip",
      "learning-evidence", "weekly-routine", "portfolio-and-report", "state-examples",
      "multiple-children", "catching-up", "returning-to-school", "privacy", "emma-carter",
      "frequently-asked-questions", "official-sources",
    ]) expect(page).toContain(`id=\"${id}\"`);
    for (const question of [
      "Do I need to save every worksheet?", "Can photos count as homeschool records?",
      "How long should I keep homeschool records?", "What if my state requires very little?",
      "Are digital homeschool records acceptable?", "How often should I update records?",
      "Does informal learning count?", "What should I keep if my child may return to school?",
    ]) expect(page).toContain(question);
    expect(page).toContain("Emma Carter is fictional.");
    expect(page).toContain("Today → Capture → Progress and context → Portfolio → Report");
  });

  it("links the demo, ungated PDFs and official sources", () => {
    expect(page).toContain("/demo?source=answer-record-keeping");
    expect(page).toContain("/demo?source=answer-record-keeping-emma");
    expect(page).toContain("/homeschool-answers");
    expect(page).toContain("/homeschool-learning-evidence");
    expect(page).toContain("/homeschool-portfolio");
    expect(page).toContain("/homeschool-reporting");
    expect(page).toContain("MyLearna-Homeschool-Record-Keeping-Starter-Kit.pdf");
    expect(page).toContain("MyLearna-What-Homeschool-Records-Should-You-Keep.pdf");
    expect(page).toContain('download="MyLearna-Homeschool-Record-Keeping-Starter-Kit.pdf"');
    expect(page).toContain('download="MyLearna-What-Homeschool-Records-Should-You-Keep.pdf"');
    for (const source of ["nysed.gov", "fldoe.org", "flsenate.gov", "pa.gov", "legis.state.pa.us", "tea.texas.gov"]) expect(page).toContain(source);
    expect(existsSync(join(root, "public/resources/homeschool-answers/record-keeping/MyLearna-Homeschool-Record-Keeping-Starter-Kit.pdf"))).toBe(true);
    expect(existsSync(join(root, "public/resources/homeschool-answers/record-keeping/MyLearna-What-Homeschool-Records-Should-You-Keep.pdf"))).toBe(true);
  });

  it("publishes truthful Article and BreadcrumbList JSON-LD", () => {
    const articleData = page.slice(
      page.indexOf("const articleStructuredData"),
      page.indexOf("const breadcrumbStructuredData"),
    );
    expect(page).toContain('type="application/ld+json"');
    expect(page).toContain('"@type": "Article"');
    expect(page).toContain('"@type": "BreadcrumbList"');
    expect(page).toContain("PUBLIC_SITE_URL");
    expect(page).toContain("/homeschool-record-keeping");
    expect(articleData).not.toMatch(/aggregateRating|review|award|accreditation/i);
    expect(page).not.toContain("PRODUCTION IMAGE SLOT");
  });

  it("provides the initial resource hub", () => {
    expect(hub).toContain('path: "/homeschool-answers"');
    expect(hub).toContain("Homeschool Answers");
    expect(hub).toContain("Practical, source-backed answers");
    expect(hub).toContain('href={guideHref}');
    expect(hub).toContain("MyLearna-Homeschool-Record-Keeping-Starter-Kit.pdf");
  });

  it("keeps the authority resource in U.S. English", () => {
    expect(page).not.toMatch(/programme|organise|organised|standardised|maths|labelled|artefact/i);
  });

  it("keeps the global FAQ linked to the complete guide in present tense", () => {
    const faq = read("app/faq/page.tsx");
    expect(faq).toContain('category: "Record Keeping"');
    expect(faq).toContain("/homeschool-record-keeping");
    expect(faq).not.toContain("MyLearna is being designed for families");
  });
});
