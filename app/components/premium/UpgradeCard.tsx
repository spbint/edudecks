"use client";

import React from "react";
import Link from "next/link";

/* 🔥 NEW SOURCE OF TRUTH */
import {
  getPremiumTriggerConfig,
  getFeaturesForTrigger,
} from "@/lib/premiumConfig";

/* ✅ FIXED TYPE IMPORT */
import type { PremiumTrigger as PremiumTriggerKey } from "@/lib/premiumUpgradeEngine";

/* =========================
   TYPES
========================= */

type Props = {
  trigger: PremiumTriggerKey;
  variant?: "full" | "compact" | "banner";
  primaryHrefOverride?: string;
  secondaryHrefOverride?: string;
  onSecondaryClick?: () => void;
  onPrimaryClick?: () => void;
  style?: React.CSSProperties;
};

/* =========================
   TONE SYSTEM (UNCHANGED)
========================= */

type Tone = "blue" | "amber" | "green" | "violet";

function resolveTone(trigger: PremiumTriggerKey): Tone {
  switch (trigger) {
    case "capture-media":
      return "blue";
    case "reports-guidance":
      return "violet";
    case "output-export":
      return "green";
    case "authority-pack":
      return "amber";
    case "momentum-progress":
    default:
      return "violet";
  }
}

function toneStyles(tone: Tone) {
  switch (tone) {
    case "blue":
      return {
        cardBg: "#eff6ff",
        cardBorder: "#bfdbfe",
        eyebrow: "#1d4ed8",
        badgeBg: "#dbeafe",
        badgeFg: "#1d4ed8",
        primaryBg: "#2563eb",
        primaryFg: "#ffffff",
        secondaryBg: "#ffffff",
        secondaryFg: "#1d4ed8",
        secondaryBd: "#bfdbfe",
      };

    case "amber":
      return {
        cardBg: "#fff7ed",
        cardBorder: "#fed7aa",
        eyebrow: "#c2410c",
        badgeBg: "#ffedd5",
        badgeFg: "#9a3412",
        primaryBg: "#ea580c",
        primaryFg: "#ffffff",
        secondaryBg: "#ffffff",
        secondaryFg: "#9a3412",
        secondaryBd: "#fed7aa",
      };

    case "green":
      return {
        cardBg: "#f0fdf4",
        cardBorder: "#bbf7d0",
        eyebrow: "#15803d",
        badgeBg: "#dcfce7",
        badgeFg: "#166534",
        primaryBg: "#16a34a",
        primaryFg: "#ffffff",
        secondaryBg: "#ffffff",
        secondaryFg: "#166534",
        secondaryBd: "#bbf7d0",
      };

    case "violet":
    default:
      return {
        cardBg: "#f5f3ff",
        cardBorder: "#ddd6fe",
        eyebrow: "#6d28d9",
        badgeBg: "#ede9fe",
        badgeFg: "#6d28d9",
        primaryBg: "#7c3aed",
        primaryFg: "#ffffff",
        secondaryBg: "#ffffff",
        secondaryFg: "#6d28d9",
        secondaryBd: "#ddd6fe",
      };
  }
}

/* =========================
   BUTTONS
========================= */

function buttonStyle(
  kind: "primary" | "secondary" | "ghost",
  tone: ReturnType<typeof toneStyles>
): React.CSSProperties {
  if (kind === "ghost") {
    return {
      border: "none",
      background: "transparent",
      color: "#475569",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      textDecoration: "underline",
    };
  }

  if (kind === "secondary") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 40,
      padding: "0 14px",
      borderRadius: 12,
      border: `1px solid ${tone.secondaryBd}`,
      background: tone.secondaryBg,
      color: tone.secondaryFg,
      fontWeight: 800,
      cursor: "pointer",
    };
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 12,
    background: tone.primaryBg,
    color: tone.primaryFg,
    fontWeight: 800,
    cursor: "pointer",
  };
}

/* =========================
   COMPONENT
========================= */

export default function UpgradeCard({
  trigger,
  variant = "full",
  primaryHrefOverride,
  secondaryHrefOverride,
  onSecondaryClick,
  onPrimaryClick,
  style,
}: Props) {
  const config = getPremiumTriggerConfig(trigger);
  const features = getFeaturesForTrigger(trigger);

  const tone = toneStyles(resolveTone(trigger));

  const compact = variant === "compact";
  const banner = variant === "banner";

  return (
    <section
      style={{
        border: `1px solid ${tone.cardBorder}`,
        background: tone.cardBg,
        borderRadius: banner ? 16 : 18,
        padding: compact ? 14 : 18,
        display: "grid",
        gap: compact ? 10 : 14,
        ...style,
      }}
    >
      {/* HEADER */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: tone.eyebrow }}>
          PREMIUM
        </div>

        <div style={{ fontSize: compact ? 18 : 22, fontWeight: 900 }}>
          {config.headline}
        </div>

        <div style={{ fontSize: 14, color: "#334155" }}>
          {config.supportingText}
        </div>
      </div>

      {/* FEATURES */}
      {!banner && (
        <div style={{ display: "grid", gap: 8 }}>
          {features.map((f) => (
            <div key={f.key} style={{ fontSize: 13, fontWeight: 700 }}>
              ✓ {f.shortDescription}
            </div>
          ))}
        </div>
      )}

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button style={buttonStyle("primary", tone)} onClick={onPrimaryClick}>
          {config.primaryCtaLabel}
        </button>

        <button style={buttonStyle("ghost", tone)} onClick={onSecondaryClick}>
          {config.secondaryCtaLabel}
        </button>
      </div>
    </section>
  );
}