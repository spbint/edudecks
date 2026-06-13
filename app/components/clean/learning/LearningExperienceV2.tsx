"use client";

import type React from "react";

export const learningV2 = {
  navy: "#17204B",
  purple: "#6C4DF6",
  lavender: "#F2EDFF",
  green: "#2F9D68",
  mint: "#ECFDF4",
  red: "#E85D75",
  softRed: "#FFF0F3",
  amber: "#F59E0B",
  softAmber: "#FFF7E6",
  slate: "#5B6478",
  border: "#E7EAF2",
  page: "#F7F9FC",
  card: "#FFFFFF",
};

export function LearningPanel({
  tone = "practice",
  eyebrow,
  title,
  subtitle,
  children,
}: {
  tone?: "practice" | "assess" | "neutral";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const toneColor =
    tone === "assess" ? learningV2.green : tone === "practice" ? learningV2.purple : learningV2.navy;
  const toneFill =
    tone === "assess" ? learningV2.mint : tone === "practice" ? learningV2.lavender : "#F8FAFC";

  return (
    <section
      style={{
        border: `1px solid ${learningV2.border}`,
        borderRadius: 20,
        background: learningV2.card,
        boxShadow: "0 8px 24px rgba(23, 32, 75, 0.06)",
        padding: "clamp(14px, 2.2vw, 18px)",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        {eyebrow ? (
          <div
            style={{
              width: "fit-content",
              borderRadius: 999,
              background: toneFill,
              color: toneColor,
              padding: "4px 9px",
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <h2
          style={{
            margin: 0,
            color: learningV2.navy,
            fontSize: "clamp(18px, 2.4vw, 22px)",
            lineHeight: 1.2,
            fontWeight: 650,
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p style={{ margin: 0, color: learningV2.slate, fontSize: 14, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function AnswerOptionGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mylearna-answer-option-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
      }}
    >
      <style jsx global>{`
        @media (max-width: 620px) {
          .mylearna-answer-option-grid {
            grid-template-columns: 1fr !important;
          }
        }

        .mylearna-answer-option-grid [data-compact-visual-answer="true"] {
          min-height: 64px !important;
          padding: 7px !important;
          border-radius: 12px !important;
          border-width: 1px !important;
          box-shadow: none !important;
        }

        .mylearna-answer-option-grid [data-compact-visual-answer="true"] > div {
          min-height: 0 !important;
          max-height: 78px !important;
          padding: 4px 6px !important;
          border-radius: 10px !important;
          border-width: 1px !important;
          gap: 4px !important;
          box-shadow: none !important;
          overflow: hidden !important;
        }

        .mylearna-answer-option-grid [data-compact-visual-answer="true"] div,
        .mylearna-answer-option-grid [data-compact-visual-answer="true"] strong {
          box-shadow: none !important;
          font-weight: 650 !important;
        }

        .mylearna-answer-option-grid [data-compact-visual-answer="true"] > div > div {
          min-height: 0 !important;
          padding: 3px 5px !important;
          border-radius: 9px !important;
          gap: 3px !important;
        }

        .mylearna-answer-option-grid [data-compact-visual-answer="true"] span[aria-hidden="true"] {
          width: 8px !important;
          height: 8px !important;
          border-width: 1px !important;
          box-shadow: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}

export function AnswerOptionCard({
  badge,
  selected,
  onClick,
  children,
  ariaLabel,
  style,
}: {
  badge: string;
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected ? "true" : "false"}
      aria-label={ariaLabel}
      style={{
        minHeight: 52,
        width: "100%",
        display: "grid",
        gridTemplateColumns: "28px minmax(0, 1fr)",
        alignItems: "center",
        gap: 10,
        textAlign: "left",
        border: selected ? `2px solid ${learningV2.purple}` : `1px solid ${learningV2.border}`,
        borderRadius: 14,
        background: selected ? learningV2.lavender : learningV2.card,
        color: learningV2.navy,
        padding: "9px 11px",
        font: "inherit",
        fontSize: 14,
        lineHeight: 1.35,
        cursor: "pointer",
        boxShadow: selected ? "0 8px 18px rgba(108, 77, 246, 0.14)" : "none",
        position: "relative",
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: selected ? `1px solid ${learningV2.purple}` : `1px solid ${learningV2.border}`,
          background: selected ? learningV2.card : "#F8FAFC",
          color: selected ? learningV2.purple : learningV2.slate,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {badge}
      </span>
      <span style={{ minWidth: 0 }}>{children}</span>
    </button>
  );
}

export function HintDrawer({
  summary = "Need a hint?",
  children,
}: {
  summary?: string;
  children: React.ReactNode;
}) {
  return (
    <details
      style={{
        border: `1px solid ${learningV2.border}`,
        borderRadius: 14,
        background: "#FFFFFF",
        padding: "9px 11px",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          color: learningV2.purple,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.4,
        }}
      >
        {summary}
      </summary>
      <div style={{ marginTop: 9, color: learningV2.navy, fontSize: 13, lineHeight: 1.5 }}>
        {children}
      </div>
    </details>
  );
}

export function FeedbackPanel({
  tone,
  title,
  children,
}: {
  tone: "correct" | "review" | "neutral";
  title: string;
  children: React.ReactNode;
}) {
  const fill =
    tone === "correct" ? learningV2.mint : tone === "review" ? learningV2.softAmber : "#F8FAFC";
  const color =
    tone === "correct" ? learningV2.green : tone === "review" ? learningV2.amber : learningV2.navy;

  return (
    <div
      role="status"
      style={{
        border: `1px solid ${learningV2.border}`,
        background: fill,
        borderRadius: 16,
        padding: 12,
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ color, fontWeight: 650, lineHeight: 1.35, fontSize: 14 }}>{title}</div>
      <div style={{ color: learningV2.navy, lineHeight: 1.5, fontSize: 13 }}>{children}</div>
    </div>
  );
}

export function StepProgressBar({
  current,
  total,
  label = "Step progress",
}: {
  current: number;
  total: number;
  label?: string;
}) {
  const progress = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          color: learningV2.slate,
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        <span>{label}</span>
        <span>
          {current} of {total}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "#E9ECF5", overflow: "hidden" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            borderRadius: 999,
            background: learningV2.purple,
          }}
        />
      </div>
    </div>
  );
}

export function ParentJudgementPanel({
  children,
  targetedPracticeHref,
  pathwayHref = "/my-pathways",
}: {
  children?: React.ReactNode;
  targetedPracticeHref?: string;
  pathwayHref?: string;
}) {
  const cards = [
    {
      title: "Needs support",
      subtitle: "More support recommended",
      fill: learningV2.softRed,
      color: learningV2.red,
      icon: "!",
    },
    {
      title: "Nearly there",
      subtitle: "This skill may need another practice round",
      fill: learningV2.softAmber,
      color: learningV2.amber,
      icon: "~",
    },
    {
      title: "Secure",
      subtitle: "Ready to keep going",
      fill: learningV2.mint,
      color: learningV2.green,
      icon: "OK",
    },
  ];

  return (
    <aside
      style={{
        border: `1px solid ${learningV2.border}`,
        borderRadius: 20,
        background: learningV2.card,
        boxShadow: "0 8px 24px rgba(23, 32, 75, 0.06)",
        padding: "clamp(14px, 2.4vw, 18px)",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <h2
          style={{
            margin: 0,
            color: learningV2.navy,
            fontSize: 20,
            lineHeight: 1.2,
            fontWeight: 650,
          }}
        >
          What happens next?
        </h2>
        <p style={{ margin: 0, color: learningV2.slate, fontSize: 13, lineHeight: 1.45 }}>
          Your child&apos;s understanding helps shape their learning path.
        </p>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              display: "grid",
              gridTemplateColumns: "26px minmax(0, 1fr)",
              gap: 9,
              alignItems: "center",
              borderRadius: 14,
              background: card.fill,
              padding: 10,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: learningV2.card,
                color: card.color,
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              {card.icon}
            </span>
            <span style={{ display: "grid", gap: 2 }}>
              <strong style={{ color: learningV2.navy, fontSize: 14, fontWeight: 650 }}>{card.title}</strong>
              <span style={{ color: learningV2.slate, fontSize: 12 }}>{card.subtitle}</span>
            </span>
          </div>
        ))}
      </div>
      {children}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <a
          href={targetedPracticeHref || pathwayHref}
          style={{
            minHeight: 38,
            border: `1px solid ${learningV2.purple}`,
            background: learningV2.purple,
            color: learningV2.card,
            borderRadius: 12,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Start targeted practice
        </a>
        <a
          href={pathwayHref}
          style={{
            minHeight: 38,
            border: `1px solid ${learningV2.border}`,
            background: learningV2.card,
            color: learningV2.navy,
            borderRadius: 12,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          View pathway map
        </a>
      </div>
    </aside>
  );
}
