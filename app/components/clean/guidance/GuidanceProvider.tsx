"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { GuidanceTourId } from "@/app/components/clean/guidance/guidanceTours";
import {
  CURRENT_SETUP_STEP_KEY,
  SETUP_STATUS_KEY,
  getNextSetupStep,
} from "@/lib/clean/setup/setupFlow";

const GUIDANCE_ENABLED_KEY = "mylearna.guidance.enabled";
const WELCOME_SEEN_KEY = "mylearna.guidance.welcomeSeen";
const LEGACY_WELCOME_COMPLETED_KEY = "mylearna.guidance.welcomeTourCompleted";
const COMPLETED_TOURS_KEY = "mylearna.guidance.completedTours";
const DISMISSED_TIPS_KEY = "mylearna.guidance.dismissedTips";
const SETUP_CHECKLIST_KEY = "mylearna.guidance.setupChecklist";
const PENDING_TOUR_KEY = "mylearna.guidance.pendingTour";
const SETUP_ACTIVE_KEY = "mylearna.guidance.setupActive";

type SetupStatus = "not_started" | "active" | "skipped" | "completed";

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
  setupStatus: SetupStatus;
  currentSetupStep: string;
  welcomeSeen: boolean;
  dismissTip: (tipId: string) => void;
  completeSetupStep: (stepId: string) => void;
  markTourCompleted: (tourId: string) => void;
  resetDismissedTips: () => void;
  resetSetupChecklist: () => void;
  restartGuidance: () => void;
  setGuidanceEnabled: (nextEnabled: boolean) => void;
  setCurrentSetupStep: (stepId: string) => void;
  setSetupActive: (active: boolean) => void;
  setSetupStatus: (status: SetupStatus) => void;
  skipWelcomeGuidance: () => void;
  skipSetupStep: (stepId: string) => void;
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

function readSetupStatus() {
  if (typeof window === "undefined") return "not_started" as SetupStatus;
  const value = window.localStorage.getItem(SETUP_STATUS_KEY);
  if (
    value === "not_started" ||
    value === "active" ||
    value === "skipped" ||
    value === "completed"
  ) {
    return value;
  }

  if (readBooleanStorage(SETUP_ACTIVE_KEY, false)) {
    return "active";
  }

  return "not_started";
}

function writeSetupStatus(status: SetupStatus) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETUP_STATUS_KEY, status);
  writeBooleanStorage(SETUP_ACTIVE_KEY, status === "active");
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
  const [setupStatus, setSetupStatusState] = useState<SetupStatus>("not_started");
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
      const storedSetupStatus = readSetupStatus();
      setSetupStatusState(storedSetupStatus);
      setSetupActiveState(storedSetupStatus === "active");
      setCurrentSetupStepState(window.localStorage.getItem(CURRENT_SETUP_STEP_KEY) || "profile");
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isGuidanceRoute]);

  useEffect(() => {
    if (!hydrated) return;
    const timeoutId = window.setTimeout(() => {
      if (!enabled || !isGuidanceRoute) {
        setShowWelcomePrompt(false);
        return;
      }
      if (setupStatus === "active") {
        setShowWelcomePrompt(false);
        return;
      }
      if (setupStatus !== "not_started") {
        setShowWelcomePrompt(false);
        return;
      }
      const profilePath = getCleanMyProfilePath(pathname);
      if (pathname !== profilePath) {
        setShowWelcomePrompt(false);
        return;
      }
      setShowWelcomePrompt(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [
    currentSetupStep,
    enabled,
    hydrated,
    isGuidanceRoute,
    pathname,
    router,
    setupStatus,
  ]);

  const setSetupActive = useCallback((active: boolean) => {
    setSetupActiveState(active);
    const nextStatus = active ? "active" : "skipped";
    setSetupStatusState(nextStatus);
    writeSetupStatus(nextStatus);
  }, []);

  const setSetupStatus = useCallback((status: SetupStatus) => {
    setSetupStatusState(status);
    setSetupActiveState(status === "active");
    writeSetupStatus(status);
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
  }, []);

  const completeSetupStep = useCallback((stepId: string) => {
    setSetupChecklist((current) => {
      const next = current.includes(stepId) ? current : [...current, stepId];
      writeStringArrayStorage(SETUP_CHECKLIST_KEY, next);
      return next;
    });

    const nextSetupItem = getNextSetupStep(stepId);
    if (nextSetupItem) {
      setCurrentSetupStep(nextSetupItem.id);
    } else {
      setCurrentSetupStep("outputs");
      setSetupStatus("completed");
    }
  }, [setCurrentSetupStep, setSetupStatus]);

  const skipSetupStep = useCallback(
    (stepId: string) => {
      completeSetupStep(stepId);
    },
    [completeSetupStep],
  );

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
    setSetupStatus("active");
    setCurrentSetupStep("profile");
  }, [setCurrentSetupStep, setSetupStatus]);

  const skipWelcomeGuidance = useCallback(() => {
    setWelcomeSeen(true);
    setShowWelcomePrompt(false);
    setSetupStatus("skipped");
    writeBooleanStorage(WELCOME_SEEN_KEY, true);
  }, [setSetupStatus]);

  const startWelcomeGuidance = useCallback(() => {
    setWelcomeSeen(true);
    setShowWelcomePrompt(false);
    writeBooleanStorage(WELCOME_SEEN_KEY, true);
    setSetupStatus("active");
    setCurrentSetupStep("profile");
    writePendingTour("my-profile");
    router.push(getCleanMyProfilePath(pathname));
  }, [pathname, router, setCurrentSetupStep, setSetupStatus]);

  const restartGuidance = useCallback(() => {
    setEnabled(true);
    writeBooleanStorage(GUIDANCE_ENABLED_KEY, true);
    setWelcomeSeen(true);
    writeBooleanStorage(WELCOME_SEEN_KEY, true);
    setCompletedTours([]);
    writeStringArrayStorage(COMPLETED_TOURS_KEY, []);
    setSetupChecklist([]);
    writeStringArrayStorage(SETUP_CHECKLIST_KEY, []);
    setSetupStatus("active");
    setCurrentSetupStep("profile");
    writePendingTour("my-profile");
    setShowWelcomePrompt(false);
    router.push(getCleanMyProfilePath(pathname));
  }, [pathname, router, setCurrentSetupStep, setSetupStatus]);

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
      completeSetupStep,
      currentSetupStep,
      dismissedTips,
      enabled,
      hydrated,
      isGuidanceRoute,
      showWelcomePrompt,
      setupActive,
      setupChecklist,
      setupStatus,
      welcomeSeen,
      dismissTip,
      markTourCompleted,
      resetDismissedTips,
      resetSetupChecklist,
      restartGuidance,
      setCurrentSetupStep,
      setSetupActive,
      setSetupStatus,
      setGuidanceEnabled,
      skipSetupStep,
      skipWelcomeGuidance,
      startWelcomeGuidance,
      toggleSetupStepComplete,
    }),
    [
      completedTours,
      completeSetupStep,
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
      setSetupStatus,
      setGuidanceEnabled,
      skipSetupStep,
      showWelcomePrompt,
      setupChecklist,
      setupActive,
      setupStatus,
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
