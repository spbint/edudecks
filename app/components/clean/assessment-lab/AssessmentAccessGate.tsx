"use client";

import Link from "next/link";
import React from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import {
  canAccessAssessmentLab,
  canAccessLegacyAssessments,
} from "@/lib/clean/assessments/assessmentPermissions";

type AssessmentAccessGateProps = {
  mode: "lab" | "legacy";
  children: React.ReactNode;
};

const cardStyle: React.CSSProperties = {
  minHeight: "60vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "#F8FAFC",
};

const panelStyle: React.CSSProperties = {
  width: "min(100%, 720px)",
  border: "1px solid #E7EAF2",
  borderRadius: 22,
  background: "#ffffff",
  padding: "clamp(20px, 4vw, 34px)",
  boxShadow: "0 18px 44px rgba(23,32,75,0.08)",
  display: "grid",
  gap: 14,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
  width: "fit-content",
};

function AccessDeniedPanel({ mode }: { mode: "lab" | "legacy" }) {
  return (
    <main style={cardStyle}>
      <section style={panelStyle} role="status" aria-live="polite">
        <span
          style={{
            color: "#6C4DF6",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Staff only
        </span>
        <h1 style={{ margin: 0, color: "#17204B", fontSize: "clamp(26px, 4vw, 36px)" }}>
          {mode === "lab" ? "Staff assessment workspace" : "Assessment unavailable"}
        </h1>
        <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
          {mode === "lab"
            ? "This workspace is available only to authorised MyLearna staff."
            : "This assessment entry is not available from the current learning pathway."}
        </p>
        <Link href="/my-pathways" style={buttonStyle}>
          Return to My Pathways
        </Link>
      </section>
    </main>
  );
}

export default function AssessmentAccessGate({ mode, children }: AssessmentAccessGateProps) {
  const { user, profile, loading } = useAuthUser();
  const viewer = {
    id: user?.id ?? null,
    email: user?.email ?? null,
    isAdmin: profile?.is_admin ?? false,
  };
  const allowed =
    mode === "lab"
      ? canAccessAssessmentLab(viewer, profile)
      : canAccessLegacyAssessments(viewer, profile);

  if (loading) {
    return (
      <main style={cardStyle}>
        <section style={panelStyle} role="status">
          Loading assessment access...
        </section>
      </main>
    );
  }

  if (!allowed) return <AccessDeniedPanel mode={mode} />;

  return <>{children}</>;
}
