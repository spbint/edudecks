import type { Metadata } from "next";
import PublicSeoLandingPage from "@/app/components/PublicSeoLandingPage";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Homeschool Reporting Support | MyLearna",
  description:
    "Prepare clearer homeschool records, summaries and reports by connecting planning, evidence, portfolios and learning notes in MyLearna.",
  path: "/homeschool-reporting",
});

export default function HomeschoolReportingPage() {
  return (
    <PublicSeoLandingPage
      title="Homeschool Reporting Support for Families"
      heroText="MyLearna helps families prepare clearer homeschool records and summaries by connecting planning, evidence, portfolios and learning notes."
      badges={["Reporting support", "Evidence", "Portfolio prep", "Clearer summaries"]}
      ctaHref="/beta?source=seo-homeschool-reporting"
      sections={[
        {
          title: "Planning ahead for reporting",
          text: "Reporting is easier when the year has a visible learning trail instead of a last-minute collection of scattered notes.",
        },
        {
          title: "Capturing evidence during the year",
          text: "Short notes, work samples, photos and observations can help families explain what learning looked like over time.",
        },
        {
          title: "Portfolio and report preparation",
          text: "Selected portfolio evidence can support a clearer report because it connects examples of work to learning areas and progress.",
        },
        {
          title: "Making learning easier to explain",
          text: "MyLearna helps organise the story of learning. Homeschool requirements vary by location, so families should always check their local rules.",
        },
      ]}
      relatedLinks={[
        { href: "/homeschool-record-keeping", label: "Record keeping" },
        { href: "/homeschool-learning-evidence", label: "Learning evidence" },
        { href: "/homeschool-portfolio", label: "Portfolio support" },
        { href: "/faq", label: "FAQ" },
      ]}
    />
  );
}
