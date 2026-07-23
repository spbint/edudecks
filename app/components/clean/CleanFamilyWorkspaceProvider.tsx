"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { loadCleanWorkspace } from "@/lib/clean/workspace/client";
import type { CleanWorkspaceState } from "@/lib/clean/workspace/types";
import { clearCleanPlanningCache } from "@/lib/clean/planning/cache";
import { beginCleanPlanningTiming } from "@/lib/clean/performance/planningTiming";
import {
  buildEmptyCleanSetupStatus,
  loadCleanSetupStatus,
} from "@/lib/clean/setup/setupStateClient";
import type { CleanSetupStatus } from "@/lib/clean/setup/setupStatus";

type CleanFamilyWorkspaceContextValue = CleanWorkspaceState & {
  loading: boolean;
  setupLoading: boolean;
  setupStatus: CleanSetupStatus;
  reload: () => Promise<void>;
};

const INITIAL_STATE: CleanWorkspaceState = {
  currentUserId: null,
  profile: null,
  membership: null,
  members: [],
  learners: [],
  requiresFamilyCreation: false,
  schemaMissing: false,
  error: null,
};

const INITIAL_SETUP_STATUS = buildEmptyCleanSetupStatus(INITIAL_STATE);

const CleanFamilyWorkspaceContext = createContext<CleanFamilyWorkspaceContextValue>({
  ...INITIAL_STATE,
  loading: true,
  setupLoading: true,
  setupStatus: INITIAL_SETUP_STATUS,
  reload: async () => undefined,
});

export default function CleanFamilyWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthUser();
  const [workspace, setWorkspace] = useState<CleanWorkspaceState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] =
    useState<CleanSetupStatus>(INITIAL_SETUP_STATUS);
  const [setupLoading, setSetupLoading] = useState(true);
  const hasLoadedWorkspaceRef = useRef(false);
  const requestGenerationRef = useRef(0);
  const reloadInFlightRef = useRef<Promise<void> | null>(null);
  const userIdRef = useRef<string | null>(user?.id ?? null);

  const reload = useCallback(async () => {
    if (reloadInFlightRef.current) return reloadInFlightRef.current;

    const generation = requestGenerationRef.current;
    const run = (async () => {
      if (!hasLoadedWorkspaceRef.current) setLoading(true);
      setSetupLoading(true);
      try {
        const workspaceTiming = beginCleanPlanningTiming({
          operation: "authenticated-family-workspace",
          criticality: "bootstrap-critical",
          gatesPage: true,
          requestKey: "family-workspace",
        });
        const nextWorkspace = await loadCleanWorkspace();
        workspaceTiming(nextWorkspace.error ? "error" : "success");
        if (generation !== requestGenerationRef.current) return;
        setWorkspace(nextWorkspace);
        hasLoadedWorkspaceRef.current = true;
        setLoading(false);
        if (
          nextWorkspace.schemaMissing ||
          nextWorkspace.error ||
          nextWorkspace.requiresFamilyCreation ||
          !nextWorkspace.profile
        ) {
          setSetupStatus(buildEmptyCleanSetupStatus(nextWorkspace));
          return;
        }
        const setupTiming = beginCleanPlanningTiming({
          operation: "setup-status-enrichment",
          criticality: "section-secondary",
          gatesPage: false,
          requestKey: "setup-status",
        });
        try {
          const nextSetupStatus = await loadCleanSetupStatus(nextWorkspace);
          setupTiming("success");
          if (generation === requestGenerationRef.current) {
            setSetupStatus(nextSetupStatus);
          }
        } catch (error) {
          setupTiming("error");
          if (generation === requestGenerationRef.current) {
            console.error("Clean setup status hydrate failed", error);
            setSetupStatus(buildEmptyCleanSetupStatus(nextWorkspace));
          }
        }
      } finally {
        if (generation === requestGenerationRef.current) {
          setSetupLoading(false);
          reloadInFlightRef.current = null;
        }
      }
    })();

    reloadInFlightRef.current = run;
    return run;
  }, []);

  useEffect(() => {
    const nextUserId = user?.id ?? null;
    if (userIdRef.current !== nextUserId) {
      requestGenerationRef.current += 1;
      reloadInFlightRef.current = null;
      clearCleanPlanningCache();
      hasLoadedWorkspaceRef.current = false;
      setWorkspace(INITIAL_STATE);
      setSetupStatus(INITIAL_SETUP_STATUS);
      setLoading(true);
      setSetupLoading(true);
      userIdRef.current = nextUserId;
    }
    void reload();
  }, [reload, user?.id]);

  const value = useMemo(
    () => ({
      ...workspace,
      loading,
      setupLoading,
      setupStatus,
      reload,
    }),
    [loading, reload, setupLoading, setupStatus, workspace],
  );

  return (
    <CleanFamilyWorkspaceContext.Provider value={value}>
      {children}
    </CleanFamilyWorkspaceContext.Provider>
  );
}

export function useCleanFamilyWorkspace() {
  return useContext(CleanFamilyWorkspaceContext);
}
