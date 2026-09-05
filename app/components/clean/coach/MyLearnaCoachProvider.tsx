"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { useMobileCompanion } from "@/app/components/clean/design-v2/useMobileCompanion";
import { GUIDANCE_DISABLED_EVENT, useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import { GUIDANCE_SURFACE_EVENT } from "@/app/components/clean/guidance/guidanceRuntime";
import { trackCoachEvent } from "@/lib/clean/coach/coachAnalytics";
import { getCoachRecommendation } from "@/lib/clean/coach/coachEngine";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";
import {
  COACH_REFRESH_EVENT as COACH_STATE_REFRESH_EVENT,
  requestCoachStateRefresh,
  subscribeToCoachStateRefresh,
  type CoachRefreshDetail,
} from "@/lib/clean/coach/coachRefresh";
import { shouldShowAutomaticCoachCard } from "@/lib/clean/coach/coachVisibility";
import {
  getCoachStorageKey,
  isCoachRecommendationDismissed,
  isCoachRecommendationSnoozed,
  readCoachPersistence,
  writeCoachPersistence,
  type CoachPersistenceState,
} from "@/lib/clean/coach/coachPersistence";
import type { CoachRecommendation, CoachState } from "@/lib/clean/coach/types";
import MyLearnaCoachCard from "./MyLearnaCoachCard";
import MyLearnaCoachPanel from "./MyLearnaCoachPanel";

export const COACH_OPEN_EVENT = "mylearna:coach-open";
export const COACH_REFRESH_EVENT = COACH_STATE_REFRESH_EVENT;

type CoachContextValue = {
  state: CoachState;
  recommendation: CoachRecommendation | null;
  visibleRecommendation: CoachRecommendation | null;
  panelOpen: boolean;
  openCoach: (supportMode?: "automatic" | "help") => void;
  closeCoach: () => void;
  snoozeRecommendation: () => void;
  dismissRecommendation: () => void;
  selectPrimaryAction: () => void;
};

const CoachContext = createContext<CoachContextValue | null>(null);

function getDisplayName(learner: { firstName?: string | null; preferredName?: string | null }) {
  return String(learner.preferredName || learner.firstName || "").trim();
}

function buildCoachState(
  pathname: string,
  userResolved: boolean,
  workspace: ReturnType<typeof useCleanFamilyWorkspace>,
): CoachState {
  const setup = workspace.setupStatus;
  return {
    authenticated: userResolved,
    workspaceResolved: !workspace.loading,
    setupResolved: !workspace.setupLoading,
    workspaceError: Boolean(workspace.error),
    schemaMissing: workspace.schemaMissing,
    route: pathname,
    hasFamilyProfile: setup.hasFamilyProfile,
    hasLearner: setup.hasLearner,
    hasLearningSettings: setup.hasLearningSettings,
    hasLearningYear: setup.hasLearningYear,
    hasTeachingPeriod: setup.hasTeachingPeriod,
    hasWeeklyBlock: setup.hasWeeklyBlock,
    hasPathway: setup.hasPathway,
    hasEvidence: setup.hasEvidence,
    hasPortfolioItem: setup.hasPortfolioItem,
    hasReport: setup.hasReport,
    learners: workspace.learners.map((learner) => ({
      id: learner.id,
      displayName: getDisplayName(learner),
    })),
    activeLearnerId: setup.activeLearnerId,
    activeLearnerName: setup.activeLearner ? getDisplayName(setup.activeLearner) : null,
    hasMultipleLearners: workspace.learners.length > 1,
  };
}

export function MyLearnaCoachProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const mobileCompanion = useMobileCompanion();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUser();
  const workspace = useCleanFamilyWorkspace();
  const reloadWorkspace = workspace.reload;
  const guidance = useGuidance();
  const storageKey = getCoachStorageKey(user?.id);
  const [persistence, setPersistence] = useState<CoachPersistenceState>({});
  const [persistenceKey, setPersistenceKey] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSupportMode, setPanelSupportMode] = useState<"automatic" | "help">("help");
  const [staticTourActive, setStaticTourActive] = useState(false);
  const [stateRefreshing, setStateRefreshing] = useState(false);
  const previousRecommendationRef = useRef<string | null>(null);
  const previousMajorRouteRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const lastRefreshAtRef = useRef(0);

  const state = useMemo(
    () => buildCoachState(pathname, Boolean(user) && !authLoading, workspace),
    [authLoading, pathname, user, workspace],
  );
  const recommendation = useMemo(() => getCoachRecommendation(state), [state]);
  const visibleRecommendation = recommendation && !isCoachRecommendationSnoozed(persistence, recommendation.id)
    ? recommendation
    : null;
  const automaticRecommendation = visibleRecommendation &&
    !isCoachRecommendationDismissed(persistence, visibleRecommendation.id)
    ? visibleRecommendation
    : null;
  const persistenceResolved = storageKey === null || persistenceKey === storageKey;
  const focusedRoute = /\/my-pathways\/activity-player|\/practice\/|\/assessments\//.test(pathname);
  const automaticCardVisible = Boolean(
      automaticRecommendation &&
      !mobileCompanion &&
      persistenceResolved &&
      !panelOpen &&
      !staticTourActive &&
      shouldShowAutomaticCoachCard({
        recommendation: visibleRecommendation,
        guidanceEnabled: guidance.enabled,
        guidedStartVisible: guidance.guidedStartActive,
        guidanceSetupStatus: guidance.setupStatus,
        route: pathname,
        focusedRoute,
        stateRefreshing: stateRefreshing || workspace.loading || workspace.setupLoading,
      }) &&
      pathname !== "/my-capture",
  );

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey || persistenceKey === storageKey) return;
    const nextPersistence = readCoachPersistence(window.localStorage, storageKey);
    queueMicrotask(() => {
      setPersistence(nextPersistence);
      setPersistenceKey(storageKey);
      setPanelOpen(false);
    });
  }, [persistenceKey, storageKey]);

  const scheduleRefresh = useCallback((detail: CoachRefreshDetail) => {
    if (detail.refreshAlreadyApplied) {
      if (refreshTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      lastRefreshAtRef.current = Date.now();
      setStateRefreshing(false);
      trackProductEvent("coach_state_refresh_completed", {
        source: detail.source,
        route: pathname,
        stateChanged: true,
      });
      return;
    }

    if (typeof window === "undefined") return;
    setStateRefreshing(true);
    if (panelSupportMode === "automatic") {
      setPanelOpen(false);
      setPanelSupportMode("help");
    }
    if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      trackProductEvent("coach_state_refresh_requested", { source: detail.source, route: pathname });
      void reloadWorkspace()
        .then(() => {
          lastRefreshAtRef.current = Date.now();
          trackProductEvent("coach_state_refresh_completed", {
            source: detail.source,
            route: pathname,
            stateChanged: true,
          });
        })
        .catch(() => {
          trackProductEvent("coach_state_refresh_failed", { source: detail.source, route: pathname });
        })
        .finally(() => {
          setStateRefreshing(false);
        });
    }, 50);
  }, [panelSupportMode, pathname, reloadWorkspace]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const open = () => {
      if (guidance.guidedStartActive) return;
      setPanelOpen(true);
      setPanelSupportMode("help");
      trackCoachEvent("coach_opened", {
        recommendationId: recommendation?.id,
        recommendationCategory: recommendation?.category,
        route: pathname,
        supportMode: "help",
        hasMultipleLearners: state.hasMultipleLearners,
      });
    };
    window.addEventListener(COACH_OPEN_EVENT, open);
    const unsubscribe = subscribeToCoachStateRefresh(scheduleRefresh);
    return () => {
      window.removeEventListener(COACH_OPEN_EVENT, open);
      unsubscribe();
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
    };
  }, [guidance.guidedStartActive, pathname, recommendation, scheduleRefresh, state.hasMultipleLearners]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleGuidanceSurface = (event: Event) => {
      const active = Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active);
      setStaticTourActive(active);
      if (active) {
        setPanelOpen(false);
        setPanelSupportMode("help");
      }
    };
    window.addEventListener(GUIDANCE_SURFACE_EVENT, handleGuidanceSurface);
    return () => window.removeEventListener(GUIDANCE_SURFACE_EVENT, handleGuidanceSurface);
  }, []);

  useEffect(() => {
    const majorRoute = /^\/(my-profile|my-settings|my-calendar|my-day|my-pathways|my-capture|my-portfolio|my-reports)(?:\/|$)/.exec(pathname)?.[1] ?? null;
    if (previousMajorRouteRef.current === majorRoute) return;
    const previousRoute = previousMajorRouteRef.current;
    previousMajorRouteRef.current = majorRoute;
    if (!majorRoute || (!previousRoute && workspace.loading)) return;
    if (Date.now() - lastRefreshAtRef.current < 250) return;
    requestCoachStateRefresh("route-revalidation");
  }, [pathname, workspace.loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleGuidanceDisabled = () => {
      if (panelSupportMode !== "automatic") return;
      setPanelOpen(false);
      trackProductEvent("coach_guidance_disabled", { route: pathname, source: "guidance-toggle" });
    };
    window.addEventListener(GUIDANCE_DISABLED_EVENT, handleGuidanceDisabled);
    return () => window.removeEventListener(GUIDANCE_DISABLED_EVENT, handleGuidanceDisabled);
  }, [panelSupportMode, pathname]);

  useEffect(() => {
    if (!recommendation) {
      if (previousRecommendationRef.current) {
        trackCoachEvent("coach_no_recommendation", { route: pathname });
      }
      previousRecommendationRef.current = null;
      return;
    }
    if (previousRecommendationRef.current && previousRecommendationRef.current !== recommendation.id) {
      trackCoachEvent("coach_recommendation_completed", {
        recommendationId: previousRecommendationRef.current,
        route: pathname,
        completionSource: "real-state-change",
      });
    }
    if (previousRecommendationRef.current !== recommendation.id) {
      trackCoachEvent("coach_recommendation_shown", {
        recommendationId: recommendation.id,
        recommendationCategory: recommendation.category,
        route: pathname,
        supportMode: "automatic",
        hasMultipleLearners: state.hasMultipleLearners,
      });
    }
    previousRecommendationRef.current = recommendation.id;
  }, [pathname, recommendation, state.hasMultipleLearners]);

  const updatePersistence = useCallback((next: CoachPersistenceState) => {
    setPersistence(next);
    if (typeof window !== "undefined") writeCoachPersistence(window.localStorage, storageKey, next);
  }, [storageKey]);

  const openCoach = useCallback((supportMode: "automatic" | "help" = "automatic") => {
    setPanelOpen(true);
    setPanelSupportMode(supportMode);
    if (persistence.snoozedRecommendationId === recommendation?.id) {
      trackCoachEvent("coach_resumed", {
        recommendationId: recommendation?.id,
        recommendationCategory: recommendation?.category,
        route: pathname,
        supportMode,
        hasMultipleLearners: state.hasMultipleLearners,
      });
    }
    trackCoachEvent("coach_opened", {
      recommendationId: recommendation?.id,
      recommendationCategory: recommendation?.category,
      route: pathname,
      supportMode,
      hasMultipleLearners: state.hasMultipleLearners,
    });
  }, [pathname, persistence.snoozedRecommendationId, recommendation, state.hasMultipleLearners]);

  const closeCoach = useCallback(() => {
    setPanelOpen(false);
    setPanelSupportMode("help");
  }, []);

  const snoozeRecommendation = useCallback(() => {
    if (!recommendation) return;
    const next = {
      ...persistence,
      snoozedRecommendationId: recommendation.id,
      snoozedUntil: Date.now() + 4 * 60 * 60 * 1000,
    };
    updatePersistence(next);
    setPanelOpen(false);
    setPanelSupportMode("help");
    trackCoachEvent("coach_snoozed", {
      recommendationId: recommendation.id,
      recommendationCategory: recommendation.category,
      route: pathname,
      hasMultipleLearners: state.hasMultipleLearners,
    });
  }, [pathname, persistence, recommendation, state.hasMultipleLearners, updatePersistence]);

  const dismissRecommendation = useCallback(() => {
    if (!recommendation) return;
    updatePersistence({
      ...persistence,
      dismissedRecommendationId: recommendation.id,
    });
    setPanelOpen(false);
    setPanelSupportMode("help");
    trackCoachEvent("coach_dismissed", {
      recommendationId: recommendation.id,
      recommendationCategory: recommendation.category,
      route: pathname,
      supportMode: "automatic",
      hasMultipleLearners: state.hasMultipleLearners,
    });
  }, [pathname, persistence, recommendation, state.hasMultipleLearners, updatePersistence]);

  const selectPrimaryAction = useCallback(() => {
    if (!recommendation) return;
    trackCoachEvent("coach_primary_action_selected", {
      recommendationId: recommendation.id,
      recommendationCategory: recommendation.category,
      route: pathname,
      hasMultipleLearners: state.hasMultipleLearners,
    });
    setPanelOpen(false);
    setPanelSupportMode("help");
    router.push(recommendation.primaryRoute);
  }, [pathname, recommendation, router, state.hasMultipleLearners]);

  const contextValue = useMemo<CoachContextValue>(() => ({
    state,
    recommendation,
    visibleRecommendation,
    panelOpen,
    openCoach,
    closeCoach,
    snoozeRecommendation,
    dismissRecommendation,
    selectPrimaryAction,
  }), [closeCoach, dismissRecommendation, openCoach, panelOpen, recommendation, selectPrimaryAction, snoozeRecommendation, state, visibleRecommendation]);

  return (
    <CoachContext.Provider value={contextValue}>
      {children}
      {automaticCardVisible ? <MyLearnaCoachCard /> : null}
      {panelOpen ? <MyLearnaCoachPanel /> : null}
    </CoachContext.Provider>
  );
}

export function useMyLearnaCoach() {
  const context = useContext(CoachContext);
  if (!context) throw new Error("useMyLearnaCoach must be used within MyLearnaCoachProvider");
  return context;
}
