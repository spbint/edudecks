"use client";

import Link from "next/link";
import React from "react";
import { useGuidance, type GuidanceTourId } from "@/app/components/clean/guidance/GuidanceProvider";
import { useDriverTour } from "@/app/components/clean/guidance/useDriverTour";

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

const primaryButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  background: "#1d4ed8",
  borderColor: "#1d4ed8",
  color: "#ffffff",
};

export function GuidanceWelcomePrompt() {
  const { enabled, hydrated, isGuidanceRoute, showWelcomePrompt, skipWelcomeGuidance, startWelcomeGuidance } =
    useGuidance();

  if (!hydrated || !enabled || !isGuidanceRoute || !showWelcomePrompt) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="guidance-welcome-heading"
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 80,
        width: "min(430px, calc(100vw - 36px))",
        border: "1px solid #bfdbfe",
        borderRadius: 18,
        background: "#ffffff",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
        padding: 18,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            color: "#1d4ed8",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Guidance
        </div>
        <h2 id="guidance-welcome-heading" style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
          Welcome to MyLearna
        </h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Would you like help getting started? Guidance can show you around key pages
          and help you understand the MyLearna flow.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={startWelcomeGuidance} style={primaryButtonStyle}>
          Guide me
        </button>
        <button type="button" onClick={skipWelcomeGuidance} style={secondaryButtonStyle}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

export function GuidanceSettingsCard() {
  const { enabled, resetDismissedTips, restartGuidance, setGuidanceEnabled } = useGuidance();

  return (
    <section
      data-guidance-id="settings-guidance-toggle"
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
        <button type="button" onClick={restartGuidance} style={secondaryButtonStyle}>
          Restart guide
        </button>
        <button type="button" onClick={resetDismissedTips} style={secondaryButtonStyle}>
          Reset dismissed guidance
        </button>
      </div>
    </section>
  );
}

export function GuidancePageAction({ tourId }: { tourId: GuidanceTourId }) {
  const { enabled, hydrated, isGuidanceRoute } = useGuidance();
  const startTour = useDriverTour();

  if (!hydrated || !enabled || !isGuidanceRoute) return null;

  return (
    <button
      type="button"
      onClick={() => startTour(tourId)}
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

const checklistItems = [
  { label: "Set up family profile", href: "/my-profile" },
  { label: "Choose settings", href: "/my-settings" },
  { label: "Plan the week", href: "/my-calendar" },
  { label: "Open a pathway", href: "/my-pathways" },
  { label: "Capture evidence", href: "/my-capture" },
  { label: "Review portfolio", href: "/my-portfolio" },
  { label: "Preview reports", href: "/my-reports" },
];

export function GuidanceGettingStartedCard() {
  const { enabled, hydrated, isGuidanceRoute } = useGuidance();

  if (!hydrated || !enabled || !isGuidanceRoute) return null;

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
      <div style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            color: "#1d4ed8",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Getting started
        </div>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
          Follow the MyLearna flow
        </h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Work through these steps at your own pace. Each page can guide you through
          its main actions.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {checklistItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              color: "#0f172a",
              display: "grid",
              gap: 4,
              padding: 12,
              textDecoration: "none",
            }}
          >
            <span style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900 }}>
              Open
            </span>
            <strong>{item.label}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
