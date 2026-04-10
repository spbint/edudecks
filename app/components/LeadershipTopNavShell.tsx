"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildLeadershipFocusNext,
  buildLeadershipSupportPressure,
  leadershipConfidence,
  leadershipMomentum,
  loadLeadershipDashboard,
} from "@/lib/leadershipWorkspace";
import type { LeadershipDashboard } from "@/lib/leadershipWorkspace";

function chipStyle(
  tone: "neutral" | "info" | "warning" | "success"
): React.CSSProperties {
  const tones = {
    neutral: { bg: "#f8fafc", fg: "#475569", bd: "#e2e8f0" },
    info: { bg: "#eff6ff", fg: "#1d4ed8", bd: "#bfdbfe" },
    warning: { bg: "#fff7ed", fg: "#c2410c", bd: "#fdba74" },
    success: { bg: "#ecfdf5", fg: "#047857", bd: "#86efac" },
  };
  const t = tones[tone];
  return {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: `1px solid ${t.bd}`,
    background: t.bg,
    color: t.fg,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };
}

export default function LeadershipTopNavShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<LeadershipDashboard | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const next = await loadLeadershipDashboard();
        if (!mounted) return;
        setData(next);
      } catch {
        if (!mounted) return;
        setData(null);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const momentum = useMemo(() => leadershipMomentum(data), [data]);
  const confidence = useMemo(() => leadershipConfidence(data), [data]);
  const focusNext = useMemo(() => buildLeadershipFocusNext(data), [data]);
  const supportPressure = useMemo(() => buildLeadershipSupportPressure(data), [data]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section
        style={{
          border: "1px solid #dbeafe",
          background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
          borderRadius: 22,
          padding: 20,
          display: "grid",
          gap: 14,
          boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Leadership workspace
            </div>
            <div
              style={{
                fontSize: "clamp(1.6rem, 2.8vw, 2.3rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                color: "#0f172a",
              }}
            >
              School command centre
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
              Keep the school view calm, visible, and easy to act on. This surface is for the next class-level leadership move, not a dashboard wall.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/teacher"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 38,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#0f172a",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Teacher view
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={chipStyle("neutral")}>
            {(data?.class_risk.length ?? 0)} class{(data?.class_risk.length ?? 0) === 1 ? "" : "es"}
          </span>
          <span style={chipStyle(momentum.tone)}>{momentum.label}</span>
          <span style={chipStyle(confidence.tone)}>{confidence.label}</span>
        </div>

        {focusNext ? (
          <div style={{ display: "grid", gap: 6, maxWidth: 780 }}>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "#334155" }}>
              <span style={{ fontWeight: 800, color: "#0f172a" }}>Best next move:</span>{" "}
              {focusNext.label}. {focusNext.reason}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: 12, lineHeight: 1.45, color: "#64748b" }}>
                Why this now: it is the quickest class-level move to steady school visibility.
              </div>
              <Link
                href={focusNext.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 30,
                  padding: "0 10px",
                  borderRadius: 999,
                  background: "#1d4ed8",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                {focusNext.chip}
              </Link>
            </div>
          </div>
        ) : null}

        {supportPressure ? (
          <div style={{ fontSize: 12, lineHeight: 1.5, color: "#64748b" }}>
            Support pressure: {supportPressure}
          </div>
        ) : null}
      </section>

      {children}
    </div>
  );
}
