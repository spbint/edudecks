import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { buildPublicMetadata, PUBLIC_SITE_URL } from "@/app/lib/publicMetadata";

export const metadata: Metadata = {
  ...buildPublicMetadata({
    title: "How Do Children Actually Learn? A Homeschool Parent’s Guide | MyLearna",
    description: "A homeschool parent’s guide to how children learn, including Piaget, Vygotsky, play, explicit teaching, memory, motivation and educational philosophies.",
    path: "/learn/how-do-children-learn",
  }),
  authors: [{ name: "MyLearna" }],
  publisher: "MyLearna",
  openGraph: {
    ...buildPublicMetadata({
      title: "How Do Children Actually Learn? A Homeschool Parent’s Guide | MyLearna",
      description: "A homeschool parent’s guide to how children learn, including Piaget, Vygotsky, play, explicit teaching, memory, motivation and educational philosophies.",
      path: "/learn/how-do-children-learn",
    }).openGraph,
    type: "article",
    publishedTime: "2026-09-13",
    modifiedTime: "2026-09-13",
  },
};

const articleUrl = `${PUBLIC_SITE_URL}/learn/how-do-children-learn`;

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How Do Children Actually Learn? A Homeschool Parent’s Guide",
  description: "A homeschool parent’s guide to how children learn, including Piaget, Vygotsky, play, explicit teaching, memory, motivation and educational philosophies.",
  datePublished: "2026-09-13",
  dateModified: "2026-09-13",
  author: { "@type": "Organization", name: "MyLearna", url: PUBLIC_SITE_URL },
  publisher: { "@type": "Organization", name: "MyLearna", url: PUBLIC_SITE_URL },
  mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "MyLearna", item: PUBLIC_SITE_URL },
    { "@type": "ListItem", position: 2, name: "Learning Library", item: `${PUBLIC_SITE_URL}/learn` },
    { "@type": "ListItem", position: 3, name: "How Do Children Actually Learn?", item: articleUrl },
  ],
};

const sectionStyle: React.CSSProperties = { marginBottom: 30 };
const paragraphStyle: React.CSSProperties = { margin: "0 0 14px", color: "#334155", lineHeight: 1.78, fontSize: 16 };
const headingStyle: React.CSSProperties = { margin: "0 0 12px", color: "#17204b", fontSize: "clamp(24px,3vw,31px)", lineHeight: 1.2 };
const sourceLinkStyle: React.CSSProperties = { color: "#1d4ed8", textDecoration: "underline", textUnderlineOffset: 3 };

function ArticleSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return <section id={id} style={sectionStyle}><h2 style={headingStyle}>{title}</h2>{children}</section>;
}

function BulletList({ items }: { items: string[] }) {
  return <ul style={{ margin: "0 0 14px", paddingLeft: 24, color: "#334155", lineHeight: 1.75 }}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

export default function HowDoChildrenLearnPage() {
  return (
    <PublicSiteShell
      eyebrow="MyLearna Learning Library · Article 001"
      heroTitle="How Do Children Actually Learn?"
      heroText="A homeschool parent’s guide to learning science, educational thinkers, play, memory, motivation and teaching at home."
      heroBadges={["Foundations", "Learning science", "Homeschool perspective"]}
      primaryCta={{ label: "Explore the Learning Library", href: "/learn" }}
      secondaryCta={{ label: "Homeschool Answers", href: "/homeschool-answers" }}
      compactHero
    >
      <article>
        <nav aria-label="Breadcrumb" style={{ marginBottom: 20, color: "#64748b", fontSize: 14 }}><Link href="/learn" style={sourceLinkStyle}>Learning Library</Link><span aria-hidden="true"> / </span><span>How Do Children Actually Learn?</span></nav>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14 }}>Published September 13, 2026 · Updated September 13, 2026</p>

        <section style={{ border: "1px solid #bfdbfe", borderRadius: 20, padding: "22px 24px", marginBottom: 30, background: "#eff6ff" }} aria-label="Short answer">
          <p style={{ margin: "0 0 8px", color: "#1d4ed8", fontSize: 13, fontWeight: 850, letterSpacing: "0.05em", textTransform: "uppercase" }}>The short answer</p>
          <p style={{ margin: 0, color: "#17204b", fontSize: 19, lineHeight: 1.65, fontWeight: 650 }}>Children learn by connecting new information and experiences with what they already know, practising and retrieving knowledge, interacting with other people, receiving guidance and feedback, exploring ideas, solving problems, playing, observing and gradually becoming more able to direct their own learning.</p>
        </section>

        <ArticleSection title="How do children actually learn?">
          <p style={paragraphStyle}>If you homeschool, one of the most important questions you can ask is: <strong>How does my child actually learn?</strong></p>
          <p style={paragraphStyle}>Learning is not a single process. Children can understand something today and forget it tomorrow. They may struggle with an explanation at a desk but understand the same concept while cooking, building or playing. A child may memorise an answer without understanding it, or understand an idea deeply but struggle to explain it.</p>
          <p style={paragraphStyle}><strong>One of the advantages of homeschooling is the opportunity to notice how learning happens for the individual child in front of you.</strong></p>
        </ArticleSection>

        <ArticleSection id="how-learning-works" title="There is no single theory of learning">
          <p style={paragraphStyle}>When people talk about how children learn, they may be talking about very different kinds of ideas. Jean Piaget and Lev Vygotsky developed influential developmental theories. Maria Montessori, Reggio Emilia and Rudolf Steiner shaped educational philosophies. Classical education and Charlotte Mason are educational traditions, while unschooling is a broad approach to organising learning. Modern cognitive science asks detailed questions about memory, attention, knowledge and practice.</p>
          <p style={paragraphStyle}>These perspectives should not be flattened into one list of competing “learning styles”. The useful question is: <strong>What can each perspective teach us about the child we are helping to learn?</strong></p>
        </ArticleSection>

        <ArticleSection id="educational-thinkers" title="Children are active participants in learning">
          <p style={paragraphStyle}>Jean Piaget helped establish the idea that children actively make sense of the world rather than simply receiving information. They test ideas, notice patterns and adjust their understanding when experience does not fit what they expected.</p>
          <p style={paragraphStyle}>A child comparing containers in the bath may encounter volume and capacity long before those words appear in a lesson. A child building a shelter may meet measurement, geometry and the properties of materials through a real problem.</p>
          <p style={paragraphStyle}>Piaget’s stages are best treated as historical context, not rigid modern scientific boundaries. The broader insight remains useful: before teaching something new, find out what the child already thinks or knows.</p>
        </ArticleSection>

        <ArticleSection title="Children also learn through other people">
          <p style={paragraphStyle}>Lev Vygotsky emphasised the social nature of learning. His Zone of Proximal Development describes the space between what a child can do alone and what they can do with the right support.</p>
          <p style={paragraphStyle}>In a homeschool, that support might be a demonstration, a worked example, a hint, a question, a partially completed problem or an adult working alongside the child. As understanding grows, the support can be gradually removed. Scaffolding is not doing the work for a child; it is helping them take the next step until they can manage it more independently.</p>
          <p style={paragraphStyle}>The Harvard Center on the Developing Child’s explanation of <a href="https://developingchild.harvard.edu/key-concept/serve-and-return/" target="_blank" rel="noopener noreferrer" style={sourceLinkStyle}>serve and return</a> is a helpful reminder that responsive relationships are part of healthy development and learning.</p>
        </ArticleSection>

        <ArticleSection id="teaching-at-home" title="Sometimes children need to be explicitly taught">
          <p style={paragraphStyle}>There is no useful direct-instruction-versus-discovery binary. Some knowledge and skills benefit from clear teaching, modelling and guided practice. Alphabetic reading, mathematical notation, spelling patterns and historical chronology are examples where a well-timed explanation can make learning more accessible.</p>
          <p style={paragraphStyle}>At other times, a question, a resource or room to investigate may be the better support. The core question is: <strong>What does my child need from me at this point in the learning?</strong> Sometimes the answer is explanation. Sometimes it is modelling, practice, a question or independence.</p>
          <p style={paragraphStyle}>The <a href="https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation" target="_blank" rel="noopener noreferrer" style={sourceLinkStyle}>Education Endowment Foundation’s work on metacognition and self-regulation</a> offers useful evidence-informed guidance on making thinking and learning strategies more explicit.</p>
        </ArticleSection>

        <ArticleSection id="play-development" title="Play is learning too — but be precise">
          <p style={paragraphStyle}>Play matters, but it is not helpful to claim that every kind of play automatically produces academic learning. Free play is child-directed and open-ended. Guided play keeps the child’s agency while an adult or environment introduces a useful goal, language or possibility.</p>
          <p style={paragraphStyle}>Imagine a child creating a pretend shop. A parent might add signs, coins, price labels, scales, order forms and notebooks. The play remains child-owned, while the environment creates more opportunities for reading, writing, number, measurement and conversation. The <a href="https://educationendowmentfoundation.org.uk/early-years/toolkit/play-based-learning" target="_blank" rel="noopener noreferrer" style={sourceLinkStyle}>Education Endowment Foundation’s play-based learning summary</a> provides a useful starting point for thinking about this distinction.</p>
        </ArticleSection>

        <ArticleSection title="Knowledge matters">
          <p style={paragraphStyle}>Thinking depends partly on what we know. A child who knows something about plants has more to connect to when learning about photosynthesis. Historical understanding, mathematical knowledge and familiarity with literature all make future learning easier because new ideas have somewhere to attach.</p>
          <p style={paragraphStyle}>That is one reason rich homeschool experiences matter: books, conversation, museums, documentaries, experiments, nature walks, travel, projects and carefully sequenced teaching all build the background knowledge that supports later thinking.</p>
        </ArticleSection>

        <ArticleSection id="learning-science" title="Memory is not the enemy of understanding">
          <p style={paragraphStyle}>Memorisation and understanding are not opposites. Secure knowledge can reduce mental load, leaving more attention available for reasoning and application. Number facts, common words and foundational knowledge can become useful tools rather than barriers to creativity.</p>
          <p style={paragraphStyle}>Practice does not have to mean endless worksheets. It can include games, conversations, quizzes, reading, writing, projects and retrieval practice: bringing important knowledge back to mind so it becomes more available when needed.</p>
        </ArticleSection>

        <ArticleSection title="Children gradually learn how to learn">
          <p style={paragraphStyle}>Metacognition is a parent-friendly way of describing awareness of one’s own thinking and learning. Learners gradually begin asking:</p>
          <BulletList items={["Do I understand this?", "What strategy could I use?", "Where did I go wrong?", "Have I seen something like this before?", "What should I try next?"]} />
          <p style={paragraphStyle}>Self-regulation develops through support. Adults can model these questions, think aloud, offer choices and help a child reflect. Simply telling a child to become independent does not teach the tools independence requires.</p>
        </ArticleSection>

        <ArticleSection title="Motivation matters — but everything does not have to be fun">
          <p style={paragraphStyle}>Motivation is shaped by curiosity, competence, meaningful connection, persistence, task difficulty, prior knowledge, fatigue, autonomy and the experience of getting started. Sometimes interest follows competence.</p>
          <p style={paragraphStyle}>A child may dislike reading because decoding is exhausting, then begin enjoying books as reading becomes easier. <strong>Engagement is information.</strong> Instead of simply saying “they won’t do the work”, consider what the behaviour may be telling you about difficulty, tiredness, confusion, confidence or the kind of support needed.</p>
        </ArticleSection>

        <ArticleSection id="educational-philosophies" title="So which educational philosophy is right?">
          <p style={paragraphStyle}>Different traditions raise different useful questions. Montessori draws attention to prepared environments, purposeful activity and independence. Reggio Emilia highlights curiosity, relationships, expression and making learning visible. Steiner/Waldorf gives attention to imagination, rhythm and development. Classical education emphasises a broad sequence of knowledge and disciplined thinking. Charlotte Mason values living books, narration and attentive observation. Unschooling asks families to take children’s interests and agency seriously. Cognitive science contributes evidence about memory, attention, practice and knowledge.</p>
          <p style={paragraphStyle}><strong>You do not have to turn any one of these perspectives into your family’s complete identity. You are allowed to learn from all of them.</strong></p>
        </ArticleSection>

        <ArticleSection id="homeschool-approaches" title="There may be no single best way to learn">
          <p style={paragraphStyle}>Different learning goals may need different approaches. A child may benefit from explicit phonics, science exploration, literature discussion, deliberate maths practice and free personal projects. These approaches do not necessarily conflict.</p>
          <p style={paragraphStyle}><strong>What kind of learning is happening here, and what will help it move forward?</strong> That question is often more useful than asking which label should govern every part of the day.</p>
        </ArticleSection>

        <ArticleSection title="The opportunity homeschooling gives us">
          <p style={paragraphStyle}>Homeschooling gives parents an opportunity to watch learning closely, slow down, move ahead, follow unexpected questions, explicitly teach when needed and use books, play, conversation, projects and everyday life. It also creates room to adapt to the individual learner.</p>
          <p style={paragraphStyle}>The Learning Library will explore the thinkers, philosophies and research that shaped how we understand learning — from Piaget and Vygotsky to Montessori, Reggio, Steiner, Classical Education, Charlotte Mason, cognitive science, play, memory, motivation and more.</p>
          <p style={paragraphStyle}><strong>We will not ask which educational tribe you need to join.</strong> We will ask: what does this idea help us understand about children, learning and homeschooling?</p>
        </ArticleSection>

        <section style={{ ...sectionStyle, borderTop: "1px solid #e2e8f0", paddingTop: 26 }} aria-labelledby="sources-heading">
          <h2 id="sources-heading" style={headingStyle}>Sources &amp; Further Reading</h2>
          <ul style={{ margin: 0, paddingLeft: 24, color: "#334155", lineHeight: 1.8 }}>
            <li><a href="https://developingchild.harvard.edu/key-concept/serve-and-return/" target="_blank" rel="noopener noreferrer" style={sourceLinkStyle}>Harvard Center on the Developing Child — Serve and Return</a></li>
            <li><a href="https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation" target="_blank" rel="noopener noreferrer" style={sourceLinkStyle}>Education Endowment Foundation — Metacognition and Self-Regulation</a></li>
            <li><a href="https://educationendowmentfoundation.org.uk/early-years/toolkit/play-based-learning" target="_blank" rel="noopener noreferrer" style={sourceLinkStyle}>Education Endowment Foundation — Play-Based Learning</a></li>
          </ul>
        </section>

        <section style={{ border: "1px solid #ddd6fe", borderRadius: 20, padding: 24, background: "#f5f3ff" }}>
          <h2 style={{ ...headingStyle, fontSize: 25 }}>Understand the learner. Support the learning. Keep the story.</h2>
          <p style={{ ...paragraphStyle, marginBottom: 18 }}>MyLearna helps homeschool families plan learning, capture what happens, understand progress and keep a connected record of the learning journey.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link href="/learn" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, borderRadius: 12, padding: "10px 15px", background: "#2563eb", color: "#fff", fontWeight: 750, textDecoration: "none" }}>Explore the Learning Library</Link><Link href="/demo?source=learning-library-article" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, borderRadius: 12, padding: "10px 15px", border: "1px solid #cbd5e1", background: "#fff", color: "#1f2937", fontWeight: 750, textDecoration: "none" }}>Explore MyLearna</Link></div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </article>
    </PublicSiteShell>
  );
}
