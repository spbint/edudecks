import type { Metadata } from "next";
import PublicSeoLandingPage from "@/app/components/PublicSeoLandingPage";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Homeschool Planning Made Simpler | MyLearna",
  description:
    "Plan homeschool weeks with more clarity using MyLearna's flexible planning, calendar and learning flow tools.",
  path: "/homeschool-planning",
});

export default function HomeschoolPlanningPage() {
  return (
    <PublicSeoLandingPage
      title="Homeschool Planning Made Simpler"
      heroText="MyLearna helps families shape a clear homeschool week while leaving room for real life, flexible routines and learning that changes as children grow."
      badges={["Weekly planning", "Flexible routines", "Learning goals", "Connected records"]}
      ctaHref="/start-free?source=seo-homeschool-planning"
      sections={[
        {
          title: "Weekly planning",
          text: "Plan the week around subjects, routines, projects, appointments and family rhythm instead of rebuilding everything from scratch.",
        },
        {
          title: "Flexible routines",
          text: "A useful plan should support the week, not punish families when life changes. MyLearna is built around calm adjustment.",
        },
        {
          title: "Learning goals",
          text: "Families can keep goals visible so daily learning has a clearer purpose without becoming a rigid school timetable.",
        },
        {
          title: "My Day and My Calendar",
          text: "The planning flow connects the wider calendar to daily learning so parents can see what is planned and what actually happened.",
        },
        {
          title: "Planning that connects to records later",
          text: "A plan becomes more useful when notes, evidence, portfolios and reports can connect back to it over time.",
        },
      ]}
      relatedLinks={[
        { href: "/homeschool-record-keeping", label: "Record keeping" },
        { href: "/homeschool-reporting", label: "Reporting support" },
        { href: "/homeschool-learning-evidence", label: "Learning evidence" },
        { href: "/faq", label: "FAQ" },
      ]}
    />
  );
}
