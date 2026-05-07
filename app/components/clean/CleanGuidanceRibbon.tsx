"use client";

import Link from "next/link";
import React from "react";
import type { CleanGuidanceCard } from "@/lib/clean/guidance/types";

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

function getStatusColors(status: CleanGuidanceCard["status"]) {
  if (status === "done") {
    return {
      border: "#bbf7d0",
      background: "#f0fdf4",
      text: "#166534",
    };
  }

  if (status === "next") {
    return {
      border: "#bfdbfe",
      background: "#eff6ff",
      text: "#1d4ed8",
    };
  }

  return {
    border: "#e2e8f0",
    background: "#f8fafc",
    text: "#475569",
  };
}

export default function CleanGuidanceRibbon({
  cards,
}: {
  cards: CleanGuidanceCard[];
}) {
  if (!cards.length) return null;

  return (
    <section style={cardStyle}>
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "#64748b",
            textTransform: "uppercase",
          }}
        >
          Calm next steps
        </div>
        <h2 style={{ margin: 0, color: "#0f172a" }}>What to do next</h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          These cards stay focused on the next few things that will make today and this week easier.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {cards.map((card) => {
          const colors = getStatusColors(card.status);

          return (
            <div
              key={card.key}
              style={{
                border: `1px solid ${colors.border}`,
                background: colors.background,
                borderRadius: 14,
                padding: 14,
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  color: colors.text,
                  textTransform: "uppercase",
                }}
              >
                {card.status === "done"
                  ? "Done"
                  : card.status === "next"
                    ? "Next step"
                    : "Coming up"}
              </div>
              <strong style={{ color: "#0f172a" }}>{card.title}</strong>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                {card.description}
              </p>
              <div>
                <Link href={card.actionHref} style={{ color: "#1d4ed8", fontWeight: 700 }}>
                  {card.actionLabel}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
