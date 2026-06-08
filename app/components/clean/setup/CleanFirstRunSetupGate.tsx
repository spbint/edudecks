"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import {
  BLOCKED_SETUP_ROUTE_KEY,
  type CleanSetupStepId,
  hasRequiredLearningSettings,
} from "@/lib/clean/setup/setupFlow";

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

function isDownstreamOfSettings(stepId: CleanSetupStepId) {
  return !["profile", "settings"].includes(stepId);
}

export default function CleanFirstRunSetupGate({
  currentStep,
}: {
  currentStep: CleanSetupStepId;
}) {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname() || "";
  const router = useRouter();
  const { enabled, hydrated, setupStatus, setCurrentSetupStep } = useGuidance();
  const setupIsRunning =
    hydrated && enabled && (setupStatus === "not_started" || setupStatus === "active");
  const profileMissing =
    !workspace.loading &&
    !workspace.schemaMissing &&
    isDownstreamOfProfile(currentStep) &&
    !workspace.profile;
  const settingsMissing =
    !workspace.loading &&
    !workspace.schemaMissing &&
    isDownstreamOfSettings(currentStep) &&
    workspace.profile &&
    !hasRequiredLearningSettings(workspace.profile);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!setupIsRunning || workspace.loading || workspace.schemaMissing) {
      window.localStorage.removeItem(BLOCKED_SETUP_ROUTE_KEY);
      return;
    }

    if (profileMissing) {
      window.localStorage.setItem(BLOCKED_SETUP_ROUTE_KEY, pathname);
      setCurrentSetupStep("profile");
      router.replace(pathname.startsWith("/clean-my-") ? "/clean-my-profile" : "/my-profile");
      return;
    }

    if (settingsMissing) {
      window.localStorage.setItem(BLOCKED_SETUP_ROUTE_KEY, pathname);
      setCurrentSetupStep("settings");
      router.replace(pathname.startsWith("/clean-my-") ? "/clean-my-settings" : "/my-settings");
      return;
    }

    window.localStorage.removeItem(BLOCKED_SETUP_ROUTE_KEY);
  }, [
    pathname,
    profileMissing,
    router,
    setCurrentSetupStep,
    settingsMissing,
    setupIsRunning,
    workspace.loading,
    workspace.schemaMissing,
  ]);

  if (!setupIsRunning || workspace.loading || workspace.schemaMissing) return null;

  if (profileMissing) {
    return (
      <section style={cardStyle}>
        <div style={{ display: "grid", gap: 6 }}>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
            Create your family profile first
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            MyLearna needs your family profile before this setup step can work.
          </p>
        </div>
        <Link href="/my-profile" style={buttonStyle}>
          Go to My Profile
        </Link>
      </section>
    );
  }

  if (settingsMissing) {
    return (
      <section style={cardStyle}>
        <div style={{ display: "grid", gap: 6 }}>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
            Choose your learning settings first
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            Save country, region, curriculum and reporting settings before continuing.
          </p>
        </div>
        <Link href="/my-settings" style={buttonStyle}>
          Go to My Settings
        </Link>
      </section>
    );
  }

  return null;
}
