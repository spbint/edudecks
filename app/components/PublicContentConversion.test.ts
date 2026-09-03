import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

const recordKeeping = read("app/homeschool-record-keeping/page.tsx");
const portfolio = read("app/homeschool-portfolio/page.tsx");
const reporting = read("app/homeschool-reporting/page.tsx");
const seoLanding = read("app/components/PublicSeoLandingPage.tsx");

describe("public content conversion paths", () => {
  it("preserves the record-keeping guide's tracked demo and signup handoffs", () => {
    expect(recordKeeping).toContain('href={DEMO_URL} eventName="public_demo_started"');
    expect(recordKeeping).toContain('href={SIGNUP_URL} eventName="public_signup_started"');
    expect(recordKeeping).toContain("Explore MyLearna and the Carter Family demo");
    expect(recordKeeping).toContain("/demo?source=answer-record-keeping-emma");
  });

  it("lets SEO landing pages expose a page-specific demo alongside signup", () => {
    expect(seoLanding).toContain("demoHref?: string");
    expect(seoLanding).toContain('demoLabel = "See how learning becomes a report"');
    expect(seoLanding).toContain("secondaryCta={secondaryCta}");
    expect(seoLanding).toContain("footerSecondaryCta={footerSecondaryCta}");
    expect(seoLanding).toContain("{demoHref ? (");
  });

  it("gives the portfolio page strong free-family and Carter-demo actions", () => {
    expect(portfolio).toContain('ctaLabel="Create your free family space"');
    expect(portfolio).toContain('ctaHref="/start-free?source=homeschool-portfolio-family-space"');
    expect(portfolio).toContain('demoLabel="See how learning becomes a report"');
    expect(portfolio).toContain('demoHref="/demo?source=homeschool-portfolio-demo"');
  });

  it("gives the reporting page strong free-family and Carter-demo actions", () => {
    expect(reporting).toContain('ctaLabel="Create your free family space"');
    expect(reporting).toContain('ctaHref="/start-free?source=homeschool-reporting-family-space"');
    expect(reporting).toContain('demoLabel="See how learning becomes a report"');
    expect(reporting).toContain('demoHref="/demo?source=homeschool-reporting-demo"');
  });

  it("does not introduce pricing or paid-tier language into these conversion paths", () => {
    expect(`${recordKeeping}\n${portfolio}\n${reporting}`).not.toMatch(/premium|upgrade|paid tier|subscription required/i);
  });
});
