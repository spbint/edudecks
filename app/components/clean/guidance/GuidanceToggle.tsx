"use client";

import React from "react";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  background: "#ffffff",
  color: "#1d4ed8",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 800,
  padding: "10px 14px",
};

export function GuidanceSettingsCard() {
  const { enabled, resetDismissedTips, restartWelcomeTour, setGuidanceEnabled } = useGuidance();

  return (
    <section
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 18,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
          Guidance and walkthroughs
        </h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Guidance tips help new users understand each part of MyLearna. Turn them off
          when you feel confident, or turn them back on any time.
        </p>
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "#0f172a",
          fontWeight: 800,
        }}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setGuidanceEnabled(event.target.checked)}
          style={{ width: 18, height: 18 }}
        />
        Show guidance tips
      </label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={restartWelcomeTour} style={secondaryButtonStyle}>
          Restart welcome tour
        </button>
        <button type="button" onClick={resetDismissedTips} style={secondaryButtonStyle}>
          Reset dismissed guidance
        </button>
      </div>
    </section>
  );
}

export function GuidancePageAction({ anchorId }: { anchorId: string }) {
  const { enabled, hydrated, isGuidanceRoute, startWelcomeTour } = useGuidance();

  if (!hydrated || !enabled || !isGuidanceRoute) return null;

  return (
    <button
      type="button"
      onClick={() => startWelcomeTour(anchorId)}
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 999,
        background: "#eff6ff",
        color: "#1d4ed8",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 800,
        padding: "9px 12px",
      }}
    >
      Guide me through this page
    </button>
  );
}
