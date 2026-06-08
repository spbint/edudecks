"use client";

import { usePathname } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getWelcomeTourStepIndexForAnchor,
  WELCOME_TOUR_ID,
  WELCOME_TOUR_STEPS,
  type GuidanceTourStep,
} from "@/app/components/clean/guidance/guidanceTours";

const GUIDANCE_ENABLED_KEY = "mylearna.guidance.enabled";
const WELCOME_TOUR_COMPLETED_KEY = "mylearna.guidance.welcomeTourCompleted";
const DISMISSED_TIPS_KEY = "mylearna.guidance.dismissedTips";

const GUIDANCE_ROUTE_PREFIXES = [
  "/my-profile",
  "/my-settings",
  "/my-calendar",
  "/my-day",
  "/my-pathways",
  "/my-capture",
  "/my-portfolio",
  "/my-reports",
  "/my-outputs",
  "/clean-my-profile",
  "/clean-my-settings",
  "/clean-my-calendar",
  "/clean-my-day",
  "/clean-my-pathways",
  "/clean-my-capture",
  "/clean-my-portfolio",
  "/clean-my-reports",
  "/clean-my-outputs",
];

type GuidanceContextValue = {
  activeStep: GuidanceTourStep | null;
  activeStepIndex: number;
  dismissedTips: string[];
  enabled: boolean;
  hydrated: boolean;
  isGuidanceRoute: boolean;
  showWelcomePrompt: boolean;
  welcomeTourCompleted: boolean;
  dismissTip: (tipId: string) => void;
  finishWelcomeTour: () => void;
  goToStep: (stepIndex: number) => void;
  resetDismissedTips: () => void;
  restartWelcomeTour: () => void;
  setGuidanceEnabled: (nextEnabled: boolean) => void;
  skipWelcomeTour: () => void;
  startWelcomeTour: (anchorId?: string) => void;
};

const GuidanceContext = createContext<GuidanceContextValue | null>(null);

function readBooleanStorage(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (value === null) return fallback;
  return value === "true";
}

function writeBooleanStorage(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value ? "true" : "false");
}

function readDismissedTips() {
  if (typeof window === "undefined") return [];
  const value = window.localStorage.getItem(DISMISSED_TIPS_KEY);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeDismissedTips(tipIds: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISSED_TIPS_KEY, JSON.stringify(tipIds));
}

function matchesGuidanceRoute(pathname: string) {
  return GUIDANCE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function GuidanceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isGuidanceRoute = matchesGuidanceRoute(pathname);
  const [hydrated, setHydrated] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [welcomeTourCompleted, setWelcomeTourCompleted] = useState(false);
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedEnabled = readBooleanStorage(GUIDANCE_ENABLED_KEY, true);
      const storedCompleted = readBooleanStorage(WELCOME_TOUR_COMPLETED_KEY, false);
      setEnabled(storedEnabled);
      setWelcomeTourCompleted(storedCompleted);
      setDismissedTips(readDismissedTips());
      setShowWelcomePrompt(storedEnabled && !storedCompleted && isGuidanceRoute);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isGuidanceRoute]);

  useEffect(() => {
    if (!hydrated) return;
    const timeoutId = window.setTimeout(() => {
      if (!isGuidanceRoute) {
        setShowWelcomePrompt(false);
        setActiveTourId(null);
        return;
      }
      if (!enabled) {
        setShowWelcomePrompt(false);
        setActiveTourId(null);
        return;
      }
      if (!welcomeTourCompleted && !activeTourId) {
        setShowWelcomePrompt(true);
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [activeTourId, enabled, hydrated, isGuidanceRoute, welcomeTourCompleted]);

  const startWelcomeTour = useCallback(
    (anchorId?: string) => {
      if (!isGuidanceRoute) return;
      const stepIndex = anchorId ? getWelcomeTourStepIndexForAnchor(anchorId) : 0;
      setShowWelcomePrompt(false);
      setActiveStepIndex(stepIndex);
      setActiveTourId(WELCOME_TOUR_ID);
    },
    [isGuidanceRoute],
  );

  const skipWelcomeTour = useCallback(() => {
    setActiveTourId(null);
    setShowWelcomePrompt(false);
    setWelcomeTourCompleted(true);
    writeBooleanStorage(WELCOME_TOUR_COMPLETED_KEY, true);
  }, []);

  const finishWelcomeTour = useCallback(() => {
    setActiveTourId(null);
    setShowWelcomePrompt(false);
    setWelcomeTourCompleted(true);
    writeBooleanStorage(WELCOME_TOUR_COMPLETED_KEY, true);
  }, []);

  const restartWelcomeTour = useCallback(() => {
    setWelcomeTourCompleted(false);
    writeBooleanStorage(WELCOME_TOUR_COMPLETED_KEY, false);
    setEnabled(true);
    writeBooleanStorage(GUIDANCE_ENABLED_KEY, true);
    setShowWelcomePrompt(false);
    setActiveStepIndex(0);
    setActiveTourId(WELCOME_TOUR_ID);
  }, []);

  const setGuidanceEnabled = useCallback(
    (nextEnabled: boolean) => {
      setEnabled(nextEnabled);
      writeBooleanStorage(GUIDANCE_ENABLED_KEY, nextEnabled);
      if (!nextEnabled) {
        setShowWelcomePrompt(false);
        setActiveTourId(null);
      } else if (isGuidanceRoute && !welcomeTourCompleted) {
        setShowWelcomePrompt(true);
      }
    },
    [isGuidanceRoute, welcomeTourCompleted],
  );

  const goToStep = useCallback((stepIndex: number) => {
    const boundedIndex = Math.min(Math.max(stepIndex, 0), WELCOME_TOUR_STEPS.length - 1);
    setActiveStepIndex(boundedIndex);
  }, []);

  const dismissTip = useCallback((tipId: string) => {
    setDismissedTips((current) => {
      if (current.includes(tipId)) return current;
      const next = [...current, tipId];
      writeDismissedTips(next);
      return next;
    });
  }, []);

  const resetDismissedTips = useCallback(() => {
    setDismissedTips([]);
    writeDismissedTips([]);
  }, []);

  const activeStep =
    activeTourId === WELCOME_TOUR_ID ? WELCOME_TOUR_STEPS[activeStepIndex] ?? null : null;

  const value = useMemo<GuidanceContextValue>(
    () => ({
      activeStep,
      activeStepIndex,
      dismissedTips,
      enabled,
      hydrated,
      isGuidanceRoute,
      showWelcomePrompt,
      welcomeTourCompleted,
      dismissTip,
      finishWelcomeTour,
      goToStep,
      resetDismissedTips,
      restartWelcomeTour,
      setGuidanceEnabled,
      skipWelcomeTour,
      startWelcomeTour,
    }),
    [
      activeStep,
      activeStepIndex,
      dismissedTips,
      dismissTip,
      enabled,
      finishWelcomeTour,
      goToStep,
      hydrated,
      isGuidanceRoute,
      resetDismissedTips,
      restartWelcomeTour,
      setGuidanceEnabled,
      showWelcomePrompt,
      skipWelcomeTour,
      startWelcomeTour,
      welcomeTourCompleted,
    ],
  );

  return <GuidanceContext.Provider value={value}>{children}</GuidanceContext.Provider>;
}

export function useGuidance() {
  const context = useContext(GuidanceContext);
  if (!context) {
    throw new Error("useGuidance must be used inside GuidanceProvider");
  }
  return context;
}
