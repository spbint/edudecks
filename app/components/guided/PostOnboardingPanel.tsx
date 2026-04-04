"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  getPostOnboardingStage,
  getWeeklyRhythmCue,
  postOnboardingConfig,
  type PostOnboardingStage,
} from "@/lib/postOnboarding";

type PostOnboardingPanelProps = {
  stage?: PostOnboardingStage | null;
};

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#64748b",
  };
}

function helperCardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    background: "#ffffff",
    padding: 14,
  };
}

export default function PostOnboardingPanel({ stage }: PostOnboardingPanelProps) {
  const pathname = usePathname();
  const resolvedStage = stage ?? getPostOnboardingStage(pathname);

  if (!resolvedStage) return null;

  const content = postOnboardingConfig[resolvedStage];
  const rhythmCue = getWeeklyRhythmCue();
  const planningSurface = resolvedStage === "planning";

  return (
    <section
      aria-label="Guided mode"
      style={{
        border: planningSurface ? "1px solid #cbdcf5" : "1px solid #dbe7f3",
        borderRadius: 20,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
        padding: 18,
        boxShadow: planningSurface
          ? "0 14px 34px rgba(15,23,42,0.06)"
          : "0 10px 30px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div style={labelStyle()}>Guided mode</div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            borderRadius: 999,
            padding: "6px 10px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1d4ed8",
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {content.state}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: planningSurface
            ? "minmax(0, 1fr) minmax(280px, 0.95fr)"
            : "minmax(0, 1.1fr) minmax(260px, 0.9fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: planningSurface ? 26 : 24,
              lineHeight: 1.2,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {content.title}
          </h2>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 15,
              lineHeight: 1.7,
              color: "#475569",
              maxWidth: 760,
            }}
          >
            {content.reassurance}
          </p>
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              lineHeight: 1.6,
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            {rhythmCue.label}: {rhythmCue.text}
          </div>
        </div>

        <div style={helperCardStyle()}>
          <div style={labelStyle()}>What to do now</div>
          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 1.65,
              color: "#334155",
              fontWeight: 700,
            }}
          >
            {content.next}
          </div>
        </div>
      </div>
    </section>
  );
}
