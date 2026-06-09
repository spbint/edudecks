"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import { SETUP_REDIRECT_LOOP_KEY, clearLocalSessionForAccountSwitch } from "@/lib/authSessionEscape";
import {
  BLOCKED_SETUP_ROUTE_KEY,
  type CleanSetupStepId,
  hasRequiredLearningSettings,
} from "@/lib/clean/setup/setupFlow";
import { completeFamilySignOut } from "@/lib/familySignOut";

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

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

function clearRedirectLoopCounter() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SETUP_REDIRECT_LOOP_KEY);
}

function recordSetupRedirect() {
  if (typeof window === "undefined") return false;

  const now = Date.now();
  const windowMs = 10_000;
  let timestamps: number[] = [];

  try {
    const raw = window.sessionStorage.getItem(SETUP_REDIRECT_LOOP_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    timestamps = Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "number" && now - item < windowMs)
      : [];
  } catch {
    timestamps = [];
  }

  const nextTimestamps = [...timestamps, now];
  window.sessionStorage.setItem(SETUP_REDIRECT_LOOP_KEY, JSON.stringify(nextTimestamps));
  return nextTimestamps.length > 4;
}

function defer(callback: () => void) {
  window.setTimeout(callback, 0);
}

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
  const [loopDetected, setLoopDetected] = useState(false);
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
      clearRedirectLoopCounter();
      return;
    }

    if (profileMissing) {
      if (recordSetupRedirect()) {
        defer(() => setLoopDetected(true));
        return;
      }
      window.localStorage.setItem(BLOCKED_SETUP_ROUTE_KEY, pathname);
      setCurrentSetupStep("profile");
      router.replace(pathname.startsWith("/clean-my-") ? "/clean-my-profile" : "/my-profile");
      return;
    }

    if (settingsMissing) {
      if (recordSetupRedirect()) {
        defer(() => setLoopDetected(true));
        return;
      }
      window.localStorage.setItem(BLOCKED_SETUP_ROUTE_KEY, pathname);
      setCurrentSetupStep("settings");
      router.replace(pathname.startsWith("/clean-my-") ? "/clean-my-settings" : "/my-settings");
      return;
    }

    window.localStorage.removeItem(BLOCKED_SETUP_ROUTE_KEY);
    clearRedirectLoopCounter();
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

  if (loopDetected) {
    return (
      <section style={cardStyle}>
        <div style={{ display: "grid", gap: 6 }}>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
            We&apos;re having trouble loading your setup
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            MyLearna seems to be moving between setup pages. You can try again, go
            back to your profile, or sign out and start again.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => {
              clearRedirectLoopCounter();
              setLoopDetected(false);
              router.refresh();
            }}
          >
            Try again
          </button>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => {
              clearRedirectLoopCounter();
              setLoopDetected(false);
              router.push("/my-profile");
            }}
          >
            Go to My Profile
          </button>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => {
              clearLocalSessionForAccountSwitch();
              void completeFamilySignOut()
                .catch(() => null)
                .finally(() => {
                  window.location.replace("/start-free");
                });
            }}
          >
            Sign out and start again
          </button>
        </div>
      </section>
    );
  }

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
