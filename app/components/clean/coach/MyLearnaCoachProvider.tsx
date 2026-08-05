"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import { trackCoachEvent } from "@/lib/clean/coach/coachAnalytics";
import { getCoachRecommendation } from "@/lib/clean/coach/coachEngine";
import {
  getCoachStorageKey,
  isCoachRecommendationSnoozed,
  readCoachPersistence,
  writeCoachPersistence,
  type CoachPersistenceState,
} from "@/lib/clean/coach/coachPersistence";
import type { CoachRecommendation, CoachState } from "@/lib/clean/coach/types";
import MyLearnaCoachCard from "./MyLearnaCoachCard";
import MyLearnaCoachPanel from "./MyLearnaCoachPanel";

export const COACH_OPEN_EVENT = "mylearna:coach-open";
export const COACH_REFRESH_EVENT = "mylearna:coach-refresh";

type CoachContextValue = {
  state: CoachState;
  recommendation: CoachRecommendation | null;
  visibleRecommendation: CoachRecommendation | null;
  panelOpen: boolean;
  openCoach: (supportMode?: "automatic" | "help") => void;
  closeCoach: () => void;
  snoozeRecommendation: () => void;
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
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUser();
  const workspace = useCleanFamilyWorkspace();
  const guidance = useGuidance();
  const storageKey = getCoachStorageKey(user?.id);
  const [persistence, setPersistence] = useState<CoachPersistenceState>({});
  const [persistenceKey, setPersistenceKey] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const previousRecommendationRef = useRef<string | null>(null);

  const state = useMemo(
    () => buildCoachState(pathname, Boolean(user) && !authLoading, workspace),
    [authLoading, pathname, user, workspace],
  );
  const recommendation = useMemo(() => getCoachRecommendation(state), [state]);
  const visibleRecommendation = recommendation && !isCoachRecommendationSnoozed(persistence, recommendation.id)
    ? recommendation
    : null;
  const focusedRoute = /\/my-pathways\/activity-player|\/practice\/|\/assessments\//.test(pathname);
  const automaticCardVisible = Boolean(
    visibleRecommendation &&
      !visibleRecommendation.mandatorySetup &&
      !guidance.guidedStartActive &&
      !focusedRoute &&
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const open = () => {
      setPanelOpen(true);
      trackCoachEvent("coach_opened", {
        recommendationId: recommendation?.id,
        recommendationCategory: recommendation?.category,
        route: pathname,
        supportMode: "help",
        hasMultipleLearners: state.hasMultipleLearners,
      });
    };
    const refresh = () => {
      void workspace.reload();
    };
    window.addEventListener(COACH_OPEN_EVENT, open);
    window.addEventListener(COACH_REFRESH_EVENT, refresh);
    window.addEventListener("edudecks:clean-evidence-changed", refresh);
    return () => {
      window.removeEventListener(COACH_OPEN_EVENT, open);
      window.removeEventListener(COACH_REFRESH_EVENT, refresh);
      window.removeEventListener("edudecks:clean-evidence-changed", refresh);
    };
  }, [pathname, recommendation, state.hasMultipleLearners, workspace]);

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

  const closeCoach = useCallback(() => setPanelOpen(false), []);

  const snoozeRecommendation = useCallback(() => {
    if (!recommendation) return;
    const next = {
      ...persistence,
      snoozedRecommendationId: recommendation.id,
      snoozedUntil: Date.now() + 4 * 60 * 60 * 1000,
    };
    updatePersistence(next);
    setPanelOpen(false);
    trackCoachEvent("coach_snoozed", {
      recommendationId: recommendation.id,
      recommendationCategory: recommendation.category,
      route: pathname,
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
    selectPrimaryAction,
  }), [closeCoach, openCoach, panelOpen, recommendation, selectPrimaryAction, snoozeRecommendation, state, visibleRecommendation]);

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
