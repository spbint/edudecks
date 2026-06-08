"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { GuidanceTourId } from "@/app/components/clean/guidance/guidanceTours";

const GUIDANCE_ENABLED_KEY = "mylearna.guidance.enabled";
const WELCOME_SEEN_KEY = "mylearna.guidance.welcomeSeen";
const LEGACY_WELCOME_COMPLETED_KEY = "mylearna.guidance.welcomeTourCompleted";
const COMPLETED_TOURS_KEY = "mylearna.guidance.completedTours";
const DISMISSED_TIPS_KEY = "mylearna.guidance.dismissedTips";
const SETUP_CHECKLIST_KEY = "mylearna.guidance.setupChecklist";
const CURRENT_SETUP_STEP_KEY = "mylearna.guidance.currentSetupStep";
const PENDING_TOUR_KEY = "mylearna.guidance.pendingTour";
const SETUP_ACTIVE_KEY = "mylearna.guidance.setupActive";

const SETUP_SEQUENCE = [
  { id: "profile", tourId: "my-profile" },
  { id: "settings", tourId: "my-settings" },
  { id: "calendar", tourId: "my-calendar" },
  { id: "day", tourId: "my-day" },
  { id: "pathways", tourId: "my-pathways" },
  { id: "capture", tourId: "my-capture" },
  { id: "portfolio", tourId: "my-portfolio" },
  { id: "reports", tourId: "my-reports" },
  { id: "outputs", tourId: "my-outputs" },
] as const satisfies Array<{ id: string; tourId: GuidanceTourId }>;

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
  completedTours: string[];
  dismissedTips: string[];
  enabled: boolean;
  hydrated: boolean;
  isGuidanceRoute: boolean;
  showWelcomePrompt: boolean;
  setupChecklist: string[];
  setupActive: boolean;
  currentSetupStep: string;
  welcomeSeen: boolean;
  dismissTip: (tipId: string) => void;
  markTourCompleted: (tourId: string) => void;
  resetDismissedTips: () => void;
  resetSetupChecklist: () => void;
  restartGuidance: () => void;
  setGuidanceEnabled: (nextEnabled: boolean) => void;
  setCurrentSetupStep: (stepId: string) => void;
  setSetupActive: (active: boolean) => void;
  skipWelcomeGuidance: () => void;
  startWelcomeGuidance: () => void;
  toggleSetupStepComplete: (stepId: string) => void;
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

function readStringArrayStorage(key: string) {
  if (typeof window === "undefined") return [];
  const value = window.localStorage.getItem(key);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeStringArrayStorage(key: string, values: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(values));
}

function matchesGuidanceRoute(pathname: string) {
  return GUIDANCE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getCleanMyProfilePath(pathname: string) {
  return pathname.startsWith("/clean-my-") ? "/clean-my-profile" : "/my-profile";
}

function writePendingTour(tourId: GuidanceTourId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_TOUR_KEY, tourId);
}

export function GuidanceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const isGuidanceRoute = matchesGuidanceRoute(pathname);
  const [hydrated, setHydrated] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [welcomeSeen, setWelcomeSeen] = useState(false);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [setupChecklist, setSetupChecklist] = useState<string[]>([]);
  const [setupActive, setSetupActiveState] = useState(false);
  const [currentSetupStep, setCurrentSetupStepState] = useState("profile");
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedEnabled = readBooleanStorage(GUIDANCE_ENABLED_KEY, true);
      const storedWelcomeSeen =
        readBooleanStorage(WELCOME_SEEN_KEY, false) ||
        readBooleanStorage(LEGACY_WELCOME_COMPLETED_KEY, false);
      setEnabled(storedEnabled);
      setWelcomeSeen(storedWelcomeSeen);
      setCompletedTours(readStringArrayStorage(COMPLETED_TOURS_KEY));
      setDismissedTips(readStringArrayStorage(DISMISSED_TIPS_KEY));
      setSetupChecklist(readStringArrayStorage(SETUP_CHECKLIST_KEY));
      setSetupActiveState(readBooleanStorage(SETUP_ACTIVE_KEY, false));
      setCurrentSetupStepState(window.localStorage.getItem(CURRENT_SETUP_STEP_KEY) || "profile");
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isGuidanceRoute]);

  useEffect(() => {
    if (!hydrated) return;
    const timeoutId = window.setTimeout(() => {
      if (!enabled || !isGuidanceRoute || welcomeSeen) {
        setShowWelcomePrompt(false);
        return;
      }
      const profilePath = getCleanMyProfilePath(pathname);
      if (pathname !== profilePath) {
        setShowWelcomePrompt(false);
        router.replace(profilePath);
        return;
      }
      setShowWelcomePrompt(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [enabled, hydrated, isGuidanceRoute, pathname, router, welcomeSeen]);

  const setSetupActive = useCallback((active: boolean) => {
    setSetupActiveState(active);
    writeBooleanStorage(SETUP_ACTIVE_KEY, active);
  }, []);

  const setCurrentSetupStep = useCallback((stepId: string) => {
    setCurrentSetupStepState(stepId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CURRENT_SETUP_STEP_KEY, stepId);
    }
  }, []);

  const markTourCompleted = useCallback((tourId: string) => {
    setCompletedTours((current) => {
      if (current.includes(tourId)) return current;
      const next = [...current, tourId];
      writeStringArrayStorage(COMPLETED_TOURS_KEY, next);
      return next;
    });

    const setupIndex = SETUP_SEQUENCE.findIndex((item) => item.tourId === tourId);
    if (setupIndex === -1) return;

    const setupId = SETUP_SEQUENCE[setupIndex].id;
    const nextSetupItem = SETUP_SEQUENCE[setupIndex + 1];

    setSetupChecklist((current) => {
      const next = current.includes(setupId) ? current : [...current, setupId];
      writeStringArrayStorage(SETUP_CHECKLIST_KEY, next);
      return next;
    });

    if (nextSetupItem) {
      setCurrentSetupStep(nextSetupItem.id);
    } else {
      setCurrentSetupStep("outputs");
      setSetupActive(false);
    }
  }, [setCurrentSetupStep, setSetupActive]);

  const toggleSetupStepComplete = useCallback(
    (stepId: string) => {
      setSetupChecklist((current) => {
        const next = current.includes(stepId)
          ? current.filter((item) => item !== stepId)
          : [...current, stepId];
        writeStringArrayStorage(SETUP_CHECKLIST_KEY, next);
        return next;
      });
      setCurrentSetupStep(stepId);
    },
    [setCurrentSetupStep],
  );

  const dismissTip = useCallback((tipId: string) => {
    setDismissedTips((current) => {
      if (current.includes(tipId)) return current;
      const next = [...current, tipId];
      writeStringArrayStorage(DISMISSED_TIPS_KEY, next);
      return next;
    });
  }, []);

  const resetDismissedTips = useCallback(() => {
    setDismissedTips([]);
    writeStringArrayStorage(DISMISSED_TIPS_KEY, []);
    setCompletedTours([]);
    writeStringArrayStorage(COMPLETED_TOURS_KEY, []);
  }, []);

  const resetSetupChecklist = useCallback(() => {
    setSetupChecklist([]);
    writeStringArrayStorage(SETUP_CHECKLIST_KEY, []);
    setCompletedTours([]);
    writeStringArrayStorage(COMPLETED_TOURS_KEY, []);
    setSetupActive(true);
    setCurrentSetupStep("profile");
  }, [setCurrentSetupStep, setSetupActive]);

  const skipWelcomeGuidance = useCallback(() => {
    setWelcomeSeen(true);
    setShowWelcomePrompt(false);
    setSetupActive(false);
    writeBooleanStorage(WELCOME_SEEN_KEY, true);
  }, [setSetupActive]);

  const startWelcomeGuidance = useCallback(() => {
    setWelcomeSeen(true);
    setShowWelcomePrompt(false);
    writeBooleanStorage(WELCOME_SEEN_KEY, true);
    setSetupActive(true);
    setCurrentSetupStep("profile");
    writePendingTour("my-profile");
    router.push(getCleanMyProfilePath(pathname));
  }, [pathname, router, setCurrentSetupStep, setSetupActive]);

  const restartGuidance = useCallback(() => {
    setEnabled(true);
    writeBooleanStorage(GUIDANCE_ENABLED_KEY, true);
    setWelcomeSeen(true);
    writeBooleanStorage(WELCOME_SEEN_KEY, true);
    setCompletedTours([]);
    writeStringArrayStorage(COMPLETED_TOURS_KEY, []);
    setSetupChecklist([]);
    writeStringArrayStorage(SETUP_CHECKLIST_KEY, []);
    setSetupActive(true);
    setCurrentSetupStep("profile");
    writePendingTour("my-profile");
    setShowWelcomePrompt(false);
    router.push(getCleanMyProfilePath(pathname));
  }, [pathname, router, setCurrentSetupStep, setSetupActive]);

  const setGuidanceEnabled = useCallback(
    (nextEnabled: boolean) => {
      setEnabled(nextEnabled);
      writeBooleanStorage(GUIDANCE_ENABLED_KEY, nextEnabled);
      setShowWelcomePrompt(nextEnabled && isGuidanceRoute && !welcomeSeen);
    },
    [isGuidanceRoute, welcomeSeen],
  );

  const value = useMemo<GuidanceContextValue>(
    () => ({
      completedTours,
      currentSetupStep,
      dismissedTips,
      enabled,
      hydrated,
      isGuidanceRoute,
      showWelcomePrompt,
      setupActive,
      setupChecklist,
      welcomeSeen,
      dismissTip,
      markTourCompleted,
      resetDismissedTips,
      resetSetupChecklist,
      restartGuidance,
      setCurrentSetupStep,
      setSetupActive,
      setGuidanceEnabled,
      skipWelcomeGuidance,
      startWelcomeGuidance,
      toggleSetupStepComplete,
    }),
    [
      completedTours,
      currentSetupStep,
      dismissedTips,
      dismissTip,
      enabled,
      hydrated,
      isGuidanceRoute,
      markTourCompleted,
      resetDismissedTips,
      resetSetupChecklist,
      restartGuidance,
      setCurrentSetupStep,
      setSetupActive,
      setGuidanceEnabled,
      showWelcomePrompt,
      setupChecklist,
      setupActive,
      skipWelcomeGuidance,
      startWelcomeGuidance,
      toggleSetupStepComplete,
      welcomeSeen,
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

export type { GuidanceTourId };
