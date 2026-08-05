"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useGuidance, type GuidanceTourId } from "@/app/components/clean/guidance/GuidanceProvider";
import { COACH_OPEN_EVENT } from "@/app/components/clean/coach/MyLearnaCoachProvider";
import { useDriverTour } from "@/app/components/clean/guidance/useDriverTour";
import {
  BLOCKED_SETUP_ROUTE_KEY,
  CLEAN_SETUP_STEPS,
  type CleanSetupStepId,
  getSetupStep,
  getSetupStepNumber,
} from "@/lib/clean/setup/setupFlow";

const PENDING_TOUR_KEY = "mylearna.guidance.pendingTour";

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  background: "#ffffff",
  color: "#1d4ed8",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 800,
  padding: "10px 14px",
};

const primaryButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  background: "#1d4ed8",
  borderColor: "#1d4ed8",
  color: "#ffffff",
};

export function GuidanceWelcomePrompt() {
  const { enabled, guidedStartActive, hydrated, isGuidanceRoute, showWelcomePrompt, skipWelcomeGuidance, startWelcomeGuidance } =
    useGuidance();

  if (!hydrated || !enabled || guidedStartActive || !isGuidanceRoute || !showWelcomePrompt) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="guidance-welcome-heading"
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 80,
        width: "min(430px, calc(100vw - 36px))",
        border: "1px solid #bfdbfe",
        borderRadius: 18,
        background: "#ffffff",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
        padding: 18,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            color: "#1d4ed8",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Guidance
        </div>
        <h2 id="guidance-welcome-heading" style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
          Let&apos;s set up MyLearna together
        </h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          I&apos;ll guide you one step at a time. You can pause whenever you need.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={startWelcomeGuidance} style={primaryButtonStyle}>
          Start guided setup
        </button>
        <button type="button" onClick={skipWelcomeGuidance} style={secondaryButtonStyle}>
          Not now
        </button>
      </div>
    </div>
  );
}

export function GuidanceSettingsCard() {
  const {
    enabled,
    resetDismissedTips,
    restartGuidance,
    setGuidanceEnabled,
  } = useGuidance();
  const [confirmDisable, setConfirmDisable] = useState(false);

  function handleToggle(nextEnabled: boolean) {
    if (!nextEnabled) {
      setConfirmDisable(true);
      return;
    }

    setConfirmDisable(false);
    setGuidanceEnabled(true);
  }

  function turnGuidanceOff() {
    setConfirmDisable(false);
    setGuidanceEnabled(false);
  }

  return (
    <section
      data-guidance-id="settings-guidance-toggle"
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 18,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
          Guidance and walkthroughs
        </h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Guidance helps new users get MyLearna ready for their family. You can
          follow the setup steps, restart guidance, or turn tips off when you feel
          confident.
        </p>
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "#0f172a",
          fontWeight: 800,
        }}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => handleToggle(event.target.checked)}
          style={{ width: 18, height: 18 }}
        />
        Show guidance tips
      </label>
      {confirmDisable ? (
        <div
          role="alertdialog"
          style={{
            border: "1px solid #fed7aa",
            borderRadius: 14,
            background: "#fff7ed",
            padding: 14,
            display: "grid",
            gap: 10,
          }}
        >
          <p style={{ margin: 0, color: "#7c2d12", lineHeight: 1.6, fontWeight: 700 }}>
            Are you sure you want to turn off guidance? You can restart the setup
            journey any time from My Settings.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setConfirmDisable(false)} style={primaryButtonStyle}>
              Keep guidance on
            </button>
            <button type="button" onClick={turnGuidanceOff} style={secondaryButtonStyle}>
              Turn guidance off
            </button>
          </div>
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(COACH_OPEN_EVENT))}
          style={primaryButtonStyle}
        >
          Show me what to do next
        </button>
        <button type="button" onClick={restartGuidance} style={secondaryButtonStyle}>
          Restart family setup guide
        </button>
        <button type="button" onClick={resetDismissedTips} style={secondaryButtonStyle}>
          Reset completed guidance
        </button>
      </div>
    </section>
  );
}

export function GuidancePageAction({ tourId }: { tourId: GuidanceTourId }) {
  const { enabled, guidedStartActive, hydrated, isGuidanceRoute, setupStatus } = useGuidance();
  const startTour = useDriverTour();

  if (!hydrated || !enabled || guidedStartActive || !isGuidanceRoute || setupStatus === "active") return null;

  return (
    <button
      type="button"
      onClick={() => startTour(tourId)}
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 999,
        background: "#eff6ff",
        color: "#1d4ed8",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 800,
        padding: "9px 12px",
      }}
    >
      Guide me through this page
    </button>
  );
}

type GuidanceSetupNextActionProps = {
  stepId: string;
  nextHref?: string;
  label: string;
  helperText?: string;
  disabled?: boolean;
  disabledText?: string;
  skipLabel?: string;
  finish?: boolean;
};

export function GuidanceSetupNextAction({
  stepId,
  nextHref,
  label,
  helperText,
  disabled = false,
  disabledText,
  skipLabel,
  finish = false,
}: GuidanceSetupNextActionProps) {
  const {
    completeSetupStep,
    enabled,
    hydrated,
    isGuidanceRoute,
    setupStatus,
    skipSetupStep,
  } = useGuidance();
  const router = useRouter();

  if (!hydrated || !enabled || !isGuidanceRoute || setupStatus !== "active") return null;

  function continueSetup() {
    if (disabled) return;
    completeSetupStep(stepId);
    if (nextHref) router.push(nextHref);
  }

  function skipSetup() {
    skipSetupStep(stepId);
    if (nextHref) router.push(nextHref);
  }

  return (
    <section
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 16,
        background: "#eff6ff",
        padding: 16,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: "#0f172a" }}>
          {finish ? "Finish setup" : "Next setup step"}
        </strong>
        {helperText ? (
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{helperText}</p>
        ) : null}
        {disabled && disabledText ? (
          <p style={{ margin: 0, color: "#b45309", lineHeight: 1.6, fontWeight: 700 }}>
            {disabledText}
          </p>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={continueSetup}
          disabled={disabled}
          style={{
            ...primaryButtonStyle,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.55 : 1,
          }}
        >
          {label}
        </button>
        {skipLabel ? (
          <button type="button" onClick={skipSetup} style={secondaryButtonStyle}>
            {skipLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function GuidanceSetupProgress({
  stepId,
  title,
  body,
  task,
}: {
  stepId: string;
  title: string;
  body: string;
  task?: string;
}) {
  const { enabled, guidedStartActive, hydrated, isGuidanceRoute, setupStatus } = useGuidance();
  const pathname = usePathname();
  const blockedByPrerequisite =
    hydrated &&
    typeof window !== "undefined" &&
    window.localStorage.getItem(BLOCKED_SETUP_ROUTE_KEY) === pathname;

  if (!hydrated || !enabled || guidedStartActive || !isGuidanceRoute || setupStatus !== "active") return null;
  if (blockedByPrerequisite) return null;

  const step = getSetupStep(stepId);
  const stepNumber = getSetupStepNumber(stepId);

  return (
    <section
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 18,
        background: "#eff6ff",
        padding: 18,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          color: "#1d4ed8",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Getting started: Step {stepNumber} of {CLEAN_SETUP_STEPS.length}
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>{title}</h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{body}</p>
      </div>
      <p style={{ margin: 0, color: "#334155", fontWeight: 800 }}>
        Task: {task || step.requirement}
      </p>
    </section>
  );
}

type SetupChecklistItem = {
  id: CleanSetupStepId;
  label: string;
  href: string;
  tourId: GuidanceTourId;
};

const setupTourIds: Record<CleanSetupStepId, GuidanceTourId> = {
  profile: "my-profile",
  settings: "my-settings",
  calendar: "my-calendar",
  day: "my-day",
  pathways: "my-pathways",
  capture: "my-capture",
  portfolio: "my-portfolio",
  reports: "my-reports",
  outputs: "my-outputs",
};

const checklistItems: SetupChecklistItem[] = CLEAN_SETUP_STEPS.map((step) => ({
  id: step.id,
  label: step.id === "profile" ? "Set up family profile" : step.requirement,
  href: step.route,
  tourId: setupTourIds[step.id],
}));

function getChecklistStatus(
  item: SetupChecklistItem,
  completedIds: string[],
  currentSetupStep: string,
) {
  if (completedIds.includes(item.id)) return "complete";
  if (currentSetupStep === item.id) return "current";
  return "not started";
}

function getStatusStyles(status: string): React.CSSProperties {
  if (status === "complete") {
    return { background: "#ecfdf5", borderColor: "#bbf7d0", color: "#166534" };
  }
  if (status === "current") {
    return { background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" };
  }
  return { background: "#f8fafc", borderColor: "#e2e8f0", color: "#64748b" };
}

export function GuidanceGettingStartedCard() {
  const {
    currentSetupStep,
    enabled,
    guidedStartActive,
    hydrated,
    isGuidanceRoute,
    setCurrentSetupStep,
    setupStatus,
    setupChecklist,
  } = useGuidance();
  const pathname = usePathname() || "";
  const startTour = useDriverTour();

  if (!hydrated || !enabled || guidedStartActive || !isGuidanceRoute || setupStatus !== "active") return null;

  const completedCount = setupChecklist.length;

  return (
    <section
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 18,
        background: "#ffffff",
        padding: 18,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            color: "#1d4ed8",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Getting started
        </div>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
          Let&apos;s set up MyLearna
        </h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Follow these steps to get MyLearna ready for your family. You can skip
          this and come back any time from My Settings.
        </p>
        <p style={{ margin: 0, color: "#64748b", fontSize: 13, fontWeight: 800 }}>
          {completedCount} of {checklistItems.length} setup steps complete
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {checklistItems.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              color: "#0f172a",
              display: "grid",
              gap: 10,
              padding: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <strong>{item.label}</strong>
              <span
                style={{
                  border: "1px solid",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 900,
                  padding: "4px 7px",
                  whiteSpace: "nowrap",
                  ...getStatusStyles(getChecklistStatus(item, setupChecklist, currentSetupStep)),
                }}
              >
                {getChecklistStatus(item, setupChecklist, currentSetupStep)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link
                href={item.href}
                onClick={() => setCurrentSetupStep(item.id)}
                style={{
                  ...(currentSetupStep === item.id ? primaryButtonStyle : secondaryButtonStyle),
                  textDecoration: "none",
                  padding: "8px 11px",
                }}
              >
                {currentSetupStep === item.id ? "Continue" : "Open"}
              </Link>
              {pathname === item.href ? (
                <button
                  type="button"
                  onClick={() => startTour(item.tourId)}
                  style={{ ...primaryButtonStyle, padding: "8px 11px" }}
                >
                  Guide me
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function tourMatchesPathname(tourId: GuidanceTourId, pathname: string) {
  const item = checklistItems.find((candidate) => candidate.tourId === tourId);
  if (!item) return false;

  const cleanHref = item.href.replace("/my-", "/clean-my-");
  return pathname === item.href || pathname === cleanHref;
}

export function GuidancePendingTourLauncher() {
  const {
    completedTours,
    currentSetupStep,
    enabled,
    guidedStartActive,
    hydrated,
    isGuidanceRoute,
    setupActive,
  } = useGuidance();
  const pathname = usePathname() || "";
  const startTour = useDriverTour();

  useEffect(() => {
    if (!hydrated || !enabled || guidedStartActive || !isGuidanceRoute || typeof window === "undefined") {
      return;
    }

    const blockedRoute = window.localStorage.getItem(BLOCKED_SETUP_ROUTE_KEY);
    if (blockedRoute === pathname) {
      return;
    }

    const pendingTour = window.localStorage.getItem(PENDING_TOUR_KEY) as GuidanceTourId | null;
    const activeSetupItem = checklistItems.find((item) => item.id === currentSetupStep);
    const tourToStart =
      pendingTour && tourMatchesPathname(pendingTour, pathname)
        ? pendingTour
        : setupActive &&
            activeSetupItem &&
            tourMatchesPathname(activeSetupItem.tourId, pathname) &&
            !completedTours.includes(activeSetupItem.tourId)
          ? activeSetupItem.tourId
          : null;

    if (!tourToStart) {
      return;
    }

    window.localStorage.removeItem(PENDING_TOUR_KEY);
    const timeoutId = window.setTimeout(() => startTour(tourToStart), 550);

    return () => window.clearTimeout(timeoutId);
  }, [
    completedTours,
    currentSetupStep,
    enabled,
    guidedStartActive,
    hydrated,
    isGuidanceRoute,
    pathname,
    setupActive,
    startTour,
  ]);

  return null;
}
