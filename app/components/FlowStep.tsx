"use client";

import React from "react";

type FlowStepProps = {
  step: number;
  title: string;
  description?: string;
  helperText?: string;
  badge?: string;
  children: React.ReactNode;
};

export default function FlowStep({
  step,
  title,
  description,
  helperText,
  badge,
  children,
}: FlowStepProps) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "88px minmax(0, 1fr)",
        gap: 16,
        alignItems: "start",
      }}
    >
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 10,
          paddingTop: 4,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            border: "1px solid #bfdbfe",
            background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
            color: "#1d4ed8",
            display: "grid",
            placeItems: "center",
            fontSize: 22,
            fontWeight: 900,
            boxShadow: "0 10px 24px rgba(37,99,235,0.08)",
          }}
        >
          {step}
        </div>
        <div
          aria-hidden="true"
          style={{
            width: 2,
            minHeight: 72,
            borderRadius: 999,
            background: "linear-gradient(180deg, #bfdbfe 0%, #e2e8f0 100%)",
          }}
        />
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          borderRadius: 24,
          padding: 18,
          boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "start",
          }}
        >
          <div style={{ maxWidth: 780 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              Step {step}
            </div>
            <div
              style={{
                fontSize: 24,
                lineHeight: 1.2,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {title}
            </div>
            {description ? (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#475569",
                }}
              >
                {description}
              </div>
            ) : null}
          </div>

          {badge ? (
            <div
              style={{
                minHeight: 32,
                padding: "0 12px",
                borderRadius: 999,
                border: "1px solid #dbeafe",
                background: "#eff6ff",
                color: "#1d4ed8",
                fontSize: 12,
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              {badge}
            </div>
          ) : null}
        </div>

        {helperText ? (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            {helperText}
          </div>
        ) : null}

        <div>{children}</div>
      </div>
    </section>
  );
}
