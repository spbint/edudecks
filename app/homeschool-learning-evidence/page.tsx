import type { Metadata } from "next";
import PublicSeoLandingPage from "@/app/components/PublicSeoLandingPage";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "What Counts as Homeschool Learning Evidence? | MyLearna",
  description:
    "Explore practical examples of homeschool learning evidence, including photos, notes, work samples, projects, conversations and real-world learning.",
  path: "/homeschool-learning-evidence",
});

export default function HomeschoolLearningEvidencePage() {
  return (
    <PublicSeoLandingPage
      title="What Counts as Homeschool Learning Evidence?"
      heroText="Learning evidence can be practical, ordinary and meaningful. MyLearna helps families notice, capture and organise evidence from real homeschool life."
      badges={["Photos", "Notes", "Work samples", "Real-world learning"]}
      ctaHref="/start-free?source=seo-learning-evidence"
      sections={[
        {
          title: "Photos",
          text: "A photo can capture a project, experiment, practical task, artwork, outing or completed activity when paired with a short note.",
        },
        {
          title: "Notes",
          text: "A brief parent note can record what happened, what support was needed, what changed and what might come next.",
        },
        {
          title: "Work samples",
          text: "Writing, maths, drawings, research, worksheets and project work can show skills, progress and effort over time.",
        },
        {
          title: "Projects",
          text: "Longer projects can show planning, persistence, research, problem solving and communication across several learning areas.",
        },
        {
          title: "Conversations",
          text: "A thoughtful discussion can demonstrate understanding, vocabulary, reasoning and curiosity even when there is no formal worksheet.",
        },
        {
          title: "Reading logs",
          text: "Reading records can show stamina, interests, comprehension and the growth of independent learning habits.",
        },
        {
          title: "Real-world learning",
          text: "Cooking, shopping, budgeting, gardening, travel, repairs and community activities can all create meaningful learning evidence.",
        },
        {
          title: "Maths worksheets as evidence",
          text: "A completed maths worksheet can become stronger evidence when it is connected to a skill, parent observation or learning goal.",
        },
      ]}
      relatedLinks={[
        { href: "/homeschool-maths-worksheets", label: "Maths worksheets" },
        { href: "/homeschool-record-keeping", label: "Record keeping" },
        { href: "/homeschool-portfolio", label: "Portfolio support" },
        { href: "/faq", label: "FAQ" },
      ]}
    />
  );
}
