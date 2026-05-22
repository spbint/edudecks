"use client";

import Link from "next/link";
import React from "react";

type CleanPageGuidanceItem = {
  key: string;
  label: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 20,
  background: "#f8fbff",
  padding: 18,
  display: "grid",
  gap: 14,
  boxShadow: "0 10px 24px rgba(59,130,246,0.06)",
};

export default function CleanPageGuidance({
  title,
  copy,
  items,
}: {
  title: string;
  copy: string;
  items: CleanPageGuidanceItem[];
}) {
  if (!items.length) return null;

  return (
    <section style={sectionStyle}>
      <div style={{ display: "grid", gap: 8 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "#64748b",
            textTransform: "uppercase",
          }}
        >
          Page guidance
        </div>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>{title}</h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{copy}</p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {items.map((item) => (
          <div
            key={item.key}
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 16,
              background: "#ffffff",
              padding: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.05em",
                color: "#1d4ed8",
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </div>
            <strong style={{ color: "#0f172a", fontSize: 16 }}>{item.title}</strong>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              {item.description}
            </p>
            {item.actionHref && item.actionLabel ? (
              <div>
                <Link
                  href={item.actionHref}
                  style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 14 }}
                >
                  {item.actionLabel}
                </Link>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
