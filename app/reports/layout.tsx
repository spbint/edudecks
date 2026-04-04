"use client";

import React from "react";
import Link from "next/link";
import FamilyWorkflowStrip from "@/app/components/FamilyWorkflowStrip";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#f6f8fc" }}>
      <div
        style={{
          borderBottom: "1px solid #e5e7eb",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1380,
            margin: "0 auto",
            padding: "14px 20px 16px",
            display: "grid",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Link
                href="/family"
                style={{ color: "#0f172a", fontWeight: 900, textDecoration: "none" }}
              >
                EduDecks Family
              </Link>
              <span style={{ color: "#94a3b8" }}>/</span>
              <span style={{ color: "#475569", fontWeight: 700 }}>Reports workflow</span>
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#64748b",
              }}
            >
              Keep the whole family journey visible while you build and review reports.
            </div>
          </div>

          <FamilyWorkflowStrip />
        </div>
      </div>

      {children}
    </div>
  );
}
