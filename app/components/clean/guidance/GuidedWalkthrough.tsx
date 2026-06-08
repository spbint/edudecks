"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import { WELCOME_TOUR_STEPS } from "@/app/components/clean/guidance/guidanceTours";

type AnchorRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

const baseButtonStyle: React.CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 800,
  padding: "10px 14px",
};

const primaryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  background: "#1d4ed8",
  borderColor: "#1d4ed8",
  color: "#ffffff",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  background: "#ffffff",
  color: "#1d4ed8",
};

const quietButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  background: "transparent",
  borderColor: "transparent",
  color: "#475569",
};

function findGuidanceAnchor(anchorId?: string) {
  if (!anchorId || typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[data-guidance-id="${anchorId}"]`);
}

export default function GuidedWalkthrough() {
  const {
    activeStep,
    activeStepIndex,
    enabled,
    finishWelcomeTour,
    goToStep,
    hydrated,
    isGuidanceRoute,
    showWelcomePrompt,
    skipWelcomeTour,
    startWelcomeTour,
  } = useGuidance();
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);

  const isLastStep = activeStepIndex >= WELCOME_TOUR_STEPS.length - 1;

  useEffect(() => {
    if (!activeStep?.anchorId || !enabled || !isGuidanceRoute) {
      return;
    }

    function updateAnchorRect() {
      const anchor = findGuidanceAnchor(activeStep?.anchorId);
      if (!anchor) {
        setAnchorRect(null);
        return;
      }
      const rect = anchor.getBoundingClientRect();
      setAnchorRect({
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      });
    }

    const anchor = findGuidanceAnchor(activeStep.anchorId);
    anchor?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    window.setTimeout(updateAnchorRect, 250);
    window.addEventListener("resize", updateAnchorRect);
    window.addEventListener("scroll", updateAnchorRect, true);
    return () => {
      window.removeEventListener("resize", updateAnchorRect);
      window.removeEventListener("scroll", updateAnchorRect, true);
    };
  }, [activeStep, enabled, isGuidanceRoute]);

  useEffect(() => {
    if (!activeStep) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        skipWelcomeTour();
      }
      if (event.key === "Enter") {
        if (isLastStep) {
          finishWelcomeTour();
        } else {
          goToStep(activeStepIndex + 1);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStep, activeStepIndex, finishWelcomeTour, goToStep, isLastStep, skipWelcomeTour]);

  const stepPositionLabel = useMemo(
    () => `Step ${activeStepIndex + 1} of ${WELCOME_TOUR_STEPS.length}`,
    [activeStepIndex],
  );
  const visibleAnchorRect = activeStep?.anchorId ? anchorRect : null;

  if (!hydrated || !enabled || !isGuidanceRoute) return null;

  if (showWelcomePrompt && !activeStep) {
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
          width: "min(420px, calc(100vw - 36px))",
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
            Guidance mode
          </div>
          <h2 id="guidance-welcome-heading" style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
            Welcome to MyLearna
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            Would you like a quick guided tour?
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => startWelcomeTour()} style={primaryButtonStyle}>
            Guide me through MyLearna
          </button>
          <button type="button" onClick={skipWelcomeTour} style={secondaryButtonStyle}>
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  if (!activeStep) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.18)",
        }}
      />
      {visibleAnchorRect ? (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: Math.max(visibleAnchorRect.left - 8, 8),
            top: Math.max(visibleAnchorRect.top - 8, 8),
            width: Math.min(visibleAnchorRect.width + 16, window.innerWidth - 16),
            height: visibleAnchorRect.height + 16,
            border: "3px solid #2563eb",
            borderRadius: 18,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.26)",
          }}
        />
      ) : null}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guidance-step-heading"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 18,
          transform: "translateX(-50%)",
          width: "min(560px, calc(100vw - 32px))",
          border: "1px solid #bfdbfe",
          borderRadius: 20,
          background: "#ffffff",
          boxShadow: "0 22px 56px rgba(15, 23, 42, 0.22)",
          padding: 20,
          pointerEvents: "auto",
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                border: "1px solid #bfdbfe",
                borderRadius: 999,
                color: "#1d4ed8",
                fontSize: 12,
                fontWeight: 900,
                padding: "5px 9px",
              }}
            >
              Guidance mode
            </span>
            <span style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>
              {stepPositionLabel}
            </span>
          </div>
          <h2 id="guidance-step-heading" style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
            {activeStep.title}
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.65 }}>{activeStep.body}</p>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
          <button type="button" onClick={skipWelcomeTour} style={quietButtonStyle}>
            Skip for now
          </button>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {activeStepIndex > 0 ? (
              <button type="button" onClick={() => goToStep(activeStepIndex - 1)} style={secondaryButtonStyle}>
                Back
              </button>
            ) : null}
            {isLastStep ? (
              <button type="button" onClick={finishWelcomeTour} style={primaryButtonStyle}>
                Finish tour
              </button>
            ) : (
              <button type="button" onClick={() => goToStep(activeStepIndex + 1)} style={primaryButtonStyle}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
