import type { Metadata } from "next";
import Link from "next/link";
import PublicResourceLink from "@/app/components/PublicResourceLink";
import PublicResourceViewTracker from "@/app/components/PublicResourceViewTracker";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { buildPublicMetadata, PUBLIC_OG_IMAGE_URL, PUBLIC_SITE_URL } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "What Homeschool Records Should You Keep? | MyLearna",
  description:
    "A practical U.S. homeschool record-keeping guide covering what to keep, what to skip, learning evidence, portfolios, reports and a simple weekly routine.",
  path: "/homeschool-record-keeping",
});

const GUIDE_URL = "/resources/homeschool-answers/record-keeping/MyLearna-What-Homeschool-Records-Should-You-Keep.pdf";
const STARTER_KIT_URL = "/resources/homeschool-answers/record-keeping/MyLearna-Homeschool-Record-Keeping-Starter-Kit.pdf";
const DEMO_URL = "/demo?source=answer-record-keeping";
const EMMA_DEMO_URL = "/demo?source=answer-record-keeping-emma";
const SIGNUP_URL = "/start-free?source=answer-record-keeping";

const fourLayers = [
  ["Administrative", "Shows required participation or formal process", "Attendance, hours, notices, required forms, evaluator documents", "What did we need to file or retain?"],
  ["Evidence", "Shows the learning activity or product", "Writing, math, photos, projects, reading logs, recordings, assessments", "What can we point to?"],
  ["Context", "Explains what happened and what support was used", "Date, learning area, goal, parent note, resources, conditions", "What does this evidence mean?"],
  ["Progress", "Shows change across time", "Reflection, observation, early/later comparison, next step, periodic summary", "How is the learner changing?"],
] as const;

const recordsWorthKeeping = [
  ["Official and administrative records", "Keep records your state, district, umbrella school, program or evaluator requires. Depending on your situation, that may include notices, attendance or hours, education plans, quarterly reports, annual evaluations, standardized test results, district correspondence and high-school records. Keep proof of submission where practical."],
  ["A simple plan and a record of reality", "A plan shows intention. A record shows reality. Keep broad goals, learning periods and weekly priorities, then record what was completed, what changed, missed work, extra practice and unexpected interests."],
  ["Representative work samples", "Keep work that shows something important, not every piece of practice: an early and later writing sample, a math strategy, a science notebook page, a research product, artwork showing a new technique or a corrected task that shows change after feedback."],
  ["Photographs and short recordings", "Photographs can document cooking, gardening, building, field trips, nature study, performances and practical skills. Add three short details: what happened, what it showed and what might come next."],
  ["Reading and resource records", "Track books, audiobooks, articles, documentaries, lectures, podcasts and project sources. Add a note when the learner makes a significant connection or demonstrates comprehension."],
  ["Parent observations and learner reflections", "Record support needed, strategies selected, increasing independence, misconceptions, connections, learner comments and next steps. “Needed one reminder to organize the data table” is more useful than “Good job.”"],
  ["Assessments and periodic summaries", "Keep required assessment/evaluation documents and anything submitted. Short periodic summaries can explain learning areas, representative evidence, progress and next priorities while the details are fresh."],
  ["Supports and accommodations", "Where relevant, record supports that changed the outcome: shorter sessions, audio text, movement breaks, visual models, assistive technology, reduced writing load or repeated practice."],
] as const;

const evidenceExamples = [
  ["Math lesson", "Selected worksheet, whiteboard photo, model or explanation", "Strategy, support, misconception or next step"],
  ["Cooking", "Photo, recipe changes, calculations or reflection", "Measurement, ratios, sequencing, safety and independence"],
  ["Museum or field trip", "Photo, sketch, ticket plus learner response", "Question asked, concept connected and follow-up learning"],
  ["Reading or audiobook", "Reading log, narration or response", "Comprehension, vocabulary, stamina and interpretation"],
  ["Conversation", "Parent note or learner quotation", "Reasoning, vocabulary, prior knowledge and curiosity"],
  ["Project or interest-led study", "Plan, research notes, drafts, product and reflection", "Planning, problem solving, persistence and transfer"],
  ["Oral presentation", "Audio/video clip, rubric, observation or reflection", "Fluency, expression, confidence and communication"],
  ["Practical skill", "Photo sequence, checklist or demonstration note", "Accuracy, safety, independence and improvement"],
] as const;

const stateExamples = [
  ["New York", "IHIP, quarterly reports, annual assessment and attendance-record expectations.", "New York State Education Department - Home Instruction Questions and Answers", "https://www.nysed.gov/nonpublic-schools/home-instruction-questions-and-answers"],
  ["Florida", "Contemporaneous activity log, selected work samples, two-year portfolio retention and annual evaluation.", "Florida Department of Education - Parent Home Education Resources", "https://www.fldoe.org/schools/school-choice/home-edu/parent-resources.stml"],
  ["Pennsylvania", "Contemporaneous reading-material log, work samples, specified testing and annual evaluator certification.", "Pennsylvania Department of Education - Home Education and Private Tutoring", "https://www.pa.gov/agencies/education/programs-and-services/instruction/elementary-and-secondary-education/home-education-and-private-tutoring"],
  ["Texas", "TEA does not regulate or accredit home schools; receiving districts may review records, curriculum or assessments for placement or credit.", "Texas Education Agency - Home Schooling", "https://tea.texas.gov/families-and-students/finding-school-your-child/home-schooling"],
] as const;

const faqItems = [
  ["Do I need to save every worksheet?", "Usually no. Keep representative samples and anything specifically required by your state or program."],
  ["Can photos count as homeschool records?", "Yes. Add a date and a short explanation of what happened, what the learner demonstrated and what might come next."],
  ["How long should I keep homeschool records?", "Follow official retention rules. Keep core high-school transcripts, course information, evaluations and annual summaries much longer."],
  ["What if my state requires very little?", "Keep a simple annual record for your own planning and future transitions."],
  ["Are digital homeschool records acceptable?", "Many families use them, but formal submission requirements may vary. Keep readable exports and backups."],
  ["How often should I update records?", "Capture worthwhile evidence as it happens, review weekly and summarize at the end of a reporting period."],
  ["Does informal learning count?", "It can. Add enough context to explain the knowledge, skill, reasoning or independence involved."],
  ["What should I keep if my child may return to school?", "Keep annual summaries, resource information, representative work, assessments and older-student course or credit information."],
] as const;

const articleStructuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Homeschool Records Should You Keep?",
  description: "A practical U.S. homeschool record-keeping guide covering what to keep, what to skip, learning evidence, portfolios, reports and a simple weekly routine.",
  mainEntityOfPage: `${PUBLIC_SITE_URL}/homeschool-record-keeping`,
  datePublished: "2026-08-09",
  dateModified: "2026-08-09",
  author: { "@type": "Organization", name: "MyLearna", url: PUBLIC_SITE_URL },
  publisher: {
    "@type": "Organization",
    name: "MyLearna",
    url: PUBLIC_SITE_URL,
    logo: { "@type": "ImageObject", url: `${PUBLIC_SITE_URL}/branding/mylearna-logo.png` },
  },
  image: PUBLIC_OG_IMAGE_URL,
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: PUBLIC_SITE_URL },
    { "@type": "ListItem", position: 2, name: "Homeschool Answers", item: `${PUBLIC_SITE_URL}/homeschool-answers` },
    { "@type": "ListItem", position: 3, name: "What Homeschool Records Should You Keep?", item: `${PUBLIC_SITE_URL}/homeschool-record-keeping` },
  ],
};

const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" } as const;

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    background: "#ffffff",
    padding: 24,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  };
}

function buttonStyle(primary = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 12,
    padding: "10px 15px",
    border: `1px solid ${primary ? "#2563eb" : "#cbd5e1"}`,
    background: primary ? "#2563eb" : "#ffffff",
    color: primary ? "#ffffff" : "#1f2937",
    fontWeight: 750,
    fontSize: 14,
    textDecoration: "none",
  };
}

function ArticleSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ ...cardStyle(), marginBottom: 22, scrollMarginTop: 110 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 27, lineHeight: 1.18, color: "#0f172a" }}>{title}</h2>
      {children}
    </section>
  );
}

function IntroParagraph({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 14px", lineHeight: 1.75, color: "#334155", fontSize: 16 }}>{children}</p>;
}

export default function HomeschoolRecordKeepingPage() {
  return (
    <PublicSiteShell
      eyebrow="Homeschool Answers"
      heroTitle="What Homeschool Records Should You Keep?"
      heroText="A Practical Guide for U.S. Families"
      heroBadges={["Record keeping", "Evidence", "Portfolio", "Reports"]}
      primaryCta={{ label: "Explore MyLearna", href: DEMO_URL }}
      secondaryCta={{ label: "Download the Starter Kit", href: STARTER_KIT_URL }}
      asideTitle="Practical, source-backed guidance"
      asideText="Keep the story, not the pile. This guide explains a maintainable way to connect records, evidence, portfolios and reports."
      compactHero
    >
      <PublicResourceViewTracker context={{ resource_id: "homeschool-record-keeping" }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }} />

      <article>
        <header style={{ ...cardStyle(), marginBottom: 22, borderLeft: "4px solid #2563eb" }}>
          <p style={{ margin: "0 0 8px", color: "#64748b", fontWeight: 800, fontSize: 13 }}>Last reviewed: August 9, 2026</p>
          <p style={{ margin: 0, fontSize: 22, lineHeight: 1.45, fontWeight: 850, color: "#1e3a8a" }}>Keep the story, not the pile.</p>
          <p style={{ margin: "12px 0 0", lineHeight: 1.7, color: "#334155" }}>Good homeschool records do not preserve everything. They preserve enough to explain what was learned, how it happened and how the learner changed over time.</p>
        </header>

        <section id="quick-answer" style={{ ...cardStyle(), marginBottom: 22, scrollMarginTop: 110 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 27 }}>Quick answer</h2>
          <IntroParagraph>Most homeschool families benefit from keeping four kinds of records: documents their state requires; representative evidence such as work samples, photographs and projects; brief context explaining what happened and what support was needed; and evidence of progress over time.</IntroParagraph>
          <IntroParagraph><strong>You usually do not need to save every worksheet.</strong> Check your state&apos;s official rules first, then build the smallest useful system you can maintain consistently.</IntroParagraph>
          <div style={{ borderRadius: 14, padding: 16, background: "#fff7ed", border: "1px solid #fed7aa", color: "#7c2d12", lineHeight: 1.65 }}><strong>Important:</strong> This guide provides general educational information, not legal advice. Homeschool requirements vary by state and may change. Always check the current official guidance for your state and, where relevant, your local district or supervising organization.</div>
        </section>

        <nav aria-label="On this page" style={{ ...cardStyle(), marginBottom: 22, background: "#f8fafc" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 21 }}>On this page</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
            {[
              ["#four-layer-system", "Four-layer system"], ["#what-to-keep", "What to keep"], ["#what-to-skip", "What you can skip"], ["#learning-evidence", "Learning evidence"], ["#weekly-routine", "Weekly routine"], ["#portfolio-and-report", "Portfolio and Report"], ["#state-examples", "State examples"], ["#multiple-children", "Several children"], ["#catching-up", "Catching up"], ["#returning-to-school", "Returning to school"], ["#privacy", "Privacy"], ["#emma-carter", "Emma Carter example"], ["#frequently-asked-questions", "Frequently asked questions"], ["#official-sources", "Official sources"],
            ].map(([href, label]) => <a key={href} href={href} style={{ color: "#1d4ed8", fontWeight: 750, minHeight: 44, display: "inline-flex", alignItems: "center" }}>{label}</a>)}
          </div>
        </nav>

        <ArticleSection id="two-questions" title="Start with two different questions">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
            <div style={{ border: "1px solid #bfdbfe", borderRadius: 16, padding: 18, background: "#eff6ff" }}><h3 style={{ margin: "0 0 8px" }}>What must I keep?</h3><p style={{ margin: 0, lineHeight: 1.65, color: "#334155" }}>Documents, logs, portfolio items, assessments or reports required by the law or program that applies to your family.</p></div>
            <div style={{ border: "1px solid #ddd6fe", borderRadius: 16, padding: 18, background: "#f5f3ff" }}><h3 style={{ margin: "0 0 8px" }}>What is useful to keep?</h3><p style={{ margin: 0, lineHeight: 1.65, color: "#334155" }}>Evidence and context that help you understand progress, prepare a portfolio or report, support a future transition and remember the learning story.</p></div>
          </div>
          <blockquote style={{ margin: "18px 0 0", padding: "12px 16px", borderLeft: "3px solid #94a3b8", color: "#475569", lineHeight: 1.65 }}>First principle: Check current official requirements for your state. Then design the smallest useful system you can maintain consistently.</blockquote>
        </ArticleSection>

        <ArticleSection id="four-layer-system" title="The four-layer homeschool record system">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
            {fourLayers.map(([name, purpose, examples, question], index) => <div key={name} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, background: "#ffffff" }}><div style={{ color: "#2563eb", fontWeight: 900, fontSize: 13 }}>Layer {index + 1}</div><h3 style={{ margin: "6px 0 8px" }}>{name}</h3><p style={{ margin: "0 0 8px", color: "#334155", lineHeight: 1.6 }}>{purpose}</p><p style={{ margin: "0 0 8px", color: "#64748b", lineHeight: 1.55, fontSize: 14 }}><strong>Examples:</strong> {examples}</p><p style={{ margin: 0, color: "#1e3a8a", fontWeight: 750, lineHeight: 1.5 }}>{question}</p></div>)}
          </div>
          <blockquote style={{ margin: "18px 0 0", padding: "12px 16px", borderLeft: "3px solid #94a3b8", color: "#475569", lineHeight: 1.65 }}>The key distinction: An activity is something the learner did. Evidence is the part worth preserving. A portfolio is the curated selection. A report explains the learning story the evidence supports.</blockquote>
        </ArticleSection>

        <ArticleSection id="what-to-keep" title="What records are worth keeping?">
          <div style={{ display: "grid", gap: 12 }}>{recordsWorthKeeping.map(([title, text], index) => <div key={title} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, padding: "14px 0", borderBottom: "1px solid #e2e8f0" }}><h3 style={{ margin: 0, fontSize: 17 }}>{index + 1}. {title}</h3><p style={{ margin: 0, lineHeight: 1.7, color: "#334155" }}>{text}</p></div>)}</div>
          <blockquote style={{ margin: "18px 0 0", padding: "12px 16px", borderLeft: "3px solid #2563eb", background: "#eff6ff", color: "#1e3a8a", lineHeight: 1.65 }}>Record reality: A flexible record should not punish the family because Thursday did not look like the plan written on Sunday.</blockquote>
        </ArticleSection>

        <ArticleSection id="what-to-skip" title="What families can usually stop keeping">
          <IntroParagraph>Unless a specific rule says otherwise, you usually do not need every worksheet, several samples that show the same thing, every project photo, unlabeled screenshots, busywork, duplicate paper/digital copies or private notes that do not belong in a shareable record.</IntroParagraph>
          <div style={{ padding: 18, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", lineHeight: 1.7, color: "#334155" }}><strong>The three-question filter:</strong> Does this show something important? Does it add new information? Would future-you understand it without relying on memory?</div>
        </ArticleSection>

        <ArticleSection id="learning-evidence" title="What counts as homeschool learning evidence?">
          <IntroParagraph>Evidence is broader than worksheets. The useful question is not “Does this look like school?” It is “What does this help us understand about the learner?”</IntroParagraph>
          <div style={{ display: "grid", gap: 10 }}>{evidenceExamples.map(([experience, evidence, context]) => <div key={experience} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, padding: 14, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}><strong>{experience}</strong><span style={{ color: "#334155", lineHeight: 1.55 }}>{evidence}</span><span style={{ color: "#64748b", lineHeight: 1.55 }}>{context}</span></div>)}</div>
        </ArticleSection>

        <ArticleSection id="weekly-routine" title="A 15-minute weekly record-keeping routine">
          <ol style={{ margin: 0, paddingLeft: 24, display: "grid", gap: 12, color: "#334155", lineHeight: 1.65 }}><li><strong>During the week:</strong> capture only worthwhile moments.</li><li><strong>Friday — 10 minutes:</strong> add context; remove duplicates and low-value clutter.</li><li><strong>Friday — 5 minutes:</strong> mark possible Portfolio items and one next step.</li><li><strong>Monthly:</strong> check that important learning areas are visible.</li><li><strong>Term or quarter:</strong> select progress evidence and create a short summary.</li></ol>
        </ArticleSection>

        <ArticleSection id="portfolio-and-report" title="How records become a Portfolio and Report">
          <IntroParagraph>Record: capture the activity, evidence and context. Review: decide whether the item adds useful information. Portfolio: select representative evidence that shows breadth, achievement or progress. Report: explain the learning story supported by those records and Portfolio selections.</IntroParagraph>
          <div aria-label="Today to Report workflow" style={{ margin: "18px 0" }}>
            <div style={{ fontWeight: 900, color: "#1e3a8a", marginBottom: 10 }}>Today → Capture → Portfolio → Report</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>{[["Today", "Record the activity, evidence and context."], ["Capture", "Review what adds useful information."], ["Portfolio", "Select representative evidence."], ["Report", "Explain the supported learning story."]].map(([title, text], index) => <div key={title} style={{ borderRadius: 14, padding: 15, border: "1px solid #bfdbfe", background: index % 2 === 0 ? "#eff6ff" : "#f5f3ff" }}><div style={{ fontWeight: 900, color: "#1d4ed8", marginBottom: 6 }}>{title}</div><div style={{ color: "#334155", lineHeight: 1.5, fontSize: 14 }}>{text}</div></div>)}</div>
          </div>
          <blockquote style={{ margin: "18px 0", padding: "12px 16px", borderLeft: "3px solid #94a3b8", color: "#475569", lineHeight: 1.65 }}>When records are created gradually, a Portfolio and Report become outputs of learning — not an end-of-year reconstruction project.</blockquote>
          <Link href={DEMO_URL} style={buttonStyle(true)}>See Emma&apos;s learning go from Today to Report</Link>
        </ArticleSection>

        <ArticleSection id="state-examples" title="Four state examples">
          <IntroParagraph>These examples are not complete legal summaries. Verify current guidance directly.</IntroParagraph>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>{stateExamples.map(([state, text, source, href]) => <div key={state} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16 }}><h3 style={{ margin: "0 0 8px" }}>{state}</h3><p style={{ margin: "0 0 12px", color: "#334155", lineHeight: 1.6 }}>{text}</p><a href={href} {...externalLinkProps} style={{ color: "#1d4ed8", fontWeight: 750, lineHeight: 1.5 }}>{source}</a></div>)}</div>
        </ArticleSection>

        <section id="related-resources" style={{ ...cardStyle(), marginBottom: 22, scrollMarginTop: 110 }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 24 }}>Explore related MyLearna resources</h2>
          <p style={{ margin: "0 0 14px", lineHeight: 1.7, color: "#475569" }}>Continue from record keeping into the connected learning story.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/homeschool-learning-evidence" style={buttonStyle(false)}>Learning evidence</Link>
            <Link href="/homeschool-portfolio" style={buttonStyle(false)}>Homeschool portfolios</Link>
            <Link href="/homeschool-reporting" style={buttonStyle(false)}>Homeschool reporting</Link>
            <Link href="/homeschool-answers" style={buttonStyle(false)}>Homeschool Answers hub</Link>
          </div>
        </section>

        <ArticleSection id="multiple-children" title="Keeping records for several children"><IntroParagraph>Use one family system and distinct learner records. Share the family calendar, outings and projects; keep each learner&apos;s work samples, observations, assessments, Portfolio choices and Reports separate.</IntroParagraph></ArticleSection>
        <ArticleSection id="catching-up" title="If the family is already months behind"><IntroParagraph>Start today. Gather anchors such as calendar entries, photos, messages, book lists, projects and assessments. Create broad monthly summaries using only what you can support. Select representative evidence and label uncertainty honestly.</IntroParagraph></ArticleSection>
        <ArticleSection id="returning-to-school" title="If the learner may return to school"><IntroParagraph>Keep annual summaries, curriculum and resource lists, representative work, evaluations, assessments and, for older learners, course and credit information. Ask the receiving school what it uses for placement or credit.</IntroParagraph></ArticleSection>
        <ArticleSection id="privacy" title="Privacy and record security"><IntroParagraph>Keep records private by default, avoid unnecessary sensitive details in shareable documents, use secure accounts and backups, review public-share settings and choose tools that do not require child learning content to be used for advertising analytics.</IntroParagraph></ArticleSection>

        <ArticleSection id="emma-carter" title="What this looks like in practice: Emma Carter">
          <div style={{ borderRadius: 18, padding: 20, background: "linear-gradient(135deg,#eff6ff,#f5f3ff)", border: "1px solid #bfdbfe" }}><p style={{ margin: "0 0 12px", lineHeight: 1.7, color: "#334155" }}><strong>Emma Carter is fictional.</strong> In the public MyLearna demo, her activity moves through <strong>Today → Capture → Progress and context → Portfolio → Report</strong> so families can see the complete workflow without creating an account.</p><p style={{ margin: "0 0 14px", lineHeight: 1.7, color: "#334155" }}>The value does not come merely from storing a worksheet. It comes from connecting the activity, evidence, date and learning area, observation, progress judgment, Portfolio selection and final report.</p><Link href={EMMA_DEMO_URL} style={buttonStyle(true)}>Explore MyLearna and the Carter Family demo</Link></div>
        </ArticleSection>

        <ArticleSection id="frequently-asked-questions" title="Frequently asked questions">
          <div style={{ display: "grid", gap: 12 }}>{faqItems.map(([question, answer]) => <details key={question} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "13px 16px", background: "#f8fafc" }}><summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontWeight: 800 }}>{question}</summary><p style={{ margin: "10px 0 2px", color: "#334155", lineHeight: 1.65 }}>{answer}</p></details>)}</div>
        </ArticleSection>

        <section id="downloads" style={{ ...cardStyle(), marginBottom: 22, background: "linear-gradient(135deg,#eff6ff,#f5f3ff)", scrollMarginTop: 110 }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 27 }}>Download the practical tools</h2>
          <IntroParagraph>Both resources are ungated PDF companions. No email is required.</IntroParagraph>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
            <div style={{ borderRadius: 16, padding: 18, background: "#ffffff", border: "1px solid #bfdbfe" }}><h3 style={{ margin: "0 0 8px" }}>Homeschool Record-Keeping Starter Kit</h3><p style={{ margin: "0 0 14px", lineHeight: 1.6, color: "#475569" }}>A concise two-page tool containing the four record layers, Keep / Usually Skip checklist, weekly review routine, evidence prompts, Portfolio checks and report-readiness checks.</p><PublicResourceLink href={STARTER_KIT_URL} download="MyLearna-Homeschool-Record-Keeping-Starter-Kit.pdf" eventName="public_resource_downloaded" context={{ resource_id: "homeschool-record-keeping", resource_asset: "starter-kit" }} style={buttonStyle(true)}>Download Starter Kit <span aria-hidden="true">(PDF)</span></PublicResourceLink></div>
            <div style={{ borderRadius: 16, padding: 18, background: "#ffffff", border: "1px solid #ddd6fe" }}><h3 style={{ margin: "0 0 8px" }}>Full Record-Keeping Guide PDF</h3><p style={{ margin: "0 0 14px", lineHeight: 1.6, color: "#475569" }}>The complete practical guide for deciding what to keep, what to skip and how records become useful evidence, portfolios and reports.</p><PublicResourceLink href={GUIDE_URL} download="MyLearna-What-Homeschool-Records-Should-You-Keep.pdf" eventName="public_resource_downloaded" context={{ resource_id: "homeschool-record-keeping", resource_asset: "full-guide" }} style={buttonStyle(false)}>Download Full Guide <span aria-hidden="true">(PDF)</span></PublicResourceLink></div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <PublicResourceLink href={DEMO_URL} eventName="public_demo_started" context={{ resource_id: "homeschool-record-keeping" }} style={buttonStyle(true)}>Explore MyLearna</PublicResourceLink>
            <PublicResourceLink href={SIGNUP_URL} eventName="public_signup_started" context={{ resource_id: "homeschool-record-keeping" }} style={buttonStyle(false)}>Create your family space</PublicResourceLink>
          </div>
        </section>

        <ArticleSection id="official-sources" title="Official sources"><IntroParagraph>Use these official sources to check current requirements. MyLearna does not guarantee compliance and is not a legal authority.</IntroParagraph><ul style={{ margin: 0, paddingLeft: 22, display: "grid", gap: 10, lineHeight: 1.6 }}>{[
          ["New York State Education Department - Home Instruction Questions and Answers", "https://www.nysed.gov/nonpublic-schools/home-instruction-questions-and-answers"], ["Florida Department of Education - Parent Home Education Resources", "https://www.fldoe.org/schools/school-choice/home-edu/parent-resources.stml"], ["Florida Senate - Section 1002.41", "https://www.flsenate.gov/Laws/Statutes/2024/1002.41"], ["Pennsylvania Department of Education - Home Education and Private Tutoring", "https://www.pa.gov/agencies/education/programs-and-services/instruction/elementary-and-secondary-education/home-education-and-private-tutoring"], ["Pennsylvania General Assembly - Section 1327.1", "https://www.legis.state.pa.us/WU01/LI/LI/US/HTM/1949/0/0014.013.000.027.001..HTM"], ["Texas Education Agency - Home Schooling", "https://tea.texas.gov/families-and-students/finding-school-your-child/home-schooling"], ["Texas Education Agency - Enrollment in Public School", "https://tea.texas.gov/about-tea/contact-us/general-inquiry/enrollment-public-school"],
        ].map(([label, href]) => <li key={href}><a href={href} {...externalLinkProps} style={{ color: "#1d4ed8", fontWeight: 750 }}>{label}</a></li>)}</ul></ArticleSection>

        <section id="final-next-action" style={{ ...cardStyle(), marginBottom: 22, textAlign: "center", background: "#0f172a", color: "#ffffff", scrollMarginTop: 110 }}><h2 style={{ margin: "0 0 10px", fontSize: 28, color: "#ffffff" }}>Start with one useful record today</h2><p style={{ margin: "0 auto 18px", maxWidth: 650, lineHeight: 1.7, color: "#cbd5e1" }}>Save one worthwhile learning moment. Add two sentences of context and one sign of progress.</p><div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}><PublicResourceLink href={DEMO_URL} eventName="public_demo_started" context={{ resource_id: "homeschool-record-keeping" }} style={{ ...buttonStyle(true), background: "#ffffff", color: "#1d4ed8" }}>See Emma&apos;s learning go from Today to Report</PublicResourceLink><PublicResourceLink href={SIGNUP_URL} eventName="public_signup_started" context={{ resource_id: "homeschool-record-keeping" }} style={{ ...buttonStyle(false), background: "transparent", borderColor: "#94a3b8", color: "#ffffff" }}>Create your family space</PublicResourceLink></div></section>
      </article>
    </PublicSiteShell>
  );
}
