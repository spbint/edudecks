"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import {
  deriveGuidedStartStep,
  getGuidedStartStepNumber,
  getGuidedStartStorageKey,
  GUIDED_START_FAMILY_SETUP_ID,
  GUIDED_START_TARGETS,
  isGuidedStartComplete,
  isGuidedStartProfileRoute,
  isGuidedStartSettingsRoute,
  readGuidedStartState,
  reconcileGuidedStartState,
  shouldAutoOfferGuidedStart,
  type GuidedStartPersistedState,
  type GuidedStartStep,
  writeGuidedStartState,
} from "@/app/components/clean/guidance/guidedMissions";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";

type TargetRect = { top: number; left: number; width: number; height: number };

const stepCopy: Record<Exclude<GuidedStartStep, "welcome" | "complete">, { title: string; body: string }> = {
  "family-details": {
    title: "Start with your family",
    body: "Add the basic details MyLearna needs to organise planning, evidence, portfolios and reports.",
  },
  "first-learner": {
    title: "Add your first learner",
    body: "Each learner gets their own pathways, evidence, Portfolio and reports.",
  },
  "continue-settings": {
    title: "Your family space is ready",
    body: "Next, choose the learning and reporting settings that suit your family.",
  },
};

function presentationForViewport(width: number): "mobile" | "desktop" {
  return width <= 720 ? "mobile" : "desktop";
}

function targetSelector(guidanceId: string) {
  return `[data-guidance-id="${guidanceId}"]`;
}

function GuidedStartFamilySetup() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user } = useAuthUser();
  const workspace = useCleanFamilyWorkspace();
  const guidance = useGuidance();
  const [state, setState] = useState<GuidedStartPersistedState | null>(null);
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [presentation, setPresentation] = useState<"mobile" | "desktop">(() =>
    typeof window === "undefined" ? "desktop" : presentationForViewport(window.innerWidth),
  );
  const [completionNotice, setCompletionNotice] = useState(false);
  const scrolledTargetRef = useRef<string | null>(null);

  const storageKey = user?.id ? getGuidedStartStorageKey(user.id) : null;
  const realStep = deriveGuidedStartStep({
    hasProfile: Boolean(workspace.profile),
    learnerCount: workspace.learners.length,
    pathname,
  });
  const missionRoute = isGuidedStartProfileRoute(pathname) || isGuidedStartSettingsRoute(pathname);
  const canConsiderMission =
    guidance.enabled &&
    guidance.hydrated &&
    hydratedStorageKey === storageKey &&
    missionRoute &&
    !workspace.loading &&
    !workspace.setupLoading &&
    !workspace.schemaMissing &&
    !workspace.error;

  const autoOfferWelcome = shouldAutoOfferGuidedStart({
    guidanceEnabled: guidance.enabled,
    guidanceHydrated: guidance.hydrated,
    workspaceLoading: workspace.loading,
    setupLoading: workspace.setupLoading,
    schemaMissing: workspace.schemaMissing,
    error: workspace.error,
    hasProfile: Boolean(workspace.profile),
    learnerCount: workspace.learners.length,
    persistedState: state,
  });

  useEffect(() => {
    guidance.setGuidedStartActive(
      Boolean(canConsiderMission && state?.status === "active"),
    );
  }, [canConsiderMission, guidance, state?.status]);

  const saveState = useCallback(
    (nextState: GuidedStartPersistedState) => {
      if (storageKey && typeof window !== "undefined") {
        writeGuidedStartState(window.localStorage, storageKey, nextState);
      }
      queueMicrotask(() => setState(nextState));
    },
    [storageKey],
  );

  const emit = useCallback(
    (eventName: "guided_start_started" | "guided_start_step_viewed" | "guided_start_step_completed" | "guided_start_paused" | "guided_start_resumed" | "guided_start_completed", step: GuidedStartStep) => {
      trackProductEvent(eventName, {
        mission: GUIDED_START_FAMILY_SETUP_ID,
        step,
        route: pathname,
        presentation,
      });
    },
    [pathname, presentation],
  );

  useEffect(() => {
    if (!guidance.hydrated || !storageKey || typeof window === "undefined" || workspace.loading || workspace.setupLoading) return;

    const stored = readGuidedStartState(window.localStorage, storageKey);
    const nextState = reconcileGuidedStartState({
      persistedState: stored,
      hasProfile: Boolean(workspace.profile),
      learnerCount: workspace.learners.length,
      pathname,
    });
    queueMicrotask(() => {
      setState(nextState);
      setHydratedStorageKey(storageKey);
      if (JSON.stringify(stored) !== JSON.stringify(nextState)) {
        writeGuidedStartState(window.localStorage, storageKey, nextState);
      }
    });
  }, [guidance.hydrated, pathname, realStep, storageKey, workspace.learners.length, workspace.loading, workspace.profile, workspace.setupLoading]);

  useEffect(() => {
    if (!guidance.enabled && state?.status === "active") {
      queueMicrotask(() => {
        saveState({ ...state, status: "paused", welcomeDismissed: true });
        guidance.setSetupStatus("skipped");
      });
    }
  }, [guidance.enabled, guidance, saveState, state]);

  useEffect(() => {
    if (!storageKey) return;
    const handleRestart = () => {
      const nextStep = deriveGuidedStartStep({
        hasProfile: Boolean(workspace.profile),
        learnerCount: workspace.learners.length,
        pathname,
      });
      saveState({ status: "active", step: nextStep, welcomeDismissed: true });
      guidance.setSetupStatus("active");
      emit("guided_start_resumed", nextStep);
    };
    window.addEventListener("mylearna:guided-start-restart", handleRestart);
    return () => window.removeEventListener("mylearna:guided-start-restart", handleRestart);
  }, [emit, guidance, pathname, saveState, storageKey, workspace.learners.length, workspace.profile]);

  useEffect(() => {
    if (!state || state.status !== "active" || !canConsiderMission) return;

    if (isGuidedStartComplete({ hasProfile: Boolean(workspace.profile), learnerCount: workspace.learners.length, pathname })) {
      saveState({ status: "completed", step: "complete", welcomeDismissed: true });
      guidance.setSetupStatus("completed");
      queueMicrotask(() => setCompletionNotice(true));
      emit("guided_start_completed", "complete");
      return;
    }

    const nextStep = realStep;
    if (state.step !== nextStep) {
      saveState({ ...state, step: nextStep });
      emit("guided_start_step_completed", state.step);
      emit("guided_start_step_viewed", nextStep);
    }
  }, [canConsiderMission, emit, guidance, pathname, realStep, saveState, state, workspace.learners.length, workspace.profile]);

  useEffect(() => {
    const handleResize = () => setPresentation(presentationForViewport(window.innerWidth));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeStep = state?.status === "active" ? state.step : null;
  const targetId = activeStep && activeStep in GUIDED_START_TARGETS
    ? GUIDED_START_TARGETS[activeStep as keyof typeof GUIDED_START_TARGETS]
    : null;

  useEffect(() => {
    if (!canConsiderMission || !activeStep || !targetId || !isGuidedStartProfileRoute(pathname)) {
      queueMicrotask(() => setTargetRect(null));
      return;
    }

    const selector = targetSelector(targetId);
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) {
      queueMicrotask(() => setTargetRect(null));
      return;
    }

    if (scrolledTargetRef.current !== targetId) {
      scrolledTargetRef.current = targetId;
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    const measure = () => {
      const rect = target.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const observer = new MutationObserver(measure);
    observer.observe(target, { attributes: true, childList: true, subtree: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      observer.disconnect();
    };
  }, [activeStep, canConsiderMission, pathname, targetId]);

  const pause = useCallback(() => {
    if (!state || (state.status !== "active" && state.status !== "not_started")) return;
    saveState({ ...state, status: "paused", welcomeDismissed: true });
    guidance.setSetupStatus("skipped");
    emit("guided_start_paused", state.step);
  }, [emit, guidance, saveState, state]);

  useEffect(() => {
    if (!activeStep && state?.status !== "not_started") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        pause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStep, pause, state?.status]);

  const start = useCallback(() => {
    const nextStep = deriveGuidedStartStep({
      hasProfile: Boolean(workspace.profile),
      learnerCount: workspace.learners.length,
      pathname,
    });
    saveState({ status: "active", step: nextStep, welcomeDismissed: true });
    guidance.setSetupStatus("active");
    emit("guided_start_started", "welcome");
    emit("guided_start_step_viewed", nextStep);
    if (!isGuidedStartProfileRoute(pathname)) {
      router.push(pathname.startsWith("/clean-") ? "/clean-my-profile" : "/my-profile");
    }
  }, [emit, guidance, pathname, router, saveState, workspace.learners.length, workspace.profile]);

  const resume = useCallback(() => {
    const nextStep = deriveGuidedStartStep({
      hasProfile: Boolean(workspace.profile),
      learnerCount: workspace.learners.length,
      pathname,
    });
    saveState({ status: "active", step: nextStep, welcomeDismissed: true });
    guidance.setSetupStatus("active");
    emit("guided_start_resumed", nextStep);
  }, [emit, guidance, pathname, saveState, workspace.learners.length, workspace.profile]);

  const welcomeVisible =
    canConsiderMission &&
    autoOfferWelcome &&
    state?.status === "not_started" &&
    isGuidedStartProfileRoute(pathname);
  const activeVisible =
    canConsiderMission &&
    state?.status === "active" &&
    activeStep !== "welcome" &&
    activeStep !== "complete";
  const completionVisible = canConsiderMission && completionNotice && state?.status === "completed";

  const calloutPosition = useMemo<React.CSSProperties>(() => {
    if (presentation === "mobile" || !targetRect) return {};
    const width = 380;
    const left = Math.max(14, Math.min(targetRect.left, window.innerWidth - width - 14));
    const top = targetRect.top + targetRect.height + 16;
    return { left, top: Math.min(top, window.innerHeight - 270) };
  }, [presentation, targetRect]);

  if (!welcomeVisible && !activeVisible && !completionVisible) return null;

  const visibleStep =
    activeStep === "family-details" || activeStep === "first-learner" || activeStep === "continue-settings"
      ? stepCopy[activeStep]
      : null;
  const stepLabel = activeStep ? `Step ${getGuidedStartStepNumber(activeStep)} of 4` : "Step 1 of 4";

  return (
    <>
      <style jsx global>{`
        .mylearna-guided-start-callout {
          position: fixed;
          z-index: 96;
          box-sizing: border-box;
          width: min(380px, calc(100vw - 28px));
          border: 1px solid #d8ccff;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 22px 56px rgba(23, 32, 75, 0.2);
          color: #17204b;
          padding: 18px;
          display: grid;
          gap: 12px;
        }
        .mylearna-guided-start-callout button,
        .mylearna-guided-start-callout a {
          min-height: 44px;
        }
        .mylearna-guided-start-target {
          position: fixed;
          z-index: 94;
          pointer-events: none;
          border: 3px solid #8b72ff;
          border-radius: 16px;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.34), 0 0 0 6px rgba(139, 114, 255, 0.16);
          transition: top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease;
        }
        @media (max-width: 720px) {
          .mylearna-guided-start-callout {
            left: 10px !important;
            right: 10px !important;
            bottom: calc(var(--mylearna-mobile-bottom-nav-height, 62px) + env(safe-area-inset-bottom, 0px) + 8px) !important;
            top: auto !important;
            width: auto !important;
            max-width: none !important;
            padding: 14px;
          }
          .mylearna-guided-start-target {
            transition: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mylearna-guided-start-target {
            transition: none;
          }
        }
      `}</style>
      {targetRect && activeVisible ? (
        <div
          className="mylearna-guided-start-target"
          aria-hidden="true"
          style={{ top: targetRect.top - 8, left: targetRect.left - 8, width: targetRect.width + 16, height: targetRect.height + 16 }}
        />
      ) : null}
      <section
        className="mylearna-guided-start-callout"
        role="dialog"
        aria-modal="false"
        aria-labelledby="guided-start-title"
        aria-describedby="guided-start-body"
        style={calloutPosition}
      >
        <div aria-live="polite" style={{ color: "#6c4df6", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Guided Start · Family setup
        </div>
        <div style={{ display: "grid", gap: 5 }}>
          <div aria-live="polite" style={{ color: "#64748b", fontSize: 12, fontWeight: 800 }}>{stepLabel}</div>
          <h2 id="guided-start-title" style={{ margin: 0, fontSize: 21, lineHeight: 1.25 }}>
            {welcomeVisible ? "Let’s set up MyLearna together" : completionVisible ? "Family setup complete" : visibleStep?.title}
          </h2>
          <p id="guided-start-body" style={{ margin: 0, color: "#475569", lineHeight: 1.55 }}>
            {welcomeVisible
              ? "I’ll guide you one step at a time. You can pause whenever you need."
              : completionVisible
                ? "Your family space is ready. Next, we’ll set up how you plan and record learning."
                : visibleStep?.body}
          </p>
        </div>
        {welcomeVisible ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="button" onClick={start} style={{ minHeight: 48, border: 0, borderRadius: 12, background: "#6c4df6", color: "#ffffff", padding: "11px 16px", fontWeight: 850 }}>
              Start guided setup
            </button>
            <button type="button" onClick={pause} style={{ border: "1px solid #d8ccff", borderRadius: 12, background: "#ffffff", color: "#17204b", padding: "10px 14px", fontWeight: 800 }}>
              Not now
            </button>
          </div>
        ) : completionVisible ? (
          <Link href="/my-settings" onClick={() => setCompletionNotice(false)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 12, background: "#6c4df6", color: "#ffffff", textDecoration: "none", padding: "11px 16px", fontWeight: 850 }}>
            Continue with My Settings
          </Link>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "#6b5acb", fontSize: 13, fontWeight: 800 }}>Complete the highlighted step to continue.</div>
            <button type="button" onClick={pause} style={{ justifySelf: "start", border: "1px solid #d8ccff", borderRadius: 12, background: "#ffffff", color: "#17204b", padding: "10px 14px", fontWeight: 800 }}>
              Not now
            </button>
          </div>
        )}
        {state?.status === "paused" ? (
          <button type="button" onClick={resume} style={{ border: "none", background: "transparent", color: "#6c4df6", fontWeight: 800, justifySelf: "start" }}>
            Continue where you left off
          </button>
        ) : null}
      </section>
    </>
  );
}

export default GuidedStartFamilySetup;
