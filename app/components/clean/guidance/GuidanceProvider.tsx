"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { GuidanceTourId } from "@/app/components/clean/guidance/guidanceTours";

const GUIDANCE_ENABLED_KEY = "mylearna.guidance.enabled";
const WELCOME_SEEN_KEY = "mylearna.guidance.welcomeSeen";
const LEGACY_WELCOME_COMPLETED_KEY = "mylearna.guidance.welcomeTourCompleted";
const COMPLETED_TOURS_KEY = "mylearna.guidance.completedTours";
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
  completedTours: string[];
  dismissedTips: string[];
  enabled: boolean;
  hydrated: boolean;
  isGuidanceRoute: boolean;
  showWelcomePrompt: boolean;
  welcomeSeen: boolean;
  dismissTip: (tipId: string) => void;
  markTourCompleted: (tourId: string) => void;
  resetDismissedTips: () => void;
  restartGuidance: () => void;
  setGuidanceEnabled: (nextEnabled: boolean) => void;
  skipWelcomeGuidance: () => void;
  startWelcomeGuidance: () => void;
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

function getCleanMyDayPath(pathname: string) {
  return pathname.startsWith("/clean-my-") ? "/clean-my-day" : "/my-day";
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
      setShowWelcomePrompt(storedEnabled && !storedWelcomeSeen && isGuidanceRoute);
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
      setShowWelcomePrompt(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [enabled, hydrated, isGuidanceRoute, welcomeSeen]);

  const markTourCompleted = useCallback((tourId: string) => {
    setCompletedTours((current) => {
      if (current.includes(tourId)) return current;
      const next = [...current, tourId];
      writeStringArrayStorage(COMPLETED_TOURS_KEY, next);
      return next;
    });
  }, []);

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
  }, []);

  const skipWelcomeGuidance = useCallback(() => {
    setWelcomeSeen(true);
    setShowWelcomePrompt(false);
    writeBooleanStorage(WELCOME_SEEN_KEY, true);
  }, []);

  const startWelcomeGuidance = useCallback(() => {
    setWelcomeSeen(true);
    setShowWelcomePrompt(false);
    writeBooleanStorage(WELCOME_SEEN_KEY, true);
    router.push(getCleanMyDayPath(pathname));
  }, [pathname, router]);

  const restartGuidance = useCallback(() => {
    setEnabled(true);
    writeBooleanStorage(GUIDANCE_ENABLED_KEY, true);
    setWelcomeSeen(false);
    writeBooleanStorage(WELCOME_SEEN_KEY, false);
    setCompletedTours([]);
    writeStringArrayStorage(COMPLETED_TOURS_KEY, []);
    setShowWelcomePrompt(isGuidanceRoute);
  }, [isGuidanceRoute]);

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
      dismissedTips,
      enabled,
      hydrated,
      isGuidanceRoute,
      showWelcomePrompt,
      welcomeSeen,
      dismissTip,
      markTourCompleted,
      resetDismissedTips,
      restartGuidance,
      setGuidanceEnabled,
      skipWelcomeGuidance,
      startWelcomeGuidance,
    }),
    [
      completedTours,
      dismissedTips,
      dismissTip,
      enabled,
      hydrated,
      isGuidanceRoute,
      markTourCompleted,
      resetDismissedTips,
      restartGuidance,
      setGuidanceEnabled,
      showWelcomePrompt,
      skipWelcomeGuidance,
      startWelcomeGuidance,
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
