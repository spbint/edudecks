import Link from "next/link";
import React from "react";

type CleanNextStepCardProps = {
  actionHref?: string;
  actionLabel?: string;
  body: string;
  title?: string;
};

type CleanBetaFeedbackPromptProps = {
  pageName: string;
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 18,
  background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
  padding: 18,
  display: "grid",
  gap: 10,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const textStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.65,
};

const linkStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 999,
  background: "#ffffff",
  color: "#0f172a",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 800,
  textDecoration: "none",
};

export function CleanNextStepCard({
  actionHref,
  actionLabel,
  body,
  title = "Your next step",
}: CleanNextStepCardProps) {
  return (
    <section style={cardStyle}>
      <div style={eyebrowStyle}>{title}</div>
      <p style={textStyle}>{body}</p>
      {actionHref && actionLabel ? (
        <div>
          <Link href={actionHref} style={linkStyle}>
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export function CleanBetaFeedbackPrompt({ pageName }: CleanBetaFeedbackPromptProps) {
  return (
    <section
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        background: "#ffffff",
        padding: 16,
        display: "flex",
        gap: 12,
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "grid", gap: 4, minWidth: 220 }}>
        <strong style={{ color: "#0f172a" }}>Help shape MyLearna</strong>
        <p style={{ ...textStyle, fontSize: 14 }}>
          What would make {pageName} more useful for your family?
        </p>
      </div>
      <Link href="/contact" style={linkStyle}>
        Share feedback
      </Link>
    </section>
  );
}
