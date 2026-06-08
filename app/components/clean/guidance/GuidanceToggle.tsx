"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useGuidance, type GuidanceTourId } from "@/app/components/clean/guidance/GuidanceProvider";
import { useDriverTour } from "@/app/components/clean/guidance/useDriverTour";

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
  const { enabled, hydrated, isGuidanceRoute, showWelcomePrompt, skipWelcomeGuidance, startWelcomeGuidance } =
    useGuidance();

  if (!hydrated || !enabled || !isGuidanceRoute || !showWelcomePrompt) return null;

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
          Let&apos;s get MyLearna ready for your family.
        </h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Start with your family profile, then move through settings, planning,
          pathways, capture, portfolios, reports and outputs.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={startWelcomeGuidance} style={primaryButtonStyle}>
          Start setup
        </button>
        <button type="button" onClick={skipWelcomeGuidance} style={secondaryButtonStyle}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

export function GuidanceSettingsCard() {
  const {
    enabled,
    resetDismissedTips,
    resetSetupChecklist,
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

  function restartSetupJourney() {
    resetSetupChecklist();
    restartGuidance();
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
        <button type="button" onClick={restartGuidance} style={secondaryButtonStyle}>
          Restart welcome guidance
        </button>
        <button type="button" onClick={restartSetupJourney} style={secondaryButtonStyle}>
          Restart setup checklist
        </button>
        <button type="button" onClick={resetDismissedTips} style={secondaryButtonStyle}>
          Reset completed guidance
        </button>
      </div>
    </section>
  );
}

export function GuidancePageAction({ tourId }: { tourId: GuidanceTourId }) {
  const { enabled, hydrated, isGuidanceRoute } = useGuidance();
  const startTour = useDriverTour();

  if (!hydrated || !enabled || !isGuidanceRoute) return null;

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

type SetupChecklistItem = {
  id: string;
  label: string;
  href: string;
  tourId: GuidanceTourId;
};

const checklistItems: SetupChecklistItem[] = [
  { id: "profile", label: "Set up family profile", href: "/my-profile", tourId: "my-profile" },
  { id: "settings", label: "Choose learning settings", href: "/my-settings", tourId: "my-settings" },
  { id: "calendar", label: "Plan your week", href: "/my-calendar", tourId: "my-calendar" },
  { id: "day", label: "Review My Day", href: "/my-day", tourId: "my-day" },
  { id: "pathways", label: "Explore My Pathways", href: "/my-pathways", tourId: "my-pathways" },
  { id: "capture", label: "Capture first evidence", href: "/my-capture", tourId: "my-capture" },
  { id: "portfolio", label: "Review portfolio", href: "/my-portfolio", tourId: "my-portfolio" },
  { id: "reports", label: "Preview reports", href: "/my-reports", tourId: "my-reports" },
  { id: "outputs", label: "Prepare and download outputs", href: "/my-outputs", tourId: "my-outputs" },
];

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
    hydrated,
    isGuidanceRoute,
    setCurrentSetupStep,
    setupChecklist,
    toggleSetupStepComplete,
  } = useGuidance();
  const pathname = usePathname() || "";
  const startTour = useDriverTour();

  if (!hydrated || !enabled || !isGuidanceRoute) return null;

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
                style={{ ...secondaryButtonStyle, textDecoration: "none", padding: "8px 11px" }}
              >
                Open
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
              <button
                type="button"
                onClick={() => toggleSetupStepComplete(item.id)}
                style={{ ...secondaryButtonStyle, padding: "8px 11px" }}
              >
                {setupChecklist.includes(item.id) ? "Mark incomplete" : "Mark complete"}
              </button>
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
  const { enabled, hydrated, isGuidanceRoute } = useGuidance();
  const pathname = usePathname() || "";
  const startTour = useDriverTour();

  useEffect(() => {
    if (!hydrated || !enabled || !isGuidanceRoute || typeof window === "undefined") {
      return;
    }

    const pendingTour = window.localStorage.getItem(PENDING_TOUR_KEY) as GuidanceTourId | null;
    if (!pendingTour || !tourMatchesPathname(pendingTour, pathname)) {
      return;
    }

    window.localStorage.removeItem(PENDING_TOUR_KEY);
    const timeoutId = window.setTimeout(() => startTour(pendingTour), 350);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, hydrated, isGuidanceRoute, pathname, startTour]);

  return null;
}
