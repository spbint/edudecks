"use client";

import React from "react";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import { MYLEARNA_ASSESS_DEMO_ITEMS } from "@/lib/clean/assessments/mylearnaAssessDemoItems";

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F7F8FC",
  padding: "clamp(18px, 4vw, 42px)",
};

const shellStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  display: "grid",
  gap: 22,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 24,
  background: "#ffffff",
  padding: "clamp(18px, 4vw, 28px)",
  boxShadow: "0 18px 44px rgba(23,32,75,0.06)",
};

export default function AssessmentLabWorkspace() {
  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={{ ...cardStyle, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span
              style={{
                border: "1px solid #D9D0FF",
                borderRadius: 999,
                background: "#F8F5FF",
                color: "#5B3BE8",
                padding: "5px 10px",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Internal only
            </span>
            <span style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>
              Hidden from customers
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <h1 style={{ margin: 0, color: "#17204B", fontSize: "clamp(32px, 5vw, 48px)" }}>
              Assessment Lab
            </h1>
            <p style={{ margin: 0, color: "#5B6478", fontSize: 17, lineHeight: 1.6 }}>
              Internal workspace for rebuilding MyLearna Assess.
            </p>
          </div>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.65, maxWidth: 760 }}>
            This is where the new structured assessment engine will be developed. It is hidden
            from customers until the content model, visuals, scoring, and reporting reach the
            product quality bar.
          </p>
        </section>

        <section
          style={{
            ...cardStyle,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
          aria-label="Prototype assessment items"
        >
          {MYLEARNA_ASSESS_DEMO_ITEMS.map((item) => (
            <article
              key={item.id}
              style={{
                border: "1px solid #E7EAF2",
                borderRadius: 18,
                padding: 16,
                display: "grid",
                gap: 8,
                background: "#F8FAFC",
              }}
            >
              <span style={{ color: "#6C4DF6", fontSize: 12, fontWeight: 900 }}>
                {item.status.toUpperCase()} · {item.template}
              </span>
              <strong style={{ color: "#17204B" }}>{item.prompt}</strong>
              <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.45 }}>
                {item.skill.name}
              </span>
            </article>
          ))}
        </section>

        <AssessmentPlayerV1
          title="Subitising proof of concept"
          items={MYLEARNA_ASSESS_DEMO_ITEMS}
        />
      </div>
    </main>
  );
}
