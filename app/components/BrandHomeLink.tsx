"use client";

import React from "react";
import Link from "next/link";

type BrandHomeLinkProps = {
  href?: string;
  compact?: boolean;
  height?: number;
  width?: number;
  style?: React.CSSProperties;
};

export default function BrandHomeLink({
  href = "/home",
  compact = false,
  height,
  width,
  style,
}: BrandHomeLinkProps) {
  const iconSize = compact ? 38 : Math.max(38, Math.min(height ?? 44, 48));
  const wordmarkSize = compact ? 20 : width && width < 200 ? 20 : 24;

  return (
    <Link
      href={href}
      aria-label="MyLearna Home"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 10 : 12,
        textDecoration: "none",
        ...style,
      }}
    >
      <span
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(168,85,247,0.14) 55%, rgba(34,197,94,0.16) 100%)",
          border: "1px solid rgba(148,163,184,0.22)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: compact ? 16 : 18,
            fontWeight: 900,
            color: "#1e3a8a",
            letterSpacing: "-0.03em",
          }}
        >
          ML
        </span>
      </span>

      <span style={{ display: "grid", gap: 2 }}>
        <span
          style={{
            fontSize: wordmarkSize,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "#0f172a",
          }}
        >
          MyLearna
        </span>
        {!compact ? (
          <span
            style={{
              fontSize: 11,
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Plan • Capture • Grow
          </span>
        ) : null}
      </span>
    </Link>
  );
}
