import type { Metadata } from "next";
import PublicSeoLandingPage from "@/app/components/PublicSeoLandingPage";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Homeschool Portfolio Support | MyLearna",
  description:
    "Build a homeschool portfolio over time by capturing learning moments, work samples, reflections and parent notes with MyLearna.",
  path: "/homeschool-portfolio",
});

export default function HomeschoolPortfolioPage() {
  return (
    <PublicSeoLandingPage
      title="Build a Homeschool Portfolio Over Time"
      heroText="MyLearna helps families build a homeschool portfolio gradually from meaningful learning evidence, work samples, reflections and parent notes."
      badges={["Portfolio growth", "Work samples", "Reflections", "Parent notes"]}
      ctaHref="/start-free?source=homeschool-portfolio-family-space"
      ctaLabel="Create your free family space"
      demoHref="/demo?source=homeschool-portfolio-demo"
      demoLabel="See how learning becomes a report"
      sections={[
        {
          title: "Learning evidence",
          text: "Portfolio evidence can come from daily lessons, projects, conversations, worksheets, reading and real-world learning.",
        },
        {
          title: "Work samples",
          text: "A sample of writing, maths, art, science, research or practical work can show progress more clearly when paired with context.",
        },
        {
          title: "Reflections",
          text: "Short reflections help families remember what changed, what improved, and what the child noticed about their learning.",
        },
        {
          title: "Parent notes",
          text: "Parent observations can explain effort, independence, strategy use and growth that may not be obvious from the work sample alone.",
        },
        {
          title: "Portfolio growth over time",
          text: "A strong portfolio does not need to be built all at once. It grows from careful selections across the year.",
        },
      ]}
      relatedLinks={[
        { href: "/homeschool-learning-evidence", label: "Learning evidence" },
        { href: "/homeschool-record-keeping", label: "Record keeping" },
        { href: "/homeschool-reporting", label: "Reporting support" },
        { href: "/faq", label: "FAQ" },
      ]}
    />
  );
}
