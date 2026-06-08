import type { Metadata } from "next";
import PublicSeoLandingPage from "@/app/components/PublicSeoLandingPage";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Homeschool Record Keeping Made Easier | MyLearna",
  description:
    "MyLearna helps homeschool families organise learning records, notes, work samples and evidence without creating a second job.",
  path: "/homeschool-record-keeping",
});

export default function HomeschoolRecordKeepingPage() {
  return (
    <PublicSeoLandingPage
      title="Homeschool Record Keeping Made Easier"
      heroText="Keep homeschool records in a calmer flow by connecting learning notes, work samples, observations, portfolio choices and future reports."
      badges={["Simple records", "Work samples", "Parent notes", "Less scramble"]}
      ctaHref="/start-free?source=seo-record-keeping"
      sections={[
        {
          title: "Simple records",
          text: "Useful homeschool records can start with a short note about what happened, what was learned and what might come next.",
        },
        {
          title: "Photos, notes and work samples",
          text: "Evidence can include finished work, parent observations, projects, practical tasks, reading notes and other everyday learning.",
        },
        {
          title: "Avoiding the end-of-year scramble",
          text: "Small records gathered through the year are easier to shape than trying to remember everything when a report is due.",
        },
        {
          title: "Connecting records to portfolios and reports",
          text: "The same learning record can help parents choose portfolio evidence and explain progress later.",
        },
      ]}
      relatedLinks={[
        { href: "/homeschool-learning-evidence", label: "Learning evidence" },
        { href: "/homeschool-portfolio", label: "Portfolio support" },
        { href: "/homeschool-reporting", label: "Reporting support" },
        { href: "/faq", label: "FAQ" },
      ]}
    />
  );
}
