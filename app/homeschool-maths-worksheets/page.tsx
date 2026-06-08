import type { Metadata } from "next";
import PublicSeoLandingPage from "@/app/components/PublicSeoLandingPage";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Homeschool Maths Worksheets | MyLearna",
  description:
    "Step-by-step homeschool maths worksheet previews from MyLearna, supporting practice, learning evidence, portfolios and reporting.",
  path: "/homeschool-maths-worksheets",
});

export default function HomeschoolMathsWorksheetsPage() {
  return (
    <PublicSeoLandingPage
      title="Homeschool Maths Worksheets"
      heroText="Explore how MyLearna supports step-by-step maths practice, parent observations and useful learning evidence without turning worksheets into busywork."
      badges={["Maths practice", "Learning evidence", "Portfolio-ready", "Parent notes"]}
      ctaHref="/start-free?source=seo-maths-worksheets"
      sections={[
        {
          title: "Step-by-step maths practice",
          text: "MyLearna maths resources are organised around a learning pathway so practice can feel more connected than a loose pile of worksheets.",
        },
        {
          title: "Fractions, decimals and percentages",
          text: "Families can build evidence around common upper primary topics such as fractions, decimals, percentages and equivalent representations.",
        },
        {
          title: "Multiplication, division and remainders",
          text: "Practice can support known facts, efficient strategies, grouping, arrays, division and interpreting remainders in context.",
        },
        {
          title: "Money, budgeting and real-world maths",
          text: "Real-world maths tasks help children connect number work to shopping, change, budgets and practical family contexts.",
        },
        {
          title: "Student learning checks",
          text: "A short maths task can show what a child understands, what needs revisiting, and what is ready to move into a portfolio note.",
        },
        {
          title: "Parent observation prompts",
          text: "Parent notes can add context: what was easy, what needed support, and what strategy the child used.",
        },
        {
          title: "Worksheets as learning evidence",
          text: "Completed maths work can become useful evidence when it is connected to a skill, observation or learning goal.",
        },
      ]}
      relatedLinks={[
        { href: "/homeschool-planning", label: "Homeschool planning" },
        { href: "/homeschool-learning-evidence", label: "Learning evidence" },
        { href: "/homeschool-portfolio", label: "Portfolio support" },
        { href: "/faq", label: "FAQ" },
      ]}
    />
  );
}
