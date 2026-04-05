"use client";

import React from "react";
import Link from "next/link";

type UpgradeHintProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  variant?: "inline" | "subtle" | "disabled";
};

function palette(variant: "inline" | "subtle" | "disabled") {
  if (variant === "disabled") {
    return {
      bg: "#f8fafc",
      border: "#dbe3ef",
      title: "#334155",
      text: "#64748b",
      buttonBg: "#e2e8f0",
      buttonText: "#475569",
    };
  }

  if (variant === "subtle") {
    return {
      bg: "#f8fbff",
      border: "#dbeafe",
      title: "#1d4ed8",
      text: "#475569",
      buttonBg: "#ffffff",
      buttonText: "#1d4ed8",
    };
  }

  return {
    bg: "#eff6ff",
    border: "#bfdbfe",
    title: "#1d4ed8",
    text: "#334155",
    buttonBg: "#ffffff",
    buttonText: "#1d4ed8",
  };
}

export default function UpgradeHint({
  title,
  description,
  ctaLabel,
  ctaHref,
  variant = "inline",
}: UpgradeHintProps) {
  const tone = palette(variant);

  return (
    <section
      style={{
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        borderRadius: 14,
        padding: variant === "subtle" ? 12 : 14,
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 900,
          color: tone.title,
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: tone.text,
          maxWidth: 760,
        }}
      >
        {description}
      </div>

      <div>
        <Link
          href={ctaHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 34,
            padding: "0 12px",
            borderRadius: 10,
            border: `1px solid ${tone.border}`,
            background: tone.buttonBg,
            color: tone.buttonText,
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
