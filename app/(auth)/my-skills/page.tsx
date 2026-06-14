import type { CSSProperties, ReactNode } from "react";

const colors = {
  card: "#FFFFFF",
  navy: "#17204B",
  slate: "#5B6478",
  purple: "#6C4DF6",
  lavender: "#F2EDFF",
  lavenderBorder: "#DDD6FE",
  blueSoft: "#EFF6FF",
  blueBorder: "#BFDBFE",
  border: "#E7EAF2",
  green: "#2F9D68",
  mint: "#ECFDF4",
};

const sectionStyle: CSSProperties = {
  border: `1px solid ${colors.border}`,
  borderRadius: 20,
  background: colors.card,
  boxShadow: "0 8px 24px rgba(23, 32, 75, 0.06)",
  padding: "clamp(16px, 3vw, 24px)",
};

const smallLabelStyle: CSSProperties = {
  margin: 0,
  color: colors.purple,
  fontSize: 12,
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

function Pill({
  children,
  tone = "lavender",
}: {
  children: ReactNode;
  tone?: "lavender" | "blue" | "green";
}) {
  const styles =
    tone === "green"
      ? { background: colors.mint, border: "#A7F3D0", color: colors.green }
      : tone === "blue"
        ? { background: colors.blueSoft, border: colors.blueBorder, color: "#1D4ED8" }
        : { background: colors.lavender, border: colors.lavenderBorder, color: colors.purple };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: "fit-content",
        borderRadius: 999,
        border: `1px solid ${styles.border}`,
        background: styles.background,
        color: styles.color,
        padding: "6px 10px",
        fontSize: 12,
        lineHeight: 1,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

const featuredSkillBuilders = [
  {
    title: "Times tables fluency",
    area: "Mathematics · Number",
    description: "Short arithmetic practice for building confidence with multiplication facts.",
  },
  {
    title: "Addition and subtraction facts",
    area: "Mathematics · Number",
    description: "Quick practice for number facts and mental strategies.",
  },
  {
    title: "Fraction matching",
    area: "Mathematics · Number",
    description: "Match symbols, visual models and equivalent fractions.",
  },
] as const;

const subjects = [
  {
    title: "Mathematics",
    detail: "Fluency, number facts, fractions, reasoning and repeated practice.",
  },
  {
    title: "English",
    detail: "Reading, spelling, vocabulary and language skill builders.",
  },
  {
    title: "Science",
    detail: "Short interactive checks for concepts, vocabulary and observation skills.",
  },
  {
    title: "Digital Technologies",
    detail: "Sequencing, logic, patterns and computational thinking practice.",
  },
] as const;

export default function MySkillsPage() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={sectionStyle}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
            <p style={smallLabelStyle}>Family feature foundation</p>
            <h1
              style={{
                margin: 0,
                color: colors.navy,
                fontSize: "clamp(28px, 4vw, 36px)",
                lineHeight: 1.12,
                fontWeight: 900,
              }}
            >
              My Skills
            </h1>
            <p style={{ margin: 0, color: colors.slate, fontSize: 16, lineHeight: 1.65 }}>
              Build fluency and confidence with short interactive skill builders.
            </p>
          </div>
          <Pill tone="blue">Coming soon for Family</Pill>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <p style={smallLabelStyle}>Featured skill builders</p>
            <h2 style={{ margin: 0, color: colors.navy, fontSize: 24, lineHeight: 1.2 }}>
              Reusable practice for key skills
            </h2>
            <p style={{ margin: 0, color: colors.slate, lineHeight: 1.65 }}>
              My Skills will become the home for fluency practice, arithmetic activities and
              subject skill builders linked to your child&apos;s learning.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
              gap: 14,
            }}
          >
            {featuredSkillBuilders.map((builder) => (
              <article
                key={builder.title}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFF 100%)",
                  padding: 18,
                  display: "grid",
                  gap: 12,
                  minHeight: 216,
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Pill>Family feature</Pill>
                  <Pill tone="green">Coming soon</Pill>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <h3 style={{ margin: 0, color: colors.navy, fontSize: 19, lineHeight: 1.25 }}>
                    {builder.title}
                  </h3>
                  <p style={{ margin: 0, color: colors.purple, fontSize: 13, fontWeight: 800 }}>
                    {builder.area}
                  </p>
                </div>
                <p style={{ margin: 0, color: colors.slate, lineHeight: 1.6 }}>
                  {builder.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 18,
        }}
      >
        <section style={sectionStyle}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <p style={smallLabelStyle}>Browse by subject</p>
              <h2 style={{ margin: 0, color: colors.navy, fontSize: 22, lineHeight: 1.2 }}>
                Skill areas to build next
              </h2>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {subjects.map((subject) => (
                <article
                  key={subject.title}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    background: "#F8FAFC",
                    padding: 14,
                    display: "grid",
                    gap: 5,
                  }}
                >
                  <h3 style={{ margin: 0, color: colors.navy, fontSize: 16 }}>
                    {subject.title}
                  </h3>
                  <p style={{ margin: 0, color: colors.slate, fontSize: 13, lineHeight: 1.55 }}>
                    {subject.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: "grid", gap: 12 }}>
            <p style={smallLabelStyle}>How My Skills fits</p>
            <h2 style={{ margin: 0, color: colors.navy, fontSize: 22, lineHeight: 1.2 }}>
              Separate from My Pathways
            </h2>
            <p style={{ margin: 0, color: colors.slate, lineHeight: 1.7 }}>
              Use My Pathways for structured curriculum steps. Use My Skills for short,
              reusable practice that builds fluency across those steps.
            </p>
            <div
              style={{
                border: `1px solid ${colors.blueBorder}`,
                borderRadius: 16,
                background: colors.blueSoft,
                padding: 16,
                color: colors.navy,
                lineHeight: 1.65,
              }}
            >
              Future interactive activities should become evidence-aware only when they can
              safely record completion, learner, subject, strand and result context.
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
