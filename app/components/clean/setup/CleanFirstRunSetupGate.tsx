"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import type { CleanSetupStepId } from "@/lib/clean/setup/setupFlow";

const cardStyle: React.CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
  display: "grid",
  gap: 12,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #1d4ed8",
  background: "#1d4ed8",
  color: "#ffffff",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
  width: "fit-content",
};

function isDownstreamOfProfile(stepId: CleanSetupStepId) {
  return stepId !== "profile";
}

export default function CleanFirstRunSetupGate({
  currentStep,
}: {
  currentStep: CleanSetupStepId;
}) {
  const workspace = useCleanFamilyWorkspace();
  const { enabled, guidedStartActive, hydrated, setupStatus, setCurrentSetupStep } = useGuidance();
  const setupIsRunning =
    hydrated && enabled && (setupStatus === "not_started" || setupStatus === "active");
  const profileMissing =
    !workspace.loading &&
    !workspace.schemaMissing &&
    isDownstreamOfProfile(currentStep) &&
    !workspace.profile;
  useEffect(() => {
    if (profileMissing) {
      setCurrentSetupStep("profile");
    }
  }, [profileMissing, setCurrentSetupStep]);

  if (!setupIsRunning || guidedStartActive || workspace.loading || workspace.schemaMissing) return null;

  if (profileMissing) {
    return (
      <section style={cardStyle}>
        <div style={{ display: "grid", gap: 6 }}>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
            Create your family profile first
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            Create your family profile when you are ready. You can still look
            around MyLearna from here.
          </p>
        </div>
        <Link href="/my-profile" style={buttonStyle}>
          Go to My Profile
        </Link>
      </section>
    );
  }

  return null;
}
