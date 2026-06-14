import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import H5PActivityFrame from "@/app/components/clean/my-skills/H5PActivityFrame";
import { getH5PActivityById } from "@/lib/clean/resources/h5pActivities";

const activity = getH5PActivityById("arithmetic-quiz-h5p-6725");

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

export default function ArithmeticQuizPage() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={sectionStyle}>
        <div style={{ display: "grid", gap: 18 }}>
          <Link
            href="/my-skills"
            style={{
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              gap: 8,
              color: colors.navy,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 999,
              padding: "8px 11px",
              background: "#FFFFFF",
              border: `1px solid ${colors.border}`,
            }}
          >
            <span aria-hidden="true">&larr;</span>
            Back to My Skills
          </Link>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "grid", gap: 10, maxWidth: 780 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Pill tone="blue">{activity?.displayCategory ?? "Fluency Practice"}</Pill>
                <Pill>Family feature prototype</Pill>
              </div>
              <h1
                style={{
                  margin: 0,
                  color: colors.navy,
                  fontSize: "clamp(28px, 4vw, 36px)",
                  lineHeight: 1.12,
                  fontWeight: 900,
                }}
              >
                {activity?.title ?? "Arithmetic Quiz"}
              </h1>
              <p style={{ margin: 0, color: colors.slate, fontSize: 16, lineHeight: 1.65 }}>
                {activity?.description ??
                  "A short interactive arithmetic quiz for building number fluency."}
              </p>
            </div>
            <Pill tone="green">{activity?.estimatedMinutes ?? 5} minutes</Pill>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={{ display: "grid", gap: 14 }}>
          <H5PActivityFrame title={activity?.title ?? "Arithmetic Quiz"} embedUrl={activity?.embedUrl} />
          <p style={{ margin: 0, color: colors.slate, fontSize: 14, lineHeight: 1.7 }}>
            This interactive skill builder is a prototype for My Skills. Later, Family
            activities can be linked to learner progress and evidence records.
          </p>
        </div>
      </section>

      <section
        style={{
          ...sectionStyle,
          background: "linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)",
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <h2 style={{ margin: 0, color: colors.navy, fontSize: 20, lineHeight: 1.25 }}>
            Prototype note
          </h2>
          <p style={{ margin: 0, color: colors.slate, lineHeight: 1.7 }}>
            This activity is not a MyLearna assessment and does not save completion, score
            or report evidence yet.
          </p>
        </div>
      </section>
    </div>
  );
}
